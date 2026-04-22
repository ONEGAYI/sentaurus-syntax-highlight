# 用户定义函数调用高亮与签名提示 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户通过 `(define name (lambda ...))` 定义的函数，在调用处获得函数色高亮（Semantic Tokens）和签名提示（Signature Help）。

**Architecture:** 在 `scheme-analyzer.js` 中检测 define+lambda 并记录 params 字段；新增 `semantic-tokens-provider.js` 利用已有 AST 缓存标记调用位置为 function 令牌；在 `signature-provider.js` 末尾 fallback 到用户 definitions 提供签名。

**Tech Stack:** VSCode Semantic Tokens API, 已有的 Scheme AST 解析管线, 纯 JavaScript (CommonJS)

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lsp/scheme-analyzer.js` | 修改 | 检测 define+lambda，为 definition 添加 `params` 字段 |
| `src/lsp/providers/semantic-tokens-provider.js` | 新增 | Semantic Tokens Provider，将调用处标识符标记为 function |
| `src/lsp/providers/signature-provider.js` | 修改 | 在内置函数未匹配时 fallback 到用户定义函数签名 |
| `src/extension.js` | 修改 | 注册 Semantic Tokens Provider，传入 defs 模块给 signature provider |
| `package.json` | 修改 | 声明 `semanticTokenTypes` |
| `tests/test-scheme-analyzer.js` | 修改 | 新增 define+lambda params 测试用例 |
| `tests/test-semantic-tokens.js` | 新增 | Semantic Tokens 提供器测试 |
| `tests/test-signature-provider.js` | 修改 | 用户函数签名 fallback 测试 |

---

### Task 1: scheme-analyzer.js — 检测 define+lambda 并记录 params

**Files:**
- Modify: `src/lsp/scheme-analyzer.js:57-65`
- Test: `tests/test-scheme-analyzer.js`

- [ ] **Step 1: 在 `test-scheme-analyzer.js` 末尾（`console.log('\n结果:` 之前）添加测试用例**

```javascript
console.log('\nanalyze — define+lambda params:');

test('define+lambda 提取 params 字段', () => {
    const { ast } = parse('(define create_trapezoid (lambda (x0 y0 z0 w h) body))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    const def = result.definitions[0];
    assert.strictEqual(def.name, 'create_trapezoid');
    assert.strictEqual(def.kind, 'variable');
    assert.deepStrictEqual(def.params, ['x0', 'y0', 'z0', 'w', 'h']);
});

test('define 普通变量无 params 字段', () => {
    const { ast } = parse('(define x 42)');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].name, 'x');
    assert.strictEqual(result.definitions[0].kind, 'variable');
    assert.strictEqual(result.definitions[0].params, undefined);
});

test('define+lambda 无参数列表', () => {
    const { ast } = parse('(define f (lambda () body))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.deepStrictEqual(result.definitions[0].params, []);
});

test('define+lambda 跨行', () => {
    const text = '(define my-func\n  (lambda (a b c)\n    (+ a b c)))';
    const { ast } = parse(text);
    const result = analyze(ast, text);
    assert.strictEqual(result.definitions.length, 1);
    assert.deepStrictEqual(result.definitions[0].params, ['a', 'b', 'c']);
});

test('define+非 lambda 无 params', () => {
    const { ast } = parse('(define f (+ 1 2))');
    const result = analyze(ast);
    assert.strictEqual(result.definitions.length, 1);
    assert.strictEqual(result.definitions[0].params, undefined);
});
```

- [ ] **Step 2: 运行测试，验证失败**

Run: `node tests/test-scheme-analyzer.js 2>&1 | tail -5`
Expected: `define+lambda 提取 params 字段` 等新测试失败（`params` 字段不存在）

- [ ] **Step 3: 修改 `src/lsp/scheme-analyzer.js:57-65`**

在 `(define name val)` 的 `children[1].type === 'Identifier'` 分支中，检测 children[2] 是否为 lambda 表达式：

```javascript
        // (define name ...)
        if (children[1].type === 'Identifier') {
            const def = {
                name: children[1].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: defText,
                kind: 'variable',
            };
            // 检测值是否为 lambda 表达式，提取参数列表
            if (children.length >= 3 && children[2].type === 'List') {
                const valueFirst = children[2].children[0];
                if (valueFirst && valueFirst.type === 'Identifier' && valueFirst.value === 'lambda') {
                    const lambdaParams = children[2].children[1];
                    if (lambdaParams && lambdaParams.type === 'List') {
                        def.params = lambdaParams.children
                            .filter(p => p.type === 'Identifier')
                            .map(p => p.value);
                    }
                }
            }
            definitions.push(def);
            // 遍历值表达式（如 lambda），使嵌套作用域被正确构建
            for (let i = 2; i < children.length; i++) {
                walk(children[i], parentScope, branchCtx);
            }
            return;
        }
```

- [ ] **Step 4: 运行测试，验证通过**

Run: `node tests/test-scheme-analyzer.js`
Expected: 所有测试通过（包括新增的 5 个 define+lambda 测试）

- [ ] **Step 5: 运行完整测试套件，确认无回归**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f" 2>&1 | tail -2; done`
Expected: 所有测试文件通过

- [ ] **Step 6: 提交**

```bash
git add src/lsp/scheme-analyzer.js tests/test-scheme-analyzer.js
git commit -m "feat(sde): 检测 define+lambda 并记录 params 字段用于函数签名"
```

---

### Task 2: semantic-tokens-provider.js — 调用位置函数色高亮

**Files:**
- Create: `src/lsp/providers/semantic-tokens-provider.js`
- Modify: `package.json`（声明 semanticTokenTypes）
- Modify: `src/extension.js`（注册 provider）

- [ ] **Step 1: 在 `package.json` 的 `contributes` 对象中添加 `semanticTokenTypes`**

在 `contributes` 的 `"languages": [...]` 数组之后添加：

```json
    "semanticTokenTypes": [
      {
        "id": "function",
        "superType": "function",
        "description": "用户定义的函数调用"
      }
    ],
```

- [ ] **Step 2: 创建 `src/lsp/providers/semantic-tokens-provider.js`**

```javascript
'use strict';

/**
 * 为 SDE (Scheme) 提供语义令牌，将用户定义函数的调用位置标记为 function 类型。
 * 复用 SchemeParseCache 的 AST 和 definitions 缓存，无额外解析开销。
 */

/** 令牌类型列表（与 package.json 中 semanticTokenTypes 对应） */
const TOKEN_TYPES = ['function'];
/** 令牌修饰符列表（当前无修饰符） */
const TOKEN_MODIFIERS = [];

/**
 * 从 AST 中提取所有函数调用位置的语义令牌。
 * 函数调用 = List 节点的第一个有效子节点（跳过 Comment）为 Identifier，
 * 且该标识符名在用户定义函数名集合中。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {Set<string>} userFuncNames - 用户定义函数名集合
 * @param {string} sourceText - 原始源码文本
 * @returns {number[]} delta 编码的语义令牌数组
 */
function extractSemanticTokens(ast, userFuncNames, sourceText) {
    const tokens = [];

    /**
     * 将绝对偏移转换为 (line, column)。
     * line 和 column 均为 0-based。
     */
    function offsetToPos(absOffset) {
        let line = 0;
        let col = 0;
        for (let i = 0; i < absOffset && i < sourceText.length; i++) {
            if (sourceText[i] === '\n') {
                line++;
                col = 0;
            } else {
                col++;
            }
        }
        return { line, col };
    }

    function walk(node) {
        if (node.type === 'List') {
            const children = node.children || [];
            // 跳过 Comment 子节点，取第一个有效子节点
            let firstEffective = null;
            for (const child of children) {
                if (child.type !== 'Comment') {
                    firstEffective = child;
                    break;
                }
            }
            if (firstEffective && firstEffective.type === 'Identifier' &&
                userFuncNames.has(firstEffective.value)) {
                const pos = offsetToPos(firstEffective.start);
                tokens.push(pos.line, pos.col, firstEffective.end - firstEffective.start, 0, 0);
            }
            for (const child of children) {
                walk(child);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression);
        } else if (node.type === 'Program') {
            for (const child of node.body) {
                walk(child);
            }
        }
    }

    walk(ast);
    return encodeDelta(tokens);
}

/**
 * 将 [line, col, len, typeIdx, modIdx, ...] 原始令牌数组编码为 delta 格式。
 * VSCode Semantic Tokens API 要求：
 *   每个令牌 5 个整数: [deltaLine, deltaStartChar, length, tokenType, tokenModifier]
 *   deltaLine = 当前行 - 上一令牌行
 *   deltaStartChar = 当前列（仅 deltaLine===0 时减上一令牌列）
 */
function encodeDelta(rawTokens) {
    const result = [];
    let prevLine = 0;
    let prevCol = 0;
    for (let i = 0; i < rawTokens.length; i += 3) {
        const line = rawTokens[i];
        const col = rawTokens[i + 1];
        const len = rawTokens[i + 2];
        const deltaLine = line - prevLine;
        const deltaCol = deltaLine === 0 ? col - prevCol : col;
        result.push(deltaLine, deltaCol, len, 0, 0);
        prevLine = line;
        prevCol = col;
    }
    return result;
}

/**
 * 创建 SDE 语言的 DocumentSemanticTokensProvider。
 * @param {object} schemeCache - SchemeParseCache 实例
 * @param {object} defs - definitions.js 模块
 * @returns {object} { provideDocumentSemanticTokens, legend }
 */
function createSemanticTokensProvider(schemeCache, defs) {
    return {
        provideDocumentSemanticTokens(document) {
            const { ast, analysis } = schemeCache.get(document);
            const userDefs = defs.getDefinitions(document, 'sde');

            // 构建用户定义函数名集合：kind='function' 或带 params 字段的 variable
            const userFuncNames = new Set();
            for (const d of userDefs) {
                if (d.kind === 'function' || d.params) {
                    userFuncNames.add(d.name);
                }
            }

            const data = extractSemanticTokens(ast, userFuncNames, document.getText());
            return { data };
        },
    };
}

module.exports = {
    createSemanticTokensProvider,
    extractSemanticTokens,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
```

- [ ] **Step 3: 在 `src/extension.js` 中注册 Semantic Tokens Provider**

在文件顶部导入区域添加：

```javascript
const semanticTokensMod = require('./lsp/providers/semantic-tokens-provider');
```

在 `// Signature Help (SDE only)` 注释之前（约第 444 行前）添加：

```javascript
    // Semantic Tokens (SDE only) — 用户定义函数调用高亮
    const stLegend = new vscode.SemanticTokensLegend(
        semanticTokensMod.TOKEN_TYPES,
        semanticTokensMod.TOKEN_MODIFIERS
    );
    const stProvider = semanticTokensMod.createSemanticTokensProvider(schemeCache, defs);
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'sde' },
            stProvider,
            stLegend
        )
    );
```

- [ ] **Step 4: 创建 `tests/test-semantic-tokens.js`**

```javascript
'use strict';

const assert = require('assert');
const { parse } = require('../src/lsp/scheme-parser');
const { analyze } = require('../src/lsp/scheme-analyzer');
const { extractSemanticTokens, TOKEN_TYPES, TOKEN_MODIFIERS } = require('../src/lsp/providers/semantic-tokens-provider');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\nsemantic-tokens — extractSemanticTokens:');

test('调用用户函数被标记为 function', () => {
    const text = '(define f (lambda (x) x))\n(f 42)';
    const { ast } = parse(text);
    // 模拟用户函数名集合
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, text);
    // 应有 1 个令牌：第 2 行的 f
    assert.strictEqual(data.length, 5); // 一个令牌 = 5 个整数
    assert.strictEqual(data[0], 1);     // deltaLine: 1（从第 0 行到第 1 行）
    assert.strictEqual(data[1], 1);     // deltaStartChar: 1（第 1 行第 1 列）
    assert.strictEqual(data[2], 1);     // length: 1（"f" 的长度）
});

test('定义处 name 不被标记', () => {
    const text = '(define f (lambda (x) x))';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, text);
    // define 列表中 f 是第 2 个子节点（不是第 1 个），不应被标记
    assert.strictEqual(data.length, 0);
});

test('普通变量调用不被标记', () => {
    const text = '(define x 42)\n(+ x 1)';
    const { ast } = parse(text);
    // x 没有 params，不在函数名集合中
    const userFuncNames = new Set();
    const data = extractSemanticTokens(ast, userFuncNames, text);
    assert.strictEqual(data.length, 0);
});

test('多次调用同一函数全部标记', () => {
    const text = '(define f (lambda (x) x))\n(f 1)\n(f 2)\n(f 3)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, text);
    // 3 次调用，3 个令牌
    assert.strictEqual(data.length, 15); // 3 × 5
});

test('缩写形式 define 函数也被标记', () => {
    const text = '(define (my-func a b) (+ a b))\n(my-func 1 2)';
    const { ast } = parse(text);
    // my-func 的 kind 是 'function'
    const userFuncNames = new Set(['my-func']);
    const data = extractSemanticTokens(ast, userFuncNames, text);
    assert.strictEqual(data.length, 5); // 一个令牌
});

test('注释跳过不干扰', () => {
    const text = '(define f (lambda (x) x))\n( ; comment\n  f 42)';
    const { ast } = parse(text);
    const userFuncNames = new Set(['f']);
    const data = extractSemanticTokens(ast, userFuncNames, text);
    assert.strictEqual(data.length, 5); // f 在 Comment 后仍被正确识别
});

test('TOKEN_TYPES 和 TOKEN_MODIFIERS 导出', () => {
    assert.ok(Array.isArray(TOKEN_TYPES));
    assert.ok(TOKEN_TYPES.includes('function'));
    assert.ok(Array.isArray(TOKEN_MODIFIERS));
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 5: 运行新测试**

Run: `node tests/test-semantic-tokens.js`
Expected: 所有 7 个测试通过

- [ ] **Step 6: 运行完整测试套件确认无回归**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f" 2>&1 | tail -2; done`
Expected: 所有测试文件通过

- [ ] **Step 7: 提交**

```bash
git add src/lsp/providers/semantic-tokens-provider.js tests/test-semantic-tokens.js package.json src/extension.js
git commit -m "feat(sde): 添加 Semantic Tokens Provider，用户函数调用位置函数色高亮"
```

---

### Task 3: signature-provider.js — 用户定义函数签名提示

**Files:**
- Modify: `src/lsp/providers/signature-provider.js:74-123`
- Modify: `src/extension.js:445-458`
- Test: `tests/test-signature-provider.js`

- [ ] **Step 1: 在 `test-signature-provider.js` 末尾添加测试用例**

```javascript
console.log('\n用户定义函数签名 fallback:');

test('用户函数签名 — define+lambda', () => {
    const doc = {
        getText: () => '(define create_trapezoid (lambda (x0 y0 z0 w h) body))\n(create_trapezoid 1 2 3)',
        uri: { toString: () => 'test.scm' },
        version: 1,
    };
    // 先清空 definition 缓存
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 1, character: 20 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.ok(result, '应返回签名结果');
    assert.strictEqual(result.signatures[0].label, '(create_trapezoid x0 y0 z0 w h)');
    assert.strictEqual(result.signatures[0].parameters.length, 5);
    assert.strictEqual(result.signatures[0].parameters[0].label, 'x0');
});

test('用户函数签名 — activeParameter 正确', () => {
    const doc = {
        getText: () => '(define f (lambda (a b c) body))\n(f 1 )',
        uri: { toString: () => 'test2.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 1, character: 5 }; // 光标在 "1 " 之后，第 2 个参数位置
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.ok(result);
    assert.strictEqual(result.activeParameter, 1);
});

test('内置函数优先于用户定义函数', () => {
    const doc = {
        getText: () => '(sdegeo:create-circle (position 0 0 0) 5 "Si" "R")',
        uri: { toString: () => 'test3.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const funcDocs = {
        'sdegeo:create-circle': {
            signature: '(sdegeo:create-circle center radius material region)',
            parameters: [
                { name: 'center', desc: 'Center' },
                { name: 'radius', desc: 'Radius' },
                { name: 'material', desc: 'Material' },
                { name: 'region', desc: 'Region' },
            ],
        },
    };
    const pos = { line: 0, character: 10 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, funcDocs, mockCache, defs);
    assert.ok(result);
    assert.ok(result.signatures[0].documentation !== '用户定义函数');
});

test('非函数调用返回 null', () => {
    const doc = {
        getText: () => '(define x 42)\n',
        uri: { toString: () => 'test4.scm' },
        version: 1,
    };
    const defs = require('../src/definitions');
    defs.clearDefinitionCache();
    const pos = { line: 0, character: 3 };
    const result = sigProvider.provideSignatureHelp(doc, pos, null, {}, {}, mockCache, defs);
    assert.strictEqual(result, null);
});
```

- [ ] **Step 2: 运行测试，验证失败**

Run: `node tests/test-signature-provider.js 2>&1 | tail -5`
Expected: 新测试失败（`provideSignatureHelp` 不接受第 7 个参数 `defs`）

- [ ] **Step 3: 修改 `src/lsp/providers/signature-provider.js`**

在 `provideSignatureHelp` 函数签名末尾添加 `defs` 参数，并在函数末尾（`return null` 之前）添加用户函数 fallback：

将函数签名从：
```javascript
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs, schemeCache) {
```
改为：
```javascript
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs, schemeCache, defs) {
```

在文件末尾的 `return null;` 之前（约第 121 行）添加：

```javascript
    // Fallback: 用户定义函数（define+lambda）
    if (defs) {
        const langId = 'sde';
        const userDefs = defs.getDefinitions(document, langId);
        const userFunc = userDefs.find(d => d.name === functionName && d.params);
        if (userFunc) {
            const params = userFunc.params.map(p => ({ label: p, documentation: '' }));
            return {
                signatures: [{
                    label: `(${functionName} ${userFunc.params.join(' ')})`,
                    parameters: params,
                    documentation: '用户定义函数',
                }],
                activeSignature: 0,
                activeParameter: Math.min(activeParam, params.length - 1),
            };
        }
    }
```

- [ ] **Step 4: 修改 `src/extension.js` 中 SignatureHelp 注册，传入 defs**

将：
```javascript
return signatureProvider.provideSignatureHelp(
    document, position, token,
    modeDispatchTable, langFuncDocs.sde,
    schemeCache
);
```
改为：
```javascript
return signatureProvider.provideSignatureHelp(
    document, position, token,
    modeDispatchTable, langFuncDocs.sde,
    schemeCache, defs
);
```

- [ ] **Step 5: 运行测试**

Run: `node tests/test-signature-provider.js`
Expected: 所有测试通过（包括新增的 4 个用户函数签名测试）

- [ ] **Step 6: 运行完整测试套件确认无回归**

Run: `for f in tests/test-*.js; do echo "=== $f ===" && node "$f" 2>&1 | tail -2; done`
Expected: 所有测试文件通过

- [ ] **Step 7: 提交**

```bash
git add src/lsp/providers/signature-provider.js src/extension.js tests/test-signature-provider.js
git commit -m "feat(sde): 用户定义函数调用时提供 lambda 参数签名提示"
```

---

## 自审查清单

- [x] **Spec 覆盖**：spec 中 5 个设计点均有对应 Task（1→analyzer, 2→semantic-tokens, 3→signature, 4→package.json, 5→extension.js）
- [x] **Placeholder 扫描**：无 TBD/TODO/未完成步骤，所有代码完整给出
- [x] **类型一致性**：definitions 中的 `params` 字段（string[]）在 analyzer → semantic-tokens → signature-provider 中使用一致
- [x] **向后兼容**：`provideSignatureHelp` 新增的 `defs` 参数为可选参数（`if (defs)`），现有调用不传 defs 时行为不变
