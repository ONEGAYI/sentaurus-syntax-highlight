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
    const tokens = tokenize('#t #f');
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
