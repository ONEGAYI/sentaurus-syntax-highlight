// tests/test-scheme-dup-def-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 重复定义检测测试 ===\n');

/**
 * 从 scopeTree 中检测同一作用域内的重复定义。
 * 返回重复项数组，每项: { name, line, firstLine, scopeType }
 */
function findDuplicateDefs(code) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const duplicates = [];

    function walkScope(scope) {
        const seen = new Map(); // name → first definition
        for (const def of scope.definitions) {
            if (seen.has(def.name)) {
                const first = seen.get(def.name);
                duplicates.push({
                    name: def.name,
                    line: def.line,
                    firstLine: first.line,
                    scopeType: scope.type,
                });
            } else {
                seen.set(def.name, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return duplicates;
}

// --- 测试用例 ---

test('全局作用域无重复定义不报', () => {
    const code = '(define x 1)\n(define y 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0);
});

test('全局作用域重复 define 变量被检测', () => {
    const code = '(define x 1)\n(define x 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].firstLine, 1, '首次定义行号应为 1');
    assert.strictEqual(dups[0].line, 2, '重复定义行号应为 2');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('全局作用域重复 define 函数被检测', () => {
    const code = '(define (f x) (+ x 1))\n(define (f y) (+ y 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('函数体内重复 define 被检测', () => {
    const code = '(define (f)\n  (define a 1)\n  (define a 2)\n  a)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'function');
});

test('let 绑定列表中重复变量被检测', () => {
    const code = '(let ((x 1) (x 2)) (+ x 1))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('不同作用域同名不报告（shadowing 正常）', () => {
    const code = '(define x 1)\n(define (f)\n  (define x 2)\n  x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, '不同作用域的同名定义（shadowing）不应报重复');
});

test('lambda 参数和外部 define 同名不报告', () => {
    const code = '(define x 1)\n(define (f) ((lambda (x) (+ x 1)) 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'lambda 参数 shadow 外部定义不应报');
});

test('同一作用域三次重复定义报两次', () => {
    const code = '(define x 1)\n(define x 2)\n(define x 3)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 2, '三次定义应报两个重复');
    assert.strictEqual(dups[0].line, 2, '第二个 x 行号应为 2');
    assert.strictEqual(dups[1].line, 3, '第三个 x 行号应为 3');
});

test('全局多次重复函数定义被检测', () => {
    const code = '(define (my-func) 1)\n(define other 42)\n(define (my-func x) x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'my-func');
});

test('let* 绑定列表中重复变量被检测', () => {
    const code = "(let* ((a 1) (a 2)) (+ a 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('letrec 绑定列表中重复变量被检测', () => {
    const code = "(letrec ((f (lambda (x) x)) (f (lambda (y) y))) (f 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
