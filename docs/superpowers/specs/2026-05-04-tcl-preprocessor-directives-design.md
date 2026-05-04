# Tcl 预处理器指令支持设计

## 背景

SDE（Scheme）已有完整的预处理器指令支持：语法高亮（`sde.tmLanguage.json`）、词法跳过（`scheme-parser.js`）、分支感知诊断（`buildPpBranchMap`）。5 种 Tcl 语言（sdevice、sprocess、emw、inspect、svisual）完全没有预处理器指令支持——`#if`/`#else`/`#endif` 全部被当作普通注释高亮，诊断层无法区分不同条件分支中的同名变量定义。

## 目标

为 5 种 Tcl 语言添加与 SDE 对齐的预处理器指令支持，覆盖：语法高亮、分支感知诊断、代码折叠。

## 支持的指令

与 SDE 完全一致：`#if`、`#ifdef`、`#ifndef`、`#elif`、`#else`、`#endif`、`#define`、`#undef`、`#include`、`#error`、`#set`。

## 方案

文本级分支感知。复用 SDE 已验证的 `buildPpBranchMap` 模式，不修改 tree-sitter-tcl WASM。

tree-sitter-tcl 将 `#if` 等指令行视为注释，但后续代码行（如 `set x 1`）仍被正确解析为 Tcl 命令。因此所有分支中的变量定义都会被 `buildScopeIndex` 收集到，诊断层只需利用分支映射区分即可。

## 设计

### 1. 语法高亮

**变更文件**：5 个 Tcl tmLanguage.json（sdevice、sprocess、emw、inspect、svisual）

在每个文件的 `patterns` 数组中，在注释模式（`"match": "#.*$"`）之前插入预处理器指令模式：

```json
{
  "name": "meta.preprocessor.tcl",
  "match": "^\\s*(#\\s*(?:if|ifdef|ifndef|elif|else|endif|define|undef|include|error|set))\\b(.*$)",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.tcl" },
    "2": {
      "patterns": [
        { "match": "\\b(defined|TRUE|FALSE)\\b", "name": "keyword.control.preprocessor.tcl" },
        { "match": "\"[^\"]*\"", "name": "string.quoted.double.tcl" }
      ]
    }
  }
}
```

TextMate 首匹配胜出规则确保 `#if` 等被匹配为 `keyword.control.preprocessor`，而普通 `# comment` 仍为 `comment.line.hash`。

### 2. 诊断 — 分支感知的重复定义检测

**变更文件**：`src/lsp/providers/undef-var-diagnostic.js`

#### 2a. 提取共享工具函数 `buildPpBlocks`

从现有 `buildPpBranchMap` 的栈扫描逻辑中提取通用函数，返回：
- `branchMap: Map<number, number>` — 行号 → 分支 ID（供诊断使用）
- `foldingRanges: Array<{startLine, endLine}>` — 预处理器块折叠范围（供折叠使用）

`buildPpBranchMap` 改为调用 `buildPpBlocks` 并仅返回 `branchMap`，保持向后兼容。

#### 2b. 新增 `checkTclDuplicateDefs`

```javascript
function checkTclDuplicateDefs(globalDefs, ppBranchMap) {
  // 按变量名分组
  // 同名 + 同分支 → 报重复定义 warning
  // 同名 + 不同分支 → 不报
}
```

#### 2c. 修改 `checkTclUndefVars`

在 `ScopeIndex`（`tcl-ast-utils.js`）中新增 `getGlobalDefs()` getter 暴露 `_globalDefs` 数组。

在 `checkTclUndefVars` 返回 diagnostics 前追加：
```javascript
const ppBranchMap = buildPpBranchMap(document.getText());
diagnostics.push(...checkTclDuplicateDefs(scopeIndex.getGlobalDefs(), ppBranchMap));
```

### 3. 折叠范围 — `#if`/`#endif` 块折叠

**变更文件**：`src/lsp/providers/tcl-folding-provider.js`

在 `provideFoldingRanges` 中：
1. 调用 `buildPpBlocks(document.getText())` 获取 `foldingRanges`
2. 与 AST 的 `braced_word` 折叠合并返回

`#elif`/`#else` 不产生独立折叠范围（它们是同一预处理器块内的分支标记）。

## 测试

- 新增测试文件 `tests/test-tcl-preprocessor.js`
- 覆盖场景：
  - `buildPpBranchMap` 对 Tcl 文本的分支映射正确性
  - 不同分支的同名 `set` 不报重复定义
  - 同一分支的同名 `set` 仍报重复定义
  - 嵌套 `#if` 块的分支区分
  - 预处理器块折叠范围正确
- 新增测试文件 `tests/test-tcl-preprocessor-highlight.js`（可选，验证 TextMate 模式匹配）

## 不涉及的变更

- 不修改 tree-sitter-tcl WASM
- 不修改 `tcl-ast-utils.js` 的 `buildScopeIndex` 逻辑（仅新增 `getGlobalDefs()` getter）
- 不修改 `language-configurations/tcl.json`（`#` 作为行注释符号不变，TextMate 层负责区分）
