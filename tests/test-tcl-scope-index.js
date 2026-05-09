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

// 测试 4b：proc 默认值参数在 body 内可见
test('proc 默认值参数 {b 1.0} 在 body 内可见', () => {
	const argsNode = makeNode('arguments', '{a {b 1.0}}', [
		makeNode('argument', 'a', [
			makeNode('simple_word', 'a', [], 0, 10, 0, 11),
		], 0, 10, 0, 11),
		makeNode('argument', '{b 1.0}', [
			makeNode('{', '{', [], 0, 12, 0, 13),
			makeNode('simple_word', 'b', [], 0, 13, 0, 14),
			makeNode('simple_word', '1.0', [], 0, 15, 0, 18),
			makeNode('}', '}', [], 0, 18, 0, 19),
		], 0, 12, 0, 19),
	], 0, 9, 0, 20);
	const bodyNode = makeNode('braced_word', '{ ... }', [], 0, 21, 2, 1);
	const procNode = makeNode('procedure', 'proc ADD {a {b 1.0}} { ... }', [
		makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
		makeNode('simple_word', 'ADD', [], 0, 5, 0, 8),
		argsNode,
		bodyNode,
	], 0, 0, 2, 1);
	const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

	const index = ast.buildScopeIndex(root);
	const bodyLine = index.getVisibleAt(1);
	assert.ok(bodyLine.has('a'), 'body 内应可见参数 a');
	assert.ok(bodyLine.has('b'), 'body 内应可见默认值参数 b');
	const proc = index._procScopes[0];
	assert.ok(proc.params.includes('b'), 'params 数组应包含 b');
	assert.ok(!proc.params.includes('{b 1.0}'), 'params 数组不应包含原始文本 {b 1.0}');
	const def = index.resolveDefinition('b', 1);
	assert.ok(def, '默认值参数 b 应能被 resolveDefinition 找到');
	assert.strictEqual(def.scope, 'local');
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

console.log('\n=== ScopeIndex.resolveDefinition 测试 ===\n');

test('resolveDefinition: 全局 set 变量', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);
    const index = ast.buildScopeIndex(root);

    const result = index.resolveDefinition('x', 2);
    assert.ok(result, '应找到 x 的定义');
    assert.strictEqual(result.defLine, 1, 'x 在第 1 行定义');
    assert.strictEqual(result.scope, 'global');
});

test('resolveDefinition: 全局作用域未定义变量返回 null', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    assert.strictEqual(index.resolveDefinition('unknown', 1), null);
});

test('resolveDefinition: proc 内局部 set 变量', () => {
    const localSet = makeNode('set', 'set y 5', [
        makeNode('simple_word', 'set', [], 3, 2, 3, 5),
        makeNode('id', 'y', [], 3, 6, 3, 7),
        makeNode('simple_word', '5', [], 3, 8, 3, 9),
    ], 3, 2, 3, 9);
    const bodyNode = makeNode('braced_word', '{ set y 5 }', [localSet], 2, 15, 4, 1);
    const argsNode = makeNode('arguments', 'arg1', [
        makeNode('argument', 'arg1', [], 2, 7, 2, 11),
    ], 2, 6, 2, 12);
    const procNode = makeNode('procedure', 'proc myFunc { arg1 } { body }', [
        makeNode('simple_word', 'proc', [], 2, 0, 2, 4),
        makeNode('simple_word', 'myFunc', [], 2, 5, 2, 11),
        argsNode,
        bodyNode,
    ], 2, 0, 4, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 4, 1);
    const index = ast.buildScopeIndex(root);

    const argResult = index.resolveDefinition('arg1', 3);
    assert.ok(argResult, '应找到 arg1 参数定义');
    assert.strictEqual(argResult.scope, 'local');

    const yResult = index.resolveDefinition('y', 4);
    assert.ok(yResult, '应找到 y 的局部定义');
    assert.strictEqual(yResult.scope, 'local');
});

test('resolveDefinition: proc 内未定义变量返回 null', () => {
    const bodyNode = makeNode('braced_word', '{ puts $z }', [], 3, 0, 3, 12);
    const procNode = makeNode('procedure', 'proc f {} { body }', [
        makeNode('simple_word', 'proc', [], 2, 0, 2, 4),
        makeNode('word', 'f', [], 2, 5, 2, 6),
        makeNode('braced_word', '{}', [], 2, 7, 2, 9),
        bodyNode,
    ], 2, 0, 3, 12);
    const root = makeNode('program', '', [procNode], 2, 0, 3, 12);
    const index = ast.buildScopeIndex(root);

    assert.strictEqual(index.resolveDefinition('z', 3), null);
});

console.log('\n=== resolveDefinition 循环作用域优先级 测试 ===\n');

// 场景：set i 0 (行1) → for {set i 1} ... (行2-4) → 循环外 while (行6)
// for 循环内 init 中的 set i 1 不应劫持循环外的 $i 引用
test('resolveDefinition: for 循环外优先匹配外层定义', () => {
    // set i 0       (行 1)
    // for {set i 1} {$i<10} {incr i} {body}  (行 2-4)
    // puts $i       (行 6) — 应解析到行 1 而非行 2
    const globalSet = makeNode('set', 'set i 0', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'i', [], 0, 4, 0, 5),
        makeNode('simple_word', '0', [], 0, 6, 0, 7),
    ], 0, 0, 0, 7);

    const initBraced = makeNode('braced_word', '{set i 1}', [
        makeNode('{', '{', [], 1, 4, 1, 5),
        makeNode('set', 'set i 1', [
            makeNode('simple_word', 'set', [], 1, 5, 1, 8),
            makeNode('id', 'i', [], 1, 9, 1, 10),
            makeNode('simple_word', '1', [], 1, 11, 1, 12),
        ], 1, 5, 1, 12),
        makeNode('}', '}', [], 1, 12, 1, 13),
    ], 1, 4, 1, 13);

    const condBraced = makeNode('braced_word', '{$i<10}', [], 1, 14, 1, 20);
    const stepBraced = makeNode('braced_word', '{incr i}', [], 1, 21, 1, 28);
    const bodyBraced = makeNode('braced_word', '{body}', [], 1, 29, 1, 34);

    const forCmd = makeNode('command', 'for {set i 1} {$i<10} {incr i} {body}', [
        makeNode('simple_word', 'for', [], 1, 0, 1, 3),
        initBraced,
        condBraced,
        stepBraced,
        bodyBraced,
    ], 1, 0, 1, 34);

    const root = makeNode('program', '', [globalSet, forCmd], 0, 0, 1, 34);
    const index = ast.buildScopeIndex(root);

    // 行 6（循环外）解析 i → 应为行 1（全局 set i 0），不是行 2（for init）
    const resolved = index.resolveDefinition('i', 6);
    assert.ok(resolved, '循环外应能解析 i');
    assert.strictEqual(resolved.defLine, 1, `循环外应解析到行 1（全局 set i 0），实际行 ${resolved.defLine}`);
});

test('resolveDefinition: for 循环体内优先匹配循环内定义', () => {
    // set i 0       (行 1)
    // for {set i 1} {$i<10} {incr i} {body}  (行 2)
    // 循环体内（行 2）解析 i → 应为行 2（for init）
    const globalSet = makeNode('set', 'set i 0', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'i', [], 0, 4, 0, 5),
        makeNode('simple_word', '0', [], 0, 6, 0, 7),
    ], 0, 0, 0, 7);

    const initBraced = makeNode('braced_word', '{set i 1}', [
        makeNode('{', '{', [], 1, 4, 1, 5),
        makeNode('set', 'set i 1', [
            makeNode('simple_word', 'set', [], 1, 5, 1, 8),
            makeNode('id', 'i', [], 1, 9, 1, 10),
            makeNode('simple_word', '1', [], 1, 11, 1, 12),
        ], 1, 5, 1, 12),
        makeNode('}', '}', [], 1, 12, 1, 13),
    ], 1, 4, 1, 13);

    const bodyBraced = makeNode('braced_word', '{body}', [], 1, 29, 1, 34);
    const forCmd = makeNode('command', 'for {set i 1} ...', [
        makeNode('simple_word', 'for', [], 1, 0, 1, 3),
        initBraced,
        makeNode('braced_word', '{$i<10}', [], 1, 14, 1, 20),
        makeNode('braced_word', '{incr i}', [], 1, 21, 1, 28),
        bodyBraced,
    ], 1, 0, 1, 34);

    const root = makeNode('program', '', [globalSet, forCmd], 0, 0, 1, 34);
    const index = ast.buildScopeIndex(root);

    // 行 2（for 循环范围内）解析 i → 应为行 2（for init 中的 set i 1）
    const resolved = index.resolveDefinition('i', 2);
    assert.ok(resolved, '循环内应能解析 i');
    assert.strictEqual(resolved.defLine, 2, `循环内应解析到行 2（for init set i 1），实际行 ${resolved.defLine}`);
});

test('resolveDefinition: foreach 循环外优先匹配外层定义', () => {
    // set item 0        (行 1)
    // foreach item $list { body }  (行 3)
    // puts $item        (行 5) — 应解析到行 1
    const globalSet = makeNode('set', 'set item 0', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'item', [], 0, 4, 0, 8),
        makeNode('simple_word', '0', [], 0, 9, 0, 10),
    ], 0, 0, 0, 10);

    const foreachNode = makeNode('foreach', 'foreach item $list { body }', [
        makeNode('simple_word', 'foreach', [], 2, 0, 2, 7),
        makeNode('word_list', '', [
            makeNode('simple_word', 'item', [], 2, 8, 2, 12),
        ], 2, 8, 2, 12),
        makeNode('word_list', '', [
            makeNode('variable_substitution', '$list', [], 2, 13, 2, 18),
        ], 2, 13, 2, 18),
        makeNode('braced_word', '{ body }', [], 2, 19, 2, 27),
    ], 2, 0, 2, 27);

    const root = makeNode('program', '', [globalSet, foreachNode], 0, 0, 2, 27);
    const index = ast.buildScopeIndex(root);

    // 行 5（循环外）解析 item → 应为行 1（全局 set item 0）
    const resolved = index.resolveDefinition('item', 5);
    assert.ok(resolved, 'foreach 循环外应能解析 item');
    assert.strictEqual(resolved.defLine, 1, `foreach 循环外应解析到行 1（全局 set item 0），实际行 ${resolved.defLine}`);
});

test('resolveDefinition: 仅循环内定义的变量在循环外仍可解析', () => {
    // for {set k 0} {$k<10} {incr k} {body}  (行 1)
    // puts $k  (行 3) — k 只在 for init 中定义，无外层定义
    // Tcl 无块作用域，k 在循环外仍有效
    const initBraced = makeNode('braced_word', '{set k 0}', [
        makeNode('{', '{', [], 0, 4, 0, 5),
        makeNode('set', 'set k 0', [
            makeNode('simple_word', 'set', [], 0, 5, 0, 8),
            makeNode('id', 'k', [], 0, 9, 0, 10),
            makeNode('simple_word', '0', [], 0, 11, 0, 12),
        ], 0, 5, 0, 12),
        makeNode('}', '}', [], 0, 12, 0, 13),
    ], 0, 4, 0, 13);

    const forCmd = makeNode('command', 'for {set k 0} ...', [
        makeNode('simple_word', 'for', [], 0, 0, 0, 3),
        initBraced,
        makeNode('braced_word', '{$k<10}', [], 0, 14, 0, 20),
        makeNode('braced_word', '{incr k}', [], 0, 21, 0, 28),
        makeNode('braced_word', '{body}', [], 0, 29, 0, 34),
    ], 0, 0, 0, 34);

    const root = makeNode('program', '', [forCmd], 0, 0, 0, 34);
    const index = ast.buildScopeIndex(root);

    // 行 3（循环外）解析 k → 应能找到行 1（for init 中的 set k 0）
    const resolved = index.resolveDefinition('k', 3);
    assert.ok(resolved, '仅循环内定义的变量在循环外应可解析');
    assert.strictEqual(resolved.defLine, 1, `应解析到行 1（for init set k 0），实际行 ${resolved.defLine}`);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
