'use strict';

const ppUtils = require('../pp-utils');

const TOKEN_TYPES = ['userFunctionCall', 'ppMacro'];
const TOKEN_MODIFIERS = ['declaration'];

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
            const pos = ppUtils.offsetToLineCol(firstEffective.start, lineStarts);
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
    return ppUtils.encodeDelta3(tokens);
}

function createSemanticTokensProvider(schemeCache) {
    return {
        provideDocumentSemanticTokens(document) {
            const { ast, analysis, lineStarts, text, ppDefs } = schemeCache.get(document);

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
            for (const def of ppDefs) {
                rawTokens.push([def.line - 1, def.startCol, def.name.length, 1, 1]);
            }

            const ppRefs = ppUtils.findPpDefineRefs(text, ppDefs);
            for (const ref of ppRefs) {
                rawTokens.push([ref.line - 1, ref.startCol, ref.name.length, 1, 0]);
            }

            rawTokens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            return { data: ppUtils.encodeDelta5(rawTokens) };
        },
    };
}

module.exports = {
    createSemanticTokensProvider,
    extractSemanticTokens,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
