# User Variable Support Design

Date: 2026-04-11
Status: Approved

## Overview

为 5 种 Sentaurus TCAD 语言（sde/sdevice/sprocess/emw/inspect）添加用户自定义变量的补全、悬停定义显示和跳转定义功能。采用正则提取 + 括号匹配方案，不引入 LSP。

## Requirements

### 语言覆盖

| 语言 | 工具 | 语法族 | 绑定形式 |
|------|------|--------|----------|
| `sde` | Structure Editor | Scheme | `(define ...)`, `(let ...)`, `(let* ...)`, `(letrec ...)` |
| `sdevice` | Device Simulator | Tcl | `set`, `proc` |
| `sprocess` | Process Simulator | Tcl | `set`, `proc` |
| `emw` | EM Wave | Tcl | `set`, `proc` |
| `inspect` | Inspect | Tcl | `set`, `proc` |

### 变量范围

- **第一阶段（本次）**：仅当前文件，实时扫描。
- **第二阶段（未来）**：扩展到工作区跨文件扫描，届时引入缓存机制。

### 功能

1. **变量补全**：用户定义的变量出现在自动补全列表中（CompletionItemKind.Variable）。
2. **悬停定义**：悬停在变量名上时，显示完整的定义文本。
3. **跳转定义**：Ctrl+Click 或 F12 跳转到变量定义行。

## Architecture

### 核心提取引擎

独立函数，根据语言 ID 分发到不同的提取器。每个提取器负责：
1. 用正则定位绑定形式（`(define` / `set` 等）的起始位置。
2. 用括号匹配算法找到完整的定义文本（处理跨行）。
3. 返回统一的定义记录数组。

```js
// 返回格式
[
  { name: "TboxTest", line: 10, endLine: 12, definitionText: "(define TboxTest\n  0.42)" },
  { name: "my-func",  line: 15, endLine: 18, definitionText: "(define (my-func x y)\n  (+ x y))" },
]
```

### 括号匹配算法

`findBalancedExpression(text, startPos)` — 从指定位置开始，跟踪括号深度直到平衡。

处理规则：
- 跳过字符串内的括号（`"hello (world)"` 中的括号不计数）
- 跳过注释内的括号（`; this is (a comment)` 中的括号不计数）
- Scheme: 跟踪 `()` 圆括号深度
- Tcl `proc`: 跟踪 `{}` 花括号深度
- `set` 基本是单行，不需要括号匹配

```js
function findBalancedExpression(text, startPos, openChar = '(', closeChar = ')') {
  let depth = 0;
  let inString = false;
  let inComment = false;
  for (let i = startPos; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if (ch === '"' && prev !== '\\') inString = !inString;
    if (ch === ';' && !inString) inComment = true;
    if (ch === '\n') inComment = false;
    if (inString || inComment) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) return i; // 返回闭括号位置
    }
  }
  return -1; // 未闭合
}
```

### Scheme 提取器

覆盖三种绑定形式：

**`(define name ...)` / `(define (name args) ...)`**
- 正则: `/\(define\s+(\([^)\s]+|[^()\s]+)/`
- 变量名: 第一个捕获组。如果是 `(name args` 形式，取括号内的函数名。

**`(let ((var1 val1) (var2 val2) ...) ...)`**
- 正则: `/\((?:let\*?|letrec)\s+\(([^)]+)\)/`
- 变量名: 从绑定列表中提取每个 `(var val)` 的 `var`。

**注意**: `let` 中的变量是局部作用域，第一阶段不做作用域分析，所有提取到的变量全局可见。

### Tcl 提取器

**`set varName value`**
- 正则: `/^\s*set\s+(\S+)/`
- 取变量名。排除 `set env(VAR)` 形式中的环境变量（不补全）。

**`proc name {args} {body}`**
- 正则: `/^\s*proc\s+(\S+)/`
- 取过程名。

### 防抖 / 缓存策略

使用 `document.version` 作为轻量缓存键：
- Provider 触发时，比较当前 `document.version` 与缓存的版本号。
- 版本相同 → 直接返回缓存结果。
- 版本不同 → 重新扫描，更新缓存。

不使用 `onDidChangeTextDocument` 事件驱动，避免注册额外监听器。缓存仅在 Provider 被调用时惰性更新。

```js
// 缓存结构（每个文档实例一个）
{ version: 42, definitions: [...] }
```

### Provider 改动

**CompletionItemProvider（修改）**
- 现有：`return items;`（静态关键词列表）
- 改为：`return [...items, ...userVarItems];`
- 用户变量的 CompletionItemKind 为 `Variable`，sortText 以 `'4'` 开头（排在 API 函数之后）。

**HoverProvider（修改）**
- 现有：查 `funcDocs` 字典，有则返回文档。
- 改为：查完 `funcDocs` 后，若未命中，再查用户变量定义 → 返回定义文本的 Hover。

**DefinitionProvider（新增）**
- 查找光标下的词在用户变量定义中的位置。
- 返回 `new vscode.Location(document.uri, new vscode.Range(startPos, endPos))`。
- 仅对用户定义的变量生效，不对 API 函数生效。

### 代码结构

所有改动在 `src/extension.js` 中：

```
新增函数：
  findBalancedExpression(text, startPos, open, close)  // ~15 行
  extractSchemeDefinitions(text)                        // ~30 行
  extractTclDefinitions(text)                           // ~20 行
  extractDefinitions(text, langId)                      // ~5 行
  getUserDefinition(document, word)                     // ~15 行（含缓存逻辑）

修改函数：
  activate() 中修改 CompletionItemProvider              // ~10 行改动
  activate() 中修改 HoverProvider                       // ~10 行改动
  activate() 中新增 DefinitionProvider 注册             // ~15 行

预计总改动：~80-100 行（现有文件 182 行 → ~260 行）
```

## Out of Scope (YAGNI)

- 作用域分析（let 绑定全局可见）
- 跨文件扫描（第二阶段）
- 类型推断
- 重命名重构
- TextMate 语法改动
- `set!` / `lambda` 参数绑定
- Tcl 的 `foreach` / `for` 循环变量

## Future Work

- **跨文件扫描**：遍历工作区内所有 `.cmd` / `.scm` / `.fps` 文件，提取定义并缓存。
- **作用域感知**：区分全局 `define` 和局部 `let` 绑定，只在作用域内可见。
- **set! 追踪**：识别对已有变量的重新赋值。
- **lambda 参数**：提取 `(lambda (x y) ...)` 中的参数名。
