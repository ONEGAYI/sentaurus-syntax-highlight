# SDEVICE PAR 语法高亮

SDEVICE PAR 参数文件（`*.par`）为器件仿真器定义材料和区域的各种物理参数。虽然它的语法看起来像 Tcl，但实际上是一套独立的声明式语言——没有 `proc`、`set`、`if` 这些 Tcl 命令，取而代之的是 scope → block → parameter 的三级层次结构。扩展针对这种独特语法提供了专门的高亮规则，下面逐一介绍。

## 基本语法结构

`.par` 文件的核心组织方式是三层嵌套：

```
scopeType = "名称" {        ← scope 层（如 Material、Region）
    blockName {             ← block 层（如 Bandgap、Epsilon）
        参数名 = 参数值     ← parameter 层（如 Eg0 = 1.12）
    }
}
```

scope 层声明了参数所属的对象类型和名称，block 层将参数按物理模型分组，parameter 则是具体的键值对。扩展会为这三个层级分配不同的颜色，让你一眼就能分辨出当前行的结构角色。

## scopeType 高亮

文件顶层的 scope 声明是整个参数体系的入口。扩展会高亮以下 scopeType 关键字：

| 关键字 | 含义 |
|--------|------|
| `Material` | 材料参数 |
| `Region` | 区域参数 |
| `Electrode` | 电极参数 |
| `MaterialInterface` | 材料间界面参数 |
| `RegionInterface` | 区域间界面参数 |

这些关键字以蓝色（Dark+ 主题下的 `keyword.control`）渲染，紧跟其后的名称字符串以橙色高亮：

```
Material = "Silicon" {      ← Material 蓝色，"Silicon" 橙色
Region = "R1" {             ← Region 蓝色，"R1" 橙色
Electrode = "anode" {       ← Electrode 蓝色，"anode" 橙色
```

## block 名称高亮

进入 scope 内部后，各种物理模型以 block 的形式出现。block 名称以青绿色（`entity.name.type`）渲染，使它们与上层的 scopeType 和下层的 parameter 形成视觉区分：

```
Bandgap {                   ← block 名，青绿色
    Eg0 = 1.12              ← parameter 名，浅蓝色
}
```

常见的 block 包括 `Epsilon`、`Bandgap`、`Scharfetter`、`ConstantMobility`、`DopingDependence`、`HighFieldDependence`、`Auger`、`RadiativeRecombination`、`Kappa`、`Ionization`、`Thermionic`、`SurfaceRecombination` 等。block 可以任意嵌套，内层 block 同样以青绿色标记。

## parameter 高亮

parameter 是键值对形式，参数名出现在 `=` 左侧时以浅蓝色（`variable.parameter`）高亮。等号右侧的值则根据类型着色：

- **数值**：浅绿色（如 `1.12`、`4.73e-4`）
- **字符串**：橙色（如 `"Silicon"`）
- **SWB 变量**：浅蓝色（如 `@doping@`）

```
Eg0 = 1.12                  ← Eg0 浅蓝色，1.12 浅绿色
Chi0 = 4.05                 ← Chi0 浅蓝色，4.05 浅绿色
alpha = 4.73e-4             ← alpha 浅蓝色，4.73e-4 浅绿色
Insert = "Silicon.par"      ← Insert 特殊关键字，见下文
```

## 单行嵌套语法

PAR 文件支持在单行内完成 block 的声明和参数赋值，这在简短配置中很常见：

```
Bandgap { Eg0 = 1.12 }      ← 同一行内 block + parameter
```

扩展能够正确处理这种单行嵌套语法，block 名和参数名分别着色，不会因为缩进减少而丢失高亮信息。

## include 与 Insert 语句

PAR 文件有两种引用外部文件的方式：

- **`Insert`**：在 scope 内引用其他 `.par` 文件的内容。`Insert` 关键字以特殊颜色（`support.class`）高亮，后接的文件路径字符串以橙色标记：

  ```
  Material = "Silicon" {
      Insert = "Silicon.par"     ← Insert 特殊颜色，路径橙色
  }
  ```

- **`#include`**：预处理器级别的文件包含，以预处理器指令颜色着色。

## 注释

PAR 文件支持两种注释风格：

- `#` 后面的内容为行注释，以灰色渲染
- `*` 开头的行也是注释——这是 Sentaurus 工具链中的常见写法

```
# 这是行注释
* 这也是注释 — 描述物理公式时常用
Eg0 = 1.12    # 行尾注释
```

注意 `*` 注释既可以出现在行首，也可以出现在空白之后（用于行内注释，描述物理模型的公式）。

## 预处理器指令

与其他 Sentaurus 工具一样，PAR 文件支持 C 风格的预处理器指令：

```
#define THICKNESS 0.1
#ifdef @Material@
  Material = "Silicon" { ... }
#endif
```

`#define`、`#ifdef`、`#ifndef`、`#else`、`#endif` 等指令以蓝色高亮，`#define` 定义的宏名称以特殊类型色标记。宏名称在后续代码中出现时（形如 `_MACRO_NAME`）也会被高亮识别。

## 字符串与数值

- **双引号字符串**：橙色渲染，内部支持 `@SWBVar@` 格式的 SWB 变量（浅蓝色），也支持 `\"` 转义
- **数值字面量**：浅绿色渲染，支持整数、小数和科学记数法（如 `1.12`、`4.73e-4`、`2.8e-31`）
- **函数表达式**：括号内的函数调用（如 `T dependence`）以函数名色高亮

## 函数表达式高亮

PAR 文件中偶尔会出现函数形式的表达式，如 `TempDep(...)` 或 `ExpTempDep(...)`。扩展会将函数名以黄色（`entity.name.function`）渲染，函数体内的内容同样支持数值和字符串高亮。

## Tcl-like 但非 Tcl

虽然 PAR 文件的语法在视觉上与 Tcl 相似（同样使用 `{}` 分组、`#` 注释、双引号字符串），但它并不支持 Tcl 的控制流和变量操作命令。扩展针对性地设计了独立的语法规则，只高亮 PAR 文件中实际存在的语法元素，避免将 Tcl 命令关键词误标。

## 代码片段

扩展为 PAR 文件提供了两类代码片段支持：

**原生 VSCode Snippets**（22 个）：输入前缀后按 `Tab` 即可展开，覆盖了最常用的结构模板：

| 前缀 | 内容 |
|------|------|
| `material` | Material 顶层块 |
| `region` | Region 顶层块 |
| `electrode` | Electrode 顶层块 |
| `bandgap` | Bandgap 模型（带 Silicon 默认值） |
| `epsilon` | 介电常数 |
| `scharfetter` | SRH 复合寿命 |
| `constmob` | 恒定迁移率 |
| `dopingmob` | 掺杂相关迁移率 |
| `hfd` | 高场依赖迁移率 |
| `auger` | Auger 复合系数 |
| `mat-si` | Material Silicon 完整骨架 |
| `mat-oxide` | Material Oxide 完整骨架 |
| `insert` | Insert 引用外部参数文件 |
| ... | 以及更多 |

**QuickPick 片段**（`sentaurus.insertSnippet` 命令）：通过命令面板触发的多层级菜单，按 Material / Region / Electrode / Interface / Section / Misc 分类组织，每个片段带有描述说明。
