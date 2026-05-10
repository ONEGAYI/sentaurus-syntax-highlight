# Tcl 内建函数补全 — 设计方案

日期：2026-05-08 | 状态：已批准

## 背景

当前扩展对 Tcl 内建函数的覆盖有两处缺口：

1. **`expr` 数学函数完全空白**——`asin`、`acos`、`atan2`、`sinh` 等 31 个数学函数既无语法高亮也无悬停文档
2. **Tcl 核心命令覆盖不全**——语法文件中有 42 个命令的高亮规则，`tcl_command_docs.json` 中有 43 个命令的文档，两者间存在不匹配；另有约 49 个一级核心命令完全缺失

## 目标

分两阶段补全 Tcl 内建函数覆盖。本次为第一阶段，聚焦数学函数和常用核心命令。

## 第一阶段：数学函数 + 常用核心命令

### 1. 数学函数

#### 新增文件

| 文件 | 内容 |
|------|------|
| `syntaxes/tcl_expr_mathfunc_docs.json` | 31 个 `expr` 数学函数英文文档 |
| `syntaxes/tcl_expr_mathfunc_docs.zh-CN.json` | 中文翻译版本 |

文档 JSON 结构与现有 `tcl_command_docs.json` 一致：`{ "函数名": { signature, description, parameters[], example } }`

#### 语法高亮

5 个 Tcl 工具语法文件（`sdevice`, `sprocess`, `emw`, `inspect`, `svisual`）各新增一条匹配规则：

```json
{
  "match": "\\b(abs|acos|asin|atan|atan2|bool|ceil|cos|cosh|double|entier|exp|floor|fmod|hypot|int|isqrt|log|log10|max|min|pow|rand|round|sin|sinh|sqrt|srand|tan|tanh|wide)\\b",
  "name": "support.function.math.tcl"
}
```

- 规则位置：在现有 Tcl 内建命令高亮规则之后，兜底标识符规则之前
- Scope 命名：`support.function.math.tcl`，与 `support.function.<tool>` 区分

#### 补全与悬停

- `src/extension.js` 中加载 `tcl_expr_mathfunc_docs`，合并到 `funcDocs` 对象
- CompletionItemProvider 和 HoverProvider 自动继承（关键词已存在于补全词表和文档查询中）
- `all_keywords.json` 中为 Tcl 类工具添加 `mathfunc` 关键词组

### 2. 语法/文档不匹配修复

| 方向 | 命令 | 修复方式 |
|------|------|----------|
| 语法有、文档无 | `after`, `concat`, `eval`, `vwait` | 补充到 `tcl_command_docs.json`（中英文） |
| 文档有、语法无 | `proc`, `try`, `throw`, `regexp`, `flush` | 补充到 5 个语法文件的正则中 |

### 3. 新增常用核心命令文档

以下命令在 Sentaurus Tcl 脚本中常用，补充到 `tcl_command_docs.json` 并加入语法高亮正则：

| 类别 | 命令 |
|------|------|
| 流程控制 | `for`, `foreach`, `while`, `if`, `switch`, `return`, `break`, `continue` |
| 事件循环 | `update` |
| 系统操作 | `cd`, `pwd`, `exec`, `exit`, `time` |
| 列表进阶 | `lrepeat`, `lreverse`, `lassign`, `lset`, `lmap` |

共约 18 个。同时更新语法文件正则中对应的 Tcl 内建命令列表。

### 4. 涉及的语法文件

- `syntaxes/sdevice.tmLanguage.json`
- `syntaxes/sprocess.tmLanguage.json`
- `syntaxes/emw.tmLanguage.json`
- `syntaxes/inspect.tmLanguage.json`
- `syntaxes/svisual.tmLanguage.json`

所有 5 个文件的 Tcl 内建命令正则需保持一致。SDE（Scheme 方言）不受影响。

### 5. 涉及的源码文件

- `src/extension.js` — 加载 `tcl_expr_mathfunc_docs`，注入补全和悬停
- `syntaxes/all_keywords.json` — 添加 `tcl_mathfunc` 关键词组

## 第二阶段：复杂命令体系（已转为 Issue）

以下命令含大量子命令，写入独立 JSON 文件工作量较大，且 Sentaurus 脚本中使用频率低。已创建 GitHub Issue `#10` 供后续跟进：

| 命令 | 子命令数 | 说明 |
|------|----------|------|
| `namespace` | 19 | 命名空间管理 |
| `dict` | 20 | 键值对字典 |
| `clock` | 7 | 日期时间操作 |
| `binary` | 4 | 二进制数据 |
| `encoding` | 5 | 字符编码转换 |
| `package` | 9 | 包管理 |
| `chan` | 20 | 现代通道 API |
| 其他 I/O | 9 | fconfigure, fblocked, eof, tell, seek, fileevent, socket, fcopy, fcopy |
| 高级函数 | 5 | apply, coroutine, yield, yieldto, tailcall |
| 其他杂项 | 6 | history, parray, pid, interp, trace, bgerror |

## 测试验证

- 在 `display_test/` 目录创建展示文件，覆盖 31 个数学函数和新增命令
- 确认高亮 scope 正确分配（`support.function.math.tcl` vs `support.function.<tool>`）
- 确认悬停文档正确显示（中英文切换）

## 不变更项

- TextMate 语法整体架构（首匹配胜出顺序）不变
- 现有 43 个命令的文档内容不变
- VSCode snippet 和 QuickPick 代码片段系统不变
- SDE（Scheme）语言不受影响
