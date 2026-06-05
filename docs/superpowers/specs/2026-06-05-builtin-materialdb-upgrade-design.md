# #76 内置 MaterialDB 从 Stub 升级为 Bundled 文件加载

## 背景

当前 `par-constants.js` 中的 `BUILTIN_MATERIALDB_STUB_FILES` 仅包含 Silicon（2 block）和 Oxide（1 block）的内联文本，共 81 字节。这是 Phase 2.3 MVP 的占位实现，仅用于证明 MaterialDB 管线接入成功。

`references/MaterialDB/` 目录包含完整的 Sentaurus T-2022.03 MaterialDB 文件（7 个材料文件，169KB，188 个 block），但被打包排除，未纳入内置数据。

## 目标

将内置 MaterialDB 从内联 stub 升级为从 bundled 目录加载真实 .par 文件，使未配置 `sentaurus.materialDbPath` 时也能提供有实用价值的补全候选。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 加载策略 | Bundled 文件 + 运行时 readFile | 复用现有管线，零构建步骤 |
| 加载时机 | activate 时同步加载 | 169KB 文件 IO 约 1-5ms，用户无感知 |
| 目录位置 | 复用 `references/MaterialDB/` | `resolveFilePath()` 已有查找逻辑，零改动 |
| 版权头处理 | 原样保留 | 仅 3KB（1.8%），保持文件完整性 |
| 材料范围 | 全部 7 个文件 | 总量仅 169KB，覆盖面最大 |

## 纳入文件

| 文件 | 大小 | Blocks | 说明 |
|------|------|--------|------|
| Silicon.par | 101KB | 99 | 最常用半导体材料 |
| Oxide.par | 20KB | 18 | 氧化硅介质 |
| Germanium.par | 16KB | 21 | 锗半导体 |
| Si3N4.par | 10KB | 14 | 氮化硅介质 |
| HfO2.par | 9KB | 12 | 高 k 介质 |
| 4H-SiC.par | 8KB | 13 | 碳化硅 |
| Metal.par | 8KB | 11 | 金属电极 |
| **合计** | **~169KB** | **188** | |

排除 `example_sdevice.par`（器件定义文件，非材料参数文件）。

## 改动范围

### 1. `par-constants.js`

- **移除** `BUILTIN_MATERIALDB_STUB_FILES` 常量及内联文本
- **新增** `BUILTIN_MATERIALDB_DIR` 常量：`'references/MaterialDB'`
- **新增** `BUILTIN_MATERIALDB_EXCLUDE` 常量：`Set(['example_sdevice.par'])`
- **更新** `module.exports`

### 2. `par-index-service.js`

改造 `loadBuiltinMaterialDb()`：
1. 拼接 `path.join(extensionPath, BUILTIN_MATERIALDB_DIR)`
2. `fs.readdirSync` 扫描 `.par` 文件
3. 过滤掉 `BUILTIN_MATERIALDB_EXCLUDE` 中的文件
4. 对每个文件 `readFile` → `addMaterialDbFile(filePath, text)`

导入同步更新：从 `par-constants` 导入新常量替代 `BUILTIN_MATERIALDB_STUB_FILES`。

### 3. `.vscodeignore`

```
references/**                    ← 现有规则
!references/MaterialDB/**        ← 新增例外
```

### 4. `THIRD_PARTY_NOTICES.md`

新增 MaterialDB 数据来源说明，注明文件来自 Sentaurus T-2022.03。

### 5. 测试

- 新增：验证 `loadBuiltinMaterialDb()` 从 bundled 目录加载 7 个文件
- 新增：验证 `BUILTIN_MATERIALDB_EXCLUDE` 排除 `example_sdevice.par`
- 更新：现有引用 `BUILTIN_MATERIALDB_STUB_FILES` 的断言适配新接口

## 不变部分

- `resolveFilePath()` 中 bundled 目录查找逻辑（`par-index-service.js:91-95`）：无需改动，它服务于 include 解析场景
- `addMaterialDbFile()` 的格式 A/B 归一化逻辑：无需改动
- 用户配置 `sentaurus.materialDbPath` 时的行为：`clearMaterialDb()` → 加载用户目录 → 替换 builtin，流程不变
- `buildParCompletions()` 补全调度逻辑：无需改动

## 验收标准

1. `npx vsce ls --tree` 中出现 `references/MaterialDB/` 下的 7 个 .par 文件
2. 未配置 `sentaurus.materialDbPath` 时，sdevicepar 文件补全能看到 Silicon 的全部 block（Epsilon、Bandgap、Masettti、Lombardi 等）
3. 配置 `sentaurus.materialDbPath` 后，builtin 数据被用户数据替换，行为不变
4. 所有现有测试通过，新增测试覆盖目录加载逻辑
