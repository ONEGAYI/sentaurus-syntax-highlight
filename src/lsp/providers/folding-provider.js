// src/lsp/providers/folding-provider.js
'use strict';

const vscode = require('vscode');

/**
 * Create a FoldingRangeProvider backed by the shared Scheme parse cache.
 * @param {import('../parse-cache').SchemeParseCache} schemeCache
 */
function createFoldingProvider(schemeCache) {
    return {
        provideFoldingRanges(document) {
            const { analysis, ppBlocks } = schemeCache.get(document);
            const ranges = analysis.foldingRanges.map(range => new vscode.FoldingRange(
                range.startLine,
                range.endLine
            ));
            for (const pr of ppBlocks.foldingRanges) {
                ranges.push(new vscode.FoldingRange(pr.startLine, pr.endLine));
            }
            return ranges;
        },
    };
}

module.exports = { createFoldingProvider };
