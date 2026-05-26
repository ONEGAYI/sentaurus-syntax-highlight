// tests/test-par-completion.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { buildParCompletions } = require('../src/lsp/sdevicepar/par-completion');
const { SCOPE_TYPES_ARRAY } = require('../src/lsp/sdevicepar/par-constants');

// ── scopeType 补全 ──────────────────────────

test('top level suggests all scope types', () => {
    const ctx = { completableKind: 'scopeType', parentPath: '', scopeType: null, pendingBlockName: null };
    const symbols = [];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    for (const st of SCOPE_TYPES_ARRAY) {
        assert.ok(labels.includes(st), `Should include ${st}`);
    }
});

// ── block 补全 ──────────────────────────────

test('scope context suggests known blocks (aggregated by scopeType)', () => {
    const ctx = { completableKind: 'block', parentPath: 'Material/Silicon', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'block', name: 'Bandgap', parentPath: 'Material/Silicon', source: 'current' },
        { kind: 'block', name: 'Epsilon', parentPath: 'Material/Silicon', source: 'include' },
        { kind: 'block', name: 'OtherBlock', parentPath: 'Material/Oxide', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Bandgap'), 'Should include Bandgap for Material/Silicon');
    assert.ok(labels.includes('Epsilon'), 'Should include Epsilon from include');
    assert.ok(labels.includes('OtherBlock'), 'Should include OtherBlock from same scopeType (Material/Oxide)');
});

test('block does not cross scopeType boundary', () => {
    const ctx = { completableKind: 'block', parentPath: 'Material/Silicon', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'block', name: 'Bandgap', parentPath: 'Material/Silicon', source: 'current' },
        { kind: 'block', name: 'Grid', parentPath: 'Region/R1', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Bandgap'), 'Should include Bandgap');
    assert.ok(!labels.includes('Grid'), 'Should NOT include block from different scopeType (Region)');
});

// ── parameter 补全 ──────────────────────────

test('block context suggests known parameters', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Chi0', value: '4.05', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'n_l_f', value: '1.0', parentPath: 'Material/Silicon/AvalancheFactors', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Eg0'), 'Should include Eg0');
    assert.ok(labels.includes('Chi0'), 'Should include Chi0');
    assert.ok(!labels.includes('n_l_f'), 'Should NOT include n_l_f from different block');
});

test('parameter deduplication by (label, parentPath)', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate (label, parentPath)');
});

test('parameter aggregates across scopeName under same block', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Oxide/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Epsilon', value: '3.9', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'n_l_f', value: '1.0', parentPath: 'Material/Silicon/AvalancheFactors', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Eg0'), 'Should include Eg0 from Material/Silicon/Bandgap');
    assert.ok(labels.includes('Epsilon'), 'Should include Epsilon from Material/Silicon/Bandgap');
    assert.ok(!labels.includes('n_l_f'), 'Should NOT include parameter from different block (AvalancheFactors)');
});

test('exact parentPath wins over scopeType aggregation for same-named parameter', () => {
    // 当前文件有两个 Material scope：TestPriority 和 TestIncludeChange
    // TestPriority/Bandgap 有 Eg0 = 1.16964（current）
    // TestIncludeChange/Bandgap 的 Eg0 来自 include（1.0）
    // 在 TestIncludeChange/Bandgap 内补全时，Eg0 应显示 1.0（精确匹配的 include），
    // 而不是 1.16964（来自另一个 scope 实例的 current）
    const ctx = { completableKind: 'parameter', parentPath: 'Material/TestIncludeChange/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/TestPriority/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Eg0', value: '1.0', parentPath: 'Material/TestIncludeChange/Bandgap', source: 'include' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate to 1');
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.0', 'Exact parentPath include should win over aggregated current');
});

test('scopeType aggregation supplements names not found in exact match', () => {
    // 当前 scope 没有定义 Chi0，但另一个 scope 的同 block 有
    const ctx = { completableKind: 'parameter', parentPath: 'Material/TestIncludeChange/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/TestPriority/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Eg0', value: '1.0', parentPath: 'Material/TestIncludeChange/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Chi0', value: '4.05', parentPath: 'Material/TestPriority/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Eg0'), 'Should include Eg0 from exact match');
    assert.ok(labels.includes('Chi0'), 'Should include Chi0 from scopeType aggregation');
    const eg0 = items.find(i => i.label === 'Eg0');
    assert.strictEqual(eg0.detail, '[par] = 1.0', 'Exact Eg0 should use include value');
});

// ── source 优先级 ───────────────────────────

test('source priority ordering in sortText', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Chi0', value: '4.05', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    // current (priority 0) should sort before include (priority 1)
    const chi0 = items.find(i => i.label === 'Chi0');
    const eg0 = items.find(i => i.label === 'Eg0');
    assert.ok(chi0.sortText < eg0.sortText, 'current source should sort before include');
});

test('dedupe keeps highest priority source for same (label, parentPath)', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate to 1 item');
    assert.strictEqual(eg0Items[0].source, 'current', 'current (priority 0) should win over include (priority 1)');
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.16964', 'Should use current value');
});

// ── insertText 格式 ─────────────────────────

test('scopeType insertText includes full template', () => {
    const ctx = { completableKind: 'scopeType', parentPath: '', scopeType: null, pendingBlockName: null };
    const items = buildParCompletions(ctx, []);
    const material = items.find(i => i.label === 'Material');
    assert.ok(material.insertText.includes('${1:'), 'ScopeType insertText should have ${1: placeholder');
    assert.ok(material.insertText.includes('{'), 'ScopeType insertText should include opening brace');
});

test('block insertText includes braces', () => {
    const ctx = { completableKind: 'block', parentPath: 'Material/Silicon', scopeType: 'Material', pendingBlockName: null };
    const symbols = [{ kind: 'block', name: 'Bandgap', parentPath: 'Material/Silicon', source: 'current' }];
    const items = buildParCompletions(ctx, symbols);
    assert.ok(items[0].insertText.includes('{'), 'Block insertText should include braces');
});

test('parameter insertText ends with equals sign', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [{ kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' }];
    const items = buildParCompletions(ctx, symbols);
    assert.ok(items[0].insertText.endsWith('= '), 'Parameter insertText should end with "= "');
});

// ── 未知上下文 ───────────────────────────────

test('null completableKind returns empty', () => {
    const ctx = { completableKind: null, parentPath: '', scopeType: null, pendingBlockName: null };
    const items = buildParCompletions(ctx, []);
    assert.strictEqual(items.length, 0);
});

test('blockPending context returns empty (Phase 2.1)', () => {
    const ctx = { completableKind: 'blockPending', parentPath: '', scopeType: null, pendingBlockName: 'Scharfetter' };
    const items = buildParCompletions(ctx, []);
    assert.strictEqual(items.length, 0);
});

summary();
