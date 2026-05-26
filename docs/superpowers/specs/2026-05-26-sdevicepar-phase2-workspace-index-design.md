# SDEVICE PAR Phase 2：Workspace Index + Include/Insert 递归解析 + 上下文感知补全

> **状态**: 设计中
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
5. **五级来源优先级**：current > workspace > include > materialdb > builtin
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
推荐：workspace/include/materialdb 中发现的材料名（`Silicon`、`Oxide`、`Germanium` 等）

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
         ├─ ParParser.parse(text) → ParSymbol[] + ParIncludeRef[]
         │
         ├─ resolveIncludes(includes, baseUri, inheritedParentPath, visited, depth)
         │     │
         │     ├─ 查找 include 文件（当前目录 → workspace → MaterialDB）
         │     ├─ ParParser.parse(includeText)
         │     ├─ 前缀替换 parentPath（继承 include 位置上下文）
         │     └─ 递归直到深度限制或无新 include
         │
         ├─ 合并 builtin scopeTypes
         │
         └─ 缓存结果（按 uri + document.version）
              │
              ├─ CompletionProvider → getCompletionsAt(document, position)
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

### 识别规则

| 类型 | 正则匹配 | 说明 |
|------|----------|------|
| scope 声明 | `^\s*(Material\|Region\|Interface\|MaterialInterface\|RegionInterface\|Electrode)\s*=\s*"([^"]+)"\s*\{` | 捕获 type + name |
| block 开始 | `^\s*([A-Za-z][\w-]+)\s*\{` | section 名 + 左花括号 |
| 参数赋值 | `^\s*([A-Za-z][\w-]+(?:\(\d+\))?)\s*=\s*(.*)` | 支持向量参数 `Xmax(0)` |
| include | `^\s*#include\s+"([^"]+)"` | 预处理 include |
| Insert | `^\s*Insert\s*=\s*"([^"]+)"` | Insert 命令 |
| SWB 参数 | `@[^@]+@` | 跳过，不解析为结构 |

### 核心算法

```
function parseParText(text, filePath):
  symbols = []
  includes = []
  stack = []       // [{kind, name, scopeType?, line}]
  braceDepth = 0
  inString = false
  inComment = false

  for each line in text:
    // 跳过空行、注释行（# 或 * 开头）
    // 跳过字符串内容行
    // 跳过纯 SWB 参数行

    if matches scope declaration:
      stack.push({kind: "scope", type: match[1], name: match[2]})
      symbols.push({kind: "scope", name: match[2], scopeType: match[1], ...})
      braceDepth += countBraces(line)
      continue

    if matches block start:
      parentPath = stackToPath(stack)
      stack.push({kind: "block", name: match[1]})
      symbols.push({kind: "block", name: match[1], parentPath, ...})
      braceDepth += countBraces(line)
      continue

    if matches parameter assignment:
      parentPath = stackToPath(stack)
      symbols.push({kind: "parameter", name: match[1], value: match[2], parentPath, ...})
      continue

    if matches include:
      parentPath = stackToPath(stack)
      includes.push({path: match[1], parentPath, line})
      continue

    // 处理行内 { } 变化
    // braceDepth 始终 = stack.length + 行内未匹配的 { 数
    delta = countOpenBraces(line) - countCloseBraces(line)
    if delta < 0:
      // 遇到 }，需要 pop stack
      for i in range(-delta):
        if stack.length > 0:
          stack.pop()
```

### 输出数据结构

```js
// ParParseResult
{
  symbols: ParSymbol[],
  includes: ParIncludeRef[],
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
    endLine: number,
    endCol: number
  },
  value: string | null,            // 参数值（仅 parameter 有）
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

// ParParseIssue — 容错性警告
{
  kind: "unresolvedInclude" | "unbalancedBraces" | "maxDepthExceeded",
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
 * 获取光标位置的上下文
 * 返回 { parentPath, currentKind, completetableKind }
 * completetableKind: "scopeType" | "scopeName" | "block" | "parameter" | null
 */
function getContextAtPosition(symbols, includes, targetLine, targetCol)

/**
 * 通配符路径匹配
 * matchParentPath("Material/Silicon/AvalancheFactors", "Material/*/AvalancheFactors") → true
 */
function matchParentPath(parentPath, pattern)
```

### 容错设计

- **注释行**（`#` 或 `*` 开头）：跳过不解析
- **字符串内容**：引号内文本不解析为结构（但 scope 声明的引号内名字需要捕获）
- **SWB 参数**（`@...@`）：跳过不解析为结构
- **brace 不匹配**：不崩溃，记录 `unbalancedBraces` 警告继续
- **block 名与 `{` 同行/不同行**：两种都识别（已由 PR #71 验证这两种写法的存在）
- **向量参数**（`Xmax(0) = 1e-4`）：`name` 字段保留 `(N)` 后缀

## 9. Index Design

### 文件：`src/lsp/sdevicepar/par-index-service.js`

### 初始化策略

**方案 A：当前文件优先，惰性扩展**

1. `.par` 文件打开时 → 解析当前文件 + include 递归
2. 后台惰性触发 → workspace `.par` 全量扫描（Phase 2.2）
3. 按需加载 → MaterialDB 参考数据（Phase 2.3）

首版只实现步骤 1，workspace 全量扫描作为 Phase 2.2 追加。

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
  const currentFileCache = new Map();  // "uri:v{version}" → ParParseResult
  const includeCache = new Map();      // uri → ParParseResult（include 文件缓存）
  const MAX_CACHE_SIZE = 20;           // 与 TclParseCache 一致

  return {
    /**
     * 解析当前文件（每次文档变更调用，走 version 缓存）
     * @param {vscode.TextDocument} document
     * @returns {ParParseResult}
     */
    parseCurrentFile(document),

    /**
     * 解析 include 引用（内部调用，递归）
     * @param {ParIncludeRef[]} includes
     * @param {string} baseUri — 当前文件 URI
     * @param {string} inheritedParentPath — include 位置的 parentPath
     * @param {Set<string>} visited — 已访问文件集合
     * @param {number} depth — 当前递归深度
     * @returns {ParSymbol[]}
     */
    resolveIncludes(includes, baseUri, inheritedParentPath, visited, depth),

    /**
     * 获取光标位置的补全列表
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

| 缓存 | 键 | 失效条件 | 上限 |
|------|-----|----------|------|
| currentFileCache | `uri:v{version}` | document.version 变化 | 20 (FIFO) |
| includeCache | `uri` | 文件 mtime 变化（Phase 2.2 加 watcher） | 20 (FIFO) |
| workspaceIndex | — | Phase 2.2 实现 | — |

**性能保证**：
- CompletionProvider 热路径只查询内存缓存，不做文件 IO
- include 文件首次解析后缓存，后续请求直接命中
- `parseCurrentFile` 检查 `document.version`，版本未变则返回缓存

### builtin fallback 数据

```js
// 内置 scope 类型列表（Phase 2.1 硬编码，Phase 2.3 可从 MaterialDB 扩展）
const BUILTIN_SCOPE_TYPES = [
  "Material", "Region", "Interface",
  "MaterialInterface", "RegionInterface", "Electrode"
];
```

不需要独立的 JSON 文件。当 Index 中无 workspace/include 数据时，builtin 列表提供最低限度的补全。

## 10. Include/Insert Resolution

### 查找顺序

1. **当前文件所在目录**（最优先）
2. **workspace 根目录**（遍历 `workspaceFolders`）
3. **插件内置 `references/MaterialDB/`**（作为开发/测试参考）
4. **用户配置的 `sentaurus.materialDbPath`**（可选配置项，Phase 3 启用）

### include 上下文继承

**核心难点**：被 include 文件的内容应"嫁接"到 include 发生位置的上下文中。

```
wrapper.par:
  Material = "Silicon" {          ← parentPath = "Material/Silicon"
    #include "Silicon.par"        ← include 发生位置
  }

Silicon.par（被 include）:
  Bandgap {                       ← 原始 parentPath = ""（顶层）
    Eg0 = 1.12                    ← 原始 parentPath = "Bandgap"
  }

解析结果（上下文继承后）:
  Material/Silicon/Bandgap        ← block（parentPath 前缀替换）
  Material/Silicon/Bandgap/Eg0    ← parameter（parentPath 前缀替换）
```

**实现方式**：

```js
function resolveIncludes(includes, baseUri, inheritedParentPath, visited, depth) {
  const result = [];
  for (const ref of includes) {
    const resolvedUri = findIncludeFile(ref.path, baseUri);
    if (!resolvedUri || visited.has(resolvedUri)) continue;
    if (depth >= MAX_INCLUDE_DEPTH) continue;

    visited.add(resolvedUri);
    const parseResult = parseIncludeFile(resolvedUri);

    for (const sym of parseResult.symbols) {
      // 前缀替换：将原始 parentPath 替换为 include 位置 + 原始路径
      const newParentPath = inheritedParentPath
        ? inheritedParentPath + (sym.parentPath ? "/" + sym.parentPath : "")
        : sym.parentPath;
      result.push({
        ...sym,
        parentPath: newParentPath,
        fullPath: newParentPath + "/" + sym.name,
        source: determineSource(resolvedUri),  // "include" | "materialdb"
        includeChain: [...currentIncludeChain, resolvedUri],
        filePath: resolvedUri,
      });
    }

    // 递归处理 include 文件中的 include
    if (parseResult.includes.length > 0) {
      result.push(...resolveIncludes(
        parseResult.includes, resolvedUri, inheritedParentPath, visited, depth + 1
      ));
    }
  }
  return result;
}
```

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
| scope 名 | `Type = "\|"` | workspace/include/materialdb 中的名字 | Index | `Value` / `Constant` |
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
| workspace | 1 | workspace 其他文件 |
| include | 2 | include 引用文件 |
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

1. 用户按键触发 CompletionProvider
2. Provider 调用 `parIndexService.parseCurrentFile(document)` 更新缓存（检查 version，未变则跳过）
3. Provider 调用 `parIndexService.getCompletionsAt(document, position)` 获取上下文补全
4. 如果有结果，与现有 all_keywords 补全合并（Index 结果优先）
5. 如果无结果（光标在注释/字符串中），走现有 fallback

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

跳转目标优先级：当前文件 > workspace > include > MaterialDB。

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
  ├─ currentFileCache: Map<"uri:v{version}", ParParseResult>
  ├─ includeCache: Map<uri, ParParseResult>
  └─ 上限 20 条目，FIFO 淘汰

Level 2: workspaceIndex (Phase 2.2)
  └─ Map<uri, ParParseResult>，按文件 mtime 增量更新

Level 3: builtin (硬编码)
  └─ BUILTIN_SCOPE_TYPES 常量
```

### 性能保证

| 场景 | 保证 |
|------|------|
| 单次按键补全 | 只查询内存缓存，0 文件 IO |
| 当前文件解析 | < 50ms（典型 .par 文件 < 3000 行） |
| include 递归 | 首次 ≤ 200ms（含文件读取），后续命中缓存 |
| workspace 全量扫描（Phase 2.2） | 后台执行，不阻塞编辑 |
| 内存占用 | 单文件解析结果 < 100KB，20 缓存条目 < 2MB |

### 首版简化

1. **先解析当前打开文件 + 其 include**：用户打开 `.par` 立即获得基本上下文补全
2. **workspace 全量扫描延后**：Phase 2.2 通过文件 watcher + 后台任务实现
3. **include 缓存按 URI 存储**：Phase 2.1 不检测 include 文件外部变更，Phase 2.2 加 mtime 检查

## 14. Integration Points

### 新增文件

```
src/lsp/sdevicepar/
├── par-parser.js              ← 纯文本栈追踪解析器
├── par-index-service.js       ← 索引服务（缓存 + include + 查询）
├── par-completion.js          ← CompletionItem 构建逻辑
└── par-context.js             ← 工具函数：stackToPath / getContextAtPosition / matchParentPath
```

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/extension.js` | 在 `activate()` 中初始化 `ParIndexService`，仅当 `sdevicepar` 语言被激活时 |
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
- `Material = "Silicon" { Bandgap { Eg0 = 1.12 } }` → scope + block + parameter
- `Region = "channel" { }` → scope 无子 block
- `Interface = "Silicon/Oxide" { }` → 含 `/` 的 interface 名
- 嵌套 3 层以上结构

**格式变体**：
- block 名与 `{` 同行：`Bandgap {`
- block 名与 `{` 不同行：`Bandgap\n{`
- 行内注释：`Scharfetter * relation`
- SWB 参数：`@AvalFac@`、`@<expr>@` 不被解析为结构
- 字符串值：`Formula = 1`、`fileName = "model.dat"`
- 向量参数：`Xmax(0) = 1e-4`

**容错**：
- 不匹配的 `{}` 不崩溃
- 空文件返回空结果
- 只有注释的文件返回空结果

### Include 递归测试（`tests/test-par-include.js`）

- wrapper 文件 `#include "Silicon.par"` → Silicon.par 内容继承 parentPath
- `Insert = "Silicon.par"` 同等处理
- 循环 include（A include B include A）不死循环
- 自引用 include 不死循环
- include 文件不存在时返回空 + unresolvedInclude 警告
- 深度超过 MAX_INCLUDE_DEPTH 时停止递归
- include 文件中的 include 递归解析

### Index 测试（`tests/test-par-index.js`）

- 多个 `.par` 文件合并（Phase 2.2）
- 同名 parameter 在不同 block 下不混淆（`Bandgap/Eg0` vs `QuantumPotential/Eg0`）
- 去重策略：`(label, parentPath)` 二元组
- 来源优先级排序
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

### 上下文解析测试（`tests/test-par-context.js`）

- `stackToPath()` 转换正确
- `getContextAtPosition()` 在各种嵌套层级返回正确的 context
- `matchParentPath()` 通配符匹配

### 性能测试

- 重复调用 completion 不重复全文扫描
- 3000 行 .par 文件解析 < 50ms
- 20 次不同文件解析后 FIFO 淘汰正常

### 测试风格

沿用仓库现有纯 Node.js assert 风格，零外部依赖：

```js
const assert = require('assert');
const { parseParText } = require('../src/lsp/sdevicepar/par-parser');

describe('par-parser', () => {
  it('should parse Material scope', () => {
    const result = parseParText('Material = "Silicon" {\n}', 'test.par');
    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].kind, 'scope');
    assert.strictEqual(result.symbols[0].scopeType, 'Material');
    assert.strictEqual(result.symbols[0].name, 'Silicon');
  });
});
```

## 16. Phased Implementation Plan

### Phase 2.1：当前文件 + include + 上下文补全

**交付物**：
- `src/lsp/sdevicepar/par-parser.js`
- `src/lsp/sdevicepar/par-context.js`
- `src/lsp/sdevicepar/par-index-service.js`
- `src/lsp/sdevicepar/par-completion.js`
- `src/extension.js` 修改（初始化 ParIndexService）
- `src/register-completion-providers.js` 修改（sdevicepar 分支）
- 测试文件：`tests/test-par-parser.js`, `tests/test-par-context.js`, `tests/test-par-completion.js`

**验收标准**：
1. 打开 `.par` 文件时自动解析层级结构
2. `Material = "Silicon" { | }` 内推荐 block 名
3. `Bandgap { | }` 内推荐 parameter 名
4. `Material = "|"` 推荐材料名
5. `#include "Silicon.par"` 递归解析，内容继承 parentPath
6. 补全不全局污染
7. 所有测试通过

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
3. 优先级低于 current/workspace/include

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
| include 上下文继承复杂 | 路径拼接错误 | 详细的测试覆盖 + 调试日志 |
| workspace 大量 `.par` 文件 | 全量扫描耗时长 | 惰性后台扫描，不阻塞编辑 |
| 与 WASM 管线冲突 | 两个解析管线可能产生不一致 | 职责严格分离：WASM=Tcl 通用，ParParser=.par 领域 |
| MaterialDB 文件更新 | 内置参考可能与用户版本不一致 | 标记 source，不作为唯一权威来源 |

### 开放问题

1. **`Insert` 的语义**：`Insert = "Silicon.par"` 在 SDEVICE 中是直接替换还是引入？影响 parentPath 继承方式。当前假设与 `#include` 行为一致。
   - **Phase 2.1 决策**：统一按 `#include` 处理，后续如有差异再区分。

2. **`#if`/`#elif`/`#endif` 条件块**：include 文件可能包含预处理器条件块。Phase 2.1 不解析条件块内的参数（交给 WASM 管线的 `pp-utils.js` 处理），Phase 2.2 可考虑利用 `ppBlocks` 映射过滤条件块内参数。
   - **Phase 2.1 决策**：跳过条件块，不解析。记录为未覆盖。

3. **workspace 中同名 scope**：多个 `.par` 文件可能都定义 `Material = "Silicon" { ... }`。
   - **Phase 2.1 决策**：不去重 scope，每个文件的 scope 独立索引，补全时按文件分组显示。

4. **block 名的精确列表**：Phase 2.1 从 workspace/include/materialdb 抽取 block 名。是否需要硬编码一个"已知 block"列表作为 fallback？
   - **Phase 2.1 决策**：不硬编码。Phase 2.1 的 block 补全完全来自解析结果。如果解析结果为空，则无 block 补全（不是推荐错误的内容）。

5. **性能基准**：需要建立实际的 `.par` 文件解析性能基准。
   - **Phase 2.1 决策**：以 Silicon.par（2927 行）为基准，解析目标 < 50ms。

---

## 附录：与 Issue #68 蓝图的映射

| Issue #68 概念 | 本 spec 对应 |
|----------------|-------------|
| 栈式结构解析器 | `par-parser.js` 的纯文本栈追踪 |
| 四张分层词库 | ParSymbol 的 kind 字段 + parentPath 约束 |
| 上下文感知补全 | `getCompletionsAt()` + `getContextAtPosition()` |
| include/Insert 递归 | `resolveIncludes()` + 上下文继承 |
| 五级词库来源优先级 | source 字段 + sortText 优先级前缀 |
| 词库输出格式 | ParSymbol 结构（fullPath/parentPath/source/includeChain） |
