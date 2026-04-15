# 未定义变量检测诊断 — 设计文档

**日期**：2026-04-15
**状态**：待审批
**关联**：CLAUDE.md § 架构 / 未来工作

---

## 目标

为 Sentaurus TCAD VSCode 扩展添加未定义变量检测功能。当用户在代码中引用了一个从未定义的变量时，在编辑器中显示黄色波浪线（Warning 级别诊断），帮助用户在运行前发现拼写错误和遗漏定义。

## 范围

- **语言覆盖**：Tcl 4 方言（sdevice、sprocess、emw、inspect）+ SDE (Scheme)，共 5+1 种语言（含 svisual）
- **检测目标**：仅用户自定义变量（`set`/`proc`/`define`/`let` 等定义的变量）
- **不检测**：内置命令（`sdegeo:create-sphere` 等）、SWB 参数（`@var@`）
- **误报控制**：处理 `global`/`upvar`/`variable` 等跨作用域机制，提供 Sentaurus 隐式变量白名单

## 方案选择

**选定方案 A：独立诊断模块**

| 方案 | 描述 | 优点 | 缺点 | 决策 |
|------|------|------|------|------|
| A — 独立诊断模块 | 新建 `undef-var-diagnostic.js`，扩展 AST 工具层 | 职责清晰，复用现有基础设施 | 需扩展 AST 工具层 | **选定** |
| B — 集成到 definitions.js | 在现有模块中增加引用检测 | 变量定义和检测在同一处 | definitions.js 职责膨胀，与 AST 耦合 | 否决 |
| C — 纯正则匹配 | 不用 AST，正则 + 行号比较 | 实现最简单 | 误报多，无法处理作用域 | 否决 |

## 整体架构

### 文件结构

```
src/lsp/
├── tcl-ast-utils.js              ← 扩展：新增 getVariableRefs()、buildScopeMap()
├── scope-analyzer.js              ← 扩展：新增 getSchemeRefs() 收集标识符引用
├── providers/
│   ├── tcl-bracket-diagnostic.js  ← 已有：括号诊断（参考模式）
│   └── undef-var-diagnostic.js    ← 新增：未定义变量诊断
```

### 数据流

```
文档变更 → 防抖(500ms) → updateDiagnostics(document)
    │
    ├── Tcl 方言 → parseSafe(text)
    │               ├─ getVariables(root)           → 定义集
    │               ├─ getVariableRefs(root)        → 引用集
    │               └─ buildScopeMap(root)          → 行→可见变量
    │
    └── SDE (Scheme) → 手写解析器
                        ├─ extractSchemeDefinitions()    → 定义集
                        ├─ scope-analyzer.buildScopeTree() → 作用域树
                        └─ getSchemeRefs()               → 引用集
    │
    └→ 对比 引用 vs 可见定义 → 生成 vscode.Diagnostic[]
        └→ DiagnosticCollection.set(uri, diagnostics)
```

## Tcl 方言变量检测

### 引用收集 (`getVariableRefs`)

tree-sitter-tcl AST 中的 `$varName` 被解析为 `variable_ref` 节点。

**算法：**
1. `walkNodes(root)` DFS 遍历 AST
2. 收集 `variable_ref` 类型的节点
3. 提取变量名（去除 `$` 前缀）、行列位置
4. 跳过注释节点内的引用

### 作用域映射 (`buildScopeMap`)

构建行号→可见变量集的映射，支持嵌套 proc 作用域。

**数据结构：**
```javascript
// 返回：Map<行号, Set<变量名>>
// proc 内部：参数 + set 定义 + global/upvar/variable 引入
```

### 跨作用域机制处理

| 机制 | 语法 | 处理方式 |
|------|------|----------|
| `global` | `global varName` | 将全局变量标记为当前作用域可见 |
| `upvar` | `upvar ?level? otherVar myVar` | 将 `myVar` 标记为当前作用域可见 |
| `variable` | `variable varName ?value?` | 将命名空间变量标记为可见 |
| `foreach` | `foreach var list body` | 循环变量在 body 内可见 |
| `for` | `for init condition step body` | init 中 set 定义的变量在循环体内可见 |
| `proc` 参数 | `proc name {args} body` | 参数在 body 内可见 |
| `lappend` | `lappend varName ?value?` | 如果 varName 未定义则隐式创建，标记为定义 |
| `append` | `append varName ?value?` | 同 lappend |

### 示例

```tcl
set global_var 1              ; 全局作用域可见 global_var

proc myProc {arg1 arg2} {    ; proc 作用域开始
    global global_var          ; global 声明 → 引入 global_var
    upvar 1 outer_var local   ; upvar 声明 → 引入 local
    variable ns_var           ; variable 声明 → 引入 ns_var

    set local_var [expr {$arg1 + $arg2}]  ; 定义 local_var
    puts $global_var           ; ✓ 可见
    puts $local_var            ; ✓ 可见
    puts $undefined_ref        ; ✗ 未定义 → Warning
}

puts $global_var               ; ✓ 可见（全局作用域）
puts $local_var                ; ✗ 不在作用域 → Warning
```

## Scheme (SDE) 变量检测

### 现有基础设施

- `scope-analyzer.js`：`buildScopeTree(ast)` 构建作用域树，`getVisibleDefinitions(tree, line)` 获取指定行可见定义
- `definitions.js`：`extractSchemeDefinitions()` 提取 define/let 绑定

### 新增：引用收集

Scheme 变量引用无 `$` 前缀，任何标识符都可能是引用。需排除：

1. **SDE 内置函数**：`sdegeo:create-sphere` 等（已在 `all_keywords.json`）
2. **Scheme 内置函数**：`+`、`-`、`car`、`cdr` 等（已在 `scheme_function_docs.json`）
3. **特殊形式**：`define`、`lambda`、`if`、`cond`、`let` 等
4. **字符串/注释**：跳过

**过滤策略**：合并 SDE 关键词 + Scheme 内置函数 + 特殊形式为已知名称集合。标识符不在集合中且不在作用域内可见 → 报 Warning。

### 作用域规则

| 构造 | 作用域行为 |
|------|-----------|
| `(define x val)` | x 在定义后全局可见 |
| `(define (f args) body)` | f 全局可见，args 在 body 内可见 |
| `(let ((x 1)) body)` | x 在 body 内可见 |
| `(let* ((x 1) (y x)) body)` | x 在 y 的绑定中就可见 |
| `(letrec ((f expr)) body)` | f 在 expr 和 body 中都可见 |
| `(lambda (args) body)` | args 在 body 内可见 |
| `(set! x val)` | 不引入新定义，x 必须已定义 |

## 白名单

### Tcl 隐式变量

Sentaurus 工具链运行时自动注入的变量：

```javascript
const TCL_BUILTIN_VARS = new Set([
    'DesName',
    'Pwd',
    'Pd',
    'ProjDir',
    'Tooldir',
    'env',            // env() 数组
    // 后续从实际 .cmd 文件和文档中补充
]);
```

### Scheme 隐式变量

```javascript
const SCHEME_BUILTIN_VARS = new Set([
    'argc', 'argv',
    // 后续补充
]);
```

### 白名单维护策略

- 初始版本硬编码在模块内
- 后续可通过 VSCode 设置 `sentaurus.builtinVariables` 让用户扩展

## 诊断模块接口

### `undef-var-diagnostic.js`

```javascript
module.exports = { activate, checkTclUndefVars, checkSchemeUndefVars, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };

/**
 * 注册未定义变量诊断
 * @param {vscode.ExtensionContext} context
 */
function activate(context) { ... }

/**
 * 更新单个文档的诊断（内部分派到 Tcl/Scheme 检测）
 * @param {vscode.TextDocument} document
 */
function updateDiagnostics(document) { ... }

/**
 * Tcl 未定义变量检测
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkTclUndefVars(text) { ... }

/**
 * Scheme 未定义变量检测
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeUndefVars(text) { ... }
```

### 诊断消息格式

```javascript
new vscode.Diagnostic(
    range,                                    // 引用位置
    `未定义的变量: ${varName}`,                 // 消息（中文）
    vscode.DiagnosticSeverity.Warning         // 黄波浪线
)
```

## 性能考虑

| 策略 | 说明 |
|------|------|
| 防抖 | 500ms，与括号诊断一致 |
| 缓存 | 复用 `definitions.js` 的 `getDefinitions()` 缓存（基于 document.version） |
| AST 复用 | 同一次 `updateDiagnostics` 中共享一次 `parseSafe()` 结果 |
| 增量分析 | 暂不做，每次全量分析（文件通常 < 1000 行，性能可接受） |

## 测试策略

- **Tcl 单元测试**：
  - `tests/test-tcl-var-refs.js` — `getVariableRefs()` 测试（mock AST 节点）
  - `tests/test-tcl-scope-map.js` — `buildScopeMap()` 测试（mock AST 节点）
  - 不依赖 WASM 运行时
- **Scheme 单元测试**：
  - `tests/test-scheme-var-refs.js` — `getSchemeRefs()` 测试
  - `tests/test-scheme-undef-diagnostic.js` — Scheme 未定义变量检测集成测试
- **手动测试**：在 Extension Development Host 中打开示例 `.cmd` 文件验证

## 注册方式

在 `src/extension.js` 的 `activate()` 函数中，与括号诊断并列注册：

```javascript
const undefVarDiagnostic = require('./lsp/providers/undef-var-diagnostic');
undefVarDiagnostic.activate(context);
```

覆盖所有 6 种语言（sde + sdevice + sprocess + emw + inspect + svisual）。
