# 用户配置

> 在 VSCode 设置中搜索 `sentaurus` 即可查看和修改所有配置项。

---

## Sentaurus TCAD 语法

### 代码片段前缀

SDE 代码片段（QuickPick 命令面板 → `Sentaurus: Insert Snippet`）生成的语句会自动包含一个可编辑的**前缀变量名**。以下配置项控制各类前缀的默认值：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `sentaurus.snippetPrefixes.RW` | 细化求值窗口（Refinement Window） | `RW.` |
| `sentaurus.snippetPrefixes.DC` | 恒定掺杂分布（Doping Constant） | `DC.` |
| `sentaurus.snippetPrefixes.CPP` | 恒定掺杂放置（Constant Profile Placement） | `CPP.` |
| `sentaurus.snippetPrefixes.CPM` | 恒定掺杂按材料/区域放置（Constant Profile Material） | `CPM.` |
| `sentaurus.snippetPrefixes.GAUSS` | 高斯分析掺杂分布（Gaussian Profile） | `GAUSS.` |
| `sentaurus.snippetPrefixes.IMP` | 分析掺杂放置（Analytical Profile Placement） | `IMP.` |
| `sentaurus.snippetPrefixes.SM` | 子网格定义（Submesh） | `SM.` |
| `sentaurus.snippetPrefixes.PSM` | 子网格放置（Submesh Placement） | `PSM.` |
| `sentaurus.snippetPrefixes.RS` | 网格细化尺寸（Refinement Size） | `RS.` |
| `sentaurus.snippetPrefixes.RP` | 网格细化放置（Refinement Placement） | `RP.` |

### 定义文本显示宽度

| 配置项 | 说明 | 默认值 | 范围 |
|--------|------|--------|------|
| `sentaurus.definitionMaxWidth` | 用户定义变量/函数提示框中每行最大显示字符数。设为 0 时不截断 | `60` | 0–200 |

---

## Sentaurus 环境变量

| 配置项 | 说明 | 作用域 |
|--------|------|--------|
| `sentaurus.environmentVariables` | SWB 预注入的环境变量白名单。键为变量名，值为 Hover 文档（留空则仅显示变量名）。修改后自动生效 | `resource`（可按工作区配置） |

白名单中的变量将获得以下功能：

- **Hover 提示**：鼠标悬停显示配置中填写的文档说明
- **自动补全**：输入 `$` 或 `@` 时出现在补全列表中，标记为 `🏠 环境变量`
- **诊断豁免**：不会触发"未定义变量"警告

扩展还提供了 4 个管理命令：

| 命令 | 说明 |
|------|------|
| `Sentaurus: 添加环境变量` | 批量添加环境变量到白名单 |
| `Sentaurus: 搜索并删除环境变量` | 从白名单中移除变量 |
| `Sentaurus: 导出环境变量` | 将当前白名单导出为 JSON 文件 |
| `Sentaurus: 导入环境变量` | 从 JSON 文件导入环境变量 |

---

## Sentaurus PAR 材料数据库

| 配置项 | 说明 | 作用域 |
|--------|------|--------|
| `sentaurus.materialDbPath` | 包含 `.par` 文件的 MaterialDB 目录的绝对路径。留空则使用内置占位数据 | `machine`（机器级配置） |

设置后，该目录下所有直接子级 `.par` 文件将被解析，其参数可在补全中使用（标记为 `materialdb` 来源）。

**优先级**：`materialdb` 来源的优先级低于 `current` / `include` / `workspace`，即同名符号会优先使用 workspace 中的定义。
