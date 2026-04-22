// src/lsp/symbol-index.js
'use strict';

/**
 * 从 AST 节点解析符号名称字符串。
 * - String 节点 → 直接返回 value
 * - List 节点且首元素为 string-append → 尝试静态拼接全字面量子节点
 * - 其他 → 返回 null（动态名称，无法静态推断）
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
 * 从函数调用的参数中提取符号条目，按 role 分发到 defs/refs。
 * @param {Array} ec - effectiveChildren 结果
 * @param {string} funcName - 函数名
 * @param {Array} params - { index, type, role } 参数描述
 * @param {Array} defs - 定义收集数组
 * @param {Array} refs - 引用收集数组
 * @param {number} offset - 参数索引偏移（普通函数=1, modeDispatch=argIndex+2）
 */
function collectEntries(ec, funcName, params, defs, refs, offset) {
    for (const param of params) {
        const argIndex = param.index + offset;
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
                (param.role === 'def' ? defs : refs).push(entry);
            }
        }
    }
}

/**
 * 扫描 lambda 体内的 SDE 函数调用，找出直接传递 lambda 参数的符号参数位。
 */
function scanLambdaBody(bodyNodes, paramNames, symbolParamsTable) {
    const mapping = [];
    function scan(node) {
        if (node.type === 'List') {
            const ec = effectiveChildren(node);
            if (ec.length >= 1 && ec[0].type === 'Identifier') {
                const fn = ec[0].value;
                const config = symbolParamsTable[fn];
                if (config && config.symbolParams) {
                    for (const sp of config.symbolParams) {
                        const argIdx = sp.index + 1;
                        if (argIdx < ec.length && ec[argIdx].type === 'Identifier') {
                            const pIdx = paramNames.indexOf(ec[argIdx].value);
                            if (pIdx !== -1) {
                                mapping.push({ index: pIdx, role: sp.role, type: sp.type });
                            }
                        }
                    }
                }
            }
            for (const child of node.children) scan(child);
        } else if (node.type === 'Quote') {
            scan(node.expression);
        }
    }
    for (const n of bodyNodes) scan(n);
    return mapping;
}

/**
 * 从 AST 提取符号定义和引用。
 * 支持内置 SDE 函数（通过 symbolParamsTable 配置）和用户自定义函数（自动分析 lambda 体）。
 * @param {object} ast - scheme-parser 生成的 AST (Program 节点)
 * @param {string} sourceText - 源文本
 * @param {object} symbolParamsTable - 函数名 → { symbolParams: [...] } 的映射表
 * @param {object} [modeDispatchTable] - 可选，处理带模式分派的函数
 * @returns {{ defs: SymbolEntry[], refs: SymbolEntry[] }}
 */
function extractSymbols(ast, sourceText, symbolParamsTable, modeDispatchTable) {
    const defs = [];
    const refs = [];
    const userFuncParams = {};

    function tryRegisterUserFunc(ec) {
        if (ec[0].value !== 'define' || ec.length < 3) return;

        // 形式 1: (define name (lambda (params...) body...))
        if (ec[1].type === 'Identifier') {
            const lambdaNode = ec[2];
            if (lambdaNode.type !== 'List') return;
            const lec = effectiveChildren(lambdaNode);
            if (lec.length < 3 ||
                lec[0].type !== 'Identifier' || lec[0].value !== 'lambda' ||
                lec[1].type !== 'List') return;
            const paramNames = effectiveChildren(lec[1])
                .filter(c => c.type === 'Identifier')
                .map(c => c.value);
            const mapping = scanLambdaBody(lec.slice(2), paramNames, symbolParamsTable);
            if (mapping.length > 0) {
                userFuncParams[ec[1].value] = mapping;
            }
            return;
        }

        // 形式 2: (define (func-name params...) body...)
        if (ec[1].type === 'List') {
            const sigEc = effectiveChildren(ec[1]);
            if (sigEc.length < 2 || sigEc[0].type !== 'Identifier') return;
            const funcName = sigEc[0].value;
            const paramNames = sigEc.slice(1)
                .filter(c => c.type === 'Identifier')
                .map(c => c.value);
            if (paramNames.length === 0) return;
            const mapping = scanLambdaBody(ec.slice(2), paramNames, symbolParamsTable);
            if (mapping.length > 0) {
                userFuncParams[funcName] = mapping;
            }
        }
    }

    function walk(node) {
        if (node.type === 'List') {
            const ec = effectiveChildren(node);
            if (ec.length >= 1 && ec[0].type === 'Identifier') {
                const funcName = ec[0].value;

                tryRegisterUserFunc(ec);

                // 内置 SDE 函数
                const config = symbolParamsTable[funcName];
                if (config && config.symbolParams) {
                    const modeDispatchMeta = modeDispatchTable ? modeDispatchTable[funcName] : null;
                    if (modeDispatchMeta) {
                        // 解析模式关键词
                        const modeArgIdx = modeDispatchMeta.argIndex + 1;
                        const modeNode = ec[modeArgIdx];
                        let modeValue = null;
                        if (modeNode) {
                            if (modeNode.type === 'String') modeValue = modeNode.value;
                            else if (modeNode.type === 'Identifier') modeValue = modeNode.value;
                        }
                        const params = config.symbolParams.map(p => ({
                            ...p,
                            type: p.type === 'auto' ? (modeValue || p.type) : p.type,
                        }));
                        collectEntries(ec, funcName, params, defs, refs, modeDispatchMeta.argIndex + 2);
                    } else {
                        collectEntries(ec, funcName, config.symbolParams, defs, refs, 1);
                    }
                }

                // 用户自定义函数
                if (userFuncParams[funcName]) {
                    collectEntries(ec, funcName, userFuncParams[funcName], defs, refs, 1);
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
