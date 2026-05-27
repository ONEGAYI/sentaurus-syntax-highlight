# Configuration

> Search for `sentaurus` in VSCode Settings to view and modify all configuration options.

---

## Sentaurus TCAD Syntax

### Snippet Prefixes

SDE snippets (QuickPick Command Palette → `Sentaurus: Insert Snippet`) generate statements with an editable **prefix variable name**. The following settings control the default prefix for each category:

| Setting | Description | Default |
|---------|-------------|---------|
| `sentaurus.snippetPrefixes.RW` | Refinement Window | `RW.` |
| `sentaurus.snippetPrefixes.DC` | Doping Constant | `DC.` |
| `sentaurus.snippetPrefixes.CPP` | Constant Profile Placement | `CPP.` |
| `sentaurus.snippetPrefixes.CPM` | Constant Profile Material | `CPM.` |
| `sentaurus.snippetPrefixes.GAUSS` | Gaussian Profile | `GAUSS.` |
| `sentaurus.snippetPrefixes.IMP` | Analytical Profile Placement | `IMP.` |
| `sentaurus.snippetPrefixes.SM` | Submesh | `SM.` |
| `sentaurus.snippetPrefixes.PSM` | Submesh Placement | `PSM.` |
| `sentaurus.snippetPrefixes.RS` | Refinement Size | `RS.` |
| `sentaurus.snippetPrefixes.RP` | Refinement Placement | `RP.` |

### Definition Text Display Width

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| `sentaurus.definitionMaxWidth` | Maximum characters per line in user-defined variable/function hover tooltips. Set to 0 to disable truncation | `60` | 0–200 |

---

## Sentaurus Environment Variables

| Setting | Description | Scope |
|---------|-------------|-------|
| `sentaurus.environmentVariables` | SWB pre-injected environment variable allowlist. Keys are variable names, values are Hover documentation (leave empty to show variable name only). Changes take effect immediately | `resource` (configurable per workspace) |

Variables in the allowlist receive the following features:

- **Hover documentation**: Mouse hover displays the documentation specified in settings
- **Auto completion**: Appears in the completion list when typing `$` or `@`, marked as `🏠 Environment Variable`
- **Diagnostic exemption**: Will not trigger "undefined variable" warnings

The extension also provides 4 management commands:

| Command | Description |
|---------|-------------|
| `Sentaurus: Add Environment Variables` | Batch add environment variables to the allowlist |
| `Sentaurus: Remove Environment Variables` | Remove variables from the allowlist |
| `Sentaurus: Export Environment Variables` | Export the current allowlist as a JSON file |
| `Sentaurus: Import Environment Variables` | Import environment variables from a JSON file |

---

## Sentaurus PAR MaterialDB

| Setting | Description | Scope |
|---------|-------------|-------|
| `sentaurus.materialDbPath` | Absolute path to a MaterialDB directory containing `.par` files. Leave empty to use built-in placeholder data | `machine` |

When set, all direct child `.par` files in the directory will be parsed, and their parameters become available in completion (marked as `materialdb` source).

**Priority**: `materialdb` source has lower priority than `current` / `include` / `workspace`. If the same symbol exists in workspace, the workspace definition takes precedence.
