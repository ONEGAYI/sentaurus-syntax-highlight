const assert = require('assert');
const { shouldDelete, isBoundary } = require('../src/lsp/providers/quote-auto-delete-logic');

// --- isBoundary 辅助函数测试 ---

// 行首/行尾
assert.strictEqual(isBoundary(''), true, '空字符串（行首/尾）是边界');

// 空白符
assert.strictEqual(isBoundary(' '), true, '空格是边界');
assert.strictEqual(isBoundary('\t'), true, '制表符是边界');

// 常见分隔符
assert.strictEqual(isBoundary('='), true, '= 是边界');
assert.strictEqual(isBoundary('('), true, '( 是边界');
assert.strictEqual(isBoundary('['), true, '[ 是边界');
assert.strictEqual(isBoundary('{'), true, '{ 是边界');
assert.strictEqual(isBoundary(','), true, ', 是边界');
assert.strictEqual(isBoundary(')'), true, ') 是边界');
assert.strictEqual(isBoundary(']'), true, '] 是边界');
assert.strictEqual(isBoundary('}'), true, '} 是边界');
assert.strictEqual(isBoundary(';'), true, '; 是边界');

// 单词字符不是边界
assert.strictEqual(isBoundary('a'), false, '字母不是边界');
assert.strictEqual(isBoundary('Z'), false, '大写字母不是边界');
assert.strictEqual(isBoundary('1'), false, '数字不是边界');
assert.strictEqual(isBoundary('_'), false, '下划线不是边界');

// 引号字符不是边界（防止连续引号误匹配）
assert.strictEqual(isBoundary('"'), false, '" 不是边界');
assert.strictEqual(isBoundary("'"), false, "' 不是边界");
assert.strictEqual(isBoundary('`'), false, '` 不是边界');

// --- shouldDelete 判定函数测试 ---

// 基本场景：参数校验
assert.strictEqual(shouldDelete(null, 'set x ', '"', ''), false,
    'null change 不触发');
assert.strictEqual(shouldDelete(undefined, 'set x ', '"', ''), false,
    'undefined change 不触发');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, null, '"', ''), false,
    'null linePrefix 不触发');

// 删除操作必须是 text='' 且 rangeLength=1
assert.strictEqual(shouldDelete({ text: '"', rangeLength: 0 }, 'set x ', '"', ''), false,
    '插入操作不触发');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 2 }, 'set x ', '"', ''), false,
    '多字符删除不触发');
assert.strictEqual(shouldDelete({ text: 'x', rangeLength: 1 }, 'set x ', '"', ''), false,
    '替换操作不触发');

// 光标后必须是引号
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', 'x', ''), false,
    '光标后非引号不触发');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', 'a', ''), false,
    '光标后字母不触发');

// --- 应触发：双引号空对 ---

assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ''), true,
    'set x "|" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ' '), true,
    'set x "|  rest" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x=', '"', ''), true,
    'set x="|" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', '"', ''), true,
    '行首 "|" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ')'), true,
    'set x "|)rest" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ']'), true,
    'set x "|]rest" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '  ', '"', ''), true,
    '缩进后 "|" → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'puts ', '"', ' '), true,
    'puts "| " → 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '(', '"', ')'), true,
    '("|)" → 应触发删除');

// --- 应触发：单引号空对 ---

assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", ''), true,
    "set x '|' → 应触发删除");
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x=', "'", ''), true,
    "set x='|' → 应触发删除");
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', "'", ''), true,
    "行首 '|' → 应触发删除");

// --- 不触发：非边界场景 ---

// 引号前不是边界（单词字符紧邻）
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x', '"', ''), false,
    'set x"| → 不触发（x 是单词字符）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'var1', '"', ''), false,
    'var1"| → 不触发（1 是单词字符）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'abc', "'", ''), false,
    "abc'| → 不触发（c 是单词字符）");

// 引号后不是边界（单词字符紧邻）
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', 'x'), false,
    'set x "|x → 不触发（x 不是边界）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', '1'), false,
    'set x "|1 → 不触发（1 不是边界）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", '_'), false,
    "set x '|_ → 不触发（_ 不是边界）");

// 连续引号场景（引号字符不算边界）
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', '"'), false,
    'set x "|"" → 不触发（" 后紧跟 " 不是边界）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", "'"), false,
    "set x '|'' → 不触发（' 后紧跟 ' 不是边界）");
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"', '"', ''), false,
    '"|"" → 不触发（" 前紧跟 " 不是边界）');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, "'", "'", ''), false,
    "'|'' → 不触发（' 前紧跟 ' 不是边界）");

// 混合引号不触发
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', "'"), false,
    "set x \"|' → 不触发（' 不是边界）");
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", '"'), false,
    "set x '|\" → 不触发（\" 不是边界）");

console.log('All quote-auto-delete tests passed!');
