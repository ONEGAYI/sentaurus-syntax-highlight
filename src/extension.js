const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defs = require('./definitions');
const foldingProviderMod = require('./lsp/providers/folding-provider');
const bracketDiagnostic = require('./lsp/providers/bracket-diagnostic');
const scopeAnalyzer = require('./lsp/scope-analyzer');
const signatureProvider = require('./lsp/providers/signature-provider');
const expressionConverter = require('./commands/expression-converter');
const tclParserWasm = require('./lsp/tcl-parser-wasm');
const astUtils = require('./lsp/tcl-ast-utils');
const tclFoldingMod = require('./lsp/providers/tcl-folding-provider');
const tclBracketDiagnostic = require('./lsp/providers/tcl-bracket-diagnostic');
const undefVarDiagnostic = require('./lsp/providers/undef-var-diagnostic');
const tclDocSymbolMod = require('./lsp/providers/tcl-document-symbol-provider');
const schemeOnEnterProvider = require('./lsp/providers/scheme-on-enter-provider');
const unitAutoClose = require('./lsp/providers/unit-auto-close-provider');
const quoteAutoDelete = require('./lsp/providers/quote-auto-delete-provider');
const regionUndefDiagnostic = require('./lsp/providers/region-undef-diagnostic');
const symbolCompletion = require('./lsp/providers/symbol-completion');
const symbolReferenceProvider = require('./lsp/providers/symbol-reference-provider');
const { SchemeParseCache, TclParseCache } = require('./lsp/parse-cache');

/** @type {SchemeParseCache} */
let schemeCache;
/** @type {TclParseCache} */
let tclCache;

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
    MATERIAL: vscode.CompletionItemKind.Constant,
};

/** Sort prefix: keywords/functions first, then classes/tags, then literals. */
const SORT_PREFIX = {
    KEYWORD1: '0', KEYWORD2: '0', FUNCTION: '0',
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
function buildItems(moduleKeywords, funcDocs, langId) {
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
                item.documentation = formatDoc(funcDocs[keyword], langId);
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

    const builtinMaterials = new Set(allKeywords.MATERIAL || []);

    // ── 解析缓存初始化 ──────────────────────────
    schemeCache = new SchemeParseCache();
    tclCache = new TclParseCache();

    // ── Tcl WASM 解析器初始化 ─────────────────────
    const tclWasmChannel = vscode.window.createOutputChannel('Sentaurus Tcl WASM');
    tclParserWasm.init(context, tclWasmChannel).then(() => {
        vscode.window.showInformationMessage('Sentaurus: Tcl WASM 解析器初始化成功!');
        // WASM 就绪后重新扫描已打开的 Tcl 文档（激活时 WASM 未就绪，诊断为空）
        undefVarDiagnostic.refreshAll();
    }).catch(err => {
        tclWasmChannel.appendLine(`[ERROR] Tcl WASM 初始化失败: ${err.message}`);
        vscode.window.showWarningMessage(`Sentaurus: Tcl WASM 初始化失败 - ${err.message}`);
    });

    // ── 文件关闭时清理缓存 ──────────────────────────
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            const uri = doc.uri.toString();
            defs.invalidateDefinitionCache(uri);
            schemeCache.invalidate(uri);
            tclCache.invalidate(uri);
        })
    );

    // 注册测试命令：解析当前文档
    context.subscriptions.push(
        vscode.commands.registerCommand('sentaurus.testTclWasm', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('请先打开一个文件');
                return;
            }

            const langId = editor.document.languageId;
            const TCL_LANGS = ['sdevice', 'sprocess', 'emw', 'inspect'];

            tclWasmChannel.appendLine(`\n${'='.repeat(60)}`);
            tclWasmChannel.appendLine(`[testTclWasm] 解析文档: ${editor.document.fileName}`);
            tclWasmChannel.appendLine(`  语言: ${langId}`);
            tclWasmChannel.appendLine(`  是否为 Tcl 语言: ${TCL_LANGS.includes(langId)}`);
            tclWasmChannel.appendLine(`  解析器状态: ${tclParserWasm.isReady() ? '就绪' : '未初始化'}`);

            if (!tclParserWasm.isReady()) {
                vscode.window.showErrorMessage('Tcl WASM 解析器未初始化，请检查 Output 面板的错误信息');
                return;
            }

            const text = editor.document.getText();
            const result = tclParserWasm.parseWithDebug(text);

            if (result) {
                const statEntries = Object.entries(result.stats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => `${k}(${v})`);
                tclWasmChannel.appendLine(`  解析结果: ${result.rootType}, ${result.childCount} 子节点, 错误: ${result.hasError}`);
                tclWasmChannel.appendLine(`  节点统计: ${statEntries.join(', ')}`);

                if (result.hasError) {
                    vscode.window.showWarningMessage('解析完成但有错误 — 查看详情请打开 Output 面板');
                } else {
                    vscode.window.showInformationMessage(`解析成功! 根节点: ${result.rootType}, ${result.childCount} 子节点`);
                }
                // 释放 tree 内存
                result.tree.delete();
            } else {
                vscode.window.showErrorMessage('解析失败 — 查看 Output 面板');
            }

            tclWasmChannel.show(true);
        })
    );

    // Detect locale for i18n
    const useZh = vscode.env.language.startsWith('zh');
    if (useZh) {
        DOC_LABELS.parameters = '**参数：**';
        DOC_LABELS.example = '**示例：**';
        DOC_LABELS.section = '节：';
        DOC_LABELS.keywords = '关键词：';
    }

    // 按语言懒加载函数文档（首次使用时才加载，减少激活 I/O）
    const langFuncDocs = {};
    const _docsCache = {};
    function getDocs(langId) {
        if (langFuncDocs[langId]) return langFuncDocs[langId];

        if (langId === 'sde') {
            if (!_docsCache.sde) {
                const sdeDocs = loadDocsJson('sde_function_docs.json', useZh) || {};
                const schemeDocs = loadDocsJson('scheme_function_docs.json', useZh);
                _docsCache.sde = { ...sdeDocs };
                if (schemeDocs) Object.assign(_docsCache.sde, schemeDocs);
            }
            langFuncDocs.sde = _docsCache.sde;
        } else {
            // Tcl 方言语言
            if (!_docsCache.tcl) {
                _docsCache.tcl = loadDocsJson('tcl_command_docs.json', useZh) || {};
            }
            if (!_docsCache[langId]) {
                const langSpecificDocs = (() => {
                    if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
                    if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
                    return {};
                })();
                _docsCache[langId] = { ...langSpecificDocs, ..._docsCache.tcl };
            }
            langFuncDocs[langId] = _docsCache[langId];
        }
        return langFuncDocs[langId];
    }

    // 构建 modeDispatch 查找表：始终从英文文档提取（结构化元数据，与语言无关）
    const enSdeDocs = loadDocsJson('sde_function_docs.json', false);
    const modeDispatchSource = enSdeDocs || {};
    const modeDispatchTable = {};
    for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
        if (fnDoc.modeDispatch) {
            modeDispatchTable[fnName] = fnDoc.modeDispatch;
        }
    }

    // 构建 symbolParams 查找表：从 sde_function_docs.json 提取符号索引参数
    const symbolParamsTable = {};
    for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
        if (fnDoc.symbolParams) {
            symbolParamsTable[fnName] = { symbolParams: fnDoc.symbolParams };
        }
    }

    // FoldingRangeProvider (SDE only)
    const foldingProvider = foldingProviderMod.createFoldingProvider(schemeCache);
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'sde' },
            foldingProvider
        )
    );

    // Bracket diagnostic (SDE only)
    bracketDiagnostic.activate(context, schemeCache);

    // 括号内回车自动缩进 (SDE only)
    schemeOnEnterProvider.activate(context);

    // Unit 自动配对（SPROCESS only）
    unitAutoClose.activate(context);

    // 空引号对自动删除（所有语言）
    quoteAutoDelete.activate(context);

    // ── Tcl Providers（4 语言共用）──────────────────
    // 代码折叠
    const tclFoldingProvider = tclFoldingMod.createTclFoldingProvider(tclCache);
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerFoldingRangeProvider(
                { language: langId },
                tclFoldingProvider
            )
        );
    }

    // 括号诊断
    tclBracketDiagnostic.activate(context);

    // 未定义变量诊断
    undefVarDiagnostic.activate(context, schemeCache, tclCache);

    // Region/Material/Contact 未定义语义诊断（SDE only）
    regionUndefDiagnostic.activate(context, schemeCache, symbolParamsTable, modeDispatchTable, builtinMaterials);

    // DocumentSymbol / 面包屑导航（4 语言共用）
    const tclDocumentSymbolProvider = tclDocSymbolMod.createTclDocumentSymbolProvider(tclCache);
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider(
                { language: langId },
                tclDocumentSymbolProvider
            )
        );
    }

    // Signature Help (SDE only)
    const sigHelpDisposable = vscode.languages.registerSignatureHelpProvider(
        { language: 'sde' },
        {
            provideSignatureHelp(document, position, token) {
                return signatureProvider.provideSignatureHelp(
                    document, position, token,
                    modeDispatchTable, langFuncDocs.sde,
                    schemeCache
                );
            },
        },
        ' ', '\t', '"', '('
    );
    context.subscriptions.push(sigHelpDisposable);

    // Symbol completion (SDE only) — region/material/contact 补全
    symbolCompletion.activate(context, schemeCache, symbolParamsTable, modeDispatchTable, vscode);

    // Find All References (SDE only) — region/material/contact
    symbolReferenceProvider.activate(context, schemeCache, symbolParamsTable, modeDispatchTable, vscode);

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];
    const materialKeywords = allKeywords.MATERIAL || [];

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

        // 将全局 MATERIAL 分类合并到各语言补全
        const enrichedKeywords = { ...moduleKeywords, MATERIAL: materialKeywords };
        const items = buildItems(enrichedKeywords, getDocs(langId), langId);

        const completionDisposable = vscode.languages.registerCompletionItemProvider(
            { language: langId },
            {
                provideCompletionItems(document, position) {
                    const userDefs = defs.getDefinitions(document, langId);
                    if (userDefs.length === 0) return items;

                    // 单次遍历去重：同时排除静态关键词和重复用户变量
                    const seenNames = new Set(items.map(it => it.label));
                    let filteredDefs = userDefs.filter(d => {
                        if (seenNames.has(d.name)) return false;
                        seenNames.add(d.name);
                        return true;
                    });

                    // SDE (Scheme): 作用域感知过滤
                    if (langId === 'sde') {
                        const { scopeTree } = schemeCache.get(document);
                        const visible = scopeAnalyzer.getVisibleDefinitions(scopeTree, position.line + 1);
                        const visibleNames = new Set(visible.map(v => v.name));
                        filteredDefs = filteredDefs.filter(d => visibleNames.has(d.name));
                    }

                    const maxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
                    const userItems = filteredDefs.map(d => {
                        let itemKind = vscode.CompletionItemKind.Variable;
                        let detail = 'User Variable';
                        if (d.kind === 'function') {
                            itemKind = vscode.CompletionItemKind.Function;
                            detail = 'User Function';
                        }
                        const item = new vscode.CompletionItem(d.name, itemKind);
                        item.detail = detail;
                        item.sortText = '4' + d.name;
                        item.documentation = new vscode.MarkdownString('```' + langId + '\n' + defs.truncateDefinitionText(d.definitionText, maxWidth, langId) + '\n```');
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

                    // 1. 查函数文档（优先，仅限当前语言的文档）
                    const docs = getDocs(langId) || {};
                    const doc = docs[word] || docs[decodeHtml(word)];
                    if (doc) return new vscode.Hover(formatDoc(doc, langId), range);

                    // 2. 查用户变量定义
                    const userDefs = defs.getDefinitions(document, langId);
                    const def = userDefs.find(d => d.name === word);
                    if (def) {
                        const hoverMaxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
                        const md = new vscode.MarkdownString();
                        md.appendMarkdown(`**${def.name}** (用户变量, 第 ${def.line} 行)\n\n`);
                        md.appendCodeblock(defs.truncateDefinitionText(def.definitionText, hoverMaxWidth, langId), langId);
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

    // ── 表达式转换命令 ──────────────────────────
    const convertHistories = {
        'sentaurus.scheme2infix': context.globalState.get('convertHistory.s2i', []),
        'sentaurus.infix2scheme': context.globalState.get('convertHistory.i2s', []),
    };

    async function insertResult(editor, result) {
        if (editor) {
            const cursor = editor.selection.active;
            const success = await editor.edit(builder => {
                builder.insert(cursor, result);
            });
            if (success) {
                const startPos = cursor;
                const endPos = cursor.translate(0, result.length);
                editor.selection = new vscode.Selection(startPos, endPos);
            }
        } else {
            await vscode.env.clipboard.writeText(result);
            vscode.window.showInformationMessage(`已复制到剪贴板: ${result}`);
        }
    }

    function registerConvertCommand(commandId, convertFn, promptText, placeHolder) {
        return vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.selection : null;
            const selectedText = selection && !selection.isEmpty ? editor.document.getText(selection) : '';

            if (selectedText) {
                const { result, error } = convertFn(selectedText);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }
                editor.edit(builder => {
                    builder.replace(selection, result);
                });
                return;
            }

            const history = convertHistories[commandId];
            let value;

            if (history.length > 0) {
                // Show QuickPick with history (native ↑/↓ support, compatible with all VSCode versions)
                const items = history.map(h => ({ label: h }));
                items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
                items.push({ label: '$(edit) 输入新表达式...', alwaysShow: true });

                const picked = await vscode.window.showQuickPick(items, {
                    placeHolder: placeHolder,
                    prompt: promptText,
                });
                if (!picked) return;
                if (picked.label.startsWith('$(edit)')) {
                    value = await vscode.window.showInputBox({ prompt: promptText, placeHolder: placeHolder });
                    if (!value) return;
                } else {
                    value = picked.label;
                }
            } else {
                value = await vscode.window.showInputBox({ prompt: promptText, placeHolder: placeHolder });
                if (!value) return;
            }

            const trimmed = value.trim();
            if (!trimmed) return;

            const { result, error } = convertFn(trimmed);
            if (error) {
                vscode.window.showErrorMessage(`转换失败: ${error}`);
                return;
            }

            // Save to history (deduplicate)
            const idx = history.indexOf(trimmed);
            if (idx !== -1) history.splice(idx, 1);
            history.unshift(trimmed);
            if (history.length > 20) history.pop();
            context.globalState.update('convertHistory.' + (commandId === 'sentaurus.scheme2infix' ? 's2i' : 'i2s'), history);

            await insertResult(editor, result);
        });
    }

    context.subscriptions.push(
        registerConvertCommand(
            'sentaurus.scheme2infix',
            expressionConverter.prefixToInfix,
            '输入 Scheme 前缀表达式，转换为中缀格式',
            '↑↓ 浏览历史 | 例: (+ (/ W 2) (/ L 2))'
        ),
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '↑↓ 浏览历史 | 例: (W/2 + L/2)'
        ),
    );

    // ── 表达式帮助命令 ──────────────────────────
    const helpDisposable = vscode.commands.registerCommand('sentaurus.exprHelp', async () => {
        const categories = expressionConverter.getSupportedOperators();
        const items = [];
        for (const cat of categories) {
            items.push({ label: cat.category, kind: vscode.QuickPickItemKind.Separator });
            for (const item of cat.items) {
                items.push({
                    label: `${item.scheme} ↔ ${item.infix}`,
                    description: item.description,
                    detail: `示例: ${item.example_scheme} ↔ ${item.example_infix}`,
                });
            }
        }
        items.push({ label: '格式说明', kind: vscode.QuickPickItemKind.Separator });
        items.push({
            label: '算术运算 → 中缀',
            description: '符号前置 → 符号居中',
            detail: '(+ a b) → a + b,  (* a b) → a * b,  (expt a b) → a ^ b',
        });
        items.push({
            label: '数学函数 → 函数调用',
            description: '括号前置 → 函数名(参数)',
            detail: '(sin x) → sin(x),  (min a b c) → min(a, b, c)',
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '支持的运算符和函数 — 选中可插入代码片段',
            matchOnDescription: true,
            matchOnDetail: true,
        });
        if (!selected || selected.kind) return;

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const detail = selected.detail || '';
            const schemeExample = detail.match(/示例: ([^(↔]+)/);
            if (schemeExample) {
                editor.edit(builder => {
                    builder.insert(editor.selection.active, schemeExample[1].trim());
                });
            }
        }
    });
    context.subscriptions.push(helpDisposable);
}

function deactivate() {
    schemeCache.dispose();
    tclCache.dispose();
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}

module.exports = { activate, deactivate };
