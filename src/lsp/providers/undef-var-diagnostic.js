// src/lsp/providers/undef-var-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');

const DEBOUNCE_MS = 500;

/** Sentaurus 工具链隐式注入的变量白名单 */
const TCL_BUILTIN_VARS = new Set([
    'DesName', 'Pwd', 'Pd', 'ProjDir', 'Tooldir', 'env',
    'TOOLS_PRE', 'TOOLS_POST',
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
            if (!TCL_LANG_SET.has(doc.languageId)) return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (!TCL_LANG_SET.has(doc.languageId)) return;
            updateDiagnostics(doc);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (TCL_LANG_SET.has(doc.languageId)) {
                diagnosticCollection.delete(doc.uri);
            }
        })
    );
}

/**
 * 更新单个文档的未定义变量诊断。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    const text = doc.getText();
    const diagnostics = checkTclUndefVars(text);

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

module.exports = { activate, checkTclUndefVars, TCL_BUILTIN_VARS };
