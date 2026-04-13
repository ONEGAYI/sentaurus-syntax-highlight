const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defs = require('./definitions');
const foldingProvider = require('./lsp/providers/folding-provider');
const bracketDiagnostic = require('./lsp/providers/bracket-diagnostic');

/** Decode HTML entities (&gt; &lt; &amp;) used in all_keywords.json. */
function decodeHtml(str) {
    return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

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
function formatDoc(doc) {
    const lines = [];
    lines.push(`**${doc.signature}**`);
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
        // sdevice 使用 Tcl 语法，其他语言沿用 scheme
        const lang = doc.section ? 'tcl' : 'scheme';
        lines.push('```' + lang);
        lines.push(doc.example);
        lines.push('```');
    }
    if (doc.keywords && doc.keywords.length) {
        lines.push('');
        lines.push(`*${DOC_LABELS.keywords} ${doc.keywords.join(', ')}*`);
    }
    return new vscode.MarkdownString(lines.join('\n'));
}

/**
 * Load a JSON file from the syntaxes directory.
 * When preferZh is true, tries the .zh-CN variant first, falls back to default.
 * Returns null if neither file exists.
 */
function loadDocsJson(filename, preferZh) {
    const syntaxesDir = path.join(__dirname, '..', 'syntaxes');
    if (preferZh) {
        const localeFile = filename.replace(/\.json$/, '.zh-CN.json');
        try {
            return JSON.parse(fs.readFileSync(path.join(syntaxesDir, localeFile), 'utf8'));
        } catch (_) {}
    }
    try {
        return JSON.parse(fs.readFileSync(path.join(syntaxesDir, filename), 'utf8'));
    } catch (_) {}
    return null;
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

        for (const rawKeyword of keywords) {
            const keyword = decodeHtml(rawKeyword);
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

// === QuickPick Snippet Data ===
const sdeSnippets = require('./snippets/sde');
const sdeviceSnippets = require('./snippets/sdevice');
const sprocessSnippets = require('./snippets/sprocess');
const inspectSnippets = require('./snippets/inspect');
const meshSnippets = require('./snippets/mesh');

/** Map QuickPick category labels to snippet data modules. */
const snippetMap = {
    'Sentaurus-StructEditor': sdeSnippets,
    'Sentaurus-Device': sdeviceSnippets,
    'Sentaurus-Process': sprocessSnippets,
    'Sentaurus-Inspect': inspectSnippets,
    'Sentaurus-Mesh': meshSnippets,
};

/**
 * Generic snippet QuickPick for any Sentaurus tool.
 * Two-level navigation: Category -> Snippet -> Insert.
 */
async function showToolSnippets(editor, snippetData, toolName) {
    const BACK = '$(arrow-left) Back';

    categoryLoop:
    while (true) {
        const categories = Object.keys(snippetData);
        const catItems = [
            { label: BACK },
            ...categories.map(c => ({ label: c, description: '$(chevron-right)' })),
        ];
        const cat = await vscode.window.showQuickPick(catItems, {
            placeHolder: 'Select a ' + toolName + ' category...',
        });
        if (!cat || cat.label === BACK) return;

        // Flatten nested sub-categories into a single list for this category
        const entries = [];
        for (const [subName, subData] of Object.entries(snippetData[cat.label])) {
            if (subData.lines) {
                entries.push({ label: subName, detail: subData.desc, data: subData });
            } else {
                for (const [leafName, leafData] of Object.entries(subData)) {
                    entries.push({ label: subName + ' / ' + leafName, detail: leafData.desc, data: leafData });
                }
            }
        }

        while (true) {
            const subItems = [
                { label: BACK },
                ...entries,
            ];
            const sub = await vscode.window.showQuickPick(subItems, {
                placeHolder: 'Select a ' + cat.label + ' snippet...',
            });
            if (!sub || sub.label === BACK) continue categoryLoop;

            let snippetText = sub.data.lines.join('\n') + '\n';
            if (toolName === 'Sentaurus-StructEditor') {
                snippetText = applySnippetPrefixes(snippetText);
            }
            await editor.insertSnippet(new vscode.SnippetString(snippetText));
            return;
        }
    }
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

    // Detect locale for i18n
    const useZh = vscode.env.language.startsWith('zh');
    if (useZh) {
        DOC_LABELS.parameters = '**参数：**';
        DOC_LABELS.example = '**示例：**';
        DOC_LABELS.section = '节：';
        DOC_LABELS.keywords = '关键词：';
    }

    // Load SDE function docs (try zh-CN first, fallback to en)
    const funcDocs = loadDocsJson('sde_function_docs.json', useZh) || {};

    // 加载 Scheme 内置函数文档并合并
    const schemeDocs = loadDocsJson('scheme_function_docs.json', useZh);
    if (schemeDocs) {
        Object.assign(funcDocs, schemeDocs);
    }

    // 加载 sdevice 命令文档并合并
    const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', useZh);
    if (sdeviceDocs) {
        Object.assign(funcDocs, sdeviceDocs);
    }

    // FoldingRangeProvider (SDE only)
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'sde' },
            foldingProvider
        )
    );

    // Bracket diagnostic (SDE only)
    bracketDiagnostic.activate(context);

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect'];

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

        const items = buildItems(moduleKeywords, funcDocs);

        const completionDisposable = vscode.languages.registerCompletionItemProvider(
            { language: langId },
            {
                provideCompletionItems(document) {
                    const userDefs = defs.getDefinitions(document, langId);
                    if (userDefs.length === 0) return items;

                    // 去重：跳过与静态关键词同名的用户变量
                    const staticNames = new Set(items.map(it => it.label));
                    const userItems = userDefs
                        .filter(d => !staticNames.has(d.name))
                        // 同名变量可能在多处定义，去重
                        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i)
                        .map(d => {
                            const item = new vscode.CompletionItem(d.name, vscode.CompletionItemKind.Variable);
                            item.detail = 'User Variable';
                            item.sortText = '4' + d.name;
                            item.documentation = new vscode.MarkdownString('```scheme\n' + d.definitionText + '\n```');
                            return item;
                        });

                    return [...items, ...userItems];
                },
            }
        );
        context.subscriptions.push(completionDisposable);

        // 辅助函数：判断光标是否在注释行中
        function isInComment(document, position) {
            const lineText = document.lineAt(position.line).text;
            const col = position.character;
            // SDE (Scheme): ; 注释；其他 (Tcl): # 和 * 注释
            const commentChars = langId === 'sde' ? ';' : '#';
            for (let i = 0; i < col; i++) {
                const ch = lineText[i];
                if (ch === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } continue; }
                if (ch === commentChars) return true;
                if (langId !== 'sde' && ch === '*' && (i === 0 || lineText.slice(0, i).trim() === '')) return true;
            }
            return false;
        }

        // Register HoverProvider for function documentation
        const hoverDisposable = vscode.languages.registerHoverProvider(
            { language: langId },
            {
                provideHover(document, position) {
                    if (isInComment(document, position)) return null;
                    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
                    if (!range) return null;
                    const word = document.getText(range);

                    // 1. 查函数文档（优先）
                    const doc = funcDocs[word] || funcDocs[decodeHtml(word)];
                    if (doc) return new vscode.Hover(formatDoc(doc), range);

                    // 2. 查用户变量定义
                    const userDefs = defs.getDefinitions(document, langId);
                    const def = userDefs.find(d => d.name === word);
                    if (def) {
                        const md = new vscode.MarkdownString();
                        md.appendMarkdown(`**${def.name}** (用户变量, 第 ${def.line} 行)\n\n`);
                        md.appendCodeblock(def.definitionText, langId === 'sde' ? 'scheme' : 'tcl');
                        return new vscode.Hover(md, range);
                    }

                    return null;
                },
            }
        );
        context.subscriptions.push(hoverDisposable);

        // Register DefinitionProvider for user-defined variables
        const definitionDisposable = vscode.languages.registerDefinitionProvider(
            { language: langId },
            {
                provideDefinition(document, position) {
                    if (isInComment(document, position)) return null;
                    const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
                    if (!range) return null;
                    const word = document.getText(range);

                    const userDefs = defs.getDefinitions(document, langId);
                    const def = userDefs.find(d => d.name === word);
                    if (!def) return null;

                    const targetLine = def.line - 1; // 0-indexed
                    const lineLength = document.lineAt(targetLine).text.length;
                    return new vscode.Location(
                        document.uri,
                        new vscode.Range(targetLine, 0, targetLine, lineLength)
                    );
                },
            }
        );
        context.subscriptions.push(definitionDisposable);
    }

    // === Snippet QuickPick Command ===
    const snippetCategories = [
        'Sentaurus-Device', 'Sentaurus-Inspect', 'Sentaurus-Mesh',
        'Sentaurus-Process', 'Sentaurus-StructEditor',
    ];

    const snippetDisposable = vscode.commands.registerCommand('sentaurus.insertSnippet', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        while (true) {
            const items = snippetCategories.map(label => ({
                label,
                description: '$(chevron-right)',
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a snippet category...',
            });

            if (!selected) return; // Esc at top level → exit

            const snippetData = snippetMap[selected.label];
            if (snippetData) {
                await showToolSnippets(editor, snippetData, selected.label);
                // showToolSnippets returns on Back or Esc → re-show top level
            }
        }
    });
    context.subscriptions.push(snippetDisposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
