# Sdevice Section 上下文感知着色与悬停 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 sdevice 关键词在不同 section 上下文中显示不同颜色和不同悬停文档。

**Architecture:** 新建 `sdevice-semantic-provider.js`，通过文本扫描追踪 `{}` 嵌套栈确定 section 上下文，输出 Semantic Tokens。修改 `extension.js` 的 HoverProvider 增加 sdevice 上下文感知分支。TextMate 语法不变。

**Tech Stack:** 纯 JavaScript (CommonJS)，VSCode Semantic Tokens API，无外部依赖。

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lsp/providers/sdevice-semantic-provider.js` | Section 栈追踪 + Semantic Tokens 生成 + 关键词索引 |
| Create | `tests/test-sdevice-semantic.js` | 测试套件 |
| Modify | `src/extension.js` | 注册 Semantic Tokens Provider + HoverProvider sdevice 分支 |

---

### Task 1: 关键词索引与 section 栈追踪核心

**Files:**
- Create: `src/lsp/providers/sdevice-semantic-provider.js`
- Create: `tests/test-sdevice-semantic.js`

- [ ] **Step 1: 写 `buildKeywordSectionIndex` 的失败测试**

```js
// tests/test-sdevice-semantic.js
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// 加载测试数据
const docsPath = path.join(__dirname, '..', 'syntaxes', 'sdevice_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 先测试纯函数，跳过需要 VSCode API 的 createSdeviceSemanticProvider
const { buildKeywordSectionIndex, getSectionStack } = require('../src/lsp/providers/sdevice-semantic-provider');

console.log('\nsdevice-semantic — buildKeywordSectionIndex:');

test('Plot 出现在多个 section 中', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.has('Plot'));
    const sections = index.get('Plot');
    assert.ok(sections.has('File'), 'Plot should belong to File');
    assert.ok(sections.has('Plot'), 'Plot should belong to Plot');
    assert.ok(sections.has('Solve'), 'Plot should belong to Solve');
});

test('ElectricField 出现在 Physics 和 Plot 中', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.has('ElectricField'));
    const sections = index.get('ElectricField');
    assert.ok(sections.has('Physics'));
    assert.ok(sections.has('Plot'));
});

test('不存在的关键词返回 undefined', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.strictEqual(index.get('NonExistentKeyword12345'), undefined);
});

test('索引包含大量关键词', () => {
    const index = buildKeywordSectionIndex(docs);
    assert.ok(index.size > 300, `Expected >300 keywords, got ${index.size}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-sdevice-semantic.js`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `buildKeywordSectionIndex`**

```js
// src/lsp/providers/sdevice-semantic-provider.js
'use strict';

const TOKEN_TYPES = ['sectionName', 'sectionKeyword'];
const TOKEN_MODIFIERS = [];

/**
 * 从 sdevice_command_docs.json 构建关键词→所属 section 集合的索引。
 * 收集每个文档条目的 section、parameters[].name 和 keywords[]。
 * @param {Object} docs - sdevice_command_docs.json 解析结果
 * @returns {Map<string, Set<string>>} keyword → Set<section>
 */
function buildKeywordSectionIndex(docs) {
    const index = new Map();

    function add(kw, section) {
        if (!index.has(kw)) index.set(kw, new Set());
        index.get(kw).add(section);
    }

    for (const [kw, v] of Object.entries(docs)) {
        const section = v.section;
        // 关键词本身属于该 section
        add(kw, section);
        // parameters 中的参数名也加入
        if (Array.isArray(v.parameters)) {
            for (const p of v.parameters) {
                const name = typeof p === 'object' ? p.name : p;
                if (name) add(name, section);
            }
        }
        // keywords 列表
        if (Array.isArray(v.keywords)) {
            for (const k of v.keywords) {
                if (typeof k === 'string') add(k, section);
            }
        }
    }
    return index;
}

module.exports = {
    buildKeywordSectionIndex,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-sdevice-semantic.js`
Expected: 4 passed, 0 failed

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/sdevice-semantic-provider.js tests/test-sdevice-semantic.js
git commit -m "feat(sdevice): 关键词索引构建与测试

新增 sdevice-semantic-provider.js，实现 buildKeywordSectionIndex
从 sdevice_command_docs.json 构建关键词→所属 section 集合的索引。
新增测试验证 Plot/ElectricField 等跨 section 关键词的索引正确性。"
```

---

### Task 2: Section 栈追踪

**Files:**
- Modify: `src/lsp/providers/sdevice-semantic-provider.js`
- Modify: `tests/test-sdevice-semantic.js`

- [ ] **Step 1: 写 `getSectionStack` 的失败测试**

在 `tests/test-sdevice-semantic.js` 末尾（`console.log` 之前）追加：

```js
console.log('\nsdevice-semantic — getSectionStack:');

test('空文档返回空栈', () => {
    const stack = getSectionStack('', 0, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('顶层无 section 返回空栈', () => {
    const text = 'set x 1\nset y 2';
    const stack = getSectionStack(text, 0, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('File section 内部返回 [File]', () => {
    const text = 'File {\n  Plot="x"\n}';
    // 第 1 行（Plot="x"）
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File', 'Solve']));
    assert.deepStrictEqual(stack, ['File']);
});

test('嵌套 section 返回多层栈', () => {
    const text = 'Solve {\n  Coupled {\n    Plot\n  }\n}';
    // 第 2 行（Plot）
    const stack = getSectionStack(text, 2, new Set(['Plot', 'File', 'Solve', 'Coupled']));
    assert.deepStrictEqual(stack, ['Solve', 'Coupled']);
});

test('花括号外返回空栈', () => {
    const text = 'File {\n  Plot="x"\n}\nPlot {';
    // 第 3 行（}）之后
    const stack = getSectionStack(text, 3, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, []);
});

test('字符串内花括号不追踪', () => {
    const text = 'File {\n  Plot="a{b}c"\n}';
    // 第 1 行，花括号在字符串内
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});

test('注释行花括号不追踪', () => {
    const text = 'File {\n  # Plot {\n  Plot="x"\n}';
    const stack = getSectionStack(text, 1, new Set(['Plot', 'File']));
    assert.deepStrictEqual(stack, ['File']);
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-sdevice-semantic.js`
Expected: FAIL — getSectionStack is not a function

- [ ] **Step 3: 实现 `getSectionStack`**

在 `sdevice-semantic-provider.js` 中添加（在 `buildKeywordSectionIndex` 之后）：

```js
/**
 * 计算文档中指定行号的 section 上下文栈。
 * 通过文本扫描追踪 {} 嵌套，跳过注释和字符串。
 * @param {string} text - 文档全文
 * @param {number} targetLine - 0-based 目标行号
 * @param {Set<string>} sectionKeywords - section 名关键词集合
 * @returns {string[]} section 栈（从外到内）
 */
function getSectionStack(text, targetLine, sectionKeywords) {
    const stack = []; // [{ name, depth }]
    let depth = 0;
    let i = 0;
    let line = 0;

    while (i < text.length && line <= targetLine) {
        const ch = text[i];

        // 换行
        if (ch === '\n') { line++; i++; continue; }

        // 跳过注释：# 开头到行末
        if (ch === '#') {
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        }

        // 跳过字符串
        if (ch === '"') {
            i++;
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\') i++;
                i++;
            }
            i++; // 跳过结束引号
            continue;
        }

        // 检测 section keyword 后跟 {
        if (ch === '{') {
            // 回溯找前面的标识符
            let j = i - 1;
            while (j >= 0 && text[j] === ' ') j--;
            let end = j + 1;
            while (j >= 0 && /[\w]/.test(text[j])) j--;
            const ident = text.slice(j + 1, end);
            if (sectionKeywords.has(ident)) {
                stack.push({ name: ident, depth });
            }
            depth++;
            i++;
            continue;
        }

        if (ch === '}') {
            depth--;
            // 弹出深度匹配的 section
            while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                stack.pop();
            }
            i++;
            continue;
        }

        i++;
    }

    return stack.map(s => s.name);
}
```

更新 exports：

```js
module.exports = {
    buildKeywordSectionIndex,
    getSectionStack,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-sdevice-semantic.js`
Expected: 11 passed, 0 failed

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/sdevice-semantic-provider.js tests/test-sdevice-semantic.js
git commit -m "feat(sdevice): section 栈追踪实现

实现 getSectionStack 函数，通过文本扫描追踪 {} 嵌套栈，
跳过注释和字符串内的花括号。
新增测试覆盖空文档、单层/嵌套 section、字符串内花括号等场景。"
```

---

### Task 3: Semantic Tokens 提取

**Files:**
- Modify: `src/lsp/providers/sdevice-semantic-provider.js`
- Modify: `tests/test-sdevice-semantic.js`

- [ ] **Step 1: 写 `extractSdeviceTokens` 的失败测试**

在 `tests/test-sdevice-semantic.js` 末尾（最终 `console.log` 之前）追加：

```js
const { extractSdeviceTokens } = require('../src/lsp/providers/sdevice-semantic-provider');

console.log('\nsdevice-semantic — extractSdeviceTokens:');

test('File section 中 Plot 着色为 sectionKeyword', () => {
    const text = 'File {\n  Plot="x"\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve', 'Coupled']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    // 应该有 File sectionName + Plot sectionKeyword
    // delta 编码: [deltaLine, deltaCol, length, typeIdx, modifierIdx]
    assert.ok(data.length > 0, 'Should produce tokens');

    // 找 File 的 token（第 0 行）— 应该是 sectionName (type 0)
    // 找 Plot 的 token（第 1 行）— 应该是 sectionKeyword (type 1)
    let foundFileToken = false, foundPlotToken = false;
    let curLine = 0, curCol = 0;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'File') {
            assert.strictEqual(typeIdx, 0, 'File should be sectionName (type 0)');
            foundFileToken = true;
        }
        if (word === 'Plot' && curLine === 1) {
            assert.strictEqual(typeIdx, 1, 'Plot inside File should be sectionKeyword (type 1)');
            foundPlotToken = true;
        }
    }
    assert.ok(foundFileToken, 'Should find File token');
    assert.ok(foundPlotToken, 'Should find Plot token inside File');
});

test('顶层 Plot section 中 Plot 着色为 sectionName', () => {
    const text = 'Plot {\n  ElectricField\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    let curLine = 0, curCol = 0;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'Plot' && curLine === 0) {
            assert.strictEqual(typeIdx, 0, 'Top-level Plot should be sectionName (type 0)');
        }
    }
});

test('嵌套 Solve>Coupled 中 Plot 正确着色', () => {
    const text = 'Solve {\n  Coupled {\n    Plot\n  }\n}';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot', 'Solve', 'Coupled']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    // Plot 在 Coupled 内部，Coupled 属于 Solve
    // Plot 是 Coupled 的 sectionKeyword
    let curLine = 0, curCol = 0;
    let foundPlotToken = false;
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i+1] : data[i+1];
        const len = data[i+2];
        const typeIdx = data[i+3];
        const word = text.split('\n')[curLine].slice(curCol, curCol + len);
        if (word === 'Plot' && curLine === 2) {
            assert.strictEqual(typeIdx, 1, 'Plot inside Coupled should be sectionKeyword');
            foundPlotToken = true;
        }
    }
    assert.ok(foundPlotToken, 'Should find Plot token inside Coupled');
});

test('不在任何 section 中的普通词不产生 token', () => {
    const text = 'set x 1\nset y 2';
    const index = buildKeywordSectionIndex(docs);
    const sectionKws = new Set(['File', 'Plot']);
    const data = extractSdeviceTokens(text, index, sectionKws);
    assert.strictEqual(data.length, 0, 'No tokens for non-keyword text');
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-sdevice-semantic.js`
Expected: FAIL — extractSdeviceTokens is not a function

- [ ] **Step 3: 实现 `extractSdeviceTokens`**

在 `sdevice-semantic-provider.js` 中添加：

```js
/**
 * 从文本中提取 sdevice 语义 token。
 * @param {string} text - 文档全文
 * @param {Map<string, Set<string>>} keywordIndex - keyword→Set<section>
 * @param {Set<string>} sectionKeywords - section 名关键词集合
 * @returns {number[]} delta 编码的 semantic token 数组
 */
function extractSdeviceTokens(text, keywordIndex, sectionKeywords) {
    const tokens = [];
    const lines = text.split('\n');
    // 计算每行起始偏移
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') lineStarts.push(i + 1);
    }

    // 先扫描全文构建每行的 section 栈
    const stacksPerLine = scanStacksPerLine(text, sectionKeywords);

    // 提取每行中的标识符并匹配
    const identRe = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lineStarts[lineIdx];
        const lineText = lines[lineIdx];
        const stack = stacksPerLine[lineIdx] || [];

        // 跳过注释行
        const trimmed = lineText.trimStart();
        if (trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

        let m;
        identRe.lastIndex = 0;
        while ((m = identRe.exec(lineText)) !== null) {
            const word = m[1];
            if (!keywordIndex.has(word)) continue;

            const col = m.index;
            const absOffset = line + col;

            if (stack.length === 0) {
                // 不在任何 section 内
                if (sectionKeywords.has(word)) {
                    // 检查后面是否紧跟 { (section 定义)
                    const after = lineText.slice(col + word.length).trimStart();
                    if (after.startsWith('{')) {
                        tokens.push({ line: lineIdx, col, len: word.length, type: 0 });
                    }
                }
            } else {
                // 在 section 内部，检查 word 是否属于栈中任一层级
                const wordSections = keywordIndex.get(word);
                let matched = false;
                for (let si = stack.length - 1; si >= 0; si--) {
                    if (wordSections.has(stack[si])) {
                        matched = true;
                        break;
                    }
                }
                if (matched) {
                    tokens.push({ line: lineIdx, col, len: word.length, type: 1 });
                }
                // 不匹配 → 不输出 token，让 TextMate 兜底
            }
        }
    }

    return encodeDelta(tokens);
}

/**
 * 扫描全文，返回每行的 section 栈快照。
 */
function scanStacksPerLine(text, sectionKeywords) {
    const lines = text.split('\n');
    const result = new Array(lines.length);
    const stack = [];
    let depth = 0;
    let lineIdx = 0;
    let i = 0;

    // 记录当前行的栈快照
    function snapshot() {
        while (lineIdx < result.length && result[lineIdx] === undefined) {
            result[lineIdx] = stack.map(s => s.name);
            lineIdx++;
        }
    }

    while (i < text.length) {
        const ch = text[i];

        if (ch === '\n') {
            snapshot();
            lineIdx++;
            i++;
            continue;
        }

        if (ch === '#') {
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        }

        if (ch === '"') {
            i++;
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\') i++;
                i++;
            }
            i++;
            continue;
        }

        if (ch === '{') {
            // 回溯找前面的标识符
            let j = i - 1;
            while (j >= 0 && text[j] === ' ') j--;
            let end = j + 1;
            while (j >= 0 && /[\w]/.test(text[j])) j--;
            const ident = text.slice(j + 1, end);
            if (sectionKeywords.has(ident)) {
                stack.push({ name: ident, depth });
            }
            depth++;
            i++;
            continue;
        }

        if (ch === '}') {
            depth--;
            while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                stack.pop();
            }
            i++;
            continue;
        }

        i++;
    }
    // 最后一个快照
    snapshot();

    return result;
}

function encodeDelta(tokens) {
    const result = [];
    let prevLine = 0, prevCol = 0;
    for (const t of tokens) {
        const deltaLine = t.line - prevLine;
        const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
        result.push(deltaLine, deltaCol, t.len, t.type, 0);
        prevLine = t.line;
        prevCol = t.col;
    }
    return result;
}
```

更新 exports：

```js
module.exports = {
    buildKeywordSectionIndex,
    getSectionStack,
    extractSdeviceTokens,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-sdevice-semantic.js`
Expected: 15 passed, 0 failed

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/sdevice-semantic-provider.js tests/test-sdevice-semantic.js
git commit -m "feat(sdevice): Semantic Tokens 提取实现

实现 extractSdeviceTokens 函数，根据 section 嵌套栈上下文
为关键词分配 sectionName 或 sectionKeyword token 类型。
实现 scanStacksPerLine 全文扫描构建每行栈快照。
新增测试覆盖 File 内 Plot、顶层 Plot、嵌套 Solve>Coupled 等场景。"
```

---

### Task 4: 创建 Provider 并注册

**Files:**
- Modify: `src/lsp/providers/sdevice-semantic-provider.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 在 `sdevice-semantic-provider.js` 中添加 `createSdeviceSemanticProvider`**

在 exports 之前添加：

```js
/**
 * 创建 sdevice Semantic Tokens Provider。
 * @param {Object} docs - sdevice_command_docs.json 数据
 * @param {Set<string>} sectionKeywords - section 名关键词集合
 */
function createSdeviceSemanticProvider(docs, sectionKeywords) {
    const keywordIndex = buildKeywordSectionIndex(docs);

    return {
        provideDocumentSemanticTokens(document) {
            const text = document.getText();
            const data = extractSdeviceTokens(text, keywordIndex, sectionKeywords);
            return { data };
        },
    };
}
```

更新 exports 加入 `createSdeviceSemanticProvider`。

- [ ] **Step 2: 在 `extension.js` 中注册 Provider**

在 `extension.js` 顶部 require 区添加：

```js
const sdeviceSemanticMod = require('./lsp/providers/sdevice-semantic-provider');
const { isSectionCommand } = require('./lsp/tcl-symbol-configs');
```

在现有的 SDE Semantic Tokens 注册（约第 458 行 `);` 之后）添加：

```js
    // Semantic Tokens (sdevice) — section 上下文感知着色
    const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', false) || {};
    const sdeviceSectionKws = new Set([
        'File', 'Device', 'Electrode', 'Physics', 'Math', 'Plot',
        'Solve', 'System', 'Thermode', 'CurrentPlot', 'GainPlot',
        'FarFieldPlot', 'VCSELNearFieldPlot', 'NoisePlot',
        'hSHEDistributionPlot', 'eSHEDistributionPlot',
        'BandstructurePlot', 'TensorPlot',
        'Coupled', 'Transient', 'QuasiStationary', 'CoupledPrevious',
    ]);
    const sdeviceLegend = new vscode.SemanticTokensLegend(
        sdeviceSemanticMod.TOKEN_TYPES,
        sdeviceSemanticMod.TOKEN_MODIFIERS
    );
    const sdeviceStProvider = sdeviceSemanticMod.createSdeviceSemanticProvider(
        sdeviceDocs, sdeviceSectionKws
    );
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'sdevice' },
            sdeviceStProvider,
            sdeviceLegend
        )
    );
```

- [ ] **Step 3: 运行全部已有测试验证无回归**

Run: `node tests/test-sdevice-semantic.js && node tests/test-semantic-tokens.js`
Expected: 全部 passed

- [ ] **Step 4: 手动验证（Extension Development Host）**

按 F5 启动扩展开发宿主，打开一个 sdevice `_des.cmd` 文件，检查：
- `File { Plot= }` 中的 Plot 着色与顶层 `Plot { }` 不同
- 不同 section 内的关键词颜色有区分

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/sdevice-semantic-provider.js src/extension.js
git commit -m "feat(sdevice): 注册 Semantic Tokens Provider

在 extension.js 中注册 sdevice Semantic Tokens Provider，
使用独立 legend（sectionName/sectionKeyword）。
扩展 section keyword 集合包含 Coupled/Transient 等嵌套块。"
```

---

### Task 5: 上下文感知悬停文档

**Files:**
- Modify: `src/extension.js`（HoverProvider 部分）

- [ ] **Step 1: 修改 HoverProvider 增加 sdevice 上下文感知分支**

在 `extension.js` 的 HoverProvider `provideHover` 方法中，替换现有的 docs 查找逻辑（第 565-568 行附近）。

将原来的：
```js
                    // 1. 查函数文档（优先，仅限当前语言的文档）
                    const docs = getDocs(langId) || {};
                    const doc = docs[word] || docs[decodeHtml(word)];
                    if (doc) return new vscode.Hover(formatDoc(doc, langId), range);
```

替换为：
```js
                    // 1. 查函数文档（优先，仅限当前语言的文档）
                    const docs = getDocs(langId) || {};

                    // sdevice: 上下文感知文档查找
                    if (langId === 'sdevice') {
                        const sdeviceSectionKws = new Set([
                            'File', 'Device', 'Electrode', 'Physics', 'Math', 'Plot',
                            'Solve', 'System', 'Thermode', 'CurrentPlot', 'GainPlot',
                            'FarFieldPlot', 'VCSELNearFieldPlot', 'NoisePlot',
                            'hSHEDistributionPlot', 'eSHEDistributionPlot',
                            'BandstructurePlot', 'TensorPlot',
                            'Coupled', 'Transient', 'QuasiStationary', 'CoupledPrevious',
                        ]);
                        const stack = sdeviceSemanticMod.getSectionStack(
                            document.getText(), position.line, sdeviceSectionKws
                        );
                        if (stack.length > 0) {
                            // 从栈顶向下查找
                            for (let si = stack.length - 1; si >= 0; si--) {
                                const secName = stack[si];
                                const secDoc = docs[secName];
                                if (!secDoc) continue;
                                // 查 parameters
                                if (Array.isArray(secDoc.parameters)) {
                                    const param = secDoc.parameters.find(p =>
                                        (typeof p === 'object' ? p.name : p) === word
                                    );
                                    if (param && typeof param === 'object') {
                                        const md = new vscode.MarkdownString();
                                        md.appendMarkdown(`**${word}** (${secName} 参数)\n\n`);
                                        md.appendCodeblock(`${word} = <${param.type}>`, langId);
                                        md.appendMarkdown(`\n${param.desc}`);
                                        return new vscode.Hover(md, range);
                                    }
                                }
                                // 查 keywords
                                if (Array.isArray(secDoc.keywords) && secDoc.keywords.includes(word)) {
                                    // keywords 列表中有匹配 → 用关键词自身的文档
                                    const kwDoc = docs[word];
                                    if (kwDoc) {
                                        return new vscode.Hover(formatDoc(kwDoc, langId), range);
                                    }
                                }
                            }
                        }
                    }

                    const doc = docs[word] || docs[decodeHtml(word)];
                    if (doc) return new vscode.Hover(formatDoc(doc, langId), range);
```

- [ ] **Step 2: 手动验证悬停效果**

在 Extension Development Host 中，打开 sdevice 文件，分别测试：
- `File { Plot="x" }` 中悬停 Plot → 应显示 File 参数文档（`Plot = <string> ...`）
- 顶层 `Plot { ElectricField }` 中悬停 Plot → 应显示 Plot section 文档
- `Solve { Coupled { ... } }` 中悬停 Coupled 内关键词 → 应按 Coupled 上下文查找

- [ ] **Step 3: 运行全部测试验证无回归**

Run: `node tests/test-sdevice-semantic.js && node tests/test-semantic-tokens.js`
Expected: 全部 passed

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat(sdevice): HoverProvider 上下文感知文档查找

修改 HoverProvider 增加 sdevice 分支：根据 section 栈上下文
优先查找当前 section 的 parameters 和 keywords，
未找到时 fallback 到通用文档查找。
File { Plot= } 中 Plot 悬停现在显示 File 参数文档而非 Plot section 文档。"
```

---

### Task 6: 提取 section keyword 常量 + 最终验证

**Files:**
- Modify: `src/lsp/tcl-symbol-configs.js`
- Modify: `src/extension.js`
- Modify: `tests/test-sdevice-semantic.js`

- [ ] **Step 1: 在 `tcl-symbol-configs.js` 中导出扩展 section keyword 集合**

在 `SECTION_KEYWORDS` 对象中，为 sdevice 添加扩展集合（含嵌套块名）：

```js
// 嵌套 section 块名（用于 Semantic Tokens 上下文追踪）
const SDEVICE_NESTED_BLOCKS = new Set([
    'Coupled', 'Transient', 'QuasiStationary', 'CoupledPrevious',
]);

/**
 * 获取指定语言的完整 section 关键词集合（含嵌套块）。
 * 仅用于 sdevice Semantic Tokens。
 */
function getSdeviceAllSectionKeywords() {
    const all = new Set(SECTION_KEYWORDS.sdevice);
    for (const kw of SDEVICE_NESTED_BLOCKS) all.add(kw);
    return all;
}
```

更新 exports：
```js
module.exports = {
    isSectionCommand,
    getSdeviceAllSectionKeywords,
};
```

- [ ] **Step 2: 在 `extension.js` 中使用导出的常量**

将 Task 4 和 Task 5 中硬编码的 `sdeviceSectionKws` 替换为：

```js
const { isSectionCommand, getSdeviceAllSectionKeywords } = require('./lsp/tcl-symbol-configs');
```

Task 4 中注册 Provider 处改为：
```js
    const sdeviceSectionKws = getSdeviceAllSectionKeywords();
```

Task 5 中 HoverProvider 内改为：
```js
                        const stack = sdeviceSemanticMod.getSectionStack(
                            document.getText(), position.line, sdeviceSectionKws
                        );
```

注意：`sdeviceSectionKws` 需要在 for 循环外计算一次，供 HoverProvider 闭包引用：
```js
    const sdeviceSectionKws = getSdeviceAllSectionKeywords();
```

放在 `for (const langId of languages)` 循环之前。

- [ ] **Step 3: 运行全部测试**

Run: `node tests/test-sdevice-semantic.js`
Expected: 全部 passed

- [ ] **Step 4: 手动端到端验证**

Extension Development Host 中完整测试：
1. `File { Plot="x" }` — Plot 着色不同于 `Plot { }`
2. `Solve { Coupled { Plot } }` — Plot 按 Coupled 上下文着色
3. 悬停 File 内 Plot → 显示参数文档
4. 悬停顶层 Plot → 显示 section 文档
5. 其他语言（sde/sprocess）不受影响

- [ ] **Step 5: 提交**

```bash
git add src/lsp/tcl-symbol-configs.js src/extension.js
git commit -m "refactor(sdevice): 提取 section keyword 常量到 tcl-symbol-configs

将硬编码的 sdevice section keyword 集合提取为 getSdeviceAllSectionKeywords，
包含顶层 section 名和嵌套块名（Coupled/Transient/QuasiStationary）。
消除 extension.js 中的重复定义。"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Section 上下文追踪（spec §1）→ Task 2
- ✅ Semantic Tokens 着色（spec §2）→ Task 3, 4
- ✅ 上下文感知悬停（spec §3）→ Task 5
- ✅ 文件结构（spec §4）→ Task 1-6
- ✅ 性能（spec §5）→ scanStacksPerLine O(n) 单遍扫描

**Placeholder scan:** 无 TBD/TODO，所有步骤含完整代码。

**Type consistency:**
- `buildKeywordSectionIndex(docs)` → `Map<string, Set<string>>` — 一致
- `getSectionStack(text, targetLine, sectionKeywords)` → `string[]` — 一致
- `extractSdeviceTokens(text, keywordIndex, sectionKeywords)` → `number[]` — 一致
- `createSdeviceSemanticProvider(docs, sectionKeywords)` — 一致
- `getSdeviceAllSectionKeywords()` → `Set<string>` — 一致
