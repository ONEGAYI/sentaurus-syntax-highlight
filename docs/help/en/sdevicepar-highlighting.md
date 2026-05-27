# SDEVICE PAR Syntax Highlighting

SDEVICE PAR parameter files (`*.par`) define the physical properties of materials, regions, and interfaces for the device simulator. Although the syntax looks deceptively similar to Tcl, it is actually a standalone declarative language — there are no `proc`, `set`, or `if` commands. Instead, everything revolves around a three-level hierarchy: scope, block, and parameter. The extension provides dedicated highlighting rules for this unique syntax, and each level is covered below.

## Basic Syntax Structure

The fundamental organization of a `.par` file is a three-level nesting:

```
scopeType = "name" {        ← scope level (e.g., Material, Region)
    blockName {             ← block level (e.g., Bandgap, Epsilon)
        param = value       ← parameter level (e.g., Eg0 = 1.12)
    }
}
```

The scope level declares the object type and name, the block level groups parameters by physical model, and the parameter level is where individual key-value pairs live. The extension assigns distinct colors to each level so you can tell at a glance what structural role the current line plays.

## scopeType Highlighting

Top-level scope declarations serve as the entry point for the entire parameter hierarchy. The following scopeType keywords are highlighted:

| Keyword | Meaning |
|---------|---------|
| `Material` | Material parameters |
| `Region` | Region parameters |
| `Electrode` | Electrode parameters |
| `MaterialInterface` | Material-to-material interface parameters |
| `RegionInterface` | Region-to-region interface parameters |

These keywords render in blue (`keyword.control` under the Dark+ theme), and the name string that follows appears in orange:

```
Material = "Silicon" {      ← Material in blue, "Silicon" in orange
Region = "R1" {             ← Region in blue, "R1" in orange
Electrode = "anode" {       ← Electrode in blue, "anode" in orange
```

## Block Name Highlighting

Inside a scope, physical models appear as named blocks. Block names are rendered in teal (`entity.name.type`), visually separating them from the scopeType keywords above and the parameters below:

```
Bandgap {                   ← block name, teal
    Eg0 = 1.12              ← parameter name, light blue
}
```

Common blocks include `Epsilon`, `Bandgap`, `Scharfetter`, `ConstantMobility`, `DopingDependence`, `HighFieldDependence`, `Auger`, `RadiativeRecombination`, `Kappa`, `Ionization`, `Thermionic`, and `SurfaceRecombination`. Blocks can be nested to arbitrary depth, and inner blocks receive the same teal highlighting.

## Parameter Highlighting

Parameters are key-value pairs where the name on the left side of `=` is highlighted in light blue (`variable.parameter`). The value on the right side is colored according to its type:

- **Numbers**: light green (e.g., `1.12`, `4.73e-4`)
- **Strings**: orange (e.g., `"Silicon"`)
- **SWB variables**: light blue (e.g., `@doping@`)

```
Eg0 = 1.12                  ← Eg0 light blue, 1.12 light green
Chi0 = 4.05                 ← Chi0 light blue, 4.05 light green
alpha = 4.73e-4             ← alpha light blue, 4.73e-4 light green
Insert = "Silicon.par"      ← Insert is a special keyword, see below
```

## Single-Line Nesting

PAR files support declaring a block and its parameters on a single line, which is common for short configurations:

```
Bandgap { Eg0 = 1.12 }      ← block + parameter on the same line
```

The extension correctly handles this inline nesting — the block name and parameter name each receive their own coloring, and no highlighting is lost due to the compact layout.

## Include and Insert Statements

There are two ways to reference external files in PAR files:

- **`Insert`**: Includes the contents of another `.par` file within a scope. The `Insert` keyword is highlighted with a distinct color (`support.class`), and the file path string that follows is rendered in orange:

  ```
  Material = "Silicon" {
      Insert = "Silicon.par"     ← Insert in distinct color, path in orange
  }
  ```

- **`#include`**: A preprocessor-level file inclusion, highlighted as a preprocessor directive.

## Comments

PAR files support two comment styles:

- Everything after `#` is a line comment, rendered in gray
- Lines starting with `*` are also comments — a common convention in the Sentaurus toolchain

```
# This is a line comment
* This is also a comment — often used to describe physical formulas
Eg0 = 1.12    # trailing comment
```

Note that `*` comments can appear at the beginning of a line or after whitespace (used for inline annotations describing physical model formulas).

## Preprocessor Directives

Like other Sentaurus tools, PAR files support C-style preprocessor directives:

```
#define THICKNESS 0.1
#ifdef @Material@
  Material = "Silicon" { ... }
#endif
```

Directives such as `#define`, `#ifdef`, `#ifndef`, `#else`, and `#endif` are highlighted in blue. Macro names defined with `#define` receive a special type color, and their subsequent occurrences in code (in the form `_MACRO_NAME`) are also recognized.

## Strings and Numbers

- **Double-quoted strings**: rendered in orange. They support `@SWBVar@` SWB variables (light blue) and `\"` escape sequences inside
- **Numeric literals**: rendered in light green. Integers, decimals, and scientific notation (e.g., `1.12`, `4.73e-4`, `2.8e-31`) are all supported
- **Function expressions**: function calls inside parentheses (e.g., `TempDep(...)`) have the function name highlighted in yellow

## Function Expression Highlighting

Occasionally, function-style expressions appear in PAR files, such as `TempDep(...)` or `ExpTempDep(...)`. The extension highlights the function name in yellow (`entity.name.function`), and the content inside the parentheses supports number and string highlighting as usual.

## Tcl-like but Not Tcl

Although PAR syntax visually resembles Tcl — same `{}` grouping, `#` comments, double-quoted strings — it does not support Tcl's control flow or variable manipulation commands. The extension deliberately uses an independent set of grammar rules that only highlights elements actually present in PAR files, preventing Tcl command keywords from being mistakenly marked up.

## Code Snippets

The extension provides two types of snippet support for PAR files:

**Native VSCode Snippets** (22 snippets): Type a prefix and press `Tab` to expand. They cover the most commonly used structural templates:

| Prefix | Content |
|--------|---------|
| `material` | Material top-level block |
| `region` | Region top-level block |
| `electrode` | Electrode top-level block |
| `bandgap` | Bandgap model (with Silicon defaults) |
| `epsilon` | Dielectric constant |
| `scharfetter` | SRH recombination lifetime |
| `constmob` | Constant mobility |
| `dopingmob` | Doping-dependent mobility |
| `hfd` | High-field dependence |
| `auger` | Auger recombination coefficients |
| `mat-si` | Material Silicon full skeleton |
| `mat-oxide` | Material Oxide full skeleton |
| `insert` | Insert external parameter file reference |
| ... | and more |

**QuickPick Snippets** (`sentaurus.insertSnippet` command): A multi-level menu triggered from the command palette, organized by Material / Region / Electrode / Interface / Section / Misc categories. Each snippet includes a description.
