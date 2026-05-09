# 性能审查报告 — tests/ 批次 1

审查范围: 18 文件, 4346 行
发现问题数: 9

---

## 高严重度

### P-1. benchmark.js 每轮迭代重复 JSON.parse + readFileSync（文件 I/O 混入基准计时）

**文件**: `tests/benchmark.js` 第 211-219 行

```js
const result = bench(`load ${path.basename(relPath)} (${sizeKB}KB)`, () => {
    JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}, ITERATIONS);
```

每次迭代同时执行磁盘 I/O（`readFileSync`）和 CPU 解析（`JSON.parse`），两者耦合在一起。磁盘缓存会使结果不稳定——首次读取与后续读取时间差异可达数量级。同时预热轮也执行了真实 I/O，意味着 OS 页缓存已被热身，统计结果中 `min` 和 `p95` 的含义模糊不清。

**建议**: 将文件内容一次性读入内存（字符串），`bench` 函数内仅测量 `JSON.parse(str)`。磁盘 I/O 成本单独测量并标注。

---

### P-2. benchmark.js 5x 冗余解析测试在每次迭代中执行 8+ 次解析

**文件**: `tests/benchmark.js` 第 322-337 行

```js
const redundantResult = bench('5x redundant parse (simulated)', () => {
    schemeAnalyzer.analyze(schemeParser.parse(text).ast);
    schemeParser.parse(text);
    const r3 = schemeParser.parse(text);
    scopeAnalyzer.buildScopeTree(r3.ast);
    const r4 = schemeParser.parse(text);
    scopeAnalyzer.buildScopeTree(r4.ast);
    scopeAnalyzer.getVisibleDefinitions(scopeAnalyzer.buildScopeTree(r4.ast), midLine);
    definitions.extractDefinitions(text, 'sde');
}, Math.max(3, Math.floor(ITERATIONS / 2)));
```

虽然命名为 "5x"，实际每次迭代执行了 4 次 `schemeParser.parse(text)` + 3 次 `buildScopeTree` + 1 次 `analyze` + 1 次 `extractDefinitions` = 约 9 次独立操作。这使得该结果的绝对时间值无法与单次管线结果直接比较，"5x" 标签具有误导性，且 GC 压力会干扰其他基准测试。

**建议**: 精确标注实际操作次数，或在每个迭代之间插入 `global.gc()` 手动触发 GC（需 `--expose-gc` 启动 Node），避免累积 GC 影响后续测试结果。

---

### P-3. benchmark.js WASM 初始化使用 setTimeout(2000) 硬编码等待

**文件**: `tests/benchmark.js` 第 595 行

```js
await new Promise(resolve => setTimeout(resolve, 2000));
```

固定等待 2 秒是一个不可靠的异步初始化策略。在慢速机器或高负载环境下，WASM 可能还未初始化完成就开始跑基准测试；在快速环境下白白浪费 2 秒。应直接 `await tclWasmInit` 获得的 Promise，而非依赖超时。

**建议**: 将 WASM 初始化放在 async 函数中，直接 `await initTclWasm()` 的返回值，移除 `setTimeout` 硬编码等待。

---

## 中严重度

### P-4. test-sdevice-semantic.js 每个 test() 独立调用 buildKeywordSectionIndex(docs)

**文件**: `tests/test-sdevice-semantic.js` 第 26、34、43、48 行等多处

```js
test('Plot appears in multiple sections', () => {
    const index = buildKeywordSectionIndex(docs);  // 每个测试都重建
    ...
});
```

`buildKeywordSectionIndex` 遍历 2117+ 关键词的文档 JSON 构建索引，但测试文件中约 25 个测试用例各自独立调用此函数，产出完全相同的索引。虽然 `docs` 不变，但每次都重建 Map 结构是冗余的。

**建议**: 在测试文件顶部一次性构建 `const keywordIndex = buildKeywordSectionIndex(docs)`，测试用例直接引用共享实例。如果担心测试隔离，可注释说明该对象是只读的、不会被修改。

---

### P-5. test-sdevice-semantic.js 多处 text.split('\n') 在循环内重复执行

**文件**: `tests/test-sdevice-semantic.js` 第 110、135、155 行等

```js
for (let i = 0; i < data.length; i += 5) {
    ...
    const word = text.split('\n')[curLine].slice(curCol, curCol + len);
}
```

每个断言循环内，`text.split('\n')` 在每次迭代中重新执行。对于测试中的短文本无碍，但作为测试辅助模式在 6+ 个测试用例中重复出现，若未来测试更大文本会显著浪费。同样的问题也出现在 `test-sdevice-vector-keywords.js` 的 `decodeTokens` 函数中（第 71 行）。

**建议**: 将 `text.split('\n')` 的结果提取为 `const lines = text.split('\n')`，在循环内使用 `lines[curLine]`。

---

### P-6. test-sdevice-vector-keywords.js 在模块顶层 require 大型 JSON 文件

**文件**: `tests/test-sdevice-vector-keywords.js` 第 64-66 行

```js
const docs = require('../syntaxes/sdevice_command_docs.json');
const { buildKeywordSectionIndex, extractSdeviceTokens } = require('../src/lsp/providers/sdevice-semantic-provider');
const sectionKws = require('../src/lsp/tcl-symbol-configs').getSdeviceAllSectionKeywordsLower();
const index = buildKeywordSectionIndex(docs);
```

`sdevice_command_docs.json` 是最大的文档 JSON（2117 关键词），在模块加载时立即 require 并构建索引。这意味着即使只运行少量测试（或测试失败提前退出），也会付出完整的 JSON 解析 + 索引构建成本。其他测试文件（如 `test-sdevice-semantic.js`）也独立加载了同一文件，没有共享。

**建议**: 考虑将大型 JSON 加载延迟到实际需要的测试块中，或在 CI 环境中通过共享 fixture 减少重复加载。

---

### P-7. test-region-undef-diagnostic.js 每个测试调用 require('../syntaxes/all_keywords.json')

**文件**: `tests/test-region-undef-diagnostic.js` 第 39-41 行

```js
const BUILTIN_MATERIALS = new Set(
    require('../syntaxes/all_keywords.json').MATERIAL || []
);
```

`all_keywords.json` 包含 6 种语言的所有关键词数据，但此处仅使用 `MATERIAL` 字段。整个 JSON 的解析和加载成本都由测试承担。并且这个 `require` 位于模块顶层，在所有测试之前无条件执行。

**建议**: 对于该文件的使用场景，可以直接在文件内硬编码一个小的 `BUILTIN_MATERIALS` Set（仅包含测试中实际使用的 "Silicon" 等材料名），避免加载完整关键词 JSON。或者将 fixture 数据提取到独立的轻量 JSON 中。

---

## 低严重度

### P-8. benchmark.js Scheme 缩放测试 (section 5) 与 Scheme 管线测试 (section 2) 数据重叠

**文件**: `tests/benchmark.js` 第 254-259 行（section 2）和第 527-528 行（section 5）

```js
// Section 2
for (const lineCount of [100, 500, 1000, 2000]) {
    schemeTestData[`synth_${lineCount}`] = { ... };
}

// Section 5
for (const lineCount of [100, 500, 1000, 2000, 4000]) {
    const text = generateSchemeCode(lineCount);
```

Section 2 已经测试了 100/500/1000/2000 行的完整管线，Section 5 重复测试 100/500/1000/2000 并增加 4000。对于 100-2000 行的范围，`generateSchemeCode` 被调用两次生成相同代码，`bench` 也被重复执行（`parse` 在 section 2 的单独测试中已覆盖）。这增加了总测试时间（特别是默认 10 次迭代 + 3 次预热 × 5 个尺寸 × 2 次测试 = 130 次 parse 调用是冗余的）。

**建议**: Section 5 仅保留 4000 行（或新增的更大尺寸），引用 Section 2 的已有结果进行缩放分析。

---

### P-9. benchmark.js bench() 函数中未释放 AST 对象

**文件**: `tests/benchmark.js` 第 69-81 行

```js
function bench(name, fn, iterations = ITERATIONS) {
    const timings = [];
    for (let i = 0; i < WARMUP; i++) fn();
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        timings.push(end - start);
    }
    return { name, ms: stats(timings) };
}
```

Scheme 管线测试中，`fn()` 每次调用 `schemeParser.parse(text)` 生成新的 AST 对象，但旧对象不会显式释放（Scheme AST 是纯 JS 对象，不像 WASM tree 需要手动 delete）。对于 2000 行的合成代码，每次解析生成大量节点对象，10 次迭代 + 3 次预热 × 多个阶段 = 数百个 AST 在堆上累积。虽然最终会被 GC 回收，但 GC 暂停可能在测量中间发生，使个别数据点出现异常尖峰。

**建议**: 在 `bench` 函数的每次迭代之间显式将引用置为 `null`，并在统计时考虑剔除离群值（如使用 IQR 方法移除异常点）。
