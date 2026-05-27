// tests/test-help-reader.js
'use strict';

// 必须在 require 被测模块前加载 mock
require('./helpers/mock-vscode');

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const path = require('path');
const HelpReader = require('../src/commands/help-reader')._HelpReader;

const DOCS_DIR = path.normalize(path.join(__dirname, '..', 'docs', 'help'));

function createReader() {
    var r = Object.create(HelpReader.prototype);
    r.context = {
        extensionPath: path.join(__dirname, '..'),
        extensionUri: { fsPath: path.join(__dirname, '..') }
    };
    r.docsDir = { fsPath: DOCS_DIR };
    r.docsDirFsPath = DOCS_DIR;
    r.panel = undefined;
    return r;
}

// ═══ _validatePath ═══════════════════════════════════

console.log('\n_validatePath:');

test('合法路径 index.md → true', () => {
    assert.strictEqual(createReader()._validatePath('index.md'), true);
});

test('合法子目录路径 → true', () => {
    assert.strictEqual(createReader()._validatePath('getting-started.md'), true);
});

test('合法深层路径 → true', () => {
    assert.strictEqual(createReader()._validatePath('sub/dir/file.md'), true);
});

test('绝对路径 /etc/passwd → false', () => {
    assert.strictEqual(createReader()._validatePath('/etc/passwd'), false);
});

test('Windows 绝对路径 C:\\Windows\\file.md → false', () => {
    assert.strictEqual(createReader()._validatePath('C:\\Windows\\file.md'), false);
});

test('Windows 绝对路径（非 .md 也测） → false', () => {
    assert.strictEqual(createReader()._validatePath('C:\\Windows\\system32'), false);
});

test('UNC 路径 \\\\server\\share\\file.md → false', () => {
    assert.strictEqual(createReader()._validatePath('\\\\server\\share\\file.md'), false);
});

test('../ 越界 → false', () => {
    assert.strictEqual(createReader()._validatePath('../package.json'), false);
});

test('多层 ../ 越界 → false', () => {
    assert.strictEqual(createReader()._validatePath('../../etc/passwd'), false);
});

test('中间 ../ 越界 → false', () => {
    assert.strictEqual(createReader()._validatePath('foo/../../etc/passwd'), false);
});

test('非 .md 扩展名 → false', () => {
    assert.strictEqual(createReader()._validatePath('package.json'), false);
});

test('.MD 大写扩展名 → true', () => {
    assert.strictEqual(createReader()._validatePath('README.MD'), true);
});

test('空字符串 → false', () => {
    assert.strictEqual(createReader()._validatePath(''), false);
});

test('null → false', () => {
    assert.strictEqual(createReader()._validatePath(null), false);
});

test('undefined → false', () => {
    assert.strictEqual(createReader()._validatePath(undefined), false);
});

test('数字类型 → false', () => {
    assert.strictEqual(createReader()._validatePath(123), false);
});

summary();
