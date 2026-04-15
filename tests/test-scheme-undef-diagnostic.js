// tests/test-scheme-undef-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree, getVisibleDefinitions, getSchemeRefs } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 未定义变量检测集成测试 ===\n');

/**
 * 模拟完整的检测流程（不依赖 VSCode API）
 */
function findUndefRefs(code, knownNames) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const refs = getSchemeRefs(ast, knownNames || new Set());
    const undefs = [];

    for (const ref of refs) {
        const visible = getVisibleDefinitions(scopeTree, ref.line);
        const isVisible = visible.some(d => d.name === ref.name);
        if (!isVisible) {
            undefs.push(ref);
        }
    }
    return undefs;
}

test('全局 define 后引用不报未定义', () => {
    const code = '(define x 42)\n(+ x 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, `不应有未定义引用，实际 ${undefs.length}`);
});

test('未定义变量被检测', () => {
    const code = '(+ undefined_var 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'undefined_var');
});

test('let 绑定在 body 内可见', () => {
    const code = '(let ((x 1)) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, 'let 绑定的变量应可见');
});

test('函数参数在 body 内可见', () => {
    const code = '(define (f x) (+ x 1))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '函数参数应可见');
});

test('嵌套作用域正确', () => {
    const code = '(define x 1)\n(define (f y)\n  (let ((z (+ y 1)))\n    (+ x y z)))';
    const undefs = findUndefRefs(code, new Set(['+']));
    assert.strictEqual(undefs.length, 0, '嵌套作用域中的变量都应可见');
});

test('作用域外引用被检测', () => {
    const code = '(let ((x 1)) x)\ny';
    const undefs = findUndefRefs(code, new Set());
    const yUndefs = undefs.filter(r => r.name === 'y');
    assert.strictEqual(yUndefs.length, 1, 'y 在全局作用域未定义');
});

test('内置函数名不报未定义', () => {
    const code = '(sdegeo:create-sphere (position 0 0 0) 1.0)';
    const undefs = findUndefRefs(code, new Set(['sdegeo:create-sphere', 'position']));
    assert.strictEqual(undefs.length, 0, '内置函数名应被过滤');
});

test('白名单变量不报未定义', () => {
    const code = '(define x argc)';
    const undefs = findUndefRefs(code, new Set(['argc']));
    assert.strictEqual(undefs.length, 0, '白名单变量应被过滤');
});

test('预定义常量 PI 不报未定义', () => {
    const code = '(define r 5)\n(define area (* PI r r))';
    const undefs = findUndefRefs(code, new Set(['*', 'PI']));
    const piUndefs = undefs.filter(r => r.name === 'PI');
    assert.strictEqual(piUndefs.length, 0, 'PI 不应出现在未定义列表中');
});

test('SWB 参数替换变量 @foo@ 不报未定义', () => {
    const code = '(define x @param@)\n(define y @previous@)\n(define z @param:+2@)';
    const undefs = findUndefRefs(code, new Set());
    const swbUndefs = undefs.filter(r => /^@.+@$/.test(r.name));
    assert.strictEqual(swbUndefs.length, 0, '@...@ SWB 参数不应被检测为未定义变量');
});

test('预处理指令 #if 条件行被整体跳过', () => {
    // #if 行内是 Tcl 条件代码（如 string/equal），不应被解析为 Scheme 标识符
    const code = '#if [string/equal $env(HOME) "/home"]\n(define x 1)\n#endif';
    const undefs = findUndefRefs(code, new Set());
    // string/equal 和 $env 不应出现在未定义列表中（整行被跳过）
    const tclLeaks = undefs.filter(r =>
        r.name.includes('string') || r.name.includes('env') || r.name.startsWith('#'));
    assert.strictEqual(tclLeaks.length, 0, 'Tcl 条件代码不应泄露到 Scheme 引用检测中');
});

test('#if 块内的 Scheme 代码仍被检测', () => {
    // #if 和 #endif 之间的 Scheme 代码应正常解析
    const code = '#if 1\n(define x 1)\n#endif\n(+ x 1)';
    const undefs = findUndefRefs(code, new Set(['+']));
    const xUndefs = undefs.filter(r => r.name === 'x');
    assert.strictEqual(xUndefs.length, 0, '#if 块内的 define 仍应生效');
});

test('KEYWORD2 级别关键词不被误报', () => {
    const code = '(find-edge-id body face)\n(find-body-id edge)';
    const undefs = findUndefRefs(code, new Set(['find-edge-id', 'find-body-id']));
    const kwUndefs = undefs.filter(r => r.name === 'find-edge-id' || r.name === 'find-body-id');
    assert.strictEqual(kwUndefs.length, 0, 'KEYWORD2 关键词不应被检测为未定义变量');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
