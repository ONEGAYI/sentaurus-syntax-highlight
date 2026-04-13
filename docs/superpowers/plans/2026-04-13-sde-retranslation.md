# SDE 函数文档重翻译 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 SDE 函数文档中文翻译质量——扩展术语表、改进翻译脚本、批量重翻译并通过子代理 review 闭环保证质量。

**Architecture:** 改进现有 `translate_docs.py` 脚本，新增 `--glossary` 参数实现按 batch 智能术语注入；将 `sdevice-glossary.json` 重命名并扩展为通用术语表；翻译完成后用子代理分组 review，发现问题调整 prompt 重翻。

**Tech Stack:** Python 3, OpenAI 兼容 API (DeepSeek), JSON

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `docs/glossary.json` | 重命名 + 扩展 | 通用术语映射表（全工具链复用） |
| `scripts/translate_docs.py` | 修改 | 新增 `--glossary` 参数、智能术语注入、优化 system prompt |
| `scripts/fix_examples.py` | 新建（临时） | 从英文原文覆盖不一致的 example 字段 |
| `syntaxes/sde_function_docs.zh-CN.json` | 覆盖 | 重翻译的输出文件 |

---

### Task 1: 扩展术语表

**Files:**
- Rename: `docs/sdevice-glossary.json` → `docs/glossary.json`
- Modify: `docs/glossary.json`（更新 `_comment` + 补充 SDE 术语）

- [ ] **Step 1: 重命名术语表文件**

```bash
git mv docs/sdevice-glossary.json docs/glossary.json
```

- [ ] **Step 2: 更新 `_comment` 字段**

将 `_comment` 改为：

```json
"_comment": "Sentaurus TCAD 工具链通用术语映射表。通用术语直接中文，歧义/人名术语附英文。单位/变量名/代码标识符不翻译。按领域分组，用 _section_ 前缀标记分类标题行。适用于 sde、sdevice、sprocess、emw、inspect 等工具的文档翻译。"
```

- [ ] **Step 3: 补充 SDE 特有术语**

在术语表末尾（`_section_geometry` 之前）新增以下分组和条目：

```json
"_section_sde_geometry": "SDE 几何操作",
"position": "位置",
"gvector": "向量",
"region": "区域",
"body": "体",
"face": "面",
"edge": "边",
"point": "点",
"vertex": "顶点",
"plane": "平面",
"interface": "界面",
"contact window": "接触窗口",
"refinement window": "细化窗口",

"_section_sde_refinement": "SDE 网格细化",
"refinement": "细化",
"refinement definition": "细化定义",
"refinement function": "细化函数",
"MaxLenInt": "最大界面长度",
"MaxInterval": "最大间距",
"MaxGradient": "最大梯度",
"MaxTransDiff": "最大过渡差",
"general": "通用(细化类型)",
"local": "局部(细化类型)",
"doping dependent": "掺杂依赖(细化类型)",

"_section_sde_boolean": "SDE 布尔操作",
"union": "并集",
"intersection": "交集",
"subtraction": "差集",
"complement": "补集",

"_section_sde_mesh": "SDE 网格",
"submesh": "子网格",
"global mesh": "全局网格",
"meshing": "网格划分",
"triangulation": "三角剖分",
"tessellation": "镶嵌/网格化",

"_section_sde_profile": "SDE 掺杂剖面",
"analytical profile": "解析剖面",
"constant profile": "均匀剖面",
"refwindow": "参考窗口",
"profile placement": "剖面放置",

"_section_sde_scheme": "SDE Scheme 相关",
"define": "定义",
"lambda": "匿名函数(lambda)",
"quasiquote": "准引用(quasiquote)",
"unquote": "反引用(unquote)",
"let": "局部绑定(let)",
"begin": "顺序执行(begin)",
"if": "条件判断(if)",
"cond": "多分支条件(cond)",
"set!": "赋值(set!)",
"procedure": "过程/函数",
"expression": "表达式",
"binding": "绑定",
"identifier": "标识符",
"literal": "字面量",
"string": "字符串",
"number": "数值",
"boolean": "布尔值",
"list": "列表",
"pair": "序对(pair)"
```

- [ ] **Step 4: 提交**

```bash
git add docs/glossary.json
git commit -m "refactor: 将 sdevice-glossary.json 扩展为通用术语表 glossary.json，补充 SDE 特有术语"
```

---

### Task 2: 改进翻译脚本

**Files:**
- Modify: `scripts/translate_docs.py`

- [ ] **Step 1: 添加 `--glossary` 参数**

在 `parse_args()` 函数中，`--prompt-file` 参数后面添加：

```python
parser.add_argument("--glossary", default=None,
                    help="术语表 JSON 文件路径，按 batch 动态注入匹配术语")
```

- [ ] **Step 2: 添加术语表加载函数**

在 `load_custom_prompt()` 函数后面添加：

```python
def load_glossary(glossary_file):
    """加载术语表 JSON，返回 {term: translation} 字典（排除 _ 前缀条目）。"""
    if not glossary_file or not os.path.exists(glossary_file):
        return None
    with open(glossary_file, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return {k: v for k, v in raw.items() if not k.startswith("_")}
```

- [ ] **Step 3: 添加智能术语匹配函数**

在 `load_glossary()` 后面添加：

```python
def find_matching_terms(text, glossary):
    """在给定文本中查找术语表匹配项。返回匹配的 {term: translation} 子集。"""
    if not glossary or not text:
        return {}
    text_lower = text.lower()
    matched = {}
    for term, translation in glossary.items():
        if term.lower() in text_lower:
            matched[term] = translation
    return matched
```

- [ ] **Step 4: 添加批量术语注入函数**

在 `find_matching_terms()` 后面添加：

```python
def build_glossary_section(batch_items, glossary, fields):
    """从 batch 的英文文本中提取匹配术语，格式化为 prompt 片段。"""
    if not glossary:
        return ""

    # 收集该 batch 所有英文文本
    all_text = []
    translate_fields = [f.strip() for f in fields.split(",")]
    for _, source_entry in batch_items:
        if "description" in translate_fields:
            all_text.append(source_entry.get("description", ""))
        if "parameters.desc" in translate_fields:
            for p in source_entry.get("parameters", []):
                all_text.append(p.get("desc", ""))

    combined = " ".join(all_text)

    # 匹配术语
    matched = find_matching_terms(combined, glossary)
    if not matched:
        return ""

    lines = ["## 术语映射表（必须严格遵守）"]
    for term, translation in sorted(matched.items()):
        lines.append(f"- {term} → {translation}")
    return "\n".join(lines)
```

- [ ] **Step 5: 优化 DEFAULT_SYSTEM_PROMPT**

将 `DEFAULT_SYSTEM_PROMPT` 替换为：

```python
DEFAULT_SYSTEM_PROMPT = """你是一个专业的技术文档翻译专家，专注于半导体 TCAD 工具链领域（Synopsys Sentaurus）。

## 翻译规则
1. 将英文技术文档翻译为自然流畅的中文
2. 类型标注保留英文：POSITION、REAL、STRING、DATEX、BOOLEAN、INTEGER、LIST
3. 枚举值保留原文（如 Replace/NoReplace/LocalReplace）
4. 代码语法保留原样（如 `(position x y z)`、`"Silicon"`）
5. 函数名和参数名保留英文
6. 变量名和代码标识符保留英文
7. 信息量与英文原文完全一致，不增不减
8. 严格遵循下方的术语映射表

## 翻译风格指南
### description 字段
- 简短概括，一句话说明函数用途
- 使用动词开头，如"向...添加..."、"创建..."、"设置..."

### parameters.desc 字段
- 当描述中包含代码语法占位符时（如 "MaxLenInt" mat-reg value），保持以下结构：
  [代码语法] — [中文解释]
- 不要倒置语序为"用于[解释]的 [代码]"
- 可以使用换行或列表提高可读性
- 对于有多种模式的参数，每种模式用换行分隔
"""
```

- [ ] **Step 6: 修改 `translate_batch()` 函数签名和逻辑**

将 `translate_batch()` 的签名从：

```python
def translate_batch(client, batch_items, fields, model, system_prompt):
```

改为：

```python
def translate_batch(client, batch_items, fields, model, system_prompt, glossary=None):
```

在函数体中，`user_message = build_batch_message(...)` 之后、`client.chat.completions.create()` 调用之前，插入术语注入逻辑：

```python
    # 智能术语注入：仅注入当前 batch 匹配的术语
    effective_prompt = system_prompt
    if glossary:
        glossary_section = build_glossary_section(batch_items, glossary, fields)
        if glossary_section:
            effective_prompt = system_prompt + "\n\n" + glossary_section
```

然后将 `client.chat.completions.create()` 中的 `system_prompt` 替换为 `effective_prompt`。

- [ ] **Step 7: 修改 `main()` 函数加载术语表**

在 `main()` 函数中，`client = OpenAI(...)` 这一行之后，添加术语表加载：

```python
    # 加载术语表
    glossary = load_glossary(args.glossary)
    if glossary:
        log.info(f"已加载术语表: {args.glossary} ({len(glossary)} 条术语)")
```

- [ ] **Step 8: 修改 `main()` 中调用 `translate_batch()` 的地方**

将第 321 行的：

```python
        results = translate_batch(client, batch_items, args.fields, args.model, system_prompt)
```

改为：

```python
        results = translate_batch(client, batch_items, args.fields, args.model, system_prompt, glossary=glossary)
```

- [ ] **Step 9: 提交**

```bash
git add scripts/translate_docs.py
git commit -m "feat(translate): 添加 --glossary 参数，按 batch 智能注入匹配术语"
```

---

### Task 3: 修复 example 字段

**Files:**
- Create: `scripts/fix_examples.py`

- [ ] **Step 1: 编写临时修复脚本**

```python
#!/usr/bin/env python3
"""从英文原文修复 zh-CN 文件中不一致的 example 字段。"""
import json
import sys

def main():
    en_path = sys.argv[1] if len(sys.argv) > 1 else "syntaxes/sde_function_docs.json"
    zh_path = sys.argv[2] if len(sys.argv) > 2 else "syntaxes/sde_function_docs.zh-CN.json"

    with open(en_path, "r", encoding="utf-8") as f:
        en = json.load(f)
    with open(zh_path, "r", encoding="utf-8") as f:
        zh = json.load(f)

    fixed = 0
    for name, en_entry in en.items():
        en_ex = en_entry.get("example", "")
        if not en_ex:
            continue
        if name not in zh:
            continue
        zh_ex = zh[name].get("example", "")
        if en_ex != zh_ex:
            zh[name]["example"] = en_ex
            fixed += 1
            print(f"  修复: {name}")

    with open(zh_path, "w", encoding="utf-8") as f:
        json.dump(zh, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\n共修复 {fixed} 个 example 字段")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 运行修复脚本**

```bash
python scripts/fix_examples.py
```

Expected: `共修复 44 个 example 字段`

- [ ] **Step 3: 验证修复结果**

```bash
python -c "
import json
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('syntaxes/sde_function_docs.zh-CN.json', 'r', encoding='utf-8') as f:
    zh = json.load(f)
diff = sum(1 for n, e in en.items() if e.get('example') and e['example'] != zh.get(n, {}).get('example', ''))
print(f'剩余不一致: {diff}')
"
```

Expected: `剩余不一致: 0`

- [ ] **Step 4: 提交**

```bash
git add syntaxes/sde_function_docs.zh-CN.json scripts/fix_examples.py
git commit -m "fix: 修复 SDE 函数文档中 44 个与英文原文不一致的 example 字段"
```

---

### Task 4: 执行批量翻译

**Files:**
- Overwrite: `syntaxes/sde_function_docs.zh-CN.json`

- [ ] **Step 1: 清空中文翻译（让脚本视为全部需要翻译）**

先备份现有翻译，然后从英文复制作为新的 target（让 `get_changed_entries` 认为所有条目都需要翻译）：

```bash
cp syntaxes/sde_function_docs.zh-CN.json syntaxes/sde_function_docs.zh-CN.json.bak
cp syntaxes/sde_function_docs.json syntaxes/sde_function_docs.zh-CN.json
```

- [ ] **Step 2: 恢复 example 字段**

```bash
python scripts/fix_examples.py
```

注意：此时 `sde_function_docs.zh-CN.json` 的 description 和 parameters.desc 是英文原文，example 已从英文覆盖。`get_changed_entries` 会认为所有条目都需要翻译（因为 target 的 description/params.desc 现在与 source 相同，实际上不会检测到变更）。

**需要调整策略**：改用 `--force` 模式。在 `get_changed_entries` 函数之前，我们直接将 source 的英文文本作为"需要翻译的输入"，而 target 从空开始。

实际上最简单的方式是：直接创建一个空的 zh-CN 文件，只保留 example 字段。

- [ ] **Step 3: 创建干净的翻译输入**

```bash
python -c "
import json
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
zh = {}
for name, entry in en.items():
    zh[name] = {'example': entry.get('example', '')}
with open('syntaxes/sde_function_docs.zh-CN.json', 'w', encoding='utf-8') as f:
    json.dump(zh, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'已创建 {len(zh)} 个空条目（仅保留 example）')
"
```

- [ ] **Step 4: 执行翻译**

```bash
python scripts/translate_docs.py \
    --source syntaxes/sde_function_docs.json \
    --target syntaxes/sde_function_docs.zh-CN.json \
    --glossary docs/glossary.json \
    --fields description,parameters.desc \
    --batch-size 10 \
    --progress .translate-progress-sde.txt \
    --log .translate-sde.log
```

Expected: 405 个函数分 41 批翻译完成。

- [ ] **Step 5: 验证翻译完整性**

```bash
python -c "
import json
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('syntaxes/sde_function_docs.zh-CN.json', 'r', encoding='utf-8') as f:
    zh = json.load(f)
missing_desc = [n for n in en if not zh.get(n, {}).get('description', '')]
missing_params = []
for n, e in en.items():
    for i, p in enumerate(e.get('parameters', [])):
        if not zh.get(n, {}).get('parameters', [{}])[i].get('desc', ''):
            missing_params.append(f'{n}:{p[\"name\"]}')
print(f'缺失 description: {len(missing_desc)}')
print(f'缺失 params.desc: {len(missing_params)}')
if missing_desc: print(missing_desc[:5])
if missing_params: print(missing_params[:5])
"
```

Expected: 全部为 0。

- [ ] **Step 6: 提交初始翻译结果**

```bash
git add syntaxes/sde_function_docs.zh-CN.json
git commit -m "feat(i18n): 使用改进的翻译脚本重新翻译 SDE 函数文档"
```

---

### Task 5: 子代理 Review 闭环

**Files:**
- Overwrite: `syntaxes/sde_function_docs.zh-CN.json`（review 后可能局部重翻）

**分组（按函数名前缀）：**

| 组 | 前缀 | 函数数 |
|----|------|--------|
| 1 | `sde:` | 140 |
| 2 | `sdegeo:` | 124 |
| 3 | `sdedr:` | 63 |
| 4 | `sdeicwb:` | 35 |
| 5 | `sdepe:` | 18 |
| 6 | 其余 (`sdeio:` `sdesnmesh:` `sdeepi:` `sdesp:`) | 25 |

- [ ] **Step 1: 对每组启动子代理 review**

对每个组，启动子代理执行以下检查：

```
对照英文原文 (sde_function_docs.json) 和术语表 (docs/glossary.json)，
检查中文翻译 (sde_function_docs.zh-CN.json) 中 [前缀] 开头的函数。

检查维度：
1. 术语一致性：翻译是否使用了术语表中的标准译名（如 mesh→网格、refinement→细化）
2. 信息完整性：有无遗漏或增添原文没有的信息
3. 语序自然性：语法混合文本是否保持 [代码语法] — [中文解释] 的结构
4. 格式正确性：JSON 结构完整，字段无缺失

输出格式：
- 良好的条目：简要列出或跳过
- 有问题的条目：列出函数名、具体问题描述、建议修改
```

- [ ] **Step 2: 汇总反馈，调整 prompt**

根据所有组的 review 结果：
- 如果问题集中在某类翻译风格（如语序倒置），在 system prompt 中强化该规则
- 如果是个别术语不一致，检查术语表是否缺少该术语

- [ ] **Step 3: 仅对有问题的函数重翻**

将问题函数名写入一个列表文件，然后：

```bash
# 方法：手动将问题函数的翻译清空，让脚本重新翻译
python -c "
import json
problem_funcs = ['func1', 'func2', ...]  # 从 review 结果填入
with open('syntaxes/sde_function_docs.zh-CN.json', 'r', encoding='utf-8') as f:
    zh = json.load(f)
with open('syntaxes/sde_function_docs.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
for name in problem_funcs:
    if name in zh and name in en:
        zh[name]['description'] = en[name].get('description', '')
        zh[name]['parameters'] = en[name].get('parameters', [])
print(f'已重置 {len(problem_funcs)} 个函数')
with open('syntaxes/sde_function_docs.zh-CN.json', 'w', encoding='utf-8') as f:
    json.dump(zh, f, ensure_ascii=False, indent=2)
    f.write('\n')
"
```

然后重新运行翻译脚本（断点续传会跳过已完成的）：

```bash
python scripts/translate_docs.py \
    --source syntaxes/sde_function_docs.json \
    --target syntaxes/sde_function_docs.zh-CN.json \
    --glossary docs/glossary.json \
    --fields description,parameters.desc \
    --batch-size 10 \
    --progress .translate-progress-sde.txt \
    --log .translate-sde-retry.log
```

- [ ] **Step 4: 必要时重复 review**

如果重翻后仍有问题，回到 Step 1 再次 review 问题函数。

- [ ] **Step 5: 最终提交**

```bash
git add syntaxes/sde_function_docs.zh-CN.json
git commit -m "feat(i18n): SDE 函数文档重翻译完成（含 review 质量闭环）"
```

---

### Task 6: 清理

- [ ] **Step 1: 删除临时文件**

```bash
rm -f syntaxes/sde_function_docs.zh-CN.json.bak
rm -f .translate-progress-sde.txt
rm -f .translate-sde.log
rm -f .translate-sde-retry.log
```

- [ ] **Step 2: 更新 CLAUDE.md 中对术语表的引用**

如果 CLAUDE.md 中提到了 `sdevice-glossary.json`，更新为 `glossary.json`。

- [ ] **Step 3: 提交清理**

```bash
git add -A
git commit -m "chore: 清理翻译临时文件，更新术语表引用"
```
