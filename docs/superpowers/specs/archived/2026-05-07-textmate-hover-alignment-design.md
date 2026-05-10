# TextMate 语法增强 — Hover 高亮一致性

## 背景

当前编辑器使用语义 token（Semantic Tokens）进行上下文感知着色，但 hover 弹窗中的代码块仅使用 TextMate 语法渲染高亮。由于两者覆盖范围和 scope 名称不一致，hover 中看到的颜色与编辑器不匹配。

MVP 验证结论：
- VSCode API 无法动态获取主题 token 颜色（Issue #32813 自 2017 年在 Backlog）
- `<span style="color:var(--vscode-xxx)">` CSS 变量部分可用但不完整（`symbolIcon.keywordForeground` 等回退为默认前景色）
- **正确方向**：增强 TextMate 语法覆盖率，使 hover（TextMate）和编辑器（语义层）使用一致的 scope

## 目标

1. **SDEVICE**：重构为 begin/end 嵌套模式，section/subSection/关键词上下文感知匹配
2. **SDE**：增强 #define 宏名 scope，添加宏引用匹配
3. **其他 Tcl 工具**：添加宏引用匹配
4. **语义层调整**：确保 `semanticTokenScopes` 映射与 TextMate scope 一致

## 差距矩阵

### SDEVICE

| Token 类型 | 语义 scope | TextMate scope（当前） | 状态 |
|-----------|-----------|---------------------|------|
| sectionName | `keyword.control.sdevice` | `keyword.control.sdevice` | 一致 |
| subSection | `entity.name.type` | `keyword.other.sdevice` | **不一致** |
| sectionKeyword | `entity.name.tag.sdevice` | `entity.name.tag.sdevice` | 一致（但无上下文限制） |
| macro 定义 | `variable.other.constant.preprocessor` | `variable.other.constant.preprocessor.tcl` | 一致 |
| macro 引用 | `variable.other.constant.preprocessor` | 无匹配 | **缺失** |

### SDE

| Token 类型 | 语义 scope | TextMate scope（当前） | 状态 |
|-----------|-----------|---------------------|------|
| userFunctionCall | 无内置映射 | 无匹配 | 不可能（需 AST） |
| macro 定义 | `variable.other.constant.preprocessor` | 无单独 scope | **缺失** |
| macro 引用 | `variable.other.constant.preprocessor` | 无匹配 | **缺失** |

## 设计

### 一、SDEVICE TextMate 重构

**策略**：将 18 个顶层 section 从 `match`（单行）改为 `begin/end`（多行块），在块内部定义上下文感知的匹配规则。

#### 1.1 新结构概览

```
顶层 patterns:
├── 注释（# 和 *）
├── 字符串
├── 预处理器（#define/#ifdef 等，带宏引用匹配）
├── 数字
├── @SWB 参数
├── section begin/end 块
│   └── section-name {  ← begin
│       ├── 注释、字符串、预处理器
│       ├── subSection begin/end（仅 Solve 内）
│       │   └── subsection-name (…) {  ← begin
│       │       └── 递归 {} 嵌套
│       ├── 通用关键词匹配
│       ├── 矢量关键词（XXX/Vector）
│       └── 递归 {} 嵌套
│   └── }  ← end
└── 兜底标识符
```

#### 1.2 Repository 组织

```json
{
  "repository": {
    "comments": { "/* 注释规则 */" },
    "strings": { "/* 字符串规则 */" },
    "numbers": { "/* 数字规则 */" },
    "preprocessor": { "/* #define/#ifdef 等预处理器，含宏引用 */" },
    "swb-params": { "/* @Var@ 参数 */" },

    "section-block": {
      "comment": "通用 section 块，begin 匹配所有 18 个 section 名称",
      "begin": "(?i)\\b(Physics|Solve|File|Electrode|...)\\s*\\{",
      "beginCaptures": { "1": { "name": "keyword.control.sdevice" } },
      "end": "\\}",
      "patterns": [
        { "include": "#comments" },
        { "include": "#strings" },
        { "include": "#preprocessor" },
        { "include": "#numbers" },
        { "include": "#swb-params" },
        { "include": "#solve-subsections" },
        { "include": "#section-keywords" },
        { "include": "#vector-keywords" },
        { "include": "#nested-braces" }
      ]
    },

    "solve-subsections": {
      "comment": "Solve 内的 5 个 subSection",
      "begin": "(?i)\\b(QuasiStationary|Coupled|Transient|ACCoupled|Goal)\\s*[\\(\\{]",
      "beginCaptures": { "1": { "name": "entity.name.type.sdevice" } },
      "end": "\\}",
      "patterns": [
        { "include": "#comments" },
        { "include": "#strings" },
        { "include": "#preprocessor" },
        { "include": "#numbers" },
        { "include": "#swb-params" },
        { "include": "#section-keywords" },
        { "include": "#nested-braces" }
      ]
    },

    "section-keywords": {
      "comment": "所有 section 内关键词（通用列表，不按 section 区分）",
      "patterns": [
        { "match": "(?i)\\b(Recombination|Mobility|BandGap|...)\\b", "name": "entity.name.tag.sdevice" }
      ]
    },

    "vector-keywords": {
      "comment": "矢量关键词 XXX/Vector",
      "match": "(?i)\\b[A-Za-z_][A-Za-z0-9_]*\\/(Vector|vector|SpecialVector)\\b",
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
        { "include": "#vector-keywords" },
        { "include": "#nested-braces" }
      ]
    }
  }
}
```

#### 1.3 Scope 对齐

| Token 类型 | TextMate scope（新） | 语义映射（调整后） | Dark+ 颜色 |
|-----------|---------------------|------------------|-----------|
| sectionName | `keyword.control.sdevice` | `keyword.control.sdevice` | 蓝 `#569CD6` |
| subSection | `entity.name.type.sdevice` | `entity.name.type` | 青绿 `#4EC9B0` |
| sectionKeyword | `entity.name.tag.sdevice` | `entity.name.tag.sdevice` | 蓝 `#569CD6` |
| macro | `variable.other.constant.preprocessor` | `variable.other.constant.preprocessor` | 浅蓝 `#9CDCFE` |

#### 1.4 宏引用匹配

在预处理器 repository 中添加宏引用规则：

```json
{
  "match": "\\b([A-Z][A-Z0-9_]{2,})\\b",
  "name": "variable.other.constant.preprocessor.tcl"
}
```

规则优先级：放在兜底标识符之前，字符串/注释之后。仅匹配 3+ 字符的全大写标识符以减少误匹配（如 `SRH` 会被匹配，但 `X` 不会）。

### 二、SDE TextMate 增强

#### 2.1 #define 宏名 scope

将当前的整体预处理器规则拆分为 captures：

```json
{
  "name": "meta.preprocessor.define.sde",
  "match": "^\\s*(#\\s*define)\\b\\s+(\\w+)(\\s+.*)?$",
  "captures": {
    "1": { "name": "keyword.control.preprocessor.sde" },
    "2": { "name": "variable.other.constant.preprocessor.sde" },
    "3": { "patterns": ["/* 字符串/关键词子匹配 */"] }
  }
}
```

#### 2.2 宏引用匹配

与 SDEVICE 相同的全大写标识符规则。

#### 2.3 userFunctionCall

**无法用 TextMate 解决**——需要 AST 分析才能知道哪些标识符是用户定义的函数。语义层保留此功能。

### 三、其他 Tcl 工具

为 sprocess、emw、inspect、svisual 添加宏引用匹配规则（与 SDEVICE 相同）。

### 四、语义层调整

#### 4.1 semanticTokenScopes 映射更新

```json
{
  "semanticTokenScopes": [
    {
      "language": "sdevice",
      "scopes": {
        "sectionName": ["keyword.control.sdevice"],
        "sectionKeyword": ["entity.name.tag.sdevice"],
        "subSection": ["entity.name.type.sdevice"],
        "macro": ["variable.other.constant.preprocessor"]
      }
    }
  ]
}
```

变更：`subSection` 的映射从 `entity.name.type` 改为 `entity.name.type.sdevice`，与 TextMate scope 精确匹配。实际效果不变（VSCode scope 匹配是最长前缀匹配）。

#### 4.2 语义层可简化的部分

TextMate 增强 **不能** 替代的语义功能（保留）：
- 上下文感知关键词匹配（同一关键词在不同 section 中高亮不同）
- SDE userFunctionCall
- 所有需要 AST 的功能

TextMate 增强 **可以替代** 的部分（后续评估是否移除）：
- subSection 基础高亮（begin/end 嵌套已覆盖）
- sectionName 基础高亮
- 宏定义/引用的基础高亮

**本次不移除语义层功能**——仅确保 TextMate 层的覆盖率和 scope 一致性。后续可以逐步评估移除。

## 影响范围

| 文件 | 改动类型 |
|------|---------|
| `syntaxes/sdevice.tmLanguage.json` | 重构为 begin/end 嵌套 |
| `syntaxes/sde.tmLanguage.json` | 增强 #define captures + 宏引用 |
| `syntaxes/sprocess.tmLanguage.json` | 添加宏引用规则 |
| `syntaxes/emw.tmLanguage.json` | 添加宏引用规则 |
| `syntaxes/inspect.tmLanguage.json` | 添加宏引用规则 |
| `syntaxes/svisual.tmLanguage.json` | 添加宏引用规则 |
| `package.json` | semanticTokenScopes 微调 |

## 风险

1. **TextMate 嵌套性能**：begin/end 递归嵌套可能增加解析开销。缓解：VSCode 的 TextMate 引擎经过优化，SDEVICE 文件通常不超过数千行。
2. **语法错误容错**：缺少 `}` 的文件可能导致 begin/end 不配对，影响后续高亮。缓解：添加 fallback 规则。
3. **宏引用误匹配**：全大写标识符规则可能匹配非宏的大写常量（如 `SRH`、`FN`）。这是可接受的——这些在语义上也是常量标识符。
4. **关键词列表维护**：TextMate 中的关键词列表是静态的，不与 sdevice_command_docs.json 自动同步。后续可考虑自动化脚本。

## 不在范围内

- SDE userFunctionCall 的 TextMate 实现（不可能）
- 完全移除语义层（本次仅确保一致性）
- 自动从 docs.json 生成 TextMate 关键词列表（可后续优化）
- hover 标题的颜色对齐（保留 `**text**` 格式，不改 HTML）
