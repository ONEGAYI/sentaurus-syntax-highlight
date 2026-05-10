// src/lsp/tcl-scope.js
'use strict';

const {
    walkNodes,
    _findChildByType,
    _findChildrenByType,
    _getCommandWords,
    _extractArgName,
    _extractForeachVarNames,
    _extractCommandVarDefs,
    _extractBracedWordVars,
    _extractErrorVarDefs,
    _extractUpvarLocalNames,
    _extractVariableNames,
} = require('./tcl-ast-utils');

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

    get globalProcNames() { return this._globalProcNames; }

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
 * @deprecated 使用 ScopeIndex.getVisibleAt(line) 按需查询替代。
 *   此函数为 O(lines × scopeComplexity) 全量预计算，仅用于测试和基准测试。
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

module.exports = { ScopeIndex, buildScopeIndex, buildScopeMap };
