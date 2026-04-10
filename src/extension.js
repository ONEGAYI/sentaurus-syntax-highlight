const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * Map keyword categories to VSCode CompletionItemKind.
 * Aligns with TextMate scope mapping in extract_keywords.py:
 *   KEYWORD1 -> support.function, KEYWORD2 -> keyword.other,
 *   KEYWORD3 -> entity.name.tag, KEYWORD4 -> support.class, etc.
 */
const KIND_MAP = {
    KEYWORD1: vscode.CompletionItemKind.Function,
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
    KEYWORD1: 'Function', KEYWORD2: 'Keyword',
    KEYWORD3: 'Tag', KEYWORD4: 'Class',
    LITERAL1: 'Constant', LITERAL2: 'Numeric Literal', LITERAL3: 'String Literal',
    FUNCTION: 'Function',
};

/**
 * Format a function doc entry into a VSCode MarkdownString.
 */
function formatDoc(doc) {
    const lines = [];
    lines.push(`**${doc.signature}**`);
    lines.push('');
    lines.push(doc.description);
    if (doc.parameters && doc.parameters.length) {
        lines.push('');
        lines.push('**Parameters:**');
        for (const p of doc.parameters) {
            lines.push(`- \`${p.name}\` (\`${p.type}\`) — ${p.desc}`);
        }
    }
    if (doc.example) {
        lines.push('');
        lines.push('**Example:**');
        lines.push('```scheme');
        lines.push(doc.example);
        lines.push('```');
    }
    return new vscode.MarkdownString(lines.join('\n'));
}

/**
 * Build completion items for a single language module.
 * Items are created once at activation and reused on every trigger.
 */
function buildItems(moduleKeywords, funcDocs) {
    const items = [];
    for (const [category, keywords] of Object.entries(moduleKeywords)) {
        const kind = KIND_MAP[category] || vscode.CompletionItemKind.Text;
        const prefix = SORT_PREFIX[category] || '3';
        const detail = DETAIL_LABEL[category] || category;

        for (const keyword of keywords) {
            const item = new vscode.CompletionItem(keyword, kind);
            item.detail = detail;
            item.sortText = prefix + keyword;
            if (funcDocs[keyword]) {
                item.documentation = formatDoc(funcDocs[keyword]);
            }
            items.push(item);
        }
    }
    return items;
}

function activate(context) {
    const keywordsPath = path.join(__dirname, '..', 'syntaxes', 'all_keywords.json');
    const funcDocsPath = path.join(__dirname, '..', 'syntaxes', 'sde_function_docs.json');
    let allKeywords;
    let funcDocs = {};

    try {
        allKeywords = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
    } catch (err) {
        console.error('Sentaurus TCAD: failed to load keywords', err);
        return;
    }

    try {
        funcDocs = JSON.parse(fs.readFileSync(funcDocsPath, 'utf8'));
    } catch (_) {
        // Function docs file is optional; silently skip if missing
    }

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect'];

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

        const items = buildItems(moduleKeywords, funcDocs);

        const completionDisposable = vscode.languages.registerCompletionItemProvider(
            { language: langId },
            {
                provideCompletionItems() {
                    return items;
                },
            }
        );
        context.subscriptions.push(completionDisposable);

        // Register HoverProvider for function documentation
        const hoverDisposable = vscode.languages.registerHoverProvider(
            { language: langId },
            {
                provideHover(document, position) {
                    const range = document.getWordRangeAtPosition(position, /[\w:.-]+/);
                    if (!range) return null;
                    const word = document.getText(range);
                    const doc = funcDocs[word];
                    if (!doc) return null;
                    return new vscode.Hover(formatDoc(doc), range);
                },
            }
        );
        context.subscriptions.push(hoverDisposable);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
