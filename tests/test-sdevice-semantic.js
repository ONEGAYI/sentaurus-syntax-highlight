// tests/test-sdevice-semantic.js
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// 加载测试数据
const docsPath = path.join(__dirname, '..', 'syntaxes', 'sdevice_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { buildKeywordSectionIndex, getSectionStack } = require('../src/lsp/providers/sdevice-semantic-provider');

console.log('\nsdevice-semantic — buildKeywordSectionIndex:');

test('Plot appears in multiple sections', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.has('Plot'));
    const sections = index.get('Plot');
    assert.ok(sections.has('File'), 'Plot should belong to File');
    assert.ok(sections.has('Plot'), 'Plot should belong to Plot');
    assert.ok(sections.has('Solve'), 'Plot should belong to Solve');
});

test('ElectricField appears in Physics and Plot', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.has('ElectricField'));
    const sections = index.get('ElectricField');
    assert.ok(sections.has('Physics'));
    assert.ok(sections.has('Plot'));
});

test('Non-existent keyword returns undefined', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.strictEqual(index.get('NonExistentKeyword12345'), undefined);
});

test('Index contains many keywords', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.size > 300, `Expected >300 keywords, got ${index.size}`);
});

console.log('\nsdevice-semantic — getSectionStack:');

test('empty text returns empty stack', () => {
    const stack = getSectionStack('', 0, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('no section returns empty stack', () => {
    const text = 'set x 1\nset y 2';
    const stack = getSectionStack(text, 0, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('inside File section returns [File]', () => {
    const text = 'File {\n  Plot="x"\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File', 'Solve']));
    assert.deepStrictEqual(stack, ['File']);
});

test('nested section returns multi-level stack', () => {
    const text = 'Solve {\n  Coupled {\n    Plot\n  }\n}';
    const stack = getSectionStack(text, 2, new Set(['Plot', 'File', 'Solve', 'Coupled']));
    assert.deepStrictEqual(stack, ['Solve', 'Coupled']);
});

test('outside braces returns empty stack', () => {
    const text = 'File {\n  Plot="x"\n}\nPlot {';
    const stack = getSectionStack(text, 3, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('braces inside string are ignored', () => {
    const text = 'File {\n  Plot="a{b}c"\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});

test('braces inside comments are ignored', () => {
    const text = 'File {\n  # Plot {\n  Plot="x"\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
