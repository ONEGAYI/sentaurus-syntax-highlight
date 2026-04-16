# Phase 1 Quick Wins 性能优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用最小改动消除已知的低效代码和内存泄漏，为 Phase 2 统一缓存层打下基础。

**Architecture:** 5 个独立优化项，互不依赖，可按任意顺序实施。每项改动不超过 15 行，语义等价替换或新增清理逻辑。核心思路：O(n²)→O(n) 算法修复、内存泄漏修复、常量优化、去抖统一。

**Tech Stack:** 纯 JavaScript (CommonJS), VSCode Extension API, web-tree-sitter WASM

**Blueprint:** 本计划对应 `docs/superpowers/plans/2026-04-16-performance-optimization-blueprint.md` Phase 1 章节。

---

## 文件结构

| 文件 | 操作 | 负责优化项 |
|------|------|-----------|
| `src/lsp/providers/bracket-diagnostic.js:12` | 修改 | #14 去抖统一 |
| `src/lsp/scope-analyzer.js:238-248` | 修改 | #10 Set 复制优化 |
| `src/extension.js:413-418` | 修改 | #5 补全去重 |
| `src/definitions.js:99-101,118-126` | 修改 | #8 缓存清理 |
| `src/extension.js:252` (新增) | 修改 | #8 注册 onDidCloseTextDocument |
| `src/lsp/tcl-parser-wasm.js:249-254` | 修改 | #9 dispose 导出 |
| `src/extension.js:702` | 修改 | #9 deactivate 实现 |
| `tests/test-definitions.js:211-251` | 修改 | #8 新增缓存清理测试 |

---

### Task 1: #14 统一 bracket-diagnostic 去抖为 500ms

**Files:**
- Modify: `src/lsp/providers/bracket-diagnostic.js:12`

**背景:** `bracket-diagnostic.js` 使用 300ms 去抖，而 `undef-var-diagnostic.js` 和 `tcl-bracket-diagnostic.js` 均使用 500ms。统一为 500ms 减少不必要的频繁触发。

- [ ] **Step 1: 修改 DEBOUNCE_MS 常量**

在 `src/lsp/providers/bracket-diagnostic.js` 第 12 行，将 `300` 改为 `500`：

```javascript
// 修改前:
const DEBOUNCE_MS = 300;

// 修改后:
const DEBOUNCE_MS = 500;
```

- [ ] **Step 2: 运行相关测试确认无回归**

Run: `node tests/test-scheme-parser.js && node tests/test-definitions.js`
Expected: 全部 PASS（bracket-diagnostic 无独立测试文件，通过其他测试确认扩展功能正常）

- [ ] **Step 3: 提交**

```bash
git add src/lsp/providers/bracket-diagnostic.js
git commit -m "perf: 统一 bracket-diagnostic 去抖为 500ms 与其他诊断一致"
```

---

### Task 2: #10 避免 getSchemeRefs 中不必要的 Set 复制

**Files:**
- Modify: `src/lsp/scope-analyzer.js:238-248`

**背景:** `getSchemeRefs()` 每次调用都执行 `new Set(SCHEME_SPECIAL_FORMS)` 创建副本。当 `knownNames` 参数为空时（大多数调用场景），这个复制是不必要的。`SCHEME_SPECIAL_FORMS` 已经是 `new Set()`（第 207 行），且 `_collectRefs` 只读取 `excluded`，不修改它。

- [ ] **Step 1: 修改 getSchemeRefs 函数**

在 `src/lsp/scope-analyzer.js` 第 238-248 行，替换整个函数体：

```javascript
// 修改前 (第 238-248 行):
function getSchemeRefs(ast, knownNames) {
    const refs = [];
    // 合并排除集合 — 不修改原始 SCHEME_SPECIAL_FORMS
    const excluded = new Set(SCHEME_SPECIAL_FORMS);
    if (knownNames) {
        for (const name of knownNames) {
            excluded.add(name);
        }
    }
    _collectRefs(ast, refs, excluded);
    return refs;
}

// 修改后:
function getSchemeRefs(ast, knownNames) {
    const refs = [];
    // 无额外名称时直接复用常量 Set，避免 60+ 元素的复制
    let excluded = SCHEME_SPECIAL_FORMS;
    if (knownNames) {
        excluded = new Set(SCHEME_SPECIAL_FORMS);
        for (const name of knownNames) {
            excluded.add(name);
        }
    }
    _collectRefs(ast, refs, excluded);
    return refs;
}
```

- [ ] **Step 2: 运行 scope-analyzer 和相关测试**

Run: `node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js`
Expected: 全部 PASS

- [ ] **Step 3: 提交**

```bash
git add src/lsp/scope-analyzer.js
git commit -m "perf: getSchemeRefs 无额外名称时直接复用 SCHEME_SPECIAL_FORMS Set"
```

---

### Task 3: #5 补全去重从 O(n²) 优化到 O(n)

**Files:**
- Modify: `src/extension.js:413-418`

**背景:** 当前补全 Provider 对用户变量做两次 `.filter()`：
1. 第一轮 `filter(!staticNames.has(d.name))` — O(n)，排除与静态关键词同名
2. 第二轮 `filter((d, i, arr) => arr.findIndex(...))` — O(n²)，同名用户变量去重

优化为单次 O(n) 遍历，用一个 `seenNames` Set 同时完成两个过滤。

- [ ] **Step 1: 替换去重逻辑**

在 `src/extension.js` 第 413-418 行，替换去重代码：

```javascript
// 修改前 (第 413-418 行):
                    // 去重：跳过与静态关键词同名的用户变量
                    const staticNames = new Set(items.map(it => it.label));
                    let filteredDefs = userDefs
                        .filter(d => !staticNames.has(d.name))
                        // 同名变量可能在多处定义，去重
                        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);

// 修改后:
                    // 单次遍历去重：同时排除静态关键词和重复用户变量
                    const seenNames = new Set(items.map(it => it.label));
                    let filteredDefs = userDefs.filter(d => {
                        if (seenNames.has(d.name)) return false;
                        seenNames.add(d.name);
                        return true;
                    });
```

注意：保持后续第 420-427 行（SDE 作用域感知过滤）不变。

- [ ] **Step 2: 运行全量测试**

Run: `node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js`
Expected: 全部 PASS

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "perf: 补全去重从 O(n²) 优化到 O(n) 单次遍历"
```

---

### Task 4: #8 关闭文件时清理定义缓存

**Files:**
- Modify: `src/definitions.js:99-101,118-126`
- Modify: `src/extension.js:252` (新增注册)
- Modify: `tests/test-definitions.js:211-251` (新增测试)

**背景:** `_defCache`（Map）只增不减。在长编辑会话中打开多个文件后，已关闭文件的缓存条目永不释放，造成内存泄漏。需要在文件关闭时主动删除对应条目。

- [ ] **Step 1: 在 definitions.js 中新增 invalidateDefinitionCache 函数和导出**

在 `src/definitions.js` 第 101 行 `clearDefinitionCache` 函数之后，添加新函数：

```javascript
/** 清空缓存（测试用）。 */
function clearDefinitionCache() {
    _defCache.clear();
}

/** 删除指定 URI 的缓存条目（文件关闭时调用）。 */
function invalidateDefinitionCache(uri) {
    _defCache.delete(uri);
}
```

在 `src/definitions.js` 的 `module.exports` 中（第 118-126 行）添加 `invalidateDefinitionCache`：

```javascript
// 修改前:
module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
    truncateDefinitionText,
};

// 修改后:
module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
    invalidateDefinitionCache,
    truncateDefinitionText,
};
```

- [ ] **Step 2: 编写测试**

在 `tests/test-definitions.js` 中：

a) 第 3 行的 `require` 解构中添加 `invalidateDefinitionCache`：

```javascript
// 修改前:
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitionsAst, extractDefinitions, getDefinitions, clearDefinitionCache, truncateDefinitionText } = require('../src/definitions');

// 修改后:
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitionsAst, extractDefinitions, getDefinitions, clearDefinitionCache, invalidateDefinitionCache, truncateDefinitionText } = require('../src/definitions');
```

b) 在第 248 行（`版本变化重新扫描` 测试之后，`console.log(结果...)` 之前）插入新测试组：

```javascript
console.log('\ninvalidateDefinitionCache:');

test('删除指定 URI 缓存条目', () => {
    clearDefinitionCache();
    const doc1 = mockDoc('(define x 1)', 1, 'file:///test-inv-a.sde');
    const doc2 = mockDoc('(define y 2)', 1, 'file:///test-inv-b.sde');

    const d1 = getDefinitions(doc1, 'sde');
    const d2 = getDefinitions(doc2, 'sde');

    invalidateDefinitionCache('file:///test-inv-a.sde');

    // doc2 应该仍命中缓存（同一引用）
    const d2Again = getDefinitions(doc2, 'sde');
    assert.strictEqual(d2, d2Again, 'doc2 应返回同一缓存对象');

    // doc1 应重新解析（新对象）
    const d1Again = getDefinitions(doc1, 'sde');
    assert.notStrictEqual(d1, d1Again, 'doc1 在 invalidation 后应重新解析');

    clearDefinitionCache();
});

test('删除不存在的 URI 不报错', () => {
    clearDefinitionCache();
    assert.doesNotThrow(() => {
        invalidateDefinitionCache('file:///nonexistent.sde');
    });
    clearDefinitionCache();
});
```

- [ ] **Step 3: 运行测试验证通过**

Run: `node tests/test-definitions.js`
Expected: 全部 PASS，包括新的 `invalidateDefinitionCache` 测试组

- [ ] **Step 4: 在 extension.js 中注册 onDidCloseTextDocument 监听**

在 `src/extension.js` 中，找到 WASM 初始化结束的位置。在第 251 行 `});`（tclParserWasm.init 的 .catch 结束）之后、第 254 行 `context.subscriptions.push(`（注册 testTclWasm 命令）之前，插入：

```javascript
    // ── 文件关闭时清理缓存 ──────────────────────────
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            defs.invalidateDefinitionCache(doc.uri.toString());
        })
    );
```

- [ ] **Step 5: 运行全量测试验证**

Run: `node tests/test-definitions.js`
Expected: 全部 PASS

- [ ] **Step 6: 提交**

```bash
git add src/definitions.js src/extension.js tests/test-definitions.js
git commit -m "perf: 关闭文件时清理定义缓存，修复内存泄漏"
```

---

### Task 5: #9 实现 deactivate() 资源释放

**Files:**
- Modify: `src/lsp/tcl-parser-wasm.js:249-254`
- Modify: `src/extension.js:702`

**背景:** 当前 `deactivate()` 是空函数。需要清理：
1. `_defCache` — 调用已有的 `clearDefinitionCache()`
2. WASM 解析器资源（`_parser`, `_tclLanguage`, `_initPromise`, `_outputChannel`）
3. `tclWasmChannel` OutputChannel（通过 WASM 模块的 dispose 间接释放）

`context.subscriptions` 中的 Provider 和事件监听由 VSCode 自动释放，无需手动处理。

- [ ] **Step 1: 在 tcl-parser-wasm.js 中添加 dispose 函数和导出**

在 `src/lsp/tcl-parser-wasm.js` 第 247 行 `isReady()` 函数之后，添加：

```javascript
/**
 * 释放 WASM 解析器资源（扩展 deactivate 时调用）。
 */
function dispose() {
    if (_outputChannel) {
        _outputChannel.dispose();
        _outputChannel = null;
    }
    _parser = null;
    _tclLanguage = null;
    _initPromise = null;
}
```

修改 `module.exports`（第 249-254 行）：

```javascript
// 修改前:
module.exports = {
    init,
    parse,
    parseWithDebug,
    isReady,
};

// 修改后:
module.exports = {
    init,
    parse,
    parseWithDebug,
    isReady,
    dispose,
};
```

- [ ] **Step 2: 实现 deactivate() 函数体**

在 `src/extension.js` 第 702 行，替换空函数：

```javascript
// 修改前:
function deactivate() {}

// 修改后:
function deactivate() {
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}
```

- [ ] **Step 3: 运行全量测试**

Run: `node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-scheme-parser.js && node tests/test-signature-provider.js && node tests/test-snippet-prefixes.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-var-refs.js`
Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add src/lsp/tcl-parser-wasm.js src/extension.js
git commit -m "perf: 实现 deactivate() 释放定义缓存和 WASM 资源"
```

---

### Task 6: 全量回归测试与基准复测

**Files:**
- 无代码变更，仅验证

- [ ] **Step 1: 运行所有测试**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f"; done`
Expected: 所有测试文件全部 PASS

- [ ] **Step 2: 运行基准测试对比**

Run: `node tests/benchmark.js --iterations 5 --json benchmarks/phase1-after.json`
Expected: 与 Phase 1 前 baseline 对比，Scheme 管线数据基本不变（Phase 1 不改变解析管线），内存占用在多次打开/关闭文件后不再增长。

- [ ] **Step 3: 手动验证 VSCode 扩展功能**

测试流程：
1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/` 目录下的各语言文件
3. 验证补全、悬停、折叠、诊断功能正常
4. 关闭文件后再重新打开，验证缓存已正确重建
5. 重新加载窗口验证 deactivate/reactivate 正常

- [ ] **Step 4: 确认 git 状态干净**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 自检清单

### 1. Spec 覆盖

| 蓝图优化项 | 对应 Task | 状态 |
|-----------|----------|------|
| #5 补全去重 O(n²)→O(n) | Task 3 | ✓ |
| #8 关闭文件清缓存 | Task 4 | ✓ |
| #9 deactivate() 清理 | Task 5 | ✓ |
| #10 预构建 Set | Task 2 | ✓ |
| #14 统一去抖 | Task 1 | ✓ |

### 2. Placeholder 扫描

无 TBD/TODO/"implement later"/"add error handling"/"similar to Task N"。

### 3. 类型一致性

- `invalidateDefinitionCache(uri)` 参数为 `string`，调用处使用 `doc.uri.toString()` ✓
- `tclParserWasm.dispose()` 无参数，直接调用 ✓
- `defs.clearDefinitionCache()` 已有导出，直接调用 ✓
- Task 4 的 `mockDoc()` 辅助函数（第 214-220 行）签名与新增测试兼容 ✓
