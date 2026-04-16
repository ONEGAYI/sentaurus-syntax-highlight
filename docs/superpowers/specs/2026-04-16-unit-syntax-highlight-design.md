# SPROCESS `<Unit>` 语法高亮设计

**日期**: 2026-04-16
**状态**: 已批准

## 背景

Sentaurus SPROCESS 使用尖括号 `<Unit>` 语法为数值参数显式指定物理单位，例如：
```
line x location= 0.5<um> spacing= 50<nm>
init concentration= 1.0e15<cm-3> field= Boron
diffuse temperature= 900<C> time= 40<min>
implant energy= 30.00<keV> dose= 1.00e+14<cm-2> tilt= 7.00<degree>
```

当前扩展未对 `<Unit>` 进行语法高亮，尖括号和单位名称被视为普通文本。

## 范围

- **仅影响 SPROCESS**（`syntaxes/sprocess.tmLanguage.json`）
- 其他 4 种 Tcl 工具（SDEVICE、EMW、Inspect、Svisual）和 SDE（Scheme）不使用此语法，不做修改

## 设计决策

### 1. Scope 定义

- **Scope**: `support.constant.unit`
- **语义**: 支持库常量——物理单位
- **VSCode 回退链**: `support.constant.unit` → `support.constant` → `constant`
- **不加 `.sprocess` 后缀**: 单位是通用概念，其他扩展使用同一 scope 时可共享配色

### 2. TextMate 匹配规则

- **正则**: `<[A-Za-z][A-Za-z0-9_/*\-+.^]*>`
- **匹配单位**: `<nm>`, `<um>`, `<cm-3>`, `<C>`, `<keV>`, `<l/min>`, `<degree>` 等
- **防误匹配**:
  - `<` 后必须跟字母 → `<10>` (Tcl 比较) 不匹配
  - 字符串/注释内的 `<...>` 被 `string.quoted.double` / `comment.line` 先匹配（首匹配胜出）

### 3. 语法文件修改

- **文件**: `syntaxes/sprocess.tmLanguage.json`
- **位置**: patterns 数组中，`@Var@` 占位符规则之后、`constant.numeric` 之前
- **格式**: 单条 match 规则

### 4. 默认配色

- **机制**: `package.json` 的 `contributes.configurationDefaults` + `editor.tokenColorCustomizations`
- **主题通配符**: `[*Dark*]` 匹配暗色主题，`[*Light*]` 匹配亮色主题

| 主题类型 | 通配符 | 前景色 | 参考来源 |
|---|---|---|---|
| 暗色 | `[*Dark*]` | `#CE9178` | Dark+ 字符串色（暖橙） |
| 亮色 | `[*Light*]` | `#D73A49` | Light+ 关键字色（深红） |

用户可在设置中覆盖。

### 5. 测试文件

- **文件**: `display_test/testbench_fps.cmd`
- 在适当位置添加 `<Unit>` 语法示例，确保高亮效果可验证

## 不涉及

- SDEVICE / EMW / Inspect / Svisual / SDE 语法文件
- 补全或悬停功能（仅高亮）
