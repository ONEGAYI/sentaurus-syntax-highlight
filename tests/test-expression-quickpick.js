// tests/test-expression-quickpick.js
const assert = require('assert');
const {
    getLastWordPrefix,
    replaceLastWord,
    parseHistoryInput,
} = require('../src/commands/expression-converter');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── getLastWordPrefix ────────────────────
console.log('\ngetLastWordPrefix:');

test('提取简单标识符前缀', () => {
    assert.strictEqual(getLastWordPrefix('W + Wid'), 'Wid');
});

test('空字符串返回空', () => {
    assert.strictEqual(getLastWordPrefix(''), '');
});

test('光标在运算符后返回空', () => {
    assert.strictEqual(getLastWordPrefix('a + '), '');
});

test('开头就是标识符', () => {
    assert.strictEqual(getLastWordPrefix('Width'), 'Width');
});

test('括号后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('sin(W'), 'W');
});

test('逗号后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('max(a, b, Wi'), 'Wi');
});

test('多个运算符后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('a * b + Wid'), 'Wid');
});

test('@ 开头的标识符（SWB 参数）', () => {
    assert.strictEqual(getLastWordPrefix('@W@ + @L'), '@L');
});

// ─── replaceLastWord ──────────────────────
console.log('\nreplaceLastWord:');

test('替换最后一个词', () => {
    assert.strictEqual(replaceLastWord('W + Wid', 'Width'), 'W + Width');
});

test('空值直接追加', () => {
    assert.strictEqual(replaceLastWord('', 'Width'), 'Width');
});

test('没有标识符时追加', () => {
    assert.strictEqual(replaceLastWord('a + ', 'Width'), 'a + Width');
});

test('替换开头标识符', () => {
    assert.strictEqual(replaceLastWord('Wid', 'Width'), 'Width');
});

test('括号内替换', () => {
    assert.strictEqual(replaceLastWord('sin(Wid', 'Width'), 'sin(Width');
});

// ─── parseHistoryInput ────────────────────
console.log('\nparseHistoryInput:');

test('非历史模式返回 null', () => {
    assert.strictEqual(parseHistoryInput('W + L'), null);
});

test('空字符串返回 null', () => {
    assert.strictEqual(parseHistoryInput(''), null);
});

test('! 返回全部历史', () => {
    const r = parseHistoryInput('!');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: '' });
});

test('!3 返回精确序号', () => {
    const r = parseHistoryInput('!3');
    assert.deepStrictEqual(r, { mode: 'history', index: 3, filter: '' });
});

test('! W + L 返回过滤模式', () => {
    const r = parseHistoryInput('! W + L');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'W + L' });
});

test('!30 超范围序号仍返回解析结果', () => {
    const r = parseHistoryInput('!30');
    assert.deepStrictEqual(r, { mode: 'history', index: 30, filter: '' });
});

test('!0 返回 0 序号', () => {
    const r = parseHistoryInput('!0');
    assert.deepStrictEqual(r, { mode: 'history', index: 0, filter: '' });
});

test('!abc 无空格按模糊匹配处理', () => {
    const r = parseHistoryInput('!abc');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'abc' });
});

// ─── Summary ──────────────────────────────
console.log(`\n${'='.repeat(40)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
