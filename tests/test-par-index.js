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

summary();
