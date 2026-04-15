#!/usr/bin/env python3
"""
将 TextMate 语法 JSON 文件中超长的 match 正则模式拆分为多个子 pattern。

原理：将单个 {"match": "\\b(alt1|alt2|...|altN)suffix", "name": "scope"}
拆分为多个等价的子模式：
  {"patterns": [
    {"match": "\\b(alt1|...|alt30)suffix", "name": "scope"},
    {"match": "\\b(alt31|...|alt60)suffix", "name": "scope"},
    ...
  ]}

TextMate 引擎对 patterns 数组中的每个子模式独立匹配，结果与单个
长 alternation 完全等价。容器 pattern 不携带 name，避免 scope 叠加。

用法:
    python scripts/split_long_matches.py                  # 处理 syntaxes/ 下所有文件
    python scripts/split_long_matches.py path/to/dir      # 处理指定目录
    python scripts/split_long_matches.py --max-alts 50    # 自定义每批最大替代项数
"""

import json
import os
import sys


def find_top_level_group(match_str):
    """定位 match 字符串中最外层的括号组。

    返回 (prefix, inner_content, suffix) 或 None。
    prefix 包含 ( 及其之前的内容，suffix 包含 ) 及其之后的内容。
    inner_content 是括号内的纯替代项文本（不含外层括号）。
    """
    i = 0
    first_open = -1
    depth = 0
    has_pipe = False

    while i < len(match_str):
        ch = match_str[i]
        # 跳过转义字符对
        if ch == '\\' and i + 1 < len(match_str):
            i += 2
            continue
        if ch == '[' and depth == 0:
            # 跳过字符类 [...]，内部 | 无特殊含义
            i += 1
            while i < len(match_str):
                if match_str[i] == '\\' and i + 1 < len(match_str):
                    i += 2
                    continue
                if match_str[i] == ']':
                    break
                i += 1
            i += 1
            continue
        if ch == '(':
            if first_open == -1:
                first_open = i
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0 and first_open != -1:
                prefix = match_str[:first_open + 1]   # 包含 (
                inner = match_str[first_open + 1:i]
                suffix = match_str[i:]                  # 包含 )
                return prefix, inner, suffix
        elif ch == '|' and depth >= 1 and first_open != -1:
            has_pipe = True
        i += 1

    return None


def split_alternatives(inner):
    """按顶层 | 分割内容，正确处理转义和嵌套括号。"""
    result = []
    current = []
    depth = 0
    i = 0
    while i < len(inner):
        ch = inner[i]
        if ch == '\\' and i + 1 < len(inner):
            current.append(ch)
            current.append(inner[i + 1])
            i += 2
            continue
        if ch == '(':
            depth += 1
            current.append(ch)
        elif ch == ')':
            depth -= 1
            current.append(ch)
        elif ch == '|' and depth == 0:
            result.append(''.join(current))
            current = []
        else:
            current.append(ch)
        i += 1
    if current:
        result.append(''.join(current))
    return result


def needs_split(pattern, min_length):
    """判断 pattern 是否需要拆分。"""
    match_str = pattern.get('match', '')
    if not match_str or len(match_str) < min_length:
        return False
    group = find_top_level_group(match_str)
    if group is None:
        return False
    _, inner, _ = group
    alts = split_alternatives(inner)
    return len(alts) > 1


def split_pattern(pattern, max_alts, min_length):
    """将单个长 match pattern 拆分为多个子 pattern。

    返回新的 pattern dict。若无需拆分则返回原始 pattern。
    """
    match_str = pattern.get('match', '')
    name = pattern.get('name', '')

    if not match_str or len(match_str) < min_length:
        return pattern

    group = find_top_level_group(match_str)
    if group is None:
        return pattern

    prefix, inner, suffix = group
    alts = split_alternatives(inner)

    if len(alts) <= max_alts:
        return pattern

    # 按批次拆分
    batches = []
    for i in range(0, len(alts), max_alts):
        batch = alts[i:i + max_alts]
        batch_match = prefix + '|'.join(batch) + suffix
        batches.append({"match": batch_match, "name": name})

    # 构建容器 pattern（不含 name，避免 scope 叠加）
    new_pattern = {"patterns": batches}
    for key in pattern:
        if key not in ('match', 'name'):
            new_pattern[key] = pattern[key]

    return new_pattern


def process_file(filepath, max_alts, min_length):
    """处理单个 tmLanguage.json 文件。返回是否修改。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changed = False
    for i, pattern in enumerate(data.get('patterns', [])):
        new_pattern = split_pattern(pattern, max_alts, min_length)
        if new_pattern is not pattern:
            data['patterns'][i] = new_pattern
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            f.write('\n')

    return changed


def main():
    # 解析参数
    max_alts = 30
    min_length = 500
    target_dir = None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == '--max-alts' and i + 1 < len(args):
            max_alts = int(args[i + 1])
            i += 2
        elif args[i] == '--min-length' and i + 1 < len(args):
            min_length = int(args[i + 1])
            i += 2
        else:
            target_dir = args[i]
            i += 1

    # 确定目录
    if target_dir is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        target_dir = os.path.join(script_dir, '..', 'syntaxes')
    target_dir = os.path.normpath(target_dir)

    if not os.path.isdir(target_dir):
        print(f"错误: 目录不存在 - {target_dir}", file=sys.stderr)
        sys.exit(1)

    # 处理所有 tmLanguage.json 文件
    files = sorted(f for f in os.listdir(target_dir) if f.endswith('.tmLanguage.json'))
    if not files:
        print(f"未找到 .tmLanguage.json 文件: {target_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"目录: {target_dir}")
    print(f"参数: max_alts={max_alts}, min_length={min_length}")
    print()

    total_split = 0
    for fname in files:
        filepath = os.path.join(target_dir, fname)
        was_changed = process_file(filepath, max_alts, min_length)
        status = "SPLIT" if was_changed else " OK "
        print(f"  [{status}] {fname}")
        if was_changed:
            total_split += 1

    print(f"\n处理完成: {len(files)} 个文件, {total_split} 个已拆分")


if __name__ == '__main__':
    main()
