const assert = require('assert');
const { shouldTrigger } = require('../src/lsp/providers/unit-auto-close-logic');

// --- shouldTrigger 判定函数测试 ---

// 基本场景：变更文本必须是单个 '<'
assert.strictEqual(shouldTrigger({ text: '<<', rangeLength: 0 }, []), false,
    '非单字符不触发');
assert.strictEqual(shouldTrigger({ text: 'x', rangeLength: 0 }, []), false,
    '非 < 字符不触发');
assert.strictEqual(shouldTrigger(null, []), false,
    'null change 不触发');
assert.strictEqual(shouldTrigger(undefined, []), false,
    'undefined change 不触发');

// scope 判定：scopes 数组中必须包含 'constant.numeric'
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'constant.numeric']), true,
    'constant.numeric scope 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'keyword.other']), false,
    '非 constant.numeric scope 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'constant.numeric.other']), true,
    'scope 前缀匹配 constant.numeric 也应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, []), false,
    '空 scopes 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, null), false,
    'null scopes 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, undefined), false,
    'undefined scopes 不触发');

console.log('All unit-auto-close tests passed!');
