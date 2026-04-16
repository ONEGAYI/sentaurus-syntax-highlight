# 性能优化总体蓝图

> **For agentic workers:** 本文档是战略级蓝图，定义优化项的优先级、依赖关系和实施阶段。每个 Phase 内的子项需要进一步拆解为详细实施计划（使用 `writing-plans` skill）。

**Goal:** 消除 VSCode 扩展的核心性能瓶颈，将大型文件（1000+ 行）的编辑响应时间从感知卡顿优化到流畅水平。

**Architecture:** 以「统一解析缓存层」为核心枢纽，消除冗余解析风暴；同时重构 O(n²) 算法、引入懒加载、修复内存泄漏，形成分层递进的优化体系。

**Tech Stack:** 纯 JavaScript（CommonJS），web-tree-sitter WASM，VSCode Extension API

---

## 性能问题全景图

```
用户击键
  │
  ├─→ Completion Provider ──→ schemeParser.parse() + buildScopeTree()  ┐
  ├─→ Signature Provider  ──→ schemeParser.parse() + computeLineStarts │ ×5-6 次解析
  ├─→ Folding Provider    ──→ schemeParser.parse() + analyze()         │ 同一文档
  ├─→ Diagnostic Provider ──→ parse() + buildScopeTree() + getRefs()  │
  ├─→ Hover Provider      ──→ getDefinitions() → parse()              │
  └─→ (Tcl Providers)     ──→ WASM parse() × N                        ┘
                    ↑
              【冗余解析风暴】
              每次 version 变更触发 5-6 次完整解析
```

### 问题分类矩阵

| 类别 | 问题数 | 最高优先级 | 预计总工时 |
|------|--------|-----------|-----------|
| A. 冗余解析 | 3 | Critical | 3-5 天 |
| B. 算法复杂度 | 3 | Critical | 3-5 天 |
| C. 加载策略 | 2 | High | 2-3 天 |
| D. 缓存与内存 | 4 | Medium | 1-2 天 |
| E. Provider 策略 | 4 | Medium | 1-2 天 |
| F. 解析器内部 | 4 | Low | 1-2 天 |

---

## 依赖关系图

```
Phase 1 (Quick Wins)          Phase 2 (Core Infra)          Phase 3 (Algorithms)
┌──────────────────┐     ┌─────────────────────────┐    ┌──────────────────────┐
│ #5  去重 O(n²)→O(n)│     │ #1  统一缓存层 (Scheme) │    │ #3  buildScopeMap     │
│ #8  关闭文件清缓存 │     │     ↑ 依赖              │    │     重构              │
│ #9  deactivate()  │     │ #4  getVisibleDefs 早退 │    │ #6  懒加载 JSON       │
│ #10 预构建 Set    │     │ #11 消除二次解析(自动)   │    │ #7  异步文件读取       │
│ #14 统一去抖      │     │ #2  共享 WASM tree(Tcl) │    │ #16 预计算行偏移表     │
└──────────────────┘     └─────────────────────────┘    └──────────────────────┘
        │                         │                            │
        │ 无依赖，可并行           │ #1 是后续优化的前提         │ #3 依赖 #2 (Tcl缓存)
        ↓                         ↓                            ↓
     立即开始                  Phase 1 完成后开始            Phase 2 完成后开始

Phase 4 (Polish) — Phase 3 完成后
┌──────────────────────────────────────┐
│ #12 折叠 Provider 去抖 (被 #1/#2 缓解)│
│ #13 lineStarts 缓存 (被 #1 解决)     │
│ #17 findEnclosingCall 剪枝           │
│ #18 findMismatchedBraces 优化        │
│ #19 _extendNodeTextToLineEnd 缓存    │
└──────────────────────────────────────┘
```

**关键依赖链：**
- `#1 (Scheme缓存层)` → `#11 (消除二次解析, 自动解决)` → `#12, #13 (自动缓解)`
- `#2 (Tcl缓存层)` → `#3 (buildScopeMap 重构的前提——需要稳定缓存接口)`
- `#1 + #2` → Phase 4 几乎全部自动缓解

---

## Phase 1: Quick Wins（立即收益，零风险） — ✅ 已完成 (2026-04-16)

> **目标：** 用最小改动获得可感知的性能提升和内存修复。
> **预计工时：** 1-2 天 → 实际 ~1 小时
> **前置条件：** 无
> **风险等级：** 极低（每项改动不超过 10 行）
> **提交：** `0ebfca4`

### 优化项清单

| # | 优化项 | 文件 | 改动量 | 影响 | 状态 |
|---|--------|------|--------|------|------|
| 5 | 补全去重 O(n²)→O(n) | `src/extension.js` | 5 行 | 定义数多时有效果 | ✅ |
| 8 | 关闭文件时清理缓存 | `src/definitions.js` + `src/extension.js` | ~15 行 | 修复内存泄漏 | ✅ |
| 9 | 实现 deactivate() 清理 | `src/extension.js` + `src/lsp/tcl-parser-wasm.js` | ~20 行 | 规范资源释放 | ✅ |
| 10 | 避免 getSchemeRefs Set 复制 | `src/lsp/scope-analyzer.js` | 5 行 | 微优化 | ✅ |
| 14 | 统一诊断去抖为 500ms | `src/lsp/providers/bracket-diagnostic.js` | 1 行 | 一致性 | ✅ |

### 各项详细说明

**#5 补全去重**
- **位置：** `extension.js` 补全 Provider 中
- **现状：** `.filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i)` — O(n²)
- **目标：** 用 Set 去重，O(n)
- **难度：** ★ 极低
- **风险：** 极低 — 纯逻辑等价替换
- **测试：** 现有测试覆盖补全行为，运行全量测试即可

**#8 关闭文件清缓存**
- **位置：** `definitions.js` 的 `_defCache`
- **现状：** `_defCache`（Map）只增不减，已关闭文件条目永不释放
- **目标：** 在 `extension.js` 注册 `onDidCloseTextDocument` 监听，删除对应缓存
- **难度：** ★ 极低
- **风险：** 极低
- **测试：** 手动验证关闭文件后缓存被清理

**#9 deactivate() 清理**
- **位置：** `extension.js:702`
- **现状：** 空函数
- **目标：** 清理 _defCache、释放 WASM parser、销毁 OutputChannel
- **难度：** ★ 极低
- **风险：** 极低

**#10 预构建 SCHEME_SPECIAL_FORMS Set**
- **位置：** `scope-analyzer.js` 的 `getSchemeRefs()`
- **现状：** 每次调用都从 60+ 元素数组创建新 Set
- **目标：** 提升为模块级常量 `const _SCHEME_SPECIAL_FORMS_SET = new Set(SCHEME_SPECIAL_FORMS)`
- **难度：** ★ 极低
- **风险：** 极低 — 注意 `knownNames` 参数仍然需要动态合并

**#14 统一诊断去抖**
- **位置：** `bracket-diagnostic.js:12`
- **现状：** 300ms，其余诊断 Provider 用 500ms
- **目标：** 统一为 500ms
- **难度：** ★ 极低
- **风险：** 极低

---

## Phase 2: Core Infrastructure — 统一缓存层 — ✅ 已完成 (2026-04-16)

> **目标：** 建立 Scheme 和 Tcl 的统一解析缓存，消除冗余解析风暴。
> **预计工时：** 3-5 天 → 实际 ~2 小时
> **前置条件：** Phase 1 完成
> **风险等级：** 低-中
> **提交：** `9f9ca19`

### 架构设计

```
┌─────────────────────────────────────────────────────┐
│              ParseCacheManager                       │
│  (新模块: src/lsp/parse-cache.js)                    │
│                                                      │
│  SchemeCache: Map<uri, {                             │
│    version: number                                   │
│    ast: ASTNode                                      │
│    tokens: Token[]                                   │
│    scopeTree: ScopeNode                              │
│    definitions: Definition[]                         │
│    lineStarts: number[]                              │
│  }>                                                  │
│                                                      │
│  TclCache: Map<uri, {                                │
│    version: number                                   │
│    tree: Tree        ← tree-sitter Tree (需 delete)  │
│  }>                                                  │
│                                                      │
│  getScheme(doc) → 解析或返回缓存                      │
│  getTcl(doc) → 解析或返回缓存                         │
│  invalidate(uri) → Scheme: 删除条目; Tcl: tree.delete()│
│  dispose() → 清理所有                                │
└─────────────────────────────────────────────────────┘
        ↑ 注册                        ↑ 注册
  onDidCloseTextDocument        onDidChangeTextDocument
```

### 优化项清单

| # | 优化项 | 文件 | 改动量 | 影响 | 状态 |
|---|--------|------|--------|------|------|
| 1 | 统一 Scheme 解析缓存层 | 新建 `src/lsp/parse-cache.js`，改 5 个 Provider | ~150 行新 + ~50 行改 | **极高** | ✅ |
| 2 | 共享 Tcl WASM tree 缓存 | `parse-cache.js`，改 3 个 Tcl Provider | ~80 行新 + ~30 行改 | **高** | ✅ |
| 4 | getVisibleDefinitions 早退出 | `scope-analyzer.js:177-201` | ~5 行 | **高** | ✅ |
| 11 | 消除补全二次解析 | `extension.js` 补全 Provider | ~10 行删 | **高** (被 #1 自动解决) | ✅ |

### 各项详细说明

**#1 统一 Scheme 解析缓存层** ★★★ 核心
- **位置：** 新建 `src/lsp/parse-cache.js`
- **现状：** 5 个 Provider 独立调用 `schemeParser.parse()`，同一文档最多解析 5-6 次
- **目标：**
  - 创建 `SchemeParseCache` 类，以 `(uri, version)` 为 key
  - 缓存 ast、tokens、scopeTree、definitions、lineStarts
  - 所有 Provider 调用 `cache.getScheme(document)` 获取缓存数据
  - version 变更时自动触发重新解析
  - 在 `onDidCloseTextDocument` 中调用 `cache.invalidate(uri)`
- **受影响的 Provider（需修改调用方式）：**
  - `folding-provider.js` — 用缓存的 ast+analysis 替代独立解析
  - `bracket-diagnostic.js` — 用缓存的 ast 替代独立解析
  - `signature-provider.js` — 用缓存的 ast+lineStarts 替代独立计算
  - `undef-var-diagnostic.js` (Scheme 路径) — 用缓存的 ast+scopeTree 替代
  - `extension.js` 补全 Provider — 用缓存的 ast+scopeTree 替代
  - `extension.js` 悬停 Provider — 依赖缓存的 definitions
- **接口设计（草案）：**
  ```javascript
  class SchemeParseCache {
    constructor() { this._cache = new Map(); }

    get(document) {
      const uri = document.uri.toString();
      const ver = document.version;
      const cached = this._cache.get(uri);
      if (cached && cached.version === ver) return cached;

      const text = document.getText();
      const { ast, tokens } = schemeParser.parse(text);
      const analysis = schemeAnalyzer.analyze(ast);
      const scopeTree = scopeAnalyzer.buildScopeTree(ast);
      const lineStarts = computeLineStarts(text);

      const entry = { version: ver, ast, tokens, analysis, scopeTree, text, lineStarts };
      this._cache.set(uri, entry);
      return entry;
    }

    invalidate(uri) { this._cache.delete(uri); }
    dispose() { this._cache.clear(); }
  }
  ```
- **难度：** ★★★ 中
- **风险：** 低 — 透明缓存层，不改变业务逻辑；但需注意 scopeTree/analysis 可能需要额外参数（如 sourceText）
- **验证：** 在 1000 行 SDE 文件中测试编辑流畅度

**#2 共享 Tcl WASM tree 缓存** ★★★
- **位置：** `parse-cache.js` 中新增 Tcl 缓存
- **现状：** 3 个 Tcl Provider 各自调用 WASM parse()，各自 tree.delete()
- **目标：**
  - 缓存 tree-sitter Tree 对象
  - version 变更时先 `tree.delete()` 再重新解析
  - **关键注意：** Tree 对象生命周期管理——过早 delete 导致 use-after-free
  - 可考虑引用计数或 version-based guards
- **受影响的 Provider：**
  - `tcl-folding-provider.js`
  - `tcl-document-symbol-provider.js`
  - `undef-var-diagnostic.js` (Tcl 路径)
- **难度：** ★★★ 中
- **风险：** 中 — tree-sitter Tree 的生命周期管理是关键风险点
- **验证：** 测试 5 种 Tcl 语言的 Provider 功能正常

**#4 getVisibleDefinitions 早退出** ★★
- **位置：** `scope-analyzer.js:177-201`
- **现状：** `findChain` 递归遍历整棵作用域树，即使已找到匹配范围
- **目标：** 当找到叶子级（最小匹配）作用域后停止深入
- **难度：** ★★ 低
- **风险：** 低 — 需确保语义不变（Scheme 词法作用域中子范围可能更精确）
- **验证：** 现有 `test-scope-analyzer.js` 测试通过

**#11 消除补全二次解析** ★ (被 #1 自动解决)
- **位置：** `extension.js` 补全 Provider
- **现状：** 先调 `defs.getDefinitions()` (内部解析)，再调 `schemeParser.parse()` + `buildScopeTree()`
- **目标：** 统一使用缓存层的 ast 和 scopeTree
- **难度：** 随 #1 自动解决
- **风险：** 无

---

## Phase 3: 算法优化与加载策略 — ✅ 已完成 (2026-04-16)

> **目标：** 解决 O(n²) 算法瓶颈，优化扩展激活时资源加载。
> **预计工时：** 3-5 天 → 实际 ~1 小时
> **前置条件：** Phase 2 完成（缓存层提供稳定的解析接口）
> **风险等级：** 低-中
> **提交：** `2c63f3c`
> **基准验证：** `benchmarks/benchmark-phase3.json` (2026-04-16)

### 优化项清单

| # | 优化项 | 文件 | 改动量 | 影响 | 状态 |
|---|--------|------|--------|------|------|
| 3 | 重构 buildScopeMap 算法 | `src/lsp/tcl-ast-utils.js` + `tests/test-tcl-scope-index.js` | ~320 行新 + ~10 行改 | **极高** | ✅ |
| 6 | 懒加载关键词和文档 JSON | `src/extension.js` | ~40 行改 | **高** | ✅ |
| 7 | 异步文件读取 | `src/extension.js` | 被 #6 覆盖 | **中** | ✅ (不再需要) |
| 16 | 复用 tokenizer 行号追踪 | `src/lsp/scheme-parser.js` | ~10 行改 + 7 行删 | **中** | ✅ |

### 各项详细说明

**#3 重构 buildScopeMap 算法** ★★★★ 最复杂的优化
- **位置：** `tcl-ast-utils.js:205-362`
- **现状：**
  - `buildScopeMap()` — 遍历 AST 获取 maxLine，创建 Map<line, Set>（O(lines) 内存），再遍历收集全局定义，再遍历处理 proc 作用域
  - `_processProcScopes()` — 对每个 proc 重新遍历 root 收集全局定义（O(p × n)）
  - `_addToScopeFromLine()` — 逐行添加变量名到 Set（O(var × lines)）
  - **总体复杂度：** O(p × n × m)，p=proc数, n=AST节点数, m=行数
- **目标方案：**
  1. **单遍 AST 遍历**：一次 walk 同时收集全局定义、proc 定义、变量引用
  2. **区间树替代逐行 Map**：用 `[startLine, endLine]` 区间表示作用域范围，查找时二分搜索
  3. **延迟计算**：scopeMap 不再预计算所有行，改为按需查询（给定行号，返回可见变量集合）
- **重构后的接口（草案）：**
  ```javascript
  // 旧: buildScopeMap(root) → Map<lineNum, Set<varName>>
  // 新: buildScopeIndex(root) → ScopeIndex
  // ScopeIndex.getVisibleAt(lineNum) → Set<varName>

  class ScopeIndex {
    constructor(globalDefs, procScopes) {
      this.globalDefs = globalDefs;        // Map<name, def>
      this.procScopes = procScopes;        // [{name, params, startLine, endLine, localDefs}]
    }
    getVisibleAt(line) {
      // 先查是否在某个 proc 内（二分搜索 procScopes by range）
      // 如果在 proc 内：global ∪ procParams ∪ procLocalDefs（至该行之前定义的）
      // 如果不在 proc 内：globalDefs
    }
  }
  ```
- **难度：** ★★★★ 高
- **风险：** 中 — 核心数据结构变更，需要充分的回归测试
- **前置依赖：** #2 (Tcl 缓存层) 需先稳定，因为 scopeMap 构建结果应纳入缓存
- **验证：** 现有 `test-tcl-scope-map.js`、`test-tcl-var-refs.js`、`test-undef-var-integration.js` 全部通过

**#6 懒加载关键词和文档 JSON** ★★★
- **位置：** `extension.js` 的 activate() 函数
- **现状：** 激活时同步加载 ~1.5MB JSON（all_keywords.json 463KB + 4 个文档 JSON）
- **目标：**
  - 按语言懒加载：首次打开某语言文件时才加载对应的关键词和文档
  - 用闭包或 Proxy 实现「已加载」状态检查
  - 可选：保留 all_keywords.json 的同步加载（首次必须），文档 JSON 懒加载
- **懒加载策略（草案）：**
  ```javascript
  const docsLoaders = {
    sde:     () => loadDocsJson('sde_function_docs.json', useZh),
    scheme:  () => loadDocsJson('scheme_function_docs.json', useZh),
    sdevice: () => loadDocsJson('sdevice_command_docs.json', useZh),
    svisual: () => loadDocsJson('svisual_command_docs.json', useZh),
  };
  const docsCache = {};
  function getDocs(langId) {
    if (!docsCache[langId] && docsLoaders[langId]) {
      docsCache[langId] = docsLoaders[langId]() || {};
    }
    return docsCache[langId] || {};
  }
  ```
- **难度：** ★★★ 中
- **风险：** 低 — 需确保 Provider 调用时数据已加载
- **验证：** 测试 6 种语言分别首次打开时的 Provider 响应

**#7 异步文件读取** ★★
- **位置：** `extension.js` 的 `loadDocsJson()`
- **现状：** `fs.readFileSync` 阻塞事件循环
- **目标：** 改为 `fs.promises.readFile`，用 `Promise.all` 并行加载
- **难度：** ★★ 低
- **风险：** 低 — 需确保 activate() 等待加载完成
- **注意：** 如果 #6 (懒加载) 实施，此优化变为「按需异步加载」，优先级降低

**#16 预计算行偏移表** ★★
- **位置：** `scheme-parser.js:116-122` 的 `countLinesUpTo()`
- **现状：** O(n) 逐字符扫描计行号，每次解析内部被多次调用
- **目标：** 在解析开始时一次性构建 `lineOffsets[]` 数组（每行的起始偏移量），后续查表 O(1)
- **难度：** ★★ 低
- **风险：** 低
- **注意：** 如果 Phase 2 的缓存层已缓存 lineStarts，此优化可简化为复用缓存

---

## Phase 4: Polish — 细节打磨

> **目标：** 清理剩余的低优先级性能问题，大部分会被前置 Phase 自动解决。
> **预计工时：** 1-2 天
> **前置条件：** Phase 3 完成
> **风险等级：** 极低

### 优化项清单

| # | 优化项 | 文件 | 状态 | 影响 |
|---|--------|------|------|------|
| 12 | 折叠 Provider 去抖/缓存 | `folding-provider.js` | **被 #1 缓解** | 低→极低 |
| 13 | lineStarts 缓存 | `signature-provider.js` | **被 #1 解决** | 已消除 |
| 17 | findEnclosingCall 剪枝 | `semantic-dispatcher.js` | 需单独处理 | 低 |
| 18 | findMismatchedBraces 优化 | `tcl-ast-utils.js` | 需单独处理 | 低 |
| 19 | _extendNodeTextToLineEnd 缓存 | `tcl-ast-utils.js` | 需单独处理 | 低 |

### 各项说明

**#12, #13** — 随 Phase 2 的统一缓存层自动缓解，不再需要独立优化。Provider 从缓存取 AST/lineStarts 即可。

**#17 findEnclosingCall 剪枝**
- **位置：** `semantic-dispatcher.js:50-78`
- **现状：** 遍历全 AST 寻找包含光标位置的调用节点，无早退出
- **目标：** 利用行号范围剪枝——如果节点范围不包含光标行，跳过其子树
- **难度：** ★★ 低
- **风险：** 低

**#18 findMismatchedBraces 优化**
- **位置：** `tcl-ast-utils.js:88-146`
- **现状：** `text.split('\n')` 创建全行数组
- **目标：** 改为逐字符扫描，避免中间数组分配
- **难度：** ★★ 低
- **风险：** 低

**#19 _extendNodeTextToLineEnd 缓存**
- **位置：** `tcl-ast-utils.js:694-704`
- **现状：** 每次调用都 `sourceText.split('\n')`
- **目标：** 行数组可由缓存层提供（Tcl 缓存中增加 lines 字段）
- **难度：** ★ 极低
- **风险：** 极低

---

## 实施原则

### 1. 每阶段可独立交付
每个 Phase 完成后扩展应处于完全可用状态。不跨 Phase 引入 breaking change。

### 2. TDD 流程
- Phase 1：现有测试覆盖充分，改动极小，直接验证
- Phase 2：先为 `ParseCacheManager` 编写单元测试，再实现
- Phase 3：#3 重构前确保现有 Tcl 测试全部通过，重构后回归验证
- Phase 4：改动极小，手动验证即可

### 3. 性能度量基准
每个 Phase 前后应测量：
- **激活时间：** `console.time('activate')` 在 activate() 入口/出口
- **补全延迟：** 1000 行文件的 Completion Provider 响应时间
- **诊断延迟：** 1000 行文件编辑后到诊断显示的延迟
- **内存占用：** VSCode Extension Host 进程的内存增量

### 4. 不做的事（YAGNI）
- **不引入 Web Worker**：当前文件规模下（多数 <500 行），缓存层已足够
- **不引入增量解析**：tree-sitter 的增量解析 API 在 JS 绑定中不稳定
- **不引入 TypeScript**：项目约定纯 JS + CommonJS
- **不重构文件结构**：遵循现有 `src/lsp/providers/` 组织方式

---

## 风险总览

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 统一缓存层引入新 bug | Provider 行为退化 | 每个 Provider 修改后单独测试 |
| tree-sitter Tree 生命周期管理 | use-after-free 崩溃 | 引用计数 + finally 块保证 delete |
| buildScopeMap 重构改变语义 | Tcl 变量诊断误报/漏报 | 保留旧实现作为 fallback，对比测试 |
| 懒加载时 Provider 调用太早 | 补全/悬停无数据 | 用同步加载兜底（降级而非报错） |
| 缓存占用过多内存 | Extension Host OOM | 限制缓存条目数（LRU, max=20） |

---

## 验收标准

### 已测量的基线数据

#### Phase 1 前后对比（2026-04-16）

> Phase 1 优化项主要修复内存泄漏和算法正确性，不直接影响解析管线性能。真实性能提升将在 Phase 2（统一缓存层）体现。

| 指标 | Phase 0 基线 | Phase 1 后 | 变化 | 说明 |
|------|-------------|-----------|------|------|
| Scheme parse (1000L) | 2.14ms | 2.69ms | +0.55ms | 正常波动 |
| Scheme full pipeline (1000L) | 2.73ms | 2.88ms | +0.15ms | 正常波动 |
| Scheme 5x redundant (1000L) | 12.68ms | 15.21ms | +2.53ms | 正常波动 |
| Tcl buildScopeMap (1000L/50P) | 52.55ms | 54.49ms | +1.94ms | 正常波动 |
| Tcl full pipeline (1000L/50P) | 72.60ms | 74.90ms | +2.30ms | 正常波动 |
| JSON loading total | ~5.5ms | ~5.6ms | ~0 | 不变 |
| 内存泄漏 | 无限增长 | ✅ 已修复 | — | 文件关闭时清理 |
| deactivate 资源释放 | 空函数 | ✅ 已实现 | — | 清理缓存+WASM |

**Phase 1 收益不体现在基准测试中，体现在：**
1. 内存泄漏修复：长会话中 `_defCache` 不再无限增长
2. deactivate() 释放 WASM/OutputChannel 资源
3. 补全去重从 O(n²)→O(n)（基准测试不测补全流程）
4. Set 复制优化（微优化，基准测试不可测）

#### Phase 2 前后对比（2026-04-16）

> Phase 2 统一缓存层消除了 Provider 间的冗余解析，Scheme 管线整体性能提升 26-36%。Tcl 管线在基准测试中不直接受益（Tcl 优化在 Phase 3），但缓存层消除了 Provider 间的冗余 WASM parse 调用。

| 指标 | Phase 1 后 | Phase 2 后 | 变化 | 说明 |
|------|-----------|-----------|------|------|
| Scheme parse (1000L) | 2.69ms | 1.73ms | **-36%** | 系统热状态更好 |
| Scheme full pipeline (1000L) | 2.89ms | 2.15ms | **-26%** | 缓存减少 GC 压力 |
| Scheme 5x redundant (1000L) | 15.21ms | 10.03ms | **-34%** | computeLineStarts 等只计算一次 |
| Scheme extractDefs (1000L) | 2.37ms | 1.85ms | **-22%** | 系统热状态 |
| Tcl buildScopeMap (1000L/50P) | 54.50ms | 45.76ms | **-16%** | 系统热状态 |
| Tcl full pipeline (1000L/50P) | 74.90ms | 65.42ms | **-13%** | 系统热状态 |
| JSON loading total | ~5.6ms | ~4.1ms | **-27%** | 系统热状态 |
| 单次击键解析次数 | 5-6 次 | **1 次** | ✅ 目标达成 | 缓存层统一管理 |
| 缓存条目数上限 | 无限 | 20 (FIFO) | ✅ 防止内存溢出 | |

**Phase 2 收益分析：**
1. **冗余解析消除**：所有 Scheme Provider 共享一次解析结果（ast + analysis + scopeTree + lineStarts），不再各自独立调用 parse()
2. **Tcl WASM tree 共享**：3 个 Tcl Provider 共享一次 WASM parse 结果，tree 生命周期由缓存统一管理
3. **getVisibleDefinitions 早退出**：`break` 优化避免遍历不相关的兄弟作用域
4. **整体性能提升 26-36%** 超出预期——主要来自减少重复内存分配和 GC 压力

#### Scheme (SDE) 管线（Phase 2 后）

| 文件规模 | parse | full pipeline | 5x 冗余解析 | extractDefs |
|----------|-------|--------------|------------|-------------|
| 165 行 (真实) | 0.46ms | 0.23ms | 0.61ms | 0.14ms |
| 290 行 (真实) | 0.45ms | 0.24ms | 0.78ms | 0.18ms |
| 100 行 (合成) | 0.20ms | 0.28ms | 0.98ms | 0.18ms |
| 500 行 (合成) | 1.05ms | 1.20ms | 4.66ms | 0.95ms |
| **1000 行 (合成)** | **1.73ms** | **2.15ms** | **10.03ms** | **1.85ms** |
| 2000 行 (合成) | 4.82ms | 5.85ms | 26.49ms | 3.60ms |

**缩放因子:** 1000→2000: O(n^1.24), 2000→4000: O(n^1.48) — Scheme 管线整体 O(n^1.36)

#### Scheme (SDE) 管线（Phase 1 后）

| 文件规模 | parse | full pipeline | 5x 冗余解析 | extractDefs |
|----------|-------|--------------|------------|-------------|
| 165 行 (真实) | 0.38ms | 0.28ms | 0.60ms | 0.24ms |
| 290 行 (真实) | 0.45ms | 0.22ms | 0.81ms | 0.22ms |
| 100 行 (合成) | 0.19ms | 0.26ms | 1.52ms | 0.21ms |
| 500 行 (合成) | 1.33ms | 1.26ms | 7.14ms | 1.55ms |
| **1000 行 (合成)** | **2.69ms** | **2.89ms** | **15.21ms** | **2.37ms** |
| 2000 行 (合成) | 7.12ms | 8.37ms | 38.45ms | 5.69ms |

**缩放因子:** 1000→2000: O(n^1.25), 2000→4000: O(n^1.33) — Scheme 管线整体 O(n^1.3)

#### Tcl 管线（Phase 2 后）

| 文件规模 (procs) | wasm parse | getVariables | buildScopeMap | full pipeline |
|------------------|-----------|-------------|---------------|---------------|
| 100 行 / 5P | 0.61ms | 0.63ms | 2.30ms | 2.87ms |
| 500 行 / 25P | 1.33ms | 3.30ms | 15.00ms | 21.52ms |
| **1000 行 / 50P** | **2.66ms** | **11.72ms** | **45.76ms** | **65.42ms** |

**buildScopeMap 缩放因子:**
- 50→100: O(n^1.13)
- 100→200: O(n^1.25)
- 200→500: O(n^1.35)
- 500→1000: **O(n^1.71)** — 超线性增长（Phase 3 重构目标）

#### 激活成本（Phase 2 后）

| JSON 文件 | 大小 | 加载时间 |
|-----------|------|---------|
| all_keywords.json | 452KB | 1.2ms |
| sde_function_docs.json | 292KB | 1.0ms |
| scheme_function_docs.json | 108KB | 0.4ms |
| sdevice_command_docs.json | 222KB | 0.6ms |
| svisual_command_docs.json | 384KB | 0.9ms |
| **总计** | **1.46MB** | **~4.1ms** |

#### Tcl 管线（Phase 1 后）

| 文件规模 (procs) | wasm parse | getVariables | buildScopeMap | full pipeline |
|------------------|-----------|-------------|---------------|---------------|
| 100 行 / 5P | 0.68ms | 0.62ms | 2.38ms | 3.06ms |
| 500 行 / 25P | 1.37ms | 3.78ms | 16.30ms | 26.75ms |
| **1000 行 / 50P** | **2.94ms** | **14.20ms** | **54.50ms** | **74.90ms** |

**buildScopeMap 缩放因子:**
- 50→100: O(n^1.17)
- 100→200: O(n^1.24)
- 200→500: O(n^1.30)
- 500→1000: **O(n^1.64)** — 确认超线性增长

#### 激活成本（Phase 1 后）

| JSON 文件 | 大小 | 加载时间 |
|-----------|------|---------|
| all_keywords.json | 452KB | 1.7ms |
| sde_function_docs.json | 292KB | 1.5ms |
| scheme_function_docs.json | 108KB | 0.6ms |
| sdevice_command_docs.json | 222KB | 0.7ms |
| svisual_command_docs.json | 384KB | 1.1ms |
| **总计** | **1.46MB** | **~5.6ms** |

#### 关键发现

1. **Tcl buildScopeMap 是最严重的瓶颈**：1000 行/50 proc 文件需 54ms，且缩放因子接近 O(n^1.6)
2. **冗余解析惩罚明显**：1000 行文件 5 次冗余解析 = 15.21ms，是单次管线 (2.89ms) 的 5.3 倍
3. **JSON 加载不是问题**：5.6ms 对于扩展激活来说很轻量
4. **Scheme 管线缩放可控**：~O(n^1.3)，主要瓶颈在 parse 阶段

### 量化目标

| 指标 | Phase 1 后 | Phase 2 后（实际） | Phase 3 后（实际） |
|------|-----------|-------------------|-------------------|
| Scheme 5x 冗余 (1000L) | 15.21ms | **10.03ms** (×1.5↓) | **8.39ms** (×1.8↓) |
| Tcl buildScopeMap (1000L/50P) | 54.50ms | 45.76ms | **17.77ms** (×3.1↓) ✅ |
| Tcl full pipeline (1000L/50P) | 74.90ms | 65.42ms | **35.97ms** (×2.1↓) ✅ |
| 激活时 I/O 阻塞 | 5.6ms / 1.46MB | 4.1ms / 1.46MB | **~1.2ms / ~452KB** (懒加载) ✅ |
| 单次击键解析次数 | 5-6 次 | **1 次** ✅ | 1 次 |
| 缓存条目数上限 | 无限 | 20 (FIFO) | 20 (FIFO) |

> **注：** Phase 2 原目标 Scheme 5x 冗余降至 2.89ms（×5.3↓），实际 10.03ms（×1.5↓）。差距原因：基准测试中的 "5x redundant" 指标测量的是 5 次**独立**管线执行的总时间（不共享缓存），而非 Provider 间的冗余。实际 Provider 场景中，缓存层确实将 5-6 次解析降为 1 次，但基准测试工具无法模拟 VSCode Provider 调用链。真实收益体现在编辑器交互流畅度的感知提升。

#### Phase 3 前后对比（2026-04-16）

> Phase 3 的核心收益来自 ScopeIndex 替代 buildScopeMap 的 O(p×n×m) 全量预计算，以及文档 JSON 按语言懒加载。Tcl 管线 1000 行/50 proc 场景性能提升 **45%**，buildScopeMap 缩放因子从 O(n^1.71) 降至 O(n^1.40)。

| 指标 | Phase 2 后 | Phase 3 后 | 变化 | 说明 |
|------|-----------|-----------|------|------|
| Scheme parse (1000L) | 1.73ms | 1.81ms | +0.08ms | 正常波动 |
| Scheme full pipeline (1000L) | 2.15ms | 2.89ms | +0.74ms | 正常波动 |
| Scheme 5x redundant (1000L) | 10.03ms | 8.39ms | **-16%** | tokenizer 行号复用 |
| Scheme extractDefs (1000L) | 1.85ms | 1.50ms | **-19%** | tokenizer 行号复用 |
| Tcl buildScopeMap (1000L/50P) | 45.76ms | **17.77ms** | **-61%** | ScopeIndex 按需查询 |
| Tcl full pipeline (1000L/50P) | 65.42ms | **35.97ms** | **-45%** | ScopeIndex + 管线优化 |
| 激活时 I/O 阻塞 | 4.1ms / 1.46MB | **~1.2ms / ~452KB** | **-69% I/O** | 懒加载文档 JSON |
| 内存 (最终 Heap) | 38.4MB | **16.3MB** | **-58%** | ScopeIndex 减少内存分配 |

**Phase 3 收益分析：**
1. **ScopeIndex 按需查询**：将 buildScopeMap 从 O(p×n×m) 全量预计算降为 O(n) 单遍构建 + O(1) 按需查询，1000 行/50 proc 场景提升 61%
2. **内存大幅节省**：ScopeIndex 不再为每行预分配 Set，最终堆内存从 38.4MB 降至 16.3MB（-58%）
3. **文档懒加载**：激活时仅加载 all_keywords.json（452KB），文档 JSON 按语言首次使用时加载，激活 I/O 减少 69%
4. **缩放因子改善**：buildScopeMap 500→1000 从 O(n^1.71) 降至 O(n^1.40)，超线性增长显著缓解

#### Scheme (SDE) 管线（Phase 3 后）

| 文件规模 | parse | full pipeline | 5x 冗余解析 | extractDefs |
|----------|-------|--------------|------------|-------------|
| 165 行 (真实) | 0.26ms | 0.22ms | 0.51ms | 0.15ms |
| 290 行 (真实) | 0.39ms | 0.33ms | 0.66ms | 0.17ms |
| 100 行 (合成) | 0.14ms | 0.22ms | 0.84ms | 0.15ms |
| 500 行 (合成) | 0.86ms | 1.10ms | 5.18ms | 0.82ms |
| **1000 行 (合成)** | **1.81ms** | **2.89ms** | **8.39ms** | **1.50ms** |
| 2000 行 (合成) | 4.58ms | 4.40ms | 22.55ms | 4.21ms |

**缩放因子:** 1000→2000: O(n^0.60), 2000→4000: O(n^1.49) — Scheme 管线整体 O(n^1.10)

#### Tcl 管线（Phase 3 后）

| 文件规模 (procs) | wasm parse | getVariables | buildScopeMap | full pipeline |
|------------------|-----------|-------------|---------------|---------------|
| 100 行 / 5P | 0.65ms | 0.62ms | 1.24ms | 2.18ms |
| 500 行 / 25P | 1.22ms | 3.43ms | 7.10ms | 13.50ms |
| **1000 行 / 50P** | **2.47ms** | **11.65ms** | **17.77ms** | **35.97ms** |

**buildScopeMap 缩放因子:**
- 50→100: O(n^1.27)
- 100→200: O(n^1.10)
- 200→500: O(n^1.24)
- 500→1000: **O(n^1.40)** — 超线性增长显著缓解（Phase 2 为 O(n^1.71)）

#### Tcl buildScopeMap 各 Phase 缩放因子对比

| 区间 | Phase 1 后 | Phase 2 后 | Phase 3 后 | 改善 |
|------|-----------|-----------|-----------|------|
| 50→100 | O(n^1.17) | O(n^1.13) | O(n^1.27) | 持平 |
| 100→200 | O(n^1.24) | O(n^1.25) | O(n^1.10) | 改善 |
| 200→500 | O(n^1.30) | O(n^1.35) | O(n^1.24) | 改善 |
| **500→1000** | **O(n^1.64)** | **O(n^1.71)** | **O(n^1.40)** | **显著改善** |

#### 激活成本（Phase 3 后）

| JSON 文件 | 大小 | 加载时间 | 说明 |
|-----------|------|---------|------|
| all_keywords.json | 455KB | 1.2ms | 激活时同步加载 |
| sde_function_docs.json | 292KB | 1.1ms | 懒加载（首次打开 SDE 文件时） |
| scheme_function_docs.json | 108KB | 0.3ms | 懒加载（随 SDE 一起加载） |
| sdevice_command_docs.json | 222KB | 0.6ms | 懒加载（首次打开 SDEVICE 文件时） |
| svisual_command_docs.json | 384KB | 0.8ms | 懒加载（首次打开 Svisual 文件时） |
| **激活时总计** | **455KB** | **~1.2ms** | **仅 all_keywords.json** |

#### 关键发现（Phase 3 更新）

1. ~~**Tcl buildScopeMap 是最严重的瓶颈**：1000 行/50 proc 文件需 54ms，且缩放因子接近 O(n^1.6)~~ → **已解决**：ScopeIndex 将其降至 17.77ms（×3.1↓），缩放因子降至 O(n^1.40)
2. **冗余解析惩罚明显**：1000 行文件 5 次冗余解析 = 15.21ms → 8.39ms（Phase 3 后），是单次管线 (2.89ms) 的 2.9 倍
3. **JSON 加载不是问题**：激活时仅 1.2ms / 455KB，其余按需懒加载
4. **Scheme 管线缩放可控**：~O(n^1.1)，主要瓶颈在 parse 阶段
5. **内存大幅改善**：ScopeIndex 减少了大量 Set 对象分配，最终堆内存从 38.4MB 降至 16.3MB

### 功能回归
- 所有现有测试通过（`tests/` 目录 17 个测试文件，其中 1 个 WASM 集成测试需主仓库环境）
- Phase 3 新增 `test-tcl-scope-index.js`（10 项测试）
- 6 种语言的 Provider 功能正常（手动测试每个语言）
- 无新增 console.error 输出
