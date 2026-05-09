// tests/test-sdevice-vector-keywords.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const { docs, index, sectionKeywords, decodeTokens } = require('./helpers/sdevice-setup');
const assert = require('assert');
const {
    BASE_TO_SUFFIXES, FULL_VECTOR_KEYWORDS, VECTOR_SECTIONS,
    isVectorBase, getSuffixesForBase, resolveBaseKeyword,
    BASE_TO_SUFFIXES_LOWER, VECTOR_SECTIONS_LOWER,
    isVectorBaseCI, getSuffixesForBaseCI, resolveBaseKeywordCI,
} = require('../src/lsp/providers/sdevice-vector-keywords');
const { extractSdeviceTokens } = require('../src/lsp/providers/sdevice-semantic-provider');

// --- 数据完整性 ---

test('62 个矢量基础关键词', () => {
    assert.strictEqual(BASE_TO_SUFFIXES.size, 62);
    assert.strictEqual(FULL_VECTOR_KEYWORDS.size, 62);
    for (const [base, suffixes] of BASE_TO_SUFFIXES) {
        assert.ok(suffixes.length >= 1, `${base} 应至少有一个后缀`);
    }
});

// --- isVectorBase ---

test('isVectorBase: 已知矢量关键词', () => {
    assert.strictEqual(isVectorBase('ElectricField'), true);
    assert.strictEqual(isVectorBase('eVelocity'), true);
    assert.strictEqual(isVectorBase('eSHEDistribution'), true);
    assert.strictEqual(isVectorBase('ConductionCurrentDensity'), true);
    assert.strictEqual(isVectorBase('TotalCurrentDensity'), true);
    assert.strictEqual(isVectorBase('ImeCurrentResponse'), true);
    assert.strictEqual(isVectorBase('GradPoECImACGreenFunction'), true);
    assert.strictEqual(isVectorBase('OpticalField'), true);
    assert.strictEqual(isVectorBase('Polarization'), true);
    assert.strictEqual(isVectorBase('Current'), true);
    assert.strictEqual(isVectorBase('eCurrent'), true);
    assert.strictEqual(isVectorBase('ConductionCurrent'), true);
});

test('isVectorBase: 未知/空返回 false', () => {
    assert.strictEqual(isVectorBase('Unknown'), false);
    assert.strictEqual(isVectorBase(''), false);
});

// --- getSuffixesForBase ---

test('getSuffixesForBase', () => {
    assert.deepStrictEqual(getSuffixesForBase('ElectricField'), ['/Vector']);
    assert.deepStrictEqual(getSuffixesForBase('eSHEDistribution'), ['/SpecialVector']);
    assert.deepStrictEqual(getSuffixesForBase('ConductionCurrentDensity'), ['/vector']);
    assert.strictEqual(getSuffixesForBase('Unknown'), undefined);
});

// --- resolveBaseKeyword ---

test('resolveBaseKeyword: 正常解析', () => {
    assert.strictEqual(resolveBaseKeyword('ElectricField/Vector'), 'ElectricField');
    assert.strictEqual(resolveBaseKeyword('PE_Polarization/vector'), 'PE_Polarization');
    assert.strictEqual(resolveBaseKeyword('eSHEDistribution/SpecialVector'), 'eSHEDistribution');
    assert.strictEqual(resolveBaseKeyword('TotalCurrentDensity/Vector'), 'TotalCurrentDensity');
    assert.strictEqual(resolveBaseKeyword('ImeCurrentResponse/Vector'), 'ImeCurrentResponse');
    assert.strictEqual(resolveBaseKeyword('OpticalField/Vector'), 'OpticalField');
    assert.strictEqual(resolveBaseKeyword('Current/Vector'), 'Current');
    assert.strictEqual(resolveBaseKeyword('eCurrent/Vector'), 'eCurrent');
    assert.strictEqual(resolveBaseKeyword('ConductionCurrent/Vector'), 'ConductionCurrent');
});

test('resolveBaseKeyword: 边界情况', () => {
    assert.strictEqual(resolveBaseKeyword('ElectricField'), null, '无斜杠返回 null');
    assert.strictEqual(resolveBaseKeyword('Unknown/Vector'), null, '未知基础词返回 null');
    assert.strictEqual(resolveBaseKeyword('ElectricField/vector'), null, '后缀不匹配返回 null');
});

// --- VECTOR_SECTIONS ---

test('VECTOR_SECTIONS 包含 Plot 和 CurrentPlot', () => {
    assert.ok(VECTOR_SECTIONS.has('Plot'));
    assert.ok(VECTOR_SECTIONS.has('CurrentPlot'));
    assert.strictEqual(VECTOR_SECTIONS.size, 2);
});

// --- 语义 token 测试 ---

test('ElectricField/Vector 整体 token', () => {
    const data = extractSdeviceTokens('Plot {\n  ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/Vector');
    assert.ok(vf, 'ElectricField/Vector 应生成为整体 token');
    assert.strictEqual(vf.typeIdx, 1, '应为 sectionKeyword 类型');
    assert.strictEqual(vf.len, 20, '长度应覆盖整个 ElectricField/Vector');
});

test('基础词不带后缀仍正常', () => {
    const data = extractSdeviceTokens('Plot {\n  ElectricField\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField\n}', data);
    const ef = tokens.find(t => t.word === 'ElectricField');
    assert.ok(ef, 'ElectricField 单独应仍正常');
    assert.strictEqual(ef.len, 13);
});

test('小写 /vector', () => {
    const data = extractSdeviceTokens('Plot {\n  ConductionCurrentDensity/vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ConductionCurrentDensity/vector\n}', data);
    const vf = tokens.find(t => t.word === 'ConductionCurrentDensity/vector');
    assert.ok(vf, 'ConductionCurrentDensity/vector 应为整体 token');
    assert.strictEqual(vf.typeIdx, 1);
});

test('/SpecialVector', () => {
    const data = extractSdeviceTokens('Plot {\n  eSHEDistribution/SpecialVector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  eSHEDistribution/SpecialVector\n}', data);
    const vf = tokens.find(t => t.word === 'eSHEDistribution/SpecialVector');
    assert.ok(vf, 'eSHEDistribution/SpecialVector 应为整体 token');
});

test('非 Plot section 不生成矢量 token', () => {
    const data = extractSdeviceTokens('Math {\n  ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Math {\n  ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/Vector');
    assert.strictEqual(vf, undefined, 'Math section 中不应有矢量整体 token');
});

test('混合标识符 + 矢量关键词同行', () => {
    const data = extractSdeviceTokens('Plot {\n  ElectricField eHeatFlux/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField eHeatFlux/Vector\n}', data);
    const ef = tokens.find(t => t.word === 'ElectricField');
    const vf = tokens.find(t => t.word === 'eHeatFlux/Vector');
    assert.ok(ef, 'ElectricField 应存在');
    assert.ok(vf, 'eHeatFlux/Vector 应存在');
    assert.ok(vf.col > ef.col, '矢量 token 应在 ElectricField 之后');
});

test('TotalCurrentDensity/Vector 整体 token', () => {
    const data = extractSdeviceTokens('Plot {\n  TotalCurrentDensity/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  TotalCurrentDensity/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'TotalCurrentDensity/Vector');
    assert.ok(vf, 'TotalCurrentDensity/Vector 应为整体 token');
    assert.strictEqual(vf.typeIdx, 1);
});

test('GradPoECImACGreenFunction/Vector 整体 token', () => {
    const data = extractSdeviceTokens('Plot {\n  GradPoECImACGreenFunction/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  GradPoECImACGreenFunction/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'GradPoECImACGreenFunction/Vector');
    assert.ok(vf, 'GradPoECImACGreenFunction/Vector 应为整体 token');
});

test('非 Density 电流矢量 token', () => {
    const data = extractSdeviceTokens('Plot {\n  Current/Vector eCurrent/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  Current/Vector eCurrent/Vector\n}', data);
    const cv = tokens.find(t => t.word === 'Current/Vector');
    const ev = tokens.find(t => t.word === 'eCurrent/Vector');
    assert.ok(cv, 'Current/Vector 应为整体 token');
    assert.ok(ev, 'eCurrent/Vector 应为整体 token');
});

test('后缀不匹配不应生成矢量 token', () => {
    const data = extractSdeviceTokens('Plot {\n  ElectricField/SpecialVector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField/SpecialVector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/SpecialVector');
    assert.strictEqual(vf, undefined, 'ElectricField/SpecialVector 不应为矢量 token');
});

test('注释中的矢量关键词不应被匹配', () => {
    const data = extractSdeviceTokens('Plot {\n  # ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  # ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word.includes('ElectricField'));
    assert.strictEqual(vf, undefined, '注释中不应有 token');
});

test('字符串中的矢量关键词不应被匹配', () => {
    const data = extractSdeviceTokens('Plot {\n  "ElectricField/Vector"\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  "ElectricField/Vector"\n}', data);
    const vf = tokens.find(t => t.word.includes('ElectricField'));
    assert.strictEqual(vf, undefined, '字符串中不应有 token');
});

// --- CI (case-insensitive) functions ---

test('CI data integrity', () => {
    assert.ok(BASE_TO_SUFFIXES_LOWER.has('electricfield'), 'lowercase key should exist');
    assert.ok(BASE_TO_SUFFIXES_LOWER.has('ELECTRICFIELD'.toLowerCase()), 'ALLCAPS via toLowerCase works');
});

test('isVectorBaseCI', () => {
    assert.strictEqual(isVectorBaseCI('electricfield'), true);
    assert.strictEqual(isVectorBaseCI('ELECTRICFIELD'), true);
    assert.strictEqual(isVectorBaseCI('ElectricField'), true);
    assert.strictEqual(isVectorBaseCI('unknown'), false);
});

test('getSuffixesForBaseCI', () => {
    assert.deepStrictEqual(getSuffixesForBaseCI('electricfield'), ['/Vector']);
    assert.deepStrictEqual(getSuffixesForBaseCI('ESHEDISTRIBUTION'), ['/SpecialVector']);
    assert.strictEqual(getSuffixesForBaseCI('unknown'), undefined);
});

test('resolveBaseKeywordCI', () => {
    assert.strictEqual(resolveBaseKeywordCI('electricfield/Vector'), 'electricfield');
    assert.strictEqual(resolveBaseKeywordCI('ELECTRICFIELD/Vector'), 'ELECTRICFIELD');
    assert.strictEqual(resolveBaseKeywordCI('pe_polarization/vector'), 'pe_polarization');
    assert.strictEqual(resolveBaseKeywordCI('ElectricField'), null);
    assert.strictEqual(resolveBaseKeywordCI('ELECTRICFIELD/VECTOR'), 'ELECTRICFIELD');
    assert.strictEqual(resolveBaseKeywordCI('electricfield/VECTOR'), 'electricfield');
    assert.strictEqual(resolveBaseKeywordCI('eSHEDistribution/SPECIALVECTOR'), 'eSHEDistribution');
    assert.strictEqual(resolveBaseKeywordCI('ConductionCurrentDensity/VECTOR'), 'ConductionCurrentDensity');
});

test('VECTOR_SECTIONS_LOWER', () => {
    assert.ok(VECTOR_SECTIONS_LOWER.has('plot'));
    assert.ok(VECTOR_SECTIONS_LOWER.has('PLOT'.toLowerCase()));
    assert.ok(VECTOR_SECTIONS_LOWER.has('currentplot'));
    assert.strictEqual(VECTOR_SECTIONS_LOWER.size, 2);
});

test('CI vector token: lowercase section + keyword', () => {
    const data = extractSdeviceTokens('plot {\n  electricfield/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('plot {\n  electricfield/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'electricfield/Vector');
    assert.ok(vf, 'lowercase electricfield/Vector inside plot should be vector token');
    assert.strictEqual(vf.typeIdx, 1);
});

test('CI vector token: ALLCAPS suffix', () => {
    const data = extractSdeviceTokens('plot {\n  ELECTRICFIELD/VECTOR\n}', index, sectionKeywords);
    const tokens = decodeTokens('plot {\n  ELECTRICFIELD/VECTOR\n}', data);
    const vf = tokens.find(t => t.word === 'ELECTRICFIELD/VECTOR');
    assert.ok(vf, 'ALLCAPS ELECTRICFIELD/VECTOR should be vector token');
    assert.strictEqual(vf.typeIdx, 1);
});

summary();
