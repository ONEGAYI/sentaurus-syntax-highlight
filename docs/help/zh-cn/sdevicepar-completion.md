# SDEVICE PAR 自动补全

PAR 文件的补全系统围绕 scope → block → parameter 三级结构设计，根据光标所在位置自动判断你应该输入什么。

## 三级补全

**scopeType 级** — 当光标在文件顶层（不在任何 `{}` 内）时触发。扩展会列出所有可用的 scope 类型：

```
Material = "${1:name}" {    ← 输入时自动补全模板
    ${0}
}
```

补全列表包括 `Material`、`Region`、`Electrode`、`Interface`、`MaterialInterface`、`RegionInterface` 六种类型，选择后直接生成完整的 scope 声明骨架。

**block 级** — 当光标在某个 scope 内部（但不在 block 内）时触发。例如光标位于 `Material "Silicon" { }` 内，扩展会汇总所有可用的物理模型块名称：`Bandgap`、`Epsilon`、`Scharfetter`、`ConstantMobility`、`DopingDependence` 等等。

这里有一个聚合机制：扩展不仅查找当前 scope 实例下已出现的 block，还会**跨同类型 scope 聚合**。也就是说，如果另一个 `Material "Oxide"` 中定义了 `Kappa` 块，那么在 `Material "Silicon"` 中输入时也能看到 `Kappa` 作为候选——因为它们同属 `Material` 类型，物理模型是通用的。

**parameter 级** — 当光标在某个 block 内部时触发。例如光标位于 `Bandgap { }` 内，扩展会列出 `Eg0`、`Chi0`、`alpha` 等参数名，补全后自动追加 ` = ` 方便你直接输入值。已赋值的参数还会在补全项的详情中显示当前值（如 `[par] = 1.12`），方便参考。

与 block 级类似，parameter 级也会跨同类型 scope 聚合——不同 Material 实例的 Bandgap 参数会合并展示。

## scope 名称补全

当你在 scope 声明的引号内输入时（例如 `Material = "|"`），扩展会自动补全已定义的同类型 scope 名称。如果你在 workspace 其他 `.par` 文件或 MaterialDB 中已经定义了 `Material "Silicon"`，输入时就能看到 `Silicon` 作为候选。

## 补全来源与优先级

补全数据来自四个层级，按优先级从高到低排列：

| 来源 | 说明 |
|------|------|
| **current** | 当前正在编辑的文件 |
| **include** | 当前文件通过 `include` 或 `Insert` 引入的文件 |
| **workspace** | workspace 中所有其他 `.par` 文件（后台自动扫描） |
| **materialdb / builtin** | MaterialDB 材料数据库或内置占位数据 |

当不同来源存在同名符号时，保留优先级最高的那个。每个补全项都会显示 **Source** 字段（来源文件名），让你清楚知道这个建议来自哪里。

## include 链递归解析

PAR 文件中的 `include "file.par"` 和 `Insert = "file.par"` 语句会被递归解析——扩展会沿着 include 链一直向下追踪（最多 8 层深度），将所有引入文件中的符号合并到补全池中，并标记为 `include` 来源。循环引用会被自动检测并跳过。

## MaterialDB 集成

通过 `sentaurus.materialDbPath` 配置项可以指定一个 MaterialDB 目录，扩展会解析该目录下的所有 `.par` 文件，将其中的材料和物理参数纳入补全。它支持两种常见的文件格式：

- **顶层 block 格式**：文件直接以 `Bandgap { ... }` 开头，扩展会自动推断材料名（从文件名，如 `Silicon.par` → `Silicon`），并创建合成的 Material scope 包装
- **显式 scope 格式**：文件内已有 `Material "Silicon" { ... }` 声明，直接使用

两种格式在补全中表现一致，用户无需关心差异。

关于 MaterialDB 的配置方法和内置占位数据说明，参见 [用户配置](configuration.md#sentaurus-par-材料数据库)。

## workspace 扫描

扩展在激活时会自动扫描当前 workspace 中的所有 `.par` 文件，建立索引。后续文件的创建、修改、删除都会通过文件监听器实时更新索引，确保补全建议始终反映最新的 workspace 状态。

扫描进度会在 VSCode 状态栏中显示。如果补全请求到达时 workspace 扫描尚未完成，扩展会先返回已有结果（当前文件 + MaterialDB），待扫描完成后下一次触发即可获得完整补全。
