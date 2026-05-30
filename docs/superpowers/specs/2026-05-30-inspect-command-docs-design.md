# Inspect 函数文档编写设计

## Context

项目为 7 种 TCAD 语言提供 Hover + 补全文档，SDE、SDEVICE、Svisual 已有专有文档，SPROCESS、EMW、**Inspect** 三者缺失。Inspect 拥有最多的无文档关键词（201 个专有关键词），使用频率较高，优先级最高。

参考手册：`references/inspect_ug_T-2022.03.md`（141KB，T-2022.03）
官方范本：`display_test/inspect_*.cmd`（4 个，从 VM Applications_Library 和 GettingStarted 下载）

## 文档结构决策

**扁平 JSON 结构**，与 Svisual 文档格式一致。理由：Inspect 所有命令都是平铺的顶层 proc 调用（`cv_create`、`proj_load`），没有对象/命名空间层级，不需要嵌套文档。唯一使用命名空间的 PhysicalConstants（`$const::ElementaryCharge`）作为常量处理，增加 `value` 字段。

## 文档总量

| 来源 | 类别 | 条目数 |
|------|------|--------|
| 第七章 | 核心脚本命令 | ~52 |
| 第七章 | 提取函数（f_ 前缀） | 12 |
| 第八章 | Extraction Library | 16 |
| 第八章 | extend Library | 48 |
| 第六章 | Inspect 特有公式函数（非 Tcl 共享） | 32 |
| 第八章 | PhysicalConstants | 25 常量 + 2 函数 |
| 第八章 | IC-CAP Library | 1 |
| 第八章 | Curve Comparison Library | 2 |
| — | load_library | 1 |
| **总计** | | **~190** |

**不需要编写的**：21 个与 `tcl_expr_mathfunc_docs.json` 重叠的标准数学函数（sin, cos, sqrt, abs 等），已由共享文档覆盖。

## 文档格式

### 标准函数格式

与 `svisual_command_docs.json` 一致：

```json
{
  "cv_create": {
    "section": "Creating Curves",
    "signature": "cv_create <name> <xExpr> <yExpr> ?y2?",
    "description": "Creates a new curve from dataset expressions.",
    "parameters": [
      { "name": "<name>", "type": "string", "desc": "Curve name." },
      { "name": "<xExpr>", "type": "string", "desc": "X-axis data expression: \"dataset quantity location\"." },
      { "name": "<yExpr>", "type": "string", "desc": "Y-axis data expression." },
      { "name": "?y2?", "type": "string", "desc": "Optional. \"y2\" to map to secondary Y axis." }
    ],
    "example": "cv_create j($n) \"$desFile anode OuterVoltage\" \"$desFile cathode TotalCurrent\"",
    "keywords": ["curve", "create"]
  }
}
```

### PhysicalConstants 特殊格式

增加 `value` 字段：

```json
{
  "const::ElementaryCharge": {
    "section": "PhysicalConstants",
    "signature": "$const::ElementaryCharge",
    "description": "Elementary charge constant (1.602×10⁻¹⁹ C).",
    "parameters": [],
    "example": "set q $const::ElementaryCharge",
    "keywords": ["charge", "physical", "constant"],
    "value": "1.6021773349e-19"
  }
}
```

### section 值约定

用于按功能分组，Hover 显示时的辅助信息：

| section 值 | 覆盖范围 |
|------------|---------|
| `"General"` | ft_scalar |
| `"File I/O"` | cv_write, fi_write*, graph_load, graph_write, param_load, param_write, proj_* |
| `"Curves"` | cv_create*, cv_delete, cv_display, cv_logScale, cv_split* |
| `"Attributes"` | cv_lineColor, cv_lineStyle, cv_setCurveAttr, gr_*, gb_* |
| `"Data Access"` | cv_getVals*, cv_getXaxis, cv_getYaxis, cv_printVals |
| `"Transform"` | cv_abs, cv_delPts, cv_inv, cv_reset |
| `"Computing"` | cv_compute, cv_getZero, macro_define |
| `"Extraction"` | f_* 提取函数 |
| `"Extraction Library"` | Extract*, cv_linTransCurve, cv_scaleCurve, FilterTable |
| `"extend Library"` | cv_addCurve, cv_disp, cv_scale, cv_integrate 等 |
| `"Formula"` | vecmax, vecmin, fft*, j0, j1, y0, y1 等 |
| `"PhysicalConstants"` | $const::* |
| `"IC-CAP"` | iccap_Write |
| `"Curve Comparison"` | cvcmp_* |
| `"Script Control"` | script_break, script_exit, script_sleep |

## 代码修改

### 修改文件

**`src/register-completion-providers.js`** 第 122-126 行：

```javascript
// 当前代码
const langSpecificDocs = (() => {
    if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
    if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
    return {};
})();

// 修改为
const langSpecificDocs = (() => {
    if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
    if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
    if (langId === 'inspect') return loadDocsJson('inspect_command_docs.json', useZh) || {};
    return {};
})();
```

仅需修改这 1 个文件、新增 1 行。文档加载、合并、缓存机制由现有的 `getDocs()` + `loadDocsJson()` 自动处理。

### 新增文件

1. `syntaxes/inspect_command_docs.json`（英文）
2. `syntaxes/inspect_command_docs.zh-CN.json`（中文）

## 分批计划

方案 A：按手册章节分 5 批。每批 AI 从手册提取 → 人工审核校验 → 下批。

### Batch 1：核心 I/O + 曲线生命周期（~25 条目）

**来源**：手册第七章前半部分

| 类别 | 命令 |
|------|------|
| 通用 | `ft_scalar` |
| 文件读写 | `cv_write`, `fi_writeBitmap`, `fi_writeEps`, `fi_writePs`, `graph_load`, `graph_write`, `param_load`, `param_write`, `proj_getDataSet`, `proj_getList`, `proj_getNodeList`, `proj_load`, `proj_unload`, `proj_write` |
| 曲线创建/显示 | `cv_create`, `cv_createDS`, `cv_createFromScript`, `cv_createWithFormula`, `cv_delete`, `cv_display`, `cv_logScale`, `cv_log10Scale`, `cv_split`, `cv_split_disc` |

### Batch 2：数据访问 + 属性控制 + 计算/脚本（~30 条目）

**来源**：手册第七章后半部分

| 类别 | 命令 |
|------|------|
| 数据访问 | `cv_getVals`, `cv_getValsX`, `cv_getValsY`, `cv_getXaxis`, `cv_getYaxis`, `cv_printVals` |
| 数据变换 | `cv_abs`, `cv_delPts`, `cv_inv`, `cv_reset` |
| 属性控制 | `cv_lineColor`, `cv_lineStyle`, `cv_renameCurve`, `cv_set_interpol`, `cv_setCurveAttr`, `gb_setpreferences`, `gr_createLabel`, `gr_deleteLabel`, `gr_formatAxis`, `gr_mappedAxis`, `gr_precision`, `gr_setAxisAttr`, `gr_setGeneralAttr`, `gr_setGridAttr`, `gr_setLegendAttr`, `gr_setLegendPos`, `gr_setTitleAttr` |
| 计算 | `cv_compute`, `cv_getZero`, `macro_define` |
| 脚本控制 | `script_break`, `script_exit`, `script_sleep` |

### Batch 3：提取函数 + Extraction Library（~28 条目）

**来源**：手册第七章 "Extracting Parameters" + 第八章 "Extraction Library"

| 类别 | 命令 |
|------|------|
| 提取函数 | `f_Gamma`, `f_gm`, `f_hideInternalCurves`, `f_IDSS`, `f_KP`, `f_Ron`, `f_Rout`, `f_showInternalCurves`, `f_TetaG`, `f_VT`, `f_VT1`, `f_VT2` |
| Extraction Library | `cv_linTransCurve`, `cv_scaleCurve`, `ExtractBVi`, `ExtractBVv`, `ExtractEarlyV`, `ExtractGm`, `ExtractGmb`, `ExtractIoff`, `ExtractMax`, `ExtractRon`, `ExtractSS`, `ExtractValue`, `ExtractVtgm`, `ExtractVtgmb`, `ExtractVti`, `FilterTable` |

### Batch 4：extend Library（~48 条目）

**来源**：手册第八章 "The extend Library"

| 类别 | 命令 |
|------|------|
| 曲线操作 | `cv_addCurve`, `cv_addDataset`, `cv_angularMap`, `cv_linTrans`, `cv_monotonicX`, `cv_scale`, `cv_sort` |
| 样式控制 | `cv_autoIncrStyle`, `cv_disp`, `cv_nextColor`, `cv_nextLine`, `cv_nextSymbol`, `cv_resetColor`, `cv_resetFillColor`, `cv_resetLine`, `cv_resetStyle`, `cv_resetSymbol`, `cv_setFillColor`, `cv_setSymbol` |
| 曲线信息 | `cv_exists`, `cv_getGlobalExtrema`, `cv_getLocalExtrema`, `cv_getNames`, `cv_getRange`, `cv_getXmax`, `cv_getXmin`, `cv_getYmax`, `cv_getYmin`, `cv_isVisible` |
| 计算 | `cv_integrate`, `cv_linFit`, `cv_round` |
| 文件 | `cv_write`（extend 版）, `fi_readTxtFile`, `fi_readTxtFileHeader` |
| 项目管理 | `proj_check`, `proj_datasetExists`, `proj_getGroups`, `proj_groupExists`, `proj_loadPlx` |
| 图形 | `gr_axis`, `gr_resetAxis`, `gr_setStyle` |
| 列表 | `ldiff`, `lintersect`, `ltranspose`, `lunion` |
| 其他 | `dbputs`, `ds_getValue` |

如单次提取过重，可拆为 Part 1（曲线操作+样式+信息，29 条）和 Part 2（计算+文件+项目+列表，19 条）。

### Batch 5：公式函数 + 其他库（~60 条目）

**来源**：手册第六章 + 第八章各库章节

| 类别 | 命令 |
|------|------|
| 向量函数 | `vecmax`, `vecmin`, `vecvalx`, `vecvaly`, `veczero` |
| FFT 函数 | `fftabs`, `fftim`, `fftre`, `ifftim`, `ifftre`, `cfftim`, `cfftre`, `cifftim`, `cifftre` |
| Bessel 函数 | `j0`, `j1`, `y0`, `y1` |
| 特殊数学 | `acosh`, `asinh`, `atanh`, `cbrt`, `diff`, `erf`, `fabs`, `gamma`, `integr`, `intercept`, `lgamma`, `maxslope`, `minslope`, `tangent` |
| PhysicalConstants | 25 个常量 + `const::getVarNames`, `const::printVarNames` |
| IC-CAP | `iccap_Write` |
| Curve Comparison | `cvcmp_CompareTwoCurves`, `cvcmp_DeltaTwoCurves` |
| 库加载 | `load_library` |

## 工作流程

每批执行步骤：
1. AI 从手册章节提取文档 JSON 条目
2. 校验格式（`scripts/docs/validate_i18n.py`）
3. 在 VSCode Extension Development Host 中验证 Hover 和补全
4. 审核通过后提交

## 验证

- 每批完成后：在 Inspect 文件中输入命令名，确认 Hover 显示文档、补全项有 documentation
- 全部完成后：`inspect_command_docs.json` 条目数与计划一致（~190）
- `npx vsce ls --tree` 确认文档文件打包进 VSIX
