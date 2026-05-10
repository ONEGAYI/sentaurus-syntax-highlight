# 复用/DRY审查报告 -- tests/ 批次 1

审查范围: 18 文件, 4346 行
发现问题数: 7

---

## 高严重度

### DRY-1: test runner 样板代码在全部 18 个文件中完全重复

**文件**: 审查范围内 16/18 个文件（benchmark.js 和 test-snippet-prefixes.js 除外）
**行数**: 每文件约 4 行，总计约 64 行重复

每个测试文件都独立声明了完全相同的 test harness：

```js
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
```

这个模式在**整个 tests/ 目录（29 个文件）**中一致重复。应提取为 `tests/helpers/test-runner.js` 公共模块，各文件只需 `const { test, summary } = require('./helpers/test-runner');`。项目没有使用任何测试框架，这正是自定义 runner 最应避免的重复。

**建议**: 创建 `tests/helpers/test-runner.js`，导出 `test()` 函数和 `summary()` 汇总输出函数（含 `process.exit`）。每个测试文件顶部 `require` 一次即可。

---

### DRY-2: SYMBOL_TABLE 常量在 3 个文件中完全相同地重复

**文件**:
- `tests/test-region-undef-diagnostic.js` (行 14-37)
- `tests/test-symbol-completion.js` (行 16-38)
- `tests/test-symbol-reference.js`（批次 2，与上述 2 个文件结构完全一致）

三个文件定义了完全相同的 `SYMBOL_TABLE` 对象，包含 `sdegeo:create-rectangle`、`sdegeo:define-contact-set`、`sdedr:define-refinement-region`、`sde:hide-region` 的 symbolParams 配置。任何 symbol 配置变更需同步修改 3 处。

**建议**: 提取为 `tests/helpers/symbol-fixtures.js`，导出共享的 `SYMBOL_TABLE` 常量。

---

### DRY-3: makeNode mock 函数在 7 个文件中完全相同地重复

**文件**:
- `tests/test-tcl-document-symbol.js` (行 8-18)
- `tests/test-tcl-var-refs.js` (行 6-15)
- `tests/test-tcl-ast-utils.js`（批次 2）
- `tests/test-tcl-ast-variables.js`（批次 2）
- `tests/test-tcl-scope-map.js`（批次 2）
- `tests/test-tcl-scope-index.js`（批次 2）
- `tests/test-variable-reference.js`（批次 2）

每个文件都复制了完全相同的 `makeNode(type, text, children, startRow, startCol, endRow, endCol)` 函数，用于构造 tree-sitter 风格的 AST mock 节点。7 个文件共享完全相同的函数签名和实现。

**建议**: 提取为 `tests/helpers/mock-ast-node.js`，导出 `makeNode` 函数。各 Tcl 测试文件只需一行 `const { makeNode } = require('./helpers/mock-ast-node');`。

---

### DRY-4: SDEVICE token 解码逻辑在 2 个文件中重复

**文件**:
- `tests/test-sdevice-semantic.js` -- 内联循环（行 103-111, 130-136, 149-157, 205-211 等，共约 7 处）
- `tests/test-sdevice-vector-keywords.js` -- `decodeTokens` 函数（行 70-82）

两个文件都需要将 SDEVICE 的 5 元组 token 数据（deltaLine, deltaCol, len, typeIdx, modifier）解码为可读的 `{word, typeIdx, line, col}` 结构。`test-sdevice-vector-keywords.js` 正确地提取了 `decodeTokens` 函数，但 `test-sdevice-semantic.js` 在 7 个测试用例中内联了相同的解码循环（每处约 6 行），且没有提取为函数。

**建议**: 将 `decodeTokens` 提取到共享模块（或至少在 `test-sdevice-semantic.js` 内部提取为函数），统一两文件的 token 解码方式。

---

## 中严重度

### DRY-5: mockDoc 函数在 2 个文件中重复（参数顺序不同）

**文件**:
- `tests/test-parse-cache.js` (行 16-22): `mockDoc(uri, version, text)`
- `tests/test-definitions.js` (行 272-277, 批次 2): `mockDoc(text, version, uri)`

两个文件都创建了模拟 VSCode `TextDocument` 的工厂函数，返回 `{uri, version, getText}` 对象。但参数顺序不同：`test-parse-cache.js` 是 `(uri, version, text)`，而 `test-definitions.js` 是 `(text, version, uri)`。此外 `test-sdevice-semantic.js` 在 4 个测试用例中直接内联构造 mockDoc 对象（行 253-258, 270-274, 285-289, 302-307），未使用工厂函数。

**建议**: 提取为 `tests/helpers/mock-document.js`，统一参数顺序（建议 `(uri, version, text)` 与 VSCode API 一致），各测试文件共享使用。

---

### DRY-6: sdevice_command_docs.json 加载和 index/sectionKeywords 构建在 2 个文件中重复

**文件**:
- `tests/test-sdevice-semantic.js` (行 9-10, 25-31): 加载 docs JSON，调用 `buildKeywordSectionIndex(docs)` 和创建 `new Set(['file', 'plot', ...])`
- `tests/test-sdevice-vector-keywords.js` (行 64-68): 完全相同的加载和构建逻辑

两个文件都需要：
1. `require('../syntaxes/sdevice_command_docs.json')`
2. `buildKeywordSectionIndex(docs)`
3. `require('../src/lsp/tcl-symbol-configs').getSdeviceAllSectionKeywordsLower()` (仅 vector-keywords)
4. 创建 `new Set(sectionKws)` 作为 sectionKeywords

**建议**: 提取为 `tests/helpers/sdevice-setup.js`，导出预构建的 `{ docs, index, sectionKeywords }`。

---

## 低严重度

### DRY-7: 表达式转换往返测试结构高度重复

**文件**: `tests/test-expression-converter.js` (行 421-531)

往返一致性测试段包含约 16 个测试用例，结构完全相同：

```js
test('前缀→中缀→前缀: ...', () => {
    const original = '...';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});
```

这 16 个测试用例仅输入字符串不同，测试逻辑完全相同。可以用参数化方式表达。

**建议**: 定义一个往返测试用例数组，循环执行：
```js
const roundtripCases = [
    ['(+ a b)', 'infix→prefix→infix'],
    ['(* a b)', '乘法往返'],
    // ...
];
for (const [expr, desc] of roundtripCases) {
    test(`往返: ${desc}`, () => { /* 统一逻辑 */ });
}
```
同样的模式也适用于行 362-417 的同级运算符展平测试。

---

## 汇总

| ID | 严重度 | 重复项 | 涉及文件数 | 预估可消除行数 |
|----|--------|--------|-----------|--------------|
| DRY-1 | 高 | test runner 样板 | 16/18 (全仓库 29) | ~120 行 |
| DRY-2 | 高 | SYMBOL_TABLE 常量 | 3 | ~70 行 |
| DRY-3 | 高 | makeNode mock 函数 | 7 (含批次 2) | ~80 行 |
| DRY-4 | 高 | SDEVICE token 解码 | 2 | ~40 行 |
| DRY-5 | 中 | mockDoc 工厂函数 | 2 (+1 内联) | ~20 行 |
| DRY-6 | 中 | SDEVICE setup 代码 | 2 | ~15 行 |
| DRY-7 | 低 | 往返测试参数化 | 1 | ~100 行（净减） |

**总计预估**: 提取为约 5 个共享模块后，可消除约 445 行重复代码，约占全部测试代码的 7-8%。

**建议的共享模块结构**:
```
tests/helpers/
├── test-runner.js         ← DRY-1: test() + summary()
├── symbol-fixtures.js     ← DRY-2: SYMBOL_TABLE
├── mock-ast-node.js       ← DRY-3: makeNode()
├── mock-document.js       ← DRY-5: mockDoc()
└── sdevice-setup.js       ← DRY-4, DRY-6: decodeTokens() + SDEVICE fixtures
```
