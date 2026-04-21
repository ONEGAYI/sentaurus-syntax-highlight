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

    let condGroupCounter = 0;

    function walk(node, parentScope, branchCtx) {
        if (node.type === 'List') {
            const children = node.children;
            if (children.length >= 2 && children[0].type === 'Identifier') {
                if (children[0].value === 'define') {
                    // (define (func-name params...) body...)
                    if (children[1].type === 'List' && children[1].children.length >= 1) {
                        const funcName = children[1].children[0].value;
                        parentScope.definitions.push({ name: funcName, kind: 'variable', line: children[1].children[0].line, start: children[1].children[0].start, end: children[1].children[0].end, ...branchCtx });

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
                                funcScope.definitions.push({ name: param.value, kind: 'parameter', line: param.line, start: param.start, end: param.end, ...branchCtx });
                            }
                        }
                        parentScope.children.push(funcScope);
                        for (let i = 2; i < children.length; i++) {
                            walk(children[i], funcScope, branchCtx);
                        }
                        return;
                    }

                    // (define var val) — simple variable binding
                    if (children[1].type === 'Identifier') {
                        parentScope.definitions.push({ name: children[1].value, kind: 'variable', line: children[1].line, start: children[1].start, end: children[1].end, ...branchCtx });
                        // 遍历值表达式（如 lambda），使嵌套作用域被正确构建
                        for (let i = 2; i < children.length; i++) {
                            walk(children[i], parentScope, branchCtx);
                        }
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
                                letScope.definitions.push({ name: binding.children[0].value, kind: 'variable', line: binding.children[0].line, start: binding.children[0].start, end: binding.children[0].end, ...branchCtx });
                                // 遍历绑定值表达式（如 lambda），使参数进入作用域
                                for (let j = 1; j < binding.children.length; j++) {
                                    walk(binding.children[j], letScope, branchCtx);
                                }
                            }
                        }
                    }
                    parentScope.children.push(letScope);
                    for (let i = 2; i < children.length; i++) {
                        walk(children[i], letScope, branchCtx);
                    }
                    return;
                }

                // (lambda (params...) body...)
                if (children[0].value === 'lambda') {
                    const lambdaScope = {
                        type: 'lambda',
                        startLine: node.line,
                        endLine: node.endLine,
                        definitions: [],
                        children: [],
                    };
                    if (children[1] && children[1].type === 'List') {
                        for (const param of children[1].children) {
                            if (param.type === 'Identifier') {
                                lambdaScope.definitions.push({ name: param.value, kind: 'parameter', line: param.line, start: param.start, end: param.end, ...branchCtx });
                            }
                        }
                    }
                    parentScope.children.push(lambdaScope);
                    for (let i = 2; i < children.length; i++) {
                        walk(children[i], lambdaScope, branchCtx);
                    }
                    return;
                }
            }

            // 空列表（如 ()、(; comment)）没有子节点可处理
            if (children.length === 0) return;

            // (if test consequent [alternative])
            if (children[0].value === 'if' && children.length >= 3) {
                walk(children[1], parentScope, branchCtx); // test expression
                const groupId = condGroupCounter++;
                walk(children[2], parentScope, { condGroup: groupId, condBranch: 0 }); // consequent
                if (children.length >= 4) {
                    walk(children[3], parentScope, { condGroup: groupId, condBranch: 1 }); // alternative
                }
                for (let i = 4; i < children.length; i++) {
                    walk(children[i], parentScope, branchCtx);
                }
                return;
            }

            // (cond (test body...) ... [(else body...)])
            if (children[0].value === 'cond') {
                for (let i = 1; i < children.length; i++) {
                    if (children[i].type === 'List' && children[i].children.length >= 1) {
                        const clause = children[i];
                        walk(clause.children[0], parentScope, branchCtx); // test
                        const groupId = condGroupCounter++;
                        for (let j = 1; j < clause.children.length; j++) {
                            walk(clause.children[j], parentScope, { condGroup: groupId, condBranch: i - 1 });
                        }
                    }
                }
                return;
            }

            // (case expr ((datum...) body...) ... [(else body...)])
            if (children[0].value === 'case' && children.length >= 3) {
                walk(children[1], parentScope, branchCtx); // expression
                for (let i = 2; i < children.length; i++) {
                    if (children[i].type === 'List' && children[i].children.length >= 1) {
                        const clause = children[i];
                        walk(clause.children[0], parentScope, branchCtx); // datum list
                        const groupId = condGroupCounter++;
                        for (let j = 1; j < clause.children.length; j++) {
                            walk(clause.children[j], parentScope, { condGroup: groupId, condBranch: i - 2 });
                        }
                    }
                }
                return;
            }

            for (const child of children) {
                walk(child, parentScope, branchCtx);
            }
        } else if (node.type === 'Quote') {
            walk(node.expression, parentScope, branchCtx);
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
                if (line >= child.startLine && line <= child.endLine) {
                    findChain(child);
                    break; // 一行最多在一个同级作用域内，找到后不再检查兄弟
                }
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

/**
 * Scheme 特殊形式关键词 — 不作为变量引用
 */
const SCHEME_SPECIAL_FORMS = new Set([
    // 特殊形式（语法关键字）
    'define', 'lambda', 'if', 'cond', 'else', 'case', 'and', 'or',
    'let', 'let*', 'letrec', 'letrec*', 'let-values', 'let*-values',
    'set!', 'begin', 'do', 'delay', 'quote', 'quasiquote', 'unquote',
    'unquote-splicing', 'define-syntax', 'syntax-rules', 'when', 'unless',
    'not', 'map', 'for-each', 'apply',
    // 标准运算符和过程（scheme_function_docs.json 未收录的基础操作）
    '+', '-', '*', '/', '=', '<', '>', '<=', '>=',
    'cons', 'car', 'cdr', 'list', 'null?', 'pair?', 'list?', 'length',
    'append', 'reverse', 'cadr', 'caddr', 'cadddr', 'cddr', 'caar', 'cdar',
    'number?', 'string?', 'symbol?', 'char?', 'vector?', 'boolean?', 'procedure?',
    'zero?', 'positive?', 'negative?', 'odd?', 'even?',
    'modulo', 'remainder', 'quotient', 'abs', 'max', 'min',
    'sqrt', 'expt', 'exp', 'log', 'sin', 'cos', 'tan', 'atan', 'asin', 'acos',
    'floor', 'ceiling', 'round', 'truncate',
    'string-append', 'string-length', 'string-ref', 'substring',
    'string->number', 'number->string', 'string->symbol', 'symbol->string',
    'string->list', 'list->string',
    'char->integer', 'integer->char',
    'display', 'newline', 'write', 'read', 'print',
    'equal?', 'eqv?', 'eq?', 'values', 'call-with-values', 'dynamic-wind',
    'eval', 'error', 'void',
]);

/**
 * 收集 AST 中所有标识符引用（排除已知函数/特殊形式/字面量）。
 * @param {object} ast - scheme-parser 解析的 AST (Program 节点)
 * @param {Set<string>} [knownNames] - 额外的已知名称集合（SDE 内置函数等）
 * @returns {Array<{name: string, line: number, start: number, end: number}>}
 */
function getSchemeRefs(ast, knownNames) {
    const refs = [];
    // 无额外名称时直接复用常量 Set，避免 60+ 元素的复制
    let excluded = SCHEME_SPECIAL_FORMS;
    if (knownNames) {
        excluded = new Set(SCHEME_SPECIAL_FORMS);
        for (const name of knownNames) {
            excluded.add(name);
        }
    }
    _collectRefs(ast, refs, excluded);
    return refs;
}

function _collectRefs(node, refs, excluded) {
    if (!node) return;

    // 跳过字符串、数字、布尔、注释
    if (node.type === 'String' || node.type === 'Number' ||
        node.type === 'Boolean' || node.type === 'Comment') return;

    if (node.type === 'Identifier') {
        const name = node.value;
        // 跳过 # 开头的标识符（预处理指令 #if/#else/#endif/#define 等、字符字面量 #\a 等）
        if (name && name.startsWith('#')) return;
        // 跳过 SWB 参数替换变量（如 @param@、@previous@、@param:+2@）
        if (name && /^@[a-zA-Z_][a-zA-Z0-9_.:+-]*@$/.test(name)) return;
        if (name && !excluded.has(name)) {
            refs.push({
                name,
                line: node.line,
                start: node.start,
                end: node.end,
            });
        }
        return;
    }

    if (node.type === 'List') {
        const children = node.children || [];
        // (quote ...) 列表形式 — 跳过全部内容（等同于 '(...) Quote 节点）
        if (children.length >= 2 && children[0].type === 'Identifier' &&
            children[0].value === 'quote') {
            return;
        }
        // 特殊处理：列表的第一个元素如果是特殊形式，其名称不作为引用
        // 但子节点仍需递归处理
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (i === 0 && child.type === 'Identifier' &&
                SCHEME_SPECIAL_FORMS.has(child.value)) {
                // 跳过特殊形式名称本身，不作为引用
                continue;
            }
            _collectRefs(child, refs, excluded);
        }
        return;
    }

    if (node.type === 'Quote') {
        // quote 内的内容不作为引用
        return;
    }

    // Program 和其他节点：递归子节点
    if (node.children) {
        for (const child of node.children) {
            _collectRefs(child, refs, excluded);
        }
    }
    if (node.body) {
        for (const child of node.body) {
            _collectRefs(child, refs, excluded);
        }
    }
    if (node.expression) {
        _collectRefs(node.expression, refs, excluded);
    }
}

module.exports = { buildScopeTree, getVisibleDefinitions, getSchemeRefs };
