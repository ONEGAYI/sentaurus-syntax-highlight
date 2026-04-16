const vscode = require('vscode');
const { shouldTrigger } = require('./unit-auto-close-logic');

/**
 * SPROCESS Unit 自动配对。
 *
 * 当在数字后输入 < 时，自动补全 > 并将光标放在中间。
 * 典型场景：10<nm>、0.5<um>、1e15<cm-2>、900<C>
 */

let _applying = false;

/**
 * 注册 SPROCESS Unit 自动配对 provider。
 */
function activate(context) {
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange)
    );
}

function onDocumentChange(event) {
    if (_applying) return;
    if (event.document.languageId !== 'sprocess') return;

    const change = event.contentChanges[0];
    if (!change || change.text !== '<') return;

    const pos = change.range.start;
    if (pos.character === 0) return;

    // 获取 '<' 前面到行首的文本，用于正则匹配数字模式
    const line = event.document.lineAt(pos.line).text;
    const linePrefix = line.substring(0, pos.character);

    if (!shouldTrigger(change, linePrefix)) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    // 在 '<' 之后插入 '>'，光标在中间（$0）
    const insertPos = new vscode.Position(pos.line, pos.character + 1);
    _applying = true;
    editor.insertSnippet(new vscode.SnippetString('$0>'), insertPos).then(() => {
        _applying = false;
    }, () => {
        _applying = false;
    });
}

module.exports = { activate };
