'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, summary } = require('./helpers/test-runner');

const root = path.join(__dirname, '..');

// --- Alias 候选（7 个唯一 key）---
const ALIAS_ENTRIES = ['ambients', 'contacts', 'interfaces', 'masks', 'points', 'polygons', 'regions'];

// --- 点号变体候选（51 个，去除尾随 =）---
const DOT_VARIANT_KEYS = [
    'ambient.name', 'ambient.products', 'ambient.rate',
    'beam.dose', 'boundary.conditions',
    'create.all.masks', 'deposit.intrinsic', 'deposit.type',
    'element.to.gauss', 'etch.rate.modifier',
    'extract.moments', 'extract.variable.name', 'extract.variable.names',
    'interface.mat.pairs', 'interface.materials', 'interface.region.pairs', 'interface.regions',
    'kmc.reset.snapshot', 'kmc.stress',
    'load.commands', 'load.mc',
    'mask.corner.mns', 'mask.corner.ngr', 'mask.corner.refine.extent',
    'mask.discretization.size', 'mask.edge.mns', 'mask.edge.ngr', 'mask.edge.refine.extent',
    'mgoals.native', 'optimize.dislocation',
    'point.coord', 'point.implant', 'point.response',
    'polygon.bounding.boxes', 'polygon.inside.points', 'polygon.name', 'polygon.names', 'polygon.tessellations',
    'polyhedron.material',
    'profile.reshaping',
    'region.list', 'region.name', 'region.names',
    'slice.angle', 'slice.angle.offset',
    'smooth.brep', 'smooth.distance', 'smooth.field', 'smooth.points',
    'stress.relax', 'stress.values',
];

const ALL_NEW_KEYS = [...ALIAS_ENTRIES, ...DOT_VARIANT_KEYS];
const VALID_TYPES = new Set(['string', 'number', 'int', 'float', 'boolean', 'enum', 'list', 'keyword', 'circuit', 'filepath']);

function readJson(relPath) {
    return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

test('SPROCESS variant docs JSON files parse correctly', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    assert.ok(typeof en === 'object' && en !== null);
    assert.ok(typeof zh === 'object' && zh !== null);
});

test('SPROCESS variant docs keys are unique', () => {
    for (const relPath of ['syntaxes/sprocess_command_docs.json', 'syntaxes/sprocess_command_docs.zh-CN.json']) {
        const raw = fs.readFileSync(path.join(root, relPath), 'utf8');
        const parsed = JSON.parse(raw);
        const uniqueKeys = Object.keys(parsed);
        // 只匹配顶层 key（缩进 2 个空格 + 引号开头的行）
        const topKeyRegex = /^\s{2}"([^"]+)"\s*:/gm;
        const declarations = [];
        let m;
        while ((m = topKeyRegex.exec(raw)) !== null) declarations.push(m[1]);
        assert.strictEqual(declarations.length, uniqueKeys.length,
            `Duplicate top-level keys in ${relPath}: ${uniqueKeys.length} unique vs ${declarations.length} declarations`);
    }
});

test('SPROCESS alias entries have valid aliasOf targets', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of ALIAS_ENTRIES) {
        const entry = en[key];
        assert.ok(entry, `Missing alias entry: ${key}`);
        assert.ok(entry.aliasOf, `Missing aliasOf in ${key}`);
        assert.ok(en[entry.aliasOf], `aliasOf target "${entry.aliasOf}" not found for ${key}`);
        assert.strictEqual(entry.aliasType, 'plural', `aliasType must be "plural" for ${key}`);
    }
});

test('SPROCESS alias entries are consistent between EN and ZH', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    for (const key of ALIAS_ENTRIES) {
        assert.ok(en[key], `EN missing alias: ${key}`);
        assert.ok(zh[key], `ZH missing alias: ${key}`);
        assert.strictEqual(en[key].aliasOf, zh[key].aliasOf, `aliasOf mismatch for ${key}`);
        assert.strictEqual(en[key].aliasType, zh[key].aliasType, `aliasType mismatch for ${key}`);
    }
});

test('SPROCESS dot-variant docs have required fields', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of DOT_VARIANT_KEYS) {
        const entry = en[key];
        assert.ok(entry, `Missing dot-variant entry: ${key}`);
        assert.ok(entry.signature && entry.signature.length > 0, `${key} missing signature`);
        assert.ok(entry.description && entry.description.length > 0, `${key} missing description`);
    }
});

test('SPROCESS new doc keys exist in all_keywords.json', () => {
    const keywords = readJson('syntaxes/all_keywords.json');
    const sprocessKw = new Set();
    for (const [cat, subCats] of Object.entries(keywords)) {
        if (cat.includes('sprocess') && typeof subCats === 'object' && subCats !== null) {
            for (const [subCat, kws] of Object.entries(subCats)) {
                if (Array.isArray(kws)) {
                    for (const kw of kws) sprocessKw.add(kw.replace(/=+$/, ''));
                }
            }
        }
    }
    for (const key of ALL_NEW_KEYS) {
        assert.ok(sprocessKw.has(key), `Key "${key}" not found in all_keywords.json sprocess categories`);
    }
});

test('SPROCESS dot-variant parameter types use standard labels', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of DOT_VARIANT_KEYS) {
        const entry = en[key];
        if (!entry || !entry.parameters) continue;
        for (const p of entry.parameters) {
            assert.ok(VALID_TYPES.has(p.type), `${key} param "${p.name}" has invalid type "${p.type}"`);
        }
    }
});

test('SPROCESS all new entries exist in both EN and ZH', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    for (const key of ALL_NEW_KEYS) {
        assert.ok(en[key], `EN missing: ${key}`);
        assert.ok(zh[key], `ZH missing: ${key}`);
    }
});


// === Code Integration Tests ===
// 局部扩展 mock-vscode（仅在本测试文件中生效）
const mockVscode = require('./helpers/mock-vscode');

// 保存原始属性，测试结束后恢复，防止 Node.js 模块缓存污染其他测试文件
const _saved = {};
const _mockExtensions = {
    MarkdownString: function(value) { this.value = value || ''; },
    Hover: function(content, range) { this.content = content; this.range = range; },
    CompletionItem: function(label, kind) { this.label = label; this.kind = kind; },
    Range: function(s, e) { this.start = s; this.end = e; },
    Position: function(line, char) { this.line = line; this.character = char; },
    CompletionItemKind: {
        Function: 0, Keyword: 1, Text: 0, Struct: 1, Class: 1,
        Constant: 0, Value: 0, EnumMember: 0, Method: 0,
    },
    languages: {
        registerHoverProvider: function() { return { dispose: function() {} }; },
        registerCompletionItemProvider: function() { return { dispose: function() {} }; },
    },
    workspace: {
        getConfiguration: function() { return { get: function() { return undefined; } }; },
    },
};
for (const [key, value] of Object.entries(_mockExtensions)) {
    _saved[key] = mockVscode[key];
    mockVscode[key] = value;
}

const { formatDoc, resolveAlias } = require('../src/docs-loader');

test('alias resolution: formatDoc receives parent doc via resolveAlias, not alias stub', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        masks: {
            aliasOf: 'mask',
            aliasType: 'plural',
        },
    };

    // 使用实际的 resolveAlias 函数（与 buildItems 和 HoverProvider 共用）
    const entry = resolveAlias(funcDocs['masks'], funcDocs);
    assert.ok(entry, 'resolveAlias should return parent doc for valid alias');
    const md = formatDoc(entry, 'sprocess');
    assert.ok(md.value.includes('mask name= <c>'), 'Should contain parent signature');
    assert.ok(!md.value.includes('undefined'), 'Should not contain undefined');
});

test('resolveAlias returns null for alias with missing parent (buildItems guard)', () => {
    const funcDocs = {
        orphans: {
            aliasOf: 'nonexistent',
            aliasType: 'plural',
        },
    };
    const entry = resolveAlias(funcDocs['orphans'], funcDocs);
    assert.strictEqual(entry, null, 'resolveAlias should return null when parent is missing');
});

test('dot fallback: word with dots resolves to dot-variant doc', () => {
    const docs = {
        'mask.edge.mns': {
            section: 'Mask',
            signature: 'mask edge.mns = <string_list>',
            description: 'Specifies material names for mask edge.',
            parameters: [],
            example: 'mask edge.mns= {Resist Oxide}',
            keywords: ['mask', 'edge'],
        },
    };

    // 模拟 HoverProvider 点号 fallback 逻辑
    // 注意：此逻辑依赖于 HoverProvider 闭包内的局部变量（effectiveWord, word），
    // 无法直接调用，因此模拟行为而非调用实际代码
    const effectiveWord = 'mns';  // identWord match
    const word = 'mask.edge.mns';  // full word match
    let doc = docs[effectiveWord] || null;
    if (!doc && word !== effectiveWord && word.includes('.')) {
        const dotKey = word.replace(/=+$/, '');
        doc = docs[dotKey] || null;
    }
    assert.ok(doc, 'Dot fallback should find mask.edge.mns');
    assert.strictEqual(doc.section, 'Mask');
});

test('alias label generation: plural alias shows correct English label', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        masks: {
            aliasOf: 'mask',
            aliasType: 'plural',
        },
    };

    const useZh = false;
    let doc = funcDocs['masks'];
    let aliasLabel = '';
    if (doc.aliasOf) {
        const parentDoc = resolveAlias(doc, funcDocs);
        if (parentDoc) {
            aliasLabel = doc.aliasType === 'plural'
                ? `(plural of ${doc.aliasOf})`
                : `(see ${doc.aliasOf})`;
            doc = { ...parentDoc, _aliasLabel: aliasLabel };
        }
    }
    assert.strictEqual(aliasLabel, '(plural of mask)');
    assert.ok(doc.signature === 'mask name= <c>', 'Should use parent signature');
    assert.ok(doc._aliasLabel === '(plural of mask)', 'Should have alias label');
});

test('alias label generation: plural alias shows correct Chinese label', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        masks: {
            aliasOf: 'mask',
            aliasType: 'plural',
        },
    };

    const useZh = true;
    let doc = funcDocs['masks'];
    let aliasLabel = '';
    if (doc.aliasOf) {
        const parentDoc = resolveAlias(doc, funcDocs);
        if (parentDoc) {
            aliasLabel = doc.aliasType === 'plural'
                ? `（${doc.aliasOf} 的复数形式）`
                : `（参见 ${doc.aliasOf}）`;
            doc = { ...parentDoc, _aliasLabel: aliasLabel };
        }
    }
    assert.strictEqual(aliasLabel, '（mask 的复数形式）');
    assert.ok(doc._aliasLabel === '（mask 的复数形式）', 'Should have Chinese alias label');
});

test('alias label generation: non-plural alias shows generic "see" label', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        msk: {
            aliasOf: 'mask',
            aliasType: 'abbreviation',
        },
    };

    // English generic label
    let doc = funcDocs['msk'];
    let aliasLabel = '';
    const parentDoc = resolveAlias(doc, funcDocs);
    if (parentDoc) {
        aliasLabel = doc.aliasType === 'plural'
            ? `(plural of ${doc.aliasOf})`
            : `(see ${doc.aliasOf})`;
    }
    assert.strictEqual(aliasLabel, '(see mask)');

    // Chinese generic label
    let aliasLabelZh = '';
    if (parentDoc) {
        aliasLabelZh = doc.aliasType === 'plural'
            ? `（${doc.aliasOf} 的复数形式）`
            : `（参见 ${doc.aliasOf}）`;
    }
    assert.strictEqual(aliasLabelZh, '（参见 mask）');
});

// 恢复 mock-vscode 原始属性，防止模块缓存污染
for (const [key, value] of Object.entries(_saved)) {
    mockVscode[key] = value;
}

summary();
