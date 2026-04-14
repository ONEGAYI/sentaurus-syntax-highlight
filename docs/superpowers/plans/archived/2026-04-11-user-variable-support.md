# 用户变量支持 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 为 5 种 TCAD 语言添加用户自定义变量的补全、悬停定义和跳转定义功能。

**架构：** 纯提取逻辑放在独立模块 `src/definitions.js`（零 VSCode 依赖），`src/extension.js` 导入并注册 Provider。用括号匹配处理跨行定义，`document.version` 做惰性缓存。

**技术栈：** 纯 CommonJS JavaScript，零新依赖，Node.js `assert` 模块做测试。

---

## 文件结构

```
新增:
  src/definitions.js          — 纯函数：括号匹配、变量提取、缓存
  tests/test-definitions.js   — 纯函数单元测试（零依赖）

修改:
  src/extension.js:96-115     — 导入 definitions.js，修改 Provider 注册
  CLAUDE.md                   — 记录新功能
```

**设计决策：** spec 原文说"只改 extension.js"，但将纯提取逻辑拆到 `definitions.js` 有两个好处：(1) 可独立测试，无需 mock VSCode API；(2) `extension.js` 保持在 200 行以内。`extension.js` 只需一行 `const defs = require('./definitions');` 即可导入。

---

### Task 1: 括号匹配函数 `findBalancedExpression`

**Files:**
- Create: `src/definitions.js`
- Create: `tests/test-definitions.js`

- [ ] **Step 1: 创建测试文件，写入 `findBalancedExpression` 测试**

```js
// tests/test-definitions.js
const assert = require('assert');
const { findBalancedExpression } = require('../src/definitions');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nfindBalancedExpression:');

test('简单表达式', () => {
    const text = '(define x 42)';
    assert.strictEqual(findBalancedExpression(text, 0), 13);
});

test('嵌套表达式', () => {
    const text = '(define (f x) (+ x 1))';
    assert.strictEqual(findBalancedExpression(text, 0), 22);
});

test('跨行表达式', () => {
    const text = '(define TboxTest\n  0.42)';
    assert.strictEqual(findBalancedExpression(text, 0), 23);
});

test('跳过字符串内的括号', () => {
    const text = '(define x "hello (world)")';
    assert.strictEqual(findBalancedExpression(text, 0), 26);
});

test('跳过注释内的括号', () => {
    const text = '(define x 42) ; (not counted)';
    assert.strictEqual(findBalancedExpression(text, 0), 13);
});

test('未闭合返回 -1', () => {
    const text = '(define x';
    assert.strictEqual(findBalancedExpression(text, 0), -1);
});

test('花括号匹配（Tcl）', () => {
    const text = 'proc foo { x y } { body }';
    // 从第一个 { 开始
    const start = text.indexOf('{');
    assert.strictEqual(findBalancedExpression(text, start, '{', '}'), start + 5); // "x y" 的 }
});

test('嵌套花括号', () => {
    const text = 'proc foo {args} { set z [expr {$x}] }';
    const bodyStart = text.indexOf('{', text.indexOf('}') + 1);
    assert.strictEqual(findBalancedExpression(text, bodyStart, '{', '}'), text.length - 1);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
node tests/test-definitions.js
```

预期: 失败，`definitions.js` 不存在。

- [ ] **Step 3: 创建 `src/definitions.js`，实现 `findBalancedExpression`**

```js
// src/definitions.js
'use strict';

/**
 * 从 startPos 开始，找到匹配的闭括号位置。
 * 跳过字符串和注释内的括号。
 * @param {string} text 完整文本
 * @param {number} startPos 开括号的位置
 * @param {string} openChar 开括号字符，默认 '('
 * @param {string} closeChar 闭括号字符，默认 ')'
 * @returns {number} 匹配的闭括号位置，未闭合返回 -1
 */
function findBalancedExpression(text, startPos, openChar = '(', closeChar = ')') {
    let depth = 0;
    let inString = false;
    let inLineComment = false;
    for (let i = startPos; i < text.length; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : '\0';
        if (ch === '"' && prev !== '\\' && !inLineComment) inString = !inString;
        if (ch === ';' && !inString) inLineComment = true;
        if (ch === '\n') inLineComment = false;
        if (inString || inLineComment) continue;
        if (ch === openChar) depth++;
        if (ch === closeChar) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

module.exports = { findBalancedExpression };
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
node tests/test-definitions.js
```

预期: 全部 8 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add src/definitions.js tests/test-definitions.js
git commit -m "feat: add findBalancedExpression for multi-line definition matching"
```

---

### Task 2: Scheme 变量提取 `extractSchemeDefinitions`

**Files:**
- Modify: `src/definitions.js`（追加函数）
- Modify: `tests/test-definitions.js`（追加测试）

- [ ] **Step 1: 追加 Scheme 提取测试**

在 `test-definitions.js` 的 `console.log('\n结果:...')` 行之前插入：

```js
const { extractSchemeDefinitions } = require('../src/definitions');

console.log('\nextractSchemeDefinitions:');

test('提取 define 变量', () => {
    const defs = extractSchemeDefinitions('(define TboxTest 0.42)');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].line, 1);
});

test('提取 define 函数', () => {
    const defs = extractSchemeDefinitions('(define (my-func x y) (+ x y))');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'my-func');
});

test('提取跨行 define', () => {
    const text = '(define TboxTest\n  0.42)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].endLine, 2);
    assert.ok(defs[0].definitionText.includes('0.42'));
});

test('提取 let 绑定', () => {
    const text = '(let ((a 1) (b 2)) (+ a b))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'a');
    assert.strictEqual(defs[1].name, 'b');
});

test('提取 let* 绑定', () => {
    const text = '(let* ((x 1) (y (+ x 1))) y)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[1].name, 'y');
});

test('提取 letrec 绑定', () => {
    const text = '(letrec ((even? (lambda (n) n)) (odd? (lambda (n) n))) (even? 10))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'even?');
    assert.strictEqual(defs[1].name, 'odd?');
});

test('跳过注释中的 define', () => {
    const text = '; (define commented 1)\n(define real 2)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'real');
});

test('多 define 混合', () => {
    const text = '(define x 1)\n(define y 2)\n(define (f z) (+ z 1))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[1].name, 'y');
    assert.strictEqual(defs[2].name, 'f');
});

test('define 后紧跟闭括号（空定义）', () => {
    const defs = extractSchemeDefinitions('(define x)');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('跳过字符串中的 define', () => {
    const text = '(define x "(define fake 1)")';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});
```

同时更新文件顶部的 require 行：

```js
// 替换第一行 require
const { findBalancedExpression, extractSchemeDefinitions } = require('../src/definitions');
```

注意：此时 `extractSchemeDefinitions` 尚未导出，测试应失败。

- [ ] **Step 2: 运行测试，确认失败**

```bash
node tests/test-definitions.js
```

预期: `findBalancedExpression` 测试通过，`extractSchemeDefinitions` 测试失败。

- [ ] **Step 3: 在 `src/definitions.js` 中实现 `extractSchemeDefinitions`**

在 `module.exports` 行之前插入：

```js
/**
 * 从 Scheme 文本中提取用户定义的变量和函数。
 * 覆盖：(define name ...), (define (func args) ...),
 *        (let ((var val) ...) ...), (let* ...), (letrec ...)
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function extractSchemeDefinitions(text) {
    const defs = [];

    // 1. (define name ...) 和 (define (func args) ...)
    const defineRe = /\(define\s+/g;
    let match;
    while ((match = defineRe.exec(text)) !== null) {
        const exprStart = match.index;
        const exprEnd = findBalancedExpression(text, exprStart);
        if (exprEnd === -1) continue;

        const afterDefine = text.slice(match.index + match[0].length);
        let name;
        if (afterDefine[0] === '(') {
            // 函数定义: (define (name args ...) ...)
            const funcMatch = afterDefine.match(/^\(([^()\s]+)/);
            if (funcMatch) name = funcMatch[1];
        } else {
            // 变量定义: (define name ...)
            const varMatch = afterDefine.match(/^([^()\s]+)/);
            if (varMatch) name = varMatch[1];
        }
        if (!name) continue;

        const line = text.substring(0, exprStart).split('\n').length;
        const endLine = text.substring(0, exprEnd).split('\n').length;
        const definitionText = text.substring(exprStart, exprEnd + 1);
        defs.push({ name, line, endLine, definitionText });
    }

    // 2. (let/let*/letrec ((var1 val1) (var2 val2) ...) ...)
    //    注意：let* 必须在 let 之前，否则 let 会先匹配
    const letRe = /\((let\*|letrec|let)\s+\(/g;
    while ((match = letRe.exec(text)) !== null) {
        const exprStart = match.index;
        const exprEnd = findBalancedExpression(text, exprStart);
        if (exprEnd === -1) continue;

        // 绑定列表从匹配末尾的 '(' 开始
        const bindListOpen = match.index + match[0].length - 1;
        const bindListClose = findBalancedExpression(text, bindListOpen);
        if (bindListClose === -1) continue;

        // 提取每个绑定对 (var val)
        const bindList = text.substring(bindListOpen + 1, bindListClose);
        const bindRe = /\(([^()\s]+)\s/g;
        let bindMatch;
        while ((bindMatch = bindRe.exec(bindList)) !== null) {
            const name = bindMatch[1];
            const line = text.substring(0, exprStart).split('\n').length;
            const endLine = text.substring(0, exprEnd).split('\n').length;
            const definitionText = text.substring(exprStart, exprEnd + 1);
            defs.push({ name, line, endLine, definitionText });
        }
    }

    return defs;
}
```

更新 `module.exports`:

```js
module.exports = { findBalancedExpression, extractSchemeDefinitions };
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
node tests/test-definitions.js
```

预期: `findBalancedExpression` 8 个 + `extractSchemeDefinitions` 10 个 = 18 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add src/definitions.js tests/test-definitions.js
git commit -m "feat: add extractSchemeDefinitions for Scheme variable extraction"
```

---

### Task 3: Tcl 变量提取 `extractTclDefinitions`

**Files:**
- Modify: `src/definitions.js`
- Modify: `tests/test-definitions.js`

- [ ] **Step 1: 追加 Tcl 提取测试**

在 `test-definitions.js` 的最终结果行之前追加：

```js
const { extractTclDefinitions } = require('../src/definitions');

console.log('\nextractTclDefinitions:');

test('提取 set 变量', () => {
    const defs = extractTclDefinitions('set TboxTest 0.42');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].line, 1);
});

test('提取 set 带花括号值', () => {
    const defs = extractTclDefinitions('set name "hello"');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'name');
});

test('跳过 set env()', () => {
    const defs = extractTclDefinitions('set env(PATH) /usr/bin');
    assert.strictEqual(defs.length, 0);
});

test('提取 proc', () => {
    const defs = extractTclDefinitions('proc myFunc { x y } { return [expr {$x + $y}] }');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'myFunc');
});

test('提取跨行 proc', () => {
    const text = 'proc calc { x y } {\n  set z [expr {$x + $y}]\n  return $z\n}';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 2); // proc calc + set z
    assert.strictEqual(defs[0].name, 'calc');
    assert.strictEqual(defs[0].endLine, 4);
    assert.strictEqual(defs[1].name, 'z');
});

test('跳过注释行', () => {
    const text = '# set commented 1\nset real 2';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'real');
});

test('多变量混合', () => {
    const text = 'set a 1\nset b 2\nproc f { } { return $a }';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'a');
    assert.strictEqual(defs[1].name, 'b');
    assert.strictEqual(defs[2].name, 'f');
});

test('缩进的 set（循环体内）', () => {
    const defs = extractTclDefinitions('    set indented 42');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'indented');
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
node tests/test-definitions.js
```

预期: `extractTclDefinitions` 测试失败。

- [ ] **Step 3: 在 `src/definitions.js` 中实现 `extractTclDefinitions`**

在 `extractSchemeDefinitions` 函数之后、`module.exports` 之前插入：

```js
/**
 * 从 Tcl 文本中提取用户定义的变量和过程。
 * 覆盖：set varName value, proc name {args} {body}
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function extractTclDefinitions(text) {
    const defs = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // set varName value
        const setMatch = trimmed.match(/^set\s+(\S+)/);
        if (setMatch) {
            const name = setMatch[1];
            if (name.startsWith('env(')) continue;
            defs.push({ name, line: i + 1, endLine: i + 1, definitionText: trimmed });
            continue;
        }

        // proc name {args} {body} — 可能跨多行
        const procMatch = trimmed.match(/^proc\s+(\S+)/);
        if (procMatch) {
            const name = procMatch[1];
            // 从 proc 行开始拼接剩余文本，寻找完整定义
            const fromLine = lines.slice(i).join('\n');
            const firstBrace = fromLine.indexOf('{');
            if (firstBrace !== -1) {
                // proc 有两组花括号: {args} {body}
                const argsEnd = findBalancedExpression(fromLine, firstBrace, '{', '}');
                if (argsEnd !== -1) {
                    const bodyBrace = fromLine.indexOf('{', argsEnd + 1);
                    if (bodyBrace !== -1) {
                        const bodyEnd = findBalancedExpression(fromLine, bodyBrace, '{', '}');
                        if (bodyEnd !== -1) {
                            const fullDef = fromLine.substring(0, bodyEnd + 1).trim();
                            const endLine = i + 1 + fromLine.substring(0, bodyEnd).split('\n').length - 1;
                            defs.push({ name, line: i + 1, endLine, definitionText: fullDef });
                            continue;
                        }
                    }
                }
            }
            // 降级：只记录 proc 行
            defs.push({ name, line: i + 1, endLine: i + 1, definitionText: trimmed });
        }
    }

    return defs;
}
```

更新 `module.exports`:

```js
module.exports = { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitions };
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
node tests/test-definitions.js
```

预期: 所有 26 个测试通过（8 + 10 + 8）。

- [ ] **Step 5: 提交**

```bash
git add src/definitions.js tests/test-definitions.js
git commit -m "feat: add extractTclDefinitions for Tcl variable extraction"
```

---

### Task 4: 提取分发器 + 惰性缓存

**Files:**
- Modify: `src/definitions.js`
- Modify: `tests/test-definitions.js`

- [ ] **Step 1: 追加分发器和缓存测试**

```js
const { extractDefinitions, getDefinitions, clearDefinitionCache } = require('../src/definitions');

console.log('\nextractDefinitions:');

test('sde 语言走 Scheme 提取', () => {
    const defs = extractDefinitions('(define x 1)', 'sde');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('sprocess 语言走 Tcl 提取', () => {
    const defs = extractDefinitions('set x 1', 'sprocess');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('未知语言返回空数组', () => {
    const defs = extractDefinitions('x = 1', 'python');
    assert.strictEqual(defs.length, 0);
});

console.log('\ngetDefinitions (缓存):');

// 模拟 document 对象
function mockDoc(text, version, uri) {
    return {
        getText: () => text,
        version,
        uri: { toString: () => uri || 'file:///test.cmd' },
    };
}

test('首次调用执行扫描', () => {
    clearDefinitionCache();
    const doc = mockDoc('(define myVar 42)', 1);
    const defs = getDefinitions(doc, 'sde');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'myVar');
});

test('同版本使用缓存', () => {
    clearDefinitionCache();
    const doc = mockDoc('(define x 1)', 1);
    const d1 = getDefinitions(doc, 'sde');
    const d2 = getDefinitions(doc, 'sde');
    assert.strictEqual(d1, d2); // 同一引用
});

test('版本变化重新扫描', () => {
    clearDefinitionCache();
    const uri = 'file:///test2.cmd';
    const doc1 = mockDoc('(define x 1)', 1, uri);
    const doc2 = mockDoc('(define x 1) (define y 2)', 2, uri);
    const d1 = getDefinitions(doc1, 'sde');
    const d2 = getDefinitions(doc2, 'sde');
    assert.strictEqual(d1.length, 1);
    assert.strictEqual(d2.length, 2);
    assert.notStrictEqual(d1, d2);
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
node tests/test-definitions.js
```

- [ ] **Step 3: 实现分发器和缓存**

在 `extractTclDefinitions` 之后、`module.exports` 之前插入：

```js
/** Scheme 语言 ID 集合 */
const SCHEME_LANGS = new Set(['sde']);

/** Tcl 语言 ID 集合 */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);

/**
 * 根据语言 ID 分发到对应的提取器。
 * @param {string} text 文档文本
 * @param {string} langId 语言 ID
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function extractDefinitions(text, langId) {
    if (SCHEME_LANGS.has(langId)) return extractSchemeDefinitions(text);
    if (TCL_LANGS.has(langId)) return extractTclDefinitions(text);
    return [];
}

/**
 * 定义缓存。key 为文档 URI，value 为 { version, definitions }。
 * @type {Map<string, { version: number, definitions: object[] }>}
 */
const _defCache = new Map();

/**
 * 获取文档中的用户定义变量，带版本缓存。
 * @param {{ getText: Function, version: number, uri: { toString: Function } }} document
 * @param {string} langId 语言 ID
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function getDefinitions(document, langId) {
    const uri = document.uri.toString();
    const cached = _defCache.get(uri);
    if (cached && cached.version === document.version) return cached.definitions;

    const definitions = extractDefinitions(document.getText(), langId);
    _defCache.set(uri, { version: document.version, definitions });
    return definitions;
}

/** 清空缓存（测试用）。 */
function clearDefinitionCache() {
    _defCache.clear();
}
```

更新 `module.exports`:

```js
module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitions,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
};
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
node tests/test-definitions.js
```

预期: 所有 29 个测试通过（8 + 10 + 8 + 3 + 3）。

- [ ] **Step 5: 提交**

```bash
git add src/definitions.js tests/test-definitions.js
git commit -m "feat: add extractDefinitions dispatcher and version-based cache"
```

---

### Task 5: 补全 Provider 集成

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在 `extension.js` 顶部添加导入**

在 `const fs = require('fs');` 之后添加：

```js
const defs = require('./definitions');
```

- [ ] **Step 2: 修改 `provideCompletionItems`**

将现有的 `provideCompletionItems()` 改为接收 `document` 参数并追加用户变量。找到 `registerCompletionItemProvider` 块中的：

```js
provideCompletionItems() {
    return items;
},
```

替换为：

```js
provideCompletionItems(document) {
    const userDefs = defs.getDefinitions(document, langId);
    if (userDefs.length === 0) return items;

    // 去重：跳过与静态关键词同名的用户变量
    const staticNames = new Set(items.map(it => it.label));
    const userItems = userDefs
        .filter(d => !staticNames.has(d.name))
        // 同名变量可能在多处定义，去重
        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i)
        .map(d => {
            const item = new vscode.CompletionItem(d.name, vscode.CompletionItemKind.Variable);
            item.detail = 'User Variable';
            item.sortText = '4' + d.name;
            item.documentation = new vscode.MarkdownString('```scheme\n' + d.definitionText + '\n```');
            return item;
        });

    return [...items, ...userItems];
},
```

注意：`langId` 变量已在 for 循环中定义（`for (const langId of languages)`），闭包可访问。

- [ ] **Step 3: 手动测试**

1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/testbench_dvs.cmd`
3. 在空白处输入 `Tbox`，按 Ctrl+Space
4. 预期：补全列表中出现 `TboxTest`（Variable 图标，排序在 API 函数之后）

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: add user variable completion"
```

---

### Task 6: 悬停 Provider 集成

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 修改 `provideHover`**

找到现有 HoverProvider 中的：

```js
provideHover(document, position) {
    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
    if (!range) return null;
    const word = document.getText(range);
    const doc = funcDocs[word] || funcDocs[decodeHtml(word)];
    if (!doc) return null;
    return new vscode.Hover(formatDoc(doc), range);
},
```

替换为：

```js
provideHover(document, position) {
    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
    if (!range) return null;
    const word = document.getText(range);

    // 1. 查函数文档（优先）
    const doc = funcDocs[word] || funcDocs[decodeHtml(word)];
    if (doc) return new vscode.Hover(formatDoc(doc), range);

    // 2. 查用户变量定义
    const userDefs = defs.getDefinitions(document, langId);
    const def = userDefs.find(d => d.name === word);
    if (def) {
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${def.name}** (用户变量, 第 ${def.line} 行)\n\n`);
        md.appendCodeblock(def.definitionText, langId === 'sde' ? 'scheme' : 'tcl');
        return new vscode.Hover(md, range);
    }

    return null;
},
```

- [ ] **Step 2: 手动测试**

1. 在 Extension Development Host 中打开测试文件
2. 将光标放在第 10 行的 `TboxTest` 上
3. 预期：悬停显示 `**TboxTest** (用户变量, 第 10 行)` + 代码块
4. 将光标放在 `sdegeo:create-rectangle` 上
5. 预期：仍显示原有的 API 函数文档（不受影响）

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat: add user variable hover definition"
```

---

### Task 7: 跳转定义 Provider

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在 `activate()` 的 for 循环内，`hoverDisposable` 注册之后添加 DefinitionProvider**

在 `context.subscriptions.push(hoverDisposable);` 之后插入：

```js
// Register DefinitionProvider for user-defined variables
const definitionDisposable = vscode.languages.registerDefinitionProvider(
    { language: langId },
    {
        provideDefinition(document, position) {
            const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
            if (!range) return null;
            const word = document.getText(range);

            const userDefs = defs.getDefinitions(document, langId);
            const def = userDefs.find(d => d.name === word);
            if (!def) return null;

            const targetLine = def.line - 1; // 0-indexed
            const lineLength = document.lineAt(targetLine).text.length;
            return new vscode.Location(
                document.uri,
                new vscode.Range(targetLine, 0, targetLine, lineLength)
            );
        },
    }
);
context.subscriptions.push(definitionDisposable);
```

- [ ] **Step 2: 手动测试**

1. 在 Extension Development Host 中打开测试文件
2. 将光标放在第 24 行 `string->list` 附近的任意 `TboxTest` 引用上（如果没有引用，先手动添加一行 `(display TboxTest)`）
3. 按 F12 或 Ctrl+Click
4. 预期：跳转到第 10 行 `(define TboxTest 0.42)`
5. 对 API 函数如 `define` 按 F12
6. 预期：不跳转（DefinitionProvider 返回 null，不干扰 VSCode 默认行为）

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat: add go-to-definition for user variables"
```

---

### Task 8: 更新 CLAUDE.md 文档

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新 CLAUDE.md 的自动补全部分**

在 `### 自动补全（src/extension.js）` 部分的段末追加：

```markdown
### 用户变量支持（src/definitions.js）

独立模块，零 VSCode API 依赖。提供用户自定义变量的补全、悬停和跳转定义功能。

- **语言覆盖**：Scheme (sde) 的 `define`/`let/let*/letrec` 绑定；Tcl (其他 4 种) 的 `set`/`proc`
- **缓存**：`document.version` 惰性缓存，同版本不重复扫描
- **跨行处理**：`findBalancedExpression` 括号匹配算法，跳过字符串和注释内的括号
- **测试**：`tests/test-definitions.js`，纯 Node.js `assert`，零依赖
```

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with user variable support"
```
