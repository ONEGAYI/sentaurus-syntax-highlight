# SPROCESS 复数与点号变体关键词 Hover 文档补全

> **Issue**: #87
> **日期**: 2026-06-05
> **状态**: 已批准

## 背景

Issue #87 初筛出 61 个 SPROCESS 关键词缺少精确 Hover 文档，但能通过复数/点号/后缀关系关联到已有命令文档。采用混合策略（方案 C）分两类处理，后缀关联类留待单独 Issue。

## 范围

### 本 Issue 范围

| 类别 | 数量 | 处理方式 |
|------|------|----------|
| **复数变体 Alias** | 7 个唯一 key（覆盖 Issue 中 8 个条目） | 文档 JSON 内联 alias 条目，HoverProvider 预处理 |
| **点号子命令/参数** | 51 个 | 补充真实文档（中英文双语） |

### 延后至新 Issue

| 类别 | 数量 | 原因 |
|------|------|------|
| 后缀关联 | 2 个（`data`→`print.data`, `xy`→`point.xy`） | 需单独判断语义关系，独立跟踪 |

完成后关闭 #87。

## 数据结构设计

### 类别 1：Alias 条目（8 个）

写入 `sprocess_command_docs.json` / `sprocess_command_docs.zh-CN.json`：

```jsonc
"masks": {
  "aliasOf": "mask",
  "aliasType": "plural"
}
```

字段说明：
- `aliasOf`（string，必填）：指向同一 JSON 文件中存在的父命令 key
- `aliasType`（string，必填）：当前仅有 `"plural"` 值，未来可扩展

### 类别 2：点号变体文档（51 个）

标准文档格式（遵循 `docs/函数文档提取与编写规范.md` 7.3 节模板）：

```jsonc
"mask.edge.mns": {
  "section": "Mask",
  "signature": "mask edge.mns = <string_list>",
  "description": "Specifies the material names for the mask edge...",
  "parameters": [],
  "example": "mask edge.mns = {\"Resist\" \"Oxide\"}",
  "keywords": ["mask", "edge", "mns"]
}
```

Key 命名规则：
- Key 与 `all_keywords.json` 中的关键词完全一致（去除尾随 `=`）
- 点号保留原样（如 `mask.edge.mns`，不以 PascalCase 转换）

### 完整候选清单

#### 复数 Alias（5 个唯一 key）

HoverProvider 对非 SDE 语言使用 `identWord`（`/[\w]+/` 模式）作为查找键，会自动去除尾随 `=`。因此 alias 条目的 key 必须是去除 `=` 后的裸词。

> 注：Issue 原始列表中 `masks`（KEYWORD3）和 `masks=`（KEYWORD2）在文档 JSON 中共用一个 key `masks`，覆盖两种使用场景。

| 文档 JSON key | 覆盖的 all_keywords 条目 | aliasOf |
|---------------|------------------------|---------|
| `ambients` | KEYWORD2 `ambients=` | `ambient` |
| `contacts` | KEYWORD3 `contacts` | `contact` |
| `interfaces` | KEYWORD3 `interfaces` | `interface` |
| `masks` | KEYWORD3 `masks` + KEYWORD2 `masks=` | `mask` |
| `points` | KEYWORD2 `points=` | `point` |
| `polygons` | KEYWORD2 `polygons=` | `polygon` |
| `regions` | KEYWORD2 `regions=` | `region` |

#### 点号变体（51 个）

| Kind | 关键词 | 父命令 |
|------|--------|--------|
| KEYWORD2 | `ambient.name=` | `ambient` |
| KEYWORD2 | `ambient.products=` | `ambient` |
| KEYWORD2 | `ambient.rate=` | `ambient` |
| KEYWORD3 | `beam.dose` | `beam` |
| KEYWORD2 | `boundary.conditions=` | `boundary` |
| KEYWORD3 | `create.all.masks` | `icwb.create.all.masks` |
| KEYWORD3 | `deposit.intrinsic` | `deposit` |
| KEYWORD2 | `deposit.type=` | `deposit` |
| KEYWORD3 | `element.to.gauss` | `element` |
| KEYWORD2 | `etch.rate.modifier=` | `etch` |
| KEYWORD3 | `extract.moments` | `extract` |
| KEYWORD2 | `extract.variable.name=` | `extract` |
| KEYWORD2 | `extract.variable.names=` | `extract` |
| KEYWORD2 | `interface.mat.pairs=` | `interface` |
| KEYWORD2 | `interface.materials=` | `interface` |
| KEYWORD2 | `interface.region.pairs=` | `interface` |
| KEYWORD2 | `interface.regions=` | `interface` |
| KEYWORD3 | `kmc.reset.snapshot` | `kmc` |
| KEYWORD3 | `kmc.stress` | `kmc` |
| KEYWORD3 | `load.commands` | `load` |
| KEYWORD3 | `load.mc` | `load` |
| KEYWORD2 | `mask.corner.mns=` | `mask` |
| KEYWORD2 | `mask.corner.ngr=` | `mask` |
| KEYWORD2 | `mask.corner.refine.extent=` | `mask` |
| KEYWORD2 | `mask.discretization.size=` | `mask` |
| KEYWORD2 | `mask.edge.mns=` | `mask` |
| KEYWORD2 | `mask.edge.ngr=` | `mask` |
| KEYWORD2 | `mask.edge.refine.extent=` | `mask` |
| KEYWORD3 | `mgoals.native` | `mgoals` |
| KEYWORD3 | `optimize.dislocation` | `optimize` |
| KEYWORD2 | `point.coord=` | `point` |
| KEYWORD3 | `point.implant` | `point` |
| KEYWORD3 | `point.response` | `point` |
| KEYWORD3 | `polygon.bounding.boxes` | `polygon` |
| KEYWORD3 | `polygon.inside.points` | `polygon` |
| KEYWORD2 | `polygon.name=` | `polygon` |
| KEYWORD3 | `polygon.names` | `polygon` |
| KEYWORD3 | `polygon.tessellations` | `polygon` |
| KEYWORD2 | `polyhedron.material=` | `polyhedron` |
| KEYWORD3 | `profile.reshaping` | `profile` |
| KEYWORD2 | `region.list=` | `region` |
| KEYWORD2 | `region.name=` | `region` |
| KEYWORD3 | `region.names` | `region` |
| KEYWORD3 | `slice.angle.offset` | `slice` |
| KEYWORD2 | `slice.angle=` | `slice` |
| KEYWORD3 | `smooth.brep` | `smooth` |
| KEYWORD2 | `smooth.distance=` | `smooth` |
| KEYWORD2 | `smooth.field=` | `smooth` |
| KEYWORD2 | `smooth.points=` | `smooth` |
| KEYWORD3 | `stress.relax` | `stress` |
| KEYWORD2 | `stress.values=` | `stress` |

## 代码变更范围

| 文件 | 变更内容 |
|------|----------|
| `syntaxes/sprocess_command_docs.json` | 新增 7 个 alias 条目 + 51 个点号变体文档 |
| `syntaxes/sprocess_command_docs.zh-CN.json` | 同上，中文版本 |
| `src/register-completion-providers.js` | HoverProvider 中新增 alias 预处理逻辑（~10 行） |

`src/docs-loader.js` 的 `formatDoc` 函数**不需要修改**。

### HoverProvider alias 预处理逻辑

在现有 `const doc = docs[effectiveWord]` 查找之后，`if (doc) return ...` 之前插入：

```javascript
let doc = (canonKey && docs[canonKey]) || docs[effectiveWord] || docs[decodeHtml(effectiveWord)];
if (doc) {
    // Alias 解析：将 alias 条目展开为带标注的父文档
    if (doc.aliasOf) {
        const parentDoc = docs[doc.aliasOf];
        if (parentDoc) {
            const aliasLabel = doc.aliasType === 'plural'
                ? (useZh ? `（${doc.aliasOf} 的复数形式）` : `(plural of ${doc.aliasOf})`)
                : (useZh ? `（参见 ${doc.aliasOf}）` : `(see ${doc.aliasOf})`);
            doc = { ...parentDoc, _aliasLabel: aliasLabel };
        } else {
            // 安全降级：父文档不存在时显示简短提示
            const missingLabel = useZh ? '（文档暂缺）' : ' (doc missing)';
            return new vscode.Hover(
                new vscode.MarkdownString(`**${effectiveWord}** → *${doc.aliasOf}*${missingLabel}`),
                docHoverRange
            );
        }
    }
    const md = formatDoc(doc, langId);
    if (doc._aliasLabel) {
        md.value = `*${doc._aliasLabel}*\n\n` + md.value;
    }
    return new vscode.Hover(md, docHoverRange);
}
```

关键设计决策：
- **调用侧预处理**：alias 解析在 HoverProvider 中完成，`formatDoc` 保持纯函数
- **展开父文档**：使用 `{ ...parentDoc }` 创建标准文档对象，`formatDoc` 无需感知 alias
- **安全降级**：`aliasOf` 目标不存在时显示提示而非崩溃

## 文档编写工作流

严格遵循项目现有三个规范文件：

1. **`docs/函数文档提取与编写规范.md`** — JSON 结构、字段命名、质量检查清单
2. **`docs/glossary.json`** — 1300+ 条术语映射，翻译前补充缺失术语
3. **`docs/prompts/i18n/sprocess_command_docs.prompt.md`** — SPROCESS 专用翻译 prompt

### 步骤

1. **按父命令分组提取**（51 个点号变体）：从 `references/` 中的 SPROCESS 手册 Markdown 提取
2. **编写英文文档**：每条遵循 7.3 节模板（Tcl 命令扁平型），必备字段 `signature` + `description` + `parameters` + `example`
3. **质量检查**：按第 4 节清单逐条确认
4. **中文翻译**：使用 `sprocess_command_docs.prompt.md` prompt + `glossary.json` 术语表
5. **双语一致性验证**：英文和中文 JSON 的 key 数量完全一致
6. **Alias 条目同步写入**：7 个 alias 条目写入两个 JSON 文件

### 质量标准

每个点号变体文档至少包含：
- `signature`：语法签名（如 `mask edge.mns = <string_list>`）
- `description`：1-3 句功能描述
- `parameters`：可为空数组
- `example`：最小可用示例，优先从手册/`display_test/` 选取真实用例
- `section`：所属功能分类
- `keywords`：辅助搜索关键词（2-5 个）

## 测试策略

新增测试（在 `tests/` 中，纯 Node.js assert，零外部依赖）：

| 测试 | 验证内容 |
|------|----------|
| Alias 完整性 | 遍历 JSON 中所有 `aliasOf` 条目，断言目标父文档存在 |
| Alias 双语一致性 | 英文 JSON 中的 alias 条目在中文 JSON 中也存在且 `aliasOf` 目标一致 |
| 点号文档字段完整性 | 51 个点号变体条目均有 `signature` + `description` |
| Key 与 all_keywords 一致 | 新增的文档 key 与 `all_keywords.json` 中 sprocess 关键词匹配 |
| Hover 集成 | 模拟悬停 `masks`，验证 Markdown 包含 "plural of mask" 标注 + mask 完整文档 |

## 后续 Issue

关闭 #87 前需创建：
- 「补全 SPROCESS 后缀关联关键词 Hover 文档」（`data`→`print.data`, `xy`→`point.xy`）
