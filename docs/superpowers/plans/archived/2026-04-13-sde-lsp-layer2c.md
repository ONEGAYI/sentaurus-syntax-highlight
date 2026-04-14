# SDE LSP Phase 2C Implementation Plan — 模式分派与 Signature Help

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 为 SDE 中具有重载模式/多模式参数的函数（如 `sdedr:define-refinement-function`、`sdedr:define-gaussian-profile` 等）实现上下文感知的 Signature Help 和参数级补全。

**Architecture:** 在现有 AST 解析器之上构建模式分派层。核心思路：AST 识别函数调用表达式 → 读取 `modeDispatch` 元数据 → 根据 argIndex 位置的字符串值确定当前模式 → 基于模式提供参数级 Signature Help。两个新模块各司其职：`semantic-dispatcher.js` 负责从 AST+元数据推断当前模式与参数位置；`signature-provider.js` 消费分派结果提供 VSCode SignatureHelp。参数值补全（如材料名、区域名自动补全）推迟到 Phase 3 交叉引用分析。

**Tech Stack:** 纯 JavaScript, CommonJS, VSCode Extension API, 零 npm 依赖

**Design Spec:** `docs/superpowers/specs/2026-04-13-sde-lsp-ast-design.md`

**前置条件:** Phase 1（AST 解析器）和 Phase 2A+2B（定义分类 + 作用域感知补全）已完成

---

## 模式分派函数清单

经扫描 `sde_function_docs.json`，共 12 个函数具有 `{ ... | ... }` 模式分派语法：

| 函数名 | 模式选择位置 | 模式列表 | 复杂度 |
|--------|-------------|---------|--------|
| `sdedr:define-refinement-function` | arg[2] | `MaxLenInt`, `MaxInterval`, `MaxGradient`, `MaxTransDiff` | 高（含 flags） |
| `sdedr:define-gaussian-profile` | arg[3] 标签 | `PeakVal` / `Dose` + `ValueAtDepth` / `Length` / `StdDev` | 高（嵌套选择） |
| `sdedr:define-erf-profile` | arg[3] 标签 | `MaxVal` / `Dose` | 中 |
| `sdedr:define-analytical-profile` | arg[6] | `Gauss`/`Erf` / `Eval` | 中 |
| `sdedr:define-refeval-window` | arg[1] | `Point`/`Line`/`Rectangle`/`Circle` 等形状 | 中 |
| `sdegeo:create-sphere` | arg[0] | `position` / `cx cy cz` | 低 |
| `sdegeo:create-torus` | arg[0] | `position` / `cx cy cz` | 低 |
| `sdegeo:sweep` | arg[1] | `wire` / `distance` / `gvector` / `axis` | 低 |
| `sdegeo:prune-vertices` | arg[0] | `body-list` / `edge-list` / `vertex-list` | 低 |
| `sdepe:photo` | arg 标签 | `thickness` / `height` | 低 |
| `sdepe:polish-device` | arg 标签 | `thickness` / `height` | 低 |
| `sdepe:remove` | arg 标签 | `region` / `material` | 低 |

---

## 文件结构

```
src/
├── extension.js                      # 修改：注册 SignatureHelpProvider
└── lsp/
    ├── semantic-dispatcher.js        # 新增：模式分派引擎 (~120 行)
    ├── providers/
    │   └── signature-provider.js     # 新增：Signature Help provider (~120 行)
    └── (现有文件不变)
        ├── scheme-parser.js
        ├── scheme-analyzer.js
        └── scope-analyzer.js

syntaxes/
└── sde_function_docs.json            # 修改：12 个函数添加 modeDispatch 字段

tests/
├── test-semantic-dispatcher.js       # 新增：分派引擎测试
└── test-signature-provider.js        # 新增：Signature Help 测试
```

### 模块职责

| 模块 | 输入 | 输出 | 依赖 |
|------|------|------|------|
| `semantic-dispatcher.js` | AST + 光标位置 + modeDispatch 元数据 | `{ functionName, mode, modeData, activeParam, callNode }` | 无外部依赖 |
| `signature-provider.js` | VSCode Document + Position + modeDispatchTable + funcDocs | `SignatureHelp` (纯对象) | `semantic-dispatcher` + `scheme-parser` |
| `extension.js` 修改 | — | — | 注册 signature-provider，构建 modeDispatchTable |

### modeDispatch 数据模型

```json
{
  "sdedr:define-refinement-function": {
    "modeDispatch": {
      "argIndex": 2,
      "modes": {
        "MaxLenInt": {
          "params": ["definition-name", "function-name", "MaxLenInt", "mat-reg-1", "mat-reg-2", "value"],
          "optionals": [
            { "name": "factor", "type": "number" },
            { "name": "DoubleSide", "type": "flag" },
            { "name": "UseRegionNames", "type": "flag", "affects": ["mat-reg-1", "mat-reg-2"] }
          ]
        },
        "MaxInterval": {
          "params": ["definition-name", "function-name", "MaxInterval", "Variable", "dopant-name", "Cmin", "cmin", "Cmax", "cmax"],
          "optionals": [
            { "name": "Scaling", "tag": "Scaling", "type": "number", "param": "scaling" },
            { "name": "TargetLength", "tag": "TargetLength", "type": "number", "param": "targetLength" },
            { "name": "Rolloff", "type": "flag" }
          ]
        },
        "MaxGradient": {
          "params": ["definition-name", "function-name", "MaxGradient", "value"]
        },
        "MaxTransDiff": {
          "params": ["definition-name", "function-name", "MaxTransDiff", "value"]
        }
      }
    }
  }
}
```

**字段说明：**
- `argIndex`: 模式选择器在参数列表中的位置（0-based）
- `modes`: 模式名到参数规格的映射
- `params`: 该模式下的有序参数名列表（包含前缀参数）
- `optionals`: 可选参数（可按任意顺序出现），`tag` 表示带标签的可选参数（如 `"Scaling" value`），`type: "flag"` 表示布尔标志

---

## Task 1: 创建 semantic-dispatcher.js — 模式分派引擎

**Files:**
- Create: `src/lsp/semantic-dispatcher.js`
- Test: `tests/test-semantic-dispatcher.js`

本模块是 Phase 2C 的核心。它接收 AST + 光标位置 + modeDispatch 元数据，推断用户正在编辑哪个函数调用的哪个模式的哪个参数。

- [x] **Step 1: 编写 `findEnclosingCall` — 定位光标所在的函数调用**

创建 `src/lsp/semantic-dispatcher.js`，先写 `findEnclosingCall` 函数。它遍历 AST 找到包含光标位置的最内层 `(funcName args...)` List 节点：

```js
// src/lsp/semantic-dispatcher.js
'use strict';

/**
 * 在 AST 中查找包含光标位置的最内层函数调用。
 * 函数调用 = List 节点且 children[0] 是 Identifier。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {number} line - 光标所在行（1-based）
 * @param {number} column - 光标所在列（0-based, 字符偏移）
 * @returns {object|null} 函数调用 List 节点，或 null
 */
function findEnclosingCall(ast, line, column) {
    let best = null;

    function walk(node) {
        if (node.type === 'List') {
            const inRange = line >= node.line && line <= node.endLine;
            // 同行时检查列范围（仅单行表达式）
            const inColumn = node.line !== node.endLine || column >= node.start && column <= node.end;
            if (inRange && inColumn && node.children.length >= 1 && node.children[0].type === 'Identifier') {
                // 内层调用覆盖外层
                if (!best || (node.line >= best.line && node.endLine <= best.endLine)) {
                    best = node;
                }
            }
            for (const child of node.children) {
                walk(child);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression);
        } else if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        }
    }

    walk(ast);
    return best;
}
```

- [x] **Step 2: 编写测试 — `findEnclosingCall` 基础用例**

创建 `tests/test-semantic-dispatcher.js`：

```js
// tests/test-semantic-dispatcher.js
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const dispatcher = require('../src/lsp/semantic-dispatcher');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

function parseAndFind(code, line, column) {
    const { ast } = parse(code);
    return dispatcher.findEnclosingCall(ast, line, column);
}

console.log('\nfindEnclosingCall:');

test('单行函数调用', () => {
    const call = parseAndFind('(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")', 1, 5);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdegeo:create-circle');
});

test('光标在参数上返回外层调用', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const call = parseAndFind(code, 1, 25);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdegeo:create-circle');
});

test('光标在嵌套表达式内返回最内层调用', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const call = parseAndFind(code, 1, 27);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'position');
});

test('光标不在任何调用上返回 null', () => {
    const code = '(define x 42)\n(display x)';
    const call = parseAndFind(code, 3, 1);
    assert.strictEqual(call, null);
});

test('跨行函数调用', () => {
    const code = '(sdedr:define-refinement-function\n  "ref"\n  "MaxGradient"\n  0.1)';
    const call = parseAndFind(code, 3, 5);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, 'sdedr:define-refinement-function');
});

test('多行嵌套返回最内层', () => {
    const code = '(define (f x)\n  (let ((y 1))\n    (+ x y)))';
    // 光标在第3行的 (+ x y) 内
    const call = parseAndFind(code, 3, 8);
    assert.ok(call);
    assert.strictEqual(call.children[0].value, '+');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [x] **Step 3: 运行测试确认失败（TDD 红灯）**

Run: `node tests/test-semantic-dispatcher.js`
Expected: FAIL（`semantic-dispatcher.js` 尚未导出 `findEnclosingCall`）

- [x] **Step 4: 确认模块可加载，运行测试**

Run: `node tests/test-semantic-dispatcher.js`
Expected: 全部通过

- [x] **Step 5: 提交**

```bash
git add src/lsp/semantic-dispatcher.js tests/test-semantic-dispatcher.js
git commit -m "feat(lsp): add findEnclosingCall for semantic dispatch engine"
```

---

## Task 2: 在 semantic-dispatcher.js 中添加模式识别和参数位置推断

**Files:**
- Modify: `src/lsp/semantic-dispatcher.js`
- Modify: `tests/test-semantic-dispatcher.js`

核心算法：给定一个函数调用 List 节点和 modeDispatch 元数据，确定当前模式和光标所在的参数索引。

- [x] **Step 1: 编写 `resolveMode` — 确定当前模式**

在 `src/lsp/semantic-dispatcher.js` 中添加 `resolveMode` 函数：

```js
/**
 * 根据函数调用节点和 modeDispatch 元数据，确定当前激活的模式。
 * @param {object} callNode - 函数调用 List 节点
 * @param {object} modeDispatch - modeDispatch 元数据
 * @returns {string|null} 模式名，或 null（无法确定）
 */
function resolveMode(callNode, modeDispatch) {
    const { argIndex, modes } = modeDispatch;
    // callNode.children[0] 是函数名，所以参数从 children[1] 开始
    // argIndex 是参数索引（0-based），对应 children[argIndex + 1]
    const argNode = callNode.children[argIndex + 1];
    if (!argNode) return null;

    // 模式选择器可能是字符串字面量或标识符
    let modeValue = null;
    if (argNode.type === 'String') {
        modeValue = argNode.value;
    } else if (argNode.type === 'Identifier') {
        modeValue = argNode.value;
    }

    if (modeValue && modes[modeValue]) return modeValue;
    return null;
}
```

- [x] **Step 2: 编写 `resolveActiveParam` — 推断光标所在的参数索引**

在 `src/lsp/semantic-dispatcher.js` 中添加 `resolveActiveParam` 函数：

```js
/**
 * 推断光标在函数调用中的参数位置。
 * 参数索引从 0 开始（不含函数名自身）。
 * @param {object} callNode - 函数调用 List 节点
 * @param {number} line - 光标行（1-based）
 * @param {number} column - 光标列（0-based）
 * @returns {number} 参数索引（0-based），-1 表示不在任何参数上
 */
function resolveActiveParam(callNode, line, column) {
    // children[0] 是函数名，children[1..] 是参数
    // 找到最后一个 start <= 光标位置 的参数
    let activeParam = -1;
    const cursorOffset = line === callNode.line ? column : Infinity;

    for (let i = 1; i < callNode.children.length; i++) {
        const arg = callNode.children[i];
        // 检查光标是否在此参数之前（同一行内按列判断，跨行按行判断）
        const argStartLine = arg.line;
        const argEndLine = arg.endLine;

        if (line < argStartLine) break;
        if (line === argStartLine && column < arg.start) break;
        if (line > argEndLine) { activeParam = i - 1; continue; }
        if (line === argEndLine && column > arg.end) { activeParam = i - 1; continue; }
        activeParam = i - 1;
    }

    return activeParam;
}
```

- [x] **Step 3: 编写 `dispatch` — 组合函数，完整分派接口**

在 `src/lsp/semantic-dispatcher.js` 中添加主入口 `dispatch`：

```js
/**
 * 对给定文档位置执行模式分派分析。
 * @param {object} ast - Parser 产出的 AST
 * @param {number} line - 光标行（1-based）
 * @param {number} column - 光标列（0-based）
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 的映射表
 * @returns {object|null} { functionName, mode, modeData, activeParam } 或 null
 */
function dispatch(ast, line, column, modeDispatchTable) {
    const callNode = findEnclosingCall(ast, line, column);
    if (!callNode) return null;

    const functionName = callNode.children[0].value;
    const dispatchMeta = modeDispatchTable[functionName];
    if (!dispatchMeta) {
        // 非模式分派函数：只提供函数名和参数位置
        return {
            functionName,
            mode: null,
            modeData: null,
            activeParam: resolveActiveParam(callNode, line, column),
            callNode,
        };
    }

    const mode = resolveMode(callNode, dispatchMeta);
    const modeData = mode ? dispatchMeta.modes[mode] : null;
    const activeParam = resolveActiveParam(callNode, line, column);

    return {
        functionName,
        mode,
        modeData,
        activeParam,
        callNode,
    };
}

module.exports = { findEnclosingCall, resolveMode, resolveActiveParam, dispatch };
```

- [x] **Step 4: 在测试文件中添加模式识别和参数位置测试**

在 `tests/test-semantic-dispatcher.js` 的 `console.log` 结果行之前添加：

```js
console.log('\nresolveMode:');

test('从字符串参数识别模式', () => {
    const { ast } = parse('(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)');
    const call = dispatcher.findEnclosingCall(ast, 1, 5);
    const modeDispatch = {
        argIndex: 2,
        modes: {
            MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            MaxLenInt: { params: ['definition-name', 'function-name', 'MaxLenInt', 'mat-reg-1', 'mat-reg-2', 'value'] },
        },
    };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, 'MaxGradient');
});

test('未写入模式参数时返回 null', () => {
    const { ast } = parse('(sdedr:define-refinement-function "ref1")');
    const call = dispatcher.findEnclosingCall(ast, 1, 5);
    const modeDispatch = { argIndex: 2, modes: { MaxGradient: { params: [] } } };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, null);
});

test('无效模式名返回 null', () => {
    const { ast } = parse('(sdedr:define-refinement-function "ref1" "UnknownMode" 0.1)');
    const call = dispatcher.findEnclosingCall(ast, 1, 5);
    const modeDispatch = { argIndex: 2, modes: { MaxGradient: { params: [] } } };
    const mode = dispatcher.resolveMode(call, modeDispatch);
    assert.strictEqual(mode, null);
});

console.log('\nresolveActiveParam:');

test('单行调用：光标在第 1 个参数', () => {
    const { ast } = parse('(foo 1 2 3)');
    const call = dispatcher.findEnclosingCall(ast, 1, 6);
    const param = dispatcher.resolveActiveParam(call, 1, 6);
    assert.strictEqual(param, 0);
});

test('单行调用：光标在第 3 个参数', () => {
    const { ast } = parse('(foo 1 2 3)');
    const call = dispatcher.findEnclosingCall(ast, 1, 10);
    const param = dispatcher.resolveActiveParam(call, 1, 10);
    assert.strictEqual(param, 2);
});

test('跨行调用：光标在第 2 行对应参数索引', () => {
    const code = '(foo "arg1"\n  "arg2"\n  "arg3")';
    const { ast } = parse(code);
    const call = dispatcher.findEnclosingCall(ast, 2, 5);
    const param = dispatcher.resolveActiveParam(call, 2, 5);
    assert.strictEqual(param, 1);
});

console.log('\ndispatch (integration):');

test('完整分派：识别模式和参数位置', () => {
    const code = '(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)';
    const { ast } = parse(code);
    const table = {
        'sdedr:define-refinement-function': {
            argIndex: 2,
            modes: {
                MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            },
        },
    };
    const result = dispatcher.dispatch(ast, 1, 40, table);
    assert.ok(result);
    assert.strictEqual(result.functionName, 'sdedr:define-refinement-function');
    assert.strictEqual(result.mode, 'MaxGradient');
    assert.strictEqual(result.activeParam, 2);
});

test('非模式分派函数返回 mode=null', () => {
    const code = '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")';
    const { ast } = parse(code);
    const result = dispatcher.dispatch(ast, 1, 5, {});
    assert.ok(result);
    assert.strictEqual(result.functionName, 'sdegeo:create-circle');
    assert.strictEqual(result.mode, null);
    assert.strictEqual(result.activeParam, 0);
});
```

- [x] **Step 5: 运行测试**

Run: `node tests/test-semantic-dispatcher.js`
Expected: 全部通过

- [x] **Step 6: 提交**

```bash
git add src/lsp/semantic-dispatcher.js tests/test-semantic-dispatcher.js
git commit -m "feat(lsp): add mode resolution and active param tracking to semantic dispatcher"
```

---

## Task 3: 创建 signature-provider.js — Signature Help Provider

**Files:**
- Create: `src/lsp/providers/signature-provider.js`
- Create: `tests/test-signature-provider.js`

本模块消费 `semantic-dispatcher.js` 的分派结果，构建 VSCode `SignatureHelp` 对象。当用户输入 `(sdedr:define-refinement-function "ref1" "MaxGradient"` 时，显示该模式的参数签名并高亮当前参数。

- [x] **Step 1: 编写 `buildSignatureLabel` — 构建签名标签字符串**

创建 `src/lsp/providers/signature-provider.js`：

```js
// src/lsp/providers/signature-provider.js
'use strict';

const schemeParser = require('../scheme-parser');
const dispatcher = require('../semantic-dispatcher');

/**
 * 从 modeData.params 构建签名标签。
 * 格式：(funcName param1 param2 ...)
 * @param {string} functionName
 * @param {object} modeData - { params: string[], optionals?: object[] }
 * @returns {string}
 */
function buildSignatureLabel(functionName, modeData) {
    const parts = [functionName, ...modeData.params];
    if (modeData.optionals && modeData.optionals.length > 0) {
        for (const opt of modeData.optionals) {
            if (opt.type === 'flag') {
                parts.push(`[${opt.name}]`);
            } else if (opt.tag) {
                parts.push(`[${opt.tag} ${opt.param || opt.name}]`);
            } else {
                parts.push(`[${opt.name}]`);
            }
        }
    }
    return '(' + parts.join(' ') + ')';
}

/**
 * 从 funcDocs 和 modeData 构建 ParameterInformation 数组。
 * @param {object} modeData
 * @param {object} funcDoc - 原始函数文档（含 parameters 数组）
 * @returns {Array<{label: string, documentation: string}>}
 */
function buildParams(modeData, funcDoc) {
    // 建立 参数名→描述 的查找表（不区分大小写，支持短名匹配）
    const descMap = {};
    if (funcDoc && funcDoc.parameters) {
        for (const p of funcDoc.parameters) {
            descMap[p.name.toLowerCase()] = p.desc || '';
        }
    }

    const params = [];
    for (const name of modeData.params) {
        const desc = descMap[name.toLowerCase()] || '';
        params.push({
            label: name,
            documentation: desc,
        });
    }
    // 可选参数也加入（标记为可选）
    if (modeData.optionals) {
        for (const opt of modeData.optionals) {
            const label = opt.type === 'flag' ? opt.name
                : opt.tag ? `${opt.tag} ${opt.param || opt.name}`
                : opt.name;
            params.push({
                label: `[${label}]`,
                documentation: descMap[(opt.param || opt.name).toLowerCase()] || 'Optional',
            });
        }
    }
    return params;
}

/**
 * 核心方法：为给定文档位置提供 SignatureHelp。
 * @param {import('vscode').TextDocument} document
 * @param {import('vscode').Position} position
 * @param {import('vscode').CancellationToken} token
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 元数据
 * @param {object} funcDocs - 函数名 → 文档 的完整映射
 * @returns {object|null} VSCode SignatureHelp 结构（纯对象，不依赖 vscode 模块）
 */
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs) {
    const text = document.getText();
    const { ast } = schemeParser.parse(text);

    // VSCode position: 0-based line, 0-based character
    // 我们的 AST: 1-based line, 0-based offset
    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable);
    if (!result) return null;
    if (result.activeParam < 0) return null;

    const { functionName, mode, modeData, activeParam } = result;
    const funcDoc = funcDocs[functionName] || null;

    if (mode && modeData) {
        // 模式分派函数：显示该模式的签名
        const label = buildSignatureLabel(functionName, modeData);
        const params = buildParams(modeData, funcDoc);
        return {
            signatures: [{
                label,
                parameters: params,
                documentation: funcDoc ? funcDoc.description : undefined,
            }],
            activeSignature: 0,
            activeParameter: Math.min(activeParam, params.length - 1),
        };
    }

    // 非模式分派函数但有文档：显示基本签名
    if (funcDoc && funcDoc.signature) {
        const params = (funcDoc.parameters || []).map(p => ({
            label: p.name,
            documentation: p.desc || '',
        }));
        return {
            signatures: [{
                label: funcDoc.signature,
                parameters: params,
                documentation: funcDoc.description,
            }],
            activeSignature: 0,
            activeParameter: Math.min(activeParam, params.length - 1),
        };
    }

    return null;
}

module.exports = {
    buildSignatureLabel,
    buildParams,
    provideSignatureHelp,
};
```

- [x] **Step 2: 编写 signature-provider 测试**

创建 `tests/test-signature-provider.js`：

```js
// tests/test-signature-provider.js
'use strict';

const assert = require('assert');
const sigProvider = require('../src/lsp/providers/signature-provider');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nbuildSignatureLabel:');

test('简单模式签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxGradient', 'value'],
    });
    assert.strictEqual(label, '(sdedr:define-refinement-function definition-name function-name MaxGradient value)');
});

test('带可选参数的签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxLenInt', 'mat-reg-1', 'mat-reg-2', 'value'],
        optionals: [
            { name: 'factor', type: 'number' },
            { name: 'DoubleSide', type: 'flag' },
            { name: 'UseRegionNames', type: 'flag' },
        ],
    });
    assert.ok(label.includes('[factor]'));
    assert.ok(label.includes('[DoubleSide]'));
    assert.ok(label.includes('[UseRegionNames]'));
});

test('带标签可选参数的签名', () => {
    const label = sigProvider.buildSignatureLabel('sdedr:define-refinement-function', {
        params: ['definition-name', 'function-name', 'MaxInterval', 'Variable', 'dopant-name', 'Cmin', 'cmin', 'Cmax', 'cmax'],
        optionals: [
            { name: 'Scaling', tag: 'Scaling', type: 'number', param: 'scaling' },
        ],
    });
    assert.ok(label.includes('[Scaling scaling]'));
});

console.log('\nbuildParams:');

test('从 modeData + funcDoc 构建参数列表', () => {
    const modeData = {
        params: ['definition-name', 'function-name', 'MaxGradient', 'value'],
    };
    const funcDoc = {
        parameters: [
            { name: 'definition-name', desc: 'Name of the refinement definition' },
            { name: 'value', desc: 'Gradient threshold value' },
        ],
    };
    const params = sigProvider.buildParams(modeData, funcDoc);
    assert.strictEqual(params.length, 4);
    assert.strictEqual(params[0].label, 'definition-name');
    assert.ok(params[0].documentation.includes('Name of the refinement'));
    assert.strictEqual(params[3].label, 'value');
});

test('无 funcDoc 时参数列表无文档', () => {
    const modeData = { params: ['a', 'b'] };
    const params = sigProvider.buildParams(modeData, null);
    assert.strictEqual(params.length, 2);
    assert.strictEqual(params[0].documentation, '');
});

console.log('\nprovideSignatureHelp (mock document):');

test('模式分派函数返回正确签名', () => {
    // 模拟 VSCode Document
    const doc = {
        getText: () => '(sdedr:define-refinement-function "ref1" "MaxGradient" 0.1)',
    };
    const pos = { line: 0, character: 48 }; // 光标在 0.1 后面
    const table = {
        'sdedr:define-refinement-function': {
            argIndex: 2,
            modes: {
                MaxGradient: { params: ['definition-name', 'function-name', 'MaxGradient', 'value'] },
            },
        },
    };
    const funcDocs = {
        'sdedr:define-refinement-function': {
            description: 'Defines a refinement function.',
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, table, funcDocs);
    assert.ok(result);
    assert.strictEqual(result.activeSignature, 0);
    assert.strictEqual(result.signatures[0].parameters.length, 4);
});

test('非模式分派函数返回基本签名', () => {
    const doc = {
        getText: () => '(sdegeo:create-circle (position 0 0 0) 10 "Si" "R")',
    };
    const pos = { line: 0, character: 10 };
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center-pos radius region-material region-name)',
            parameters: [
                { name: 'center-pos', desc: 'Center position' },
                { name: 'radius', desc: 'Radius' },
                { name: 'region-material', desc: 'Material name' },
                { name: 'region-name', desc: 'Region name' },
            ],
        },
    };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs);
    assert.ok(result);
    assert.ok(result.signatures[0].label.includes('sdegeo:create-circle'));
});

test('光标不在函数调用上返回 null', () => {
    const doc = { getText: () => '(define x 42)\n' };
    const pos = { line: 0, character: 3 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {});
    assert.strictEqual(result, null);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [x] **Step 3: 运行测试**

Run: `node tests/test-signature-provider.js`
Expected: 全部通过

- [x] **Step 4: 提交**

```bash
git add src/lsp/providers/signature-provider.js tests/test-signature-provider.js
git commit -m "feat(lsp): add Signature Help provider with mode dispatch support"
```

---

## Task 4: 为 sde_function_docs.json 添加 modeDispatch 元数据（首批）

**Files:**
- Modify: `syntaxes/sde_function_docs.json`

为 12 个模式分派函数添加 `modeDispatch` 字段。由于 JSON 文件较大，按复杂度分两批添加。首批处理高复杂度的 5 个函数。

- [x] **Step 1: 为 `sdedr:define-refinement-function` 添加 modeDispatch**

在 `syntaxes/sde_function_docs.json` 的 `"sdedr:define-refinement-function"` 条目中，与 `"signature"` 同级添加 `modeDispatch` 字段：

```json
"modeDispatch": {
  "argIndex": 2,
  "modes": {
    "MaxLenInt": {
      "params": ["definition-name", "function-name", "MaxLenInt", "mat-reg-1", "mat-reg-2", "value"],
      "optionals": [
        { "name": "factor", "type": "number" },
        { "name": "DoubleSide", "type": "flag" },
        { "name": "UseRegionNames", "type": "flag" }
      ]
    },
    "MaxInterval": {
      "params": ["definition-name", "function-name", "MaxInterval", "Variable", "dopant-name", "Cmin", "cmin", "Cmax", "cmax"],
      "optionals": [
        { "name": "Scaling", "tag": "Scaling", "type": "number", "param": "scaling" },
        { "name": "TargetLength", "tag": "TargetLength", "type": "number", "param": "targetLength" },
        { "name": "Rolloff", "type": "flag" }
      ]
    },
    "MaxGradient": {
      "params": ["definition-name", "function-name", "MaxGradient", "value"]
    },
    "MaxTransDiff": {
      "params": ["definition-name", "function-name", "MaxTransDiff", "value"]
    }
  }
}
```

- [x] **Step 2: 为 `sdedr:define-gaussian-profile` 添加 modeDispatch**

```json
"modeDispatch": {
  "argIndex": 3,
  "labelBased": true,
  "modes": {
    "PeakVal": {
      "tag": "PeakVal",
      "params": ["definition-name", "species", "PeakPos", "peak-position", "PeakVal", "peak-concentration"]
    },
    "Dose": {
      "tag": "Dose",
      "params": ["definition-name", "species", "PeakPos", "peak-position", "Dose", "dose"]
    }
  },
  "secondaryChoices": [
    {
      "afterParam": 5,
      "modes": {
        "ValueAtDepth": {
          "tag": "ValueAtDepth",
          "extraParams": ["ValueAtDepth", "concentration-at-depth", "Depth", "depth"]
        },
        "Length": {
          "tag": "Length",
          "extraParams": ["Length", "diffusion-length"]
        },
        "StdDev": {
          "tag": "StdDev",
          "extraParams": ["StdDev", "standard-deviation"]
        }
      }
    }
  ],
  "commonTail": ["lateral-function"]
}
```

> **设计说明：** `labelBased: true` 表示模式不是通过位置索引选择的，而是通过标签字面量（如 `"PeakVal"`、`"Dose"`）。`secondaryChoices` 支持嵌套选择——第一个选择确定 PeakVal/Dose 后，第二个选择确定 ValueAtDepth/Length/StdDev。`commonTail` 是所有模式共用的尾部可选参数。

- [x] **Step 3: 为 `sdedr:define-erf-profile` 添加 modeDispatch**

```json
"modeDispatch": {
  "argIndex": 3,
  "labelBased": true,
  "modes": {
    "MaxVal": {
      "tag": "MaxVal",
      "params": ["definition-name", "species", "SymPos", "symmetry-position", "MaxVal", "max-value"]
    },
    "Dose": {
      "tag": "Dose",
      "params": ["definition-name", "species", "SymPos", "symmetry-position", "Dose", "dose"]
    }
  },
  "commonTail": ["Junction", "junction", "ValueAtDepth", "value-at-depth", "Depth", "depth", "Length", "length", "StdDev", "standard-deviation", "lateral-function"]
}
```

- [x] **Step 4: 为 `sdedr:define-analytical-profile` 添加 modeDispatch**

```json
"modeDispatch": {
  "argIndex": 6,
  "modes": {
    "Gauss": {
      "params": ["name", "species", "initialization", "function", "start-value", "analytical-type", "Gauss", "lateral-parameter", "lateral-value"]
    },
    "Erf": {
      "params": ["name", "species", "initialization", "function", "start-value", "analytical-type", "Erf", "lateral-parameter", "lateral-value"]
    },
    "Eval": {
      "params": ["name", "species", "initialization", "function", "start-value", "analytical-type", "Eval", "lateral-eval-init", "lateral-eval-func"]
    }
  }
}
```

- [x] **Step 5: 为 `sdedr:define-refeval-window` 添加 modeDispatch**

```json
"modeDispatch": {
  "argIndex": 1,
  "modes": {
    "Point": {
      "params": ["rfwin-name", "Point", "position"]
    },
    "Line": {
      "params": ["rfwin-name", "Line", "start-position", "end-position"]
    },
    "Rectangle": {
      "params": ["rfwin-name", "Rectangle", "start-position", "end-position"]
    },
    "Circle": {
      "params": ["rfwin-name", "Circle", "center-position", "radius"]
    },
    "Expression": {
      "params": ["rfwin-name", "Expression", "eval-function"]
    }
  }
}
```

- [x] **Step 6: 验证 JSON 格式正确**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/sde_function_docs.json','utf8')); console.log('JSON valid')"`
Expected: `JSON valid`

- [x] **Step 7: 提交**

```bash
git add syntaxes/sde_function_docs.json
git commit -m "feat(lsp): add modeDispatch metadata for 5 core SDE functions"
```

---

## Task 5: 为 sde_function_docs.json 添加 modeDispatch 元数据（第二批）

**Files:**
- Modify: `syntaxes/sde_function_docs.json`

为剩余 7 个低复杂度函数添加 `modeDispatch` 字段。这些函数的模式选择较简单，多为位置参数类型选择。

- [x] **Step 1: 为 7 个低复杂度函数批量添加 modeDispatch**

以下每个函数都需要在其 JSON 条目中添加 `modeDispatch` 字段：

**`sdegeo:create-sphere`：**
```json
"modeDispatch": {
  "argIndex": 0,
  "modes": {
    "position": {
      "params": ["center-position", "radius", "region-material", "region-name"]
    },
    "coords": {
      "params": ["cx", "cy", "cz", "radius", "region-material", "region-name"]
    }
  }
}
```

**`sdegeo:create-torus`：**
```json
"modeDispatch": {
  "argIndex": 0,
  "modes": {
    "position": {
      "params": ["center-position", "major-radius", "minor-radius", "region-material", "region-name"]
    },
    "coords": {
      "params": ["cx", "cy", "cz", "major-radius", "minor-radius", "region-material", "region-name"]
    }
  }
}
```

**`sdegeo:sweep`：**
```json
"modeDispatch": {
  "argIndex": 1,
  "modes": {
    "path": { "params": ["profile", "path", "sweep-options"] },
    "distance": { "params": ["profile", "distance", "sweep-options"] },
    "vector": { "params": ["profile", "gvector", "sweep-options"] },
    "axis": { "params": ["profile", "position", "position", "sweep-options"] }
  }
}
```

**`sdegeo:prune-vertices`：**
```json
"modeDispatch": {
  "argIndex": 0,
  "modes": {
    "body-list": { "params": ["body-list", "angular-tolerance"] },
    "edge-list": { "params": ["edge-list", "angular-tolerance"] },
    "vertex-list": { "params": ["vertex-list", "angular-tolerance"] }
  }
}
```

**`sdepe:photo`：**
```json
"modeDispatch": {
  "labelBased": true,
  "argIndex": -1,
  "modes": {
    "thickness": { "tag": "thickness", "extraParams": ["thickness"] },
    "height": { "tag": "height", "extraParams": ["height"] }
  }
}
```

**`sdepe:polish-device`：**
```json
"modeDispatch": {
  "labelBased": true,
  "argIndex": -1,
  "modes": {
    "thickness": { "tag": "thickness", "extraParams": ["thickness"] },
    "height": { "tag": "height", "extraParams": ["height"] }
  }
}
```

**`sdepe:remove`：**
```json
"modeDispatch": {
  "labelBased": true,
  "argIndex": -1,
  "modes": {
    "region": { "tag": "region", "extraParams": ["region-name"] },
    "material": { "tag": "material", "extraParams": ["material"] }
  }
}
```

- [x] **Step 2: 验证 JSON 格式正确**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/sde_function_docs.json','utf8')); console.log('JSON valid')"`
Expected: `JSON valid`

- [x] **Step 3: 验证所有 12 个函数都有 modeDispatch**

Run: `node -e "const d=require('./syntaxes/sde_function_docs.json'); const fns=['sdedr:define-refinement-function','sdedr:define-gaussian-profile','sdedr:define-erf-profile','sdedr:define-analytical-profile','sdedr:define-refeval-window','sdegeo:create-sphere','sdegeo:create-torus','sdegeo:sweep','sdegeo:prune-vertices','sdepe:photo','sdepe:polish-device','sdepe:remove']; const missing=fns.filter(f=>!d[f].modeDispatch); if(missing.length) { console.log('Missing:', missing); process.exit(1); } console.log('All 12 functions have modeDispatch');"`
Expected: `All 12 functions have modeDispatch`

- [x] **Step 4: 提交**

```bash
git add syntaxes/sde_function_docs.json
git commit -m "feat(lsp): add modeDispatch metadata for remaining 7 SDE functions"
```

---

## Task 6: 在 extension.js 中注册 SignatureHelpProvider

**Files:**
- Modify: `src/extension.js:1-10` (导入)
- Modify: `src/extension.js:259-268` (SDE provider 注册区域)

将 `signature-provider.js` 集成到扩展中，为 SDE 语言注册 SignatureHelpProvider。

- [x] **Step 1: 在 extension.js 顶部添加导入**

在 `src/extension.js` 行 8（`const schemeParser = ...`）之后添加：

```js
const signatureProvider = require('./lsp/providers/signature-provider');
```

- [x] **Step 2: 构建 modeDispatchTable**

在 `activate()` 函数内部，紧接 `funcDocs` 构建完成之后（约行 257，`sdeviceDocs` 合并之后），添加：

```js
    // 构建 modeDispatch 查找表：从 funcDocs 中提取有 modeDispatch 的函数
    const modeDispatchTable = {};
    for (const [fnName, fnDoc] of Object.entries(funcDocs)) {
        if (fnDoc.modeDispatch) {
            modeDispatchTable[fnName] = fnDoc.modeDispatch;
        }
    }
```

- [x] **Step 3: 为 SDE 注册 SignatureHelpProvider**

在 `src/extension.js` 中，紧接 bracket-diagnostic 注册之后（约行 268），添加：

```js
    // Signature Help (SDE only)
    const sigHelpDisposable = vscode.languages.registerSignatureHelpProvider(
        { language: 'sde' },
        {
            provideSignatureHelp(document, position, token) {
                return signatureProvider.provideSignatureHelp(
                    document, position, token,
                    modeDispatchTable, funcDocs
                );
            },
        },
        ' ', '\t', '"', '('  // 触发字符：空格、Tab、双引号、左括号
    );
    context.subscriptions.push(sigHelpDisposable);
```

> **设计说明：** Signature Help 在用户输入空格（参数间分隔）、双引号（字符串参数）或左括号（嵌套调用）时自动触发。`signature-provider.js` 内部会判断是否在函数调用上下文中，非函数调用直接返回 `null`。

- [x] **Step 4: 运行所有现有测试确认不破坏**

Run: `node tests/test-scheme-parser.js && node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-signature-provider.js`
Expected: 全部通过

- [x] **Step 5: 手动验证 Signature Help**

用 VSCode Extension Development Host 打开一个 `.scm` 文件，输入：
```scheme
(sdedr:define-refinement-function "ref1" "MaxGradient"
```
在 `"MaxGradient"` 后面输入空格，应该弹出参数签名提示，高亮 `value` 参数。

- [x] **Step 6: 提交**

```bash
git add src/extension.js
git commit -m "feat(lsp): register SignatureHelpProvider for SDE with mode dispatch"
```

---

## Task 7: 运行全部测试并更新蓝图文档

**Files:**
- Modify: `docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md`

- [x] **Step 1: 运行全部测试套件**

Run: `node tests/test-scheme-parser.js && node tests/test-definitions.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-signature-provider.js && node tests/test-snippet-prefixes.js`
Expected: 全部通过（0 失败）

- [x] **Step 2: 更新蓝图文档**

在 `docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md` 中：

1. **Phase 总览表**：将 Phase 2 行的状态从 "2A+2B 已完成，2C 待实施" 改为 "✅ 已完成"

2. **Phase 2 标题**：从 `## Phase 2: 语义分派（2A+2B 已完成，2C 待实施）` 改为 `## Phase 2: 语义分派 ✅`

3. **Phase 2 交付物**：在 "已完成交付物（2A+2B）" 之后添加 "2C 新增交付物"：

```
### 2C 新增交付物

```
src/
└── lsp/
    ├── semantic-dispatcher.js        # 新增：模式分派引擎 (~120 行)
    └── providers/
        └── signature-provider.js     # 新增：Signature Help provider (~120 行)

syntaxes/
└── sde_function_docs.json            # 修改：12 个函数添加 modeDispatch 字段

tests/
├── test-semantic-dispatcher.js       # 新增：分派引擎测试
└── test-signature-provider.js        # 新增：Signature Help 测试
```
```

4. **完成标准**：在 2A+2B 完成标准后添加：

```
### 完成标准（2C：模式分派）

8. ✅ 12 个模式分派函数拥有 modeDispatch 元数据
9. ✅ Signature Help 在输入函数参数时自动触发
10. ✅ 模式分派函数显示当前模式的参数签名
11. ✅ 非模式分派函数显示基本签名（如果有文档）
12. ✅ 光标位置正确映射到参数索引
```

5. **Phase 2C 小节**：将 "待实施（2C：模式分派）" 改为 "已实施（2C：模式分派）"，标记所有 checkbox 为已完成

6. **Phase 2 实施中修复的额外问题**：添加 2C 条目：

```
- **模式分派设计演进**：最初计划 `labelBased` 通过标签字面量匹配模式（如 `"PeakVal"`），实施中统一为 argIndex 位置匹配。对于 sdepe: 系列的标签参数函数（`argIndex: -1`），使用线性扫描匹配标签对。
```

- [x] **Step 3: 最终提交**

```bash
git add docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md docs/superpowers/plans/2026-04-13-sde-lsp-layer2.md
git commit -m "docs: update LSP blueprint — Phase 2C complete"
```

---

## 实施后修复记录

以下是 Task 1–7 完成并提交后，在实际 VSCode 环境中测试发现并修复的问题。

### Fix 1: argIndex 值与 AST 子节点位置不匹配

**发现时间：** 实施后首次 VSCode 实测

**症状：** 所有模式分派函数的 Signature Help 都显示组合签名（`{... | ...}` 格式），无法按模式显示特定签名。

**根因：** 计划中的 `argIndex` 值是"参数在第几个 children 位置"（1-based offset），而实现中 `resolveMode` 通过 `children[argIndex + 1]` 访问参数节点（+1 跳过函数名）。这导致 argIndex 语义不一致——计划值和实现对 argIndex 的理解差了 1。

**修正方案：** 通过实际 AST 解析测试逐个验证 12 个函数的 children 结构，将 argIndex 统一为"0-based 参数索引"语义。

**修正的 4 个函数：**

| 函数 | 原 argIndex | 修正后 | 验证方式 |
|------|-----------|--------|---------|
| `sdedr:define-refinement-function` | 2 | 1 | `children[2]` = `"MaxGradient"` → argIndex 应为 1 |
| `sdedr:define-gaussian-profile` | 3 | 4 | 标签参数在 `children[5]` → argIndex 应为 4 |
| `sdedr:define-erf-profile` | 3 | 4 | 同上，标签参数位置偏移 |
| `sdedr:define-analytical-profile` | 6 | 5 | `children[6]` = `"Gauss"` → argIndex 应为 5 |

**提交：** `e89066c` — 修正 4 个 SDE 函数的 argIndex 配置

### Fix 2: i18n 环境下 modeDispatch 元数据缺失

**发现时间：** Fix 1 修正在 VSCode 中验证时

**症状：** 修正 argIndex 后，Node.js 测试全部通过（包括模式分派验证），但在 VSCode Extension Development Host 中仍然显示组合签名。

**根因：** `modeDispatch` 元数据仅添加到英文版 `sde_function_docs.json`。`extension.js` 中 `loadDocsJson('sde_function_docs.json', useZh)` 在中文环境下优先加载 `sde_function_docs.zh-CN.json`，该文件不含 `modeDispatch` 字段。结果 `modeDispatchTable` 构建时遍历的是中文 funcDocs，表中无任何条目，`dispatcher.dispatch()` 返回 `mode: null`，代码走到 `funcDoc.signature` 的 fallback 路径。

**诊断过程：**
1. Node.js 直接测试 → 模式分派正确 ✓
2. 检查 `sde_function_docs.zh-CN.json` 是否存在 → 存在 ✓
3. 检查 zh-CN 文件是否含 modeDispatch → **不含** ✗
4. 确认 `loadDocsJson` 的 i18n 优先加载逻辑 → 这就是根因

**修正方案：** `extension.js` 中 `modeDispatchTable` 始终从英文文件构建：

```js
// 修正前：从 funcDocs（可能是 zh-CN 版本）构建
const modeDispatchTable = {};
for (const [fnName, fnDoc] of Object.entries(funcDocs)) { ... }

// 修正后：始终从英文文件构建（结构化元数据与语言无关）
const enSdeDocs = loadDocsJson('sde_function_docs.json', false);
const modeDispatchSource = enSdeDocs || funcDocs;
const modeDispatchTable = {};
for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) { ... }
```

**架构教训：** 结构性元数据（modeDispatch、参数定义）与翻译内容（description、example）应分离加载。翻译文件只负责用户可见文本，机器消费的结构数据应从权威源（英文文件）加载。

**提交：** `0488ed9` — 修复中文语言环境下 modeDispatch 元数据缺失导致模式分派失效

