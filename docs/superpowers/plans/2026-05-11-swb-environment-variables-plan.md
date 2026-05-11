# SWB 环境变量白名单实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SWB 环境变量白名单从硬编码迁移至可配置的 VSCode 设置，同时在 Hover/补全/粗体渲染中区分环境变量和用户变量。

**Architecture:** 配置驱动——`sentaurus.environmentVariables` (object map) 作为单一数据源，诊断/Semantic Token/Hover/补全 四个消费者均从同一配置实时读取。新增 2 个命令提供批量添加和搜索删除交互。引入独立 Semantic Token provider (`tcl-env-var-semantic.js`) 为环境变量提供粗体渲染。

**Tech Stack:** VSCode Extension API, tree-sitter-tcl WASM, CommonJS (无 TypeScript/构建步骤)

---

### Task 1: package.json — 新增配置组 + 命令

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 在 contributes.commands 数组中添加 2 个命令**

在 `"sentaurus.testTclWasm"` 命令条目的 `}` 之后插入：

```json
      {
        "command": "sentaurus.addEnvironmentVariables",
        "title": "%sentaurus.addEnvironmentVariables%"
      },
      {
        "command": "sentaurus.removeEnvironmentVariables",
        "title": "%sentaurus.removeEnvironmentVariables%"
      }
```

- [ ] **Step 2: 在 contributes.configuration 数组中添加新的配置组**

在第一个配置组（`Sentaurus TCAD Syntax`）的闭合 `}` 之后插入第二个配置组：

```jsonc
    {
      "title": "Sentaurus 环境变量",
      "properties": {
        "sentaurus.environmentVariables": {
          "type": "object",
          "default": {
            "DesName": "",
            "Pwd": "",
            "Pd": "",
            "ProjDir": "",
            "Tooldir": "",
            "env": "",
            "TOOLS_PRE": "",
            "TOOLS_POST": ""
          },
          "description": "SWB 预注入的环境变量白名单。键为变量名，值为 Hover 文档（留空则仅显示变量名）。修改后自动生效",
          "description.zh-CN": "SWB 预注入的环境变量白名单。键为变量名，值为 Hover 文档（留空则仅显示变量名）。修改后自动生效",
          "additionalProperties": { "type": "string" },
          "scope": "resource",
          "order": 1
        }
      }
    }
```

注意：VSCode 期望 `configuration` 是数组——上述作为第二个元素追加到现有配置组后。

- [ ] **Step 3: 验证 package.json 语法**

```bash
node -e "const p = require('./package.json'); console.log('OK: ' + Object.keys(p.contributes.configuration[1].properties).join(', '))"
```

期望输出：`OK: sentaurus.environmentVariables`

- [ ] **Step 4: 提交**

```bash
git add package.json
git commit -m "feat: 新增 sentaurus.environmentVariables 配置组和命令声明

配置组 'Sentaurus 环境变量' 作为 object map 类型设置，
默认包含 8 个现有的硬编码白名单变量。同时声明
addEnvironmentVariables 和 removeEnvironmentVariables 命令。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 2: package.json — Semantic Token 支持（scopes + fontStyle 默认值）

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 在 configurationDefaults 中添加粗体 fontStyle 规则**

在 `editor.tokenColorCustomizations` 的 `[*Dark*]` 的 `textMateRules` 数组中追加（在现有 `support.constant.unit` 规则后）：

```json
            {
              "scope": "entity.name.variable.environment.tcl",
              "settings": {
                "fontStyle": "bold"
              }
            }
```

在 `[*Light*]` 的 `textMateRules` 数组中同样追加。

- [ ] **Step 2: 在 semanticTokenScopes 中为 5 种 Tcl 语言添加 environmentVariable scope 映射**

在以下 5 个语言的 `scopes` 对象中各添加一行：

**sdevice** (`"language": "sdevice"` 的 scopes 对象)：
```json
          "environmentVariable": [
            "entity.name.variable.environment.tcl"
          ],
```

**sprocess** (`"language": "sprocess"` 的 scopes 对象)：
```json
          "environmentVariable": [
            "entity.name.variable.environment.tcl"
          ],
```

**emw** (`"language": "emw"` 的 scopes 对象)：
```json
          "environmentVariable": [
            "entity.name.variable.environment.tcl"
          ],
```

**inspect** (`"language": "inspect"` 的 scopes 对象)：
```json
          "environmentVariable": [
            "entity.name.variable.environment.tcl"
          ],
```

**svisual** (`"language": "svisual"` 的 scopes 对象)：
```json
          "environmentVariable": [
            "entity.name.variable.environment.tcl"
          ],
```

- [ ] **Step 3: 验证 package.json 语法**

```bash
node -e "const p = require('./package.json'); console.log('scopes:', Object.keys(p.contributes.semanticTokenScopes[0].scopes).join(', '))"
```

期望输出中包含 `environmentVariable`。

- [ ] **Step 4: 提交**

```bash
git add package.json
git commit -m "feat: 为环境变量添加 semanticTokenScopes 和粗体 fontStyle 默认值

所有 5 种 Tcl 语言均映射 environmentVariable token type
到 entity.name.variable.environment.tcl scope，并通过
configurationDefaults 设置粗体 fontStyle。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 3: NLS 文件 — 添加命令标题

**Files:**
- Modify: `package.nls.json`
- Modify: `package.nls.zh-cn.json`

- [ ] **Step 1: 更新 package.nls.json（英文）**

在闭合 `}` 之前添加：

```json
  "sentaurus.addEnvironmentVariables": "Sentaurus: Add Environment Variables",
  "sentaurus.removeEnvironmentVariables": "Sentaurus: Search and Remove Environment Variables"
```

- [ ] **Step 2: 更新 package.nls.zh-cn.json（中文）**

在闭合 `}` 之前添加：

```json
  "sentaurus.addEnvironmentVariables": "Sentaurus: 添加环境变量",
  "sentaurus.removeEnvironmentVariables": "Sentaurus: 搜索并删除环境变量"
```

- [ ] **Step 3: 验证 JSON 语法**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.nls.json','utf8')); console.log('nls.json OK')"
node -e "JSON.parse(require('fs').readFileSync('package.nls.zh-cn.json','utf8')); console.log('nls.zh-cn.json OK')"
```

- [ ] **Step 4: 提交**

```bash
git add package.nls.json package.nls.zh-cn.json
git commit -m "feat: 为环境变量管理命令添加中英文标题

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 4: undef-var-diagnostic.js — 配置驱动白名单

**Files:**
- Modify: `src/lsp/providers/undef-var-diagnostic.js`

- [ ] **Step 1: 删除硬编码 TCL_BUILTIN_VARS 常量**

删除第 17-20 行：
```javascript
/** Sentaurus 工具链隐式注入的变量白名单 */
const TCL_BUILTIN_VARS = new Set([
    'DesName', 'Pwd', 'Pd', 'ProjDir', 'Tooldir', 'env',
    'TOOLS_PRE', 'TOOLS_POST',
]);
```

- [ ] **Step 2: 添加 getEnvVarSet 辅助函数**

在 `SCHEME_BUILTIN_VARS` 定义之后添加：

```javascript
/** 从配置读取环境变量白名单 */
function getEnvVarSet() {
    const config = vscode.workspace.getConfiguration('sentaurus');
    const envVars = config.get('environmentVariables', {});
    return new Set(Object.keys(envVars));
}
```

- [ ] **Step 3: 修改 checkTclUndefVars 使用 getEnvVarSet**

将第 92 行：
```javascript
if (TCL_BUILTIN_VARS.has(ref.name)) continue;
```
替换为：
```javascript
const envVarSet = getEnvVarSet();
if (envVarSet.has(ref.name)) continue;
```

注意：`getEnvVarSet()` 需要在 `for` 循环之前调用一次（避免每次迭代都读取配置），因此将其放在 `const diagnostics = [];` 之后、`for` 循环之前。

- [ ] **Step 4: 在 activate 中添加 onDidChangeConfiguration 监听**

在 `activate` 函数内部、`provider.initialScan()` 之后添加：

```javascript
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('sentaurus.environmentVariables')) {
                refreshAll();
            }
        })
    );
```

- [ ] **Step 5: 更新 module.exports**

将最后一行：
```javascript
module.exports = { activate, refreshAll, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, TCL_BUILTIN_VARS, SCHEME_BUILTIN_VARS };
```
替换为：
```javascript
module.exports = { activate, refreshAll, checkTclUndefVars, checkSchemeUndefVars, checkSchemeDuplicateDefs, SCHEME_BUILTIN_VARS };
```

- [ ] **Step 6: 确认没有其他模块引用 TCL_BUILTIN_VARS**

```bash
grep -r "TCL_BUILTIN_VARS" src/ tests/
```

期望输出：仅在 `undef-var-diagnostic.js` 的 `module.exports` 中出现，且已被移除。若无其他引用则继续。

- [ ] **Step 7: 提交**

```bash
git add src/lsp/providers/undef-var-diagnostic.js
git commit -m "refactor: 将 Tcl 环境变量白名单从硬编码迁移为配置驱动

从 sentaurus.environmentVariables 设置项读取变量名集合，
替代硬编码的 TCL_BUILTIN_VARS。监听 onDidChangeConfiguration
事件，配置变更时自动重新扫描所有文档。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 5: register-completion-providers.js — Hover + 补全

**Files:**
- Modify: `src/register-completion-providers.js`

- [ ] **Step 1: 在 Hover Provider 的 Tcl 分支中添加环境变量回退**

定位到第 391 行（`if (def) hoverRange = dollarRange;`）。将其替换为：

```javascript
                            if (def) {
                                hoverRange = dollarRange;
                            } else {
                                // 检查是否为 SWB 环境变量
                                const envVars = vscode.workspace.getConfiguration('sentaurus').get('environmentVariables', {});
                                if (Object.prototype.hasOwnProperty.call(envVars, dollarWord)) {
                                    const md = new vscode.MarkdownString();
                                    md.appendMarkdown(`**${dollarWord}** (🏠 环境变量)`);
                                    const docStr = envVars[dollarWord];
                                    if (docStr && docStr.trim()) {
                                        md.appendMarkdown('\n\n' + docStr);
                                    }
                                    return new vscode.Hover(md, dollarRange);
                                }
                            }
```

- [ ] **Step 2: 在 Completion Provider 中添加环境变量补全项**

定位到第 221 行（`return [...items, ...userItems];` 之前）。在 `const userItems = filteredDefs.map(...)` 之后、`return` 之前添加：

```javascript
                        // 环境变量补全
                        const envVars = vscode.workspace.getConfiguration('sentaurus').get('environmentVariables', {});
                        const envVarItems = Object.keys(envVars)
                            .filter(name => !seenNames.has(name))
                            .map(name => {
                                const item = new vscode.CompletionItem('$' + name, vscode.CompletionItemKind.Variable);
                                item.detail = '🏠 环境变量';
                                item.sortText = '4' + name;
                                item.filterText = name;
                                const docStr = envVars[name];
                                if (docStr && docStr.trim()) {
                                    item.documentation = new vscode.MarkdownString(docStr);
                                }
                                return item;
                            });

                        return [...items, ...envVarItems, ...userItems];
```

- [ ] **Step 3: 提交**

```bash
git add src/register-completion-providers.js
git commit -m "feat: Hover 和补全中区分环境变量——标记为 🏠 环境变量

Hover：找不到用户定义时检查 sentaurus.environmentVariables，
   显示标题 + 配置中的文档字符串
补全：列出所有环境变量，detail 标注 🏠 环境变量

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 6: 创建 tcl-env-var-semantic.js — Semantic Token Provider

**Files:**
- Create: `src/lsp/providers/tcl-env-var-semantic.js`

- [ ] **Step 1: 创建文件**

```javascript
// src/lsp/providers/tcl-env-var-semantic.js
'use strict';

const vscode = require('vscode');
const ppUtils = require('../pp-utils');
const { getVariableRefs } = require('../tcl-variable-extractor');

const TOKEN_TYPES = ['environmentVariable'];
const TOKEN_MODIFIERS = [];

/**
 * 创建环境变量 Semantic Tokens Provider。
 * 遍历文档中使用 tree-sitter AST 提取的所有变量引用，
 * 匹配 sentaurus.environmentVariables 配置中的环境变量名，
 * 生成 environmentVariable 类型的 semantic token。
 *
 * @param {object} tclCache - TclParseCache 实例
 * @returns {{ provideDocumentSemanticTokens: function }}
 */
function createEnvVarSemanticProvider(tclCache) {
    return {
        provideDocumentSemanticTokens(document) {
            const entry = tclCache.get(document);
            if (!entry) return { data: new Uint32Array(0) };

            const config = vscode.workspace.getConfiguration('sentaurus');
            const envVars = config.get('environmentVariables', {});
            const envVarSet = new Set(Object.keys(envVars));
            if (envVarSet.size === 0) return { data: new Uint32Array(0) };

            const refs = getVariableRefs(entry.tree.rootNode);
            const rawTokens = [];
            for (const ref of refs) {
                if (envVarSet.has(ref.name)) {
                    rawTokens.push([ref.line - 1, ref.startCol, ref.endCol - ref.startCol, 0, 0]);
                }
            }

            if (rawTokens.length === 0) {
                return { data: new Uint32Array(0) };
            }

            rawTokens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            return { data: ppUtils.encodeDelta5(rawTokens) };
        },
    };
}

module.exports = {
    createEnvVarSemanticProvider,
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
};
```

注意关键设计决策：
- 复用 `tclCache` 获取已解析的 AST（零额外解析开销）
- 复用 `getVariableRefs` 获取所有 `$var` 引用，不必重新遍历 AST
- 使用 `ppUtils.encodeDelta5` 编码（与 `tcl-funcall-semantic.js` 相同方式）
- Token 格式: `[line(0-based), col, len, typeIdx=0, modifierBits=0]`

- [ ] **Step 2: 提交**

```bash
git add src/lsp/providers/tcl-env-var-semantic.js
git commit -m "feat: 新增环境变量 Semantic Token provider——粗体渲染

复用 TclParseCache 的 AST + getVariableRefs，零额外解析开销。
匹配配置中的环境变量名，生成 environmentVariable token type，
映射到 entity.name.variable.environment.tcl scope。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 7: register-tcl-providers.js — 注册环境变量语义 Provider

**Files:**
- Modify: `src/register-tcl-providers.js`

- [ ] **Step 1: 添加 require 导入**

在文件顶部现有 require 行后添加：

```javascript
const envVarSemantic = require('./lsp/providers/tcl-env-var-semantic');
```

- [ ] **Step 2: 注册环境变量 Semantic Token Provider**

在所有现有 Semantic Tokens 注册代码之后（第 102 行 `}` 之前），添加：

```javascript
    // Semantic Tokens (5 种 Tcl 语言) — SWB 环境变量粗体渲染
    const envVarLegend = new vscode.SemanticTokensLegend(
        envVarSemantic.TOKEN_TYPES,
        envVarSemantic.TOKEN_MODIFIERS
    );
    const envVarStProvider = envVarSemantic.createEnvVarSemanticProvider(tclCache);
    for (const langId of astUtils.TCL_LANGS) {
        context.subscriptions.push(
            vscode.languages.registerDocumentSemanticTokensProvider(
                { language: langId },
                envVarStProvider,
                envVarLegend
            )
        );
    }
```

- [ ] **Step 3: 提交**

```bash
git add src/register-tcl-providers.js
git commit -m "feat: 为 5 种 Tcl 语言注册环境变量 Semantic Token provider

注册到 sdevice/sprocess/emw/inspect/svisual 全部 5 种语言，
复用 tclCache 实例零额外解析开销。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 8: 创建 env-var-manager.js — 批量添加 + 搜索删除命令

**Files:**
- Create: `src/commands/env-var-manager.js`

- [ ] **Step 1: 创建文件**

```javascript
// src/commands/env-var-manager.js
'use strict';

const vscode = require('vscode');

const CONFIG_KEY = 'environmentVariables';

/**
 * 注册"添加环境变量"命令。
 * 弹出输入框接收空格/换行分隔的变量名列表，去重后批量写入配置。
 */
function registerAddEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.addEnvironmentVariables', async () => {
        const config = vscode.workspace.getConfiguration('sentaurus');
        const current = config.get(CONFIG_KEY, {});

        const input = await vscode.window.showInputBox({
            prompt: '输入要添加的环境变量名，以空格或换行分隔',
            placeHolder: '例如: VarA VarB VarC 或每行一个变量名',
        });

        if (!input || !input.trim()) return;

        const names = input.split(/\s+/).filter(Boolean);
        const existing = new Set(Object.keys(current));
        const toAdd = names.filter(n => !existing.has(n));

        if (toAdd.length === 0) {
            await vscode.window.showInformationMessage('Sentaurus: 输入的变量均已在白名单中');
            return;
        }

        const newEnvVars = { ...current };
        for (const name of toAdd) {
            newEnvVars[name] = '';
        }

        await config.update(CONFIG_KEY, newEnvVars, vscode.ConfigurationTarget.Global);
        await vscode.window.showInformationMessage(
            `Sentaurus: 已添加 ${toAdd.length} 个环境变量：${toAdd.join(', ')}`
        );
    });
    context.subscriptions.push(disposable);
}

/**
 * 注册"搜索删除环境变量"命令。
 * QuickPick 多选界面，支持子字符串/正则匹配切换。
 */
function registerRemoveEnvVarsCommand(context) {
    const disposable = vscode.commands.registerCommand('sentaurus.removeEnvironmentVariables', async () => {
        const config = vscode.workspace.getConfiguration('sentaurus');
        const current = config.get(CONFIG_KEY, {});

        const allItems = Object.entries(current).map(([name, doc]) => ({
            label: name,
            description: doc || '',
        }));

        if (allItems.length === 0) {
            await vscode.window.showInformationMessage('Sentaurus: 当前没有已配置的环境变量');
            return;
        }

        const qp = vscode.window.createQuickPick();
        qp.canSelectMany = true;
        qp.title = '搜索并删除环境变量';
        qp.placeholder = '输入关键词搜索，勾选要删除的变量后确认';
        qp.matchOnDescription = true;

        let useRegex = false;
        const selectedSet = new Set();

        // 正则切换按钮
        qp.buttons = [{
            iconPath: new vscode.ThemeIcon('regex'),
            tooltip: '点击切换正则表达式匹配模式',
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
                } catch (e) {
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
            await vscode.window.showInformationMessage(
                `Sentaurus: 已删除 ${selected.length} 个环境变量：${selected.join(', ')}`
            );
        });

        qp.onDidHide(() => qp.dispose());
        qp.show();
    });
    context.subscriptions.push(disposable);
}

module.exports = { registerAddEnvVarsCommand, registerRemoveEnvVarsCommand };
```

- [ ] **Step 2: 提交**

```bash
git add src/commands/env-var-manager.js
git commit -m "feat: 新增环境变量批量添加和搜索删除命令

添加命令：弹出输入框，空格/换行分隔变量名，自动去重写入配置
删除命令：QuickPick 多选，支持子字符串/正则匹配切换按钮

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 9: extension.js — 注册命令

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 添加 require 导入**

在文件顶部现有 require 行后添加：

```javascript
const envVarManager = require('./commands/env-var-manager');
```

- [ ] **Step 2: 在 activate 函数中注册命令**

在 `registerSnippetCommand(context);` 调用之后添加：

```javascript
    // ── 环境变量管理命令 ──────────────────────────
    envVarManager.registerAddEnvVarsCommand(context);
    envVarManager.registerRemoveEnvVarsCommand(context);
```

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat: 在 activate 中注册环境变量管理命令

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
"
```

---

### Task 10: 运行测试验证

**Files:**
- No files created or modified（验证步骤）

- [ ] **Step 1: 运行全量测试**

```bash
node tests/run_all.js
```

期望输出：全部测试通过（或仅现有已知的非相关测试失败）。

- [ ] **Step 2: 验证 undef-var-diagnostic.js 导出正确**

```bash
node -e "const m = require('./src/lsp/providers/undef-var-diagnostic.js'); console.log('exports:', Object.keys(m).join(', ')); console.log('TCL_BUILTIN_VARS:', m.TCL_BUILTIN_VARS); console.log('SCHEME_BUILTIN_VARS:', m.SCHEME_BUILTIN_VARS ? 'exists' : 'missing')"
```

期望输出：`exports` 中**不包含** `TCL_BUILTIN_VARS`，`SCHEME_BUILTIN_VARS` 仍存在。

- [ ] **Step 3: 验证新模块可加载**

```bash
node -e "const sv = require('./src/lsp/providers/tcl-env-var-semantic.js'); console.log('token types:', sv.TOKEN_TYPES); console.log('provider factory:', typeof sv.createEnvVarSemanticProvider)"
node -e "const evm = require('./src/commands/env-var-manager.js'); console.log('add:', typeof evm.registerAddEnvVarsCommand); console.log('remove:', typeof evm.registerRemoveEnvVarsCommand)"
```

两步均期望输出正确的类型和方法存在性。

- [ ] **Step 4: 测试 extension.js 激活（仅验证无启动错误）**

在 VSCode Extension Development Host 中按 F5 启动，检查：
1. Output 面板无错误
2. 命令面板中出现 `Sentaurus: 添加环境变量` 和 `Sentaurus: 搜索并删除环境变量` 两个命令
3. 设置 UI 中出现 `Sentaurus 环境变量` 配置组

---

### 改动总结

| 文件 | 操作 | 变更量 |
|------|------|--------|
| `package.json` | 修改 | +~80 行（配置组 + 命令 + scopes + fontStyle） |
| `package.nls.json` | 修改 | +2 行 |
| `package.nls.zh-cn.json` | 修改 | +2 行 |
| `src/lsp/providers/undef-var-diagnostic.js` | 修改 | +~15 / -5 行 |
| `src/register-completion-providers.js` | 修改 | +~30 行 |
| `src/lsp/providers/tcl-env-var-semantic.js` | 新建 | ~60 行 |
| `src/register-tcl-providers.js` | 修改 | +~16 行 |
| `src/commands/env-var-manager.js` | 新建 | ~130 行 |
| `src/extension.js` | 修改 | +3 行 |
