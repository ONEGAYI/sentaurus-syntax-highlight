# SDE KEYWORD2 函数文档批量提取设计

## 背景

`sde_function_docs.json` 当前包含 406 条文档，全部为 KEYWORD1（K1）级别的 `sdegeo:`/`sdedr:`/`sde:` 命令。KEYWORD2（K2）的 159 个辅助/查询函数缺少悬停文档，导致用户在使用 `gvector`、`position`、`entity:copy` 等函数时无法获得帮助信息。

## 目标

从 SDE 官方文档（`references/sde_ug_T-2022.03.md` + `sde_ug_T-2022.03_1.md`）手动提取 159 个 K2 函数文档，追加到 `syntaxes/sde_function_docs.json`，格式遵循 `docs/函数文档提取与编写规范.md`。

## 数据源

| 文件 | 覆盖范围 | 格式 |
|------|---------|------|
| `sde_ug_T-2022.03.md` | 131/159 K2 函数 | `# 函数名` 标题 + Syntax/Returns/Arguments 小节 |
| `sde_ug_T-2022.03_1.md` | 补充剩余 28 个 | 同上 |

两份文档合计覆盖全部 159 个 K2 函数。

## 分批策略

### 按 22 个前缀组分批

K2 关键词按 `:` 前缀分为以下 22 组：

| 批号 | 前缀组 | 数量 | 文档来源 |
|------|--------|------|---------|
| 1 | gvector: | 20 | 主文档 |
| 2 | entity: | 14 | 主文档 |
| 3 | position: | 10 | 主文档 |
| 4 | edge: | 10 | 主文档 |
| 5 | journal: | 10 | 主文档 |
| 6 | face: | 8 | 主文档 |
| 7 | (no-prefix) 几何查询 ① | ~14 | 主文档 |
| 8 | (no-prefix) 几何查询 ② | ~14 | 主文档 |
| 9 | (no-prefix) 类型判断 | ~14 | 主文档 |
| 10 | (no-prefix) 掩模/杂项 | ~13 | 主文档 |
| 11 | part: (5) + transform: (4) | 9 | 主文档 |
| 12 | timer: (4) + string: (2) + env: (2) | 8 | 主文档+_1 |
| 13 | solid: (2) + system: (2) + util: (2) + sweep: (2) + filter: (1) + loop: (1) + color: (1) + wire: (1) + view: (1) + render: (1) + skin: (1) | 15 | 主文档+_1 |

### 无前缀函数细分（批 7-10）

55 个无前缀函数按功能分为：

- **几何查询** ①（~14 个）：`find-material-id`, `find-vertex-id`, `find-face-id`, `find-edge-id`, `find-region-id`, `find-drs-id`, `find-vertex-id-drs`, `find-edge-id-drs`, `find-face-id-drs`, `find-body-id-drs`, `find-body-id`, `find-region`, `get-body-list`, `get-drs-list`
- **几何查询** ②（~14 个）：`bbox`, `bbox-exact`, `complete-edge-list`, `extract-refwindow`, `extract-refpolyhedron`, `extract-interface-normal-offset-refwindow`, `extract-interface-offset-refwindow`, `mask-refevalwin-extract-2d`, `mask-refevalwin-extract-3d`, `get-mask-list`, `get-empty-mask-list`, `exists-mask-name`, `exists-empty-mask-name`, `set-interface-contact`
- **类型判断**（~14 个）：`gvector`, `position`, `gvector?`, `position?`, `vertex?`, `edge?`, `body?`, `solid?`, `shell?`, `lump?`, `wire?`, `wire-body?`, `loop?`, `member?`
- **掩模/杂项**（~13 个）：`roll`, `remove-body-BAB`, `remove-body-ABA`, `erf`, `erfc`, `convert-to-degree`, `convert-to-radian`, `random-sd`, `sort`, `protect-all-contacts`, `afm-smooth-layers`, `build-csv-lens`, `merge-collinear-edges-2d`

## 并发策略

- 使用 Agent 工具并发启动子 agent
- 每轮最多 **3 个 sonnet agent** 并发（遵循全局约定）
- 13 批 / 每轮 3 个 = **5 轮**
- 每个 agent 输出写入独立文件 `build/k2_batch_N.json`
- 主进程负责调度和最终合并

### 执行轮次

| 轮次 | 并发批次 | Agent 数 |
|------|---------|---------|
| 1 | 批 1 (gvector) + 批 2 (entity) + 批 3 (position) | 3 |
| 2 | 批 4 (edge) + 批 5 (journal) + 批 6 (face) | 3 |
| 3 | 批 7 (无前缀①) + 批 8 (无前缀②) + 批 9 (无前缀③) | 3 |
| 4 | 批 10 (无前缀④) + 批 11 (part+transform) + 批 12 (timer+string+env) | 3 |
| 5 | 批 13 (剩余小组) | 1 |

## Agent 工作流程

每个 agent 接收：
- 负责的 K2 关键词列表
- 对应文档在 md 文件中的位置（行号范围）
- 文档格式规范引用

Agent 执行：
1. 读取 md 文档中对应函数的完整条目
2. 按 `函数文档提取与编写规范.md` 中 SDE 模板格式，编写 JSON 条目
3. 将结果写入 `build/k2_batch_N.json`
4. 每个条目包含：`signature`, `description`, `parameters`, `example`

## 合并流程

所有批次完成后：
1. 读取 `sde_function_docs.json`（现有 406 条）
2. 读取 `build/k2_batch_*.json`（所有批次输出）
3. 合并为一个对象（key 不得重复）
4. 写回 `sde_function_docs.json`
5. 验证 JSON 合法性

## 文档格式

遵循 `函数文档提取与编写规范.md` 中 SDE (Scheme) 模板：

```json
{
  "<key>": {
    "signature": "(<key> param1 param2 [optional-param])",
    "description": "简短的英文功能描述，1-3 句。",
    "parameters": [
      { "name": "param1", "type": "<type>", "desc": "参数说明。" },
      { "name": "optional-param", "type": "<type>", "desc": "Optional. 可选参数说明。" }
    ],
    "example": "(<key> value1 value2)"
  }
}
```

- Key 格式：与 `all_keywords.json` 中的关键词完全一致
- `signature`：从文档的 Syntax 小节提取，可选参数用 `[]` 包裹
- `description`：从文档的首段描述提取，保持简短英文
- `parameters`：从 Arguments 表格提取，type 使用标准标签
- `example`：从 Examples 小节提取，优先选择最简短的示例

## 质量检查

合并完成后逐条确认：
- Key 唯一性（无重复）
- Key 与 `all_keywords.json` 一致
- 必备字段非空（signature, description, parameters, example）
- 参数类型使用标准标签
- JSON 合法性（无尾逗号、无注释）
