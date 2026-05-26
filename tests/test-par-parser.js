// tests/test-par-parser.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { parseParText } = require('../src/lsp/sdevicepar/par-parser');

// ── Scope 识别 ──────────────────────────────

test('parses Material scope', () => {
    const text = 'Material = "Silicon" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].scopeType, 'Material');
    assert.strictEqual(result.symbols[0].name, 'Silicon');
    assert.strictEqual(result.symbols[0].parentPath, '');
});

test('parses Region scope', () => {
    const text = 'Region = "channel" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].scopeType, 'Region');
    assert.strictEqual(result.symbols[0].name, 'channel');
});

test('parses all six scope types', () => {
    const types = ['Material', 'Region', 'Interface', 'MaterialInterface', 'RegionInterface', 'Electrode'];
    for (const t of types) {
        const text = `${t} = "test" {\n}\n`;
        const result = parseParText(text, 'test.par');
        assert.strictEqual(result.symbols[0].scopeType, t, `Failed for ${t}`);
    }
});

test('parses scope with slash in name', () => {
    const text = 'Interface = "Silicon/Oxide" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols[0].name, 'Silicon/Oxide');
});

// ── Block 识别 ──────────────────────────────

test('parses inline block', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[1].kind, 'block');
    assert.strictEqual(result.symbols[1].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].parentPath, 'Material/Silicon');
});

test('parses pendingBlockName (block name and { on different lines)', () => {
    const text = 'Material = "Silicon" {\nBandgap\n{\n}\n}\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, 'Should find a block');
    assert.strictEqual(block.name, 'Bandgap');
});

test('pendingBlockName with comment line before {', () => {
    const text = 'Scharfetter\n* relation model\n{\nEg0 = 1.12\n}\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, 'Should find Scharfetter block');
    assert.strictEqual(block.name, 'Scharfetter');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param, 'Should find Eg0 parameter inside block');
});

test('abandoned pendingBlockName when next line is assignment', () => {
    const text = 'Bandgap\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    const blocks = result.symbols.filter(s => s.kind === 'block');
    assert.strictEqual(blocks.length, 0, 'Bandgap should not become a block');
    const params = result.symbols.filter(s => s.kind === 'parameter');
    assert.strictEqual(params.length, 1);
    assert.strictEqual(params[0].name, 'Eg0');
    // Should have abandonedPending diagnostic
    const abandoned = result.diagnostics.filter(d => d.kind === 'abandonedPending');
    assert.ok(abandoned.length >= 1, 'Should warn about abandoned pending');
});

// ── Single-line inline blocks ───────────────

test('inline block with single parameter: Bandgap { Eg0 = 1.12 }', () => {
    const text = 'Bandgap { Eg0 = 1.12 }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].kind, 'parameter');
    assert.strictEqual(result.symbols[1].name, 'Eg0');
    assert.strictEqual(result.symbols[1].value, '1.12');
    assert.strictEqual(result.symbols[1].parentPath, 'Bandgap');
});

test('inline block with multiple parameters', () => {
    const text = 'Bandgap { Eg0 = 1.12 Chi0 = 4.05 }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 3);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].kind, 'parameter');
    assert.strictEqual(result.symbols[1].name, 'Eg0');
    assert.strictEqual(result.symbols[1].value, '1.12');
    assert.strictEqual(result.symbols[2].kind, 'parameter');
    assert.strictEqual(result.symbols[2].name, 'Chi0');
    assert.strictEqual(result.symbols[2].value, '4.05');
});

test('scope with inline block and parameter', () => {
    const text = 'Material = "Si" { Bandgap { Eg0 = 1.12 } }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 3);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].name, 'Si');
    assert.strictEqual(result.symbols[1].kind, 'block');
    assert.strictEqual(result.symbols[1].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].parentPath, 'Material/Si');
    assert.strictEqual(result.symbols[2].kind, 'parameter');
    assert.strictEqual(result.symbols[2].name, 'Eg0');
    assert.strictEqual(result.symbols[2].value, '1.12');
    assert.strictEqual(result.symbols[2].parentPath, 'Material/Si/Bandgap');
});

test('pending block with inline parameter', () => {
    const text = 'Bandgap\n{ Eg0 = 1.12 }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].kind, 'parameter');
    assert.strictEqual(result.symbols[1].name, 'Eg0');
    assert.strictEqual(result.symbols[1].value, '1.12');
    assert.strictEqual(result.symbols[1].parentPath, 'Bandgap');
});

test('nested inline blocks: Outer { Inner { x = 1 } }', () => {
    const text = 'Outer { Inner { x = 1 } }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 3);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Outer');
    assert.strictEqual(result.symbols[1].kind, 'block');
    assert.strictEqual(result.symbols[1].name, 'Inner');
    assert.strictEqual(result.symbols[1].parentPath, 'Outer');
    assert.strictEqual(result.symbols[2].kind, 'parameter');
    assert.strictEqual(result.symbols[2].name, 'x');
    assert.strictEqual(result.symbols[2].value, '1');
    assert.strictEqual(result.symbols[2].parentPath, 'Outer/Inner');
});

test('inline block with comment', () => {
    const text = 'Block { x = 1 # this is a comment }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Block');
    assert.strictEqual(result.symbols[1].kind, 'parameter');
    assert.strictEqual(result.symbols[1].name, 'x');
    assert.strictEqual(result.symbols[1].value, '1');
});

test('inline block with string value', () => {
    const text = 'Block { name = "test" }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Block');
    assert.strictEqual(result.symbols[1].kind, 'parameter');
    assert.strictEqual(result.symbols[1].name, 'name');
    assert.strictEqual(result.symbols[1].value, '"test"');
});

test('empty inline block creates just the block symbol', () => {
    const text = 'Bandgap { }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'block');
    assert.strictEqual(result.symbols[0].name, 'Bandgap');
});

test('inline block does not affect multiline parsing regression', () => {
    const text = [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '}',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 3);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'scope').length, 1);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'block').length, 1);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'parameter').length, 1);
});

test('scope with multiple inline blocks', () => {
    const text = 'Material = "Si" { Bandgap { Eg0 = 1.12 } Avalanche { n_l_f = 1.0 } }\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 5);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[1].kind, 'block');
    assert.strictEqual(result.symbols[1].name, 'Bandgap');
    assert.strictEqual(result.symbols[2].kind, 'parameter');
    assert.strictEqual(result.symbols[2].name, 'Eg0');
    assert.strictEqual(result.symbols[3].kind, 'block');
    assert.strictEqual(result.symbols[3].name, 'Avalanche');
    assert.strictEqual(result.symbols[4].kind, 'parameter');
    assert.strictEqual(result.symbols[4].name, 'n_l_f');
});

// ── Parameter 识别 ──────────────────────────

test('parses parameter assignment', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Eg0');
    assert.strictEqual(param.value, '1.12');
    assert.strictEqual(param.parentPath, 'Material/Silicon/Bandgap');
});

test('parses vector parameter with index', () => {
    const text = 'Bandgap {\n  Xmax(0) = 1e-4\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Xmax(0)');
});

test('parses SWB parameter value', () => {
    const text = 'Bandgap {\n  Eg0 = @Eg0Silicon@\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '@Eg0Silicon@');
});

test('parses string parameter value', () => {
    const text = 'Physics {\n  fileName = "model.dat"\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '"model.dat"');
});

test('parameter value includes inline comment', () => {
    const text = 'Bandgap {\n  Eg0 = 1.12 # electron volts\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '1.12 # electron volts');
});

// ── #include 识别 ────────────────────────────

test('parses #include reference', () => {
    const text = 'Material = "Silicon" {\n  #include "Silicon.par"\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
    assert.strictEqual(result.includes[0].parentPath, 'Material/Silicon');
});

test('#include is not swallowed by comment skip', () => {
    const text = '#include "Silicon.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
});

test('#include at top level has empty parentPath', () => {
    const text = '#include "common.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes[0].parentPath, '');
});

// ── Insert 识别 ──────────────────────────────

test('parses Insert reference', () => {
    const text = 'Material = "Silicon" {\n  Insert = "Silicon.par"\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
    // Should NOT produce a parameter symbol
    assert.strictEqual(result.symbols.filter(s => s.kind === 'parameter').length, 0);
});

test('Insert is not swallowed by parameter assignment', () => {
    const text = 'Insert = "Oxide.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.symbols.length, 0);
});

// ── #if 条件块 ───────────────────────────────

test('#if block content is parsed normally', () => {
    const text = [
        'Material = "Silicon" {',
        '  #if @useAdvanced@ == 1',
        '    Bandgap {',
        '      Eg0 = 1.16964',
        '    }',
        '  #endif',
        '}',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, '#if block content should be parsed');
    assert.strictEqual(block.name, 'Bandgap');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Eg0');
});

test('#elif/#else/#endif lines are skipped', () => {
    const text = [
        '#if @x@ == 1',
        '  Eg0 = 1.0',
        '#elif @x@ == 2',
        '  Eg0 = 2.0',
        '#else',
        '  Eg0 = 3.0',
        '#endif',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    const params = result.symbols.filter(s => s.kind === 'parameter');
    assert.strictEqual(params.length, 3, 'All branches should be parsed');
});

// ── 注释跳过 ────────────────────────────────

test('hash comment lines are skipped', () => {
    const text = '# This is a comment\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

test('star comment lines are skipped', () => {
    const text = '* This is a comment\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

test('#set and other hash directives are skipped', () => {
    const text = '#set a b\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

// ── lineContexts ─────────────────────────────

test('lineContexts has entry for every line', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const lines = text.split('\n');
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.lineContexts.length, lines.length);
});

test('lineContexts captures beforeStack correctly', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    // Line 0 (Material = "Silicon" {): beforeStack = []
    assert.strictEqual(result.lineContexts[0].stack.length, 0);
    // Line 1 (Bandgap {): beforeStack = [scope:Material/Silicon]
    assert.strictEqual(result.lineContexts[1].stack.length, 1);
    assert.strictEqual(result.lineContexts[1].stack[0].name, 'Silicon');
    // Line 2 (Eg0 = 1.12): beforeStack = [scope, block:Bandgap]
    assert.strictEqual(result.lineContexts[2].stack.length, 2);
    assert.strictEqual(result.lineContexts[2].stack[1].name, 'Bandgap');
});

test('lineContexts tracks pendingBlockName', () => {
    const text = 'Bandgap\n{\nEg0 = 1.12\n}\n';
    const result = parseParText(text, 'test.par');
    // Line 0: pendingBlockName should be set after parsing
    assert.strictEqual(result.lineContexts[0].pendingBlockName, null); // beforeStack, before parsing
    // Line 1: pendingBlockName should be 'Bandgap' from line 0's parsing
    assert.strictEqual(result.lineContexts[1].pendingBlockName, 'Bandgap');
});

// ── 容错 ─────────────────────────────────────

test('scopeType field is consistent: scope frames use scopeType, never type', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    for (const sym of result.symbols) {
        // scope entries must have scopeType, never type
        if (sym.kind === 'scope') {
            assert.ok(sym.scopeType, 'scope symbol must have scopeType');
            assert.strictEqual(sym.type, undefined, 'scope symbol must NOT have type field');
        }
    }
    // Check lineContexts stack frames too
    for (const lc of result.lineContexts) {
        for (const frame of lc.stack) {
            if (frame.kind === 'scope') {
                assert.ok(frame.scopeType, 'scope frame must have scopeType');
                assert.strictEqual(frame.type, undefined, 'scope frame must NOT have type field');
            }
        }
    }
});

test('empty file returns empty result', () => {
    const result = parseParText('', 'test.par');
    assert.strictEqual(result.symbols.length, 0);
    assert.strictEqual(result.includes.length, 0);
    assert.strictEqual(result.lineContexts.length, 1); // one empty line
});

test('comment-only file returns empty symbols', () => {
    const text = '# comment\n* another comment\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 0);
});

test('unbalanced braces do not crash', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.ok(result.symbols.length > 0);
    assert.ok(result.diagnostics.some(d => d.kind === 'unbalancedBraces'));
});

test('nested 3-level structure', () => {
    const text = [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '  AvalancheFactors {',
        '    n_l_f = 1.0',
        '  }',
        '}',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.filter(s => s.kind === 'scope').length, 1);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'block').length, 2);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'parameter').length, 2);
});

summary();
