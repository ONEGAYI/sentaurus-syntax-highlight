// src/lsp/tcl-ast-utils.js
'use strict';

const tclParserWasm = require('./tcl-parser-wasm');
const symbolConfigs = require('./tcl-symbol-configs');

/** 支持的 Tcl 语言 ID */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect', 'svisual']);

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

        // 跳过 * 注释行（Sentaurus Tcl 方言约定：行首 * 为注释）
        const trimmed = line.trimStart();
        if (trimmed.length > 0 && trimmed[0] === '*') continue;

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
 * @param {string} [sourceText] - 完整源码文本，用于扩展 definitionText 到行尾
 * @returns {Array<{name: string, line: number, endLine: number, definitionText: string, kind: string}>}
 *   line 和 endLine 为 1-indexed。
 */
function getVariables(root, sourceText) {
    const results = [];
    _collectVariables(root, results, sourceText);
    return results;
}

/**
 * 收集 AST 中所有变量引用（variable_substitution 节点，即 $varName）。
 * tree-sitter-tcl 将 $var 解析为 variable_substitution 类型节点。
 * 返回字段：name(去除$前缀和数组索引)、line(1-based)、startCol/endCol(列号)
 * @param {object} root - AST 根节点
 * @returns {Array<{name: string, line: number, startCol: number, endCol: number}>}
 */
function getVariableRefs(root) {
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
 * ScopeIndex — 按需查询的作用域索引。
 * 用单遍 AST 遍历预构建数据结构，查询时按需计算可见变量集，
 * 替代 buildScopeMap 的 O(p×n×m) 全量预计算。
 */
class ScopeIndex {
    /**
     * @param {Array<{name: string, defLine: number, isProc: boolean}>} globalDefs
     * @param {Array<{name: string, startLine: number, endLine: number, params: string[], localDefs: Array<{name: string, defLine: number}>, scopeImports: string[]}>} procScopes
     */
    constructor(globalDefs, procScopes) {
        this._globalDefs = globalDefs;
        this._globalProcNames = new Map();
        for (const def of globalDefs) {
            if (def.isProc) {
                this._globalProcNames.set(def.name, def.defLine);
            }
        }
        this._procScopes = procScopes.slice().sort((a, b) => a.startLine - b.startLine);
    }

    /**
     * 查询指定行号（1-based）的可见变量集。
     * @param {number} line - 1-based 行号
     * @returns {Set<string>} 可见变量名集合
     */
    getVisibleAt(line) {
        const visible = new Set();

        // 1. 添加 defLine <= line 的全局变量
        for (const def of this._globalDefs) {
            if (def.defLine <= line) {
                visible.add(def.name);
            }
        }

        // 2. 检查是否在 proc body 内
        for (const proc of this._procScopes) {
            if (line < proc.startLine || line > proc.endLine) continue;

            // 在 proc 内：移除非 proc 名的全局变量
            for (const def of this._globalDefs) {
                if (!def.isProc) {
                    visible.delete(def.name);
                }
            }

            // 添加 proc 参数
            for (const p of proc.params) {
                visible.add(p);
            }

            // 添加 body 内的局部定义（defLine <= line）
            for (const local of proc.localDefs) {
                if (local.defLine <= line) {
                    visible.add(local.name);
                }
            }

            // 添加 scope imports（global/upvar/variable）
            for (const imp of proc.scopeImports) {
                visible.add(imp);
            }

            break; // 最多在一个 proc 内
        }

        return visible;
    }
}

/**
 * 单遍 AST 遍历，构建 ScopeIndex。
 * @param {object} root - AST 根节点
 * @returns {ScopeIndex}
 */
function buildScopeIndex(root) {
    const globalDefs = [];
    const procScopes = [];

    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    globalDefs.push({
                        name,
                        defLine: idNode.startPosition.row + 1,
                        isProc: false,
                    });
                }
            }
        }

        if (child.type === 'procedure') {
            // 收集 proc 名作为全局定义
            const simpleWords = _findChildrenByType(child, 'simple_word');
            let procName = null;
            for (const sw of simpleWords) {
                if (sw.text !== 'proc') {
                    procName = sw.text;
                    const defLine = sw.startPosition.row + 1;
                    globalDefs.push({ name: procName, defLine, isProc: true });
                    break;
                }
            }

            // 构建 proc scope
            const bodyNode = _findChildByType(child, 'braced_word');
            if (bodyNode) {
                const bodyStart = bodyNode.startPosition.row + 1;
                const bodyEnd = bodyNode.endPosition.row + 1;

                const params = [];
                const argsNode = _findChildByType(child, 'arguments');
                if (argsNode) {
                    const argNodes = _findChildrenByType(argsNode, 'argument');
                    for (const arg of argNodes) {
                        if (arg.text) params.push(arg.text);
                    }
                }

                const localDefs = [];
                _collectLocalDefsForIndex(bodyNode, localDefs, bodyStart, bodyEnd);

                const scopeImports = [];
                _collectScopeImportsForIndex(bodyNode, scopeImports);

                procScopes.push({
                    name: procName || '',
                    startLine: bodyStart,
                    endLine: bodyEnd,
                    params,
                    localDefs,
                    scopeImports,
                });
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                if (cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(') && !/^\d/.test(name)) {
                                globalDefs.push({
                                    name,
                                    defLine: arg.startPosition.row + 1,
                                    isProc: false,
                                });
                                break;
                            }
                        }
                    }
                }
                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, globalDefs.map(d => ({ name: d.name, defLine: d.defLine })), 1, _countMaxLine(root) + 1);
                        }
                    }
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    globalDefs.push({
                        name: loopVar.text,
                        defLine: loopVar.startPosition.row + 1,
                        isProc: false,
                    });
                }
            }
        }
    }

    return new ScopeIndex(globalDefs, procScopes);
}

/**
 * 收集节点内的局部变量定义，推入 defs 数组。
 * 与 _collectLocalDefs 逻辑相同，但推入数组而非操作 scopeMap。
 * @param {object} node - AST 节点
 * @param {Array<{name: string, defLine: number}>} defs - 输出数组
 * @param {number} scopeStart - 作用域起始行（1-based，用于过滤）
 * @param {number} scopeEnd - 作用域结束行（1-based）
 */
function _collectLocalDefsForIndex(node, defs, scopeStart, scopeEnd) {
    if (!node) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    const defLine = idNode.startPosition.row + 1;
                    defs.push({ name, defLine });
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    const defLine = loopVar.startPosition.row + 1;
                    defs.push({ name: loopVar.text, defLine });
                }
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;

                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, defs, scopeStart, scopeEnd);
                        }
                    }
                } else if (cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(')) {
                                const defLine = arg.startPosition.row + 1;
                                defs.push({ name, defLine });
                                break;
                            }
                        }
                    }
                }
            }
            _collectLocalDefsForIndex(child, defs, scopeStart, scopeEnd);
        }

        if (child.type === 'braced_word') {
            _collectLocalDefsForIndex(child, defs, scopeStart, scopeEnd);
        }
    }
}

/**
 * 收集节点内的 scope imports（global/upvar/variable 声明的变量名）。
 * 与 _processScopeImports 逻辑相同，但只收集变量名到数组。
 * @param {object} node - AST 节点
 * @param {string[]} imports - 输出数组
 */
function _collectScopeImportsForIndex(node, imports) {
    if (!node) return;

    walkNodes(node, n => {
        // tree-sitter-tcl 将 'global' 解析为特殊节点类型（不是 command）
        if (n.type === 'global') {
            for (let i = 0; i < n.childCount; i++) {
                const child = n.child(i);
                if (child && child.type === 'simple_word') {
                    imports.push(child.text);
                }
            }
            return;
        }

        if (n.type !== 'command') return;
        const firstChild = n.child(0);
        if (!firstChild || firstChild.type !== 'simple_word') return;

        const cmdName = firstChild.text;

        if (cmdName === 'global') {
            for (let i = 1; i < n.childCount; i++) {
                const arg = n.child(i);
                if (arg && arg.type === 'simple_word') {
                    imports.push(arg.text);
                }
            }
        }

        if (cmdName === 'upvar') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                imports.push(words[words.length - 1].text);
            }
        }

        if (cmdName === 'variable') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                imports.push(words[1].text);
            }
        }
    });
}

/**
 * 构建行号 → 可见变量集的作用域映射。
 * @param {object} root - AST 根节点
 * @returns {Map<number, Set<string>>} 行号(1-based) → 可见变量名集合
 */
function buildScopeMap(root) {
    const index = buildScopeIndex(root);
    const maxLine = _countMaxLine(root) + 1;
    const scopeMap = new Map();
    for (let i = 1; i <= maxLine; i++) {
        scopeMap.set(i, index.getVisibleAt(i));
    }
    return scopeMap;
}

function _countMaxLine(node) {
    let maxLine = 0;
    walkNodes(node, n => {
        const endRow = n.endPosition.row + 1;
        if (endRow > maxLine) maxLine = endRow;
    });
    return maxLine;
}

function _collectGlobalDefs(root, scopeMap, maxLine) {
    for (let i = 0; i < root.childCount; i++) {
        const child = root.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    const defLine = idNode.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, name, defLine, maxLine);
                }
            }
        }

        if (child.type === 'procedure') {
            const simpleWords = _findChildrenByType(child, 'simple_word');
            for (const sw of simpleWords) {
                if (sw.text !== 'proc') {
                    const defLine = sw.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, sw.text, defLine, maxLine);
                    break;
                }
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                if (cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(') && !/^\d/.test(name)) {
                                const defLine = arg.startPosition.row + 1;
                                _addToScopeFromLine(scopeMap, name, defLine, maxLine);
                                break;
                            }
                        }
                    }
                }
                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefs(w, scopeMap, 1, maxLine);
                        }
                    }
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    const defLine = loopVar.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, loopVar.text, defLine, maxLine);
                }
            }
        }
    }
}

function _addToScopeFromLine(scopeMap, name, fromLine, toLine) {
    for (let i = fromLine; i <= toLine; i++) {
        let set = scopeMap.get(i);
        if (!set) {
            set = new Set();
            scopeMap.set(i, set);
        }
        set.add(name);
    }
}

function _processProcScopes(root, scopeMap, maxLine) {
    const procedures = [];
    walkNodes(root, node => {
        if (node.type === 'procedure') procedures.push(node);
    });

    for (const proc of procedures) {
        const bodyNode = _findChildByType(proc, 'braced_word');
        if (!bodyNode) continue;

        const bodyStart = bodyNode.startPosition.row + 1;
        const bodyEnd = bodyNode.endPosition.row + 1;

        // 收集全局 proc 名（这些在 proc 内也应可见）
        const globalDefs = new Set();
        for (let i = 0; i < root.childCount; i++) {
            const child = root.child(i);
            if (child && child.type === 'procedure') {
                const simpleWords = _findChildrenByType(child, 'simple_word');
                for (const sw of simpleWords) {
                    if (sw.text !== 'proc') globalDefs.add(sw.text);
                }
            }
        }

        // 清空 proc body 内的全局变量（proc 有独立作用域）
        for (let i = bodyStart; i <= bodyEnd; i++) {
            const lineSet = scopeMap.get(i);
            if (lineSet) {
                const toDelete = [];
                for (const name of lineSet) {
                    if (!globalDefs.has(name)) toDelete.push(name);
                }
                for (const name of toDelete) lineSet.delete(name);
            }
        }

        // 添加 proc 参数
        const argsNode = _findChildByType(proc, 'arguments');
        if (argsNode) {
            const argNodes = _findChildrenByType(argsNode, 'argument');
            for (const arg of argNodes) {
                const name = arg.text;
                _addToScopeFromLine(scopeMap, name, bodyStart, bodyEnd);
            }
        }

        // 收集 body 内的局部定义
        _collectLocalDefs(bodyNode, scopeMap, bodyStart, bodyEnd);

        // 处理 global/upvar/variable 声明
        _processScopeImports(bodyNode, scopeMap, root, bodyStart, bodyEnd);
    }
}

function _collectLocalDefs(node, scopeMap, scopeStart, scopeEnd) {
    if (!node) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'set') {
            const idNode = _findChildByType(child, 'id');
            if (idNode) {
                const name = idNode.text;
                if (!name.startsWith('env(')) {
                    const defLine = idNode.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, name, defLine, scopeEnd);
                }
            }
        }

        if (child.type === 'foreach') {
            const argsNode = _findChildByType(child, 'arguments');
            if (argsNode && argsNode.childCount > 0) {
                const loopVar = argsNode.child(0);
                if (loopVar && loopVar.text) {
                    const defLine = loopVar.startPosition.row + 1;
                    _addToScopeFromLine(scopeMap, loopVar.text, defLine, scopeEnd);
                }
            }
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;

                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefs(w, scopeMap, scopeStart, scopeEnd);
                        }
                    }
                } else if (cmdName === 'lappend' || cmdName === 'append') {
                    const words = _getCommandWords(child);
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(')) {
                                const defLine = arg.startPosition.row + 1;
                                _addToScopeFromLine(scopeMap, name, defLine, scopeEnd);
                                break;
                            }
                        }
                    }
                }
            }
            _collectLocalDefs(child, scopeMap, scopeStart, scopeEnd);
        }

        if (child.type === 'braced_word') {
            _collectLocalDefs(child, scopeMap, scopeStart, scopeEnd);
        }
    }
}

function _processScopeImports(node, scopeMap, root, bodyStart, bodyEnd) {
    if (!node) return;

    walkNodes(node, n => {
        // tree-sitter-tcl 将 'global' 解析为特殊节点类型（不是 command）
        if (n.type === 'global') {
            for (let i = 0; i < n.childCount; i++) {
                const child = n.child(i);
                if (child && child.type === 'simple_word') {
                    _addToScopeFromLine(scopeMap, child.text, bodyStart, bodyEnd);
                }
            }
            return;
        }

        if (n.type !== 'command') return;
        const firstChild = n.child(0);
        if (!firstChild || firstChild.type !== 'simple_word') return;

        const cmdName = firstChild.text;

        if (cmdName === 'global') {
            for (let i = 1; i < n.childCount; i++) {
                const arg = n.child(i);
                if (arg && arg.type === 'simple_word') {
                    _addToScopeFromLine(scopeMap, arg.text, bodyStart, bodyEnd);
                }
            }
        }

        if (cmdName === 'upvar') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                const localName = words[words.length - 1].text;
                _addToScopeFromLine(scopeMap, localName, bodyStart, bodyEnd);
            }
        }

        if (cmdName === 'variable') {
            const words = _getCommandWords(n).filter(w => w.type === 'simple_word');
            if (words.length >= 2) {
                const varName = words[1].text;
                _addToScopeFromLine(scopeMap, varName, bodyStart, bodyEnd);
            }
        }
    });
}

/**
 * 递归收集变量定义。
 * @param {object} node - 当前 AST 节点
 * @param {Array} results - 收集结果的数组
 * @param {string} [sourceText] - 完整源码文本
 */
function _collectVariables(node, results, sourceText) {
    if (!node || !node.children) return;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        switch (child.type) {
            case 'set':
                _handleSet(child, results, sourceText);
                break;

            case 'procedure':
                _handleProcedure(child, results, sourceText);
                break;

            case 'foreach':
                _handleForeach(child, results, sourceText);
                break;

            case 'while':
                // while 无变量绑定，但需要递归 body
                _handleWhile(child, results, sourceText);
                break;

            case 'command':
                _handleCommand(child, results, sourceText);
                break;

            default:
                // 其他节点类型递归处理子节点（如 program → command、word_list 等）
                _collectVariables(child, results, sourceText);
                break;
        }
    }
}

/**
 * 处理 set 节点，提取变量名。
 * set x 42 → set(关键字) + id(变量名) + 值
 * 跳过 env(...) 变量。
 */
function _handleSet(node, results, sourceText) {
    const idNode = _findChildByType(node, 'id');
    if (!idNode) return;

    const name = idNode.text;
    if (name.startsWith('env(')) return;

    const defText = sourceText
        ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
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
function _handleProcedure(node, results, sourceText) {
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
            const defText = sourceText
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
                : node.text;
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
        _collectVariables(bodyNode, results, sourceText);
    }
}

/**
 * 处理 foreach 节点，提取循环变量。
 * foreach item $list { body }
 * → foreach + arguments(循环变量在第一个子节点) + braced_word(body)
 */
function _handleForeach(node, results, sourceText) {
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode && argsNode.childCount > 0) {
        // 第一个子节点是循环变量
        const loopVar = argsNode.child(0);
        if (loopVar && loopVar.text) {
            const defText = sourceText
                ? _extendNodeTextToLineEnd(node.text, node.endPosition.row, sourceText)
                : node.text;
            results.push({
                name: loopVar.text,
                line: loopVar.startPosition.row + 1,
                endLine: loopVar.endPosition.row + 1,
                definitionText: defText,
                kind: 'variable',
            });
        }
    }

    // 递归 body
    const bodyNode = _findChildByType(node, 'braced_word');
    if (bodyNode) {
        _collectVariables(bodyNode, results, sourceText);
    }
}

/**
 * 处理 while 节点，无变量绑定但递归 body。
 * while {cond} { body }
 */
function _handleWhile(node, results, sourceText) {
    // while 可能有多个 braced_word（条件 + body）
    const bracedWords = _findChildrenByType(node, 'braced_word');
    // 最后一个 braced_word 是 body
    if (bracedWords.length > 0) {
        for (const bw of bracedWords) {
            _collectVariables(bw, results, sourceText);
        }
    }
}

/**
 * 处理普通 command 节点。
 * 检查第一个 simple_word 是否为特殊命令（如 "for"），若是则特殊处理。
 */
function _handleCommand(node, results, sourceText) {
    if (node.childCount === 0) return;

    const firstChild = node.child(0);
    if (!firstChild || firstChild.type !== 'simple_word') {
        // 非简单命令，递归所有子节点
        _collectVariables(node, results, sourceText);
        return;
    }

    const cmdName = firstChild.text;

    if (cmdName === 'for') {
        _handleFor(node, results, sourceText);
    } else {
        // 其他 command，递归子节点（可能包含嵌套结构）
        _collectVariables(node, results, sourceText);
    }
}

/**
 * 处理 for 循环。
 * for {init} {cond} {step} {body}
 * → command: simple_word("for") + braced_word(init) + braced_word(cond) + braced_word(step) + braced_word(body)
 */
function _handleFor(node, results, sourceText) {
    // 递归所有 braced_word 子节点（init 中可能有 set，body 中也可能有）
    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectVariables(bw, results, sourceText);
    }
}

// ── 辅助函数 ──

/**
 * 将 tree-sitter 节点文本扩展到该节点末尾所在行的行尾。
 * 用于将行末注释包含在 definitionText 中。
 * @param {string} nodeText tree-sitter 节点的原始文本
 * @param {number} endRow 节点末尾所在行（0-indexed，来自 endPosition.row）
 * @param {string} sourceText 完整源码文本
 * @returns {string} 扩展后的文本
 */
function _extendNodeTextToLineEnd(nodeText, endRow, sourceText) {
    const lines = sourceText.split('\n');
    if (endRow >= lines.length) return nodeText;
    const fullLine = lines[endRow];
    const nodeLines = nodeText.split('\n');
    const lastNodeLine = nodeLines[nodeLines.length - 1];
    const idx = fullLine.lastIndexOf(lastNodeLine);
    if (idx < 0) return nodeText;
    const tail = fullLine.slice(idx + lastNodeLine.length).trimStart();
    return tail ? nodeText + tail : nodeText;
}

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

/**
 * 获取命令节点的所有词级子节点，展开 word_list 包装。
 * tree-sitter-tcl 将多参数命令的参数包装在 word_list 节点中，
 * 导致 _findChildrenByType 无法直接找到参数。
 * @param {object} node - command 节点
 * @returns {object[]} 展开后的子节点列表
 */
function _getCommandWords(node) {
    const words = [];
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;
        if (child.type === 'word_list') {
            for (let j = 0; j < child.childCount; j++) {
                const wc = child.child(j);
                if (wc) words.push(wc);
            }
        } else {
            words.push(child);
        }
    }
    return words;
}

// ── DocumentSymbol 支持 ──

/**
 * VSCode SymbolKind 枚举值（仅导出使用的子集）。
 */
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
            if (arg.text) {
                symbol.children.push({
                    name: arg.text,
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
    let varName = '';
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode && argsNode.childCount > 0) {
        const loopVar = argsNode.child(0);
        if (loopVar && loopVar.text) varName = loopVar.text;
    }

    const symbol = {
        name: varName ? `foreach ${varName}` : 'foreach',
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

    const bracedWords = _findChildrenByType(node, 'braced_word');
    for (const bw of bracedWords) {
        _collectSymbols(bw, langId, symbol.children);
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

module.exports = {
    parseSafe,
    getFoldingRanges,
    findMismatchedBraces,
    getVariables,
    getVariableRefs,
    buildScopeMap,
    buildScopeIndex,
    ScopeIndex,
    getDocumentSymbols,
    SymbolKind,
    TCL_LANGS,
};
