# SDevice 函数文档全量审计与补全

## 背景

当前 `sdevice_command_docs.json` 包含 341 个文档条目，但存在两个问题：

1. **覆盖不足**：780 个在 `keywords[]` 中引用的子关键词没有独立文档条目（覆盖率 ~30%）
2. **多语义缺失**：同一关键词在不同父 section 下有不同语义（如 `Current` 在 Electrode 是边界条件，在 Plot 是输出数据），但现有结构（每个词一条记录，单一 `section` 字段）无法表达

### 数据概览

| 指标 | 数值 |
|------|------|
| 当前文档条目 | 341 |
| 引用的独立关键词总数 | 1030 |
| 有独立文档的关键词 | 250 |
| 无独立文档的关键词 | 780 |
| 多 section 引用的词数 | 407 |
| 既是 section 又是其他 section keyword/param 的词 | ~15 |

## 方案

三阶段流水线：**脚本扫描（机械定位）→ AI 分批验证+生成 → 合并产物**

### 阶段 1：脚本扫描

**脚本**：`scripts/audit-sdevice-keywords.js`

**输入**：
- `syntaxes/sdevice_command_docs.json` — 目标词 + 当前文档状态
- `syntaxes/all_keywords.json` — 补充目标词
- `references/sdevice_ug_T-2022.03.md` + `_1.md` + `_2.md` — 搜索源（共 ~3.4MB）

**处理**：
1. 从 `sdevice_command_docs.json` 提取所有 key + keywords + parameters[].name
2. 从 `all_keywords.json` 提取 sdevice 相关关键词
3. 合并去重得到 ~1100 唯一目标词
4. 对每个词在 3 个 md 文件中做忽略大小写的文本搜索
5. 对每次匹配：记录行号、前后 100 字符上下文、向上搜索最近的 `#` 标题

**不做的事**：不推断 appearsInSections、不标记 multiContext、不做任何语义判断

**产出**：`build/sdevice-keyword-audit.json`

```jsonc
{
  "Digits": {
    "currentDoc": { "exists": true, "section": "Math" },
    "occurrences": [
      {
        "file": "sdevice_ug_T-2022.03.md",
        "line": 142,
        "context": "...the parameter TransientDigits according to Equation 14...",
        "nearbyHeading": "Controlling Transient Simulations"
      }
    ]
  }
}
```

### 阶段 2：AI 分批验证+生成

**分批策略**：每批 ~30 词（按字母排序等分，避免同 section 的词集中在同一批导致上下文重复），并发 ≤3 个 sonnet 子代理

**每个子代理的工作**：

1. 读取该批词在审计 JSON 中的手册出现位置和上下文
2. 参照 `docs/函数文档提取与编写规范.md` §7.3 的产出模板
3. **判断**：该词实际属于哪些 section（基于手册上下文，非关键词列表）
4. **判断**：是否在不同 section 有不同语义
5. **检查**：已有条目的 keywords/parameters 是否完整
6. **产出**：文档片段 JSON（含 `_audit` 质量追踪字段）

**产出目录**：`build/doc-fragments/batch-001.json`, `batch-002.json`, ...

**信息来源优先级**：官方手册正文 > 手册附录命令参考 > AI 推断（需注明）

### 阶段 3：合并

**脚本**：`scripts/merge-sdevice-docs.js`

1. 读取所有 `build/doc-fragments/batch-*.json`
2. 对每个词：
   - 新条目（`_audit.isNew`）：直接加入
   - 已有条目：合并 `contexts`，补全缺失的 keywords/parameters，不覆盖已有正确内容
3. 移除 `_audit` 字段
4. 产出更新后的 `syntaxes/sdevice_command_docs.json`

## JSON 结构变更

### 新增 `contexts` 字段

```jsonc
{
  "Current": {
    "section": "Electrode",
    "description": "...(default description, backward compatible)...",
    "contexts": {
      "Electrode": "Current boundary condition in A/um/d",
      "Plot": "Output current data to the plot file",
      "Solve": "Solve for the current equation",
      "Goal": "Use current value as the solve target"
    }
  }
}
```

**设计决策**：
- 使用 `contexts` 子结构而非复合 key（如 `Current@Electrode`），保持扁平 key 查找兼容
- `contexts` 仅包含 description 级别的差异，不包含 parameters/keywords 级别的差异
- 无多语义的词不添加 `contexts` 字段

### 消费侧改动

`src/extension.js` 的 hover 逻辑（~line 612）小改：

```javascript
const kwDoc = docs[word];
if (kwDoc) {
    // 优先查 contexts[currentSection]
    if (kwDoc.contexts && kwDoc.contexts[secName]) {
        // 构造带上下文描述的 hover
    }
    return new vscode.Hover(formatDoc(kwDoc, langId), range);
}
```

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `scripts/audit-sdevice-keywords.js` | 新增 | 阶段 1 扫描脚本 |
| `scripts/merge-sdevice-docs.js` | 新增 | 阶段 3 合并脚本 |
| `build/sdevice-keyword-audit.json` | 生成 | 阶段 1 产出 |
| `build/doc-fragments/batch-*.json` | 生成 | 阶段 2 产出 |
| `syntaxes/sdevice_command_docs.json` | 更新 | 合并后的最终产物 |
| `docs/函数文档提取与编写规范.md` | 更新 | 新增 §3.6 contexts、§7.3 审计模板 |
| `src/extension.js` | 更新 | hover 查找支持 contexts |

## 执行计划

1. 编写并运行 `audit-sdevice-keywords.js`（产出审计 JSON）
2. 将审计 JSON 按词分批，启动并行子代理生成文档片段
3. 编写并运行 `merge-sdevice-docs.js`（合并为最终产物）
4. 更新 hover 查找逻辑支持 `contexts`
5. 验证 hover 在不同 section 下显示正确的上下文文档
6. 后续：翻译流程更新中文文档
