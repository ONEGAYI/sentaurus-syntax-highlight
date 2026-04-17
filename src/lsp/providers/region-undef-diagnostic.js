// src/lsp/providers/region-undef-diagnostic.js
'use strict';

const vscode = require('vscode');
const { extractSymbols } = require('../symbol-index');

const DEBOUNCE_MS = 500;

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;
/** @type {NodeJS.Timeout} */
let debounceTimer;

/**
 * 注册 Region/Material/Contact 未定义语义诊断。
 */
function activate(context, schemeCacheInstance, symbolParams, modeDispatch) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;

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
    const { defs, refs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const definedNames = new Set(defs.map(d => `${d.type}:${d.name}`));

    const diagnostics = [];
    const typeLabels = { region: 'Region', material: 'Material', contact: 'Contact' };

    for (const ref of refs) {
        if (!definedNames.has(`${ref.type}:${ref.name}`)) {
            // ref.start/ref.end 是文档级偏移量，需转为行内列号
            const startCol = ref.start - lineStarts[ref.line - 1];
            const endCol = ref.end - lineStarts[ref.line - 1];
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
