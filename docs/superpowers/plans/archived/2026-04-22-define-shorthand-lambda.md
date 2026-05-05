# define 简写形式支持 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使 `(define (FuncName args...) body...)` 简写形式的所有功能（params 字段、符号提取、签名提示）对齐 `(define name (lambda ...))` 形式。

**Architecture:** 在两处添加对称分支处理：`scheme-analyzer.js` 为简写形式补充 `params` 字段，`symbol-index.js` 扩展 `tryRegisterUserFunc` 支持简写形式的符号扫描。下游消费者（signature-provider、region-undef-diagnostic 等）无需改动即可自动适配。

**Tech Stack:** 纯 CommonJS（无构建步骤），Node.js assert 测试框架，手写 Scheme 解析器 AST。

---

### Task 1: scheme-analyzer.js — 为简写形式补充 params 字段

**Files:**
- Modify: `src/lsp/scheme-analyzer.js:79-86`（简写分支的 function 定义 push）
- Test: `tests/test-scheme-analyzer.js`

- [ ] **Step 1: 在 test-scheme-analyzer.js 添加两个失败测试**

在文件第 52 行（`console.log` 之前）插入：

```javascript
test('define 简写形式提取 params 字段', () => {
    const { ast } = parse('(define (my-func a b c) (+ a b c))');
    const result = analyze(ast);
    const funcDef = result.definitions[0];
    assert.strictEqual(funcDef.name, 'my-func');
    assert.strictEqual(funcDef.kind, 'function');
    assert.deepStrictEqual(funcDef.params, ['a', 'b', 'c']);
});

test('define 简写形式无参数：params 为 undefined', () => {
    const { ast } = parse('(define (f) 42)');
    const result = analyze(ast);
    const funcDef = result.definitions[0];
    assert.strictEqual(funcDef.name, 'f');
    assert.strictEqual(funcDef.kind, 'function');
    assert.strictEqual(funcDef.params, undefined);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-scheme-analyzer.js
```

预期：两个新测试失败，`funcDef.params` 为 `undefined`。

- [ ] **Step 3: 修改 scheme-analyzer.js — 在简写分支添加 params 字段**

在 `src/lsp/scheme-analyzer.js` 第 86 行（`kind: 'function',` 的闭合 `});` 之后、第 87 行注释 `// 提取函数参数` 之前）插入：

```javascript
            // 简写形式的 params 字段（对齐 define+lambda 的 params 结构）
            const params = children[1].children.slice(1)
                .filter(p => p.type === 'Identifier')
                .map(p => p.value);
            if (params.length > 0) {
                definitions[definitions.length - 1].params = params;
            }
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node tests/test-scheme-analyzer.js
```

预期：全部 7 个测试通过（5 旧 + 2 新）。

- [ ] **Step 5: 提交**

```bash
git add src/lsp/scheme-analyzer.js tests/test-scheme-analyzer.js
git commit -m "feat: 为 define 简写形式补充 params 字段

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: symbol-index.js — 扩展 tryRegisterUserFunc 支持简写形式

**Files:**
- Modify: `src/lsp/symbol-index.js:122-137`（tryRegisterUserFunc 函数体）
- Test: `tests/test-symbol-index.js`

- [ ] **Step 1: 在 test-symbol-index.js 添加三个失败测试**

在文件第 471 行（最后一个 `test(...)` 闭合之后、`console.log` 结果输出之前）插入：

```javascript
test('简写形式用户函数：提取 region 和 material 定义', () => {
    const code = `
(define (make-box mat rname)
    (sdegeo:create-cuboid (position 0 0 0) (position 1 1 1) mat rname))
(make-box "Silicon" "R.Box")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[0].type, 'material');
    assert.strictEqual(defs[1].name, 'R.Box');
    assert.strictEqual(defs[1].type, 'region');
    assert.strictEqual(defs[1].functionName, 'make-box');
    assert.strictEqual(refs.length, 0);
});

test('简写形式用户函数体内不含 SDE 调用：不生成映射', () => {
    const code = `
(define (my-func x y) (+ x y))
(my-func 1 2)
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
            ],
        },
    };
    const { defs, refs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 0);
    assert.strictEqual(refs.length, 0);
});

test('简写形式与 lambda 形式混合使用', () => {
    const code = `
(define (make-box mat rname)
    (sdegeo:create-cuboid (position 0 0 0) (position 1 1 1) mat rname))
(define make-sphere (lambda (mat rname)
    (sdegeo:create-sphere (position 0 0 0) 1.0 mat rname)))
(make-box "Silicon" "R.Box")
(make-sphere "Oxide" "R.Sphere")
`;
    const { ast } = parse(code);
    const table = {
        'sdegeo:create-cuboid': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
        'sdegeo:create-sphere': {
            symbolParams: [
                { index: 2, role: 'def', type: 'material' },
                { index: 3, role: 'def', type: 'region' },
            ],
        },
    };
    const { defs } = extractSymbols(ast, code, table);
    assert.strictEqual(defs.length, 4);
    assert.strictEqual(defs[0].name, 'Silicon');
    assert.strictEqual(defs[1].name, 'R.Box');
    assert.strictEqual(defs[2].name, 'Oxide');
    assert.strictEqual(defs[3].name, 'R.Sphere');
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node tests/test-symbol-index.js
```

预期：三个新测试失败，简写形式的 `defs` 为空数组。

- [ ] **Step 3: 修改 symbol-index.js — 扩展 tryRegisterUserFunc**

将 `src/lsp/symbol-index.js` 第 122-137 行的 `tryRegisterUserFunc` 函数替换为：

```javascript
    function tryRegisterUserFunc(ec) {
        if (ec[0].value !== 'define' || ec.length < 3) return;

        // 形式 1: (define name (lambda (params...) body...))
        if (ec[1].type === 'Identifier') {
            const lambdaNode = ec[2];
            if (lambdaNode.type !== 'List') return;
            const lec = effectiveChildren(lambdaNode);
            if (lec.length < 3 ||
                lec[0].type !== 'Identifier' || lec[0].value !== 'lambda' ||
                lec[1].type !== 'List') return;
            const paramNames = effectiveChildren(lec[1])
                .filter(c => c.type === 'Identifier')
                .map(c => c.value);
            const mapping = scanLambdaBody(lec.slice(2), paramNames, symbolParamsTable);
            if (mapping.length > 0) {
                userFuncParams[ec[1].value] = mapping;
            }
            return;
        }

        // 形式 2: (define (func-name params...) body...)
        if (ec[1].type === 'List') {
            const sigEc = effectiveChildren(ec[1]);
            if (sigEc.length < 2 || sigEc[0].type !== 'Identifier') return;
            const funcName = sigEc[0].value;
            const paramNames = sigEc.slice(1)
                .filter(c => c.type === 'Identifier')
                .map(c => c.value);
            if (paramNames.length === 0) return;
            const mapping = scanLambdaBody(ec.slice(2), paramNames, symbolParamsTable);
            if (mapping.length > 0) {
                userFuncParams[funcName] = mapping;
            }
        }
    }
```

- [ ] **Step 4: 运行全部符号相关测试确认通过**

```bash
node tests/test-symbol-index.js
```

预期：全部测试通过（25 旧 + 3 新 = 28）。

- [ ] **Step 5: 运行其他符号相关测试确认无回归**

```bash
node tests/test-symbol-reference.js && node tests/test-symbol-completion.js
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/lsp/symbol-index.js tests/test-symbol-index.js
git commit -m "feat: 用户自定义函数符号提取支持 define 简写形式

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: signature-provider — 添加简写形式签名提示测试

**Files:**
- Test: `tests/test-signature-provider.js`（此任务仅添加测试，无需修改实现代码）

- [ ] **Step 1: 在 test-signature-provider.js 添加测试**

在第 271 行（`activeParameter 正确` 测试之后、`内置函数优先于用户定义函数` 测试之前）插入：

```javascript
test('用户函数签名 — define 简写形式', () => {
    const doc = {
        getText: () => '(define (create_trapezoid x0 y0 z0 w h) body)\n(create_trapezoid 1 2 3)',
        uri: { toString: () => 'test-shorthand.scm' },
        version: 1,
    };
    const pos = { line: 1, character: 20 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache);
    assert.ok(result, '应返回签名结果');
    assert.strictEqual(result.signatures[0].label, '(create_trapezoid x0 y0 z0 w h)');
    assert.strictEqual(result.signatures[0].parameters.length, 5);
    assert.strictEqual(result.signatures[0].parameters[0].label, 'x0');
});
```

- [ ] **Step 2: 运行测试确认通过**

```bash
node tests/test-signature-provider.js
```

预期：全部通过。此测试在 Task 1 完成后应直接通过（`scheme-analyzer` 已为简写形式设置了 `params`）。

- [ ] **Step 3: 提交**

```bash
git add tests/test-signature-provider.js
git commit -m "test: 添加 define 简写形式签名提示测试

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: 回归验证 — 运行全部测试套件

**Files:** 无代码修改

- [ ] **Step 1: 运行全部相关测试**

```bash
node tests/test-scheme-analyzer.js && node tests/test-symbol-index.js && node tests/test-symbol-reference.js && node tests/test-symbol-completion.js && node tests/test-signature-provider.js && node tests/test-scope-analyzer.js && node tests/test-definitions.js && node tests/test-semantic-tokens.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-parser.js
```

预期：全部通过，无回归。
