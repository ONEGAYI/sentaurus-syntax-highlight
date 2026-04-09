# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供上下文指引。

## 项目概述

为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全的 VSCode 扩展。由 **TextMate 语法**（声明式 JSON）负责高亮，**纯 JavaScript 模块**（`src/extension.js`）负责关键词自动补全——无 TypeScript、无构建步骤、无原生依赖。

仓库：https://github.com/ONEGAYI/sentaurus-syntax-highlight
参考：https://github.com/jackyu-b/sentaurus-syntax-highlight

## 开发命令

- **从 Sentaurus XML mode 文件重新生成语法文件**：
  ```bash
  python scripts/extract_keywords.py
  ```
  注意：脚本中输入/输出路径是硬编码的（`d:\pydemo\modes` 和 `d:\pydemo\sentaurus-tcad-syntax\syntaxes`），运行前需修改 `main()` 中的路径。

- **测试扩展**：使用 VSCode 的 "Extension Development Host" 启动配置（从 `.vscode/launch.json` 按 F5）

- **打包扩展**：
  ```bash
  vsce package
  ```
  在项目根目录生成 `sentaurus-tcad-syntax-<version>.vsix`。

## 架构

### 语言注册（`package.json`）

注册了 5 种语言，每种对应一个 TextMate 语法：

| Language ID | Sentaurus 工具 | 文件模式 |
|-------------|---------------|----------|
| `sde` | Structure Editor | `*_dvs.cmd`, `.scm` |
| `sdevice` | Device Simulator | `*_des.cmd` |
| `sprocess` | Process Simulator | `*_fps.cmd`, `.fps` |
| `emw` | EM Wave | `*_eml.cmd`, `*_emw.cmd` |
| `inspect` | Inspect | `*_ins.cmd` |

所有语言共用 `language-configuration.json`（行注释 `#`，括号匹配 `{}` `[]` `()`）。

### 自动补全（`src/extension.js`）

纯 CommonJS 模块，在任一语言激活时加载。启动时读取 `syntaxes/all_keywords.json`，为每种语言注册 `CompletionItemProvider`。关键词按类别分配图标（关键字/函数/常量/类/结构体）并按类别优先级排序。

零原生依赖——运行在 VSCode Server 自带的 Node.js 上，兼容 GLIBC 2.17（CentOS 7）。

### 关键词提取流程

1. `scripts/extract_keywords.py` 读取包含 `<KEYWORD1>`..`<KEYWORD4>`、`<LITERAL1>`..`<LITERAL3>`、`<FUNCTION>` 标签的 XML mode 文件
2. 提取关键词到 `syntaxes/all_keywords.json`（参考/中间文件，同时供自动补全使用）
3. 生成各模块的 `syntaxes/<module>.tmLanguage.json` 文件

### TextMate Scope 映射

脚本将 XML 标签类型映射为 TextMate scope：
- KEYWORD1 → `keyword.control`，KEYWORD2 → `keyword.other`，KEYWORD3 → `entity.name.tag`，KEYWORD4 → `support.class`
- LITERAL1 → `constant.numeric`，LITERAL2 → `constant.numeric`，LITERAL3 → `string.quoted`
- FUNCTION → `entity.name.function`

### 高亮模式（每个语法文件）

每个生成的语法文件按顺序包含：
1. 注释模式：`#`、`//`（所有语言）；`;`（仅 SDE，Scheme 惯例）
2. 双引号字符串模式（含转义处理）
3. 数值字面量模式（`constant.numeric`）——整数、浮点数、科学计数法
4. `@Var@` SWB 参数替换模式（`variable.parameter`）——如 `@previous@`、`@param:+2@`
5. 兜底标识符模式（`variable.other`）——必须放在最后（首匹配胜出规则）

## 关键约束

- 多种语言共用 `.cmd` 扩展名——文件关联完全依赖 `filenamePatterns`，而非 `extensions`
- 提取脚本中的路径是硬编码的，跨环境使用前必须修改
- `*.Identifier` 文件已被 gitignore
- TextMate 语法模式遵循首匹配胜出规则——兜底模式必须放在最后
- `*` 不作为注释字符（已移除）——在 TCAD 脚本中它是乘法运算符
