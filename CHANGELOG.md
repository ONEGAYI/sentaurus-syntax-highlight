# 更新日志

本文档记录所有版本的变更历史。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [1.8.2] - 2026-04-22

### Bug 修复

- **修复用户自定义函数包装的 Region/Material 符号提取**：`(define myFunc (lambda (x) (Region "nwell")))` 等通过用户函数间接调用 Region/Material 的场景，符号索引现在能正确穿透 lambda 体提取声明

### 其他改进

- **define 简写形式全面支持**：`(define (name args) body)` 形式现在与 lambda 形式 `(define name (lambda (args) body))` 行为完全一致，包括参数提取（params 字段）、符号索引注册、签名提示和用户函数调用高亮
- **lambda 形式空参数守卫对称化**：为 lambda 形式也添加了空参数守卫，两种 define 形式在参数为空时均返回空数组，避免下游不一致

### 测试

- 新增 define 简写形式签名提示测试用例

---

## [1.8.1] - 2026-04-22

### Bug 修复

- **修复 Scheme 嵌套空括号回车缩进失效**：当光标在嵌套空括号内（如 `(let (|))`）按回车时，VSCode auto-indent 会将闭括号推到下一行，导致多级缩进逻辑因当前行不含 `)` 而跳过。提取 `scheme-on-enter-logic.js` 独立模块，新增 `findClosingParens` 函数检查下一行闭括号，并放宽空括号排除条件为仅单层场景

### 其他改进

- **表达式转换 QuickPick 历史模式优化**：默认模式仅显示变量补全和确认输入，不再直接展示历史记录列表；输入 `!` 进入历史模式时通过标题显示用法提示，历史模式下不显示确认分栏，选择即执行；预计算标题字符串并添加脏检查避免击键热路径中的冗余赋值

### 测试

- 新增 `test-scheme-on-enter.js`（空括号检测、开括号计数、跨行闭括号查找、排除条件判断，19 个测试用例）

---

## [1.8.0] - 2026-04-21

### 新功能

- **表达式转换命令变量补全**：在 SDE 文件中使用表达式转换时，输入过程中自动显示当前文档中用户定义的变量和参数，选中后替换输入中的标识符前缀并保持输入框打开，支持连续补全
- **表达式转换历史模式**：输入 `!` 进入历史模式浏览全部历史记录；`!3` 直接选中第 3 条；`! 文本` 模糊过滤历史

### 其他改进

- **表达式转换输入改为 QuickPick**：将原来 `showQuickPick`（历史）和 `showInputBox`（新输入）的双步骤交互合并为单一 QuickPick 输入框，支持变量补全、历史浏览和新输入的统一体验
- **表达式转换确认项国际化**：确认输入的分栏标题根据 VSCode 语言环境自动切换中英文
- **表达式转换帮助面板新增输入增强说明**：帮助 QuickPick 新增"输入增强"条目，说明变量补全和历史模式用法

### 测试

- 新增 `test-expression-quickpick.js`（变量前缀提取、标识符替换、历史模式解析，18 个测试用例）

---

## [1.7.0] - 2026-04-21

### 新功能

- **用户定义函数调用高亮**：通过 Semantic Tokens API 为 `(define name (lambda ...))` 和 `(define (name args) body)` 定义的函数，在调用位置显示函数色高亮（`userFunctionCall` 语义令牌类型），区分于普通变量
- **用户定义函数签名提示**：调用用户定义函数时，根据 lambda 参数列表提供 Signature Help，显示参数名和活跃参数位置

### Bug 修复

- **修复 define 签名被误标记为函数调用**：Semantic Tokens Provider 跳过 `define` 表达式中的 `children[1]`（变量名/函数签名），避免定义处的名称被错误高亮
- **修复 define 体内函数调用被跳过**：Semantic Tokens Provider 对 `define` 表达式仅跳过 `children[1]`，仍递归 `children[2:]`（body 中的函数调用）
- **修复 VSCode 内置 function 冲突导致编辑器冻结**：Semantic Token 类型 ID 从 `function` 改为 `userFunctionCall`（带 `superType: "function"`），避免与 VSCode 内置的 `function` 类型冲突产生负值 delta 导致 UI 冻结

### 其他改进

- **消除 Semantic Tokens Provider 的双重解析**：从 `document.getText()` 逐字符扫描改为使用 `schemeCache` 已缓存的 `lineStarts` 偏移表 + 二分查找，消除每次触发时的 O(n) 遍历
- **消除签名提示 fallback 的冗余解析**：`provideSignatureHelp` 的用户函数 fallback 直接从 `schemeCache.analysis.definitions` 读取（与 `defs.getDefinitions()` 产出一致），移除冗余的 `defs` 参数和独立解析调用
- **统一 `computeLineStarts` 实现**：`semantic-dispatcher.js` 和多个测试文件中的重复 `computeLineStarts` 定义统一为 `parse-cache.js` 的导出版本

### 测试

- 新增 `test-scheme-analyzer.js`（define+lambda params 提取测试）
- 新增 `test-semantic-tokens.js`（语义令牌提取与 delta 编码测试）
- 新增 `benchmark-firstload.js`（首次加载性能诊断脚本）

---

## [1.6.3] - 2026-04-21

### Bug 修复

- **修复 lambda 参数被误报为未定义变量**：`scope-analyzer.js` 的 `(define var val)` 分支在注册变量后直接返回，跳过了值表达式的遍历，导致 `(define f (lambda (x) ...))` 中 lambda 参数未进入作用域树。修复后值表达式中的 lambda/let 等嵌套作用域被正确构建
- **修复 lambda 参数缺少悬停提示和跳转定义**：`scheme-analyzer.js` 的 `extractDefinitionsFromList` 未识别 `(lambda (params...) body...)` 形式，lambda 参数不会被提取为定义。修复后 lambda 参数与 define/let 变量行为一致，支持悬停提示和跳转定义

---

## [1.6.2] - 2026-04-20

### 新功能

- **命令面板标题中文本地化**：通过 NLS 机制为 5 个命令添加中英双语标题，中文 VSCode 自动显示中文标题

### Bug 修复

- **修复空列表导致 scope-analyzer 未捕获 TypeError**：`buildScopeTree` 在处理空列表 `()` 或仅含注释的列表 `(; comment)` 时添加空列表保护检查，避免 `children[0].value` 越界访问

### 其他改进

- **添加英文版 README**（`README.en.md`），中文 README 顶部添加语言切换链接，移除底部过时的旧英文段落

---

## [1.6.1] - 2026-04-20

### Bug 修复

- **修复 SDE 中 `#` 行注释被误报为未定义变量**：Scheme 解析器新增 `#` 行注释处理，在 `#t`/`#f` 布尔值和预处理器指令检查之后，将其余所有 `#` 开头的内容（如 `######### Parameters Definition #########`）识别为行注释，避免注释中的文字被误检测为未定义变量

---

## [1.6.0] - 2026-04-18

### 新功能

- **SDE KEYWORD2 函数悬停文档**：为 159 个 SDE KEYWORD2 函数（涵盖 `sde:`, `sdegeo:`, `sdedr:`, `sdemesh:`, `sdepe:` 等命名空间）添加英文函数说明文档和中文翻译，悬停时显示函数用途、参数说明和示例代码

---

## [1.5.1] - 2026-04-18

### Bug 修复

- **修复定义提示框截断导致语法高亮错误和虚假内容**：`truncateDefinitionText` 截断时检测是否落在字符串内部，若是则回退到引号之前，避免生成虚假参数；Scheme 截断后自动平衡未闭合括号并用 `;…` 注释标记，Tcl 使用 `#…` 标记；补全文档语言标记从硬编码改为动态 `langId`
- **修复内置材料名被误报未定义**：将 `region-undef-diagnostic.js` 中硬编码的 `BUILTIN_MATERIALS` 白名单迁移到 `all_keywords.json` 的顶层 `MATERIAL` 分类（109 项），供诊断白名单和补全系统共用，用户编辑 JSON 即可扩展材料

### 其他改进

- `sentaurus.definitionMaxWidth` 设置最小值放宽至 0，设为 0 时禁用截断

---

## [1.5.0] - 2026-04-17

### 新功能

- **SDE 符号索引与语义分析**：为 SDE (Scheme) 语言引入声明式符号系统，支持 Region、Material、Contact 三类 TCAD 符号的语义感知。核心引擎（`symbol-index.js`）遍历 AST 提取符号定义与引用，通过 `symbolParams` 参数映射表配置约 55 个 SDE API 的符号行为，支持 `string-append` 静态拼接解析和 `modeDispatch` 动态类型推断
- **未定义符号语义诊断**：实时检测未定义的 Region/Material/Contact 引用并显示黄色警告，帮助用户在编码阶段发现拼写错误和遗漏定义
- **符号智能补全**：根据光标所在函数的参数位置和期望的符号类型（Region/Material/Contact），提供已定义符号的上下文感知补全
- **查找所有引用**：支持对 Region/Material/Contact 符号的 "Find All References" 功能，交叉索引符号定义与所有引用位置

### 测试

- 新增 `test-symbol-index.js`（符号提取引擎测试：resolveSymbolName + extractSymbols）
- 新增 `test-region-undef-diagnostic.js`（未定义符号语义诊断测试）
- 新增 `test-symbol-completion.js`（符号补全过滤测试）
- 新增 `test-symbol-reference.js`（查找所有引用测试）

---

## [1.4.2] - 2026-04-17

### 新功能

- **空引号对自动删除**：在空引号对 `""`、`''`、`||` 中按退格删除开引号时，如果引号两侧均为边界字符（空白、分隔符、行首/行尾），自动删除配对的闭引号。支持所有 6 种语言

### Bug 修复

- **修复 SDE 函数签名模式分派与参数偏移**：为 `sdedr:offset-interface` 和 `sdedr:offset-block` 添加模式分派，输入 `region`/`material` 后只显示对应模式签名；修复 `argIndex=0` 函数的参数高亮错位一位问题；签名标签中 flag/tag 可选参数统一加引号
- **修复列表内注释导致 let/lambda/define 变量误报未定义**：`parseList` 在构建 children 时过滤 Comment 节点，消除注释对固定索引访问的干扰

---

## [1.4.1] - 2026-04-16

### 新功能

- **SPROCESS `<Unit>` 物理单位语法高亮**：为 SPROCESS 的 `<nm>`、`<um>`、`<cm-2>` 等物理单位语法添加 TextMate 高亮规则（`support.constant.unit`），并提供暗色（`#CE9178`）/ 亮色（`#D73A49`）主题默认配色
- **Unit 尖括号自动配对与删除**：在数字后输入 `<` 时自动补全 `>` 并将光标置于中间（如 `10<nm>`、`0.5<um>`、`1e15<cm-2>`），退格删除 `<` 时自动连带删除配对的 `>`。仅匹配独立数值常量（整数/小数/科学计数法），不影响变量名和 Tcl 比较运算符

### 测试

- 新增 `test-unit-auto-close.js`（Unit 自动配对 + 删除配对测试，含参数校验、数字/非数字场景、语法边界用例）

---

## [1.4.0] - 2026-04-16

### 新功能

- **TCL 核心命令语法高亮与悬停文档**：为 5 种 Tcl 语言（SDEVICE/SPROCESS/EMW/Inspect/Svisual）添加核心命令的三级语法高亮（`keyword.control` / `keyword.other` / `support.function`），新增 `tcl_command_docs.json` 中英文双语文档（43 条命令），悬停时显示命令说明
- **统一解析缓存层**：新增 `parse-cache.js`，为 Scheme 和 Tcl 建立双缓存架构（SchemeParseCache + TclParseCache），消除每次击键触发 5-6 次冗余解析。迁移 9 个 Provider 到缓存层，缓存条目上限 20（LRU/FIFO 淘汰），文件关闭时自动清理
- **ScopeIndex 按需查询**：引入 ScopeIndex 类替代 `Map<line, Set>` 全量预计算，Tcl 作用域查询复杂度从 O(p×n×m) 降至 O(n)，支持 `for`/`foreach`/`while`/`procedure` 等全部作用域类型

### Bug 修复

- **修复 Scheme 函数名 HTML 实体导致 undef-var 误报**：`all_keywords.json` 中 27 个函数名含 XML 提取残留的 HTML 实体（如 `string-&gt;list`），在 `getSchemeKnownNames()` 入口统一解码
- **修复 for 循环变量未被 ScopeIndex 收集**：`_collectLocalDefsForIndex` 传入临时数组导致 `for {set i 0}` 中的 `i` 变量定义丢失
- **修复 3 个历史遗留测试套件**：补全 `findEnclosingCall`/`buildSignatureLabel`/`SymbolKind` 等缺失的模块导出，修正测试参数和断言列位置，29 项测试全部通过

### 性能优化

- **Phase 1 Quick Wins**：统一诊断去抖为 500ms；补全去重从 O(n²) 优化为 O(n)；新增 `deactivate()` 释放定义缓存和 WASM 解析器资源
- **Phase 2 缓存架构**：单次击键解析次数从 5-6 次降至 1 次；Scheme full pipeline 降低 26%；WASM tree 生命周期由缓存层统一管理
- **Phase 3 算法与加载**：文档 JSON 按语言懒加载，激活时 I/O 从 ~1.46MB 降至 ~452KB；复用 tokenizer 行号追踪消除 `countLinesUpTo` 重复扫描
- **Phase 4 细节打磨**：`findMismatchedBraces` 改为逐字符扫描替代 `text.split`；`findEnclosingCall` 添加行范围剪枝跳过无关 AST 子树；预分割 `sourceText` 为 `lines` 数组消除 `_extendNodeTextToLineEnd` 重复 `split`
- **综合效果**（1000 行 Tcl 文件）：全管线从 74.90ms 降至 26.58ms（降低 65%），首次跌破 30ms 大关

### 测试

- 新增 `test-parse-cache.js`（解析缓存层测试）
- 新增 `test-tcl-scope-index.js`（ScopeIndex 作用域查询测试）
- 新增 `tests/benchmark.js`（性能基准测试工具）
- 修复 3 个历史遗留测试套件（29 项测试恢复通过）
- 全部 18 个测试套件、297 项测试通过

---

## [1.3.0] - 2026-04-15

### 新功能

- **SDE Scheme 括号内回车自动缩进**：在 `)` 前回车时自动将 `)` 移到新行并正确缩进。采用两层架构：`sde.json` 的 `onEnterRules` 覆盖基础场景（单层括号、空括号排除），`scheme-on-enter-provider.js` 处理嵌套括号内的多级缩进场景。两者协同工作，互不冲突
- **定义提示框显示改进**：definitionText 扩展到行尾，包含行末注释内容，提供更完整的上下文信息。新增 `truncateDefinitionText` 截断工具函数，补全和悬停提示统一应用截断逻辑，避免过长文本溢出
- **新增 `sentaurus.definitionMaxWidth` 用户设置项**：允许用户自定义定义提示文本的最大显示宽度

### 测试

- 新增 definitionText 行末注释和截断逻辑测试

---

## [1.2.0] - 2026-04-15

### 新功能

- **SDE Scheme 重复定义检测**：新增 `checkSchemeDuplicateDefs` 诊断，对同一作用域内重复的 `define`/`let`/`let*`/`letrec`/`lambda` 绑定显示黄色警告，集成到未定义变量诊断 Provider
- **条件分支过滤**：重复定义检测支持条件分支语义——`if`/`cond`/`case` 的不同分支以及 `#if` 条件编译块内允许同名定义，消除条件逻辑中的误报
- **定义位置信息**：scope-analyzer 为每个 definition 增加 `line`/`start`/`end` 位置字段，支持更精确的诊断定位

### Bug 修复

- **修复注释导致 signature help 错选外层函数**：当 Scheme 代码中左括号与函数名之间存在注释时（如 `(foo ;comment\n (bar))`），AST 的 `children[0]` 为 Comment 节点而非函数名，导致 `findEnclosingCall` 跳过内层调用。通过 `effectiveChildren()` 辅助函数过滤 Comment 节点，在 4 个关键函数中统一修复

### 测试

- 新增 Scheme 重复定义检测测试（11 个基础用例 + 条件分支过滤用例）
- 新增 signature help 注释偏移回归测试

---

## [1.1.1] - 2026-04-15

### 新功能

- **新增 `generic:get` 函数支持**：将 `generic:get` 添加到 SDE 关键词表、语法高亮规则和中英文函数文档

### Bug 修复

- **修复未定义变量检测的多项误报**：Scheme 解析器新增预处理指令识别（`#if`/`#else`/`#endif` 等），跳过整行避免 Tcl 标识符被误解析；作用域分析器跳过 `#` 开头标识符和 `@Var@` SWB 参数变量；移除已失效的 `position` 硬编码白名单（改由关键词等级匹配覆盖）

### 其他改进

- **重构语法高亮正则表达式**：将 6 个语法文件中的超长 `match` 正则拆分为多个子 pattern，最长行长度减少 80-98%，显著提升可读性和可维护性
- **清理仓库**：删除 `references/` 中不需要的 PDF 提取图片资源

---

## [1.1.0] - 2026-04-15

### 新功能

- **未定义变量检测诊断（SDE Scheme + Tcl 方言）**：新增跨语言未定义变量检测功能，对未定义的标识符显示黄波浪线警告。SDE (Scheme) 通过手写解析器收集 `define`/`let`/`let*`/`letrec`/`lambda` 绑定；Tcl 方言通过 tree-sitter AST 构建 `set`/`proc`/`upvar`/`variable` 作用域映射。内置函数和标准运算符自动排除
- **SDE Scheme 特殊常量高亮**：新增 `#t`/`#f`（布尔）、`#\char`（字符）等 Scheme 特殊字面量的语法高亮规则

### Bug 修复

- **修复未定义变量检测多项误报**：修正 tree-sitter-tcl 节点类型名、处理 `word_list` 包装和 `global` 特殊节点、修复 Scheme 端 quote 表达式和 letrec lambda 参数作用域
- **修复函数文档跨语言泄露**：按语言 ID 隔离文档数据，防止 SDE 函数文档出现在其他语言中
- **修正 Scheme 函数文档 JSON 的 require 路径**：修复模块加载路径错误
- **修复括号诊断误报**：跳过 `*` 注释行，消除 Sentaurus Tcl 方言中注释块的误报
- **修复扩展激活时不触发诊断**：扩展启动时主动扫描所有已打开文档，确保首次打开即显示诊断信息（括号匹配和未定义变量检测均受益）
- **修复表达式转换历史记录功能**：改用 QuickPick + globalState 持久化替代之前失效的实现
- **修复 infix→scheme 同级运算符转换**：展平为可变参数形式，避免生成冗余嵌套

### 其他改进

- **补充测试覆盖**：新增 Scheme 未定义变量检测集成测试，补充 Tcl `upvar`/`variable`/白名单测试用例
- **文档归档**：已完成的设计文档移至 archived 目录

---

## [1.0.3] - 2026-04-14

### Bug 修复

- **修复签名帮助 modeDispatch 参数错位**：`sdedr:define-refinement-function` 的 MaxLenInt/MaxInterval 模式 params 数组中 `"function-name"` 与 mode 字面量重复，导致后续参数索引全部向前错位；`sdedr:define-analytical-profile` 的 Gauss/Erf/Eval 模式同理移除冗余 `"analytical-type"`
- **修复 MaxTransDiff/MaxGradient 签名帮助无法分派**：当 mode 名不在 `argIndex` 指定的固定位置时（如 MaxTransDiff/MaxGradient 在第二个参数前有 dopant-name），`resolveMode` 现在会回退扫描所有参数位置查找有效 mode 名
- **修正函数文档与官方 SDE 用户指南一致**：MaxTransDiff/MaxGradient 的参数从 `"function-name"` 更正为 `"dopant-name"`，signature 更新为 `dopant-name "MaxGradient" value | dopant-name "MaxTransDiff" value` 格式

---

## [1.0.2] - 2026-04-14

### Bug 修复

- **修复 SDE 预处理指令被错误识别为注释**：在注释模式之前插入预处理指令模式，使 `#if`、`#ifdef`、`#define`、`#set` 等 Sentaurus 预处理指令正确高亮为 `keyword.control.preprocessor`，`##if`、`# comment` 等仍为注释

### 文档

- README 新增"更改 Sentaurus 默认编辑器为 VS Code"的使用技巧

---

## [1.0.1] - 2026-04-14

### Bug 修复

- **修复 WASM 自检自动打开输出栏**：移除初始化成功/失败时自动调用 `OutputChannel.show()` 的行为，避免每次打开 VSCode 时输出面板强制弹出。通知消息保留，用户可手动查看 Output 面板了解详情
- **清理死代码、冗余导出，修复 svisual 变量提取失效**：删除已废弃的正则版 Tcl 解析器（`extractTclDefinitions` 等），统一 `TCL_LANGS` 数据源修复 svisual 语言遗漏，清理 15 个内部函数冗余导出

---

## [1.0.0] - 2026-04-14

### 新功能

- **新增第 6 种语言：Sentaurus Visual (svisual)**：完整支持语法高亮、自动补全、悬停提示和跳转定义，文件模式 `*_vis.cmd`，继承 Tcl 共享框架的全部语义功能
- **Tcl AST 共享框架（web-tree-sitter WASM）**：引入 tree-sitter-tcl WASM 解析器，为 sdevice/sprocess/emw/inspect/svisual 五种 Tcl 方言提供统一的 AST 基础设施
  - 代码折叠：基于 `braced_word` 节点的命令块折叠
  - 括号诊断：文本级花括号平衡检查并标红
  - 面包屑导航：注册 `DocumentSymbolProvider`，根据 section 关键词和命令块自动生成面包屑路径
- **svisual 函数文档（257 条，中英双语）**：覆盖 138 个 KEYWORD1 顶层命令和 119 个 KEYWORD4 命名空间函数，根据 VSCode 界面语言自动切换
- **svisual section 关键词配置**：为 43 个块结构命令提供符号层级信息，支持面包屑导航
- **Tcl 变量提取升级为 AST**：`set`/`proc` 变量提取从正则方案切换到 tree-sitter AST 解析，提升准确性

### 其他改进

- **Hover 和补全预览语法高亮**：将 `formatDoc` 中硬编码的 `'scheme'`/`'tcl'` 改为使用实际语言 ID（sde/sdevice 等），使 VSCode 能匹配本扩展的 TextMate 语法，为签名、示例和用户变量定义提供正确的语法高亮

---

## [0.8.0] - 2026-04-14

### 新功能

- **Scheme 表达式双向转换**：新增前缀表达式 ↔ 中缀/函数调用表达式的双向转换功能，通过命令面板调用（`Sentaurus: Scheme → Infix`、`Sentaurus: Infix → Scheme`）。支持选中文本直接替换或输入框转换，结果插入光标处并自动全选，输入框支持上下箭头浏览历史记录（会话内 20 条）
- **表达式帮助命令**：新增 `Sentaurus: Expression Help` 命令，通过 QuickPick 分组展示所有支持的运算符和函数，选中可插入代码片段
- **完整运算符覆盖**：支持算术运算符（`+`、`-`、`*`、`/`）、特殊运算符（`^`/`**` 幂、`%` 取模、`%%` 取余、`//` 取整商）、数学函数（`sin`、`cos`、`tan`、`asin`、`acos`、`atan`、`sqrt`、`abs`、`exp`、`log`）、取整函数（`floor`、`ceil`、`round`）和聚合函数（`min`、`max`）
- **智能优先级处理**：转换器自动根据运算符优先级决定是否添加括号，支持嵌套表达式、多参数运算和链式运算

### 其他改进

- **新增 `src/commands/` 目录**：表达式转换器模块独立放置在 `src/commands/expression-converter.js`，与 LSP 相关模块分离

---

## [0.7.2] - 2026-04-13

### Bug 修复

- **修复长文件中 Signature Help 不触发的问题**：语义分派器将 AST 节点的文档绝对字符偏移与光标的行内列位置直接比较，导致超过数十行的文件中所有单行函数调用都无法被定位。现通过预计算行首偏移表，将绝对偏移正确转换为行内列位置后再比较

---

## [0.7.1] - 2026-04-13

### Bug 修复

- **修正 Signature Help 触发条件**：修复自动补全插入右括号后导致 Signature Help 无法触发的问题，改为同时监听 `(` 和 `)` 字符触发
- **修正 sdegeo:set-contact "remove" 参数文档**：原描述"分离接触"不准确，更正为"删除区域并将其边界转换为接触"，同步更新中英文文档
- **补充 define-constant-profile-* 系列 NoReplace 选项**：为 `define-constant-profile-material`、`define-constant-profile-placement`、`define-constant-profile-region` 三个函数的 `replace` 参数补充缺失的 `"NoReplace"` 选项说明

### 其他改进

- **新增 i18n 校对脚本**：添加 `scripts/validate_i18n.py`，自动校验中英文文档对的结构一致性（跳过 desc/example/modeDispatch 等允许差异的字段），支持按工具名筛选

---

## [0.7.0] - 2026-04-13

### 新功能

- **Scheme AST 解析器**：新增完整的 S-expression 词法分析器和递归下降解析器（`src/lsp/scheme-parser.js`），支持注释、字符串、列表等语法结构的 AST 构建
- **Scheme 定义提取器**：新增 `scheme-analyzer.js`，从 AST 中提取 `define`/`let`/`let*`/`letrec`/`lambda` 绑定，替代原有正则方案
- **作用域分析器**：新增 `scope-analyzer.js`，构建函数参数和 `let` 绑定的作用域树，支持变量可见性判断
- **感知作用域的补全**：SDE 自动补全现在区分函数参数、`let` 绑定和全局定义，按类别分配图标（Variable/Constant/Function/Module），仅在可见作用域内展示变量
- **Signature Help**：新增签名帮助提供器（`src/lsp/providers/signature-provider.js`），输入 `(` 时自动弹出 SDE 函数签名，支持多参数文档悬停
- **语义分派引擎**：新增 `semantic-dispatcher.js`，根据 SDE 函数调用上下文分派不同的签名模式（如 `define-refinement-function` 根据第二个参数切换 domain/refinement/profile 三种签名）
- **12 个 SDE 函数 modeDispatch 元数据**：为 `define-gaussian-profile`、`define-erf-profile`、`define-analytical-profile`、`define-refinement-function`、`sdegeo:define-rectangle-set`、`sdegeo:define-polygon-set`、`sdegeo:define-contact-set`、`sdegeo:define-region-set`、`sdegeo:define-plane-set`、`sdegeo:define-line-set`、`sdegeo:define-point-set`、`sdegeo:sweep` 添加多模式签名元数据
- **代码折叠**：注册 SDE 折叠范围提供器，支持 `define`、`let`、`lambda` 等 S-expression 的折叠
- **括号诊断**：注册 SDE 括号匹配诊断提供器，检测不匹配的括号并标红

### Bug 修复

- **修正 let 绑定和函数参数在补全中不可见**：修复作用域分析器未正确将 `let` 绑定和函数参数纳入可见作用域的问题
- **修正 modeDispatch argIndex 语义**：通过 AST 实际解析验证，修正 4 个函数的 `argIndex` 与实际 AST 子节点位置不匹配（`define-refinement-function` 2→1，`define-gaussian-profile`/`define-erf-profile` 3→4，`define-analytical-profile` 6→5）
- **修复中文语言环境下 modeDispatch 丢失**：`modeDispatch` 元数据仅存在于英文版文档，VSCode 设置为中文时 `modeDispatchTable` 为空导致 Signature Help 失效。改为始终从英文文件构建 `modeDispatchTable`
- **@Var@ 字符串内高亮**：修复 `@Var@` SWB 参数替换在字符串内未被正确高亮的问题，改用 `format.placeholder` scope

### 其他改进

- **definitions.js 轻量化**：将定义提取逻辑迁移至 AST 解析器后，`definitions.js` 从 80+ 行精简为调用入口
- **let/let*/letrec 绑定不再泄漏到全局作用域**

---

## [0.6.9] - 2026-04-13

### Bug 修复

- **补全中文文档 signature 字段**：为 405 个 SDE 函数补回缺失的 `signature` 字段，修复悬停提示中函数签名不显示的问题
- **清理空 example 字段**：移除 46 个函数中多余的空 `example` 字段，与英文原文结构对齐

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
[1.8.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.6.3...v1.7.0
[1.6.3]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.4.2...v1.5.0
[1.4.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.8.0...v1.0.0
[0.8.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.9...v0.7.0
[0.6.9]: https://github.com/ONEGAYI/sentaurus-syntax-highlight/compare/v0.6.8...v0.6.9
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
