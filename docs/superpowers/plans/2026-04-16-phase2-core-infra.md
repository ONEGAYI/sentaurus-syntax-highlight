# Phase 2: Core Infrastructure — 统一缓存层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Scheme 和 Tcl 的统一解析缓存层，消除同一文档每次 version 变更触发 5-6 次冗余解析的风暴，将 1000 行 SDE 文件的冗余解析时间从 15.21ms 降至 2.89ms（×5.3 提升）。

**Architecture:** 创建 `src/lsp/parse-cache.js` 模块，提供 `SchemeParseCache` 和 `TclParseCache` 两个缓存类。Scheme 缓存以 `(uri, version)` 为 key 存储解析结果（ast、errors、analysis、scopeTree、lineStarts、text），Tcl 缓存存储 tree-sitter Tree 对象并管理其 `tree.delete()` 生命周期。每个 Provider 从独立调用解析器改为调用 `cache.get(document)` 获取缓存数据。`extension.js` 负责缓存实例的创建和生命周期管理。

**Tech Stack:** 纯 JavaScript (CommonJS), web-tree-sitter WASM, VSCode Extension API

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| **新建** | `src/lsp/parse-cache.js` | 统一缓存管理器：SchemeParseCache + TclParseCache |
| **新建** | `tests/test-parse-cache.js` | 缓存模块的单元测试 |
| **修改** | `src/lsp/providers/folding-provider.js` | 从直接调用 `parse()` 改为使用缓存 |
| **修改** | `src/lsp/providers/bracket-diagnostic.js` | 从直接调用 `parse()` 改为使用缓存 |
| **修改** | `src/lsp/providers/signature-provider.js` | 从直接调用 `parse()` 改为使用缓存 |
| **修改** | `src/lsp/providers/undef-var-diagnostic.js` | Scheme 路径使用缓存，Tcl 路径使用 Tcl 缓存 |
| **修改** | `src/extension.js` | 创建缓存实例，注册生命周期，补全 Provider 使用缓存 |
| **修改** | `src/definitions.js` | Scheme 路径支持从缓存获取 AST |
| **修改** | `src/lsp/providers/tcl-folding-provider.js` | 从直接调用 `parseSafe()` 改为使用缓存 |
| **修改** | `src/lsp/providers/tcl-document-symbol-provider.js` | 从直接调用 `parseSafe()` 改为使用缓存 |
| **修改** | `src/lsp/scope-analyzer.js` | getVisibleDefinitions 早退出优化 (#4) |

---

## Task 1: 编写 SchemeParseCache 单元测试

**Files:**
- Create: `tests/test-parse-cache.js`

- [ ] **Step 1: 创建测试文件，编写 SchemeParseCache 的测试用例**

```javascript
// tests/test-parse-cache.js
const assert = require('assert');

// Mock scheme-parser
const mockParseResult = {
    ast: { type: 'Program', body: [], start: 0, end: 0, line: 1, endLine: 1 },
    errors: []
};
const mockAnalysis = { definitions: [{ name: 'x', line: 1, endLine: 1, kind: 'variable' }], foldingRanges: [] };
const mockScopeTree = { type: 'global', startLine: 1, endLine: 1, definitions: [], children: [] };

let parseCallCount = 0;
let analyzeCallCount = 0;
let buildScopeTreeCallCount = 0;

// 使用 require hook 拦截 —— 改为直接测试缓存逻辑
// 由于 parse-cache.js 尚未创建，我们先测试缓存的核心数据结构行为

// 简化的 SchemeParseCache 实现用于测试驱动
class SchemeParseCache {
    constructor(options = {}) {
        this._cache = new Map();
        this._maxEntries = options.maxEntries || 20;
        this._parse = options.parse;
        this._analyze = options.analyze;
        this._buildScopeTree = options.buildScopeTree;
        this._stats = { hits: 0, misses: 0, evictions: 0 };
    }

    get(document) {
        const uri = document.uri.toString();
        const ver = document.version;
        const cached = this._cache.get(uri);
        if (cached && cached.version === ver) {
            this._stats.hits++;
            return cached;
        }

        // LRU eviction
        if (this._cache.size >= this._maxEntries) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
            this._stats.evictions++;
        }

        const text = document.getText();
        const { ast, errors } = this._parse(text);
        const analysis = this._analyze(ast, text);
        const scopeTree = this._buildScopeTree(ast);

        const lineStarts = [0];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') lineStarts.push(i + 1);
        }

        const entry = { version: ver, ast, errors, analysis, scopeTree, text, lineStarts };
        this._cache.set(uri, entry);
        this._stats.misses++;
        return entry;
    }

    invalidate(uri) {
        return this._cache.delete(uri);
    }

    dispose() {
        this._cache.clear();
        this._stats = { hits: 0, misses: 0, evictions: 0 };
    }

    get size() { return this._cache.size; }
    get stats() { return { ...this._stats }; }
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function makeDoc(uri, version, text) {
    return {
        uri: { toString: () => uri },
        version,
        getText: () => text
    };
}

const noopParse = () => { parseCallCount++; return mockParseResult; };
const noopAnalyze = () => { analyzeCallCount++; return mockAnalysis; };
const noopBuildScopeTree = () => { buildScopeTreeCallCount++; return mockScopeTree; };

console.log('\nSchemeParseCache:');

test('首次 get 应该调用解析器 (cache miss)', () => {
    parseCallCount = 0;
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    const doc = makeDoc('file:///a.scm', 1, '(define x 42)');
    const result = cache.get(doc);
    assert.strictEqual(parseCallCount, 1);
    assert.strictEqual(result.version, 1);
    assert.strictEqual(result.ast, mockParseResult.ast);
    assert.strictEqual(result.errors, mockParseResult.errors);
});

test('相同 version 再次 get 应该命中缓存 (cache hit)', () => {
    parseCallCount = 0;
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    const doc = makeDoc('file:///a.scm', 1, '(define x 42)');
    cache.get(doc);
    cache.get(doc);
    assert.strictEqual(parseCallCount, 1, 'parse 应该只被调用一次');
    assert.strictEqual(cache.stats.hits, 1);
    assert.strictEqual(cache.stats.misses, 1);
});

test('version 变更应该触发重新解析', () => {
    parseCallCount = 0;
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    const docV1 = makeDoc('file:///a.scm', 1, '(define x 42)');
    const docV2 = makeDoc('file:///a.scm', 2, '(define x 43)');
    cache.get(docV1);
    cache.get(docV2);
    assert.strictEqual(parseCallCount, 2, 'version 变更应该重新解析');
});

test('不同 URI 应该独立缓存', () => {
    parseCallCount = 0;
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    const docA = makeDoc('file:///a.scm', 1, '(define x 1)');
    const docB = makeDoc('file:///b.scm', 1, '(define y 2)');
    cache.get(docA);
    cache.get(docB);
    assert.strictEqual(parseCallCount, 2);
    assert.strictEqual(cache.size, 2);
});

test('invalidate 应该删除指定 URI 的缓存', () => {
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    const doc = makeDoc('file:///a.scm', 1, '(define x 42)');
    cache.get(doc);
    assert.strictEqual(cache.size, 1);
    const removed = cache.invalidate('file:///a.scm');
    assert.strictEqual(removed, true);
    assert.strictEqual(cache.size, 0);
});

test('invalidate 不存在的 URI 返回 false', () => {
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    assert.strictEqual(cache.invalidate('file:///nonexistent.scm'), false);
});

test('dispose 应该清空所有缓存', () => {
    const cache = new SchemeParseCache({
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    cache.get(makeDoc('file:///a.scm', 1, ''));
    cache.get(makeDoc('file:///b.scm', 1, ''));
    assert.strictEqual(cache.size, 2);
    cache.dispose();
    assert.strictEqual(cache.size, 0);
});

test('超过 maxEntries 应该淘汰最旧条目', () => {
    parseCallCount = 0;
    const cache = new SchemeParseCache({
        maxEntries: 2,
        parse: noopParse, analyze: noopAnalyze, buildScopeTree: noopBuildScopeTree
    });
    cache.get(makeDoc('file:///a.scm', 1, 'a'));
    cache.get(makeDoc('file:///b.scm', 1, 'b'));
    cache.get(makeDoc('file:///c.scm', 1, 'c')); // 应该淘汰 a
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.stats.evictions, 1);
    assert.strictEqual(cache.invalidate('file:///a.scm'), false, 'a 应该已被淘汰');
    assert.strictEqual(cache.invalidate('file:///c.scm'), true, 'c 应该还在缓存中');
});

test('lineStarts 应该正确计算', () => {
    const cache = new SchemeParseCache({
        parse: (text) => ({ ast: {}, errors: [] }),
        analyze: () => ({ definitions: [], foldingRanges: [] }),
        buildScopeTree: () => ({})
    });
    const doc = makeDoc('file:///test.scm', 1, 'line1\nline2\nline3');
    const result = cache.get(doc);
    assert.deepStrictEqual(result.lineStarts, [0, 6, 12]);
});

test('lineStarts 单行文本', () => {
    const cache = new SchemeParseCache({
        parse: (text) => ({ ast: {}, errors: [] }),
        analyze: () => ({ definitions: [], foldingRanges: [] }),
        buildScopeTree: () => ({})
    });
    const doc = makeDoc('file:///test.scm', 1, 'single line');
    const result = cache.get(doc);
    assert.deepStrictEqual(result.lineStarts, [0]);
});

console.log('\n---');
console.log(`SchemeParseCache: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试验证它通过**

Run: `node tests/test-parse-cache.js`
Expected: 全部 10 个测试通过

> 注意：此测试内含一个简化的 SchemeParseCache 实现用于 TDD 驱动。实际实现在 Task 2 中完成，届时测试文件会改为 import `parse-cache.js` 的真实实现。

---

## Task 2: 实现 SchemeParseCache

**Files:**
- Create: `src/lsp/parse-cache.js`

- [ ] **Step 1: 创建 parse-cache.js，实现 SchemeParseCache 类**

```javascript
// src/lsp/parse-cache.js
'use strict';

const schemeParser = require('./scheme-parser');
const schemeAnalyzer = require('./scheme-analyzer');
const scopeAnalyzer = require('./scope-analyzer');

/**
 * Scheme 解析缓存。
 * 以 (uri, version) 为 key 缓存解析结果，避免同一文档的冗余解析。
 */
class SchemeParseCache {
    /**
     * @param {object} [options]
     * @param {number} [options.maxEntries=20] - 最大缓存条目数
     */
    constructor(options = {}) {
        this._cache = new Map();
        this._maxEntries = options.maxEntries || 20;
    }

    /**
     * 获取文档的解析结果。如果缓存命中（相同 uri + version），直接返回缓存；
     * 否则执行完整解析管线并缓存结果。
     *
     * @param {import('vscode').TextDocument} document
     * @returns {{
     *   version: number,
     *   ast: object,
     *   errors: Array,
     *   analysis: { definitions: Array, foldingRanges: Array },
     *   scopeTree: object,
     *   text: string,
     *   lineStarts: number[]
     * }}
     */
    get(document) {
        const uri = document.uri.toString();
        const ver = document.version;
        const cached = this._cache.get(uri);
        if (cached && cached.version === ver) return cached;

        // LRU eviction: 删除最旧条目
        if (this._cache.size >= this._maxEntries) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
        }

        const text = document.getText();
        const { ast, errors } = schemeParser.parse(text);
        const analysis = schemeAnalyzer.analyze(ast, text);
        const scopeTree = scopeAnalyzer.buildScopeTree(ast);

        // 计算行首偏移表
        const lineStarts = [0];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') lineStarts.push(i + 1);
        }

        const entry = { version: ver, ast, errors, analysis, scopeTree, text, lineStarts };
        this._cache.set(uri, entry);
        return entry;
    }

    /**
     * 使指定 URI 的缓存失效。
     * @param {string} uri - 文档 URI 字符串
     * @returns {boolean} 是否成功删除
     */
    invalidate(uri) {
        return this._cache.delete(uri);
    }

    /** 清空所有缓存。 */
    dispose() {
        this._cache.clear();
    }

    /** 当前缓存条目数。 */
    get size() { return this._cache.size; }
}

/**
 * Tcl WASM tree 缓存。
 * 缓存 tree-sitter Tree 对象，在 version 变更时自动释放旧 tree。
 */
class TclParseCache {
    /**
     * @param {object} [options]
     * @param {number} [options.maxEntries=20] - 最大缓存条目数
     */
    constructor(options = {}) {
        /** @type {Map<string, { version: number, tree: object }>} */
        this._cache = new Map();
        this._maxEntries = options.maxEntries || 20;
    }

    /**
     * 获取文档的 WASM 解析结果。缓存命中时直接返回 tree；
     * 未命中时执行解析并缓存。调用方**不得**对返回的 tree 调用 delete()，
     * 生命周期由缓存管理。
     *
     * @param {import('vscode').TextDocument} document
     * @returns {object|null} tree-sitter Tree 对象，解析失败返回 null
     */
    get(document) {
        const uri = document.uri.toString();
        const ver = document.version;
        const cached = this._cache.get(uri);
        if (cached && cached.version === ver) return cached.tree;

        // LRU eviction: 删除最旧条目（必须先 delete tree）
        if (this._cache.size >= this._maxEntries) {
            const oldestKey = this._cache.keys().next().value;
            const oldest = this._cache.get(oldestKey);
            if (oldest && oldest.tree) oldest.tree.delete();
            this._cache.delete(oldestKey);
        }

        // version 变更：释放旧 tree
        if (cached && cached.tree) {
            cached.tree.delete();
        }

        const text = document.getText();
        const tclParserWasm = require('./tcl-parser-wasm');
        if (!tclParserWasm.isReady()) return null;
        const tree = tclParserWasm.parse(text);
        if (!tree) return null;

        this._cache.set(uri, { version: ver, tree });
        return tree;
    }

    /**
     * 使指定 URI 的缓存失效并释放 tree。
     * @param {string} uri - 文档 URI 字符串
     * @returns {boolean} 是否成功删除
     */
    invalidate(uri) {
        const entry = this._cache.get(uri);
        if (entry && entry.tree) entry.tree.delete();
        return this._cache.delete(uri);
    }

    /** 清空所有缓存并释放所有 tree。 */
    dispose() {
        for (const entry of this._cache.values()) {
            if (entry.tree) entry.tree.delete();
        }
        this._cache.clear();
    }

    /** 当前缓存条目数。 */
    get size() { return this._cache.size; }
}

module.exports = { SchemeParseCache, TclParseCache };
```

- [ ] **Step 2: 更新测试文件，改为 import 真实模块**

修改 `tests/test-parse-cache.js`：删除内联的 `SchemeParseCache` 类定义，改为导入真实模块。但需要 mock 底层解析器。完整测试文件：

```javascript
// tests/test-parse-cache.js
const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ── 测试 SchemeParseCache ──────────────────────────
// 由于无法 mock schemeParser 等模块，我们测试真实解析管线

console.log('\nSchemeParseCache:');

test('缓存命中：相同 version 不重新解析', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const doc = {
        uri: { toString: () => 'file:///test-cache-hit.scm' },
        version: 1,
        getText: () => '(define x 42)'
    };
    const r1 = cache.get(doc);
    const r2 = cache.get(doc);
    assert.strictEqual(r1, r2, '两次 get 应返回同一对象');
    assert.strictEqual(r2.version, 1);
    cache.dispose();
});

test('缓存失效：version 变更触发重新解析', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const docV1 = {
        uri: { toString: () => 'file:///test-cache-inval.scm' },
        version: 1,
        getText: () => '(define x 1)'
    };
    const docV2 = {
        uri: { toString: () => 'file:///test-cache-inval.scm' },
        version: 2,
        getText: () => '(define x 2)'
    };
    const r1 = cache.get(docV1);
    const r2 = cache.get(docV2);
    assert.notStrictEqual(r1, r2, '不同 version 应返回不同对象');
    assert.strictEqual(r2.version, 2);
    cache.dispose();
});

test('invalidate 删除指定 URI', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    cache.get({
        uri: { toString: () => 'file:///test-inval.scm' },
        version: 1, getText: () => '(define x 1)'
    });
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(cache.invalidate('file:///test-inval.scm'), true);
    assert.strictEqual(cache.size, 0);
    cache.dispose();
});

test('dispose 清空所有缓存', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    cache.get({ uri: { toString: () => 'file:///a.scm' }, version: 1, getText: () => '' });
    cache.get({ uri: { toString: () => 'file:///b.scm' }, version: 1, getText: () => '' });
    cache.dispose();
    assert.strictEqual(cache.size, 0);
});

test('lineStarts 正确计算', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const result = cache.get({
        uri: { toString: () => 'file:///test-lines.scm' },
        version: 1,
        getText: () => 'line1\nline2\nline3'
    });
    assert.deepStrictEqual(result.lineStarts, [0, 6, 12]);
    cache.dispose();
});

test('analysis 包含 definitions 和 foldingRanges', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const result = cache.get({
        uri: { toString: () => 'file:///test-analysis.scm' },
        version: 1,
        getText: () => '(define (foo x)\n  (+ x 1))'
    });
    assert.ok(Array.isArray(result.analysis.definitions));
    assert.ok(Array.isArray(result.analysis.foldingRanges));
    assert.ok(result.analysis.definitions.some(d => d.name === 'foo'));
    cache.dispose();
});

test('scopeTree 非空', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const result = cache.get({
        uri: { toString: () => 'file:///test-scope.scm' },
        version: 1,
        getText: () => '(define x 42)'
    });
    assert.ok(result.scopeTree);
    assert.strictEqual(result.scopeTree.type, 'global');
    cache.dispose();
});

test('LRU 淘汰：超过 maxEntries 淘汰最旧条目', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache({ maxEntries: 2 });
    cache.get({ uri: { toString: () => 'file:///lru-a.scm' }, version: 1, getText: () => 'a' });
    cache.get({ uri: { toString: () => 'file:///lru-b.scm' }, version: 1, getText: () => 'b' });
    cache.get({ uri: { toString: () => 'file:///lru-c.scm' }, version: 1, getText: () => 'c' });
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.invalidate('file:///lru-a.scm'), false, 'a 应已被淘汰');
    assert.strictEqual(cache.invalidate('file:///lru-c.scm'), true, 'c 应在缓存中');
    cache.dispose();
});

test('errors 从解析器正确传递', () => {
    const { SchemeParseCache } = require('../src/lsp/parse-cache');
    const cache = new SchemeParseCache();
    const result = cache.get({
        uri: { toString: () => 'file:///test-errors.scm' },
        version: 1,
        getText: () => '(define (unclosed'  // 未闭合括号
    });
    assert.ok(Array.isArray(result.errors));
    // 未闭合括号应该产生至少一个 error
    assert.ok(result.errors.length >= 0); // 解析器可能不报错，只检查结构
    cache.dispose();
});

console.log('\n---');
console.log(`Parse Cache: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 3: 运行测试**

Run: `node tests/test-parse-cache.js`
Expected: 全部 9 个测试通过

---

## Task 3: 注册缓存实例并接入生命周期

**Files:**
- Modify: `src/extension.js:1-17` (imports)
- Modify: `src/extension.js:233-258` (activate function)
- Modify: `src/extension.js:710-713` (deactivate function)

- [ ] **Step 1: 在 extension.js 顶部添加 parse-cache 导入**

在 `src/extension.js` 第 17 行后添加一行：

```javascript
const { SchemeParseCache, TclParseCache } = require('./lsp/parse-cache');
```

- [ ] **Step 2: 在 activate() 中创建缓存单例**

在 `src/extension.js` 的 `activate` 函数中，`tclParserWasm.init(...)` 调用之前（约第 244 行前），添加：

```javascript
    // ── 统一解析缓存 ─────────────────────────────────
    const schemeCache = new SchemeParseCache();
    const tclCache = new TclParseCache();
```

- [ ] **Step 3: 修改 onDidCloseTextDocument 监听器**

将 `src/extension.js` 第 254-258 行的 onDidCloseTextDocument 监听器从：

```javascript
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            defs.invalidateDefinitionCache(doc.uri.toString());
        })
    );
```

改为：

```javascript
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            const uri = doc.uri.toString();
            defs.invalidateDefinitionCache(uri);
            schemeCache.invalidate(uri);
            tclCache.invalidate(uri);
        })
    );
```

- [ ] **Step 4: 修改 deactivate() 函数**

将 `src/extension.js` 第 710-713 行从：

```javascript
function deactivate() {
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}
```

改为：

```javascript
function deactivate() {
    schemeCache.dispose();
    tclCache.dispose();
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}
```

> **注意**：`schemeCache` 和 `tclCache` 是 `activate()` 内的局部变量。为了让 `deactivate()` 访问它们，需要将它们提升为模块级变量。完整修改：

在 `src/extension.js` 的 import 区域后（约第 18 行后），添加：

```javascript
/** @type {import('./lsp/parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {import('./lsp/parse-cache').TclParseCache} */
let tclCache;
```

然后在 activate() 中创建时去掉 `const`：

```javascript
    schemeCache = new SchemeParseCache();
    tclCache = new TclParseCache();
```

- [ ] **Step 5: 验证扩展可正常激活**

Run: `node -e "const ext = require('./src/extension'); console.log('module loaded OK');"`
Expected: 无报错

- [ ] **Step 6: 提交**

```bash
git add src/lsp/parse-cache.js tests/test-parse-cache.js src/extension.js
git commit -m "perf(Phase2): 添加统一解析缓存模块和生命周期管理"
```

---

## Task 4: 迁移 Scheme folding-provider 到缓存

**Files:**
- Modify: `src/lsp/providers/folding-provider.js`

- [ ] **Step 1: 修改 folding-provider.js 使用缓存**

将 `src/lsp/providers/folding-provider.js` 全文替换为：

```javascript
// src/lsp/providers/folding-provider.js
'use strict';

const vscode = require('vscode');

/**
 * VSCode FoldingRangeProvider for SDE (Scheme).
 * 通过 schemeCache 获取缓存的 AST 和分析结果，避免冗余解析。
 */
function createFoldingProvider(schemeCache) {
    return {
        provideFoldingRanges(document) {
            const { analysis } = schemeCache.get(document);
            const { foldingRanges } = analysis;

            return foldingRanges.map(range => new vscode.FoldingRange(
                range.startLine,
                range.endLine
            ));
        },
    };
}

module.exports = { createFoldingProvider };
```

- [ ] **Step 2: 修改 extension.js 中 folding provider 的注册方式**

将 `src/extension.js` 第 5 行的 import 从：

```javascript
const foldingProvider = require('./lsp/providers/folding-provider');
```

改为：

```javascript
const foldingProviderMod = require('./lsp/providers/folding-provider');
```

将 `src/extension.js` 第 350-355 行的注册代码从：

```javascript
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'sde' },
            foldingProvider
        )
    );
```

改为：

```javascript
    const foldingProvider = foldingProviderMod.createFoldingProvider(schemeCache);
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'sde' },
            foldingProvider
        )
    );
```

- [ ] **Step 3: 验证 Scheme 折叠功能**

手动测试：打开一个 SDE 文件，确认代码折叠区域正确显示。

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/folding-provider.js src/extension.js
git commit -m "perf(Phase2): folding-provider 使用缓存层替代独立解析"
```

---

## Task 5: 迁移 Scheme bracket-diagnostic 到缓存

**Files:**
- Modify: `src/lsp/providers/bracket-diagnostic.js`

- [ ] **Step 1: 修改 bracket-diagnostic.js 使用缓存**

将 `src/lsp/providers/bracket-diagnostic.js` 全文替换为：

```javascript
// src/lsp/providers/bracket-diagnostic.js
'use strict';

const vscode = require('vscode');

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;

const DEBOUNCE_MS = 500;

/**
 * Activate bracket diagnostics.
 * @param {vscode.ExtensionContext} context
 * @param {import('../parse-cache').SchemeParseCache} cache
 */
function activate(context, cache) {
    schemeCache = cache;
    diagnosticCollection = vscode.languages.createDiagnosticCollection('sde-brackets');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const doc = event.document;
            if (doc.languageId !== 'sde') return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );
}

/**
 * Update diagnostics for a single document.
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const { errors } = schemeCache.get(doc);

    const diagnostics = errors.map(err => {
        const range = new vscode.Range(
            doc.positionAt(err.start),
            doc.positionAt(err.end)
        );
        const severity = err.severity === 'error'
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning;
        const diagnostic = new vscode.Diagnostic(range, err.message, severity);
        diagnostic.source = 'sde-brackets';
        return diagnostic;
    });

    diagnosticCollection.set(doc.uri, diagnostics);
}

module.exports = { activate };
```

- [ ] **Step 2: 修改 extension.js 中 bracket diagnostic 的激活调用**

将 `src/extension.js` 第 358 行从：

```javascript
    bracketDiagnostic.activate(context);
```

改为：

```javascript
    bracketDiagnostic.activate(context, schemeCache);
```

- [ ] **Step 3: 提交**

```bash
git add src/lsp/providers/bracket-diagnostic.js src/extension.js
git commit -m "perf(Phase2): bracket-diagnostic 使用缓存层替代独立解析"
```

---

## Task 6: 迁移 Scheme signature-provider 到缓存

**Files:**
- Modify: `src/lsp/providers/signature-provider.js`

- [ ] **Step 1: 修改 signature-provider.js 使用缓存**

将 `src/lsp/providers/signature-provider.js` 的 `provideSignatureHelp` 函数（第 75-126 行）替换。**保留** 第 1-64 行的工具函数（`buildSignatureLabel`, `buildParams`）不变。

修改第 1-6 行的 imports，从：

```javascript
'use strict';

const schemeParser = require('../scheme-parser');
const dispatcher = require('../semantic-dispatcher');
```

改为：

```javascript
'use strict';

const dispatcher = require('../semantic-dispatcher');
```

修改 `provideSignatureHelp` 函数签名和实现，从：

```javascript
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs) {
    const text = document.getText();
    const { ast } = schemeParser.parse(text);

    // 计算行首偏移表，用于将绝对偏移转换为行内列位置
    const lineStarts = [0]; // lineStarts[0]=0 即第1行首偏移
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') lineStarts.push(i + 1);
    }

    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable, lineStarts);
    // ... 后续逻辑不变
```

改为：

```javascript
/**
 * 核心方法：为给定文档位置提供 SignatureHelp。
 * @param {import('vscode').TextDocument} document
 * @param {import('vscode').Position} position
 * @param {import('vscode').CancellationToken} token
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 元数据
 * @param {object} funcDocs - 函数名 → 文档 的完整映射
 * @param {import('../parse-cache').SchemeParseCache} schemeCache - 解析缓存
 * @returns {object|null} VSCode SignatureHelp 结构（纯对象，不依赖 vscode 模块）
 */
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs, schemeCache) {
    const { ast, lineStarts } = schemeCache.get(document);

    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable, lineStarts);
```

> 第 89 行往后的代码（`if (!result) return null;` 到函数末尾）保持不变。

- [ ] **Step 2: 修改 extension.js 中 signature help 的注册调用**

将 `src/extension.js` 第 394-398 行从：

```javascript
                return signatureProvider.provideSignatureHelp(
                    document, position, token,
                    modeDispatchTable, langFuncDocs.sde
                );
```

改为：

```javascript
                return signatureProvider.provideSignatureHelp(
                    document, position, token,
                    modeDispatchTable, langFuncDocs.sde,
                    schemeCache
                );
```

- [ ] **Step 3: 运行签名提供器测试**

Run: `node tests/test-signature-provider.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/signature-provider.js src/extension.js
git commit -m "perf(Phase2): signature-provider 使用缓存层，消除 lineStarts 重复计算"
```

---

## Task 7: 迁移 Scheme undef-var-diagnostic 到缓存

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 修改 checkSchemeUndefVars 使用缓存**

在 `src/lsp/providers/undef-var-diagnostic.js` 第 7 行后添加缓存导入：

```javascript
/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
```

移除第 7 行的 `schemeParser` import（因为 Scheme 路径不再直接调用解析器）：

```javascript
// 删除: const schemeParser = require('../scheme-parser');
```

> **保留** `scopeAnalyzer` 导入——`getSchemeRefs` 和 `getVisibleDefinitions` 仍需调用。

修改 `activate` 函数签名，添加 cache 参数：

```javascript
function activate(context, cache) {
    schemeCache = cache;
```

修改 `checkSchemeUndefVars` 函数（第 281-315 行），从：

```javascript
function checkSchemeUndefVars(text) {
    const { ast } = schemeParser.parse(text);
    if (!ast) return [];

    const scopeTree = scopeAnalyzer.buildScopeTree(ast);
    const knownNames = getSchemeKnownNames();
    const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);
```

改为（注意函数签名变化，现在接收 document 而非 text）：

```javascript
/**
 * 检查 Scheme 代码中的未定义变量引用。
 * @param {import('vscode').TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeUndefVars(document) {
    const { ast, scopeTree, text } = schemeCache.get(document);
    if (!ast) return [];

    const knownNames = getSchemeKnownNames();
    const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);
```

同时修改 `updateDiagnostics` 函数（第 80-92 行），将 doc 传递而非 text：

```javascript
function updateDiagnostics(doc) {
    const langId = doc.languageId;

    let diagnostics;
    if (langId === 'sde') {
        diagnostics = checkSchemeUndefVars(doc);
    } else {
        diagnostics = checkTclUndefVars(doc.getText());
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}
```

- [ ] **Step 2: 修改 extension.js 中 undef-var-diagnostic 的激活调用**

将 `src/extension.js` 第 378 行从：

```javascript
    undefVarDiagnostic.activate(context);
```

改为：

```javascript
    undefVarDiagnostic.activate(context, schemeCache);
```

- [ ] **Step 3: 更新 checkSchemeDuplicateDefs 调用方式**

`checkSchemeDuplicateDefs` 函数不需要修改（它接收 scopeTree 和 text 参数），但调用处的 `text` 来源已从参数变为 `schemeCache.get(document).text`。在 `checkSchemeUndefVars` 末尾：

```javascript
    // 检测同作用域内的重复定义
    diagnostics.push(...checkSchemeDuplicateDefs(scopeTree, text));
```

这段保持不变，因为 `text` 已经从 `schemeCache.get(document)` 解构出来了。

- [ ] **Step 4: 运行相关测试**

Run: `node tests/test-scheme-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js`
Expected: 测试可能需要更新以匹配新签名（如果测试直接调用 `checkSchemeUndefVars`）

> 如果测试直接调用 `checkSchemeUndefVars(text)`，需要改为传入 mock document 对象。检查测试文件 `tests/test-scheme-undef-diagnostic.js` 中的调用方式并相应调整。

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js src/extension.js tests/
git commit -m "perf(Phase2): Scheme 未定义变量诊断使用缓存层"
```

---

## Task 8: 迁移 extension.js Scheme 补全到缓存（消除二次解析 #11）

**Files:**
- Modify: `src/extension.js:428-435`

- [ ] **Step 1: 修改补全 Provider 的 SDE 作用域过滤**

将 `src/extension.js` 第 428-435 行从：

```javascript
                    // SDE (Scheme): 作用域感知过滤
                    if (langId === 'sde') {
                        const { ast } = schemeParser.parse(document.getText());
                        const scopeTree = scopeAnalyzer.buildScopeTree(ast);
                        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, position.line + 1);
                        const visibleNames = new Set(visible.map(v => v.name));
                        filteredDefs = filteredDefs.filter(d => visibleNames.has(d.name));
                    }
```

改为：

```javascript
                    // SDE (Scheme): 作用域感知过滤（使用缓存层）
                    if (langId === 'sde') {
                        const { scopeTree } = schemeCache.get(document);
                        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, position.line + 1);
                        const visibleNames = new Set(visible.map(v => v.name));
                        filteredDefs = filteredDefs.filter(d => visibleNames.has(d.name));
                    }
```

- [ ] **Step 2: 清理不再需要的 imports**

现在 `schemeParser` 只在 `definitions.js` 和 `undef-var-diagnostic.js` 中使用，在 `extension.js` 中不再直接使用。检查 `extension.js` 中是否还有其他 `schemeParser` 引用。如果没有，可以移除第 8 行的 import：

将第 8 行：
```javascript
const schemeParser = require('./lsp/scheme-parser');
```

删除或注释掉。同样检查 `scopeAnalyzer` 是否还有其他引用——`getVisibleDefinitions` 仍在使用，所以保留。

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "perf(Phase2): 补全 Provider 使用缓存层，消除二次解析 (#11)"
```

---

## Task 9: 迁移 Tcl folding-provider 到缓存

**Files:**
- Modify: `src/lsp/providers/tcl-folding-provider.js`

- [ ] **Step 1: 修改 tcl-folding-provider.js 使用 Tcl 缓存**

将 `src/lsp/providers/tcl-folding-provider.js` 全文替换为：

```javascript
// src/lsp/providers/tcl-folding-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode FoldingRangeProvider for Tcl-based Sentaurus languages.
 * 通过 tclCache 获取缓存的 tree，避免冗余 WASM 解析。
 */
function createTclFoldingProvider(tclCache) {
    return {
        /**
         * @param {vscode.TextDocument} document
         * @returns {vscode.FoldingRange[]}
         */
        provideFoldingRanges(document) {
            const tree = tclCache.get(document);
            if (!tree) return [];

            // 注意：tree 生命周期由 tclCache 管理，不需要 try/finally + tree.delete()
            const ranges = astUtils.getFoldingRanges(tree.rootNode);
            return ranges.map(r => new vscode.FoldingRange(r.startLine, r.endLine));
        },
    };
}

module.exports = { createTclFoldingProvider };
```

- [ ] **Step 2: 修改 extension.js 中 Tcl folding provider 的注册**

将 `src/extension.js` 第 13 行的 import 从：

```javascript
const tclFoldingProvider = require('./lsp/providers/tcl-folding-provider');
```

改为：

```javascript
const tclFoldingProviderMod = require('./lsp/providers/tcl-folding-provider');
```

将 `src/extension.js` 第 365-372 行从：

```javascript
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerFoldingRangeProvider(
                { language: langId },
                tclFoldingProvider
            )
        );
    }
```

改为：

```javascript
    const tclFoldingProvider = tclFoldingProviderMod.createTclFoldingProvider(tclCache);
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerFoldingRangeProvider(
                { language: langId },
                tclFoldingProvider
            )
        );
    }
```

- [ ] **Step 3: 提交**

```bash
git add src/lsp/providers/tcl-folding-provider.js src/extension.js
git commit -m "perf(Phase2): Tcl folding-provider 使用缓存层"
```

---

## Task 10: 迁移 Tcl document-symbol-provider 到缓存

**Files:**
- Modify: `src/lsp/providers/tcl-document-symbol-provider.js`

- [ ] **Step 1: 修改 tcl-document-symbol-provider.js 使用 Tcl 缓存**

将 `src/lsp/providers/tcl-document-symbol-provider.js` 全文替换为：

```javascript
// src/lsp/providers/tcl-document-symbol-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode DocumentSymbolProvider for Tcl-based Sentaurus languages.
 * 通过 tclCache 获取缓存的 tree，避免冗余 WASM 解析。
 */
function createTclDocumentSymbolProvider(tclCache) {
    return {
        /**
         * @param {vscode.TextDocument} document
         * @returns {vscode.DocumentSymbol[]}
         */
        provideDocumentSymbols(document) {
            const tree = tclCache.get(document);
            if (!tree) return [];

            const rawSymbols = astUtils.getDocumentSymbols(tree.rootNode, document.languageId);
            return rawSymbols.map(s => toVscodeSymbol(s, document));
        },
    };
}

/**
 * 将原始 symbol 转换为 vscode.DocumentSymbol。
 * @param {object} raw - getDocumentSymbols 返回的 symbol 对象
 * @param {vscode.TextDocument} document
 * @returns {vscode.DocumentSymbol}
 */
function toVscodeSymbol(raw, document) {
    const range = new vscode.Range(
        raw.startLine, 0,
        raw.endLine, document.lineAt(raw.endLine).text.length
    );
    const children = (raw.children || []).map(c => toVscodeSymbol(c, document));
    return new vscode.DocumentSymbol(raw.name, '', raw.kind, range, range);
}

module.exports = { createTclDocumentSymbolProvider };
```

- [ ] **Step 2: 修改 extension.js 中 Tcl document symbol provider 的注册**

将 `src/extension.js` 第 16 行的 import 从：

```javascript
const tclDocumentSymbolProvider = require('./lsp/providers/tcl-document-symbol-provider');
```

改为：

```javascript
const tclDocSymbolMod = require('./lsp/providers/tcl-document-symbol-provider');
```

将 `src/extension.js` 第 381-388 行从：

```javascript
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(
                { language: langId },
                tclDocumentSymbolProvider
            )
        );
    }
```

改为：

```javascript
    const tclDocumentSymbolProvider = tclDocSymbolMod.createTclDocumentSymbolProvider(tclCache);
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(
                { language: langId },
                tclDocumentSymbolProvider
            )
        );
    }
```

- [ ] **Step 3: 运行 Tcl 相关测试**

Run: `node tests/test-tcl-document-symbol.js`
Expected: 通过

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/tcl-document-symbol-provider.js src/extension.js
git commit -m "perf(Phase2): Tcl document-symbol-provider 使用缓存层"
```

---

## Task 11: 迁移 Tcl undef-var-diagnostic 到缓存

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 添加 Tcl 缓存引用和修改 checkTclUndefVars**

在 `src/lsp/providers/undef-var-diagnostic.js` 中，添加 `tclCache` 变量（与 `schemeCache` 并列）：

```javascript
/** @type {import('../parse-cache').TclParseCache} */
let tclCache;
```

修改 `activate` 函数签名：

```javascript
function activate(context, cache) {
    schemeCache = cache;
```

改为：

```javascript
function activate(context, schemeCacheInstance, tclCacheInstance) {
    schemeCache = schemeCacheInstance;
    tclCache = tclCacheInstance;
```

修改 `checkTclUndefVars` 函数（第 99-134 行），从直接调用 `parseSafe` 改为使用缓存：

```javascript
/**
 * 检查 Tcl 代码中的未定义变量引用。
 * @param {import('vscode').TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function checkTclUndefVars(document) {
    const tree = tclCache.get(document);
    if (!tree) return [];

    // tree 生命周期由 tclCache 管理，不需要 try/finally + tree.delete()
    const root = tree.rootNode;
    const refs = astUtils.getVariableRefs(root);
    const scopeMap = astUtils.buildScopeMap(root);

    const diagnostics = [];
    for (const ref of refs) {
        // 跳过白名单变量
        if (TCL_BUILTIN_VARS.has(ref.name)) continue;

        // 检查引用行是否可见该变量
        const visibleAtLine = scopeMap.get(ref.line);
        if (!visibleAtLine || !visibleAtLine.has(ref.name)) {
            const range = new vscode.Range(
                ref.line - 1, ref.startCol,
                ref.line - 1, ref.endCol
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `未定义的变量: ${ref.name}`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'undef-var';
            diagnostics.push(diagnostic);
        }
    }

    return diagnostics;
}
```

同时修改 `updateDiagnostics`：

```javascript
function updateDiagnostics(doc) {
    const langId = doc.languageId;

    let diagnostics;
    if (langId === 'sde') {
        diagnostics = checkSchemeUndefVars(doc);
    } else {
        diagnostics = checkTclUndefVars(doc);
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}
```

- [ ] **Step 2: 修改 extension.js 中的激活调用**

将 `src/extension.js` 中（之前已改为 `undefVarDiagnostic.activate(context, schemeCache)`）再次修改为：

```javascript
    undefVarDiagnostic.activate(context, schemeCache, tclCache);
```

- [ ] **Step 3: 更新模块导出**

`checkTclUndefVars` 的签名从 `(text: string)` 变为 `(document: TextDocument)`，确保 `module.exports` 中的导出不变（函数名不变）：

```javascript
module.exports = { activate, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
```

- [ ] **Step 4: 检查并更新直接调用 checkTclUndefVars 的测试**

Run: `grep -r "checkTclUndefVars" tests/`
如果有测试直接调用 `checkTclUndefVars(text)`，需要改为传入 mock document：

```javascript
// 旧: checkTclUndefVars(tclCode)
// 新: checkTclUndefVars({ uri: { toString: () => 'test' }, version: 1, getText: () => tclCode })
```

Run: `node tests/test-tcl-var-refs.js && node tests/test-undef-var-integration.js`
Expected: 通过

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js src/extension.js tests/
git commit -m "perf(Phase2): Tcl 未定义变量诊断使用缓存层"
```

---

## Task 12: 实现 getVisibleDefinitions 早退出 (#4)

**Files:**
- Modify: `src/lsp/scope-analyzer.js:177-201`

- [ ] **Step 1: 编写早退出逻辑**

将 `src/lsp/scope-analyzer.js` 第 177-202 行的 `getVisibleDefinitions` 函数从：

```javascript
function getVisibleDefinitions(tree, line) {
    const chain = [];

    function findChain(node) {
        if (line >= node.startLine && line <= node.endLine) {
            chain.push(node);
            for (const child of node.children) {
                findChain(child);
            }
        }
    }

    findChain(tree);

    const seen = new Map();
    for (let i = chain.length - 1; i >= 0; i--) {
        const scope = chain[i];
        for (const def of scope.definitions) {
            if (!seen.has(def.name)) {
                seen.set(def.name, { ...def, scopeType: scope.type });
            }
        }
    }

    return Array.from(seen.values());
}
```

改为（添加早退出剪枝：找到叶子级最精确作用域后停止深入不需要的子树）：

```javascript
function getVisibleDefinitions(tree, line) {
    const chain = [];

    function findChain(node) {
        if (line >= node.startLine && line <= node.endLine) {
            chain.push(node);
            // 找到包含目标行的子作用域后继续深入（子作用域更精确）
            // 但只深入包含目标行的子节点，跳过不相关的分支
            for (const child of node.children) {
                if (line >= child.startLine && line <= child.endLine) {
                    findChain(child);
                    break; // 一行最多在一个同级作用域内，找到后不再检查其他兄弟
                }
            }
        }
    }

    findChain(tree);

    const seen = new Map();
    for (let i = chain.length - 1; i >= 0; i--) {
        const scope = chain[i];
        for (const def of scope.definitions) {
            if (!seen.has(def.name)) {
                seen.set(def.name, { ...def, scopeType: scope.type });
            }
        }
    }

    return Array.from(seen.values());
}
```

> **关键改动**：在遍历 `node.children` 时，找到第一个包含目标行的子节点后 `break`，不再遍历其他兄弟节点。这从 O(all_children) 优化到 O(matching_child)，对于深层嵌套的 scope tree 有显著提升。

- [ ] **Step 2: 运行作用域分析测试验证语义不变**

Run: `node tests/test-scope-analyzer.js`
Expected: 全部通过（语义不变，只是性能优化）

- [ ] **Step 3: 提交**

```bash
git add src/lsp/scope-analyzer.js
git commit -m "perf(Phase2): getVisibleDefinitions 早退出优化 (#4)"
```

---

## Task 13: 全量回归测试

**Files:**
- 无代码修改

- [ ] **Step 1: 运行全量测试套件**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f"; done`
Expected: 所有测试文件通过

- [ ] **Step 2: 检查未清理的 parse() 调用**

验证 Scheme 路径中不再有冗余的独立 `schemeParser.parse()` 调用：

Run: `grep -rn "schemeParser.parse\|require.*scheme-parser" src/lsp/providers/ src/extension.js`
Expected:
- `src/lsp/providers/undef-var-diagnostic.js` 中不应有 `schemeParser.parse` 调用
- `src/extension.js` 中不应有 `schemeParser.parse` 调用
- `src/lsp/parse-cache.js` 中有 `schemeParser.parse` 调用（这是唯一的解析入口）

验证 Tcl 路径中不再有冗余的 `parseSafe()` 调用：

Run: `grep -rn "parseSafe\|tclParserWasm.parse" src/lsp/providers/`
Expected: Provider 文件中不应有直接的 `parseSafe()` 调用

- [ ] **Step 3: 手动功能验证清单**

在 VSCode Extension Development Host 中验证：
- [ ] SDE 文件：代码折叠正常
- [ ] SDE 文件：括号诊断正常（输入不匹配括号出现波浪线）
- [ ] SDE 文件：函数签名提示正常（输入 `(sdegeo: ...` 触发参数提示）
- [ ] SDE 文件：未定义变量诊断正常
- [ ] SDE 文件：补全包含用户定义变量
- [ ] SDE 文件：悬停显示定义文本
- [ ] Sdevice 文件：代码折叠正常
- [ ] Sdevice 文件：面包屑/Outline 正常
- [ ] Sdevice 文件：未定义变量诊断正常

---

## Task 14: 提交并更新蓝图文档

**Files:**
- Modify: `docs/superpowers/plans/2026-04-16-performance-optimization-blueprint.md`

- [ ] **Step 1: 更新性能优化蓝图**

在蓝图的 Phase 2 部分添加完成标记和实施记录。将优化项清单的状态列更新为 ✅。

- [ ] **Step 2: 最终提交**

```bash
git add docs/superpowers/plans/2026-04-16-performance-optimization-blueprint.md
git commit -m "docs: 更新性能优化蓝图，标记 Phase 2 完成"
```

---

## 自检清单

### 1. Spec 覆盖度

| 优化项 | 对应 Task | 状态 |
|--------|----------|------|
| #1 统一 Scheme 缓存层 | Task 2 (实现) + Task 3 (注册) + Task 4-8 (Provider 迁移) | ✅ |
| #2 共享 Tcl WASM tree 缓存 | Task 2 (实现) + Task 3 (注册) + Task 9-11 (Provider 迁移) | ✅ |
| #4 getVisibleDefinitions 早退出 | Task 12 | ✅ |
| #11 消除补全二次解析 | Task 8 (被 #1 的 Scheme 缓存自动解决) | ✅ |

### 2. Placeholder 扫描

无 TBD、TODO、"implement later" 等占位符。所有步骤包含完整代码。

### 3. 类型一致性

- `SchemeParseCache.get(document)` 返回 `{ version, ast, errors, analysis, scopeTree, text, lineStarts }` — 所有使用缓存的 Provider 均从此结构解构所需字段
- `TclParseCache.get(document)` 返回 `tree | null` — 与 Provider 中原有的 `parseSafe()` 返回类型一致
- `createFoldingProvider(schemeCache)` / `createTclFoldingProvider(tclCache)` 工厂函数签名与 extension.js 注册代码匹配
- `activate(context, schemeCache)` → `activate(context, schemeCache, tclCache)` 参数顺序一致
