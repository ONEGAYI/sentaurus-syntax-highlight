// src/lsp/scheme-analyzer.js
'use strict';

/**
 * Walk AST and extract definitions + folding ranges.
 * @param {object} ast Parser-produced AST root node (Program)
 * @returns {{ definitions: object[], foldingRanges: object[] }}
 */
function analyze(ast) {
    const definitions = [];
    const foldingRanges = [];

    function walk(node) {
        if (node.type === 'List') {
            extractDefinitionsFromList(node, definitions);
            extractFoldingRange(node, foldingRanges);
            for (const child of node.children) walk(child);
        } else if (node.type === 'Quote') {
            walk(node.expression);
        }
        if (node.type === 'Program') {
            for (const child of node.body) walk(child);
        }
    }

    walk(ast);
    return { definitions, foldingRanges };
}

function extractDefinitionsFromList(listNode, definitions) {
    const children = listNode.children;
    if (children.length === 0) return;

    const first = children[0];
    if (first.type !== 'Identifier') return;

    // (define name ...)
    if (first.value === 'define' && children.length >= 2) {
        if (children[1].type === 'Identifier') {
            definitions.push({
                name: children[1].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: listNode.text,
            });
        } else if (children[1].type === 'List' && children[1].children.length >= 1) {
            definitions.push({
                name: children[1].children[0].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: listNode.text,
            });
        }
        return;
    }

    // (let/let*/letrec ((var1 val1) (var2 val2) ...) ...)
    if ((first.value === 'let' || first.value === 'let*' || first.value === 'letrec')
        && children.length >= 2 && children[1].type === 'List') {
        const bindList = children[1];
        for (const binding of bindList.children) {
            if (binding.type === 'List' && binding.children.length >= 1) {
                definitions.push({
                    name: binding.children[0].value,
                    line: listNode.line,
                    endLine: listNode.endLine,
                    definitionText: listNode.text,
                });
            }
        }
    }
}

function extractFoldingRange(node, ranges) {
    if (node.endLine > node.line) {
        ranges.push({
            startLine: node.line - 1,
            endLine: node.endLine - 1,
        });
    }
}

module.exports = { analyze };
