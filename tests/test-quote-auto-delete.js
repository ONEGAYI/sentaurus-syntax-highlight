// tests/test-quote-auto-delete.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { shouldDelete, isBoundary } = require('../src/lsp/providers/quote-auto-delete-logic');

// --- isBoundary 辅助函数测试 ---

test('isBoundary: 边界字符', () => {
    assert.strictEqual(isBoundary(''), true, '空字符串（行首/尾）是边界');
    assert.strictEqual(isBoundary(' '), true, '空格是边界');
    assert.strictEqual(isBoundary('\t'), true, '制表符是边界');
    assert.strictEqual(isBoundary('='), true, '= 是边界');
    assert.strictEqual(isBoundary('('), true, '( 是边界');
    assert.strictEqual(isBoundary('['), true, '[ 是边界');
    assert.strictEqual(isBoundary('{'), true, '{ 是边界');
    assert.strictEqual(isBoundary(','), true, ', 是边界');
    assert.strictEqual(isBoundary(')'), true, ') 是边界');
    assert.strictEqual(isBoundary(']'), true, '] 是边界');
    assert.strictEqual(isBoundary('}'), true, '} 是边界');
    assert.strictEqual(isBoundary(';'), true, '; 是边界');
});

test('isBoundary: 单词字符不是边界', () => {
    assert.strictEqual(isBoundary('a'), false, '字母不是边界');
    assert.strictEqual(isBoundary('Z'), false, '大写字母不是边界');
    assert.strictEqual(isBoundary('1'), false, '数字不是边界');
    assert.strictEqual(isBoundary('_'), false, '下划线不是边界');
});

test('isBoundary: 引号字符不是边界', () => {
    assert.strictEqual(isBoundary('"'), false, '" 不是边界');
    assert.strictEqual(isBoundary("'"), false, "' 不是边界");
    assert.strictEqual(isBoundary('`'), false, '` 不是边界');
});

// --- shouldDelete 判定函数测试 ---

test('shouldDelete: 参数校验', () => {
    assert.strictEqual(shouldDelete(null, 'set x ', '"', ''), false, 'null change 不触发');
    assert.strictEqual(shouldDelete(undefined, 'set x ', '"', ''), false, 'undefined change 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, null, '"', ''), false, 'null linePrefix 不触发');
});

test('shouldDelete: 操作类型校验', () => {
    assert.strictEqual(shouldDelete({ text: '"', rangeLength: 0 }, 'set x ', '"', ''), false, '插入操作不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 2 }, 'set x ', '"', ''), false, '多字符删除不触发');
    assert.strictEqual(shouldDelete({ text: 'x', rangeLength: 1 }, 'set x ', '"', ''), false, '替换操作不触发');
});

test('shouldDelete: 光标后必须为引号', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', 'x', ''), false, '光标后非引号不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', 'a', ''), false, '光标后字母不触发');
});

test('shouldDelete: 双引号空对应触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ''), true, 'set x "|" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ' '), true, 'set x "|  rest" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x=', '"', ''), true, 'set x="|" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', '"', ''), true, '行首 "|" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ')'), true, 'set x "|)rest" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ']'), true, 'set x "|]rest" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '  ', '"', ''), true, '缩进后 "|" → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'puts ', '"', ' '), true, 'puts "| " → 触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '(', '"', ')'), true, '("|)" → 触发');
});

test('shouldDelete: 单引号空对应触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", ''), true, "set x '|' → 触发");
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x=', "'", ''), true, "set x='|' → 触发");
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', "'", ''), true, "行首 '|' → 触发");
});

test('shouldDelete: 引号前非边界不触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x', '"', ''), false, 'set x"| → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'var1', '"', ''), false, 'var1"| → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'abc', "'", ''), false, "abc'| → 不触发");
});

test('shouldDelete: 引号后非边界不触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', 'x'), false, 'set x "|x → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', '1'), false, 'set x "|1 → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", '_'), false, "set x '|_ → 不触发");
});

test('shouldDelete: @ 符号不算边界', () => {
    assert.strictEqual(isBoundary('@'), false, '@ 不是边界');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"Profile_@', '"', ''), false, '"Profile_@|" → 不触发');
});

test('shouldDelete: 连续引号不触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', '"'), false, 'set x "|"" → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", "'"), false, "set x '|'' → 不触发");
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"', '"', ''), false, '"|"" → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, "'", "'", ''), false, "'|'' → 不触发");
});

test('shouldDelete: 混合引号不触发', () => {
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', "'"), false, "set x \"|' → 不触发");
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', "'", '"'), false, "set x '|\" → 不触发");
});

test('shouldDelete: 引号内部退格不触发', () => {
    // 核心回归："$" 删除后 linePrefix 含未闭合引号
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"xx $', '"', ''), false, '"xx $|" → 不触发（引号内部）');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"hello ', '"', ''), false, '"hello |" → 不触发');
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"foo ', '"', ' '), false, '"foo | " → 不触发');
    // 单引号同理
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, "'xx $", "'", ''), false, "'xx $|' → 不触发");
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, "'hello ", "'", ''), false, "'hello |' → 不触发");
    // 空引号对中删除内容字符后仍应触发（无未闭合引号）
    // 模拟：先输入 ""，再在中间输入 x 后退格：linePrefix 不含引号
    assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x ', '"', ''), true, 'set x "|" 仍触发（不在引号内）');
});

summary();
