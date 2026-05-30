# Inspect 函数文档编写实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Inspect 语言创建完整的函数文档 JSON（中英文），注册到文档加载系统，使 Hover 和补全显示文档。

**Architecture:** 扁平 JSON 文档（`inspect_command_docs.json`），通过现有的 `loadDocsJson()` + `getDocs()` 懒加载机制与 Tcl 共享文档合并。仅需在 `register-completion-providers.js` 中增加 1 行 inspect 分支。

**Tech Stack:** 纯 JSON 数据文件，无构建步骤。文档格式与 `svisual_command_docs.json` 一致。

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| Modify | `src/register-completion-providers.js:124` | 在 `langSpecificDocs` IIFE 中添加 inspect 分支 |
| Create | `syntaxes/inspect_command_docs.json` | 英文文档（~190 条目） |
| Create | `syntaxes/inspect_command_docs.zh-CN.json` | 中文文档（~190 条目） |
| Read | `references/inspect_ug_T-2022.03.md` | 参考手册，文档提取源 |
| Reference | `syntaxes/svisual_command_docs.json` | 文档格式参考 |

---

### Task 0: 注册 inspect 文档加载路径

**Files:**
- Modify: `src/register-completion-providers.js:124`

- [ ] **Step 1: 添加 inspect 分支到 langSpecificDocs**

在 `src/register-completion-providers.js` 第 124 行（`if (langId === 'svisual')` 之后）插入：

```javascript
                    if (langId === 'inspect') return loadDocsJson('inspect_command_docs.json', useZh) || {};
```

修改后的 IIFE 完整代码（第 122-126 行）：

```javascript
                const langSpecificDocs = (() => {
                    if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
                    if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
                    if (langId === 'inspect') return loadDocsJson('inspect_command_docs.json', useZh) || {};
                    return {};
                })();
```

- [ ] **Step 2: 创建空的 inspect_command_docs.json 占位**

创建 `syntaxes/inspect_command_docs.json`：

```json
{}
```

创建 `syntaxes/inspect_command_docs.zh-CN.json`：

```json
{}
```

- [ ] **Step 3: 验证 inspect 语言仍然正常工作**

在 VSCode Extension Development Host 中打开 `display_test/inspect_simple_idvg_ins.cmd`，确认：
- Tcl 共享命令（`set`, `puts`, `if`）的 Hover 仍然显示文档
- Inspect 专有命令（`cv_create`, `proj_load`）的 Hover 显示 undefined（预期，因为文档为空）
- 补全列表正常弹出

- [ ] **Step 4: 提交**

```bash
git add src/register-completion-providers.js syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat: 注册 Inspect 函数文档加载路径

- 在 register-completion-providers.js 的 langSpecificDocs 中添加 inspect 分支
- 创建空的 inspect_command_docs.json 占位文件（中英文）
- 后续批次将逐步填充文档内容"
```

---

### Task 1: Batch 1 — 核心 I/O + 曲线生命周期（~25 条目）

**Files:**
- Modify: `syntaxes/inspect_command_docs.json`
- Modify: `syntaxes/inspect_command_docs.zh-CN.json`

**参考手册段落**: `references/inspect_ug_T-2022.03.md` 第七章前半部分

**提取的命令清单（25 个）:**

| 命令 | section |
|------|---------|
| `ft_scalar` | General |
| `cv_write` | File I/O |
| `fi_writeBitmap` | File I/O |
| `fi_writeEps` | File I/O |
| `fi_writePs` | File I/O |
| `graph_load` | File I/O |
| `graph_write` | File I/O |
| `param_load` | File I/O |
| `param_write` | File I/O |
| `proj_getDataSet` | File I/O |
| `proj_getList` | File I/O |
| `proj_getNodeList` | File I/O |
| `proj_load` | File I/O |
| `proj_unload` | File I/O |
| `proj_write` | File I/O |
| `cv_create` | Curves |
| `cv_createDS` | Curves |
| `cv_createFromScript` | Curves |
| `cv_createWithFormula` | Curves |
| `cv_delete` | Curves |
| `cv_display` | Curves |
| `cv_logScale` | Curves |
| `cv_log10Scale` | Curves |
| `cv_split` | Curves |
| `cv_split_disc` | Curves |

- [ ] **Step 1: 从手册提取英文文档**

阅读手册 `references/inspect_ug_T-2022.03.md` 中以下命令的完整描述：
- General-Purpose Commands（ft_scalar）
- Reading and Writing Files（全部）
- Creating, Displaying, and Deleting Curves（全部）

对每个命令，按以下 JSON 格式提取：

```json
{
  "command_name": {
    "section": "SectionName",
    "signature": "command_name <param1> <param2> ?optional?",
    "description": "英文描述，从手册总结。",
    "parameters": [
      { "name": "<param1>", "type": "string", "desc": "参数英文描述" }
    ],
    "example": "command_name arg1 arg2",
    "keywords": ["related", "words"]
  }
}
```

**格式规则：**
- `signature`：必选参数用 `< >`，可选参数用 `? ?`，列表用空格分隔
- `description`：从手册描述精简为 1-3 句话，不照搬原文
- `parameters`：每个参数必须包含 name/type/desc 三个字段
- `example`：优先从范本 `display_test/inspect_*.cmd` 中选取真实用例
- `keywords`：2-5 个相关词，辅助模糊搜索
- `cv_logScale` 和 `cv_log10Scale` 作为两个独立条目

将提取结果合并写入 `syntaxes/inspect_command_docs.json`（替换 `{}`）。

- [ ] **Step 2: 生成中文文档**

将 Step 1 的英文文档翻译为中文，写入 `syntaxes/inspect_command_docs.zh-CN.json`。

翻译规则：
- `section` 不翻译（英文原文保留）
- `signature` 不翻译
- `description` 翻译为中文
- `parameters[].desc` 翻译为中文
- `example` 不翻译
- `keywords` 不翻译

- [ ] **Step 3: 验证 Hover 显示**

在 VSCode Extension Development Host 中：
1. 打开 `display_test/inspect_simple_idvg_ins.cmd`
2. 将光标悬停在 `proj_load` 上 → 应显示签名、描述、参数
3. 将光标悬停在 `cv_createDS` 上 → 应显示签名、描述、参数
4. 将光标悬停在 `ft_scalar` 上 → 应显示签名和描述

- [ ] **Step 4: 校验中英文一致性**

```bash
python scripts/docs/validate_i18n.py syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
```

预期：两个文件的键（命令名）完全一致。

- [ ] **Step 5: 提交**

```bash
git add syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat(inspect): 添加 Batch 1 函数文档 — 核心 I/O + 曲线生命周期

包含 25 个命令的 Hover/补全文档（中英文双语）：
- 通用：ft_scalar
- 文件读写：cv_write, fi_write*, graph_*, param_*, proj_*（14 个）
- 曲线创建/显示：cv_create*, cv_delete, cv_display, cv_log*, cv_split*（10 个）"
```

---

### Task 2: Batch 2 — 数据访问 + 属性控制 + 计算/脚本（~30 条目）

**Files:**
- Modify: `syntaxes/inspect_command_docs.json`
- Modify: `syntaxes/inspect_command_docs.zh-CN.json`

**参考手册段落**: 第七章后半部分（Accessing Curve Data → Controlling Scripts）

**提取的命令清单（33 个）:**

| 命令 | section |
|------|---------|
| `cv_getVals` | Data Access |
| `cv_getValsX` | Data Access |
| `cv_getValsY` | Data Access |
| `cv_getXaxis` | Data Access |
| `cv_getYaxis` | Data Access |
| `cv_printVals` | Data Access |
| `cv_abs` | Transform |
| `cv_delPts` | Transform |
| `cv_inv` | Transform |
| `cv_reset` | Transform |
| `cv_lineColor` | Attributes |
| `cv_lineStyle` | Attributes |
| `cv_renameCurve` | Attributes |
| `cv_set_interpol` | Attributes |
| `cv_setCurveAttr` | Attributes |
| `gb_setpreferences` | Attributes |
| `gr_createLabel` | Attributes |
| `gr_deleteLabel` | Attributes |
| `gr_formatAxis` | Attributes |
| `gr_mappedAxis` | Attributes |
| `gr_precision` | Attributes |
| `gr_setAxisAttr` | Attributes |
| `gr_setGeneralAttr` | Attributes |
| `gr_setGridAttr` | Attributes |
| `gr_setLegendAttr` | Attributes |
| `gr_setLegendPos` | Attributes |
| `gr_setTitleAttr` | Attributes |
| `cv_compute` | Computing |
| `cv_getZero` | Computing |
| `macro_define` | Computing |
| `script_break` | Script Control |
| `script_exit` | Script Control |
| `script_sleep` | Script Control |

- [ ] **Step 1: 从手册提取英文文档**

阅读手册中以下章节：
- Accessing Curve Data（6 个命令）
- Transforming Curve Data（4 个命令）
- Changing Attributes（17 个命令）
- Computing（3 个命令）
- Controlling Scripts（3 个命令）

对 `cv_setCurveAttr` 等参数较多的命令，在范本中找到真实调用示例：
```
cv_setCurveAttr idvd0 "Vg=0.0" black solid 1 circle 5 defcolor 1 defcolor
```

将提取结果追加到 `syntaxes/inspect_command_docs.json`。

- [ ] **Step 2: 生成中文文档**

同 Task 1 Step 2 的翻译规则。追加到 `syntaxes/inspect_command_docs.zh-CN.json`。

- [ ] **Step 3: 验证 Hover 显示**

1. 打开 `display_test/inspect_advanced_idvd_ins.cmd`
2. 悬停 `cv_setCurveAttr` → 应显示完整参数列表
3. 悬停 `gr_setAxisAttr` → 应显示完整参数列表
4. 悬停 `cv_getVals` → 应显示返回值说明

- [ ] **Step 4: 校验并提交**

```bash
python scripts/docs/validate_i18n.py syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git add syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat(inspect): 添加 Batch 2 函数文档 — 数据访问 + 属性控制 + 计算

包含 33 个命令的 Hover/补全文档（中英文双语）：
- 数据访问：cv_getVals*, cv_getXaxis 等（6 个）
- 数据变换：cv_abs, cv_delPts, cv_inv, cv_reset（4 个）
- 属性控制：cv_lineColor, cv_setCurveAttr, gr_* 等（17 个）
- 计算：cv_compute, cv_getZero, macro_define（3 个）
- 脚本控制：script_break, script_exit, script_sleep（3 个）"
```

---

### Task 3: Batch 3 — 提取函数 + Extraction Library（~28 条目）

**Files:**
- Modify: `syntaxes/inspect_command_docs.json`
- Modify: `syntaxes/inspect_command_docs.zh-CN.json`

**参考手册段落**: 第七章 "Extracting Parameters" + 第八章 "Extraction Library"

**提取的命令清单（28 个）:**

| 命令 | section |
|------|---------|
| `f_Gamma` | Extraction |
| `f_gm` | Extraction |
| `f_hideInternalCurves` | Extraction |
| `f_IDSS` | Extraction |
| `f_KP` | Extraction |
| `f_Ron` | Extraction |
| `f_Rout` | Extraction |
| `f_showInternalCurves` | Extraction |
| `f_TetaG` | Extraction |
| `f_VT` | Extraction |
| `f_VT1` | Extraction |
| `f_VT2` | Extraction |
| `cv_linTransCurve` | Extraction Library |
| `cv_scaleCurve` | Extraction Library |
| `ExtractBVi` | Extraction Library |
| `ExtractBVv` | Extraction Library |
| `ExtractEarlyV` | Extraction Library |
| `ExtractGm` | Extraction Library |
| `ExtractGmb` | Extraction Library |
| `ExtractIoff` | Extraction Library |
| `ExtractMax` | Extraction Library |
| `ExtractRon` | Extraction Library |
| `ExtractSS` | Extraction Library |
| `ExtractValue` | Extraction Library |
| `ExtractVtgm` | Extraction Library |
| `ExtractVtgmb` | Extraction Library |
| `ExtractVti` | Extraction Library |
| `FilterTable` | Extraction Library |

- [ ] **Step 1: 从手册提取英文文档**

阅读手册中：
- Extracting Parameters（12 个 f_ 函数）
- Extraction Library（16 个命令）

注意：Extraction Library 的 `Extract*` 函数参数签名可能较长，确保完整记录。

- [ ] **Step 2: 生成中文文档**

同前。追加到 zh-CN 文件。

- [ ] **Step 3: 验证 Hover 显示**

1. 打开任意 Inspect 文件
2. 悬停 `f_VT` → 应显示阈值电压提取说明
3. 悬停 `ExtractGm` → 应显示跨导提取说明

- [ ] **Step 4: 校验并提交**

```bash
python scripts/docs/validate_i18n.py syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git add syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat(inspect): 添加 Batch 3 函数文档 — 提取函数 + Extraction Library

包含 28 个命令的 Hover/补全文档（中英文双语）：
- 提取函数：f_Gamma, f_gm, f_VT 等（12 个）
- Extraction Library：Extract*, cv_linTransCurve, FilterTable（16 个）"
```

---

### Task 4: Batch 4 — extend Library（~48 条目）

**Files:**
- Modify: `syntaxes/inspect_command_docs.json`
- Modify: `syntaxes/inspect_command_docs.zh-CN.json`

**参考手册段落**: 第八章 "The extend Library"

**提取的命令清单（48 个）:**

| 命令 | section |
|------|---------|
| `cv_addCurve` | extend Library |
| `cv_addDataset` | extend Library |
| `cv_angularMap` | extend Library |
| `cv_autoIncrStyle` | extend Library |
| `cv_disp` | extend Library |
| `cv_exists` | extend Library |
| `cv_getGlobalExtrema` | extend Library |
| `cv_getLocalExtrema` | extend Library |
| `cv_getNames` | extend Library |
| `cv_getRange` | extend Library |
| `cv_getXmax` | extend Library |
| `cv_getXmin` | extend Library |
| `cv_getYmax` | extend Library |
| `cv_getYmin` | extend Library |
| `cv_integrate` | extend Library |
| `cv_isVisible` | extend Library |
| `cv_linFit` | extend Library |
| `cv_linTrans` | extend Library |
| `cv_monotonicX` | extend Library |
| `cv_nextColor` | extend Library |
| `cv_nextLine` | extend Library |
| `cv_nextSymbol` | extend Library |
| `cv_resetColor` | extend Library |
| `cv_resetFillColor` | extend Library |
| `cv_resetLine` | extend Library |
| `cv_resetStyle` | extend Library |
| `cv_resetSymbol` | extend Library |
| `cv_round` | extend Library |
| `cv_scale` | extend Library |
| `cv_setFillColor` | extend Library |
| `cv_setSymbol` | extend Library |
| `cv_sort` | extend Library |
| `cv_write` | extend Library |
| `dbputs` | extend Library |
| `ds_getValue` | extend Library |
| `fi_readTxtFile` | extend Library |
| `fi_readTxtFileHeader` | extend Library |
| `gr_axis` | extend Library |
| `gr_resetAxis` | extend Library |
| `gr_setStyle` | extend Library |
| `ldiff` | extend Library |
| `lintersect` | extend Library |
| `ltranspose` | extend Library |
| `lunion` | extend Library |
| `proj_check` | extend Library |
| `proj_datasetExists` | extend Library |
| `proj_getGroups` | extend Library |
| `proj_groupExists` | extend Library |

注意：`proj_loadPlx` 如果在手册 extend Library 章节中也有描述，一并包含。

- [ ] **Step 1: 从手册提取英文文档**

阅读手册 "The extend Library" 章节。这是最大的一批，如果单次上下文压力大，可拆为 Part 1（前 24 个）和 Part 2（后 24 个）分两次提取。

在范本 `display_test/inspect_solar_iv_ins.cmd` 中找到 extend 库的真实调用：
- `cv_disp`, `cv_scale`, `cv_resetColor`, `cv_nextSymbol`
- `proj_datasetExists`, `dbputs`, `cv_compute`（与公式函数配合使用）

- [ ] **Step 2: 生成中文文档**

同前。追加到 zh-CN 文件。

- [ ] **Step 3: 验证 Hover 显示**

1. 打开 `display_test/inspect_solar_iv_ins.cmd`
2. 悬停 `cv_disp` → 应显示 extend 库版本的文档
3. 悬停 `dbputs` → 应显示调试输出说明
4. 悬停 `proj_datasetExists` → 应显示数据集检查说明

- [ ] **Step 4: 校验并提交**

```bash
python scripts/docs/validate_i18n.py syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git add syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat(inspect): 添加 Batch 4 函数文档 — extend Library

包含 48 个命令的 Hover/补全文档（中英文双语）：
- 曲线操作：cv_addCurve, cv_scale, cv_sort 等（7 个）
- 样式控制：cv_disp, cv_nextColor, cv_autoIncrStyle 等（12 个）
- 曲线信息：cv_exists, cv_getRange, cv_getExtrema 等（10 个）
- 计算：cv_integrate, cv_linFit, cv_round（3 个）
- 文件/项目/列表/图形：其余 16 个"
```

---

### Task 5: Batch 5 — 公式函数 + 其他库（~60 条目）

**Files:**
- Modify: `syntaxes/inspect_command_docs.json`
- Modify: `syntaxes/inspect_command_docs.zh-CN.json`

**参考手册段落**: 第六章 "Formulas and Macros" + 第八章 PhysicalConstants/IC-CAP/Curve Comparison

**提取的命令清单（~60 个）:**

公式函数（32 个，仅 Inspect 特有，不含与 Tcl 重叠的 21 个标准数学函数）：

| 命令 | section |
|------|---------|
| `vecmax` | Formula |
| `vecmin` | Formula |
| `vecvalx` | Formula |
| `vecvaly` | Formula |
| `veczero` | Formula |
| `fftabs` | Formula |
| `fftim` | Formula |
| `fftre` | Formula |
| `ifftim` | Formula |
| `ifftre` | Formula |
| `cfftim` | Formula |
| `cfftre` | Formula |
| `cifftim` | Formula |
| `cifftre` | Formula |
| `j0` | Formula |
| `j1` | Formula |
| `y0` | Formula |
| `y1` | Formula |
| `acosh` | Formula |
| `asinh` | Formula |
| `atanh` | Formula |
| `cbrt` | Formula |
| `diff` | Formula |
| `erf` | Formula |
| `fabs` | Formula |
| `gamma` | Formula |
| `integr` | Formula |
| `intercept` | Formula |
| `lgamma` | Formula |
| `maxslope` | Formula |
| `minslope` | Formula |
| `tangent` | Formula |

PhysicalConstants（27 个）：

| 命令 | section |
|------|---------|
| `const::SpeedOfLight` | PhysicalConstants |
| `const::Permeability` | PhysicalConstants |
| `const::Permittivity` | PhysicalConstants |
| `const::GravitationConstant` | PhysicalConstants |
| `const::PlanckConstant` | PhysicalConstants |
| `const::ElementaryCharge` | PhysicalConstants |
| `const::MagneticFluxQuantum` | PhysicalConstants |
| `const::ElectronVolt` | PhysicalConstants |
| `const::ElectronMass` | PhysicalConstants |
| `const::ProtonMass` | PhysicalConstants |
| `const::FineStructureConstant` | PhysicalConstants |
| `const::RydbergConstant` | PhysicalConstants |
| `const::AvogadroConstant` | PhysicalConstants |
| `const::FaradayConstant` | PhysicalConstants |
| `const::BoltzmannConstant` | PhysicalConstants |
| `const::StefanBoltzmannConstant` | PhysicalConstants |
| `const::BohrMagneton` | PhysicalConstants |
| `const::FreeSpaceImpedance` | PhysicalConstants |
| `const::AtomicMassConstant` | PhysicalConstants |
| `const::MolarVolume` | PhysicalConstants |
| `const::Pi` | PhysicalConstants |
| `const::getVarNames` | PhysicalConstants |
| `const::printVarNames` | PhysicalConstants |

其他（4 个）：

| 命令 | section |
|------|---------|
| `iccap_Write` | IC-CAP |
| `cvcmp_CompareTwoCurves` | Curve Comparison |
| `cvcmp_DeltaTwoCurves` | Curve Comparison |
| `load_library` | General |

- [ ] **Step 1: 从手册提取公式函数英文文档**

阅读手册第六章 "Formulas and Macros"。公式函数用在 `cv_createWithFormula` 和 `cv_compute` 的表达式中。

签名格式统一为：
```json
{
  "vecmax": {
    "section": "Formula",
    "signature": "vecmax(<curve>)",
    "description": "Returns the maximum Y value of the curve.",
    "parameters": [
      { "name": "<curve>", "type": "curve", "desc": "Curve reference in angle brackets, e.g. <curveName>." }
    ],
    "example": "cv_compute \"vecmax(<P($n)>)\" A A A A",
    "keywords": ["max", "vector", "maximum"]
  }
}
```

- [ ] **Step 2: 从手册源码提取 PhysicalConstants 文档**

VM 上 `/opt/eda/synopsys/sentaurus/T-2022.03/tcad/T-2022.03/lib/inspectlib/PhysicalConstants.tcl` 已在之前 SSH 会话中读取过内容。每个常量的格式：

```json
{
  "const::ElementaryCharge": {
    "section": "PhysicalConstants",
    "signature": "$const::ElementaryCharge",
    "description": "Elementary charge (1.602×10⁻¹⁹ C). The electric charge carried by a single proton.",
    "parameters": [],
    "example": "set q $const::ElementaryCharge",
    "keywords": ["charge", "physical", "constant"]
  }
}
```

注意：`const::getVarNames` 和 `const::printVarNames` 是 proc，使用标准函数格式。

- [ ] **Step 3: 提取其他库文档**

从手册第八章提取：
- IC-CAP Library：`iccap_Write`
- Curve Comparison Library：`cvcmp_CompareTwoCurves`, `cvcmp_DeltaTwoCurves`
- `load_library`

- [ ] **Step 4: 生成中文文档**

同前。追加到 zh-CN 文件。

- [ ] **Step 5: 验证 Hover 显示**

1. 在 `inspect_solar_iv_ins.cmd` 中悬停 `vecmin` → 应显示公式函数文档
2. 在任意 Inspect 文件中输入 `$const::` → 补全列表应显示所有常量名
3. 悬停 `cvcmp_CompareTwoCurves` → 应显示曲线比较说明

- [ ] **Step 6: 校验并提交**

```bash
python scripts/docs/validate_i18n.py syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git add syntaxes/inspect_command_docs.json syntaxes/inspect_command_docs.zh-CN.json
git commit -m "feat(inspect): 添加 Batch 5 函数文档 — 公式函数 + 库

包含 ~60 个条目的 Hover/补全文档（中英文双语）：
- 公式函数：vecmax, fft*, j0/y0 等（32 个）
- PhysicalConstants：25 个常量 + 2 个查询函数（27 个）
- IC-CAP/Curve Comparison/load_library（4 个）

全部 5 批次完成，inspect 函数文档共 ~190 条目"
```

---

### Task 6: 最终验证

**Files:**
- Verify: `syntaxes/inspect_command_docs.json`
- Verify: `syntaxes/inspect_command_docs.zh-CN.json`
- Verify: `src/register-completion-providers.js`

- [ ] **Step 1: 统计文档条目数**

```bash
node -e "const d=require('./syntaxes/inspect_command_docs.json'); console.log('English entries:', Object.keys(d).length)"
node -e "const d=require('./syntaxes/inspect_command_docs.zh-CN.json'); console.log('Chinese entries:', Object.keys(d).length)"
```

预期：两个文件条目数一致，总计约 190 个。

- [ ] **Step 2: 检查格式一致性**

```bash
node -e "
const en = require('./syntaxes/inspect_command_docs.json');
const zh = require('./syntaxes/inspect_command_docs.zh-CN.json');
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();
const missing = enKeys.filter(k => !zhKeys.includes(k));
const extra = zhKeys.filter(k => !enKeys.includes(k));
if (missing.length) console.log('Missing in zh-CN:', missing);
if (extra.length) console.log('Extra in zh-CN:', extra);
if (!missing.length && !extra.length) console.log('Keys match: ' + enKeys.length);

// 检查每个条目都有必需字段
let issues = [];
for (const [k, v] of Object.entries(en)) {
  if (!v.signature) issues.push(k + ': missing signature');
  if (!v.description) issues.push(k + ': missing description');
  if (!v.section) issues.push(k + ': missing section');
}
if (issues.length) { console.log('Issues:'); issues.forEach(i => console.log('  ' + i)); }
else console.log('All entries have required fields');
"
```

- [ ] **Step 3: VSCode 端到端验证**

在 VSCode Extension Development Host 中：
1. 打开 `display_test/inspect_simple_idvg_ins.cmd` → 悬停 `proj_load` → 文档显示正常
2. 打开 `display_test/inspect_advanced_idvd_ins.cmd` → 悬停 `cv_setCurveAttr` → 参数列表完整
3. 打开 `display_test/inspect_solar_iv_ins.cmd` → 悬停 `cv_compute` → 文档显示，悬停 `vecmin` → 公式函数文档显示
4. 在任意 Inspect 文件中触发补全 → Inspect 命令出现在列表中且有 documentation

- [ ] **Step 4: 打包验证**

```bash
npx vsce ls --tree | grep inspect_command_docs
```

预期输出包含：
```
syntaxes/inspect_command_docs.json
syntaxes/inspect_command_docs.zh-CN.json
```

- [ ] **Step 5: 提交最终验证结果（如有修复）**

如果验证过程中发现问题，修复后提交。如果全部通过，此步跳过。

---

## Self-Review

**Spec 覆盖：**
- ✅ 扁平 JSON 格式 → Task 1 Step 1 定义了格式
- ✅ PhysicalConstants 特殊处理 → Task 5 Step 2 定义了常量格式
- ✅ 代码修改 1 行 → Task 0 Step 1
- ✅ 5 批文档提取 → Task 1-5
- ✅ 最终验证 → Task 6

**Placeholder 扫描：** 无 TBD/TODO。所有步骤包含具体文件路径、命令名、JSON 格式示例。

**类型一致性：** JSON 格式在 Task 1 Step 1 定义，Task 2-5 引用同格式。`section` 值与 spec 中的 section 约定表一致。
