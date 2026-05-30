# 修复 SPROCESS 点号命令高亮截断 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 #84 中 SPROCESS TextMate 语法对 `icwb.*`、`transform.*` 点号命令的前缀截断，并用回归测试防止同类问题再次出现。

**Architecture:** 先增加一个纯 Node.js 语法测试，直接解析 `syntaxes/sprocess.tmLanguage.json`，模拟 TextMate 在同一位置按 pattern 顺序匹配命令的行为。再调整 `keyword.control.sprocess` 的 KEYWORD1 分组，将同一前缀家族的点号命令放在同一组并按长名优先排列。测试同时覆盖 #84 点名的 `point.xy`，但本地验证显示它当前未被截断，计划中仍将其与 `point` 归组以保持规则一致。

**Tech Stack:** TextMate grammar JSON、Node.js `assert`、仓库现有 `tests/helpers/test-runner.js`。

---

## Root Cause Notes

本地验证命令：

```powershell
rg -n "icwb|transform|point" syntaxes/sprocess.tmLanguage.json
```

当前可复现的截断结果：

```text
icwb.create.all.masks     -> match icwb
icwb.contact.mask         -> match icwb
transform.refinement      -> match transform
transform.mask            -> match transform
```

当前未复现的条目：

```text
point.xy                  -> match point.xy
```

原因是 `point.xy` 目前位于包含它的较早 pattern group 中，而短命令 `point` 在更晚 group 中。仍建议归组，避免后续维护时再次拆散。

---

## File Structure

| 文件 | 操作 | 责任 |
|------|------|------|
| `tests/test-sprocess-syntax-keyword-order.js` | 新建 | 验证 SPROCESS KEYWORD1 点号命令不会被较短前缀截断，并扫描全部 KEYWORD1 备选项 |
| `syntaxes/sprocess.tmLanguage.json` | 修改 | 调整 `keyword.control.sprocess` 的 KEYWORD1 pattern 分组与 alternation 顺序 |
| `docs/superpowers/plans/2026-05-30-fix-sprocess-dotted-keyword-highlighting.md` | 保留 | 本计划归档 |

---

### Task 1: Add Failing Grammar Regression Test

**Files:**
- Create: `tests/test-sprocess-syntax-keyword-order.js`

- [ ] **Step 1: 创建测试文件**

写入完整文件：

```javascript
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, summary } = require('./helpers/test-runner');

const grammarPath = path.join(__dirname, '..', 'syntaxes', 'sprocess.tmLanguage.json');

function loadKeywordPatterns() {
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const container = grammar.patterns.find(pattern =>
        Array.isArray(pattern.patterns) &&
        pattern.patterns.some(child => child.name === 'keyword.control.sprocess')
    );

    assert.ok(container, '应找到 keyword.control.sprocess pattern 容器');
    return container.patterns.filter(pattern => pattern.name === 'keyword.control.sprocess');
}

function matchAtCommandStart(command, patterns) {
    for (let groupIndex = 0; groupIndex < patterns.length; groupIndex++) {
        const regex = new RegExp(`^(?:${patterns[groupIndex].match})`);
        const match = command.match(regex);
        if (match) {
            return {
                groupIndex,
                text: match[0],
            };
        }
    }

    return null;
}

function decodeLiteralAlternative(alternative) {
    return alternative.replace(/\\\./g, '.');
}

function getLiteralAlternatives(pattern) {
    const match = pattern.match.match(/^\\b\((.*)\)\(\?!\[A-Za-z0-9_:-\]\)$/);
    assert.ok(match, `无法解析 KEYWORD1 pattern: ${pattern.match}`);
    return match[1].split('|').map(decodeLiteralAlternative);
}

test('SPROCESS 点号 KEYWORD1 命令整体匹配', () => {
    const patterns = loadKeywordPatterns();
    const commands = [
        'icwb.create.all.masks',
        'icwb.create.mask',
        'icwb.contact.mask',
        'icwb.composite',
        'transform.refinement',
        'transform.mask',
        'point.xy',
    ];

    for (const command of commands) {
        const hit = matchAtCommandStart(command, patterns);
        assert.ok(hit, `${command} 应被 KEYWORD1 匹配`);
        assert.strictEqual(hit.text, command, `${command} 不应被截断为 ${hit.text}`);
    }
});

test('SPROCESS 全部 KEYWORD1 备选项不会被较短前缀截断', () => {
    const patterns = loadKeywordPatterns();
    const failures = [];

    for (const pattern of patterns) {
        for (const keyword of getLiteralAlternatives(pattern)) {
            const hit = matchAtCommandStart(keyword, patterns);
            if (!hit || hit.text !== keyword) {
                failures.push(`${keyword} -> ${hit ? hit.text : '<no match>'}`);
            }
        }
    }

    assert.deepStrictEqual(failures, []);
});

summary();
```

- [ ] **Step 2: 运行测试并确认先失败**

Run:

```powershell
node tests/test-sprocess-syntax-keyword-order.js
```

Expected before fix:

```text
✗ SPROCESS 点号 KEYWORD1 命令整体匹配: icwb.create.all.masks 不应被截断为 icwb
✗ SPROCESS 全部 KEYWORD1 备选项不会被较短前缀截断
```

---

### Task 2: Reorder SPROCESS KEYWORD1 Groups

**Files:**
- Modify: `syntaxes/sprocess.tmLanguage.json`

- [ ] **Step 1: 调整 `icwb` 与 `transform` 家族**

在 `keyword.control.sprocess` 容器中修改前 3 个 KEYWORD1 pattern：

1. 从第 1 组移除 `icwb\\.composite`。
2. 在包含短命令 `icwb` 的第 2 组中，将 family 排为：

```text
icwb\\.create\\.all\\.masks|icwb\\.create\\.mask|icwb\\.contact\\.mask|icwb\\.composite|icwb
```

3. 在同一组中，将 family 排为：

```text
transform\\.refinement|transform\\.mask|transform
```

4. 从第 3 组移除 `transform\\.refinement`、`transform\\.mask`、`icwb\\.create\\.all\\.masks`、`icwb\\.contact\\.mask`。

修改后第 2 组中必须包含以下连续序列：

```json
"match": "\\b(tclsel|region|term|math|plot\\.2d|beam|GetMoleFractionFields|graphics|icwb\\.create\\.all\\.masks|icwb\\.create\\.mask|icwb\\.contact\\.mask|icwb\\.composite|icwb|DeleteRefinementboxes|print\\.commands|ambient|define|AdvancedPowerDeviceMode|interface|SetIIIVDiffParams|stress|fproc|integrate|SetTDRList|simSetBoolean|Enu2K|SetPerformanceMode|SetTS4ImplantMode|element|pdbdiff|transform\\.refinement|transform\\.mask|transform|update_principal_stress)(?![A-Za-z0-9_:-])"
```

- [ ] **Step 2: 调整 `point` 家族以保持同一规则**

从第 2 组移除 `point\\.xy`，在包含短命令 `point` 的第 5 组中改为长名在前：

```json
"match": "\\b(mater|print\\.data|sde|SetMoleFractionFields|ArrBreak|refinebox|MoleFractionFields|mask|simGetBoolean|PowerDeviceMode|point\\.xy|point|stressdata|sel|Set3DMovingMeshMode|defineproc|PDE2KMC)(?![A-Za-z0-9_:-])"
```

- [ ] **Step 3: 校验 JSON 可解析**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('syntaxes/sprocess.tmLanguage.json','utf8')); console.log('sprocess grammar JSON OK')"
```

Expected:

```text
sprocess grammar JSON OK
```

---

### Task 3: Verify Fix

**Files:**
- Test: `tests/test-sprocess-syntax-keyword-order.js`
- Test: `syntaxes/sprocess.tmLanguage.json`

- [ ] **Step 1: 运行新增回归测试**

Run:

```powershell
node tests/test-sprocess-syntax-keyword-order.js
```

Expected after fix:

```text
2 passed, 0 failed
```

- [ ] **Step 2: 运行相邻语法/语义测试**

Run:

```powershell
node tests/test-tcl-document-symbol.js
node tests/test-tcl-ast-utils.js
node tests/test-undef-var-integration.js
```

Expected:

```text
0 failed
```

- [ ] **Step 3: 检查工作树差异，确认未触碰既有 `package-lock.json` 修改**

Run:

```powershell
git diff -- syntaxes/sprocess.tmLanguage.json tests/test-sprocess-syntax-keyword-order.js
git status --short
```

Expected:

```text
M syntaxes/sprocess.tmLanguage.json
A tests/test-sprocess-syntax-keyword-order.js
M package-lock.json
```

其中 `package-lock.json` 是实施前已有修改，不纳入本修复。

---

## Commit Plan

实施并验证通过后提交本 issue 修复：

```powershell
git add syntaxes/sprocess.tmLanguage.json tests/test-sprocess-syntax-keyword-order.js docs/superpowers/plans/2026-05-30-fix-sprocess-dotted-keyword-highlighting.md
git commit -m "fix: 修复 SPROCESS 点号命令高亮截断" -m "调整 sprocess TextMate 语法中 KEYWORD1 的点号命令分组，将 icwb、transform、point 家族按长名优先归组，避免短命令先匹配导致长命令高亮被截断。`n`n新增 SPROCESS 语法顺序回归测试，覆盖 #84 点名命令并扫描全部 KEYWORD1 备选项，防止同类前缀截断回归。`n`nClose #84"
```

---

## Self-Review

- 覆盖 #84 中 `icwb.create.all.masks`、`icwb.contact.mask`、`transform.refinement`、`transform.mask` 的实际截断。
- 覆盖 #84 中提及但本地未复现截断的 `point.xy`，并通过归组降低未来维护风险。
- 新增全量 KEYWORD1 扫描，避免只修列举样例而遗漏同类命令。
- 不修改 `package-lock.json` 既有脏状态。
