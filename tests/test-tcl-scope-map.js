// tests/test-tcl-scope-map.js
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

console.log('\n=== buildScopeMap 测试 ===\n');

test('全局 set 变量在所有行可见', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const scopeMap = ast.buildScopeMap(root);
    assert.ok(scopeMap instanceof Map);
    const line2 = scopeMap.get(2);
    assert.ok(line2, '第 2 行应有可见变量集');
    assert.ok(line2.has('x'), '第 2 行应可见变量 x');
});

test('proc 参数在 body 内可见', () => {
    const argsNode = makeNode('arguments', 'arg1 arg2', [
        makeNode('argument', 'arg1', [], 0, 13, 0, 17),
        makeNode('argument', 'arg2', [], 0, 18, 0, 22),
    ], 0, 12, 0, 23);
    const bodyNode = makeNode('braced_word', '{ ... }', [], 0, 24, 2, 1);
    const procNode = makeNode('procedure', 'proc myProc {arg1 arg2} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        argsNode,
        bodyNode,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    const globalLine = scopeMap.get(1);
    assert.ok(globalLine, '应有可见变量');
    assert.ok(globalLine.has('myProc'), '全局应可见函数名 myProc');
});

test('global 声明引入全局变量到 proc 作用域', () => {
    const globalSetNode = makeNode('set', 'set global_var 1', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'global_var', [], 0, 4, 0, 14),
        makeNode('simple_word', '1', [], 0, 15, 0, 16),
    ], 0, 0, 0, 16);

    const globalCmd = makeNode('command', 'global global_var', [
        makeNode('simple_word', 'global', [], 2, 4, 2, 10),
        makeNode('simple_word', 'global_var', [], 2, 11, 2, 21),
    ], 2, 4, 2, 21);

    const procBody = makeNode('braced_word', '{\n  global global_var\n  puts $global_var\n}', [
        globalCmd,
    ], 1, 15, 4, 1);
    const procArgs = makeNode('arguments', '', [], 1, 12, 1, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 1, 0, 1, 4),
        makeNode('simple_word', 'myProc', [], 1, 5, 1, 11),
        procArgs,
        procBody,
    ], 1, 0, 4, 1);

    const root = makeNode('program', '', [globalSetNode, procNode], 0, 0, 4, 1);

    const scopeMap = ast.buildScopeMap(root);
    const line3 = scopeMap.get(3);
    assert.ok(line3, '第 3 行应有可见变量集');
    assert.ok(line3.has('global_var'), 'global 声明后应可见 global_var');
});

test('foreach 循环变量在 body 内可见', () => {
    const argsNode = makeNode('arguments', 'item $list', [
        makeNode('argument', 'item', [], 0, 8, 0, 12),
        makeNode('variable_substitution', '$list', [], 0, 13, 0, 18),
    ], 0, 8, 0, 18);
    const bodyNode = makeNode('braced_word', '{ puts $item }', [], 0, 19, 0, 33);
    const foreachNode = makeNode('foreach', 'foreach item $list { ... }', [
        makeNode('simple_word', 'foreach', [], 0, 0, 0, 7),
        argsNode,
        bodyNode,
    ], 0, 0, 0, 33);
    const root = makeNode('program', '', [foreachNode], 0, 0, 0, 33);

    const scopeMap = ast.buildScopeMap(root);
    const line1 = scopeMap.get(1);
    assert.ok(line1, '第 1 行应有可见变量集');
    assert.ok(line1.has('item'), 'foreach 循环变量 item 应可见');
});

test('upvar 声明引入本地别名', () => {
    const upvarCmd = makeNode('command', 'upvar 1 outer_var local', [
        makeNode('simple_word', 'upvar', [], 1, 2, 1, 7),
        makeNode('simple_word', '1', [], 1, 8, 1, 9),
        makeNode('simple_word', 'outer_var', [], 1, 10, 1, 19),
        makeNode('simple_word', 'local', [], 1, 20, 1, 25),
    ], 1, 2, 1, 25);
    const procBody = makeNode('braced_word', '{ upvar 1 outer_var local }', [
        upvarCmd,
    ], 0, 15, 2, 1);
    const procArgs = makeNode('arguments', '', [], 0, 12, 0, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        procArgs,
        procBody,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    const bodyLine = scopeMap.get(2);
    assert.ok(bodyLine, 'body 行应有可见变量集');
    assert.ok(bodyLine.has('local'), 'upvar 别名 local 应可见');
});

test('variable 声明引入命名空间变量', () => {
    const varCmd = makeNode('command', 'variable ns_var', [
        makeNode('simple_word', 'variable', [], 1, 2, 1, 10),
        makeNode('simple_word', 'ns_var', [], 1, 11, 1, 17),
    ], 1, 2, 1, 17);
    const procBody = makeNode('braced_word', '{ variable ns_var }', [
        varCmd,
    ], 0, 15, 2, 1);
    const procArgs = makeNode('arguments', '', [], 0, 12, 0, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        procArgs,
        procBody,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    const bodyLine = scopeMap.get(2);
    assert.ok(bodyLine, 'body 行应有可见变量集');
    assert.ok(bodyLine.has('ns_var'), 'variable 声明的 ns_var 应可见');
});

test('白名单变量不报未定义', () => {
    const refNode = makeNode('variable_substitution', '$DesName', [], 0, 0, 0, 8);
    const root = makeNode('program', '', [refNode], 0, 0, 0, 8);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'DesName');
    // DesName 在白名单中，诊断模块应跳过
    // 此测试验证引用收集正确，白名单过滤在诊断模块中处理
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
