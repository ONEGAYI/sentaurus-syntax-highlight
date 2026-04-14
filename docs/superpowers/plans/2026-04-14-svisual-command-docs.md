# svisual 函数文档实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 svisual 创建 257 条函数文档（138 KEYWORD1 + 119 KEYWORD4），写入 `syntaxes/svisual_command_docs.json`，并集成到扩展。

**Architecture:** 8 个子代理并行从手册提取文档信息，各自产出 JSON 片段，最后合并为单一文件。KEYWORD1 使用 Tcl 方言模板（含 section/keywords），KEYWORD4 使用函数式模板。const:: 使用简化常量模板。

**Tech Stack:** JSON、Node.js（验证脚本）、VSCode 扩展集成

**Spec:** `docs/superpowers/specs/2026-04-14-svisual-command-docs-design.md`
**编写规范:** `docs/函数文档提取与编写规范.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `syntaxes/svisual_command_docs.json` | 创建 | 最终产物，257 条英文文档 |
| `src/extension.js:318-322` | 修改 | 加载 svisual 文档并合并到 funcDocs |
| `syntaxes/svisual_command_docs_b1.json` ~ `_b8.json` | 临时创建 | 各批次子代理的中间产出，合并后删除 |

---

## Task 1: 准备批次命令列表

**Files:**
- Read: `syntaxes/all_keywords.json`
- Read: `docs/superpowers/specs/2026-04-14-svisual-command-docs-design.md`

- [ ] **Step 1: 确认 8 个批次的精确命令列表**

运行以下 Node.js 脚本，验证每个批次的命令列表与 `all_keywords.json` 一致，输出每个批次的命令数组：

```bash
node -e "
const kw = require('./syntaxes/all_keywords.json');
const k1 = kw.svisual.KEYWORD1;
const k4 = kw.svisual.KEYWORD4;

const batches = {
  B1: ['load_file','unload_file','reload_files','reload_datasets','list_files','list_datasets','remove_datasets','load_file_datasets','load_script_file','load_library','import_settings','export_settings','reset_settings','version','help','echo','show_msg','exit','undo','get_input_data','list_tdr_states','start_movie','stop_movie','list_movie_frames','add_frame','export_movie','export_view','add_custom_button','list_custom_buttons','remove_custom_buttons','set_vertical_lines_prop','get_vertical_lines_prop','list_vertical_lines','set_tag_prop','set_best_look','render_mode','set_window_size','set_window_full','windows_style','set_transformation','set_deformation'],
  B2: ['create_plot','list_plots','select_plots','remove_plots','move_plot','zoom_plot','rotate_plot','link_plots','diff_plots','overlay_plots','save_plot_to_script','set_plot_prop','get_plot_prop'],
  B3: ['create_curve','list_curves','remove_curves','set_curve_prop','get_curve_prop','probe_curve','get_curve_data','export_curves','draw_line','draw_rectangle','draw_ellipse','draw_textbox','list_lines','list_rectangles','list_ellipses','list_textboxes','set_line_prop','get_line_prop','set_rectangle_prop','get_rectangle_prop','set_ellipse_prop','get_ellipse_prop','set_textbox_prop','get_textbox_prop','remove_lines','remove_rectangles','remove_ellipses','remove_textboxes'],
  B4: ['create_cutplane','create_cutline','create_cutpolyline','create_cut_boundary','create_projection','list_cutplanes','list_cutlines','remove_cutplanes','remove_cutlines','set_cutplane_prop','get_cutplane_prop','set_cutline_prop','get_cutline_prop','create_field','create_surface','create_iso','list_fields','list_regions','list_materials','set_field_prop','get_field_prop','set_region_prop','get_region_prop','set_material_prop','get_material_prop','probe_field','integrate_field','set_value_blanking'],
  B5: ['set_axis_prop','get_axis_prop','set_grid_prop','get_grid_prop','set_legend_prop','get_legend_prop','set_camera_prop','get_camera_prop','set_ruler_prop','get_ruler_prop','set_band_diagram','create_streamline','extract_streamlines','list_streamlines','remove_streamlines','set_streamline_prop','get_streamline_prop','set_vector_prop','get_vector_prop','calculate','calculate_scalar','calculate_field_value','find_values','get_variable_data','list_variables','create_variable','export_variables','extract_path'],
};

// Verify B1-B5 cover all KEYWORD1
const allB1to5 = Object.values(batches).flat();
const missing = k1.filter(k => !allB1to5.includes(k));
const extra = allB1to5.filter(k => !k1.includes(k));
console.log('B1-B5 total:', allB1to5.length, '/ KEYWORD1:', k1.length);
if (missing.length) console.log('MISSING:', missing);
if (extra.length) console.log('EXTRA:', extra);
if (!missing.length && !extra.length) console.log('KEYWORD1 coverage: PERFECT');

// B6-B8 by namespace
const b6 = k4.filter(k => k.startsWith('ext::'));
const b7ifm = k4.filter(k => k.startsWith('ifm::'));
const b7const = k4.filter(k => k.startsWith('const::'));
const b7lib = k4.filter(k => k.startsWith('lib::'));
const b8rfx = k4.filter(k => k.startsWith('rfx::'));
const b8emw = k4.filter(k => k.startsWith('emw::'));
console.log('B6 ext::', b6.length, '| B7 ifm::', b7ifm.length, 'const::', b7const.length, 'lib::', b7lib.length, '| B8 rfx::', b8rfx.length, 'emw::', b8emw.length);
console.log('KEYWORD4 total:', b6.length + b7ifm.length + b7const.length + b7lib.length + b8rfx.length + b8emw.length, '/ expected:', k4.length);
"
```

Expected: `KEYWORD1 coverage: PERFECT` 和 `KEYWORD4 total: 119 / expected: 119`

- [ ] **Step 2: 确认手册行号范围**

以下为各附录在 `references/svisual_ug_T-2022.03.md` 中的行号范围：

| 附录 | 行号范围 | 批次 |
|------|---------|------|
| A. Tcl Commands（KEYWORD1） | 4530–9100 | B1–B5 |
| F. Extraction Library（ext::） | 9170–10500 | B6 |
| G. IFM Library（ifm:: + lib::） | 10536–11400 | B7 |
| H. RF Library（rfx::） | 11415–13780 | B8 |
| I. PhysicalConstants（const::） | 13845–13878 | B7 |

---

## Task 2–9: 并发执行 B1–B8（子代理批次）

> **执行模式**：这 8 个任务应使用 `Agent` 工具并发派发（单条消息 8 个 Agent 调用），每个子代理独立执行，互不依赖。
>
> 每个子代理产出一个 JSON 片段文件，写入 `syntaxes/svisual_command_docs_b<N>.json`。

### 通用子代理指令模板

每个子代理 prompt 需包含以下上下文：

```
你是 svisual 函数文档编写者。请从手册中提取信息，为本批次的命令编写 JSON 函数文档。

## 输入
- 手册文件：references/svisual_ug_T-2022.03.md（读取对应行号范围）
- 命令列表：<本批次命令>
- 编写规范：docs/函数文档提取与编写规范.md（必读）

## 模板
KEYWORD1 使用 Tcl 方言模板（含 section 和 keywords 字段）：
{
  "<CommandName>": {
    "section": "<SectionName>",
    "signature": "<CommandName> [-arg1 <type>] ...",
    "description": "功能描述（1-2句）",
    "parameters": [{ "name": "<arg>", "type": "<type>", "desc": "含行为解释的说明" }],
    "example": "示例代码",
    "keywords": ["相关KEYWORD2/KEYWORD3"]
  }
}

## 关键规则
1. 参数选项必须解释实际行为，不能只枚举值。信息来源：命令附录 → 正文 → AI推断
2. signature 使用 Tcl -arg 风格（非花括号）
3. example 必须是手册中的真实示例或合理的最小示例
4. keywords 列出该命令直接关联的 KEYWORD2/KEYWORD3（从 all_keywords.json 的 svisual 部分获取）
5. 产出必须是合法 JSON

## 输出
将结果写入 syntaxes/svisual_command_docs_b<N>.json
```

### Task 2: B1 — File/Data/Utility + Movie/UI（34 条 KEYWORD1）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:4530-9100`（附录 A）
- Read: `docs/函数文档提取与编写规范.md`
- Read: `syntaxes/all_keywords.json`（获取 svisual.KEYWORD2/KEYWORD3 用于 keywords 字段）
- Create: `syntaxes/svisual_command_docs_b1.json`

**命令列表（34 条）：**

File: `load_file`, `unload_file`, `reload_files`, `reload_datasets`, `list_files`, `list_datasets`, `remove_datasets`, `load_file_datasets`, `load_script_file`, `load_library`, `get_input_data`, `list_tdr_states`

Settings: `import_settings`, `export_settings`, `reset_settings`, `set_best_look`, `render_mode`, `set_window_size`, `set_window_full`, `windows_style`, `set_transformation`, `set_deformation`

Utility: `version`, `help`, `echo`, `show_msg`, `exit`, `undo`

Movie: `start_movie`, `stop_movie`, `list_movie_frames`, `add_frame`, `export_movie`, `export_view`

UI: `add_custom_button`, `list_custom_buttons`, `remove_custom_buttons`, `set_vertical_lines_prop`, `get_vertical_lines_prop`, `list_vertical_lines`, `set_tag_prop`

**section 映射：** File → `"File"`, Settings → `"Settings"`, Utility → `"Utility"`, Movie → `"Movie"`, UI → `"UI"`

### Task 3: B2 — Plot Management（18 条 KEYWORD1）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:4530-9100`
- Read: `docs/函数文档提取与编写规范.md`
- Read: `syntaxes/all_keywords.json`
- Create: `syntaxes/svisual_command_docs_b2.json`

**命令列表（18 条）：**
`create_plot`, `list_plots`, `select_plots`, `remove_plots`, `move_plot`, `zoom_plot`, `rotate_plot`, `link_plots`, `diff_plots`, `overlay_plots`, `save_plot_to_script`, `set_plot_prop`, `get_plot_prop`

**section:** `"Plot"`

### Task 4: B3 — Curves + Drawing（28 条 KEYWORD1）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:4530-9100`
- Read: `docs/函数文档提取与编写规范.md`
- Read: `syntaxes/all_keywords.json`
- Create: `syntaxes/svisual_command_docs_b3.json`

**命令列表（28 条）：**

Curve: `create_curve`, `list_curves`, `remove_curves`, `set_curve_prop`, `get_curve_prop`, `probe_curve`, `get_curve_data`, `export_curves`

Drawing: `draw_line`, `draw_rectangle`, `draw_ellipse`, `draw_textbox`, `list_lines`, `list_rectangles`, `list_ellipses`, `list_textboxes`, `set_line_prop`, `get_line_prop`, `set_rectangle_prop`, `get_rectangle_prop`, `set_ellipse_prop`, `get_ellipse_prop`, `set_textbox_prop`, `get_textbox_prop`, `remove_lines`, `remove_rectangles`, `remove_ellipses`, `remove_textboxes`

**section 映射：** Curve 命令 → `"Curve"`, Drawing 命令 → `"Drawing"`

### Task 5: B4 — Cutting + Fields/Regions（28 条 KEYWORD1）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:4530-9100`
- Read: `docs/函数文档提取与编写规范.md`
- Read: `syntaxes/all_keywords.json`
- Create: `syntaxes/svisual_command_docs_b4.json`

**命令列表（28 条）：**

Cut: `create_cutplane`, `create_cutline`, `create_cutpolyline`, `create_cut_boundary`, `create_projection`, `list_cutplanes`, `list_cutlines`, `remove_cutplanes`, `remove_cutlines`, `set_cutplane_prop`, `get_cutplane_prop`, `set_cutline_prop`, `get_cutline_prop`

Field: `create_field`, `create_surface`, `create_iso`, `list_fields`, `list_regions`, `list_materials`, `set_field_prop`, `get_field_prop`, `set_region_prop`, `get_region_prop`, `set_material_prop`, `get_material_prop`, `probe_field`, `integrate_field`, `set_value_blanking`

**section 映射：** Cut 命令 → `"Cut"`, Field 命令 → `"Field"`

### Task 6: B5 — Properties + Streamlines + Calc（30 条 KEYWORD1）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:4530-9100`
- Read: `docs/函数文档提取与编写规范.md`
- Read: `syntaxes/all_keywords.json`
- Create: `syntaxes/svisual_command_docs_b5.json`

**命令列表（30 条）：**

Property: `set_axis_prop`, `get_axis_prop`, `set_grid_prop`, `get_grid_prop`, `set_legend_prop`, `get_legend_prop`, `set_camera_prop`, `get_camera_prop`, `set_ruler_prop`, `get_ruler_prop`, `set_band_diagram`

Streamline: `create_streamline`, `extract_streamlines`, `list_streamlines`, `remove_streamlines`, `set_streamline_prop`, `get_streamline_prop`, `set_vector_prop`, `get_vector_prop`

Calculation: `calculate`, `calculate_scalar`, `calculate_field_value`, `find_values`, `get_variable_data`, `list_variables`, `create_variable`, `export_variables`, `extract_path`

**section 映射：** Property → `"Property"`, Streamline → `"Streamline"`, Calculation → `"Calculation"`

### Task 7: B6 — ext:: namespace（31 条 KEYWORD4）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:9170-10500`（附录 F）
- Read: `docs/函数文档提取与编写规范.md`
- Create: `syntaxes/svisual_command_docs_b6.json`

**模板（函数式，无 section/keywords）：**

```jsonc
{
  "ext::<Function>": {
    "signature": "ext::<Function> <arg1> <arg2>",
    "description": "功能描述",
    "parameters": [{ "name": "<arg>", "type": "<type>", "desc": "说明" }],
    "example": "示例"
  }
}
```

**命令列表（31 条）：** 所有 `all_keywords.json` 中 `svisual.KEYWORD4` 以 `ext::` 开头的条目。

### Task 8: B7 — ifm:: + const:: + lib::（38 条 KEYWORD4）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:10536-11400`（附录 G）
- Read: `references/svisual_ug_T-2022.03.md:13845-13878`（附录 I，const:: 表格）
- Read: `docs/函数文档提取与编写规范.md`
- Create: `syntaxes/svisual_command_docs_b7.json`

**ifm:: + lib:: 使用函数式模板（同 B6）。**

**const:: 使用简化常量模板：**

```jsonc
{
  "const::<Name>": {
    "signature": "const::<Name>",
    "description": "<Full name>. Value: <value>, Unit: <unit>.",
    "parameters": [],
    "example": "puts $const::<Name>"
  }
}
```

**命令列表：** 所有 `ifm::`（15）、`const::`（22）、`lib::`（1）开头的 KEYWORD4 条目。

**const:: 值参考**（来自附录 I 表格）：

| 名称 | 值 | 单位 |
|------|-----|------|
| AtomicMassConstant | 1.660540210e-27 | kg |
| AvogadroConstant | 6.022136736e23 | mol-1 |
| BohrMagneton | 9.274015431e-24 | J/T |
| BoltzmannConstant | 1.38065812e-23 | J/K |
| ElectronMass | 9.109389754e-31 | kg |
| ElectronVolt | 1.6021773349e-19 | J |
| ElementaryCharge | 1.6021773349e-19 | C |
| FaradayConstant | 9.648530929e4 | C/mol |
| FineStructureConstant | 7.2973530833e-3 | 1 |
| FreeSpaceImpedance | 376.730313462 | Ω |
| GravitationConstant | 6.6725985e-11 | m3/kg/s2 |
| MagneticFluxQuantum | 2.0678346161e-15 | Wb |
| MolarVolume | 22.4141019e-3 | m3/mol |
| Permeability | 12.566370614e-7 | H/m |
| Permittivity | 8.854187817e-12 | F/m |
| Pi | 3.141592653589793 | 1 |
| PlanckConstant | 6.626075540e-34 | Js |
| ProtonMass | 1.672623110e-27 | kg |
| RydbergConstant | 1.097373153413e7 | m-1 |
| SpeedOfLight | 299792458 | m/s |
| StefanBoltzmannConstant | 5.6705119e-8 | W/m2/K4 |
| kT300 | 0.0258521592446 | V |

### Task 9: B8 — rfx:: + emw::fit::（50 条 KEYWORD4）

**Files:**
- Read: `references/svisual_ug_T-2022.03.md:11415-13780`（附录 H）
- Read: `docs/函数文档提取与编写规范.md`
- Create: `syntaxes/svisual_command_docs_b8.json`

**rfx:: 使用函数式模板（同 B6）。**

**emw::fit::（8 条）无手册来源，需 AI 推断基本描述。** 基于命名语义提供简短 description，parameters 可简化为通用形式。

**命令列表：** 所有 `rfx::`（42）和 `emw::fit::`（8）开头的 KEYWORD4 条目。

---

## Task 10: 合并所有批次为最终文件

**Files:**
- Read: `syntaxes/svisual_command_docs_b1.json` ~ `b8.json`
- Create: `syntaxes/svisual_command_docs.json`
- Delete: `syntaxes/svisual_command_docs_b1.json` ~ `b8.json`

- [ ] **Step 1: 合并 JSON 片段**

```bash
node -e "
const fs = require('fs');
const merged = {};
for (let i = 1; i <= 8; i++) {
  const batch = JSON.parse(fs.readFileSync('syntaxes/svisual_command_docs_b' + i + '.json', 'utf8'));
  const count = Object.keys(batch).length;
  Object.assign(merged, batch);
  console.log('B' + i + ': ' + count + ' entries');
}
fs.writeFileSync('syntaxes/svisual_command_docs.json', JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('Total: ' + Object.keys(merged).length + ' entries');
"
```

Expected: `Total: 257 entries`

- [ ] **Step 2: 验证 JSON 合法性**

```bash
node -e "JSON.parse(require('fs').readFileSync('syntaxes/svisual_command_docs.json', 'utf8')); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 3: 验证 Key 覆盖率**

```bash
node -e "
const kw = require('./syntaxes/all_keywords.json');
const docs = require('./syntaxes/svisual_command_docs.json');
const k1 = new Set(kw.svisual.KEYWORD1);
const k4 = new Set(kw.svisual.KEYWORD4);
const docKeys = new Set(Object.keys(docs));
const missing = [...k1, ...k4].filter(k => !docKeys.has(k));
console.log('Doc entries:', docKeys.size, '| Expected:', k1.size + k4.size);
if (missing.length) console.log('MISSING:', missing);
else console.log('Coverage: COMPLETE');
"
```

Expected: `Coverage: COMPLETE`

- [ ] **Step 4: 验证字段完整性**

```bash
node -e "
const docs = require('./syntaxes/svisual_command_docs.json');
const kw = require('./syntaxes/all_keywords.json');
const k4set = new Set(kw.svisual.KEYWORD4);
let issues = 0;
for (const [key, doc] of Object.entries(docs)) {
  if (!doc.signature || !doc.description || !doc.parameters || !doc.example) {
    console.log('MISSING FIELD:', key);
    issues++;
  }
  // KEYWORD1 必须有 section 和 keywords
  if (!k4set.has(key) && (!doc.section || !doc.keywords)) {
    console.log('MISSING section/keywords:', key);
    issues++;
  }
}
if (!issues) console.log('All entries have required fields');
else console.log(issues + ' issues found');
"
```

Expected: `All entries have required fields`

- [ ] **Step 5: 删除中间文件**

```bash
rm syntaxes/svisual_command_docs_b{1,2,3,4,5,6,7,8}.json
```

- [ ] **Step 6: Commit 文档**

```bash
git add syntaxes/svisual_command_docs.json
git commit -m "feat: 添加 svisual 函数文档（257 条英文文档）

覆盖 138 个 KEYWORD1 顶层命令和 119 个 KEYWORD4 命名空间函数。
数据来源：Sentaurus Visual User Guide T-2022.03。

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 集成到扩展

**Files:**
- Modify: `src/extension.js:318-322`

- [ ] **Step 1: 添加 svisual 文档加载**

在 `src/extension.js` 的 sdevice 文档加载之后（约 line 322），添加：

```javascript
    // 加载 svisual 命令文档并合并
    const svisualDocs = loadDocsJson('svisual_command_docs.json', useZh);
    if (svisualDocs) {
        Object.assign(funcDocs, svisualDocs);
    }
```

- [ ] **Step 2: 验证扩展可加载**

在 VSCode Extension Development Host 中：
1. 按 F5 启动
2. 打开任意 `.cmd` 文件（svisual 模式下）
3. 输入 `create_plot` 触发补全，悬停查看文档是否显示
4. 输入 `ext::LinFit` 触发补全，查看 KEYWORD4 文档

- [ ] **Step 3: Commit 集成**

```bash
git add src/extension.js
git commit -m "feat: 集成 svisual 函数文档到扩展加载逻辑

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 自审清单

- [x] **Spec 覆盖**：257 条（138 KEYWORD1 + 119 KEYWORD4）→ Task 2-9
- [x] **const:: 特殊模板** → Task 8（Step 中包含完整值表）
- [x] **emw::fit:: AI 推断** → Task 9（标注无手册来源）
- [x] **参数选项行为解释** → 通用子代理指令模板第 1 条规则
- [x] **JSON 合并 + 验证** → Task 10（3 个验证脚本）
- [x] **扩展集成** → Task 11（精确行号 + 代码）
- [x] **无占位符**：所有步骤包含实际命令和代码
