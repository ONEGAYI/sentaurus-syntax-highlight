# SDE LSP 实施蓝图

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Sentaurus SDE (Scheme) 构建三层渐进式 LSP 系统，从 AST 解析基础设施到语义分析到交叉引用。

**Architecture:** 手写递归下降 S-expression 解析器（零依赖），产出 AST 供多个分析层消费。框架按语言无关设计，Parser 按语言独立实现。先做 Scheme，Tcl 后续跟进。

**Tech Stack:** 纯 JavaScript, CommonJS, VSCode Extension API, 零 npm 依赖

**Design Spec:** `docs/superpowers/specs/2026-04-13-sde-lsp-ast-design.md`

---

## Phase 总览

| Phase | 名称 | 核心产出 | 新增代码 | 状态 |
|-------|------|---------|---------|------|
| 1 | AST 基础设施 | 解析器 + 定义提取 + 折叠 + 括号诊断 | ~420 行 | ✅ 已完成 |
| 2 | 语义分派 | 定义分类 + 参数感知 + 参数级补全 + Signature Help + 重载模式 | ~600 行 | 2A+2B 已完成，2C 待实施 |
| 3 | 交叉引用 | 材料名/区域名索引 + 语义诊断 + Rename | ~600 行 | 规划中 |

---

## Phase 1: AST 基础设施 ✅

**详细计划:** `docs/superpowers/plans/2026-04-13-sde-lsp-layer1.md`

### 交付物

```
src/
├── extension.js                  # 修改：注册 folding + diagnostic provider
├── definitions.js                # 修改：Scheme 部分内部改用 AST
└── lsp/
    ├── scheme-parser.js          # 新增：Tokenizer + Parser (~270 行)
    ├── scheme-analyzer.js        # 新增：Definitions + Folding 分析 (~65 行)
    └── providers/
        ├── folding-provider.js   # 新增：FoldingRangeProvider (~20 行)
        └── bracket-diagnostic.js # 新增：防抖括号诊断 (~55 行)
```

### 依赖关系

```
scheme-parser.js (无依赖)
    ↓
scheme-analyzer.js (依赖 parser)
    ↓
┌────────────────────┬───────────────────────┐
│                    │                       │
folding-provider.js  bracket-diagnostic.js   definitions.js (内部替换)
    │                    │                       │
    └────────────────────┴───────────────────────┘
                         ↓
                   extension.js (注册 providers)
```

### 完成标准

1. ✅ AST 解析器能正确处理所有 SDE 脚本（含未闭合括号）
2. ✅ 定义提取结果和现有 `definitions.js` 完全一致（define 部分）
3. ✅ 代码折叠在多行 S-expression 上正常工作
4. ✅ 括号未闭合显示红色波浪线，300ms 防抖
5. ✅ 纯 JS、零依赖、CommonJS、GLIBC 2.17 兼容
6. ✅ let/let*/letrec 绑定被提取但由作用域过滤控制可见性

### Phase 1 实施中修复的额外问题

- **let 作用域处理演进**：旧版 definitions.js 将 let 绑定变量全局暴露；AST 迁移后先修正为不提取 let 绑定；Phase 2 引入 scope-analyzer 后改为"提取全部、作用域过滤"，统一了提取层与可见性层的职责

---

## Phase 2: 语义分派（2A+2B 已完成，2C 待实施）

**详细计划:** `docs/superpowers/plans/2026-04-13-sde-lsp-layer2.md`

### 已完成交付物（2A+2B）

```
src/
├── extension.js                  # 修改：kind 分类 + 作用域感知补全过滤
├── definitions.js                # 不变：透传 kind 字段
└── lsp/
    ├── scheme-analyzer.js        # 修改：定义输出增加 kind 字段
    ├── scope-analyzer.js         # 新增：作用域树构建 + 可见性查询 (~130 行)
    └── providers/
        └── (无变更)

tests/
└── test-scope-analyzer.js        # 新增：17 个测试用例
```

### 完成标准（2A+2B）

1. ✅ define 变量输出 `kind: 'variable'`，define 函数输出 `kind: 'function'`，函数参数输出 `kind: 'parameter'`
2. ✅ 函数参数在函数体内可见于补全
3. ✅ let/let*/letrec 绑定在对应作用域内可见于补全
4. ✅ 作用域外定义不出现在补全列表中
5. ✅ 同名变量内层覆盖外层
6. ✅ 非SDE语言不受影响
7. ✅ 91 个测试全部通过（42 + 32 + 17）

### Phase 2 实施中修复的额外问题

- **简单变量定义遗漏**：原计划 `buildScopeTree` 只处理了 `(define (func params) body)` 形式，遗漏了 `(define var val)` 形式。实施中补充了简单变量定义的全局作用域注册。
- **提取层与可见性层职责错位**：`scheme-analyzer.js` 原本只提取 `define` 定义，不提取 `let` 绑定和函数参数。虽然 `scope-analyzer.js` 正确构建了包含 let 和参数的作用域树，但补全过滤采用交集机制——不在提取列表中的定义即使作用域内可见也无法补全。修复方案：让 `scheme-analyzer.js` 提取所有定义（包括 let 绑定和函数参数），可见性完全由 `scope-analyzer.js` 的作用域过滤控制。

### 待实施（2C：模式分派）

```
src/
├── extension.js                  # 修改：补全分类 + 作用域感知
├── definitions.js                # 修改：definitions 增加 kind 字段
└── lsp/
    ├── scheme-analyzer.js        # 修改：增加 kind 字段 + 作用域分析
    ├── scope-analyzer.js         # 新增：作用域分析（参数可见性） (~100 行)
    ├── semantic-dispatcher.js    # 新增：模式分派引擎 (~150 行)
    ├── signature-provider.js     # 新增：Signature Help provider (~100 行)
    └── param-completion.js       # 新增：参数级补全 (~150 行)

syntaxes/
└── sde_function_docs.json        # 修改：新增 modeDispatch 结构化字段
```

### 2A: 定义分类（前置工作）

**问题：** 当前所有用户定义统一显示为"用户变量"，`(define (calc-mobility temp) ...)` 这样的函数定义应该显示为"用户函数"。

**方案：** 在 `scheme-analyzer.js` 的 definitions 输出中增加 `kind` 字段：

| 模式 | kind 值 | CompletionItemKind |
|------|---------|-------------------|
| `(define x 42)` | `'variable'` | `Variable` |
| `(define (f args) body)` | `'function'` | `Function` |
| `(let ((x 1)) ...)` | `'let-binding'` | `Variable`（局部，不暴露全局） |

**改动范围：**
- `scheme-analyzer.js`: `extractDefinitionsFromList` 追加 `kind` 字段
- `extension.js`: 补全提供器根据 `kind` 设置不同的 `CompletionItemKind` 和标签

### 2B: 函数参数感知（作用域分析）

**问题：** `(define (calc-mobility temp) ...)` 中的 `temp` 在函数体内应该出现在补全中，但当前不提取参数。

**方案：** 新增 `scope-analyzer.js`，基于 AST 构建作用域树：

```
全局作用域
├── define: TboxTest (variable)
├── define: calc-mobility (function)
│   └── 函数作用域
│       ├── param: temp
│       ├── let: T0 (variable)
│       ├── let: mu0 (variable)
│       └── let*: ratio (variable)
└── define: material-list (variable)
```

**补全行为：**
- 光标在函数体外 → 补全全局 define（变量 + 函数名）
- 光标在函数体内 → 补全全局 define + 函数参数 + 体内 let 绑定
- 光标在 let 体内 → 补全外层 define + 函数参数 + 外层 let + 当前 let 绑定

**改动范围：**
- `scope-analyzer.js`: 作用域树构建 + 查询接口
- `extension.js`: 补全提供器调用作用域查询，按位置过滤可用定义

### 2C: 模式分派（核心功能）

**modeDispatch 数据模型：**
```json
{
  "sdedr:define-refinement-function": {
    "modeDispatch": {
      "argIndex": 1,
      "modes": {
        "MaxLenInt": {
          "params": ["definition-name", "mat-reg-1", "mat-reg-2", "value", "..."],
          "flags": { "UseRegionNames": { "affects": ["mat-reg-1", "mat-reg-2"] } }
        },
        "MaxGradient": { "params": ["definition-name", "value"] }
      }
    }
  }
}
```

**工作流：**
1. AST 解析识别 `(sdedr:define-refinement-function ...)` 调用
2. 读取 arg[1] 值确定模式
3. 基于模式提供参数级补全和 Signature Help
4. 检测 flags（如 `UseRegionNames`）调整补全内容

### 前置条件

- ✅ Phase 1 完成（AST 解析器可用）
- 函数文档 JSON 需要添加 `modeDispatch` 结构化字段（~20 个重载函数需要手动编写）

### 预估工作量

| 任务 | 行数 | 难度 |
|------|------|------|
| 定义分类 (2A) | ~30 行改动 | 低 |
| scope-analyzer.js (2B) | ~100 行 | 中 |
| modeDispatch 元数据编写 (2C) | 每函数 ~15 行 × 20 = 300 行 | 中（需阅读官方文档） |
| semantic-dispatcher.js (2C) | ~150 行 | 中 |
| signature-provider.js (2C) | ~100 行 | 中 |
| param-completion.js (2C) | ~150 行 | 高（需处理参数位置追踪） |

---

## Phase 3: 交叉引用分析（远期）

### 目标

建立全局符号索引，实现语义诊断、重命名、引用查找。

### 交付物

```
src/lsp/
├── symbol-index.js            # 全局符号索引（材料名、区域名、变量）
├── reference-provider.js      # Find All References
├── rename-provider.js         # Rename Symbol
└── semantic-diagnostic.js     # 语义诊断（未定义变量等）
```

### 关键设计

**符号索引构建：**
- 扫描 `(sdegeo:create-rectangle "R.Si" ...)` → 索引区域名 "R.Si"
- 扫描 `(sdegeo:define-contact-set "Source" ...)` → 索引接触名 "Source"
- 扫描 `(define ...)` → 索引用户变量/函数
- 索引按文档版本增量更新（复用 Phase 1 的缓存策略）

**语义诊断示例：**
- `(sdegeo:define-contact-set "NonExist" ...)` → "区域 'NonExist' 未定义"
- `(undefined-var ...)` → "变量 'undefined-var' 未在当前作用域中定义"

### 前置条件

- ✅ Phase 1 完成（AST 解析器）
- Phase 2 完成（函数调用语义理解 + 作用域分析）
- 需要确定：是否支持多文件索引（跨文件引用）

### 预估工作量

| 任务 | 行数 | 难度 |
|------|------|------|
| symbol-index.js | ~200 行 | 高 |
| reference-provider.js | ~100 行 | 中 |
| rename-provider.js | ~150 行 | 高 |
| semantic-diagnostic.js | ~150 行 | 高 |

---

## 技术约束（贯穿所有 Phase）

| 约束 | 要求 |
|------|------|
| 运行时依赖 | 零 npm 依赖 |
| 模块系统 | CommonJS (`require`/`module.exports`) |
| 原生模块 | 禁止（需兼容 GLIBC 2.17） |
| 构建步骤 | 无（纯 JS，无编译/打包） |
| 目标环境 | VSCode 1.85.2, CentOS 7 (GLIBC 2.17) |
| 测试 | 纯 Node.js `assert`，零测试框架依赖 |
