#!/usr/bin/env python3
"""
通用化 JSON 文档翻译脚本。
将源 JSON 文档中指定的字段翻译为目标语言，写入目标 JSON 文件。
支持增量翻译（仅翻译变更字段）和断点续传。
使用 OpenAI 兼容 API（如 DeepSeek）。

用法：
    python scripts/translate_docs.py \
        --source syntaxes/sde_function_docs.json \
        --target syntaxes/sde_function_docs.zh-CN.json \
        --api-key sk-xxx

    # 批量模式（每批 10 个函数，减少 system prompt 重复消耗）
    python scripts/translate_docs.py \
        --source syntaxes/sde_function_docs.json \
        --target syntaxes/sde_function_docs.zh-CN.json \
        --batch-size 10
"""

import argparse
import json
import logging
import math
import os
import sys
import time
from openai import OpenAI


def setup_logging(log_file=None):
    """配置日志：同时输出到控制台和文件。"""
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    fmt = logging.Formatter("[%(asctime)s] %(message)s", datefmt="%H:%M:%S")

    # 控制台 handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(fmt)
    root.addHandler(console)

    # 文件 handler（每条日志立即 flush）
    if log_file:
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt)
        fh.flush = lambda: fh.stream.flush()  # type: ignore[method-assign]
        root.addHandler(fh)

    return logging


def parse_args():
    parser = argparse.ArgumentParser(description="JSON 文档翻译脚本（OpenAI 兼容 API）")
    parser.add_argument("--source", required=True, help="源 JSON 文件路径（英文原文）")
    parser.add_argument("--target", required=True, help="目标 JSON 文件路径（中文翻译）")
    parser.add_argument("--api-key", default=os.environ.get("TRANSLATE_API_KEY", ""),
                        help="API Key（也可通过 TRANSLATE_API_KEY 环境变量设置）")
    parser.add_argument("--base-url", default="https://api.deepseek.com",
                        help="API Base URL（默认 https://api.deepseek.com）")
    parser.add_argument("--model", default="deepseek-chat", help="翻译模型（默认 deepseek-chat）")
    parser.add_argument("--progress", default=None, help="进度文件路径（用于断点续传）")
    parser.add_argument("--fields", default="description,parameters.desc",
                        help="需要翻译的字段路径，逗号分隔（默认 description,parameters.desc）")
    parser.add_argument("--dry-run", action="store_true", help="仅显示需要翻译的条目，不执行翻译")
    parser.add_argument("--prompt-file", default=None, help="自定义翻译提示词文件路径")
    parser.add_argument("--limit", type=int, default=0, help="限制翻译的函数数量（0=不限制，用于测试）")
    parser.add_argument("--batch-size", type=int, default=10,
                        help="每批翻译的函数数量（默认 10，减少 system prompt 重复消耗）")
    parser.add_argument("--log", default=None,
                        help="日志文件路径（同时输出到控制台和文件）")
    return parser.parse_args()


def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_progress(progress_file):
    if progress_file and os.path.exists(progress_file):
        with open(progress_file, "r", encoding="utf-8") as f:
            return set(line.strip() for line in f if line.strip())
    return set()


def save_progress(progress_file, completed_funcs):
    if progress_file:
        with open(progress_file, "w", encoding="utf-8") as f:
            for func_name in sorted(completed_funcs):
                f.write(func_name + "\n")


def get_changed_entries(source_data, target_data, fields):
    """比对源和目标 JSON，找出需要翻译的条目。"""
    changed = []
    translate_fields = [f.strip() for f in fields.split(",")]

    for func_name, source_entry in source_data.items():
        target_entry = target_data.get(func_name, {})
        new_values = {}

        for field_path in translate_fields:
            if field_path == "description":
                old_val = target_entry.get("description", "")
                new_val = source_entry.get("description", "")
                if old_val != new_val:
                    new_values["description"] = new_val
            elif field_path == "parameters.desc":
                source_params = source_entry.get("parameters", [])
                target_params = target_entry.get("parameters", [])
                for i, sp in enumerate(source_params):
                    old_pdesc = target_params[i].get("desc", "") if i < len(target_params) else ""
                    new_pdesc = sp.get("desc", "")
                    if old_pdesc != new_pdesc:
                        new_values[f"param:{i}"] = new_pdesc

        if new_values:
            changed.append((func_name, new_values))

    return changed


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

输出格式：严格输出 JSON 数组，不要输出任何其他内容。
每个元素对应一个函数的翻译结果，格式如下：
[
  {
    "func_name": "函数名",
    "description": "翻译后的函数描述",
    "parameters": [
      {"name": "参数名", "desc": "翻译后的参数描述"},
      ...
    ]
  }
]
注意：必须为每个函数都输出一个对象，func_name 必须与输入的函数名完全一致。"""


def load_custom_prompt(prompt_file):
    if prompt_file and os.path.exists(prompt_file):
        with open(prompt_file, "r", encoding="utf-8") as f:
            return f.read()
    return None


def build_batch_message(batch_items, fields):
    """为一批函数构建用户消息。"""
    translate_fields = [f.strip() for f in fields.split(",")]
    parts = [f"请翻译以下 {len(batch_items)} 个函数的文档：\n"]

    for func_name, source_entry in batch_items:
        parts.append(f"## {func_name}")
        if "description" in translate_fields:
            desc = source_entry.get("description", "")
            if desc:
                parts.append(f"函数描述: {desc}")
        if "parameters.desc" in translate_fields:
            params = source_entry.get("parameters", [])
            if params:
                parts.append("参数列表:")
                for p in params:
                    parts.append(f'  - {p["name"]} (类型: {p.get("type", "")}): {p.get("desc", "")}')
        parts.append("")

    return "\n".join(parts)


_log = logging.getLogger(__name__)


def translate_batch(client, batch_items, fields, model, system_prompt):
    """
    调用 API 翻译一批函数条目。
    返回: dict[func_name] -> translation_result
    """
    user_message = build_batch_message(batch_items, fields)

    try:
        response = client.chat.completions.create(
            model=model,
            max_tokens=8192,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
        )

        text = response.choices[0].message.content.strip()

        # Strip markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        results = json.loads(text)

        # Normalize: ensure results is a list, index by func_name
        if isinstance(results, dict):
            # If it's a dict keyed by func_name, convert to list format
            normalized = {}
            for fn, val in results.items():
                val["func_name"] = fn
                normalized[fn] = val
            return normalized
        elif isinstance(results, list):
            return {item.get("func_name", ""): item for item in results}
        else:
            return None

    except json.JSONDecodeError as e:
        func_names = [fn for fn, _ in batch_items]
        _log.warning(f"JSON 解析失败 (batch {func_names}): {e}")
        return None
    except Exception as e:
        func_names = [fn for fn, _ in batch_items]
        _log.error(f"API 调用失败 (batch {func_names}): {e}")
        return None


def apply_translation(target_data, func_name, translation_result, fields):
    """将翻译结果应用到目标数据。返回成功应用的参数数量。"""
    if translation_result is None:
        return 0

    entry = target_data.get(func_name, {})
    translate_fields = [f.strip() for f in fields.split(",")]
    applied = 0

    if "description" in translate_fields and translation_result.get("description"):
        entry["description"] = translation_result["description"]
        applied += 1

    if "parameters.desc" in translate_fields:
        translated_params = translation_result.get("parameters", [])
        target_params = entry.get("parameters", [])
        for i, tp in enumerate(translated_params):
            if i < len(target_params) and tp.get("desc"):
                target_params[i]["desc"] = tp["desc"]
                applied += 1

    target_data[func_name] = entry
    return applied


def main():
    args = parse_args()
    log = setup_logging(args.log)

    if not args.api_key and not args.dry_run:
        log.error("错误: 请通过 --api-key 参数或 TRANSLATE_API_KEY 环境变量提供 API Key")
        sys.exit(1)

    log.info(f"加载源文件: {args.source}")
    source_data = load_json(args.source)
    log.info(f"加载目标文件: {args.target}")
    target_data = load_json(args.target)

    changed = get_changed_entries(source_data, target_data, args.fields)
    log.info(f"发现 {len(changed)} 个需要翻译的条目（共 {len(source_data)} 个函数）")

    if args.dry_run:
        log.info("[DRY RUN] 需要翻译的条目:")
        for func_name, new_vals in changed:
            log.info(f"  - {func_name}: {len(new_vals)} 个字段变更")
        return

    if not changed:
        log.info("无需翻译，所有条目已是最新。")
        return

    # Apply limit
    if args.limit > 0:
        changed = changed[:args.limit]
        log.info(f"限制翻译数量: {args.limit} 个函数")

    completed = load_progress(args.progress)
    remaining = [(fn, source_data[fn]) for fn, _ in changed if fn not in completed]
    log.info(f"已完成: {len(completed)}, 剩余: {len(remaining)}")

    if not remaining:
        log.info("所有条目已翻译完成！")
        return

    client = OpenAI(api_key=args.api_key, base_url=args.base_url)
    system_prompt = load_custom_prompt(args.prompt_file) or DEFAULT_SYSTEM_PROMPT

    batch_size = max(1, args.batch_size)
    total_batches = math.ceil(len(remaining) / batch_size)
    log.info(f"批量模式: 每批 {batch_size} 个函数, 共 {total_batches} 批")

    success_count = 0
    fail_count = 0

    for batch_idx in range(total_batches):
        batch_items = remaining[batch_idx * batch_size:(batch_idx + 1) * batch_size]
        batch_num = batch_idx + 1
        func_names = [fn for fn, _ in batch_items]

        log.info(f"[Batch {batch_num}/{total_batches}] 翻译 {len(batch_items)} 个函数: {', '.join(func_names[:5])}{'...' if len(func_names) > 5 else ''}")

        results = translate_batch(client, batch_items, args.fields, args.model, system_prompt)

        if results:
            batch_ok = 0
            batch_fail = 0
            for func_name, _ in batch_items:
                result = results.get(func_name)
                if result:
                    applied = apply_translation(target_data, func_name, result, args.fields)
                    expected = 1 + len(source_data[func_name].get("parameters", []))
                    if applied >= expected:
                        completed.add(func_name)
                        success_count += 1
                        batch_ok += 1
                    else:
                        fail_count += 1
                        batch_fail += 1
                        log.warning(f"  [PARTIAL] {func_name}: 仅应用 {applied}/{expected} 个字段")
                else:
                    fail_count += 1
                    batch_fail += 1
                    log.warning(f"  [MISS] {func_name}: 未在响应中找到")
            log.info(f"  -> 成功: {batch_ok}, 失败: {batch_fail}")
        else:
            # Whole batch failed, count each function as failed
            fail_count += len(batch_items)
            log.error(f"  -> 整批失败 ({len(batch_items)} 个函数)")
            time.sleep(3)

        save_progress(args.progress, completed)

        # Save target file after each batch
        save_json(args.target, target_data)
        log.info(f"  (进度: {len(completed)}/{len(completed) + len(remaining) - len(batch_items) * (1 if results else 0)})")

        # Rate limiting between batches
        if batch_idx < total_batches - 1:
            time.sleep(1)

    save_json(args.target, target_data)
    save_progress(args.progress, completed)

    log.info(f"翻译完成！成功: {success_count}, 失败: {fail_count}")
    log.info(f"目标文件已保存: {args.target}")


if __name__ == "__main__":
    main()
