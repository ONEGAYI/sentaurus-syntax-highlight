/**
 * SDEVICE Plot section 矢量关键词数据。
 *
 * 数据来源：SDEVICE User Guide T-2022.03
 *   Table 196 — Vector plot data（55 个基础关键词）
 *   Table 197 — Special vector plot data（2 个，SHE 分布）
 *
 * 后缀格式：
 * - /Vector（大写 V）— Table 196 全量矢量数据
 * - /vector（小写 v）— ConductionCurrentDensity、PE_Polarization、ContactSurfaceNormal
 * - /SpecialVector — Table 197，SHE 分布专用
 */

// 后缀 → 支持该后缀的基础关键词列表
const VECTOR_KEYWORDS = {
    '/Vector': [
        'ElectricField', 'EquilibriumElectricField',
        'InsulatorElectricField', 'SemiconductorElectricField',
        'eVelocity', 'hVelocity',
        'eDriftVelocity', 'hDriftVelocity',
        'eSHEVelocity', 'hSHEVelocity',
        'eGradQuasiFermi', 'hGradQuasiFermi',
        'Mod_eGradQuasiFermi_ElectricField', 'Mod_hGradQuasiFermi_ElectricField',
        'eHeatFlux', 'hHeatFlux', 'lHeatFlux',
        'eSHECurrentDensity', 'hSHECurrentDensity',
        'eCurrentDensity', 'hCurrentDensity',
        'TotalCurrentDensity', 'DisplacementCurrentDensity',
        'Current', 'eCurrent', 'hCurrent',
        'ConductionCurrent', 'DisplacementCurrent',
        'ImConductionCurrentResponse', 'ImDisplacementCurrentResponse',
        'ImeCurrentResponse', 'ImeEnFluxResponse',
        'ImhCurrentResponse', 'ImhEnFluxResponse',
        'ImlEnFluxResponse', 'ImTotalCurrentResponse',
        'ReConductionCurrentResponse', 'ReDisplacementCurrentResponse',
        'ReeCurrentResponse', 'ReeEnFluxResponse',
        'RehCurrentResponse', 'RehEnFluxResponse',
        'RelEnFluxResponse', 'ReTotalCurrentResponse',
        'GradPoECImACGreenFunction', 'GradPoECReACGreenFunction',
        'GradPoETImACGreenFunction', 'GradPoETReACGreenFunction',
        'GradPoHCImACGreenFunction', 'GradPoHCReACGreenFunction',
        'GradPoHTImACGreenFunction', 'GradPoHTReACGreenFunction',
        'HighFieldEntrancePosition',
        'NonLocalBackDirection', 'NonLocalDirection',
        'OpticalField', 'Polarization',
    ],
    '/vector': [
        'ConductionCurrentDensity',
        'PE_Polarization',
        'ContactSurfaceNormal',
    ],
    '/SpecialVector': [
        'eSHEDistribution',
        'hSHEDistribution',
    ],
};

// 反向索引：基础关键词 → 可用后缀列表
const BASE_TO_SUFFIXES = new Map();
for (const [suffix, bases] of Object.entries(VECTOR_KEYWORDS)) {
    for (const base of bases) {
        if (!BASE_TO_SUFFIXES.has(base)) BASE_TO_SUFFIXES.set(base, []);
        BASE_TO_SUFFIXES.get(base).push(suffix);
    }
}

// 全量 "Base/Suffix" 集合（用于语义 token 快速查找）
const FULL_VECTOR_KEYWORDS = new Set();
for (const [suffix, bases] of Object.entries(VECTOR_KEYWORDS)) {
    for (const base of bases) {
        FULL_VECTOR_KEYWORDS.add(base + suffix);
    }
}

// 触发矢量功能的 section 集合
const VECTOR_SECTIONS = new Set(['Plot', 'CurrentPlot']);

// 合法后缀集合
const VALID_SUFFIXES = new Set(Object.keys(VECTOR_KEYWORDS));

/**
 * 判断基础关键词是否支持矢量后缀。
 * @param {string} keyword
 * @returns {boolean}
 */
function isVectorBase(keyword) {
    return BASE_TO_SUFFIXES.has(keyword);
}

/**
 * 获取基础关键词可用的矢量后缀列表。
 * @param {string} keyword
 * @returns {string[] | undefined} 后缀数组（如 ['/Vector']）或 undefined
 */
function getSuffixesForBase(keyword) {
    return BASE_TO_SUFFIXES.get(keyword);
}

/**
 * 从完整矢量关键词中提取基础关键词。
 * 如 "ElectricField/Vector" → "ElectricField"
 * @param {string} word
 * @returns {string | null} 基础关键词，如果不是矢量形式则返回 null
 */
function resolveBaseKeyword(word) {
    const slashIdx = word.indexOf('/');
    if (slashIdx === -1) return null;
    const base = word.slice(0, slashIdx);
    const suffix = word.slice(slashIdx);
    const suffixes = BASE_TO_SUFFIXES.get(base);
    if (!suffixes) return null;
    return suffixes.includes(suffix) ? base : null;
}

module.exports = {
    VECTOR_KEYWORDS,
    BASE_TO_SUFFIXES,
    FULL_VECTOR_KEYWORDS,
    VECTOR_SECTIONS,
    VALID_SUFFIXES,
    isVectorBase,
    getSuffixesForBase,
    resolveBaseKeyword,
};
