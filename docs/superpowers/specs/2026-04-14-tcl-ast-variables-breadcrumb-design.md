# Tcl AST 级变量提取与面包屑导航设计

日期：2026-04-14

## 背景

当前 Tcl 变量提取（`definitions.js`）使用正则扫描，无法正确处理跨行、嵌套等复杂场景。同时项目缺少 `DocumentSymbolProvider`，导致 VSCode 面包屑栏和 Outline 面板对 4 种 Tcl 工具（sdevice、sprocess、emw、inspect）无任何结构化导航支持。

## 目标

1. 将 Tcl 变量提取从正则升级为 AST 级解析，提高准确性
2. 新增 `DocumentSymbolProvider`，为 4 种 Tcl 工具提供面包屑导航和 Outline 视图
3. 遵循项目已有的"4 语言共用 Tcl AST 框架"架构模式

## 方案选择

**方案 A（已选择）：单一 AST 通道**

所有 Tcl 语义功能统一走 `tcl-ast-utils.js` 的 AST 解析，废弃 `definitions.js` 中的 Tcl 正则提取。

选择理由：
- WASM 解析器已在 `activate()` 中初始化，folding provider 已完全依赖它
- `definitions.js` 的 Tcl 正则只在 `getDefinitions()` 中被调用，替换影响面小
- 与项目"4 语言共用"架构模式一致

## 设计细节

### 1. AST 级变量提取

**位置**：`src/lsp/tcl-ast-utils.js` 新增 `getVariables(root)` 函数

遍历 AST 中所有 `command` 节点，检查第一个子节点（`simple_word`）的文本：

| 命令 | 提取内容 | 识别方式 |
|------|---------|---------|
| `set varName value` | `varName` | 第 1 子节点是 "set"，第 2 子节点文本 |
| `proc name {args} {body}` | `name` + 参数列表中的变量 | 第 1 子节点是 "proc"，第 2 子节点文本 |
| `foreach varList ...` | 循环变量 | 第 1 子节点是 "foreach"，第 2 子节点解析 |
| `for init condition step body` | init 中的 set 变量 | 第 1 子节点是 "for"，解析 init 部分 |

返回格式（兼容现有接口）：
```js
{ name: string, line: number, endLine: number, definitionText: string, kind: 'variable' | 'function' | 'parameter' }
```

新增 `kind` 字段区分变量类型，面包屑和 Outline 可据此分配图标。`proc` 参数作为 `parameter` 类型，独立于 proc 本身的 `function` 类型。`$varName` 引用不提取（只提取定义，不提取使用）。

### 2. 工具特有 Section 关键词配置

**新文件**：`src/lsp/tcl-symbol-configs.js`

按语言 ID 提供 section 关键词集合，用于识别"哪个 command 是工具特有的 section 块"。

```js
const SECTION_KEYWORDS = {
    sdevice: new Set(['File', 'Device', 'Electrode', 'Physics', 'Math', 'Plot', 'Solve', 'System', ...]),
    sprocess: new Set(['machine', 'deposit', 'etch', 'diffuse', 'implant', 'mask', ...]),
    emw: new Set([...]),
    inspect: new Set([...]),
};

function getSectionKeywords(langId) { ... }
function isSectionCommand(commandName, langId) { ... }
```

- 关键词集合模块加载时构建一次，运行时 O(1) 查找
- 初期手动从 `all_keywords.json` 提取，后续可加脚本自动生成
- 未知 langId 返回空集合，优雅降级

### 3. DocumentSymbolProvider 与面包屑导航

**新文件**：`src/lsp/providers/tcl-document-symbol-provider.js`

注册方式：与 folding provider 相同，4 语言循环注册。

符号层级结构：

```
📁 File                   ← Namespace (工具 section)
📁 Device                 ← Namespace
  📁 Electrode            ← Namespace (嵌套在 Device 内)
  📁 Physics              ← Namespace
    🔧 Mobility(...)      ← Method (section 内的子命令)
🔧 myProc                 ← Function (proc 定义)
📦 myVar                  ← Variable (set 变量)
```

实现逻辑：
1. 遍历 AST 所有 `command` 节点
2. 判断 command 第一个子节点文本：
   - `proc` → `SymbolKind.Function`，body 内递归搜索子符号
   - `set`/`foreach`/`for` → `SymbolKind.Variable`
   - `isSectionCommand(name, langId)` 匹配 → `SymbolKind.Namespace`，braced_word 内递归
   - `foreach`/`for`/`while` → `SymbolKind.Namespace`（控制结构块），内部递归
   - 非匹配的普通 command 忽略
3. 嵌套关系通过 AST 的 `braced_word` 子节点自然获得

VSCode 面包屑栏自动消费 `DocumentSymbolProvider` 输出，无需额外配置。

### 4. definitions.js 改造

Tcl 变量提取从正则切换到 AST，Scheme 部分不变。

```js
const tclAstUtils = require('./lsp/tcl-ast-utils');

// extractTclDefinitions() 标记 @deprecated，保留不删
function extractTclDefinitionsAst(text) {
    const tree = tclAstUtils.parseSafe(text);
    if (!tree) return [];
    try {
        return tclAstUtils.getVariables(tree.rootNode);
    } finally {
        tree.delete();
    }
}

function getDefinitions(document, langId) {
    // ... 缓存逻辑不变 ...
    if (SCHEME_LANGS.has(langId)) {
        definitions = extractSchemeDefinitions(document.getText());
    } else if (TCL_LANGS.has(langId)) {
        definitions = extractTclDefinitionsAst(document.getText());
    }
    // ...
}
```

- 补全 provider 和 hover provider 无需修改——它们只调用 `defs.getDefinitions()`
- WASM 未就绪时返回空数组（初始化通常 1-2 秒内完成）

### 5. 测试策略

**新文件**：`tests/test-tcl-document-symbol.js`

使用 mock 节点，不依赖 WASM 运行时（与现有 `test-tcl-ast-utils.js` 一致）。

测试用例：

| 测试组 | 用例 |
|--------|------|
| 变量提取 | `set x 42`、跨行 set、foreach 循环变量、proc 名+参数、for init 变量、$varName 引用不提取 |
| Symbol 构建 | section 含子命令、proc 内嵌套 foreach、无 section 匹配时忽略普通命令、工具特有 section 区分 |
| 降级 | WASM 未就绪返回空数组 |

现有 `tests/test-definitions.js` 的 Tcl 用例需更新预期结果。

回归验证：用 `display_test/testbench_des.cmd` 在 Extension Development Host 中验证面包屑和 Outline 面板。

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| `src/lsp/tcl-ast-utils.js` | 修改：新增 `getVariables(root)` |
| `src/lsp/tcl-symbol-configs.js` | 新增：工具 section 关键词配置 |
| `src/lsp/providers/tcl-document-symbol-provider.js` | 新增：DocumentSymbolProvider |
| `src/definitions.js` | 修改：Tcl 路径切换到 AST |
| `src/extension.js` | 修改：注册 DocumentSymbolProvider |
| `tests/test-tcl-document-symbol.js` | 新增：Symbol 和变量提取测试 |
| `tests/test-definitions.js` | 修改：更新 Tcl 用例预期结果 |
