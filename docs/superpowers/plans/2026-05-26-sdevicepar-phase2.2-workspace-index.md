# SDEVICE PAR Phase 2.2 实现计划：Workspace 全量扫描

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `.par` 文件实现 workspace 全量扫描索引，使补全包含 workspace 中其他 `.par` 文件的 scope/block/parameter 符号，并通过 FileSystemWatcher 实现增量更新。

**Architecture:** 在 Phase 2.1 的 `ParIndexService` 基础上新增 `workspaceIndex`（`Map<uri, ParSymbol[]>`），存储 workspace 中所有 `.par` 文件的解析结果（标记 `source: "workspace"`，优先级 2）。`getCompletionsAt()` 在 scopeName 分支和普通分支都合并 `cached.symbols + getWorkspaceSymbols()`，由 `buildParCompletions` 的 `dedupeAndSort` 按 source 优先级去重（current:0 > include:1 > workspace:2 > materialdb:3 > builtin:4）。extension.js 在 activate 时通过 `findFiles('**/*.par')` 发现文件，同步解析后注入 workspaceIndex；`FileSystemWatcher` 监听后续 create/change/delete，变更时调用 `onFileChanged()` 同时清 includeRawCache 和 currentFileCache。

**Tech Stack:** 纯 CommonJS JavaScript，VSCode Extension API（findFiles / FileSystemWatcher），纯 Node.js assert 测试。

**Spec:** `docs/superpowers/specs/2026-05-26-sdevicepar-phase2-workspace-index-design.md` §9 Level 2 + §13 缓存 + §14 Phase 2.2

---

## Preflight：核对 Phase 2.1 代码状态

实现前必须了解的 Phase 2.1 代码事实，源自 `main` 分支 `3c78a7f` 之后的真实代码。

### ParIndexService 已有方法（`par-index-service.js`）

| 方法/数据 | 当前行为 |
|-----------|----------|
| `currentFileCache` | `Map<"uri:v{version}", ParResolvedResult>`，FIFO 上限 20 |
| `includeRawCache` | `Map<uri, ParParseResult>`，key 是 **resolved filesystem path**（不是 URI string） |
| `resolveIncludes(includes, baseUri, outerPrefix, includeChain, depth)` | 递归解析 include，graft symbols 到 parentPath |
| `parseCurrentFile(document)` | 解析当前文件 + include 递归，结果缓存到 `currentFileCache` |
| `getCompletionsAt(document, position, lineText?)` | 热路径，只查 `currentFileCache`，**不查 workspace**。两个调用分支：scopeName（传 lineText）和普通（不传 lineText）。**Phase 2.2 必须在两个分支都合并 workspace symbols** |
| `onFileClosed(uri)` | 清除 `currentFileCache` 中该 uri 的所有条目 + 清除 `includeRawCache`（URI → filesystem path 转换后） |
| `onFileChanged(uri)` | **空存根**（函数体为空注释）。Phase 2.2 必须实现 |
| `dispose()` | 清除 `currentFileCache` + `includeRawCache` |

### register-completion-providers.js 调用模式

sdevicepar 分支中的补全调用流程：
1. **scope name 检测**：传 `lineText` 给 `parIndexService.getCompletionsAt(document, position, lineText)`，内部先做 `detectScopeNameContext` 检测。若匹配，返回 scope name 补全项（`kind === 'scopeName'`），Provider 直接映射为 `CompletionItemKind.Value` 并返回。
2. **block/parameter 补全**：不传 lineText，调用 `parIndexService.getCompletionsAt(document, position)`。返回 scopeType/block/parameter 补全项，Provider 映射为 `Module`/`Class`/`Property`。
3. **fallback**：如果 `parConverted === null`（缓存未就绪或 lexical gate 拦截），走后续 `all_keywords` fallback。

### par-completion.js 聚合行为

`buildParCompletions` 的 block 和 parameter 补全按 **scopeType** 聚合，忽略具体 scope name：
- **block 补全**：`symbols.filter(s => parts.length === 2 && parts[0] === scopeType)`。即 `Material/Silicon/Bandgap` 的 block `Bandgap` 也适用于 `Material/Oxide`。
- **parameter 补全**：`symbols.filter(s => parts.length === 3 && parts[0] === scopeType && parts[2] === blockName)`。即 `Material/Silicon/Bandgap/Eg0` 的参数也适用于 `Material/Oxide/Bandgap`。

**测试必须按此行为编写**：workspace 的 `Material/Silicon/Bandgap` block 应出现在当前文件 `Material/MyMat` scope 内的补全中。

### 缓存 key 类型差异

| 缓存 | key 类型 | 示例 |
|------|----------|------|
| `currentFileCache` | URI string + version | `"file:///test.par:v1"` |
| `includeRawCache` | **resolved filesystem path** | `"/ws/Silicon.par"` 或 `"Silicon.par"`（取决于 resolveFilePath 返回值） |
| `workspaceIndex`（Phase 2.2 新增） | **URI string** | `"file:///ws/Silicon.par"` |

`onFileChanged(uri)` 从 watcher 接收 URI string，需转为 filesystem path 后操作 `includeRawCache`，同时直接清 `currentFileCache`（key 包含 URI）。

---

## Phase 2.2 明确不做

| 不做 | 原因 |
|------|------|
| MaterialDB preload | Phase 2.3 |
| ~~修改 `par-parser.js`~~ | ~~Parser 逻辑完备，无需改动~~ | **已修改**：新增 `findMatchingBrace` + `parseInlineContent` 辅助函数，修改 RE_SCOPE/pending block/RE_BLOCK 三个 handler 支持单行嵌套解析（如 `Bandgap { Eg0 = 1.12 }`） |
| 修改 TextMate grammar / snippets / all_keywords | 不在本 Phase 范围 |
| 引入异步 completion 热路径 | `getCompletionsAt` 必须同步 |
| 修改 `register-completion-providers.js` Provider 架构 | 只需数据层扩展，不改注册结构 |
| 扩展 Hover / Definition | Phase 2.4 |
| workspace include graph / 递归解析 workspace 文件内部 include | Phase 2.2 只做 workspace 文件 direct symbols 扫描；include graph 留给后续优化 |

---

## 设计决策

### 1. workspaceIndex 存储 symbols 而非 raw ParParseResult

| 选项 | 存储 | 优势 | 劣势 |
|------|------|------|------|
| **symbols（Phase 2.2 采用）** | `Map<uri, ParSymbol[]>`（已标记 source: "workspace"） | `getCompletionsAt()` 直接 concat，无需每次 re-tag | 无法从 workspaceIndex 反查 includes（Phase 2.2 不需要） |
| raw ParParseResult | `Map<uri, ParParseResult>` | 完整数据，可做 include 链追踪 | 每次查询需 re-tag source，内存占用略高 |

**理由**：Phase 2.2 的 workspaceIndex 只索引每个 workspace `.par` 文件自身直接解析得到的 raw symbols，不递归 resolve 该 workspace 文件内部的 `#include` / `Insert`。当前打开文件的 include/Insert 仍由 `parseCurrentFile + resolveIncludes` 处理。片段式 `.par` 文件若未被当前打开文件 include，可能无法自动嫁接到 `Material/Region` scope；这是 Phase 2.2 的已知限制，后续可扩展 workspace include graph。workspaceIndex 只需要 flat symbols 列表用于补全聚合，存储预标记 symbols 减少热路径开销。

### 2. workspaceIndex 包含所有 workspace .par 文件（含当前打开的文件）

**理由**：
- `dedupeAndSort` 按 `(name)` 去重，保留 source 优先级最高的（`current`:0 > `workspace`:2）
- 当前文件同时存在于 `currentFileCache`（source: "current"）和 `workspaceIndex`（source: "workspace"），去重自动选择前者
- 无需维护 "当前打开文件" 列表来过滤 workspaceIndex，简化实现

### 3. onFileChanged 同时清 includeRawCache 和 currentFileCache

**场景**：文件 A include 文件 B，B 在磁盘上变更（由 FileSystemWatcher 检测）。
**问题**：如果只清 `includeRawCache`，`currentFileCache` 中 A 的 resolved result（version 未变）仍然包含旧的 grafted B symbols。
**实现**：`onFileChanged(uri)` 做两件事：
1. 转为 filesystem path，从 `includeRawCache` 删除
2. 粗粒度 `currentFileCache.clear()`，确保下次 `parseCurrentFile` 重新 resolve

粗粒度清 `currentFileCache` 而非按 URI 精确清除，是因为 B 可能被多个文件的 include 链引用，精确追踪反向依赖成本过高。清空后，打开的文档会通过 `preheatOpenParDocuments()` 或下次 debounce 立即重建缓存。

### 4. workspace 扫描为 fire-and-forget 异步

**理由**：
- `activate()` 不阻塞——扫描在后台完成
- 扫描完成前的补全请求只使用 current + include + builtin，功能不降级
- 典型 workspace 只有 5-20 个 .par 文件，扫描 < 1s

### 5. getWorkspaceSymbols 热路径性能权衡

`getWorkspaceSymbols()` 每次 completion 请求都 flatten `workspaceIndex.values()` 创建新数组。Phase 2.2 **有意暂缓优化**，理由：
- 典型 workspace 5-20 个 .par 文件，每个 < 100 symbols，总 flat array < 2000 元素
- `Array.concat()` 对 < 2000 元素耗时 < 0.1ms，远低于 VSCode completion 的 50ms 延迟预算
- 如果后续 workspace 规模增大，可引入 `workspaceSymbolsFlat` + `workspaceIndexDirty` flag，add/remove 时置 dirty，`getWorkspaceSymbols()` dirty 时重建否则返回缓存

---

## 文件结构

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/lsp/sdevicepar/par-index-service.js` | 新增 `workspaceIndex` Map + `addWorkspaceFile` / `removeWorkspaceFile` / `getWorkspaceSymbols` / `clearIncludeCacheForFile` 方法；修改 `getCompletionsAt` 两个分支合并 workspace symbols；实现 `onFileChanged`（清 includeRawCache + 清 currentFileCache）；更新 `dispose` |
| `src/extension.js` | 新增 `scanWorkspaceParFiles()` + `uriToFsPath()` + `preheatOpenParDocuments()`；注册 `FileSystemWatcher('**/*.par')`，create/change/delete 均维护 workspaceIndex；create/change/delete 后调用 `onFileChanged` + `preheatOpenParDocuments` |
| `tests/test-par-index.js` | 新增 workspace 基础测试 + 补全合并测试 + 缓存失效测试 + 集成测试 |

### 不修改文件

| 文件 | 原因 |
|------|------|
| ~~`src/lsp/sdevicepar/par-parser.js`~~ | ~~workspace 扫描复用现有 parseParText~~ | **已修改**：新增 `findMatchingBrace(str, openPos)` 定位匹配 `}`，`parseInlineContent(content, ...)` 递归解析 `{ }` 间内联符号。三个 handler（RE_SCOPE step5、pending block step7、RE_BLOCK step8）在 `symbols.push()` 后调用 `parseInlineContent`，不触碰主解析栈 |
| `src/lsp/sdevicepar/par-context.js` | 上下文逻辑不变 |
| `src/lsp/sdevicepar/par-completion.js` | dedupeAndSort 已支持 workspace source 优先级 |
| `src/lsp/sdevicepar/par-constants.js` | SOURCE_PRIORITY 已包含 workspace: 2 |
| `src/register-completion-providers.js` | 补全入口不变，数据层扩展 |
| `package.json` | Phase 2.2 不新增配置项 |
| `syntaxes/sdevicepar.tmLanguage.json` | 高亮层不变 |
| `snippets/sdevicepar.json` | snippets 不变 |
| `syntaxes/all_keywords.json` | 保留为 fallback |

---

## Task 1: Workspace Index 数据结构 + addWorkspaceFile / removeWorkspaceFile

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js`
- Test: `tests/test-par-index.js`

- [ ] **Step 1: 写 addWorkspaceFile 测试**

在 `tests/test-par-index.js` 的 `summary()` 调用之前追加：

```js
// ── Phase 2.2: Workspace Index 数据结构 ───────────

test('addWorkspaceFile stores symbols with source "workspace"', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Bandgap {',
        '  Eg0 = 1.12',
        '}',
    ].join('\n') + '\n');

    const syms = service.getWorkspaceSymbols();
    const eg0 = syms.find(s => s.name === 'Eg0');
    assert.ok(eg0, 'Should find Eg0 in workspace symbols');
    assert.strictEqual(eg0.source, 'workspace');
    service.dispose();
});

test('removeWorkspaceFile removes symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Bandgap {\n  Eg0 = 1.12\n}\n');
    service.removeWorkspaceFile('file:///ws/Silicon.par');

    const syms = service.getWorkspaceSymbols();
    assert.strictEqual(syms.length, 0, 'Should have no workspace symbols after removal');
    service.dispose();
});

test('addWorkspaceFile overwrites previous entry', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Bandgap {\n  Eg0 = 1.12\n}\n');
    service.addWorkspaceFile('file:///ws/Silicon.par', 'Epsilon {\n  eps = 11.7\n}\n');

    const syms = service.getWorkspaceSymbols();
    assert.strictEqual(syms.length, 2, 'Should have 2 symbols (Epsilon block + eps param)');
    assert.ok(syms.find(s => s.name === 'eps'), 'Should have eps from second parse');
    assert.ok(!syms.find(s => s.name === 'Eg0'), 'Should NOT have Eg0 from first parse');
    service.dispose();
});

test('getWorkspaceSymbols returns empty array when no workspace files', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.deepStrictEqual(service.getWorkspaceSymbols(), []);
    service.dispose();
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-par-index.js`
Expected: FAIL — `service.addWorkspaceFile is not a function`

- [ ] **Step 3: 实现 workspaceIndex + addWorkspaceFile / removeWorkspaceFile / getWorkspaceSymbols**

在 `src/lsp/sdevicepar/par-index-service.js` 中：

在 `includeRawCache` 声明（第 28 行）之后追加：

```js
    // workspaceIndex: Map<uri, ParSymbol[]> — workspace .par 文件符号（标记 source: "workspace"）
    // key 为 URI string（与 currentFileCache 一致），value 为已标记 source 的 symbol 数组
    const workspaceIndex = new Map();
```

在 `resolveIncludes` 函数（第 97 行）之前追加三个新方法：

```js
    /**
     * 添加 workspace 文件到索引。解析文本并将所有 symbol 标记为 source: "workspace"。
     * @param {string} uri - 文件 URI string
     * @param {string} text - 文件文本内容
     */
    function addWorkspaceFile(uri, text) {
        const rawResult = parseParText(text, uri);
        const symbols = rawResult.symbols.map(s => ({
            ...s,
            source: 'workspace',
            filePath: uri,
        }));
        workspaceIndex.set(uri, symbols);
    }

    /**
     * 从索引中移除 workspace 文件。
     * @param {string} uri - 文件 URI string
     */
    function removeWorkspaceFile(uri) {
        workspaceIndex.delete(uri);
    }

    /**
     * 获取所有 workspace 文件的符号（扁平化数组）。
     * Phase 2.2 性能权衡：每次调用 flatten workspaceIndex.values()，
     * 典型场景 5-20 文件 < 2000 symbols，耗时 < 0.1ms。
     * @returns {object[]}
     */
    function getWorkspaceSymbols() {
        const all = [];
        for (const symbols of workspaceIndex.values()) {
            all.push(...symbols);
        }
        return all;
    }
```

在 `dispose()` 函数中 `includeRawCache.clear()` 之后追加：

```js
        workspaceIndex.clear();
```

在 return 对象中追加（在 `dispose` 之前）：

```js
        addWorkspaceFile,
        removeWorkspaceFile,
        getWorkspaceSymbols,
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-par-index.js`
Expected: PASS — 所有新增测试通过

- [ ] **Step 5: Commit**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-index.js
git commit -m "feat(sdevicepar): 添加 workspaceIndex 数据结构和基础方法"
```

---

## Task 2: 合并 workspace symbols 到 getCompletionsAt

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js`
- Test: `tests/test-par-index.js`

**前置知识**：`getCompletionsAt` 有两个 `buildParCompletions` 调用分支：
1. scopeName 分支（传 lineText 时检测到引号内）
2. 普通分支（block / parameter / scopeType）

两个分支都必须合并 workspace symbols。

**光标位置规则**：
- scopeType 补全：光标在文件顶层（stack 为空）的空行
- block 补全：光标在 scope 内部的空行（stack top 是 scope）
- parameter 补全：光标在 block 内部的空行（stack top 是 block）

- [ ] **Step 1: 写 workspace 补全合并测试**

在 `tests/test-par-index.js` 的 `summary()` 之前追加：

```js
// ── Phase 2.2: Workspace 补全合并 ───────────────

test('getCompletionsAt merges workspace block symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    // 当前文件：Material scope 内有空行
    const doc = mockDoc('Material = "MyMat" {\n  \n}\n', 1);
    service.parseCurrentFile(doc);

    // workspace 文件：Material scope 下有 Bandgap block
    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '}',
    ].join('\n') + '\n');

    // line 1 是 scope 内部空行（stack top = Material/MyMat scope）→ block 补全
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const labels = items.map(i => i.label);
    // par-completion.js 按 scopeType 聚合，workspace 的 Material/Silicon/Bandgap
    // 适用于当前 Material/MyMat scope
    assert.ok(labels.includes('Bandgap'), 'Should include Bandgap from workspace (scopeType aggregation)');
    service.dispose();
});

test('getCompletionsAt dedup prefers current over workspace', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    // 当前文件有 Bandgap { Eg0 = 1.12 }
    const doc = mockDoc('Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.12\n  }\n}\n', 1);
    service.parseCurrentFile(doc);

    // workspace 文件也有 Bandgap { Eg0 = 1.16964 }
    service.addWorkspaceFile('file:///ws/other.par', 'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.16964\n  }\n}\n');

    // line 2 是 Bandgap block 内部 → parameter 补全
    const items = service.getCompletionsAt(doc, { line: 2, character: 4 });
    const eg0Items = items.filter(i => i.label === 'Eg0');
    assert.strictEqual(eg0Items.length, 1, 'Should deduplicate Eg0 to 1 item');
    // current (priority 0) beats workspace (priority 2)
    assert.strictEqual(eg0Items[0].detail, '[par] = 1.12', 'Should use current value (1.12), not workspace value');
    service.dispose();
});

test('getCompletionsAt includes workspace scope names in quote', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const doc = mockDoc('Material = "Silicon" {\n}\n', 1);
    service.parseCurrentFile(doc);

    // workspace 有不同的 scope name
    service.addWorkspaceFile('file:///ws/other.par', 'Material = "Oxide" {\n  Epsilon {\n    eps = 3.9\n  }\n}\n');

    // scopeName 分支：传 lineText 检测引号内位置
    const lineText = 'Material = "Si"';
    const items = service.getCompletionsAt(doc, { line: 0, character: 13 }, lineText);
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Oxide'), 'Should include Oxide from workspace scope names');
    // 不应出现 block/parameter（scopeName 分支只返回 scope name）
    assert.ok(!labels.includes('Bandgap'), 'Should not include block in scopeName context');
    service.dispose();
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-par-index.js`
Expected: FAIL — workspace symbols 不在补全结果中（`getWorkspaceSymbols` 未被调用）

- [ ] **Step 3: 修改 getCompletionsAt 合并 workspace symbols**

在 `src/lsp/sdevicepar/par-index-service.js` 的 `getCompletionsAt` 函数中，修改**两处** `buildParCompletions` 调用：

**scope name 分支**（`detectScopeNameContext` 匹配后）：

找到：
```js
                return buildParCompletions(
                    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
                    cached.symbols,
                );
```

替换为：
```js
                return buildParCompletions(
                    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
                    cached.symbols.concat(getWorkspaceSymbols()),
                );
```

**普通分支**（函数末尾）：

找到：
```js
        return buildParCompletions(ctx, cached.symbols);
```

替换为：
```js
        return buildParCompletions(ctx, cached.symbols.concat(getWorkspaceSymbols()));
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-par-index.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-index.js
git commit -m "feat(sdevicepar): getCompletionsAt 两个分支合并 workspace symbols"
```

---

## Task 3: 实现 onFileChanged + clearIncludeCacheForFile

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js`
- Test: `tests/test-par-index.js`

**设计要点**：
- `clearIncludeCacheForFile(filePath)`：只做 `includeRawCache.delete(filePath)`。细粒度，精确删除单个条目。
- `onFileChanged(uriOrPath)`：转 URI → filesystem path，调用 `clearIncludeCacheForFile`，然后粗粒度 `currentFileCache.clear()`。粗粒度清空是为了防止当前打开文档的 resolved include symbols 因 document.version 未变而保持 stale。

- [ ] **Step 1: 写缓存失效测试**

在 `tests/test-par-index.js` 的 `summary()` 之前追加：

```js
// ── Phase 2.2: 缓存失效 ──────────────────────

test('onFileChanged invalidates includeRawCache and currentFileCache', () => {
    // 使用 mutable fileMap 模拟磁盘文件变更
    const fileMap = { 'lib.par': 'OldParam = 1\n' };
    const readFile = (p) => {
        const basename = path.basename(p);
        if (fileMap[basename]) return fileMap[basename];
        throw new Error('ENOENT: ' + p);
    };
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });

    // 解析：include lib.par → 应看到 OldParam
    const doc = mockDoc('#include "lib.par"\n', 1);
    const r1 = service.parseCurrentFile(doc);
    assert.ok(r1.symbols.find(s => s.name === 'OldParam'), 'Should see OldParam initially');
    assert.ok(!r1.symbols.find(s => s.name === 'NewParam'), 'Should NOT see NewParam initially');

    // 模拟 lib.par 在磁盘上变更
    fileMap['lib.par'] = 'NewParam = 2\n';
    service.onFileChanged('lib.par');

    // 同一 document version 的缓存应被清除，重新解析应看到 NewParam
    const r2 = service.parseCurrentFile(doc);
    assert.ok(r2.symbols.find(s => s.name === 'NewParam'), 'After onFileChanged, should see NewParam');
    assert.ok(!r2.symbols.find(s => s.name === 'OldParam'), 'After onFileChanged, should NOT see OldParam');

    service.dispose();
});

test('clearIncludeCacheForFile clears only the selected include raw entry', () => {
    const fileMap = { 'a.par': 'AParam = 1\n', 'b.par': 'BParam = 2\n' };
    let readCount = 0;
    const readFile = (p) => {
        readCount++;
        const basename = path.basename(p);
        if (fileMap[basename]) return fileMap[basename];
        throw new Error('ENOENT: ' + p);
    };
    const service = createParIndexService({
        extensionPath: '/ext',
        readFile,
        resolveFilePath: (refPath) => refPath,
    });

    // 第 1 次 parse：应读取两个 include 文件
    service.parseCurrentFile(mockDoc('#include "a.par"\n#include "b.par"\n', 1));
    assert.strictEqual(readCount, 2, 'First parse should read both include files');

    // 第 2 次 parse（新 version）：不清缓存，不应重新读取
    readCount = 0;
    service.parseCurrentFile(mockDoc('#include "a.par"\n#include "b.par"\n', 2));
    assert.strictEqual(readCount, 0, 'Second parse should use cached raw results');

    // 只清除 a.par 的 include raw cache
    service.clearIncludeCacheForFile('a.par');

    // 第 3 次 parse（新 version）：应只重新读取 a.par
    readCount = 0;
    service.parseCurrentFile(mockDoc('#include "a.par"\n#include "b.par"\n', 3));
    assert.strictEqual(readCount, 1, 'After clearing a.par only, should re-read only a.par');

    service.dispose();
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `node tests/test-par-index.js`
Expected: FAIL — `service.clearIncludeCacheForFile is not a function` 或 onFileChanged 未清 currentFileCache 导致旧结果缓存

- [ ] **Step 3: 实现 onFileChanged 和 clearIncludeCacheForFile**

在 `src/lsp/sdevicepar/par-index-service.js` 中：

将 `onFileChanged` 函数（当前为空存根）替换为：

```js
    /**
     * 文件变更通知（由 FileSystemWatcher 调用）。
     * 清除 includeRawCache 中该文件的 raw result，
     * 并粗粒度清空 currentFileCache 防止已解析的 include symbols stale。
     * @param {string} uriOrPath - 文件 URI string 或 filesystem path
     */
    function onFileChanged(uriOrPath) {
        // 1. 清除 includeRawCache（key 为 filesystem path）
        try {
            const fp = uriOrPath.startsWith('file://') ? fileURLToPath(uriOrPath) : uriOrPath;
            includeRawCache.delete(fp);
        } catch (_) {
            includeRawCache.delete(uriOrPath);
        }
        // 2. 粗粒度清空 currentFileCache
        //    原因：当前打开的文档可能 include 了变更文件，
        //    其 resolved result 中包含旧的 grafted symbols。
        //    由于 document.version 未变，parseCurrentFile 会命中缓存返回旧结果。
        //    清空后，下次 parseCurrentFile 会重新解析 + 重新 resolveIncludes。
        currentFileCache.clear();
    }

    /**
     * 精确清除 includeRawCache 中指定文件的缓存。
     * key 为 filesystem path（与 resolveFilePath 返回值一致）。
     * @param {string} filePath - 文件系统路径
     */
    function clearIncludeCacheForFile(filePath) {
        includeRawCache.delete(filePath);
    }
```

在 return 对象中追加 `clearIncludeCacheForFile`：

```js
        clearIncludeCacheForFile,
```

- [ ] **Step 4: 运行测试验证通过**

Run: `node tests/test-par-index.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-index.js
git commit -m "feat(sdevicepar): 实现 onFileChanged（清 includeRawCache + currentFileCache）和 clearIncludeCacheForFile"
```

---

## Task 4: Extension.js 集成 — Workspace 扫描 + FileSystemWatcher

**Files:**
- Modify: `src/extension.js`

**前置知识**：`extension.js` 当前没有引入 `url` 模块；Task 4 需要在顶部新增：`const { fileURLToPath } = require('url');`

- [ ] **Step 1: 添加 url 模块引入和 helper 函数**

在 `src/extension.js` 顶部（约第 1-3 行），在现有 `require` 区域中追加：

```js
const { fileURLToPath } = require('url');
```

在 `activate` 函数内，`parIndexService = createParIndexService(...)` 代码块（约第 165-168 行）之后，添加以下代码：

```js
    // ── Phase 2.2: Workspace .par 文件扫描 ──────────────────

    /**
     * 将 VSCode Uri 转为 filesystem path。
     * 优先使用 uri.fsPath（平台感知），fallback 使用 Node fileURLToPath。
     */
    function uriToFsPath(uri) {
        try {
            return uri.fsPath;
        } catch (_) {
            try { return fileURLToPath(uri.toString()); }
            catch (_) { return uri.toString(); }
        }
    }

    /**
     * 遍历已打开的 sdevicepar 文档，重新解析以更新缓存。
     * 用于 FileSystemWatcher 检测到文件变更后，刷新打开文档的 include 解析结果。
     */
    function preheatOpenParDocuments() {
        for (const doc of vscode.workspace.textDocuments) {
            if (doc.languageId === 'sdevicepar' && parIndexService) {
                try { parIndexService.parseCurrentFile(doc); }
                catch (_) { /* 静默：不阻塞 watcher 处理 */ }
            }
        }
    }

    async function scanWorkspaceParFiles() {
        if (!vscode.workspace.workspaceFolders || !parIndexService) return;
        try {
            const parFiles = await vscode.workspace.findFiles('**/*.par');
            for (const fileUri of parFiles) {
                try {
                    const text = fs.readFileSync(uriToFsPath(fileUri), 'utf8');
                    parIndexService.addWorkspaceFile(fileUri.toString(), text);
                } catch (e) {
                    // 开发阶段可取消注释以下行排查：
                    // console.warn(`Sentaurus: failed to read workspace .par file ${fileUri}: ${e.message}`);
                }
            }
        } catch (_) { /* findFiles failed — 无 workspace 或权限问题 */ }
    }

    // Fire-and-forget: 不阻塞 activate
    scanWorkspaceParFiles();
```

- [ ] **Step 2: 添加 FileSystemWatcher**

在 `scanWorkspaceParFiles()` 调用之后，添加：

```js
    // FileSystemWatcher: workspace .par 文件增量更新
    const parWatcher = vscode.workspace.createFileSystemWatcher('**/*.par');
    parWatcher.onDidCreate(uri => {
        if (!parIndexService) return;
        try {
            const text = fs.readFileSync(uriToFsPath(uri), 'utf8');
            parIndexService.addWorkspaceFile(uri.toString(), text);
        } catch (_) {}
        // 新建文件也可能使已有 #include 从 unresolved 变为 resolved，
        // 因此需要清 currentFileCache 并刷新打开文档。
        parIndexService.onFileChanged(uri.toString());
        preheatOpenParDocuments();
    });
    parWatcher.onDidChange(uri => {
        if (!parIndexService) return;
        try {
            const text = fs.readFileSync(uriToFsPath(uri), 'utf8');
            parIndexService.addWorkspaceFile(uri.toString(), text);
        } catch (_) {}
        // onFileChanged 同时清 includeRawCache + currentFileCache
        parIndexService.onFileChanged(uri.toString());
        // 刷新已打开的 .par 文档缓存
        preheatOpenParDocuments();
    });
    parWatcher.onDidDelete(uri => {
        if (!parIndexService) return;
        parIndexService.removeWorkspaceFile(uri.toString());
        // onFileChanged 处理 include 链失效
        parIndexService.onFileChanged(uri.toString());
        preheatOpenParDocuments();
    });
    context.subscriptions.push(parWatcher);
```

- [ ] **Step 3: 运行全量测试验证无回归**

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js && node tests/test-par-index.js`
Expected: PASS — 所有测试通过

- [ ] **Step 4: Commit**

```bash
git add src/extension.js
git commit -m "feat(sdevicepar): 添加 workspace 扫描、FileSystemWatcher 增量更新和 open document preheat"
```

---

## Task 5: 集成测试 — workspace 跨文件补全 + 优先级 + 隔离

**Files:**
- Test: `tests/test-par-index.js`

此 Task 聚焦高价值集成测试：多 workspace 文件聚合、cross-file parameter 补全、三层来源优先级、scopeType 隔离验证。

- [ ] **Step 1: 写集成测试**

在 `tests/test-par-index.js` 的 `summary()` 之前追加：

```js
// ── Phase 2.2: 集成测试 ──────────────────────

test('multiple workspace files aggregate blocks', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '}',
    ].join('\n') + '\n');

    service.addWorkspaceFile('file:///ws/Oxide.par', [
        'Material = "Oxide" {',
        '  Epsilon {',
        '    eps = 3.9',
        '  }',
        '}',
    ].join('\n') + '\n');

    // 当前文件：空 Material scope
    const doc = mockDoc('Material = "MyMat" {\n  \n}\n', 1);
    service.parseCurrentFile(doc);

    // scope 内空行 → block 补全
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Bandgap'), 'Should include Bandgap from Silicon.par');
    assert.ok(labels.includes('Epsilon'), 'Should include Epsilon from Oxide.par');
    service.dispose();
});

test('workspace parameter completion across files', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    // 当前文件有 Bandgap block（但无参数）
    const doc = mockDoc('Material = "MyMat" {\n  Bandgap {\n  }\n}\n', 1);
    service.parseCurrentFile(doc);

    // workspace 文件有 Bandgap 的参数
    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '    Chi0 = 4.05',
        '  }',
        '}',
    ].join('\n') + '\n');

    // line 2 是 Bandgap block 内部空行 → parameter 补全
    const items = service.getCompletionsAt(doc, { line: 2, character: 4 });
    const labels = items.map(i => i.label);
    assert.ok(labels.includes('Eg0'), 'Should suggest Eg0 from workspace');
    assert.ok(labels.includes('Chi0'), 'Should suggest Chi0 from workspace');
    service.dispose();
});

test('current > include > workspace dedup priority', () => {
    const { buildParCompletions } = require('../src/lsp/sdevicepar/par-completion');
    const ctx = { completableKind: 'parameter', parentPath: 'Material/Si/Bandgap', scopeType: 'Material', pendingBlockName: null };

    // 三层来源都有 Eg0，值不同
    const symbols = [
        { kind: 'parameter', name: 'Eg0', value: '1.10', parentPath: 'Material/Si/Bandgap', source: 'workspace' },
        { kind: 'parameter', name: 'Eg0', value: '1.12', parentPath: 'Material/Si/Bandgap', source: 'include' },
        { kind: 'parameter', name: 'Eg0', value: '1.16964', parentPath: 'Material/Si/Bandgap', source: 'current' },
    ];
    const items = buildParCompletions(ctx, symbols);
    const eg0 = items.find(i => i.label === 'Eg0');
    assert.ok(eg0);
    assert.strictEqual(eg0.source, 'current', 'current (priority 0) should win over include (1) and workspace (2)');
    assert.strictEqual(eg0.detail, '[par] = 1.16964', 'Should use current value');
});

test('workspace Material blocks do not pollute Region scope', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    // 当前文件：Region scope（内部空行）
    const doc = mockDoc('Region = "active" {\n  \n}\n', 1);
    service.parseCurrentFile(doc);

    // workspace 文件：Material scope 下有 Bandgap block
    service.addWorkspaceFile('file:///ws/Silicon.par', [
        'Material = "Silicon" {',
        '  Bandgap {',
        '    Eg0 = 1.12',
        '  }',
        '}',
    ].join('\n') + '\n');

    // line 1 是 Region scope 内部空行 → block 补全
    // par-completion.js block 聚合按 scopeType 过滤：
    // workspace 的 Bandgap parentPath = "Material/Silicon"（parts[0] = "Material"），
    // 不匹配当前 scopeType = "Region"，因此不应出现
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const labels = items.map(i => i.label);
    assert.ok(!labels.includes('Bandgap'), 'Material block should not appear in Region scope');
    service.dispose();
});
```

- [ ] **Step 2: 运行测试验证通过**

Run: `node tests/test-par-index.js`
Expected: PASS — 所有集成测试通过

- [ ] **Step 3: Commit**

```bash
git add tests/test-par-index.js
git commit -m "test(sdevicepar): 添加 Phase 2.2 集成测试（跨文件聚合、优先级、scopeType 隔离）"
```

---

## Task 6: 全量回归测试 + 手动验证

**Files:**
- All test files

- [ ] **Step 1: 运行全量测试套件**

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js && node tests/test-par-index.js`
Expected: PASS

- [ ] **Step 2: 启动 Extension Development Host 手动验证**

1. 按 F5 启动 Extension Development Host
2. 在新窗口中打开一个包含多个 `.par` 文件的 workspace
3. 打开一个 `.par` 文件
4. 验证：
   - scope 内空行键入时，能看到 workspace 其他文件中的 block 名
   - block 内空行键入时，能看到 workspace 其他文件中的 parameter 名
   - `Material = "|"` 引号内能看到 workspace 中的 scope 名（如 Oxide、Germanium）
   - 顶层空行能看到 scope type 补全（Material/Region/...）
5. 在外部编辑器中修改 workspace 中的一个 `.par` 文件（添加新 parameter），保存
6. 返回 VSCode，验证补全中包含新添加的 parameter
7. **新建验证**：在 workspace 中新建一个 `.par` 文件（~~必须多行，当前 parser 是 line-oriented 不支持单行嵌套~~ **现已支持单行嵌套**，多行和单行格式均可），内容如下，保存：
   ```par
   Material = "TestMat" {
     NewBlock {
       NewParam = 1.0
     }
   }
   ```
   单行格式同样有效：`Material = "TestMat" { NewBlock { NewParam = 1.0 } }`
8. 返回 VSCode 打开的 `.par` 文件，在 `Material = "..." { }` scope 内空行键入，确认补全中出现 `NewBlock`；进入 `NewBlock` 后确认出现 `NewParam`
9. **删除验证**：删除该新建的 `.par` 文件，返回 VSCode 确认 `NewBlock` / `NewParam` 补全项消失
10. **include create 验证**（~~必须多行~~ **现已支持单行嵌套**）：在已有打开文件的 `Material` scope 内写好 `#include "new.par"`（`new.par` 不存在），例如：
    ```par
    Material = "TestMat" {
      #include "new.par"
    }
    ```
    确认此时无 include 补全；然后创建 `new.par`（多行或单行均可），内容：
    ```par
    Bandgap {
      Eg0 = 1.12
    }
    ```
    等待 watcher 检测后，在 `Material` scope 内验证 `Bandgap` 出现，进入 `Bandgap` 内验证 `Eg0` 出现。`#include` 必须位于 `Material` scope 内，否则 fragment 的 `Bandgap` 无法 graft 到 `Material/TestMat` parentPath

- [ ] **Step 3: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix(sdevicepar): 修复 Phase 2.2 集成测试中发现的问题"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|-----------|----------|
| workspace `.par` 文件扫描逻辑 | Task 4（scanWorkspaceParFiles） |
| 文件 watcher 增量更新 | Task 4（FileSystemWatcher create/change/delete） |
| workspace 文件索引合并 | Task 2（getCompletionsAt 两处 concat） |
| 打开 workspace 自动扫描所有 `.par` 文件 | Task 4（fire-and-forget scanWorkspaceParFiles） |
| 补全包含 workspace 中其他文件的参数 | Task 5（cross-file parameter completion 测试） |
| 文件变更后增量更新索引 | Task 3（onFileChanged） + Task 4（watcher + preheatOpenParDocuments） |
| source 优先级 current > include > workspace > materialdb > builtin | Task 5（三层 dedup priority 测试） |

### 2. Placeholder Scan

无 TBD / TODO / "implement later" / "add validation" 等占位符。

### 3. Type Consistency

- `addWorkspaceFile(uri: string, text: string)` — 与 `getWorkspaceSymbols()` 返回 `ParSymbol[]` 一致
- `removeWorkspaceFile(uri: string)` — 与 `workspaceIndex.delete(uri)` 键类型一致
- `clearIncludeCacheForFile(filePath: string)` — 与 `includeRawCache` 的 filesystem path 键类型一致
- `onFileChanged(uriOrPath: string)` — 内部转 URI → filesystem path 后操作 includeRawCache，直接清 currentFileCache
- `getCompletionsAt()` 中 `cached.symbols.concat(getWorkspaceSymbols())` — 两端均为 `ParSymbol[]`

### 4. 缓存 Key 一致性

- **workspaceIndex key** = URI string（与 `fileUri.toString()` 一致）→ `addWorkspaceFile(uri.toString(), text)`
- **includeRawCache key** = resolved filesystem path（由 `resolveFilePath` 返回）→ `clearIncludeCacheForFile(filePath)`
- **currentFileCache key** = `"uri:v{version}"` → `onFileChanged` 粗粒度 `clear()` 而非按 key 删除
- 两者不混用：watcher 事件中 `uri.toString()` 给 workspaceIndex，`uriToFsPath(uri)` / `onFileChanged(uri.toString())` 给 includeCache

### 5. onFileChanged 防止 stale

- `onFileChanged()` 不仅清 `includeRawCache`，还粗粒度清空 `currentFileCache`
- 这是因为同一 `document.version` 的 cached resolved result 包含旧的 grafted include symbols，不清空会返回 stale 结果
- 清空后 `preheatOpenParDocuments()` 立即重建打开文档的缓存，不依赖下次 debounce

### 6. 测试光标位置正确性

- 所有测试的光标位置落在目标上下文中：
  - block 补全 → 光标在 scope 内部空行（stack top = scope）
  - parameter 补全 → 光标在 block 内部空行（stack top = block）
  - scopeName 补全 → 光标在引号内（通过 lineText 检测）
  - scopeType 补全 → 光标在顶层空行（stack 为空）
- 不存在 "line 0 是空行" 但实际是 beforeStack 为空的错误假设

### 7. 三类 completion 都合并 workspace symbols

- scopeName 分支：`cached.symbols.concat(getWorkspaceSymbols())`
- 普通 block/parameter 分支：`cached.symbols.concat(getWorkspaceSymbols())`
- 两处修改确保 workspace symbols 在所有补全层级生效

### 8. workspaceIndex direct-symbol 策略（已知限制）

- `addWorkspaceFile(uri, text)` 只做 `parseParText(text, uri)`，不递归 resolve workspace 文件内部的 `#include` / `Insert`
- workspace wrapper 文件中的 include 内容**不会**被嫁接到 wrapper 的 parentPath
- 这不影响当前打开文件的 include 递归——当前文件仍走 `parseCurrentFile + resolveIncludes`
- 片段式 `.par` 文件（如只定义 `Bandgap { Eg0 = 1.12 }` 而无外层 `Material = "..."` scope）的 symbols 在 workspaceIndex 中 parentPath 为空或非标准形式，可能无法被 block/parameter 聚合正确匹配
- 后续可扩展 workspace include graph 解决此限制

### 9. Watcher 三事件完整覆盖

- `onDidCreate` → `addWorkspaceFile` + `onFileChanged` + `preheatOpenParDocuments`（新建文件可能使已有 #include 从 unresolved 变为 resolved）
- `onDidChange` → `addWorkspaceFile` + `onFileChanged` + `preheatOpenParDocuments`
- `onDidDelete` → `removeWorkspaceFile` + `onFileChanged` + `preheatOpenParDocuments`

### 10. Open Document Preheat

- `preheatOpenParDocuments()` 在 watcher create/change/delete 后调用
- 不阻塞 activation（仅在 watcher 回调中同步调用）
- 不破坏现有 debounce 逻辑（debounce 处理 editor 内变更，preheat 处理磁盘变更）

### 11. 性能权衡（有意暂缓）

- `getWorkspaceSymbols()` 每次 flatten workspaceIndex，Phase 2.2 不优化
- 理由：典型 5-20 文件 < 2000 symbols，concat < 0.1ms
- 后续可引入 `workspaceSymbolsFlat` + `workspaceIndexDirty` flag 优化
