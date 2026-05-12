// tests/test-implicit-var-functions.js
// TDD: 隐式变量声明函数的变量提取 + 作用域可见性测试
// 所有待修复的函数，无论之前是否部分支持，全部列出
'use strict';

const { test, summary } = require('./helpers/test-runner');
const { makeNode, makeProcNode, makeSetNode } = require('./helpers/mock-ast-node');
const assert = require('assert');

const varExtractor = require('../src/lsp/tcl-variable-extractor');
const scope = require('../src/lsp/tcl-scope');

// ─── Helper: 构造 command 节点（tree-sitter-tcl 对 incr/append/lappend 等的解析方式） ───
// 这些命令被解析为 command > simple_word("incr") + word_list > simple_word("count")
function makeCommandNode(cmdName, argTexts, startRow) {
    const wordChildren = [
        makeNode('simple_word', cmdName, [], startRow, 0, startRow, cmdName.length),
    ];
    const listChildren = [];
    let col = cmdName.length + 1;
    for (const arg of argTexts) {
        const w = makeNode('simple_word', arg, [], startRow, col, startRow, col + arg.length);
        listChildren.push(w);
        wordChildren.push(w);
        col += arg.length + 1;
    }
    const wordList = makeNode('word_list', argTexts.join(' '), listChildren, startRow, cmdName.length + 1, startRow, col);
    return makeNode('command', `${cmdName} ${argTexts.join(' ')}`, [
        makeNode('simple_word', cmdName, [], startRow, 0, startRow, cmdName.length),
        wordList,
    ], startRow, 0, startRow, col);
}

// Helper: 构造带 braced_word body 的 command（如 foreach、lmap）
function makeCommandWithBody(cmdName, args, bodyChildren, startRow, endRow) {
    const wordChildren = [makeNode('simple_word', cmdName, [], startRow, 0, startRow, cmdName.length)];
    let col = cmdName.length + 1;
    for (const a of args) {
        const w = makeNode('simple_word', a, [], startRow, col, startRow, col + a.length);
        wordChildren.push(w);
        col += a.length + 1;
    }
    const bodyNode = makeNode('braced_word', '{ body }', bodyChildren, startRow, col, endRow, 1);
    wordChildren.push(bodyNode);
    const wordList = makeNode('word_list', '', wordChildren.slice(1), startRow, cmdName.length + 1, endRow, 1);
    return makeNode('command', `${cmdName} ${args.join(' ')} { body }`, [
        makeNode('simple_word', cmdName, [], startRow, 0, startRow, cmdName.length),
        wordList,
    ], startRow, 0, endRow, 1);
}

console.log('\n=== 隐式变量声明函数 — TDD 测试 ===\n');

// ════════════════════════════════════════════════════════════════
// 一、变量提取（getVariables）
// ════════════════════════════════════════════════════════════════

// ── 1. incr ──
test('getVariables: incr count → 提取变量 count', () => {
    const cmd = makeCommandNode('incr', ['count'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 11);
    const vars = varExtractor.getVariables(root, 'incr count');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'count');
    assert.strictEqual(vars[0].kind, 'variable');
});

test('getVariables: incr step 5 → 提取变量 step', () => {
    const cmd = makeCommandNode('incr', ['step', '5'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 13);
    const vars = varExtractor.getVariables(root, 'incr step 5');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'step');
});

test('getVariables: incr 在 proc body 内 → 提取变量', () => {
    const incrCmd = makeCommandNode('incr', ['n'], 1);
    const proc = makeProcNode('loop', '', [incrCmd], 0, 2);
    const root = makeNode('program', '', [proc], 0, 0, 2, 1);
    const vars = varExtractor.getVariables(root, 'proc loop {} {\n  incr n\n}');
    assert.ok(vars.some(v => v.name === 'n'), '应提取 proc 内 incr 的变量 n');
});

// ── 2. append ──
test('getVariables: append buf hello → 提取变量 buf', () => {
    const cmd = makeCommandNode('append', ['buf', 'hello'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 18);
    const vars = varExtractor.getVariables(root, 'append buf hello');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'buf');
});

test('getVariables: append buf a b c → 提取变量 buf', () => {
    const cmd = makeCommandNode('append', ['buf', 'a', 'b', 'c'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 18);
    const vars = varExtractor.getVariables(root, 'append buf a b c');
    assert.strictEqual(vars.length, 1);
    assert.strictEqual(vars[0].name, 'buf');
});

// ── 3. lappend ──
test('getVariables: lappend items x → 提取变量 items', () => {
    const cmd = makeCommandNode('lappend', ['items', 'x'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 17);
    const vars = varExtractor.getVariables(root, 'lappend items x');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'items');
});

// ── 4. lmap ──
test('getVariables: lmap v $list {body} → 提取循环变量 v', () => {
    const cmd = makeCommandWithBody('lmap', ['v', '$list'], [], 0, 2);
    const root = makeNode('program', '', [cmd], 0, 0, 2, 1);
    const vars = varExtractor.getVariables(root, 'lmap v $list { body }');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'v');
});

test('getVariables: lmap {k v} $dict {body} → 提取循环变量 k 和 v', () => {
    // {k v} is a braced_word in arguments
    const bracedVars = makeNode('braced_word', '{k v}', [
        makeNode('{', '{', [], 0, 0, 0, 1),
        makeNode('simple_word', 'k', [], 0, 1, 0, 2),
        makeNode('simple_word', 'v', [], 0, 3, 0, 4),
        makeNode('}', '}', [], 0, 4, 0, 5),
    ], 0, 0, 0, 5);
    const cmd = makeCommandWithBody('lmap', [], [], 0, 2);
    // Override: 手动构建带 braced_word 的 lmap
    const wordChildren = [
        makeNode('simple_word', 'lmap', [], 0, 0, 0, 4),
        bracedVars,
        makeNode('simple_word', '$dict', [], 0, 6, 0, 11),
        makeNode('braced_word', '{ body }', [], 0, 12, 2, 1),
    ];
    const wordList = makeNode('word_list', '', wordChildren.slice(1), 0, 5, 2, 1);
    const cmdNode = makeNode('command', 'lmap {k v} $dict { body }', [
        makeNode('simple_word', 'lmap', [], 0, 0, 0, 4),
        wordList,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [cmdNode], 0, 0, 2, 1);
    const vars = varExtractor.getVariables(root, 'lmap {k v} $dict { body }');
    assert.strictEqual(vars.length, 2, `应有 2 个变量，实际 ${vars.length}`);
    assert.ok(vars.some(v => v.name === 'k'), '应包含变量 k');
    assert.ok(vars.some(v => v.name === 'v'), '应包含变量 v');
});

// ── 5. gets ──
test('getVariables: gets stdin line → 提取变量 line', () => {
    const cmd = makeCommandNode('gets', ['stdin', 'line'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 16);
    const vars = varExtractor.getVariables(root, 'gets stdin line');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'line');
});

// ── 6. scan ──
test('getVariables: scan "42" "%d" num → 提取变量 num', () => {
    const cmd = makeCommandNode('scan', ['"42"', '"%d"', 'num'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 20);
    const vars = varExtractor.getVariables(root, 'scan "42" "%d" num');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'num');
});

test('getVariables: scan "1 2" "%d %d" a b → 提取变量 a 和 b', () => {
    const cmd = makeCommandNode('scan', ['"1 2"', '"%d %d"', 'a', 'b'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 26);
    const vars = varExtractor.getVariables(root, 'scan "1 2" "%d %d" a b');
    assert.strictEqual(vars.length, 2, `应有 2 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'a');
    assert.strictEqual(vars[1].name, 'b');
});

// ── 7. regexp ──
test('getVariables: regexp {(\w+)} "hello" match → 提取变量 match', () => {
    const cmd = makeCommandNode('regexp', ['{(\\w+)}', '"hello"', 'match'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 30);
    const vars = varExtractor.getVariables(root, 'regexp {(\\w+)} "hello" match');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'match');
});

test('getVariables: regexp {(\w+)-(\w+)} "a-b" m s1 s2 → 提取 m, s1, s2', () => {
    const cmd = makeCommandNode('regexp', ['{(\\w+)-(\\w+)}', '"a-b"', 'm', 's1', 's2'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 40);
    const vars = varExtractor.getVariables(root, 'regexp {(\\w+)-(\\w+)} "a-b" m s1 s2');
    assert.strictEqual(vars.length, 3, `应有 3 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'm');
    assert.strictEqual(vars[1].name, 's1');
    assert.strictEqual(vars[2].name, 's2');
});

// ── 8. regsub ──
test('getVariables: regsub {old} "old new" "new" result → 提取变量 result', () => {
    const cmd = makeCommandNode('regsub', ['{old}', '"old new"', '"new"', 'result'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 36);
    const vars = varExtractor.getVariables(root, 'regsub {old} "old new" "new" result');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'result');
});

// ── 9. catch ──
test('getVariables: catch {error boom} result → 提取变量 result', () => {
    // catch 的 script 参数可能是 braced_word
    const scriptNode = makeNode('braced_word', '{error boom}', [], 0, 6, 0, 18);
    const resultWord = makeNode('simple_word', 'result', [], 0, 19, 0, 25);
    const wordChildren = [scriptNode, resultWord];
    const wordList = makeNode('word_list', '', wordChildren, 0, 6, 0, 25);
    const cmd = makeNode('command', 'catch {error boom} result', [
        makeNode('simple_word', 'catch', [], 0, 0, 0, 5),
        wordList,
    ], 0, 0, 0, 25);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 25);
    const vars = varExtractor.getVariables(root, 'catch {error boom} result');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'result');
});

test('getVariables: catch {error x} result opts → 提取 result 和 opts', () => {
    const scriptNode = makeNode('braced_word', '{error x}', [], 0, 6, 0, 16);
    const resultWord = makeNode('simple_word', 'result', [], 0, 17, 0, 23);
    const optsWord = makeNode('simple_word', 'opts', [], 0, 24, 0, 28);
    const wordList = makeNode('word_list', '', [scriptNode, resultWord, optsWord], 0, 6, 0, 28);
    const cmd = makeNode('command', 'catch {error x} result opts', [
        makeNode('simple_word', 'catch', [], 0, 0, 0, 5),
        wordList,
    ], 0, 0, 0, 28);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 28);
    const vars = varExtractor.getVariables(root, 'catch {error x} result opts');
    assert.strictEqual(vars.length, 2, `应有 2 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'result');
    assert.strictEqual(vars[1].name, 'opts');
});

// ── 10. variable ──
test('getVariables: variable myVar → 提取变量 myVar', () => {
    const cmd = makeCommandNode('variable', ['myVar'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 14);
    const vars = varExtractor.getVariables(root, 'variable myVar');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myVar');
});

test('getVariables: variable name val → 提取变量 name（带初始值）', () => {
    const cmd = makeCommandNode('variable', ['name', 'val'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 18);
    const vars = varExtractor.getVariables(root, 'variable name val');
    // name-value pairs: 只提取 name（偶数位参数）
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'name');
});

test('getVariables: variable a 1 b 2 → 提取 a 和 b', () => {
    const cmd = makeCommandNode('variable', ['a', '1', 'b', '2'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 20);
    const vars = varExtractor.getVariables(root, 'variable a 1 b 2');
    assert.strictEqual(vars.length, 2, `应有 2 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'a');
    assert.strictEqual(vars[1].name, 'b');
});

// ── 11. global ──
test('getVariables: global myVar → 提取变量 myVar', () => {
    const cmd = makeCommandNode('global', ['myVar'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 13);
    const vars = varExtractor.getVariables(root, 'global myVar');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myVar');
});

test('getVariables: global a b c → 提取所有全局变量', () => {
    const cmd = makeCommandNode('global', ['a', 'b', 'c'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 13);
    const vars = varExtractor.getVariables(root, 'global a b c');
    assert.strictEqual(vars.length, 3, `应有 3 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'a');
    assert.strictEqual(vars[1].name, 'b');
    assert.strictEqual(vars[2].name, 'c');
});

// ── 12. upvar ──
test('getVariables: upvar $srcVar localVar → 提取本地变量 localVar', () => {
    const cmd = makeCommandNode('upvar', ['$srcVar', 'localVar'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 24);
    const vars = varExtractor.getVariables(root, 'upvar $srcVar localVar');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'localVar');
});

test('getVariables: upvar 1 srcVar myVar → 提取 myVar（带 level）', () => {
    const cmd = makeCommandNode('upvar', ['1', 'srcVar', 'myVar'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 23);
    const vars = varExtractor.getVariables(root, 'upvar 1 srcVar myVar');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myVar');
});

// ── 13. dict set ──
test('getVariables: dict set myDict key value → 提取变量 myDict', () => {
    const cmd = makeCommandNode('dict', ['set', 'myDict', 'key', 'value'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 28);
    const vars = varExtractor.getVariables(root, 'dict set myDict key value');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myDict');
});

// ── 14. dict map ──
test('getVariables: dict map {k v} $dict {body} → 提取 k 和 v', () => {
    const bracedVars = makeNode('braced_word', '{k v}', [
        makeNode('{', '{', [], 0, 0, 0, 1),
        makeNode('simple_word', 'k', [], 0, 1, 0, 2),
        makeNode('simple_word', 'v', [], 0, 3, 0, 4),
        makeNode('}', '}', [], 0, 4, 0, 5),
    ], 0, 0, 0, 5);
    const wordChildren = [
        makeNode('simple_word', 'dict', [], 0, 0, 0, 4),
        makeNode('simple_word', 'map', [], 0, 5, 0, 8),
        bracedVars,
        makeNode('simple_word', '$dict', [], 0, 10, 0, 15),
        makeNode('braced_word', '{ body }', [], 0, 16, 2, 1),
    ];
    const wordList = makeNode('word_list', '', wordChildren.slice(1), 0, 5, 2, 1);
    const cmdNode = makeNode('command', 'dict map {k v} $dict { body }', [
        makeNode('simple_word', 'dict', [], 0, 0, 0, 4),
        wordList,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [cmdNode], 0, 0, 2, 1);
    const vars = varExtractor.getVariables(root, 'dict map {k v} $dict { body }');
    assert.strictEqual(vars.length, 2, `应有 2 个变量，实际 ${vars.length}`);
    assert.ok(vars.some(v => v.name === 'k'), '应包含变量 k');
    assert.ok(vars.some(v => v.name === 'v'), '应包含变量 v');
});

// ── 15. dict update ──
test('getVariables: dict update myDict key varName {body} → 提取 varName', () => {
    const bodyNode = makeNode('braced_word', '{ body }', [], 0, 30, 2, 1);
    const wordChildren = [
        makeNode('simple_word', 'update', [], 0, 5, 0, 11),
        makeNode('simple_word', 'myDict', [], 0, 12, 0, 18),
        makeNode('simple_word', 'key', [], 0, 19, 0, 22),
        makeNode('simple_word', 'varName', [], 0, 23, 0, 30),
        bodyNode,
    ];
    const wordList = makeNode('word_list', '', wordChildren, 0, 5, 2, 1);
    const cmdNode = makeNode('command', 'dict update myDict key varName { body }', [
        makeNode('simple_word', 'dict', [], 0, 0, 0, 4),
        wordList,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [cmdNode], 0, 0, 2, 1);
    const vars = varExtractor.getVariables(root, 'dict update myDict key varName { body }');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'varName');
});

// ── 16. array set ──
test('getVariables: array set myArr {a 1 b 2} → 提取变量 myArr', () => {
    const cmd = makeCommandNode('array', ['set', 'myArr', '{a 1 b 2}'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 28);
    const vars = varExtractor.getVariables(root, 'array set myArr {a 1 b 2}');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myArr');
});

// ── 17. file stat ──
test('getVariables: file stat /path/to/file statArr → 提取变量 statArr', () => {
    const cmd = makeCommandNode('file', ['stat', '/path/to/file', 'statArr'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 36);
    const vars = varExtractor.getVariables(root, 'file stat /path/to/file statArr');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'statArr');
});


// ════════════════════════════════════════════════════════════════
// 二、作用域可见性（ScopeIndex）
// ════════════════════════════════════════════════════════════════

console.log('\n--- 作用域可见性测试 ---\n');

// Helper: 构建全局 command 并验证 scope 可见性
function assertVisible(code, cmdNode, varName, line, message) {
    const root = makeNode('program', '', [cmdNode], 0, 0, cmdNode.endPosition.row, cmdNode.endPosition.column);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(line);
    assert.ok(visible.has(varName), `${message}：变量 ${varName} 在第 ${line} 行应可见，实际可见：{${[...visible].join(', ')}}`);
}

// ── incr 全局作用域 ──
test('Scope: incr count 全局可见', () => {
    const cmd = makeCommandNode('incr', ['count'], 0);
    assertVisible('incr count', cmd, 'count', 1, 'incr 全局作用域');
});

// ── append 全局作用域 ──
test('Scope: append buf hello 全局可见', () => {
    const cmd = makeCommandNode('append', ['buf', 'hello'], 0);
    assertVisible('append buf hello', cmd, 'buf', 1, 'append 全局作用域');
});

// ── lappend 全局作用域 ──
test('Scope: lappend items x 全局可见', () => {
    const cmd = makeCommandNode('lappend', ['items', 'x'], 0);
    assertVisible('lappend items x', cmd, 'items', 1, 'lappend 全局作用域');
});

// ── lmap 全局作用域 ──
test('Scope: lmap v $list {body} → v 全局可见', () => {
    const cmd = makeCommandWithBody('lmap', ['v', '$list'], [], 0, 2);
    const root = makeNode('program', '', [cmd], 0, 0, 2, 1);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('v'), `lmap 变量 v 在第 1 行应可见，实际：{${[...visible].join(', ')}}`);
});

// ── gets 全局作用域 ──
test('Scope: gets stdin line 全局可见', () => {
    const cmd = makeCommandNode('gets', ['stdin', 'line'], 0);
    assertVisible('gets stdin line', cmd, 'line', 1, 'gets 全局作用域');
});

// ── scan 全局作用域 ──
test('Scope: scan "42" "%d" num 全局可见', () => {
    const cmd = makeCommandNode('scan', ['"42"', '"%d"', 'num'], 0);
    assertVisible('scan "42" "%d" num', cmd, 'num', 1, 'scan 全局作用域');
});

// ── regexp 全局作用域 ──
test('Scope: regexp pattern str match 全局可见', () => {
    const cmd = makeCommandNode('regexp', ['{pat}', '"str"', 'match'], 0);
    assertVisible('regexp', cmd, 'match', 1, 'regexp 全局作用域');
});

// ── regsub 全局作用域 ──
test('Scope: regsub pattern str sub result 全局可见', () => {
    const cmd = makeCommandNode('regsub', ['{pat}', '"str"', '"sub"', 'result'], 0);
    assertVisible('regsub', cmd, 'result', 1, 'regsub 全局作用域');
});

// ── catch 全局作用域 ──
test('Scope: catch script result 全局可见', () => {
    const scriptNode = makeNode('braced_word', '{script}', [], 0, 6, 0, 15);
    const resultWord = makeNode('simple_word', 'result', [], 0, 16, 0, 22);
    const wordList = makeNode('word_list', '', [scriptNode, resultWord], 0, 6, 0, 22);
    const cmd = makeNode('command', 'catch {script} result', [
        makeNode('simple_word', 'catch', [], 0, 0, 0, 5),
        wordList,
    ], 0, 0, 0, 22);
    assertVisible('catch', cmd, 'result', 1, 'catch 全局作用域');
});

// ── variable 全局作用域 ──
test('Scope: variable myVar 全局可见', () => {
    const cmd = makeCommandNode('variable', ['myVar'], 0);
    assertVisible('variable myVar', cmd, 'myVar', 1, 'variable 全局作用域');
});

// ── global 在 proc 内导入 ──
test('Scope: proc 内 global myVar → myVar 在 body 内可见', () => {
    // 先在全局定义 myVar
    const globalSet = makeSetNode('myVar', '42', 0);
    // proc 内 global myVar
    const globalCmd = makeCommandNode('global', ['myVar'], 2);
    const proc = makeProcNode('test', '', [globalCmd], 1, 4);
    const root = makeNode('program', '', [globalSet, proc], 0, 0, 4, 1);
    const index = scope.buildScopeIndex(root);
    // body 在行 3（第 3 行）
    const visible = index.getVisibleAt(3);
    assert.ok(visible.has('myVar'), `global 导入的 myVar 应在 proc body 内可见，实际：{${[...visible].join(', ')}}`);
});

// ── upvar 在 proc 内导入 ──
test('Scope: proc 内 upvar $src local → local 在 body 内可见', () => {
    const upvarCmd = makeCommandNode('upvar', ['$src', 'local'], 2);
    const proc = makeProcNode('test', '', [upvarCmd], 1, 4);
    const root = makeNode('program', '', [proc], 0, 0, 4, 1);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(3);
    assert.ok(visible.has('local'), `upvar 导入的 local 应在 proc body 内可见，实际：{${[...visible].join(', ')}}`);
});

// ── dict set 全局作用域 ──
test('Scope: dict set myDict key val 全局可见', () => {
    const cmd = makeCommandNode('dict', ['set', 'myDict', 'key', 'val'], 0);
    assertVisible('dict set', cmd, 'myDict', 1, 'dict set 全局作用域');
});

// ── array set 全局作用域 ──
test('Scope: array set myArr list 全局可见', () => {
    const cmd = makeCommandNode('array', ['set', 'myArr', 'list'], 0);
    assertVisible('array set', cmd, 'myArr', 1, 'array set 全局作用域');
});

// ── file stat 全局作用域 ──
test('Scope: file stat path arr 全局可见', () => {
    const cmd = makeCommandNode('file', ['stat', 'path', 'arr'], 0);
    assertVisible('file stat', cmd, 'arr', 1, 'file stat 全局作用域');
});


// ════════════════════════════════════════════════════════════════
// 三、ERROR 节点中的恢复（模拟 tree-sitter-tcl 解析失败）
// ════════════════════════════════════════════════════════════════

console.log('\n--- ERROR 节点恢复测试 ---\n');

test('ERROR: incr count 在 ERROR 节点中仍被提取', () => {
    // tree-sitter-tcl 将 incr 解析为 ERROR(simple_word simple_word)
    const errNode = makeNode('ERROR', 'incr count', [
        makeNode('simple_word', 'incr', [], 0, 0, 0, 4),
        makeNode('simple_word', 'count', [], 0, 5, 0, 10),
    ], 0, 0, 0, 10);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 10);
    const vars = varExtractor.getVariables(root, 'incr count');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'count');
});

test('ERROR: append buf hello 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'append buf hello', [
        makeNode('simple_word', 'append', [], 0, 0, 0, 6),
        makeNode('simple_word', 'buf', [], 0, 7, 0, 10),
        makeNode('simple_word', 'hello', [], 0, 11, 0, 16),
    ], 0, 0, 0, 16);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 16);
    const vars = varExtractor.getVariables(root, 'append buf hello');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'buf');
});

test('ERROR: lappend items x 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'lappend items x', [
        makeNode('simple_word', 'lappend', [], 0, 0, 0, 7),
        makeNode('simple_word', 'items', [], 0, 8, 0, 13),
        makeNode('simple_word', 'x', [], 0, 14, 0, 15),
    ], 0, 0, 0, 15);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 15);
    const vars = varExtractor.getVariables(root, 'lappend items x');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'items');
});

test('ERROR: gets stdin line 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'gets stdin line', [
        makeNode('simple_word', 'gets', [], 0, 0, 0, 4),
        makeNode('simple_word', 'stdin', [], 0, 5, 0, 10),
        makeNode('simple_word', 'line', [], 0, 11, 0, 15),
    ], 0, 0, 0, 15);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 15);
    const vars = varExtractor.getVariables(root, 'gets stdin line');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'line');
});

test('ERROR: scan "42" "%d" num 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'scan "42" "%d" num', [
        makeNode('simple_word', 'scan', [], 0, 0, 0, 4),
        makeNode('simple_word', '"42"', [], 0, 5, 0, 9),
        makeNode('simple_word', '"%d"', [], 0, 10, 0, 14),
        makeNode('simple_word', 'num', [], 0, 15, 0, 18),
    ], 0, 0, 0, 18);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 18);
    const vars = varExtractor.getVariables(root, 'scan "42" "%d" num');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'num');
});

test('ERROR: regexp pat str match 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'regexp pat str match', [
        makeNode('simple_word', 'regexp', [], 0, 0, 0, 6),
        makeNode('simple_word', 'pat', [], 0, 7, 0, 10),
        makeNode('simple_word', 'str', [], 0, 11, 0, 14),
        makeNode('simple_word', 'match', [], 0, 15, 0, 20),
    ], 0, 0, 0, 20);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 20);
    const vars = varExtractor.getVariables(root, 'regexp pat str match');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'match');
});

test('ERROR: regsub pat str sub result 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'regsub pat str sub result', [
        makeNode('simple_word', 'regsub', [], 0, 0, 0, 6),
        makeNode('simple_word', 'pat', [], 0, 7, 0, 10),
        makeNode('simple_word', 'str', [], 0, 11, 0, 14),
        makeNode('simple_word', 'sub', [], 0, 15, 0, 18),
        makeNode('simple_word', 'result', [], 0, 19, 0, 25),
    ], 0, 0, 0, 25);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 25);
    const vars = varExtractor.getVariables(root, 'regsub pat str sub result');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'result');
});

test('ERROR: catch script result 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'catch {script} result', [
        makeNode('simple_word', 'catch', [], 0, 0, 0, 5),
        makeNode('simple_word', '{script}', [], 0, 6, 0, 15),
        makeNode('simple_word', 'result', [], 0, 16, 0, 22),
    ], 0, 0, 0, 22);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 22);
    const vars = varExtractor.getVariables(root, 'catch {script} result');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'result');
});

test('ERROR: variable myVar 在 ERROR 节点中仍被提取', () => {
    const errNode = makeNode('ERROR', 'variable myVar', [
        makeNode('simple_word', 'variable', [], 0, 0, 0, 8),
        makeNode('simple_word', 'myVar', [], 0, 9, 0, 14),
    ], 0, 0, 0, 14);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 14);
    const vars = varExtractor.getVariables(root, 'variable myVar');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'myVar');
});


// ════════════════════════════════════════════════════════════════
// 四、ERROR 中的作用域可见性
// ════════════════════════════════════════════════════════════════

console.log('\n--- ERROR 中的作用域可见性 ---\n');

test('Scope ERROR: incr count 在 ERROR 内全局可见', () => {
    const errNode = makeNode('ERROR', 'incr count', [
        makeNode('simple_word', 'incr', [], 0, 0, 0, 4),
        makeNode('simple_word', 'count', [], 0, 5, 0, 10),
    ], 0, 0, 0, 10);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 10);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('count'), `ERROR 内 incr 的 count 应可见，实际：{${[...visible].join(', ')}}`);
});

test('Scope ERROR: append buf hello 在 ERROR 内全局可见', () => {
    const errNode = makeNode('ERROR', 'append buf hello', [
        makeNode('simple_word', 'append', [], 0, 0, 0, 6),
        makeNode('simple_word', 'buf', [], 0, 7, 0, 10),
        makeNode('simple_word', 'hello', [], 0, 11, 0, 16),
    ], 0, 0, 0, 16);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 16);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('buf'), `ERROR 内 append 的 buf 应可见，实际：{${[...visible].join(', ')}}`);
});

test('Scope ERROR: gets stdin line 在 ERROR 内全局可见', () => {
    const errNode = makeNode('ERROR', 'gets stdin line', [
        makeNode('simple_word', 'gets', [], 0, 0, 0, 4),
        makeNode('simple_word', 'stdin', [], 0, 5, 0, 10),
        makeNode('simple_word', 'line', [], 0, 11, 0, 15),
    ], 0, 0, 0, 15);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 15);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('line'), `ERROR 内 gets 的 line 应可见，实际：{${[...visible].join(', ')}}`);
});


// ════════════════════════════════════════════════════════════════
// 五、command_substitution 内的隐式变量声明
// tree-sitter-tcl 对 set 值中的 [...] 解析不完整，
// set VAR [lmap v $list {body}] 会导致 set 变为 ERROR，
// lmap 被嵌套在 command_substitution > command 内部。
// buildScopeIndex 必须递归进入 command_substitution 提取变量。
// ════════════════════════════════════════════════════════════════

console.log('\n--- command_substitution 内的隐式变量声明 ---\n');

// Helper: 构造 set VAR [cmd ...] 的 ERROR 节点
// tree-sitter-tcl 实际输出: ERROR(id "VAR", command_substitution(command ...))
function makeCmdSubstInError(varName, innerCmdChildren, errText, errRow) {
    const innerCmd = makeNode('command', '', innerCmdChildren, errRow, 0, errRow, 60);
    const wordList = makeNode('word_list', '', innerCmdChildren.slice(1), errRow, 5, errRow, 60);
    // Rebuild innerCmd with word_list
    const cmdWithList = makeNode('command', '', [innerCmdChildren[0], wordList], errRow, 0, errRow, 60);
    const cmdSubst = makeNode('command_substitution', '', [cmdWithList], errRow, 0, errRow, 60);
    return makeNode('ERROR', errText, [
        makeNode('id', varName, [], errRow, 0, errRow, varName.length),
        cmdSubst,
    ], errRow, 0, errRow, 60);
}

// ── lmap inside command_substitution ──
test('Scope: set VAR [lmap v $list {body}] → v 可见', () => {
    // set VGS_LIST [lmap v $ABS_VGS_LIST {set v "$SYMBOL$v"}]
    // ERROR > id("VGS_LIST") + command_substitution > command > word_list > lmap args
    const lmapWord = makeNode('simple_word', 'lmap', [], 0, 0, 0, 4);
    const vWord = makeNode('simple_word', 'v', [], 0, 5, 0, 6);
    const listWord = makeNode('simple_word', '$list', [], 0, 7, 0, 12);
    const bodyNode = makeNode('braced_word', '{set v x}', [], 0, 13, 0, 23);
    const wordList = makeNode('word_list', '', [vWord, listWord, bodyNode], 0, 5, 0, 23);
    const innerCmd = makeNode('command', 'lmap v $list {set v x}', [lmapWord, wordList], 0, 0, 0, 23);
    const cmdSubst = makeNode('command_substitution', '[lmap v $list {set v x}]', [innerCmd], 0, 0, 0, 25);
    const errNode = makeNode('ERROR', 'VGS_LIST [lmap ...]', [
        makeNode('id', 'VGS_LIST', [], 0, 0, 0, 8),
        cmdSubst,
    ], 0, 0, 0, 25);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 25);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('VGS_LIST'), `VGS_LIST 应可见，实际：{${[...visible].join(', ')}}`);
    assert.ok(visible.has('v'), `lmap 循环变量 v 应可见，实际：{${[...visible].join(', ')}}`);
});

// ── lassign inside command_substitution ──
test('Scope: set VAR [lassign $list a b] → a, b 可见', () => {
    const lassignWord = makeNode('simple_word', 'lassign', [], 0, 0, 0, 6);
    const listArg = makeNode('simple_word', '$list', [], 0, 7, 0, 12);
    const aWord = makeNode('simple_word', 'a', [], 0, 13, 0, 14);
    const bWord = makeNode('simple_word', 'b', [], 0, 15, 0, 16);
    const wordList = makeNode('word_list', '', [listArg, aWord, bWord], 0, 7, 0, 16);
    const innerCmd = makeNode('command', 'lassign $list a b', [lassignWord, wordList], 0, 0, 0, 16);
    const cmdSubst = makeNode('command_substitution', '[lassign $list a b]', [innerCmd], 0, 0, 0, 18);
    const errNode = makeNode('ERROR', 'result [lassign ...]', [
        makeNode('id', 'result', [], 0, 0, 0, 6),
        cmdSubst,
    ], 0, 0, 0, 18);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 18);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('result'), `result 应可见`);
    assert.ok(visible.has('a'), `lassign 变量 a 应可见，实际：{${[...visible].join(', ')}}`);
    assert.ok(visible.has('b'), `lassign 变量 b 应可见，实际：{${[...visible].join(', ')}}`);
});

// ── incr inside command_substitution (less common but possible) ──
test('Scope: set VAR [incr count] → count 可见', () => {
    const incrWord = makeNode('simple_word', 'incr', [], 0, 0, 0, 4);
    const countWord = makeNode('simple_word', 'count', [], 0, 5, 0, 10);
    const wordList = makeNode('word_list', '', [countWord], 0, 5, 0, 10);
    const innerCmd = makeNode('command', 'incr count', [incrWord, wordList], 0, 0, 0, 10);
    const cmdSubst = makeNode('command_substitution', '[incr count]', [innerCmd], 0, 0, 0, 12);
    const errNode = makeNode('ERROR', 'result [incr count]', [
        makeNode('id', 'result', [], 0, 0, 0, 6),
        cmdSubst,
    ], 0, 0, 0, 12);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 12);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('result'), `result 应可见`);
    assert.ok(visible.has('count'), `incr 变量 count 应可见，实际：{${[...visible].join(', ')}}`);
});

// ── foreach inside command_substitution (return value context) ──
test('getVariables: ERROR 内 command_substitution 中的 lmap 变量被提取', () => {
    const lmapWord = makeNode('simple_word', 'lmap', [], 0, 0, 0, 4);
    const vWord = makeNode('simple_word', 'v', [], 0, 5, 0, 6);
    const listWord = makeNode('simple_word', '$list', [], 0, 7, 0, 12);
    const bodyNode = makeNode('braced_word', '{set v x}', [], 0, 13, 0, 23);
    const wordList = makeNode('word_list', '', [vWord, listWord, bodyNode], 0, 5, 0, 23);
    const innerCmd = makeNode('command', 'lmap v $list {set v x}', [lmapWord, wordList], 0, 0, 0, 23);
    const cmdSubst = makeNode('command_substitution', '[lmap ...]', [innerCmd], 0, 0, 0, 25);
    const errNode = makeNode('ERROR', 'VGS_LIST [lmap ...]', [
        makeNode('id', 'VGS_LIST', [], 0, 0, 0, 8),
        cmdSubst,
    ], 0, 0, 0, 25);
    const root = makeNode('program', '', [errNode], 0, 0, 0, 25);
    const vars = varExtractor.getVariables(root, 'set VGS_LIST [lmap v $list {set v x}]');
    assert.ok(vars.some(v => v.name === 'v'), `lmap 循环变量 v 应被提取`);
});

// ════════════════════════════════════════════════════════════════
// 六、真实场景：set VALUE [lmap ...] + if 分支
// 验证用户报告的 test_vis.tcl 场景
// ════════════════════════════════════════════════════════════════

console.log('\n--- 真实场景回归测试 ---\n');

test('回归: set VGS_LIST [lmap v $ABS_VGS_LIST {...}] → v 和 VGS_LIST 均可见', () => {
    // 模拟 tree-sitter-tcl 对 set VGS_LIST [lmap v $ABS_VGS_LIST {set v "$SYMBOL$v"}] 的解析
    // set 因包含 [] 而成为 ERROR，lmap 嵌在 command_substitution 内
    const lmapWord = makeNode('simple_word', 'lmap', [], 0, 0, 0, 4);
    const vWord = makeNode('simple_word', 'v', [], 0, 5, 0, 6);
    const absWord = makeNode('variable_substitution', '$ABS_VGS_LIST', [
        makeNode('id', 'ABS_VGS_LIST', [], 0, 6, 0, 19),
    ], 0, 5, 0, 19);
    const bodySet = makeNode('set', 'set v "$SYMBOL$v"', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'v', [], 0, 4, 0, 5),
    ], 0, 0, 0, 20);
    const bodyNode = makeNode('braced_word', '{set v "$SYMBOL$v"}', [bodySet], 0, 20, 0, 40);
    const wordList = makeNode('word_list', '', [vWord, absWord, bodyNode], 0, 5, 0, 40);
    const innerCmd = makeNode('command', 'lmap v ...', [lmapWord, wordList], 0, 0, 0, 40);
    const cmdSubst = makeNode('command_substitution', '[lmap ...]', [innerCmd], 0, 0, 0, 42);

    // 前面已有 ABS_VGS_LIST 的 set 定义
    const absSetNode = makeSetNode('ABS_VGS_LIST', '[list 0.5 0.75 1.0]', 0);

    const errNode = makeNode('ERROR', 'VGS_LIST [lmap ...]', [
        makeNode('id', 'VGS_LIST', [], 0, 0, 0, 8),
        cmdSubst,
    ], 0, 0, 0, 42);

    const root = makeNode('program', '', [absSetNode, errNode], 0, 0, 0, 42);
    const index = scope.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible.has('ABS_VGS_LIST'), `ABS_VGS_LIST 应可见`);
    assert.ok(visible.has('VGS_LIST'), `VGS_LIST 应可见`);
    assert.ok(visible.has('v'), `lmap 循环变量 v 应可见，实际：{${[...visible].join(', ')}}`);
});


summary();
