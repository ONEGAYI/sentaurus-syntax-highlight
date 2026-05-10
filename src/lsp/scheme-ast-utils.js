'use strict';

/**
 * 过滤 Comment 节点后的有效子节点。
 * Scheme AST 中 `( ; comment\n  func args)` 的 children[0] 可能是 Comment，
 * 此函数统一过滤，确保后续处理仅操作有意义的节点。
 *
 * @param {object} listNode - List 类型的 AST 节点
 * @returns {object[]} 过滤 Comment 后的子节点数组
 */
function effectiveChildren(listNode) {
    return listNode.children.filter(c => c.type !== 'Comment');
}

module.exports = { effectiveChildren };
