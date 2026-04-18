// tests/test-region-undef-diagnostic.js
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

/** Sentaurus 内置材料名白名单（从 all_keywords.json MATERIAL 分类加载） */
const BUILTIN_MATERIALS = new Set(
    require('../syntaxes/all_keywords.json').MATERIAL || []
);

/**
 * 模拟诊断逻辑：提取 defs + refs，找出未定义的引用。
 */
function computeUndefDiagnostics(code, symbolTable) {
    const { ast } = parse(code);
    const { defs, refs } = extractSymbols(ast, code, symbolTable || SYMBOL_TABLE);
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));
    const undefs = [];
    for (const ref of refs) {
        if (ref.type === 'material' && BUILTIN_MATERIALS.has(ref.name)) continue;
        if (!definedNames.has(`${ref.type}:${ref.name}`)) {
            undefs.push(ref);
        }
    }
    return undefs;
}

console.log('\nregion-undef-diagnostic logic:');

test('引用已定义的 region → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdedr:define-refinement-region "Place" "Def" "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('引用未定义的 region → 1 个诊断', () => {
    const code = `(sde:hide-region "R.NotFound")`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'R.NotFound');
    assert.strictEqual(undefs[0].type, 'region');
});

test('不同类型同名不冲突', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "R.Si" "R.Si")
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('同名多次定义 → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Silicon" "R.Si")
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('string-append 定义后引用 → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" (string-append "R." "Si"))
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('多个未定义引用 → 多个诊断', () => {
    const code = `
(sde:hide-region "R.A")
(sde:hide-region "R.B")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 2);
});

test('contact 引用未定义 → 诊断', () => {
    const code = `(sdegeo:define-contact-set "Source" 4.0 "Blue" "solid")
(sdegeo:define-contact-set "Drain" 4.0 "Blue" "solid")`;
    const table = {
        'sdegeo:define-contact-set': {
            symbolParams: [{ index: 0, role: 'def', type: 'contact' }],
        },
    };
    // 所有都是定义，无引用，所以无未定义诊断
    const undefs = computeUndefDiagnostics(code, table);
    assert.strictEqual(undefs.length, 0);
});

test('contact 未定义引用 → 诊断', () => {
    const code = `(sdegeo:delete-contact-set "NonExist")`;
    const table = {
        'sdegeo:delete-contact-set': {
            symbolParams: [{ index: 0, role: 'ref', type: 'contact' }],
        },
    };
    const undefs = computeUndefDiagnostics(code, table);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].type, 'contact');
});

test('内置材料名引用 → 无诊断', () => {
    const code = `(sdedr:define-refinement-material "PL.1" "RD.1" "Silicon")`;
    const table = {
        'sdedr:define-refinement-material': {
            symbolParams: [{ index: 2, role: 'ref', type: 'material' }],
        },
    };
    const undefs = computeUndefDiagnostics(code, table);
    assert.strictEqual(undefs.length, 0);
});

test('非内置材料名引用 → 诊断', () => {
    const code = `(sdedr:define-refinement-material "PL.1" "RD.1" "CustomMat")`;
    const table = {
        'sdedr:define-refinement-material': {
            symbolParams: [{ index: 2, role: 'ref', type: 'material' }],
        },
    };
    const undefs = computeUndefDiagnostics(code, table);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'CustomMat');
});

test('用户定义材料覆盖内置名 → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdedr:define-refinement-material "PL.1" "RD.1" "Silicon")
`;
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
        'sdedr:define-refinement-material': {
            symbolParams: [{ index: 2, role: 'ref', type: 'material' }],
        },
    };
    const undefs = computeUndefDiagnostics(code, table);
    assert.strictEqual(undefs.length, 0);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
