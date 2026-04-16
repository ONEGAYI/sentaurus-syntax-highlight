const vscode = require('vscode');
const { shouldDelete } = require('./quote-auto-delete-logic');

/**
 * 空引号对自动删除。
 *
 * 当用户在空引号对 "|' 或 '|' 中按退格删除开引号时，自动删除闭引号。
 * 适用于所有 6 种语言：sde, sdevice, sprocess, emw, inspect, svisual。
 */

const ALL_LANGUAGES = new Set([
    'sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'
]);

let _applying = false;

/**
 * 注册空引号对自动删除 provider。
 */
function activate(context) {
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange)
    );
}

function onDocumentChange(event) {
    if (_applying) return;
    if (!ALL_LANGUAGES.has(event.document.languageId)) return;

    const change = event.contentChanges[0];
    if (!change) return;

    // 只处理单字符删除（退格）
    if (change.text !== '' || change.rangeLength !== 1) return;

    const pos = change.range.start;
    const line = event.document.lineAt(pos.line).text;

    const linePrefix = line.substring(0, pos.character);
    const charAfter = line.charAt(pos.character);
    const charAfterNext = line.charAt(pos.character + 1);

    if (!shouldDelete(change, linePrefix, charAfter, charAfterNext)) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    const deleteRange = new vscode.Range(
        pos,
        new vscode.Position(pos.line, pos.character + 1)
    );
    _applying = true;
    editor.edit(builder => builder.delete(deleteRange)).then(() => {
        _applying = false;
    }, () => {
        _applying = false;
    });
}

module.exports = { activate };
