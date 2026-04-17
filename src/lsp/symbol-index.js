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
 * 过滤 Comment 节点后的有效子节点。
 * parseList 已过滤 Comment，但保留此函数作为安全防护。
 */
function effectiveChildren(listNode) {
    return listNode.children.filter(c => c.type !== 'Comment');
}

/**
 * 从 AST 提取符号定义和引用。
 * @param {object} ast - scheme-parser 生成的 AST (Program 节点)
 * @param {string} sourceText - 源文本
 * @param {object} symbolParamsTable - 函数名 → { symbolParams: [...] } 的映射表
 * @param {object} [modeDispatchTable] - 可选，处理带模式分派的函数
 * @returns {{ defs: SymbolEntry[], refs: SymbolEntry[] }}
 */
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable) {
    const defs = [];
    const refs = [];

    function walk(node) {
        if (node.type === 'List') {
            const ec = effectiveChildren(node);
            if (ec.length >= 1 && ec[0].type === 'Identifier') {
                const funcName = ec[0].value;
                const config = symbolParamsTable[funcName];
                if (config && config.symbolParams) {
                    const modeDispatchMeta = modeDispatchTable ? modeDispatchTable[funcName] : null;

                    // modeDispatch 分支：需要解析模式关键词以支持 type: auto
                    if (modeDispatchMeta) {
                        // 解析模式关键词（argIndex+1 跳过函数名）
                        const modeArgIdx = modeDispatchMeta.argIndex + 1;
                        const modeNode = ec[modeArgIdx];
                        let modeValue = null;
                        if (modeNode) {
                            if (modeNode.type === 'String') modeValue = modeNode.value;
                            else if (modeNode.type === 'Identifier') modeValue = modeNode.value;
                        }

                        for (const param of config.symbolParams) {
                            // +1 跳过函数名，+1 跳过模式关键词
                            const argIndex = modeDispatchMeta.argIndex + 1 + 1 + param.index;
                            if (argIndex < ec.length) {
                                const argNode = ec[argIndex];
                                const name = resolveSymbolName(argNode);
                                if (name !== null) {
                                    // type: auto → 使用模式名作为实际类型
                                    let actualType = param.type;
                                    if (actualType === 'auto') {
                                        actualType = modeValue || param.type;
                                    }
                                    const entry = {
                                        name,
                                        type: actualType,
                                        role: param.role,
                                        line: argNode.line,
                                        start: argNode.start,
                                        end: argNode.end,
                                        functionName: funcName,
                                    };
                                    if (param.role === 'def') {
                                        defs.push(entry);
                                    } else {
                                        refs.push(entry);
                                    }
                                }
                            }
                        }
                    } else {
                        // 普通函数：+1 跳过函数名
                        for (const param of config.symbolParams) {
                            const argIndex = param.index + 1;
                            if (argIndex < ec.length) {
                                const argNode = ec[argIndex];
                                const name = resolveSymbolName(argNode);
                                if (name !== null) {
                                    const entry = {
                                        name,
                                        type: param.type,
                                        role: param.role,
                                        line: argNode.line,
                                        start: argNode.start,
                                        end: argNode.end,
                                        functionName: funcName,
                                    };
                                    if (param.role === 'def') {
                                        defs.push(entry);
                                    } else {
                                        refs.push(entry);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const child of node.children) walk(child);
        } else if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        } else if (node.type === 'Quote') {
            walk(node.expression);
        }
    }

    walk(ast);
    return { defs, refs };
}

module.exports = { extractSymbols, resolveSymbolName, effectiveChildren };
