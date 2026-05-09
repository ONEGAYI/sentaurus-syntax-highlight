# Tcl 子命令上下文感知高亮与文档悬停

> 状态：待实现 | 分支：`worktree-tcl-subcommands`
> 范围：5 个 Tcl tmLanguage 文件 + HoverProvider + CompletionProvider

## 背景

当前 5 个 Tcl 工具（sdevice、sprocess、emw、inspect、svisual）的 tmLanguage 文件覆盖了 Tcl 顶级命令（如 `string`、`file`、`info`）和数学函数，但**不覆盖子命令**。用户写 `string length $x` 时，只有 `string` 被高亮，`length` 落入兜底标识符。

Tcl 采用 `command subcommand ?args?` 调用模式，子命令是 Tcl 的核心组织方式。在 Sentaurus TCAD 脚本中，`string length`、`file exists`、`info procs` 等组合使用频率极高。

## 方案

**单次 match + captures**（非 begin/end），原因：

| 对比项 | match + captures | begin/end |
|--------|-----------------|-----------|
| 精确性 | ✅ `string length` 才高亮 | ❌ end 条件难定义 |
| 复杂度 | ✅ 一条正则 | ❌ begin/end/patterns 三层嵌套 |
| 兜底兼容 | ✅ 不干扰现有模式 | ❌ 吞掉后续兜底匹配 |
| 多次重复 | ✅ 自然支持同行多次 | ❌ 可能吞掉整行 |
| 文档查找 | ✅ captures 直接构建文档键 | ⚠️ 需额外解析 |

## 设计细节

### 1. TextMate 语法高亮

#### 模式结构

在 5 个 tmLanguage 文件中，插入 5 条子命令组合 match（位于顶级命令行之前）：

```json
{
  "match": "\\b(string)\\s+(length|match|range|first|last|index|trim|trimleft|trimright|tolower|toupper|totitle|equal|compare|is|map|repeat|replace|reverse|cat|wordstart|wordend|bytelength)\\b",
  "captures": {
    "1": { "name": "support.function.<lang>" },
    "2": { "name": "support.function.tcl-subcommand" }
  }
}
```

5 个主命令：`string`（21 子命令）、`file`（22）、`info`（14）、`array`（7）、`dict`（13），共约 77 个子命令。

#### 插入位置

```
流控制 (if|for|while...)
proc|try|throw
→ [新增] 5 条子命令组合 match ← 插入此处
顶级命令 (string|file|info|array|set...)
数学函数 (abs|sin|cos...)
兜底标识符
```

由于首匹配胜出，`string length` 被组合规则优先捕获；单独的 `string` 回退到顶级命令行。

#### Scope 命名

| 组件 | Scope | 说明 |
|------|-------|------|
| 主命令（group 1） | `support.function.<lang>` | 与现有顶级命令一致 |
| 子命令（group 2） | `support.function.tcl-subcommand` | 新 scope，可独立配色 |

#### 5 个主命令的完整子命令列表

**string**（21）：`length` `match` `range` `first` `last` `index` `trim` `trimleft` `trimright` `tolower` `toupper` `totitle` `equal` `compare` `is` `map` `repeat` `replace` `reverse` `cat` `wordstart` `wordend` `bytelength`

**file**（22 常用）：`join` `dirname` `tail` `extension` `rootname` `exists` `isfile` `isdirectory` `mkdir` `copy` `delete` `rename` `nativename` `normalize` `stat` `size` `readable` `writable` `executable` `mtime` `atime` `type`

**info**（14 常用）：`exists` `commands` `procs` `args` `body` `level` `script` `hostname` `patchlevel` `tclversion` `globals` `locals` `vars` `default`

**array**（7）：`exists` `get` `set` `names` `size` `unset` `statistics`

**dict**（13）：`create` `get` `set` `exists` `unset` `remove` `replace` `merge` `keys` `values` `size` `for` `map` `filter` `info` `update` `with`

### 2. 文档悬停（HoverProvider）

#### 文档 JSON 结构

新建 `syntaxes/tcl_subcommand_docs.json` + `zh-CN.json`，嵌套两级：

```json
{
  "string": {
    "length": {
      "signature": "string length string",
      "description": "返回字符串的字符数（非字节数）。",
      "example": "string length \"Hello\"  ;# → 5"
    }
  },
  "file": {
    "exists": {
      "signature": "file exists name",
      "description": "判断文件或目录是否存在，返回 1 或 0。",
      "example": "if {[file exists $path]} { ... }"
    }
  }
}
```

子命令条目只保留 signature + description + example，不设 parameters 数组。

#### 查找逻辑

修改 `src/extension.js` 的 HoverProvider：

```
1. 获取光标下的 word
2. 向前扫描同行文本，检查 word 前是否紧跟主命令
   正则：/\b(string|file|info|array|dict)\s+<word>\b/
3. 如果找到组合 → 查找 docs[parentCmd][word]
4. 未找到 → 回退现有逻辑
```

查找优先级：
1. sdevice 上下文感知（仅 sdevice）
2. Tcl 子命令组合（新增）
3. 现有通用文档

#### 显示格式

```markdown
**string length** `(Tcl 子命令)`

`string length string`

返回字符串的字符数（非字节数）。

**示例：**
string length "Hello"  ;# → 5
```

#### 加载与缓存

在 `_docsCache` 新增 `_tclSub` 槽：

```javascript
_docsCache.tclSub = loadDocsJson('tcl_subcommand_docs.json', useZh);
```

Tcl 语言工具共用同一份子命令文档，无需按语言区分。

### 3. 子命令补全（Completion）

#### 触发条件

```
1. 光标前文本匹配 /\b(string|file|info|array|dict)\s+$/
2. 主命令后只有空白，光标在第一个参数位
```

仅在此条件下返回子命令补全，其余位置完全回退到现有补全逻辑（变量、关键词等不受影响）。

#### 补全项

```javascript
item.kind = vscode.CompletionItemKind.Method;
item.detail = "Tcl 子命令";
item.documentation = new vscode.MarkdownString(subDoc.description);
```

不添加触发字符，用户按 Ctrl+Space 手动触发。

### 4. all_keywords.json

5 个工具各新增 `SUBCOMMAND` 类别，数据从 `tcl_subcommand_docs.json` 生成（或手工维护），用于补全数据源。

### 5. 已知局限

- **跨行续行不处理**：`string \` 后换行的 `length` 不会被 TextMate 匹配为子命令（match 模式按行处理）。`string` 本身仍被顶级命令行高亮。JS 端的 HoverProvider 同理，仅同行检测
- **string is 子子命令不覆盖**：`string is alnum` 中只高亮 `is`，不高亮 `alnum`
- **文档覆盖范围**：仅覆盖 5 个核心主命令，不含 clock、namespace、package 等低频命令

## 文件变更范围

| 变更 | 文件 | 说明 |
|------|------|------|
| 新增 | `syntaxes/tcl_subcommand_docs.json` | 子命令英文文档（~77 条） |
| 新增 | `syntaxes/tcl_subcommand_docs.zh-CN.json` | 子命令中文文档 |
| 修改 | `syntaxes/sdevice.tmLanguage.json` | 插入 5 条子命令 match |
| 修改 | `syntaxes/sprocess.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/emw.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/inspect.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/svisual.tmLanguage.json` | 同上 |
| 修改 | `src/extension.js` | HoverProvider 子命令查找 + 补全逻辑 |
| 修改 | `syntaxes/all_keywords.json` | 5 个工具新增 SUBCOMMAND 类别 |
| 更新 | `CLAUDE.md` | 文件树 + 架构描述 |

## 不涉及的模块

WASM 解析器、Semantic Tokens、诊断（bracket/undef）、折叠、签名提示——这些层不受影响。
