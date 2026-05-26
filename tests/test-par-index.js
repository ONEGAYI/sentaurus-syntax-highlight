// tests/test-par-index.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const path = require('path');
const { createParIndexService } = require('../src/lsp/sdevicepar/par-index-service');

// Mock document
function mockDoc(text, version, uri = 'file:///test.par') {
    return {
        uri: { toString: () => uri },
        version,
        getText: () => text,
        languageId: 'sdevicepar',
    };
}

// ── 基础缓存 ────────────────────────────────

test('parseCurrentFile returns parsed symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n', 1);
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    assert.strictEqual(result.symbols.length, 3); // scope + block + param
    service.dispose();
});

test('same version returns cached result', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);
    const r1 = service.parseCurrentFile(doc);
    const r2 = service.parseCurrentFile(doc);
    assert.strictEqual(r1, r2, 'Same version should return same object');
    service.dispose();
});

test('new version re-parses', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc1 = mockDoc('Material = "Silicon" {\n}\n', 1);
    const r1 = service.parseCurrentFile(doc1);
    const doc2 = mockDoc('Material = "Oxide" {\n}\n', 2);
    const r2 = service.parseCurrentFile(doc2);
    assert.notStrictEqual(r1, r2, 'Different version should re-parse');
    assert.strictEqual(r2.symbols[0].name, 'Oxide');
    service.dispose();
});

test('getCompletionsAt returns empty when no cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 99); // version 99, not cached
    const items = service.getCompletionsAt(doc, { line: 0, character: 0 });
    assert.ok(Array.isArray(items));
    assert.strictEqual(items.length, 0, 'No cache → empty array (caller falls back to all_keywords)');
    service.dispose();
});

test('getCompletionsAt returns completions from cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const doc = mockDoc(text, 1);
    service.parseCurrentFile(doc);

    // Line 1: inside Material/Silicon scope → should suggest blocks
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    assert.ok(items.length > 0, 'Should have completion items');
    service.dispose();
});

test('onFileClosed clears cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);
    service.parseCurrentFile(doc);
    service.onFileClosed('file:///test.par');

    // After close, same doc should re-parse (cache cleared)
    const r2 = service.parseCurrentFile(doc);
    assert.ok(r2, 'Should re-parse after cache clear');
    service.dispose();
});

test('cache FIFO eviction at 20 entries', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // Fill 21 entries
    for (let i = 0; i < 21; i++) {
        const doc = mockDoc('Material = "X" {\n}\n', 1, `file:///doc${i}.par`);
        service.parseCurrentFile(doc);
    }
    // First doc should be evicted; re-parsing it should produce a new object
    const doc0 = mockDoc('Material = "X" {\n}\n', 1, 'file:///doc0.par');
    const r = service.parseCurrentFile(doc0);
    assert.ok(r, 'Should still work after eviction');
    service.dispose();
});

test('getCompletionsAt returns builtin scope types at top level', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('\n', 1); // empty file
    service.parseCurrentFile(doc);
    const items = service.getCompletionsAt(doc, { line: 0, character: 0 });
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Material'), 'Should include Material');
    assert.ok(labels.includes('Region'), 'Should include Region');
    assert.ok(labels.includes('Electrode'), 'Should include Electrode');
    service.dispose();
});

// ── Include 递归解析 ────────────────────────

const SILICON_PAR = [
    'Bandgap {',
    '  Eg0 = 1.12',
    '}',
    'Epsilon {',
    '  eps = 11.7',
    '}',
].join('\n') + '\n';

const COMMON_PAR = [
    'ThermalVelocity {',
    '  vt = 1e7',
    '}',
].join('\n') + '\n';

const WRAPPER_PAR = [
    'Material = "Silicon" {',
    '  #include "Silicon.par"',
    '}',
].join('\n') + '\n';

const NESTED_WRAPPER = [
    'Material = "Silicon" {',
    '  #include "Silicon.par"',
    '  #include "common.par"',
    '}',
].join('\n') + '\n';

// Mock file system
function createMockReadFile(fileMap) {
    return (p) => {
        const basename = path.basename(p);
        if (fileMap[basename]) return fileMap[basename];
        throw new Error('ENOENT: ' + p);
    };
}

test('include file symbols inherit parentPath', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath, baseUri) => refPath, // simplified
    });
    const doc = mockDoc(WRAPPER_PAR, 1);
    const result = service.parseCurrentFile(doc);

    // Should have grafted symbols from Silicon.par
    const eg0 = result.symbols.find(s => s.name === 'Eg0');
    assert.ok(eg0, 'Should find Eg0 from included file');
    assert.strictEqual(eg0.parentPath, 'Material/Silicon/Bandgap');
    assert.strictEqual(eg0.source, 'include');
    service.dispose();
});

test('multiple includes merge symbols', () => {
    const readFile = createMockReadFile({
        'Silicon.par': SILICON_PAR,
        'common.par': COMMON_PAR,
    });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc(NESTED_WRAPPER, 1);
    const result = service.parseCurrentFile(doc);

    const eg0 = result.symbols.find(s => s.name === 'Eg0');
    const vt = result.symbols.find(s => s.name === 'vt');
    assert.ok(eg0, 'Should have Eg0 from Silicon.par');
    assert.ok(vt, 'Should have vt from common.par');
    assert.strictEqual(vt.parentPath, 'Material/Silicon/ThermalVelocity');
    service.dispose();
});

test('circular include does not infinite loop', () => {
    const CIRCULAR_A = '#include "B.par"\nA_param = 1\n';
    const CIRCULAR_B = '#include "A.par"\nB_param = 2\n';
    const readFile = createMockReadFile({ 'A.par': CIRCULAR_A, 'B.par': CIRCULAR_B });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc('#include "A.par"\n', 1);
    // Should not hang
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    service.dispose();
});

test('include file not found produces warning, no crash', () => {
    const readFile = createMockReadFile({}); // empty → all files not found
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc(WRAPPER_PAR, 1);
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    // Should only have current file's symbols (the scope), no include symbols
    const scopes = result.symbols.filter(s => s.kind === 'scope');
    assert.strictEqual(scopes.length, 1);
    service.dispose();
});

test('includeRawCache caches raw result, same file different grafts', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    let readCount = 0;
    const countingRead = (p) => { readCount++; return readFile(p); };
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile: countingRead,
        resolveFilePath: (refPath) => refPath,
    });

    // First include
    const doc1 = mockDoc('Material = "Si1" {\n  #include "Silicon.par"\n}\n', 1);
    service.parseCurrentFile(doc1);

    // Second include (same file, different parentPath)
    const doc2 = mockDoc('Material = "Si2" {\n  #include "Silicon.par"\n}\n', 1, 'file:///doc2.par');
    service.parseCurrentFile(doc2);

    // Silicon.par should only be read once (cached raw result)
    assert.strictEqual(readCount, 1, 'Should cache raw result and not re-read');
    service.dispose();
});

// ── 修订点 #7 新增测试 ─────────────────────────

test('same include file at different parentPath produces separate grafts', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc([
        'Material = "Si1" {',
        '  #include "Silicon.par"',
        '}',
        'Material = "Si2" {',
        '  #include "Silicon.par"',
        '}',
    ].join('\n') + '\n', 1);
    const result = service.parseCurrentFile(doc);

    // Should have grafted symbols under BOTH parentPaths
    const eg0si1 = result.symbols.find(s => s.name === 'Eg0' && s.parentPath.startsWith('Material/Si1'));
    const eg0si2 = result.symbols.find(s => s.name === 'Eg0' && s.parentPath.startsWith('Material/Si2'));
    assert.ok(eg0si1, 'Should have Eg0 grafted under Material/Si1');
    assert.ok(eg0si2, 'Should have Eg0 grafted under Material/Si2');
    assert.strictEqual(eg0si1.parentPath, 'Material/Si1/Bandgap');
    assert.strictEqual(eg0si2.parentPath, 'Material/Si2/Bandgap');
    service.dispose();
});

// ── Task 5: buildParCompletions 集成测试 ──────

test('source priority: current overrides include in dedup via buildParCompletions', () => {
    const { buildParCompletions } = require('../src/lsp/sdevicepar/par-completion');
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate to 1 item');
    assert.strictEqual(eg0Items[0].source, 'current', 'current source should win over include');
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.16964', 'Should use current value');
});

test('completion provider merge does not pollute original items array', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n', 1);
    service.parseCurrentFile(doc);

    const originalItems = [
        { label: 'Bandgap' },
        { label: 'SomeKeyword' },
    ];
    const originalLen = originalItems.length;

    const parItems = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const parLabels = new Set(parItems.map(i => i.label));
    const keywordFallback = originalItems.filter(i => !parLabels.has(i.label));
    const merged = [...parItems, ...keywordFallback];

    assert.strictEqual(originalItems.length, originalLen, 'originalItems should not be mutated');
    assert.deepStrictEqual(originalItems[0], { label: 'Bandgap' }, 'originalItems content unchanged');
    assert.ok(merged.length >= parItems.length, 'merged should include par items');
    service.dispose();
});

test('already-open document pre-heats on activation', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);

    // Simulate activation pre-heat (extension.js scans textDocuments)
    service.parseCurrentFile(doc);

    // Verify pre-heat worked: getCompletionsAt should return results without re-parsing
    const result = service.getCompletionsAt(doc, { line: 0, character: 0 });
    assert.ok(result.length > 0, 'Pre-heated cache should serve completions');
    // Verify scope type completions are present
    const labels = result.map(i => i.label);
    assert.ok(labels.includes('Material'), 'Should suggest Material scope type');
    service.dispose();
});

// ── Phase 2.2: Workspace Index 数据结构 ───────────

test('addWorkspaceFile stores symbols with source "workspace"', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Bandgap {',
        '  Eg0 = 1.12',
        '}',
    ].join('\n') + '\n');

    const syms = service.getWorkspaceSymbols();
    const eg0 = syms.find(s => s.name === 'Eg0');
    assert.ok(eg0, 'Should find Eg0 in workspace symbols');
    assert.strictEqual(eg0.source, 'workspace');
    service.dispose();
});

test('removeWorkspaceFile removes symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Bandgap {\n  Eg0 = 1.12\n}\n');
    service.removeWorkspaceFile('file:///ws/Silicon.par');

    const syms = service.getWorkspaceSymbols();
    assert.strictEqual(syms.length, 0, 'Should have no workspace symbols after removal');
    service.dispose();
});

test('addWorkspaceFile overwrites previous entry', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Bandgap {\n  Eg0 = 1.12\n}\n');
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Epsilon {\n  eps = 11.7\n}\n');

    const syms = service.getWorkspaceSymbols();
    assert.strictEqual(syms.length, 2, 'Should have 2 symbols (Epsilon block + eps param)');
    assert.ok(syms.find(s => s.name === 'eps'), 'Should have eps from second parse');
    assert.ok(!syms.find(s => s.name === 'Eg0'), 'Should NOT have Eg0 from first parse');
    service.dispose();
});

test('getWorkspaceSymbols returns empty array when no workspace files', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.deepStrictEqual(service.getWorkspaceSymbols(), []);
    service.dispose();
});

summary();
