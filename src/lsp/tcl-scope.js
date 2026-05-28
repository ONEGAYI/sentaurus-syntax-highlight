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
    _extractErrorVarDefs,
    _extractUpvarLocalNames,
    _extractVariableNames,
    _isSvisualVarDefCommand,
    _extractSvisualOutVars,
    _extractCmdSubstPatternDefs,
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

            const globalProcLine = this._globalProcNames.get(name);
            if (globalProcLine !== undefined) return { defLine: globalProcLine, scope: 'global-proc' };

            return null;
        }

        const globalDef = this._findLastDefBefore(this._globalDefs, name, line);
        if (globalDef) return { defLine: globalDef.defLine, scope: 'global' };

        const globalProcLine = this._globalProcNames.get(name);
        if (globalProcLine !== undefined) return { defLine: globalProcLine, scope: 'global-proc' };

        return null;
    }
}

/** buildScopeIndex 中已有专门处理的 command 名称 */
const _HANDLED_CMDS = new Set([
    'set', 'lappend', 'append', 'for', 'lassign', 'lmap', 'dict', 'incr',
    'gets', 'scan', 'regexp', 'regsub', 'catch', 'variable', 'global', 'upvar',
    'array', 'file',
]);

/**
 * 去重添加变量定义。键格式 "name@line" 确保同名变量在不同行各自独立。
 */
function _addDefIfNew(defs, captured, name, line) {
    const key = name + '@' + line;
    if (!captured.has(key)) {
        captured.add(key);
        defs.push({ name, defLine: line });
    }
}

/**
 * 从 binop_expr 等异常容器节点中递归提取变量定义。
 * tree-sitter-tcl 在 ERROR 恢复失败时可能将后续代码吞噬进
 * binop_expr 等非标准节点类型中，这些 ERROR 内的变量定义模式为：
 * - set + id/simple_word 空壳对（_extractErrorVarDefs 已处理）
 * - simple_word("set") + simple_word(name) — set 未被识别为 set 节点类型
 * - ext::/rfx::/ifm:: 命名空间命令 + -out + variable（复用 _extractSvisualOutVars）
 * - create_variable + -name + variable（复用 _extractSvisualOutVars）
 */
function _collectFallbackDefs(node, defs, captured) {
    if (!captured) captured = new Set();
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'ERROR') {
            for (const d of _extractErrorVarDefs(child, true)) {
                _addDefIfNew(defs, captured, d.name, d.line);
            }
        }

        if (child.type === 'command_substitution') {
            _collectCmdSubstDefs(child, defs);
            continue;
        }

        if (child.type === 'braced_word_simple' || child.type === 'braced_word') {
            _collectBracedWordSimpleDefs(child, defs);
            continue;
        }

        _collectFallbackDefs(child, defs, captured);
    }
}

/**
 * 递归收集 ERROR 节点及其嵌套 ERROR 中的变量定义、proc 作用域和循环作用域。
 * tree-sitter-tcl 对 set 值中的 [...] 命令替换支持不完整，
 * 含 [] 的 set 语句会触发 ERROR 并可能级联吞噬后续语句，
 * 导致 proc/foreach 等结构碎片化在 ERROR 内。
 */
function _collectErrorDefsRecursive(node, globalDefs, procScopes, loopScopes) {
    for (const d of _extractErrorVarDefs(node, true)) {
        globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
    }

    // ERROR 内 id + command_substitution 模式（set VAR [cmd ...] 吞噬后的残骸）
    const existingKeys = new Set(globalDefs.map(d => d.name + '@' + d.defLine));
    for (const d of _extractCmdSubstPatternDefs(node)) {
        const key = d.name + '@' + d.line;
        if (!existingKeys.has(key)) {
            existingKeys.add(key);
            globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
        }
    }

    // 扫描 proc 结构
    _extractErrorProcScopes(node, globalDefs, procScopes);
    _findAndExtractErrorProcBodies(node, globalDefs, procScopes);

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'ERROR') {
            _collectErrorDefsRecursive(child, globalDefs, procScopes, loopScopes);
        }
        if (child && child.type === 'command_substitution') {
            _collectCmdSubstDefs(child, globalDefs);
        }
        if (child && (child.type === 'braced_word_simple' || child.type === 'braced_word')) {
            _collectBracedWordSimpleDefs(child, globalDefs);
        }
    }
}

/**
 * 从 braced_word_simple / braced_word 节点中提取 set 变量定义。
 * ERROR 内的 if/else body 可能被解析为 braced_word_simple，
 * 内部结构为 { simple_word("set") simple_word(varName) ... }。
 */
function _collectBracedWordSimpleDefs(node, defs) {
    for (let i = 0; i < node.childCount - 1; i++) {
        const child = node.child(i);
        if (!child || child.type !== 'simple_word' || child.text !== 'set') continue;
        const next = node.child(i + 1);
        if (next && next.type === 'simple_word' && !next.text.startsWith('$') && !next.text.startsWith('env(') && !/^\d/.test(next.text)) {
            defs.push({ name: next.text, defLine: next.startPosition.row + 1, isProc: false });
        }
    }
}

/**
 * 从 command_substitution 节点中提取变量定义。
 * command_substitution 内含 command 节点，需对其内部命令应用变量提取逻辑。
 * 例如 set VAR [lmap v $list {body}] 中 lmap 的循环变量 v 需要被提取。
 */
function _collectCmdSubstDefs(node, globalDefs) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;
                const words = _getCommandWords(child);
                if (cmdName === 'set' || cmdName === 'lappend' || cmdName === 'append') {
                    for (const arg of words) {
                        if (arg.type === 'id' || arg.type === 'simple_word') {
                            const name = arg.text;
                            if (name !== cmdName && !name.startsWith('env(') && !/^\d/.test(name)) {
                                globalDefs.push({ name, defLine: arg.startPosition.row + 1, isProc: false });
                                break;
                            }
                        }
                    }
                } else if (cmdName === 'foreach') {
                    for (const v of _extractForeachVarNames(child)) {
                        globalDefs.push({ name: v.name, defLine: v.line, isProc: false });
                    }
                } else {
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
                    }
                }
            }
        }
        if (child.type === 'command_substitution') {
            _collectCmdSubstDefs(child, globalDefs);
        }
        if (child.type === 'ERROR') {
            _collectErrorDefsRecursive(child, globalDefs, [], []);
        }
    }
}

/**
 * 从 ERROR 节点中提取 proc 结构并构建 procScopes。
 * ERROR 中 proc 被碎片化：proc + simple_word(名) + braced_word_simple(参数)
 * body (braced_word_simple) 可能在本 ERROR 内、或父 ERROR 的下一个子节点中。
 */
function _extractErrorProcScopes(node, globalDefs, procScopes) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type !== 'proc') continue;

        const nameNode = node.child(i + 1);
        const argsNode = node.child(i + 2);

        if (!nameNode || nameNode.type !== 'simple_word') continue;

        const procName = nameNode.text;
        const procDefLine = nameNode.startPosition.row + 1;
        globalDefs.push({ name: procName, defLine: procDefLine, isProc: true });

        // 提取参数
        const params = [];
        if (argsNode && argsNode.type === 'braced_word_simple') {
            for (let j = 0; j < argsNode.childCount; j++) {
                const arg = argsNode.child(j);
                if (arg && arg.type === 'simple_word') {
                    params.push(arg.text);
                }
            }
        }

        // 查找 body：先在本 ERROR 内找，再向父节点找
        let bodyNode = node.child(i + 3);
        if (!bodyNode || bodyNode.type !== 'braced_word_simple') {
            // body 可能在父 ERROR 中 argsNode 之后的下一个子节点
            bodyNode = null;
        }

        if (bodyNode) {
            _buildProcScope(procName, bodyNode, params, procScopes);
        }
        // 如果 body 未找到（碎片化在父节点），标记为延迟处理
    }
}

/**
 * 从 ERROR 节点的直接子节点中查找 proc 的 body（braced_word_simple）。
 * 当 proc 碎片化在嵌套 ERROR 中时，body 可能在父 ERROR 的下一个子节点。
 */
function _findAndExtractErrorProcBodies(node, globalDefs, procScopes) {
    // 查找所有包含 proc 关键字的嵌套 ERROR
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type !== 'ERROR') continue;

        // 检查这个 ERROR 内是否有 proc 关键字
        let hasProc = false;
        let procName = null;
        let argsNode = null;
        for (let j = 0; j < child.childCount; j++) {
            const c = child.child(j);
            if (c.type === 'proc') {
                hasProc = true;
            }
            if (c.type === 'simple_word' && hasProc && !procName) {
                procName = c.text;
            }
            if (c.type === 'braced_word_simple' && hasProc && !argsNode) {
                argsNode = c;
            }
        }

        if (!hasProc || !procName) continue;

        // body 应该在父节点的下一个子节点
        const bodyCandidate = node.child(i + 1);
        if (bodyCandidate && bodyCandidate.type === 'braced_word_simple') {
            // 提取参数
            const params = [];
            if (argsNode) {
                for (let j = 0; j < argsNode.childCount; j++) {
                    const arg = argsNode.child(j);
                    if (arg && arg.type === 'simple_word') {
                        params.push(arg.text);
                    }
                }
            }

            // 检查是否已被 _extractErrorProcScopes 处理
            const bodyStart = bodyCandidate.startPosition.row + 1;
            const alreadyProcessed = procScopes.some(p => p.name === procName && p.startLine === bodyStart);
            if (!alreadyProcessed) {
                _buildProcScope(procName, bodyCandidate, params, procScopes);
            }
        }
    }
}

/**
 * 构建 procScope 并添加到 procScopes 数组。
 */
function _buildProcScope(procName, bodyNode, params, procScopes) {
    const bodyStart = bodyNode.startPosition.row + 1;
    const bodyEnd = bodyNode.endPosition.row + 1;

    const localDefs = [];
    const scopeImports = [];
    _extractBracedBodyDefs(bodyNode, localDefs);
    _extractBracedBodyImports(bodyNode, scopeImports);

    procScopes.push({
        name: procName,
        startLine: bodyStart,
        endLine: bodyEnd,
        params,
        localDefs,
        scopeImports,
    });
}

/**
 * 从 braced_word_simple 节点中提取 set 变量定义。
 */
function _extractBracedBodyDefs(node, defs) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child) continue;

        if (child.type === 'simple_word' && child.text === 'set') {
            const next = node.child(i + 1);
            if (next && (next.type === 'simple_word' || next.type === 'id')) {
                const name = next.text;
                if (!name.startsWith('env(') && !/^\d/.test(name)) {
                    defs.push({ name, defLine: next.startPosition.row + 1 });
                }
            }
        }
    }
}

/**
 * 从 braced_word_simple 节点中提取 global/upvar/variable 声明。
 */
function _extractBracedBodyImports(node, imports) {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (!child || child.type !== 'simple_word') continue;

        if (child.text === 'global') {
            const next = node.child(i + 1);
            if (next && next.type === 'simple_word') {
                imports.push(next.text);
            }
        } else if (child.text === 'upvar' || child.text === 'variable') {
            // upvar level srcVar localVar — 取最后一个参数
            // variable name ?value? — 取 name
            const words = [];
            for (let j = i + 1; j < node.childCount; j++) {
                const w = node.child(j);
                if (w.type !== 'simple_word') break;
                words.push(w.text);
            }
            if (child.text === 'upvar' && words.length >= 2) {
                // upvar ?level? srcVar localVar — 跳过可能的 level 参数
                let start = /^\d+$/.test(words[0]) ? 1 : 0;
                for (let k = start; k < words.length - 1; k += 2) {
                    imports.push(words[k + 1]);
                }
            } else if (child.text === 'variable') {
                for (let k = 0; k < words.length; k += 2) {
                    imports.push(words[k]);
                }
            }
        }
    }
}

/**
 * 收集节点内所有 braced_word 中的变量定义。
 * @param {object} node - AST 节点
 * @param {Array} defs - 输出定义数组
 * @param {boolean} recurseIntoElse - 是否深入 else/elseif 子节点（if 节点需要）
 */

function _collectBracedWordDefs(node, defs, recurseIntoElse = false) {
    const words = _getCommandWords(node);
    for (const w of words) {
        if (w.type === 'braced_word') {
            _collectLocalDefsForIndex(w, defs);
        }
    }
    if (!recurseIntoElse) return;
    // 仅深入 else/elseif 子节点，跳过外层已处理的 braced_word
    for (let i = 0; i < node.childCount; i++) {
        const sub = node.child(i);
        if (!sub) continue;
        if (sub.type === 'else' || sub.type === 'elseif') {
            for (let j = 0; j < sub.childCount; j++) {
                const inner = sub.child(j);
                if (inner && inner.type === 'braced_word') {
                    _collectLocalDefsForIndex(inner, defs);
                }
            }
        }
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

    // tree-sitter-tcl 对 set 值中的 [...] 命令替换支持不完整，
    // 含 [] 的 set 可能导致 ERROR 级联吞噬后续语句甚至整个 root。
    // root 为 ERROR 时仍需正常遍历子节点（proc/set 等可能作为 ERROR 的子节点存在）。
    const isRootError = root.type === 'ERROR';

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
            } else if (isRootError) {
                // 空壳 set：tree-sitter-tcl ERROR 中 set 无内部 id，变量名在下一个兄弟节点
                const next = root.child(i + 1);
                if (next && (next.type === 'id' || next.type === 'simple_word')) {
                    const name = next.text;
                    if (!name.startsWith('env(') && !/^\d/.test(name)) {
                        globalDefs.push({
                            name,
                            defLine: next.startPosition.row + 1,
                            isProc: false,
                        });
                    }
                }
            }
            // set VAR [command ...] 中的隐式变量声明（lmap、lassign 等）
            for (const sub of _findChildrenByType(child, 'command_substitution')) {
                _collectCmdSubstDefs(sub, globalDefs);
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
                _collectLocalDefsForIndex(bodyNode, localDefs);

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
                if (cmdName === 'incr') {
                    const words = _getCommandWords(child);
                    if (words.length >= 2) {
                        const varNode = words[1];
                        if (varNode && (varNode.type === 'simple_word' || varNode.type === 'id')) {
                            globalDefs.push({ name: varNode.text, defLine: varNode.startPosition.row + 1, isProc: false });
                        }
                    }
                } else if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    const bracedWords = words.filter(w => w.type === 'braced_word');
                    const bodyBraced = bracedWords.length > 0 ? bracedWords[bracedWords.length - 1] : null;
                    if (bodyBraced) {
                        const loopStart = child.startPosition.row + 1;
                        const loopEnd = child.endPosition.row + 1;
                        const loopVarNames = new Set();
                        for (let bi = 0; bi < bracedWords.length - 1; bi++) {
                            _collectVarNamesFromNode(bracedWords[bi], loopVarNames);
                        }
                        loopScopes.push({ startLine: loopStart, endLine: loopEnd, varNames: loopVarNames });
                    }
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, globalDefs);
                        }
                    }
                } else if (_isSvisualVarDefCommand(cmdName)) {
                    const words = _getCommandWords(child);
                    for (const d of _extractSvisualOutVars(words, cmdName)) {
                        globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
                    }
                } else if (cmdName !== 'set' && cmdName !== 'lappend' && cmdName !== 'append') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        globalDefs.push({ name: d.name, defLine: d.line, isProc: false });
                    }
                }
                // switch/catch 等其他命令：递归 braced_word 收集变量定义
                if (!_HANDLED_CMDS.has(cmdName) && !_isSvisualVarDefCommand(cmdName)) {
                    _collectBracedWordDefs(child, globalDefs);
                }
            }
        }

        if (child.type === 'if') {
            _collectBracedWordDefs(child, globalDefs, true);
        }

        if (child.type === 'while') {
            _collectBracedWordDefs(child, globalDefs);
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

        // ERROR 节点：tree-sitter 不识别的命令（set 含 []、lassign、variable 等）
        if (child.type === 'ERROR') {
            _collectErrorDefsRecursive(child, globalDefs, procScopes, loopScopes);
        }

        // binop_expr 等异常容器：tree-sitter ERROR 恢复失败时将后续代码吞噬进
        // binop_expr，其中嵌套的 ERROR 节点内仍有变量定义
        if (child.type === 'binop_expr') {
            const fallbackDefs = [];
            _collectFallbackDefs(child, fallbackDefs);
            for (const d of fallbackDefs) {
                globalDefs.push({ name: d.name, defLine: d.defLine, isProc: false });
            }
        }
    }

    // root 为 ERROR 时，正常 procedure 节点可能不存在，
    // proc 碎片化为 proc + simple_word + braced_word_simple，需要额外扫描。
    if (isRootError) {
        _extractErrorProcScopes(root, globalDefs, procScopes);
        _findAndExtractErrorProcBodies(root, globalDefs, procScopes);
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
 */
function _collectLocalDefsForIndex(node, defs) {
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

        if (child.type === 'if') {
            _collectBracedWordDefs(child, defs, true);
        }

        if (child.type === 'while') {
            _collectBracedWordDefs(child, defs);
        }

        if (child.type === 'command') {
            const firstChild = child.child(0);
            if (firstChild && firstChild.type === 'simple_word') {
                const cmdName = firstChild.text;

                if (cmdName === 'for') {
                    const words = _getCommandWords(child);
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, defs);
                        }
                    }
                } else if (cmdName === 'lassign' || cmdName === 'lmap') {
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        defs.push({ name: d.name, defLine: d.line });
                    }
                    for (const w of words) {
                        if (w.type === 'braced_word') {
                            _collectLocalDefsForIndex(w, defs);
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
                } else if (_isSvisualVarDefCommand(cmdName)) {
                    const words = _getCommandWords(child);
                    for (const d of _extractSvisualOutVars(words, cmdName)) {
                        defs.push({ name: d.name, defLine: d.line });
                    }
                } else {
                    // 统一使用 _extractCommandVarDefs 处理所有其他隐式变量声明命令
                    const words = _getCommandWords(child);
                    for (const d of _extractCommandVarDefs(child, cmdName, words)) {
                        defs.push({ name: d.name, defLine: d.line });
                    }
                    // dict for/map 的 braced_word 需要递归 body
                    if (cmdName === 'dict') {
                        for (const w of words) {
                            if (w.type === 'braced_word') {
                                _collectLocalDefsForIndex(w, defs);
                            }
                        }
                    }
                }
            }
            _collectLocalDefsForIndex(child, defs);
        }

        // ERROR 节点：lassign、variable 等未识别命令
        if (child.type === 'ERROR') {
            for (const d of _extractErrorVarDefs(child)) {
                defs.push({ name: d.name, defLine: d.line });
            }
        }

        if (child.type === 'braced_word') {
            _collectLocalDefsForIndex(child, defs);
        }

        if (child.type === 'command_substitution') {
            _collectLocalDefsForIndex(child, defs);
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
    return node ? node.endPosition.row + 1 : 0;
}

module.exports = { ScopeIndex, buildScopeIndex, buildScopeMap };
