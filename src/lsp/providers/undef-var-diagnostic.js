// src/lsp/providers/undef-var-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');
const scopeAnalyzer = require('../scope-analyzer');
const schemeParser = require('../scheme-parser');

const DEBOUNCE_MS = 500;

/** Sentaurus 工具链隐式注入的变量白名单 */
const TCL_BUILTIN_VARS = new Set([
    'DesName', 'Pwd', 'Pd', 'ProjDir', 'Tooldir', 'env',
    'TOOLS_PRE', 'TOOLS_POST',
]);

/** Scheme (SDE) 隐式变量白名单 */
const SCHEME_BUILTIN_VARS = new Set([
    'argc', 'argv',
    'PI',         // SDE 预定义数学常量
]);

/** Tcl 语言集合 */
const TCL_LANG_SET = astUtils.TCL_LANGS;

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

/**
 * 注册未定义变量诊断（Tcl 方言部分）。
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('undef-var-tcl');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const doc = event.document;
            const langId = doc.languageId;
            if (!TCL_LANG_SET.has(langId) && langId !== 'sde') return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            const langId = doc.languageId;
            if (!TCL_LANG_SET.has(langId) && langId !== 'sde') return;
            updateDiagnostics(doc);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            const langId = doc.languageId;
            if (TCL_LANG_SET.has(langId) || langId === 'sde') {
                diagnosticCollection.delete(doc.uri);
            }
        })
    );

    // 主动扫描已在编辑器中打开的文档（onDidOpenTextDocument 不覆盖激活前已打开的文件）
    for (const doc of vscode.workspace.textDocuments) {
        const langId = doc.languageId;
        if (TCL_LANG_SET.has(langId) || langId === 'sde') {
            updateDiagnostics(doc);
        }
    }
}

/**
 * 更新单个文档的未定义变量诊断。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const text = doc.getText();
    const langId = doc.languageId;

    let diagnostics;
    if (langId === 'sde') {
        diagnostics = checkSchemeUndefVars(text);
    } else {
        diagnostics = checkTclUndefVars(text);
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}

/**
 * 检查 Tcl 代码中的未定义变量引用。
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkTclUndefVars(text) {
    const tree = astUtils.parseSafe(text);
    if (!tree) return [];

    try {
        const root = tree.rootNode;
        const refs = astUtils.getVariableRefs(root);
        const scopeMap = astUtils.buildScopeMap(root);

        const diagnostics = [];
        for (const ref of refs) {
            // 跳过白名单变量
            if (TCL_BUILTIN_VARS.has(ref.name)) continue;

            // 检查引用行是否可见该变量
            const visibleAtLine = scopeMap.get(ref.line);
            if (!visibleAtLine || !visibleAtLine.has(ref.name)) {
                const range = new vscode.Range(
                    ref.line - 1, ref.startCol,
                    ref.line - 1, ref.endCol
                );
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `未定义的变量: ${ref.name}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'undef-var';
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    } finally {
        tree.delete();
    }
}

/**
 * 加载 Scheme 已知名称集合（SDE 内置函数 + Scheme 标准函数）。
 * 惰性加载，只初始化一次。
 * @returns {Set<string>}
 */
let _schemeKnownNames = null;
function getSchemeKnownNames() {
    if (_schemeKnownNames) return _schemeKnownNames;

    _schemeKnownNames = new Set();

    // 从 all_keywords.json 加载 SDE 所有等级的关键词（KEYWORD1/2、FUNCTION）
    // 这是普适规则：语法文件中定义的所有关键词均视为已知名称，不会被误报为未定义变量
    try {
        const allKw = require('../../../syntaxes/all_keywords.json');
        const sdeKw = allKw && allKw.sde;
        if (sdeKw) {
            for (const cat of ['KEYWORD1', 'KEYWORD2', 'FUNCTION']) {
                if (sdeKw[cat]) {
                    for (const name of sdeKw[cat]) {
                        _schemeKnownNames.add(name);
                    }
                }
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 添加白名单变量
    for (const name of SCHEME_BUILTIN_VARS) {
        _schemeKnownNames.add(name);
    }

    return _schemeKnownNames;
}

const SCOPE_TYPE_LABELS = {
    global: '全局',
    function: '函数',
    let: 'let',
    lambda: 'lambda',
};

/**
 * 检测同一作用域内的重复定义。
 * @param {object} scopeTree - buildScopeTree 返回的作用域树
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeDuplicateDefs(scopeTree) {
    const diagnostics = [];

    function walkScope(scope) {
        const seen = new Map(); // name → first definition
        for (const def of scope.definitions) {
            if (seen.has(def.name)) {
                const first = seen.get(def.name);
                const range = new vscode.Range(
                    def.line - 1, def.start,
                    def.line - 1, def.end
                );
                const scopeLabel = SCOPE_TYPE_LABELS[scope.type] || scope.type;
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `重复定义: '${def.name}' 已在第 ${first.line} 行定义（当前作用域: ${scopeLabel}）`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'dup-def';
                diagnostics.push(diagnostic);
            } else {
                seen.set(def.name, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return diagnostics;
}

/**
 * 检查 Scheme 代码中的未定义变量引用。
 * @param {string} text - 文档文本
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeUndefVars(text) {
    const { ast } = schemeParser.parse(text);
    if (!ast) return [];

    const scopeTree = scopeAnalyzer.buildScopeTree(ast);
    const knownNames = getSchemeKnownNames();
    const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);

    const diagnostics = [];
    for (const ref of refs) {
        // 跳过已知名称（内置函数等已在 getSchemeRefs 中过滤）
        // 这里额外检查作用域内可见性
        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, ref.line);
        const isVisible = visible.some(d => d.name === ref.name);

        if (!isVisible) {
            const range = new vscode.Range(
                ref.line - 1, ref.start,
                ref.line - 1, ref.end
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `未定义的变量: ${ref.name}`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'undef-var';
            diagnostics.push(diagnostic);
        }
    }

    // 检测同作用域内的重复定义
    diagnostics.push(...checkSchemeDuplicateDefs(scopeTree));

    return diagnostics;
}

module.exports = { activate, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
