# Phase 2.3 MaterialDB 手动验收清单

> 临时文件，不提交。按 F5 启动 Extension Development Host 后逐项验证。

## 配置项

- [x] VSCode 设置中搜索 `sentaurus.materialDbPath`，确认出现且中英文描述正确
- [x] 默认值为空字符串
- [ ] scope 为 machine（不在 workspace 级别出现）

## 内置占位 MaterialDB（配置为空时）

- [x] 打开一个 `.par` 文件
- [x] 输入 `Material = "`，在引号内触发补全 → 应出现 `Silicon`、`Oxide`
- [x] 选择 `Silicon` 后在大括号内触发补全 → 应出现 `Epsilon`、`Bandgap` block
- [x] 在 `Epsilon { }` 内触发补全 → 应出现 `epsilon` parameter（值为 11.7）
- [x] 在 `Bandgap { }` 内触发补全 → 应出现 `Eg0` parameter（值为 1.12）
- [x] 同理验证 Oxide 有 `Epsilon` block + `epsilon` parameter（值为 3.9）

## 补全优先级

- [ ] workspace 中有同名材料时，workspace source 应优先于 materialdb
- [ ] 当前文件中定义的参数应优先于 materialdb 中的同名参数

## 用户自定义 MaterialDB 路径

- [x] 设置 `sentaurus.materialDbPath` 为有效 `.par` 文件目录 → 状态栏短暂显示加载文件数
- [x] 补全能出现用户 DB 中的材料名、block、parameter
- [x] 设置为无效路径（不存在的目录） → fallback 到内置占位
- [x] 设置为文件路径（非目录） → fallback 到内置占位
- [x] 设置为空目录（无 .par 文件） → fallback 到内置占位

## 配置变更热重载

- [x] 修改 `sentaurus.materialDbPath` 值后（无需重启 VSCode），补全应立即反映新数据
- [x] 从有效路径改为空 → 切换回内置占位
- [x] 从空改为有效路径 → 切换到用户 DB

## 格式兼容性

- [ ] 目录中放置格式 A 文件（顶层 block，如真实 Silicon.par） → 按文件名自动包裹 Material scope
- [ ] 目录中放置格式 B 文件（含 `Material = "X"` 声明） → 不二次包裹
- [ ] 混合格式文件共存时均正确解析

## 边界情况

- [ ] 目录中放置非 `.par` 后缀文件 → 应被忽略
- [ ] 目录中放置空 `.par` 文件（只有注释） → 不影响加载计数
- [ ] 目录中放置大写后缀 `.PAR` → 应被识别（大小写不敏感）
