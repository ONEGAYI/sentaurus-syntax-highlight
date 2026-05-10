# 可维护性审查报告 — src/ 源码

审查范围: 39 文件
发现问题数: 10

## 高严重度

- **[高]** `src/lsp/tcl-ast-utils.js` — 文件 1844 行，承担了 Tcl 变量提取、作用域构建、括号平衡检查、代码折叠、文档符号提取等 6 类独立职责，应考虑按职责拆分。
  - 当前结构: 单一文件包含 `ScopeIndex` 类、`buildScopeIndex`、`buildScopeMap`、`getVariables`、`getVariableRefs`、`findMismatchedBraces`、`getFoldingRanges`、`getDocumentSymbols` 及约 30 个私有辅助函数。
  - 建议改进: 拆为 `tcl-scope.js`（`ScopeIndex` + `buildScopeIndex` + `buildScopeMap`）、`tcl-variable-extractor.js`（`getVariables` + `getVariableRefs`）、`tcl-bracket-check.js`（`findMismatchedBraces`）、`tcl-document-symbol.js`（`getDocumentSymbols` 及其 `_symbol*` 系列）、`tcl-ast-utils.js`（保留通用工具 `parseSafe`、`walkNodes`、`findNodesByType`、`TCL_LANGS`）。每个文件 200-400 行，职责清晰。

- **[高]** `src/extension.js` — `activate()` 函数从第 259 行到第 1267 行，长达 **1008 行**，在一个函数内完成了缓存初始化、Provider 注册（6 种语言 x 多种 Provider）、文档加载、QuickPick 交互、表达式转换命令注册。内部还定义了 `isInComment`、`registerConvertCommand`、`insertResult`、`getDocs` 等闭包函数，使得函数体极难在单屏内理解。
  - 当前代码: `function activate(context) { ... 1008 行 ... }`
  - 建议改进: 将 Provider 注册逻辑按语言提取为独立模块（如 `src/register-sde-providers.js`、`src/register-tcl-providers.js`、`src/register-sdevice-providers.js`）；将文档加载逻辑提取到 `src/docs-loader.js`；将 QuickPick/表达式转换命令提取到 `src/commands/snippet-picker.js`。`activate()` 缩减为 100-150 行的顶层协调代码。

- **[高]** `src/lsp/tcl-ast-utils.js:583-666` — `_collectLocalDefsForIndex` 和 `_collectLocalDefs`（第 885-966 行）两个函数几乎完全相同，仅在输出结构上不同（前者推入 `{name, defLine}` 数组，后者操作 `scopeMap`），是典型的"复制后微调"代码。
  - 当前代码: `_collectLocalDefsForIndex(node, defs, scopeStart, scopeEnd)` 和 `_collectLocalDefs(node, scopeMap, scopeStart, scopeEnd)` 约 160 行高度重复的 AST 遍历逻辑。
  - 建议改进: 提取通用的 AST 遍历器，通过回调参数化输出方式：`_collectVarDefsGeneric(node, onDef(name, line))`。两个调用者各自提供不同的回调即可。同理，`buildScopeIndex`（第 394-539 行）中的全局定义收集逻辑与 `_collectGlobalDefs`（第 744-817 行）也是近乎相同的遍历逻辑。

## 中严重度

- **[中]** `src/extension.js:672-691` — `isInComment` 函数定义在 `for` 循环内的 `langId` 闭包中，每次循环迭代都重新创建一个功能相同的函数，且其中包含复杂的字符串扫描逻辑（字符串转义、预处理器指令检测）。
  - 当前代码:
    ```javascript
    for (const langId of languages) {
        // ... 约 300 行 Provider 注册 ...
        function isInComment(document, position) { ... }
    }
    ```
  - 建议改进: 将 `isInComment` 提取为顶层函数或 `definitions.js` 中的公共函数，接受 `langId` 作为参数。`isInComment(document, position, langId)` 可被所有语言的 Provider 复用。

- **[中]** `src/lsp/providers/sdevice-semantic-provider.js:180-333` — `extractTokensFromStacks` 函数 **153 行**，在单个函数内完成 #define 行处理、字符串屏蔽、矢量关键词范围检测、子 section 前瞻（含多行扫描）、标识符匹配、token 生成等 6 个阶段，嵌套层次达 4 层（for > while > if > for）。
  - 建议改进: 将子 section 前瞻逻辑（第 253-289 行）提取为独立的 `detectSubSectionKeyword` 函数；将矢量关键词扫描提取为 `extractVectorTokens` 函数。

- **[中]** `src/extension.js:596-954` — 补全/Hover/Definition 的 Provider 注册被包裹在 `for (const langId of languages)` 循环中，循环体约 **360 行**，包含 3 个大型匿名对象（CompletionItemProvider、HoverProvider、DefinitionProvider），每个都包含复杂的回调逻辑。
  - 建议改进: 将 3 个 Provider 的创建逻辑分别提取为独立工厂函数（如 `createCompletionProvider(langId, items, ...)`、`createHoverProvider(langId, ...)`、`createDefinitionProvider(langId, ...)`），循环体缩减为每个工厂调用 1-2 行。

- **[中]** `src/lsp/providers/undef-var-diagnostic.js:40-81` 和 `src/lsp/providers/region-undef-diagnostic.js:26-59` 和 `src/lsp/providers/tcl-bracket-diagnostic.js:21-47` — 三个诊断 Provider 的 `activate` 函数中事件注册模式（`onDidChangeTextDocument` + debounce、`onDidOpenTextDocument`、`onDidCloseTextDocument`、主动扫描）高度重复，仅在语言 ID 过滤和 `updateDiagnostics` 实现上不同。
  - 建议改进: 提取通用的 `registerDiagnosticProvider(context, { languageFilter, updateFn, debounceMs })` 工具函数，消除 3 处约 30 行的重复事件注册代码。

- **[中]** `src/lsp/providers/variable-reference-provider.js:126-230` — `provideTclReferences` 函数中变量名去前缀逻辑（`${var}` / `$var` → `var`）在第 136-141 行出现，同样逻辑在 `extension.js` 的 DefinitionProvider（第 911-915 行）和 HoverProvider（第 801-805 行）中各出现一次。共 3 处。
  - 当前代码:
    ```javascript
    if (word.startsWith('${') && word.endsWith('}')) {
        word = word.slice(2, -1);
    } else if (word.startsWith('$')) {
        word = word.slice(1);
    }
    ```
  - 建议改进: 提取为 `stripTclVarPrefix(word)` 公共函数，放在 `definitions.js` 或新建 `src/lsp/tcl-utils.js` 中。

## 低严重度

- **[低]** `src/lsp/tcl-ast-utils.js:256-257` 和 `src/lsp/tcl-ast-utils.js:360` — `BRACE_LOOKAHEAD = 5` 和 `ABS_MAX_LOOKAHEAD = 200` 在 `sdevice-semantic-provider.js:256-257` 中使用，是影响前瞻行为的魔法数字。虽然名为常量，但缺乏文档说明其选择依据。
  - 当前代码: `const BRACE_LOOKAHEAD = 5;` 和 `const ABS_MAX_LOOKAHEAD = 200;`
  - 建议改进: 添加注释说明选择依据（如 "5 行覆盖 99% 的子 section 声明" 和 "200 行为绝对安全上限"），或考虑将其提取为可配置参数。

- **[低]** `src/lsp/providers/undef-var-diagnostic.js:9` 和 `src/lsp/providers/bracket-diagnostic.js:12` 和 `src/lsp/providers/tcl-bracket-diagnostic.js:11` 和 `src/lsp/providers/region-undef-diagnostic.js:7` — `DEBOUNCE_MS = 500` 在 4 个文件中分别定义为局部常量，值完全相同。
  - 建议改进: 提取为共享常量（如 `src/lsp/constants.js`），或至少统一到 `parse-cache.js` 中。

- **[低]** `src/lsp/providers/sdevice-semantic-provider.js:64-74` — `isWs` 和 `isWord` 使用硬编码的字符码比较，虽然高效但可读性不如正则或命名常量。
  - 当前代码: `const code = c.charCodeAt(0); return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || ...`
  - 建议改进: 若性能允许，可改为 `return /[\w]/.test(c)`；或添加注释标明 48/57/65/90/97/122 对应的字符范围。

## 总结

项目整体代码质量较高，文件职责划分基本合理。主要可维护性风险集中在两个大文件：

1. **`tcl-ast-utils.js`（1844 行）** — 承担了过多职责，且存在显著的内部代码重复（`_collectLocalDefsForIndex` 与 `_collectLocalDefs`、`buildScopeIndex` 中的全局收集与 `_collectGlobalDefs`）。建议按数据流方向拆分为 4-5 个独立模块。

2. **`extension.js`（1277 行）** — `activate()` 函数体达 1008 行，是最突出的可维护性问题。Provider 注册、文档加载、命令注册应拆分为独立模块，使 `activate()` 仅作为顶层协调入口。

其余文件大小和职责划分合理，小文件（<200 行）的模块化做得很好，特别是 `scheme-on-enter-logic.js`、`unit-auto-close-logic.js`、`quote-auto-delete-logic.js` 等将纯逻辑与 VSCode Provider 分离的做法值得称赞。
