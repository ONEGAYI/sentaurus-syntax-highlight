# Scheme Built-in Function Documentation — Design Spec

**Date**: 2026-04-10
**Status**: Approved
**Scope**: SDE language only, R5RS standard functions

## Background

v0.3.0 added hover/completion docs for 400 SDE KEYWORD1 API functions via `sde_function_docs.json`. The SDE FUNCTION category contains 204 Scheme built-in functions that currently have no documentation. This spec covers adding docs for the ~187 R5RS-standard functions; 17 SDE-specific extensions (e.g. `system`, `getenv`, `define-macro`) are deferred.

## Data Format

**File**: `syntaxes/scheme_function_docs.json`

Same structure as `sde_function_docs.json`:

```json
{
  "abs": {
    "signature": "(abs x)",
    "description": "Returns the absolute value of x.",
    "parameters": [
      { "name": "x", "type": "number", "desc": "A real number" }
    ],
    "example": "(abs -7)  => 7"
  }
}
```

- Keys use original Scheme names (e.g. `string->list`, not HTML-encoded).
- Special forms (`if`, `cond`, `lambda`, `define`, `let`, etc.) use the same format; `description` notes they are special forms.
- Parameter types use R5RS type names: `number`, `string`, `char`, `list`, `pair`, `any`, `boolean`, `symbol`, `port`, `procedure`, etc.
- Examples use `=>` for result values.

## Extension Integration

In `src/extension.js` `activate()`:

1. Load `scheme_function_docs.json` after loading `sde_function_docs.json`.
2. Merge with spread operator: `funcDocs = { ...funcDocs, ...schemeDocs }`.
3. No other changes needed — `buildItems()` and `HoverProvider` already match by keyword name.

Key insight: SDE API doc keys are namespaced (`sdegeo:create-circle`), so there is no collision with bare Scheme names (`list`, `string`, `if`).

## Production Plan

Source: `references/r5rs-errata.md` Chapter 6 (primary), `references/r7rs-small.md` (supplementary for edge cases).

10 batches by R5RS section:

| Batch | R5RS Section | Count | Examples |
|-------|-------------|-------|---------|
| B1 | §6.1 Booleans | 4 | `boolean?`, `not` |
| B2 | §6.2 Equivalence predicates | 3 | `eq?`, `eqv?`, `equal?` |
| B3 | §6.3 Pairs and lists | 31 | `cons`, `car`, `cdr`, `map` |
| B4 | §6.4-6.5 Numbers + operations | 40 | `+`, `-`, `sin`, `cos`, `abs` |
| B5 | §6.6 Characters | 20 | `char=?`, `char->integer` |
| B6 | §6.7 Strings | 21 | `string-length`, `string-append` |
| B7 | §6.8 Symbols | 2 | `symbol?` |
| B8 | §6.9 Control features | 25 | `if`, `cond`, `lambda`, `define` |
| B9 | §6.10 Input/Output | 20 | `read`, `write`, `display` |
| B10 | Vectors + System + misc | 21 | `vector?`, `procedure?`, `apply` |

Each batch:
1. Read the corresponding section from `r5rs-errata.md`.
2. Extract functions that appear in the SDE FUNCTION list (excluding the 17 SDE extensions).
3. Generate structured JSON entries.
4. Append to `syntaxes/scheme_function_docs.json`.

Quality: All content sourced from R5RS text, no fabrication.

## Deferred

- 17 SDE-specific extensions: `system`, `getenv`, `define-macro`, `cond-expand`, `catch`, `exit`, `fluid-let`, `nil`, `reverse!`, `substring`, `gensym`, `delete-file`, `file-exists?`, `file-or-directory-modify-seconds`, `get-output-string`, `open-input-string`, `open-output-string`.
- Tcl built-in functions for inspect/sprocess/sinterconnect/spptcl (106-128 per language).
