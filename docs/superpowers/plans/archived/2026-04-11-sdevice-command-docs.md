# sdevice Command Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover and completion documentation for 297 sdevice keywords (KEYWORD1 + KEYWORD2 + KEYWORD3) by creating a command docs JSON file and integrating it into the extension.

**Architecture:** Create `syntaxes/sdevice_command_docs.json` with enhanced format (section, signature, description, parameters, example, keywords). Load it in `extension.js` alongside existing SDE/Scheme docs. Enhance `formatDoc()` to display section labels.

**Tech Stack:** VSCode Extension API (JavaScript/Node.js), JSON, TextMate grammar

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `syntaxes/sdevice_command_docs.json` | Create | All 297 command doc entries |
| `src/extension.js` | Modify (2 locations) | Load sdevice docs + enhance formatDoc |
| `references/sdevice_ug_T-2022.03.md` | Read-only | Appendix G (line 9104-9912): primary data source for command syntax |

---

### Task 1: Enhance formatDoc() and load sdevice docs in extension.js

**Files:**
- Modify: `src/extension.js:67-82` (formatDoc function)
- Modify: `src/extension.js:137-142` (activate function, docs loading)

- [ ] **Step 1: Enhance formatDoc() to display section label**

In `src/extension.js`, modify the `formatDoc()` function to show the section tag when present:

```js
function formatDoc(doc) {
    const lines = [];
    lines.push(`**${doc.signature}**`);
    if (doc.section) {
        lines.push('');
        lines.push(`*Section: ${doc.section}*`);
    }
    lines.push('');
    lines.push(doc.description);
    if (doc.parameters && doc.parameters.length) {
        lines.push('');
        lines.push(DOC_LABELS.parameters);
        for (const p of doc.parameters) {
            lines.push(`- \`${p.name}\` (\`${p.type}\`) — ${p.desc}`);
        }
    }
    if (doc.example) {
        lines.push('');
        lines.push(DOC_LABELS.example);
        lines.push('```tcl');
        lines.push(doc.example);
        lines.push('```');
    }
    if (doc.keywords && doc.keywords.length) {
        lines.push('');
        lines.push(`*Keywords: ${doc.keywords.join(', ')}*`);
    }
    return new vscode.MarkdownString(lines.join('\n'));
}
```

Changes:
1. Add `if (doc.section)` block after signature
2. Change code block language from `scheme` to `tcl` (sdevice uses Tcl)
3. Add `if (doc.keywords)` block at the end

- [ ] **Step 2: Load sdevice command docs in activate()**

In `src/extension.js`, add loading of sdevice docs after the scheme docs loading (around line 142):

```js
    // 加载 Scheme 内置函数文档并合并
    const schemeDocs = loadDocsJson('scheme_function_docs.json', useZh);
    if (schemeDocs) {
        Object.assign(funcDocs, schemeDocs);
    }

    // 加载 sdevice 命令文档并合并
    const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', useZh);
    if (sdeviceDocs) {
        Object.assign(funcDocs, sdeviceDocs);
    }
```

- [ ] **Step 3: Commit code changes**

```bash
git add src/extension.js
git commit -m "feat: add sdevice command docs loading and enhanced formatDoc"
```

---

### Task 2: Create KEYWORD1 docs (25 top-level commands)

**Files:**
- Create: `syntaxes/sdevice_command_docs.json` (initial)
- Read: `references/sdevice_ug_T-2022.03.md:9104-9160` (Appendix G: Top Level, CurrentPlot, Device, Electrode, File, GainPlot, HydrogenBoundary, IFM)
- Read: `references/sdevice_ug_T-2022.03.md:9171-9298` (Appendix G: Math)
- Read: `references/sdevice_ug_T-2022.03.md:9298-9312` (Appendix G: NoisePlot, NonLocalPlot, OpticalDevice)
- Read: `references/sdevice_ug_T-2022.03.md:9314-9760` (Appendix G: Physics)
- Read: `references/sdevice_ug_T-2022.03.md:9760-9890` (Appendix G: Plot, RayTraceBC, Solve, System, TensorPlot, Thermode, Various)

**Strategy:** For each KEYWORD1 entry, extract from Appendix G tables:
- The section it belongs to
- Syntax from the table
- Description from the table
- Key sub-keywords from the table

The 25 KEYWORD1 entries are:
`Electrode`, `eSHEDistributionPlot`, `CurrentPlot`, `Math`, `OpticalDevice`, `hSHEDistributionPlot`, `HydrogenBoundary`, `FarFieldPlot`, `Plot`, `File`, `BandstructurePlot`, `Thermode`, `Solve`, `VCSELNearFieldPlot`, `MonteCarlo`, `Device`, `System`, `NonlocalPlot`, `TensorPlot`, `GainPlot`, `Physics`, `TrappedCarDistrPlot`, `RayTraceBC`, `NoisePlot`, `PlotGainPara`

**JSON format example** (from Appendix G Table 201):
```json
{
  "Electrode": {
    "section": "global",
    "signature": "Electrode { { Name=\"<name>\" Voltage=<float> } ... }",
    "description": "Defines electrical contacts on the device boundary. Each contact specifies a name, applied voltage or current, and optional material properties.",
    "parameters": [
      {"name": "Name", "type": "string", "desc": "Electrode identifier name"},
      {"name": "Voltage", "type": "float", "desc": "Contact voltage [V]"},
      {"name": "Current", "type": "float", "desc": "Current boundary condition [A/μm·d^-3]"},
      {"name": "Material", "type": "string", "desc": "Electrode material for insulator contacts"}
    ],
    "example": "Electrode {\n  { Name=\"source\" Voltage=0.0 }\n  { Name=\"gate\" Voltage=0.0 }\n  { Name=\"drain\" Voltage=0.2 }\n}",
    "keywords": ["Name", "Voltage", "Current", "Charge", "Material", "Barrier", "Resist", "Schottky", "Workfunction", "AreaFactor", "Extraction"]
  }
}
```

- [ ] **Step 1: Write all 25 KEYWORD1 entries**

Read Appendix G tables for each command. Primary source locations:
- Table 201: Top Level (Electrode, Device, OpticalDevice, Solve, System)
- Table 202: CurrentPlot
- Table 205: Device section contents (CurrentPlot, Electrode, File, GainPlot, HydrogenBoundary, IFM, Math, MonteCarlo, NoisePlot, NonLocalPlot, Physics, Plot, RayTraceBC, TensorPlot, Thermode, TrappedCarDistrPlot)
- Table 206: Electrode keywords
- Table 207: File keywords
- Table 208: GainPlot keywords
- Table 209: HydrogenBoundary keywords
- Table 211: Math keywords
- Table 234: NoisePlot keywords
- Table 236: Physics keywords
- Table 334: Plot keywords
- Table 336: RayTraceBC keywords
- Table 337: Solve keywords
- Table 355: System keywords
- Table 358: Thermode keywords

For each entry:
1. Set `section` based on which table it appears in (e.g., "global" for top-level, "Physics" for Physics sub-commands)
2. Write `signature` from the table syntax column
3. Write `description` summarizing the table description column
4. List main `parameters` (3-6 most important)
5. Write a short `example` if available in the manual
6. List `keywords` from the table

- [ ] **Step 2: Validate JSON**

```bash
python3 -c "import json; json.load(open('syntaxes/sdevice_command_docs.json')); print('Valid JSON')"
```

- [ ] **Step 3: Commit KEYWORD1 docs**

```bash
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): add KEYWORD1 command docs (25 entries)"
```

---

### Task 3: Add KEYWORD2 docs (31 Solve sub-commands)

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Read: `references/sdevice_ug_T-2022.03_2.md:4993-6450` (Chapter 4: Numeric Experiments)
- Read: `references/sdevice_ug_T-2022.03.md:9776-9864` (Appendix G: Solve, System)

**Strategy:** KEYWORD2 contains Solve sub-commands and control structures. Extract from Chapter 4 and Appendix G Table 337.

The 31 KEYWORD2 entries are:
`PlotFarField`, `CurrentPlot`, `BreakCriteria`, `Isource_pset`, `PlotLEDRadiation`, `HB`, `Plot`, `Window`, `VCVS_pset`, `PlotBandstructure`, `Resistor_pset`, `VCCS_pset`, `SpectralPlot`, `PlotGain`, `Capacitor_pset`, `Continuation`, `Extraction`, `ACCoupled`, `CCVS_pset`, `SolveSpectrum`, `Goal`, `Diode_pset`, `Transient`, `DopingWell`, `HBCoupled`, `Plugin`, `Vsource_pset`, `CoordinateSystem`, `SaveOptField`, `Coupled`, `QuasiStationary`

- [ ] **Step 1: Write all 31 KEYWORD2 entries**

For each entry, determine:
- `section`: "Solve" for solve sub-commands, "System" for circuit elements (Resistor_pset, Vsource_pset, etc.), "Math" for math-related
- `signature`: from Chapter 4 syntax descriptions or Appendix G
- `description`: from the manual
- `parameters`: main options (e.g., InitialStep, MaxStep, MinStep, Goal for QuasiStationary)
- `example`: from Chapter 4 examples

- [ ] **Step 2: Validate and commit**

```bash
python3 -c "import json; d=json.load(open('syntaxes/sdevice_command_docs.json')); print(f'Total entries: {len(d)}')"
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): add KEYWORD2 Solve sub-command docs (31 entries)"
```

---

### Task 4: Add KEYWORD3 batch 3a — Physics core models (~80 entries)

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Read: `references/sdevice_ug_T-2022.03.md:9314-9655` (Appendix G: Physics section)
- Read: `references/sdevice_ug_T-2022.03_2.md:447-2600` (Part II: Physics chapters)

**Entries 1-80 of KEYWORD3:**
`ParameterVariation`, `Doping`, `Tunneling`, `CurrentPlot`, `Error`, `Broadening`, `TimeDependence`, `MeshDomain`, `Radiation`, `MultiValley`, `hBandEdgeShift`, `IntensityDistribution`, `RayDistribution`, `Model`, `SourceRaysFromFile`, `SourcePosition`, `DevicePower`, `GridAdaptation`, `RecGenHeat`, `h`, `v`, `MATH`, `VCSEL`, `Circle`, `Current`, `RaysRandomOffset`, `FromElementGrid`, `ClusterActive`, `ObservationNode`, `ParDiSo`, `Traps`, `TEPower`, `Mechanics`, `Randomize`, `Skip`, `Sweep`, `Deformation`, `SensorSweep`, `QWLocal`, `eBandEdgeShift`, `MetalWorkfunction`, `Delaunizer3d`, `PrintSourceVertices`, `GMRES`, `LEDSpectrum`, `Bidirectional`, `ComplexRefractiveIndex`, `OpticsFromFile`, `Meshing`, `eHCSDegradation`, `ParallelLicence`, `Charge`, `AvaHomotopy`, `FEScalar`, `TMM`, `Grading`, `IALMob`, `MetalTEPower`, `NewtonPlot`, `NonLocal`, `Minimum`, `ErrRef`, `BalMob`, `Aniso`, `eSubband`, `PeriodicBC`, `p`, `Window`, `OpticalSolver`, `Set`, `t`, `Thermal`, `Angular`, `Tone`, `Gamma`, `MVMLDAcontrols`, `GaussianQuadrature`, `ThinLayer`, `PrintORArays`

- [ ] **Step 1: Write entries 1-80 of KEYWORD3**

For Physics-related entries, set `section` to "Physics". For Math-related entries (NewtonPlot, ParDiSo, GMRES, etc.), set `section` to "Math". For Plot-related entries (CurrentPlot, Window), set `section` accordingly.

Many KEYWORD3 entries are short model names or options — for these, a brief description is sufficient:
```json
{
  "Doping": {
    "section": "Physics",
    "signature": "Doping",
    "description": "Specifies doping-dependent models for carrier statistics and mobility.",
    "keywords": ["DopingDependence", "TempDependence"]
  }
}
```

- [ ] **Step 2: Validate and commit**

```bash
python3 -c "import json; d=json.load(open('syntaxes/sdevice_command_docs.json')); print(f'Total entries: {len(d)}')"
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): add KEYWORD3 Physics core model docs (entries 1-80)"
```

---

### Task 5: Add KEYWORD3 batch 3b — Physics advanced models (~80 entries)

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Read: `references/sdevice_ug_T-2022.03.md:9468-9760` (Appendix G: Physics LED, Mobility, Radiation, Various)
- Read: `references/sdevice_ug_T-2022.03_1.md:1-4200` (Part III: advanced physics chapters)

**Entries 81-160 of KEYWORD3:**
`eMultiValley`, `DiffusionNoise`, `Rectangle`, `RHSCoef`, `MSConfigs`, `MLDAbox`, `SponEmissionIntegration`, `TransientError`, `GateCurrent`, `Criterion`, `RecBoxIntegr`, `Fermi`, `Laser`, `Transition`, `TraceSource`, `HydrogenReaction`, `Polygon`, `eNMP`, `freq`, `BPM`, `Extrapolate`, `Time`, `UserWindow`, `AxisAligned2d`, `AxisAligned3d`, `NonLocalPath`, `SimStats`, `HeatSource`, `hQuantumPotential`, `Strain`, `hMultiValley`, `RayTracing`, `DensityIntegral`, `Barrier`, `Mobility`, `DeterministicProblem`, `Boundary`, `eQuantumPotential`, `Integrate`, `LED`, `DFB`, `Degradation`, `SingletExciton`, `IncompleteNewton`, `HBPlot`, `LatticeTemperature`, `BarrierType`, `Volume`, `Dipole`, `ImportDomain`, `Gaussian`, `Absorption`, `Node`, `DopingVariation`, `TransientErrRef`, `eSHEDistribution`, `EffectiveIndex`, `HydrogenMolecule`, `PrintRayInfo`, `Condition`, `DualGridInterpolation`, `ExternalBoltzmannSolver`, `Line`, `EffectiveIntrinsicDensity`, `Voltage`, `InnerDevicePower`, `StimEmissionCoeff`, `When`, `BroadeningIntegration`, `FEVectorial`, `Excitation`, `EnormalInterface`, `BandEdgeShift`, `PostProcess`, `i`, `Stripe`, `BandgapNarrowing`

- [ ] **Step 1: Write entries 81-160 of KEYWORD3**

- [ ] **Step 2: Validate and commit**

```bash
python3 -c "import json; d=json.load(open('syntaxes/sdevice_command_docs.json')); print(f'Total entries: {len(d)}')"
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): add KEYWORD3 Physics advanced model docs (entries 81-160)"
```

---

### Task 6: Add KEYWORD3 batch 3c — Numerical/misc entries (~81 entries)

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Read: `references/sdevice_ug_T-2022.03.md:9883-9912` (Appendix G: Various)
- Read: `references/sdevice_ug_T-2022.03_1.md:4200-10000` (Part III: numeric methods, PMI)

**Entries 161-241 of KEYWORD3:**
`RayTraceBC`, `Unset`, `hBarrierTunneling`, `Affinity`, `Add2TotalDoping`, `Noise`, `time`, `CurrentDensity`, `Schroedinger`, `Average`, `Piezo`, `LayerThickness`, `ActiveVertex`, `ACPlot`, `MSConfig`, `Medium`, `Reservoirs`, `DebugLEDRadiation`, `EnergyRelaxationTime`, `Piezolectric_Polarization`, `Split`, `ElementLimit`, `Delaunizer2d`, `Bandstructure`, `hHCSDegradation`, `PMIModel`, `DopingWells`, `ExcludeHorizontalSource`, `OutputLightToolsRays`, `ILS`, `OutputT2TPaths`, `HydrogenAtom`, `Plot`, `ElectricField`, `FromFile`, `Exclude`, `RandomField`, `StepFunction`, `Sensor`, `RefractiveIndex`, `RectangularWindow`, `Raytrace`, `Maximum`, `State`, `hSHEDistribution`, `Print`, `CEModel`, `EmissionType`, `TMM1D`, `FarField`, `DOS`, `BarrierTunneling`, `Box`, `EquilibriumSolution`, `Recombination`, `Scattering`, `SetConstant`, `DeterministicVariation`, `LayerStackExtraction`, `OpticalGeneration`, `System`, `TurningPoints`, `OptBeam`, `HydrogenIon`, `eBarrierTunneling`, `hSubband`, `ConstantCarrierGeneration`, `RandomizedVariation`, `GeometricVariation`, `WidthExtraction`, `OuterDevicePower`, `LEDRadiationPara`, `TrapConcentration`, `LayerStructure`, `Surface`, `Optics`, `OutputLightToolsFarfieldRays`, `Regexp`, `FDTD`, `ACCompute`, `ElementSize`, `LHSCoef`, `MoleFraction`, `Weights`, `ThermalConductivity`

- [ ] **Step 1: Write entries 161-241 of KEYWORD3**

- [ ] **Step 2: Validate and commit**

```bash
python3 -c "import json; d=json.load(open('syntaxes/sdevice_command_docs.json')); print(f'Total entries: {len(d)}')"
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): add KEYWORD3 numerical/misc docs (entries 161-241)"
```

---

### Task 7: Final verification and integration test

**Files:**
- Verify: `syntaxes/sdevice_command_docs.json`
- Verify: `src/extension.js`

- [ ] **Step 1: Validate complete JSON file**

```bash
python3 -c "
import json
d = json.load(open('syntaxes/sdevice_command_docs.json'))
print(f'Total entries: {len(d)}')
# Check all KEYWORD1 are covered
kw1 = ['Electrode', 'eSHEDistributionPlot', 'CurrentPlot', 'Math', 'OpticalDevice', 'hSHEDistributionPlot', 'HydrogenBoundary', 'FarFieldPlot', 'Plot', 'File', 'BandstructurePlot', 'Thermode', 'Solve', 'VCSELNearFieldPlot', 'MonteCarlo', 'Device', 'System', 'NonlocalPlot', 'TensorPlot', 'GainPlot', 'Physics', 'TrappedCarDistrPlot', 'RayTraceBC', 'NoisePlot', 'PlotGainPara']
missing = [k for k in kw1 if k not in d]
if missing: print(f'MISSING KEYWORD1: {missing}')
else: print('All KEYWORD1 covered')
# Check all have required fields
for k, v in d.items():
    assert 'section' in v, f'{k}: missing section'
    assert 'signature' in v, f'{k}: missing signature'
    assert 'description' in v, f'{k}: missing description'
print('All entries have required fields')
"
```

- [ ] **Step 2: Test extension in VSCode**

Launch VSCode Extension Development Host (F5), open a `*_des.cmd` file, and verify:
1. Hover over `Electrode`, `Physics`, `Solve`, `Math` shows documentation
2. Completion list shows documentation for sdevice keywords
3. Section label is displayed correctly
4. No errors in the Output panel

- [ ] **Step 3: Update CLAUDE.md**

Add sdevice command docs to the function documentation system section:

In `CLAUDE.md`, under "### 函数文档系统", add:
```markdown
- **sdevice 命令文档**（英文默认）：`syntaxes/sdevice_command_docs.json`
  覆盖全部 297 个 KEYWORD1+KEYWORD2+KEYWORD3 关键词。
  中文版待翻译。
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(sdevice): complete command docs for 297 keywords with hover and completion support"
```
