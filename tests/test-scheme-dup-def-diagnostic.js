// tests/test-scheme-dup-def-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { buildScopeTree } = require('../src/lsp/scope-analyzer');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== Scheme 重复定义检测测试 ===\n');

/**
 * 构建预处理指令分支映射（与生产代码逻辑一致）。
 */
function buildPpBranchMap(text) {
    const map = new Map();
    const lines = text.split('\n');
    const stack = [];
    let nextId = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        if (/^#(if|ifdef|ifndef)\b/.test(line)) {
            stack.push({ branchId: nextId++ });
        } else if (/^#(elif|else)\b/.test(line)) {
            if (stack.length > 0) stack[stack.length - 1].branchId = nextId++;
        } else if (/^#endif\b/.test(line)) {
            if (stack.length > 0) stack.pop();
        }

        if (stack.length > 0) {
            map.set(lineNum, stack[stack.length - 1].branchId);
        }
    }
    return map;
}

/**
 * 从 scopeTree 中检测同一作用域内的重复定义（含条件分支感知）。
 * 返回重复项数组，每项: { name, line, firstLine, scopeType }
 */
function findDuplicateDefs(code) {
    const { ast } = parse(code);
    if (!ast) return [];

    const scopeTree = buildScopeTree(ast);
    const ppBranchMap = buildPpBranchMap(code);
    const duplicates = [];

    function getBranchKey(def) {
        const parts = [];
        if (def.condGroup !== undefined) {
            parts.push(`c:${def.condGroup}:${def.condBranch}`);
        }
        if (ppBranchMap) {
            const ppBranch = ppBranchMap.get(def.line);
            if (ppBranch !== undefined) {
                parts.push(`p:${ppBranch}`);
            }
        }
        return parts.length > 0 ? parts.join('|') : '';
    }

    function walkScope(scope) {
        const seen = new Map(); // composite key → first definition
        for (const def of scope.definitions) {
            const branchKey = getBranchKey(def);
            const key = `${def.name}@${branchKey}`;
            if (seen.has(key)) {
                const first = seen.get(key);
                duplicates.push({
                    name: def.name,
                    line: def.line,
                    firstLine: first.line,
                    scopeType: scope.type,
                });
            } else {
                seen.set(key, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return duplicates;
}

// --- 测试用例 ---

test('全局作用域无重复定义不报', () => {
    const code = '(define x 1)\n(define y 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0);
});

test('全局作用域重复 define 变量被检测', () => {
    const code = '(define x 1)\n(define x 2)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].firstLine, 1, '首次定义行号应为 1');
    assert.strictEqual(dups[0].line, 2, '重复定义行号应为 2');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('全局作用域重复 define 函数被检测', () => {
    const code = '(define (f x) (+ x 1))\n(define (f y) (+ y 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
    assert.strictEqual(dups[0].scopeType, 'global');
});

test('函数体内重复 define 被检测', () => {
    const code = '(define (f)\n  (define a 1)\n  (define a 2)\n  a)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'function');
});

test('let 绑定列表中重复变量被检测', () => {
    const code = '(let ((x 1) (x 2)) (+ x 1))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('不同作用域同名不报告（shadowing 正常）', () => {
    const code = '(define x 1)\n(define (f)\n  (define x 2)\n  x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, '不同作用域的同名定义（shadowing）不应报重复');
});

test('lambda 参数和外部 define 同名不报告', () => {
    const code = '(define x 1)\n(define (f) ((lambda (x) (+ x 1)) 2))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'lambda 参数 shadow 外部定义不应报');
});

test('同一作用域三次重复定义报两次', () => {
    const code = '(define x 1)\n(define x 2)\n(define x 3)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 2, '三次定义应报两个重复');
    assert.strictEqual(dups[0].line, 2, '第二个 x 行号应为 2');
    assert.strictEqual(dups[1].line, 3, '第三个 x 行号应为 3');
});

test('全局多次重复函数定义被检测', () => {
    const code = '(define (my-func) 1)\n(define other 42)\n(define (my-func x) x)';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'my-func');
});

test('let* 绑定列表中重复变量被检测', () => {
    const code = "(let* ((a 1) (a 2)) (+ a 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'a');
    assert.strictEqual(dups[0].scopeType, 'let');
});

test('letrec 绑定列表中重复变量被检测', () => {
    const code = "(letrec ((f (lambda (x) x)) (f (lambda (y) y))) (f 1))";
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0].name, 'f');
});

// --- 条件分支测试 ---

test('if 分支内同名 define 不报（consequent/alternative）', () => {
    const code = '(if cond\n  (begin (define x 1))\n  (begin (define x 2)))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'if 不同分支中的同名定义不应报重复');
});

test('if 分支内同一分支重复 define 仍被检测', () => {
    const code = '(if cond\n  (begin (define x 1) (define x 2))\n  (begin (define x 3)))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1, '同一分支内的重复定义应被检测');
    assert.strictEqual(dups[0].name, 'x');
    assert.strictEqual(dups[0].line, 2, '重复定义在 consequent 分支内');
});

test('cond 分支内同名 define 不报', () => {
    const code = '(cond\n  (c1 (define x 1))\n  (c2 (define x 2))\n  (else (define x 3)))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'cond 不同分支中的同名定义不应报重复');
});

test('case 分支内同名 define 不报', () => {
    const code = '(case val\n  ((a) (define x 1))\n  ((b) (define x 2)))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, 'case 不同分支中的同名定义不应报重复');
});

test('#if 块内同名 define 不报', () => {
    const code = '#if NMOS\n(define x 1)\n#else\n(define x 2)\n#endif';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, '#if 不同分支中的同名定义不应报重复');
});

test('#if 嵌套块内同名 define 不报', () => {
    const code = '#if 0\n  #if COND\n(define x 1)\n  #else\n(define x 2)\n  #endif\n#endif\n(if test\n  (define x 3)\n  (define x 4))';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 0, '#if 和 if 混合场景不应报重复');
});

test('#if 块内同分支重复 define 仍被检测', () => {
    const code = '#if 1\n(define x 1)\n(define x 2)\n#endif';
    const dups = findDuplicateDefs(code);
    assert.strictEqual(dups.length, 1, '#if 同一分支内的重复定义应被检测');
    assert.strictEqual(dups[0].name, 'x');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
