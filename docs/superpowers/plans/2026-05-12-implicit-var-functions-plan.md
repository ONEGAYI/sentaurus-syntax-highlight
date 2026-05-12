# 隐式变量声明函数完整支持实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有 Tcl 隐式变量声明函数（15 个核心命令 + 8 个子命令）提供完整的 hover（definitionText）、跳转定义（scopeIndex.resolveDefinition）、no-undef（scopeIndex.getVisibleAt）三项支持。同时修复 `buildScopeIndex` 不递归进入 `command_substitution` 节点的深层 bug。

**Architecture:** 三模块协同修复——`tcl-variable-extractor.js` 负责 getVariables（hover/补全数据源），`tcl-scope.js` 负责 buildScopeIndex（跳转/undef 数据源），`tcl-ast-utils.js` 负责 `_extractErrorVarDefs`（ERROR 节点恢复）。三个模块必须同步更新，确保同一命令在三条链路中行为一致。

**Tech Stack:** tree-sitter-tcl WASM AST, CommonJS (无 TypeScript/构建步骤), 纯 Node.js assert 测试

**TDD 基准:** `tests/test-implicit-var-functions.js`（60 用例，当前 11 通过 / 49 失败）

**参考文档:**
- `docs/implicit-var-functions-survey.md` — 全工具隐式变量声明函数统计
- `docs/implicit-var-extracts/` — 各工具函数文档摘录

---

## 问题双层面

| 层面 | 问题 | 影响 |
|------|------|------|
| **深层** | `buildScopeIndex` 不递归进入 `command_substitution` 节点 | `set VAR [lmap v $list {expr}]` 中 `v` undef 误报 |
| **表层** | 多个命令在 extractor 和/或 scope 中未实现 | append/lappend/gets/scan/regexp/regsub/catch 等无 hover 或 undef |

## 当前支持状态矩阵

| 命令 | getVariables | buildScopeIndex | _extractErrorVarDefs | 状态 |
|------|:---:|:---:|:---:|------|
| `set` | ✅ | ✅ | ✅ | 完整 |
| `incr` | ✅ | ✅ | ❌ | scope 可见但 ERROR 恢复缺失 |
| `foreach` | ✅ | ✅ | — | 完整（有专用节点类型） |
| `lmap` | ✅ | ✅ | ❌ | scope 可见但 ERROR 恢复缺失 |
| `lassign` | ✅ | ✅ | ✅ | 完整 |
| `dict for` | ✅ | ✅ | — | 完整（嵌套在 command 内） |
| `append` | ❌ | ✅(command) | ❌ | scope 可见但无 hover |
| `lappend` | ❌ | ✅(command) | ❌ | scope 可见但无 hover |
| `for` | ✅ | ✅ | — | 完整 |
| `gets` | ❌ | ❌ | ❌ | 全缺失 |
| `scan` | ❌ | ❌ | ❌ | 全缺失 |
| `regexp` | ❌ | ❌ | ❌ | 全缺失 |
| `regsub` | ❌ | ❌ | ❌ | 全缺失 |
| `catch` | ❌ | ❌ | ❌ | 全缺失 |
| `variable` | —(scope import) | ✅ | ✅ | scope import，无 definitionText |
| `global` | —(scope import) | ✅ | ❌ | scope import，ERROR 恢复缺失 |
| `upvar` | —(scope import) | ✅ | — | scope import |
| Svisual -out | ✅ | ✅ | ✅ | 完整 |
| `create_variable` | ✅ | ✅ | ✅ | 完整 |

---

## Task 1: command_substitution 递归（修复深层根因）

**Files:**
- Modify: `src/lsp/tcl-scope.js` — `buildScopeIndex`, `_collectLocalDefsForIndex`
- Modify: `src/lsp/tcl-variable-extractor.js` — `_collectVariables`

**根因:** `set VAR [lmap v $list {expr}]` 被 tree-sitter-tcl 解析为 `command > simple_word("set") + word_list > simple_word("VAR") + command_substitution > command(lmap)`，但 `buildScopeIndex` 的主循环和 `_collectLocalDefsForIndex` 从不递归进入 `command_substitution` 节点，导致 lmap 的循环变量 `v` 不可见。

- [ ] **Step 1: tcl-scope.js — `buildScopeIndex` 添加 command_substitution 遍历**

在 `buildScopeIndex` 的主循环（~494-666行）中，处理每个子节点时，如果子节点类型不是 `command_substitution`，检查其子节点中是否有 `command_substitution`。或者在循环结束后/内，对每个子节点的直接 `command_substitution` 子节点递归提取变量定义。

关键：需要在 `command_substitution` 内部找到 `command` 节点，然后对其应用与普通 `command` 节点相同的变量提取逻辑。

- [ ] **Step 2: tcl-scope.js — `_collectLocalDefsForIndex` 添加 command_substitution 遍历**

在 `_collectLocalDefsForIndex`（~718-806行）中，遍历 proc body 子节点时，同样处理 `command_substitution` 节点，递归提取其中 command 的变量定义。

- [ ] **Step 3: tcl-variable-extractor.js — 确认 `_collectVariables` 递归覆盖 command_substitution**

检查 `_collectVariables` 的 default 分支（递归子节点）是否已自动覆盖 `command_substitution`。由于 default 分支对所有子节点递归调用 `_collectVariables`，理论上已覆盖。验证测试通过即可。

**预期测试通过:** ~5 个（command_substitution 嵌套 + 真实回归测试）

---

## Task 2: tcl-variable-extractor.js 添加缺失命令的 getVariables 支持

**Files:**
- Modify: `src/lsp/tcl-variable-extractor.js` — `_handleCommand`（~302-393行）

为以下命令添加变量提取（产生 definitionText，用于 hover 和补全）：

- [ ] **Step 1: `append` / `lappend` — 第 1 个参数**

```javascript
case 'append':
case 'lappend':
    // 第 1 个参数是变量名
    if (words.length >= 2) extractVarDef(words[1], ...);
```

- [ ] **Step 2: `gets` — 第 2 个参数（channelId 之后的 varName）**

```javascript
case 'gets':
    // gets channelId varName
    if (words.length >= 3) extractVarDef(words[2], ...);
```

- [ ] **Step 3: `catch` — 第 2、3 个参数（resultVarName, optionsVarName）**

```javascript
case 'catch':
    // catch script ?resultVarName? ?optionsVarName?
    if (words.length >= 3) extractVarDef(words[2], ...);
    if (words.length >= 4) extractVarDef(words[3], ...);
```

- [ ] **Step 4: `scan` — 第 3+ 个参数（format 之后的 ?varName...?）**

```javascript
case 'scan':
    // scan string format ?varName ...?
    for (let i = 3; i < words.length; i++) extractVarDef(words[i], ...);
```

- [ ] **Step 5: `regexp` — 跳过 switches 后第 3+ 个参数**

```javascript
case 'regexp':
    // regexp ?-switch...? exp string ?matchVar? ?subMatchVar ...?
    // 跳过以 - 开头的 switches
    let idx = 1;
    while (idx < words.length && words[idx].text.startsWith('-')) idx++;
    // idx=exp, idx+1=string, idx+2+=varNames
    for (let i = idx + 2; i < words.length; i++) extractVarDef(words[i], ...);
```

- [ ] **Step 6: `regsub` — 最后 1 个参数（varName）**

```javascript
case 'regsub':
    // regsub ?-switch...? exp string subSpec ?varName?
    // 如果最后一个参数不是 switch，则它是 varName
    if (words.length >= 2 && !words[words.length-1].text.startsWith('-')) {
        extractVarDef(words[words.length-1], ...);
    }
```

- [ ] **Step 7: `dict set` — 第 1 个参数（dictVar）**

在现有 `dict for` 处理之后添加：
```javascript
if (subCmd === 'set' && words.length >= 2) extractVarDef(words[1], ...);
```

**预期测试通过:** ~15 个（getVariables 部分）

---

## Task 3: tcl-scope.js 添加缺失命令的 scope 支持

**Files:**
- Modify: `src/lsp/tcl-scope.js` — `buildScopeIndex` command 分支（~566行），`_collectLocalDefsForIndex`（~718行），`_HANDLED_CMDS`（~173行）

将新增命令加入 scope 构建链路，确保跳转和 no-undef 生效。

- [ ] **Step 1: 扩展 `_HANDLED_CMDS` 集合**

```javascript
const _HANDLED_CMDS = new Set([
    'set', 'lappend', 'append', 'for', 'lassign', 'lmap', 'dict', 'incr',
    'gets', 'scan', 'regexp', 'regsub', 'catch',  // 新增
]);
```

- [ ] **Step 2: `buildScopeIndex` command 分支添加新命令处理**

在现有 `incr` 处理之后添加：
```javascript
case 'gets':    // 第 2 个参数
case 'catch':   // 第 2、3 个参数
case 'scan':    // 第 3+ 个参数
case 'regexp':  // 跳过 switches 后的参数
case 'regsub':  // 最后一个参数
```

对于全局作用域和 proc 作用域（`_collectLocalDefsForIndex`），都要添加对应的变量提取逻辑。

- [ ] **Step 3: 扩展 `dict` 子命令支持**

在现有 `dict` 判断分支中（`subCmd === 'for'`），添加 `dict set` 的处理。

**预期测试通过:** ~15 个（scope visibility 部分）

---

## Task 4: tcl-ast-utils.js 扩展 ERROR 恢复

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js` — `_extractErrorVarDefs`（~254-320行）

当 tree-sitter-tcl 将文档解析为 ERROR 节点时，需从 ERROR 中恢复变量定义。

- [ ] **Step 1: Pass 3 扩展命令名匹配**

在 `_extractErrorVarDefs` 的 Pass 3（命令首词匹配，~291-319行）中添加：

```javascript
case 'incr':       // 第 1 个参数
case 'append':     // 第 1 个参数
case 'lappend':    // 第 1 个参数
case 'gets':       // 第 2 个参数
case 'catch':      // 第 2、3 个参数
case 'lmap':       // 第 1 个参数
```

- [ ] **Step 2: 添加 `scan`/`regexp`/`regsub` 的 ERROR 恢复**

这些命令参数解析较复杂（有 switches），需在 Pass 3 中添加相应逻辑：
- `scan`: 第 3+ 个 simple_word
- `regexp`: 跳过 `-` 开头的 switches 后提取
- `regsub`: 最后一个非 switch 参数

**预期测试通过:** ~14 个（ERROR 部分和 ERROR scope visibility）

---

## Task 5: 测试验证与回归检查

- [ ] **Step 1: 运行 `tests/test-implicit-var-functions.js` 全部 60 用例通过**
- [ ] **Step 2: 运行完整测试套件，确保零回归**
- [ ] **Step 3: 在 VSCode Extension Development Host 中手动验证 `test_vis.tcl` 第 55 行无 undef 报错**
- [ ] **Step 4: 验证 `append varName value` 有 hover 和跳转**

---

## 不做的事

- **不改动** tree-sitter-tcl WASM 解析器（外部依赖）
- **不实现** `dict with` 的完整语义（动态键名变量创建，暂只支持 `dict update` 的显式 varName 参数）
- **不为** `global`/`upvar`/`variable` 添加 definitionText（它们是 scope import，不是定义）
- **不处理** Svisual ext::/ifm::/rfx:: 系列（已在 Task 1-4 完整支持，确认无缺失）

## 实施约束

- 每完成一个 Task 运行测试验证增量进展
- 最终目标：60/60 测试通过 + 全套测试零回归
- 兼容性要求：CentOS 7 / VSCode v1.85.2（纯 CommonJS，无构建步骤）
