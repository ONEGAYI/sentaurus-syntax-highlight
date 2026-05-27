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

console.log('\n_parseToc:');

test('正常读取 toc.json 返回数组', () => {
    const reader = createReader();
    const tree = reader._parseToc();
    assert(Array.isArray(tree));
    assert(tree.length > 0);
});

test('toc.json 首项为首页', () => {
    const reader = createReader();
    const tree = reader._parseToc();
    assert.strictEqual(tree[0].file, 'index.md');
    assert.strictEqual(tree[0].title, '首页');
});

test('toc.json 包含 children 层级', () => {
    const reader = createReader();
    const tree = reader._parseToc();
    const withChildren = tree.find(n => n.children);
    assert(withChildren);
    assert(withChildren.children.length > 0);
});

console.log('\n_loadMarkedJs:');

test('正常加载 marked.min.js', () => {
    const reader = createReader();
    const js = reader._loadMarkedJs();
    assert(typeof js === 'string');
    assert(js.length > 100);
    assert(js.indexOf('marked') >= 0);
});

console.log('\n_buildHtml:');

test('HTML 包含 CSP nonce', () => {
    const reader = createReader();
    reader.panel = {
        webview: {
            cspSource: 'https://test.vscode',
            asWebviewUri: () => ({ toString: () => 'vscode-file://test' })
        }
    };
    const html = reader._buildHtml('/* test */');
    assert(html.indexOf('Content-Security-Policy') >= 0);
    assert(html.indexOf('nonce-') >= 0);
});

test('HTML 包含 sidebar-left / sidebar-right / article', () => {
    const reader = createReader();
    reader.panel = {
        webview: {
            cspSource: 'https://test.vscode',
            asWebviewUri: () => ({ toString: () => 'vscode-file://test' })
        }
    };
    const html = reader._buildHtml('/* test */');
    assert(html.indexOf('sidebar-left') >= 0);
    assert(html.indexOf('sidebar-right') >= 0);
    assert(html.indexOf('id="article"') >= 0);
});

test('marked.js 为空时 HTML 仍有效', () => {
    const reader = createReader();
    reader.panel = {
        webview: {
            cspSource: 'https://test.vscode',
            asWebviewUri: () => ({ toString: () => 'vscode-file://test' })
        }
    };
    const html = reader._buildHtml('');
    assert(html.indexOf('article') >= 0);
    assert(html.indexOf('</script>') >= 0);
});

summary();
