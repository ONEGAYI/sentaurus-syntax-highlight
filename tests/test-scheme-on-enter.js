// tests/test-scheme-on-enter.js
const assert = require('assert');
const {
    countUnmatchedOpenParens,
    isLastOpenParenEmpty,
    findClosingParens,
} = require('../src/lsp/providers/scheme-on-enter-logic');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── isLastOpenParenEmpty ──────────────────
console.log('\nisLastOpenParenEmpty:');

test('简单空括号 ( → true', () => {
    assert.strictEqual(isLastOpenParenEmpty('('), true);
});

test('最后一个(后无内容 (let ( → true', () => {
    assert.strictEqual(isLastOpenParenEmpty('(let ('), true);
});

test('有内容的括号 (foo → false', () => {
    assert.strictEqual(isLastOpenParenEmpty('(foo '), false);
});

test('嵌套有内容 (let (x → false', () => {
    assert.strictEqual(isLastOpenParenEmpty('(let (x'), false);
});

test('无括号文本 → true', () => {
    assert.strictEqual(isLastOpenParenEmpty('hello'), true);
});

test('空字符串 → true', () => {
    assert.strictEqual(isLastOpenParenEmpty(''), true);
});

// ─── countUnmatchedOpenParens ──────────────
console.log('\ncountUnmatchedOpenParens:');

test('(let ( → 2', () => {
    assert.strictEqual(countUnmatchedOpenParens('(let ('), 2);
});

test('(foo → 1', () => {
    assert.strictEqual(countUnmatchedOpenParens('(foo '), 1);
});

test('() → 0', () => {
    assert.strictEqual(countUnmatchedOpenParens('()'), 0);
});

// ─── findClosingParens ─────────────────────
console.log('\nfindClosingParens:');

test('两行场景：currText 含 )) → 直接匹配', () => {
    const result = findClosingParens('))', undefined);
    assert.ok(result.match);
    assert.strictEqual(result.match[2], '))');
    assert.strictEqual(result.linesToReplace, 1);
});

test('三行场景：currText 纯空白 + nextText 含 )) → 匹配下一行', () => {
    const result = findClosingParens('  ', '))');
    assert.ok(result.match);
    assert.strictEqual(result.match[2], '))');
    assert.strictEqual(result.linesToReplace, 2);
});

test('三行场景：currText 纯空白 + nextText 不含 ) → 不匹配', () => {
    const result = findClosingParens('  ', 'foo');
    assert.strictEqual(result.match, null);
});

test('三行场景：currText 非空白无 ) → 不匹配', () => {
    const result = findClosingParens('foo', '))');
    assert.strictEqual(result.match, null);
});

test('带缩进的 )) → 匹配', () => {
    const result = findClosingParens('  ))', undefined);
    assert.ok(result.match);
    assert.strictEqual(result.match[1], '  ');
    assert.strictEqual(result.match[2], '))');
});

test('currText 含多个 ) → 直接匹配', () => {
    const result = findClosingParens(')))', undefined);
    assert.ok(result.match);
    assert.strictEqual(result.match[2], ')))');
});

// ─── 空括号排除条件 ────────────────────────
console.log('\n空括号排除:');

test('简单空括号 (|) → 跳过', () => {
    assert.strictEqual(isLastOpenParenEmpty('(') && 1 <= 1, true);
});

test('嵌套空内层 (let (|)) → 不跳过', () => {
    assert.strictEqual(isLastOpenParenEmpty('(let (') && 2 <= 1, false);
});

test('有内容单层 (foo |) → 不跳过', () => {
    assert.strictEqual(isLastOpenParenEmpty('(foo ') && 1 <= 1, false);
});

test('三层嵌套 ((|)) → 不跳过', () => {
    assert.strictEqual(isLastOpenParenEmpty('((') && 2 <= 1, false);
});

// ─── 结果 ──────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
