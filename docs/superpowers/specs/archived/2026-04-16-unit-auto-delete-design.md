# SPROCESS Unit 空尖括号删除配对设计

## 概述

在已有的 Unit 自动补全（输入 `<` 自动插入 `>`）基础上，实现对称的删除配对行为：当光标在空的 `Numeric<|>` 中间时，按退格删除 `<` 应连带删除 `>`。

## 触发条件

全部满足时触发：

1. **删除操作**：`change.text === ''` 且 `change.rangeLength === 1`（用户按退格删除了 1 个字符）
2. **空括号**：光标后面紧跟着 `>` 字符
3. **数字前置**：被删除字符前的行文本匹配 `constant.numeric` 正则（与自动补全相同）
4. **语言限制**：仅 `sprocess` 语言生效

## 正则模式

与 `sprocess.tmLanguage.json` 中 `constant.numeric` 一致：

```
/\b(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/
```

## 实现方案

### 方案选择：扩展现有 Provider

在 `unit-auto-close-provider.js` 的 `onDocumentChange` 中增加删除检测分支，复用 `_applying` 防重入标志和 `constant.numeric` 正则。

### 判定逻辑

被删除字符为 `<` 的判定：`onDidChangeTextDocument` 触发时 `<` 已被删除，`change.range` 标识删除位置。此时 `linePrefix`（删除位置到行首的文本）自然就是 `<` 之前的内容——即数字部分。直接对 `linePrefix` 运行与自动补全相同的正则即可。

### 删除 `>` 的方式

使用 `editor.edit(builder => builder.delete(range))` 删除多余的 `>`，用 `_applying` 标志防止重入触发。

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/lsp/providers/unit-auto-close-logic.js` | 修改 | 新增 `shouldDelete(change, linePrefix, charAfter)` 纯函数 |
| `src/lsp/providers/unit-auto-close-provider.js` | 修改 | 在 `onDocumentChange` 中增加删除检测分支 |
| `tests/test-unit-auto-close.js` | 修改 | 新增删除配对的测试用例 |

## 测试用例

### 应触发

- `10<|>` → 退格 → `10`（整数）
- `0.5<|>` → 退格 → `0.5`（小数）
- `1e15<|>` → 退格 → `1e15`（科学计数法）
- `900<|>` → 退格 → `900`（整数）

### 不触发

- `10<nm|>` → 退格 → `10<nm`（括号非空）
- `Var1<|>` → 退格 → `Var1`（非数字前置）
- `x2<|>` → 退格 → `x2`（变量名的一部分）
- `"text<|>"` → 退格 → `"text<"`（字符串内）

## 设计决策

1. **为什么不放在 `language-configuration.json`**：`autoClosingPairs` 会影响所有 5 种 Tcl 语言，无法限定为仅 SPROCESS；`surroundingPairs` 不控制删除行为。
2. **为什么复用 `_applying` 标志**：`editor.edit()` 也会触发 `onDidChangeTextDocument`，需要与自动补全共享防重入逻辑。
3. **为什么用纯函数测试**：与自动补全相同的架构决策——将判定逻辑提取为无 `vscode` 依赖的纯函数，可直接在 Node.js 中运行测试。
