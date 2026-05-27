# Syntax Highlighting

The extension provides out-of-the-box syntax highlighting for all 7 Sentaurus TCAD tool languages. When you open a file, the editor automatically detects the language based on the filename and activates the corresponding highlighting rules — no manual language mode selection needed.

## Supported Languages

| Language | Tool | File Pattern | Dialect |
|----------|------|-------------|---------|
| SDE | Structure Editor | `*_dvs.cmd`, `.scm` | Scheme |
| SDEVICE | Device Simulator | `*_des.cmd` | Tcl |
| SPROCESS | Process Simulator | `*_fps.cmd`, `.fps` | Tcl |
| EMW | EM Wave | `*_eml.cmd`, `*_emw.cmd` | Tcl |
| Inspect | Inspect | `*_ins.cmd` | Tcl |
| Svisual | Sentaurus Visual | `*_vis.tcl` | Tcl |
| SDEVICE PAR | Device Material DB | `*.par` | Tcl-like |

Most tools share the `.cmd` extension. The extension distinguishes them by **pattern keywords** in the filename (such as `_des`, `_fps`, `_ins`) rather than relying on file extensions.

## Highlighting Coverage

Syntax highlighting covers the following elements:

### Comments

SDE (the Scheme dialect) uses a semicolon for line comments, while the other 6 Tcl dialects use `#`. Additionally, several Tcl tools (SPROCESS, EMW, Inspect, Svisual) also support lines starting with `*` — a common convention in the Sentaurus toolchain.

```scheme
; SDE comment — starts with semicolon
(sdegeo:create-rectangle ...)
```

```tcl
# Tcl comment — starts with hash
* This is also a valid comment — starts with asterisk (some Tcl tools)
Physics { ... }
```

### Keywords

Each language organizes keywords into multiple semantic tiers, distinguished by color:

| Tier | Meaning | Color (Dark+ theme) | Examples |
|------|---------|---------------------|----------|
| Control flow | Flow control commands | Blue | `if`, `for`, `foreach`, `while`, `return` |
| Tier 1 keywords | Core tool commands | Blue | `Physics`, `Solve`, `deposit`, `etch` |
| Tier 2 keywords | Command options and parameters | White (default foreground) | Process parameter options |
| Tier 3 keywords | Parameter values / enum values | Blue | Material properties, physics model parameters |
| Tier 4 keywords | Namespace functions | Teal | `pdb*`, `rfx::`, `const::` |
| Functions | Tool-specific functions + Tcl built-ins | Yellow | `set`, `puts`, `create_plot` |
| Scheme functions | SDE API commands (401 total) | Yellow | `sdegeo:create-rectangle`, `sde:build-mesh` |
| Material names | Material identifiers (SDE, 1974 total) | Teal | `"Silicon"`, `"Oxide"`, `"GaAs"` |

> **Tip**: The colors above are based on the built-in Dark+ theme. If you use a different theme (Monokai, One Dark Pro, etc.), the exact colors may vary, but the tiered distinction remains effective.

### Strings and Numbers

Double-quoted strings render in orange. Numeric literals — including scientific notation such as `1e-6` and `3.14e10` — render in light green. SPROCESS additionally highlights physical unit symbols (e.g., `<cm>`, `<um>`) in light green.

### SWB Environment Variables

Sentaurus Workbench (SWB) passes parameters using the `@variable@` format. The extension highlights these parameters in light blue, making them stand out in your code:

```tcl
set base_doping @doping@
set width @width@
```

### Preprocessor Directives

The Sentaurus toolchain supports C-style preprocessor directives. The extension highlights the following directives and their content:

```tcl
#define MY_VALUE 1.0
#ifdef @Simulation@
  Physics { ... }
#else
  Math { ... }
#endif
```

Macro names defined with `#define` are highlighted in blue, and the entire preprocessor block (`#ifdef` ... `#endif`) is correctly recognized.

### Tcl Subcommands

All 5 Tcl dialects support context-aware highlighting for subcommands of the `string`, `file`, `info`, `array`, and `dict` master commands. When you write `string length`, both the master command and the subcommand are properly colored:

```tcl
string length "hello"     ; length highlighted as a subcommand
file exists "/tmp/data"   ; exists highlighted as a subcommand
info exists myvar          ; exists highlighted as a subcommand
```

## SDEVICE Semantic Highlighting

SDEVICE features an additional semantic highlighting system that tracks `{}` nesting depth to understand the current context:

| Token Type | Meaning | Description |
|-----------|---------|-------------|
| Section name | Top-level section names | e.g., `Physics`, `Math`, `Solve`, `System` |
| SubSection name | Sub-section identifiers | e.g., `QuasiStationary`, `Coupled`, `Transient` |
| Section keyword | Section-specific parameters | The same keyword may carry different semantics in different sections |

This means that in `Physics { Recombination { ... } }`, `Physics`, `Recombination`, and their respective inner parameters are tagged with different semantic tokens, helping you visually distinguish nested structures.

> **Note**: Semantic tokens fall back to the default editor foreground color under the Dark+ theme (i.e., no additional coloring). To see the distinction, you can customize colors via `editor.semanticTokenColorCustomizations` in your `settings.json`.

### SDEVICE PAR Parameter Files

SDEVICE PAR parameter files (`*.par`) use a standalone declarative syntax — a three-level scope → block → parameter hierarchy that differs significantly from standard Tcl. The extension provides dedicated highlighting rules for this structure, with distinct colors for scopeType keywords, physical model block names, parameter assignments, Insert references, and more. Single-line nesting and preprocessor directives are also supported. See [SDEVICE PAR Syntax Highlighting](sdevicepar-highlighting.md) for details.

## Code Folding

All 7 languages support code folding. You can collapse code blocks using the fold arrows next to line numbers or keyboard shortcuts:

- **SDE**: Fold based on Scheme parenthesis levels `( ... )`
- **Tcl tools**: Fold based on curly brace levels `{ ... }`
- **Preprocessor blocks**: Code between `#ifdef` ... `#endif` can be folded as a single block
- **SDEVICE**: Top-level sections (e.g., `Physics { ... }`) can be folded independently

## Bracket Balance Diagnostics

The extension checks bracket balance in real time and reports mismatches:

- **SDE**: Checks parenthesis `()` balance
- **Tcl tools**: Checks curly brace `{}` balance
- **Diagnostic messages** appear in the Problems panel and are marked with squiggly underlines in the editor
