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
    const braceStack = [];
    const len = text.length;
    let lineIdx = 0;
    let col = 0;
    let inString = false;
    let lineIsStarComment = false;
    let foundFirstNonSpace = false;

    for (let i = 0; i < len; i++) {
        const ch = text[i];

        // 换行符：重置行状态
        if (ch === '\n') {
            lineIdx++;
            col = 0;
            inString = false;
            lineIsStarComment = false;
            foundFirstNonSpace = false;
            continue;
        }

        // 检测 * 注释行（行首第一个非空白字符为 *）
        if (!foundFirstNonSpace) {
            if (ch === ' ' || ch === '\t') {
                col++;
                continue;
            }
            foundFirstNonSpace = true;
            if (ch === '*') {
                lineIsStarComment = true;
                col++;
                continue;
            }
        }

        // 跳过 * 注释行的剩余内容
        if (lineIsStarComment) {
            col++;
            continue;
        }

        // # 注释：跳过本行剩余内容
        if (!inString && ch === '#') {
            const nlPos = text.indexOf('\n', i);
            if (nlPos < 0) break;
            i = nlPos - 1;
            continue;
        }

        // 跳过转义字符（仅在字符串内）
        if (ch === '\\' && inString) {
            i++;
            col += 2;
            continue;
        }

        // 字符串边界
        if (ch === '"') {
            inString = !inString;
            col++;
            continue;
        }

        // 花括号匹配（字符串外）
        if (!inString) {
            if (ch === '{') {
                braceStack.push({ line: lineIdx, col, char: '{' });
            } else if (ch === '}') {
                if (braceStack.length === 0) {
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

        col++;
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
    const lines = sourceText ? sourceText.split('\n') : null;
    _collectVariables(root, results, sourceText, lines);
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
 * ScopeIndex — 按需查询的作用域索引。
 * 用单遍 AST 遍历预构建数据结构，查询时按需计算可见变量集，
 * 替代 buildScopeMap 的 O(p×n×m) 全量预计算。
 */
class ScopeIndex {
    /**
     * @param {Array<{name: string, defLine: number, isProc: boolean}>} globalDefs
     * @param {Array<{name: string, startLine: number, endLine: number, params: string[], localDefs: Array<{name: string, defLine: number}>, scopeImports: string[]}>} procScopes
     * @param {Array<{startLine: number, endLine: number, varNames: Set<string>}>} loopScopes
     */
    constructor(globalDefs, procScopes, loopScopes) {
        this._globalDefs = globalDefs;
        this._globalProcNames = new Map();
        for (const def of globalDefs) {
            if (def.isProc) {
                this._globalProcNames.set(def.name, def.defLine);
            }
        }
        this._procScopes = procScopes.slice().sort((a, b) => a.startLine - b.startLine);
        this._loopScopes = loopScopes || [];
    }

    /**
     * 在定义列表中查找名称匹配且 defLine <= line 的最后一条记录。
     * Tcl 中 set 既是定义也是赋值，应取最后一条。
     * 循环感知：当存在外层同名定义和循环内同名定义时，循环外优先外层；
     * 但 Tcl 无块作用域，只有循环内定义时不跳过。
     * @param {Array<{name: string, defLine: number}>} defs
     * @param {string} name
     * @param {number} line - 1-based 行号
     * @returns {object|null}
     */
    _findLastDefBefore(defs, name, line) {
        const loops = this._loopScopes;
        // 光标是否在某个定义了此变量的循环体内
        const cursorInLoop = loops.some(l =>
            line >= l.startLine && line <= l.endLine && l.varNames.has(name)
        );

        let outerResult = null;
        let loopResult = null;
        for (const d of defs) {
            if (d.name !== name || d.defLine > line) continue;
            // 判断该定义是否在某个循环的行范围内
            const defInLoop = loops.some(l =>
                l.varNames.has(name) && d.defLine >= l.startLine && d.defLine <= l.endLine
            );
            if (defInLoop) {
                loopResult = d;
            } else {
                outerResult = d;
            }
        }

        // 光标在循环内 → 优先循环内定义（取最后一条）
        if (cursorInLoop) return loopResult || outerResult;
        // 光标在循环外 → 优先外层定义；只有循环内定义时不跳过（Tcl 无块作用域）
        return outerResult || loopResult;
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

    /**
     * 解析变量名在指定行号（1-based）处可访问的定义来源。
     * 注意：仅返回当前作用域可达的定义（proc 内未通过 global/upvar/variable
     * 导入的全局变量视为不可达，返回 null）。
     * @param {string} name - 变量名
     * @param {number} line - 1-based 行号
     * @returns {{ defLine: number, scope: string } | null}
     */
    resolveDefinition(name, line) {
        const proc = this._procScopes.find(p => line >= p.startLine && line <= p.endLine);

        if (proc) {
            // 检查 proc 参数（视为局部定义，定义行为 proc body 起始行）
            if (proc.params.includes(name)) {
                return { defLine: proc.startLine, scope: 'local' };
            }

            const local = this._findLastDefBefore(proc.localDefs, name, line);
            if (local) return { defLine: local.defLine, scope: 'local' };

            if (proc.scopeImports.includes(name)) {
                const globalDef = this._findLastDefBefore(this._globalDefs, name, line);
                if (globalDef) return { defLine: globalDef.defLine, scope: 'imported' };
            }

            const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
            if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

            return null;
        }

        const globalDef = this._findLastDefBefore(this._globalDefs, name, line, this._loopScopes);
        if (globalDef) return { defLine: globalDef.defLine, scope: 'global' };

        const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
        if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

        return null;
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
    const loopScopes = [];
    const maxLine = _countMaxLine(root) + 1;

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
                        if (arg.text) params.push(_extractArgName(arg));
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
                    const bracedWords = words.filter(w => w.type === 'braced_word');
                    // body 是最后一个 braced_word，用它确定循环范围
                    const bodyBraced = bracedWords.length > 0 ? bracedWords[bracedWords.length - 1] : null;
                    if (bodyBraced) {
                        const loopStart = child.startPosition.row + 1;
                        const loopEnd = child.endPosition.row + 1;
                        // 收集 init/next 中的变量名（循环临时变量）
                        const loopVarNames = new Set();
                        for (let bi = 0; bi < bracedWords.length - 1; bi++) {
                            _collectVarNamesFromNode(bracedWords[bi], loopVarNames);
                        }
                        loopScopes.push({ startLine: loopStart, endLine: loopEnd, varNames: loopVarNames });
                    }
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, globalDefs, 1, maxLine);
                        }
                    }
                }
                if (cmdName === 'lassign' || cmdName === 'lmap' || cmdName === 'dict') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
                    }
                }
            }
        }

        if (child.type === 'foreach') {
            const varNames = _extractForeachVarNames(child);
            const loopVarSet = new Set(varNames.map(v => v.name));
            loopScopes.push({
                startLine: child.startPosition.row + 1,
                endLine: child.endPosition.row + 1,
                varNames: loopVarSet,
            });
            for (const v of varNames) {
                globalDefs.push({
                    name: v.name,
                    defLine: v.line,
                    isProc: false,
                });
            }
        }

        // ERROR 节点：tree-sitter 不识别的命令（lassign、variable 等）
        if (child.type === 'ERROR') {
            for (const d of _extractErrorVarDefs(child)) {
                globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
            }
        }
    }

    return new ScopeIndex(globalDefs, procScopes, loopScopes);
}

/**
 * 从 AST 节点中递归收集所有 set 命令定义的变量名。
 * 用于识别 for 循环 init/next 中的循环临时变量。
 * @param {object} node - AST 节点
 * @param {Set<string>} names - 输出变量名集合
 */
function _collectVarNamesFromNode(node, names) {
    if (!node) return;
    // 查找 set 命令
    if (node.type === 'set') {
        const idNode = _findChildByType(node, 'id');
        if (idNode && !idNode.text.startsWith('env(')) {
            names.add(idNode.text);
        }
    }
    // 查找 incr 命令（command 类型内嵌）
    if (node.type === 'command') {
        const firstChild = node.child(0);
        if (firstChild && firstChild.type === 'simple_word' && firstChild.text === 'incr') {
            const words = _getCommandWords(node);
            if (words.length >= 2) {
                const varNode = words[1];
                if (varNode.type === 'simple_word' || varNode.type === 'id') {
                    names.add(varNode.text);
                }
            }
        }
    }
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) _collectVarNamesFromNode(child, names);
    }
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
            for (const v of _extractForeachVarNames(child)) {
                defs.push({ name: v.name, defLine: v.line });
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
                } else if (cmdName === 'lassign' || cmdName === 'lmap' || cmdName === 'dict') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        defs.push({ name: d.name, defLine: d.line });
                    }
                    // braced_word 在 word_list 内，用 _getCommandWords 穿透递归 body
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, defs, scopeStart, scopeEnd);
                        }
                    }
                } else if (cmdName === 'incr') {
                    const words = _getCommandWords(child);
                    if (words.length >= 2) {
                        const varNode = words[1];
                        if (varNode.type === 'simple_word' || varNode.type === 'id') {
                            defs.push({ name: varNode.text, defLine: varNode.startPosition.row + 1 });
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

        // ERROR 节点：lassign、variable 等未识别命令
        if (child.type === 'ERROR') {
            for (const d of _extractErrorVarDefs(child)) {
                defs.push({ name: d.name, defLine: d.line });
            }
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
            const words = _getCommandWords(n);
            for (const name of _extractUpvarLocalNames(words)) {
                imports.push(name);
            }
        }

        if (cmdName === 'variable') {
            const words = _getCommandWords(n);
            for (const name of _extractVariableNames(words)) {
                imports.push(name);
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
                if (cmdName === 'lassign' || cmdName === 'lmap') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        _addToScopeFromLine(scopeMap, d.name, d.line, maxLine);
                    }
                }
                if (cmdName === 'dict') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, 'dict', words)) {
                        _addToScopeFromLine(scopeMap, d.name, d.line, maxLine);
                    }
                }
            }
        }

        if (child.type === 'foreach') {
            for (const v of _extractForeachVarNames(child)) {
                _addToScopeFromLine(scopeMap, v.name, v.line, maxLine);
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
                const name = _extractArgName(arg);
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
            for (const v of _extractForeachVarNames(child)) {
                _addToScopeFromLine(scopeMap, v.name, v.line, scopeEnd);
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
                } else if (cmdName === 'lassign' || cmdName === 'lmap') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        _addToScopeFromLine(scopeMap, d.name, d.line, scopeEnd);
                    }
                } else if (cmdName === 'dict') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, 'dict', words)) {
                        _addToScopeFromLine(scopeMap, d.name, d.line, scopeEnd);
                    }
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefs(w, scopeMap, scopeStart, scopeEnd);
                        }
                    }
                } else if (cmdName === 'incr') {
                    const words = _getCommandWords(child);
                    if (words.length >= 2) {
                        const varNode = words[1];
                        if (varNode.type === 'simple_word' || varNode.type === 'id') {
                            const defLine = varNode.startPosition.row + 1;
                            _addToScopeFromLine(scopeMap, varNode.text, defLine, scopeEnd);
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
            const words = _getCommandWords(n);
            for (const name of _extractUpvarLocalNames(words)) {
                _addToScopeFromLine(scopeMap, name, bodyStart, bodyEnd);
            }
        }

        if (cmdName === 'variable') {
            const words = _getCommandWords(n);
            for (const name of _extractVariableNames(words)) {
                _addToScopeFromLine(scopeMap, name, bodyStart, bodyEnd);
            }
        }
    });
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
                // ERROR 节点中可能包含已知命令（lassign、variable 等）
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

// ── 辅助函数 ──

/**
 * 将 tree-sitter 节点文本扩展到该节点末尾所在行的行尾。
 * 用于将行末注释包含在 definitionText 中。
 * @param {string} nodeText tree-sitter 节点的原始文本
 * @param {number} endRow 节点末尾所在行（0-indexed，来自 endPosition.row）
 * @param {string[]} lines 预分割的行数组
 * @returns {string} 扩展后的文本
 */
function _extendNodeTextToLineEnd(nodeText, endRow, lines) {
    if (!lines || endRow >= lines.length) return nodeText;
    const fullLine = lines[endRow];
    const nodeLines = nodeText.split('\n');
    const lastNodeLine = nodeLines[nodeLines.length - 1];
    const idx = fullLine.lastIndexOf(lastNodeLine);
    if (idx < 0) return nodeText;
    const tail = fullLine.slice(idx + lastNodeLine.length).trimStart();
    return tail ? nodeText + tail : nodeText;
}

/**
 * 从 foreach 节点提取所有循环变量名。
 * 支持三种形式：
 *   foreach var $list { body }          ← arguments 内单个 simple_word
 *   foreach {k v} $dict { body }        ← arguments 内 braced 多变量
 *   foreach v1 $l1 v2 $l2 ... { body }  ← 多 var-list 对（tree-sitter 限制，最多捕获 2 个）
 */
function _extractForeachVarNames(node) {
    const vars = [];
    const argsNode = _findChildByType(node, 'arguments');
    if (argsNode) {
        for (let i = 0; i < argsNode.childCount; i++) {
            const child = argsNode.child(i);
            if (!child || child.type === '{' || child.type === '}') continue;
            if (child.type === 'argument') {
                const inner = _findChildByType(child, 'simple_word')
                    || _findChildByType(child, 'id');
                const name = inner ? inner.text : child.text;
                if (name && !name.startsWith('$')) {
                    const line = inner ? inner.startPosition.row + 1 : child.startPosition.row + 1;
                    vars.push({ name, line });
                }
            } else if ((child.type === 'simple_word' || child.type === 'id') && !child.text.startsWith('$')) {
                vars.push({ name: child.text, line: child.startPosition.row + 1 });
            }
        }
    }
    // 多 var-list 对：foreach 节点直接包含的 simple_word 子节点（不在 arguments 内）
    const captured = new Set(vars.map(v => v.name));
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child || child.type !== 'simple_word') continue;
        const name = child.text;
        if (name !== 'foreach' && !name.startsWith('$') && !captured.has(name)) {
            vars.push({ name, line: child.startPosition.row + 1 });
            captured.add(name);
        }
    }
    return vars;
}

/**
 * 从 braced_word 节点中提取所有变量名（如 {k v} → k, v）。
 * braced_word 内部结构：{ → command(simple_word ...) → }，或直接 simple_word。
 */
function _extractBracedWordVars(bracedNode, defs) {
    for (let i = 0; i < bracedNode.childCount; i++) {
        const child = bracedNode.child(i);
        if (!child || child.type === '{' || child.type === '}') continue;
        if (child.type === 'command') {
            for (let j = 0; j < child.childCount; j++) {
                const sc = child.child(j);
                if (sc && sc.type === 'simple_word') {
                    defs.push({ name: sc.text, line: sc.startPosition.row + 1 });
                }
                if (sc && sc.type === 'word_list') {
                    for (let k = 0; k < sc.childCount; k++) {
                        const wc = sc.child(k);
                        if (wc && wc.type === 'simple_word') {
                            defs.push({ name: wc.text, line: wc.startPosition.row + 1 });
                        }
                    }
                }
            }
        } else if (child.type === 'simple_word') {
            defs.push({ name: child.text, line: child.startPosition.row + 1 });
        }
    }
}

/**
 * 从 command/ERROR 节点提取命令级变量定义（lassign、lmap、dict for）。
 * 返回 {name, line} 数组。
 */
function _extractCommandVarDefs(node, cmdName, words) {
    const defs = [];
    if (cmdName === 'lassign') {
        // words[2+] 为目标变量名（跳过命令名和源列表）
        for (let i = 2; i < words.length; i++) {
            const w = words[i];
            if (w.type === 'simple_word' || w.type === 'id') {
                defs.push({ name: w.text, line: w.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'lmap') {
        // 奇数位为变量名（var/list 对交替，跳过末尾 body）
        for (let i = 1; i < words.length - 1; i += 2) {
            const w = words[i];
            if (w.type === 'simple_word' || w.type === 'id') {
                defs.push({ name: w.text, line: w.startPosition.row + 1 });
            } else if (w.type === 'braced_word') {
                _extractBracedWordVars(w, defs);
            }
        }
    } else if (cmdName === 'dict' && words[1] && words[1].text === 'for') {
        const bracedVars = words[2];
        if (bracedVars && bracedVars.type === 'braced_word') {
            _extractBracedWordVars(bracedVars, defs);
        }
    }
    return defs;
}

/**
 * 查找第一个指定类型的直接子节点。
 */

/**
 * 从 ERROR 节点提取变量定义（lassign、variable 等）。
 * tree-sitter 不识别这些命令时将其解析为 ERROR，子节点为扁平的 simple_word 列表。
 * 返回 {name, line} 数组。
 */
function _extractErrorVarDefs(node) {
    const defs = [];
    if (node.childCount === 0) return defs;
    const first = node.child(0);
    if (!first || first.type !== 'simple_word') return defs;
    const cmdName = first.text;
    if (cmdName === 'lassign') {
        for (let i = 2; i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'variable') {
        let argIdx = 0;
        for (let i = 1; i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                if (argIdx % 2 === 0) {
                    defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
                }
                argIdx++;
            }
        }
    }
    return defs;
}

/**
 * 从 upvar 命令词列表中提取所有本地变量名。
 * upvar ?level? otherVar myVar ?otherVar myVar ...?
 * 不按类型过滤以保持配对位置结构。
 */
function _extractUpvarLocalNames(words) {
    const names = [];
    if (words.length < 3) return names;
    let start = 1;
    if (/^\d+$/.test(words[1].text)) start = 2;
    for (let i = start; i < words.length; i += 2) {
        if (i + 1 < words.length) {
            const w = words[i + 1];
            if (w.type === 'simple_word' || w.type === 'id') {
                names.push(w.text);
            }
        }
    }
    return names;
}

/**
 * 从 variable 命令词列表中提取所有变量名（取 name-value 对中的 name）。
 * variable ?name value ...?
 */
function _extractVariableNames(words) {
    const names = [];
    let argIdx = 0;
    for (let i = 1; i < words.length; i++) {
        const w = words[i];
        if (w.type === 'simple_word' || w.type === 'id') {
            if (argIdx % 2 === 0) names.push(w.text);
        }
        argIdx++;
    }
    return names;
}
/**
 * 从 procedure 的 argument 节点中提取参数名。
 * 简单参数 argument("a") → "a"；默认值参数 argument("{b 1.0}") → "b"。
 * argument 内第一个 simple_word 始终是参数名。
 */
function _extractArgName(argNode) {
    const inner = _findChildByType(argNode, 'simple_word');
    return inner ? inner.text : argNode.text;
}

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
