// tests/test-par-materialdb.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { createParIndexService } = require('../src/lsp/sdevicepar/par-index-service');

// ── 基础接口 ────────────────────────────────────────────

test('getMaterialDbSymbols returns empty before load', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    service.dispose();
});

test('getMaterialDbFileCount is 0 before load', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.strictEqual(service.getMaterialDbFileCount(), 0);
    service.dispose();
});

// ── loadBuiltinMaterialDb ───────────────────────────────

test('loadBuiltinMaterialDb populates placeholder materialdb symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const symbols = service.getMaterialDbSymbols();
    assert.ok(symbols.length > 0, 'Should have placeholder symbols');

    // 包含 Silicon Material scope
    const siliconScope = symbols.find(s => s.name === 'Silicon' && s.kind === 'scope');
    assert.ok(siliconScope, 'Should find Silicon scope');
    assert.strictEqual(siliconScope.scopeType, 'Material');
    assert.strictEqual(siliconScope.parentPath, '');
    assert.strictEqual(siliconScope.fullPath, 'Material/Silicon');

    // 包含 Oxide Material scope
    const oxideScope = symbols.find(s => s.name === 'Oxide' && s.kind === 'scope');
    assert.ok(oxideScope, 'Should find Oxide scope');
    assert.strictEqual(oxideScope.scopeType, 'Material');

    // 所有 source 都是 materialdb
    assert.ok(symbols.every(s => s.source === 'materialdb'));

    service.dispose();
});

test('builtin placeholder symbols use completable parentPath', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const symbols = service.getMaterialDbSymbols();

    // block 补全匹配：parentPath === 'Material/Silicon'
    const siliconBlocks = symbols.filter(s => s.kind === 'block' && s.parentPath === 'Material/Silicon');
    assert.ok(siliconBlocks.length > 0, 'Should have blocks under Material/Silicon');
    const blockNames = siliconBlocks.map(s => s.name);
    assert.ok(blockNames.includes('Epsilon') || blockNames.includes('Bandgap'),
        'Should include Epsilon or Bandgap block');

    // parameter 补全匹配：parentPath === 'Material/Silicon/Epsilon' 或 'Material/Silicon/Bandgap'
    const siliconParams = symbols.filter(s => s.kind === 'parameter' && s.parentPath.startsWith('Material/Silicon/'));
    assert.ok(siliconParams.length > 0, 'Should have params under Material/Silicon/<block>');

    // Oxide 也有 Epsilon
    const oxideBlocks = symbols.filter(s => s.kind === 'block' && s.parentPath === 'Material/Oxide');
    assert.ok(oxideBlocks.some(s => s.name === 'Epsilon'), 'Oxide should have Epsilon');

    service.dispose();
});

// ── addMaterialDbFile 归一化 ──────────────────────────────

test('addMaterialDbFile handles explicit Material scope (format B)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const text = 'Material = "TestMat" {\n  Bandgap {\n    Eg0 = 1.08\n  }\n}\n';
    service.addMaterialDbFile('/custom/TestMat.par', text);

    const symbols = service.getMaterialDbSymbols();
    // scope + block + parameter = 3
    assert.strictEqual(symbols.length, 3);

    const scope = symbols.find(s => s.kind === 'scope');
    assert.strictEqual(scope.name, 'TestMat');
    assert.strictEqual(scope.scopeType, 'Material');
    assert.strictEqual(scope.source, 'materialdb');
    assert.strictEqual(scope.filePath, '/custom/TestMat.par');

    const block = symbols.find(s => s.kind === 'block');
    assert.strictEqual(block.name, 'Bandgap');
    assert.strictEqual(block.parentPath, 'Material/TestMat');

    const param = symbols.find(s => s.kind === 'parameter');
    assert.strictEqual(param.name, 'Eg0');
    assert.strictEqual(param.value, '1.08');
    assert.strictEqual(param.parentPath, 'Material/TestMat/Bandgap');

    service.dispose();
});

test('addMaterialDbFile wraps top-level MaterialDB file by filename (format A)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // 模拟真实 Silicon.par 格式：顶层 block，无 Material scope 包裹
    const text = [
        'Epsilon {',
        '  epsilon = 11.7',
        '}',
        '',
        'Bandgap {',
        '  Eg0 = 1.12',
        '}',
    ].join('\n');
    service.addMaterialDbFile('/db/Silicon.par', text);

    const symbols = service.getMaterialDbSymbols();

    // 应自动创建 synthetic scope: Silicon (Material)
    const scope = symbols.find(s => s.kind === 'scope' && s.name === 'Silicon');
    assert.ok(scope, 'Should create synthetic Silicon scope');
    assert.strictEqual(scope.scopeType, 'Material');
    assert.strictEqual(scope.parentPath, '');
    assert.strictEqual(scope.fullPath, 'Material/Silicon');
    assert.strictEqual(scope.source, 'materialdb');

    // block Epsilon graft 到 Material/Silicon
    const epsilon = symbols.find(s => s.kind === 'block' && s.name === 'Epsilon');
    assert.ok(epsilon, 'Should find Epsilon block');
    assert.strictEqual(epsilon.parentPath, 'Material/Silicon');
    assert.strictEqual(epsilon.fullPath, 'Material/Silicon/Epsilon');

    // parameter epsilon graft 到 Material/Silicon/Epsilon
    const eps = symbols.find(s => s.kind === 'parameter' && s.name === 'epsilon');
    assert.ok(eps, 'Should find epsilon parameter');
    assert.strictEqual(eps.parentPath, 'Material/Silicon/Epsilon');
    assert.strictEqual(eps.value, '11.7');

    // block Bandgap graft 到 Material/Silicon
    const bandgap = symbols.find(s => s.kind === 'block' && s.name === 'Bandgap');
    assert.strictEqual(bandgap.parentPath, 'Material/Silicon');
    assert.strictEqual(bandgap.fullPath, 'Material/Silicon/Bandgap');

    // parameter Eg0 graft 到 Material/Silicon/Bandgap
    const eg0 = symbols.find(s => s.kind === 'parameter' && s.name === 'Eg0');
    assert.strictEqual(eg0.parentPath, 'Material/Silicon/Bandgap');

    // 所有 source 为 materialdb
    assert.ok(symbols.every(s => s.source === 'materialdb'));

    service.dispose();
});

test('addMaterialDbFile does not double-wrap if file has Material scope', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // 文件名是 Silicon.par 但内容已有 Material = "Silicon" scope
    const text = 'Material = "Silicon" {\n  Epsilon {\n    epsilon = 11.7\n  }\n}\n';
    service.addMaterialDbFile('/db/Silicon.par', text);

    const symbols = service.getMaterialDbSymbols();
    // 不应有 synthetic scope — 使用原始的 Material scope
    const scopes = symbols.filter(s => s.kind === 'scope');
    assert.strictEqual(scopes.length, 1, 'Should have exactly one scope (not synthetic + original)');
    assert.strictEqual(scopes[0].name, 'Silicon');
    assert.strictEqual(scopes[0].parentPath, '');

    // block/param parentPath 不应有双重 Material/Silicon/Material/Silicon
    const epsilon = symbols.find(s => s.kind === 'block');
    assert.strictEqual(epsilon.parentPath, 'Material/Silicon');

    service.dispose();
});

// ── 索引管理 ────────────────────────────────────────────

test('addMaterialDbFile accumulates across multiple calls', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addMaterialDbFile('/db/A.par', 'Material = "MatA" {\n}\n');
    service.addMaterialDbFile('/db/B.par', 'Material = "MatB" {\n}\n');

    const symbols = service.getMaterialDbSymbols();
    const names = symbols.filter(s => s.kind === 'scope').map(s => s.name);
    assert.ok(names.includes('MatA'));
    assert.ok(names.includes('MatB'));
    assert.strictEqual(service.getMaterialDbFileCount(), 2);

    service.dispose();
});

test('clearMaterialDb removes all materialdb symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    assert.ok(service.getMaterialDbSymbols().length > 0);

    service.clearMaterialDb();
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    assert.strictEqual(service.getMaterialDbFileCount(), 0);

    service.dispose();
});

test('dispose clears materialDbIndex', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    assert.ok(service.getMaterialDbSymbols().length > 0);
    service.dispose();
    // dispose 后 service 实例的 materialDbIndex 应为空
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
});

test('clearMaterialDb followed by addMaterialDbFile works', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    service.clearMaterialDb();

    service.addMaterialDbFile('/custom/X.par', 'Material = "X" {\n}\n');
    const symbols = service.getMaterialDbSymbols();
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'X');
    assert.strictEqual(symbols[0].source, 'materialdb');

    service.dispose();
});

// ── getCompletionsAt 集成 MaterialDB ──────────────────────

test('scopeName completion includes builtin materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => '',
    };
    service.parseCurrentFile(doc);

    const items = service.getCompletionsAt(doc, { line: 0, character: 12 }, 'Material = "|"');
    const scopeNameItems = items.filter(i => i.kind === 'scopeName');
    assert.ok(scopeNameItems.length > 0, 'Should have scopeName completions');

    const names = scopeNameItems.map(i => i.label);
    assert.ok(names.includes('Silicon'), 'Should suggest Silicon');
    assert.ok(names.includes('Oxide'), 'Should suggest Oxide');

    const siliconItem = scopeNameItems.find(i => i.label === 'Silicon');
    assert.strictEqual(siliconItem.source, 'materialdb');

    service.dispose();
});

test('block completion inside Material scope includes materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const text = 'Material = "Silicon" {\n  \n}\n';
    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => text,
    };
    service.parseCurrentFile(doc);

    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const blockItems = items.filter(i => i.kind === 'block');

    const blockNames = blockItems.map(i => i.label);
    assert.ok(blockNames.includes('Epsilon') || blockNames.includes('Bandgap'),
        'Should suggest Epsilon or Bandgap from materialdb');

    const epsilonItem = blockItems.find(i => i.label === 'Epsilon');
    if (epsilonItem) {
        assert.strictEqual(epsilonItem.source, 'materialdb');
    }

    service.dispose();
});

test('parameter completion inside Material block includes materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const text = 'Material = "Silicon" {\n  Epsilon {\n    \n  }\n}\n';
    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => text,
    };
    service.parseCurrentFile(doc);

    const items = service.getCompletionsAt(doc, { line: 2, character: 4 });
    const paramItems = items.filter(i => i.kind === 'parameter');

    const paramNames = paramItems.map(i => i.label);
    assert.ok(paramNames.includes('epsilon'), 'Should suggest epsilon from materialdb');

    const epsItem = paramItems.find(i => i.label === 'epsilon');
    assert.strictEqual(epsItem.source, 'materialdb');

    service.dispose();
});

test('workspace source wins over materialdb for same-name symbol', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    service.addWorkspaceFile('file:///ws/test.par',
        'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.08\n  }\n}\n');

    service.loadBuiltinMaterialDb();

    const doc = {
        uri: { toString: () => 'file:///current.par' },
        version: 1,
        getText: () => '',
    };
    service.parseCurrentFile(doc);

    const items = service.getCompletionsAt(doc, { line: 0, character: 12 }, 'Material = "|"');
    const siliconItems = items.filter(i => i.label === 'Silicon');

    assert.strictEqual(siliconItems.length, 1, 'Deduped to one Silicon');
    assert.strictEqual(siliconItems[0].source, 'workspace', 'Workspace should win over materialdb');

    service.dispose();
});

// ── 测试补全：空文件跳过 + 深层嵌套 graft ────────────────────

test('addMaterialDbFile skips comment-only file (no symbols)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addMaterialDbFile('/db/empty.par', '# just a comment\n');
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    assert.strictEqual(service.getMaterialDbFileCount(), 0);

    service.addMaterialDbFile('/db/Real.par', 'Epsilon { epsilon = 1.0 }\n');
    assert.strictEqual(service.getMaterialDbFileCount(), 1);

    service.dispose();
});

test('addMaterialDbFile grafts deeply nested blocks correctly (format A)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const text = [
        'Bandgap {',
        '  SubBlock {',
        '    param1 = 1.0',
        '  }',
        '}',
    ].join('\n');
    service.addMaterialDbFile('/db/DeepMat.par', text);

    const symbols = service.getMaterialDbSymbols();

    const scope = symbols.find(s => s.kind === 'scope' && s.name === 'DeepMat');
    assert.ok(scope, 'Should have DeepMat synthetic scope');

    const bandgap = symbols.find(s => s.kind === 'block' && s.name === 'Bandgap');
    assert.strictEqual(bandgap.parentPath, 'Material/DeepMat');
    assert.strictEqual(bandgap.fullPath, 'Material/DeepMat/Bandgap');

    const subblock = symbols.find(s => s.kind === 'block' && s.name === 'SubBlock');
    assert.ok(subblock, 'Should have SubBlock');
    assert.strictEqual(subblock.parentPath, 'Material/DeepMat/Bandgap');
    assert.strictEqual(subblock.fullPath, 'Material/DeepMat/Bandgap/SubBlock');

    const param = symbols.find(s => s.kind === 'parameter' && s.name === 'param1');
    assert.ok(param, 'Should have param1');
    assert.strictEqual(param.parentPath, 'Material/DeepMat/Bandgap/SubBlock');

    service.dispose();
});

summary();
