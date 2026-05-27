# Auto Completion

As you type, the extension analyzes the current context and pushes relevant completion candidates. Press `Tab` or `Enter` to insert.

---

## Keyword Completion

The extension ships a keyword database for each of the 7 supported languages, extracted from the official Sentaurus manuals. Matched keywords are grouped by category:

- **Functions / Commands** — Primary operations for each tool (e.g., `sdegeo:create-circle` in SDE, `Solve` in SDEVICE)
- **Keywords** — Control flow and declarations (e.g., `set`, `proc`, `if`)
- **Tags / Classes** — Structured declarations (e.g., `Refdg` in SDE, `Physics` in SDEVICE)
- **Literals** — Material names, constants, and values (e.g., `Silicon`, `Oxide`)
- **Math Functions** — Built-in Tcl `expr` math functions (e.g., `sqrt`, `sin`, `max`)

All languages share a common **material name table** (e.g., `4H-SiC`, `AlGaAs`, `GaN`). Languages other than SDE also share **Tcl expr math functions**.

---

## Function Documentation on Hover

Hover over any documented function name or keyword to see a formatted documentation card containing:

- Function signature
- Description
- Parameter list (name, type, description)
- Example code

Current documentation coverage:

| Language | Entries | Notes |
|----------|---------|-------|
| SDE | 565 | SDE Scheme API functions |
| Scheme Built-in | 191 | R5RS/R7RS standard library |
| SDEVICE | 2123 | SDEVICE commands and keywords |
| Svisual | 257 | Svisual plotting commands |
| Tcl Core | 66 | `set`, `if`, `foreach`, etc. |
| Tcl Math | 31 | Functions available in `expr` |
| Tcl Subcommands | 83 | Subcommands of `string`/`file`/`info`/`array`/`dict` |

Documentation is loaded in Chinese when available, falling back to English otherwise.

---

## User Variable Completion and Go-to-Definition

The extension automatically scans the current file for all variable definitions — including `set`, `proc` parameters, `define`, `lambda` bindings, and `#define` preprocessor macros. These appear in the completion list with `User Variable`, `User Function`, or `#define` labels.

### Hover Preview

Hover over a variable reference to see the code at its definition site, along with the line number. Long lines are truncated according to `sentaurus.definitionMaxWidth` (default: 60 characters), with an ellipsis marker appended.

### Go to Definition

Press `F12` (or right-click → "Go to Definition") on a variable name to jump to its definition. In SDE, this is scope-aware — only definitions visible in the current lexical scope are considered.

---

## SDE-Specific Features

### Function Signature Help

Inside an SDE file, press `Ctrl+Shift+Space` to trigger **Signature Help**. The extension highlights each parameter in turn based on the function's documented signature, guiding you through the correct argument order.

### Region / Material / Contact Symbol Completion

Many SDE functions (e.g., `sdegeo:define-contact-set`, `(sdepe:append-proxy)`) accept Region names, Material names, or Contact names as arguments. The extension detects the expected parameter type and offers completions from symbols already defined in the file. For example:

```scheme
(sdegeo:define-contact-set "gate" 4.0 (color:rgb 1 0 0) "<cursor>")
```

At the cursor position, the completion list is automatically filtered to show only defined Contact names.

---

## SDEVICE-Specific Features

### Section-Context-Aware Completion

SDEVICE command files are organized as nested `{}` sections. The extension tracks the cursor's section nesting stack in real time and **prioritizes documentation matching the current section** on hover. For example:

```
Physics {
  Mobility {
    DopingDependence <cursor>
  }
}
```

Hovering over `DopingDependence` shows the description specific to the `Physics > Mobility` section context — not the generic entry or a different section's meaning.

### Vector Keyword Suffix Completion

Inside `Plot` or `CurrentPlot` sections, typing `/` after a vector base keyword triggers a suffix list. For instance, after typing `eDensity/`, completions like `X`, `Y`, and `Magnitude` appear.

---

## SDEVICE PAR-Specific Features

`.par` parameter files follow a **scope → block → parameter** three-level hierarchy. The extension infers the completion level from the cursor position:

| Position | Completion Content | Example |
|----------|--------------------|---------|
| File top level | Scope type + name | `Material = "Silicon" { ... }` |
| Inside a scope | Block name | `Bandgap { ... }` |
| Inside a block | Parameter name | `Eg0 = 1.12` |
| Inside scope name quotes | Existing scope names of the same type | Quickly reuse a previously defined Region/Material name |

Completion sources are ranked by priority: current file > include files > workspace scan > MaterialDB > built-in stubs. Duplicate symbols keep only the highest-priority entry.

---

## Tcl Subcommand Completion

After any of the 5 common Tcl commands, typing a space triggers subcommand completion:

- `string` — `length`, `range`, `replace`, `trim`, `tolower`, ...
- `file` — `exists`, `dirname`, `extension`, `join`, ...
- `info` — `exists`, `level`, `commands`, `body`, ...
- `array` — `exists`, `get`, `set`, `names`, `size`, ...
- `dict` — `get`, `set`, `exists`, `keys`, `values`, ...

Hovering over a typed subcommand also displays its documentation card.

---

## SWB Environment Variables

The `sentaurus.environmentVariables` setting declares an **environment variable allowlist** for SWB. Variables in the list receive:

- **Completion** — Appears when typing `$`, marked with `🏠 Environment Variable`
- **Hover** — Shows the documentation string from the setting
- **Diagnostic exemption** — Does not trigger "undefined variable" warnings
- **Semantic highlighting** — Rendered in bold to distinguish from regular variables

To configure: search for `sentaurus.environmentVariables` in VSCode Settings, or use the management commands in the Command Palette (Add / Remove / Import / Export).

---

## Trigger Summary

| Trigger | Result |
|---------|--------|
| Start typing | Keywords, functions, user variables, material names |
| `"` (SDE) | Region / Material / Contact symbol completion |
| ` ` (space) | Tcl subcommand completion (after string/file/info/array/dict) |
| `/` (SDEVICE) | Vector keyword suffix completion |
| `$` (Tcl) | Environment variable completion |
| Mouse hover | Documentation card |
| `F12` | Go to definition |
| `Ctrl+Shift+Space` (SDE) | Function signature help |
