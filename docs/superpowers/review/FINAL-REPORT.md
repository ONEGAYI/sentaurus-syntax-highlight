# sentaurus-syntax-highlight 代码审查报告

**审查日期**: 2026-05-09
**审查范围**: src/ 39 文件 (9,632 行) + tests/ 35 文件 (8,623 行) = 74 文件, 18,255 行
**审查维度**: 5 (正确性 / 性能 / 复用·DRY / 可维护性 / 健壮性)
**执行方式**: 3 轮 × 5 并行子代理 (3 Sonnet + 2 Haiku)

---

## 概览

| 维度 | src | tests-1 | tests-2 | 合计 |
|------|----:|--------:|--------:|-----:|
| Bug/正确性 | 5 | 6 | 12 | **23** |
| 性能 | 8 | 9 | 8 | **25** |
| 复用/DRY | 7 | 7 | 10 | **24** |
| 可维护性 | 10 | 14 | 15 | **39** |
| 健壮性 | 7 | 7 | 8 | **22** |
| **合计** | **37** | **43** | **53** | **133** |

### 按严重度分布

| 维度 | 高 | 中 | 低 | 合计 |
|------|---:|---:|---:|-----:|
| Bug/正确性 | 7 | 11 | 5 | 23 |
| 性能 | 9 | 12 | 4 | 25 |
| 复用/DRY | 7 | 10 | 7 | 24 |
| 可维护性 | 10 | 22 | 7 | 39 |
| 健壮性 | 7 | 14 | 1 | 22 |
| **合计** | **40** | **69** | **24** | **133** |

---

## 跨维度 Top 关键问题

以下问题在多个维度中被独立标记，属于最高优先级：

### 1. `variable-reference-provider.js:208` — `root` 未定义变量 (正确性 + 健壮性)
Tcl 文件执行 Find All References 时必定触发 `ReferenceError: root is not defined` 崩溃。

### 2. `scheme-parser.js:140` — Quote 后 EOF 空指针 (正确性 + 健壮性)
`'` 后紧跟 EOF 时 `parseExpr()` 返回 null，解引用 `.end` 抛出 TypeError，导致 Scheme 解析管线失效。

### 3. `extension.js` Provider 回调缺少 try-catch (健壮性)
Hover/Definition/Completion/SignatureHelp 共 4 类 Provider 未包裹 try-catch，异常会导致功能静默永久失效。

### 4. `tcl-ast-utils.js` 遗留双轨代码 ~420 行 (性能 + 复用 + 可维护性)
`buildScopeMap` 旧管线已被 `buildScopeIndex`/`ScopeIndex` 替代，但旧代码完整保留。三维度共标记此问题。

### 5. `extension.js` activate() 1008 行 (可维护性 + 复用)
函数体过长，Provider 注册/文档加载/命令注册应拆分。

### 6. 测试 `makeNode()` 在 7 个文件中重复 (复用 + 性能 + 可维护性)
每次调用创建闭包和嵌套对象，建议提取 `tests/helpers/mock-tcl-node.js`。

### 7. `benchmark.js` setTimeout(2000) 硬编码等待 WASM (性能 + 健壮性)
慢速 CI 环境可能触发竞态条件，导致 Tcl WASM 基准测试静默跳过。

---

## 1. Bug/正确性 (23 问题)

详细报告：
- [correctness-src.md](correctness-src.md) — 5 问题
- [correctness-tests-1.md](correctness-tests-1.md) — 6 问题
- [correctness-tests-2.md](correctness-tests-2.md) — 12 问题

**源码核心发现**：
- `variable-reference-provider.js:208` 引用未定义变量 `root`
- `tcl-funcall-semantic.js:21` 使用字节偏移而非行列位置，多字节字符下 token 位置错位
- `scheme-parser.js:135-143` Quote 后 EOF 空指针异常
- `scope-analyzer.js:118` 分支缺少 `children[0].type` guard

**测试核心发现**：
- `test-scheme-on-enter.js` 空括号测试用硬编码常量替代实际函数调用
- `test-tcl-ast-variables.js` 使用弱断言（`vars.some()` / `vars.length >= N`）无法检测误提取
- `benchmark-firstload.js` 无任何断言（纯输出文件，CI 无法捕获回归）
- `test-undef-var-integration.js` 重新定义 `assert` 遮蔽 Node 模块

---

## 2. 性能 (25 问题)

详细报告：
- [performance-src.md](performance-src.md) — 8 问题
- [performance-tests-1.md](performance-tests-1.md) — 9 问题
- [performance-tests-2.md](performance-tests-2.md) — 8 问题

**源码核心发现**：
- `tcl-ast-utils.js` `buildScopeMap` O(lines × defs × procs) 全量预计算（已有替代）
- `undef-var-diagnostic.js` 逐引用调用 `getVisibleDefinitions`，每次遍历作用域树
- `symbol-completion.js` / `symbol-reference-provider.js` / `region-undef-diagnostic.js` 各自独立调用 `extractSymbols`
- `tcl-symbol-configs.js` `getSdeviceAllSectionKeywordsLower()` 每次重建 Set

**测试核心发现**：
- `benchmark.js` 文件 I/O 混入基准计时，测量结果不稳定
- `test-sdevice-semantic.js` 约 25 个测试各自重建关键词索引（2117+ 关键词）
- `benchmark-firstload.js` 冷启动计时包含初始化开销

**正面评价**：项目缓存架构（`SchemeParseCache` + `TclParseCache`）设计良好，WASM tree 内存管理正确。

---

## 3. 复用/DRY (22 问题)

详细报告：
- [dry-src.md](dry-src.md) — 7 问题
- [dry-tests-1.md](dry-tests-1.md) — 7 问题
- [dry-tests-2.md](dry-tests-2.md) — 10 问题

**源码核心发现**：
- `tcl-ast-utils.js` ~300 行死代码（旧管线已由新管线替代但未删除）
- `effectiveChildren()` 在 `semantic-dispatcher.js` 和 `symbol-index.js` 中完全重复
- 4 个诊断 Provider 共享 ~160 行 activate/debounce/register 模式
- `decodeHtml` 在 `extension.js` 和 `undef-var-diagnostic.js` 中各实现一次

**测试核心发现**：
- test runner 样板（`passed/failed` + `test()`）在 29 个文件中完全重复
- `SYMBOL_TABLE` 在 3 个文件中完全相同地复制
- `makeNode()` 在 7 个 Tcl 测试文件中完全相同
- SDEVICE token 解码循环内联 7 次

**修复建议**：创建 `tests/helpers/` 目录下 5 个共享模块，预估消除 ~445 行重复代码。

---

## 4. 可维护性 (39 问题)

详细报告：
- [maintainability-src.md](maintainability-src.md) — 10 问题
- [maintainability-tests-1.md](maintainability-tests-1.md) — 14 问题
- [maintainability-tests-2.md](maintainability-tests-2.md) — 15 问题

**源码核心发现**：
- `tcl-ast-utils.js` (1844 行) 承担 6 类独立职责，应拆为 4-5 个模块
- `extension.js` `activate()` 函数体 1008 行，应拆分 Provider 注册/文档加载/命令注册
- `_collectLocalDefsForIndex` 与 `_collectLocalDefs` ~160 行高度重复
- `sdevice-semantic-provider.js` `extractTokensFromStacks` 153 行 6 阶段单函数

**测试核心发现**：
- 6 个测试文件超过 150 行阈值（最大 647 行 `benchmark.js`）
- `makeNode` 在 7 个文件中重复定义
- `test-sdevice-vector-keywords.js` 全文裸 assert 无 `test()` 包装
- SDEVICE token 解码循环在同一文件中重复 6 次

**正面评价**：小文件 (<200 行) 的 logic/provider 分离模式设计优秀。

---

## 5. 健壮性 (22 问题)

详细报告：
- [robustness-src.md](robustness-src.md) — 7 问题
- [robustness-tests-1.md](robustness-tests-1.md) — 7 问题
- [robustness-tests-2.md](robustness-tests-2.md) — 8 问题

**源码核心发现**：
- `variable-reference-provider.js:208` `root` 未定义 → Tcl Find All References 必崩
- `scheme-parser.js:140` Quote 后 EOF → TypeError → Scheme 解析管线失效
- `extension.js` 4 类 Provider 回调无 try-catch → 异常时功能静默永久失效
- `tcl-parser-wasm.js:198` WASM `parse()` 无 try-catch
- 多个文件中 `lineStarts[line - 1]` 数组越界访问未防御

**测试核心发现**：
- `benchmark.js` `setTimeout(2000)` 等待 WASM 初始化存在竞态条件
- `test-undef-var-integration.js` 唯一依赖真实 WASM 的测试，缺少可用性检查
- 5 个文件各自重复 `makeNode()` mock，与真实 AST 接口可能不同步

---

## 后续行动建议

### 紧急修复 (高严重度，直接影响用户)

| # | 问题 | 文件 | 维度 | 预估工时 |
|---|------|------|------|----------|
| 1 | `root` 未定义变量 | variable-reference-provider.js:208 | 正确性+健壮性 | 10 min |
| 2 | Quote 后 EOF 空指针 | scheme-parser.js:140 | 正确性+健壮性 | 15 min |
| 3 | Provider 回调无 try-catch | extension.js | 健壮性 | 30 min |
| 4 | WASM parse() 无 try-catch | tcl-parser-wasm.js:198 | 健壮性 | 10 min |
| 5 | lineStarts 越界访问 | 多文件 | 健壮性 | 20 min |

### 短期改进 (高严重度，性能与架构)

| # | 问题 | 影响 | 预估工时 |
|---|------|------|----------|
| 6 | 删除 tcl-ast-utils.js 遗留代码 ~420 行 | 性能+DRY+可维护性 | 2 h |
| 7 | 拆分 tcl-ast-utils.js 为 4-5 模块 | 可维护性 | 4 h |
| 8 | 拆分 extension.js activate() | 可维护性 | 3 h |
| 9 | 提取 Provider 诊断注册工厂函数 | DRY ~160 行 | 1 h |
| 10 | integrate extractSymbols 到缓存 | 性能 | 1 h |

### 中期重构 (中/低严重度)

| # | 问题 | 影响 | 预估工时 |
|---|------|------|----------|
| 11 | 创建 tests/helpers/ 共享模块 | DRY ~445 行 | 2 h |
| 12 | 修复 benchmark.js 竞态条件 | 性能+健壮性 | 1 h |
| 13 | 统一测试格式（test() 包装器） | 可维护性 | 1 h |
| 14 | 修复弱断言测试用例 | 正确性 | 1 h |

---

## 附录：审查报告文件清单

| 文件 | 维度 | 批次 |
|------|------|------|
| [correctness-src.md](correctness-src.md) | Bug/正确性 | src/ |
| [correctness-tests-1.md](correctness-tests-1.md) | Bug/正确性 | tests/ 批次 1 |
| [correctness-tests-2.md](correctness-tests-2.md) | Bug/正确性 | tests/ 批次 2 |
| [performance-src.md](performance-src.md) | 性能 | src/ |
| [performance-tests-1.md](performance-tests-1.md) | 性能 | tests/ 批次 1 |
| [performance-tests-2.md](performance-tests-2.md) | 性能 | tests/ 批次 2 |
| [dry-src.md](dry-src.md) | 复用/DRY | src/ |
| [dry-tests-1.md](dry-tests-1.md) | 复用/DRY | tests/ 批次 1 |
| [dry-tests-2.md](dry-tests-2.md) | 复用/DRY | tests/ 批次 2 |
| [maintainability-src.md](maintainability-src.md) | 可维护性 | src/ |
| [maintainability-tests-1.md](maintainability-tests-1.md) | 可维护性 | tests/ 批次 1 |
| [maintainability-tests-2.md](maintainability-tests-2.md) | 可维护性 | tests/ 批次 2 |
| [robustness-src.md](robustness-src.md) | 健壮性 | src/ |
| [robustness-tests-1.md](robustness-tests-1.md) | 健壮性 | tests/ 批次 1 |
| [robustness-tests-2.md](robustness-tests-2.md) | 健壮性 | tests/ 批次 2 |
