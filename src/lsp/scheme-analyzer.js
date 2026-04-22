// src/lsp/scheme-analyzer.js
'use strict';

/**
 * 将节点文本扩展到该节点末尾所在行的行尾。
 * 用于将行末注释包含在 definitionText 中。
 * @param {string} nodeText AST 节点的原始文本
 * @param {number} endOffset 节点在源码中的结束偏移量（0-indexed）
 * @param {string} sourceText 完整源码文本
 * @returns {string} 扩展后的文本
 */
function _extendToLineEnd(nodeText, endOffset, sourceText) {
    let i = endOffset;
    while (i < sourceText.length && sourceText[i] !== '\n') i++;
    const tail = sourceText.slice(endOffset, i).trimStart();
    return tail ? nodeText + tail : nodeText;
}

/**
 * Walk AST and extract definitions + folding ranges.
 * @param {object} ast Parser-produced AST root node (Program)
 * @param {string} [sourceText] 完整源码文本，传入时 definitionText 会扩展到行尾
 * @returns {{ definitions: object[], foldingRanges: object[] }}
 */
function analyze(ast, sourceText) {
    const definitions = [];
    const foldingRanges = [];

    function walk(node) {
        if (node.type === 'List') {
            extractDefinitionsFromList(node, definitions, sourceText);
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

function extractDefinitionsFromList(listNode, definitions, sourceText) {
    const children = listNode.children;
    const defText = sourceText
        ? _extendToLineEnd(listNode.text, listNode.end, sourceText)
        : listNode.text;
    if (children.length === 0) return;

    const first = children[0];
    if (first.type !== 'Identifier') return;

    // (define name ...)
    if (first.value === 'define' && children.length >= 2) {
        if (children[1].type === 'Identifier') {
            const def = {
                name: children[1].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: defText,
                kind: 'variable',
            };
            // 检测值是否为 lambda 表达式，提取参数列表
            if (children.length >= 3 && children[2].type === 'List') {
                const valueFirst = children[2].children[0];
                if (valueFirst && valueFirst.type === 'Identifier' && valueFirst.value === 'lambda') {
                    const lambdaParams = children[2].children[1];
                    if (lambdaParams && lambdaParams.type === 'List') {
                        def.params = lambdaParams.children
                            .filter(p => p.type === 'Identifier')
                            .map(p => p.value);
                    }
                }
            }
            definitions.push(def);
        } else if (children[1].type === 'List' && children[1].children.length >= 1) {
            definitions.push({
                name: children[1].children[0].value,
                line: listNode.line,
                endLine: listNode.endLine,
                definitionText: defText,
                kind: 'function',
            });
            definitions[definitions.length - 1].params = children[1].children.slice(1)
                .filter(p => p.type === 'Identifier')
                .map(p => p.value);
            // 提取函数参数
            for (let i = 1; i < children[1].children.length; i++) {
                const param = children[1].children[i];
                if (param.type === 'Identifier') {
                    definitions.push({
                        name: param.value,
                        line: listNode.line,
                        endLine: listNode.endLine,
                        definitionText: defText,
                        kind: 'parameter',
                    });
                }
            }
        }
        return;
    }

    // (let/let*/letrec ((var val) ...) body...)
    if ((first.value === 'let' || first.value === 'let*' || first.value === 'letrec') && children.length >= 2) {
        if (children[1].type === 'List') {
            for (const binding of children[1].children) {
                if (binding.type === 'List' && binding.children.length >= 1 && binding.children[0].type === 'Identifier') {
                    definitions.push({
                        name: binding.children[0].value,
                        line: listNode.line,
                        endLine: listNode.endLine,
                        definitionText: defText,
                        kind: 'variable',
                    });
                }
            }
        }
        return;
    }

    // (lambda (params...) body...)
    if (first.value === 'lambda' && children.length >= 2 && children[1].type === 'List') {
        for (const param of children[1].children) {
            if (param.type === 'Identifier') {
                definitions.push({
                    name: param.value,
                    line: listNode.line,
                    endLine: listNode.endLine,
                    definitionText: defText,
                    kind: 'parameter',
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
