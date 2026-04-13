# Scheme 表达式双向转换器 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SDE (Scheme) 语言实现前缀表达式与中缀/函数调用表达式的双向转换功能，通过命令面板调用。

**Architecture:** 新建 `src/commands/expression-converter.js` 作为纯逻辑模块（零 VSCode API 依赖），导出 `prefixToInfix`、`infixToPrefix`、`getSupportedOperators` 三个函数。前缀→中缀方向复用现有 `scheme-parser.js` 的 AST；中缀→前缀方向自写递归下降解析器。命令注册和 UI 交互留在 `extension.js`。

**Tech Stack:** 纯 CommonJS JavaScript，零原生依赖，Node.js assert 测试。

**设计文档:** `docs/superpowers/specs/2026-04-13-expression-converter-design.md`

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 创建 | `src/commands/expression-converter.js` | 转换核心逻辑（运算符常量 + prefixToInfix + infixToPrefix + getSupportedOperators） |
| 创建 | `tests/test-expression-converter.js` | 全部测试用例 |
| 修改 | `src/extension.js` | 导入转换器模块，注册 3 个命令 |
| 修改 | `package.json` | 添加 3 个命令声明 |

---

### Task 1: 创建转换器骨架与运算符常量

**Files:**
- Create: `src/commands/expression-converter.js`
- Create: `tests/test-expression-converter.js`

- [ ] **Step 1: 创建转换器模块骨架（运算符常量 + 空导出）**

创建 `src/commands/expression-converter.js`：

```javascript
// src/commands/expression-converter.js
'use strict';

const schemeParser = require('../lsp/scheme-parser');

// ────────────────────────────────────────────
// 运算符 / 函数分类定义
// ────────────────────────────────────────────

/**
 * 算术运算符（前缀符号 → 中缀配置）
 * multiArg: + 和 * 支持 (op a b c ...) 展开为 a op b op c
 */
const ARITHMETIC_OPS = {
    '+': { infix: '+', precedence: 1, multiArg: true },
    '-': { infix: '-', precedence: 1, multiArg: false },
    '*': { infix: '*', precedence: 2, multiArg: true },
    '/': { infix: '/', precedence: 2, multiArg: false },
};

/**
 * 特殊运算符（函数名 → 中缀符号）
 */
const SPECIAL_OPS = {
    'expt':      { infix: '^',  precedence: 3 },
    'modulo':    { infix: '%',  precedence: 2 },
    'remainder': { infix: '%%', precedence: 2 },
    'quotient':  { infix: '//', precedence: 2 },
};

/**
 * 数学函数（前缀函数调用 → 中缀函数调用格式）
 * infixName 可覆盖中缀侧的显示名称（如 ceiling → ceil）
 */
const MATH_FUNCTIONS = {
    'sin':    { infixName: 'sin' },
    'cos':    { infixName: 'cos' },
    'tan':    { infixName: 'tan' },
    'asin':   { infixName: 'asin' },
    'acos':   { infixName: 'acos' },
    'atan':   { infixName: 'atan' },
    'sqrt':   { infixName: 'sqrt' },
    'abs':    { infixName: 'abs' },
    'exp':    { infixName: 'exp' },
    'log':    { infixName: 'log' },
    'floor':  { infixName: 'floor' },
    'ceiling':{ infixName: 'ceil' },
    'round':  { infixName: 'round' },
    'min':    { infixName: 'min' },
    'max':    { infixName: 'max' },
};

/** 逆向映射：中缀符号/名称 → Scheme 前缀名称 */
const INFIX_TO_PREFIX = {};
for (const [scheme, cfg] of Object.entries(ARITHMETIC_OPS)) {
    INFIX_TO_PREFIX[cfg.infix] = { scheme, precedence: cfg.precedence, multiArg: cfg.multiArg };
}
for (const [scheme, cfg] of Object.entries(SPECIAL_OPS)) {
    INFIX_TO_PREFIX[cfg.infix] = { scheme, precedence: cfg.precedence };
}
for (const [scheme, cfg] of Object.entries(MATH_FUNCTIONS)) {
    INFIX_TO_PREFIX[cfg.infixName] = { scheme, isFunction: true };
}
// 别名：^ 也可以写作 **
INFIX_TO_PREFIX['**'] = INFIX_TO_PREFIX['^'];

// 占位导出（后续 task 逐步实现）
module.exports = {
    prefixToInfix: () => {},
    infixToPrefix: () => {},
    getSupportedOperators: () => {},
};
```

- [ ] **Step 2: 创建测试文件骨架 + 基础导入测试**

创建 `tests/test-expression-converter.js`：

```javascript
// tests/test-expression-converter.js
const assert = require('assert');
const { prefixToInfix, infixToPrefix } = require('../src/commands/expression-converter');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── prefixToInfix 基础 ─────────────────────
console.log('\nprefixToInfix - 基础运算:');

test('+ 两个参数', () => {
    assert.strictEqual(prefixToInfix('(+ 1 2)'), '1 + 2');
});

test('* 两个参数', () => {
    assert.strictEqual(prefixToInfix('(* 3 4)'), '3 * 4');
});

test('/ 两个参数', () => {
    assert.strictEqual(prefixToInfix('(/ W 2)'), 'W / 2');
});

test('- 两个参数', () => {
    assert.strictEqual(prefixToInfix('(- a b)'), 'a - b');
});

// ─── 汇总 ───────────────────────────────────
console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 3: 运行测试确认失败**

```bash
node tests/test-expression-converter.js
```

预期：测试失败（prefixToInfix 返回 undefined 或空结果）

- [ ] **Step 4: 实现 prefixToInfix 核心函数**

在 `src/commands/expression-converter.js` 中，替换 `module.exports` 之前的占位行，加入完整的 `prefixToInfix` 实现：

```javascript
// ────────────────────────────────────────────
// prefixToInfix: Scheme 前缀 → 中缀/函数调用
// ────────────────────────────────────────────

/**
 * 获取一个 AST 节点如果作为子表达式时的优先级。
 * 原子（数字/标识符）返回 Infinity（不需要括号）。
 */
function getNodePrecedence(node) {
    if (node.type !== 'List' || !node.children || node.children.length === 0) return Infinity;
    const op = node.children[0];
    if (op.type !== 'Identifier') return Infinity;
    const name = op.value;
    if (ARITHMETIC_OPS[name]) return ARITHMETIC_OPS[name].precedence;
    if (SPECIAL_OPS[name]) return SPECIAL_OPS[name].precedence;
    return Infinity; // 函数调用不需要与算术运算比较优先级
}

/**
 * 递归将 AST 节点转换为中缀字符串。
 * @param {object} node - scheme-parser 产生的 AST 节点
 * @param {number} parentPrecedence - 父运算符优先级（用于决定是否加括号）
 * @returns {string}
 */
function astToInfix(node, parentPrecedence = 0) {
    // 原子节点
    if (node.type === 'Number') return String(node.value);
    if (node.type === 'Identifier') return node.value;
    if (node.type === 'Boolean') return node.value ? '#t' : '#f';
    if (node.type === 'String') return `"${node.value}"`;

    // 非列表节点原样
    if (node.type !== 'List' || !node.children || node.children.length === 0) {
        return node.text || node.value || '';
    }

    const first = node.children[0];
    if (first.type !== 'Identifier') {
        // 非数学列表表达式，原样返回
        return node.text || '';
    }
    const opName = first.value;
    const args = node.children.slice(1);

    // ── 算术运算符 ──
    if (ARITHMETIC_OPS[opName]) {
        const cfg = ARITHMETIC_OPS[opName];

        // 单参数 - ：取负
        if (opName === '-' && args.length === 1) {
            const inner = astToInfix(args[0], cfg.precedence);
            return `-${inner}`;
        }

        // 单参数 + ：恒等（去掉外层括号）
        if (opName === '+' && args.length === 1) {
            return astToInfix(args[0], parentPrecedence);
        }

        const parts = args.map(a => astToInfix(a, cfg.precedence));
        let result;
        if (cfg.multiArg && parts.length > 2) {
            result = parts.join(` ${cfg.infix} `);
        } else {
            // 对于非 multiArg 或恰好 2 个参数，直接拼接
            result = parts.join(` ${cfg.infix} `);
        }

        // 优先级判断：如果当前优先级低于父优先级，加括号
        if (cfg.precedence < parentPrecedence) {
            result = `(${result})`;
        }
        return result;
    }

    // ── 特殊运算符（expt, modulo, remainder, quotient）──
    if (SPECIAL_OPS[opName]) {
        const cfg = SPECIAL_OPS[opName];
        if (args.length < 2) return node.text || '';

        const left = astToInfix(args[0], cfg.precedence);
        const right = astToInfix(args[1], cfg.precedence + 1); // 右侧稍高以避免不必要括号
        let result = `${left} ${cfg.infix} ${right}`;

        if (cfg.precedence < parentPrecedence) {
            result = `(${result})`;
        }
        return result;
    }

    // ── 数学函数 ──
    if (MATH_FUNCTIONS[opName]) {
        const cfg = MATH_FUNCTIONS[opName];
        const infixArgs = args.map(a => astToInfix(a));
        return `${cfg.infixName}(${infixArgs.join(', ')})`;
    }

    // 非数学表达式 → 原样返回
    return node.text || '';
}

/**
 * 将 Scheme 前缀表达式转换为中缀/函数调用格式。
 * @param {string} text - Scheme 表达式文本
 * @returns {{ result: string } | { error: string }}
 */
function prefixToInfix(text) {
    text = text.trim();
    if (!text) return { error: '空输入' };

    const { ast, errors } = schemeParser.parse(text);
    if (errors.length > 0) {
        return { error: errors.map(e => e.message).join('; ') };
    }

    // 只处理第一个顶层表达式
    if (!ast.body || ast.body.length === 0) {
        return { error: '未找到表达式' };
    }

    const result = astToInfix(ast.body[0]);
    return { result };
}
```

同时更新 `module.exports`：

```javascript
module.exports = {
    prefixToInfix,
    infixToPrefix: () => ({ error: '尚未实现' }),
    getSupportedOperators: () => ({}),
};
```

- [ ] **Step 5: 运行测试确认通过**

```bash
node tests/test-expression-converter.js
```

预期：4 个基础运算测试全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-converter.js
git commit -m "feat: 创建表达式转换器骨架与 prefixToInfix 基础实现"
```

---

### Task 2: 扩展 prefixToInfix — 嵌套、优先级、函数、边界条件

**Files:**
- Modify: `tests/test-expression-converter.js`
- Modify: `src/commands/expression-converter.js`（仅修改 `prefixToInfix` 中的 `astToInfix` 函数）

- [ ] **Step 1: 添加嵌套与优先级测试**

在 `tests/test-expression-converter.js` 的 `// ─── prefixToInfix 基础` 之前插入：

```javascript
// ─── prefixToInfix 嵌套与优先级 ─────────────
console.log('\nprefixToInfix - 嵌套与优先级:');

test('嵌套加乘法需要括号', () => {
    const r = prefixToInfix('(* (+ a b) c)');
    assert.ok(r.result);
    assert.strictEqual(r.result, '(a + b) * c');
});

test('嵌套乘加法不需要括号', () => {
    const r = prefixToInfix('(+ (* a b) (* c d))');
    assert.ok(r.result);
    assert.strictEqual(r.result, 'a * b + c * d');
});

test('深度嵌套表达式', () => {
    const r = prefixToInfix('(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)');
    assert.ok(r.result);
    assert.strictEqual(r.result, '(W / 2 + Lgate / 2 + Wspacer) / -2');
});

test('减法嵌套', () => {
    const r = prefixToInfix('(* (+ a b) (- c d))');
    assert.ok(r.result);
    assert.strictEqual(r.result, '(a + b) * (c - d)');
});

test('expt 转为 ^', () => {
    const r = prefixToInfix('(expt a 2)');
    assert.ok(r.result);
    assert.strictEqual(r.result, 'a ^ 2');
});

test('expt 与乘法嵌套', () => {
    const r = prefixToInfix('(* (expt a 2) b)');
    assert.ok(r.result);
    assert.strictEqual(r.result, 'a ^ 2 * b');
});
```

- [ ] **Step 2: 添加函数转换测试**

```javascript
// ─── prefixToInfix 函数 ─────────────────────
console.log('\nprefixToInfix - 函数转换:');

test('sin 函数', () => {
    const r = prefixToInfix('(sin x)');
    assert.strictEqual(r.result, 'sin(x)');
});

test('sqrt 函数', () => {
    const r = prefixToInfix('(sqrt x)');
    assert.strictEqual(r.result, 'sqrt(x)');
});

test('min 多参数函数', () => {
    const r = prefixToInfix('(min a b c)');
    assert.strictEqual(r.result, 'min(a, b, c)');
});

test('ceiling 映射为 ceil', () => {
    const r = prefixToInfix('(ceiling x)');
    assert.strictEqual(r.result, 'ceil(x)');
});

test('函数包含复杂参数', () => {
    const r = prefixToInfix('(sqrt (+ a b))');
    assert.strictEqual(r.result, 'sqrt(a + b)');
});
```

- [ ] **Step 3: 添加边界条件测试**

```javascript
// ─── prefixToInfix 边界条件 ─────────────────
console.log('\nprefixToInfix - 边界条件:');

test('取负 (- 5)', () => {
    const r = prefixToInfix('(- 5)');
    assert.strictEqual(r.result, '-5');
});

test('多参数加法', () => {
    const r = prefixToInfix('(+ a b c d)');
    assert.strictEqual(r.result, 'a + b + c + d');
});

test('多参数乘法', () => {
    const r = prefixToInfix('(* a b c)');
    assert.strictEqual(r.result, 'a * b * c');
});

test('单个数字不变', () => {
    const r = prefixToInfix('42');
    assert.strictEqual(r.result, '42');
});

test('单个标识符不变', () => {
    const r = prefixToInfix('W');
    assert.strictEqual(r.result, 'W');
});

test('空输入报错', () => {
    const r = prefixToInfix('');
    assert.ok(r.error);
});

test('括号不匹配报错', () => {
    const r = prefixToInfix('(+ 1 2');
    assert.ok(r.error);
});

test('非数学表达式原样返回', () => {
    const r = prefixToInfix('(define x 42)');
    assert.strictEqual(r.result, '(define x 42)');
});
```

- [ ] **Step 4: 运行测试，修复直到全部通过**

```bash
node tests/test-expression-converter.js
```

此时需要确认嵌套优先级逻辑正确。`astToInfix` 的优先级比较逻辑已在 Task 1 中实现。如果有测试失败，调整 `astToInfix` 中优先级括号逻辑。

- [ ] **Step 5: 提交**

```bash
git add tests/test-expression-converter.js src/commands/expression-converter.js
git commit -m "feat: 完善 prefixToInfix 嵌套优先级、函数转换和边界条件"
```

---

### Task 3: 实现 infix tokenizer 和 infixToPrefix 核心解析器

**Files:**
- Modify: `src/commands/expression-converter.js`（添加 infix tokenizer + infixToPrefix）
- Modify: `tests/test-expression-converter.js`（添加 infixToPrefix 测试）

- [ ] **Step 1: 添加 infixToPrefix 基础测试**

在 `tests/test-expression-converter.js` 末尾（`// ─── 汇总` 之前）插入：

```javascript
// ─── infixToPrefix 基础 ─────────────────────
console.log('\ninfixToPrefix - 基础运算:');

test('加法', () => {
    const r = infixToPrefix('1 + 2');
    assert.strictEqual(r.result, '(+ 1 2)');
});

test('减法', () => {
    const r = infixToPrefix('a - b');
    assert.strictEqual(r.result, '(- a b)');
});

test('乘法', () => {
    const r = infixToPrefix('3 * 4');
    assert.strictEqual(r.result, '(* 3 4)');
});

test('除法', () => {
    const r = infixToPrefix('W / 2');
    assert.strictEqual(r.result, '(/ W 2)');
});

test('幂运算 ^ → expt', () => {
    const r = infixToPrefix('a ^ 2');
    assert.strictEqual(r.result, '(expt a 2)');
});

test('优先级：乘法优先于加法', () => {
    const r = infixToPrefix('a * b + c');
    assert.strictEqual(r.result, '(+ (* a b) c)');
});

test('优先级：加法在括号内优先', () => {
    const r = infixToPrefix('(a + b) * c');
    assert.strictEqual(r.result, '(* (+ a b) c)');
});

test('混合优先级', () => {
    const r = infixToPrefix('a + b * c');
    assert.strictEqual(r.result, '(+ a (* b c))');
});
```

- [ ] **Step 2: 实现 infix tokenizer**

在 `src/commands/expression-converter.js` 的 `// 占位导出` 之前，添加：

```javascript
// ────────────────────────────────────────────
// infixToPrefix: 中缀/函数调用 → Scheme 前缀
// ────────────────────────────────────────────

const INFIX_TOKEN_TYPE = {
    NUMBER: 'NUMBER',
    IDENT:  'IDENT',
    OP:     'OP',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    COMMA:  'COMMA',
    EOF:    'EOF',
};

/**
 * 将中缀表达式文本拆分为 token 数组。
 */
function tokenizeInfix(text) {
    const tokens = [];
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        // 跳过空白
        if (/\s/.test(ch)) { i++; continue; }

        // 括号和逗号
        if (ch === '(') { tokens.push({ type: INFIX_TOKEN_TYPE.LPAREN, value: '(' }); i++; continue; }
        if (ch === ')') { tokens.push({ type: INFIX_TOKEN_TYPE.RPAREN, value: ')' }); i++; continue; }
        if (ch === ',') { tokens.push({ type: INFIX_TOKEN_TYPE.COMMA, value: ',' }); i++; continue; }

        // 多字符运算符优先匹配：%% // **
        if (i + 1 < text.length) {
            const two = text.slice(i, i + 2);
            if (two === '%%' || two === '//' || two === '**') {
                const mapped = two === '**' ? '^' : two;
                tokens.push({ type: INFIX_TOKEN_TYPE.OP, value: mapped });
                i += 2;
                continue;
            }
        }

        // 单字符运算符
        if ('+-*/%^'.includes(ch)) {
            tokens.push({ type: INFIX_TOKEN_TYPE.OP, value: ch });
            i++;
            continue;
        }

        // 数字（整数和浮点数，可能带负号的情况由 unary 规则处理）
        if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < text.length && /[0-9]/.test(text[i + 1]))) {
            const start = i;
            while (i < text.length && /[0-9.]/.test(text[i])) i++;
            tokens.push({ type: INFIX_TOKEN_TYPE.NUMBER, value: text.slice(start, i) });
            continue;
        }

        // 标识符（字母、数字、下划线、连字符、@）
        if (/[a-zA-Z_@]/.test(ch)) {
            const start = i;
            while (i < text.length && /[a-zA-Z0-9_@]/.test(text[i])) i++;
            tokens.push({ type: INFIX_TOKEN_TYPE.IDENT, value: text.slice(start, i) });
            continue;
        }

        // 未知字符，跳过
        i++;
    }

    tokens.push({ type: INFIX_TOKEN_TYPE.EOF, value: null });
    return tokens;
}
```

- [ ] **Step 3: 实现递归下降解析器 AST 构建部分**

继续在 `tokenizeInfix` 之后添加：

```javascript
/**
 * 递归下降解析器，将中缀 token 流解析为简单 AST。
 * AST 节点类型：
 *   { type: 'number', value: '42' }
 *   { type: 'ident',  value: 'W' }
 *   { type: 'binary', op: '+', left: node, right: node }
 *   { type: 'unary',  op: '-', operand: node }
 *   { type: 'call',   name: 'sin', args: [node, ...] }
 */
function parseInfix(tokens) {
    let pos = 0;

    function current() { return tokens[pos]; }
    function advance() { return tokens[pos++]; }

    function expect(type, value) {
        const tok = advance();
        if (tok.type !== type || (value !== undefined && tok.value !== value)) {
            throw new Error(`期望 ${value || type}，得到 ${tok.value || tok.type}（位置 ${pos}）`);
        }
        return tok;
    }

    // expression → term (('+' | '-') term)*
    function parseExpression() {
        let left = parseTerm();
        while (current().type === INFIX_TOKEN_TYPE.OP &&
               (current().value === '+' || current().value === '-')) {
            const op = advance().value;
            const right = parseTerm();
            left = { type: 'binary', op, left, right };
        }
        return left;
    }

    // term → power (('*' | '/' | '%' | '%%' | '//') power)*
    function parseTerm() {
        let left = parsePower();
        while (current().type === INFIX_TOKEN_TYPE.OP &&
               ['*', '/', '%', '%%', '//'].includes(current().value)) {
            const op = advance().value;
            const right = parsePower();
            left = { type: 'binary', op, left, right };
        }
        return left;
    }

    // power → unary ('^' unary)*  （右结合）
    function parsePower() {
        let base = parseUnary();
        if (current().type === INFIX_TOKEN_TYPE.OP && current().value === '^') {
            advance();
            const exp = parsePower(); // 右结合：递归调用自身
            return { type: 'binary', op: '^', left: base, right: exp };
        }
        return base;
    }

    // unary → '-' unary | call
    function parseUnary() {
        if (current().type === INFIX_TOKEN_TYPE.OP && current().value === '-') {
            advance();
            const operand = parseUnary();
            return { type: 'unary', op: '-', operand };
        }
        return parseCall();
    }

    // call → IDENT '(' args ')' | atom
    function parseCall() {
        if (current().type === INFIX_TOKEN_TYPE.IDENT &&
            pos + 1 < tokens.length &&
            tokens[pos + 1].type === INFIX_TOKEN_TYPE.LPAREN) {
            const name = advance().value;
            advance(); // 跳过 '('
            const args = [];
            if (current().type !== INFIX_TOKEN_TYPE.RPAREN) {
                args.push(parseExpression());
                while (current().type === INFIX_TOKEN_TYPE.COMMA) {
                    advance();
                    args.push(parseExpression());
                }
            }
            expect(INFIX_TOKEN_TYPE.RPAREN);
            return { type: 'call', name, args };
        }
        return parseAtom();
    }

    // atom → NUMBER | IDENT | '(' expression ')'
    function parseAtom() {
        const tok = current();
        if (tok.type === INFIX_TOKEN_TYPE.NUMBER) {
            advance();
            return { type: 'number', value: tok.value };
        }
        if (tok.type === INFIX_TOKEN_TYPE.IDENT) {
            advance();
            return { type: 'ident', value: tok.value };
        }
        if (tok.type === INFIX_TOKEN_TYPE.LPAREN) {
            advance();
            const expr = parseExpression();
            expect(INFIX_TOKEN_TYPE.RPAREN);
            return expr;
        }
        throw new Error(`意外的 token: ${tok.value || tok.type}（位置 ${pos}）`);
    }

    const ast = parseExpression();
    if (current().type !== INFIX_TOKEN_TYPE.EOF) {
        throw new Error(`多余的输入: ${current().value}（位置 ${pos}）`);
    }
    return ast;
}
```

- [ ] **Step 4: 实现 AST→前缀序列化 + infixToPrefix 函数**

继续添加：

```javascript
/**
 * 将解析后的 AST 节点序列化为 Scheme 前缀字符串。
 */
function astToPrefix(node) {
    if (node.type === 'number') return node.value;
    if (node.type === 'ident') return node.value;

    if (node.type === 'unary') {
        if (node.op === '-') {
            return `(- ${astToPrefix(node.operand)})`;
        }
    }

    if (node.type === 'binary') {
        const mapping = INFIX_TO_PREFIX[node.op];
        const schemeOp = mapping ? mapping.scheme : node.op;
        const left = astToPrefix(node.left);
        const right = astToPrefix(node.right);
        return `(${schemeOp} ${left} ${right})`;
    }

    if (node.type === 'call') {
        const mapping = INFIX_TO_PREFIX[node.name];
        const schemeName = mapping ? mapping.scheme : node.name;
        const args = node.args.map(a => astToPrefix(a)).join(' ');
        return `(${schemeName} ${args})`;
    }

    return String(node.value || '');
}

/**
 * 将中缀/函数调用表达式转换为 Scheme 前缀格式。
 * @param {string} text - 中缀表达式文本
 * @returns {{ result: string } | { error: string }}
 */
function infixToPrefix(text) {
    text = text.trim();
    if (!text) return { error: '空输入' };

    // 如果整个表达式被括号包裹，去掉外层括号
    if (text.startsWith('(') && text.endsWith(')')) {
        let depth = 0;
        let isWrapped = true;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') depth++;
            if (text[i] === ')') depth--;
            if (depth === 0 && i < text.length - 1) { isWrapped = false; break; }
        }
        if (isWrapped) text = text.slice(1, -1).trim();
    }

    try {
        const tokens = tokenizeInfix(text);
        const ast = parseInfix(tokens);
        const result = astToPrefix(ast);
        return { result };
    } catch (e) {
        return { error: e.message };
    }
}
```

更新 `module.exports`：

```javascript
module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators: () => ({}),
};
```

- [ ] **Step 5: 运行测试确认通过**

```bash
node tests/test-expression-converter.js
```

预期：所有基础测试和 infixToPrefix 基础测试通过。

- [ ] **Step 6: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-converter.js
git commit -m "feat: 实现 infixToPrefix 递归下降解析器"
```

---

### Task 4: 扩展 infixToPrefix — 函数、取负、特殊运算符、边界条件

**Files:**
- Modify: `tests/test-expression-converter.js`
- Modify: `src/commands/expression-converter.js`（可能需要微调）

- [ ] **Step 1: 添加函数和特殊运算符测试**

在 `tests/test-expression-converter.js` 的 infixToPrefix 基础测试之后（`// ─── 汇总` 之前）插入：

```javascript
// ─── infixToPrefix 函数和特殊运算符 ─────────
console.log('\ninfixToPrefix - 函数和特殊运算符:');

test('sin 函数', () => {
    const r = infixToPrefix('sin(x)');
    assert.strictEqual(r.result, '(sin x)');
});

test('sqrt 函数', () => {
    const r = infixToPrefix('sqrt(a + b)');
    assert.strictEqual(r.result, '(sqrt (+ a b))');
});

test('min 多参数函数', () => {
    const r = infixToPrefix('min(a, b, c)');
    assert.strictEqual(r.result, '(min a b c)');
});

test('max 多参数函数', () => {
    const r = infixToPrefix('max(a, b, c)');
    assert.strictEqual(r.result, '(max a b c)');
});

test('ceil 映射为 ceiling', () => {
    const r = infixToPrefix('ceil(x)');
    assert.strictEqual(r.result, '(ceiling x)');
});

test('% 映射为 modulo', () => {
    const r = infixToPrefix('a % b');
    assert.strictEqual(r.result, '(modulo a b)');
});

test('%% 映射为 remainder', () => {
    const r = infixToPrefix('a %% b');
    assert.strictEqual(r.result, '(remainder a b)');
});

test('// 映射为 quotient', () => {
    const r = infixToPrefix('a // b');
    assert.strictEqual(r.result, '(quotient a b)');
});

test('** 映射为 expt', () => {
    const r = infixToPrefix('a ** 2');
    assert.strictEqual(r.result, '(expt a 2)');
});
```

- [ ] **Step 2: 添加边界条件测试**

```javascript
// ─── infixToPrefix 边界条件 ─────────────────
console.log('\ninfixToPrefix - 边界条件:');

test('取负 -a', () => {
    const r = infixToPrefix('-a');
    assert.strictEqual(r.result, '(- a)');
});

test('负数作除数 a / -2', () => {
    const r = infixToPrefix('a / -2');
    assert.strictEqual(r.result, '(/ a -2)');
});

test('单个数字不变', () => {
    const r = infixToPrefix('42');
    assert.strictEqual(r.result, '42');
});

test('单个标识符不变', () => {
    const r = infixToPrefix('W');
    assert.strictEqual(r.result, 'W');
});

test('空输入报错', () => {
    const r = infixToPrefix('');
    assert.ok(r.error);
});

test('非法表达式报错', () => {
    const r = infixToPrefix('1 + + 2');
    assert.ok(r.error);
});

test('外层括号自动去除', () => {
    const r = infixToPrefix('(a + b)');
    assert.strictEqual(r.result, '(+ a b)');
});

test('复杂嵌套表达式', () => {
    const r = infixToPrefix('(W/2 + Lgate/2 + Wspacer)/-2');
    assert.ok(r.result);
    assert.ok(r.result.startsWith('(/ '));
});
```

- [ ] **Step 3: 运行测试，修复直到全部通过**

```bash
node tests/test-expression-converter.js
```

注意 `a / -2` 的处理：tokenizer 需要把 `-2` 正确识别为操作符 `-` 后跟数字 `2`，而不是一个负数 token。解析器的 `parseUnary` 规则已经处理了 `-` 作为一元运算符。如有问题，检查 `tokenizeInfix` 的负号处理。

- [ ] **Step 4: 提交**

```bash
git add tests/test-expression-converter.js src/commands/expression-converter.js
git commit -m "feat: 完善 infixToPrefix 函数、特殊运算符和边界条件测试"
```

---

### Task 5: 实现 getSupportedOperators

**Files:**
- Modify: `src/commands/expression-converter.js`

- [ ] **Step 1: 实现 getSupportedOperators 函数**

在 `src/commands/expression-converter.js` 中，替换空的 `getSupportedOperators`：

```javascript
/**
 * 返回支持的运算符和函数列表，供帮助命令使用。
 * @returns {Array<{category: string, items: Array<{scheme: string, infix: string, description: string, example_scheme: string, example_infix: string}>}>}
 */
function getSupportedOperators() {
    return [
        {
            category: '算术运算符',
            items: [
                { scheme: '+', infix: '+', description: '加法（支持多参数）', example_scheme: '(+ a b c)', example_infix: 'a + b + c' },
                { scheme: '-', infix: '-', description: '减法 / 取负', example_scheme: '(- a b)', example_infix: 'a - b' },
                { scheme: '*', infix: '*', description: '乘法（支持多参数）', example_scheme: '(* a b c)', example_infix: 'a * b * c' },
                { scheme: '/', infix: '/', description: '除法', example_scheme: '(/ a b)', example_infix: 'a / b' },
            ],
        },
        {
            category: '特殊运算符',
            items: [
                { scheme: 'expt', infix: '^ 或 **', description: '幂运算', example_scheme: '(expt a b)', example_infix: 'a ^ b' },
                { scheme: 'modulo', infix: '%', description: '取模（结果符号与除数相同）', example_scheme: '(modulo a b)', example_infix: 'a % b' },
                { scheme: 'remainder', infix: '%%', description: '取余（结果符号与被除数相同）', example_scheme: '(remainder a b)', example_infix: 'a %% b' },
                { scheme: 'quotient', infix: '//', description: '取整商', example_scheme: '(quotient a b)', example_infix: 'a // b' },
            ],
        },
        {
            category: '数学函数',
            items: [
                { scheme: 'sin', infix: 'sin()', description: '正弦（弧度）', example_scheme: '(sin x)', example_infix: 'sin(x)' },
                { scheme: 'cos', infix: 'cos()', description: '余弦（弧度）', example_scheme: '(cos x)', example_infix: 'cos(x)' },
                { scheme: 'tan', infix: 'tan()', description: '正切（弧度）', example_scheme: '(tan x)', example_infix: 'tan(x)' },
                { scheme: 'asin', infix: 'asin()', description: '反正弦', example_scheme: '(asin x)', example_infix: 'asin(x)' },
                { scheme: 'acos', infix: 'acos()', description: '反余弦', example_scheme: '(acos x)', example_infix: 'acos(x)' },
                { scheme: 'atan', infix: 'atan()', description: '反正切（1~2 个参数）', example_scheme: '(atan y x)', example_infix: 'atan(y, x)' },
                { scheme: 'sqrt', infix: 'sqrt()', description: '平方根', example_scheme: '(sqrt x)', example_infix: 'sqrt(x)' },
                { scheme: 'abs', infix: 'abs()', description: '绝对值', example_scheme: '(abs x)', example_infix: 'abs(x)' },
                { scheme: 'exp', infix: 'exp()', description: '指数函数 e^x', example_scheme: '(exp x)', example_infix: 'exp(x)' },
                { scheme: 'log', infix: 'log()', description: '自然对数', example_scheme: '(log x)', example_infix: 'log(x)' },
            ],
        },
        {
            category: '取整函数',
            items: [
                { scheme: 'floor', infix: 'floor()', description: '向下取整', example_scheme: '(floor x)', example_infix: 'floor(x)' },
                { scheme: 'ceiling', infix: 'ceil()', description: '向上取整', example_scheme: '(ceiling x)', example_infix: 'ceil(x)' },
                { scheme: 'round', infix: 'round()', description: '四舍五入', example_scheme: '(round x)', example_infix: 'round(x)' },
            ],
        },
        {
            category: '聚合函数',
            items: [
                { scheme: 'min', infix: 'min()', description: '最小值（支持多参数）', example_scheme: '(min a b c)', example_infix: 'min(a, b, c)' },
                { scheme: 'max', infix: 'max()', description: '最大值（支持多参数）', example_scheme: '(max a b c)', example_infix: 'max(a, b, c)' },
            ],
        },
    ];
}
```

更新 `module.exports`：

```javascript
module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators,
};
```

- [ ] **Step 2: 添加 getSupportedOperators 测试**

在 `tests/test-expression-converter.js` 中添加（`// ─── 汇总` 之前）：

```javascript
// ─── getSupportedOperators ──────────────────
console.log('\ngetSupportedOperators:');

test('返回分类列表', () => {
    const { getSupportedOperators } = require('../src/commands/expression-converter');
    const cats = getSupportedOperators();
    assert.ok(Array.isArray(cats));
    assert.ok(cats.length >= 3);
    assert.ok(cats[0].category);
    assert.ok(cats[0].items.length > 0);
});
```

注意：需要在文件顶部的 require 中添加 `getSupportedOperators`。

- [ ] **Step 3: 运行测试确认通过**

```bash
node tests/test-expression-converter.js
```

- [ ] **Step 4: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-converter.js
git commit -m "feat: 实现 getSupportedOperators 帮助数据函数"
```

---

### Task 6: 往返一致性测试

**Files:**
- Modify: `tests/test-expression-converter.js`

- [ ] **Step 1: 添加往返测试**

在 `tests/test-expression-converter.js` 中（`// ─── 汇总` 之前）插入：

```javascript
// ─── 往返一致性 ─────────────────────────────
console.log('\n往返一致性测试:');

test('前缀→中缀→前缀: 加法', () => {
    const original = '(+ a b)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 乘法', () => {
    const original = '(* a b)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 除法', () => {
    const original = '(/ W 2)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 幂运算', () => {
    const original = '(expt a 2)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 函数', () => {
    const original = '(sin x)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 嵌套乘加', () => {
    const original = '(+ (* a b) c)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 简单加法', () => {
    const original = 'a + b';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 带括号混合运算', () => {
    const original = 'a * b + c';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 函数调用', () => {
    const original = 'sin(x)';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});
```

- [ ] **Step 2: 运行测试，修复不一致**

```bash
node tests/test-expression-converter.js
```

重点关注往返一致性。如有失败，通常是括号生成/消除逻辑的问题，调整对应方向的序列化逻辑。

- [ ] **Step 3: 提交**

```bash
git add tests/test-expression-converter.js
git commit -m "test: 添加表达式转换往返一致性测试"
```

---

### Task 7: 在 package.json 中注册命令

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加命令声明**

在 `package.json` 的 `contributes.commands` 数组中，在现有的 `sentaurus.insertSnippet` 条目后添加三个新命令：

```json
{
    "command": "sentaurus.scheme2infix",
    "title": "Sentaurus: Scheme → Infix"
},
{
    "command": "sentaurus.infix2scheme",
    "title": "Sentaurus: Infix → Scheme"
},
{
    "command": "sentaurus.exprHelp",
    "title": "Sentaurus: Expression Help"
}
```

- [ ] **Step 2: 验证 JSON 格式正确**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('JSON valid')"
```

预期输出：`JSON valid`

- [ ] **Step 3: 提交**

```bash
git add package.json
git commit -m "feat: 在 package.json 中注册表达式转换命令"
```

---

### Task 8: 在 extension.js 中实现命令处理器

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在文件顶部添加导入**

在 `src/extension.js` 的 require 区域（第 9 行之后）添加：

```javascript
const expressionConverter = require('./commands/expression-converter');
```

- [ ] **Step 2: 在 activate() 函数末尾添加转换命令注册**

在 `context.subscriptions.push(snippetDisposable);` 之后、`activate` 函数闭合花括号 `}` 之前，添加：

```javascript
    // ── 表达式转换命令 ──────────────────────────
    const s2iHistory = [];
    const i2sHistory = [];

    function registerConvertCommand(commandId, convertFn, history, promptText, placeHolder) {
        return vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.selection : null;
            const selectedText = selection && !selection.isEmpty ? editor.document.getText(selection) : '';

            if (selectedText) {
                // 有选中文本 → 直接转换并替换
                const { result, error } = convertFn(selectedText);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }
                editor.edit(builder => {
                    builder.replace(selection, result);
                });
                return;
            }

            // 无选中文本 → 弹出输入框
            const input = await vscode.window.showInputBox({
                prompt: promptText,
                placeHolder: placeHolder,
                history: history,
            });
            if (input === undefined) return; // 用户按 Esc

            const { result, error } = convertFn(input);
            if (error) {
                vscode.window.showErrorMessage(`转换失败: ${error}`);
                return;
            }

            // 添加到历史
            if (!history.includes(input)) {
                history.unshift(input);
                if (history.length > 20) history.pop();
            }

            if (editor) {
                // 插入到光标位置并全选
                const cursor = editor.selection.active;
                editor.edit(builder => {
                    builder.insert(cursor, result);
                }).then(success => {
                    if (success) {
                        const startPos = cursor;
                        const endPos = cursor.translate(0, result.length);
                        editor.selection = new vscode.Selection(startPos, endPos);
                    }
                });
            } else {
                vscode.env.clipboard.writeText(result);
                vscode.window.showInformationMessage(`已复制到剪贴板: ${result}`);
            }
        });
    }

    context.subscriptions.push(
        registerConvertCommand(
            'sentaurus.scheme2infix',
            expressionConverter.prefixToInfix,
            s2iHistory,
            '输入 Scheme 前缀表达式，转换为中缀格式',
            '↑↓ 浏览历史 | 例: (+ (/ W 2) (/ L 2))'
        ),
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            i2sHistory,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '↑↓ 浏览历史 | 例: (W/2 + L/2)'
        ),
    );

    // ── 表达式帮助命令 ──────────────────────────
    const helpDisposable = vscode.commands.registerCommand('sentaurus.exprHelp', async () => {
        const categories = expressionConverter.getSupportedOperators();
        const items = [];
        for (const cat of categories) {
            // 分组标题
            items.push({ label: cat.category, kind: vscode.QuickPickItemKind.Separator });
            for (const item of cat.items) {
                items.push({
                    label: `${item.scheme} ↔ ${item.infix}`,
                    description: item.description,
                    detail: `示例: ${item.example_scheme} ↔ ${item.example_infix}`,
                });
            }
        }
        // 格式说明分隔
        items.push({ label: '格式说明', kind: vscode.QuickPickItemKind.Separator });
        items.push({
            label: '算术运算 → 中缀',
            description: '符号前置 → 符号居中',
            detail: '(+ a b) → a + b,  (* a b) → a * b,  (expt a b) → a ^ b',
        });
        items.push({
            label: '数学函数 → 函数调用',
            description: '括号前置 → 函数名(参数)',
            detail: '(sin x) → sin(x),  (min a b c) → min(a, b, c)',
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '支持的运算符和函数 — 选中可插入代码片段',
            matchOnDescription: true,
            matchOnDetail: true,
        });
        if (!selected || selected.kind) return; // Esc 或点击了分隔符

        // 提取 scheme 示例并插入
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const detail = selected.detail || '';
            const schemeExample = detail.match(/示例: ([^(↔]+)/);
            if (schemeExample) {
                editor.edit(builder => {
                    builder.insert(editor.selection.active, schemeExample[1].trim());
                });
            }
        }
    });
    context.subscriptions.push(helpDisposable);
```

- [ ] **Step 3: 运行扩展测试验证命令注册无误**

启动 Extension Development Host（F5），在命令面板中搜索 `Sentaurus:` 确认三个新命令出现。

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: 在 extension.js 中注册表达式转换和帮助命令"
```

---

### Task 9: 集成测试与最终验证

**Files:**
- Modify: `tests/test-expression-converter.js`（补充遗漏的测试）

- [ ] **Step 1: 运行全部测试**

```bash
node tests/test-expression-converter.js
```

预期：所有测试通过，0 失败。

- [ ] **Step 2: 运行现有测试确保无回归**

```bash
node tests/test-definitions.js
```

预期：所有现有测试仍然通过。

- [ ] **Step 3: 在 Extension Development Host 中手动测试**

1. 打开一个 `*_dvs.cmd` 文件
2. 选中一段 Scheme 表达式（如 `(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)`）
3. 执行 `Sentaurus: Scheme → Infix` → 验证选区被替换为中缀格式
4. Ctrl+Z 撤销
5. 执行 `Sentaurus: Infix → Scheme`，在输入框中输入 `(W/2 + Lgate/2 + Wspacer)/-2`
6. 验证结果正确插入到光标处并被全选
7. 执行 `Sentaurus: Expression Help` → 验证 QuickPick 显示运算符列表

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "test: 完成表达式转换器集成测试验证"
```

---

## 自审清单

- [x] **Spec 覆盖度**：运算符分类表 → Task 1, 2, 3, 4；prefixToInfix → Task 1, 2；infixToPrefix → Task 3, 4；getSupportedOperators → Task 5；命令注册 → Task 7, 8；测试策略 → Task 2, 4, 6；交互流程 → Task 8
- [x] **占位符扫描**：无 TBD、TODO、"implement later"、"add appropriate"
- [x] **类型一致性**：`prefixToInfix` 和 `infixToPrefix` 在所有 task 中返回 `{ result } | { error }` 格式一致；`getSupportedOperators` 返回数组结构在定义和使用处一致
