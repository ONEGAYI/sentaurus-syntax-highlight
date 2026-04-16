const assert = require('assert');
const { shouldTrigger } = require('../src/lsp/providers/unit-auto-close-logic');

// --- shouldTrigger 判定函数测试 ---

// 基本场景：变更文本必须是单个 '<'
assert.strictEqual(shouldTrigger({ text: '<<', rangeLength: 0 }, '5'), false,
    '非单字符 < 不触发');
assert.strictEqual(shouldTrigger({ text: 'x', rangeLength: 0 }, '5'), false,
    '非 < 字符不触发');
assert.strictEqual(shouldTrigger(null, '5'), false,
    'null change 不触发');
assert.strictEqual(shouldTrigger(undefined, '5'), false,
    'undefined change 不触发');

// 前一字符判定：必须是数字 [0-9]
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '5'), true,
    '前一字符为数字应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '0'), true,
    '前一字符为 0 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '9'), true,
    '前一字符为 9 应触发');

// 非数字不触发
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ' '), false,
    '前一字符为空格不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '@'), false,
    '前一字符为 @ 不触发（SWB 参数）');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'a'), false,
    '前一字符为字母不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, null), false,
    'null prevChar 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, undefined), false,
    'undefined prevChar 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ''), false,
    '空字符串不触发');

console.log('All unit-auto-close tests passed!');
