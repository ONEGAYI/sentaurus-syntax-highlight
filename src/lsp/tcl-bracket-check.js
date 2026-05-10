// src/lsp/tcl-bracket-check.js
'use strict';

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
    const braceStack = [];
    const len = text.length;
    let lineIdx = 0;
    let col = 0;
    let inString = false;
    let lineIsStarComment = false;
    let foundFirstNonSpace = false;

    for (let i = 0; i < len; i++) {
        const ch = text[i];

        // 换行符：重置行状态
        if (ch === '\n') {
            lineIdx++;
            col = 0;
            inString = false;
            lineIsStarComment = false;
            foundFirstNonSpace = false;
            continue;
        }

        // 检测 * 注释行（行首第一个非空白字符为 *）
        if (!foundFirstNonSpace) {
            if (ch === ' ' || ch === '\t') {
                col++;
                continue;
            }
            foundFirstNonSpace = true;
            if (ch === '*') {
                lineIsStarComment = true;
                col++;
                continue;
            }
        }

        // 跳过 * 注释行的剩余内容
        if (lineIsStarComment) {
            col++;
            continue;
        }

        // # 注释：跳过本行剩余内容
        if (!inString && ch === '#') {
            const nlPos = text.indexOf('\n', i);
            if (nlPos < 0) break;
            i = nlPos - 1;
            continue;
        }

        // 跳过转义字符（仅在字符串内）
        if (ch === '\\' && inString) {
            i++;
            col += 2;
            continue;
        }

        // 字符串边界
        if (ch === '"') {
            inString = !inString;
            col++;
            continue;
        }

        // 花括号匹配（字符串外）
        if (!inString) {
            if (ch === '{') {
                braceStack.push({ line: lineIdx, col, char: '{' });
            } else if (ch === '}') {
                if (braceStack.length === 0) {
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

        col++;
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

module.exports = { findMismatchedBraces };
