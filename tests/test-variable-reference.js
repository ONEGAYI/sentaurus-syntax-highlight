// tests/test-variable-reference.js
'use strict';

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree, getSchemeRefs, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');

// ===== Scheme 侧：作用域感知引用查找 =====
console.log('\n=== Scheme 变量引用查找测试 ===\n');

/**
 * 模拟 Provider 核心逻辑：给定代码和光标位置，返回匹配的引用 Location 列表。
 * 返回 {name, line, start, end, isDef}[] 供测试断言。
 */
function findVariableRefsScheme(code, cursorLine) {
    const { ast } = parse(code);
    const scopeTree = buildScopeTree(ast);
    const refs = getSchemeRefs(ast, new Set());

    const visibleAtCursor = getVisibleDefinitions(scopeTree, cursorLine);
    if (visibleAtCursor.length === 0) return [];

    const cursorLineRefs = refs.filter(r => r.line === cursorLine);
    if (cursorLineRefs.length === 0) return [];

    const targetName = cursorLineRefs[0].name;
    const targetDef = visibleAtCursor.find(d => d.name === targetName);
    if (!targetDef) return [];

    const results = [{ name: targetDef.name, line: targetDef.line, start: targetDef.start, end: targetDef.end, isDef: true }];

    for (const ref of refs) {
        if (ref.name !== targetName) continue;
        if (ref.line === targetDef.line && ref.start === targetDef.start && ref.end === targetDef.end) continue;
        const refVisibleDefs = getVisibleDefinitions(scopeTree, ref.line);
        const resolvesToSame = refVisibleDefs.some(d => d.name === targetName && d.line === targetDef.line && d.start === targetDef.start);
        if (resolvesToSame) {
            results.push({ name: ref.name, line: ref.line, start: ref.start, end: ref.end, isDef: false });
        }
    }
    return results;
}

test('全局变量：定义 + 引用', () => {
    const code = '(define x 10)\n(+ x 1)';
    const results = findVariableRefsScheme(code, 2);
    const names = results.map(r => r.name);
    assert.ok(names.every(n => n === 'x'), '所有结果应为 x');
    assert.ok(results.some(r => r.isDef && r.line === 1), '应包含第 1 行定义');
    assert.ok(results.some(r => !r.isDef && r.line === 2), '应包含第 2 行引用');
});

test('同名变量不同作用域应隔离', () => {
    const code = '(define x 10)\n(define (f)\n  (define x 20)\n  x)\nx';
    const resultsInner = findVariableRefsScheme(code, 4);
    const innerLines = resultsInner.map(r => r.line);
    assert.ok(!innerLines.includes(1), 'f 内 x 不应匹配第 1 行全局 x');
    assert.ok(innerLines.includes(3), '应匹配第 3 行的 define x 20');

    const resultsOuter = findVariableRefsScheme(code, 5);
    const outerLines = resultsOuter.map(r => r.line);
    assert.ok(outerLines.includes(1), '全局 x 应匹配第 1 行定义');
    assert.ok(!outerLines.includes(3), '全局 x 不应匹配第 3 行局部 x');
});

test('let 绑定的变量引用', () => {
    const code = '(let ((y 5)) (+ y 1))';
    const results = findVariableRefsScheme(code, 1);
    const yRefs = results.filter(r => r.name === 'y');
    assert.ok(yRefs.length >= 2, 'y 应有定义和引用');
});

test('lambda 参数引用', () => {
    const code = '((lambda (n) (+ n 1)) 42)';
    const results = findVariableRefsScheme(code, 1);
    const nRefs = results.filter(r => r.name === 'n');
    assert.ok(nRefs.length >= 2, 'n 应有参数定义和引用');
});

// ===== Tcl 侧：resolveDefinition 作用域解析 =====
console.log('\n=== Tcl 变量引用查找测试 ===\n');

const tclAst = require('../src/lsp/tcl-ast-utils');

function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type, text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}

test('Tcl 全局变量引用过滤', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const dollarNode = makeNode('variable_substitution', '$x', [], 1, 0, 1, 2);
    const root = makeNode('program', '', [setNode, dollarNode], 0, 0, 1, 2);

    const scopeIndex = tclAst.buildScopeIndex(root);
    const refs = tclAst.getVariableRefs(root);

    const targetDef = scopeIndex.resolveDefinition('x', 2);
    assert.ok(targetDef, '应找到 x 的定义');

    const matchingRefs = refs.filter(r => {
        const refDef = scopeIndex.resolveDefinition(r.name, r.line);
        return refDef && refDef.defLine === targetDef.defLine;
    });
    assert.strictEqual(matchingRefs.length, 1, '应有 1 个匹配引用');
    assert.strictEqual(matchingRefs[0].name, 'x');
});

test('Tcl proc 内同名变量隔离', () => {
    const globalSet = makeNode('set', 'set x 1', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '1', [], 0, 6, 0, 7),
    ], 0, 0, 0, 7);
    const localSet = makeNode('set', 'set x 2', [
        makeNode('simple_word', 'set', [], 3, 2, 3, 5),
        makeNode('id', 'x', [], 3, 6, 3, 7),
        makeNode('simple_word', '2', [], 3, 8, 3, 9),
    ], 3, 2, 3, 9);
    const bodyNode = makeNode('braced_word', '{ set x 2 }', [localSet], 3, 0, 3, 12);
    const procNode = makeNode('procedure', 'proc f {} { body }', [
        makeNode('simple_word', 'proc', [], 2, 0, 2, 4),
        makeNode('word', 'f', [], 2, 5, 2, 6),
        makeNode('arguments', '{}', [], 2, 7, 2, 9),
        bodyNode,
    ], 2, 0, 3, 12);
    const globalDollar = makeNode('variable_substitution', '$x', [], 5, 0, 5, 2);
    const root = makeNode('program', '', [globalSet, procNode, globalDollar], 0, 0, 5, 2);

    const scopeIndex = tclAst.buildScopeIndex(root);
    const refs = tclAst.getVariableRefs(root);

    const innerDef = scopeIndex.resolveDefinition('x', 4);
    assert.ok(innerDef, 'proc 内应找到 x');
    assert.strictEqual(innerDef.defLine, 4, 'proc 内 x 应在第 4 行');

    const outerDef = scopeIndex.resolveDefinition('x', 6);
    assert.ok(outerDef, '全局应找到 x');
    assert.strictEqual(outerDef.defLine, 1, '全局 x 应在第 1 行');

    const globalRefs = refs.filter(r => {
        const refDef = scopeIndex.resolveDefinition(r.name, r.line);
        return refDef && refDef.defLine === 1;
    });
    assert.strictEqual(globalRefs.length, 1, '全局 x 引用只应有 1 个');
    assert.strictEqual(globalRefs[0].line, 6);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
