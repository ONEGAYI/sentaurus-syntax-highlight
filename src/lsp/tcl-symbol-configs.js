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
        // 创建可视化对象（create_*）
        'create_plot', 'create_curve', 'create_field', 'create_surface', 'create_iso',
        'create_cutplane', 'create_cutline', 'create_cutpolyline',
        'create_cut_boundary', 'create_projection',
        'create_streamline', 'extract_streamlines', 'create_variable',
        // 配置属性（set_*_prop）— 通常含多行 -option value
        'set_plot_prop', 'set_curve_prop',
        'set_field_prop', 'set_material_prop', 'set_region_prop',
        'set_cutplane_prop', 'set_cutline_prop',
        'set_streamline_prop', 'set_vector_prop',
        'set_axis_prop', 'set_grid_prop', 'set_legend_prop', 'set_camera_prop', 'set_ruler_prop',
        // 绘制元素（draw_*）
        'draw_line', 'draw_rectangle', 'draw_ellipse', 'draw_textbox',
        'set_line_prop', 'set_rectangle_prop', 'set_ellipse_prop', 'set_textbox_prop',
        // 分析计算（含坐标/范围块体）
        'calculate_field_value', 'integrate_field', 'probe_field',
        'find_values', 'extract_path',
        // 其他多行配置
        'set_transformation', 'set_tag_prop', 'set_vertical_lines_prop',
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
    isSectionCommand,
};
