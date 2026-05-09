# 正确性审查报告 — src/ 源码

审查范围: 39 文件, 9632 行
发现问题数: 5

## 高严重度

- **[高]** `src/lsp/providers/variable-reference-provider.js:208` — `provideTclReferences` 中引用了未定义的变量 `root`
  - 当前代码:
    ```javascript
    const refs = getVariableRefs(root);
    ```
    `root` 未在函数内声明。此处应为 `entry.tree.rootNode`。该行位于 `if (entry && entry.tree)` 块内（第 182 行），因此 `entry` 已确认非空，但 `root` 从未被赋值。这会导致运行时 `ReferenceError`，Tcl 语言的变量引用查找（Find All References）功能将完全失效。
  - 建议改进:
    ```javascript
    const refs = getVariableRefs(entry.tree.rootNode);
    ```

## 中严重度

- **[中]** `src/lsp/providers/tcl-funcall-semantic.js:21` — `walkForTclFuncCalls` 使用 `startIndex`/`endIndex` 而非 `startPosition`/`endPosition`，与其他所有使用 tree-sitter 节点的代码不一致
  - 当前代码:
    ```javascript
    const pos = ppUtils.offsetToLineCol(firstChild.startIndex, lineStarts);
    collector(pos.line, pos.col, firstChild.endIndex - firstChild.startIndex);
    ```
    tree-sitter 节点的 `startIndex`/`endIndex` 返回字节偏移量（byte offsets），而 `ppUtils.offsetToLineCol` 期望的是字符偏移量。对于纯 ASCII 文本两者相同，但如果 Tcl 代码中包含多字节字符（如中文注释），字节偏移和字符偏移会不一致，导致语义 token 的行列位置计算错误。该文件第 51-52 行的 `scopeIndex` 处理也有同样问题。对比 `tcl-ast-utils.js` 中所有位置计算都使用 `startPosition.row`/`startPosition.column`（行/列，而非字节偏移），这是正确的做法。
  - 建议改进:
    ```javascript
    collector(firstChild.startPosition.row, firstChild.startPosition.column, firstChild.endPosition.column - firstChild.startPosition.column);
    ```
    并移除对 `ppUtils.offsetToLineCol` 和 `lineStarts` 的依赖。

- **[中]** `src/lsp/scope-analyzer.js:118` — `buildScopeTree` 中 `if` 和 `cond` 的空列表 guard 位置不当，可能在 `children[0]` 为非 Identifier 节点时产生运行时错误
  - 当前代码:
    ```javascript
    // 空列表（如 ()、(; comment)）没有子节点可处理
    if (children.length === 0) return;

    // (if test consequent [alternative])
    if (children[0].value === 'if' && children.length >= 3) {
    ```
    当 `children.length === 0` 时正确返回，但当 `children` 非空且 `children[0]` 不是 Identifier（例如 `children[0]` 是 Number 或 String 节点）时，访问 `children[0].value` 不会崩溃（Number/String 节点也有 value 属性），但后续的条件判断 `=== 'if'` 等会失败并继续执行到 `cond`、`case` 等分支，同样访问 `.value`。虽然这些情况下不会崩溃，但更根本的问题是：第 25 行的外层 `if` 条件 `children[0].type === 'Identifier'` 在 `if`/`cond`/`case` 处理之前已经返回，所以这段代码实际上不会遇到 `children[0]` 不是 Identifier 的情况。这段代码逻辑上正确但可读性差，`if`/`cond`/`case` 分支应该放在第 25 行 `if` 块内部，或添加 `children[0].type === 'Identifier'` 的 guard。
  - 建议改进: 将 `if`/`cond`/`case` 处理逻辑移入第 25 行的 `if (children[0].type === 'Identifier')` 块内，与 `define`/`let`/`lambda` 的处理保持一致，或在每个分支开头添加类型检查。

- **[中]** `src/lsp/scheme-parser.js:135-143` — `parseExpr` 中 `Quote` 节点的 `endLine` 来自解引用后的 `expr`，但 `expr` 可能为 `null`（EOF 时），导致属性访问崩溃
  - 当前代码:
    ```javascript
    if (tok.type === TokenType.QUOTE) {
        advance();
        const expr = parseExpr();
        return {
            type: 'Quote',
            expression: expr,
            start: tok.start,
            end: expr.end,      // expr 为 null 时崩溃
            line: tok.line,
            endLine: expr.endLine,  // expr 为 null 时崩溃
        };
    }
    ```
    当输入以 `'` 结尾时（如 `(define x ')`），`advance()` 消耗 `QUOTE` token 后 `parseExpr()` 会遇到 EOF 并返回 `null`。随后 `expr.end` 和 `expr.endLine` 会抛出 `TypeError: Cannot read properties of null`。
  - 建议改进:
    ```javascript
    if (tok.type === TokenType.QUOTE) {
        advance();
        const expr = parseExpr();
        return {
            type: 'Quote',
            expression: expr,
            start: tok.start,
            end: expr ? expr.end : tok.end,
            line: tok.line,
            endLine: expr ? expr.endLine : tok.line,
        };
    }
    ```

## 低严重度

- **[低]** `src/lsp/pp-utils.js:144` — `findPpDefineRefs` 中 `ifdefMatch.index + ifdefMatch[0].indexOf(def.name)` 计算列位置的方式可能在 `#` 前导空白被 `match` 捕获时产生偏移
  - 当前代码:
    ```javascript
    const nameStart = ifdefMatch.index + ifdefMatch[0].indexOf(def.name);
    ```
    正则 `/^\s*#(ifdef|ifndef)\s+(\w+)/` 中，`ifdefMatch[0]` 包含了前导空白和整个 `#ifdef name`。`indexOf(def.name)` 在 `ifdefMatch[0]` 中查找宏名，如果宏名恰好也是指令名的一部分（如 `#ifdef ifdef`），`indexOf` 会找到错误的位置（`ifdef` 出现在 `#ifdef` 中而非参数位）。实际场景中宏名与 `ifdef`/`ifndef` 重名的概率极低，且 `ifdefMatch[2]` 已经精确捕获了宏名，应直接使用其位置。
  - 建议改进:
    ```javascript
    // 利用 match 分组精确计算位置
    const fullLine = ifdefMatch[0];
    const nameStart = ifdefMatch.index + fullLine.lastIndexOf(ifdefMatch[2]);
    ```

## 总结

共审查 39 个 JavaScript 源码文件（9632 行），按正确性维度发现 5 个问题：

1. **1 个高严重度**：`variable-reference-provider.js` 中引用未定义变量 `root`，导致 Tcl 语言 Find All References 功能运行时崩溃。这是最需要立即修复的问题。
2. **3 个中严重度**：`tcl-funcall-semantic.js` 中字节偏移与字符偏移混用（多字节字符场景下语义 token 位置错位）；`scheme-parser.js` 中 Quote 后 EOF 的空指针异常；`scope-analyzer.js` 中缺少类型 guard（当前逻辑碰巧正确但脆弱）。
3. **1 个低严重度**：`pp-utils.js` 中宏名列位置计算的边界情况（实际影响极小）。

整体代码质量较高，逻辑严密。大部分文件（尤其是 snippets 数据模块、provider 基础设施、缓存层）逻辑正确，无边界遗漏或类型误用问题。
