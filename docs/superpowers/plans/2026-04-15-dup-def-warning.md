# SDE 重复定义警告 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SDE（Scheme）语言中，当同一作用域内多次 `define` 同一个变量名时，显示黄色警告。

**Architecture:** 在现有 `undef-var-diagnostic.js` 的 `checkSchemeUndefVars` 中复用已构建的 `scopeTree`，新增 `checkSchemeDuplicateDefs` 遍历 scopeTree 检测同名重复定义。`scope-analyzer.js` 的 `buildScopeTree` 需为 definitions 增加 `line`/`start`/`end` 位置信息以支持精确的 Range 创建。

**Tech Stack:** 纯 JavaScript（CommonJS），VSCode Diagnostic API，现有 Scheme 手写解析器。

---

### Task 1: scope-analyzer.js — 为 definitions 增加位置信息

**Files:**
- Modify: `src/lsp/scope-analyzer.js:10-121`（`buildScopeTree` 函数体）

`buildScopeTree` 中所有 `parentScope.definitions.push(...)` 调用需要增加 `line`、`start`、`end` 三个字段，值来源于对应的 AST Identifier 节点。

当前代码中各 push 点的位置信息来源：

| 位置（行号范围） | 当前 push 内容 | 需增加字段 | 来源节点 |
|---|---|---|---|
| ~L43 | `{ name: funcName, kind: 'variable' }` | `line/start/end` | `children[1].children[0]`（函数名 Identifier） |
| ~L53-56 | 函数参数 `{ name: param.value, kind: 'parameter' }` | `line/start/end` | `children[1].children[i]`（参数 Identifier） |
| ~L64 | `{ name: children[1].value, kind: 'variable' }` | `line/start/end` | `children[1]`（变量名 Identifier） |
| ~L89-92 | let 绑定 `{ name: binding.children[0].value, kind: 'variable' }` | `line/start/end` | `binding.children[0]`（绑定变量 Identifier） |
| ~L107-110 | lambda 参数 `{ name: param.value, kind: 'parameter' }` | `line/start/end` | `children[1].children` 中各参数 Identifier |

- [ ] **Step 1: 修改 define 函数定义的 definitions push（函数名 + 参数）**

将 L43 附近的：
```javascript
parentScope.definitions.push({ name: funcName, kind: 'variable' });
```
改为：
```javascript
parentScope.definitions.push({ name: funcName, kind: 'variable', line: children[1].children[0].line, start: children[1].children[0].start, end: children[1].children[0].end });
```

将 L53-56 附近的参数 push：
```javascript
funcScope.definitions.push({ name: param.value, kind: 'parameter' });
```
改为：
```javascript
funcScope.definitions.push({ name: param.value, kind: 'parameter', line: param.line, start: param.start, end: param.end });
```

- [ ] **Step 2: 修改 define 变量绑定的 definitions push**

将 L64 附近的：
```javascript
parentScope.definitions.push({ name: children[1].value, kind: 'variable' });
```
改为：
```javascript
parentScope.definitions.push({ name: children[1].value, kind: 'variable', line: children[1].line, start: children[1].start, end: children[1].end });
```

- [ ] **Step 3: 修改 let/let*/letrec 绑定的 definitions push**

将 L89-92 附近的：
```javascript
letScope.definitions.push({ name: binding.children[0].value, kind: 'variable' });
```
改为：
```javascript
letScope.definitions.push({ name: binding.children[0].value, kind: 'variable', line: binding.children[0].line, start: binding.children[0].start, end: binding.children[0].end });
```

- [ ] **Step 4: 修改 lambda 参数的 definitions push**

将 L107-110 附近的：
```javascript
lambdaScope.definitions.push({ name: param.value, kind: 'parameter' });
```
改为：
```javascript
lambdaScope.definitions.push({ name: param.value, kind: 'parameter', line: param.line, start: param.start, end: param.end });
```

- [ ] **Step 5: 运行现有测试确认无回归**

Run: `node tests/test-scope-analyzer.js && node tests/test-scheme-undef-diagnostic.js`
Expected: 所有测试通过（新增字段不影响现有逻辑——`getVisibleDefinitions` 使用 spread `{ ...def }` 会自动包含新字段）

- [ ] **Step 6: Commit**

```bash
git add src/lsp/scope-analyzer.js
git commit -m "refactor: scope-analyzer definitions 增加位置信息（line/start/end）"
```

---

### Task 2: 编写重复定义检测的测试

**Files:**
- Create: `tests/test-scheme-dup-def-diagnostic.js`

测试策略：与现有 `test-scheme-undef-diagnostic.js` 一致，直接测试 `buildScopeTree` 的输出，不依赖 VSCode API。

新增辅助函数 `findDuplicateDefs(code)`：解析代码 → 构建 scopeTree → 遍历各 scope 的 definitions 检测重复 → 返回重复项数组（每项包含 `name`、`line`、`firstLine`、`scopeType`）。

- [ ] **Step 1: 创建测试文件**

创建 `tests/test-scheme-dup-def-diagnostic.js`：

```javascript
// tests/test-scheme-dup-def-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 重复定义检测测试 ===\n');

/**
 * 从 scopeTree 中检测同一作用域内的重复定义。
 * 返回重复项数组，每项: { name, line, firstLine, scopeType }
 */
function findDuplicateDefs(code) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const duplicates = [];

    function walkScope(scope) {
        const seen = new Map(); // name → first definition
        for (const def of scope.definitions) {
            if (seen.has(def.name)) {
                const first = seen.get(def.name);
                duplicates.push({
                    name: def.name,
                    line: def.line,
                    firstLine: first.line,
                    scopeType: scope.type,
                });
            } else {
                seen.set(def.name, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return duplicates;
}

// --- 测试用例 ---

test('全局作用域无重复定义不报', () => {
    const code = '(define x 1)\n(define y 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0);
});

test('全局作用域重复 define 变量被检测', () => {
    const code = '(define x 1)\n(define x 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].firstLine, 1, '首次定义行号应为 1');
    assert.strictEqual(dups[0].line, 2, '重复定义行号应为 2');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('全局作用域重复 define 函数被检测', () => {
    const code = '(define (f x) (+ x 1))\n(define (f y) (+ y 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('函数体内重复 define 被检测', () => {
    const code = '(define (f)\n  (define a 1)\n  (define a 2)\n  a)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'function');
});

test('let 绑定列表中重复变量被检测', () => {
    const code = '(let ((x 1) (x 2)) (+ x 1))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('不同作用域同名不报告（shadowing 正常）', () => {
    const code = '(define x 1)\n(define (f)\n  (define x 2)\n  x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, '不同作用域的同名定义（shadowing）不应报重复');
});

test('lambda 参数和外部 define 同名不报告', () => {
    const code = '(define x 1)\n(define (f) ((lambda (x) (+ x 1)) 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'lambda 参数 shadow 外部定义不应报');
});

test('同一作用域三次重复定义报两次', () => {
    const code = '(define x 1)\n(define x 2)\n(define x 3)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 2, '三次定义应报两个重复');
    assert.strictEqual(dups[0].line, 2, '第二个 x 行号应为 2');
    assert.strictEqual(dups[1].line, 3, '第三个 x 行号应为 3');
});

test('全局多次重复函数定义被检测', () => {
    const code = '(define (my-func) 1)\n(define other 42)\n(define (my-func x) x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'my-func');
});

test('let* 绑定列表中重复变量被检测', () => {
    const code = "(let* ((a 1) (a 2)) (+ a 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('letrec 绑定列表中重复变量被检测', () => {
    const code = "(letrec ((f (lambda (x) x)) (f (lambda (y) y))) (f 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试确认全部失败（TDD 红灯）**

Run: `node tests/test-scheme-dup-def-diagnostic.js`
Expected: 大部分测试应通过（因为 `findDuplicateDefs` 的逻辑在测试文件内，且 scopeTree definitions 已有 line 信息）。但 `firstLine` 和 `scopeType` 字段需要 Task 1 的改动才能正确工作。

注意：此步骤依赖 Task 1 已完成。若 Task 1 尚未完成，则 definitions 中缺少 `line` 字段，`firstLine` 会是 `undefined`。

---

### Task 3: undef-var-diagnostic.js — 新增 checkSchemeDuplicateDefs 并集成

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js:175-206`（`checkSchemeUndefVars` 函数）

策略：在 `checkSchemeUndefVars` 内部，复用已构建的 `scopeTree`，调用 `checkSchemeDuplicateDefs` 获取重复定义诊断，合并到返回结果中。无需修改 `updateDiagnostics` 的调用方式。

- [ ] **Step 1: 新增 checkSchemeDuplicateDefs 函数**

在 `undef-var-diagnostic.js` 中 `checkSchemeUndefVars` 函数之前（约 L173），新增：

```javascript
const SCOPE_TYPE_LABELS = {
    global: '全局',
    function: '函数',
    let: 'let',
    lambda: 'lambda',
};

function checkSchemeDuplicateDefs(scopeTree) {
    const diagnostics = [];

    function walkScope(scope) {
        const seen = new Map(); // name → first definition
        for (const def of scope.definitions) {
            if (seen.has(def.name)) {
                const first = seen.get(def.name);
                const range = new vscode.Range(
                    def.line - 1, def.start,
                    def.line - 1, def.end
                );
                const scopeLabel = SCOPE_TYPE_LABELS[scope.type] || scope.type;
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `重复定义: '${def.name}' 已在第 ${first.line} 行定义（当前作用域: ${scopeLabel}）`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'dup-def';
                diagnostics.push(diagnostic);
            } else {
                seen.set(def.name, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return diagnostics;
}
```

- [ ] **Step 2: 在 checkSchemeUndefVars 中集成重复定义检测**

修改 `checkSchemeUndefVars` 函数（当前 L175-206），在返回 diagnostics 之前，追加重复定义检测：

当前代码末尾：
```javascript
    return diagnostics;
}
```

改为：
```javascript
    // 检测同作用域内的重复定义
    diagnostics.push(...checkSchemeDuplicateDefs(scopeTree));

    return diagnostics;
}
```

- [ ] **Step 3: 运行测试确认通过**

Run: `node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scope-analyzer.js`
Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add src/lsp/providers/undef-var-diagnostic.js tests/test-scheme-dup-def-diagnostic.js
git commit -m "feat: SDE 同作用域内重复 define 黄色警告"
```

---

### Task 4: 手动验证

- [ ] **Step 1: 在 Extension Development Host 中测试**

按 F5 启动扩展开发宿主，打开一个 SDE 文件（`*_dvs.cmd`），编写以下测试代码：

```scheme
(define x 1)
(define x 2)
(define (f)
  (define a 1)
  (define a 2)
  a)
(let ((y 1) (y 2)) (+ y 1))
```

预期：
- 第 2 行 `x` 显示黄色波浪线，消息含"已在第 1 行定义"
- 第 5 行 `a` 显示黄色波浪线，消息含"已在第 4 行定义"
- 第 7 行 `y` 显示黄色波浪线，消息含"已在第 7 行定义"
- 第 1、4、7 行无警告

- [ ] **Step 2: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix: 修复手动验证中发现的问题（如有）"
```
