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
    assert.strictEqual(prefixToInfix('(+ 1 2)').result, '1 + 2');
});

test('* 两个参数', () => {
    assert.strictEqual(prefixToInfix('(* 3 4)').result, '3 * 4');
});

test('/ 两个参数', () => {
    assert.strictEqual(prefixToInfix('(/ W 2)').result, 'W / 2');
});

test('- 两个参数', () => {
    assert.strictEqual(prefixToInfix('(- a b)').result, 'a - b');
});

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

// ─── 汇总 ───────────────────────────────────
console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
