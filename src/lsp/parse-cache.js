'use strict';

const schemeParser = require('./scheme-parser');
const schemeAnalyzer = require('./scheme-analyzer');
const scopeAnalyzer = require('./scope-analyzer');

/**
 * 计算文本的行起始偏移量表（每行第一个字符在原文中的 offset）。
 * @param {string} text
 * @returns {number[]}
 */
function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
            starts.push(i + 1);
        }
    }
    return starts;
}

// ---------------------------------------------------------------------------
// SchemeParseCache
// ---------------------------------------------------------------------------

/**
 * Scheme 解析结果缓存。以 (uri, version) 为 key，避免多个 Provider 对同一文档重复解析。
 * 超过 maxEntries 时按 Map 插入序 FIFO 淘汰最旧条目。
 */
class SchemeParseCache {
    /**
     * @param {{ maxEntries?: number }} [options]
     */
    constructor(options) {
        const opts = options || {};
        /** @type {number} */
        this._maxEntries = opts.maxEntries || 20;
        /**
         * Map<string, { version: number, ast: object, errors: Array,
         *   analysis: { definitions: Array, foldingRanges: Array },
         *   scopeTree: object, text: string, lineStarts: number[] }>
         * @type {Map}
         */
        this._cache = new Map();
    }

    /**
     * 获取（或计算并缓存）解析结果。
     * @param {{ uri: { toString(): string }, version: number, getText(): string }} document
     * @returns {{ version: number, ast: object, errors: Array,
     *   analysis: { definitions: Array, foldingRanges: Array },
     *   scopeTree: object, text: string, lineStarts: number[] }}
     */
    get(document) {
        const uri = document.uri.toString();
        const version = document.version;
        const cached = this._cache.get(uri);

        if (cached && cached.version === version) {
            return cached;
        }

        // 执行完整解析管线
        const text = document.getText();
        const { ast, errors } = schemeParser.parse(text);
        const analysis = schemeAnalyzer.analyze(ast, text);
        const scopeTree = scopeAnalyzer.buildScopeTree(ast);
        const lineStarts = computeLineStarts(text);

        const entry = { version, ast, errors, analysis, scopeTree, text, lineStarts };
        this._cache.set(uri, entry);

        // FIFO 淘汰
        if (this._cache.size > this._maxEntries) {
            const oldest = this._cache.keys().next().value;
            this._cache.delete(oldest);
        }

        return entry;
    }

    /**
     * 使指定 URI 的缓存失效。
     * @param {string} uri
     */
    invalidate(uri) {
        this._cache.delete(uri);
    }

    /**
     * 清空全部缓存。
     */
    dispose() {
        this._cache.clear();
    }

    /**
     * 当前缓存条目数（用于测试）。
     * @returns {number}
     */
    get size() {
        return this._cache.size;
    }
}

// ---------------------------------------------------------------------------
// TclParseCache
// ---------------------------------------------------------------------------

/**
 * Tcl tree-sitter 解析结果缓存。缓存 Tree 对象，释放旧 Tree 以避免 WASM 内存泄漏。
 */
class TclParseCache {
    /**
     * @param {{ maxEntries?: number }} [options]
     */
    constructor(options) {
        const opts = options || {};
        /** @type {number} */
        this._maxEntries = opts.maxEntries || 20;
        /**
         * Map<string, { version: number, tree: object, text: string, lineStarts: number[] }>
         * @type {Map}
         */
        this._cache = new Map();
    }

    /**
     * 获取（或计算并缓存）Tcl 解析结果。
     * version 变更时自动释放旧的 tree-sitter Tree 对象。
     *
     * 如果 WASM 解析器尚未初始化（isReady() === false），返回 null。
     *
     * @param {{ uri: { toString(): string }, version: number, getText(): string }} document
     * @returns {{ version: number, tree: object, text: string, lineStarts: number[] } | null}
     */
    get(document) {
        const tclParserWasm = require('./tcl-parser-wasm');
        if (!tclParserWasm.isReady()) {
            return null;
        }

        const uri = document.uri.toString();
        const version = document.version;
        const cached = this._cache.get(uri);

        if (cached && cached.version === version) {
            return cached;
        }

        // version 变更，释放旧 tree
        if (cached && cached.tree && typeof cached.tree.delete === 'function') {
            cached.tree.delete();
        }

        const text = document.getText();
        const tree = tclParserWasm.parse(text);
        if (!tree) {
            return null;
        }
        const lineStarts = computeLineStarts(text);

        const entry = { version, tree, text, lineStarts };
        this._cache.set(uri, entry);

        // FIFO 淘汰
        if (this._cache.size > this._maxEntries) {
            const oldestKey = this._cache.keys().next().value;
            const oldestEntry = this._cache.get(oldestKey);
            if (oldestEntry && oldestEntry.tree && typeof oldestEntry.tree.delete === 'function') {
                oldestEntry.tree.delete();
            }
            this._cache.delete(oldestKey);
        }

        return entry;
    }

    /**
     * 使指定 URI 的缓存失效，同时释放其 tree-sitter Tree。
     * @param {string} uri
     */
    invalidate(uri) {
        const entry = this._cache.get(uri);
        if (entry && entry.tree && typeof entry.tree.delete === 'function') {
            entry.tree.delete();
        }
        this._cache.delete(uri);
    }

    /**
     * 清空全部缓存，释放所有 tree-sitter Tree 对象。
     */
    dispose() {
        for (const entry of this._cache.values()) {
            if (entry && entry.tree && typeof entry.tree.delete === 'function') {
                entry.tree.delete();
            }
        }
        this._cache.clear();
    }

    /**
     * 当前缓存条目数（用于测试）。
     * @returns {number}
     */
    get size() {
        return this._cache.size;
    }
}

module.exports = { SchemeParseCache, TclParseCache, computeLineStarts };
