# SDEVICE PAR Phase 2.3: MaterialDB 集成 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SDEVICE PAR 补全系统集成 MaterialDB 数据源。支持用户通过 `sentaurus.materialDbPath` 配置自定义 MaterialDB 目录（本 PR 显式目标），配置为空/无效时使用内置占位符兜底。所有 MaterialDB 来源统一标记 `source: 'materialdb'`，复用已有 `SOURCE_PRIORITY.materialdb = 3` 优先级（低于 current/include/workspace，高于 builtin）。内置库完整填充留给下次 PR。

**Architecture:** 在 `ParIndexService` 中新增 `materialDbIndex` Map，与已有 `workspaceIndex` 并行管理。新增 `addMaterialDbFile(filePath, text)` 方法统一处理两种 MaterialDB 文件格式：(1) 包含显式 `Material = "X"` scope 的 wrapper 文件 — 直接标记 source；(2) 顶层 block/parameter 的 raw MaterialDB 文件 — 按文件名推断 material name 并 synthetic wrap + graft。内置占位数据定义为 `BUILTIN_MATERIALDB_STUB_FILES`（小段可解析文本），`loadBuiltinMaterialDb()` 调用同一 `addMaterialDbFile` 走完全相同管线。`getCompletionsAt()` 拼入 materialdb symbols，由已有 `dedupeAndSort` 按 `SOURCE_PRIORITY` 自动排序。

**Tech Stack:** 纯 CommonJS JavaScript，零外部依赖，VSCode Extension API

---

## 背景知识：真实 MaterialDB 文件格式

真实 Synopsys MaterialDB 有两种格式，实现必须同时支持：

**格式 A：顶层 block 文件**（如 `Silicon.par`、`Oxide.par`）
```tcl
Epsilon
{
  epsilon = 11.7  # [1]
}
Bandgap
{
  Eg0 = 1.12
  Chi0 = 4.05
}
```
文件没有 `Material = "Silicon"` 包裹。文件名即材料名。

**格式 B：显式 scope wrapper 文件**（如 `example_sdevice.par`）
```tcl
Material = "Silicon" {
  #include "Siliconc110.par"
  Band2BandTunneling { ... }
}
Material = "SiliconGermanium" {
  #include "common_SiGe.par"
}
```
已有 `Material = "X"` scope 声明。

**重要约束：Phase 2.3 用户 MaterialDB 目录按单文件解析，不递归解析 MaterialDB 文件内部 include。** 目录内其他 `.par` 文件会被作为独立文件加载。如果格式 B 文件中有 `#include "common.par"`，该 include 不会被 resolve——用户需要把被引用文件也放在同一目录下（此时它会被作为独立文件加载并按文件名归一化）。

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| Modify | `package.json` | 添加 `sentaurus.materialDbPath` 配置项（第三个 configuration 组） |
| Modify | `package.nls.json` | 英文 i18n 字符串 |
| Modify | `package.nls.zh-cn.json` | 中文 i18n 字符串（注意文件名是小写 `zh-cn`） |
| Modify | `src/lsp/sdevicepar/par-constants.js` | 添加 `BUILTIN_MATERIALDB_STUB_FILES` 占位文件数据 |
| Modify | `src/lsp/sdevicepar/par-index-service.js` | 添加 materialDbIndex + 归一化 + 加载/查询方法 + 集成补全 |
| Modify | `src/extension.js` | MaterialDB 初始化 + 配置变更监听 |
| Create | `tests/test-par-materialdb.js` | MaterialDB 全部测试 |

---

### Task 1: 添加用户配置 `sentaurus.materialDbPath`

**Files:**
- Modify: `package.json:366`（第二个 configuration 组的 `}` 之后追加第三个组）
- Modify: `package.nls.json`（末尾追加，注意上一行末尾加逗号）
- Modify: `package.nls.zh-cn.json`（末尾追加，注意上一行末尾加逗号）

- [ ] **Step 1: 在 package.json 中追加第三个 configuration 组**

在 `package.json` 第 366 行（`sentaurus.environmentVariables` 配置组的闭合 `}` 后面、`configuration` 数组的闭合 `]` 前面）追加：

```json
,
{
  "title": "%config.title.par%",
  "properties": {
    "sentaurus.materialDbPath": {
      "type": "string",
      "default": "",
      "description": "%config.materialDbPath.description%",
      "markdownDescription": "%config.materialDbPath.mdDesc%",
      "scope": "machine",
      "order": 1
    }
  }
}
```

注意：`scope: "machine"` 合理，MaterialDB 路径与机器安装有关。

- [ ] **Step 2: 添加英文 i18n 字符串（package.nls.json）**

在 `package.nls.json` 最后一对 key-value 后追加（注意上一行末尾加逗号）：

```json
  "config.title.par": "Sentaurus PAR MaterialDB",
  "config.materialDbPath.description": "Path to MaterialDB directory containing .par files. Leave empty to use built-in placeholder data.",
  "config.materialDbPath.mdDesc": "Absolute path to a **MaterialDB directory** containing `.par` files.\n\nWhen set, all direct child `.par` files in this directory are parsed and their parameters become available in completions (tagged as `materialdb` source).\n\nWhen empty or invalid, a built-in placeholder dataset is used. The full built-in MaterialDB will be populated in a future update.\n\n**Priority:** `materialdb` source has lower priority than `current` / `include` / `workspace`."
```

- [ ] **Step 3: 添加中文 i18n 字符串（package.nls.zh-cn.json）**

在 `package.nls.zh-cn.json` 最后一对 key-value 后追加（注意上一行末尾加逗号）：

```json
  "config.title.par": "Sentaurus PAR 材料数据库",
  "config.materialDbPath.description": "MaterialDB 目录路径（包含 .par 文件）。留空则使用内置占位数据。",
  "config.materialDbPath.mdDesc": "包含 `.par` 文件的 **MaterialDB 目录**的绝对路径。\n\n设置后，该目录下所有直接子级 `.par` 文件将被解析，其参数可在补全中使用（标记为 `materialdb` 来源）。\n\n留空或无效时使用内置占位数据。完整的内置 MaterialDB 将在后续更新中填充。\n\n**优先级：** `materialdb` 来源的优先级低于 `current` / `include` / `workspace`。"
```

- [ ] **Step 4: 验证 JSON 可读**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json OK')"`
Run: `node -e "JSON.parse(require('fs').readFileSync('package.nls.json','utf8')); console.log('nls OK')"`
Run: `node -e "JSON.parse(require('fs').readFileSync('package.nls.zh-cn.json','utf8')); console.log('zh-cn OK')"`

Expected: 三个 JSON 均可读。

Run: `node -e "const p=require('./package.json'); console.log(p.contributes.configuration.length)"`

Expected: `3`（原 2 个 + 新增 1 个）

- [ ] **Step 5: 提交**

```bash
git add package.json package.nls.json package.nls.zh-cn.json
git commit -m "feat(sdevicepar): 添加 sentaurus.materialDbPath 配置项

- 新增第三个 configuration 组 'Sentaurus PAR MaterialDB'
- 支持用户指定 MaterialDB 目录路径
- 留空或无效时使用内置占位数据
- scope: machine（路径与机器安装有关）
- 中英文 i18n 字符串完备"
```

---

### Task 2: MaterialDB index 与内置 placeholder + 归一化逻辑

**Files:**
- Modify: `src/lsp/sdevicepar/par-constants.js`
- Modify: `src/lsp/sdevicepar/par-index-service.js`
- Create: `tests/test-par-materialdb.js`

- [ ] **Step 1: 编写基础和归一化测试（失败优先）**

创建 `tests/test-par-materialdb.js`：

```js
// tests/test-par-materialdb.js
'use strict';

const { test, summary } = require('./helpers/test-runner');
const assert = require('assert');
const { createParIndexService } = require('../src/lsp/sdevicepar/par-index-service');

// ── 基础接口 ────────────────────────────────────────────

test('getMaterialDbSymbols returns empty before load', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    service.dispose();
});

test('getMaterialDbFileCount is 0 before load', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    assert.strictEqual(service.getMaterialDbFileCount(), 0);
    service.dispose();
});

// ── loadBuiltinMaterialDb ───────────────────────────────

test('loadBuiltinMaterialDb populates placeholder materialdb symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const symbols = service.getMaterialDbSymbols();
    assert.ok(symbols.length > 0, 'Should have placeholder symbols');

    // 包含 Silicon Material scope
    const siliconScope = symbols.find(s => s.name === 'Silicon' && s.kind === 'scope');
    assert.ok(siliconScope, 'Should find Silicon scope');
    assert.strictEqual(siliconScope.scopeType, 'Material');
    assert.strictEqual(siliconScope.parentPath, '');
    assert.strictEqual(siliconScope.fullPath, 'Material/Silicon');

    // 包含 Oxide Material scope
    const oxideScope = symbols.find(s => s.name === 'Oxide' && s.kind === 'scope');
    assert.ok(oxideScope, 'Should find Oxide scope');
    assert.strictEqual(oxideScope.scopeType, 'Material');

    // 所有 source 都是 materialdb
    assert.ok(symbols.every(s => s.source === 'materialdb'));

    service.dispose();
});

test('builtin placeholder symbols use completable parentPath', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const symbols = service.getMaterialDbSymbols();

    // block 补全匹配：parentPath === 'Material/Silicon'
    const siliconBlocks = symbols.filter(s => s.kind === 'block' && s.parentPath === 'Material/Silicon');
    assert.ok(siliconBlocks.length > 0, 'Should have blocks under Material/Silicon');
    const blockNames = siliconBlocks.map(s => s.name);
    assert.ok(blockNames.includes('Epsilon') || blockNames.includes('Bandgap'),
        'Should include Epsilon or Bandgap block');

    // parameter 补全匹配：parentPath === 'Material/Silicon/Epsilon' 或 'Material/Silicon/Bandgap'
    const siliconParams = symbols.filter(s => s.kind === 'parameter' && s.parentPath.startsWith('Material/Silicon/'));
    assert.ok(siliconParams.length > 0, 'Should have params under Material/Silicon/<block>');

    // Oxide 也有 Epsilon
    const oxideBlocks = symbols.filter(s => s.kind === 'block' && s.parentPath === 'Material/Oxide');
    assert.ok(oxideBlocks.some(s => s.name === 'Epsilon'), 'Oxide should have Epsilon');

    service.dispose();
});

// ── addMaterialDbFile 归一化 ──────────────────────────────

test('addMaterialDbFile handles explicit Material scope (format B)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    const text = 'Material = "TestMat" {\n  Bandgap {\n    Eg0 = 1.08\n  }\n}\n';
    service.addMaterialDbFile('/custom/TestMat.par', text);

    const symbols = service.getMaterialDbSymbols();
    // scope + block + parameter = 3
    assert.strictEqual(symbols.length, 3);

    const scope = symbols.find(s => s.kind === 'scope');
    assert.strictEqual(scope.name, 'TestMat');
    assert.strictEqual(scope.scopeType, 'Material');
    assert.strictEqual(scope.source, 'materialdb');
    assert.strictEqual(scope.filePath, '/custom/TestMat.par');

    const block = symbols.find(s => s.kind === 'block');
    assert.strictEqual(block.name, 'Bandgap');
    assert.strictEqual(block.parentPath, 'Material/TestMat');

    const param = symbols.find(s => s.kind === 'parameter');
    assert.strictEqual(param.name, 'Eg0');
    assert.strictEqual(param.value, '1.08');
    assert.strictEqual(param.parentPath, 'Material/TestMat/Bandgap');

    service.dispose();
});

test('addMaterialDbFile wraps top-level MaterialDB file by filename (format A)', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // 模拟真实 Silicon.par 格式：顶层 block，无 Material scope 包裹
    const text = [
        'Epsilon {',
        '  epsilon = 11.7',
        '}',
        '',
        'Bandgap {',
        '  Eg0 = 1.12',
        '}',
    ].join('\n');
    service.addMaterialDbFile('/db/Silicon.par', text);

    const symbols = service.getMaterialDbSymbols();

    // 应自动创建 synthetic scope: Silicon (Material)
    const scope = symbols.find(s => s.kind === 'scope' && s.name === 'Silicon');
    assert.ok(scope, 'Should create synthetic Silicon scope');
    assert.strictEqual(scope.scopeType, 'Material');
    assert.strictEqual(scope.parentPath, '');
    assert.strictEqual(scope.fullPath, 'Material/Silicon');
    assert.strictEqual(scope.source, 'materialdb');

    // block Epsilon graft 到 Material/Silicon
    const epsilon = symbols.find(s => s.kind === 'block' && s.name === 'Epsilon');
    assert.ok(epsilon, 'Should find Epsilon block');
    assert.strictEqual(epsilon.parentPath, 'Material/Silicon');
    assert.strictEqual(epsilon.fullPath, 'Material/Silicon/Epsilon');

    // parameter epsilon graft 到 Material/Silicon/Epsilon
    const eps = symbols.find(s => s.kind === 'parameter' && s.name === 'epsilon');
    assert.ok(eps, 'Should find epsilon parameter');
    assert.strictEqual(eps.parentPath, 'Material/Silicon/Epsilon');
    assert.strictEqual(eps.value, '11.7');

    // block Bandgap graft 到 Material/Silicon
    const bandgap = symbols.find(s => s.kind === 'block' && s.name === 'Bandgap');
    assert.strictEqual(bandgap.parentPath, 'Material/Silicon');
    assert.strictEqual(bandgap.fullPath, 'Material/Silicon/Bandgap');

    // parameter Eg0 graft 到 Material/Silicon/Bandgap
    const eg0 = symbols.find(s => s.kind === 'parameter' && s.name === 'Eg0');
    assert.strictEqual(eg0.parentPath, 'Material/Silicon/Bandgap');

    // 所有 source 为 materialdb
    assert.ok(symbols.every(s => s.source === 'materialdb'));

    service.dispose();
});

test('addMaterialDbFile does not double-wrap if file has Material scope', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    // 文件名是 Silicon.par 但内容已有 Material = "Silicon" scope
    const text = 'Material = "Silicon" {\n  Epsilon {\n    epsilon = 11.7\n  }\n}\n';
    service.addMaterialDbFile('/db/Silicon.par', text);

    const symbols = service.getMaterialDbSymbols();
    // 不应有 synthetic scope — 使用原始的 Material scope
    const scopes = symbols.filter(s => s.kind === 'scope');
    assert.strictEqual(scopes.length, 1, 'Should have exactly one scope (not synthetic + original)');
    assert.strictEqual(scopes[0].name, 'Silicon');
    assert.strictEqual(scopes[0].parentPath, '');

    // block/param parentPath 不应有双重 Material/Silicon/Material/Silicon
    const epsilon = symbols.find(s => s.kind === 'block');
    assert.strictEqual(epsilon.parentPath, 'Material/Silicon');

    service.dispose();
});

// ── 索引管理 ────────────────────────────────────────────

test('addMaterialDbFile accumulates across multiple calls', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.addMaterialDbFile('/db/A.par', 'Material = "MatA" {\n}\n');
    service.addMaterialDbFile('/db/B.par', 'Material = "MatB" {\n}\n');

    const symbols = service.getMaterialDbSymbols();
    const names = symbols.filter(s => s.kind === 'scope').map(s => s.name);
    assert.ok(names.includes('MatA'));
    assert.ok(names.includes('MatB'));
    assert.strictEqual(service.getMaterialDbFileCount(), 2);

    service.dispose();
});

test('clearMaterialDb removes all materialdb symbols', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    assert.ok(service.getMaterialDbSymbols().length > 0);

    service.clearMaterialDb();
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    assert.strictEqual(service.getMaterialDbFileCount(), 0);

    service.dispose();
});

test('dispose clears materialDbIndex', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    assert.ok(service.getMaterialDbSymbols().length > 0);
    service.dispose();
    // dispose 后 service 实例的 materialDbIndex 应为空
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
});

test('clearMaterialDb followed by addMaterialDbFile works', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();
    service.clearMaterialDb();

    service.addMaterialDbFile('/custom/X.par', 'Material = "X" {\n}\n');
    const symbols = service.getMaterialDbSymbols();
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'X');
    assert.strictEqual(symbols[0].source, 'materialdb');

    service.dispose();
});

summary();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-par-materialdb.js`

Expected: FAIL — `service.loadBuiltinMaterialDb is not a function`

- [ ] **Step 3: 添加 BUILTIN_MATERIALDB_STUB_FILES 常量**

在 `src/lsp/sdevicepar/par-constants.js` 中，`MAX_CACHE_SIZE` 之后追加：

```js
/**
 * 内置 MaterialDB 占位文件数据。Phase 2.3 仅包含 Silicon + Oxide 的少量 block/parameter，
 * 证明 MaterialDB 管线接入成功。完整内置库填充在下次 PR。
 *
 * 采用与用户 MaterialDB 相同的"顶层 block"格式（格式 A），
 * 通过 addMaterialDbFile 走完全相同的归一化管线。
 */
const BUILTIN_MATERIALDB_STUB_FILES = [
    {
        filePath: '[built-in MaterialDB]/Silicon.par',
        text: [
            'Epsilon {',
            '  epsilon = 11.7',
            '}',
            '',
            'Bandgap {',
            '  Eg0 = 1.12',
            '}',
        ].join('\n'),
    },
    {
        filePath: '[built-in MaterialDB]/Oxide.par',
        text: [
            'Epsilon {',
            '  epsilon = 3.9',
            '}',
        ].join('\n'),
    },
];
```

更新 `module.exports`：

```js
module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
    BUILTIN_MATERIALDB_STUB_FILES,
};
```

- [ ] **Step 4: 在 par-index-service.js 中添加 materialDbIndex 和全部方法**

在 `par-index-service.js` 顶部 require 中追加 `BUILTIN_MATERIALDB_STUB_FILES`：

```js
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH, BUILTIN_MATERIALDB_STUB_FILES } = require('./par-constants');
```

在 `createParIndexService` 函数体内，`workspaceIndex` 声明之后追加：

```js
// materialDbIndex: Map<filePath, ParSymbol[]> — MaterialDB 文件符号（标记 source: "materialdb"）
const materialDbIndex = new Map();
```

在 `getWorkspaceSymbols` 函数之后，追加以下全部方法：

```js
/**
 * 从文件路径推断 Material 名称。
 * 取文件名（去掉 .par 后缀），如 /db/Silicon.par → "Silicon"。
 * @param {string} filePath
 * @returns {string|null}
 */
function inferMaterialNameFromPath(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    const filename = normalized.split('/').pop();
    return filename ? filename.replace(/\.par$/i, '') : null;
}

/**
 * 添加单个 MaterialDB 文件到索引。
 *
 * 支持两种文件格式的归一化：
 * - 格式 A（顶层 block，如 Silicon.par）：自动创建 synthetic Material scope 并 graft
 * - 格式 B（显式 Material scope，如 example_sdevice.par）：直接标记 source
 *
 * @param {string} filePath - 文件路径（绝对路径或标识字符串）
 * @param {string} text - 文件文本内容
 */
function addMaterialDbFile(filePath, text) {
    const rawResult = parseParText(text, filePath);
    const rawSymbols = rawResult.symbols;

    // 检查是否已有显式 Material scope
    const hasExplicitMaterialScope = rawSymbols.some(
        s => s.kind === 'scope' && s.scopeType === 'Material'
    );

    let finalSymbols;

    if (hasExplicitMaterialScope) {
        // 格式 B：已有 Material scope — 直接标记 source
        finalSymbols = rawSymbols.map(s => ({
            ...s,
            source: 'materialdb',
            filePath,
        }));
    } else {
        // 格式 A：顶层 block/parameter — synthetic wrap + graft
        const materialName = inferMaterialNameFromPath(filePath);
        if (!materialName || rawSymbols.length === 0) {
            // 无法推断名称或无内容 — 仍然标记
            finalSymbols = rawSymbols.map(s => ({
                ...s,
                source: 'materialdb',
                filePath,
            }));
        } else {
            const scopePrefix = 'Material/' + materialName;

            // Synthetic Material scope
            const syntheticScope = {
                kind: 'scope',
                name: materialName,
                scopeType: 'Material',
                parentPath: '',
                fullPath: scopePrefix,
                range: { startLine: 0, startCol: 0, endLine: 0, endCol: 0 },
                value: null,
                source: 'materialdb',
                filePath,
                includeChain: [],
            };

            // Graft 所有 raw symbols 到 Material/<materialName>/... 下
            const grafted = rawSymbols.map(s => {
                const newParentPath = s.parentPath
                    ? scopePrefix + '/' + s.parentPath
                    : scopePrefix;
                return {
                    ...s,
                    parentPath: newParentPath,
                    fullPath: newParentPath + '/' + s.name,
                    source: 'materialdb',
                    filePath,
                };
            });

            finalSymbols = [syntheticScope, ...grafted];
        }
    }

    // 只在解析出有效 symbols 时才写入索引；空文件不写入，不影响 loaded 计数
    if (finalSymbols.length > 0) {
        materialDbIndex.set(filePath, finalSymbols);
    }
}

/**
 * 加载内置 MaterialDB 占位数据。
 * 通过 addMaterialDbFile 走相同归一化管线。
 */
function loadBuiltinMaterialDb() {
    materialDbIndex.clear();
    for (const entry of BUILTIN_MATERIALDB_STUB_FILES) {
        addMaterialDbFile(entry.filePath, entry.text);
    }
}

/**
 * 清空 MaterialDB 索引。
 */
function clearMaterialDb() {
    materialDbIndex.clear();
}

/**
 * 获取所有 MaterialDB 文件的符号（扁平化数组）。
 */
function getMaterialDbSymbols() {
    const all = [];
    for (const symbols of materialDbIndex.values()) {
        all.push(...symbols);
    }
    return all;
}

/**
 * 获取 MaterialDB 索引中的文件数量。
 */
function getMaterialDbFileCount() {
    return materialDbIndex.size;
}
```

修改 `dispose` 函数，追加 `materialDbIndex.clear()`：

```js
function dispose() {
    currentFileCache.clear();
    includeRawCache.clear();
    workspaceIndex.clear();
    materialDbIndex.clear();
    _workspaceScanning = false;
    _workspaceCompletionMissed = false;
}
```

更新 return 对象，在 `getWorkspaceFileCount` 之后追加新方法：

```js
return {
    parseCurrentFile,
    getCompletionsAt,
    onFileChanged,
    onFileClosed,
    addWorkspaceFile,
    removeWorkspaceFile,
    getWorkspaceSymbols,
    clearIncludeCacheForFile,
    setWorkspaceScanning,
    consumeWorkspaceCompletionMissed,
    getWorkspaceFileCount,
    addMaterialDbFile,
    loadBuiltinMaterialDb,
    clearMaterialDb,
    getMaterialDbSymbols,
    getMaterialDbFileCount,
    dispose,
};
```

- [ ] **Step 5: 运行测试确认通过**

Run: `node tests/test-par-materialdb.js`

Expected: 所有测试通过（应为 11 个）。

- [ ] **Step 6: 运行现有测试确认无回归**

Run: `node tests/test-par-index.js && node tests/test-par-completion.js`

Expected: 全部通过。

- [ ] **Step 7: 提交**

```bash
git add src/lsp/sdevicepar/par-constants.js src/lsp/sdevicepar/par-index-service.js tests/test-par-materialdb.js
git commit -m "feat(sdevicepar): 添加 MaterialDB 索引、归一化和内置占位数据

- par-constants.js: BUILTIN_MATERIALDB_STUB_FILES（Silicon + Oxide 占位）
- par-index-service.js: materialDbIndex + addMaterialDbFile + loadBuiltinMaterialDb
  - 归一化逻辑：显式 Material scope 不二次包裹；顶层 block 按文件名 synthetic wrap + graft
  - inferMaterialNameFromPath 从文件名推导材料名
  - 所有 materialdb 条目 source='materialdb'，复用 SOURCE_PRIORITY.materialdb=3
- 10 个测试覆盖：基础接口、builtin 加载、parentPath 可补全性、两种格式归一化、索引管理"
```

---

### Task 3: MaterialDB 参与补全管线

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js:262-288`（`getCompletionsAt` 方法）
- Modify: `tests/test-par-materialdb.js`

- [ ] **Step 1: 编写补全集成测试（失败优先）**

在 `tests/test-par-materialdb.js` 中 `summary()` 之前追加：

```js
// ── getCompletionsAt 集成 MaterialDB ──────────────────────

test('scopeName completion includes builtin materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    // 必须先 parseCurrentFile 建立 cache
    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => '',
    };
    service.parseCurrentFile(doc);

    // Material = "|" — 引号内 col=12（opening quote at 11, closing at 13）
    const items = service.getCompletionsAt(doc, { line: 0, character: 12 }, 'Material = "|"');
    const scopeNameItems = items.filter(i => i.kind === 'scopeName');
    assert.ok(scopeNameItems.length > 0, 'Should have scopeName completions');

    const names = scopeNameItems.map(i => i.label);
    assert.ok(names.includes('Silicon'), 'Should suggest Silicon');
    assert.ok(names.includes('Oxide'), 'Should suggest Oxide');

    const siliconItem = scopeNameItems.find(i => i.label === 'Silicon');
    assert.strictEqual(siliconItem.source, 'materialdb');

    service.dispose();
});

test('block completion inside Material scope includes materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const text = 'Material = "Silicon" {\n  \n}\n';
    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => text,
    };
    service.parseCurrentFile(doc);

    // 光标在 scope 内空行 (line 1, col 2)
    const items = service.getCompletionsAt(doc, { line: 1, character: 2 });
    const blockItems = items.filter(i => i.kind === 'block');

    // builtin stub 有 Epsilon 和 Bandgap，parentPath='Material/Silicon'
    // buildParCompletions 会聚合 scopeType=Material 下所有 block
    const blockNames = blockItems.map(i => i.label);
    assert.ok(blockNames.includes('Epsilon') || blockNames.includes('Bandgap'),
        'Should suggest Epsilon or Bandgap from materialdb');

    // 验证 materialdb 来源
    const epsilonItem = blockItems.find(i => i.label === 'Epsilon');
    if (epsilonItem) {
        assert.strictEqual(epsilonItem.source, 'materialdb');
    }

    service.dispose();
});

test('parameter completion inside Material block includes materialdb', () => {
    const service = createParIndexService({ extensionPath: '/ext' });
    service.loadBuiltinMaterialDb();

    const text = 'Material = "Silicon" {\n  Epsilon {\n    \n  }\n}\n';
    const doc = {
        uri: { toString: () => 'file:///test.par' },
        version: 1,
        getText: () => text,
    };
    service.parseCurrentFile(doc);

    // 光标在 block 内空行 (line 2, col 4)
    const items = service.getCompletionsAt(doc, { line: 2, character: 4 });
    const paramItems = items.filter(i => i.kind === 'parameter');

    const paramNames = paramItems.map(i => i.label);
    assert.ok(paramNames.includes('epsilon'), 'Should suggest epsilon from materialdb');

    const epsItem = paramItems.find(i => i.label === 'epsilon');
    assert.strictEqual(epsItem.source, 'materialdb');

    service.dispose();
});

test('workspace source wins over materialdb for same-name symbol', () => {
    const service = createParIndexService({ extensionPath: '/ext' });

    // workspace 有 Material = "Silicon"
    service.addWorkspaceFile('file:///ws/test.par',
        'Material = "Silicon" {\n  Bandgap {\n    Eg0 = 1.08\n  }\n}\n');

    // builtin 也包含 Silicon scope + Bandgap block + Eg0 param
    service.loadBuiltinMaterialDb();

    const doc = {
        uri: { toString: () => 'file:///current.par' },
        version: 1,
        getText: () => '',
    };
    service.parseCurrentFile(doc);

    // scopeName 补全
    const items = service.getCompletionsAt(doc, { line: 0, character: 12 }, 'Material = "|"');
    const siliconItems = items.filter(i => i.label === 'Silicon');

    // 去重后只保留一个 Silicon，source 应为 workspace（优先级更高）
    assert.strictEqual(siliconItems.length, 1, 'Deduped to one Silicon');
    assert.strictEqual(siliconItems[0].source, 'workspace', 'Workspace should win over materialdb');

    service.dispose();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/test-par-materialdb.js`

Expected: 基础测试通过，补全集成测试 FAIL（`getCompletionsAt` 还没拼接 materialdb symbols）

- [ ] **Step 3: 修改 getCompletionsAt 拼接 materialdb symbols**

在 `par-index-service.js` 的 `getCompletionsAt` 函数中，找到两处 `cached.symbols.concat(getWorkspaceSymbols())`，替换为 `cached.symbols.concat(getWorkspaceSymbols(), getMaterialDbSymbols())`。

**第一处**（scopeName 补全分支，约第 279 行）：

```js
// 旧
return buildParCompletions(
    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
    cached.symbols.concat(getWorkspaceSymbols()),
);

// 新
return buildParCompletions(
    { completableKind: 'scopeName', parentPath: '', scopeType: scopeNameCtx.scopeType, pendingBlockName: null },
    cached.symbols.concat(getWorkspaceSymbols(), getMaterialDbSymbols()),
);
```

**第二处**（通用上下文补全分支，约第 287 行）：

```js
// 旧
return buildParCompletions(ctx, cached.symbols.concat(getWorkspaceSymbols()));

// 新
return buildParCompletions(ctx, cached.symbols.concat(getWorkspaceSymbols(), getMaterialDbSymbols()));
```

注意：不修改 `buildParCompletions()` 的排序/去重逻辑。已有 `dedupeAndSort()` 和 `SOURCE_PRIORITY.materialdb = 3` 完全满足需求。

- [ ] **Step 4: 运行全部 materialdb 测试确认通过**

Run: `node tests/test-par-materialdb.js`

Expected: 所有测试通过（应为 15 个：11 基础 + 4 补全集成）。

- [ ] **Step 5: 运行全部现有测试确认无回归**

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js && node tests/test-par-index.js`

Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/lsp/sdevicepar/par-index-service.js tests/test-par-materialdb.js
git commit -m "feat(sdevicepar): 将 MaterialDB symbols 集成到补全管线

- getCompletionsAt() 两处 concat 均拼接 getMaterialDbSymbols()
- 复用 dedupeAndSort + SOURCE_PRIORITY.materialdb=3，不修改排序/去重逻辑
- 新增 4 个集成测试：scopeName/block/parameter 补全 + workspace 优先级胜出
- 全部现有测试无回归"
```

---

### Task 4: 用户配置路径加载与 extension.js 集成

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 添加 loadConfiguredMaterialDb 函数**

在 `extension.js` 中，找到 Phase 2.2 注释 `// ── Phase 2.2: Workspace .par 文件扫描 ──────────────────` 之前（约第 179 行），插入 MaterialDB 加载函数：

```js
// ── Phase 2.3: MaterialDB 加载 ────────────────────────────

function loadConfiguredMaterialDb() {
    if (!parIndexService) return;
    parIndexService.clearMaterialDb();

    const materialDbPath = vscode.workspace.getConfiguration('sentaurus').get('materialDbPath', '');

    if (materialDbPath) {
        try {
            const stat = fs.statSync(materialDbPath);
            if (!stat.isDirectory()) {
                // 不是目录 → fallback
                parIndexService.loadBuiltinMaterialDb();
                return;
            }
            const entries = fs.readdirSync(materialDbPath);
            let loaded = 0;
            for (const entry of entries) {
                if (!entry.toLowerCase().endsWith('.par')) continue;
                try {
                    const fullPath = path.join(materialDbPath, entry);
                    const text = fs.readFileSync(fullPath, 'utf8');
                    parIndexService.addMaterialDbFile(fullPath, text);
                    // addMaterialDbFile 内部会跳过空 symbol 文件（不写入 materialDbIndex）
                    // 所以只有实际产生了 symbols 的文件才算 loaded
                    if (parIndexService.getMaterialDbFileCount() > loaded) {
                        loaded++;
                    }
                } catch (_) { /* skip unreadable files */ }
            }
            if (loaded === 0) {
                // 目录中无可用 .par 文件 → fallback
                parIndexService.loadBuiltinMaterialDb();
            } else if (parStatusBar) {
                parStatusBar.text = `$(database) PAR MaterialDB: ${loaded} files`;
                parStatusBar.show();
                setTimeout(() => { if (parStatusBar) parStatusBar.hide(); }, 4000);
            }
        } catch (_) {
            // statSync/readdirSync 失败 → fallback
            parIndexService.loadBuiltinMaterialDb();
        }
    } else {
        // 配置为空 → fallback
        parIndexService.loadBuiltinMaterialDb();
    }
}
```

关键行为说明：
- **Phase 2.3 只扫描目录直接子级 `.par` 文件**，不递归子目录。
- `.par` 后缀匹配使用 `toLowerCase()` 大小写不敏感。
- 每个文件读取失败时跳过，不影响其他文件。
- **成功加载数为 0 时 fallback 到 builtin**（本 PR 要求内置兜底）。
- 状态栏显示的是实际成功加载数（不是目录中文件名数量）。

- [ ] **Step 2: 按正确顺序调用**

调用顺序：**创建 service → 加载 MaterialDB → preheat open docs → workspace scan**

找到 `extension.js` 中约第 165-177 行（创建 parIndexService 和 preheat open docs）：

```js
// ── ParIndexService（sdevicepar 上下文补全）──────────────
parIndexService = createParIndexService({
    extensionPath: context.extensionPath,
    workspaceFolders: vscode.workspace.workspaceFolders || [],
});

// Pre-heat already-open sdevicepar documents at activation
for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === 'sdevicepar' && parIndexService) {
        try { parIndexService.parseCurrentFile(doc); }
        catch (_) { /* ignore */ }
    }
}
```

在这两段之间插入 MaterialDB 加载调用：

```js
// ── ParIndexService（sdevicepar 上下文补全）──────────────
parIndexService = createParIndexService({
    extensionPath: context.extensionPath,
    workspaceFolders: vscode.workspace.workspaceFolders || [],
});

// 加载 MaterialDB（配置路径或内置占位）—— 必须在 preheat 之前，
// 以确保补全时 materialdb symbols 已就绪
loadConfiguredMaterialDb();

// Pre-heat already-open sdevicepar documents at activation
for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === 'sdevicepar' && parIndexService) {
        try { parIndexService.parseCurrentFile(doc); }
        catch (_) { /* ignore */ }
    }
}
```

**必须将 `parStatusBar` 创建提前。** 当前 `parStatusBar` 在 `extension.js` 约第 233 行创建，但 `loadConfiguredMaterialDb` 需要用它。`const` 声明不会被 hoisting，会产生 TDZ 错误。步骤：

1. 将 `parIndexService` 创建后、preheat 之前的代码改为：

```js
parIndexService = createParIndexService({
    extensionPath: context.extensionPath,
    workspaceFolders: vscode.workspace.workspaceFolders || [],
});

// PAR 状态栏（必须提前创建，loadConfiguredMaterialDb 和 workspace scan 都需要）
const parStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
context.subscriptions.push(parStatusBar);

// 加载 MaterialDB（配置路径或内置占位）—— 必须在 preheat 之前，
// 以确保补全时 materialdb symbols 已就绪
loadConfiguredMaterialDb();

// Pre-heat already-open sdevicepar documents at activation
for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === 'sdevicepar' && parIndexService) {
        try { parIndexService.parseCurrentFile(doc); }
        catch (_) { /* ignore */ }
    }
}
```

2. **删除**原位置（约第 233-234 行）的 `parStatusBar` 创建代码：
```js
// 删除这两行：
const parStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
context.subscriptions.push(parStatusBar);
```

3. 后面 `scanWorkspaceParFiles` 和 watcher 中对 `parStatusBar` 的引用保持不变（它们在 parStatusBar 创建之后执行）。

- [ ] **Step 3: 添加配置变更监听**

在 `context.subscriptions.push(parWatcher)` 之后（约第 282 行），追加：

```js
// 配置变更监听：sentaurus.materialDbPath 变化时重新加载 MaterialDB
// 不清空 workspaceIndex，只影响 materialDbIndex + current cache
context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('sentaurus.materialDbPath')) {
            loadConfiguredMaterialDb();
            if (parIndexService) {
                // onFileChanged 粗粒度清空 currentFileCache。
                // key '__materialdb_config_change__' 不会匹配 includeRawCache 中任何条目，
                // 所以 includeRawCache 不受影响。workspaceIndex 也不受影响。
                parIndexService.onFileChanged('__materialdb_config_change__');
                preheatOpenParDocuments();
            }
        }
    })
);
```

- [ ] **Step 4: 运行全部测试确认无回归**

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js && node tests/test-par-index.js && node tests/test-par-materialdb.js`

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/extension.js
git commit -m "feat(sdevicepar): 集成 MaterialDB 初始化和配置变更监听

- 激活时根据 sentaurus.materialDbPath 配置选择加载用户目录或内置占位
- 调用顺序：createParIndexService → loadConfiguredMaterialDb → preheat → workspace scan
- loadConfiguredMaterialDb 完整 fallback 链：非空→有效目录→有.par文件→全部读取失败→builtin
- 只扫描目录直接子级 .par（大小写不敏感），成功加载数为 0 时 fallback
- parStatusBar 创建提前到 loadConfiguredMaterialDb 之前
- onDidChangeConfiguration 监听配置变更，重载 MaterialDB + 清 currentCache + preheat
- 不影响 workspaceIndex 和 includeRawCache"
```

---

### Task 5: 全量测试与回归

- [ ] **Step 1: 逐个运行 sdevicepar 测试**

```bash
node tests/test-par-parser.js
node tests/test-par-context.js
node tests/test-par-completion.js
node tests/test-par-index.js
node tests/test-par-materialdb.js
```

Expected: 全部通过。

- [ ] **Step 2: 运行全部其他测试**

```bash
node tests/test-definitions.js
node tests/test-docs-loader.js
node tests/test-pp-utils.js
node tests/test-expression-converter.js
```

（逐个运行避免 glob 展开问题）

Expected: 全部通过，无回归。

- [ ] **Step 3: 检查 git log**

Run: `git log --oneline -5`

Expected: 4 个清晰的提交（config → index+normalization → integration → extension）。

---

## Self-Review Checklist

- [ ] 用户配置路径为空时加载 builtin placeholder
- [ ] 用户配置路径无效/非目录/空目录/全文件读取失败时 fallback 到 builtin placeholder
- [ ] 用户配置路径有效时加载目录直接子级 `.par` 文件（大小写不敏感）
- [ ] 成功加载数为 0 时 fallback 到 builtin
- [ ] 真实 MaterialDB 顶层 block 文件按文件名 graft 到 `Material/<name>`
- [ ] 文件含显式 `Material = "X"` scope 时不二次包裹
- [ ] `getCompletionsAt()` 在 scopeName/block/parameter 三类上下文都合并 materialdb symbols
- [ ] 不修改 `buildParCompletions()` 排序/去重逻辑
- [ ] MaterialDB 不进入 workspaceIndex，单独由 materialDbIndex 管理
- [ ] 配置变更不会清空 workspaceIndex
- [ ] 所有 materialdb symbols 的 source 都是 `'materialdb'`
- [ ] 复用 `SOURCE_PRIORITY.materialdb = 3`，不新增优先级
- [ ] current/include/workspace 优先于 materialdb
- [ ] extension.js 调用顺序正确：service → MaterialDB → preheat → workspace scan
- [ ] 所有补全测试先调用 `parseCurrentFile` 再调用 `getCompletionsAt`
- [ ] scopeName 测试使用 `character: 12`（引号内正确位置）

---

## 验收标准

1. VSCode 设置中出现 `sentaurus.materialDbPath`，中英文描述正确
2. `sentaurus.materialDbPath` 为空时，内置 placeholder MaterialDB 加载成功
3. 配置为有效用户目录时，目录直接子级 `.par` 文件被解析并加入 `materialDbIndex`
4. 配置为无效路径、非目录、空目录、或全文件读取失败时，fallback 到内置 placeholder
5. 文件无显式 Material scope 时，按文件名 synthetic wrap，正确 graft block/parameter 到 `Material/<name>/...`
6. 文件已有显式 Material scope 时，不二次包裹
7. `Material = "|"` 可补出 MaterialDB 材料名（如 `Silicon`、`Oxide`）
8. `Material = "Silicon" { | }` 可补出内置或用户 DB 中的 block（如 `Epsilon`、`Bandgap`）
9. `Material = "Silicon" { Epsilon { | } }` 可补出参数（如 `epsilon`）
10. MaterialDB 条目标记 `source: 'materialdb'`
11. 与 workspace/current/include 同名时，materialdb 不抢占更高优先级来源
12. 修改配置后自动重新加载，无需重启 VSCode
13. 所有现有测试无回归，新增 MaterialDB 测试全部通过
