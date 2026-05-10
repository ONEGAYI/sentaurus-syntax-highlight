// src/register-sde-providers.js
'use strict';

const vscode = require('vscode');
const foldingProviderMod = require('./lsp/providers/folding-provider');
const bracketDiagnostic = require('./lsp/providers/bracket-diagnostic');
const schemeOnEnterProvider = require('./lsp/providers/scheme-on-enter-provider');
const semanticTokensMod = require('./lsp/providers/semantic-tokens-provider');
const signatureProvider = require('./lsp/providers/signature-provider');
const regionUndefDiagnostic = require('./lsp/providers/region-undef-diagnostic');
const symbolCompletion = require('./lsp/providers/symbol-completion');
const symbolReferenceProvider = require('./lsp/providers/symbol-reference-provider');

/**
 * Register all SDE (Scheme) language providers.
 * @param {vscode.ExtensionContext} context
 * @param {object} deps
 * @param {object} deps.schemeCache
 * @param {object} deps.modeDispatchTable
 * @param {object} deps.langFuncDocs
 * @param {Set} deps.builtinMaterials
 */
function registerSdeProviders(context, deps) {
    const { schemeCache, modeDispatchTable, langFuncDocs, builtinMaterials } = deps;

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

    // Region/Material/Contact 未定义语义诊断（SDE only）
    regionUndefDiagnostic.activate(context, schemeCache, builtinMaterials);

    // Semantic Tokens (SDE only) — 用户定义函数调用高亮
    const stLegend = new vscode.SemanticTokensLegend(
        semanticTokensMod.TOKEN_TYPES,
        semanticTokensMod.TOKEN_MODIFIERS
    );
    const stProvider = semanticTokensMod.createSemanticTokensProvider(schemeCache);
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'sde' },
            stProvider,
            stLegend
        )
    );

    // Signature Help (SDE only)
    const sigHelpDisposable = vscode.languages.registerSignatureHelpProvider(
        { language: 'sde' },
        {
            provideSignatureHelp(document, position, token) {
                try {
                    return signatureProvider.provideSignatureHelp(
                        document, position, token,
                        modeDispatchTable, langFuncDocs.sde,
                        schemeCache
                    );
                } catch (e) {
                    console.error('Sentaurus: provideSignatureHelp error', e);
                    return null;
                }
            },
        },
        ' ', '\t', '"', '('
    );
    context.subscriptions.push(sigHelpDisposable);

    // Symbol completion (SDE only) — region/material/contact 补全
    symbolCompletion.activate(context, schemeCache, modeDispatchTable, vscode);

    // Find All References (SDE only) — region/material/contact
    symbolReferenceProvider.activate(context, schemeCache, vscode);
}

module.exports = { registerSdeProviders };
