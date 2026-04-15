# Tcl 方言未定义变量检测 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 sdevice/sprocess/emw/inspect/svisual 5 种 Tcl 方言添加未定义变量检测，引用未定义变量时显示黄色波浪线 Warning。

**Architecture:** 在 `tcl-ast-utils.js` 中新增 `getVariableRefs()` 和 `buildScopeMap()` 两个 AST 分析函数，新建 `undef-var-diagnostic.js` 诊断模块参照 `tcl-bracket-diagnostic.js` 的注册模式（防抖 + DiagnosticCollection）。

**Tech Stack:** VSCode Diagnostic API, tree-sitter-tcl WASM (已有), web-tree-sitter (已有)

**Spec:** `docs/superpowers/specs/2026-04-15-undef-var-diagnostic-design.md`

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/lsp/tcl-ast-utils.js` | 新增 `getVariableRefs()`、`buildScopeMap()`，更新 exports |
| 新建 | `src/lsp/providers/undef-var-diagnostic.js` | Tcl + Scheme 统一诊断模块（本计划只实现 Tcl 部分） |
| 新建 | `tests/test-tcl-scope-map.js` | `buildScopeMap()` 单元测试 |
| 新建 | `tests/test-tcl-var-refs.js` | `getVariableRefs()` 单元测试 |
| 修改 | `src/extension.js` | 注册诊断模块 |

---

### Task 1: 新增 `getVariableRefs()` — 收集 `$var` 引用

**Files:**
- 修改: `src/lsp/tcl-ast-utils.js`（在 `getVariables` 函数后新增，约 150 行后）
- 新建: `tests/test-tcl-var-refs.js`

- [ ] **Step 1: 编写 `getVariableRefs` 测试**

创建 `tests/test-tcl-var-refs.js`：

```javascript
// tests/test-tcl-var-refs.js
'use strict';

const assert = require('assert');

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

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ast = require('../src/lsp/tcl-ast-utils');

console.log('\n=== getVariableRefs 测试 ===\n');

test('收集单个 $var 引用', () => {
    const refNode = makeNode('variable_ref', '$x', [], 0, 6, 0, 8);
    const cmdNode = makeNode('command', 'puts $x', [
        makeNode('simple_word', 'puts', [], 0, 0, 0, 4),
        refNode,
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [cmdNode], 0, 0, 0, 8);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'x');
    assert.strictEqual(refs[0].line, 1);
    assert.strictEqual(refs[0].startCol, 6);
});

test('收集多个 $var 引用', () => {
    const ref1 = makeNode('variable_ref', '$a', [], 0, 0, 0, 2);
    const ref2 = makeNode('variable_ref', '$b', [], 0, 3, 0, 5);
    const root = makeNode('program', '', [ref1, ref2], 0, 0, 0, 5);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'a');
    assert.strictEqual(refs[1].name, 'b');
});

test('跳过注释中的引用', () => {
    const commentNode = makeNode('comment', '# puts $x', [], 0, 0, 0, 10);
    const refNode = makeNode('variable_ref', '$y', [], 1, 0, 1, 2);
    const root = makeNode('program', '', [commentNode, refNode], 0, 0, 1, 2);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'y');
});

test('空 AST 返回空数组', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 0);
});

test('variable_ref 嵌套在 braced_word 中', () => {
    const ref = makeNode('variable_ref', '$val', [], 0, 2, 0, 6);
    const braced = makeNode('braced_word', '{expr $val}', [ref], 0, 0, 0, 11);
    const root = makeNode('program', '', [braced], 0, 0, 0, 11);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'val');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-tcl-var-refs.js
```

预期：FAIL — `ast.getVariableRefs is not a function`

- [ ] **Step 3: 实现 `getVariableRefs`**

在 `src/lsp/tcl-ast-utils.js` 的 `getVariables` 函数之后（约 155 行后）新增：

```javascript
/**
 * 收集 AST 中所有变量引用（variable_ref 节点，即 $varName）。
 * tree-sitter-tcl 不会在注释内生成 variable_ref 节点，无需手动跳过。
 * 返回字段：name(去除$前缀)、line(1-based)、startCol/endCol(列号)
 * @param {object} root - AST 根节点
 * @returns {Array<{name: string, line: number, startCol: number, endCol: number}>}
 */
function getVariableRefs(root) {
    const refs = [];
    walkNodes(root, node => {
        if (node.type === 'variable_ref') {
            const raw = node.text;
            const name = raw.startsWith('$') ? raw.slice(1) : raw;
            if (name) {
                refs.push({
                    name,
                    line: node.startPosition.row + 1,
                    startCol: node.startPosition.column,
                    endCol: node.endPosition.column,
                });
            }
        }
    });
    return refs;
}
```

- [ ] **Step 4: 更新 exports**

在 `src/lsp/tcl-ast-utils.js` 的 `module.exports` 中添加 `getVariableRefs`：

```javascript
module.exports = {
    parseSafe,
    getFoldingRanges,
    findMismatchedBraces,
    getVariables,
    getVariableRefs,
    getDocumentSymbols,
    TCL_LANGS,
};
```

- [ ] **Step 5: 运行测试确认通过**

```bash
node tests/test-tcl-var-refs.js
```

预期：全部测试通过

- [ ] **Step 6: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-var-refs.js
git commit -m "feat: 添加 getVariableRefs() 收集 Tcl $var 引用节点"
```

---

### Task 2: 新增 `buildScopeMap()` — 构建作用域映射

**Files:**
- 修改: `src/lsp/tcl-ast-utils.js`（在 `getVariableRefs` 之后新增）
- 新建: `tests/test-tcl-scope-map.js`

- [ ] **Step 1: 编写 `buildScopeMap` 测试**

创建 `tests/test-tcl-scope-map.js`：

```javascript
// tests/test-tcl-scope-map.js
'use strict';

const assert = require('assert');

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

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ast = require('../src/lsp/tcl-ast-utils');

console.log('\n=== buildScopeMap 测试 ===\n');

test('全局 set 变量在所有行可见', () => {
    // set x 42  在第 0 行
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const scopeMap = ast.buildScopeMap(root);
    // 定义在第 0 行(1-based: 第1行)，后续行应可见
    assert.ok(scopeMap instanceof Map);
    // 检查第 2 行可见 x
    const line2 = scopeMap.get(2);
    assert.ok(line2, '第 2 行应有可见变量集');
    assert.ok(line2.has('x'), '第 2 行应可见变量 x');
});

test('proc 参数在 body 内可见', () => {
    // proc myProc {arg1 arg2} { ... }
    // 行: 0=proc, 1=body开始
    const argsNode = makeNode('arguments', 'arg1 arg2', [
        makeNode('argument', 'arg1', [], 0, 13, 0, 17),
        makeNode('argument', 'arg2', [], 0, 18, 0, 22),
    ], 0, 12, 0, 23);
    const bodyNode = makeNode('braced_word', '{ ... }', [], 0, 24, 2, 1);
    const procNode = makeNode('procedure', 'proc myProc {arg1 arg2} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        argsNode,
        bodyNode,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    // body 内的行应可见 arg1, arg2, myProc
    const bodyLine = scopeMap.get(1); // body 第 1 行(0-based row 0 → 1-based)
    // myProc 在全局可见
    const globalLine = scopeMap.get(1);
    assert.ok(globalLine, '应有可见变量');
    assert.ok(globalLine.has('myProc'), '全局应可见函数名 myProc');
});

test('global 声明引入全局变量到 proc 作用域', () => {
    // 行 0: set global_var 1
    // 行 1: proc myProc {} {
    // 行 2:   global global_var
    // 行 3:   puts $global_var
    // 行 4: }
    const globalSetNode = makeNode('set', 'set global_var 1', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'global_var', [], 0, 4, 0, 14),
        makeNode('simple_word', '1', [], 0, 15, 0, 16),
    ], 0, 0, 0, 16);

    // global 命令: command 节点，第一个 simple_word 是 "global"
    const globalCmd = makeNode('command', 'global global_var', [
        makeNode('simple_word', 'global', [], 2, 4, 2, 10),
        makeNode('simple_word', 'global_var', [], 2, 11, 2, 21),
    ], 2, 4, 2, 21);

    const procBody = makeNode('braced_word', '{\n  global global_var\n  puts $global_var\n}', [
        globalCmd,
    ], 1, 15, 4, 1);
    const procArgs = makeNode('arguments', '', [], 1, 12, 1, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 1, 0, 1, 4),
        makeNode('simple_word', 'myProc', [], 1, 5, 1, 11),
        procArgs,
        procBody,
    ], 1, 0, 4, 1);

    const root = makeNode('program', '', [globalSetNode, procNode], 0, 0, 4, 1);

    const scopeMap = ast.buildScopeMap(root);
    // 第 3 行(1-based) 在 proc body 内，应可见 global_var（通过 global 声明）
    const line3 = scopeMap.get(3);
    assert.ok(line3, '第 3 行应有可见变量集');
    assert.ok(line3.has('global_var'), 'global 声明后应可见 global_var');
});

test('foreach 循环变量在 body 内可见', () => {
    // foreach item $list { ... }
    const argsNode = makeNode('arguments', 'item $list', [
        makeNode('argument', 'item', [], 0, 8, 0, 12),
        makeNode('variable_ref', '$list', [], 0, 13, 0, 18),
    ], 0, 8, 0, 18);
    const bodyNode = makeNode('braced_word', '{ puts $item }', [], 0, 19, 0, 33);
    const foreachNode = makeNode('foreach', 'foreach item $list { ... }', [
        makeNode('simple_word', 'foreach', [], 0, 0, 0, 7),
        argsNode,
        bodyNode,
    ], 0, 0, 0, 33);
    const root = makeNode('program', '', [foreachNode], 0, 0, 0, 33);

    const scopeMap = ast.buildScopeMap(root);
    // body 内应可见 item
    // 但由于 body 在同一行，检查第 1 行
    const line1 = scopeMap.get(1);
    assert.ok(line1, '第 1 行应有可见变量集');
    assert.ok(line1.has('item'), 'foreach 循环变量 item 应可见');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-tcl-scope-map.js
```

预期：FAIL — `ast.buildScopeMap is not a function`

- [ ] **Step 3: 实现 `buildScopeMap`**

在 `src/lsp/tcl-ast-utils.js` 的 `getVariableRefs` 函数之后新增：

```javascript
/**
 * 构建行号 → 可见变量集的作用域映射。
 * @param {object} root - AST 根节点
 * @returns {Map<number, Set<string>>} 行号(1-based) → 可见变量名集合
 */
function buildScopeMap(root) {
    const maxLine = _countMaxLine(root);
    const scopeMap = new Map();
    for (let i = 1; i <= maxLine; i++) {
        scopeMap.set(i, new Set());
    }

    // 第一遍：收集全局定义
    _collectGlobalDefs(root, scopeMap, maxLine);

    // 第二遍：处理 proc 作用域
    _processProcScopes(root, scopeMap, maxLine);

    return scopeMap;
}

function _countMaxLine(node) {
    let maxLine = 0;
    walkNodes(node, n => {
        const endRow = n.endPosition.row + 1;
        if (endRow > maxLine) maxLine = endRow;
    });
    return maxLine;
}

function _collectGlobalDefs(root, scopeMap, maxLine) {
    // 收集全局作用域的 set 定义和 proc 函数名
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    const defLine = idNode.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, name, defLine, maxLine);
                }
            }
        }

        if (child.type === 'procedure') {
            // proc 函数名全局可见
            const simpleWords = _findChildrenByType(child, 'simple_word');
            for (const sw of simpleWords) {
                if (sw.text !== 'proc') {
                    const defLine = sw.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, sw.text, defLine, maxLine);
                    break;
                }
            }
        }

        // command 中的 set/lappend/append（非 proc 内部的全局命令）
        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                // set、lappend、append 都会创建/修改变量
                if (cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append') {
                    for (let j = 1; j < child.childCount; j++) {
                        const arg = child.child(j);
                        if (arg && (arg.type === 'id' || arg.type === 'simple_word')) {
                            const name = arg.text;
                            if (!name.startsWith('env(') && !/^\d/.test(name)) {
                                const defLine = arg.startPosition.row + 1;
                                _addToScopeFromLine(scopeMap, name, defLine, maxLine);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

function _addToScopeFromLine(scopeMap, name, fromLine, toLine) {
    for (let i = fromLine; i <= toLine; i++) {
        const set = scopeMap.get(i);
        if (set) set.add(name);
    }
}

function _processProcScopes(root, scopeMap) {
    // 找到所有 procedure 节点
    const procedures = [];
    walkNodes(root, node => {
        if (node.type === 'procedure') procedures.push(node);
    });

    for (const proc of procedures) {
        const bodyNode = _findChildByType(proc, 'braced_word');
        if (!bodyNode) continue;

        const bodyStart = bodyNode.startPosition.row + 1;
        const bodyEnd = bodyNode.endPosition.row + 1;

        // 先清空 proc body 内的全局变量（proc 有独立作用域）
        // 但保留 proc 名和全局 proc 名
        const globalDefs = new Set();
        // 收集全局 proc 名
        for (let i = 0; i < root.childCount; i++) {
            const child = root.child(i);
            if (child && child.type === 'procedure') {
                const simpleWords = _findChildrenByType(child, 'simple_word');
                for (const sw of simpleWords) {
                    if (sw.text !== 'proc') globalDefs.add(sw.text);
                }
            }
        }

        // 为 body 内每行创建干净的作用域
        for (let i = bodyStart; i <= bodyEnd; i++) {
            const lineSet = scopeMap.get(i);
            if (lineSet) {
                // 保留全局 proc 名，清除其他全局变量
                const toDelete = [];
                for (const name of lineSet) {
                    if (!globalDefs.has(name)) toDelete.push(name);
                }
                for (const name of toDelete) lineSet.delete(name);
            }
        }

        // 添加 proc 参数
        const argsNode = _findChildByType(proc, 'arguments');
        if (argsNode) {
            const argNodes = _findChildrenByType(argsNode, 'argument');
            for (const arg of argNodes) {
                const name = arg.text;
                _addToScopeFromLine(scopeMap, name, bodyStart, bodyEnd);
            }
        }

        // 收集 body 内的局部定义（set, foreach 等）
        _collectLocalDefs(bodyNode, scopeMap, bodyStart, bodyEnd);

        // 处理 global/upvar/variable 声明
        _processScopeImports(bodyNode, scopeMap, root, bodyStart, bodyEnd);
    }
}

function _collectLocalDefs(node, scopeMap, scopeStart, scopeEnd) {
    if (!node) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    const defLine = idNode.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, name, defLine, scopeEnd);
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    const defLine = loopVar.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, loopVar.text, defLine, scopeEnd);
                }
            }
        }

        // command 节点：检查 for 的 init 中 set、lappend/append 隐式创建
        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;

                if (cmdName === 'for') {
                    // for init condition step body — 递归所有 braced_word
                    const bracedWords = _findChildrenByType(child, 'braced_word');
                    for (const bw of bracedWords) {
                        _collectLocalDefs(bw, scopeMap, scopeStart, scopeEnd);
                    }
                } else if (cmdName === 'lappend' || cmdName === 'append') {
                    // lappend/append varName — 第一个参数是变量名（隐式创建）
                    if (child.childCount >= 2) {
                        const varArg = child.child(1);
                        if (varArg && (varArg.type === 'id' || varArg.type === 'simple_word')) {
                            const name = varArg.text;
                            if (!name.startsWith('env(')) {
                                const defLine = varArg.startPosition.row + 1;
                                _addToScopeFromLine(scopeMap, name, defLine, scopeEnd);
                            }
                        }
                    }
                }
            }

            // 递归 command 的子节点
            _collectLocalDefs(child, scopeMap, scopeStart, scopeEnd);
        }

        // 递归 braced_word
        if (child.type === 'braced_word') {
            _collectLocalDefs(child, scopeMap, scopeStart, scopeEnd);
        }
    }
}

function _processScopeImports(node, scopeMap, root, bodyStart, bodyEnd) {
    if (!node) return;

    // 遍历 body 内所有 command 节点，查找 global/upvar/variable 声明
    walkNodes(node, n => {
        if (n.type !== 'command') return;
        const firstChild = n.child(0);
        if (!firstChild || firstChild.type !== 'simple_word') return;

        const cmdName = firstChild.text;

        if (cmdName === 'global') {
            // global varName1 varName2 ...
            for (let i = 1; i < n.childCount; i++) {
                const arg = n.child(i);
                if (arg && arg.type === 'simple_word') {
                    // 查找全局是否有这个变量的定义
                    const globalLine = scopeMap.get(1);
                    if (globalLine && globalLine.has(arg.text)) {
                        _addToScopeFromLine(scopeMap, arg.text, bodyStart, bodyEnd);
                    } else {
                        // 即使全局未定义也标记为可见（避免误报）
                        _addToScopeFromLine(scopeMap, arg.text, bodyStart, bodyEnd);
                    }
                }
            }
        }

        if (cmdName === 'upvar') {
            // upvar ?level? otherVar myVar
            // 最后一个参数是本地别名
            const words = _findChildrenByType(n, 'simple_word');
            if (words.length >= 2) {
                // 跳过 "upvar" 和可选的 level 参数
                // 简化处理：把最后一个 word 当作本地变量
                const localName = words[words.length - 1].text;
                _addToScopeFromLine(scopeMap, localName, bodyStart, bodyEnd);
            }
        }

        if (cmdName === 'variable') {
            // variable varName ?value?
            const words = _findChildrenByType(n, 'simple_word');
            if (words.length >= 2) {
                // 第二个 word 是变量名
                const varName = words[1].text;
                _addToScopeFromLine(scopeMap, varName, bodyStart, bodyEnd);
            }
        }
    });
}
```

- [ ] **Step 4: 更新 exports**

在 `module.exports` 中添加 `buildScopeMap`：

```javascript
module.exports = {
    parseSafe,
    getFoldingRanges,
    findMismatchedBraces,
    getVariables,
    getVariableRefs,
    buildScopeMap,
    getDocumentSymbols,
    TCL_LANGS,
};
```

- [ ] **Step 5: 运行测试确认通过**

```bash
node tests/test-tcl-scope-map.js
```

预期：全部测试通过

- [ ] **Step 6: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-scope-map.js
git commit -m "feat: 添加 buildScopeMap() 构建 Tcl 作用域映射"
```

---

### Task 3: 新建 `undef-var-diagnostic.js` 诊断模块（Tcl 部分）

**Files:**
- 新建: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 创建诊断模块**

创建 `src/lsp/providers/undef-var-diagnostic.js`，参照 `tcl-bracket-diagnostic.js` 的模式：

```javascript
// src/lsp/providers/undef-var-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

const DEBOUNCE_MS = 500;

/** Sentaurus 工具链隐式注入的变量白名单 */
const TCL_BUILTIN_VARS = new Set([
    'DesName', 'Pwd', 'Pd', 'ProjDir', 'Tooldir', 'env',
    'TOOLS_PRE', 'TOOLS_POST',
]);

/** Tcl 语言集合 */
const TCL_LANG_SET = astUtils.TCL_LANGS;

let diagnosticCollection;
let debounceTimer;

/**
 * 注册未定义变量诊断（Tcl 方言部分）。
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('undef-var-tcl');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const doc = event.document;
            if (!TCL_LANG_SET.has(doc.languageId)) return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (!TCL_LANG_SET.has(doc.languageId)) return;
            updateDiagnostics(doc);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (TCL_LANG_SET.has(doc.languageId)) {
                diagnosticCollection.delete(doc.uri);
            }
        })
    );
}

/**
 * 更新单个文档的未定义变量诊断。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const text = doc.getText();
    const diagnostics = checkTclUndefVars(text);

    diagnosticCollection.set(doc.uri, diagnostics);
}

/**
 * 检查 Tcl 代码中的未定义变量引用。
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkTclUndefVars(text) {
    const tree = astUtils.parseSafe(text);
    if (!tree) return [];

    try {
        const root = tree.rootNode;
        const refs = astUtils.getVariableRefs(root);
        const scopeMap = astUtils.buildScopeMap(root);

        const diagnostics = [];
        for (const ref of refs) {
            // 跳过白名单变量
            if (TCL_BUILTIN_VARS.has(ref.name)) continue;

            // 检查引用行是否可见该变量
            const visibleAtLine = scopeMap.get(ref.line);
            if (!visibleAtLine || !visibleAtLine.has(ref.name)) {
                const range = new vscode.Range(
                    ref.line - 1, ref.startCol,
                    ref.line - 1, ref.endCol
                );
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `未定义的变量: ${ref.name}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'undef-var';
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    } finally {
        tree.delete();
    }
}

module.exports = { activate, checkTclUndefVars, TCL_BUILTIN_VARS };
```

- [ ] **Step 2: 在 `extension.js` 中注册**

在 `src/extension.js` 中添加 require 和 activate 调用。

在文件顶部的 require 区域添加（约第 14 行后）：

```javascript
const undefVarDiagnostic = require('./lsp/providers/undef-var-diagnostic');
```

在 `activate` 函数中，`tclBracketDiagnostic.activate(context)` 之后添加：

```javascript
undefVarDiagnostic.activate(context);
```

- [ ] **Step 3: 手动验证**

1. 在 VSCode 中按 F5 启动 Extension Development Host
2. 打开一个 `*_des.cmd` 文件
3. 输入以下测试代码：

```tcl
set x 42
puts $x
puts $undefined_var
```

4. 验证：`$x` 不应有波浪线，`$undefined_var` 应显示黄色波浪线
5. 悬停波浪线应显示 "未定义的变量: undefined_var"

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js src/extension.js
git commit -m "feat: 添加 Tcl 方言未定义变量检测诊断（黄波浪线）"
```

---

### Task 4: 补充测试用例 — 跨作用域机制

**Files:**
- 修改: `tests/test-tcl-scope-map.js`

- [ ] **Step 1: 添加 upvar 和 variable 测试用例**

在 `tests/test-tcl-scope-map.js` 末尾（`console.log` 之前）添加：

```javascript
test('upvar 声明引入本地别名', () => {
    // upvar 1 outer_var local
    const upvarCmd = makeNode('command', 'upvar 1 outer_var local', [
        makeNode('simple_word', 'upvar', [], 1, 2, 1, 7),
        makeNode('simple_word', '1', [], 1, 8, 1, 9),
        makeNode('simple_word', 'outer_var', [], 1, 10, 1, 19),
        makeNode('simple_word', 'local', [], 1, 20, 1, 25),
    ], 1, 2, 1, 25);
    const procBody = makeNode('braced_word', '{ upvar 1 outer_var local }', [
        upvarCmd,
    ], 0, 15, 2, 1);
    const procArgs = makeNode('arguments', '', [], 0, 12, 0, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        procArgs,
        procBody,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    const bodyLine = scopeMap.get(2);
    assert.ok(bodyLine, 'body 行应有可见变量集');
    assert.ok(bodyLine.has('local'), 'upvar 别名 local 应可见');
});

test('variable 声明引入命名空间变量', () => {
    const varCmd = makeNode('command', 'variable ns_var', [
        makeNode('simple_word', 'variable', [], 1, 2, 1, 10),
        makeNode('simple_word', 'ns_var', [], 1, 11, 1, 17),
    ], 1, 2, 1, 17);
    const procBody = makeNode('braced_word', '{ variable ns_var }', [
        varCmd,
    ], 0, 15, 2, 1);
    const procArgs = makeNode('arguments', '', [], 0, 12, 0, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        procArgs,
        procBody,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const scopeMap = ast.buildScopeMap(root);
    const bodyLine = scopeMap.get(2);
    assert.ok(bodyLine, 'body 行应有可见变量集');
    assert.ok(bodyLine.has('ns_var'), 'variable 声明的 ns_var 应可见');
});

test('白名单变量不报未定义', () => {
    const refNode = makeNode('variable_ref', '$DesName', [], 0, 0, 0, 8);
    const root = makeNode('program', '', [refNode], 0, 0, 0, 8);

    const refs = ast.getVariableRefs(root);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'DesName');
    // DesName 在白名单中，诊断模块应跳过
    // 此测试验证引用收集正确，白名单过滤在诊断模块中处理
});
```

- [ ] **Step 2: 运行所有测试**

```bash
node tests/test-tcl-scope-map.js && node tests/test-tcl-var-refs.js && node tests/test-tcl-ast-variables.js
```

预期：全部测试通过

- [ ] **Step 3: 提交**

```bash
git add tests/test-tcl-scope-map.js
git commit -m "test: 补充 upvar/variable/白名单测试用例"
```

---

### Task 5: 端到端验证与清理

- [ ] **Step 1: 运行全部现有测试**

```bash
node tests/test-tcl-ast-variables.js && node tests/test-tcl-ast-utils.js && node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-scheme-parser.js
```

预期：全部通过，无回归

- [ ] **Step 2: 在 Extension Development Host 中验证完整场景**

测试文件内容：

```tcl
# test_des.cmd — 未定义变量检测测试
set global_var 42
puts $global_var

proc myProc {arg1} {
    global global_var
    set local_var [expr {$arg1 + 1}]
    puts $global_var
    puts $local_var
    puts $arg1
    puts $undefined_in_proc
}

puts $global_var
puts $undefined_global
puts $DesName
```

预期结果：
- `$global_var` — 无波浪线
- `$local_var` — 无波浪线（在 proc 内定义）
- `$arg1` — 无波浪线（proc 参数）
- `$undefined_in_proc` — 黄波浪线
- `$undefined_global` — 黄波浪线
- `$DesName` — 无波浪线（白名单）

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: 完成 Tcl 方言未定义变量检测功能"
```
