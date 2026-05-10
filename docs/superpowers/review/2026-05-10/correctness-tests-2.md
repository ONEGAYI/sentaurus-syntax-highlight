# 正确性审查报告 — tests/ 批次 2

审查范围: 17 文件, 4277 行
发现问题数: 12

## 高严重度

- **[高]** `tests/test-tcl-scope-index.js:111` — 测试直接访问内部属性 `_procScopes`，属于白盒测试耦合实现细节。若 `ScopeIndex` 内部结构变更（如重命名或重构存储方式），测试会产生假阴性而不报告真实功能回归。
  - 当前代码: `const proc = index._procScopes[0];`
  - 建议改进: 通过公共 API 验证行为，例如用 `resolveDefinition('b', bodyLine)` 确认参数可解析、`getVisibleAt(bodyLine).has('b')` 确认可见性，而非直接断言内部 `_procScopes` 数组。

- **[高]** `tests/test-tcl-ast-variables.js:277` — `for` 循环变量提取测试使用 `assert.ok(vars.length >= 2)` 弱断言，无法检测额外错误提取。如果 `getVariables` 错误地多返回了变量（如从 condition 或 step 中误提取），测试仍通过。
  - 当前代码: `assert.ok(vars.length >= 2, ...)`
  - 建议改进: `assert.strictEqual(vars.length, 2, ...)`，并验证两个变量的 `name`、`kind`、`line` 完整属性。

- **[高]** `tests/test-tcl-ast-variables.js:455` — `lmap` 单变量提取测试使用 `assert.ok(vars.some(v => v.name === 'x'))` 弱断言，不检查变量总数和类型。可能遗漏 `getVariables` 误提取其他非预期变量的 bug。
  - 当前代码: `assert.ok(vars.some(v => v.name === 'x'), '应提取 lmap 循环变量 x')`
  - 建议改进: 添加 `assert.strictEqual(vars.length, 1)` 和 `assert.strictEqual(vars[0].kind, 'variable')`。

- **[高]** `tests/test-tcl-ast-variables.js:482-483` — `lmap` 多变量和 `dict for` 变量提取测试同样仅使用 `assert.ok(vars.some(...))` 模式，不检查总数。同上问题。
  - 当前代码: `assert.ok(vars.some(v => v.name === 'a'), ...); assert.ok(vars.some(v => v.name === 'b'), ...)`
  - 建议改进: 同时断言 `vars.length` 确保无多余提取，并检查每个变量的 `kind`。

## 中严重度

- **[中]** `tests/benchmark-firstload.js` — 整个文件是基准测试而非断言测试，无任何 `assert` 调用。即使某个阶段性能严重退化或产生错误结果，测试也会以退出码 0 通过。缺少正确性验证断言。
  - 当前代码: 纯 `console.log` 输出耗时，无断言
  - 建议改进: 对关键结果添加基本断言，如 `assert.ok(cacheResult.analysis.definitions.length > 0)`、`assert.ok(stResult.data.length > 0)`、`assert.ok((ts1 - ts0) < 5000)` 等，确保管线产出正确且无异常退化。

- **[中]** `tests/test-tcl-scope-index.js:77-83` — 测试 "proc 参数在 body 内可见" 中，第 81-82 行在 line 1 上同时检查参数 `arg1`、`arg2` 和 proc 名 `myProc`。但 line 1 是 proc 定义行（row 0），而非 body 内部行。断言位置与测试描述不匹配——描述说 "body 内可见" 但实际断言的是定义行。body 应从 row 0~2（line 1~3），但参数是否在定义行就可见取决于实现细节，测试描述应更准确。
  - 当前代码: `const bodyLine = index.getVisibleAt(1); assert.ok(bodyLine.has('arg1'), 'body 内应可见参数 arg1');`
  - 建议改进: 将断言行号改为 body 内部行（如 line 2），或将测试描述改为"proc 定义行即可见参数"以匹配实际行为。

- **[中]** `tests/test-pp-define.js:161-166` — "定义行之前的同名标识符不被识别" 测试中，`findPpDefineRefs` 第二参数传入 `defs`，但 `defs` 只包含第 2 行定义的 `THICKNESS`。测试实际上验证的是"引用在定义之前，按存活区间排除"，而非"没有定义时不识别"。断言依赖 `findPpDefineRefs` 内部存活区间逻辑，测试描述有歧义。
  - 当前代码: `const text = 'set x THICKNESS\n#define THICKNESS 0.1\n'; const defs = extractPpDefines(text); ... assert.strictEqual(refs.length, 0);`
  - 建议改进: 补充一个测试用例验证"有定义但 #undef 后的引用不识别"是否正确工作（当前测试覆盖了），并将此测试描述改为"引用出现在定义行之前的不被识别"。

- **[中]** `tests/test-undef-var-integration.js:15-16` — 重新定义了 `assert` 函数为 `function assert(cond, msg)`，遮蔽了全局 `require('assert')`。虽然不影响当前测试（未使用 Node assert 模块的方法），但如果将来添加 `assert.strictEqual` 等调用会导致难以排查的运行时错误。
  - 当前代码: `function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }`
  - 建议改进: 重命名为 `check` 或 `assertTrue`，保留 `require('assert')` 的使用能力；或改为使用 `const assert = require('assert')` 后的 `assert.ok()` 方法。

- **[中]** `tests/test-quote-auto-delete.js` — 整个文件使用顶层 `assert.strictEqual` 直接执行（无 `test()` 包装），任何断言失败会立即中断后续测试，无法统计通过/失败总数。
  - 当前代码: 顶层 `assert.strictEqual(isBoundary(''), true, '...');` 等直接调用
  - 建议改进: 采用与其他测试文件一致的 `test(name, fn)` 包装模式，以便完整运行所有测试用例并报告失败数。

## 低严重度

- **[低]** `tests/test-scheme-var-refs.js:23-24` — "收集简单标识符引用" 测试中 `xRefs` 过滤条件仅检查 `r.line === 2`，未检查 `r.name === 'x'` 的所有引用是否也出现在预期行。若 `getSchemeRefs` 意外在第 1 行也返回了 `x` 的引用（如 define 名被误收集），`xRefs.filter(r => r.line === 2)` 仍通过。
  - 当前代码: `const xRefs = refs.filter(r => r.name === 'x' && r.line === 2);`
  - 建议改进: 额外断言 `refs.filter(r => r.name === 'x').length === 1`（第 1 行的 define name 不应被收集为引用）。

- **[低]** `tests/test-scheme-analyzer.js` — 所有测试均未验证 `definitions` 的 `line`、`start`、`end` 位置字段。对于位置敏感的功能（如悬停、跳转定义），位置字段错误会导致用户可见 bug。
  - 当前代码: 仅断言 `name`、`kind`、`params`
  - 建议改进: 至少在一个测试中验证 `line` 字段的正确性，如 `assert.strictEqual(def.line, 1)`。

- **[低]** `tests/test-variable-reference.js:104-125` — Tcl 全局变量引用过滤测试中，手动构造的 AST mock 使用 `variable_substitution` 节点，但其 `text` 为 `$x`。`getVariableRefs` 内部会 `slice(1)` 去掉 `$` 得到 `x`。但测试未验证 `refs[0].line` 是否正确（应为 2），且未验证 `startCol`/`endCol`。
  - 当前代码: `assert.strictEqual(matchingRefs[0].name, 'x');`
  - 建议改进: 添加 `assert.strictEqual(matchingRefs[0].line, 2)` 验证行号正确性。

## 总结

批次 2 的 17 个测试文件整体质量较好，核心逻辑覆盖充分。主要问题集中在：

1. **弱断言模式**（高严重度）：`test-tcl-ast-variables.js` 中 `lmap`、`dict for`、`for` 等命令的变量提取测试大量使用 `vars.some(...)` 和 `vars.length >= N` 弱断言，无法检测多余提取。这是最需要修复的问题，因为生产代码中这些命令的变量提取逻辑较新（近期提交），测试应更严格。

2. **内部属性耦合**（高严重度）：`test-tcl-scope-index.js` 直接访问 `_procScopes` 私有属性，使测试与实现强耦合。

3. **基准测试无断言**（中严重度）：`benchmark-firstload.js` 纯输出无验证，性能退化或错误结果无法被 CI 捕获。

4. **测试框架不统一**（低-中严重度）：`test-quote-auto-delete.js` 使用裸 `assert` 顶层调用而非统一的 `test()` 包装，`test-undef-var-integration.js` 重新定义了 `assert` 函数。
