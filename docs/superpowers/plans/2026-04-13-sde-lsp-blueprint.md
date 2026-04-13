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
| 1 | AST 基础设施 | 解析器 + 定义提取 + 折叠 + 括号诊断 | ~420 行 | 待实施 |
| 2 | 语义分派 | 参数级补全 + Signature Help + 重载模式 | ~500 行 | 规划中 |
| 3 | 交叉引用 | 材料名/区域名索引 + 语义诊断 + Rename | ~600 行 | 规划中 |

---

## Phase 1: AST 基础设施

**详细计划:** `docs/superpowers/plans/2026-04-13-sde-lsp-layer1.md`

### 交付物

```
src/
├── extension.js                  # 修改：注册 folding + diagnostic provider
├── definitions.js                # 修改：Scheme 部分内部改用 AST
└── lsp/
    ├── scheme-parser.js          # 新增：Tokenizer + Parser (~200 行)
    ├── scheme-analyzer.js        # 新增：Definitions + Folding 分析 (~120 行)
    └── providers/
        ├── folding-provider.js   # 新增：FoldingRangeProvider (~40 行)
        └── bracket-diagnostic.js # 新增：防抖括号诊断 (~60 行)
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

1. AST 解析器能正确处理所有 SDE 脚本（含未闭合括号）
2. 定义提取结果和现有 `definitions.js` 完全一致
3. 代码折叠在多行 S-expression 上正常工作
4. 括号未闭合显示红色波浪线，300ms 防抖
5. 纯 JS、零依赖、CommonJS、GLIBC 2.17 兼容

---

## Phase 2: 语义分派（未来）

### 目标

在 AST 基础上实现函数调用的语义感知，支持 SDE 特有的模式分派重载。

### 交付物

```
src/lsp/
├── semantic-dispatcher.js     # 模式分派引擎
├── signature-provider.js      # Signature Help provider
└── param-completion.js        # 参数级补全

syntaxes/
└── sde_function_docs.json     # 新增 modeDispatch 结构化字段
```

### 关键设计

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

- Phase 1 完成（AST 解析器可用）
- 函数文档 JSON 需要添加 `modeDispatch` 结构化字段（~20 个重载函数需要手动编写）

### 预估工作量

| 任务 | 行数 | 难度 |
|------|------|------|
| modeDispatch 元数据编写 | 每函数 ~15 行 × 20 = 300 行 | 中（需阅读官方文档） |
| semantic-dispatcher.js | ~150 行 | 中 |
| signature-provider.js | ~100 行 | 中 |
| param-completion.js | ~150 行 | 高（需处理参数位置追踪） |

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

- Phase 1 完成（AST 解析器）
- Phase 2 完成（函数调用语义理解）
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
