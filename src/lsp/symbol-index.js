// src/lsp/symbol-index.js
'use strict';

/**
 * 从 AST 节点解析符号名称字符串。
 * - String 节点 → 直接返回 value
 * - List 节点且首元素为 string-append → 尝试静态拼接全字面量子节点
 * - 其他 → 返回 null（动态名称，无法静态推断）
 * @param {object} node - AST 节点
 * @returns {string|null}
 */
function resolveSymbolName(node) {
    if (!node) return null;

    if (node.type === 'String') {
        return node.value;
    }

    if (node.type === 'List') {
        const children = node.children;
        if (children.length >= 1 &&
            children[0].type === 'Identifier' &&
            children[0].value === 'string-append') {
            const parts = [];
            for (let i = 1; i < children.length; i++) {
                if (children[i].type === 'String') {
                    parts.push(children[i].value);
                } else {
                    return null; // 包含非字面量
                }
            }
            return parts.join('');
        }
    }

    return null;
}

/**
 * 从 AST 提取符号定义和引用。
 * @param {object} ast - scheme-parser 生成的 AST (Program 节点)
 * @param {string} sourceText - 源文本
 * @param {object} symbolParamsTable - 函数名 → symbolParams 的映射表
 * @param {object} [modeDispatchTable] - 可选，处理带模式分派的函数
 * @returns {{ defs: SymbolEntry[], refs: SymbolEntry[] }}
 */
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable) {
    // 占位实现，Task 2 完善
    return { defs: [], refs: [] };
}

module.exports = { extractSymbols, resolveSymbolName };
