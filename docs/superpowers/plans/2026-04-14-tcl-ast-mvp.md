# Tcl AST 共享框架 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Sentaurus TCAD 扩展中的 4 种 Tcl 语言（sdevice, sprocess, emw, inspect）开发共享的 AST 框架，提供代码折叠和括号诊断能力。

**Architecture:** 利用已有的 web-tree-sitter WASM 解析器（`tcl-parser-wasm.js`），新建 AST 工具层和两个 Provider。AST 工具层封装 tree-sitter 节点遍历、查询和内存管理；FoldingRangeProvider 基于 `braced_word` 节点提供代码折叠；括号诊断基于 AST 检查 `{}` 匹配。所有模块为纯 CommonJS，4 种语言统一注册。

**Tech Stack:** web-tree-sitter (WASM), VSCode Extension API, 纯 JavaScript (CommonJS), Node.js assert (测试)

---

## File Structure

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 新建 | `src/lsp/tcl-ast-utils.js` | AST 遍历/查询工具函数（~150 行） |
| 新建 | `src/lsp/providers/tcl-folding-provider.js` | 代码折叠范围提取（~80 行） |
| 新建 | `src/lsp/providers/tcl-bracket-diagnostic.js` | 括号匹配诊断（~120 行） |
| 新建 | `tests/test-tcl-ast-utils.js` | AST 工具函数单元测试（~200 行） |
| 修改 | `src/extension.js:1-11` | 添加 require 导入 |
| 修改 | `src/extension.js:337-340` | 在 SDE provider 注册之后添加 Tcl provider 注册 |

---

### Task 1: AST 工具层 — tcl-ast-utils.js

**Files:**
- Create: `src/lsp/tcl-ast-utils.js`
- Test: `tests/test-tcl-ast-utils.js`

- [ ] **Step 1: 创建测试文件，编写遍历工具的失败测试**

```javascript
// tests/test-tcl-ast-utils.js
'use strict';

const assert = require('assert');

// 手动 mock web-tree-sitter 节点结构
// 因为 WASM 解析器需要 VSCode 环境初始化，测试中直接构造节点树
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

// 构建一个 sdevice 风格的 AST 片段:
// Device {
//     Electrode { Name="gate" Voltage=0.0 }
//     Physics { Mobility( PhuMob ) }
// }
function buildSampleAST() {
    const electrodeBody = makeNode('word_list', '', [
        makeNode('command', 'Name="gate" Voltage=0.0', [], 1, 4, 1, 29),
    ], 1, 4, 1, 30);
    const electrodeBraced = makeNode('braced_word', '{ Name="gate" Voltage=0.0 }', [
        makeNode('{', '{', [], 1, 14, 1, 15),
        electrodeBody,
        makeNode('}', '}', [], 1, 38, 1, 39),
    ], 1, 14, 1, 39);

    const physicsBody = makeNode('word_list', '', [
        makeNode('command', 'Mobility( PhuMob )', [], 2, 4, 2, 22),
    ], 2, 4, 2, 23);
    const physicsBraced = makeNode('braced_word', '{ Mobility( PhuMob ) }', [
        makeNode('{', '{', [], 2, 12, 2, 13),
        physicsBody,
        makeNode('}', '}', [], 2, 25, 2, 26),
    ], 2, 12, 2, 26);

    const deviceBody = makeNode('word_list', '', [
        makeNode('command', 'Electrode', [electrodeBraced], 1, 4, 1, 39),
        makeNode('command', 'Physics', [physicsBraced], 2, 4, 2, 26),
    ], 0, 7, 3, 1);

    const deviceBraced = makeNode('braced_word', '{\n    Electrode { ... }\n    Physics { ... }\n}', [
        makeNode('{', '{', [], 0, 7, 0, 8),
        deviceBody,
        makeNode('}', '}', [], 3, 0, 3, 1),
    ], 0, 7, 3, 1);

    return makeNode('program', '', [
        makeNode('command', 'Device', [deviceBraced], 0, 0, 3, 1),
    ], 0, 0, 3, 1);
}

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== tcl-ast-utils 测试 ===\n');

// ── walkNodes 测试 ──
console.log('walkNodes:');

test('遍历所有节点', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const visited = [];
    ast.walkNodes(root, node => visited.push(node.type));
    // 应该包含 program, command, braced_word 等
    assert(visited.includes('program'), '应包含 program 节点');
    assert(visited.includes('command'), '应包含 command 节点');
    assert(visited.includes('braced_word'), '应包含 braced_word 节点');
});

test('只遍历 braced_word 类型', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const bracedWords = ast.findNodesByType(root, 'braced_word');
    // Device 的 braced_word, Electrode 的 braced_word, Physics 的 braced_word
    assert.strictEqual(bracedWords.length, 3, `应有 3 个 braced_word，实际 ${bracedWords.length}`);
});

// ── findNodesByType 测试 ──
console.log('\nfindNodesByType:');

test('查找 command 节点', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const commands = ast.findNodesByType(root, 'command');
    assert(commands.length >= 4, `应有至少 4 个 command 节点，实际 ${commands.length}`);
});

test('查找不存在的类型返回空数组', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const result = ast.findNodesByType(root, 'nonexistent_type');
    assert.strictEqual(result.length, 0);
});

// ── getFoldingRanges 测试 ──
console.log('\ngetFoldingRanges:');

test('从 braced_word 提取折叠范围', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const ranges = ast.getFoldingRanges(root);
    assert(ranges.length >= 3, `应有至少 3 个折叠范围，实际 ${ranges.length}`);
    // Device: 行 0-3
    const deviceRange = ranges.find(r => r.startLine === 0);
    assert(deviceRange, '应包含 Device 的折叠范围');
    assert.strictEqual(deviceRange.endLine, 3);
});

test('空 AST 返回空数组', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const emptyRoot = makeNode('program', '', [], 0, 0, 0, 0);
    const ranges = ast.getFoldingRanges(emptyRoot);
    assert.strictEqual(ranges.length, 0);
});

// ── findMismatchedBraces 测试 ──
console.log('\nfindMismatchedBraces:');

test('正常代码无括号错误', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    const root = buildSampleAST();
    const errors = ast.findMismatchedBraces(root);
    assert.strictEqual(errors.length, 0, `不应有括号错误，但发现 ${errors.length} 个`);
});

test('检测到不匹配的括号', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    // 构造一个有问题的节点 — 只有一个 { 没有 }
    const badRoot = makeNode('program', '', [
        makeNode('command', 'Device', [
            makeNode('braced_word', '{ only open', [
                makeNode('{', '{', [], 0, 7, 0, 8),
                makeNode('word_list', 'only open', [], 0, 8, 0, 18),
                // 缺少 } 节点
            ], 0, 7, 0, 18),
        ], 0, 0, 0, 18),
    ], 0, 0, 0, 18);
    // 使用 hasError 标记
    badRoot.children[0].children[0].hasError = true;
    const errors = ast.findMismatchedBraces(badRoot);
    assert(errors.length > 0, '应检测到括号错误');
});

// ── parseSafe 测试 ──
console.log('\nparseSafe:');

test('未初始化时返回 null', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    // 在测试环境中 WASM 解析器未初始化
    const result = ast.parseSafe('set x 42');
    assert.strictEqual(result, null);
});

test('isTclLanguage 正确识别', () => {
    const ast = require('../src/lsp/tcl-ast-utils');
    assert.strictEqual(ast.isTclLanguage('sdevice'), true);
    assert.strictEqual(ast.isTclLanguage('sprocess'), true);
    assert.strictEqual(ast.isTclLanguage('emw'), true);
    assert.strictEqual(ast.isTclLanguage('inspect'), true);
    assert.strictEqual(ast.isTclLanguage('sde'), false);
    assert.strictEqual(ast.isTclLanguage('javascript'), false);
});

// ── 汇总 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`  通过: ${passed}, 失败: ${failed}`);
console.log(`${'='.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-tcl-ast-utils.js`
Expected: FAIL — `Cannot find module '../src/lsp/tcl-ast-utils'`

- [ ] **Step 3: 实现 tcl-ast-utils.js**

```javascript
// src/lsp/tcl-ast-utils.js
'use strict';

const tclParserWasm = require('./tcl-parser-wasm');

/** 支持的 Tcl 语言 ID */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);

/**
 * 检查语言 ID 是否为 Tcl 方言。
 * @param {string} langId
 * @returns {boolean}
 */
function isTclLanguage(langId) {
    return TCL_LANGS.has(langId);
}

/**
 * 安全解析 Tcl 文本，返回 tree（调用方负责 tree.delete()）。
 * 解析器未初始化时返回 null。
 * @param {string} text
 * @returns {object|null} tree-sitter Tree 对象
 */
function parseSafe(text) {
    if (!tclParserWasm.isReady()) return null;
    return tclParserWasm.parse(text);
}

/**
 * 深度优先遍历 AST 节点。
 * @param {object} node - tree-sitter 节点
 * @param {function(object): void} callback
 */
function walkNodes(node, callback) {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
        walkNodes(node.child(i), callback);
    }
}

/**
 * 查找所有指定类型的节点。
 * @param {object} root - 根节点
 * @param {string} type - 节点类型名
 * @returns {object[]}
 */
function findNodesByType(root, type) {
    const result = [];
    walkNodes(root, node => {
        if (node.type === type) result.push(node);
    });
    return result;
}

/**
 * 从 AST 中提取代码折叠范围。
 * 遍历所有 `braced_word` 节点，将其 { } 范围映射为 FoldingRange。
 * 忽略单行 braced_word（无折叠意义）。
 *
 * @param {object} root - tree-sitter 根节点
 * @returns {Array<{startLine: number, endLine: number}>}
 */
function getFoldingRanges(root) {
    const ranges = [];
    const bracedWords = findNodesByType(root, 'braced_word');

    for (const node of bracedWords) {
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        // 只折叠跨行的块
        if (endLine > startLine) {
            ranges.push({ startLine, endLine });
        }
    }

    return ranges;
}

/**
 * 检查 AST 中的括号匹配错误。
 * 通过 tree-sitter 的 hasError 标记和 ERROR 节点检测。
 *
 * @param {object} root - tree-sitter 根节点
 * @returns {Array<{startLine: number, startCol: number, endLine: number, endCol: number, message: string}>}
 */
function findMismatchedBraces(root) {
    const errors = [];

    walkNodes(root, node => {
        if (node.type === 'ERROR' && node.hasError) {
            errors.push({
                startLine: node.startPosition.row,
                startCol: node.startPosition.column,
                endLine: node.endPosition.row,
                endCol: node.endPosition.column,
                message: '语法错误：可能存在不匹配的括号或意外的语法',
            });
        }
    });

    return errors;
}

module.exports = {
    isTclLanguage,
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    findMismatchedBraces,
    TCL_LANGS,
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-tcl-ast-utils.js`
Expected: PASS — 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/lsp/tcl-ast-utils.js tests/test-tcl-ast-utils.js
git commit -m "feat: 添加 Tcl AST 工具层 — 节点遍历、折叠范围提取、括号诊断"
```

---

### Task 2: 代码折叠 Provider — tcl-folding-provider.js

**Files:**
- Create: `src/lsp/providers/tcl-folding-provider.js`

- [ ] **Step 1: 实现 tcl-folding-provider.js**

```javascript
// src/lsp/providers/tcl-folding-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/**
 * VSCode FoldingRangeProvider for Tcl-based Sentaurus languages.
 * 共用于 sdevice, sprocess, emw, inspect 四种语言。
 */
const tclFoldingProvider = {
    /**
     * @param {vscode.TextDocument} document
     * @returns {vscode.FoldingRange[]}
     */
    provideFoldingRanges(document) {
        const text = document.getText();
        const tree = astUtils.parseSafe(text);
        if (!tree) return [];

        try {
            const ranges = astUtils.getFoldingRanges(tree.rootNode);
            return ranges.map(r => new vscode.FoldingRange(r.startLine, r.endLine));
        } finally {
            tree.delete();
        }
    },
};

module.exports = tclFoldingProvider;
```

- [ ] **Step 2: 验证模块可加载**

Run: `node -e "const p = require('./src/lsp/providers/tcl-folding-provider'); console.log('exports:', Object.keys(p)); console.log('has provideFoldingRanges:', typeof p.provideFoldingRanges === 'function');"`
Expected: 输出 `exports: []` 或函数名，`has provideFoldingRanges: true`

注意：由于 `vscode` 模块在纯 Node.js 中不可用，这个验证只能在 VSCode 扩展宿主环境中进行。可以手动检查代码正确性。

- [ ] **Step 3: 提交**

```bash
git add src/lsp/providers/tcl-folding-provider.js
git commit -m "feat: 添加 Tcl 代码折叠 Provider（4 语言共用）"
```

---

### Task 3: 括号诊断 Provider — tcl-bracket-diagnostic.js

**Files:**
- Create: `src/lsp/providers/tcl-bracket-diagnostic.js`

- [x] **Step 1: 实现 tcl-bracket-diagnostic.js**

```javascript
// src/lsp/providers/tcl-bracket-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

const DEBOUNCE_MS = 500;
const TCL_LANG_SET = new Set(astUtils.TCL_LANGS);

/**
 * Activate Tcl bracket diagnostics.
 * 为所有 Tcl 方言语言（sdevice, sprocess, emw, inspect）提供括号匹配诊断。
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('tcl-brackets');
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
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );
}

/**
 * 更新单个文档的诊断信息。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const text = doc.getText();
    const tree = astUtils.parseSafe(text);
    if (!tree) {
        diagnosticCollection.delete(doc.uri);
        return;
    }

    try {
        const errors = astUtils.findMismatchedBraces(tree.rootNode);

        const diagnostics = errors.map(err => {
            const range = new vscode.Range(
                err.startLine, err.startCol,
                err.endLine, err.endCol
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                err.message,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'tcl-brackets';
            return diagnostic;
        });

        diagnosticCollection.set(doc.uri, diagnostics);
    } finally {
        tree.delete();
    }
}

module.exports = { activate };
```

- [x] **Step 2: 提交**

```bash
git add src/lsp/providers/tcl-bracket-diagnostic.js
git commit -m "feat: 添加 Tcl 括号诊断 Provider（4 语言共用）"
```

---

### Task 4: 集成到 extension.js

**Files:**
- Modify: `src/extension.js:1-11` (require 导入)
- Modify: `src/extension.js:337-355` (provider 注册)

- [x] **Step 1: 在 extension.js 头部添加 require**

在现有的 `const tclParserWasm = require('./lsp/tcl-parser-wasm');` 行之后添加两行：

```javascript
const tclFoldingProvider = require('./lsp/providers/tcl-folding-provider');
const tclBracketDiagnostic = require('./lsp/providers/tcl-bracket-diagnostic');
```

- [x] **Step 2: 在 provider 注册区域添加 Tcl provider 注册**

在 `bracketDiagnostic.activate(context);` 行（第 340 行）之后、`Signature Help` 注释之前添加：

```javascript
    // ── Tcl Providers（4 语言共用）──────────────────
    // 代码折叠
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerFoldingRangeProvider(
                { language: langId },
                tclFoldingProvider
            )
        );
    }

    // 括号诊断
    tclBracketDiagnostic.activate(context);
```

同时需要在头部 require 中添加：
```javascript
const astUtils = require('./lsp/tcl-ast-utils');
```

- [x] **Step 3: 验证扩展可加载**

在 VSCode Extension Development Host 中按 F5 启动，确认：
1. 扩展无报错加载
2. 打开一个 `*_des.cmd` 文件
3. Output 面板显示 "Tcl WASM 解析器初始化成功!"
4. 尝试折叠 `{ }` 块

- [x] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: 集成 Tcl AST Provider 到扩展 — 代码折叠和括号诊断"
```

---

### Task 5: 端到端手动测试

**Files:**
- 无新文件

- [x] **Step 1: 准备测试文件**

使用项目中已有的 `testbench_des.cmd`（或创建测试文件），内容包含：

```tcl
File {
    * output
    Output File="n1_des.plt"
}

Device {
    Electrode {
        { Name="gate" Voltage=0.0 }
        { Name="source" Voltage=0.0 }
    }
    Physics {
        Mobility( PhuMob )
        Recombination( SRH )
    }
}

Math {
    Extrapolate
    Method = Block
}

Plot {
    eDensity hDensity
    ElectricField
}

Solve {
    Poisson
    Coupled { Poisson Electron Hole }
}
```

- [x] **Step 2: 测试代码折叠**

1. 在 Extension Development Host 中打开上述文件
2. 确认语言 ID 为 `sdevice`
3. 检查 `File {}`、`Device {}`、`Electrode {}`、`Physics {}` 等块的行号旁是否出现折叠箭头
4. 点击折叠箭头，确认折叠行为正常

- [x] **Step 3: 测试括号诊断**

1. 删除一个 `}` 并等待约 500ms
2. 确认在 Problem 面板中出现 `tcl-brackets` 来源的警告
3. 恢复 `}`，确认警告消失

- [x] **Step 4: 测试多语言支持**

1. 对 `*_fps.cmd`（sprocess）文件重复步骤 2-3
2. 确认功能同样生效

- [x] **Step 5: 最终提交（如有修复）**

```bash
git add -A
git commit -m "fix: 修复集成测试中发现的问题"
```

---

## 自检清单

### 1. Spec 覆盖度
| 研究文档要求 | 对应 Task |
|-------------|-----------|
| `tcl-ast-utils.js` — AST 遍历辅助函数 | Task 1 |
| `tcl-folding-provider.js` — 代码折叠 | Task 2 |
| `tcl-bracket-diagnostic.js` — 括号诊断 | Task 3 |
| `extension.js` 集成注册 | Task 4 |
| 4 语言统一注册 | Task 4 (for loop over TCL_LANGS) |
| 内存管理 (tree.delete) | Task 2, 3 (try/finally) |
| 防抖 | Task 3 (DEBOUNCE_MS) |
| 纯 CommonJS、零构建 | 所有 Task |

### 2. 占位符扫描
无 TBD、TODO、"implement later" 等占位符。所有代码块包含完整实现。

### 3. 类型一致性
- `getFoldingRanges` 返回 `{startLine, endLine}[]` → Task 2 中映射为 `vscode.FoldingRange`
- `findMismatchedBraces` 返回 `{startLine, startCol, endLine, endCol, message}[]` → Task 3 中映射为 `vscode.Diagnostic`
- `TCL_LANGS` 在 `tcl-ast-utils.js` 定义为 Set → Task 4 通过 `astUtils.TCL_LANGS` 引用
