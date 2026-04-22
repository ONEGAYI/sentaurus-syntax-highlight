const vscode = require('vscode');
const {
    isLastOpenParenEmpty,
    findClosingParens,
    findUnmatchedOpenParenColumns,
    CLOSE_PARENS_RE,
} = require('./scheme-on-enter-logic');

/**
 * Scheme 括号回车自动缩进（含嵌套场景）。
 *
 * 监听文档变更，检测在 ) 前回车的情况，
 * 将光标定位到缩进空行，每个 ) 按嵌套深度缩进。
 *
 * 与 sde.json 的 onEnterRules 协同工作：
 * - onEnterRules 处理基本场景（beforeText 不以 ) 结尾）
 * - 本 provider 处理 onEnterRules 无法覆盖的场景
 * 排除：空括号 ()、注释行（前导 ;）。
 */

let _applying = false;

function activate(context) {
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange)
    );
}

function onDocumentChange(event) {
    if (_applying) return;
    if (event.document.languageId !== 'sde') return;

    const change = event.contentChanges[0];
    if (!change) return;

    // 兼容 CRLF（\r\n）和 LF（\n）
    if (!change.text.startsWith('\n') && !change.text.startsWith('\r\n')) return;

    const prevLineNum = change.range.start.line;
    const currLineNum = prevLineNum + 1;
    if (currLineNum >= event.document.lineCount) return;

    const prevText = event.document.lineAt(prevLineNum).text;
    const currText = event.document.lineAt(currLineNum).text;

    // 排除注释行
    if (/^\s*;/.test(prevText)) return;

    // 找到上一行所有未闭合 ( 的列位置
    const openCols = findUnmatchedOpenParenColumns(prevText);
    if (openCols.length === 0) return;

    // 在当前行或下一行查找闭括号（VSCode auto-indent 可能将 ) 推到下一行）
    const nextText = currLineNum + 1 < event.document.lineCount
        ? event.document.lineAt(currLineNum + 1).text : undefined;
    const { match, linesToReplace } = findClosingParens(currText, nextText);
    if (!match) return;

    // 仅在单层空括号时跳过多级缩进（嵌套场景即使内层为空也应展开）
    if (isLastOpenParenEmpty(prevText) && match[2].length <= 1) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    // 检测缩进单位
    const insertSpaces = editor.options.insertSpaces === true;
    const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
    const indentUnit = insertSpaces ? ' '.repeat(tabSize) : '\t';

    const totalClose = match[2].length;
    const trailing = match[3];

    const lastOpenCol = openCols[openCols.length - 1];
    const baseIndent = prevText.match(/^(\s*)/)[1];

    // 缩进策略：若 ( 位于纯空白前缀中，用精确列对齐；否则按深度缩进（保持 tab 对齐）
    function indentForColIdx(colIdx) {
        const col = openCols[colIdx];
        const prefix = prevText.substring(0, col);
        if (/^\s*$/.test(prefix)) return prefix;
        return baseIndent + indentUnit.repeat(colIdx);
    }

    // 构建替换文本
    let replacement = '';

    // 光标行：最内层 ( 的缩进再深一级
    const bodyIndent = indentForColIdx(openCols.length - 1);
    replacement += bodyIndent + indentUnit + '\n';

    // 每个 ) 单独一行，对齐到对应的 (
    for (let i = 0; i < totalClose; i++) {
        const colIdx = openCols.length - 1 - i;
        if (colIdx >= 0) {
            replacement += indentForColIdx(colIdx);
        }
        replacement += ')';
        if (i < totalClose - 1) {
            replacement += '\n';
        } else if (trailing) {
            replacement += trailing;
        }
    }

    // 应用编辑并定位光标
    const replaceStart = currLineNum;
    const replaceEnd = currLineNum + linesToReplace - 1;
    _applying = true;
    editor.edit(editBuilder => {
        editBuilder.replace(
            new vscode.Range(replaceStart, 0, replaceEnd, event.document.lineAt(replaceEnd).text.length),
            replacement
        );
    }).then(() => {
        const cursorCol = bodyIndent.length + indentUnit.length;
        const newPos = new vscode.Position(replaceStart, cursorCol);
        editor.selection = new vscode.Selection(newPos, newPos);
        _applying = false;
    }, () => {
        _applying = false;
    });
}

module.exports = { activate };
