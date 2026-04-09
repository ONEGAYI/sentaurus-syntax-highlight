const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * Map keyword categories to VSCode CompletionItemKind.
 * Aligns with TextMate scope mapping in extract_keywords.py:
 *   KEYWORD1 -> keyword.control, KEYWORD2 -> keyword.other,
 *   KEYWORD3 -> entity.name.tag, KEYWORD4 -> support.class, etc.
 */
const KIND_MAP = {
    KEYWORD1: vscode.CompletionItemKind.Keyword,
    KEYWORD2: vscode.CompletionItemKind.Keyword,
    KEYWORD3: vscode.CompletionItemKind.Struct,
    KEYWORD4: vscode.CompletionItemKind.Class,
    LITERAL1: vscode.CompletionItemKind.Constant,
    LITERAL2: vscode.CompletionItemKind.Value,
    LITERAL3: vscode.CompletionItemKind.EnumMember,
    FUNCTION: vscode.CompletionItemKind.Function,
};

/** Sort prefix: keywords/functions first, then classes/tags, then literals. */
const SORT_PREFIX = {
    KEYWORD1: '0', KEYWORD2: '0', FUNCTION: '0',
    KEYWORD3: '1', KEYWORD4: '1',
    LITERAL1: '2', LITERAL2: '2', LITERAL3: '2',
};

/** Human-readable category label shown in completion detail. */
const DETAIL_LABEL = {
    KEYWORD1: 'Control Keyword', KEYWORD2: 'Keyword',
    KEYWORD3: 'Tag', KEYWORD4: 'Class',
    LITERAL1: 'Constant', LITERAL2: 'Numeric Literal', LITERAL3: 'String Literal',
    FUNCTION: 'Function',
};

/**
 * Build completion items for a single language module.
 * Items are created once at activation and reused on every trigger.
 */
function buildItems(moduleKeywords) {
    const items = [];
    for (const [category, keywords] of Object.entries(moduleKeywords)) {
        const kind = KIND_MAP[category] || vscode.CompletionItemKind.Text;
        const prefix = SORT_PREFIX[category] || '3';
        const detail = DETAIL_LABEL[category] || category;

        for (const keyword of keywords) {
            const item = new vscode.CompletionItem(keyword, kind);
            item.detail = detail;
            item.sortText = prefix + keyword;
            items.push(item);
        }
    }
    return items;
}

function activate(context) {
    const keywordsPath = path.join(__dirname, '..', 'syntaxes', 'all_keywords.json');
    let allKeywords;

    try {
        allKeywords = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
    } catch (err) {
        console.error('Sentaurus TCAD: failed to load keywords', err);
        return;
    }

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect'];

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

        const items = buildItems(moduleKeywords);

        const disposable = vscode.languages.registerCompletionItemProvider(
            { language: langId },
            {
                provideCompletionItems() {
                    return items;
                },
            }
        );

        context.subscriptions.push(disposable);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
