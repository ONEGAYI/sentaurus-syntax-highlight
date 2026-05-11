// src/commands/env-var-manager.js
'use strict';

const vscode = require('vscode');

const CONFIG_KEY = 'environmentVariables';

const ZH = {
    addPrompt: '输入要添加的环境变量名，以空格或换行分隔',
    addPlaceholder: '例如: VarA VarB VarC 或每行一个变量名',
    allExist: 'Sentaurus: 输入的变量均已在白名单中',
    added: (n, names) => `Sentaurus: 已添加 ${n} 个环境变量：${names}`,
    noVars: 'Sentaurus: 当前没有已配置的环境变量',
    removeTitle: '搜索并删除环境变量',
    removePlaceholder: '输入关键词搜索，勾选要删除的变量后确认',
    regexTooltip: '点击切换正则表达式匹配模式',
    removed: (n, names) => `Sentaurus: 已删除 ${n} 个环境变量：${names}`,
    envVarLabel: '🏠 环境变量',
};

const EN = {
    addPrompt: 'Enter environment variable names, separated by spaces or newlines',
    addPlaceholder: 'e.g.: VarA VarB VarC or one per line',
    allExist: 'Sentaurus: All entered variables are already in the whitelist',
    added: (n, names) => `Sentaurus: Added ${n} environment variable(s): ${names}`,
    noVars: 'Sentaurus: No environment variables configured',
    removeTitle: 'Search and Remove Environment Variables',
    removePlaceholder: 'Type to search, check items to remove, then confirm',
    regexTooltip: 'Toggle regex matching mode',
    removed: (n, names) => `Sentaurus: Removed ${n} environment variable(s): ${names}`,
    envVarLabel: '🏠 Env Variable',
};

function i18n() {
    return vscode.env.language.startsWith('zh') ? ZH : EN;
}

/**
 * 注册"添加环境变量"命令。
 * 弹出输入框接收空格/换行分隔的变量名列表，去重后批量写入配置。
 */
function registerAddEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.addEnvironmentVariables', async () => {
        const t = i18n();
        const config = vscode.workspace.getConfiguration('sentaurus');
        const current = config.get(CONFIG_KEY, {});

        const input = await vscode.window.showInputBox({
            prompt: t.addPrompt,
            placeHolder: t.addPlaceholder,
        });

        if (!input || !input.trim()) return;

        const names = input.split(/\s+/).filter(Boolean);
        const existing = new Set(Object.keys(current));
        const toAdd = names.filter(n => !existing.has(n));

        if (toAdd.length === 0) {
            await vscode.window.showInformationMessage(t.allExist);
            return;
        }

        const newEnvVars = { ...current };
        for (const name of toAdd) {
            newEnvVars[name] = '';
        }

        await config.update(CONFIG_KEY, newEnvVars, vscode.ConfigurationTarget.Global);
        await vscode.window.showInformationMessage(t.added(toAdd.length, toAdd.join(', ')));
    });
    context.subscriptions.push(disposable);
}

/**
 * 注册"搜索删除环境变量"命令。
 * QuickPick 多选界面，支持子字符串/正则匹配切换。
 */
function registerRemoveEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.removeEnvironmentVariables', async () => {
        const t = i18n();
        const config = vscode.workspace.getConfiguration('sentaurus');
        const current = config.get(CONFIG_KEY, {});

        const allItems = Object.entries(current).map(([name, doc]) => ({
            label: name,
            description: doc || '',
        }));

        if (allItems.length === 0) {
            await vscode.window.showInformationMessage(t.noVars);
            return;
        }

        const qp = vscode.window.createQuickPick();
        qp.canSelectMany = true;
        qp.title = t.removeTitle;
        qp.placeholder = t.removePlaceholder;
        qp.matchOnDescription = true;

        let useRegex = false;
        const selectedSet = new Set();

        qp.buttons = [{
            iconPath: new vscode.ThemeIcon('regex'),
            tooltip: t.regexTooltip,
        }];

        function updateItems(input) {
            let filtered = allItems;
            if (input) {
                try {
                    if (useRegex) {
                        const re = new RegExp(input, 'i');
                        filtered = allItems.filter(item => re.test(item.label));
                    } else {
                        const lower = input.toLowerCase();
                        filtered = allItems.filter(item => item.label.toLowerCase().includes(lower));
                    }
                } catch (_) {
                    filtered = [];
                }
            }
            qp.items = filtered.map(item => ({
                ...item,
                picked: selectedSet.has(item.label),
            }));
        }

        qp.onDidTriggerButton(() => {
            useRegex = !useRegex;
            updateItems(qp.value);
        });

        qp.onDidChangeSelection(selection => {
            selectedSet.clear();
            for (const item of selection) {
                selectedSet.add(item.label);
            }
        });

        qp.onDidChangeValue(updateItems);
        qp.items = allItems;

        qp.onDidAccept(async () => {
            const selected = qp.selectedItems.map(i => i.label);
            qp.hide();

            if (selected.length === 0) return;

            const newEnvVars = { ...current };
            for (const name of selected) {
                delete newEnvVars[name];
            }

            await config.update(CONFIG_KEY, newEnvVars, vscode.ConfigurationTarget.Global);
            await vscode.window.showInformationMessage(t.removed(selected.length, selected.join(', ')));
        });

        qp.onDidHide(() => qp.dispose());
        qp.show();
    });
    context.subscriptions.push(disposable);
}

module.exports = { registerAddEnvVarsCommand, registerRemoveEnvVarsCommand };
