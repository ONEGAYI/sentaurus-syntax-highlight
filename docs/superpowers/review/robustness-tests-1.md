# 健壮性审查报告 — tests/ 批次 1

审查范围: 18 文件, 约 4346 行
发现问题数: 7

---

## 高严重度

### R-01: benchmark.js 使用固定 2 秒 setTimeout 等待异步 WASM 初始化 — 存在竞态条件

**文件**: `tests/benchmark.js` 第 595 行

```javascript
await new Promise(resolve => setTimeout(resolve, 2000));
await runAsyncBenchmarks();
```

**问题**: WASM 初始化通过 Promise 的 `.then()` 完成（第 402-404 行），但异步基准测试的执行依赖 `setTimeout(resolve, 2000)` 固定等待 2 秒。在慢速 CI 环境（如 CentOS 7 + GLIBC 2.17 目标平台）或高负载机器上，2 秒可能不足以完成 WASM 初始化，导致 WASM 测试全部被跳过（`tclParser` 仍为 `null`），测试静默通过且不报错。反之在快速机器上则浪费时间等待。

**影响**: 基准测试结果不可靠 — 在不同环境下可能产生完全不同的测试覆盖范围，且无失败信号。这不是一个会导致测试 flaky 的典型问题（因为跳过时不会出错），但会导致基准测试的核心部分（Tcl WASM 管线）在某些环境下完全无效。

**建议**: 使用 `await tclWasmInit` 替代 `setTimeout`，将初始化 Promise 直接 await，确保 WASM 就绪后再运行测试。

---

### R-02: test-sdevice-vector-keywords.js 加载大型 JSON 文件作为模块级副作用 — 测试失败时无诊断信息

**文件**: `tests/test-sdevice-vector-keywords.js` 第 9 行、第 64 行

```javascript
assert.strictEqual(BASE_TO_SUFFIXES.size, 62, '62 个矢量基础关键词（Table 196 + 197 + 非 Density 电流）');
// ...
const docs = require('../syntaxes/sdevice_command_docs.json');
```

**问题**: 文件开头（第 9 行）使用裸 `assert` 语句（不在 `test()` 函数中）断言 `BASE_TO_SUFFIXES.size === 62`。第 13-15 行的 `for...of` 循环同样使用裸 `assert`。第 64 行 `require('../syntaxes/sdevice_command_docs.json')` 也是模块级加载。这些如果失败，`passed`/`failed` 计数器不会更新，测试框架的汇总输出不会反映真实结果。后续 CI 管道检查退出码（`process.exit`）也不存在于此文件 — 该文件甚至没有 `process.exit` 调用，所以裸 assert 失败会抛出未捕获异常导致进程崩溃退出，但输出信息不清晰。

**影响**: 矢量关键词数据变更时，测试失败的行为不一致：有些断言在 `test()` 函数中（有友好输出），有些是裸 `assert`（只有 Node.js 堆栈跟踪），难以定位问题。

**建议**: 将所有裸 `assert` 语句包裹进 `test()` 函数中，与文件中其他测试保持一致的格式。在文件末尾添加 `process.exit` 退出码检查。

---

## 中严重度

### R-03: test-sdevice-semantic.js 硬编码依赖 syntaxes/sdevice_command_docs.json 文件大小和内容

**文件**: `tests/test-sdevice-semantic.js` 第 9-10 行

```javascript
const docsPath = path.join(__dirname, '..', 'syntaxes', 'sdevice_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
```

第 49 行：
```javascript
assert.ok(index.size > 300, `Expected >300 keywords, got ${index.size}`);
```

**问题**: `buildKeywordSectionIndex(docs)` 的测试断言 `index.size > 300`。这是一个合理的存在性检查，但该数字会在文档 JSON 更新时变化。虽然测试不会因为内容变化直接失败（只要关键词数维持在 300 以上），但阈值 `300` 是一个没有维护指引的魔数。如果文档被精简或重构，该断言可能突然失败。更重要的是，该文件使用 `fs.readFileSync` + `JSON.parse` 加载 JSON，而同项目的其他测试（如 `test-sdevice-vector-keywords.js` 第 64 行）使用 `require()` 加载同一文件。两种方式在 `__dirname` 不同或文件编码异常时行为不一致。

**建议**: 统一使用 `require()` 加载 JSON 文件（Node.js 原生缓存且处理编码），在断言消息中说明阈值的含义（如"至少覆盖核心 section 关键词"）。

---

### R-04: benchmark.js 依赖 display_test/ 目录下的测试文件 — 在 worktree 中运行会静默降级

**文件**: `tests/benchmark.js` 第 154-179 行

```javascript
function loadTestFile(filename) {
    const filePath = path.join(PROJECT_ROOT, 'display_test', filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
}

const testFiles = {
    sde: {
        small: loadTestFile('testbench_dvs.cmd'),    // ~165 lines
        medium: loadTestFile('test_dvs.cmd'),          // ~289 lines
    },
    // ...
};
```

**问题**: `display_test/` 目录被 `.gitignore` 排除，在 `git worktree` 中不存在。`loadTestFile` 返回 `null` 后，所有真实文件测试被静默跳过（第 250-253 行 `if (testFiles.sde.small)` 守卫），只运行合成数据测试。没有日志提示真实文件未被加载，基准测试报告中的数据集组成不可见。

**影响**: 在 worktree 中运行的基准测试只覆盖合成数据，缺少真实文件场景，但报告看起来正常。这违反了项目 CLAUDE.md 中关于 worktree 需注意 `display_test/` 被忽略的警告，但 `benchmark.js` 没有做相应的用户提示。

**建议**: 在真实文件加载失败时输出明确的警告日志（如 `console.warn('display_test/ not found — real-file benchmarks skipped')`），让运行者知道测试覆盖范围已降级。

---

### R-05: test-scheme-undef-diagnostic.js 中 `knownNames` 白名单需要手动与实际内置函数列表保持同步

**文件**: `tests/test-scheme-undef-diagnostic.js` 第 39 行、第 89 行等

```javascript
const undefs = findUndefRefs(code, new Set(['+']));
// ...
const undefs = findUndefRefs(code, new Set(['sdegeo:create-sphere', 'position']));
```

**问题**: 每个测试用例手动构造 `knownNames` 白名单 `Set`，而不是从 `all_keywords.json` 或 `sde_function_docs.json` 自动加载。这意味着：
1. 测试只验证白名单中的函数不报未定义，但不验证白名单本身的完整性
2. 如果实际内置函数列表变更（新增/删除函数），这些测试不会感知
3. 每个测试用例的白名单不同（`['+']` vs `['sdegeo:create-sphere', 'position']` vs `['+', '>=', 'display']`），阅读者无法确定这是有意为之还是遗漏

**影响**: 不直接导致测试 flaky，但降低了测试对实际代码行为的忠实度。白名单与实际不同步时，真实 bug 可能不被测试捕获。

**建议**: 考虑提供一个辅助函数，从测试数据文件自动构建完整白名单，仅在测试特定过滤行为时使用手动白名单。

---

## 低严重度

### R-06: 多数测试文件缺少 after/beforeEach 清理机制 — 依赖测试顺序无感知

**文件**: 全部 18 个测试文件

**问题**: 所有测试文件使用全局 `passed`/`failed` 计数器和裸 `test()` 函数。没有 `beforeEach`/`afterEach` 钩子，没有全局状态重置。对于当前测试来说，大部分测试是纯函数式调用（`parse()`, `buildScopeTree()`, `analyze()` 等），不依赖可变全局状态，因此实际污染风险很低。

然而有两个例外值得关注：
- `test-parse-cache.js` 中的 `SchemeParseCache` 测试：每个测试创建独立的 `new SchemeParseCache()` 实例，无状态共享问题，做法正确
- `benchmark.js` 中的 `results` 对象是全局可变的，但由于基准测试是顺序执行的脚本而非断言测试框架，这不会造成问题

**影响**: 低风险。当前测试设计避免了全局状态共享，每个测试构造自己的输入数据。如果未来引入有状态的被测对象，需要注意添加清理逻辑。

---

### R-07: test-unit-auto-close.js 和 test-sdevice-vector-keywords.js 缺少 process.exit 退出码检查

**文件**: `tests/test-unit-auto-close.js`, `tests/test-sdevice-vector-keywords.js`

**问题**: `test-unit-auto-close.js` 使用裸 `assert.strictEqual` 而非 `test()` 函数包装，末尾只有 `console.log('All unit-auto-close tests passed!')` 而没有 `process.exit(failed > 0 ? 1 : 0)`。如果断言通过，进程自然以退出码 0 结束（正确）；但如果断言失败，未捕获的 AssertionError 会导致进程以非零退出码退出（也正确）。所以从 CI 角度看这是安全的。

`test-sdevice-vector-keywords.js` 同样缺少 `process.exit`，行为类似。

**影响**: 虽然退出码行为正确（裸 assert 失败时抛出异常，进程非零退出），但与项目中其他测试文件的模式不一致（大多数文件使用 `test()` 函数 + `process.exit` 汇总）。不一致的风格增加了维护者的认知负担。

---

## 总结

| 编号 | 严重度 | 文件 | 问题简述 |
|------|--------|------|----------|
| R-01 | 高 | benchmark.js | 固定 2s setTimeout 等待 WASM 初始化存在竞态 |
| R-02 | 高 | test-sdevice-vector-keywords.js | 裸 assert + 无 process.exit，测试失败时诊断不友好 |
| R-03 | 中 | test-sdevice-semantic.js | 硬编码文档关键词数量阈值 + JSON 加载方式不一致 |
| R-04 | 中 | benchmark.js | display_test/ 在 worktree 中缺失导致静默降级无提示 |
| R-05 | 中 | test-scheme-undef-diagnostic.js | knownNames 白名单手动构造，与实际内置函数列表无自动同步 |
| R-06 | 低 | 全部 18 文件 | 无 afterEach 清理机制（当前风险低，纯函数调用为主） |
| R-07 | 低 | test-unit-auto-close.js, test-sdevice-vector-keywords.js | 缺少 process.exit + 裸 assert，与项目惯例不一致 |

### 积极方面

- 所有测试文件使用纯 Node.js assert，零外部测试框架依赖，符合项目"无 TypeScript、无构建步骤"的约束
- 测试不依赖时序（除 benchmark.js 的 WASM 初始化），不使用随机数，不依赖网络，确定性良好
- 模拟对象（如 `mockDoc()`, `makeNode()`）设计合理，轻量且隔离
- 测试边界条件覆盖较好：空输入、null、未闭合结构、注释干扰、字符串干扰等都有用例
- 解析缓存测试（test-parse-cache.js）的 LRU 淘汰逻辑测试设计严谨，验证了 maxEntries 边界
