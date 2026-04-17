# SDE 符号索引与语义分析（Phase 3 MVP）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SDE (Scheme) 建立 Region/Material/Contact 三类符号的索引，实现语义诊断、补全和 Find All References。

**Architecture:** 声明式参数映射表（symbolParams）配置在 sde_function_docs.json 中，symbol-index.js 遍历 AST 提取符号定义/引用，三个 Provider 分别驱动诊断、补全和引用查找。

**Tech Stack:** 纯 JavaScript (CommonJS)、scheme-parser AST、vscode Extension API、Node.js assert 测试框架

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 创建 | `src/lsp/symbol-index.js` | 符号提取引擎：AST 遍历 + 声明式配置 |
| 创建 | `src/lsp/providers/region-undef-diagnostic.js` | Region/Material/Contact 未定义语义诊断 |
| 创建 | `src/lsp/providers/symbol-completion.js` | 符号补全 Provider |
| 创建 | `src/lsp/providers/symbol-reference-provider.js` | Find All References Provider |
| 创建 | `tests/test-symbol-index.js` | 符号提取引擎单元测试 |
| 创建 | `tests/test-region-undef-diagnostic.js` | 语义诊断单元测试 |
| 创建 | `tests/test-symbol-completion.js` | 符号补全单元测试 |
| 创建 | `tests/test-symbol-reference.js` | 引用查找单元测试 |
| 修改 | `syntaxes/sde_function_docs.json` | 为约 50 个 API 增加 symbolParams 字段 |
| 修改 | `src/extension.js` | 注册新 Provider、加载 symbolParamsTable |

---

## Task 1: symbol-index.js 核心引擎 — resolveSymbolName

**Files:**
- Create: `src/lsp/symbol-index.js`
- Test: `tests/test-symbol-index.js`

- [ ] **Step 1: 编写 resolveSymbolName 的测试**

```js
// tests/test-symbol-index.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols, resolveSymbolName } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// --- resolveSymbolName ---
console.log('\nresolveSymbolName:');

test('String 节点直接返回 value', () => {
    const { ast } = parse('(foo "R.Si")');
    const list = ast.body[0];
    // children[0]=foo, children[1]="R.Si"
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 全字面量拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si"))');
    const list = ast.body[0];
    const strAppendList = list.children[1]; // (string-append "R." "Si")
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si');
});

test('string-append 多段拼接', () => {
    const { ast } = parse('(foo (string-append "R." "Si" ".Sub"))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, 'R.Si.Sub');
});

test('string-append 含变量返回 null', () => {
    const { ast } = parse('(foo (string-append "R." name))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, null);
});

test('string-append 空参数返回空字符串', () => {
    const { ast } = parse('(foo (string-append))');
    const list = ast.body[0];
    const strAppendList = list.children[1];
    const result = resolveSymbolName(strAppendList);
    assert.strictEqual(result, '');
});

test('Identifier 节点返回 null', () => {
    const { ast } = parse('(foo bar)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

test('Number 节点返回 null', () => {
    const { ast } = parse('(foo 42)');
    const list = ast.body[0];
    const result = resolveSymbolName(list.children[1]);
    assert.strictEqual(result, null);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试验证失败**

```bash
node tests/test-symbol-index.js
```

Expected: FAIL — `Cannot find module '../src/lsp/symbol-index'`

- [ ] **Step 3: 实现 resolveSymbolName + extractSymbols 骨架**

```js
// src/lsp/symbol-index.js
'use strict';

/**
 * 从 AST 节点解析符号名称字符串。
 * - String 节点 → 直接返回 value
 * - List 节点且首元素为 string-append → 尝试静态拼接全字面量子节点
 * - 其他 → 返回 null（动态名称，无法静态推断）
 * @param {object} node - AST 节点
 * @returns {string|null}
 */
function resolveSymbolName(node) {
    if (!node) return null;

    if (node.type === 'String') {
        return node.value;
    }

    if (node.type === 'List') {
        const children = node.children;
        if (children.length >= 1 &&
            children[0].type === 'Identifier' &&
            children[0].value === 'string-append') {
            const parts = [];
            for (let i = 1; i < children.length; i++) {
                if (children[i].type === 'String') {
                    parts.push(children[i].value);
                } else {
                    return null; // 包含非字面量
                }
            }
            return parts.join('');
        }
    }

    return null;
}

/**
 * 从 AST 提取符号定义和引用。
 * @param {object} ast - scheme-parser 生成的 AST (Program 节点)
 * @param {string} sourceText - 源文本
 * @param {object} symbolParamsTable - 函数名 → symbolParams 的映射表
 * @param {object} [modeDispatchTable] - 可选，处理带模式分派的函数
 * @returns {{ defs: SymbolEntry[], refs: SymbolEntry[] }}
 */
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable) {
    // 占位实现，Task 2 完善
    return { defs: [], refs: [] };
}

module.exports = { extractSymbols, resolveSymbolName };
```

- [ ] **Step 4: 运行测试验证通过**

```bash
node tests/test-symbol-index.js
```

Expected: 7 通过, 0 失败

- [ ] **Step 5: 提交**

```bash
git add src/lsp/symbol-index.js tests/test-symbol-index.js
git commit -m "feat(sde): 添加符号索引引擎骨架和 resolveSymbolName"
```

---

## Task 2: symbol-index.js — extractSymbols 核心逻辑

**Files:**
- Modify: `src/lsp/symbol-index.js`
- Modify: `tests/test-symbol-index.js`

- [ ] **Step 1: 追加 extractSymbols 测试**

在 `tests/test-symbol-index.js` 的 `console.log(`\n结果:`) 之前追加：

```js
// --- extractSymbols ---
console.log('\nextractSymbols:');

test('提取 create-rectangle 的 region 和 material 定义', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[0].type, 'material');
    assert.strictEqual(defs[0].role, 'def');
    assert.strictEqual(defs[1].name, 'R.Si');
    assert.strictEqual(defs[1].type, 'region');
    assert.strictEqual(refs.length, 0);
});

test('提取引用和定义共存', () => {
    const code = '(sdedr:define-refinement-region "Place" "Def" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdedr:define-refinement-region': {
            symbolParams: [
                { index: 2, role: 'ref', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[0].type, 'region');
    assert.strictEqual(refs[0].role, 'ref');
});

test('未配置 symbolParams 的函数不提取', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {};
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 0);
});

test('参数节点为非字符串时跳过', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) some-var some-region)';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
});

test('string-append 定义被正确提取', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" (string-append "R." "Si"))';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[1].name, 'R.Si');
    assert.strictEqual(defs[1].type, 'region');
});

test('多行代码中提取多个符号', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Sub")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Oxide" "R.Ox")
(sdegeo:define-contact-set "Source" 4.0 "Blue" "solid")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
        'sdegeo:define-contact-set': {
            symbolParams: [
                { index: 0, role: 'def', type: 'contact' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 5); // 2 material + 2 region + 1 contact
});

test('提取结果包含位置信息', () => {
    const code = '(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")';
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-rectangle': {
            symbolParams: [
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].line, 1);
    assert.ok(defs[0].start > 0);
    assert.ok(defs[0].end > defs[0].start);
    assert.strictEqual(defs[0].functionName, 'sdegeo:create-rectangle');
});

test('modeDispatch 函数：offset-interface region 模式', () => {
    const code = '(sdedr:offset-interface "region" "R.Si" "R.Ox")';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-interface': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'region' },
                { index: 1, role: 'ref', type: 'region' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-interface': {
            argIndex: 0,
            modes: {
                region: { params: ['region1', 'region2'] },
                material: { params: ['material1', 'material2'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[1].name, 'R.Ox');
});

test('modeDispatch 函数：offset-interface material 模式', () => {
    const code = '(sdedr:offset-interface "material" "Silicon" "Oxide")';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-interface': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'material' },
                { index: 1, role: 'ref', type: 'material' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-interface': {
            argIndex: 0,
            modes: {
                region: { params: ['region1', 'region2'] },
                material: { params: ['material1', 'material2'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].name, 'Silicon');
    assert.strictEqual(refs[0].type, 'material');
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
node tests/test-symbol-index.js
```

Expected: 前面 resolveSymbolName 的 7 个测试通过，新增的 extractSymbols 测试失败（defs 为空）。

- [ ] **Step 3: 实现 extractSymbols**

替换 `src/lsp/symbol-index.js` 中的占位 `extractSymbols`：

```js
/**
 * 过滤 Comment 节点后的有效子节点。
 * parseList 已过滤 Comment，但保留此函数作为安全防护。
 */
function effectiveChildren(listNode) {
    return listNode.children.filter(c => c.type !== 'Comment');
}

/**
 * 为有 modeDispatch 的函数计算参数偏移量。
 * modeDispatch 函数的实际参数从 argIndex+2 开始（+1 跳过函数名，+1 跳过模式关键词）。
 * 返回调整后的 symbolParams 数组。
 */
function adjustParamsForMode(symbolParams, callNode, modeDispatchMeta) {
    if (!modeDispatchMeta) return symbolParams;
    const ec = effectiveChildren(callNode);
    const modeArgIdx = modeDispatchMeta.argIndex + 1; // +1 跳过函数名
    const modeNode = ec[modeArgIdx];
    if (!modeNode) return [];
    let modeValue = null;
    if (modeNode.type === 'String') modeValue = modeNode.value;
    else if (modeNode.type === 'Identifier') modeValue = modeNode.value;
    if (!modeValue || !modeDispatchMeta.modes[modeValue]) return [];
    // modeDispatch 函数：模式关键词占一个参数位，之后的参数索引需要考虑偏移
    // symbolParams 中的 index 是相对于 modeData.params 的索引
    // 在 ec 中，参数从 modeArgIdx+1 开始
    return symbolParams;
}

function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable) {
    const defs = [];
    const refs = [];

    function walk(node) {
        if (node.type === 'List') {
            const ec = effectiveChildren(node);
            if (ec.length >= 1 && ec[0].type === 'Identifier') {
                const funcName = ec[0].value;
                const config = symbolParamsTable[funcName];
                if (config && config.symbolParams) {
                    const modeDispatchMeta = modeDispatchTable ? modeDispatchTable[funcName] : null;

                    for (const param of config.symbolParams) {
                        let argIndex;
                        if (modeDispatchMeta) {
                            // modeDispatch 函数：模式关键词在 argIndex 位置，
                            // 参数从 argIndex+2 开始（+1 跳过函数名，+1 跳过模式关键词）
                            argIndex = modeDispatchMeta.argIndex + 1 + 1 + param.index;
                        } else {
                            // 普通函数：+1 跳过函数名
                            argIndex = param.index + 1;
                        }

                        if (argIndex < ec.length) {
                            const argNode = ec[argIndex];
                            const name = resolveSymbolName(argNode);
                            if (name !== null) {
                                const entry = {
                                    name,
                                    type: param.type,
                                    role: param.role,
                                    line: argNode.line,
                                    start: argNode.start,
                                    end: argNode.end,
                                    functionName: funcName,
                                };
                                if (param.role === 'def') {
                                    defs.push(entry);
                                } else {
                                    refs.push(entry);
                                }
                            }
                        }
                    }
                }
            }
            for (const child of node.children) walk(child);
        } else if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        } else if (node.type === 'Quote') {
            walk(node.expression);
        }
    }

    walk(ast);
    return { defs, refs };
}
```

同时更新 `module.exports`：

```js
module.exports = { extractSymbols, resolveSymbolName, effectiveChildren };
```

- [ ] **Step 4: 运行测试验证通过**

```bash
node tests/test-symbol-index.js
```

Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/lsp/symbol-index.js tests/test-symbol-index.js
git commit -m "feat(sde): 实现 extractSymbols 核心提取逻辑（含 modeDispatch 支持）"
```

---

## Task 3: sde_function_docs.json — 添加 symbolParams 配置

**Files:**
- Modify: `syntaxes/sde_function_docs.json`

- [ ] **Step 1: 为 create-* 系列函数添加 symbolParams**

在 `syntaxes/sde_function_docs.json` 中为以下函数追加 `symbolParams` 字段。每个函数的 JSON 对象末尾（在最后一个 `}` 之前）添加 `"symbolParams": [...]`。

**需要修改的函数及精确配置：**

```json
"sdegeo:create-rectangle": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-circle": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-cuboid": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-cone": { ..., "symbolParams": [
    {"index": 6, "role": "def", "type": "material"},
    {"index": 7, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-cylinder": { ..., "symbolParams": [
    {"index": 5, "role": "def", "type": "material"},
    {"index": 6, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-ellipse": { ..., "symbolParams": [
    {"index": 3, "role": "def", "type": "material"},
    {"index": 4, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-ellipsoid": { ..., "symbolParams": [
    {"index": 3, "role": "def", "type": "material"},
    {"index": 4, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-sphere": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-torus": { ..., "symbolParams": [
    {"index": 3, "role": "def", "type": "material"},
    {"index": 4, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-triangle": { ..., "symbolParams": [
    {"index": 3, "role": "def", "type": "material"},
    {"index": 4, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-polygon": { ..., "symbolParams": [
    {"index": 1, "role": "def", "type": "material"},
    {"index": 2, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-prism": { ..., "symbolParams": [
    {"index": 5, "role": "def", "type": "material"},
    {"index": 6, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-pyramid": { ..., "symbolParams": [
    {"index": 6, "role": "def", "type": "material"},
    {"index": 7, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-reg-polygon": { ..., "symbolParams": [
    {"index": 4, "role": "def", "type": "material"},
    {"index": 5, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-ruled-region": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-ot-sphere": { ..., "symbolParams": [
    {"index": 5, "role": "def", "type": "material"},
    {"index": 6, "role": "def", "type": "region"}
]}
```

```json
"sdegeo:create-ot-ellipsoid": { ..., "symbolParams": [
    {"index": 5, "role": "def", "type": "material"},
    {"index": 6, "role": "def", "type": "region"}
]}
```

- [ ] **Step 2: 为 Contact 定义和引用函数添加 symbolParams**

```json
"sdegeo:define-contact-set": { ..., "symbolParams": [
    {"index": 0, "role": "def", "type": "contact"}
]}
```

```json
"sdegeo:define-3d-contact-by-polygon": { ..., "symbolParams": [
    {"index": 2, "role": "def", "type": "contact"}
]}
```

```json
"sdegeo:delete-contact-set": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:set-contact": { ..., "symbolParams": [
    {"index": 1, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:set-contact-edges": { ..., "symbolParams": [
    {"index": 1, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:set-contact-faces-by-polygon": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:get-contact-edgelist": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:get-contact-facelist": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:set-current-contact-set": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "contact"}
]}
```

```json
"sdegeo:rename-contact": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "contact"},
    {"index": 1, "role": "def", "type": "contact"}
]}
```

- [ ] **Step 3: 为 sde/sdepe/sdeicwb 系列函数添加 symbolParams**

```json
"sde:hide-region": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "region"}]}
"sde:show-region": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "region"}]}
"sde:xshow-region": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "region"}]}
"sde:hide-material": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:show-material": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:xshow-material": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:hide-contact": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "contact"}]}
"sde:show-contact": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "contact"}]}
"sde:xshow-contact": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "contact"}]}
"sde:set-default-material": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:material-type": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:delete-materials": { ..., "symbolParams": [{"index": 0, "role": "ref", "type": "material"}]}
"sde:merge-materials": { ..., "symbolParams": [
    {"index": 1, "role": "def", "type": "material"}
]}
"sde:add-material": { ..., "symbolParams": [
    {"index": 1, "role": "def", "type": "material"},
    {"index": 2, "role": "def", "type": "region"}
]}
"sdepe:add-substrate": { ..., "symbolParams": [
    {"index": 0, "role": "def", "type": "material"},
    {"index": 3, "role": "def", "type": "region"}
]}
"sdepe:depo": { ..., "symbolParams": [
    {"index": 0, "role": "def", "type": "material"},
    {"index": 2, "role": "def", "type": "region"}
]}
"sdepe:fill-device": { ..., "symbolParams": [
    {"index": 0, "role": "def", "type": "material"},
    {"index": 2, "role": "def", "type": "region"}
]}
"sdepe:remove": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "region"},
    {"index": 1, "role": "ref", "type": "material"}
]}
"sdepe:doping-constant-placement": { ..., "symbolParams": [
    {"index": 3, "role": "ref", "type": "region"}
]}
"sdepe:etch-material": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "material"}
]}
"sdepe:polish-device": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "material"}
]}
"sdeicwb:create-boxes-from-layer": { ..., "symbolParams": [
    {"index": 3, "role": "def", "type": "material"},
    {"index": 4, "role": "def", "type": "region"}
]}
```

- [ ] **Step 4: 为 sdedr 引用函数添加 symbolParams（含 modeDispatch）**

```json
"sdedr:define-refinement-region": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "region"}
]}
"sdedr:define-constant-profile-region": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "region"}
]}
"sdedr:define-refinement-material": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "material"}
]}
"sdedr:define-constant-profile-material": { ..., "symbolParams": [
    {"index": 2, "role": "ref", "type": "material"}
]}
```

`offset-block` 和 `offset-interface` 有 modeDispatch，symbolParams 中的 index 是相对于 modeData.params 的索引：

```json
"sdedr:offset-block": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "region"}
]}
```

注意：offset-block 的 modeDispatch 有 region 和 material 两种模式，region 模式下 params[0] 是 region，material 模式下 params[0] 是 material。symbolParams 配置为 `type: "region"` 仅在 region 模式下生效。实际实现中需要根据解析到的模式动态确定 type。为简化 MVP，对有 modeDispatch 且 type 随模式变化的函数，使用特殊标记：

```json
"sdedr:offset-block": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "auto"}
]}
"sdedr:offset-interface": { ..., "symbolParams": [
    {"index": 0, "role": "ref", "type": "auto"},
    {"index": 1, "role": "ref", "type": "auto"}
]}
```

当 `type: "auto"` 时，根据解析到的模式（region/material）确定实际类型。

- [ ] **Step 5: 验证 JSON 合法性**

```bash
node -e "const d = require('./syntaxes/sde_function_docs.json'); console.log('OK, functions:', Object.keys(d).length)"
```

Expected: `OK, functions: 406`

- [ ] **Step 6: 提交**

```bash
git add syntaxes/sde_function_docs.json
git commit -m "feat(sde): 为 50 个 SDE API 添加 symbolParams 配置"
```

---

## Task 4: symbol-index.js — 支持 type: "auto" 的 modeDispatch 动态类型

**Files:**
- Modify: `src/lsp/symbol-index.js`
- Modify: `tests/test-symbol-index.js`

- [ ] **Step 1: 追加 auto type 测试**

在 `tests/test-symbol-index.js` 的 `console.log(`\n结果:`) 之前追加：

```js
test('type auto: offset-block region 模式解析为 region 类型', () => {
    const code = '(sdedr:offset-block "region" "R.Si" "maxlevel" 0.5)';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-block': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'auto' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-block': {
            argIndex: 0,
            modes: {
                region: { params: ['region'] },
                material: { params: ['material'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'R.Si');
    assert.strictEqual(refs[0].type, 'region');
});

test('type auto: offset-block material 模式解析为 material 类型', () => {
    const code = '(sdedr:offset-block "material" "Silicon" "maxlevel" 0.5)';
    const { ast } = parse(code);
    const symbolTable = {
        'sdedr:offset-block': {
            symbolParams: [
                { index: 0, role: 'ref', type: 'auto' },
            ],
        },
    };
    const modeTable = {
        'sdedr:offset-block': {
            argIndex: 0,
            modes: {
                region: { params: ['region'] },
                material: { params: ['material'] },
            },
        },
    };
    const { refs } = extractSymbols(ast, code, symbolTable, modeTable);
    assert.strictEqual(refs.length, 1);
    assert.strictEqual(refs[0].name, 'Silicon');
    assert.strictEqual(refs[0].type, 'material');
});
```

- [ ] **Step 2: 实现动态类型解析**

在 `src/lsp/symbol-index.js` 的 `extractSymbols` 中，处理 modeDispatch 函数的逻辑需要增加：当 `type === 'auto'` 时，用解析到的模式名作为实际类型。

修改 `extractSymbols` 中处理 modeDispatch 的逻辑段，在确定 `param.type` 时：

```js
// 在 modeDispatch 分支内，确定实际类型
let actualType = param.type;
if (actualType === 'auto') {
    // modeValue 是解析到的模式名（如 "region" 或 "material"）
    actualType = modeValue;
}
```

- [ ] **Step 3: 运行测试验证通过**

```bash
node tests/test-symbol-index.js
```

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/lsp/symbol-index.js tests/test-symbol-index.js
git commit -m "feat(sde): 支持 symbolParams type:auto 根据 modeDispatch 动态确定类型"
```

---

## Task 5: region-undef-diagnostic.js — 语义诊断 Provider

**Files:**
- Create: `src/lsp/providers/region-undef-diagnostic.js`
- Create: `tests/test-region-undef-diagnostic.js`

- [ ] **Step 1: 编写诊断逻辑测试**

```js
// tests/test-region-undef-diagnostic.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const SYMBOL_TABLE = {
    'sdegeo:create-rectangle': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
    'sdegeo:define-contact-set': {
        symbolParams: [
            { index: 0, role: 'def', type: 'contact' },
        ],
    },
    'sdedr:define-refinement-region': {
        symbolParams: [
            { index: 2, role: 'ref', type: 'region' },
        ],
    },
    'sde:hide-region': {
        symbolParams: [
            { index: 0, role: 'ref', type: 'region' },
        ],
    },
};

/**
 * 模拟诊断逻辑：提取 defs + refs，找出未定义的引用。
 * 返回未定义引用的列表。
 */
function computeUndefDiagnostics(code) {
    const { ast } = parse(code);
    const { defs, refs } = extractSymbols(ast, code, SYMBOL_TABLE);
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));
    const undefs = [];
    for (const ref of refs) {
        if (!definedNames.has(`${ref.type}:${ref.name}`)) {
            undefs.push(ref);
        }
    }
    return undefs;
}

console.log('\nregion-undef-diagnostic logic:');

test('引用已定义的 region → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdedr:define-refinement-region "Place" "Def" "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('引用未定义的 region → 1 个诊断', () => {
    const code = `(sde:hide-region "R.NotFound")`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'R.NotFound');
    assert.strictEqual(undefs[0].type, 'region');
});

test('不同类型同名不冲突', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "R.Si" "R.Si")
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    // material "R.Si" 定义了，region "R.Si" 也定义了，引用 region "R.Si" 应找到匹配
    assert.strictEqual(undefs.length, 0);
});

test('同名多次定义 → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Silicon" "R.Si")
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('string-append 定义后引用 → 无诊断', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" (string-append "R." "Si"))
(sde:hide-region "R.Si")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 0);
});

test('多个未定义引用 → 多个诊断', () => {
    const code = `
(sde:hide-region "R.A")
(sde:hide-region "R.B")
`;
    const undefs = computeUndefDiagnostics(code);
    assert.strictEqual(undefs.length, 2);
});

test('contact 引用未定义 → 诊断', () => {
    const code = `(sdegeo:delete-contact-set "NonExist")`;
    // 需要为 delete-contact-set 配置 symbolParams
    const table = {
        'sdegeo:delete-contact-set': {
            symbolParams: [{ index: 0, role: 'ref', type: 'contact' }],
        },
        'sdegeo:define-contact-set': {
            symbolParams: [{ index: 0, role: 'def', type: 'contact' }],
        },
    };
    const { ast } = parse(code);
    const { defs, refs } = extractSymbols(ast, code, table);
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));
    const undefs = refs.filter(r => !definedNames.has(`${r.type}:${r.name}`));
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].type, 'contact');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试验证通过**

```bash
node tests/test-region-undef-diagnostic.js
```

Expected: 全部通过（因为诊断逻辑是纯函数组合，不依赖新文件）

- [ ] **Step 3: 实现 region-undef-diagnostic.js Provider**

```js
// src/lsp/providers/region-undef-diagnostic.js
'use strict';

const vscode = require('vscode');
const { extractSymbols } = require('../symbol-index');

const DEBOUNCE_MS = 500;

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

/**
 * 注册 Region/Material/Contact 未定义语义诊断。
 */
function activate(context, schemeCacheInstance, symbolParams, modeDispatch) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;

    diagnosticCollection = vscode.languages.createDiagnosticCollection('sde-symbol-undef');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId !== 'sde') return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(event.document), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (doc.languageId === 'sde') diagnosticCollection.delete(doc.uri);
        })
    );

    for (const doc of vscode.workspace.textDocuments) {
        if (doc.languageId === 'sde') updateDiagnostics(doc);
    }
}

function updateDiagnostics(doc) {
    const entry = schemeCache.get(doc);
    if (!entry) return;

    const { ast, text } = entry;
    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));

    const diagnostics = [];
    const typeLabels = { region: 'Region', material: 'Material', contact: 'Contact' };

    for (const ref of refs) {
        if (!definedNames.has(`${ref.type}:${ref.name}`)) {
            const range = new vscode.Range(
                ref.line - 1, ref.start,
                ref.line - 1, ref.end
            );
            const label = typeLabels[ref.type] || ref.type;
            const diagnostic = new vscode.Diagnostic(
                range,
                `${label} '${ref.name}' 未定义`,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'sde-symbol';
            diagnostics.push(diagnostic);
        }
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}

module.exports = { activate };
```

- [ ] **Step 4: 运行诊断测试通过**

```bash
node tests/test-region-undef-diagnostic.js
```

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/region-undef-diagnostic.js tests/test-region-undef-diagnostic.js
git commit -m "feat(sde): 实现 Region/Material/Contact 未定义语义诊断 Provider"
```

---

## Task 6: symbol-completion.js — 符号补全 Provider

**Files:**
- Create: `src/lsp/providers/symbol-completion.js`
- Create: `tests/test-symbol-completion.js`

- [ ] **Step 1: 编写补全过滤逻辑测试**

```js
// tests/test-symbol-completion.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols } = require('../src/lsp/symbol-index');
const dispatcher = require('../src/lsp/semantic-dispatcher');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

const SYMBOL_TABLE = {
    'sdegeo:create-rectangle': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
    'sdegeo:define-contact-set': {
        symbolParams: [
            { index: 0, role: 'def', type: 'contact' },
        ],
    },
    'sdedr:define-refinement-region': {
        symbolParams: [
            { index: 2, role: 'ref', type: 'region' },
        ],
    },
    'sde:hide-region': {
        symbolParams: [
            { index: 0, role: 'ref', type: 'region' },
        ],
    },
};

/**
 * 模拟补全逻辑：给定代码和光标位置，确定需要补全的符号类型，
 * 然后返回匹配的已定义符号名称列表。
 */
function computeCompletions(code, line, column) {
    const { ast } = parse(code);
    const lineStarts = computeLineStarts(code);
    const result = dispatcher.dispatch(ast, line, column, {}, lineStarts);
    if (!result) return [];
    const { functionName, activeParam } = result;
    const config = SYMBOL_TABLE[functionName];
    if (!config || !config.symbolParams) return [];

    // 找到当前参数对应的 symbolParams 条目
    const matching = config.symbolParams.find(p => p.index === activeParam);
    if (!matching) return [];

    // 提取所有定义，过滤匹配类型
    const { defs } = extractSymbols(ast, code, SYMBOL_TABLE);
    const targetType = matching.type;
    const names = new Set();
    const completions = [];
    for (const d of defs) {
        if (d.type === targetType && !names.has(d.name)) {
            names.add(d.name);
            completions.push({ name: d.name, type: d.type, line: d.line });
        }
    }
    return completions;
}

console.log('\nsymbol-completion logic:');

test('region 参数位置补全已定义的 region', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdegeo:create-rectangle (position 2 0 0) (position 3 1 0) "Oxide" "R.Ox")
(sdedr:define-refinement-region "Place" "Def" )
`;
    // 光标在最后一行空参数位置（第3个参数 = activeParam 2）
    const completions = computeCompletions(code, 4, 48);
    assert.strictEqual(completions.length, 2);
    const names = completions.map(c => c.name);
    assert.ok(names.includes('R.Si'));
    assert.ok(names.includes('R.Ox'));
});

test('region 参数位置不补全 material', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sde:hide-region )
`;
    const completions = computeCompletions(code, 3, 16);
    // 只应补全 region 类型
    assert.ok(completions.every(c => c.type === 'region'));
    assert.strictEqual(completions.length, 1);
    assert.strictEqual(completions[0].name, 'R.Si');
});

test('非符号参数位置无补全', () => {
    const code = `(sdegeo:create-rectangle (position 0 0 0))`;
    // activeParam 0 = pos1，不在 symbolParams 中
    const completions = computeCompletions(code, 1, 30);
    assert.strictEqual(completions.length, 0);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试验证通过**

```bash
node tests/test-symbol-completion.js
```

- [ ] **Step 3: 实现 symbol-completion.js Provider**

```js
// src/lsp/providers/symbol-completion.js
'use strict';

const dispatcher = require('../semantic-dispatcher');
const { extractSymbols } = require('../symbol-index');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {object} */
let vscode;

function activate(context, schemeCacheInstance, symbolParams, modeDispatch, vscodeRef) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;
    vscode = vscodeRef;

    const provider = {
        provideCompletionItems(document, position) {
            return provideSymbolCompletions(document, position);
        },
    };
    const disposable = vscode.languages.registerCompletionItemProvider(
        { language: 'sde' },
        provider,
        '"'
    );
    context.subscriptions.push(disposable);
}

function provideSymbolCompletions(document, position) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, text, lineStarts } = entry;
    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable || {}, lineStarts);
    if (!result) return null;
    const { functionName, activeParam } = result;

    const config = symbolParamsTable[functionName];
    if (!config || !config.symbolParams) return null;

    const matching = config.symbolParams.find(p => p.index === activeParam);
    if (!matching) return null;

    const { defs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const targetType = matching.type;
    const seen = new Set();
    const items = [];

    for (const d of defs) {
        if (d.type === targetType && !seen.has(d.name)) {
            seen.add(d.name);
            const item = new vscode.CompletionItem(d.name, vscode.CompletionItemKind.Reference);
            item.detail = `${targetType} — defined line ${d.line}`;
            item.sortText = '5' + d.name;
            items.push(item);
        }
    }

    return items.length > 0 ? items : null;
}

module.exports = { activate, provideSymbolCompletions };
```

- [ ] **Step 4: 运行测试通过**

```bash
node tests/test-symbol-completion.js
```

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/symbol-completion.js tests/test-symbol-completion.js
git commit -m "feat(sde): 实现符号补全 Provider（region/material/contact）"
```

---

## Task 7: symbol-reference-provider.js — Find All References

**Files:**
- Create: `src/lsp/providers/symbol-reference-provider.js`
- Create: `tests/test-symbol-reference.js`

- [ ] **Step 1: 编写引用查找测试**

```js
// tests/test-symbol-reference.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { extractSymbols } = require('../src/lsp/symbol-index');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const SYMBOL_TABLE = {
    'sdegeo:create-rectangle': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
    'sdegeo:define-contact-set': {
        symbolParams: [
            { index: 0, role: 'def', type: 'contact' },
        ],
    },
    'sdedr:define-refinement-region': {
        symbolParams: [
            { index: 2, role: 'ref', type: 'region' },
        ],
    },
    'sde:hide-region': {
        symbolParams: [
            { index: 0, role: 'ref', type: 'region' },
        ],
    },
};

function findReferences(code, targetName, targetType) {
    const { ast } = parse(code);
    const { defs, refs } = extractSymbols(ast, code, SYMBOL_TABLE);
    const all = [...defs, ...refs];
    return all.filter(e => e.name === targetName && e.type === targetType);
}

console.log('\nsymbol-reference logic:');

test('查找 region 的所有定义和引用', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "Silicon" "R.Si")
(sdedr:define-refinement-region "Place" "Def" "R.Si")
(sde:hide-region "R.Si")
`;
    const locations = findReferences(code, 'R.Si', 'region');
    assert.strictEqual(locations.length, 3);
    assert.strictEqual(locations.filter(l => l.role === 'def').length, 1);
    assert.strictEqual(locations.filter(l => l.role === 'ref').length, 2);
});

test('精确匹配：不同类型同名不混', () => {
    const code = `
(sdegeo:create-rectangle (position 0 0 0) (position 1 1 0) "R.Si" "R.Si")
`;
    const regionRefs = findReferences(code, 'R.Si', 'region');
    const matRefs = findReferences(code, 'R.Si', 'material');
    assert.strictEqual(regionRefs.length, 1);
    assert.strictEqual(regionRefs[0].type, 'region');
    assert.strictEqual(matRefs.length, 1);
    assert.strictEqual(matRefs[0].type, 'material');
});

test('未定义符号返回空', () => {
    const code = `(sde:hide-region "R.NotFound")`;
    const locations = findReferences(code, 'R.NotFound', 'region');
    assert.strictEqual(locations.length, 1); // 只有引用，没有定义
});

test('查找 contact 的引用', () => {
    const code = `
(sdegeo:define-contact-set "Source" 4.0 "Blue" "solid")
`;
    const locations = findReferences(code, 'Source', 'contact');
    assert.strictEqual(locations.length, 1);
    assert.strictEqual(locations[0].role, 'def');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试验证通过**

```bash
node tests/test-symbol-reference.js
```

- [ ] **Step 3: 实现 symbol-reference-provider.js**

```js
// src/lsp/providers/symbol-reference-provider.js
'use strict';

const { extractSymbols } = require('../symbol-index');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {object} */
let vscode;

function activate(context, schemeCacheInstance, symbolParams, modeDispatch, vscodeRef) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;
    vscode = vscodeRef;

    const provider = {
        provideReferences(document, position, options) {
            return provideSymbolReferences(document, position, options);
        },
    };
    const disposable = vscode.languages.registerReferenceProvider(
        { language: 'sde' },
        provider
    );
    context.subscriptions.push(disposable);
}

function provideSymbolReferences(document, position, options) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, text } = entry;

    // 从光标位置提取可能的符号名
    const range = document.getWordRangeAtPosition(position, /"[^"]*"/);
    if (!range) return null;

    const quotedText = document.getText(range);
    const targetName = quotedText.slice(1, -1); // 去掉引号
    if (!targetName) return null;

    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const all = [...defs, ...refs];
    const matches = all.filter(e => e.name === targetName);

    if (matches.length === 0) return null;

    // 如果有多个类型的匹配，选择最精确的（优先选择 type 匹配的）
    // 简化实现：返回所有类型匹配的 location
    const locations = [];
    for (const m of matches) {
        const loc = new vscode.Location(
            document.uri,
            new vscode.Range(m.line - 1, m.start, m.line - 1, m.end)
        );
        locations.push(loc);
    }
    return locations;
}

module.exports = { activate, provideSymbolReferences };
```

- [ ] **Step 4: 运行测试通过**

```bash
node tests/test-symbol-reference.js
```

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/symbol-reference-provider.js tests/test-symbol-reference.js
git commit -m "feat(sde): 实现 Find All References Provider（region/material/contact）"
```

---

## Task 8: extension.js — 注册新 Provider

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在 extension.js 顶部添加 require**

在现有 require 块中（`const quoteAutoDelete = ...` 之后）添加：

```js
const symbolIndex = require('./lsp/symbol-index');
const regionUndefDiagnostic = require('./lsp/providers/region-undef-diagnostic');
const symbolCompletion = require('./lsp/providers/symbol-completion');
const symbolReferenceProvider = require('./lsp/providers/symbol-reference-provider');
```

- [ ] **Step 2: 构建 symbolParamsTable**

在 `modeDispatchTable` 构建代码之后（大约第 373 行附近）添加：

```js
    // 构建 symbolParams 查找表：从英文文档提取
    const symbolParamsTable = {};
    for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
        if (fnDoc.symbolParams) {
            symbolParamsTable[fnName] = { symbolParams: fnDoc.symbolParams };
        }
    }
```

- [ ] **Step 3: 注册 region-undef-diagnostic Provider**

在 `undefVarDiagnostic.activate(...)` 调用之后添加：

```js
    // Region/Material/Contact 未定义语义诊断（SDE only）
    regionUndefDiagnostic.activate(context, schemeCache, symbolParamsTable, modeDispatchTable);
```

- [ ] **Step 4: 注册 symbol-completion Provider**

在签名帮助注册之后添加：

```js
    // Symbol completion (SDE only) — region/material/contact 补全
    symbolCompletion.activate(context, schemeCache, symbolParamsTable, modeDispatchTable, vscode);
```

- [ ] **Step 5: 注册 symbol-reference Provider**

```js
    // Find All References (SDE only) — region/material/contact
    symbolReferenceProvider.activate(context, schemeCache, symbolParamsTable, modeDispatchTable, vscode);
```

- [ ] **Step 6: 运行全部现有测试确认无回归**

```bash
node tests/test-scheme-parser.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-signature-provider.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-definitions.js && node tests/test-expression-converter.js && node tests/test-snippet-prefixes.js && node tests/test-parse-cache.js
```

Expected: 全部通过

- [ ] **Step 7: 运行新测试**

```bash
node tests/test-symbol-index.js && node tests/test-region-undef-diagnostic.js && node tests/test-symbol-completion.js && node tests/test-symbol-reference.js
```

Expected: 全部通过

- [ ] **Step 8: 提交**

```bash
git add src/extension.js
git commit -m "feat(sde): 注册符号索引、语义诊断、补全和引用 Provider"
```

---

## Task 9: 集成测试与手动验证

**Files:**
- Modify: `display_test/test_lsp_features_dvs.cmd`

- [ ] **Step 1: 在 display_test 中添加符号索引测试用例**

在 `display_test/test_lsp_features_dvs.cmd` 末尾追加：

```scheme
;; --- 11. Symbol index test (Phase 3) ---
;; Region definitions
(sdegeo:create-rectangle
    "R.Gate"
    "PolySilicon"
    (position 4.0 0.0 0.0)
    (position 6.0 0.5 0.1)
)

;; Contact definition
(sdegeo:define-contact-set
    "Drain"
    4.0
    "Red"
    "solid"
)

;; Region references (should not trigger undefined diagnostic)
(sdedr:define-refinement-region "Place.Gate" "Ref.Grid" "R.Gate")

;; Contact reference
(sdegeo:set-contact (list) "Drain")

;; Undefined region reference (should trigger diagnostic)
; (sde:hide-region "R.NonExistent")

;; string-append region definition
(sdegeo:create-rectangle
    (string-append "R." "Channel")
    "Silicon"
    (position 2.0 0.0 0.0)
    (position 4.0 0.5 0.1)
)
```

- [ ] **Step 2: 在 Extension Development Host 中手动验证**

1. 按 F5 启动 Extension Development Host
2. 打开 `test_lsp_features_dvs.cmd`
3. 验证：
   - `"R.Gate"` 在 `sde:hide-region` 参数位置触发补全时可见
   - `"R.NonExistent"` 如果取消注释，显示蓝色下划线诊断
   - 右键 `"R.Gate"` → Find All References 显示所有定义和引用位置
   - `(string-append "R." "Channel")` 创建的 `"R.Channel"` 能被后续引用识别

- [ ] **Step 3: 提交**

```bash
git add display_test/test_lsp_features_dvs.cmd
git commit -m "test: 添加符号索引 Phase 3 集成测试用例"
```

---

## Task 10: 全量测试运行与最终提交

- [ ] **Step 1: 运行全部测试**

```bash
for f in tests/test-*.js; do echo "=== $f ==="; node "$f" || exit 1; done
echo "All tests passed!"
```

Expected: 全部通过

- [ ] **Step 2: 更新 CLAUDE.md 文件树和架构描述**

在文件树中添加新文件：
- `src/lsp/symbol-index.js`
- `src/lsp/providers/region-undef-diagnostic.js`
- `src/lsp/providers/symbol-completion.js`
- `src/lsp/providers/symbol-reference-provider.js`
- `tests/test-symbol-index.js`
- `tests/test-region-undef-diagnostic.js`
- `tests/test-symbol-completion.js`
- `tests/test-symbol-reference.js`

在架构描述中添加第三层的新能力说明。

- [ ] **Step 3: 最终提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 添加 Phase 3 符号索引架构描述"
```
