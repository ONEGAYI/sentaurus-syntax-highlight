# SDE LSP 实施蓝图与 Layer 1 AST 解析器设计

> 日期: 2026-04-13
> 状态: 已批准

## 背景

当前 `src/definitions.js` 使用正则 + `findBalancedExpression` 括号匹配来提取 Scheme 变量定义，存在以下局限：

- 正则无法区分语义上下文（注释/字符串内的 `define` 需要额外过滤）
- 每种分析需求（变量提取、折叠范围、诊断）需要独立扫描，无法共享解析结果
- 扩展到参数级补全、Signature Help 等高级 LSP 功能时天花板明显

通过引入 AST 解析器，可以在一次解析中产出结构化语法树，供多个分析层消费。

## 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 范围 | SDE (Scheme) 优先，框架通用 | Scheme 是最复杂、价值最高的语言，Tcl 后续跟进 |
| 功能优先级 | 基础替换 definitions.js + 代码折叠 + 括号诊断 | 最小可用集，验证架构后再扩展 |
| 集成方式 | 完全兼容替换 definitions.js | extension.js 无需修改调用方式 |
| 技术方案 | 手写递归下降解析器 | 零依赖，完全控制，Scheme 语法简单不值得引入 tree-sitter |
| 兼容性 | 纯 JS、零 npm 依赖、CommonJS、GLIBC 2.17 | 和现有项目约束一致 |

## 文件结构

```
src/
├── extension.js                          # 现有，小幅修改：注册 folding + diagnostic provider
├── definitions.js                        # 现有，Scheme 部分内部改用 AST，Tcl 不动
└── lsp/                                  # 新增目录
    ├── scheme-parser.js                  # S-expression tokenizer + AST parser (~200 行)
    ├── scheme-analyzer.js                # AST → 定义列表 + 折叠范围 (~120 行)
    └── providers/
        ├── folding-provider.js           # VSCode FoldingRangeProvider (~40 行)
        └── bracket-diagnostic.js         # 防抖括号未闭合诊断 (~60 行)
```

## 模块职责

| 模块 | 输入 | 输出 | 依赖 |
|------|------|------|------|
| `scheme-parser.js` | 源代码文本 | `{ ast: Program, errors: ParseError[] }` | 无 |
| `scheme-analyzer.js` | AST 节点树 | `{ definitions: Def[], foldingRanges: FoldRange[] }` | `scheme-parser` |
| `folding-provider.js` | VSCode Document | `FoldingRange[]` | `scheme-parser` + `scheme-analyzer` |
| `bracket-diagnostic.js` | VSCode Document | DiagnosticCollection | `scheme-parser` |

## AST 节点类型

所有节点共享基础字段：`type: string, start: number, end: number, line: number, endLine: number`

| type | 描述 | 额外字段 |
|------|------|----------|
| `Program` | 文件根节点 | `body: Node[]` |
| `List` | `(expr ...)` S-expression | `children: Node[]` |
| `Identifier` | 符号/变量名 | `value: string` |
| `Number` | 数值字面量 | `value: number` |
| `String` | 双引号字符串 | `value: string` |
| `Boolean` | `#t` / `#f` | `value: boolean` |
| `Quote` | `'expr` 语法糖 | `expression: Node` |
| `Comment` | `;` 行注释 | `value: string` |

**设计取舍：** 不区分 `define`、`lambda`、`if` 等特殊形式。它们在 AST 层面都是 `List`，语义区分由 `scheme-analyzer` 在第二遍遍历中处理。

## Parser 设计

### 架构

```
源码文本 → Tokenizer → Token 流 → Parser → AST + errors
```

### Tokenizer (~80 行)

逐字符扫描，产出带位置信息的 token 数组：

- Token 类型：`LPAREN, RPAREN, STRING, NUMBER, BOOLEAN, SYMBOL, QUOTE, COMMENT, EOF`
- 每个 token 包含：`{ type, value, start, end, line }`
- 跳过空白和换行

### Parser (~120 行)

递归下降，三个核心分支：

1. `(` → 递归解析子节点直到 `)`，产出 `List` 节点
2. `'` → 解析下一个表达式，包装为 `Quote` 节点
3. 原子 token → 直接产出对应字面量节点

### 错误容忍

- 未闭合括号：产出不完整的 `List`（`end` 指向文件末尾），记录 error
- 多余闭括号：记录 warning，跳过该 token 继续
- 不抛异常，始终产出 AST（保证编辑中也能提供 LSP 功能）

## Analyzer 设计

### Definitions 提取

遍历所有 `List` 节点，按 `children[0].value` 分派：

| 模式 | AST 匹配条件 | 提取的 name |
|------|-------------|-------------|
| `(define x ...)` | `children[0] === "define"` 且 `children[1].type === "Identifier"` | `children[1].value` |
| `(define (f args) ...)` | `children[0] === "define"` 且 `children[1].type === "List"` | `children[1].children[0].value` |
| `(let ((x 1)) ...)` | `children[0] === "let"` | 遍历绑定列表每个 `List` 的 `children[0].value` |
| `(let* ...)` / `(letrec ...)` | 同 `let` | 同上 |

输出格式与 `definitions.js` 完全相同：
```javascript
{ name: string, line: number, endLine: number, definitionText: string }
```

### Folding Ranges 提取

遍历所有**跨行的** `List` 节点，生成 `FoldingRange`：
```javascript
{ startLine: number, endLine: number, kind?: string }
```

策略：任何跨行 `( ... )` 都可折叠。嵌套范围都保留，VSCode 原生支持嵌套折叠。

## 诊断系统

### 括号未闭合诊断

| 设计点 | 选择 |
|--------|------|
| 触发方式 | `vscode.workspace.onDidChangeTextDocument` 事件 |
| 防抖时间 | 300ms（`setTimeout` + 取消上次 timer） |
| 诊断范围 | 仅 SDE (Scheme) 语言 |
| 严重级别 | 未闭合括号 = `Error`（红色波浪线）；多余闭括号 = `Warning`（黄色） |

错误格式：
```javascript
{ message: string, start: number, end: number, line: number, severity: "error" | "warning" }
```

## 集成改动

### extension.js 改动

在 `activate()` 中新增（和现有 provider 并列）：

1. 注册 `FoldingRangeProvider`（仅 `sde` 语言）
2. 调用 `bracket-diagnostic.activate(context)`
3. `getDefinitions()` 内部：Scheme 走 AST 路径，Tcl 保持原样

### definitions.js 改动

`extractSchemeDefinitions()` 内部实现改为：调用 `scheme-parser` → `scheme-analyzer`。导出接口不变，调用方无感。

## LSP 实施蓝图（三层演进）

### Phase 1 — Layer 1: AST 基础设施（当前计划）

- `scheme-parser.js` — Tokenizer + Parser (~200 行)
- `scheme-analyzer.js` — Definitions + Folding (~120 行)
- `folding-provider.js` — FoldingRangeProvider (~40 行)
- `bracket-diagnostic.js` — 防抖括号诊断 (~60 行)
- 替换 `definitions.js` 的 Scheme 部分
- 总计: ~420 行新代码，0 新依赖

### Phase 2 — Layer 2: 语义分派（未来）

- 函数文档元数据结构化（重载模式描述，`modeDispatch` 字段）
- 参数级补全（根据 AST 中的参数位置）
- Signature Help（函数调用时显示参数提示）
- 基于 modeDispatch 的上下文感知补全

### Phase 3 — Layer 3: 交叉引用分析（远期）

- 材料名/区域名索引（扫描 `sdegeo:define-*` 调用）
- 语义诊断（未定义变量、参数类型不匹配）
- Rename Symbol（变量重命名）
- Find All References（全局引用查找）

## 完成标准 (Phase 1)

1. AST 解析器能正确处理所有 SDE 脚本（含未闭合括号等错误情况）
2. 变量/函数定义提取结果和现有 `definitions.js` **完全一致**（兼容性测试）
3. 代码折叠在多行 S-expression 上正常工作
4. 括号未闭合时显示红色波浪线，300ms 防抖
5. 纯 JS、零依赖、CommonJS，兼容 GLIBC 2.17 / VSCode 1.85.2
