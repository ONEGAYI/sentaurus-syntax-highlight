# 尖括号连字符变量语法实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在表达式转换器的中缀方向引入 `<var-name>` 语法消除连字符歧义，同时 scheme2infix 方向自动将含连字符的标识符包裹尖括号。

**Architecture:** 词法分析器 `tokenizeInfix` 新增尖括号 token 识别（遇到 `<` 扫描到 `>`，内容作为 IDENT）；`astToInfix` 对含连字符的标识符自动加 `<>` 包裹；`getWordAtPosition` 感知 `<>` 区域实现三种补全插入场景。

**Tech Stack:** 纯 JavaScript（CommonJS），无外部依赖，测试用 Node.js assert。

---

### Task 1: tokenizeInfix 尖括号 token 识别

**Files:**
- Modify: `src/commands/expression-converter.js:159-208`（`tokenizeInfix` 函数）
- Test: `tests/test-expression-converter.js`

- [ ] **Step 1: 写失败测试 — infixToPrefix 尖括号基本转换**

在 `tests/test-expression-converter.js` 的 `infixToPrefix - 边界条件` 段后、`infixToPrefix - 同级运算符展平` 段前，添加新测试组：

```javascript
// ─── infixToPrefix 尖括号连字符变量 ───────────
console.log('\ninfixToPrefix - 尖括号连字符变量:');

test('<my-var> 作为单个标识符', () => {
    const r = infixToPrefix('<my-var> + 1');
    assert.strictEqual(r.result, '(+ my-var 1)');
});

test('<var-name> 参与乘法', () => {
    const r = infixToPrefix('<W-doping> * 2');
    assert.strictEqual(r.result, '(* W-doping 2)');
});

test('混合普通变量和尖括号变量', () => {
    const r = infixToPrefix('a + <my-var> * b');
    assert.strictEqual(r.result, '(+ a (* my-var b))');
});

test('尖括号变量嵌套在函数中', () => {
    const r = infixToPrefix('sin(<my-var>)');
    assert.strictEqual(r.result, '(sin my-var)');
});

test('多个尖括号变量', () => {
    const r = infixToPrefix('<W-doping> + <L-length>');
    assert.strictEqual(r.result, '(+ W-doping L-length)');
});

test('尖括号变量作为幂运算底数', () => {
    const r = infixToPrefix('<my-var> ^ 2');
    assert.strictEqual(r.result, '(expt my-var 2)');
});

test('未闭合尖括号报错', () => {
    const r = infixToPrefix('<my-var + 1');
    assert.ok(r.error);
});

test('嵌套尖括号报错', () => {
    const r = infixToPrefix('<<nested>> + 1');
    assert.ok(r.error);
});

test('空尖括号报错', () => {
    const r = infixToPrefix('<> + 1');
    assert.ok(r.error);
});

test('孤立右尖括号不影响解析', () => {
    const r = infixToPrefix('a + b>');
    // b> 中 > 作为未知字符跳过，结果为 a + b
    assert.strictEqual(r.result, '(+ a b)');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-expression-converter.js`
Expected: 新增测试失败（`<my-var>` 被切为 `IDENT(my)` `OP(-)` `IDENT(var)`）

- [ ] **Step 3: 实现 tokenizeInfix 尖括号识别**

在 `src/commands/expression-converter.js` 的 `tokenizeInfix` 函数中，在数字字面量识别（`if (/[0-9]/.test(ch)...`）之前，添加尖括号识别逻辑：

```javascript
        // 尖括号变量 <var-name>：连字符标识符在中缀表达式中的消歧语法
        if (ch === '<') {
            const contentStart = i + 1;
            let j = contentStart;
            let foundClose = false;
            while (j < text.length) {
                if (text[j] === '>') { foundClose = true; break; }
                if (text[j] === '<') throw new Error(`嵌套尖括号（位置 ${i}）`);
                j++;
            }
            if (!foundClose) throw new Error(`未闭合的尖括号（位置 ${i}）`);
            const content = text.slice(contentStart, j);
            if (content.length === 0) throw new Error(`空尖括号（位置 ${i}）`);
            tokens.push({ type: INFIX_TOKEN_TYPE.IDENT, value: content });
            i = j + 1;
            continue;
        }
```

位置：插入到 `// 多字符运算符` 块之后、`if (/[0-9]/.test(ch)...` 之前（约第 197 行前）。

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-expression-converter.js`
Expected: 所有新增尖括号测试通过，原有测试不受影响

- [ ] **Step 5: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-converter.js
git commit -m "feat(expr): tokenizeInfix 支持尖括号连字符变量 token 识别"
```

---

### Task 2: astToInfix 连字符标识符自动包裹尖括号

**Files:**
- Modify: `src/commands/expression-converter.js:70`（`astToInfix` Identifier 分支）
- Test: `tests/test-expression-converter.js`

- [ ] **Step 1: 写失败测试 — prefixToInfix 连字符标识符输出带尖括号**

在 `tests/test-expression-converter.js` 的 `prefixToInfix - 边界条件` 段后、`infixToPrefix - 基础运算` 段前，添加新测试组：

```javascript
// ─── prefixToInfix 连字符标识符 ───────────────
console.log('\nprefixToInfix - 连字符标识符:');

test('连字符标识符自动包裹尖括号', () => {
    const r = prefixToInfix('(+ my-var 1)');
    assert.strictEqual(r.result, '<my-var> + 1');
});

test('普通标识符不包裹尖括号', () => {
    const r = prefixToInfix('(+ myVar 1)');
    assert.strictEqual(r.result, 'myVar + 1');
});

test('多个连字符标识符', () => {
    const r = prefixToInfix('(+ W-doping L-length)');
    assert.strictEqual(r.result, '<W-doping> + <L-length>');
});

test('连字符标识符在函数中', () => {
    const r = prefixToInfix('(sin my-var)');
    assert.strictEqual(r.result, 'sin(<my-var>)');
});

test('连字符标识符在嵌套表达式中', () => {
    const r = prefixToInfix('(* (+ my-var W) 2)');
    assert.strictEqual(r.result, '(<my-var> + W) * 2');
});

test('单个连字符标识符', () => {
    const r = prefixToInfix('my-var');
    assert.strictEqual(r.result, '<my-var>');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-expression-converter.js`
Expected: 新增测试失败（连字符标识符输出无尖括号包裹）

- [ ] **Step 3: 修改 astToInfix 的 Identifier 处理**

在 `src/commands/expression-converter.js:70`，将：

```javascript
    if (node.type === 'Identifier') return node.value;
```

修改为：

```javascript
    if (node.type === 'Identifier') {
        return /[-!?]/.test(node.value) ? `<${node.value}>` : node.value;
    }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-expression-converter.js`
Expected: 所有连字符标识符测试通过

- [ ] **Step 5: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-converter.js
git commit -m "feat(expr): astToInfix 连字符标识符自动包裹尖括号"
```

---

### Task 3: 往返一致性测试

**Files:**
- Test: `tests/test-expression-converter.js`

- [ ] **Step 1: 写往返测试 — 连字符标识符 infix↔scheme 往返**

在 `tests/test-expression-converter.js` 的 `往返一致性测试` 段末尾（`// ─── 汇总` 之前）添加：

```javascript
test('前缀→中缀→前缀: 连字符标识符加法', () => {
    const original = '(+ my-var W)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 连字符标识符嵌套', () => {
    const original = '(* (+ my-var L-length) 2)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 连字符标识符函数', () => {
    const original = '(sin my-var)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('前缀→中缀→前缀: 混合普通和连字符标识符', () => {
    const original = '(+ W-doping W)';
    const infix = prefixToInfix(original).result;
    const back = infixToPrefix(infix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 尖括号连字符变量', () => {
    const original = '<my-var> + 1';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 多个尖括号变量', () => {
    const original = '<W-doping> + <L-length>';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});

test('中缀→前缀→中缀: 尖括号变量嵌套运算', () => {
    const original = '(<my-var> + W) * 2';
    const prefix = infixToPrefix(original).result;
    const back = prefixToInfix(prefix).result;
    assert.strictEqual(back, original);
});
```

- [ ] **Step 2: 运行全部测试确认通过**

Run: `node tests/test-expression-converter.js`
Expected: 所有测试通过（含新增往返测试）

- [ ] **Step 3: 提交**

```bash
git add tests/test-expression-converter.js
git commit -m "test(expr): 连字符标识符往返一致性测试"
```

---

### Task 4: getWordAtPosition 感知尖括号区域

**Files:**
- Modify: `src/commands/expression-converter.js:476-489`（`IDENT_CHAR_RE` + `getWordAtPosition`）
- Test: `tests/test-expression-quickpick.js`

- [ ] **Step 1: 写失败测试 — getWordAtPosition 尖括号区域识别**

在 `tests/test-expression-quickpick.js` 的 `getWordAtPosition` 段末尾（`replaceWordAtPosition` 段之前）添加：

```javascript
test('尖括号内变量 — 光标在变量中间', () => {
    const result = getWordAtPosition('<my-var> + 1', 4);
    assert.deepStrictEqual(result, { prefix: 'my-', start: 1, end: 7, inAngleBrackets: true });
});

test('尖括号内变量 — 光标在变量开头', () => {
    const result = getWordAtPosition('<my-var> + 1', 1);
    assert.deepStrictEqual(result, { prefix: '', start: 1, end: 7, inAngleBrackets: true });
});

test('尖括号内变量 — 光标在变量末尾', () => {
    const result = getWordAtPosition('<my-var> + 1', 7);
    assert.deepStrictEqual(result, { prefix: 'my-var', start: 1, end: 7, inAngleBrackets: true });
});

test('光标在开括号上 — 视为进入尖括号', () => {
    const result = getWordAtPosition('<my-var> + 1', 0);
    assert.deepStrictEqual(result, { prefix: '', start: 1, end: 7, inAngleBrackets: true });
});

test('光标在闭括号后 — 正常标识符行为', () => {
    // 光标在 > 后的空格上，不在标识符上
    const result = getWordAtPosition('<my-var> + 1', 8);
    assert.strictEqual(result, null);
});

test('开括号后无内容 — 光标在开括号后一位', () => {
    const result = getWordAtPosition('<> + 1', 1);
    // 空尖括号，无有效内容
    assert.strictEqual(result, null);
});

test('光标在普通标识符上 — 不受尖括号影响', () => {
    const result = getWordAtPosition('a + <my-var>', 1);
    assert.strictEqual(result, null);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-expression-quickpick.js`
Expected: 新增测试失败

- [ ] **Step 3: 修改 getWordAtPosition 感知 `<>` 区域**

将 `src/commands/expression-converter.js:476-489` 的 `IDENT_CHAR_RE` 和 `getWordAtPosition` 修改为：

```javascript
const IDENT_CHAR_RE = /[a-zA-Z0-9_@\-]/;

function getWordAtPosition(value, cursorPos) {
    if (cursorPos < 0 || cursorPos > value.length) return null;

    // 检查光标是否在 <...> 区域内（含光标在 < 上）
    let bracketStart = -1;
    for (let i = Math.min(cursorPos, value.length - 1); i >= 0; i--) {
        if (value[i] === '>') break;       // 遇到闭括号说明不在区域内
        if (value[i] === '<') { bracketStart = i; break; }
    }

    if (bracketStart !== -1 && bracketStart < value.length - 1) {
        const contentStart = bracketStart + 1;
        const closeIdx = value.indexOf('>', contentStart);
        if (closeIdx !== -1) {
            const content = value.slice(contentStart, closeIdx);
            if (content.length > 0) {
                // 光标在 <...> 区域内，返回括号内整个区域
                const prefix = value.slice(contentStart, Math.min(cursorPos, closeIdx));
                return { prefix, start: contentStart, end: closeIdx, inAngleBrackets: true };
            }
        }
    }

    // 常规标识符匹配
    let start = cursorPos;
    while (start > 0 && IDENT_CHAR_RE.test(value[start - 1])) start--;

    let end = cursorPos;
    while (end < value.length && IDENT_CHAR_RE.test(value[end])) end++;

    if (start === end) return null;

    return { prefix: value.slice(start, cursorPos), start, end };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/test-expression-quickpick.js`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/commands/expression-converter.js tests/test-expression-quickpick.js
git commit -m "feat(expr): getWordAtPosition 感知尖括号区域"
```

---

### Task 5: QuickPick 补全插入尖括号逻辑

**Files:**
- Modify: `src/extension.js:811-815`（变量补全插入逻辑）

- [ ] **Step 1: 修改补全插入逻辑**

在 `src/extension.js` 的 `qp.onDidAccept` 回调中（约第 811 行），将：

```javascript
if (selected && selected._varName) {
    _updatingValue = true;
    const newVal = _lastWordInfo
        ? expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, selected._varName)
        : qp.value + selected._varName;
```

修改为：

```javascript
if (selected && selected._varName) {
    _updatingValue = true;
    let insertText;
    const varName = selected._varName;
    const hasHyphen = /[-]/.test(varName);

    if (_lastWordInfo) {
        if (_lastWordInfo.inAngleBrackets) {
            // 场景 3：已在 <> 内，替换括号内容
            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, varName);
        } else if (hasHyphen) {
            // 场景 2：用户正在输入普通标识符，变量含连字符 → 替换为 <var>
            const replacement = `<${varName}>`;
            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, replacement);
        } else {
            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, varName);
        }
    } else {
        // 无 wordInfo，在末尾追加
        insertText = hasHyphen ? qp.value + `<${varName}>` : qp.value + varName;
    }
    const newVal = insertText;
```

- [ ] **Step 2: 同时修改补全过滤逻辑**

在同一文件的 `updateItems` 函数中（约第 770 行），将 `userVars.filter` 的前缀匹配扩展为支持连字符变量名。找到：

```javascript
if (userVars.length > 0 && prefix) {
    const variables = userVars.filter(d => d.kind === 'variable' && d.name.toLowerCase().startsWith(prefix));
    const parameters = userVars.filter(d => d.kind === 'parameter' && d.name.toLowerCase().startsWith(prefix));
```

无需修改此部分——前缀匹配逻辑本身已正确。`getWordAtPosition` 在 Task 4 中已扩展 `IDENT_CHAR_RE` 包含 `-`，因此 `prefix` 会包含连字符后的部分。

- [ ] **Step 3: 运行全部测试确认不受影响**

Run: `node tests/test-expression-converter.js && node tests/test-expression-quickpick.js`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat(expr): QuickPick 补全自动添加/补全尖括号"
```

---

### Task 6: 解析错误在确认项上展示

**Files:**
- Modify: `src/extension.js:790-801`（确认项生成逻辑）

- [ ] **Step 1: 修改确认项显示逻辑**

在 `src/extension.js` 的 `updateItems` 函数中，将确认项段：

```javascript
                // 确认分栏：仅非历史模式下显示
                if (!histParsed && value.trim()) {
                    items.push({ label: useZh ? '确认输入' : 'Confirm Input', kind: vscode.QuickPickItemKind.Separator });
                    items.push({
                        label: value,
                        description: useZh ? '按 Enter 确认' : 'Press Enter to confirm',
                        alwaysShow: true,
                        _confirmInput: true,
                    });
                }
```

修改为：

```javascript
                // 确认分栏：仅非历史模式下显示
                if (!histParsed && value.trim()) {
                    items.push({ label: useZh ? '确认输入' : 'Confirm Input', kind: vscode.QuickPickItemKind.Separator });
                    // 预览转换结果
                    const preview = convertFn(value);
                    const desc = preview.error
                        ? `⚠ ${preview.error}`
                        : (useZh ? '按 Enter 确认' : 'Press Enter to confirm');
                    items.push({
                        label: value,
                        description: desc,
                        detail: preview.result || undefined,
                        alwaysShow: true,
                        _confirmInput: true,
                    });
                }
```

但注意 `convertFn` 在 `updateItems` 作用域中不可直接访问。需要在 `updateItems` 闭包内通过参数或闭包获取。检查 `registerConvertCommand` 中 `updateItems` 的定义位置——它在 `qp.onDidChangeValue` 回调的闭包内，`convertFn` 作为 `registerConvertCommand` 的参数 `convertFn` 已在闭包作用域中可用（参见 `src/extension.js:840` 的 `const { result, error } = convertFn(finalValue)`）。

确认：`convertFn` 在闭包作用域内可用，无需额外传递。

- [ ] **Step 2: 运行全部测试确认不受影响**

Run: `node tests/test-expression-converter.js && node tests/test-expression-quickpick.js`
Expected: 所有测试通过

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat(expr): 解析错误在确认项上实时显示"
```

---

### Task 7: UI 提示更新 — 占位符和帮助菜单

**Files:**
- Modify: `src/extension.js:869`（infix2scheme 占位符）
- Modify: `src/commands/expression-converter.js:377-428`（`getSupportedOperators`）

- [ ] **Step 1: 修改 infix2scheme 占位符**

在 `src/extension.js` 的 `registerConvertCommand` 调用中（约第 874 行），将：

```javascript
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '输入 ! 浏览历史 | 例: (W/2 + L/2)'
        ),
```

修改为：

```javascript
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '输入 ! 浏览历史 | <连字符变量> | 例: (<W-doping>/2 + <L-length>/2)'
        ),
```

- [ ] **Step 2: 在 getSupportedOperators 添加变量语法分类**

在 `src/commands/expression-converter.js` 的 `getSupportedOperators` 函数返回数组末尾（`聚合函数` 分类后），添加：

```javascript
        {
            category: '变量语法',
            items: [
                { scheme: 'my-var', infix: '<my-var>', description: '连字符变量 — 中缀表达式中用尖括号包裹，避免与减号混淆' },
            ],
        },
```

- [ ] **Step 3: 运行全部测试确认通过**

Run: `node tests/test-expression-converter.js && node tests/test-expression-quickpick.js`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/extension.js src/commands/expression-converter.js
git commit -m "feat(expr): 占位符和帮助菜单增加尖括号连字符变量说明"
```

---

### Task 8: 最终验证

- [ ] **Step 1: 运行全部测试套件**

Run: `node tests/test-expression-converter.js && node tests/test-expression-quickpick.js`
Expected: 全部通过，0 失败

- [ ] **Step 2: 验证 JSON 语法文件无损坏**

Run: `node -e "require('./syntaxes/sde.tmLanguage.json'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: 打包验证**

Run: `npx vsce package`
Expected: 生成 `.vsix` 文件无报错
