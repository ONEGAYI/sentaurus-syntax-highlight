# 隐式变量声明函数统计

> 统计日期：2026-05-12
> 目的：为 Tcl 语言服务器识别"隐式声明变量"的函数/命令，消除误报的 undef 诊断

## 统计方法

扫描项目内所有函数文档 JSON，找出**接受用户指定的变量名参数、且在变量不存在时自动创建它**的命令。

---

## 1. Tcl 核心命令 (`tcl_command_docs.json`)

以下命令的第一个（或指定）参数是变量名，变量不存在时会自动创建：

| 函数名 | 变量参数 | 行为 |
|--------|---------|------|
| `set` | `varName` | 创建或修改变量 |
| `append` | `varName` | 不存在时自动创建空字符串再追加 |
| `lappend` | `varName` | 不存在时自动创建为空列表再追加 |
| `incr` | `varName` | 不存在时视为 0 再加 increment |
| `foreach` | `varname` | 循环变量，每次迭代赋值 |
| `lmap` | `varname` | 类似 foreach 的映射变量（Tcl 8.6+）|
| `lassign` | `?varName ...?` | 将列表元素依次赋值给各变量 |
| `variable` | `?name value ...?` | 创建命名空间变量 |
| `upvar` | `myVar` | 创建本地链接到其他作用域变量 |
| `global` | `varName` | 在本地作用域链接全局变量 |
| `catch` | `?resultVarName? ?optionsVarName?` | 存储异常结果/选项到变量 |
| `scan` | `?varName ...?` | 将解析结果存入变量 |
| `regexp` | `?matchVar? ?subMatchVar ...?` | 将匹配结果存入变量 |
| `regsub` | `?varName?` | 将替换结果存入变量 |
| `gets` | `varName` | 将读取的行存入变量，不存在时创建 |
| `for` | start脚本中通常含 `set` | 初始化循环变量（间接，for 本身不创建）|

**注意**：`global` 和 `upvar` 严格来说是"链接"而非"创建"——`global` 将全局变量链接到本地，`upvar` 将任意作用域变量链接到本地。但它们确实让变量在当前作用域变得可访问，语言服务器应将它们视为定义。`for` 本身不创建变量。

---

## 2. Tcl 子命令 (`tcl_subcommand_docs.json`)

| 函数名 | 变量参数 | 行为 |
|--------|---------|------|
| `array set` | `arrayName` | 从键值列表创建/设置数组 |
| `dict set` | `dictVar` | 设置字典值，字典不存在时创建 |
| `dict unset` | `dictVar` | 移除字典条目（字典需存在）|
| `dict for` | `{keyVar valueVar}` | 遍历字典，循环变量隐式创建 |
| `dict map` | `{keyVar valueVar}` | 映射字典，变量隐式创建（Tcl 8.7+）|
| `dict update` | `key varName ...` body | 从字典键创建变量，body 后回写 |
| `dict with` | `dictVar` | 创建与字典键同名的变量，body 后回写 |
| `file stat` | `varName` | 将文件状态信息存入数组变量 |
| `info default` | `varName` | 将参数默认值存入变量 |

**注意**：
- `dict unset` 是移除操作，不算隐式创建。但 `dict set` 在字典变量不存在时会创建。
- `dict with` 会临时创建与字典键同名的变量。
- `info default` 会设置 varName。

---

## 3. SDEVICE (`sdevice_command_docs.json`)

**无**。SDEVICE 使用声明式配置语言，不涉及隐式变量创建。

---

## 4. Svisual (`svisual_command_docs.json`)

Svisual 的 `ext::`、`ifm::`、`rfx::` 系列命令通过 `-out <var_name>` 参数将结果写入 Tcl 变量。

### ext:: 提取系列（23 个）

| 函数名 | -out 参数类型 |
|--------|-------------|
| `ext::AbsList` | `list_name` |
| `ext::DiffForwardList` | `array_name` |
| `ext::DiffList` | `list_name` |
| `ext::ExtractBVi` | `var_name` |
| `ext::ExtractBVv` | `var_name` |
| `ext::ExtractEarlyV` | `var_name` |
| `ext::ExtractExtremum` | `var_name` |
| `ext::ExtractGm` | `var_name` |
| `ext::ExtractIoff` | `var_name` |
| `ext::ExtractRdiff` | `var_name` |
| `ext::ExtractRsh` | `array_name` |
| `ext::ExtractSS` | `var_name` |
| `ext::ExtractSsub` | `var_name` |
| `ext::ExtractValue` | `var_name` |
| `ext::ExtractVdlin` | `var_name` |
| `ext::ExtractVdlog` | `var_name` |
| `ext::ExtractVglin` | `var_name` |
| `ext::ExtractVglog` | `var_name` |
| `ext::ExtractVtgm` | `var_name` |
| `ext::ExtractVti` | `var_name` |
| `ext::ExtractVtsat` | `var_name` |
| `ext::FilterTable` | `array_name` |
| `ext::FindExtrema` | `array_name` |
| `ext::FindVals` | `list_name` |
| `ext::LinFit` | `array_name` |
| `ext::Linspace` | `list_name` |
| `ext::LinTransList` | `list_name` |
| `ext::Log10List` | `list_name` |
| `ext::RemoveDuplicates` | `array_name` |
| `ext::RemoveZeros` | `array_name` |
| `ext::SubLists` | `array_name` |

### ifm:: 统计分析系列（15 个）

| 函数名 | -out 参数类型 |
|--------|-------------|
| `ifm::Gauss` | `var_name` |
| `ifm::GetDataQuantiles` | `array_name` |
| `ifm::GetGaussian` | `array_name` |
| `ifm::GetHistogram` | `array_name` |
| `ifm::GetMoments` | `array_name` |
| `ifm::GetMOSIVs` | `array_name` |
| `ifm::GetMOSWeights` | `list_name` |
| `ifm::GetNoiseStdDev` | `array_name` |
| `ifm::GetQQ` | `array_name` |
| `ifm::GetsIFMStdDev` | `array_name` |
| `ifm::GetSNM` | `array_name` |
| `ifm::GetSRAMVTC` | `array_name` |
| `ifm::ReadCSV` | `array_name` |
| `ifm::ReadsIFM` | `array_name` |
| `ifm::WriteCSV` | (参数中有 `ncol <var_name>`) |

### rfx:: 射频分析系列（15 个）

| 函数名 | -out 参数类型 |
|--------|-------------|
| `rfx::Abs2_v` | `list_name` |
| `rfx::Abs_v` | `list_name` |
| `rfx::Add_v` | `array_name` |
| `rfx::Cart2Polar_v` | `array_name` |
| `rfx::Conj_v` | `array_name` |
| `rfx::Div_v` | `array_name` |
| `rfx::GetFK1` | `array_name` |
| `rfx::GetFmax` | `array_name` |
| `rfx::GetFt` | `array_name` |
| `rfx::GetNearestIndex` | `var_name` |
| `rfx::GetNoiseFigure` | `array_name` |
| `rfx::GetParsAtPoint` | `array_name` |
| `rfx::GetPowerGain` | `array_name` |
| `rfx::Mul_v` | `array_name` |
| `rfx::Phase_v` | `list_name` |
| `rfx::Polar2Cart_v` | `array_name` |
| `rfx::RFCList` | `array_name` |
| `rfx::Sub_v` | `array_name` |

### 其他

| 函数名 | 说明 |
|--------|------|
| `create_variable` | 在 dataset 中创建新变量（-name 指定名称）|

---

## 5. SDE (`sde_function_docs.json`)

**无**。SDE 使用 Scheme 方言，变量通过 `define`/`let` 等显式绑定创建，函数不隐式创建变量。

## 6. Scheme 内置 (`scheme_function_docs.json`)

**无**。Scheme 是词法作用域语言，所有变量绑定都是显式的（`define`、`let`、`let*`、`letrec`、`do`、`lambda` 参数等）。`set!` 要求变量已存在。

---

## 汇总

| 工具/方言 | 隐式变量声明函数数量 |
|-----------|-------------------|
| Tcl 核心 | 15（含 gets）|
| Tcl 子命令 | 8 |
| SDEVICE | 0 |
| Svisual | ~54（ext:31 + ifm:15 + rfx:18）|
| SDE (Scheme) | 0 |
| Scheme 内置 | 0 |

**优先级建议**：Tcl 核心命令（14个）影响所有 5 种 Tcl 工具，应优先实现。Svisual 的 ext::/ifm::/rfx:: 系列只影响 Svisual 一种语言，且数量庞大，可后续按需添加。
