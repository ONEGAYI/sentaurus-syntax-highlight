# Sentaurus TCAD Syntax Highlighting

为 Synopsys Sentaurus TCAD 工具链提供语法高亮、自动补全的 VSCode 扩展。支持 SDE、SDEVICE、SPROCESS、EMW、INSPECT 五种工具的命令文件。

## 功能一览

| 功能 | 说明 |
|------|------|
| 语法高亮 | 关键字、函数、标签、常量、数值、变量等分色显示 |
| 自动补全 | 输入时弹出关键词建议，按类别排序和标注图标，**SDE API 函数附带参数说明**，**用户自定义变量实时补全** |
| 悬停提示 | 鼠标悬停在 SDE API 函数上显示函数签名、参数说明和示例代码；**用户变量显示定义文本** |
| 跳转定义 | **F12 / Ctrl+Click 跳转到用户自定义变量的定义行** |
| 注释识别 | `#`、`//` 通用注释；SDE 文件额外支持 `;`（Scheme 注释） |
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

### 效果展示

![效果展示](<assets/pics/vscode 插件效果演示 - 自动补全+语法高亮.png>)

#### 函数悬停提示与补全文档

覆盖全部 400 个 SDE KEYWORD1 API 函数（sdegeo、sde、sdedr、sdeicwb、sdepe、sdesnmesh、sdeio、sdeepi、sdesp），悬停时显示函数签名、参数说明和示例代码，补全列表附带详细文档。

![效果演示-语法文档](<assets/pics/vscode 插件效果演示 - 语法文档+汉化适配.png>)

## 安装

### VSIX 命令行安装（推荐离线环境）

从 [Releases](https://github.com/ONEGAYI/sentaurus-syntax-highlight/releases) 下载 `.vsix` 文件后：

```bash
# 安装 / 升级
code --install-extension sentaurus-tcad-syntax-0.4.0.vsix

# 卸载
code --uninstall-extension onegayi.sentaurus-tcad-syntax
```

> 在远程 SSH 环境中，请在远程机器上执行上述命令，或使用 VSCode 的 Extensions 面板手动安装。

### 手动安装

将扩展文件夹**重命名**为 `publisher.extension-name-version` 格式后复制到 VSCode 扩展目录，然后重启 VSCode：

```
sentaurus-syntax-highlight  →  onegayi.sentaurus-tcad-syntax-0.4.0
```

- Linux/macOS: `~/.vscode/extensions/onegayi.sentaurus-tcad-syntax-0.4.0`
- Windows: `%USERPROFILE%\.vscode\extensions\onegayi.sentaurus-tcad-syntax-0.4.0`

> VSCode 依赖此命名约定来识别扩展，名称不正确将导致扩展无法加载。

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

---

> 下面是原 README

This VSCode extension provides syntax highlighting for Synopsys Sentaurus TCAD files.

## Supported File Types

- **Sentaurus Structure Editor (SDE)**: `*_dvs.cmd` and `.scm` files
- **Sentaurus Device (SDEVICE)**: `*_des.cmd` files
- **Sentaurus Process (SPROCESS)**: `*_fps.cmd` and `.fps` files
- **Sentaurus EMW**: `*_eml.cmd` and `*_emw.cmd` files
- **Sentaurus Inspect**: `*_ins.cmd` files

## Features

- Syntax highlighting for commands, keywords, functions, and constants
- Proper bracket matching and indentation
- Comment highlighting

## Development

The syntax highlighting definitions were automatically generated from Sentaurus TCAD mode files using a custom Python script.

To regenerate the syntax files, run:

```bash
python scripts/extract_keywords.py
```

## Installation

1. Copy this folder to `~/.vscode/extensions/` (on Windows: `%USERPROFILE%\.vscode\extensions\`)
2. Restart VSCode
