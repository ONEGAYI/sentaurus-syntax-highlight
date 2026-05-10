// src/lsp/providers/variable-reference-provider.js
'use strict';

const { getSchemeRefs, getVisibleDefinitions } = require('../scope-analyzer');
const { getVariableRefs, TCL_LANGS } = require('../tcl-ast-utils');
const ppUtils = require('../pp-utils');

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

    const { ast, scopeTree, lineStarts, text: docText, ppDefs } = entry;

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

    // #define 宏引用查找（优先于作用域变量，不依赖 AST）
    const ppLocations = ppUtils.findPpDefineLocations(
        document.uri, word, cursorLine, entry.ppDefs, docText, options
    );
    if (ppLocations) return ppLocations;

    const visibleDefs = getVisibleDefinitions(scopeTree, cursorLine);
    const targetDef = visibleDefs.find(d => d.name === word);
    if (!targetDef) return null;

    const refs = getSchemeRefs(ast);
    const locations = [];

    // Add definition location
    if (options.includeDeclaration !== false) {
        const defStartCol = ppUtils.safeCol(lineStarts, targetDef.line, targetDef.start);
        const defEndCol = ppUtils.safeCol(lineStarts, targetDef.line, targetDef.end);
        locations.push(new vscode.Location(
            document.uri,
            new vscode.Range(targetDef.line - 1, defStartCol, targetDef.line - 1, defEndCol)
        ));
    }

    // Filter references — only include refs that resolve to the same definition
    const visibleCache = new Map();
    visibleCache.set(cursorLine, visibleDefs);
    for (const ref of refs) {
        if (ref.name !== word) continue;
        if (ref.line === targetDef.line && ref.start === targetDef.start && ref.end === targetDef.end) continue;

        if (!visibleCache.has(ref.line)) {
            visibleCache.set(ref.line, getVisibleDefinitions(scopeTree, ref.line));
        }
        const refVisibleDefs = visibleCache.get(ref.line);
        const resolvesToSame = refVisibleDefs.some(
            d => d.name === word && d.line === targetDef.line && d.start === targetDef.start
        );
        if (resolvesToSame) {
            const startCol = ppUtils.safeCol(lineStarts, ref.line, ref.start);
            const endCol = ppUtils.safeCol(lineStarts, ref.line, ref.end);
            locations.push(new vscode.Location(
                document.uri,
                new vscode.Range(ref.line - 1, startCol, ref.line - 1, endCol)
            ));
        }
    }

    return locations.length > 0 ? locations : null;
}

function provideTclReferences(document, position, options) {
    // Extract word — try ${varName}（花括号形式）first, then $varName, then plain word
    const bracedRange = document.getWordRangeAtPosition(position, /\$\{[\w:.\-<>?!+*/=]+\}/);
    const dollarRange = document.getWordRangeAtPosition(position, /(?<!\\)\$[\w:-]+/);
    const plainRange = document.getWordRangeAtPosition(position, /[\w:-]+/);
    const range = bracedRange || dollarRange || plainRange;
    if (!range) return null;

    let word = ppUtils.stripTclVarPrefix(document.getText(range));
    if (!word) return null;

    // Skip comments: check for `#` before cursor on same line (outside strings)
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    for (let i = 0; i < col; i++) {
        if (lineText[i] === '#') return null;
        if (lineText[i] === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } }
    }

    const cursorLine = position.line + 1;
    const locations = [];

    // #define 裸词引用（不依赖 WASM/AST）
    const entry = tclCache.get(document);
    const ppDefs = entry ? entry.ppDefs : [];
    const ppLocations = ppUtils.findPpDefineLocations(
        document.uri, word, cursorLine, ppDefs, entry ? entry.text : '', options
    );
    if (ppLocations) {
        locations.push(...ppLocations);
    }

    // Tcl 变量引用（需要 WASM）
    if (entry && entry.tree) {
        const scopeIndex = tclCache.getScopeIndex(document);
        const targetDef = scopeIndex ? scopeIndex.resolveDefinition(word, cursorLine) : null;

        if (targetDef) {
            // Add definition location
            if (options.includeDeclaration !== false) {
                const defLine0 = targetDef.defLine - 1;
                const defLineText = document.lineAt(defLine0).text;
                const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
                const match = re.exec(defLineText);
                if (match) {
                    const isDup = locations.some(loc =>
                        loc.range.start.line === defLine0 &&
                        loc.range.start.character === match.index
                    );
                    if (!isDup) {
                        locations.push(new vscode.Location(
                            document.uri,
                            new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
                        ));
                    }
                }
            }

            // Filter references — only include refs that resolve to the same definition
            const refs = getVariableRefs(entry.tree.rootNode);
            for (const ref of refs) {
                if (ref.name !== word) continue;
                const refDef = scopeIndex.resolveDefinition(ref.name, ref.line);
                if (!refDef || refDef.defLine !== targetDef.defLine) continue;
                if (ref.line === targetDef.defLine) continue;

                const isDup = locations.some(loc =>
                    loc.range.start.line === ref.line - 1 &&
                    loc.range.start.character === ref.startCol
                );
                if (!isDup) {
                    locations.push(new vscode.Location(
                        document.uri,
                        new vscode.Range(ref.line - 1, ref.startCol, ref.line - 1, ref.endCol)
                    ));
                }
            }
        }
    }

    return locations.length > 0 ? locations : null;
}

module.exports = { activate, provideSchemeReferences, provideTclReferences };
