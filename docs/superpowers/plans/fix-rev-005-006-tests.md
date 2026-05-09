# Plan: REV-005 (DRY) + REV-006 (测试质量) 联合修复

> **Issues**: #30 + #33 | **分支**: `fix-rev-005-006-tests`
> **策略**: 两个 Issue 问题高度交叉，按文件合并修改，每文件只碰一次

---

## 阶段 1: 创建共享 Helper 模块 (Issue #30)

创建 `tests/helpers/` 目录下的 9 个共享模块，消除重复基础设施。

| # | 文件 | 消除的 DRY | 内容 |
|---|------|-----------|------|
| 1.1 | `test-runner.js` | DRY-1/8 | `test()`, `summary()`, `process.exit` 统一 |
| 1.2 | `mock-ast-node.js` | DRY-3/10/16 | `makeNode()` + `makeProcNode()` + `makeSetNode()` 工厂 |
| 1.3 | `symbol-fixtures.js` | DRY-2/9/13 | `SYMBOL_TABLE` + `CUBOID_TABLE` + `OFFSET_INTERFACE_MODES` |
| 1.4 | `mock-document.js` | DRY-5/12 | `mockDoc(uri, version, text)` — 统一参数顺序 |
| 1.5 | `mock-tcl-fixtures.js` | DRY-11 | `buildGlobalSetVar()`, `buildProcWithBody()` 等 Tcl AST 构造器 |
| 1.6 | `sdevice-setup.js` | DRY-4/6 | `decodeTokens()` + 预构建 `{ docs, index, sectionKeywords }` |
| 1.7 | `scheme-parse.js` | DRY-17 | `parseScheme(code)` 返回 `{ ast, analysis, scopeTree, errors, text }` |
| 1.8 | `init-tcl-parser.js` | DRY-15 | WASM 初始化封装（含友好错误提示） |
| 1.9 | `generate-scheme-code.js` | DRY-15 | 合成代码生成器 |

**验证**: 每个模块创建后立即 `node -e "require('./tests/helpers/xxx')"` 确认可加载。

---

## 阶段 2: 迁移测试文件 + 修复质量问题 (Issue #30 + #33)

按文件分组，每个文件同时完成 DRY 迁移和质量修复，避免重复触碰。

### 2.1 简单迁移组（仅替换 test-runner + makeNode 样板）

| 文件 | DRY 改动 | #33 质量改动 |
|------|----------|-------------|
| `test-tcl-ast-utils.js` | → test-runner + mock-ast-node | — |
| `test-tcl-var-refs.js` | → test-runner + mock-ast-node | — |
| `test-tcl-scope-map.js` | → test-runner + mock-ast-node + mock-tcl-fixtures | — |
| `test-variable-reference.js` | → test-runner + mock-ast-node | 验证 `refs[0].line` |
| `test-scheme-parser.js` | → test-runner | — |
| `test-scope-analyzer.js` | → test-runner | — |
| `test-semantic-dispatcher.js` | → test-runner | — |
| `test-robustness-p0.js` | → test-runner | — |
| `test-scheme-dup-def-diagnostic.js` | → test-runner | — |
| `test-tcl-preprocessor.js` | → test-runner | — |
| `test-expression-quickpick.js` | → test-runner | — |

### 2.2 中等迁移组（需要额外 helper）

| 文件 | DRY 改动 | #33 质量改动 |
|------|----------|-------------|
| `test-region-undef-diagnostic.js` | → test-runner + symbol-fixtures | — |
| `test-symbol-completion.js` | → test-runner + symbol-fixtures | — |
| `test-symbol-reference.js` | → test-runner + symbol-fixtures | — |
| `test-symbol-index.js` | → test-runner + symbol-fixtures (CUBOID_TABLE, OFFSET_MODES) | — |
| `test-definitions.js` | → test-runner + mock-document | — |
| `test-parse-cache.js` | → test-runner + mock-document | — |
| `test-tcl-document-symbol.js` | → test-runner + mock-ast-node | — |
| `test-tcl-scope-index.js` | → test-runner + mock-ast-node + mock-tcl-fixtures | 用公共 API 替代 `_procScopes` (#33 高) |
| `test-tcl-ast-variables.js` | → test-runner + mock-ast-node | 强化弱断言 `vars.some()` → `strictEqual(vars.length, N)` (#33 高) |

### 2.3 复杂迁移组（多 helper + 多质量修复）

| 文件 | DRY 改动 | #33 质量改动 |
|------|----------|-------------|
| `test-sdevice-semantic.js` | → test-runner + sdevice-setup | 一次性构建 index（消除 25 处重复构建）；`text.split` 提取为常量 |
| `test-sdevice-vector-keywords.js` | → test-runner + sdevice-setup | 包裹裸 assert 为 test()；添加 process.exit |
| `test-signature-provider.js` | → test-runner + scheme-parse | 提取 CIRCLE_DOCS 常量；createMockCache 优化 |
| `test-scheme-on-enter.js` | → test-runner | 用实际函数调用替代 `1 <= 1` 硬编码 (#33 高) |
| `test-scheme-analyzer.js` | → test-runner + scheme-parse | 添加 line/start/end 位置字段验证 |
| `test-scheme-undef-diagnostic.js` | → test-runner | 验证参数标识符误报情况 |
| `test-scheme-var-refs.js` | → test-runner | 断言 x 的引用总数 |
| `test-semantic-tokens.js` | → test-runner | 添加 delta 编码注释/辅助 |
| `test-pp-define.js` | → test-runner | 澄清测试描述；require 移至顶部 |
| `test-undef-var-integration.js` | → init-tcl-parser | try-catch 包裹 require('web-tree-sitter') (#33 高) |

### 2.4 框架统一组（#33 格式一致性）

| 文件 | 改动 |
|------|------|
| `test-unit-auto-close.js` | 包裹裸 assert 为 test()；添加 summary + process.exit |
| `test-quote-auto-delete.js` | 包裹裸 assert 为 test()；添加 summary + process.exit |
| `test-snippet-prefixes.js` | 统一为 test() 包装器；替换内嵌实现为源码导入 |
| `test-undef-var-integration.js` | 移除 `assert` 函数遮蔽，使用全局 `require('assert')` |

### 2.5 基准测试修复组（#33 二、基准测试）

| 文件 | 改动 |
|------|------|
| `benchmark.js` | ① 分离文件 I/O 与 `JSON.parse` 计时 ② `await initTclWasm()` 替代 `setTimeout(2000)` ③ 精确标注 "5x" 实际操作次数 ④ generateSchemeCode → 导入共享模块 |
| `benchmark-firstload.js` | ① 缩放测试分离初始化成本 ② 100 次热循环添加 5 轮预热 ③ generateSchemeCode → 导入共享模块 ④ display_test 文件读取添加守卫 |

---

## 阶段 3: 验证

1. **全量回归测试**: `ls tests/test-*.js | xargs -I{} node {}` — 35 个测试全部通过
2. **Helper 模块加载验证**: 确认 9 个 helper 模块均可正确 require
3. **基准测试运行**: 确认 benchmark.js 和 benchmark-firstload.js 可执行（benchmark-firstload 允许在 display_test 缺失时跳过）
4. **行数统计**: `git diff --stat` 确认净减少 ~800+ 行

---

## 执行策略

- **阶段 1** 用 2-3 个并行子代理，每个负责 3-4 个 helper 模块
- **阶段 2** 按组分配子代理，每组负责 4-6 个文件
- **阶段 3** 主代理统一执行验证

### 并发分组建议

| 子代理 | 阶段 1 | 阶段 2 |
|--------|--------|--------|
| Agent A | 1.1 test-runner, 1.2 mock-ast-node, 1.3 symbol-fixtures | 2.1 简单迁移组 |
| Agent B | 1.4 mock-document, 1.5 mock-tcl-fixtures, 1.6 sdevice-setup | 2.2 中等迁移组 |
| Agent C | 1.7 scheme-parse, 1.8 init-tcl-parser, 1.9 generate-scheme-code | 2.3 复杂迁移组 |
| Agent D | — | 2.4 框架统一组 + 2.5 基准测试修复组 |

### 依赖关系

```
阶段 1 (所有 helper 模块) ──→ 阶段 2 (迁移+修复) ──→ 阶段 3 (验证)
```

阶段 1 内部各模块无依赖，可完全并行。阶段 2 严格依赖阶段 1 完成。
