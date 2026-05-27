// src/commands/help-reader.js
'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ═══════════════════════════════════════
// Webview 模板字符串常量（后续 Task 逐步填充）
// ═══════════════════════════════════════

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
                this.panel.webview.postMessage({
                    type: 'error', message: '无法加载首页: ' + e.message, file: file
                });
            } else {
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
                const restoreFile = this._validatePath(msg.restoreFile) ? msg.restoreFile : 'index.md';
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
}

function register(context) {
    const reader = new HelpReader(context);
    reader.register();
}

module.exports = { register, _HelpReader: HelpReader };
