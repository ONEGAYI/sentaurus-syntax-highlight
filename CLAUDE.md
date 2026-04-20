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

## 项目结构

```
sentaurus-syntax-highlight/
├── package.json                                ← 扩展清单：6 种语言注册、贡献点、命令
├── package.nls.json                            ← 命令面板标题英文默认值
├── package.nls.zh-cn.json                      ← 命令面板标题中文翻译
├── CHANGELOG.md                                ← 版本变更日志
├── README.md                                   ← 项目说明文档（中文）
├── README.en.md                                ← 项目说明文档（英文）
├── icon.png                                    ← 扩展图标
├── language-configuration.json                 ← 遗留配置（已被 language-configurations/ 取代）
├── .vscodeignore                               ← VSIX 打包排除规则
│
├── syntaxes/                                   ← TextMate 语法 + 函数文档数据
│   ├── sde.tmLanguage.json                     ← SDE (Scheme) 语法高亮规则
│   ├── sdevice.tmLanguage.json                 ← SDEVICE 语法高亮规则
│   ├── sprocess.tmLanguage.json                ← SPROCESS 语法高亮规则
│   ├── emw.tmLanguage.json                     ← EMW 语法高亮规则
│   ├── inspect.tmLanguage.json                 ← Inspect 语法高亮规则
│   ├── svisual.tmLanguage.json                 ← Svisual 语法高亮规则
│   ├── all_keywords.json                       ← 全工具关键词数据库（补全 + 语法共用）
│   ├── tree-sitter-tcl.wasm                    ← tree-sitter-tcl WASM 字节码
│   ├── sde_function_docs.{json,zh-CN.json}     ← SDE 函数文档（中英文双语，565 API）
│   ├── scheme_function_docs.{json,zh-CN.json}  ← Scheme 内置函数文档（中英文双语，191 函数）
│   ├── sdevice_command_docs.{json,zh-CN.json}  ← SDEVICE 命令文档（中英文双语，341 关键词）
│   ├── svisual_command_docs.{json,zh-CN.json}  ← Svisual 命令文档（中英文双语）
│   └── tcl_command_docs.{json,zh-CN.json}      ← Tcl 核心命令文档（中英文双语，43 命令）
│
├── language-configurations/                    ← 语言配置（注释符号、括号匹配、缩进）
│   ├── sde.json                                ← SDE 配置：行注释 `;`
│   └── tcl.json                                ← 5 种 Tcl 工具共用：行注释 `#`
│
├── snippets/                                   ← VSCode snippet JSON（按 language id 隔离）
│   ├── sde.json                                ← SDE 代码片段
│   ├── sdevice.json                            ← SDEVICE 代码片段
│   ├── sprocess.json                           ← SPROCESS 代码片段
│   ├── emw.json                                ← EMW 代码片段
│   ├── inspect.json                            ← Inspect 代码片段
│   └── svisual.json                            ← Svisual 代码片段
│
├── src/                                        ← 扩展源码（纯 CommonJS，无构建步骤）
│   ├── extension.js                            ← 入口：激活、补全、悬停、QuickPick 命令注册
│   ├── definitions.js                          ← 用户变量补全/悬停/跳转（Scheme + Tcl）
│   │
│   ├── commands/                               ← VSCode 命令实现
│   │   └── expression-converter.js             ← Scheme 前缀 ↔ 中缀表达式双向转换
│   │
│   ├── lsp/                                    ← 语义功能核心（AST 解析 + Provider 注册）
│   │   ├── scheme-parser.js                    ← Scheme 词法分析器 + AST 解析器
│   │   ├── scheme-analyzer.js                  ← Scheme AST 定义提取 + 折叠范围
│   │   ├── scope-analyzer.js                   ← Scheme 作用域树构建（词法作用域追踪）
│   │   ├── semantic-dispatcher.js              ← Scheme 函数调用语义模式分发
│   │   ├── symbol-index.js                    ← 符号提取引擎（Region/Material/Contact 声明式配置）
│   │   ├── tcl-parser-wasm.js                  ← Tcl WASM 解析器接口（单例模式）
│   │   ├── tcl-ast-utils.js                    ← Tcl AST 遍历/查询/折叠/变量提取
│   │   ├── tcl-symbol-configs.js               ← Tcl 工具 section 关键词配置
│   │   ├── parse-cache.js                      ← 统一解析缓存层（SchemeParseCache + TclParseCache）
│   │   │
│   │   └── providers/                          ← VSCode Provider 实现
│   │       ├── folding-provider.js             ← Scheme 代码折叠
│   │       ├── bracket-diagnostic.js           ← Scheme 括号平衡诊断
│   │       ├── signature-provider.js           ← Scheme 函数签名提示
│   │       ├── undef-var-diagnostic.js         ← 未定义/重复定义变量诊断（Scheme + Tcl 双语言）
│   │       ├── scheme-on-enter-provider.js     ← Scheme 括号内回车多级自动缩进
│   │       ├── tcl-folding-provider.js         ← Tcl 代码折叠（基于 braced_word）
│   │       ├── tcl-bracket-diagnostic.js       ← Tcl 括号诊断（文本级 {} 平衡）
│   │       ├── tcl-document-symbol-provider.js ← Tcl 文档大纲（Outline 视图）
│   │       ├── unit-auto-close-logic.js        ← SPROCESS Unit 括号自动配对判断逻辑
│   │       ├── unit-auto-close-provider.js     ← SPROCESS Unit 括号自动配对 Provider
│   │       ├── quote-auto-delete-logic.js      ← 空引号对自动删除判断逻辑
│   │       ├── quote-auto-delete-provider.js   ← 空引号对自动删除 Provider（6 种语言共用）
│   │       ├── region-undef-diagnostic.js         ← Region/Material/Contact 未定义语义诊断（Scheme）
│   │       ├── symbol-completion.js               ← Region/Material/Contact 符号补全
│   │       └── symbol-reference-provider.js       ← Find All References（Region/Material/Contact）
│   │
│   └── snippets/                               ← QuickPick 代码片段数据（JS 模块）
│       ├── sde.js                              ← SDE 结构编辑器片段
│       ├── sdevice.js                          ← SDEVICE 器件仿真片段
│       ├── sprocess.js                         ← SPROCESS 工艺仿真片段
│       ├── inspect.js                          ← Inspect 数据分析片段
│       └── mesh.js                             ← 网格生成片段
│
├── tests/                                      ← 测试套件（纯 Node.js assert，零外部依赖）
│   ├── test-definitions.js                     ← 用户变量定义提取
│   ├── test-expression-converter.js            ← 表达式转换
│   ├── test-scheme-parser.js                   ← Scheme 解析器
│   ├── test-scope-analyzer.js                  ← 作用域分析
│   ├── test-semantic-dispatcher.js             ← 语义分发
│   ├── test-signature-provider.js              ← 签名提示
│   ├── test-scheme-undef-diagnostic.js         ← Scheme 未定义变量诊断
│   ├── test-scheme-dup-def-diagnostic.js       ← Scheme 重复定义检测
│   ├── test-scheme-var-refs.js                 ← Scheme 变量引用
│   ├── test-snippet-prefixes.js                ← 代码片段前缀
│   ├── test-tcl-ast-utils.js                   ← Tcl AST 工具（14 测试，mock 节点）
│   ├── test-tcl-ast-variables.js               ← Tcl AST 变量提取
│   ├── test-tcl-document-symbol.js             ← Tcl 文档大纲
│   ├── test-tcl-scope-map.js                   ← Tcl 作用域映射
│   ├── test-tcl-var-refs.js                    ← Tcl 变量引用
│   ├── test-parse-cache.js                     ← 解析缓存层测试
│   ├── test-tcl-scope-index.js                 ← ScopeIndex 作用域查询测试
│   ├── test-undef-var-integration.js           ← 未定义变量诊断集成测试
│   ├── test-unit-auto-close.js                 ← Unit 括号自动配对测试
│   ├── test-quote-auto-delete.js               ← 空引号对自动删除测试
│   ├── test-symbol-index.js                    ← 符号提取引擎（resolveSymbolName + extractSymbols）
│   ├── test-region-undef-diagnostic.js         ← Region/Material/Contact 未定义诊断
│   ├── test-symbol-completion.js               ← 符号补全过滤
│   ├── test-symbol-reference.js                ← Find All References
│   └── benchmark.js                            ← 性能基准测试工具
│
├── scripts/                                    ← 开发工具脚本
│   ├── extract_keywords.py                     ← 从 XML mode 文件提取关键词并生成语法
│   ├── split_long_matches.py                   ← 拆分超长正则匹配模式（可读性优化）
│   ├── translate_docs.py                       ← 函数文档机器翻译 + 人工校对流程
│   ├── validate_i18n.py                        ← 中英文文档一致性校验
│   ├── merge_i18n.py                           ← 合并翻译结果
│   ├── fix_examples.py                         ← 修复文档中的代码示例
│   └── extract_svisual_sections.js             ← 提取 Svisual section 信息
│
├── docs/                                       ← 项目文档与术语表
│   ├── glossary.json                           ← TCAD 术语数据库
│   ├── 函数文档提取与编写规范.md                 ← 文档编写规范
│   ├── sde-scopes-and-colors.md                ← SDE scope 与颜色对照
│   ├── prompts/i18n/                           ← 国际化 prompt 模板
│   └── superpowers/                            ← 开发 spec/plan 归档
│       ├── plans/                              ← 实现计划文档（含 archived/）
│       └── specs/                              ← 设计规范文档（含 archived/）
│
├── benchmarks/                                 ← 性能基准测试输出（JSON）
├── display_test/                               ← 功能展示测试文件
├── build/                                      ← 批量处理中间产物
├── assets/pics/                                ← 效果截图与演示 GIF
└── references/                                 ← Sentaurus 官方手册 PDF/Markdown + jEdit 宏模板
```

## 架构

扩展为 Synopsys Sentaurus TCAD 工具链的 6 种语言提供 IDE 支持，采用三层架构：

### 第一层：TextMate 语法高亮

由 `syntaxes/*.tmLanguage.json`（声明式 JSON）驱动，`package.json` 注册 6 种语言，每种通过 `filenamePatterns` 匹配文件（非扩展名），共用 `.cmd` 后缀互不冲突。

| Language ID | 工具 | 方言 | 文件模式 | 语言配置 |
|-------------|------|------|----------|----------|
| `sde` | Structure Editor | **Scheme** | `*_dvs.cmd`, `.scm` | `sde.json`（注释 `;`） |
| `sdevice` | Device Simulator | Tcl | `*_des.cmd` | `tcl.json`（注释 `#`） |
| `sprocess` | Process Simulator | Tcl | `*_fps.cmd`, `.fps` | `tcl.json` |
| `emw` | EM Wave | Tcl | `*_eml.cmd`, `*_emw.cmd` | `tcl.json` |
| `inspect` | Inspect | Tcl | `*_ins.cmd` | `tcl.json` |
| `svisual` | Sentaurus Visual | Tcl | `*_vis.cmd` | `tcl.json` |

每个语法文件按首匹配胜出规则依次包含：注释 → 字符串 → 数值 → `@Var@` SWB 参数 → 兜底标识符。关键词从 XML mode 文件提取（`scripts/extract_keywords.py`），XML 标签映射为 TextMate scope（KEYWORD1→`keyword.control`, KEYWORD2→`keyword.other`, KEYWORD3→`entity.name.tag`, KEYWORD4→`support.class`, FUNCTION→`entity.name.function`）。

### 第二层：关键词补全与文档悬停

`src/extension.js` 在语言激活时读取 `syntaxes/all_keywords.json`，为每种语言注册 `CompletionItemProvider`。同时加载函数文档 JSON 合并为统一的 `funcDocs` 对象，驱动 `HoverProvider`。当前覆盖 SDE（565 API）、Scheme 内置（191 函数）、SDEVICE（341 关键词）、Tcl 核心命令（43 命令）、Svisual（中英文双语）。文档 JSON 按语言懒加载，激活时仅加载当前语言所需文档。

`src/definitions.js` 独立提供用户自定义变量的补全、悬停和跳转定义，通过 `document.version` 惰性缓存避免重复扫描。definitionText 扩展到行尾包含行末注释，并通过 `truncateDefinitionText` 工具函数按 `sentaurus.definitionMaxWidth` 设置截断过长文本。

### 第三层：AST 语义功能

双解析器架构，按语言方言分治：

- **Scheme（SDE）**：手写解析器（`scheme-parser.js`），生成自定义 AST → `scheme-analyzer.js` 提取定义和折叠范围 → `scope-analyzer.js` 构建词法作用域树 → `semantic-dispatcher.js` 按函数调用模式分发语义 → `symbol-index.js` 根据声明式 symbolParams 配置提取 Region/Material/Contact 的定义和引用（支持 string-append 静态推断和 modeDispatch 动态类型）
- **Tcl（其余 5 种）**：`tree-sitter-tcl` WASM 解析器（`tcl-parser-wasm.js`）→ `tcl-ast-utils.js` 统一 AST 遍历/变量提取/折叠 → `tcl-symbol-configs.js` 配置各工具 section 关键词

共用 Provider（`src/lsp/providers/`）：
- `undef-var-diagnostic.js` — 跨语言未定义/重复定义变量诊断（Scheme + Tcl）
- `folding-provider.js` / `tcl-folding-provider.js` — 代码折叠
- `bracket-diagnostic.js` / `tcl-bracket-diagnostic.js` — 括号平衡诊断
- `signature-provider.js` — Scheme 函数签名提示
- `scheme-on-enter-provider.js` — Scheme 括号内回车多级自动缩进（与 `sde.json` onEnterRules 协同）
- `tcl-document-symbol-provider.js` — Tcl 文档大纲
- `unit-auto-close-provider.js` — SPROCESS Unit 括号自动配对（含 logic 层判断逻辑）
- `quote-auto-delete-provider.js` — 空引号对自动删除（6 种语言共用，含 logic 层判断逻辑）
- `region-undef-diagnostic.js` — Region/Material/Contact 未定义语义诊断
- `symbol-completion.js` — Region/Material/Contact 符号补全（声明式 symbolParams 配置）
- `symbol-reference-provider.js` — Find All References（Region/Material/Contact 交叉引用）

**内存管理**：WASM `tree` 对象使用后必须 `tree.delete()` 释放，由 `parse-cache.js` 的 `TclParseCache` 统一管理生命周期。

### 解析缓存层

`src/lsp/parse-cache.js` 提供 `SchemeParseCache` 和 `TclParseCache`，为所有 Provider 消除冗余解析：
- 缓存键为 `{uri + version}`，文档变更自动失效
- 缓存条目上限 20（LRU/FIFO 淘汰），文件关闭时清理
- 单次击键触发解析次数从 5-6 次降至 1 次

### 代码片段系统

两套机制并行：
- **VSCode snippets**（`snippets/*.json`）：按 language id 自动隔离，用户可在 Preferences 中自定义
- **QuickPick 命令**（`src/snippets/*.js` → `sentaurus.insertSnippet`）：多层级菜单，数据定义在 JS 模块中，支持动态生成

### 表达式转换

`src/commands/expression-converter.js` 实现 Scheme 前缀表示 ↔ 中缀表示的双向转换（算术运算 + 数学函数）。

## 关键约束

- 多种语言共用 `.cmd` 扩展名——文件关联完全依赖 `filenamePatterns`，而非 `extensions`
- TextMate 语法遵循首匹配胜出规则——兜底模式必须放在最后
- `scripts/extract_keywords.py` 路径硬编码，跨环境使用前必须修改 `main()` 中的路径
- `*.Identifier` 文件已被 gitignore
- 使用中文编写文档、提交和发布
- 兼容性目标：CentOS 7 / VSCode v1.85.2 / GLIBC 2.17（无 TypeScript、无构建步骤、无原生二进制）

## 发布流程

### 步骤

1. **更新 CHANGELOG**：回顾 `git log <上次release-tag>..HEAD --oneline`，将所有提交归纳为 CHANGELOG 条目。新增版本段落置于文件顶部，格式与已有条目保持一致（`### 新功能` / `### Bug 修复` / `### 其他改进`）。同时在底部 `<!-- 变更链接 -->`（建议使用 Grep 快速定位行）添加新版本的 compare 链接
   - 当同一个发布内，有全新功能并有其初版本的修复提交，这样的修复不需要暴露在CHANGELOG和release中，因为对于用户他们看见的是全新的功能，对修复无感知。但该全新功能的介绍应以最后定案为准。
2. **更新 CLAUDE.md**: 主要更新文件树（必须，如果有）和架构的内容。架构的更新需要言简意赅。文件树需要严格对照 git 历史变更，如果已有文件功能发生改变，也需要适当的反映在文件树中。
3. **提交 CHANGELOG**
4. **打包**：`npx vsce package`
5. **推送**：`git push origin main`
6. **双平台发布**：
   - GitHub Release：`gh release create v<version> sentaurus-tcad-syntax-<version>.vsix --title "v<version>" --notes "..."`，notes 内容直接复用 CHANGELOG 该版本的正文
   - VS Code Marketplace：`npx vsce publish`

### 要求

- **描述风格统一**：CHANGELOG 和 Release notes 的措辞、分类、详略程度需与历史版本保持一致
- **双平台同步**：每次发布必须同时更新 GitHub Release 和 VS Code Marketplace
- **完整回顾**：必须从上次 release tag 开始回顾所有提交，确保无遗漏
