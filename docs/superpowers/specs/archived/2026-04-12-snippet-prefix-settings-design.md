# SDE Snippet 官方前缀自定义设置

**日期**: 2026-04-12
**状态**: 已批准

## 背景

SDE snippets (`src/snippets/sde.js`) 中的代码模板使用了 Sentaurus 官方推荐的对象命名前缀约定，例如 `"RW."` (Refinement Window)、`"DC."` (Doping Constant) 等。这些前缀帮助用户在代码中快速识别对象类型。但不同团队或项目可能有自己不同的命名约定，因此需要提供自定义能力。

## 涉及的 10 个前缀

| 键名 | 默认值 | 含义 | 出现的 Snippet |
|------|--------|------|---------------|
| `RW` | `"RW."` | Refinement Window | Const-box, Gauss, Submesh, Ref-box |
| `DC` | `"DC."` | Doping Constant | Const-box, Const-material, Const-region |
| `CPP` | `"CPP."` | Constant Profile Placement | Const-box |
| `CPM` | `"CPM."` | Constant Profile Material/Region | Const-material, Const-region |
| `GAUSS` | `"GAUSS."` | Gaussian Profile | Gauss |
| `IMP` | `"IMP."` | Analytical Profile Placement | Gauss |
| `SM` | `"SM."` | Submesh | Submesh |
| `PSM` | `"PSM."` | Placement Submesh | Submesh |
| `RS` | `"RS."` | Refinement Size | Ref-box, Ref-material, Ref-region |
| `RP` | `"RP."` | Refinement Placement | Ref-box, Ref-material, Ref-region |

## 设计方案：运行时字符串替换

### 核心思路

保持 `sde.js` 模板不变（硬编码官方前缀作为默认值），在 `extension.js` 的 snippet 插入流程中，读取 VSCode 配置并替换前缀字符串。

### 1. 配置定义 (`package.json`)

在 `contributes.configuration` 中新增 `sentaurus.snippetPrefixes` 配置项，类型为 `object`，包含上述 10 个属性。每个属性的类型为 `string`，默认值为官方前缀。

#### i18n 要求

VSCode 配置项的 `description` 和 `description.zh-CN` 需要双语支持（英文为默认，中文为 `zh-CN`）。

#### 每个属性的 description 格式

**`description`（英文，默认）**：简短英文含义，格式为 `Prefix for {English meaning}.`。

**`description.zh-CN`（中文）**：简短中文含义，格式为 `{中文含义}的前缀。`。

**`markdownDescription`（英文悬停）**：包含基础含义 + 影响范围（模板层级路径 + 受影响的函数列表），格式：

```markdown
Prefix for **{English meaning}**.
Affects: `Category > Snippet` → `func-name`, ...
```

**`markdownDescription.zh-CN`（中文悬停）**：

```markdown
**{中文含义}**的前缀。
影响范围：`分类 > 模板` → `函数名`, ...
```

#### 10 个前缀的具体 description 内容

| 键名 | EN description | zh-CN description | 影响的模板层级和函数 |
|------|---------------|-------------------|---------------------|
| `RW` | Prefix for Refinement Evaluation Window. | 细化求值窗口的前缀。 | `Doping > Const-box` → `sdedr:define-refeval-window`; `Doping > Gauss` → `sdedr:define-refeval-window`; `Doping > Submesh` → `sdedr:define-refeval-window`; `Meshing > Ref-box` → `sdedr:define-refeval-window` |
| `DC` | Prefix for Doping Constant profile. | 恒定掺杂分布的前缀。 | `Doping > Const-box` → `sdedr:define-constant-profile`; `Doping > Const-material` → `sdedr:define-constant-profile`; `Doping > Const-region` → `sdedr:define-constant-profile` |
| `CPP` | Prefix for Constant Profile Placement. | 恒定掺杂放置的前缀。 | `Doping > Const-box` → `sdedr:define-constant-profile-placement` |
| `CPM` | Prefix for Constant Profile Material/Region placement. | 恒定掺杂按材料/区域放置的前缀。 | `Doping > Const-material` → `sdedr:define-constant-profile-material`; `Doping > Const-region` → `sdedr:define-constant-profile-region` |
| `GAUSS` | Prefix for Gaussian analytic profile. | 高斯分析掺杂分布的前缀。 | `Doping > Gauss` → `sdedr:define-gaussian-profile` |
| `IMP` | Prefix for Analytical (Implant) profile placement. | 分析（注入）掺杂放置的前缀。 | `Doping > Gauss` → `sdedr:define-analytical-profile-placement` |
| `SM` | Prefix for Submesh definition. | 子网格定义的前缀。 | `Doping > Submesh` → `sdedr:define-submesh` |
| `PSM` | Prefix for Submesh Placement. | 子网格放置的前缀。 | `Doping > Submesh` → `sdedr:define-submesh-placement` |
| `RS` | Prefix for Refinement Size specification. | 网格细化尺寸的前缀。 | `Meshing > Ref-box` → `sdedr:define-refinement-size`; `Meshing > Ref-material` → `sdedr:define-refinement-size`; `Meshing > Ref-region` → `sdedr:define-refinement-size` |
| `RP` | Prefix for Refinement Placement. | 网格细化放置的前缀。 | `Meshing > Ref-box` → `sdedr:define-refinement-placement`; `Meshing > Ref-material` → `sdedr:define-refinement-material`; `Meshing > Ref-region` → `sdedr:define-refinement-region` |

### 2. 替换逻辑 (`src/extension.js`)

新增 `applySnippetPrefixes(snippetText: string): string` 函数：

1. 读取 `sentaurus.snippetPrefixes` 配置
2. 遍历 10 个前缀键
3. 如果用户自定义了某个前缀且与默认值不同，使用 `String.replaceAll()` 将模板中所有 `"默认前缀"` 替换为 `"自定义前缀"`
4. 返回替换后的文本

调用时机：在 `showToolSnippets` 中构建 `SnippetString` 之前，对 `sub.data.lines.join('\n')` 的结果调用此函数。

### 3. 空值处理

如果用户将某个前缀设置为空字符串，替换后前缀被移除。例如 `RW` 设为 `""` 后，`(string-append "RW." NAME)` 变为 `(string-append "" NAME)`。

### 影响范围

- **修改**: `package.json`（添加 `contributes.configuration`）、`src/extension.js`（添加替换函数和调用点）
- **不修改**: `src/snippets/sde.js` 及其他 snippet 文件
- **不影响**: 其他语言 snippets（sdevice/sprocess/inspect/mesh 无前缀模式）
