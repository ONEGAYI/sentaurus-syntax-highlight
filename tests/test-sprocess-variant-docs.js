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

summary();
