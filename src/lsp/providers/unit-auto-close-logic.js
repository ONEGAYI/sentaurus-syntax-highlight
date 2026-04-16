/**
 * 判断当前变更是否应触发 Unit 自动配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string | null | undefined} prevChar - '<' 前一个字符
 * @returns {boolean}
 */
function shouldTrigger(change, prevChar) {
    if (!change || change.text !== '<') return false;
    return /[0-9]/.test(prevChar || '');
}

module.exports = { shouldTrigger };
