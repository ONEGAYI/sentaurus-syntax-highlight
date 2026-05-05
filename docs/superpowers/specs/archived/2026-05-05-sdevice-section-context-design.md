# Sdevice Section 上下文感知着色与悬停

## 背景

当前 sdevice 的 TextMate 语法使用平铺的关键词匹配（`keyword.control`、`keyword.other`、`entity.name.tag`），无法区分同一关键词在不同 section 上下文中的含义。HoverProvider 做的是 `docs[word]` 平铺查找，无法区分上下文。

**问题示例**：`File { Plot="nmos_des" }` 中的 `Plot` 与顶层 `Plot { ElectricField }` 着色相同、悬停文档相同，但两者语义完全不同——前者是 File section 的输出文件名参数，后者是独立的 Plot section。

**数据规模**：`sdevice_command_docs.json` 中 341 个文档条目，395 个关键词出现在 2 个以上 section 上下文中（如 `Plot` 出现在 File/Math/Plot/Solve/global 等 8 个上下文）。

## 方案

使用 Semantic Tokens Provider（JS 动态逻辑）根据 section 嵌套上下文精准着色，同时修改 HoverProvider 实现上下文感知文档查找。TextMate 语法保持不变作为兜底着色。

### 1. Section 上下文追踪

**核心算法**：扫描文档文本，维护一个 section 栈。

```
栈结构: [{ name: "File", braceDepth: 1 }, ...]
```

**追踪规则**：
1. 逐字符扫描，跳过 `#` 注释行和 `"..."` 字符串内的内容
2. 遇到 section keyword（如 `File`、`Plot`、`Solve`）后紧跟 `{` → push 到栈
3. 遇到 `{` → 递增当前深度（嵌套无名块）
4. 遇到 `}` → 弹栈/递减深度
5. 每个位置都能查到当前栈顶 section

**section keyword 列表**：从 `tcl-symbol-configs.js` 的 `SECTION_KEYWORDS.sdevice` 获取（19 个顶层 section 名）。

### 2. Semantic Tokens 着色

**Token 类型**：

| Token 类型 | 用途 | 颜色效果 |
|-----------|------|---------|
| `sectionName` | 顶层 section 名（如 `Plot {`） | 保持现有 `keyword.control` 颜色 |
| `sectionKeyword` | section 内匹配的参数/关键词 | 保持现有 `entity.name.tag` 颜色 |

**着色逻辑**：

```
对文档中每个标识符位置：
  1. 检查标识符是否在已知关键词中
  2. 如果是 → 检查当前栈顶 section
     a. 栈为空 且 标识符是 section 名 → sectionName
     b. 栈非空 且 标识符属于栈中任一层级 section 的参数/关键词 → sectionKeyword
     c. 栈非空 且 标识符不匹配栈中任何 section → 不输出 token（TextMate 兜底）
  3. 不是已知关键词 → 不输出 token
```

**关键词-所属 section 映射**：从 `sdevice_command_docs.json` 预构建 `keyword → Set<section>` 索引。当关键词出现在多个 section 中时，只在其所属 section 的上下文栈内着色。

### 3. 上下文感知悬停文档

修改 `extension.js` 的 HoverProvider，sdevice 增加上下文感知逻辑：

```
if langId === 'sdevice':
  sectionStack = getSectionStack(document, position.line)
  currentSection = 栈顶（优先）或栈中匹配的最近层级

  if 栈非空:
    从栈顶向下遍历，在每层 section 的 parameters[]/keywords[] 中查找 word
    1. 找到 → 返回该 section 上下文的文档
    2. 遍历完未找到 → fallback 到 docs[word]
  else:
    如果 word 是 section 名 → 返回 docs[word]
    否则 → fallback 到通用查找
```

**文档格式**：上下文文档标注所属 section：

```markdown
**Plot** (File 参数)
Plot = <string>
(d) Spatially distributed simulation results (output .tdr, @tdrdat@).
```

vs 通用查找：

```markdown
**Plot** (Plot Section)
Plot { <dataset_list> }
Specifies which datasets to include in the output TDR plot file.
```

### 4. 文件结构

**新增**：`src/lsp/providers/sdevice-semantic-provider.js`

**修改**：`src/extension.js`（注册 Semantic Tokens Provider + HoverProvider sdevice 分支）

**不变**：`syntaxes/sdevice.tmLanguage.json`（TextMate 保持兜底着色）

**模块结构**：

```js
// sdevice-semantic-provider.js
module.exports = {
  createSdeviceSemanticProvider,  // (docs, sectionKeywords) => provider
  getSectionStack,                // (text, targetLine) => stack[], 供 Hover 复用
};
```

内部函数：
- `buildKeywordSectionIndex(docs)` — 构建 keyword→Set<section> 索引
- `scanSectionStacks(text, sectionKeywordSet)` — 全文扫描，返回每行的栈快照
- `extractTokens(text, stackSnapshots, keywordIndex)` — 生成 delta 编码的 semantic tokens

### 5. 性能

- `scanSectionStacks` 结果可缓存（按 document version），与现有 `parse-cache.js` 机制一致
- Semantic Tokens 的 `resultId` 支持增量更新
- 扫描算法为 O(n) 线性复杂度，单遍扫描同时构建栈和提取 tokens

## 范围

- 仅 sdevice 语言
- 完整嵌套区分（Solve → Coupled → Transient 等多层嵌套）
- 着色机制：Semantic Tokens
- 悬停机制：上下文感知查找 + fallback
