# Phase 4: Polish — 细节打磨 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除剩余的低优先级性能瓶颈，优化 Tcl 变量提取中的重复字符串分割、Scheme 函数调用查找的子树遍历、以及 Tcl 括号诊断的中间数组分配。

**Architecture:** 三个独立的微优化，各改动不超过 20 行，互不依赖。#12/#13 已被 Phase 2 缓存层自动解决，本计划只处理 #17、#18、#19。

**Tech Stack:** 纯 JavaScript（CommonJS），web-tree-sitter WASM，VSCode Extension API

---

## 文件变更矩阵

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lsp/tcl-ast-utils.js` | 修改 | #19: `_extendNodeTextToLineEnd` 接受 lines 数组替代 sourceText；#18: `findMismatchedBraces` 逐字符扫描 |
| `src/lsp/semantic-dispatcher.js` | 修改 | #17: `findEnclosingCall` 的 `walk` 添加行范围剪枝 |
| `tests/test-tcl-ast-variables.js` | 不变 | #19 回归验证 |
| `tests/test-semantic-dispatcher.js` | 不变 | #17 回归验证 |
| `tests/test-tcl-ast-utils.js` | 不变 | #18 回归验证 |

---

### Task 1: #19 _extendNodeTextToLineEnd 缓存 — 消除重复 split('\n')

**背景：** `_extendNodeTextToLineEnd` 每次调用都执行 `sourceText.split('\n')`，而它在一个 `getVariables` 调用中可能被执行数十次（每个变量定义一次）。对于一个 1000 行、100 个变量的文件，这意味着 100 次 O(n) 的字符串分割。

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`

- [ ] **Step 1: 运行现有测试确认基线**

Run: `node tests/test-tcl-ast-variables.js`
Expected: 全部 13 个测试通过，无输出表示成功

- [ ] **Step 2: 修改 getVariables — 预分割 sourceText**

将 `getVariables` 改为预分割 sourceText 并传递 lines 数组：

```javascript
// 原代码 (line 156-160):
// function getVariables(root, sourceText) {
//     const results = [];
//     _collectVariables(root, results, sourceText);
//     return results;
// }

// 新代码:
function getVariables(root, sourceText) {
    const results = [];
    const lines = sourceText ? sourceText.split('\n') : null;
    _collectVariables(root, results, sourceText, lines);
    return results;
}
```

- [ ] **Step 3: 修改 _collectVariables — 传递 lines**

给 `_collectVariables` 增加 `lines` 参数，传递给所有 handler：

```javascript
// 原代码 (line 791):
// function _collectVariables(node, results, sourceText) {

// 新代码:
function _collectVariables(node, results, sourceText, lines) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _handleSet(child, results, lines);
                break;

            case 'procedure':
                _handleProcedure(child, results, sourceText, lines);
                break;

            case 'foreach':
                _handleForeach(child, results, sourceText, lines);
                break;

            case 'while':
                _handleWhile(child, results, sourceText, lines);
                break;

            case 'command':
                _handleCommand(child, results, sourceText, lines);
                break;

            default:
                _collectVariables(child, results, sourceText, lines);
                break;
        }
    }
}
```

**注意：** 只有 `_handleSet` 不再需要 `sourceText`（只需 `lines`），而 `_handleProcedure`、`_handleForeach` 仍需 `sourceText` 用于递归调用 `_collectVariables`（进入 proc body / foreach body）。`_handleWhile`、`_handleCommand` 同理。

- [ ] **Step 4: 修改 _handleSet — 接受 lines**

```javascript
// 原代码 (line 833-851):
// function _handleSet(node, results, sourceText) {
//     const idNode = _findChildByType(node, 'id');
//     if (!idNode) return;
//     const name = idNode.text;
//     if (name.startsWith('env(')) return;
//     const defText = sourceText
//         ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
//         : node.text;
//     results.push({...});
// }

// 新代码:
function _handleSet(node, results, lines) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;

    const name = idNode.text;
    if (name.startsWith('env(')) return;

    const defText = lines
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
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

- [ ] **Step 5: 修改 _handleProcedure — 接受 lines**

```javascript
// 原代码 _handleProcedure 中 (line 858-908):
// 修改签名和 _extendNodeTextToLineEnd 调用

// 新签名（仍需 sourceText 用于递归 _collectVariables 进入 body）:
function _handleProcedure(node, results, sourceText, lines) {
```

在 `_handleProcedure` 内部，有两处修改：

**修改 1：** _extendNodeTextToLineEnd 调用替换：
```javascript
// 原:
// const defText = sourceText
//     ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
//     : node.text;

// 新:
const defText = lines
    ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
    : node.text;
```

**修改 2：** 递归调用 `_collectVariables(bodyNode, ...)` 传递 lines：
```javascript
// 原:
// _collectVariables(bodyNode, results, sourceText);

// 新:
_collectVariables(bodyNode, results, sourceText, lines);
```

- [ ] **Step 6: 修改 _handleForeach — 接受 lines**

```javascript
// 原代码 _handleForeach 中 (line 915-939):

// 新签名（仍需 sourceText 用于递归 _collectVariables 进入 body）:
function _handleForeach(node, results, sourceText, lines) {
```

内部有两处修改：

**修改 1：** _extendNodeTextToLineEnd 调用替换：
```javascript
// 原:
// const defText = sourceText
//     ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
//     : node.text;

// 新:
const defText = lines
    ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
    : node.text;
```

**修改 2：** 递归调用 `_collectVariables(bodyNode, ...)` 传递 lines：
```javascript
// 原:
// _collectVariables(bodyNode, results, sourceText);

// 新:
_collectVariables(bodyNode, results, sourceText, lines);
```

- [ ] **Step 7: 修改 _handleWhile — 传递 lines**

```javascript
// 原代码 (line 945-954):
// function _handleWhile(node, results, sourceText) {

// 新代码:
function _handleWhile(node, results, sourceText, lines) {
    const bracedWords = _findChildrenByType(node, 'braced_word');
    if (bracedWords.length > 0) {
        for (const bw of bracedWords) {
            _collectVariables(bw, results, sourceText, lines);
        }
    }
}
```

- [ ] **Step 8: 修改 _handleCommand — 传递 lines**

```javascript
// 原代码 (line 960-978):
// function _handleCommand(node, results, sourceText) {

// 新代码:
function _handleCommand(node, results, sourceText, lines) {
    if (node.childCount === 0) return;

    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        _collectVariables(node, results, sourceText, lines);
        return;
    }

    const cmdName = firstChild.text;

    if (cmdName === 'for') {
        _handleFor(node, results, sourceText, lines);
    } else {
        _collectVariables(node, results, sourceText, lines);
    }
}
```

- [ ] **Step 9: 修改 _handleFor — 传递 lines**

```javascript
// 原代码 (line 985-991):
// function _handleFor(node, results, sourceText) {

// 新代码:
function _handleFor(node, results, sourceText, lines) {
    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectVariables(bw, results, sourceText, lines);
    }
}
```

- [ ] **Step 10: 修改 _extendNodeTextToLineEnd — 接受 lines 数组**

```javascript
// 原代码 (line 1003-1013):
// function _extendNodeTextToLineEnd(nodeText, endRow, sourceText) {
//     const lines = sourceText.split('\n');
//     if (endRow >= lines.length) return nodeText;
//     const fullLine = lines[endRow];
//     const nodeLines = nodeText.split('\n');
//     const lastNodeLine = nodeLines[nodeLines.length - 1];
//     const idx = fullLine.lastIndexOf(lastNodeLine);
//     if (idx < 0) return nodeText;
//     const tail = fullLine.slice(idx + lastNodeLine.length).trimStart();
//     return tail ? nodeText + tail : nodeText;
// }

// 新代码:
function _extendNodeTextToLineEnd(nodeText, endRow, lines) {
    if (!lines || endRow >= lines.length) return nodeText;
    const fullLine = lines[endRow];
    const nodeLines = nodeText.split('\n');
    const lastNodeLine = nodeLines[nodeLines.length - 1];
    const idx = fullLine.lastIndexOf(lastNodeLine);
    if (idx < 0) return nodeText;
    const tail = fullLine.slice(idx + lastNodeLine.length).trimStart();
    return tail ? nodeText + tail : nodeText;
}
```

- [ ] **Step 11: 运行回归测试**

Run: `node tests/test-tcl-ast-variables.js`
Expected: 全部 13 个测试通过

同时运行: `node tests/test-tcl-ast-utils.js`
Expected: 全部 14 个测试通过

- [ ] **Step 12: 提交**

```bash
git add src/lsp/tcl-ast-utils.js
git commit -m "perf(#19): 预分割 sourceText 为 lines 数组，消除 _extendNodeTextToLineEnd 重复 split"
```

---

### Task 2: #17 findEnclosingCall 行范围剪枝 — 减少无效 AST 遍历

**背景：** `findEnclosingCall` 的 `walk` 函数遍历整个 AST，即使节点的行范围不包含光标位置也会递归其子树。对于 1000 行文件，大量不相关的子树被无意义地遍历。优化：当节点的 `endLine < line` 或 `node.line > line` 时，跳过其子树。

**Files:**
- Modify: `src/lsp/semantic-dispatcher.js`

- [ ] **Step 1: 运行现有测试确认基线**

Run: `node tests/test-semantic-dispatcher.js`
Expected: 全部 17 个测试通过

- [ ] **Step 2: 修改 findEnclosingCall — 添加行范围剪枝**

```javascript
// 原代码 (line 50-78):
// function findEnclosingCall(ast, line, column, lineStarts) {
//     let best = null;
//     function walk(node) {
//         if (node.type === 'List') {
//             const ec = effectiveChildren(node);
//             const inRange = line >= node.line && line <= node.endLine;
//             ...
//             for (const child of node.children) {
//                 walk(child);
//             }
//         } else if (node.type === 'Quote') {
//             walk(node.expression);
//         } else if (node.type === 'Program') {
//             for (const child of node.body) walk(child);
//         }
//     }
//     walk(ast);
//     return best;
// }

// 新代码:
function findEnclosingCall(ast, line, column, lineStarts) {
    let best = null;

    function walk(node) {
        if (node.type === 'List') {
            // 剪枝：节点范围不含光标行，跳过整个子树
            if (node.endLine < line || node.line > line) return;

            const ec = effectiveChildren(node);
            const nodeCol = toCol(node.start, node.line, lineStarts);
            const nodeEndCol = toCol(node.end, node.endLine, lineStarts);
            const inColumn = node.line !== node.endLine || column >= nodeCol && column <= nodeEndCol;
            if (inColumn && ec.length >= 1 && ec[0].type === 'Identifier') {
                if (!best || (node.line >= best.line && node.endLine <= best.endLine)) {
                    best = node;
                }
            }
            for (const child of node.children) {
                walk(child);
            }
        } else if (node.type === 'Quote') {
            // Quote 节点也有 line/endLine，剪枝
            if (node.endLine < line || node.line > line) return;
            walk(node.expression);
        } else if (node.type === 'Program') {
            for (const child of node.body) {
                // Program 子节点（顶层表达式）也可剪枝
                if (child.endLine >= line && child.line <= line) {
                    walk(child);
                }
            }
        }
    }

    walk(ast);
    return best;
}
```

**关键变更说明：**
1. **List 节点剪枝**：在进入 List 处理前先检查 `endLine < line || line > line`，不满足则直接 return
2. **inRange 消除**：通过剪枝检查后必然 inRange，删除原 `inRange` 变量（已变为恒真条件）
3. **Quote 节点剪枝**：同样检查行范围
4. **Program 子节点剪枝**：只遍历行范围包含光标的顶层表达式

- [ ] **Step 3: 运行回归测试**

Run: `node tests/test-semantic-dispatcher.js`
Expected: 全部 17 个测试通过

- [ ] **Step 4: 提交**

```bash
git add src/lsp/semantic-dispatcher.js
git commit -m "perf(#17): findEnclosingCall 行范围剪枝，跳过不包含光标的 AST 子树"
```

---

### Task 3: #18 findMismatchedBraces 逐字符扫描 — 消除中间数组分配

**背景：** `findMismatchedBraces` 使用 `text.split('\n')` 创建全行数组。对于大文件，这分配了 N 个字符串对象。改为逐字符扫描，用 O(1) 额外内存替代 O(n) 数组分配。

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`

- [ ] **Step 1: 运行现有测试确认基线**

Run: `node tests/test-tcl-ast-utils.js`
Expected: 全部 14 个测试通过

- [ ] **Step 2: 重写 findMismatchedBraces — 逐字符扫描**

```javascript
// 原代码 (line 87-145): 使用 text.split('\n') 的行数组方式
// 新代码: 逐字符扫描，O(1) 额外内存

function findMismatchedBraces(text) {
    const errors = [];
    const braceStack = [];
    const len = text.length;
    let lineIdx = 0;
    let col = 0;
    let inString = false;
    let lineIsStarComment = false;
    let foundFirstNonSpace = false;

    for (let i = 0; i < len; i++) {
        const ch = text[i];

        // 换行符：重置行状态
        if (ch === '\n') {
            lineIdx++;
            col = 0;
            inString = false;
            lineIsStarComment = false;
            foundFirstNonSpace = false;
            continue;
        }

        // 检测 * 注释行（行首第一个非空白字符为 *）
        if (!foundFirstNonSpace) {
            if (ch === ' ' || ch === '\t') {
                col++;
                continue;
            }
            foundFirstNonSpace = true;
            if (ch === '*') {
                lineIsStarComment = true;
                col++;
                continue;
            }
        }

        // 跳过 * 注释行的剩余内容
        if (lineIsStarComment) {
            col++;
            continue;
        }

        // # 注释：跳过本行剩余内容
        if (!inString && ch === '#') {
            // 快进到行尾
            const nlPos = text.indexOf('\n', i);
            if (nlPos < 0) break; // 剩余全是注释
            // 下一次循环将从 \n 开始处理
            i = nlPos - 1;
            continue;
        }

        // 跳过转义字符（仅在字符串内）
        if (ch === '\\' && inString) {
            i++; // 跳过下一个字符
            col += 2;
            continue;
        }

        // 字符串边界
        if (ch === '"') {
            inString = !inString;
            col++;
            continue;
        }

        // 花括号匹配（字符串外）
        if (!inString) {
            if (ch === '{') {
                braceStack.push({ line: lineIdx, col, char: '{' });
            } else if (ch === '}') {
                if (braceStack.length === 0) {
                    errors.push({
                        startLine: lineIdx, startCol: col,
                        endLine: lineIdx, endCol: col + 1,
                        message: '多余的 `}`，没有匹配的 `{`',
                    });
                } else {
                    braceStack.pop();
                }
            }
        }

        col++;
    }

    // 未闭合的 {
    for (const unclosed of braceStack) {
        errors.push({
            startLine: unclosed.line, startCol: unclosed.col,
            endLine: unclosed.line, endCol: unclosed.col + 1,
            message: '未闭合的 `{`',
        });
    }

    return errors;
}
```

**语义保持说明：**
1. `inString` 在每个 `\n` 处重置 — 与原实现一致（per-line 字符串状态）
2. `*` 注释行检测：第一个非空白字符为 `*` — 与原 `line.trimStart()[0] === '*'` 等价
3. `#` 注释：使用 `indexOf('\n')` 快进到行尾 — 比逐字符快
4. 转义字符仅在 `inString` 时处理 — 与原实现一致

- [ ] **Step 3: 运行回归测试**

Run: `node tests/test-tcl-ast-utils.js`
Expected: 全部 14 个测试通过（其中 9 个 findMismatchedBraces 测试）

- [ ] **Step 4: 提交**

```bash
git add src/lsp/tcl-ast-utils.js
git commit -m "perf(#18): findMismatchedBraces 逐字符扫描替代 text.split 行数组"
```

---

### Task 4: 全量回归测试 + 整体提交

- [ ] **Step 1: 运行全量测试套件**

Run:
```bash
node tests/test-tcl-ast-utils.js && node tests/test-tcl-ast-variables.js && node tests/test-semantic-dispatcher.js && node tests/test-tcl-scope-map.js && node tests/test-tcl-var-refs.js && node tests/test-undef-var-integration.js && node tests/test-definitions.js && node tests/test-scheme-parser.js && node tests/test-scope-analyzer.js && node tests/test-semantic-dispatcher.js && node tests/test-signature-provider.js && node tests/test-scheme-undef-diagnostic.js && node tests/test-scheme-dup-def-diagnostic.js && node tests/test-scheme-var-refs.js && node tests/test-snippet-prefixes.js && node tests/test-tcl-document-symbol.js && node tests/test-tcl-scope-index.js && node tests/test-expression-converter.js
```

Expected: 所有测试通过，无断言失败

- [ ] **Step 2: 检查最终 git diff**

Run: `git diff main..HEAD --stat`
Expected: 改动限于 `src/lsp/tcl-ast-utils.js` 和 `src/lsp/semantic-dispatcher.js`

- [ ] **Step 3: 合并为一个提交（可选）**

如果 Task 1-3 已分别提交，可选择 squash 为一个提交：
```bash
git rebase -i HEAD~3  # 将三个 perf 提交合并为一个
```

或者保留独立提交以追踪各优化项。
