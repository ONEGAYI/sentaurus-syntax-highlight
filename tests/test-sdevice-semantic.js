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

const { buildKeywordSectionIndex } = require('../src/lsp/providers/sdevice-semantic-provider');

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
