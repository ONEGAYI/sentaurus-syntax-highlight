// src/definitions.js
'use strict';

const { parse } = require('./lsp/scheme-parser');
const { analyze } = require('./lsp/scheme-analyzer');
const tclAstUtils = require('./lsp/tcl-ast-utils');

/**
 * 从 startPos 开始，找到匹配的闭括号位置。
 * 跳过字符串和注释内的括号。
 * @param {string} text 完整文本
 * @param {number} startPos 开括号的位置
 * @param {string} openChar 开括号字符，默认 '('
 * @param {string} closeChar 闭括号字符，默认 ')'
 * @returns {number} 匹配的闭括号位置，未闭合返回 -1
 */
function findBalancedExpression(text, startPos, openChar = '(', closeChar = ')') {
    let depth = 0;
    let inString = false;
    let inLineComment = false;
    for (let i = startPos; i < text.length; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : '\0';
        if (ch === '"' && prev !== '\\' && !inLineComment) inString = !inString;
        if (ch === ';' && !inString) inLineComment = true;
        if (ch === '\n') inLineComment = false;
        if (inString || inLineComment) continue;
        if (ch === openChar) depth++;
        if (ch === closeChar) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * 从 Scheme 文本中提取用户定义的变量和函数。
 * 覆盖：(define name ...), (define (func args) ...),
 *        (let ((var val) ...) ...), (let* ...), (letrec ...)
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
/**
 * 检查 text 中位置 pos 是否在注释或双引号字符串内。
 * @param {string} text 完整文本
 * @param {number} pos 要检查的位置
 * @returns {boolean} 如果在注释或字符串内返回 true
 */
function isInCommentOrString(text, pos) {
    let inString = false;
    let inLineComment = false;
    for (let i = 0; i < pos; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : '\0';
        if (ch === '"' && prev !== '\\' && !inLineComment) inString = !inString;
        if (ch === ';' && !inString) inLineComment = true;
        if (ch === '\n') inLineComment = false;
    }
    return inString || inLineComment;
}

/**
 * 从绑定列表文本中提取顶层绑定对的变量名。
 * 只匹配深度为 1 的 (var ...) 对，跳过嵌套的子表达式。
 * @param {string} bindList 绑定列表内部文本（不含外层括号）
 * @returns {string[]} 变量名列表
 */
function extractBindNames(bindList) {
    const names = [];
    let i = 0;
    while (i < bindList.length) {
        // 跳过空白
        while (i < bindList.length && /\s/.test(bindList[i])) i++;
        if (i >= bindList.length) break;
        if (bindList[i] === '(') {
            // 找到绑定对的开括号，提取变量名
            const pairOpen = i;
            const pairClose = findBalancedExpression(bindList, pairOpen);
            if (pairClose === -1) break;
            // 变量名紧跟在 ( 之后
            const pairContent = bindList.substring(pairOpen + 1, pairClose);
            const nameMatch = pairContent.match(/^([^()\s]+)/);
            if (nameMatch) names.push(nameMatch[1]);
            i = pairClose + 1;
        } else {
            // 非括号开头，跳过这个 token
            i++;
        }
    }
    return names;
}

function extractSchemeDefinitions(text) {
    const { ast } = parse(text);
    const { definitions } = analyze(ast);
    return definitions;
}

/**
 * @deprecated 使用 extractTclDefinitionsAst 替代。保留用于参考和测试。
 * 从 Tcl 文本中提取用户定义的变量和过程。
 * 覆盖：set varName value, proc name {args} {body}
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function extractTclDefinitions(text) {
    const defs = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // set varName value
        const setMatch = trimmed.match(/^set\s+(\S+)/);
        if (setMatch) {
            const name = setMatch[1];
            if (name.startsWith('env(')) continue;
            defs.push({ name, line: i + 1, endLine: i + 1, definitionText: trimmed });
            continue;
        }

        // proc name {args} {body} — 可能跨多行
        const procMatch = trimmed.match(/^proc\s+(\S+)/);
        if (procMatch) {
            const name = procMatch[1];
            // 从 proc 行开始拼接剩余文本，寻找完整定义
            const fromLine = lines.slice(i).join('\n');
            const firstBrace = fromLine.indexOf('{');
            if (firstBrace !== -1) {
                // proc 有两组花括号: {args} {body}
                const argsEnd = findBalancedExpression(fromLine, firstBrace, '{', '}');
                if (argsEnd !== -1) {
                    const bodyBrace = fromLine.indexOf('{', argsEnd + 1);
                    if (bodyBrace !== -1) {
                        const bodyEnd = findBalancedExpression(fromLine, bodyBrace, '{', '}');
                        if (bodyEnd !== -1) {
                            const fullDef = fromLine.substring(0, bodyEnd + 1).trim();
                            const endLine = i + 1 + fromLine.substring(0, bodyEnd).split('\n').length - 1;
                            defs.push({ name, line: i + 1, endLine, definitionText: fullDef });
                            continue;
                        }
                    }
                }
            }
            // 降级：只记录 proc 行
            defs.push({ name, line: i + 1, endLine: i + 1, definitionText: trimmed });
        }
    }

    return defs;
}

/**
 * 从 Tcl 文本中通过 AST 提取用户定义的变量和过程。
 * WASM 解析器未就绪时返回空数组。
 * @param {string} text 完整文档文本
 * @returns {{ name: string, line: number, endLine: number, definitionText: string, kind: string }[]}
 */
function extractTclDefinitionsAst(text) {
    const tree = tclAstUtils.parseSafe(text);
    if (!tree) return [];
    try {
        return tclAstUtils.getVariables(tree.rootNode);
    } finally {
        tree.delete();
    }
}

/** Scheme 语言 ID 集合 */
const SCHEME_LANGS = new Set(['sde']);

/** Tcl 语言 ID 集合 */
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect']);

/**
 * 根据语言 ID 分发到对应的提取器。
 * @param {string} text 文档文本
 * @param {string} langId 语言 ID
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function extractDefinitions(text, langId) {
    if (SCHEME_LANGS.has(langId)) return extractSchemeDefinitions(text);
    if (TCL_LANGS.has(langId)) return extractTclDefinitionsAst(text);
    return [];
}

/**
 * 定义缓存。key 为文档 URI，value 为 { version, definitions }。
 * @type {Map<string, { version: number, definitions: object[] }>}
 */
const _defCache = new Map();

/**
 * 获取文档中的用户定义变量，带版本缓存。
 * @param {{ getText: Function, version: number, uri: { toString: Function } }} document
 * @param {string} langId 语言 ID
 * @returns {{ name: string, line: number, endLine: number, definitionText: string }[]}
 */
function getDefinitions(document, langId) {
    const uri = document.uri.toString();
    const cached = _defCache.get(uri);
    if (cached && cached.version === document.version) return cached.definitions;

    const definitions = extractDefinitions(document.getText(), langId);
    _defCache.set(uri, { version: document.version, definitions });
    return definitions;
}

/** 清空缓存（测试用）。 */
function clearDefinitionCache() {
    _defCache.clear();
}

module.exports = {
    findBalancedExpression,
    extractSchemeDefinitions,
    extractTclDefinitions,
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
};
