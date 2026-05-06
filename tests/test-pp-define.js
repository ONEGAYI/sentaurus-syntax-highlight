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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
