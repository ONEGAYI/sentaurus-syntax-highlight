# #define 预处理变量语义支持设计

## 背景

SWB (Sentaurus Workbench) 的 `spp` 预处理器支持 `#define NAME VALUE` 宏定义，`spp` 在预处理阶段将后续代码中所有裸词 `NAME` 替换为 `VALUE`。当前扩展仅通过 TextMate 语法对 `#define` 关键词本身提供高亮（`keyword.control.preprocessor`），宏名和值无特殊着色，更没有定义提取、补全、hover、跳转、引用查找或未定义诊断。

### SWB #define 语法规范

来源：SWB User Guide (swb_ug.pdf) Appendix A #-Commands

- `#define NAME VALUE`：定义宏 NAME，spp 将后续裸词 NAME 替换为 VALUE。VALUE 可以是含空格/特殊字符的任意字符串
- `#define FLAG`：仅标志型（无 VALUE），配合 `#ifdef`/`#ifndef` 使用
- `#undef NAME`：取消已定义的宏
- `#ifdef NAME` / `#ifndef NAME`：条件编译，检查 NAME 是否已被 `#define`
- 引用方式为**裸词替换**（bare word），不是 `$NAME` 也不是 `@NAME@`
- 作用域：从定义行开始到文件结束（或 `#undef`），可通过 `#include`/`#includeext` 跨文件

### 与现有系统的关系

| 系统 | 定义语法 | 引用语法 | 作用域 |
|------|----------|----------|--------|
| Scheme `define` | `(define name val)` | AST 中标识符 | 词法作用域 |
| Tcl `set` | `set name val` | `$name` / `${name}` | 全局/proc 局部 |
| `#define` 宏 | `#define NAME val` | 裸词 NAME | 文件级，定义点→文件尾 |

## 目标

为 5 种 Tcl 工具（SDEVICE/SPROCESS/EMW/Inspect/Svisual）添加 `#define` 宏的完整语义支持：自动补全、Hover 文档、跳转定义、查找引用、未定义诊断、语义着色。SDE（Scheme）预留扩展接口，本次不实现。

## 方案

**pp-utils 扩展 + 文本扫描**。在现有 `pp-utils.js` 中新增定义提取和引用检测函数，通过 `definitions.js` 统一分发到各 Provider。不修改 WASM 解析器或 AST 层。

选择理由：
- 与项目现有模式一致（pp-utils 是纯文本扫描）
- tree-sitter-tcl 将 `#` 行当注释处理，AST 中不含 `#define` 信息，文本扫描是唯一可行路径
- 改动集中，不影响 Tcl 变量/函数的现有逻辑

## 设计

### 1. 定义提取

**文件**：`src/lsp/pp-utils.js`

新增 `extractPpDefines(text)` 函数：

```javascript
function extractPpDefines(text) {
    const defines = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#\s*define\s+(\w+)(?:\s+(.*))?$/);
        if (match) {
            const rawValue = match[2];
            const value = rawValue !== undefined ? rawValue.trim() : '';
            defines.push({
                name: match[1],
                value,                              // 任意字符串，含空格/特殊字符
                line: i + 1,                        // 1-based
                endLine: i + 1,
                definitionText: lines[i].trim(),
                kind: 'ppDefine',
            });
        }
    }
    return defines;
}
```

新增 `extractPpUndefs(text)` 提取 `#undef` 信息，用于构建宏的存活区间（从 `#define` 行到 `#undef` 行）。

### 2. 裸词引用检测

**文件**：`src/lsp/pp-utils.js`

新增 `findPpDefineRefs(text, defines)` 函数。

#### 过滤规则

在全文中通过 `\bNAME\b` 匹配候选引用，逐个排除：

| 排除规则 | 理由 |
|----------|------|
| `#define NAME val` 中的 NAME（定义位置） | 定义不是引用 |
| `$NAME` / `${NAME}` | Tcl 变量引用，不是 #define |
| 双引号 `"..."` 内 | 字符串字面量 |
| 行注释 `# ...`（非预处理指令行） | 注释内容 |
| 定义行之前的匹配 | 宏尚未定义 |

#### 精确提取

`#ifdef NAME`、`#ifndef NAME`、`#undef NAME` 中的 NAME 不通过裸词正则，而是从指令行直接提取：

```javascript
const ifdefMatch = line.match(/^#\s*(?:ifdef|ifndef)\s+(\w+)/);
const undefMatch = line.match(/^#\s*undef\s+(\w+)/);
```

#### 存活区间

如果 `#define A 1` 在第 5 行，`#undef A` 在第 20 行，则只有第 5-20 行之间的裸词 `A` 是引用。`#undef` 之后的 `A` 不是引用。

### 3. Provider 集成

#### 3a. definitions.js

在 `extractTclDefinitionsAst` 中合并 `#define` 定义：

```javascript
function extractTclDefinitionsAst(text) {
    const results = [];
    results.push(...extractPpDefines(text));    // #define 定义
    const tree = tclAstUtils.parseSafe(text);
    if (tree) {
        try { results.push(...tclAstUtils.getVariables(tree.rootNode, text)); }
        finally { tree.delete(); }
    }
    return results;
}
```

通过 `getDefinitions()` 的缓存层，补全、hover、跳转定义自动覆盖 `#define`。

- 补全：`#define` 变量标记为 `CompletionItemKind.Constant`，detail 显示宏值
- Hover：显示 `#define NAME = VALUE`，复用 `truncateDefinitionText` 截断长值
- 跳转定义：定位到 `#define` 行

#### 3b. variable-reference-provider.js

在现有 Tcl 引用收集（`$varName`）后，追加 `findPpDefineRefs` 的裸词引用结果，合并去重。

#### 3c. undef-var-diagnostic.js

扫描 `#ifdef NAME` / `#ifndef NAME`，如果 NAME 不在 `extractPpDefines` 结果中，报 "undefined macro 'NAME'" 警告。

### 4. 语法高亮增强

**文件**：5 个 Tcl tmLanguage.json

将 `#define`、`#undef`、`#ifdef`/`#ifndef` 拆分为独立模式，为宏名分配 `variable.other.constant.preprocessor.tcl` scope：

```text
#define THICKNESS 0.1
^^^^^^^ keyword.control.preprocessor.tcl
        ^^^^^^^^^ variable.other.constant.preprocessor.tcl
                  ^^^ 数值/字符串（按现有规则）

#ifdef THICKNESS
^^^^^^^ keyword.control.preprocessor.tcl
        ^^^^^^^^^ variable.other.constant.preprocessor.tcl

#undef THICKNESS
^^^^^^ keyword.control.preprocessor.tcl
       ^^^^^^^^^ variable.other.constant.preprocessor.tcl
```

### 5. 语义着色（Semantic Tokens）

**文件**：提取共享逻辑 + 各 Tcl 工具的 semantic provider

#### Token 类型

在 `package.json` 的 `semanticTokenTypes` 新增：

```json
{ "id": "macro", "description": "Preprocessor macro reference" }
```

#### Token 分配

| 上下文 | Token 类型 | Modifier |
|--------|-----------|----------|
| `#define NAME` 中的 NAME | `macro` | `declaration` |
| `#undef NAME` 中的 NAME | `macro` | — |
| `#ifdef`/`#ifndef` 中的 NAME | `macro` | `readonly` |
| 代码中的裸词引用 | `macro` | — |

#### 共享模块

将 `#define` 的 semantic token 检测逻辑提取为独立函数（如 `buildPpDefineTokens(text, defines)`），返回 `SemanticToken[]`。

- **SDEVICE**：`sdevice-semantic-provider.js` 在逐行扫描时调用，与现有 section token 合并输出
- **其余 4 种 Tcl 工具**（SPROCESS/EMW/Inspect/Svisual）：当前没有 semantic provider，需要新增轻量级 `DocumentSemanticTokensProvider`，仅调用 `buildPpDefineTokens` 输出 `#define` 相关的 macro token。注册逻辑放在 `extension.js` 的 Tcl 语言激活路径中

### 6. 测试

**新增文件**：`tests/test-pp-define.js`

覆盖场景：

- **定义提取**：`#define NAME VALUE`、`#define FLAG`（无值）、含特殊字符/空格的 VALUE、多个定义、同名多次定义
- **引用检测**：`#ifdef`/`#ifndef`/`#undef` 精确提取、普通代码裸词引用、排除 `$NAME`、排除字符串内、排除定义前、`#undef` 后存活区间
- **Provider 集成**：`extractTclDefinitionsAst` 合并、Completion 类型为 Constant、Hover 显示
- **未定义诊断**：`#ifdef UNDEFINED_MACRO` 报警、已定义宏不报警

## 不涉及的变更

- 不修改 tree-sitter-tcl WASM
- 不修改 `tcl-ast-utils.js` 的 `buildScopeIndex` 逻辑
- 不实现 SDE（Scheme）的 `#define` 支持（预留接口）
- 不实现 `#set`/`#seth` 变量支持（独立系统，以 `@VAR@` 引用）
- 不实现跨文件 `#include`/`#includeext` 的宏可见性追踪
