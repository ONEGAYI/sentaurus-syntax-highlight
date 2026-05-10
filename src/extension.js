const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defs = require('./definitions');
const scopeAnalyzer = require('./lsp/scope-analyzer');
const sdeviceSemanticMod = require('./lsp/providers/sdevice-semantic-provider');
const tclFuncallSemantic = require('./lsp/providers/tcl-funcall-semantic');
const { registerSdeProviders } = require('./register-sde-providers');
const expressionConverter = require('./commands/expression-converter');
const tclParserWasm = require('./lsp/tcl-parser-wasm');
const astUtils = require('./lsp/tcl-ast-utils');
const tclFoldingMod = require('./lsp/providers/tcl-folding-provider');
const tclBracketDiagnostic = require('./lsp/providers/tcl-bracket-diagnostic');
const undefVarDiagnostic = require('./lsp/providers/undef-var-diagnostic');
const tclDocSymbolMod = require('./lsp/providers/tcl-document-symbol-provider');
const unitAutoClose = require('./lsp/providers/unit-auto-close-provider');
const quoteAutoDelete = require('./lsp/providers/quote-auto-delete-provider');
const vectorKW = require('./lsp/providers/sdevice-vector-keywords');
const variableReferenceProvider = require('./lsp/providers/variable-reference-provider');
const { SchemeParseCache, TclParseCache } = require('./lsp/parse-cache');
const { SDEVICE_ALL_SECTION_KEYWORDS_LOWER } = require('./lsp/tcl-symbol-configs');
const ppUtils = require('./lsp/pp-utils');
const { decodeHtml, stripTclVarPrefix } = ppUtils;
const {
    KIND_MAP, SORT_PREFIX, DETAIL_LABEL, DOC_LABELS,
    DEFAULT_PREFIXES, formatDoc,
} = require('./docs-loader');
const { registerSnippetCommand } = require('./commands/snippet-picker');

const TCL_SUBCMD_COMPLETION_RE = /\b(string|file|info|array|dict)\s+$/;
const TCL_SUBCMD_HOVER_RE = /\b(string|file|info|array|dict)\s+(\w+)$/;

/** @type {SchemeParseCache} */
let schemeCache;
/** @type {TclParseCache} */
let tclCache;
let sdeviceStProvider;

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

/**
 * 判断光标是否在注释行中。
 * SDE (Scheme): ; 注释；其他 (Tcl): # 和 * 注释。
 * Tcl 中 #define/#ifdef 等预处理器指令不算注释。
 */
function isInComment(document, position, langId) {
    const lineText = document.lineAt(position.line).text;
    const col = position.character;
    const commentChars = langId === 'sde' ? ';' : '#';
    for (let i = 0; i < col; i++) {
        const ch = lineText[i];
        if (ch === '"') { i++; while (i < col && lineText[i] !== '"') { if (lineText[i] === '\\') i++; i++; } continue; }
        if (ch === commentChars) {
            if (langId !== 'sde' && /^\s*#(define|undef|ifdef|ifndef|endif|elif|else|if\b|set|seth|include|error|rem|verbatim)\b/.test(lineText)) {
                return false;
            }
            return true;
        }
        if (langId !== 'sde' && ch === '*' && (i === 0 || lineText.slice(0, i).trim() === '')) return true;
    }
    return false;
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
            if (sdeviceStProvider) sdeviceStProvider.invalidate(uri);
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
                _docsCache.tclMath = loadDocsJson('tcl_expr_mathfunc_docs.json', useZh) || {};
                _docsCache.tclSub = loadDocsJson('tcl_subcommand_docs.json', useZh) || {};
            }
            if (!_docsCache[langId]) {
                const langSpecificDocs = (() => {
                    if (langId === 'sdevice') return loadDocsJson('sdevice_command_docs.json', useZh) || {};
                    if (langId === 'svisual') return loadDocsJson('svisual_command_docs.json', useZh) || {};
                    return {};
                })();
                _docsCache[langId] = { ..._docsCache.tcl, ..._docsCache.tclMath, ...langSpecificDocs };
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

    schemeCache.setSymbolConfig(symbolParamsTable, modeDispatchTable);

    // ── SDE Providers ──────────────────────────
    registerSdeProviders(context, {
        schemeCache,
        modeDispatchTable,
        langFuncDocs,
        builtinMaterials,
    });

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

    // Semantic Tokens (sdevice) — section 上下文感知着色
    const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', false) || {};
    const sdeviceSectionKwsLower = SDEVICE_ALL_SECTION_KEYWORDS_LOWER;
    // 小写→原始大小写映射，用于 hover 等需要原始键查找文档的场景
    const sdeviceLowerToCanon = new Map();
    for (const key of Object.keys(sdeviceDocs)) {
        sdeviceLowerToCanon.set(key.toLowerCase(), key);
    }
    const sdeviceLegend = new vscode.SemanticTokensLegend(
        sdeviceSemanticMod.TOKEN_TYPES,
        sdeviceSemanticMod.TOKEN_MODIFIERS
    );
    sdeviceStProvider = sdeviceSemanticMod.createSdeviceSemanticProvider(
        sdeviceDocs, sdeviceSectionKwsLower
    );
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'sdevice' },
            sdeviceStProvider,
            sdeviceLegend
        )
    );

    // Semantic Tokens (sdevice) — proc 函数调用（补充到现有 section 语义着色之上）
    const sdeviceFuncallLegend = new vscode.SemanticTokensLegend(
        tclFuncallSemantic.FUNCALL_ONLY_TYPES,
        []
    );
    const sdeviceFuncallProvider = tclFuncallSemantic.createTclFuncallSemanticProvider(tclCache, { includeMacro: false });
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'sdevice' },
            sdeviceFuncallProvider,
            sdeviceFuncallLegend
        )
    );

    // Semantic Tokens (其他 Tcl 工具) — proc 函数调用 + #define 宏着色
    const tclPpLangs = ['sprocess', 'emw', 'inspect', 'svisual'];
    const tclFuncallLegend = new vscode.SemanticTokensLegend(
        tclFuncallSemantic.TOKEN_TYPES,
        tclFuncallSemantic.TOKEN_MODIFIERS
    );
    const tclFuncallProvider = tclFuncallSemantic.createTclFuncallSemanticProvider(tclCache, { includeMacro: true });
    for (const ppLang of tclPpLangs) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSemanticTokensProvider(
                { language: ppLang },
                tclFuncallProvider,
                tclFuncallLegend
            )
        );
    }

    // Find All References — 用户自定义变量（全部 6 种语言）
    variableReferenceProvider.activate(context, schemeCache, tclCache, vscode);

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];
    const materialKeywords = allKeywords.MATERIAL || [];
    const mathfuncKeywords = allKeywords.MATHFUNC || [];

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

        // 将全局 MATERIAL 合并到所有语言，MATHFUNC 仅合并到 Tcl 方言（非 sde）
        const extras = { MATERIAL: materialKeywords };
        if (langId !== 'sde') extras.MATHFUNC = mathfuncKeywords;
        const enrichedKeywords = { ...moduleKeywords, ...extras };
        const items = buildItems(enrichedKeywords, getDocs(langId), langId);

        const completionDisposable = vscode.languages.registerCompletionItemProvider(
            { language: langId },
            {
                provideCompletionItems(document, position) {
                    try {
                        if (langId !== 'sde') {
                            const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
                            const subcmdContext = TCL_SUBCMD_COMPLETION_RE.exec(linePrefix);
                            if (subcmdContext) {
                                const parentCmd = subcmdContext[1];
                                const subDocs = _docsCache.tclSub;
                                if (subDocs && subDocs[parentCmd]) {
                                    return Object.entries(subDocs[parentCmd]).map(([name, doc]) => {
                                        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Method);
                                        item.detail = 'Tcl 子命令';
                                        item.documentation = new vscode.MarkdownString(doc.description);
                                        return item;
                                    });
                                }
                            }
                        }

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
                            if (d.kind === 'ppDefine') {
                                itemKind = vscode.CompletionItemKind.Constant;
                                detail = d.value ? `#define = ${d.value}` : '#define';
                            }
                            const item = new vscode.CompletionItem(d.name, itemKind);
                            item.detail = detail;
                            item.sortText = '4' + d.name;
                            item.documentation = new vscode.MarkdownString('```' + langId + '\n' + defs.truncateDefinitionText(d.definitionText, maxWidth, langId) + '\n```');
                            return item;
                        });

                        return [...items, ...userItems];
                    } catch (e) {
                        console.error('Sentaurus: provideCompletionItems error', e);
                        return [];
                    }
                },
            }
        );
        context.subscriptions.push(completionDisposable);

        // SDEVICE: 矢量关键词后缀补全（Plot/CurrentPlot section 内，/ 触发）
        if (langId === 'sdevice') {
            const vectorCompDisposable = vscode.languages.registerCompletionItemProvider(
                { language: 'sdevice' },
                {
                    provideCompletionItems(document, position) {
                        try {
                            const lineText = document.lineAt(position.line).text;
                            const col = position.character;
                            if (col < 1 || lineText[col - 1] !== '/') return undefined;

                            // 提取 / 前面的基础关键词
                            let end = col - 1;
                            let start = end;
                            while (start > 0 && /[A-Za-z0-9_]/.test(lineText[start - 1])) start--;
                            const baseKeyword = lineText.slice(start, end);

                            const suffixes = vectorKW.getSuffixesForBaseCI(baseKeyword);
                            if (!suffixes) return undefined;

                            // 检查 section 上下文
                            const stack = sdeviceStProvider.getSectionStackForDocument(document, position.line);
                            if (!stack.some(s => vectorKW.VECTOR_SECTIONS_LOWER.has(s))) return undefined;

                            return suffixes.map(suffix => {
                                const suffixPart = suffix.slice(1);
                                const item = new vscode.CompletionItem(suffixPart, vscode.CompletionItemKind.Unit);
                                item.detail = 'Vector suffix';
                                item.insertText = suffixPart;
                                item.sortText = '0' + suffixPart;
                                item.label = baseKeyword + suffix;
                                item.filterText = suffixPart;
                                return item;
                            });
                        } catch (e) {
                            console.error('Sentaurus: provideCompletionItems (vector) error', e);
                            return undefined;
                        }
                    },
                },
                '/'
            );
            context.subscriptions.push(vectorCompDisposable);
        }


        // Register HoverProvider for function documentation
        const hoverDisposable = vscode.languages.registerHoverProvider(
            { language: langId },
            {
                provideHover(document, position) {
                    try {
                    if (isInComment(document, position, langId)) return null;
                    const range = document.getWordRangeAtPosition(position, /\$?[\w:.\-<>?!+*/=]+/);
                    if (!range) return null;
                    const word = document.getText(range);

                    // 矢量关键词回退：ElectricField/Vector → 查找 ElectricField 文档
                    const vectorBase = vectorKW.resolveBaseKeywordCI(word);
                    const effectiveWord = vectorBase || word;
                    const wordLower = word.toLowerCase();
                    const effectiveWordLower = effectiveWord.toLowerCase();

                    // 1. 查函数文档（优先，仅限当前语言的文档）
                    const docs = getDocs(langId) || {};

                    // Tcl 子命令上下文感知悬停
                    // 用 range.end.character 而非 position.character，确保悬停在子命令任意位置时都能匹配完整单词
                    const linePrefix = document.lineAt(position.line).text.substring(0, range.end.character);
                    const subcmdMatch = TCL_SUBCMD_HOVER_RE.exec(linePrefix);
                    if (subcmdMatch) {
                        const [, parentCmd, subcmd] = subcmdMatch;
                        const subDocs = _docsCache.tclSub;
                        if (subDocs && subDocs[parentCmd] && subDocs[parentCmd][subcmd]) {
                            const subDoc = subDocs[parentCmd][subcmd];
                            const md = new vscode.MarkdownString();
                            md.appendMarkdown(`**${parentCmd} ${subcmd}** \`（Tcl 子命令）\`\n\n`);
                            md.appendCodeblock(subDoc.signature, 'tcl');
                            md.appendMarkdown(`\n\n${subDoc.description}`);
                            if (subDoc.example) {
                                md.appendMarkdown('\n\n**示例：**\n');
                                md.appendCodeblock(subDoc.example, 'tcl');
                            }
                            return new vscode.Hover(md, range);
                        }
                    }

                    // sdevice: 上下文感知文档查找（复用语义 token 缓存）
                    if (langId === 'sdevice') {
                        const stack = sdeviceStProvider.getSectionStackForDocument(
                            document, position.line
                        );
                        if (stack.length > 0) {
                            for (let si = stack.length - 1; si >= 0; si--) {
                                const secNameLower = stack[si];
                                const secName = sdeviceLowerToCanon.get(secNameLower) || secNameLower;
                                const secDoc = docs[secName];
                                if (!secDoc) continue;
                                if (Array.isArray(secDoc.parameters)) {
                                    const param = secDoc.parameters.find(p =>
                                        (typeof p === 'object' ? p.name : p).toLowerCase() === wordLower
                                    );
                                    if (param && typeof param === 'object') {
                                        const md = new vscode.MarkdownString();
                                        md.appendMarkdown(`**${word}** (${secName} 参数)\n\n`);
                                        md.appendCodeblock(`${word} = <${param.type}>`, langId);
                                        md.appendMarkdown(`\n${param.desc}`);
                                        return new vscode.Hover(md, range);
                                    }
                                }
                                if (Array.isArray(secDoc.keywords) && secDoc.keywords.some(k => k.toLowerCase() === effectiveWordLower)) {
                                    const kwCanon = sdeviceLowerToCanon.get(effectiveWordLower);
                                    const kwDoc = kwCanon ? docs[kwCanon] : docs[effectiveWord];
                                    if (kwDoc) {
                                        // 优先查 contexts[当前 section] 的上下文描述
                                        const ctxDesc = kwDoc.contexts && kwDoc.contexts[secName];
                                        if (ctxDesc) {
                                            const md = new vscode.MarkdownString();
                                            md.appendMarkdown(`**${word}** (${secName})\n\n`);
                                            md.appendMarkdown(ctxDesc);
                                            if (kwDoc.parameters && kwDoc.parameters.length) {
                                                md.appendMarkdown('\n\n**Parameters:**\n');
                                                for (const p of kwDoc.parameters) {
                                                    md.appendMarkdown(`- \`${p.name}\` (\`${p.type}\`) — ${p.desc}\n`);
                                                }
                                            }
                                            if (kwDoc.example) {
                                                md.appendMarkdown('\n**Example:**\n');
                                                md.appendCodeblock(kwDoc.example, langId);
                                            }
                                            return new vscode.Hover(md, range);
                                        }
                                        return new vscode.Hover(formatDoc(kwDoc, langId), range);
                                    }
                                }
                            }
                        }
                    }

                    const canonKey = sdeviceLowerToCanon.get(effectiveWordLower);
                    const doc = (canonKey && docs[canonKey]) || docs[effectiveWord] || docs[decodeHtml(effectiveWord)];
                    if (doc) return new vscode.Hover(formatDoc(doc, langId), range);

                    // 2. 查用户变量定义
                    const userDefs = defs.getDefinitions(document, langId);
                    let def = null;
                    let hoverRange = range;

                    if (astUtils.TCL_LANGS.has(langId)) {
                        // Tcl: 用户变量悬停需要 $ 前缀；function/ppDefine 无此限制
                        // 支持 ${varName}（花括号形式）和 $varName（简单形式）
                        const bracedRange = document.getWordRangeAtPosition(position, /\$\{[\w:.\-<>?!+*/=]+\}/);
                        const dollarRange = bracedRange || document.getWordRangeAtPosition(position, /(?<!\\)\$[\w:-]+/);
                        if (dollarRange) {
                            let dollarWord = stripTclVarPrefix(document.getText(dollarRange));
                            // 优先使用 scope-aware resolveDefinition（循环感知）
                            const cursorLine = position.line + 1;
                            const scopeIndex = tclCache.getScopeIndex(document);
                            if (scopeIndex) {
                                const resolved = scopeIndex.resolveDefinition(dollarWord, cursorLine);
                                if (resolved) {
                                    def = userDefs.find(d => d.name === dollarWord && d.line === resolved.defLine);
                                }
                            }
                            // fallback: 取光标前行号最大的匹配
                            if (!def) {
                                for (const d of userDefs) {
                                    if (d.name === dollarWord && d.line <= cursorLine) {
                                        if (!def || d.line > def.line) def = d;
                                    }
                                }
                            }
                            if (def) hoverRange = dollarRange;
                        } else {
                            // 无 $ 前缀时才查 proc/ppDefine 等非变量定义
                            def = userDefs.find(d => d.name === word && d.kind !== 'variable');
                        }
                    } else {
                        def = userDefs.find(d => d.name === word);
                        // Fallback: broad regex may over-capture (e.g. "Voltage=_Vds_"), try \w+ only
                        let hoverWord = word;
                        if (!def) {
                            const narrowRange = document.getWordRangeAtPosition(position, /[\w]+/);
                            if (narrowRange) {
                                hoverWord = document.getText(narrowRange);
                                def = userDefs.find(d => d.name === hoverWord);
                                if (def) hoverRange = narrowRange;
                            }
                        }
                    }

                    if (def) {
                        const hoverMaxWidth = vscode.workspace.getConfiguration('sentaurus').get('definitionMaxWidth', 60);
                        const md = new vscode.MarkdownString();
                        const typeLabel = def.kind === 'ppDefine' ? '预处理宏' : '用户变量';
                        md.appendMarkdown(`**${def.name}** (${typeLabel}, 第 ${def.line} 行)\n\n`);
                        md.appendCodeblock(defs.truncateDefinitionText(def.definitionText, hoverMaxWidth, langId), langId);
                        return new vscode.Hover(md, hoverRange);
                    }

                    return null;
                    } catch (e) {
                        console.error('Sentaurus: provideHover error', e);
                        return null;
                    }
                },
            }
        );
        context.subscriptions.push(hoverDisposable);

        // Register DefinitionProvider for user-defined variables (scope-aware)
        const definitionDisposable = vscode.languages.registerDefinitionProvider(
            { language: langId },
            {
                provideDefinition(document, position) {
                    try {
                    if (isInComment(document, position, langId)) return null;
                    const cursorLine = position.line + 1; // 1-based

                    if (langId === 'sde') {
                        // Scheme: scope-aware via buildScopeTree + getVisibleDefinitions
                        const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
                        if (!range) return null;
                        const word = document.getText(range);
                        const entry = schemeCache.get(document);
                        if (!entry) return null;
                        const { scopeTree, lineStarts } = entry;
                        const visibleDefs = scopeAnalyzer.getVisibleDefinitions(scopeTree, cursorLine);
                        const def = visibleDefs.find(d => d.name === word);
                        if (!def) {
                            // #define 宏定义 fallback（不依赖 Scheme AST）
                            const userDefs = defs.getDefinitions(document, langId);
                            const ppDef = [...userDefs].reverse().find(
                                d => d.kind === 'ppDefine' && d.name === word && d.line <= cursorLine
                            );
                            if (ppDef) {
                                const defLine0 = ppDef.line - 1;
                                const defLineText = document.lineAt(defLine0).text;
                                const re = new RegExp('\\b' + ppUtils.escapeRegex(word) + '\\b');
                                const match = re.exec(defLineText);
                                if (match) {
                                    return new vscode.Location(
                                        document.uri,
                                        new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
                                    );
                                }
                            }
                            return null;
                        }
                        const defStartCol = ppUtils.safeCol(lineStarts, def.line, def.start);
                        const defEndCol = ppUtils.safeCol(lineStarts, def.line, def.end);
                        return new vscode.Location(
                            document.uri,
                            new vscode.Range(def.line - 1, defStartCol, def.line - 1, defEndCol)
                        );
                    }

                    // Tcl: scope-aware via buildScopeIndex + resolveDefinition
                    // 支持 ${varName}（花括号形式）和 $varName（简单形式）
                    const bracedRange = document.getWordRangeAtPosition(position, /\$\{[\w:.\-<>?!+*/=]+\}/);
                    const dollarRange = document.getWordRangeAtPosition(position, /(?<!\\)\$[\w:-]+/);
                    const plainRange = document.getWordRangeAtPosition(position, /[\w:-]+/);
                    const range = bracedRange || dollarRange || plainRange;
                    if (!range) return null;
                    let word = stripTclVarPrefix(document.getText(range));
                    if (!word) return null;

                    // #define 宏定义 fallback（不依赖 WASM）
                    const userDefs = defs.getDefinitions(document, langId);
                    const ppDef = [...userDefs].reverse().find(d => d.kind === 'ppDefine' && d.name === word && d.line <= cursorLine);
                    if (ppDef) {
                        const defLine0 = ppDef.line - 1;
                        const defLineText = document.lineAt(defLine0).text;
                        const re = new RegExp('\\b' + ppUtils.escapeRegex(word) + '\\b');
                        const match = re.exec(defLineText);
                        if (match) {
                            return new vscode.Location(
                                document.uri,
                                new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
                            );
                        }
                    }

                    const scopeIndex = tclCache.getScopeIndex(document);
                    if (!scopeIndex) return null;
                    let targetDef = scopeIndex.resolveDefinition(word, cursorLine);
                    if (!targetDef) return null;

                    // 用户变量（非 function）需要 $ 前缀；proc 可通过裸名跳转
                    if (!dollarRange && targetDef.scope !== 'global-proc') return null;

                    const defLine0 = targetDef.defLine - 1;
                    const defLineText = document.lineAt(defLine0).text;
                    const re = new RegExp('\\b' + ppUtils.escapeRegex(word) + '\\b');
                    const match = re.exec(defLineText);
                    if (!match) return null;
                    return new vscode.Location(
                        document.uri,
                        new vscode.Range(defLine0, match.index, defLine0, match.index + word.length)
                    );
                    } catch (e) {
                        console.error('Sentaurus: provideDefinition error', e);
                        return null;
                    }
                },
            }
        );
        context.subscriptions.push(definitionDisposable);
    }

    // === Snippet QuickPick Command ===
    registerSnippetCommand(context);

    // ── 表达式转换命令 ──────────────────────────
    const HISTORY_KEYS = {
        'sentaurus.scheme2infix': 'convertHistory.s2i',
        'sentaurus.infix2scheme': 'convertHistory.i2s',
    };
    const convertHistories = {};
    for (const [cmd, key] of Object.entries(HISTORY_KEYS)) {
        convertHistories[cmd] = context.globalState.get(key, []);
    }

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
            const isSde = editor && editor.document.languageId === 'sde';
            const userVars = isSde
                ? defs.getDefinitions(editor.document, 'sde')
                    .filter(d => d.kind === 'variable' || d.kind === 'parameter')
                : [];

            const qp = vscode.window.createQuickPick();
            qp.title = promptText;
            qp.placeholder = placeHolder;
            qp.matchOnDescription = false;
            qp.matchOnDetail = false;

            const tracker = new expressionConverter.CursorTracker();
            let _updatingValue = false;
            let _lastWordInfo = null;
            const historyTitle = useZh
                ? `${promptText}  —  !N 精确选中 | ! 文本 模糊过滤`
                : `${promptText}  —  !N select by # | ! text fuzzy filter`;

            function updateItems(value) {
                if (_updatingValue) return;
                const items = [];
                const histParsed = expressionConverter.parseHistoryInput(value);

                if (histParsed) {
                    _lastWordInfo = null;
                    if (qp.title !== historyTitle) qp.title = historyTitle;
                    if (history.length > 0) {
                        items.push({ label: '历史记录', kind: vscode.QuickPickItemKind.Separator });
                        for (let i = 0; i < history.length; i++) {
                            const entry = history[i];
                            if (histParsed.index !== null) {
                                if (i + 1 === histParsed.index) {
                                    items.push({ label: entry, description: `#${i + 1}`, alwaysShow: true, _historyIndex: i });
                                }
                            } else {
                                const filter = histParsed.filter.toLowerCase();
                                if (!filter || entry.toLowerCase().includes(filter)) {
                                    items.push({ label: entry, description: `#${i + 1}`, alwaysShow: true, _historyIndex: i });
                                }
                            }
                        }
                    }
                } else {
                    if (qp.title !== promptText) qp.title = promptText;
                    const cursor = tracker.update(value);
                    _lastWordInfo = expressionConverter.getWordAtPosition(value, cursor);
                    const prefix = _lastWordInfo ? _lastWordInfo.prefix.toLowerCase() : '';

                    if (userVars.length > 0 && prefix) {
                        const variables = userVars.filter(d => d.kind === 'variable' && d.name.toLowerCase().startsWith(prefix));
                        const parameters = userVars.filter(d => d.kind === 'parameter' && d.name.toLowerCase().startsWith(prefix));
                        const shown = [...variables, ...parameters];
                        if (shown.length > 0) {
                            items.push({ label: '用户变量', kind: vscode.QuickPickItemKind.Separator });
                            for (const v of shown) {
                                items.push({
                                    label: v.name,
                                    description: `${v.kind}, 第${v.line}行`,
                                    detail: v.definitionText ? v.definitionText.substring(0, 80) : undefined,
                                    alwaysShow: true,
                                    _varName: v.name,
                                });
                            }
                        }
                    }

                }

                // 确认分栏：仅非历史模式下显示
                if (!histParsed && value.trim()) {
                    items.push({ label: useZh ? '确认输入' : 'Confirm Input', kind: vscode.QuickPickItemKind.Separator });
                    // 预览转换结果
                    const preview = convertFn(value);
                    const desc = preview.error
                        ? `⚠ ${preview.error}`
                        : (useZh ? '按 Enter 确认' : 'Press Enter to confirm');
                    items.push({
                        label: value,
                        description: desc,
                        detail: preview.result || undefined,
                        alwaysShow: true,
                        _confirmInput: true,
                    });
                }

                qp.items = items;
            }

            qp.onDidChangeValue(updateItems);
            updateItems('');

            qp.onDidAccept(() => {
                const selected = qp.selectedItems[0];
                let finalValue;

                if (selected && selected._varName) {
                    _updatingValue = true;
                    let insertText;
                    const varName = selected._varName;
                    const hasHyphen = /[-]/.test(varName);

                    if (_lastWordInfo) {
                        if (_lastWordInfo.inAngleBrackets) {
                            // 场景 3：已在 <> 内，替换括号内容
                            const replacement = _lastWordInfo.bracketClosed ? varName : `${varName}>`;
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, replacement);
                        } else if (hasHyphen) {
                            // 场景 2：普通标识符位置，变量含连字符 → 替换为 <var>
                            const replacement = `<${varName}>`;
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, replacement);
                        } else {
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, varName);
                        }
                    } else {
                        // 无 wordInfo，在末尾追加
                        insertText = hasHyphen ? qp.value + `<${varName}>` : qp.value + varName;
                    }

                    const newVal = insertText;
                    qp.value = newVal;
                    tracker.sync(newVal);
                    _updatingValue = false;
                    updateItems(newVal);
                    return;
                }

                if (selected && selected._confirmInput) {
                    // 确认项：取输入值
                    finalValue = qp.value.trim();
                } else if (selected && selected._historyIndex !== undefined) {
                    // 历史模式选中项
                    finalValue = history[selected._historyIndex];
                } else {
                    // 无选中，取输入值
                    const raw = qp.value;
                    const histParsed = expressionConverter.parseHistoryInput(raw);
                    finalValue = histParsed ? raw.slice(1).trim() : raw.trim();
                }

                qp.hide();

                if (!finalValue) return;

                const { result, error } = convertFn(finalValue);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }

                // 保存到历史（去重）
                const idx = history.indexOf(finalValue);
                if (idx !== -1) history.splice(idx, 1);
                history.unshift(finalValue);
                if (history.length > 20) history.pop();
                context.globalState.update(HISTORY_KEYS[commandId], history);

                insertResult(editor, result);
            });

            qp.onDidHide(() => {
                tracker.reset();
                qp.dispose();
            });
            qp.show();
        });
    }

    context.subscriptions.push(
        registerConvertCommand(
            'sentaurus.scheme2infix',
            expressionConverter.prefixToInfix,
            '输入 Scheme 前缀表达式，转换为中缀格式',
            '输入 ! 浏览历史 | 例: (+ (/ W 2) (/ L 2))'
        ),
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '输入 ! 浏览历史 | <连字符变量> | 例: (<W-doping>/2 + <L-length>/2)'
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
        items.push({
            label: '输入增强',
            description: 'SDE 文件变量补全与历史记录',
            detail: 'SDE 文件中输入时自动显示用户变量 | 输入 ! 进入历史模式 | !3 直接选 #3 | ! 文本 过滤历史',
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
    if (sdeviceStProvider) sdeviceStProvider.dispose();
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}

module.exports = { activate, deactivate };
