# Snippets

The extension provides two snippet mechanisms that cover all 7 Sentaurus TCAD languages, helping you scaffold simulation scripts quickly.

---

## VSCode Native Snippets

Native snippets pop up automatically as you type a prefix. Current coverage:

| Language | Details |
|----------|---------|
| SDEVICE PAR | 22 snippets — Material/Region/Electrode top-level blocks, physics model parameter blocks (Epsilon, Bandgap, Scharfetter, etc.), and complete Silicon/Oxide material skeletons |
| SDE / SDEVICE / SPROCESS / EMW / Inspect / Svisual | Placeholder slots reserved, no content yet |

The SDEVICE PAR native snippets are particularly useful: they ship with Silicon default physical parameter values (mobility, bandgap, SRH lifetime, etc.), saving you from repeatedly looking them up in the manual. Common prefixes include `material`, `region`, `electrode`, `bandgap`, `scharfetter`, `constmob`, and `mat-si` (full Silicon skeleton).

> The full list of native snippets is available via **Preferences: Configure User Snippets** in VSCode.

---

## QuickPick Command Snippets

Run `Sentaurus: Insert Snippet` from the Command Palette to open a two-level menu: pick a tool category first, then browse that tool's snippet collection.

### Coverage

| Tool | Snippet Categories |
|------|--------------------|
| **Sentaurus-StructEditor** | Contact (Body / Edge-Face / Interface-3D), Doping (Const-box / Const-material / Const-region / Gauss / Submesh), Meshing (Ref-box / Ref-material / Ref-region) |
| **Sentaurus-Device** | CurrentPlot, Electrode, File, Math, Physics (BandGap / General / Mobility / Recombination / Traps / optics-related), Plot (Basic-Set / Extensive-Set), Solve (Initial-Solve / QuasiStat / Transient / ACcoupled), System |
| **Sentaurus-DevicePar** | Material (Silicon / Oxide / Generic), Region, Electrode, Interface (RegionInterface / MaterialInterface), Section (Epsilon / Bandgap / Scharfetter / ConstantMobility, etc.), Misc |
| **Sentaurus-Process** | Deposit, Diffuse, Etch, Implant, ICWB (Line / Load-layout / Create-mask, etc.), Init, Mask, Photo, MeshGoals, RefineBox, Struct |
| **Sentaurus-Inspect** | Curve (Axis-Attributes / CV-Curve / IV-Curve / Curve-Attributes, etc.), Extract (MOS-IdVg / MOS-IdVd / Misc) |
| **Sentaurus-Mesh** | EMW basic and advanced mesh templates |

Each snippet includes tab stops — after insertion, press Tab to jump through the placeholders you need to fill in.

### SDE Snippet Prefix Variables

SDE QuickPick snippets have a special design: the generated code automatically includes prefixed variable names for easy tracking and cross-referencing. For example, inserting a Gauss doping snippet produces code like:

```scheme
(sdedr:define-gaussian-profile (string-append "GAUSS." NAME) ...)
(sdedr:define-analytical-profile-placement (string-append "IMP." NAME) ...)
```

Here `GAUSS.` and `IMP.` are the prefixes. Their defaults can be customized in settings — 10 configurable prefixes in total:

| Setting | Meaning | Default |
|---------|---------|---------|
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

If your project follows its own naming convention, changing these prefixes will make all SDE snippets adapt automatically.

---

## Expression Converter

SDE uses Scheme prefix notation, which can be unintuitive to write. The extension provides two commands to bridge this gap:

- `Sentaurus: Scheme to Infix` — converts `(sqrt (+ (* a b) c))` to `sqrt(a * b + c)`
- `Sentaurus: Infix to Scheme` — converts `sqrt(a * b + c)` back to `(sqrt (+ (* a b) c))`

### Supported Operations

The converter covers common arithmetic operators and math functions:

**Arithmetic** — `+` `-` `*` `/` (where `+` and `*` support multi-argument forms, e.g. `(+ a b c)` ↔ `a + b + c`)

**Special operators** — `^` (power), `%` (modulo), `%%` (remainder), `//` (integer quotient)

**Math functions** — `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `abs`, `exp`, `log`, `floor`, `ceil`, `round`, `min`, `max`

### Angle-Bracket Syntax for Hyphenated Variables

Scheme identifiers can contain hyphens (e.g. `W-doping`), but in infix notation a hyphen looks exactly like a minus sign. The converter uses angle brackets to disambiguate:

```
Infix:  <W-doping> + 1.0
Prefix: (+ W-doping 1.0)
```

When entering an infix expression, simply wrap hyphenated identifiers with `<var-name>`.

### Smart Completion in the Input Box

The expression converter input box supports cursor-position-aware variable completion. Move your cursor to any identifier, and the completion list filters to matching variable names automatically.

There is also a history mode for recalling previous conversions:

| Input | Effect |
|-------|--------|
| `!` | Show full history |
| `!3` | Select the 3rd history entry directly |
| `! keyword` | Fuzzy-filter history entries containing the keyword |

Run `Sentaurus: Expression Help` at any time to see the complete list of supported operators and functions.
