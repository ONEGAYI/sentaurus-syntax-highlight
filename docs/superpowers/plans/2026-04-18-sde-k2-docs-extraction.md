# SDE K2 函数文档批量提取 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 SDE 官方文档提取 159 个 KEYWORD2 函数文档，追加到 `syntaxes/sde_function_docs.json`

**Architecture:** 按 22 个前缀组分 13 批，5 轮并发（每轮 ≤3 sonnet agent），每个 agent 读取文档源段并编写 JSON，输出到 `build/k2_batch_N.json`，最终合并到主文件

**Tech Stack:** Node.js（验证脚本）、JSON 文档格式、并发 Agent 工具

---

## 文件结构

| 操作 | 文件 | 说明 |
|------|------|------|
| 读取 | `references/sde_ug_T-2022.03.md` | 主文档（131 个 K2 函数） |
| 读取 | `references/sde_ug_T-2022.03_1.md` | 补充文档（28 个 K2 函数） |
| 读取 | `syntaxes/all_keywords.json` | K2 关键词列表验证源 |
| 读取 | `docs/函数文档提取与编写规范.md` | 文档格式规范 |
| 修改 | `syntaxes/sde_function_docs.json` | 目标文件（406→565 条） |
| 创建 | `build/k2_batch_1.json` ~ `build/k2_batch_13.json` | 各批次输出 |

---

## Agent Prompt 模板

每个 agent 使用以下通用 prompt 框架，具体内容在各 Task 中填充：

```
你是 SDE 函数文档提取 agent。请从 SDE 官方文档中提取以下函数的文档，按规范编写 JSON。

## 规范
- 参照 docs/函数文档提取与编写规范.md 中 SDE (Scheme) 模板
- 每个条目包含: signature, description, parameters, example
- Key 必须与下面列表中的关键词完全一致（含冒号、问号、感叹号）
- signature 从文档 Syntax 小节提取，可选参数用 [] 包裹
- description 从首段描述提取，简短英文，1-3 句
- parameters 从 Arguments 表格提取，type 使用标准标签（string, number, float, int, position, boolean, pair, list）
- example 从 Examples 小节提取最简短示例；如无示例，编写一个最小可用示例
- 参数选项必须解释实际行为含义，不能只枚举值
- 可选参数在 desc 中注明 "Optional"

## 目标关键词列表
{{KEYWORDS_WITH_LOCATIONS}}

## 操作步骤
1. 对每个关键词，在指定文档的起始行号附近找到完整条目（从标题到下一个函数标题之间）
2. 提取 Syntax、Returns、Arguments、Examples 信息
3. 按规范编写 JSON 条目
4. 将所有条目合并为一个 JSON 对象并写入 build/k2_batch_{{N}}.json

## 输出
将完整的 JSON 对象写入 D:\CODE\Project\sentaurus-syntax-highlight\build\k2_batch_{{N}}.json
JSON 必须合法（无尾逗号、无注释、无 JavaScript 特有格式）。
```

---

## Task 1: 预备工作

**Files:**
- 验证: `references/sde_ug_T-2022.03.md`
- 验证: `references/sde_ug_T-2022.03_1.md`
- 验证: `syntaxes/all_keywords.json`

- [ ] **Step 1: 确认源文件存在且可读**

```bash
node -e "
const fs = require('fs');
const files = [
  'references/sde_ug_T-2022.03.md',
  'references/sde_ug_T-2022.03_1.md',
  'syntaxes/all_keywords.json',
  'syntaxes/sde_function_docs.json'
];
files.forEach(f => {
  const exists = fs.existsSync(f);
  const size = exists ? fs.statSync(f).size : 0;
  console.log(f + ': ' + (exists ? 'OK (' + size + ' bytes)' : 'MISSING'));
});
"
```

预期：全部显示 OK。

- [ ] **Step 2: 确认 build 目录存在**

```bash
ls -la build/ || mkdir -p build
```

- [ ] **Step 3: 确认 K2 关键词总数**

```bash
node -e "
const k = require('./syntaxes/all_keywords.json');
console.log('K2 count:', k.sde.KEYWORD2.length);
const docs = require('./syntaxes/sde_function_docs.json');
console.log('Existing docs:', Object.keys(docs).length);
"
```

预期：K2 count: 159, Existing docs: 406。

---

## Task 2: Round 1 — 批 1 (gvector) + 批 2 (entity) + 批 3 (position)

并发启动 3 个 sonnet agent。

### 批 1: gvector 组（20 个函数）

源文档：`sde_ug_T-2022.03.md`（`references/` 目录下）

| 关键词 | 起始行 |
|--------|--------|
| gvector | 11252 |
| gvector? | 11272 |
| gvector:+ | 11288 |
| gvector:- | 11308 |
| gvector:copy | 11328 |
| gvector:cross | 11348 |
| gvector:dot | 11364 |
| gvector:from-to | 11380 |
| gvector:length | 11396 |
| gvector:parallel? | 11412 |
| gvector:perpendicular? | 11430 |
| gvector:reverse | 11448 |
| gvector:scale | 11464 |
| gvector:set! | 11482 |
| gvector:set-x! | 11498 |
| gvector:set-y! | 11520 |
| gvector:set-z! | 11542 |
| gvector:transform | 11564 |
| gvector:unitize | 11580 |
| gvector:x | 11596 |
| gvector:y | 11612 |
| gvector:z | 11628 |

### 批 2: entity 组（14 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| entity:box | 10332 |
| entity:copy | 10350 |
| entity:debug | 10367 |
| entity:deep-copy | 10390 |
| entity:delete | 10410 |
| entity:dist | 10426 |
| entity:edges | 10449 |
| entity:erase | 10465 |
| entity:faces | 10483 |
| entity:loops | 10499 |
| entity:lumps | 10515 |
| entity:set-color | 10531 |
| entity:shells | 10569 |
| entity:vertices | 10585 |

### 批 3: position 组（10 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| position | 12089 |
| position? | 12115 |
| position:+ | 12131 |
| position:- | 12147 |
| position:distance | 12163 |
| position:set! | 12179 |
| position:set-x! | 12195 |
| position:set-y! | 12211 |
| position:set-z! | 12227 |
| position:x | 12243 |
| position:y | 12259 |
| position:z | 12275 |

- [ ] **Step 1: 并发启动 3 个 agent**

使用 Agent 工具并发启动 3 个 sonnet agent，每个 agent 使用上面的 prompt 模板，填充对应的关键词列表和行号。输出分别为 `build/k2_batch_1.json`、`build/k2_batch_2.json`、`build/k2_batch_3.json`。

- [ ] **Step 2: 验证 3 个批次输出**

```bash
node -e "
const fs = require('fs');
[1,2,3].forEach(n => {
  const f = 'build/k2_batch_' + n + '.json';
  if (!fs.existsSync(f)) { console.log(f + ': MISSING'); return; }
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  const keys = Object.keys(obj);
  const missing = keys.filter(k => !obj[k].signature || !obj[k].description || !obj[k].parameters || !obj[k].example);
  console.log(f + ': ' + keys.length + ' entries' + (missing.length ? ', ' + missing.length + ' incomplete' : ', all complete'));
});
"
```

预期：batch_1 约 22 条，batch_2 约 14 条，batch_3 约 12 条，全部 complete。

---

## Task 3: Round 2 — 批 4 (edge) + 批 5 (journal) + 批 6 (face)

### 批 4: edge 组（10 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| edge? | 10144 |
| edge:circular | 10160 |
| edge:circular? | 10178 |
| edge:elliptical? | 10194 |
| edge:end | 10210 |
| edge:length | 10226 |
| edge:linear | 10242 |
| edge:linear? | 10262 |
| edge:mid-point | 10284 |
| edge:start | 10300 |
| edge:type | 10316 |

### 批 5: journal 组（10 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| journal:abort | 11644 |
| journal:append | 11656 |
| journal:clean | 11672 |
| journal:load | 11688 |
| journal:off | 11710 |
| journal:on | 11722 |
| journal:pause | 11757 |
| journal:resume | 11769 |
| journal:save | 11781 |
| journal:step | 11798 |

### 批 6: face 组（8 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| face:area | 10842 |
| face:conical? | 10858 |
| face:cylindrical? | 10876 |
| face:planar? | 10894 |
| face:plane-normal | 10910 |
| face:spherical? | 10926 |
| face:spline? | 10942 |
| face:toroidal? | 10958 |

- [ ] **Step 1: 并发启动 3 个 agent**

同 Task 2 Step 1，输出 `build/k2_batch_4.json`、`build/k2_batch_5.json`、`build/k2_batch_6.json`。

- [ ] **Step 2: 验证 3 个批次输出**

同 Task 2 Step 2 的验证脚本，替换批次号为 4、5、6。
预期：batch_4 约 11 条，batch_5 约 10 条，batch_6 约 8 条。

---

## Task 4: Round 3 — 批 7 (无前缀①) + 批 8 (无前缀②) + 批 9 (无前缀③)

### 批 7: 无前缀 — 几何查询 ①（14 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| find-body-id | 10992 |
| find-body-id-drs | 11008 |
| find-drs-id | 11024 |
| find-edge-id | 11040 |
| find-edge-id-drs | 11068 |
| find-face-id | 11084 |
| find-face-id-drs | 11100 |
| find-material-id | 11116 |
| find-region | 11134 |
| find-region-id | 11152 |
| find-vertex-id | 11170 |
| find-vertex-id-drs | 11186 |
| get-body-list | 11202 |
| get-drs-list | 11216 |

### 批 8: 无前缀 — 几何查询 ②（14 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| bbox | 9957 |
| bbox-exact | 9975 |
| complete-edge-list | 10080 |
| extract-interface-normal-offset-refwindow | 10697 |
| extract-interface-offset-refwindow | 10722 |
| extract-refpolyhedron | 10747 |
| extract-refwindow | 10784 |
| exists-empty-mask-name | 10665 |
| exists-mask-name | 10681 |
| get-empty-mask-list | 11228 |
| get-mask-list | 11240 |
| mask-refevalwin-extract-2d | 11872 |
| mask-refevalwin-extract-3d | 11905 |
| set-interface-contact | 注意：此函数在 _1.md:6020 |

### 批 9: 无前缀 — 类型判断（14 个函数）

源文档分布：主文档 + _1.md

| 关键词 | 起始行 |
|--------|--------|
| body? | 主 9993 |
| edge? | 主 10144（注：已在批 4，跳过） |
| gvector | 主 11252（注：已在批 1，跳过） |
| gvector? | 主 11272（注：已在批 1，跳过） |
| lump? | 主 11854 |
| loop? | 主 11816 |
| member? | 主 11938 |
| position | 主 12089（注：已在批 3，跳过） |
| position? | 主 12115（注：已在批 3，跳过） |
| shell? | _1 6054 |
| solid? | _1 6096 |
| vertex? | _1 6633 |
| wire? | _1 6665 |
| wire-body? | _1 6681 |

**注意：** 此批实际只含 8 个函数（去除与批 1/3/4 重复的），不是 14 个。去重后的实际列表：

| 关键词 | 起始行 |
|--------|--------|
| body? | sde_ug_T-2022.03.md:9993 |
| lump? | sde_ug_T-2022.03.md:11854 |
| loop? | sde_ug_T-2022.03.md:11816 |
| member? | sde_ug_T-2022.03.md:11938 |
| shell? | sde_ug_T-2022.03_1.md:6054 |
| solid? | sde_ug_T-2022.03_1.md:6096 |
| vertex? | sde_ug_T-2022.03_1.md:6633 |
| wire? | sde_ug_T-2022.03_1.md:6665 |
| wire-body? | sde_ug_T-2022.03_1.md:6681 |

- [ ] **Step 1: 并发启动 3 个 agent**

同上，输出 `build/k2_batch_7.json`、`build/k2_batch_8.json`、`build/k2_batch_9.json`。

- [ ] **Step 2: 验证 3 个批次输出**

预期：batch_7 约 14 条，batch_8 约 14 条，batch_9 约 9 条。

---

## Task 5: Round 4 — 批 10 (无前缀④) + 批 11 (part+transform) + 批 12 (timer+string+env)

### 批 10: 无前缀 — 杂项（13 个函数）

源文档：`sde_ug_T-2022.03.md`

| 关键词 | 起始行 |
|--------|--------|
| afm-smooth-layers | 9920 |
| build-csv-lens | 10013 |
| color:rgb | 10047 |
| convert-to-degree | 10112 |
| convert-to-radian | 10128 |
| erf | 10633 |
| erfc | 10649 |
| merge-collinear-edges-2d | 11965 |
| protect-all-contacts | 12291 |
| random-sd | 12305 |
| remove-body-ABA | 12327 |
| remove-body-BAB | 12347 |
| roll | 12387 |

### 批 11: part + transform 组（9 个函数）

源文档分布：主文档 + _1.md

| 关键词 | 起始行 |
|--------|--------|
| part:entities | sde_ug_T-2022.03.md:11985 |
| part:load | sde_ug_T-2022.03.md:12010 |
| part:save | sde_ug_T-2022.03.md:12034 |
| part:save-selection | sde_ug_T-2022.03.md:12052 |
| part:set-name | sde_ug_T-2022.03.md:12070 |
| transform:reflection | sde_ug_T-2022.03_1.md:6448 |
| transform:rotation | sde_ug_T-2022.03_1.md:6474 |
| transform:scaling | sde_ug_T-2022.03_1.md:6500 |
| transform:translation | sde_ug_T-2022.03_1.md:6531 |

### 批 12: timer + string + env + 其他小组（11 个函数）

源文档分布：主文档 + _1.md

| 关键词 | 起始行 |
|--------|--------|
| env:set-tolerance | sde_ug_T-2022.03.md:10601 |
| env:tolerance | sde_ug_T-2022.03.md:10621 |
| filter:type | sde_ug_T-2022.03.md:10974 |
| loop:external? | sde_ug_T-2022.03.md:11834 |
| render:rebuild | sde_ug_T-2022.03.md:12367 |
| string:head | sde_ug_T-2022.03_1.md:6174 |
| string:tail | sde_ug_T-2022.03_1.md:6192 |
| sweep:law | sde_ug_T-2022.03_1.md:6210 |
| sweep:options | sde_ug_T-2022.03_1.md:6301 |
| system:command | sde_ug_T-2022.03_1.md:6356 |
| system:getenv | sde_ug_T-2022.03_1.md:6372 |

- [ ] **Step 1: 并发启动 3 个 agent**

输出 `build/k2_batch_10.json`、`build/k2_batch_11.json`、`build/k2_batch_12.json`。

- [ ] **Step 2: 验证 3 个批次输出**

预期：batch_10 约 13 条，batch_11 约 9 条，batch_12 约 11 条。

---

## Task 6: Round 5 — 批 13 (剩余小组)

仅 1 个 agent。

### 批 13: 剩余分散前缀组（8 个函数）

源文档分布：主文档 + _1.md

| 关键词 | 起始行 |
|--------|--------|
| skin:options | sde_ug_T-2022.03_1.md:6072 |
| solid:area | sde_ug_T-2022.03_1.md:6112 |
| solid:massprop | sde_ug_T-2022.03_1.md:6130 |
| sort | sde_ug_T-2022.03_1.md:6150 |
| timer:end | sde_ug_T-2022.03_1.md:6388 |
| timer:get-time | sde_ug_T-2022.03_1.md:6402 |
| timer:show-time | sde_ug_T-2022.03_1.md:6418 |
| timer:start | sde_ug_T-2022.03_1.md:6434 |
| util:make-bot-contact | sde_ug_T-2022.03_1.md:6553 |
| util:make-top-contact | sde_ug_T-2022.03_1.md:6610 |
| view:set-point-size | sde_ug_T-2022.03_1.md:6649 |
| wire:planar? | sde_ug_T-2022.03_1.md:6697 |

- [ ] **Step 1: 启动 1 个 agent**

输出 `build/k2_batch_13.json`。

- [ ] **Step 2: 验证输出**

预期：batch_13 约 12 条。

---

## Task 7: 合并与验证

**Files:**
- 读取: `build/k2_batch_1.json` ~ `build/k2_batch_13.json`
- 修改: `syntaxes/sde_function_docs.json`

- [ ] **Step 1: 统计所有批次的条目总数**

```bash
node -e "
const fs = require('fs');
let total = 0;
let batchKeys = new Set();
for (let i = 1; i <= 13; i++) {
  const f = 'build/k2_batch_' + i + '.json';
  if (!fs.existsSync(f)) { console.log(f + ': MISSING'); continue; }
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  const keys = Object.keys(obj);
  console.log('batch_' + i + ': ' + keys.length + ' entries');
  total += keys.length;
  keys.forEach(k => {
    if (batchKeys.has(k)) console.log('  DUPLICATE: ' + k);
    batchKeys.add(k);
  });
}
console.log('Total K2 entries: ' + total);
console.log('Unique keys: ' + batchKeys.size);
"
```

预期：总计约 159 条，无重复。

- [ ] **Step 2: 验证与 all_keywords.json 的一致性**

```bash
node -e "
const fs = require('fs');
const k2 = require('./syntaxes/all_keywords.json').sde.KEYWORD2;
const k2set = new Set(k2);

// Collect all batch keys
let batchKeys = new Set();
for (let i = 1; i <= 13; i++) {
  const f = 'build/k2_batch_' + i + '.json';
  if (!fs.existsSync(f)) continue;
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  Object.keys(obj).forEach(k => batchKeys.add(k));
}

// Check missing
const missing = k2.filter(k => !batchKeys.has(k));
const extra = [...batchKeys].filter(k => !k2set.has(k));
console.log('K2 missing from docs:', missing.length, missing);
console.log('Extra keys not in K2:', extra.length, extra);
"
```

预期：missing 0, extra 0。

- [ ] **Step 3: 验证每个条目的字段完整性**

```bash
node -e "
const fs = require('fs');
let issues = [];
for (let i = 1; i <= 13; i++) {
  const f = 'build/k2_batch_' + i + '.json';
  if (!fs.existsSync(f)) continue;
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [key, val] of Object.entries(obj)) {
    if (!val.signature) issues.push(key + ': missing signature');
    if (!val.description) issues.push(key + ': missing description');
    if (!Array.isArray(val.parameters)) issues.push(key + ': missing parameters');
    if (!val.example) issues.push(key + ': missing example');
  }
}
console.log('Issues:', issues.length);
issues.forEach(i => console.log('  ' + i));
"
```

预期：Issues: 0。

- [ ] **Step 4: 合并到 sde_function_docs.json**

```bash
node -e "
const fs = require('fs');
const existing = JSON.parse(fs.readFileSync('syntaxes/sde_function_docs.json', 'utf8'));
const existingKeys = new Set(Object.keys(existing));
console.log('Existing entries:', existingKeys.size);

let added = 0, dupes = [];
for (let i = 1; i <= 13; i++) {
  const f = 'build/k2_batch_' + i + '.json';
  if (!fs.existsSync(f)) continue;
  const batch = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [key, val] of Object.entries(batch)) {
    if (existingKeys.has(key)) { dupes.push(key); continue; }
    existing[key] = val;
    existingKeys.add(key);
    added++;
  }
}

console.log('Added:', added);
console.log('Duplicates skipped:', dupes.length, dupes);
console.log('Final total:', Object.keys(existing).length);

fs.writeFileSync('syntaxes/sde_function_docs.json', JSON.stringify(existing, null, 2) + '\n');
console.log('Written to sde_function_docs.json');
"
```

预期：Added: ~159, Duplicates: 0, Final total: ~565。

- [ ] **Step 5: 最终验证 — JSON 合法性**

```bash
node -e "
const docs = require('./syntaxes/sde_function_docs.json');
console.log('Total entries:', Object.keys(docs).length);
console.log('JSON parse: OK');
" && echo "JSON valid"
```

- [ ] **Step 6: 提交**

```bash
git add syntaxes/sde_function_docs.json
git commit -m "feat(sde): 添加 159 个 KEYWORD2 函数悬停文档

从 SDE User Guide (T-2022.03) 附录 A 提取 gvector/position/entity/edge/face/
journal/part/timer/transform 等前缀组的函数文档，按函数文档编写规范格式化。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
