/**
 * 判断当前变更是否应触发 Unit 自动配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string[] | null | undefined} scopes - '<' 前一位置的 TextMate scopes
 * @returns {boolean}
 */
function shouldTrigger(change, scopes) {
    if (!change || change.text !== '<') return false;
    if (!scopes || scopes.length === 0) return false;
    return scopes.some(s => s === 'constant.numeric' || s.startsWith('constant.numeric.'));
}

module.exports = { shouldTrigger };
