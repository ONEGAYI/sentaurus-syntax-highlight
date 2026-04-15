# SDE 重复定义黄色警告

## 目标

在 SDE（Scheme）语言中，当同一作用域内多次 `define` 同一个变量名时，显示黄色警告（`DiagnosticSeverity.Warning`）。首次定义正常显示，后续重复定义标黄，提示消息包含首次定义的行号。

## 需求

- **检测范围**：所有作用域（全局、函数体、lambda 体、let 体等），在各自作用域内独立检测
- **检测形式**：
  - `(define var val)` — 变量定义
  - `(define (func args) body)` — 函数定义（只检查函数名，不检查参数）
  - `let/let*/letrec` 绑定列表中的重复变量名
- **警告行为**：仅警告后续重复定义，首次定义不标记
- **跨作用域同名**：不报告（shadowing 是 Scheme 的正常模式）

## 实现方案：扩展现有 Provider（方案 C）

在 `undef-var-diagnostic.js` 中新增 `checkSchemeDuplicateDefs` 函数，复用已有的 `scopeTree` 和 `diagnosticCollection`。

### 数据流

```
buildScopeTree(ast) → scopeTree
                         │
        ┌────────────────┤
        ▼                ▼
getVisibleDefinitions  checkDuplicateDefs
        │                │
        ▼                ▼
  未定义变量警告     重复定义警告（黄色）
        │                │
        └─────┬──────────┘
              ▼
     diagnosticCollection.set(uri, [...合并所有诊断])
```

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/lsp/scope-analyzer.js` | `buildScopeTree` 的 definitions 增加 `line` 字段 |
| `src/lsp/providers/undef-var-diagnostic.js` | 新增 `checkSchemeDuplicateDefs`，重构 `updateDiagnostics` |
| `tests/test-scheme-dup-def-diagnostic.js` | 新增测试文件 |

### 详细改动

#### 1. `scope-analyzer.js` — buildScopeTree 增加 line 信息

当前 `scope.definitions.push({ name, kind })` 不含行号。改为 `{ name, kind, line }`，从 AST 节点的 `node.line` 获取。

涉及位置：
- `define` 变量绑定：`children[1].value` 处，取 `listNode.line`
- `define` 函数绑定：`children[1].children[0].value` 处，取 `listNode.line`
- `define` 函数参数：各参数节点，取 `listNode.line`
- `let/let*/letrec` 绑定：各绑定变量，取 `listNode.line`

#### 2. `undef-var-diagnostic.js` — 新增 checkSchemeDuplicateDefs

函数签名：`checkSchemeDuplicateDefs(scopeTree)` → `Diagnostic[]`

逻辑：
1. 递归遍历 scopeTree 的每个 scope
2. 对每个 scope 的 `definitions` 数组，用 `Map` 跟踪已见过的变量名
3. 遇到重复时，创建 `Diagnostic`（severity: Warning, source: 'dup-def'）
4. 返回所有重复定义诊断

警告消息格式：`重复定义: '变量名' 已在第 N 行定义（当前作用域: 类型）`

#### 3. `undef-var-diagnostic.js` — 重构 updateDiagnostics

当前 `checkSchemeUndefVars` 内部构建 scopeTree 后丢弃。重构为：
- `checkSchemeUndefVars` 改为接收 scopeTree 参数（或返回 scopeTree 供复用）
- `updateDiagnostics` 中对 SDE 语言先构建 scopeTree，再分别调用两个检查函数
- 合并结果传给 `diagnosticCollection.set()`

#### 4. 测试覆盖

新增 `tests/test-scheme-dup-def-diagnostic.js`，覆盖场景：
- 全局作用域重复 `(define x 1) (define x 2)`
- 函数体作用域重复 `(define (f) (define a 1) (define a 2))`
- let 绑定列表重复 `(let ((x 1) (x 2)) ...)`
- 不同作用域同名不报告（shadowing）
- 正常不重复的定义不报告
