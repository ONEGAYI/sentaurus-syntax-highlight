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
