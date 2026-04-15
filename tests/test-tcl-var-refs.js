// tests/test-tcl-var-refs.js
'use strict';

const assert = require('assert');

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

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ast = require('../src/lsp/tcl-ast-utils');

console.log('\n=== getVariableRefs 测试 ===\n');

test('收集单个 $var 引用', () => {
    const refNode = makeNode('variable_substitution', '$x', [], 0, 6, 0, 8);
    const cmdNode = makeNode('command', 'puts $x', [
        makeNode('simple_word', 'puts', [], 0, 0, 0, 4),
        refNode,
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [cmdNode], 0, 0, 0, 8);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'x');
    assert.strictEqual(refs[0].line, 1);
    assert.strictEqual(refs[0].startCol, 6);
});

test('收集多个 $var 引用', () => {
    const ref1 = makeNode('variable_substitution', '$a', [], 0, 0, 0, 2);
    const ref2 = makeNode('variable_substitution', '$b', [], 0, 3, 0, 5);
    const root = makeNode('program', '', [ref1, ref2], 0, 0, 0, 5);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'a');
    assert.strictEqual(refs[1].name, 'b');
});

test('跳过注释中的引用', () => {
    const commentNode = makeNode('comment', '# puts $x', [], 0, 0, 0, 10);
    const refNode = makeNode('variable_substitution', '$y', [], 1, 0, 1, 2);
    const root = makeNode('program', '', [commentNode, refNode], 0, 0, 1, 2);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'y');
});

test('空 AST 返回空数组', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 0);
});

test('variable_substitution 嵌套在 braced_word 中', () => {
    const ref = makeNode('variable_substitution', '$val', [], 0, 2, 0, 6);
    const braced = makeNode('braced_word', '{expr $val}', [ref], 0, 0, 0, 11);
    const root = makeNode('program', '', [braced], 0, 0, 0, 11);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'val');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
