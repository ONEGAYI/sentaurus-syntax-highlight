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
