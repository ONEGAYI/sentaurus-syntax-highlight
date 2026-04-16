# Phase 3: 算法优化与加载策略 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除 Tcl buildScopeMap 的 O(n^1.7) 算法瓶颈，将 1000 行/50 proc 文件的处理时间从 45ms 降至 <10ms；同时实现 JSON 文档按语言懒加载，将激活时 I/O 阻塞从 ~4.1ms/1.46MB 降至 ~200KB/按需。

**Architecture:** 以「ScopeIndex 按需查询」替代「Map<line, Set> 全量预计算」，将 buildScopeMap 从 O(p × n × m) 降至 O(n)；懒加载用闭包+缓存 Proxy 实现，首次打开某语言文件时才加载对应文档 JSON。

**Tech Stack:** 纯 JavaScript（CommonJS），web-tree-sitter WASM，VSCode Extension API

**前置条件:** Phase 1（Quick Wins）和 Phase 2（统一缓存层）已完成

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 重写核心 | `src/lsp/tcl-ast-utils.js` | buildScopeMap → ScopeIndex 重构 |
| 新增测试 | `tests/test-tcl-scope-index.js` | ScopeIndex 类的单元测试 |
| 修改 | `src/lsp/providers/undef-var-diagnostic.js` | 消费者适配新接口 |
| 修改 | `src/lsp/parse-cache.js` | TclParseCache 缓存 ScopeIndex |
| 修改 | `src/extension.js` | 懒加载文档 JSON (#6)，countLinesUpTo 优化 (#16) |
| 验证 | `tests/test-tcl-scope-map.js` | 现有测试回归 |
| 验证 | `tests/test-tcl-var-refs.js` | 现有测试回归 |
| 验证 | `tests/test-undef-var-integration.js` | 集成测试回归 |
| 验证 | `tests/test-scheme-parser.js` | Scheme 解析器回归 |

---

## Task 1: ScopeIndex 数据结构 — 测试先行

**Files:**
- Create: `tests/test-tcl-scope-index.js`
- Modify: `src/lsp/tcl-ast-utils.js`

> **背景:** 当前 `buildScopeMap()` 返回 `Map<lineNum, Set<varName>>`，为每一行预分配 Set，复杂度 O(lines + p × n × m)。新设计用 `ScopeIndex` 类按需查询，只做一次 AST 遍历。

### 接口设计

```javascript
// 新接口: buildScopeIndex(root) → ScopeIndex
// ScopeIndex.getVisibleAt(lineNum) → Set<varName>
// 保持旧接口 buildScopeMap(root) → Map 兼容，内部委托给 ScopeIndex
```

- [ ] **Step 1: 编写 ScopeIndex.getVisibleAt 的失败测试**

```javascript
// tests/test-tcl-scope-index.js
'use strict';

const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ast = require('../src/lsp/tcl-ast-utils');

// 辅助：构建 mock AST 节点
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

console.log('\n=== ScopeIndex 测试 ===\n');

// 测试 1: buildScopeIndex 存在且返回 ScopeIndex 实例
test('buildScopeIndex 返回 ScopeIndex 实例', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    assert.ok(index, 'buildScopeIndex 应返回非 null');
    assert.strictEqual(typeof index.getVisibleAt, 'function', '应有 getVisibleAt 方法');
});

// 测试 2: 空文件 → 所有行返回空 Set
test('空文件 → getVisibleAt 返回空 Set', () => {
    const root = makeNode('program', '', [], 0, 0, 0, 0);
    const index = ast.buildScopeIndex(root);
    const visible = index.getVisibleAt(1);
    assert.ok(visible instanceof Set, '应返回 Set');
    assert.strictEqual(visible.size, 0, '空文件无可见变量');
});

// 测试 3: 全局 set 变量在定义行之后可见
test('全局 set 变量在定义行之后可见', () => {
    // set x 42 (在第 1 行，即 row=0)
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const index = ast.buildScopeIndex(root);

    // 第 1 行（row=0 → line 1）：x 在本行定义，应可见
    const visible1 = index.getVisibleAt(1);
    assert.ok(visible1.has('x'), '定义行应可见 x');

    // 第 2 行：x 应仍然可见
    const visible2 = index.getVisibleAt(2);
    assert.ok(visible2.has('x'), '后续行应可见 x');
});

// 测试 4: proc 参数在 body 内可见
test('proc 参数在 body 内可见', () => {
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

    const index = ast.buildScopeIndex(root);

    // proc body 行（row 0~2, 即 line 1~3）
    const visible1 = index.getVisibleAt(1);
    assert.ok(visible1.has('myProc'), '全局应可见函数名 myProc');
    assert.ok(visible1.has('arg1'), 'proc body 内应可见参数 arg1');
    assert.ok(visible1.has('arg2'), 'proc body 内应可见参数 arg2');
});

// 测试 5: proc 内部 set 变量在 proc body 内可见，但全局不可见
test('proc 内部局部变量仅在 body 内可见', () => {
    const innerSet = makeNode('set', 'set localVar 1', [
        makeNode('simple_word', 'set', [], 1, 2, 1, 5),
        makeNode('id', 'localVar', [], 1, 6, 1, 14),
        makeNode('simple_word', '1', [], 1, 15, 1, 16),
    ], 1, 2, 1, 16);
    const bodyNode = makeNode('braced_word', '{ set localVar 1 }', [
        innerSet,
    ], 0, 15, 2, 1);
    const procArgs = makeNode('arguments', '', [], 0, 12, 0, 14);
    const procNode = makeNode('procedure', 'proc myProc {} { ... }', [
        makeNode('simple_word', 'proc', [], 0, 0, 0, 4),
        makeNode('simple_word', 'myProc', [], 0, 5, 0, 11),
        procArgs,
        bodyNode,
    ], 0, 0, 2, 1);
    const root = makeNode('program', '', [procNode], 0, 0, 2, 1);

    const index = ast.buildScopeIndex(root);

    // proc body 内（line 2 = row 1）应可见 localVar
    const visibleInBody = index.getVisibleAt(2);
    assert.ok(visibleInBody.has('localVar'), 'proc body 内应可见局部变量 localVar');

    // proc 外部不应有 localVar（但需要有全局变量 myProc）
    const visibleOutside = index.getVisibleAt(5);
    assert.ok(!visibleOutside.has('localVar'), 'proc 外不应可见 localVar');
    assert.ok(visibleOutside.has('myProc'), 'proc 外应可见函数名 myProc');
});

// 测试 6: global 声明引入全局变量到 proc 作用域
test('global 声明引入全局变量到 proc 作用域', () => {
    const globalSetNode = makeNode('set', 'set global_var 1', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'global_var', [], 0, 4, 0, 14),
        makeNode('simple_word', '1', [], 0, 15, 0, 16),
    ], 0, 0, 0, 16);

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

    const index = ast.buildScopeIndex(root);
    const line3 = index.getVisibleAt(3);
    assert.ok(line3.has('global_var'), 'global 声明后应可见 global_var');
});

// 测试 7: foreach 循环变量在 body 内可见
test('foreach 循环变量在 body 内可见', () => {
    const argsNode = makeNode('arguments', 'item $list', [
        makeNode('argument', 'item', [], 0, 8, 0, 12),
        makeNode('variable_substitution', '$list', [], 0, 13, 0, 18),
    ], 0, 8, 0, 18);
    const bodyNode = makeNode('braced_word', '{ puts $item }', [], 0, 19, 0, 33);
    const foreachNode = makeNode('foreach', 'foreach item $list { ... }', [
        makeNode('simple_word', 'foreach', [], 0, 0, 0, 7),
        argsNode,
        bodyNode,
    ], 0, 0, 0, 33);
    const root = makeNode('program', '', [foreachNode], 0, 0, 0, 33);

    const index = ast.buildScopeIndex(root);
    const line1 = index.getVisibleAt(1);
    assert.ok(line1.has('item'), 'foreach 循环变量 item 应可见');
});

// 测试 8: upvar 声明引入本地别名
test('upvar 声明引入本地别名', () => {
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

    const index = ast.buildScopeIndex(root);
    const bodyLine = index.getVisibleAt(2);
    assert.ok(bodyLine.has('local'), 'upvar 别名 local 应可见');
});

// 测试 9: variable 声明引入命名空间变量
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

    const index = ast.buildScopeIndex(root);
    const bodyLine = index.getVisibleAt(2);
    assert.ok(bodyLine.has('ns_var'), 'variable 声明的 ns_var 应可见');
});

// 测试 10: buildScopeMap 兼容性 — 返回 Map 且结果与 ScopeIndex 一致
test('buildScopeMap 委托给 ScopeIndex 并返回兼容的 Map', () => {
    const setNode = makeNode('set', 'set x 42', [
        makeNode('simple_word', 'set', [], 0, 0, 0, 3),
        makeNode('id', 'x', [], 0, 4, 0, 5),
        makeNode('simple_word', '42', [], 0, 6, 0, 8),
    ], 0, 0, 0, 8);
    const root = makeNode('program', '', [setNode], 0, 0, 0, 8);

    const scopeMap = ast.buildScopeMap(root);
    assert.ok(scopeMap instanceof Map, 'buildScopeMap 应返回 Map');
    const line2 = scopeMap.get(2);
    assert.ok(line2, '第 2 行应有可见变量集');
    assert.ok(line2.has('x'), '第 2 行应可见变量 x');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-tcl-scope-index.js`
Expected: FAIL — `ast.buildScopeIndex is not a function`

- [ ] **Step 3: 实现 ScopeIndex 类和 buildScopeIndex 函数**

在 `src/lsp/tcl-ast-utils.js` 中，在 `buildScopeMap` 函数之前添加 `ScopeIndex` 类和 `buildScopeIndex` 函数。然后修改 `buildScopeMap` 委托给新实现。

```javascript
// === ScopeIndex: 按需查询的作用域索引（替代 Map<line, Set> 全量预计算）===

class ScopeIndex {
    /**
     * @param {Array<{name: string, defLine: number}>} globalDefs - 全局定义
     * @param {Array<{name: string, startLine: number, endLine: number, params: string[], localDefs: Array<{name: string, defLine: number}>, scopeImports: string[]}>} procScopes - proc 作用域
     */
    constructor(globalDefs, procScopes) {
        /** @type {Map<string, number>} */
        this._globalDefs = new Map(); // name → defLine
        for (const d of globalDefs) {
            if (!this._globalDefs.has(d.name)) {
                this._globalDefs.set(d.name, d.defLine);
            }
        }

        // procScopes 按 startLine 排序，方便二分查找
        this._procScopes = procScopes
            .slice()
            .sort((a, b) => a.startLine - b.startLine);

        /** @type {Map<string, number>} 全局 proc 名 → defLine（proc 内部也应可见） */
        this._globalProcNames = new Map();
        for (const d of globalDefs) {
            if (d.isProc) {
                this._globalProcNames.set(d.name, d.defLine);
            }
        }
    }

    /**
     * 查询指定行号可见的变量集合。
     * @param {number} line - 1-based 行号
     * @returns {Set<string>} 该行可见的变量名集合
     */
    getVisibleAt(line) {
        const result = new Set();

        // 1. 添加在该行之前定义的全局变量
        for (const [name, defLine] of this._globalDefs) {
            if (defLine <= line) {
                result.add(name);
            }
        }

        // 2. 检查是否在某个 proc body 内
        for (const proc of this._procScopes) {
            if (line >= proc.startLine && line <= proc.endLine) {
                // 在 proc 内部：移除非 proc 名的全局变量，只保留全局 proc 名
                const toRemove = [];
                for (const name of result) {
                    if (!this._globalProcNames.has(name)) {
                        toRemove.push(name);
                    }
                }
                for (const name of toRemove) result.delete(name);

                // 添加 proc 参数
                for (const param of proc.params) {
                    result.add(param);
                }

                // 添加在该行之前定义的局部变量
                for (const local of proc.localDefs) {
                    if (local.defLine <= line) {
                        result.add(local.name);
                    }
                }

                // 添加作用域导入（global/upvar/variable）
                for (const imp of proc.scopeImports) {
                    result.add(imp);
                }

                break; // 同时只在一个 proc 内
            }
        }

        return result;
    }
}

/**
 * 构建 Tcl AST 的作用域索引（ScopeIndex），支持按行查询可见变量。
 * 替代原有的 buildScopeMap，复杂度从 O(p × n × m) 降至 O(n)。
 * @param {object} root - tree-sitter 根节点
 * @returns {ScopeIndex}
 */
function buildScopeIndex(root) {
    const globalDefs = [];
    const procScopes = [];

    // 单遍遍历收集所有信息
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    globalDefs.push({
                        name,
                        defLine: idNode.startPosition.row + 1,
                        isProc: false,
                    });
                }
            }
        }

        if (child.type === 'procedure') {
            const simpleWords = _findChildrenByType(child, 'simple_word');
            for (const sw of simpleWords) {
                if (sw.text !== 'proc') {
                    globalDefs.push({
                        name: sw.text,
                        defLine: sw.startPosition.row + 1,
                        isProc: true,
                    });
                    break;
                }
            }

            // 收集 proc 作用域信息
            const bodyNode = _findChildByType(child, 'braced_word');
            if (bodyNode) {
                const bodyStart = bodyNode.startPosition.row + 1;
                const bodyEnd = bodyNode.endPosition.row + 1;

                // 收集参数
                const params = [];
                const argsNode = _findChildByType(child, 'arguments');
                if (argsNode) {
                    const argNodes = _findChildrenByType(argsNode, 'argument');
                    for (const arg of argNodes) {
                        params.push(arg.text);
                    }
                }

                // 收集局部定义
                const localDefs = [];
                _collectLocalDefsForIndex(bodyNode, localDefs, bodyStart, bodyEnd);

                // 收集作用域导入（global/upvar/variable）
                const scopeImports = [];
                _collectScopeImportsForIndex(bodyNode, scopeImports);

                procScopes.push({
                    name: simpleWords.find(sw => sw.text !== 'proc')?.text || '',
                    startLine: bodyStart,
                    endLine: bodyEnd,
                    params,
                    localDefs,
                    scopeImports,
                });
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                if (cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(') && !/^\d/.test(name)) {
                                globalDefs.push({
                                    name,
                                    defLine: arg.startPosition.row + 1,
                                    isProc: false,
                                });
                                break;
                            }
                        }
                    }
                }
                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, globalDefs, 1, Infinity);
                        }
                    }
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    globalDefs.push({
                        name: loopVar.text,
                        defLine: loopVar.startPosition.row + 1,
                        isProc: false,
                    });
                }
            }
        }
    }

    return new ScopeIndex(globalDefs, procScopes);
}

/**
 * 为 ScopeIndex 收集局部定义（简化版 _collectLocalDefs，直接推入数组而非操作 scopeMap）。
 */
function _collectLocalDefsForIndex(node, defs, scopeStart, scopeEnd) {
    if (!node) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    defs.push({ name, defLine: idNode.startPosition.row + 1 });
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    defs.push({ name: loopVar.text, defLine: loopVar.startPosition.row + 1 });
                }
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, defs, scopeStart, scopeEnd);
                        }
                    }
                } else if (cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(')) {
                                defs.push({ name, defLine: arg.startPosition.row + 1 });
                                break;
                            }
                        }
                    }
                }
            }
            _collectLocalDefsForIndex(child, defs, scopeStart, scopeEnd);
        }

        if (child.type === 'braced_word') {
            _collectLocalDefsForIndex(child, defs, scopeStart, scopeEnd);
        }
    }
}

/**
 * 为 ScopeIndex 收集作用域导入（global/upvar/variable 声明的变量名）。
 */
function _collectScopeImportsForIndex(node, imports) {
    if (!node) return;

    walkNodes(node, n => {
        if (n.type === 'global') {
            for (let i = 0; i < n.childCount; i++) {
                const child = n.child(i);
                if (child && child.type === 'simple_word') {
                    imports.push(child.text);
                }
            }
            return;
        }

        if (n.type !== 'command') return;
        const firstChild = n.child(0);
        if (!firstChild || firstChild.type !== 'simple_word') return;

        const cmdName = firstChild.text;

        if (cmdName === 'global') {
            for (let i = 1; i < n.childCount; i++) {
                const arg = n.child(i);
                if (arg && arg.type === 'simple_word') {
                    imports.push(arg.text);
                }
            }
        }

        if (cmdName === 'upvar') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                imports.push(words[words.length - 1].text);
            }
        }

        if (cmdName === 'variable') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                imports.push(words[1].text);
            }
        }
    });
}
```

同时修改 `buildScopeMap` 委托给 `buildScopeIndex`：

```javascript
function buildScopeMap(root) {
    const index = buildScopeIndex(root);
    const maxLine = _countMaxLine(root) + 1;
    const scopeMap = new Map();
    for (let i = 1; i <= maxLine; i++) {
        scopeMap.set(i, index.getVisibleAt(i));
    }
    return scopeMap;
}
```

在 `module.exports` 中添加 `buildScopeIndex` 和 `ScopeIndex`：

```javascript
module.exports = {
    parseSafe,
    getFoldingRanges,
    findMismatchedBraces,
    getVariables,
    getVariableRefs,
    buildScopeMap,
    buildScopeIndex,
    ScopeIndex,
    getDocumentSymbols,
    SymbolKind,
    TCL_LANGS,
};
```

- [ ] **Step 4: 运行新测试**

Run: `node tests/test-tcl-scope-index.js`
Expected: 全部 PASS

- [ ] **Step 5: 运行现有测试回归**

Run: `node tests/test-tcl-scope-map.js && node tests/test-tcl-var-refs.js`
Expected: 全部 PASS（buildScopeMap 委托给 buildScopeIndex，接口不变）

- [ ] **Step 6: 运行全部测试**

Run: `node tests/test-tcl-scope-map.js && node tests/test-tcl-scope-index.js && node tests/test-tcl-var-refs.js && node tests/test-tcl-ast-utils.js && node tests/test-tcl-ast-variables.js && node tests/test-undef-var-integration.js`
Expected: 全部 PASS

- [ ] **Step 7: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-scope-index.js
git commit -m "perf(#3): ScopeIndex 按需查询替代 Map<line, Set> 全量预计算"
```

---

## Task 2: 消费者适配 — undef-var-diagnostic 使用 ScopeIndex

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js:111`
- Modify: `src/lsp/parse-cache.js`

> **背景:** `checkTclUndefVars` 当前调用 `buildScopeMap(root)` 获取 `Map<line, Set>` 然后逐行查询。改为直接使用 `buildScopeIndex(root)` 的 `getVisibleAt(line)` 方法，避免构建完整的 Map。

- [ ] **Step 1: 修改 checkTclUndefVars 使用 buildScopeIndex**

修改 `src/lsp/providers/undef-var-diagnostic.js` 的 `checkTclUndefVars` 函数：

```javascript
function checkTclUndefVars(document) {
    const entry = tclCache.get(document);
    if (!entry) return [];

    const root = entry.tree.rootNode;
    const refs = astUtils.getVariableRefs(root);
    const scopeIndex = astUtils.buildScopeIndex(root);

    const diagnostics = [];
    for (const ref of refs) {
        // 跳过白名单变量
        if (TCL_BUILTIN_VARS.has(ref.name)) continue;

        // 检查引用行是否可见该变量
        const visibleAtLine = scopeIndex.getVisibleAt(ref.line);
        if (!visibleAtLine.has(ref.name)) {
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
}
```

- [ ] **Step 2: 运行集成测试回归**

Run: `node tests/test-undef-var-integration.js`
Expected: PASS

- [ ] **Step 3: 运行全部 Tcl 相关测试**

Run: `node tests/test-tcl-scope-map.js && node tests/test-tcl-scope-index.js && node tests/test-tcl-var-refs.js && node tests/test-tcl-ast-utils.js && node tests/test-undef-var-integration.js`
Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "perf: undef-var 诊断改用 ScopeIndex 按需查询"
```

---

## Task 3: 懒加载文档 JSON

**Files:**
- Modify: `src/extension.js`

> **背景:** 当前 `activate()` 同步加载 6 个文档 JSON（~1.46MB），其中大部分语言的用户可能不会用到。改为按语言懒加载：首次打开某语言文件时才加载对应 JSON。

- [ ] **Step 1: 编写懒加载加载器**

修改 `src/extension.js` 中的 `activate()` 函数。将文档加载逻辑从「激活时全量加载」改为「按需懒加载」。

找到以下代码段（约第 321-342 行附近）：

```javascript
// 按语言加载函数文档（各语言隔离，避免文档泄露）
const langFuncDocs = {};
const sdeDocs = loadDocsJson('sde_function_docs.json', useZh);
const schemeDocs = loadDocsJson('scheme_function_docs.json', useZh);
const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', useZh);
const svisualDocs = loadDocsJson('svisual_command_docs.json', useZh);
const tclDocs = loadDocsJson('tcl_command_docs.json', useZh);

// SDE: SDE API + Scheme 内置函数
langFuncDocs.sde = { ...sdeDocs };
if (schemeDocs) Object.assign(langFuncDocs.sde, schemeDocs);

// Tcl 方言语言：各自专属文档 + 共享的 Tcl 核心命令文档
langFuncDocs.sdevice = { ...(sdeviceDocs || {}), ...(tclDocs || {}) };
langFuncDocs.svisual = { ...(svisualDocs || {}), ...(tclDocs || {}) };
langFuncDocs.sprocess = { ...(tclDocs || {}) };
langFuncDocs.emw = { ...(tclDocs || {}) };
langFuncDocs.inspect = { ...(tclDocs || {}) };
```

替换为懒加载实现：

```javascript
// 按语言懒加载函数文档（首次使用时才加载）
const langFuncDocs = {};
const _docsCache = {};
function getDocs(langId) {
    if (langFuncDocs[langId]) return langFuncDocs[langId];

    if (langId === 'sde') {
        if (!_docsCache.sde) {
            const sdeDocs = loadDocsJson('sde_function_docs.json', useZh) || {};
            const schemeDocs = loadDocsJson('scheme_function_docs.json', useZh);
            _docsCache.sde = { ...sdeDocs };
            if (schemeDocs) Object.assign(_docsCache.sde, schemeDocs);
        }
        langFuncDocs.sde = _docsCache.sde;
    } else {
        // Tcl 方言语言
        if (!_docsCache.tcl) {
            _docsCache.tcl = loadDocsJson('tcl_command_docs.json', useZh) || {};
        }
        if (!_docsCache[langId]) {
            const langSpecificDocs = (() => {
                if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
                if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
                return {};
            })();
            _docsCache[langId] = { ...langSpecificDocs, ..._docsCache.tcl };
        }
        langFuncDocs[langId] = _docsCache[langId];
    }
    return langFuncDocs[langId];
}
```

同时需要更新所有使用 `langFuncDocs[langId]` 的地方，改为调用 `getDocs(langId)`。

在 Completion Provider 中（约第 474 行），将：
```javascript
const items = buildItems(moduleKeywords, langFuncDocs[langId], langId);
```
改为：
```javascript
const items = buildItems(moduleKeywords, getDocs(langId), langId);
```

在 Hover Provider 中（约第 528 行），将：
```javascript
const docs = langFuncDocs[langId] || {};
```
改为：
```javascript
const docs = getDocs(langId) || {};
```

**重要：modeDispatch 构建仍然需要 enSdeDocs**。保留这部分同步加载（它是 Scheme 语义功能的核心数据，必须在 activate 时可用）：

```javascript
// 构建 modeDispatch 查找表：始终从英文文档提取（结构化元数据，与语言无关）
// 这部分需要同步加载，因为 Scheme 语义功能在 activate 时必须可用
const enSdeDocs = loadDocsJson('sde_function_docs.json', false);
const modeDispatchSource = enSdeDocs || {};
const modeDispatchTable = {};
for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
    if (fnDoc.modeDispatch) {
        modeDispatchTable[fnName] = fnDoc.modeDispatch;
    }
}
```

- [ ] **Step 2: 运行全部测试**

Run: `node tests/test-snippet-prefixes.js && node tests/test-definitions.js && node tests/test-expression-converter.js`
Expected: PASS

- [ ] **Step 3: 手动验证**

在 VSCode Extension Development Host 中：
1. 打开一个 `.cmd` 文件（Tcl 语言），验证补全和悬停正常
2. 打开一个 `_dvs.cmd` 文件（SDE 语言），验证补全和悬停正常
3. 确认各语言的文档在首次打开时才加载

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "perf(#6): 文档 JSON 按语言懒加载，激活时仅加载 modeDispatch 元数据"
```

---

## Task 4: countLinesUpTo 优化 — 复用 lineStarts 缓存

**Files:**
- Modify: `src/lsp/scheme-parser.js:107-249`

> **背景:** `countLinesUpTo(offset)` 在 `parse()` 内部被多次调用，每次 O(n) 逐字符扫描。Phase 2 的 `computeLineStarts` 已经有了行偏移表，但 `parse()` 内部在解析过程中也需要行号信息。可以在 `tokenize` 阶段复用已有的行号追踪，避免二次扫描。

- [ ] **Step 1: 分析调用点**

查看 `parse()` 内部 `countLinesUpTo` 的调用位置：
- 仅在 `parse()` 结尾用于 `ast.endLine` 计算：`countLinesUpTo(text.length)`
- 各 Token 已有 `line` 属性（由 tokenizer 维护）

**优化方案：** `parse()` 末尾仅调用一次 `countLinesUpTo(text.length)`，而 tokenizer 已经在逐字符扫描时追踪了 `line` 变量。可以在 tokenize 返回时顺便返回最大行号，避免 `countLinesUpTo` 的重复扫描。

- [ ] **Step 2: 修改 tokenize 返回 maxLine**

修改 `src/lsp/scheme-parser.js` 中的 `tokenize` 函数，在返回 tokens 的同时记录最大行号：

在 `parse()` 函数内部，找到：
```javascript
function parse(text) {
    const tokens = tokenize(text);
```

替换为：
```javascript
function parse(text) {
    const { tokens, maxLine: tokenizedMaxLine } = tokenize(text);
```

修改 `tokenize` 函数末尾，从：
```javascript
    tokens.push({ type: TokenType.EOF, value: null, start: i, end: i, line });
    return tokens;
```
改为：
```javascript
    tokens.push({ type: TokenType.EOF, value: null, start: i, end: i, line });
    return { tokens, maxLine: line };
```

然后修改 `parse()` 中的 `countLinesUpTo` 调用。找到：
```javascript
    return { ast, errors };
```

在 `ast` 对象中将：
```javascript
    const ast = {
        type: 'Program',
        body,
        start: 0,
        end: text.length,
        line: 1,
        endLine: countLinesUpTo(text.length),
    };
```
改为：
```javascript
    const ast = {
        type: 'Program',
        body,
        start: 0,
        end: text.length,
        line: 1,
        endLine: tokenizedMaxLine,
    };
```

现在 `countLinesUpTo` 函数不再被使用，可以删除它。

- [ ] **Step 3: 运行 Scheme 测试回归**

Run: `node tests/test-scheme-parser.js && node tests/test-scope-analyzer.js && node tests/test-definitions.js`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/lsp/scheme-parser.js
git commit -m "perf(#16): 复用 tokenizer 行号追踪，消除 countLinesUpTo 重复扫描"
```

---

## Task 5: 最终回归与性能基准

**Files:**
- Verify: all test files

- [ ] **Step 1: 运行全部 17 个测试套件**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f"; done`
Expected: 全部 PASS

- [ ] **Step 2: 运行性能基准对比**

使用项目的基准测试脚本（如果存在），或在 VSCode Extension Development Host 中手动测试 1000 行 SDE 文件和 1000 行/50 proc Tcl 文件的编辑流畅度。

预期改进：
- Tcl buildScopeMap (1000L/50P): 45ms → **<10ms**（ScopeIndex 按需查询替代全量 Map）
- 激活时 I/O: ~1.46MB → ~452KB（仅加载 all_keywords.json + sde_function_docs.json 的 modeDispatch 数据）

- [ ] **Step 3: 更新蓝图**

更新 `docs/superpowers/plans/2026-04-16-performance-optimization-blueprint.md`：
- 标记 Phase 3 为已完成
- 添加实际基准数据

- [ ] **Step 4: 提交**

```bash
git add docs/superpowers/plans/2026-04-16-performance-optimization-blueprint.md
git commit -m "docs: 更新性能优化蓝图，标记 Phase 3 完成"
```

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| ScopeIndex.getVisibleAt 语义与旧 Map 不一致 | 变量诊断误报/漏报 | Task 1 的 10 个测试 + 旧 test-tcl-scope-map.js 全部回归 |
| 懒加载时 Provider 调用太早 | 补全/悬停无数据 | modeDispatch 同步加载兜底；getDocs 闭包确保首次调用即加载 |
| buildScopeMap 委托后性能反而下降 | 1000 行文件 buildScopeMap 变慢 | Task 5 基准测试验证；如有回退可保留旧实现 |
| tokenize 返回值类型变更 | 解析器外部消费者 break | tokenizer 是 parse() 内部函数，不对外暴露 |

## 不做的事

- **不引入 Web Worker**：缓存层已足够
- **不修改文件结构**：保持 `src/lsp/providers/` 组织方式
- **不引入 TypeScript**：项目约定纯 JS + CommonJS
- **不修改 buildScopeMap 的旧接口签名**：保持向后兼容，同时提供新的 buildScopeIndex
