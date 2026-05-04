'use strict';

/**
 * 分析预处理器指令块，返回分支映射和折叠范围。
 * @param {string} text - 文档原始文本
 * @returns {{ branchMap: Map<number, number>, foldingRanges: Array<{startLine: number, endLine: number}> }}
 * branchMap: 行号(1-based) → 分支 ID
 * foldingRanges: 0-based 行号范围的折叠范围
 */
function buildPpBlocks(text) {
    const branchMap = new Map();
    const foldingRanges = [];
    const lines = text.split('\n');
    const stack = []; // { branchId, startLine(0-based) }
    let nextId = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        if (/^#(if|ifdef|ifndef)\b/.test(line)) {
            const id = nextId++;
            stack.push({ branchId: id, startLine: i });
        } else if (/^#elif\b/.test(line)) {
            if (stack.length > 0) {
                const id = nextId++;
                stack[stack.length - 1].branchId = id;
            }
        } else if (/^#else\b/.test(line)) {
            if (stack.length > 0) {
                const id = nextId++;
                stack[stack.length - 1].branchId = id;
            }
        } else if (/^#endif\b/.test(line)) {
            if (stack.length > 0) {
                const entry = stack.pop();
                if (entry.startLine < i) {
                    foldingRanges.push({ startLine: entry.startLine, endLine: i });
                }
            }
        }

        if (stack.length > 0) {
            branchMap.set(lineNum, stack[stack.length - 1].branchId);
        }
    }

    return { branchMap, foldingRanges };
}

module.exports = { buildPpBlocks };
