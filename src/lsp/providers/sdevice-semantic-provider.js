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
 * 复用 scanStacksPerLine 的结果，避免重复扫描逻辑。
 * @param {string} text - 文档全文
 * @param {number} targetLine - 0-based 目标行号
 * @param {Set<string>} sectionKeywords - section 名关键词集合
 * @returns {string[]} section 栈（从外到内）
 */
function getSectionStack(text, targetLine, sectionKeywords) {
    const stacks = scanStacksPerLine(text, sectionKeywords);
    return stacks[targetLine] || [];
}

function isWs(c) {
    return c === ' ' || c === '\t' || c === '\r' || c === '\n';
}

function isWord(c) {
    const code = c.charCodeAt(0);
    return (code >= 48 && code <= 57) ||   // 0-9
           (code >= 65 && code <= 90) ||   // A-Z
           (code >= 97 && code <= 122) ||  // a-z
           code === 95;                    // _
}

/**
 * Scan entire text, return section stack snapshot per line.
 * @param {string} text
 * @param {Set<string>} sectionKeywords
 * @returns {Array<string[]>} stacksPerLine[lineIdx] = ['Solve', 'Coupled']
 */
function scanStacksPerLine(text, sectionKeywords, preSplitLines) {
    const lines = preSplitLines || text.split('\n');
    const result = new Array(lines.length);
    const stack = [];
    let depth = 0;
    let lineStart = true;
    let lineIdx = 0;
    let i = 0;

    function snapshot() {
        if (lineIdx < result.length && result[lineIdx] === undefined) {
            result[lineIdx] = stack.map(s => s.name);
        }
    }

    while (i < text.length) {
        const ch = text[i];

        if (ch === '\n') {
            snapshot();
            lineIdx++;
            i++;
            lineStart = true;
            continue;
        }

        if (isWs(ch)) { i++; continue; }

        // Skip comments: # anywhere, * at line start
        if (ch === '#' || (ch === '*' && lineStart)) {
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        }

        lineStart = false;

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
            // Snapshot current line BEFORE pushing the new section,
            // so the section name line sees the outer stack (not itself).
            if (result[lineIdx] === undefined) {
                result[lineIdx] = stack.map(s => s.name);
            }
            let j = i - 1;
            while (j >= 0 && isWs(text[j])) j--;
            let end = j + 1;
            while (j >= 0 && isWord(text[j])) j--;
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
    snapshot();

    // Fill any remaining undefined lines after last snapshot
    for (let li = lineIdx; li < result.length; li++) {
        if (result[li] === undefined) result[li] = [];
    }

    return result;
}

/**
 * 从已扫描的 stacksPerLine 和行数组中提取 token。
 * 被 extractSdeviceTokens 和缓存层共用。
 * @param {string[]} lines - 按行拆分的文档文本
 * @param {Array<string[]>} stacksPerLine - scanStacksPerLine 的结果
 * @param {Map<string, Set<string>>} keywordIndex - keyword → Set<section>
 * @param {Set<string>} sectionKeywords - Section name keywords
 * @returns {number[]} Delta-encoded semantic token array
 */
function extractTokensFromStacks(lines, stacksPerLine, keywordIndex, sectionKeywords) {
    const tokens = [];
    const identRe = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineText = lines[lineIdx];
        const stack = stacksPerLine[lineIdx];

        // Skip comment lines
        const trimmed = lineText.trimStart();
        if (trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

        let m;
        identRe.lastIndex = 0;
        while ((m = identRe.exec(lineText)) !== null) {
            const word = m[1];
            const wordSections = keywordIndex.get(word);
            if (!wordSections) continue;

            const col = m.index;

            if (stack.length === 0) {
                // Not inside any section
                if (sectionKeywords.has(word)) {
                    // Check if followed by {
                    const after = lineText.slice(col + word.length).trimStart();
                    if (after.startsWith('{')) {
                        tokens.push({ line: lineIdx, col, len: word.length, type: 0 }); // sectionName
                    }
                }
            } else {
                // Inside section(s), check if word belongs to any stack level
                let matched = false;
                for (let si = stack.length - 1; si >= 0; si--) {
                    if (wordSections.has(stack[si])) {
                        matched = true;
                        break;
                    }
                }
                if (matched) {
                    tokens.push({ line: lineIdx, col, len: word.length, type: 1 }); // sectionKeyword
                }
            }
        }
    }

    return encodeDelta(tokens);
}

/**
 * Extract sdevice semantic tokens from text.
 * @param {string} text - Document full text
 * @param {Map<string, Set<string>>} keywordIndex - keyword → Set<section>
 * @param {Set<string>} sectionKeywords - Section name keywords
 * @returns {number[]} Delta-encoded semantic token array
 */
function extractSdeviceTokens(text, keywordIndex, sectionKeywords) {
    const lines = text.split('\n');
    const stacksPerLine = scanStacksPerLine(text, sectionKeywords, lines);
    return extractTokensFromStacks(lines, stacksPerLine, keywordIndex, sectionKeywords);
}

function encodeDelta(tokens) {
    const result = [];
    let prevLine = 0, prevCol = 0;
    for (const t of tokens) {
        const deltaLine = t.line - prevLine;
        const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
        result.push(deltaLine, deltaCol, t.len, t.type, 0);
        prevLine = t.line;
        prevCol = t.col;
    }
    return result;
}

/**
 * 创建 sdevice Semantic Tokens Provider（含 document.version 缓存）。
 * @param {Object} docs - sdevice_command_docs.json data
 * @param {Set<string>} sectionKeywords - section name keywords
 */
function createSdeviceSemanticProvider(docs, sectionKeywords) {
    const keywordIndex = buildKeywordSectionIndex(docs);
    /** @type {Map<string, { version: number, stacksPerLine: Array<string[]>, tokenData: number[] }>} */
    const cache = new Map();
    const MAX_CACHE = 20;

    function getCacheEntry(document) {
        const uri = document.uri.toString();
        const version = document.version;
        const cached = cache.get(uri);
        if (cached && cached.version === version) return cached;

        const text = document.getText();
        const lines = text.split('\n');
        const stacksPerLine = scanStacksPerLine(text, sectionKeywords, lines);
        const tokenData = extractTokensFromStacks(lines, stacksPerLine, keywordIndex, sectionKeywords);

        const entry = { version, stacksPerLine, tokenData };
        cache.set(uri, entry);

        if (cache.size > MAX_CACHE) {
            cache.delete(cache.keys().next().value);
        }
        return entry;
    }

    return {
        provideDocumentSemanticTokens(document) {
            const entry = getCacheEntry(document);
            return { data: entry.tokenData };
        },
        /**
         * 获取文档指定行的 section 栈（缓存版，供 hover 使用）。
         * @param {vscode.TextDocument} document
         * @param {number} targetLine - 0-based 行号
         * @returns {string[]}
         */
        getSectionStackForDocument(document, targetLine) {
            const entry = getCacheEntry(document);
            return entry.stacksPerLine[targetLine] || [];
        },
        invalidate(uri) {
            cache.delete(uri);
        },
        dispose() {
            cache.clear();
        },
    };
}

module.exports = {
    buildKeywordSectionIndex,
    scanStacksPerLine,
    getSectionStack,
    extractSdeviceTokens,
    extractTokensFromStacks,
    createSdeviceSemanticProvider,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
