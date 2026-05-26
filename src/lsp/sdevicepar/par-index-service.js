// src/lsp/sdevicepar/par-index-service.js
'use strict';

const path = require('path');
const fs = require('fs');
const { URL, fileURLToPath } = require('url');
const { parseParText } = require('./par-parser');
const { stackToPath, getContextAtPosition, detectScopeNameContext } = require('./par-context');
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH } = require('./par-constants');

/**
 * 创建 ParIndexService 实例。
 * @param {object} deps
 * @param {string} deps.extensionPath - 插件安装路径
 * @param {vscode.Uri[]} [deps.workspaceFolders] - workspace 根目录
 * @param {function} [deps.readFile] - 文件读取函数（可注入用于测试）
 */
function createParIndexService(deps) {
    const extensionPath = deps.extensionPath;
    const readFileFn = deps.readFile || ((p) => fs.readFileSync(p, 'utf8'));

    // currentFileCache: Map<"uri:v{version}", ParResolvedResult>
    const currentFileCache = new Map();

    // includeRawCache: Map<uri, ParParseResult>
    // Phase 2.1: resolved by resolveIncludes (Task 4)
    const includeRawCache = new Map();

    /**
     * 获取缓存键。
     */
    function cacheKey(uri, version) {
        return `${uri}:v${version}`;
    }

    /**
     * 解析当前文件并缓存结果。
     * @param {{ uri: { toString(): string }, version: number, getText(): string }} document
     * @returns {{ symbols: object[], includes: object[], lineContexts: object[] }}
     */
    function parseCurrentFile(document) {
        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (cached) return cached;

        const text = document.getText();
        const rawResult = parseParText(text, uri);

        // Phase 2.1: 只用当前文件的 symbols（include 在 Task 4 加入）
        const result = {
            symbols: rawResult.symbols,
            includes: rawResult.includes,
            lineContexts: rawResult.lineContexts,
            diagnostics: rawResult.diagnostics,
        };

        currentFileCache.set(key, result);

        // FIFO 淘汰
        if (currentFileCache.size > MAX_CACHE_SIZE) {
            const oldestKey = currentFileCache.keys().next().value;
            currentFileCache.delete(oldestKey);
        }

        return result;
    }

    /**
     * 获取光标位置的补全列表。热路径，0 文件 IO。
     * 缓存未就绪时返回空数组，由调用方 fallback 到 all_keywords。
     * @param {{ uri: { toString(): string }, version: number }} document
     * @param {{ line: number, character: number }} position
     * @returns {Array<{label: string, kind: string, detail: string, sortText: string, insertText: string, source: string, parentPath: string}>}
     */
    function getCompletionsAt(document, position) {
        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (!cached) return []; // 缓存未就绪 → fallback 到 all_keywords

        const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
        if (!ctx) return [];

        const items = [];

        if (ctx.completableKind === 'scopeType') {
            // 文件顶层 → 推荐所有 scope 类型
            for (const st of SCOPE_TYPES_ARRAY) {
                items.push({
                    label: st,
                    kind: 'scopeType',
                    detail: '[par] scope type',
                    sortText: '4_' + st,
                    insertText: st + ' = "$1" {\n\t$0\n}',
                    source: 'builtin',
                    parentPath: '',
                });
            }
        } else if (ctx.completableKind === 'block') {
            // scope 内 → 推荐已知 block（从 symbols 抽取）
            const blockNames = new Set();
            for (const sym of cached.symbols) {
                if (sym.kind === 'block' && sym.parentPath.startsWith(ctx.parentPath)) {
                    blockNames.add(sym.name);
                }
            }
            // 也从 include 结果中收集（Task 4 加入后生效）
            let idx = 0;
            for (const name of blockNames) {
                items.push({
                    label: name,
                    kind: 'block',
                    detail: `[par] block (${ctx.scopeType || 'scope'})`,
                    sortText: `0_${idx}_${name}`,
                    insertText: name + ' {\n\t$0\n}',
                    source: 'current',
                    parentPath: ctx.parentPath,
                });
                idx++;
            }
        } else if (ctx.completableKind === 'parameter') {
            // block 内 → 推荐已知 parameter（从 symbols 抽取）
            const seen = new Set();
            let idx = 0;
            for (const sym of cached.symbols) {
                if (sym.kind === 'parameter' && sym.parentPath === ctx.parentPath && !seen.has(sym.name)) {
                    seen.add(sym.name);
                    items.push({
                        label: sym.name,
                        kind: 'parameter',
                        detail: sym.value ? `[par] = ${sym.value}` : '[par] parameter',
                        sortText: `0_${idx}_${sym.name}`,
                        insertText: sym.name + ' = ',
                        source: sym.source || 'current',
                        parentPath: ctx.parentPath,
                    });
                    idx++;
                }
            }
        }
        // blockPending / null → 不补全，由调用方 fallback

        return items;
    }

    function onFileChanged(uri) {
        // 清除 include 缓存中该文件的 raw result（Task 4 完善）
    }

    function onFileClosed(uri) {
        // 清除该 uri 的所有缓存
        for (const key of currentFileCache.keys()) {
            if (key.startsWith(uri + ':')) {
                currentFileCache.delete(key);
            }
        }
        includeRawCache.delete(uri);
    }

    function dispose() {
        currentFileCache.clear();
        includeRawCache.clear();
    }

    return {
        parseCurrentFile,
        getCompletionsAt,
        onFileChanged,
        onFileClosed,
        dispose,
    };
}

module.exports = { createParIndexService };
