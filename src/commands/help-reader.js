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
    // Reset search state only (don't restore old article via clearSearch)
    // clearSearch writes baseArticleHtml back to article which is wasteful
    // since we're about to overwrite article.innerHTML anyway
    searchInput.value = "";
    searchHits = [];
    currentHitIndex = -1;
    updateSearchUI();
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
      scrollToAnchor(msg.anchor);
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
      article.innerHTML = '<div class="help-error">' + escapeHtml(msg.message) + '</div>';
    } else {
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
          if (/^data:image\\/svg/i.test(href)) return '<em>[SVG 数据图片已拒绝]</em>';
          return false;
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

  function slugify(text) {
    var s = String(text).trim().toLowerCase()
      .replace(/\\s+/g, "-")
      .replace(/[<>"'\`]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "heading";
  }

  // ═══ SECTION: Link Interception ══════════════════════════
  // Safe decode — malformed % encoding won't crash the click handler
  function safeDecodeURIComponent(s) {
    try { return decodeURIComponent(s); }
    catch (e) { return s; }
  }

  // Event delegation on article — survives innerHTML rewrites
  article.addEventListener("click", function(e) {
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    var href = a.getAttribute("href") || "";

    // #anchor — same-document scroll (supports CJK / encoded anchors)
    if (href.charAt(0) === "#" && href.length > 1) {
      var anchorId = safeDecodeURIComponent(href.substring(1));
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
    if (/.md$/i.test(filePart)) {
      var anchorPart = hashIdx >= 0 ? href.substring(hashIdx + 1) : null;
      // Phase 1: file name is sent as-is (no decode), anchor is safely decoded
      vscodeApi.postMessage({
        type: "openDoc",
        file: filePart,
        anchor: anchorPart ? safeDecodeURIComponent(anchorPart) : undefined
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

  // ═══ SECTION: Outline ═════════════════════════════════════

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

  // ═══ SECTION: Search ══════════════════════════════════════
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
    if (baseArticleHtml) {
      article.innerHTML = baseArticleHtml;
      buildOutline();
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

    // Use Map — DOM nodes cannot be plain object keys (all stringify to "[object Text]")
    var nodeMap = new Map();
    matches.forEach(function(m) {
      if (!nodeMap.has(m.node)) nodeMap.set(m.node, []);
      nodeMap.get(m.node).push(m);
    });

    // Process each node's matches from last to first to preserve offsets
    searchHits = [];
    nodeMap.forEach(function(hits, node) {
      hits.sort(function(a, b) { return b.idx - a.idx; });
      var nodeMarks = [];
      hits.forEach(function(m) {
        try {
          var range = document.createRange();
          range.setStart(node, m.idx);
          range.setEnd(node, m.idx + m.len);
          var mark = document.createElement("mark");
          mark.className = "hit";
          range.surroundContents(mark);
          nodeMarks.push(mark);
        } catch(e) { /* skip invalid range */ }
      });
      // nodeMarks are last-to-first; reverse to document order
      for (var i = nodeMarks.length - 1; i >= 0; i--) {
        searchHits.push(nodeMarks[i]);
      }
    });

    if (searchHits.length) navigateHit(1);
    updateSearchUI();
    saveState();
  }

  function clearSearch() {
    if (baseArticleHtml) {
      article.innerHTML = baseArticleHtml;
      buildOutline();
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

  // ═══ SECTION: State Persistence ═══════════════════════════
  // (ENHANCE: Task 9)

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
