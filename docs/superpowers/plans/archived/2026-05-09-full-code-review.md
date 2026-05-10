# 全面代码审查实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 派发 5 个并行子代理对 sentaurus-syntax-highlight 项目进行 5 维度代码审查，结果持久化为 15 个 md 文件

**Architecture:** 3 轮执行（src → tests-1 → tests-2），每轮 5 个子代理并行（3 Sonnet + 2 Haiku），每个代理只负责单一维度并写入独立 md 文件

**Tech Stack:** Claude Code Agent 工具（子代理派发）、git worktree（隔离执行环境）

---

## Task 1: 创建工作树与审查目录

**Files:**
- Create: `docs/superpowers/review/` 目录

- [ ] **Step 1: 创建工作树**

```bash
git worktree add ../sentaurus-review main
cd ../sentaurus-review
git checkout -b code-review
```

- [ ] **Step 2: 创建审查结果目录**

```bash
mkdir -p docs/superpowers/review
```

- [ ] **Step 3: 安装依赖（工作树不复制 node_modules）**

```bash
npm install
```

- [ ] **Step 4: 验证环境**

```bash
node -e "const fs=require('fs'); console.log('src files:', fs.readdirSync('src').length); console.log('test files:', fs.readdirSync('tests').length);"
```

Expected: 输出 src files 和 test files 数量

- [ ] **Step 5: 提交**

```bash
git add docs/superpowers/review
git commit -m "chore: 创建代码审查结果目录"
```

---

## Task 2: Round 1 — src/ 源码审查（5 代理并行）

**Files:**
- Create: `docs/superpowers/review/correctness-src.md`
- Create: `docs/superpowers/review/performance-src.md`
- Create: `docs/superpowers/review/dry-src.md`
- Create: `docs/superpowers/review/maintainability-src.md`
- Create: `docs/superpowers/review/robustness-src.md`

**审查范围（39 文件, 9632 行）:**

```
src/extension.js (1277), src/definitions.js (169)
src/commands/expression-converter.js (564)
src/lsp/scheme-parser.js (256), src/lsp/scheme-analyzer.js (150), src/lsp/scope-analyzer.js (329)
src/lsp/semantic-dispatcher.js (190), src/lsp/symbol-index.js (208)
src/lsp/tcl-parser-wasm.js (268), src/lsp/tcl-ast-utils.js (1844), src/lsp/tcl-symbol-configs.js (120)
src/lsp/pp-utils.js (297), src/lsp/parse-cache.js (238)
src/lsp/providers/bracket-diagnostic.js (65), src/lsp/providers/folding-provider.js (26)
src/lsp/providers/scheme-on-enter-logic.js (76), src/lsp/providers/scheme-on-enter-provider.js (124)
src/lsp/providers/signature-provider.js (144), src/lsp/providers/semantic-tokens-provider.js (101)
src/lsp/providers/symbol-completion.js (83), src/lsp/providers/symbol-reference-provider.js (82)
src/lsp/providers/tcl-bracket-diagnostic.js (76), src/lsp/providers/tcl-document-symbol-provider.js (44)
src/lsp/providers/tcl-folding-provider.js (34), src/lsp/providers/tcl-funcall-semantic.js (86)
src/lsp/providers/undef-var-diagnostic.js (332), src/lsp/providers/variable-reference-provider.js (232)
src/lsp/providers/sdevice-semantic-provider.js (416), src/lsp/providers/sdevice-vector-keywords.js (157)
src/lsp/providers/region-undef-diagnostic.js (95), src/lsp/providers/unit-auto-close-logic.js (42)
src/lsp/providers/unit-auto-close-provider.js (69), src/lsp/providers/quote-auto-delete-logic.js (57)
src/lsp/providers/quote-auto-delete-provider.js (60)
src/snippets/sde.js (176), src/snippets/sdevice.js (661), src/snippets/sprocess.js (315)
src/snippets/inspect.js (109), src/snippets/mesh.js (60)
```

- [ ] **Step 1: 并行派发 5 个子代理**

以下 5 个 Agent 调用同时发起（无依赖，并行执行）：

**Agent 1 — Bug/正确性 (Sonnet)**

prompt:
```
你是一个代码审查专家，负责审查 "Bug/正确性" 维度。

## 项目背景
sentaurus-syntax-highlight 是一个 VSCode 扩展，为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全。三层架构：TextMate 语法高亮 → 关键词补全/悬停 → AST 语义功能（WASM tree-sitter-tcl 解析器 + 手写 Scheme 解析器）。纯 CommonJS JavaScript，无构建步骤。

## 你的维度：Bug/正确性
只关注"代码是否做了它该做的事"：
- 逻辑错误（条件判断、循环、递归终止）
- 边界遗漏（off-by-one、空数组/空字符串未处理）
- 类型误用（undefined/null 混淆、隐式类型转换）
- 正则误匹配（过于宽泛或过于严格）
- 返回值未检查（API 调用后未验证结果）
- 异步逻辑错误（回调/Promise 处理不当）

## 排除范围
- 不报告性能问题（那是别的代理的维度）
- 不报告代码重复（那是复用/DRY维度）
- 不报告命名/结构问题（那是可维护性维度）
- 不报告错误处理缺失（那是健壮性维度）

## 待审查文件
请逐一读取以下 src/ 目录下的 39 个 JS 文件并审查：

src/extension.js, src/definitions.js,
src/commands/expression-converter.js,
src/lsp/scheme-parser.js, src/lsp/scheme-analyzer.js, src/lsp/scope-analyzer.js,
src/lsp/semantic-dispatcher.js, src/lsp/symbol-index.js,
src/lsp/tcl-parser-wasm.js, src/lsp/tcl-ast-utils.js, src/lsp/tcl-symbol-configs.js,
src/lsp/pp-utils.js, src/lsp/parse-cache.js,
src/lsp/providers/bracket-diagnostic.js, src/lsp/providers/folding-provider.js,
src/lsp/providers/scheme-on-enter-logic.js, src/lsp/providers/scheme-on-enter-provider.js,
src/lsp/providers/signature-provider.js, src/lsp/providers/semantic-tokens-provider.js,
src/lsp/providers/symbol-completion.js, src/lsp/providers/symbol-reference-provider.js,
src/lsp/providers/tcl-bracket-diagnostic.js, src/lsp/providers/tcl-document-symbol-provider.js,
src/lsp/providers/tcl-folding-provider.js, src/lsp/providers/tcl-funcall-semantic.js,
src/lsp/providers/undef-var-diagnostic.js, src/lsp/providers/variable-reference-provider.js,
src/lsp/providers/sdevice-semantic-provider.js, src/lsp/providers/sdevice-vector-keywords.js,
src/lsp/providers/region-undef-diagnostic.js, src/lsp/providers/unit-auto-close-logic.js,
src/lsp/providers/unit-auto-close-provider.js, src/lsp/providers/quote-auto-delete-logic.js,
src/lsp/providers/quote-auto-delete-provider.js,
src/snippets/sde.js, src/snippets/sdevice.js, src/snippets/sprocess.js,
src/snippets/inspect.js, src/snippets/mesh.js

对于大文件（>500行），按函数/模块分段读取，不要跳过任何部分。

## 输出格式
将审查结果写入 docs/superpowers/review/correctness-src.md，格式如下：

# 正确性审查报告 — src/ 源码

审查范围: 39 文件, 9632 行
发现问题数: X

## 高严重度
(问题条目)

## 中严重度
(问题条目)

## 低严重度
(问题条目)

## 总结
(总体评估)

每个问题条目格式：
- **[高/中/低]** `文件路径:行号` — 问题描述
  - 当前代码: `关键代码片段`
  - 建议改进: `改进方案`
```

**Agent 2 — 性能 (Sonnet)**

prompt:
```
你是一个代码审查专家，负责审查 "性能" 维度。

## 项目背景
sentaurus-syntax-highlight 是一个 VSCode 扩展，为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全。三层架构：TextMate 语法高亮 → 关键词补全/悬停 → AST 语义功能（WASM tree-sitter-tcl 解析器 + 手写 Scheme 解析器）。纯 CommonJS JavaScript，无构建步骤。

关键性能上下文：
- WASM tree-sitter 解析较重，有统一缓存层 parse-cache.js（SchemeParseCache + TclParseCache）
- 文档每次击键都会触发 Provider 回调，性能敏感
- 缓存键为 {uri + version}，上限 20 条 LRU/FIFO

## 你的维度：性能
只关注"是否存在不必要的性能开销"：
- 不必要的重复计算（同一数据多次解析/遍历）
- 内存泄漏（WASM tree 对象未 delete、缓存无限增长）
- 低效数据结构（O(n) 查找可优化为 O(1)、不必要的数组复制）
- 低效遍历（多层嵌套循环、可短路未短路）
- 缓存策略问题（缓存失效不当、缓存粒度不合理）
- 字符串操作效率（循环内字符串拼接、不必要的正则编译）

## 排除范围
- 不报告逻辑 Bug（那是正确性维度）
- 不报告代码重复（那是复用/DRY维度）
- 不报告命名/结构问题（那是可维护性维度）
- 不报告错误处理缺失（那是健壮性维度）

## 待审查文件
同 Agent 1 的 39 个文件列表。

## 输出格式
将审查结果写入 docs/superpowers/review/performance-src.md，格式同 Agent 1 但标题为"性能审查报告 — src/ 源码"。
```

**Agent 3 — 复用/DRY (Sonnet)**

prompt:
```
你是一个代码审查专家，负责审查 "复用/DRY" 维度。

## 项目背景
sentaurus-syntax-highlight 是一个 VSCode 扩展，为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全。三层架构：TextMate 语法高亮 → 关键词补全/悬停 → AST 语义功能（WASM tree-sitter-tcl 解析器 + 手写 Scheme 解析器）。纯 CommonJS JavaScript，无构建步骤。

## 你的维度：复用/DRY
只关注"是否存在可消除的重复"：
- 重复代码模式（不同文件中的相似函数/逻辑）
- 可提取的公共函数（多处使用的相同操作）
- 跨文件相似逻辑（如 Scheme 和 Tcl 两种语言共享的 Provider 模式）
- 配置数据重复（硬编码出现在多处）
- 可参数化的通用模式（只有数据不同，逻辑相同的代码）

重点关注：
- src/lsp/providers/ 下的 Provider 文件之间是否有重复模式
- Scheme 和 Tcl 双语言 Provider（如 undef-var-diagnostic, variable-reference）的重复
- 各 snippets/ 文件的结构重复

## 排除范围
- 不报告逻辑 Bug（那是正确性维度）
- 不报告性能问题（那是性能维度）
- 不报告命名/结构问题（那是可维护性维度）
- 不报告错误处理缺失（那是健壮性维度）

## 待审查文件
同 Agent 1 的 39 个文件列表。必须全部读取才能做跨文件比较。

## 输出格式
将审查结果写入 docs/superpowers/review/dry-src.md，格式同 Agent 1 但标题为"复用/DRY审查报告 — src/ 源码"。
```

**Agent 4 — 可维护性 (Haiku)**

prompt:
```
你是一个代码审查专家，负责审查 "可维护性" 维度。

## 项目背景
sentaurus-syntax-highlight 是一个 VSCode 扩展，为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全。纯 CommonJS JavaScript，无构建步骤。

## 你的维度：可维护性
只关注"代码结构是否清晰可维护"：
- 过长函数（>100 行的函数应考虑拆分）
- 文件过大（>500 行应考虑职责拆分）
- 职责不清（一个文件/函数做了太多事）
- 命名不当（变量名不达意、函数名与行为不符）
- 过深嵌套（>3 层 if/for 嵌套）
- 魔法数字/字符串（应提取为命名常量）

重点标记：
- tcl-ast-utils.js (1844 行) — 最大的文件，评估是否需要拆分
- extension.js (1277 行) — 入口文件，评估职责是否过重

## 排除范围
- 不报告逻辑 Bug（那是正确性维度）
- 不报告性能问题（那是性能维度）
- 不报告代码重复（那是复用/DRY维度）
- 不报告错误处理缺失（那是健壮性维度）

## 待审查文件
同 Agent 1 的 39 个文件列表。

## 输出格式
将审查结果写入 docs/superpowers/review/maintainability-src.md，格式同 Agent 1 但标题为"可维护性审查报告 — src/ 源码"。
```

**Agent 5 — 健壮性 (Haiku)**

prompt:
```
你是一个代码审查专家，负责审查 "健壮性" 维度。

## 项目背景
sentaurus-syntax-highlight 是一个 VSCode 扩展，为 Synopsys Sentaurus TCAD 工具链提供语法高亮与自动补全。纯 CommonJS JavaScript，无构建步骤。

关键健壮性上下文：
- VSCode Provider 回调中抛出未捕获异常会导致功能静默失效
- WASM 解析器可能因畸形输入崩溃
- 文档内容可能在回调间变化（version 不匹配）
- 文件可能包含非 UTF-8 字符

## 你的维度：健壮性
只关注"代码对异常情况的防御"：
- 缺失 try-catch（Provider 回调中未包裹的异步操作）
- 未防御的外部输入（用户文档内容、配置值）
- 空值/undefined 风险（解构/属性访问未检查）
- WASM 解析失败未处理（tree 为 null 或解析异常）
- 数组越界访问（索引未校验）
- 正则特殊字符未转义（用户输入直接拼入正则）

## 排除范围
- 不报告逻辑 Bug（那是正确性维度）
- 不报告性能问题（那是性能维度）
- 不报告代码重复（那是复用/DRY维度）
- 不报告命名/结构问题（那是可维护性维度）

## 待审查文件
同 Agent 1 的 39 个文件列表。

## 输出格式
将审查结果写入 docs/superpowers/review/robustness-src.md，格式同 Agent 1 但标题为"健壮性审查报告 — src/ 源码"。
```

- [ ] **Step 2: 等待 5 个代理全部完成**

确认以下 5 个文件均已生成且非空：
- docs/superpowers/review/correctness-src.md
- docs/superpowers/review/performance-src.md
- docs/superpowers/review/dry-src.md
- docs/superpowers/review/maintainability-src.md
- docs/superpowers/review/robustness-src.md

Run: `ls -la docs/superpowers/review/*-src.md | wc -l`
Expected: 5

- [ ] **Step 3: 提交 Round 1 结果**

```bash
git add docs/superpowers/review/*-src.md
git commit -m "review: 完成源码审查 Round 1 — 5 维度 src/ 审查结果"
```

---

## Task 3: Round 2 — tests/ 批次 1 审查（5 代理并行）

**Files:**
- Create: `docs/superpowers/review/correctness-tests-1.md`
- Create: `docs/superpowers/review/performance-tests-1.md`
- Create: `docs/superpowers/review/dry-tests-1.md`
- Create: `docs/superpowers/review/maintainability-tests-1.md`
- Create: `docs/superpowers/review/robustness-tests-1.md`

**审查范围（18 文件, 4346 行）:**

```
tests/benchmark.js (647), tests/test-expression-converter.js (535),
tests/test-sdevice-semantic.js (409), tests/test-tcl-document-symbol.js (330),
tests/test-scheme-parser.js (319), tests/test-parse-cache.js (270),
tests/test-scope-analyzer.js (258), tests/test-sdevice-vector-keywords.js (249),
tests/test-tcl-preprocessor.js (220), tests/test-region-undef-diagnostic.js (185),
tests/test-semantic-dispatcher.js (171), tests/test-scheme-undef-diagnostic.js (151),
tests/test-scheme-on-enter.js (146), tests/test-unit-auto-close.js (106),
tests/test-symbol-completion.js (106), tests/test-semantic-tokens.js (91),
tests/test-tcl-var-refs.js (81), tests/test-snippet-prefixes.js (72)
```

- [ ] **Step 1: 并行派发 5 个子代理**

与 Task 2 相同的 5 个代理配置，区别：
1. 文件列表替换为上述 18 个测试文件
2. 输出文件名后缀改为 `-tests-1.md`
3. 报告标题改为 "— tests/ 批次 1"
4. 每个代理的 prompt 中增加测试审查说明：

测试文件审查重点调整：
- 正确性: 断言是否充分、测试覆盖是否有盲区、断言条件是否正确
- 性能: mock 是否合理、是否有不必要的重型操作
- 复用/DRY: 测试 setup/teardown 是否重复、共享 fixture 是否可提取
- 可维护性: 测试是否过长、测试意图是否清晰
- 健壮性: 测试是否依赖时序/随机性、是否有脆弱的硬编码

- [ ] **Step 2: 等待 5 个代理全部完成**

Run: `ls -la docs/superpowers/review/*-tests-1.md | wc -l`
Expected: 5

- [ ] **Step 3: 提交 Round 2 结果**

```bash
git add docs/superpowers/review/*-tests-1.md
git commit -m "review: 完成测试审查 Round 2 — 5 维度 tests/ 批次 1 审查结果"
```

---

## Task 4: Round 3 — tests/ 批次 2 审查（5 代理并行）

**Files:**
- Create: `docs/superpowers/review/correctness-tests-2.md`
- Create: `docs/superpowers/review/performance-tests-2.md`
- Create: `docs/superpowers/review/dry-tests-2.md`
- Create: `docs/superpowers/review/maintainability-tests-2.md`
- Create: `docs/superpowers/review/robustness-tests-2.md`

**审查范围（17 文件, 4277 行）:**

```
tests/test-symbol-index.js (555), tests/test-tcl-ast-variables.js (536),
tests/test-tcl-scope-index.js (481), tests/test-definitions.js (340),
tests/test-signature-provider.js (322), tests/benchmark-firstload.js (271),
tests/test-expression-quickpick.js (269), tests/test-pp-define.js (243),
tests/test-scheme-dup-def-diagnostic.js (205), tests/test-tcl-ast-utils.js (185),
tests/test-tcl-scope-map.js (173), tests/test-variable-reference.js (168),
tests/test-undef-var-integration.js (139), tests/test-quote-auto-delete.js (128),
tests/test-symbol-reference.js (96), tests/test-scheme-analyzer.js (88),
tests/test-scheme-var-refs.js (78)
```

- [ ] **Step 1: 并行派发 5 个子代理**

与 Task 3 完全相同的配置，区别：
1. 文件列表替换为上述 17 个测试文件
2. 输出文件名后缀改为 `-tests-2.md`
3. 报告标题改为 "— tests/ 批次 2"

- [ ] **Step 2: 等待 5 个代理全部完成**

Run: `ls -la docs/superpowers/review/*-tests-2.md | wc -l`
Expected: 5

- [ ] **Step 3: 提交 Round 3 结果**

```bash
git add docs/superpowers/review/*-tests-2.md
git commit -m "review: 完成测试审查 Round 3 — 5 维度 tests/ 批次 2 审查结果"
```

---

## Task 5: 汇总最终报告

**Files:**
- Create: `docs/superpowers/review/FINAL-REPORT.md`

- [ ] **Step 1: 合并 15 个 md 为维度总结**

读取全部 15 个审查结果文件，按维度合并为 5 个维度总结（src + tests-1 + tests-2 合并），生成最终报告。

最终报告结构：
```markdown
# sentaurus-syntax-highlight 代码审查报告

审查日期: 2026-05-09
审查范围: src/ 39 文件 + tests/ 35 文件 (18,255 行)
审查维度: 5 (正确性/性能/复用/可维护性/健壮性)

## 概览
| 维度 | 高 | 中 | 低 | 合计 |
|------|---|---|---|------|
| Bug/正确性 | X | X | X | X |
| 性能 | X | X | X | X |
| 复用/DRY | X | X | X | X |
| 可维护性 | X | X | X | X |
| 健壮性 | X | X | X | X |
| **合计** | **X** | **X** | **X** | **X** |

## 1. Bug/正确性
(合并 correctness-src.md + correctness-tests-1.md + correctness-tests-2.md)

## 2. 性能
(合并 performance-src.md + performance-tests-1.md + performance-tests-2.md)

## 3. 复用/DRY
(合并 dry-src.md + dry-tests-1.md + dry-tests-2.md)

## 4. 可维护性
(合并 maintainability-src.md + maintainability-tests-1.md + maintainability-tests-2.md)

## 5. 健壮性
(合并 robustness-src.md + robustness-tests-1.md + robustness-tests-2.md)

## 后续行动建议
(按优先级排列的修复建议)
```

- [ ] **Step 2: 提交最终报告**

```bash
git add docs/superpowers/review/FINAL-REPORT.md
git commit -m "review: 添加代码审查最终汇总报告"
```

- [ ] **Step 3: 合并到 main 分支**

```bash
cd D:/CODE/Project/sentaurus-syntax-highlight
git merge sentaurus-review/code-review
```

- [ ] **Step 4: 清理工作树**

```bash
git worktree remove ../sentaurus-review
git branch -d code-review
```
