'use strict';

const { parse } = require('../../src/lsp/scheme-parser');
const { analyze } = require('../../src/lsp/scheme-analyzer');
const scopeAnalyzer = require('../../src/lsp/scope-analyzer');
const { computeLineStarts } = require('../../src/lsp/parse-cache');

function parseScheme(code) {
    const text = typeof code === 'string' ? code : code.getText();
    const { ast, errors } = parse(text);
    const analysis = analyze(ast, text);
    const scopeTree = scopeAnalyzer.buildScopeTree(ast);
    const lineStarts = computeLineStarts(text);
    return { ast, errors, analysis, scopeTree, text, lineStarts };
}

module.exports = { parseScheme };
