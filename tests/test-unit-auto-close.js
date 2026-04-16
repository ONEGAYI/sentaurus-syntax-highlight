const assert = require('assert');
const { shouldTrigger } = require('../src/lsp/providers/unit-auto-close-logic');

// --- shouldTrigger 判定函数测试 ---

// 基本场景：变更文本必须是单个 '<'
assert.strictEqual(shouldTrigger({ text: '<<', rangeLength: 0 }, 'spacing= 10'), false,
    '非单字符 < 不触发');
assert.strictEqual(shouldTrigger({ text: 'x', rangeLength: 0 }, 'spacing= 10'), false,
    '非 < 字符不触发');
assert.strictEqual(shouldTrigger(null, 'spacing= 10'), false,
    'null change 不触发');
assert.strictEqual(shouldTrigger(undefined, 'spacing= 10'), false,
    'undefined change 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, null), false,
    'null linePrefix 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ''), false,
    '空 linePrefix 不触发');

// 典型 Unit 语法场景（应触发）
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'spacing= 10'), true,
    '整数 10 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'location= 0.5'), true,
    '小数 0.5 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'dose= 1e15'), true,
    '科学计数法 1e15 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'temperature= 900'), true,
    '整数 900 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'energy= @imp_energy@'), false,
    'SWB 参数 @imp_energy@ 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'tilt= 7'), true,
    '整数 7 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'time= 40'), true,
    '整数 40 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'concentration= 0'), true,
    '整数 0 应触发');

// 边界情况：变量名后不触发（核心修复）
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'set Var1'), false,
    'Var1< 不触发（1 是变量名的一部分，不是独立数字）');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'set x2'), false,
    'x2< 不触发（2 是变量名的一部分）');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'foo bar123'), false,
    'bar123< 不触发');

// Tcl 比较运算符不触发
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'if {$x '), false,
    'if {$x < 不触发（前一字符是空格）');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, 'expr {$a'), false,
    'expr {$a < 不触发');

// 字符串内不触发
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, '"text'), false,
    '"text< 不触发');

console.log('All unit-auto-close tests passed!');
