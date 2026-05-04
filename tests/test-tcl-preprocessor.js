'use strict';

const assert = require('assert');
const { buildPpBlocks } = require('../src/lsp/pp-utils');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nbuildPpBlocks:');

test('简单 #if/#else/#endif 生成正确的分支映射', () => {
    const code = [
        '#if NMOS',
        'set x 1',
        '#else',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 1 行 #if → 分支 0
    assert.strictEqual(branchMap.get(1), 0);
    // 第 2 行 set x 1 → 分支 0
    assert.strictEqual(branchMap.get(2), 0);
    // 第 3 行 #else → 分支 1
    assert.strictEqual(branchMap.get(3), 1);
    // 第 4 行 set x 2 → 分支 1
    assert.strictEqual(branchMap.get(4), 1);
    // 第 5 行 #endif → 不在分支内
    assert.strictEqual(branchMap.get(5), undefined);
});

test('不同分支的同名定义具有不同 branchKey', () => {
    const code = [
        '#if NMOS',
        'set x 1',
        '#else',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 4 行应属于不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
});

test('嵌套 #if 块正确分配分支 ID', () => {
    const code = [
        '#if 0',
        '  #if COND',
        '  set x 1',
        '  #else',
        '  set x 2',
        '  #endif',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 3 行和第 5 行属于不同分支
    assert.notStrictEqual(branchMap.get(3), branchMap.get(5));
});

test('同分支内的重复定义具有相同 branchKey', () => {
    const code = [
        '#if 1',
        'set x 1',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 3 行应属于同一分支
    assert.strictEqual(branchMap.get(2), branchMap.get(3));
});

test('#ifdef 和 #ifndef 也被识别', () => {
    const code = [
        '#ifdef VAR',
        'set x 1',
        '#endif',
        '#ifndef VAR',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    assert.strictEqual(branchMap.has(2), true);
    assert.strictEqual(branchMap.has(5), true);
    // 两个独立的 #if 块
    assert.notStrictEqual(branchMap.get(2), branchMap.get(5));
});

test('#elif 创建新分支', () => {
    const code = [
        '#if 1',
        'set x 1',
        '#elif 2',
        'set x 2',
        '#else',
        'set x 3',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 三个不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
    assert.notStrictEqual(branchMap.get(4), branchMap.get(6));
    assert.notStrictEqual(branchMap.get(2), branchMap.get(6));
});

test('非预处理器行不在 branchMap 中', () => {
    const code = 'set x 1\nset y 2\n';

    const { branchMap } = buildPpBlocks(code);

    assert.strictEqual(branchMap.size, 0);
});

test('生成正确的折叠范围', () => {
    const code = [
        '#if NMOS',
        'set x 1',
        '#else',
        'set x 2',
        '#endif',
    ].join('\n');

    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 1);
    assert.strictEqual(foldingRanges[0].startLine, 0); // 0-based
    assert.strictEqual(foldingRanges[0].endLine, 4);   // 0-based
});

console.log('\ncheckTclDuplicateDefs (via buildPpBlocks):');

test('不同分支的同名 set 的 branchKey 不同', () => {
    const code = '#if NMOS\nset doping Boron\n#else\nset doping Phosphorus\n#endif';
    const { branchMap } = buildPpBlocks(code);
    // 第 2 行和第 4 行属于不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
});

test('同分支内的同名 set 的 branchKey 相同', () => {
    const code = '#if 1\nset x 1\nset x 2\n#endif';
    const { branchMap } = buildPpBlocks(code);
    assert.strictEqual(branchMap.get(2), branchMap.get(3));
});

test('非 #if 块内同名 set 的 branchKey 均为 undefined', () => {
    const code = 'set x 1\nset x 2';
    const { branchMap } = buildPpBlocks(code);
    assert.strictEqual(branchMap.get(1), undefined);
    assert.strictEqual(branchMap.get(2), undefined);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
