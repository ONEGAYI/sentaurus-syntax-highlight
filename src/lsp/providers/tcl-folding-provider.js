// src/lsp/providers/tcl-folding-provider.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');
const ppUtils = require('../pp-utils');

/**
 * 创建 VSCode FoldingRangeProvider for Tcl-based Sentaurus languages.
 * 使用 TclParseCache 管理解析缓存，Provider 不再自行调用 parseSafe / tree.delete。
 * @param {import('../parse-cache').TclParseCache} tclCache
 * @returns {object}
 */
function createTclFoldingProvider(tclCache) {
    return {
        /**
         * @param {vscode.TextDocument} document
         * @returns {vscode.FoldingRange[]}
         */
        provideFoldingRanges(document) {
            const entry = tclCache.get(document);
            if (!entry) return [];

            const ranges = astUtils.getFoldingRanges(entry.tree.rootNode);

            // 追加预处理器块折叠范围
            const { foldingRanges: ppRanges } = ppUtils.buildPpBlocks(entry.text);
            for (const r of ppRanges) {
                ranges.push(r);
            }

            return ranges.map(r => new vscode.FoldingRange(r.startLine, r.endLine));
        },
    };
}

module.exports = { createTclFoldingProvider };
