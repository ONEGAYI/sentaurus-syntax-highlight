// src/commands/env-var-manager.js
'use strict';

const vscode = require('vscode');
const fs = require('fs');

const CONFIG_KEY = 'environmentVariables';

const DEFAULT_ENV_VARS = {
    DesName: '',
    Pd: '',
    ProjDir: '',
    Pwd: '',
    TOOLS_POST: '',
    TOOLS_PRE: '',
    Tooldir: '',
    env: '',
};

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
    exportDefaultName: 'sentaurus-env-vars.json',
    exportSuccess: (path) => `Sentaurus: 已导出环境变量到 ${path}`,
    importTitle: '选择环境变量 JSON 文件',
    importFilters: 'JSON 文件',
    importNoVars: 'Sentaurus: 选择的文件中没有可导入的变量',
    importAllExist: 'Sentaurus: 文件中的变量均已在白名单中',
    imported: (n, names) => `Sentaurus: 已导入 ${n} 个环境变量：${names}`,
    importReadError: (msg) => `Sentaurus: 读取文件失败：${msg}`,
    importParseError: 'Sentaurus: 文件内容不是有效的环境变量 JSON（期望 { "VarName": "doc" } 格式）',
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
    exportDefaultName: 'sentaurus-env-vars.json',
    exportSuccess: (path) => `Sentaurus: Exported environment variables to ${path}`,
    importTitle: 'Select Environment Variables JSON File',
    importFilters: 'JSON Files',
    importNoVars: 'Sentaurus: No importable variables found in the file',
    importAllExist: 'Sentaurus: All variables from the file are already in the whitelist',
    imported: (n, names) => `Sentaurus: Imported ${n} environment variable(s): ${names}`,
    importReadError: (msg) => `Sentaurus: Failed to read file: ${msg}`,
    importParseError: 'Sentaurus: File is not valid environment variable JSON (expected { "VarName": "doc" } format)',
};

function i18n() {
    return vscode.env.language.startsWith('zh') ? ZH : EN;
}

function getEnvVars() {
    return vscode.workspace.getConfiguration('sentaurus').get(CONFIG_KEY, {});
}

function sortKeys(obj) {
    return Object.keys(obj).sort().reduce((o, k) => { o[k] = obj[k]; return o; }, {});
}

function setEnvVars(vars, skipSort) {
    const value = skipSort ? vars : sortKeys(vars);
    return vscode.workspace.getConfiguration('sentaurus').update(
        CONFIG_KEY, value, vscode.ConfigurationTarget.Global
    );
}

/** 防重入标志——避免 onDidChangeConfiguration 回调中的重排序再次触发自身 */
let _reordering = false;

function activateAutoSort(context) {
    // 首次激活：若配置为空则写入默认值
    const current = getEnvVars();
    if (Object.keys(current).length === 0) {
        setEnvVars(DEFAULT_ENV_VARS);
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (_reordering) return;
            if (!e.affectsConfiguration(`sentaurus.${CONFIG_KEY}`)) return;

            const cur = getEnvVars();
            const keys = Object.keys(cur);

            // 重置后恢复默认值
            if (keys.length === 0) {
                _reordering = true;
                setEnvVars(DEFAULT_ENV_VARS).finally(() => { _reordering = false; });
                return;
            }

            const sortedKeys = [...keys].sort();
            if (keys.every((k, i) => k === sortedKeys[i])) return;

            // 排序写入后 VS Code 设置 UI 不会刷新，通过添加再删除一个临时变量
            // 触发两次 config.update() 强制 UI 重新渲染
            _reordering = true;
            const tmpKey = `__refresh_${Date.now()}__`;

            const sorted = sortKeys({ ...cur, [tmpKey]: '' });
            setEnvVars(sorted, true).then(() => {
                const final = { ...sorted };
                delete final[tmpKey];
                setEnvVars(final, true).finally(() => { _reordering = false; });
            }).catch(() => { _reordering = false; });
        })
    );
}

/**
 * 注册"添加环境变量"命令。
 * 弹出输入框接收空格/换行分隔的变量名列表，去重后批量写入配置。
 */
function registerAddEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.addEnvironmentVariables', async () => {
        const t = i18n();
        const current = getEnvVars();

        const input = await vscode.window.showInputBox({
            prompt: t.addPrompt,
            placeHolder: t.addPlaceholder,
        });

        if (!input || !input.trim()) return;

        const names = [...new Set(input.split(/\s+/).filter(Boolean))];
        const existing = new Set(Object.keys(current));
        const toAdd = names.filter(n => !existing.has(n));

        if (toAdd.length === 0) {
            await vscode.window.showInformationMessage(t.allExist);
            return;
        }

        const additions = Object.fromEntries(toAdd.map(n => [n, '']));
        await setEnvVars({ ...current, ...additions });
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
        const current = getEnvVars();

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

            const toRemove = new Set(selected);
            const remaining = Object.fromEntries(
                Object.entries(current).filter(([k]) => !toRemove.has(k))
            );

            await setEnvVars(remaining);
            await vscode.window.showInformationMessage(t.removed(selected.length, selected.join(', ')));
        });

        qp.onDidHide(() => qp.dispose());
        qp.show();
    });
    context.subscriptions.push(disposable);
}

function validateEnvJson(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    return Object.values(obj).every(v => typeof v === 'string');
}

function registerExportEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.exportEnvironmentVariables', async () => {
        const t = i18n();
        const current = getEnvVars();

        if (Object.keys(current).length === 0) {
            await vscode.window.showInformationMessage(t.noVars);
            return;
        }

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(t.exportDefaultName),
            filters: { [t.importFilters]: ['json'] },
        });

        if (!uri) return;

        fs.writeFileSync(uri.fsPath, JSON.stringify(current, null, 2), 'utf8');
        await vscode.window.showInformationMessage(t.exportSuccess(uri.fsPath));
    });
    context.subscriptions.push(disposable);
}

function registerImportEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.importEnvironmentVariables', async () => {
        const t = i18n();
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: t.importTitle,
            filters: { [t.importFilters]: ['json'] },
        });

        if (!uris || uris.length === 0) return;

        let raw;
        try {
            raw = fs.readFileSync(uris[0].fsPath, 'utf8');
        } catch (err) {
            await vscode.window.showErrorMessage(t.importReadError(err.message));
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (_) {
            await vscode.window.showErrorMessage(t.importParseError);
            return;
        }

        if (!validateEnvJson(parsed) || Object.keys(parsed).length === 0) {
            await vscode.window.showErrorMessage(t.importParseError);
            return;
        }

        const current = getEnvVars();
        const existing = new Set(Object.keys(current));
        const toAdd = Object.entries(parsed).filter(([k]) => !existing.has(k));

        if (toAdd.length === 0) {
            await vscode.window.showInformationMessage(t.importAllExist);
            return;
        }

        const additions = Object.fromEntries(toAdd);
        await setEnvVars({ ...current, ...additions });
        await vscode.window.showInformationMessage(t.imported(toAdd.length, toAdd.map(([k]) => k).join(', ')));
    });
    context.subscriptions.push(disposable);
}

module.exports = {
    activateAutoSort,
    registerAddEnvVarsCommand,
    registerRemoveEnvVarsCommand,
    registerExportEnvVarsCommand,
    registerImportEnvVarsCommand,
};
