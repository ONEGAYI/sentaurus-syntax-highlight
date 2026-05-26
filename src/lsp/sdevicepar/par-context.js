// src/lsp/sdevicepar/par-context.js
'use strict';

const { SCOPE_TYPES_ARRAY } = require('./par-constants');

/**
 * 栈转路径字符串。
 * scope 帧 → "scopeType/name"，block 帧 → "name"
 * @param {Array<{kind: string, name: string, scopeType: string|null}>} stack
 * @returns {string}
 */
function stackToPath(stack) {
    return stack.map(s =>
        s.kind === 'scope' && s.scopeType ? s.scopeType + '/' + s.name : s.name
    ).join('/');
}

/**
 * 从 lineContexts 获取光标位置的上下文。
 *
 * Phase 2.1 设计：使用 beforeStack（行解析前的栈快照）。
 * 同一行内的 mid-line 上下文追踪不在 Phase 2.1 范围内。
 *
 * @param {Array<{line: number, stack: object[], pendingBlockName: string|null}>} lineContexts
 * @param {number} targetLine - 0-based 行号
 * @param {number} _targetCol - 未使用（Phase 2.1 不做同行上下文）
 * @returns {{ parentPath: string, scopeType: string|null, completableKind: string, pendingBlockName: string|null } | null}
 */
function getContextAtPosition(lineContexts, targetLine, _targetCol) {
    if (targetLine < 0 || targetLine >= lineContexts.length) return null;

    const ctx = lineContexts[targetLine];
    const stack = ctx.stack;
    const parentPath = stackToPath(stack);

    // Determine top-level scope type
    const scopeFrame = stack.find(s => s.kind === 'scope');
    const scopeType = scopeFrame ? scopeFrame.scopeType : null;

    // Determine what kind of completion is appropriate
    let completableKind;
    if (ctx.pendingBlockName) {
        completableKind = 'blockPending';
    } else if (stack.length === 0) {
        completableKind = 'scopeType';
    } else {
        const top = stack[stack.length - 1];
        if (top.kind === 'scope') {
            completableKind = 'block';
        } else if (top.kind === 'block') {
            completableKind = 'parameter';
        } else {
            completableKind = null;
        }
    }

    return {
        parentPath,
        scopeType,
        completableKind,
        pendingBlockName: ctx.pendingBlockName || null,
    };
}

/**
 * 通配符路径匹配。'*' 匹配单个路径段。
 * @param {string} parentPath - 实际路径，如 "Material/Silicon/Bandgap"
 * @param {string} pattern - 模式，如 "Material/STAR/Bandgap"（STAR 代表通配符段）
 * @returns {boolean}
 */
function matchParentPath(parentPath, pattern) {
    if (!pattern.includes('*')) return parentPath === pattern;

    const pathParts = parentPath.split('/');
    const patternParts = pattern.split('/');
    if (pathParts.length !== patternParts.length) return false;

    for (let i = 0; i < pathParts.length; i++) {
        if (patternParts[i] === '*') continue;
        if (pathParts[i] !== patternParts[i]) return false;
    }
    return true;
}

/**
 * 检测光标是否在 scope 名引号内（如 Material = "|""）。
 * Phase 2.1 最小实现：仅检测 `Type = "` 模式后引号内的位置。
 * @param {string} lineText - 当前行文本
 * @param {number} col - 光标列号
 * @returns {{ scopeType: string } | null} 如果在 scope 名引号内，返回 scopeType；否则 null
 */
const scopeNameRe = new RegExp(`^\\s*(${SCOPE_TYPES_ARRAY.join('|')})\\s*=\\s*"`);

function detectScopeNameContext(lineText, col) {
    // 匹配 Type = "xxx" 模式，光标在引号内
    const m = lineText.match(scopeNameRe);
    if (!m) return null;

    const scopeType = m[1];
    const quoteStart = lineText.indexOf('"', m[0].length - 1);
    if (quoteStart < 0) return null;

    // 找到结束引号
    let quoteEnd = lineText.indexOf('"', quoteStart + 1);
    if (quoteEnd < 0) quoteEnd = lineText.length; // 未闭合引号

    if (col > quoteStart && col <= quoteEnd) {
        return { scopeType };
    }
    return null;
}

module.exports = { stackToPath, getContextAtPosition, matchParentPath, detectScopeNameContext };
