// src/lsp/sdevicepar/par-index-service.js
'use strict';

const path = require('path');
const fs = require('fs');
const { URL, fileURLToPath } = require('url');
const { parseParText } = require('./par-parser');
const { stackToPath, getContextAtPosition, detectScopeNameContext } = require('./par-context');
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH } = require('./par-constants');
const { buildParCompletions } = require('./par-completion');

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
     * 解析 include 文件路径。
     * 查找顺序：deps.resolveFilePath（测试注入）→ 当前文件目录 → workspace 根目录 → 插件 bundled MaterialDB
     * @param {string} refPath - include 引用路径
     * @param {string} baseUri - 当前文件 URI
     * @returns {string|null} 解析后的绝对路径，未找到返回 null
     */
    function resolveFilePath(refPath, baseUri) {
        // 优先使用 deps 中注入的函数（测试用）
        if (deps.resolveFilePath) return deps.resolveFilePath(refPath, baseUri);

        // 1. 当前文件所在目录
        try {
            const basePath = baseUri.startsWith('file://') ? fileURLToPath(baseUri) : baseUri;
            const baseDir = path.dirname(basePath);
            const candidate = path.resolve(baseDir, refPath);
            if (fs.existsSync(candidate)) return candidate;
        } catch (_) {}

        // 2. workspace 根目录
        for (const folder of (deps.workspaceFolders || [])) {
            try {
                const wsPath = folder.uri.fsPath || fileURLToPath(folder.uri.toString());
                const candidate = path.resolve(wsPath, refPath);
                if (fs.existsSync(candidate)) return candidate;
            } catch (_) {}
        }

        // 3. 插件内置 references/MaterialDB/
        try {
            const bundled = path.join(extensionPath, 'references', 'MaterialDB', refPath);
            if (fs.existsSync(bundled)) return bundled;
        } catch (_) {}

        return null;
    }

    /**
     * 递归解析 include 引用，嫁接 symbols 到父级路径。
     * @param {Array<{path: string, parentPath: string}>} includes - 当前文件的 include 列表
     * @param {string} baseUri - 当前文件 URI
     * @param {string} outerPrefix - 外层嫁接前缀（由上层 include 传递）
     * @param {string[]} includeChain - 当前递归链（用于循环检测）
     * @param {number} depth - 当前递归深度
     * @returns {object[]} 嫁接后的 symbols 数组
     */
    function resolveIncludes(includes, baseUri, outerPrefix, includeChain, depth) {
        const result = [];
        for (const ref of includes) {
            if (depth >= MAX_INCLUDE_DEPTH) break;

            const resolvedPath = resolveFilePath(ref.path, baseUri);
            if (!resolvedPath) continue;

            // 递归链检测：只在当前链中出现才算循环（允许不同链引用同一文件）
            if (includeChain.includes(resolvedPath)) continue;

            // 获取或解析 raw result
            let rawResult = includeRawCache.get(resolvedPath);
            if (!rawResult) {
                try {
                    const text = readFileFn(resolvedPath);
                    rawResult = parseParText(text, resolvedPath);
                    includeRawCache.set(resolvedPath, rawResult);
                    // FIFO eviction
                    if (includeRawCache.size > MAX_CACHE_SIZE) {
                        includeRawCache.delete(includeRawCache.keys().next().value);
                    }
                } catch (e) {
                    continue; // file not found → skip
                }
            }

            // Graft: 将 raw symbols 的 parentPath 替换为 graftBase + raw parentPath
            const graftBase = (outerPrefix && ref.parentPath)
                ? outerPrefix + '/' + ref.parentPath
                : (outerPrefix || ref.parentPath || '');

            const newChain = [...includeChain, resolvedPath];

            for (const sym of rawResult.symbols) {
                const newParentPath = graftBase
                    ? (sym.parentPath ? graftBase + '/' + sym.parentPath : graftBase)
                    : sym.parentPath;
                result.push({
                    ...sym,
                    parentPath: newParentPath,
                    fullPath: newParentPath ? newParentPath + '/' + sym.name : sym.name,
                    source: 'include',
                    includeChain: newChain,
                    filePath: resolvedPath,
                });
            }

            // 递归处理 nested include
            if (rawResult.includes.length > 0) {
                result.push(...resolveIncludes(
                    rawResult.includes,
                    resolvedPath,
                    graftBase,
                    newChain,
                    depth + 1,
                ));
            }
        }
        return result;
    }

    /**
     * 解析当前文件并缓存结果。
     * @param {{ uri: { toString(): string }, version: number, getText(): string }} document
     * @returns {{ symbols: object[], includes: object[], lineContexts: object[] }}
     */
    function parseCurrentFile(document) {
        const uri = document.uri.toString();
        let uriPath;
        try {
            uriPath = uri.startsWith('file://') ? fileURLToPath(uri) : uri;
        } catch (_) {
            uriPath = uri;
        }
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (cached) return cached;

        const text = document.getText();
        const rawResult = parseParText(text, uri);

        // 解析 include 递归
        const includeSymbols = resolveIncludes(
            rawResult.includes,
            uri,      // baseUri stays as URI for resolveFilePath
            '', // outerPrefix (current file is top-level)
            [uriPath], // Use filesystem path for consistent chain comparison
            0, // depth
        );

        // 合并 symbols：当前文件 + include
        const allSymbols = [...rawResult.symbols, ...includeSymbols];

        const result = {
            symbols: allSymbols,
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
     * @param {string} [lineText] - 可选，当前行的文本（用于 scopeName 检测）
     * @returns {Array<{label: string, kind: string, detail: string, sortText: string, insertText: string, source: string, parentPath: string}>}
     */
    function getCompletionsAt(document, position, lineText) {
        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (!cached) return [];

        // 如果传入 lineText，先检测 scope 名引号内补全
        if (lineText !== undefined) {
            const scopeNameCtx = detectScopeNameContext(lineText, position.character);
            if (scopeNameCtx) {
                return buildParCompletions(
                    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
                    cached.symbols,
                );
            }
        }

        const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
        if (!ctx) return [];

        return buildParCompletions(ctx, cached.symbols);
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
        // includeRawCache keys are filesystem paths; convert URI for matching
        try {
            const fp = uri.startsWith('file://') ? fileURLToPath(uri) : uri;
            includeRawCache.delete(fp);
        } catch (_) {
            includeRawCache.delete(uri); // fallback
        }
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
