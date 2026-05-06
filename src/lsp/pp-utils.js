'use strict';

/**
 * 分析预处理器指令块，返回分支映射和折叠范围。
 * @param {string} text - 文档原始文本
 * @returns {{ branchMap: Map<number, number>, foldingRanges: Array<{startLine: number, endLine: number}> }}
 * branchMap: 行号(1-based) → 分支 ID
 * foldingRanges: 0-based 行号范围的折叠范围
 */
function buildPpBlocks(text) {
    const branchMap = new Map();
    const foldingRanges = [];
    const lines = text.split('\n');
    const stack = []; // { branchId, startLine(0-based) }
    let nextId = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        if (/^#(if|ifdef|ifndef)\b/.test(line)) {
            const id = nextId++;
            stack.push({ branchId: id, startLine: i });
        } else if (/^#(elif|else)\b/.test(line)) {
            if (stack.length > 0) {
                const id = nextId++;
                stack[stack.length - 1].branchId = id;
            }
        } else if (/^#endif\b/.test(line)) {
            if (stack.length > 0) {
                const entry = stack.pop();
                if (entry.startLine < i) {
                    foldingRanges.push({ startLine: entry.startLine, endLine: i });
                }
            }
        }

        if (stack.length > 0) {
            branchMap.set(lineNum, stack[stack.length - 1].branchId);
        }
    }

    return { branchMap, foldingRanges };
}

/**
 * 从文本中提取 #define 宏定义。
 * @param {string} text - 文档全文
 * @returns {Array<{name: string, value: string, line: number, endLine: number, definitionText: string, kind: string}>}
 */
function extractPpDefines(text) {
    const defines = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^\s*#\s*define\s+(\w+)(?:\s+(.*))?$/);
        if (match) {
            const rawValue = match[2];
            const value = rawValue !== undefined ? rawValue.trim() : '';
            defines.push({
                name: match[1],
                value,
                line: i + 1,
                endLine: i + 1,
                definitionText: lines[i].trim(),
                kind: 'ppDefine',
            });
        }
    }
    return defines;
}

/**
 * 从文本中提取 #undef 指令。
 * @param {string} text - 文档全文
 * @returns {Array<{name: string, line: number}>}
 */
function extractPpUndefs(text) {
    const undefs = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^\s*#\s*undef\s+(\w+)/);
        if (match) {
            undefs.push({ name: match[1], line: i + 1 });
        }
    }
    return undefs;
}

/** 转义正则特殊字符 */
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 检查 line[col] 是否在双引号字符串内 */
function isInQuotedString(line, col) {
    let inStr = false;
    for (let i = 0; i < col; i++) {
        if (line[i] === '\\' && inStr) { i++; continue; }
        if (line[i] === '"') inStr = !inStr;
    }
    return inStr;
}

/**
 * 检测 #define 宏在文档中的引用位置。
 * @param {string} text - 文档全文
 * @param {Array<{name: string, line: number}>} defines - extractPpDefines 的结果
 * @returns {Array<{name: string, line: number, startCol: number, refType: string}>}
 *   refType: 'ifdef'|'ifndef'|'undef'|'usage'
 */
function findPpDefineRefs(text, defines) {
    if (defines.length === 0) return [];

    const refs = [];
    const lines = text.split('\n');

    const undefs = extractPpUndefs(text);
    const undefMap = new Map();
    for (const u of undefs) {
        undefMap.set(u.name, u.line);
    }

    for (const def of defines) {
        const undefLine = undefMap.get(def.name);
        const regex = new RegExp(`\\b${escapeRegex(def.name)}\\b`, 'g');

        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            if (lineNum < def.line) continue;
            if (undefLine !== undefined && lineNum > undefLine) continue;

            const line = lines[i];

            // 精确提取：#ifdef / #ifndef
            const ifdefMatch = line.match(/^#\s*(ifdef|ifndef)\s+(\w+)/);
            if (ifdefMatch && ifdefMatch[2] === def.name) {
                const nameStart = line.indexOf(def.name, line.indexOf(ifdefMatch[1]) + ifdefMatch[1].length);
                refs.push({ name: def.name, line: lineNum, startCol: nameStart, refType: ifdefMatch[1] });
                continue;
            }

            // 精确提取：#undef
            const undefMatch = line.match(/^#\s*undef\s+(\w+)/);
            if (undefMatch && undefMatch[1] === def.name) {
                const nameStart = line.indexOf(def.name, 5);
                refs.push({ name: def.name, line: lineNum, startCol: nameStart, refType: 'undef' });
                continue;
            }

            // #define 定义行本身：跳过
            const defineMatch = line.match(/^#\s*define\s+(\w+)/);
            if (defineMatch && defineMatch[1] === def.name) continue;

            // 纯注释行 → 跳过
            const trimmed = line.trimStart();
            if (trimmed.startsWith('#') && !/^#\s*(if|ifdef|ifndef|elif|else|endif|define|undef|include|error|set|seth|rem|verbatim)\b/.test(trimmed)) {
                continue;
            }

            // 裸词扫描
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(line)) !== null) {
                const col = match.index;
                if (col > 0 && line[col - 1] === '$') continue;
                if (col >= 2 && line[col - 1] === '{' && line[col - 2] === '$') continue;
                if (isInQuotedString(line, col)) continue;
                refs.push({ name: def.name, line: lineNum, startCol: col, refType: 'usage' });
            }
        }
    }

    return refs;
}

/**
 * 构建全文的 #define 相关 semantic token。
 * 供非 SDEVICE 的 Tcl 工具使用（轻量级 semantic provider）。
 * @param {string} text - 文档全文
 * @returns {number[]} Delta-encoded semantic token array
 */
function buildPpDefineTokens(text) {
    const defines = extractPpDefines(text);
    if (defines.length === 0) return [];

    const refs = findPpDefineRefs(text, defines);
    const lines = text.split('\n');
    const tokens = [];

    // 定义位置
    for (const def of defines) {
        const lineIdx = def.line - 1;
        const line = lines[lineIdx];
        const match = line.match(/^(\s*)#\s*define\s+(\w+)/);
        if (match) {
            const nameCol = line.indexOf(def.name, match[1].length + 7);
            tokens.push({ line: lineIdx, col: nameCol, len: def.name.length, type: 0, modifier: 1 });
        }
    }

    // 引用位置
    for (const ref of refs) {
        tokens.push({ line: ref.line - 1, col: ref.startCol, len: ref.name.length, type: 0, modifier: 0 });
    }

    tokens.sort((a, b) => a.line !== b.line ? a.line - b.line : a.col - b.col);
    return encodeTokenDelta(tokens);
}

function encodeTokenDelta(tokens) {
    const result = [];
    let prevLine = 0, prevCol = 0;
    for (const t of tokens) {
        const deltaLine = t.line - prevLine;
        const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
        result.push(deltaLine, deltaCol, t.len, t.type, t.modifier || 0);
        prevLine = t.line;
        prevCol = t.col;
    }
    return result;
}

module.exports = { buildPpBlocks, extractPpDefines, extractPpUndefs, findPpDefineRefs, buildPpDefineTokens, escapeRegex, encodeTokenDelta };
