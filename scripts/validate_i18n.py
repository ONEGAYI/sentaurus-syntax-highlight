"""
校对 i18n 文档对的结构一致性。

比较英文和中文函数文档 JSON，验证除 desc / param.desc 之外的所有字段
（键名、键值、数量、顺序）完全匹配。

用法:
    python scripts/validate_i18n.py              # 校验所有已知的文档对
    python scripts/validate_i18n.py sde           # 仅校验 sde
    python scripts/validate_i18n.py sdevice       # 仅校验 sdevice
    python scripts/validate_i18n.py scheme        # 仅校验 scheme

退出码:
    0 — 全部通过
    1 — 发现差异
"""

import json
import os
import sys

# 文档对注册表：name -> (en_file, zh_file)
DOC_PAIRS = {
    "sde":     ("syntaxes/sde_function_docs.json",          "syntaxes/sde_function_docs.zh-CN.json"),
    "sdevice": ("syntaxes/sdevice_command_docs.json",       "syntaxes/sdevice_command_docs.zh-CN.json"),
    "scheme":  ("syntaxes/scheme_function_docs.json",        "syntaxes/scheme_function_docs.zh-CN.json"),
    "svisual": ("syntaxes/svisual_command_docs.json",        "syntaxes/svisual_command_docs.zh-CN.json"),
}

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# 跳过比较的字段名（允许中英文不同或仅英文存在）
SKIP_FIELDS = {"desc", "description", "modeDispatch", "contexts", "example"}


def load_json(rel_path):
    full = os.path.join(ROOT, rel_path)
    if not os.path.exists(full):
        return None, full
    with open(full, "r", encoding="utf-8") as f:
        return json.load(f), full


def validate_pair(name, en_data, zh_data):
    """校验一对文档，返回差异列表。"""
    issues = []

    en_keys = list(en_data.keys())
    zh_keys = list(zh_data.keys())

    # ── 顶层键集合 ──
    if set(en_keys) != set(zh_keys):
        only_en = set(en_keys) - set(zh_keys)
        only_zh = set(zh_keys) - set(en_keys)
        if only_en:
            issues.append(f"  [KEYS] 仅英文存在: {sorted(only_en)}")
        if only_zh:
            issues.append(f"  [KEYS] 仅中文存在: {sorted(only_zh)}")

    # ── 逐条目比对 ──
    for func_name in en_keys:
        if func_name not in zh_data:
            continue

        en_entry = en_data[func_name]
        zh_entry = zh_data[func_name]

        _compare_entry(issues, func_name, en_entry, zh_entry, path=func_name)

    return issues


def _compare_entry(issues, func_name, en_val, zh_val, path):
    """递归比对两个值，desc/description 字段跳过值比较。"""

    # 类型不同 → 直接报错
    if type(en_val) is not type(zh_val):
        issues.append(f"  [TYPE] {path}: en={type(en_val).__name__}, zh={type(zh_val).__name__}")
        return

    # ── dict ──
    if isinstance(en_val, dict):
        en_keys = list(en_val.keys())
        zh_keys = list(zh_val.keys())

        # 键集合（排除 SKIP_FIELDS）
        if en_keys != zh_keys:
            only_en = set(en_keys) - set(zh_keys) - SKIP_FIELDS
            only_zh = set(zh_keys) - set(en_keys) - SKIP_FIELDS
            if only_en:
                issues.append(f"  [FIELD] {path} 仅英文有字段: {sorted(only_en)}")
            if only_zh:
                issues.append(f"  [FIELD] {path} 仅中文有字段: {sorted(only_zh)}")

        # 逐字段比对值
        for key in en_keys:
            if key not in zh_val:
                continue
            child_path = f"{path}.{key}"
            if key in SKIP_FIELDS:
                # desc 字段：只检查存在性，不比较值
                continue
            _compare_entry(issues, func_name, en_val[key], zh_val[key], child_path)
        return

    # ── list ──
    if isinstance(en_val, list):
        if len(en_val) != len(zh_val):
            issues.append(
                f"  [COUNT] {path}: en 有 {len(en_val)} 项, zh 有 {len(zh_val)} 项"
            )
            # 仍然逐项比对已有的部分
            min_len = min(len(en_val), len(zh_val))
        else:
            min_len = len(en_val)

        for i in range(min_len):
            _compare_entry(issues, func_name, en_val[i], zh_val[i], f"{path}[{i}]")
        return

    # ── 基本类型（str, number, bool, None）──
    if en_val != zh_val:
        # 截断过长值用于显示
        en_s = _truncate(str(en_val), 80)
        zh_s = _truncate(str(zh_val), 80)
        issues.append(f"  [VALUE] {path}:\n    en = {en_s}\n    zh = {zh_s}")


def _truncate(s, max_len):
    if len(s) <= max_len:
        return s
    return s[:max_len - 3] + "..."


def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(DOC_PAIRS.keys())

    # 验证参数
    unknown = [t for t in targets if t not in DOC_PAIRS]
    if unknown:
        print(f"未知文档名: {unknown}")
        print(f"可用: {', '.join(DOC_PAIRS.keys())}")
        sys.exit(1)

    total_issues = 0
    total_ok = 0

    for name in targets:
        en_file, zh_file = DOC_PAIRS[name]
        en_data, en_path = load_json(en_file)
        zh_data, zh_path = load_json(zh_file)

        if en_data is None:
            print(f"[{name}] SKIP — 英文文件不存在: {en_path}")
            continue
        if zh_data is None:
            print(f"[{name}] SKIP — 中文文件不存在: {zh_path}")
            continue

        issues = validate_pair(name, en_data, zh_data)

        if issues:
            total_issues += len(issues)
            print(f"[{name}] FAIL — {len(issues)} 个差异 ({len(en_data)} 条目)")
            for issue in issues:
                print(issue)
        else:
            total_ok += 1
            print(f"[{name}] OK — {len(en_data)} 条目完全一致")

    # 汇总
    print(f"\n{'='*50}")
    if total_issues == 0:
        print(f"全部通过 ({total_ok}/{len(targets)})")
        sys.exit(0)
    else:
        print(f"发现 {total_issues} 个差异 ({total_ok}/{len(targets)} 通过)")
        sys.exit(1)


if __name__ == "__main__":
    main()
