// tests/test-unit-auto-close.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { shouldTrigger, shouldDelete } = require('../src/lsp/providers/unit-auto-close-logic');

// --- shouldTrigger 判定函数测试 ---

test('shouldTrigger: 基本排除场景', () => {
    assert.strictEqual(shouldTrigger({ text: '<<', rangeLength: 0 }, 'spacing= 10'), false, '非单字符 < 不触发');
    assert.strictEqual(shouldTrigger({ text: 'x', rangeLength: 0 }, 'spacing= 10'), false, '非 < 字符不触发');
    assert.strictEqual(shouldTrigger(null, 'spacing= 10'), false, 'null change 不触发');
    assert.strictEqual(shouldTrigger(undefined, 'spacing= 10'), false, 'undefined change 不触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, null), false, 'null linePrefix 不触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ''), false, '空 linePrefix 不触发');
});

test('shouldTrigger: 典型 Unit 语法应触发', () => {
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'spacing= 10'), true, '整数 10 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'location= 0.5'), true, '小数 0.5 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'dose= 1e15'), true, '科学计数法 1e15 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'temperature= 900'), true, '整数 900 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'tilt= 7'), true, '整数 7 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'time= 40'), true, '整数 40 应触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'concentration= 0'), true, '整数 0 应触发');
});

test('shouldTrigger: SWB 参数不触发', () => {
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'energy= @imp_energy@'), false);
});

test('shouldTrigger: 变量名后不触发', () => {
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'set Var1'), false, 'Var1< 不触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'set x2'), false, 'x2< 不触发');
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'foo bar123'), false, 'bar123< 不触发');
});

test('shouldTrigger: Tcl 比较运算符不触发', () => {
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'if {$x '), false);
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'expr {$a'), false);
});

test('shouldTrigger: 字符串内不触发', () => {
    assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '"text'), false);
});

// --- shouldDelete 判定函数测试 ---

test('shouldDelete: 参数校验', () => {
    assert.strictEqual(shouldDelete(null, '10', '>'), false, 'null change 不触发删除');
    assert.strictEqual(shouldDelete(undefined, '10', '>'), false, 'undefined change 不触发删除');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, null, '>'), false, 'null linePrefix 不触发删除');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', '>'), false, '空 linePrefix 不触发删除');
});

test('shouldDelete: 操作类型校验', () => {
    assert.strictEqual(shouldDelete({ text: '<', rangeLength: 0 }, '10', '>'), false, '插入操作不触发删除');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 2 }, '10', '>'), false, '删除多字符不触发删除');
    assert.strictEqual(shouldDelete({ text: 'x', rangeLength: 1 }, '10', '>'), false, '替换操作不触发删除');
});

test('shouldDelete: 光标后必须为 >', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '10', 'x'), false, '光标后非 > 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '10', ''), false, '光标后无字符不触发');
});

test('shouldDelete: 数字后空 <> 应触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'spacing= 10', '>'), true, '整数 10');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'location= 0.5', '>'), true, '小数 0.5');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'dose= 1e15', '>'), true, '科学计数法 1e15');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'temperature= 900', '>'), true, '整数 900');
});

test('shouldDelete: 变量名后不触发删除', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set Var1', '>'), false, 'Var1 后不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x2', '>'), false, 'x2 后不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'foo bar123', '>'), false, 'bar123 后不触发');
});

test('shouldDelete: 字符串/Tcl 语法不触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"text', '>'), false, '字符串内');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'if {$x ', '>'), false, 'Tcl 比较');
});

summary();
