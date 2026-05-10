// src/lsp/providers/undef-var-diagnostic.js
'use strict';

const vscode = require('vscode');
const astUtils = require('../tcl-ast-utils');
const scopeAnalyzer = require('../scope-analyzer');
const ppUtils = require('../pp-utils');
const { createDiagnosticProvider } = require('./diagnostic-factory');

/** @type {import('../parse-cache').SchemeParseCache} */
let schemeCache;
/** @type {import('../parse-cache').TclParseCache} */
let tclCache;

/** Sentaurus 工具链隐式注入的变量白名单 */
const TCL_BUILTIN_VARS = new Set([
    'DesName', 'Pwd', 'Pd', 'ProjDir', 'Tooldir', 'env',
    'TOOLS_PRE', 'TOOLS_POST',
]);

/** Scheme (SDE) 隐式变量白名单 */
const SCHEME_BUILTIN_VARS = new Set([
    'argc', 'argv',
    'PI',         // SDE 预定义数学常量
]);

/** Tcl 语言集合 */
const TCL_LANG_SET = astUtils.TCL_LANGS;

/** @type {vscode.DiagnosticCollection} */
let diagnosticCollection;

/**
 * 注册未定义变量诊断（Tcl 方言部分）。
 * @param {vscode.ExtensionContext} context
 */
function activate(context, schemeCacheInstance, tclCacheInstance) {
    schemeCache = schemeCacheInstance;
    tclCache = tclCacheInstance;

    const provider = createDiagnosticProvider({
        name: 'undef-var-tcl',
        languageFilter: doc => TCL_LANG_SET.has(doc.languageId) || doc.languageId === 'sde',
        context,
        updateFn: updateDiagnostics,
    });
    diagnosticCollection = provider.diagnosticCollection;
    provider.initialScan();
}

/**
 * 更新单个文档的未定义变量诊断。
 * @param {vscode.TextDocument} doc
 */
function updateDiagnostics(doc) {
    try {
        const langId = doc.languageId;

        let diagnostics;
        if (langId === 'sde') {
            diagnostics = checkSchemeUndefVars(doc);
        } else {
            diagnostics = checkTclUndefVars(doc);
        }

        diagnosticCollection.set(doc.uri, diagnostics);
    } catch (e) {
        console.error('Sentaurus: undef-var diagnostic error', e);
        diagnosticCollection.set(doc.uri, []);
    }
}

/**
 * 检查 Tcl 代码中的未定义变量引用。
 * 使用 TclParseCache 管理 tree 生命周期，不再调用 tree.delete()。
 * @param {vscode.TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function checkTclUndefVars(document) {
    const entry = tclCache.get(document);
    if (!entry) return [];

    const root = entry.tree.rootNode;
    const refs = astUtils.getVariableRefs(root);
    const scopeIndex = tclCache.getScopeIndex(document);
    if (!scopeIndex) return [];

    const diagnostics = [];
    for (const ref of refs) {
        // 跳过白名单变量
        if (TCL_BUILTIN_VARS.has(ref.name)) continue;

        // 检查引用行是否可见该变量
        const visibleAtLine = scopeIndex.getVisibleAt(ref.line);
        if (!visibleAtLine || !visibleAtLine.has(ref.name)) {
            const range = new vscode.Range(
                ref.line - 1, ref.startCol,
                ref.line - 1, ref.endCol
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `未定义的变量: ${ref.name}`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'undef-var';
            diagnostics.push(diagnostic);
        }
    }

    // #ifdef / #ifndef 未定义宏诊断 — 使用缓存的 ppDefs
    const definedNames = new Set(entry.ppDefs.map(d => d.name));
    for (const u of ppUtils.findUndefPpMacroRefs(entry.text, definedNames)) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(u.line, u.startCol, u.line, u.endCol),
            `未定义的预处理宏: ${u.name}`,
            vscode.DiagnosticSeverity.Hint
        );
        diagnostic.source = 'undef-macro';
        diagnostics.push(diagnostic);
    }

    return diagnostics;
}

/**
 * 加载 Scheme 已知名称集合（SDE 内置函数 + Scheme 标准函数）。
 * 惰性加载，只初始化一次。
 * @returns {Set<string>}
 */
let _schemeKnownNames = null;
function getSchemeKnownNames() {
    if (_schemeKnownNames) return _schemeKnownNames;

    _schemeKnownNames = new Set();

    // 从 all_keywords.json 加载 SDE 所有等级的关键词（KEYWORD1/2、FUNCTION）
    // 这是普适规则：语法文件中定义的所有关键词均视为已知名称，不会被误报为未定义变量
    // XML 提取时 <, >, & 被转义为 HTML 实体，此处统一解码以匹配源码中的原始标识符
    try {
        const allKw = require('../../../syntaxes/all_keywords.json');
        const sdeKw = allKw && allKw.sde;
        if (sdeKw) {
            for (const cat of ['KEYWORD1', 'KEYWORD2', 'FUNCTION']) {
                if (sdeKw[cat]) {
                    for (const name of sdeKw[cat]) {
                        _schemeKnownNames.add(ppUtils.decodeHtml(name));
                    }
                }
            }
        }
    } catch (e) { /* 文件不存在时忽略 */ }

    // 添加白名单变量
    for (const name of SCHEME_BUILTIN_VARS) {
        _schemeKnownNames.add(name);
    }

    return _schemeKnownNames;
}

const SCOPE_TYPE_LABELS = {
    global: '全局',
    function: '函数',
    let: 'let',
    do: 'do',
    lambda: 'lambda',
};

/**
 * 构建预处理指令分支映射。
 * 分析 #if/#else/#elif/#endif 块，为每个分支分配唯一 ID。
 * @param {string} text - 文档原始文本
 * @returns {Map<number, number>} 行号 → 分支 ID
 */
function buildPpBranchMap(text) {
    return ppUtils.buildPpBlocks(text).branchMap;
}

/**
 * 检测同一作用域内的重复定义。
 * 条件分支（if/cond/case 和 #if/#else/#endif）中的同名定义不视为重复。
 * @param {object} scopeTree - buildScopeTree 返回的作用域树
 * @param {string} [text] - 文档原始文本（用于 #if 分支分析）
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeDuplicateDefs(scopeTree, text) {
    const diagnostics = [];
    const ppBranchMap = text ? buildPpBranchMap(text) : null;

    function getBranchKey(def) {
        const parts = [];
        if (def.condGroup !== undefined) {
            parts.push(`c:${def.condGroup}:${def.condBranch}`);
        }
        if (ppBranchMap) {
            const ppBranch = ppBranchMap.get(def.line);
            if (ppBranch !== undefined) {
                parts.push(`p:${ppBranch}`);
            }
        }
        return parts.length > 0 ? parts.join('|') : '';
    }

    function walkScope(scope) {
        const seen = new Map(); // composite key → first definition
        for (const def of scope.definitions) {
            const branchKey = getBranchKey(def);
            const key = `${def.name}@${branchKey}`;
            if (seen.has(key)) {
                const first = seen.get(key);
                const range = new vscode.Range(
                    def.line - 1, def.start,
                    def.line - 1, def.end
                );
                const scopeLabel = SCOPE_TYPE_LABELS[scope.type] || scope.type;
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `重复定义: '${def.name}' 已在第 ${first.line} 行定义（当前作用域: ${scopeLabel}）`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'dup-def';
                diagnostics.push(diagnostic);
            } else {
                seen.set(key, def);
            }
        }
        for (const child of scope.children) {
            walkScope(child);
        }
    }

    walkScope(scopeTree);
    return diagnostics;
}

/**
 * 检查 Scheme 代码中的未定义变量引用。
 * @param {vscode.TextDocument} document
 * @returns {vscode.Diagnostic[]}
 */
function checkSchemeUndefVars(document) {
    const { ast, scopeTree, text, ppDefs } = schemeCache.get(document);
    if (!ast) return [];

    const knownNames = getSchemeKnownNames();
    const refs = scopeAnalyzer.getSchemeRefs(ast, knownNames);

    // 收集 #define 宏名，避免将宏引用误报为未定义变量
    const ppMacroNames = new Set(ppDefs.map(d => d.name));

    const visibleCache = new Map();
    const diagnostics = [];
    for (const ref of refs) {
        if (ppMacroNames.has(ref.name)) continue;
        if (!visibleCache.has(ref.line)) {
            visibleCache.set(ref.line, scopeAnalyzer.getVisibleDefinitions(scopeTree, ref.line));
        }
        const visible = visibleCache.get(ref.line);
        const isVisible = visible.some(d => d.name === ref.name);

        if (!isVisible) {
            const range = new vscode.Range(
                ref.line - 1, ref.start,
                ref.line - 1, ref.end
            );
            const diagnostic = new vscode.Diagnostic(
                range,
                `未定义的变量: ${ref.name}`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'undef-var';
            diagnostics.push(diagnostic);
        }
    }

    // 检测同作用域内的重复定义
    diagnostics.push(...checkSchemeDuplicateDefs(scopeTree, text));

    // #ifdef / #ifndef 未定义宏诊断（SDE）
    for (const u of ppUtils.findUndefPpMacroRefs(text, ppMacroNames)) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(u.line, u.startCol, u.line, u.endCol),
            `未定义的预处理宏: ${u.name}`,
            vscode.DiagnosticSeverity.Hint
        );
        diagnostic.source = 'undef-macro';
        diagnostics.push(diagnostic);
    }

    return diagnostics;
}

/**
 * 重新扫描所有已打开的文档。
 * 用于 WASM 解析器异步初始化完成后，补充初始扫描遗漏的 Tcl 文档。
 */
function refreshAll() {
    for (const doc of vscode.workspace.textDocuments) {
        const langId = doc.languageId;
        if (TCL_LANG_SET.has(langId) || langId === 'sde') {
            updateDiagnostics(doc);
        }
    }
}

module.exports = { activate, refreshAll, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
