// src/lsp/providers/bracket-diagnostic.js
'use strict';

const vscode = require('vscode');
const { createDiagnosticProvider } = require('./diagnostic-factory');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;

/**
 * Activate bracket diagnostics.
 * @param {vscode.ExtensionContext} context
 * @param {import('../parse-cache').SchemeParseCache} cache
 */
function activate(context, cache) {
    schemeCache = cache;

    ({ diagnosticCollection } = createDiagnosticProvider({
        name: 'sde-brackets',
        languageFilter: doc => doc.languageId === 'sde',
        context,
        updateFn: updateDiagnostics,
        watchOpen: false,
    }));
}

/**
 * Update diagnostics for a single document.
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    try {
        const { errors } = schemeCache.get(doc);

        const diagnostics = errors.map(err => {
            const range = new vscode.Range(
                doc.positionAt(err.start),
                doc.positionAt(err.end)
            );
            const severity = err.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;
            const diagnostic = new vscode.Diagnostic(range, err.message, severity);
            diagnostic.source = 'sde-brackets';
            return diagnostic;
        });

        diagnosticCollection.set(doc.uri, diagnostics);
    } catch (e) {
        console.error('Sentaurus: bracket diagnostic error', e);
        diagnosticCollection.set(doc.uri, []);
    }
}

module.exports = { activate };
