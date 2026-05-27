# 语法高亮

扩展为 7 种 Sentaurus TCAD 工具语言提供开箱即用的语法高亮。打开文件后，编辑器会根据文件名自动识别语言并激活对应的高亮规则——你不需要手动选择语言模式。

## 支持的语言

| 语言 | 工具 | 文件匹配规则 | 方言 |
|------|------|-------------|------|
| SDE | Structure Editor | `*_dvs.cmd`、`.scm` | Scheme |
| SDEVICE | Device Simulator | `*_des.cmd` | Tcl |
| SPROCESS | Process Simulator | `*_fps.cmd`、`.fps` | Tcl |
| EMW | EM Wave | `*_eml.cmd`、`*_emw.cmd` | Tcl |
| Inspect | Inspect | `*_ins.cmd` | Tcl |
| Svisual | Sentaurus Visual | `*_vis.tcl` | Tcl |
| SDEVICE PAR | Device Material DB | `*.par` | Tcl-like |

大部分工具共用 `.cmd` 扩展名，扩展通过文件名中的**模式关键字**（如 `_des`、`_fps`、`_ins`）来区分它们，而非依赖扩展名。

## 高亮覆盖范围

语法高亮覆盖以下元素：

### 注释

SDE（Scheme 方言）使用分号作为行注释符，其余 6 种 Tcl 方言使用 `#`。此外，SPROCESS、EMW、Inspect、Svisual 等 Tcl 工具还额外支持 `*` 开头的行注释——这是 Sentaurus 工具链中的常见写法。

```scheme
; SDE 注释 — 分号开头
(sdegeo:create-rectangle ...)
```

```tcl
# Tcl 注释 — 井号开头
* 这也是合法注释 — 星号开头（部分 Tcl 工具）
Physics { ... }
```

### 关键词

每种语言的关键词按照语义分为多个层级，通过不同颜色加以区分：

| 层级 | 含义 | 颜色（Dark+ 主题） | 典型示例 |
|------|------|-------------------|---------|
| 控制流关键词 | 流程控制命令 | 蓝色 | `if`、`for`、`foreach`、`while`、`return` |
| 一级关键词 | 工具核心命令 | 蓝色 | `Physics`、`Solve`、`deposit`、`etch` |
| 二级关键词 | 命令选项与参数 | 白色（默认前景） | 工艺参数选项 |
| 三级关键词 | 参数值 / 枚举值 | 蓝色 | 材料属性、物理模型参数 |
| 四级关键词 | 命名空间函数 | 青绿色 | `pdb*`、`rfx::`、`const::` |
| 函数 | 工具专用函数 + Tcl 内置命令 | 黄色 | `set`、`puts`、`create_plot` |
| Scheme 函数 | SDE API 命令（401 个） | 黄色 | `sdegeo:create-rectangle`、`sde:build-mesh` |
| 材料名 | 材料标识符（SDE，1974 个） | 青绿色 | `"Silicon"`、`"Oxide"`、`"GaAs"` |

> **提示**：以上颜色基于 VSCode 内置的 Dark+ 主题。如果你使用其他主题（Monokai、One Dark Pro 等），颜色可能会有所不同，但层级区分仍然有效。

### 字符串与数值

双引号字符串以橙色渲染，数值字面量（包括科学记数法如 `1e-6`、`3.14e10`）以浅绿色渲染。SPROCESS 还额外为物理单位符号（如 `<cm>`、`<um>`）提供了浅绿色高亮。

### SWB 环境变量

Sentaurus Workbench (SWB) 使用 `@变量名@` 格式传递参数。扩展将这些参数以浅蓝色高亮，使它们在代码中一目了然：

```tcl
set base_doping @doping@
set width @width@
```

### 预处理器指令

Sentaurus 工具链支持 C 风格的预处理器指令，扩展会高亮以下指令及其内容：

```tcl
#define MY_VALUE 1.0
#ifdef @Simulation@
  Physics { ... }
#else
  Math { ... }
#endif
```

`#define` 定义的宏名称同样会以蓝色高亮，整个预处理器块（`#ifdef` ... `#endif`）也会被正确识别。

### Tcl 子命令

5 种 Tcl 方言都支持 `string`、`file`、`info`、`array`、`dict` 五个主命令的子命令上下文高亮。当你写 `string length` 时，主命令和子命令都会被正确着色：

```tcl
string length "hello"     ; length 作为子命令被高亮
file exists "/tmp/data"   ; exists 作为子命令被高亮
info exists myvar          ; exists 作为子命令被高亮
```

## SDEVICE 语义着色

SDEVICE 拥有一套额外的语义着色系统，通过跟踪 `{}` 嵌套层级来理解当前代码所在的上下文：

| Token 类型 | 含义 | 说明 |
|-----------|------|------|
| Section 名 | 顶层 section 名称 | 如 `Physics`、`Math`、`Solve`、`System` |
| SubSection 名 | 子 section 标识 | 如 `QuasiStationary`、`Coupled`、`Transient` |
| Section 关键词 | section 内的专属参数 | 同一关键词在不同 section 中可能呈现不同语义 |

这意味着在 `Physics { Recombination { ... } }` 中，`Physics`、`Recombination` 和它们各自的内部参数会以不同的语义 token 标记，帮助你在视觉上区分嵌套结构。

> **注意**：语义 Token 在 Dark+ 主题下默认回退到编辑器前景色（即不会额外着色）。如果你希望看到区分效果，可以在 `settings.json` 中通过 `editor.semanticTokenColorCustomizations` 自定义颜色。

## 代码折叠

所有 7 种语言都支持代码折叠功能，你可以通过行号旁的折叠箭头或快捷键收起代码块：

- **SDE**：基于 Scheme 括号 `( ... )` 层级折叠
- **Tcl 工具**：基于 `{ ... }` 花括号层级折叠
- **预处理器块**：`#ifdef` ... `#endif` 之间的代码可以作为一个块折叠
- **SDEVICE**：顶层 section（如 `Physics { ... }`）可以作为独立块折叠

## 括号平衡诊断

扩展会实时检查括号的匹配情况，并在发现不平衡时给出提示：

- **SDE**：检查圆括号 `()` 的平衡
- **Tcl 工具**：检查花括号 `{}` 的平衡
- **诊断信息**会在 Problems 面板中显示，编辑器中也会以波浪线标注问题位置
