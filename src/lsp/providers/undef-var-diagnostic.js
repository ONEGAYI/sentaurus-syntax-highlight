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
    'position',   // SDE 内置构造函数，未在 sde_function_docs.json 中收录
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

    // 从 SDE 函数文档加载内置函数名
    try {
        const sdeDocs = require('../../../syntaxes/sde_function_docs.json');
        if (sdeDocs) {
            for (const key of Object.keys(sdeDocs)) {
                _schemeKnownNames.add(key);
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 从 Scheme 标准函数文档加载
    try {
        const schemeDocs = require('../../../syntaxes/scheme_function_docs.json');
        if (schemeDocs) {
            for (const key of Object.keys(schemeDocs)) {
                _schemeKnownNames.add(key);
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 添加白名单变量
    for (const name of SCHEME_BUILTIN_VARS) {
        _schemeKnownNames.add(name);
    }

    return _schemeKnownNames;
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

    return diagnostics;
}

module.exports = { activate, checkTclUndefVars, checkSchemeUndefVars, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
