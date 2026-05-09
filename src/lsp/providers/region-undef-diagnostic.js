// src/lsp/providers/region-undef-diagnostic.js
'use strict';

const vscode = require('vscode');
const { safeCol } = require('../pp-utils');

const DEBOUNCE_MS = 500;

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {Set<string>} */
let builtinMaterials;
/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

function activate(context, schemeCacheInstance, materials) {
    schemeCache = schemeCacheInstance;
    builtinMaterials = materials || new Set();

    diagnosticCollection = vscode.languages.createDiagnosticCollection('sde-symbol-undef');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId !== 'sde') return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateDiagnostics(event.document), DEBOUNCE_MS);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (doc.languageId === 'sde') updateDiagnostics(doc);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (doc.languageId === 'sde') diagnosticCollection.delete(doc.uri);
        })
    );

    // 主动扫描已在编辑器中打开的文档
    for (const doc of vscode.workspace.textDocuments) {
        if (doc.languageId === 'sde') updateDiagnostics(doc);
    }
}

function updateDiagnostics(doc) {
    const entry = schemeCache.get(doc);
    if (!entry) return;

    const { ast, text, lineStarts } = entry;
    const symbolsResult = schemeCache.getSymbols(doc);
    if (!symbolsResult) return;
    const { defs, refs } = symbolsResult;
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));

    const diagnostics = [];
    const typeLabels = { region: 'Region', material: 'Material', contact: 'Contact' };

    for (const ref of refs) {
        if (ref.type === 'material' && builtinMaterials.has(ref.name)) continue;
        if (!definedNames.has(`${ref.type}:${ref.name}`)) {
            const startCol = safeCol(lineStarts, ref.line, ref.start);
            const endCol = safeCol(lineStarts, ref.line, ref.end);
            const range = new vscode.Range(
                ref.line - 1, startCol,
                ref.line - 1, endCol
            );
            const label = typeLabels[ref.type] || ref.type;
            const diagnostic = new vscode.Diagnostic(
                range,
                `${label} '${ref.name}' 未定义`,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'sde-symbol';
            diagnostics.push(diagnostic);
        }
    }

    diagnosticCollection.set(doc.uri, diagnostics);
}

module.exports = { activate };
