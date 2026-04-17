# SDE 符号索引与语义分析设计（Phase 3 MVP）

## 概述

为 SDE (Scheme) 语言建立 Region/Material/Contact 三类符号的索引系统，实现：
1. **语义诊断**：引用未定义的 region/material/contact 时显示黄色波浪线警告
2. **符号补全**：在需要符号名称的参数位置提供已定义符号的补全
3. **Find All References**：查找某个符号在文档中所有定义和引用位置

### 范围限制

**MVP 仅覆盖**：Region、Material、Contact 三类符号实体。

**不做**：
- Constant-profile、Refinement-size、Refeval-window、Placement 等符号类型（留作后续迭代）
- Rename Symbol（留作后续迭代）
- 跨文件符号索引（SDE 工作流通常在单文件中完成）

## 架构

### 新增文件

```
src/lsp/
├── symbol-index.js               # 符号提取引擎（AST 遍历 + 声明式配置）
└── providers/
    ├── region-undef-diagnostic.js # Region/Material/Contact 未定义诊断
    └── symbol-completion.js       # 符号补全 Provider
    └── symbol-reference-provider.js # Find All References Provider
```

### 修改文件

- `syntaxes/sde_function_docs.json` — 为每个相关 API 增加 `symbolParams` 字段
- `src/extension.js` — 注册新 Provider
- `src/lsp/parse-cache.js` — 缓存符号索引结果（可选，也可在 Provider 内惰性计算）

### 数据流

```
AST (scheme-parser)
  → symbol-index.js (提取 defs + refs)
    → region-undef-diagnostic.js (对比 → 诊断)
    → symbol-completion.js (过滤 → 补全)
    → symbol-reference-provider.js (匹配 → references)
```

## 核心组件设计

### 1. 声明式参数映射表（symbolParams）

在 `sde_function_docs.json` 中为每个相关 API 增加 `symbolParams` 字段，声明参数的符号角色：

```json
"sdegeo:create-rectangle": {
  "symbolParams": [
    { "index": 2, "role": "ref", "type": "material" },
    { "index": 3, "role": "def", "type": "region" }
  ]
}
```

**字段说明**：
- `index`：参数在函数参数列表中的位置（0-based，不含函数名）
- `role`：`"def"` 表示定义符号，`"ref"` 表示引用符号
- `type`：符号类型，MVP 阶段为 `"region"` | `"material"` | `"contact"`

**需要配置的 API 列表**（约 50 个函数）：

#### Region 定义（def）
- `sdegeo:create-rectangle` [3], `sdegeo:create-circle` [3], `sdegeo:create-polygon` [3]
- `sdegeo:create-cuboid` [3], `sdegeo:create-cylinder` [3], `sdegeo:create-cone` [3]
- `sdegeo:create-ellipse` [3], `sdegeo:create-ellipsoid` [3], `sdegeo:create-sphere` [3]
- `sdegeo:create-torus` [3], `sdegeo:create-triangle` [3], `sdegeo:create-prism` [3]
- `sdegeo:create-pyramid` [3], `sdegeo:create-ruled-region` [3], `sdegeo:create-reg-polygon` [3]
- `sdegeo:create-ot-sphere` [3], `sdegeo:create-ot-ellipsoid` [3]
- `sde:add-material` [2], `sdepe:add-substrate` [region-name], `sdepe:depo` [region-name]
- `sdepe:fill-device` [region-name], `sdeicwb:create-boxes-from-layer` [region-name]

#### Region 引用（ref）
- `sde:hide-region` [0], `sde:show-region` [0], `sde:xshow-region` [0]
- `sdedr:define-refinement-region` [2], `sdedr:define-constant-profile-region` [2]
- `sdedr:offset-block` [0], `sdepe:doping-constant-placement` [region-name]
- `sdepe:remove` [region-name], `sdeicwb:define-refinement-from-layer` [region]

#### Material 定义（def）
- `sdegeo:create-rectangle` [2], `sdegeo:create-circle` [2]
- （其他 create-* 系列同理，material 参数在 region 之前）
- `sde:merge-materials` [newmaterial]

#### Material 引用（ref）
- `sde:hide-material` [0], `sde:show-material` [0], `sde:xshow-material` [0]
- `sde:set-default-material` [0], `sde:material-type` [0]
- `sdedr:define-refinement-material` [2], `sdedr:define-constant-profile-material` [2]
- `sdepe:etch-material` [material], `sdepe:polish-device` [material]

#### Contact 定义（def）
- `sdegeo:define-contact-set` [0], `sdegeo:define-3d-contact-by-polygon` [contact-name]

#### Contact 引用（ref）
- `sdegeo:set-contact` [1], `sdegeo:set-contact-edges` [contact-set-name]
- `sdegeo:set-contact-faces-by-polygon` [contact-set-name]
- `sdegeo:delete-contact-set` [0]
- `sdegeo:get-contact-edgelist` [0], `sdegeo:get-contact-facelist` [0]
- `sde:hide-contact` [0], `sde:show-contact` [0], `sde:xshow-contact` [0]
- `sdegeo:set-current-contact-set` [csName]
- `sdegeo:rename-contact` [oldContName, newContName]

> **注意**：上述 `[N]` 表示参数索引（0-based）。实际配置时需要对照每个函数的完整参数列表确认精确位置。部分 API 的 modeDispatch 会影响参数偏移（如 `sdedr:offset-interface` 的 region/material 模式），需要与 mode 分派结果协同处理。

### 2. symbol-index.js — 符号提取引擎

#### 输入

```js
/**
 * @param {object} ast - scheme-parser 生成的 AST (Program 节点)
 * @param {string} sourceText - 源文本（用于提取字符串值）
 * @param {object} symbolParamsTable - 函数名 → symbolParams 的映射表
 * @param {object} [modeDispatchTable] - 可选，用于处理带模式分派的函数
 * @returns {{ defs: SymbolEntry[], refs: SymbolEntry[] }}
 */
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable)
```

#### 输出

```js
// SymbolEntry
{
  name: "R.Si",           // 符号名称字符串
  type: "region",         // "region" | "material" | "contact"
  role: "def",            // "def" | "ref"
  line: 15,               // 行号（1-based）
  start: 42,              // 字符起始偏移
  end: 47,                // 字符结束偏移
  functionName: "sdegeo:create-rectangle"  // 来源函数
}
```

#### 核心算法

```
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable):
  defs = [], refs = []

  walk(node):
    if node.type == 'List':
      ec = effectiveChildren(node)
      if ec.length >= 1 && ec[0].type == 'Identifier':
        funcName = ec[0].value
        params = symbolParamsTable[funcName]
        if params:
          // 处理 modeDispatch 影响的参数偏移
          adjustedParams = adjustForMode(funcName, ec, params, modeDispatchTable)
          for each { index, role, type } in adjustedParams:
            argNode = ec[index + 1]  // +1 跳过函数名
            if argNode:
              name = resolveSymbolName(argNode)
              if name:
                (role == 'def' ? defs : refs).push({ name, type, role, ... })

      for child in node.children: walk(child)
    else if node.type == 'Program':
      for child in node.body: walk(child)
    else if node.type == 'Quote':
      walk(node.expression)

  walk(ast)
  return { defs, refs }
```

#### resolveSymbolName — 字符串值提取

```js
function resolveSymbolName(node):
  if node.type == 'String':
    return node.value  // 直接返回字符串值
  if node.type == 'List':
    ec = effectiveChildren(node)
    if ec[0].type == 'Identifier' && ec[0].value == 'string-append':
      parts = []
      for i from 1 to ec.length:
        if ec[i].type == 'String':
          parts.push(ec[i].value)
        else:
          return null  // 包含非字面量，无法静态推断
      return parts.join('')
  return null  // 其他情况（变量引用、复杂表达式等）
```

#### modeDispatch 参数偏移处理

部分函数（如 `sdedr:offset-interface`、`sdedr:define-refinement-function`）的参数语义取决于模式关键词。需要复用 `semantic-dispatcher.js` 的 `resolveMode` 逻辑来确定实际模式，再查 `modeDispatch.modes[mode].params` 来确定参数的实际含义。

对于有 modeDispatch 的函数，`symbolParams` 中的 `index` 应指向 **mode 调整后的参数列表**（即 `modeData.params` 数组中的索引）。

### 3. region-undef-diagnostic.js — 语义诊断 Provider

#### 注册

在 `extension.js` 中独立注册，使用单独的 `DiagnosticCollection`（名称如 `"sde-symbol-diagnostics"`），与现有 `"sde-undef-vars"` 诊断共存。

#### 工作流程

```
onDidChangeTextDocument (debounced 300ms):
  1. schemeCache.get(document) → { ast, lineStarts }
  2. extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable)
  3. 构建 definedNames 集合：Set(`${type}:${name}`)
  4. 遍历 refs，检查 `${type}:${name}` 是否在 definedNames 中
  5. 不在 → 生成 Diagnostic（severity: Hint，黄色波浪线）
  6. diagnosticCollection.set(document.uri, diagnostics)
```

#### 诊断消息

- `Region 'R.Sil' 未定义`
- `Material 'SiliconOxide' 未定义`
- `Contact 'Gat' 未定义`

#### severity 选择

使用 `vscode.DiagnosticSeverity.Hint`（浅灰色下划线）或 `Information`（蓝色下划线），避免与现有 `Warning`（黄色）冲突。具体选择可根据测试效果调整。

### 4. symbol-completion.js — 符号补全 Provider

#### 注册

在 `extension.js` 中为 `sde` 语言注册 `CompletionItemProvider`，触发字符为 `"`。

#### 工作流程

```
provideCompletionItems(document, position):
  1. schemeCache.get(document) → { ast, lineStarts }
  2. dispatcher.dispatch(ast, line, col, modeDispatchTable, lineStarts)
  3. 如果当前 functionName 有 symbolParams 配置
     且 activeParam 对应的参数需要符号补全
  4. extractSymbols → 取 defs 集合
  5. 过滤匹配 type 的定义，去重
  6. 返回 CompletionItem[]
```

#### 补全项格式

```js
{
  label: "R.Si",
  kind: vscode.CompletionItemKind.Reference,
  detail: "Region — defined line 15",
  insertText: "R.Si",  // 不含引号，VSCode 自动处理引号配对
}
```

#### 去重

同名定义只出现一次，detail 中列出所有定义行号（如 `"Region — defined lines 15, 42"`）。

### 5. symbol-reference-provider.js — Find All References

#### 注册

在 `extension.js` 中为 `sde` 语言注册 `ReferenceProvider`。

#### 工作流程

```
provideReferences(document, position, context):
  1. 获取光标处的符号名称（需处理字符串内的位置）
  2. extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable)
  3. 遍历所有 defs 和 refs，匹配 name + type
  4. 返回 Location[] 数组
```

#### 光标处符号名提取

```js
function getSymbolAtPosition(ast, line, column, lineStarts):
  // 遍历 AST 找到包含光标位置的 String 节点
  // 返回 { name, type } 或 null
```

## 测试策略

### 单元测试

- `test-symbol-index.js` — 测试符号提取引擎
  - 各 create-* 函数的 region/material 定义提取
  - string-append 静态拼接
  - 动态名称（变量引用）的跳过
  - modeDispatch 函数的参数偏移处理
  - 注释节点干扰的鲁棒性

- `test-region-undef-diagnostic.js` — 测试诊断逻辑
  - 未定义 region → 诊断
  - 已定义 region → 无诊断
  - 同名 region 多次定义 → 无诊断
  - string-append 定义后引用 → 无诊断

- `test-symbol-completion.js` — 测试补全过滤
  - 已定义 region 的补全
  - 按 type 过滤（region 参数不显示 material 候选）

- `test-symbol-reference.js` — 测试引用查找
  - 精确匹配
  - 多定义多引用的完整列表

## 未来工作

以下功能留作后续迭代：

1. **更多符号类型**：Constant-profile definition-name、Refinement-size definition-name、Refeval-window rfwin-name、Placement refinement-name
2. **Rename Symbol**：基于符号索引实现安全的符号重命名
3. **跨文件符号索引**：支持 `sde:load` 引入的外部文件中的定义
4. **拼写建议**：对未定义符号提供相似名称的快速修复建议
5. **符号大纲（Document Symbol）**：在 Outline 视图中显示 region/material/contact 层级
6. **CodeLens**：在符号定义处显示引用计数
