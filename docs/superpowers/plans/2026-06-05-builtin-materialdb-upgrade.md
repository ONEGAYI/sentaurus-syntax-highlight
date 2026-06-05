# #76 内置 MaterialDB 升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将内置 MaterialDB 从内联 stub 升级为从 bundled 目录 `references/MaterialDB/` 加载真实 .par 文件，使未配置 `sentaurus.materialDbPath` 时提供有实用价值的补全候选。

**Architecture:** `loadBuiltinMaterialDb()` 从内存迭代 `BUILTIN_MATERIALDB_STUB_FILES` 改为 `fs.readdirSync` 扫描 `references/MaterialDB/` 目录 + `readFile` 逐文件加载 → 走现有 `addMaterialDbFile()` 归一化管线。测试通过依赖注入 `readdirSync` + `readFile` 保持单元测试隔离。

**Tech Stack:** CommonJS (Node.js), `fs.readdirSync`/`fs.readFileSync`, 现有 `par-parser` + `addMaterialDbFile` 管线

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| Modify | `src/lsp/sdevicepar/par-constants.js` | 移除 `BUILTIN_MATERIALDB_STUB_FILES`，新增 `BUILTIN_MATERIALDB_DIR` + `BUILTIN_MATERIALDB_EXCLUDE` |
| Modify | `src/lsp/sdevicepar/par-index-service.js` | 新增 `readdirFn` 注入，重写 `loadBuiltinMaterialDb()` |
| Modify | `.vscodeignore` | 添加 `!references/MaterialDB/**` 例外 |
| Modify | `THIRD_PARTY_NOTICES.md` | 添加 MaterialDB 数据来源说明 |
| Modify | `tests/test-par-materialdb.js` | 更新现有测试 + 新增目录加载/排除测试 |

---

### Task 1: 更新 par-constants.js — 替换 stub 为目录常量

**Files:**
- Modify: `src/lsp/sdevicepar/par-constants.js`

- [ ] **Step 1: 替换常量定义**

将 `BUILTIN_MATERIALDB_STUB_FILES` 替换为 `BUILTIN_MATERIALDB_DIR` 和 `BUILTIN_MATERIALDB_EXCLUDE`。文件修改后的完整内容：

```js
// src/lsp/sdevicepar/par-constants.js
'use strict';

/** scope 声明关键词（解析器匹配 + 补全数据源） */
const SCOPE_TYPES = new Set([
    'Material', 'Region', 'Interface',
    'MaterialInterface', 'RegionInterface', 'Electrode',
]);

/** 补全来源优先级（sortText 前缀） */
const SOURCE_PRIORITY = {
    current: 0,
    include: 1,
    workspace: 2,
    materialdb: 3,
    builtin: 4,
};

/** include 递归深度上限 */
const MAX_INCLUDE_DEPTH = 8;

/** 缓存条目上限 */
const MAX_CACHE_SIZE = 20;

/**
 * 内置 MaterialDB 目录（相对于插件安装路径）。
 * 包含 Sentaurus T-2022.03 MaterialDB 中的常用材料参数文件。
 * loadBuiltinMaterialDb() 在 activate 时扫描此目录并加载所有 .par 文件。
 */
const BUILTIN_MATERIALDB_DIR = 'references/MaterialDB';

/**
 * 内置 MaterialDB 中应排除的文件名集合。
 * example_sdevice.par 是器件定义文件，不是材料参数文件。
 */
const BUILTIN_MATERIALDB_EXCLUDE = new Set([
    'example_sdevice.par',
]);

module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
    BUILTIN_MATERIALDB_DIR,
    BUILTIN_MATERIALDB_EXCLUDE,
};
```

- [ ] **Step 2: 验证语法正确**

Run: `node -e "const c = require('./src/lsp/sdevicepar/par-constants'); console.log('DIR:', c.BUILTIN_MATERIALDB_DIR); console.log('EXCLUDE:', [...c.BUILTIN_MATERIALDB_EXCLUDE])"`
Expected: `DIR: references/MaterialDB` 和 `EXCLUDE: [ 'example_sdevice.par' ]`

此时 `par-index-service.js` 会因导入 `BUILTIN_MATERIALDB_STUB_FILES` 不存在而报错——这是预期的，Task 2 修复。

---

### Task 2: 更新 par-index-service.js — 重写 loadBuiltinMaterialDb()

**Files:**
- Modify: `src/lsp/sdevicepar/par-index-service.js:9` — 更新 require 导入
- Modify: `src/lsp/sdevicepar/par-index-service.js:21` — 新增 `readdirFn` 注入
- Modify: `src/lsp/sdevicepar/par-index-service.js:230-235` — 重写 `loadBuiltinMaterialDb()`

- [ ] **Step 1: 更新 require 导入（第 9 行）**

替换：
```js
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH, BUILTIN_MATERIALDB_STUB_FILES } = require('./par-constants');
```

为：
```js
const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY, MAX_CACHE_SIZE, MAX_INCLUDE_DEPTH, BUILTIN_MATERIALDB_DIR, BUILTIN_MATERIALDB_EXCLUDE } = require('./par-constants');
```

- [ ] **Step 2: 新增 readdirFn 依赖注入（第 21 行附近）**

在 `const readFileFn = deps.readFile || ((p) => fs.readFileSync(p, 'utf8'));` 之后添加：

```js
const readdirFn = deps.readdirSync || ((dir) => fs.readdirSync(dir));
```

- [ ] **Step 3: 重写 loadBuiltinMaterialDb()（第 230-235 行）**

替换：
```js
function loadBuiltinMaterialDb() {
    materialDbIndex.clear();
    for (const entry of BUILTIN_MATERIALDB_STUB_FILES) {
        addMaterialDbFile(entry.filePath, entry.text);
    }
}
```

为：
```js
function loadBuiltinMaterialDb() {
    materialDbIndex.clear();
    const materialDbDir = path.join(extensionPath, BUILTIN_MATERIALDB_DIR);
    const t0 = Date.now();
    try {
        const files = readdirFn(materialDbDir);
        for (const file of files) {
            if (!file.toLowerCase().endsWith('.par')) continue;
            if (BUILTIN_MATERIALDB_EXCLUDE.has(file)) continue;
            try {
                const fullPath = path.join(materialDbDir, file);
                const text = readFileFn(fullPath);
                addMaterialDbFile(fullPath, text);
            } catch (_) { /* skip unreadable files */ }
        }
    } catch (_) { /* directory not found — graceful degradation */ }
    console.log('[SentaurusSyntax][MaterialDB] loadBuiltinMaterialDb — loaded',
        materialDbIndex.size, 'files in', Date.now() - t0, 'ms');
}
```

- [ ] **Step 4: 验证模块加载正常**

Run: `node -e "const { createParIndexService } = require('./src/lsp/sdevicepar/par-index-service'); console.log('OK:', typeof createParIndexService)"`
Expected: `OK: function`

---

### Task 3: 更新测试 — 适配新接口并新增覆盖

**Files:**
- Modify: `tests/test-par-materialdb.js`

**背景：** 现有测试使用 `createParIndexService({ extensionPath: '/ext' })` 后调用 `loadBuiltinMaterialDb()`，依赖内联 stub 数据。改为目录扫描后，需注入 `readdirSync` 和 `readFile` 以模拟文件系统。

**Mock 数据策略：** 使用与旧 stub 相同的 Silicon（Epsilon+Bandgap）和 Oxide（Epsilon）数据作为 mock，使现有测试断言最小化改动。

- [ ] **Step 1: 在文件顶部（第 7 行 require 后）添加 mock 数据和辅助函数**

```js
// Mock bundled MaterialDB files (mirrors old stub data for backward-compatible assertions)
const MOCK_BUILTIN_FILES = {
    'Silicon.par': [
        'Epsilon {',
        '  epsilon = 11.7',
        '}',
        '',
        'Bandgap {',
        '  Eg0 = 1.12',
        '}',
    ].join('\n'),
    'Oxide.par': [
        'Epsilon {',
        '  epsilon = 3.9',
        '}',
    ].join('\n'),
};

function createBuiltinService(extraDeps) {
    return createParIndexService({
        extensionPath: '/ext',
        readdirSync: () => Object.keys(MOCK_BUILTIN_FILES),
        readFile: (p) => {
            const name = path.basename(p);
            if (MOCK_BUILTIN_FILES[name]) return MOCK_BUILTIN_FILES[name];
            throw new Error('ENOENT: ' + p);
        },
        ...extraDeps,
    });
}
```

注意：需在文件顶部添加 `const path = require('path');`（当前文件未导入 path）。

- [ ] **Step 2: 更新所有使用 `createParIndexService({ extensionPath: '/ext' })` + `loadBuiltinMaterialDb()` 的测试**

将以下测试中的 `createParIndexService({ extensionPath: '/ext' })` 替换为 `createBuiltinService()`：

| 测试名 | 行号 | 改动 |
|--------|------|------|
| `loadBuiltinMaterialDb populates placeholder materialdb symbols` | 25 | `createParIndexService` → `createBuiltinService` |
| `builtin placeholder symbols use completable parentPath` | 49 | 同上 |
| `clearMaterialDb removes all materialdb symbols` | 189 | 同上 |
| `dispose clears materialDbIndex` | 201 | 同上 |
| `clearMaterialDb followed by addMaterialDbFile works` | 210 | 同上 |
| `scopeName completion includes builtin materialdb` | 226 | 同上 |
| `block completion inside Material scope includes materialdb` | 251 | 同上 |
| `parameter completion inside Material block includes materialdb` | 278 | 同上 |
| `workspace source wins over materialdb for same-name symbol` | 302 | 同上 |
| `scopeName completion works without current file cache (cache miss)` | 415 | 同上 |

这些测试的断言不需要改动——mock 数据与旧 stub 完全一致。

注意：**不调用 `loadBuiltinMaterialDb()` 的测试**（如 `addMaterialDbFile` 格式 A/B 测试、索引管理测试）不需要改动，它们使用 `createParIndexService({ extensionPath: '/ext' })` 且不依赖 builtin 数据。

- [ ] **Step 3: 新增测试 — 验证 BUILTIN_MATERIALDB_EXCLUDE 过滤**

在文件末尾 `summary()` 之前添加：

```js
// ── loadBuiltinMaterialDb 目录加载 ────────────────────────

test('loadBuiltinMaterialDb skips files in BUILTIN_MATERIALDB_EXCLUDE', () => {
    const allFiles = {
        'Silicon.par': 'Epsilon { epsilon = 11.7 }\n',
        'example_sdevice.par': 'Material = "Test" {\n}\n',
        'Oxide.par': 'Epsilon { epsilon = 3.9 }\n',
    };
    const service = createParIndexService({
        extensionPath: '/ext',
        readdirSync: () => Object.keys(allFiles),
        readFile: (p) => {
            const name = path.basename(p);
            if (allFiles[name]) return allFiles[name];
            throw new Error('ENOENT: ' + p);
        },
    });
    service.loadBuiltinMaterialDb();

    // Should have Silicon and Oxide, but NOT example_sdevice
    const symbols = service.getMaterialDbSymbols();
    const scopeNames = symbols.filter(s => s.kind === 'scope').map(s => s.name);
    assert.ok(scopeNames.includes('Silicon'), 'Should load Silicon');
    assert.ok(scopeNames.includes('Oxide'), 'Should load Oxide');
    assert.ok(!scopeNames.includes('Test'), 'Should NOT load example_sdevice.par');
    assert.strictEqual(service.getMaterialDbFileCount(), 2);

    service.dispose();
});
```

- [ ] **Step 4: 新增测试 — 验证目录不存在时优雅降级**

```js
test('loadBuiltinMaterialDb graceful degradation when directory missing', () => {
    const service = createParIndexService({
        extensionPath: '/nonexistent',
        readdirSync: () => { throw new Error('ENOENT'); },
    });
    // Should not throw
    service.loadBuiltinMaterialDb();
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    assert.strictEqual(service.getMaterialDbFileCount(), 0);
    service.dispose();
});
```

- [ ] **Step 5: 新增测试 — 验证只加载 .par 文件**

```js
test('loadBuiltinMaterialDb only loads .par files', () => {
    const allFiles = {
        'Silicon.par': 'Epsilon { epsilon = 11.7 }\n',
        'readme.txt': 'not a par file',
        'Oxide.par': 'Epsilon { epsilon = 3.9 }\n',
    };
    const service = createParIndexService({
        extensionPath: '/ext',
        readdirSync: () => Object.keys(allFiles),
        readFile: (p) => {
            const name = path.basename(p);
            if (allFiles[name]) return allFiles[name];
            throw new Error('ENOENT: ' + p);
        },
    });
    service.loadBuiltinMaterialDb();

    assert.strictEqual(service.getMaterialDbFileCount(), 2, 'Should only load .par files');
    service.dispose();
});
```

- [ ] **Step 6: 新增测试 — 空目录场景**

```js
test('loadBuiltinMaterialDb handles empty directory', () => {
    const service = createBuiltinService({
        readdirSync: () => [],
    });
    service.loadBuiltinMaterialDb();
    assert.strictEqual(service.getMaterialDbFileCount(), 0);
    assert.strictEqual(service.getMaterialDbSymbols().length, 0);
    service.dispose();
});
```

- [ ] **Step 7: 新增测试 — 单文件不可读不中断整体加载**

```js
test('loadBuiltinMaterialDb skips unreadable files gracefully', () => {
    const files = {
        'Silicon.par': 'Epsilon { epsilon = 11.7 }\n',
        'Corrupted.par': null,
        'Oxide.par': 'Epsilon { epsilon = 3.9 }\n',
    };
    const service = createParIndexService({
        extensionPath: '/ext',
        readdirSync: () => Object.keys(files),
        readFile: (p) => {
            const name = path.basename(p);
            if (name === 'Corrupted.par') throw new Error('EACCES');
            if (files[name]) return files[name];
            throw new Error('ENOENT: ' + p);
        },
    });
    service.loadBuiltinMaterialDb();
    assert.strictEqual(service.getMaterialDbFileCount(), 2, 'Should load Silicon and Oxide only');
    const scopeNames = service.getMaterialDbSymbols()
        .filter(s => s.kind === 'scope')
        .map(s => s.name);
    assert.ok(scopeNames.includes('Silicon'));
    assert.ok(scopeNames.includes('Oxide'));
    assert.ok(!scopeNames.includes('Corrupted'));
    service.dispose();
});
```

- [ ] **Step 8: 新增测试 — 真实 Silicon.par 文件集成验证**

```js
test('loadBuiltinMaterialDb parses real Silicon.par format correctly', () => {
    const realSiliconPath = path.join(__dirname, '..', 'references', 'MaterialDB', 'Silicon.par');
    const realSiliconContent = fs.readFileSync(realSiliconPath, 'utf8');
    const service = createParIndexService({
        extensionPath: '/ext',
        readdirSync: () => ['Silicon.par'],
        readFile: (p) => {
            if (path.basename(p) === 'Silicon.par') return realSiliconContent;
            throw new Error('ENOENT: ' + p);
        },
    });
    service.loadBuiltinMaterialDb();

    const symbols = service.getMaterialDbSymbols();

    // 验证 synthetic scope
    const scope = symbols.find(s => s.kind === 'scope' && s.name === 'Silicon');
    assert.ok(scope, 'Should create Silicon synthetic scope');
    assert.strictEqual(scope.scopeType, 'Material');

    // 验证至少解析出 20+ blocks（实际 99 个）
    const siliconBlocks = symbols.filter(s => s.kind === 'block' && s.parentPath === 'Material/Silicon');
    assert.ok(siliconBlocks.length >= 20, 'Real Silicon.par should have 20+ blocks, got ' + siliconBlocks.length);

    // 验证常见 block 存在
    const blockNames = siliconBlocks.map(s => s.name);
    assert.ok(blockNames.includes('Epsilon'), 'Should have Epsilon');
    assert.ok(blockNames.includes('Bandgap'), 'Should have Bandgap');

    service.dispose();
});
```

注意：此测试需在文件顶部添加 `const fs = require('fs');`。

- [ ] **Step 9: 运行全部测试**

Run: `node tests/test-par-materialdb.js`
Expected: 所有测试 PASS，包括新增的 6 个测试

Run: `node tests/test-par-index.js`
Expected: 所有测试 PASS（此文件不受影响）

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js`
Expected: 所有 PASS

---

### Task 4: 更新 .vscodeignore — 允许 MaterialDB 打包

**Files:**
- Modify: `.vscodeignore`

- [ ] **Step 1: 在 `references/**` 行后添加例外**

在 `references/**` 行之后添加一行：

```
!references/MaterialDB/**
```

修改后该区域应为：
```
references/**
!references/MaterialDB/**
docs/**
!docs/help/**
```

- [ ] **Step 2: 验证打包包含 MaterialDB 文件**

Run: `npx vsce ls --tree 2>&1 | grep -A 10 "MaterialDB"`
Expected: 输出中包含 `references/MaterialDB/` 下的 `.par` 文件列表

- [ ] **Step 3: 验证打包大小合理**

Run: `npx vsce ls --tree 2>&1 | tail -5`
Expected: 查看总文件数和包大小，确认增量合理（+169KB 对比上次发布）

---

### Task 5: 更新 THIRD_PARTY_NOTICES.md

**Files:**
- Modify: `THIRD_PARTY_NOTICES.md`

- [ ] **Step 1: 在现有 marked.js 声明之前添加 MaterialDB 数据来源说明**

在文件中找到 marked.js 条目之前，插入：

```markdown
## Sentaurus MaterialDB Parameter Files

The following parameter files from Synopsys Sentaurus TCAD T-2022.03 are bundled
as built-in fallback data for the SDEVICE PAR parameter file completion system:

- `references/MaterialDB/Silicon.par`
- `references/MaterialDB/Oxide.par`
- `references/MaterialDB/Germanium.par`
- `references/MaterialDB/Si3N4.par`
- `references/MaterialDB/HfO2.par`
- `references/MaterialDB/4H-SiC.par`
- `references/MaterialDB/Metal.par`

These files are proprietary to Synopsys, Inc. and are provided for use with
a valid Sentaurus TCAD license. Each file retains its original copyright notice.

```

---

### Task 6: 最终验证与提交

- [ ] **Step 1: 运行全部测试套件**

Run: `node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-index.js && node tests/test-par-completion.js && node tests/test-par-materialdb.js`
Expected: 全部 PASS

- [ ] **Step 2: 打包审计**

Run: `npx vsce ls --tree`
确认：
- `references/MaterialDB/*.par` 全部 7 个文件出现
- `example_sdevice.par` 也出现（无害，被 `loadBuiltinMaterialDb` 过滤）
- 无 `references/` 下其他子目录被打包

- [ ] **Step 3: 提交所有变更**

```bash
git add -A
git commit -m "feat(#76): 内置 MaterialDB 从 stub 升级为 bundled 真实 .par 文件

将 builtin MaterialDB 从内联 stub (81B/3block) 升级为从 bundled
references/MaterialDB/ 目录加载真实材料参数文件 (169KB/188block)。

变更：
- par-constants.js: 移除 BUILTIN_MATERIALDB_STUB_FILES 内联常量，
  新增 BUILTIN_MATERIALDB_DIR 和 BUILTIN_MATERIALDB_EXCLUDE
- par-index-service.js: loadBuiltinMaterialDb() 改为扫描 bundled
  目录加载，新增 readdirFn 依赖注入支持测试隔离
- .vscodeignore: 添加 !references/MaterialDB/** 例外
- THIRD_PARTY_NOTICES.md: 添加 MaterialDB 数据来源说明
- test-par-materialdb.js: 更新现有测试使用依赖注入，
  新增 6 个测试覆盖目录加载/排除/降级/空目录/单文件失败/真实文件场景

覆盖 7 种材料：Silicon(99block)、Oxide(18)、Germanium(21)、
Si3N4(14)、HfO2(12)、4H-SiC(13)、Metal(11)

Related: #76"
```
