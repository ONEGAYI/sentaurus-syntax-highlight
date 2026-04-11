# SDevice LITERAL 关键词重分类计划

> 生成日期：2026-04-12
> 状态：待实施

## 背景

`extract_keywords.py` 从 Synopsys XML mode 文件提取关键词，其中 LITERAL1/2/3 被映射为 `constant.numeric.sdevice` scope。但部分 LITERAL 关键词在实际使用中充当**节级子选项/模型名**，与 KEYWORD3（`entity.name.tag`）语义等价，却被标为 `constant.numeric`，导致高亮不一致。

当前状态：
- KEYWORD1/2/3：297 条，**100% 有文档**
- LITERAL1/2/3：1945 条，**仅 55 条有文档**（其中 53 条靠 KEYWORD 重叠获得）

## 重分类优先级

### Tier 1：应提升为 KEYWORD3（节级模型/选项名）

这些词在 `Physics {}`、`Solve {}`、`Math {}` 等节内作为**独立子选项**出现，与现有 KEYWORD3 语法角色完全一致。

#### Physics 模型选项（4 个）

| 关键词 | 当前分类 | 所属节 | 说明 |
|--------|---------|--------|------|
| `Thermodynamic` | LITERAL3 | Physics | 启用热力学模型，包含载流子温度方程 |
| `BandGap` | LITERAL3 | Physics | 能带相关模型，如 `EffectiveIntrinsicDensity(BandGapNarrowing(...))` |
| `Optical` | LITERAL3 | Physics | 启用光学效应（光生载流子等） |
| `Stress` | LITERAL3 | Physics | 启用应力效应模型 |

#### Physics - 复合模型（5 个）

| 关键词 | 当前分类 | 父命令 | 说明 |
|--------|---------|--------|------|
| `SRH` | LITERAL3 | Recombination | Shockley-Read-Hall 复合 |
| `Auger` | LITERAL3 | Recombination | Auger 复合 |
| `Radiative` | LITERAL3 | Recombination | 辐射复合 |
| `Band2Band` | LITERAL3 | Recombination | 带间隧穿复合 |
| `SurfaceSRH` | LITERAL3 | Recombination | 表面 SRH 复合 |

#### Physics - 迁移率模型（6 个）

| 关键词 | 当前分类 | 父命令 | 说明 |
|--------|---------|--------|------|
| `DopingDependence` | LITERAL3 | Mobility | 掺杂依赖迁移率 |
| `HighFieldSaturation` | LITERAL3 | Mobility | 高场饱和迁移率 |
| `ConstantMobility` | LITERAL3 | Mobility | 恒定迁移率 |
| `TempDependence` | LITERAL3 | Mobility | 温度依赖迁移率 |
| `eHighFieldSaturation` | LITERAL3 | eMobility | 电子高场饱和迁移率 |
| `hHighFieldSaturation` | LITERAL3 | hMobility | 空穴高场饱和迁移率 |

#### Physics - 隧穿/掺杂（3 个）

| 关键词 | 当前分类 | 父命令 | 说明 |
|--------|---------|--------|------|
| `FowlerNordheim` | LITERAL3 | Tunneling | Fowler-Nordheim 隧穿 |
| `DonorConcentration` | LITERAL3 | Doping | 施主浓度 |
| `AcceptorConcentration` | LITERAL3 | Doping | 受主浓度 |

#### Solve 方程名称（3 个）

| 关键词 | 当前分类 | 父命令 | 说明 |
|--------|---------|--------|------|
| `Poisson` | LITERAL3 | Coupled | 泊松方程 |
| `Electron` | LITERAL3 | Coupled | 电子连续性方程 |
| `Hole` | LITERAL3 | Coupled | 空穴连续性方程 |

#### Math 求解算法（8 个）

| 关键词 | 当前分类 | 父命令 | 说明 |
|--------|---------|--------|------|
| `Newton` | LITERAL3 | Method | Newton 迭代法 |
| `TRBDF` | LITERAL3 | Transient | TR-BDF 时间积分 |
| `BE` | LITERAL3 | Transient | Backward Euler |
| `TE` | LITERAL3 | Transient | Forward Euler |
| `Circuit` | LITERAL3 | Solve | 电路耦合求解 |
| `UCS` | LITERAL3 | Extrapolate | Unsymmetric Coupled Solver |
| `Blocked` | LITERAL3 | (Math) | 阻塞矩阵求解 |
| `Constant` | LITERAL3 | (Math) | 恒定时间步长 |

**Tier 1 小计：29 个**

---

### Tier 2：已提升为 KEYWORD3（重要物理量名称）✅

这些词主要作为 Plot 输出量或 Solve 内部量名称，语义权重略低于 Tier 1，但频繁出现在节级位置。已于 2026-04-12 完成晋升。

| 关键词 | 当前分类 | 典型上下文 | 说明 |
|--------|---------|-----------|------|
| `eDensity` | LITERAL3 | Plot/Solve | 电子密度 |
| `hDensity` | LITERAL3 | Plot/Solve | 空穴密度 |
| `eCurrent` | LITERAL3 | Plot | 电子电流 |
| `hCurrent` | LITERAL3 | Plot | 空穴电流 |
| `eCurrentDensity` | LITERAL3 | Plot | 电子电流密度 |
| `hCurrentDensity` | LITERAL3 | Plot | 空穴电流密度 |
| `TotalCurrent` | LITERAL3 | Plot | 总电流 |
| `DisplacementCurrent` | LITERAL3 | Plot | 位移电流 |
| `SpaceCharge` | LITERAL3 | Plot | 空间电荷 |
| `Potential` | LITERAL3 | Plot | 静电势 |
| `eQuasiFermi` | LITERAL3 | Plot | 电子准费米能级 |
| `hQuasiFermi` | LITERAL3 | Plot | 空穴准费米能级 |
| `eMobility` | LITERAL3 | Plot | 电子迁移率 |
| `hMobility` | LITERAL3 | Plot | 空穴迁移率 |
| `eVelocity` | LITERAL3 | Plot | 电子速度 |
| `hVelocity` | LITERAL3 | Plot | 空穴速度 |
| `eTemperature` | LITERAL3 | Solve | 电子温度 |
| `hTemperature` | LITERAL3 | Solve | 空穴温度 |
| `eAvalanche` | LITERAL3 | Plot | 电子雪崩击穿 |
| `hAvalanche` | LITERAL3 | Plot | 空穴雪崩击穿 |

**Tier 2 小计：20 个**

---

### Tier 3：保持 LITERAL（通用参数名）

这些词语义较泛，作为参数名/枚举值使用，保持 LITERAL 分类合理。

| 关键词 | 当前分类 | 说明 |
|--------|---------|------|
| `Cylindrical` | LITERAL3 | CoordinateSystem 的枚举值 |
| `Schottky` | LITERAL3 | 接触类型枚举值 |
| `Contact` | LITERAL3 | 接触相关 |
| `Uniform` | LITERAL3 | 均匀（掺杂/网格） |
| `AsIs` | LITERAL3 | 保持现状 |
| `Save` | LITERAL3 | 保存选项 |
| `Intensity` | LITERAL3 | 光学强度 |

**Tier 3 小计：7 个**

---

## KEYWORD1/2 与 LITERAL 的重叠（已正确处理）

以下词同时存在于 KEYWORD 和 LITERAL 中，由于 TextMate 首匹配规则，实际显示为 KEYWORD scope，无需处理。

| 关键词 | KEYWORD 类别 | LITERAL 类别 |
|--------|-------------|-------------|
| `Device` | KEYWORD1 | LITERAL3 |
| `Electrode` | KEYWORD1 | LITERAL3 |
| `CurrentPlot` | KEYWORD1 | LITERAL1 |
| `Plot` | KEYWORD1 | LITERAL3 |
| `MonteCarlo` | KEYWORD1 | LITERAL3 |
| `NoisePlot` | KEYWORD1 | LITERAL3 |
| `OpticalDevice` | KEYWORD1 | LITERAL3 |
| `TensorPlot` | KEYWORD1 | LITERAL3 |
| `Coupled` | KEYWORD2 | LITERAL3 |
| `Transient` | KEYWORD2 | LITERAL3 |
| `Extraction` | KEYWORD2 | LITERAL3 |
| `DopingWell` | KEYWORD2 | LITERAL3 |
| `SaveOptField` | KEYWORD2 | LITERAL3 |
| `SolveSpectrum` | KEYWORD2 | LITERAL3 |
| `SpectralPlot` | KEYWORD2 | LITERAL3 |
| `Contact` | KEYWORD2 | LITERAL1 |

## 实施方案

### 方案 A：修改 extract_keywords.py（推荐）

在脚本中对 sdevice 模式添加 LITERAL→KEYWORD3 的重映射规则：

```python
# sdevice LITERAL → KEYWORD3 升级规则
_SDEVICE_LITERAL_TO_KW3 = {
    'Thermodynamic', 'BandGap', 'Optical', 'Stress',
    'SRH', 'Auger', 'Radiative', 'Band2Band', 'SurfaceSRH',
    'DopingDependence', 'HighFieldSaturation', 'ConstantMobility', 'TempDependence',
    'eHighFieldSaturation', 'hHighFieldSaturation',
    'FowlerNordheim', 'DonorConcentration', 'AcceptorConcentration',
    'Poisson', 'Electron', 'Hole',
    'Newton', 'TRBDF', 'BE', 'TE', 'Circuit', 'UCS', 'Blocked', 'Constant',
    # Tier 2 (可选)
    'eDensity', 'hDensity', 'eCurrent', 'hCurrent', ...
}
```

运行 `python scripts/extract_keywords.py` 后自动更新语法文件。

### 方案 B：直接修改 sdevice.tmLanguage.json

手动将 Tier 1 关键词从 LITERAL pattern 移到 KEYWORD3 pattern。缺点：下次运行提取脚本会被覆盖。

### 文档补充

Tier 1 的 29 个关键词需要补充到 `sdevice_command_docs.json`，格式与现有 KEYWORD3 条目一致：

```json
{
  "Thermodynamic": {
    "section": "Physics",
    "signature": "Thermodynamic",
    "description": "Enables the thermodynamic model...",
    "keywords": []
  }
}
```
