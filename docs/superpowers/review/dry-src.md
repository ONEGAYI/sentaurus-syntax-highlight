# 复用/DRY审查报告 — src/ 源码

审查范围: 39 文件, 9632 行
发现问题数: 7

## 高严重度

### 1. `effectiveChildren()` 函数在两个文件中重复定义

- **[高]** `src/lsp/semantic-dispatcher.js:25-27` 和 `src/lsp/symbol-index.js:41-43` — 完全相同的 `effectiveChildren(listNode)` 函数在两个模块中各有一份实现，逻辑完全一致：过滤 Comment 节点后的有效子节点。
  - 当前代码 (`semantic-dispatcher.js`):
    ```js
    function effectiveChildren(listNode) {
        return listNode.children.filter(c => c.type !== 'Comment');
    }
    ```
  - 当前代码 (`symbol-index.js`):
    ```js
    function effectiveChildren(listNode) {
        return listNode.children.filter(c => c.type !== 'Comment');
    }
    ```
  - 建议改进: 将 `effectiveChildren` 提取到一个共享工具模块（如 `scheme-ast-utils.js` 或直接放在 `scheme-parser.js` 中导出），两处统一 import。

### 2. `tcl-ast-utils.js` 中 `_collectLocalDefs` 与 `_collectLocalDefsForIndex` 大面积重复

- **[高]** `src/lsp/tcl-ast-utils.js:583-666` vs `src/lsp/tcl-ast-utils.js:885-966` — `_collectLocalDefsForIndex` 和 `_collectLocalDefs` 两个函数结构几乎完全相同，唯一差异在于输出形式：前者推入 `{ name, defLine }` 数组，后者调用 `_addToScopeFromLine(scopeMap, ...)` 操作 Map。两者的命令分支逻辑（set/foreach/for/lassign/lmap/dict/incr/lappend/append/ERROR）完全重复，约 80 行代码。
  - 当前代码: 两个函数各自独立实现了相同的命令分发逻辑：
    ```js
    // _collectLocalDefsForIndex (line 583)
    if (cmdName === 'for') { ... }
    else if (cmdName === 'lassign' || cmdName === 'lmap' || cmdName === 'dict') { ... }
    else if (cmdName === 'incr') { ... }
    else if (cmdName === 'lappend' || cmdName === 'append') { ... }

    // _collectLocalDefs (line 885) — 几乎一模一样的分支结构
    if (cmdName === 'for') { ... }
    else if (cmdName === 'lassign' || cmdName === 'lmap') { ... }
    else if (cmdName === 'dict') { ... }
    else if (cmdName === 'incr') { ... }
    else if (cmdName === 'lappend' || cmdName === 'append') { ... }
    ```
  - 建议改进: 提取一个共用的内部遍历函数，接受回调参数 `{ onDef(name, defLine) }`，两个上层函数各自传入不同的输出策略。由于 `buildScopeMap` 已被 `ScopeIndex` 替代（参见 line 725-726 `buildScopeMap` 直接调用 `buildScopeIndex`），`_collectLocalDefs` 和相关函数（`_collectGlobalDefs`、`_processProcScopes`、`_processScopeImports`）可以考虑在未来移除，届时此重复自然消除。

### 3. `tcl-ast-utils.js` 中 `_collectScopeImportsForIndex` 与 `_processScopeImports` 重复

- **[高]** `src/lsp/tcl-ast-utils.js:674-718` vs `src/lsp/tcl-ast-utils.js:968-1012` — 与上一条类似，两个函数逻辑完全一致，差异仅在输出方式：前者推入 `imports` 数组，后者调用 `_addToScopeFromLine(scopeMap, ...)`。处理的命令（global/upvar/variable）和提取逻辑（`_extractUpvarLocalNames`、`_extractVariableNames`）完全重复，约 40 行。
  - 建议改进: 同上条，等待 `buildScopeMap` 废弃后自然消除。若需立即处理，可提取通用遍历函数 + 回调模式。

## 中严重度

### 4. `tcl-ast-utils.js` 中 `buildScopeIndex` 与 `_collectGlobalDefs` 重复

- **[中]** `src/lsp/tcl-ast-utils.js:394-539` vs `src/lsp/tcl-ast-utils.js:744-817` — `buildScopeIndex` 中的全局定义收集逻辑与 `_collectGlobalDefs` 高度重复。两者都遍历根节点的直接子节点，处理 set/procedure/command/foreach/ERROR 节点类型，提取变量定义。`buildScopeIndex` 是新版（输出 ScopeIndex），`_collectGlobalDefs` 是旧版（输出 scopeMap），逻辑几乎 1:1 重复，约 100 行。
  - 建议改进: `buildScopeMap`（line 725-733）已直接调用 `buildScopeIndex` 然后转换为 Map，说明 `_collectGlobalDefs`、`_processProcScopes`、`_collectLocalDefs`、`_processScopeImports` 和 `_addToScopeFromLine` 这些函数组已成为死代码的过渡层。建议添加 `@deprecated` 标注，或在确认无外部调用后直接移除，消除约 300 行重复代码。

### 5. 诊断 Provider 间重复的激活/注册模式

- **[中]** 以下四个诊断 Provider 文件共享几乎相同的激活模式（debounce timer、DiagnosticCollection 创建、onDidChangeTextDocument 注册、onDidCloseTextDocument 清理、初始扫描）：
  - `src/lsp/providers/bracket-diagnostic.js:6-40`
  - `src/lsp/providers/tcl-bracket-diagnostic.js:7-47`
  - `src/lsp/providers/undef-var-diagnostic.js:36-81`
  - `src/lsp/providers/region-undef-diagnostic.js:20-58`

  每个文件都重复以下结构：
  ```js
  let diagnosticCollection;
  let debounceTimer;
  const DEBOUNCE_MS = 500;

  function activate(context, ...) {
      diagnosticCollection = vscode.languages.createDiagnosticCollection('xxx');
      context.subscriptions.push(diagnosticCollection);
      context.subscriptions.push(
          vscode.workspace.onDidChangeTextDocument(event => {
              const doc = event.document;
              if (/* langId filter */) return;
              if (debounceTimer) clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
          })
      );
      context.subscriptions.push(
          vscode.workspace.onDidCloseTextDocument(doc => {
              diagnosticCollection.delete(doc.uri);
          })
      );
      // 初始扫描
      for (const doc of vscode.workspace.textDocuments) { ... }
  }
  ```
  - 建议改进: 提取一个通用的 `createDiagnosticProvider` 工厂函数，接受配置参数 `{ name, languageFilter, updateFn }`，返回 `activate(context)` 函数。可消除约 40 行/文件 x 4 文件 = 160 行重复。`DEBOUNCE_MS = 500` 也被重复定义了 4 次。

### 6. `variable-reference-provider.js` 中 Scheme 和 Tcl 双路径的 #define 引用查找逻辑重复

- **[中]** `src/lsp/providers/variable-reference-provider.js:60-84`（Scheme 路径）和 `src/lsp/providers/variable-reference-provider.js:158-179`（Tcl 路径）— 两个函数中查找 #define 宏引用的逻辑高度相似：都是从 `ppDefs` 中反向查找匹配的宏定义，调用 `ppUtils.findPpDefineRefs`，然后去重构建 Location 数组。约 25 行代码在两个函数中重复。
  - 当前代码 (Scheme, line 60-84):
    ```js
    const ppDef = [...entry.ppDefs].reverse().find(d => d.name === word && d.line <= cursorLine);
    if (ppDef) {
        const locations = [];
        if (options.includeDeclaration !== false) {
            locations.push(new vscode.Location(document.uri, new vscode.Range(...)));
        }
        const ppRefs = ppUtils.findPpDefineRefs(docText, entry.ppDefs.filter(d => d.name === word));
        for (const ref of ppRefs) {
            const isDup = locations.some(loc => ...);
            if (!isDup) { locations.push(new vscode.Location(...)); }
        }
        if (locations.length > 0) return locations;
    }
    ```
  - 当前代码 (Tcl, line 158-179): 几乎相同的模式。
  - 建议改进: 提取一个共享的 `findPpDefineLocations(document, word, cursorLine, ppDefs, text, includeDeclaration)` 函数到 `pp-utils.js` 或独立的辅助模块，两个路径共用。

## 低严重度

### 7. `extension.js` 与 `undef-var-diagnostic.js` 中 `decodeHtml` 逻辑重复

- **[低]** `src/extension.js:41-43` 和 `src/lsp/providers/undef-var-diagnostic.js:166` — `decodeHtml` 函数在 `extension.js` 中定义为独立函数，在 `undef-var-diagnostic.js` 中以内联 lambda 形式重新实现（`_decodeHtmlEntities`），逻辑完全一致：
  - 当前代码 (`extension.js`):
    ```js
    function decodeHtml(str) {
        return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    }
    ```
  - 当前代码 (`undef-var-diagnostic.js`):
    ```js
    const _decodeHtmlEntities = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    ```
  - 建议改进: 将 `decodeHtml` 导出（例如放在 `pp-utils.js` 或新建 `html-utils.js`），两处统一 import。

## 总结

项目中 DRY 问题的核心集中在以下三方面：

1. **Tcl 作用域分析的双轨遗留代码**（问题 2、3、4，约占 420 行重复）：`buildScopeMap` 旧管线（`_collectGlobalDefs`/`_collectLocalDefs`/`_processProcScopes`/`_processScopeImports`/`_addToScopeFromLine`）已被 `buildScopeIndex`/`ScopeIndex` 新管线替代，但旧代码仍然保留。这是最大的 DRY 债务，建议在确认无外部调用后统一移除。

2. **Scheme AST 工具函数分散**（问题 1）：`effectiveChildren` 虽然只有 3 行，但在两个模块中重复定义，属于容易遗漏同步的微重复。

3. **Provider 注册模式**（问题 5、6）：4 个诊断 Provider 和 Reference Provider 中的双语言路径存在可提取的共性模式。这些问题影响范围可控，但若未来新增 Provider 或语言，重复会继续扩大。
