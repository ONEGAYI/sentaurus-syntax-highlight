# Sentaurus TCAD Syntax Highlighting

[English](README.en.md)

为 Synopsys Sentaurus TCAD 工具链提供语法高亮、自动补全和语义功能的 VSCode 扩展。支持 SDE、SDEVICE、SPROCESS、EMW、INSPECT、SVISUAL 六种工具的命令文件。

## 功能一览

### 核心编辑

| 功能 | 说明 |
|------|------|
| 语法高亮 | 关键字、函数、标签、常量、数值、变量等分色显示 |
| 自动补全 | 输入时弹出关键词建议，按类别排序和标注图标，**函数/命令附带参数说明**，**用户自定义变量实时补全** |
| 悬停提示 | 鼠标悬停在函数/命令上显示签名、参数说明和示例代码；**用户变量显示定义文本** |
| 跳转定义 | **F12 / Ctrl+Click 跳转到用户自定义变量的定义行**（作用域感知，同名变量精确定位） |
| 查找引用 | **Shift+F12 查找用户自定义变量的所有引用位置**（Scheme + Tcl 双语言，作用域感知过滤） |

### 语义功能

| 功能 | 说明 |
|------|------|
| 面包屑导航 | Tcl 语言（SDEVICE/SPROCESS/EMW/INSPECT/SVISUAL）根据 section 关键词和命令块自动生成面包屑路径 |
| 代码折叠 | SDE 的 `define`/`let`/`lambda` 等 S-expression；Tcl 语言的 `braced_word` 命令块 |
| 括号诊断 | SDE 检测不匹配的圆括号；Tcl 语言检测花括号平衡并标红 |

### 辅助功能

| 功能 | 说明 |
|------|------|
| 表达式转换 | **Scheme 前缀 ↔ 中缀双向转换**，命令面板调用，支持选中文本直接替换或输入框转换 |
| 代码片段 | **QuickPick 可视化菜单**（`Ctrl+Shift+P` → `Sentaurus: Insert Snippet`）按工具分类浏览和插入代码模板；**传统前缀+Tab 代码片段**按语言隔离 |
| 注释识别 | `#` 通用注释；SDE 额外支持 `;`（Scheme 注释）；SDevice/EMW/SProcess/Inspect 额外支持 `*` |
| SWB 变量 | 高亮 `@Var@`、`@param:+2@` 等 Sentaurus Workbench 参数替换语法 |
| 括号匹配 | `{}` `[]` `()` 自动配对 |

### 支持的文件类型

| 工具 | 文件模式 |
|------|----------|
| Sentaurus Structure Editor (SDE) | `*_dvs.cmd`、`.scm` |
| Sentaurus Device (SDEVICE) | `*_des.cmd` |
| Sentaurus Process (SPROCESS) | `*_fps.cmd`、`.fps` |
| Sentaurus EMW | `*_eml.cmd`、`*_emw.cmd` |
| Sentaurus Inspect | `*_ins.cmd` |
| Sentaurus Visual (SVISUAL) | `*_vis.cmd` |

### 效果展示

![效果展示](assets/pics/vscode%20插件效果演示%20-%20自动补全+语法高亮.png)

#### 函数悬停提示与补全文档

提供中英文双语悬停文档，根据 VSCode 语言环境自动切换：

| 语言 | 文档覆盖 | 数量 |
|------|----------|------|
| **SDE** | KEYWORD1 API 函数（sdegeo、sde、sdedr、sdeicwb、sdepe、sdesnmesh、sdeio、sdeepi、sdesp） | 405 个 |
| **SDE** | Scheme R5RS 内置函数（`define`、`let`、`lambda`、`map` 等） | 191 个 |
| **SDEVICE** | KEYWORD1+KEYWORD2+KEYWORD3 命令（Physics、Solve、Plot、Math、System 等） | 341 个 |
| **SVISUAL** | KEYWORD1 顶层命令 + KEYWORD4 命名空间函数 | 257 个 |
| SPROCESS / INSPECT / EMW | 关键词自动补全（无悬停文档） | — |

悬停时显示函数签名、参数说明和示例代码，补全列表附带详细文档。

![效果演示-语法文档](assets/pics/vscode%20插件效果演示%20-%20语法文档+汉化适配.png)

### 表达式转换（Scheme ↔ Infix）

SDE 使用 Scheme 前缀表达式编写运算，括号嵌套容易出错。本扩展提供**前缀 ↔ 中缀双向转换**，在命令面板中调用：

#### 命令

| 命令 | 功能 |
|------|------|
| `Sentaurus: Scheme → Infix` | 将 Scheme 前缀表达式转换为中缀/函数调用格式 |
| `Sentaurus: Infix → Scheme` | 将中缀/函数调用表达式转换为 Scheme 前缀格式 |
| `Sentaurus: Expression Help` | 查看支持的运算符和函数列表 |

![表达式格式转换](assets/pics/vscode%20插件效果演示%20-%20表达式格式转换.gif)

#### 使用方式

**选中文本直接转换：** 在编辑器中选中 Scheme 表达式，执行命令后选区内容被替换（支持 Ctrl+Z 撤销）。

**输入框转换：** 无选区时弹出输入框，输入表达式后结果插入到光标处并自动全选。支持上下箭头浏览历史记录（会话内保留最近 20 条）。

#### 转换示例

| Scheme 前缀 | 中缀 / 函数调用 |
|-------------|----------------|
| `(+ 1 2)` | `1 + 2` |
| `(* (+ a b) c)` | `(a + b) * c` |
| `(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)` | `(W / 2 + Lgate / 2 + Wspacer) / -2` |
| `(expt a 2)` | `a ^ b` |
| `(sin x)` | `sin(x)` |
| `(min a b c)` | `min(a, b, c)` |

#### 支持的运算符和函数

- **算术运算符**：`+`、`-`、`*`、`/`
- **特殊运算符**：`^`（幂）、`%`（取模）、`%%`（取余）、`//`（取整商）
- **数学函数**：`sin`、`cos`、`tan`、`asin`、`acos`、`atan`、`sqrt`、`abs`、`exp`、`log`
- **取整函数**：`floor`、`ceil`、`round`
- **聚合函数**：`min`、`max`

执行 `Sentaurus: Expression Help` 可查看完整的运算符列表和示例。

### 代码片段（Snippets）

#### QuickPick 可视化菜单

通过命令面板浏览和插入代码模板：

1. `Ctrl+Shift+P`（macOS: `Cmd+Shift+P`）打开命令面板
2. 输入 `Sentaurus: Insert Snippet` 并回车
3. 选择工具分类（如 `Sentaurus-StructEditor`）
4. 选择子分类（如 `Contact`、`Doping`、`Meshing`）
5. 选择具体模板插入，支持 Tab 键跳转占位符

各层均支持 `← Back` 返回上一级，按 `Esc` 退出。

当前覆盖 5 种工具共 85 个模板：

| 工具 | 分类 | 模板数 |
|------|------|--------|
| SDE (StructEditor) | Contact、Doping、Meshing | 11 |
| SDEVICE | CurrentPlot、Electrode、File、Math、Physics、Plot、Solve、System | 43 |
| SPROCESS | Deposit、Diffuse、Etch、Implant、ICWB、Init、Mask、Photo、MeshGoals、RefineBox、Struct | 25 |
| INSPECT | Curve、Extract | 8 |
| Mesh (EMW) | EMW | 2 |

![QuickPick-代码片段选单](assets/pics/vscode%20插件效果演示%20-%20QuickPick%20代码片段选单.gif)

#### 传统前缀+Tab 代码片段

插件注册了各语言的 snippet 文件，用户可通过以下方式自定义：

1. `Ctrl+Shift+P` → `Preferences: Configure User Snippets`
2. 选择对应语言（如 `sde`、`sdevice`、`sprocess`、`emw`、`inspect`）
3. 在打开的 JSON 文件中添加自定义片段

> 多种语言共用 `.cmd` 扩展名，但 VSCode 根据 `filenamePatterns` 将文件关联到不同的 language ID，snippets 自动按 language ID 隔离，不会冲突。

## 安装

### VSCode 市场安装（推荐）

在 VSCode 扩展面板中搜索 **Sentaurus TCAD Syntax** 直接安装，或访问 [Marketplace 页面](https://marketplace.visualstudio.com/items?itemName=onegayi.sentaurus-tcad-syntax)。

### VSIX 命令行安装（离线环境）

从 [Releases](https://github.com/ONEGAYI/sentaurus-syntax-highlight/releases) 下载 `.vsix` 文件后：

```bash
# 安装 / 升级
code --install-extension sentaurus-tcad-syntax-x.x.x.vsix

# 卸载
code --uninstall-extension onegayi.sentaurus-tcad-syntax
```

> 在远程 SSH 环境中，请在远程机器上执行上述命令，或使用 VSCode 的 Extensions 面板手动安装。

### 手动安装

将扩展文件夹**重命名**为 `publisher.extension-name-version` 格式后复制到 VSCode 扩展目录，然后重启 VSCode：

```
sentaurus-syntax-highlight  →  onegayi.sentaurus-tcad-syntax-x.x.x
```

- Linux/macOS: `~/.vscode/extensions/onegayi.sentaurus-tcad-syntax-x.x.x`
- Windows: `%USERPROFILE%\.vscode\extensions\onegayi.sentaurus-tcad-syntax-x.x.x`

> VSCode 依赖此命名约定来识别扩展，名称不正确将导致扩展无法加载。

## 便于使用的技巧

### 更改 Sentaurus 的默认编辑器

Sentaurus 默认使用 Jedit 作为代码编辑器，要将其更改为 **VS Code** 非常容易：

1. 打开 Sentaurus Workbench
2. 按 **F12**，或菜单 **Edit** > **User Preferences**（有些版本是 **Edit** > **Preferences**）
3. 记得选择 `User` 范围设置（如果不行再尝试 `Global`）
4. 在 Preferences 对话框中展开 `Binaries`（旧版可能是 `Utilities`）
5. 找到 `Editor` 项双击
6. 将值改为 **VS Code** 的路径，例如：`/usr/bin/code`
7. 点击 **Apply** 保存

---

获取 **VS Code** 路径的方式:

```bash
which code
```

## 致谢

本项目的关键词提取脚本和 TextMate 语法基础参考了 [jackyu-b/sentaurus-syntax-highlight](https://github.com/jackyu-b/sentaurus-syntax-highlight.git)，在此表示感谢。

## 开发

语法文件通过 Python 脚本从 Sentaurus TCAD 的 jEdit XML mode 文件自动生成：

```bash
python scripts/extract_keywords.py
```

打包扩展：

```bash
npm install -g @vscode/vsce
vsce package
```
