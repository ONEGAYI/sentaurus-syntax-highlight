'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== P0: Quote+EOF 空指针崩溃修复 ===\n');

test('Quote 后紧跟 EOF 不崩溃', () => {
    const { ast, errors } = parse("'hello");
    assert.ok(ast, '应返回有效 AST');
    assert.strictEqual(ast.body.length, 1);
    const quoteNode = ast.body[0];
    assert.strictEqual(quoteNode.type, 'Quote');
    assert.strictEqual(quoteNode.end, 6);
    assert.strictEqual(quoteNode.endLine, 1);
});

test('空引号 + EOF 不崩溃', () => {
    const { ast, errors } = parse("'");
    assert.ok(ast, '应返回有效 AST');
    assert.strictEqual(ast.body.length, 1);
    assert.strictEqual(ast.body[0].type, 'Quote');
    assert.ok(typeof ast.body[0].end === 'number');
    assert.ok(typeof ast.body[0].endLine === 'number');
});

test("嵌套引用中的 Quote+EOF", () => {
    const { ast, errors } = parse("(define x ')");
    assert.ok(ast, '应返回有效 AST');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
