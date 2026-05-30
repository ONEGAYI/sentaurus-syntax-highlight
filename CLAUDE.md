# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供上下文指引。

## 项目概述

为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全的 VSCode 扩展。由 **TextMate 语法**（声明式 JSON）负责高亮，**纯 JavaScript 模块**（`src/extension.js`）负责关键词自动补全，**WASM 解析器**（`web-tree-sitter`）提供 AST 级语义功能——无 TypeScript、无构建步骤、无原生二进制依赖（WASM 为纯字节码，跨平台兼容）。

仓库：https://github.com/ONEGAYI/sentaurus-syntax-highlight
参考：https://github.com/jackyu-b/sentaurus-syntax-highlight

## 开发命令

- **从 Sentaurus XML mode 文件重新生成语法文件**：
  ```bash
  python scripts/syntax/extract_keywords.py
  ```
  注意：脚本中输入/输出路径是硬编码的（`d:\pydemo\modes` 和 `d:\pydemo\sentaurus-tcad-syntax\syntaxes`），运行前需修改 `main()` 中的路径。

- **测试扩展**：使用 VSCode 的 "Extension Development Host" 启动配置（从 `.vscode/launch.json` 按 F5）
- **工作树注意事项**：`git worktree` 只复制 git 跟踪的文件，`node_modules/`（含 `web-tree-sitter`）被 `.gitignore` 排除。在新工作树中开发前**必须运行 `npm install`**，否则 WASM 解析器加载失败导致所有 Tcl 语义功能（悬停、跳转、诊断、折叠）全部失效。`display_test/` 同样被忽略，测试文件可在主仓库路径下打开，不影响功能。
  - 凡代码开发、Bug修复/调试，进入工作树操作。

- **打包扩展**：
  ```bash
  vsce package
  ```
  在项目根目录生成 `sentaurus-tcad-syntax-<version>.vsix`。

## 项目结构

```
sentaurus-syntax-highlight/
├── package.json                                ← 扩展清单：7 种语言注册、贡献点、命令
├── package.nls.json                            ← 命令面板标题英文默认值
├── package.nls.zh-cn.json                      ← 命令面板标题中文翻译
├── CHANGELOG.md                                ← 版本变更日志
├── README.md                                   ← 项目说明文档（中文）
├── README.en.md                                ← 项目说明文档（英文）
├── icon.png                                    ← 扩展图标
├── language-configuration.json                 ← 遗留配置（已被 language-configurations/ 取代）
├── .vscodeignore                               ← VSIX 打包排除规则
├── THIRD_PARTY_NOTICES.md                      ← 第三方许可证声明（marked.js MIT）
├── AGENTS.md                                   ← AI 辅助开发项目概述与指引
│
├── media/                                      ← Webview 静态资源
│   └── marked.min.js                           ← marked.js v12（Markdown 渲染，~35KB）
│
├── syntaxes/                                   ← TextMate 语法 + 函数文档数据
│   ├── sde.tmLanguage.json                     ← SDE (Scheme) 语法高亮规则
│   ├── sdevice.tmLanguage.json                 ← SDEVICE 语法高亮规则
│   ├── sprocess.tmLanguage.json                ← SPROCESS 语法高亮规则
│   ├── emw.tmLanguage.json                     ← EMW 语法高亮规则
│   ├── inspect.tmLanguage.json                 ← Inspect 语法高亮规则
│   ├── svisual.tmLanguage.json                 ← Svisual 语法高亮规则
│   ├── sdevicepar.tmLanguage.json              ← SDEVICE PAR 参数文件语法高亮规则
│   ├── all_keywords.json                       ← 全工具关键词数据库（补全 + 语法共用，7 种语言）
│   ├── tree-sitter-tcl.wasm                    ← tree-sitter-tcl WASM 字节码
│   ├── sde_function_docs.{json,zh-CN.json}     ← SDE 函数文档（中英文双语，565 API）
│   ├── scheme_function_docs.{json,zh-CN.json}  ← Scheme 内置函数文档（中英文双语，191 函数）
│   ├── sdevice_command_docs.{json,zh-CN.json}  ← SDEVICE 命令文档（中英文双语，2117 关键词）
│   ├── svisual_command_docs.{json,zh-CN.json}  ← Svisual 命令文档（中英文双语）
│   ├── inspect_command_docs.{json,zh-CN.json}  ← Inspect 命令文档（中英文双语，193 条目）
│   ├── sprocess_command_docs.{json,zh-CN.json} ← SProcess 命令文档（中英文双语，164 命令）
│   ├── tcl_command_docs.{json,zh-CN.json}      ← Tcl 核心命令文档（中英文双语，92 命令）
│   ├── emw_command_docs.{json,zh-CN.json}      ← EMW 命令文档（中英文双语，148 条目：20 section + 128 参数）
│   ├── tcl_expr_mathfunc_docs.{json,zh-CN.json} ← Tcl expr 数学函数文档（中英文双语，31 函数）
│   └── tcl_subcommand_docs.{json,zh-CN.json} ← Tcl 子命令文档（中英文双语，11 主命令 152 子命令）
│
├── language-configurations/                    ← 语言配置（注释符号、括号匹配、缩进）
│   ├── sde.json                                ← SDE 配置：行注释 `;`
│   └── tcl.json                                ← 6 种 Tcl 工具共用：行注释 `#`
│
├── snippets/                                   ← VSCode snippet JSON（按 language id 隔离）
│   ├── sde.json                                ← SDE 代码片段
│   ├── sdevice.json                            ← SDEVICE 代码片段
│   ├── sprocess.json                           ← SPROCESS 代码片段
│   ├── emw.json                                ← EMW 代码片段
│   ├── inspect.json                            ← Inspect 代码片段
│   ├── svisual.json                            ← Svisual 代码片段
│   └── sdevicepar.json                         ← SDEVICE PAR 代码片段（22 个原生 snippet）
│
├── src/                                        ← 扩展源码（纯 CommonJS，无构建步骤）
│   ├── extension.js                            ← 入口：activate() 协调入口（~824行）
│   ├── definitions.js                          ← 用户变量补全/悬停/跳转（Scheme + Tcl）
│   ├── docs-loader.js                          ← 文档加载常量（KIND_MAP/SORT_PREFIX/DETAIL_LABEL）与格式化工具
│   ├── register-sde-providers.js               ← SDE 语言 Provider 注册（Folding/Bracket/Signature/SemanticTokens）
│   ├── register-tcl-providers.js               ← 6 种 Tcl 语言共用 Provider 注册（Folding/Bracket/SemanticTokens）
│   ├── register-completion-providers.js        ← Completion/Hover/Definition Provider 注册（7 种语言共用循环）
│   │
│   ├── commands/                               ← VSCode 命令实现
│   │   ├── expression-converter.js             ← Scheme 前缀 ↔ 中缀表达式双向转换（含 CursorTracker 光标位置感知、尖括号连字符变量语法、QuickPick 变量补全和历史模式）
│   │   ├── env-var-manager.js                  ← SWB 环境变量管理命令（批量添加/搜索删除/导出/导入）
│   │   ├── help-reader.js                      ← Webview 帮助阅读器（sentaurus.openHelp，~1022行，三栏布局+搜索+大纲+状态持久化）
│   │   └── snippet-picker.js                   ← QuickPick 代码片段命令（sentaurus.insertSnippet）
│   │
│   ├── lsp/                                    ← 语义功能核心（AST 解析 + Provider 注册）
│   │   ├── scheme-parser.js                    ← Scheme 词法分析器 + AST 解析器
│   │   ├── scheme-ast-utils.js                 ← Scheme AST 通用工具（effectiveChildren 等）
│   │   ├── scheme-analyzer.js                  ← Scheme AST 定义提取 + 折叠范围
│   │   ├── scope-analyzer.js                   ← Scheme 作用域树构建（词法作用域追踪）
│   │   ├── semantic-dispatcher.js              ← Scheme 函数调用语义模式分发
│   │   ├── symbol-index.js                     ← 符号提取引擎（Region/Material/Contact 声明式配置）
│   │   ├── tcl-parser-wasm.js                  ← Tcl WASM 解析器接口（单例模式）
│   │   ├── tcl-ast-utils.js                    ← Tcl AST 通用工具（parseSafe/walkNodes/15种隐式变量声明函数共享提取）
│   │   ├── tcl-scope.js                        ← 作用域构建与索引（ScopeIndex/buildScopeIndex，18种命令覆盖）
│   │   ├── tcl-variable-extractor.js           ← 变量提取与引用查找（getVariables/getVariableRefs，15种隐式变量命令）
│   │   ├── tcl-bracket-check.js                ← 括号平衡检查（findMismatchedBraces）
│   │   ├── tcl-document-symbol.js              ← 文档大纲符号提取（getDocumentSymbols/SymbolKind）
│   │   ├── tcl-symbol-configs.js               ← Tcl 工具 section 关键词 + 子 section 配置
│   │   ├── pp-utils.js                         ← 预处理器分支分析 + #define 宏定义提取共享模块
│   │   ├── parse-cache.js                      ← 统一解析缓存层（SchemeParseCache + TclParseCache）
│   │   │
│   │   └── sdevicepar/                         ← SDEVICE PAR 参数文件补全子系统（Phase 2）
│   │       ├── par-parser.js                   ← scope/block/parameter 三级 AST 解析 + include 链递归
│   │       ├── par-context.js                  ← 光标位置上下文推断（scopeType/block/parameter 定位）
│   │       ├── par-constants.js                ← 常量定义（scopeType 列表、内置占位 MaterialDB）
│   │       ├── par-index-service.js            ← 文件级索引管理 + workspace 全量扫描 + MaterialDB 集成
│   │       └── par-completion.js               ← 三级补全调度（scopeType/block/parameter）
│   │   │
│   │   └── providers/                          ← VSCode Provider 实现
│   │       ├── folding-provider.js             ← Scheme 代码折叠 + 预处理器块折叠
│   │       ├── diagnostic-factory.js           ← 诊断 Provider 工厂（统一 debounce/事件订阅/初始扫描）
│   │       ├── signature-provider.js           ← Scheme 函数签名提示（内置 + 用户定义函数）
│   │       ├── undef-var-diagnostic.js         ← 未定义/重复定义变量诊断（Scheme + Tcl 双语言）+ 未定义宏诊断
│   │       ├── scheme-on-enter-logic.js        ← Scheme 括号内回车缩进判断逻辑（独立模块）
│   │       ├── scheme-on-enter-provider.js     ← Scheme 括号内回车多级自动缩进（引用 logic 模块）
│   │       ├── tcl-folding-provider.js         ← Tcl 代码折叠（基于 braced_word）
│   │       ├── tcl-bracket-diagnostic.js       ← Tcl 括号诊断（文本级 {} 平衡）
│   │       ├── tcl-document-symbol-provider.js ← Tcl 文档大纲（Outline 视图）
│   │       ├── unit-auto-close-logic.js        ← SPROCESS Unit 括号自动配对判断逻辑
│   │       ├── unit-auto-close-provider.js     ← SPROCESS Unit 括号自动配对 Provider
│   │       ├── quote-auto-delete-logic.js      ← 空引号对自动删除判断逻辑
│   │       ├── quote-auto-delete-provider.js   ← 空引号对自动删除 Provider（7 种语言共用）
│   │       ├── tcl-env-var-semantic.js          ← SWB 环境变量 Semantic Token provider（粗体渲染 + 诊断豁免）
│   │       ├── region-undef-diagnostic.js         ← Region/Material/Contact 未定义语义诊断（Scheme）
│   │       ├── semantic-tokens-provider.js        ← SDE 用户定义函数调用 + #define 宏着色（Semantic Tokens）
│   │       ├── tcl-funcall-semantic.js          ← Tcl proc 调用处函数名语义着色（WASM AST 驱动）
│   │       ├── sdevice-semantic-provider.js    ← SDEVICE 语义 token（section/subSection/keyword/macro/vector）
│   │       ├── sdevice-vector-keywords.js      ← SDEVICE 矢量关键词数据（57 基础词 + 3 后缀）
│   │       ├── symbol-completion.js               ← Region/Material/Contact 符号补全
│   │       ├── variable-reference-provider.js     ← 用户变量 + #define 宏引用查找（Scheme + Tcl）
│   │       └── symbol-reference-provider.js       ← Find All References（Region/Material/Contact）
│   │
│   └── snippets/                               ← QuickPick 代码片段数据（JS 模块）
│       ├── sde.js                              ← SDE 结构编辑器片段
│       ├── sdevice.js                          ← SDEVICE 器件仿真片段
│       ├── sprocess.js                         ← SPROCESS 工艺仿真片段
│       ├── inspect.js                          ← Inspect 数据分析片段
│       ├── mesh.js                             ← 网格生成片段
│       └── sdevicepar.js                       ← SDEVICE PAR 参数文件片段（QuickPick，21 条目）
│
├── tests/                                      ← 测试套件（纯 Node.js assert，零外部依赖）
│   └── @docs/file-trees/tests.md               ← 【子文件过多，已折叠，详细目录见子文档】
│
├── scripts/                                    ← 开发工具脚本
│   ├── syntax/                                 ← 语法生成与维护
│   │   ├── extract_keywords.py                 ← [已不再维护] 从 XML mode 文件提取关键词并生成语法（历史参考）
│   │   ├── split_long_matches.py               ← 拆分超长正则匹配模式（可读性优化）
│   │   ├── audit-sdevice-keywords.js           ← SDEVICE 关键词审计（扫描官方手册）
│   │   ├── convert-jedit-mode.py               ← jEdit XML mode 转 TextMate JSON 语法（sdevicepar）
│   │   └── jedit_modes/                        ← jEdit XML 源文件和测试样本
│   └── docs/                                   ← 文档翻译、校验与处理
│       ├── translate_docs.py                   ← 函数文档机器翻译 + 人工校对流程
│       ├── validate_i18n.py                    ← 中英文文档一致性校验
│       ├── merge_i18n.py                       ← 合并翻译结果
│       ├── fix_examples.py                     ← 修复文档中的代码示例
│       ├── merge-sdevice-docs.js               ← 合并 SDEVICE AI 产出的文档片段
│       ├── prepare-doc-batches.js              ← 准备文档翻译批次
│       └── extract_svisual_sections.js         ← 提取 Svisual section 信息
│
├── docs/                                       ← 项目文档与术语表
│   ├── help/                                   ← Webview 帮助阅读器文档（打包进 VSIX）
│   │   ├── index.md                            ← 首页（功能概览）
│   │   ├── {getting-started,installation,syntax-highlighting,completion,snippets,sdevicepar,faq}.md ← 占位文档
│   │   └── toc.json                            ← 导航目录声明（标题+文件+children）
│   ├── glossary.json                           ← TCAD 术语数据库
│   ├── 函数文档提取与编写规范.md                 ← 文档编写规范
│   ├── scope-color-reference.md                ← 全语言 Scope + Color + KeywordType 查询表
│   ├── implicit-var-functions-survey.md         ← 15 种 Tcl 隐式变量声明函数调研文档
│   ├── implicit-var-extracts/                   ← 隐式变量函数文档片段（中英文双语）
│   │   └── {tcl-core,tcl-subcmd,svisual}.{json,zh-CN.json}
│   ├── file-trees/                             ← CLAUDE.md 折叠的子文件树
│   │   └── tests.md                            ← tests/ 目录详细文件树
│   ├── prompts/i18n/                           ← 国际化 prompt 模板
│   └── superpowers/                            ← 开发 spec/plan 归档
│       ├── plans/archived/                     ← 已完成的实现计划 (Working/Total: 2/43)
│       └── specs/archived/                     ← 已完成的设计规范 (Working/Total: 1/34)
│
├── benchmarks/                                 ← 性能基准测试输出（JSON）
├── display_test/                               ← 功能展示测试文件
├── build/                                      ← 批量处理中间产物
├── assets/pics/                                ← 效果截图与演示 GIF
└── references/                                 ← Sentaurus 官方手册 PDF/Markdown + jEdit 宏模板 + MaterialDB | 工作树中注意：大部分文档在主仓库，被忽略所以不会在工作树
    └── MaterialDB/                             ← SDEVICE 权威材料参数文件（Phase 2 词库数据源，from T-2022.03）
```

## 架构

扩展为 Synopsys Sentaurus TCAD 工具链的 7 种语言提供 IDE 支持，采用三层架构：

### 第一层：TextMate 语法高亮

由 `syntaxes/*.tmLanguage.json`（声明式 JSON）驱动，`package.json` 注册 7 种语言，每种通过 `filenamePatterns` 匹配文件（非扩展名），共用 `.cmd` 后缀互不冲突（Svisual 例外，使用 `_vis.tcl`）。

| Language ID | 工具 | 方言 | 文件模式 | 语言配置 |
|-------------|------|------|----------|----------|
| `sde` | Structure Editor | **Scheme** | `*_dvs.cmd`, `.scm` | `sde.json`（注释 `;`） |
| `sdevice` | Device Simulator | Tcl | `*_des.cmd` | `tcl.json`（注释 `#`） |
| `sprocess` | Process Simulator | Tcl | `*_fps.cmd`, `.fps` | `tcl.json` |
| `emw` | EM Wave | Tcl | `*_eml.cmd`, `*_emw.cmd` | `tcl.json` |
| `inspect` | Inspect | Tcl | `*_ins.cmd` | `tcl.json` |
| `svisual` | Sentaurus Visual | Tcl | `*_vis.tcl` | `tcl.json`（注释 `#`） |
| `sdevicepar` | Device Material DB | Tcl-like | `*.par` | `tcl.json`（注释 `#`） |
| — | _(Sentaurus Visual)_ | _Python_ | _`*_vis.py`_ | _标准 Python 扩展覆盖，缺 `sv` 模块补全_ |

每个语法文件按首匹配胜出规则依次包含：注释 → 字符串 → 数值 → `@Var@` SWB 参数 → 兜底标识符。关键词最初从 XML mode 文件通过 `scripts/syntax/extract_keywords.py`（已不再维护）提取，XML 标签映射为 TextMate scope（KEYWORD1→`keyword.control`, KEYWORD2→`keyword.other`, KEYWORD3→`entity.name.tag`, KEYWORD4→`support.class`, FUNCTION→`entity.name.function`），现改为直接手工维护 JSON 语法文件。

### 第二层：关键词补全与文档悬停

`src/extension.js` 在语言激活时读取 `syntaxes/all_keywords.json`，为每种语言注册 `CompletionItemProvider`。同时加载函数文档 JSON 合并为统一的 `funcDocs` 对象，驱动 `HoverProvider`。当前覆盖 SDE（565 API）、Scheme 内置（191 函数）、SDEVICE（2117 关键词）、Tcl 核心命令（92 命令）、Tcl expr 数学函数（31 函数）、Svisual、Inspect（193 条目）、SProcess（164 命令）、EMW（148 条目）（均为中英文双语）。文档 JSON 按语言懒加载，激活时仅加载当前语言所需文档。Tcl 子命令采用 registry 驱动的单次 match+captures 模式实现上下文感知高亮，覆盖 string/file/info/array/dict/namespace/clock/binary/encoding/package/chan 11 个主命令共 152 个子命令。HoverProvider 通过 registry 判断主命令-子命令组合，查找嵌套两级文档 JSON。CompletionProvider 在主命令后第一个参数位触发子命令补全。SDEVICE 的 HoverProvider 支持 section 上下文感知文档查找，根据光标所在 section 栈优先匹配当前 section 的参数和关键词。

`src/definitions.js` 独立提供用户自定义变量的补全、悬停和跳转定义，通过 `document.version` 惰性缓存避免重复扫描。definitionText 扩展到行尾包含行末注释，并通过 `truncateDefinitionText` 工具函数按 `sentaurus.definitionMaxWidth` 设置截断过长文本。

### 第三层：AST 语义功能

双解析器架构，按语言方言分治：

- **Scheme（SDE）**：手写解析器（`scheme-parser.js`），生成自定义 AST → `scheme-analyzer.js` 提取定义（含 define+lambda params 检测）和折叠范围 → `scope-analyzer.js` 构建词法作用域树 → `semantic-dispatcher.js` 按函数调用模式分发语义 → `symbol-index.js` 根据声明式 symbolParams 配置提取 Region/Material/Contact 的定义和引用（支持 string-append 静态推断和 modeDispatch 动态类型）
- **Tcl（其余 6 种）**：`tree-sitter-tcl` WASM 解析器（`tcl-parser-wasm.js`）→ `tcl-ast-utils.js` 通用 AST 工具（parseSafe/walkNodes/辅助函数）→ `tcl-scope.js` 作用域构建与索引（ScopeIndex/buildScopeIndex）→ `tcl-variable-extractor.js` 变量提取与引用查找 → `tcl-document-symbol.js` 文档大纲符号 → `tcl-bracket-check.js` 括号平衡检查 → `tcl-symbol-configs.js` 配置各工具 section 关键词和子 section → `pp-utils.js` 提供预处理器分支分析（`#if`/`#endif` 块映射）和 #define 宏定义提取/引用查找

SDEVICE 额外的纯文本语义层（`sdevice-semantic-provider.js`）：不依赖 WASM，通过文本扫描追踪 `{}` 嵌套栈构建 section 上下文，为顶层 section 名分配 `sectionName` token、为子 section（Quasistationary/Coupled 等）分配 `subSection` token、为 section 内关键词分配 `sectionKeyword` token、为 #define 宏分配 `macro` token，并缓存至 `document.version` 避免重复扫描。`sdevice-vector-keywords.js` 提供 Plot/CurrentPlot section 中 57 个矢量基础关键词和 3 种后缀的数据模块。SDEVICE PAR（sdevicepar）复用 Tcl 共用 Provider 和 WASM 解析管线。

**SDEVICE PAR 补全子系统**（`src/lsp/sdevicepar/`，Phase 2 三阶段）：
- `par-parser.js` — scope/block/parameter 三级 AST 解析器，支持 include 链递归解析和单行嵌套（如 `Bandgap { Eg0 = 1.12 }`）
- `par-context.js` — 光标位置上下文推断，定位当前 scopeType/block/parameter
- `par-completion.js` — 三级补全调度：scopeType 级聚合（忽略具体 scopeName），block/parameter 按 scopeType 过滤
- `par-index-service.js` — 文件级索引管理，workspace 全量扫描（FileSystemWatcher 监听 create/change/delete 增量更新），MaterialDB 集成（`sentaurus.materialDbPath` 配置，两种文件格式归一化，混合监听策略：existence poller + directory watcher）
- `par-constants.js` — 常量定义（scopeType 列表、内置 Silicon/Oxide 占位 MaterialDB）
- 优先级：workspace > materialdb，同名符号去重保留高优先级。补全项显示 Source 字段（来源文件名），状态栏反馈扫描进度

共用 Provider（`src/lsp/providers/`）：
- `undef-var-diagnostic.js` — 跨语言未定义/重复定义变量诊断（Scheme + Tcl）+ 未定义 #define 宏诊断
- `folding-provider.js` / `tcl-folding-provider.js` — 代码折叠
- `bracket-diagnostic.js` / `tcl-bracket-diagnostic.js` — 括号平衡诊断
- `signature-provider.js` — Scheme 函数签名提示（内置 + 用户定义函数 fallback）
- `semantic-tokens-provider.js` — SDE 用户定义函数调用 + #define 宏着色（Semantic Tokens，legend 扩展为 `[userFunctionCall, macro]`）
- `tcl-funcall-semantic.js` — Tcl proc 调用处函数名语义着色（复用 `TclParseCache` WASM AST，零额外解析开销；SDEVICE 独立 Provider，其余 4 种 Tcl 工具复用统一 Provider）
- `sdevice-semantic-provider.js` — SDEVICE 语义着色（sectionName/subSection/sectionKeyword/macro/vector token，纯文本栈追踪 + 三阶段扫描 + document.version 缓存）
- `sdevice-vector-keywords.js` — SDEVICE Plot/CurrentPlot 矢量关键词数据模块（57 基础词 + 3 后缀）
- `scheme-on-enter-provider.js` — Scheme 括号内回车多级自动缩进（与 `sde.json` onEnterRules 协同，逻辑提取至 `scheme-on-enter-logic.js`）
- `tcl-document-symbol-provider.js` — Tcl 文档大纲
- `unit-auto-close-provider.js` — SPROCESS Unit 括号自动配对（含 logic 层判断逻辑）
- `quote-auto-delete-provider.js` — 空引号对自动删除（7 种语言共用，含 logic 层判断逻辑）
- `region-undef-diagnostic.js` — Region/Material/Contact 未定义语义诊断
- `symbol-completion.js` — Region/Material/Contact 符号补全（声明式 symbolParams 配置）
- `variable-reference-provider.js` — 用户变量 + #define 宏引用查找（Scheme + Tcl 双语言，作用域感知过滤）
- `symbol-reference-provider.js` — Find All References（Region/Material/Contact 交叉引用）
- `tcl-env-var-semantic.js` — SWB 环境变量 Semantic Token provider（配置驱动白名单，粗体渲染，诊断豁免）

**环境变量系统**：`sentaurus.environmentVariables` 配置驱动 SWB 环境变量白名单（键=变量名，值=Hover 文档）。`env-var-manager.js` 提供 4 个管理命令（批量添加/搜索删除/导出 JSON/导入 JSON）。`undef-var-diagnostic.js` 自动豁免白名单变量的未定义诊断。Hover/补全通过 `🏠 环境变量` 标记区分环境变量与用户变量。

**国际化**：所有插件 UI 文字使用 `package.nls.json`（英文）+ `package.nls.zh-cn.json`（中文）的 i18n 映射，`package.json` 通过 `%key%` 引用。严禁硬编码面向用户的文字。

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

`src/commands/expression-converter.js` 实现 Scheme 前缀表示 ↔ 中缀表示的双向转换（算术运算 + 数学函数）。连字符标识符（如 `W-doping`）在中缀表达式中通过 `<var-name>` 尖括号语法消除与减号的歧义——`tokenizeInfix` 解析尖括号为标识符 token，`astToInfix` 自动包裹连字符标识符。QuickPick 输入框通过 `CursorTracker` 启发式推断光标位置，实现光标位置感知补全（含尖括号区域感知），并支持 `!` 历史模式（`!` 浏览全部、`!3` 精确选中、`! 文本` 模糊过滤）。

### 帮助文档阅读器

`src/commands/help-reader.js`（~1022 行）实现基于 WebviewPanel 的自定义帮助文档阅读器（`sentaurus.openHelp` 命令），替代内置 Markdown Preview。单模块架构：Extension 侧（HelpReader 类）负责路径校验/文件读取/消息分发，Webview 侧（模板字符串 `WEBVIEW_JS`）负责 Markdown 渲染/DOM 处理。

**三栏布局**：左侧 toc 导航树（`toc.json` 驱动）+ 中间文章内容（`marked.js` 渲染）+ 右侧 heading 大纲（IntersectionObserver 追踪 active）。

**核心功能**：
- 链接拦截：事件委托 + `safeDecodeURIComponent`，同文档锚点/跨文档锚点/外部链接分流处理
- 搜索高亮：Map 分组 DOM Text 节点 + 从后往前 wrap 避免偏移，支持 ▲▼/Enter/Esc 导航
- 侧栏折叠：28px 窄条保留展开按钮（◀▶）
- 状态持久化：`acquireVsCodeApi().getState/setState` 保存当前文档、scrollTop、搜索词、侧栏状态，面板重建时恢复
- CSP nonce：`crypto.randomUUID()` 生成 nonce，仅允许内联脚本执行

**数据文件**：`docs/help/` 下 8 个 `.md` 文档 + `toc.json` 导航声明。`media/marked.min.js`（v12，MIT 许可）通过 `asWebviewUri` 加载到 Webview。`.vscodeignore` 三级例外确保 `docs/help/**` 和 `media/marked.min.js` 打包进 VSIX。

**测试**：`tests/test-help-reader.js`（23 个），覆盖 `_validatePath`（16 个路径安全测试）、`_parseToc`（3 个）、`_loadMarkedJs`（1 个）、`_buildHtml`（3 个），通过 `tests/helpers/mock-vscode.js` 模拟 VSCode API，无需 VSCode 运行时。

## 关键约束

- 多种语言共用 `.cmd` 扩展名——文件关联完全依赖 `filenamePatterns`，而非 `extensions`
- TextMate 语法遵循首匹配胜出规则——兜底模式必须放在最后
- `scripts/syntax/extract_keywords.py` 已不再维护——关键词和语法文件的变更直接手工编辑 JSON，不再通过脚本生成。该脚本仅作为历史参考保留
- `*.Identifier` 文件已被 gitignore
- 使用中文编写文档、提交和发布
- 兼容性目标：CentOS 7 / VSCode v1.85.2 / GLIBC 2.17（无 TypeScript、无构建步骤、无原生二进制）
- 所有插件 UI 文字使用 i18n 映射，而不是硬编码
- 修改共享 Provider（如 `register-completion-providers.js`）等全局性文件时，必须考虑所有 7 种语言的兼容性——正则、分词、查找逻辑的变更可能对某一种语言造成回归，编写测试时应覆盖不同语言的典型用例

## 发布流程

### 步骤

{{Release Workflow in Global CLAUDE.md}}
5. **打包**：`npx vsce package`
6. **打包审计**（必须）：`npx vsce ls --tree` 完整审查文件列表，确认：
   - 无多打包：排除开发文档（`docs/superpowers/`、`docs/implicit-var-extracts/`、`docs/prompts/`）、测试、脚本、references 等非运行时文件
   - 无漏打包：确保新增的运行时文件（新增模块、数据文件、media 资源等）已包含
   - 检查总文件数和包大小是否合理（参考上次发布值）
7. **推送**：`git push origin main`
8. **双平台发布**：
   - GitHub Release：`gh release create v<version> sentaurus-tcad-syntax-<version>.vsix --title "v<version>" --notes "..."`，notes 内容直接复用 CHANGELOG 该版本的正文
   - VS Code Marketplace：`npx vsce publish`

### 要求

- **描述风格统一**：CHANGELOG 和 Release notes 的措辞、分类、详略程度需与历史版本保持一致
- **双平台同步**：每次发布必须同时更新 GitHub Release 和 VS Code Marketplace
- **完整回顾**：必须从上次 release tag 开始回顾所有提交，确保无遗漏
