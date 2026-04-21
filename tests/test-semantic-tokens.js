'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSemanticTokens, TOKEN_TYPES, TOKEN_MODIFIERS } = require('../src/lsp/providers/semantic-tokens-provider');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

console.log('\nsemantic-tokens — extractSemanticTokens:');

test('调用用户函数被标记为 function', () => {
    const text = '(define f (lambda (x) x))\n(f 42)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 5);
    assert.strictEqual(data[0], 1);
    assert.strictEqual(data[1], 1);
    assert.strictEqual(data[2], 1);
});

test('定义处 name 不被标记', () => {
    const text = '(define f (lambda (x) x))';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 0);
});

test('普通变量调用不被标记', () => {
    const text = '(define x 42)\n(+ x 1)';
    const { ast } = parse(text);
    const userFuncNames = new Set();
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 0);
});

test('多次调用同一函数全部标记', () => {
    const text = '(define f (lambda (x) x))\n(f 1)\n(f 2)\n(f 3)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 15);
});

test('缩写形式 define 函数也被标记', () => {
    const text = '(define (my-func a b) (+ a b))\n(my-func 1 2)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['my-func']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 5);
});

test('注释跳过不干扰', () => {
    const text = '(define f (lambda (x) x))\n( ; comment\n  f 42)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 5);
});

test('TOKEN_TYPES 和 TOKEN_MODIFIERS 导出', () => {
    assert.ok(Array.isArray(TOKEN_TYPES));
    assert.ok(TOKEN_TYPES.includes('function'));
    assert.ok(Array.isArray(TOKEN_MODIFIERS));
});

test('缩写形式定义签名不被误标记', () => {
    const text = '(define (my-func a b) (+ a b))\n(my-func 1 2)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['my-func']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 5);
    assert.strictEqual(data[0], 1);
});

test('define 体内的其他函数调用被正确标记', () => {
    const text = '(define f (lambda (x) x))\n(define g (lambda (y) (f y)))';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f', 'g']);
    const data = extractSemanticTokens(ast, userFuncNames, computeLineStarts(text));
    assert.strictEqual(data.length, 5);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
