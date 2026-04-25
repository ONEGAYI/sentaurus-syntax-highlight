// tests/test-expression-quickpick.js
const assert = require('assert');
const {
    CursorTracker,
    getWordAtPosition,
    replaceWordAtPosition,
    parseHistoryInput,
} = require('../src/commands/expression-converter');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── CursorTracker ─────────────────────────────
console.log('\nCursorTracker:');

test('首次更新空字符串返回 0', () => {
    const tracker = new CursorTracker();
    const cursor = tracker.update('');
    assert.strictEqual(cursor, 0);
});

test('在末尾追加时光标在末尾', () => {
    const tracker = new CursorTracker();
    tracker.update('W');
    const cursor = tracker.update('W + ');
    assert.strictEqual(cursor, 4);
});

test('在中间插入时光标在插入点（粘贴场景回退）', () => {
    const tracker = new CursorTracker();
    tracker.update('W + L');
    const cursor = tracker.update('W + Width + L');
    // 前缀 "W + " (4)，后缀 "L" (1)，光标在 13-1=12
    assert.strictEqual(cursor, 12);
});

test('删除中间字符时光标在删除位置', () => {
    const tracker = new CursorTracker();
    tracker.update('W + Width + L');
    const cursor = tracker.update('W + Wid + L');
    assert.strictEqual(cursor, 7);
});

test('粘贴操作回退到末尾', () => {
    const tracker = new CursorTracker();
    tracker.update('W');
    const cursor = tracker.update('Width + Length');
    assert.strictEqual(cursor, 14);
});

test('撤销场景：前缀和后缀都变化', () => {
    const tracker = new CursorTracker();
    tracker.update('W + Width + L');
    const cursor = tracker.update('W + Wid');
    assert.strictEqual(cursor, 7);
});

test('sync 不推断但更新状态', () => {
    const tracker = new CursorTracker();
    tracker.sync('W + L');
    const cursor = tracker.update('W + L + ');
    // 前缀 "W + L" (5)，后缀 "" (0)，光标在 8-0=8（新值末尾）
    assert.strictEqual(cursor, 8);
});

test('reset 恢复初始状态', () => {
    const tracker = new CursorTracker();
    tracker.update('W + L');
    tracker.reset();
    const cursor = tracker.update('New');
    assert.strictEqual(cursor, 3);
});

test('相同值返回长度位置', () => {
    const tracker = new CursorTracker();
    tracker.update('W + L');
    const cursor = tracker.update('W + L');
    assert.strictEqual(cursor, 5);
});

// ─── getWordAtPosition ────────────────────────
console.log('\ngetWordAtPosition:');

test('末尾标识符（匹配旧行为）', () => {
    const result = getWordAtPosition('W + Wid', 7);
    assert.deepStrictEqual(result, { prefix: 'Wid', start: 4, end: 7 });
});

test('中间标识符提取', () => {
    const result = getWordAtPosition('W + Width + L', 9);
    assert.deepStrictEqual(result, { prefix: 'Width', start: 4, end: 9 });
});

test('非标识符位置返回 null', () => {
    const result = getWordAtPosition('a + ', 3);
    assert.strictEqual(result, null);
});

test('空字符串返回 null', () => {
    const result = getWordAtPosition('', 0);
    assert.strictEqual(result, null);
});

test('开头标识符', () => {
    const result = getWordAtPosition('Width + L', 3);
    assert.deepStrictEqual(result, { prefix: 'Wid', start: 0, end: 5 });
});

test('括号内标识符', () => {
    const result = getWordAtPosition('sin(W', 5);
    assert.deepStrictEqual(result, { prefix: 'W', start: 4, end: 5 });
});

test('逗号后部分前缀', () => {
    const result = getWordAtPosition('max(a, b, Wi', 12);
    assert.deepStrictEqual(result, { prefix: 'Wi', start: 10, end: 12 });
});

test('@ 开头的 SWB 参数', () => {
    const result = getWordAtPosition('@W@ + @L', 8);
    assert.deepStrictEqual(result, { prefix: '@L', start: 6, end: 8 });
});

test('光标在标识符中间', () => {
    const result = getWordAtPosition('W + Width + L', 6);
    assert.deepStrictEqual(result, { prefix: 'Wi', start: 4, end: 9 });
});

test('光标在标识符末尾', () => {
    const result = getWordAtPosition('W + Width + L', 9);
    assert.deepStrictEqual(result, { prefix: 'Width', start: 4, end: 9 });
});

test('多个运算符后的标识符', () => {
    const result = getWordAtPosition('a * b + Wid', 11);
    assert.deepStrictEqual(result, { prefix: 'Wid', start: 8, end: 11 });
});

test('尖括号内变量 — 光标在变量中间', () => {
    const result = getWordAtPosition('<my-var> + 1', 4);
    assert.deepStrictEqual(result, { prefix: 'my-', start: 1, end: 7, inAngleBrackets: true });
});

test('尖括号内变量 — 光标在变量开头', () => {
    const result = getWordAtPosition('<my-var> + 1', 1);
    assert.deepStrictEqual(result, { prefix: '', start: 1, end: 7, inAngleBrackets: true });
});

test('尖括号内变量 — 光标在变量末尾', () => {
    const result = getWordAtPosition('<my-var> + 1', 7);
    assert.deepStrictEqual(result, { prefix: 'my-var', start: 1, end: 7, inAngleBrackets: true });
});

test('光标在开括号上 — 视为进入尖括号', () => {
    const result = getWordAtPosition('<my-var> + 1', 0);
    assert.deepStrictEqual(result, { prefix: '', start: 1, end: 7, inAngleBrackets: true });
});

test('光标在闭括号后 — 正常行为', () => {
    const result = getWordAtPosition('<my-var> + 1', 8);
    assert.strictEqual(result, null);
});

test('开括号后无内容 — 光标在开括号后一位', () => {
    const result = getWordAtPosition('<> + 1', 1);
    assert.strictEqual(result, null);
});

test('光标在普通标识符上 — 不受尖括号影响', () => {
    const result = getWordAtPosition('a + <my-var>', 0);
    assert.deepStrictEqual(result, { prefix: '', start: 0, end: 1 });
});

// ─── replaceWordAtPosition ───────────────────
console.log('\nreplaceWordAtPosition:');

test('替换中间词', () => {
    const wordInfo = { start: 4, end: 7 };
    const result = replaceWordAtPosition('W + Wid + L', wordInfo, 'Width');
    assert.strictEqual(result, 'W + Width + L');
});

test('替换末尾词保留运算符', () => {
    const wordInfo = { start: 4, end: 7 };
    const result = replaceWordAtPosition('W + Wid', wordInfo, 'Width');
    assert.strictEqual(result, 'W + Width');
});

test('替换不截断剩余内容', () => {
    const wordInfo = { start: 4, end: 9 };
    const result = replaceWordAtPosition('W + Width + L', wordInfo, 'Wid');
    assert.strictEqual(result, 'W + Wid + L');
});

test('括号内替换', () => {
    const wordInfo = { start: 4, end: 7 };
    const result = replaceWordAtPosition('sin(Wid', wordInfo, 'Width');
    assert.strictEqual(result, 'sin(Width');
});

test('替换开头词', () => {
    const wordInfo = { start: 0, end: 3 };
    const result = replaceWordAtPosition('Wid + L', wordInfo, 'Width');
    assert.strictEqual(result, 'Width + L');
});

// ─── parseHistoryInput ────────────────────────
console.log('\nparseHistoryInput:');

test('非历史模式返回 null', () => {
    assert.strictEqual(parseHistoryInput('W + L'), null);
});

test('空字符串返回 null', () => {
    assert.strictEqual(parseHistoryInput(''), null);
});

test('! 返回全部历史', () => {
    const r = parseHistoryInput('!');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: '' });
});

test('!3 返回精确序号', () => {
    const r = parseHistoryInput('!3');
    assert.deepStrictEqual(r, { mode: 'history', index: 3, filter: '' });
});

test('! W + L 返回过滤模式', () => {
    const r = parseHistoryInput('! W + L');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'W + L' });
});

test('!30 超范围序号仍返回解析结果', () => {
    const r = parseHistoryInput('!30');
    assert.deepStrictEqual(r, { mode: 'history', index: 30, filter: '' });
});

test('!0 返回 0 序号', () => {
    const r = parseHistoryInput('!0');
    assert.deepStrictEqual(r, { mode: 'history', index: 0, filter: '' });
});

test('!abc 无空格按模糊匹配处理', () => {
    const r = parseHistoryInput('!abc');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'abc' });
});

// ─── Summary ──────────────────────────────────
console.log(`\n${'='.repeat(40)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
