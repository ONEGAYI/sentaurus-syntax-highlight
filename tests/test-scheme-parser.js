// tests/test-scheme-parser.js
const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { analyze } = require('../src/lsp/scheme-analyzer');
const { extractSchemeDefinitions: oldExtract } = require('../src/definitions');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nparse:');

test('简单列表', () => {
    const { ast } = parse('(+ 1 2)');
    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.body.length, 1);
    const list = ast.body[0];
    assert.strictEqual(list.type, 'List');
    assert.strictEqual(list.children.length, 3);
    assert.strictEqual(list.children[0].type, 'Identifier');
    assert.strictEqual(list.children[0].value, '+');
    assert.strictEqual(list.children[1].type, 'Number');
    assert.strictEqual(list.children[1].value, 1);
    assert.strictEqual(list.children[2].type, 'Number');
    assert.strictEqual(list.children[2].value, 2);
});

test('嵌套列表', () => {
    const { ast } = parse('(define (f x) (+ x 1))');
    const outer = ast.body[0];
    assert.strictEqual(outer.children[0].value, 'define');
    const funcSig = outer.children[1];
    assert.strictEqual(funcSig.type, 'List');
    assert.strictEqual(funcSig.children[0].value, 'f');
});

test('define 变量', () => {
    const { ast } = parse('(define x 42)');
    const list = ast.body[0];
    assert.strictEqual(list.children[0].value, 'define');
    assert.strictEqual(list.children[1].value, 'x');
    assert.strictEqual(list.children[2].value, 42);
});

test('字符串参数', () => {
    const { ast } = parse('(sdegeo:create-rectangle "R.Si" "Silicon" (position 0 0 0))');
    const list = ast.body[0];
    assert.strictEqual(list.children[1].value, 'R.Si');
    assert.strictEqual(list.children[2].value, 'Silicon');
});

test('布尔值', () => {
    const { ast } = parse('(if #t 1 0)');
    const list = ast.body[0];
    assert.strictEqual(list.children[1].type, 'Boolean');
    assert.strictEqual(list.children[1].value, true);
});

test('引号语法糖', () => {
    const { ast } = parse("'(1 2 3)");
    assert.strictEqual(ast.body[0].type, 'Quote');
    assert.strictEqual(ast.body[0].expression.type, 'List');
});

test('跨行表达式行号', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const list = ast.body[0];
    assert.strictEqual(list.line, 1);
    assert.strictEqual(list.endLine, 2);
});

test('未闭合括号产生错误', () => {
    const { ast, errors } = parse('(define x');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].severity, 'error');
    assert.ok(errors[0].message.includes('未闭合'));
    assert.strictEqual(ast.body.length, 1);
});

test('多余闭括号产生警告', () => {
    const { errors } = parse('(define x 1))');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].severity, 'warning');
});

test('空输入', () => {
    const { ast } = parse('');
    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.body.length, 0);
});

test('注释被跳过但保留在 AST', () => {
    const { ast } = parse('; comment\n(define x 1)');
    assert.strictEqual(ast.body.length, 2);
    assert.strictEqual(ast.body[0].type, 'Comment');
});

test('definitionText 字段', () => {
    const { ast } = parse('(define x 42)');
    const list = ast.body[0];
    assert.strictEqual(list.text, '(define x 42)');
});

test('definitionText 包含行末注释', () => {
    const text = '(define Lgate 0.01) ; length of gate';
    const { ast } = parse(text);
    const result = analyze(ast, text);
    assert.strictEqual(result.definitions.length, 1);
    assert.ok(result.definitions[0].definitionText.includes('; length of gate'));
});

console.log('\nanalyze — definitions:');

test('从 AST 提取 define 变量', () => {
    const { ast } = parse('(define TboxTest 0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'TboxTest');
    assert.strictEqual(result.definitions[0].line, 1);
    assert.strictEqual(result.definitions[0].kind, 'variable');
});

test('从 AST 提取 define 函数', () => {
    const { ast } = parse('(define (my-func x y) (+ x y))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 3);
    assert.strictEqual(result.definitions[0].name, 'my-func');
    assert.strictEqual(result.definitions[0].kind, 'function');
    assert.strictEqual(result.definitions[1].name, 'x');
    assert.strictEqual(result.definitions[1].kind, 'parameter');
    assert.strictEqual(result.definitions[2].name, 'y');
    assert.strictEqual(result.definitions[2].kind, 'parameter');
});

test('从 AST 提取跨行 define', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].endLine, 2);
    assert.ok(result.definitions[0].definitionText.includes('0.42'));
    assert.strictEqual(result.definitions[0].kind, 'variable');
});

test('let 绑定提取', () => {
    const { ast } = parse('(let ((a 1) (b 2)) (+ a b))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 2);
    assert.strictEqual(result.definitions[0].name, 'a');
    assert.strictEqual(result.definitions[1].name, 'b');
    assert.strictEqual(result.definitions[0].kind, 'variable');
});

test('let* 绑定提取', () => {
    const { ast } = parse('(let* ((x 1) (y 2)) y)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 2);
    assert.strictEqual(result.definitions[0].name, 'x');
    assert.strictEqual(result.definitions[1].name, 'y');
});

test('letrec 绑定提取', () => {
    const { ast } = parse('(letrec ((even? (lambda (n) n))) (even? 10))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'even?');
});

test('AST 跳过注释中的 define', () => {
    const { ast } = parse('; (define commented 1)\n(define real 2)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'real');
});

test('AST 跳过字符串中的 define', () => {
    const { ast } = parse('(define x "(define fake 1)")');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'x');
});

test('AST 多 define 混合', () => {
    const { ast } = parse('(define x 1)\n(define y 2)\n(define (f z) (+ z 1))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 4);
    assert.strictEqual(result.definitions[0].name, 'x');
    assert.strictEqual(result.definitions[1].name, 'y');
    assert.strictEqual(result.definitions[2].name, 'f');
    assert.strictEqual(result.definitions[3].name, 'z');
    assert.strictEqual(result.definitions[0].kind, 'variable');
    assert.strictEqual(result.definitions[1].kind, 'variable');
    assert.strictEqual(result.definitions[2].kind, 'function');
    assert.strictEqual(result.definitions[3].kind, 'parameter');
});

console.log('\nanalyze — folding ranges:');

test('单行表达式无折叠', () => {
    const { ast } = parse('(define x 1)');
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 0);
});

test('跨行列表产生折叠范围', () => {
    const { ast } = parse('(define TboxTest\n  0.42)');
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 1);
    assert.strictEqual(result.foldingRanges[0].startLine, 0); // 0-based
    assert.strictEqual(result.foldingRanges[0].endLine, 1);
});

test('嵌套折叠范围都保留', () => {
    const code = '(define (f x)\n  (let ((a 1))\n    (+ a\n       x)))';
    const { ast } = parse(code);
    const result = analyze(ast);
    assert.strictEqual(result.foldingRanges.length, 3); // define, let, +
});

console.log('\n兼容性 — 与 definitions.js 输出对比:');

test('兼容: define 变量格式一致', () => {
    const text = '(define TboxTest 0.42)';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    assert.strictEqual(oldDefs[0].name, newDefs[0].name);
    assert.strictEqual(oldDefs[0].line, newDefs[0].line);
});

test('兼容: define 函数格式一致', () => {
    const text = '(define (my-func x y) (+ x y))';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    assert.strictEqual(oldDefs[0].name, newDefs[0].name);
});

test('兼容: let 内嵌 define 同时提取', () => {
    const text = '(let ((a 1)) (define x 2))';
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    // let 绑定 a 和 define x 都被提取
    assert.strictEqual(newDefs.length, 2);
    assert.strictEqual(newDefs[0].name, 'a');
    assert.strictEqual(newDefs[1].name, 'x');
});

test('兼容: 多 define 混合格式一致', () => {
    const text = '(define x 1)\n(define y 2)\n(define (f z) (+ z 1))';
    const oldDefs = oldExtract(text);
    const { ast } = parse(text);
    const newDefs = analyze(ast).definitions;
    assert.strictEqual(oldDefs.length, newDefs.length);
    for (let i = 0; i < oldDefs.length; i++) {
        assert.strictEqual(oldDefs[i].name, newDefs[i].name);
    }
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
