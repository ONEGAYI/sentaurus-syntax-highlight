# svisual 函数文档设计

**日期**：2026-04-14
**状态**：Approved

## 目标

为 Sentaurus Visual (svisual) 创建英文函数文档 JSON，覆盖 KEYWORD1（138 个顶层命令）和 KEYWORD4（119 个命名空间函数），共计 257 条。后续按需创建中文翻译版。

## 信息来源

- **手册**：`references/svisual_ug_T-2022.03.md`（760KB，Sentaurus Visual User Guide T-2022.03）
- **附录 A**（line 4530+）：138 个 KEYWORD1 命令，每个含 Syntax / Arguments / Returns / Example
- **附录 F**（line ~9200+）：`ext::*` 数据提取函数（31 个）
- **附录 G**（line ~9800+）：`ifm::*` IFM 库函数（15 个）
- **附录 H**（line ~10000+）：`rfx::*` RF 提取函数（42 个）
- **附录 I**（line 13845+）：`const::*` 物理常数（22 个，表格格式）
- **`emw::fit::*`（8 个）**：未在此手册中，需 AI 基于命名语义推断
- **`lib::SetInfoDef`（1 个）**：附录 G

## 输出文件

- `syntaxes/svisual_command_docs.json`（英文，主文件）
- `syntaxes/svisual_command_docs.zh-CN.json`（中文翻译，后续创建）

## 文档格式

### KEYWORD1 命令（138 条）— Tcl 方言模板

参照 `sdevice_command_docs.json` 格式：

```jsonc
{
  "<CommandName>": {
    "section": "<SectionName>",
    "signature": "<CommandName> [-arg1 <type>] [-arg2 <type>]",
    "description": "One or two sentences.",
    "parameters": [
      {
        "name": "<argName>",
        "type": "<type>",
        "desc": "Description with behavior explanation. Possible values: \"val1\" (meaning1), \"val2\" (meaning2)."
      }
    ],
    "example": "<CommandName> -dataset \"mydata\" -name \"plot1\"",
    "keywords": ["<related_keyword2>", "<related_keyword3>"]
  }
}
```

**Key 命名**：PascalCase，与 `all_keywords.json` 一致。
**`section` 值**：使用功能分类名（见下表）。

### KEYWORD4 命名空间函数（119 条）— 函数式模板

参照 `scheme_function_docs.json` 格式（无 `section`，无 `keywords`）：

```jsonc
{
  "<namespace>::<function>": {
    "signature": "<namespace>::<function> <arg1> <arg2>",
    "description": "One or two sentences.",
    "parameters": [
      {
        "name": "<arg>",
        "type": "<type>",
        "desc": "Description."
      }
    ],
    "example": "set result [<namespace>::<function> $dataset $variable]"
  }
}
```

**`const::*` 特殊处理**：`signature` 为变量引用形式，`description` 包含数值和单位，`parameters` 为空数组：

```jsonc
{
  "const::BoltzmannConstant": {
    "signature": "const::BoltzmannConstant",
    "description": "Boltzmann constant. Value: 1.38065812e-23, Unit: J/K.",
    "parameters": [],
    "example": "puts $const::BoltzmannConstant"
  }
}
```

## section 分类映射

| section 值 | 包含的命令 |
|-----------|-----------|
| `File` | load_file, unload_file, reload_files, reload_datasets, list_files, list_datasets, remove_datasets, load_file_datasets, load_script_file, load_library, get_input_data, list_tdr_states |
| `Settings` | import_settings, export_settings, reset_settings, set_best_look, render_mode, set_window_size, set_window_full, windows_style, set_transformation, set_deformation |
| `Utility` | version, help, echo, show_msg, exit, undo |
| `Plot` | create_plot, list_plots, select_plots, remove_plots, move_plot, zoom_plot, rotate_plot, link_plots, diff_plots, overlay_plots, save_plot_to_script, set_plot_prop, get_plot_prop |
| `Curve` | create_curve, list_curves, remove_curves, set_curve_prop, get_curve_prop, probe_curve, get_curve_data, export_curves |
| `Drawing` | draw_line, draw_rectangle, draw_ellipse, draw_textbox, list/remove_* 对应对象, set/get_*_prop 对应对象 |
| `Cut` | create_cutplane, create_cutline, create_cutpolyline, create_cut_boundary, create_projection, list/remove_cut* |
| `Field` | create_field, create_surface, create_iso, list_fields, list_regions, list_materials, set/get_field_prop, set/get_region_prop, set/get_material_prop, probe_field, integrate_field, set_value_blanking |
| `Property` | set/get_axis_prop, set/get_grid_prop, set/get_legend_prop, set/get_camera_prop, set/get_ruler_prop, set_band_diagram |
| `Streamline` | create_streamline, extract_streamlines, list/remove_streamlines, set/get_streamline_prop, set/get_vector_prop |
| `Calculation` | calculate, calculate_scalar, calculate_field_value, find_values, get_variable_data, list_variables, create_variable, export_variables, extract_path |
| `Movie` | start_movie, stop_movie, list_movie_frames, add_frame, export_movie, export_view |
| `UI` | add_custom_button, list_custom_buttons, remove_custom_buttons, set/get_vertical_lines_prop, list_vertical_lines, set_tag_prop |

## 批次划分（8 批次，子代理并发）

| 批次 | 名称 | 条目 | 数量 | 手册来源 |
|------|------|------|------|---------|
| B1 | File/Data/Utility + Movie/UI | KEYWORD1 | 34 | 附录 A |
| B2 | Plot Management | KEYWORD1 | 18 | 附录 A |
| B3 | Curves + Drawing | KEYWORD1 | 28 | 附录 A |
| B4 | Cutting + Fields/Regions | KEYWORD1 | 28 | 附录 A |
| B5 | Properties + Streamlines + Calc | KEYWORD1 | 30 | 附录 A |
| B6 | ext:: namespace | KEYWORD4 | 31 | 附录 F |
| B7 | ifm:: + const:: + lib:: | KEYWORD4 | 38 | 附录 G + I |
| B8 | rfx:: + emw::fit:: | KEYWORD4 | 50 | 附录 H + AI |

### B1 详细命令列表

File: load_file, unload_file, reload_files, reload_datasets, list_files, list_datasets, remove_datasets, load_file_datasets, load_script_file, load_library, get_input_data, list_tdr_states
Settings: import_settings, export_settings, reset_settings, set_best_look, render_mode, set_window_size, set_window_full, windows_style, set_transformation, set_deformation
Utility: version, help, echo, show_msg, exit, undo
Movie: start_movie, stop_movie, list_movie_frames, add_frame, export_movie, export_view
UI: add_custom_button, list_custom_buttons, remove_custom_buttons, set_vertical_lines_prop, get_vertical_lines_prop, list_vertical_lines, set_tag_prop

### B2 详细命令列表

create_plot, list_plots, select_plots, remove_plots, move_plot, zoom_plot, rotate_plot, link_plots, diff_plots, overlay_plots, save_plot_to_script, set_plot_prop, get_plot_prop

### B3 详细命令列表

Curve: create_curve, list_curves, remove_curves, set_curve_prop, get_curve_prop, probe_curve, get_curve_data, export_curves
Drawing: draw_line, draw_rectangle, draw_ellipse, draw_textbox, list_lines, list_rectangles, list_ellipses, list_textboxes, set_line_prop, get_line_prop, set_rectangle_prop, get_rectangle_prop, set_ellipse_prop, get_ellipse_prop, set_textbox_prop, get_textbox_prop, remove_lines, remove_rectangles, remove_ellipses, remove_textboxes

### B4 详细命令列表

Cut: create_cutplane, create_cutline, create_cutpolyline, create_cut_boundary, create_projection, list_cutplanes, list_cutlines, remove_cutplanes, remove_cutlines, set_cutplane_prop, get_cutplane_prop, set_cutline_prop, get_cutline_prop
Field: create_field, create_surface, create_iso, list_fields, list_regions, list_materials, set_field_prop, get_field_prop, set_region_prop, get_region_prop, set_material_prop, get_material_prop, probe_field, integrate_field, set_value_blanking

### B5 详细命令列表

Property: set_axis_prop, get_axis_prop, set_grid_prop, get_grid_prop, set_legend_prop, get_legend_prop, set_camera_prop, get_camera_prop, set_ruler_prop, get_ruler_prop, set_band_diagram
Streamline: create_streamline, extract_streamlines, list_streamlines, remove_streamlines, set_streamline_prop, get_streamline_prop, set_vector_prop, get_vector_prop
Calculation: calculate, calculate_scalar, calculate_field_value, find_values, get_variable_data, list_variables, create_variable, export_variables, extract_path

### B6-B8

KEYWORD4 命令按命名空间划分，详见 `all_keywords.json` 中的 `svisual.KEYWORD4` 数组。

## 质量要求

1. **参数选项必须解释行为**：不能只枚举可选值，必须说明每个选项的实际效果。信息来源优先级：命令附录 → 正文相关章节 → AI 推断
2. **描述风格参照 SDE**：首句说明功能，补充重要约束或行为说明
3. **JSON 合法性**：无尾逗号、无注释、UTF-8 编码
4. **Key 一致性**：与 `all_keywords.json` 完全匹配

## 集成步骤

文档完成后，需在 `src/extension.js` 的 `funcDocs` 加载逻辑中添加：

```javascript
const svisualDocs = require('../syntaxes/svisual_command_docs.json');
Object.assign(funcDocs, svisualDocs);
```

## 不在范围内

- 中文翻译（后续独立任务）
- `emw::fit::*` 的详细参数文档（缺乏手册来源，仅提供基本描述）
- LITERAL3 枚举值的文档化（97 个字面量不需要函数级文档）
