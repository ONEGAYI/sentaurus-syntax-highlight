// tests/test-parse-cache.js
'use strict';

const assert = require('assert');
const { SchemeParseCache, TclParseCache, computeLineStarts } = require('../src/lsp/parse-cache');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

/**
 * 创建模拟 document 对象
 */
function mockDoc(uri, version, text) {
    return {
        uri: { toString: () => uri },
        version,
        getText: () => text,
    };
}

// ===========================================================================
// computeLineStarts
// ===========================================================================
console.log('\ncomputeLineStarts:');

test('空字符串', () => {
    const starts = computeLineStarts('');
    assert.deepStrictEqual(starts, [0]);
});

test('单行无换行', () => {
    const starts = computeLineStarts('hello');
    assert.deepStrictEqual(starts, [0]);
});

test('单行末尾换行', () => {
    const starts = computeLineStarts('hello\n');
    assert.deepStrictEqual(starts, [0, 6]);
});

test('多行文本', () => {
    const starts = computeLineStarts('abc\ndef\nghi');
    assert.deepStrictEqual(starts, [0, 4, 8]);
});

test('空行', () => {
    const starts = computeLineStarts('\n\n');
    assert.deepStrictEqual(starts, [0, 1, 2]);
});

// ===========================================================================
// SchemeParseCache
// ===========================================================================
console.log('\nSchemeParseCache — 缓存命中:');

test('相同 version 返回同一对象', () => {
    const cache = new SchemeParseCache();
    const doc = mockDoc('file:///a.scm', 1, '(define x 42)');
    const r1 = cache.get(doc);
    const r2 = cache.get(doc);
    assert.strictEqual(r1, r2);
    assert.strictEqual(r1.version, 1);
});

test('缓存命中不重新解析', () => {
    const cache = new SchemeParseCache();
    const doc = mockDoc('file:///a.scm', 1, '(define x 42)');
    const r1 = cache.get(doc);
    const r2 = cache.get(doc);
    // 同一引用，ast 相同
    assert.strictEqual(r1.ast, r2.ast);
});

console.log('\nSchemeParseCache — 缓存失效:');

test('version 变更触发重新解析', () => {
    const cache = new SchemeParseCache();
    const doc1 = mockDoc('file:///a.scm', 1, '(define x 42)');
    const doc2 = mockDoc('file:///a.scm', 2, '(define y 99)');
    const r1 = cache.get(doc1);
    const r2 = cache.get(doc2);
    assert.notStrictEqual(r1, r2);
    assert.strictEqual(r2.version, 2);
    assert.strictEqual(r2.text, '(define y 99)');
});

test('不同 URI 独立缓存', () => {
    const cache = new SchemeParseCache();
    const docA = mockDoc('file:///a.scm', 1, '(define a 1)');
    const docB = mockDoc('file:///b.scm', 1, '(define b 2)');
    const rA = cache.get(docA);
    const rB = cache.get(docB);
    assert.notStrictEqual(rA, rB);
    assert.strictEqual(cache.size, 2);
});

console.log('\nSchemeParseCache — invalidate:');

test('invalidate 删除指定 URI', () => {
    const cache = new SchemeParseCache();
    cache.get(mockDoc('file:///a.scm', 1, '(+ 1 2)'));
    cache.get(mockDoc('file:///b.scm', 1, '(* 3 4)'));
    assert.strictEqual(cache.size, 2);
    cache.invalidate('file:///a.scm');
    assert.strictEqual(cache.size, 1);
    // 再次 get 应该重新解析
    const r = cache.get(mockDoc('file:///a.scm', 1, '(+ 1 2)'));
    assert.strictEqual(r.version, 1);
    assert.strictEqual(cache.size, 2);
});

test('invalidate 不存在的 URI 无副作用', () => {
    const cache = new SchemeParseCache();
    cache.get(mockDoc('file:///a.scm', 1, '(+ 1 2)'));
    cache.invalidate('file:///nonexistent.scm');
    assert.strictEqual(cache.size, 1);
});

console.log('\nSchemeParseCache — dispose:');

test('dispose 清空所有缓存', () => {
    const cache = new SchemeParseCache();
    cache.get(mockDoc('file:///a.scm', 1, '(+ 1 2)'));
    cache.get(mockDoc('file:///b.scm', 1, '(* 3 4)'));
    assert.strictEqual(cache.size, 2);
    cache.dispose();
    assert.strictEqual(cache.size, 0);
});

console.log('\nSchemeParseCache — 解析结果结构:');

test('lineStarts 正确计算', () => {
    const cache = new SchemeParseCache();
    const text = '(define x 42)\n(define y 99)\n';
    const r = cache.get(mockDoc('file:///a.scm', 1, text));
    assert.deepStrictEqual(r.lineStarts, [0, 14, 28]);
});

test('analysis 包含 definitions 和 foldingRanges', () => {
    const cache = new SchemeParseCache();
    const r = cache.get(mockDoc('file:///a.scm', 1, '(define x 42)'));
    assert.ok(Array.isArray(r.analysis.definitions));
    assert.ok(Array.isArray(r.analysis.foldingRanges));
    assert.strictEqual(r.analysis.definitions.length, 1);
    assert.strictEqual(r.analysis.definitions[0].name, 'x');
});

test('scopeTree 非空且 type 为 global', () => {
    const cache = new SchemeParseCache();
    const r = cache.get(mockDoc('file:///a.scm', 1, '(define x 42)'));
    assert.ok(r.scopeTree);
    assert.strictEqual(r.scopeTree.type, 'global');
    assert.ok(Array.isArray(r.scopeTree.children));
});

test('errors 从解析器正确传递', () => {
    const cache = new SchemeParseCache();
    // 缺少右括号应产生错误
    const r = cache.get(mockDoc('file:///a.scm', 1, '(define x'));
    assert.ok(Array.isArray(r.errors));
    // 缺少右括号时应该有至少一个错误
    assert.ok(r.errors.length >= 1, `期望有解析错误，实际 errors=${JSON.stringify(r.errors)}`);
});

test('text 字段等于原文', () => {
    const cache = new SchemeParseCache();
    const text = '(+ 1 2)';
    const r = cache.get(mockDoc('file:///a.scm', 1, text));
    assert.strictEqual(r.text, text);
});

console.log('\nSchemeParseCache — LRU 淘汰:');

test('超过 maxEntries 淘汰最旧条目', () => {
    const cache = new SchemeParseCache({ maxEntries: 3 });
    cache.get(mockDoc('file:///1.scm', 1, '(+ 1)'));
    cache.get(mockDoc('file:///2.scm', 1, '(+ 2)'));
    cache.get(mockDoc('file:///3.scm', 1, '(+ 3)'));
    assert.strictEqual(cache.size, 3);

    // 插入第 4 个，应淘汰第 1 个
    cache.get(mockDoc('file:///4.scm', 1, '(+ 4)'));
    assert.strictEqual(cache.size, 3);

    // file:///1.scm 应该已被淘汰，再次访问会重新解析
    const r = cache.get(mockDoc('file:///1.scm', 1, '(+ 1)'));
    assert.strictEqual(r.text, '(+ 1)');
    assert.strictEqual(cache.size, 3);
});

test('淘汰顺序：最先插入的被淘汰', () => {
    const cache = new SchemeParseCache({ maxEntries: 2 });
    cache.get(mockDoc('file:///a.scm', 1, 'aaa'));
    cache.get(mockDoc('file:///b.scm', 1, 'bbb'));
    // 插入 c，淘汰 a
    cache.get(mockDoc('file:///c.scm', 1, 'ccc'));
    assert.strictEqual(cache.size, 2);

    // b 仍在缓存
    const rB = cache.get(mockDoc('file:///b.scm', 1, 'bbb'));
    assert.strictEqual(rB.text, 'bbb');
});

console.log('\nSchemeParseCache — 构造选项:');

test('默认 maxEntries 为 20', () => {
    const cache = new SchemeParseCache();
    // 填充 20 个条目不应触发淘汰
    for (let i = 0; i < 20; i++) {
        cache.get(mockDoc(`file:///${i}.scm`, 1, `(${i})`));
    }
    assert.strictEqual(cache.size, 20);
    // 第 21 个触发淘汰
    cache.get(mockDoc('file:///extra.scm', 1, '(x)'));
    assert.strictEqual(cache.size, 20);
});

// ===========================================================================
// TclParseCache（接口结构测试，不依赖 WASM）
// ===========================================================================
console.log('\nTclParseCache — 接口结构:');

test('WASM 未初始化时 get 返回 null', () => {
    const cache = new TclParseCache();
    const doc = mockDoc('file:///a.cmd', 1, 'set x 42');
    const r = cache.get(doc);
    assert.strictEqual(r, null);
});

test('invalidate 不存在的 URI 无副作用', () => {
    const cache = new TclParseCache();
    cache.invalidate('file:///nonexistent.cmd');
    assert.strictEqual(cache.size, 0);
});

test('dispose 清空缓存', () => {
    const cache = new TclParseCache();
    cache.dispose();
    assert.strictEqual(cache.size, 0);
});

test('默认 maxEntries 为 20', () => {
    const cache = new TclParseCache();
    const cache2 = new TclParseCache({ maxEntries: 5 });
    // 仅验证构造不抛异常
    assert.ok(cache);
    assert.ok(cache2);
});

test('size 属性返回 0（空缓存）', () => {
    const cache = new TclParseCache();
    assert.strictEqual(cache.size, 0);
});

test('dispose 在空缓存上不抛异常', () => {
    const cache = new TclParseCache();
    assert.doesNotThrow(() => cache.dispose());
});

// ===========================================================================
// 汇总
// ===========================================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
if (failed > 0) {
    process.exit(1);
}
