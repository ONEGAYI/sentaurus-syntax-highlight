# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供上下文指引。

## 项目概述

为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全的 VSCode 扩展。由 **TextMate 语法**（声明式 JSON）负责高亮，**纯 JavaScript 模块**（`src/extension.js`）负责关键词自动补全，**WASM 解析器**（`web-tree-sitter`）提供 AST 级语义功能——无 TypeScript、无构建步骤、无原生二进制依赖（WASM 为纯字节码，跨平台兼容）。

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

注册了 6 种语言，每种对应一个 TextMate 语法：

| Language ID | Sentaurus 工具 | 文件模式 |
|-------------|---------------|----------|
| `sde` | Structure Editor | `*_dvs.cmd`, `.scm` |
| `sdevice` | Device Simulator | `*_des.cmd` |
| `sprocess` | Process Simulator | `*_fps.cmd`, `.fps` |
| `emw` | EM Wave | `*_eml.cmd`, `*_emw.cmd` |
| `inspect` | Inspect | `*_ins.cmd` |
| `svisual` | Sentaurus Visual (SVISUAL) | `*_vis.cmd` |

语言配置按注释符号拆分为两个文件：`language-configurations/sde.json`（行注释 `;`）和 `language-configurations/tcl.json`（行注释 `#`）。括号匹配 `{}` `[]` `()` 两者一致。

### 自动补全（`src/extension.js`）

纯 CommonJS 模块，在任一语言激活时加载。启动时读取 `syntaxes/all_keywords.json`，为每种语言注册 `CompletionItemProvider`。关键词按类别分配图标（关键字/函数/常量/类/结构体）并按类别优先级排序。

运行时依赖 `web-tree-sitter`（WASM 字节码，跨平台）。兼容 GLIBC 2.17（CentOS 7, VSCode 1.85.2-）。

### 用户变量支持（src/definitions.js）

独立模块，零 VSCode API 依赖。提供用户自定义变量的补全、悬停和跳转定义功能。

- **语言覆盖**：Scheme (sde) 的 `define`/`let/let*/letrec` 绑定；Tcl (其他 4 种) 的 `set`/`proc`
- **缓存**：`document.version` 惰性缓存，同版本不重复扫描
- **跨行处理**：`findBalancedExpression` 括号匹配算法，跳过字符串和注释内的括号
- **测试**：`tests/test-definitions.js`，纯 Node.js `assert`，零依赖

### Tcl AST 共享框架（4 语言共用）

利用 `web-tree-sitter` 加载 `tree-sitter-tcl` 的 WASM 语法，为 sdevice、sprocess、emw、inspect 四种 Tcl 方言提供统一的 AST 语义功能。SDE (Scheme) 使用独立的手写解析器，不共享此框架。

```
src/lsp/
├── tcl-parser-wasm.js                  ← WASM 解析器接口（单例、初始化、调试工具）
├── tcl-ast-utils.js                    ← AST 遍历/查询/折叠范围提取/括号诊断
├── providers/
│   ├── tcl-folding-provider.js         ← 代码折叠（基于 braced_word 节点）
│   └── tcl-bracket-diagnostic.js       ← 括号诊断（文本级花括号平衡检查）
```

**注册方式**：4 个语言 ID 统一注册（`for (const langId of TCL_LANGS)`）。
**内存管理**：所有 `tree` 使用后必须调用 `tree.delete()` 释放 WASM 内存，Provider 层通过 `try/finally` 保证。
**括号诊断策略**：使用文本级 `{}` 平衡计数而非 AST ERROR 节点，避免 sdevice 特有语法（坐标元组等）被误报。
- **测试**：`tests/test-tcl-ast-utils.js`，14 个测试，使用 mock 节点（不依赖 WASM 运行时）

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
1. 注释模式：`#`（所有语言）；`;`（仅 SDE，Scheme 惯例）；`*`（SDevice、EMW、SProcess、Inspect）
2. 双引号字符串模式（含转义处理）
3. 数值字面量模式（`constant.numeric`）——整数、浮点数、科学计数法
4. `@Var@` SWB 参数替换模式（`variable.parameter`）——如 `@previous@`、`@param:+2@`
5. 兜底标识符模式（`variable.other`）——必须放在最后（首匹配胜出规则）

## 函数文档系统

`src/extension.js` 的 Hover 和 Completion 提供器从 JSON 文件读取函数文档，合并到统一的 `funcDocs` 对象中。
当前已覆盖：

- **SDE 函数文档**（中英文双语）：`syntaxes/sde_function_docs.json`（400 个 KEYWORD1 API）
- **Scheme 内置函数文档**（中英文双语）：`syntaxes/scheme_function_docs.json`（191 个 R5RS 标准函数）
- **sdevice 命令文档**（中英文双语）：`syntaxes/sdevice_command_docs.json`（英文）、`syntaxes/sdevice_command_docs.zh-CN.json`（中文）
  覆盖全部 341 个 KEYWORD1+KEYWORD2+KEYWORD3 关键词。格式在 SDE 基础上增强，新增 `section`（所属模块）和 `keywords`（子关键词列表）字段。

### 未来工作

#### 完善自动补全

自动识别用户变量并添加到补全，两个路径:

- 只进行 `(define Var Val)` 等关键语法的正则匹配，实时扫描实时添加到补全列表。（当前）
- 大改架构，引入语言服务器，采用 AST 获取变量及确定的语义，可跨文件 - 工作量巨大。

## 代码片段系统（Snippets & QuickPick）

### Snippets 文件

`snippets/` 目录下按语言存放 VSCode snippet JSON 文件，每种语言独立：

| 文件 | Language ID | 说明 |
|------|-------------|------|
| `snippets/sde.json` | `sde` | SDE (Scheme) 代码片段 |
| `snippets/sdevice.json` | `sdevice` | SDEVICE 代码片段 |
| `snippets/sprocess.json` | `sprocess` | SPROCESS 代码片段 |
| `snippets/emw.json` | `emw` | EMW 代码片段 |
| `snippets/inspect.json` | `inspect` | Inspect 代码片段 |

**语言隔离机制**：多种语言共用 `.cmd` 扩展名，但 VSCode 根据 `filenamePatterns` 匹配到不同的 language id，snippets 跟随 language id 分发，不会冲突。用户自定义 snippets（Preferences → Configure User Snippets）也自动按 language id 隔离。

### 命令面板 QuickPick

注册了命令 `sentaurus.insertSnippet`（`Ctrl+Shift+P` → "Sentaurus: Insert Snippet"），弹出多层级 QuickPick 菜单：

- **顶层分类**：Clipboard、Editing、Emacs、Files、Interface、Java、Misc、Properties、Sentaurus-Device、Sentaurus-Inspect、Sentaurus-Mesh、Sentaurus-Process、Sentaurus-StructEditor、Text
- **独立操作**：Open Include（与分类之间有分隔线）
- **子选项**：待填充，选中分类后展示该分类下的具体命令模板

实现位于 `src/extension.js` 的 `activate()` 函数末尾，使用 `vscode.window.showQuickPick()` 链式调用。

## 关键约束

- 多种语言共用 `.cmd` 扩展名——文件关联完全依赖 `filenamePatterns`，而非 `extensions`
- 提取脚本中的路径是硬编码的，跨环境使用前必须修改
- `*.Identifier` 文件已被 gitignore
- TextMate 语法模式遵循首匹配胜出规则——兜底模式必须放在最后
- 使用中文编写文档、提交和发布。
- 必须考虑插件兼容性: CentOS 7, Vscode v1.85.2, GLIBC 2.17

## 发布流程

### 步骤

1. **更新 CHANGELOG**：回顾 `git log <上次release-tag>..HEAD --oneline`，将所有提交归纳为 CHANGELOG 条目。新增版本段落置于文件顶部，格式与已有条目保持一致（`### 新功能` / `### Bug 修复` / `### 其他改进`）。同时在底部 `<!-- 变更链接 -->` 添加新版本的 compare 链接
2. **提交 CHANGELOG**
3. **打包**：`npx vsce package`
4. **推送**：`git push origin main`
5. **双平台发布**：
   - GitHub Release：`gh release create v<version> sentaurus-tcad-syntax-<version>.vsix --title "v<version>" --notes "..."`，notes 内容直接复用 CHANGELOG 该版本的正文
   - VS Code Marketplace：`npx vsce publish`

### 要求

- **描述风格统一**：CHANGELOG 和 Release notes 的措辞、分类、详略程度需与历史版本保持一致
- **双平台同步**：每次发布必须同时更新 GitHub Release 和 VS Code Marketplace
- **完整回顾**：必须从上次 release tag 开始回顾所有提交，确保无遗漏
