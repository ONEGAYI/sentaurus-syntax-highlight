// tests/test-tcl-ast-variables.js
'use strict';

const assert = require('assert');

/**
 * 手动 mock web-tree-sitter 节点结构。
 * 与 test-tcl-ast-utils.js 的 makeNode 保持一致。
 */
function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type,
        text,
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

console.log('\n=== getVariables 测试 ===\n');

// ── set 变量提取 ──
console.log('set 变量提取:');

test('提取 set 变量（带值）', () => {
    // set x 42 → 节点类型 "set"
    // 子节点: set(关键字) + id(变量名) + 值
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);

    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'x');
    assert.strictEqual(vars[0].kind, 'variable');
    assert.strictEqual(vars[0].line, 1);
    assert.strictEqual(vars[0].endLine, 1);
    assert.strictEqual(vars[0].definitionText, 'set x 42');
});

test('提取 set 变量（仅赋值无值）', () => {
    // set x → 只有变量名
    const setNode = makeNode('set', 'set x', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
    ], 0, 0, 0, 5);

    const root = makeNode('program', '', [setNode], 0, 0, 0, 5);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'x');
    assert.strictEqual(vars[0].kind, 'variable');
});

test('跳过 env() 变量', () => {
    // set env(PATH) /usr/bin → 不提取
    const setNode = makeNode('set', 'set env(PATH) /usr/bin', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'env(PATH)', [], 0, 4, 0, 13),
        makeNode('simple_word', '/usr/bin', [], 0, 14, 0, 22),
    ], 0, 0, 0, 22);

    const root = makeNode('program', '', [setNode], 0, 0, 0, 22);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 0, `env() 变量不应被提取，实际 ${vars.length}`);
});

test('set 无 id 子节点时跳过', () => {
    // set (无参数) → 跳过
    const setNode = makeNode('set', 'set', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
    ], 0, 0, 0, 3);

    const root = makeNode('program', '', [setNode], 0, 0, 0, 3);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 0, `无 id 子节点不应提取变量，实际 ${vars.length}`);
});

// ── proc 函数和参数提取 ──
console.log('\nproc 函数和参数提取:');

test('提取 proc 函数名和参数', () => {
    // proc myFunc {a b} {body}
    // procedure 节点: proc + simple_word(名) + arguments(含 argument 子节点) + braced_word(body)
    const argA = makeNode('argument', 'a', [
        makeNode('simple_word', 'a', [], 0, 15, 0, 16),
    ], 0, 15, 0, 16);
    const argB = makeNode('argument', 'b', [
        makeNode('simple_word', 'b', [], 0, 17, 0, 18),
    ], 0, 17, 0, 18);
    const argumentsNode = makeNode('arguments', '{a b}', [
        makeNode('{', '{', [], 0, 13, 0, 14),
        argA, argB,
        makeNode('}', '}', [], 0, 19, 0, 20),
    ], 0, 13, 0, 20);
    const bodyNode = makeNode('braced_word', '{ body }', [
        makeNode('{', '{', [], 0, 21, 0, 22),
        makeNode('word_list', '', [], 0, 22, 0, 27),
        makeNode('}', '}', [], 0, 27, 0, 28),
    ], 0, 21, 0, 28);

    const procNode = makeNode('procedure', 'proc myFunc {a b} { body }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        argumentsNode,
        bodyNode,
    ], 0, 0, 0, 28);

    const root = makeNode('program', '', [procNode], 0, 0, 0, 28);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 3, `应有 3 个结果（1函数+2参数），实际 ${vars.length}`);
    // 第一个应为函数名
    assert.strictEqual(vars[0].name, 'myFunc');
    assert.strictEqual(vars[0].kind, 'function');
    assert.strictEqual(vars[0].line, 1);
    // 参数
    assert.strictEqual(vars[1].name, 'a');
    assert.strictEqual(vars[1].kind, 'parameter');
    assert.strictEqual(vars[2].name, 'b');
    assert.strictEqual(vars[2].kind, 'parameter');
});

test('提取 proc 函数名（无参数）', () => {
    // proc myFunc {} {body}
    const argumentsNode = makeNode('arguments', '{}', [
        makeNode('{', '{', [], 0, 13, 0, 14),
        makeNode('}', '}', [], 0, 14, 0, 15),
    ], 0, 13, 0, 15);
    const bodyNode = makeNode('braced_word', '{ body }', [
        makeNode('{', '{', [], 0, 16, 0, 17),
        makeNode('word_list', '', [], 0, 17, 0, 22),
        makeNode('}', '}', [], 0, 22, 0, 23),
    ], 0, 16, 0, 23);

    const procNode = makeNode('procedure', 'proc myFunc {} { body }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        argumentsNode,
        bodyNode,
    ], 0, 0, 0, 23);

    const root = makeNode('program', '', [procNode], 0, 0, 0, 23);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个结果（只有函数名），实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myFunc');
    assert.strictEqual(vars[0].kind, 'function');
});

// ── foreach 循环变量 ──
console.log('\nforeach 循环变量:');

test('提取 foreach 循环变量', () => {
    // foreach item $list { body }
    // foreach 节点: foreach + arguments(含循环变量) + braced_word(body)
    const loopVar = makeNode('simple_word', 'item', [], 0, 9, 0, 13);
    const listVar = makeNode('simple_word', '$list', [], 0, 14, 0, 19);
    const argumentsNode = makeNode('arguments', 'item $list', [
        loopVar, listVar,
    ], 0, 9, 0, 19);
    const bodyNode = makeNode('braced_word', '{ body }', [
        makeNode('{', '{', [], 0, 20, 0, 21),
        makeNode('word_list', '', [], 0, 21, 0, 26),
        makeNode('}', '}', [], 0, 26, 0, 27),
    ], 0, 20, 0, 27);

    const foreachNode = makeNode('foreach', 'foreach item $list { body }', [
        makeNode('simple_word', 'foreach', [], 0, 0, 0, 7),
        argumentsNode,
        bodyNode,
    ], 0, 0, 0, 27);

    const root = makeNode('program', '', [foreachNode], 0, 0, 0, 27);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'item');
    assert.strictEqual(vars[0].kind, 'variable');
});

// ── for 循环 ──
console.log('\nfor 循环:');

test('提取 for 循环 init 中的 set 变量', () => {
    // for {set i 0} {$i < 10} {incr i} { body }
    // "for" 被解析为 command 节点，第一个 simple_word 是 "for"
    const initSet = makeNode('set', 'set i 0', [
        makeNode('simple_word', 'set', [], 0, 5, 0, 8),
        makeNode('id', 'i', [], 0, 9, 0, 10),
        makeNode('simple_word', '0', [], 0, 11, 0, 12),
    ], 0, 5, 0, 12);
    const initBraced = makeNode('braced_word', '{set i 0}', [
        makeNode('{', '{', [], 0, 4, 0, 5),
        makeNode('word_list', '', [initSet], 0, 5, 0, 12),
        makeNode('}', '}', [], 0, 12, 0, 13),
    ], 0, 4, 0, 13);

    const condBraced = makeNode('braced_word', '{$i < 10}', [
        makeNode('{', '{', [], 0, 14, 0, 15),
        makeNode('word_list', '', [], 0, 15, 0, 22),
        makeNode('}', '}', [], 0, 22, 0, 23),
    ], 0, 14, 0, 23);

    const stepBraced = makeNode('braced_word', '{incr i}', [
        makeNode('{', '{', [], 0, 24, 0, 25),
        makeNode('word_list', '', [], 0, 25, 0, 31),
        makeNode('}', '}', [], 0, 31, 0, 32),
    ], 0, 24, 0, 32);

    const bodyBraced = makeNode('braced_word', '{ body }', [
        makeNode('{', '{', [], 0, 33, 0, 34),
        makeNode('word_list', '', [], 0, 34, 0, 39),
        makeNode('}', '}', [], 0, 39, 0, 40),
    ], 0, 33, 0, 40);

    const forNode = makeNode('command', 'for {set i 0} {$i < 10} {incr i} { body }', [
        makeNode('simple_word', 'for', [], 0, 0, 0, 3),
        initBraced,
        condBraced,
        stepBraced,
        bodyBraced,
    ], 0, 0, 0, 40);

    const root = makeNode('program', '', [forNode], 0, 0, 0, 40);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个变量（i），实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'i');
    assert.strictEqual(vars[0].kind, 'variable');
});

// ── 嵌套结构 ──
console.log('\n嵌套结构:');

test('proc body 内嵌套的 set 变量', () => {
    // proc myFunc {} {
    //     set x 42
    // }
    const innerSet = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 1, 4, 1, 7),
        makeNode('id', 'x', [], 1, 8, 1, 9),
        makeNode('simple_word', '42', [], 1, 10, 1, 12),
    ], 1, 4, 1, 12);

    const bodyWordList = makeNode('word_list', '', [innerSet], 1, 4, 1, 12);
    const bodyBraced = makeNode('braced_word', '{\n    set x 42\n}', [
        makeNode('{', '{', [], 0, 13, 0, 14),
        bodyWordList,
        makeNode('}', '}', [], 2, 0, 2, 1),
    ], 0, 13, 2, 1);

    const argumentsNode = makeNode('arguments', '{}', [
        makeNode('{', '{', [], 0, 13, 0, 14),
        makeNode('}', '}', [], 0, 14, 0, 15),
    ], 0, 13, 0, 15);

    const procNode = makeNode('procedure', 'proc myFunc {} {\n    set x 42\n}', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        argumentsNode,
        bodyBraced,
    ], 0, 0, 2, 1);

    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 2, `应有 2 个结果（1函数+1变量），实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myFunc');
    assert.strictEqual(vars[0].kind, 'function');
    assert.strictEqual(vars[1].name, 'x');
    assert.strictEqual(vars[1].kind, 'variable');
    assert.strictEqual(vars[1].line, 2); // 0-indexed row 1 → 1-indexed line 2
});

// ── while 节点（无变量绑定，递归 body） ──
console.log('\nwhile 节点:');

test('while 递归 body 中的 set 变量', () => {
    // while {$i > 0} { set i expr($i - 1) }
    const innerSet = makeNode('set', 'set i expr($i - 1)', [
        makeNode('simple_word', 'set', [], 0, 17, 0, 20),
        makeNode('id', 'i', [], 0, 21, 0, 22),
        makeNode('simple_word', 'expr($i - 1)', [], 0, 23, 0, 35),
    ], 0, 17, 0, 35);

    const bodyWordList = makeNode('word_list', '', [innerSet], 0, 17, 0, 35);
    const bodyBraced = makeNode('braced_word', '{ set i expr($i - 1) }', [
        makeNode('{', '{', [], 0, 15, 0, 16),
        bodyWordList,
        makeNode('}', '}', [], 0, 36, 0, 37),
    ], 0, 15, 0, 37);

    const condBraced = makeNode('braced_word', '{$i > 0}', [
        makeNode('{', '{', [], 0, 6, 0, 7),
        makeNode('word_list', '', [], 0, 7, 0, 13),
        makeNode('}', '}', [], 0, 13, 0, 14),
    ], 0, 6, 0, 14);

    const whileNode = makeNode('while', 'while {$i > 0} { set i expr($i - 1) }', [
        makeNode('simple_word', 'while', [], 0, 0, 0, 5),
        condBraced,
        bodyBraced,
    ], 0, 0, 0, 37);

    const root = makeNode('program', '', [whileNode], 0, 0, 0, 37);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'i');
    assert.strictEqual(vars[0].kind, 'variable');
});

// ── 空 AST ──
console.log('\n空 AST:');

test('空 AST 返回空数组', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const vars = ast.getVariables(root);
    assert.strictEqual(vars.length, 0, `空 AST 应返回空数组，实际 ${vars.length}`);
});

test('无变量定义的 command 返回空数组', () => {
    const cmdNode = makeNode('command', 'puts "hello"', [
        makeNode('simple_word', 'puts', [], 0, 0, 0, 4),
        makeNode('simple_word', '"hello"', [], 0, 5, 0, 12),
    ], 0, 0, 0, 12);

    const root = makeNode('program', '', [cmdNode], 0, 0, 0, 12);
    const vars = ast.getVariables(root);

    assert.strictEqual(vars.length, 0, `普通命令不应提取变量，实际 ${vars.length}`);
});

// ── 多个变量混合 ──
console.log('\n混合场景:');

test('多个变量定义混合提取', () => {
    // set x 42
    // proc myFunc {a} { set y 10 }
    const setX = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);

    const innerSetY = makeNode('set', 'set y 10', [
        makeNode('simple_word', 'set', [], 1, 4, 1, 7),
        makeNode('id', 'y', [], 1, 8, 1, 9),
        makeNode('simple_word', '10', [], 1, 10, 1, 12),
    ], 1, 4, 1, 12);
    const procBodyWordList = makeNode('word_list', '', [innerSetY], 1, 4, 1, 12);
    const procBody = makeNode('braced_word', '{ set y 10 }', [
        makeNode('{', '{', [], 0, 20, 0, 21),
        procBodyWordList,
        makeNode('}', '}', [], 1, 12, 1, 13),
    ], 0, 20, 1, 13);

    const argA = makeNode('argument', 'a', [
        makeNode('simple_word', 'a', [], 0, 17, 0, 18),
    ], 0, 17, 0, 18);
    const procArgs = makeNode('arguments', '{a}', [
        makeNode('{', '{', [], 0, 15, 0, 16),
        argA,
        makeNode('}', '}', [], 0, 18, 0, 19),
    ], 0, 15, 0, 19);

    const procNode = makeNode('procedure', 'proc myFunc {a} { set y 10 }', [
        makeNode('simple_word', 'proc', [], 0, 9, 0, 13),
        makeNode('simple_word', 'myFunc', [], 0, 14, 0, 20),
        procArgs,
        procBody,
    ], 0, 9, 1, 13);

    const root = makeNode('program', '', [setX, procNode], 0, 0, 1, 13);
    const vars = ast.getVariables(root);

    // x:variable, myFunc:function, a:parameter, y:variable
    assert.strictEqual(vars.length, 4, `应有 4 个结果，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'x');
    assert.strictEqual(vars[0].kind, 'variable');
    assert.strictEqual(vars[1].name, 'myFunc');
    assert.strictEqual(vars[1].kind, 'function');
    assert.strictEqual(vars[2].name, 'a');
    assert.strictEqual(vars[2].kind, 'parameter');
    assert.strictEqual(vars[3].name, 'y');
    assert.strictEqual(vars[3].kind, 'variable');
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  通过: ${passed}, 失败: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
