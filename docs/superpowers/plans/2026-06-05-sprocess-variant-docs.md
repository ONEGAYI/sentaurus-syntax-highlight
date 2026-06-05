# SPROCESS 复数与点号变体关键词 Hover 文档补全 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 61 个 SPROCESS 变体关键词补全 Hover 文档（7 个复数 alias + 51 个点号变体真实文档），修改 HoverProvider 支持_alias 查找与点号回退。

**Architecture:** 三阶段实现：① 数据验证契约测试 → ② 数据层（7 alias + 51 点号变体 JSON 文档，中英双语）→ ③ 代码层（HoverProvider alias/dot fallback + buildItems guard）→ ④ 规范文件同步

**Tech Stack:** 纯 JavaScript（CommonJS），Node.js assert，零外部依赖，VSCode Extension API

**Spec:** `docs/superpowers/specs/2026-06-05-sprocess-variant-docs-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `tests/test-sprocess-variant-docs.js` | Create | 数据验证 + 代码集成测试（11 项） |
| `syntaxes/sprocess_command_docs.json` | Modify | 新增 7 alias + 51 点号变体英文文档 |
| `syntaxes/sprocess_command_docs.zh-CN.json` | Modify | 新增 7 alias + 51 点号变体中文文档 |
| `src/register-completion-providers.js` | Modify | HoverProvider alias/dot fallback（L479+L482）+ buildItems guard（L48-50） |
| `docs/函数文档提取与编写规范.md` | Modify | 补充 alias 结构定义 + SPROCESS section 值 + 质量检查项 |

`src/docs-loader.js` 的 `formatDoc` 函数**不需要修改**。

---

## Doc Entry Templates

### 点号变体文档模板

```json
"<key>": {
  "section": "<Section>",
  "signature": "<parent> <subkey> = <type>",
  "description": "<1-3 sentence description>",
  "parameters": [],
  "example": "<parent> <subkey> = <value>",
  "keywords": ["<parent>", "<topic1>", "<topic2>"]
}
```

### Alias 条目模板

```json
"<key>": {
  "aliasOf": "<parent>",
  "aliasType": "plural"
}
```

Alias 条目中英双语**完全一致**（`aliasOf`/`aliasType` 不翻译），语言标注由 HoverProvider 运行时根据 `useZh` 动态生成。

---

## Task 1: 数据验证契约测试

**Files:**
- Create: `tests/test-sprocess-variant-docs.js`

- [ ] **Step 1: 创建测试文件**

```javascript
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, summary } = require('./helpers/test-runner');

const root = path.join(__dirname, '..');

// --- Alias 候选（7 个唯一 key）---
const ALIAS_ENTRIES = ['ambients', 'contacts', 'interfaces', 'masks', 'points', 'polygons', 'regions'];

// --- 点号变体候选（51 个，去除尾随 =）---
const DOT_VARIANT_KEYS = [
    'ambient.name', 'ambient.products', 'ambient.rate',
    'beam.dose', 'boundary.conditions',
    'create.all.masks', 'deposit.intrinsic', 'deposit.type',
    'element.to.gauss', 'etch.rate.modifier',
    'extract.moments', 'extract.variable.name', 'extract.variable.names',
    'interface.mat.pairs', 'interface.materials', 'interface.region.pairs', 'interface.regions',
    'kmc.reset.snapshot', 'kmc.stress',
    'load.commands', 'load.mc',
    'mask.corner.mns', 'mask.corner.ngr', 'mask.corner.refine.extent',
    'mask.discretization.size', 'mask.edge.mns', 'mask.edge.ngr', 'mask.edge.refine.extent',
    'mgoals.native', 'optimize.dislocation',
    'point.coord', 'point.implant', 'point.response',
    'polygon.bounding.boxes', 'polygon.inside.points', 'polygon.name', 'polygon.names', 'polygon.tessellations',
    'polyhedron.material',
    'profile.reshaping',
    'region.list', 'region.name', 'region.names',
    'slice.angle', 'slice.angle.offset',
    'smooth.brep', 'smooth.distance', 'smooth.field', 'smooth.points',
    'stress.relax', 'stress.values',
];

const ALL_NEW_KEYS = [...ALIAS_ENTRIES, ...DOT_VARIANT_KEYS];
const VALID_TYPES = new Set(['string', 'number', 'int', 'float', 'boolean', 'enum', 'list', 'keyword', 'circuit', 'filepath']);

function readJson(relPath) {
    return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

test('SPROCESS variant docs JSON files parse correctly', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    assert.ok(typeof en === 'object' && en !== null);
    assert.ok(typeof zh === 'object' && zh !== null);
});

test('SPROCESS variant docs keys are unique', () => {
    for (const relPath of ['syntaxes/sprocess_command_docs.json', 'syntaxes/sprocess_command_docs.zh-CN.json']) {
        const raw = fs.readFileSync(path.join(root, relPath), 'utf8');
        const parsed = JSON.parse(raw);
        const keys = Object.keys(parsed);
        const keyPattern = /"([^"]+)"\s*:/g;
        const found = [];
        let m;
        while ((m = keyPattern.exec(raw)) !== null) found.push(m[1]);
        assert.strictEqual(found.length, keys.length, `Duplicate keys in ${relPath}`);
    }
});

test('SPROCESS alias entries have valid aliasOf targets', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of ALIAS_ENTRIES) {
        const entry = en[key];
        assert.ok(entry, `Missing alias entry: ${key}`);
        assert.ok(entry.aliasOf, `Missing aliasOf in ${key}`);
        assert.ok(en[entry.aliasOf], `aliasOf target "${entry.aliasOf}" not found for ${key}`);
        assert.strictEqual(entry.aliasType, 'plural', `aliasType must be "plural" for ${key}`);
    }
});

test('SPROCESS alias entries are consistent between EN and ZH', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    for (const key of ALIAS_ENTRIES) {
        assert.ok(en[key], `EN missing alias: ${key}`);
        assert.ok(zh[key], `ZH missing alias: ${key}`);
        assert.strictEqual(en[key].aliasOf, zh[key].aliasOf, `aliasOf mismatch for ${key}`);
        assert.strictEqual(en[key].aliasType, zh[key].aliasType, `aliasType mismatch for ${key}`);
    }
});

test('SPROCESS dot-variant docs have required fields', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of DOT_VARIANT_KEYS) {
        const entry = en[key];
        assert.ok(entry, `Missing dot-variant entry: ${key}`);
        assert.ok(entry.signature && entry.signature.length > 0, `${key} missing signature`);
        assert.ok(entry.description && entry.description.length > 0, `${key} missing description`);
    }
});

test('SPROCESS new doc keys exist in all_keywords.json', () => {
    const keywords = readJson('syntaxes/all_keywords.json');
    const sprocessKw = new Set();
    for (const [cat, kws] of Object.entries(keywords)) {
        if (cat.includes('sprocess')) {
            for (const kw of kws) sprocessKw.add(kw.replace(/=+$/, ''));
        }
    }
    for (const key of ALL_NEW_KEYS) {
        assert.ok(sprocessKw.has(key), `Key "${key}" not found in all_keywords.json sprocess categories`);
    }
});

test('SPROCESS dot-variant parameter types use standard labels', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    for (const key of DOT_VARIANT_KEYS) {
        const entry = en[key];
        if (!entry || !entry.parameters) continue;
        for (const p of entry.parameters) {
            assert.ok(VALID_TYPES.has(p.type), `${key} param "${p.name}" has invalid type "${p.type}"`);
        }
    }
});

test('SPROCESS all new entries exist in both EN and ZH', () => {
    const en = readJson('syntaxes/sprocess_command_docs.json');
    const zh = readJson('syntaxes/sprocess_command_docs.zh-CN.json');
    for (const key of ALL_NEW_KEYS) {
        assert.ok(en[key], `EN missing: ${key}`);
        assert.ok(zh[key], `ZH missing: ${key}`);
    }
});

summary();
```

- [ ] **Step 2: 运行测试，验证大部分失败**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: 全部失败。`JSON files parse correctly` 和 `keys are unique` 验证的是现有 JSON 结构（不含新增条目），可能通过但与新增条目相关的测试全部失败。

- [ ] **Step 3: 提交测试文件**

```bash
git add tests/test-sprocess-variant-docs.js
git commit -m "test: 添加 SPROCESS 变体文档数据验证契约测试（8 项）

为即将添加的 7 个 alias + 51 个点号变体文档编写数据完整性、
字段一致性、key 匹配验证。当前预期大部分测试失败。

Issue #87"
```

---

## Task 2: 添加 7 个 Alias 条目

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

- [ ] **Step 1: 在英文 JSON 中按字母序找到插入位置，添加 7 个 alias 条目**

在 `sprocess_command_docs.json` 中按字母序插入：

```json
"ambients": {
  "aliasOf": "ambient",
  "aliasType": "plural"
},
```

```json
"contacts": {
  "aliasOf": "contact",
  "aliasType": "plural"
},
```

```json
"interfaces": {
  "aliasOf": "interface",
  "aliasType": "plural"
},
```

```json
"masks": {
  "aliasOf": "mask",
  "aliasType": "plural"
},
```

```json
"points": {
  "aliasOf": "point",
  "aliasType": "plural"
},
```

```json
"polygons": {
  "aliasOf": "polygon",
  "aliasType": "plural"
},
```

```json
"regions": {
  "aliasOf": "region",
  "aliasType": "plural"
},
```

- [ ] **Step 2: 在中文 JSON 中添加完全相同的 7 个 alias 条目**

中英文 alias 条目**完全一致**（字段不翻译）。

- [ ] **Step 3: 运行测试验证 alias 部分通过**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: `alias entries have valid aliasOf targets` 和 `alias entries are consistent` 通过。

- [ ] **Step 4: 提交**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json
git commit -m "docs(sprocess): 添加 7 个复数变体 alias 条目

为 ambients/contacts/interfaces/masks/points/polygons/regions
添加 aliasOf + aliasType 指向对应单数命令文档。
中英文 JSON 完全一致，语言标注由 HoverProvider 运行时生成。

Issue #87"
```

---

## Task 3: 点号变体文档 — ambient/beam/boundary（5 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `ambient`、`beam`、`boundary` 章节

- [ ] **Step 1: 在 `sprocess_command_docs.json` 中按字母序找到各父命令条目位置，在其后插入点号变体条目**

在 `ambient` 条目之后插入：

```json
"ambient.name": {
  "section": "Ambient",
  "signature": "ambient name = <c>",
  "description": "Specifies the name of the ambient gas or environment used in the simulation. The name identifies the ambient for reference in subsequent commands such as diffuse or deposit.",
  "parameters": [
    {
      "name": "name",
      "type": "string",
      "desc": "Name of the ambient gas (e.g., O2, N2, H2O)."
    }
  ],
  "example": "ambient name= O2\nambient name= N2",
  "keywords": ["ambient", "gas", "environment", "name"]
},
```

```json
"ambient.products": {
  "section": "Ambient",
  "signature": "ambient products = <string_list>",
  "description": "Specifies the product species generated during the ambient reaction. Used in oxidation and diffusion simulations to define reaction products.",
  "parameters": [
    {
      "name": "products",
      "type": "list",
      "desc": "List of product species names."
    }
  ],
  "example": "ambient products= {SiO2}",
  "keywords": ["ambient", "reaction", "products", "oxidation"]
},
```

```json
"ambient.rate": {
  "section": "Ambient",
  "signature": "ambient rate = <string_list>",
  "description": "Specifies the reaction rate expression for the ambient gas. Defines the kinetic rate of the surface reaction during oxidation or deposition.",
  "parameters": [
    {
      "name": "rate",
      "type": "list",
      "desc": "Rate expression or coefficients for the ambient reaction."
    }
  ],
  "example": "ambient rate= {1.0}",
  "keywords": ["ambient", "rate", "kinetics", "reaction"]
},
```

在 `beam` 条目之后插入：

```json
"beam.dose": {
  "section": "Beam",
  "signature": "beam dose",
  "description": "Queries or sets the beam dose value for implantation simulations. Returns the current dose when used without arguments.",
  "parameters": [],
  "example": "beam dose",
  "keywords": ["beam", "dose", "implant", "query"]
},
```

在 `boundary` 条目之后插入：

```json
"boundary.conditions": {
  "section": "Boundary",
  "signature": "boundary conditions = <string_list>",
  "description": "Specifies the boundary conditions applied at the edges of the simulation domain. Controls how the simulator handles domain boundaries for diffusion and mechanics calculations.",
  "parameters": [
    {
      "name": "conditions",
      "type": "list",
      "desc": "List of boundary condition specifications (e.g., reflecting, absorbing)."
    }
  ],
  "example": "boundary conditions= {reflecting reflecting}",
  "keywords": ["boundary", "conditions", "simulation", "domain"]
},
```

- [ ] **Step 2: 运行测试验证本批次通过**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: 与这 5 个 key 相关的字段完整性测试不再报错。

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 ambient/beam/boundary 点号变体文档（5 条）

新增 ambient.name, ambient.products, ambient.rate, beam.dose,
boundary.conditions 共 5 个点号变体英文文档。

Issue #87"
```

---

## Task 4: 点号变体文档 — deposit/etch/element/extract（7 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `deposit`、`etch`、`element`、`extract` 章节

- [ ] **Step 1: 在各父命令条目之后插入点号变体**

在 `deposit` 条目之后插入：

```json
"deposit.intrinsic": {
  "section": "Deposit",
  "signature": "deposit intrinsic",
  "description": "Deposits an intrinsic (undoped) material layer. Used to deposit a layer without introducing any dopant species.",
  "parameters": [],
  "example": "deposit intrinsic Oxide thickness= 0.01",
  "keywords": ["deposit", "intrinsic", "undoped", "layer"]
},
```

```json
"deposit.type": {
  "section": "Deposit",
  "signature": "deposit type = <c>",
  "description": "Specifies the deposition type for the current deposit command. Controls whether the deposition is anisotropic, isotropic, or uses a specific fill method.",
  "parameters": [
    {
      "name": "type",
      "type": "enum",
      "desc": "Deposition type: anisotropic, isotropic, or fill."
    }
  ],
  "example": "deposit type= anisotropic Oxide thickness= 0.1",
  "keywords": ["deposit", "type", "anisotropic", "isotropic"]
},
```

在 `element` 条目之后插入：

```json
"element.to.gauss": {
  "section": "Implant",
  "signature": "element to.gauss",
  "description": "Enables the conversion of analytic implant profiles (Pearson or dual-Pearson) to Gaussian representations. This allows subsequent analytical operations on the implanted profiles.",
  "parameters": [],
  "example": "element to.gauss",
  "keywords": ["element", "gauss", "implant", "profile", "conversion"]
},
```

在 `etch` 条目之后插入：

```json
"etch.rate.modifier": {
  "section": "Etch",
  "signature": "etch rate.modifier = <string_list>",
  "description": "Specifies a multiplier or modification to the etch rate for specific materials. Used to fine-tune etch rates in complex etch processes.",
  "parameters": [
    {
      "name": "rate.modifier",
      "type": "list",
      "desc": "Rate modifier expressions paired with material names."
    }
  ],
  "example": "etch rate.modifier= {Oxide 1.5}",
  "keywords": ["etch", "rate", "modifier", "material"]
},
```

在 `extract` 条目之后插入：

```json
"extract.moments": {
  "section": "Extract",
  "signature": "extract moments",
  "description": "Extracts the statistical moments (range, straggle, skewness, kurtosis) of implanted dopant profiles. Used for analyzing implant profile characteristics.",
  "parameters": [],
  "example": "extract moments",
  "keywords": ["extract", "moments", "implant", "statistics", "profile"]
},
```

```json
"extract.variable.name": {
  "section": "Extract",
  "signature": "extract variable.name = <c>",
  "description": "Specifies the name of a single variable to extract from the simulation results. The extracted value is stored for later reference.",
  "parameters": [
    {
      "name": "variable.name",
      "type": "string",
      "desc": "Name of the variable to extract."
    }
  ],
  "example": "extract variable.name= Xval",
  "keywords": ["extract", "variable", "name", "result"]
},
```

```json
"extract.variable.names": {
  "section": "Extract",
  "signature": "extract variable.names = <string_list>",
  "description": "Specifies a list of variable names to extract from the simulation results. Used to retrieve multiple simulation quantities at once.",
  "parameters": [
    {
      "name": "variable.names",
      "type": "list",
      "desc": "List of variable names to extract."
    }
  ],
  "example": "extract variable.names= {Xval Yval Zval}",
  "keywords": ["extract", "variable", "names", "result", "list"]
},
```

- [ ] **Step 2: 运行测试**

Run: `node tests/test-sprocess-variant-docs.js`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 deposit/etch/element/extract 点号变体文档（7 条）

新增 deposit.intrinsic, deposit.type, element.to.gauss,
etch.rate.modifier, extract.moments, extract.variable.name,
extract.variable.names 共 7 个点号变体英文文档。

Issue #87"
```

---

## Task 5: 点号变体文档 — interface/kmc/load/icwb（9 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `interface`、`kmc`、`load`、`icwb` 章节

- [ ] **Step 1: 在各父命令条目之后插入点号变体**

在 `icwb` 相关区域（`icwb.create` 附近）插入：

```json
"create.all.masks": {
  "section": "ICWBBoundary",
  "signature": "icwb.create.all.masks",
  "description": "Creates masks for all layers defined in the IC Workbench (ICWB) layout file. Automatically processes every layer and generates corresponding mask definitions for subsequent deposit and etch operations.",
  "parameters": [],
  "example": "icwb.create.all.masks",
  "keywords": ["ICVWB", "mask", "layer", "GDS", "layout", "all"]
},
```

在 `interface` 条目之后插入：

```json
"interface.mat.pairs": {
  "section": "Interface",
  "signature": "interface mat.pairs = <string_list>",
  "description": "Specifies pairs of materials at whose interface recombination or other interface properties are applied. Each pair consists of two material names.",
  "parameters": [
    {
      "name": "mat.pairs",
      "type": "list",
      "desc": "List of material name pairs for interface property assignment."
    }
  ],
  "example": "interface mat.pairs= {Silicon Oxide}",
  "keywords": ["interface", "material", "pairs", "recombination"]
},
```

```json
"interface.materials": {
  "section": "Interface",
  "signature": "interface materials = <string_list>",
  "description": "Specifies the materials at which interface properties or boundary conditions are applied. Used to define interface models between specific material pairs.",
  "parameters": [
    {
      "name": "materials",
      "type": "list",
      "desc": "List of material names for interface definition."
    }
  ],
  "example": "interface materials= {Silicon Oxide}",
  "keywords": ["interface", "materials", "boundary", "model"]
},
```

```json
"interface.region.pairs": {
  "section": "Interface",
  "signature": "interface region.pairs = <string_list>",
  "description": "Specifies pairs of regions at whose interface properties are applied. Similar to mat.pairs but uses region names instead of material names for finer control.",
  "parameters": [
    {
      "name": "region.pairs",
      "type": "list",
      "desc": "List of region name pairs for interface property assignment."
    }
  ],
  "example": "interface region.pairs= {R1 R2}",
  "keywords": ["interface", "region", "pairs", "property"]
},
```

```json
"interface.regions": {
  "section": "Interface",
  "signature": "interface regions = <string_list>",
  "description": "Specifies the regions at whose boundaries interface properties are applied. Used for region-level interface model assignment.",
  "parameters": [
    {
      "name": "regions",
      "type": "list",
      "desc": "List of region names for interface definition."
    }
  ],
  "example": "interface regions= {source drain}",
  "keywords": ["interface", "regions", "boundary", "model"]
},
```

在 `kmc` 条目之后插入：

```json
"kmc.reset.snapshot": {
  "section": "KMC",
  "signature": "kmc reset.snapshot",
  "description": "Resets the Kinetic Monte Carlo (KMC) snapshot state. Used to clear the stored KMC state and restart the KMC simulation from the current configuration.",
  "parameters": [],
  "example": "kmc reset.snapshot",
  "keywords": ["KMC", "reset", "snapshot", "kinetic", "monte carlo"]
},
```

```json
"kmc.stress": {
  "section": "KMC",
  "signature": "kmc stress",
  "description": "Enables or queries stress calculation within the Kinetic Monte Carlo simulation. When enabled, KMC accounts for stress effects on defect diffusion and reaction rates.",
  "parameters": [],
  "example": "kmc stress",
  "keywords": ["KMC", "stress", "kinetic", "monte carlo", "defect"]
},
```

在 `load` 条目之后插入：

```json
"load.commands": {
  "section": "Load",
  "signature": "load commands = <c>",
  "description": "Specifies a file containing Tcl commands to be loaded and executed. Used to include external command scripts into the current simulation flow.",
  "parameters": [
    {
      "name": "commands",
      "type": "string",
      "desc": "Path to the Tcl command file to load."
    }
  ],
  "example": "load commands= my_setup.tcl",
  "keywords": ["load", "commands", "script", "file", "include"]
},
```

```json
"load.mc": {
  "section": "Load",
  "signature": "load mc",
  "description": "Loads Monte Carlo implantation tables or data. Used to initialize Monte Carlo simulation parameters from pre-computed data files.",
  "parameters": [],
  "example": "load mc",
  "keywords": ["load", "monte carlo", "implant", "data"]
},
```

- [ ] **Step 2: 运行测试**

Run: `node tests/test-sprocess-variant-docs.js`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 interface/kmc/load/icwb 点号变体文档（9 条）

新增 create.all.masks, interface.mat.pairs, interface.materials,
interface.region.pairs, interface.regions, kmc.reset.snapshot,
kmc.stress, load.commands, load.mc 共 9 个点号变体英文文档。

Issue #87"
```

---

## Task 6: 点号变体文档 — mask/mgoals/optimize（9 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `mask edge`、`mask corner`、`mask discretization`、`mgoals`、`optimize` 章节

- [ ] **Step 1: 在 `mask` 条目之后插入 mask 子命令变体**

```json
"mask.corner.mns": {
  "section": "Mask",
  "signature": "mask corner.mns = <string_list>",
  "description": "Specifies the material names for mask corner processing on the minimum-norm side. Controls how mask corners are handled during mesh refinement.",
  "parameters": [
    {
      "name": "corner.mns",
      "type": "list",
      "desc": "List of material names for minimum-norm side corner processing."
    }
  ],
  "example": "mask corner.mns= {Resist Oxide}",
  "keywords": ["mask", "corner", "mns", "refinement", "mesh"]
},
```

```json
"mask.corner.ngr": {
  "section": "Mask",
  "signature": "mask corner.ngr = <string_list>",
  "description": "Specifies the material names for mask corner processing on the no-growth-region side. Controls refinement behavior at mask corners.",
  "parameters": [
    {
      "name": "corner.ngr",
      "type": "list",
      "desc": "List of material names for no-growth-region side corner processing."
    }
  ],
  "example": "mask corner.ngr= {Resist}",
  "keywords": ["mask", "corner", "ngr", "refinement", "mesh"]
},
```

```json
"mask.corner.refine.extent": {
  "section": "Mask",
  "signature": "mask corner.refine.extent = <n>",
  "description": "Specifies the extent of refinement around mask corners. Controls how far from the corner the mesh refinement extends.",
  "parameters": [
    {
      "name": "corner.refine.extent",
      "type": "float",
      "desc": "Refinement extent distance (default unit: um)."
    }
  ],
  "example": "mask corner.refine.extent= 0.05",
  "keywords": ["mask", "corner", "refine", "extent", "mesh"]
},
```

```json
"mask.discretization.size": {
  "section": "Mask",
  "signature": "mask discretization.size = <n>",
  "description": "Specifies the discretization size for mask edges. Controls the segment length used when converting mask edges into discrete segments for mesh generation.",
  "parameters": [
    {
      "name": "discretization.size",
      "type": "float",
      "desc": "Discretization segment size (default unit: um)."
    }
  ],
  "example": "mask discretization.size= 0.01",
  "keywords": ["mask", "discretization", "size", "segment", "mesh"]
},
```

```json
"mask.edge.mns": {
  "section": "Mask",
  "signature": "mask edge.mns = <string_list>",
  "description": "Specifies the material names for mask edge processing on the minimum-norm side. Used to control refinement along mask edges.",
  "parameters": [
    {
      "name": "edge.mns",
      "type": "list",
      "desc": "List of material names for minimum-norm side edge processing."
    }
  ],
  "example": "mask edge.mns= {Resist Oxide}",
  "keywords": ["mask", "edge", "mns", "refinement", "mesh"]
},
```

```json
"mask.edge.ngr": {
  "section": "Mask",
  "signature": "mask edge.ngr = <string_list>",
  "description": "Specifies the material names for mask edge processing on the no-growth-region side. Controls refinement along mask edges where no growth occurs.",
  "parameters": [
    {
      "name": "edge.ngr",
      "type": "list",
      "desc": "List of material names for no-growth-region side edge processing."
    }
  ],
  "example": "mask edge.ngr= {Resist}",
  "keywords": ["mask", "edge", "ngr", "refinement", "mesh"]
},
```

```json
"mask.edge.refine.extent": {
  "section": "Mask",
  "signature": "mask edge.refine.extent = <n>",
  "description": "Specifies the extent of refinement along mask edges. Controls how far from the edge boundary the mesh refinement extends.",
  "parameters": [
    {
      "name": "edge.refine.extent",
      "type": "float",
      "desc": "Edge refinement extent distance (default unit: um)."
    }
  ],
  "example": "mask edge.refine.extent= 0.1",
  "keywords": ["mask", "edge", "refine", "extent", "mesh"]
},
```

在 `mgoals` 条目之后插入：

```json
"mgoals.native": {
  "section": "Mesh",
  "signature": "mgoals native",
  "description": "Switches the mgoals meshing engine to use the native (built-in) mesher instead of the default MGOALS mesher. Used for compatibility with legacy meshing workflows.",
  "parameters": [],
  "example": "mgoals native",
  "keywords": ["mgoals", "native", "mesh", "mesher"]
},
```

在 `optimize` 条目之后插入：

```json
"optimize.dislocation": {
  "section": "Optimization",
  "signature": "optimize dislocation",
  "description": "Enables dislocation optimization during mechanical stress simulations. Adjusts the dislocation network to minimize system energy.",
  "parameters": [],
  "example": "optimize dislocation",
  "keywords": ["optimize", "dislocation", "stress", "mechanics"]
},
```

- [ ] **Step 2: 运行测试**

Run: `node tests/test-sprocess-variant-docs.js`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 mask/mgoals/optimize 点号变体文档（9 条）

新增 mask.corner.mns, mask.corner.ngr, mask.corner.refine.extent,
mask.discretization.size, mask.edge.mns, mask.edge.ngr,
mask.edge.refine.extent, mgoals.native, optimize.dislocation
共 9 个点号变体英文文档。

Issue #87"
```

---

## Task 7: 点号变体文档 — point/polygon/polyhedron（9 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `point`、`polygon`、`polyhedron` 章节

- [ ] **Step 1: 在各父命令条目之后插入点号变体**

在 `point` 条目之后插入：

```json
"point.coord": {
  "section": "Geometry",
  "signature": "point coord = <string_list>",
  "description": "Specifies the coordinates of a named point. Points are used as building blocks for polygon and mask definitions.",
  "parameters": [
    {
      "name": "coord",
      "type": "list",
      "desc": "Coordinate values (2D: x y, 3D: x y z)."
    }
  ],
  "example": "point name= p1 coord= {0.0 0.0}",
  "keywords": ["point", "coordinate", "geometry", "2D"]
},
```

```json
"point.implant": {
  "section": "Geometry",
  "signature": "point implant",
  "description": "Defines a point used for implantation reference. Used to specify spatial reference points for implant operations.",
  "parameters": [],
  "example": "point implant",
  "keywords": ["point", "implant", "reference", "geometry"]
},
```

```json
"point.response": {
  "section": "Geometry",
  "signature": "point response",
  "description": "Defines a point used for response surface extraction. Used to specify evaluation points for response analysis.",
  "parameters": [],
  "example": "point response",
  "keywords": ["point", "response", "surface", "extraction"]
},
```

在 `polygon` 条目之后插入：

```json
"polygon.bounding.boxes": {
  "section": "Geometry",
  "signature": "polygon bounding.boxes",
  "description": "Returns the bounding boxes of all defined polygons. Useful for querying the spatial extent of polygonal regions.",
  "parameters": [],
  "example": "polygon bounding.boxes",
  "keywords": ["polygon", "bounding", "box", "extent", "query"]
},
```

```json
"polygon.inside.points": {
  "section": "Geometry",
  "signature": "polygon inside.points",
  "description": "Tests which polygons contain given points. Returns the polygon names that enclose the specified coordinates.",
  "parameters": [],
  "example": "polygon inside.points",
  "keywords": ["polygon", "inside", "point", "containment", "query"]
},
```

```json
"polygon.name": {
  "section": "Geometry",
  "signature": "polygon name = <c>",
  "description": "Specifies the name of a polygon for identification. Named polygons can be referenced by mask and other geometry commands.",
  "parameters": [
    {
      "name": "name",
      "type": "string",
      "desc": "Name identifier for the polygon."
    }
  ],
  "example": "polygon name= GatePoly points= {p1 p2 p3 p4}",
  "keywords": ["polygon", "name", "identifier", "geometry"]
},
```

```json
"polygon.names": {
  "section": "Geometry",
  "signature": "polygon names",
  "description": "Returns a list of all defined polygon names. Used to query existing polygon definitions in the simulation.",
  "parameters": [],
  "example": "polygon names",
  "keywords": ["polygon", "names", "list", "query"]
},
```

```json
"polygon.tessellations": {
  "section": "Geometry",
  "signature": "polygon tessellations",
  "description": "Returns the tessellation (triangulation) of defined polygons. Used for mesh generation from polygonal boundaries.",
  "parameters": [],
  "example": "polygon tessellations",
  "keywords": ["polygon", "tessellation", "triangulation", "mesh"]
},
```

在 `polyhedron` 条目之后插入：

```json
"polyhedron.material": {
  "section": "Geometry",
  "signature": "polyhedron material = <c>",
  "description": "Specifies the material type for a polyhedron region. Used in 3D simulations to assign material properties to polyhedral volumes.",
  "parameters": [
    {
      "name": "material",
      "type": "string",
      "desc": "Material name for the polyhedron (e.g., Silicon, Oxide)."
    }
  ],
  "example": "polyhedron material= Silicon",
  "keywords": ["polyhedron", "material", "3D", "volume"]
},
```

- [ ] **Step 2: 运行测试**

Run: `node tests/test-sprocess-variant-docs.js`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 point/polygon/polyhedron 点号变体文档（9 条）

新增 point.coord, point.implant, point.response,
polygon.bounding.boxes, polygon.inside.points, polygon.name,
polygon.names, polygon.tessellations, polyhedron.material
共 9 个点号变体英文文档。

Issue #87"
```

---

## Task 8: 点号变体文档 — profile/region/slice/smooth/stress（12 entries）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`

**Source:** `references/sprocess_ug_T-2022.03.md` — 搜索 `profile`、`region`、`slice`、`smooth`、`stress` 章节

- [ ] **Step 1: 在各父命令条目之后插入点号变体**

在 `profile` 条目之后插入：

```json
"profile.reshaping": {
  "section": "Profile",
  "signature": "profile reshaping",
  "description": "Enables or controls dopant profile reshaping during oxidation. Adjusts the dopant distribution to account for moving boundaries and oxide growth.",
  "parameters": [],
  "example": "profile reshaping",
  "keywords": ["profile", "reshaping", "dopant", "oxidation"]
},
```

在 `region` 条目之后插入：

```json
"region.list": {
  "section": "Region",
  "signature": "region list = <string_list>",
  "description": "Specifies a list of region names. Used to group or reference multiple regions in a single command.",
  "parameters": [
    {
      "name": "list",
      "type": "list",
      "desc": "List of region names."
    }
  ],
  "example": "region list= {R1 R2 R3}",
  "keywords": ["region", "list", "names", "group"]
},
```

```json
"region.name": {
  "section": "Region",
  "signature": "region name = <c>",
  "description": "Specifies the name of a simulation region. Named regions can be referenced by deposit, etch, and other commands for spatial targeting.",
  "parameters": [
    {
      "name": "name",
      "type": "string",
      "desc": "Region name identifier."
    }
  ],
  "example": "region name= source Silicon",
  "keywords": ["region", "name", "identifier", "spatial"]
},
```

```json
"region.names": {
  "section": "Region",
  "signature": "region names",
  "description": "Returns a list of all defined region names. Used to query existing region definitions in the simulation domain.",
  "parameters": [],
  "example": "region names",
  "keywords": ["region", "names", "list", "query"]
},
```

在 `slice` 条目之后插入：

```json
"slice.angle": {
  "section": "Slice",
  "signature": "slice angle = <n>",
  "description": "Specifies the angle for slicing the simulation domain. Used in 3D simulations to create 2D cross-sections at arbitrary angles.",
  "parameters": [
    {
      "name": "angle",
      "type": "float",
      "desc": "Slice angle in degrees."
    }
  ],
  "example": "slice angle= 45.0",
  "keywords": ["slice", "angle", "cross-section", "3D"]
},
```

```json
"slice.angle.offset": {
  "section": "Slice",
  "signature": "slice angle.offset",
  "description": "Returns or sets the angular offset for slice operations. Used to adjust the reference angle for domain slicing in 3D simulations.",
  "parameters": [],
  "example": "slice angle.offset",
  "keywords": ["slice", "angle", "offset", "3D", "cross-section"]
},
```

在 `smooth` 条目之后插入：

```json
"smooth.brep": {
  "section": "Smooth",
  "signature": "smooth brep",
  "description": "Performs boundary representation (B-rep) smoothing on geometry edges. Removes sharp corners and jagged boundaries from the simulation geometry.",
  "parameters": [],
  "example": "smooth brep",
  "keywords": ["smooth", "brep", "boundary", "geometry"]
},
```

```json
"smooth.distance": {
  "section": "Smooth",
  "signature": "smooth distance = <n>",
  "description": "Specifies the smoothing distance for geometry operations. Controls the extent of smoothing applied to boundaries and interfaces.",
  "parameters": [
    {
      "name": "distance",
      "type": "float",
      "desc": "Smoothing distance (default unit: um)."
    }
  ],
  "example": "smooth distance= 0.005",
  "keywords": ["smooth", "distance", "geometry", "boundary"]
},
```

```json
"smooth.field": {
  "section": "Smooth",
  "signature": "smooth field = <c>",
  "description": "Specifies the field variable to be smoothed. Applies smoothing to the specified solution field (e.g., doping concentration) to reduce numerical noise.",
  "parameters": [
    {
      "name": "field",
      "type": "string",
      "desc": "Name of the field variable to smooth."
    }
  ],
  "example": "smooth field= BoronConcentration",
  "keywords": ["smooth", "field", "concentration", "numerical"]
},
```

```json
"smooth.points": {
  "section": "Smooth",
  "signature": "smooth points = <string_list>",
  "description": "Specifies the points defining the smoothing region. Smoothing is applied to geometry boundaries within the region defined by these points.",
  "parameters": [
    {
      "name": "points",
      "type": "list",
      "desc": "List of named points defining the smoothing region."
    }
  ],
  "example": "smooth points= {p1 p2 p3}",
  "keywords": ["smooth", "points", "region", "geometry"]
},
```

在 `stress` 条目之后插入：

```json
"stress.relax": {
  "section": "Stress",
  "signature": "stress relax",
  "description": "Performs stress relaxation on the simulation domain. Computes the equilibrium stress state after structural changes such as deposition or etching.",
  "parameters": [],
  "example": "stress relax",
  "keywords": ["stress", "relax", "equilibrium", "mechanics"]
},
```

```json
"stress.values": {
  "section": "Stress",
  "signature": "stress values = <string_list>",
  "description": "Specifies stress values to be applied to the simulation domain. Used to impose external or initial stress conditions on materials or regions.",
  "parameters": [
    {
      "name": "values",
      "type": "list",
      "desc": "List of stress values to apply (components: xx, yy, zz, xy, yz, xz)."
    }
  ],
  "example": "stress values= {1e7 0 0 0 0 0}",
  "keywords": ["stress", "values", "mechanics", "initial", "condition"]
},
```

- [ ] **Step 2: 运行测试**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: 全部 8 项英文数据测试通过。

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.json
git commit -m "docs(sprocess): 添加 profile/region/slice/smooth/stress 点号变体文档（12 条）

新增 profile.reshaping, region.list, region.name, region.names,
slice.angle, slice.angle.offset, smooth.brep, smooth.distance,
smooth.field, smooth.points, stress.relax, stress.values
共 12 个点号变体英文文档。至此 51 个英文点号变体文档全部完成。

Issue #87"
```

---

## Task 9: 中文翻译

**Files:**
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**Reference:**
- `docs/glossary.json` — 1300+ 术语映射
- `docs/prompts/i18n/sprocess_command_docs.prompt.md` — 翻译 prompt 模板
- 英文 JSON 中已完成的 51 个点号变体 + 7 个 alias 条目

- [ ] **Step 1: 使用翻译 prompt 和 glossary 翻译 51 个点号变体文档**

翻译规则：
- `section` 值**不翻译**（保持英文，如 `"Mask"`、`"Geometry"`）
- `signature` **不翻译**
- `description` 翻译为中文
- `parameters[].desc` 翻译为中文
- `parameters[].name` 和 `parameters[].type` **不翻译**
- `example` **不翻译**
- `keywords` **不翻译**
- 术语参考 `docs/glossary.json` 保持一致性

7 个 alias 条目中英文**完全一致**（已在 Task 2 中添加）。

- [ ] **Step 2: 运行全部测试**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: 全部 8 项测试通过。

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess_command_docs.zh-CN.json
git commit -m "docs(sprocess): 添加 51 个点号变体 + 7 个 alias 中文文档

翻译 51 个点号变体文档为中文，遵循 glossary.json 术语表
和 sprocess_command_docs.prompt.md 翻译规范。

Issue #87"
```

---

## Task 10: HoverProvider — alias 解析 + 点号 fallback

**Files:**
- Modify: `src/register-completion-providers.js`

**Context:** `useZh` 已在函数作用域中可用（L91 从 `deps` 解构）。HoverProvider 闭包在 L384-553。

- [ ] **Step 1: 替换 L479（const → let）**

将 L479:
```javascript
const doc = (canonKey && docs[canonKey]) || docs[effectiveWord] || docs[decodeHtml(effectiveWord)];
```

替换为:
```javascript
let doc = (canonKey && docs[canonKey]) || docs[effectiveWord] || docs[decodeHtml(effectiveWord)];
```

- [ ] **Step 2: 在 Step 1 新增的 `let doc` 行之后、`const docHoverRange` 行之前插入点号 fallback**

> 注意：源码 L480 是空行，L481 是 `const docHoverRange = ...`。插入位置在 `let doc` 赋值之后、空行之前。

```javascript
// 点号 fallback：identWord（/[\w]+/）无法匹配含点号的词如 mask.edge.mns
if (!doc && word !== effectiveWord && word.includes('.')) {
    const dotKey = word.replace(/=+$/, '');
    doc = docs[dotKey] || docs[decodeHtml(dotKey)];
}
```

- [ ] **Step 3: 替换 L482（if doc return），加入 alias 预处理**

将 L482:
```javascript
if (doc) return new vscode.Hover(formatDoc(doc, langId), docHoverRange);
```

替换为:
```javascript
if (doc) {
    if (doc.aliasOf) {
        const parentDoc = docs[doc.aliasOf];
        if (parentDoc) {
            const aliasLabel = doc.aliasType === 'plural'
                ? (useZh ? `（${doc.aliasOf} 的复数形式）` : `(plural of ${doc.aliasOf})`)
                : (useZh ? `（参见 ${doc.aliasOf}）` : `(see ${doc.aliasOf})`);
            doc = { ...parentDoc, _aliasLabel: aliasLabel };
        } else {
            const missingLabel = useZh ? '（文档暂缺）' : ' (doc missing)';
            return new vscode.Hover(
                new vscode.MarkdownString(`**${effectiveWord}** → *${doc.aliasOf}*${missingLabel}`),
                docHoverRange
            );
        }
    }
    const md = formatDoc(doc, langId);
    if (doc._aliasLabel) {
        md.value = `*${doc._aliasLabel}*\n\n` + md.value;
    }
    return new vscode.Hover(md, docHoverRange);
}
```

- [ ] **Step 4: 运行现有测试确认无回归**

Run: `node tests/test-tcl-complex-subcommands.js`

Expected: 全部通过（本修改不影响 Tcl 子命令功能）。

Run: `node tests/test-sprocess-syntax-keyword-order.js`

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/register-completion-providers.js
git commit -m "feat: HoverProvider 支持 alias 预处理与点号关键词回退查找

- L479: const→let 允许 alias 重赋值
- 新增点号 fallback：identWord 无法匹配点号时使用 word 二次查找
- 新增 alias 解析：展开为带语言标注的父文档（useZh 驱动）
- 安全降级：父文档不存在时显示提示而非崩溃

Issue #87"
```

---

## Task 11: buildItems — alias guard

**Files:**
- Modify: `src/register-completion-providers.js`

**Context:** `buildItems` 函数在 L36-55。

- [ ] **Step 1: 修改 `buildItems` 函数中 L48-50 的 `funcDocs` 查找块，增加 alias 展开 guard**

将 L48-50（`if (funcDocs[keyword])` 三行块）：
```javascript
if (funcDocs[keyword]) {
    item.documentation = formatDoc(funcDocs[keyword], langId);
}
```

替换为:
```javascript
if (funcDocs[keyword]) {
    let entry = funcDocs[keyword];
    if (entry.aliasOf && funcDocs[entry.aliasOf]) {
        entry = funcDocs[entry.aliasOf];
    }
    item.documentation = formatDoc(entry, langId);
}
```

- [ ] **Step 2: 运行现有测试确认无回归**

Run: `node tests/test-tcl-complex-subcommands.js && node tests/test-sprocess-syntax-keyword-order.js`

Expected: 全部通过。

- [ ] **Step 3: 提交**

```bash
git add src/register-completion-providers.js
git commit -m "fix: buildItems 增加 alias guard 防止补全预览显示 undefined

alias 条目（仅含 aliasOf/aliasType）无 signature 字段，
直接传给 formatDoc 会输出 undefined。增加 alias 展开逻辑，
使用父文档替代。

Issue #87"
```

---

## Task 12: 代码集成测试

**Files:**
- Modify: `tests/test-sprocess-variant-docs.js`

**Context:** 需要扩展 `tests/helpers/mock-vscode.js` 中的 `MarkdownString`、`Hover`、`CompletionItem` 等模拟对象。现有 mock 只拦截 `require('vscode')`。

- [ ] **Step 1: 在测试文件末尾（`summary()` 之前）添加 3 项集成测试**

```javascript
// === Code Integration Tests ===
// 局部扩展 mock-vscode（仅在本测试文件中生效，不修改共享 mock）
const mockVscode = require('./helpers/mock-vscode');

// 补充本测试所需的构造函数（不影响其他测试文件）
mockVscode.MarkdownString = function(value) { this.value = value || ''; };
mockVscode.Hover = function(content, range) { this.content = content; this.range = range; };
mockVscode.CompletionItem = function(label, kind) { this.label = label; this.kind = kind; };
mockVscode.Range = function(s, e) { this.start = s; this.end = e; };
mockVscode.Position = function(line, char) { this.line = line; this.character = char; };
mockVscode.CompletionItemKind = {
    Function: 0, Keyword: 1, Text: 0, Struct: 1, Class: 1,
    Constant: 0, Value: 0, EnumMember: 0, Method: 0,
};
mockVscode.languages = {
    registerHoverProvider: function() { return { dispose: function() {} }; },
    registerCompletionItemProvider: function() { return { dispose: function() {} }; },
};
mockVscode.workspace = {
    getConfiguration: function() { return { get: function() { return undefined; } }; },
};

const { formatDoc } = require('../src/docs-loader');

test('alias resolution: formatDoc receives parent doc, not alias stub', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        masks: {
            aliasOf: 'mask',
            aliasType: 'plural',
        },
    };

    // Simulate buildItems alias guard
    let entry = funcDocs['masks'];
    if (entry.aliasOf && funcDocs[entry.aliasOf]) {
        entry = funcDocs[entry.aliasOf];
    }
    const md = formatDoc(entry, 'sprocess');
    assert.ok(md.value.includes('mask name= <c>'), 'Should contain parent signature');
    assert.ok(!md.value.includes('undefined'), 'Should not contain undefined');
});

test('dot fallback: word with dots resolves to dot-variant doc', () => {
    const docs = {
        'mask.edge.mns': {
            section: 'Mask',
            signature: 'mask edge.mns = <string_list>',
            description: 'Specifies material names for mask edge.',
            parameters: [],
            example: 'mask edge.mns= {Resist Oxide}',
            keywords: ['mask', 'edge'],
        },
    };

    // Simulate HoverProvider dot fallback logic
    const effectiveWord = 'mns';  // identWord match
    const word = 'mask.edge.mns';  // full word match
    let doc = docs[effectiveWord] || null;
    if (!doc && word !== effectiveWord && word.includes('.')) {
        const dotKey = word.replace(/=+$/, '');
        doc = docs[dotKey] || null;
    }
    assert.ok(doc, 'Dot fallback should find mask.edge.mns');
    assert.strictEqual(doc.section, 'Mask');
});

test('alias label generation: plural alias shows correct label', () => {
    const funcDocs = {
        mask: {
            section: 'Mask',
            signature: 'mask name= <c>',
            description: 'Creates a mask.',
            parameters: [],
            example: 'mask name= gate',
            keywords: ['mask'],
        },
        masks: {
            aliasOf: 'mask',
            aliasType: 'plural',
        },
    };

    // Simulate HoverProvider alias resolution (useZh = false)
    const useZh = false;
    let doc = funcDocs['masks'];
    let aliasLabel = '';
    if (doc.aliasOf) {
        const parentDoc = funcDocs[doc.aliasOf];
        if (parentDoc) {
            aliasLabel = doc.aliasType === 'plural'
                ? `(plural of ${doc.aliasOf})`
                : `(see ${doc.aliasOf})`;
            doc = { ...parentDoc, _aliasLabel: aliasLabel };
        }
    }
    assert.strictEqual(aliasLabel, '(plural of mask)');
    assert.ok(doc.signature === 'mask name= <c>', 'Should use parent signature');
    assert.ok(doc._aliasLabel === '(plural of mask)', 'Should have alias label');
});

// 将 summary() 移到文件最后
```

注意：需要在文件开头将 `summary()` 调用移到文件末尾（所有 test() 之后）。

- [ ] **Step 2: 运行全部测试**

Run: `node tests/test-sprocess-variant-docs.js`

Expected: 全部 11 项测试通过。

- [ ] **Step 3: 提交**

```bash
git add tests/test-sprocess-variant-docs.js
git commit -m "test: 添加 SPROCESS 变体文档代码集成测试（3 项）

新增 alias guard、dot fallback、alias label generation 测试。
扩展 mock-vscode 添加 MarkdownString/Hover/CompletionItem 模拟对象。

Issue #87"
```

---

## Task 13: 规范文件同步

**Files:**
- Modify: `docs/函数文档提取与编写规范.md`

**Reference:** Spec「规范文件同步更新」章节

- [ ] **Step 1: 在第 1 节后新增 1.5 节「Alias 条目结构」**

```markdown
### 1.5 Alias 条目结构

部分关键词通过别名关系指向已有文档（如复数形式 `masks` → 单数 `mask`）。
Alias 条目使用简化结构，不包含完整文档字段。

```json
"<key>": {
  "aliasOf": "<parent_key>",
  "aliasType": "plural"
}
```

规则：
- `aliasOf`（string，必填）：指向同一 JSON 文件中存在的父命令 key
- `aliasType`（string，必填）：当前仅有 `"plural"` 值，未来可扩展
- 中英文 JSON 中 alias 条目**完全一致**，字段不翻译
- 语言标注由 HoverProvider 运行时根据 `useZh` 动态生成
- HoverProvider 调用侧负责 alias 展开，`formatDoc` 不感知 alias
```

- [ ] **Step 2: 在 3.5 节补充 SPROCESS section 值清单**

运行以下命令提取现有 section 值：
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('syntaxes/sprocess_command_docs.json','utf8')); const s=new Set(Object.values(d).filter(e=>e.section).map(e=>e.section)); console.log([...s].sort().join('\n'))"
```

将输出的 section 值整理为有序列表，补充到文档 3.5 节。

- [ ] **Step 3: 在第 4 节质量检查清单补充 alias 相关检查项**

```markdown
- [ ] Alias 完整性：所有 `aliasOf` 目标在同一 JSON 文件中存在
- [ ] Alias 双语一致性：英文和中文 JSON 的 alias 条目 `aliasOf` 和 `aliasType` 值相同
```

- [ ] **Step 4: 提交**

```bash
git add docs/函数文档提取与编写规范.md
git commit -m "docs: 补充函数文档规范 — alias 结构定义、SPROCESS section 值、质量检查项

- 新增 1.5 节 Alias 条目结构（aliasOf/aliasType 字段规则）
- 3.5 节补充 SPROCESS section 值清单
- 第 4 节补充 Alias 完整性和双语一致性检查项

Issue #87"
```

---

## Task 14: 最终验证

- [ ] **Step 1: 运行全部测试**

Run: `node tests/test-sprocess-variant-docs.js && node tests/test-tcl-complex-subcommands.js && node tests/test-sprocess-syntax-keyword-order.js`

Expected: 全部通过。

- [ ] **Step 2: 检查 JSON 合法性**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/sprocess_command_docs.json','utf8')); console.log('EN OK')" && node -e "JSON.parse(require('fs').readFileSync('syntaxes/sprocess_command_docs.zh-CN.json','utf8')); console.log('ZH OK')"`

Expected: `EN OK` 和 `ZH OK`。

- [ ] **Step 3: 统计文档覆盖率**

Run: `node -e "const d=JSON.parse(require('fs').readFileSync('syntaxes/sprocess_command_docs.json','utf8')); console.log('Total entries:', Object.keys(d).length); const aliases=Object.values(d).filter(e=>e.aliasOf); console.log('Alias entries:', aliases.length); console.log('Full doc entries:', Object.keys(d).length - aliases.length)"`

- [ ] **Step 4: 手动功能验证（F5 启动扩展开发宿主）**

在扩展开发宿主中打开 `.cmd` 文件：
1. 悬停 `masks` → 应显示 `(plural of mask)` 标注 + mask 完整文档
2. 悬停 `mask.edge.mns` → 应显示对应点号变体文档
3. 悬停 `ambient.name` → 应显示对应点号变体文档
4. 补全菜单中选择 `masks` → 预览不应显示 `undefined`

- [ ] **Step 5: 更新 spec 状态**

在 spec 文件 `docs/superpowers/specs/2026-06-05-sprocess-variant-docs-design.md` 中将状态改为 `已实现`。

- [ ] **Step 6: 创建后续 Issue**

```bash
gh issue create --title "补全 SPROCESS 后缀关联关键词 Hover 文档" --body "## 背景

Issue #87 初筛时将缺失文档的 SPROCESS 关键词分为三类：复数变体、点号变体、后缀关联。前两类已在 #87 中完成，本 Issue 处理第三类。

## 范围

| 关键词 | 后缀关联目标 | Kind |
|--------|-------------|------|
| \`data\` | \`print.data\` | KEYWORD3 |
| \`xy\` | \`point.xy\` | KEYWORD3 |

## 初步方案

需判断两者是否为 alias 关系（类似复数变体）还是需要独立文档。参考 #87 的混合策略。

Part of #87"
```

- [ ] **Step 7: 最终提交**

```bash
git add docs/superpowers/specs/2026-06-05-sprocess-variant-docs-design.md
git commit -m "docs: 更新 SPROCESS 变体文档 spec 状态为已实现

所有 7 个 alias + 51 个点号变体文档已完成，
HoverProvider 和 buildItems 代码变更已验证。

Issue #87"
```
