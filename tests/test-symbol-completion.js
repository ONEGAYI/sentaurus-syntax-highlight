// tests/test-symbol-completion.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols } = require('../src/lsp/symbol-index');
const dispatcher = require('../src/lsp/semantic-dispatcher');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
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

/**
 * 模拟补全逻辑：给定代码和光标位置，确定需要补全的符号类型，
 * 然后返回匹配的已定义符号名称列表。
 */
function computeCompletions(code, line, column) {
    const { ast } = parse(code);
    const lineStarts = computeLineStarts(code);
    const result = dispatcher.dispatch(ast, line, column, {}, lineStarts);
    if (!result) return [];
    const { functionName, activeParam } = result;
    const config = SYMBOL_TABLE[functionName];
    if (!config || !config.symbolParams) return [];

    const matching = config.symbolParams.find(p => p.index === activeParam);
    if (!matching) return [];

    const { defs } = extractSymbols(ast, code, SYMBOL_TABLE);
    const targetType = matching.type;
    const names = new Set();
    const completions = [];
    for (const d of defs) {
        if (d.type === targetType && !names.has(d.name)) {
            names.add(d.name);
            completions.push({ name: d.name, type: d.type, line: d.line });
        }
    }
    return completions;
}

console.log('\nsymbol-completion logic:');

test('region ref 参数位置补全已定义的 region', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Oxide" "R.Ox")
(sdedr:define-refinement-region "Place" "Def" "R.Si")
`;
    // 光标在最后一行 "R.Si" 上（第3个参数 = activeParam 2，对应 region ref）
    // sdedr:define-refinement-region 的第3个参数（index 2）是 region ref
    // 但 "R.Si" 之前还有 region defs，所以期望看到 R.Si 和 R.Ox
    const completions = computeCompletions(code, 4, 46);
    assert.strictEqual(completions.length, 2);
    const names = completions.map(c => c.name);
    assert.ok(names.includes('R.Si'));
    assert.ok(names.includes('R.Ox'));
});

test('region 参数位置不补全 material', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sde:hide-region "R.Si")
`;
    // 光标在 "R.Si" 上，activeParam=0，对应 sde:hide-region 的 region ref
    const completions = computeCompletions(code, 3, 17);
    assert.ok(completions.every(c => c.type === 'region'));
    assert.strictEqual(completions.length, 1);
    assert.strictEqual(completions[0].name, 'R.Si');
});

test('非符号参数位置无补全', () => {
    const code = `(sdegeo:create-rectangle (position 0 0 0))`;
    const completions = computeCompletions(code, 1, 30);
    assert.strictEqual(completions.length, 0);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
