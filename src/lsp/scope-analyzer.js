// src/lsp/scope-analyzer.js
'use strict';

const { parse } = require('./scheme-parser');

/**
 * 构建作用域树。
 * @param {object} ast - Parser 产出的 AST 根节点 (Program)
 * @returns {ScopeNode} 作用域树根节点
 */
function buildScopeTree(ast) {
    const root = {
        type: 'global',
        startLine: 0,
        endLine: Infinity,
        definitions: [],
        children: [],
    };

    function walk(node, parentScope) {
        if (node.type === 'List') {
            const children = node.children;
            if (children.length >= 2 && children[0].type === 'Identifier') {
                if (children[0].value === 'define') {
                    // (define (func-name params...) body...)
                    if (children[1].type === 'List' && children[1].children.length >= 1) {
                        const funcName = children[1].children[0].value;
                        parentScope.definitions.push({ name: funcName, kind: 'variable' });

                        const funcScope = {
                            type: 'function',
                            startLine: node.line,
                            endLine: node.endLine,
                            definitions: [],
                            children: [],
                        };
                        for (let i = 1; i < children[1].children.length; i++) {
                            const param = children[1].children[i];
                            if (param.type === 'Identifier') {
                                funcScope.definitions.push({ name: param.value, kind: 'parameter' });
                            }
                        }
                        parentScope.children.push(funcScope);
                        for (let i = 2; i < children.length; i++) {
                            walk(children[i], funcScope);
                        }
                        return;
                    }

                    // (define var val) — simple variable binding
                    if (children[1].type === 'Identifier') {
                        parentScope.definitions.push({ name: children[1].value, kind: 'variable' });
                        return;
                    }
                }

                // (let/let*/letrec ((var val) ...) body...)
                if (children[0].value === 'let' || children[0].value === 'let*' || children[0].value === 'letrec') {
                    const letScope = {
                        type: 'let',
                        startLine: node.line,
                        endLine: node.endLine,
                        definitions: [],
                        children: [],
                    };
                    if (children[1] && children[1].type === 'List') {
                        for (const binding of children[1].children) {
                            if (binding.type === 'List' && binding.children.length >= 1 && binding.children[0].type === 'Identifier') {
                                letScope.definitions.push({ name: binding.children[0].value, kind: 'variable' });
                            }
                        }
                    }
                    parentScope.children.push(letScope);
                    for (let i = 2; i < children.length; i++) {
                        walk(children[i], letScope);
                    }
                    return;
                }
            }
            for (const child of children) {
                walk(child, parentScope);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression, parentScope);
        }
    }

    if (ast.type === 'Program') {
        for (const child of ast.body) {
            walk(child, root);
        }
    }

    return root;
}

/**
 * 获取指定行号处可见的所有定义。
 * @param {ScopeNode} tree - 作用域树根节点
 * @param {number} line - 目标行号
 * @returns {Array<{name: string, kind: string, scopeType: string}>}
 */
function getVisibleDefinitions(tree, line) {
    const chain = [];

    function findChain(node) {
        if (line >= node.startLine && line <= node.endLine) {
            chain.push(node);
            for (const child of node.children) {
                findChain(child);
            }
        }
    }

    findChain(tree);

    const seen = new Map();
    for (let i = chain.length - 1; i >= 0; i--) {
        const scope = chain[i];
        for (const def of scope.definitions) {
            if (!seen.has(def.name)) {
                seen.set(def.name, { ...def, scopeType: scope.type });
            }
        }
    }

    return Array.from(seen.values());
}

module.exports = { buildScopeTree, getVisibleDefinitions };
