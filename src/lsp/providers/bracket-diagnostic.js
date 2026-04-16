// src/lsp/providers/bracket-diagnostic.js
'use strict';

const vscode = require('vscode');

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;
/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;

const DEBOUNCE_MS = 500;

/**
 * Activate bracket diagnostics.
 * @param {vscode.ExtensionContext} context
 * @param {import('../parse-cache').SchemeParseCache} cache
 */
function activate(context, cache) {
    schemeCache = cache;
    diagnosticCollection = vscode.languages.createDiagnosticCollection('sde-brackets');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const doc = event.document;
            if (doc.languageId !== 'sde') return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(doc), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );
}

/**
 * Update diagnostics for a single document.
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
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
}

module.exports = { activate };
