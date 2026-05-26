// src/commands/snippet-picker.js
'use strict';

const vscode = require('vscode');
const { applySnippetPrefixes } = require('../docs-loader');

// === QuickPick Snippet Data ===
const sdeSnippets = require('../snippets/sde');
const sdeviceSnippets = require('../snippets/sdevice');
const sdeviceparSnippets = require('../snippets/sdevicepar');
const sprocessSnippets = require('../snippets/sprocess');
const inspectSnippets = require('../snippets/inspect');
const meshSnippets = require('../snippets/mesh');

/** Map QuickPick category labels to snippet data modules. */
const snippetMap = {
    'Sentaurus-StructEditor': sdeSnippets,
    'Sentaurus-Device': sdeviceSnippets,
    'Sentaurus-DevicePar': sdeviceparSnippets,
    'Sentaurus-Process': sprocessSnippets,
    'Sentaurus-Inspect': inspectSnippets,
    'Sentaurus-Mesh': meshSnippets,
};

const snippetCategories = [
    'Sentaurus-Device', 'Sentaurus-DevicePar', 'Sentaurus-Inspect', 'Sentaurus-Mesh',
    'Sentaurus-Process', 'Sentaurus-StructEditor',
];

/**
 * Generic snippet QuickPick for any Sentaurus tool.
 * Two-level navigation: Category -> Snippet -> Insert.
 */
async function showToolSnippets(editor, snippetData, toolName) {
    const BACK = '$(arrow-left) Back';

    categoryLoop:
    while (true) {
        const categories = Object.keys(snippetData);
        const catItems = [
            { label: BACK },
            ...categories.map(c => ({ label: c, description: '$(chevron-right)' })),
        ];
        const cat = await vscode.window.showQuickPick(catItems, {
            placeHolder: 'Select a ' + toolName + ' category...',
        });
        if (!cat || cat.label === BACK) return;

        // Flatten nested sub-categories into a single list for this category
        const entries = [];
        for (const [subName, subData] of Object.entries(snippetData[cat.label])) {
            if (subData.lines) {
                entries.push({ label: subName, detail: subData.desc, data: subData });
            } else {
                for (const [leafName, leafData] of Object.entries(subData)) {
                    entries.push({ label: subName + ' / ' + leafName, detail: leafData.desc, data: leafData });
                }
            }
        }

        while (true) {
            const subItems = [
                { label: BACK },
                ...entries,
            ];
            const sub = await vscode.window.showQuickPick(subItems, {
                placeHolder: 'Select a ' + cat.label + ' snippet...',
            });
            if (!sub || sub.label === BACK) continue categoryLoop;

            let snippetText = sub.data.lines.join('\n') + '\n';
            if (toolName === 'Sentaurus-StructEditor') {
                snippetText = applySnippetPrefixes(snippetText);
            }
            await editor.insertSnippet(new vscode.SnippetString(snippetText));
            return;
        }
    }
}

/**
 * Register the sentaurus.insertSnippet command.
 */
function registerSnippetCommand(context) {
    const snippetDisposable = vscode.commands.registerCommand('sentaurus.insertSnippet', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        while (true) {
            const items = snippetCategories.map(label => ({
                label,
                description: '$(chevron-right)',
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a snippet category...',
            });

            if (!selected) return; // Esc at top level → exit

            const snippetData = snippetMap[selected.label];
            if (snippetData) {
                await showToolSnippets(editor, snippetData, selected.label);
                // showToolSnippets returns on Back or Esc → re-show top level
            }
        }
    });
    context.subscriptions.push(snippetDisposable);
}

module.exports = { registerSnippetCommand };
