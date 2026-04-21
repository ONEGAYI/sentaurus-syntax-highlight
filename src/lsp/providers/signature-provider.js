// src/lsp/providers/signature-provider.js
'use strict';

const dispatcher = require('../semantic-dispatcher');

/**
 * 从 modeData.params 构建签名标签。
 * 格式：(funcName param1 param2 ...)
 * @param {string} functionName
 * @param {object} modeData - { params: string[], optionals?: object[] }
 * @returns {string}
 */
function buildSignatureLabel(functionName, modeData) {
    const parts = [functionName, ...modeData.params];
    if (modeData.optionals && modeData.optionals.length > 0) {
        for (const opt of modeData.optionals) {
            if (opt.type === 'flag') {
                parts.push(`["${opt.name}"]`);
            } else if (opt.tag) {
                parts.push(`["${opt.tag}" ${opt.param || opt.name}]`);
            } else {
                parts.push(`[${opt.name}]`);
            }
        }
    }
    return '(' + parts.join(' ') + ')';
}

/**
 * 从 funcDocs 和 modeData 构建 ParameterInformation 数组。
 * @param {object} modeData
 * @param {object} funcDoc - 原始函数文档（含 parameters 数组）
 * @returns {Array<{label: string, documentation: string}>}
 */
function buildParams(modeData, funcDoc) {
    const descMap = {};
    if (funcDoc && funcDoc.parameters) {
        for (const p of funcDoc.parameters) {
            descMap[p.name.toLowerCase()] = p.desc || '';
        }
    }

    const params = [];
    for (const name of modeData.params) {
        const desc = descMap[name.toLowerCase()] || '';
        params.push({
            label: name,
            documentation: desc,
        });
    }
    if (modeData.optionals) {
        for (const opt of modeData.optionals) {
            const label = opt.type === 'flag' ? `"${opt.name}"`
                : opt.tag ? `"${opt.tag}" ${opt.param || opt.name}`
                : opt.name;
            params.push({
                label: `[${label}]`,
                documentation: descMap[(opt.param || opt.name).toLowerCase()] || 'Optional',
            });
        }
    }
    return params;
}

/**
 * 核心方法：为给定文档位置提供 SignatureHelp。
 * @param {import('vscode').TextDocument} document
 * @param {import('vscode').Position} position
 * @param {import('vscode').CancellationToken} token
 * @param {object} modeDispatchTable - 函数名 → modeDispatch 元数据
 * @param {object} funcDocs - 函数名 → 文档 的完整映射
 * @returns {object|null} VSCode SignatureHelp 结构（纯对象，不依赖 vscode 模块）
 */
function provideSignatureHelp(document, position, token, modeDispatchTable, funcDocs, schemeCache) {
    const { ast, lineStarts, analysis } = schemeCache.get(document);
    const line = position.line + 1;
    const column = position.character;

    const result = dispatcher.dispatch(ast, line, column, modeDispatchTable, lineStarts);
    if (!result) return null;
    if (result.activeParam < 0) return null;

    const { functionName, mode, modeData, activeParam } = result;
    const funcDoc = funcDocs[functionName] || null;

    if (mode && modeData) {
        const label = buildSignatureLabel(functionName, modeData);
        const params = buildParams(modeData, funcDoc);
        // argIndex=0 时，第一个参数是模式关键词（不在 params 中），
        // activeParam 需减 1 才能对齐 params 索引。
        // argIndex≥1 的函数 params 已包含模式关键词位，映射 1:1 无需偏移。
        const adjustedParam = result.argIndex === 0
            ? Math.max(0, activeParam - 1)
            : activeParam;
        return {
            signatures: [{
                label,
                parameters: params,
                documentation: funcDoc ? funcDoc.description : undefined,
            }],
            activeSignature: 0,
            activeParameter: Math.min(adjustedParam, params.length - 1),
        };
    }

    if (funcDoc && funcDoc.signature) {
        const params = (funcDoc.parameters || []).map(p => ({
            label: p.name,
            documentation: p.desc || '',
        }));
        return {
            signatures: [{
                label: funcDoc.signature,
                parameters: params,
                documentation: funcDoc.description,
            }],
            activeSignature: 0,
            activeParameter: Math.min(activeParam, params.length - 1),
        };
    }

    // Fallback: 用户定义函数（define+lambda），从 schemeCache 读取 definitions
    const userFunc = analysis.definitions.find(d => d.name === functionName && d.params);
    if (userFunc) {
        const params = userFunc.params.map(p => ({ label: p, documentation: '' }));
        return {
            signatures: [{
                label: `(${functionName} ${userFunc.params.join(' ')})`,
                parameters: params,
                documentation: '用户定义函数',
            }],
            activeSignature: 0,
            activeParameter: Math.min(activeParam, params.length - 1),
        };
    }

    return null;
}

module.exports = {
    provideSignatureHelp,
    buildSignatureLabel,
    buildParams,
};
