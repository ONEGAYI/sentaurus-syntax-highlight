# 定义提示框显示改进设计

**日期**：2026-04-15
**状态**：已批准

## 问题

当前用户定义变量/函数的提示框（补全 + 悬停）存在两个问题：

1. **行末注释丢失**：`definitionText` 只截取到定义域结束（闭括号），不包含行末注释。
   ```scheme
   (define Lgate 0.01) ; length of gate
   ```
   当前只显示 `(define Lgate 0.01)`，用户看不到 `; length of gate`。

2. **无截断逻辑**：过长的定义行会把提示框撑得非常宽，影响使用体验。当前没有任何行宽限制。

## 设计

### 1. 解析层扩展 definitionText 包含行末注释

**方案**：在解析器生成 `definitionText` 时，将最后一行行末的注释追加进去。

#### Scheme 端（scheme-analyzer.js）

当前 `definitionText: listNode.text` 由 `scheme-parser.js` 的 `parseList()` 生成，截取 `text.slice(openTok.start, closeTok.end)`，即 `(` 到 `)` 之间的文本。

修改方式：
- `analyze()` 函数新增 `sourceText` 参数（完整源码字符串）
- 新增辅助函数 `extendToLineEnd(text, endOffset, sourceText)`：从 `endOffset` 开始向后查找直到 `\n` 或文本末尾，追加这部分内容
- 所有 `definitionText: listNode.text` 替换为 `definitionText: extendToLineEnd(listNode.text, listNode.end, sourceText)`

#### Tcl 端（tcl-ast-utils.js）

`node.text` 是 tree-sitter 节点文本，不包含行尾注释。修改方式：
- `getVariables()` 函数新增 `sourceText` 参数
- 新增辅助函数 `_extendNodeTextToLineEnd(nodeText, endRow, sourceText)`：根据 `endRow`（0-indexed）找到该行行尾，追加 `#` 或 `;#` 开头的行末注释
- 所有 `definitionText: node.text` 替换为 `definitionText: _extendNodeTextToLineEnd(node.text, ...)`

#### 调用方更新

`definitions.js` 的 `extractSchemeDefinitions(text)` 和 `extractTclDefinitionsAst(text)` 已持有 `text`，需传递给底层函数。

### 2. 截断工具函数

**位置**：`definitions.js`（与定义提取逻辑同文件，方便复用）

**函数签名**：
```javascript
/**
 * 截断定义文本中过长的行。
 * @param {string} text 定义文本
 * @param {number} maxWidth 每行最大字符数
 * @returns {string} 截断后的文本
 */
function truncateDefinitionText(text, maxWidth)
```

**逻辑**：
- 按 `\n` 分割为行
- 每行长度超过 `maxWidth` 时，截取前 `maxWidth - 1` 个字符并追加 `…`（U+2026）
- 不修改行数或结构，只截断超长行

### 3. 用户设置项

**位置**：`package.json` → `contributes.configuration`

```json
{
  "sentaurus.definitionMaxWidth": {
    "type": "number",
    "default": 60,
    "minimum": 20,
    "maximum": 200,
    "description": "用户定义变量/函数提示框中每行最大显示字符数"
  }
}
```

### 4. 显示层调用截断

**位置**：`extension.js`

两处调用点：
- 第 435 行（补全提示）：`item.documentation = new vscode.MarkdownString('```scheme\n' + truncateDefinitionText(d.definitionText, maxWidth) + '\n```');`
- 第 481 行（悬停提示）：`md.appendCodeblock(truncateDefinitionText(def.definitionText, maxWidth), langId);`

`maxWidth` 从 `vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60)` 获取。

## 影响范围

### 需修改的源码文件

| 文件 | 修改内容 |
|------|----------|
| `src/lsp/scheme-analyzer.js` | `analyze()` 新增 `sourceText` 参数，`definitionText` 扩展到行尾 |
| `src/lsp/tcl-ast-utils.js` | `getVariables()` 新增 `sourceText` 参数，`definitionText` 扩展到行尾 |
| `src/definitions.js` | 传递 `text` 给底层函数，新增 `truncateDefinitionText()` |
| `src/extension.js` | 补全和悬停显示调用截断函数，读取用户设置 |
| `package.json` | 新增 `sentaurus.definitionMaxWidth` 配置项 |

### 需更新的测试

| 测试文件 | 说明 |
|----------|------|
| `tests/test-scheme-parser.js` | `definitionText` 断言需包含行末注释 |
| `tests/test-definitions.js` | 同上 |
| `tests/test-tcl-ast-variables.js` | `definitionText` 精确匹配断言需更新 |

### 不受影响的功能

- 跳转定义（`DefinitionProvider`）：使用 `line`/`endLine` 字段，不依赖 `definitionText`
- 未定义/重复定义诊断：不使用 `definitionText`
- 代码折叠：不使用 `definitionText`
- 函数签名提示：不使用 `definitionText`
