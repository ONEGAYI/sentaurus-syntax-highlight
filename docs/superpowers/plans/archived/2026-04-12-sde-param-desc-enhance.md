# SDE 函数文档参数描述增强 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 `sde_function_docs.json` 中 405 个函数的参数 `desc` 字段，补充枚举值含义和类型细节

**Architecture:** 9 个并行子代理各负责一个前缀批次，读取手册 markdown 增强参数描述后输出 JSON 片段，主代理按 key 合并写入最终文件

**Tech Stack:** Node.js / Python (JSON 处理), Grep/Read (手册查阅)

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `syntaxes/sde_function_docs.json` | 修改 | 目标文件，405 个函数的参数 desc 增强 |
| `references/sde_ug_T-2022.03.md` | 只读 | T-2022 手册，主参考源 |
| `references/sense_ug_N-2017.09.pdf.md` | 只读 | N-2017 旧手册，补充参考源 |

## 增强规则

1. **仅修改 `parameters[].desc`**，不改动 `description`、`signature`、`example`、参数 `name`/`type`
2. **语言**：保持英文
3. **信源优先级**：T-2022 正文 > T-2022 附录 > N-2017 附录
4. **有手册参考的函数**：对照原文增强参数 desc
5. **无手册参考的函数**：在 `description` 末尾追加 ` [信源不充分]`
6. **严格参照原文**，不臆造信息

---

## Task 1: 并行调度 9 个子代理

**Files:**
- Read: `syntaxes/sde_function_docs.json`
- Modify: `syntaxes/sde_function_docs.json`

### 批次分配

| 批次 | 前缀范围 | 函数数 | 手册来源 | 有参考 |
|------|---------|--------|---------|--------|
| B1 | `sde:` add-material ~ post-message (前70) | 70 | T-2022 行 12403-13719 | 70 |
| B2 | `sde:` project-name ~ zoom-all (后70) | 70 | T-2022 行 13731-15055 | 70 |
| B3 | `sdedr:` 全部 | 63 | T-2022 行 15067-16309 + 正文 7440-7700 | 62 |
| B4 | `sdegeo:create-*` | 20 | T-2022 行 16395-16692 + N-2017 行 18468+ | 20 |
| B5a | `sdegeo:` 2d-cut ~ get-auto-region-naming | 52 | T-2022 + N-2017 | 4 |
| B5b | `sdegeo:` get-contact-edgelist ~ vsmooth | 52 | T-2022 + N-2017 | 6 |
| B6 | `sdeicwb:` 全部 | 35 | N-2017 行 21787 (1个有参考) | 1 |
| B7 | `sdepe:` + `sdeio:` | 27 | N-2017 行 22989+ (4个有参考) | 4 |
| B8 | `sdesnmesh:` + `sdeepi:` + `sdesp:` | 16 | N-2017 行 23440+ (4个有参考) | 4 |

### 子代理 Prompt 模板

每个子代理接收以下 prompt（以 B1 为例）：

```
你是 SDE 函数文档增强子代理。你的任务：
1. 读取 syntaxes/sde_function_docs.json 中以下函数的数据（仅这些函数）：
   {函数名列表}
2. 对每个函数，在手册文件中搜索该函数的文档段落：
   - 主源: references/sde_ug_T-2022.03.md（用 grep 搜索 "^# 函数名"）
   - 补充源: references/sense_ug_N-2017.09.pdf.md
   - 正文补充（仅 sdedr: 批次）: references/sde_ug_T-2022.03.md 行 7440-7700
3. 对照手册内容，仅修改 parameters[].desc 字段：
   - 补充枚举值含义（如 "Replace" | "NoReplace" → 各自的具体行为）
   - 细化类型信息（如 STRING → STRING (optional)）
   - 保留原文有用的内容，不要删减
4. 如果手册中没有该函数的条目，在 description 末尾追加 " [信源不充分]"
5. 严格参照手册原文，不臆造信息
6. 输出完整的 JSON 对象（仅包含本批次函数），格式合法
```

- [ ] **Step 1: 并行启动 9 个子代理**

使用 Agent 工具同时启动 9 个子代理（subagent_type: general-purpose），每个传入对应批次的 prompt。所有子代理在一条消息中发出。

- [ ] **Step 2: 收集子代理输出**

等待所有 9 个子代理完成，收集各自的 JSON 片段输出。

- [ ] **Step 3: 合并 JSON 片段**

```bash
cd D:\CODE\Project\sentaurus-syntax-highlight
python3 -c "
import json, sys

# 加载原始文件
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    merged = json.load(f)

# 子代理输出会逐个合并到这里
# merged.update(batch_output) for each batch

with open('syntaxes/sde_function_docs.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f'Total functions: {len(merged)}')
"
```

- [ ] **Step 4: JSON 格式校验**

```bash
python3 -m json.tool syntaxes/sde_function_docs.json > /dev/null && echo "VALID" || echo "INVALID"
```

Expected: `VALID`

- [ ] **Step 5: 函数总数校验**

```bash
python3 -c "
import json
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f'Total: {len(data)}')
assert len(data) == 405, f'Expected 405, got {len(data)}'
print('COUNT OK')
"
```

Expected: `Total: 405` + `COUNT OK`

- [ ] **Step 6: 抽查验证**

随机抽查 3-5 个函数，对照手册原文确认 desc 增强准确。重点检查：
- `sdedr:define-analytical-profile-placement` 的 `replacement` 参数（应为"只替换同种掺杂物质"）
- `sdegeo:create-circle` 的 `start-angle`/`end-angle` 参数
- `sde:build-mesh` 的 `options` 参数

- [ ] **Step 7: 提交**

```bash
git add syntaxes/sde_function_docs.json
git commit -m "docs: 增强 SDE 函数文档参数描述，补充枚举值含义和类型细节"
```
