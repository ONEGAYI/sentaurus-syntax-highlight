// src/lsp/semantic-dispatcher.js
'use strict';

/**
 * 从文档文本预计算每行的起始字符偏移量。
 * lineStarts[line-1] 即第 line 行（1-based）的首字符在全文中的偏移。
 * @param {string} text
 * @returns {number[]}
 */
function computeLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

/**
 * 将绝对字符偏移转换为行内列位置（0-based）。
 * @param {number} absOffset - 文档绝对偏移
 * @param {number} line - 行号（1-based）
 * @param {number[]} lineStarts - 预计算的行首偏移表
 * @returns {number}
 */
function toCol(absOffset, line, lineStarts) {
    const idx = line - 1;
    return idx >= 0 && idx < lineStarts.length ? absOffset - lineStarts[idx] : absOffset;
}

/**
 * 获取 List 节点中跳过 Comment 后的有效子节点。
 * Scheme 代码中 `( ; comment\n  func args)` 的 children[0] 是 Comment，
 * 而实际函数名在 children[1]。此辅助函数统一过滤 Comment 节点。
 * @param {object} listNode - List 类型的 AST 节点
 * @returns {object[]} 过滤 Comment 后的子节点数组
 */
function effectiveChildren(listNode) {
    return listNode.children.filter(c => c.type !== 'Comment');
}

/**
 * 在 AST 中查找包含光标位置的最内层函数调用。
 * 函数调用 = List 节点且有效子节点（跳过 Comment）的首个是 Identifier。
 * @param {object} ast - Parser 产出的 AST 根节点
 * @param {number} line - 光标所在行（1-based）
 * @param {number} column - 光标所在列（0-based, 行内偏移）
 * @param {number[]} lineStarts - 预计算的行首偏移表
 * @returns {object|null} 函数调用 List 节点，或 null
 */
function findEnclosingCall(ast, line, column, lineStarts) {
    let best = null;

    function walk(node) {
        if (node.type === 'List') {
            const ec = effectiveChildren(node);
            const inRange = line >= node.line && line <= node.endLine;
            // 单行表达式：使用行内列位置比较（而非绝对偏移）
            const nodeCol = toCol(node.start, node.line, lineStarts);
            const nodeEndCol = toCol(node.end, node.endLine, lineStarts);
            const inColumn = node.line !== node.endLine || column >= nodeCol && column <= nodeEndCol;
            if (inRange && inColumn && ec.length >= 1 && ec[0].type === 'Identifier') {
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
    const ec = effectiveChildren(callNode);

    const getModeFromChild = (childIdx) => {
        const argNode = ec[childIdx];
        if (!argNode) return null;
        let modeValue = null;
        if (argNode.type === 'String') modeValue = argNode.value;
        else if (argNode.type === 'Identifier') modeValue = argNode.value;
        return (modeValue && modes[modeValue]) ? modeValue : null;
    };

    // Try primary argIndex first
    const primary = getModeFromChild(argIndex + 1);
    if (primary) return primary;

    // Fallback: scan all argument children for a valid mode name.
    // Handles cases where the mode is not at the expected position
    // (e.g., MaxTransDiff/MaxGradient have dopant-name before the mode).
    for (let i = 1; i < ec.length; i++) {
        if (i === argIndex + 1) continue;
        const result = getModeFromChild(i);
        if (result) return result;
    }
    return null;
}

/**
 * 推断光标在函数调用中的参数位置。
 * 参数索引从 0 开始（不含函数名自身）。
 * @param {object} callNode - 函数调用 List 节点
 * @param {number} line - 光标行（1-based）
 * @param {number} column - 光标列（0-based, 行内偏移）
 * @param {number[]} lineStarts - 预计算的行首偏移表
 * @returns {number} 参数索引（0-based），-1 表示不在任何参数上
 */
function resolveActiveParam(callNode, line, column, lineStarts) {
    let activeParam = -1;
    const isMultiLine = callNode.line !== callNode.endLine;
    const ec = effectiveChildren(callNode);

    for (let i = 1; i < ec.length; i++) {
        const arg = ec[i];
        const argStartLine = arg.line;
        const argEndLine = arg.endLine;

        if (line < argStartLine) break;
        // 跨行调用中，光标在参数行但列在参数 start 之前（缩进空白处），视为该参数
        if (line === argStartLine && column < toCol(arg.start, argStartLine, lineStarts)) {
            if (isMultiLine) {
                activeParam = i - 1;
            }
            break;
        }
        if (line > argEndLine) { activeParam = i - 1; continue; }
        if (line === argEndLine && column > toCol(arg.end, argEndLine, lineStarts)) { activeParam = i - 1; continue; }
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
 * @param {number} column - 光标列（0-based, 行内偏移）
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 的映射表
 * @param {number[]} [lineStarts] - 预计算的行首偏移表（可选，为兼容旧调用）
 * @returns {object|null} { functionName, mode, modeData, activeParam, callNode } 或 null
 */
function dispatch(ast, line, column, modeDispatchTable, lineStarts) {
    if (!lineStarts) lineStarts = [0];
    const callNode = findEnclosingCall(ast, line, column, lineStarts);
    if (!callNode) return null;

    const functionName = effectiveChildren(callNode)[0].value;
    const dispatchMeta = modeDispatchTable[functionName];
    if (!dispatchMeta) {
        return {
            functionName,
            mode: null,
            modeData: null,
            activeParam: resolveActiveParam(callNode, line, column, lineStarts),
            callNode,
        };
    }

    const mode = resolveMode(callNode, dispatchMeta);
    const modeData = mode ? dispatchMeta.modes[mode] : null;
    const activeParam = resolveActiveParam(callNode, line, column, lineStarts);

    return {
        functionName,
        mode,
        modeData,
        activeParam,
        callNode,
    };
}

module.exports = { dispatch };
