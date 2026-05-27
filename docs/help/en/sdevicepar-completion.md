# SDEVICE PAR Auto Completion

The completion system for PAR files is built around the scope → block → parameter hierarchy. It automatically determines what you should type next based on cursor position.

## Three-Level Completion

**scopeType level** — triggered when the cursor is at the top level of the file (not inside any `{}`). The extension lists all available scope types:

```
Material = "${1:name}" {    ← auto-generated template on selection
    ${0}
}
```

The completion list includes six types: `Material`, `Region`, `Electrode`, `Interface`, `MaterialInterface`, and `RegionInterface`. Selecting one inserts the full scope declaration skeleton.

**Block level** — triggered when the cursor is inside a scope but outside any block. For example, with the cursor inside `Material "Silicon" { }`, the extension aggregates all available physical model block names: `Bandgap`, `Epsilon`, `Scharfetter`, `ConstantMobility`, `DopingDependence`, and so on.

There is an aggregation mechanism at work: the extension does not just look at blocks defined in the current scope instance — it also **aggregates across scopes of the same type**. If another `Material "Oxide"` defines a `Kappa` block, you will see `Kappa` as a candidate while typing inside `Material "Silicon"`, since they share the same `Material` type and the underlying physical models are common.

**Parameter level** — triggered when the cursor is inside a block. For example, inside `Bandgap { }`, the extension lists parameter names such as `Eg0`, `Chi0`, and `alpha`. Selecting a parameter automatically appends ` = ` so you can type the value right away. For parameters that already have a value, the detail text shows the current value (e.g., `[par] = 1.12`) for quick reference.

Similar to the block level, parameter completion also aggregates across scopes of the same type — parameters from `Bandgap` blocks in different Material instances are merged.

## Scope Name Completion

When typing inside the quotes of a scope declaration (e.g., `Material = "|"`), the extension automatically suggests scope names that have already been defined for the same type. If `Material "Silicon"` exists in another `.par` file in your workspace or in the MaterialDB, you will see `Silicon` as a candidate.

## Completion Sources and Priority

Completion data comes from four tiers, listed from highest to lowest priority:

| Source | Description |
|--------|-------------|
| **current** | The file currently being edited |
| **include** | Files pulled in via `include` or `Insert` statements in the current file |
| **workspace** | All other `.par` files in the workspace (automatically scanned in the background) |
| **materialdb / builtin** | The MaterialDB database or built-in placeholder data |

When the same symbol exists in multiple sources, the highest-priority one wins. Each completion item shows a **Source** field (the originating filename) so you can tell exactly where a suggestion came from.

## Include Chain Recursion

`include "file.par"` and `Insert = "file.par"` statements are resolved recursively — the extension follows the include chain down to a maximum depth of 8 levels, merging symbols from all included files into the completion pool (marked as `include` source). Circular references are detected and skipped automatically.

## MaterialDB Integration

Through the `sentaurus.materialDbPath` configuration, you can point the extension to a MaterialDB directory. All `.par` files under that directory are parsed and their material parameters become available in completion. Two common file formats are supported:

- **Top-level block format**: The file starts directly with `Bandgap { ... }`. The extension infers the material name from the filename (e.g., `Silicon.par` → `Silicon`) and creates a synthetic Material scope wrapper.
- **Explicit scope format**: The file already contains `Material "Silicon" { ... }` declarations, which are used directly.

Both formats produce identical completion results, so you never need to worry about the difference.

For configuration details and built-in placeholder data, see the [Configuration](configuration.md#sentaurus-par-materialdb) page.

## Workspace Scanning

On activation, the extension automatically scans all `.par` files in the current workspace and builds an index. File creation, modification, and deletion events are monitored in real time so the completion suggestions always reflect the latest workspace state.

Scanning progress is displayed in the VSCode status bar. If a completion request arrives before the workspace scan finishes, the extension returns available results first (current file + MaterialDB) and delivers the full set on the next trigger once scanning is complete.
