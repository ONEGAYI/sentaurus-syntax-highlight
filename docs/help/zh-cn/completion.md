# 自动补全

输入代码时，扩展会自动分析当前上下文，为你推送合适的补全候选。按 `Tab` 或 `Enter` 即可插入。

---

## 关键词补全

扩展为 7 种语言各自维护了一份关键词库，数据来源于 Sentaurus 官方手册。输入时匹配到的关键词会按类别分组显示：

- **函数 / 命令** — 各工具的主要操作命令（如 SDE 的 `sdegeo:create-circle`、SDEVICE 的 `Solve`）
- **关键字** — 控制流、声明类关键词（如 `set`, `proc`, `if`）
- **标签 / 类** — 结构化声明（如 SDE 的 `Refdg`, SDEVICE 的 `Physics`）
- **字面量** — 材料名、常量值等（如 `Silicon`, `Oxide`）
- **数学函数** — Tcl `expr` 内置数学函数（如 `sqrt`, `sin`, `max`）

此外，所有语言共享一份 **材料名称表**（如 `4H-SiC`、`AlGaAs`、`GaN` 等），SDE 之外的语言还共享 **Tcl expr 数学函数**。

---

## 函数文档悬停

将鼠标悬停在任何已收录的函数名或关键词上，会弹出格式化的文档卡片，包含：

- 函数签名
- 功能描述
- 参数列表（名称、类型、说明）
- 示例代码

当前文档覆盖范围：

| 语言 | 文档数 | 说明 |
|------|--------|------|
| SDE | 565 | SDE Scheme API 函数 |
| Scheme 内置 | 191 | R5RS/R7RS 标准库函数 |
| SDEVICE | 2123 | SDEVICE 命令和关键词 |
| Svisual | 257 | Svisual 绘图命令 |
| Tcl 核心命令 | 66 | `set`, `if`, `foreach` 等 |
| Tcl 数学函数 | 31 | `expr` 可用的数学函数 |
| Tcl 子命令 | 83 | `string`/`file`/`info`/`array`/`dict` 的子命令 |

文档优先加载中文版本（如可用），否则回退到英文版本。

---

## 用户变量补全与跳转

扩展会自动扫描当前文件中的所有变量定义——包括 `set`、`proc` 参数、`define`、`lambda` 绑定，以及 `#define` 预处理宏。这些定义会混入补全列表，带有 `User Variable`、`User Function` 或 `#define` 标记。

### 悬停预览

鼠标悬停到变量引用处，会显示定义处的代码片段，并标注定义所在行号。如果代码行较长，会按 `sentaurus.definitionMaxWidth`（默认 60 字符）自动截断，并在末尾追加省略标记。

### 跳转到定义

在变量名上按 `F12`（或右键 → "Go to Definition"），光标跳转到该变量的定义位置。SDE 语言还支持词法作用域感知——只会跳转到当前作用域内可见的定义。

---

## SDE 专属功能

### 函数签名提示

在 SDE 文件中输入函数调用时，按 `Ctrl+Shift+Space` 触发**签名提示**（Signature Help）。扩展会根据函数文档中的参数签名列表，逐个高亮当前正在填写的参数，帮助你正确传递参数。

### Region / Material / Contact 符号补全

SDE 中许多函数（如 `sdegeo:define-contact-set`、`(sdepe:append-proxy)`）需要传入 Region 名称、Material 名称或 Contact 名称作为参数。扩展会在这些位置自动检测参数类型，提供已定义符号的补全。例如：

```scheme
(sdegeo:define-contact-set "gate" 4.0 (color:rgb 1 0 0) "<cursor>")
```

此时补全列表会自动过滤出当前文件中已定义的 Contact 名称。

---

## SDEVICE 专属功能

### Section 上下文感知补全

SDEVICE 命令文件由嵌套的 `{}` section 组成。扩展会实时追踪光标所在的 section 嵌套栈，在悬停时**优先匹配当前 section 的参数文档**。例如：

```
Physics {
  Mobility {
    DopingDependence <cursor>
  }
}
```

悬停到 `DopingDependence` 时，扩展会显示它在 `Physics > Mobility` section 上下文中的说明，而不是其他 section 中的同名关键词。

### 矢量关键词后缀补全

在 `Plot` 或 `CurrentPlot` section 中，输入矢量基础关键词后按 `/`，扩展会弹出可用后缀列表。例如输入 `eDensity/` 后补全 `X`、`Y`、`Magnitude` 等方向后缀。

---

## SDEVICE PAR 专属功能

`.par` 参数文件采用 **scope → block → parameter** 三级结构。扩展根据光标所在位置推断当前补全层级：

| 位置 | 补全内容 | 示例 |
|------|----------|------|
| 文件顶层 | scope 类型 + 名称 | `Material = "Silicon" { ... }` |
| scope 内 | block 名称 | `Bandgap { ... }` |
| block 内 | 参数名 | `Eg0 = 1.12` |
| scope 名称引号内 | 已有同类型 scope 名称 | 快速复用已定义的 Region/Material 名 |

补全来源按优先级排列：当前文件 > include 文件 > workspace 扫描 > MaterialDB > 内置占位。同名符号只保留最高优先级。

---

## Tcl 子命令补全

在 5 个常用 Tcl 命令之后输入空格，扩展会自动触发子命令补全：

- `string` — `length`, `range`, `replace`, `trim`, `tolower`, ...
- `file` — `exists`, `dirname`, `extension`, `join`, ...
- `info` — `exists`, `level`, `commands`, `body`, ...
- `array` — `exists`, `get`, `set`, `names`, `size`, ...
- `dict` — `get`, `set`, `exists`, `keys`, `values`, ...

悬停到已输入的子命令上同样会显示对应的文档卡片。

---

## SWB 环境变量

通过 `sentaurus.environmentVariables` 配置项，可以声明一组 **SWB 环境变量白名单**。白名单中的变量会获得：

- **补全** — 输入 `$` 时出现，带有 `🏠 环境变量` 标记
- **悬停** — 鼠标悬停显示配置中填写的文档说明
- **诊断豁免** — 不会触发"未定义变量"警告
- **语义着色** — 使用加粗渲染以区分普通变量

配置方法：在 VSCode 设置中搜索 `sentaurus.environmentVariables`，或使用命令面板中的管理命令（添加 / 删除 / 导入 / 导出）。

---

## 触发方式总结

| 触发器 | 效果 |
|--------|------|
| 直接输入 | 关键词、函数名、用户变量、材料名等 |
| `"` (SDE) | Region / Material / Contact 符号补全 |
| ` ` (空格) | Tcl 子命令补全（string/file/info/array/dict 后） |
| `/` (SDEVICE) | 矢量关键词后缀补全 |
| `$` (Tcl) | 环境变量补全 |
| 鼠标悬停 | 文档卡片 |
| `F12` | 跳转到定义 |
| `Ctrl+Shift+Space` (SDE) | 函数签名提示 |
