// tests/test-symbol-index.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols, resolveSymbolName } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// --- resolveSymbolName ---
console.log('\nresolveSymbolName:');

test('String 节点直接返回 value', () => {
    const { ast } = parse('(foo "R.Si")');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 全字面量拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si"))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 多段拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si" ".Sub"))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si.Sub');
});

test('string-append 含变量返回 null', () => {
    const { ast } = parse('(foo (string-append "R." name))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, null);
});

test('string-append 空参数返回空字符串', () => {
    const { ast } = parse('(foo (string-append))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, '');
});

test('Identifier 节点返回 null', () => {
    const { ast } = parse('(foo bar)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

test('Number 节点返回 null', () => {
    const { ast } = parse('(foo 42)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
