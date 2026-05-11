// src/lsp/tcl-variable-extractor.js
'use strict';

const {
    walkNodes,
    _findChildByType,
    _findChildrenByType,
    _getCommandWords,
    _extractArgName,
    _extendNodeTextToLineEnd,
    _extractForeachVarNames,
    _extractBracedWordVars,
    _extractCommandVarDefs,
    _extractErrorVarDefs,
    _isSvisualVarDefCommand,
    _extractSvisualOutVars,
} = require('./tcl-ast-utils');

/**
 * 从 AST 中提取变量/函数/参数定义。
 * 支持 set、procedure、foreach、while 和 for（command 节点中首个 simple_word 为 "for"）。
 *
 * @param {object} root - tree-sitter 根节点（program）
 * @param {string} [sourceText] - 完整源码文本，用于扩展 definitionText 到行尾
 * @returns {Array<{name: string, line: number, endLine: number, definitionText: string, kind: string}>}
 *   line 和 endLine 为 1-indexed。
 */
function getVariables(root, sourceText) {
    const results = [];
    const lines = sourceText ? sourceText.split('\n') : null;
    // tree-sitter-tcl 对 set 值中的 [...] 命令替换支持不完整，
    // 含 [] 的 set 可能导致整个文档根节点变成 ERROR。
    if (root.type === 'ERROR') {
        _collectErrorVarsRecursive(root, results, lines);
        return results;
    }
    _collectVariables(root, results, sourceText, lines);
    return results;
}

/**
 * 递归收集 ERROR 节点及其嵌套 ERROR 中的变量定义。
 */
function _collectErrorVarsRecursive(node, results, lines) {
    const defs = _extractErrorVarDefs(node, true);
    for (const d of defs) {
        results.push({
            name: d.name,
            line: d.line,
            endLine: d.line,
            definitionText: lines
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
                : node.text,
            kind: 'variable',
        });
    }
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'ERROR') {
            _collectErrorVarsRecursive(child, results, lines);
        }
    }
}

/**
 * 收集 AST 中所有变量引用（variable_substitution 节点，即 $varName）。
 * tree-sitter-tcl 将 $var 解析为 variable_substitution 类型节点。
 * 返回字段：name(去除$前缀和数组索引)、line(1-based)、startCol/endCol(列号)
 * @param {object} root - AST 根节点
 * @returns {Array<{name: string, line: number, startCol: number, endCol: number}>}
 */
function getVariableRefs(root) {
    if (!root) return [];
    const refs = [];
    walkNodes(root, node => {
        if (node.type === 'variable_substitution') {
            const raw = node.text;
            let name = raw;
            // 处理 ${varName} 形式
            if (name.startsWith('${') && name.endsWith('}')) {
                name = name.slice(2, -1);
            } else if (name.startsWith('$')) {
                name = name.slice(1);
            }
            // 去除数组索引 $var(index) → var
            const parenIdx = name.indexOf('(');
            if (parenIdx > 0) {
                name = name.slice(0, parenIdx);
            }
            if (name) {
                refs.push({
                    name,
                    line: node.startPosition.row + 1,
                    startCol: node.startPosition.column,
                    endCol: node.endPosition.column,
                });
            }
        }
    });
    return refs;
}

/**
 * 递归收集变量定义。
 * @param {object} node - 当前 AST 节点
 * @param {Array} results - 收集结果的数组
 * @param {string} [sourceText] - 完整源码文本
 * @param {string[]} [lines] - 预分割的行数组
 */
function _collectVariables(node, results, sourceText, lines) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _handleSet(child, results, lines);
                break;

            case 'procedure':
                _handleProcedure(child, results, sourceText, lines);
                break;

            case 'foreach':
                _handleForeach(child, results, sourceText, lines);
                break;

            case 'while':
                // while 无变量绑定，但需要递归 body
                _handleWhile(child, results, sourceText, lines);
                break;

            case 'command':
                _handleCommand(child, results, sourceText, lines);
                break;

            default:
                // ERROR 节点中可能包含已知命令（set 含 []、lassign、variable 等）
                if (child.type === 'ERROR') {
                    const errorDefs = _extractErrorVarDefs(child);
                    if (errorDefs.length > 0) {
                        const defText = lines
                            ? _extendNodeTextToLineEnd(child.text, child.endPosition.row, lines)
                            : child.text;
                        for (const d of errorDefs) {
                            results.push({
                                name: d.name,
                                line: d.line,
                                endLine: d.line,
                                definitionText: defText,
                                kind: 'variable',
                            });
                        }
                    }
                }
                // 其他节点类型递归处理子节点（如 program → command、word_list 等）
                _collectVariables(child, results, sourceText, lines);
                break;
        }
    }
}

/**
 * 处理 set 节点，提取变量名。
 * set x 42 → set(关键字) + id(变量名) + 值
 * 跳过 env(...) 变量。
 */
function _handleSet(node, results, lines) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;

    const name = idNode.text;
    if (name.startsWith('env(')) return;

    const defText = lines
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
        : node.text;

    results.push({
        name,
        line: idNode.startPosition.row + 1,
        endLine: idNode.endPosition.row + 1,
        definitionText: defText,
        kind: 'variable',
    });
}

/**
 * 处理 procedure 节点，提取函数名和参数。
 * proc myFunc {a b} {body}
 * → procedure: proc + simple_word(名) + arguments(含 argument) + braced_word(body)
 */
function _handleProcedure(node, results, sourceText, lines) {
    // 提取函数名：第一个 simple_word（跳过 proc 关键字本身）
    const simpleWords = _findChildrenByType(node, 'simple_word');

    const defText = lines
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
        : node.text;

    if (simpleWords.length >= 1) {
        // 第一个 simple_word 可能是 "proc" 关键字，找非 "proc" 的
        let funcNameNode = null;
        for (const sw of simpleWords) {
            if (sw.text !== 'proc') {
                funcNameNode = sw;
                break;
            }
        }
        if (funcNameNode) {
            results.push({
                name: funcNameNode.text,
                line: funcNameNode.startPosition.row + 1,
                endLine: funcNameNode.endPosition.row + 1,
                definitionText: defText,
                kind: 'function',
            });
        }
    }

    // 提取参数
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode) {
        const argNodes = _findChildrenByType(argsNode, 'argument');
        for (const arg of argNodes) {
            const argName = _extractArgName(arg);
            if (argName) {
                results.push({
                    name: argName,
                    line: arg.startPosition.row + 1,
                    endLine: arg.endPosition.row + 1,
                    definitionText: defText,
                    kind: 'parameter',
                });
            }
        }
    }

    // 递归 body（braced_word）
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results, sourceText, lines);
    }
}

/**
 * 处理 foreach 节点，提取所有循环变量。
 * foreach item $list { body }
 * foreach {k v} $dict { body }
 * foreach v1 $list1 v2 $list2 { body }
 */
function _handleForeach(node, results, sourceText, lines) {
    const defText = lines
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
        : node.text;

    for (const v of _extractForeachVarNames(node)) {
        results.push({
            name: v.name,
            line: v.line,
            endLine: v.line,
            definitionText: defText,
            kind: 'variable',
        });
    }

    // 递归 body
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results, sourceText, lines);
    }
}

/**
 * 处理 while 节点，无变量绑定但递归 body。
 * while {cond} { body }
 */
function _handleWhile(node, results, sourceText, lines) {
    const words = _getCommandWords(node);
    // while {cond} {body} — 递归所有 braced_word 提取变量
    for (const w of words) {
        if (w.type === 'braced_word') {
            _collectVariables(w, results, sourceText, lines);
        }
    }
}

/**
 * 处理普通 command 节点。
 * 检查第一个 simple_word 是否为特殊命令（如 "for"），若是则特殊处理。
 */
function _handleCommand(node, results, sourceText, lines) {
    if (node.childCount === 0) return;

    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        // 非简单命令，递归所有子节点
        _collectVariables(node, results, sourceText, lines);
        return;
    }

    const cmdName = firstChild.text;

    if (cmdName === 'for') {
        _handleFor(node, results, sourceText, lines);
    } else if (cmdName === 'lassign' || cmdName === 'lmap') {
        const words = _getCommandWords(node);
        const defText = lines
            ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
            : node.text;
        for (const d of _extractCommandVarDefs(node, cmdName, words)) {
            results.push({
                name: d.name,
                line: d.line,
                endLine: d.line,
                definitionText: defText,
                kind: 'variable',
            });
        }
        // braced_word 在 word_list 内，必须用 _getCommandWords 穿透
        for (const w of words) {
            if (w.type === 'braced_word') {
                _collectVariables(w, results, sourceText, lines);
            }
        }
    } else if (cmdName === 'dict') {
        const words = _getCommandWords(node);
        if (words[1] && words[1].text === 'for') {
            const defText = lines
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
                : node.text;
            for (const d of _extractCommandVarDefs(node, 'dict', words)) {
                results.push({
                    name: d.name,
                    line: d.line,
                    endLine: d.line,
                    definitionText: defText,
                    kind: 'variable',
                });
            }
        }
        for (const w of words) {
            if (w.type === 'braced_word') {
                _collectVariables(w, results, sourceText, lines);
            }
        }
    } else if (cmdName === 'incr') {
        const words = _getCommandWords(node);
        if (words.length >= 2) {
            const varNode = words[1];
            if (varNode.type === 'simple_word' || varNode.type === 'id') {
                const defText = lines
                    ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
                    : node.text;
                results.push({
                    name: varNode.text,
                    line: varNode.startPosition.row + 1,
                    endLine: varNode.endPosition.row + 1,
                    definitionText: defText,
                    kind: 'variable',
                });
            }
        }
    } else if (_isSvisualVarDefCommand(cmdName)) {
        const words = _getCommandWords(node);
        const defText = lines
            ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, lines)
            : node.text;
        for (const d of _extractSvisualOutVars(words, cmdName)) {
            results.push({
                name: d.name,
                line: d.line,
                endLine: d.line,
                definitionText: defText,
                kind: 'variable',
            });
        }
        _collectVariables(node, results, sourceText, lines);
    } else {
        // 其他 command，递归子节点（可能包含嵌套结构）
        _collectVariables(node, results, sourceText, lines);
    }
}

/**
 * 处理 for 循环。
 * for {init} {cond} {step} {body}
 * → command: simple_word("for") + braced_word(init) + braced_word(cond) + braced_word(step) + braced_word(body)
 */
function _handleFor(node, results, sourceText, lines) {
    // braced_word 在 word_list 内部，必须用 _getCommandWords 穿透
    // for {init} {cond} {step} {body} — 递归所有 braced_word 提取变量
    const words = _getCommandWords(node);
    for (const w of words) {
        if (w.type === 'braced_word') {
            _collectVariables(w, results, sourceText, lines);
        }
    }
}

module.exports = { getVariables, getVariableRefs };
