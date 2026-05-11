// src/lsp/providers/tcl-env-var-semantic.js
'use strict';

const vscode = require('vscode');
const ppUtils = require('../pp-utils');
const { getVariableRefs } = require('../tcl-variable-extractor');

const TOKEN_TYPES = ['environmentVariable'];
const TOKEN_MODIFIERS = [];

/**
 * 创建环境变量 Semantic Tokens Provider。
 * 遍历文档中使用 tree-sitter AST 提取的所有变量引用，
 * 匹配 sentaurus.environmentVariables 配置中的环境变量名，
 * 生成 environmentVariable 类型的 semantic token。
 *
 * @param {object} tclCache - TclParseCache 实例
 * @returns {{ provideDocumentSemanticTokens: function }}
 */
function createEnvVarSemanticProvider(tclCache) {
    return {
        provideDocumentSemanticTokens(document) {
            const entry = tclCache.get(document);
            if (!entry) return { data: new Uint32Array(0) };

            const config = vscode.workspace.getConfiguration('sentaurus');
            const envVars = config.get('environmentVariables', {});
            const envVarSet = new Set(Object.keys(envVars));
            if (envVarSet.size === 0) return { data: new Uint32Array(0) };

            const refs = getVariableRefs(entry.tree.rootNode);
            const rawTokens = [];
            for (const ref of refs) {
                if (envVarSet.has(ref.name)) {
                    rawTokens.push([ref.line - 1, ref.startCol, ref.endCol - ref.startCol, 0, 0]);
                }
            }

            if (rawTokens.length === 0) {
                return { data: new Uint32Array(0) };
            }

            rawTokens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            return { data: ppUtils.encodeDelta5(rawTokens) };
        },
    };
}

module.exports = {
    createEnvVarSemanticProvider,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
