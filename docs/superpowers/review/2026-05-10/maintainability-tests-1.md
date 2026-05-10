# 可维护性审查报告 — tests/ 批次 1

审查范围: 18 文件, 4346 行
发现问题数: 14

---

## 高严重度

### H1. `benchmark.js` 647 行，严重超出 150 行阈值

**文件**: `tests/benchmark.js` (647 行)
**问题**: 该文件作为基准测试脚本，承担了 6 个独立的测试套件（激活成本、Scheme 管线、Tcl 管线、Tcl WASM 管线、Scheme 缩放测试、内存快照），全部放在一个文件中。任何单个套件的修改都需要在 647 行文件中定位上下文。
**建议**: 按套件拆分为 `benchmark-activation.js`、`benchmark-scheme.js`、`benchmark-tcl.js`、`benchmark-tcl-wasm.js`、`benchmark-scaling.js`，提取公共的 `bench()` / `stats()` / 生成器到 `benchmark-utils.js`。

### H2. `test-expression-converter.js` 535 行，超出 150 行阈值

**文件**: `tests/test-expression-converter.js` (535 行)
**问题**: 该文件包含 7 个测试分区（prefixToInfix 基础/嵌套/函数/边界/连字符、infixToPrefix 多个分区、往返一致性），每个分区 50-120 行不等。文件过长，测试定位困难。
**建议**: 按转换方向拆分为 `test-prefix-to-infix.js` 和 `test-infix-to-prefix.js`，往返一致性测试可独立为 `test-roundtrip.js`。

### H3. `test-sdevice-semantic.js` 409 行，超出 150 行阈值

**文件**: `tests/test-sdevice-semantic.js` (409 行)
**问题**: 覆盖了 buildKeywordSectionIndex、getSectionStack、extractSdeviceTokens、edge cases、cache、case insensitive、sub-section deep nesting 共 7 个逻辑分区。token 解码循环（delta → absolute 位置转换）在文件内反复出现（第 103-121、130-140、147-161、204-212、220-227、347-360 行），共 6 处几乎相同的代码块。
**建议**: (1) 拆分为 `test-sdevice-semantic-core.js`（索引和栈）和 `test-sdevice-semantic-tokens.js`（token 提取和缓存）。(2) 提取重复的 token 解码逻辑为辅助函数 `decodeTokens(text, data)`。

### H4. `test-sdevice-vector-keywords.js` 使用裸 `assert` 而非 `test()` 包装，缺乏测试名称

**文件**: `tests/test-sdevice-vector-keywords.js` (249 行)
**问题**: 文件前 60 行全部使用裸 `assert.strictEqual(...)` 而非项目内统一的 `test(name, fn)` 包装器。运行失败时无法定位具体是哪个断言失败，也无法统计通过/失败数。裸代码块（第 85-187 行的 `{ ... }` 块）不输出任何测试进度信息。
**建议**: 统一使用 `test(name, fn)` 包装器。将裸 `{ ... }` 代码块重构为命名测试用例。

---

## 中严重度

### M1. `test-tcl-document-symbol.js` 330 行，超出 150 行阈值

**文件**: `tests/test-tcl-document-symbol.js` (330 行)
**问题**: 覆盖了 section 识别、proc 识别、set 识别、嵌套 section、foreach/while/for、空 AST、SymbolKind 导出共 8 个分区。其中 proc 参数子 symbol 测试（第 117-142 行）重复构建了与第 91-115 行几乎相同的 AST 节点。
**建议**: 拆分为 `test-tcl-document-symbol-core.js`（section/proc/set）和 `test-tcl-document-symbol-control.js`（foreach/while/for/空AST/导出）。提取公共的 AST 构建辅助函数。

### M2. `test-scheme-parser.js` 319 行，超出 150 行阈值

**文件**: `tests/test-scheme-parser.js` (319 行)
**问题**: 混合了 parse 测试、analyze definitions 测试、analyze folding 测试、兼容性测试共 4 个逻辑分区。parse 和 analyze 是不同模块的职责，混在一起增加了维护成本。
**建议**: 拆分为 `test-scheme-parser-parse.js`（parse 行为）和 `test-scheme-parser-analyze.js`（analyze 行为 + 兼容性）。

### M3. `test-sdevice-semantic.js` 中 token 类型使用魔法数字 0/1/2

**文件**: `tests/test-sdevice-semantic.js` (多处)
**问题**: Token 类型用魔法数字表示：`typeIdx === 0` 表示 sectionName，`typeIdx === 1` 表示 sectionKeyword，`typeIdx === 2` 表示 subSection。测试中的注释如 `// type 1` 有助于理解，但魔法数字散布在 6 个以上测试用例中。源代码 `sdevice-semantic-provider.js` 中实际有 `const TOKEN_TYPES = { sectionName: 0, sectionKeyword: 1, subSection: 2, macro: 3, vector: 4 }` 的定义，但测试未引用。
**建议**: 导入或定义 token 类型常量，例如 `const { SECTION_NAME, SECTION_KEYWORD, SUB_SECTION } = ...`，在测试中使用语义化名称。

### M4. `test-sdevice-vector-keywords.js` 中 magic number `62`

**文件**: `tests/test-sdevice-vector-keywords.js` (第 9-10 行)
**问题**: `assert.strictEqual(BASE_TO_SUFFIXES.size, 62, '62 个矢量基础关键词...')` 硬编码了数量 62。如果关键词增减，需要同步修改测试。
**建议**: 将期望值提取为命名常量 `const EXPECTED_VECTOR_BASE_COUNT = 62`，或者改为范围断言 `assert.ok(size >= 57, ...)` 以提高对数据变化的容忍度。

### M5. `test-scheme-on-enter.js` 中 `1 <= 1` 测试逻辑晦涩

**文件**: `tests/test-scheme-on-enter.js` (第 128-142 行)
**问题**: "空括号排除"测试组中使用了 `isLastOpenParenEmpty('(') && 1 <= 1` 这样的表达式。`1 <= 1` 是一个恒真条件，测试的真实意图是验证 `isLastOpenParenEmpty` 返回值与括号层数判断的组合逻辑，但括号层数被内联为字面量 `1`。测试名称如 `简单空括号 (|) → 跳过` 无法表达实际的断言逻辑。
**建议**: 重构为显式调用实际业务逻辑函数，例如 `shouldAutoIndent('(', 1)` 而非手动组合 `isLastOpenParenEmpty && count <= 1`。

### M6. `test-unit-auto-close.js` 缺乏 `test()` 包装和结构化输出

**文件**: `tests/test-unit-auto-close.js` (106 行)
**问题**: 全部使用裸 `assert.strictEqual(...)` 而非 `test(name, fn)` 包装器。测试以 `// --- shouldTrigger 判定函数测试 ---` 注释分区，但无结构化测试名称输出。失败时错误信息虽然包含第三个参数的描述字符串，但无法统计通过/失败数，也无法与其他测试文件汇总。
**建议**: 统一使用 `test(name, fn)` 包装器，与其他 16 个测试文件保持一致。

### M7. `test-snippet-prefixes.js` 缺乏 `test()` 包装

**文件**: `tests/test-snippet-prefixes.js` (72 行)
**问题**: 与 M6 类似，使用裸 assert + `console.log('PASS: ...')` 而非项目统一的 `test()` 包装器。未参与统一的 passed/failed 计数和 `process.exit(failed > 0 ? 1 : 0)` 退出码机制。
**建议**: 统一使用 `test(name, fn)` 包装器。

### M8. `test-parse-cache.js` 中 LRU 测试的魔法数字 `3`/`2`/`20`

**文件**: `tests/test-parse-cache.js` (第 178-219 行)
**问题**: LRU 淘汰测试中 `new SchemeParseCache({ maxEntries: 3 })` 和 `new SchemeParseCache({ maxEntries: 2 })` 使用了魔法数字。虽然测试意图可通过上下文推断，但与 `test-scheme-on-enter.js` 中的 `1 <= 1` 类似，不如使用命名变量清晰。
**建议**: 使用语义化变量如 `const MAX_SMALL = 3; const MAX_TINY = 2;`。默认值 `20` 的测试是合理的（验证默认配置），可保留。

### M9. `test-tcl-document-symbol.js` 中 `makeNode` 函数与 `test-tcl-var-refs.js` 重复

**文件**: `tests/test-tcl-document-symbol.js` (第 8-19 行) 和 `tests/test-tcl-var-refs.js` (第 7-16 行)
**问题**: 两个文件包含完全相同的 `makeNode` 函数（Mock tree-sitter 节点构造器）。如果 tree-sitter API 发生变化，需要在两个文件中同步修改。
**建议**: 提取到 `tests/helpers/mock-tcl-node.js` 并在两个文件中共享。

---

## 低严重度

### L1. `test-scheme-undef-diagnostic.js` 白名单集合在测试内联构建

**文件**: `tests/test-scheme-undef-diagnostic.js` (多处)
**问题**: 每个测试用例都内联构建 `new Set(['+', '>=', ...])` 白名单。白名单内容与实际扩展的内置函数列表无关，只是为了过滤测试数据中的已知函数名。如果实际白名单变化，这些测试不会自动同步。
**建议**: 可接受当前做法（测试隔离性更好），但可在文件顶部定义一个 `COMMON_BUILTINS` 常量集合减少重复。

### L2. `benchmark.js` 中 `WARMUP = 3` 和 `ITERATIONS` 默认值 `10` 为魔法数字

**文件**: `tests/benchmark.js` (第 25-27 行)
**问题**: `WARMUP = 3` 和默认 `ITERATIONS = 10` 虽然有注释说明含义，但作为配置常量可提取到文件顶部或配置块中，使基准参数一目了然。
**建议**: 已有注释且位于文件顶部，影响较小。可考虑合并到配置对象 `const CONFIG = { iterations, warmup, jsonOutput }` 中。

### L3. `test-expression-converter.js` 往返一致性测试存在可合并模式

**文件**: `tests/test-expression-converter.js` (第 418-531 行)
**问题**: 13 个往返一致性测试用例遵循完全相同的模式：给定输入 → 转换方向A → 转换方向B → 断言等于原值。可用参数化测试表替代。
**建议**: 定义测试数据数组 `[{name, input, direction}]` 并用循环执行，减少约 100 行重复代码。但需权衡可读性——当前每个测试名称清晰表达了测试意图。

---

## 总结

| 严重度 | 数量 | 关键问题 |
|--------|------|----------|
| 高     | 4    | 3 个文件严重超行（535/409/330行），1 个文件缺少 test() 包装 |
| 中     | 9    | 多文件超 150 行、魔法数字、makeNode 重复、缺少 test() 包装 |
| 低     | 3    | 白名单内联、基准配置常量、测试模式重复 |

**核心发现**:
1. **行数问题集中在前 4 个大文件**（benchmark.js / expression-converter / sdevice-semantic / tcl-document-symbol），共 1921 行，占审查总量的 44%
2. **测试基础设施不一致**: 18 个文件中有 3 个（`test-unit-auto-close.js`、`test-snippet-prefixes.js`、`test-sdevice-vector-keywords.js`）未使用统一的 `test(name, fn)` 包装器
3. **辅助函数重复**: `makeNode` 在 2 个文件中重复定义，`decodeTokens` 的 delta-to-absolute 转换逻辑在 `test-sdevice-semantic.js` 中出现 6 次
4. **魔法数字**: sdevice token 类型（0/1/2）和 vector keyword 数量（62）是影响最大的两处
