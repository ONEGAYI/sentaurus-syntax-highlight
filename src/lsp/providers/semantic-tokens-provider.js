'use strict';

const ppUtils = require('../pp-utils');

const TOKEN_TYPES = ['userFunctionCall', 'macro'];
const TOKEN_MODIFIERS = ['declaration'];

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
 * 共享 AST walker：提取用户定义函数调用位置。
 * @param {object} node - AST 节点
 * @param {Set<string>} userFuncNames - 用户定义函数名集合
 * @param {number[]} lineStarts - 预计算行首偏移表
 * @param {function} collector - 回调 (line, col, len)
 */
function _walkForFuncCalls(node, userFuncNames, lineStarts, collector) {
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
            collector(pos.line, pos.col, firstEffective.end - firstEffective.start);
        }
        // define 表达式中跳过 children[1]（变量名或函数签名 List），
        // 但仍递归 children[2:]（body 中的函数调用需要被标记）
        const isDefine = firstEffective && firstEffective.type === 'Identifier' &&
            firstEffective.value === 'define';
        for (let i = 0; i < children.length; i++) {
            if (isDefine && i === 1) continue;
            _walkForFuncCalls(children[i], userFuncNames, lineStarts, collector);
        }
    } else if (node.type === 'Quote') {
        _walkForFuncCalls(node.expression, userFuncNames, lineStarts, collector);
    } else if (node.type === 'Program') {
        for (const child of node.body) {
            _walkForFuncCalls(child, userFuncNames, lineStarts, collector);
        }
    }
}

/**
 * 从 AST 中提取所有函数调用位置的语义令牌（向后兼容，供测试使用）。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {Set<string>} userFuncNames - 用户定义函数名集合
 * @param {number[]} lineStarts - 预计算行首偏移表
 * @returns {number[]} delta 编码的语义令牌数组
 */
function extractSemanticTokens(ast, userFuncNames, lineStarts) {
    const tokens = [];
    _walkForFuncCalls(ast, userFuncNames, lineStarts, (line, col, len) => tokens.push(line, col, len));
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

/**
 * 将 5 元组 [line, col, len, typeIdx, modBitmask] 数组编码为 delta 格式。
 * @param {number[][]} rawTokens
 * @returns {number[]}
 */
function encodeDeltaFull(rawTokens) {
    const result = [];
    let prevLine = 0;
    let prevCol = 0;
    for (const [line, col, len, typeIdx, modBitmask] of rawTokens) {
        const deltaLine = line - prevLine;
        const deltaCol = deltaLine === 0 ? col - prevCol : col;
        result.push(deltaLine, deltaCol, len, typeIdx, modBitmask);
        prevLine = line;
        prevCol = col;
    }
    return result;
}

function createSemanticTokensProvider(schemeCache) {
    return {
        provideDocumentSemanticTokens(document) {
            const text = document.getText();
            const { ast, analysis, lineStarts } = schemeCache.get(document);

            // 收集所有原始 token: [line, col, len, typeIdx, modBitmask]
            const rawTokens = [];

            // Type 0: userFunctionCall
            const userDefs = analysis.definitions;
            const userFuncNames = new Set();
            for (const d of userDefs) {
                if (d.kind === 'function' || d.params) {
                    userFuncNames.add(d.name);
                }
            }
            _walkForFuncCalls(ast, userFuncNames, lineStarts, (line, col, len) => {
                rawTokens.push([line, col, len, 0, 0]);
            });

            // Type 1: macro, Mod 1 = declaration (定义位置), Mod 0 = 引用
            const ppDefs = ppUtils.extractPpDefines(text);
            const lines = text.split('\n');
            for (const def of ppDefs) {
                const line0 = def.line - 1;
                if (line0 < lines.length) {
                    const re = new RegExp('\\b' + ppUtils.escapeRegex(def.name) + '\\b');
                    const match = re.exec(lines[line0]);
                    if (match) {
                        rawTokens.push([line0, match.index, def.name.length, 1, 1]);
                    }
                }
            }

            const ppRefs = ppUtils.findPpDefineRefs(text, ppDefs);
            for (const ref of ppRefs) {
                rawTokens.push([ref.line - 1, ref.startCol, ref.name.length, 1, 0]);
            }

            rawTokens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            return { data: encodeDeltaFull(rawTokens) };
        },
    };
}

module.exports = {
    createSemanticTokensProvider,
    extractSemanticTokens,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
