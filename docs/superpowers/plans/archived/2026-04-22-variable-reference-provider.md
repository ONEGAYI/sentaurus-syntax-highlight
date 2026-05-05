# 用户自定义变量引用查找 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有 6 种支持语言实现作用域感知的用户变量 Find All References 功能。

**Architecture:** 创建 `variable-reference-provider.js`，复用已有的 scope-analyzer（Scheme）和 tcl-ast-utils（Tcl）基础设施。Scheme 侧利用 `getVisibleDefinitions` 的作用域链解析能力，Tcl 侧新增 `ScopeIndex.resolveDefinition()` 方法。Provider 根据 `document.languageId` 分发到对应逻辑。

**Tech Stack:** 纯 CommonJS（无构建步骤），VSCode Extension API（ReferenceProvider），web-tree-sitter（Tcl AST）

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 新建 | `src/lsp/providers/variable-reference-provider.js` | Provider 实现：注册 + Scheme/Tcl 分发 |
| 修改 | `src/lsp/tcl-ast-utils.js:242-306` | ScopeIndex 类新增 `resolveDefinition` 方法 |
| 修改 | `src/extension.js:479-480` | 导入并注册新 Provider |
| 新建 | `tests/test-variable-reference.js` | Provider 核心逻辑的单元测试 |

---

### Task 1: 为 ScopeIndex 添加 `resolveDefinition` 方法

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js` (ScopeIndex 类, 第 306 行后)
- Test: `tests/test-tcl-scope-index.js`

- [ ] **Step 1: 在 `ScopeIndex` 类中添加 `resolveDefinition` 方法**

在 `src/lsp/tcl-ast-utils.js` 的 `ScopeIndex` 类的 `getVisibleAt` 方法之后、类闭合 `}` 之前（约第 306 行），添加：

```javascript
    /**
     * 解析变量名在指定行号（1-based）处的定义来源。
     * @param {string} name - 变量名
     * @param {number} line - 1-based 行号
     * @returns {{ defLine: number, scope: string } | null}
     */
    resolveDefinition(name, line) {
        const proc = this._procScopes.find(p => line >= p.startLine && line <= p.endLine);

        if (proc) {
            const local = proc.localDefs.find(d => d.name === name);
            if (local) return { defLine: local.defLine, scope: 'local' };

            if (proc.scopeImports.includes(name)) {
                const globalDef = this._globalDefs.find(d => d.name === name);
                if (globalDef) return { defLine: globalDef.defLine, scope: 'imported' };
            }

            const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
            if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

            return null;
        }

        const globalDef = this._globalDefs.find(d => d.name === name);
        if (globalDef) return { defLine: globalDef.defLine, scope: 'global' };

        const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
        if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

        return null;
    }
```

- [ ] **Step 2: 为 `resolveDefinition` 编写测试**

在 `tests/test-tcl-scope-index.js` 末尾（`console.log` 汇总行之前）追加测试：

```javascript
console.log('\n=== ScopeIndex.resolveDefinition 测试 ===\n');

// 辅助：构建 proc 节点
function makeProc(name, startRow, endRow, params, localDefs, scopeImports) {
    return makeNode('procedure', `proc ${name}`, [], startRow, 0, endRow, 0);
}

test('resolveDefinition 全局变量', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);
    const index = ast.buildScopeIndex(root);

    const result = index.resolveDefinition('x', 2);
    assert.ok(result, '应找到 x 的定义');
    assert.strictEqual(result.defLine, 1, 'x 在第 1 行定义');
    assert.strictEqual(result.scope, 'global');
});

test('resolveDefinition 全局作用域未定义变量返回 null', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    assert.strictEqual(index.resolveDefinition('unknown', 1), null);
});

test('resolveDefinition proc 内局部变量', () => {
    const paramNode = makeNode('id', 'arg1', [], 2, 6, 2, 10);
    const bodyNode = makeNode('braced_word', '{ set y 5 }', [
        makeNode('set', 'set y 5', [
            makeNode('simple_word', 'set', [], 3, 2, 3, 5),
            makeNode('id', 'y', [], 3, 6, 3, 7),
            makeNode('simple_word', '5', [], 3, 8, 3, 9),
        ], 3, 2, 3, 9),
    ], 3, 0, 3, 12);
    const procNode = makeNode('procedure', 'proc myFunc { arg1 } { body }', [
        makeNode('simple_word', 'proc', [], 2, 0, 2, 4),
        makeNode('word', 'myFunc', [], 2, 5, 2, 11),
        makeNode('braced_word', '{ arg1 }', [paramNode], 2, 12, 2, 20),
        bodyNode,
    ], 2, 0, 3, 12);
    const root = makeNode('program', '', [procNode], 2, 0, 3, 12);
    const index = ast.buildScopeIndex(root);

    const argResult = index.resolveDefinition('arg1', 3);
    assert.ok(argResult, '应找到 arg1 参数定义');
    assert.strictEqual(argResult.scope, 'local');

    const yResult = index.resolveDefinition('y', 3);
    assert.ok(yResult, '应找到 y 的局部定义');
    assert.strictEqual(yResult.scope, 'local');
});
```

- [ ] **Step 3: 运行测试验证通过**

Run: `node tests/test-tcl-scope-index.js`
Expected: 所有测试通过，无 FAIL

- [ ] **Step 4: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-scope-index.js
git commit -m "feat(tcl): 为 ScopeIndex 添加 resolveDefinition 方法"
```

---

### Task 2: 编写 Provider 核心逻辑单元测试

**Files:**
- Create: `tests/test-variable-reference.js`

- [ ] **Step 1: 创建测试文件，编写 Scheme 侧引用查找测试**

```javascript
// tests/test-variable-reference.js
'use strict';

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree, getSchemeRefs, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');

// ===== Scheme 侧：作用域感知引用查找 =====
console.log('\n=== Scheme 变量引用查找测试 ===\n');

/**
 * 模拟 Provider 核心逻辑：给定代码和光标位置，返回匹配的引用 Location 列表。
 * 返回 {name, line, start, end, isDef}[] 供测试断言。
 */
function findVariableRefsScheme(code, cursorLine) {
    const { ast } = parse(code);
    const scopeTree = buildScopeTree(ast);
    const refs = getSchemeRefs(ast, new Set()); // 无额外排除名

    // 获取光标行可见定义
    const visibleAtCursor = getVisibleDefinitions(scopeTree, cursorLine);
    if (visibleAtCursor.length === 0) return [];

    // 选择第一个可见定义作为目标（实际 Provider 会根据光标列精确匹配）
    // 为测试简化：取光标行上出现的标识符名
    const cursorLineRefs = refs.filter(r => r.line === cursorLine);
    if (cursorLineRefs.length === 0) return [];

    const targetName = cursorLineRefs[0].name;
    const targetDef = visibleAtCursor.find(d => d.name === targetName);
    if (!targetDef) return [];

    // 收集定义位置
    const results = [{ name: targetDef.name, line: targetDef.line, start: targetDef.start, end: targetDef.end, isDef: true }];

    // 过滤引用：只保留解析到同一定义的引用
    for (const ref of refs) {
        if (ref.name !== targetName) continue;
        if (ref.line === targetDef.line && ref.start === targetDef.start) continue; // 跳过定义自身
        const refVisible = getVisibleDefinitions(scopeTree, ref.line);
        const resolvesToSame = refVisible.some(d => d.name === targetName && d.line === targetDef.line && d.start === targetDef.start);
        if (resolvesToSame) {
            results.push({ name: ref.name, line: ref.line, start: ref.start, end: ref.end, isDef: false });
        }
    }
    return results;
}

test('全局变量：定义 + 引用', () => {
    const code = '(define x 10)\n(+ x 1)';
    const results = findVariableRefsScheme(code, 2);
    const names = results.map(r => r.name);
    assert.ok(names.every(n => n === 'x'), '所有结果应为 x');
    assert.ok(results.some(r => r.isDef && r.line === 1), '应包含第 1 行定义');
    assert.ok(results.some(r => !r.isDef && r.line === 2), '应包含第 2 行引用');
});

test('同名变量不同作用域应隔离', () => {
    const code = '(define x 10)\n(define (f) (define x 20) x)\nx';
    // 光标在第 3 行（f 内部的 x）→ 只应匹配 f 内的 x 定义
    const resultsInner = findVariableRefsScheme(code, 3);
    const innerLines = resultsInner.map(r => r.line);
    assert.ok(!innerLines.includes(1), 'f 内 x 不应匹配第 1 行全局 x');
    assert.ok(innerLines.includes(3), '应匹配第 3 行的 define x 20');

    // 光标在第 4 行（全局 x）→ 只应匹配全局 x
    const resultsOuter = findVariableRefsScheme(code, 4);
    const outerLines = resultsOuter.map(r => r.line);
    assert.ok(outerLines.includes(1), '全局 x 应匹配第 1 行定义');
    assert.ok(!outerLines.includes(3), '全局 x 不应匹配第 3 行局部 x');
});

test('let 绑定的变量引用', () => {
    const code = '(let ((y 5)) (+ y 1))';
    const results = findVariableRefsScheme(code, 1);
    const yRefs = results.filter(r => r.name === 'y');
    assert.ok(yRefs.length >= 2, 'y 应有定义和引用');
});

test('lambda 参数引用', () => {
    const code = '((lambda (n) (+ n 1)) 42)';
    const results = findVariableRefsScheme(code, 1);
    const nRefs = results.filter(r => r.name === 'n');
    assert.ok(nRefs.length >= 2, 'n 应有参数定义和引用');
});

// ===== Tcl 侧：resolveDefinition 作用域解析 =====
console.log('\n=== Tcl 变量引用查找测试 ===\n');

const tclAst = require('../src/lsp/tcl-ast-utils');

function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type, text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}

test('Tcl 全局变量引用过滤', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const dollarNode = makeNode('variable_substitution', '$x', [], 1, 0, 1, 2);
    const root = makeNode('program', '', [setNode, dollarNode], 0, 0, 1, 2);

    const scopeIndex = tclAst.buildScopeIndex(root);
    const refs = tclAst.getVariableRefs(root);

    const targetDef = scopeIndex.resolveDefinition('x', 2);
    assert.ok(targetDef, '应找到 x 的定义');

    const matchingRefs = refs.filter(r => {
        const refDef = scopeIndex.resolveDefinition(r.name, r.line);
        return refDef && refDef.defLine === targetDef.defLine;
    });
    assert.strictEqual(matchingRefs.length, 1, '应有 1 个匹配引用');
    assert.strictEqual(matchingRefs[0].name, 'x');
});

test('Tcl proc 内同名变量隔离', () => {
    // 全局 set x 1, proc 内 set x 2
    const globalSet = makeNode('set', 'set x 1', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '1', [], 0, 6, 0, 7),
    ], 0, 0, 0, 7);
    const localSet = makeNode('set', 'set x 2', [
        makeNode('simple_word', 'set', [], 3, 2, 3, 5),
        makeNode('id', 'x', [], 3, 6, 3, 7),
        makeNode('simple_word', '2', [], 3, 8, 3, 9),
    ], 3, 2, 3, 9);
    const bodyNode = makeNode('braced_word', '{ set x 2 }', [localSet], 3, 0, 3, 12);
    const procNode = makeNode('procedure', 'proc f {} { body }', [
        makeNode('simple_word', 'proc', [], 2, 0, 2, 4),
        makeNode('word', 'f', [], 2, 5, 2, 6),
        makeNode('braced_word', '{}', [], 2, 7, 2, 9),
        bodyNode,
    ], 2, 0, 3, 12);
    const globalDollar = makeNode('variable_substitution', '$x', [], 5, 0, 5, 2);
    const root = makeNode('program', '', [globalSet, procNode, globalDollar], 0, 0, 5, 2);

    const scopeIndex = tclAst.buildScopeIndex(root);
    const refs = tclAst.getVariableRefs(root);

    // proc 内部 x 应解析到 localDef (第 4 行)
    const innerDef = scopeIndex.resolveDefinition('x', 4);
    assert.ok(innerDef, 'proc 内应找到 x');
    assert.strictEqual(innerDef.defLine, 4, 'proc 内 x 应在第 4 行');

    // 全局 x 应解析到 globalDef (第 1 行)
    const outerDef = scopeIndex.resolveDefinition('x', 6);
    assert.ok(outerDef, '全局应找到 x');
    assert.strictEqual(outerDef.defLine, 1, '全局 x 应在第 1 行');

    // 引用过滤：全局 $x (第 6 行) 应只匹配全局定义
    const globalRefs = refs.filter(r => {
        const refDef = scopeIndex.resolveDefinition(r.name, r.line);
        return refDef && refDef.defLine === 1;
    });
    assert.strictEqual(globalRefs.length, 1, '全局 x 引用只应有 1 个');
    assert.strictEqual(globalRefs[0].line, 6);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试确认全部通过**

Run: `node tests/test-variable-reference.js`
Expected: 所有测试通过

- [ ] **Step 3: 提交测试**

```bash
git add tests/test-variable-reference.js
git commit -m "test: 添加变量引用查找核心逻辑的单元测试"
```

---

### Task 3: 实现 variable-reference-provider.js

**Files:**
- Create: `src/lsp/providers/variable-reference-provider.js`

- [ ] **Step 1: 创建 Provider 文件**

```javascript
// src/lsp/providers/variable-reference-provider.js
'use strict';

const { buildScopeTree, getSchemeRefs, getVisibleDefinitions } = require('../scope-analyzer');
const { getVariableRefs, buildScopeIndex } = require('../tcl-ast-utils');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {import('../parse-cache').TclParseCache} */
let tclCache;
/** @type {object} */
let vscode;

const TCL_LANG_IDS = new Set(['sdevice', 'sprocess', 'emw', 'inspect', 'svisual']);

/**
 * 注册 Find All References Provider（全部 6 种语言）。
 * @param {object} context - vscode.ExtensionContext
 * @param {import('../parse-cache').SchemeParseCache} schemeCacheInstance
 * @param {import('../parse-cache').TclParseCache} tclCacheInstance
 * @param {object} vscodeRef - vscode 模块引用
 */
function activate(context, schemeCacheInstance, tclCacheInstance, vscodeRef) {
    schemeCache = schemeCacheInstance;
    tclCache = tclCacheInstance;
    vscode = vscodeRef;

    const langIds = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];

    for (const langId of langIds) {
        const provider = {
            provideReferences(document, position, options) {
                if (langId === 'sde') {
                    return provideSchemeReferences(document, position, options);
                } else {
                    return provideTclReferences(document, position, options, langId);
                }
            },
        };
        const disposable = vscode.languages.registerReferenceProvider(
            { language: langId },
            provider
        );
        context.subscriptions.push(disposable);
    }
}

/**
 * Scheme（SDE）变量引用查找。
 * 利用 scope-analyzer 的作用域链解析，精确区分同名变量。
 */
function provideSchemeReferences(document, position, options) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, text } = entry;

    // 提取光标处的单词
    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
    if (!range) return null;
    const word = document.getText(range);
    if (!word) return null;

    // 跳过注释行
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    for (let i = 0; i < col; i++) {
        if (lineText[i] === ';') return null;
        if (lineText[i] === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } }
    }

    const cursorLine = position.line + 1; // 1-based
    const scopeTree = buildScopeTree(ast);

    // 获取光标处可见定义，找到匹配 word 的定义
    const visibleDefs = getVisibleDefinitions(scopeTree, cursorLine);
    const targetDef = visibleDefs.find(d => d.name === word);
    if (!targetDef) return null;

    // 收集所有引用，过滤出解析到同一定义的引用
    const refs = getSchemeRefs(ast, new Set());
    const locations = [];

    // 添加定义位置（除非 includeDeclaration === false）
    if (options.includeDeclaration !== false) {
        const lineStarts = getLineStarts(text);
        const defStartCol = targetDef.start - lineStarts[targetDef.line - 1];
        const defEndCol = targetDef.end - lineStarts[targetDef.line - 1];
        locations.push(new vscode.Location(
            document.uri,
            new vscode.Range(targetDef.line - 1, defStartCol, targetDef.line - 1, defEndCol)
        ));
    }

    // 过滤引用
    for (const ref of refs) {
        if (ref.name !== word) continue;
        // 跳过定义自身（已单独添加）
        if (ref.line === targetDef.line && ref.start === targetDef.start && ref.end === targetDef.end) continue;

        const refVisibleDefs = getVisibleDefinitions(scopeTree, ref.line);
        const resolvesToSame = refVisibleDefs.some(d => d.name === word && d.line === targetDef.line && d.start === targetDef.start);
        if (resolvesToSame) {
            const lineStarts = getLineStarts(text);
            const startCol = ref.start - lineStarts[ref.line - 1];
            const endCol = ref.end - lineStarts[ref.line - 1];
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(ref.line - 1, startCol, ref.line - 1, endCol)
            ));
        }
    }

    return locations.length > 0 ? locations : null;
}

/**
 * Tcl（5 种工具）变量引用查找。
 * 利用 ScopeIndex.resolveDefinition 进行作用域解析。
 */
function provideTclReferences(document, position, options) {
    const entry = tclCache.get(document);
    if (!entry || !entry.tree) return null;

    const { tree, text } = entry;
    const root = tree.rootNode;

    // 提取光标处的单词（支持 $varName 形式）
    const dollarRange = document.getWordRangeAtPosition(position, /\$[\w:]+/);
    const plainRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    const range = dollarRange || plainRange;
    if (!range) return null;

    let word = document.getText(range);
    if (!word) return null;

    // 去除 $ 前缀
    if (word.startsWith('$')) {
        word = word.slice(1);
    }
    if (!word) return null;

    // 跳过注释行
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    for (let i = 0; i < col; i++) {
        if (lineText[i] === '#') return null;
        if (lineText[i] === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } }
    }

    const cursorLine = position.line + 1; // 1-based
    const scopeIndex = buildScopeIndex(root);

    // 解析光标处的目标定义
    const targetDef = scopeIndex.resolveDefinition(word, cursorLine);
    if (!targetDef) return null;

    const refs = getVariableRefs(root);
    const locations = [];
    const lineStarts = getLineStarts(text);

    // 添加定义位置
    if (options.includeDeclaration !== false) {
        const defLine0 = targetDef.defLine - 1;
        const defLineText = document.lineAt(defLine0).text;
        // 在定义行中查找变量名位置
        const nameIdx = defLineText.indexOf(word);
        if (nameIdx >= 0) {
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(defLine0, nameIdx, defLine0, nameIdx + word.length)
            ));
        }
    }

    // 过滤引用：只保留解析到同一 defLine 的
    for (const ref of refs) {
        if (ref.name !== word) continue;

        const refDef = scopeIndex.resolveDefinition(ref.name, ref.line);
        if (!refDef || refDef.defLine !== targetDef.defLine) continue;

        // 跳过定义自身
        if (ref.line === targetDef.defLine) continue;

        locations.push(new vscode.Location(
            document.uri,
            new vscode.Range(ref.line - 1, ref.startCol, ref.line - 1, ref.endCol)
        ));
    }

    return locations.length > 0 ? locations : null;
}

function getLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

module.exports = { activate, provideSchemeReferences, provideTclReferences };
```

- [ ] **Step 2: 运行已有测试确认未引入回归**

Run: `node tests/test-variable-reference.js && node tests/test-scheme-var-refs.js && node tests/test-tcl-scope-index.js`
Expected: 全部通过

- [ ] **Step 3: 提交 Provider 实现**

```bash
git add src/lsp/providers/variable-reference-provider.js
git commit -m "feat: 实现用户自定义变量引用查找 Provider"
```

---

### Task 4: 在 extension.js 中注册 Provider

**Files:**
- Modify: `src/extension.js:22` (添加导入)
- Modify: `src/extension.js:479` (添加激活调用)

- [ ] **Step 1: 添加导入**

在 `src/extension.js` 第 22 行（`symbolReferenceProvider` 导入之后）添加：

```javascript
const variableReferenceProvider = require('./lsp/providers/variable-reference-provider');
```

- [ ] **Step 2: 添加激活调用**

在 `src/extension.js` 第 479 行（`symbolReferenceProvider.activate(...)` 之后）添加：

```javascript
    // Find All References — 用户自定义变量（全部 6 种语言）
    variableReferenceProvider.activate(context, schemeCache, tclCache, vscode);
```

- [ ] **Step 3: 运行全量测试确认无回归**

Run: `node tests/test-variable-reference.js && node tests/test-tcl-scope-index.js && node tests/test-scheme-var-refs.js && node tests/test-scope-analyzer.js && node tests/test-definitions.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: 注册用户变量引用查找 Provider"
```

---

### Task 5: 手动验证

**Files:** 无代码变更

- [ ] **Step 1: 启动 Extension Development Host**

在 VSCode 中按 F5 启动扩展开发宿主。

- [ ] **Step 2: 验证 Scheme (SDE)**

1. 打开一个 `*_dvs.cmd` 文件
2. 在一个 `define` 变量上右键 → Find All References
3. 确认结果包含定义 + 所有引用，不包含其他作用域的同名变量
4. 在未定义的标识符上执行 Find All References → 应无结果

- [ ] **Step 3: 验证 Tcl (SDEVICE/SPROCESS 等)**

1. 打开一个 `*_des.cmd` 或 `*_fps.cmd` 文件
2. 在一个 `set` 变量的 `$varName` 上右键 → Find All References
3. 确认结果包含定义 + 所有引用
4. 在 proc 内的同名变量上验证作用域隔离

- [ ] **Step 4: 验证边界情况**

1. 注释行中的变量名 → 应无结果
2. 空文档 → 应无结果
3. `includeDeclaration: false`（Shift+Alt+F12 vs Alt+F12）→ 仅引用不含定义

- [ ] **Step 5: 最终提交（如有修复）**

```bash
git add -A
git commit -m "fix: 修复变量引用查找手动测试发现的问题"
```
