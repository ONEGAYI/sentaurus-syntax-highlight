const assert = require('assert');
const {
    BASE_TO_SUFFIXES, FULL_VECTOR_KEYWORDS, VECTOR_SECTIONS,
    isVectorBase, getSuffixesForBase, resolveBaseKeyword,
} = require('../src/lsp/providers/sdevice-vector-keywords');

// --- 数据完整性 ---

assert.strictEqual(BASE_TO_SUFFIXES.size, 62, '62 个矢量基础关键词（Table 196 + 197 + 非 Density 电流）');
assert.strictEqual(FULL_VECTOR_KEYWORDS.size, 62, '62 个完整矢量关键词');

// 每个基础词至少有一个后缀
for (const [base, suffixes] of BASE_TO_SUFFIXES) {
    assert.ok(suffixes.length >= 1, `${base} 应至少有一个后缀`);
}

// --- isVectorBase ---

assert.strictEqual(isVectorBase('ElectricField'), true);
assert.strictEqual(isVectorBase('eVelocity'), true);
assert.strictEqual(isVectorBase('eSHEDistribution'), true);
assert.strictEqual(isVectorBase('ConductionCurrentDensity'), true);
assert.strictEqual(isVectorBase('TotalCurrentDensity'), true, 'TotalCurrentDensity 应为矢量基础词');
assert.strictEqual(isVectorBase('ImeCurrentResponse'), true, 'ImeCurrentResponse 应为矢量基础词');
assert.strictEqual(isVectorBase('GradPoECImACGreenFunction'), true, 'Green 函数梯度应为矢量基础词');
assert.strictEqual(isVectorBase('OpticalField'), true, 'OpticalField 应为矢量基础词');
assert.strictEqual(isVectorBase('Polarization'), true, 'Polarization 应为矢量基础词');
assert.strictEqual(isVectorBase('Current'), true, 'Current 应为矢量基础词');
assert.strictEqual(isVectorBase('eCurrent'), true, 'eCurrent 应为矢量基础词');
assert.strictEqual(isVectorBase('ConductionCurrent'), true, 'ConductionCurrent 应为矢量基础词');
assert.strictEqual(isVectorBase('Unknown'), false);
assert.strictEqual(isVectorBase(''), false);

// --- getSuffixesForBase ---

assert.deepStrictEqual(getSuffixesForBase('ElectricField'), ['/Vector']);
assert.deepStrictEqual(getSuffixesForBase('eSHEDistribution'), ['/SpecialVector']);
assert.deepStrictEqual(getSuffixesForBase('ConductionCurrentDensity'), ['/vector']);
assert.strictEqual(getSuffixesForBase('Unknown'), undefined);

// --- resolveBaseKeyword ---

assert.strictEqual(resolveBaseKeyword('ElectricField/Vector'), 'ElectricField');
assert.strictEqual(resolveBaseKeyword('PE_Polarization/vector'), 'PE_Polarization');
assert.strictEqual(resolveBaseKeyword('eSHEDistribution/SpecialVector'), 'eSHEDistribution');
assert.strictEqual(resolveBaseKeyword('ElectricField'), null, '无斜杠返回 null');
assert.strictEqual(resolveBaseKeyword('Unknown/Vector'), null, '未知基础词返回 null');
assert.strictEqual(resolveBaseKeyword('ElectricField/vector'), null, '后缀不匹配返回 null');
assert.strictEqual(resolveBaseKeyword('TotalCurrentDensity/Vector'), 'TotalCurrentDensity');
assert.strictEqual(resolveBaseKeyword('ImeCurrentResponse/Vector'), 'ImeCurrentResponse');
assert.strictEqual(resolveBaseKeyword('OpticalField/Vector'), 'OpticalField');
assert.strictEqual(resolveBaseKeyword('Current/Vector'), 'Current');
assert.strictEqual(resolveBaseKeyword('eCurrent/Vector'), 'eCurrent');
assert.strictEqual(resolveBaseKeyword('ConductionCurrent/Vector'), 'ConductionCurrent');

// --- VECTOR_SECTIONS ---

assert.ok(VECTOR_SECTIONS.has('Plot'));
assert.ok(VECTOR_SECTIONS.has('CurrentPlot'));
assert.strictEqual(VECTOR_SECTIONS.size, 2);

// --- 语义 token 测试 ---

const docs = require('../syntaxes/sdevice_command_docs.json');
const { buildKeywordSectionIndex, extractSdeviceTokens } = require('../src/lsp/providers/sdevice-semantic-provider');
const sectionKws = require('../src/lsp/tcl-symbol-configs').getSdeviceAllSectionKeywords();
const index = buildKeywordSectionIndex(docs);
const sectionKeywords = new Set(sectionKws);

function decodeTokens(text, data) {
    const lines = text.split('\n');
    let curLine = 0, curCol = 0;
    const results = [];
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const word = lines[curLine]?.slice(curCol, curCol + len) || '';
        results.push({ word, typeIdx: data[i+3], line: curLine, col: curCol, len });
    }
    return results;
}

// Test: ElectricField/Vector 整体 token
{
    const data = extractSdeviceTokens('Plot {\n  ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/Vector');
    assert.ok(vf, 'ElectricField/Vector 应生成为整体 token');
    assert.strictEqual(vf.typeIdx, 1, '应为 sectionKeyword 类型');
    assert.strictEqual(vf.len, 20, '长度应覆盖整个 ElectricField/Vector');
}

// Test: 基础词不带后缀仍正常
{
    const data = extractSdeviceTokens('Plot {\n  ElectricField\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField\n}', data);
    const ef = tokens.find(t => t.word === 'ElectricField');
    assert.ok(ef, 'ElectricField 单独应仍正常');
    assert.strictEqual(ef.len, 13);
}

// Test: 小写 /vector
{
    const data = extractSdeviceTokens('Plot {\n  ConductionCurrentDensity/vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ConductionCurrentDensity/vector\n}', data);
    const vf = tokens.find(t => t.word === 'ConductionCurrentDensity/vector');
    assert.ok(vf, 'ConductionCurrentDensity/vector 应为整体 token');
    assert.strictEqual(vf.typeIdx, 1);
}

// Test: /SpecialVector
{
    const data = extractSdeviceTokens('Plot {\n  eSHEDistribution/SpecialVector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  eSHEDistribution/SpecialVector\n}', data);
    const vf = tokens.find(t => t.word === 'eSHEDistribution/SpecialVector');
    assert.ok(vf, 'eSHEDistribution/SpecialVector 应为整体 token');
}

// Test: 非 Plot section 不生成矢量 token
{
    const data = extractSdeviceTokens('Math {\n  ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Math {\n  ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/Vector');
    assert.strictEqual(vf, undefined, 'Math section 中不应有矢量整体 token');
}

// Test: 混合标识符 + 矢量关键词同行
{
    const data = extractSdeviceTokens('Plot {\n  ElectricField eHeatFlux/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField eHeatFlux/Vector\n}', data);
    const ef = tokens.find(t => t.word === 'ElectricField');
    const vf = tokens.find(t => t.word === 'eHeatFlux/Vector');
    assert.ok(ef, 'ElectricField 应存在');
    assert.ok(vf, 'eHeatFlux/Vector 应存在');
    assert.ok(vf.col > ef.col, '矢量 token 应在 ElectricField 之后');
}

// Test: 新增 Table 196 关键词的语义 token
{
    const data = extractSdeviceTokens('Plot {\n  TotalCurrentDensity/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  TotalCurrentDensity/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'TotalCurrentDensity/Vector');
    assert.ok(vf, 'TotalCurrentDensity/Vector 应为整体 token');
    assert.strictEqual(vf.typeIdx, 1);
}

// Test: Green 函数梯度矢量 token
{
    const data = extractSdeviceTokens('Plot {\n  GradPoECImACGreenFunction/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  GradPoECImACGreenFunction/Vector\n}', data);
    const vf = tokens.find(t => t.word === 'GradPoECImACGreenFunction/Vector');
    assert.ok(vf, 'GradPoECImACGreenFunction/Vector 应为整体 token');
}

// Test: 非 Density 电流矢量 token
{
    const data = extractSdeviceTokens('Plot {\n  Current/Vector eCurrent/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  Current/Vector eCurrent/Vector\n}', data);
    const cv = tokens.find(t => t.word === 'Current/Vector');
    const ev = tokens.find(t => t.word === 'eCurrent/Vector');
    assert.ok(cv, 'Current/Vector 应为整体 token');
    assert.ok(ev, 'eCurrent/Vector 应为整体 token');
}

// Test: 后缀不匹配不应生成矢量 token（如 ElectricField 只支持 /Vector，不支持 /SpecialVector）
{
    const data = extractSdeviceTokens('Plot {\n  ElectricField/SpecialVector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  ElectricField/SpecialVector\n}', data);
    const vf = tokens.find(t => t.word === 'ElectricField/SpecialVector');
    assert.strictEqual(vf, undefined, 'ElectricField/SpecialVector 不应为矢量 token');
}

// Test: 注释中的矢量关键词不应被匹配
{
    const data = extractSdeviceTokens('Plot {\n  # ElectricField/Vector\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  # ElectricField/Vector\n}', data);
    const vf = tokens.find(t => t.word.includes('ElectricField'));
    assert.strictEqual(vf, undefined, '注释中不应有 token');
}

// Test: 字符串中的矢量关键词不应被匹配
{
    const data = extractSdeviceTokens('Plot {\n  "ElectricField/Vector"\n}', index, sectionKeywords);
    const tokens = decodeTokens('Plot {\n  "ElectricField/Vector"\n}', data);
    const vf = tokens.find(t => t.word.includes('ElectricField'));
    assert.strictEqual(vf, undefined, '字符串中不应有 token');
}

console.log('All sdevice-vector-keywords tests passed!');
