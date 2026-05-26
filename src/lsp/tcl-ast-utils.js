// src/lsp/tcl-ast-utils.js
'use strict';

const tclParserWasm = require('./tcl-parser-wasm');

/** 支持的 Tcl 语言 ID */
const TCL_LANGS = new Set(['sdevice', 'sdevicepar', 'sprocess', 'emw', 'inspect', 'svisual']);

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

// ── 共享辅助函数（供子模块引用）──

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

// ── scope/variable 子模块共享辅助函数 ──

/**
 * 将 tree-sitter 节点文本扩展到该节点末尾所在行的行尾。
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
 */
function _isWordType(w) {
    return w && (w.type === 'simple_word' || w.type === 'id');
}

/**
 * 从 command 节点提取隐式变量定义。统一入口，供 extractor/scope 两模块共用。
 * @param {object} node - command 节点
 * @param {string} cmdName - 命令名
 * @param {object[]} words - _getCommandWords 返回的词列表
 * @returns {Array<{name: string, line: number}>}
 */
function _extractCommandVarDefs(node, cmdName, words) {
    const defs = [];
    if (cmdName === 'lassign') {
        for (let i = 2; i < words.length; i++) {
            if (_isWordType(words[i])) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
        }
    } else if (cmdName === 'lmap') {
        for (let i = 1; i < words.length - 1; i += 2) {
            const w = words[i];
            if (_isWordType(w)) defs.push({ name: w.text, line: w.startPosition.row + 1 });
            else if (w.type === 'braced_word') _extractBracedWordVars(w, defs);
        }
    } else if (cmdName === 'incr' || cmdName === 'append' || cmdName === 'lappend') {
        if (words.length >= 2 && _isWordType(words[1])) {
            defs.push({ name: words[1].text, line: words[1].startPosition.row + 1 });
        }
    } else if (cmdName === 'gets') {
        if (words.length >= 3 && _isWordType(words[2])) {
            defs.push({ name: words[2].text, line: words[2].startPosition.row + 1 });
        }
    } else if (cmdName === 'catch') {
        if (words.length >= 3 && _isWordType(words[2])) {
            defs.push({ name: words[2].text, line: words[2].startPosition.row + 1 });
        }
        if (words.length >= 4 && _isWordType(words[3])) {
            defs.push({ name: words[3].text, line: words[3].startPosition.row + 1 });
        }
    } else if (cmdName === 'scan') {
        for (let i = 3; i < words.length; i++) {
            if (_isWordType(words[i])) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
        }
    } else if (cmdName === 'regexp') {
        let idx = 1;
        while (idx < words.length && words[idx].text.startsWith('-')) idx++;
        for (let i = idx + 2; i < words.length; i++) {
            if (_isWordType(words[i])) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
        }
    } else if (cmdName === 'regsub') {
        let ridx = 1;
        while (ridx < words.length && words[ridx].text.startsWith('-')) ridx++;
        // ridx=exp, ridx+1=string, ridx+2=subSpec, ridx+3=varName(可选)
        if (ridx + 3 < words.length && _isWordType(words[ridx + 3])) {
            defs.push({ name: words[ridx + 3].text, line: words[ridx + 3].startPosition.row + 1 });
        }
    } else if (cmdName === 'variable') {
        let argIdx = 0;
        for (let i = 1; i < words.length; i++) {
            if (_isWordType(words[i])) {
                if (argIdx % 2 === 0) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
                argIdx++;
            }
        }
    } else if (cmdName === 'global') {
        for (let i = 1; i < words.length; i++) {
            if (_isWordType(words[i])) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
        }
    } else if (cmdName === 'upvar') {
        for (const name of _extractUpvarLocalNames(words)) {
            defs.push({ name, line: node.startPosition.row + 1 });
        }
    } else if (cmdName === 'dict') {
        const subCmd = words[1] ? words[1].text : '';
        if (subCmd === 'for' || subCmd === 'map') {
            const bracedVars = words[2];
            if (bracedVars && bracedVars.type === 'braced_word') _extractBracedWordVars(bracedVars, defs);
        } else if (subCmd === 'set') {
            if (_isWordType(words[2])) defs.push({ name: words[2].text, line: words[2].startPosition.row + 1 });
        } else if (subCmd === 'update') {
            for (let i = 4; i < words.length; i += 2) {
                if (_isWordType(words[i])) defs.push({ name: words[i].text, line: words[i].startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'array') {
        if (words[1] && words[1].text === 'set' && _isWordType(words[2])) {
            defs.push({ name: words[2].text, line: words[2].startPosition.row + 1 });
        }
    } else if (cmdName === 'file') {
        if (words[1] && words[1].text === 'stat' && _isWordType(words[3])) {
            defs.push({ name: words[3].text, line: words[3].startPosition.row + 1 });
        }
    }
    return defs;
}

/** 从 ERROR 节点中检测 id + command_substitution 兄弟模式（set VAR [cmd...] 吞噬后的残骸） */
function _extractCmdSubstPatternDefs(node) {
    const defs = [];
    for (let i = 0; i < node.childCount - 1; i++) {
        const cur = node.child(i);
        if (!cur || (cur.type !== 'id' && cur.type !== 'simple_word')) continue;
        const next = node.child(i + 1);
        if (!next || next.type !== 'command_substitution') continue;
        const name = cur.text;
        if (!name.startsWith('env(') && !/^\d/.test(name) && name !== 'set') {
            defs.push({ name, line: cur.startPosition.row + 1 });
        }
    }
    return defs;
}

/**
 * 从 ERROR 节点提取变量定义（set、lassign、variable、Svisual -out 等）。
 * tree-sitter-tcl 对 set 值中的 [...] 命令替换支持不完整，
 * 导致含 [] 的 set 语句触发 ERROR，此时 set 和变量名是同级节点。
 * @param {object} node - ERROR 节点
 * @param {boolean} [includeCompleteSet=false] - 是否提取完整 set 节点（有内部 id）。
 *   当 root 为 ERROR 时调用方应传 true（无法通过 _collectVariables 的 set 分支处理）。
 */
function _extractErrorVarDefs(node, includeCompleteSet = false) {
    const defs = [];
    if (node.childCount === 0) return defs;

    // Pass 1: 扫描 set + id/simple_word 兄弟节点对（空壳 set）
    for (let i = 0; i < node.childCount - 1; i++) {
        const cur = node.child(i);
        const isSet = cur.type === 'set' || (cur.type === 'simple_word' && cur.text === 'set');
        if (!isSet) continue;
        const next = node.child(i + 1);
        if (next && (next.type === 'id' || next.type === 'simple_word')) {
            const name = next.text;
            if (!name.startsWith('env(') && !/^\d/.test(name)) {
                defs.push({ name, line: next.startPosition.row + 1 });
            }
        }
    }

    // Pass 2: 完整 set 节点（ERROR 内正常解析的 set，有内部 id 子节点）
    if (includeCompleteSet) {
        const captured = new Set(defs.map(d => d.name + '@' + d.line));
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            if (child && child.type === 'set') {
                const idNode = _findChildByType(child, 'id');
                if (idNode && !idNode.text.startsWith('env(')) {
                    const line = idNode.startPosition.row + 1;
                    const key = idNode.text + '@' + line;
                    if (!captured.has(key)) {
                        defs.push({ name: idNode.text, line });
                        captured.add(key);
                    }
                }
            }
        }
    }

    // Pass 3: 命令首词匹配
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
    } else if (cmdName === 'incr' || cmdName === 'append' || cmdName === 'lappend' || cmdName === 'lmap') {
        if (node.childCount >= 2) {
            const arg = node.child(1);
            if (arg && (arg.type === 'simple_word' || arg.type === 'id')) {
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
    } else if (cmdName === 'global') {
        for (let i = 1; i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'gets') {
        if (node.childCount >= 3) {
            const arg = node.child(2);
            if (arg && (arg.type === 'simple_word' || arg.type === 'id')) {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'catch') {
        for (let i = 2; i <= 3 && i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'scan') {
        for (let i = 3; i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'regexp') {
        let skip = 1;
        while (skip < node.childCount) {
            const a = node.child(skip);
            if (a && a.type === 'simple_word' && a.text.startsWith('-')) { skip++; } else { break; }
        }
        // skip=exp, skip+1=string, skip+2+=varNames
        for (let i = skip + 2; i < node.childCount; i++) {
            const arg = node.child(i);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (cmdName === 'regsub') {
        let skip = 1;
        while (skip < node.childCount) {
            const a = node.child(skip);
            if (a && a.type === 'simple_word' && a.text.startsWith('-')) { skip++; } else { break; }
        }
        // skip=exp, skip+1=string, skip+2=subSpec, skip+3=varName（可选）
        if (node.childCount >= skip + 4) {
            const arg = node.child(skip + 3);
            if (arg && arg.type === 'simple_word') {
                defs.push({ name: arg.text, line: arg.startPosition.row + 1 });
            }
        }
    } else if (_isSvisualVarDefCommand(cmdName)) {
        const words = _getCommandWords(node);
        for (const d of _extractSvisualOutVars(words, cmdName)) {
            defs.push(d);
        }
    }
    return defs;
}

/**
 * 从 upvar 命令词列表中提取所有本地变量名。
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
 * 从 variable 命令词列表中提取所有变量名。
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

/** Svisual 变量定义命令命名空间前缀 */
const _SVISUAL_NS_RE = /^(ext|rfx|ifm)::/;

/**
 * 判断命令名是否属于 Svisual 变量定义命令。
 * ext::/rfx::/ifm:: 命名空间命令使用 -out 传递结果，create_variable 使用 -name。
 */
function _isSvisualVarDefCommand(cmdName) {
    return cmdName === 'create_variable' || _SVISUAL_NS_RE.test(cmdName);
}

/**
 * 从 Svisual 命令参数中提取 -out/-name 定义的变量名。
 * flag 可出现在参数列表的任意位置（同一行内）。
 * @param {object[]} words - _getCommandWords 返回的词列表
 * @param {string} cmdName - 命令名（words[0].text）
 * @returns {Array<{name: string, line: number}>}
 */
function _extractSvisualOutVars(words, cmdName) {
    const defs = [];
    const targetFlag = cmdName === 'create_variable' ? '-name' : '-out';

    for (let i = 1; i < words.length - 1; i++) {
        const w = words[i];
        if (w.type === 'simple_word' && w.text === targetFlag) {
            const next = words[i + 1];
            if (next && (next.type === 'simple_word' || next.type === 'id') && !next.text.startsWith('$')) {
                defs.push({ name: next.text, line: next.startPosition.row + 1 });
            }
        }
    }

    return defs;
}

module.exports = {
    parseSafe,
    walkNodes,
    findNodesByType,
    getFoldingRanges,
    isTclLanguage,
    TCL_LANGS,
    _findChildByType,
    _findChildrenByType,
    _getCommandWords,
    _extractArgName,
    _extractForeachVarNames,
    _extendNodeTextToLineEnd,
    _extractCommandVarDefs,
    _extractBracedWordVars,
    _extractErrorVarDefs,
    _extractUpvarLocalNames,
    _extractVariableNames,
    _isSvisualVarDefCommand,
    _extractSvisualOutVars,
    _extractCmdSubstPatternDefs,
};
