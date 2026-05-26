// tests/test-par-context.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { stackToPath, getContextAtPosition, matchParentPath } = require('../src/lsp/sdevicepar/par-context');

// ── stackToPath ─────────────────────────────

test('empty stack returns empty string', () => {
    assert.strictEqual(stackToPath([]), '');
});

test('single scope frame', () => {
    const stack = [{ kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 }];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon');
});

test('scope + block frames', () => {
    const stack = [
        { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
        { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 2 },
    ];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon/Bandgap');
});

test('three levels deep', () => {
    const stack = [
        { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
        { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 2 },
        { kind: 'block', name: 'SubBlock', scopeType: null, startLine: 4 },
    ];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon/Bandgap/SubBlock');
});

// ── getContextAtPosition ────────────────────

test('empty file returns null context', () => {
    const result = getContextAtPosition([], 0, 0);
    assert.strictEqual(result, null);
});

test('top-level empty line returns scopeType context', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: null },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.ok(ctx);
    assert.strictEqual(ctx.completableKind, 'scopeType');
    assert.strictEqual(ctx.parentPath, '');
});

test('inside scope returns block context', () => {
    const lineContexts = [
        { line: 0, stack: [{ kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 }], pendingBlockName: null },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'block');
    assert.strictEqual(ctx.parentPath, 'Material/Silicon');
    assert.strictEqual(ctx.scopeType, 'Material');
});

test('inside block returns parameter context', () => {
    const lineContexts = [
        {
            line: 0,
            stack: [
                { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
                { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 1 },
            ],
            pendingBlockName: null,
        },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'parameter');
    assert.strictEqual(ctx.parentPath, 'Material/Silicon/Bandgap');
});

test('line number out of range returns null', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: null },
    ];
    assert.strictEqual(getContextAtPosition(lineContexts, 5, 0), null);
});

test('pendingBlockName context returns blockPending', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: 'Scharfetter' },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'blockPending');
    assert.strictEqual(ctx.pendingBlockName, 'Scharfetter');
});

// ── matchParentPath ─────────────────────────

test('exact match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Material/Silicon/Bandgap'), true);
});

test('wildcard match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Material/*/Bandgap'), true);
});

test('wildcard no match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Region/*/Bandgap'), false);
});

test('prefix wildcard', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', '*/Silicon/Bandgap'), true);
});

test('no pattern returns exact equality check', () => {
    assert.strictEqual(matchParentPath('Material/Silicon', 'Material/Silicon'), true);
    assert.strictEqual(matchParentPath('Material/Silicon', 'Material/Germanium'), false);
});

summary();
