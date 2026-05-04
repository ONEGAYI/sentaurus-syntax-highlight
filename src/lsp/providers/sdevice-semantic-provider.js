// src/lsp/providers/sdevice-semantic-provider.js
'use strict';

const TOKEN_TYPES = ['sectionName', 'sectionKeyword'];
const TOKEN_MODIFIERS = [];

/**
 * 从 sdevice_command_docs.json 构建关键词→所属 section 集合的索引。
 * @param {Object} docs - sdevice_command_docs.json 解析结果
 * @returns {Map<string, Set<string>>} keyword → Set<section>
 */
function buildKeywordSectionIndex(docs) {
    const index = new Map();

    function add(kw, section) {
        if (!index.has(kw)) index.set(kw, new Set());
        index.get(kw).add(section);
    }

    for (const [kw, v] of Object.entries(docs)) {
        const section = v.section;
        add(kw, section);
        if (Array.isArray(v.parameters)) {
            for (const p of v.parameters) {
                const name = typeof p === 'object' ? p.name : p;
                if (name) add(name, section);
            }
        }
        if (Array.isArray(v.keywords)) {
            for (const k of v.keywords) {
                if (typeof k === 'string') add(k, section);
            }
        }
    }
    return index;
}

module.exports = {
    buildKeywordSectionIndex,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
