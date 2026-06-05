// src/lsp/sdevicepar/par-constants.js
'use strict';

/** scope 声明关键词（解析器匹配 + 补全数据源） */
const SCOPE_TYPES = new Set([
    'Material', 'Region', 'Interface',
    'MaterialInterface', 'RegionInterface', 'Electrode',
]);

/** 补全来源优先级（sortText 前缀） */
const SOURCE_PRIORITY = {
    current: 0,
    include: 1,
    workspace: 2,
    materialdb: 3,
    builtin: 4,
};

/** include 递归深度上限 */
const MAX_INCLUDE_DEPTH = 8;

/** 缓存条目上限 */
const MAX_CACHE_SIZE = 20;

/**
 * 内置 MaterialDB 目录（相对于插件安装路径）。
 * 包含 Sentaurus T-2022.03 MaterialDB 中的常用材料参数文件。
 * loadBuiltinMaterialDb() 在 activate 时扫描此目录并加载所有 .par 文件。
 */
const BUILTIN_MATERIALDB_DIR = 'references/MaterialDB';

/**
 * 内置 MaterialDB 中应排除的文件名集合。
 * example_sdevice.par 是器件定义文件，不是材料参数文件。
 */
const BUILTIN_MATERIALDB_EXCLUDE = new Set([
    'example_sdevice.par',
]);

module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
    BUILTIN_MATERIALDB_DIR,
    BUILTIN_MATERIALDB_EXCLUDE,
};
