// tests/test-pp-define.js
'use strict';

const assert = require('assert');
const { extractPpDefines, extractPpUndefs } = require('../src/lsp/pp-utils');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nextractPpDefines:');

test('#define NAME VALUE 正确提取', () => {
    const text = '#define THICKNESS 0.1\nset x 1\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'THICKNESS');
    assert.strictEqual(defs[0].value, '0.1');
    assert.strictEqual(defs[0].line, 1);
    assert.strictEqual(defs[0].endLine, 1);
    assert.strictEqual(defs[0].definitionText, '#define THICKNESS 0.1');
    assert.strictEqual(defs[0].kind, 'ppDefine');
});

test('#define FLAG（无值）', () => {
    const text = '#define NMOS\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'NMOS');
    assert.strictEqual(defs[0].value, '');
});

test('#define 含空格的 VALUE', () => {
    const text = '#define EQN a + b * c\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].value, 'a + b * c');
});

test('#define 含引号的 VALUE', () => {
    const text = '#define MODEL "Boltzmann"\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs[0].value, '"Boltzmann"');
});

test('多个 #define 按顺序提取', () => {
    const text = '#define A 1\n#define B 2\n#define C 3\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'A');
    assert.strictEqual(defs[1].name, 'B');
    assert.strictEqual(defs[2].name, 'C');
});

test('同名多次定义保留所有位置', () => {
    const text = '#define X 1\nset y 2\n#define X 3\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].line, 1);
    assert.strictEqual(defs[1].line, 3);
});

test('非 #define 行不提取', () => {
    const text = 'set x 1\n# comment\n#if NMOS\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 0);
});

test('#define 前导空格被容许', () => {
    const text = '  #define INDENTED 42\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'INDENTED');
});

console.log('\nextractPpUndefs:');

test('#undef NAME 正确提取', () => {
    const text = '#define A 1\nset x 1\n#undef A\n';
    const undefs = extractPpUndefs(text);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'A');
    assert.strictEqual(undefs[0].line, 3);
});

test('无 #undef 返回空数组', () => {
    const text = '#define A 1\nset x 1\n';
    const undefs = extractPpUndefs(text);
    assert.strictEqual(undefs.length, 0);
});

const { findPpDefineRefs } = require('../src/lsp/pp-utils');

console.log('\nfindPpDefineRefs:');

test('#ifdef NAME 被识别为引用', () => {
    const text = '#define FLAG\n#ifdef FLAG\nset x 1\n#endif\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const ifdefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(ifdefRefs.length, 1);
    assert.strictEqual(ifdefRefs[0].name, 'FLAG');
    assert.strictEqual(ifdefRefs[0].refType, 'ifdef');
});

test('#ifndef NAME 被识别为引用', () => {
    const text = '#define FLAG\n#ifndef FLAG\nset x 1\n#endif\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const ifndefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(ifndefRefs.length, 1);
    assert.strictEqual(ifndefRefs[0].refType, 'ifndef');
});

test('#undef NAME 被识别为引用', () => {
    const text = '#define A 1\n#undef A\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const undefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(undefRefs.length, 1);
    assert.strictEqual(undefRefs[0].refType, 'undef');
});

test('普通代码行裸词被识别为引用', () => {
    const text = '#define THICKNESS 0.1\nset x THICKNESS\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const codeRefs = refs.filter(r => r.line === 2 && r.refType === 'usage');
    assert.strictEqual(codeRefs.length, 1);
    assert.strictEqual(codeRefs[0].name, 'THICKNESS');
    assert.ok(codeRefs[0].startCol >= 0);
});

test('$NAME 不被识别为 #define 引用', () => {
    const text = '#define VAR 1\nputs $VAR\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});

test('字符串内的 NAME 不被识别为引用', () => {
    const text = '#define NAME 1\nputs "NAME is here"\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});

test('定义行之前的同名标识符不被识别', () => {
    const text = 'set x THICKNESS\n#define THICKNESS 0.1\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    assert.strictEqual(refs.length, 0);
});

test('#undef 之后裸词不被识别（存活区间）', () => {
    const text = '#define A 1\nset x A\n#undef A\nset y A\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const line2Refs = refs.filter(r => r.line === 2);
    const line4Refs = refs.filter(r => r.line === 4);
    assert.strictEqual(line2Refs.length, 1);
    assert.strictEqual(line4Refs.length, 0);
});

test('#define 行的 NAME 定义位置不作为引用', () => {
    const text = '#define FLAG\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    assert.strictEqual(refs.length, 0);
});

test('注释行中的 NAME 不被识别为引用', () => {
    const text = '#define FLAG\n# FLAG is important\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});

console.log('\nProvider 集成:');

const definitions = require('../src/definitions');

test('extractTclDefinitionsAst 合并 #define 定义', () => {
    const text = '#define THICKNESS 0.1\nset x 1\n';
    const defs = definitions.extractTclDefinitionsAst(text);
    const ppDefs = defs.filter(d => d.kind === 'ppDefine');
    assert.strictEqual(ppDefs.length, 1);
    assert.strictEqual(ppDefs[0].name, 'THICKNESS');
    // WASM 可用时还应包含 set x 的 Tcl 变量；不可用时只有 ppDefine
    const tclDefs = defs.filter(d => d.kind !== 'ppDefine');
    assert.ok(tclDefs.length === 0 || tclDefs.length === 1, `expected 0 or 1 tcl defs, got ${tclDefs.length}`);
});

test('WASM 不可用时仍返回 #define 定义', () => {
    const text = '#define FLAG\n';
    const defs = definitions.extractTclDefinitionsAst(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].kind, 'ppDefine');
});

console.log('\nbuildPpDefineTokens:');

const { buildPpDefineTokens } = require('../src/lsp/pp-utils');

test('buildPpDefineTokens 返回正确的 delta 编码', () => {
    const text = '#define THICKNESS 0.1\nset x THICKNESS\n';
    const data = buildPpDefineTokens(text);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    // 每个 token 5 个值: [deltaLine, deltaCol, len, type, modifier]
    assert.strictEqual(data.length % 5, 0);
});

test('buildPpDefineTokens 无 #define 时返回空数组', () => {
    const text = 'set x 1\nputs $x\n';
    const data = buildPpDefineTokens(text);
    assert.strictEqual(data.length, 0);
});

test('buildPpDefineTokens 定义位置带 declaration modifier', () => {
    const text = '#define FLAG\n#ifdef FLAG\nset x 1\n#endif\n';
    const data = buildPpDefineTokens(text);
    // 第一个 token 应该是定义位置 (modifier=1)
    // [deltaLine=0, deltaCol, len, type=0, modifier=1]
    assert.strictEqual(data[4], 1); // declaration modifier
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
