# 可维护性审查报告 — tests/ 批次 2

审查范围: 17 文件, 4189 行
发现问题数: 15

---

## 高严重度

### H1. `test-symbol-index.js` 555 行，严重超出 150 行阈值

**文件**: `tests/test-symbol-index.js` (555 行)
**问题**: 该文件覆盖了 6 个逻辑分区：`resolveSymbolName` 基础测试、`extractSymbols` 基础测试、`modeDispatch` 模式分发、`type auto` 自动类型推断、用户自定义函数（lambda 形式）、简写形式用户函数。其中 `modeDispatch` 相关测试（第 195-298 行）存在大量重复的 `symbolTable` 和 `modeTable` 配置对象，每个测试用例 15-20 行的样板代码中仅有 1-2 行断言值不同。
**建议**: (1) 拆分为 `test-symbol-index-resolve.js`（resolveSymbolName）和 `test-symbol-index-extract.js`（extractSymbols + modeDispatch + 用户函数）。(2) `modeDispatch` 测试可提取公共的 `createOffsetTable(modeType)` 辅助函数，用参数化方式生成 symbolTable/modeTable。

### H2. `test-tcl-ast-variables.js` 536 行，严重超出 150 行阈值

**文件**: `tests/test-tcl-ast-variables.js` (536 行)
**问题**: 覆盖了 set 变量提取、proc 函数/参数提取、foreach 循环变量、for 循环变量、嵌套结构、while 节点、空 AST、混合场景、lmap/dict for/incr 共 10 个分区。绝大部分测试用例的 AST 节点构建代码占总行数的 70-80%（每个测试用例 20-40 行，其中断言仅 3-8 行），样板代码膨胀严重。
**建议**: (1) 拆分为 `test-tcl-ast-variables-set.js`（set/env/空 AST）和 `test-tcl-ast-variables-control.js`（proc/foreach/for/while/lmap/dict/混合）。(2) 提取高频 AST 构建模式为辅助函数，如 `makeSetNode(varName, value, row)`、`makeProcNode(name, args, body, row)` 等。

### H3. `test-tcl-scope-index.js` 481 行，超出 150 行阈值

**文件**: `tests/test-tcl-scope-index.js` (481 行)
**问题**: 覆盖了 `buildScopeIndex` 基础测试（10 个用例）和 `resolveDefinition` 测试（7 个用例），共计 17 个用例。与 `test-tcl-ast-variables.js` 同样的问题——`makeNode` 样板代码占比过高（约 75%）。resolveDefinition 部分的 for 循环作用域测试（第 340-478 行）连续 3 个用例构建了几乎相同的 for 循环 AST 结构，仅在行号参数上不同。
**建议**: (1) 拆分为 `test-tcl-scope-index-build.js`（buildScopeIndex 相关）和 `test-tcl-scope-index-resolve.js`（resolveDefinition 相关）。(2) 提取 `makeForLoopAST(initVar, initVal, bodyVar, ...)` 辅助函数消除 for 循环测试的 AST 构建重复。

---

## 中严重度

### M1. `test-definitions.js` 340 行，超出 150 行阈值

**文件**: `tests/test-definitions.js` (340 行)
**问题**: 覆盖了 `findBalancedExpression`、`extractSchemeDefinitions`、`extractTclDefinitionsAst`、`extractDefinitions`、`truncateDefinitionText`、`getDefinitions`（缓存）、`invalidateDefinitionCache` 共 7 个逻辑分区。前两个分区（行 13-191）占文件一半以上，是两个独立模块的职责混合。
**建议**: 拆分为 `test-definitions-parser.js`（findBalancedExpression + extractSchemeDefinitions）和 `test-definitions-cache.js`（getDefinitions 缓存 + invalidateDefinitionCache + truncateDefinitionText）。

### M2. `test-signature-provider.js` 322 行，超出 150 行阈值

**文件**: `tests/test-signature-provider.js` (322 行)
**问题**: 覆盖了 `buildSignatureLabel`、`buildParams`、`provideSignatureHelp`（含模式分派/基本签名/非函数调用/右括号自动补全/注释偏移 bug 修复）、用户定义函数签名 fallback 共 7 个分区。注释偏移 bug 修复部分（第 168-243 行）的 3 个测试用例存在大量重复的 `funcDocs` 配置对象。
**建议**: 拆分为 `test-signature-label.js`（buildSignatureLabel + buildParams）和 `test-signature-provider-e2e.js`（provideSignatureHelp 集成测试）。

### M3. `benchmark-firstload.js` 271 行，超出 150 行阈值且缺乏断言机制

**文件**: `tests/benchmark-firstload.js` (271 行)
**问题**: 该文件是一个性能诊断脚本，包含 9 个阶段的计时测量，但没有任何 `assert` 或 `test()` 调用。所有结果仅通过 `console.log` 输出，不存在失败/通过判定。阶段 8 的缩放测试中 `[100, 500, 1000, 2000, 4000]` 行数目标为魔法数字，且 `generateSchemeCode` 辅助函数内嵌套循环中有 `8`（`Math.min(8, lines - i)`）作为魔法数字。
**建议**: (1) 添加基础的性能回归断言（如 `assert.ok(totalPipeline < 500, '管线总耗时应 < 500ms')`）。(2) 将行数目标和函数体行数提取为顶部常量。

### M4. `test-expression-quickpick.js` 269 行，超出 150 行阈值

**文件**: `tests/test-expression-quickpick.js` (269 行)
**问题**: 覆盖了 CursorTracker（9 个用例）、getWordAtPosition（20 个用例）、replaceWordAtPosition（5 个用例）、parseHistoryInput（7 个用例）共 4 个分区。`getWordAtPosition` 分区中尖括号相关的 8 个测试用例有较强的逻辑分组，但混在普通标识符测试之间，定位特定场景需要线性扫描。
**建议**: 拆分为 `test-cursor-tracker.js`（CursorTracker）和 `test-expression-quickpick-words.js`（getWordAtPosition + replaceWordAtPosition + parseHistoryInput）。或在文件内用更明显的注释分隔符（如 `═══ 尖括号变量场景 ═══`）区分子分区。

### M5. `test-pp-define.js` 243 行，超出 150 行阈值

**文件**: `tests/test-pp-define.js` (243 行)
**问题**: 覆盖了 extractPpDefines（8 个用例）、extractPpUndefs（2 个用例）、findPpDefineRefs（8 个用例）、Provider 集成（2 个用例）、buildPpDefineTokens（3 个用例）共 5 个分区。行 103 处 `const { findPpDefineRefs } = require(...)` 是在文件中间引入依赖，而非文件顶部，打破了 Node.js 模块的常见约定。
**建议**: (1) 将所有 require 调用移至文件顶部。(2) 可拆分为 `test-pp-define-extract.js`（提取/取消定义）和 `test-pp-define-refs.js`（引用查找和 Token 生成）。

### M6. `test-scheme-dup-def-diagnostic.js` 205 行，超出 150 行阈值

**文件**: `tests/test-scheme-dup-def-diagnostic.js` (205 行)
**问题**: 覆盖了全局/函数体/let 绑定/不同作用域隔离/条件分支共 17 个测试用例。文件中间定义了 `findDuplicateDefs` 辅助函数（第 25-71 行，47 行），该函数重复实现了 scope-analyzer 的遍历逻辑，而非直接调用被测模块的 API。如果 scope-analyzer 的数据结构变化，需要同步修改此辅助函数。
**建议**: (1) 检查是否可直接使用 `scope-analyzer` 模块暴露的方法替代自建的 `findDuplicateDefs`。(2) 如果必须自建，将其提取到文件顶部或 `tests/helpers/` 目录中。

### M7. `makeNode` 函数在 7 个文件中重复定义

**文件**: `tests/test-tcl-ast-utils.js`、`tests/test-tcl-ast-variables.js`、`tests/test-tcl-scope-index.js`、`tests/test-tcl-scope-map.js`、`tests/test-variable-reference.js`、`tests/test-tcl-document-symbol.js`（批次1）、`tests/test-tcl-var-refs.js`（批次1）
**问题**: 完全相同的 `makeNode` 函数（11 行）在 7 个文件中重复出现。如果 tree-sitter mock 节点的 API 发生变化（如增加 `startIndex`/`endIndex` 字段），需要在所有 7 个文件中同步修改。
**建议**: 提取到 `tests/helpers/mock-tcl-node.js` 并统一引用。此问题在批次 1 的 M9 中已部分报告，批次 2 新增 4 个受影响文件（ast-variables、scope-index、scope-map、variable-reference），使问题规模扩大。

### M8. `test-quote-auto-delete.js` 缺乏 `test()` 包装，无结构化输出

**文件**: `tests/test-quote-auto-delete.js` (128 行)
**问题**: 全部 40+ 个断言使用裸 `assert.strictEqual(...)` 而非项目统一的 `test(name, fn)` 包装器。测试无分组标题、无通过/失败计数、无 `process.exit` 退出码。如果任意断言失败，进程直接崩溃，无法继续执行后续测试。文件末尾仅输出 `console.log('All quote-auto-delete tests passed!')` 一行。
**建议**: 统一使用 `test(name, fn)` 包装器。按逻辑分区（isBoundary 边界字符、shouldDelete 基本校验、shouldDelete 触发场景、shouldDelete 不触发场景）组织为命名的测试用例。

---

## 低严重度

### L1. `test-symbol-index.js` 中 modeDispatch 测试的 symbolTable/modeTable 重复配置

**文件**: `tests/test-symbol-index.js` (第 195-326 行)
**问题**: 4 个 modeDispatch 相关测试用例（offset-interface region/material、offset-block region/material）各自内联定义了完整的 `symbolTable` 和 `modeTable` 对象，每次约 15 行。4 个配置对象的差异仅在：字符串值（`"region"` vs `"material"`）、期望断言值、symbolParams 的 type 字段。modeTable 的 modes 结构完全相同。
**建议**: 提取 `createOffsetTableConfig(modeType, type)` 工厂函数，或定义测试数据表 `[{mode, symbolType, name, expectedType}]` 后循环执行。

### L2. `test-tcl-scope-index.js` 中 `_procScopes` 私有属性直接访问

**文件**: `tests/test-tcl-scope-index.js` (第 111-113 行)
**问题**: 测试通过 `index._procScopes[0]` 直接访问 ScopeIndex 内部私有属性。如果 ScopeIndex 重构内部数据结构（如改名为 `_procEntries` 或改为 Map），测试会静默失败而非明确报错。
**建议**: 考虑通过公开 API 验证行为（如通过 `resolveDefinition` 间接验证参数列表），而非直接访问内部属性。当前做法在测试内部结构时可以接受，但需在注释中注明依赖的内部契约。

### L3. `test-variable-reference.js` 同时测试 Scheme 和 Tcl 两种语言

**文件**: `tests/test-variable-reference.js` (168 行)
**问题**: 文件上半部分（第 1-85 行）测试 Scheme 变量引用，下半部分（第 87-168 行）测试 Tcl 变量引用。两种语言的测试依赖不同的模块（scheme-parser vs tcl-ast-utils），使用不同的辅助函数（`findVariableRefsScheme` vs `makeNode`）。但文件仅 168 行，未超阈值。
**建议**: 当前行数可接受。如果后续测试用例增长，建议按语言拆分。

### L4. `test-pp-define.js` 中 `buildPpDefineTokens` 的 token 数量断言过于宽泛

**文件**: `tests/test-pp-define.js` (第 219-240 行)
**问题**: 3 个 buildPpDefineTokens 测试中，`data.length % 5 === 0` 断言仅验证了 delta 编码格式正确，`data[4] === 1` 断言验证了第一个 token 的 modifier，但没有验证 token 的具体内容（名称、行列号）。这意味着即使 token 位置完全错误，测试也会通过。
**建议**: 补充对具体 delta 值的断言，如验证定义 token 的 `deltaLine`、`len` 是否匹配 `#define` 行的 THICKNESS/FLAG 位置。

---

## 总结

| 严重度 | 数量 | 关键问题 |
|--------|------|----------|
| 高     | 3    | 3 个文件严重超行（555/536/481 行），AST 样板代码占比 70-80% |
| 中     | 8    | 5 个文件超 150 行（340-271 行）、makeNode 7 文件重复、2 个文件缺 test() 包装 |
| 低     | 4    | 配置对象重复、私有属性访问、双语混合、断言宽泛 |

**核心发现**:
1. **行数问题集中在 AST mock 测试文件**: `test-symbol-index.js`、`test-tcl-ast-variables.js`、`test-tcl-scope-index.js` 三个文件共 1572 行，其中约 1100 行是 `makeNode` 样板代码。根本原因是缺少高层 AST 构建辅助函数
2. **`makeNode` 重复问题严重化**: 批次 1 已报告 2 个文件，批次 2 新增 4 个文件，累计 7 个文件包含完全相同的 11 行 mock 函数。这是一个系统性问题，应优先解决
3. **测试基础设施不一致**: `test-quote-auto-delete.js` 和 `benchmark-firstload.js` 两个文件未使用项目统一的 `test(name, fn)` 包装器（batch 1 已报告 3 个，batch 2 新增 2 个，累计 5 个）
4. **`test-pp-define.js` 的 require 位置不规范**: 中间位置的 require 打破了 Node.js 模块的组织惯例，降低了可读性
