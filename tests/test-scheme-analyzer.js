// tests/test-scheme-analyzer.js
const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { analyze } = require('../src/lsp/scheme-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nanalyze — define+lambda params:');

test('define+lambda 提取 params 字段', () => {
    const { ast } = parse('(define create_trapezoid (lambda (x0 y0 z0 w h) body))');
    const result = analyze(ast);
    const def = result.definitions[0];
    assert.strictEqual(def.name, 'create_trapezoid');
    assert.strictEqual(def.kind, 'variable');
    assert.deepStrictEqual(def.params, ['x0', 'y0', 'z0', 'w', 'h']);
});

test('define 普通变量无 params 字段', () => {
    const { ast } = parse('(define x 42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'x');
    assert.strictEqual(result.definitions[0].kind, 'variable');
    assert.strictEqual(result.definitions[0].params, undefined);
});

test('define+lambda 无参数列表', () => {
    const { ast } = parse('(define f (lambda () body))');
    const result = analyze(ast);
    const def = result.definitions[0];
    assert.deepStrictEqual(def.params, []);
});

test('define+lambda 跨行', () => {
    const text = '(define my-func\n  (lambda (a b c)\n    (+ a b c)))';
    const { ast } = parse(text);
    const result = analyze(ast, text);
    const def = result.definitions[0];
    assert.deepStrictEqual(def.params, ['a', 'b', 'c']);
});

test('define+非 lambda 无 params', () => {
    const { ast } = parse('(define f (+ 1 2))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].params, undefined);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
