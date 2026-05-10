# 健壮性审查报告 — src/ 源码

审查范围: 39 文件, 9632 行
发现问题数: 7

## 高严重度

- **[高]** `src/lsp/providers/variable-reference-provider.js:208` — `root` 变量未定义，运行时必然抛出 ReferenceError
  - 当前代码: `const refs = getVariableRefs(root);`
  - 上下文: `provideTclReferences` 函数中，`entry.tree` 存在时进入 if 分支，但调用 `getVariableRefs(root)` 时 `root` 从未声明。应为 `entry.tree.rootNode`。此 bug 在用户对 Tcl 变量执行 Find All References 时触发，每次必崩。
  - 建议改进: `const refs = getVariableRefs(entry.tree.rootNode);`

- **[高]** `src/lsp/scheme-parser.js:140-142` — `'` 后紧跟 EOF 时 `expr` 为 null，解引用 `.end` / `.endLine` 必然抛出 TypeError
  - 当前代码:
    ```js
    const expr = parseExpr();
    return {
        type: 'Quote',
        expression: expr,
        start: tok.start,
        end: expr.end,       // expr === null → TypeError
        line: tok.line,
        endLine: expr.endLine, // expr === null → TypeError
    };
    ```
  - 触发场景: 用户在文件末尾输入孤立的 `'` 字符（如 Scheme 引号 `'` 后立即结束文件）。`parseExpr()` 遇到 EOF 返回 `null`，后续构造节点时解引用 null 抛出异常。虽然 `parseExpr` 在其他分支（如 `parseList`）能正常返回，但 Quote 分支是唯一直接依赖 `parseExpr` 返回值属性的路径。此异常会导致所有依赖 Scheme 解析的功能（悬停、补全、诊断、折叠）在该文档上全部失效。
  - 建议改进:
    ```js
    const expr = parseExpr();
    return {
        type: 'Quote',
        expression: expr,
        start: tok.start,
        end: expr ? expr.end : tok.end,
        line: tok.line,
        endLine: expr ? expr.endLine : tok.line,
    };
    ```

- **[高]** `src/extension.js` 多处 Provider 回调（provideHover:697, provideDefinition:861, provideCompletionItems:570/637, provideSignatureHelp:532）— 均未包裹 try-catch
  - 当前代码: Provider 回调直接调用依赖链（`schemeCache.get()` → `dispatcher.dispatch()` → `scopeAnalyzer.getVisibleDefinitions()` 等），任何一环抛出未捕获异常将导致 VSCode 静默终止该 Provider 的后续调用（功能永久失效直到文档重新打开）。
  - 典型触发场景: (1) WASM 解析器返回畸形 AST 节点（node.startPosition / node.endPosition 为 undefined）；(2) `schemeCache.get()` 解析失败后返回的 entry 中 analysis/scopeTree 为异常值；③ `document.lineAt()` 传入越界行号。
  - VSCode Provider 协议不保证回调内的异常被捕获。根据 VSCode 源码，未捕获异常会被记录到 console 但 Provider 实例可能被标记为 failed 后不再调用。
  - 建议改进: 对每个 Provider 回调添加顶层 try-catch，异常时返回 null/空数组：
    ```js
    provideHover(document, position) {
        try {
            if (isInComment(document, position)) return null;
            // ... 现有逻辑
        } catch (e) {
            console.error('Sentaurus: provideHover error', e);
            return null;
        }
    },
    ```
    同理适用于 `provideDefinition`、`provideCompletionItems`、`provideSignatureHelp`。

## 中严重度

- **[中]** `src/lsp/tcl-parser-wasm.js:193-199` — WASM `parse()` 函数未包裹 try-catch，畸形输入可能导致 WASM 异常传播
  - 当前代码:
    ```js
    function parse(text) {
        if (!_parser) {
            debug('ERROR: 解析器未初始化，请先调用 init()');
            return null;
        }
        return _parser.parse(text);
    }
    ```
  - `web-tree-sitter` 的 `Parser.parse()` 在遇到特定畸形输入时可能抛出 WASM 级别的异常（例如内部缓冲区溢出、非法 UTF-8 序列）。此函数是所有 Tcl 语义功能的入口点（通过 `parseSafe` → `TclParseCache.get`），异常未被捕获将沿着调用链传播到 VSCode Provider 回调，导致诊断/折叠/悬停等功能失效。
  - 建议改进:
    ```js
    function parse(text) {
        if (!_parser) {
            debug('ERROR: 解析器未初始化，请先调用 init()');
            return null;
        }
        try {
            return _parser.parse(text);
        } catch (e) {
            debug(`parse() WASM 异常: ${e.message}`);
            return null;
        }
    }
    ```

- **[中]** `src/extension.js:895-896` 及 `src/lsp/providers/symbol-reference-provider.js:71-72`、`region-undef-diagnostic.js:75-76`、`variable-reference-provider.js:95-96,114-115` — `lineStarts[def.line - 1]` 数组越界访问未防御
  - 当前代码: `const defStartCol = def.start - lineStarts[def.line - 1];`
  - `lineStarts` 数组长度等于文档行数。当 AST 节点的 `line` 值因解析错误（如未闭合括号导致的虚拟行号）超出实际文档行数时，`lineStarts[def.line - 1]` 返回 `undefined`，后续算术运算产生 `NaN`，最终导致 VSCode 创建非法的 Range 对象（行为 NaN），引发 Provider 异常。
  - 触发场景: Scheme 解析器在未闭合括号时会将 `endLine` 设为 `tokenizedMaxLine`（最后 token 所在行），如果源码末尾恰好有未闭合的列表，该行号可能在某些 edge case 下超出 lineStarts 范围（如文件以换行符结尾，tokenizedMaxLine 比 lineStarts.length 多 1）。
  - 建议改进: 在访问前添加边界检查，或使用安全的取值函数：
    ```js
    function safeCol(lineStarts, line, offset) {
        const idx = line - 1;
        return idx >= 0 && idx < lineStarts.length ? offset - lineStarts[idx] : 0;
    }
    ```

- **[中]** `src/lsp/providers/bracket-diagnostic.js:46-62`、`tcl-bracket-diagnostic.js:53-73`、`undef-var-diagnostic.js:87-97` — 诊断回调 `updateDiagnostics` 未包裹 try-catch
  - 当前代码: 诊断回调通过 debounce 定时器触发，内部直接调用 `schemeCache.get(doc)` / `tclCache.get(document)` 并解构返回值。如果解析失败（例如 Scheme 解析器因上述 Quote+EOF bug 抛出异常），异常将穿透 debounce 定时器，被 Node.js 全局 uncaughtException 处理（或被 VSCode 吞掉）。
  - 虽然诊断回调不直接关联 Provider 生命周期（不受"Provider 标记为 failed"的影响），但未捕获异常可能导致该文档的诊断永远不更新（debounce 定时器不会重试）。
  - 建议改进: 在每个 `updateDiagnostics` 函数内添加 try-catch，异常时清空诊断：
    ```js
    function updateDiagnostics(doc) {
        try {
            const { errors } = schemeCache.get(doc);
            // ...
        } catch (e) {
            console.error('Sentaurus: bracket diagnostic error', e);
            diagnosticCollection.set(doc.uri, []);
        }
    }
    ```

## 低严重度

- **[低]** `src/lsp/providers/tcl-funcall-semantic.js:52` — 访问 `scopeIndex._globalProcNames` 私有属性，接口契约脆弱
  - 当前代码: `const procNames = scopeIndex ? scopeIndex._globalProcNames : new Map();`
  - `_globalProcNames` 是 `ScopeIndex` 类的内部属性（以 `_` 前缀标识），不属于公开 API。如果 `ScopeIndex` 内部实现变更（例如重命名或改为方法），此处将静默返回 `undefined`（被 `? : new Map()` 兜底为空 Map），导致所有 proc 调用语义着色消失但不报错。
  - 建议改进: 在 `ScopeIndex` 类上添加公开的 getter 方法：
    ```js
    get globalProcNames() { return this._globalProcNames; }
    ```
    然后调用处使用 `scopeIndex.globalProcNames`。

## 总结

### 问题分布

| 严重度 | 数量 | 分布 |
|--------|------|------|
| 高 | 3 | variable-reference-provider (1), scheme-parser (1), extension.js (1 批量) |
| 中 | 3 | tcl-parser-wasm (1), extension.js + 多个 provider (1 批量), 诊断回调 (1 批量) |
| 低 | 1 | tcl-funcall-semantic (1) |

### 核心风险

1. **Provider 回调缺乏顶层 try-catch**（高）：这是最大的系统性风险。extension.js 中注册的 HoverProvider、DefinitionProvider、CompletionItemProvider、SignatureHelpProvider 共 4 类 Provider 均未做异常保护。结合 scheme-parser 和 tcl-parser-wasm 中存在的解析异常路径，用户在编辑过程中极易触发未捕获异常，导致功能静默失效。

2. **variable-reference-provider.js 的 `root` 未定义 bug**（高）：这是一个确定性的运行时错误（非防御性问题），Tcl 文件中对变量执行 Find All References 时必定崩溃。

3. **scheme-parser Quote+EOF 空指针**（高）：文件末尾的孤立 `'` 字符会触发 null 解引用，影响整个 Scheme 解析管线。

### 积极发现

- **WASM tree 内存管理**做得很好：`TclParseCache` 在 `invalidate()`、`dispose()`、FIFO 淘汰和 version 变更时都正确调用了 `tree.delete()`，覆盖了所有释放路径。
- **解析缓存层**（`parse-cache.js`）设计良好，`TclParseCache.get()` 正确处理了 WASM 未就绪（返回 null）、tree 为 null（返回 null）和 version 变更（释放旧 tree）三种防御场景。
- **Provider 内部逻辑**（folding-provider、tcl-folding-provider、tcl-document-symbol-provider）均正确处理了 cache 返回 null 的场景（返回空数组）。
- **正则转义**：`pp-utils.js` 提供了 `escapeRegex` 工具函数，且在 extension.js 的 `provideDefinition` 回调中正确使用，避免了正则注入风险。
