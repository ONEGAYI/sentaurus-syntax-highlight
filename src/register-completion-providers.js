// src/register-completion-providers.js
'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defs = require('./definitions');
const scopeAnalyzer = require('./lsp/scope-analyzer');
const astUtils = require('./lsp/tcl-ast-utils');
const ppUtils = require('./lsp/pp-utils');
const { decodeHtml, stripTclVarPrefix } = ppUtils;
const vectorKW = require('./lsp/providers/sdevice-vector-keywords');
const { KIND_MAP, SORT_PREFIX, DETAIL_LABEL, formatDoc } = require('./docs-loader');

const TCL_SUBCMD_COMPLETION_RE = /\b(string|file|info|array|dict)\s+$/;
const TCL_SUBCMD_HOVER_RE = /\b(string|file|info|array|dict)\s+(\w+)$/;

/**
 * Load a JSON file from the syntaxes directory.
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

/**
 * Register Completion/Hover/Definition providers for all languages.
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 */
function registerCompletionProviders(context, deps) {
    const {
        allKeywords,
        schemeCache,
        tclCache,
        builtinMaterials,
        sdeviceStProvider,
        sdeviceLowerToCanon,
        useZh,
    } = deps;

    const languages = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];
    const materialKeywords = allKeywords.MATERIAL || [];
    const mathfuncKeywords = allKeywords.MATHFUNC || [];

    // 按语言懒加载函数文档
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

    // 构建 modeDispatch 查找表
    const enSdeDocs = loadDocsJson('sde_function_docs.json', false);
    const modeDispatchSource = enSdeDocs || {};
    const modeDispatchTable = {};
    for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
        if (fnDoc.modeDispatch) {
            modeDispatchTable[fnName] = fnDoc.modeDispatch;
        }
    }

    // 构建 symbolParams 查找表
    const symbolParamsTable = {};
    for (const [fnName, fnDoc] of Object.entries(modeDispatchSource)) {
        if (fnDoc.symbolParams) {
            symbolParamsTable[fnName] = { symbolParams: fnDoc.symbolParams };
        }
    }

    schemeCache.setSymbolConfig(symbolParamsTable, modeDispatchTable);

    // Return tables for use by registerSdeProviders
    const result = { modeDispatchTable, langFuncDocs };

    for (const langId of languages) {
        const moduleKeywords = allKeywords[langId];
        if (!moduleKeywords) continue;

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

                        const seenNames = new Set(items.map(it => it.label));
                        let filteredDefs = userDefs.filter(d => {
                            if (seenNames.has(d.name)) return false;
                            seenNames.add(d.name);
                            return true;
                        });

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

                        // 环境变量补全
                        const envVars = vscode.workspace.getConfiguration('sentaurus').get('environmentVariables', {});
                        const envVarItems = Object.keys(envVars)
                            .filter(name => !seenNames.has(name))
                            .map(name => {
                                const item = new vscode.CompletionItem('$' + name, vscode.CompletionItemKind.Variable);
                                item.detail = useZh ? '🏠 环境变量' : '🏠 Env Variable';
                                item.sortText = '4' + name;
                                const docStr = envVars[name];
                                if (docStr && docStr.trim()) {
                                    item.documentation = new vscode.MarkdownString(docStr);
                                }
                                return item;
                            });

                        return [...items, ...envVarItems, ...userItems];
                    } catch (e) {
                        console.error('Sentaurus: provideCompletionItems error', e);
                        return [];
                    }
                },
            }
        );
        context.subscriptions.push(completionDisposable);

        // SDEVICE: 矢量关键词后缀补全
        if (langId === 'sdevice') {
            const vectorCompDisposable = vscode.languages.registerCompletionItemProvider(
                { language: 'sdevice' },
                {
                    provideCompletionItems(document, position) {
                        try {
                            const lineText = document.lineAt(position.line).text;
                            const col = position.character;
                            if (col < 1 || lineText[col - 1] !== '/') return undefined;

                            let end = col - 1;
                            let start = end;
                            while (start > 0 && /[A-Za-z0-9_]/.test(lineText[start - 1])) start--;
                            const baseKeyword = lineText.slice(start, end);

                            const suffixes = vectorKW.getSuffixesForBaseCI(baseKeyword);
                            if (!suffixes) return undefined;

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

        // HoverProvider
        const hoverDisposable = vscode.languages.registerHoverProvider(
            { language: langId },
            {
                provideHover(document, position) {
                    try {
                    if (isInComment(document, position, langId)) return null;
                    const range = document.getWordRangeAtPosition(position, /\$?[\w:.\-<>?!+*/=]+/);
                    if (!range) return null;
                    const word = document.getText(range);

                    const identRange = document.getWordRangeAtPosition(position, /[\w]+/) || range;
                    const identWord = document.getText(identRange);

                    const vectorBase = vectorKW.resolveBaseKeywordCI(identWord);
                    const effectiveWord = vectorBase || identWord;
                    const wordLower = effectiveWord.toLowerCase();

                    const docs = getDocs(langId) || {};

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
                                        md.appendMarkdown(`**${identWord}** (${secName} 参数)\n\n`);
                                        md.appendCodeblock(`${identWord} = <${param.type}>`, langId);
                                        md.appendMarkdown(`\n${param.desc}`);
                                        return new vscode.Hover(md, identRange);
                                    }
                                }
                                if (Array.isArray(secDoc.keywords) && secDoc.keywords.some(k => k.toLowerCase() === wordLower)) {
                                    const kwCanon = sdeviceLowerToCanon.get(wordLower);
                                    const kwDoc = kwCanon ? docs[kwCanon] : docs[effectiveWord];
                                    if (kwDoc) {
                                        const ctxDesc = kwDoc.contexts && kwDoc.contexts[secName];
                                        if (ctxDesc) {
                                            const md = new vscode.MarkdownString();
                                            md.appendMarkdown(`**${identWord}** (${secName})\n\n`);
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
                                            return new vscode.Hover(md, identRange);
                                        }
                                        return new vscode.Hover(formatDoc(kwDoc, langId), identRange);
                                    }
                                }
                            }
                        }
                    }

                    const canonKey = sdeviceLowerToCanon.get(wordLower);
                    const doc = (canonKey && docs[canonKey]) || docs[effectiveWord] || docs[decodeHtml(effectiveWord)];
                    if (doc) return new vscode.Hover(formatDoc(doc, langId), identRange);

                    const userDefs = defs.getDefinitions(document, langId);
                    let def = null;
                    let hoverRange = identRange;

                    if (astUtils.TCL_LANGS.has(langId)) {
                        const bracedRange = document.getWordRangeAtPosition(position, /\$\{[\w:.\-<>?!+*/=]+\}/);
                        const dollarRange = bracedRange || document.getWordRangeAtPosition(position, /(?<!\\)\$[\w:-]+/);
                        if (dollarRange) {
                            let dollarWord = stripTclVarPrefix(document.getText(dollarRange));
                            const cursorLine = position.line + 1;
                            const scopeIndex = tclCache.getScopeIndex(document);
                            if (scopeIndex) {
                                const resolved = scopeIndex.resolveDefinition(dollarWord, cursorLine);
                                if (resolved) {
                                    def = userDefs.find(d => d.name === dollarWord && d.line === resolved.defLine);
                                }
                            }
                            if (!def) {
                                for (const d of userDefs) {
                                    if (d.name === dollarWord && d.line <= cursorLine) {
                                        if (!def || d.line > def.line) def = d;
                                    }
                                }
                            }
                            if (def) {
                                hoverRange = dollarRange;
                            } else if (dollarRange) {
                                // 检查是否为 SWB 环境变量
                                const envVars = vscode.workspace.getConfiguration('sentaurus').get('environmentVariables', {});
                                if (Object.prototype.hasOwnProperty.call(envVars, dollarWord)) {
                                    const md = new vscode.MarkdownString();
                                    md.appendMarkdown(`**${dollarWord}** (${useZh ? '🏠 环境变量' : '🏠 Env Variable'})`);
                                    const docStr = envVars[dollarWord];
                                    if (docStr && docStr.trim()) {
                                        md.appendMarkdown('\n\n' + docStr);
                                    }
                                    return new vscode.Hover(md, dollarRange);
                                }
                            }
                        }
                        // ppDefine 兜底：无 $ 前缀的宏引用（如 _Vds_）
                        if (!def) {
                            const cursorLine = position.line + 1;
                            const ppDef = [...userDefs].reverse().find(d => d.kind === 'ppDefine' && d.name === identWord && d.line <= cursorLine);
                            if (ppDef) {
                                def = ppDef;
                                hoverRange = identRange;
                            }
                        }
                    } else {
                        def = userDefs.find(d => d.name === identWord);
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

        // DefinitionProvider
        const definitionDisposable = vscode.languages.registerDefinitionProvider(
            { language: langId },
            {
                provideDefinition(document, position) {
                    try {
                    if (isInComment(document, position, langId)) return null;
                    const cursorLine = position.line + 1;

                    if (langId === 'sde') {
                        const range = document.getWordRangeAtPosition(position, /[\w:.\-<>?!+*/=]+/);
                        if (!range) return null;
                        const word = document.getText(range);
                        const entry = schemeCache.get(document);
                        if (!entry) return null;
                        const { scopeTree, lineStarts } = entry;
                        const visibleDefs = scopeAnalyzer.getVisibleDefinitions(scopeTree, cursorLine);
                        const def = visibleDefs.find(d => d.name === word);
                        if (!def) {
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

                    const bracedRange = document.getWordRangeAtPosition(position, /\$\{[\w:.\-<>?!+*/=]+\}/);
                    const dollarRange = document.getWordRangeAtPosition(position, /(?<!\\)\$[\w:-]+/);
                    const plainRange = document.getWordRangeAtPosition(position, /[\w:-]+/);
                    const range = bracedRange || dollarRange || plainRange;
                    if (!range) return null;
                    let word = stripTclVarPrefix(document.getText(range));
                    if (!word) return null;

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

    return result;
}

module.exports = { registerCompletionProviders, loadDocsJson };
