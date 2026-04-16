const vscode = require('vscode');
const { shouldTrigger, shouldDelete } = require('./unit-auto-close-logic');

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
    if (!change) return;

    const pos = change.range.start;
    const line = event.document.lineAt(pos.line).text;

    if (change.text === '<' && change.rangeLength === 0) {
        // 自动补全：数字后输入 < → 插入 >
        if (pos.character === 0) return;
        const linePrefix = line.substring(0, pos.character);

        if (!shouldTrigger(change, linePrefix)) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;

        const insertPos = new vscode.Position(pos.line, pos.character + 1);
        _applying = true;
        editor.insertSnippet(new vscode.SnippetString('$0>'), insertPos).then(() => {
            _applying = false;
        }, () => {
            _applying = false;
        });
    } else if (change.text === '' && change.rangeLength === 1) {
        // 删除配对：数字后空 <> 中退格删除 < → 连带删除 >
        const linePrefix = line.substring(0, pos.character);
        const charAfter = line.charAt(pos.character);

        if (!shouldDelete(change, linePrefix, charAfter)) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;

        const deleteRange = new vscode.Range(pos, new vscode.Position(pos.line, pos.character + 1));
        _applying = true;
        editor.edit(builder => builder.delete(deleteRange)).then(() => {
            _applying = false;
        }, () => {
            _applying = false;
        });
    }
}

module.exports = { activate };
