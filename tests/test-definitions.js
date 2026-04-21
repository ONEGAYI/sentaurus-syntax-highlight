// tests/test-definitions.js
const assert = require('assert');
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitionsAst, extractDefinitions, getDefinitions, clearDefinitionCache, invalidateDefinitionCache, truncateDefinitionText } = require('../src/definitions');

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
    assert.strictEqual(defs[0].kind, 'variable');
});

test('提取 define 函数', () => {
    const defs = extractSchemeDefinitions('(define (my-func x y) (+ x y))');
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'my-func');
    assert.strictEqual(defs[0].kind, 'function');
    assert.strictEqual(defs[1].name, 'x');
    assert.strictEqual(defs[1].kind, 'parameter');
    assert.strictEqual(defs[2].name, 'y');
    assert.strictEqual(defs[2].kind, 'parameter');
});

test('提取跨行 define', () => {
    const text = '(define TboxTest\n  0.42)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'TboxTest');
    assert.strictEqual(defs[0].endLine, 2);
    assert.ok(defs[0].definitionText.includes('0.42'));
    assert.strictEqual(defs[0].kind, 'variable');
});

test('let 绑定提取', () => {
    const text = '(let ((a 1) (b 2)) (+ a b))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'a');
    assert.strictEqual(defs[1].name, 'b');
    assert.strictEqual(defs[0].kind, 'variable');
});

test('let* 绑定提取', () => {
    const text = '(let* ((x 1) (y (+ x 1))) y)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[1].name, 'y');
    assert.strictEqual(defs[0].kind, 'variable');
});

test('letrec 绑定提取', () => {
    const text = '(letrec ((even? (lambda (n) n)) (odd? (lambda (n) n))) (even? 10))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 4);
    const names = defs.map(d => d.name);
    assert.ok(names.includes('even?'), '应包含 even?');
    assert.ok(names.includes('odd?'), '应包含 odd?');
    const params = defs.filter(d => d.kind === 'parameter');
    assert.strictEqual(params.length, 2, '应有 2 个 lambda 参数');
    assert.strictEqual(params.every(p => p.name === 'n'), true, 'lambda 参数名均为 n');
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
    assert.strictEqual(defs.length, 4);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[1].name, 'y');
    assert.strictEqual(defs[2].name, 'f');
    assert.strictEqual(defs[3].name, 'z');
    assert.strictEqual(defs[0].kind, 'variable');
    assert.strictEqual(defs[1].kind, 'variable');
    assert.strictEqual(defs[2].kind, 'function');
    assert.strictEqual(defs[3].kind, 'parameter');
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

test('definitionText 包含行末注释', () => {
    const text = '(define Lgate 0.01) ; length of gate';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.ok(defs[0].definitionText.includes('; length of gate'));
});

test('lambda 参数提取', () => {
    const text = '(lambda (x y) (+ x y))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'x');
    assert.strictEqual(defs[0].kind, 'parameter');
    assert.strictEqual(defs[1].name, 'y');
    assert.strictEqual(defs[1].kind, 'parameter');
});

test('(define f (lambda ...)) 提取 lambda 参数', () => {
    const text = '(define f (lambda (a b c) (+ a b c)))';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 4);
    assert.strictEqual(defs[0].name, 'f');
    assert.strictEqual(defs[0].kind, 'variable');
    assert.strictEqual(defs[1].name, 'a');
    assert.strictEqual(defs[1].kind, 'parameter');
    assert.strictEqual(defs[2].name, 'b');
    assert.strictEqual(defs[3].name, 'c');
});

test('letrec 中 lambda 参数提取', () => {
    const text = '(letrec ((f (lambda (n) n))) (f 10))';
    const defs = extractSchemeDefinitions(text);
    assert.ok(defs.some(d => d.name === 'f'), '应包含 letrec 绑定的 f');
    assert.ok(defs.some(d => d.name === 'n' && d.kind === 'parameter'), '应包含 lambda 参数 n');
});

test('lambda 无参数不提取', () => {
    const text = '(lambda () 42)';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 0);
});

console.log('\nextractTclDefinitionsAst:');

test('AST 未初始化时返回空数组', () => {
    const defs = extractTclDefinitionsAst('set x 42');
    assert.strictEqual(defs.length, 0);
});

console.log('\nextractDefinitions:');

test('sde 语言走 Scheme 提取', () => {
    const defs = extractDefinitions('(define x 1)', 'sde');
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'x');
});

test('sprocess 语言走 Tcl AST 提取（WASM 未初始化返回空）', () => {
    const defs = extractDefinitions('set x 1', 'sprocess');
    assert.strictEqual(defs.length, 0);
});

test('未知语言返回空数组', () => {
    const defs = extractDefinitions('x = 1', 'python');
    assert.strictEqual(defs.length, 0);
});

console.log('\ntruncateDefinitionText:');

test('短行不截断 (Scheme)', () => {
    assert.strictEqual(truncateDefinitionText('(define x 1)', 60, 'sde'), '(define x 1)');
});

test('Scheme 长行截断：括号平衡 + 注释标记', () => {
    const longLine = '(define very-long-variable-name-that-exceeds-max-width 0.01)';
    const result = truncateDefinitionText(longLine, 40, 'sde');
    assert.ok(result.endsWith(' ;\u2026'), '应以 ;… 结尾');
    assert.ok(result.endsWith(') ;\u2026'), '括号应已闭合');
});

test('Scheme 截断：截断在字符串内部时回退到引号之前', () => {
    const line = '(define name "a very long string value")';
    const result = truncateDefinitionText(line, 30, 'sde');
    assert.ok(result.endsWith(') ;\u2026'), '括号应闭合');
    const quotes = (result.match(/"/g) || []).length;
    assert.strictEqual(quotes % 2, 0, '引号应成对');
    assert.ok(!result.includes('""'), '不应生成虚假空字符串');
});

test('Tcl 长行截断：使用 # 注释标记', () => {
    const longLine = 'set very_long_variable_name_that_exceeds_max_width some_value';
    const result = truncateDefinitionText(longLine, 30, 'sdevice');
    assert.ok(result.endsWith(' #\u2026'), 'Tcl 应以 #… 结尾');
});

test('无 langId 默认为 Tcl 风格', () => {
    const longLine = 'set variable_name value';
    const result = truncateDefinitionText(longLine, 15);
    assert.ok(result.endsWith(' #\u2026'), '无 langId 时使用 Tcl 注释');
});

test('多行只截断超长行', () => {
    const text = '(define x\n  12345678901234567890123456789012345678901234567890)';
    const result = truncateDefinitionText(text, 30, 'sde');
    const lines = result.split('\n');
    assert.strictEqual(lines[0], '(define x'); // 短行不变
    assert.ok(lines[1].includes(';\u2026'), '长行使用注释标记');
});

test('maxWidth=0 返回原文', () => {
    assert.strictEqual(truncateDefinitionText('abc', 0, 'sde'), 'abc');
});

test('null/undefined 返回原值', () => {
    assert.strictEqual(truncateDefinitionText(null, 60, 'sde'), null);
    assert.strictEqual(truncateDefinitionText(undefined, 60, 'sde'), undefined);
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

console.log('\ninvalidateDefinitionCache:');

test('删除指定 URI 缓存条目', () => {
    clearDefinitionCache();
    const doc1 = mockDoc('(define x 1)', 1, 'file:///test-inv-a.sde');
    const doc2 = mockDoc('(define y 2)', 1, 'file:///test-inv-b.sde');

    const d1 = getDefinitions(doc1, 'sde');
    const d2 = getDefinitions(doc2, 'sde');

    invalidateDefinitionCache('file:///test-inv-a.sde');

    // doc2 应该仍命中缓存（同一引用）
    const d2Again = getDefinitions(doc2, 'sde');
    assert.strictEqual(d2, d2Again, 'doc2 应返回同一缓存对象');

    // doc1 应重新解析（新对象）
    const d1Again = getDefinitions(doc1, 'sde');
    assert.notStrictEqual(d1, d1Again, 'doc1 在 invalidation 后应重新解析');

    clearDefinitionCache();
});

test('删除不存在的 URI 不报错', () => {
    clearDefinitionCache();
    assert.doesNotThrow(() => {
        invalidateDefinitionCache('file:///nonexistent.sde');
    });
    clearDefinitionCache();
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
