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

/**
 * 计算文档中指定行号的 section 上下文栈。
 * @param {string} text - 文档全文
 * @param {number} targetLine - 0-based 目标行号
 * @param {Set<string>} sectionKeywords - section 名关键词集合
 * @returns {string[]} section 栈（从外到内）
 */
function getSectionStack(text, targetLine, sectionKeywords) {
    const stack = [];
    let depth = 0;
    let i = 0;
    let line = 0;

    while (i < text.length && line < targetLine) {
        const ch = text[i];

        if (ch === '\n') { line++; i++; continue; }

        // Skip comments
        if (ch === '#') {
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        }

        // Skip strings
        if (ch === '"') {
            i++;
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\') i++;
                i++;
            }
            i++;
            continue;
        }

        if (ch === '{') {
            // Look back for identifier
            let j = i - 1;
            while (j >= 0 && text[j] === ' ') j--;
            let end = j + 1;
            while (j >= 0 && /[\w]/.test(text[j])) j--;
            const ident = text.slice(j + 1, end);
            if (sectionKeywords.has(ident)) {
                stack.push({ name: ident, depth });
            }
            depth++;
            i++;
            continue;
        }

        if (ch === '}') {
            depth--;
            while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
                stack.pop();
            }
            i++;
            continue;
        }

        i++;
    }

    return stack.map(s => s.name);
}

module.exports = {
    buildKeywordSectionIndex,
    getSectionStack,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
