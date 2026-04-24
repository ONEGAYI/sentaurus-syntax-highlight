// tests/test-scope-analyzer.js
const assert = require('assert');
const { buildScopeTree, getVisibleDefinitions } = require('../src/lsp/scope-analyzer');
const { parse } = require('../src/lsp/scheme-parser');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function treeOf(code) {
    const { ast } = parse(code);
    return buildScopeTree(ast);
}

console.log('\nbuildScopeTree:');

test('空文档产生全局作用域', () => {
    const tree = treeOf('');
    assert.strictEqual(tree.type, 'global');
    assert.strictEqual(tree.definitions.length, 0);
    assert.strictEqual(tree.children.length, 0);
});

test('全局 define 变量', () => {
    const tree = treeOf('(define x 42)');
    assert.strictEqual(tree.definitions.length, 1);
    assert.strictEqual(tree.definitions[0].name, 'x');
    assert.strictEqual(tree.definitions[0].kind, 'variable');
    assert.strictEqual(tree.children.length, 0);
});

test('全局 define 函数产生函数作用域', () => {
    const tree = treeOf('(define (f x y) (+ x y))');
    assert.strictEqual(tree.definitions.length, 1);
    assert.strictEqual(tree.definitions[0].name, 'f');
    assert.strictEqual(tree.children.length, 1);
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 2);
    assert.strictEqual(funcScope.definitions[0].name, 'x');
    assert.strictEqual(funcScope.definitions[0].kind, 'parameter');
    assert.strictEqual(funcScope.definitions[1].name, 'y');
});

test('无参数函数作用域', () => {
    const tree = treeOf('(define (f) 42)');
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 0);
});

test('let 产生 let 作用域', () => {
    const tree = treeOf('(let ((a 1) (b 2)) (+ a b))');
    assert.strictEqual(tree.children.length, 1);
    const letScope = tree.children[0];
    assert.strictEqual(letScope.type, 'let');
    assert.strictEqual(letScope.definitions.length, 2);
    assert.strictEqual(letScope.definitions[0].name, 'a');
    assert.strictEqual(letScope.definitions[1].name, 'b');
});

test('let* 产生 let 作用域', () => {
    const tree = treeOf('(let* ((x 1)) x)');
    assert.strictEqual(tree.children[0].type, 'let');
    assert.strictEqual(tree.children[0].definitions[0].name, 'x');
});

test('letrec 产生 let 作用域', () => {
    const tree = treeOf('(letrec ((f (lambda (n) n))) (f 10))');
    assert.strictEqual(tree.children[0].type, 'let');
    assert.strictEqual(tree.children[0].definitions[0].name, 'f');
});

test('do 产生 do 作用域', () => {
    const tree = treeOf('(do ((i 1 (+ i 1))) ((>= i 10)) (display i))');
    assert.strictEqual(tree.children.length, 1);
    const doScope = tree.children[0];
    assert.strictEqual(doScope.type, 'do');
    assert.strictEqual(doScope.definitions.length, 1);
    assert.strictEqual(doScope.definitions[0].name, 'i');
});

test('do 多变量作用域', () => {
    const tree = treeOf('(do ((i 0 (+ i 1)) (j 10 (- j 1))) ((= i j)) (display i))');
    const doScope = tree.children[0];
    assert.strictEqual(doScope.type, 'do');
    assert.strictEqual(doScope.definitions.length, 2);
    assert.strictEqual(doScope.definitions[0].name, 'i');
    assert.strictEqual(doScope.definitions[1].name, 'j');
});

test('函数体内嵌套 let', () => {
    const tree = treeOf('(define (calc x)\n  (let ((y (* x 2)))\n    (+ x y)))');
    assert.strictEqual(tree.children.length, 1);
    const funcScope = tree.children[0];
    assert.strictEqual(funcScope.type, 'function');
    assert.strictEqual(funcScope.definitions.length, 1);
    assert.strictEqual(funcScope.children.length, 1);
    const letScope = funcScope.children[0];
    assert.strictEqual(letScope.type, 'let');
    assert.strictEqual(letScope.definitions[0].name, 'y');
});

test('多个 define 产生多个子节点', () => {
    const tree = treeOf('(define x 1)\n(define (f a) a)\n(define y 2)');
    assert.strictEqual(tree.definitions.length, 3);
    assert.strictEqual(tree.children.length, 1);
    assert.strictEqual(tree.children[0].type, 'function');
});

console.log('\ngetVisibleDefinitions:');

test('全局位置可见全局定义', () => {
    const tree = treeOf('(define x 1)\n(define y 2)');
    const visible = getVisibleDefinitions(tree, 1);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['x', 'y']);
});

test('函数体内可见全局定义和函数参数', () => {
    const tree = treeOf('(define x 1)\n(define (f temp)\n  (+ temp x))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['f', 'temp', 'x']);
});

test('函数体内参数优先级高于全局同名', () => {
    const tree = treeOf('(define x 1)\n(define (f x)\n  x)');
    const visible = getVisibleDefinitions(tree, 3);
    const xDef = visible.find(v => v.name === 'x');
    assert.strictEqual(xDef.kind, 'parameter');
    assert.strictEqual(xDef.scopeType, 'function');
});

test('let 体内可见 let 绑定', () => {
    const tree = treeOf('(define x 1)\n(let ((y 2))\n  (+ x y))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['x', 'y']);
    const yDef = visible.find(v => v.name === 'y');
    assert.strictEqual(yDef.scopeType, 'let');
});

test('嵌套 let 中内层覆盖外层', () => {
    const tree = treeOf('(let ((x 1))\n  (let ((x 2))\n    x))');
    const visible = getVisibleDefinitions(tree, 3);
    const xDef = visible.find(v => v.name === 'x');
    assert.strictEqual(xDef.scopeType, 'let');
    assert.strictEqual(visible.filter(v => v.name === 'x').length, 1);
});

test('函数参数和 let 绑定同时可见', () => {
    const tree = treeOf('(define (f temp)\n  (let ((result (* temp 2)))\n    result))');
    const visible = getVisibleDefinitions(tree, 3);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['f', 'result', 'temp']);
    assert.strictEqual(visible.find(v => v.name === 'temp').kind, 'parameter');
    assert.strictEqual(visible.find(v => v.name === 'result').scopeType, 'let');
});

test('do 循环变量在体内可见', () => {
    const tree = treeOf('(do ((i 1 (+ i 1)))\n  ((>= i 10))\n  (display i))');
    const visible = getVisibleDefinitions(tree, 3);
    const iDef = visible.find(v => v.name === 'i');
    assert.ok(iDef, 'do 变量 i 应在体内可见');
    assert.strictEqual(iDef.scopeType, 'do');
});

test('do 变量与全局定义同时可见', () => {
    const tree = treeOf('(define x 1)\n(do ((i 0 (+ i 1))) ((= i x)) i)');
    const visible = getVisibleDefinitions(tree, 2);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['i', 'x']);
});

test('空文档无可见定义', () => {
    const tree = treeOf('');
    const visible = getVisibleDefinitions(tree, 1);
    assert.strictEqual(visible.length, 0);
});

test('行号在作用域外时只返回全局', () => {
    const tree = treeOf('(define x 1)\n(define (f a) a)');
    const visible = getVisibleDefinitions(tree, 1);
    const names = visible.map(v => v.name).sort();
    assert.deepStrictEqual(names, ['f', 'x']);
});

console.log('\ndefine + lambda 作用域（回归 define-lambda-param）:');

test('(define f (lambda ...)) 注册 lambda 参数', () => {
    const tree = treeOf('(define f (lambda (x y) (+ x y)))');
    assert.strictEqual(tree.definitions.length, 1);
    assert.strictEqual(tree.definitions[0].name, 'f');
    assert.strictEqual(tree.children.length, 1);
    const lambdaScope = tree.children[0];
    assert.strictEqual(lambdaScope.type, 'lambda');
    assert.strictEqual(lambdaScope.definitions.length, 2);
    assert.strictEqual(lambdaScope.definitions[0].name, 'x');
    assert.strictEqual(lambdaScope.definitions[0].kind, 'parameter');
    assert.strictEqual(lambdaScope.definitions[1].name, 'y');
});

test('(define f (lambda ...)) 参数在 lambda 体内可见', () => {
    const tree = treeOf('(define f (lambda (x y)\n  (+ x y)))');
    const visible = getVisibleDefinitions(tree, 2);
    const names = visible.map(v => v.name).sort();
    assert.ok(names.includes('f'), `应包含 f，实际: ${names}`);
    assert.ok(names.includes('x'), `应包含 x，实际: ${names}`);
    assert.ok(names.includes('y'), `应包含 y，实际: ${names}`);
});

test('(define f (lambda ...)) 多参数 lambda', () => {
    const tree = treeOf('(define create_trapezoid\n  (lambda (x0 y0 z0 w h)\n    (+ x0 y0)))');
    assert.strictEqual(tree.definitions[0].name, 'create_trapezoid');
    const lambdaScope = tree.children[0];
    assert.strictEqual(lambdaScope.type, 'lambda');
    assert.strictEqual(lambdaScope.definitions.length, 5);
    assert.strictEqual(lambdaScope.definitions[0].name, 'x0');
    assert.strictEqual(lambdaScope.definitions[4].name, 'h');
});

test('(define f (lambda ...)) lambda 内嵌套 let', () => {
    const tree = treeOf('(define f (lambda (x)\n  (let ((y 2))\n    (+ x y))))');
    const lambdaScope = tree.children[0];
    assert.strictEqual(lambdaScope.type, 'lambda');
    assert.strictEqual(lambdaScope.definitions.length, 1);
    assert.strictEqual(lambdaScope.definitions[0].name, 'x');
    assert.strictEqual(lambdaScope.children.length, 1);
    assert.strictEqual(lambdaScope.children[0].type, 'let');
    assert.strictEqual(lambdaScope.children[0].definitions[0].name, 'y');
});

console.log('\n空列表边界条件（回归 #110/124/139）:');

test('空列表 () 不抛出异常', () => {
    const tree = treeOf('()');
    assert.strictEqual(tree.type, 'global');
    assert.strictEqual(tree.children.length, 0);
});

test('仅含注释的列表 (; comment) 不抛出异常', () => {
    const tree = treeOf('(; comment\n)');
    assert.strictEqual(tree.type, 'global');
    assert.strictEqual(tree.children.length, 0);
});

test('空列表与 define 共存不抛出异常', () => {
    const tree = treeOf('(define x 42)\n()\n(define y 7)');
    assert.strictEqual(tree.definitions.length, 2);
    assert.strictEqual(tree.definitions[0].name, 'x');
    assert.strictEqual(tree.definitions[1].name, 'y');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
