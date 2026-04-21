'use strict';

const TOKEN_TYPES = ['function'];
const TOKEN_MODIFIERS = [];

/**
 * 从 AST 中提取所有函数调用位置的语义令牌。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {Set<string>} userFuncNames - 用户定义函数名集合
 * @param {string} sourceText - 原始源码文本
 * @returns {number[]} delta 编码的语义令牌数组
 */
function extractSemanticTokens(ast, userFuncNames, sourceText) {
    const tokens = [];

    function offsetToPos(absOffset) {
        let line = 0;
        let col = 0;
        for (let i = 0; i < absOffset && i < sourceText.length; i++) {
            if (sourceText[i] === '\n') {
                line++;
                col = 0;
            } else {
                col++;
            }
        }
        return { line, col };
    }

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
                const pos = offsetToPos(firstEffective.start);
                tokens.push(pos.line, pos.col, firstEffective.end - firstEffective.start);
            }
            // define 表达式内部不递归（定义形式不是调用）
            if (firstEffective && firstEffective.type === 'Identifier' &&
                firstEffective.value === 'define') {
                return;
            }
            for (const child of children) {
                walk(child);
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

function createSemanticTokensProvider(schemeCache, defs) {
    return {
        provideDocumentSemanticTokens(document) {
            const { ast } = schemeCache.get(document);
            const userDefs = defs.getDefinitions(document, 'sde');
            const userFuncNames = new Set();
            for (const d of userDefs) {
                if (d.kind === 'function' || d.params) {
                    userFuncNames.add(d.name);
                }
            }
            const data = extractSemanticTokens(ast, userFuncNames, document.getText());
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
