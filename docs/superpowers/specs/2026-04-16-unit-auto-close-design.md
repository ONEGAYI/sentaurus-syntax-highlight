# SPROCESS Unit 自动配对设计

## 概述

为 SPROCESS（fps）语言添加编辑器行为：当紧邻 `constant.numeric` scope 的位置输入 `<` 时，自动补全 `>` 并将光标放在中间——`<$0>`。

## 需求

- **触发条件**：文档语言为 `sprocess`，用户输入单个 `<`，且 `<` 前一位置的 TextMate scope 包含 `constant.numeric`
- **行为**：在 `<` 之后自动插入 `>`，光标位于 `<>` 之间
- **适用范围**：仅 SPROCESS 语言，不影响其他 5 种 Tcl 工具

## 实现方案

### 方案选择

选择**代码监听方案**（vs 声明式 `autoClosingPairs` / CompletionItemProvider），原因：

1. `autoClosingPairs` 不支持上下文条件匹配，任何位置输入 `<` 都会触发，干扰 Tcl 比较运算
2. CompletionItemProvider 需要用户主动选择补全，体验不够自然
3. 代码监听可以精确使用 scope 判定，与语法高亮系统保持一致

### 新增文件

`src/lsp/providers/unit-auto-close-provider.js`

导出 `registerUnitAutoClose(context)` 函数。

### 核心逻辑

```
onDidChangeTextDocument 事件
  → 过滤：文档语言 == 'sprocess'
  → 遍历 contentChanges
    → 过滤：变更文本 == '<' 且为单字符插入
    → 获取 '<' 前一位置（offset - 1）的 token scope
    → scope 包含 'constant.numeric'?
      → 是：用 SnippetString '$0>' 插入到 '<' 之后
      → 否：跳过
```

### Snippet 插入方式

使用 `vscode.SnippetString`：

```javascript
const snippet = new vscode.SnippetString('$0>');
editor.insertSnippet(snippet, insertPosition);
```

这会：
1. 在 `<` 之后插入 `>`
2. 将光标放在 `<` 和 `>` 之间（`$0` 即最终光标位置）

### 注册方式

在 `extension.js` 的 `activate()` 函数中：

```javascript
if (doc.languageId === 'sprocess') {
  const { registerUnitAutoClose } = require('./lsp/providers/unit-auto-close-provider');
  registerUnitAutoClose(context);
}
```

使用 `context.subscriptions.push()` 管理生命周期，扩展停用时自动清理。

## 边界情况

| 场景 | 前一位置 scope | 是否触发 | 原因 |
|------|---------------|---------|------|
| `10<nm>` | `constant.numeric` | 是 | 典型用法 |
| `0.5<um>` | `constant.numeric` | 是 | 小数 |
| `1e15<cm-2>` | `constant.numeric` | 是 | 科学计数法 |
| `@energy@<keV>` | 非 `constant.numeric` | 否 | SWB 参数 |
| `if {$x < $y}` | 非 `constant.numeric` | 否 | Tcl 比较 |
| `"log10(<Field>)"` | 非 `constant.numeric` | 否 | 字符串内 |

## 测试

- 在 `display_test/test_fps.cmd` 中验证各种数字格式后的自动配对
- 验证非数字位置不触发
- 验证字符串/注释中不触发
