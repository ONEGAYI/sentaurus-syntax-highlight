# 性能审查报告 — src/ 源码

审查范围: 39 文件, 9632 行
发现问题数: 8

## 高严重度

- **[高]** `src/lsp/tcl-ast-utils.js:719-733` — `buildScopeMap` 对每一行调用 `getVisibleAt`，每次都遍历全部 `globalDefs` 和 `procScopes`，总复杂度 O(lines × (globalDefs + procScopes × globalDefs))
  - 当前代码:
    ```js
    function buildScopeMap(root) {
        const index = buildScopeIndex(root);
        const maxLine = _countMaxLine(root) + 1;
        const scopeMap = new Map();
        for (let i = 1; i <= maxLine; i++) {
            scopeMap.set(i, index.getVisibleAt(i));
        }
        return scopeMap;
    }
    ```
  - 建议改进: `buildScopeMap` 目前似乎仅用于测试（`module.exports` 导出了但非测试代码未调用）。若生产中确无使用，可标记为 `@deprecated` 并在后续版本移除。如果需要保留，应改为增量更新策略：对全局变量用"从定义行开始加入"的 sweep line 方式，对 proc scope 在进入/退出时增减，避免逐行全量计算。不过鉴于已有 `ScopeIndex.getVisibleAt(line)` 的按需查询替代方案，`buildScopeMap` 本身已属于遗留代码。

- **[高]** `src/lsp/providers/undef-var-diagnostic.js:269-300` — `checkSchemeUndefVars` 对每个引用调用 `getVisibleDefinitions`，而 `getVisibleDefinitions` 每次从根遍历作用域树。N 个引用的复杂度为 O(N × scopeTreeDepth)
  - 当前代码:
    ```js
    function checkSchemeUndefVars(document) {
        const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);
        for (const ref of refs) {
            const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, ref.line);
            const isVisible = visible.some(d => d.name === ref.name);
            // ...
        }
    }
    ```
  - 建议改进: 对 `refs` 按行号排序后，利用同一行的引用复用 `visible` 结果（大部分引用集中在若干行上）。或引入按行缓存的 `Map<number, Array>` 避免重复遍历作用域链。当文档包含数百个引用时，这可将 `getVisibleDefinitions` 的调用次数从 O(N) 降至 O(unique_lines)。

- **[高]** `src/lsp/providers/variable-reference-provider.js:86-123` — `provideSchemeReferences` 对每个匹配引用单独调用 `getVisibleDefinitions(scopeTree, ref.line)`，与上方 `checkSchemeUndefVars` 同样的 O(N × D) 问题
  - 当前代码:
    ```js
    for (const ref of refs) {
        if (ref.name !== word) continue;
        const refVisibleDefs = getVisibleDefinitions(scopeTree, ref.line);
        const resolvesToSame = refVisibleDefs.some(/* ... */);
    }
    ```
  - 建议改进: 同上，按行缓存 `visibleDefs`。此外可先过滤出同名引用再查询作用域，减少不必要的 `getVisibleDefinitions` 调用。

## 中严重度

- **[中]** `src/lsp/providers/symbol-completion.js:61` — `provideSymbolCompletions` 每次触发都重新调用 `extractSymbols(ast, text, symbolParamsTable, modeDispatchTable)` 做全量 AST 遍历，即使文档内容未变
  - 当前代码:
    ```js
    const { defs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    ```
  - 建议改进: `extractSymbols` 的结果可以按 `{uri, version}` 缓存（类似 `SchemeParseCache` 的思路），或在 `SchemeParseCache.get()` 中一并计算并缓存。`extractSymbols` 的计算成本与 AST 大小成线性关系，在大型 SDE 文件中每次 `"` 触发都重新扫描所有节点会带来可感知延迟。

- **[中]** `src/lsp/providers/symbol-reference-provider.js:62` — `provideSymbolReferences` 每次触发 Find All References 都重新调用 `extractSymbols`
  - 当前代码:
    ```js
    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    ```
  - 建议改进: 与 `symbol-completion.js` 相同的问题。`extractSymbols` 被三个不同的 Provider 调用（`symbol-completion`、`symbol-reference-provider`、`region-undef-diagnostic`），应在 `SchemeParseCache` 中统一缓存。

- **[中]** `src/lsp/providers/region-undef-diagnostic.js:66` — `updateDiagnostics` 每次文档变更后都重新调用 `extractSymbols`
  - 当前代码:
    ```js
    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    ```
  - 建议改进: 同上。将 `extractSymbols` 结果集成到 `SchemeParseCache` 中，所有依赖 `extractSymbols` 的 Provider 共享同一份缓存。

- **[中]** `src/lsp/pp-utils.js:118-181` — `findPpDefineRefs` 中对每个 `define` 为整个文档的每一行都构建正则并扫描，N 个 define × M 行的复杂度为 O(N×M)
  - 当前代码:
    ```js
    for (const def of defines) {
        const regex = buildWordRegex(def.name);  // 每次循环新建 RegExp
        for (let i = 0; i < lines.length; i++) {
            // 每行用该正则扫描
        }
    }
    ```
  - 建议改进: (1) 在每次循环外创建正则并 `regex.lastIndex = 0` 重置（当前已在做）。(2) 更根本的优化是改为单遍扫描：一次遍历所有行，对每行尝试匹配所有 define 名。不过考虑到 `#define` 数量通常很少（< 20），当前实现在实际场景中不太可能成为瓶颈。当 define 数量达到数百时才需关注。

## 低严重度

- **[低]** `src/lsp/tcl-symbol-configs.js:111-113` — `getSdeviceAllSectionKeywordsLower()` 每次调用都重新创建 Set 并遍历所有关键词做 `.toLowerCase()`，返回值未被缓存
  - 当前代码:
    ```js
    function getSdeviceAllSectionKeywordsLower() {
        return new Set([...getSdeviceAllSectionKeywords()].map(k => k.toLowerCase()));
    }
    ```
  - 建议改进: 在模块级别预计算并缓存为常量（与 `SDEVICE_SUB_SECTIONS` 类似），避免每次调用时重新构造 Set。此函数在 `extension.js` 的 `activate()` 中仅调用一次并存入变量，运行时性能影响可忽略，但属于不必要的重复分配。

## 总结

核心发现集中在以下三个模式：

1. **`extractSymbols` 重复计算**（中严重度，3 处）— `symbol-completion.js`、`symbol-reference-provider.js`、`region-undef-diagnostic.js` 各自独立调用 `extractSymbols`，但它们操作的是同一个 AST（来自 `SchemeParseCache`）。建议将 `extractSymbols` 的结果集成到 `SchemeParseCache.get()` 返回的缓存条目中，消除冗余遍历。

2. **`getVisibleDefinitions` 逐引用调用**（高严重度，2 处）— `undef-var-diagnostic.js` 和 `variable-reference-provider.js` 对每个引用单独查询作用域可见性。建议引入按行缓存或将同一行的引用合并处理。

3. **`buildScopeMap` 遗留代码**（高严重度，1 处）— 已有 `ScopeIndex` 提供按需查询替代，但 `buildScopeMap` 仍导出并存在 O(lines × defs) 的全量预计算。实际生产代码中未发现调用点，建议标记为 deprecated 或移除。

总体而言，项目在架构层面已做了良好的缓存设计（`SchemeParseCache` + `TclParseCache` + `SdeviceSemanticProvider` 内部缓存），WASM tree 对象的生命周期管理也处理得当（`dispose` / `invalidate` 中正确调用 `tree.delete()`）。性能问题主要出现在少数 Provider 中的重复 AST 遍历和作用域查询上，通过将 `extractSymbols` 结果纳入缓存层即可显著改善。
