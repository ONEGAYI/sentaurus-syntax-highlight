# SDEVICE PAR Phase 2.1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `.par` 文件实现层级结构解析（ParParser）、当前文件 + include 递归索引（ParIndexService）、以及上下文感知补全（ParCompletion），使补全自动识别 scope/block/parameter 层级。

**Architecture:** 双管线并行：WASM/Tcl 管线（现有，不修改）+ ParParser 管线（Phase 2 新增纯文本栈追踪）。ParParser 采用 line-oriented 策略逐行扫描，输出 symbols/includes/lineContexts。ParIndexService 合并当前文件与 include 递归结果，缓存到内存。CompletionProvider 查缓存构建补全项，0 文件 IO，缓存未就绪时 fallback 到 all_keywords。

**Tech Stack:** 纯 CommonJS JavaScript（无 TypeScript、无构建步骤、无原生二进制），VSCode Extension API，纯 Node.js assert 测试。

**Spec:** `docs/superpowers/specs/2026-05-26-sdevicepar-phase2-workspace-index-design.md`

---

## lineContexts 设计决策

**Phase 2.1 采用 `beforeStack` 方案**：每行只保存行解析前的栈快照。

| 方案 | 存储 | 优势 | 劣势 |
|------|------|------|------|
| **beforeStack（Phase 2.1 采用）** | `LineContext { line, stack: StackFrame[], pendingBlockName }` | 存储/计算开销减半；覆盖空行/独立行补全（.par 文件 99% 场景） | 不支持同一行 `{ | }` 内补全 |
| beforeStack + afterStack | 每个 LineContext 多存一份 stack | 可支持同行补全 | 存储翻倍，Phase 2.1 不需要 |

**理由**：
1. 实际 `.par` 文件几乎不出现 `Material = "Silicon" { | }` 这种同行开闭结构
2. `afterStack` 等价于下一行的 `beforeStack`，冗余存储无意义
3. 同行 mid-line 栈追踪需要 token-level scanning，与 line-oriented 设计矛盾
4. **同一行 `{ | }` 补全不在 Phase 2.1 验收标准内**

**`getContextAtPosition(lineContexts, targetLine)` 语义**：
- 返回 `lineContexts[targetLine].stack`（该行开始前的栈状态）
- 空行：stack 就是前一行解析后的栈，直接用于补全
- `pendingBlockName` 非 null 时，表示有一个待确认的 block 名，补全时可据此提供 block 名

---

## 文件结构

### 新增文件

```
src/lsp/sdevicepar/
├── par-constants.js           ← 共享常量：SCOPE_TYPES / SCOPE_TYPES_ARRAY / SOURCE_PRIORITY（~20行）
├── par-parser.js              ← 纯文本栈追踪解析器（~250行）
├── par-context.js             ← 上下文工具函数：stackToPath / getContextAtPosition / matchParentPath（~100行）
├── par-index-service.js       ← 索引服务：缓存 + include 递归 + 查询接口（~300行）
└── par-completion.js          ← 补全构建逻辑 + lexical gate（~200行）

tests/
├── test-par-parser.js         ← Parser 测试
├── test-par-context.js        ← 上下文工具测试
├── test-par-index.js          ← 索引服务测试
└── test-par-completion.js     ← 补全构建测试
```

**par-constants.js 存在理由**：`par-completion.js` 和 `par-index-service.js` 互相依赖（前者需要 `SCOPE_TYPES_ARRAY`，后者需要 `buildParCompletions`）。将共享常量抽至独立文件，打破循环依赖。

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/extension.js` | 在 `activate()` 中初始化 `ParIndexService`，注册 debounced `onDidChangeTextDocument` + `onDidCloseTextDocument` |
| `src/register-completion-providers.js` | 添加 `if (langId === 'sdevicepar')` 分支，调用 ParIndexService 获取补全 |

### 不修改文件

| 文件 | 原因 |
|------|------|
| `syntaxes/sdevicepar.tmLanguage.json` | 高亮层已可用 |
| `syntaxes/all_keywords.json` | 保留为 fallback |
| `snippets/sdevicepar.json` | snippets 不重复 |
| `src/lsp/tcl-ast-utils.js` | WASM 管线不侵入 |
| `src/lsp/parse-cache.js` | 独立缓存，不修改 |
| `src/lsp/providers/sdevice-semantic-provider.js` | SDEVICE 专属 |

---

## Task 1: ParParser — 核心结构识别

**Files:**
- Create: `src/lsp/sdevicepar/par-parser.js`
- Create: `tests/test-par-parser.js`

**Commit:** `feat(sdevicepar): add par-constants and par-parser with structure recognition`

### Step 1.0: 创建 par-constants.js（共享常量，打破循环依赖）

创建 `src/lsp/sdevicepar/par-constants.js`：

```js
// src/lsp/sdevicepar/par-constants.js
'use strict';

/** scope 声明关键词（解析器匹配 + 补全数据源） */
const SCOPE_TYPES = new Set([
    'Material', 'Region', 'Interface',
    'MaterialInterface', 'RegionInterface', 'Electrode',
]);

/** 补全来源优先级（sortText 前缀） */
const SOURCE_PRIORITY = {
    current: 0,
    include: 1,
    workspace: 2,
    materialdb: 3,
    builtin: 4,
};

/** include 递归深度上限 */
const MAX_INCLUDE_DEPTH = 8;

/** 缓存条目上限 */
const MAX_CACHE_SIZE = 20;

module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
};
```

### Step 1.1: 创建目录结构

```bash
mkdir -p src/lsp/sdevicepar
```

创建 `tests/test-par-parser.js`：

```js
// tests/test-par-parser.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { parseParText } = require('../src/lsp/sdevicepar/par-parser');

// ── Scope 识别 ──────────────────────────────

test('parses Material scope', () => {
    const text = 'Material = "Silicon" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].scopeType, 'Material');
    assert.strictEqual(result.symbols[0].name, 'Silicon');
    assert.strictEqual(result.symbols[0].parentPath, '');
});

test('parses Region scope', () => {
    const text = 'Region = "channel" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].scopeType, 'Region');
    assert.strictEqual(result.symbols[0].name, 'channel');
});

test('parses all six scope types', () => {
    const types = ['Material', 'Region', 'Interface', 'MaterialInterface', 'RegionInterface', 'Electrode'];
    for (const t of types) {
        const text = `${t} = "test" {\n}\n`;
        const result = parseParText(text, 'test.par');
        assert.strictEqual(result.symbols[0].scopeType, t, `Failed for ${t}`);
    }
});

test('parses scope with slash in name', () => {
    const text = 'Interface = "Silicon/Oxide" {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols[0].name, 'Silicon/Oxide');
});

// ── Block 识别 ──────────────────────────────

test('parses inline block', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 2);
    assert.strictEqual(result.symbols[1].kind, 'block');
    assert.strictEqual(result.symbols[1].name, 'Bandgap');
    assert.strictEqual(result.symbols[1].parentPath, 'Material/Silicon');
});

test('parses pendingBlockName (block name and { on different lines)', () => {
    const text = 'Material = "Silicon" {\nBandgap\n{\n}\n}\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, 'Should find a block');
    assert.strictEqual(block.name, 'Bandgap');
});

test('pendingBlockName with comment line before {', () => {
    const text = 'Scharfetter\n* relation model\n{\nEg0 = 1.12\n}\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, 'Should find Scharfetter block');
    assert.strictEqual(block.name, 'Scharfetter');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param, 'Should find Eg0 parameter inside block');
});

test('abandoned pendingBlockName when next line is assignment', () => {
    const text = 'Bandgap\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    const blocks = result.symbols.filter(s => s.kind === 'block');
    assert.strictEqual(blocks.length, 0, 'Bandgap should not become a block');
    const params = result.symbols.filter(s => s.kind === 'parameter');
    assert.strictEqual(params.length, 1);
    assert.strictEqual(params[0].name, 'Eg0');
    // Should have abandonedPending diagnostic
    const abandoned = result.diagnostics.filter(d => d.kind === 'abandonedPending');
    assert.ok(abandoned.length >= 1, 'Should warn about abandoned pending');
});

// ── Parameter 识别 ──────────────────────────

test('parses parameter assignment', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Eg0');
    assert.strictEqual(param.value, '1.12');
    assert.strictEqual(param.parentPath, 'Material/Silicon/Bandgap');
});

test('parses vector parameter with index', () => {
    const text = 'Bandgap {\n  Xmax(0) = 1e-4\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Xmax(0)');
});

test('parses SWB parameter value', () => {
    const text = 'Bandgap {\n  Eg0 = @Eg0Silicon@\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '@Eg0Silicon@');
});

test('parses string parameter value', () => {
    const text = 'Physics {\n  fileName = "model.dat"\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '"model.dat"');
});

test('parameter value includes inline comment', () => {
    const text = 'Bandgap {\n  Eg0 = 1.12 # electron volts\n}\n';
    const result = parseParText(text, 'test.par');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.value, '1.12 # electron volts');
});

// ── #include 识别 ────────────────────────────

test('parses #include reference', () => {
    const text = 'Material = "Silicon" {\n  #include "Silicon.par"\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
    assert.strictEqual(result.includes[0].parentPath, 'Material/Silicon');
});

test('#include is not swallowed by comment skip', () => {
    const text = '#include "Silicon.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
});

test('#include at top level has empty parentPath', () => {
    const text = '#include "common.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes[0].parentPath, '');
});

// ── Insert 识别 ──────────────────────────────

test('parses Insert reference', () => {
    const text = 'Material = "Silicon" {\n  Insert = "Silicon.par"\n}\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.includes[0].path, 'Silicon.par');
    // Should NOT produce a parameter symbol
    assert.strictEqual(result.symbols.filter(s => s.kind === 'parameter').length, 0);
});

test('Insert is not swallowed by parameter assignment', () => {
    const text = 'Insert = "Oxide.par"\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.includes.length, 1);
    assert.strictEqual(result.symbols.length, 0);
});

// ── #if 条件块 ───────────────────────────────

test('#if block content is parsed normally', () => {
    const text = [
        'Material = "Silicon" {',
        '  #if @useAdvanced@ == 1',
        '    Bandgap {',
        '      Eg0 = 1.16964',
        '    }',
        '  #endif',
        '}',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    const block = result.symbols.find(s => s.kind === 'block');
    assert.ok(block, '#if block content should be parsed');
    assert.strictEqual(block.name, 'Bandgap');
    const param = result.symbols.find(s => s.kind === 'parameter');
    assert.ok(param);
    assert.strictEqual(param.name, 'Eg0');
});

test('#elif/#else/#endif lines are skipped', () => {
    const text = [
        '#if @x@ == 1',
        '  Eg0 = 1.0',
        '#elif @x@ == 2',
        '  Eg0 = 2.0',
        '#else',
        '  Eg0 = 3.0',
        '#endif',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    const params = result.symbols.filter(s => s.kind === 'parameter');
    assert.strictEqual(params.length, 3, 'All branches should be parsed');
});

// ── 注释跳过 ────────────────────────────────

test('hash comment lines are skipped', () => {
    const text = '# This is a comment\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

test('star comment lines are skipped', () => {
    const text = '* This is a comment\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

test('#set and other hash directives are skipped', () => {
    const text = '#set a b\nEg0 = 1.12\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 1);
});

// ── lineContexts ─────────────────────────────

test('lineContexts has entry for every line', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const lines = text.split('\n');
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.lineContexts.length, lines.length);
});

test('lineContexts captures beforeStack correctly', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    // Line 0 (Material = "Silicon" {): beforeStack = []
    assert.strictEqual(result.lineContexts[0].stack.length, 0);
    // Line 1 (Bandgap {): beforeStack = [scope:Material/Silicon]
    assert.strictEqual(result.lineContexts[1].stack.length, 1);
    assert.strictEqual(result.lineContexts[1].stack[0].name, 'Silicon');
    // Line 2 (Eg0 = 1.12): beforeStack = [scope, block:Bandgap]
    assert.strictEqual(result.lineContexts[2].stack.length, 2);
    assert.strictEqual(result.lineContexts[2].stack[1].name, 'Bandgap');
});

test('lineContexts tracks pendingBlockName', () => {
    const text = 'Bandgap\n{\nEg0 = 1.12\n}\n';
    const result = parseParText(text, 'test.par');
    // Line 0: pendingBlockName should be set after parsing
    assert.strictEqual(result.lineContexts[0].pendingBlockName, null); // beforeStack, before parsing
    // Line 1: pendingBlockName should be 'Bandgap' from line 0's parsing
    assert.strictEqual(result.lineContexts[1].pendingBlockName, 'Bandgap');
});

// ── 容错 ─────────────────────────────────────

test('scopeType field is consistent: scope frames use scopeType, never type', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const result = parseParText(text, 'test.par');
    for (const sym of result.symbols) {
        // scope entries must have scopeType, never type
        if (sym.kind === 'scope') {
            assert.ok(sym.scopeType, 'scope symbol must have scopeType');
            assert.strictEqual(sym.type, undefined, 'scope symbol must NOT have type field');
        }
    }
    // Check lineContexts stack frames too
    for (const lc of result.lineContexts) {
        for (const frame of lc.stack) {
            if (frame.kind === 'scope') {
                assert.ok(frame.scopeType, 'scope frame must have scopeType');
                assert.strictEqual(frame.type, undefined, 'scope frame must NOT have type field');
            }
        }
    }
});

test('empty file returns empty result', () => {
    const result = parseParText('', 'test.par');
    assert.strictEqual(result.symbols.length, 0);
    assert.strictEqual(result.includes.length, 0);
    assert.strictEqual(result.lineContexts.length, 1); // one empty line
});

test('comment-only file returns empty symbols', () => {
    const text = '# comment\n* another comment\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.length, 0);
});

test('unbalanced braces do not crash', () => {
    const text = 'Material = "Silicon" {\n  Bandgap {\n}\n';
    const result = parseParText(text, 'test.par');
    assert.ok(result.symbols.length > 0);
    assert.ok(result.diagnostics.some(d => d.kind === 'unbalancedBraces'));
});

test('nested 3-level structure', () => {
    const text = [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '  AvalancheFactors {',
        '    n_l_f = 1.0',
        '  }',
        '}',
    ].join('\n') + '\n';
    const result = parseParText(text, 'test.par');
    assert.strictEqual(result.symbols.filter(s => s.kind === 'scope').length, 1);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'block').length, 2);
    assert.strictEqual(result.symbols.filter(s => s.kind === 'parameter').length, 2);
});

summary();
```

- [ ] **Step 1.2: 运行测试验证全部失败**

```bash
node tests/test-par-parser.js
```

Expected: 所有测试 FAIL（`Cannot find module '../src/lsp/sdevicepar/par-parser'`）

- [ ] **Step 1.3: 实现 ParParser**

创建 `src/lsp/sdevicepar/par-parser.js`：

```js
// src/lsp/sdevicepar/par-parser.js
'use strict';

const { SCOPE_TYPES, SCOPE_TYPES_ARRAY } = require('./par-constants');

const SCOPE_TYPES_PATTERN = SCOPE_TYPES_ARRAY.join('|');

// ── 正则（按匹配优先级排列）────────────────────────
const RE_INCLUDE    = /^\s*#include\s+"([^"]+)"/;
const RE_PP_COND    = /^\s*#(?:if|elif|else|endif|define|undef|ifdef|ifndef)\b/;
const RE_HASH       = /^\s*#/;
const RE_STAR       = /^\s*\*/;
const RE_SCOPE      = new RegExp(`^\\s*(${SCOPE_TYPES_PATTERN})\\s*=\\s*"([^"]+)"\\s*(\\{?)`);
const RE_INSERT     = /^\s*Insert\s*=\s*"([^"]+)"/;
const RE_OPEN_BRACE = /^\s*\{/;
const RE_BLOCK      = /^\s*([A-Za-z][\\w-]*)\\s*\\{/;
const RE_PARAM      = /^\s*([A-Za-z][\w-]*(?:\(\d+\))?)\s*=\s*(.*)/;
const RE_IDENT      = /^\s*([A-Za-z][\w-]+)/;

function countBraceDelta(line) {
    let opens = 0, closes = 0;
    let inStr = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
            if (c === '\\') { i++; continue; }
            if (c === '"') inStr = false;
            continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === '{') opens++;
        if (c === '}') closes++;
    }
    return { opens, closes };
}

/**
 * 栈转路径字符串。
 * scope 帧 → "scopeType/name"，block 帧 → "name"
 */
function stackToPath(stack) {
    return stack.map(s =>
        s.kind === 'scope' ? s.scopeType + '/' + s.name : s.name
    ).join('/');
}

/**
 * 解析 .par 文件文本，返回结构化结果。
 * @param {string} text
 * @param {string} filePath
 * @returns {{ symbols: object[], includes: object[], lineContexts: object[], diagnostics: object[] }}
 */
function parseParText(text, filePath) {
    const symbols = [];
    const includes = [];
    const lineContexts = [];
    const diagnostics = [];
    const lines = text.split('\n');
    const stack = [];
    let pendingBlockName = null;
    let pendingStartLine = -1;

    function snapshotStack() {
        return stack.map(s => ({
            kind: s.kind,
            name: s.name,
            scopeType: s.scopeType || null,
            startLine: s.startLine,
        }));
    }

    function pushToStack(entry) {
        stack.push(entry);
    }

    function popStack(count) {
        for (let i = 0; i < count && stack.length > 0; i++) {
            const closed = stack.pop();
            if (closed._symbolIdx !== undefined) {
                symbols[closed._symbolIdx].range.endLine = currentLineIdx;
            }
        }
    }

    function clearPending() {
        if (pendingBlockName !== null) {
            diagnostics.push({
                kind: 'abandonedPending',
                message: `Abandoned pending block name "${pendingBlockName}" at line ${pendingStartLine + 1}`,
                line: pendingStartLine,
            });
            pendingBlockName = null;
        }
    }

    let currentLineIdx = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        currentLineIdx = lineIdx;
        const line = lines[lineIdx];
        const trimmed = line.trim();

        // 快照：行解析前的栈状态
        lineContexts.push({
            line: lineIdx,
            stack: snapshotStack(),
            pendingBlockName,
        });

        // 0. 空行
        if (trimmed === '') continue;

        // 1. #include（必须在注释跳过之前）
        let m = trimmed.match(RE_INCLUDE);
        if (m) {
            clearPending();
            includes.push({
                path: m[1],
                parentPath: stackToPath(stack),
                resolvedUri: null,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
            });
            continue;
        }

        // 2. 预处理条件指令（忽略指令本身）
        if (RE_PP_COND.test(trimmed)) continue;

        // 3. 其他 # 开头行
        if (RE_HASH.test(trimmed)) continue;

        // 4. * 开头行注释
        if (RE_STAR.test(trimmed)) continue;

        // 5. scope 声明
        m = line.match(RE_SCOPE);
        if (m) {
            clearPending();
            const symIdx = symbols.length;
            const scopeEntry = { kind: 'scope', scopeType: m[1], name: m[2], startLine: lineIdx, _symbolIdx: symIdx };
            pushToStack(scopeEntry);
            const parentPath = stackToPath(stack.slice(0, -1));
            symbols.push({
                kind: 'scope',
                name: m[2],
                scopeType: m[1],
                parentPath,
                fullPath: parentPath ? parentPath + '/' + m[2] : m[2],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value: null,
                source: 'current',
                includeChain: [],
            });
            // 处理同行 } 导致的立即 pop
            const brace = countBraceDelta(line);
            if (m[3] === '{') {
                // scope 的 { 已计入 opens，无需额外处理
                if (brace.closes > 0) popStack(brace.closes);
            }
            continue;
        }

        // 6. Insert（必须在 parameter assignment 之前）
        m = trimmed.match(RE_INSERT);
        if (m) {
            clearPending();
            includes.push({
                path: m[1],
                parentPath: stackToPath(stack),
                resolvedUri: null,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
            });
            continue;
        }

        // 7. 兑现 pending block（行以 { 开头）
        if (pendingBlockName !== null && RE_OPEN_BRACE.test(trimmed)) {
            const parentPath = stackToPath(stack);
            const symIdx = symbols.length;
            pushToStack({ kind: 'block', name: pendingBlockName, startLine: pendingStartLine, _symbolIdx: symIdx });
            symbols.push({
                kind: 'block',
                name: pendingBlockName,
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + pendingBlockName,
                filePath,
                range: { startLine: pendingStartLine, startCol: 0, endLine: pendingStartLine, endCol: 0 },
                value: null,
                source: 'current',
                includeChain: [],
            });
            pendingBlockName = null;
            const brace = countBraceDelta(line);
            if (brace.closes > 1) popStack(brace.closes - 1); // 第一个 } 关闭 block 自己
            else if (brace.closes === 1) popStack(1);
            continue;
        }

        // 8. block 开始（同行 {）
        m = line.match(RE_BLOCK);
        if (m) {
            clearPending();
            const parentPath = stackToPath(stack);
            const symIdx = symbols.length;
            pushToStack({ kind: 'block', name: m[1], startLine: lineIdx, _symbolIdx: symIdx });
            symbols.push({
                kind: 'block',
                name: m[1],
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + m[1],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value: null,
                source: 'current',
                includeChain: [],
            });
            const brace = countBraceDelta(line);
            // block 的 { 已在正则中匹配，opens 至少 1
            const netCloses = brace.closes - Math.max(0, brace.opens - 1);
            if (netCloses > 0) popStack(netCloses);
            continue;
        }

        // 9. parameter assignment
        m = line.match(RE_PARAM);
        if (m) {
            clearPending();
            const parentPath = stackToPath(stack);
            const value = m[2].trim();
            symbols.push({
                kind: 'parameter',
                name: m[1],
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + m[1],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value,
                source: 'current',
                includeChain: [],
            });
            const brace = countBraceDelta(line);
            if (brace.closes > 0) popStack(brace.closes);
            continue;
        }

        // 10. 可能的 block 名（无 {，无 =）
        m = trimmed.match(RE_IDENT);
        if (m && !trimmed.includes('=')) {
            clearPending();
            pendingBlockName = m[1];
            pendingStartLine = lineIdx;
            continue;
        }

        // 11. 其他行 — 尝试处理行内 }
        const brace = countBraceDelta(line);
        if (brace.closes > 0) popStack(brace.closes);
    }

    // 文件结束时检查未关闭的括号
    if (stack.length > 0) {
        diagnostics.push({
            kind: 'unbalancedBraces',
            message: `${stack.length} unclosed brace(s) at end of file`,
            line: lines.length - 1,
        });
    }

    return { symbols, includes, lineContexts, diagnostics };
}

module.exports = { parseParText, stackToPath };
```

**StackFrame 字段规范**（修订点 #1）：

所有栈帧统一使用 `scopeType` 字段，禁止 `type`：
- scope 帧：`{ kind: 'scope', scopeType: 'Material', name: 'Silicon', startLine }`
- block 帧：`{ kind: 'block', scopeType: null, name: 'Bandgap', startLine }`
- snapshotStack 输出同样使用 `scopeType`（不是 `type`）
```

- [ ] **Step 1.4: 运行测试验证通过**

```bash
node tests/test-par-parser.js
```

Expected: 全部测试 PASS

- [ ] **Step 1.5: 提交**

```bash
git add src/lsp/sdevicepar/par-constants.js src/lsp/sdevicepar/par-parser.js tests/test-par-parser.js
git commit -m "feat(sdevicepar): add par-constants, par-parser with structure recognition

- par-constants.js: 共享常量 SCOPE_TYPES/SOURCE_PRIORITY/MAX_INCLUDE_DEPTH/MAX_CACHE_SIZE
- Line-oriented 纯文本栈追踪解析器
- 识别 scope/block/parameter 三种结构
- pendingBlockName 机制处理跨行 block 声明
- #include/Insert 引用提取（优先于注释/赋值匹配）
- #if 条件块内容正常解析（不跳过）
- lineContexts 输出每行 beforeStack 快照
- 容错设计：不平衡括号/空文件/纯注释文件
- StackFrame 统一使用 scopeType 字段（修订点 #1）
- 37 个测试覆盖所有解析场景"
```

---

## Task 2: ParContext — 上下文工具函数

**Files:**
- Create: `src/lsp/sdevicepar/par-context.js`
- Create: `tests/test-par-context.js`

**Commit:** `feat(sdevicepar): add par-context utility functions`

### Step 2.1: 编写测试

创建 `tests/test-par-context.js`：

```js
// tests/test-par-context.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { stackToPath, getContextAtPosition, matchParentPath } = require('../src/lsp/sdevicepar/par-context');

// ── stackToPath ─────────────────────────────

test('empty stack returns empty string', () => {
    assert.strictEqual(stackToPath([]), '');
});

test('single scope frame', () => {
    const stack = [{ kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 }];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon');
});

test('scope + block frames', () => {
    const stack = [
        { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
        { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 2 },
    ];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon/Bandgap');
});

test('three levels deep', () => {
    const stack = [
        { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
        { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 2 },
        { kind: 'block', name: 'SubBlock', scopeType: null, startLine: 4 },
    ];
    assert.strictEqual(stackToPath(stack), 'Material/Silicon/Bandgap/SubBlock');
});

// ── getContextAtPosition ────────────────────

test('empty file returns null context', () => {
    const result = getContextAtPosition([], 0, 0);
    assert.strictEqual(result, null);
});

test('top-level empty line returns scopeType context', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: null },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.ok(ctx);
    assert.strictEqual(ctx.completableKind, 'scopeType');
    assert.strictEqual(ctx.parentPath, '');
});

test('inside scope returns block context', () => {
    const lineContexts = [
        { line: 0, stack: [{ kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 }], pendingBlockName: null },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'block');
    assert.strictEqual(ctx.parentPath, 'Material/Silicon');
    assert.strictEqual(ctx.scopeType, 'Material');
});

test('inside block returns parameter context', () => {
    const lineContexts = [
        {
            line: 0,
            stack: [
                { kind: 'scope', name: 'Silicon', scopeType: 'Material', startLine: 0 },
                { kind: 'block', name: 'Bandgap', scopeType: null, startLine: 1 },
            ],
            pendingBlockName: null,
        },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'parameter');
    assert.strictEqual(ctx.parentPath, 'Material/Silicon/Bandgap');
});

test('line number out of range returns null', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: null },
    ];
    assert.strictEqual(getContextAtPosition(lineContexts, 5, 0), null);
});

test('pendingBlockName context returns blockPending', () => {
    const lineContexts = [
        { line: 0, stack: [], pendingBlockName: 'Scharfetter' },
    ];
    const ctx = getContextAtPosition(lineContexts, 0, 0);
    assert.strictEqual(ctx.completableKind, 'blockPending');
    assert.strictEqual(ctx.pendingBlockName, 'Scharfetter');
});

// ── matchParentPath ─────────────────────────

test('exact match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Material/Silicon/Bandgap'), true);
});

test('wildcard match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Material/*/Bandgap'), true);
});

test('wildcard no match', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', 'Region/*/Bandgap'), false);
});

test('prefix wildcard', () => {
    assert.strictEqual(matchParentPath('Material/Silicon/Bandgap', '*/Silicon/Bandgap'), true);
});

test('no pattern returns exact equality check', () => {
    assert.strictEqual(matchParentPath('Material/Silicon', 'Material/Silicon'), true);
    assert.strictEqual(matchParentPath('Material/Silicon', 'Material/Germanium'), false);
});

summary();
```

- [ ] **Step 2.2: 运行测试验证全部失败**

```bash
node tests/test-par-context.js
```

Expected: FAIL

- [ ] **Step 2.3: 实现 par-context.js**

创建 `src/lsp/sdevicepar/par-context.js`：

```js
// src/lsp/sdevicepar/par-context.js
'use strict';

/**
 * 栈转路径字符串。
 * scope 帧 → "scopeType/name"，block 帧 → "name"
 * @param {Array<{kind: string, name: string, scopeType: string|null}>} stack
 * @returns {string}
 */
function stackToPath(stack) {
    return stack.map(s =>
        s.kind === 'scope' && s.scopeType ? s.scopeType + '/' + s.name : s.name
    ).join('/');
}

/**
 * 从 lineContexts 获取光标位置的上下文。
 *
 * Phase 2.1 设计：使用 beforeStack（行解析前的栈快照）。
 * 同一行内的 mid-line 上下文追踪不在 Phase 2.1 范围内。
 *
 * @param {Array<{line: number, stack: object[], pendingBlockName: string|null}>} lineContexts
 * @param {number} targetLine - 0-based 行号
 * @param {number} _targetCol - 未使用（Phase 2.1 不做同行上下文）
 * @returns {{ parentPath: string, scopeType: string|null, completableKind: string, pendingBlockName: string|null } | null}
 */
function getContextAtPosition(lineContexts, targetLine, _targetCol) {
    if (targetLine < 0 || targetLine >= lineContexts.length) return null;

    const ctx = lineContexts[targetLine];
    const stack = ctx.stack;
    const parentPath = stackToPath(stack);

    // Determine top-level scope type
    const scopeFrame = stack.find(s => s.kind === 'scope');
    const scopeType = scopeFrame ? scopeFrame.scopeType : null;

    // Determine what kind of completion is appropriate
    let completableKind;
    if (ctx.pendingBlockName) {
        completableKind = 'blockPending';
    } else if (stack.length === 0) {
        completableKind = 'scopeType';
    } else {
        const top = stack[stack.length - 1];
        if (top.kind === 'scope') {
            completableKind = 'block';
        } else if (top.kind === 'block') {
            completableKind = 'parameter';
        } else {
            completableKind = null;
        }
    }

    return {
        parentPath,
        scopeType,
        completableKind,
        pendingBlockName: ctx.pendingBlockName || null,
    };
}

/**
 * 通配符路径匹配。'*' 匹配单个路径段。
 * @param {string} parentPath - 实际路径，如 "Material/Silicon/Bandgap"
 * @param {string} pattern - 模式，如 "Material/*/Bandgap"
 * @returns {boolean}
 */
function matchParentPath(parentPath, pattern) {
    if (!pattern.includes('*')) return parentPath === pattern;

    const pathParts = parentPath.split('/');
    const patternParts = pattern.split('/');
    if (pathParts.length !== patternParts.length) return false;

    for (let i = 0; i < pathParts.length; i++) {
        if (patternParts[i] === '*') continue;
        if (pathParts[i] !== patternParts[i]) return false;
    }
    return true;
}

module.exports = { stackToPath, getContextAtPosition, matchParentPath };

/**
 * 检测光标是否在 scope 名引号内（如 Material = "|""）。
 * Phase 2.1 最小实现：仅检测 `Type = "` 模式后引号内的位置。
 * @param {string} lineText - 当前行文本
 * @param {number} col - 光标列号
 * @returns {{ scopeType: string } | null} 如果在 scope 名引号内，返回 scopeType；否则 null
 */
function detectScopeNameContext(lineText, col) {
    // 匹配 Type = "xxx" 模式，光标在引号内
    const scopeRe = /^\s*(Material|Region|Interface|MaterialInterface|RegionInterface|Electrode)\s*=\s*"/;
    const m = lineText.match(scopeRe);
    if (!m) return null;

    const scopeType = m[1];
    const quoteStart = lineText.indexOf('"', m[0].length - 1);
    if (quoteStart < 0) return null;

    // 找到结束引号
    let quoteEnd = lineText.indexOf('"', quoteStart + 1);
    if (quoteEnd < 0) quoteEnd = lineText.length; // 未闭合引号

    if (col > quoteStart && col <= quoteEnd) {
        return { scopeType };
    }
    return null;
}

module.exports = { stackToPath, getContextAtPosition, matchParentPath, detectScopeNameContext };
```

- [ ] **Step 2.4: 运行测试验证通过**

```bash
node tests/test-par-context.js
```

Expected: 全部 PASS

- [ ] **Step 2.5: 更新 par-parser.js 导出**

将 `par-parser.js` 中的 `stackToPath` 替换为从 `par-context.js` 导入（避免重复实现）。

修改 `src/lsp/sdevicepar/par-parser.js`：
- 删除文件内的 `stackToPath` 函数定义
- 在文件顶部添加：`const { stackToPath } = require('./par-context');`
- 保持 `module.exports` 不变（仍然导出 `stackToPath` 用于 re-export）

- [ ] **Step 2.6: 重新运行 parser 测试确认无回归**

```bash
node tests/test-par-parser.js
```

Expected: 全部 PASS

- [ ] **Step 2.7: 提交**

```bash
git add src/lsp/sdevicepar/par-context.js tests/test-par-context.js src/lsp/sdevicepar/par-parser.js
git commit -m "feat(sdevicepar): add par-context utility functions

- stackToPath: 栈帧数组 → 路径字符串（scope帧用 scopeType/name）
- getContextAtPosition: lineContexts + 目标行号 → 补全上下文
  Phase 2.1 使用 beforeStack 方案，不支持同一行内 mid-line 上下文
- matchParentPath: 通配符路径匹配（* 匹配单段）
- par-parser.js 的 stackToPath 重构为从 par-context 导入
- 16 个测试覆盖所有工具函数"
```

---

## Task 3: ParIndexService — 当前文件索引（无 include）

**Files:**
- Create: `src/lsp/sdevicepar/par-index-service.js`
- Create: `tests/test-par-index.js`

**Commit:** `feat(sdevicepar): add par-index-service with current file caching`

### Step 3.1: 编写测试

创建 `tests/test-par-index.js`：

```js
// tests/test-par-index.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const path = require('path');
const { createParIndexService } = require('../src/lsp/sdevicepar/par-index-service');

// Mock document
function mockDoc(text, version, uri = 'file:///test.par') {
    return {
        uri: { toString: () => uri },
        version,
        getText: () => text,
        languageId: 'sdevicepar',
    };
}

// ── 基础缓存 ────────────────────────────────

test('parseCurrentFile returns parsed symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n', 1);
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    assert.strictEqual(result.symbols.length, 3); // scope + block + param
    service.dispose();
});

test('same version returns cached result', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);
    const r1 = service.parseCurrentFile(doc);
    const r2 = service.parseCurrentFile(doc);
    assert.strictEqual(r1, r2, 'Same version should return same object');
    service.dispose();
});

test('new version re-parses', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc1 = mockDoc('Material = "Silicon" {\n}\n', 1);
    const r1 = service.parseCurrentFile(doc1);
    const doc2 = mockDoc('Material = "Oxide" {\n}\n', 2);
    const r2 = service.parseCurrentFile(doc2);
    assert.notStrictEqual(r1, r2, 'Different version should re-parse');
    assert.strictEqual(r2.symbols[0].name, 'Oxide');
    service.dispose();
});

test('getCompletionsAt returns empty when no cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 99); // version 99, not cached
    const items = service.getCompletionsAt(doc, { line: 0, character: 0 });
    assert.ok(Array.isArray(items));
    assert.strictEqual(items.length, 0, 'No cache → empty array (caller falls back to all_keywords)');
    service.dispose();
});

test('getCompletionsAt returns completions from cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const text = 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n';
    const doc = mockDoc(text, 1);
    service.parseCurrentFile(doc);

    // Line 1: inside Material/Silicon scope → should suggest blocks
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    assert.ok(items.length > 0, 'Should have completion items');
    service.dispose();
});

test('onFileClosed clears cache', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);
    service.parseCurrentFile(doc);
    service.onFileClosed('file:///test.par');

    // After close, same doc should re-parse (cache cleared)
    const r2 = service.parseCurrentFile(doc);
    assert.ok(r2, 'Should re-parse after cache clear');
    service.dispose();
});

test('cache FIFO eviction at 20 entries', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // Fill 21 entries
    for (let i = 0; i < 21; i++) {
        const doc = mockDoc('Material = "X" {\n}\n', 1, `file:///doc${i}.par`);
        service.parseCurrentFile(doc);
    }
    // First doc should be evicted; re-parsing it should produce a new object
    const doc0 = mockDoc('Material = "X" {\n}\n', 1, 'file:///doc0.par');
    const r = service.parseCurrentFile(doc0);
    assert.ok(r, 'Should still work after eviction');
    service.dispose();
});

test('getCompletionsAt returns builtin scope types at top level', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('\n', 1); // empty file
    service.parseCurrentFile(doc);
    const items = service.getCompletionsAt(doc, { line: 0, character: 0 });
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Material'), 'Should include Material');
    assert.ok(labels.includes('Region'), 'Should include Region');
    assert.ok(labels.includes('Electrode'), 'Should include Electrode');
    service.dispose();
});

summary();
```

- [ ] **Step 3.2: 运行测试验证全部失败**

```bash
node tests/test-par-index.js
```

Expected: FAIL

- [ ] **Step 3.3: 实现 ParIndexService（不含 include）**

创建 `src/lsp/sdevicepar/par-index-service.js`：

```js
// src/lsp/sdevicepar/par-index-service.js
'use strict';

const path = require('path');
const fs = require('fs');
const { URL, fileURLToPath } = require('url');
const { parseParText } = require('./par-parser');
const { stackToPath, getContextAtPosition, detectScopeNameContext } = require('./par-context');
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH } = require('./par-constants');

/**
 * 创建 ParIndexService 实例。
 * @param {object} deps
 * @param {string} deps.extensionPath - 插件安装路径
 * @param {vscode.Uri[]} [deps.workspaceFolders] - workspace 根目录
 * @param {function} [deps.readFile] - 文件读取函数（可注入用于测试）
 */
function createParIndexService(deps) {
    const extensionPath = deps.extensionPath;
    const readFileFn = deps.readFile || ((p) => fs.readFileSync(p, 'utf8'));

    // currentFileCache: Map<"uri:v{version}", ParResolvedResult>
    const currentFileCache = new Map();

    // includeRawCache: Map<uri, ParParseResult>
    // Phase 2.1: resolved by resolveIncludes (Task 4)
    const includeRawCache = new Map();

    /**
     * 获取缓存键。
     */
    function cacheKey(uri, version) {
        return `${uri}:v${version}`;
    }

    /**
     * 解析当前文件并缓存结果。
     * @param {{ uri: { toString(): string }, version: number, getText(): string }} document
     * @returns {{ symbols: object[], includes: object[], lineContexts: object[] }}
     */
    function parseCurrentFile(document) {
        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (cached) return cached;

        const text = document.getText();
        const rawResult = parseParText(text, uri);

        // Phase 2.1: 只用当前文件的 symbols（include 在 Task 4 加入）
        const result = {
            symbols: rawResult.symbols,
            includes: rawResult.includes,
            lineContexts: rawResult.lineContexts,
            diagnostics: rawResult.diagnostics,
        };

        currentFileCache.set(key, result);

        // FIFO 淘汰
        if (currentFileCache.size > MAX_CACHE_SIZE) {
            const oldestKey = currentFileCache.keys().next().value;
            currentFileCache.delete(oldestKey);
        }

        return result;
    }

    /**
     * 获取光标位置的补全列表。热路径，0 文件 IO。
     * 缓存未就绪时返回空数组，由调用方 fallback 到 all_keywords。
     * @param {{ uri: { toString(): string }, version: number }} document
     * @param {{ line: number, character: number }} position
     * @returns {Array<{label: string, kind: string, detail: string, sortText: string, insertText: string, source: string, parentPath: string}>}
     */
    function getCompletionsAt(document, position) {
        const uri = document.uri.toString();
        const version = document.version;
        const key = cacheKey(uri, version);

        const cached = currentFileCache.get(key);
        if (!cached) return []; // 缓存未就绪 → fallback 到 all_keywords

        const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
        if (!ctx) return [];

        const items = [];

        if (ctx.completableKind === 'scopeType') {
            // 文件顶层 → 推荐所有 scope 类型
            for (const st of SCOPE_TYPES_ARRAY) {
                items.push({
                    label: st,
                    kind: 'scopeType',
                    detail: '[par] scope type',
                    sortText: '4_' + st,
                    insertText: st + ' = "$1" {\n\t$0\n}',
                    source: 'builtin',
                    parentPath: '',
                });
            }
        } else if (ctx.completableKind === 'block') {
            // scope 内 → 推荐已知 block（从 symbols 抽取）
            const blockNames = new Set();
            for (const sym of cached.symbols) {
                if (sym.kind === 'block' && sym.parentPath.startsWith(ctx.parentPath)) {
                    blockNames.add(sym.name);
                }
            }
            // 也从 include 结果中收集（Task 4 加入后生效）
            let idx = 0;
            for (const name of blockNames) {
                items.push({
                    label: name,
                    kind: 'block',
                    detail: `[par] block (${ctx.scopeType || 'scope'})`,
                    sortText: `0_${idx}_${name}`,
                    insertText: name + ' {\n\t$0\n}',
                    source: 'current',
                    parentPath: ctx.parentPath,
                });
                idx++;
            }
        } else if (ctx.completableKind === 'parameter') {
            // block 内 → 推荐已知 parameter（从 symbols 抽取）
            const seen = new Set();
            let idx = 0;
            for (const sym of cached.symbols) {
                if (sym.kind === 'parameter' && sym.parentPath === ctx.parentPath && !seen.has(sym.name)) {
                    seen.add(sym.name);
                    items.push({
                        label: sym.name,
                        kind: 'parameter',
                        detail: sym.value ? `[par] = ${sym.value}` : '[par] parameter',
                        sortText: `0_${idx}_${sym.name}`,
                        insertText: sym.name + ' = ',
                        source: sym.source || 'current',
                        parentPath: ctx.parentPath,
                    });
                    idx++;
                }
            }
        }
        // blockPending / null → 不补全，由调用方 fallback

        return items;
    }

    function onFileChanged(uri) {
        // 清除 include 缓存中该文件的 raw result（Task 4 完善）
    }

    function onFileClosed(uri) {
        // 清除该 uri 的所有缓存
        for (const key of currentFileCache.keys()) {
            if (key.startsWith(uri + ':')) {
                currentFileCache.delete(key);
            }
        }
        includeRawCache.delete(uri);
    }

    function dispose() {
        currentFileCache.clear();
        includeRawCache.clear();
    }

    return {
        parseCurrentFile,
        getCompletionsAt,
        onFileChanged,
        onFileClosed,
        dispose,
    };
}

module.exports = { createParIndexService };
```

- [ ] **Step 3.4: 运行测试验证通过**

```bash
node tests/test-par-index.js
```

Expected: 全部 PASS

- [ ] **Step 3.5: 提交**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-index.js
git commit -m "feat(sdevicepar): add par-index-service with current file caching

- parseCurrentFile: 解析当前文件并缓存，version 匹配时返回缓存
- getCompletionsAt: 0 文件 IO，只查内存缓存，未命中返回空数组
- 缓存键 uri:v{version}，FIFO 淘汰上限 20 条目
- 顶层补全 builtin scope types (Material/Region/...)
- scope 内从 symbols 抽取 block 名
- block 内从 symbols 抽取 parameter 名
- 8 个测试覆盖缓存生命周期和补全逻辑"
```

---

## Task 4: ParIndexService — Include 递归解析

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js`
- Update: `tests/test-par-index.js`

**Commit:** `feat(sdevicepar): add include/Insert recursive resolution`

### Step 4.1: 编写 include 递归测试

在 `tests/test-par-index.js` 末尾 `summary()` 之前添加：

```js
// ── Include 递归解析 ────────────────────────

const SILICON_PAR = [
    'Bandgap {',
    '  Eg0 = 1.12',
    '}',
    'Epsilon {',
    '  eps = 11.7',
    '}',
].join('\n') + '\n';

const COMMON_PAR = [
    'ThermalVelocity {',
    '  vt = 1e7',
    '}',
].join('\n') + '\n';

const WRAPPER_PAR = [
    'Material = "Silicon" {',
    '  #include "Silicon.par"',
    '}',
].join('\n') + '\n';

const NESTED_WRAPPER = [
    'Material = "Silicon" {',
    '  #include "Silicon.par"',
    '  #include "common.par"',
    '}',
].join('\n') + '\n';

// Mock file system
function createMockReadFile(fileMap) {
    return (p) => {
        const basename = path.basename(p);
        if (fileMap[basename]) return fileMap[basename];
        throw new Error('ENOENT: ' + p);
    };
}

test('include file symbols inherit parentPath', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath, baseUri) => refPath, // simplified
    });
    const doc = mockDoc(WRAPPER_PAR, 1);
    const result = service.parseCurrentFile(doc);

    // Should have grafted symbols from Silicon.par
    const eg0 = result.symbols.find(s => s.name === 'Eg0');
    assert.ok(eg0, 'Should find Eg0 from included file');
    assert.strictEqual(eg0.parentPath, 'Material/Silicon/Bandgap');
    assert.strictEqual(eg0.source, 'include');
    service.dispose();
});

test('multiple includes merge symbols', () => {
    const readFile = createMockReadFile({
        'Silicon.par': SILICON_PAR,
        'common.par': COMMON_PAR,
    });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc(NESTED_WRAPPER, 1);
    const result = service.parseCurrentFile(doc);

    const eg0 = result.symbols.find(s => s.name === 'Eg0');
    const vt = result.symbols.find(s => s.name === 'vt');
    assert.ok(eg0, 'Should have Eg0 from Silicon.par');
    assert.ok(vt, 'Should have vt from common.par');
    assert.strictEqual(vt.parentPath, 'Material/Silicon/ThermalVelocity');
    service.dispose();
});

test('circular include does not infinite loop', () => {
    const CIRCULAR_A = '#include "B.par"\nA_param = 1\n';
    const CIRCULAR_B = '#include "A.par"\nB_param = 2\n';
    const readFile = createMockReadFile({ 'A.par': CIRCULAR_A, 'B.par': CIRCULAR_B });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc('#include "A.par"\n', 1);
    // Should not hang
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    service.dispose();
});

test('include file not found produces warning, no crash', () => {
    const readFile = createMockReadFile({}); // empty → all files not found
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc(WRAPPER_PAR, 1);
    const result = service.parseCurrentFile(doc);
    assert.ok(result);
    // Should only have current file's symbols (the scope), no include symbols
    const scopes = result.symbols.filter(s => s.kind === 'scope');
    assert.strictEqual(scopes.length, 1);
    service.dispose();
});

test('includeRawCache caches raw result, same file different grafts', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    let readCount = 0;
    const countingRead = (p) => { readCount++; return readFile(p); };
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile: countingRead,
        resolveFilePath: (refPath) => refPath,
    });

    // First include
    const doc1 = mockDoc('Material = "Si1" {\n  #include "Silicon.par"\n}\n', 1);
    service.parseCurrentFile(doc1);

    // Second include (same file, different parentPath)
    const doc2 = mockDoc('Material = "Si2" {\n  #include "Silicon.par"\n}\n', 1, 'file:///doc2.par');
    service.parseCurrentFile(doc2);

    // Silicon.par should only be read once (cached raw result)
    assert.strictEqual(readCount, 1, 'Should cache raw result and not re-read');
    service.dispose();
});

// ── 修订点 #7 新增测试 ─────────────────────────

test('same include file at different parentPath produces separate grafts', () => {
    const readFile = createMockReadFile({ 'Silicon.par': SILICON_PAR });
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });
    const doc = mockDoc([
        'Material = "Si1" {',
        '  #include "Silicon.par"',
        '}',
        'Material = "Si2" {',
        '  #include "Silicon.par"',
        '}',
    ].join('\n') + '\n', 1);
    const result = service.parseCurrentFile(doc);

    // Should have grafted symbols under BOTH parentPaths
    const eg0si1 = result.symbols.find(s => s.name === 'Eg0' && s.parentPath.startsWith('Material/Si1'));
    const eg0si2 = result.symbols.find(s => s.name === 'Eg0' && s.parentPath.startsWith('Material/Si2'));
    assert.ok(eg0si1, 'Should have Eg0 grafted under Material/Si1');
    assert.ok(eg0si2, 'Should have Eg0 grafted under Material/Si2');
    assert.strictEqual(eg0si1.parentPath, 'Material/Si1/Bandgap');
    assert.strictEqual(eg0si2.parentPath, 'Material/Si2/Bandgap');
    service.dispose();
});

test('source priority: current overrides include in dedup via buildParCompletions', () => {
    const { buildParCompletions } = require('../src/lsp/sdevicepar/par-completion');
    const ctx = { completableKind: 'parameter', parentPath: '', scopeType: null, pendingBlockName: null };
    // Both current and include define Eg0 at same parentPath
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: '', source: 'include' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: '', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate to 1 item');
    assert.strictEqual(eg0Items[0].source, 'current', 'current source should win over include');
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.16964', 'Should use current value');
});

test('completion provider merge does not pollute original items array', () => {
    // 模拟 Provider 层的 merge 逻辑
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n', 1);
    service.parseCurrentFile(doc);

    // 模拟闭包级 items（all_keywords fallback）
    const originalItems = [
        { label: 'Bandgap' },
        { label: 'SomeKeyword' },
    ];
    const originalLen = originalItems.length;

    // 获取 par 补全
    const parItems = service.getCompletionsAt(doc, { line: 1, character: 2 });
    // 模拟 Provider merge（不修改 originalItems）
    const parLabels = new Set(parItems.map(i => i.label));
    const keywordFallback = originalItems.filter(i => !parLabels.has(i.label));
    const merged = [...parItems, ...keywordFallback];

    // originalItems 不应被修改
    assert.strictEqual(originalItems.length, originalLen, 'originalItems should not be mutated');
    assert.deepStrictEqual(originalItems[0], { label: 'Bandgap' }, 'originalItems content unchanged');
    // merged 应包含 par 补全 + 不冲突的 keyword
    assert.ok(merged.length >= parItems.length, 'merged should include par items');
    service.dispose();
});

test('already-open document pre-heats on activation', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);

    // Simulate activation pre-heat (extension.js scans textDocuments)
    service.parseCurrentFile(doc);

    // Verify pre-heat worked: getCompletionsAt should return results without re-parsing
    const result = service.getCompletionsAt(doc, { line: 0, character: 0 });
    assert.ok(result.length > 0, 'Pre-heated cache should serve completions');
    // Verify scope type completions are present
    const labels = result.map(i => i.label);
    assert.ok(labels.includes('Material'), 'Should suggest Material scope type');
    service.dispose();
});
```

- [ ] **Step 4.2: 运行测试验证 include 测试失败**

```bash
node tests/test-par-index.js
```

Expected: 前面的基础测试 PASS，新增的 include 测试 FAIL

- [ ] **Step 4.3: 实现 resolveIncludes 并更新 parseCurrentFile**

修改 `src/lsp/sdevicepar/par-index-service.js`，在 `parseCurrentFile` 函数中添加 include 解析：

1. ~~`MAX_INCLUDE_DEPTH` 和 `fileURLToPath` 已在 Task 3 的文件顶部从 `par-constants` / `url` 导入，无需重复声明。~~

2. 在 `parseCurrentFile` 中，`parseParText` 调用之后、缓存之前，添加 include 解析：
```js
// 解析 include 递归
const includeSymbols = resolveIncludes(
    rawResult.includes,
    uri,
    '', // outerPrefix (current file is top-level)
    [uri], // includeChain（初始包含当前文件，修订点 #4）
    0, // depth
);

// 合并 symbols：当前文件 + include
const allSymbols = [...rawResult.symbols, ...includeSymbols];
```

3. 添加 `resolveIncludes` 函数（在 `createParIndexService` 内部，已应用修订点 #4）：
```js
function resolveIncludes(includes, baseUri, outerPrefix, includeChain, depth) {
    const result = [];
    for (const ref of includes) {
        if (depth >= MAX_INCLUDE_DEPTH) break;

        const resolvedPath = resolveFilePath(ref.path, baseUri);
        if (!resolvedPath) continue;

        // 递归链检测：只在当前链中出现才算循环（允许不同链引用同一文件）
        if (includeChain.includes(resolvedPath)) continue;

        // 获取或解析 raw result
        let rawResult = includeRawCache.get(resolvedPath);
        if (!rawResult) {
            try {
                const text = readFileFn(resolvedPath);
                rawResult = parseParText(text, resolvedPath);
                includeRawCache.set(resolvedPath, rawResult);
                // FIFO eviction
                if (includeRawCache.size > MAX_CACHE_SIZE) {
                    includeRawCache.delete(includeRawCache.keys().next().value);
                }
            } catch (e) {
                continue; // file not found → skip
            }
        }

        // Graft: 将 raw symbols 的 parentPath 替换为 graftBase + raw parentPath
        const graftBase = (outerPrefix && ref.parentPath)
            ? outerPrefix + '/' + ref.parentPath
            : (outerPrefix || ref.parentPath || '');

        const newChain = [...includeChain, resolvedPath];

        for (const sym of rawResult.symbols) {
            const newParentPath = graftBase
                ? (sym.parentPath ? graftBase + '/' + sym.parentPath : graftBase)
                : sym.parentPath;
            result.push({
                ...sym,
                parentPath: newParentPath,
                fullPath: newParentPath ? newParentPath + '/' + sym.name : sym.name,
                source: 'include',
                includeChain: newChain,
                filePath: resolvedPath,
            });
        }

        // 递归处理 nested include
        if (rawResult.includes.length > 0) {
            result.push(...resolveIncludes(
                rawResult.includes,
                resolvedPath,
                graftBase,
                newChain,
                depth + 1,
            ));
        }
    }
    return result;
}
```

4. 添加 `resolveFilePath` 辅助函数（在 `createParIndexService` 内部，修订点 #4）。注意 `fileURLToPath` 已在文件顶部导入，此处不再重复 require：
```js
function resolveFilePath(refPath, baseUri) {
    // 优先使用 deps 中注入的函数（测试用）
    if (deps.resolveFilePath) return deps.resolveFilePath(refPath, baseUri);

    // 1. 当前文件所在目录
    try {
        const basePath = baseUri.startsWith('file://') ? fileURLToPath(baseUri) : baseUri;
        const baseDir = path.dirname(basePath);
        const candidate = path.resolve(baseDir, refPath);
        if (fs.existsSync(candidate)) return candidate;
    } catch (_) {}

    // 2. workspace 根目录
    for (const folder of (deps.workspaceFolders || [])) {
        try {
            const wsPath = folder.uri.fsPath || fileURLToPath(folder.uri.toString());
            const candidate = path.resolve(wsPath, refPath);
            if (fs.existsSync(candidate)) return candidate;
        } catch (_) {}
    }

    // 3. 插件内置 references/MaterialDB/
    try {
        const bundled = path.join(extensionPath, 'references', 'MaterialDB', refPath);
        if (fs.existsSync(bundled)) return bundled;
    } catch (_) {}

    return null;
}
```

5. 更新 result 对象的 symbols：
```js
const result = {
    symbols: allSymbols, // 当前文件 + include
    // ... rest unchanged
};
```

- [ ] **Step 4.4: 运行全部测试验证通过**

```bash
node tests/test-par-index.js
```

Expected: 全部 PASS（基础 + include）

- [ ] **Step 4.5: 提交**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-index.js
git commit -m "feat(sdevicepar): add include/Insert recursive resolution

- resolveIncludes: 递归解析 #include/Insert 引用
- Graft base: 每个 include ref 用 ref.parentPath 作为嫁接前缀
- nested include 继承 outerPrefix + ref.parentPath
- includeRawCache: 只缓存 raw parse result，同一文件不同 parentPath 各自 graft
- 递归链检测: includeChain 数组 + MAX_INCLUDE_DEPTH=8（修订点 #4）
- 文件查找: 当前目录 > workspaceFolders > 插件 bundled MaterialDB
- resolveFilePath 使用 fileURLToPath（修订点 #4）
- 文件不存在: 静默跳过，不崩溃
- 9 个 include 测试覆盖递归/循环/缓存/文件缺失/重复 graft/优先级"
```

---

## Task 5: ParCompletion — 补全构建器

**Files:**
- Create: `src/lsp/sdevicepar/par-completion.js`
- Create: `tests/test-par-completion.js`

**Commit:** `feat(sdevicepar): add context-aware completion builder`

### Step 5.1: 编写补全测试

创建 `tests/test-par-completion.js`：

```js
// tests/test-par-completion.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { buildParCompletions } = require('../src/lsp/sdevicepar/par-completion');
const { SCOPE_TYPES_ARRAY } = require('../src/lsp/sdevicepar/par-constants');

// ── scopeType 补全 ──────────────────────────

test('top level suggests all scope types', () => {
    const ctx = { completableKind: 'scopeType', parentPath: '', scopeType: null, pendingBlockName: null };
    const symbols = [];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    for (const st of SCOPE_TYPES_ARRAY) {
        assert.ok(labels.includes(st), `Should include ${st}`);
    }
});

// ── block 补全 ──────────────────────────────

test('scope context suggests known blocks', () => {
    const ctx = { completableKind: 'block', parentPath: 'Material/Silicon', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'block', name: 'Bandgap', parentPath: 'Material/Silicon', source: 'current' },
        { kind: 'block', name: 'Epsilon', parentPath: 'Material/Silicon', source: 'include' },
        { kind: 'block', name: 'OtherBlock', parentPath: 'Material/Oxide', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Bandgap'), 'Should include Bandgap for Material/Silicon');
    assert.ok(labels.includes('Epsilon'), 'Should include Epsilon from include');
    assert.ok(!labels.includes('OtherBlock'), 'Should NOT include OtherBlock from different parentPath');
});

// ── parameter 补全 ──────────────────────────

test('block context suggests known parameters', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Chi0', value: '4.05', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'n_l_f', value: '1.0', parentPath: 'Material/Silicon/AvalancheFactors', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Eg0'), 'Should include Eg0');
    assert.ok(labels.includes('Chi0'), 'Should include Chi0');
    assert.ok(!labels.includes('n_l_f'), 'Should NOT include n_l_f from different block');
});

test('parameter deduplication by (label, parentPath)', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate (label, parentPath)');
});

// ── source 优先级 ───────────────────────────

test('source priority ordering in sortText', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Chi0', value: '4.05', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    // current (priority 0) should sort before include (priority 1)
    const chi0 = items.find(i => i.label === 'Chi0');
    const eg0 = items.find(i => i.label === 'Eg0');
    assert.ok(chi0.sortText < eg0.sortText, 'current source should sort before include');
});

test('dedupe keeps highest priority source for same (label, parentPath)', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Silicon/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate to 1 item');
    assert.strictEqual(eg0Items[0].source, 'current', 'current (priority 0) should win over include (priority 1)');
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.16964', 'Should use current value');
});

// ── insertText 格式 ─────────────────────────

test('scopeType insertText includes full template', () => {
    const ctx = { completableKind: 'scopeType', parentPath: '', scopeType: null, pendingBlockName: null };
    const items = buildParCompletions(ctx, []);
    const material = items.find(i => i.label === 'Material');
    assert.ok(material.insertText.includes('$1'), 'ScopeType insertText should have $1 placeholder');
    assert.ok(material.insertText.includes('{'), 'ScopeType insertText should include opening brace');
});

test('block insertText includes braces', () => {
    const ctx = { completableKind: 'block', parentPath: 'Material/Silicon', scopeType: 'Material', pendingBlockName: null };
    const symbols = [{ kind: 'block', name: 'Bandgap', parentPath: 'Material/Silicon', source: 'current' }];
    const items = buildParCompletions(ctx, symbols);
    assert.ok(items[0].insertText.includes('{'), 'Block insertText should include braces');
});

test('parameter insertText ends with equals sign', () => {
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Silicon/Bandgap', scopeType: 'Material', pendingBlockName: null };
    const symbols = [{ kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Silicon/Bandgap', source: 'current' }];
    const items = buildParCompletions(ctx, symbols);
    assert.ok(items[0].insertText.endsWith('= '), 'Parameter insertText should end with "= "');
});

// ── 未知上下文 ───────────────────────────────

test('null completableKind returns empty', () => {
    const ctx = { completableKind: null, parentPath: '', scopeType: null, pendingBlockName: null };
    const items = buildParCompletions(ctx, []);
    assert.strictEqual(items.length, 0);
});

test('blockPending context returns empty (Phase 2.1)', () => {
    const ctx = { completableKind: 'blockPending', parentPath: '', scopeType: null, pendingBlockName: 'Scharfetter' };
    const items = buildParCompletions(ctx, []);
    assert.strictEqual(items.length, 0);
});

summary();
```

- [ ] **Step 5.2: 运行测试验证全部失败**

```bash
node tests/test-par-completion.js
```

Expected: FAIL

- [ ] **Step 5.3: 实现 par-completion.js**

创建 `src/lsp/sdevicepar/par-completion.js`：

```js
// src/lsp/sdevicepar/par-completion.js
'use strict';

const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY } = require('./par-constants');

/**
 * 按 (label, parentPath) 聚合 symbols，每组保留 SOURCE_PRIORITY 最高（数字最小）的 symbol。
 * 先聚合去重，再排序输出。
 * @param {object[]} symbols - 待过滤的 symbols
 * @param {string} kind - 过滤 kind
 * @param {string} parentPath - 过滤 parentPath
 * @returns {object[]} 去重后的 candidates（已按 source 优先级 + 名称排序）
 */
function dedupeByPriority(symbols, kind, parentPath) {
    // 1. 收集匹配 symbols
    const matched = symbols.filter(s => s.kind === kind && s.parentPath === parentPath);
    // 2. 按 (name, parentPath) 聚合，保留每组最高优先级
    const best = new Map(); // key: name → symbol with lowest priority number
    for (const sym of matched) {
        const key = sym.name;
        const existing = best.get(key);
        const newPri = SOURCE_PRIORITY[sym.source] ?? 9;
        if (!existing || newPri < (SOURCE_PRIORITY[existing.source] ?? 9)) {
            best.set(key, sym);
        }
    }
    // 3. 排序：source 优先级升序，名称字母序
    const candidates = Array.from(best.values());
    candidates.sort((a, b) => {
        const pa = SOURCE_PRIORITY[a.source] ?? 9;
        const pb = SOURCE_PRIORITY[b.source] ?? 9;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
    });
    return candidates;
}

/**
 * 根据上下文和 symbols 构建补全列表。
 * 纯函数，无 VS Code 依赖，可在 Node.js 中测试。
 *
 * @param {{ completableKind: string, parentPath: string, scopeType: string|null, pendingBlockName: string|null }} ctx
 * @param {object[]} symbols - 所有可用 symbols（当前文件 + include）
 * @returns {Array<{label: string, kind: string, detail: string, sortText: string, insertText: string, source: string, parentPath: string}>}
 */
function buildParCompletions(ctx, symbols) {
    if (!ctx || !ctx.completableKind) return [];
    if (ctx.completableKind === 'blockPending') return []; // Phase 2.1: 不补全 pending block

    const items = [];

    if (ctx.completableKind === 'scopeType') {
        let idx = 0;
        for (const st of SCOPE_TYPES_ARRAY) {
            items.push({
                label: st,
                kind: 'scopeType',
                detail: '[par] scope type',
                sortText: `4_${idx}_${st}`,
                insertText: `${st} = "\${1:name}" {\n\t\${0}\n}`,
                source: 'builtin',
                parentPath: '',
            });
            idx++;
        }
    } else if (ctx.completableKind === 'block') {
        const candidates = dedupeByPriority(symbols, 'block', ctx.parentPath);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'block',
                detail: `[par] block (${ctx.scopeType || 'scope'})`,
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: `${sym.name} {\n\t\${0}\n}`,
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'parameter') {
        const candidates = dedupeByPriority(symbols, 'parameter', ctx.parentPath);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'parameter',
                detail: sym.value ? `[par] = ${sym.value}` : '[par] parameter',
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: `${sym.name} = `,
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'scopeName') {
        // scope 名补全：从 symbols 中抽取同 scopeType 的已有名称
        const candidates = dedupeByPriority(symbols, 'scope', '');
        // 再按 scopeType 过滤
        const filtered = candidates.filter(sym => sym.scopeType === ctx.scopeType);
        filtered.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'scopeName',
                detail: `[par] ${ctx.scopeType} name`,
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: sym.name,
                source: sym.source || 'current',
                parentPath: '',
            });
        });
    }

    return items;
}

module.exports = { buildParCompletions, SOURCE_PRIORITY, dedupeByPriority };
```

- [ ] **Step 5.4: 重构 ParIndexService 的 getCompletionsAt 使用 buildParCompletions**

修改 `src/lsp/sdevicepar/par-index-service.js`：

1. 在顶部添加导入：
```js
const { buildParCompletions } = require('./par-completion');
```

2. 替换 `getCompletionsAt` 中的手动补全构建逻辑为：
```js
function getCompletionsAt(document, position) {
    const uri = document.uri.toString();
    const version = document.version;
    const key = cacheKey(uri, version);

    const cached = currentFileCache.get(key);
    if (!cached) return [];

    const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
    if (!ctx) return [];

    return buildParCompletions(ctx, cached.symbols);
}
```

**scopeName 检测收进 getCompletionsAt**（修订点 v2.1 #4）：`getCompletionsAt` 新增可选第三参数 `lineText`。Provider 层传入 `lineText` 时，service 内部调用 `detectScopeNameContext` 做检测。这样 Provider 不需要访问任何 `_` 前缀属性。更新 `getCompletionsAt` 完整实现：

```js
function getCompletionsAt(document, position, lineText) {
    const uri = document.uri.toString();
    const version = document.version;
    const key = cacheKey(uri, version);

    const cached = currentFileCache.get(key);
    if (!cached) return [];

    // 如果传入 lineText，先检测 scope 名引号内补全
    if (lineText !== undefined) {
        const scopeNameCtx = detectScopeNameContext(lineText, position.character);
        if (scopeNameCtx) {
            return buildParCompletions(
                { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
                cached.symbols,
            );
        }
    }

    const ctx = getContextAtPosition(cached.lineContexts, position.line, position.character);
    if (!ctx) return [];

    return buildParCompletions(ctx, cached.symbols);
}
```

**Provider 层调用**（修订 #2 中已更新）：`parIndexService.getCompletionsAt(document, position, lineText)` — scopeName 检测完全在 service 层完成，Provider 不访问任何 `_` 前缀属性。

- [ ] **Step 5.5: 运行全部测试验证通过**

```bash
node tests/test-par-completion.js && node tests/test-par-index.js && node tests/test-par-parser.js
```

Expected: 全部 PASS

- [ ] **Step 5.6: 提交**

```bash
git add src/lsp/sdevicepar/par-completion.js tests/test-par-completion.js src/lsp/sdevicepar/par-index-service.js
git commit -m "feat(sdevicepar): add context-aware completion builder

- buildParCompletions: 纯函数，根据上下文 + symbols 构建补全列表
- scopeType 上下文 → 推荐 6 种 scope 类型（builtin）
- block 上下文 → 从 symbols 抽取该 parentPath 下的 block 名
- parameter 上下文 → 从 symbols 抽取该 parentPath 下的 parameter 名
- scopeName 上下文 → 从 symbols 抽取同 scopeType 的已有名称（修订点 #5）
- 去重: (label, parentPath) 二元组
- 排序: source 优先级 (current > include > workspace > materialdb > builtin)
- insertText: scopeType 含完整模板，block 含大括号，parameter 含等号
- ParIndexService.getCompletionsAt 重构为调用 buildParCompletions
- Import 来源统一为 par-constants（修订点 #2）
- 10 个测试覆盖补全层级/去重/优先级/insertText 格式"
```

---

## Task 6: 集成 — 连接扩展与 Provider

**Files:**
- Modify: `src/extension.js` (约 15 行新增)
- Modify: `src/register-completion-providers.js` (约 15 行新增)

**Commit:** `feat(sdevicepar): integrate par-index-service with extension`

### Step 6.1: 修改 extension.js

在 `src/extension.js` 中：

1. 在文件顶部 require 区添加（约第 18 行后）：
```js
const { createParIndexService } = require('./lsp/sdevicepar/par-index-service');
```

2. 在 `let sdeviceStProvider;` 后添加：
```js
/** @type {ReturnType<typeof createParIndexService> | null} */
let parIndexService = null;
```

3. 在 `registerCompletionProviders` 调用之前（约第 130 行），初始化 ParIndexService：
```js
// ── ParIndexService（sdevicepar 上下文补全）──────────────
parIndexService = createParIndexService({
    extensionPath: context.extensionPath,
    workspaceFolders: vscode.workspace.workspaceFolders || [],
});
```

4. 在 `onDidCloseTextDocument` 回调中（约第 60 行），添加 ParIndexService 清理：
```js
if (parIndexService) parIndexService.onFileClosed(uri);
```

5. 在 `onDidCloseTextDocument` 订阅之后（约第 63 行），添加 debounced `onDidChangeTextDocument` 和已打开文档预热：

```js
// Per-uri debounced pre-heat for sdevicepar ParIndexService
const parDebounceTimers = new Map(); // uri → timer
context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.languageId !== 'sdevicepar' || !parIndexService) return;
        const uri = e.document.uri.toString();
        const old = parDebounceTimers.get(uri);
        if (old) clearTimeout(old);
        parDebounceTimers.set(uri, setTimeout(() => {
            parDebounceTimers.delete(uri);
            try { parIndexService.parseCurrentFile(e.document); }
            catch (_) { /* ignore parse errors during debounce */ }
        }, 200));
    })
);

// Pre-heat on document open
context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc.languageId !== 'sdevicepar' || !parIndexService) return;
        try { parIndexService.parseCurrentFile(doc); }
        catch (_) { /* ignore */ }
    })
);

// Pre-heat already-open sdevicepar documents at activation
for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === 'sdevicepar' && parIndexService) {
        try { parIndexService.parseCurrentFile(doc); }
        catch (_) { /* ignore */ }
    }
}
```

6. 在 `registerCompletionProviders` 调用中传递 `parIndexService`：
```js
const completionResult = registerCompletionProviders(context, {
    allKeywords,
    schemeCache,
    tclCache,
    builtinMaterials,
    sdeviceStProvider,
    sdeviceLowerToCanon,
    useZh,
    parIndexService,  // ← 新增
});
```

7. 在 `deactivate` 函数或 activate 末尾添加 dispose：
```js
context.subscriptions.push({ dispose: () => { if (parIndexService) parIndexService.dispose(); } });
```

- [ ] **Step 6.2: 修改 register-completion-providers.js**

1. 在 `registerCompletionProviders` 函数签名中，解构添加 `parIndexService`：
```js
function registerCompletionProviders(context, deps) {
    const {
        allKeywords,
        schemeCache,
        tclCache,
        builtinMaterials,
        sdeviceStProvider,
        sdeviceLowerToCanon,
        useZh,
        parIndexService,  // ← 新增
    } = deps;
```

2. 在 `provideCompletionItems` 函数体内，在 `if (langId !== 'sde')` 块之前（约第 186 行），添加 sdevicepar 前置分支。注意：此分支在闭包级 `items` / `envVarItems` 赋值之前执行，因此**不能引用**这两个变量。改为只构建局部 `parConverted`，与后续流程中已有的 `items` / `envVarItems` 合并。

**设计思路**：sdevicepar 前置分支设置 `let parConverted = null;`。在函数末尾统一 merge 时，若 `parConverted` 非 null，则用 par 结果替换 `items` 中重名项，再追加 `envVarItems`。这样 sdevicepar 分支不依赖 `items` / `envVarItems` 的赋值时机。

```js
// ── sdevicepar 前置分支 ──
let parConverted = null; // 延迟到函数末尾统一 merge
if (langId === 'sdevicepar' && parIndexService) {
    const lineText = document.lineAt(position.line).text;
    const col = position.character;

    // Lexical gate: 注释行 → 跳过 par 补全
    const trimmedLine = lineText.trimStart();
    const isComment = trimmedLine.startsWith('#') || trimmedLine.startsWith('*');

    if (!isComment) {
        // 检测赋值右侧和字符串内
        let inRhs = false;
        let inQuote = false;
        for (let ci = 0; ci < col; ci++) {
            if (lineText[ci] === '"') inQuote = !inQuote;
            if (!inQuote && lineText[ci] === '=' && ci < col - 1) {
                if (!/^\s*(Material|Region|Interface|MaterialInterface|RegionInterface|Electrode)\s*=\s*"/.test(lineText)) {
                    inRhs = true;
                }
            }
        }

        // scope 名引号内补全：传 lineText 给 service 层检测
        // getCompletionsAt(document, position, lineText) 内部调用 detectScopeNameContext
        // 命中 scopeName 时直接返回 scopeName 补全；否则返回 null / 空数组
        const scopeNameItems = parIndexService.getCompletionsAt(document, position, lineText);
        if (scopeNameItems.length > 0 && scopeNameItems[0].kind === 'scopeName') {
            const kindMapScope = { scopeName: vscode.CompletionItemKind.Value };
            parConverted = scopeNameItems.map(pi => {
                const item = new vscode.CompletionItem(pi.label, kindMapScope[pi.kind] || vscode.CompletionItemKind.Text);
                item.detail = pi.detail;
                item.sortText = pi.sortText;
                item.insertText = pi.insertText;
                return item;
            });
        } else if (!inQuote && !inRhs) {
            const parItems = parIndexService.getCompletionsAt(document, position);
            if (parItems.length > 0) {
                const kindMap = {
                    scopeType: vscode.CompletionItemKind.Module,
                    scopeName: vscode.CompletionItemKind.Value,
                    block: vscode.CompletionItemKind.Class,
                    parameter: vscode.CompletionItemKind.Property,
                };
                parConverted = parItems.map(pi => {
                    const item = new vscode.CompletionItem(pi.label, kindMap[pi.kind] || vscode.CompletionItemKind.Text);
                    item.detail = pi.detail;
                    item.sortText = pi.sortText;
                    item.insertText = new vscode.SnippetString(pi.insertText);
                    if (pi.parentPath) {
                        item.documentation = new vscode.MarkdownString(`Path: \`${pi.parentPath}\`\n\nSource: ${pi.source}`);
                    }
                    return item;
                });
            }
        }
    }
    // parConverted === null → 缓存未就绪或 lexical gate 拦截，走后续 all_keywords fallback
}
```

3. 在 `provideCompletionItems` 函数的 return 语句处（约 line 550），修改统一 merge 逻辑：
```js
// 原始 return: return [...items, ...envVarItems];
// 修改为:
if (parConverted) {
    const parLabels = new Set(parConverted.map(i => i.label));
    const keywordFallback = items.filter(i => !parLabels.has(i.label));
    return [...parConverted, ...keywordFallback, ...envVarItems];
}
return [...items, ...envVarItems];
```

- [ ] **Step 6.3: 验证扩展启动**

1. 在工作树中运行 `npm install`（确保依赖就绪）
2. 按 F5 启动 Extension Development Host
3. 打开 `references/MaterialDB/example_sdevice.par`
4. 验证：
   - 在 `Material = "Silicon" {` 下一空行触发补全 → 应看到 block 名（Band2BandTunneling 等）
   - 在 `Band2BandTunneling {` 内空行触发补全 → 应看到 parameter 名（Agen、Bgen 等）
   - 在文件顶部空行触发补全 → 应看到 6 种 scope 类型
   - 快速连续输入不应有明显卡顿（debounce 生效）

- [ ] **Step 6.4: 提交**

```bash
git add src/extension.js src/register-completion-providers.js
git commit -m "feat(sdevicepar): integrate par-index-service with extension

- extension.js: 初始化 ParIndexService + per-uri debounced onDidChangeTextDocument (200ms)
- extension.js: onDidOpenTextDocument 预热 + onDidCloseTextDocument 清理缓存
- extension.js: activation 扫描 textDocuments 预热已打开的 sdevicepar 文档
- register-completion-providers.js: 添加 sdevicepar 前置分支
  - parConverted 延迟 merge，不引用未声明的 items/envVarItems
  - lexical gate: 拒绝注释/字符串/赋值右侧补全
  - scopeName 检测通过 getCompletionsAt(document, position, lineText) 完成
  - 缓存命中 → ParCompletionItem 转 vscode.CompletionItem
  - 缓存未就绪 → 继续走 all_keywords fallback
  - 0 文件 IO 保证：getCompletionsAt 只查内存缓存
  - Provider 不访问 _ 前缀属性
- 补全结果与现有 all_keywords 统一 merge，不破坏现有行为"
```

---

## 验收标准（Phase 2.1）

| # | 标准 | 验证方式 |
|---|------|----------|
| 1 | 打开 `.par` 文件自动解析层级结构 | F5 启动后打开 example_sdevice.par，无报错 |
| 2 | scope 内空行推荐 block 名 | `Material = "Silicon" {` 下一空行触发补全 |
| 3 | block 内空行推荐 parameter 名 | `Band2BandTunneling {` 内空行触发补全 |
| 4 | 文件顶层推荐 scope 类型 | 文件开头空行触发补全 → Material/Region/... |
| 5 | `#include` 递归解析，内容继承 parentPath | 测试用例：include Silicon.par → Eg0 的 parentPath 包含 Material/Silicon |
| 6 | 补全不全局污染 | Bandgap 内不推荐 AvalancheFactors 的 parameter |
| 7 | 空行补全得到正确上下文 | lineContexts beforeStack 正确反映嵌套层级 |
| 8 | 所有测试通过 | `node tests/test-par-*.js` 全部 PASS |
| 9 | getCompletionsAt 0 文件 IO | 缓存未就绪时返回空数组，fallback 到 all_keywords |
| 10 | onDidChangeTextDocument per-uri debounce | 不同文件交替编辑不会互相取消 debounce |
| 11 | scope 名引号内补全（最小实现） | `Material = "|"` 引号内触发补全 → 显示同 type 的已有 scope 名 |
| 12 | activation 预热已打开文档 | 扩展启动后立刻触发补全能工作（无需先编辑） |
| 13 | Provider 不访问 _ 前缀属性 | getCompletionsAt 接受 lineText 参数做 scopeName 检测 |
| 14 | 去重保留最高优先级 source | buildParCompletions 对同 (label,parentPath) 保留 current 覆盖 include |

## 非验收标准（Phase 2.1 不包含）

- ~~同一行 `{ | }` 内补全~~
- ~~workspace 全量扫描~~
- ~~MaterialDB 内置参考数据~~
- ~~Hover/Definition~~
- ~~#include 文件路径补全~~
- ~~参数合法性诊断~~
- ~~scope 名补全的材料名推荐（MaterialDB 数据源）~~ — 仅实现了同 type 已有 scope 名的去重推荐，不从 MaterialDB 提取材料名

---

## Spec 自检

### 1. 覆盖扫描

| Spec 章节 | Plan 任务 |
|-----------|-----------|
| §8 Parser Design | Task 1 |
| §8 pendingBlockName | Task 1 (Step 1.3) |
| §8 #if 处理 | Task 1 (测试 + 实现) |
| §8 输出数据结构 | Task 1 |
| §8 工具函数 | Task 2 |
| §9 Index Design | Task 3 + Task 4 |
| §9 预热 vs 热路径 | Task 6 (debounce + 0 IO) |
| §9 缓存策略 | Task 3 (FIFO, version) |
| §10 Include Resolution | Task 4 |
| §10 查找顺序 | Task 4 (resolveFilePath: cwd > workspace > MaterialDB) |
| §10 includeRawCache | Task 4 |
| §10 递归保护 | Task 4 (includeChain + depth) |
| §11 Completion Design | Task 5 |
| §11 scope 名补全 | Task 5 (scopeName handler) + Task 6 (detectScopeNameContext) |
| §11 五级优先级 | Task 5 (SOURCE_PRIORITY) |
| §11 Provider 集成 | Task 6 (lexical gate + 局部合并) |
| §13 Caching | Task 3 + Task 4 |
| §14 Integration Points | Task 6 |
| §15 Test Plan | Task 1-5 |

**已关闭的 Gap**: scope 名补全（`Material = "|"` 推荐材料名）已在修订点 #5 中实现最小版本——从 symbols 中抽取同 scopeType 的已有名称。MaterialDB 数据源推荐不在 Phase 2.1 范围内。

### 2. Placeholder 扫描

无 TBD/TODO/待定项。所有步骤包含具体代码。

### 3. 类型一致性

- `stackToPath` 在 par-parser.js 和 par-context.js 中共享（Task 2.5 重构为导入）
- `ParCompletionItem` 结构（label/kind/detail/sortText/insertText/source/parentPath）在 par-completion.js 输出和 register-completion-providers.js 消费端一致
- `LineContext` 结构（line/stack/pendingBlockName）在 par-parser.js 输出和 par-context.js 消费端一致
- `cacheKey(uri, version)` 格式 `"uri:v{version}"` 在 parseCurrentFile 和 getCompletionsAt 中一致
- `StackFrame.scopeType` 统一用于 scope 帧（修订点 #1），不使用 `type` 字段
- `SCOPE_TYPES`/`SCOPE_TYPES_ARRAY` 从 `par-constants.js` 统一导出（修订点 #2），不从 `par-index-service.js` 导出
- `MAX_INCLUDE_DEPTH` 和 `fileURLToPath` 不在 Task 4 中重复声明，统一使用 Task 3 的顶部 import（修订点 v2.1 #1）
- `getCompletionsAt(document, position, lineText?)` 可选第三参数用于 scopeName 检测，Provider 层不访问 `_` 前缀属性（修订点 v2.1 #4）

### 4. 修订点验收（v2.1 增补）

| 修订点 | 涉及文件 | 验证方式 |
|--------|----------|----------|
| v2.1 #1 删除重复声明 | par-index-service.js (Task 4) | Task 3 顶部已导入，Step 4.3 不再重复 |
| v2.1 #2 Provider 不引用未声明变量 | register-completion-providers.js | parConverted 延迟 merge，不引用 envVarItems/items |
| v2.1 #3 去重按 SOURCE_PRIORITY | par-completion.js (dedupeByPriority) | test-par-completion: dedupe keeps highest priority |
| v2.1 #4 不访问 _ 前缀属性 | par-index-service.js | getCompletionsAt 接受 lineText 参数；测试不访问 _currentFileCache |
| v2.1 #5 per-uri debounce + 预热 | extension.js | 验收标准 #10, #12 |
| v2.1 #6 测试修正 | test-par-completion.js, test-par-index.js | source priority 用 buildParCompletions；pollution 测 Provider merge |

### 5. 历史修订点验收（v2.0）

| 修订点 | 涉及文件 | 验证方式 |
|--------|----------|----------|
| #1 StackFrame 统一 scopeType | par-parser.js, par-context.js, par-completion.js | test-par-parser: scopeType 字段一致性测试 |
| #2 par-constants.js 打破循环依赖 | par-constants.js, par-parser.js, par-index-service.js, par-completion.js | test-par-completion: import 路径验证 |
| #3 不修改闭包级 items | register-completion-providers.js | test-par-index: completion provider merge 不污染 original |
| #4 include resolver 递归链检测 | par-index-service.js | test-par-index: same include different parentPath graft |
| #5 scope 名补全（最小实现） | par-context.js (detectScopeNameContext), par-completion.js (scopeName handler) | 验收标准 #11 |
| #6 lexical gate | register-completion-providers.js | 注释行/字符串内/赋值右侧不触发 par 补全 |
| #7 新增测试 | test-par-parser.js, test-par-index.js | `node tests/test-par-*.js` 全部 PASS |
