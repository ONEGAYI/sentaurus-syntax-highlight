// tests/test-scheme-var-refs.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { buildScopeTree, getSchemeRefs, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');

console.log('\n=== getSchemeRefs 测试 ===\n');

test('收集简单标识符引用', () => {
    const code = '(define x 42)\n(+ x 1)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast, new Set(['+']));
    // x 在第 2 行被引用
    const xRefs = refs.filter(r => r.name === 'x' && r.line === 2);
    assert.ok(xRefs.length >= 1, `应有 x 的引用（行2），实际 ${xRefs.length}`);
    assert.strictEqual(xRefs[0].line, 2);
});

test('排除 define 特殊形式本身', () => {
    const code = '(define x 42)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // "define" 不应出现在引用中
    const defineRefs = refs.filter(r => r.name === 'define');
    assert.strictEqual(defineRefs.length, 0, 'define 不应是引用');
});

test('排除 Scheme 内置函数', () => {
    const code = '(+ 1 2)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast, new Set(['+']));
    // "+" 通过 knownNames 排除，不应出现在引用中
    const plusRefs = refs.filter(r => r.name === '+');
    assert.strictEqual(plusRefs.length, 0, '+ 不应是引用（内置函数）');
});

test('排除字符串内的标识符', () => {
    const code = '(define x "hello world")';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast);
    // 字符串内容不应产生引用
    const helloRefs = refs.filter(r => r.name === 'hello');
    assert.strictEqual(helloRefs.length, 0, '字符串内容不应产生引用');
});

test('排除数字字面量', () => {
    const code = '(+ 1 2.5)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast, new Set(['+']));
    assert.strictEqual(refs.length, 0, '数字不应产生引用');
});

test('lambda 参数在 body 内的引用', () => {
    const code = '((lambda (x) (+ x 1)) 42)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast, new Set(['+']));
    const xRefs = refs.filter(r => r.name === 'x');
    assert.ok(xRefs.length >= 1, 'x 在 lambda body 中被引用');
});

test('未定义变量被收集', () => {
    const code = '(+ undefined_var 1)';
    const { ast } = parse(code);
    const refs = getSchemeRefs(ast, new Set(['+']));
    const undefRefs = refs.filter(r => r.name === 'undefined_var');
    assert.strictEqual(undefRefs.length, 1, '未定义变量应被收集');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
