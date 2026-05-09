'use strict';

const ppUtils = require('../pp-utils');

const FULL_TOKEN_TYPES = ['userFunctionCall', 'macro'];
const FUNCALL_ONLY_TYPES = ['userFunctionCall'];
const TOKEN_MODIFIERS = ['declaration'];

/**
 * 遍历 Tcl AST，查找用户定义 proc 的调用位置。
 * procedure 节点的简单子节点（函数名 simple_word）不是 command 节点，通用递归自然跳过它们。
 * @param {object} node - AST 节点
 * @param {Map<string, number>} procNames - proc 名 → defLine 的 Map
 * @param {number[]} lineStarts - 预计算行首偏移表
 * @param {function} collector - 回调 (line, col, len)
 */
function walkForTclFuncCalls(node, procNames, _lineStarts, collector) {
    if (node.type === 'command') {
        const firstChild = node.child(0);
        if (firstChild && firstChild.type === 'simple_word' && procNames.has(firstChild.text)) {
            collector(firstChild.startPosition.row, firstChild.startPosition.column, firstChild.endPosition.column - firstChild.startPosition.column);
        }
    }

    for (let i = 0; i < node.childCount; i++) {
        walkForTclFuncCalls(node.child(i), procNames, _lineStarts, collector);
    }
}

/**
 * 为 Tcl 工具创建语义令牌 provider，提供：
 * - Type 0: userFunctionCall（用户定义 proc 调用处）
 * - Type 1: macro（#define 宏定义和引用，仅当 options.includeMacro 为 true）
 *
 * @param {object} tclCache - TclParseCache 实例
 * @param {{ includeMacro?: boolean }} [options]
 * @returns {{ provideDocumentSemanticTokens: function }}
 */
function createTclFuncallSemanticProvider(tclCache, options) {
    const includeMacro = options && options.includeMacro;

    return {
        provideDocumentSemanticTokens(document) {
            const entry = tclCache.get(document);
            if (!entry) return { data: new Uint32Array(0) };

            const rawTokens = [];

            // Type 0: userFunctionCall
            const scopeIndex = tclCache.getScopeIndex(document);
            const procNames = scopeIndex ? scopeIndex.globalProcNames : new Map();
            if (procNames.size > 0) {
                walkForTclFuncCalls(entry.tree.rootNode, procNames, null, (line, col, len) => {
                    rawTokens.push([line, col, len, 0, 0]);
                });
            }

            // Type 1: macro（定义处 modifier=1 declaration，引用处 modifier=0）
            if (includeMacro) {
                for (const def of entry.ppDefs) {
                    rawTokens.push([def.line - 1, def.startCol, def.name.length, 1, 1]);
                }
                const ppRefs = ppUtils.findPpDefineRefs(entry.text, entry.ppDefs);
                for (const ref of ppRefs) {
                    rawTokens.push([ref.line - 1, ref.startCol, ref.name.length, 1, 0]);
                }
            }

            if (rawTokens.length === 0) {
                return { data: new Uint32Array(0) };
            }

            rawTokens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            return { data: ppUtils.encodeDelta5(rawTokens) };
        },
    };
}

module.exports = {
    createTclFuncallSemanticProvider,
    walkForTclFuncCalls,
    TOKEN_TYPES: FULL_TOKEN_TYPES,
    FUNCALL_ONLY_TYPES,
    TOKEN_MODIFIERS,
};
