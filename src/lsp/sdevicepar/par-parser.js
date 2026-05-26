// src/lsp/sdevicepar/par-parser.js
'use strict';

const { SCOPE_TYPES_ARRAY } = require('./par-constants');

const SCOPE_TYPES_PATTERN = SCOPE_TYPES_ARRAY.join('|');

// ── 正则（按匹配优先级排列）────────────────────────
const RE_INCLUDE    = /^\s*#include\s+"([^"]+)"/;
const RE_PP_COND    = /^\s*#(?:if|elif|else|endif|define|undef|ifdef|ifndef)\b/;
const RE_HASH       = /^\s*#/;
const RE_STAR       = /^\s*\*/;
const RE_SCOPE      = new RegExp(`^\\s*(${SCOPE_TYPES_PATTERN})\\s*=\\s*"([^"]+)"\\s*(\\{?)`);
const RE_INSERT     = /^\s*Insert\s*=\s*"([^"]+)"/;
const RE_OPEN_BRACE = /^\s*\{/;
const RE_BLOCK      = /^\s*([A-Za-z][\w-]*)\s*\{/;
const RE_PARAM      = /^\s*([A-Za-z][\w-]*(?:\(\d+\))?)\s*=\s*(.*)/;
const RE_IDENT      = /^\s*([A-Za-z][\w-]+)/;

function countBraceDelta(line) {
    let opens = 0, closes = 0;
    let inStr = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
            if (c === '\\') { i++; continue; }
            if (c === '"') inStr = false;
            continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === '{') opens++;
        if (c === '}') closes++;
    }
    return { opens, closes };
}

/**
 * 栈转路径字符串。
 * scope 帧 → "scopeType/name"，block 帧 → "name"
 */
function stackToPath(stack) {
    return stack.map(s =>
        s.kind === 'scope' ? s.scopeType + '/' + s.name : s.name
    ).join('/');
}

/**
 * 解析 .par 文件文本，返回结构化结果。
 * @param {string} text
 * @param {string} filePath
 * @returns {{ symbols: object[], includes: object[], lineContexts: object[], diagnostics: object[] }}
 */
function parseParText(text, filePath) {
    const symbols = [];
    const includes = [];
    const lineContexts = [];
    const diagnostics = [];
    const lines = text.split('\n');
    const stack = [];
    let pendingBlockName = null;
    let pendingStartLine = -1;

    function snapshotStack() {
        return stack.map(s => ({
            kind: s.kind,
            name: s.name,
            scopeType: s.scopeType || null,
            startLine: s.startLine,
        }));
    }

    function pushToStack(entry) {
        stack.push(entry);
    }

    function popStack(count) {
        for (let i = 0; i < count && stack.length > 0; i++) {
            const closed = stack.pop();
            if (closed._symbolIdx !== undefined) {
                symbols[closed._symbolIdx].range.endLine = currentLineIdx;
            }
        }
    }

    function clearPending() {
        if (pendingBlockName !== null) {
            diagnostics.push({
                kind: 'abandonedPending',
                message: `Abandoned pending block name "${pendingBlockName}" at line ${pendingStartLine + 1}`,
                line: pendingStartLine,
            });
            pendingBlockName = null;
        }
    }

    let currentLineIdx = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        currentLineIdx = lineIdx;
        const line = lines[lineIdx];
        const trimmed = line.trim();

        // 快照：行解析前的栈状态
        lineContexts.push({
            line: lineIdx,
            stack: snapshotStack(),
            pendingBlockName,
        });

        // 0. 空行
        if (trimmed === '') continue;

        // 1. #include（必须在注释跳过之前）
        let m = trimmed.match(RE_INCLUDE);
        if (m) {
            clearPending();
            includes.push({
                path: m[1],
                parentPath: stackToPath(stack),
                resolvedUri: null,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
            });
            continue;
        }

        // 2. 预处理条件指令（忽略指令本身）
        if (RE_PP_COND.test(trimmed)) continue;

        // 3. 其他 # 开头行
        if (RE_HASH.test(trimmed)) continue;

        // 4. * 开头行注释
        if (RE_STAR.test(trimmed)) continue;

        // 5. scope 声明
        m = line.match(RE_SCOPE);
        if (m) {
            clearPending();
            const symIdx = symbols.length;
            const scopeEntry = { kind: 'scope', scopeType: m[1], name: m[2], startLine: lineIdx, _symbolIdx: symIdx };
            pushToStack(scopeEntry);
            const parentPath = stackToPath(stack.slice(0, -1));
            symbols.push({
                kind: 'scope',
                name: m[2],
                scopeType: m[1],
                parentPath,
                fullPath: parentPath ? parentPath + '/' + m[2] : m[2],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value: null,
                source: 'current',
                includeChain: [],
            });
            // 处理同行 } 导致的立即 pop
            const brace = countBraceDelta(line);
            if (m[3] === '{') {
                // scope 的 { 已计入 opens，无需额外处理
                if (brace.closes > 0) popStack(brace.closes);
            }
            continue;
        }

        // 6. Insert（必须在 parameter assignment 之前）
        m = trimmed.match(RE_INSERT);
        if (m) {
            clearPending();
            includes.push({
                path: m[1],
                parentPath: stackToPath(stack),
                resolvedUri: null,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
            });
            continue;
        }

        // 7. 兑现 pending block（行以 { 开头）
        if (pendingBlockName !== null && RE_OPEN_BRACE.test(trimmed)) {
            const parentPath = stackToPath(stack);
            const symIdx = symbols.length;
            pushToStack({ kind: 'block', name: pendingBlockName, startLine: pendingStartLine, _symbolIdx: symIdx });
            symbols.push({
                kind: 'block',
                name: pendingBlockName,
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + pendingBlockName,
                filePath,
                range: { startLine: pendingStartLine, startCol: 0, endLine: pendingStartLine, endCol: 0 },
                value: null,
                source: 'current',
                includeChain: [],
            });
            pendingBlockName = null;
            const brace = countBraceDelta(line);
            if (brace.closes > 1) popStack(brace.closes - 1); // 第一个 } 关闭 block 自己
            else if (brace.closes === 1) popStack(1);
            continue;
        }

        // 8. block 开始（同行 {）
        m = line.match(RE_BLOCK);
        if (m) {
            clearPending();
            const parentPath = stackToPath(stack);
            const symIdx = symbols.length;
            pushToStack({ kind: 'block', name: m[1], startLine: lineIdx, _symbolIdx: symIdx });
            symbols.push({
                kind: 'block',
                name: m[1],
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + m[1],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value: null,
                source: 'current',
                includeChain: [],
            });
            const brace = countBraceDelta(line);
            // block 的 { 已在正则中匹配，opens 至少 1
            const netCloses = brace.closes - Math.max(0, brace.opens - 1);
            if (netCloses > 0) popStack(netCloses);
            continue;
        }

        // 9. parameter assignment
        m = line.match(RE_PARAM);
        if (m) {
            clearPending();
            const parentPath = stackToPath(stack);
            const value = m[2].trim();
            symbols.push({
                kind: 'parameter',
                name: m[1],
                scopeType: null,
                parentPath,
                fullPath: parentPath + '/' + m[1],
                filePath,
                range: { startLine: lineIdx, startCol: 0, endLine: lineIdx, endCol: line.length },
                value,
                source: 'current',
                includeChain: [],
            });
            const brace = countBraceDelta(line);
            if (brace.closes > 0) popStack(brace.closes);
            continue;
        }

        // 10. 可能的 block 名（无 {，无 =）
        m = trimmed.match(RE_IDENT);
        if (m && !trimmed.includes('=')) {
            clearPending();
            pendingBlockName = m[1];
            pendingStartLine = lineIdx;
            continue;
        }

        // 11. 其他行 — 尝试处理行内 }
        const brace = countBraceDelta(line);
        if (brace.closes > 0) popStack(brace.closes);
    }

    // 文件结束时检查未关闭的括号
    if (stack.length > 0) {
        diagnostics.push({
            kind: 'unbalancedBraces',
            message: `${stack.length} unclosed brace(s) at end of file`,
            line: lines.length - 1,
        });
    }

    return { symbols, includes, lineContexts, diagnostics };
}

module.exports = { parseParText, stackToPath };
