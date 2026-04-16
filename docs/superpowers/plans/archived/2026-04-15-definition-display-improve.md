# 定义提示框显示改进 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户定义变量/函数的提示框显示行末注释，并为过长行提供截断控制。

**Architecture:** 在解析层（scheme-analyzer.js / tcl-ast-utils.js）扩展 `definitionText` 使其包含最后一行的行末注释；在 definitions.js 中新增截断工具函数；在 extension.js 显示层调用截断并读取用户设置；在 package.json 中注册设置项。

**Tech Stack:** 纯 JavaScript (CommonJS)，VSCode Extension API，tree-sitter-tcl WASM

---

### Task 1: Scheme 解析层 — definitionText 包含行末注释

**Files:**
- Modify: `src/lsp/scheme-analyzer.js`

- [ ] **Step 1: 修改 analyze() 签名，新增 sourceText 参数**

在 `src/lsp/scheme-analyzer.js` 中，将 `analyze(ast)` 改为 `analyze(ast, sourceText)`，并新增辅助函数 `_extendToLineEnd(nodeText, endOffset, sourceText)`。

```javascript
// src/lsp/scheme-analyzer.js
'use strict';

/**
 * 将节点文本扩展到该节点末尾所在行的行尾。
 * 用于将行末注释包含在 definitionText 中。
 * @param {string} nodeText AST 节点的原始文本
 * @param {number} endOffset 节点在源码中的结束偏移量（0-indexed）
 * @param {string} sourceText 完整源码文本
 * @returns {string} 扩展后的文本
 */
function _extendToLineEnd(nodeText, endOffset, sourceText) {
    // 从 endOffset 开始向后查找直到 \n 或文本末尾
    let i = endOffset;
    while (i < sourceText.length && sourceText[i] !== '\n') i++;
    const tail = sourceText.slice(endOffset, i).trimStart();
    return tail ? nodeText + tail : nodeText;
}

/**
 * Walk AST and extract definitions + folding ranges.
 * @param {object} ast Parser-produced AST root node (Program)
 * @param {string} [sourceText] 完整源码文本，用于扩展 definitionText 到行尾
 * @returns {{ definitions: object[], foldingRanges: object[] }}
 */
function analyze(ast, sourceText) {
    const definitions = [];
    const foldingRanges = [];

    function walk(node) {
        if (node.type === 'List') {
            extractDefinitionsFromList(node, definitions, sourceText);
            extractFoldingRange(node, foldingRanges);
            for (const child of node.children) walk(child);
        } else if (node.type === 'Quote') {
            walk(node.expression);
        }
        if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        }
    }

    walk(ast);
    return { definitions, foldingRanges };
}
```

- [ ] **Step 2: 修改 extractDefinitionsFromList，使用扩展后的文本**

将 `extractDefinitionsFromList(listNode, definitions)` 签名改为 `extractDefinitionsFromList(listNode, definitions, sourceText)`，将所有 4 处 `definitionText: listNode.text` 替换为使用 `_extendToLineEnd`：

```javascript
function extractDefinitionsFromList(listNode, definitions, sourceText) {
    const children = listNode.children;
    if (children.length === 0) return;

    const first = children[0];
    if (first.type !== 'Identifier') return;

    const defText = sourceText
        ? _extendToLineEnd(listNode.text, listNode.end, sourceText)
        : listNode.text;

    // (define name ...)
    if (first.value === 'define' && children.length >= 2) {
        if (children[1].type === 'Identifier') {
            definitions.push({
                name: children[1].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: defText,
                kind: 'variable',
            });
        } else if (children[1].type === 'List' && children[1].children.length >= 1) {
            definitions.push({
                name: children[1].children[0].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: defText,
                kind: 'function',
            });
            // 提取函数参数
            for (let i = 1; i < children[1].children.length; i++) {
                const param = children[1].children[i];
                if (param.type === 'Identifier') {
                    definitions.push({
                        name: param.value,
                        line: listNode.line,
                        endLine: listNode.endLine,
                        definitionText: defText,
                        kind: 'parameter',
                    });
                }
            }
        }
        return;
    }

    // (let/let*/letrec ((var val) ...) body...)
    if ((first.value === 'let' || first.value === 'let*' || first.value === 'letrec') && children.length >= 2) {
        if (children[1].type === 'List') {
            for (const binding of children[1].children) {
                if (binding.type === 'List' && binding.children.length >= 1 && binding.children[0].type === 'Identifier') {
                    definitions.push({
                        name: binding.children[0].value,
                        line: listNode.line,
                        endLine: listNode.endLine,
                        definitionText: defText,
                        kind: 'variable',
                    });
                }
            }
        }
    }
}
```

- [ ] **Step 3: 更新所有 analyze() 调用方，传递 sourceText**

修改 `src/definitions.js:39`：

```javascript
function extractSchemeDefinitions(text) {
    const { ast } = parse(text);
    const { definitions } = analyze(ast, text);  // 新增 text 参数
    return definitions;
}
```

修改 `src/lsp/providers/folding-provider.js:15`：

```javascript
const { foldingRanges } = analyze(ast);  // 不需要 sourceText，保持原样
```

> 注意：folding-provider 只用 foldingRanges 不用 definitions，不需要传 sourceText。analyze() 的 sourceText 参数是可选的（有默认值 undefined），不传时行为与之前完全一致。

- [ ] **Step 4: 运行现有 Scheme 测试确认无回归**

Run: `node tests/test-scheme-parser.js`
Expected: 所有测试通过（definitionText 断言使用 `includes` 而非精确匹配，不受影响）

- [ ] **Step 5: 提交**

```bash
git add src/lsp/scheme-analyzer.js src/definitions.js src/lsp/providers/folding-provider.js
git commit -m "feat: Scheme definitionText 扩展到行尾包含行末注释"
```

---

### Task 2: Tcl 解析层 — definitionText 包含行末注释

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`

- [ ] **Step 1: 新增辅助函数 _extendNodeTextToLineEnd**

在 `src/lsp/tcl-ast-utils.js` 的辅助函数区域（`// ── 辅助函数 ──` 注释之后）添加：

```javascript
/**
 * 将 tree-sitter 节点文本扩展到该节点末尾所在行的行尾。
 * 用于将行末注释包含在 definitionText 中。
 * @param {string} nodeText tree-sitter 节点的原始文本
 * @param {number} endRow 节点末尾所在行（0-indexed，来自 endPosition.row）
 * @param {string} sourceText 完整源码文本
 * @returns {string} 扩展后的文本
 */
function _extendNodeTextToLineEnd(nodeText, endRow, sourceText) {
    // 按 \n 分割源码，找到 endRow 对应的行
    const lines = sourceText.split('\n');
    if (endRow >= lines.length) return nodeText;
    const fullLine = lines[endRow];
    // 从 nodeText 的最后一行在 fullLine 中的位置开始，取到行尾
    const nodeLines = nodeText.split('\n');
    const lastNodeLine = nodeLines[nodeLines.length - 1];
    const idx = fullLine.lastIndexOf(lastNodeLine);
    if (idx < 0) return nodeText;
    const tail = fullLine.slice(idx + lastNodeLine.length).trimStart();
    return tail ? nodeText + tail : nodeText;
}
```

- [ ] **Step 2: 修改 getVariables 签名，传递 sourceText 到 _collectVariables**

```javascript
/**
 * 从 AST 中提取变量/函数/参数定义。
 * @param {object} root - tree-sitter 根节点（program）
 * @param {string} [sourceText] - 完整源码文本，用于扩展 definitionText 到行尾
 * @returns {Array<{name: string, line: number, endLine: number, definitionText: string, kind: string}>}
 */
function getVariables(root, sourceText) {
    const results = [];
    _collectVariables(root, results, sourceText);
    return results;
}
```

- [ ] **Step 3: 修改 _collectVariables 和所有 _handle* 函数签名，传递 sourceText**

修改 `_collectVariables(node, results)` → `_collectVariables(node, results, sourceText)`，并将 `sourceText` 传递到每个 `_handleSet`、`_handleProcedure`、`_handleForeach` 调用。

修改 `_handleSet(node, results)` → `_handleSet(node, results, sourceText)`：

```javascript
function _handleSet(node, results, sourceText) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;

    const name = idNode.text;
    if (name.startsWith('env(')) return;

    const defText = sourceText
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
        : node.text;

    results.push({
        name,
        line: idNode.startPosition.row + 1,
        endLine: idNode.endPosition.row + 1,
        definitionText: defText,
        kind: 'variable',
    });
}
```

修改 `_handleProcedure(node, results)` → `_handleProcedure(node, results, sourceText)`：

```javascript
function _handleProcedure(node, results, sourceText) {
    const simpleWords = _findChildrenByType(node, 'simple_word');
    if (simpleWords.length >= 1) {
        let funcNameNode = null;
        for (const sw of simpleWords) {
            if (sw.text !== 'proc') {
                funcNameNode = sw;
                break;
            }
        }
        if (funcNameNode) {
            const defText = sourceText
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
                : node.text;

            results.push({
                name: funcNameNode.text,
                line: funcNameNode.startPosition.row + 1,
                endLine: funcNameNode.endPosition.row + 1,
                definitionText: defText,
                kind: 'function',
            });
        }
    }

    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode) {
        const argNodes = _findChildrenByType(argsNode, 'argument');
        for (const arg of argNodes) {
            const argName = arg.text;
            if (argName) {
                // 参数在参数列表中，行末注释通常属于 proc 行，不扩展参数的 definitionText
                results.push({
                    name: argName,
                    line: arg.startPosition.row + 1,
                    endLine: arg.endPosition.row + 1,
                    definitionText: arg.text,
                    kind: 'parameter',
                });
            }
        }
    }

    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results, sourceText);
    }
}
```

修改 `_handleForeach(node, results)` → `_handleForeach(node, results, sourceText)`：

```javascript
function _handleForeach(node, results, sourceText) {
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode && argsNode.childCount > 0) {
        const loopVar = argsNode.child(0);
        if (loopVar && loopVar.text) {
            const defText = sourceText
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
                : node.text;

            results.push({
                name: loopVar.text,
                line: loopVar.startPosition.row + 1,
                endLine: loopVar.endPosition.row + 1,
                definitionText: defText,
                kind: 'variable',
            });
        }
    }

    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results, sourceText);
    }
}
```

修改 `_handleWhile(node, results)` → `_handleWhile(node, results, sourceText)`，`_handleCommand(node, results)` → `_handleCommand(node, results, sourceText)`，`_handleFor(node, results)` → `_handleFor(node, results, sourceText)` — 这些函数只递归子节点，只需透传 `sourceText`：

```javascript
function _handleWhile(node, results, sourceText) {
    const bracedWords = _findChildrenByType(node, 'braced_word');
    if (bracedWords.length > 0) {
        for (const bw of bracedWords) {
            _collectVariables(bw, results, sourceText);
        }
    }
}

function _handleCommand(node, results, sourceText) {
    if (node.childCount === 0) return;
    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        _collectVariables(node, results, sourceText);
        return;
    }
    const cmdName = firstChild.text;
    if (cmdName === 'for') {
        _handleFor(node, results, sourceText);
    } else {
        _collectVariables(node, results, sourceText);
    }
}

function _handleFor(node, results, sourceText) {
    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectVariables(bw, results, sourceText);
    }
}
```

修改 `_collectVariables` 签名并更新所有 switch-case 分发：

```javascript
function _collectVariables(node, results, sourceText) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _handleSet(child, results, sourceText);
                break;
            case 'procedure':
                _handleProcedure(child, results, sourceText);
                break;
            case 'foreach':
                _handleForeach(child, results, sourceText);
                break;
            case 'while':
                _handleWhile(child, results, sourceText);
                break;
            case 'command':
                _handleCommand(child, results, sourceText);
                break;
            default:
                _collectVariables(child, results, sourceText);
                break;
        }
    }
}
```

- [ ] **Step 4: 更新 definitions.js 中的调用方**

修改 `src/definitions.js:53`：

```javascript
function extractTclDefinitionsAst(text) {
    const tree = tclAstUtils.parseSafe(text);
    if (!tree) return [];
    try {
        return tclAstUtils.getVariables(tree.rootNode, text);  // 新增 text 参数
    } finally {
        tree.delete();
    }
}
```

- [ ] **Step 5: 运行现有 Tcl 测试确认无回归**

Run: `node tests/test-tcl-ast-variables.js`
Expected: 所有测试通过（mock 节点无 sourceText，走 `sourceText ? ... : node.text` 兜底分支）

- [ ] **Step 6: 提交**

```bash
git add src/lsp/tcl-ast-utils.js src/definitions.js
git commit -m "feat: Tcl definitionText 扩展到行尾包含行末注释"
```

---

### Task 3: 截断工具函数

**Files:**
- Modify: `src/definitions.js`

- [ ] **Step 1: 新增 truncateDefinitionText 函数**

在 `src/definitions.js` 的 `clearDefinitionCache()` 之后、`module.exports` 之前添加：

```javascript
/**
 * 截断定义文本中过长的行。
 * @param {string} text 定义文本
 * @param {number} maxWidth 每行最大字符数
 * @returns {string} 截断后的文本
 */
function truncateDefinitionText(text, maxWidth) {
    if (!text || maxWidth <= 0) return text;
    return text.split('\n').map(line => {
        if (line.length <= maxWidth) return line;
        return line.slice(0, maxWidth - 1) + '\u2026';
    }).join('\n');
}
```

- [ ] **Step 2: 导出 truncateDefinitionText**

修改 `module.exports`：

```javascript
module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
    truncateDefinitionText,
};
```

- [ ] **Step 3: 运行所有现有测试确认无回归**

Run: `node tests/test-definitions.js && node tests/test-scheme-parser.js && node tests/test-tcl-ast-variables.js`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/definitions.js
git commit -m "feat: 新增 truncateDefinitionText 截断工具函数"
```

---

### Task 4: 用户设置项

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 在 configuration.properties 中添加 definitionMaxWidth**

在 `package.json` 的 `"properties"` 对象中，最后一个属性（`sentaurus.snippetPrefixes.RP`，order: 10）之后添加：

```json
"sentaurus.definitionMaxWidth": {
  "type": "number",
  "default": 60,
  "minimum": 20,
  "maximum": 200,
  "description": "用户定义变量/函数提示框中每行最大显示字符数",
  "description.zh-CN": "用户定义变量/函数提示框中每行最大显示字符数",
  "order": 11
}
```

- [ ] **Step 2: 提交**

```bash
git add package.json
git commit -m "feat: 新增 sentaurus.definitionMaxWidth 用户设置项"
```

---

### Task 5: 显示层调用截断

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 在 extension.js 中导入 truncateDefinitionText**

在文件顶部的 `const defs = require('./definitions');` 之后，不需要额外导入（`truncateDefinitionText` 已通过 `defs` 对象可用）。

- [ ] **Step 2: 修改补全提示（第 435 行）**

找到：
```javascript
item.documentation = new vscode.MarkdownString('```scheme\n' + d.definitionText + '\n```');
```

替换为：
```javascript
const maxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
item.documentation = new vscode.MarkdownString('```scheme\n' + defs.truncateDefinitionText(d.definitionText, maxWidth) + '\n```');
```

> 注意：`maxWidth` 应在循环外读取一次，避免每次迭代都访问配置。将 `const maxWidth = ...` 提取到 `const userItems = filteredDefs.map(d => {` 之前。

- [ ] **Step 3: 修改悬停提示（第 481 行）**

找到：
```javascript
md.appendCodeblock(def.definitionText, langId);
```

替换为：
```javascript
const hoverMaxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
md.appendCodeblock(defs.truncateDefinitionText(def.definitionText, hoverMaxWidth), langId);
```

> 注意：悬停回调中每次触发都需要读取配置（用户可能随时修改设置），所以这里单独读取。

- [ ] **Step 4: 运行所有测试确认无回归**

Run: `node tests/test-definitions.js && node tests/test-scheme-parser.js && node tests/test-tcl-ast-variables.js`
Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/extension.js
git commit -m "feat: 补全和悬停提示应用 definitionText 截断逻辑"
```

---

### Task 6: 更新测试断言

**Files:**
- Modify: `tests/test-scheme-parser.js`
- Modify: `tests/test-definitions.js`
- Modify: `tests/test-tcl-ast-variables.js`

- [ ] **Step 1: 在 test-scheme-parser.js 中新增行末注释测试**

在现有 `definitionText 字段` 测试之后添加：

```javascript
test('definitionText 包含行末注释', () => {
    const text = '(define Lgate 0.01) ; length of gate';
    const { ast } = parse(text);
    const result = analyze(ast, text);
    assert.strictEqual(result.definitions.length, 1);
    assert.ok(result.definitions[0].definitionText.includes('; length of gate'));
});
```

- [ ] **Step 2: 在 test-definitions.js 中新增行末注释测试**

在 `extractSchemeDefinitions` 测试区域中添加：

```javascript
test('definitionText 包含行末注释', () => {
    const text = '(define Lgate 0.01) ; length of gate';
    const defs = extractSchemeDefinitions(text);
    assert.strictEqual(defs.length, 1);
    assert.ok(defs[0].definitionText.includes('; length of gate'));
});
```

- [ ] **Step 3: 在 test-tcl-ast-variables.js 中更新 set 精确匹配断言**

由于 mock 节点没有 sourceText，`getVariables(root)` 不传 sourceText，走兜底分支返回 `node.text`，**不需要修改**。

但可以新增一个注释测试（可选，需要在有 WASM 的环境下运行，这里用注释说明跳过原因）：

> 跳过：Tcl 行末注释测试需要 tree-sitter WASM 环境，在纯 mock 测试中无法验证。由集成测试覆盖。

- [ ] **Step 4: 新增 truncateDefinitionText 单元测试**

在 `tests/test-definitions.js` 的 `getDefinitions (缓存):` 区域之前添加：

```javascript
console.log('\ntruncateDefinitionText:');

test('短行不截断', () => {
    assert.strictEqual(truncateDefinitionText('(define x 1)', 60), '(define x 1)');
});

test('长行截断并加省略号', () => {
    const longLine = '(define very-long-variable-name-that-exceeds-max-width 0.01)';
    const result = truncateDefinitionText(longLine, 40);
    assert.strictEqual(result.length, 40);
    assert.ok(result.endsWith('\u2026'));
});

test('多行只截断超长行', () => {
    const text = '(define x\n  12345678901234567890123456789012345678901234567890)';
    const result = truncateDefinitionText(text, 30);
    const lines = result.split('\n');
    assert.strictEqual(lines[0], '(define x'); // 短行不变
    assert.ok(lines[1].endsWith('\u2026'));     // 长行截断
    assert.ok(lines[1].length <= 30);
});

test('maxWidth=0 返回原文', () => {
    assert.strictEqual(truncateDefinitionText('abc', 0), 'abc');
});

test('null/undefined 返回原值', () => {
    assert.strictEqual(truncateDefinitionText(null, 60), null);
    assert.strictEqual(truncateDefinitionText(undefined, 60), undefined);
});
```

注意需要在文件顶部导入中添加 `truncateDefinitionText`：

```javascript
const { findBalancedExpression, extractSchemeDefinitions, extractTclDefinitionsAst, extractDefinitions, getDefinitions, clearDefinitionCache, truncateDefinitionText } = require('../src/definitions');
```

- [ ] **Step 5: 运行所有测试**

Run: `node tests/test-definitions.js && node tests/test-scheme-parser.js && node tests/test-tcl-ast-variables.js`
Expected: 全部通过

- [ ] **Step 6: 提交**

```bash
git add tests/test-scheme-parser.js tests/test-definitions.js tests/test-tcl-ast-variables.js
git commit -m "test: 添加 definitionText 行末注释和截断测试"
```

---

### Task 7: 最终验证

- [ ] **Step 1: 运行全部测试套件**

Run: `node tests/test-definitions.js && node tests/test-scheme-parser.js && node tests/test-tcl-ast-variables.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-signature-provider.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-var-refs.js && node tests/test-snippet-prefixes.js && node tests/test-tcl-ast-utils.js && node tests/test-tcl-ast-variables.js && node tests/test-tcl-document-symbol.js && node tests/test-tcl-scope-map.js && node tests/test-tcl-var-refs.js && node tests/test-undef-var-integration.js && node tests/test-expression-converter.js`
Expected: 全部通过

- [ ] **Step 2: VSCode Extension Development Host 手动验证**

1. 按 F5 启动 Extension Development Host
2. 打开一个 SDE 文件，输入 `(define Lgate 0.01) ; length of gate`
3. 在下方引用 `Lgate`，验证补全提示显示完整行（含注释）
4. 悬停在 `Lgate` 上，验证悬停提示显示完整行（含注释）
5. 打开一个 Tcl 文件（如 `*_des.cmd`），输入 `set x 42 ;# comment`
6. 验证补全和悬停提示包含行末注释
7. 修改设置 `sentaurus.definitionMaxWidth` 为较小值（如 20），验证截断生效
