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

module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
};
