// tests/test-tcl-ast-utils.js
'use strict';

const assert = require('assert');

// 手动 mock web-tree-sitter 节点结构
// 因为 WASM 解析器需要 VSCode 环境初始化，测试中直接构造节点树
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

// 构建一个 sdevice 风格的 AST 片段:
// Device {
//     Electrode { Name="gate" Voltage=0.0 }
//     Physics { Mobility( PhuMob ) }
// }
function buildSampleAST() {
    const electrodeBody = makeNode('word_list', '', [
        makeNode('command', 'Name="gate" Voltage=0.0', [], 1, 4, 1, 29),
    ], 1, 4, 1, 30);
    const electrodeBraced = makeNode('braced_word', '{ Name="gate" Voltage=0.0 }', [
        makeNode('{', '{', [], 1, 14, 1, 15),
        electrodeBody,
        makeNode('}', '}', [], 1, 38, 1, 39),
    ], 1, 14, 1, 39);

    const physicsBody = makeNode('word_list', '', [
        makeNode('command', 'Mobility( PhuMob )', [], 2, 4, 2, 22),
    ], 2, 4, 2, 23);
    const physicsBraced = makeNode('braced_word', '{ Mobility( PhuMob ) }', [
        makeNode('{', '{', [], 2, 12, 2, 13),
        physicsBody,
        makeNode('}', '}', [], 2, 25, 2, 26),
    ], 2, 12, 2, 26);

    const deviceBody = makeNode('word_list', '', [
        makeNode('command', 'Electrode', [electrodeBraced], 1, 4, 1, 39),
        makeNode('command', 'Physics', [physicsBraced], 2, 4, 2, 26),
    ], 0, 7, 3, 1);

    const deviceBraced = makeNode('braced_word', '{\n    Electrode { ... }\n    Physics { ... }\n}', [
        makeNode('{', '{', [], 0, 7, 0, 8),
        deviceBody,
        makeNode('}', '}', [], 3, 0, 3, 1),
    ], 0, 7, 3, 1);

    return makeNode('program', '', [
        makeNode('command', 'Device', [deviceBraced], 0, 0, 3, 1),
    ], 0, 0, 3, 1);
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ast = require('../src/lsp/tcl-ast-utils');

console.log('\n=== tcl-ast-utils 测试 ===\n');

// ── getFoldingRanges 测试 ──
console.log('getFoldingRanges:');

test('从 braced_word 提取折叠范围', () => {
    const root = buildSampleAST();
    const ranges = ast.getFoldingRanges(root);
    // 只有 Device 的 braced_word 跨行（行0→行3），Electrode/Physics 是单行的不过滤
    assert.strictEqual(ranges.length, 1, `应有 1 个折叠范围（Device），实际 ${ranges.length}`);
    assert.strictEqual(ranges[0].startLine, 0, 'Device 应从第 0 行开始');
    assert.strictEqual(ranges[0].endLine, 3, 'Device 应到第 3 行结束');
});

test('空 AST 返回空数组', () => {
    const emptyRoot = makeNode('program', '', [], 0, 0, 0, 0);
    const ranges = ast.getFoldingRanges(emptyRoot);
    assert.strictEqual(ranges.length, 0);
});

// ── findMismatchedBraces 测试 ──
console.log('\nfindMismatchedBraces:');

test('正常代码无括号错误', () => {
    const text = `Device {
    Electrode { Name="gate" Voltage=0.0 }
    Physics { Mobility( PhuMob ) }
}`;
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 0, `不应有括号错误，但发现 ${errors.length} 个`);
});

test('检测到多余的 }', () => {
    const text = 'Device { }}';
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 1, `应有 1 个错误，实际 ${errors.length}`);
    assert(errors[0].message.includes('多余的'), `消息应包含"多余的"，实际: ${errors[0].message}`);
});

test('检测到未闭合的 {', () => {
    const text = 'Device { Electrode { Name="gate"';
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 2, `应有 2 个错误（2个未闭合的{），实际 ${errors.length}`);
    assert(errors[0].message.includes('未闭合'), `消息应包含"未闭合"，实际: ${errors[0].message}`);
});

test('忽略注释中的花括号', () => {
    const text = 'set x 42 # { this is a comment';
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 0, '注释中的花括号不应报错');
});

test('忽略字符串中的花括号', () => {
    const text = 'set msg "hello {world}"';
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 0, '字符串中的花括号不应报错');
});

test('多行代码正确匹配', () => {
    const text = `File {
    Output File="n1"
}
Device {
    Physics {
        Mobility()
    }
}`;
    const errors = ast.findMismatchedBraces(text);
    assert.strictEqual(errors.length, 0, `多行正常代码不应报错，但发现 ${errors.length} 个`);
});

// ── parseSafe 测试 ──
console.log('\nparseSafe:');

test('未初始化时返回 null', () => {
    const result = ast.parseSafe('set x 42');
    assert.strictEqual(result, null);
});

// ── TCL_LANGS 测试 ──
console.log('\nTCL_LANGS:');

test('包含所有 Tcl 方言语言 ID', () => {
    assert.strictEqual(ast.TCL_LANGS.has('sdevice'), true);
    assert.strictEqual(ast.TCL_LANGS.has('sprocess'), true);
    assert.strictEqual(ast.TCL_LANGS.has('emw'), true);
    assert.strictEqual(ast.TCL_LANGS.has('inspect'), true);
    assert.strictEqual(ast.TCL_LANGS.has('svisual'), true);
    assert.strictEqual(ast.TCL_LANGS.has('sde'), false);
    assert.strictEqual(ast.TCL_LANGS.has('javascript'), false);
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  通过: ${passed}, 失败: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
