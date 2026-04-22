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

// --- 用户自定义函数符号提取 ---
console.log('\n用户自定义函数:');

test('用户函数包装 SDE 函数：提取 region 和 material 定义', () => {
    const code = `
(define make-box (lambda (x0 y0 z0 w h l mat rname)
    (sdegeo:create-cuboid (position x0 y0 z0) (position w h l) mat rname)))
(make-box 0 0 0 1 1 1 "Silicon" "R.Box")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
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
    assert.strictEqual(defs[1].name, 'R.Box');
    assert.strictEqual(defs[1].type, 'region');
    assert.strictEqual(defs[1].functionName, 'make-box');
    assert.strictEqual(refs.length, 0);
});

test('用户函数多次调用：每次独立提取', () => {
    const code = `
(define make-box (lambda (mat rname)
    (sdegeo:create-cuboid (position 0 0 0) (position 1 1 1) mat rname)))
(make-box "Silicon" "R.Src")
(make-box "Oxide" "R.Ox")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 4);
    // 映射按 symbolParams 顺序：material(index 0) 先于 region(index 1)
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[1].name, 'R.Src');
    assert.strictEqual(defs[2].name, 'Oxide');
    assert.strictEqual(defs[3].name, 'R.Ox');
});

test('用户函数体内不含 SDE 调用：不生成映射', () => {
    const code = `
(define my-func (lambda (x y) (+ x y)))
(my-func 1 2)
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 0);
});

test('用户函数体内 let* 绑定不影响参数追踪', () => {
    const code = `
(define make-poly (lambda (mat rname)
    (let* (
        (pts (list (position 0 0 0) (position 1 0 0)))
        (body (sdegeo:create-polygon pts mat rname))
    )
        body)))
(make-poly "Silicon" "R.Poly")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-polygon': {
            symbolParams: [
                { index: 1, role: 'def', type: 'material' },
                { index: 2, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[0].type, 'material');
    assert.strictEqual(defs[1].name, 'R.Poly');
    assert.strictEqual(defs[1].type, 'region');
});

test('用户函数调用点传变量而非字符串：跳过', () => {
    const code = `
(define make-box (lambda (mat rname)
    (sdegeo:create-cuboid (position 0 0 0) (position 1 1 1) mat rname)))
(define my-mat "Silicon")
(make-box my-mat "R.Var")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    // 只有 region 被提取，material 因 my-mat 是 Identifier 而跳过
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'R.Var');
    assert.strictEqual(defs[0].type, 'region');
});

test('内置函数和用户函数混合使用', () => {
    const code = `
(define make-box (lambda (mat rname)
    (sdegeo:create-cuboid (position 0 0 0) (position 1 1 1) mat rname)))
(make-box "Silicon" "R.Wrapper")
(sdegeo:create-cuboid (position 0 0 0) (position 2 2 2) "Oxide" "R.Direct")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    // 用户函数调用: Silicon(def), R.Wrapper(def)
    // 内置函数调用: Oxide(def), R.Direct(def)
    assert.strictEqual(defs.length, 4);
    const names = defs.map(d => d.name);
    assert.ok(names.includes('Silicon'));
    assert.ok(names.includes('R.Wrapper'));
    assert.ok(names.includes('Oxide'));
    assert.ok(names.includes('R.Direct'));
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
