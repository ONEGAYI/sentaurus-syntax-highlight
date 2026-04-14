# svisual LSP/AST 接入设计

**日期**：2026-04-14
**状态**：待实现
**范围**：将 svisual 语言接入现有 Tcl AST 框架，获得完整的 LSP 功能

## 背景

svisual（Sentaurus Visual）已在项目中作为独立语言注册，具备语法高亮和命令文档，
但**未接入 Tcl AST 共享框架**，缺少代码折叠、面包屑导航、括号诊断等 AST 级功能。

现有框架为 4 种 Tcl 方言（sdevice、sprocess、emw、inspect）提供统一的 AST 服务，
采用"共享框架 + 配置驱动"模式。svisual 同样是 Tcl 方言，可以零改造复用。

## 方案

**方案 B：配置补全 + 自动提取脚本**

从 `svisual_command_docs.json` 自动提取 section 关键词，生成配置并写入 `tcl-symbol-configs.js`。

## 设计

### 1. TCL_LANGS 扩展

**文件**：`src/lsp/tcl-ast-utils.js`

将 `svisual` 添加到 `TCL_LANGS` 集合：

```javascript
const TCL_LANGS = new Set(['sdevice', 'sprocess', 'emw', 'inspect', 'svisual']);
```

**效果**：所有通过 `TCL_LANGS` 注册的 Provider 自动覆盖 svisual：
- DocumentSymbolProvider（面包屑导航）
- FoldingRangeProvider（代码折叠）
- 括号诊断（`{}` 平衡检查）
- 变量提取（`set`/`proc`/`foreach`/`while`/`for` 等）

### 2. Section 关键词自动提取脚本

**新文件**：`scripts/extract_svisual_sections.js`

**输入**：`syntaxes/svisual_command_docs.json`（257 条文档）
**输出**：可直接粘贴到 `tcl-symbol-configs.js` 的 `new Set([...])` 代码片段

**提取逻辑**：
1. 读取 svisual 命令文档 JSON
2. 遍历所有条目，筛选**有 `section` 字段**的命令
3. 自动排除命名空间函数（`ext::`、`rfx::`、`const::`、`ifm::`、`emw::fit::`、`lib::`）
4. 按 section 分组排序，输出格式化代码

**选择策略**：将所有有 section 的 KEYWORD1 命令作为 section 关键词。
这与 inspect 的做法一致（inspect 的 section 列表也包含大部分 KEYWORD1）。
预期约 138 个命令。

### 3. Section 配置写入

运行脚本后，将输出添加到 `src/lsp/tcl-symbol-configs.js`：

```javascript
svisual: new Set([
    // File (12)
    'load_file', 'unload_file', 'reload_files', 'reload_datasets',
    'list_files', 'list_datasets', 'export_datasets', 'import_datasets',
    'rename_dataset', 'remove_datasets', 'swap_datasets', 'set_file_prop',
    // Plot (13)
    'create_plot', 'list_plots', 'select_plots', 'remove_plots',
    'move_plot', 'resize_plot', 'set_plot_prop', 'get_plot_prop',
    // ... 自动提取生成
]),
```

### 4. 不需要变更的部分

| 项目 | 原因 |
|------|------|
| Provider 文件 | 复用现有 `tcl-document-symbol-provider.js` 等 |
| extension.js 注册逻辑 | 循环已基于 `TCL_LANGS`，自动覆盖 |
| 语言配置 | svisual 已使用 `tcl.json` |
| TextMate 语法 | 已有 `svisual.tmLanguage.json` |
| 命令文档 | 已有 257 条 |

## 影响范围

| 文件 | 变更类型 |
|------|---------|
| `src/lsp/tcl-ast-utils.js` | 修改 1 行（TCL_LANGS） |
| `src/lsp/tcl-symbol-configs.js` | 添加 1 个配置块 |
| `scripts/extract_svisual_sections.js` | 新增（提取脚本） |

## 验证

1. 打开 `*_vis.cmd` 文件，验证面包屑导航显示 section 节点
2. 验证代码折叠功能正常（`braced_word` 块可折叠）
3. 验证括号诊断正确（不配对的 `{}` 被标记）
4. 验证 `set`/`proc` 变量出现在面包屑中
5. 回归测试：其他 4 种语言的 AST 功能不受影响
