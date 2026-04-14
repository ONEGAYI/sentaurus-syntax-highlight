# SDE LSP Phase 2 设计规范：定义分类与作用域感知

**日期**：2026-04-13
**状态**：已批准
**蓝图**：`docs/superpowers/plans/2026-04-13-sde-lsp-blueprint.md` Phase 2（2A + 2B）

## 目标

在 Phase 1 AST 基础设施之上，实现：
1. **定义分类（2A）**：区分函数定义和变量定义，补全列表显示不同图标
2. **作用域感知补全（2B）**：根据光标位置过滤可见定义，函数参数和 let 绑定在作用域内可见

**不在范围内**：模式分派（2C）、Signature Help、参数级补全——留作后续 Phase。

## 实施方案

**方案 B：扩展接口**。修改 `scheme-analyzer.js` 在定义输出中增加 `kind` 字段，`definitions.js` 透传，`extension.js` 利用 `kind` 和作用域信息改进补全。

选择理由：kind 信息在 definitions 层可用，hover/definition 等 provider 也能受益；职责划分清晰。

## 2A：定义分类

### 数据模型

在现有定义对象中增加 `kind` 字段：

```js
// 变量定义
{ name: "TboxTest", line: 5, endLine: 5, definitionText: "(define TboxTest 300)", kind: "variable" }

// 函数定义
{ name: "calc-mobility", line: 10, endLine: 15, definitionText: "(define (calc-mobility temp) ...)", kind: "function" }
```

### 判断逻辑

在 `scheme-analyzer.js` 的 `extractDefinitionsFromList` 中，检查 `listNode.children[1]` 的 AST 节点类型：

| `children[1]` 类型 | kind 值 | Scheme 模式 |
|-------------------|---------|-------------|
| `Identifier` | `"variable"` | `(define name value)` |
| `List` | `"function"` | `(define (name args...) body...)` |

### 改动文件

- `src/lsp/scheme-analyzer.js`：`extractDefinitionsFromList` 追加 `kind` 字段（+~10 行）
- `src/definitions.js`：无需改动（透传 `kind`）
- `src/extension.js`：补全提供器根据 `kind` 设置 `CompletionItemKind`（+~5 行）

## 2B：作用域分析

### 作用域树数据结构

```js
ScopeNode = {
  type: 'global' | 'function' | 'let',   // 作用域类型
  startLine: number,                      // 起始行（含）
  endLine: number,                        // 结束行（含）
  definitions: Array<{                    // 本作用域直接定义的符号
    name: string,
    kind: 'variable' | 'parameter'        // parameter 仅用于函数参数
  }>,
  children: ScopeNode[]                   // 嵌套子作用域
}
```

### 作用域树构建

单遍遍历 AST，规则如下：

1. **根节点**：创建 `type: 'global'` 作用域，`startLine = 0`，`endLine = Infinity`
2. **`(define (func-name params...) body...)`**：
   - 在全局作用域的 `definitions` 中记录 `func-name`（kind: `'variable'`，因为函数名本身是个值绑定）
   - 创建 `type: 'function'` 子作用域，将 `params` 中每个 `Identifier` 加入 `definitions`（kind: `'parameter'`）
   - 子作用域的 `startLine/endLine` 取自 AST 节点
3. **`(let/let*/letrec ((var val) ...) body...)`**：
   - 创建 `type: 'let'` 子作用域
   - 将绑定列表中每个 `var` 加入 `definitions`（kind: `'variable'`）
4. **嵌套**：子作用域挂为父节点的 `children`

### 查询接口

```js
/**
 * 获取指定行号处可见的所有定义。
 * 返回按作用域深度排序的定义列表（最内层优先）。
 * 同名定义：最内层覆盖外层。
 *
 * @param {ScopeNode} tree - 作用域树根节点
 * @param {number} line - 目标行号
 * @returns {Array<{name: string, kind: string, scopeType: string}>}
 */
function getVisibleDefinitions(tree, line)
```

查找算法：
1. 从根节点深度优先遍历
2. 找到包含 `line` 的最深作用域节点
3. 沿路径向上收集所有 `definitions`
4. 同名定义只保留最内层（最近定义）

### 缓存策略

与 `definitions.js` 一致——基于 `document.version` 的惰性缓存：

```js
let cachedVersion = -1;
let cachedTree = null;

function getScopeTree(document) {
    if (document.version === cachedVersion) return cachedTree;
    const { ast } = parse(document.getText());
    cachedTree = buildScopeTree(ast);
    cachedVersion = document.version;
    return cachedTree;
}
```

### 对 extension.js 补全提供器的改动

当前补全提供器（约行 276-300）的流程：
1. 获取所有关键词补全项
2. 获取所有用户定义补全项
3. 合并返回

修改后：
1. 获取所有关键词补全项
2. 获取所有用户定义补全项（现在包含 `kind` 字段）
3. 调用 `scope-analyzer.getVisibleDefinitions(tree, position.line)` 获取可见定义集合
4. **过滤**：用户定义补全项只保留 `name` 在可见集合中的项
5. **分类**：根据 `kind` 设置 `CompletionItemKind`：
   - `kind === 'function'` → `CompletionItemKind.Function`，标签显示 `fn`
   - `kind === 'variable'` → `CompletionItemKind.Variable`
   - `kind === 'parameter'` → `CompletionItemKind.Constant`，标签显示 `param`

**关键词补全项不受作用域过滤**——Sentaurus API 函数在任何位置都应该可用。

**Hover/Definition provider 不修改**——它们只需要位置信息，不需要作用域感知。

## 文件变更总结

| 文件 | 操作 | 行数变化 |
|------|------|---------|
| `src/lsp/scheme-analyzer.js` | 修改 | +~10 行（kind 字段） |
| `src/lsp/scope-analyzer.js` | **新增** | ~120 行 |
| `src/extension.js` | 修改 | +~30 行（作用域感知补全 + kind 标签） |
| `src/definitions.js` | 不变 | 0 行 |
| `tests/test-scope-analyzer.js` | **新增** | ~180 行 |
| `tests/test-definitions.js` | 修改 | 断言适配 kind |
| `tests/test-scheme-parser.js` | 修改 | 断言适配 kind |

**净新增代码**：~340 行（含测试）

## 测试策略

### 新测试文件 `tests/test-scope-analyzer.js`

| 测试类别 | 用例数 | 内容 |
|---------|--------|------|
| 作用域树构建 | ~5 | 全局作用域、函数作用域、let 作用域、嵌套 let、空文档 |
| 查询接口 | ~6 | 全局位置、函数体内、let 体内、嵌套 let 内、函数参数可见性、同名变量覆盖 |
| kind 分类 | ~4 | `(define x 42)` → variable、`(define (f x) ...)` → function、`(define (f) ...)` → function（无参数）、多个 define 混合 |
| 集成测试 | ~3 | 作用域过滤行为模拟、缓存有效性、版本变更时重建 |

### 现有测试更新

- `test-definitions.js`：检查 definition 对象的断言中加入 `kind` 字段
- `test-scheme-parser.js`：analyzer 相关断言中加入 `kind` 字段

### 测试原则

纯 Node.js `assert`，零依赖，和现有测试风格一致。

## 技术约束

与 Phase 1 一致：

| 约束 | 要求 |
|------|------|
| 运行时依赖 | 零 npm 依赖 |
| 模块系统 | CommonJS (`require`/module.exports`) |
| 原生模块 | 禁止（GLIBC 2.17 兼容） |
| 构建步骤 | 无（纯 JS，无编译/打包） |
| 测试 | 纯 Node.js `assert`，零测试框架依赖 |
