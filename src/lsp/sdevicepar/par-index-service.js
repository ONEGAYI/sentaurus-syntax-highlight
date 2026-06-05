// src/lsp/sdevicepar/par-index-service.js
'use strict';

const path = require('path');
const fs = require('fs');
const { URL, fileURLToPath } = require('url');
const { parseParText } = require('./par-parser');
const { stackToPath, getContextAtPosition, detectScopeNameContext } = require('./par-context');
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH, BUILTIN_MATERIALDB_DIR, BUILTIN_MATERIALDB_EXCLUDE } = require('./par-constants');
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
    const readdirFn = deps.readdirSync || ((dir) => fs.readdirSync(dir));

    // currentFileCache: Map<"uri:v{version}", ParResolvedResult>
    const currentFileCache = new Map();

    // includeRawCache: Map<uri, ParParseResult>
    // Phase 2.1: resolved by resolveIncludes (Task 4)
    const includeRawCache = new Map();

    // workspaceIndex: Map<uri, ParSymbol[]> — workspace .par 文件符号（标记 source: "workspace"）
    // key 为 URI string，value 为已标记 source 的 symbol 数组
    const workspaceIndex = new Map();

    // materialDbIndex: Map<filePath, ParSymbol[]> — MaterialDB 文件符号（标记 source: "materialdb"）
    const materialDbIndex = new Map();


    // workspace 扫描状态
    let _workspaceScanning = false;
    let _workspaceCompletionMissed = false;

    /**
     * 获取缓存键。
     */
    function cacheKey(uri, version) {
        return `${uri}:v${version}`;
    }

    /**
     * 检查 resolved 是否在 baseDir 目录内（防止路径遍历）。
     * @param {string} resolved - 已规范化的绝对路径
     * @param {string} baseDir - 允许的基目录
     * @returns {boolean}
     */
    function isWithinBase(resolved, baseDir) {
        const normResolved = path.normalize(resolved) + path.sep;
        const normBase = path.normalize(baseDir) + path.sep;
        return normResolved.startsWith(normBase);
    }

    /**
     * 解析 include 文件路径。
     * 查找顺序：deps.resolveFilePath（测试注入）→ 当前文件目录 → workspace 根目录 → 插件 bundled MaterialDB
     * 所有路径均经过 isWithinBase 校验，防止 `../` 路径遍历。
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
            if (isWithinBase(candidate, baseDir) && fs.existsSync(candidate)) return candidate;
        } catch (_) {}

        // 2. workspace 根目录
        for (const folder of (deps.workspaceFolders || [])) {
            try {
                const wsPath = folder.uri.fsPath || fileURLToPath(folder.uri.toString());
                const candidate = path.resolve(wsPath, refPath);
                if (isWithinBase(candidate, wsPath) && fs.existsSync(candidate)) return candidate;
            } catch (_) {}
        }

        // 3. 插件内置 references/MaterialDB/
        try {
            const materialDbDir = path.join(extensionPath, 'references', 'MaterialDB');
            const bundled = path.resolve(materialDbDir, refPath);
            if (isWithinBase(bundled, materialDbDir) && fs.existsSync(bundled)) return bundled;
        } catch (_) {}

        return null;
    }

    /**
     * 添加 workspace 文件到索引。
     */
    function addWorkspaceFile(uri, text) {
        const rawResult = parseParText(text, uri);
        const symbols = rawResult.symbols.map(s => ({
            ...s,
            source: 'workspace',
            filePath: uri,
        }));
        workspaceIndex.set(uri, symbols);
        // FIFO 淘汰（与 includeRawCache 一致）
        if (workspaceIndex.size > MAX_CACHE_SIZE) {
            workspaceIndex.delete(workspaceIndex.keys().next().value);
        }
    }

    /**
     * 从索引中移除 workspace 文件。
     */
    function removeWorkspaceFile(uri) {
        workspaceIndex.delete(uri);
    }

    /**
     * 获取所有 workspace 文件的符号（扁平化数组）。
     */
    function getWorkspaceSymbols() {
        const all = [];
        for (const symbols of workspaceIndex.values()) {
            all.push(...symbols);
        }
        return all;
    }

    /**
     * 从文件路径推断 Material 名称。
     * 取文件名（去掉 .par 后缀），如 /db/Silicon.par → "Silicon"。
     * @param {string} filePath
     * @returns {string|null}
     */
    function inferMaterialNameFromPath(filePath) {
        const normalized = filePath.replace(/\\/g, '/');
        const filename = normalized.split('/').pop();
        if (!filename) return null;
        const name = filename.replace(/\.par$/i, '');
        return (name && !name.startsWith('.')) ? name : null;
    }

    /**
     * 添加单个 MaterialDB 文件到索引。
     *
     * 支持两种文件格式的归一化：
     * - 格式 A（顶层 block，如 Silicon.par）：自动创建 synthetic Material scope 并 graft
     * - 格式 B（显式 Material scope，如 example_sdevice.par）：直接标记 source
     *
     * @param {string} filePath - 文件路径（绝对路径或标识字符串）
     * @param {string} text - 文件文本内容
     */
    function addMaterialDbFile(filePath, text) {
        const rawResult = parseParText(text, filePath);
        const rawSymbols = rawResult.symbols;

        const hasExplicitMaterialScope = rawSymbols.some(
            s => s.kind === 'scope' && s.scopeType === 'Material'
        );

        let finalSymbols;

        if (hasExplicitMaterialScope) {
            // 格式 B：已有 Material scope — 直接标记 source
            finalSymbols = rawSymbols.map(s => ({
                ...s,
                source: 'materialdb',
                filePath,
            }));
        } else {
            // 格式 A：顶层 block/parameter — synthetic wrap + graft
            const materialName = inferMaterialNameFromPath(filePath);
            if (!materialName || rawSymbols.length === 0) {
                finalSymbols = rawSymbols.map(s => ({
                    ...s,
                    source: 'materialdb',
                    filePath,
                }));
            } else {
                const scopePrefix = 'Material/' + materialName;

                const syntheticScope = {
                    kind: 'scope',
                    name: materialName,
                    scopeType: 'Material',
                    parentPath: '',
                    fullPath: scopePrefix,
                    range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
                    value: null,
                    source: 'materialdb',
                    filePath,
                    includeChain: [],
                };

                const grafted = rawSymbols.map(s => {
                    const newParentPath = s.parentPath
                        ? scopePrefix + '/' + s.parentPath
                        : scopePrefix;
                    return {
                        ...s,
                        parentPath: newParentPath,
                        fullPath: newParentPath + '/' + s.name,
                        source: 'materialdb',
                        filePath,
                    };
                });

                finalSymbols = [syntheticScope, ...grafted];
            }
        }

        if (finalSymbols.length > 0) {
            materialDbIndex.set(filePath, finalSymbols);
            if (materialDbIndex.size > MAX_CACHE_SIZE) {
                materialDbIndex.delete(materialDbIndex.keys().next().value);
            }
        }
    }

    /**
     * 加载内置 MaterialDB（从 references/MaterialDB 目录扫描所有 .par 文件）。
     * 排除 BUILTIN_MATERIALDB_EXCLUDE 中的文件（如 example_sdevice.par）。
     * 通过 addMaterialDbFile 走相同归一化管线。
     */
    function loadBuiltinMaterialDb() {
        materialDbIndex.clear();
        const materialDbDir = path.join(extensionPath, BUILTIN_MATERIALDB_DIR);
        const t0 = Date.now();
        try {
            const files = readdirFn(materialDbDir);
            for (const file of files) {
                if (!file.toLowerCase().endsWith('.par')) continue;
                if (BUILTIN_MATERIALDB_EXCLUDE.has(file)) continue;
                try {
                    const fullPath = path.join(materialDbDir, file);
                    const text = readFileFn(fullPath);
                    addMaterialDbFile(fullPath, text);
                } catch (_) { /* skip unreadable files */ }
            }
        } catch (_) { /* directory not found — graceful degradation */ }
        console.log('[SentaurusSyntax][MaterialDB] loadBuiltinMaterialDb — loaded',
            materialDbIndex.size, 'files in', Date.now() - t0, 'ms');
    }

    /**
     * 清空 MaterialDB 索引。
     */
    function clearMaterialDb() {
        materialDbIndex.clear();
    }

    /**
     * 从索引中移除单个 MaterialDB 文件。
     * @param {string} filePath
     */
    function removeMaterialDbFile(filePath) {
        materialDbIndex.delete(filePath);
    }

    /**
     * 获取所有 MaterialDB 文件的符号（扁平化数组）。
     */
    function getMaterialDbSymbols() {
        const all = [];
        for (const symbols of materialDbIndex.values()) {
            all.push(...symbols);
        }
        return all;
    }

    /**
     * 获取 MaterialDB 索引中的文件数量。
     */
    function getMaterialDbFileCount() {
        return materialDbIndex.size;
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
        // 记录补全请求时 workspace 是否仍在扫描
        if (_workspaceScanning) _workspaceCompletionMissed = true;

        // scope 名补全不依赖当前文件缓存 — MaterialDB + workspace 即可提供候选
        if (lineText !== undefined) {
            const scopeNameCtx = detectScopeNameContext(lineText, position.character);
            if (scopeNameCtx) {
                const uri = document.uri.toString();
                const version = document.version;
                const cached = currentFileCache.get(cacheKey(uri, version));
                const symbols = cached
                    ? cached.symbols.concat(getWorkspaceSymbols(), getMaterialDbSymbols())
                    : getWorkspaceSymbols().concat(getMaterialDbSymbols());
                return buildParCompletions(
                    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
                    symbols,
                );
            }
        }

        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (!cached) return [];

        const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
        if (!ctx) return [];

        return buildParCompletions(ctx, cached.symbols.concat(getWorkspaceSymbols(), getMaterialDbSymbols()));
    }

    function onFileChanged(uriOrPath) {
        // 1. 清除 includeRawCache（key 为 filesystem path）
        try {
            const fp = uriOrPath.startsWith('file://') ? fileURLToPath(uriOrPath) : uriOrPath;
            includeRawCache.delete(fp);
        } catch (_) {
            includeRawCache.delete(uriOrPath);
        }
        // 2. 粗粒度清空 currentFileCache
        currentFileCache.clear();
    }

    function clearIncludeCacheForFile(filePath) {
        includeRawCache.delete(filePath);
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
        workspaceIndex.clear();
        materialDbIndex.clear();
        _workspaceScanning = false;
        _workspaceCompletionMissed = false;
    }

    function setWorkspaceScanning(scanning) {
        _workspaceScanning = scanning;
    }

    function consumeWorkspaceCompletionMissed() {
        const missed = _workspaceCompletionMissed;
        _workspaceCompletionMissed = false;
        return missed;
    }

    function getWorkspaceFileCount() {
        return workspaceIndex.size;
    }

    return {
        parseCurrentFile,
        getCompletionsAt,
        onFileChanged,
        onFileClosed,
        addWorkspaceFile,
        removeWorkspaceFile,
        getWorkspaceSymbols,
        clearIncludeCacheForFile,
        setWorkspaceScanning,
        consumeWorkspaceCompletionMissed,
        getWorkspaceFileCount,
        addMaterialDbFile,
        removeMaterialDbFile,
        loadBuiltinMaterialDb,
        clearMaterialDb,
        getMaterialDbSymbols,
        getMaterialDbFileCount,

        dispose,
    };
}

module.exports = { createParIndexService };
