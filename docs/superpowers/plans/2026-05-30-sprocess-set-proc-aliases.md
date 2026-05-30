# SProcess Set/Proc Alias Definitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 SProcess 的 `define`/`fset` 被识别为 `set` 类变量定义，让 `defineproc`/`fproc` 被识别为 `proc` 类过程定义，消除相关未定义变量误报，并补充人工验收脚本。

**Architecture:** 在 Tcl AST 共享工具层集中定义 set-like/proc-like 命令映射，变量提取、作用域索引、定义跳转和函数调用语义复用同一套判断。测试先覆盖真实 WASM AST，再补 mock 单元测试，避免只修正其中一条诊断路径。

**Tech Stack:** VSCode 扩展 CommonJS、`web-tree-sitter` Tcl WASM、Node.js `assert` 测试、Sentaurus SProcess `.cmd` 人工验收文件。

---

## File Structure

- Modify: `src/lsp/tcl-ast-utils.js`
  - 新增 `define/fset` 与 `defineproc/fproc` 的共享判定和提取 helper。
  - 扩展 `_extractCommandVarDefs` / `_extractErrorVarDefs`，让错误恢复路径也识别 set-like 命令。
- Modify: `src/lsp/tcl-variable-extractor.js`
  - 在普通 `command` 路径提取 `define/fset` 变量。
  - 在普通 `command` 路径提取 `defineproc/fproc` 函数名、参数和 body 局部定义。
- Modify: `src/lsp/tcl-scope.js`
  - 让 `ScopeIndex` 把 `define/fset` 纳入可见变量集合。
  - 让 `defineproc/fproc` 纳入 `globalProcNames` 和 proc body 作用域。
- Modify: `tests/test-implicit-var-functions.js`
  - 增加 mock AST 单元测试，验证 `getVariables` 与 `buildScopeIndex` 的基础路径。
- Modify: `tests/test-undef-var-integration.js`
  - 增加真实 WASM AST 集成测试，覆盖用户报告的实际解析形态。
- Create: `D:/CODE/Project/sentaurus-syntax-highlight/display_test/TEST_SPROCESS/test_set_proc_def_fps.cmd`
  - 主工作树人工验收脚本，文件名匹配 `*_fps.cmd`，打开后应自动识别为 `sprocess`。

---

### Task 1: Add Failing Tests For `define`/`fset`

**Files:**
- Modify: `tests/test-implicit-var-functions.js`
- Modify: `tests/test-undef-var-integration.js`

- [ ] **Step 1: Add mock AST tests for variable extraction**

Append before the `// ════════════════════════════════════════════════════════` section "二、作用域可见性" in `tests/test-implicit-var-functions.js`:

```javascript
// ── 18. SProcess define / fset ──
test('getVariables: define Xmax 700 → 提取变量 Xmax', () => {
    const cmd = makeCommandNode('define', ['Xmax', '700'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 15);
    const vars = varExtractor.getVariables(root, 'define Xmax 700');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'Xmax');
    assert.strictEqual(vars[0].kind, 'variable');
});

test('getVariables: fset SD_L 300 → 提取变量 SD_L', () => {
    const cmd = makeCommandNode('fset', ['SD_L', '300'], 0);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 13);
    const vars = varExtractor.getVariables(root, 'fset SD_L 300');
    assert.strictEqual(vars.length, 1, `应有 1 个变量，实际 ${vars.length}`);
    assert.strictEqual(vars[0].name, 'SD_L');
    assert.strictEqual(vars[0].kind, 'variable');
});
```

- [ ] **Step 2: Add mock AST tests for scope visibility**

Append near the other `Scope:` tests in `tests/test-implicit-var-functions.js`:

```javascript
// ── define/fset 全局作用域 ──
test('Scope: define Xmax 700 全局可见', () => {
    const cmd = makeCommandNode('define', ['Xmax', '700'], 0);
    assertVisible('define Xmax 700', cmd, 'Xmax', 1, 'define 全局作用域');
});

test('Scope: fset SD_L 300 全局可见', () => {
    const cmd = makeCommandNode('fset', ['SD_L', '300'], 0);
    assertVisible('fset SD_L 300', cmd, 'SD_L', 1, 'fset 全局作用域');
});
```

- [ ] **Step 3: Add real WASM integration test**

Append before the final summary in `tests/test-undef-var-integration.js`:

```javascript
    test('SProcess define/fset 定义的变量在后续引用处可见', () => {
        parseAndCheck(
            'define Xmax 700\nfset SD_L 300\nfset M1_left [expr {$SD_L + 10}]\nline x location= $Xmax<nm>\nline y location= $M1_left<nm>',
            [
                { name: 'SD_L', line: 3 },
                { name: 'Xmax', line: 4 },
                { name: 'M1_left', line: 5 },
            ],
            []
        );
    });
```

- [ ] **Step 4: Run tests and verify they fail**

Run:

```powershell
node tests/test-implicit-var-functions.js
node tests/test-undef-var-integration.js
```

Expected:
- `define Xmax 700` and `fset SD_L 300` extraction/scope tests fail because no variables are collected.
- WASM integration test fails because `$SD_L` / `$Xmax` / `$M1_left` are not visible.

---

### Task 2: Implement Shared Set-Like Command Support

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`
- Modify: `src/lsp/tcl-variable-extractor.js`
- Modify: `src/lsp/tcl-scope.js`

- [ ] **Step 1: Add shared helper constants**

In `src/lsp/tcl-ast-utils.js`, near `_isWordType`, add:

```javascript
const TCL_SET_LIKE_COMMANDS = new Set(['set', 'define', 'fset']);

function _isSetLikeCommand(cmdName) {
    return TCL_SET_LIKE_COMMANDS.has(cmdName);
}

function _extractSetLikeVarDef(words) {
    if (words.length < 2 || !_isWordType(words[1])) return null;
    const name = words[1].text;
    if (name.startsWith('env(') || /^\d/.test(name)) return null;
    return { name, line: words[1].startPosition.row + 1 };
}
```

Export `_isSetLikeCommand` and `_extractSetLikeVarDef` from `module.exports`.

- [ ] **Step 2: Use helper in command var extraction**

In `_extractCommandVarDefs`, replace the current standalone `incr/append/lappend` block start with:

```javascript
    if (_isSetLikeCommand(cmdName)) {
        const def = _extractSetLikeVarDef(words);
        if (def) defs.push(def);
    } else if (cmdName === 'lassign') {
```

Keep the existing `incr/append/lappend` branch later in the chain.

- [ ] **Step 3: Use helper in ERROR extraction**

In `_extractErrorVarDefs`, change Pass 1:

```javascript
        const isSet = cur.type === 'set'
            || (cur.type === 'simple_word' && _isSetLikeCommand(cur.text));
```

In Pass 3, before `if (cmdName === 'lassign')`, add:

```javascript
    if (_isSetLikeCommand(cmdName)) {
        if (node.childCount >= 2) {
            const arg = node.child(1);
            if (arg && (arg.type === 'simple_word' || arg.type === 'id')) {
                const name = arg.text;
                if (!name.startsWith('env(') && !/^\d/.test(name)) {
                    defs.push({ name, line: arg.startPosition.row + 1 });
                }
            }
        }
    } else if (cmdName === 'lassign') {
```

- [ ] **Step 4: Update variable extractor command path**

In `src/lsp/tcl-variable-extractor.js`, import the new helpers:

```javascript
    _isSetLikeCommand,
    _extractSetLikeVarDef,
```

In `_handleCommand`, before `if (cmdName === 'for')`, add:

```javascript
    if (_isSetLikeCommand(cmdName)) {
        const words = _getCommandWords(node);
        const def = _extractSetLikeVarDef(words);
        if (def) {
            const defText = lines
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
                : node.text;
            results.push({
                name: def.name,
                line: def.line,
                endLine: def.line,
                definitionText: defText,
                kind: 'variable',
            });
        }
        return;
    }
```

- [ ] **Step 5: Update scope index command path**

In `src/lsp/tcl-scope.js`, import the new helpers:

```javascript
    _isSetLikeCommand,
    _extractSetLikeVarDef,
```

Add `define` and `fset` to `_HANDLED_CMDS`.

Replace top-level command handling for `cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append'` with:

```javascript
                if (_isSetLikeCommand(cmdName)) {
                    const words = _getCommandWords(child);
                    const def = _extractSetLikeVarDef(words);
                    if (def) {
                        globalDefs.push({ name: def.name, defLine: def.line, isProc: false });
                    }
                } else if (cmdName === 'lappend' || cmdName === 'append') {
```

In `_collectLocalDefsForIndex`, before the `cmdName === 'for'` branch, add:

```javascript
                if (_isSetLikeCommand(cmdName)) {
                    const words = _getCommandWords(child);
                    const def = _extractSetLikeVarDef(words);
                    if (def) defs.push({ name: def.name, defLine: def.line });
                } else if (cmdName === 'for') {
```

- [ ] **Step 6: Run tests and verify Task 1 is green**

Run:

```powershell
node tests/test-implicit-var-functions.js
node tests/test-undef-var-integration.js
```

Expected:
- All new `define/fset` tests pass.
- Existing implicit variable tests remain green.

---

### Task 3: Add Failing Tests For `defineproc`/`fproc`

**Files:**
- Modify: `tests/test-undef-var-integration.js`
- Modify: `tests/test-tcl-ast-variables.js`

- [ ] **Step 1: Add mock AST tests for proc-like extraction**

Append in `tests/test-tcl-ast-variables.js` after the existing proc tests:

```javascript
test('提取 defineproc 函数名和参数', () => {
    const args = makeNode('braced_word', '{a b}', [
        makeNode('{', '{', [], 0, 15, 0, 16),
        makeNode('command', 'a b', [
            makeNode('simple_word', 'a', [], 0, 16, 0, 17),
            makeNode('word_list', '', [makeNode('simple_word', 'b', [], 0, 18, 0, 19)], 0, 18, 0, 19),
        ], 0, 16, 0, 19),
        makeNode('}', '}', [], 0, 19, 0, 20),
    ], 0, 15, 0, 20);
    const body = makeNode('braced_word', '{ body }', [], 0, 21, 0, 29);
    const wordList = makeNode('word_list', '', [
        makeNode('simple_word', 'myProc', [], 0, 11, 0, 17),
        args,
        body,
    ], 0, 11, 0, 29);
    const cmd = makeNode('command', 'defineproc myProc {a b} { body }', [
        makeNode('simple_word', 'defineproc', [], 0, 0, 0, 10),
        wordList,
    ], 0, 0, 0, 29);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 29);
    const vars = varExtractor.getVariables(root);
    assert.ok(vars.some(v => v.name === 'myProc' && v.kind === 'function'));
    assert.ok(vars.some(v => v.name === 'a' && v.kind === 'parameter'));
    assert.ok(vars.some(v => v.name === 'b' && v.kind === 'parameter'));
});

test('提取 fproc 函数名和参数', () => {
    const args = makeNode('braced_word', '{value factor}', [
        makeNode('{', '{', [], 0, 10, 0, 11),
        makeNode('command', 'value factor', [
            makeNode('simple_word', 'value', [], 0, 11, 0, 16),
            makeNode('word_list', '', [makeNode('simple_word', 'factor', [], 0, 17, 0, 23)], 0, 17, 0, 23),
        ], 0, 11, 0, 23),
        makeNode('}', '}', [], 0, 23, 0, 24),
    ], 0, 10, 0, 24);
    const body = makeNode('braced_word', '{ body }', [], 0, 25, 0, 33);
    const wordList = makeNode('word_list', '', [
        makeNode('simple_word', 'scale', [], 0, 6, 0, 11),
        args,
        body,
    ], 0, 6, 0, 33);
    const cmd = makeNode('command', 'fproc scale {value factor} { body }', [
        makeNode('simple_word', 'fproc', [], 0, 0, 0, 5),
        wordList,
    ], 0, 0, 0, 33);
    const root = makeNode('program', '', [cmd], 0, 0, 0, 33);
    const vars = varExtractor.getVariables(root);
    assert.ok(vars.some(v => v.name === 'scale' && v.kind === 'function'));
    assert.ok(vars.some(v => v.name === 'value' && v.kind === 'parameter'));
    assert.ok(vars.some(v => v.name === 'factor' && v.kind === 'parameter'));
});
```

- [ ] **Step 2: Add real WASM integration test**

In `tests/test-undef-var-integration.js`, add:

```javascript
    test('SProcess defineproc/fproc 参数与局部变量在 body 内可见', () => {
        parseAndCheck(
            'defineproc add {a b} {\n    set sum [expr {$a + $b}]\n    puts $sum\n}\nfproc scale {value factor} {\n    set scaled [expr {$value * $factor}]\n    puts $scaled\n}',
            [
                { name: 'a', line: 2 },
                { name: 'b', line: 2 },
                { name: 'sum', line: 3 },
                { name: 'value', line: 6 },
                { name: 'factor', line: 6 },
                { name: 'scaled', line: 7 },
            ],
            []
        );
    });
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```powershell
node tests/test-tcl-ast-variables.js
node tests/test-undef-var-integration.js
```

Expected:
- New `defineproc/fproc` tests fail because command-form proc definitions are not collected.

---

### Task 4: Implement Shared Proc-Like Command Support

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js`
- Modify: `src/lsp/tcl-variable-extractor.js`
- Modify: `src/lsp/tcl-scope.js`

- [ ] **Step 1: Add proc-like helpers**

In `src/lsp/tcl-ast-utils.js`, add:

```javascript
const TCL_PROC_LIKE_COMMANDS = new Set(['proc', 'defineproc', 'fproc']);

function _isProcLikeCommand(cmdName) {
    return TCL_PROC_LIKE_COMMANDS.has(cmdName);
}

function _extractProcLikeParams(argsNode) {
    const params = [];
    if (!argsNode) return params;
    _extractBracedWordVars(argsNode, params);
    return params;
}
```

Export `_isProcLikeCommand` and `_extractProcLikeParams`.

- [ ] **Step 2: Add command-form proc handler in variable extractor**

In `src/lsp/tcl-variable-extractor.js`, import:

```javascript
    _isProcLikeCommand,
    _extractProcLikeParams,
```

Add helper:

```javascript
function _handleProcLikeCommand(node, results, sourceText, lines) {
    const words = _getCommandWords(node);
    const nameNode = words[1];
    const argsNode = words[2];
    const bodyNode = words[3];
    if (!nameNode || !nameNode.text || nameNode.text.startsWith('$')) return;

    const defText = lines
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
        : node.text;

    results.push({
        name: nameNode.text,
        line: nameNode.startPosition.row + 1,
        endLine: nameNode.endPosition.row + 1,
        definitionText: defText,
        kind: 'function',
    });

    for (const p of _extractProcLikeParams(argsNode)) {
        results.push({
            name: p.name,
            line: p.line,
            endLine: p.line,
            definitionText: defText,
            kind: 'parameter',
        });
    }

    if (bodyNode && bodyNode.type === 'braced_word') {
        _collectVariables(bodyNode, results, sourceText, lines);
    }
}
```

In `_handleCommand`, after set-like handling and before `for`, add:

```javascript
    if (_isProcLikeCommand(cmdName)) {
        _handleProcLikeCommand(node, results, sourceText, lines);
        return;
    }
```

- [ ] **Step 3: Add command-form proc handling in scope index**

In `src/lsp/tcl-scope.js`, import:

```javascript
    _isProcLikeCommand,
    _extractProcLikeParams,
```

Add `defineproc` and `fproc` to `_HANDLED_CMDS`.

Add helper near `_buildProcScope`:

```javascript
function _handleProcLikeCommandForIndex(node, globalDefs, procScopes) {
    const words = _getCommandWords(node);
    const nameNode = words[1];
    const argsNode = words[2];
    const bodyNode = words[3];
    if (!nameNode || !nameNode.text || nameNode.text.startsWith('$')) return;

    const procName = nameNode.text;
    globalDefs.push({
        name: procName,
        defLine: nameNode.startPosition.row + 1,
        isProc: true,
    });

    if (bodyNode && bodyNode.type === 'braced_word') {
        const params = _extractProcLikeParams(argsNode).map(p => p.name);
        _buildProcScope(procName, bodyNode, params, procScopes);
    }
}
```

In the top-level `child.type === 'command'` block, after set-like handling, add:

```javascript
                } else if (_isProcLikeCommand(cmdName)) {
                    _handleProcLikeCommandForIndex(child, globalDefs, procScopes);
```

- [ ] **Step 4: Run tests and verify Task 3 is green**

Run:

```powershell
node tests/test-tcl-ast-variables.js
node tests/test-undef-var-integration.js
```

Expected:
- `defineproc/fproc` function and parameter extraction passes.
- Proc body references to parameters and local variables no longer warn.

---

### Task 5: Create Manual Acceptance Script In Main Worktree

**Files:**
- Create: `D:/CODE/Project/sentaurus-syntax-highlight/display_test/TEST_SPROCESS/test_set_proc_def_fps.cmd`

- [ ] **Step 1: Ensure target folder exists**

Run:

```powershell
New-Item -ItemType Directory -Force 'D:/CODE/Project/sentaurus-syntax-highlight/display_test/TEST_SPROCESS'
```

Expected:
- Directory exists.

- [ ] **Step 2: Create acceptance file**

Create `D:/CODE/Project/sentaurus-syntax-highlight/display_test/TEST_SPROCESS/test_set_proc_def_fps.cmd` with exactly:

```tcl
# SProcess manual acceptance: define/fset/defineproc/fproc aliases
# Open this file in VSCode. It should be detected as language id "sprocess"
# because the filename ends with _fps.cmd.
#
# Expected after the implementation:
# - No undefined-variable warning on variables defined by define/fset.
# - No undefined-variable warning for defineproc/fproc parameters or local vars.
# - The final intentionally undefined variable should still warn.

# define is equivalent to set for SProcess variables stored in TDR.
define Xmax 700
define Ymin 0

# fset is equivalent to define, and therefore equivalent to set for diagnostics.
fset SD_L 300
fset STI_L 150
fset M1_left [expr {$SD_L + 25}]
fset M1_right [expr {$M1_left + $STI_L}]

line x location= $Xmax<nm> spacing= 100<nm> tag= top
line y location= $Ymin<nm> spacing= 100<nm> tag= left
line y location= $M1_right<nm> spacing= 100<nm> tag= right

# defineproc is equivalent to proc, but saved/restored through TDR.
defineproc add_pitch {base delta} {
    set localFromDefineProc [expr {$base + $delta}]
    return $localFromDefineProc
}

# fproc is equivalent to defineproc.
fproc scale_pitch {value factor} {
    set localFromFproc [expr {$value * $factor}]
    return $localFromFproc
}

fset FromDefineProc [add_pitch $M1_right $SD_L]
fset FromFproc [scale_pitch $FromDefineProc 2]

line y location= $FromDefineProc<nm> spacing= 100<nm> tag= after_defineproc
line y location= $FromFproc<nm> spacing= 100<nm> tag= after_fproc

# Negative control: this should still show "未定义的变量".
line x location= $THIS_SHOULD_STILL_WARN<nm> spacing= 100<nm> tag= undef_control
```

- [ ] **Step 3: Manual verification**

Open:

```powershell
code 'D:/CODE/Project/sentaurus-syntax-highlight/display_test/TEST_SPROCESS/test_set_proc_def_fps.cmd'
```

Expected:
- `$SD_L`, `$STI_L`, `$M1_left`, `$M1_right`, `$Xmax`, `$Ymin`, `$localFromDefineProc`, `$localFromFproc`, `$FromDefineProc`, `$FromFproc` have no undefined-variable diagnostics.
- `$THIS_SHOULD_STILL_WARN` still has one undefined-variable diagnostic.

---

### Task 6: Full Verification And Commit

**Files:**
- Verify: `src/lsp/tcl-ast-utils.js`
- Verify: `src/lsp/tcl-variable-extractor.js`
- Verify: `src/lsp/tcl-scope.js`
- Verify: `tests/test-implicit-var-functions.js`
- Verify: `tests/test-tcl-ast-variables.js`
- Verify: `tests/test-undef-var-integration.js`

- [ ] **Step 1: Run focused tests**

Run:

```powershell
node tests/test-implicit-var-functions.js
node tests/test-tcl-ast-variables.js
node tests/test-undef-var-integration.js
```

Expected:
- All focused tests pass.

- [ ] **Step 2: Run broader related tests**

Run:

```powershell
node tests/test-tcl-scope-index.js
node tests/test-variable-reference.js
node tests/test-tcl-var-refs.js
```

Expected:
- All related Tcl definition/reference tests pass.

- [ ] **Step 3: Check working tree**

Run:

```powershell
git status --short
```

Expected:
- Only intended source/test/plan files changed in the implementation worktree.
- `package-lock.json` remains an unrelated pre-existing change and is not staged.

- [ ] **Step 4: Commit after human acceptance**

Run only after manual acceptance:

```powershell
git add src/lsp/tcl-ast-utils.js src/lsp/tcl-variable-extractor.js src/lsp/tcl-scope.js tests/test-implicit-var-functions.js tests/test-tcl-ast-variables.js tests/test-undef-var-integration.js docs/superpowers/plans/2026-05-30-sprocess-set-proc-aliases.md
git commit -m "fix: 识别 SProcess set/proc 等价命令

将 define/fset 纳入 Tcl 变量定义提取与作用域索引，避免 SProcess 中通过 TDR 持久化变量时产生未定义变量误报。

将 defineproc/fproc 纳入过程定义与参数作用域处理，使函数定义、参数引用和调用语义与 proc 保持一致。

补充 mock AST 与真实 WASM 解析器回归测试，覆盖 SProcess 等价命令的变量可见性和过程作用域。"
```

Expected:
- Commit succeeds with Chinese message and detailed body.

---

## Self-Review

- Spec coverage: 覆盖 `define`、`fset`、`defineproc`、`fproc` 四个关键词；覆盖自动化测试与主工作树人工验收脚本。
- Placeholder scan: 本计划没有 `TBD`、`TODO`、"implement later" 等占位步骤；所有代码修改步骤都有具体片段。
- Type consistency: helper 命名统一为 `_isSetLikeCommand`、`_extractSetLikeVarDef`、`_isProcLikeCommand`、`_extractProcLikeParams`；后续任务引用保持一致。
