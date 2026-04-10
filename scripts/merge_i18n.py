"""
Merge per-prefix translated JSON files into a single sde_function_docs.zh-CN.json.

Usage:
    python scripts/merge_i18n.py

Reads all *.zh-CN.json files from syntaxes/_i18n_split/ and merges them
into syntaxes/sde_function_docs.zh-CN.json, preserving key order.
"""
import json
import os
import glob

SPLIT_DIR = os.path.join(os.path.dirname(__file__), '..', 'syntaxes', '_i18n_split')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'syntaxes', 'sde_function_docs.zh-CN.json')


def main():
    merged = {}

    # Find all zh-CN split files
    pattern = os.path.join(SPLIT_DIR, '*.zh-CN.json')
    files = sorted(glob.glob(pattern))

    if not files:
        print(f'No .zh-CN.json files found in {SPLIT_DIR}')
        return

    print(f'Found {len(files)} translated files:')
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        basename = os.path.basename(fpath)
        print(f'  {basename}: {len(data)} functions')
        merged.update(data)

    # Write merged output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f'\nMerged {len(merged)} functions -> {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
