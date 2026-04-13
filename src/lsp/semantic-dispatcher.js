// src/lsp/semantic-dispatcher.js
'use strict';

/**
 * 在 AST 中查找包含光标位置的最内层函数调用。
 * 函数调用 = List 节点且 children[0] 是 Identifier。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {number} line - 光标所在行（1-based）
 * @param {number} column - 光标所在列（0-based, 字符偏移）
 * @returns {object|null} 函数调用 List 节点，或 null
 */
function findEnclosingCall(ast, line, column) {
    let best = null;

    function walk(node) {
        if (node.type === 'List') {
            const inRange = line >= node.line && line <= node.endLine;
            // 同行时检查列范围（仅单行表达式）
            const inColumn = node.line !== node.endLine || column >= node.start && column <= node.end;
            if (inRange && inColumn && node.children.length >= 1 && node.children[0].type === 'Identifier') {
                // 内层调用覆盖外层
                if (!best || (node.line >= best.line && node.endLine <= best.endLine)) {
                    best = node;
                }
            }
            for (const child of node.children) {
                walk(child);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression);
        } else if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        }
    }

    walk(ast);
    return best;
}

/**
 * 根据函数调用节点和 modeDispatch 元数据，确定当前激活的模式。
 * @param {object} callNode - 函数调用 List 节点
 * @param {object} modeDispatch - modeDispatch 元数据
 * @returns {string|null} 模式名，或 null（无法确定）
 */
function resolveMode(callNode, modeDispatch) {
    const { argIndex, modes } = modeDispatch;
    const argNode = callNode.children[argIndex + 1];
    if (!argNode) return null;

    let modeValue = null;
    if (argNode.type === 'String') {
        modeValue = argNode.value;
    } else if (argNode.type === 'Identifier') {
        modeValue = argNode.value;
    }

    if (modeValue && modes[modeValue]) return modeValue;
    return null;
}

/**
 * 推断光标在函数调用中的参数位置。
 * 参数索引从 0 开始（不含函数名自身）。
 * @param {object} callNode - 函数调用 List 节点
 * @param {number} line - 光标行（1-based）
 * @param {number} column - 光标列（0-based）
 * @returns {number} 参数索引（0-based），-1 表示不在任何参数上
 */
function resolveActiveParam(callNode, line, column) {
    let activeParam = -1;
    const isMultiLine = callNode.line !== callNode.endLine;

    for (let i = 1; i < callNode.children.length; i++) {
        const arg = callNode.children[i];
        const argStartLine = arg.line;
        const argEndLine = arg.endLine;

        if (line < argStartLine) break;
        // 跨行调用中，光标在参数行但列在参数 start 之前（缩进空白处），视为该参数
        if (line === argStartLine && column < arg.start) {
            if (isMultiLine) {
                activeParam = i - 1;
            }
            break;
        }
        if (line > argEndLine) { activeParam = i - 1; continue; }
        if (line === argEndLine && column > arg.end) { activeParam = i - 1; continue; }
        activeParam = i - 1;
    }

    // 光标在函数调用括号内（含尚无参数的情况），视为第 0 个参数
    if (activeParam === -1) {
        activeParam = 0;
    }

    return activeParam;
}

/**
 * 对给定文档位置执行模式分派分析。
 * @param {object} ast - Parser 产出的 AST
 * @param {number} line - 光标行（1-based）
 * @param {number} column - 光标列（0-based）
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 的映射表
 * @returns {object|null} { functionName, mode, modeData, activeParam, callNode } 或 null
 */
function dispatch(ast, line, column, modeDispatchTable) {
    const callNode = findEnclosingCall(ast, line, column);
    if (!callNode) return null;

    const functionName = callNode.children[0].value;
    const dispatchMeta = modeDispatchTable[functionName];
    if (!dispatchMeta) {
        return {
            functionName,
            mode: null,
            modeData: null,
            activeParam: resolveActiveParam(callNode, line, column),
            callNode,
        };
    }

    const mode = resolveMode(callNode, dispatchMeta);
    const modeData = mode ? dispatchMeta.modes[mode] : null;
    const activeParam = resolveActiveParam(callNode, line, column);

    return {
        functionName,
        mode,
        modeData,
        activeParam,
        callNode,
    };
}

module.exports = { findEnclosingCall, resolveMode, resolveActiveParam, dispatch };
