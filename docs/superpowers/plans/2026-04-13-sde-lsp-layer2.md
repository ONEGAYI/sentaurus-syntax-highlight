# SDE LSP Phase 2 Implementation Plan — 定义分类与作用域感知补全

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Phase 1 AST 基础设施之上，为 SDE (Scheme) 实现定义分类（函数 vs 变量）和作用域感知补全（函数参数 + let 绑定可见性）。

**Architecture:** 扩展 `scheme-analyzer.js` 在定义输出中增加 `kind` 字段；新增 `scope-analyzer.js` 基于构建作用域树并提供行级可见性查询；修改 `extension.js` 补全提供器根据 kind 设置图标并根据作用域过滤可见定义。

**Tech Stack:** 纯 JavaScript, CommonJS, VSCode Extension API, 零 npm 依赖

**Design Spec:** `docs/superpowers/specs/2026-04-13-sde-lsp-scope-design.md`

---

## Task 1: 在 scheme-analyzer.js 中添加 kind 字段

**Files:**
- Modify: `src/lsp/scheme-analyzer.js:30-55`
- Test: `tests/test-scheme-parser.js` (更新断言)

- [ ] **Step 1: 在 extractDefinitionsFromList 中添加 kind 字段**

修改 `src/lsp/scheme-analyzer.js` 的 `extractDefinitionsFromList` 函数，在两个 `definitions.push(...)` 调用中添加 `kind` 字段：

```js
// (define name value) → variable
if (children[1].type === 'Identifier') {
    definitions.push({
        name: children[1].value,
        line: listNode.line,
        endLine: listNode.endLine,
        definitionText: listNode.text,
        kind: 'variable',
    });
// (define (func-name args...) body...) → function
} else if (children[1].type === 'List' && children[1].children.length >= 1) {
    definitions.push({
        name: children[1].children[0].value,
        line: listNode.line,
        endLine: listNode.endLine,
        definitionText: listNode.text,
        kind: 'function',
    });
}
```

- [ ] **Step 2: 运行现有测试确认不破坏兼容性**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过（kind 字段是新增的，现有断言只检查 name/line/endLine）

- [ ] **Step 3: 运行 definitions 测试确认透传**

Run: `node tests/test-definitions.js`
Expected: 全部通过（definitions.js 透传 kind，现有断言不受影响）

- [ ] **Step 4: 提交**

```bash
git add src/lsp/scheme-analyzer.js
git commit -m "feat(lsp): add kind field to scheme definition extraction"
```

---

## Task 2: 在 test-scheme-parser.js 中添加 kind 断言

**Files:**
- Modify: `tests/test-scheme-parser.js:201-265`

- [ ] **Step 1: 在 analyze definitions 测试中添加 kind 检查**

在 `tests/test-scheme-parser.js` 的 `analyze — definitions:` 部分，更新以下测试：

**`从 AST 提取 define 变量`** (行 203-209) — 在现有断言后添加：
```js
assert.strictEqual(result.definitions[0].kind, 'variable');
```

**`从 AST 提取 define 函数`** (行 211-216) — 在现有断言后添加：
```js
assert.strictEqual(result.definitions[0].kind, 'function');
```

**`从 AST 提取跨行 define`** (行 218-224) — 在现有断言后添加：
```js
assert.strictEqual(result.definitions[0].kind, 'variable');
```

**`AST 多 define 混合`** (行 258-265) — 在现有断言后添加：
```js
assert.strictEqual(result.definitions[0].kind, 'variable');
assert.strictEqual(result.definitions[1].kind, 'variable');
assert.strictEqual(result.definitions[2].kind, 'function');
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过

- [ ] **Step 3: 提交**

```bash
git add tests/test-scheme-parser.js
git commit -m "test(lsp): add kind field assertions to parser tests"
```

---

## Task 3: 在 test-definitions.js 中添加 kind 断言

**Files:**
- Modify: `tests/test-definitions.js:56-125`

- [ ] **Step 1: 在 extractSchemeDefinitions 测试中添加 kind 检查**

在 `tests/test-definitions.js` 的 `extractSchemeDefinitions:` 部分，更新以下测试：

**`提取 define 变量`** (行 58-63) — 添加：
```js
assert.strictEqual(defs[0].kind, 'variable');
```

**`提取 define 函数`** (行 65-69) — 添加：
```js
assert.strictEqual(defs[0].kind, 'function');
```

**`提取跨行 define`** (行 71-78) — 添加：
```js
assert.strictEqual(defs[0].kind, 'variable');
```

**`多 define 混合`** (行 105-112) — 添加：
```js
assert.strictEqual(defs[0].kind, 'variable');
assert.strictEqual(defs[1].kind, 'variable');
assert.strictEqual(defs[2].kind, 'function');
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-definitions.js`
Expected: 全部通过

- [ ] **Step 3: 提交**

```bash
git add tests/test-definitions.js
git commit -m "test: add kind field assertions to definitions tests"
```

---

## Task 4: 创建 scope-analyzer.js — 作用域树构建

**Files:**
- Create: `src/lsp/scope-analyzer.js`
- Test: `tests/test-scope-analyzer.js`

- [ ] **Step 1: 编写 scope-analyzer.js 的核心实现**

创建 `src/lsp/scope-analyzer.js`：

```js
// src/lsp/scope-analyzer.js
'use strict';

const { parse } = require('./scheme-parser');

/**
 * 构建作用域树。
 * @param {object} ast - Parser 产出的 AST 根节点 (Program)
 * @returns {ScopeNode} 作用域树根节点
 */
function buildScopeTree(ast) {
    const root = {
        type: 'global',
        startLine: 0,
        endLine: Infinity,
        definitions: [],
        children: [],
    };

    function walk(node, parentScope) {
        if (node.type === 'List') {
            const children = node.children;
            if (children.length >= 2 && children[0].type === 'Identifier') {
                // (define (func-name params...) body...)
                if (children[0].value === 'define' && children[1].type === 'List' && children[1].children.length >= 1) {
                    const funcName = children[1].children[0].value;
                    // 函数名作为全局变量绑定
                    parentScope.definitions.push({ name: funcName, kind: 'variable' });

                    // 创建函数作用域
                    const funcScope = {
                        type: 'function',
                        startLine: node.line,
                        endLine: node.endLine,
                        definitions: [],
                        children: [],
                    };
                    // 提取参数
                    for (let i = 1; i < children[1].children.length; i++) {
                        const param = children[1].children[i];
                        if (param.type === 'Identifier') {
                            funcScope.definitions.push({ name: param.value, kind: 'parameter' });
                        }
                    }
                    parentScope.children.push(funcScope);
                    // body 中的子表达式在函数作用域中
                    for (let i = 2; i < children.length; i++) {
                        walk(children[i], funcScope);
                    }
                    return;
                }

                // (let/let*/letrec ((var val) ...) body...)
                if (children[0].value === 'let' || children[0].value === 'let*' || children[0].value === 'letrec') {
                    const letScope = {
                        type: 'let',
                        startLine: node.line,
                        endLine: node.endLine,
                        definitions: [],
                        children: [],
                    };
                    // 提取绑定变量
                    if (children[1] && children[1].type === 'List') {
                        for (const binding of children[1].children) {
                            if (binding.type === 'List' && binding.children.length >= 1 && binding.children[0].type === 'Identifier') {
                                letScope.definitions.push({ name: binding.children[0].value, kind: 'variable' });
                            }
                        }
                    }
                    parentScope.children.push(letScope);
                    // body 中的子表达式在 let 作用域中
                    for (let i = 2; i < children.length; i++) {
                        walk(children[i], letScope);
                    }
                    return;
                }
            }

            // 普通列表，子节点在当前作用域
            for (const child of children) {
                walk(child, parentScope);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression, parentScope);
        }
    }

    // Program body
    if (ast.type === 'Program') {
        for (const child of ast.body) {
            walk(child, root);
        }
    }

    return root;
}

/**
 * 获取指定行号处可见的所有定义。
 * 沿作用域链向上收集，最内层定义优先。
 * @param {ScopeNode} tree - 作用域树根节点
 * @param {number} line - 目标行号
 * @returns {Array<{name: string, kind: string, scopeType: string}>}
 */
function getVisibleDefinitions(tree, line) {
    // 找到包含 line 的最深作用域
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

    // 沿链收集定义，内层覆盖外层
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

module.exports = { buildScopeTree, getVisibleDefinitions };
```

- [ ] **Step 2: 编写作用域树构建的基础测试**

创建 `tests/test-scope-analyzer.js`，先写作用域树构建测试：

```js
// tests/test-scope-analyzer.js
const assert = require('assert');
const { buildScopeTree, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');
const { parse } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function treeOf(code) {
    const { ast } = parse(code);
    return buildScopeTree(ast);
}

console.log('\nbuildScopeTree:');

test('空文档产生全局作用域', () => {
    const tree = treeOf('');
    assert.strictEqual(tree.type, 'global');
    assert.strictEqual(tree.definitions.length, 0);
    assert.strictEqual(tree.children.length, 0);
});

test('全局 define 变量', () => {
    const tree = treeOf('(define x 42)');
    assert.strictEqual(tree.definitions.length, 1);
    assert.strictEqual(tree.definitions[0].name, 'x');
    assert.strictEqual(tree.definitions[0].kind, 'variable');
    assert.strictEqual(tree.children.length, 0);
});

test('全局 define 函数产生函数作用域', () => {
    const tree = treeOf('(define (f x y) (+ x y))');
    assert.strictEqual(tree.definitions.length, 1);
    assert.strictEqual(tree.definitions[0].name, 'f');
    assert.strictEqual(tree.children.length, 1);
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 2);
    assert.strictEqual(funcScope.definitions[0].name, 'x');
    assert.strictEqual(funcScope.definitions[0].kind, 'parameter');
    assert.strictEqual(funcScope.definitions[1].name, 'y');
});

test('无参数函数作用域', () => {
    const tree = treeOf('(define (f) 42)');
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 0);
});

test('let 产生 let 作用域', () => {
    const tree = treeOf('(let ((a 1) (b 2)) (+ a b))');
    assert.strictEqual(tree.children.length, 1);
    const letScope = tree.children[0];
    assert.strictEqual(letScope.type, 'let');
    assert.strictEqual(letScope.definitions.length, 2);
    assert.strictEqual(letScope.definitions[0].name, 'a');
    assert.strictEqual(letScope.definitions[1].name, 'b');
});

test('let* 产生 let 作用域', () => {
    const tree = treeOf('(let* ((x 1)) x)');
    assert.strictEqual(tree.children[0].type, 'let');
    assert.strictEqual(tree.children[0].definitions[0].name, 'x');
});

test('letrec 产生 let 作用域', () => {
    const tree = treeOf('(letrec ((f (lambda (n) n))) (f 10))');
    assert.strictEqual(tree.children[0].type, 'let');
    assert.strictEqual(tree.children[0].definitions[0].name, 'f');
});

test('函数体内嵌套 let', () => {
    const tree = treeOf('(define (calc x)\n  (let ((y (* x 2)))\n    (+ x y)))');
    assert.strictEqual(tree.children.length, 1);
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 1); // param x
    assert.strictEqual(funcScope.children.length, 1);
    const letScope = funcScope.children[0];
    assert.strictEqual(letScope.type, 'let');
    assert.strictEqual(letScope.definitions[0].name, 'y');
});

test('多个 define 产生多个子节点', () => {
    const tree = treeOf('(define x 1)\n(define (f a) a)\n(define y 2)');
    assert.strictEqual(tree.definitions.length, 3);
    assert.strictEqual(tree.children.length, 1); // 只有 define (f a) 产生子作用域
    assert.strictEqual(tree.children[0].type, 'function');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 3: 运行测试确认作用域树构建正确**

Run: `node tests/test-scope-analyzer.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/lsp/scope-analyzer.js tests/test-scope-analyzer.js
git commit -m "feat(lsp): add scope tree builder for function params and let bindings"
```

---

## Task 5: 添加 getVisibleDefinitions 测试

**Files:**
- Modify: `tests/test-scope-analyzer.js`

- [ ] **Step 1: 在测试文件中添加 getVisibleDefinitions 测试**

在 `tests/test-scope-analyzer.js` 中，在作用域树构建测试之后、`console.log` 结果输出之前，添加：

```js
console.log('\ngetVisibleDefinitions:');

test('全局位置可见全局定义', () => {
    const tree = treeOf('(define x 1)\n(define y 2)');
    const visible = getVisibleDefinitions(tree, 1);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['x', 'y']);
});

test('函数体内可见全局定义和函数参数', () => {
    const tree = treeOf('(define x 1)\n(define (f temp)\n  (+ temp x))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['f', 'temp', 'x']);
});

test('函数体内参数优先级高于全局同名', () => {
    const tree = treeOf('(define x 1)\n(define (f x)\n  x)');
    const visible = getVisibleDefinitions(tree, 3);
    const xDef = visible.find(v => v.name === 'x');
    assert.strictEqual(xDef.kind, 'parameter');
    assert.strictEqual(xDef.scopeType, 'function');
});

test('let 体内可见 let 绑定', () => {
    const tree = treeOf('(define x 1)\n(let ((y 2))\n  (+ x y))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['x', 'y']);
    const yDef = visible.find(v => v.name === 'y');
    assert.strictEqual(yDef.scopeType, 'let');
});

test('嵌套 let 中内层覆盖外层', () => {
    const tree = treeOf('(let ((x 1))\n  (let ((x 2))\n    x))');
    const visible = getVisibleDefinitions(tree, 3);
    const xDef = visible.find(v => v.name === 'x');
    assert.strictEqual(xDef.scopeType, 'let');
    // 最内层 let 的 x 值为 2，但 getVisibleDefinitions 只返回一个 x
    assert.strictEqual(visible.filter(v => v.name === 'x').length, 1);
});

test('函数参数和 let 绑定同时可见', () => {
    const tree = treeOf('(define (f temp)\n  (let ((result (* temp 2)))\n    result))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['f', 'result', 'temp']);
    assert.strictEqual(visible.find(v => v.name === 'temp').kind, 'parameter');
    assert.strictEqual(visible.find(v => v.name === 'result').scopeType, 'let');
});

test('空文档无可见定义', () => {
    const tree = treeOf('');
    const visible = getVisibleDefinitions(tree, 1);
    assert.strictEqual(visible.length, 0);
});

test('行号在作用域外时只返回全局', () => {
    const tree = treeOf('(define x 1)\n(define (f a) a)');
    const visible = getVisibleDefinitions(tree, 1);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['x']);
});
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-scope-analyzer.js`
Expected: 全部通过

- [ ] **Step 3: 提交**

```bash
git add tests/test-scope-analyzer.js
git commit -m "test(lsp): add getVisibleDefinitions query tests"
```

---

## Task 6: 修改 extension.js — kind 分类和作用域感知补全

**Files:**
- Modify: `src/extension.js:1-10, 276-300`

- [ ] **Step 1: 在 extension.js 顶部添加 scope-analyzer 导入**

在 `src/extension.js` 行 6 之后添加：

```js
const scopeAnalyzer = require('./lsp/scope-analyzer');
```

- [ ] **Step 2: 修改 SDE 补全提供器，添加 kind 分类和作用域过滤**

替换 `src/extension.js` 中的补全提供器注册（行 276-300 的 `provideCompletionItems` 方法）。

当前代码中所有语言共用一个补全逻辑。需要为 SDE 单独添加作用域感知逻辑，其他语言保持不变。

修改方案：将 `provideCompletionItems` 内部逻辑按 `langId === 'sde'` 分支处理：

```js
provideCompletionItems(document, position) {
    const userDefs = defs.getDefinitions(document, langId);
    if (userDefs.length === 0) return items;

    // 去重：跳过与静态关键词同名的用户变量
    const staticNames = new Set(items.map(it => it.label));
    let filteredDefs = userDefs
        .filter(d => !staticNames.has(d.name))
        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);

    // SDE (Scheme): 作用域感知过滤
    if (langId === 'sde') {
        const { ast } = require('./lsp/scheme-parser').parse(document.getText());
        const scopeTree = scopeAnalyzer.buildScopeTree(ast);
        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, position.line + 1);
        const visibleNames = new Set(visible.map(v => v.name));
        filteredDefs = filteredDefs.filter(d => visibleNames.has(d.name));
    }

    const userItems = filteredDefs.map(d => {
        let itemKind = vscode.CompletionItemKind.Variable;
        let detail = 'User Variable';
        if (d.kind === 'function') {
            itemKind = vscode.CompletionItemKind.Function;
            detail = 'User Function';
        }
        const item = new vscode.CompletionItem(d.name, itemKind);
        item.detail = detail;
        item.sortText = '4' + d.name;
        item.documentation = new vscode.MarkdownString('```scheme\n' + d.definitionText + '\n```');
        return item;
    });

    return [...items, ...userItems];
},
```

注意：此处直接在 `provideCompletionItems` 中调用 `parse` + `buildScopeTree` 是因为补全触发频率低（用户每次按键最多触发一次），不需要额外的缓存层。如果后续性能成为问题可以添加 `document.version` 缓存。

- [ ] **Step 3: 运行所有测试确认无破坏**

Run: `node tests/test-scheme-parser.js && node tests/test-definitions.js && node tests/test-scope-analyzer.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat(lsp): scope-aware completion with kind classification for SDE"
```

---

## Task 7: 运行全部测试并最终提交

**Files:**
- None (验证性任务)

- [ ] **Step 1: 运行全部测试套件**

Run: `node tests/test-scheme-parser.js && node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-snippet-prefixes.js`
Expected: 全部通过（0 失败）

- [ ] **Step 2: 更新蓝图文档，标记 Phase 2 部分完成**

在 `docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md` 中：
- 将 Phase 2 行的状态从 "规划中" 改为 "2A+2B 已完成，2C 待实施"
- 更新完成标准，添加 2A 和 2B 的完成标记

- [ ] **Step 3: 最终提交**

```bash
git add docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md
git commit -m "docs: update LSP blueprint — Phase 2A+2B done, 2C pending"
```
