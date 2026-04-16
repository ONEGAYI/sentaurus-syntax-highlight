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

/**
 * 判断当前删除变更是否应触发 Unit 空括号删除配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * 触发条件：用户在 Numeric<|> 位置按退格删除 <，
 * 此函数检测删除后的文档状态来推断场景：
 * - change.text === '' && rangeLength === 1 → 单字符删除
 * - charAfter === '>' → 光标后紧跟 >（空括号）
 * - linePrefix 匹配 constant.numeric → < 前是数字
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string | null | undefined} linePrefix - 删除位置到行首的文本
 * @param {string | null | undefined} charAfter - 删除位置后的第一个字符
 * @returns {boolean}
 */
function shouldDelete(change, linePrefix, charAfter) {
    if (!change || change.text !== '' || change.rangeLength !== 1) return false;
    if (charAfter !== '>') return false;
    if (!linePrefix) return false;
    return /\b(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(linePrefix);
}

module.exports = { shouldTrigger, shouldDelete };
