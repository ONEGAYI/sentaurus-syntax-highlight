/**
 * Scheme 回车缩进纯逻辑（无 VSCode API 依赖）。
 */

const CLOSE_PARENS_RE = /^(\s*)(\){1,})([\s;]*)$/;

/**
 * 统计文本中未闭合的 ( 数量。
 */
function countUnmatchedOpenParens(text) {
    let count = 0;
    for (const ch of text) {
        if (ch === '(') count++;
        if (ch === ')') count--;
    }
    return count;
}

/**
 * 检查最后一个未闭合的 ( 后是否只有空白（即空括号）。
 */
function isLastOpenParenEmpty(text) {
    let depth = 0;
    let lastOpenIndex = -1;
    for (let i = text.length - 1; i >= 0; i--) {
        if (text[i] === ')') depth++;
        if (text[i] === '(') {
            if (depth === 0) {
                lastOpenIndex = i;
                break;
            }
            depth--;
        }
    }
    if (lastOpenIndex === -1) return true;
    return /^\s*$/.test(text.substring(lastOpenIndex + 1));
}

/**
 * 在当前行（及可能的下一行）查找闭括号序列。
 * VSCode auto-indent 在空 ( 后可能创建缩进空行，闭括号被推到下一行。
 *
 * @param {string} currText - 当前行文本
 * @param {string|undefined} nextText - 下一行文本（若存在）
 * @returns {{ match: RegExpMatchArray|null, linesToReplace: number }}
 */
function findClosingParens(currText, nextText) {
    const match = currText.match(CLOSE_PARENS_RE);
    if (match) return { match, linesToReplace: 1 };

    if (/^\s*$/.test(currText) && nextText !== undefined) {
        const nextMatch = nextText.match(CLOSE_PARENS_RE);
        if (nextMatch) return { match: nextMatch, linesToReplace: 2 };
    }
    return { match: null, linesToReplace: 0 };
}

/**
 * 找到文本中所有未闭合的 ( 的列索引。
 * 返回数组按出现顺序排列，可用于精确对齐关闭括号。
 */
function findUnmatchedOpenParenColumns(text) {
    const columns = [];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') {
            columns.push(i);
        } else if (text[i] === ')') {
            if (columns.length > 0) {
                columns.pop();
            }
        }
    }
    return columns;
}

module.exports = { countUnmatchedOpenParens, isLastOpenParenEmpty, findClosingParens, findUnmatchedOpenParenColumns, CLOSE_PARENS_RE };
