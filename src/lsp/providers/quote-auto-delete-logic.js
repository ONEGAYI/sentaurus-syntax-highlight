/**
 * 判断当前删除变更是否应触发空引号对删除配对。
 * 纯函数，无外部依赖，可直接单元测试。
 *
 * 触发条件：
 * 1. 单字符删除（退格）：change.text === '' && rangeLength === 1
 * 2. 光标后紧跟同类型引号：charAfter === '"' 或 "'"
 * 3. 删除位置前为边界：linePrefix 为空或尾字符为分隔符
 * 4. 剩余引号后为边界：charAfterNext 为空或为分隔符
 *
 * 边界 = 行首/行尾、空白符、或非引号的非单词字符
 */

/**
 * 检查字符是否为引号对边界。
 * 空字符串表示行首/行尾，视为边界。
 * 引号字符不算边界（防止连续引号误匹配，如 """" 中的内部引号对）。
 *
 * @param {string} ch - 待检查的单个字符，空字符串表示行首/行尾
 * @returns {boolean}
 */
function isBoundary(ch) {
    return ch === '' || (!/\w/.test(ch) && !/['"`]/.test(ch));
}

/**
 * 判断当前删除变更是否应触发空引号对删除配对。
 *
 * 场景：用户在 "|' 或 '|' 中按退格删除开引号，
 * 检测删除后光标后是否紧跟配对引号且前后均为边界字符。
 *
 * @param {{ text: string, rangeLength: number } | null | undefined} change
 * @param {string | null | undefined} linePrefix - 删除位置到行首的文本（删除后）
 * @param {string | null | undefined} charAfter - 删除位置后的第一个字符
 * @param {string | null | undefined} charAfterNext - 删除位置后的第二个字符（剩余引号之后）
 * @returns {boolean}
 */
function shouldDelete(change, linePrefix, charAfter, charAfterNext) {
    if (!change || change.text !== '' || change.rangeLength !== 1) return false;
    if (charAfter !== '"' && charAfter !== "'") return false;
    if (linePrefix == null) return false;

    // 边界检查：删除位置前（linePrefix 尾字符或行首）
    const charBefore = linePrefix.length > 0
        ? linePrefix.charAt(linePrefix.length - 1)
        : '';
    if (!isBoundary(charBefore)) return false;

    // 边界检查：剩余引号后
    const nextCh = charAfterNext != null ? charAfterNext : '';
    if (!isBoundary(nextCh)) return false;

    return true;
}

module.exports = { shouldDelete, isBoundary };
