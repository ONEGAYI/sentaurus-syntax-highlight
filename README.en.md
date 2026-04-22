# Sentaurus TCAD Syntax Highlighting

A VSCode extension providing syntax highlighting, auto-completion, and semantic features for the Synopsys Sentaurus TCAD tool chain. Supports command files for SDE, SDEVICE, SPROCESS, EMW, INSPECT, and SVISUAL.

[中文文档](README.md)

## Features Overview

### Core Editing

| Feature | Description |
|---------|-------------|
| Syntax Highlighting | Color-coded display for keywords, functions, tags, constants, numbers, variables, etc. |
| Auto-Completion | Keyword suggestions on typing, sorted by category with icons, **functions/commands include parameter descriptions**, **real-time completion for user-defined variables** |
| Hover Documentation | Hovering over a function/command shows its signature, parameter descriptions, and example code; **user variables display their definition text** |
| Go to Definition | **F12 / Ctrl+Click to jump to the definition line of user-defined variables** (scope-aware, precise for same-name variables) |
| Find All References | **Shift+F12 to find all reference locations of user-defined variables** (Scheme + Tcl, scope-aware filtering) |

### Semantic Features

| Feature | Description |
|---------|-------------|
| Breadcrumb Navigation | Tcl languages (SDEVICE/SPROCESS/EMW/INSPECT/SVISUAL) auto-generate breadcrumb paths based on section keywords and command blocks |
| Code Folding | SDE `define`/`let`/`lambda` and other S-expressions; Tcl language `braced_word` command blocks |
| Bracket Diagnostics | SDE detects unbalanced parentheses; Tcl languages detect curly brace balance and highlight errors |

### Utility Features

| Feature | Description |
|---------|-------------|
| Expression Converter | **Bidirectional Scheme prefix ↔ infix conversion**, invoked from the Command Palette, supports selected text replacement or input box conversion |
| Code Snippets | **QuickPick visual menu** (`Ctrl+Shift+P` → `Sentaurus: Insert Snippet`) for browsing and inserting code templates by tool category; **traditional prefix+Tab snippets** isolated by language |
| Comment Recognition | `#` universal comment; SDE additionally supports `;` (Scheme comment); SDevice/EMW/SProcess/Inspect additionally support `*` |
| SWB Variables | Highlights `@Var@`, `@param:+2@`, and other Sentaurus Workbench parameter substitution syntax |
| Bracket Matching | Auto-pairing for `{}` `[]` `()` |

### Supported File Types

| Tool | File Patterns |
|------|---------------|
| Sentaurus Structure Editor (SDE) | `*_dvs.cmd`, `.scm` |
| Sentaurus Device (SDEVICE) | `*_des.cmd` |
| Sentaurus Process (SPROCESS) | `*_fps.cmd`, `.fps` |
| Sentaurus EMW | `*_eml.cmd`, `*_emw.cmd` |
| Sentaurus Inspect | `*_ins.cmd` |
| Sentaurus Visual (SVISUAL) | `*_vis.cmd` |

### Screenshots

![Screenshot](assets/pics/vscode%20插件效果演示%20-%20自动补全+语法高亮.png)

#### Function Hover Documentation & Completion

Provides bilingual (English/Chinese) hover documentation that automatically switches based on VSCode language settings:

| Language | Documentation Coverage | Count |
|----------|----------------------|-------|
| **SDE** | KEYWORD1 API functions (sdegeo, sde, sdedr, sdeicwb, sdepe, sdesnmesh, sdeio, sdeepi, sdesp) | 405 |
| **SDE** | Scheme R5RS built-in functions (`define`, `let`, `lambda`, `map`, etc.) | 191 |
| **SDEVICE** | KEYWORD1+KEYWORD2+KEYWORD3 commands (Physics, Solve, Plot, Math, System, etc.) | 341 |
| **SVISUAL** | KEYWORD1 top-level commands + KEYWORD4 namespace functions | 257 |
| SPROCESS / INSPECT / EMW | Keyword auto-completion (no hover documentation) | — |

Hover shows function signature, parameter descriptions, and example code. Completion list includes detailed documentation.

![Documentation Demo](assets/pics/vscode%20插件效果演示%20-%20语法文档+汉化适配.png)

### Expression Converter (Scheme ↔ Infix)

SDE uses Scheme prefix expressions for calculations, where nested parentheses are error-prone. This extension provides **bidirectional prefix ↔ infix conversion**, invoked from the Command Palette:

#### Commands

| Command | Function |
|---------|----------|
| `Sentaurus: Scheme → Infix` | Convert Scheme prefix expressions to infix/function-call format |
| `Sentaurus: Infix → Scheme` | Convert infix/function-call expressions to Scheme prefix format |
| `Sentaurus: Expression Help` | View the list of supported operators and functions |

![Expression Converter](assets/pics/vscode%20插件效果演示%20-%20表达式格式转换.gif)

#### Usage

**Convert selected text:** Select a Scheme expression in the editor, run the command, and the selection is replaced (supports Ctrl+Z to undo).

**Input box conversion:** With no selection, an input box appears. Enter an expression and the result is inserted at the cursor and auto-selected. Supports up/down arrow keys to browse history (last 20 entries within the session).

#### Conversion Examples

| Scheme Prefix | Infix / Function Call |
|---------------|----------------------|
| `(+ 1 2)` | `1 + 2` |
| `(* (+ a b) c)` | `(a + b) * c` |
| `(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)` | `(W / 2 + Lgate / 2 + Wspacer) / -2` |
| `(expt a 2)` | `a ^ b` |
| `(sin x)` | `sin(x)` |
| `(min a b c)` | `min(a, b, c)` |

#### Supported Operators and Functions

- **Arithmetic operators**: `+`, `-`, `*`, `/`
- **Special operators**: `^` (power), `%` (modulo), `%%` (remainder), `//` (integer quotient)
- **Math functions**: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `abs`, `exp`, `log`
- **Rounding functions**: `floor`, `ceil`, `round`
- **Aggregate functions**: `min`, `max`

Run `Sentaurus: Expression Help` to view the complete operator list with examples.

### Code Snippets

#### QuickPick Visual Menu

Browse and insert code templates via the Command Palette:

1. `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`) to open the Command Palette
2. Type `Sentaurus: Insert Snippet` and press Enter
3. Select a tool category (e.g., `Sentaurus-StructEditor`)
4. Select a sub-category (e.g., `Contact`, `Doping`, `Meshing`)
5. Select a specific template to insert, supports Tab to jump between placeholders

Each level supports `← Back` to return, press `Esc` to exit.

Currently covers 5 tools with 85 templates:

| Tool | Categories | Templates |
|------|-----------|-----------|
| SDE (StructEditor) | Contact, Doping, Meshing | 11 |
| SDEVICE | CurrentPlot, Electrode, File, Math, Physics, Plot, Solve, System | 43 |
| SPROCESS | Deposit, Diffuse, Etch, Implant, ICWB, Init, Mask, Photo, MeshGoals, RefineBox, Struct | 25 |
| INSPECT | Curve, Extract | 8 |
| Mesh (EMW) | EMW | 2 |

![QuickPick Snippets](assets/pics/vscode%20插件效果演示%20-%20QuickPick%20代码片段选单.gif)

#### Traditional Prefix+Tab Snippets

The extension registers snippet files for each language. Users can customize them:

1. `Ctrl+Shift+P` → `Preferences: Configure User Snippets`
2. Select the corresponding language (e.g., `sde`, `sdevice`, `sprocess`, `emw`, `inspect`)
3. Add custom snippets in the opened JSON file

> Multiple languages share the `.cmd` extension, but VSCode associates files to different language IDs via `filenamePatterns`. Snippets are automatically isolated by language ID and do not conflict.

## Installation

### VSCode Marketplace (Recommended)

Search for **Sentaurus TCAD Syntax** in the VSCode Extensions panel, or visit the [Marketplace page](https://marketplace.visualstudio.com/items?itemName=onegayi.sentaurus-tcad-syntax).

### VSIX Command Line Installation (Offline)

Download the `.vsix` file from [Releases](https://github.com/ONEGAYI/sentaurus-syntax-highlight/releases), then:

```bash
# Install / Upgrade
code --install-extension sentaurus-tcad-syntax-x.x.x.vsix

# Uninstall
code --uninstall-extension onegayi.sentaurus-tcad-syntax
```

> In a remote SSH environment, run the above commands on the remote machine, or use VSCode's Extensions panel to install manually.

### Manual Installation

Rename the extension folder to the `publisher.extension-name-version` format and copy it to the VSCode extensions directory, then restart VSCode:

```
sentaurus-syntax-highlight  →  onegayi.sentaurus-tcad-syntax-x.x.x
```

- Linux/macOS: `~/.vscode/extensions/onegayi.sentaurus-tcad-syntax-x.x.x`
- Windows: `%USERPROFILE%\.vscode\extensions\onegayi.sentaurus-tcad-syntax-x.x.x`

> VSCode relies on this naming convention to identify extensions. An incorrect name will prevent the extension from loading.

## Tips

### Changing Sentaurus' Default Editor

Sentaurus uses JEdit as the default code editor. To change it to **VS Code**:

1. Open Sentaurus Workbench
2. Press **F12**, or go to **Edit** > **User Preferences** (some versions use **Edit** > **Preferences**)
3. Make sure to select the `User` scope settings (try `Global` if `User` doesn't work)
4. In the Preferences dialog, expand `Binaries` (or `Utilities` in older versions)
5. Find the `Editor` entry and double-click it
6. Change the value to the **VS Code** path, e.g.: `/usr/bin/code`
7. Click **Apply** to save

---

To get the **VS Code** path:

```bash
which code
```

## Acknowledgments

This project's keyword extraction scripts and TextMate grammar foundations reference [jackyu-b/sentaurus-syntax-highlight](https://github.com/jackyu-b/sentaurus-syntax-highlight.git). Thanks for the contribution.

## Development

Syntax files are auto-generated from Sentaurus TCAD's jEdit XML mode files using a Python script:

```bash
python scripts/extract_keywords.py
```

Package the extension:

```bash
npm install -g @vscode/vsce
vsce package
```
