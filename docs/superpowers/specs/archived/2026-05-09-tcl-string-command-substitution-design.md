# Tcl 字符串内 [] 命令替换语法高亮

**日期**：2026-05-09
**状态**：Approved
**影响工具**：svisual、sdevice、sprocess、emw、inspect（5 个 Tcl 方言）

## 背景

在 Tcl 中，`[]` 是命令替换语法，即使在双引号字符串内部也会被解释器执行。例如：

```tcl
puts "PI=[format %.3f $PI]_test"
# 期望：[format %.3f $PI] 获得正常高亮，其余部分保持字符串颜色
```

当前所有 5 个 Tcl 语法文件的双引号字符串模式只处理了转义序列和变量替换，缺少 `[]` 命令替换支持。

## 设计

在双引号字符串模式的 `patterns` 数组中添加命令替换子模式，使用 `$self` 递归自引用实现完整的 Tcl 语法嵌套。

### 新增模式

```json
{
  "name": "meta.interpolation.tcl",
  "begin": "\\[",
  "end": "\\]",
  "captures": {
    "0": { "name": "punctuation.section.interpolation.tcl" }
  },
  "patterns": [
    { "include": "$self" }
  ]
}
```

### 模式排列顺序

字符串的 `patterns` 数组中，新增模式位于转义模式之后、变量替换之前：

1. `constant.character.escape` — `\[` 等转义序列优先匹配
2. **`meta.interpolation.tcl`** — `[]` 命令替换（新增）
3. `variable.other.readwrite` — `$var`/`${var}` 变量替换
4. `constant.character.format.placeholder` — `@...@` SWB 参数（sdevice/sprocess/emw/inspect）

### Scope 命名

| Scope | 用途 |
|-------|------|
| `meta.interpolation.tcl` | `[]` 包裹的整体区域 |
| `punctuation.section.interpolation.tcl` | `[` 和 `]` 括号本身 |

### 影响文件

| 文件 | 修改位置 |
|------|---------|
| `syntaxes/svisual.tmLanguage.json` | 顶层 patterns，字符串模式内 |
| `syntaxes/sdevice.tmLanguage.json` | repository `#strings` 内 |
| `syntaxes/sprocess.tmLanguage.json` | 顶层 patterns，字符串模式内 |
| `syntaxes/emw.tmLanguage.json` | 顶层 patterns，字符串模式内 |
| `syntaxes/inspect.tmLanguage.json` | 顶层 patterns，字符串模式内 |

### 不影响

- `syntaxes/sde.tmLanguage.json` — Scheme 方言，不使用 `[]` 命令替换

## 边界情况

- **嵌套 `[]`**：`[expr {[string length $x]}]` — `$self` 递归自动处理
- **转义 `\[`**：被已有的转义模式优先匹配，不触发命令替换
- **花括号字符串 `{}`**：无字符串模式定义，不进行替换（符合 Tcl 语义）
- **空 `[]`**：`set x []` — begin/end 正确匹配空命令替换

## 测试验证

在 `display_test/` 中创建测试文件，覆盖以下场景：

1. 基本命令替换：`puts "val=[expr 1+2]"`
2. 变量 + 命令替换混合：`puts "PI=[format %.3f $PI]_test"`
3. 嵌套命令替换：`set x "a=[expr {[string length $y]}]"`
4. 转义方括号：`puts "literal \[not cmd\]"`
5. 多个命令替换：`puts "a=[foo] b=[bar]"`
