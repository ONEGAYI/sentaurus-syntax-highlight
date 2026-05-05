# 光标位置感知补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让表达式转换器的变量补全支持光标中间位置编辑，而非仅匹配末尾标识符。

**Architecture:** 新增 `CursorTracker` 类通过 diff 推断光标位置，新增 `getWordAtPosition`/`replaceWordAtPosition` 替代旧函数，在 `extension.js` 的 QuickPick 生命周期中集成 tracker。

**Tech Stack:** 纯 JavaScript（CommonJS），Node.js assert 测试，VSCode QuickPick API

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/commands/expression-converter.js` | 修改 | 新增 CursorTracker 类 + getWordAtPosition + replaceWordAtPosition；移除旧的 getLastWordPrefix/replaceLastWord；更新导出 |
| `src/extension.js` | 修改 | registerConvertCommand 内集成 CursorTracker，替换旧 API 调用 |
| `tests/test-expression-quickpick.js` | 修改 | 替换旧测试用例为新的 CursorTracker + getWordAtPosition + replaceWordAtPosition 测试 |

---

### Task 1: CursorTracker 类 — 测试

**Files:**
- Modify: `tests/test-expression-quickpick.js:1-13`（导入区）

- [ ] **Step 1: 编写 CursorTracker 测试用例**

在 `tests/test-expression-quickpick.js` 中，将导入行改为：

```javascript
const {
    CursorTracker,
    getWordAtPosition,
    replaceWordAtPosition,
    parseHistoryInput,
} = require('../src/commands/expression-converter');
```

删除所有旧的 `getLastWordPrefix` 和 `replaceLastWord` 测试块（第 15-71 行），替换为：

```javascript
// ─── CursorTracker ──────────────────────────
console.log('\nCursorTracker:');

test('空值首次 update 返回 0', () => {
    const t = new CursorTracker();
    assert.strictEqual(t.update(''), 0);
    t.reset();
});

test('从空到 "A" 光标在 1', () => {
    const t = new CursorTracker();
    t.update('');
    assert.strictEqual(t.update('A'), 1);
    t.reset();
});

test('末尾追加 "+B" 光标在末尾', () => {
    const t = new CursorTracker();
    t.update('A');
    assert.strictEqual(t.update('A+B'), 3);
    t.reset();
});

test('中间插入 — 先输入 B 再前面加 A+', () => {
    const t = new CursorTracker();
    t.update('B');
    assert.strictEqual(t.update('A+B'), 2);
    t.reset();
});

test('删除中间字符', () => {
    const t = new CursorTracker();
    t.update('A+B+C');
    assert.strictEqual(t.update('A+C'), 2);
    t.reset();
});

test('粘贴替换整段 fallback 到末尾', () => {
    const t = new CursorTracker();
    t.update('short');
    assert.strictEqual(t.update('completely different text'), 'completely different text'.length);
    t.reset();
});

test('undo 场景 — A+B+C 恢复为 A+C', () => {
    const t = new CursorTracker();
    t.update('A+C');
    t.update('A+B+C');
    assert.strictEqual(t.update('A+C'), 2);
    t.reset();
});

test('sync 不推断光标但更新内部状态', () => {
    const t = new CursorTracker();
    t.update('A+B');
    t.sync('XY'); // 程序化设值，不推断
    // 下一次手动编辑应基于 "XY" 做 diff
    assert.strictEqual(t.update('XY+Z'), 3);
    t.reset();
});

test('reset 后恢复初始状态', () => {
    const t = new CursorTracker();
    t.update('something');
    t.reset();
    assert.strictEqual(t.update(''), 0);
});

// ─── getWordAtPosition ─────────────────────
console.log('\ngetWordAtPosition:');

test('末尾标识符匹配旧行为', () => {
    const w = getWordAtPosition('W + Wid', 7);
    assert.deepStrictEqual(w, { prefix: 'Wid', start: 4, end: 7 });
});

test('中间标识符提取', () => {
    const w = getWordAtPosition('A+B', 1); // 光标在 A 之后
    assert.deepStrictEqual(w, { prefix: 'A', start: 0, end: 1 });
});

test('光标在非标识符位置返回 null', () => {
    const w = getWordAtPosition('a + ', 3);
    assert.strictEqual(w, null);
});

test('空字符串返回 null', () => {
    const w = getWordAtPosition('', 0);
    assert.strictEqual(w, null);
});

test('开头标识符', () => {
    const w = getWordAtPosition('Width', 3);
    assert.deepStrictEqual(w, { prefix: 'Wid', start: 0, end: 5 });
});

test('括号内标识符', () => {
    const w = getWordAtPosition('sin(W', 5);
    assert.deepStrictEqual(w, { prefix: 'W', start: 4, end: 5 });
});

test('逗号后标识符的部分前缀', () => {
    const w = getWordAtPosition('max(a, b, Wi', 13);
    assert.deepStrictEqual(w, { prefix: 'Wi', start: 11, end: 13 });
});

test('@ 开头标识符（SWB 参数）', () => {
    const w = getWordAtPosition('@W@ + @L', 8);
    assert.deepStrictEqual(w, { prefix: '@L', start: 7, end: 9 });
});

// ─── replaceWordAtPosition ──────────────────
console.log('\nreplaceWordAtPosition:');

test('替换中间词', () => {
    const wordInfo = { prefix: 'A', start: 0, end: 1 };
    assert.strictEqual(replaceWordAtPosition('A+B', wordInfo, 'Width'), 'Width+B');
});

test('替换末尾词保留运算符', () => {
    const wordInfo = { prefix: 'Wid', start: 4, end: 7 };
    assert.strictEqual(replaceWordAtPosition('W + Wid', wordInfo, 'Width'), 'W + Width');
});

test('替换不截断后续内容', () => {
    const wordInfo = { prefix: 'A', start: 0, end: 1 };
    assert.strictEqual(replaceWordAtPosition('A+B+C', wordInfo, 'X'), 'X+B+C');
});

test('替换括号内词', () => {
    const wordInfo = { prefix: 'Wid', start: 4, end: 7 };
    assert.strictEqual(replaceWordAtPosition('sin(Wid', wordInfo, 'Width'), 'sin(Width');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-expression-quickpick.js`
Expected: FAIL — `CursorTracker is not a constructor` / `getWordAtPosition is not defined`

---

### Task 2: 实现 CursorTracker + getWordAtPosition + replaceWordAtPosition

**Files:**
- Modify: `src/commands/expression-converter.js:431-469`

- [ ] **Step 3: 替换 expression-converter.js 中的辅助函数区**

将 `src/commands/expression-converter.js` 第 431-469 行替换为：

```javascript
// ────────────────────────────────────────────
// QuickPick 辅助函数（变量补全 + 历史模式）
// ────────────────────────────────────────────

class CursorTracker {
    constructor() {
        this._prevValue = '';
    }

    update(newValue) {
        const cursor = this._inferCursor(this._prevValue, newValue);
        this._prevValue = newValue;
        return cursor;
    }

    sync(value) {
        this._prevValue = value;
    }

    reset() {
        this._prevValue = '';
    }

    _inferCursor(oldVal, newVal) {
        if (oldVal === newVal) return newVal.length;

        let prefixLen = 0;
        const minLen = Math.min(oldVal.length, newVal.length);
        while (prefixLen < minLen && oldVal[prefixLen] === newVal[prefixLen]) {
            prefixLen++;
        }

        const oldRem = oldVal.length - prefixLen;
        const newRem = newVal.length - prefixLen;
        let suffixLen = 0;
        while (suffixLen < oldRem && suffixLen < newRem &&
               oldVal[oldVal.length - 1 - suffixLen] === newVal[newVal.length - 1 - suffixLen]) {
            suffixLen++;
        }

        return newVal.length - suffixLen;
    }
}

const IDENT_CHAR_RE = /[a-zA-Z0-9_@]/;

function getWordAtPosition(value, cursorPos) {
    let start = cursorPos;
    while (start > 0 && IDENT_CHAR_RE.test(value[start - 1])) start--;

    let end = cursorPos;
    while (end < value.length && IDENT_CHAR_RE.test(value[end])) end++;

    if (start === end) return null;

    return { prefix: value.slice(start, cursorPos), start, end };
}

function replaceWordAtPosition(value, wordInfo, replacement) {
    return value.slice(0, wordInfo.start) + replacement + value.slice(wordInfo.end);
}

function parseHistoryInput(value) {
    if (!value.startsWith('!')) return null;
    const rest = value.slice(1);
    if (rest === '') return { mode: 'history', index: null, filter: '' };
    // "!3" → 精确序号（纯数字）
    const numMatch = rest.match(/^(\d+)$/);
    if (numMatch) return { mode: 'history', index: parseInt(numMatch[1], 10), filter: '' };
    // "! text" 或 "!abc" → 模糊过滤
    const filter = rest.startsWith(' ') ? rest.slice(1) : rest;
    return { mode: 'history', index: null, filter };
}

module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators,
    CursorTracker,
    getWordAtPosition,
    replaceWordAtPosition,
    parseHistoryInput,
};
```

注意：`TRAILING_IDENT_RE` 常量被删除（不再使用）。`getLastWordPrefix` 和 `replaceLastWord` 不再导出。

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-expression-quickpick.js`
Expected: 全部 PASS

- [ ] **Step 5: 运行全量测试确认无回归**

Run: `node tests/test-expression-converter.js`
Expected: 全部 PASS（此文件不涉及 QuickPick 辅助函数，不应受影响）

- [ ] **Step 6: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-quickpick.js
git commit -m "feat(expr): 光标位置感知补全 — CursorTracker + 新 API"
```

---

### Task 3: 集成到 extension.js QuickPick

**Files:**
- Modify: `src/extension.js:701-851`（registerConvertCommand 函数内部）

- [ ] **Step 7: 修改 updateItems 函数使用 CursorTracker**

在 `registerConvertCommand` 内部（约第 725 行 `let _updatingValue = false;` 之后）添加：

```javascript
const tracker = new expressionConverter.CursorTracker();
let _lastWordInfo = null;
```

将 `updateItems` 函数（约第 733-797 行）中的非历史分支：

```javascript
const prefix = expressionConverter.getLastWordPrefix(value).toLowerCase();

if (userVars.length > 0 && prefix) {
    const variables = userVars.filter(d => d.kind === 'variable' && d.name.toLowerCase().startsWith(prefix));
    const parameters = userVars.filter(d => d.kind === 'parameter' && d.name.toLowerCase().startsWith(prefix));
```

替换为：

```javascript
if (_updatingValue) { tracker.sync(value); return; }
const cursor = tracker.update(value);
_lastWordInfo = expressionConverter.getWordAtPosition(value, cursor);
const prefix = _lastWordInfo ? _lastWordInfo.prefix.toLowerCase() : '';
```

同时将 `updateItems` 函数开头原有的 `if (_updatingValue) return;` 删除（已由上面的逻辑接管）。

完整的非历史分支变为：

```javascript
} else {
    if (qp.title !== promptText) qp.title = promptText;
    const cursor = tracker.update(value);
    _lastWordInfo = expressionConverter.getWordAtPosition(value, cursor);
    const prefix = _lastWordInfo ? _lastWordInfo.prefix.toLowerCase() : '';

    if (userVars.length > 0 && prefix) {
        const variables = userVars.filter(d => d.kind === 'variable' && d.name.toLowerCase().startsWith(prefix));
        const parameters = userVars.filter(d => d.kind === 'parameter' && d.name.toLowerCase().startsWith(prefix));
        const shown = [...variables, ...parameters];
        if (shown.length > 0) {
            items.push({ label: '用户变量', kind: vscode.QuickPickItemKind.Separator });
            for (const v of shown) {
                items.push({
                    label: v.name,
                    description: `${v.kind}, 第${v.line}行`,
                    detail: v.definitionText ? v.definitionText.substring(0, 80) : undefined,
                    alwaysShow: true,
                    _varName: v.name,
                });
            }
        }
    }
}
```

- [ ] **Step 8: 修改变量选中替换逻辑**

将 `onDidAccept` 中选中变量的分支（约第 806-813 行）：

```javascript
if (selected && selected._varName) {
    _updatingValue = true;
    const newVal = expressionConverter.replaceLastWord(qp.value, selected._varName);
    qp.value = newVal;
    _updatingValue = false;
    updateItems(newVal);
    return;
}
```

替换为：

```javascript
if (selected && selected._varName) {
    _updatingValue = true;
    const newVal = _lastWordInfo
        ? expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, selected._varName)
        : qp.value + selected._varName;
    qp.value = newVal;
    tracker.sync(newVal);
    _updatingValue = false;
    updateItems(newVal);
    return;
}
```

- [ ] **Step 9: 在 onDidHide 中 reset tracker**

将：

```javascript
qp.onDidHide(() => qp.dispose());
```

替换为：

```javascript
qp.onDidHide(() => { tracker.reset(); qp.dispose(); });
```

- [ ] **Step 10: 运行全量测试**

Run: `node tests/test-expression-quickpick.js && node tests/test-expression-converter.js`
Expected: 全部 PASS

- [ ] **Step 11: 提交**

```bash
git add src/extension.js
git commit -m "feat(expr): QuickPick 集成光标位置感知补全"
```

---

### Task 4: 清理残留引用

**Files:**
- Check: 整个 `src/` 目录

- [ ] **Step 12: 搜索旧 API 的残留引用**

Run: `grep -rn "getLastWordPrefix\|replaceLastWord\|TRAILING_IDENT_RE" src/ tests/`
Expected: 无结果。如果有残留，逐一替换为新 API。

- [ ] **Step 13: 最终全量测试**

Run: `node tests/test-expression-quickpick.js && node tests/test-expression-converter.js`
Expected: 全部 PASS
