// src/lsp/providers/region-undef-diagnostic.js
'use strict';

const vscode = require('vscode');
const { safeCol } = require('../pp-utils');
const { createDiagnosticProvider } = require('./diagnostic-factory');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {Set<string>} */
let builtinMaterials;
/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;

function activate(context, schemeCacheInstance, materials) {
    schemeCache = schemeCacheInstance;
    builtinMaterials = materials || new Set();

    ({ diagnosticCollection } = createDiagnosticProvider({
        name: 'sde-symbol-undef',
        languageFilter: doc => doc.languageId === 'sde',
        context,
        updateFn: updateDiagnostics,
    }));
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
