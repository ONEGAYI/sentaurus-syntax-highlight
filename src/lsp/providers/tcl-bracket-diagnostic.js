// src/lsp/providers/tcl-bracket-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');
const { createDiagnosticProvider } = require('./diagnostic-factory');

const TCL_LANG_SET = new Set(astUtils.TCL_LANGS);

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;

/**
 * Activate Tcl bracket diagnostics.
 * 为所有 Tcl 方言语言（sdevice, sprocess, emw, inspect）提供括号匹配诊断。
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    ({ diagnosticCollection } = createDiagnosticProvider({
        name: 'tcl-brackets',
        languageFilter: doc => TCL_LANG_SET.has(doc.languageId),
        context,
        updateFn: updateDiagnostics,
    }));
}

/**
 * 更新单个文档的诊断信息。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    try {
        const text = doc.getText();

        // 使用文本级括号平衡检查，无需 WASM 解析器
        const errors = astUtils.findMismatchedBraces(text);

        const diagnostics = errors.map(err => {
            const range = new vscode.Range(
                err.startLine, err.startCol,
                err.endLine, err.endCol
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                err.message,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'tcl-brackets';
            return diagnostic;
        });

        diagnosticCollection.set(doc.uri, diagnostics);
    } catch (e) {
        console.error('Sentaurus: tcl bracket diagnostic error', e);
        diagnosticCollection.set(doc.uri, []);
    }
}

module.exports = { activate };
