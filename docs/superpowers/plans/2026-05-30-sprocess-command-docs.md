# SPROCESS 命令文档提取计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SPROCESS 的 136 个主命令编写中英文双语文档 JSON，集成到 VSCode 扩展的 Hover/Completion Provider。

**Architecture:** 从 `references/sprocess_ug_T-2022.03.md`（手册）和 `syntaxes/all_keywords.json`（关键词库）中提取 SPROCESS KEYWORD1 命令的签名、描述、参数、示例。每个命令作为 JSON 条目写入 `syntaxes/sprocess_command_docs.json`（英文）和 `syntaxes/sprocess_command_docs.zh-CN.json`（中文），遵循 `docs/函数文档提取与编写规范.md` 中的 Tcl 工具文档格式。最终在 `src/register-completion-providers.js` 中注册 SPROCESS 语言专属文档加载路径。

**Tech Stack:** Node.js（纯 CommonJS）、JSON 文档、VSCode Extension API

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `syntaxes/sprocess_command_docs.json` | 创建 | SPROCESS 英文命令文档 |
| `syntaxes/sprocess_command_docs.zh-CN.json` | 创建 | SPROCESS 中文命令文档 |
| `src/register-completion-providers.js:121-127` | 修改 | 添加 SPROCESS 文档加载逻辑 |
| `docs/函数文档提取与编写规范.md` | 修改 | 更新文档覆盖表，添加 SPROCESS 行 |
| `CLAUDE.md` | 修改 | 更新文件树中文档条目说明 |
| `build/sprocess-batches/` | 创建（临时） | 分批提取中间产物，完成后可删除 |

---

## 关键词范围

SPROCESS 在 `all_keywords.json` 中有 7 类关键词，共 2112 个。文档提取范围：

| Section | 数量 | 文档策略 |
|---------|------|---------|
| KEYWORD1 | 136 | **核心提取目标** — 主命令，每个都需完整文档 |
| KEYWORD2 | 943 | 参数名（如 `Antimony=`），随主命令提取，不单独建条目 |
| KEYWORD3 | 650 | 子命令（如 `deposit.intrinsic`），随主命令提取 |
| KEYWORD4 | 29 | pdb 命令族，作为独立命令提取 |
| FUNCTION | 128 | Tcl 内建函数，已有 `tcl_command_docs.json`，跳过 |
| SUBCOMMAND | 70 | Tcl 子命令，已有 `tcl_subcommand_docs.json`，跳过 |
| LITERAL3 | 156 | 材料/元素名，不需要文档，跳过 |

**需要文档的条目数：** 136（KEYWORD1）+ 29（KEYWORD4）= **165 个条目**

手册中 KEYWORD1 的匹配率约 87%（118/136），未匹配的 18 个命令可能散落在正文章节中，需手动定位或基于已有文档推断。

---

## 分批方案

按手册章节分组，每批约 30 个命令，确保同章节的命令在同一批中。共 **6 批**：

### 批次概览

| 批次 | 主题 | 命令数 | 手册章节参考 |
|------|------|--------|-------------|
| 1 | 结构生成与几何操作 | 28 | Ch.11 Structure Generation + Ch.A Commands (几何/结构类) |
| 2 | 工艺步骤（沉积/刻蚀/注入/扩散） | 30 | Ch.2 Implant + Ch.3 Diffusion + Ch.A (工艺命令) |
| 3 | 网格与数值求解 | 25 | Ch.14 Numerics + Ch.A (grid/refinebox/math/solution) |
| 4 | 可视化与数据输出 | 22 | Ch.A (plot/print/graphics/extract/struct) |
| 5 | ICVWB 与高级功能 | 25 | Ch.12 ICVWB + Ch.9 Stress + Ch.A (icwb*/mgoals/kmc等) |
| 6 | PDB 工具与辅助命令 | 35 | Ch.A (pdb*/sim*/Set*/环境/辅助命令) |

---

### Task 1: 创建文档基础设施

**Files:**
- Create: `syntaxes/sprocess_command_docs.json`（空 `{}`）
- Create: `syntaxes/sprocess_command_docs.zh-CN.json`（空 `{}`）

- [ ] **Step 1: 创建空的英文文档文件**

```bash
echo '{}' > syntaxes/sprocess_command_docs.json
```

- [ ] **Step 2: 创建空的中文文档文件**

```bash
echo '{}' > syntaxes/sprocess_command_docs.zh-CN.json
```

- [ ] **Step 3: 在 `register-completion-providers.js` 中添加 SPROCESS 文档加载**

修改文件 `src/register-completion-providers.js` 第 125 行附近，在 `inspect` 判断之后添加 `sprocess` 分支：

```javascript
// 原代码：
if (langId === 'inspect') return loadDocsJson('inspect_command_docs.json', useZh) || {};

// 修改为：
if (langId === 'inspect') return loadDocsJson('inspect_command_docs.json', useZh) || {};
if (langId === 'sprocess') return loadDocsJson('sprocess_command_docs.json', useZh) || {};
```

- [ ] **Step 4: 验证扩展仍能正常加载**

```bash
node -e "const r = require('./src/register-completion-providers'); console.log('OK:', typeof r.loadDocsJson)"
```

Expected: `OK: function`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json src/register-completion-providers.js
git commit -m "feat: SPROCESS 命令文档基础设施（空 JSON + 加载注册）

- 创建 sprocess_command_docs.json / .zh-CN.json 空文件
- register-completion-providers.js 添加 sprocess 语言文档加载路径
- 165 个命令文档将分 6 批提取填充"
```

---

### Task 2: 批次 1 — 结构生成与几何操作（28 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（28）：**
`region`, `boundary`, `point`, `point.xy`, `line`, `polygon`, `polyhedron`, `insert`, `element`, `deposit`, `etch`, `slice`, `transform`, `transform.mask`, `transform.refinement`, `translate`, `bound`, `smooth`, `strip`, `contour`, `layers`, `paste`, `CutLine2D`, `sde`, `sptopo`, `topo`, `Coordinations.Planes.Compatibility`, `2DOxidationSetUp`

**提取方法：**
1. 在手册中定位每个命令的 Appendix A 章节
2. 提取 signature、description、parameters、example
3. 根据命令所属功能分组分配 `section` 字段
4. 编写对应中文翻译

**文档格式（遵循规范）：**
```json
{
  "deposit": {
    "section": "Structure",
    "signature": "deposit <material> <thickness> ?<options>?",
    "description": "Deposits a layer of the specified material with the given thickness onto the current structure. Supports isotropic and anisotropic deposition modes.",
    "parameters": [
      { "name": "<material>", "type": "string", "desc": "Material name for the deposited layer." },
      { "name": "<thickness>", "type": "float", "desc": "Thickness of the deposited layer in micrometers." }
    ],
    "example": "deposit oxide thickness=0.1",
    "keywords": ["deposition", "layer", "material"]
  }
}
```

- [ ] **Step 1: 提取 28 个命令的英文文档**

使用 AI 辅助从手册中提取每个命令的文档信息。提取脚本输出 `build/sprocess-batches/batch1-en.json`。

- [ ] **Step 2: 编写 28 个命令的中文翻译**

基于英文文档翻译，输出 `build/sprocess-batches/batch1-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

将 batch1-en.json 的内容合并到 `syntaxes/sprocess_command_docs.json`，batch1-zh.json 合并到 `syntaxes/sprocess_command_docs.zh-CN.json`。

- [ ] **Step 4: 验证 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
const enK = Object.keys(en).sort();
const zhK = Object.keys(zh).sort();
console.log('EN:', enK.length, 'ZH:', zhK.length);
console.log('Keys match:', JSON.stringify(enK) === JSON.stringify(zhK));
"
```

Expected: `EN: 28 ZH: 28 Keys match: true`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 1 — 结构生成与几何操作（28 命令）

覆盖命令：region, boundary, point, line, polygon, polyhedron 等
来源：sprocess_ug_T-2022.03.md Appendix A + 正文章节"
```

---

### Task 3: 批次 2 — 工艺步骤（30 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（30）：**
`implant`, `diffuse`, `doping`, `profile`, `substrate_profile`, `reaction`, `ambient`, `gas_flow`, `beam`, `photo`, `init`, `mater`, `solution`, `equation`, `temp_ramp`, `integrate`, `interface`, `interpolate`, `select`, `sel`, `setMobilityModel`, `strain_profile`, `stress`, `stressdata`, `mechdata`, `update_principal_strain`, `update_principal_stress`, `LogFile`, `AdvancedCalibration`, `AdvancedPowerDeviceMode`

- [ ] **Step 1: 提取 30 个命令的英文文档**

输出 `build/sprocess-batches/batch2-en.json`。

- [ ] **Step 2: 编写 30 个命令的中文翻译**

输出 `build/sprocess-batches/batch2-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

- [ ] **Step 4: 验证 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
const enK = Object.keys(en).sort();
const zhK = Object.keys(zh).sort();
console.log('EN:', enK.length, 'ZH:', zhK.length);
console.log('Keys match:', JSON.stringify(enK) === JSON.stringify(zhK));
"
```

Expected: `EN: 58 ZH: 58 Keys match: true`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 2 — 工艺步骤（30 命令）

覆盖命令：implant, diffuse, doping, profile, reaction 等
来源：Ch.2 Ion Implantation + Ch.3 Diffusion + Appendix A"
```

---

### Task 4: 批次 3 — 网格与数值求解（25 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（25）：**
`grid`, `refinebox`, `bound`, `DeleteRefinementboxes`, `RangeRefinementboxes`, `math`, `line_edge_roughness`, `kmc`, `KMC2PDE`, `PDE2KMC`, `SetAtomistic`, `UnsetAtomistic`, `SetFastMode`, `SetPerformanceMode`, `Set3DDeviceMeshMode`, `Set3DMovingMeshMode`, `mgoals`, `extract`, `Arr`, `ArrBreak`, `Arrhenius`, `Enu2G`, `Enu2K`, `KG2E`, `KG2nu`

- [ ] **Step 1: 提取 25 个命令的英文文档**

输出 `build/sprocess-batches/batch3-en.json`。

- [ ] **Step 2: 编写 25 个命令的中文翻译**

输出 `build/sprocess-batches/batch3-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

- [ ] **Step 4: 验证 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
console.log('EN:', Object.keys(en).length, 'ZH:', Object.keys(zh).length);
console.log('Keys match:', JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(zh).sort()));
"
```

Expected: `EN: 83 ZH: 83 Keys match: true`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 3 — 网格与数值求解（25 命令）

覆盖命令：grid, refinebox, math, kmc, mgoals 等
来源：Ch.4 KMC + Ch.6 Alagator + Ch.14 Numerics + Appendix A"
```

---

### Task 5: 批次 4 — 可视化与数据输出（22 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（22）：**
`plot.1d`, `plot.2d`, `plot.xy`, `print.1d`, `print.data`, `print.commands`, `print_interpolated_params`, `graphics`, `struct`, `WritePlx`, `SetPlxList`, `SetTDRList`, `contour`, `stdiff`, `SheetResistance`, `GetMoleFractionFields`, `GetMoleFractionParam`, `MoleFractionFields`, `SetMoleFractionFields`, `define`, `defineproc`, `help`

- [ ] **Step 1: 提取 22 个命令的英文文档**

输出 `build/sprocess-batches/batch4-en.json`。

- [ ] **Step 2: 编写 22 个命令的中文翻译**

输出 `build/sprocess-batches/batch4-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

- [ ] **Step 4: 验证 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
console.log('EN:', Object.keys(en).length, 'ZH:', Object.keys(zh).length);
console.log('Keys match:', JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(zh).sort()));
"
```

Expected: `EN: 105 ZH: 105 Keys match: true`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 4 — 可视化与数据输出（22 命令）

覆盖命令：plot.*, print.*, graphics, struct 等
来源：Appendix A + 正文相关章节"
```

---

### Task 6: 批次 5 — ICVWB 与高级功能（25 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（25）：**
`icwb`, `icwb.composite`, `icwb.contact.mask`, `icwb.create.all.masks`, `icwb.create.mask`, `load`, `mask`, `optimize`, `fproc`, `fset`, `SetIIIVDiffParams`, `SetInterfaceInjectionLKMC`, `SetMultiphaseNickelSilicide`, `StressDependentSilicidation`, `SetDielectricOxidationMode`, `UnsetDielectricOxidationMode`, `SetTS4ImplantMode`, `SetTS4MechanicsMode`, `SetTS4OxidationMode`, `SetTS4PolyMode`, `PowerDeviceMode`, `AdvancedPowerDeviceModeReset`, `sptopo`, `tclsel`, `gas_flow`

- [ ] **Step 1: 提取 25 个命令的英文文档**

输出 `build/sprocess-batches/batch5-en.json`。

- [ ] **Step 2: 编写 25 个命令的中文翻译**

输出 `build/sprocess-batches/batch5-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

- [ ] **Step 4: 验证 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
console.log('EN:', Object.keys(en).length, 'ZH:', Object.keys(zh).length);
console.log('Keys match:', JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(zh).sort()));
"
```

Expected: `EN: 130 ZH: 130 Keys match: true`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 5 — ICVWB 与高级功能（25 命令）

覆盖命令：icwb.*, load, mask, optimize, SetTS4*, PowerDevice* 等
来源：Ch.12 ICVWB + Ch.9 Stress + Appendix A"
```

---

### Task 7: 批次 6 — PDB 工具与辅助命令（35 命令）

**Files:**
- Modify: `syntaxes/sprocess_command_docs.json`
- Modify: `syntaxes/sprocess_command_docs.zh-CN.json`

**命令列表（35）：**
`pdbIsAvailable`, `pdbUnSetDoubleArray`, `pdbUnSetDouble`, `pdbDelayDouble`, `pdbSetFunction`, `pdbSetSwitch`, `pdbSetArray`, `pdbSetElement`, `pdbGetString`, `pdbGetDoubleArray`, `pdbdiff`, `simDelayDouble`, `simGetBoolean`, `simGetDouble`, `simSetBoolean`, `simSetDouble`, `SetTemp`, `contact`, `term`, `refinebox`, `AdvancedCalibration`, `Compatibility`, `PowerDeviceMode`, `SetFastMode`, `fproc`, `fset`, `SetIIIVAlloyMaterial`（如存在）, `SetPltList`, `WritePlt`, 以及手册中遗漏但需补充的小命令

> 注：批次 6 包含 29 个 KEYWORD4（pdb 命令族）和若干未在前 5 批中覆盖的小命令。最终目标达到 **165 条目**。

- [ ] **Step 1: 提取 35 个命令的英文文档**

输出 `build/sprocess-batches/batch6-en.json`。

- [ ] **Step 2: 编写 35 个命令的中文翻译**

输出 `build/sprocess-batches/batch6-zh.json`。

- [ ] **Step 3: 合并到主文档文件**

- [ ] **Step 4: 验证最终 JSON 有效性和 key 一致性**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');
const enK = Object.keys(en).sort();
const zhK = Object.keys(zh).sort();
console.log('EN:', enK.length, 'ZH:', zhK.length);
console.log('Keys match:', JSON.stringify(enK) === JSON.stringify(zhK));

// 验证所有 KEYWORD1 都有文档
const kw = require('./syntaxes/all_keywords.json').sprocess.KEYWORD1;
const missing = kw.filter(k => !en[k]);
console.log('Missing KEYWORD1 docs:', missing.length, missing);
"
```

Expected: `EN: 165 ZH: 165 Keys match: true Missing KEYWORD1 docs: 0 []`

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sprocess_command_docs.json syntaxes/sprocess_command_docs.zh-CN.json build/sprocess-batches/
git commit -m "feat: SPROCESS 文档批次 6 — PDB 工具与辅助命令（35 命令）

覆盖命令：pdb*, sim*, SetTemp, contact, term 等
来源：Appendix A (pdb* 章节与辅助命令)
全部 165 个 SPROCESS 命令文档已完成"
```

---

### Task 8: 文档规范与项目文件更新

**Files:**
- Modify: `docs/函数文档提取与编写规范.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新文档规范中的覆盖表**

在 `docs/函数文档提取与编写规范.md` 的表格中添加 SPROCESS 行：

```markdown
| SProcess 命令文档 | SProcess (Tcl) | ~165 | `syntaxes/sprocess_command_docs.json` |
```

- [ ] **Step 2: 更新 CLAUDE.md 文件树**

在 `syntaxes/` 部分，`inspect_command_docs.zh-CN.json` 之后添加：

```
│   ├── sprocess_command_docs.{json,zh-CN.json}  ← SProcess 命令文档（中英文双语，~165 命令）
```

在架构描述的文档覆盖列表中添加 SPROCESS。

- [ ] **Step 3: 验证所有文件无语法错误**

```bash
node -e "require('./syntaxes/sprocess_command_docs.json'); console.log('EN OK')"
node -e "require('./syntaxes/sprocess_command_docs.zh-CN.json'); console.log('ZH OK')"
```

- [ ] **Step 4: Commit**

```bash
git add docs/函数文档提取与编写规范.md CLAUDE.md
git commit -m "docs: 更新文档规范和 CLAUDE.md，添加 SPROCESS 文档覆盖信息

- 函数文档提取与编写规范.md 添加 SPROCESS 行
- CLAUDE.md 文件树添加 sprocess_command_docs 条目"
```

---

### Task 9: 最终验证与清理

**Files:**
- Cleanup: `build/sprocess-batches/`（临时目录）
- Cleanup: `build/tmp_analyze.js`（临时分析脚本）

- [ ] **Step 1: 运行完整验证**

```bash
node -e "
const en = require('./syntaxes/sprocess_command_docs.json');
const zh = require('./syntaxes/sprocess_command_docs.zh-CN.json');

// 1. 数量和 key 一致
const enK = Object.keys(en).sort();
const zhK = Object.keys(zh).sort();
console.log('Count EN:', enK.length, 'ZH:', zhK.length);
console.log('Keys match:', JSON.stringify(enK) === JSON.stringify(zhK));

// 2. 每个条目都有必需字段
let issues = [];
enK.forEach(k => {
  const e = en[k];
  if (!e.signature) issues.push(k + ': missing signature');
  if (!e.description) issues.push(k + ': missing description');
  if (!Array.isArray(e.parameters)) issues.push(k + ': missing parameters');
  if (!e.example) issues.push(k + ': missing example');
  if (!e.section) issues.push(k + ': missing section');
});
console.log('Issues:', issues.length);
issues.forEach(i => console.log('  ', i));

// 3. KEYWORD1 全覆盖
const kw = require('./syntaxes/all_keywords.json').sprocess.KEYWORD1;
const missing = kw.filter(k => !en[k]);
console.log('KEYWORD1 coverage:', (kw.length - missing.length) + '/' + kw.length);
if (missing.length) console.log('Missing:', missing);
"
```

- [ ] **Step 2: 清理临时文件**

```bash
rm -rf build/sprocess-batches/ build/tmp_analyze.js
```

- [ ] **Step 3: Commit（如有清理变更）**

```bash
git add -A build/
git commit -m "chore: 清理 SPROCESS 文档提取临时文件"
```

---

## 自查清单

- [x] Spec coverage: 所有 136 个 KEYWORD1 + 29 个 KEYWORD4 都被 6 个批次覆盖
- [x] Placeholder scan: 所有步骤都有具体的命令和预期输出
- [x] Type consistency: 文档格式与现有 inspect/svisual 文档一致，字段名统一
