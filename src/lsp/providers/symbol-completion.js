// src/lsp/providers/symbol-completion.js
'use strict';

const dispatcher = require('../semantic-dispatcher');
const { extractSymbols } = require('../symbol-index');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {object} */
let symbolParamsTable;
/** @type {object} */
let modeDispatchTable;
/** @type {object} */
let vscode;

function activate(context, schemeCacheInstance, symbolParams, modeDispatch, vscodeRef) {
    schemeCache = schemeCacheInstance;
    symbolParamsTable = symbolParams;
    modeDispatchTable = modeDispatch;
    vscode = vscodeRef;

    const provider = {
        provideCompletionItems(document, position) {
            return provideSymbolCompletions(document, position);
        },
    };
    const disposable = vscode.languages.registerCompletionItemProvider(
        { language: 'sde' },
        provider,
        '"'
    );
    context.subscriptions.push(disposable);
}

function provideSymbolCompletions(document, position) {
    const entry = schemeCache.get(document);
    if (!entry) return null;

    const { ast, text, lineStarts } = entry;
    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable || {}, lineStarts);
    if (!result) return null;
    const { functionName, activeParam } = result;

    const config = symbolParamsTable[functionName];
    if (!config || !config.symbolParams) return null;

    const matching = config.symbolParams.find(p => p.index === activeParam);
    if (!matching) return null;

    const { defs } = extractSymbols(ast, text, symbolParamsTable, modeDispatchTable);
    const targetType = matching.type;
    const seen = new Set();
    const items = [];

    for (const d of defs) {
        if (d.type === targetType && !seen.has(d.name)) {
            seen.add(d.name);
            const item = new vscode.CompletionItem(d.name, vscode.CompletionItemKind.Reference);
            item.detail = `${targetType} — defined line ${d.line}`;
            item.sortText = '5' + d.name;
            items.push(item);
        }
    }

    return items.length > 0 ? items : null;
}

module.exports = { activate, provideSymbolCompletions };
