# Sentaurus TCAD Syntax Highlighting

This VSCode extension provides syntax highlighting for Synopsys Sentaurus TCAD files.

## Supported File Types

- **Sentaurus Structure Editor (SDE)**: `*_dvs.cmd` and `.scm` files
- **Sentaurus Device (SDEVICE)**: `*_des.cmd` files
- **Sentaurus Process (SPROCESS)**: `*_fps.cmd` and `.fps` files
- **Sentaurus EMW**: `*_eml.cmd` and `*_emw.cmd` files
- **Sentaurus Inspect**: `*_ins.cmd` files

## Features

- Syntax highlighting for commands, keywords, functions, and constants
- Proper bracket matching and indentation
- Comment highlighting

## Development

The syntax highlighting definitions were automatically generated from Sentaurus TCAD mode files using a custom Python script.

To regenerate the syntax files, run:

```bash
python scripts/extract_keywords.py
```

## Installation

1. Copy this folder to `~/.vscode/extensions/` (on Windows: `%USERPROFILE%\.vscode\extensions\`)
2. Restart VSCode
