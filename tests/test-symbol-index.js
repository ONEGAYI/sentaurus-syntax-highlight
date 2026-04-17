// tests/test-symbol-index.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols, resolveSymbolName } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// --- resolveSymbolName ---
console.log('\nresolveSymbolName:');

test('String 节点直接返回 value', () => {
    const { ast } = parse('(foo "R.Si")');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 全字面量拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si"))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 多段拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si" ".Sub"))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si.Sub');
});

test('string-append 含变量返回 null', () => {
    const { ast } = parse('(foo (string-append "R." name))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, null);
});

test('string-append 空参数返回空字符串', () => {
    const { ast } = parse('(foo (string-append))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, '');
});

test('Identifier 节点返回 null', () => {
    const { ast } = parse('(foo bar)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

test('Number 节点返回 null', () => {
    const { ast } = parse('(foo 42)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

// --- extractSymbols ---
console.log('\nextractSymbols:');

test('提取 create-rectangle 的 region 和 material 定义', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[0].type, 'material');
    assert.strictEqual(defs[0].role, 'def');
    assert.strictEqual(defs[1].name, 'R.Si');
    assert.strictEqual(defs[1].type, 'region');
    assert.strictEqual(refs.length, 0);
});

test('提取引用和定义共存', () => {
    const code = '(sdedr:define-refinement-region "Place" "Def" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdedr:define-refinement-region': {
            symbolParams: [
                { index: 2, role: 'ref', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[0].type, 'region');
    assert.strictEqual(refs[0].role, 'ref');
});

test('未配置 symbolParams 的函数不提取', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {};
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 0);
});

test('参数节点为非字符串时跳过', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) some-var some-region)';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
});

test('string-append 定义被正确提取', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" (string-append "R." "Si"))';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[1].name, 'R.Si');
    assert.strictEqual(defs[1].type, 'region');
});

test('多行代码中提取多个符号', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Sub")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Oxide" "R.Ox")
(sdegeo:define-contact-set "Source" 4.0 "Blue" "solid")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
        'sdegeo:define-contact-set': {
            symbolParams: [
                { index: 0, role: 'def', type: 'contact' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 5); // 2 material + 2 region + 1 contact
});

test('提取结果包含位置信息', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].line, 1);
    assert.ok(defs[0].start > 0);
    assert.ok(defs[0].end > defs[0].start);
    assert.strictEqual(defs[0].functionName, 'sdegeo:create-rectangle');
});

test('modeDispatch 函数：offset-interface region 模式', () => {
    const code = '(sdedr:offset-interface "region" "R.Si" "R.Ox")';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-interface': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'region' },
                { index: 1, role: 'ref', type: 'region' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-interface': {
            argIndex: 0,
            modes: {
                region: { params: ['region1', 'region2'] },
                material: { params: ['material1', 'material2'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[1].name, 'R.Ox');
});

test('modeDispatch 函数：offset-interface material 模式', () => {
    const code = '(sdedr:offset-interface "material" "Silicon" "Oxide")';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-interface': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'material' },
                { index: 1, role: 'ref', type: 'material' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-interface': {
            argIndex: 0,
            modes: {
                region: { params: ['region1', 'region2'] },
                material: { params: ['material1', 'material2'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'Silicon');
    assert.strictEqual(refs[0].type, 'material');
});

// --- type: auto ---
console.log('\ntype auto:');

test('type auto: offset-block region 模式解析为 region 类型', () => {
    const code = '(sdedr:offset-block "region" "R.Si" "maxlevel" 0.5)';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-block': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'auto' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-block': {
            argIndex: 0,
            modes: {
                region: { params: ['region'] },
                material: { params: ['material'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[0].type, 'region');
});

test('type auto: offset-block material 模式解析为 material 类型', () => {
    const code = '(sdedr:offset-block "material" "Silicon" "maxlevel" 0.5)';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-block': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'auto' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-block': {
            argIndex: 0,
            modes: {
                region: { params: ['region'] },
                material: { params: ['material'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'Silicon');
    assert.strictEqual(refs[0].type, 'material');
});

test('type auto: offset-interface 多参数 auto', () => {
    const code = '(sdedr:offset-interface "material" "Si" "Ox")';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-interface': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'auto' },
                { index: 1, role: 'ref', type: 'auto' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-interface': {
            argIndex: 0,
            modes: {
                region: { params: ['r1', 'r2'] },
                material: { params: ['m1', 'm2'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].type, 'material');
    assert.strictEqual(refs[1].type, 'material');
    assert.strictEqual(refs[0].name, 'Si');
    assert.strictEqual(refs[1].name, 'Ox');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
