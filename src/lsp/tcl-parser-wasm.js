// src/lsp/tcl-parser-wasm.js
'use strict';

const Parser = require('web-tree-sitter');
const path = require('path');

let _parser = null;       // 单例 Parser 实例
let _tclLanguage = null;  // 单例 Language 对象
let _initPromise = null;  // 防止重复初始化
let _outputChannel = null;

// ── 调试输出工具 ────────────────────────────────
function debug(...args) {
    const ts = new Date().toISOString().slice(11, 23);
    const msg = `[tcl-wasm ${ts}] ${args.join(' ')}`;
    if (_outputChannel) {
        _outputChannel.appendLine(msg);
    }
    // 同时输出到 console，方便在 Developer Tools 中查看
    console.log(msg);
}

// ── AST 可视化 ──────────────────────────────────
function printNode(node, indent = 0) {
    const prefix = '  '.repeat(indent);
    const fields = [];
    if (node.childCount > 0) fields.push(`children=${node.childCount}`);
    const text = node.text.length > 60
        ? node.text.slice(0, 57) + '...'
        : node.text;
    fields.push(`text="${text}"`);
    debug(`${prefix}${node.type} [${node.startPosition.row}:${node.startPosition.column} - ${node.endPosition.row}:${node.endPosition.column}] ${fields.join(', ')}`);
    for (let i = 0; i < node.childCount; i++) {
        printNode(node.child(i), indent + 1);
    }
}

/**
 * 统计 AST 中各类节点的数量。
 */
function collectStats(node, stats = {}) {
    stats[node.type] = (stats[node.type] || 0) + 1;
    for (let i = 0; i < node.childCount; i++) {
        collectStats(node.child(i), stats);
    }
    return stats;
}

/**
 * 初始化 WASM Tcl 解析器。
 * 必须在 VSCode 扩展 activate() 中调用一次。
 *
 * @param {vscode.ExtensionContext} context
 * @param {vscode.OutputChannel} outputChannel - 用于输出调试信息
 * @returns {Promise<{parser: Parser, language: object}>}
 */
async function init(context, outputChannel) {
    if (_initPromise) return _initPromise;

    _outputChannel = outputChannel;
    debug('=== 开始初始化 Tcl WASM 解析器 ===');

    _initPromise = (async () => {
        try {
            // Step 1: 初始化 web-tree-sitter WASM 运行时
            debug('Step 1: 初始化 web-tree-sitter 运行时...');
            const wasmRuntimePath = path.join(
                context.extensionPath,
                'node_modules', 'web-tree-sitter', 'web-tree-sitter.wasm'
            );
            debug(`  WASM runtime 路径: ${wasmRuntimePath}`);

            await Parser.init({
                locateFile(scriptName /*, scriptDirectory */) {
                    const resolved = path.join(
                        context.extensionPath,
                        'node_modules', 'web-tree-sitter', scriptName
                    );
                    debug(`  locateFile 解析: ${scriptName} -> ${resolved}`);
                    return resolved;
                },
            });
            debug('  web-tree-sitter 运行时初始化成功!');

            // Step 2: 加载 tree-sitter-tcl 语法 WASM
            debug('Step 2: 加载 tree-sitter-tcl 语法...');
            const grammarPath = path.join(
                context.extensionPath,
                'syntaxes', 'tree-sitter-tcl.wasm'
            );
            debug(`  语法 WASM 路径: ${grammarPath}`);

            // 0.22.6: Parser.Language 在 init() 之后才可用
            _tclLanguage = await Parser.Language.load(grammarPath);
            debug(`  Tcl 语法加载成功!`);
            debug(`  语言节点类型数量: ${_tclLanguage.nodeTypeCount}`);
            debug(`  语言字段数量: ${_tclLanguage.fieldCount}`);

            // Step 3: 创建 Parser 实例
            debug('Step 3: 创建 Parser 实例...');
            _parser = new Parser();
            _parser.setLanguage(_tclLanguage);
            debug('  Parser 实例创建成功!');

            debug('=== Tcl WASM 解析器初始化完成 ===');

            // Step 4: 运行自检
            await selfTest();

            return { parser: _parser, language: _tclLanguage };
        } catch (err) {
            debug(`!!! 初始化失败: ${err.message}`);
            debug(`  堆栈: ${err.stack}`);
            throw err;
        }
    })();

    return _initPromise;
}

/**
 * 自检：解析一段简单的 Tcl 代码并输出结果。
 */
async function selfTest() {
    debug('--- 自检开始 ---');

    const testCases = [
        {
            name: '简单 set 命令',
            code: 'set x 42',
        },
        {
            name: 'sdevice section 风格',
            code: `Device {
    Electrode { Name="gate" Voltage=0.0 }
    Physics { Mobility( PhuMob ) }
}`,
        },
        {
            name: 'sprocess 顺序命令',
            code: `deposit Silicon thickness=0.05 um
diffuse temperature=900 C time=60 s`,
        },
        {
            name: 'inspect 函数调用',
            code: `set Vt [ExtractVtgm Vtgm $CURVE]
cv_createDS IV "PLT($N) g OuterVoltage" "PLT($N) g TotalCurrent"`,
        },
    ];

    for (const tc of testCases) {
        debug(`\n测试: ${tc.name}`);
        debug(`代码: ${tc.code.replace(/\n/g, '\\n')}`);

        try {
            const tree = _parser.parse(tc.code);
            if (!tree) {
                debug('  结果: tree 为 null!');
                continue;
            }
            const root = tree.rootNode;
            debug(`  根节点: ${root.type}, 子节点数: ${root.childCount}`);
            debug(`  是否有错误: ${root.hasError}`);
            if (root.hasError) {
                debug('  *** 注意: 存在解析错误，可能是语法不完全兼容 ***');
            }

            // 打印 AST 结构（限制深度避免过长）
            debug('  AST 结构:');
            printNode(root, 2);

            // 节点类型统计
            const stats = collectStats(root);
            const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
            debug(`  节点统计: ${sorted.map(([k, v]) => `${k}(${v})`).join(', ')}`);

            tree.delete();
        } catch (err) {
            debug(`  解析失败: ${err.message}`);
        }
    }

    debug('--- 自检完成 ---');
}

/**
 * 解析 Tcl 源代码，返回 AST tree。
 * 调用方负责调用 tree.delete() 释放内存。
 *
 * @param {string} text - Tcl 源代码
 * @returns {import('web-tree-sitter').Tree | null}
 */
function parse(text) {
    if (!_parser) {
        debug('ERROR: 解析器未初始化，请先调用 init()');
        return null;
    }
    return _parser.parse(text);
}

/**
 * 解析 Tcl 源代码并输出调试信息。
 * 用于测试命令。
 *
 * @param {string} text - Tcl 源代码
 * @returns {{ tree: object, rootType: string, childCount: number, hasError: boolean, stats: object }}
 */
function parseWithDebug(text) {
    if (!_parser) {
        debug('ERROR: 解析器未初始化');
        return null;
    }

    debug(`\n>>> 解析文档 (${text.length} 字符, ${text.split('\\n').length} 行)`);
    const tree = _parser.parse(text);
    if (!tree) {
        debug('  结果: tree 为 null!');
        return null;
    }

    const root = tree.rootNode;
    debug(`  根节点: ${root.type}, 子节点数: ${root.childCount}`);
    debug(`  是否有错误: ${root.hasError}`);

    // 打印前 3 层 AST
    debug('  AST (前3层):');
    printNode(root, 2);

    const stats = collectStats(root);
    const result = {
        tree,
        rootType: root.type,
        childCount: root.childCount,
        hasError: root.hasError,
        stats,
    };

    // 不自动 delete tree，让调用者决定
    return result;
}

/**
 * 检查解析器是否已初始化。
 */
function isReady() {
    return _parser !== null && _tclLanguage !== null;
}

module.exports = {
    init,
    parse,
    parseWithDebug,
    isReady,
};
