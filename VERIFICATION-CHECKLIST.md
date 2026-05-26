# Phase 2.2 人工验收清单

> **分支**: `feat/sdevicepar-phase2.2`
> **功能**: SDEVICE PAR Workspace 全量扫描索引 + FileSystemWatcher 增量更新

---

## 准备工作

- [ ] 在 VSCode 中打开包含多个 `.par` 文件的 workspace 目录
- [ ] 准备至少 2 个不同的 `.par` 测试文件（如 `Silicon.par`、`Oxide.par`）
- [ ] 打开 Output 面板 → 选择 "Sentaurus Tcl WASM" 频道，确认 WASM 初始化成功

---

## 一、Workspace 扫描（激活时）

- [x] 激活扩展后，打开一个 `.par` 文件，触发补全 → 应能出现 workspace 中其他 `.par` 文件定义的 block 名（如 `Bandgap`、`Epsilon`）
- [x] 新启动 VSCode 时（已有 `.par` 文件在 workspace 中），打开 `.par` 文件 → 补全应立即可用，无需手动触发

**验证方法**: 在 `Material = "xxx" {` 的 `{` 内按 `Ctrl+Space`，检查是否出现 workspace 其他文件中的 block 名称。

---

## 二、FileSystemWatcher 增量更新

### 2.1 文件创建

- [x] 在 workspace 中新建一个 `.par` 文件，包含 `Bandgap { Eg0 = 1.12 }` 等 block
- [x] 切回已打开的 `.par` 文件，在 Material scope 内触发补全 → 应出现新文件中的 block 名

### 2.2 文件修改

- [x] 修改 workspace 中某个 `.par` 文件（添加新参数如 `NewParam = 1.0`）
- [x] 切回已打开的 `.par` 文件，在对应 block 内触发补全 → 应出现新添加的参数名
- [x] 修改 workspace 文件中的参数值（如 `Eg0 = 1.12` → `Eg0 = 1.16964`）
- [x] 补全提示的 detail 应反映新值

### 2.3 文件删除

- [x] 删除 workspace 中的某个 `.par` 文件
- [x] 切回已打开的 `.par` 文件触发补全 → 被删文件中的 block/参数不应再出现

---

## 三、补全合并与优先级

> 如何处理同一个工作区多文件（非当前文件）同时定义参数？优先度如何排序？

### 3.1 跨文件 block 聚合

- [ ] workspace 有文件 A 定义 `Bandgap {}` 和文件 B 定义 `Epsilon {}`
- [ ] 在当前文件的 `Material = "xxx" {}` 内触发补全 → 应同时出现 `Bandgap` 和 `Epsilon`

### 3.2 当前文件优先

- [ ] 当前文件定义 `Bandgap { Eg0 = 1.12 }`
- [ ] workspace 另一文件也定义 `Bandgap { Eg0 = 1.16964 }`
- [ ] 补全中 `Eg0` 应只出现一次，detail 显示当前文件的值 `1.12`（而非 workspace 的 `1.16964`）

### 3.3 scopeType 隔离

- [ ] workspace 文件在 `Material` scope 下定义了 `Bandgap` block
- [ ] 当前文件在 `Region` scope 内触发 block 补全 → `Bandgap` 不应出现（Material block 不属于 Region scopeType）

### 3.4 scope name 引号内补全

- [ ] 输入 `Material = "` 后光标在引号内 → 触发补全
- [ ] 应出现 workspace 中其他文件定义的 Material scope name（如 `Oxide`、`Silicon`）
- [ ] 不应出现 block 名或参数名

---

## 四、Include 与 Workspace 协作

### 4.1 三层来源去重

- [ ] 当前文件 `Eg0 = 1.16964`（current）
- [ ] include 的文件 `Eg0 = 1.12`（include）
- [ ] workspace 另一文件 `Eg0 = 1.10`（workspace）
- [ ] 补全中 `Eg0` 只出现一次，优先使用 current 的值 `1.16964`

### 4.2 Include 文件变更后刷新

- [ ] 当前文件 `#include "lib.par"`
- [ ] 外部编辑 `lib.par` 内容并保存
- [ ] 回到当前文件触发补全 → 应反映 `lib.par` 的新内容

---

## 五、缓存与资源管理

### 5.1 打开文档预热

- [ ] VSCode 已打开 `.par` 文件 A 和文件 B
- [ ] 重载窗口后（`Ctrl+Shift+P` → Reload Window）
- [ ] 在文件 A 中触发补全 → workspace 文件 B 的 block 应立即可用（无需等待）

### 5.2 文件关闭清理

- [ ] 关闭一个 `.par` 文件
- [ ] 不应产生错误日志（检查 Output 面板和 Developer Console）

### 5.3 无内存泄漏

- [ ] 打开/关闭多个 `.par` 文件多次
- [ ] 检查 VSCode 内存占用是否异常增长（`Ctrl+Shift+P` → Developer: Open Process Explorer）

### 5.4 Dispose 正常

- [ ] 禁用扩展或关闭 VSCode → 不应有未捕获异常
- [ ] Developer Console（`Ctrl+Shift+I`）无红色错误

---

## 六、边界情况

### 6.1 空 workspace

- [ ] workspace 中没有 `.par` 文件 → 打开一个新建的 `.par` 文件 → 补全应提供内置 scope type（Material、Region、Electrode 等）

### 6.2 大量文件

- [ ] workspace 中有 20+ 个 `.par` 文件 → 补全响应时间应无明显卡顿（< 100ms）

### 6.3 无法读取的文件

- [ ] workspace 中存在权限不足的 `.par` 文件 → 扩展不应崩溃，其他文件的补全仍正常

### 6.4 语法错误的 .par 文件

- [ ] workspace 中某个 `.par` 文件有语法错误（如未闭合的 `{`）→ 扩展不应崩溃，其他文件补全正常

---

## 七、自动化测试验证

```bash
node tests/test-par-index.js
```

- [ ] 输出应显示 **89 passed, 0 failed**（31 parser + 15 context + 13 completion + 30 index）

```bash
node tests/test-par-parser.js && node tests/test-par-context.js && node tests/test-par-completion.js
```

- [ ] 各独立测试套件全部通过

---

## 验收结论

| 类别 | 通过数 | 失败数 | 备注 |
|------|--------|--------|------|
| 一、Workspace 扫描 | /2 | | |
| 二、FileSystemWatcher | /5 | | |
| 三、补全合并与优先级 | /7 | | |
| 四、Include 协作 | /2 | | |
| 五、缓存与资源管理 | /4 | | |
| 六、边界情况 | /4 | | |
| 七、自动化测试 | /2 | | |

**签字**: ________________ **日期**: ________________
