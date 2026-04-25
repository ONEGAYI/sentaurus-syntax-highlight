// src/lsp/providers/variable-reference-provider.js
'use strict';

const { getSchemeRefs, getVisibleDefinitions } = require('../scope-analyzer');
const { getVariableRefs, buildScopeIndex, TCL_LANGS } = require('../tcl-ast-utils');

let schemeCache;
let tclCache;
let vscode;

function activate(context, schemeCacheInstance, tclCacheInstance, vscodeRef) {
    schemeCache = schemeCacheInstance;
    tclCache = tclCacheInstance;
    vscode = vscodeRef;

    const langIds = ['sde', ...Array.from(TCL_LANGS)];

    for (const langId of langIds) {
        const capturedLangId = langId;
        const provider = {
            provideReferences(document, position, options) {
                if (capturedLangId === 'sde') {
                    return provideSchemeReferences(document, position, options);
                } else {
                    return provideTclReferences(document, position, options);
                }
            },
        };
        const disposable = vscode.languages.registerReferenceProvider(
            { language: capturedLangId },
            provider
        );
        context.subscriptions.push(disposable);
    }
}

function provideSchemeReferences(document, position, options) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, scopeTree, lineStarts } = entry;

    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
    if (!range) return null;
    const word = document.getText(range);
    if (!word) return null;

    // Skip comments: check for `;` before cursor on same line (outside strings)
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    for (let i = 0; i < col; i++) {
        if (lineText[i] === ';') return null;
        if (lineText[i] === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } }
    }

    const cursorLine = position.line + 1;
    const visibleDefs = getVisibleDefinitions(scopeTree, cursorLine);
    const targetDef = visibleDefs.find(d => d.name === word);
    if (!targetDef) return null;

    const refs = getSchemeRefs(ast);
    const locations = [];

    // Add definition location
    if (options.includeDeclaration !== false) {
        const defStartCol = targetDef.start - lineStarts[targetDef.line - 1];
        const defEndCol = targetDef.end - lineStarts[targetDef.line - 1];
        locations.push(new vscode.Location(
            document.uri,
            new vscode.Range(targetDef.line - 1, defStartCol, targetDef.line - 1, defEndCol)
        ));
    }

    // Filter references — only include refs that resolve to the same definition
    for (const ref of refs) {
        if (ref.name !== word) continue;
        // Skip the definition site itself (exact match)
        if (ref.line === targetDef.line && ref.start === targetDef.start && ref.end === targetDef.end) continue;

        const refVisibleDefs = getVisibleDefinitions(scopeTree, ref.line);
        const resolvesToSame = refVisibleDefs.some(
            d => d.name === word && d.line === targetDef.line && d.start === targetDef.start
        );
        if (resolvesToSame) {
            const startCol = ref.start - lineStarts[ref.line - 1];
            const endCol = ref.end - lineStarts[ref.line - 1];
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(ref.line - 1, startCol, ref.line - 1, endCol)
            ));
        }
    }

    return locations.length > 0 ? locations : null;
}

function provideTclReferences(document, position, options) {
    const entry = tclCache.get(document);
    if (!entry || !entry.tree) return null;

    const { tree } = entry;
    const root = tree.rootNode;

    // Extract word — try $varName first, then plain word
    const dollarRange = document.getWordRangeAtPosition(position, /\$[\w:-]+/);
    const plainRange = document.getWordRangeAtPosition(position, /[\w:-]+/);
    const range = dollarRange || plainRange;
    if (!range) return null;

    let word = document.getText(range);
    if (!word) return null;
    if (word.startsWith('$')) word = word.slice(1);
    if (!word) return null;

    // Skip comments: check for `#` before cursor on same line (outside strings)
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    for (let i = 0; i < col; i++) {
        if (lineText[i] === '#') return null;
        if (lineText[i] === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } }
    }

    const cursorLine = position.line + 1;
    const scopeIndex = buildScopeIndex(root);
    const targetDef = scopeIndex.resolveDefinition(word, cursorLine);
    if (!targetDef) return null;

    const refs = getVariableRefs(root);
    const locations = [];

    // Add definition location (use word-boundary matching for precise column)
    if (options.includeDeclaration !== false) {
        const defLine0 = targetDef.defLine - 1;
        const defLineText = document.lineAt(defLine0).text;
        const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
        const match = re.exec(defLineText);
        if (match) {
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
            ));
        }
    }

    // Filter references — only include refs that resolve to the same definition
    for (const ref of refs) {
        if (ref.name !== word) continue;
        const refDef = scopeIndex.resolveDefinition(ref.name, ref.line);
        if (!refDef || refDef.defLine !== targetDef.defLine) continue;
        // Skip refs on the definition line itself (avoid duplicating the definition site)
        if (ref.line === targetDef.defLine) continue;

        locations.push(new vscode.Location(
            document.uri,
            new vscode.Range(ref.line - 1, ref.startCol, ref.line - 1, ref.endCol)
        ));
    }

    return locations.length > 0 ? locations : null;
}

module.exports = { activate, provideSchemeReferences, provideTclReferences };
