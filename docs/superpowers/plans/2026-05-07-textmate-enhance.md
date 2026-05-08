# TextMate 语法增强 — Hover 高亮一致性 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 TextMate 语法覆盖率，使 hover 代码块（TextMate）和编辑器（语义层）使用一致的 scope，消除颜色不一致。

**Architecture:** 将 SDEVICE 语法从扁平 `patterns` 数组重构为 `repository` + `begin/end` 嵌套模式，在 `{}` 块内部定义上下文感知匹配规则。同时为 SDE 和其他 Tcl 工具添加宏引用匹配。最后对齐 `semanticTokenScopes` 映射。

**Tech Stack:** TextMate 语法 JSON（声明式）、VSCode Extension API、纯 JavaScript

**设计文档:** `docs/superpowers/specs/2026-05-07-textmate-hover-alignment-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `syntaxes/sdevice.tmLanguage.json` | **重写** | 从扁平模式重构为 begin/end 嵌套 repository |
| `syntaxes/sde.tmLanguage.json` | **修改** | #define captures 增强 + 宏引用规则 |
| `syntaxes/sprocess.tmLanguage.json` | **修改** | 添加宏引用规则 |
| `syntaxes/emw.tmLanguage.json` | **修改** | 添加宏引用规则 |
| `syntaxes/inspect.tmLanguage.json` | **修改** | 添加宏引用规则 |
| `syntaxes/svisual.tmLanguage.json` | **修改** | 添加宏引用规则 |
| `package.json` | **修改** | semanticTokenScopes 映射对齐 |

---

### Task 1: SDEVICE — repository 骨架 + 通用规则迁移

**Files:**
- Rewrite: `syntaxes/sdevice.tmLanguage.json`

**目标：** 搭建新的 repository 骨架，将注释、字符串、数字字面量、@Var@ 参数迁移到 repository 条目。

- [ ] **Step 1: 将 sdevice.tmLanguage.json 的 repository 和顶层 patterns 替换为以下结构**

将当前的：
```json
"repository": {},
```

替换为包含基础规则的 repository 骨架，并将顶层 `patterns` 数组改为引用 repository：

```json
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "Sentaurus SDEVICE",
  "patterns": [
    { "include": "#comments" },
    { "include": "#preprocessor" },
    { "include": "#macro-reference" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#swb-params" },
    { "include": "#section-block" },
    { "match": "\\b(if|else|elseif|for|foreach|while|switch|break|continue|return)\\b", "name": "keyword.control.sdevice" },
    { "match": "\\b(proc|try|throw)\\b", "name": "keyword.other.sdevice" },
    { "match": "\\b(after|append|array|catch|close|concat|error|eval|expr|file|format|gets|glob|global|incr|info|join|lappend|lindex|linsert|list|llength|lrange|lreplace|lsearch|lsort|open|puts|read|regsub|rename|scan|set|source|split|string|subst|unset|uplevel|upvar|variable|vwait)\\b", "name": "support.function.sdevice" },
    { "match": "\\b[A-Za-z_][A-Za-z0-9_\\-]*(?![A-Za-z0-9_\\-])", "name": "variable.other" }
  ],
  "repository": {
    "comments": {
      "patterns": [
        { "name": "comment.line.hash", "match": "#.*$" },
        { "name": "comment.line.asterisk", "match": "^\\s*\\*.*$" }
      ]
    },
    "strings": {
      "name": "string.quoted.double",
      "begin": "\"",
      "end": "\"",
      "patterns": [
        { "name": "constant.character.escape", "match": "\\\\." },
        { "match": "@[a-zA-Z_<][^@]*@", "name": "constant.character.format.placeholder" }
      ]
    },
    "numbers": {
      "match": "\\b(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?\\b",
      "name": "constant.numeric"
    },
    "swb-params": {
      "match": "@[a-zA-Z_<][^@]*@",
      "name": "constant.character.format.placeholder"
    },
    "preprocessor": {
      "patterns": [
        /* ← 将现有的 4 个预处理器规则（define/undef/ifdef/other）原样移入此处 */
      ]
    },
    "macro-reference": {
      "comment": "匹配 3+ 字符全大写标识符作为宏引用",
      "match": "\\b([A-Z][A-Z0-9_]{2,})\\b",
      "name": "variable.other.constant.preprocessor.tcl"
    },
    /* section-block, solve-subsections, nested-braces, section-keywords, vector-keywords */
    /* ← 将在后续 Task 中填充 */
  },
  "scopeName": "source.sentaurus.sdevice"
}
```

**关键点：**
- 将原文件第 399-444 行的注释、字符串、数字、@Var@、Tcl 关键词、兜底标识符规则迁移到对应位置
- 将原文件第 330-397 行的 4 个预处理器规则（define/undef/ifdef/other）原样移入 `preprocessor` repository
- 新增 `macro-reference` 规则：`\b([A-Z][A-Z0-9_]{2,})\b` 匹配全大写标识符
- 原文件第 6-327 行的 section/subSection/keyword/constant 模式**暂时删除**（将在 Task 2-3 中重新放入 section-block）
- 顶层 patterns 只保留 include 引用 + Tcl 控制流/函数/兜底标识符

- [ ] **Step 2: 在 VSCode Extension Development Host 中验证基础骨架**

1. 按 F5 启动扩展开发宿主
2. 打开一个 SDEVICE `.cmd` 文件
3. 验证：注释（`#`、`*`）正常高亮
4. 验证：字符串（`"..."`）正常高亮
5. 验证：数字字面量正常高亮
6. 验证：`@Var@` 参数正常高亮
7. 验证：`#define MACRO value` 预处理器正常高亮
8. 验证：全大写标识符（如 `MY_MACRO`）被匹配为宏引用
9. 验证：Tcl 控制流（`if`、`for` 等）正常高亮

预期：section 名称、subSection、关键词暂时**不**高亮（因为尚未添加 section-block），这是正确的。

- [ ] **Step 3: 提交骨架**

```bash
git add syntaxes/sdevice.tmLanguage.json
git commit -m "refactor(sdevice): TextMate 语法重构为 repository 骨架

将扁平 patterns 数组重构为 repository 结构，迁移注释/字符串/数字/
预处理器/宏引用到独立 repository 条目，为后续 begin/end 嵌套做准备。

- 新增 macro-reference 规则匹配全大写标识符
- 预处理器规则原样迁移到 repository
- section/keyword 模式暂时移除（将在后续 commit 恢复为嵌套模式）"
```

---

### Task 2: SDEVICE — section-block + nested-braces + keywords

**Files:**
- Modify: `syntaxes/sdevice.tmLanguage.json`

**目标：** 实现 section-block begin/end 模式、nested-braces 递归、section-keywords 迁移。

- [ ] **Step 1: 在 repository 中添加 `section-block`、`nested-braces`、`section-keywords`、`vector-keywords` 条目**

在 `repository` 对象中添加以下条目：

```json
"section-block": {
  "comment": "通用 section 块，begin 匹配所有 section 名称后跟 {",
  "begin": "(?i)\\b(BandstructurePlot|CurrentPlot|Device|Electrode|FarFieldPlot|File|GainPlot|HydrogenBoundary|Math|MonteCarlo|NoisePlot|NonlocalPlot|OpticalDevice|Physics|Plot|PlotGainPara|RayTraceBC|Solve|System|TensorPlot|Thermode|TrappedCarDistrPlot|VCSELNearFieldPlot|eSHEDistributionPlot|hSHEDistributionPlot)\\s*\\{",
  "beginCaptures": {
    "1": { "name": "keyword.control.sdevice" }
  },
  "end": "\\}",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#preprocessor" },
    { "include": "#numbers" },
    { "include": "#swb-params" },
    { "include": "#solve-subsections" },
    { "include": "#section-keywords" },
    { "include": "#section-constants" },
    { "include": "#vector-keywords" },
    { "include": "#nested-braces" }
  ]
},

"solve-subsections": {
  "comment": "Solve 内的 5 个 subSection + 额外 section",
  "begin": "(?i)\\b(QuasiStationary|Coupled|Transient|ACCoupled|Goal|BreakCriteria|Continuation|HB|Plugin|SaveOptField|Window)\\s*[\\(\\{]",
  "beginCaptures": {
    "1": { "name": "entity.name.type.sdevice" }
  },
  "end": "\\}",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#preprocessor" },
    { "include": "#numbers" },
    { "include": "#swb-params" },
    { "include": "#section-keywords" },
    { "include": "#section-constants" },
    { "include": "#vector-keywords" },
    { "include": "#nested-braces" }
  ]
},

"section-keywords": {
  "comment": "所有 section 内关键词（通用列表，不按 section 区分）",
  "patterns": [
    /* ← 将原文件第 18-58 行的所有 entity.name.tag.sdevice 关键词组原样移入 */
    /* ← 将原文件第 62-63 行的 Insert (support.class.sdevice) 也移入 */
  ]
},

"section-constants": {
  "comment": "所有 section 内参数名（通用列表）",
  "patterns": [
    /* ← 将原文件第 66-327 行的所有 constant.numeric.sdevice 参数名组原样移入 */
    /* ← 将原文件第 166-167 行的 value 也移入 */
  ]
},

"vector-keywords": {
  "comment": "矢量关键词 XXX/Vector",
  "match": "(?i)\\b[A-Za-z_][A-Za-z0-9_]*\\/(Vector|vector|SpecialVector)(?![A-Za-z0-9_])",
  "name": "entity.name.tag.sdevice"
},

"nested-braces": {
  "comment": "递归 {} 嵌套处理",
  "begin": "\\{",
  "end": "\\}",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#preprocessor" },
    { "include": "#numbers" },
    { "include": "#swb-params" },
    { "include": "#solve-subsections" },
    { "include": "#section-keywords" },
    { "include": "#section-constants" },
    { "include": "#vector-keywords" },
    { "include": "#nested-braces" }
  ]
}
```

**关键变更说明：**
1. **section-block**: begin 匹配 22 个 section 名称 + `{`，end 匹配 `}`。beginCaptures 将 section 名着色为 `keyword.control.sdevice`（蓝色）
2. **solve-subsections**: begin 匹配 5 个 subSection + 额外 section 名 + `(` 或 `{`，end 匹配 `}`。**scope 从 `keyword.other.sdevice` 改为 `entity.name.type.sdevice`**（青绿色），这是本次重构的核心对齐
3. **nested-braces**: 递归处理 `{}` 嵌套，通过 include 自身实现递归
4. **section-keywords**: 原样迁入所有 `entity.name.tag.sdevice` 关键词组 + `support.class.sdevice`（Insert）
5. **section-constants**: 原样迁入所有 `constant.numeric.sdevice` 参数名组
6. **vector-keywords**: 原样迁入矢量关键词模式
7. **patterns 顺序**：首匹配胜出，include 按优先级排列：注释 → 字符串 → 预处理器 → 数字 → @Var → subSections → keywords → constants → vectors → 嵌套括号

**原始关键词组迁移映射：**

| 原文件行 | Scope | 迁移到 |
|----------|-------|--------|
| 18-58（11 组 entity.name.tag） | `entity.name.tag.sdevice` | `#section-keywords` |
| 62-63（Insert） | `support.class.sdevice` | `#section-keywords` |
| 66-327（31 组 constant.numeric） | `constant.numeric.sdevice` | `#section-constants` |
| 166-167（value） | `constant.numeric.sdevice` | `#section-constants` |
| 14-15（XXX/Vector） | `entity.name.tag.sdevice` | `#vector-keywords` |

- [ ] **Step 2: 在 VSCode 中验证 section 嵌套高亮**

1. 在扩展开发宿主中重新加载窗口（Ctrl+Shift+P → Reload Window）
2. 打开一个包含嵌套 section 的 SDEVICE 文件
3. 验证：`Physics { ... }` 中 Physics 为蓝色（`keyword.control.sdevice`）
4. 验证：`Solve { QuasiStationary { ... } }` 中 QuasiStationary 为青绿色（`entity.name.type.sdevice`）
5. 验证：section 内关键词（如 `Recombination`、`Mobility`）正常高亮为蓝色（`entity.name.tag.sdevice`）
6. 验证：`CurrentPlot { eDensity/Vector }` 中矢量关键词正常高亮
7. 验证：多层 `{}` 嵌套中关键词仍然高亮
8. 验证：预处理器 `#define` 在 section 内外都正常
9. 验证：全大写宏引用（如 `MY_VAR`）在 section 内被正确匹配

- [ ] **Step 3: 提交 section 嵌套实现**

```bash
git add syntaxes/sdevice.tmLanguage.json
git commit -m "feat(sdevice): 实现 begin/end 嵌套 section 匹配

将 18 个 section 重构为 begin/end 块模式，支持：
- section-block: 匹配 section 名称 + {，内部包含关键词/常数/矢量规则
- solve-subsections: 匹配 5 个 subSection，scope 改为 entity.name.type.sdevice
  （之前为 keyword.other.sdevice，与语义层不一致）
- nested-braces: 递归 {} 嵌套处理
- 所有关键词组和参数名组迁移到 repository 条目"
```

---

### Task 3: SDE — #define captures 增强 + 宏引用

**Files:**
- Modify: `syntaxes/sde.tmLanguage.json`

**目标：** 将 SDE 的预处理器 begin/end 块中的 #define macro name 添加独立 scope，并新增宏引用匹配规则。

- [ ] **Step 1: 修改 SDE 预处理器规则，添加 #define macro name scope**

当前 SDE 预处理器使用 begin/end 模式（`syntaxes/sde.tmLanguage.json` 约第 442 行）：

```json
{
    "name": "meta.preprocessor.sde",
    "begin": "^\\s*(#\\s*(?:if|ifdef|ifndef|elif|else|endif|define|undef|include|error|set))\\b",
    "contentName": "keyword.control.preprocessor.sde",
    ...
}
```

这个 begin/end 模式将整行内容都标记为 `keyword.control.preprocessor.sde`，无法区分 `#define` 指令和宏名。

**改为 match 模式拆分 #define：**

将 SDE 的预处理器 begin/end 块替换为以下 4 个 match 规则（与 SDEVICE 结构一致）：

```json
{
    "name": "meta.preprocessor.define.sde",
    "match": "^\\s*(#\\s*define)\\b\\s+(\\w+)(\\s+.*)?$",
    "captures": {
        "1": { "name": "keyword.control.preprocessor.sde" },
        "2": { "name": "variable.other.constant.preprocessor.sde" },
        "3": {
            "patterns": [
                { "match": "\"[^\"]*\"", "name": "string.quoted.double.sde" },
                { "match": "\\b(defined|TRUE|FALSE)\\b", "name": "keyword.control.preprocessor.sde" }
            ]
        }
    }
},
{
    "name": "meta.preprocessor.undef.sde",
    "match": "^\\s*(#\\s*undef)\\b\\s+(\\w+)",
    "captures": {
        "1": { "name": "keyword.control.preprocessor.sde" },
        "2": { "name": "variable.other.constant.preprocessor.sde" }
    }
},
{
    "name": "meta.preprocessor.ifdef.sde",
    "match": "^\\s*(#\\s*(?:ifdef|ifndef))\\b\\s+(\\w+)",
    "captures": {
        "1": { "name": "keyword.control.preprocessor.sde" },
        "2": { "name": "variable.other.constant.preprocessor.sde" }
    }
},
{
    "name": "meta.preprocessor.other.sde",
    "match": "^\\s*(#\\s*(?:if|elif|else|endif|include|error|set))\\b(.*$)",
    "captures": {
        "1": { "name": "keyword.control.preprocessor.sde" },
        "2": {
            "patterns": [
                { "match": "\\b(defined|TRUE|FALSE)\\b", "name": "keyword.control.preprocessor.sde" },
                { "match": "\"[^\"]*\"", "name": "string.quoted.double.sde" }
            ]
        }
    }
}
```

- [ ] **Step 2: 在 SDE 预处理器规则之后添加宏引用匹配**

在上述 4 个预处理器规则之后、注释规则之前添加：

```json
{
    "match": "\\b([A-Z][A-Z0-9_]{2,})\\b",
    "name": "variable.other.constant.preprocessor.sde"
}
```

**位置要求：** 必须在函数名模式组之后、注释模式之前、兜底标识符之前。这样全大写标识符优先匹配为宏引用，普通标识符仍被兜底规则匹配。

- [ ] **Step 3: 验证 SDE 预处理器高亮**

1. 在扩展开发宿主中打开一个 SDE `*_dvs.cmd` 文件
2. 验证：`#define MY_VAR 100` 中 `MY_VAR` 被高亮为宏变量（浅蓝色）
3. 验证：`#ifdef MY_VAR` 中 `MY_VAR` 被高亮
4. 验证：代码中使用 `MY_VAR` 全大写标识符被匹配为宏引用
5. 验证：函数名（如 `sdegeo:create-rectangle`）不受影响

- [ ] **Step 4: 提交 SDE 增强**

```bash
git add syntaxes/sde.tmLanguage.json
git commit -m "feat(sde): #define 宏名独立 scope + 宏引用匹配

- 将预处理器从 begin/end 块模式改为 match captures 模式
- #define 后的宏名获得 variable.other.constant.preprocessor.sde scope
- 新增宏引用规则匹配 3+ 字符全大写标识符
- 与 SDEVICE 语义层的 macro token scope 对齐"
```

---

### Task 4: 其他 Tcl 工具 — 宏引用匹配

**Files:**
- Modify: `syntaxes/sprocess.tmLanguage.json`
- Modify: `syntaxes/emw.tmLanguage.json`
- Modify: `syntaxes/inspect.tmLanguage.json`
- Modify: `syntaxes/svisual.tmLanguage.json`

**目标：** 为 4 个 Tcl 工具的语法文件添加宏引用匹配规则。这 4 个文件已有完整的预处理器 captures（`variable.other.constant.preprocessor.tcl`），只需添加引用匹配。

- [ ] **Step 1: 在每个文件的预处理器规则之后添加宏引用规则**

对 `sprocess.tmLanguage.json`、`emw.tmLanguage.json`、`inspect.tmLanguage.json`、`svisual.tmLanguage.json` 各自执行相同操作：

在最后一个预处理器规则（`meta.preprocessor.other.tcl`）之后、注释规则（`comment.line.hash`）之前，添加：

```json
{
    "match": "\\b([A-Z][A-Z0-9_]{2,})\\b",
    "name": "variable.other.constant.preprocessor.tcl"
}
```

**定位方法：**
- `sprocess.tmLanguage.json`: 预处理器规则约在第 310-360 行之间
- `emw.tmLanguage.json`: 预处理器规则约在第 66-125 行之间
- `inspect.tmLanguage.json`: 预处理器规则约在第 90-155 行之间
- `svisual.tmLanguage.json`: 预处理器规则约在第 315-370 行之间

**每个文件的具体位置：** 搜索 `"meta.preprocessor.other.tcl"` 模式，在其闭合 `}` 之后、下一个 `{` 之前（通常是 `comment.line.hash` 规则）插入宏引用规则。

- [ ] **Step 2: 验证宏引用在 4 个工具中生效**

1. 分别打开 4 个工具的 `.cmd` 文件
2. 验证：全大写标识符（如 `MY_MACRO`）被匹配为宏引用
3. 验证：关键词名（如 `sprocess` 的 `diffuse`、`etch`）不受影响
4. 验证：`#define MY_MACRO value` 中宏名仍然正确高亮

- [ ] **Step 3: 提交 4 个工具的宏引用**

```bash
git add syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat: 为 sprocess/emw/inspect/svisual 添加宏引用匹配

在 4 个 Tcl 工具的 TextMate 语法中添加全大写标识符宏引用规则，
使 hover 代码块中的宏引用也能正确着色。"
```

---

### Task 5: semanticTokenScopes 映射对齐

**Files:**
- Modify: `package.json` (第 376-378 行)

**目标：** 将 `subSection` 的映射从 `entity.name.type` 改为 `entity.name.type.sdevice`，与 Task 2 中新的 TextMate scope 精确对齐。

- [ ] **Step 1: 修改 package.json 中的 semanticTokenScopes**

将 `package.json` 约第 376-378 行：

```json
"subSection": [
  "entity.name.type"
]
```

改为：

```json
"subSection": [
  "entity.name.type.sdevice"
]
```

实际视觉效果不变（VSCode scope 匹配使用最长前缀匹配），但确保语义层和 TextMate 层使用完全相同的 scope 字符串。

- [ ] **Step 2: 验证语义层颜色未退化**

1. 在扩展开发宿主中重新加载窗口
2. 打开 SDEVICE 文件
3. 确认 QuasiStationary/Coupled/Transient 等 subSection 在编辑器中仍为青绿色
4. 确认 section 名仍为蓝色
5. 确认关键词仍为蓝色
6. 确认宏仍为浅蓝色

- [ ] **Step 3: 提交映射对齐**

```bash
git add package.json
git commit -m "fix: semanticTokenScopes subSection 映射对齐 TextMate scope

将 subSection 映射从 entity.name.type 改为 entity.name.type.sdevice，
与 TextMate 语法中的 scope 精确匹配，消除潜在的 scope 解析歧义。"
```

---

### Task 6: 集成验证

**Files:**
- 无代码变更

**目标：** 端到端验证所有改动，确认 hover 高亮与编辑器语义着色一致。

- [ ] **Step 1: 创建综合测试文件**

在 `display_test/` 目录下创建或修改 SDEVICE 测试文件，包含以下测试用例：

```
#define MY_DOPING 1e18
#define MY_MATERIAL "Silicon"

Physics {
    Recombination(SRH)
    Mobility(DopingDependence)
    AreaFactor = 1.0
}

Solve {
    QuasiStationary {
        Coupled { Poisson Electron Hole }
    }
    Transient {
        InitialStep = 0.01
    }
}

Math {
    Extrapolate
    ErrRef(Electron) = 1e8
}

CurrentPlot {
    eDensity/Vector
}
```

- [ ] **Step 2: 验证编辑器 + hover 一致性**

1. 在扩展开发宿主中打开测试文件
2. **编辑器高亮验证**：
   - `Physics`、`Solve`、`Math` → 蓝色（keyword.control.sdevice）
   - `QuasiStationary`、`Coupled`、`Transient` → 青绿色（entity.name.type.sdevice）
   - `Recombination`、`Mobility` → 蓝色（entity.name.tag.sdevice）
   - `MY_DOPING`、`MY_MATERIAL` → 浅蓝色（variable.other.constant.preprocessor）
   - `eDensity/Vector` → 蓝色（entity.name.tag.sdevice）
3. **Hover 高亮验证**：
   - 悬停在关键词上触发 hover 文档
   - 检查 hover 代码块中的颜色是否与编辑器一致
4. **对比验证**：
   - `QuasiStationary` 在编辑器和 hover 中颜色一致（均为青绿色）
   - `Recombination` 在编辑器和 hover 中颜色一致（均为蓝色）
   - `MY_DOPING` 在编辑器和 hover 中颜色一致（均为浅蓝色）

- [ ] **Step 3: 验证其他语言**

1. SDE 文件：验证 `#define MY_VAR` 宏名高亮 + 代码中宏引用高亮
2. SPROCESS 文件：验证宏引用高亮
3. SVISUAL 文件：验证宏引用高亮

- [ ] **Step 4: 验证边界情况**

1. 打开一个缺少 `}` 的 SDEVICE 文件 → 验证不会导致后续全部着色异常（TextMate 引擎应能容错）
2. 嵌套 3 层以上的 `{}` → 验证关键词仍能高亮
3. section 外部的关键词 → 验证不被高亮（这是 begin/end 的预期行为）
4. 字符串内的大写标识符 → 验证不被宏引用规则匹配

---

### Task 7: 最终提交 + PR

**Files:**
- 无新代码变更

- [ ] **Step 1: 确认所有提交**

```bash
git log --oneline HEAD~5..HEAD
```

预期看到 5 个提交：
1. `refactor(sdevice): TextMate 语法重构为 repository 骨架`
2. `feat(sdevice): 实现 begin/end 嵌套 section 匹配`
3. `feat(sde): #define 宏名独立 scope + 宏引用匹配`
4. `feat: 为 sprocess/emw/inspect/svisual 添加宏引用匹配`
5. `fix: semanticTokenScopes subSection 映射对齐 TextMate scope`

- [ ] **Step 2: 推送分支并创建 PR**

```bash
git push -u origin worktree-textmate-enhance
```

创建 PR，标题：`feat: TextMate 语法增强 — hover 高亮一致性`

PR 描述：
```
## Summary
- SDEVICE TextMate 语法从扁平模式重构为 begin/end 嵌套模式，支持上下文感知匹配
- subSection scope 从 `keyword.other.sdevice` 改为 `entity.name.type.sdevice`，与语义层对齐
- SDE 预处理器拆分为 match captures，宏名获得独立 scope
- 为 6 种语言添加宏引用匹配（全大写标识符规则）
- semanticTokenScopes 映射对齐

## Test plan
- [ ] SDEVICE section/subSection/keyword 在编辑器和 hover 中颜色一致
- [ ] SDE #define 宏名和宏引用正确高亮
- [ ] 其他 Tcl 工具宏引用正确高亮
- [ ] 缺少 `}` 的文件不会导致着色异常
- [ ] 多层 `{}` 嵌套正常工作
```

---

## 自检清单

- [x] **Spec 覆盖度**：设计文档的 4 个目标都有对应 Task
  - SDEVICE 重构 → Task 1-2
  - SDE 增强 → Task 3
  - 其他 Tcl 工具 → Task 4
  - 语义层调整 → Task 5
- [x] **占位符检查**：所有步骤包含具体代码或精确位置说明；`/* ← 迁移 */` 注释标注了原文件行号和迁移目标
- [x] **类型一致性**：所有 scope 名称在各 Task 间一致
  - subSection: `entity.name.type.sdevice`（Task 2 定义、Task 5 对齐）
  - macro: `variable.other.constant.preprocessor.tcl` / `.sde`（Task 1-4 一致）
  - section: `keyword.control.sdevice`（Task 2 定义，与原文件一致）
- [x] **文件路径准确**：所有文件路径已验证存在
