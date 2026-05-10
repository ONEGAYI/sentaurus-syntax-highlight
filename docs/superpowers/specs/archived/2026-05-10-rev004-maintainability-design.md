# REV-004 可维护性：大文件拆分与结构优化

## 元数据

- **Issue**: #34
- **日期**: 2026-05-10
- **范围**: 第 1 批（高严重度 #1 + #2），第 2 批（中低严重度 #3 + #4 + #5）留待后续 PR
- **策略**: 自底向上——先拆 `tcl-ast-utils.js`（底层），再拆 `extension.js`（上层）
- **迁移方式**: 直接迁移消费者，不保留 facade

## 问题概述

| # | 严重度 | 文件 | 问题 | 当前状态 |
|---|--------|------|------|---------|
| 1 | 高 | `src/lsp/tcl-ast-utils.js` | 1585 行，6 类独立职责 | 需按职责拆分 |
| 2 | 高 | `src/extension.js` | `activate()` 1006 行 | 需按职责提取模块 |
| 3 | 中 | `src/lsp/providers/sdevice-semantic-provider.js` | `extractTokensFromStacks` 155 行、4 层嵌套 | 第 2 批 |
| 4 | 中 | `src/extension.js` | Provider 注册循环体 393 行 | 随 #2 一起解决 |
| 5 | 低 | `src/lsp/tcl-ast-utils.js` | 魔法数字缺乏文档 | 第 2 批 |

> 注：#4 是 #2 的子问题，在拆分 extension.js 时一并解决。

## 设计

### 第 1 部分：tcl-ast-utils.js 拆分

将 1585 行的单文件拆为 5 个模块，每个 100-500 行，职责清晰。

#### 新模块结构

**`tcl-ast-utils.js`（保留，~250 行）**

通用工具 + 折叠 + 共享辅助函数。

导出：
- `parseSafe(text)` — 安全解析 Tcl 文本
- `walkNodes(node, callback)` — 深度优先遍历
- `findNodesByType(root, type)` — 按类型查找节点
- `getFoldingRanges(root)` — 代码折叠范围
- `TCL_LANGS` — 支持的 Tcl 语言集合
- `isTclLanguage(langId)` — 语言判断

共享辅助函数（导出供子模块引用）：
- `_findChildByType`, `_findChildrenByType`, `_getCommandWords`, `_extractArgName`, `_extendNodeTextToLineEnd`

> **设计决策**：这些辅助函数保留在 `tcl-ast-utils.js` 并添加到 `module.exports`，各子模块通过 `require` 按需引用。这避免了循环依赖（子模块单向引用 AST 工具，而 AST 工具不引用子模块）。

**`tcl-scope.js`（~500 行）**

作用域构建与索引。

导出：
- `ScopeIndex` 类 — 作用域索引（O(1) 查询）
- `buildScopeIndex(root)` — 构建作用域索引
- `buildScopeMap(root)` — 构建作用域映射（已 deprecated）

依赖：`tcl-parser-wasm`, `tcl-ast-utils`（共享辅助函数）

> **内部辅助函数迁移**：`_collectVarNamesFromNode`, `_collectLocalDefsForIndex`, `_collectScopeImportsForIndex`, `_countMaxLine`, `_collectGlobalDefs`, `_addToScopeFromLine`, `_processProcScopes`, `_collectLocalDefs`, `_processScopeImports` 全部移入 `tcl-scope.js`。这些函数如果调用了 `_findChildByType` 等，通过 `require` 从 `tcl-ast-utils.js` 获取。

**`tcl-variable-extractor.js`（~400 行）**

变量提取与引用查找。

导出：
- `getVariables(root, sourceText)` — 提取变量定义
- `getVariableRefs(root)` — 提取变量引用

包含所有 `_handle*`, `_extract*`, `_collectVariables` 函数。

依赖：`tcl-ast-utils`（辅助函数）

**`tcl-bracket-check.js`（~100 行）**

括号平衡检查。

导出：
- `findMismatchedBraces(text)` — 查找不匹配的大括号

无外部依赖（纯文本处理）。

**`tcl-document-symbol.js`（~280 行）**

文档大纲符号提取。

导出：
- `getDocumentSymbols(root, langId)` — 提取文档符号
- `SymbolKind` — 符号类型常量

依赖：`tcl-ast-utils`（辅助函数）, `tcl-symbol-configs`

#### 消费者迁移表

| 消费者 | 当前 require | 改为 |
|--------|-------------|------|
| `extension.js` | `astUtils = require('./lsp/tcl-ast-utils')` | 按需引用 `tcl-ast-utils` + `tcl-variable-extractor` + `tcl-bracket-check` |
| `definitions.js` | `tclAstUtils = require('./lsp/tcl-ast-utils')` | `tcl-variable-extractor` + `tcl-scope` |
| `parse-cache.js` | `{ buildScopeIndex } = require('./tcl-ast-utils')` | `require('./tcl-scope')` |
| `tcl-document-symbol-provider.js` | `astUtils = require('../tcl-ast-utils')` | `require('../tcl-document-symbol')` |
| `tcl-bracket-diagnostic.js` | `astUtils = require('../tcl-ast-utils')` | `require('../tcl-bracket-check')` |
| `variable-reference-provider.js` | `{ getVariableRefs, TCL_LANGS }` | `getVariableRefs` → `tcl-variable-extractor`, `TCL_LANGS` → `tcl-ast-utils` |
| `undef-var-diagnostic.js` | `astUtils = require('../tcl-ast-utils')` | 按需引用 `tcl-variable-extractor` + `tcl-scope` |
| `tcl-folding-provider.js` | `astUtils = require('../tcl-ast-utils')` | `require('../tcl-ast-utils')`（只需 `parseSafe` + `getFoldingRanges`） |

#### 辅助函数处理

`tcl-ast-utils.js` 中的以下辅助函数被多个子模块共享使用：

- `_findChildByType(node, type)` — 被 `tcl-scope`, `tcl-variable-extractor`, `tcl-document-symbol` 使用
- `_findChildrenByType(node, type)` — 同上
- `_getCommandWords(node)` — 被 `tcl-variable-extractor` 使用
- `_extractArgName(argNode)` — 被 `tcl-variable-extractor` 使用
- `_extendNodeTextToLineEnd(nodeText, endRow, lines)` — 被 `tcl-variable-extractor` 使用

**处理方式**：将这些函数从 `tcl-ast-utils.js` 导出（保持 `_` 前缀命名不变，添加到 `module.exports`）。子模块按需 require。

### 第 2 部分：extension.js 拆分

将 `activate()` 从 1006 行缩减为 ~150 行的顶层协调入口。

#### 新模块结构

**`src/docs-loader.js`（~200 行）**

文档加载与补全项构建。

从 extension.js 顶层和 activate 内提取：
- `decodeHtml(str)` — HTML 实体解码
- `KIND_MAP` — 关键词类型 → CompletionItemKind 映射
- `SORT_PREFIX`, `DETAIL_LABEL`, `DOC_LABELS`, `DEFAULT_PREFIXES` — 补全配置常量
- `formatDoc(title, doc, lang)` — 格式化文档为 Markdown
- `loadDocsJson(langId)` — 懒加载函数文档 JSON
- `buildItems(langId, allKeywords)` — 构建补全项数组
- `applySnippetPrefixes(items, prefixMap)` — 应用 snippet 前缀

导出所有上述符号，供 `register-completion-providers.js` 和 activate 使用。

**`src/register-sde-providers.js`（~150 行）**

SDE (Scheme) 语言的所有 Provider 注册。

从 activate 内 428-568 行提取：
- FoldingRangeProvider 注册
- 括号诊断注册
- SignatureHelpProvider 注册
- SemanticTokens 注册
- OnEnter 缩进注册
- RegionUndef 诊断注册
- Symbol 补全/引用注册
- 变量引用注册

函数签名：`registerSdeProviders(context, { schemeCache, funcDocs, symbolIndex, modeDispatch, symbolParams })`

**`src/register-tcl-providers.js`（~150 行）**

5 种 Tcl 语言的共用 Provider 注册。

从 activate 内 449-577 行提取：
- 代码折叠注册
- 括号诊断注册
- 未定义变量诊断注册
- RegionUndef 诊断注册
- DocumentSymbol 注册
- SemanticTokens 注册（SDEVICE 独立 + 其他 4 种）
- 变量引用注册

函数签名：`registerTclProviders(context, { tclCache, funcDocs, vectorKW, sdeviceStProvider })`

**`src/register-completion-providers.js`（~400 行）**

Provider 注册循环体——补全、Hover、Definition 的工厂函数。

从 activate 内 579-971 行提取：
- CompletionItemProvider 创建（含子命令补全、矢量关键词补全）
- HoverProvider 创建（含 SDEVICE section 上下文感知、子命令 hover）
- DefinitionProvider 创建

函数签名：`registerCompletionProviders(context, { languages, allKeywords, itemsMap, funcDocs, ... })`

**`src/commands/snippet-picker.js`（~80 行）**

QuickPick 代码片段选择器。

从 extension.js 顶层 208-253 行和 activate 内 973-1002 行提取：
- `showToolSnippets(context, langId)` — QuickPick 菜单逻辑
- 命令注册

#### 重构后的 activate() 结构

```javascript
function activate(context) {
    // 1. 加载关键词 + 初始化缓存 (~30 行)
    // 2. Tcl WASM 初始化 (~15 行)
    // 3. 文档加载配置 (~30 行)
    // 4. 注册 SDE Providers: registerSdeProviders(context, deps) (~5 行)
    // 5. 注册 Tcl Providers: registerTclProviders(context, deps) (~5 行)
    // 6. 注册补全/Hover/Definition: registerCompletionProviders(context, deps) (~5 行)
    // 7. 注册 Snippet 命令 (~10 行)
    // 8. 注册表达式转换命令 (~50 行，含历史记录和辅助函数)
    // 总计 ~150 行
}
```

### 第 1 批不涉及的内容

以下留给第 2 批 PR：

- `extractTokensFromStacks` 函数拆分（#3）
- 魔法数字文档化（#5）
- 测试文件的调整（消费者迁移后测试 import 路径需同步更新）

## 验证策略

每个拆分步骤完成后：

1. **运行全量测试**：`node --test tests/test-*.js` — 确保全部 34 个文件通过
2. **检查 require 路径**：grep 所有 `require` 确保无断裂
3. **检查导出完整性**：新模块的 `module.exports` 必须覆盖所有被外部引用的符号
4. **功能测试**：在 VSCode Extension Development Host 中验证补全、悬停、定义跳转、折叠、诊断等核心功能

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 辅助函数共享导致循环依赖 | 辅助函数统一放在 `tcl-ast-utils.js` 并导出，子模块单向引用 |
| 拆分后函数签名变化（需要额外依赖参数） | 新模块的注册函数接受 `deps` 对象，显式注入依赖 |
| 测试 import 路径需同步更新 | 每拆一个模块就运行测试验证 |
| extension.js 拆分后上下文变量（如 `funcDocs` 闭包）传递复杂 | 通过 `deps` 对象或返回值显式传递，消除隐式闭包 |

## 文件变更总览

### 新增文件（9 个）

```
src/lsp/tcl-scope.js                          ← ~500 行
src/lsp/tcl-variable-extractor.js             ← ~400 行
src/lsp/tcl-bracket-check.js                  ← ~100 行
src/lsp/tcl-document-symbol.js                ← ~280 行
src/docs-loader.js                            ← ~200 行
src/register-sde-providers.js                 ← ~150 行
src/register-tcl-providers.js                 ← ~150 行
src/register-completion-providers.js          ← ~400 行
src/commands/snippet-picker.js                ← ~80 行
```

### 修改文件（10 个）

```
src/lsp/tcl-ast-utils.js                      ← 1585 → ~250 行（删除迁移代码，导出辅助函数）
src/extension.js                              ← 1294 → ~200 行（activate 缩减为协调入口）
src/definitions.js                            ← 更新 require 路径
src/lsp/parse-cache.js                        ← 更新 require 路径
src/lsp/providers/tcl-document-symbol-provider.js ← 更新 require 路径
src/lsp/providers/tcl-bracket-diagnostic.js       ← 更新 require 路径
src/lsp/providers/variable-reference-provider.js   ← 更新 require 路径
src/lsp/providers/undef-var-diagnostic.js           ← 更新 require 路径
src/lsp/providers/tcl-folding-provider.js           ← 更新 require 路径
```

### 新增测试文件（可能）

```
tests/test-tcl-scope.js                       ← 从 test-tcl-scope-index.js 和 test-tcl-scope-map.js 验证
tests/test-tcl-variable-extractor.js          ← 从 test-tcl-ast-variables.js 验证
tests/test-tcl-bracket-check.js               ← 从现有括号测试验证
tests/test-tcl-document-symbol.js             ← 已存在，更新 import
```
