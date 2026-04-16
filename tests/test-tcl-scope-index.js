// tests/test-tcl-scope-index.js
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

console.log('\n=== ScopeIndex / buildScopeIndex 测试 ===\n');

// 测试 1：buildScopeIndex 返回 ScopeIndex 实例
test('buildScopeIndex 返回 ScopeIndex 实例', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    assert.ok(index instanceof ast.ScopeIndex, '应为 ScopeIndex 实例');
    assert.strictEqual(typeof index.getVisibleAt, 'function', '应有 getVisibleAt 方法');
});

// 测试 2：空文件 → getVisibleAt 返回空 Set
test('空文件 → getVisibleAt 返回空 Set', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible instanceof Set, '应返回 Set');
    assert.strictEqual(visible.size, 0, '空文件不应有可见变量');
});

// 测试 3：全局 set 变量在定义行之后可见
test('全局 set 变量在定义行之后可见', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const index = ast.buildScopeIndex(root);
    // 行 1 (0-based row 0) 是定义行，变量应在定义行及之后可见
    const line1 = index.getVisibleAt(1);
    assert.ok(line1.has('x'), '第 1 行应可见变量 x');
});

// 测试 4：proc 参数在 body 内可见
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

    const index = ast.buildScopeIndex(root);
    // body 在 row 0~2 (行 1~3)，参数应在 body 内可见
    const bodyLine = index.getVisibleAt(1);
    assert.ok(bodyLine.has('arg1'), 'body 内应可见参数 arg1');
    assert.ok(bodyLine.has('arg2'), 'body 内应可见参数 arg2');
    // proc 名在全局可见
    const globalLine = index.getVisibleAt(1);
    assert.ok(globalLine.has('myProc'), 'proc 名 myProc 应可见（作为全局函数）');
});

// 测试 5：proc 内部局部变量仅在 body 内可见
test('proc 内部局部变量仅在 body 内可见', () => {
    // proc body 内有 set local_var 1 (row 2)
    const setInBody = makeNode('set', 'set local_var 1', [
        makeNode('simple_word', 'set', [], 2, 2, 2, 5),
        makeNode('id', 'local_var', [], 2, 6, 2, 15),
        makeNode('simple_word', '1', [], 2, 16, 2, 17),
    ], 2, 2, 2, 17);
    const procBody = makeNode('braced_word', '{\n  set local_var 1\n}', [
        setInBody,
    ], 1, 15, 3, 1);
    const procArgs = makeNode('arguments', '', [], 1, 12, 1, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 1, 0, 1, 4),
        makeNode('simple_word', 'myProc', [], 1, 5, 1, 11),
        procArgs,
        procBody,
    ], 1, 0, 3, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 3, 1);

    const index = ast.buildScopeIndex(root);
    // 行 3 (row 2) 是 local_var 定义行，应在行 3 及之后 body 内可见
    const line3 = index.getVisibleAt(3);
    assert.ok(line3.has('local_var'), '第 3 行应可见局部变量 local_var');
    // 行 2 (proc 定义行，不在 body 内) 不应可见局部变量
    const line2 = index.getVisibleAt(2);
    assert.ok(!line2.has('local_var'), '第 2 行不应可见局部变量 local_var（不在 body 内）');
    // 行 5（body 结束后）不应可见局部变量
    const line5 = index.getVisibleAt(5);
    assert.ok(!line5.has('local_var'), '第 5 行不应可见局部变量 local_var');
});

// 测试 6：global 声明引入全局变量到 proc 作用域
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

    const index = ast.buildScopeIndex(root);
    const line3 = index.getVisibleAt(3);
    assert.ok(line3.has('global_var'), 'global 声明后应可见 global_var');
});

// 测试 7：foreach 循环变量在 body 内可见
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

    const index = ast.buildScopeIndex(root);
    const line1 = index.getVisibleAt(1);
    assert.ok(line1.has('item'), 'foreach 循环变量 item 应可见');
});

// 测试 8：upvar 声明引入本地别名
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

    const index = ast.buildScopeIndex(root);
    const bodyLine = index.getVisibleAt(2);
    assert.ok(bodyLine.has('local'), 'upvar 别名 local 应可见');
});

// 测试 9：variable 声明引入命名空间变量
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

    const index = ast.buildScopeIndex(root);
    const bodyLine = index.getVisibleAt(2);
    assert.ok(bodyLine.has('ns_var'), 'variable 声明的 ns_var 应可见');
});

// 测试 10：buildScopeMap 委托给 ScopeIndex 并返回兼容的 Map
test('buildScopeMap 委托给 ScopeIndex 并返回兼容的 Map', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const scopeMap = ast.buildScopeMap(root);
    assert.ok(scopeMap instanceof Map, '应返回 Map 实例');
    const line1 = scopeMap.get(1);
    assert.ok(line1 instanceof Set, '每行应为 Set');
    assert.ok(line1.has('x'), '第 1 行应可见变量 x');

    // 验证 ScopeIndex 产生相同结果
    const index = ast.buildScopeIndex(root);
    const indexLine1 = index.getVisibleAt(1);
    assert.deepStrictEqual([...line1].sort(), [...indexLine1].sort(),
        'buildScopeMap 和 ScopeIndex.getVisibleAt 应产生相同结果');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
