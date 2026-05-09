# 全面代码审查设计方案

**日期**: 2026-05-09
**状态**: 已批准
**目标**: 对 sentaurus-syntax-highlight 项目进行全面代码审查，纯诊断型，输出分类问题集供后续统一修复

## 审查范围

| 批次 | 文件范围 | 文件数 | 行数 | Token 估算 |
|------|----------|--------|------|------------|
| **Batch 0 (源码)** | src/ 全部 JS 文件 | 39 | 9,632 | ~88-117K |
| **Batch 1 (测试上)** | tests/ 18 文件 | 18 | 4,346 | ~17K |
| **Batch 2 (测试下)** | tests/ 17 文件 | 17 | 4,277 | ~17K |

### 排除范围

- JSON 数据文件（syntaxes/*.json 文档数据）
- TextMate 语法文件（syntaxes/*.tmLanguage.json）
- scripts/ 工具脚本（非运行时代码）
- 配置文件（package.json 等）

### Tests 分批详情

**Batch 1 (18 文件, 4346 行)**:
```
tests/benchmark.js, tests/test-expression-converter.js, tests/test-sdevice-semantic.js,
tests/test-tcl-document-symbol.js, tests/test-scheme-parser.js, tests/test-parse-cache.js,
tests/test-scope-analyzer.js, tests/test-sdevice-vector-keywords.js,
tests/test-tcl-preprocessor.js, tests/test-region-undef-diagnostic.js,
tests/test-semantic-dispatcher.js, tests/test-scheme-undef-diagnostic.js,
tests/test-scheme-on-enter.js, tests/test-unit-auto-close.js,
tests/test-symbol-completion.js, tests/test-semantic-tokens.js,
tests/test-tcl-var-refs.js, tests/test-snippet-prefixes.js
```

**Batch 2 (17 文件, 4277 行)**:
```
tests/test-symbol-index.js, tests/test-tcl-ast-variables.js,
tests/test-tcl-scope-index.js, tests/test-definitions.js,
tests/test-signature-provider.js, tests/benchmark-firstload.js,
tests/test-expression-quickpick.js, tests/test-pp-define.js,
tests/test-scheme-dup-def-diagnostic.js, tests/test-tcl-ast-utils.js,
tests/test-tcl-scope-map.js, tests/test-variable-reference.js,
tests/test-undef-var-integration.js, tests/test-quote-auto-delete.js,
tests/test-symbol-reference.js, tests/test-scheme-analyzer.js,
tests/test-scheme-var-refs.js
```

## 审查维度与代理分配

| 代理名 | 维度 | 模型 | 审查重点 |
|--------|------|------|----------|
| Agent-1 | Bug/正确性 | Sonnet | 逻辑错误、边界遗漏、类型误用、正则误匹配、返回值未检查 |
| Agent-2 | 性能 | Sonnet | 不必要重复计算、内存泄漏（WASM tree.delete）、低效数据结构/遍历、缓存失效策略 |
| Agent-3 | 复用/DRY | Sonnet | 重复代码模式、可提取的公共函数、跨文件相似逻辑 |
| Agent-4 | 可维护性 | Haiku | 过长函数（>100行）、职责不清、文件过大、命名不当 |
| Agent-5 | 健壮性 | Haiku | 缺失错误处理、未防御的外部输入、空值/undefined 风险 |

### 维度边界说明

每个子代理**只报告自己维度的问题**，不交叉报告：
- Bug/正确性：只关注"代码是否做了它该做的事"
- 性能：只关注"是否存在不必要的性能开销"
- 复用/DRY：只关注"是否存在可消除的重复"
- 可维护性：只关注"代码结构是否清晰可维护"
- 健壮性：只关注"代码对异常情况的防御"

## 执行流程

```
Round 1: 5 代理并行审查 src/ (Batch 0) → 各自写入结果 md
    ↓
Round 2: 5 代理并行审查 tests/ Batch 1 → 各自写入结果 md
    ↓
Round 3: 5 代理并行审查 tests/ Batch 2 → 各自写入结果 md
    ↓
主代理汇总: 合并 15 个 md 为最终分类问题报告
```

## 输出规范

### 文件持久化

每个代理每个批次独立持久化为一个 md 文件，存放于 `docs/superpowers/review/`：

```
docs/superpowers/review/
├── correctness-src.md          ← Agent-1 Round 1
├── correctness-tests-1.md      ← Agent-1 Round 2
├── correctness-tests-2.md      ← Agent-1 Round 3
├── performance-src.md          ← Agent-2
├── performance-tests-1.md
├── performance-tests-2.md
├── dry-src.md                  ← Agent-3
├── dry-tests-1.md
├── dry-tests-2.md
├── maintainability-src.md      ← Agent-4
├── maintainability-tests-1.md
├── maintainability-tests-2.md
├── robustness-src.md           ← Agent-5
├── robustness-tests-1.md
└── robustness-tests-2.md
```

共 15 个 md 文件。

### 问题条目格式

```markdown
- **[严重度]** `文件路径:行号` — 问题描述
  - 当前代码: `关键代码片段`
  - 建议改进: `改进方案`
```

严重度：高 / 中 / 低

每个 md 文件结构：
```markdown
# [维度名称] 审查报告 — [批次名称]

审查范围: [文件列表概要]
发现问题数: X

## 高严重度
(问题条目)

## 中严重度
(问题条目)

## 低严重度
(问题条目)

## 总结
(该维度该批次的总体评估)
```

### 测试审查说明

测试文件的审查重点不同于源码：
- **正确性**: 断言是否充分、测试覆盖是否有盲区
- **性能**: mock 是否合理、是否有不必要的重型操作
- **复用/DRY**: 测试 setup/teardown 是否重复、共享 fixture 是否可提取
- **可维护性**: 测试是否过长、测试意图是否清晰
- **健壮性**: 测试是否依赖时序/随机性、是否有脆弱的硬编码

## 子代理 Prompt 模板

每个子代理收到的 prompt 包含：
1. **角色与维度定义** — 该代理负责的问题类型、排除范围、与其他维度的边界
2. **项目上下文** — CLAUDE.md 架构摘要、文件清单、模块依赖
3. **待审查文件列表** — 该批次的完整文件路径
4. **输出格式要求** — 标准化的 md 格式、文件路径、严重度定义
5. **输出文件路径** — 该代理该批次应写入的 md 文件路径
