// src/docs-loader.js
'use strict';

const vscode = require('vscode');

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
    MATHFUNC: vscode.CompletionItemKind.Function,
    SUBCOMMAND: vscode.CompletionItemKind.Method,
    MATERIAL: vscode.CompletionItemKind.Constant,
};

/** Sort prefix: keywords/functions first, then classes/tags, then literals. */
const SORT_PREFIX = {
    KEYWORD1: '0', KEYWORD2: '0', FUNCTION: '0', MATHFUNC: '0', SUBCOMMAND: '0',
    KEYWORD3: '1', KEYWORD4: '1',
    LITERAL1: '2', LITERAL2: '2', LITERAL3: '2',
    MATERIAL: '2',
};

/** Human-readable category label shown in completion detail. */
const DETAIL_LABEL = {
    KEYWORD1: 'Function', KEYWORD2: 'Keyword',
    KEYWORD3: 'Tag', KEYWORD4: 'Class',
    LITERAL1: 'Constant', LITERAL2: 'Numeric Literal', LITERAL3: 'String Literal',
    FUNCTION: 'Function',
    MATHFUNC: 'Math Function',
    SUBCOMMAND: 'Tcl Subcommand',
    MATERIAL: 'Material',
};

/** Labels used in formatted documentation (i18n). */
const DOC_LABELS = {
    parameters: '**Parameters:**',
    example: '**Example:**',
    section: 'Section:',
    keywords: 'Keywords:',
};

/**
 * Format a function doc entry into a VSCode MarkdownString.
 */
function formatDoc(doc, langId) {
    const lines = [];
    lines.push('```' + langId);
    lines.push(doc.signature);
    lines.push('```');
    if (doc.section) {
        lines.push('');
        lines.push(`*${DOC_LABELS.section} ${doc.section}*`);
    }
    lines.push('');
    lines.push(doc.description);
    if (doc.parameters && doc.parameters.length) {
        lines.push('');
        lines.push(DOC_LABELS.parameters);
        for (const p of doc.parameters) {
            lines.push(`- \`${p.name}\` (\`${p.type}\`) — ${p.desc}`);
        }
    }
    if (doc.example) {
        lines.push('');
        lines.push(DOC_LABELS.example);
        lines.push('```' + langId);
        lines.push(doc.example);
        lines.push('```');
    }
    if (doc.keywords && doc.keywords.length) {
        lines.push('');
        lines.push(`*${DOC_LABELS.keywords} ${doc.keywords.join(', ')}*`);
    }
    return new vscode.MarkdownString(lines.join('\n'));
}

// === SDE Snippet Prefix Customization ===
const DEFAULT_PREFIXES = {
    RW: 'RW.', DC: 'DC.', CPP: 'CPP.', CPM: 'CPM.',
    GAUSS: 'GAUSS.', IMP: 'IMP.', SM: 'SM.', PSM: 'PSM.',
    RS: 'RS.', RP: 'RP.',
};

/**
 * Replace official prefix literals in SDE snippet text with user-customized ones.
 * Only called when inserting SDE (Sentaurus-StructEditor) snippets.
 */
function applySnippetPrefixes(snippetText) {
    const config = vscode.workspace.getConfiguration('sentaurus.snippetPrefixes');
    let result = snippetText;
    for (const [key, defaultVal] of Object.entries(DEFAULT_PREFIXES)) {
        const custom = config.get(key);
        if (custom !== undefined && custom !== defaultVal) {
            result = result.replaceAll(`"${defaultVal}"`, `"${custom}"`);
        }
    }
    return result;
}

module.exports = {
    KIND_MAP,
    SORT_PREFIX,
    DETAIL_LABEL,
    DOC_LABELS,
    DEFAULT_PREFIXES,
    formatDoc,
    applySnippetPrefixes,
};
