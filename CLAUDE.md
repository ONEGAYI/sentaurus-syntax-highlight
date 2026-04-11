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

### 用户变量支持（src/definitions.js）

独立模块，零 VSCode API 依赖。提供用户自定义变量的补全、悬停和跳转定义功能。

- **语言覆盖**：Scheme (sde) 的 `define`/`let/let*/letrec` 绑定；Tcl (其他 4 种) 的 `set`/`proc`
- **缓存**：`document.version` 惰性缓存，同版本不重复扫描
- **跨行处理**：`findBalancedExpression` 括号匹配算法，跳过字符串和注释内的括号
- **测试**：`tests/test-definitions.js`，纯 Node.js `assert`，零依赖

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

## 函数文档系统

`src/extension.js` 的 Hover 和 Completion 提供器从 JSON 文件读取函数文档，合并到统一的 `funcDocs` 对象中。
当前已覆盖：

- **SDE 函数文档**（中英文双语）：`syntaxes/sde_function_docs.json`（400 个 KEYWORD1 API）
- **Scheme 内置函数文档**（中英文双语）：`syntaxes/scheme_function_docs.json`（191 个 R5RS 标准函数）
- **sdevice 命令文档**（英文默认）：`syntaxes/sdevice_command_docs.json`
  覆盖全部 339 个 KEYWORD1+KEYWORD2+KEYWORD3 关键词（25+31+290=346 去重后 339 唯一条目，含 2 个额外条目共 341 条）。
  中文版待翻译。格式在 SDE 基础上增强，新增 `section`（所属模块）和 `keywords`（子关键词列表）字段。

### 未来工作

#### Tcl 内置函数文档

`all_keywords.json` 中的 FUNCTION 类别是语言内置函数。Scheme 部分基本完成，Tcl 部分尚未覆盖：

- ~~**Scheme R5RS 标准**（191/204 个）~~：已完成中英文双语文档，术语对齐 R5RS 标准。
  文件：`syntaxes/scheme_function_docs.json`（英文默认）、`syntaxes/scheme_function_docs.zh-CN.json`（中文）。
  剩余 13 个为 SDE Guile 方言扩展（`define-macro`、`fluid-let`、`gensym`、`catch` 等），
  Sentaurus UG 未提供文档，暂不覆盖。另有 27 个因 `all_keywords.json` 中 HTML 实体编码（如
  `char-ci&lt;=?`）与文档 key 不匹配，运行时 `decodeHtml()` 已处理，不影响功能。

- **Tcl 内置**（sprocess/inspect/sinterconnect/spptcl, 106-128 个）：`proc`、`while`、`glob`、`switch` 等。
  sprocess ∩ sinterconnect = 128/128 完全相同，可写一份 Tcl 通用文档复用给 4 种语言。
  注意：与 Scheme 同名的 10 个函数（`if`、`list`、`string` 等）语法完全不同，不可复用。

#### 完善自动补全

自动识别用户变量并添加到补全，两个路径:

- 只进行 `(define Var Val)` 等关键语法的正则匹配，实时扫描实时添加到补全列表。（当前）
- 大改架构，引入语言服务器，采用 AST 获取变量及确定的语义，可跨文件 - 工作量巨大。

## 关键约束

- 多种语言共用 `.cmd` 扩展名——文件关联完全依赖 `filenamePatterns`，而非 `extensions`
- 提取脚本中的路径是硬编码的，跨环境使用前必须修改
- `*.Identifier` 文件已被 gitignore
- TextMate 语法模式遵循首匹配胜出规则——兜底模式必须放在最后
- release 语言风格需要与以前统一

## 语法简短说明

### SDE scheme

**坐标定义**
```scheme
(position x y z)
```

**向量定义**
```scheme
(gvector vx vy vz)
```

**材料名称**
`"Silicon"`, `"Oxide"`, `"Nitride"`

> 需要用双引号包裹

**字符串定义**
```scheme
; 使用双引号包裹
"Reg.Silicon"
```
