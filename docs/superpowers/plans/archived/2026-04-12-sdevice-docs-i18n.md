# sdevice 命令文档中文本地化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 sdevice_command_docs.json 的 341 条关键词创建中文翻译文件 `sdevice_command_docs.zh-CN.json`，并补齐 extension.js 的 i18n 标签。

**Architecture:** 创建术语映射表 `docs/sdevice-glossary.json` 统一翻译风格，分批并发翻译后合并为最终 JSON 文件。extension.js 仅需新增 2 个 i18n 标签字段。

**Tech Stack:** Python（术语提取/合并/校验）、Claude 子代理（批量翻译）、JavaScript（extension.js 微调）

**Spec:** `docs/superpowers/specs/2026-04-12-sdevice-docs-i18n-design.md`

---

### Task 1: 提取术语并创建术语映射表

**Files:**
- Create: `docs/sdevice-glossary.json`

- [ ] **Step 1: 扫描全部 341 条 description 提取半导体物理术语**

运行 Python 脚本，从 `syntaxes/sdevice_command_docs.json` 的所有 description 和 parameters[].desc 中提取专业术语。同时参考 `syntaxes/sde_function_docs.zh-CN.json` 中已有的翻译风格。

提取重点类别：
- 载流子相关：electron, hole, carrier, mobility, diffusion, drift, velocity
- 复合机制：SRH, Auger, radiative, direct, tunneling
- 能带/掺杂：bandgap, doping, concentration, Fermi, intrinsic
- 器件物理：junction, depletion, barrier, contact, Schottky, ohmic
- 数值方法：Newton, Coupled, Block, convergence, iteration
- 输出/绘图：plot, contour, vector, distribution, spectrum

- [ ] **Step 2: 整理为标准中文译名并输出 glossary**

输出格式（`docs/sdevice-glossary.json`）：

```json
{
  "_comment": "sdevice 命令文档术语映射表。通用术语直接中文，歧义/人名术语附英文。",
  "mobility": "迁移率",
  "recombination": "复合",
  "Auger": "俄歇(Auger)",
  "SRH": "SRH复合",
  "doping": "掺杂",
  "bandgap": "带隙",
  "carrier": "载流子",
  "depletion": "耗尽",
  "junction": "结",
  "contact": "接触",
  "Schottky": "肖特基(Schottky)",
  "ohmic": "欧姆(Ohmic)",
  "Newton": "牛顿(Newton)",
  "convergence": "收敛",
  "electrode": "电极",
  "voltage": "电压",
  "current": "电流",
  "charge": "电荷",
  "barrier": "势垒",
  "quasistationary": "准静态",
  "transient": "瞬态",
  "thermodynamic": "热力学",
  "lattice": "晶格",
  "phonon": "声子",
  "impact ionization": "碰撞电离",
  "tunneling": "隧穿",
  "Fermi": "费米(Fermi)",
  "intrinsic": "本征",
  "concentration": "浓度",
  "diffusion": "扩散",
  "drift": "漂移",
  "velocity": "速度",
  "electric field": "电场",
  "potential": "电势",
  "permittivity": "介电常数",
  "dielectric": "介电",
  "refractive index": "折射率",
  "absorption": "吸收",
  "emission": "发射",
  "spectrum": "光谱",
  "contour": "等值线",
  "vector": "矢量",
  "mesh": "网格",
  "boundary condition": "边界条件",
  "discretization": "离散化",
  "iteration": "迭代",
  "linear solver": "线性求解器"
}
```

> 注意：上述为初始版本，需根据实际 description 内容补充至 150~200 条。翻译子代理在翻译过程中发现新术语时应追加到映射表。

- [ ] **Step 3: 提交术语映射表**

```bash
git add docs/sdevice-glossary.json
git commit -m "docs: 添加 sdevice 半导体物理术语映射表"
```

---

### Task 2: 翻译风格确认批次

**Files:**
- Create: `syntaxes/sdevice_command_docs.zh-CN.sample.json`（临时文件，审校后删除）

- [ ] **Step 1: 选取 9 个代表性条目进行翻译**

选取以下条目覆盖不同 section、不同长度、有无 parameters：

| # | Key | Section | Desc长度 | 有参数 |
|---|-----|---------|---------|--------|
| 1 | IntensityDistribution | Physics | 142 | 否 |
| 2 | RayTraceBC | Physics | 257 | 是(6) |
| 3 | Physics | Physics | 226 | 是(6) |
| 4 | Math | Math | 191 | 是(6) |
| 5 | Solve | Solve | 206 | 是(6) |
| 6 | eSHEDistributionPlot | Plot | 165 | 是(1) |
| 7 | System | System | 192 | 否 |
| 8 | Electrode | Electrode | 171 | 是(6) |
| 9 | OpticalDevice | global | 137 | 是(5) |

- [ ] **Step 2: 子代理翻译这 9 个条目**

子代理 prompt 需包含：
1. 加载 `docs/sdevice-glossary.json` 作为术语参考
2. 加载 `syntaxes/sde_function_docs.zh-CN.json` 前 5 条作为风格参考
3. 翻译规则：
   - `description` 和 `parameters[].desc` 翻译为中文
   - `signature`、`example`、`keywords` 值、`section` 值**不翻译**
   - 通用术语用中文，歧义/人名术语附英文如"俄歇(Auger)"
   - 风格：简洁准确，与 sde_function_docs.zh-CN.json 一致

输出为临时 JSON 文件 `syntaxes/sdevice_command_docs.zh-CN.sample.json`，结构与原文件一致。

- [ ] **Step 3: 用户审校风格确认批次**

展示翻译结果给用户，确认：
- 术语使用是否准确
- 描述风格是否自然
- parameter desc 翻译是否恰当

根据用户反馈调整术语映射表和翻译风格。

- [ ] **Step 4: 根据反馈更新术语映射表（如需）**

- [ ] **Step 5: 删除临时 sample 文件**

```bash
rm syntaxes/sdevice_command_docs.zh-CN.sample.json
```

---

### Task 3: 批量翻译 Physics 部分（199 条）

**Files:**
- Create: `syntaxes/_batch_physics.json`（临时）

- [ ] **Step 1: 并发翻译 Physics section 的 199 条**

将 199 条分为 2 个子批次（~100 条/批），并发执行。每个子代理：

prompt 包含：
1. 术语映射表内容（直接嵌入，避免文件读取问题）
2. 风格确认批次中 Physics 相关条目的翻译结果作为风格样本
3. 完整的翻译规则（同 Task 2）
4. 本批次的 entry key 列表（从 `sdevice_command_docs.json` 中读取对应条目）

每个子代理输出一个 JSON 对象，key 为关键词名，value 为翻译后的条目。

子批次划分：
- **Physics-A**（前 100 条，按 JSON key 顺序）
- **Physics-B**（后 99 条）

- [ ] **Step 2: 合并两个子批次为 `syntaxes/_batch_physics.json`**

```bash
python3 -c "
import json
a = json.load(open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_physics_a.json', encoding='utf-8'))
b = json.load(open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_physics_b.json', encoding='utf-8'))
merged = {**a, **b}
json.dump(merged, open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_physics.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'Merged: {len(merged)} entries')
"
```

- [ ] **Step 3: 清理临时子批次文件**

```bash
rm syntaxes/_batch_physics_a.json syntaxes/_batch_physics_b.json
```

---

### Task 4: 批量翻译 Math + Solve 部分（104 条）

**Files:**
- Create: `syntaxes/_batch_math_solve.json`（临时）

- [ ] **Step 1: 并发翻译 Math(62) + Solve(42) = 104 条**

分为 2 个子批次：
- **Math**：62 条
- **Solve**：42 条

每个子代理使用与 Task 3 相同的 prompt 模板。

- [ ] **Step 2: 合并为 `syntaxes/_batch_math_solve.json`**

```bash
python3 -c "
import json
m = json.load(open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_math.json', encoding='utf-8'))
s = json.load(open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_solve.json', encoding='utf-8'))
merged = {**m, **s}
json.dump(merged, open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/_batch_math_solve.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'Merged: {len(merged)} entries')
"
```

- [ ] **Step 3: 清理临时文件**

```bash
rm syntaxes/_batch_math.json syntaxes/_batch_solve.json
```

---

### Task 5: 批量翻译 Plot + System + global + Electrode + File（38 条）

**Files:**
- Create: `syntaxes/_batch_others.json`（临时）

- [ ] **Step 1: 翻译剩余 38 条**

一次性翻译（38 条量小，无需拆分）：
- Plot: 20 条
- System: 10 条
- global: 6 条
- Electrode: 1 条
- File: 1 条

- [ ] **Step 2: 输出为 `syntaxes/_batch_others.json`**

---

### Task 6: 合并所有批次并校验

**Files:**
- Create: `syntaxes/sdevice_command_docs.zh-CN.json`
- Delete: `syntaxes/_batch_*.json`（所有临时批次文件）

- [ ] **Step 1: 合并全部批次**

```bash
python3 -c "
import json

# Load original for structure reference
with open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/sdevice_command_docs.json', 'r', encoding='utf-8') as f:
    original = json.load(f)

# Load all batches
batches = ['_batch_physics', '_batch_math_solve', '_batch_others']
merged = {}
for batch in batches:
    path = f'D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/{batch}.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    merged.update(data)

# Validate
print(f'Original entries: {len(original)}')
print(f'Translated entries: {len(merged)}')

# Check key consistency
missing = set(original.keys()) - set(merged.keys())
extra = set(merged.keys()) - set(original.keys())
if missing:
    print(f'ERROR: Missing keys: {missing}')
if extra:
    print(f'ERROR: Extra keys: {extra}')
if not missing and not extra:
    print('OK: Keys match perfectly')

# Check field structure
field_errors = []
for key in original:
    if key not in merged:
        continue
    orig_fields = set(original[key].keys())
    trans_fields = set(merged[key].keys())
    if orig_fields != trans_fields:
        field_errors.append((key, orig_fields - trans_fields, trans_fields - orig_fields))
if field_errors:
    print(f'ERROR: {len(field_errors)} entries have field mismatches')
    for k, missing_f, extra_f in field_errors[:5]:
        print(f'  {k}: missing={missing_f}, extra={extra_f}')
else:
    print('OK: All field structures match')

# Check untranslated fields are preserved
preserve_fields = ['signature', 'example', 'keywords', 'section']
for key in list(original.keys())[:5]:
    for field in preserve_fields:
        if original[key].get(field) != merged[key].get(field):
            print(f'ERROR: {key}.{field} was modified!')
            break

# Write final file
out_path = 'D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/sdevice_command_docs.zh-CN.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
print(f'Written to: {out_path}')
"
```

Expected output:
```
Original entries: 341
Translated entries: 341
OK: Keys match perfectly
OK: All field structures match
Written to: syntaxes/sdevice_command_docs.zh-CN.json
```

- [ ] **Step 2: 清理所有临时批次文件**

```bash
rm syntaxes/_batch_physics.json syntaxes/_batch_math_solve.json syntaxes/_batch_others.json
```

- [ ] **Step 3: 抽检翻译质量**

随机抽取 5 条，对比英文原文和中文翻译，检查：
- 术语是否与 glossary 一致
- 描述是否准确自然
- keywords 值是否未被翻译

---

### Task 7: 修改 extension.js 补齐 i18n 标签

**Files:**
- Modify: `src/extension.js:43-47` (DOC_LABELS 定义)
- Modify: `src/extension.js:55-57` (Section 标签使用)
- Modify: `src/extension.js:73-74` (Keywords 标签使用)

- [ ] **Step 1: 在 DOC_LABELS 中新增 section 和 keywords 字段**

修改 `src/extension.js` 第 43-47 行：

```javascript
/** Labels used in formatted documentation (i18n). */
const DOC_LABELS = {
    parameters: '**Parameters:**',
    example: '**Example:**',
    section: 'Section:',
    keywords: 'Keywords:',
};
```

- [ ] **Step 2: 在中文 locale 切换处补齐新标签**

修改 `src/extension.js` 第 139-144 行（`if (useZh)` 块）：

```javascript
    // Detect locale for i18n
    const useZh = vscode.env.language.startsWith('zh');
    if (useZh) {
        DOC_LABELS.parameters = '**参数：**';
        DOC_LABELS.example = '**示例：**';
        DOC_LABELS.section = '节：';
        DOC_LABELS.keywords = '关键词：';
    }
```

- [ ] **Step 3: 在 formatDoc() 中使用 DOC_LABELS 替换硬编码**

修改第 55-57 行：

```javascript
    if (doc.section) {
        lines.push('');
        lines.push(`*${DOC_LABELS.section} ${doc.section}*`);
    }
```

修改第 73-74 行（Keywords 行）：

```javascript
    if (doc.keywords && doc.keywords.length) {
        lines.push('');
        lines.push(`*${DOC_LABELS.keywords} ${doc.keywords.join(', ')}*`);
    }
```

- [ ] **Step 4: 提交 extension.js 修改**

```bash
git add src/extension.js
git commit -m "feat: 补齐 formatDoc 中 Section/Keywords 的 i18n 标签"
```

---

### Task 8: 测试与最终提交

- [ ] **Step 1: 验证 JSON 格式**

```bash
python3 -c "
import json
with open('D:/CODE/Project/sentaurus-syntax-highlight/syntaxes/sdevice_command_docs.zh-CN.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f'Valid JSON: {len(data)} entries')
# Quick content check - all descriptions should contain Chinese chars
cn_count = sum(1 for v in data.values() if any('\u4e00' <= c <= '\u9fff' for c in v.get('description', '')))
print(f'Entries with Chinese in description: {cn_count}/{len(data)}')
"
```

Expected: `Valid JSON: 341 entries` / `Entries with Chinese in description: 341/341`

- [ ] **Step 2: 提交中文文档文件**

```bash
git add syntaxes/sdevice_command_docs.zh-CN.json docs/sdevice-glossary.json
git commit -m "feat: 添加 sdevice 命令文档中文翻译（341 条关键词全覆盖）"
```

- [ ] **Step 3: 在 Extension Development Host 中测试**

使用 VSCode 的 F5 启动 Extension Development Host：
1. 打开一个 `*_des.cmd` 文件
2. 将鼠标悬停在 `Physics`、`Solve`、`Electrode` 等关键词上
3. 验证悬停提示显示中文描述
4. 触发自动补全，验证文档也显示中文
5. 确认 `signature`、`example`、`keywords` 值保持英文
6. 确认 "节：Physics" 和 "关键词：..." 标签正确显示
