# SPROCESS Unit 空尖括号删除配对 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SPROCESS 文件中，当光标在空的 `Numeric<|>` 位置按退格删除 `<` 时，连带删除 `>`。

**Architecture:** 扩展现有 `unit-auto-close-logic.js` 和 `unit-auto-close-provider.js`，新增 `shouldDelete` 纯函数，在 provider 的 `onDocumentChange` 中增加删除检测分支。

**Tech Stack:** 纯 JavaScript (CommonJS)、VSCode Extension API (`workspace.onDidChangeTextDocument`)、Node.js `assert` 测试

---

### Task 1: 编写 shouldDelete 纯函数测试（TDD 红灯）

**Files:**
- Modify: `tests/test-unit-auto-close.js`

- [ ] **Step 1: 在测试文件末尾（`console.log` 之前）添加 shouldDelete 测试**

在 `// Tcl 比较运算符不触发` 区块之后、`console.log` 之前，插入新的测试区块：

```javascript
// --- shouldDelete 判定函数测试 ---
const { shouldDelete } = require('../src/lsp/providers/unit-auto-close-logic');

// 基本场景：参数校验
assert.strictEqual(shouldDelete(null, '10', '>'), false,
    'null change 不触发删除');
assert.strictEqual(shouldDelete(undefined, '10', '>'), false,
    'undefined change 不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, null, '>'), false,
    'null linePrefix 不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '', '>'), false,
    '空 linePrefix 不触发删除');

// 删除操作必须是 text='' 且 rangeLength=1
assert.strictEqual(shouldDelete({ text: '<', rangeLength: 0 }, '10', '>'), false,
    '插入操作不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 2 }, '10', '>'), false,
    '删除多字符不触发删除');
assert.strictEqual(shouldDelete({ text: 'x', rangeLength: 1 }, '10', '>'), false,
    '替换操作不触发删除');

// 光标后必须是 '>'
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '10', 'x'), false,
    '光标后非 > 不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '10', ''), false,
    '光标后无字符不触发删除');

// 应触发：数字后的空 <>
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'spacing= 10', '>'), true,
    '整数 10 后空 <> 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'location= 0.5', '>'), true,
    '小数 0.5 后空 <> 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'dose= 1e15', '>'), true,
    '科学计数法 1e15 后空 <> 应触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'temperature= 900', '>'), true,
    '整数 900 后空 <> 应触发删除');

// 不触发：非数字前
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set Var1', '>'), false,
    'Var1 后不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'set x2', '>'), false,
    'x2 后不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'foo bar123', '>'), false,
    'bar123 后不触发删除');

// 不触发：字符串/Tcl 语法
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, '"text', '>'), false,
    '字符串内不触发删除');
assert.strictEqual(shouldDelete({ text: '', rangeLength: 1 }, 'if {$x ', '>'), false,
    'Tcl 比较运算符不触发删除');
```

- [ ] **Step 2: 运行测试，验证红灯（shouldDelete 未导出）**

Run: `node tests/test-unit-auto-close.js`
Expected: FAIL — `TypeError: ... shouldDelete is not a function` 或 `Cannot destructure property 'shouldDelete'`

---

### Task 2: 实现 shouldDelete 纯函数（TDD 绿灯）

**Files:**
- Modify: `src/lsp/providers/unit-auto-close-logic.js`

- [ ] **Step 1: 在 `shouldTrigger` 函数之后、`module.exports` 之前添加 `shouldDelete` 函数**

在 `unit-auto-close-logic.js` 中，`module.exports = { shouldTrigger };` 之前插入：

```javascript
/**
 * 判断当前删除变更是否应触发 Unit 空括号删除配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * 触发条件：用户在 Numeric<|> 位置按退格删除 <，
 * 此函数检测删除后的文档状态来推断场景：
 * - change.text === '' && rangeLength === 1 → 单字符删除
 * - charAfter === '>' → 光标后紧跟 >（空括号）
 * - linePrefix 匹配 constant.numeric → < 前是数字
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string | null | undefined} linePrefix - 删除位置到行首的文本
 * @param {string | null | undefined} charAfter - 删除位置后的第一个字符
 * @returns {boolean}
 */
function shouldDelete(change, linePrefix, charAfter) {
    if (!change || change.text !== '' || change.rangeLength !== 1) return false;
    if (charAfter !== '>') return false;
    if (!linePrefix) return false;
    return /\b(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(linePrefix);
}
```

- [ ] **Step 2: 更新 module.exports 导出 shouldDelete**

将：
```javascript
module.exports = { shouldTrigger };
```
改为：
```javascript
module.exports = { shouldTrigger, shouldDelete };
```

- [ ] **Step 3: 运行测试，验证绿灯**

Run: `node tests/test-unit-auto-close.js`
Expected: `All unit-auto-close tests passed!`

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/unit-auto-close-logic.js tests/test-unit-auto-close.js
git commit -m "feat(sprocess): 添加 Unit 空括号删除配对判定逻辑与测试"
```

---

### Task 3: 更新 Provider 添加删除检测分支

**Files:**
- Modify: `src/lsp/providers/unit-auto-close-provider.js`

- [ ] **Step 1: 更新 require 引入 shouldDelete**

将第 2 行：
```javascript
const { shouldTrigger } = require('./unit-auto-close-logic');
```
改为：
```javascript
const { shouldTrigger, shouldDelete } = require('./unit-auto-close-logic');
```

- [ ] **Step 2: 在 onDocumentChange 函数中添加删除检测分支**

在 `onDocumentChange` 函数中，现有的 `if (!change || change.text !== '<') return;` 这行检查需要被替换为双分支逻辑。

将整个 `onDocumentChange` 函数体（从 `function onDocumentChange(event) {` 到对应的 `}`）替换为：

```javascript
function onDocumentChange(event) {
    if (_applying) return;
    if (event.document.languageId !== 'sprocess') return;

    const change = event.contentChanges[0];
    if (!change) return;

    const pos = change.range.start;
    const line = event.document.lineAt(pos.line).text;

    if (change.text === '<' && change.rangeLength === 0) {
        // 自动补全：数字后输入 < → 插入 >
        if (pos.character === 0) return;
        const linePrefix = line.substring(0, pos.character);

        if (!shouldTrigger(change, linePrefix)) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;

        const insertPos = new vscode.Position(pos.line, pos.character + 1);
        _applying = true;
        editor.insertSnippet(new vscode.SnippetString('$0>'), insertPos).then(() => {
            _applying = false;
        }, () => {
            _applying = false;
        });
    } else if (change.text === '' && change.rangeLength === 1) {
        // 删除配对：数字后空 <> 中退格删除 < → 连带删除 >
        const linePrefix = line.substring(0, pos.character);
        const charAfter = line.charAt(pos.character);

        if (!shouldDelete(change, linePrefix, charAfter)) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;

        const deleteRange = new vscode.Range(pos, new vscode.Position(pos.line, pos.character + 1));
        _applying = true;
        editor.edit(builder => builder.delete(deleteRange)).then(() => {
            _applying = false;
        }, () => {
            _applying = false;
        });
    }
}
```

- [ ] **Step 3: 运行测试确认无回归**

Run: `node tests/test-unit-auto-close.js`
Expected: `All unit-auto-close tests passed!`

- [ ] **Step 4: 提交**

```bash
git add src/lsp/providers/unit-auto-close-provider.js
git commit -m "feat(sprocess): 实现 Unit 空括号删除配对 Provider"
```

---

### Task 4: F5 测试验证

- [ ] **Step 1: 在 VSCode 中按 F5 启动 Extension Development Host**

- [ ] **Step 2: 打开 `display_test/test_fps.cmd`（确保语言识别为 SPROCESS）**

- [ ] **Step 3: 测试自动补全仍正常工作**

在数字后输入 `<`，验证自动补全 `>`：
- `10` → 输入 `<` → 得到 `10<|>` ✓
- `0.5` → 输入 `<` → 得到 `0.5<|>` ✓

- [ ] **Step 4: 测试删除配对新功能**

在空的 `Numeric<|>` 位置按退格：
- `10<|>` → 退格 → 得到 `10|` ✓（`>` 也被删除）
- `0.5<|>` → 退格 → 得到 `0.5|` ✓
- `1e15<|>` → 退格 → 得到 `1e15|` ✓

- [ ] **Step 5: 测试非空括号不触发**

在已有内容的括号中退格：
- `10<nm>` → 光标在 `n` 前退格 → 得到 `10nm>` ✓（只删 `<`，`>` 保留）
- `10<|nm>` → 退格 → 得到 `10|nm>` ✓（只删 `<`，因为 `charAfter` 是 `n` 不是 `>`）

- [ ] **Step 6: 测试非数字后不触发**

- `Var1<|>` → 退格 → 得到 `Var1|` ✓（`>` 保留，不触发删除配对）

---

## 自我审查清单

- [x] **Spec 覆盖**: 所有 4 个触发条件、4 个触发场景、4 个不触发场景均有对应步骤
- [x] **占位符扫描**: 无 TBD/TODO，所有代码步骤包含完整实现
- [x] **类型一致性**: `shouldDelete` 签名在 Task 1（测试）和 Task 2（实现）中一致：`(change, linePrefix, charAfter)` → `boolean`
