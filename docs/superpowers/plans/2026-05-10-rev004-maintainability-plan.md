# REV-004 可维护性重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 tcl-ast-utils.js (1584行) 拆分为 5 个职责模块，将 extension.js (1293行) 的 activate() (1006行) 缩减为 ~150 行协调入口。

**Architecture:** 自底向上拆分——先拆底层 tcl-ast-utils.js（被 8 个消费者引用），再拆上层 extension.js。每步拆分后运行测试验证无回归。辅助函数保留在 tcl-ast-utils.js 并导出供子模块引用，避免循环依赖。

**Tech Stack:** Node.js CommonJS, VSCode Extension API, web-tree-sitter WASM

**Spec:** `docs/superpowers/specs/2026-05-10-rev004-maintainability-design.md`

**基线:** 34 个测试文件全部通过 (`node --test tests/test-*.js`)

---

## Phase 1: tcl-ast-utils.js 拆分

### Task 1: 创建 tcl-bracket-check.js

**Files:**
- Create: `src/lsp/tcl-bracket-check.js`
- Read: `src/lsp/tcl-ast-utils.js:88-183`

- [ ] **Step 1: 创建 tcl-bracket-check.js**

从 `src/lsp/tcl-ast-utils.js` 复制第 88-183 行（`findMismatchedBraces` 函数及其全部内容）到新文件。添加 `'use strict';` 头部和 `module.exports`：

```javascript
// src/lsp/tcl-bracket-check.js
'use strict';

/**
 * 检查 Tcl 文本中大括号 { } 是否匹配。
 * @param {string} text
 * @returns {Array<{line: number, col: number, type: string}>}
 */
function findMismatchedBraces(text) {
    // ... 从 tcl-ast-utils.js:88-183 完整复制
}

module.exports = { findMismatchedBraces };
```

- [ ] **Step 2: 从 tcl-ast-utils.js 删除已迁移代码**

删除 `src/lsp/tcl-ast-utils.js` 中第 88-183 行的 `findMismatchedBraces` 函数。在文件顶部添加 require：

```javascript
const { findMismatchedBraces } = require('./tcl-bracket-check');
```

保持 `module.exports` 中仍然导出 `findMismatchedBraces`（向后兼容，直到消费者迁移完成）。

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 迁移消费者 tcl-bracket-diagnostic.js**

修改 `src/lsp/providers/tcl-bracket-diagnostic.js`:
- 将 `const astUtils = require('../tcl-ast-utils');` 改为 `const { findMismatchedBraces } = require('../tcl-bracket-check');`
- 将第 8 行 `const TCL_LANG_SET = new Set(astUtils.TCL_LANGS);` 改为 `const { TCL_LANGS } = require('../tcl-ast-utils'); const TCL_LANG_SET = new Set(TCL_LANGS);`
- 将第 39 行 `astUtils.findMismatchedBraces(text)` 改为 `findMismatchedBraces(text)`

- [ ] **Step 5: 从 tcl-ast-utils.js 移除 re-export**

从 `module.exports` 中删除 `findMismatchedBraces`。删除 `const { findMismatchedBraces } = require('./tcl-bracket-check');`。

- [ ] **Step 6: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 7: 提交**

```bash
git add src/lsp/tcl-bracket-check.js src/lsp/tcl-ast-utils.js src/lsp/providers/tcl-bracket-diagnostic.js
git commit -m "refactor: 提取 findMismatchedBraces 到 tcl-bracket-check.js

将括号平衡检查从 tcl-ast-utils.js 拆分为独立模块。
tcl-bracket-diagnostic.js 直接引用新模块。

Ref #34"
```

---

### Task 2: 创建 tcl-document-symbol.js

**Files:**
- Create: `src/lsp/tcl-document-symbol.js`
- Modify: `src/lsp/tcl-ast-utils.js`
- Modify: `src/lsp/providers/tcl-document-symbol-provider.js`

- [ ] **Step 1: 创建 tcl-document-symbol.js**

从 `src/lsp/tcl-ast-utils.js` 复制以下内容到新文件：
- `SymbolKind` 常量（原第 1296-1301 行）
- `getDocumentSymbols` 函数（原第 1311-1316 行）
- `_collectSymbols` 函数（原第 1324-1366 行）
- `_collectSymbolsInChildren` 函数（原第 1371-1379 行）
- `_symbolSet` 函数（原第 1385-1398 行）
- `_symbolProcedure` 函数（原第 1403-1449 行）
- `_symbolForeach` 函数（原第 1454-1472 行）
- `_symbolWhile` 函数（原第 1477-1492 行）
- `_symbolCommand` 函数（原第 1500-1527 行）
- `_symbolFor` 函数（原第 1533-1550 行）
- `_symbolSection` 函数（原第 1555-1570 行）

新文件需要的依赖：
```javascript
'use strict';
const symbolConfigs = require('./tcl-symbol-configs');
const { _findChildByType, _findChildrenByType, _getCommandWords } = require('./tcl-ast-utils');
```

`module.exports = { getDocumentSymbols, SymbolKind };`

- [ ] **Step 2: 从 tcl-ast-utils.js 删除已迁移代码**

删除上述所有函数。从 `module.exports` 中删除 `getDocumentSymbols` 和 `SymbolKind`。

同时需要导出被 tcl-document-symbol.js 引用的辅助函数——在 `module.exports` 中添加 `_findChildByType`, `_findChildrenByType`, `_getCommandWords`。

- [ ] **Step 3: 迁移消费者 tcl-document-symbol-provider.js**

修改 `src/lsp/providers/tcl-document-symbol-provider.js`:
- 将 `const astUtils = require('../tcl-ast-utils');` 改为：
  ```javascript
  const { getDocumentSymbols } = require('../tcl-document-symbol');
  ```
- 将第 23 行 `astUtils.getDocumentSymbols(entry.tree.rootNode, document.languageId)` 改为 `getDocumentSymbols(entry.tree.rootNode, document.languageId)`

- [ ] **Step 4: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 5: 提交**

```bash
git add src/lsp/tcl-document-symbol.js src/lsp/tcl-ast-utils.js src/lsp/providers/tcl-document-symbol-provider.js
git commit -m "refactor: 提取 getDocumentSymbols/SymbolKind 到 tcl-document-symbol.js

将文档符号提取从 tcl-ast-utils.js 拆分为独立模块。
同时导出 _findChildByType/_findChildrenByType/_getCommandWords 供子模块共享。

Ref #34"
```

---

### Task 3: 创建 tcl-variable-extractor.js

**Files:**
- Create: `src/lsp/tcl-variable-extractor.js`
- Modify: `src/lsp/tcl-ast-utils.js`
- Modify: `src/definitions.js`
- Modify: `src/lsp/providers/variable-reference-provider.js`
- Modify: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 创建 tcl-variable-extractor.js**

从 `src/lsp/tcl-ast-utils.js` 复制以下内容到新文件：
- `getVariables` 函数
- `getVariableRefs` 函数
- `_collectVariables` 函数
- `_handleSet` 函数
- `_handleProcedure` 函数
- `_handleForeach` 函数
- `_handleWhile` 函数
- `_handleCommand` 函数
- `_handleFor` 函数
- `_extendNodeTextToLineEnd` 函数
- `_extractForeachVarNames` 函数
- `_extractBracedWordVars` 函数
- `_extractCommandVarDefs` 函数
- `_extractErrorVarDefs` 函数
- `_extractUpvarLocalNames` 函数
- `_extractVariableNames` 函数
- `_extractArgName` 函数

依赖：
```javascript
'use strict';
const { walkNodes, _findChildByType, _findChildrenByType, _getCommandWords } = require('./tcl-ast-utils');
```

`module.exports = { getVariables, getVariableRefs };`

- [ ] **Step 2: 从 tcl-ast-utils.js 删除已迁移代码**

删除上述所有函数。从 `module.exports` 中删除 `getVariables` 和 `getVariableRefs`。

同时在 `module.exports` 中添加 `_extractArgName` 和 `_extendNodeTextToLineEnd` 的导出（如有其他子模块需要）。

- [ ] **Step 3: 迁移消费者 definitions.js**

修改 `src/definitions.js`:
- 将 `const tclAstUtils = require('./lsp/tcl-ast-utils');` 改为：
  ```javascript
  const tclAstUtils = require('./lsp/tcl-ast-utils');
  const tclVarExtractor = require('./lsp/tcl-variable-extractor');
  ```
- 将第 53 行 `tclAstUtils.parseSafe(text)` 保留不变（parseSafe 仍在 tcl-ast-utils）
- 将第 56 行 `tclAstUtils.getVariables(tree.rootNode, text)` 改为 `tclVarExtractor.getVariables(tree.rootNode, text)`

- [ ] **Step 4: 迁移消费者 variable-reference-provider.js**

修改 `src/lsp/providers/variable-reference-provider.js`:
- 将 `const { getVariableRefs, TCL_LANGS } = require('../tcl-ast-utils');` 改为：
  ```javascript
  const { getVariableRefs } = require('../tcl-variable-extractor');
  const { TCL_LANGS } = require('../tcl-ast-utils');
  ```

- [ ] **Step 5: 迁移消费者 undef-var-diagnostic.js**

修改 `src/lsp/providers/undef-var-diagnostic.js`:
- 将 `const astUtils = require('../tcl-ast-utils');` 改为：
  ```javascript
  const astUtils = require('../tcl-ast-utils');
  const { getVariableRefs } = require('../tcl-variable-extractor');
  ```
- 将第 84 行 `astUtils.getVariableRefs(root)` 改为 `getVariableRefs(root)`
- `TCL_LANGS` 引用（第 28 行 `astUtils.TCL_LANGS`）保持不变

- [ ] **Step 6: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 7: 提交**

```bash
git add src/lsp/tcl-variable-extractor.js src/lsp/tcl-ast-utils.js src/definitions.js src/lsp/providers/variable-reference-provider.js src/lsp/providers/undef-var-diagnostic.js
git commit -m "refactor: 提取 getVariables/getVariableRefs 到 tcl-variable-extractor.js

将变量提取与引用查找从 tcl-ast-utils.js 拆分为独立模块。
同步更新 definitions.js、variable-reference-provider.js、undef-var-diagnostic.js 的引用路径。

Ref #34"
```

---

### Task 4: 创建 tcl-scope.js

**Files:**
- Create: `src/lsp/tcl-scope.js`
- Modify: `src/lsp/tcl-ast-utils.js`
- Modify: `src/lsp/parse-cache.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 tcl-scope.js**

从 `src/lsp/tcl-ast-utils.js` 复制以下内容到新文件：
- `ScopeIndex` 类（原第 244-390 行）
- `buildScopeIndex` 函数（原第 397-542 行）
- `_collectVarNamesFromNode` 函数
- `_collectLocalDefsForIndex` 函数
- `_collectScopeImportsForIndex` 函数
- `buildScopeMap` 函数（deprecated）
- `_countMaxLine` 函数
- `_collectGlobalDefs` 函数
- `_addToScopeFromLine` 函数
- `_processProcScopes` 函数
- `_collectLocalDefs` 函数
- `_processScopeImports` 函数

依赖：
```javascript
'use strict';
const { walkNodes, _findChildByType, _findChildrenByType } = require('./tcl-ast-utils');
```

`module.exports = { ScopeIndex, buildScopeIndex, buildScopeMap };`

- [ ] **Step 2: 从 tcl-ast-utils.js 删除已迁移代码**

删除上述所有函数和类。从 `module.exports` 中删除 `buildScopeMap`, `buildScopeIndex`, `ScopeIndex`。

- [ ] **Step 3: 迁移消费者 parse-cache.js**

修改 `src/lsp/parse-cache.js`:
- 将第 220 行 `const { buildScopeIndex } = require('./tcl-ast-utils');` 改为 `const { buildScopeIndex } = require('./tcl-scope');`

- [ ] **Step 4: 迁移消费者 extension.js**

修改 `src/extension.js`:
- `astUtils.TCL_LANGS` 的引用保持不变（TCL_LANGS 仍在 tcl-ast-utils 中）
- `tclCache.getScopeIndex(document)` 的调用不需要改（parse-cache 内部已改）

- [ ] **Step 5: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 6: 提交**

```bash
git add src/lsp/tcl-scope.js src/lsp/tcl-ast-utils.js src/lsp/parse-cache.js
git commit -m "refactor: 提取 ScopeIndex/buildScopeIndex 到 tcl-scope.js

将作用域构建与索引从 tcl-ast-utils.js 拆分为独立模块。
同步更新 parse-cache.js 的引用路径。

Ref #34"
```

---

### Task 5: 清理 tcl-ast-utils.js 并验证

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`

- [ ] **Step 1: 验证 tcl-ast-utils.js 最终状态**

确认文件只包含：
- `TCL_LANGS` 常量
- `isTclLanguage` 函数
- `parseSafe` 函数
- `walkNodes` 函数
- `findNodesByType` 函数
- `getFoldingRanges` 函数
- 导出的辅助函数：`_findChildByType`, `_findChildrenByType`, `_getCommandWords`, `_extractArgName`, `_extendNodeTextToLineEnd`
- `module.exports`

确认不再需要 `const symbolConfigs = require('./tcl-symbol-configs');`（被 tcl-document-symbol.js 和 tcl-scope.js 各自引用了）。如果 tcl-ast-utils.js 中已无代码使用它，删除此 require。

- [ ] **Step 2: grep 验证无断裂**

Run: `grep -rn "require.*tcl-ast-utils" src/`
确认每个消费者引用的符号确实在 tcl-ast-utils.js 的 `module.exports` 中。

- [ ] **Step 3: 运行全量测试**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/lsp/tcl-ast-utils.js
git commit -m "refactor: 清理 tcl-ast-utils.js 移除无用依赖

Phase 1 完成：tcl-ast-utils.js 从 1584 行缩减为 ~120 行通用工具模块。

Ref #34"
```

---

## Phase 2: extension.js 拆分

### Task 6: 创建 docs-loader.js

**Files:**
- Create: `src/docs-loader.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 docs-loader.js**

从 `src/extension.js` 提取以下内容到新文件：
- `KIND_MAP` 常量（原第 47-58 行）
- `SORT_PREFIX` 常量（原第 61-66 行）
- `DETAIL_LABEL` 常量（原第 69-76 行）
- `DOC_LABELS` 常量（原第 79-84 行）
- `DEFAULT_PREFIXES` 常量（原第 166-170 行）
- `formatDoc` 函数（原第 89-118 行）
- `applySnippetPrefixes` 函数（原第 176-186 行）

需要 `require('vscode')` 用于 `MarkdownString`。

`module.exports = { KIND_MAP, SORT_PREFIX, DETAIL_LABEL, DOC_LABELS, DEFAULT_PREFIXES, formatDoc, applySnippetPrefixes };`

注意：`loadDocsJson` 和 `buildItems` 函数使用 `vscode` 和闭包中的 `funcDocs` 变量，暂不提取——它们与 Provider 注册循环耦合较深，留在 register-completion-providers.js 中一起处理。

- [ ] **Step 2: 从 extension.js 删除已迁移代码**

删除上述所有常量和函数。在文件顶部添加：
```javascript
const { KIND_MAP, SORT_PREFIX, DETAIL_LABEL, DOC_LABELS, DEFAULT_PREFIXES, formatDoc, applySnippetPrefixes } = require('./docs-loader');
```

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/docs-loader.js src/extension.js
git commit -m "refactor: 提取文档加载常量和工具函数到 docs-loader.js

将 KIND_MAP/SORT_PREFIX/DETAIL_LABEL/DOC_LABELS/DEFAULT_PREFIXES/formatDoc/applySnippetPrefixes 从 extension.js 提取为独立模块。

Ref #34"
```

---

### Task 7: 创建 commands/snippet-picker.js

**Files:**
- Create: `src/commands/snippet-picker.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 snippet-picker.js**

从 `src/extension.js` 提取以下内容到新文件：
- QuickPick snippet 数据加载（原第 188-198 行区域，`sdeSnippets`, `sdeviceSnippets` 等 require 和 `snippetModules` 映射）
- `showToolSnippets` 函数（原第 208-253 行）
- activate 内的 `sentaurus.insertSnippet` 命令注册逻辑

函数签名：
```javascript
/**
 * 注册 QuickPick 代码片段插入命令。
 * @param {vscode.ExtensionContext} context
 * @param {object} deps - { applySnippetPrefixes }
 */
function registerSnippetCommand(context, deps) { ... }

module.exports = { registerSnippetCommand };
```

- [ ] **Step 2: 从 extension.js 删除已迁移代码**

删除 snippet 数据 require、`showToolSnippets` 函数、snippet 命令注册代码。在文件顶部添加：
```javascript
const { registerSnippetCommand } = require('./commands/snippet-picker');
```

activate() 中替换为：
```javascript
registerSnippetCommand(context, { applySnippetPrefixes });
```

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/commands/snippet-picker.js src/extension.js
git commit -m "refactor: 提取 QuickPick 代码片段命令到 snippet-picker.js

将 sentaurus.insertSnippet 命令注册逻辑从 extension.js activate() 提取为独立模块。

Ref #34"
```

---

### Task 8: 创建 register-sde-providers.js

**Files:**
- Create: `src/register-sde-providers.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 register-sde-providers.js**

从 `src/extension.js` activate() 中提取 SDE 语言 Provider 注册（原第 428-445 行区域）：
- FoldingRangeProvider 注册
- Bracket diagnostic 注册
- Scheme 回车缩进注册
- Unit 自动配对注册
- 空引号自动删除注册

加上 activate() 中 SDE 特有的语义功能注册（原第 481-577 行区域中的 SDE 部分）：
- SignatureHelpProvider 注册
- SemanticTokens 注册
- RegionUndef 诊断注册
- Symbol 补全/引用注册
- 变量引用注册

函数签名：
```javascript
/**
 * 注册 SDE (Scheme) 语言的所有 Providers。
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 */
function registerSdeProviders(context, deps) { ... }

module.exports = { registerSdeProviders };
```

`deps` 包含：`schemeCache`, `funcDocs`, `symbolIndex`, `modeDispatch`, `symbolParams` 等由 activate() 传入的依赖。

- [ ] **Step 2: 从 extension.js 删除已迁移代码**

删除上述所有 SDE Provider 注册代码。在文件顶部添加：
```javascript
const { registerSdeProviders } = require('./register-sde-providers');
```

activate() 中替换为：
```javascript
registerSdeProviders(context, deps);
```

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/register-sde-providers.js src/extension.js
git commit -m "refactor: 提取 SDE Provider 注册到 register-sde-providers.js

将 Scheme 语言的 FoldingRange/Bracket/Signature/SemanticTokens/Symbol Providers 注册从 activate() 提取为独立模块。

Ref #34"
```

---

### Task 9: 创建 register-tcl-providers.js

**Files:**
- Create: `src/register-tcl-providers.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 register-tcl-providers.js**

从 `src/extension.js` activate() 中提取 5 种 Tcl 语言的共用 Provider 注册（原第 449-577 行区域）：
- 代码折叠注册
- 括号诊断注册
- 未定义变量诊断注册
- RegionUndef 诊断注册
- DocumentSymbol 注册
- SemanticTokens 注册（SDEVICE 独立 + 其他 4 种 Tcl 工具）
- 变量引用注册

函数签名：
```javascript
/**
 * 注册 5 种 Tcl 语言的共用 Providers。
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 */
function registerTclProviders(context, deps) { ... }

module.exports = { registerTclProviders };
```

- [ ] **Step 2: 从 extension.js 删除已迁移代码**

删除上述所有 Tcl Provider 注册代码。在文件顶部添加：
```javascript
const { registerTclProviders } = require('./register-tcl-providers');
```

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/register-tcl-providers.js src/extension.js
git commit -m "refactor: 提取 Tcl Providers 注册到 register-tcl-providers.js

将 5 种 Tcl 语言的 Folding/Bracket/UndefVar/RegionUndef/DocSymbol/SemanticTokens 注册从 activate() 提取为独立模块。

Ref #34"
```

---

### Task 10: 创建 register-completion-providers.js

**Files:**
- Create: `src/register-completion-providers.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 创建 register-completion-providers.js**

从 `src/extension.js` activate() 中提取 Provider 注册循环体（原第 579-971 行区域）：
- `loadDocsJson` 闭包函数和 `funcDocs` 对象（如果还在 activate 中）
- `getDocs` 函数
- `modeDispatch` / `symbolParams` 表构建
- CompletionItemProvider 创建（含子命令补全、矢量关键词补全）
- HoverProvider 创建（含 SDEVICE section 上下文感知、子命令 hover）
- DefinitionProvider 创建

函数签名：
```javascript
/**
 * 注册 6 种语言的 Completion/Hover/Definition Providers。
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 * @returns {object} funcDocs 供其他模块使用
 */
function registerCompletionProviders(context, deps) { ... }

module.exports = { registerCompletionProviders };
```

`deps` 包含：`allKeywords`, `schemeCache`, `tclCache`, `builtinMaterials`, `sdeviceStProvider` 等。

- [ ] **Step 2: 从 extension.js 删除已迁移代码**

删除上述所有 Provider 注册循环代码。在文件顶部添加：
```javascript
const { registerCompletionProviders } = require('./register-completion-providers');
```

- [ ] **Step 3: 运行测试验证**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add src/register-completion-providers.js src/extension.js
git commit -m "refactor: 提取 Completion/Hover/Definition Providers 到 register-completion-providers.js

将 Provider 注册循环体从 activate() 提取为独立模块。
含 loadDocsJson/getDocs 文档加载、modeDispatch/symbolParams 表构建、
三种 Provider 的完整注册逻辑。

Ref #34"
```

---

### Task 11: 清理 extension.js 并最终验证

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 验证 activate() 最终状态**

确认 activate() 只包含：
1. 关键词 JSON 加载 (~10 行)
2. 缓存初始化 (~5 行)
3. Tcl WASM 初始化 (~10 行)
4. 文件关闭清理 (~10 行)
5. 测试命令注册 (~10 行)
6. `registerSdeProviders(context, deps)` 调用 (~3 行)
7. `registerTclProviders(context, deps)` 调用 (~3 行)
8. `registerCompletionProviders(context, deps)` 调用 (~3 行)
9. `registerSnippetCommand(context, deps)` 调用 (~2 行)
10. 表达式转换命令注册 (~50 行，这部分逻辑自包含，保持原位)
11. 表达式帮助命令注册 (~10 行)

目标：activate() ~120-150 行。

- [ ] **Step 2: 清理无用 require**

删除不再需要的顶层 require（已被提取到子模块中的依赖）。确认每个 require 仍被 activate() 或文件中其他代码使用。

- [ ] **Step 3: grep 验证无断裂**

Run: `grep -rn "require.*\./" src/extension.js`
确认每个 require 引用的模块存在且被使用。

- [ ] **Step 4: 运行全量测试**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 5: 提交**

```bash
git add src/extension.js
git commit -m "refactor: 清理 extension.js 移除无用依赖

Phase 2 完成：extension.js 从 1293 行缩减为 ~200 行，
activate() 从 1006 行缩减为 ~150 行协调入口。

Ref #34"
```

---

## Phase 3: 更新测试与文档

### Task 12: 更新测试文件的 import 路径

**Files:**
- Modify: `tests/test-tcl-scope-index.js` — 如引用 tcl-ast-utils 的 ScopeIndex/buildScopeIndex
- Modify: `tests/test-tcl-scope-map.js` — 如引用 tcl-ast-utils 的 buildScopeMap
- Modify: `tests/test-tcl-ast-variables.js` — 如引用 tcl-ast-utils 的 getVariables
- Modify: `tests/test-tcl-ast-utils.js` — 更新为引用新模块或验证 tcl-ast-utils 保留功能
- Modify: `tests/test-tcl-var-refs.js` — 如引用 tcl-ast-utils 的 getVariableRefs
- Modify: `tests/test-tcl-document-symbol.js` — 更新为引用 tcl-document-symbol

- [ ] **Step 1: 检查所有测试文件的 require**

Run: `grep -rn "require.*tcl-ast-utils" tests/`
列出所有需要更新的引用。

- [ ] **Step 2: 逐个更新测试文件的 require**

将引用拆分后模块的测试文件更新为直接引用新模块。例如：
- 引用 `getVariables` → `require('../src/lsp/tcl-variable-extractor')`
- 引用 `buildScopeIndex` → `require('../src/lsp/tcl-scope')`
- 引用 `findMismatchedBraces` → `require('../src/lsp/tcl-bracket-check')`
- 引用 `getDocumentSymbols` → `require('../src/lsp/tcl-document-symbol')`

- [ ] **Step 3: 运行全量测试**

Run: `node --test tests/test-*.js 2>&1 | tail -10`
Expected: 34 pass, 0 fail

- [ ] **Step 4: 提交**

```bash
git add tests/
git commit -m "refactor: 更新测试文件引用路径适配模块拆分

同步更新测试文件中 tcl-ast-utils 的 require 路径为新模块。

Ref #34"
```

---

### Task 13: 更新 CLAUDE.md 文件树

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新项目结构文件树**

在 CLAUDE.md 的项目结构中添加新文件：
```
├── src/                                        ← 扩展源码（纯 CommonJS，无构建步骤）
│   ├── extension.js                            ← 入口：activate() 协调入口（~150行）
│   ├── definitions.js                          ← 用户变量补全/悬停/跳转（Scheme + Tcl）
│   ├── docs-loader.js                          ← 文档加载常量与格式化工具
│   ├── register-sde-providers.js               ← SDE 语言 Provider 注册
│   ├── register-tcl-providers.js               ← 5 种 Tcl 语言共用 Provider 注册
│   ├── register-completion-providers.js        ← Completion/Hover/Definition Provider 注册
│   ├── commands/                               ← VSCode 命令实现
│   │   ├── expression-converter.js             ← ...
│   │   └── snippet-picker.js                   ← QuickPick 代码片段命令
...
├── src/lsp/                                    ← 语义功能核心
│   ├── tcl-ast-utils.js                        ← Tcl AST 通用工具（parseSafe/walkNodes/辅助函数）
│   ├── tcl-scope.js                            ← 作用域构建与索引（ScopeIndex/buildScopeIndex）
│   ├── tcl-variable-extractor.js               ← 变量提取与引用查找
│   ├── tcl-bracket-check.js                    ← 括号平衡检查
│   ├── tcl-document-symbol.js                  ← 文档大纲符号提取
```

同时更新架构描述段落，反映新的模块划分。

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 文件树和架构描述

反映 REV-004 拆分后的模块结构。

Ref #34"
```

---

## 最终验证

### Task 14: 全量验证与推送

- [ ] **Step 1: 运行全量测试**

Run: `node --test tests/test-*.js 2>&1 | tail -15`
Expected: 34 pass, 0 fail

- [ ] **Step 2: 检查 git log 确认提交历史整洁**

Run: `git log --oneline HEAD~13..HEAD`

- [ ] **Step 3: 检查无遗漏的 require**

Run: `grep -rn "require.*tcl-ast-utils" src/ tests/`
确认所有引用都已更新。

- [ ] **Step 4: 推送并创建 PR**

```bash
git push -u origin worktree-fix-rev-004-maintainability
gh pr create --title "refactor: REV-004 可维护性——大文件拆分与结构优化" --body "$(cat <<'EOF'
## Summary
- 拆分 tcl-ast-utils.js (1584行) 为 5 个职责模块：tcl-ast-utils.js (通用工具), tcl-scope.js (作用域), tcl-variable-extractor.js (变量提取), tcl-bracket-check.js (括号检查), tcl-document-symbol.js (文档符号)
- 拆分 extension.js activate() (1006行) 为 ~150 行协调入口 + 5 个注册/加载模块
- 更新 8 个消费者文件的 require 路径
- 更新测试文件 import 路径

## Test plan
- [x] 34 个测试文件全部通过
- [x] grep 验证所有 require 路径无断裂
- [ ] VSCode Extension Development Host 手动验证补全/悬停/定义跳转/折叠/诊断

Close #34
EOF
)"
```
