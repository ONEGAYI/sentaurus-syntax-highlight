# Scheme (SDE) 未定义变量检测 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SDE (Scheme) 语言添加未定义变量检测，引用未定义标识符时显示黄色波浪线 Warning。

**Architecture:** 在 `scope-analyzer.js` 中新增 `getSchemeRefs()` 收集标识符引用，扩展 `undef-var-diagnostic.js` 添加 Scheme 检测分支。Scheme 变量引用无 `$` 前缀，需要合并 SDE 内置函数 + Scheme 标准函数 + 特殊形式为已知名称集进行过滤。

**Tech Stack:** VSCode Diagnostic API, scheme-parser.js (已有手写解析器), scope-analyzer.js (已有作用域分析)

**前置依赖:** Tcl 计划中的 Task 3（`undef-var-diagnostic.js` 框架已创建）

**Spec:** `docs/superpowers/specs/2026-04-15-undef-var-diagnostic-design.md`

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/lsp/scope-analyzer.js` | 新增 `getSchemeRefs()`，更新 exports |
| 修改 | `src/lsp/providers/undef-var-diagnostic.js` | 添加 Scheme 检测分支 |
| 新建 | `tests/test-scheme-var-refs.js` | `getSchemeRefs()` 单元测试 |
| 修改 | `src/extension.js` | 扩展注册（SDE 语言也触发诊断） |

---

### Task 1: 新增 `getSchemeRefs()` — 收集 Scheme 标识符引用

**Files:**
- 修改: `src/lsp/scope-analyzer.js`
- 新建: `tests/test-scheme-var-refs.js`

- [ ] **Step 1: 编写 `getSchemeRefs` 测试**

创建 `tests/test-scheme-var-refs.js`：

```javascript
// tests/test-scheme-var-refs.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { buildScopeTree, getSchemeRefs, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');

console.log('\n=== getSchemeRefs 测试 ===\n');

test('收集简单标识符引用', () => {
    const code = '(define x 42)\n(+ x 1)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // x 在第 2 行被引用
    const xRefs = refs.filter(r => r.name === 'x');
    assert.ok(xRefs.length >= 1, `应有 x 的引用，实际 ${xRefs.length}`);
    assert.strictEqual(xRefs[0].line, 2);
});

test('排除 define 特殊形式本身', () => {
    const code = '(define x 42)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // "define" 不应出现在引用中
    const defineRefs = refs.filter(r => r.name === 'define');
    assert.strictEqual(defineRefs.length, 0, 'define 不应是引用');
});

test('排除 Scheme 内置函数', () => {
    const code = '(+ 1 2)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // "+" 是内置函数，不应出现在引用中
    const plusRefs = refs.filter(r => r.name === '+');
    assert.strictEqual(plusRefs.length, 0, '+ 不应是引用（内置函数）');
});

test('排除字符串内的标识符', () => {
    const code = '(define x "hello world")';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // 字符串内容不应产生引用
    const helloRefs = refs.filter(r => r.name === 'hello');
    assert.strictEqual(helloRefs.length, 0, '字符串内容不应产生引用');
});

test('排除数字字面量', () => {
    const code = '(+ 1 2.5)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    assert.strictEqual(refs.length, 0, '数字不应产生引用');
});

test('lambda 参数在 body 内的引用', () => {
    const code = '((lambda (x) (+ x 1)) 42)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    const xRefs = refs.filter(r => r.name === 'x');
    assert.ok(xRefs.length >= 1, 'x 在 lambda body 中被引用');
});

test('未定义变量被收集', () => {
    const code = '(+ undefined_var 1)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    const undefRefs = refs.filter(r => r.name === 'undefined_var');
    assert.strictEqual(undefRefs.length, 1, '未定义变量应被收集');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-scheme-var-refs.js
```

预期：FAIL — `getSchemeRefs is not a function`

- [ ] **Step 3: 实现 `getSchemeRefs`**

在 `src/lsp/scope-analyzer.js` 的 `getVisibleDefinitions` 函数之后（约 127 行后）新增：

```javascript
/**
 * Scheme 特殊形式关键词 — 不作为变量引用
 */
const SCHEME_SPECIAL_FORMS = new Set([
    'define', 'lambda', 'if', 'cond', 'else', 'case', 'and', 'or',
    'let', 'let*', 'letrec', 'letrec*', 'let-values', 'let*-values',
    'set!', 'begin', 'do', 'delay', 'quote', 'quasiquote', 'unquote',
    'unquote-splicing', 'define-syntax', 'syntax-rules', 'when', 'unless',
    'not', 'map', 'for-each', 'apply',
]);

/**
 * 收集 AST 中所有标识符引用（排除已知函数/特殊形式/字面量）。
 * @param {object} ast - scheme-parser 解析的 AST (Program 节点)
 * @param {Set<string>} [knownNames] - 额外的已知名称集合（SDE 内置函数等）
 * @returns {Array<{name: string, line: number, start: number, end: number}>}
 */
function getSchemeRefs(ast, knownNames) {
    const refs = [];
    const excluded = SCHEME_SPECIAL_FORMS;
    if (knownNames) {
        for (const name of knownNames) {
            excluded.add(name);
        }
    }
    _collectRefs(ast, refs, excluded);
    return refs;
}

function _collectRefs(node, refs, excluded) {
    if (!node) return;

    // 跳过字符串、数字、布尔、注释
    if (node.type === 'String' || node.type === 'Number' ||
        node.type === 'Boolean' || node.type === 'Comment') return;

    if (node.type === 'Identifier') {
        const name = node.value;
        if (name && !excluded.has(name)) {
            refs.push({
                name,
                line: node.line,
                start: node.start,
                end: node.end,
            });
        }
        return;
    }

    if (node.type === 'List') {
        // 特殊处理：列表的第一个元素如果是特殊形式，其名称不作为引用
        // 但子节点仍需递归处理
        const children = node.children || [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (i === 0 && child.type === 'Identifier' &&
                SCHEME_SPECIAL_FORMS.has(child.value)) {
                // 跳过特殊形式名称本身，不作为引用
                continue;
            }
            _collectRefs(child, refs, excluded);
        }
        return;
    }

    if (node.type === 'Quote') {
        // quote 内的内容不作为引用
        return;
    }

    // Program 和其他节点：递归子节点
    if (node.children) {
        for (const child of node.children) {
            _collectRefs(child, refs, excluded);
        }
    }
    if (node.body) {
        for (const child of node.body) {
            _collectRefs(child, refs, excluded);
        }
    }
    if (node.expression) {
        _collectRefs(node.expression, refs, excluded);
    }
}
```

- [ ] **Step 4: 更新 exports**

```javascript
module.exports = { buildScopeTree, getVisibleDefinitions, getSchemeRefs };
```

- [ ] **Step 5: 运行测试确认通过**

```bash
node tests/test-scheme-var-refs.js
```

预期：全部测试通过

- [ ] **Step 6: 提交**

```bash
git add src/lsp/scope-analyzer.js tests/test-scheme-var-refs.js
git commit -m "feat: 添加 getSchemeRefs() 收集 Scheme 标识符引用"
```

---

### Task 2: 扩展 `undef-var-diagnostic.js` — 添加 Scheme 检测分支

**Files:**
- 修改: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 添加 Scheme 隐式变量白名单和检测函数**

在 `undef-var-diagnostic.js` 中添加 Scheme 部分。在文件顶部 require 区域添加：

```javascript
const scopeAnalyzer = require('../scope-analyzer');
const schemeParser = require('../scheme-parser');
```

在 `TCL_BUILTIN_VARS` 之后添加：

```javascript
/** Scheme (SDE) 隐式变量白名单 */
const SCHEME_BUILTIN_VARS = new Set([
    'argc', 'argv',
]);
```

在 `checkTclUndefVars` 函数之后添加：

```javascript
/**
 * 加载 Scheme 已知名称集合（SDE 内置函数 + Scheme 标准函数）。
 * 惰性加载，只初始化一次。
 * @returns {Set<string>}
 */
let _schemeKnownNames = null;
function getSchemeKnownNames() {
    if (_schemeKnownNames) return _schemeKnownNames;

    _schemeKnownNames = new Set();

    // 从 SDE 函数文档加载内置函数名
    try {
        const sdeDocs = require('../../syntaxes/sde_function_docs.json');
        if (sdeDocs) {
            for (const key of Object.keys(sdeDocs)) {
                _schemeKnownNames.add(key);
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 从 Scheme 标准函数文档加载
    try {
        const schemeDocs = require('../../syntaxes/scheme_function_docs.json');
        if (schemeDocs) {
            for (const key of Object.keys(schemeDocs)) {
                _schemeKnownNames.add(key);
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 添加白名单变量
    for (const name of SCHEME_BUILTIN_VARS) {
        _schemeKnownNames.add(name);
    }

    return _schemeKnownNames;
}

/**
 * 检查 Scheme 代码中的未定义变量引用。
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeUndefVars(text) {
    const { ast } = schemeParser.parse(text);
    if (!ast) return [];

    const scopeTree = scopeAnalyzer.buildScopeTree(ast);
    const knownNames = getSchemeKnownNames();
    const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);

    const diagnostics = [];
    for (const ref of refs) {
        // 跳过已知名称（内置函数等已在 getSchemeRefs 中过滤）
        // 这里额外检查作用域内可见性
        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, ref.line);
        const isVisible = visible.some(d => d.name === ref.name);

        if (!isVisible) {
            const textLines = text.split('\n');
            const lineText = textLines[ref.line - 1] || '';
            const range = new vscode.Range(
                ref.line - 1, ref.start,
                ref.line - 1, ref.end
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

- [ ] **Step 2: 扩展 `activate` 函数覆盖 SDE 语言**

修改 `activate` 函数，在已有的 Tcl 语言过滤基础上，增加 SDE 语言支持。

将 `onDidChangeTextDocument` 中的语言过滤改为：

```javascript
context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
        const doc = event.document;
        const langId = doc.languageId;
        if (!TCL_LANG_SET.has(langId) && langId !== 'sde') return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
    })
);
```

将 `onDidOpenTextDocument` 中的语言过滤改为：

```javascript
context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
        const langId = doc.languageId;
        if (!TCL_LANG_SET.has(langId) && langId !== 'sde') return;
        updateDiagnostics(doc);
    })
);
```

将 `onDidCloseTextDocument` 中的语言过滤改为：

```javascript
context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
        const langId = doc.languageId;
        if (TCL_LANG_SET.has(langId) || langId === 'sde') {
            diagnosticCollection.delete(doc.uri);
        }
    })
);
```

- [ ] **Step 3: 修改 `updateDiagnostics` 添加 Scheme 分支**

```javascript
function updateDiagnostics(doc) {
    const text = doc.getText();
    const langId = doc.languageId;

    let diagnostics;
    if (langId === 'sde') {
        diagnostics = checkSchemeUndefVars(text);
    } else {
        diagnostics = checkTclUndefVars(text);
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}
```

- [ ] **Step 4: 更新 exports**

```javascript
module.exports = { activate, checkTclUndefVars, checkSchemeUndefVars, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
```

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "feat: 扩展未定义变量诊断支持 SDE (Scheme)"
```

---

### Task 3: Scheme 引用检测集成测试

**Files:**
- 新建: `tests/test-scheme-undef-diagnostic.js`

- [ ] **Step 1: 编写集成测试**

创建 `tests/test-scheme-undef-diagnostic.js`：

```javascript
// tests/test-scheme-undef-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree, getVisibleDefinitions, getSchemeRefs } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 未定义变量检测集成测试 ===\n');

/**
 * 模拟完整的检测流程（不依赖 VSCode API）
 */
function findUndefRefs(code, knownNames) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const refs = getSchemeRefs(ast, knownNames || new Set());
    const undefs = [];

    for (const ref of refs) {
        const visible = getVisibleDefinitions(scopeTree, ref.line);
        const isVisible = visible.some(d => d.name === ref.name);
        if (!isVisible) {
            undefs.push(ref);
        }
    }
    return undefs;
}

test('全局 define 后引用不报未定义', () => {
    const code = '(define x 42)\n(+ x 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, `不应有未定义引用，实际 ${undefs.length}`);
});

test('未定义变量被检测', () => {
    const code = '(+ undefined_var 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'undefined_var');
});

test('let 绑定在 body 内可见', () => {
    const code = '(let ((x 1)) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, 'let 绑定的变量应可见');
});

test('函数参数在 body 内可见', () => {
    const code = '(define (f x) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '函数参数应可见');
});

test('嵌套作用域正确', () => {
    const code = '(define x 1)\n(define (f y)\n  (let ((z (+ y 1)))\n    (+ x y z)))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '嵌套作用域中的变量都应可见');
});

test('作用域外引用被检测', () => {
    const code = '(let ((x 1)) x)\ny';
    const undefs = findUndefRefs(code, new Set());
    const yUndefs = undefs.filter(r => r.name === 'y');
    assert.strictEqual(yUndefs.length, 1, 'y 在全局作用域未定义');
});

test('内置函数名不报未定义', () => {
    const code = '(define x (sdegeo:create-sphere ...))';
    const undefs = findUndefRefs(code, new Set(['sdegeo:create-sphere']));
    assert.strictEqual(undefs.length, 0, '内置函数名应被过滤');
});

test('白名单变量不报未定义', () => {
    const code = '(define x argc)';
    const undefs = findUndefRefs(code, new Set(['argc']));
    assert.strictEqual(undefs.length, 0, '白名单变量应被过滤');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试**

```bash
node tests/test-scheme-undef-diagnostic.js
```

预期：全部测试通过

- [ ] **Step 3: 提交**

```bash
git add tests/test-scheme-undef-diagnostic.js
git commit -m "test: 添加 Scheme 未定义变量检测集成测试"
```

---

### Task 4: 端到端验证与清理

- [ ] **Step 1: 运行全部现有测试**

```bash
node tests/test-scheme-var-refs.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scope-analyzer.js && node tests/test-scheme-parser.js && node tests/test-definitions.js
```

预期：全部通过，无回归

- [ ] **Step 2: 在 Extension Development Host 中验证 SDE 文件**

测试文件 `test_dvs.cmd` 内容：

```scheme
; SDE 未定义变量检测测试
(define x 42)
(define radius 5.0)

(sdegeo:create-sphere (position 0 0 0) radius "region_1")

(define (myFunc a b)
  (let ((result (+ a b)))
    result))

(define y undefined_var)

(myFunc x y)
```

预期结果：
- `x`, `radius`, `result`, `a`, `b`, `y` — 无波浪线（已定义）
- `undefined_var` — 黄波浪线（未定义）
- `sdegeo:create-sphere`, `position`, `+` — 无波浪线（内置函数）

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: 完成 Scheme (SDE) 未定义变量检测功能"
```
