# SWB 环境变量白名单功能设计

## 背景

Sentaurus Workbench (SWB) 会在执行 Tcl 工具节点前预注入一批环境变量（如 `DesName`、`ProjDir` 等），这些变量无需在脚本中声明即可使用。当前插件的未定义变量诊断会将这些环境变量误报为"未定义的变量"。

现有硬编码白名单 `TCL_BUILTIN_VARS`（8 个变量）存在以下问题：
- 用户无法增减变量（需改代码重新发布）
- 不同 SWB 版本的变量列表可能不同
- 无法为每个变量附带文档

## 需求

1. 通过插件设置维护环境变量白名单，可增减可重置
2. 设置数据结构预留文档字符串空间（key=变量名, value=文档）
3. Hover 中区分环境变量和用户变量
4. 编辑器中环境变量以粗体渲染（Semantic Tokens）
5. 仅覆盖 5 种 Tcl 方言（sdevice/sprocess/emw/inspect/svisual）
6. 批量添加命令：输入空格或换行分隔的关键词列表，自动去重
7. 搜索删除命令：QuickPick 多选，支持子字符串/正则匹配切换

## 设计

### 1. 配置项

**文件**：`package.json`

新增独立配置组 `Sentaurus 环境变量`，包含一个对象类型设置：

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

设计要点：
- `object` + `additionalProperties: string` 在 VSCode 设置 UI 中渲染为可编辑的 key-value 表格
- 值（string）预留给 Hover 文档内容，当前默认为空字符串
- `scope: "resource"` 允许工作区级别覆盖（不同项目可能使用不同 SWB 版本）

### 2. 未定义变量诊断改造

**文件**：`src/lsp/providers/undef-var-diagnostic.js`

改动：
- 删除硬编码 `TCL_BUILTIN_VARS` 常量
- 新增 `getEnvVarSet()` 辅助函数，运行时从 `sentaurus.environmentVariables` 配置读取变量名集合
- `checkTclUndefVars` 中使用 `getEnvVarSet()` 替代 `TCL_BUILTIN_VARS`
- 监听 `onDidChangeConfiguration` 事件（过滤 `sentaurus.environmentVariables`），触发全文档重新诊断
- `module.exports` 中移除 `TCL_BUILTIN_VARS` 导出
- `SCHEME_BUILTIN_VARS` 保留不动（SDE 不涉及此功能）

```javascript
/** 从配置读取环境变量白名单 */
function getEnvVarSet() {
    const config = vscode.workspace.getConfiguration('sentaurus');
    const envVars = config.get('environmentVariables', {});
    return new Set(Object.keys(envVars));
}
```

### 3. Hover 区分展示

**文件**：`src/register-completion-providers.js`

当前用户变量 Hover 格式：
```
**varName** (用户变量, 第 9 行)
set varName "value"
```

环境变量 Hover 格式（新增逻辑）：
```
**VarName** (🏠 环境变量)
配置中的文档字符串（如有，非空时显示）
```

实现逻辑（在 Hover Provider 中，`def` 查找失败后）：
1. 检测到 `$VarName` 引用但未找到用户定义
2. 从配置读取环境变量 map，检查变量名是否在其中
3. 如果是环境变量，构建 Markdown Hover：
   - 标题行：`**VarName** (🏠 环境变量)`
   - 文档行（如有）：配置中该变量的非空值
4. 用户同名变量优先：如果用户在脚本中定义了同名变量，显示用户定义的 Hover

同时，补全 Provider 中也为环境变量提供补全项，kind 为 `Variable`，detail 标注 `🏠 环境变量`。

### 4. Semantic Token 粗体效果

**新建文件**：`src/lsp/providers/tcl-env-var-semantic.js`

注册独立的 `DocumentSemanticTokensProvider`，为 5 种 Tcl 语言提供环境变量的 semantic token：

- Legend：`tokenTypes: ['environmentVariable']`，`tokenModifiers: []`
- Provider 遍历文档中的变量引用（复用 `TclParseCache` 的 AST + `getVariableRefs`，零额外解析开销）
- 匹配配置中的环境变量名，生成对应的 semantic token（type index = 0）

**文件**：`package.json` → `configurationDefaults`

在现有 `editor.tokenColorCustomizations` 的 `[*Dark*]` / `[*Light*]` 主题规则中追加：

```jsonc
{
    "scope": "entity.name.variable.environment.tcl",
    "settings": { "fontStyle": "bold" }
}
```

注：实际渲染取决于用户主题是否为此 scope 配置了 fontStyle。未配置时退化为普通样式，不影响功能。

**文件**：`src/register-tcl-providers.js`

为 5 种 Tcl 语言注册该 provider，复用 `tclCache` 实例。

### 5. 配置变更响应

当用户修改 `sentaurus.environmentVariables` 时：
- **诊断**：触发全文档重新扫描，更新未定义变量诊断
- **Semantic Tokens**：VSCode 自动调用 provider 的 `provideDocumentSemanticTokens` 重新生成
- **Hover/补全**：每次调用时从配置实时读取，无需额外刷新机制

### 6. 批量添加命令

**命令**：`sentaurus.addEnvironmentVariables`

**触发方式**：命令面板（Ctrl+Shift+P → "Sentaurus: 添加环境变量"）

**流程**：
1. 弹出 `showInputBox`，提示用户以空格或换行分隔输入环境变量名列表
2. 输入解析：按空白字符（空格、换行、Tab）分割，过滤空字符串
3. 自动去重：与当前配置中的已有变量做差集
4. 如果是纯新增的变量，直接写入配置（值为空字符串）；如果全部重复，提示"输入的变量均已在白名单中"
5. 成功后显示汇总：`已添加 N 个环境变量：VarA, VarB, ...`

**实现**：`src/commands/env-var-manager.js`（函数模块）→ 在 `extension.js` 中注册命令，命令名加入 `package.nls.json` / `package.nls.zh-cn.json`

### 7. 搜索与删除命令

**命令**：`sentaurus.removeEnvironmentVariables`

**触发方式**：命令面板（Ctrl+Shift+P → "Sentaurus: 搜索并删除环境变量"）

**流程**：
1. 弹出 `QuickPick`，加载当前所有环境变量
2. QuickPick 支持：
   - **输入框**：实时子字符串模糊过滤（默认），类似 VSCode 搜索
   - **正则开关**：QuickPick 的 `buttons` 中提供 `.*` 样式的切换按钮，点击后切换为正则匹配模式
   - **多选**：用户勾选要删除的变量
3. 确认后从配置中删除所选变量
4. 成功后显示汇总：`已删除 N 个环境变量：VarA, VarB, ...`

**实现**：`src/commands/env-var-manager.js`（同一模块）→ 在 `extension.js` 中注册命令

**QuickPick 按钮交互细节**：
- 初始状态：按钮显示 `.*`（灰色/未激活），匹配模式为子字符串
- 点击后：按钮高亮，匹配模式切换为正则表达式
- 再点击：退出正则模式，恢复子字符串匹配
- 正则无效时：不报错，仅不匹配任何项

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 新增配置组 + configurationDefaults 粗体规则 + 命令注册 |
| `package.nls.json` | 修改 | 新增命令标题（英文） |
| `package.nls.zh-cn.json` | 修改 | 新增命令标题（中文） |
| `src/lsp/providers/undef-var-diagnostic.js` | 修改 | 配置驱动白名单 + 配置变更监听 |
| `src/register-completion-providers.js` | 修改 | Hover 区分 + 环境变量补全 |
| `src/lsp/providers/tcl-env-var-semantic.js` | 新建 | Semantic Token provider |
| `src/commands/env-var-manager.js` | 新建 | 批量添加 + 搜索删除命令实现 |
| `src/extension.js` | 修改 | 注册 2 个新命令 |
| `src/register-tcl-providers.js` | 修改 | 注册新 Semantic provider |

## 不在范围内

- Scheme (SDE) 语言的环境变量支持
- 环境变量的自动检测/从 SWB 同步
- 环境变量的定义跳转（环境变量没有脚本内的定义位置）
- 环境变量的引用查找（Find All References）
