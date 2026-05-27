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
 * 内置 MaterialDB 占位文件数据。Phase 2.3 仅包含 Silicon + Oxide 的少量 block/parameter，
 * 证明 MaterialDB 管线接入成功。完整内置库填充在下次 PR。
 *
 * 采用与用户 MaterialDB 相同的"顶层 block"格式（格式 A），
 * 通过 addMaterialDbFile 走完全相同的归一化管线。
 */
const BUILTIN_MATERIALDB_STUB_FILES = [
    {
        filePath: '[built-in MaterialDB]/Silicon.par',
        text: [
            'Epsilon {',
            '  epsilon = 11.7',
            '}',
            '',
            'Bandgap {',
            '  Eg0 = 1.12',
            '}',
        ].join('\n'),
    },
    {
        filePath: '[built-in MaterialDB]/Oxide.par',
        text: [
            'Epsilon {',
            '  epsilon = 3.9',
            '}',
        ].join('\n'),
    },
];

module.exports = {
    SCOPE_TYPES,
    SCOPE_TYPES_ARRAY: Array.from(SCOPE_TYPES),
    SOURCE_PRIORITY,
    MAX_INCLUDE_DEPTH,
    MAX_CACHE_SIZE,
    BUILTIN_MATERIALDB_STUB_FILES,
};
