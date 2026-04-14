# SDE 函数文档中文参数描述增强 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 编写通用化翻译脚本 `scripts/translate_docs.py`，将 SDE 函数文档中文版的 405 个 description 和 871 个参数描述翻译为与英文增强版信息量一致的高质量中文。

**Architecture:** Python 脚本使用 `anthropic` SDK 调用 Claude API 进行翻译。脚本读取源 JSON（英文）和目标 JSON（中文），自动 diff 找出变更字段，仅对变更部分调用 API 翻译，支持断点续传。翻译粒度为每个函数一次 API 调用（包含 description + 全部 parameters）。

**Tech Stack:** Python 3.14, anthropic SDK, argparse, json

---

### Task 1: 安装依赖

**Files:**
- 无新文件

- [ ] **Step 1: 安装 anthropic SDK**

Run: `pip install anthropic`
Expected: Successfully installed anthropic-x.x.x

- [ ] **Step 2: 验证安装**

Run: `python3 -c "import anthropic; print(anthropic.__version__)"`
Expected: 输出版本号，无报错

---

### Task 2: 编写翻译脚本核心逻辑

**Files:**
- Create: `scripts/translate_docs.py`

- [ ] **Step 1: 创建脚本框架，实现 CLI 参数解析和文件读写**

创建 `scripts/translate_docs.py`，包含以下功能：

```python
#!/usr/bin/env python3
"""
通用化 JSON 文档翻译脚本。
将源 JSON 文档中指定的字段翻译为目标语言，写入目标 JSON 文件。
支持增量翻译（仅翻译变更字段）和断点续传。

用法：
    python scripts/translate_docs.py \
        --source syntaxes/sde_function_docs.json \
        --target syntaxes/sde_function_docs.zh-CN.json \
        --api-key YOUR_API_KEY
"""

import argparse
import json
import os
import sys
import time

def parse_args():
    parser = argparse.ArgumentParser(description="JSON 文档翻译脚本")
    parser.add_argument("--source", required=True, help="源 JSON 文件路径（英文原文）")
    parser.add_argument("--target", required=True, help="目标 JSON 文件路径（中文翻译）")
    parser.add_argument("--api-key", default=os.environ.get("ANTHROPIC_API_KEY", ""),
                        help="Anthropic API Key（也可通过 ANTHROPIC_API_KEY 环境变量设置）")
    parser.add_argument("--model", default="claude-sonnet-4-6", help="翻译模型（默认 claude-sonnet-4-6）")
    parser.add_argument("--progress", default=None, help="进度文件路径（用于断点续传）")
    parser.add_argument("--fields", default="description,parameters.desc",
                        help="需要翻译的字段路径，逗号分隔（默认 description,parameters.desc）")
    parser.add_argument("--dry-run", action="store_true", help="仅显示需要翻译的条目，不执行翻译")
    parser.add_argument("--prompt-file", default=None, help="自定义翻译提示词文件路径")
    return parser.parse_args()


def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_progress(progress_file):
    """加载进度文件，返回已完成的函数名集合。"""
    if progress_file and os.path.exists(progress_file):
        with open(progress_file, "r", encoding="utf-8") as f:
            return set(line.strip() for line in f if line.strip())
    return set()


def save_progress(progress_file, completed_funcs):
    """保存进度文件。"""
    if progress_file:
        with open(progress_file, "w", encoding="utf-8") as f:
            for func_name in sorted(completed_funcs):
                f.write(func_name + "\n")


def get_changed_entries(source_data, target_data, fields):
    """
    比对源和目标 JSON，找出需要翻译的条目。
    返回: list of (func_name, {field: old_value, ...}, {field: new_value, ...})
    """
    changed = []
    translate_fields = [f.strip() for f in fields.split(",")]

    for func_name, source_entry in source_data.items():
        target_entry = target_data.get(func_name, {})

        old_values = {}
        new_values = {}

        for field_path in translate_fields:
            if field_path == "description":
                old_val = target_entry.get("description", "")
                new_val = source_entry.get("description", "")
                if old_val != new_val:
                    old_values["description"] = old_val
                    new_values["description"] = new_val
            elif field_path == "parameters.desc":
                source_params = source_entry.get("parameters", [])
                target_params = target_entry.get("parameters", [])
                for i, sp in enumerate(source_params):
                    old_pdesc = target_params[i].get("desc", "") if i < len(target_params) else ""
                    new_pdesc = sp.get("desc", "")
                    if old_pdesc != new_pdesc:
                        old_values[f"param:{i}"] = old_pdesc
                        new_values[f"param:{i}"] = new_pdesc

        if new_values:
            changed.append((func_name, old_values, new_values))

    return changed
```

- [ ] **Step 2: 实现翻译 API 调用逻辑**

在 `scripts/translate_docs.py` 中添加翻译函数：

```python
import anthropic


DEFAULT_SYSTEM_PROMPT = """你是一个专业的技术文档翻译专家，专注于半导体 TCAD 工具链领域（Synopsys Sentaurus）。

翻译规则：
1. 将英文技术文档翻译为自然流畅的中文
2. 以下术语保留英文原文：POSITION、REAL、STRING、DATEX、BOOLEAN、INTEGER、LIST 等类型标注
3. 枚举值保留原文（如 Replace/NoReplace/LocalReplace）
4. 代码语法保留原样（如 `(position x y z)`、`"Silicon"`）
5. 函数名和参数名保留英文
6. 变量名和代码标识符保留英文
7. 翻译要求：信息量与英文原文完全一致，不增不减
8. 保持专业术语的准确性（如"体"对应 body、"面"对应 face、"区域"对应 region、"网格"对应 mesh）

输出格式：严格输出 JSON 对象，不要输出任何其他内容。
JSON 格式：
{
  "description": "翻译后的函数描述（如无变更则为 null）",
  "parameters": [
    {"name": "参数名", "desc": "翻译后的参数描述"},
    ...
  ]
}
"""


def load_custom_prompt(prompt_file):
    """加载自定义提示词文件。"""
    if prompt_file and os.path.exists(prompt_file):
        with open(prompt_file, "r", encoding="utf-8") as f:
            return f.read()
    return None


def translate_entry(client, func_name, source_entry, fields, model, system_prompt):
    """
    调用 Claude API 翻译一个函数条目。
    返回翻译后的字段字典。
    """
    # Build user message with source content
    parts = [f"函数名: {func_name}\n"]

    translate_fields = [f.strip() for f in fields.split(",")]

    if "description" in translate_fields:
        desc = source_entry.get("description", "")
        if desc:
            parts.append(f"函数描述:\n{desc}\n")

    if "parameters.desc" in translate_fields:
        params = source_entry.get("parameters", [])
        if params:
            parts.append("参数列表:")
            for p in params:
                parts.append(f'  - {p["name"]} (类型: {p.get("type", "")}): {p.get("desc", "")}')
            parts.append("")

    user_message = "\n".join(parts)

    try:
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        # Extract JSON from response
        text = response.content[0].text.strip()

        # Strip markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (``` markers)
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        result = json.loads(text)
        return result

    except json.JSONDecodeError as e:
        print(f"  [WARN] JSON 解析失败 ({func_name}): {e}")
        return None
    except Exception as e:
        print(f"  [ERROR] API 调用失败 ({func_name}): {e}")
        return None
```

- [ ] **Step 3: 实现主流程和结果合并逻辑**

在 `scripts/translate_docs.py` 中添加主函数：

```python
def apply_translation(target_data, func_name, source_entry, translation_result, fields):
    """将翻译结果应用到目标数据。"""
    if translation_result is None:
        return

    entry = target_data.get(func_name, {})
    translate_fields = [f.strip() for f in fields.split(",")]

    if "description" in translate_fields and translation_result.get("description"):
        entry["description"] = translation_result["description"]

    if "parameters.desc" in translate_fields:
        translated_params = translation_result.get("parameters", [])
        target_params = entry.get("parameters", [])
        for tp in translated_params:
            for i, zp in enumerate(target_params):
                if zp.get("name") == tp.get("name"):
                    target_params[i]["desc"] = tp["desc"]
                    break

    target_data[func_name] = entry


def main():
    args = parse_args()

    if not args.api_key:
        print("错误: 请通过 --api-key 参数或 ANTHROPIC_API_KEY 环境变量提供 API Key")
        sys.exit(1)

    # Load data
    print(f"加载源文件: {args.source}")
    source_data = load_json(args.source)
    print(f"加载目标文件: {args.target}")
    target_data = load_json(args.target)

    # Find changed entries
    changed = get_changed_entries(source_data, target_data, args.fields)
    print(f"发现 {len(changed)} 个需要翻译的条目（共 {len(source_data)} 个函数）")

    if args.dry_run:
        print("\n[DRY RUN] 需要翻译的条目:")
        for func_name, old_vals, new_vals in changed:
            print(f"  - {func_name}: {len(new_vals)} 个字段变更")
        return

    if not changed:
        print("无需翻译，所有条目已是最新。")
        return

    # Load progress
    completed = load_progress(args.progress)
    remaining = [(fn, ov, nv) for fn, ov, nv in changed if fn not in completed]
    print(f"已完成: {len(completed)}, 剩余: {len(remaining)}")

    if not remaining:
        print("所有条目已翻译完成！")
        return

    # Initialize API client
    client = anthropic.Anthropic(api_key=args.api_key)
    system_prompt = load_custom_prompt(args.prompt_file) or DEFAULT_SYSTEM_PROMPT

    # Translate
    success_count = 0
    fail_count = 0

    for i, (func_name, old_vals, new_vals) in enumerate(remaining):
        print(f"[{len(completed) + i + 1}/{len(changed)}] 翻译: {func_name} ...", end=" ", flush=True)

        source_entry = source_data[func_name]
        result = translate_entry(client, func_name, source_entry, args.fields, args.model, system_prompt)

        if result:
            apply_translation(target_data, func_name, source_entry, result, args.fields)
            completed.add(func_name)
            success_count += 1
            print("OK")

            # Save progress after each successful translation
            save_progress(args.progress, completed)

            # Save target file periodically (every 10 translations)
            if (len(completed)) % 10 == 0:
                save_json(args.target, target_data)
                print(f"  (已保存进度: {len(completed)}/{len(changed)})")
        else:
            fail_count += 1
            print("FAILED")
            # Brief pause on failure to avoid rate limiting
            time.sleep(2)

        # Rate limiting: brief pause between requests
        time.sleep(0.5)

    # Final save
    save_json(args.target, target_data)
    save_progress(args.progress, completed)

    print(f"\n翻译完成！成功: {success_count}, 失败: {fail_count}")
    print(f"目标文件已保存: {args.target}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: 运行 dry-run 验证脚本逻辑**

Run: `cd D:/CODE/Project/sentaurus-syntax-highlight && python3 scripts/translate_docs.py --source syntaxes/sde_function_docs.json --target syntaxes/sde_function_docs.zh-CN.json --dry-run`
Expected: 输出 "发现 405 个需要翻译的条目（共 405 个函数）"

---

### Task 3: 测试翻译脚本（小批量）

- [ ] **Step 1: 用 --progress 限制翻译 3 个函数进行测试**

Run: `cd D:/CODE/Project/sentaurus-syntax-highlight && python3 scripts/translate_docs.py --source syntaxes/sde_function_docs.json --target syntaxes/sde_function_docs.zh-CN.json --api-key YOUR_KEY --progress test_progress.txt 2>&1 | head -20`

手动中断（Ctrl+C）前应看到前几个函数开始翻译。

- [ ] **Step 2: 检查翻译结果质量**

检查 `sde_function_docs.zh-CN.json` 中已翻译的函数，确认：
- description 已翻译为中文
- parameters.desc 已翻译为中文且信息量与英文版一致
- 类型标注（REAL、POSITION 等）保留英文
- 代码语法保留原样

- [ ] **Step 3: 恢复中文版到翻译前状态（测试完成后）**

Run: `git checkout -- syntaxes/sde_function_docs.zh-CN.json`
Run: `rm -f test_progress.txt`

---

### Task 4: 执行完整翻译

- [ ] **Step 1: 执行完整翻译**

Run: `cd D:/CODE/Project/sentaurus-syntax-highlight && python3 scripts/translate_docs.py --source syntaxes/sde_function_docs.json --target syntaxes/sde_function_docs.zh-CN.json --api-key YOUR_KEY --progress translate_sde_zh_progress.json`

预计翻译 405 个函数，每个函数约 1-2 秒（含 API 调用 + 限速），总计约 10-15 分钟。

- [ ] **Step 2: 验证翻译完整性**

Run: `python3 -c "
import json
with open('syntaxes/sde_function_docs.json','r',encoding='utf-8') as f: en=json.load(f)
with open('syntaxes/sde_function_docs.zh-CN.json','r',encoding='utf-8') as f: zh=json.load(f)
assert len(en)==len(zh), f'函数数量不一致: {len(en)} vs {len(zh)}'
assert set(en.keys())==set(zh.keys()), '函数键不一致'
en_params=sum(len(v.get('parameters',[])) for v in en.values())
zh_params=sum(len(v.get('parameters',[])) for v in zh.values())
assert en_params==zh_params, f'参数数量不一致: {en_params} vs {zh_params}'
print('验证通过: 405 个函数, 871 个参数, 键完全一致')
"`

Expected: "验证通过: 405 个函数, 871 个参数, 键完全一致"

---

### Task 5: 提交变更

- [ ] **Step 1: 检查变更状态**

Run: `git status`
Run: `git diff --stat`

- [ ] **Step 2: 提交翻译脚本和翻译结果**

Run:
```bash
git add scripts/translate_docs.py syntaxes/sde_function_docs.zh-CN.json
git commit -m "feat(i18n): 增强 SDE 函数文档中文参数描述，新增通用翻译脚本

- 将 405 个函数的中文描述对齐英文增强版
- 更新 871 个参数描述的中文翻译
- 新增 scripts/translate_docs.py 通用翻译脚本
  支持增量翻译、断点续传、自定义提示词
  可复用于未来文档 i18n 需求

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 3: 清理进度文件**

Run: `rm -f translate_sde_zh_progress.json`
