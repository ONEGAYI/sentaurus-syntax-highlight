// tests/test-signature-provider.js
'use strict';

const assert = require('assert');
const sigProvider = require('../src/lsp/providers/signature-provider');

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
    assert.ok(label.includes('[DoubleSide]'));
    assert.ok(label.includes('[UseRegionNames]'));
});

test('带标签可选参数的签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxInterval', 'Variable', 'dopant-name', 'Cmin', 'cmin', 'Cmax', 'cmax'],
        optionals: [
            { name: 'Scaling', tag: 'Scaling', type: 'number', param: 'scaling' },
        ],
    });
    assert.ok(label.includes('[Scaling scaling]'));
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
    const result = sigProvider.provideSignatureHelp(doc, pos, null, table, funcDocs);
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
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs);
    assert.ok(result);
    assert.ok(result.signatures[0].label.includes('sdegeo:create-circle'));
});

test('光标不在函数调用上返回 null', () => {
    const doc = { getText: () => '(define x 42)\n' };
    const pos = { line: 0, character: 3 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {});
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
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs);
    assert.ok(result);
    assert.strictEqual(result.activeParameter, 0);
    assert.ok(result.signatures[0].label.includes('sdegeo'));
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
