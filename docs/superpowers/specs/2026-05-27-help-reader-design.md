# Webview 帮助阅读器设计

## 背景

当前 `sentaurus.openHelp` 命令使用 VSCode 内置 Markdown Preview 打开帮助文档。内置 Preview 无法满足以下需求：左侧 toc 导航、右侧文章大纲、搜索高亮与跳转、多篇文档切换、自定义样式。需要一个基于 WebviewPanel 的自定义帮助阅读器。

## 架构

### 渲染位置决策

**采用方案 A：Markdown 渲染在 Webview 端执行。**

- Extension 侧：只负责读取 Markdown 源文件、校验路径、生成安全资源基准 URI、通过 postMessage 发送原始 Markdown 内容。
- Webview 端：接收 Markdown 内容后，用内联的 marked.js 执行 `marked.parse()` 渲染为 HTML，随后执行 DOM 清理、heading id 分配、链接拦截、图片 URI 拼接、大纲构建。
- 图片 URI 转换：Extension 在 `docContent` 消息中附带 `docsBaseUri`（`panel.webview.asWebviewUri(docsDir).toString()`），Webview 端 marked renderer image hook 使用该 base URI 拼接相对图片路径。
- Extension 侧不加载也不执行 marked.js，不参与 Markdown→HTML 转换。
- 消息协议中 `docContent.content` 始终是原始 Markdown 文本，不是 HTML。

### 文件结构

```
src/commands/help-reader.js    ← 主模块（扩展侧逻辑 + Webview HTML 模板）
media/marked.min.js            ← 内置 marked.js（~20KB，离线可用）
docs/help/
  index.md                     ← 首页（占位）
  toc.json                     ← 导航目录声明
  *.md                         ← 其他帮助文档（后续补充）
  images/                      ← 图片资源（后续补充）
```

> 路径不含空格，所有路径拼接使用 `vscode.Uri.joinPath`，禁止字符串拼接。

### 数据流

```
用户触发命令 → register() → HelpReader.show()
  → panel 已存在? → reveal() → return
  → 创建 WebviewPanel
  → _buildHtml(): fs.readFileSync marked.js 内联到 <script nonce>
  → Webview 加载 → 读取 getState()
  → Webview 发送 { type: 'ready', restoreFile }
  → Extension 读 toc.json → 收集允许文件集合 → 发送 { type: 'toc', tree }
  → Extension 加载 restoreFile（非法则退回 index.md）
  → Extension 发送 { type: 'docContent', content, file, docsBaseUri }
  → Webview: marked.parse() 渲染 → DOM 清理 → heading id → 链接拦截 → 大纲
  → Webview: 恢复侧栏折叠 / 搜索词 / 滚动位置 / toc active
```

### 消息协议

所有消息统一使用对象 envelope 格式：

| 方向 | type | 数据 | 说明 |
|------|------|------|------|
| WV → Ext | `ready` | `{ type: 'ready', restoreFile?: string }` | Webview 加载完成，携带恢复文件名 |
| WV → Ext | `openDoc` | `{ type: 'openDoc', file: string, anchor?: string }` | 请求加载文档（可选锚点） |
| WV → Ext | `openExternal` | `{ type: 'openExternal', href: string }` | 请求打开外部链接 |
| Ext → WV | `toc` | `{ type: 'toc', tree: [...] }` | 导航目录树 |
| Ext → WV | `docContent` | `{ type: 'docContent', content: string, file: string, docsBaseUri: string, anchor?: string }` | Markdown 内容 + 资源基准 URI + 可选锚点 |
| Ext → WV | `error` | `{ type: 'error', message: string, file?: string }` | 错误通知 |

## 模块设计

### `src/commands/help-reader.js`

**导出**：`module.exports = { register }`，与 snippet-picker 模式一致。

**内部 HelpReader 类**：

| 方法 | 职责 |
|------|------|
| `constructor(context)` | 存储 context、docsDir；初始化 `this.panel = undefined` |
| `register()` | 注册 `sentaurus.openHelp` 命令到 `context.subscriptions` |
| `show()` | panel 已存在则 `reveal()`；否则创建新 panel |
| `_loadMarkedJs()` | fs.readFileSync 读取 marked.min.js；失败返回空字符串 |
| `_buildHtml(markedJs)` | 生成完整 Webview HTML（含 nonce CSP、内联 CSS、内联 marked + JS） |
| `_parseToc()` | 读取 toc.json → 返回 tree；失败返回空数组 |
| `_validatePath(file)` | 路径安全校验（见下方规则），返回 true/false |
| `_sendToc()` | 调用 `_parseToc()` → 发送 `{ type: 'toc', tree }` |
| `_sendDocument(file, anchor?)` | 校验路径 → 读取 .md → 发送 `{ type: 'docContent', content, file, docsBaseUri, anchor? }` |
| `_handleMessage(msg)` | 统一消息分发（ready / openDoc / openExternal） |

### 路径安全校验

所有文档路径和图片路径（Webview 端）使用统一的边界校验方法：

**Extension 侧文档路径校验（`_validatePath`）：**

```js
function _validatePath(file) {
    if (!file || typeof file !== 'string') return false;
    // 禁止绝对路径
    if (path.isAbsolute(file)) return false;
    const docsDirFsPath = this.docsDirFsPath; // 已 normalize
    const resolved = path.resolve(docsDirFsPath, file);
    const rel = path.relative(docsDirFsPath, resolved);
    // rel 为空字符串 → 指向 docsDir 自身，拒绝
    // rel 以 .. 开头 → 越界，拒绝
    // rel 为绝对路径 → 异常，拒绝
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
    // 扩展名必须为 .md（不区分大小写）
    if (!rel.toLowerCase().endsWith('.md')) return false;
    return true;
}
```

**白名单策略与兜底策略的关系：**

- 采用**宽松策略**：toc.json 用于左侧导航展示，但 Markdown 内部链接可以打开 docsDir 内任意 `.md` 文件
- 所有 `openDoc` 请求必须经过 `_validatePath` 边界校验 + `.md` 扩展名校验
- toc.json 白名单仅影响导航展示，不限制可打开的文件范围

**Webview 端图片路径校验规则：**

marked renderer image hook 对相对图片路径按以下步骤校验和处理：

1. 去掉 query/hash：`href.replace(/[?#].*$/, '')`
2. **先 `decodeURIComponent`**，防止 `%2e%2e` 编码绕过 `..` 检测
3. normalize 分隔符：`replace(/\\/g, '/').replace(/\/+/g, '/')`
4. **拒绝**空路径、绝对路径（含 `/` 开头）、包含 `..` 路径段的路径
5. **仅允许**常见图片扩展名：`.png`、`.jpg`、`.jpeg`、`.gif`、`.svg`、`.webp`、`.bmp`、`.ico`（不区分大小写）
6. 用 `encodeURI` 编码后基于 `docsBaseUri` 拼接：`new URL(encodeURI(decoded), docsBaseUri).toString()`（确保 docsBaseUri 以 `/` 结尾）

```js
// Webview 端 renderer image hook
const IMAGE_EXTS = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i;

const renderer = {
    image(href, title, text) {
        // 1. 外部 https 图片：保留
        if (/^https:/.test(href)) return false;
        // 2. data:image 图片：校验前缀
        if (/^data:image\//i.test(href)) return false;
        // 3. 拒绝所有其他协议（http: javascript: file: vscode: command: 等）
        if (/^[a-z]+:/i.test(href)) {
            return `<em>[不支持的图片协议]</em>`;
        }
        // 4. 相对路径校验
        const cleanHref = href.replace(/[?#].*$/, '');
        const decoded = decodeURIComponent(cleanHref);
        const normalized = decoded.replace(/\\/g, '/').replace(/\/+/g, '/');
        // 拒绝空路径
        if (!normalized) return `<em>[图片路径为空]</em>`;
        // 拒绝 .. 越界（按路径段检查，非简单 includes）
        if (normalized.split('/').some(seg => seg === '..')) {
            return `<em>[图片路径越界]</em>`;
        }
        // 拒绝绝对路径
        if (normalized.startsWith('/')) {
            return `<em>[图片路径为绝对路径]</em>`;
        }
        // 仅允许图片扩展名
        if (!IMAGE_EXTS.test(normalized)) {
            return `<em>[非图片文件]</em>`;
        }
        // 拼接 base URI（确保 base 以 / 结尾）
        const base = docsBaseUri.endsWith('/') ? docsBaseUri : docsBaseUri + '/';
        const fullUri = base + encodeURI(normalized);
        const titleAttr = title ? ` title="${escAttr(title)}"` : '';
        return `<img src="${fullUri}" alt="${escAttr(text)}"${titleAttr}>`;
    }
};
marked.use({ renderer });
```

### WebviewPanel 配置

```js
vscode.window.createWebviewPanel('sentaurusHelp', 'Sentaurus Help', vscode.ViewColumn.Active, {
    enableScripts: true,
    enableFindWidget: true,        // VSCode 原生 Ctrl+F 作为 fallback
    retainContextWhenHidden: false, // 轻量帮助阅读器，用 getState/setState 恢复
    localResourceRoots: [docsDir]   // marked.js 内联，mediaDir 不需要
});
```

- `enableFindWidget: true`：提供 VSCode 原生查找控件作为搜索 fallback
- `retainContextWhenHidden: false`：帮助阅读器状态简单，使用 `acquireVsCodeApi().setState/getState` 恢复状态
- `enableCommandUris` 保持默认 `false`，不启用 command URI
- `localResourceRoots` 仅包含 docsDir。若未来改为加载外部资源文件再扩展

### Webview 状态持久化与恢复

**保存的状态：**

```js
{
    currentFile: 'index.md',     // 当前文档文件名
    searchQuery: '',             // 搜索词
    scrollTop: 0,                // 文章滚动位置
    leftCollapsed: false,        // 左侧栏是否折叠
    rightCollapsed: false        // 右侧栏是否折叠
}
```

**状态恢复流程（panel 重建时）：**

1. Webview 启动后读取 `vscode.getState()`，提取 `state.currentFile` 和 `state.restoreFile`
2. Webview 发送 `{ type: 'ready', restoreFile: state?.currentFile || 'index.md' }`
3. Extension 收到 `ready` 后：
   - 发送 toc
   - 校验 `restoreFile`：若通过 `_validatePath` 则加载，否则退回 `index.md`
   - 发送 `{ type: 'docContent', content, file, docsBaseUri }`
4. Webview 收到 `docContent` 后，完成渲染、DOM 清理、heading id、链接拦截、大纲构建：
   - 恢复左右侧栏折叠状态
   - 恢复搜索词并重新执行搜索
   - 恢复 `content.scrollTop`（需在 DOM 渲染后异步设置，如 `requestAnimationFrame`）
   - 更新 toc active 状态
   - 若 `docContent.anchor` 存在，渲染完成后滚动到对应 heading

**两种路径的区分：**

| 操作 | 搜索状态 | 滚动位置 | toc active |
|------|----------|----------|------------|
| **普通文档切换**（用户点击 toc 或 `.md` 链接） | 清空 | 滚动到顶部（或锚点） | 更新为当前文档 |
| **Panel 恢复**（隐藏后 reveal） | 恢复搜索词并重新搜索 | 恢复 scrollTop | 恢复为当前文档 |

### CSP

```js
const nonce = crypto.randomBytes(16).toString('hex');
const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`
].join('; ');
```

- 使用 `webview.cspSource` 确保通过 `asWebviewUri()` 转换的本地图片不被阻止
- script 使用 nonce，所有 `<script>` 标签必须带 `nonce="${nonce}"` 属性
- marked.js 内容内联在 `<script nonce="${nonce}">` 中
- `img-src` 允许 `${webview.cspSource}`（本地图片 via asWebviewUri）、`https:`（外部图片）、`data:`（内联图片）
- 不允许 `http:` 图片

## Markdown 安全边界

### Phase 1 信任模型

Phase 1 只渲染**扩展包内置的可信 Markdown 文档**，不从 workspace 读取用户文档。

### 渲染后处理顺序

Webview 端收到 Markdown 内容后，按以下严格顺序执行：

1. **marked 渲染**：`marked.parse(content)` → HTML 字符串
2. **写入临时容器**：将 HTML 写入 article 的 innerHTML
3. **DOM 清理**：移除危险标签（`<script>`、`<iframe>`、`<object>`、`<embed>`、`<link>`、`<style>`）、危险属性（`onclick`、`onerror`、`onload` 等所有 `on*` 事件属性）、危险协议链接（`javascript:`、`data:` 非 image、`vbscript:`）
4. **分配 heading id**：对 `h1~h4` 元素生成稳定 slug，处理去重
5. **绑定链接拦截**：在 `article` 上使用**事件委托**绑定一次 click 监听，通过 `event.target.closest('a')` 匹配链接，按链接规则处理。事件委托不受 `innerHTML` 重写影响
6. **构建大纲**：从 heading 元素提取信息，生成右侧大纲树；建立 IntersectionObserver 观察 heading 元素
7. **保存 baseArticleHtml**：`baseArticleHtml = article.innerHTML`，供搜索恢复使用

此顺序确保 baseArticleHtml 是已清理、已标记的安全快照。搜索时先恢复此快照再高亮，搜索后无需重复清理。

## 导航目录（toc.json）

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

- 首页条目 `{ "title": "首页", "file": "index.md" }` 必须存在，确保首次打开时左侧导航有 active 项
- 有 `file` 的条目是文档链接（可点击，点击后加载对应 .md）
- 无 `file` 的条目是分类标题（纯展示，可展开/折叠子项）
- 分类标题默认展开

## 图片处理

Extension 侧在 `docContent` 消息中附带 `docsBaseUri`（`panel.webview.asWebviewUri(docsDir).toString()`）。Webview 端的 marked renderer image hook 负责图片 URI 转换（实现代码见"路径安全校验 > Webview 端图片路径校验规则"章节）。

**允许的图片来源：**

| 类型 | 规则 | 处理方式 |
|------|------|----------|
| 相对路径 | `./images/a.png`、`images/a.png`、`images/sub dir/a.png` | 拼接 `docsBaseUri` + 路径 |
| `https:` 图片 | `https://example.com/img.png` | 保留原样 |
| `data:image/*` | `data:image/png;base64,...` | 保留原样 |

**拒绝的图片来源：**

| 类型 | 原因 |
|------|------|
| `http:` | 明文不安全，CSP 也不允许 |
| `javascript:` | 安全风险 |
| `file:` | 本地文件系统访问 |
| `vscode:` / `command:` | VSCode 内部协议 |
| `data:` 非 image | 仅允许 `data:image/...` 前缀 |
| 包含 `..` 的相对路径 | 越界风险 |

## 链接处理规则

所有 `<a>` 元素点击必须 `preventDefault()`，禁止 Webview iframe 自行导航。

| 链接格式 | 行为 | 实现方式 |
|----------|------|----------|
| `#anchor` | 当前文档内滚动到对应 heading | Webview 端直接 `document.getElementById(anchor)?.scrollIntoView()` |
| `doc.md` | 加载目标文档 | `postMessage({ type: 'openDoc', file: 'doc.md' })` |
| `doc.md#anchor` | 加载目标文档后滚动到锚点 | `postMessage({ type: 'openDoc', file: 'doc.md', anchor: 'anchor' })`；Extension 在 `docContent` 中附带 `anchor`，Webview 渲染完成后滚动到锚点 |
| `https://...` | 外部浏览器打开 | `postMessage({ type: 'openExternal', href })`；Extension 侧校验协议为 `https:` 后调用 `vscode.env.openExternal()` |
| `http://...` | 拒绝 | Webview 端提示"不安全的链接"，不发送 openExternal |
| `mailto:` | Phase 1 交给 openExternal | Extension 侧校验 `mailto:` 前缀后调用 `vscode.env.openExternal()` |
| `javascript:` | 拒绝 | 不绑定点击处理（DOM 清理阶段已移除） |
| `vscode:` / `command:` | 拒绝 | 不绑定点击处理 |
| 其他协议 | 默认拒绝 | 不绑定点击处理 |

**Extension 侧 `openExternal` 校验：**

```js
case 'openExternal':
    const href = msg.href;
    if (/^https:/i.test(href) || /^mailto:/i.test(href)) {
        vscode.env.openExternal(vscode.Uri.parse(href));
    }
    // 拒绝 http: 和其他协议
    break;
```

## Webview 端设计

### 布局

```
┌─────────────┬──────────────────────────┬─────────────┐
│ ◀ 左侧栏    │                          │ 大纲 ▶      │
│ ─────────── │                          │ ─────────── │
│ 🔍 搜索      │    文章内容               │ H1 标题     │
│  N/M  ▲ ▼ ✕ │    (marked.js 渲染)       │   H2 标题   │
│ ─────────── │                          │   H2 标题   │
│ 首页  ◄      │                          │ H1 标题     │
│ 入门指南     │                          │   H3 标题   │
│   快速开始   │                          │             │
│   安装配置   │                          │             │
│ 功能特性     │                          │             │
│   语法高亮   │                          │             │
│   自动补全   │                          │             │
└─────────────┴──────────────────────────┴─────────────┘
    ↕ 可折叠                                ↕ 可折叠
```

**侧栏折叠**：每个侧栏顶部有 toggle 按钮，点击后宽度 CSS transition 到 0。内容区 flex 自动扩展。折叠状态通过 `setState` 持久化。

### 搜索

- **范围**：仅限 `article` 元素内，不遍历导航树、大纲、按钮文本
- **输入**：debounced 200ms
- **跳过节点**：TreeWalker 遍历文本节点时，跳过 `pre`、`code`、`script`、`style`、`textarea`、`input`、`button` 内的文本（降低 DOM 破坏风险）。如需搜索代码块，需单独说明并在后续迭代中处理
- **高亮流程**（严格顺序）：
  1. 恢复 `article.innerHTML = baseArticleHtml`（已包含 heading id）
  2. innerHTML 重写后 heading 元素被替换，必须**重建 IntersectionObserver** 重新观察新 heading 节点，否则大纲 active 丢失
  3. 链接拦截使用事件委托（绑定在 `article` 上），innerHTML 重写不影响，无需重新绑定
  4. TreeWalker 遍历 article 内文本节点，匹配文本包裹进 `<mark class="hit">`
  5. 当前导航项加 `<mark class="hit current">`
- **导航**：`<mark class="hit current">` 标记当前匹配项，上/下按钮循环导航，`scrollIntoView({ behavior: 'smooth', block: 'center' })`
- **计数器**：显示 `N/M`（无结果时显示"无结果"）
- **清除**：恢复 `article.innerHTML = baseArticleHtml`、清空命中数组、计数器恢复空状态
- **键盘快捷键**：
  - `Enter`：下一个匹配
  - `Shift+Enter`：上一个匹配
  - `Esc`：清除搜索

### 大纲

- marked 渲染并完成 DOM 清理后，查询 `article h1, h2, h3, h4`
- **heading id**：使用稳定 slug（`textContent` 转小写、去标点、空格转 `-`）+ index 去重
  - 示例：`getting-started`、`syntax-highlighting`、`syntax-highlighting-2`（重复时追加序号）
  - 如果 heading 元素已有 `id`，保留原值并在冲突时追加序号
- 生成缩进树（h1 无缩进，h2 缩进一级，以此类推）
- 点击 → `scrollIntoView({ behavior: 'smooth', block: 'start' })` → **立即**设置对应大纲项为 active（不等 IntersectionObserver）
- **IntersectionObserver**：
  - `root` 设为 `document.getElementById('content')`（文章滚动容器，非 viewport）
  - `rootMargin: '0px 0px -80% 0px'` 使内容区顶部可见的标题被激活
  - 滚动时自动更新大纲 active 项

### 文档切换

- 左侧栏渲染 toc.json 树形结构
- 当前文档条目高亮（`active` class）
- **普通文档切换**（用户点击 toc 或 `.md` 链接）：
  1. 清空搜索状态（搜索框、命中数组、计数器）
  2. 渲染新文档 → 重建大纲
  3. 若有 anchor → 滚动到锚点；否则滚动到顶部
  4. 更新 toc active 状态
  5. 保存 webview state
- **Panel 恢复**（隐藏后 reveal）：
  1. 恢复侧栏折叠状态
  2. 恢复搜索词并重新执行搜索
  3. 恢复 scrollTop（`requestAnimationFrame` 后设置）
  4. 恢复 toc active 状态

### 样式

全部使用 VSCode CSS 变量，自动跟随用户主题：

| 元素 | 变量 |
|------|------|
| 侧栏背景 | `--vscode-sideBar-background` |
| 内容背景 | `--vscode-editor-background` |
| 文字色 | `--vscode-foreground` |
| 链接色 | `--vscode-textLink-foreground` |
| 代码块背景 | `--vscode-textCodeBlock-background` |
| 选中项 | `--vscode-list-activeSelectionBackground` / `Foreground` |
| 输入框 | `--vscode-input-background` / `--vscode-input-border` |
| 搜索高亮 | `--vscode-editor-findMatchBackground` |
| focus 边框 | `--vscode-focusBorder` |
| 描述文字 | `--vscode-descriptionForeground` |
| hover 背景 | `--vscode-list-hoverBackground` |

代码块仅背景色区分，不引入 highlight.js（保持轻量）。

### HTML 结构

```html
<body>
  <aside id="sidebar-left" role="navigation" aria-label="文档导航">
    <div class="sidebar-header">
      <span class="sidebar-title">导航</span>
      <button class="toggle-btn" data-target="sidebar-left"
              aria-label="折叠导航栏">◀</button>
    </div>
    <div class="sidebar-body">
      <div class="search-section">
        <input id="search-input" type="text" placeholder="搜索文档..."
               aria-label="搜索文档内容">
        <div id="search-controls">
          <span id="search-count" aria-live="polite"></span>
          <button id="btn-prev" aria-label="上一个匹配" disabled>▲</button>
          <button id="btn-next" aria-label="下一个匹配" disabled>▼</button>
          <button id="btn-clear" aria-label="清除搜索" disabled>✕</button>
        </div>
      </div>
      <nav id="nav-tree" role="tree"></nav>
    </div>
  </aside>

  <main id="content" role="document">
    <article id="article">加载中...</article>
  </main>

  <aside id="sidebar-right" role="navigation" aria-label="文章大纲">
    <div class="sidebar-header">
      <button class="toggle-btn" data-target="sidebar-right"
              aria-label="折叠大纲栏">◀</button>
      <span class="sidebar-title">大纲</span>
    </div>
    <div class="sidebar-body">
      <div id="outline" role="tree"></div>
    </div>
  </aside>
</body>
```

## 可访问性与键盘操作

- 所有按钮设置 `aria-label`
- 搜索框支持 `Enter`（下一个）、`Shift+Enter`（上一个）、`Esc`（清除）
- 左右侧栏折叠按钮可键盘触发（原生 `<button>` 已支持）
- active 项和 focus 状态使用 VSCode 主题变量（`--vscode-focusBorder`、`--vscode-list-activeSelectionBackground`），不依赖颜色区分
- 搜索计数器使用 `aria-live="polite"` 让屏幕阅读器播报结果数

## 生命周期管理

- HelpReader 维护单例 `this.panel`
- `show()` 中：`this.panel` 存在 → `this.panel.reveal()`；不存在 → 创建新 panel
- 必须注册 `this.panel.onDidDispose(() => { this.panel = undefined; })`，防止关闭后引用失效
- 命令注册使用 `context.subscriptions.push(vscode.commands.registerCommand(...))`
- extension.js 中删除旧的 `sentaurus.openHelp` 内联实现，只保留 `registerHelpReader(context)`，避免重复注册同一个 command id

## extension.js 集成

替换现有内联命令注册：

```js
// 旧代码（删除）：
// context.subscriptions.push(
//     vscode.commands.registerCommand('sentaurus.openHelp', () => {
//         const helpPath = vscode.Uri.joinPath(context.extensionUri, 'docs', 'Built-in Help', 'index.md');
//         vscode.commands.executeCommand('markdown.showPreview', helpPath);
//     })
// );

// 新代码：
const { register: registerHelpReader } = require('./commands/help-reader');
registerHelpReader(context);
```

同时将所有 `docs/Built-in Help` 路径引用迁移到 `docs/help`。

## 错误处理

| 场景 | Extension 侧 | Webview 侧 |
|------|--------------|------------|
| **初次加载 index.md 失败** | `showErrorMessage` + 发送 `{ type: 'error' }` | 显示完整错误页（替换 article 内容为错误提示） |
| **切换到目标文档失败** | `showErrorMessage` + 发送 `{ type: 'error' }` | 保留当前正文不变，显示顶部 inline banner 错误提示 |
| **文件不在白名单/越界/非 .md** | 拒绝加载，记录 console.warn | 保留当前文档，无正文替换，可选显示短提示 |
| **toc.json 缺失或格式错误** | `_parseToc()` 返回空数组 | 左侧显示"帮助目录配置缺失"，仍尝试加载 index.md |
| **marked.js 缺失** | `_loadMarkedJs()` 返回空字符串 | Webview 检测 `typeof marked === 'undefined'`，将 Markdown 文本 HTML 转义后包裹在 `<pre>` 中显示；搜索和大纲在 fallback 模式下禁用 |
| **docs 目录为空** | 正常创建 panel | 显示"暂无帮助文档"，禁用搜索和大纲 |
| **panel 恢复时 restoreFile 不存在** | 退回加载 `index.md` | 正常渲染退回的文档 |

## 包发布约束

- `.vscodeignore` 不得排除 `docs/help/**` 和 `media/marked.min.js`
- 随扩展分发 marked.js 需保留其 license/notice（marked.js 使用 MIT license，在扩展 README 或 third-party notices 中注明）
- `package.json` 中 `sentaurus.openHelp` 命令 contribution 保留不变
- `activationEvents` 中 `onCommand:sentaurus.openHelp` 保留不变，确保命令可激活扩展
- VSCode v1.85.2 下 `onCommand:` activation event 可靠触发扩展激活

## 约束

- 无 TypeScript、无构建步骤、无原生二进制
- 兼容 VSCode v1.85.2+
- marked.js 内置，离线可用
- Phase 1 UI 文字可硬编码中文；保留后续 i18n 映射的设计入口（所有面向用户的文字集中定义为常量，便于未来替换为 `%key%` 引用）

## 实现验收清单

### 基本功能

- [ ] 命令面板执行 `sentaurus.openHelp` 可打开阅读器
- [ ] 关闭后再次执行命令可重新打开，无失效 panel 引用
- [ ] toc.json 加载并显示左侧导航
- [ ] index.md 默认加载且左侧首页条目 active
- [ ] 点击 toc 项可切换文档
- [ ] Markdown 内部 `.md` 链接被拦截并走 openDoc 校验
- [ ] `../` 越界路径被拒绝
- [ ] 相对图片可正常显示
- [ ] CSP 不报错（Console 无 CSP violation）
- [ ] 搜索可高亮、计数、上下跳转、清除
- [ ] 搜索仅作用于文章区域，不影响导航/大纲
- [ ] 大纲可生成、点击跳转、滚动时 active 同步
- [ ] 切换文档后搜索、大纲、滚动状态正确重置
- [ ] 深色/浅色主题下 UI 颜色正常
- [ ] marked.js 缺失时 `<pre>` fallback 正常显示
- [ ] 键盘操作：Enter/Shift+Enter/Esc 搜索快捷键有效
- [ ] 侧栏折叠/展开后内容区自动适配
- [ ] `retainContextWhenHidden: false` 下隐藏/恢复 panel 不崩溃

### 架构与安全

- [ ] Markdown 渲染位置单一明确，不存在 extension/Webview 两边同时 renderer 的矛盾
- [ ] `path.relative` 边界校验通过，`/docs/help2` 不会被误判为 `/docs/help` 子目录
- [ ] Webview 隐藏后恢复时能回到原文档，而不是总是 index.md
- [ ] Webview 隐藏后恢复时能恢复搜索词、滚动位置、侧栏折叠状态

### 链接与图片

- [ ] `#anchor` 当前文档跳转可用
- [ ] `doc.md#anchor` 跨文档锚点跳转可用
- [ ] `https:` 链接通过 openExternal 在外部浏览器打开
- [ ] `http:`、`javascript:`、`command:`、`vscode:` 链接被拒绝
- [ ] `http:` 图片被拒绝，不会与 CSP 策略冲突
- [ ] `data:` 图片仅允许 `data:image/...`
- [ ] 切换到不存在文档时保留当前正文，不被错误页覆盖

### 打包与发布

- [ ] VSIX 打包后 `docs/help/**` 和 `media/marked.min.js` 确实存在
- [ ] `package.json` 中 `onCommand:sentaurus.openHelp` activation event 存在
