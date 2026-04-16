// tests/test-semantic-dispatcher.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const dispatcher = require('../src/lsp/semantic-dispatcher');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

function parseCode(code) {
    const { ast } = parse(code);
    const lineStarts = computeLineStarts(code);
    return { ast, lineStarts };
}

function parseAndFind(code, line, column) {
    const { ast, lineStarts } = parseCode(code);
    return dispatcher.findEnclosingCall(ast, line, column, lineStarts);
}

console.log('\nfindEnclosingCall:');

test('单行函数调用', () => {
    const call = parseAndFind('(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")', 1, 5);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdegeo:create-circle');
});

test('光标在参数上返回外层调用', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const call = parseAndFind(code, 1, 40);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdegeo:create-circle');
});

test('光标在嵌套表达式内返回最内层调用', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const call = parseAndFind(code, 1, 27);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'position');
});

test('光标不在任何调用上返回 null', () => {
    const code = '(define x 42)\n(display x)';
    const call = parseAndFind(code, 3, 1);
    assert.strictEqual(call, null);
});

test('跨行函数调用', () => {
    const code = '(sdedr:define-refinement-function\n  "ref"\n  "MaxGradient"\n  0.1)';
    const call = parseAndFind(code, 3, 5);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdedr:define-refinement-function');
});

test('多行嵌套返回最内层', () => {
    const code = '(define (f x)\n  (let ((y 1))\n    (+ x y)))';
    const call = parseAndFind(code, 3, 5);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, '+');
});

console.log('\nresolveMode:');

test('从字符串参数识别模式', () => {
    const { ast, lineStarts } = parseCode('(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)');
    const call = dispatcher.findEnclosingCall(ast, 1, 5, lineStarts);
    const modeDispatch = {
        argIndex: 1,
        modes: {
            MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            MaxLenInt: { params: ['definition-name', 'function-name', 'MaxLenInt', 'mat-reg-1', 'mat-reg-2', 'value'] },
        },
    };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, 'MaxGradient');
});

test('未写入模式参数时返回 null', () => {
    const { ast, lineStarts } = parseCode('(sdedr:define-refinement-function "ref1")');
    const call = dispatcher.findEnclosingCall(ast, 1, 5, lineStarts);
    const modeDispatch = { argIndex: 2, modes: { MaxGradient: { params: [] } } };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, null);
});

test('无效模式名返回 null', () => {
    const { ast, lineStarts } = parseCode('(sdedr:define-refinement-function "ref1" "UnknownMode" 0.1)');
    const call = dispatcher.findEnclosingCall(ast, 1, 5, lineStarts);
    const modeDispatch = { argIndex: 2, modes: { MaxGradient: { params: [] } } };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, null);
});

console.log('\nresolveActiveParam:');

test('单行调用：光标在第 1 个参数', () => {
    const { ast, lineStarts } = parseCode('(foo 1 2 3)');
    const call = dispatcher.findEnclosingCall(ast, 1, 6, lineStarts);
    const param = dispatcher.resolveActiveParam(call, 1, 6, lineStarts);
    assert.strictEqual(param, 0);
});

test('单行调用：光标在第 3 个参数', () => {
    const { ast, lineStarts } = parseCode('(foo 1 2 3)');
    const call = dispatcher.findEnclosingCall(ast, 1, 10, lineStarts);
    const param = dispatcher.resolveActiveParam(call, 1, 10, lineStarts);
    assert.strictEqual(param, 2);
});

test('跨行调用：光标在第 2 行对应参数索引', () => {
    const code = '(foo "arg1"\n  "arg2"\n  "arg3")';
    const { ast, lineStarts } = parseCode(code);
    const call = dispatcher.findEnclosingCall(ast, 2, 5, lineStarts);
    const param = dispatcher.resolveActiveParam(call, 2, 5, lineStarts);
    assert.strictEqual(param, 1);
});

test('闭合括号内无参数时 activeParam 为 0（自动补全右括号场景）', () => {
    const { ast, lineStarts } = parseCode('(sdegeo )');
    const call = dispatcher.findEnclosingCall(ast, 1, 8, lineStarts);
    assert.ok(call);
    const param = dispatcher.resolveActiveParam(call, 1, 8, lineStarts);
    assert.strictEqual(param, 0);
});

test('未闭合括号内无参数时 activeParam 为 0', () => {
    const { ast, lineStarts } = parseCode('(sdegeo ');
    const call = dispatcher.findEnclosingCall(ast, 1, 8, lineStarts);
    assert.ok(call);
    const param = dispatcher.resolveActiveParam(call, 1, 8, lineStarts);
    assert.strictEqual(param, 0);
});

console.log('\ndispatch (integration):');

test('完整分派：识别模式和参数位置', () => {
    const code = '(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)';
    const { ast } = parseCode(code);
    const table = {
        'sdedr:define-refinement-function': {
            argIndex: 1,
            modes: {
                MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            },
        },
    };
    const result = dispatcher.dispatch(ast, 1, 45, table);
    assert.ok(result);
    assert.strictEqual(result.functionName, 'sdedr:define-refinement-function');
    assert.strictEqual(result.mode, 'MaxGradient');
    assert.strictEqual(result.activeParam, 1);
});

test('非模式分派函数返回 mode=null', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const { ast } = parseCode(code);
    const result = dispatcher.dispatch(ast, 1, 5, {});
    assert.ok(result);
    assert.strictEqual(result.functionName, 'sdegeo:create-circle');
    assert.strictEqual(result.mode, null);
    assert.strictEqual(result.activeParam, 0);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
