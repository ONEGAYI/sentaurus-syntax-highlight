# Webview 帮助阅读器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 WebviewPanel 的自定义帮助文档阅读器，替代内置 Markdown Preview，提供左侧 toc 导航 + 搜索、右侧文章大纲、主题适配等功能。

**Architecture:** 单模块 `src/commands/help-reader.js`（~500行），Extension 侧负责路径校验/文件读取/消息分发，Webview 侧负责 Markdown 渲染（内联 marked.js）/DOM 处理/搜索/大纲/状态持久化。CSS/HTML/JS 定义为模块级字符串常量，`_buildHtml` 组装为完整 HTML。消息协议为 postMessage 双向通信，CSP 使用 nonce 保护。Webview 端 JS 使用字符串拼接（避免模板字面量嵌套冲突）。

**Tech Stack:** VSCode WebviewPanel API, marked.js (内联), CommonJS, crypto (nonce)

**设计规范:** `docs/superpowers/specs/2026-05-27-help-reader-design.md` (v3.1)

---

## File Structure

```
创建:
  media/marked.min.js                ← 内置 marked.js (~20KB)
  docs/help/index.md                 ← 首页（从 docs/Built-in Help/ 迁移）
  docs/help/toc.json                 ← 导航目录声明
  src/commands/help-reader.js        ← 主模块（Extension + Webview HTML 模板）
  tests/test-help-reader.js          ← 单元测试

修改:
  src/extension.js:598-604           ← 替换内联命令为模块导入
  .vscodeignore                      ← 排除 docs/ 但保留 docs/help/**

删除:
  docs/Built-in Help/                ← 迁移后删除
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `docs/help/index.md`
- Create: `docs/help/toc.json`
- Create: `media/marked.min.js`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p docs/help
mkdir -p media
```

- [ ] **Step 2: 迁移 index.md**

将 `docs/Built-in Help/index.md` 复制到 `docs/help/index.md`：

```bash
cp "docs/Built-in Help/index.md" docs/help/index.md
```

- [ ] **Step 3: 创建 toc.json**

创建 `docs/help/toc.json`：

```json
[
  { "title": "首页", "file": "index.md" },
  {
    "title": "入门指南",
    "children": [
      { "title": "快速开始", "file": "getting-started.md" },
      { "title": "安装配置", "file": "installation.md" }
    ]
  },
  {
    "title": "功能特性",
    "children": [
      { "title": "语法高亮", "file": "syntax-highlighting.md" },
      { "title": "自动补全", "file": "completion.md" },
      { "title": "代码片段", "file": "snippets.md" }
    ]
  },
  {
    "title": "SDEVICE PAR",
    "children": [
      { "title": "参数补全", "file": "sdevicepar.md" }
    ]
  },
  {
    "title": "常见问题",
    "children": [
      { "title": "FAQ", "file": "faq.md" }
    ]
  }
]
```

- [ ] **Step 4: 下载 marked.min.js**

从 CDN 下载 marked.js minified 版本到 `media/`：

```bash
curl -sL https://cdn.jsdelivr.net/npm/marked@12/marked.min.js -o media/marked.min.js
```

验证文件大小应在 15-30KB 之间：

```bash
wc -c media/marked.min.js
```

> **注意：** marked v12 兼容 `marked.parse()` 和 `marked.use({ renderer })` API。MIT license，需在 README 或 third-party notices 中注明。

- [ ] **Step 5: 验证文件结构**

```bash
ls -la docs/help/ media/marked.min.js
```

期望：`docs/help/index.md`、`docs/help/toc.json`、`media/marked.min.js` 均存在。

- [ ] **Step 6: 提交**

```bash
git add docs/help/ media/marked.min.js
git commit -m "chore: 帮助阅读器脚手架 — docs/help/ 目录 + marked.js + toc.json

- 迁移 docs/Built-in Help/index.md → docs/help/index.md
- 创建 docs/help/toc.json 导航目录声明
- 下载 marked.js v12 minified 到 media/"
```

---

### Task 2: _validatePath 路径校验 (TDD)

**Files:**
- Create: `tests/test-help-reader.js`
- Create: `src/commands/help-reader.js`（仅 `_validatePath` 和类骨架）

此 Task 建立文件并实现路径安全校验——整个阅读器的安全基础。

- [ ] **Step 1: 编写 _validatePath 测试**

创建 `tests/test-help-reader.js`：

```js
// tests/test-help-reader.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const path = require('path');

// 被测模块在 Task 3 才完整，此处仅测试 _validatePath
// 通过创建最小对象模拟 HelpReader 实例
const HelpReader = require('../src/commands/help-reader')._HelpReader;

const DOCS_DIR = path.normalize(path.join(__dirname, '..', 'docs', 'help'));

function createReader() {
    const r = Object.create(HelpReader.prototype);
    r.docsDirFsPath = DOCS_DIR;
    return r;
}

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

test('绝对路径 → false', () => {
    assert.strictEqual(createReader()._validatePath('/etc/passwd'), false);
});

test('Windows 绝对路径 → false', () => {
    assert.strictEqual(createReader()._validatePath('C:\\Windows\\system32'), false);
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

test('指向 docsDir 自身（无文件名）→ false', () => {
    // 空字符串或 "." 均不合法
    assert.strictEqual(createReader()._validatePath(''), false);
});

test('docsDir 外的兄弟目录 docs2 → false', () => {
    // 路径解析到 docs2 而非 docs/help
    const rel = path.relative(DOCS_DIR, path.resolve(DOCS_DIR, '..', '..', package_json_path()));
    // 简化测试：直接用 ../
    assert.strictEqual(createReader()._validatePath('../other/file.md'), false);
});

function package_json_path() { return 'package.json'; }

summary();
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-help-reader.js
```

期望：FAIL（`Cannot find module '../src/commands/help-reader'`）

- [ ] **Step 3: 创建 help-reader.js 骨架 + _validatePath**

创建 `src/commands/help-reader.js`：

```js
// src/commands/help-reader.js
'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ═══════════════════════════════════════
// Webview 模板字符串常量（后续 Task 逐步填充）
// ═══════════════════════════════════════

const CSS = '';    // Task 4 填充
const HTML_BODY = '';  // Task 4 填充
const WEBVIEW_JS = ''; // Task 5-9 逐步填充

// ═══════════════════════════════════════
// HelpReader Class
// ═══════════════════════════════════════

class HelpReader {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this.context = context;
        this.docsDir = vscode.Uri.joinPath(context.extensionUri, 'docs', 'help');
        this.docsDirFsPath = path.normalize(
            typeof this.docsDir.fsPath === 'string' ? this.docsDir.fsPath : this.docsDir.path
        );
        /** @type {vscode.WebviewPanel | undefined} */
        this.panel = undefined;
    }

    register() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('sentaurus.openHelp', () => this.show())
        );
    }

    // ── 路径安全校验 ──────────────────────

    /**
     * 校验文件路径是否在 docsDir 内且为 .md 文件。
     * 使用 path.relative 边界检查，防止 `../` 越界。
     * @param {any} file
     * @returns {boolean}
     */
    _validatePath(file) {
        if (!file || typeof file !== 'string') return false;
        if (path.isAbsolute(file)) return false;
        const resolved = path.resolve(this.docsDirFsPath, file);
        const rel = path.relative(this.docsDirFsPath, resolved);
        if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
        if (!rel.toLowerCase().endsWith('.md')) return false;
        return true;
    }
}

function register(context) {
    const reader = new HelpReader(context);
    reader.register();
}

module.exports = { register, _HelpReader: HelpReader };
```

> **注意：** `module.exports` 额外导出 `_HelpReader` 用于测试。下划线前缀表示内部 API。

- [ ] **Step 4: 运行测试确认通过**

```bash
node tests/test-help-reader.js
```

期望：所有 15 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add tests/test-help-reader.js src/commands/help-reader.js
git commit -m "feat(help-reader): _validatePath 路径安全校验 (TDD)

使用 path.relative 边界检查防止 ../ 越界。
仅允许 docsDir 内的 .md 文件（不区分大小写）。
拒绝绝对路径、空值、非字符串类型。
导出 _HelpReader 类用于单元测试。"
```

---

### Task 3: Extension 侧完整实现

**Files:**
- Modify: `src/commands/help-reader.js`

在此 Task 中完成所有 Extension 侧方法（非 HTML 模板部分）。

- [ ] **Step 1: 添加 show、_loadMarkedJs、_parseToc、_sendToc、_sendDocument、_handleMessage 方法**

在 `HelpReader` 类中，`_validatePath` 方法之后，添加以下方法。`register()` 方法之前插入 `show()`：

```js
    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Active);
            return;
        }
        this.panel = vscode.window.createWebviewPanel(
            'sentaurusHelp', 'Sentaurus Help', vscode.ViewColumn.Active, {
                enableScripts: true,
                enableFindWidget: true,
                retainContextWhenHidden: false,
                localResourceRoots: [this.docsDir]
            }
        );
        this.panel.onDidDispose(() => { this.panel = undefined; });

        const markedJs = this._loadMarkedJs();
        this.panel.webview.html = this._buildHtml(markedJs);
        this.panel.webview.onDidReceiveMessage(msg => this._handleMessage(msg));
    }
```

在 `_validatePath` 之后添加：

```js
    _loadMarkedJs() {
        try {
            const mediaDir = path.join(
                typeof this.context.extensionPath === 'string'
                    ? this.context.extensionPath
                    : this.context.extensionUri.fsPath,
                'media'
            );
            return fs.readFileSync(path.join(mediaDir, 'marked.min.js'), 'utf8');
        } catch (e) {
            console.warn('[help-reader] marked.min.js not found:', e.message);
            return '';
        }
    }

    _buildHtml(markedJs) {
        const nonce = crypto.randomBytes(16).toString('hex');
        const csp = [
            "default-src 'none'",
            'img-src ' + this.panel.webview.cspSource + ' https: data:',
            'style-src ' + this.panel.webview.cspSource + " 'unsafe-inline'",
            "script-src 'nonce-" + nonce + "'"
        ].join('; ');

        return '<!DOCTYPE html>'
            + '<html lang="zh-CN"><head>'
            + '<meta charset="UTF-8">'
            + '<meta http-equiv="Content-Security-Policy" content="' + csp + '">'
            + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            + '<style>' + CSS + '</style>'
            + '</head><body>'
            + HTML_BODY
            + '<script nonce="' + nonce + '">' + markedJs + '</script>'
            + '<script nonce="' + nonce + '">' + WEBVIEW_JS + '</script>'
            + '</body></html>';
    }

    _parseToc() {
        try {
            const tocPath = path.join(this.docsDirFsPath, 'toc.json');
            return JSON.parse(fs.readFileSync(tocPath, 'utf8'));
        } catch (e) {
            console.warn('[help-reader] toc.json load failed:', e.message);
            return [];
        }
    }

    _sendToc() {
        const tree = this._parseToc();
        this.panel.webview.postMessage({ type: 'toc', tree: tree });
    }

    _sendDocument(file, anchor) {
        if (!this._validatePath(file)) {
            console.warn('[help-reader] rejected path:', file);
            return;
        }
        try {
            const filePath = path.join(this.docsDirFsPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const docsBaseUri = this.panel.webview.asWebviewUri(this.docsDir).toString();
            this.panel.webview.postMessage({
                type: 'docContent',
                content: content,
                file: file,
                docsBaseUri: docsBaseUri,
                anchor: anchor || undefined
            });
        } catch (e) {
            vscode.window.showErrorMessage('帮助文档加载失败: ' + file);
            this.panel.webview.postMessage({
                type: 'error',
                message: '无法加载文档: ' + file,
                file: file
            });
        }
    }

    _handleMessage(msg) {
        switch (msg.type) {
            case 'ready':
                this._sendToc();
                this._sendDocument(msg.restoreFile || 'index.md');
                break;
            case 'openDoc':
                this._sendDocument(msg.file, msg.anchor);
                break;
            case 'openExternal':
                if (/^https:/i.test(msg.href) || /^mailto:/i.test(msg.href)) {
                    vscode.env.openExternal(vscode.Uri.parse(msg.href));
                }
                break;
        }
    }
```

> **注意：** `_buildHtml` 使用字符串拼接而非模板字面量——因为 CSS/HTML_BODY/WEBVIEW_JS 常量中的内容可能包含 `${}` 表达式，模板字面量会意外插值。CSP nonce 通过字符串拼接注入。

- [ ] **Step 2: 运行现有测试确认无回归**

```bash
node tests/test-help-reader.js
```

期望：所有测试通过（仅测试 _validatePath，其他方法尚未被测试覆盖）。

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Extension 侧完整实现

- show(): 单例 panel 管理 + reveal/dispose 生命周期
- _loadMarkedJs(): 读取内联 marked.js，缺失时返回空字符串
- _buildHtml(): CSP nonce + HTML 组装（模板常量待填充）
- _parseToc(): 读取 toc.json，失败返回空数组
- _sendDocument(): 路径校验 + 文件读取 + docsBaseUri 发送
- _handleMessage(): ready/openDoc/openExternal 消息分发
- openExternal 仅允许 https: 和 mailto: 协议"
```

---

### Task 4: Webview HTML 结构 + CSS

**Files:**
- Modify: `src/commands/help-reader.js`（CSS 和 HTML_BODY 常量）

- [ ] **Step 1: 填充 CSS 常量**

将文件顶部的 `const CSS = '';` 替换为以下完整 CSS：

```js
const CSS = [
    '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
    '',
    'body {',
    '  display: flex;',
    '  height: 100vh;',
    '  overflow: hidden;',
    '  font-family: var(--vscode-font-family);',
    '  font-size: var(--vscode-font-size);',
    '  color: var(--vscode-foreground);',
    '  background: var(--vscode-editor-background);',
    '}',
    '',
    '/* ── Sidebars ──────────────────────── */',
    'aside {',
    '  display: flex;',
    '  flex-direction: column;',
    '  background: var(--vscode-sideBar-background);',
    '  border-right: 1px solid var(--vscode-widget-border, transparent);',
    '  overflow: hidden;',
    '  transition: width 0.2s ease, min-width 0.2s ease;',
    '}',
    'aside.collapsed { width: 0 !important; min-width: 0 !important; border: none; }',
    '',
    '#sidebar-left { width: 220px; min-width: 220px; }',
    '#sidebar-right { width: 180px; min-width: 180px; border-right: none; border-left: 1px solid var(--vscode-widget-border, transparent); }',
    '',
    '.sidebar-header {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 8px 10px;',
    '  border-bottom: 1px solid var(--vscode-widget-border, transparent);',
    '  flex-shrink: 0;',
    '}',
    '.sidebar-title {',
    '  font-weight: 600;',
    '  font-size: 11px;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.5px;',
    '  color: var(--vscode-descriptionForeground);',
    '  white-space: nowrap;',
    '}',
    '.toggle-btn {',
    '  background: none;',
    '  border: none;',
    '  color: var(--vscode-descriptionForeground);',
    '  cursor: pointer;',
    '  padding: 2px 6px;',
    '  border-radius: 3px;',
    '  font-size: 12px;',
    '  line-height: 1;',
    '}',
    '.toggle-btn:hover { background: var(--vscode-list-hoverBackground); }',
    '.toggle-btn:focus { outline: 1px solid var(--vscode-focusBorder); }',
    '',
    '.sidebar-body {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  overflow-x: hidden;',
    '  padding: 4px 0;',
    '}',
    '',
    '/* ── Search ───────────────────────── */',
    '.search-section { padding: 6px 8px; }',
    '#search-input {',
    '  width: 100%;',
    '  padding: 4px 6px;',
    '  background: var(--vscode-input-background);',
    '  border: 1px solid var(--vscode-input-border, transparent);',
    '  color: var(--vscode-foreground);',
    '  border-radius: 2px;',
    '  font-size: var(--vscode-font-size);',
    '}',
    '#search-input:focus { outline: 1px solid var(--vscode-focusBorder); border-color: transparent; }',
    '#search-input::placeholder { color: var(--vscode-descriptionForeground); }',
    '',
    '#search-controls {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 2px;',
    '  margin-top: 4px;',
    '  font-size: 11px;',
    '  color: var(--vscode-descriptionForeground);',
    '}',
    '#search-count { flex: 1; }',
    '#search-controls button {',
    '  background: none;',
    '  border: none;',
    '  color: var(--vscode-foreground);',
    '  cursor: pointer;',
    '  padding: 2px 5px;',
    '  border-radius: 2px;',
    '  font-size: 11px;',
    '}',
    '#search-controls button:hover:not(:disabled) { background: var(--vscode-list-hoverBackground); }',
    '#search-controls button:disabled { opacity: 0.4; cursor: default; }',
    '#search-controls button:focus { outline: 1px solid var(--vscode-focusBorder); }',
    '',
    '/* ── Nav Tree ─────────────────────── */',
    '#nav-tree { padding: 0 4px; }',
    '.nav-item {',
    '  display: block;',
    '  padding: 3px 8px;',
    '  border-radius: 3px;',
    '  cursor: pointer;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  color: var(--vscode-foreground);',
    '  font-size: var(--vscode-font-size);',
    '}',
    '.nav-item:hover { background: var(--vscode-list-hoverBackground); }',
    '.nav-item.active {',
    '  background: var(--vscode-list-activeSelectionBackground);',
    '  color: var(--vscode-list-activeSelectionForeground);',
    '}',
    '.nav-group { padding-left: 12px; }',
    '.nav-group-title {',
    '  padding: 4px 8px;',
    '  font-weight: 600;',
    '  font-size: 11px;',
    '  color: var(--vscode-descriptionForeground);',
    '  white-space: nowrap;',
    '}',
    '',
    '/* ── Content ──────────────────────── */',
    '#content {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  padding: 20px 32px;',
    '  line-height: 1.6;',
    '  min-width: 0;',
    '}',
    '',
    '#article h1, #article h2, #article h3, #article h4 {',
    '  margin-top: 1.2em;',
    '  margin-bottom: 0.4em;',
    '  line-height: 1.3;',
    '}',
    '#article h1 { font-size: 1.6em; }',
    '#article h2 { font-size: 1.3em; }',
    '#article h3 { font-size: 1.1em; }',
    '#article h4 { font-size: 1.0em; }',
    '',
    '#article p { margin-bottom: 0.8em; }',
    '#article a { color: var(--vscode-textLink-foreground); text-decoration: none; }',
    '#article a:hover { text-decoration: underline; }',
    '#article code {',
    '  background: var(--vscode-textCodeBlock-background);',
    '  padding: 1px 4px;',
    '  border-radius: 3px;',
    '  font-size: 0.9em;',
    '}',
    '#article pre {',
    '  background: var(--vscode-textCodeBlock-background);',
    '  padding: 12px;',
    '  border-radius: 4px;',
    '  overflow-x: auto;',
    '  margin: 0.8em 0;',
    '}',
    '#article pre code { background: none; padding: 0; }',
    '#article blockquote {',
    '  border-left: 3px solid var(--vscode-textLink-foreground);',
    '  padding-left: 12px;',
    '  margin: 0.8em 0;',
    '  color: var(--vscode-descriptionForeground);',
    '}',
    '#article table { border-collapse: collapse; margin: 0.8em 0; width: 100%; }',
    '#article th, #article td {',
    '  border: 1px solid var(--vscode-widget-border, #444);',
    '  padding: 6px 10px;',
    '  text-align: left;',
    '}',
    '#article th { font-weight: 600; }',
    '#article ul, #article ol { padding-left: 24px; margin: 0.5em 0; }',
    '#article img { max-width: 100%; height: auto; }',
    '#article hr { border: none; border-top: 1px solid var(--vscode-widget-border, #444); margin: 1.2em 0; }',
    '',
    '/* ── Outline ──────────────────────── */',
    '#outline { padding: 0 4px; }',
    '.outline-item {',
    '  display: block;',
    '  padding: 2px 8px;',
    '  border-radius: 3px;',
    '  cursor: pointer;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  color: var(--vscode-descriptionForeground);',
    '  font-size: 12px;',
    '}',
    '.outline-item:hover { background: var(--vscode-list-hoverBackground); color: var(--vscode-foreground); }',
    '.outline-item.active {',
    '  background: var(--vscode-list-activeSelectionBackground);',
    '  color: var(--vscode-list-activeSelectionForeground);',
    '}',
    '',
    '/* ── Search Highlight ─────────────── */',
    'mark.hit {',
    '  background: var(--vscode-editor-findMatchBackground, #515c6a);',
    '  color: inherit;',
    '  border-radius: 2px;',
    '}',
    'mark.hit.current {',
    '  background: var(--vscode-editor-findMatchHighlightBackground, #ea5c0055);',
    '  outline: 2px solid var(--vscode-editor-findMatchBorder, #ea5c00);',
    '}',
    '',
    '/* ── Error / Empty States ─────────── */',
    '.help-error { color: var(--vscode-errorForeground); padding: 16px; }',
    '.help-empty { color: var(--vscode-descriptionForeground); padding: 16px; text-align: center; }',
].join('\n');
```

- [ ] **Step 2: 填充 HTML_BODY 常量**

将 `const HTML_BODY = '';` 替换为：

```js
const HTML_BODY = [
    '<aside id="sidebar-left" role="navigation" aria-label="文档导航">',
    '  <div class="sidebar-header">',
    '    <span class="sidebar-title">导航</span>',
    '    <button class="toggle-btn" data-target="sidebar-left" aria-label="折叠导航栏">◀</button>',
    '  </div>',
    '  <div class="sidebar-body">',
    '    <div class="search-section">',
    '      <input id="search-input" type="text" placeholder="搜索文档..." aria-label="搜索文档内容">',
    '      <div id="search-controls">',
    '        <span id="search-count" aria-live="polite"></span>',
    '        <button id="btn-prev" aria-label="上一个匹配" disabled>▲</button>',
    '        <button id="btn-next" aria-label="下一个匹配" disabled>▼</button>',
    '        <button id="btn-clear" aria-label="清除搜索" disabled>✕</button>',
    '      </div>',
    '    </div>',
    '    <nav id="nav-tree" role="tree"></nav>',
    '  </div>',
    '</aside>',
    '',
    '<main id="content" role="document">',
    '  <article id="article">加载中...</article>',
    '</main>',
    '',
    '<aside id="sidebar-right" role="navigation" aria-label="文章大纲">',
    '  <div class="sidebar-header">',
    '    <button class="toggle-btn" data-target="sidebar-right" aria-label="折叠大纲栏">◀</button>',
    '    <span class="sidebar-title">大纲</span>',
    '  </div>',
    '  <div class="sidebar-body">',
    '    <div id="outline" role="tree"></div>',
    '  </div>',
    '</aside>'
].join('\n');
```

> **Unicode 转义：** `◀` = ◀、`▲` = ▲、`▼` = ▼、`✕` = ✕。使用转义而非直接字符，避免编码问题。

- [ ] **Step 3: 验证语法无误**

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK: module loaded, exports:', Object.keys(m))"
```

期望：`OK: module loaded, exports: [ 'register', '_HelpReader' ]`

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview HTML 结构 + 完整 CSS

三栏布局：左侧导航+搜索 / 中间文章内容 / 右侧大纲。
全部使用 VSCode CSS 变量适配深色/浅色主题。
CSP-friendly：无外部字体/图片引用。"
```

---

### Task 5: Webview JS — 初始化 + Markdown 渲染 + DOM 清理

**Files:**
- Modify: `src/commands/help-reader.js`（WEBVIEW_JS 常量）

此 Task 填充 Webview JS 的核心渲染管线：消息处理 → marked 渲染 → DOM 清理 → heading id → baseArticleHtml 快照。

- [ ] **Step 1: 填充 WEBVIEW_JS 常量（初始化 + 消息处理 + Markdown 渲染）**

将 `const WEBVIEW_JS = '';` 替换为：

```js
var WEBVIEW_JS = [
'// ═══ Webview JS ═══════════════════════════════════════════════',
'(function() {',
'  "use strict";',
'',
'  var vscodeApi = acquireVsCodeApi();',
'',
'  // ── State ──────────────────────────────────────────────────',
'  var currentFile = "";',
'  var docsBaseUri = "";',
'  var baseArticleHtml = "";',
'  var searchHits = [];',
'  var currentHitIndex = -1;',
'  var searchQuery = "";',
'  var outlineObserver = null;',
'',
'  // ── DOM refs ───────────────────────────────────────────────',
'  var article = document.getElementById("article");',
'  var contentEl = document.getElementById("content");',
'  var searchInput = document.getElementById("search-input");',
'  var searchCount = document.getElementById("search-count");',
'  var btnPrev = document.getElementById("btn-prev");',
'  var btnNext = document.getElementById("btn-next");',
'  var btnClear = document.getElementById("btn-clear");',
'  var navTree = document.getElementById("nav-tree");',
'  var outlineEl = document.getElementById("outline");',
'  var sideLeft = document.getElementById("sidebar-left");',
'  var sideRight = document.getElementById("sidebar-right");',
'',
'  // ── Message Handling ───────────────────────────────────────',
'  window.addEventListener("message", function(event) {',
'    var msg = event.data;',
'    if (!msg || !msg.type) return;',
'    switch (msg.type) {',
'      case "toc": handleToc(msg.tree); break;',
'      case "docContent": handleDocContent(msg); break;',
'      case "error": handleError(msg); break;',
'    }',
'  });',
'',
'  // Signal ready with restore file',
'  var savedState = vscodeApi.getState();',
'  vscodeApi.postMessage({',
'    type: "ready",',
'    restoreFile: (savedState && savedState.currentFile) ? savedState.currentFile : "index.md"',
'  });',
'',
'  // ═══ SECTION: Document Content Handler ═══════════════════',
'',
'  function handleDocContent(msg) {',
'    currentFile = msg.file;',
'    docsBaseUri = msg.docsBaseUri || "";',
'    searchQuery = "";',
'    searchHits = [];',
'    currentHitIndex = -1;',
'    updateSearchUI();',
'',
'    if (typeof marked === "undefined") {',
'      article.innerHTML = "<pre>" + escapeHtml(msg.content) + "</pre>";',
'      baseArticleHtml = article.innerHTML;',
'      buildOutline();',
'      saveState();',
'      return;',
'    }',
'',
'    // Configure marked renderer',
'    var renderer = createRenderer();',
'    marked.use({ renderer: renderer });',
'',
'    var html = marked.parse(msg.content);',
'    article.innerHTML = html;',
'',
'    cleanDom();',
'    assignHeadingIds();',
'    // Link interception uses event delegation — bound once in Task 6',
'    baseArticleHtml = article.innerHTML;',
'    buildOutline();',
'    updateTocActive(currentFile);',
'',
'    if (msg.anchor) {',
'      scrollToAnchor(msg.anchor);',
'    } else {',
'      contentEl.scrollTop = 0;',
'    }',
'',
'    saveState();',
'  }',
'',
'  function handleError(msg) {',
'    if (!currentFile) {',
'      article.innerHTML = "<div class=\\"help-error\\">" + escapeHtml(msg.message) + "</div>";',
'    }',
'  }',
'',
'  // ═══ SECTION: Markdown Renderer ═════════════════════════',
'',
'  var IMAGE_EXTS = /\\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i;',
'',
'  function createRenderer() {',
'    var baseUri = docsBaseUri;',
'    return {',
'      image: function(href, title, text) {',
'        // External https images',
'        if (/^https:/.test(href)) return false;',
'        // data:image',
'        if (/^data:image\\//i.test(href)) return false;',
'        // Reject all other protocols',
'        if (/^[a-z]+:/i.test(href)) {',
'          return "<em>[不支持的图片协议]</em>";',
'        }',
'        // Relative path validation',
'        var cleanHref = href.replace(/[?#].*$/, "");',
'        var decoded;',
'        try { decoded = decodeURIComponent(cleanHref); }',
'        catch(e) { return "<em>[图片路径编码错误]</em>"; }',
'        var normalized = decoded.replace(/\\\\/g, "/").replace(/\\/+/g, "/");',
'        if (!normalized) return "<em>[图片路径为空]</em>";',
'        if (normalized.split("/").some(function(seg) { return seg === ".."; })) {',
'          return "<em>[图片路径越界]</em>";',
'        }',
'        if (normalized.charAt(0) === "/") return "<em>[图片路径为绝对路径]</em>";',
'        if (!IMAGE_EXTS.test(normalized)) return "<em>[非图片文件]</em>";',
'        var b = baseUri.charAt(baseUri.length - 1) === "/" ? baseUri : baseUri + "/";',
'        var fullUri = b + encodeURI(normalized);',
'        var t = title ? " title=\\"" + escapeAttr(title) + "\\"" : "";',
'        return "<img src=\\"" + fullUri + "\\" alt=\\"" + escapeAttr(text) + "\\"" + t + ">";',
'      }',
'    };',
'  }',
'',
'  // ═══ SECTION: DOM Cleanup ═══════════════════════════════',
'',
'  var DANGEROUS_TAGS = ["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "STYLE"];',
'',
'  function cleanDom() {',
'    var i, els;',
'    for (i = 0; i < DANGEROUS_TAGS.length; i++) {',
'      els = article.querySelectorAll(DANGEROUS_TAGS[i]);',
'      for (var j = 0; j < els.length; j++) els[j].remove();',
'    }',
'    // Remove on* event attributes',
'    var all = article.querySelectorAll("*");',
'    for (i = 0; i < all.length; i++) {',
'      var attrs = all[i].attributes;',
'      for (var k = attrs.length - 1; k >= 0; k--) {',
'        if (attrs[k].name.charAt(0) === "o" && attrs[k].name.charAt(1) === "n") {',
'          all[i].removeAttribute(attrs[k].name);',
'        }',
'      }',
'    }',
'    // Remove dangerous protocol links',
'    var links = article.querySelectorAll("a[href]");',
'    for (i = 0; i < links.length; i++) {',
'      var h = links[i].getAttribute("href") || "";',
'      if (/^javascript:/i.test(h) || /^vbscript:/i.test(h)) links[i].removeAttribute("href");',
'      else if (/^data:/i.test(h) && !/^data:image\\//i.test(h)) links[i].removeAttribute("href");',
'    }',
'  }',
'',
'  // ═══ SECTION: Heading IDs ═══════════════════════════════',
'',
'  function assignHeadingIds() {',
'    var headings = article.querySelectorAll("h1, h2, h3, h4");',
'    var usedIds = {};',
'    for (var i = 0; i < headings.length; i++) {',
'      var h = headings[i];',
'      var slug = (h.id && h.id.charAt(0) !== "x") ? h.id : slugify(h.textContent);',
'      var id = slug;',
'      var counter = 2;',
'      while (usedIds[id]) { id = slug + "-" + counter; counter++; }',
'      usedIds[id] = true;',
'      h.id = id;',
'    }',
'  }',
'',
'  function slugify(text) {',
'    return text.toLowerCase()',
'      .replace(/[^\\w\\s-]/g, "")',
'      .replace(/\\s+/g, "-")',
'      .replace(/-+/g, "-")',
'      .replace(/^-|-$/g, "") || "heading";',
'  }',
'',
'  // ═══ SECTION: Utilities ═════════════════════════════════',
'',
'  function escapeHtml(s) {',
'    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");',
'  }',
'  function escapeAttr(s) {',
'    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");',
'  }',
'',
'  function scrollToAnchor(id) {',
'    var el = document.getElementById(id);',
'    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });',
'  }',
].join('\n');
```

> **重要：** 后续 Task 6-9 会在此字符串末尾追加更多函数，并以 `})();` 闭合 IIFE。此处先不闭合。

- [ ] **Step 2: 在 IIFE 闭合前验证渲染管线**

临时在 `WEBVIEW_JS` 数组末尾添加一行闭合：

```js
    '})();'
].join('\n');
```

验证模块语法：

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK')"
```

然后**撤回** `})();` 闭合行——后续 Task 会继续追加代码。闭合行只在 Task 9 最后添加。

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS — 初始化 + Markdown 渲染 + DOM 清理

- IIFE 封装，acquireVsCodeApi + getState 恢复
- 消息处理：toc/docContent/error 三种消息
- marked.js 渲染 + custom renderer（图片路径校验）
- DOM 清理：移除危险标签/属性/协议链接
- heading id 分配 + slug 去重
- marked.js 缺失时 <pre> fallback"
```

---

### Task 6: Webview JS — 链接拦截 + 侧栏折叠

**Files:**
- Modify: `src/commands/help-reader.js`（WEBVIEW_JS 末尾追加）

- [ ] **Step 1: 在 WEBVIEW_JS 数组最后一个元素（不含 `})();`）之后追加链接拦截和侧栏折叠代码**

在 `WEBVIEW_JS` 数组中，`'  function scrollToAnchor(id) {'` 所在函数块之后（`}` 闭合之后），追加以下元素。注意最后一个现有元素以 `);` 结尾，需要在后续插入：

```js
'',
'  // ═══ SECTION: Link Interception (Event Delegation) ═════',
'',
'  article.addEventListener("click", function(e) {',
'    var a = e.target.closest("a");',
'    if (!a) return;',
'    e.preventDefault();',
'    var href = a.getAttribute("href") || "";',
'',
'    // #anchor — same-document scroll',
'    if (href.charAt(0) === "#") {',
'      var id = href.substring(1);',
'      if (id) scrollToAnchor(id);',
'      return;',
'    }',
'    // .md link — open doc',
'    if (/\\.md(#[\\w-]+)?$/i.test(href)) {',
'      var parts = href.split("#");',
'      vscodeApi.postMessage({',
'        type: "openDoc",',
'        file: parts[0],',
'        anchor: parts[1] || undefined',
'      });',
'      return;',
'    }',
'    // https: — open external',
'    if (/^https:/i.test(href)) {',
'      vscodeApi.postMessage({ type: "openExternal", href: href });',
'      return;',
'    }',
'    // mailto: — open external',
'    if (/^mailto:/i.test(href)) {',
'      vscodeApi.postMessage({ type: "openExternal", href: href });',
'      return;',
'    }',
'    // http: — reject',
'    if (/^http:/i.test(href)) return;',
'    // All other protocols — silently ignore',
'  });',
'',
'  // ═══ SECTION: Sidebar Toggle ═══════════════════════════',
'',
'  document.querySelectorAll(".toggle-btn").forEach(function(btn) {',
'    btn.addEventListener("click", function() {',
'      var target = document.getElementById(btn.getAttribute("data-target"));',
'      if (!target) return;',
'      target.classList.toggle("collapsed");',
'      var isLeft = btn.getAttribute("data-target") === "sidebar-left";',
'      btn.textContent = target.classList.contains("collapsed")',
'        ? (isLeft ? "\\u25B6" : "\\u25C0")',
'        : "\\u25C0";',
'      saveState();',
'    });',
'  });',
```

> **事件委托优势：** 绑定在 `article` 元素上而非每个 `<a>` 上，`innerHTML` 被 `innerHTML = baseArticleHtml` 重写后监听器仍然有效，无需重新绑定。这是 spec v3.1 明确要求的设计。

- [ ] **Step 2: 验证语法**

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS — 链接拦截 + 侧栏折叠

链接拦截使用事件委托（绑定在 article），innerHTML 重写不丢失。
支持 #anchor、.md、https、mailto 链接类型。
http/javascript/command/vscode 链接被静默拒绝。
侧栏折叠通过 CSS class toggle + width transition 实现。"
```

---

### Task 7: Webview JS — 大纲 + TOC 导航树

**Files:**
- Modify: `src/commands/help-reader.js`（WEBVIEW_JS 末尾追加）

- [ ] **Step 1: 追加 TOC 渲染 + 大纲 + IntersectionObserver 代码**

在 Task 6 追加的代码之后，继续追加：

```js
'',
'  // ═══ SECTION: TOC Navigation Tree ══════════════════════',
'',
'  var tocTreeData = [];',
'',
'  function handleToc(tree) {',
'    tocTreeData = tree || [];',
'    navTree.innerHTML = "";',
'    if (!tocTreeData.length) {',
'      navTree.innerHTML = "<div class=\\"help-empty\\">帮助目录配置缺失</div>";',
'      return;',
'    }',
'    tocTreeData.forEach(function(node) {',
'      navTree.appendChild(renderTocNode(node));',
'    });',
'  }',
'',
'  function renderTocNode(node) {',
'    var div = document.createElement("div");',
'    if (node.children && node.children.length) {',
'      var title = document.createElement("div");',
'      title.className = "nav-group-title";',
'      title.textContent = node.title;',
'      div.appendChild(title);',
'      var group = document.createElement("div");',
'      group.className = "nav-group";',
'      node.children.forEach(function(child) {',
'        group.appendChild(renderTocNode(child));',
'      });',
'      div.appendChild(group);',
'    } else if (node.file) {',
'      var item = document.createElement("div");',
'      item.className = "nav-item";',
'      item.textContent = node.title;',
'      item.setAttribute("data-file", node.file);',
'      item.addEventListener("click", function() {',
'        vscodeApi.postMessage({ type: "openDoc", file: node.file });',
'      });',
'      div.appendChild(item);',
'    }',
'    return div;',
'  }',
'',
'  function updateTocActive(file) {',
'    var items = navTree.querySelectorAll(".nav-item");',
'    for (var i = 0; i < items.length; i++) {',
'      items[i].classList.toggle("active", items[i].getAttribute("data-file") === file);',
'    }',
'  }',
'',
'  // ═══ SECTION: Outline ═══════════════════════════════════',
'',
'  function buildOutline() {',
'    outlineEl.innerHTML = "";',
'    var headings = article.querySelectorAll("h1, h2, h3, h4");',
'    if (!headings.length) return;',
'',
'    var levelMap = { H1: 0, H2: 1, H3: 2, H4: 3 };',
'    headings.forEach(function(h) {',
'      var item = document.createElement("div");',
'      item.className = "outline-item";',
'      item.style.paddingLeft = (8 + levelMap[h.tagName] * 12) + "px";',
'      item.textContent = h.textContent;',
'      item.setAttribute("data-id", h.id);',
'      item.addEventListener("click", function() {',
'        // Immediately set active (don\'t wait for observer)',
'        setOutlineActive(h.id);',
'        h.scrollIntoView({ behavior: "smooth", block: "start" });',
'      });',
'      outlineEl.appendChild(item);',
'    });',
'',
'    // Rebuild IntersectionObserver for new heading nodes',
'    if (outlineObserver) outlineObserver.disconnect();',
'    outlineObserver = new IntersectionObserver(function(entries) {',
'      for (var i = 0; i < entries.length; i++) {',
'        if (entries[i].isIntersecting) {',
'          setOutlineActive(entries[i].target.id);',
'          break;',
'        }',
'      }',
'    }, {',
'      root: contentEl,',
'      rootMargin: "0px 0px -80% 0px"',
'    });',
'    headings.forEach(function(h) { outlineObserver.observe(h); });',
'  }',
'',
'  function setOutlineActive(id) {',
'    var items = outlineEl.querySelectorAll(".outline-item");',
'    for (var i = 0; i < items.length; i++) {',
'      items[i].classList.toggle("active", items[i].getAttribute("data-id") === id);',
'    }',
'  }',
```

> **IntersectionObserver 重建：** 每次 `handleDocContent` 重写 `article.innerHTML` 后，heading DOM 节点被替换，必须重建 Observer 重新观察新节点。事件委托（链接点击）不受影响。

- [ ] **Step 2: 验证语法**

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS — 大纲 + TOC 导航树

TOC 树从 toc.json 渲染，有 file 的条目可点击加载文档。
Outline 从 h1-h4 生成缩进树，点击 scrollIntoView。
IntersectionObserver (root=content, rootMargin=-80%) 追踪 active。
每次 innerHTML 重写后重建 Observer。"
```

---

### Task 8: Webview JS — 搜索高亮

**Files:**
- Modify: `src/commands/help-reader.js`（WEBVIEW_JS 末尾追加）

- [ ] **Step 1: 追加搜索功能代码**

在 Task 7 追加的代码之后，继续追加：

```js
'',
'  // ═══ SECTION: Search ═══════════════════════════════════',
'',
'  var SKIP_TAGS = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, BUTTON: 1 };',
'  var searchTimer = null;',
'',
'  searchInput.addEventListener("input", function() {',
'    clearTimeout(searchTimer);',
'    searchTimer = setTimeout(function() {',
'      performSearch(searchInput.value.trim());',
'    }, 200);',
'  });',
'',
'  searchInput.addEventListener("keydown", function(e) {',
'    if (e.key === "Enter") {',
'      e.preventDefault();',
'      if (e.shiftKey) navigateHit(-1);',
'      else navigateHit(1);',
'    }',
'    if (e.key === "Escape") {',
'      e.preventDefault();',
'      searchInput.value = "";',
'      clearSearch();',
'    }',
'  });',
'',
'  btnNext.addEventListener("click", function() { navigateHit(1); });',
'  btnPrev.addEventListener("click", function() { navigateHit(-1); });',
'  btnClear.addEventListener("click", function() {',
'    searchInput.value = "";',
'    clearSearch();',
'  });',
'',
'  function performSearch(query) {',
'    // Restore clean HTML before re-highlighting',
'    if (baseArticleHtml) {',
'      article.innerHTML = baseArticleHtml;',
'      // innerHTML rewrite replaced heading nodes → rebuild observer',
'      buildOutline();',
'    }',
'    searchHits = [];',
'    currentHitIndex = -1;',
'',
'    if (!query) {',
'      updateSearchUI();',
'      saveState();',
'      return;',
'    }',
'',
'    var lowerQuery = query.toLowerCase();',
'    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {',
'      acceptNode: function(node) {',
'        var p = node.parentElement;',
'        while (p && p !== article) {',
'          if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;',
'          p = p.parentElement;',
'        }',
'        return NodeFilter.FILTER_ACCEPT;',
'      }',
'    });',
'',
'    var nodesToWrap = [];',
'    var n;',
'    while (n = walker.nextNode()) {',
'      var lower = n.textContent.toLowerCase();',
'      var idx = lower.indexOf(lowerQuery);',
'      if (idx >= 0) nodesToWrap.push({ node: n, idx: idx });',
'    }',
'',
'    for (var i = 0; i < nodesToWrap.length; i++) {',
'      var entry = nodesToWrap[i];',
'      var range = document.createRange();',
'      range.setStart(entry.node, entry.idx);',
'      range.setEnd(entry.node, entry.idx + query.length);',
'      var mark = document.createElement("mark");',
'      mark.className = "hit";',
'      range.surroundContents(mark);',
'      searchHits.push(mark);',
'    }',
'',
'    if (searchHits.length) navigateHit(1);',
'    updateSearchUI();',
'    saveState();',
'  }',
'',
'  function clearSearch() {',
'    if (baseArticleHtml) {',
'      article.innerHTML = baseArticleHtml;',
'      buildOutline();',
'    }',
'    searchHits = [];',
'    currentHitIndex = -1;',
'    updateSearchUI();',
'    saveState();',
'  }',
'',
'  function navigateHit(dir) {',
'    if (!searchHits.length) return;',
'    if (currentHitIndex >= 0 && currentHitIndex < searchHits.length) {',
'      searchHits[currentHitIndex].classList.remove("current");',
'    }',
'    currentHitIndex += dir;',
'    if (currentHitIndex >= searchHits.length) currentHitIndex = 0;',
'    if (currentHitIndex < 0) currentHitIndex = searchHits.length - 1;',
'    searchHits[currentHitIndex].classList.add("current");',
'    searchHits[currentHitIndex].scrollIntoView({ behavior: "smooth", block: "center" });',
'    updateSearchUI();',
'  }',
'',
'  function updateSearchUI() {',
'    var hasHits = searchHits.length > 0;',
'    if (searchHits.length) {',
'      searchCount.textContent = (currentHitIndex + 1) + "/" + searchHits.length;',
'    } else if (searchInput.value.trim()) {',
'      searchCount.textContent = "无结果";',
'    } else {',
'      searchCount.textContent = "";',
'    }',
'    btnPrev.disabled = !hasHits;',
'    btnNext.disabled = !hasHits;',
'    btnClear.disabled = !searchInput.value;',
'  }',
```

> **搜索范围限制：** TreeWalker 的 acceptNode 回调跳过 `pre/code/script/style/textarea/input/button` 内的文本节点。搜索仅作用于 article 内，不遍历导航/大纲区域。`innerHTML = baseArticleHtml` 恢复后必须重建 IntersectionObserver。

- [ ] **Step 2: 验证语法**

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS — 搜索高亮

- Debounced 200ms 搜索输入
- TreeWalker 遍历文本节点，跳过 code/pre 等
- <mark class=hit> 包裹匹配项，.current 标记当前项
- Enter/Shift+Enter 循环导航，Esc 清除
- 搜索前恢复 baseArticleHtml + 重建 Observer"
```

---

### Task 9: Webview JS — 状态持久化 + IIFE 闭合

**Files:**
- Modify: `src/commands/help-reader.js`（WEBVIEW_JS 末尾追加 + IIFE 闭合）

- [ ] **Step 1: 追加状态管理代码并闭合 IIFE**

在 Task 8 追加的代码之后，继续追加：

```js
'',
'  // ═══ SECTION: State Persistence ════════════════════════',
'',
'  function saveState() {',
'    vscodeApi.setState({',
'      currentFile: currentFile,',
'      searchQuery: searchInput.value,',
'      scrollTop: contentEl.scrollTop,',
'      leftCollapsed: sideLeft.classList.contains("collapsed"),',
'      rightCollapsed: sideRight.classList.contains("collapsed")',
'    });',
'  }',
'',
'  // Restore state after panel recreation',
'  function restoreState(state) {',
'    if (!state) return;',
'    // Sidebar collapse',
'    if (state.leftCollapsed) {',
'      sideLeft.classList.add("collapsed");',
'      var btn = sideLeft.querySelector(".toggle-btn");',
'      if (btn) btn.textContent = "\\u25B6";',
'    }',
'    if (state.rightCollapsed) {',
'      sideRight.classList.add("collapsed");',
'      var btn2 = sideRight.querySelector(".toggle-btn");',
'      if (btn2) btn2.textContent = "\\u25B6";',
'    }',
'    // Search restore',
'    if (state.searchQuery) {',
'      searchInput.value = state.searchQuery;',
'      performSearch(state.searchQuery);',
'    }',
'    // Scroll restore (after DOM renders)',
'    if (state.scrollTop) {',
'      requestAnimationFrame(function() {',
'        contentEl.scrollTop = state.scrollTop;',
'      });',
'    }',
'  }',
'',
'  // Call restore after first docContent loads',
'  var firstDocLoaded = false;',
'  var origHandleDoc = handleDocContent;',
'  handleDocContent = function(msg) {',
'    origHandleDoc(msg);',
'    if (!firstDocLoaded) {',
'      firstDocLoaded = true;',
'      restoreState(savedState);',
'    }',
'  };',
'',
'})();'  // IIFE 闭合
].join('\n');
```

> **状态恢复时机：** 在首次 `docContent` 加载完成（DOM 已渲染）后执行 `restoreState`，确保 `scrollTop` 恢复、搜索重新执行、侧栏折叠状态恢复均有有效的 DOM 可操作。`requestAnimationFrame` 确保 scrollTop 在浏览器完成布局后设置。

- [ ] **Step 2: 最终语法验证**

```bash
node -e "const m = require('./src/commands/help-reader'); console.log('OK:', typeof m.register)"
```

期望：`OK: function`

- [ ] **Step 3: 运行全部测试确认无回归**

```bash
node tests/test-help-reader.js
```

期望：所有 _validatePath 测试通过。

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS — 状态持久化 + IIFE 闭合

- saveState: currentFile/searchQuery/scrollTop/sidebar collapse
- restoreState: 首次 docContent 后恢复所有状态
- requestAnimationFrame 确保 scrollTop 在布局后恢复
- IIFE 闭合，Webview JS 模板完整"
```

---

### Task 10: extension.js 集成 + .vscodeignore

**Files:**
- Modify: `src/extension.js:598-604`
- Modify: `.vscodeignore`

- [ ] **Step 1: 替换 extension.js 中的内联帮助命令**

读取 `src/extension.js` 确认第 598-604 行内容为：

```js
    // ── 帮助文档命令 ──────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('sentaurus.openHelp', () => {
            const helpPath = vscode.Uri.joinPath(context.extensionUri, 'docs', 'Built-in Help', 'index.md');
            vscode.commands.executeCommand('markdown.showPreview', helpPath);
        })
    );
```

替换为：

```js
    // ── 帮助文档命令 ──────────────────────────
    const { register: registerHelpReader } = require('./commands/help-reader');
    registerHelpReader(context);
```

同时在文件顶部的 require 区域（第 18 行 `const { registerSnippetCommand } = require('./commands/snippet-picker');` 附近）不需要添加 require——因为 register 调用在函数体内延迟加载。

- [ ] **Step 2: 更新 .vscodeignore**

`.vscodeignore` 中 `docs/**` 排除了所有 docs 目录。需要在排除规则后添加例外保留 `docs/help/`：

在 `.vscodeignore` 文件中找到 `docs/**` 行，在其后添加：

```
# Help reader — keep docs/help/ and media/ in VSIX
!docs/help/**
!media/**
```

- [ ] **Step 3: 验证模块加载**

```bash
node -e "require('./src/extension.js'); console.log('OK')"
```

> **注意：** 此命令可能在非 VSCode 环境报错（缺少 vscode 模块），这是正常的。只要不是 syntax error 即可。如果报错 `Cannot find module 'vscode'`，改用语法检查：

```bash
node -c src/extension.js && echo "Syntax OK"
```

- [ ] **Step 4: 提交**

```bash
git add src/extension.js .vscodeignore
git commit -m "feat(help-reader): extension.js 集成 + .vscodeignore 更新

替换内联 sentaurus.openHelp 命令为 help-reader 模块导入。
.vscodeignore 添加 !docs/help/** 和 !media/** 例外，
确保 VSIX 包含帮助文档和 marked.js。"
```

---

### Task 11: 清理旧文件 + 扩展测试

**Files:**
- Delete: `docs/Built-in Help/`
- Modify: `tests/test-help-reader.js`（追加测试）

- [ ] **Step 1: 删除旧帮助文档目录**

```bash
rm -rf "docs/Built-in Help"
```

- [ ] **Step 2: 追加 _parseToc 测试**

在 `tests/test-help-reader.js` 末尾 `summary()` 调用之前追加：

```js
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
    // 非空字符串且包含 marked 标识
    assert(typeof js === 'string');
    assert(js.length > 100);
    assert(js.indexOf('marked') >= 0);
});

console.log('\n_buildHtml:');

test('HTML 包含 CSP nonce', () => {
    const reader = createReader();
    // 需要模拟 panel
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

test('HTML 包含 sidebar-left 和 sidebar-right', () => {
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
    // 空 script 块不破坏 HTML 结构
    assert(html.indexOf('</script>') >= 0);
});
```

- [ ] **Step 3: 运行全部测试**

```bash
node tests/test-help-reader.js
```

期望：所有测试通过（_validatePath 15 + _parseToc 3 + _loadMarkedJs 1 + _buildHtml 3 = 22 个测试）。

- [ ] **Step 4: 提交**

```bash
git add tests/test-help-reader.js
git rm -r "docs/Built-in Help"
git commit -m "test(help-reader): 扩展单元测试 + 清理旧目录

- _parseToc: 正常读取、首页条目、children 层级
- _loadMarkedJs: 加载验证
- _buildHtml: CSP nonce、HTML 结构、marked.js 缺失 fallback
- 删除 docs/Built-in Help/（已迁移至 docs/help/）"
```

---

### Task 12: 手动验收测试

**Files:** 无代码变更

此 Task 通过 VSCode Extension Development Host 进行手动验收。

- [ ] **Step 1: 启动 Extension Development Host**

在 VSCode 中按 F5（使用 `.vscode/launch.json` 配置）启动扩展开发宿主。

- [ ] **Step 2: 基本功能验收**

在新窗口中按 `Ctrl+Shift+P` → 输入 `Sentaurus: 打开帮助文档` → 执行：

- [ ] 阅读器 Webview 面板打开，显示 index.md 内容
- [ ] 左侧导航显示 toc.json 中的条目
- [ ] 首页条目为 active 状态
- [ ] 右侧大纲显示 index.md 的 heading 结构
- [ ] 关闭面板，再次执行命令 → 面板重新打开（无报错）

- [ ] **Step 3: 导航验收**

- [ ] 点击左侧 toc 条目 → 切换文档（如文档不存在，保留当前内容不跳错误页）
- [ ] 点击右侧大纲项 → 文章滚动到对应 heading
- [ ] 滚动文章 → 大纲 active 项跟随变化

- [ ] **Step 4: 搜索验收**

- [ ] 在搜索框输入 "语法" → 匹配项高亮，显示计数 N/M
- [ ] 点击 ▲▼ → 循环跳转匹配项
- [ ] 按 Enter/Shift+Enter → 上下跳转
- [ ] 按 Esc → 清除搜索
- [ ] 切换文档后搜索状态被清空

- [ ] **Step 5: 侧栏折叠验收**

- [ ] 点击左侧 ◀ → 左侧栏折叠，内容区扩展
- [ ] 点击右侧 ◀ → 右侧栏折叠
- [ ] 折叠状态在隐藏/恢复面板后保持

- [ ] **Step 6: 链接验收**（需在 index.md 中临时添加测试链接）

在 `docs/help/index.md` 末尾临时添加：

```markdown
## 链接测试

[首页](index.md) | [锚点](#链接测试) | [外部](https://example.com)
```

重新加载扩展后验证：

- [ ] 点击 `index.md` 链接 → 重新加载当前文档
- [ ] 点击 `#锚点` 链接 → 滚动到对应 heading
- [ ] 点击 `https://` 链接 → 在外部浏览器打开

测试完成后还原 index.md。

- [ ] **Step 7: VSIX 打包验证**

```bash
npx vsce package
```

验证 .vsix 文件中包含关键文件：

```bash
unzip -l sentaurus-tcad-syntax-*.vsix | grep -E "(docs/help|media/marked)"
```

期望输出包含：
- `docs/help/index.md`
- `docs/help/toc.json`
- `media/marked.min.js`

- [ ] **Step 8: 最终提交（如有临时变更）**

如果在验收过程中修复了问题，提交修复。否则跳过此步骤。

---

## Self-Review

### 1. Spec Coverage

| Spec 需求 | Task |
|-----------|------|
| 命令面板入口 | Task 3 (register) + Task 10 (extension.js) |
| toc.json 加载 | Task 3 (_parseToc) + Task 7 (handleToc) |
| Markdown 渲染 (Webview 端) | Task 5 (handleDocContent + marked) |
| DOM 清理 | Task 5 (cleanDom) |
| heading id 分配 | Task 5 (assignHeadingIds) |
| 链接拦截（事件委托） | Task 6 (article click delegation) |
| 图片路径校验 + URI 拼接 | Task 5 (createRenderer image hook) |
| 右侧大纲 | Task 7 (buildOutline + IntersectionObserver) |
| 搜索高亮 + 导航 | Task 8 (performSearch + navigateHit) |
| 状态持久化 + 恢复 | Task 9 (saveState + restoreState) |
| 侧栏折叠 | Task 6 (toggle buttons) |
| CSP nonce | Task 3 (_buildHtml) |
| marked.js 缺失 fallback | Task 5 (typeof marked check) |
| 路径安全校验 | Task 2 (_validatePath) |
| openExternal 协议限制 | Task 3 (_handleMessage) |
| .vscodeignore | Task 10 |
| 包发布约束 | Task 10 + Task 12 |

### 2. Placeholder Scan

无 `TBD`/`TODO`/`implement later`。每个 Task 均包含完整代码。

### 3. Type Consistency

- `_validatePath(file)` → 参数 `file: any` → 返回 `boolean` — 所有调用处一致
- `_sendDocument(file, anchor?)` — 参数 `file: string, anchor?: string` — Task 3 定义，Task 3/5 调用一致
- `_handleMessage(msg)` — `msg.type` 枚举 `ready/openDoc/openExternal` — Task 3 定义 + Task 5/6/7 调用一致
- `WEBVIEW_JS` 变量 `docsBaseUri` — Task 5 定义，Task 5 (renderer) 使用一致
- `tocTreeData` — Task 7 定义，`handleToc` 赋值，`renderTocNode`/`updateTocActive` 使用一致
