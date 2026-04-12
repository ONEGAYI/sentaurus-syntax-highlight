# 更新日志

本文档记录所有版本的变更历史。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [0.6.8] - 2026-04-13

### 新功能

- **重翻译 SDE 函数文档**：使用改进的翻译脚本（智能术语注入）重新翻译 405 个 SDE 函数的中文文档，扩展术语表至 564 条术语，通过 6 组子代理 review 闭环修复 53 处术语不一致和信息错误

### Bug 修复

- **修复 44 个 example 字段不一致**：从英文原文覆盖中文文件中与原文不同的 example 字段
- **修复翻译质量问题**：统一 接触设置→接触集、掩膜→掩模、淀积→沉积 等术语；修复 sdesp:begin 未翻译、sdeio:assign-local-refs 术语表注释误插入等问题

---

## [0.6.7] - 2026-04-12

### 新功能

- **增强 SDE 函数文档中文参数描述**：将 405 个 SDE 函数的 871 个参数描述全部翻译为中文，与英文增强版信息量完全一致，补充了枚举值含义、类型标注（REAL/POSITION/STRING 等）和可选性行为说明
- **新增通用翻译脚本**：`scripts/translate_docs.py` 支持增量翻译、断点续传、批量翻译、日志双输出，使用 OpenAI 兼容 API（DeepSeek 等），可复用于未来文档 i18n 需求

---

## [0.6.6] - 2026-04-12

### Bug 修复

- **修复 SDE snippets 中错误的函数调用**：将 Gauss 模板中 `sdedr:define-analytical-profile-placement` 的 `string.append` 修正为 `string-append`，与 Sentaurus SDE 实际 API 一致

---

## [0.6.5] - 2026-04-12

### 新功能

- **SDE snippet 前缀自定义**：新增 `sentaurus.snippetPrefixes` 配置项，允许用户自定义 SDE 代码片段中 `string-append` 拼接的命名前缀（如 `"RW."`、`"DC."`、`"RS."` 等），覆盖官方默认值或清空为无前缀风格
- **优化 SDE snippets tab stop 设计**：变量名（`CONT`/`NAME`/`RNAME`/`MNAME`/`POINT`）设为首个 tab stop 并镜像同步到所有引用处，改名时自动传播；移除 `(position ...)` 坐标的 tab stop（坐标通常从别处复制）；紧凑重排后续编号减少无效 Tab 跳转

### 其他改进

- 将 SDE snippets 中 `define-constant-profile` 系列 NAME 参数的前缀恢复为官方定义 `"DC."`
- 移除 CLAUDE.md 中已完成的 Tcl 内置函数文档未来工作条目

---

## [0.6.4] - 2026-04-12

### Bug 修复

- **修复注释行中错误显示函数悬停文档**：在 `provideHover` 和 `provideDefinition` 入口处新增 `isInComment()` 检查，正确识别 SDE (`;`)、Tcl (`#`, `*`) 三种注释符号并跳过字符串内的伪注释，避免在注释文字上悬停时弹出函数文档提示
- **修复 Marketplace README 图片链接路径**：移除 Markdown 图片链接中多余的尖括号 `<>`，将空格 URL 编码为 `%20`，使图片在 VSCode Marketplace 页面正确显示

### 其他改进

- 添加扩展图标，配置 `package.json` 的 `icon` 字段

---

## [0.6.3] - 2026-04-12

### 其他改进

- 添加 CHANGELOG.md，记录 v0.2.0 至 v0.6.2 全部版本的变更历史

---

## [0.6.2] - 2026-04-12

### Bug 修复

- **移除无效的 `//` 注释高亮规则**：`//` 不是 Sentaurus 任何工具的合法注释语法，从全部 5 个语法文件（SDE、SDevice、SProcess、EMW、Inspect）中移除 `comment.line.double-slash` 模式
- **拆分语言配置以修正 `Ctrl+/` 注释符号**：将 `language-configuration.json` 拆分为 `sde.json`（`lineComment: ";"`）和 `tcl.json`（`lineComment: "#"`），使 SDE 的 `Ctrl+/` 快捷键正确使用 `;` 而非 `#` 作为注释符号
- **补全 `*` 注释支持**：为 SProcess 和 Inspect 添加 `comment.line.asterisk` 模式（与 SDevice/EMW 保持一致）

### 其他改进

- 修正 SDE 代码片段中 `define-constant-profile` 系列 NAME 参数的默认前缀（`"DC."` → `"CP."`）

---

## [0.6.1] - 2026-04-12

### Bug 修复

- **补全代码片段模板中缺失的注释与单位提示**：对照 jEdit 官方宏文件，修正全部五种工具的代码片段
  - **SDE**：补回 Doping 模板的 `; - Common dopants:` 参考注释块、Meshing 的 `MaxLenInt` 注释示例、可选参数 `[ ]` 标记
  - **SDEVICE**：恢复 Optics/Raytracer/TMM 的行尾注释、补全 Electrode/Traps/Solve/System 的单位提示（`[V]` `[s]` `[Hz]` `[eV]` 等）
  - **SPROCESS**：5 处 `isotropic|anisotropic` 转为 VSCode snippet choice 语法
  - **INSPECT**：补回 Extract 模板的提取点说明注释
  - **Mesh (EMW)**：补回 `MaxCellSize`、`NPW` 等注释行

---

## [0.6.0] - 2026-04-12

### 新功能

- **代码片段系统与 QuickPick 可视化菜单**：新增命令面板命令 `Sentaurus: Insert Snippet`（`Ctrl+Shift+P`），提供多层级 QuickPick 菜单按工具分类浏览和插入代码模板，支持 `← Back` 返回上级，插入后自动激活 Tab 占位符跳转。覆盖全部五种工具共 **85 个**代码模板，数据独立为 `src/snippets/*.js` 模块
- **传统前缀+Tab 代码片段**：注册五种语言的 snippet 文件（`snippets/*.json`），用户可通过 `Preferences: Configure User Snippets` 自定义片段，按 language ID 自动隔离

---

## [0.5.1] - 2026-04-12

### 新功能

- **sdevice 命令文档中文本地化**：新增 `sdevice_command_docs.zh-CN.json`，为 sdevice 全部 341 个关键词提供中文悬停提示和补全文档。VSCode 界面语言为中文时自动切换，翻译基于 513 条半导体物理术语映射表，确保专业术语一致性
- **formatDoc i18n 标签补齐**：`formatDoc()` 新增 `Section` 和 `Keywords` 标签的国际化支持

---

## [0.5.0] - 2026-04-12

### 新功能

- **sdevice 命令悬停文档与补全文档**：新增 `sdevice_command_docs.json`，为 sdevice 全部 341 个关键词提供悬停提示和补全文档。文档采用增强格式，新增 `section`（所属模块）和 `keywords`（子关键词列表）字段
- **sdevice 关键词语义重分类**：将 49 个物理量名称和物理模型名称从 LITERAL 晋升为 KEYWORD3，获得与模型选项一致的高亮语义。通过 `extract_keywords.py --promote` 命令行模式执行

### Bug 修复

- **修复 pattern suffix 丢失导致的高亮断裂**：`extract_keywords.py` 中正则无法正确提取 `(?![A-Za-z0-9_:-])` 后缀，改为硬编码 `_KW_PATTERN_SUFFIX`，解决短关键词前缀吞噬长标识符的问题（如 `New` 错误匹配 `Newton`）
- **补充缺失的 MinEnergy 关键词**：添加到 `all_keywords.json` 和 `sdevice.tmLanguage.json`，修复与 `MaxEnergy` 的高亮不一致
- **新增 sdevice/emw 的 `*` 行注释模式**：与官方文档支持的 `#` 和 `*` 双注释符对齐

### 改进

- `extract_keywords.py` 新增 `--promote` 命令行模式，支持仅从现有 JSON 应用 LITERAL → KEYWORD 提升而无需重新生成完整语法

---

## [0.4.1] - 2026-04-11

### Bug 修复

- **修复带连字符和冒号的函数名高亮截断**：将所有语法文件中关键字、函数、标签和类别模式结尾的 `\b` 替换为显式负向前瞻 `(?![A-Za-z0-9_:-])`，修复 `sdegeo:fillet-2d` 等函数名后缀部分无法正确高亮的问题

### 改进

- **提取脚本增量更新模式**：`extract_keywords.py` 新增 `update_grammar_incrementally()` 函数，仅替换已有模式中的关键词列表，不改变 scope 名称、模式顺序和边界断言

---

## [0.4.0] - 2026-04-11

### 新功能

- **用户自定义变量支持**：为 5 种 TCAD 语言添加用户变量的补全、悬停定义和跳转定义功能
  - **变量补全**：Scheme (SDE) 识别 `(define/let/let*/letrec)` 绑定，Tcl 识别 `set`/`proc`，自动去重
  - **悬停定义**：鼠标悬停显示变量名、定义行号和完整定义文本
  - **跳转定义**：F12 / Ctrl+Click 跳转到定义行
  - 纯函数模块 `src/definitions.js`，零 VSCode API 依赖，含 32 个单元测试
- **补充 4 个缺失的 Scheme R5RS 函数**

---

## [0.3.2] - 2026-04-11

### 新功能

- **函数文档中英文国际化**：为全部函数文档添加中英文双语支持，根据 VSCode 界面语言自动切换。覆盖 405 个 SDE API 函数和 187 个 Scheme R5RS 内置函数
- **Scheme 内置函数英文文档**：将 187 个 Scheme 内置函数文档翻译为英文，术语严格对齐 R5RS 标准

---

## [0.3.1] - 2026-04-10

### 新功能

- **Scheme R5RS 内置函数文档**：为 187 个 R5RS 标准 Scheme 内置函数添加悬停提示和补全文档，覆盖等价谓词、数值运算、布尔、列表、符号、字符、字符串、向量、控制流、求值、I/O 等类别

### Bug 修复

- **修复 FUNCTION 模式匹配**：修复 55 个以 `?` 或 `!` 结尾的函数因尾部 `\b` 失效而无法高亮；按长度降序排列消除前缀遮蔽；修复 HTML 实体编码导致函数名无法匹配的问题
- **修复 `#` 注释规则**：将 `#` 注释模式限制为仅行首匹配，避免 Scheme vector 字面量 `#(1 2 3)` 和布尔值 `#t`/`#f` 被误吞为注释

---

## [0.3.0] - 2026-04-10

### 新功能

- **SDE API 函数悬停提示与补全文档**：为全部 400 个 SDE KEYWORD1 API 函数添加悬停提示和补全文档，覆盖 `sdegeo`、`sde`、`sdedr`、`sdeicwb`、`sdepe`、`sdesnmesh`、`sdeio`、`sdeepi`、`sdesp` 命名空间

### 改进

- KEYWORD1 scope 从 `keyword.control` 改为 `support.function`，补全图标改为 Function
- LITERAL3 材料名高亮改用 `support.type`

---

## [0.2.1] - 2026-04-09

### Bug 修复

- **修复 LITERAL3 材料名高亮失败**：scope 从 `string.quoted` 改为 `support.type`；移除正则首尾的 `\b`，使 `"SiO2"` 等引号包裹的材料名能被正确匹配

---

## [0.2.0] - 2026-04-09

### 新功能

- **语法高亮**：关键字、函数、标签、常量分色显示（基于 TextMate 语法）
- **自动补全**：输入时弹出关键词建议，按类别排序与图标标注
- **注释识别**：`#`、`//` 通用注释；SDE 额外支持 `;`（Scheme 注释）
- **SWB 变量高亮**：`@Var@`、`@param:+2@` 等 Workbench 参数替换语法
- **数值字面量**：整数、浮点数、科学计数法高亮
- **括号匹配**：`{}` `[]` `()` 自动配对
- 支持 5 种 Sentaurus 工具：SDE、SDevice、SProcess、EMW、Inspect

<!-- 变更链接 -->
[0.6.8]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/releases/tag/v0.2.0
