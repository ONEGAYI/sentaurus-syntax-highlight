# Webview 帮助阅读器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 WebviewPanel 的自定义帮助文档阅读器，替代内置 Markdown Preview，提供左侧 toc 导航 + 搜索、右侧文章大纲、主题适配等功能。

**Architecture:** 单模块 `src/commands/help-reader.js`（~550行），Extension 侧负责路径校验/文件读取/消息分发，Webview 侧负责 Markdown 渲染（内联 marked.js）/DOM 处理/搜索/大纲/状态持久化。CSS/HTML 定义为模块级字符串常量（`CSS`、`HTML_BODY`），Webview JS 使用模板字面量常量 `WEBVIEW_JS`。`_buildHtml` 通过字符串拼接组装完整 HTML（不嵌套模板字面量）。

**Tech Stack:** VSCode WebviewPanel API, marked.js (内联), CommonJS, crypto (nonce)

**设计规范:** `docs/superpowers/specs/2026-05-27-help-reader-design.md` (v3.1)

**核心约束：**
- 每个 Task 结束时 `src/commands/help-reader.js` 必须 **语法有效**（可通过 `node -c` 检查）
- Webview JS 在 Task 5 一次性写入完整骨架（含 no-op stub），Task 6-9 通过替换 stub 增强
- 所有 Node 测试通过 `tests/helpers/mock-vscode.js` mock `vscode` 模块，无需 VSCode 运行时
- 所有文件使用 UTF-8 编码，HTML_BODY 中的 Unicode 字符（◀▲▼✕）直接使用，不转义

---

## File Structure

```
创建:
  media/marked.min.js                ← 内置 marked.js (~20KB, MIT)
  docs/help/index.md                 ← 首页（从 docs/Built-in Help/ 迁移）
  docs/help/getting-started.md       ← 占位文档
  docs/help/installation.md          ← 占位文档
  docs/help/syntax-highlighting.md   ← 占位文档
  docs/help/completion.md            ← 占位文档
  docs/help/snippets.md              ← 占位文档
  docs/help/sdevicepar.md            ← 占位文档
  docs/help/faq.md                   ← 占位文档
  docs/help/toc.json                 ← 导航目录声明
  src/commands/help-reader.js        ← 主模块（Extension + Webview HTML 模板）
  tests/test-help-reader.js          ← 单元测试
  tests/helpers/mock-vscode.js       ← vscode 模块 mock
  THIRD_PARTY_NOTICES.md             ← 第三方许可证声明

修改:
  src/extension.js:598-604           ← 替换内联命令为模块导入
  .vscodeignore                      ← 排除 docs/ 但保留 docs/help/**

删除:
  docs/Built-in Help/                ← 迁移后删除
```

---

### Task 1: 项目脚手架 + 依赖准备

**Files:**
- Create: `docs/help/` 目录 + 8 个 `.md` 文件 + `toc.json`
- Create: `media/marked.min.js`
- Create: `THIRD_PARTY_NOTICES.md`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p docs/help media
```

- [ ] **Step 2: 迁移 index.md**

```bash
cp "docs/Built-in Help/index.md" docs/help/index.md
```

- [ ] **Step 3: 创建占位帮助文档**

toc.json 引用了 7 个子文档，全部创建占位文件：

```bash
for f in getting-started installation syntax-highlighting completion snippets sdevicepar faq; do
  title=$(echo "$f" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\u\1/g')
  echo "# ${title}\n\n> 内容待补充。" > "docs/help/${f}.md"
done
```

- [ ] **Step 4: 创建 toc.json**

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

- [ ] **Step 5: 下载 marked.min.js**

```bash
curl -sL https://cdn.jsdelivr.net/npm/marked@12/marked.min.js -o media/marked.min.js
wc -c media/marked.min.js
```

期望文件大小 15-30KB。下载后验证 API 可用：

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('media/marked.min.js', 'utf8');
console.log('length:', src.length);
console.log('has marked.parse:', src.includes('.parse'));
console.log('has marked.use:', src.includes('.use'));
"
```

- [ ] **Step 6: 创建 THIRD_PARTY_NOTICES.md**

创建 `THIRD_PARTY_NOTICES.md`：

```markdown
# Third-Party Notices

## marked

This extension bundles [marked](https://github.com/markedjs/marked), version 12.x.

License: MIT
Copyright (c) 2018+, markedjs. Copyright (c) 2011-2018, Christopher Jeffrey.
```

- [ ] **Step 7: 验证文件结构**

```bash
ls docs/help/*.md docs/help/toc.json media/marked.min.js THIRD_PARTY_NOTICES.md
```

期望 8 个 `.md` + `toc.json` + `marked.min.js` + `THIRD_PARTY_NOTICES.md` 共 11 个文件。

- [ ] **Step 8: 提交**

```bash
git add docs/help/ media/marked.min.js THIRD_PARTY_NOTICES.md
git commit -m "chore: 帮助阅读器脚手架 — docs/help/ + marked.js + 第三方声明

- 迁移 docs/Built-in Help/index.md → docs/help/index.md
- 创建 7 个占位帮助文档（对应 toc.json 条目）
- 创建 docs/help/toc.json 导航目录声明
- 下载 marked.js v12 minified 到 media/
- 创建 THIRD_PARTY_NOTICES.md 记录 marked MIT license"
```

---

### Task 2: 测试环境 + _validatePath (TDD)

**Files:**
- Create: `tests/helpers/mock-vscode.js`
- Create: `tests/test-help-reader.js`
- Create: `src/commands/help-reader.js`（仅类骨架 + `_validatePath`）

此 Task 建立 vscode mock 基础设施，然后 TDD 实现 `_validatePath`。

- [ ] **Step 1: 创建 vscode 模块 mock**

创建 `tests/helpers/mock-vscode.js`：

```js
// tests/helpers/mock-vscode.js
'use strict';

var Module = require('module');
var path = require('path');

var mockVscode = {
    Uri: {
        joinPath: function(base) {
            var parts = Array.prototype.slice.call(arguments, 1);
            var result = (base && base.fsPath) ? base.fsPath : String(base);
            parts.forEach(function(p) { result = path.join(result, p); });
            return { fsPath: result, path: result, toString: function() { return 'file:///' + result.replace(/\\/g, '/'); } };
        },
        parse: function(s) { return { toString: function() { return s; } }; }
    },
    commands: {
        registerCommand: function() { return { dispose: function() {} }; }
    },
    window: {
        createWebviewPanel: function() { return {}; },
        showErrorMessage: function() {}
    },
    ViewColumn: { Active: 1 },
    env: { openExternal: function() {} }
};

var originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'vscode') return mockVscode;
    return originalLoad.apply(this, arguments);
};

module.exports = mockVscode;
```

- [ ] **Step 2: 创建 help-reader.js 骨架 + _validatePath**

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

const CSS = '';        // Task 4
const HTML_BODY = '';  // Task 4
const WEBVIEW_JS = ''; // Task 5

// ═══════════════════════════════════════
// HelpReader Class
// ═══════════════════════════════════════

class HelpReader {
    constructor(context) {
        this.context = context;
        this.docsDir = vscode.Uri.joinPath(context.extensionUri, 'docs', 'help');
        this.docsDirFsPath = path.normalize(
            typeof this.docsDir.fsPath === 'string' ? this.docsDir.fsPath : this.docsDir.path
        );
        this.panel = undefined;
    }

    register() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('sentaurus.openHelp', () => this.show())
        );
    }

    /**
     * 路径安全校验。使用 path.relative 边界检查防止 ../ 越界。
     * 额外检测 Windows 绝对路径（C:\、\\server\）。
     * @param {any} file
     * @returns {boolean}
     */
    _validatePath(file) {
        if (!file || typeof file !== 'string') return false;
        if (path.isAbsolute(file)) return false;
        // 检测 Windows 绝对路径（path.isAbsolute 在 POSIX 环境可能漏检）
        if (/^[a-zA-Z]:[\\/]/.test(file)) return false;
        if (/^\\\\/.test(file)) return false;
        if (/^\//.test(file)) return false;
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

- [ ] **Step 3: 创建测试文件**

创建 `tests/test-help-reader.js`：

```js
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node tests/test-help-reader.js
```

期望：16 个测试全部通过。

- [ ] **Step 5: 语法检查**

```bash
node -c src/commands/help-reader.js
```

期望：`Syntax OK`

- [ ] **Step 6: 提交**

```bash
git add tests/helpers/mock-vscode.js tests/test-help-reader.js src/commands/help-reader.js
git commit -m "feat(help-reader): 测试基础设施 + _validatePath (TDD)

- 创建 tests/helpers/mock-vscode.js 轻量 vscode 模块 mock
- _validatePath: path.relative 边界校验 + Windows 绝对路径检测
  (C:\\  /  \\\\server\\)
- 仅允许 docsDir 内 .md 文件，拒绝越界/绝对/非字符串
- 16 个单元测试全部通过
- 导出 _HelpReader 类用于测试"
```

---

### Task 3: Extension 侧完整实现

**Files:**
- Modify: `src/commands/help-reader.js`

添加所有 Extension 侧方法。`_buildHtml` 返回最小有效 HTML（WEBVIEW_JS 仍为空字符串占位）。

- [ ] **Step 1: 在 class 中添加 show 方法（register 之后）**

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

- [ ] **Step 2: 在 _validatePath 之后添加所有 Extension 侧方法**

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

    /**
     * 加载并发送文档。返回 true 表示成功发送 docContent，false 表示失败。
     * 非法路径仅 console.warn，不通知 Webview。
     * 文件读取失败：非 index.md 发送 nonFatal error，index.md 发送致命 error。
     */
    _sendDocument(file, anchor) {
        if (!this._validatePath(file)) {
            console.warn('[help-reader] rejected path:', file);
            return false;
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
            return true;
        } catch (e) {
            vscode.window.showErrorMessage('帮助文档加载失败: ' + file);
            if (file === 'index.md') {
                // 首页失败 → 致命错误，Webview 显示完整错误页
                this.panel.webview.postMessage({
                    type: 'error', message: '无法加载首页: ' + e.message, file: file
                });
            } else {
                // 非 index.md → 非致命，Webview 保留当前正文，显示顶部 banner
                this.panel.webview.postMessage({
                    type: 'error', message: '无法加载文档: ' + file, file: file, nonFatal: true
                });
            }
            return false;
        }
    }

    _handleMessage(msg) {
        switch (msg.type) {
            case 'ready': {
                this._sendToc();
                // 先校验 restoreFile，非法则退回 index.md
                const restoreFile = this._validatePath(msg.restoreFile) ? msg.restoreFile : 'index.md';
                // 如果 restoreFile 加载失败（文件不存在），fallback 到 index.md
                if (!this._sendDocument(restoreFile)) {
                    if (restoreFile !== 'index.md') {
                        this._sendDocument('index.md');
                    }
                }
                break;
            }
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

> **ready 分支 fallback 逻辑：** 1) `_validatePath` 拒绝非法路径 → 退回 index.md。2) `_validatePath` 通过但文件读取失败（`_sendDocument` 返回 false） → 若非 index.md 则 fallback 到 index.md。3) index.md 本身失败 → 无法继续，显示致命错误页。

- [ ] **Step 3: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 4: 运行现有测试**

```bash
node tests/test-help-reader.js
```

期望：16 个 _validatePath 测试通过。

- [ ] **Step 5: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Extension 侧完整实现

- show(): 单例 panel 管理 + reveal/dispose 生命周期
- _loadMarkedJs(): 读取内联 marked.js，缺失返回空字符串
- _buildHtml(): CSP nonce + HTML 组装（模板常量待 Task 4-5 填充）
- _parseToc(): 读取 toc.json，失败返回空数组
- _sendDocument(): 路径校验 + 文件读取 + docsBaseUri 发送
  返回 boolean，区分致命/非致命错误
- _handleMessage(): ready 带 index.md fallback、openDoc、openExternal
  openExternal 仅允许 https: 和 mailto:"
```

---

### Task 4: Webview HTML 结构 + CSS

**Files:**
- Modify: `src/commands/help-reader.js`（`CSS` 和 `HTML_BODY` 常量）

- [ ] **Step 1: 替换 CSS 常量**

将 `const CSS = '';` 替换为完整 CSS。关键设计：
- 侧栏折叠使用 28px 窄条（保留 toggle button 可见）
- 折叠时隐藏 `.sidebar-body` 和 `.sidebar-title`
- 增加 `.help-banner` 用于非致命错误提示
- 所有文件使用 UTF-8，Unicode 字符直接使用

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
    '',
    '#sidebar-left { width: 220px; min-width: 220px; }',
    '#sidebar-right { width: 180px; min-width: 180px; border-right: none; border-left: 1px solid var(--vscode-widget-border, transparent); }',
    '',
    'aside.collapsed { width: 28px !important; min-width: 28px !important; }',
    'aside.collapsed .sidebar-body { display: none; }',
    'aside.collapsed .sidebar-title { display: none; }',
    'aside.collapsed .sidebar-header { justify-content: center; padding: 4px; }',
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
    '  padding: 4px 6px;',
    '  border-radius: 3px;',
    '  font-size: 14px;',
    '  line-height: 1;',
    '  flex-shrink: 0;',
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
    '/* ── Error / Banner / Empty ───────── */',
    '.help-error { color: var(--vscode-errorForeground); padding: 16px; }',
    '.help-empty { color: var(--vscode-descriptionForeground); padding: 16px; text-align: center; }',
    '.help-banner {',
    '  background: var(--vscode-inputValidation-warningBackground, #613214);',
    '  border: 1px solid var(--vscode-inputValidation-warningBorder, #cc9900);',
    '  color: var(--vscode-foreground);',
    '  padding: 6px 12px;',
    '  margin-bottom: 12px;',
    '  border-radius: 3px;',
    '  font-size: 0.9em;',
    '}',
].join('\n');
```

- [ ] **Step 2: 替换 HTML_BODY 常量**

将 `const HTML_BODY = '';` 替换为：

```js
const HTML_BODY = [
    '<aside id="sidebar-left" role="navigation" aria-label="文档导航">',
    '  <div class="sidebar-header">',
    '    <span class="sidebar-title">导航</span>',
    '    <button class="toggle-btn" data-target="sidebar-left" data-side="left" aria-label="折叠导航栏">◀</button>',
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
    '  <div id="error-banner"></div>',
    '  <article id="article">加载中...</article>',
    '</main>',
    '',
    '<aside id="sidebar-right" role="navigation" aria-label="文章大纲">',
    '  <div class="sidebar-header">',
    '    <button class="toggle-btn" data-target="sidebar-right" data-side="right" aria-label="折叠大纲栏">▶</button>',
    '    <span class="sidebar-title">大纲</span>',
    '  </div>',
    '  <div class="sidebar-body">',
    '    <div id="outline" role="tree"></div>',
    '  </div>',
    '</aside>'
].join('\n');
```

> **侧栏方向：** 左侧 toggle 带 `data-side="left"`，初始 ◀（折叠左）；右侧 toggle 带 `data-side="right"`，初始 ▶（折叠右）。折叠后 28px 窄条保留 toggle button 可见，用户可展开。

- [ ] **Step 3: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): HTML 结构 + 完整 CSS

三栏布局：左侧导航+搜索 / 中间文章+error banner / 右侧大纲。
侧栏折叠使用 28px 窄条，保留 toggle button 可点击展开。
增加 .help-banner 非致命错误提示样式。
全部使用 VSCode CSS 变量适配深色/浅色主题。
所有文件使用 UTF-8 编码，Unicode 字符直接使用。"
```

---

### Task 5: Webview JS 完整骨架

**Files:**
- Modify: `src/commands/help-reader.js`（`WEBVIEW_JS` 常量）

此 Task 一次性写入完整 Webview JS 骨架。所有核心函数完整实现，TOC/大纲/搜索/状态恢复 使用 no-op stub。**文件必须语法有效。**

- [ ] **Step 1: 替换 WEBVIEW_JS 常量**

将 `const WEBVIEW_JS = '';` 替换为以下模板字面量。`_buildHtml` 使用字符串拼接（`+ WEBVIEW_JS +`）插入此内容，不存在模板字面量嵌套。

```js
const WEBVIEW_JS = `
// ═══ Webview JS ═══════════════════════════════════════════════
(function() {
  "use strict";

  var vscodeApi = acquireVsCodeApi();

  // ── State ────────────────────────────────────────────────
  var currentFile = "";
  var docsBaseUri = "";
  var baseArticleHtml = "";
  var searchHits = [];
  var currentHitIndex = -1;
  var outlineObserver = null;
  var markedConfigured = false;
  var scrollSaveTimer = null;
  var firstDocLoaded = false;

  // ── DOM refs ─────────────────────────────────────────────
  var article = document.getElementById("article");
  var contentEl = document.getElementById("content");
  var errorBanner = document.getElementById("error-banner");
  var searchInput = document.getElementById("search-input");
  var searchCount = document.getElementById("search-count");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnClear = document.getElementById("btn-clear");
  var navTree = document.getElementById("nav-tree");
  var outlineEl = document.getElementById("outline");
  var sideLeft = document.getElementById("sidebar-left");
  var sideRight = document.getElementById("sidebar-right");

  // ── Saved state (from getState) ──────────────────────────
  var savedState = vscodeApi.getState();

  // ── Message Handling ──────────────────────────────────────
  window.addEventListener("message", function(event) {
    var msg = event.data;
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case "toc": handleToc(msg.tree); break;
      case "docContent": handleDocContent(msg); break;
      case "error": handleError(msg); break;
    }
  });

  // Signal ready
  vscodeApi.postMessage({
    type: "ready",
    restoreFile: (savedState && savedState.currentFile) ? savedState.currentFile : "index.md"
  });

  // ── Scroll debounced save ─────────────────────────────────
  contentEl.addEventListener("scroll", function() {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(saveState, 300);
  });

  // ═══ SECTION: Document Content ════════════════════════════

  function handleDocContent(msg) {
    currentFile = msg.file;
    docsBaseUri = msg.docsBaseUri || "";
    // 清空搜索（普通切换）— restoreState 在首次加载后恢复
    searchInput.value = "";
    clearSearch();
    hideBanner();

    if (typeof marked === "undefined") {
      article.innerHTML = "<pre>" + escapeHtml(msg.content) + "</pre>";
      baseArticleHtml = article.innerHTML;
      buildOutline();
      saveState();
      if (!firstDocLoaded) { firstDocLoaded = true; restoreState(savedState); }
      return;
    }

    // Configure marked renderer only once
    if (!markedConfigured) {
      marked.use({ renderer: createRenderer() });
      markedConfigured = true;
    }

    var html = marked.parse(msg.content);
    article.innerHTML = html;
    cleanDom();
    assignHeadingIds();
    baseArticleHtml = article.innerHTML;
    buildOutline();
    updateTocActive(currentFile);

    if (msg.anchor) {
      scrollToAnchor(decodeURIComponent(msg.anchor));
    } else {
      contentEl.scrollTop = 0;
    }

    saveState();
    if (!firstDocLoaded) { firstDocLoaded = true; restoreState(savedState); }
  }

  // ═══ SECTION: Error Handling ══════════════════════════════

  function handleError(msg) {
    if (msg.nonFatal) {
      showBanner(msg.message);
    } else if (!currentFile) {
      // 初次加载失败 → 替换 article 为错误页
      article.innerHTML = '<div class="help-error">' + escapeHtml(msg.message) + '</div>';
    } else {
      // 从已有文档切换失败 → 保留当前正文，显示 banner
      showBanner(msg.message);
    }
  }

  function showBanner(message) {
    errorBanner.innerHTML = '<div class="help-banner">' + escapeHtml(message) + '</div>';
  }
  function hideBanner() { errorBanner.innerHTML = ""; }

  // ═══ SECTION: Markdown Renderer (Image) ═══════════════════

  var IMAGE_EXTS = /\\.(png|jpe?g|gif|webp|bmp|ico)$/i;

  function createRenderer() {
    return {
      image: function(href, title, text) {
        if (/^https:/.test(href)) {
          return '<img src="' + escapeAttr(href) + '" alt="' + escapeAttr(text) + '">';
        }
        if (/^data:image\\//i.test(href)) {
          // Phase 1: reject SVG in data URIs (script risk)
          if (/^data:image\\/svg/i.test(href)) return '<em>[SVG 数据图片已拒绝]</em>';
          return false; // let marked handle other data:image
        }
        if (/^[a-z]+:/i.test(href)) return '<em>[不支持的图片协议]</em>';

        var cleanHref = href.replace(/[?#].*$/, "");
        var decoded;
        try { decoded = decodeURIComponent(cleanHref); }
        catch(e) { return '<em>[图片路径编码错误]</em>'; }

        var normalized = decoded.replace(/\\\\/g, "/").replace(/\\/+/g, "/");
        if (!normalized) return '<em>[图片路径为空]</em>';
        if (normalized.split("/").some(function(s) { return s === ".."; })) return '<em>[图片路径越界]</em>';
        if (normalized.charAt(0) === "/") return '<em>[图片路径为绝对路径]</em>';
        if (!IMAGE_EXTS.test(normalized)) return '<em>[非图片文件]</em>';

        // Per-segment encoding preserves subdirectory slashes
        var encoded = normalized.split("/").map(function(seg) {
          return encodeURIComponent(seg);
        }).join("/");
        var b = docsBaseUri.charAt(docsBaseUri.length - 1) === "/" ? docsBaseUri : docsBaseUri + "/";
        var fullUri = b + encoded;
        var t = title ? ' title="' + escapeAttr(title) + '"' : "";
        return '<img src="' + escapeAttr(fullUri) + '" alt="' + escapeAttr(text) + '"' + t + '>';
      }
    };
  }

  // ═══ SECTION: DOM Cleanup ═════════════════════════════════

  var DANGEROUS_TAGS = ["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "STYLE"];

  function cleanDom() {
    var i, els;
    for (i = 0; i < DANGEROUS_TAGS.length; i++) {
      els = article.querySelectorAll(DANGEROUS_TAGS[i]);
      for (var j = 0; j < els.length; j++) els[j].remove();
    }
    var all = article.querySelectorAll("*");
    for (i = 0; i < all.length; i++) {
      var attrs = all[i].attributes;
      for (var k = attrs.length - 1; k >= 0; k--) {
        if (attrs[k].name.length > 1 && attrs[k].name.charAt(0) === "o" && attrs[k].name.charAt(1) === "n") {
          all[i].removeAttribute(attrs[k].name);
        }
      }
    }
    var links = article.querySelectorAll("a[href]");
    for (i = 0; i < links.length; i++) {
      var h = links[i].getAttribute("href") || "";
      if (/^javascript:/i.test(h) || /^vbscript:/i.test(h)) links[i].removeAttribute("href");
      else if (/^data:/i.test(h) && !/^data:image\\//i.test(h)) links[i].removeAttribute("href");
    }
  }

  // ═══ SECTION: Heading IDs (Chinese-safe) ══════════════════

  function assignHeadingIds() {
    var headings = article.querySelectorAll("h1, h2, h3, h4");
    var usedIds = {};
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var slug = h.id ? h.id : slugify(h.textContent);
      var id = slug;
      var counter = 2;
      while (usedIds[id]) { id = slug + "-" + counter; counter++; }
      usedIds[id] = true;
      h.id = id;
    }
  }

  // Preserve CJK and Unicode letters; only remove HTML-unsafe chars
  function slugify(text) {
    var s = String(text).trim().toLowerCase()
      .replace(/\\s+/g, "-")
      .replace(/[<>"'\`]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "heading";
  }

  // ═══ SECTION: Link Interception ═══════════════════════════
  // (ENHANCE: Task 6 — 当前为空，链接点击不拦截)

  // ═══ SECTION: Sidebar Toggle ══════════════════════════════

  document.querySelectorAll(".toggle-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var target = document.getElementById(btn.getAttribute("data-target"));
      if (!target) return;
      var side = btn.getAttribute("data-side");
      var isCollapsed = target.classList.toggle("collapsed");
      if (side === "left") {
        btn.textContent = isCollapsed ? "\\u25B6" : "\\u25C0";
      } else {
        btn.textContent = isCollapsed ? "\\u25C0" : "\\u25B6";
      }
      saveState();
    });
  });

  // ═══ SECTION: TOC Navigation ══════════════════════════════
  // (ENHANCE: Task 7)

  var tocTreeData = [];
  function handleToc(tree) { tocTreeData = tree || []; }
  function updateTocActive(file) {}

  // ═══ SECTION: Outline ═════════════════════════════════════
  // (ENHANCE: Task 7)

  function buildOutline() {
    outlineEl.innerHTML = "";
    if (outlineObserver) { outlineObserver.disconnect(); outlineObserver = null; }
  }

  // ═══ SECTION: Search ══════════════════════════════════════
  // (ENHANCE: Task 8)

  function clearSearch() {
    if (baseArticleHtml) { article.innerHTML = baseArticleHtml; buildOutline(); }
    searchHits = []; currentHitIndex = -1;
    updateSearchUI();
  }
  function updateSearchUI() {
    searchCount.textContent = "";
    btnPrev.disabled = true; btnNext.disabled = true; btnClear.disabled = true;
  }

  // ═══ SECTION: State Persistence ═══════════════════════════
  // (ENHANCE: Task 9)

  function saveState() {
    vscodeApi.setState({
      currentFile: currentFile,
      searchQuery: "",
      scrollTop: contentEl.scrollTop,
      leftCollapsed: sideLeft.classList.contains("collapsed"),
      rightCollapsed: sideRight.classList.contains("collapsed")
    });
  }
  function restoreState(state) {}

  // ═══ SECTION: Utilities ═══════════════════════════════════

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function scrollToAnchor(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
`;
```

> **语法有效性：** 所有函数完整闭合，IIFE 完整闭合。`// (ENHANCE: Task N)` 标记处为 no-op stub（空函数体），后续 Task 通过 Edit 工具替换。`marked.use()` 只调用一次（`markedConfigured` 标志）。`scrollSaveTimer` 在 content 滚动时 debounced 调用 `saveState`，确保 scrollTop 实时保存。

- [ ] **Step 2: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 3: 运行测试**

```bash
node tests/test-help-reader.js
```

期望：16 个测试通过。

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): Webview JS 完整骨架

一次性写入完整 IIFE，所有函数完整闭合，文件语法有效。
核心功能完整实现：
- 消息处理 + ready 信号 + getState 恢复文件
- Markdown 渲染 + marked.use 一次性配置
- 图片 renderer：per-segment 编码 + SVG data 拒绝
- DOM 清理 + heading id（中文 slugify）
- 侧栏 toggle（28px 窄条，data-side 区分方向）
- 滚动 debounced saveState
- 错误处理（致命/非致命 + banner）

No-op stub（标记 ENHANCE）：
- 链接拦截 → Task 6
- TOC 导航 + 大纲 → Task 7
- 搜索高亮 → Task 8
- 状态恢复 → Task 9"
```

---

### Task 6: 增强链接拦截

**Files:**
- Modify: `src/commands/help-reader.js`

替换 Task 5 中的链接拦截 stub 为完整实现。支持中文 anchor、`#hash` 当前文档跳转、`.md` 跨文档跳转。

- [ ] **Step 1: 替换链接拦截 stub**

找到标记 `// ═══ SECTION: Link Interception ═════════════════════════════` 及其下一行 `// (ENHANCE: Task 6 — 当前为空，链接点击不拦截)`，替换为以下完整实现：

```js
  // Event delegation on article — survives innerHTML rewrites
  article.addEventListener("click", function(e) {
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    var href = a.getAttribute("href") || "";

    // #anchor — same-document scroll (supports CJK / encoded anchors)
    if (href.charAt(0) === "#" && href.length > 1) {
      var anchorId = decodeURIComponent(href.substring(1));
      if (anchorId) scrollToAnchor(anchorId);
      return;
    }

    // Reject dangerous protocols
    if (/^javascript:/i.test(href)) return;
    if (/^vbscript:/i.test(href)) return;
    if (/^data:/i.test(href)) return;
    if (/^vscode:/i.test(href)) return;
    if (/^command:/i.test(href)) return;

    // http: — reject
    if (/^http:/i.test(href)) return;

    // .md link (with optional #anchor)
    var hashIdx = href.indexOf("#");
    var filePart = hashIdx >= 0 ? href.substring(0, hashIdx) : href;
    if (/\\.md$/i.test(filePart)) {
      var anchorPart = hashIdx >= 0 ? href.substring(hashIdx + 1) : null;
      vscodeApi.postMessage({
        type: "openDoc",
        file: filePart,
        anchor: anchorPart ? decodeURIComponent(anchorPart) : undefined
      });
      return;
    }

    // https: — open external
    if (/^https:/i.test(href)) {
      vscodeApi.postMessage({ type: "openExternal", href: href });
      return;
    }

    // mailto: — open external
    if (/^mailto:/i.test(href)) {
      vscodeApi.postMessage({ type: "openExternal", href: href });
      return;
    }

    // All other — silently ignore
  });
```

> **链接解析改进：** 不使用正则限制 anchor 格式。先按 `#` 分割 href，filePart 以 `.md` 结尾则走 openDoc，anchor 通过 `decodeURIComponent` 支持中文。纯 `#anchor` 走当前文档滚动。事件委托绑定在 `article` 上，`innerHTML` 重写不影响。

- [ ] **Step 2: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): 链接拦截 — 事件委托 + 中文 anchor

事件委托绑定在 article，innerHTML 重写不丢失。
按 # 分割 href，filePart.md 走 openDoc，anchor decode 支持 CJK。
#anchor 当前文档 scrollIntoView。
拒绝 javascript/vbscript/data/vscode/command/http 协议。
https/mailto 走 openExternal。"
```

---

### Task 7: 增强 TOC 导航 + 大纲

**Files:**
- Modify: `src/commands/help-reader.js`

替换 TOC 和 Outline 的 no-op stub 为完整实现。

- [ ] **Step 1: 替换 TOC stub**

找到 `// ═══ SECTION: TOC Navigation ══════════════════════════════` 下的 stub 区域（从 `var tocTreeData = [];` 到 `function updateTocActive(file) {}`），替换为：

```js
  var tocTreeData = [];

  function handleToc(tree) {
    tocTreeData = tree || [];
    navTree.innerHTML = "";
    if (!tocTreeData.length) {
      navTree.innerHTML = '<div class="help-empty">帮助目录配置缺失</div>';
      return;
    }
    tocTreeData.forEach(function(node) {
      navTree.appendChild(renderTocNode(node));
    });
  }

  function renderTocNode(node) {
    var div = document.createElement("div");
    if (node.children && node.children.length) {
      var title = document.createElement("div");
      title.className = "nav-group-title";
      title.textContent = node.title;
      div.appendChild(title);
      var group = document.createElement("div");
      group.className = "nav-group";
      node.children.forEach(function(child) {
        group.appendChild(renderTocNode(child));
      });
      div.appendChild(group);
    } else if (node.file) {
      var item = document.createElement("div");
      item.className = "nav-item";
      item.textContent = node.title;
      item.setAttribute("data-file", node.file);
      item.addEventListener("click", function() {
        vscodeApi.postMessage({ type: "openDoc", file: node.file });
      });
      div.appendChild(item);
    }
    return div;
  }

  function updateTocActive(file) {
    var items = navTree.querySelectorAll(".nav-item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", items[i].getAttribute("data-file") === file);
    }
  }
```

- [ ] **Step 2: 替换 Outline stub**

找到 `// ═══ SECTION: Outline ═════════════════════════════════════` 下的 stub 区域（`function buildOutline() { ... }`），替换为：

```js
  function buildOutline() {
    outlineEl.innerHTML = "";
    if (outlineObserver) { outlineObserver.disconnect(); outlineObserver = null; }

    var headings = article.querySelectorAll("h1, h2, h3, h4");
    if (!headings.length) return;

    var levelMap = { H1: 0, H2: 1, H3: 2, H4: 3 };
    headings.forEach(function(h) {
      var item = document.createElement("div");
      item.className = "outline-item";
      item.style.paddingLeft = (8 + levelMap[h.tagName] * 12) + "px";
      item.textContent = h.textContent;
      item.setAttribute("data-id", h.id);
      item.addEventListener("click", function() {
        setOutlineActive(h.id);
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      outlineEl.appendChild(item);
    });

    outlineObserver = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          setOutlineActive(entries[i].target.id);
          break;
        }
      }
    }, { root: contentEl, rootMargin: "0px 0px -80% 0px" });

    headings.forEach(function(h) { outlineObserver.observe(h); });
  }

  function setOutlineActive(id) {
    var items = outlineEl.querySelectorAll(".outline-item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", items[i].getAttribute("data-id") === id);
    }
  }
```

> **IntersectionObserver 重建：** 每次搜索清除/恢复 `article.innerHTML` 后 `buildOutline()` 被调用，disconnect 旧 observer 并创建新的。heading 内被 `<mark>` 包裹时 `h.textContent` 仍可用。

- [ ] **Step 3: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): TOC 导航树 + 文章大纲

TOC 从 toc.json 渲染树形结构，有 file 的条目可点击加载。
Outline 从 h1-h4 生成缩进树，点击 scrollIntoView。
IntersectionObserver (root=content, rootMargin=-80%) 追踪 active。
每次 innerHTML 重写后 buildOutline 重建 observer。"
```

---

### Task 8: 增强搜索高亮

**Files:**
- Modify: `src/commands/help-reader.js`

替换搜索 stub，实现多匹配搜索。

- [ ] **Step 1: 替换搜索 stub**

找到 `// ═══ SECTION: Search ══════════════════════════════════════` 下的 stub 区域（`function clearSearch()` 和 `function updateSearchUI()`），替换为完整搜索实现：

```js
  var SKIP_TAGS = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, BUTTON: 1 };
  var searchTimer = null;

  searchInput.addEventListener("input", function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      performSearch(searchInput.value.trim());
    }, 200);
  });

  searchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) navigateHit(-1); else navigateHit(1);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      searchInput.value = "";
      clearSearch();
    }
  });

  btnNext.addEventListener("click", function() { navigateHit(1); });
  btnPrev.addEventListener("click", function() { navigateHit(-1); });
  btnClear.addEventListener("click", function() {
    searchInput.value = "";
    clearSearch();
  });

  function performSearch(query) {
    // Restore clean HTML before re-highlighting
    if (baseArticleHtml) {
      article.innerHTML = baseArticleHtml;
      buildOutline(); // innerHTML rewrite → rebuild observer
    }
    searchHits = [];
    currentHitIndex = -1;

    if (!query) { updateSearchUI(); saveState(); return; }

    var lowerQuery = query.toLowerCase();
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        var p = node.parentElement;
        while (p && p !== article) {
          if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    // Collect ALL matches per text node (handles multiple occurrences)
    var matches = [];
    var n;
    while (n = walker.nextNode()) {
      var lower = n.textContent.toLowerCase();
      var offset = 0;
      var idx;
      while ((idx = lower.indexOf(lowerQuery, offset)) >= 0) {
        matches.push({ node: n, idx: idx, len: query.length });
        offset = idx + 1;
      }
    }

    // Wrap matches — group by node, process from end to start within each node
    var byNode = {};
    matches.forEach(function(m) {
      var key = m.node;
      if (!byNode.get) byNode[key] = byNode[key] || []; // plain object fallback
    });

    // Simpler approach: process all matches in reverse document order
    // After each surroundContents, the text node splits, so we must track
    matches.forEach(function(m) {
      // Re-find the match position in the current text node
      // (offsets may shift if earlier matches on same node were processed)
    });

    // Correct approach: collect matches, then process each text node's matches
    // from last to first to avoid offset shifts
    var nodeMatches = {};
    matches.forEach(function(m) {
      var id = m.node;
      if (!nodeMatches[id]) nodeMatches[id] = { node: m.node, hits: [] };
      nodeMatches[id].hits.push(m);
    });

    var allHits = [];
    Object.keys(nodeMatches).forEach(function(key) {
      var entry = nodeMatches[key];
      // Sort by idx descending within this node
      entry.hits.sort(function(a, b) { return b.idx - a.idx; });
      var node = entry.node;
      entry.hits.forEach(function(m) {
        try {
          var range = document.createRange();
          range.setStart(node, m.idx);
          range.setEnd(node, m.idx + m.len);
          var mark = document.createElement("mark");
          mark.className = "hit";
          range.surroundContents(mark);
          allHits.push(mark);
        } catch(e) { /* skip invalid range */ }
      });
    });

    // allHits are in reverse order (last node first, last match first)
    // Reverse to get document order
    searchHits = allHits.reverse();

    if (searchHits.length) navigateHit(1);
    updateSearchUI();
    saveState();
  }

  function clearSearch() {
    if (baseArticleHtml) {
      article.innerHTML = baseArticleHtml;
      buildOutline(); // restore clean headings → rebuild observer
    }
    searchHits = []; currentHitIndex = -1;
    updateSearchUI();
  }

  function navigateHit(dir) {
    if (!searchHits.length) return;
    if (currentHitIndex >= 0 && currentHitIndex < searchHits.length) {
      searchHits[currentHitIndex].classList.remove("current");
    }
    currentHitIndex += dir;
    if (currentHitIndex >= searchHits.length) currentHitIndex = 0;
    if (currentHitIndex < 0) currentHitIndex = searchHits.length - 1;
    searchHits[currentHitIndex].classList.add("current");
    searchHits[currentHitIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    updateSearchUI();
  }

  function updateSearchUI() {
    var hasHits = searchHits.length > 0;
    if (hasHits) {
      searchCount.textContent = (currentHitIndex + 1) + "/" + searchHits.length;
    } else if (searchInput.value.trim()) {
      searchCount.textContent = "无结果";
    } else {
      searchCount.textContent = "";
    }
    btnPrev.disabled = !hasHits;
    btnNext.disabled = !hasHits;
    btnClear.disabled = !searchInput.value;
  }
```

> **多匹配搜索：** 对每个文本节点收集所有匹配位置。按节点分组，同一节点内从末尾到开头处理，避免 `surroundContents` 改变前面的 offset。`searchHits` 计数 = 所有匹配项数量，不是文本节点数量。

- [ ] **Step 2: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 3: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): 搜索高亮 — 多匹配 + 事件委托

- Debounced 200ms 搜索输入
- TreeWalker 收集每个文本节点的所有匹配位置
- 同一节点从末尾到开头处理，避免 offset 偏移
- Enter/Shift+Enter 循环导航，Esc 清除
- 搜索前恢复 baseArticleHtml + 重建 Observer
- 清除搜索后也重建 Observer"
```

---

### Task 9: 增强状态持久化

**Files:**
- Modify: `src/commands/help-reader.js`

替换 `saveState` 和 `restoreState` 的 stub 为完整实现。

- [ ] **Step 1: 替换状态 stub**

找到 `// ═══ SECTION: State Persistence ═════════════════════════════` 下的 stub 区域（`function saveState()` 和 `function restoreState(state) {}`），替换为：

```js
  function saveState() {
    vscodeApi.setState({
      currentFile: currentFile,
      searchQuery: searchInput.value,
      scrollTop: contentEl.scrollTop,
      leftCollapsed: sideLeft.classList.contains("collapsed"),
      rightCollapsed: sideRight.classList.contains("collapsed")
    });
  }

  function restoreState(state) {
    if (!state) return;

    // Restore sidebar collapse state
    if (state.leftCollapsed) {
      sideLeft.classList.add("collapsed");
      var btn = sideLeft.querySelector(".toggle-btn");
      if (btn) btn.textContent = "\\u25B6";
    }
    if (state.rightCollapsed) {
      sideRight.classList.add("collapsed");
      var btn2 = sideRight.querySelector(".toggle-btn");
      if (btn2) btn2.textContent = "\\u25C0";
    }

    // Restore search — set input value then execute
    if (state.searchQuery) {
      searchInput.value = state.searchQuery;
      performSearch(state.searchQuery);
    }

    // Restore scroll position (after DOM renders)
    if (state.scrollTop) {
      requestAnimationFrame(function() {
        contentEl.scrollTop = state.scrollTop;
      });
    }
  }
```

> **状态恢复流程：** `handleDocContent` 中 `firstDocLoaded` 标志确保只恢复一次。普通文档切换时 `searchInput.value = ""` 清空搜索框，`restoreState` 在首次加载时将其恢复。scrollTop 通过 `contentEl` 的 debounced scroll 事件实时保存（Task 5 已注册），`restoreState` 在 `requestAnimationFrame` 后恢复。

- [ ] **Step 2: 语法检查**

```bash
node -c src/commands/help-reader.js && echo "Syntax OK"
```

- [ ] **Step 3: 运行全部测试**

```bash
node tests/test-help-reader.js
```

期望：16 个测试通过。

- [ ] **Step 4: 提交**

```bash
git add src/commands/help-reader.js
git commit -m "feat(help-reader): 状态持久化 + 恢复

saveState: currentFile/searchQuery/scrollTop/sidebar collapse
  + content scroll debounced 300ms 实时保存
restoreState: 首次 docContent 加载后恢复
  - 侧栏折叠状态 + toggle 按钮方向
  - 搜索词恢复 + 重新执行搜索
  - scrollTop requestAnimationFrame 恢复
普通文档切换清空搜索框，首次恢复时 restoreState 重新填充。"
```

---

### Task 10: Extension 集成 + 打包配置

**Files:**
- Modify: `src/extension.js:598-604`
- Modify: `.vscodeignore`

- [ ] **Step 1: 替换 extension.js 中的内联帮助命令**

将第 598-604 行（含 `// ── 帮助文档命令` 注释）替换为：

```js
    // ── 帮助文档命令 ──────────────────────────
    const { register: registerHelpReader } = require('./commands/help-reader');
    registerHelpReader(context);
```

- [ ] **Step 2: 更新 .vscodeignore**

找到 `docs/**` 行。在其**之后**、`benchmarks/**` 行**之前**，添加以下例外规则。由于 `docs/**` 排除了整个 docs 目录，必须先重新允许 `docs/` 再允许子目录：

```text
docs/**
!docs/
!docs/help/
!docs/help/**
!media/
!media/marked.min.js
```

> **注意：** 这些行必须放在 `docs/**` 之后、其他规则之前。如果 `.vscodeignore` 中存在更靠后的 `*.js` 排除规则，需确认 `media/marked.min.js` 仍被保留。最终以 `npx vsce package` + `unzip -l` 验证为准。

- [ ] **Step 3: 语法检查**

```bash
node -c src/extension.js && echo "Syntax OK"
```

- [ ] **Step 4: 提交**

```bash
git add src/extension.js .vscodeignore
git commit -m "feat(help-reader): extension.js 集成 + .vscodeignore 更新

替换内联 sentaurus.openHelp 命令为 help-reader 模块导入。
.vscodeignore 添加 docs/help/ 和 media/ 例外规则，
使用 !docs/ + !docs/help/ + !docs/help/** 三级确保生效。"
```

---

### Task 11: 扩展单元测试 + 清理旧文件

**Files:**
- Modify: `tests/test-help-reader.js`
- Delete: `docs/Built-in Help/`

- [ ] **Step 1: 追加测试**

在 `tests/test-help-reader.js` 的 `summary()` 调用之前追加：

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
```

- [ ] **Step 2: 运行全部测试**

```bash
node tests/test-help-reader.js
```

期望：16 + 3 + 1 + 3 = **23** 个测试全部通过。

- [ ] **Step 3: 检查旧路径残留**

```bash
rg "Built-in Help" . --type-not binary
```

期望：无结果（所有旧引用已迁移）。

```bash
rg "sentaurus.openHelp" . --type-not binary
```

期望：仅在 `package.json`（command contribution + activationEvent）、`package.nls.json`、`package.nls.zh-cn.json`、`src/commands/help-reader.js`、`src/extension.js` 中出现。确认无重复注册。

- [ ] **Step 4: 删除旧帮助文档目录**

```bash
rm -rf "docs/Built-in Help"
```

- [ ] **Step 5: 提交**

```bash
git add tests/test-help-reader.js
git rm -r "docs/Built-in Help"
git commit -m "test(help-reader): 扩展单元测试 + 清理旧目录

- _parseToc: 正常读取、首页条目、children 层级 (3 tests)
- _loadMarkedJs: 加载验证 (1 test)
- _buildHtml: CSP nonce、HTML 结构、marked.js 缺失 fallback (3 tests)
- 总计 23 个测试
- 删除 docs/Built-in Help/（已迁移至 docs/help/）
- rg 确认无旧路径残留、无重复命令注册"
```

---

### Task 12: 手动验收测试

**Files:** 无代码变更（仅在 index.md 中临时添加测试链接）

- [ ] **Step 1: 临时添加测试链接**

在 `docs/help/index.md` 末尾临时添加：

```markdown
## 链接测试

[首页](index.md) | [锚点](#链接测试) | [外部](https://example.com)
[跨文档锚点](getting-started.md#快速开始) | [中文测试](#功能概览)
```

- [ ] **Step 2: 启动 Extension Development Host**

按 F5 启动扩展开发宿主。

- [ ] **Step 3: 基本功能验收**

- [ ] `Ctrl+Shift+P` → `Sentaurus: 打开帮助文档` → 面板打开，显示 index.md
- [ ] 左侧导航显示 toc.json 条目，首页 active
- [ ] 右侧大纲显示 heading 结构
- [ ] 关闭面板，再次执行命令 → 面板重新打开（无报错、无残留引用）

- [ ] **Step 4: 导航验收**

- [ ] 点击左侧各 toc 条目 → 切换文档（占位文档正常显示）
- [ ] 点击不存在的 toc 条目 → 保留当前正文 + 顶部 banner 提示
- [ ] 点击右侧大纲项 → 文章滚动到对应 heading
- [ ] 滚动文章 → 大纲 active 项跟随变化

- [ ] **Step 5: 链接验收**

- [ ] 点击 `[首页](index.md)` → 重新加载 index.md
- [ ] 点击 `[锚点](#链接测试)` → 滚动到"链接测试" heading
- [ ] 点击 `[跨文档锚点](getting-started.md#快速开始)` → 加载 getting-started.md 并滚动到锚点
- [ ] 点击 `[外部](https://example.com)` → 外部浏览器打开
- [ ] 中文 heading 的 `#链接测试` 和 `#功能概览` 跳转正确

- [ ] **Step 6: 搜索验收**

- [ ] 输入 "语法" → 匹配项高亮，计数 N/M（同一文本多次出现时计数正确）
- [ ] 点击 ▲▼ → 循环跳转
- [ ] Enter/Shift+Enter → 上下跳转
- [ ] Esc → 清除搜索
- [ ] 切换文档后搜索框和搜索状态被清空

- [ ] **Step 7: 侧栏验收**

- [ ] 点击左侧 ◀ → 左侧栏折叠为 28px 窄条，按钮变为 ▶
- [ ] 点击 ▶ → 左侧栏展开，按钮恢复 ◀
- [ ] 点击右侧 ▶ → 右侧栏折叠为 28px 窄条，按钮变为 ◀
- [ ] 点击 ◀ → 右侧栏展开，按钮恢复 ▶

- [ ] **Step 8: 状态恢复验收**

- [ ] 滚动到文章中部 → 隐藏面板（切到其他 tab）→ 再次点击命令 → 恢复到原文档和滚动位置
- [ ] 搜索 "功能" → 隐藏面板 → 恢复 → 搜索词和高亮恢复
- [ ] 折叠左侧栏 → 隐藏面板 → 恢复 → 左侧栏仍折叠

- [ ] **Step 9: 安全验收**

- [ ] CSP 无报错（打开 DevTools → Console 无 CSP violation）
- [ ] `http://` 图片被拒绝（不与 CSP 冲突）
- [ ] 深色/浅色主题切换 → UI 颜色正常跟随

- [ ] **Step 10: 打包验证**

```bash
npx vsce package
unzip -l sentaurus-tcad-syntax-*.vsix | grep -E "(docs/help|media/marked|THIRD_PARTY)"
```

期望包含：
- `docs/help/index.md`、`docs/help/toc.json`、`docs/help/getting-started.md` 等
- `media/marked.min.js`
- `THIRD_PARTY_NOTICES.md`

- [ ] **Step 11: 清理测试链接 + 最终提交**

还原 `docs/help/index.md` 中的临时测试链接。

```bash
git checkout docs/help/index.md
```

如有验收修复，提交修复。否则跳过。

---

## Self-Review

### 1. Spec v3.1 Coverage

| Spec 需求 | Task | 状态 |
|-----------|------|------|
| 命令面板入口 | Task 3 + 10 | ✅ |
| toc.json 加载 + 显示 | Task 7 (handleToc) | ✅ |
| Markdown 渲染（Webview 端） | Task 5 (handleDocContent) | ✅ |
| DOM 清理 | Task 5 (cleanDom) | ✅ |
| heading id（中文 slug） | Task 5 (slugify + assignHeadingIds) | ✅ |
| 链接拦截（事件委托） | Task 6 (article click delegation) | ✅ |
| 图片路径校验 + URI 拼接 | Task 5 (createRenderer) | ✅ |
| 右侧大纲 + IntersectionObserver | Task 7 (buildOutline) | ✅ |
| 搜索多匹配 + 高亮 + 导航 | Task 8 (performSearch) | ✅ |
| 状态持久化 + scrollTop 实时保存 | Task 5 (scroll listener) + Task 9 | ✅ |
| 侧栏折叠（28px 窄条可展开） | Task 4 (CSS) + Task 5 (toggle) | ✅ |
| CSP nonce | Task 3 (_buildHtml) | ✅ |
| marked.js 缺失 fallback | Task 5 (typeof marked check) | ✅ |
| 路径安全校验（Windows 绝对路径） | Task 2 (_validatePath) | ✅ |
| openExternal 协议限制 | Task 3 (_handleMessage) | ✅ |
| ready fallback 到 index.md | Task 3 (_handleMessage ready) | ✅ |
| 非致命错误 banner | Task 5 (showBanner/hideBanner) | ✅ |
| .vscodeignore | Task 10 | ✅ |
| THIRD_PARTY_NOTICES | Task 1 | ✅ |
| 占位文档 | Task 1 | ✅ |

### 2. Placeholder Scan

无 `TBD`/`TODO`/`implement later`/`fill in`。每个 Task 包含完整代码或明确标记的 stub（`// (ENHANCE: Task N)`），后续 Task 替换。

### 3. 语法有效性检查

| Task 结束时 | 文件语法有效？ |
|------------|---------------|
| Task 2 | ✅ `node -c` 通过 |
| Task 3 | ✅ `node -c` 通过 |
| Task 4 | ✅ `node -c` 通过（CSS/HTML_BODY 填充，WEBVIEW_JS 仍为空字符串） |
| Task 5 | ✅ `node -c` 通过（WEBVIEW_JS 完整 IIFE，所有函数闭合） |
| Task 6 | ✅ `node -c` 通过（替换 stub 为完整代码） |
| Task 7 | ✅ `node -c` 通过 |
| Task 8 | ✅ `node -c` 通过 |
| Task 9 | ✅ `node -c` 通过 |

### 4. Node 测试环境

所有测试通过 `tests/helpers/mock-vscode.js` mock `vscode` 模块，无需 VSCode 运行时。`node tests/test-help-reader.js` 可在普通 Node 环境运行。

### 5. 修订项闭环检查

| # | 要求 | 闭环 |
|---|------|------|
| 一 | WEBVIEW_JS 中间文件语法无效 → Task 5 完整骨架 + stub 替换 | ✅ |
| 二 | require('vscode') 失败 → mock-vscode.js + Module._load | ✅ |
| 三 | 测试对象构造 → createReader() 含 context/docsDir | ✅ |
| 四 | Windows 绝对路径 → /^[a-zA-Z]:/ + /^\\\\/ + 测试 | ✅ |
| 五 | ready fallback → _validatePath + _sendDocument boolean | ✅ |
| 六 | 错误语义 → nonFatal + banner + handleError 分支 | ✅ |
| 七 | 侧栏无法展开 → 28px 窄条 + data-side 方向 | ✅ |
| 八 | 中文 heading slug → slugify 保留 Unicode | ✅ |
| 九 | .md#anchor 解析 → 按 # 分割 + decodeURIComponent | ✅ |
| 十 | 搜索单命中 → 收集所有匹配 + 节点内从后往前 | ✅ |
| 十一 | 搜索/observer 关系 → buildOutline 重建说明 | ✅ |
| 十二 | 搜索框未清空 → handleDocContent 中 searchInput.value = "" | ✅ |
| 十三 | scrollTop 实时保存 → debounced scroll listener (300ms) | ✅ |
| 十四 | marked.use 叠加 → markedConfigured 标志，仅一次 | ✅ |
| 十五 | 图片 URI 编码 → per-segment encodeURIComponent + escapeAttr | ✅ |
| 十六 | .vscodeignore → 三级例外 !docs/ + !docs/help/ + !docs/help/** | ✅ |
| 十七 | 占位文档 → 7 个 .md 占位文件 | ✅ |
| 十八 | marked license → THIRD_PARTY_NOTICES.md (Task 1) | ✅ |
| 十九 | Unicode 转义说明 → 删除"使用转义"注释，明确 UTF-8 | ✅ |
| 二十 | grep 清理旧路径 → Task 11 Step 3 | ✅ |
| 二十一 | 验收测试 → Task 12 增加中文 anchor、多命中、侧栏、scrollTop 等 | ✅ |
| 二十二 | 计划结构 → 每个 Task 语法有效、测试可运行 | ✅ |
