# SPROCESS Unit 自动配对实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SPROCESS 语言中，当紧邻 `constant.numeric` scope 位置输入 `<` 时，自动补全 `>` 并将光标放在中间。

**Architecture:** 新增 `unit-auto-close-provider.js`，导出 `activate(context)` 函数，注册 `onDidChangeTextDocument` 事件监听器。当检测到插入 `<` 且前一位置为 `constant.numeric` scope 时，用 `SnippetString` 插入 `>$0`。由 `extension.js` 在 SPROCESS 语言上下文中调用注册。

**Tech Stack:** VSCode Extension API（`workspace.onDidChangeTextDocument`、`SnippetString`、`TokenInformation`），纯 CommonJS。

---

### Task 1: 核心判定函数与单元测试

**Files:**
- Create: `src/lsp/providers/unit-auto-close-provider.js`
- Create: `tests/test-unit-auto-close.js`

- [ ] **Step 1: 编写失败测试**

创建 `tests/test-unit-auto-close.js`，测试核心判定逻辑：

```javascript
const assert = require('assert');
const { shouldTrigger } = require('../src/lsp/providers/unit-auto-close-provider');

// --- shouldTrigger 判定函数测试 ---

// 基本场景：变更文本必须是单个 '<'
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }), false,
    '仅有 text=< 不够，还需要 scope 信息');
assert.strictEqual(shouldTrigger({ text: '<<', rangeLength: 0 }, []), false,
    '非单字符不触发');
assert.strictEqual(shouldTrigger({ text: 'x', rangeLength: 0 }, []), false,
    '非 < 字符不触发');

// scope 判定：scopes 数组中必须包含 'constant.numeric'
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'constant.numeric']), true,
    'constant.numeric scope 应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'keyword.other']), false,
    '非 constant.numeric scope 不触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, ['source.sprocess', 'constant.numeric.other']), true,
    'scope 前缀匹配 constant.numeric 也应触发');
assert.strictEqual(shouldTrigger({ text: '<', rangeLength: 0 }, []), false,
    '空 scopes 不触发');

console.log('All unit-auto-close tests passed!');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-unit-auto-close.js`
Expected: FAIL — `shouldTrigger` 不存在

- [ ] **Step 3: 实现核心判定函数**

创建 `src/lsp/providers/unit-auto-close-provider.js`：

```javascript
const vscode = require('vscode');

/**
 * 判断当前变更是否应触发 Unit 自动配对。
 *
 * @param {{ text: string, rangeLength: number }} change - contentChanges 条目
 * @param {string[]} scopes - '<' 前一位置的 TextMate scopes
 * @returns {boolean}
 */
function shouldTrigger(change, scopes) {
    if (!change || change.text !== '<') return false;
    if (!scopes || scopes.length === 0) return false;
    return scopes.some(s => s === 'constant.numeric' || s.startsWith('constant.numeric.'));
}

let _applying = false;

/**
 * 注册 SPROCESS Unit 自动配对 provider。
 * 当在 constant.numeric scope 后输入 < 时，自动补全 > 并将光标放在中间。
 */
function activate(context) {
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange)
    );
}

function onDocumentChange(event) {
    if (_applying) return;
    if (event.document.languageId !== 'sprocess') return;

    const change = event.contentChanges[0];
    if (!change || change.text !== '<') return;

    // 获取 '<' 前一位置的 token scope
    const pos = change.range.start;
    if (pos.character === 0) return; // 行首不可能紧邻数字

    const prevPos = new vscode.Position(pos.line, pos.character - 1);
    const token = event.document.getTokenAtPosition(prevPos);
    if (!token) return;

    if (!shouldTrigger(change, token.scopes)) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    // 在 '<' 之后插入 '>'，光标在中间（$0）
    const insertPos = new vscode.Position(pos.line, pos.character + 1);
    _applying = true;
    editor.insertSnippet(new vscode.SnippetString('$0>'), insertPos).then(() => {
        _applying = false;
    }, () => {
        _applying = false;
    });
}

module.exports = { activate, shouldTrigger };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-unit-auto-close.js`
Expected: `All unit-auto-close tests passed!`

- [ ] **Step 5: 提交**

```bash
git add src/lsp/providers/unit-auto-close-provider.js tests/test-unit-auto-close.js
git commit -m "feat(sprocess): 添加 Unit 自动配对核心判定逻辑与测试"
```

---

### Task 2: 注册到 extension.js

**Files:**
- Modify: `src/extension.js:16` (新增 require)
- Modify: `src/extension.js:386` (在 SDE onEnter 之后注册)

- [ ] **Step 1: 添加 require**

在 `src/extension.js` 顶部 require 区域（第 16 行 `schemeOnEnterProvider` 之后）添加：

```javascript
const unitAutoClose = require('./lsp/providers/unit-auto-close-provider');
```

- [ ] **Step 2: 注册 provider**

在 `extension.js` 的 `activate()` 函数中，找到第 386 行附近的 `schemeOnEnterProvider.activate(context)` 调用，在其后添加：

```javascript
    // Unit 自动配对（SPROCESS only）
    unitAutoClose.activate(context);
```

- [ ] **Step 3: 验证扩展加载**

Run: `node -e "require('./src/extension.js'); console.log('OK')"`
Expected: `OK`（无语法错误）

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat(sprocess): 注册 Unit 自动配对 provider"
```

---

### Task 3: 手动集成测试

**Files:**
- Modify: `display_test/test_fps.cmd`（添加注释说明）

- [ ] **Step 1: 在测试文件中添加验证说明**

在 `display_test/test_fps.cmd` 文件末尾添加注释，提醒测试人员验证自动配对行为：

```tcl
# === Unit 自动配对测试 ===
# 在以下数字后输入 < 应自动补全 >，光标在中间：
# 10|<nm>      → 输入 < 后得到 10<|>
# 0.5<um>     → 输入 < 后得到 0.5<|>
# 1e15<cm-2>  → 输入 < 后得到 1e15<|>
# 900<C>      → 输入 < 后得到 900<|>
#
# 以下场景不应触发：
# if {$x < $y}     → < 前是空格，不触发
# "text<field>"    → 字符串内，不触发
# # comment <      → 注释内，不触发
```

- [ ] **Step 2: 在 Extension Development Host 中验证**

1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/test_fps.cmd`
3. 测试触发场景：在数字后输入 `<`，确认自动补全 `>` 且光标在中间
4. 测试不触发场景：在空格、变量名后输入 `<`，确认不补全
5. 测试撤销（Ctrl+Z）：确认撤销后恢复到输入 `<` 前的状态

- [ ] **Step 3: 提交**

```bash
git add display_test/test_fps.cmd
git commit -m "test(sprocess): 添加 Unit 自动配对手动测试说明"
```
