const vscode = require('vscode');

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

    // 统计上一行未闭合的 ( 数量
    const openCount = countUnmatchedOpenParens(prevText);
    if (openCount === 0) return;

    // 当前行必须有 1+ 个 )（仅闭合括号 + 可选空白/注释）
    const match = currText.match(/^(\s*)(\){1,})([\s;]*)$/);
    if (!match) return;

    // 排除空括号
    if (isLastOpenParenEmpty(prevText)) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    // 检测缩进单位
    const insertSpaces = editor.options.insertSpaces === true;
    const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
    const indentUnit = insertSpaces ? ' '.repeat(tabSize) : '\t';

    const totalClose = match[2].length;
    const trailing = match[3];

    // 构建替换文本
    let replacement = '';

    // 光标行：openCount 级缩进
    for (let i = 0; i < openCount; i++) {
        replacement += indentUnit;
    }
    replacement += '\n';

    // 每个 ) 单独一行，从内到外递减缩进
    for (let i = 0; i < totalClose; i++) {
        const depth = openCount - 1 - i;
        for (let j = 0; j < Math.max(0, depth); j++) {
            replacement += indentUnit;
        }
        replacement += ')';
        if (i < totalClose - 1) {
            replacement += '\n';
        } else if (trailing) {
            replacement += trailing;
        }
    }

    // 应用编辑并定位光标
    _applying = true;
    editor.edit(editBuilder => {
        editBuilder.replace(
            new vscode.Range(currLineNum, 0, currLineNum, currText.length),
            replacement
        );
    }).then(() => {
        const cursorCol = openCount * indentUnit.length;
        const newPos = new vscode.Position(currLineNum, cursorCol);
        editor.selection = new vscode.Selection(newPos, newPos);
        _applying = false;
    }, () => {
        _applying = false;
    });
}

/**
 * 统计文本中未闭合的 ( 数量。
 */
function countUnmatchedOpenParens(text) {
    let count = 0;
    for (const ch of text) {
        if (ch === '(') count++;
        if (ch === ')') count--;
    }
    return count;
}

/**
 * 检查最后一个未闭合的 ( 后是否只有空白（即空括号）。
 */
function isLastOpenParenEmpty(text) {
    let depth = 0;
    let lastOpenIndex = -1;
    for (let i = text.length - 1; i >= 0; i--) {
        if (text[i] === ')') depth++;
        if (text[i] === '(') {
            if (depth === 0) {
                lastOpenIndex = i;
                break;
            }
            depth--;
        }
    }
    if (lastOpenIndex === -1) return true;
    return /^\s*$/.test(text.substring(lastOpenIndex + 1));
}

module.exports = { activate };
