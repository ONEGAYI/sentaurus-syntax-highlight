// tests/test-scheme-undef-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree, getVisibleDefinitions, getSchemeRefs } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 未定义变量检测集成测试 ===\n');

/**
 * 模拟完整的检测流程（不依赖 VSCode API）
 */
function findUndefRefs(code, knownNames) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const refs = getSchemeRefs(ast, knownNames || new Set());
    const undefs = [];

    for (const ref of refs) {
        const visible = getVisibleDefinitions(scopeTree, ref.line);
        const isVisible = visible.some(d => d.name === ref.name);
        if (!isVisible) {
            undefs.push(ref);
        }
    }
    return undefs;
}

test('全局 define 后引用不报未定义', () => {
    const code = '(define x 42)\n(+ x 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, `不应有未定义引用，实际 ${undefs.length}`);
});

test('未定义变量被检测', () => {
    const code = '(+ undefined_var 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'undefined_var');
});

test('let 绑定在 body 内可见', () => {
    const code = '(let ((x 1)) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, 'let 绑定的变量应可见');
});

test('函数参数在 body 内可见', () => {
    const code = '(define (f x) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '函数参数应可见');
});

test('嵌套作用域正确', () => {
    const code = '(define x 1)\n(define (f y)\n  (let ((z (+ y 1)))\n    (+ x y z)))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '嵌套作用域中的变量都应可见');
});

test('作用域外引用被检测', () => {
    const code = '(let ((x 1)) x)\ny';
    const undefs = findUndefRefs(code, new Set());
    const yUndefs = undefs.filter(r => r.name === 'y');
    assert.strictEqual(yUndefs.length, 1, 'y 在全局作用域未定义');
});

test('内置函数名不报未定义', () => {
    const code = '(sdegeo:create-sphere (position 0 0 0) 1.0)';
    const undefs = findUndefRefs(code, new Set(['sdegeo:create-sphere', 'position']));
    assert.strictEqual(undefs.length, 0, '内置函数名应被过滤');
});

test('白名单变量不报未定义', () => {
    const code = '(define x argc)';
    const undefs = findUndefRefs(code, new Set(['argc']));
    assert.strictEqual(undefs.length, 0, '白名单变量应被过滤');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
