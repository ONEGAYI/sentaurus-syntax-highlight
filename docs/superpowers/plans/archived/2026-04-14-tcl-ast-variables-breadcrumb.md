# Tcl AST 级变量提取与面包屑导航 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Tcl 变量提取从正则升级为 AST 级解析，新增 DocumentSymbolProvider 为 4 种 Tcl 工具提供面包屑导航和 Outline 视图。

**Architecture:** 在现有 Tcl AST 共享框架（`tcl-ast-utils.js`）中新增 `getVariables()` 函数提取 AST 级变量；新增 `tcl-symbol-configs.js` 配置工具特有 section 关键词；新增 `tcl-document-symbol-provider.js` 提供 DocumentSymbol。改造 `definitions.js` 的 Tcl 路径使用 AST 提取。4 种 Tcl 语言共用，无需按工具单独适配。

**Tech Stack:** web-tree-sitter (WASM), tree-sitter-tcl, VSCode DocumentSymbolProvider API, 纯 CommonJS（无构建步骤）

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lsp/tcl-ast-utils.js` | 修改 | 新增 `getVariables(root)` AST 级变量提取 |
| `src/lsp/tcl-symbol-configs.js` | 新建 | 按工具的 section 关键词配置（4 种语言） |
| `src/lsp/providers/tcl-document-symbol-provider.js` | 新建 | DocumentSymbolProvider 实现 |
| `src/definitions.js` | 修改 | Tcl 路径切换到 AST 提取 |
| `src/extension.js` | 修改 | 注册 DocumentSymbolProvider |
| `tests/test-tcl-ast-variables.js` | 新建 | AST 变量提取测试 |
| `tests/test-tcl-document-symbol.js` | 新建 | DocumentSymbol 测试 |
| `tests/test-definitions.js` | 修改 | 更新 Tcl 用例 |

---

### Task 1: AST 级变量提取 — getVariables()

**Files:**
- Create: `tests/test-tcl-ast-variables.js`
- Modify: `src/lsp/tcl-ast-utils.js`

tree-sitter-tcl 对 Tcl 命令有专门节点类型：
- `set` 命令 → 节点类型 `set`，子节点：`set`(关键字) + `id`(变量名) + 值
- `procedure` → 节点类型 `procedure`，子节点：`proc` + `simple_word`(名) + `arguments`(含 `argument` 子节点) + `braced_word`(body)
- `foreach` → 节点类型 `foreach`，子节点：`foreach` + `arguments`(循环变量) + body
- `for` → 节点类型 `command`（非专用），第一个 `simple_word` 是 "for"
- `while` → 节点类型 `while`，无变量绑定

- [x] **Step 1: 编写 getVariables 的测试文件**

```js
// tests/test-tcl-ast-variables.js
'use strict';

const assert = require('assert');

// 复用 test-tcl-ast-utils.js 的 mock 节点工厂
function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type,
        text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { getVariables } = require('../src/lsp/tcl-ast-utils');

console.log('\n=== getVariables 测试 ===\n');

// ── set 变量 ──
console.log('set 变量:');

test('提取 set 变量名', () => {
    // 模拟: set x 42
    const setNode = makeNode('set', 'set x 42', [
        makeNode('set', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('source_file', '', [setNode], 0, 0, 0, 8);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 1);
    assert.strictEqual(vars[0].name, 'x');
    assert.strictEqual(vars[0].kind, 'variable');
    assert.strictEqual(vars[0].line, 1); // 1-indexed
});

test('跳过 env() 变量', () => {
    const setNode = makeNode('set', 'set env(PATH) /usr/bin', [
        makeNode('set', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'env(PATH)', [], 0, 4, 0, 13),
    ], 0, 0, 0, 22);
    const root = makeNode('source_file', '', [setNode], 0, 0, 0, 22);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 0);
});

// ── procedure ──
console.log('\nprocedure:');

test('提取 proc 名和参数', () => {
    // 模拟: proc myFunc {a b} { body }
    const procNode = makeNode('procedure', 'proc myFunc {a b} { body }', [
        makeNode('proc', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        makeNode('arguments', '{a b}', [
            makeNode('{', '{', [], 0, 12, 0, 13),
            makeNode('argument', 'a', [makeNode('simple_word', 'a', [], 0, 13, 0, 14)], 0, 13, 0, 14),
            makeNode('argument', 'b', [makeNode('simple_word', 'b', [], 0, 15, 0, 16)], 0, 15, 0, 16),
            makeNode('}', '}', [], 0, 16, 0, 17),
        ], 0, 12, 0, 17),
        makeNode('braced_word', '{ body }', [], 0, 18, 0, 26),
    ], 0, 0, 0, 26);
    const root = makeNode('source_file', '', [procNode], 0, 0, 0, 26);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 3);
    assert.strictEqual(vars[0].name, 'myFunc');
    assert.strictEqual(vars[0].kind, 'function');
    assert.strictEqual(vars[1].name, 'a');
    assert.strictEqual(vars[1].kind, 'parameter');
    assert.strictEqual(vars[2].name, 'b');
    assert.strictEqual(vars[2].kind, 'parameter');
});

test('proc 无参数时只提取函数名', () => {
    const procNode = makeNode('procedure', 'proc noArgs {} { body }', [
        makeNode('proc', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'noArgs', [], 0, 5, 0, 11),
        makeNode('arguments', '{}', [
            makeNode('{', '{', [], 0, 12, 0, 13),
            makeNode('}', '}', [], 0, 13, 0, 14),
        ], 0, 12, 0, 14),
        makeNode('braced_word', '{ body }', [], 0, 15, 0, 23),
    ], 0, 0, 0, 23);
    const root = makeNode('source_file', '', [procNode], 0, 0, 0, 23);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 1);
    assert.strictEqual(vars[0].name, 'noArgs');
    assert.strictEqual(vars[0].kind, 'function');
});

// ── foreach ──
console.log('\nforeach:');

test('提取 foreach 循环变量', () => {
    // 模拟: foreach item $myList { puts $item }
    const foreachNode = makeNode('foreach', 'foreach item $myList { ... }', [
        makeNode('foreach', 'foreach', [], 0, 0, 0, 7),
        makeNode('arguments', 'item', [
            makeNode('simple_word', 'item', [], 0, 8, 0, 12),
        ], 0, 8, 0, 12),
        makeNode('variable_substitution', '$myList', [], 0, 13, 0, 20),
        makeNode('braced_word', '{ puts $item }', [], 0, 21, 0, 35),
    ], 0, 0, 0, 35);
    const root = makeNode('source_file', '', [foreachNode], 0, 0, 0, 35);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 1);
    assert.strictEqual(vars[0].name, 'item');
    assert.strictEqual(vars[0].kind, 'variable');
});

// ── for 循环 (command 类型) ──
console.log('\nfor 循环:');

test('从 for 的 init braced_word 中提取变量', () => {
    // 模拟: for {set i 0} {$i < 10} {incr i} { body }
    // tree-sitter-tcl 把 for 解析为 command 类型
    const forNode = makeNode('command', 'for {set i 0} {$i < 10} {incr i} { body }', [
        makeNode('simple_word', 'for', [], 0, 0, 0, 3),
        makeNode('word_list', '{set i 0} {$i < 10} {incr i} { body }', [
            // init braced_word — 里面嵌套 set 节点
            makeNode('braced_word', '{set i 0}', [
                makeNode('{', '{', [], 0, 4, 0, 5),
                makeNode('set', 'set i 0', [
                    makeNode('set', 'set', [], 0, 5, 0, 8),
                    makeNode('id', 'i', [], 0, 9, 0, 10),
                    makeNode('number', '0', [], 0, 11, 0, 12),
                ], 0, 5, 0, 12),
                makeNode('}', '}', [], 0, 12, 0, 13),
            ], 0, 4, 0, 13),
            makeNode('braced_word', '{$i < 10}', [], 0, 14, 0, 23),
            makeNode('braced_word', '{incr i}', [], 0, 24, 0, 32),
            makeNode('braced_word', '{ body }', [], 0, 33, 0, 41),
        ], 0, 4, 0, 41),
    ], 0, 0, 0, 41);
    const root = makeNode('source_file', '', [forNode], 0, 0, 0, 41);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 1);
    assert.strictEqual(vars[0].name, 'i');
    assert.strictEqual(vars[0].kind, 'variable');
});

// ── 嵌套提取 ──
console.log('\n嵌套:');

test('proc body 内的 set 变量也被提取', () => {
    // proc myFunc {} { set result 42 }
    const innerSet = makeNode('set', 'set result 42', [
        makeNode('set', 'set', [], 1, 4, 1, 7),
        makeNode('id', 'result', [], 1, 8, 1, 14),
        makeNode('simple_word', '42', [], 1, 15, 1, 17),
    ], 1, 4, 1, 17);
    const procNode = makeNode('procedure', 'proc myFunc {} { set result 42 }', [
        makeNode('proc', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        makeNode('arguments', '{}', [
            makeNode('{', '{', [], 0, 12, 0, 13),
            makeNode('}', '}', [], 0, 13, 0, 14),
        ], 0, 12, 0, 14),
        makeNode('braced_word', '{ set result 42 }', [
            makeNode('{', '{', [], 0, 15, 0, 16),
            innerSet,
            makeNode('}', '}', [], 1, 18, 1, 19),
        ], 0, 15, 1, 19),
    ], 0, 0, 1, 19);
    const root = makeNode('source_file', '', [procNode], 0, 0, 1, 19);

    const vars = getVariables(root);
    assert.strictEqual(vars.length, 2);
    assert.strictEqual(vars[0].name, 'myFunc');
    assert.strictEqual(vars[0].kind, 'function');
    assert.strictEqual(vars[1].name, 'result');
    assert.strictEqual(vars[1].kind, 'variable');
});

// ── 空输入 ──
console.log('\n边界:');

test('空 AST 返回空数组', () => {
    const root = makeNode('source_file', '', [], 0, 0, 0, 0);
    const vars = getVariables(root);
    assert.strictEqual(vars.length, 0);
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  通过: ${passed}, 失败: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [x] **Step 2: 运行测试验证失败**

Run: `node tests/test-tcl-ast-variables.js`
Expected: FAIL — `getVariables` 未定义

- [x] **Step 3: 实现 getVariables()**

在 `src/lsp/tcl-ast-utils.js` 的 `module.exports` 之前添加：

```js
/**
 * 从 AST 中提取用户定义的变量、函数和参数。
 * 利用 tree-sitter-tcl 的专用节点类型：
 *   - `set` 节点：提取变量名（跳过 env()）
 *   - `procedure` 节点：提取函数名 + 参数列表
 *   - `foreach` 节点：提取循环变量
 *   - `command` 节点中第一个 simple_word 为 "for"：解析 init 中的 set
 *
 * 递归遍历 braced_word/arguments 等容器节点内部的子节点。
 *
 * @param {object} root - tree-sitter 根节点（source_file）
 * @returns {{ name: string, line: number, endLine: number, definitionText: string, kind: string }[]}
 */
function getVariables(root) {
    const defs = [];
    _collectVariables(root, defs);
    return defs;
}

/**
 * 递归收集变量定义。
 * @param {object} node
 * @param {object[]} defs
 */
function _collectVariables(node, defs) {
    if (!node) return;

    // source_file: 遍历顶层子节点
    if (node.type === 'source_file' || node.type === 'program') {
        for (let i = 0; i < node.childCount; i++) {
            _collectVariables(node.child(i), defs);
        }
        return;
    }

    // set 节点: set varName value
    if (node.type === 'set') {
        // 子节点: set关键字, id(变量名), 值
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'id') {
                const name = child.text;
                // 跳过 env() 变量
                if (name.startsWith('env(')) break;
                defs.push({
                    name,
                    line: node.startPosition.row + 1,
                    endLine: node.endPosition.row + 1,
                    definitionText: node.text,
                    kind: 'variable',
                });
                break;
            }
        }
        return;
    }

    // procedure 节点: proc name {args} {body}
    if (node.type === 'procedure') {
        let procName = null;
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            // 函数名（simple_word 类型，紧跟 proc 关键字之后）
            if (child.type === 'simple_word' && !procName) {
                procName = child.text;
                defs.push({
                    name: procName,
                    line: node.startPosition.row + 1,
                    endLine: node.endPosition.row + 1,
                    definitionText: node.text,
                    kind: 'function',
                });
            }
            // 参数列表
            if (child.type === 'arguments') {
                _extractProcParams(child, defs);
            }
            // body — 递归提取内部变量
            if (child.type === 'braced_word') {
                _collectVariablesInBraced(child, defs);
            }
        }
        return;
    }

    // foreach 节点: foreach varList $collection {body}
    if (node.type === 'foreach') {
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            // arguments 节点中的第一个 argument 是循环变量
            if (child.type === 'arguments') {
                for (let j = 0; j < child.childCount; j++) {
                    const arg = child.child(j);
                    if (arg.type === 'argument' || arg.type === 'simple_word') {
                        // argument 可能包含 simple_word 子节点
                        const varName = arg.childCount > 0 ? arg.child(0).text : arg.text;
                        if (varName && !varName.startsWith('$')) {
                            defs.push({
                                name: varName,
                                line: node.startPosition.row + 1,
                                endLine: node.endPosition.row + 1,
                                definitionText: node.text,
                                kind: 'variable',
                            });
                        }
                        break; // 只取第一个参数作为循环变量
                    }
                }
            }
            // body
            if (child.type === 'braced_word') {
                _collectVariablesInBraced(child, defs);
            }
        }
        return;
    }

    // while 节点: while {condition} {body} — 无变量绑定，但需递归 body
    if (node.type === 'while') {
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'braced_word') {
                _collectVariablesInBraced(child, defs);
            }
        }
        return;
    }

    // command 节点 — 检查是否为 for 命令或 sdevice section 等
    if (node.type === 'command') {
        const firstChild = node.childCount > 0 ? node.child(0) : null;
        if (firstChild && firstChild.type === 'simple_word') {
            const cmdName = firstChild.text;
            // for 命令: for {init} {cond} {step} {body}
            if (cmdName === 'for') {
                _extractForVariables(node, defs);
                return;
            }
        }
        // 其他 command — 检查子节点中是否有 braced_word 需要递归
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'braced_word') {
                _collectVariablesInBraced(child, defs);
            }
        }
        return;
    }

    // word_list / 顶层 node — 遍历子节点
    if (node.type === 'word_list' || node.type === 'braced_word') {
        for (let i = 0; i < node.childCount; i++) {
            _collectVariables(node.child(i), defs);
        }
    }
}

/**
 * 从 proc 的 arguments 节点提取参数。
 */
function _extractProcParams(argsNode, defs) {
    for (let i = 0; i < argsNode.childCount; i++) {
        const child = argsNode.child(i);
        if (child.type === 'argument') {
            // argument 的第一个子节点是 simple_word（参数名）
            if (child.childCount > 0) {
                const paramName = child.child(0).text;
                if (paramName && paramName !== '{' && paramName !== '}') {
                    defs.push({
                        name: paramName,
                        line: child.startPosition.row + 1,
                        endLine: child.endPosition.row + 1,
                        definitionText: child.text,
                        kind: 'parameter',
                    });
                }
            }
        }
    }
}

/**
 * 从 braced_word 内部递归收集变量。
 * braced_word 子节点: {, word_list(含command), }, 以及空白
 */
function _collectVariablesInBraced(bracedNode, defs) {
    for (let i = 0; i < bracedNode.childCount; i++) {
        const child = bracedNode.child(i);
        // word_list 和 command/set/procedure/foreach 等在 braced_word 内部
        _collectVariables(child, defs);
    }
}

/**
 * 从 for 命令的 init braced_word 中提取 set 变量。
 * for {set i 0} {$i < 10} {incr i} { body }
 * 第一个 braced_word 是 init 块
 */
function _extractForVariables(forNode, defs) {
    let bracedIndex = 0;
    for (let i = 0; i < forNode.childCount; i++) {
        const child = forNode.child(i);
        if (child.type === 'word_list') {
            for (let j = 0; j < child.childCount; j++) {
                const braced = child.child(j);
                if (braced.type === 'braced_word') {
                    bracedIndex++;
                    if (bracedIndex === 1) {
                        // init 块 — 递归提取内部的 set
                        _collectVariablesInBraced(braced, defs);
                    } else if (bracedIndex === 4) {
                        // body 块 — 递归提取
                        _collectVariablesInBraced(braced, defs);
                    }
                }
            }
        }
    }
}
```

同时更新 `module.exports`：

```js
module.exports = {
    isTclLanguage,
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    getVariables,
    findMismatchedBraces,
    TCL_LANGS,
};
```

- [x] **Step 4: 运行测试验证通过**

Run: `node tests/test-tcl-ast-variables.js`
Expected: 全部通过

- [x] **Step 5: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-ast-variables.js
git commit -m "feat(tcl-ast): 新增 AST 级变量提取函数 getVariables()"
```

---

### Task 2: 工具特有 Section 关键词配置

**Files:**
- Create: `src/lsp/tcl-symbol-configs.js`

从 `all_keywords.json` 提取各工具的 KEYWORD1 作为 section 关键词。

- [x] **Step 1: 创建配置文件**

```js
// src/lsp/tcl-symbol-configs.js
'use strict';

/**
 * 各 Tcl 工具的 section 关键词配置。
 * 用于 DocumentSymbolProvider 识别工具特有的顶层块结构
 * （如 sdevice 的 Physics/Math，sprocess 的 deposit/etch 等）。
 *
 * 数据来源：syntaxes/all_keywords.json 中的 KEYWORD1 列表。
 */

const SECTION_KEYWORDS = {
    sdevice: new Set([
        'File', 'Device', 'Electrode', 'Physics', 'Math', 'Plot',
        'Solve', 'System', 'Thermode', 'CurrentPlot', 'GainPlot',
        'FarFieldPlot', 'VCSELNearFieldPlot', 'NoisePlot',
        'hSHEDistributionPlot', 'eSHEDistributionPlot',
        'BandstructurePlot', 'TensorPlot',
    ]),
    sprocess: new Set([
        'machine', 'deposit', 'etch', 'diffuse', 'implant', 'mask',
        'strip', 'photo', 'transform', 'region', 'boundary',
        'contact', 'beam', 'pdb', 'SetTemp', 'SetTS4OxidationMode',
        '2DOxidationSetUp', 'AdvancedCalibration', 'graphics',
        'icwb.create.mask', 'line_edge_roughness', 'pdbdiff',
        'solution', 'equation', 'integrate', 'Arr', 'term',
        'contact', 'GetMoleFractionParam', 'polygon',
    ]),
    emw: new Set([
        'CodeVExcitation', 'Detector', 'DispersiveMedia',
        'GaussianBeamExcitation', 'RTA', 'Monitor', 'Boundary',
        'PlaneWaveExcitation', 'Save', 'PMCMedia', 'Sensor',
        'Plot', 'PECMedia', 'Globals', 'Extractor',
    ]),
    inspect: new Set([
        'cv_nextColor', 'cv_createDS', 'cv_getData', 'cv_getDatasets',
        'gr_create', 'cv_getXaxis', 'cv_getYaxis', 'cv_scale',
        'cv_linFit', 'fi_create', 'fi_writeEps',
        'list_datasets', 'select_plots', 'create_projection',
        'calculate', 'set_curve_prop', 'set_streamline_prop',
        'draw_rectangle', 'get_curve_prop', 'get_grid_prop',
        'remove_rectangles', 'set_material_prop',
    ]),
};

/**
 * 获取指定语言的 section 关键词集合。
 * @param {string} langId
 * @returns {Set<string>}
 */
function getSectionKeywords(langId) {
    return SECTION_KEYWORDS[langId] || new Set();
}

/**
 * 检查命令名是否为指定语言的 section 关键词。
 * @param {string} commandName
 * @param {string} langId
 * @returns {boolean}
 */
function isSectionCommand(commandName, langId) {
    const keywords = SECTION_KEYWORDS[langId];
    return keywords ? keywords.has(commandName) : false;
}

module.exports = {
    SECTION_KEYWORDS,
    getSectionKeywords,
    isSectionCommand,
};
```

- [x] **Step 2: 提交**

```bash
git add src/lsp/tcl-symbol-configs.js
git commit -m "feat: 新增 Tcl 工具 section 关键词配置"
```

---

### Task 3: DocumentSymbolProvider 实现

**Files:**
- Create: `tests/test-tcl-document-symbol.js`
- Create: `src/lsp/providers/tcl-document-symbol-provider.js`

DocumentSymbol 的 kind 映射：
- section 块（Physics/Math/deposit 等）→ `SymbolKind.Namespace`（📁）
- proc 定义 → `SymbolKind.Function`（🔧）
- set/foreach 变量 → `SymbolKind.Variable`（📦）
- proc 参数 → `SymbolKind.Field`（📌）
- foreach/for/while 控制结构块 → `SymbolKind.Namespace`（📁）

- [x] **Step 1: 编写 DocumentSymbol 测试**

```js
// tests/test-tcl-document-symbol.js
'use strict';

const assert = require('assert');

function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type,
        text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const { getDocumentSymbols, SymbolKind } = require('../src/lsp/tcl-ast-utils');

console.log('\n=== getDocumentSymbols 测试 ===\n');

// ── section 块 ──
console.log('section 块:');

test('sdevice Physics section 识别为 Namespace', () => {
    // Physics { Mobility( PhuMob ) }
    const cmdNode = makeNode('command', 'Physics { Mobility( PhuMob ) }', [
        makeNode('simple_word', 'Physics', [], 0, 0, 0, 7),
        makeNode('word_list', '{ Mobility( PhuMob ) }', [
            makeNode('braced_word', '{ Mobility( PhuMob ) }', [
                makeNode('{', '{', [], 0, 8, 0, 9),
                makeNode('command', 'Mobility( PhuMob )', [
                    makeNode('simple_word', 'Mobility(', [], 1, 4, 1, 13),
                ], 1, 4, 1, 22),
                makeNode('}', '}', [], 2, 0, 2, 1),
            ], 0, 8, 2, 1),
        ], 0, 8, 2, 1),
    ], 0, 0, 2, 1);
    const root = makeNode('source_file', '', [cmdNode], 0, 0, 2, 1);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'Physics');
    assert.strictEqual(symbols[0].kind, SymbolKind.Namespace);
});

test('sprocess deposit 识别为 Namespace', () => {
    const cmdNode = makeNode('command', 'deposit Silicon thickness=0.05', [
        makeNode('simple_word', 'deposit', [], 0, 0, 0, 7),
    ], 0, 0, 0, 30);
    const root = makeNode('source_file', '', [cmdNode], 0, 0, 0, 30);

    const symbols = getDocumentSymbols(root, 'sprocess');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'deposit');
});

test('普通命令不生成 symbol', () => {
    const cmdNode = makeNode('command', 'puts hello', [
        makeNode('simple_word', 'puts', [], 0, 0, 0, 4),
    ], 0, 0, 0, 10);
    const root = makeNode('source_file', '', [cmdNode], 0, 0, 0, 10);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 0);
});

// ── proc 符号 ──
console.log('\nproc 符号:');

test('proc 生成 Function symbol', () => {
    const procNode = makeNode('procedure', 'proc myFunc {} { body }', [
        makeNode('proc', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myFunc', [], 0, 5, 0, 11),
        makeNode('arguments', '{}', [], 0, 12, 0, 14),
        makeNode('braced_word', '{ body }', [], 0, 15, 0, 23),
    ], 0, 0, 0, 23);
    const root = makeNode('source_file', '', [procNode], 0, 0, 0, 23);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'myFunc');
    assert.strictEqual(symbols[0].kind, SymbolKind.Function);
});

// ── set 变量符号 ──
console.log('\nset 变量符号:');

test('set 生成 Variable symbol', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('set', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
    ], 0, 0, 0, 8);
    const root = makeNode('source_file', '', [setNode], 0, 0, 0, 8);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'x');
    assert.strictEqual(symbols[0].kind, SymbolKind.Variable);
});

// ── 嵌套 ──
console.log('\n嵌套:');

test('section 内的子命令生成子 symbol', () => {
    // Device { Electrode { Name="gate" } }
    const innerCmd = makeNode('command', 'Name="gate"', [
        makeNode('simple_word', 'Name="gate"', [], 1, 8, 1, 19),
    ], 1, 8, 1, 19);
    // 注意 Electrode 在 sdevice 中也是 section keyword (KEYWORD2)，但这里测层级嵌套
    // Device 是 section，内部的 command 也应被捕获
    const deviceNode = makeNode('command', 'Device { Electrode { Name="gate" } }', [
        makeNode('simple_word', 'Device', [], 0, 0, 0, 6),
        makeNode('word_list', '', [
            makeNode('braced_word', '{ Electrode { Name="gate" } }', [
                makeNode('{', '{', [], 0, 7, 0, 8),
                makeNode('command', 'Electrode { Name="gate" }', [
                    makeNode('simple_word', 'Electrode', [], 1, 4, 1, 13),
                    makeNode('word_list', '', [
                        makeNode('braced_word', '{ Name="gate" }', [
                            makeNode('{', '{', [], 1, 14, 1, 15),
                            innerCmd,
                            makeNode('}', '}', [], 1, 20, 1, 21),
                        ], 1, 14, 1, 21),
                    ], 1, 14, 1, 21),
                ], 1, 4, 1, 22),
                makeNode('}', '}', [], 2, 0, 2, 1),
            ], 0, 7, 2, 1),
        ], 0, 7, 2, 1),
    ], 0, 0, 2, 1);
    const root = makeNode('source_file', '', [deviceNode], 0, 0, 2, 1);

    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 1); // Device
    assert.strictEqual(symbols[0].name, 'Device');
    // Device 内应有子 symbol
    assert.ok(symbols[0].children.length > 0, 'Device 应有子 symbol');
});

// ── 空输入 ──
console.log('\n边界:');

test('空 AST 返回空数组', () => {
    const root = makeNode('source_file', '', [], 0, 0, 0, 0);
    const symbols = getDocumentSymbols(root, 'sdevice');
    assert.strictEqual(symbols.length, 0);
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  通过: ${passed}, 失败: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [x] **Step 2: 运行测试验证失败**

Run: `node tests/test-tcl-document-symbol.js`
Expected: FAIL — `getDocumentSymbols` 未定义

- [x] **Step 3: 实现 getDocumentSymbols()**

在 `src/lsp/tcl-ast-utils.js` 中添加（在 `getVariables` 之后，`module.exports` 之前）：

```js
const symbolConfigs = require('./tcl-symbol-configs');

/**
 * VSCode SymbolKind 枚举（测试中使用，避免依赖 vscode 模块）。
 */
const SymbolKind = {
    Namespace: 3,
    Function: 12,
    Variable: 13,
    Field: 8,
};

/**
 * 从 AST 中提取 DocumentSymbol 结构。
 * 用于面包屑导航和 Outline 视图。
 *
 * @param {object} root - tree-sitter 根节点
 * @param {string} langId - 语言 ID（用于匹配 section 关键词）
 * @returns {{ name: string, kind: number, startLine: number, endLine: number, children: object[] }[]}
 */
function getDocumentSymbols(root, langId) {
    const symbols = [];
    _collectSymbols(root, langId, symbols);
    return symbols;
}

/**
 * 递归收集 DocumentSymbol。
 */
function _collectSymbols(node, langId, symbols) {
    if (!node) return;

    if (node.type === 'source_file' || node.type === 'program') {
        for (let i = 0; i < node.childCount; i++) {
            _collectSymbols(node.child(i), langId, symbols);
        }
        return;
    }

    // set → Variable symbol
    if (node.type === 'set') {
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'id') {
                const name = child.text;
                if (name.startsWith('env(')) break;
                symbols.push({
                    name,
                    kind: SymbolKind.Variable,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row,
                    children: [],
                });
                break;
            }
        }
        return;
    }

    // procedure → Function symbol（含子 symbol）
    if (node.type === 'procedure') {
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'simple_word') {
                const sym = {
                    name: child.text,
                    kind: SymbolKind.Function,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row,
                    children: [],
                };
                // 递归 body 中的子 symbol
                for (let j = 0; j < node.childCount; j++) {
                    const c2 = node.child(j);
                    if (c2.type === 'braced_word') {
                        _collectSymbolsInBraced(c2, langId, sym.children);
                    }
                }
                symbols.push(sym);
                break;
            }
        }
        return;
    }

    // foreach → Namespace symbol
    if (node.type === 'foreach') {
        let varName = null;
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'arguments' && !varName) {
                for (let j = 0; j < child.childCount; j++) {
                    const arg = child.child(j);
                    if (arg.type === 'argument' || arg.type === 'simple_word') {
                        varName = arg.childCount > 0 ? arg.child(0).text : arg.text;
                        break;
                    }
                }
            }
        }
        if (varName) {
            const sym = {
                name: `foreach ${varName}`,
                kind: SymbolKind.Namespace,
                startLine: node.startPosition.row,
                endLine: node.endPosition.row,
                children: [],
            };
            for (let i = 0; i < node.childCount; i++) {
                if (node.child(i).type === 'braced_word') {
                    _collectSymbolsInBraced(node.child(i), langId, sym.children);
                }
            }
            symbols.push(sym);
        }
        return;
    }

    // while → Namespace symbol
    if (node.type === 'while') {
        const sym = {
            name: 'while',
            kind: SymbolKind.Namespace,
            startLine: node.startPosition.row,
            endLine: node.endPosition.row,
            children: [],
        };
        for (let i = 0; i < node.childCount; i++) {
            if (node.child(i).type === 'braced_word') {
                _collectSymbolsInBraced(node.child(i), langId, sym.children);
            }
        }
        symbols.push(sym);
        return;
    }

    // command → 检查是否为 section 或 for
    if (node.type === 'command') {
        const firstChild = node.childCount > 0 ? node.child(0) : null;
        if (firstChild && firstChild.type === 'simple_word') {
            const cmdName = firstChild.text;
            // for 命令
            if (cmdName === 'for') {
                const sym = {
                    name: 'for',
                    kind: SymbolKind.Namespace,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row,
                    children: [],
                };
                // body 是第 4 个 braced_word
                let braceIdx = 0;
                for (let i = 0; i < node.childCount; i++) {
                    const child = node.child(i);
                    if (child.type === 'word_list') {
                        for (let j = 0; j < child.childCount; j++) {
                            const braced = child.child(j);
                            if (braced.type === 'braced_word') {
                                braceIdx++;
                                if (braceIdx === 4) {
                                    _collectSymbolsInBraced(braced, langId, sym.children);
                                }
                            }
                        }
                    }
                }
                symbols.push(sym);
                return;
            }
            // section 命令
            if (symbolConfigs.isSectionCommand(cmdName, langId)) {
                const sym = {
                    name: cmdName,
                    kind: SymbolKind.Namespace,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row,
                    children: [],
                };
                // 递归 braced_word 内部的子命令
                for (let i = 0; i < node.childCount; i++) {
                    const child = node.child(i);
                    if (child.type === 'word_list') {
                        for (let j = 0; j < child.childCount; j++) {
                            const braced = child.child(j);
                            if (braced.type === 'braced_word') {
                                _collectSymbolsInBraced(braced, langId, sym.children);
                            }
                        }
                    }
                }
                symbols.push(sym);
                return;
            }
        }
        // 其他 command — 仍需检查内部 braced_word
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child.type === 'braced_word' || child.type === 'word_list') {
                _collectSymbols(child, langId, symbols);
            }
        }
        return;
    }

    // word_list / braced_word — 遍历子节点
    if (node.type === 'word_list' || node.type === 'braced_word') {
        for (let i = 0; i < node.childCount; i++) {
            _collectSymbols(node.child(i), langId, symbols);
        }
    }
}

/**
 * 从 braced_word 内部收集 symbol。
 */
function _collectSymbolsInBraced(bracedNode, langId, symbols) {
    for (let i = 0; i < bracedNode.childCount; i++) {
        _collectSymbols(bracedNode.child(i), langId, symbols);
    }
}
```

更新 `module.exports`：

```js
module.exports = {
    isTclLanguage,
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    getVariables,
    getDocumentSymbols,
    findMismatchedBraces,
    TCL_LANGS,
    SymbolKind,
};
```

- [x] **Step 4: 运行测试验证通过**

Run: `node tests/test-tcl-document-symbol.js`
Expected: 全部通过

- [x] **Step 5: 创建 VSCode Provider 封装**

```js
// src/lsp/providers/tcl-document-symbol-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode DocumentSymbolProvider for Tcl-based Sentaurus languages.
 * 共用于 sdevice, sprocess, emw, inspect 四种语言。
 */
const tclDocumentSymbolProvider = {
    /**
     * @param {vscode.TextDocument} document
     * @param {vscode.CancellationToken} token
     * @returns {vscode.DocumentSymbol[]}
     */
    provideDocumentSymbols(document, token) {
        const text = document.getText();
        const tree = astUtils.parseSafe(text);
        if (!tree) return [];

        try {
            const rawSymbols = astUtils.getDocumentSymbols(tree.rootNode, document.languageId);
            return rawSymbols.map(s => toVscodeSymbol(s, document));
        } finally {
            tree.delete();
        }
    },
};

/**
 * 递归转换原始 symbol 为 vscode.DocumentSymbol。
 * @param {{ name: string, kind: number, startLine: number, endLine: number, children: object[] }} raw
 * @param {vscode.TextDocument} document
 * @returns {vscode.DocumentSymbol}
 */
function toVscodeSymbol(raw, document) {
    const range = new vscode.Range(
        raw.startLine, 0,
        raw.endLine, document.lineAt(raw.endLine).text.length
    );
    const children = (raw.children || []).map(c => toVscodeSymbol(c, document));
    return new vscode.DocumentSymbol(raw.name, '', raw.kind, range, range);
}

module.exports = tclDocumentSymbolProvider;
```

- [x] **Step 6: 提交**

```bash
git add src/lsp/tcl-ast-utils.js src/lsp/providers/tcl-document-symbol-provider.js tests/test-tcl-document-symbol.js
git commit -m "feat(tcl): 实现 DocumentSymbolProvider 和面包屑导航"
```

---

### Task 4: 改造 definitions.js — Tcl 路径切换到 AST

**Files:**
- Modify: `src/definitions.js`
- Modify: `tests/test-definitions.js`

- [x] **Step 1: 修改 definitions.js**

将 `extractTclDefinitions` 标记为 deprecated，新增 `extractTclDefinitionsAst`，修改 `getDefinitions` 的 Tcl 路径。

在文件顶部 require 之后添加：

```js
const tclAstUtils = require('./lsp/tcl-ast-utils');
```

在 `extractTclDefinitions` 函数之前添加注释：

```js
/**
 * @deprecated 使用 extractTclDefinitionsAst 替代。保留用于参考。
 */
```

在 `extractTclDefinitions` 函数之后、`SCHEME_LANGS` 之前，添加：

```js
/**
 * 从 Tcl 文本中通过 AST 提取用户定义的变量和过程。
 * WASM 解析器未就绪时返回空数组。
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string, kind: string }[]}
 */
function extractTclDefinitionsAst(text) {
    const tree = tclAstUtils.parseSafe(text);
    if (!tree) return [];
    try {
        return tclAstUtils.getVariables(tree.rootNode);
    } finally {
        tree.delete();
    }
}
```

修改 `getDefinitions` 函数中 Tcl 分支：

```js
function getDefinitions(document, langId) {
    const uri = document.uri.toString();
    const cached = _defCache.get(uri);
    if (cached && cached.version === document.version) return cached.definitions;

    let definitions;
    if (SCHEME_LANGS.has(langId)) {
        definitions = extractSchemeDefinitions(document.getText());
    } else if (TCL_LANGS.has(langId)) {
        definitions = extractTclDefinitionsAst(document.getText());
    } else {
        definitions = [];
    }

    _defCache.set(uri, { version: document.version, definitions });
    return definitions;
}
```

更新 `module.exports`：

```js
module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitions,
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
};
```

- [x] **Step 2: 更新 test-definitions.js**

修改 `extractTclDefinitions` 测试组的预期——Tcl 变量提取现在走 AST 路径，但 `extractTclDefinitions` 函数本身仍保留用于测试。

需要更新的测试用例（`extractTclDefinitions` 不再被 `extractDefinitions` 调用，但函数本身还在）：

在文件顶部 import 行添加 `extractTclDefinitionsAst`：

```js
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitions, extractTclDefinitionsAst, extractDefinitions, getDefinitions, clearDefinitionCache } = require('../src/definitions');
```

在 `extractTclDefinitions` 测试组之后添加新的 `extractTclDefinitionsAst` 测试组：

```js
console.log('\nextractTclDefinitionsAst:');

test('AST 未初始化时返回空数组', () => {
    const defs = extractTclDefinitionsAst('set x 42');
    assert.strictEqual(defs.length, 0);
});
```

修改 `extractDefinitions` 测试中的 Tcl 用例——由于 WASM 未初始化，Tcl 路径现在返回空数组：

```js
test('sprocess 语言走 Tcl AST 提取（WASM 未初始化返回空）', () => {
    const defs = extractDefinitions('set x 1', 'sprocess');
    assert.strictEqual(defs.length, 0);
});
```

同时修改 `getDefinitions` 缓存测试中的 Tcl 用例：

```js
test('Tcl 缓存版本变化重新扫描', () => {
    clearDefinitionCache();
    const uri = 'file:///test-tcl.cmd';
    const doc1 = mockDoc('set x 1', 1, uri);
    const d1 = getDefinitions(doc1, 'sprocess');
    // WASM 未初始化返回空数组
    assert.strictEqual(d1.length, 0);
});
```

- [x] **Step 3: 运行测试验证通过**

Run: `node tests/test-definitions.js`
Expected: 全部通过

- [x] **Step 4: 提交**

```bash
git add src/definitions.js tests/test-definitions.js
git commit -m "refactor: Tcl 变量提取从正则切换到 AST"
```

---

### Task 5: 注册 DocumentSymbolProvider

**Files:**
- Modify: `src/extension.js`

- [x] **Step 1: 添加 require**

在 `src/extension.js` 顶部的 require 区域添加（约第 14 行，`tclBracketDiagnostic` 之后）：

```js
const tclDocumentSymbolProvider = require('./lsp/providers/tcl-document-symbol-provider');
```

- [x] **Step 2: 注册 Provider**

在 `src/extension.js` 的"括号诊断"注册（约第 357 行 `tclBracketDiagnostic.activate(context);`）之后添加：

```js
    // DocumentSymbol / 面包屑导航（4 语言共用）
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(
                { language: langId },
                tclDocumentSymbolProvider
            )
        );
    }
```

- [x] **Step 3: 运行所有测试**

Run:
```bash
node tests/test-tcl-ast-utils.js
node tests/test-tcl-ast-variables.js
node tests/test-tcl-document-symbol.js
node tests/test-definitions.js
```
Expected: 全部通过

- [x] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: 注册 Tcl DocumentSymbolProvider（面包屑导航）"
```

---

### Task 6: 手动集成验证

此任务不在 CI 中运行，需手动执行。

- [ ] **Step 1: 启动 Extension Development Host**

在 VSCode 中按 F5 启动扩展开发宿主。

- [ ] **Step 2: 打开测试文件**

打开 `display_test/testbench_des.cmd`（sdevice）。

- [ ] **Step 3: 验证面包屑栏**

- 查看编辑器顶部的面包屑栏，应显示 `File`、`Device`、`Physics`、`Math`、`Solve` 等 section
- 点击面包屑项，应弹出下拉列表显示该 section 内的子项
- `proc` 定义应显示为函数图标

- [ ] **Step 4: 验证 Outline 视图**

- 打开侧边栏的 Outline 面板
- 应显示树形结构，section 可展开看到子项
- 验证 `set` 变量、`proc` 函数、section 块各有正确图标

- [ ] **Step 5: 验证变量补全（回归）**

- 在文件中输入已通过 `set` 定义的变量名前几个字符
- 触发 Ctrl+Space 补全
- 应仍然正确显示用户变量

- [ ] **Step 6: 验证 sprocess 文件**

打开 `display_test/testbench_fps.cmd`（sprocess），确认面包屑显示 `deposit`、`etch`、`diffuse` 等 section。
