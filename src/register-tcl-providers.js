// src/register-tcl-providers.js
'use strict';

const vscode = require('vscode');
const astUtils = require('./lsp/tcl-ast-utils');
const tclFoldingMod = require('./lsp/providers/tcl-folding-provider');
const tclBracketDiagnostic = require('./lsp/providers/tcl-bracket-diagnostic');
const tclDocSymbolMod = require('./lsp/providers/tcl-document-symbol-provider');
const sdeviceSemanticMod = require('./lsp/providers/sdevice-semantic-provider');
const tclFuncallSemantic = require('./lsp/providers/tcl-funcall-semantic');
const { SDEVICE_ALL_SECTION_KEYWORDS_LOWER } = require('./lsp/tcl-symbol-configs');

/**
 * Register all Tcl language providers (shared by sdevice, sprocess, emw, inspect, svisual).
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 * @param {object} deps.tclCache - TclParseCache instance
 * @param {function} deps.loadDocsJson - JSON loader from extension.js
 * @returns {{ sdeviceStProvider: object|null, sdeviceLowerToCanon: Map }} Provider instances needed by other modules
 */
function registerTclProviders(context, deps) {
    const { tclCache, loadDocsJson } = deps;

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
    const sdeviceStProvider = sdeviceSemanticMod.createSdeviceSemanticProvider(
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

    return {
        sdeviceStProvider,
        sdeviceLowerToCanon,
    };
}

module.exports = { registerTclProviders };
