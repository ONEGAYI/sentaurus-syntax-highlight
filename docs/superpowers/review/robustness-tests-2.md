# 健壮性审查报告 — tests/ 批次 2

审查范围: 17 文件, 约 2800 行
发现问题数: 8

---

## 高严重度

### R2-01: test-undef-var-integration.js 依赖真实 WASM 解析器 — 在缺少 node_modules 时静默崩溃而非友好跳过

**文件**: `tests/test-undef-var-integration.js` 第 6-8 行

```javascript
const Parser = require('web-tree-sitter');
const path = require('path');
const astUtils = require('../src/lsp/tcl-ast-utils');
```

**问题**: 该文件是批次 2 中唯一使用真实 WASM 解析器（`web-tree-sitter`）的测试。`require('web-tree-sitter')` 在模块加载阶段即执行，如果 `node_modules/` 不存在（如工作树中未运行 `npm install`），Node.js 直接抛出 `MODULE_NOT_FOUND`，进程立即退出，无任何友好提示。与之对比，同项目的 `test-tcl-ast-variables.js`、`test-tcl-scope-index.js` 等文件通过手写 `makeNode()` 构造 AST 节点，完全避免了 WASM 依赖。

此外，`main().catch()` 虽捕获了异步错误，但无法捕获顶层 `require` 抛出的同步异常。

**影响**: 在工作树环境中运行时（项目 CLAUDE.md 明确提醒 `node_modules/` 被忽略），该测试直接崩溃而非跳过或给出明确指引，与项目中其他 Tcl 测试文件的可移植设计不一致。

**建议**: 在文件顶部用 `try/catch` 包裹 `require('web-tree-sitter')`，失败时输出明确提示（如 "npm install required"）并以 exit code 0 退出（表示跳过而非失败），或将其余测试也改为 `makeNode()` 形式以消除 WASM 依赖。

---

### R2-02: test-undef-var-integration.js 异步测试失败不会触发 process.exit(1)

**文件**: `tests/test-undef-var-integration.js` 第 130-139 行

```javascript
    console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
    if (failed > 0) process.exit(1);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
```

**问题**: `test()` 函数是同步的，但 `main()` 是 `async`。在 `main()` 内部，`test()` 调用在 `await Parser.init()` 和 `await Parser.Language.load()` 之后同步执行。然而，`parseAndCheck()` 内的 `tree.delete()` 在 `finally` 块中调用 — 如果 `tree.delete()` 本身抛出异常（虽然罕见），该异常会被 `main().catch()` 捕获并以 exit 1 退出，这是正确的。但如果某个 `test()` 内的 `assert` 失败，它只是递增 `failed` 计数器，而最终的 `process.exit(1)` 依赖 `main()` 的正常完成。当前逻辑是正确的。

但值得注意的是：如果后续有人新增测试时在 `test()` 回调内使用 `await`（因为 `main()` 是 async 的），`test()` 函数本身不支持 Promise 返回值，`await` 表达式会导致语法错误（非 async 回调内不能 await）。这是一个潜在的维护陷阱。

**影响**: 当前实现是正确的，但缺少对 async 测试用例的防护。

**建议**: 在 `test()` 函数的注释中标注"仅支持同步回调"，或改为 async-safe 版本（`async function test(name, fn) { ... }` + 内部 `await fn()`）。

---

## 中严重度

### R2-03: benchmark-firstload.js 依赖 display_test/test_dvs.cmd — 在 worktree 中无降级提示

**文件**: `tests/benchmark-firstload.js` 第 17 行

```javascript
const testFile = process.argv[2] || path.join(PROJECT_ROOT, 'display_test', 'test_dvs.cmd');
const text = fs.readFileSync(testFile, 'utf8');
```

**问题**: 与批次 1 审查的 R-04 问题同类。默认加载 `display_test/test_dvs.cmd`，该目录被 `.gitignore` 排除，在工作树中不存在。但 `fs.readFileSync` 是同步调用，文件不存在时直接抛出 `ENOENT` 异常使进程崩溃，没有任何降级或提示。

不同于 `benchmark.js`（有 `loadTestFile` 守卫函数），这里直接硬编码文件路径并同步读取。

**影响**: 在工作树中运行时必定崩溃，必须通过命令行参数手动指定文件路径才能运行。

**建议**: 添加文件存在性检查，不存在时输出提示并 exit 0（跳过基准测试），或自动生成合成测试数据作为 fallback。

---

### R2-04: 多文件中 `makeNode()` 手写 mock 重复且与真实 WASM AST 接口不完全一致

**文件**: `tests/test-tcl-ast-variables.js`, `tests/test-tcl-scope-index.js`, `tests/test-tcl-scope-map.js`, `tests/test-tcl-ast-utils.js`, `tests/test-variable-reference.js`

**问题**: 5 个测试文件各自包含完全相同的 `makeNode()` 函数实现（约 10 行），形成代码重复（这本身是复用性问题）。从健壮性角度看，更关键的是：`makeNode()` 是手写的 mock 对象，模拟 `web-tree-sitter` 的 AST 节点接口，但只实现了 `type`, `text`, `children`, `childCount`, `startPosition`, `endPosition`, `hasError`, `child(i)` 共 8 个属性/方法。

如果 `tcl-ast-utils` 模块未来访问了其他节点属性（如 `namedChildren`, `startIndex`, `endIndex`, `parent`, `descendantForPosition()` 等），所有使用 `makeNode()` 的测试将抛出 `undefined is not a function` 错误，且错误信息难以追踪（因为 mock 对象缺少调试友好的结构）。

**影响**: 当被测模块扩展功能时，mock 对象可能静默产生错误的结果（访问 undefined 属性而非抛出异常），或产生令人困惑的错误信息。

**建议**: 将 `makeNode()` 提取到共享的 `tests/helpers.js` 模块中（解决重复问题），并在 `makeNode()` 中使用 Proxy 或 getter 来捕获未定义属性的访问，给出明确的 "mock missing property: X" 提示。

---

### R2-05: test-quote-auto-delete.js 无 test() 包装 — 缺少测试计数和失败汇总

**文件**: `tests/test-quote-auto-delete.js` 全文

```javascript
const assert = require('assert');
const { shouldDelete, isBoundary } = require('../src/lsp/providers/quote-auto-delete-logic');

// --- isBoundary 辅助函数测试 ---
assert.strictEqual(isBoundary(''), true, '空字符串（行首/尾）是边界');
// ... (30+ 个裸 assert)
console.log('All quote-auto-delete tests passed!');
```

**问题**: 与批次 1 审查的 R-07 同类但更严重。该文件完全没有使用 `test()` 包装函数、没有 `passed`/`failed` 计数器、没有 `process.exit` 退出码检查。30+ 个裸 `assert.strictEqual` 调用中任何一个失败都会抛出 `AssertionError`，进程崩溃但输出只有 Node.js 堆栈跟踪而非友好的 "N passed, M failed" 汇总。

该文件也是批次 2 中唯一一个完全缺少测试框架惯例的文件。

**影响**: 断言失败时的输出与项目其他 16 个测试文件完全不一致，CI 日志中难以快速定位失败数量和位置。

**建议**: 改用与项目一致的 `test()` 函数 + `passed`/`failed` 计数器 + `process.exit(failed > 0 ? 1 : 0)` 模式。

---

### R2-06: test-definitions.js 和 test-pp-define.js 的缓存测试依赖全局单例状态

**文件**: `tests/test-definitions.js` 第 269-337 行, `tests/test-pp-define.js` 第 194-213 行

```javascript
// test-definitions.js
test('首次调用执行扫描', () => {
    clearDefinitionCache();
    const doc = mockDoc('(define myVar 42)', 1);
    // ...
});
```

**问题**: `getDefinitions()` 使用模块级的 `definitionCache`（全局 Map）。测试通过 `clearDefinitionCache()` 手动清理，但清理逻辑分散在每个测试用例的开头，而非统一的 `beforeEach`。如果某个测试中途抛出异常（断言失败），该测试中 `clearDefinitionCache()` 后续的调用不会执行，可能影响后续测试。

具体风险路径：
1. 测试 A 调用 `clearDefinitionCache()` 后执行到一半断言失败
2. 测试 B 的 `clearDefinitionCache()` 正常执行 — 大多数测试开头都有清理调用
3. 实际上由于 `test()` 函数捕获了异常（`catch (e) {...}`），异常不会中断后续测试执行

分析后确认：由于 `test()` 函数的 `try/catch` 机制，单个测试的断言失败不会泄漏到其他测试。`clearDefinitionCache()` 的分散调用模式在当前框架下是安全的。

但 `test-pp-define.js` 的 "Provider 集成" 部分（第 193 行起）没有调用 `clearDefinitionCache()`，直接调用 `definitions.extractTclDefinitionsAst(text)`。如果该函数内部依赖缓存状态（依赖 WASM 解析器是否初始化），结果可能不确定。实际分析：`extractTclDefinitionsAst` 内部会检查 WASM 是否初始化，未初始化时走纯文本 #define 提取路径，所以当前是安全的。

**影响**: 低风险但值得注意。缓存清理依赖 `test()` 的异常捕获机制，而非显式的隔离设计。

**建议**: 在每个涉及缓存的测试文件中，在最开始的 `console.log` 之前调用一次 `clearDefinitionCache()`（`test-definitions.js` 已部分这样做），确保全局起点干净。

---

## 低严重度

### R2-07: benchmark-firstload.js 中阶段 8 缩放测试的合成数据可能导致 GC 压力但不影响正确性

**文件**: `tests/benchmark-firstload.js` 第 210-233 行

```javascript
for (const targetLines of [100, 500, 1000, 2000, 4000]) {
    const synthText = generateSchemeCode(targetLines);
    // ...
    const synthCache = new SchemeParseCache();
    const synthProvider = semanticTokensMod.createSemanticTokensProvider(synthCache);
    // ...
}
```

**问题**: 循环内每次迭代创建 `SchemeParseCache` 和 `SemanticTokensProvider` 实例，以及大量合成文本。由于是基准测试脚本（非断言测试），这些对象没有显式释放。`SchemeParseCache` 内部持有解析结果的 Map，当 `synthCache` 离开作用域后可被 GC 回收。但在 4000 行的迭代中，`parse()` 可能生成较大的 AST 对象。

这不是一个正确性问题，但如果在高内存环境下（如 CI 中的 Docker 容器）运行，GC 暂停可能导致时间测量不准确。

**影响**: 仅影响基准测试精度，不影响功能测试。基准测试本身的输出也包含明确的时间数值，异常值可以通过观察发现。

**建议**: 在每次迭代后手动清理缓存（`synthCache.invalidate()`），减少 GC 对后续迭代的干扰。

---

### R2-08: test-tcl-scope-index.js 访问私有属性 `_procScopes` 进行断言

**文件**: `tests/test-tcl-scope-index.js` 第 111 行

```javascript
const proc = index._procScopes[0];
assert.ok(proc.params.includes('b'), 'params 数组应包含 b');
assert.ok(!proc.params.includes('{b 1.0}'), 'params 数组不应包含原始文本 {b 1.0}');
```

**问题**: 测试直接访问 `ScopeIndex` 实例的 `_procScopes` 私有属性（以下划线前缀约定表示私有）。如果实现重构将 `_procScopes` 重命名或改为 getter 计算属性，该测试将失败并给出 `Cannot read property '0' of undefined` 等不友好错误信息。

这是脆弱测试的经典模式：测试与实现的私有细节耦合。

**影响**: 低风险但增加维护成本。重构内部数据结构时需同步更新此测试。

**建议**: 考虑通过公共 API（如 `resolveDefinition('b', 1)`）间接验证参数解析结果，而非直接检查内部存储。测试中已经有 `resolveDefinition` 的断言（第 114-116 行），可以直接扩展验证而非使用 `_procScopes`。

---

## 总结

| 编号 | 严重度 | 文件 | 问题简述 |
|------|--------|------|----------|
| R2-01 | 高 | test-undef-var-integration.js | WASM 模块 require 失败时静默崩溃无友好提示 |
| R2-02 | 高 | test-undef-var-integration.js | 同步 test() 函数不支持 async 回调，存在维护陷阱 |
| R2-03 | 中 | benchmark-firstload.js | 依赖 display_test/ 文件，worktree 中无降级 |
| R2-04 | 中 | 5 文件 | makeNode() mock 重复且与真实 AST 接口可能不同步 |
| R2-05 | 中 | test-quote-auto-delete.js | 30+ 裸 assert，无测试计数/汇总/exit code |
| R2-06 | 中 | test-definitions.js, test-pp-define.js | 缓存测试依赖全局单例，清理分散 |
| R2-07 | 低 | benchmark-firstload.js | 缩放测试 GC 压力可能影响计时精度 |
| R2-08 | 低 | test-tcl-scope-index.js | 断言访问私有属性 _procScopes，与实现耦合 |

### 积极方面

- 17 个文件中有 16 个使用统一的 `test()` 函数 + `passed`/`failed` 计数 + `process.exit` 模式，一致性显著优于批次 1
- 大量测试使用手写 `makeNode()` 而非真实 WASM 解析器，避免环境依赖，可移植性良好
- 边界条件覆盖全面：空输入、null、未闭合结构、注释/字符串干扰、同名不同作用域隔离等场景均有测试
- `test-expression-quickpick.js` 对 `getWordAtPosition` 的尖括号场景（闭合/未闭合/空内容/光标在括号上）进行了详尽的边界测试，健壮性优秀
- `test-scheme-dup-def-diagnostic.js` 的条件分支感知测试（if/cond/case/#if 嵌套组合）设计严谨，覆盖了复杂的交叉场景
- `test-variable-reference.js` 同时测试 Scheme 和 Tcl 双语言的变量引用隔离，验证了跨语言一致性
- `test-tcl-scope-index.js` 的 `resolveDefinition` 循环作用域优先级测试（for/foreach 循环内外变量解析）覆盖了微妙的作用域边界行为
