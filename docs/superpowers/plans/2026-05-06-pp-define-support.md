# #define 预处理变量语义支持 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 5 种 Tcl 工具添加 `#define` 宏的定义提取、裸词引用检测、补全、Hover、跳转、查找引用、未定义诊断和语义着色。

**Architecture:** 扩展现有 `pp-utils.js` 纯文本扫描模块，新增定义提取和引用检测函数。通过 `definitions.js` 统一分发到各 Provider，最小化 `extension.js` 的改动。语义着色通过共享 token 构建函数集成到 SDEVICE provider 和新增的轻量级 Tcl provider。

**Tech Stack:** 纯 JavaScript (CommonJS)、VSCode Extension API、TextMate JSON 语法、Semantic Tokens API

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| Modify | `src/lsp/pp-utils.js` | 新增 `extractPpDefines`、`extractPpUndefs`、`findPpDefineRefs`、`buildPpDefineTokens`、辅助函数 |
| Modify | `src/definitions.js` | `extractTclDefinitionsAst` 合并 `#define` 定义 |
| Modify | `src/extension.js` | 补全中识别 `ppDefine` 类型为 Constant；为 4 种 Tcl 工具注册轻量 semantic provider |
| Modify | `src/lsp/providers/variable-reference-provider.js` | `provideTclReferences` 追加裸词引用 |
| Modify | `src/lsp/providers/undef-var-diagnostic.js` | 新增 `#ifdef`/`#ifndef` 未定义宏诊断 |
| Modify | `src/lsp/providers/sdevice-semantic-provider.js` | `TOKEN_TYPES` 新增 `macro`；`extractTokensFromStacks` 合并 pp-define token |
| Modify | `syntaxes/sdevice.tmLanguage.json` | 拆分 `#define`/`#undef`/`#ifdef` 模式，宏名着色 |
| Modify | `syntaxes/sprocess.tmLanguage.json` | 同上 |
| Modify | `syntaxes/emw.tmLanguage.json` | 同上 |
| Modify | `syntaxes/inspect.tmLanguage.json` | 同上 |
| Modify | `syntaxes/svisual.tmLanguage.json` | 同上 |
| Modify | `package.json` | `semanticTokenTypes` 新增 `macro`；`semanticTokenModifiers` 新增 `declaration` |
| Create | `tests/test-pp-define.js` | 定义提取、引用检测、存活区间测试 |

---

### Task 1: 定义提取 — extractPpDefines + extractPpUndefs

**Files:**
- Modify: `src/lsp/pp-utils.js`
- Test: `tests/test-pp-define.js`

- [ ] **Step 1: 写定义提取的失败测试**

```javascript
// tests/test-pp-define.js
'use strict';

const assert = require('assert');
const { extractPpDefines, extractPpUndefs } = require('../src/lsp/pp-utils');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nextractPpDefines:');

test('#define NAME VALUE 正确提取', () => {
    const text = '#define THICKNESS 0.1\nset x 1\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'THICKNESS');
    assert.strictEqual(defs[0].value, '0.1');
    assert.strictEqual(defs[0].line, 1);
    assert.strictEqual(defs[0].endLine, 1);
    assert.strictEqual(defs[0].definitionText, '#define THICKNESS 0.1');
    assert.strictEqual(defs[0].kind, 'ppDefine');
});

test('#define FLAG（无值）', () => {
    const text = '#define NMOS\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'NMOS');
    assert.strictEqual(defs[0].value, '');
});

test('#define 含空格的 VALUE', () => {
    const text = '#define EQN a + b * c\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].value, 'a + b * c');
});

test('#define 含引号的 VALUE', () => {
    const text = '#define MODEL "Boltzmann"\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs[0].value, '"Boltzmann"');
});

test('多个 #define 按顺序提取', () => {
    const text = '#define A 1\n#define B 2\n#define C 3\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 3);
    assert.strictEqual(defs[0].name, 'A');
    assert.strictEqual(defs[1].name, 'B');
    assert.strictEqual(defs[2].name, 'C');
});

test('同名多次定义保留所有位置', () => {
    const text = '#define X 1\nset y 2\n#define X 3\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].line, 1);
    assert.strictEqual(defs[1].line, 3);
});

test('非 #define 行不提取', () => {
    const text = 'set x 1\n# comment\n#if NMOS\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 0);
});

test('#define 前导空格被容许', () => {
    const text = '  #define INDENTED 42\n';
    const defs = extractPpDefines(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].name, 'INDENTED');
});

console.log('\nextractPpUndefs:');

test('#undef NAME 正确提取', () => {
    const text = '#define A 1\nset x 1\n#undef A\n';
    const undefs = extractPpUndefs(text);
    assert.strictEqual(undefs.length, 1);
    assert.strictEqual(undefs[0].name, 'A');
    assert.strictEqual(undefs[0].line, 3);
});

test('无 #undef 返回空数组', () => {
    const text = '#define A 1\nset x 1\n';
    const undefs = extractPpUndefs(text);
    assert.strictEqual(undefs.length, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-pp-define.js
```

Expected: FAIL — `extractPpDefines is not a function`

- [ ] **Step 3: 实现定义提取**

在 `src/lsp/pp-utils.js` 的 `module.exports` 行之前，新增以下函数：

```javascript
/**
 * 从文本中提取 #define 宏定义。
 * @param {string} text - 文档全文
 * @returns {Array<{name: string, value: string, line: number, endLine: number, definitionText: string, kind: string}>}
 */
function extractPpDefines(text) {
    const defines = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#\s*define\s+(\w+)(?:\s+(.*))?$/);
        if (match) {
            const rawValue = match[2];
            const value = rawValue !== undefined ? rawValue.trim() : '';
            defines.push({
                name: match[1],
                value,
                line: i + 1,
                endLine: i + 1,
                definitionText: lines[i].trim(),
                kind: 'ppDefine',
            });
        }
    }
    return defines;
}

/**
 * 从文本中提取 #undef 指令。
 * @param {string} text - 文档全文
 * @returns {Array<{name: string, line: number}>}
 */
function extractPpUndefs(text) {
    const undefs = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#\s*undef\s+(\w+)/);
        if (match) {
            undefs.push({ name: match[1], line: i + 1 });
        }
    }
    return undefs;
}
```

更新 `module.exports`：

```javascript
module.exports = { buildPpBlocks, extractPpDefines, extractPpUndefs };
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node tests/test-pp-define.js
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/lsp/pp-utils.js tests/test-pp-define.js
git commit -m "feat(pp-utils): #define/#undef 定义提取 + 测试"
```

---

### Task 2: 裸词引用检测 — findPpDefineRefs

**Files:**
- Modify: `src/lsp/pp-utils.js`
- Modify: `tests/test-pp-define.js`

- [ ] **Step 1: 写引用检测的失败测试**

追加到 `tests/test-pp-define.js` 的 `process.exit` 行之前：

```javascript
const { findPpDefineRefs } = require('../src/lsp/pp-utils');

console.log('\nfindPpDefineRefs:');

test('#ifdef NAME 被识别为引用', () => {
    const text = '#define FLAG\n#ifdef FLAG\nset x 1\n#endif\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const ifdefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(ifdefRefs.length, 1);
    assert.strictEqual(ifdefRefs[0].name, 'FLAG');
    assert.strictEqual(ifdefRefs[0].refType, 'ifdef');
});

test('#ifndef NAME 被识别为引用', () => {
    const text = '#define FLAG\n#ifndef FLAG\nset x 1\n#endif\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const ifndefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(ifndefRefs.length, 1);
    assert.strictEqual(ifndefRefs[0].refType, 'ifndef');
});

test('#undef NAME 被识别为引用', () => {
    const text = '#define A 1\n#undef A\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const undefRefs = refs.filter(r => r.line === 2);
    assert.strictEqual(undefRefs.length, 1);
    assert.strictEqual(undefRefs[0].refType, 'undef');
});

test('普通代码行裸词被识别为引用', () => {
    const text = '#define THICKNESS 0.1\nset x THICKNESS\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const codeRefs = refs.filter(r => r.line === 2 && r.refType === 'usage');
    assert.strictEqual(codeRefs.length, 1);
    assert.strictEqual(codeRefs[0].name, 'THICKNESS');
    assert.ok(codeRefs[0].startCol >= 0);
});

test('$NAME 不被识别为 #define 引用', () => {
    const text = '#define VAR 1\nputs $VAR\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});

test('字符串内的 NAME 不被识别为引用', () => {
    const text = '#define NAME 1\nputs "NAME is here"\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});

test('定义行之前的同名标识符不被识别', () => {
    const text = 'set x THICKNESS\n#define THICKNESS 0.1\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    assert.strictEqual(refs.length, 0);
});

test('#undef 之后裸词不被识别（存活区间）', () => {
    const text = '#define A 1\nset x A\n#undef A\nset y A\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    // 第 2 行有引用，第 4 行不应有
    const line2Refs = refs.filter(r => r.line === 2);
    const line4Refs = refs.filter(r => r.line === 4);
    assert.strictEqual(line2Refs.length, 1);
    assert.strictEqual(line4Refs.length, 0);
});

test('#define 行的 NAME 定义位置不作为引用', () => {
    const text = '#define FLAG\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    assert.strictEqual(refs.length, 0);
});

test('注释行中的 NAME 不被识别为引用', () => {
    const text = '#define FLAG\n# FLAG is important\n';
    const defs = extractPpDefines(text);
    const refs = findPpDefineRefs(text, defs);
    const usageRefs = refs.filter(r => r.refType === 'usage');
    assert.strictEqual(usageRefs.length, 0);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-pp-define.js
```

Expected: FAIL — `findPpDefineRefs is not a function`

- [ ] **Step 3: 实现引用检测**

在 `src/lsp/pp-utils.js` 中新增以下辅助函数和主函数：

```javascript
/** 转义正则特殊字符 */
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 检查 line[col] 是否在双引号字符串内 */
function isInQuotedString(line, col) {
    let inStr = false;
    for (let i = 0; i < col; i++) {
        if (line[i] === '\\' && inStr) { i++; continue; }
        if (line[i] === '"') inStr = !inStr;
    }
    return inStr;
}

/**
 * 检测 #define 宏在文档中的引用位置。
 * @param {string} text - 文档全文
 * @param {Array<{name: string, line: number}>} defines - extractPpDefines 的结果
 * @returns {Array<{name: string, line: number, startCol: number, refType: string}>}
 *   refType: 'ifdef'|'ifndef'|'undef'|'usage'
 */
function findPpDefineRefs(text, defines) {
    if (defines.length === 0) return [];

    const refs = [];
    const lines = text.split('\n');

    // 构建每个 define 的存活区间
    const undefs = extractPpUndefs(text);
    const undefMap = new Map();
    for (const u of undefs) {
        undefMap.set(u.name, u.line);
    }

    for (const def of defines) {
        const undefLine = undefMap.get(def.name); // undef 之后的行不再存活
        const regex = new RegExp(`\\b${escapeRegex(def.name)}\\b`, 'g');

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            if (lineNum < def.line) continue;     // 定义之前
            if (undefLine !== undefined && lineNum > undefLine) continue; // #undef 之后

            const line = lines[i];

            // 精确提取：#ifdef / #ifndef
            const ifdefMatch = line.match(/^#\s*(ifdef|ifndef)\s+(\w+)/);
            if (ifdefMatch && ifdefMatch[2] === def.name) {
                // 计算列位置：跳过 # 和空白找到 NAME 起始列
                const nameStart = line.indexOf(def.name, line.indexOf(ifdefMatch[1]) + ifdefMatch[1].length);
                refs.push({ name: def.name, line: lineNum, startCol: nameStart, refType: ifdefMatch[1] });
                continue;
            }

            // 精确提取：#undef
            const undefMatch = line.match(/^#\s*undef\s+(\w+)/);
            if (undefMatch && undefMatch[1] === def.name) {
                const nameStart = line.indexOf(def.name, 5);
                refs.push({ name: def.name, line: lineNum, startCol: nameStart, refType: 'undef' });
                continue;
            }

            // #define 定义行本身：跳过
            const defineMatch = line.match(/^#\s*define\s+(\w+)/);
            if (defineMatch && defineMatch[1] === def.name) continue;

            // 纯注释行（# 开头但不是预处理指令）→ 跳过
            const trimmed = line.trimStart();
            if (trimmed.startsWith('#') && !/^#\s*(if|ifdef|ifndef|elif|else|endif|define|undef|include|error|set|seth|rem|verbatim)\b/.test(trimmed)) {
                continue;
            }

            // 裸词扫描
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(line)) !== null) {
                const col = match.index;
                // 排除 $ 前缀
                if (col > 0 && line[col - 1] === '$') continue;
                // 排除 ${ 前缀
                if (col >= 2 && line[col - 1] === '{' && line[col - 2] === '$') continue;
                // 排除引号内
                if (isInQuotedString(line, col)) continue;

                refs.push({ name: def.name, line: lineNum, startCol: col, refType: 'usage' });
            }
        }
    }

    return refs;
}
```

更新 `module.exports`：

```javascript
module.exports = { buildPpBlocks, extractPpDefines, extractPpUndefs, findPpDefineRefs };
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node tests/test-pp-define.js
```

Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/lsp/pp-utils.js tests/test-pp-define.js
git commit -m "feat(pp-utils): #define 裸词引用检测 + 存活区间 + 测试"
```

---

### Task 3: definitions.js 集成

**Files:**
- Modify: `src/definitions.js`

- [ ] **Step 1: 在 extractTclDefinitionsAst 中合并 #define 定义**

在 `src/definitions.js` 顶部添加 import：

```javascript
const { extractPpDefines } = require('./lsp/pp-utils');
```

修改 `extractTclDefinitionsAst` 函数：

```javascript
function extractTclDefinitionsAst(text) {
    const results = [];
    results.push(...extractPpDefines(text));
    const tree = tclAstUtils.parseSafe(text);
    if (!tree) return results;
    try {
        results.push(...tclAstUtils.getVariables(tree.rootNode, text));
    } finally {
        tree.delete();
    }
    return results;
}
```

注意：`if (!tree) return results;` — 当 WASM 不可用时，仍然返回 `#define` 定义（因为它是纯文本扫描，不依赖 AST）。

- [ ] **Step 2: 提交**

```bash
git add src/definitions.js
git commit -m "feat(definitions): 合并 #define 定义到 Tcl 定义提取"
```

---

### Task 4: 补全 + Hover 中的 ppDefine 类型识别

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 修改补全中的 kind 判断**

在 `src/extension.js` 的 `provideCompletionItems` 回调中（约第 543-554 行），修改 `userItems` 的构建逻辑，识别 `ppDefine` 类型：

```javascript
const userItems = filteredDefs.map(d => {
    let itemKind = vscode.CompletionItemKind.Variable;
    let detail = 'User Variable';
    if (d.kind === 'function') {
        itemKind = vscode.CompletionItemKind.Function;
        detail = 'User Function';
    }
    if (d.kind === 'ppDefine') {
        itemKind = vscode.CompletionItemKind.Constant;
        detail = d.value ? `#define = ${d.value}` : '#define';
    }
    const item = new vscode.CompletionItem(d.name, itemKind);
    item.detail = detail;
    item.sortText = '4' + d.name;
    item.documentation = new vscode.MarkdownString('```' + langId + '\n' + defs.truncateDefinitionText(d.definitionText, maxWidth, langId) + '\n```');
    return item;
});
```

- [ ] **Step 2: 修改 Hover 中的显示**

在 `src/extension.js` 的 Hover provider 中（约第 688-698 行），修改用户变量 hover 的展示：

找到：
```javascript
const def = userDefs.find(d => d.name === word);
if (def) {
    const hoverMaxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${def.name}** (用户变量, 第 ${def.line} 行)\n\n`);
    md.appendCodeblock(defs.truncateDefinitionText(def.definitionText, hoverMaxWidth, langId), langId);
    return new vscode.Hover(md, range);
}
```

替换为：
```javascript
const def = userDefs.find(d => d.name === word);
if (def) {
    const hoverMaxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
    const md = new vscode.MarkdownString();
    const typeLabel = def.kind === 'ppDefine' ? '预处理宏' : '用户变量';
    md.appendMarkdown(`**${def.name}** (${typeLabel}, 第 ${def.line} 行)\n\n`);
    md.appendCodeblock(defs.truncateDefinitionText(def.definitionText, hoverMaxWidth, langId), langId);
    return new vscode.Hover(md, range);
}
```

- [ ] **Step 3: 修改跳转定义中的 ppDefine 支持**

在 `src/extension.js` 的 `provideDefinition` Tcl 分支中（约第 732-755 行），当前通过 `scopeIndex.resolveDefinition` 查找定义。`#define` 定义不在 `scopeIndex` 中，需要增加 fallback：

找到：
```javascript
const scopeIndex = astUtils.buildScopeIndex(entry.tree.rootNode);
const targetDef = scopeIndex.resolveDefinition(word, cursorLine);
if (!targetDef) return null;
```

替换为：
```javascript
const scopeIndex = astUtils.buildScopeIndex(entry.tree.rootNode);
let targetDef = scopeIndex.resolveDefinition(word, cursorLine);

// Fallback: 检查 #define 宏定义
if (!targetDef) {
    const ppDefs = defs.extractPpDefinitionsText(document.getText());
    const ppDef = ppDefs.find(d => d.name === word && d.line <= cursorLine);
    if (ppDef) {
        const defLine0 = ppDef.line - 1;
        const defLineText = document.lineAt(defLine0).text;
        const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
        const match = re.exec(defLineText);
        if (match) {
            return new vscode.Location(
                document.uri,
                new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
            );
        }
    }
    return null;
}
```

同时需要在 `definitions.js` 中导出一个直接调用的函数（供 extension.js 跳转使用）：

在 `src/definitions.js` 的 `module.exports` 中添加：

```javascript
/** 直接提取 #define 定义（供跳转 fallback 使用） */
function extractPpDefinitionsText(text) {
    return extractPpDefines(text);
}
```

并在 `module.exports` 中导出 `extractPpDefinitionsText`。在 `src/extension.js` 顶部 `defs` 已指向 `definitions.js`，无需额外 import。

- [ ] **Step 4: 提交**

```bash
git add src/extension.js src/definitions.js
git commit -m "feat: 补全/Hover/跳转支持 #define 宏"
```

---

### Task 5: 查找引用集成

**Files:**
- Modify: `src/lsp/providers/variable-reference-provider.js`

- [ ] **Step 1: 在 provideTclReferences 中追加裸词引用**

在 `src/lsp/providers/variable-reference-provider.js` 顶部添加 import：

```javascript
const ppUtils = require('../pp-utils');
const defs = require('../../definitions');
```

在 `provideTclReferences` 函数中，找到现有的 `$varName` 引用收集之后的 `return locations.length > 0 ? locations : null;` 行之前，追加以下代码：

```javascript
// #define 裸词引用
const ppDefs = ppUtils.extractPpDefines(document.getText());
const ppDef = ppDefs.find(d => d.name === word);
if (ppDef) {
    const ppRefs = ppUtils.findPpDefineRefs(document.getText(), ppDefs.filter(d => d.name === word));
    for (const ref of ppRefs) {
        // 避免与已有位置重复
        const isDup = locations.some(loc =>
            loc.range.start.line === ref.line - 1 &&
            loc.range.start.character === ref.startCol
        );
        if (!isDup) {
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(ref.line - 1, ref.startCol, ref.line - 1, ref.startCol + word.length)
            ));
        }
    }
}

return locations.length > 0 ? locations : null;
```

- [ ] **Step 2: 提交**

```bash
git add src/lsp/providers/variable-reference-provider.js
git commit -m "feat: 查找引用支持 #define 裸词引用"
```

---

### Task 6: 未定义宏诊断

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 在 checkTclUndefVars 中添加 #ifdef/#ifndef 未定义宏检测**

在 `checkTclUndefVars` 函数的 `return diagnostics;` 行之前，追加：

```javascript
// #ifdef / #ifndef 未定义宏诊断
const text = document.getText();
const ppDefs = ppUtils.extractPpDefines(text);
const definedNames = new Set(ppDefs.map(d => d.name));
const lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#\s*(ifdef|ifndef)\s+(\w+)/);
    if (match) {
        const macroName = match[2];
        if (!definedNames.has(macroName)) {
            // 计算宏名的列位置
            const kwEnd = lines[i].indexOf(match[1]) + match[1].length;
            const nameStart = lines[i].indexOf(macroName, kwEnd);
            const range = new vscode.Range(
                i, nameStart,
                i, nameStart + macroName.length
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `未定义的宏: ${macroName}`,
                vscode.DiagnosticSeverity.Hint
            );
            diagnostic.source = 'undef-macro';
            diagnostics.push(diagnostic);
        }
    }
}
```

注意：使用 `Hint` 级别而非 `Warning`，因为 SWB 预处理变量可能来自 `#include` 的外部文件，误报率较高。

- [ ] **Step 2: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "feat: #ifdef/#ifndef 未定义宏诊断"
```

---

### Task 7: TextMate 语法高亮增强

**Files:**
- Modify: `syntaxes/sdevice.tmLanguage.json`
- Modify: `syntaxes/sprocess.tmLanguage.json`
- Modify: `syntaxes/emw.tmLanguage.json`
- Modify: `syntaxes/inspect.tmLanguage.json`
- Modify: `syntaxes/svisual.tmLanguage.json`

5 个文件的改动完全相同。以 `sdevice.tmLanguage.json` 为例。

- [ ] **Step 1: 替换预处理器模式**

在 `syntaxes/sdevice.tmLanguage.json` 中找到 `"name": "meta.preprocessor.tcl"` 的整个对象（从 `{` 到对应的 `}`），替换为以下 4 个独立模式：

```json
{
  "name": "meta.preprocessor.define.tcl",
  "match": "^\\s*(#\\s*define)\\b\\s+(\\w+)(\\s+.*)?$",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.tcl" },
    "2": { "name": "variable.other.constant.preprocessor.tcl" },
    "3": {
      "patterns": [
        { "match": "\"[^\"]*\"", "name": "string.quoted.double.tcl" },
        { "match": "\\b(defined|TRUE|FALSE)\\b", "name": "keyword.control.preprocessor.tcl" }
      ]
    }
  }
},
{
  "name": "meta.preprocessor.undef.tcl",
  "match": "^\\s*(#\\s*undef)\\b\\s+(\\w+)",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.tcl" },
    "2": { "name": "variable.other.constant.preprocessor.tcl" }
  }
},
{
  "name": "meta.preprocessor.ifdef.tcl",
  "match": "^\\s*(#\\s*(?:ifdef|ifndef))\\b\\s+(\\w+)",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.tcl" },
    "2": { "name": "variable.other.constant.preprocessor.tcl" }
  }
},
{
  "name": "meta.preprocessor.other.tcl",
  "match": "^\\s*(#\\s*(?:if|elif|else|endif|include|error|set))\\b(.*$)",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.tcl" },
    "2": {
      "patterns": [
        { "match": "\\b(defined|TRUE|FALSE)\\b", "name": "keyword.control.preprocessor.tcl" },
        { "match": "\"[^\"]*\"", "name": "string.quoted.double.tcl" }
      ]
    }
  }
}
```

- [ ] **Step 2: 对其余 4 个 tmLanguage.json 重复相同替换**

在 `sprocess.tmLanguage.json`、`emw.tmLanguage.json`、`inspect.tmLanguage.json`、`svisual.tmLanguage.json` 中执行同样的替换。

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat: TextMate 语法 #define/#undef/#ifdef 宏名着色（5 种 Tcl 工具）"
```

---

### Task 8: 语义着色 — macro token 类型注册 + SDEVICE 集成

**Files:**
- Modify: `package.json`
- Modify: `src/lsp/providers/sdevice-semantic-provider.js`

- [ ] **Step 1: 在 package.json 中注册 macro token 类型**

在 `package.json` 的 `semanticTokenTypes` 数组中追加：

```json
{
  "id": "macro",
  "superType": "variable",
  "description": "预处理器宏引用"
}
```

在 `semanticTokenModifiers` 数组（如果存在）中追加：

```json
{
  "id": "declaration",
  "description": "宏定义声明位置"
}
```

如果 `semanticTokenModifiers` 不存在，需要新增该数组。

- [ ] **Step 2: 在 sdevice-semantic-provider.js 中集成 #define token**

修改 `TOKEN_TYPES` 和 `TOKEN_MODIFIERS`：

```javascript
const TOKEN_TYPES = ['sectionName', 'sectionKeyword', 'macro'];
const TOKEN_MODIFIERS = ['declaration'];
```

在 `extractTokensFromStacks` 函数的循环中（遍历每行的标识符），在字符串/注释屏蔽逻辑（`scanText` 构建）之后、标识符扫描之前，新增 `#define` 相关的 token 检测：

```javascript
// #define / #ifdef / #ifndef / #undef 行的宏名 token
const ppMatch = lineText.match(/^(\s*)(#\s*(?:define|undef|ifdef|ifndef))\s+(\w+)/);
if (ppMatch) {
    const ppKwCol = ppMatch[1].length;
    const nameCol = lineText.indexOf(ppMatch[3], ppKwCol + ppMatch[2].length);
    const isDefine = /^#\s*define\b/.test(ppMatch[2]);
    tokens.push({
        line: lineIdx,
        col: nameCol,
        len: ppMatch[3].length,
        type: 2, // macro
        modifier: isDefine ? 1 : 0, // declaration
    });
}
```

然后在标准标识符扫描循环中，增加裸词引用检测：当 `wordSections` 为空（不是已知 SDEVICE 关键词），但匹配某个 `#define` 宏名时，分配 macro token。这需要在函数参数中传入 `ppDefines`。

修改 `extractTokensFromStacks` 签名，新增 `ppDefines` 参数：

```javascript
function extractTokensFromStacks(lines, stacksPerLine, keywordIndex, sectionKeywords, ppDefines)
```

在标识符扫描中，当 `!wordSections` 时检查是否为 `#define` 宏引用：

```javascript
if (!wordSections) {
    // 检查是否为 #define 裸词引用
    if (ppDefines) {
        const ppDef = ppDefines.find(d => d.name === word && d.line <= lineIdx + 1);
        if (ppDef) {
            tokens.push({ line: lineIdx, col, len: word.length, type: 2, modifier: 0 });
        }
    }
    continue;
}
```

同步修改 `encodeDelta` 支持 modifier：

```javascript
function encodeDelta(tokens) {
    const result = [];
    let prevLine = 0, prevCol = 0;
    for (const t of tokens) {
        const deltaLine = t.line - prevLine;
        const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
        result.push(deltaLine, deltaCol, t.len, t.type, t.modifier || 0);
        prevLine = t.line;
        prevCol = t.col;
    }
    return result;
}
```

同步修改 `extractSdeviceTokens` 和 `getCacheEntry` 传入 `ppDefines`：

```javascript
function extractSdeviceTokens(text, keywordIndex, sectionKeywords) {
    const lines = text.split('\n');
    const stacksPerLine = scanStacksPerLine(text, sectionKeywords, lines);
    const ppDefines = extractPpDefines(text);
    return extractTokensFromStacks(lines, stacksPerLine, keywordIndex, sectionKeywords, ppDefines);
}
```

在文件顶部添加 import：

```javascript
const { extractPpDefines } = require('../pp-utils');
```

- [ ] **Step 3: 提交**

```bash
git add package.json src/lsp/providers/sdevice-semantic-provider.js
git commit -m "feat: SDEVICE 语义着色支持 #define macro token"
```

---

### Task 9: 其余 4 种 Tcl 工具的语义着色

**Files:**
- Modify: `src/lsp/pp-utils.js`
- Modify: `src/extension.js`

- [ ] **Step 1: 在 pp-utils.js 中新增 buildPpDefineTokens 函数**

```javascript
/**
 * 构建全文的 #define 相关 semantic token。
 * 供非 SDEVICE 的 Tcl 工具使用（轻量级 semantic provider）。
 * @param {string} text - 文档全文
 * @returns {number[]} Delta-encoded semantic token array
 */
function buildPpDefineTokens(text) {
    const defines = extractPpDefines(text);
    if (defines.length === 0) return [];

    const refs = findPpDefineRefs(text, defines);
    const lines = text.split('\n');
    const tokens = [];

    // 定义位置
    for (const def of defines) {
        const lineIdx = def.line - 1;
        const line = lines[lineIdx];
        const match = line.match(/^(\s*)#\s*define\s+(\w+)/);
        if (match) {
            const nameCol = line.indexOf(def.name, match[1].length + 7);
            tokens.push({ line: lineIdx, col: nameCol, len: def.name.length, type: 0, modifier: 1 });
        }
    }

    // 引用位置
    for (const ref of refs) {
        tokens.push({ line: ref.line - 1, col: ref.startCol, len: ref.name.length, type: 0, modifier: 0 });
    }

    tokens.sort((a, b) => a.line !== b.line ? a.line - b.line : a.col - b.col);
    return encodePpTokenDelta(tokens);
}

function encodePpTokenDelta(tokens) {
    const result = [];
    let prevLine = 0, prevCol = 0;
    for (const t of tokens) {
        const deltaLine = t.line - prevLine;
        const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
        result.push(deltaLine, deltaCol, t.len, t.type, t.modifier);
        prevLine = t.line;
        prevCol = t.col;
    }
    return result;
}
```

更新 `module.exports`：

```javascript
module.exports = { buildPpBlocks, extractPpDefines, extractPpUndefs, findPpDefineRefs, buildPpDefineTokens };
```

- [ ] **Step 2: 在 extension.js 中注册轻量级 Tcl semantic provider**

在 `src/extension.js` 的 SDEVICE semantic provider 注册之后（约第 481 行），添加：

```javascript
// Semantic Tokens (其他 Tcl 工具) — #define 宏着色
const tclPpLangs = ['sprocess', 'emw', 'inspect', 'svisual'];
const ppDefineLegend = new vscode.SemanticTokensLegend(
    ['macro'],
    ['declaration']
);
for (const ppLang of tclPpLangs) {
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: ppLang },
            {
                provideDocumentSemanticTokens(document) {
                    const data = ppUtils.buildPpDefineTokens(document.getText());
                    return { data };
                },
            },
            ppDefineLegend
        )
    );
}
```

在 `src/extension.js` 顶部添加 import：

```javascript
const ppUtils = require('./lsp/pp-utils');
```

- [ ] **Step 3: 提交**

```bash
git add src/lsp/pp-utils.js src/extension.js
git commit -m "feat: 4 种 Tcl 工具 #define 宏语义着色"
```

---

### Task 10: 集成测试 + 清理

**Files:**
- Modify: `tests/test-pp-define.js`

- [ ] **Step 1: 添加 Provider 集成测试**

追加到 `tests/test-pp-define.js` 的 `process.exit` 行之前：

```javascript
console.log('\nProvider 集成:');

const definitions = require('../src/definitions');

test('extractTclDefinitionsAst 合并 #define 定义', () => {
    const text = '#define THICKNESS 0.1\nset x 1\n';
    const defs = definitions.extractTclDefinitionsAst(text);
    const ppDefs = defs.filter(d => d.kind === 'ppDefine');
    assert.strictEqual(ppDefs.length, 1);
    assert.strictEqual(ppDefs[0].name, 'THICKNESS');
    const tclDefs = defs.filter(d => d.kind !== 'ppDefine');
    assert.strictEqual(tclDefs.length, 1);
    assert.strictEqual(tclDefs[0].name, 'x');
});

test('WASM 不可用时仍返回 #define 定义', () => {
    // extractTclDefinitionsAst 在 WASM 不可用时 fallback 到纯文本
    const text = '#define FLAG\n';
    const defs = definitions.extractTclDefinitionsAst(text);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].kind, 'ppDefine');
});
```

- [ ] **Step 2: 运行全部测试**

```bash
node tests/test-pp-define.js
```

Expected: 全部 PASS

- [ ] **Step 3: 运行已有的 pp-utils 测试确认无回归**

```bash
node tests/test-tcl-preprocessor.js
```

Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add tests/test-pp-define.js
git commit -m "test: #define Provider 集成测试"
```

---

### Task 11: 清理临时文件 + 最终验证

- [ ] **Step 1: 删除 SWB 文档转换脚本（如果有临时文件）**

```bash
# 检查 references/ 下是否有临时处理脚本
ls references/_*.py 2>/dev/null && rm references/_*.py || echo "无临时文件"
```

- [ ] **Step 2: 运行全部测试套件确认无回归**

```bash
# 运行所有相关测试
node tests/test-pp-define.js
node tests/test-tcl-preprocessor.js
node tests/test-definitions.js
node tests/test-undef-var-integration.js
node tests/test-sdevice-semantic.js
```

Expected: 全部 PASS

- [ ] **Step 3: 最终提交**

```bash
git add -A
git status  # 确认无遗漏
git commit -m "chore: #define 功能实现完成，清理临时文件"
```
