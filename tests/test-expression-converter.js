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

// ─── 汇总 ───────────────────────────────────
console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
