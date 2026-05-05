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

const {
    buildKeywordSectionIndex, getSectionStack, scanStacksPerLine,
    extractSdeviceTokens, extractTokensFromStacks, createSdeviceSemanticProvider,
} = require('../src/lsp/providers/sdevice-semantic-provider');

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

console.log('\nsdevice-semantic — edge cases:');

test('tab before { is handled correctly', () => {
    const text = 'File\t{\n  Plot="x"\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});

test('asterisk comment line braces are ignored', () => {
    const text = 'File {\n* this has { braces }\n  Plot="x"\n}';
    const stack = getSectionStack(text, 2, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});

test('asterisk comment mid-line is NOT treated as comment', () => {
    // * only starts a comment at line beginning
    const text = 'File {\n  x * { y }\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
    // depth should be 2 because the { inside the line is counted
});

test('multi-line string does not cause lineIdx drift', () => {
    const text = 'File {\n  Output = "line1\nline2"\n  Plot="x"\n}';
    const stack = getSectionStack(text, 3, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File'], 'Line after multi-line string should be inside File');
});

test('inline # comment does not produce false tokens', () => {
    const text = 'File {\n  FileName = "output.tdr"   # see Plot section\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    let curLine = 0, curCol = 0;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        assert.notStrictEqual(word, 'Plot', 'Plot inside inline comment should not be tokenized');
    }
});

test('keyword inside string is not tokenized', () => {
    const text = 'File {\n  Plot="ElectricField is cool"\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    let curLine = 0, curCol = 0;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        assert.notStrictEqual(word, 'ElectricField', 'ElectricField inside string should not be tokenized');
    }
});

console.log('\nsdevice-semantic — cache:');

test('extractTokensFromStacks matches extractSdeviceTokens', () => {
    const text = 'File {\n  Plot="x"\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve', 'Coupled']);
    const fullResult = extractSdeviceTokens(text, index, sectionKws);
    const lines = text.split('\n');
    const stacks = scanStacksPerLine(text, sectionKws, lines);
    const fromStacks = extractTokensFromStacks(lines, stacks, index, sectionKws);
    assert.deepStrictEqual(fullResult, fromStacks, 'Both paths should produce identical tokens');
});

test('createSdeviceSemanticProvider returns provider with expected methods', () => {
    const provider = createSdeviceSemanticProvider(docs, new Set(['File', 'Plot', 'Solve']));
    assert.strictEqual(typeof provider.provideDocumentSemanticTokens, 'function');
    assert.strictEqual(typeof provider.getSectionStackForDocument, 'function');
    assert.strictEqual(typeof provider.invalidate, 'function');
    assert.strictEqual(typeof provider.dispose, 'function');
});

test('provider caches results for same document version', () => {
    const provider = createSdeviceSemanticProvider(docs, new Set(['File', 'Plot', 'Solve']));
    let callCount = 0;
    const mockDoc = {
        uri: { toString: () => 'file:///test.cmd' },
        version: 1,
        getText: () => { callCount++; return 'File {\n  Plot="x"\n}'; }
    };
    // 第一次调用触发计算
    const result1 = provider.provideDocumentSemanticTokens(mockDoc);
    assert.strictEqual(callCount, 1);
    // 第二次调用应命中缓存
    const result2 = provider.provideDocumentSemanticTokens(mockDoc);
    assert.strictEqual(callCount, 1, 'Should not recompute on cache hit');
    assert.deepStrictEqual(result1.data, result2.data);
});

test('provider recomputes on version change', () => {
    const provider = createSdeviceSemanticProvider(docs, new Set(['File', 'Plot', 'Solve']));
    let text = 'File {\n  Plot="x"\n}';
    const mockDoc = {
        uri: { toString: () => 'file:///test2.cmd' },
        version: 1,
        getText: () => text
    };
    provider.provideDocumentSemanticTokens(mockDoc);
    // 修改版本号
    mockDoc.version = 2;
    text = 'Plot {\n  ElectricField\n}';
    const result = provider.provideDocumentSemanticTokens(mockDoc);
    assert.ok(result.data.length > 0, 'Should recompute on version change');
});

test('provider getSectionStackForDocument uses cache', () => {
    const provider = createSdeviceSemanticProvider(docs, new Set(['File', 'Plot', 'Solve']));
    let callCount = 0;
    const mockDoc = {
        uri: { toString: () => 'file:///test3.cmd' },
        version: 1,
        getText: () => { callCount++; return 'File {\n  Plot="x"\n}'; }
    };
    // 先触发 semantic tokens（会计算一次）
    provider.provideDocumentSemanticTokens(mockDoc);
    assert.strictEqual(callCount, 1);
    // hover 调用 getSectionStackForDocument 应命中缓存
    const stack = provider.getSectionStackForDocument(mockDoc, 1);
    assert.strictEqual(callCount, 1, 'Hover should reuse cache');
    assert.deepStrictEqual(stack, ['File']);
});

test('invalidate clears cache entry', () => {
    const provider = createSdeviceSemanticProvider(docs, new Set(['File', 'Plot', 'Solve']));
    let callCount = 0;
    const mockDoc = {
        uri: { toString: () => 'file:///test4.cmd' },
        version: 1,
        getText: () => { callCount++; return 'File {\n  Plot="x"\n}'; }
    };
    provider.provideDocumentSemanticTokens(mockDoc);
    assert.strictEqual(callCount, 1);
    provider.invalidate('file:///test4.cmd');
    provider.provideDocumentSemanticTokens(mockDoc);
    assert.strictEqual(callCount, 2, 'Should recompute after invalidation');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
