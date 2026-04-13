# SDE LSP Layer 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Scheme S-expression AST 解析器，替换 definitions.js 的正则扫描，新增代码折叠和括号诊断功能。

**Architecture:** 手写递归下降解析器（Tokenizer → Parser → AST），分析层遍历 AST 提取定义和折叠范围，Provider 层桥接 VSCode API。

**Tech Stack:** 纯 JavaScript, CommonJS, VSCode Extension API, 零 npm 依赖

**Design Spec:** `docs/superpowers/specs/2026-04-13-sde-lsp-ast-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lsp/scheme-parser.js` | 新增 | Tokenizer + Parser，产出 AST + errors |
| `src/lsp/scheme-analyzer.js` | 新增 | 遍历 AST 提取 definitions + foldingRanges |
| `src/lsp/providers/folding-provider.js` | 新增 | VSCode FoldingRangeProvider |
| `src/lsp/providers/bracket-diagnostic.js` | 新增 | 防抖括号未闭合诊断 |
| `src/definitions.js` | 修改 | Scheme 部分内部改用 AST |
| `src/extension.js` | 修改 | 注册 folding + diagnostic provider |
| `tests/test-scheme-parser.js` | 新增 | Parser + Analyzer 单元测试 |

---

## Task 1: Tokenizer

**Files:**
- Create: `src/lsp/scheme-parser.js`
- Create: `tests/test-scheme-parser.js`

- [ ] **Step 1: 创建测试文件和 Tokenizer 基础测试**

创建 `tests/test-scheme-parser.js`：

```javascript
// tests/test-scheme-parser.js
const assert = require('assert');
const { tokenize } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\ntokenize:');

test('空输入', () => {
    const tokens = tokenize('');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'EOF');
});

test('简单符号', () => {
    const tokens = tokenize('define');
    assert.strictEqual(tokens.length, 2);
    assert.strictEqual(tokens[0].type, 'SYMBOL');
    assert.strictEqual(tokens[0].value, 'define');
    assert.strictEqual(tokens[1].type, 'EOF');
});

test('括号', () => {
    const tokens = tokenize('()');
    assert.strictEqual(tokens[0].type, 'LPAREN');
    assert.strictEqual(tokens[1].type, 'RPAREN');
});

test('数字（整数）', () => {
    const tokens = tokenize('42');
    assert.strictEqual(tokens[0].type, 'NUMBER');
    assert.strictEqual(tokens[0].value, 42);
});

test('数字（浮点数）', () => {
    const tokens = tokenize('3.14');
    assert.strictEqual(tokens[0].type, 'NUMBER');
    assert.strictEqual(tokens[0].value, 3.14);
});

test('数字（科学计数法）', () => {
    const tokens = tokenize('1.2e-5');
    assert.strictEqual(tokens[0].type, 'NUMBER');
    assert.strictEqual(tokens[0].value, 1.2e-5);
});

test('字符串', () => {
    const tokens = tokenize('"Silicon"');
    assert.strictEqual(tokens[0].type, 'STRING');
    assert.strictEqual(tokens[0].value, 'Silicon');
});

test('字符串含转义', () => {
    const tokens = tokenize('"hello \\"world\\""');
    assert.strictEqual(tokens[0].type, 'STRING');
    assert.strictEqual(tokens[0].value, 'hello "world"');
});

test('布尔值 #t #f', () => {
    const tokens = tokenize('#t #f'));
    assert.strictEqual(tokens[0].type, 'BOOLEAN');
    assert.strictEqual(tokens[0].value, true);
    assert.strictEqual(tokens[1].type, 'BOOLEAN');
    assert.strictEqual(tokens[1].value, false);
});

test('行注释', () => {
    const tokens = tokenize('; this is a comment\ndefine');
    assert.strictEqual(tokens[0].type, 'COMMENT');
    assert.strictEqual(tokens[0].value, ' this is a comment');
    assert.strictEqual(tokens[1].type, 'SYMBOL');
    assert.strictEqual(tokens[1].value, 'define');
});

test('引号', () => {
    const tokens = tokenize("'(1 2 3)");
    assert.strictEqual(tokens[0].type, 'QUOTE');
    assert.strictEqual(tokens[1].type, 'LPAREN');
});

test('位置信息', () => {
    const tokens = tokenize('(define x\n  42)');
    assert.strictEqual(tokens[0].type, 'LPAREN');
    assert.strictEqual(tokens[0].start, 0);
    assert.strictEqual(tokens[0].line, 1);
    assert.strictEqual(tokens[3].type, 'NUMBER');
    assert.strictEqual(tokens[3].line, 2);
});

test('SDE 命名空间符号', () => {
    const tokens = tokenize('sdegeo:create-rectangle');
    assert.strictEqual(tokens[0].type, 'SYMBOL');
    assert.strictEqual(tokens[0].value, 'sdegeo:create-rectangle');
});

test('@Var@ 参数', () => {
    const tokens = tokenize('@previous@');
    assert.strictEqual(tokens[0].type, 'SYMBOL');
    assert.strictEqual(tokens[0].value, '@previous@');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

> 注意：测试中有语法错误 `tokenize('#t #f'))` 多了一个右括号，实际代码应为 `tokenize('#t #f')`。此处作为计划中的书写示例，实施时应修正。

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-scheme-parser.js`
Expected: FAIL — `Cannot find module '../src/lsp/scheme-parser'`

- [ ] **Step 3: 实现 Tokenizer**

创建 `src/lsp/scheme-parser.js`，实现 `tokenize()` 函数：

```javascript
// src/lsp/scheme-parser.js
'use strict';

const TokenType = {
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    SYMBOL: 'SYMBOL',
    QUOTE: 'QUOTE',
    COMMENT: 'COMMENT',
    EOF: 'EOF',
};

/**
 * 将源代码文本转换为 token 数组。
 * @param {string} text 源代码文本
 * @returns {{ type: string, value: any, start: number, end: number, line: number }[]}
 */
function tokenize(text) {
    const tokens = [];
    let i = 0;
    let line = 1;

    while (i < text.length) {
        const ch = text[i];

        // 换行
        if (ch === '\n') { line++; i++; continue; }

        // 空白
        if (/\s/.test(ch)) { i++; continue; }

        // 行注释 ;
        if (ch === ';') {
            const start = i;
            while (i < text.length && text[i] !== '\n') i++;
            tokens.push({ type: TokenType.COMMENT, value: text.slice(start + 1, i), start, end: i, line });
            continue;
        }

        // 引号 '
        if (ch === "'") {
            tokens.push({ type: TokenType.QUOTE, value: "'", start: i, end: i + 1, line });
            i++;
            continue;
        }

        // 括号
        if (ch === '(') {
            tokens.push({ type: TokenType.LPAREN, value: '(', start: i, end: i + 1, line });
            i++;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: TokenType.RPAREN, value: ')', start: i, end: i + 1, line });
            i++;
            continue;
        }

        // 字符串
        if (ch === '"') {
            const start = i;
            i++; // skip opening quote
            let value = '';
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\' && i + 1 < text.length) {
                    const next = text[i + 1];
                    if (next === '"') { value += '"'; i += 2; continue; }
                    if (next === 'n') { value += '\n'; i += 2; continue; }
                    if (next === 't') { value += '\t'; i += 2; continue; }
                    if (next === '\\') { value += '\\'; i += 2; continue; }
                }
                if (text[i] === '\n') line++;
                value += text[i];
                i++;
            }
            i++; // skip closing quote
            tokens.push({ type: TokenType.STRING, value, start, end: i, line });
            continue;
        }

        // 布尔值 #t #f
        if (ch === '#' && i + 1 < text.length && (text[i + 1] === 't' || text[i + 1] === 'f')) {
            const val = text[i + 1] === 't';
            tokens.push({ type: TokenType.BOOLEAN, value: val, start: i, end: i + 2, line });
            i += 2;
            continue;
        }

        // 数字或符号（可能以数字开头，但含有字母则为符号）
        // 读取一个连续的 token
        const start = i;
        while (i < text.length && !/[\s()";]/.test(text[i])) i++;
        const raw = text.slice(start, i);

        // 判断是数字还是符号
        if (/^-?\d/.test(raw) && !isNaN(Number(raw))) {
            tokens.push({ type: TokenType.NUMBER, value: Number(raw), start, end: i, line });
        } else {
            tokens.push({ type: TokenType.SYMBOL, value: raw, start, end: i, line });
        }
    }

    tokens.push({ type: TokenType.EOF, value: null, start: i, end: i, line });
    return tokens;
}
```

> 注意：此处仅导出 `tokenize`，`parse` 函数在 Task 2 中添加。先在文件末尾添加临时导出：

```javascript
module.exports = { tokenize };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
mkdir -p src/lsp/providers
git add src/lsp/scheme-parser.js tests/test-scheme-parser.js
git commit -m "feat(lsp): add Scheme tokenizer for S-expression parsing"
```

---

## Task 2: Parser

**Files:**
- Modify: `src/lsp/scheme-parser.js`
- Modify: `tests/test-scheme-parser.js`

- [ ] **Step 1: 添加 Parser 测试**

在 `tests/test-scheme-parser.js` 末尾（`console.log` 结果行之前）追加：

```javascript
const { parse } = require('../src/lsp/scheme-parser');

console.log('\nparse:');

test('简单列表', () => {
    const { ast } = parse('(+ 1 2)');
    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.body.length, 1);
    const list = ast.body[0];
    assert.strictEqual(list.type, 'List');
    assert.strictEqual(list.children.length, 3);
    assert.strictEqual(list.children[0].type, 'Identifier');
    assert.strictEqual(list.children[0].value, '+');
    assert.strictEqual(list.children[1].type, 'Number');
    assert.strictEqual(list.children[1].value, 1);
    assert.strictEqual(list.children[2].type, 'Number');
    assert.strictEqual(list.children[2].value, 2);
});

test('嵌套列表', () => {
    const { ast } = parse('(define (f x) (+ x 1))');
    const outer = ast.body[0];
    assert.strictEqual(outer.children[0].value, 'define');
    const funcSig = outer.children[1];
    assert.strictEqual(funcSig.type, 'List');
    assert.strictEqual(funcSig.children[0].value, 'f');
});

test('define 变量', () => {
    const { ast } = parse('(define x 42)');
    const list = ast.body[0];
    assert.strictEqual(list.children[0].value, 'define');
    assert.strictEqual(list.children[1].value, 'x');
    assert.strictEqual(list.children[2].value, 42);
});

test('字符串参数', () => {
    const { ast } = parse('(sdegeo:create-rectangle "R.Si" "Silicon" (position 0 0 0))');
    const list = ast.body[0];
    assert.strictEqual(list.children[1].value, 'R.Si');
    assert.strictEqual(list.children[2].value, 'Silicon');
});

test('布尔值', () => {
    const { ast } = parse('(if #t 1 0)');
    const list = ast.body[0];
    assert.strictEqual(list.children[1].type, 'Boolean');
    assert.strictEqual(list.children[1].value, true);
});

test('引号语法糖', () => {
    const { ast } = parse("'(1 2 3)");
    assert.strictEqual(ast.body[0].type, 'Quote');
    assert.strictEqual(ast.body[0].expression.type, 'List');
});

test('跨行表达式行号', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const list = ast.body[0];
    assert.strictEqual(list.line, 1);
    assert.strictEqual(list.endLine, 2);
});

test('未闭合括号产生错误', () => {
    const { ast, errors } = parse('(define x');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].severity, 'error');
    assert.ok(errors[0].message.includes('未闭合'));
    // AST 仍然产出
    assert.strictEqual(ast.body.length, 1);
});

test('多余闭括号产生警告', () => {
    const { errors } = parse('(define x 1))');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].severity, 'warning');
});

test('空输入', () => {
    const { ast } = parse('');
    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.body.length, 0);
});

test('注释被跳过但保留在 AST', () => {
    const { ast } = parse('; comment\n(define x 1)');
    assert.strictEqual(ast.body.length, 2); // comment node + define node
    assert.strictEqual(ast.body[0].type, 'Comment');
});

test('definitionText 字段', () => {
    const { ast } = parse('(define x 42)');
    const list = ast.body[0];
    assert.strictEqual(list.text, '(define x 42)');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-scheme-parser.js`
Expected: FAIL — `parse is not a function`

- [ ] **Step 3: 实现 Parser**

在 `src/lsp/scheme-parser.js` 中，在 `module.exports` 之前添加 Parser 实现：

```javascript
/**
 * 从 token 数组构建 AST。
 * @param {string} text 源代码文本
 * @returns {{ ast: object, errors: object[] }}
 */
function parse(text) {
    const tokens = tokenize(text);
    const errors = [];
    let pos = 0;

    function current() { return tokens[pos]; }
    function advance() { return tokens[pos++]; }

    function countLinesUpTo(offset) {
        let count = 1;
        for (let j = 0; j < offset; j++) {
            if (text[j] === '\n') count++;
        }
        return count;
    }

    function parseExpr() {
        const tok = current();

        if (tok.type === TokenType.QUOTE) {
            advance(); // skip '
            const expr = parseExpr();
            return {
                type: 'Quote',
                expression: expr,
                start: tok.start,
                end: expr.end,
                line: tok.line,
                endLine: expr.endLine,
            };
        }

        if (tok.type === TokenType.LPAREN) {
            return parseList();
        }

        if (tok.type === TokenType.COMMENT) {
            advance();
            return {
                type: 'Comment',
                value: tok.value,
                start: tok.start,
                end: tok.end,
                line: tok.line,
                endLine: tok.line,
            };
        }

        if (tok.type === TokenType.RPAREN) {
            errors.push({
                message: '多余的闭括号',
                start: tok.start,
                end: tok.end,
                line: tok.line,
                severity: 'warning',
            });
            advance();
            return parseExpr(); // 跳过并继续
        }

        // 原子
        advance();
        if (tok.type === TokenType.NUMBER) {
            return { type: 'Number', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.STRING) {
            return { type: 'String', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.BOOLEAN) {
            return { type: 'Boolean', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }
        if (tok.type === TokenType.SYMBOL) {
            return { type: 'Identifier', value: tok.value, start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
        }

        // EOF 或未知
        return { type: 'Identifier', value: '', start: tok.start, end: tok.end, line: tok.line, endLine: tok.line };
    }

    function parseList() {
        const openTok = advance(); // skip (
        const children = [];
        let endLine = openTok.line;

        while (current().type !== TokenType.RPAREN && current().type !== TokenType.EOF) {
            const child = parseExpr();
            children.push(child);
            endLine = child.endLine;
        }

        if (current().type === TokenType.RPAREN) {
            const closeTok = advance();
            endLine = closeTok.line;
            return {
                type: 'List',
                children,
                start: openTok.start,
                end: closeTok.end,
                line: openTok.line,
                endLine,
                text: text.slice(openTok.start, closeTok.end),
            };
        }

        // EOF reached — 未闭合
        errors.push({
            message: `未闭合的括号（在第 ${openTok.line} 行打开）`,
            start: openTok.start,
            end: text.length,
            line: openTok.line,
            severity: 'error',
        });

        return {
            type: 'List',
            children,
            start: openTok.start,
            end: text.length,
            line: openTok.line,
            endLine,
            text: text.slice(openTok.start),
        };
    }

    // 解析顶层
    const body = [];
    while (current().type !== TokenType.EOF) {
        body.push(parseExpr());
    }

    const ast = {
        type: 'Program',
        body,
        start: 0,
        end: text.length,
        line: 1,
        endLine: countLinesUpTo(text.length),
    };

    return { ast, errors };
}
```

更新导出：

```javascript
module.exports = { tokenize, parse, TokenType };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过（含 tokenize + parse 测试）

- [ ] **Step 5: 提交**

```bash
git add src/lsp/scheme-parser.js tests/test-scheme-parser.js
git commit -m "feat(lsp): add Scheme recursive descent parser"
```

---

## Task 3: Analyzer — Definitions 提取

**Files:**
- Create: `src/lsp/scheme-analyzer.js`
- Modify: `tests/test-scheme-parser.js`（追加 analyzer 测试）

- [ ] **Step 1: 添加 Analyzer Definitions 测试**

在 `tests/test-scheme-parser.js` 末尾追加（require 改为顶部统一导入）：

在文件顶部 require 行追加：
```javascript
const { analyze } = require('../src/lsp/scheme-analyzer');
```

在 `console.log` 结果行之前追加：

```javascript
console.log('\nanalyze — definitions:');

test('从 AST 提取 define 变量', () => {
    const { ast } = parse('(define TboxTest 0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'TboxTest');
    assert.strictEqual(result.definitions[0].line, 1);
});

test('从 AST 提取 define 函数', () => {
    const { ast } = parse('(define (my-func x y) (+ x y))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'my-func');
});

test('从 AST 提取跨行 define', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].endLine, 2);
    assert.ok(result.definitions[0].definitionText.includes('0.42'));
});

test('从 AST 提取 let 绑定', () => {
    const { ast } = parse('(let ((a 1) (b 2)) (+ a b))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 2);
    assert.strictEqual(result.definitions[0].name, 'a');
    assert.strictEqual(result.definitions[1].name, 'b');
});

test('从 AST 提取 let* 绑定', () => {
    const { ast } = parse('(let* ((x 1) (y 2)) y)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 2);
    assert.strictEqual(result.definitions[0].name, 'x');
});

test('从 AST 提取 letrec 绑定', () => {
    const { ast } = parse('(letrec ((even? (lambda (n) n))) (even? 10))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'even?');
});

test('AST 跳过注释中的 define', () => {
    const { ast } = parse('; (define commented 1)\n(define real 2)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'real');
});

test('AST 跳过字符串中的 define', () => {
    const { ast } = parse('(define x "(define fake 1)")');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'x');
});

test('AST 多 define 混合', () => {
    const { ast } = parse('(define x 1)\n(define y 2)\n(define (f z) (+ z 1))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 3);
    assert.strictEqual(result.definitions[0].name, 'x');
    assert.strictEqual(result.definitions[1].name, 'y');
    assert.strictEqual(result.definitions[2].name, 'f');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-scheme-parser.js`
Expected: FAIL — `Cannot find module '../src/lsp/scheme-analyzer'`

- [ ] **Step 3: 实现 scheme-analyzer.js**

创建 `src/lsp/scheme-analyzer.js`：

```javascript
// src/lsp/scheme-analyzer.js
'use strict';

/**
 * 遍历 AST 提取定义和折叠范围。
 * @param {object} ast Parser 产出的 AST 根节点（Program）
 * @returns {{ definitions: object[], foldingRanges: object[] }}
 */
function analyze(ast) {
    const definitions = [];
    const foldingRanges = [];

    function walk(node) {
        if (node.type === 'List') {
            extractDefinitionsFromList(node, definitions);
            extractFoldingRange(node, foldingRanges);
            for (const child of node.children) walk(child);
        } else if (node.type === 'Quote') {
            walk(node.expression);
        }
        // Program 节点
        if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        }
    }

    walk(ast);
    return { definitions, foldingRanges };
}

/**
 * 从 List 节点提取 define/let/let*/letrec 定义。
 */
function extractDefinitionsFromList(listNode, definitions) {
    const children = listNode.children;
    if (children.length === 0) return;

    const first = children[0];
    if (first.type !== 'Identifier') return;

    // (define name ...)
    if (first.value === 'define' && children.length >= 2) {
        if (children[1].type === 'Identifier') {
            // 变量定义
            definitions.push({
                name: children[1].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: listNode.text,
            });
        } else if (children[1].type === 'List' && children[1].children.length >= 1) {
            // 函数定义
            definitions.push({
                name: children[1].children[0].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: listNode.text,
            });
        }
        return;
    }

    // (let/let*/letrec ((var1 val1) (var2 val2) ...) ...)
    if ((first.value === 'let' || first.value === 'let*' || first.value === 'letrec')
        && children.length >= 2 && children[1].type === 'List') {
        const bindList = children[1];
        for (const binding of bindList.children) {
            if (binding.type === 'List' && binding.children.length >= 1) {
                definitions.push({
                    name: binding.children[0].value,
                    line: listNode.line,
                    endLine: listNode.endLine,
                    definitionText: listNode.text,
                });
            }
        }
    }
}

/**
 * 从跨行 List 节点提取折叠范围。
 */
function extractFoldingRange(node, ranges) {
    if (node.endLine > node.line) {
        ranges.push({
            startLine: node.line - 1,      // VSCode 0-based
            endLine: node.endLine - 1,
        });
    }
}

module.exports = { analyze };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/lsp/scheme-analyzer.js tests/test-scheme-parser.js
git commit -m "feat(lsp): add Scheme analyzer for definitions extraction"
```

---

## Task 4: Analyzer — Folding Ranges + 兼容性验证

**Files:**
- Modify: `tests/test-scheme-parser.js`

- [ ] **Step 1: 添加 Folding 测试 + 兼容性测试**

在 `tests/test-scheme-parser.js` 的测试区域追加：

```javascript
console.log('\nanalyze — folding ranges:');

test('单行表达式无折叠', () => {
    const { ast } = parse('(define x 1)');
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 0);
});

test('跨行列表产生折叠范围', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 1);
    assert.strictEqual(result.foldingRanges[0].startLine, 0); // 0-based
    assert.strictEqual(result.foldingRanges[0].endLine, 1);
});

test('嵌套折叠范围都保留', () => {
    const code = '(define (f x)\n  (let ((a 1))\n    (+ a x)))';
    const { ast } = parse(code);
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 3); // define, let, +
});

console.log('\n兼容性 — 与 definitions.js 输出对比:');

// 使用和 test-definitions.js 相同的测试用例，对比输出格式
const { extractSchemeDefinitions: oldExtract } = require('../src/definitions');

test('兼容: define 变量格式一致', () => {
    const text = '(define TboxTest 0.42)';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    assert.strictEqual(oldDefs[0].name, newDefs[0].name);
    assert.strictEqual(oldDefs[0].line, newDefs[0].line);
});

test('兼容: define 函数格式一致', () => {
    const text = '(define (my-func x y) (+ x y))';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    assert.strictEqual(oldDefs[0].name, newDefs[0].name);
});

test('兼容: let 绑定格式一致', () => {
    const text = '(let ((a 1) (b 2)) (+ a b))';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    assert.strictEqual(oldDefs[0].name, newDefs[0].name);
    assert.strictEqual(oldDefs[1].name, newDefs[1].name);
});

test('兼容: 多 define 混合格式一致', () => {
    const text = '(define x 1)\n(define y 2)\n(define (f z) (+ z 1))';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    for (let i = 0; i < oldDefs.length; i++) {
        assert.strictEqual(oldDefs[i].name, newDefs[i].name);
    }
});
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过（含兼容性对比）

- [ ] **Step 3: 提交**

```bash
git add tests/test-scheme-parser.js
git commit -m "test(lsp): add folding range and compatibility tests"
```

---

## Task 5: FoldingRange Provider

**Files:**
- Create: `src/lsp/providers/folding-provider.js`

- [ ] **Step 1: 实现 FoldingRangeProvider**

创建 `src/lsp/providers/folding-provider.js`：

```javascript
// src/lsp/providers/folding-provider.js
'use strict';

const vscode = require('vscode');
const { parse } = require('../scheme-parser');
const { analyze } = require('../scheme-analyzer');

/**
 * VSCode FoldingRangeProvider for SDE (Scheme).
 */
const foldingProvider = {
    provideFoldingRanges(document) {
        const text = document.getText();
        const { ast } = parse(text);
        const { foldingRanges } = analyze(ast);

        return foldingRanges.map(range => new vscode.FoldingRange(
            range.startLine,
            range.endLine
        ));
    },
};

module.exports = foldingProvider;
```

- [ ] **Step 2: 提交**

```bash
git add src/lsp/providers/folding-provider.js
git commit -m "feat(lsp): add FoldingRangeProvider for SDE"
```

---

## Task 6: Bracket Diagnostic Provider

**Files:**
- Create: `src/lsp/providers/bracket-diagnostic.js`

- [ ] **Step 1: 实现防抖括号诊断**

创建 `src/lsp/providers/bracket-diagnostic.js`：

```javascript
// src/lsp/providers/bracket-diagnostic.js
'use strict';

const vscode = require('vscode');
const { parse } = require('../scheme-parser');

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

const DEBOUNCE_MS = 300;

/**
 * 激活括号诊断功能。
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
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
 * 更新单个文档的诊断信息。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const text = doc.getText();
    const { errors } = parse(text);

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

- [ ] **Step 2: 提交**

```bash
git add src/lsp/providers/bracket-diagnostic.js
git commit -m "feat(lsp): add debounced bracket diagnostic provider for SDE"
```

---

## Task 7: 集成 — 替换 definitions.js Scheme 部分

**Files:**
- Modify: `src/definitions.js`

- [ ] **Step 1: 修改 definitions.js 使用 AST**

在 `src/definitions.js` 顶部添加 require：

```javascript
const { parse } = require('./lsp/scheme-parser');
const { analyze } = require('./lsp/scheme-analyzer');
```

替换 `extractSchemeDefinitions` 函数体：

```javascript
function extractSchemeDefinitions(text) {
    const { ast } = parse(text);
    const { definitions } = analyze(ast);
    return definitions;
}
```

保留原函数签名和所有其他函数不变。Tcl 部分完全不动。

- [ ] **Step 2: 运行原有测试确认通过**

Run: `node tests/test-definitions.js`
Expected: 全部通过 — 和之前结果完全一致

- [ ] **Step 3: 运行新测试确认通过**

Run: `node tests/test-scheme-parser.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/definitions.js
git commit -m "refactor: replace regex-based Scheme extraction with AST parser"
```

---

## Task 8: 集成 — 注册 Provider

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在 extension.js 中注册新 Provider**

在 `src/extension.js` 顶部 require 区域添加：

```javascript
const foldingProvider = require('./lsp/providers/folding-provider');
const bracketDiagnostic = require('./lsp/providers/bracket-diagnostic');
```

在 `activate()` 函数内，`for (const langId of languages)` 循环**之前**添加：

```javascript
// FoldingRangeProvider (SDE only)
context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
        { language: 'sde' },
        foldingProvider
    )
);

// Bracket diagnostic (SDE only)
bracketDiagnostic.activate(context);
```

- [ ] **Step 2: 手动测试**

1. 按 F5 启动 Extension Development Host
2. 打开一个 SDE `.scm` 文件
3. 验证代码折叠（多行 S-expression 出现折叠箭头）
4. 输入 `(define x` 不闭合，等待 300ms，验证红色波浪线出现
5. 闭合括号后验证红色波浪线消失
6. 打开 `tests/test-definitions.js` 和 `tests/test-scheme-parser.js`，运行确认通过

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat(lsp): register folding and bracket diagnostic providers for SDE"
```

---

## 完成检查

- [ ] 所有测试通过: `node tests/test-definitions.js && node tests/test-scheme-parser.js`
- [ ] 零 npm 依赖
- [ ] 纯 CommonJS，无构建步骤
- [ ] 代码折叠在多行 S-expression 上工作
- [ ] 括号未闭合显示红色波浪线（300ms 防抖）
- [ ] 定义提取结果和旧版完全一致
