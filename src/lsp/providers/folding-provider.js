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
            const { analysis } = schemeCache.get(document);
            return analysis.foldingRanges.map(range => new vscode.FoldingRange(
                range.startLine,
                range.endLine
            ));
        },
    };
}

module.exports = { createFoldingProvider };
