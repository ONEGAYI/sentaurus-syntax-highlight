# 复用/DRY审查报告 -- tests/ 批次 2

审查范围: 17 文件, 约 5200 行
发现问题数: 10（其中 3 项为批次 1 已报告问题的批次 2 确认/补充，7 项为批次 2 新发现）

---

## 高严重度

### DRY-8 (批次 1 DRY-1 确认): test runner 样板在批次 2 的 17/17 文件中完全重复

**文件**: 审查范围内全部 17 个文件（benchmark-firstload.js 除外，它无 test harness）
**行数**: 每文件约 4 行，总计约 64 行重复

每个测试文件都独立声明了完全相同的 test harness：

```js
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
```

**补充发现**: 退出逻辑存在 3 种变体，进一步增加提取难度：
- `process.exit(failed > 0 ? 1 : 0)` -- 17 个文件
- `if (failed > 0) process.exit(1);` -- 8 个文件
- `if (failed) process.exit(1);` -- 2 个文件

**建议**: 同 DRY-1。创建 `tests/helpers/test-runner.js`，统一 test + summary + exit 逻辑。

---

### DRY-9 (批次 1 DRY-2 确认): SYMBOL_TABLE 常量在 test-symbol-reference.js 中完全相同地重复

**文件**:
- `tests/test-symbol-reference.js` (行 14-36)

该文件定义了与 `test-region-undef-diagnostic.js` 和 `test-symbol-completion.js` 完全相同的 `SYMBOL_TABLE` 对象，包含 `sdegeo:create-rectangle`、`sdegeo:define-contact-set`、`sdedr:define-refinement-region`、`sde:hide-region` 的 symbolParams 配置。

**建议**: 同 DRY-2。提取为 `tests/helpers/symbol-fixtures.js`。

---

### DRY-10 (批次 1 DRY-3 确认): makeNode mock 函数在批次 2 的 5 个文件中完全相同

**文件** (批次 2 内):
- `tests/test-tcl-ast-variables.js` (行 10-21)
- `tests/test-tcl-scope-index.js` (行 6-16)
- `tests/test-tcl-scope-map.js` (行 6-16)
- `tests/test-tcl-ast-utils.js` (行 8-19)
- `tests/test-variable-reference.js` (行 92-102)

5 个文件全部复制了完全相同的 `makeNode(type, text, children, startRow, startCol, endRow, endCol)` 函数。与批次 1 的 `test-tcl-document-symbol.js`、`test-tcl-var-refs.js` 合计 **7 个文件**共享同一实现。多处注释如"与 test-tcl-ast-utils.js 的 makeNode 保持一致"证明作者已意识到重复但选择复制。

每次 `makeNode` 调用还创建不必要的 `child` 方法闭包和嵌套对象，与真实 AST 接口可能不同步。

**建议**: 同 DRY-3。提取为 `tests/helpers/mock-ast-node.js`。

---

### DRY-11: test-tcl-scope-index.js 与 test-tcl-scope-map.js 大面积测试数据重复

**文件**:
- `tests/test-tcl-scope-index.js` (482 行)
- `tests/test-tcl-scope-map.js` (174 行)

这两个文件测试同一模块 `tcl-ast-utils` 的不同 API（`buildScopeIndex` vs `buildScopeMap`），但大量测试用例构造了几乎相同的 AST 节点树：

- **"全局 set 变量"**: `makeNode('set', 'set x 42', [...])` -- 两文件均有
- **"global 声明"**: `makeNode('command', 'global global_var', [...])` + `makeNode('set', 'set global_var 1', [...])` -- 两文件均有
- **"foreach 循环变量"**: `makeNode('foreach', 'foreach item $list {...}', [...])` -- 两文件均有
- **"upvar 声明"**: `makeNode('command', 'upvar 1 outer_var local', [...])` + procNode 构造 -- 两文件均有
- **"variable 声明"**: `makeNode('command', 'variable ns_var', [...])` + procNode 构造 -- 两文件均有

其中 global/upvar/variable 测试的完整 AST 构造代码（约 30-40 行/组）在两个文件中几乎逐字复制。`test-tcl-scope-index.js` 已包含 `buildScopeMap` 的委托测试（行 250-269），确认两 API 产出一致。

**建议**:
1. 将共享的 AST 构造函数提取为 `tests/helpers/mock-tcl-fixtures.js`，如 `buildGlobalSetVar('x', '42', 0)`、`buildProcWithBody('myProc', [], bodyChildren)` 等
2. 考虑合并两文件，或让 `test-tcl-scope-map.js` 只保留 `buildScopeMap` 特有的测试

---

## 中严重度

### DRY-12 (批次 1 DRY-5 确认): mockDoc 函数在 test-definitions.js 中重复

**文件**: `tests/test-definitions.js` (行 272-277)

```js
function mockDoc(text, version, uri) {
    return {
        getText: () => text,
        version,
        uri: { toString: () => uri || 'file:///test.cmd' },
    };
}
```

与批次 1 的 `test-parse-cache.js` 参数顺序不同（后者为 `(uri, version, text)`）。此外 `benchmark-firstload.js` 也定义了自己的 `mockDocument` 对象（行 27-32），功能等价但字段名/结构略有差异。

**建议**: 同 DRY-5。提取为 `tests/helpers/mock-document.js`，统一参数顺序。

---

### DRY-13: test-symbol-index.js 中 symbolParams 配置内联重复 16 次

**文件**: `tests/test-symbol-index.js` (556 行)

该文件是批次 2 中 DRY 问题最严重的单文件。21 个测试用例中有 16 个独立声明了 `const table = {...}` 或 `const symbolTable = {...}` 内联对象：

- `sdegeo:create-cuboid` 的 `{ index: 2, role: 'def', type: 'material' }` + `{ index: 3, role: 'def', type: 'region' }` 配置重复 13 次
- `sdegeo:create-rectangle` 的类似配置重复 3 次
- `sdedr:offset-interface`/`sdedr:offset-block` 的 modeTable 重复 5 次

测试数据的重复导致文件过长（556 行），且 symbolParams 配置变更需要逐个修改。

**建议**: 在文件顶部定义常量表 `CUBOID_TABLE` / `OFFSET_INTERFACE_MODES`，各测试用例直接引用。

---

### DRY-14: test-signature-provider.js 中 sdegeo:create-circle 函数文档数据重复 4 次

**文件**: `tests/test-signature-provider.js` (322 行)

4 个测试用例（行 123-141、224-243、287-308）独立声明了完全相同的 `funcDocs` 对象：

```js
'sdegeo:create-circle': {
    signature: '(sdegeo:create-circle center radius material region)',
    parameters: [
        { name: 'center', desc: 'Center position' },
        { name: 'radius', desc: 'Radius' },
        { name: 'material', desc: 'Material' },
        { name: 'region', desc: 'Region name' },
    ],
}
```

签名、参数名、描述文本完全一致，共重复 4 次。

**建议**: 在文件顶部定义 `const CIRCLE_DOCS = {...}`，测试用例引用。

---

### DRY-16: Tcl 测试中 proc AST 构建模式跨 4 文件重复

**文件**:
- `tests/test-tcl-ast-variables.js` (行 100-202, 3 个 proc 构建)
- `tests/test-tcl-scope-index.js` (行 61-117, 4 个 proc 构建)
- `tests/test-tcl-scope-map.js` (行 43-159, 多个 proc 构建)
- `tests/test-tcl-ast-variables.js` (行 286-323, 嵌套 proc body)

构建 `proc foo {args} {body}` AST 需要约 15-20 行 `makeNode` 调用，"空参数 proc"和"带参数 proc"各被构建 3-4 次。与 DRY-11 部分重叠但关注点不同——DRY-11 是两文件间大面积重复，此处关注的是 proc 构建模式在更多文件中的系统性重复。

**建议**: 在 `tests/helpers/mock-ast-node.js` 中提供工厂函数：

```javascript
function makeProcNode(name, params, bodyChildren, startRow, ...) { ... }
function makeSetNode(varName, value, row, col) { ... }
```

---

### DRY-17: Scheme 测试中 parse+analyze+buildScopeTree 三步 setup 重复

**文件**:
- `tests/test-scheme-analyzer.js` — `parse()` + `analyze()`
- `tests/test-scheme-dup-def-diagnostic.js` — `parse()` + `buildScopeTree()` + `buildPpBranchMap()`
- `tests/test-variable-reference.js` — `parse()` + `buildScopeTree()` + `getSchemeRefs()` + `getVisibleDefinitions()`
- `tests/test-scheme-var-refs.js` — `parse()` + `getSchemeRefs()`
- `tests/test-signature-provider.js` — 已用 `createMockCache()` 解决但其他文件未跟进

每个测试文件都需要先 parse 得到 AST，再调用 1-3 个分析函数。`test-signature-provider.js` 已经封装了 `createMockCache()` 来消除这个重复，但其他 4 个文件没有跟进。

**建议**: 参考 `createMockCache()` 模式，提供通用的 `parseScheme(code)` 辅助函数，返回 `{ ast, analysis, scopeTree, errors, text }`。

---

## 低严重度

### DRY-15: WASM 解析器初始化样板在 2 个文件中重复

**文件**:
- `tests/test-undef-var-integration.js` (行 20-29)
- `tests/benchmark.js` (行 386-398，在 `initTclWasm` 函数内)

两个文件都有完全相同的 WASM 初始化序列：
1. `await Parser.init({ locateFile(scriptName) { return path.join(..., 'node_modules', 'web-tree-sitter', scriptName); } })`
2. `await Parser.Language.load(path.join(..., 'syntaxes', 'tree-sitter-tcl.wasm'))`
3. `const parser = new Parser(); parser.setLanguage(language);`

此外 `generateSchemeCode` 函数在 `benchmark.js` 和 `benchmark-firstload.js` 中各自独立定义了一次（结构略有差异），功能等价。

**建议**:
1. WASM 初始化提取为 `tests/helpers/init-tcl-parser.js`，导出 `async function initTclParser()` 返回 `{ parser, language }`
2. `generateSchemeCode` 提取为 `tests/helpers/generate-scheme-code.js`

---

## 汇总

| ID | 严重度 | 重复项 | 涉及文件数 | 预估可消除行数 |
|----|--------|--------|-----------|--------------|
| DRY-8 | 高 | test runner 样板 (批次 1 确认) | 17/17 | ~68 行 |
| DRY-9 | 高 | SYMBOL_TABLE 常量 (批次 1 确认) | 1 (新增) | ~23 行 |
| DRY-10 | 高 | makeNode mock 函数 (批次 1 确认) | 5/17 | ~55 行 |
| DRY-11 | 高 | tcl-scope 测试数据大面积重复 | 2 | ~120 行 |
| DRY-12 | 中 | mockDoc 函数 (批次 1 确认) | 1 (新增) | ~6 行 |
| DRY-13 | 中 | symbol-index 内联配置重复 | 1 | ~150 行（净减） |
| DRY-14 | 中 | signature-provider 函数文档重复 | 1 | ~30 行 |
| DRY-16 | 中 | proc AST 构建模式跨 4 文件 | 4 | ~80 行 |
| DRY-17 | 中 | Scheme parse+analyze setup | 5 | ~40 行 |
| DRY-15 | 低 | WASM 初始化 + generateSchemeCode | 2+2 | ~30 行 |

**批次 2 总计预估**: 提取共享模块后，可消除约 600 行重复代码。

**结合批次 1 的累计影响**: 两批次合计可消除约 1045 行重复代码，约占全部测试代码的 17%。批次 1 报告的 5 个共享模块建议完全覆盖批次 2 的问题：

```
tests/helpers/
├── test-runner.js         ← DRY-1/8: test() + summary() + exit()
├── symbol-fixtures.js     ← DRY-2/9: SYMBOL_TABLE + CUBOID_TABLE + OFFSET_MODES
├── mock-ast-node.js       ← DRY-3/10: makeNode() + makeProcNode() + makeSetNode()
├── mock-document.js       ← DRY-5/12: mockDoc()
├── mock-tcl-fixtures.js   ← DRY-11/16: buildGlobalSetVar(), buildProcWithBody() 等
├── sdevice-setup.js       ← DRY-4/6: SDEVICE fixtures (批次 1)
├── scheme-parse.js        ← DRY-17: parseScheme() 辅助函数
├── init-tcl-parser.js     ← DRY-15: WASM 初始化
└── generate-scheme-code.js ← DRY-15: 合成代码生成
```
