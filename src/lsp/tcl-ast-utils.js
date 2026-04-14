// src/lsp/tcl-ast-utils.js
'use strict';

const tclParserWasm = require('./tcl-parser-wasm');

/** 支持的 Tcl 语言 ID */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);

/**
 * 检查语言 ID 是否为 Tcl 方言。
 * @param {string} langId
 * @returns {boolean}
 */
function isTclLanguage(langId) {
    return TCL_LANGS.has(langId);
}

/**
 * 安全解析 Tcl 文本，返回 tree（调用方负责 tree.delete()）。
 * 解析器未初始化时返回 null。
 * @param {string} text
 * @returns {object|null} tree-sitter Tree 对象
 */
function parseSafe(text) {
    if (!tclParserWasm.isReady()) return null;
    return tclParserWasm.parse(text);
}

/**
 * 深度优先遍历 AST 节点。
 * @param {object} node - tree-sitter 节点
 * @param {function(object): void} callback
 */
function walkNodes(node, callback) {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
        walkNodes(node.child(i), callback);
    }
}

/**
 * 查找所有指定类型的节点。
 * @param {object} root - 根节点
 * @param {string} type - 节点类型名
 * @returns {object[]}
 */
function findNodesByType(root, type) {
    const result = [];
    walkNodes(root, node => {
        if (node.type === type) result.push(node);
    });
    return result;
}

/**
 * 从 AST 中提取代码折叠范围。
 * 遍历所有 `braced_word` 节点，将其 { } 范围映射为 FoldingRange。
 * 忽略单行 braced_word（无折叠意义）。
 *
 * @param {object} root - tree-sitter 根节点
 * @returns {Array<{startLine: number, endLine: number}>}
 */
function getFoldingRanges(root) {
    const ranges = [];
    const bracedWords = findNodesByType(root, 'braced_word');

    for (const node of bracedWords) {
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        // 只折叠跨行的块
        if (endLine > startLine) {
            ranges.push({ startLine, endLine });
        }
    }

    return ranges;
}

/**
 * 检查文本中花括号 `{}` 的平衡性。
 * 使用文本级分析而非 AST ERROR 节点，避免 sdevice 特有语法
 * （坐标元组 `(0.0 0.5 0.0)` 等）被误报为括号错误。
 *
 * @param {string} text - 源代码文本
 * @returns {Array<{startLine: number, startCol: number, endLine: number, endCol: number, message: string}>}
 */
function findMismatchedBraces(text) {
    const errors = [];
    const braceStack = []; // { line, col, char }
    const lines = text.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let inString = false;
        let inComment = false;

        for (let col = 0; col < line.length; col++) {
            const ch = line[col];

            // 跳过注释
            if (!inString && ch === '#') { inComment = true; break; }
            if (inComment) break;

            // 跳过转义字符
            if (ch === '\\' && inString) { col++; continue; }

            // 字符串边界
            if (ch === '"') { inString = !inString; continue; }

            // 花括号匹配（字符串外）
            if (!inString) {
                if (ch === '{') {
                    braceStack.push({ line: lineIdx, col, char: '{' });
                } else if (ch === '}') {
                    if (braceStack.length === 0) {
                        // 多余的 }
                        errors.push({
                            startLine: lineIdx, startCol: col,
                            endLine: lineIdx, endCol: col + 1,
                            message: '多余的 `}`，没有匹配的 `{`',
                        });
                    } else {
                        braceStack.pop();
                    }
                }
            }
        }
    }

    // 未闭合的 {
    for (const unclosed of braceStack) {
        errors.push({
            startLine: unclosed.line, startCol: unclosed.col,
            endLine: unclosed.line, endCol: unclosed.col + 1,
            message: '未闭合的 `{`',
        });
    }

    return errors;
}

module.exports = {
    isTclLanguage,
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    findMismatchedBraces,
    TCL_LANGS,
};
