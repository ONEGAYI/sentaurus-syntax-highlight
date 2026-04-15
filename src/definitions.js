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

function extractSchemeDefinitions(text) {
    const { ast } = parse(text);
    const { definitions } = analyze(ast, text);
    return definitions;
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

/** Tcl 语言 ID 集合 — 从 tcl-ast-utils 导入，保持单一数据源 */
const { TCL_LANGS } = tclAstUtils;

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
    extractTclDefinitionsAst,
    extractDefinitions,
    getDefinitions,
    clearDefinitionCache,
};
