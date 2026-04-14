# svisual LSP/AST 接入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 svisual 语言接入现有 Tcl AST 框架，获得代码折叠、面包屑导航、括号诊断等全部 AST 功能。

**Architecture:** 现有 Tcl AST 框架采用"共享框架 + 配置驱动"模式，所有 Provider 通过 `TCL_LANGS` 集合注册。只需将 svisual 加入该集合并配置其 section 关键词，即可零代码改造复用全部功能。

**Tech Stack:** Node.js (CommonJS), web-tree-sitter (WASM), VSCode Extension API

---

### Task 1: 编写 section 关键词提取脚本

**Files:**
- Create: `scripts/extract_svisual_sections.js`

- [ ] **Step 1: 创建提取脚本**

```javascript
// scripts/extract_svisual_sections.js
'use strict';

/**
 * 从 svisual_command_docs.json 自动提取 section 关键词，
 * 输出可直接粘贴到 tcl-symbol-configs.js 的 new Set([...]) 代码。
 */
const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, '..', 'syntaxes', 'svisual_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf-8'));

// 命名空间前缀 — 这些函数没有 section，不参与提取
const NS_PREFIXES = ['ext::', 'rfx::', 'const::', 'ifm::', 'emw::fit::', 'lib::'];

const sections = {};
for (const [cmd, info] of Object.entries(docs)) {
    if (!info.section) continue;
    if (NS_PREFIXES.some(p => cmd.startsWith(p))) continue;
    const sec = info.section;
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(cmd);
}

// 按 section 名排序，内部命令也排序
const sorted = Object.entries(sections).sort((a, b) => a[0].localeCompare(b[0]));

let lines = ["    svisual: new Set(["];
let total = 0;
for (const [sec, cmds] of sorted) {
    cmds.sort();
    total += cmds.length;
    lines.push(`        // ${sec} (${cmds.length})`);
    for (let i = 0; i < cmds.length; i += 4) {
        const chunk = cmds.slice(i, i + 4);
        const isLast = (sec === sorted[sorted.length - 1][0] && i + 4 >= cmds.length);
        lines.push('        ' + chunk.map(c => `'${c}'`).join(', ') + ',');
    }
}
lines.push('    ]),');

console.log(lines.join('\n'));
console.error(`\n// Total: ${total} section keywords`);
```

- [ ] **Step 2: 运行脚本验证输出**

Run: `node scripts/extract_svisual_sections.js`
Expected: 输出 `new Set([...])` 格式的代码片段，末尾显示 `// Total: 138 section keywords`

- [ ] **Step 3: 提交**

```bash
git add scripts/extract_svisual_sections.js
git commit -m "feat: 添加 svisual section 关键词提取脚本"
```

---

### Task 2: 将 svisual 添加到 TCL_LANGS

**Files:**
- Modify: `src/lsp/tcl-ast-utils.js:8`

- [ ] **Step 1: 修改 TCL_LANGS 定义**

将 `src/lsp/tcl-ast-utils.js` 第 8 行：

```javascript
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);
```

改为：

```javascript
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect', 'svisual']);
```

- [ ] **Step 2: 验证现有测试不受影响**

Run: `node tests/test-tcl-ast-utils.js`
Expected: 所有 14 个测试通过

- [ ] **Step 3: 提交**

```bash
git add src/lsp/tcl-ast-utils.js
git commit -m "feat: 将 svisual 添加到 TCL_LANGS 集合"
```

---

### Task 3: 添加 svisual section 关键词配置

**Files:**
- Modify: `src/lsp/tcl-symbol-configs.js:12-44`

- [ ] **Step 1: 运行提取脚本获取代码片段**

Run: `node scripts/extract_svisual_sections.js > /tmp/svisual_sections.txt`

- [ ] **Step 2: 将输出添加到 SECTION_KEYWORDS**

在 `src/lsp/tcl-symbol-configs.js` 的 `SECTION_KEYWORDS` 对象中，在 `inspect` 条目之后、闭合 `};` 之前，添加 `svisual` 条目：

```javascript
    inspect: new Set([
        'cv_nextColor', 'cv_createDS', 'cv_getData', 'cv_getDatasets',
        'gr_create', 'cv_getXaxis', 'cv_getYaxis', 'cv_scale',
        'cv_linFit', 'fi_create', 'fi_writeEps',
        'list_datasets', 'select_plots', 'create_projection',
        'calculate', 'set_curve_prop', 'set_streamline_prop',
        'draw_rectangle', 'get_curve_prop', 'get_grid_prop',
        'remove_rectangles', 'set_material_prop',
    ]),
    svisual: new Set([
        // Calculation (9)
        'calculate', 'calculate_field_value', 'calculate_scalar', 'create_variable',
        'export_variables', 'extract_path', 'find_values', 'get_variable_data',
        'list_variables',
        // Curve (8)
        'create_curve', 'export_curves', 'get_curve_data', 'get_curve_prop',
        'list_curves', 'probe_curve', 'remove_curves', 'set_curve_prop',
        // Cut (13)
        'create_cut_boundary', 'create_cutline', 'create_cutplane', 'create_cutpolyline',
        'create_projection', 'get_cutline_prop', 'get_cutplane_prop', 'list_cutlines',
        'list_cutplanes', 'remove_cutlines', 'remove_cutplanes', 'set_cutline_prop',
        'set_cutplane_prop',
        // Drawing (20)
        'draw_ellipse', 'draw_line', 'draw_rectangle', 'draw_textbox',
        'get_ellipse_prop', 'get_line_prop', 'get_rectangle_prop', 'get_textbox_prop',
        'list_ellipses', 'list_lines', 'list_rectangles', 'list_textboxes',
        'remove_ellipses', 'remove_lines', 'remove_rectangles', 'remove_textboxes',
        'set_ellipse_prop', 'set_line_prop', 'set_rectangle_prop', 'set_textbox_prop',
        // Field (15)
        'create_field', 'create_iso', 'create_surface', 'get_field_prop',
        'get_material_prop', 'get_region_prop', 'integrate_field', 'list_fields',
        'list_materials', 'list_regions', 'probe_field', 'set_field_prop',
        'set_material_prop', 'set_region_prop', 'set_value_blanking',
        // File (12)
        'get_input_data', 'list_datasets', 'list_files', 'list_tdr_states',
        'load_file', 'load_file_datasets', 'load_library', 'load_script_file',
        'reload_datasets', 'reload_files', 'remove_datasets', 'unload_file',
        // Movie (6)
        'add_frame', 'export_movie', 'export_view', 'list_movie_frames',
        'start_movie', 'stop_movie',
        // Plot (13)
        'create_plot', 'diff_plots', 'get_plot_prop', 'link_plots',
        'list_plots', 'move_plot', 'overlay_plots', 'remove_plots',
        'rotate_plot', 'save_plot_to_script', 'select_plots', 'set_plot_prop',
        'zoom_plot',
        // Property (11)
        'get_axis_prop', 'get_camera_prop', 'get_grid_prop', 'get_legend_prop',
        'get_ruler_prop', 'set_axis_prop', 'set_band_diagram', 'set_camera_prop',
        'set_grid_prop', 'set_legend_prop', 'set_ruler_prop',
        // Settings (10)
        'export_settings', 'import_settings', 'render_mode', 'reset_settings',
        'set_best_look', 'set_deformation', 'set_transformation', 'set_window_full',
        'set_window_size', 'windows_style',
        // Streamline (8)
        'create_streamline', 'extract_streamlines', 'get_streamline_prop', 'get_vector_prop',
        'list_streamlines', 'remove_streamlines', 'set_streamline_prop', 'set_vector_prop',
        // UI (7)
        'add_custom_button', 'get_vertical_lines_prop', 'list_custom_buttons', 'list_vertical_lines',
        'remove_custom_buttons', 'set_tag_prop', 'set_vertical_lines_prop',
        // Utility (6)
        'echo', 'exit', 'help', 'show_msg',
        'undo', 'version',
    ]),
```

- [ ] **Step 3: 验证语法正确**

Run: `node -e "const c = require('./src/lsp/tcl-symbol-configs'); console.log('svisual keywords:', c.getSectionKeywords('svisual').size);"`
Expected: `svisual keywords: 138`

- [ ] **Step 4: 验证现有测试不受影响**

Run: `node tests/test-tcl-ast-utils.js`
Expected: 所有 14 个测试通过

- [ ] **Step 5: 提交**

```bash
git add src/lsp/tcl-symbol-configs.js
git commit -m "feat: 添加 svisual section 关键词配置（138 个命令）"
```

---

### Task 4: 回归验证与功能测试

**Files:**
- 无文件变更，仅测试验证

- [ ] **Step 1: 运行全部现有测试**

Run: `node tests/test-tcl-ast-utils.js && node tests/test-definitions.js && node tests/test-tcl-document-symbol.js && node tests/test-tcl-ast-variables.js`
Expected: 所有测试通过

- [ ] **Step 2: 在 VSCode Extension Development Host 中手动验证**

1. 按 F5 启动 Extension Development Host
2. 打开一个 `*_vis.cmd` 文件
3. 验证面包屑导航显示 section 节点（如 `create_plot`、`load_file` 等）
4. 验证代码折叠功能（点击 `{}` 块左侧的折叠箭头）
5. 验证括号诊断（故意输入不配对的 `{}`，确认出现红色波浪线）
6. 验证 `set` 变量出现在面包屑中

- [ ] **Step 3: 最终提交（如有遗留修改）**

如果没有遗留修改，此步骤跳过。
