// tests/test-tcl-document-symbol.js
'use strict';

const assert = require('assert');

// ── Mock 节点构造（与 test-tcl-ast-utils.js 相同） ──

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
    try { fn(); passed++; console.log(`  \u2713 ${name}`); }
    catch (e) { failed++; console.log(`  \u2717 ${name}: ${e.message}`); }
}

const { getDocumentSymbols, SymbolKind } = require('../src/lsp/tcl-ast-utils');

console.log('\n=== tcl-document-symbol \u6d4b\u8bd5 ===\n');

// ── sdevice Physics section ──
console.log('section \u8bc6\u522b:');

test('sdevice Physics section \u8bc6\u522b\u4e3a Namespace', () => {
    // Physics { Mobility( PhuMob ) }
    const physicsBody = makeNode('word_list', '', [], 1, 4, 1, 22);
    const physicsBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 1, 8, 1, 9),
        physicsBody,
        makeNode('}', '}', [], 1, 25, 1, 26),
    ], 1, 8, 1, 26);

    const root = makeNode('program', '', [
        makeNode('command', 'Physics', [
            makeNode('simple_word', 'Physics', [], 0, 0, 0, 7),
            physicsBraced,
        ], 0, 0, 1, 26),
    ], 0, 0, 1, 26);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1, `\u5e94\u6709 1 \u4e2a symbol\uff0c\u5b9e\u9645 ${symbols.length}`);
    assert.strictEqual(symbols[0].name, 'Physics');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

test('sprocess deposit \u8bc6\u522b\u4e3a Namespace', () => {
    const depositBody = makeNode('word_list', '', [], 1, 4, 1, 20);
    const depositBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 1, 8, 1, 9),
        depositBody,
        makeNode('}', '}', [], 1, 25, 1, 26),
    ], 1, 8, 1, 26);

    const root = makeNode('program', '', [
        makeNode('command', 'deposit', [
            makeNode('simple_word', 'deposit', [], 0, 0, 0, 7),
            depositBraced,
        ], 0, 0, 1, 26),
    ], 0, 0, 1, 26);

    const symbols = getDocumentSymbols(root, 'sprocess');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'deposit');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

test('\u666e\u901a\u547d\u4ee4\uff08puts\uff09\u4e0d\u751f\u6210 symbol', () => {
    const root = makeNode('program', '', [
        makeNode('command', 'puts "hello"', [
            makeNode('simple_word', 'puts', [], 0, 0, 0, 4),
        ], 0, 0, 0, 12),
    ], 0, 0, 0, 12);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 0, `puts \u4e0d\u5e94\u751f\u6210 symbol\uff0c\u5b9e\u9645 ${symbols.length}`);
});

// ── proc ──
console.log('\nproc \u8bc6\u522b:');

test('proc \u751f\u6210 Function symbol', () => {
    const argsNode = makeNode('arguments', '{a b}', [
        makeNode('argument', 'a', [], 0, 11, 0, 12),
        makeNode('argument', 'b', [], 0, 13, 0, 14),
    ], 0, 10, 0, 15);
    const bodyBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 16, 0, 17),
        makeNode('word_list', '', [], 0, 17, 0, 17),
        makeNode('}', '}', [], 0, 17, 0, 18),
    ], 0, 16, 0, 18);

    const root = makeNode('program', '', [
        makeNode('procedure', 'proc myFunc {a b} {}', [
            makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
            makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
            argsNode,
            bodyBraced,
        ], 0, 0, 0, 18),
    ], 0, 0, 0, 18);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'myFunc');
    assert.strictEqual(symbols[0].kind, SymbolKind.Function);
});

test('proc \u53c2\u6570\u751f\u6210 Field \u5b50 symbol', () => {
    const argsNode = makeNode('arguments', '{a b}', [
        makeNode('argument', 'a', [], 0, 11, 0, 12),
        makeNode('argument', 'b', [], 0, 13, 0, 14),
    ], 0, 10, 0, 15);
    const bodyBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 16, 0, 17),
        makeNode('word_list', '', [], 0, 17, 0, 17),
        makeNode('}', '}', [], 0, 17, 0, 18),
    ], 0, 16, 0, 18);

    const root = makeNode('program', '', [
        makeNode('procedure', 'proc myFunc {a b} {}', [
            makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
            makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
            argsNode,
            bodyBraced,
        ], 0, 0, 0, 18),
    ], 0, 0, 0, 18);

    const symbols = getDocumentSymbols(root, 'sdevice');
    const params = symbols[0].children.filter(c => c.kind === SymbolKind.Field);
    assert.strictEqual(params.length, 2, `\u5e94\u6709 2 \u4e2a\u53c2\u6570\uff0c\u5b9e\u9645 ${params.length}`);
    assert.strictEqual(params[0].name, 'a');
    assert.strictEqual(params[1].name, 'b');
});

// ── set ──
console.log('\nset \u8bc6\u522b:');

test('set \u751f\u6210 Variable symbol', () => {
    const root = makeNode('program', '', [
        makeNode('set', 'set x 42', [
            makeNode('id', 'x', [], 0, 4, 0, 5),
        ], 0, 0, 0, 8),
    ], 0, 0, 0, 8);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'x');
    assert.strictEqual(symbols[0].kind, SymbolKind.Variable);
});

test('set env() \u88ab\u8df3\u8fc7', () => {
    const root = makeNode('program', '', [
        makeNode('set', 'set env(HOME) /home', [
            makeNode('id', 'env(HOME)', [], 0, 4, 0, 13),
        ], 0, 0, 0, 20),
    ], 0, 0, 0, 20);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 0, 'env() \u53d8\u91cf\u4e0d\u5e94\u751f\u6210 symbol');
});

// ── 嵌套 section ──
console.log('\n\u5d4c\u5957 section:');

test('Device { Electrode { ... } } \u751f\u6210\u5d4c\u5957\u5b50 symbol', () => {
    // Electrode 内部（无子命令）
    const electrodeBody = makeNode('word_list', '', [
        makeNode('command', 'Name="gate"', [], 1, 8, 1, 20),
    ], 1, 4, 1, 21);
    const electrodeBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 1, 14, 1, 15),
        electrodeBody,
        makeNode('}', '}', [], 1, 30, 1, 31),
    ], 1, 14, 1, 31);

    // Electrode 命令
    const electrodeCmd = makeNode('command', 'Electrode', [
        makeNode('simple_word', 'Electrode', [], 1, 4, 1, 13),
        electrodeBraced,
    ], 1, 4, 1, 31);

    // Device 内部 body
    const deviceBody = makeNode('word_list', '', [
        electrodeCmd,
    ], 0, 7, 2, 1);

    // Device braced_word
    const deviceBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 7, 0, 8),
        deviceBody,
        makeNode('}', '}', [], 2, 0, 2, 1),
    ], 0, 7, 2, 1);

    // Device 命令
    const deviceCmd = makeNode('command', 'Device', [
        makeNode('simple_word', 'Device', [], 0, 0, 0, 6),
        deviceBraced,
    ], 0, 0, 2, 1);

    const root = makeNode('program', '', [deviceCmd], 0, 0, 2, 1);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1, `\u5e94\u6709 1 \u4e2a\u9876\u5c42 symbol (Device)\uff0c\u5b9e\u9645 ${symbols.length}`);
    assert.strictEqual(symbols[0].name, 'Device');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);

    // Device 下应有 Electrode 子 symbol
    const deviceChildren = symbols[0].children;
    const electrode = deviceChildren.find(c => c.name === 'Electrode');
    assert.ok(electrode, 'Device \u4e0b\u5e94\u6709 Electrode \u5b50 symbol');
    assert.strictEqual(electrode.kind, SymbolKind.Namespace);
});

// ── foreach ──
console.log('\nforeach \u8bc6\u522b:');

test('foreach \u751f\u6210 Namespace symbol', () => {
    const argsNode = makeNode('arguments', 'item', [
        makeNode('simple_word', 'item', [], 0, 8, 0, 12),
    ], 0, 8, 0, 12);
    const bodyBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 18, 0, 19),
        makeNode('word_list', '', [], 0, 19, 0, 19),
        makeNode('}', '}', [], 0, 19, 0, 20),
    ], 0, 18, 0, 20);

    const root = makeNode('program', '', [
        makeNode('foreach', 'foreach item $list {}', [
            argsNode,
            bodyBraced,
        ], 0, 0, 0, 20),
    ], 0, 0, 0, 20);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'foreach item');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

// ── while ──
console.log('\nwhile \u8bc6\u522b:');

test('while \u751f\u6210 Namespace symbol', () => {
    const condBraced = makeNode('braced_word', '', [], 0, 6, 0, 10);
    const bodyBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 11, 0, 12),
        makeNode('word_list', '', [], 0, 12, 0, 12),
        makeNode('}', '}', [], 0, 12, 0, 13),
    ], 0, 11, 0, 13);

    const root = makeNode('program', '', [
        makeNode('while', 'while {} {}', [
            condBraced,
            bodyBraced,
        ], 0, 0, 0, 13),
    ], 0, 0, 0, 13);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'while');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

// ── for ──
console.log('\nfor \u8bc6\u522b:');

test('for \u751f\u6210 Namespace symbol', () => {
    const initBraced = makeNode('braced_word', '', [], 0, 4, 0, 8);
    const condBraced = makeNode('braced_word', '', [], 0, 9, 0, 14);
    const stepBraced = makeNode('braced_word', '', [], 0, 15, 0, 20);
    const bodyBraced = makeNode('braced_word', '', [
        makeNode('{', '{', [], 0, 21, 0, 22),
        makeNode('word_list', '', [], 0, 22, 0, 22),
        makeNode('}', '}', [], 0, 22, 0, 23),
    ], 0, 21, 0, 23);

    const root = makeNode('program', '', [
        makeNode('command', 'for {} {} {} {}', [
            makeNode('simple_word', 'for', [], 0, 0, 0, 3),
            initBraced,
            condBraced,
            stepBraced,
            bodyBraced,
        ], 0, 0, 0, 23),
    ], 0, 0, 0, 23);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'for');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

// ── 空AST ──
console.log('\n\u7a7a AST:');

test('\u7a7a AST \u8fd4\u56de\u7a7a\u6570\u7ec4', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 0);
});

test('null \u8fd4\u56de\u7a7a\u6570\u7ec4', () => {
    const symbols = getDocumentSymbols(null, 'sdevice');
    assert.strictEqual(symbols.length, 0);
});

// ── SymbolKind 导出 ──
console.log('\nSymbolKind \u5bfc\u51fa:');

test('SymbolKind \u5305\u542b\u6b63\u786e\u503c', () => {
    assert.strictEqual(SymbolKind.Namespace, 3);
    assert.strictEqual(SymbolKind.Field, 8);
    assert.strictEqual(SymbolKind.Function, 12);
    assert.strictEqual(SymbolKind.Variable, 13);
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  \u901a\u8fc7: ${passed}, \u5931\u8d25: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
