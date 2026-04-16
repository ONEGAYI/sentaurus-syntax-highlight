/**
 * 判断当前变更是否应触发 Unit 自动配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * 使用与 TextMate constant.numeric 相同的正则模式：
 *   \b(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\b
 * 确保前面是独立的数值常量而非变量名的一部分（如 Var1）。
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string | null | undefined} linePrefix - '<' 前面到行首的文本
 * @returns {boolean}
 */
function shouldTrigger(change, linePrefix) {
    if (!change || change.text !== '<') return false;
    if (!linePrefix) return false;
    // 与 sprocess.tmLanguage.json 中 constant.numeric 的正则一致
    return /\b(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(linePrefix);
}

module.exports = { shouldTrigger };
