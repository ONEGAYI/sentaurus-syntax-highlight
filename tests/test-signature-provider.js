// tests/test-signature-provider.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { analyze } = require('../src/lsp/scheme-analyzer');
const scopeAnalyzer = require('../src/lsp/scope-analyzer');
const sigProvider = require('../src/lsp/providers/signature-provider');

/**
 * 为测试创建一个轻量 mock cache，模拟 SchemeParseCache.get(document) 的行为。
 * 每次调用都会重新解析文本（测试不需要缓存）。
 */
function createMockCache() {
    return {
        get(doc) {
            const text = typeof doc === 'string' ? doc : doc.getText();
            const { ast, errors } = parse(text);
            const { foldingRanges } = analyze(ast);
            const scopeTree = scopeAnalyzer.buildScopeTree(ast);

            // 计算行首偏移表
            const lineStarts = [0];
            for (let i = 0; i < text.length; i++) {
                if (text[i] === '\n') lineStarts.push(i + 1);
            }

            return { version: 1, ast, errors, analysis: { foldingRanges }, scopeTree, text, lineStarts };
        },
    };
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nbuildSignatureLabel:');

test('简单模式签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxGradient', 'value'],
    });
    assert.strictEqual(label, '(sdedr:define-refinement-function definition-name function-name MaxGradient value)');
});

test('带可选参数的签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxLenInt', 'mat-reg-1', 'mat-reg-2', 'value'],
        optionals: [
            { name: 'factor', type: 'number' },
            { name: 'DoubleSide', type: 'flag' },
            { name: 'UseRegionNames', type: 'flag' },
        ],
    });
    assert.ok(label.includes('[factor]'));
    assert.ok(label.includes('["DoubleSide"]'));
    assert.ok(label.includes('["UseRegionNames"]'));
});

test('带标签可选参数的签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxInterval', 'Variable', 'dopant-name', 'Cmin', 'cmin', 'Cmax', 'cmax'],
        optionals: [
            { name: 'Scaling', tag: 'Scaling', type: 'number', param: 'scaling' },
        ],
    });
    assert.ok(label.includes('["Scaling" scaling]'));
});

console.log('\nbuildParams:');

test('从 modeData + funcDoc 构建参数列表', () => {
    const modeData = {
        params: ['definition-name', 'function-name', 'MaxGradient', 'value'],
    };
    const funcDoc = {
        parameters: [
            { name: 'definition-name', desc: 'Name of the refinement definition' },
            { name: 'value', desc: 'Gradient threshold value' },
        ],
    };
    const params = sigProvider.buildParams(modeData, funcDoc);
    assert.strictEqual(params.length, 4);
    assert.strictEqual(params[0].label, 'definition-name');
    assert.ok(params[0].documentation.includes('Name of the refinement'));
    assert.strictEqual(params[3].label, 'value');
});

test('无 funcDoc 时参数列表无文档', () => {
    const modeData = { params: ['a', 'b'] };
    const params = sigProvider.buildParams(modeData, null);
    assert.strictEqual(params.length, 2);
    assert.strictEqual(params[0].documentation, '');
});

console.log('\nprovideSignatureHelp (mock document):');

const mockCache = createMockCache();

test('模式分派函数返回正确签名', () => {
    const doc = {
        getText: () => '(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)',
    };
    const pos = { line: 0, character: 48 };
    const table = {
        'sdedr:define-refinement-function': {
            argIndex: 1,
            modes: {
                MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            },
        },
    };
    const funcDocs = {
        'sdedr:define-refinement-function': {
            description: 'Defines a refinement function.',
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, table, funcDocs, mockCache);
    assert.ok(result);
    assert.strictEqual(result.activeSignature, 0);
    assert.strictEqual(result.signatures[0].parameters.length, 4);
});

test('非模式分派函数返回基本签名', () => {
    const doc = {
        getText: () => '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")',
    };
    const pos = { line: 0, character: 10 };
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center-pos radius region-material region-name)',
            parameters: [
                { name: 'center-pos', desc: 'Center position' },
                { name: 'radius', desc: 'Radius' },
                { name: 'region-material', desc: 'Material name' },
                { name: 'region-name', desc: 'Region name' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache);
    assert.ok(result);
    assert.ok(result.signatures[0].label.includes('sdegeo:create-circle'));
});

test('光标不在函数调用上返回 null', () => {
    const doc = { getText: () => '(define x 42)\n' };
    const pos = { line: 0, character: 3 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache);
    assert.strictEqual(result, null);
});

test('自动补全右括号：括号内无参数时仍返回签名', () => {
    const doc = { getText: () => '(sdegeo )' };
    const pos = { line: 0, character: 8 };
    const funcDocs = {
        'sdegeo': {
            signature: '(sdegeo command arg ...)',
            parameters: [
                { name: 'command', desc: 'SDE command' },
                { name: 'arg', desc: 'Arguments' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache);
    assert.ok(result);
    assert.strictEqual(result.activeParameter, 0);
    assert.ok(result.signatures[0].label.includes('sdegeo'));
});

// === 注释在函数名前导致 children 偏移的 bug 修复测试 ===
console.log('\n注释偏移 bug 修复:');

test('注释在函数名前：应选择内层函数而非外层 define', () => {
    const doc = {
        getText: () => '(define BodyID_LOCOS_1 ( ; LOCOS 薄的部分\n    sdegeo:create-rectangle\n        (position 0 0 0) (position Wleft Tox_locos 0) "Oxide" "R.LOCOS_thin"))',
    };
    // 光标在 "R.LOCOS_thin" 之后，仍在内层 create-rectangle 调用中
    const pos = { line: 2, character: 70 };
    const funcDocs = {
        'sdegeo:create-rectangle': {
            signature: '(sdegeo:create-rectangle point1 point2 region-material region-name)',
            parameters: [
                { name: 'point1', desc: 'First corner' },
                { name: 'point2', desc: 'Second corner' },
                { name: 'region-material', desc: 'Material name' },
                { name: 'region-name', desc: 'Region name' },
            ],
        },
        'define': {
            signature: '(define name value)',
            parameters: [
                { name: 'name', desc: 'Variable name' },
                { name: 'value', desc: 'Value expression' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache);
    assert.ok(result, '应返回签名结果');
    assert.ok(result.signatures[0].label.includes('sdegeo:create-rectangle'),
        `期望 create-rectangle 但得到: ${result.signatures[0].label}`);
});

test('多个注释在函数名前：仍应正确选择内层函数', () => {
    const doc = {
        getText: () => '(define x ( ; comment1\n ; comment2\n  sdegeo:create-circle (position 0 0 0) 5 "Si" "R"))',
    };
    // 光标在 "R" 字符串之后
    const pos = { line: 2, character: 50 };
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center radius material region)',
            parameters: [
                { name: 'center', desc: 'Center position' },
                { name: 'radius', desc: 'Radius' },
                { name: 'material', desc: 'Material' },
                { name: 'region', desc: 'Region name' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache);
    assert.ok(result, '应返回签名结果');
    assert.ok(result.signatures[0].label.includes('sdegeo:create-circle'),
        `期望 create-circle 但得到: ${result.signatures[0].label}`);
});

test('无注释情况不受影响：正常函数调用', () => {
    const doc = {
        getText: () => '(sdegeo:create-circle (position 0 0 0) 5 "Si" "R")',
    };
    const pos = { line: 0, character: 10 };
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center radius material region)',
            parameters: [
                { name: 'center', desc: 'Center position' },
                { name: 'radius', desc: 'Radius' },
                { name: 'material', desc: 'Material' },
                { name: 'region', desc: 'Region name' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache);
    assert.ok(result);
    assert.ok(result.signatures[0].label.includes('sdegeo:create-circle'));
});

console.log('\n用户定义函数签名 fallback:');

test('用户函数签名 — define+lambda', () => {
    const doc = {
        getText: () => '(define create_trapezoid (lambda (x0 y0 z0 w h) body))\n(create_trapezoid 1 2 3)',
        uri: { toString: () => 'test.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 1, character: 20 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.ok(result, '应返回签名结果');
    assert.strictEqual(result.signatures[0].label, '(create_trapezoid x0 y0 z0 w h)');
    assert.strictEqual(result.signatures[0].parameters.length, 5);
    assert.strictEqual(result.signatures[0].parameters[0].label, 'x0');
});

test('用户函数签名 — activeParameter 正确', () => {
    const doc = {
        getText: () => '(define f (lambda (a b c) body))\n(f 1 2 )',
        uri: { toString: () => 'test2.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 1, character: 6 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.ok(result);
    assert.strictEqual(result.activeParameter, 1);
});

test('内置函数优先于用户定义函数', () => {
    const doc = {
        getText: () => '(sdegeo:create-circle (position 0 0 0) 5 "Si" "R")',
        uri: { toString: () => 'test3.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center radius material region)',
            parameters: [
                { name: 'center', desc: 'Center' },
                { name: 'radius', desc: 'Radius' },
                { name: 'material', desc: 'Material' },
                { name: 'region', desc: 'Region' },
            ],
        },
    };
    const pos = { line: 0, character: 10 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache, defs);
    assert.ok(result);
    assert.ok(result.signatures[0].documentation !== '用户定义函数');
});

test('非函数调用返回 null', () => {
    const doc = {
        getText: () => '(define x 42)\n',
        uri: { toString: () => 'test4.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 0, character: 3 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.strictEqual(result, null);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
