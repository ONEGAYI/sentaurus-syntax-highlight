# 代码片段

本扩展提供了两套代码片段机制，覆盖 Sentaurus TCAD 全部 7 种语言，帮助你快速搭建仿真脚本骨架。

---

## VSCode 原生片段

原生片段会在你输入前缀时自动弹出补全建议。目前的覆盖情况：

| 语言 | 说明 |
|------|------|
| SDEVICE PAR | 提供 22 个片段——Material/Region/Electrode 顶层块、Epsilon/Bandgap/Scharfetter 等物理模型参数块，以及完整的 Silicon/Oxide 材料骨架 |
| SDE / SDEVICE / SPROCESS / EMW / Inspect / Svisual | 原生片段预留位，暂未填充内容 |

SDEVICE PAR 的原生片段值得关注：它们包含 Silicon 的默认物理参数值（如迁移率、带隙、SRH 寿命等），省去了反复查手册的麻烦。常用前缀包括 `material`、`region`、`electrode`、`bandgap`、`scharfetter`、`constmob`、`mat-si`（完整 Silicon 骨架）等。

> 原生片段的完整列表可在 VSCode 的 **Preferences: Configure User Snippets** 中查看。

---

## QuickPick 命令片段

通过命令面板执行 `Sentaurus: 插入代码片段`，会打开一个两级菜单：先选择工具类别，再从该工具的片段集中挑选具体模板。

### 覆盖范围

| 工具 | 包含的片段 |
|------|-----------|
| **Sentaurus-StructEditor** | Contact（Body / Edge-Face / Interface-3D）、Doping（Const-box / Const-material / Const-region / Gauss / Submesh）、Meshing（Ref-box / Ref-material / Ref-region） |
| **Sentaurus-Device** | CurrentPlot、Electrode、File、Math、Physics（BandGap / General / Mobility / Recombination / Traps / 光学相关）、Plot（Basic-Set / Extensive-Set）、Solve（Initial-Solve / QuasiStat / Transient / ACcoupled）、System |
| **Sentaurus-DevicePar** | Material（Silicon / Oxide / Generic）、Region、Electrode、Interface（RegionInterface / MaterialInterface）、Section（Epsilon / Bandgap / Scharfetter / ConstantMobility 等）、Misc |
| **Sentaurus-Process** | Deposit、Diffuse、Etch、Implant、ICWB（Line / Load-layout / Create-mask 等）、Init、Mask、Photo、MeshGoals、RefineBox、Struct |
| **Sentaurus-Inspect** | Curve（Axis-Attributes / CV-Curve / IV-Curve / Curve-Attributes 等）、Extract（MOS-IdVg / MOS-IdVd / Misc） |
| **Sentaurus-Mesh** | EMW 基础和高级网格模板 |

每个片段都包含占位符（Tab Stop），插入后按 Tab 键依次跳转到需要修改的位置。

### SDE 片段的前缀变量名系统

SDE 的 QuickPick 片段有一个特殊设计：生成的代码中自动包含带前缀的变量名，方便后续引用和追踪。例如插入一个 Gauss 掺杂片段时，会生成类似下面的代码：

```scheme
(sdedr:define-gaussian-profile (string-append "GAUSS." NAME) ...)
(sdedr:define-analytical-profile-placement (string-append "IMP." NAME) ...)
```

其中 `GAUSS.` 和 `IMP.` 就是前缀。默认值可以在设置中自定义，共 10 个可配置前缀：

| 配置项 | 含义 | 默认值 |
|--------|------|--------|
| `sentaurus.snippetPrefixes.RW` | 细化求值窗口 | `RW.` |
| `sentaurus.snippetPrefixes.DC` | 恒定掺杂分布 | `DC.` |
| `sentaurus.snippetPrefixes.CPP` | 恒定掺杂放置 | `CPP.` |
| `sentaurus.snippetPrefixes.CPM` | 恒定掺杂按材料/区域放置 | `CPM.` |
| `sentaurus.snippetPrefixes.GAUSS` | 高斯分布 | `GAUSS.` |
| `sentaurus.snippetPrefixes.IMP` | 分析掺杂放置 | `IMP.` |
| `sentaurus.snippetPrefixes.SM` | 子网格定义 | `SM.` |
| `sentaurus.snippetPrefixes.PSM` | 子网格放置 | `PSM.` |
| `sentaurus.snippetPrefixes.RS` | 网格细化尺寸 | `RS.` |
| `sentaurus.snippetPrefixes.RP` | 网格细化放置 | `RP.` |

如果你的项目有自己的命名规范，修改这些前缀就能让所有 SDE 片段自动适配。

---

## 表达式转换器

SDE 使用 Scheme 前缀表达式，写起来不太直观。扩展提供了两个命令来简化这一过程：

- `Sentaurus: Scheme → 中缀表达式` — 将 `(sqrt (+ (* a b) c))` 转换为 `sqrt(a * b + c)`
- `Sentaurus: 中缀表达式 → Scheme` — 将 `sqrt(a * b + c)` 转换回 `(sqrt (+ (* a b) c))`

### 支持的运算

转换器覆盖了常见的算术运算和数学函数：

**算术运算** — `+` `-` `*` `/`（其中 `+` 和 `*` 支持多参数，如 `(+ a b c)` ↔ `a + b + c`）

**特殊运算** — `^`（幂）、`%`（取模）、`%%`（取余）、`//`（取整商）

**数学函数** — `sin`、`cos`、`tan`、`asin`、`acos`、`atan`、`sqrt`、`abs`、`exp`、`log`、`floor`、`ceil`、`round`、`min`、`max`

### 连字符变量的尖括号语法

Scheme 中标识符可以包含连字符（如 `W-doping`），但中缀表达式里连字符和减号长一模一样。转换器用尖括号来消歧：

```
中缀：  <W-doping> + 1.0
前缀：  (+ W-doping 1.0)
```

输入中缀表达式时，用 `<变量名>` 包裹含有连字符的标识符即可。

### 输入框的智能补全

表达式转换器的输入框支持光标位置感知的变量名补全。移动光标到任意标识符上，补全列表会自动过滤出匹配的变量名。

此外还有历史模式，方便回溯之前转换过的表达式：

| 输入 | 效果 |
|------|------|
| `!` | 显示全部历史记录 |
| `!3` | 直接选中第 3 条历史 |
| `! 关键词` | 模糊过滤包含该关键词的历史条目 |

通过 `Sentaurus: 表达式帮助` 命令可以随时查看完整的运算符和函数列表。
