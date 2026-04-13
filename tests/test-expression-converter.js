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

// ─── 汇总 ───────────────────────────────────
console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
