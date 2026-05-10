// src/lsp/providers/diagnostic-factory.js
'use strict';

const vscode = require('vscode');

const DEBOUNCE_MS = 500;

/**
 * 创建标准化的诊断 Provider 激活模式。
 * 统一处理 debounce、DiagnosticCollection 创建、事件订阅和初始扫描。
 *
 * @param {object} opts
 * @param {string} opts.name - DiagnosticCollection 名称（如 'sde-brackets'）
 * @param {(doc: vscode.TextDocument) => boolean} opts.languageFilter - 文档语言过滤函数
 * @param {vscode.ExtensionContext} opts.context - 扩展上下文
 * @param {(doc: vscode.TextDocument) => void} opts.updateFn - 实际诊断更新函数
 * @param {boolean} [opts.watchOpen=true] - 是否监听 onDidOpenTextDocument
 * @returns {{ diagnosticCollection: vscode.DiagnosticCollection, updateDiagnostics: (doc: vscode.TextDocument) => void }}
 */
function createDiagnosticProvider({ name, languageFilter, context, updateFn, watchOpen = true }) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection(name);
    context.subscriptions.push(diagnosticCollection);

    let debounceTimer;

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const doc = event.document;
            if (!languageFilter(doc)) return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => updateFn(doc), DEBOUNCE_MS);
        })
    );

    if (watchOpen) {
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => {
                if (languageFilter(doc)) updateFn(doc);
            })
        );
    }

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            if (languageFilter(doc)) diagnosticCollection.delete(doc.uri);
        })
    );

    // 初始扫描已在编辑器中打开的文档
    if (watchOpen) {
        for (const doc of vscode.workspace.textDocuments) {
            if (languageFilter(doc)) updateFn(doc);
        }
    }

    return { diagnosticCollection, updateDiagnostics: updateFn };
}

module.exports = { createDiagnosticProvider, DEBOUNCE_MS };
