# SDE 函数文档参数描述增强设计

## Context

`syntaxes/sde_function_docs.json` 中 405 个函数的参数 `desc` 字段普遍过于简略——只列枚举值不解释含义、缺少类型细节。原始手册（T-2022.03 + N-2017.09）的命令参考附录和正文章节中有更详细说明，但编写 JSON 时做了过度精简。

**目标**：仅增强 `parameters[].desc` 字段，不改动 `description`、`signature`、`example` 等其他字段。

## 增强规则

1. **语言**：保持英文，与现有 JSON 风格一致
2. **信源优先级**：T-2022 正文 > T-2022 附录 > N-2017 附录
3. **有参考的函数**（~214 个）：对照手册原文增强参数 desc，补充枚举值含义、类型细化
4. **无参考的函数**（~191 个）：在 `description` 末尾追加 ` [信源不充分]`，参数 desc 不动
5. **严格参照原文**：不臆造信息，手册中没有的内容不添加

## 实现方案：8 个并行子代理

### 子代理工作流程

每个子代理：
1. 读取 `sde_function_docs.json` 中本批次前缀的函数
2. 对每个函数，在手册 markdown 中 `grep` 定位 `# func-name` 标题
3. 读取标题到下一个 `#` 之间的内容（参数表格 + Description）
4. 对照当前 `parameters[].desc`，用手册信息补充枚举值含义、类型细节
5. 无手册条目的函数，在 `description` 末尾追加 ` [信源不充分]`
6. 输出本批次前缀的完整 JSON 对象

### 批次划分

| 批次 | 前缀范围 | 函数数 | 手册来源 | 策略 |
|------|---------|--------|---------|------|
| B1 | `sde:` A-M（前半） | ~70 | T-2022 行 12403-13600 | 全量增强 |
| B2 | `sde:` N-Z（后半） | ~70 | T-2022 行 13600-15055 | 全量增强 |
| B3 | `sdedr:` 全部 | 63 | T-2022 行 15067-16309 + 正文 7440-7700 | 全量增强 |
| B4 | `sdegeo:` create-* | ~30 | T-2022 行 16395-16692 + N-2017 行 18468+ | 有参考增强，无参考标记 |
| B5 | `sdegeo:` 其余 | ~94 | T-2022 + N-2017 | 有参考增强，无参考标记 |
| B6 | `sdeicwb:` 全部 | 35 | N-2017 行 21787 (1个有参考) | 1个增强，34个标记 |
| B7 | `sdepe:` + `sdeio:` | 27 | N-2017 行 22989+ (4个有参考) | 4个增强，23个标记 |
| B8 | `sdesnmesh:` + `sdeepi:` + `sdesp:` | 16 | N-2017 行 23440+ (4个有参考) | 4个增强，12个标记 |

### 手册来源文件

- **T-2022 主源**：`references/sde_ug_T-2022.03.md`
- **N-2017 补充**：`references/sense_ug_N-2017.09.pdf.md`
- **T-2022 正文**（掺杂语义补充）：行 7440-7700（Replace/NoReplace/LocalReplace 等定义）

## 合并与验证

1. 主代理加载原始 `sde_function_docs.json`
2. 遍历 8 个子代理输出，按函数名 key 覆盖对应条目
3. `python -m json.tool` 格式校验
4. 抽查 3-5 个函数的参数 desc，确认与手册原文一致
5. 确认函数总数仍为 405

## 参数 desc 增强示例

### Before
```json
{
  "name": "replacement",
  "type": "string",
  "desc": "\"Replace\" | \"NoReplace\" | \"LocalReplace\""
}
```

### After
```json
{
  "name": "replacement",
  "type": "string",
  "desc": "\"Replace\" (replace all previously defined profiles) | \"NoReplace\" (add to existing profiles) | \"LocalReplace\" (replace only the doping species being defined)"
}
```
