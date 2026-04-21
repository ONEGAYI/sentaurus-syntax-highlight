'use strict';

const TOKEN_TYPES = ['userFunctionCall'];
const TOKEN_MODIFIERS = [];

/**
 * 将绝对字符偏移转换为 (0-based line, 0-based col)，利用预计算行首偏移表。
 * @param {number} absOffset
 * @param {number[]} lineStarts
 * @returns {{ line: number, col: number }}
 */
function offsetToLineCol(absOffset, lineStarts) {
    // 二分查找：找最大的 lineStarts[i] <= absOffset
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= absOffset) lo = mid;
        else hi = mid - 1;
    }
    return { line: lo, col: absOffset - lineStarts[lo] };
}

/**
 * 从 AST 中提取所有函数调用位置的语义令牌。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {Set<string>} userFuncNames - 用户定义函数名集合
 * @param {number[]} lineStarts - 预计算行首偏移表
 * @returns {number[]} delta 编码的语义令牌数组
 */
function extractSemanticTokens(ast, userFuncNames, lineStarts) {
    const tokens = [];

    function walk(node) {
        if (node.type === 'List') {
            const children = node.children || [];
            let firstEffective = null;
            for (const child of children) {
                if (child.type !== 'Comment') {
                    firstEffective = child;
                    break;
                }
            }
            if (firstEffective && firstEffective.type === 'Identifier' &&
                userFuncNames.has(firstEffective.value)) {
                const pos = offsetToLineCol(firstEffective.start, lineStarts);
                tokens.push(pos.line, pos.col, firstEffective.end - firstEffective.start);
            }
            // define 表达式中跳过 children[1]（变量名或函数签名 List），
            // 但仍递归 children[2:]（body 中的函数调用需要被标记）
            const isDefine = firstEffective && firstEffective.type === 'Identifier' &&
                firstEffective.value === 'define';
            for (let i = 0; i < children.length; i++) {
                if (isDefine && i === 1) continue;
                walk(children[i]);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression);
        } else if (node.type === 'Program') {
            for (const child of node.body) {
                walk(child);
            }
        }
    }

    walk(ast);
    return encodeDelta(tokens);
}

function encodeDelta(rawTokens) {
    const result = [];
    let prevLine = 0;
    let prevCol = 0;
    for (let i = 0; i < rawTokens.length; i += 3) {
        const line = rawTokens[i];
        const col = rawTokens[i + 1];
        const len = rawTokens[i + 2];
        const deltaLine = line - prevLine;
        const deltaCol = deltaLine === 0 ? col - prevCol : col;
        result.push(deltaLine, deltaCol, len, 0, 0);
        prevLine = line;
        prevCol = col;
    }
    return result;
}

function createSemanticTokensProvider(schemeCache) {
    return {
        provideDocumentSemanticTokens(document) {
            const { ast, analysis, lineStarts } = schemeCache.get(document);
            const userDefs = analysis.definitions;
            const userFuncNames = new Set();
            for (const d of userDefs) {
                if (d.kind === 'function' || d.params) {
                    userFuncNames.add(d.name);
                }
            }
            const data = extractSemanticTokens(ast, userFuncNames, lineStarts);
            return { data };
        },
    };
}

module.exports = {
    createSemanticTokensProvider,
    extractSemanticTokens,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
