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

const { buildKeywordSectionIndex, getSectionStack, extractSdeviceTokens } = require('../src/lsp/providers/sdevice-semantic-provider');

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

console.log('\nsdevice-semantic — extractSdeviceTokens:');

test('Plot inside File is sectionKeyword (type 1)', () => {
    const text = 'File {\n  Plot="x"\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve', 'Coupled']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    assert.ok(data.length > 0, 'Should produce tokens');
    let curLine = 0, curCol = 0;
    let foundFileToken = false, foundPlotToken = false;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'File') {
            assert.strictEqual(typeIdx, 0, 'File should be sectionName (type 0)');
            foundFileToken = true;
        }
        if (word === 'Plot' && curLine === 1) {
            assert.strictEqual(typeIdx, 1, 'Plot inside File should be sectionKeyword (type 1)');
            foundPlotToken = true;
        }
    }
    assert.ok(foundFileToken, 'Should find File token');
    assert.ok(foundPlotToken, 'Should find Plot token inside File');
});

test('Top-level Plot is sectionName (type 0)', () => {
    const text = 'Plot {\n  ElectricField\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    let curLine = 0, curCol = 0;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'Plot' && curLine === 0) {
            assert.strictEqual(typeIdx, 0, 'Top-level Plot should be sectionName (type 0)');
        }
    }
});

test('Plot inside nested Solve>Coupled is sectionKeyword', () => {
    const text = 'Solve {\n  Coupled {\n    Plot\n  }\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve', 'Coupled']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    let curLine = 0, curCol = 0;
    let foundPlotToken = false;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'Plot' && curLine === 2) {
            assert.strictEqual(typeIdx, 1, 'Plot inside Coupled should be sectionKeyword');
            foundPlotToken = true;
        }
    }
    assert.ok(foundPlotToken, 'Should find Plot token inside Coupled');
});

test('Non-keyword text produces no tokens', () => {
    const text = 'set x 1\nset y 2';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    assert.strictEqual(data.length, 0, 'No tokens for non-keyword text');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
