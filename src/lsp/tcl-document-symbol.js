// src/lsp/tcl-document-symbol.js
'use strict';

const symbolConfigs = require('./tcl-symbol-configs');
const {
    _findChildByType,
    _findChildrenByType,
    _getCommandWords,
    _extractArgName,
    _extractForeachVarNames,
} = require('./tcl-ast-utils');

const SymbolKind = {
    Namespace: 3,
    Field: 8,
    Function: 12,
    Variable: 13,
};

/**
 * 从 AST 中提取文档符号（面包屑导航 + Outline 视图）。
 *
 * @param {object} root - tree-sitter 根节点（program / source_file）
 * @param {string} langId - 语言 ID（sdevice / sprocess / emw / inspect）
 * @returns {Array<{name: string, kind: number, startLine: number, endLine: number, children: Array}>}
 *   startLine / endLine 为 0-indexed。
 */
function getDocumentSymbols(root, langId) {
    if (!root) return [];
    const symbols = [];
    _collectSymbols(root, langId, symbols);
    return symbols;
}

/**
 * 递归收集文档符号。
 * @param {object} node - 当前 AST 节点
 * @param {string} langId - 语言 ID
 * @param {Array} out - 输出数组
 */
function _collectSymbols(node, langId, out) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _symbolSet(child, out);
                break;

            case 'procedure':
                _symbolProcedure(child, langId, out);
                break;

            case 'foreach':
                _symbolForeach(child, langId, out);
                break;

            case 'while':
                _symbolWhile(child, langId, out);
                break;

            case 'command':
                _symbolCommand(child, langId, out);
                break;

            case 'source_file':
            case 'program':
                _collectSymbols(child, langId, out);
                break;

            case 'word_list':
            case 'braced_word':
                _collectSymbolsInChildren(child, langId, out);
                break;

            default:
                break;
        }
    }
}

/**
 * 遍历子节点（跳过 `{` 和 `}` 字面节点）。
 */
function _collectSymbolsInChildren(node, langId, out) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;
        if (child.type === '{' || child.type === '}') continue;
        // 递归处理，让 _collectSymbols 的 switch 分支处理
        _collectSymbols({ type: 'program', children: [child], childCount: 1, child(n) { return [child][n]; } }, langId, out);
    }
}

/**
 * set → Variable symbol。
 * 跳过 env() 变量。
 */
function _symbolSet(node, out) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;
    const name = idNode.text;
    if (name.startsWith('env(')) return;

    out.push({
        name,
        kind: SymbolKind.Variable,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    });
}

/**
 * procedure → Function symbol，递归 body 收集子 symbol。
 */
function _symbolProcedure(node, langId, out) {
    const simpleWords = _findChildrenByType(node, 'simple_word');
    let funcNameNode = null;
    for (const sw of simpleWords) {
        if (sw.text !== 'proc') {
            funcNameNode = sw;
            break;
        }
    }
    if (!funcNameNode) return;

    const symbol = {
        name: funcNameNode.text,
        kind: SymbolKind.Function,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    };

    // 收集参数为 Field symbol
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode) {
        const argNodes = _findChildrenByType(argsNode, 'argument');
        for (const arg of argNodes) {
            const name = _extractArgName(arg);
            if (name) {
                symbol.children.push({
                    name,
                    kind: SymbolKind.Field,
                    startLine: arg.startPosition.row,
                    endLine: arg.endPosition.row,
                    children: [],
                });
            }
        }
    }

    // 递归 body（braced_word）
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        const bodySymbols = [];
        _collectSymbols(bodyNode, langId, bodySymbols);
        symbol.children.push(...bodySymbols);
    }

    out.push(symbol);
}

/**
 * foreach → Namespace symbol，名称为 `foreach <varName>`，递归 body。
 */
function _symbolForeach(node, langId, out) {
    const varNames = _extractForeachVarNames(node).map(v => v.name);
    const displayName = varNames.length > 0 ? `foreach ${varNames.join(' ')}` : 'foreach';

    const symbol = {
        name: displayName,
        kind: SymbolKind.Namespace,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    };

    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectSymbols(bodyNode, langId, symbol.children);
    }

    out.push(symbol);
}

/**
 * while → Namespace symbol，名称 `while`，递归 body。
 */
function _symbolWhile(node, langId, out) {
    const symbol = {
        name: 'while',
        kind: SymbolKind.Namespace,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    };

    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectSymbols(bw, langId, symbol.children);
    }

    out.push(symbol);
}

/**
 * command → 根据 cmdName 决定处理方式：
 * - "for" → Namespace symbol，递归第 4 个 braced_word（body）
 * - section 关键词 → Namespace symbol，递归 braced_word
 * - 其他 → 递归 braced_word（不生成 symbol 本身）
 */
function _symbolCommand(node, langId, out) {
    if (node.childCount === 0) return;

    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        // 非简单命令，递归子节点
        _collectSymbolsInChildren(node, langId, out);
        return;
    }

    const cmdName = firstChild.text;

    if (cmdName === 'for') {
        _symbolFor(node, langId, out);
        return;
    }

    if (symbolConfigs.isSectionCommand(cmdName, langId)) {
        _symbolSection(node, cmdName, langId, out);
        return;
    }

    // 其他 command：不生成 symbol，但递归内部 braced_word
    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectSymbols(bw, langId, out);
    }
}

/**
 * for → Namespace symbol，名称 `for`，递归第 4 个 braced_word（body）。
 * for {init} {cond} {step} {body}
 */
function _symbolFor(node, langId, out) {
    const symbol = {
        name: 'for',
        kind: SymbolKind.Namespace,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    };

    const words = _getCommandWords(node);
    for (const w of words) {
        if (w.type === 'braced_word') {
            _collectSymbols(w, langId, symbol.children);
        }
    }

    out.push(symbol);
}

/**
 * section 块（Physics/Math/deposit 等）→ Namespace symbol，递归 braced_word。
 */
function _symbolSection(node, cmdName, langId, out) {
    const symbol = {
        name: cmdName,
        kind: SymbolKind.Namespace,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        children: [],
    };

    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectSymbols(bw, langId, symbol.children);
    }

    out.push(symbol);
}

module.exports = { getDocumentSymbols, SymbolKind };
