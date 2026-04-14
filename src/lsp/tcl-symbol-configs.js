// src/lsp/tcl-symbol-configs.js
'use strict';

/**
 * 各 Tcl 工具的 section 关键词配置。
 * 用于 DocumentSymbolProvider 识别工具特有的顶层块结构
 * （如 sdevice 的 Physics/Math，sprocess 的 deposit/etch 等）。
 *
 * 数据来源：syntaxes/all_keywords.json 中的 KEYWORD1 列表。
 */

const SECTION_KEYWORDS = {
    sdevice: new Set([
        'File', 'Device', 'Electrode', 'Physics', 'Math', 'Plot',
        'Solve', 'System', 'Thermode', 'CurrentPlot', 'GainPlot',
        'FarFieldPlot', 'VCSELNearFieldPlot', 'NoisePlot',
        'hSHEDistributionPlot', 'eSHEDistributionPlot',
        'BandstructurePlot', 'TensorPlot',
    ]),
    sprocess: new Set([
        'machine', 'deposit', 'etch', 'diffuse', 'implant', 'mask',
        'strip', 'photo', 'transform', 'region', 'boundary',
        'contact', 'beam', 'pdb', 'SetTemp', 'SetTS4OxidationMode',
        '2DOxidationSetUp', 'AdvancedCalibration', 'graphics',
        'icwb.create.mask', 'line_edge_roughness', 'pdbdiff',
        'solution', 'equation', 'integrate', 'Arr', 'term',
        'contact', 'GetMoleFractionParam', 'polygon',
    ]),
    emw: new Set([
        'CodeVExcitation', 'Detector', 'DispersiveMedia',
        'GaussianBeamExcitation', 'RTA', 'Monitor', 'Boundary',
        'PlaneWaveExcitation', 'Save', 'PMCMedia', 'Sensor',
        'Plot', 'PECMedia', 'Globals', 'Extractor',
    ]),
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
};

/**
 * 获取指定语言的 section 关键词集合。
 * @param {string} langId
 * @returns {Set<string>}
 */
function getSectionKeywords(langId) {
    return SECTION_KEYWORDS[langId] || new Set();
}

/**
 * 检查命令名是否为指定语言的 section 关键词。
 * @param {string} commandName
 * @param {string} langId
 * @returns {boolean}
 */
function isSectionCommand(commandName, langId) {
    const keywords = SECTION_KEYWORDS[langId];
    return keywords ? keywords.has(commandName) : false;
}

module.exports = {
    SECTION_KEYWORDS,
    getSectionKeywords,
    isSectionCommand,
};
