// tests/test-definitions.js
const assert = require('assert');
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitions, extractDefinitions, getDefinitions, clearDefinitionCache } = require('../src/definitions');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nfindBalancedExpression:');

test('简单表达式', () => {
    const text = '(define x 42)';
    assert.strictEqual(findBalancedExpression(text, 0), 12);
});

test('嵌套表达式', () => {
    const text = '(define (f x) (+ x 1))';
    assert.strictEqual(findBalancedExpression(text, 0), 21);
});

test('跨行表达式', () => {
    const text = '(define TboxTest\n  0.42)';
    assert.strictEqual(findBalancedExpression(text, 0), 23);
});

test('跳过字符串内的括号', () => {
    const text = '(define x "hello (world)")';
    assert.strictEqual(findBalancedExpression(text, 0), 25);
});

test('跳过注释内的括号', () => {
    const text = '(define x 42) ; (not counted)';
    assert.strictEqual(findBalancedExpression(text, 0), 12);
});

test('未闭合返回 -1', () => {
    const text = '(define x';
    assert.strictEqual(findBalancedExpression(text, 0), -1);
});

test('花括号匹配（Tcl）', () => {
    const text = 'proc foo { x y } { body }';
    // 从第一个 { 开始
    const start = text.indexOf('{');
    assert.strictEqual(findBalancedExpression(text, start, '{', '}'), start + 6); // "x y" 的 }
});

test('嵌套花括号', () => {
    const text = 'proc foo {args} { set z [expr {$x}] }';
    const bodyStart = text.indexOf('{', text.indexOf('}') + 1);
    assert.strictEqual(findBalancedExpression(text, bodyStart, '{', '}'), text.length - 1);
});

console.log('\nextractSchemeDefinitions:');

test('提取 define 变量', () => {
    const defs = extractSchemeDefinitions('(define TboxTest 0.42)');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].line, 1);
});

test('提取 define 函数', () => {
    const defs = extractSchemeDefinitions('(define (my-func x y) (+ x y))');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'my-func');
});

test('提取跨行 define', () => {
    const text = '(define TboxTest\n  0.42)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].endLine, 2);
    assert.ok(defs[0].definitionText.includes('0.42'));
});

test('let 绑定不暴露到全局', () => {
    const text = '(let ((a 1) (b 2)) (+ a b))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 0);
});

test('let* 绑定不暴露到全局', () => {
    const text = '(let* ((x 1) (y (+ x 1))) y)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 0);
});

test('letrec 绑定不暴露到全局', () => {
    const text = '(letrec ((even? (lambda (n) n)) (odd? (lambda (n) n))) (even? 10))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 0);
});

test('跳过注释中的 define', () => {
    const text = '; (define commented 1)\n(define real 2)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'real');
});

test('多 define 混合', () => {
    const text = '(define x 1)\n(define y 2)\n(define (f z) (+ z 1))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[1].name, 'y');
    assert.strictEqual(defs[2].name, 'f');
});

test('define 后紧跟闭括号（空定义）', () => {
    const defs = extractSchemeDefinitions('(define x)');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('跳过字符串中的 define', () => {
    const text = '(define x "(define fake 1)")';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

console.log('\nextractTclDefinitions:');

test('提取 set 变量', () => {
    const defs = extractTclDefinitions('set TboxTest 0.42');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].line, 1);
});

test('提取 set 带花括号值', () => {
    const defs = extractTclDefinitions('set name "hello"');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'name');
});

test('跳过 set env()', () => {
    const defs = extractTclDefinitions('set env(PATH) /usr/bin');
    assert.strictEqual(defs.length, 0);
});

test('提取 proc', () => {
    const defs = extractTclDefinitions('proc myFunc { x y } { return [expr {$x + $y}] }');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'myFunc');
});

test('提取跨行 proc', () => {
    const text = 'proc calc { x y } {\n  set z [expr {$x + $y}]\n  return $z\n}';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 2); // proc calc + set z
    assert.strictEqual(defs[0].name, 'calc');
    assert.strictEqual(defs[0].endLine, 4);
    assert.strictEqual(defs[1].name, 'z');
});

test('跳过注释行', () => {
    const text = '# set commented 1\nset real 2';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'real');
});

test('多变量混合', () => {
    const text = 'set a 1\nset b 2\nproc f { } { return $a }';
    const defs = extractTclDefinitions(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'a');
    assert.strictEqual(defs[1].name, 'b');
    assert.strictEqual(defs[2].name, 'f');
});

test('缩进的 set（循环体内）', () => {
    const defs = extractTclDefinitions('    set indented 42');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'indented');
});

console.log('\nextractDefinitions:');

test('sde 语言走 Scheme 提取', () => {
    const defs = extractDefinitions('(define x 1)', 'sde');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('sprocess 语言走 Tcl 提取', () => {
    const defs = extractDefinitions('set x 1', 'sprocess');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('未知语言返回空数组', () => {
    const defs = extractDefinitions('x = 1', 'python');
    assert.strictEqual(defs.length, 0);
});

console.log('\ngetDefinitions (缓存):');

// 模拟 document 对象
function mockDoc(text, version, uri) {
    return {
        getText: () => text,
        version,
        uri: { toString: () => uri || 'file:///test.cmd' },
    };
}

test('首次调用执行扫描', () => {
    clearDefinitionCache();
    const doc = mockDoc('(define myVar 42)', 1);
    const defs = getDefinitions(doc, 'sde');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'myVar');
});

test('同版本使用缓存', () => {
    clearDefinitionCache();
    const doc = mockDoc('(define x 1)', 1);
    const d1 = getDefinitions(doc, 'sde');
    const d2 = getDefinitions(doc, 'sde');
    assert.strictEqual(d1, d2); // 同一引用
});

test('版本变化重新扫描', () => {
    clearDefinitionCache();
    const uri = 'file:///test2.cmd';
    const doc1 = mockDoc('(define x 1)', 1, uri);
    const doc2 = mockDoc('(define x 1) (define y 2)', 2, uri);
    const d1 = getDefinitions(doc1, 'sde');
    const d2 = getDefinitions(doc2, 'sde');
    assert.strictEqual(d1.length, 1);
    assert.strictEqual(d2.length, 2);
    assert.notStrictEqual(d1, d2);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
