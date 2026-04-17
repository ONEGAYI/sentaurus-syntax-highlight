// tests/test-symbol-reference.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const SYMBOL_TABLE = {
    'sdegeo:create-rectangle': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
    'sdegeo:define-contact-set': {
        symbolParams: [
            { index: 0, role: 'def', type: 'contact' },
        ],
    },
    'sdedr:define-refinement-region': {
        symbolParams: [
            { index: 2, role: 'ref', type: 'region' },
        ],
    },
    'sde:hide-region': {
        symbolParams: [
            { index: 0, role: 'ref', type: 'region' },
        ],
    },
};

function findReferences(code, targetName, targetType) {
    const { ast } = parse(code);
    const { defs, refs } = extractSymbols(ast, code, SYMBOL_TABLE);
    const all = [...defs, ...refs];
    return all.filter(e => e.name === targetName && e.type === targetType);
}

console.log('\nsymbol-reference logic:');

test('查找 region 的所有定义和引用', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdedr:define-refinement-region "Place" "Def" "R.Si")
(sde:hide-region "R.Si")
`;
    const locations = findReferences(code, 'R.Si', 'region');
    assert.strictEqual(locations.length, 3);
    assert.strictEqual(locations.filter(l => l.role === 'def').length, 1);
    assert.strictEqual(locations.filter(l => l.role === 'ref').length, 2);
});

test('精确匹配：不同类型同名不混', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "R.Si" "R.Si")
`;
    const regionRefs = findReferences(code, 'R.Si', 'region');
    const matRefs = findReferences(code, 'R.Si', 'material');
    assert.strictEqual(regionRefs.length, 1);
    assert.strictEqual(regionRefs[0].type, 'region');
    assert.strictEqual(matRefs.length, 1);
    assert.strictEqual(matRefs[0].type, 'material');
});

test('未定义符号返回引用', () => {
    const code = `(sde:hide-region "R.NotFound")`;
    const locations = findReferences(code, 'R.NotFound', 'region');
    assert.strictEqual(locations.length, 1); // 只有引用，没有定义
});

test('查找 contact 的引用', () => {
    const code = `
(sdegeo:define-contact-set "Source" 4.0 "Blue" "solid")
`;
    const locations = findReferences(code, 'Source', 'contact');
    assert.strictEqual(locations.length, 1);
    assert.strictEqual(locations[0].role, 'def');
});

test('string-append 定义的符号可以被查找', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" (string-append "R." "Si"))
(sde:hide-region "R.Si")
`;
    const locations = findReferences(code, 'R.Si', 'region');
    assert.strictEqual(locations.length, 2); // 1 def + 1 ref
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
