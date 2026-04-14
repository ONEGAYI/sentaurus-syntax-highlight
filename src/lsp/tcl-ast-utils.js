// src/lsp/tcl-ast-utils.js
'use strict';

const tclParserWasm = require('./tcl-parser-wasm');

/** 支持的 Tcl 语言 ID */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);

/**
 * 检查语言 ID 是否为 Tcl 方言。
 * @param {string} langId
 * @returns {boolean}
 */
function isTclLanguage(langId) {
    return TCL_LANGS.has(langId);
}

/**
 * 安全解析 Tcl 文本，返回 tree（调用方负责 tree.delete()）。
 * 解析器未初始化时返回 null。
 * @param {string} text
 * @returns {object|null} tree-sitter Tree 对象
 */
function parseSafe(text) {
    if (!tclParserWasm.isReady()) return null;
    return tclParserWasm.parse(text);
}

/**
 * 深度优先遍历 AST 节点。
 * @param {object} node - tree-sitter 节点
 * @param {function(object): void} callback
 */
function walkNodes(node, callback) {
    callback(node);
    for (let i = 0; i < node.childCount; i++) {
        walkNodes(node.child(i), callback);
    }
}

/**
 * 查找所有指定类型的节点。
 * @param {object} root - 根节点
 * @param {string} type - 节点类型名
 * @returns {object[]}
 */
function findNodesByType(root, type) {
    const result = [];
    walkNodes(root, node => {
        if (node.type === type) result.push(node);
    });
    return result;
}

/**
 * 从 AST 中提取代码折叠范围。
 * 遍历所有 `braced_word` 节点，将其 { } 范围映射为 FoldingRange。
 * 忽略单行 braced_word（无折叠意义）。
 *
 * @param {object} root - tree-sitter 根节点
 * @returns {Array<{startLine: number, endLine: number}>}
 */
function getFoldingRanges(root) {
    const ranges = [];
    const bracedWords = findNodesByType(root, 'braced_word');

    for (const node of bracedWords) {
        const startLine = node.startPosition.row;
        const endLine = node.endPosition.row;
        // 只折叠跨行的块
        if (endLine > startLine) {
            ranges.push({ startLine, endLine });
        }
    }

    return ranges;
}

/**
 * 检查文本中花括号 `{}` 的平衡性。
 * 使用文本级分析而非 AST ERROR 节点，避免 sdevice 特有语法
 * （坐标元组 `(0.0 0.5 0.0)` 等）被误报为括号错误。
 *
 * @param {string} text - 源代码文本
 * @returns {Array<{startLine: number, startCol: number, endLine: number, endCol: number, message: string}>}
 */
function findMismatchedBraces(text) {
    const errors = [];
    const braceStack = []; // { line, col, char }
    const lines = text.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let inString = false;
        let inComment = false;

        for (let col = 0; col < line.length; col++) {
            const ch = line[col];

            // 跳过注释
            if (!inString && ch === '#') { inComment = true; break; }
            if (inComment) break;

            // 跳过转义字符
            if (ch === '\\' && inString) { col++; continue; }

            // 字符串边界
            if (ch === '"') { inString = !inString; continue; }

            // 花括号匹配（字符串外）
            if (!inString) {
                if (ch === '{') {
                    braceStack.push({ line: lineIdx, col, char: '{' });
                } else if (ch === '}') {
                    if (braceStack.length === 0) {
                        // 多余的 }
                        errors.push({
                            startLine: lineIdx, startCol: col,
                            endLine: lineIdx, endCol: col + 1,
                            message: '多余的 `}`，没有匹配的 `{`',
                        });
                    } else {
                        braceStack.pop();
                    }
                }
            }
        }
    }

    // 未闭合的 {
    for (const unclosed of braceStack) {
        errors.push({
            startLine: unclosed.line, startCol: unclosed.col,
            endLine: unclosed.line, endCol: unclosed.col + 1,
            message: '未闭合的 `{`',
        });
    }

    return errors;
}

/**
 * 从 AST 中提取变量/函数/参数定义。
 * 支持 set、procedure、foreach、while 和 for（command 节点中首个 simple_word 为 "for"）。
 *
 * @param {object} root - tree-sitter 根节点（program）
 * @returns {Array<{name: string, line: number, endLine: number, definitionText: string, kind: string}>}
 *   line 和 endLine 为 1-indexed。
 */
function getVariables(root) {
    const results = [];
    _collectVariables(root, results);
    return results;
}

/**
 * 递归收集变量定义。
 * @param {object} node - 当前 AST 节点
 * @param {Array} results - 收集结果的数组
 */
function _collectVariables(node, results) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _handleSet(child, results);
                break;

            case 'procedure':
                _handleProcedure(child, results);
                break;

            case 'foreach':
                _handleForeach(child, results);
                break;

            case 'while':
                // while 无变量绑定，但需要递归 body
                _handleWhile(child, results);
                break;

            case 'command':
                _handleCommand(child, results);
                break;

            default:
                // 其他节点类型递归处理子节点（如 program → command、word_list 等）
                _collectVariables(child, results);
                break;
        }
    }
}

/**
 * 处理 set 节点，提取变量名。
 * set x 42 → set(关键字) + id(变量名) + 值
 * 跳过 env(...) 变量。
 */
function _handleSet(node, results) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;

    const name = idNode.text;
    if (name.startsWith('env(')) return;

    results.push({
        name,
        line: idNode.startPosition.row + 1,
        endLine: idNode.endPosition.row + 1,
        definitionText: node.text,
        kind: 'variable',
    });
}

/**
 * 处理 procedure 节点，提取函数名和参数。
 * proc myFunc {a b} {body}
 * → procedure: proc + simple_word(名) + arguments(含 argument) + braced_word(body)
 */
function _handleProcedure(node, results) {
    // 提取函数名：第一个 simple_word（跳过 proc 关键字本身）
    const simpleWords = _findChildrenByType(node, 'simple_word');
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
                definitionText: node.text,
                kind: 'function',
            });
        }
    }

    // 提取参数
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode) {
        const argNodes = _findChildrenByType(argsNode, 'argument');
        for (const arg of argNodes) {
            // argument 节点的 text 通常是参数名
            const argName = arg.text;
            if (argName) {
                results.push({
                    name: argName,
                    line: arg.startPosition.row + 1,
                    endLine: arg.endPosition.row + 1,
                    definitionText: arg.text,
                    kind: 'parameter',
                });
            }
        }
    }

    // 递归 body（braced_word）
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results);
    }
}

/**
 * 处理 foreach 节点，提取循环变量。
 * foreach item $list { body }
 * → foreach + arguments(循环变量在第一个子节点) + braced_word(body)
 */
function _handleForeach(node, results) {
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode && argsNode.childCount > 0) {
        // 第一个子节点是循环变量
        const loopVar = argsNode.child(0);
        if (loopVar && loopVar.text) {
            results.push({
                name: loopVar.text,
                line: loopVar.startPosition.row + 1,
                endLine: loopVar.endPosition.row + 1,
                definitionText: node.text,
                kind: 'variable',
            });
        }
    }

    // 递归 body
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results);
    }
}

/**
 * 处理 while 节点，无变量绑定但递归 body。
 * while {cond} { body }
 */
function _handleWhile(node, results) {
    // while 可能有多个 braced_word（条件 + body）
    const bracedWords = _findChildrenByType(node, 'braced_word');
    // 最后一个 braced_word 是 body
    if (bracedWords.length > 0) {
        for (const bw of bracedWords) {
            _collectVariables(bw, results);
        }
    }
}

/**
 * 处理普通 command 节点。
 * 检查第一个 simple_word 是否为特殊命令（如 "for"），若是则特殊处理。
 */
function _handleCommand(node, results) {
    if (node.childCount === 0) return;

    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        // 非简单命令，递归所有子节点
        _collectVariables(node, results);
        return;
    }

    const cmdName = firstChild.text;

    if (cmdName === 'for') {
        _handleFor(node, results);
    } else {
        // 其他 command，递归子节点（可能包含嵌套结构）
        _collectVariables(node, results);
    }
}

/**
 * 处理 for 循环。
 * for {init} {cond} {step} {body}
 * → command: simple_word("for") + braced_word(init) + braced_word(cond) + braced_word(step) + braced_word(body)
 */
function _handleFor(node, results) {
    // 递归所有 braced_word 子节点（init 中可能有 set，body 中也可能有）
    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectVariables(bw, results);
    }
}

// ── 辅助函数 ──

/**
 * 查找第一个指定类型的直接子节点。
 */
function _findChildByType(node, type) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === type) return child;
    }
    return null;
}

/**
 * 查找所有指定类型的直接子节点。
 */
function _findChildrenByType(node, type) {
    const result = [];
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === type) result.push(child);
    }
    return result;
}

module.exports = {
    isTclLanguage,
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    findMismatchedBraces,
    getVariables,
    TCL_LANGS,
};
