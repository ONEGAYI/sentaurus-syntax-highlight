# 性能审查报告 — tests/ 批次 2

审查范围: 17 文件 (test-symbol-index.js, test-tcl-ast-variables.js, test-tcl-scope-index.js, test-definitions.js, test-signature-provider.js, benchmark-firstload.js, test-expression-quickpick.js, test-pp-define.js, test-scheme-dup-def-diagnostic.js, test-tcl-ast-utils.js, test-tcl-scope-map.js, test-variable-reference.js, test-undef-var-integration.js, test-quote-auto-delete.js, test-symbol-reference.js, test-scheme-analyzer.js, test-scheme-var-refs.js)
发现问题数: 8

---

## 高严重度

### P-10. makeNode 函数在 7 个测试文件中完整重复定义

**文件**: `tests/test-tcl-ast-variables.js` (第 10-21 行), `tests/test-tcl-scope-index.js` (第 6-16 行), `tests/test-tcl-ast-utils.js` (第 8-19 行), `tests/test-tcl-scope-map.js` (第 6-16 行), `tests/test-variable-reference.js` (第 92-102 行), 以及批次 1 中已识别的 `test-tcl-var-refs.js` 和 `test-tcl-document-symbol.js`

```js
// 每个文件都完整重复定义了相同的 makeNode
function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type, text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}
```

7 个文件中逐字拷贝了完全相同的 `makeNode` 函数。这不仅是代码重复问题——更严重的性能隐患是：每次 `makeNode` 调用都创建一个新的闭包对象 (`child(i)` 方法) 和两个 `{ row, column }` 对象。在 `test-tcl-scope-index.js` 和 `test-tcl-ast-variables.js` 中，一个复杂的 proc 节点需要构建 15-20 个 `makeNode` 调用，每个都创建独立闭包。

**建议**: 提取到 `tests/helpers/tcl-node-mock.js` 共享模块，通过 `child` 方法放到原型或统一模板上减少每节点闭包开销。同时，7 处重复的维护成本也不容忽视——如果 WASM 接口变化需要同步修改所有文件。

---

### P-11. benchmark-firstload.js 每个缩放测试迭代都创建新的 SchemeParseCache + Provider 实例

**文件**: `tests/benchmark-firstload.js` 第 213-233 行

```js
for (const targetLines of [100, 500, 1000, 2000, 4000]) {
    const synthText = generateSchemeCode(targetLines);
    const synthDoc = { ... };

    const synthCache = new SchemeParseCache();          // 每轮新建
    const synthProvider = semanticTokensMod.createSemanticTokensProvider(synthCache);  // 每轮新建

    const ts0 = performance.now();
    synthProvider.provideDocumentSemanticTokens(synthDoc);
    const ts1 = performance.now();
    ...
}
```

5 次循环中，每次都 `new SchemeParseCache()` 并重新 `createSemanticTokensProvider(synthCache)`。`SchemeParseCache` 内部维护 LRU 缓存（上限 20），`createSemanticTokensProvider` 需要注册 legend 和 token 映射。这些初始化成本被包含在 `ts0-ts1` 的 "冷启动" 计时中，使得冷启动时间无法与其他阶段（阶段 2-5 使用预创建的缓存）的结果直接对比。对于 100 行的小文件，初始化开销可能占总时间的大部分，导致缩放曲线失真。

**建议**: 在循环外创建共享的 `SchemeParseCache`，每次迭代仅 `invalidate` 后重新使用。如果目的是测试完全冷启动，则应在文档注释中明确说明初始化开销包含在内。

---

### P-12. benchmark-firstload.js 阶段 9 中 100 次热循环无预热

**文件**: `tests/benchmark-firstload.js` 第 244-248 行

```js
const te0 = performance.now();
for (let i = 0; i < 100; i++) {
    semanticTokensMod.extractSemanticTokens(cacheResult.ast, userFuncNames, cacheResult.lineStarts);
}
const te1 = performance.now();
console.log(`  100 次调用平均:    ${((te1 - te0) / 100).toFixed(3)}ms`);
```

100 次调用的首次迭代会触发 V8 的 JIT 编译和内联缓存预热，而之后 99 次享受优化后的执行速度。没有预热意味着平均时间包含了冷启动的惩罚，对于只有 100 次的样本，首次迭代的异常值对平均值影响显著。同时，整体只跑了一轮 100 次，没有多次采样，无法排除 GC 暂停等干扰。

**建议**: 参考 `benchmark.js` 中 `bench()` 函数的做法，先执行 3-5 轮预热再正式计时。或者至少跑 3 轮 100 次取中位数。这与 `benchmark.js` 中的成熟做法形成对比——后者的 `bench()` 函数有 `WARMUP = 3` 和多次迭代的统计采样，而 `benchmark-firstload.js` 的所有阶段都没有预热。

---

## 中严重度

### P-13. test-tcl-scope-index.js 与 test-tcl-scope-map.js 测试数据大量重复且各自独立构建

**文件**: `tests/test-tcl-scope-index.js` 和 `tests/test-tcl-scope-map.js`

这两个文件测试的是同一套功能的不同层次（`ScopeIndex` vs `buildScopeMap`），但各自独立构建了几乎相同的 mock AST 节点树。例如：

- `test-tcl-scope-index.js` 第 47-52 行：全局 `set x 42` 的 makeNode 树
- `test-tcl-scope-map.js` 第 29-34 行：完全相同的 `set x 42` makeNode 树

同样，`global` 声明测试（scope-index 第 153-176 行 vs scope-map 第 64-91 行）、`foreach` 测试（scope-index 第 183-199 行 vs scope-map 第 95-111 行）、`upvar` 测试（scope-index 第 202-224 行 vs scope-map 第 114-136 行）、`variable` 测试（scope-index 第 227-247 行 vs scope-map 第 139-159 行）——共 5 组几乎逐字相同的 AST 构建代码。

**建议**: 将共享的 AST fixture（如 "set x 42 全局变量"、"proc + 参数 + body"、"global 声明 proc"、"foreach 节点"）提取到 `tests/fixtures/tcl-ast-fixtures.js`，两个测试文件引用相同的构建函数。

---

### P-14. test-tcl-scope-index.js 测试 4 和 测试 4b 中 proc 节点树构建重复

**文件**: `tests/test-tcl-scope-index.js` 第 61-83 行（测试 4）和第 86-117 行（测试 4b）

```js
// 测试 4：proc 参数在 body 内可见
const argsNode = makeNode('arguments', 'arg1 arg2', [
    makeNode('argument', 'arg1', [], 0, 13, 0, 17),
    makeNode('argument', 'arg2', [], 0, 18, 0, 22),
], 0, 12, 0, 23);
const bodyNode = makeNode('braced_word', '{ ... }', [], 0, 24, 2, 1);
const procNode = makeNode('procedure', 'proc myProc {arg1 arg2} { ... }', [ ... ], 0, 0, 2, 1);

// 测试 4b：proc 默认值参数 {b 1.0}
const argsNode = makeNode('arguments', '{a {b 1.0}}', [ ... ], ...);  // 几乎相同的结构
const bodyNode = makeNode('braced_word', '{ ... }', [], 0, 21, 2, 1);
const procNode = makeNode('procedure', 'proc ADD {a {b 1.0}} { ... }', [ ... ], ...);
```

测试 4 和 4b 构建了结构几乎一致的 proc 节点树，唯一区别是参数列表。类似地，resolveDefinition 循环作用域优先级测试（第 340-478 行）中，`globalSet` + `forCmd` 的构建在多个测试中重复出现。

**建议**: 提取 `createProcNode(name, args, bodyChildren, startRow)` 辅助函数，参数化 proc 节点的构建。

---

### P-15. test-signature-provider.js 的 createMockCache 每次调用完整解析管线

**文件**: `tests/test-signature-provider.js` 第 15-27 行

```js
function createMockCache() {
    return {
        get(doc) {
            const text = typeof doc === 'string' ? doc : doc.getText();
            const { ast, errors } = parse(text);
            const analysis = analyze(ast, text);
            const scopeTree = scopeAnalyzer.buildScopeTree(ast);
            const lineStarts = computeLineStarts(text);
            return { version: 1, ast, errors, analysis, scopeTree, text, lineStarts };
        },
    };
}

const mockCache = createMockCache();  // 在所有测试间共享的单一实例
```

`mockCache.get(doc)` 在每次调用时执行完整的 `parse → analyze → buildScopeTree → computeLineStarts` 四步管线。虽然注释说"测试不需要缓存"（第 13 行），但同一个测试中多次调用 `provideSignatureHelp`（如测试注释偏移 bug 的 3 个连续测试，以及用户函数签名的 4 个测试）会重复解析相同的文档文本。由于 `mockCache` 是全局共享的单例，且没有缓存机制，每次 `provideSignatureHelp` 调用都会触发一次完整解析。

对于短文本（单行 Scheme 表达式），性能影响不大。但如果未来增加多行、嵌套深度的签名测试，冗余解析会线性增长。

**建议**: 为 `createMockCache` 添加基于 `doc.getText()` 内容哈希的简单缓存，或在测试中缓存解析结果后复用。也可以设计 `createMockCache({ cache: true })` 参数。

---

### P-16. test-undef-var-integration.js 是唯一使用真实 WASM 的集成测试，但每次测试调用 parseAndCheck 内含 tree.delete() 不当

**文件**: `tests/test-undef-var-integration.js` 第 31-49 行

```js
function parseAndCheck(code, expectVisible, expectUndefined) {
    const tree = parser.parse(code);
    try {
        const root = tree.rootNode;
        const refs = astUtils.getVariableRefs(root);
        const scopeMap = astUtils.buildScopeMap(root);
        ...
    } finally { tree.delete(); }
}
```

`tree.delete()` 在 `finally` 块中正确释放了 WASM 内存，这是良好的实践。但值得注意的是，该文件是本批次中唯一使用真实 WASM 解析器的测试，它承担了验证 mock 测试无法覆盖的行为（如 `word_list` 包装命令处理）。如果 WASM 解析器初始化失败，全部 8 个测试都会静默跳过（因为 `main().catch` 仅打印错误信息）。缺少一个快速的 WASM 可用性检查导致整个测试文件可能无声通过。

**建议**: 在 `main()` 开始处添加一个简单的 WASM 解析验证（如 `assert(parser.parse('set x 1').rootNode)`），确保 WASM 可用。如果不可用，应明确报告跳过原因并以非零退出码退出。

---

## 低严重度

### P-17. benchmark-firstload.js 的 generateSchemeCode 与 benchmark.js 完全重复

**文件**: `tests/benchmark-firstload.js` 第 250-267 行 vs `tests/benchmark.js` 第 88-110 行

```js
// benchmark-firstload.js
function generateSchemeCode(lines) {
    const parts = [];
    let i = 0;
    while (i < lines) {
        parts.push(`(define top_var_${i} "value_${i}")`);
        ...
    }
    return parts.join('\n');
}

// benchmark.js — 完全相同的函数
function generateSchemeCode(lines) { ... }
```

两个基准测试文件中 `generateSchemeCode` 的逻辑和实现完全相同。同样的问题在批次 1 的 P-8 中已指出过两个文件的测试数据重叠。对于基准测试工具来说，生成器不一致会导致基线对比失去意义。

**建议**: 提取到 `tests/helpers/generate-test-code.js` 共享模块。

---

### P-18. 29 个测试文件各自定义 test() + passed/failed 计数器样板代码

**文件**: 本批次全部 17 个文件（以及批次 1 的所有文件）

```js
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
// ... 末尾:
console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

29 个测试文件全部包含完全相同的 `test()` 函数定义和 `passed/failed` 计数器。虽然这段代码本身不涉及运行时性能问题，但每个文件在模块加载时都要创建闭包和变量绑定。更重要的是，这增加了维护负担——如果需要添加测试超时、skip 功能、或更好的错误报告，需要修改 29 个文件。

**建议**: 提取到 `tests/helpers/test-runner.js`，导出 `{ test, getResults, printSummary }`。各测试文件仅需 `const { test, run } = require('./helpers/test-runner')` 即可。这也是批次 1 DRY 审查中应提出的，但既然本维度关注性能，在此标注：共享模块在 require 缓存后只初始化一次，比 29 次重复定义更高效。
