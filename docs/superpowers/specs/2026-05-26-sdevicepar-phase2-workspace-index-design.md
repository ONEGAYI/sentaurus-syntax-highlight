# SDEVICE PAR Phase 2：Workspace Index + Include/Insert 递归解析 + 上下文感知补全

> **状态**: 设计中（修订版）
> **关联 Issue**: [#66 路线图](https://github.com/ONEGAYI/sentaurus-syntax-highlight/issues/66), [#68 Phase 2 蓝图](https://github.com/ONEGAYI/sentaurus-syntax-highlight/issues/68)
> **关联 PR**: #67 (Phase 1), #69 (MaterialDB), #70 (snippets), #71 (语法修复)
> **日期**: 2026-05-26

---

## 1. Background

SDEVICE PAR（`.par`）文件是 Synopsys Sentaurus TCAD 工具链中定义材料/区域/电极物理参数的配置文件。与 SDEVICE `.cmd` 文件的扁平命令式结构不同，`.par` 文件是**层级化的参数覆盖体系**：

```tcl
Material = "Silicon" {
  #include "Silicon.par"

  AvalancheFactors {
    n_l_f = 1.0
    p_l_f = 1.0
  }

  Bandgap {
    Eg0 = 1.12
    Chi0 = 4.05
  }
}
```

Phase 1（PR #67/#70/#71）已完成了 `.par` 文件的基础支持：TextMate 语法高亮、语言注册、关键词补全、snippets、section 高亮修复。Phase 2 的目标是构建层级结构感知的索引和上下文补全能力。

## 2. Current State

### 已具备

| 能力 | 来源 | 说明 |
|------|------|------|
| `sdevicepar` language ID | PR #67 | 7 种语言之一 |
| TextMate grammar | PR #67 | `sdevicepar.tmLanguage.json`，302 行，覆盖预处理/注释/字符串/数值/SWB/section 嵌套 |
| 基础关键词补全 | PR #67 | `all_keywords.json` sdevicepar 字段：38 个关键词（6 结构 + 19 预处理 + 10 SWB + 3 其他） |
| VSCode snippets | PR #70 | `snippets/sdevicepar.json`，22 个原生 snippet |
| QuickPick snippets | PR #70 | `src/snippets/sdevicepar.js`，21 个条目 |
| section 高亮修复 | PR #71 | 同行 `{`、行内注释 `*` 场景下的 section 名正确高亮 |
| MaterialDB 参考 | PR #69 | `references/MaterialDB/` 下 8 个权威 `.par` 文件（Silicon 2927 行、Oxide、Germanium 等） |
| 共用 Tcl Provider | PR #67 | 通过 `TCL_LANGS` 共享 WASM 管线（变量诊断/折叠/括号检查） |

### 当前不足

| 问题 | 影响 |
|------|------|
| 补全扁平化 | 38 个关键词不区分上下文，全局平铺 |
| 不理解层级结构 | 不知道 `Material = "Silicon" { ... }` / `Bandgap { ... }` / `n_l_f = 1.0` 的嵌套关系 |
| 不理解 scope/block/parameter 关系 | `AvalancheFactors` 下应补 `n_l_f` 而非 `Eg0` |
| 不解析 include/Insert | `#include "Silicon.par"` / `Insert = "Silicon.par"` 被视为普通文本 |
| 不根据光标上下文过滤 | 所有位置看到相同的补全列表 |
| hover/definition 缺乏参数来源 | 无法展示参数值、来源文件、层级路径 |

## 3. Problem Statement

Phase 1 的扁平补全对于实际 TCAD 工程效率提升有限。工程师编辑 `.par` 文件时，需要知道：

1. 当前位置可以写什么类型的结构（scope? block? parameter?）
2. 当前 scope 类型下有哪些可用 block
3. 当前 block 下有哪些可用 parameter
4. 这些 parameter 在 workspace/MaterialDB 中的典型值是什么

这些都需要**层级结构解析**和**上下文感知**，而非扁平关键词匹配。

## 4. Goals

1. **ParParser**：轻量纯文本栈追踪解析器，识别 `.par` 文件的 scope/block/parameter/include 结构
2. **ParIndexService**：统一索引服务，合并当前文件 + include 递归 + workspace + MaterialDB 词库
3. **include/Insert 递归**：解析 `#include` / `Insert` 引用，继承 include 位置的上下文路径
4. **上下文感知补全**：根据光标位置自动推荐 scope 类型 / scope 名 / block 名 / parameter 名
5. **五级来源优先级**：current > include > workspace > materialdb > builtin
6. **预留 Hover/Definition 接口**：Phase 2 首版不强制实现，但 Index 数据可支持

## 5. Non-goals

| 不做 | 原因 |
|------|------|
| 参数合法性验证 | 语料抽词 ≠ 官方完整合法性表，误报风险高 |
| 参数类型/单位/默认值元数据 | Phase 2 首版只记录 exampleValue，不做结构化元数据 |
| Formula-dependent 参数集 | `Formula = 0` vs `Formula = 1` 的不同参数集是 Phase 3+ |
| 替代 WASM/Tcl 管线 | sdevicepar 继续通过 `TCL_LANGS` 共享变量诊断/折叠/括号检查 |
| 全量 workspace 诊断 | Phase 2 只做补全，不做跨文件参数一致性检查 |
| 修改 TextMate grammar | 高亮层已基本可用，Phase 2 专注 LSP/Provider 数据层 |
| 修改/扩充 `all_keywords.json` | 不把 MaterialDB 参数扁平塞入，保留为 fallback |
| 修改现有 snippets | Phase 2 不重复 snippet 工作 |
| `sdevice -P` 集成 | 本地 Sentaurus 安装扫描是 Phase 3（Issue #66 v3） |

## 6. User-facing Behavior

### 补全场景

**场景 1：文件顶层空白处**
```tcl
|                          ← 光标在此
```
推荐：`Material`、`Region`、`Interface`、`Electrode`、`RegionInterface`、`MaterialInterface`

**场景 2：scope 名补全**
```tcl
Material = "|"             ← 光标在引号内
```
推荐：include/workspace/materialdb 中发现的材料名（`Silicon`、`Oxide`、`Germanium` 等）

**场景 3：block 补全**
```tcl
Material = "Silicon" {
  |                        ← 光标在此
}
```
推荐：Material scope 下出现过的 block（`Bandgap`、`Epsilon`、`Mobility`、`AvalancheFactors` 等）

**场景 4：parameter 补全**
```tcl
Material = "Silicon" {
  Bandgap {
    |                      ← 光标在此
  }
}
```
推荐：Bandgap block 下出现过的 parameter（`Eg0`、`Chi0`、`alpha`、`beta` 等）

**场景 5：fallback**
```tcl
#include "|"               ← 光标在引号内
```
Phase 2.1 不处理文件路径补全，走现有 all_keywords fallback

### Hover 场景（Phase 2 可选）

```tcl
Material = "Silicon" {
  Bandgap {
    Eg0 = 1.12             ← 悬停显示：来源文件、parentPath、workspace 中的其他值
  }
}
```

### Definition 场景（Phase 2 可选）

在 `Eg0 = 1.12` 上按 F12 → 跳转到 MaterialDB/Silicon.par 中 `Bandgap { Eg0 = ... }` 的位置

## 7. Proposed Architecture

### 双管线并行

```
.par 文件
   │
   ├─ WASM/Tcl 管线（现有，不修改）─────────────┐
   │  ├─ tree-sitter-tcl 解析                    │
   │  ├─ TclParseCache 缓存                     │ 通用 Tcl-like
   │  ├─ 变量诊断/折叠/括号检查                  │ 编辑能力
   │  └─ 预处理器/#define 处理                   │
   │                                             │
   └─ ParParser 管线（Phase 2 新增）              │
      ├─ 纯文本栈追踪解析                        │ .par 领域
      ├─ include/Insert 递归                     │ 结构理解
      ├─ ParIndexService 索引                    │
      └─ 上下文感知补全/Hover/Definition         │
```

**职责边界**：
- WASM/Tcl 管线：通用 Tcl-like 编辑能力（变量、括号、折叠、#define）
- ParParser 管线：`.par` 专属层级结构理解（scope/block/parameter/include）
- 两者互不侵入，ParIndexService 只消费 ParParser 结果

### 数据流

```
打开 .par 文件
    │
    ├─ WASM 管线照常运行（变量诊断等）
    │
    └─ ParIndexService.parseCurrentFile(document)
         │
         ├─ ParParser.parse(text) → ParParseResult
         │     ├─ symbols: ParSymbol[]
         │     ├─ includes: ParIncludeRef[]
         │     ├─ lineContexts: LineContext[]   ← 每行栈快照
         │     └─ diagnostics: ParParseIssue[]
         │
         ├─ resolveIncludes(includes, baseUri, visited, includeChain)
         │     │
         │     ├─ 对每个 ref：查找文件 → 缓存/解析 raw 结果
         │     ├─ 用 ref.parentPath 作为 graft base 前缀替换
         │     └─ 递归处理 nested include（继承 outerPrefix + ref.parentPath）
         │
         ├─ 合并 builtin scopeTypes
         │
         └─ 缓存最终结果（按 uri + document.version）
              │
              ├─ CompletionProvider → getCompletionsAt(document, position)
              │     查询已缓存的 lineContexts + symbols，0 文件 IO
              │
              ├─ HoverProvider → getHoverInfo(document, position)    [可选]
              └─ DefinitionProvider → getDefinitionLocation(document, position) [可选]
```

### 渐进实现路径

| 阶段 | 范围 | 交付物 |
|------|------|--------|
| Phase 2.1 | 当前文件 + include 递归 + builtin fallback | ParParser + ParIndexService + 上下文补全 |
| Phase 2.2 | workspace 全量扫描 | workspace `.par` 文件索引 + 文件 watcher 增量更新 |
| Phase 2.3 | MaterialDB 内置参考 | 加载 `references/MaterialDB/` 数据 |
| Phase 2.4 | Hover/Definition | 基于 Index 数据的悬停和跳转 |
| Phase 3 | 本地 Sentaurus 集成 | 用户配置 MaterialDB 路径 + `sdevice -P` 输出解析 |

## 8. Parser Design

### 文件：`src/lsp/sdevicepar/par-parser.js`

### Line-oriented 策略

Parser 采用逐行扫描策略。`.par` 文件在实际工程中几乎不出现单行多层嵌套（如 `Material = "Silicon" { Bandgap { Eg0 = 1.12 } }`），因此不做 token-level scanning，保持 line-oriented 简洁性。测试用例也只覆盖多行写法。

若未来发现真实的单行嵌套需求，可扩展为 token scanner，但 Phase 2.1 不做此假设。

### 匹配优先级（关键）

每行必须按以下**严格顺序**尝试匹配，先匹配到者胜出：

```
1. #include              — 必须在 # 注释跳过之前识别
2. #if/#elif/#else/#endif — 预处理条件指令（忽略指令本身，但正常解析后续行）
3. 其他 # 开头行          — 跳过（注释或其他预处理指令）
4. * 开头行               — 跳过（行内注释）
5. scope 声明             — Material/Region/... = "name" {
6. Insert = "file"        — 必须在普通 parameter assignment 之前识别
7. block 开始             — Identifier {（含 pendingBlockName 兑现）
8. parameter assignment   — Identifier = value
9. }                      — 关闭花括号
10. 空行                  — 跳过
```

**关键约束**：
- `#include` 的 `#` 前缀与注释共享，必须优先于注释跳过规则
- `Insert = "file.par"` 的语法与 parameter assignment 相同模式，必须通过 `Insert` 关键字前缀在 assignment 之前拦截
- `pendingBlockName` 机制处理 block 名与 `{` 分行的情况

### pendingBlockName 机制

block 名与 `{` 可能在不同行出现：

```tcl
Scharfetter                    ← 第 N 行：标识符后无 {，也不是 assignment
  * relation model             ← 第 N+1 行：注释
{                              ← 第 N+2 行：只有 {，兑现 pending block
```

实现规则：

```
如果当前行匹配 Identifier（非 scope、非 assignment、非 include/Insert）：
  如果同行包含 {：
    → 识别为 block 开始
  否则：
    → 设 pendingBlockName = Identifier，继续下一行

如果当前行以 { 开头（trim 后）且 pendingBlockName != null：
  → 兑现 pending block，push 到 stack
  → 清除 pendingBlockName

如果 pendingBlockName != null 且当前行匹配到其他结构（scope/assignment/include/另一个 Identifier）：
  → 放弃 pending（不是 block 名），按新匹配处理
  → 清除 pendingBlockName
```

### 核心算法

```
function parseParText(text, filePath):
  symbols = []
  includes = []
  lineContexts = []    // 每行的栈快照
  diagnostics = []
  stack = []           // [{kind, name, scopeType?, startLine}]
  pendingBlockName = null

  for each (line, lineIndex) in text:
    trimmed = line.trim()

    // 保存当前行栈快照（用于上下文查询）
    lineContexts.push(snapshotStack(stack, pendingBlockName, lineIndex))

    // 0. 空行
    if trimmed === "": continue

    // 1. #include（必须在 # 注释跳过之前）
    if matches /^\s*#include\s+"([^"]+)"/:
      includes.push({path: match[1], parentPath: stackToPath(stack),
                      startLine: lineIndex, ...})
      continue

    // 2. 预处理条件指令（忽略指令本身，正常解析后续行内容）
    if matches /^\s*#(if|elif|else|endif|define)\b/:
      // 记录 conditional 状态（可选），但不跳过后续行
      continue

    // 3. 其他 # 开头行（注释、#set 等其他预处理指令）
    if matches /^\s*#/: continue

    // 4. * 开头行注释
    if matches /^\s*\*/: continue

    // 5. scope 声明：Type = "Name" {
    if matches scopeRegex:
      if pendingBlockName: clearPending()
      stack.push({kind: "scope", type: match[1], name: match[2], startLine: lineIndex})
      symbols.push({kind: "scope", name: match[2], scopeType: match[1], ...})
      handleBraces(line)  // 处理同行 } 导致的立即 pop
      continue

    // 6. Insert = "file"（必须在 parameter assignment 之前）
    if matches /^\s*Insert\s*=\s*"([^"]+)"/:
      if pendingBlockName: clearPending()
      includes.push({path: match[1], parentPath: stackToPath(stack),
                      startLine: lineIndex, ...})
      continue

    // 7. 兑现 pending block
    if pendingBlockName && matches /^\s*\{/:
      parentPath = stackToPath(stack)
      stack.push({kind: "block", name: pendingBlockName, startLine: pendingStartLine})
      symbols.push({kind: "block", name: pendingBlockName, parentPath, ...})
      pendingBlockName = null
      handleBraces(line)
      continue

    // 8. block 开始：Identifier {（同行）
    if matches /^\s*([A-Za-z][\w-]+)\s*\{/:
      if pendingBlockName: clearPending()
      parentPath = stackToPath(stack)
      stack.push({kind: "block", name: match[1], startLine: lineIndex})
      symbols.push({kind: "block", name: match[1], parentPath, ...})
      handleBraces(line)
      continue

    // 9. parameter assignment
    if matches /^\s*([A-Za-z][\w-]+(?:\(\d+\))?)\s*=\s*(.*)/:
      if pendingBlockName: clearPending()
      parentPath = stackToPath(stack)
      value = match[2].trim()
      symbols.push({kind: "parameter", name: match[1], value, parentPath, ...})
      handleBraces(line)
      continue

    // 10. 可能的 block 名（无 {，无 =）
    if matches /^\s*([A-Za-z][\w-]+)/ && !containsAssignment:
      if pendingBlockName: clearPending()  // 放弃旧 pending
      pendingBlockName = match[1]
      pendingStartLine = lineIndex
      continue

    // 11. 行内 } 关闭
    handleBraces(line)
```

### handleBraces — 行内花括号处理

每行处理完毕后，检查行内未匹配的 `}` 数量，pop stack：

```
function handleBraces(line):
  // 统计行内 { 和 } 数量（排除字符串内的）
  opens = countOpenBraces(line)
  closes = countCloseBraces(line)
  delta = opens - closes
  if closes > 0:
    for i in range(closes):
      if stack.length > 0:
        closed = stack.pop()
        closed.endLine = currentLineIndex
```

注意：scope/block 的 `{` 已在各自的匹配中计入 opens，所以 `delta` 只需要处理额外的情况。实际实现中，`{` 的 opens 计数应排除已被 scope/block 匹配消耗的那个。

### #if/#elif/#endif 处理策略

**Phase 2.1 决策**：不跳过条件块内容。

- `#if`/`#elif`/`#else`/`#endif` 行本身被忽略（不解析为结构）
- 条件块内的 block/parameter/assignment **正常解析**
- 可选：在 symbol 上标记 `conditional: true`，表示该参数出现在条件分支内
- 不评估条件表达式，不判断分支真值
- Phase 2.1 可以不实现 `conditional` 标记，先按普通参数处理

```tcl
Material = "Silicon" {
  #if @useAdvanced@ == 1
    Bandgap {              ← 正常识别为 block
      Eg0 = 1.16964        ← 正常识别为 parameter（可选标记 conditional: true）
    }
  #endif
}
```

### 输出数据结构

```js
// ParParseResult — parser 输出
{
  symbols: ParSymbol[],
  includes: ParIncludeRef[],
  lineContexts: LineContext[],      // 每行栈快照（用于上下文查询）
  diagnostics: ParParseIssue[]
}

// ParSymbol — 统一 symbol 结构
{
  kind: "scope" | "block" | "parameter",
  name: string,                    // "Silicon" / "AvalancheFactors" / "n_l_f"
  scopeType: string | null,        // "Material" / "Region" / null（仅 scope 有）
  parentPath: string,              // "Material/Silicon/AvalancheFactors"
  fullPath: string,                // "Material/Silicon/AvalancheFactors/n_l_f"
  filePath: string,                // 来源文件 URI
  range: {
    startLine: number,
    startCol: number,
    endLine: number,               // scope/block 的结束行（parameter 无结束行）
    endCol: number
  },
  value: string | null,            // 参数值（仅 parameter 有）
  conditional: boolean,            // 是否位于 #if 条件块内（可选，Phase 2.1 可省略）
  source: "current" | "workspace" | "include" | "materialdb" | "builtin",
  includeChain: string[]           // ["wrapper.par", "Silicon.par"]
}

// ParIncludeRef — include/Insert 引用
{
  path: string,                    // 引用路径（相对）
  parentPath: string,              // include 发生位置的 parentPath
  resolvedUri: string | null,      // 解析后的绝对 URI（null = unresolved）
  range: { startLine, startCol, endLine, endCol }
}

// LineContext — 每行栈快照（用于上下文查询）
{
  line: number,                    // 行号（0-based）
  stack: StackFrame[],             // 该行开始时的栈状态
  pendingBlockName: string | null  // 该行开始时的 pending block
}

// StackFrame — 栈帧
{
  kind: "scope" | "block",
  name: string,                    // "Silicon" / "Bandgap"
  scopeType: string | null,        // 仅 scope 有
  startLine: number
}

// ParParseIssue — 容错性警告
{
  kind: "unresolvedInclude" | "unbalancedBraces" | "maxDepthExceeded" | "abandonedPending",
  message: string,
  line: number
}
```

### 工具函数（`src/lsp/sdevicepar/par-context.js`）

```js
/**
 * 栈转路径字符串
 * [{kind:"scope",type:"Material",name:"Silicon"}, {kind:"block",name:"Bandgap"}]
 * → "Material/Silicon/Bandgap"
 */
function stackToPath(stack)

/**
 * 从 lineContexts 获取光标位置的上下文
 * 使用 lineContexts[lineIndex] 获取该行的 stack 快照，
 * 即可得到正确的 parentPath 和 completetableKind。
 * 返回 { parentPath, currentKind, completetableKind }
 * completetableKind: "scopeType" | "scopeName" | "block" | "parameter" | null
 */
function getContextAtPosition(lineContexts, targetLine, targetCol)

/**
 * 通配符路径匹配
 * matchParentPath("Material/Silicon/AvalancheFactors", "Material/*/AvalancheFactors") → true
 */
function matchParentPath(parentPath, pattern)
```

### 容错设计

- **注释行**（`#` 开头但非 `#include`、`*` 开头）：跳过不解析
- **`#include` 优先于注释**：`#` 开头行先检查 `#include`，不匹配再当注释跳过
- **Insert 优先于 assignment**：含 `=` 的行先检查 `Insert` 关键字，不匹配再当 parameter
- **字符串内容**：scope 声明的引号内名字需要捕获，其余行内引号内容不影响花括号计数
- **SWB 参数**（`@...@`）：出现在 value 中不影响解析
- **brace 不匹配**：不崩溃，记录 `unbalancedBraces` 警告继续
- **pendingBlockName 放弃**：如果 pending 后续行不匹配 `{`，记录 `abandonedPending` 警告
- **向量参数**（`Xmax(0) = 1e-4`）：`name` 字段保留 `(N)` 后缀

## 9. Index Design

### 文件：`src/lsp/sdevicepar/par-index-service.js`

### 初始化策略

**方案 A：当前文件优先，惰性扩展**

1. `.par` 文件打开时 → 解析当前文件 + include 递归（预热）
2. 后台惰性触发 → workspace `.par` 全量扫描（Phase 2.2）
3. 按需加载 → MaterialDB 参考数据（Phase 2.3）

首版只实现步骤 1，workspace 全量扫描作为 Phase 2.2 追加。

### 预热 vs 热路径

**关键约束**：`getCompletionsAt()` 在 CompletionProvider 热路径中被同步调用，不能做任何文件 IO。

- **预热时机**：`parseCurrentFile(document)` 在文档打开/变更时被调用（由 `onDidChangeTextDocument` 事件触发），此时同步解析当前文件文本 + 同步解析 include 文件（有界 IO，每个 include 文件 ≤ 3000 行，总深度 ≤ 8）
- **include 缓存**：include 文件的 raw parse result 在预热阶段缓存，后续 completions 只查缓存
- **首次补全**：如果用户在预热完成前就触发补全（极端情况），返回空列表 + fallback 到 all_keywords
- **后续补全**：include 已缓存，`getCompletionsAt()` 只查内存中的 `lineContexts` 和 `symbols`，0 文件 IO

Phase 2.1 不做异步 include 解析。如果 include 解析耗时过长，Phase 2.2 可考虑改为后台异步。

### 接口

```js
// src/lsp/sdevicepar/par-index-service.js

module.exports = { createParIndexService };

/**
 * @param {object} deps
 * @param {vscode.Uri[]} deps.workspaceFolders
 * @param {string} deps.extensionPath — 插件安装路径，用于定位 references/MaterialDB/
 * @param {string} [deps.configMaterialDbPath] — 用户配置的 MaterialDB 路径（Phase 3）
 */
function createParIndexService(deps) {
  // 内部状态
  const currentFileCache = new Map();  // "uri:v{version}" → ParResolvedResult（含 grafted symbols）
  const includeRawCache = new Map();   // uri → ParParseResult（raw，未 graft）
  const MAX_CACHE_SIZE = 20;           // 与 TclParseCache 一致

  return {
    /**
     * 解析当前文件并预热 include（文档打开/变更时调用）
     * 同步解析当前文件文本 + include 文件。
     * 结果缓存后，getCompletionsAt 不再做任何 IO。
     * @param {vscode.TextDocument} document
     * @returns {ParResolvedResult}
     */
    parseCurrentFile(document),

    /**
     * 解析 include 引用（内部调用，递归）
     *
     * 每个 include ref 使用 ref.parentPath 作为 graft base，
     * 将被 include 文件的 raw symbols 的 parentPath 前缀替换为
     * outerPrefix + ref.parentPath。
     *
     * includeRawCache 只缓存 raw parse result（未 graft），
     * 同一文件在不同 parentPath 下被 include 时会产生不同的 grafted 结果。
     *
     * @param {ParIncludeRef[]} includes
     * @param {string} baseUri — 当前文件 URI
     * @param {string} outerPrefix — 外层累积的 parentPath 前缀
     * @param {Set<string>} visited — 已访问文件集合
     * @param {string[]} includeChain — 当前 include 链（用于标记来源）
     * @param {number} depth — 当前递归深度
     * @returns {ParSymbol[]}
     */
    resolveIncludes(includes, baseUri, outerPrefix, visited, includeChain, depth),

    /**
     * 获取光标位置的补全列表（热路径，0 文件 IO）
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {ParCompletionItem[]}
     */
    getCompletionsAt(document, position),

    /**
     * 获取光标位置的 hover 信息（Phase 2.4）
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {ParHoverInfo | null}
     */
    getHoverInfo(document, position),

    /**
     * 获取光标位置的定义位置（Phase 2.4）
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {vscode.Location | null}
     */
    getDefinitionLocation(document, position),

    /**
     * 文件变更通知
     */
    onFileChanged(uri),

    /**
     * 文件关闭通知
     */
    onFileClosed(uri),

    /**
     * 释放资源
     */
    dispose(),
  };
}
```

### 缓存策略

| 缓存 | 键 | 内容 | 失效条件 | 上限 |
|------|-----|------|----------|------|
| currentFileCache | `uri:v{version}` | ParResolvedResult（含 grafted symbols + lineContexts） | document.version 变化 | 20 (FIFO) |
| includeRawCache | `uri` | ParParseResult（raw，未 graft） | Phase 2.1：session 生命周期；Phase 2.2：mtime 变化 | 20 (FIFO) |
| workspaceIndex | — | Phase 2.2 实现 | — | — |

**性能保证**：
- `getCompletionsAt()` 只查内存缓存，0 文件 IO
- include 文件的 raw parse result 在首次 include 时缓存，同一文件被多次 include 时复用 raw 结果但各自 graft
- `parseCurrentFile` 检查 `document.version`，版本未变则返回缓存

### builtin fallback 数据

```js
// 内置 scope 类型列表（Phase 2.1 硬编码，Phase 2.3 可从 MaterialDB 扩展）
const BUILTIN_SCOPE_TYPES = [
  "Material", "Region", "Interface",
  "MaterialInterface", "RegionInterface", "Electrode"
];
```

不需要独立的 JSON 文件。当 Index 中无 include/workspace 数据时，builtin 列表提供最低限度的补全。

Phase 2.1 不全量 preload `references/MaterialDB/`。bundled MaterialDB 仅作为 include 文件查找的 fallback 路径之一（见第 10 节）。

## 10. Include/Insert Resolution

### 查找顺序

1. **当前文件所在目录**（最优先）
2. **workspace 根目录**（遍历 `workspaceFolders`）
3. **用户配置的 `sentaurus.materialDbPath`**（可选配置项，Phase 3 启用）
4. **插件内置 `references/MaterialDB/`**（最低优先，作为开发/测试参考）

Phase 2.1 如不实现用户配置，则 bundled `references/MaterialDB/` 作为第 3 级 fallback，仅在 include 显式引用到 MaterialDB 中的文件时生效。Phase 2.1 不主动 preload MaterialDB 内容。

### include 上下文继承

**核心难点**：被 include 文件的内容应"嫁接"到 include 发生位置的上下文中。每个 include ref 使用自己的 `ref.parentPath` 作为 graft base。

```
example_sdevice.par:
  Material = "Silicon" {          ← parentPath = "Material/Silicon"
    #include "Silicon.par"        ← ref.parentPath = "Material/Silicon"
  }

Silicon.par（被 include）:
  Bandgap {                       ← raw parentPath = ""（顶层）
    Eg0 = 1.12                    ← raw parentPath = "Bandgap"
  }

Silicon.par 内又 include "common.par":
  #include "common.par"           ← ref.parentPath = ""（Silicon.par 顶层）

common.par:
  Epsilon {                       ← raw parentPath = ""
    eps = 11.7                    ← raw parentPath = "Epsilon"
  }

解析结果：
  Material/Silicon/Bandgap           ← graft base = "Material/Silicon"
  Material/Silicon/Bandgap/Eg0       ← graft base = "Material/Silicon"
  Material/Silicon/Epsilon           ← nested: outer="Material/Silicon", ref="", result="Material/Silicon"
  Material/Silicon/Epsilon/eps       ← nested: outer="Material/Silicon", ref="", result="Material/Silicon"
```

### resolveIncludes 实现

```js
function resolveIncludes(includes, baseUri, outerPrefix, visited, includeChain, depth) {
  const result = [];
  for (const ref of includes) {
    const resolvedUri = findIncludeFile(ref.path, baseUri);
    if (!resolvedUri || visited.has(resolvedUri)) continue;
    if (depth >= MAX_INCLUDE_DEPTH) continue;

    visited.add(resolvedUri);

    // 从 includeRawCache 获取或解析 raw result（不 graft）
    const rawParseResult = getOrParseRaw(resolvedUri);

    // graft base = outerPrefix + ref.parentPath
    const graftBase = (outerPrefix && ref.parentPath)
      ? outerPrefix + "/" + ref.parentPath
      : (outerPrefix || ref.parentPath || "");

    const newIncludeChain = [...includeChain, resolvedUri];

    for (const sym of rawParseResult.symbols) {
      // 前缀替换：将 raw parentPath 替换为 graftBase + raw parentPath
      const newParentPath = graftBase
        ? (sym.parentPath ? graftBase + "/" + sym.parentPath : graftBase)
        : sym.parentPath;
      result.push({
        ...sym,
        parentPath: newParentPath,
        fullPath: newParentPath ? newParentPath + "/" + sym.name : sym.name,
        source: determineSource(resolvedUri),  // "include" | "materialdb"
        includeChain: newIncludeChain,
        filePath: resolvedUri,
      });
    }

    // 递归处理 nested include
    if (rawParseResult.includes.length > 0) {
      // nested include 的 outerPrefix = 当前 graftBase
      //（因为 nested include 的 ref.parentPath 是相对于 Silicon.par 的，
      //  需要叠加到已有的 graftBase 上）
      result.push(...resolveIncludes(
        rawParseResult.includes, resolvedUri, graftBase,
        visited, newIncludeChain, depth + 1
      ));
    }
  }
  return result;
}
```

### includeRawCache 策略

`includeRawCache` 只缓存 **raw parse result**（未 graft）。理由：

- 同一文件可能在不同 parentPath 下被多次 include（如 `Silicon.par` 在 `Material = "Silicon" { ... }` 和 `Region = "active" { ... }` 两种上下文中）
- raw result 可复用，graft 结果每次不同
- 缓存键为 `uri`（文件的 raw 解析结果不依赖上下文）

### 递归保护

| 机制 | 实现 |
|------|------|
| 循环检测 | `visited` Set，按绝对路径去重 |
| 深度限制 | `MAX_INCLUDE_DEPTH = 8` |
| 文件不存在 | 记录 `unresolvedInclude` 警告，不报硬错误，补全降级 |
| 来源标记 | resolvedUri 匹配 MaterialDB 路径 → `source: "materialdb"`，否则 → `source: "include"` |

## 11. Completion Design

### 文件：`src/lsp/sdevicepar/par-completion.js`

### 补全层级

| 层级 | 触发条件 | 补全内容 | 数据来源 | CompletionItemKind |
|------|----------|----------|----------|-------------------|
| scope 类型 | 文件顶层空白处 | Material/Region/Interface 等 | builtin | `Module` |
| scope 名 | `Type = "\|"` | include/workspace/materialdb 中的名字 | Index | `Value` / `Constant` |
| block 名 | scope 块内空白处 | 该 scopeType 下出现过的 block | Index | `Class` |
| parameter 名 | block 内空白处 | 该 block 下出现过的 parameter | Index | `Property` |
| fallback | 其他情况 | all_keywords.json 38 个关键词 | 现有逻辑 | 现有逻辑 |

### CompletionItem 结构

```js
{
  label: string,                    // "Bandgap" / "Eg0" / "Silicon"
  kind: CompletionItemKind,         // Module/Value/Class/Property
  detail: string,                   // "[par] section" / "[par] parameter (include: Silicon.par)"
  documentation: string | MarkdownString,  // parentPath + 来源文件
  sortText: string,                 // "{priority}_{name}" — source 优先级前缀
  insertText: string,               // block: "Bandgap {\n\t$0\n}" / parameter: "Eg0"
  filterText: string,               // label 本身
  data: {                           // 自定义数据（用于 resolve）
    source: string,
    parentPath: string,
    parKind: string                 // "scopeType" | "scopeName" | "block" | "parameter"
  }
}
```

### 去重策略

按 `(label, parentPath)` 二元组去重。同名参数在不同 block 下是不同补全项。

### 排序策略

`sortText` 格式：`{priority}_{name}`

| source | priority | 说明 |
|--------|----------|------|
| current | 0 | 当前文件（最新鲜） |
| include | 1 | 当前文件显式引用的 include 文件（优先于 workspace 其他文件） |
| workspace | 2 | workspace 其他文件 |
| materialdb | 3 | 内置 MaterialDB 参考 |
| builtin | 4 | 硬编码 fallback |

### Provider 集成

**在 `src/register-completion-providers.js` 中添加 `sdevicepar` 分支**：

```js
// 现有逻辑（sdevice section 上下文补全）
if (langId === 'sdevice') { ... }

// Phase 2 新增（sdevicepar 上下文补全）
if (langId === 'sdevicepar' && parIndexService) {
  const parItems = parIndexService.getCompletionsAt(document, position);
  if (parItems.length > 0) {
    items.push(...parItems);
  }
  // 不 return，继续走现有 all_keywords fallback 逻辑
}
```

**触发流程**：

1. 文档打开/变更 → `onDidChangeTextDocument` 触发 `parIndexService.parseCurrentFile(document)` 预热（同步解析 + include）
2. 用户按键触发 CompletionProvider → `parIndexService.getCompletionsAt(document, position)`（只查内存缓存，0 文件 IO）
3. 如果有结果，与现有 all_keywords 补全合并（Index 结果优先）
4. 如果无结果（光标在注释/字符串中，或预热未完成），走现有 fallback

### 不创建独立 Provider

理由：
- 与 SDEVICE section 上下文补全的模式一致（在同一 Provider 内分支）
- 避免 7 种语言各搞独立 Provider 的碎片化
- 现有 Provider 循环已处理多语言，只需加一个 `if` 分支

## 12. Hover/Definition Future Hooks

Phase 2 首版不强制实现 Hover/Definition，但 ParIndexService 预留接口：

### Hover（Phase 2.4 可选）

```js
getHoverInfo(document, position) → {
  kind: "scope" | "block" | "parameter",
  name: string,
  parentPath: string,
  value: string | null,           // exampleValue
  source: string,                 // "current" | "include" | "materialdb"
  sourceFile: string,             // 来源文件名
  otherValues: string[],          // 其他文件中的值
}
```

展示格式：
```
Eg0 = 1.12
Path: Material/Silicon/Bandgap
Source: include (Silicon.par)
Other values: 1.16964 (MaterialDB)
```

### Definition（Phase 2.4 可选）

```js
getDefinitionLocation(document, position) → {
  uri: string,                    // 定义所在文件
  range: { startLine, startCol, endLine, endCol }
}
```

跳转目标优先级：当前文件 > include > workspace > MaterialDB。

### Diagnostics（未来 Phase）

Phase 2 **不做严格错误诊断**。原因：
- 语料抽词不等于官方完整合法性表
- 误报风险高（用户可能使用 Sentaurus 版本特定参数）
- 诊断功能依赖完整的参数合法性数据库，属于 Phase 3+

未来可实现：
- 未知参数警告（可选，默认关闭）
- 参数重复定义检查
- scope/block 嵌套合法性检查
- 版本差异提示
- 单位/类型/范围检查

## 13. Caching and Performance

### 缓存层次

```
Level 1: ParIndexService 内存缓存
  ├─ currentFileCache: Map<"uri:v{version}", ParResolvedResult>
  │   （含 grafted symbols + lineContexts，可直接用于补全查询）
  ├─ includeRawCache: Map<uri, ParParseResult>
  │   （raw，未 graft，可跨 parentPath 复用）
  └─ 上限 20 条目，FIFO 淘汰

Level 2: workspaceIndex (Phase 2.2)
  └─ Map<uri, ParParseResult>，按文件 mtime 增量更新

Level 3: builtin (硬编码)
  └─ BUILTIN_SCOPE_TYPES 常量
```

### 性能保证

| 场景 | 保证 |
|------|------|
| `getCompletionsAt()` | 只查内存缓存，0 文件 IO |
| 当前文件文本解析 | < 50ms（典型 .par 文件 < 3000 行） |
| include 预热（首次） | ≤ 200ms per file（含文件读取），总深度 ≤ 8，总计 ≤ 1s |
| include 预热（后续） | includeRawCache 命中，0 文件 IO |
| workspace 全量扫描（Phase 2.2） | 后台执行，不阻塞编辑 |
| 内存占用 | 单文件 raw 结果 < 100KB，20 缓存条目 < 2MB |

### 预热时机

1. `onDidChangeTextDocument`（sdevicepar）→ `parseCurrentFile(document)` 预热
2. 预热同步解析当前文件文本 + 同步读取/解析 include 文件
3. 结果缓存后，后续 Completion 调用 0 IO
4. 如果预热未完成就触发补全 → 返回空 + fallback all_keywords

## 14. Integration Points

### 新增文件

```
src/lsp/sdevicepar/
├── par-parser.js              ← 纯文本栈追踪解析器（输出 symbols + includes + lineContexts）
├── par-index-service.js       ← 索引服务（缓存 + include 递归 + graft + 查询）
├── par-completion.js          ← CompletionItem 构建逻辑
└── par-context.js             ← 工具函数：stackToPath / getContextAtPosition / matchParentPath
```

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/extension.js` | 在 `activate()` 中初始化 `ParIndexService`，注册 `onDidChangeTextDocument` 预热事件 |
| `src/register-completion-providers.js` | 添加 `if (langId === 'sdevicepar')` 分支，调用 ParIndexService 获取补全 |

### 不修改文件

| 文件 | 原因 |
|------|------|
| `syntaxes/sdevicepar.tmLanguage.json` | 高亮层已可用 |
| `syntaxes/all_keywords.json` | 保留为 fallback |
| `snippets/sdevicepar.json` | snippets 不重复 |
| `src/snippets/sdevicepar.js` | snippets 不重复 |
| `src/lsp/tcl-ast-utils.js` | WASM 管线不侵入 |
| `src/lsp/parse-cache.js` | 独立缓存，不修改 |
| `src/lsp/providers/sdevice-semantic-provider.js` | SDEVICE 专属，不修改 |
| `package.json`（Phase 2.1） | Phase 2.1 不需要新增配置项 |
| `language-configurations/` | 不修改 |

### 未来集成（Phase 2.2+）

| 文件 | 修改内容 |
|------|----------|
| `package.json` | 添加 `sentaurus.materialDbPath` 配置项（Phase 3） |
| `src/extension.js` | 添加 workspace `.par` 文件 watcher（Phase 2.2） |
| `src/register-completion-providers.js` | Hover/Definition 分支（Phase 2.4） |

## 15. Test Plan

### Parser 基础测试（`tests/test-par-parser.js`）

**结构识别**：
- `Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}` → scope + block + parameter
- `Region = "channel" {\n}` → scope 无子 block
- `Interface = "Silicon/Oxide" {\n}` → 含 `/` 的 interface 名
- 嵌套 3 层以上结构

**格式变体**：
- block 名与 `{` 同行：`Bandgap {`
- block 名与 `{` 不同行（pendingBlockName）：`Bandgap\n{`
- 行内注释 + pendingBlockName：`Scharfetter * relation\n{`
- SWB 参数：`@AvalFac@`、`@<expr>@` 不被解析为结构
- 字符串值：`Formula = 1`、`fileName = "model.dat"`
- 向量参数：`Xmax(0) = 1e-4`

**匹配优先级**：
- `#include "file.par"` 不被 `#` 注释规则跳过
- `Insert = "Silicon.par"` 不被 parameter assignment 拦截
- 普通参数 `Eg0 = 1.12` 不被 block 开始规则误匹配

**#if 条件块**：
- `#if/@useAdvanced@` 后的 block/parameter 正常解析
- 可选：symbol 上标记 `conditional: true`

**容错**：
- 不匹配的 `{}` 不崩溃
- 空文件返回空结果
- 只有注释的文件返回空结果
- abandonedPending 记录警告

### Include 递归测试（`tests/test-par-include.js`）

- wrapper 文件 `#include "Silicon.par"` → Silicon.par 内容继承 ref.parentPath
- `Insert = "Silicon.par"` 同等处理
- 每个 include ref 使用自己的 parentPath 作为 graft base
- nested include 继承 outerPrefix + ref.parentPath
- 循环 include（A include B include A）不死循环
- 自引用 include 不死循环
- include 文件不存在时返回空 + unresolvedInclude 警告
- 深度超过 MAX_INCLUDE_DEPTH 时停止递归
- includeRawCache 缓存 raw result，同一文件不同 parentPath 各自 graft

### Index 测试（`tests/test-par-index.js`）

- 多个 `.par` 文件合并（Phase 2.2）
- 同名 parameter 在不同 block 下不混淆（`Bandgap/Eg0` vs `QuantumPotential/Eg0`）
- 去重策略：`(label, parentPath)` 二元组
- 来源优先级排序（current > include > workspace > materialdb > builtin）
- `document.version` 变化后缓存失效
- 同一 version 重复调用不重复解析

### Completion 测试（`tests/test-par-completion.js`）

- Material scope 内补 block → 推荐 Bandgap/Epsilon/Mobility 等
- block 内补 parameter → 推荐 block 下的参数
- `Material = "|"` 补材料名 → 推荐 Silicon/Oxide 等
- 文件顶层补 scope 类型 → 推荐 Material/Region 等
- 注释行内不补全
- 字符串内不补全 scope 名（但引号内补材料名）
- 补全不全局污染（不推荐其他 block 的 parameter）
- 空行补全能得到正确 parentPath（通过 lineContexts）

### 上下文解析测试（`tests/test-par-context.js`）

- `stackToPath()` 转换正确
- `getContextAtPosition()` 在各种嵌套层级返回正确的 context
- `getContextAtPosition()` 在空行返回正确 parentPath
- `matchParentPath()` 通配符匹配

### 性能测试

- 重复调用 completion 不重复全文扫描
- 3000 行 .par 文件解析 < 50ms
- 20 次不同文件解析后 FIFO 淘汰正常

### 测试风格

沿用仓库现有纯 Node.js assert 风格，零外部依赖。不使用 describe/it（仓库未引入测试框架）：

```js
const assert = require('assert');
const { parseParText } = require('../src/lsp/sdevicepar/par-parser');

// Parser 基础：scope 识别
{
  const result = parseParText('Material = "Silicon" {\n}', 'test.par');
  assert.strictEqual(result.symbols.length, 1);
  assert.strictEqual(result.symbols[0].kind, 'scope');
  assert.strictEqual(result.symbols[0].scopeType, 'Material');
  assert.strictEqual(result.symbols[0].name, 'Silicon');
}

// Parser：#include 优先于注释跳过
{
  const result = parseParText('#include "Silicon.par"\n', 'test.par');
  assert.strictEqual(result.includes.length, 1);
  assert.strictEqual(result.includes[0].path, 'Silicon.par');
}

// Parser：Insert 优先于 parameter assignment
{
  const text = 'Insert = "Oxide.par"\n';
  const result = parseParText(text, 'test.par');
  assert.strictEqual(result.includes.length, 1);
  assert.strictEqual(result.includes[0].path, 'Oxide.par');
  assert.strictEqual(result.symbols.length, 0); // 不应产生 parameter symbol
}

// Parser：pendingBlockName 兑现
{
  const text = 'Bandgap\n*\n{\nEg0 = 1.12\n}\n';
  const result = parseParText(text, 'test.par');
  assert.strictEqual(result.symbols[0].kind, 'block');
  assert.strictEqual(result.symbols[0].name, 'Bandgap');
  assert.strictEqual(result.symbols[1].kind, 'parameter');
  assert.strictEqual(result.symbols[1].name, 'Eg0');
}

console.log('All par-parser tests passed.');
```

## 16. Phased Implementation Plan

### Phase 2.1：当前文件 + include + 上下文补全

**交付物**：
- `src/lsp/sdevicepar/par-parser.js`
- `src/lsp/sdevicepar/par-context.js`
- `src/lsp/sdevicepar/par-index-service.js`
- `src/lsp/sdevicepar/par-completion.js`
- `src/extension.js` 修改（初始化 ParIndexService + 预热事件）
- `src/register-completion-providers.js` 修改（sdevicepar 分支）
- 测试文件：`tests/test-par-parser.js`, `tests/test-par-context.js`, `tests/test-par-completion.js`

**验收标准**：
1. 打开 `.par` 文件时自动解析层级结构
2. `Material = "Silicon" { | }` 内推荐 block 名
3. `Bandgap { | }` 内推荐 parameter 名
4. `Material = "|"` 推荐材料名
5. `#include "Silicon.par"` 递归解析，内容继承 ref.parentPath
6. 补全不全局污染
7. 空行补全得到正确上下文
8. 所有测试通过

### Phase 2.2：workspace 全量扫描

**交付物**：
- workspace `.par` 文件扫描逻辑
- 文件 watcher 增量更新
- workspace 文件索引合并

**验收标准**：
1. 打开 workspace 自动扫描所有 `.par` 文件
2. 补全包含 workspace 中其他文件的参数
3. 文件变更后增量更新索引

### Phase 2.3：MaterialDB 内置参考

**交付物**：
- 加载 `references/MaterialDB/` 数据
- MaterialDB 数据合并进 Index

**验收标准**：
1. 补全包含 MaterialDB 中的参数
2. MaterialDB 参数标记 source = "materialdb"
3. 优先级低于 current/include/workspace

### Phase 2.4：Hover/Definition

**交付物**：
- `getHoverInfo()` 实现
- `getDefinitionLocation()` 实现
- Provider 分支添加

**验收标准**：
1. 参数上悬停显示来源、值、parentPath
2. F12 跳转到定义位置（workspace/MaterialDB）

## 17. Risks / Open Questions

### 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| `.par` 文件格式变体多 | parser 可能遗漏边缘 case | 容错设计，不识别的结构不崩溃 |
| include 上下文继承复杂 | parentPath 拼接错误 | 详细的测试覆盖 + 调试日志 |
| workspace 大量 `.par` 文件 | 全量扫描耗时长 | 惰性后台扫描，不阻塞编辑 |
| 与 WASM 管线冲突 | 两个解析管线可能产生不一致 | 职责严格分离：WASM=Tcl 通用，ParParser=.par 领域 |
| MaterialDB 文件更新 | 内置参考可能与用户版本不一致 | 标记 source，不作为唯一权威来源 |
| pendingBlockName 误触发 | 行内注释后的标识符被误判为 block 名 | 放弃机制 + abandonedPending 警告 |

### 开放问题

1. **`Insert` 的语义**：`Insert = "Silicon.par"` 在 SDEVICE 中是直接替换还是引入？影响 parentPath 继承方式。当前假设与 `#include` 行为一致。
   - **Phase 2.1 决策**：统一按 `#include` 处理，后续如有差异再区分。

2. **`#if` 条件块的 conditional 标记**：Phase 2.1 可以先不实现 `conditional: true` 标记，所有条件块内参数按普通参数处理。标记可在后续版本添加，不影响 parser 核心逻辑。
   - **Phase 2.1 决策**：先不标记，但 parser 不跳过条件块内容。

3. **workspace 中同名 scope**：多个 `.par` 文件可能都定义 `Material = "Silicon" { ... }`。
   - **Phase 2.1 决策**：不去重 scope，每个文件的 scope 独立索引，补全时按文件分组显示。

4. **block 名的精确列表**：Phase 2.1 从 include/materialdb 抽取 block 名。是否需要硬编码一个"已知 block"列表作为 fallback？
   - **Phase 2.1 决策**：不硬编码。Phase 2.1 的 block 补全完全来自解析结果。如果解析结果为空，则无 block 补全（不是推荐错误的内容）。

5. **性能基准**：需要建立实际的 `.par` 文件解析性能基准。
   - **Phase 2.1 决策**：以 Silicon.par（2927 行）为基准，解析目标 < 50ms。

6. **单行嵌套**：当前 parser 为 line-oriented，不支持 `Material = "Silicon" { Bandgap { Eg0 = 1.12 } }` 单行嵌套。实际 `.par` 文件中几乎不出现此写法。
   - **Phase 2.1 决策**：不处理单行嵌套。如果未来发现真实需求，可扩展为 token scanner。

---

## 附录：与 Issue #68 蓝图的映射

| Issue #68 概念 | 本 spec 对应 |
|----------------|-------------|
| 栈式结构解析器 | `par-parser.js` 的纯文本栈追踪 + pendingBlockName |
| 四张分层词库 | ParSymbol 的 kind 字段 + parentPath 约束 |
| 上下文感知补全 | `getCompletionsAt()` + `lineContexts` + `getContextAtPosition()` |
| include/Insert 递归 | `resolveIncludes()` + graft base（ref.parentPath）+ includeRawCache |
| 五级词库来源优先级 | source 字段 + sortText 优先级前缀（current > include > workspace > materialdb > builtin） |
| 词库输出格式 | ParSymbol 结构（fullPath/parentPath/source/includeChain/conditional） |
