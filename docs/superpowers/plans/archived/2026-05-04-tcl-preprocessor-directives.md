# Tcl 预处理器指令支持实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 5 种 Tcl 语言添加预处理器指令（#if/#else/#endif 等）的语法高亮、分支感知诊断和代码折叠支持。

**Architecture:** 文本级分支感知方案。提取共享工具函数 `buildPpBlocks` 供诊断和折叠共用；诊断层新增 `checkTclDuplicateDefs` 利用分支映射区分不同条件分支中的同名变量；折叠层追加 `#if`/`#endif` 块折叠；5 个 TextMate 语法文件添加 `meta.preprocessor.tcl` 模式。

**Tech Stack:** TextMate JSON 语法、tree-sitter-tcl（不修改）、纯 JavaScript（CommonJS）、Node.js assert 测试。

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 新建 | `src/lsp/pp-utils.js` | 共享工具：`buildPpBlocks` 提取预处理器块信息 |
| 新建 | `tests/test-tcl-preprocessor.js` | 预处理器功能的完整测试套件 |
| 修改 | `src/lsp/providers/undef-var-diagnostic.js:1-10,189-222,105-136` | 导入 `pp-utils`，重构 `buildPpBranchMap`，新增 `checkTclDuplicateDefs`，修改 `checkTclUndefVars` |
| 修改 | `src/lsp/tcl-ast-utils.js:243-257` | `ScopeIndex` 新增 `getGlobalDefs()` getter |
| 修改 | `src/lsp/providers/tcl-folding-provider.js:1-29` | 导入 `pp-utils`，追加预处理器折叠范围 |
| 修改 | `syntaxes/sdevice.tmLanguage.json` ~line 326 | 在注释模式前插入 `meta.preprocessor.tcl` 模式 |
| 修改 | `syntaxes/sprocess.tmLanguage.json` ~line 310 | 同上 |
| 修改 | `syntaxes/emw.tmLanguage.json` ~line 66 | 同上 |
| 修改 | `syntaxes/inspect.tmLanguage.json` ~line 90 | 同上 |
| 修改 | `syntaxes/svisual.tmLanguage.json` ~line 158 | 同上 |

---

### Task 1: 创建共享工具模块 `pp-utils.js`

**Files:**
- Create: `src/lsp/pp-utils.js`
- Test: `tests/test-tcl-preprocessor.js`

- [ ] **Step 1: 编写 `buildPpBlocks` 的失败测试**

创建 `tests/test-tcl-preprocessor.js`：

```javascript
'use strict';

const assert = require('assert');

// --- buildPpBlocks 测试 ---

suite('buildPpBlocks');

test('简单 #if/#else/#endif 生成正确的分支映射', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if NMOS',
        'set x 1',
        '#else',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 1 行 #if → 分支 0
    assert.strictEqual(branchMap.get(1), 0);
    // 第 2 行 set x 1 → 分支 0
    assert.strictEqual(branchMap.get(2), 0);
    // 第 3 行 #else → 分支 1
    assert.strictEqual(branchMap.get(3), 1);
    // 第 4 行 set x 2 → 分支 1
    assert.strictEqual(branchMap.get(4), 1);
    // 第 5 行 #endif → 不在分支内
    assert.strictEqual(branchMap.get(5), undefined);
});

test('不同分支的同名定义具有不同 branchKey', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if NMOS',
        'set x 1',
        '#else',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 4 行应属于不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
});

test('嵌套 #if 块正确分配分支 ID', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if 0',
        '  #if COND',
        '  set x 1',
        '  #else',
        '  set x 2',
        '  #endif',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 3 行和第 5 行属于不同分支
    assert.notStrictEqual(branchMap.get(3), branchMap.get(5));
});

test('同分支内的重复定义具有相同 branchKey', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if 1',
        'set x 1',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 3 行应属于同一分支
    assert.strictEqual(branchMap.get(2), branchMap.get(3));
});

test('#ifdef 和 #ifndef 也被识别', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#ifdef VAR',
        'set x 1',
        '#endif',
        '#ifndef VAR',
        'set x 2',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    assert.strictEqual(branchMap.has(2), true);
    assert.strictEqual(branchMap.has(5), true);
    // 两个独立的 #if 块
    assert.notStrictEqual(branchMap.get(2), branchMap.get(5));
});

test('#elif 创建新分支', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if 1',
        'set x 1',
        '#elif 2',
        'set x 2',
        '#else',
        'set x 3',
        '#endif',
    ].join('\n');

    const { branchMap } = buildPpBlocks(code);

    // 三个不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
    assert.notStrictEqual(branchMap.get(4), branchMap.get(6));
    assert.notStrictEqual(branchMap.get(2), branchMap.get(6));
});

test('非预处理器行不在 branchMap 中', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = 'set x 1\nset y 2\n';

    const { branchMap } = buildPpBlocks(code);

    assert.strictEqual(branchMap.size, 0);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-tcl-preprocessor.js`
Expected: FAIL — `Cannot find module '../src/lsp/pp-utils'`

- [ ] **Step 3: 实现 `pp-utils.js`**

创建 `src/lsp/pp-utils.js`：

```javascript
'use strict';

/**
 * 分析预处理器指令块，返回分支映射和折叠范围。
 * @param {string} text - 文档原始文本
 * @returns {{ branchMap: Map<number, number>, foldingRanges: Array<{startLine: number, endLine: number}> }}
 * branchMap: 行号(1-based) → 分支 ID
 * foldingRanges: 0-based 行号范围的折叠范围
 */
function buildPpBlocks(text) {
    const branchMap = new Map();
    const foldingRanges = [];
    const lines = text.split('\n');
    const stack = []; // { branchId, startLine(0-based) }
    let nextId = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        if (/^#(if|ifdef|ifndef)\b/.test(line)) {
            const id = nextId++;
            stack.push({ branchId: id, startLine: i });
        } else if (/^#elif\b/.test(line)) {
            if (stack.length > 0) {
                const id = nextId++;
                stack[stack.length - 1].branchId = id;
            }
        } else if (/^#else\b/.test(line)) {
            if (stack.length > 0) {
                const id = nextId++;
                stack[stack.length - 1].branchId = id;
            }
        } else if (/^#endif\b/.test(line)) {
            if (stack.length > 0) {
                const entry = stack.pop();
                if (entry.startLine < i) {
                    foldingRanges.push({ startLine: entry.startLine, endLine: i });
                }
            }
        }

        if (stack.length > 0) {
            branchMap.set(lineNum, stack[stack.length - 1].branchId);
        }
    }

    return { branchMap, foldingRanges };
}

module.exports = { buildPpBlocks };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-tcl-preprocessor.js`
Expected: 所有测试 PASS

- [ ] **Step 5: 提交**

```bash
git add src/lsp/pp-utils.js tests/test-tcl-preprocessor.js
git commit -m "feat(pp): 新建 pp-utils 共享模块，提供预处理器块分析功能

新建 src/lsp/pp-utils.js，包含 buildPpBlocks 函数：
- 分析 #if/#ifdef/#ifndef/#elif/#else/#endif 预处理器指令块
- 返回分支映射（行号→分支ID）和折叠范围（0-based 行号）
- 同时新增完整测试套件 tests/test-tcl-preprocessor.js"
```

---

### Task 2: 重构 `buildPpBranchMap` 使用 `buildPpBlocks`

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js:1-10,189-222`

- [ ] **Step 1: 添加 `pp-utils` 导入并重构 `buildPpBranchMap`**

在 `undef-var-diagnostic.js` 顶部（约第 5-10 行附近，require 语句区域）添加：
```javascript
const ppUtils = require('../pp-utils');
```

替换 `buildPpBranchMap` 函数（第 189-222 行）为：
```javascript
/**
 * 构建预处理指令分支映射。
 * 分析 #if/#else/#elif/#endif 块，为每个分支分配唯一 ID。
 * @param {string} text - 文档原始文本
 * @returns {Map<number, number>} 行号 → 分支 ID
 */
function buildPpBranchMap(text) {
    return ppUtils.buildPpBlocks(text).branchMap;
}
```

- [ ] **Step 2: 运行已有 Scheme 诊断测试确认无回归**

Run: `node tests/test-scheme-dup-def-diagnostic.js`
Expected: 所有测试 PASS（`buildPpBranchMap` 行为不变）

- [ ] **Step 3: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "refactor(diag): buildPpBranchMap 委托给共享 pp-utils 模块

将 buildPpBranchMap 的核心逻辑提取到 pp-utils.buildPpBlocks，
原有函数改为薄包装层，保持向后兼容。"
```

---

### Task 3: `ScopeIndex` 新增 `getGlobalDefs()` getter

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js:243-257`

- [ ] **Step 1: 添加 getter 方法**

在 `ScopeIndex` 类的 `constructor` 方法后（约第 257 行之后、`getVisibleAt` 方法之前）添加：

```javascript
    /**
     * 返回全局变量定义数组的浅拷贝。
     * @returns {Array<{name: string, defLine: number, isProc: boolean}>}
     */
    getGlobalDefs() {
        return this._globalDefs;
    }
```

- [ ] **Step 2: 运行已有 Tcl 测试确认无回归**

Run: `node tests/test-tcl-undef-diagnostic.js`
Expected: 所有测试 PASS

- [ ] **Step 3: 提交**

```bash
git add src/lsp/tcl-ast-utils.js
git commit -m "feat(tcl): ScopeIndex 新增 getGlobalDefs() getter

暴露内部全局定义数组，供重复定义检测使用。"
```

---

### Task 4: 实现 `checkTclDuplicateDefs` 并集成

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js:105-136`
- Test: `tests/test-tcl-preprocessor.js`（追加测试）

- [ ] **Step 1: 编写 `checkTclDuplicateDefs` 的失败测试**

在 `tests/test-tcl-preprocessor.js` 末尾追加：

```javascript
// --- checkTclDuplicateDefs 测试 ---

suite('checkTclDuplicateDefs');

test('不同 #if 分支的同名 set 不报重复', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    // 模拟 globalDefs 数组
    const globalDefs = [
        { name: 'doping', defLine: 2, isProc: false },
        { name: 'doping', defLine: 4, isProc: false },
    ];
    const code = '#if NMOS\nset doping Boron\n#else\nset doping Phosphorus\n#endif';
    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 4 行属于不同分支
    assert.notStrictEqual(branchMap.get(2), branchMap.get(4));
});

test('同分支内的同名 set 应被检测为重复', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const globalDefs = [
        { name: 'x', defLine: 2, isProc: false },
        { name: 'x', defLine: 3, isProc: false },
    ];
    const code = '#if 1\nset x 1\nset x 2\n#endif';
    const { branchMap } = buildPpBlocks(code);

    // 第 2 行和第 3 行属于同一分支
    assert.strictEqual(branchMap.get(2), branchMap.get(3));
});

test('不在 #if 块内的同名 set（branchKey 相同）应为重复', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const globalDefs = [
        { name: 'x', defLine: 1, isProc: false },
        { name: 'x', defLine: 2, isProc: false },
    ];
    const code = 'set x 1\nset x 2';
    const { branchMap } = buildPpBlocks(code);

    // 两行都不在任何分支内
    assert.strictEqual(branchMap.get(1), undefined);
    assert.strictEqual(branchMap.get(2), undefined);
});
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-tcl-preprocessor.js`
Expected: 所有测试 PASS（这些测试的是 `buildPpBlocks` 的行为验证，不依赖 `checkTclDuplicateDefs` 函数）

- [ ] **Step 3: 实现 `checkTclDuplicateDefs` 函数**

在 `undef-var-diagnostic.js` 中 `checkSchemeDuplicateDefs` 函数之后（约第 279 行之后）添加：

```javascript
/**
 * 检查 Tcl 代码中的重复定义（分支感知）。
 * 不同 #if 分支内的同名定义不视为重复。
 * @param {Array<{name: string, defLine: number, isProc: boolean}>} globalDefs
 * @param {Map<number, number>} ppBranchMap - buildPpBranchMap 返回的分支映射
 * @param {string} text - 文档原始文本
 * @returns {vscode.Diagnostic[]}
 */
function checkTclDuplicateDefs(globalDefs, ppBranchMap, text) {
    const diagnostics = [];
    const seen = new Map(); // composite key → first definition
    const lines = text.split('\n');

    for (const def of globalDefs) {
        const branchKey = ppBranchMap ? (ppBranchMap.get(def.defLine) ?? '') : '';
        const key = `${def.name}@${branchKey}`;

        if (seen.has(key)) {
            const first = seen.get(key);
            const lineText = lines[def.defLine - 1] || '';
            const range = new vscode.Range(
                def.defLine - 1, 0,
                def.defLine - 1, lineText.length
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `重复定义: '${def.name}' 已在第 ${first.defLine} 行定义`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'dup-def';
            diagnostics.push(diagnostic);
        } else {
            seen.set(key, def);
        }
    }

    return diagnostics;
}
```

- [ ] **Step 4: 将 `checkTclDuplicateDefs` 集成到 `checkTclUndefVars`**

修改 `checkTclUndefVars` 函数（约第 105-136 行），在 `return diagnostics;`（第 135 行）之前追加：

```javascript
    // 检测全局作用域的重复定义（分支感知）
    const text = document.getText();
    const ppBranchMap = buildPpBranchMap(text);
    diagnostics.push(...checkTclDuplicateDefs(scopeIndex.getGlobalDefs(), ppBranchMap, text));

    return diagnostics;
```

- [ ] **Step 5: 更新 `module.exports`**

确认 `module.exports` 包含 `checkTclDuplicateDefs`：
```javascript
module.exports = { activate, refreshAll, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, checkTclDuplicateDefs, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
```

- [ ] **Step 6: 运行全部测试确认无回归**

Run: `node tests/test-tcl-undef-diagnostic.js && node tests/test-tcl-preprocessor.js && node tests/test-scheme-dup-def-diagnostic.js`
Expected: 全部 PASS

- [ ] **Step 7: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "feat(tcl): 新增 checkTclDuplicateDefs 分支感知重复定义检测

- 新增 checkTclDuplicateDefs 函数：利用 buildPpBranchMap 区分不同
  #if 分支中的同名变量定义，不同分支不算重复
- 将重复定义检测集成到 checkTclUndefVars 中
- 现在同名变量在不同 #if/#else 分支中定义不再报 duplicate def"
```

---

### Task 5: Tcl 折叠 Provider 添加预处理器块折叠

**Files:**
- Modify: `src/lsp/providers/tcl-folding-provider.js:1-29`

- [ ] **Step 1: 修改 `tcl-folding-provider.js`**

替换整个文件为：

```javascript
// src/lsp/providers/tcl-folding-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');
const ppUtils = require('../pp-utils');

/**
 * 创建 VSCode FoldingRangeProvider for Tcl-based Sentaurus languages.
 * 使用 TclParseCache 管理解析缓存，Provider 不再自行调用 parseSafe / tree.delete。
 * @param {import('../parse-cache').TclParseCache} tclCache
 * @returns {object}
 */
function createTclFoldingProvider(tclCache) {
    return {
        /**
         * @param {vscode.TextDocument} document
         * @returns {vscode.FoldingRange[]}
         */
        provideFoldingRanges(document) {
            const entry = tclCache.get(document);
            if (!entry) return [];

            const ranges = astUtils.getFoldingRanges(entry.tree.rootNode);

            // 追加预处理器块折叠范围
            const text = document.getText();
            const { foldingRanges: ppRanges } = ppUtils.buildPpBlocks(text);
            for (const r of ppRanges) {
                ranges.push(r);
            }

            return ranges.map(r => new vscode.FoldingRange(r.startLine, r.endLine));
        },
    };
}

module.exports = { createTclFoldingProvider };
```

- [ ] **Step 2: 添加折叠范围测试**

在 `tests/test-tcl-preprocessor.js` 末尾追加：

```javascript
// --- 预处理器折叠范围测试 ---

suite('buildPpBlocks foldingRanges');

test('简单 #if/#endif 生成一个折叠范围', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = '#if 1\nset x 1\nset y 2\n#endif';
    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 1);
    assert.strictEqual(foldingRanges[0].startLine, 0);
    assert.strictEqual(foldingRanges[0].endLine, 3);
});

test('嵌套 #if 生成多个折叠范围', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = [
        '#if 1',
        '  #if 2',
        '  set x 1',
        '  #endif',
        '#endif',
    ].join('\n');
    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 2);
    // 内层 #if(第 2 行)/#endif(第 4 行)
    assert.strictEqual(foldingRanges[0].startLine, 1);
    assert.strictEqual(foldingRanges[0].endLine, 3);
    // 外层 #if(第 1 行)/#endif(第 5 行)
    assert.strictEqual(foldingRanges[1].startLine, 0);
    assert.strictEqual(foldingRanges[1].endLine, 4);
});

test('#elif 和 #else 不产生独立折叠范围', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = '#if 1\nset x 1\n#else\nset x 2\n#endif';
    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 1);
    assert.strictEqual(foldingRanges[0].startLine, 0);
    assert.strictEqual(foldingRanges[0].endLine, 4);
});

test('未闭合的 #if 不产生折叠范围', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = '#if 1\nset x 1\n';
    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 0);
});

test('没有 #if 的代码不产生折叠范围', () => {
    const { buildPpBlocks } = require('../src/lsp/pp-utils');
    const code = 'set x 1\nset y 2\n';
    const { foldingRanges } = buildPpBlocks(code);

    assert.strictEqual(foldingRanges.length, 0);
});
```

- [ ] **Step 3: 运行测试确认通过**

Run: `node tests/test-tcl-preprocessor.js`
Expected: 所有测试 PASS

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/tcl-folding-provider.js tests/test-tcl-preprocessor.js
git commit -m "feat(tcl): 折叠 Provider 支持 #if/#endif 块折叠

在 tcl-folding-provider 中集成 pp-utils.buildPpBlocks，
将预处理器块的折叠范围与 AST braced_word 折叠合并返回。
新增折叠范围的完整测试覆盖。"
```

---

### Task 6: 5 个 Tcl 语法文件添加预处理器高亮

**Files:**
- Modify: `syntaxes/sdevice.tmLanguage.json` (~line 326)
- Modify: `syntaxes/sprocess.tmLanguage.json` (~line 310)
- Modify: `syntaxes/emw.tmLanguage.json` (~line 66)
- Modify: `syntaxes/inspect.tmLanguage.json` (~line 90)
- Modify: `syntaxes/svisual.tmLanguage.json` (~line 158)

在所有 5 个文件中，在 `"name": "comment.line.hash"` 模式之前插入以下 JSON 对象（与 SDE 的 `meta.preprocessor.sde` 结构一致，scope 名改为 `.tcl`）：

```json
{
  "name": "meta.preprocessor.tcl",
  "begin": "^\\s*(#\\s*(?:if|ifdef|ifndef|elif|else|endif|define|undef|include|error|set))\\b",
  "beginCaptures": {
    "1": {
      "name": "keyword.control.preprocessor.tcl"
    }
  },
  "end": "$",
  "patterns": [
    {
      "match": "\\b(defined|TRUE|FALSE)\\b",
      "name": "keyword.control.preprocessor.tcl"
    },
    {
      "match": "\"[^\"]*\"",
      "name": "string.quoted.double.tcl"
    }
  ]
},
```

注意末尾的逗号——它需要与下一个 pattern（即注释模式 `comment.line.hash`）分隔。

每个文件的具体插入位置：

- **sdevice.tmLanguage.json**: 在 `"name": "constant.numeric.sdevice"` 模式（`"match": "\\b(value)(?![A-Za-z0-9_:-])"`）之后、`"name": "comment.line.hash"` 之前
- **sprocess.tmLanguage.json**: 在 `"name": "entity.name.function.sprocess"` 模式之后、`"name": "comment.line.hash"` 之前
- **emw.tmLanguage.json**: 在 `"name": "string.quoted.emw"` 模式（`"match": "\\b(Standard|TruncatedPlaneWave|..."`）之后、`"name": "comment.line.hash"` 之前
- **inspect.tmLanguage.json**: 在 `"name": "entity.name.function.inspect"` 模式之后、`"name": "comment.line.hash"` 之前
- **svisual.tmLanguage.json**: 在 `"name": "string.quoted.svisual"` 模式之后、`"name": "comment.line.hash"` 之前

- [ ] **Step 1: 修改 `sdevice.tmLanguage.json`**
- [ ] **Step 2: 修改 `sprocess.tmLanguage.json`**
- [ ] **Step 3: 修改 `emw.tmLanguage.json`**
- [ ] **Step 4: 修改 `inspect.tmLanguage.json`**
- [ ] **Step 5: 修改 `svisual.tmLanguage.json`**
- [ ] **Step 6: 验证 JSON 有效性**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/sdevice.tmLanguage.json')); console.log('sdevice OK')" && node -e "JSON.parse(require('fs').readFileSync('syntaxes/sprocess.tmLanguage.json')); console.log('sprocess OK')" && node -e "JSON.parse(require('fs').readFileSync('syntaxes/emw.tmLanguage.json')); console.log('emw OK')" && node -e "JSON.parse(require('fs').readFileSync('syntaxes/inspect.tmLanguage.json')); console.log('inspect OK')" && node -e "JSON.parse(require('fs').readFileSync('syntaxes/svisual.tmLanguage.json')); console.log('svisual OK')"`
Expected: 5 个文件均输出 OK

- [ ] **Step 7: 提交**

```bash
git add syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat(syntax): 5 种 Tcl 语言添加预处理器指令语法高亮

在 sdevice/sprocess/emw/inspect/svisual 的 TextMate 语法中，
于注释模式前插入 meta.preprocessor.tcl 模式，使 #if/#ifdef/
#ifndef/#elif/#else/#endif/#define/#undef/#include/#error/#set
正确高亮为 keyword.control.preprocessor，与 SDE 实现一致。"
```

---

### Task 7: 最终验证

- [ ] **Step 1: 运行全部测试套件**

Run: `node tests/test-tcl-preprocessor.js && node tests/test-tcl-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-undef-diagnostic.js`
Expected: 全部 PASS

- [ ] **Step 2: 手动验证**

在 VSCode Extension Development Host 中打开一个包含预处理器指令的 Tcl 文件（如 sdevice 的 `.cmd` 文件），验证：
1. `#if`/`#else`/`#endif` 等指令高亮为关键字颜色（非注释灰色）
2. 不同 `#if` 分支中的同名 `set` 变量不报 duplicate def
3. `#if`/`#endif` 块可折叠

- [ ] **Step 3: 最终提交（如有手动修复）**

如果手动验证中发现问题，修复后单独提交。
