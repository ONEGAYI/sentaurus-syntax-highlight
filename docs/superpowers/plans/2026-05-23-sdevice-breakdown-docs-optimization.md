# SDEVICE 击穿效应文档优化计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 SDEVICE 击穿效应相关文档的翻译残留/语法错误，并按优先级补充简略条目的内容。

**Architecture:** 分两阶段：Phase 1 为纯修复（翻译残留、语法错误、example 括号），不涉及内容创作；Phase 2 为内容补充（查阅手册 → 重写英文 → 翻译中文）。每个 Task 是一个独立 JSON 条目的完整修改。

**Tech Stack:** JSON 文件手工编辑 + Python 脚本批量修复翻译残留

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `syntaxes/sdevice_command_docs.json` | 英文文档（主源） |
| `syntaxes/sdevice_command_docs.zh-CN.json` | 中文文档（从英文翻译） |

## 调查摘要

击穿相关共 ~40 个条目，其中：
- **5 处翻译残留**：中文 `。.` （中文句号后多余英文句号）
- **1 处语法错误**：英文 `GradQuasiFermi` example 多余 `)`
- **1 处翻译错误**：中文 `hSHEAvalancheGeneration` "孔"应为"空穴"
- **1 处描述晦涩**：`AvalPostProcessing` 中英文描述均直译晦涩，需改写为直白表述
- **2 个核心条目无参数无示例**：`eAvalanche` / `hAvalanche`
- **1 个完全缺失条目**：`Hatakeyama`
- **6 个简略条目**（仅一句话）：`Lackner`, `UniBo2`, `BandgapDependence`, `AvaHomotopy`, `hBreakdownProbability`, `hAlphaAvalanche`

---

## Phase 1：翻译残留与语法修复

### Task 1: 批量修复中文翻译残留 `。.`

**Files:**
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

使用 Python 脚本一键修复所有 `。.` → `。`。已确认击穿范围内 5 处，全局可能有更多。

- [ ] **Step 1: 编写并运行修复脚本**

```python
import json, re

path = 'syntaxes/sdevice_command_docs.zh-CN.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for k, v in data.items():
    desc = v.get('description', '')
    if '。.' in desc:
        v['description'] = desc.replace('。.', '。')
        count += 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Fixed {count} entries')
```

- [ ] **Step 2: 验证修复结果**

```bash
python -c "import json; d=json.load(open('syntaxes/sdevice_command_docs.zh-CN.json','r',encoding='utf-8')); print(sum(1 for v in d.values() if '。.' in v.get('description','')))"
```

Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "fix: 修复 sdevice_command_docs.zh-CN.json 全部 。. 翻译残留"
```

---

### Task 2: 修复英文 GradQuasiFermi example 多余括号

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`

- [ ] **Step 1: 修复 example**

将 `GradQuasiFermi` 条目的 `example` 从：
```
Physics {\n  Recombination (Avalanche GradQuasiFermi))\n}
```
改为：
```
Physics {\n  Recombination (Avalanche (GradQuasiFermi))\n}
```
注意：原问题有两个错误——多余 `)` 且缺少 `(` 包裹 `GradQuasiFermi`。正确语法应为 `Avalanche (GradQuasiFermi)` 即 `Recombination(Avalanche(GradQuasiFermi))`。

- [ ] **Step 2: 同步修复中文文档**

中文文档 `sdevice_command_docs.zh-CN.json` 的 `GradQuasiFermi` example 同样需检查是否一致。

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "fix: 修复 GradQuasiFermi example 括号语法错误"
```

---

### Task 3: 修复中文 hSHEAvalancheGeneration 翻译错误

**Files:**
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

- [ ] **Step 1: 修复 description 中 "孔" → "空穴"**

在 `hSHEAvalancheGeneration` 条目中，将 description 中的"孔"替换为"空穴"。

- [ ] **Step 2: 全局扫描其他 "孔" 误译**

```bash
python -c "
import json
d=json.load(open('syntaxes/sdevice_command_docs.zh-CN.json','r',encoding='utf-8'))
for k,v in d.items():
    desc=v.get('description','')
    if '孔雪崩' in desc or '孔对' in desc or '孔的' in desc or '孔碰撞' in desc:
        print(f'{k}: {desc[:80]}')
"
```

检查是否有其他条目也存在同样的"孔"误译。

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "fix: 修复 hSHEAvalancheGeneration 等条目中 "孔" → "空穴" 翻译错误"
```

---

### Task 4: 重写 AvalPostProcessing 描述（中英文均晦涩）

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `AvalPostProcessing`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `AvalPostProcessing`

当前问题：英文原文 "prevents impact ionization-generated carriers from being included self-consistently in the device equations" 表述晦涩。中文翻译"阻止碰撞电离产生的载流子自洽地包含在器件方程中"同样是直译，读不懂。

实际含义：**关闭雪崩产生的载流子对泊松/连续性方程的反馈**，即只计算电离积分（用于近似击穿分析），不让产生率反作用到载流子方程中。好处是收敛更快。

- [ ] **Step 1: 重写英文 description**

改为更直白的表述，例如：
> Disables the feedback of avalanche-generated carriers into the Poisson and continuity equations. The impact ionization generation rate is still computed (for ionization integral calculation), but the generated carriers do not affect the solution. This yields approximate breakdown analysis with faster convergence and fewer convergence issues.

- [ ] **Step 2: 重写中文 description**

> 关闭雪崩产生的载流子对泊松方程和连续性方程的反馈。碰撞电离产生率仍然会被计算（用于电离积分），但产生的载流子不会影响求解结果。这样可以获得近似击穿分析，收敛更快、问题更少。

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 重写 AvalPostProcessing 描述，使含义更直白易懂"
```

---

## Phase 2：内容补充（按优先级）

> 以下 Task 需要查阅 Sentaurus SDEVICE 官方手册获取物理模型详情。
> 每个条目：先改英文 → 再改中文 → commit。

### Task 5 [P0]: 补充 eAvalanche / hAvalanche 文档

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `eAvalanche` 和 `hAvalanche`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `eAvalanche` 和 `hAvalanche`

当前问题：这两个是雪崩仿真的核心 Physics 条目，但 description 仅 2-3 句概括，无 parameters、无 example。

- [ ] **Step 1: 查阅 SDEVICE 手册中 eAvalanche/hAvalanche 的完整文档**

搜索手册中 `eAvalanche` 关键词，获取：
- 完整语法签名
- 支持的模型列表（van Overstraeten-de Man, Chynoweth, Selberherr）
- 可调参数（如系数 a_n, b_n 等）
- 与主 Avalanche 条目的关系说明

- [ ] **Step 2: 重写英文 eAvalanche**

补充 `parameters` 字段（包含可用模型和系数参数），补充 `example` 字段，丰富 `description`。

- [ ] **Step 3: 重写英文 hAvalanche**

与 eAvalanche 对称，参数改为空穴系数（a_p, b_p）。

- [ ] **Step 4: 翻译为中文**

保持与英文条目一致。

- [ ] **Step 5: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 eAvalanche/hAvalanche 核心条目文档（参数、示例、模型说明）"
```

---

### Task 6 [P0]: 新增 Hatakeyama 条目

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

当前问题：`Hatakeyama` 仅作为 `Avalanche` 的参数名出现，无独立文档条目。

- [ ] **Step 1: 查阅 SDEVICE 手册中 Hatakeyama 雪崩模型**

获取完整模型描述、适用材料（SiC 和 4H-SiC）、默认参数值。

- [ ] **Step 2: 在英文 JSON 中新增 Hatakeyama 条目**

在 `hAvalanche` 条目之后（按字母序），插入完整的 Hatakeyama 条目，包含 section、signature、description、parameters（如有）、keywords、example。

- [ ] **Step 3: 在中文 JSON 中同步新增**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "feat: 新增 Hatakeyama 雪崩模型独立文档条目"
```

---

### Task 7 [P1]: 补充 Lackner 模型文档

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `Lackner`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `Lackner`

当前问题：仅一句话"选择 Lackner 雪崩产生模型"，无模型细节。

- [ ] **Step 1: 查阅手册 Lackner 模型的物理公式和适用场景**

- [ ] **Step 2: 重写英文 description**

补充：Lackner 模型的物理背景、与 vanOverstraeten 的区别、适用材料、可配合的选项（如 BandgapDependence）。

- [ ] **Step 3: 翻译为中文**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 Lackner 雪崩模型文档（物理背景、适用场景）"
```

---

### Task 8 [P1]: 补充 UniBo2 模型文档

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `UniBo2`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `UniBo2`

当前问题：仅一句话，缺少与 UniBo 的差异说明。

- [ ] **Step 1: 查阅手册 UniBo vs UniBo2 的差异**

获取 UniBo2 的改进点（精细参数化）、新增参数、适用场景变化。

- [ ] **Step 2: 重写英文 description**

- [ ] **Step 3: 翻译为中文**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 UniBo2 碰撞电离模型文档（与 UniBo 的差异说明）"
```

---

### Task 9 [P1]: 补充 AvaHomotopy 文档和示例

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `AvaHomotopy`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `AvaHomotopy`

当前问题：description 说明了"同伦延拓方法"但缺少适用条件和 example。

- [ ] **Step 1: 查阅手册 AvaHomotopy 详细用法**

获取：同伦延拓的具体步骤、何时使用（高电场雪崩仿真的收敛困难）、与其他 Math 选项的配合。

- [ ] **Step 2: 重写英文并补充 example**

- [ ] **Step 3: 翻译为中文**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 AvaHomotopy 文档和示例（同伦延拓适用条件）"
```

---

### Task 10 [P2]: 补充 BandgapDependence 物理说明

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `BandgapDependence`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `BandgapDependence`

当前问题：说明"使雪崩依赖带隙"但缺少物理公式和影响说明。

- [ ] **Step 1: 查阅手册 BandgapDependence 对电离系数的修正公式**

- [ ] **Step 2: 重写英文 description**

补充：带隙依赖如何修正电离系数、对击穿电压预测的影响、适用材料（窄带隙/宽带隙）。

- [ ] **Step 3: 翻译为中文**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 BandgapDependence 物理模型说明"
```

---

### Task 11 [P2]: 对齐 e/h 变体描述详细度

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

当前问题：以下 e/h 变体对的 description 详细度严重不对称：
- `eBreakdownProbability`（优秀）vs `hBreakdownProbability`（简略）
- `eAlphaAvalanche` vs `hAlphaAvalanche`
- `eSHEAvalancheGeneration` vs `hSHEAvalancheGeneration`

- [ ] **Step 1: 将 h 变体的 description 提升到与对应 e 变体同等详细度**

对于每对变体，以 e 变体为模板，将 h 变体的 description 改为对称结构（替换 electron→hole、e→h 等），确保包含相同的控制语句、配合条件、单位说明。

- [ ] **Step 2: 翻译为中文**

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 对齐击穿相关 e/h 变体描述详细度"
```

---

### Task 12 [P2]: 补充 Okuto 参数默认值和单位

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json` — `Okuto`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json` — `Okuto`

当前问题：4 个参数（a, b, c, d）有名称但缺少默认值和单位。

- [ ] **Step 1: 查阅手册 Okuto 模型参数的默认值和物理单位**

- [ ] **Step 2: 更新英文 parameters 字段**

为每个参数补充 `desc` 中的默认值、物理含义、单位。

- [ ] **Step 3: 翻译为中文**

- [ ] **Step 4: Commit**

```bash
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 补充 Okuto 模型参数默认值和单位"
```

---

### Task 13: 最终验证与提交

- [ ] **Step 1: 运行验证脚本**

确认所有修复和补充生效：
```bash
python -c "
import json
# 检查无翻译残留
d=json.load(open('syntaxes/sdevice_command_docs.zh-CN.json','r',encoding='utf-8'))
assert sum(1 for v in d.values() if '。.' in v.get('description','')) == 0
# 检查核心条目有 example
for k in ['eAvalanche','hAvalanche','Hatakeyama','AvaHomotopy']:
    assert k in d, f'{k} missing'
    assert d[k].get('example','').strip(), f'{k} has no example'
    assert 'parameters' in d[k], f'{k} missing parameters'
print('All checks passed')
"
```

- [ ] **Step 2: 检查 JSON 格式正确性**

```bash
python -c "import json; json.load(open('syntaxes/sdevice_command_docs.json','r',encoding='utf-8')); json.load(open('syntaxes/sdevice_command_docs.zh-CN.json','r',encoding='utf-8')); print('JSON valid')"
```

- [ ] **Step 3: 最终合并提交（如有零散未提交的修改）**
