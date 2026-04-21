# 表达式转换命令用户变量补全 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SDE 文件的表达式转换命令 QuickPick 中添加用户变量实时补全和 `!` 历史模式。

**Architecture:** 将纯函数（`getLastWordPrefix`、`replaceLastWord`、`parseHistoryInput`）添加到 `expression-converter.js`，便于单元测试。`registerConvertCommand` 重写为 `createQuickPick` 驱动的交互流程，按输入内容动态切换变量模式和历史模式。

**Tech Stack:** VSCode Extension API (`createQuickPick`、`QuickPickItemKind`), 现有 `definitions.js` 的 `getDefinitions` API

---

### Task 1: 添加并测试纯函数（TDD）

**Files:**
- Modify: `src/commands/expression-converter.js` — 末尾添加 3 个导出函数
- Create: `tests/test-expression-quickpick.js` — 测试文件

- [ ] **Step 1: 编写测试文件**

```js
// tests/test-expression-quickpick.js
const assert = require('assert');
const {
    getLastWordPrefix,
    replaceLastWord,
    parseHistoryInput,
} = require('../src/commands/expression-converter');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── getLastWordPrefix ────────────────────
console.log('\ngetLastWordPrefix:');

test('提取简单标识符前缀', () => {
    assert.strictEqual(getLastWordPrefix('W + Wid'), 'Wid');
});

test('空字符串返回空', () => {
    assert.strictEqual(getLastWordPrefix(''), '');
});

test('光标在运算符后返回空', () => {
    assert.strictEqual(getLastWordPrefix('a + '), '');
});

test('开头就是标识符', () => {
    assert.strictEqual(getLastWordPrefix('Width'), 'Width');
});

test('括号后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('sin(W'), 'W');
});

test('逗号后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('max(a, b, Wi'), 'Wi');
});

test('多个运算符后的标识符', () => {
    assert.strictEqual(getLastWordPrefix('a * b + Wid'), 'Wid');
});

test('@ 开头的标识符（SWB 参数）', () => {
    assert.strictEqual(getLastWordPrefix('@W@ + @L'), '@L');
});

// ─── replaceLastWord ──────────────────────
console.log('\nreplaceLastWord:');

test('替换最后一个词', () => {
    assert.strictEqual(replaceLastWord('W + Wid', 'Width'), 'W + Width');
});

test('空值直接追加', () => {
    assert.strictEqual(replaceLastWord('', 'Width'), 'Width');
});

test('没有标识符时追加', () => {
    assert.strictEqual(replaceLastWord('a + ', 'Width'), 'a + Width');
});

test('替换开头标识符', () => {
    assert.strictEqual(replaceLastWord('Wid', 'Width'), 'Width');
});

test('括号内替换', () => {
    assert.strictEqual(replaceLastWord('sin(Wid', 'Width'), 'sin(Width');
});

// ─── parseHistoryInput ────────────────────
console.log('\nparseHistoryInput:');

test('非历史模式返回 null', () => {
    assert.strictEqual(parseHistoryInput('W + L'), null);
});

test('空字符串返回 null', () => {
    assert.strictEqual(parseHistoryInput(''), null);
});

test('! 返回全部历史', () => {
    const r = parseHistoryInput('!');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: '' });
});

test('!3 返回精确序号', () => {
    const r = parseHistoryInput('!3');
    assert.deepStrictEqual(r, { mode: 'history', index: 3, filter: '' });
});

test('! W + L 返回过滤模式', () => {
    const r = parseHistoryInput('! W + L');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'W + L' });
});

test('!30 超范围序号仍返回解析结果', () => {
    const r = parseHistoryInput('!30');
    assert.deepStrictEqual(r, { mode: 'history', index: 30, filter: '' });
});

test('!0 返回 0 序号', () => {
    const r = parseHistoryInput('!0');
    assert.deepStrictEqual(r, { mode: 'history', index: 0, filter: '' });
});

test('!abc 无空格按模糊匹配处理', () => {
    const r = parseHistoryInput('!abc');
    assert.deepStrictEqual(r, { mode: 'history', index: null, filter: 'abc' });
});

// ─── Summary ──────────────────────────────
console.log(`\n${'='.repeat(40)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-expression-quickpick.js`
Expected: FAIL — 函数未导出

- [ ] **Step 3: 在 `expression-converter.js` 末尾实现 3 个函数**

在 `module.exports = { ... }` 之前添加：

```js
// ────────────────────────────────────────────
// QuickPick 辅助函数（变量补全 + 历史模式）
// ────────────────────────────────────────────

function getLastWordPrefix(value) {
    const match = value.match(/([a-zA-Z_@][a-zA-Z0-9_@]*)$/);
    return match ? match[1] : '';
}

function replaceLastWord(value, replacement) {
    const match = value.match(/([a-zA-Z_@][a-zA-Z0-9_@]*)$/);
    if (match) {
        return value.slice(0, match.index) + replacement;
    }
    return value + replacement;
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
```

在 `module.exports` 中添加导出：

```js
module.exports = {
    prefixToInfix,
    infixToPrefix,
    getSupportedOperators,
    getLastWordPrefix,
    replaceLastWord,
    parseHistoryInput,
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-expression-quickpick.js`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add tests/test-expression-quickpick.js src/commands/expression-converter.js
git commit -m "feat: 添加 QuickPick 变量补全和历史模式的纯函数及测试"
```

---

### Task 2: 重写 `registerConvertCommand` 为 `createQuickPick`

**Files:**
- Modify: `src/extension.js:663-724` — 完整替换 `registerConvertCommand` 函数体
- Modify: `src/extension.js` 顶部 — 确认 `defs` 已 require

- [ ] **Step 1: 确认 `defs` 和 `expressionConverter` 导入**

`src/extension.js` 顶部应已有：

```js
const defs = require('./definitions');
const expressionConverter = require('./commands/expression-converter');
```

确认 `expressionConverter` 解构导入是否包含新函数。如果没有解构则无需修改（当前是整体 require）。

- [ ] **Step 2: 替换 `registerConvertCommand` 函数体**

将 `src/extension.js:663-724` 的 `registerConvertCommand` 函数替换为：

```js
    function registerConvertCommand(commandId, convertFn, promptText, placeHolder) {
        return vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.selection : null;
            const selectedText = selection && !selection.isEmpty ? editor.document.getText(selection) : '';

            if (selectedText) {
                const { result, error } = convertFn(selectedText);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }
                editor.edit(builder => {
                    builder.replace(selection, result);
                });
                return;
            }

            const history = convertHistories[commandId];
            const isSde = editor && editor.document.languageId === 'sde';
            const userVars = isSde
                ? defs.getDefinitions(editor.document, 'sde')
                    .filter(d => d.kind === 'variable' || d.kind === 'parameter')
                : [];

            const qp = vscode.window.createQuickPick();
            qp.title = promptText;
            qp.placeholder = placeHolder;
            qp.matchOnDescription = false;
            qp.matchOnDetail = false;

            let _updatingValue = false;

            function updateItems(value) {
                if (_updatingValue) return;
                const items = [];
                const histParsed = expressionConverter.parseHistoryInput(value);

                if (histParsed) {
                    // 历史模式：只显示历史记录
                    if (history.length > 0) {
                        items.push({ label: '历史记录', kind: vscode.QuickPickItemKind.Separator });
                        for (let i = 0; i < history.length; i++) {
                            const entry = history[i];
                            if (histParsed.index !== null) {
                                if (i + 1 === histParsed.index) {
                                    items.push({ label: entry, description: `#${i + 1}`, alwaysShow: true, _historyIndex: i });
                                }
                            } else {
                                const filter = histParsed.filter.toLowerCase();
                                if (!filter || entry.toLowerCase().includes(filter)) {
                                    items.push({ label: entry, description: `#${i + 1}`, _historyIndex: i });
                                }
                            }
                        }
                    }
                } else {
                    // 默认模式：变量优先 + 历史
                    const prefix = expressionConverter.getLastWordPrefix(value).toLowerCase();

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
                                    _varName: v.name,
                                });
                            }
                        }
                    }

                    if (history.length > 0) {
                        items.push({ label: '最近使用 — 输入 ! 进入历史模式', kind: vscode.QuickPickItemKind.Separator });
                        for (const h of history) {
                            items.push({ label: h, _historyValue: h });
                        }
                    }
                }

                qp.items = items;
            }

            qp.onDidChangeValue(updateItems);
            updateItems('');

            qp.onDidAccept(() => {
                const selected = qp.selectedItems[0];
                let finalValue;

                if (selected && selected._varName) {
                    // 选中变量：替换最后一个词后继续输入（不关闭）
                    _updatingValue = true;
                    const newVal = expressionConverter.replaceLastWord(qp.value, selected._varName);
                    qp.value = newVal;
                    _updatingValue = false;
                    updateItems(newVal);
                    return; // 保持 QuickPick 打开
                }

                if (selected && selected._historyIndex !== undefined) {
                    // 历史模式选中项
                    finalValue = history[selected._historyIndex];
                } else if (selected && selected._historyValue) {
                    // 默认模式选中历史项
                    finalValue = selected._historyValue;
                } else {
                    // 无选中，取输入值
                    const raw = qp.value;
                    const histParsed = expressionConverter.parseHistoryInput(raw);
                    finalValue = histParsed ? raw.slice(1).trim() : raw.trim();
                }

                qp.hide();

                if (!finalValue) return;

                const { result, error } = convertFn(finalValue);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }

                // 保存到历史（去重）
                const idx = history.indexOf(finalValue);
                if (idx !== -1) history.splice(idx, 1);
                history.unshift(finalValue);
                if (history.length > 20) history.pop();
                context.globalState.update('convertHistory.' + (commandId === 'sentaurus.scheme2infix' ? 's2i' : 'i2s'), history);

                insertResult(editor, result);
            });

            qp.show();
        });
    }
```

- [ ] **Step 3: 验证旧函数被完全替换**

确认 `src/extension.js` 中不再有 `showInputBox` 调用在 `registerConvertCommand` 内。搜索：

Run: `grep -n "showInputBox\|showQuickPick" src/extension.js`
Expected: 无匹配（或仅在其他不相关的函数中）

- [ ] **Step 4: 手动测试**

1. 打开一个 SDE 文件（含 `define` 变量）
2. 运行 `sentaurus.infix2scheme` 命令
3. 输入 `W + Wi` → 应看到匹配的用户变量
4. 选中变量 → 输入框应替换最后一个词
5. 按 Enter → 转换结果插入编辑器
6. 再次运行命令，输入 `!` → 应只显示历史记录
7. 输入 `!1` → 应只显示 #1
8. 确认非 SDE 文件不显示变量分隔符

- [ ] **Step 5: 提交**

```bash
git add src/extension.js
git commit -m "feat: 表达式转换命令支持用户变量补全和 ! 历史模式"
```

---

### Task 3: 更新 `exprHelp` 命令

**Files:**
- Modify: `src/extension.js:741-785` — `exprHelp` 命令中增加说明项

- [ ] **Step 1: 在 `exprHelp` 的 items 数组末尾（`const selected = await ...` 之前）添加说明项**

在 `items.push({ label: '数学函数 → 函数调用', ... });` 之后、`const selected = await vscode.window.showQuickPick(...)` 之前，插入：

```js
        items.push({ label: '快捷功能', kind: vscode.QuickPickItemKind.Separator });
        items.push({
            label: '$(info) 变量补全与历史模式',
            detail: 'SDE 文件中输入时自动显示用户变量 | 输入 ! 进入历史模式 | !3 直接选 #3 | ! 文本 过滤历史',
            alwaysShow: true,
        });
```

注意：此 item 的 `detail` 不包含 `示例:` 前缀，所以不会被 `exprHelp` 的插入逻辑匹配，选中后不会插入文本，仅作展示。

- [ ] **Step 2: 手动测试**

运行 `sentaurus.exprHelp` → 滚动到底部应看到 "变量补全与历史模式" 说明项。

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "docs: exprHelp 命令添加变量补全与历史模式说明"
```

---

### Task 4: 运行全量测试

- [ ] **Step 1: 运行所有测试确认无回归**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f"; done`
Expected: 全部 PASS

- [ ] **Step 2: 最终提交（如有遗漏修复）**

如有修正，用描述性提交信息提交。无则跳过。
