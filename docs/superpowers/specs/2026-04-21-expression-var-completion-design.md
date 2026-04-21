# 表达式转换命令用户变量补全

## 目标

在 SDE 文件中使用表达式转换命令（`sentaurus.scheme2infix` / `sentaurus.infix2scheme`）输入新表达式时，QuickPick 输入框下方实时显示当前文件的用户定义变量，选中可替换正在输入的最后一个词。

## 范围

- 仅 SDE（Scheme）文件激活变量补全
- 仅在无选中文本、需要手动输入表达式时生效
- 有选中文本直接转换的路径不受影响

## 设计

### 输入流程重构

将 `registerConvertCommand`（`src/extension.js:663`）中无选中文本的输入路径从 `showInputBox` / `showQuickPick` 统一替换为 `createQuickPick`：

**默认模式（变量优先）**：

```
┌─ QuickPick 输入框 ───────────────────────┐
│ W + Wid█                                 │  ← 用户自由输入
├──────────────────────────────────────────┤
│ 用户变量                    (Separator)   │
│   Width  (variable, 第12行)              │  ← 匹配 "Wid" 的变量
│   WidgetHeight (variable, 第18行)        │
│ 最近使用 — 输入 ! 进入历史模式 (Separator)│
│   (+ (/ W 2) (/ L 2))                    │  ← 历史记录（模糊匹配）
└──────────────────────────────────────────┘
```

**历史模式（`!` 前缀触发）**：

```
┌─ QuickPick 输入框 ───────────────────────┐
│ ! W + L                                  │  ← "!" + 空格 + 过滤文本
├──────────────────────────────────────────┤
│ 历史记录                    (Separator)   │
│   #1  W + L * 2                          │  ← 模糊匹配 "W + L"
│   #3  (W + L) / 2                        │
└──────────────────────────────────────────┘
```

```
┌─ QuickPick 输入框 ───────────────────────┐
│ !3                                       │  ← "!数字" 直接跳转
├──────────────────────────────────────────┤
│ 历史记录                    (Separator)   │
│   #1  W + L * 2                          │  ← 只显示 #3
│   #3  (W + L) / 2                        │
└──────────────────────────────────────────┘
```

### `!` 历史模式

输入以 `!` 开头时进入历史模式，隐藏所有变量项，只显示历史记录：

| 输入 | 行为 |
|------|------|
| `!` | 显示全部历史记录 |
| `!3` | 显示 `#3` 对应的历史项（精确匹配序号） |
| `! W + L` | `!` 后接空格，用剩余文本模糊过滤历史记录 |
| `!3W + L` | 不合法（无空格分隔），按模糊匹配处理 |

历史记录序号规则：
- 编号 `#1` = 最近使用，`#2` = 次近，依此类推
- 最大 20 条（复用现有 `history` 数组上限）
- 序号显示为 item 的 `description`：`#1`、`#2`、...

### 最后一个词提取

正则 `/(?:^|[\s+\-*/%^(),])([a-zA-Z_@][a-zA-Z0-9_@]*)$/` 提取当前正在输入的标识符前缀。词边界定义与 `expression-converter.js` 的 `tokenizeInfix` IDENT 规则一致。

### 变量过滤与分组

数据源：`defs.getDefinitions(editor.document, 'sde')`，仅在 `languageId === 'sde'` 时调用。

**默认模式** Items 分三组按此顺序排列：
1. **用户变量** — `kind === 'variable'`，前缀匹配最后一个词
2. **函数参数** — `kind === 'parameter'`，前缀匹配最后一个词（较低优先级）
3. **历史记录** — 模糊匹配整个 `value`

`kind === 'function'` 不显示。

**历史模式**（`!` 前缀）：
- 只有历史记录一组
- 按 `!` 后的文本过滤

### 选中变量替换

选中变量时，替换 `quickPick.value` 中的最后一个词：

```js
function replaceLastWord(value, replacement) {
    const match = value.match(/([a-zA-Z_@][a-zA-Z0-9_@]*)$/);
    if (match) {
        return value.slice(0, match.index) + replacement;
    }
    return value + replacement;
}
```

用 `_updatingValue` 标志位防止 `onDidChangeValue` 在程序更新 `value` 时重复触发过滤。

### 确认逻辑

- **Enter，无选中项** — 取 `value` 作为完整表达式进行转换（`!` 模式下取 `!` 后的部分）
- **Enter，有选中变量项** — 替换最后一个词，QuickPick 保持打开继续输入
- **Enter，有选中历史项** — 使用历史项的值进行转换

### 非 SDE 文件

Items 只有历史记录（无变量分隔符），但 `!` 历史模式仍可用。

### 文档更新

**`sentaurus.exprHelp` 命令**：在 QuickPick 底部增加一条说明项：

```
label: '$(info) 变量补全与历史模式'
detail: 'SDE 文件中自动显示用户变量 | 输入 ! 进入历史模式 | !3 直接选 #3 | ! 文本 过滤历史'
```

**历史分隔符行**：`最近使用 — 输入 ! 进入历史模式`

## 改动文件

- `src/extension.js` — `registerConvertCommand` 函数重写输入路径 + `exprHelp` 增加说明项

## 测试

在 `tests/` 中添加测试验证：
- `replaceLastWord` 的边界情况（空值、无匹配、多个运算符）
- 最后一个词提取正则的正确性
- `!` 历史模式解析逻辑（`!`、`!3`、`! text`）
