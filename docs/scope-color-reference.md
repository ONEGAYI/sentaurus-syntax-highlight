# 全语言 Scope + Color + KeywordType 查询表

> Dark Modern 主题完全继承 Dark+ 的 tokenColors，颜色一致。
> 语义 Token 类型（`userFunctionCall` 等）为自定义类型，VS Code 无内置映射，回退到默认前景色 `#D4D4D4`，需通过 `editor.semanticTokenColorCustomizations` 自定义。

## 一、TextMate Scope 总览（6 语言共用）

以下 scope 在所有 6 种语言中出现，Dark+ 主题中匹配规则相同。

| # | Scope | 语义 | 典型示例 | Dark+ 色值 | 颜色 |
|---|-------|------|---------|-----------|------|
| C0 | `comment.line.hash` | `#` 行注释 | `# this is a comment` | `#6A9955` | 绿色 |
| C1 | `comment.line.semicolon` | `;` 行注释（仅 SDE） | `; this is a comment` | `#6A9955` | 绿色 |
| C2 | `comment.line.asterisk` | `*` 行注释（5 种 Tcl） | `* this is a comment` | `#6A9955` | 绿色 |
| C3 | `string.quoted.double` | 双引号字符串 | `"hello world"` | `#CE9178` | 橙色 |
| C4 | `string.quoted.double.tcl` | Tcl 上下文字符串（5 种 Tcl） | `"Silicon"` | `#CE9178` | 橙色 |
| C5 | `constant.numeric` | 数值字面量 | `1e-6` `0.5` `3.14e10` | `#B5CEA8` | 浅绿色 |
| C6 | `constant.character.escape` | 转义字符 | `\\n` `\\t` | `#D7BA7D` | 黄橙色 |
| C7 | `constant.character.format.placeholder` | `@Var@` SWB 参数 | `@node@` `@previous@` | `#9CDCFE` | 浅蓝色 |
| C8 | `variable.other` | 兜底标识符 | `x0` `y0` `myVar` | `#9CDCFE` | 浅蓝色 |
| C9 | `keyword.control.preprocessor.tcl` | Tcl 预处理器指令 | `#ifdef` `#define` `#set` | `#569CD6` | 蓝色 |
| C10 | `keyword.control.preprocessor.sde` | Scheme 预处理器指令（仅 SDE） | `#ifdef` `#define` | `#569CD6` | 蓝色 |
| C11 | `meta.preprocessor.tcl` | Tcl 预处理器块 | `#ifdef ... #endif` | `#569CD6` | 蓝色 |
| C12 | `meta.preprocessor.sde` | Scheme 预处理器块（仅 SDE） | `#ifdef ... #endif` | `#569CD6` | 蓝色 |

### 匹配依据（Dark+ tokenColors 规则）

| 色值 | 匹配的 Scope 规则 | 本扩展使用情况 |
|------|-------------------|--------------|
| `#6A9955` | `"comment"` | C0, C1, C2 |
| `#CE9178` | `"string"` | C3, C4 |
| `#B5CEA8` | `"constant.numeric"` | C5 |
| `#D7BA7D` | `"constant.character.escape"` | C6 |
| `#9CDCFE` | `"variable"` | C7, C8 |
| `#569CD6` | `"meta.preprocessor"`, `"keyword.control"` | C9, C10, C11, C12 |

## 二、各语言 KeywordType → Scope 映射

> **标准映射**（extract_keywords.py 默认）：KEYWORD1→`keyword.control`、KEYWORD2→`keyword.other`、KEYWORD3→`entity.name.tag`、KEYWORD4→`support.class`、LITERAL1/2→`constant.numeric`、LITERAL3→`string.quoted`、FUNCTION→`entity.name.function`
>
> 带 **✱** 的为手动调整后的映射。

### SDE（Scheme 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 401 | `support.function.sde` **✱** | `#DCDCAA` | 黄色 | `sdegeo:create-rectangle` `sde:build-mesh` |
| KEYWORD2 | 159 | `keyword.other.sde` | `#D4D4D4` | 白色 | `erfc` `gvector:scale` |
| KEYWORD3 | 309 | `entity.name.tag.sde` | `#569CD6` | 蓝色 | `"stddev"` `"ic-material"` |
| LITERAL3 | 1974 | `support.type.sde` **✱** | `#4EC9B0` | 青绿色 | `"Silicon"` `"Oxide"` `"GaAs"` |
| FUNCTION | 204 | `entity.name.function.sde` | `#DCDCAA` | 黄色 | `define` `lambda` `if` `cond` |

### SDEVICE（Tcl 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 25 | `keyword.control.sdevice` | `#569CD6` | 蓝色 | `Physics` `Solve` `Math` `System` |
| KEYWORD2 | 31 | `keyword.other.sdevice` | `#D4D4D4` | 白色 | `ACCoupled` `QuasiStationary` `Transient` |
| KEYWORD3 | 290 | `entity.name.tag.sdevice` | `#569CD6` | 蓝色 | `Recombination` `Mobility` `BandGap` |
| KEYWORD4 | 1 | `support.class.sdevice` | `#4EC9B0` | 青绿色 | `Insert` |
| LITERAL1 | 719 | `constant.numeric.sdevice` | `#B5CEA8` | 浅绿色 | 数值参数值 |
| LITERAL2 | 1 | `constant.numeric.sdevice` | `#B5CEA8` | 浅绿色 | 数值参数值 |
| LITERAL3 | 1169 | `constant.numeric.sdevice` **✱** | `#B5CEA8` | 浅绿色 | 数值参数值 |
| FUNCTION | 57 | `support.function.sdevice` **✱** | `#DCDCAA` | 黄色 | `set` `puts` `if` `for` |
| — | 42 | `support.function.sdevice`（手动） | `#DCDCAA` | 黄色 | Tcl 内置命令 |

### SPROCESS（Tcl 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 136 | `keyword.control.sprocess` | `#569CD6` | 蓝色 | `deposit` `etch` `implant` `diffuse` |
| KEYWORD2 | 943 | `keyword.other.sprocess` | `#D4D4D4` | 白色 | 工艺参数选项 |
| KEYWORD3 | 652 | `entity.name.tag.sprocess` | `#569CD6` | 蓝色 | 工艺参数值 |
| KEYWORD4 | 29 | `support.class.sprocess` | `#4EC9B0` | 青绿色 | `pdb*` 命名空间函数 |
| LITERAL3 | 156 | `string.quoted.sprocess` | `#CE9178` | 橙色 | 材料名、类型值 |
| FUNCTION | 128 | `entity.name.function.sprocess` | `#DCDCAA` | 黄色 | SPROCESS 专用函数 |
| — | 42 | `support.function.sprocess`（手动） | `#DCDCAA` | 黄色 | Tcl 内置命令 |
| — | — | `support.constant.unit`（手动） | `#B5CEA8` | 浅绿色 | `<cm>` `<um>` 单位符 |

### EMW（Tcl 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 20 | `keyword.control.emw` | `#569CD6` | 蓝色 | EMW 命令 |
| LITERAL1 | 128 | `constant.numeric.emw` | `#B5CEA8` | 浅绿色 | 数值参数 |
| LITERAL3 | 185 | `string.quoted.emw` | `#CE9178` | 橙色 | 材料名、边界类型 |
| FUNCTION | 57 | `support.function.emw` **✱** | `#DCDCAA` | 黄色 | EMW 函数 + Tcl 内置 |
| — | — | `keyword.other.emw`（手动） | `#D4D4D4` | 白色 | 二级选项 |

### INSPECT（Tcl 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 208 | `keyword.control.inspect` | `#569CD6` | 蓝色 | `cv_create` `proj_get` |
| KEYWORD2 | 71 | `keyword.other.inspect` | `#D4D4D4` | 白色 | `True` `False` `LOG` |
| KEYWORD3 | 133 | `entity.name.tag.inspect` | `#569CD6` | 蓝色 | 物理常量名 |
| KEYWORD4 | 56 | `support.class.inspect` | `#4EC9B0` | 青绿色 | 数学函数命名空间 |
| FUNCTION | 109 | `entity.name.function.inspect` | `#DCDCAA` | 黄色 | Inspect 专用函数 |
| — | 42 | `support.function.inspect`（手动） | `#DCDCAA` | 黄色 | Tcl 内置命令 |

### SVISUAL（Tcl 方言）

| XML Tag | 数量 | 实际 Scope | Dark+ 色值 | 颜色 | 典型示例 |
|---------|------|-----------|-----------|------|---------|
| KEYWORD1 | 138 | `keyword.control.svisual` | `#569CD6` | 蓝色 | `create_plot` `load_file` |
| KEYWORD2 | 315 | `keyword.other.svisual` | `#D4D4D4` | 白色 | 参数选项 |
| KEYWORD3 | 261 | `entity.name.tag.svisual` | `#569CD6` | 蓝色 | 布尔标志、设置值 |
| KEYWORD4 | 119 | `support.class.svisual` | `#4EC9B0` | 青绿色 | `rfx::` `const::` `ext::` 命名空间 |
| LITERAL3 | 97 | `string.quoted.svisual` | `#CE9178` | 橙色 | 枚举值（solid, dashed...） |
| FUNCTION | 57 | `support.function.svisual` **✱** | `#DCDCAA` | 黄色 | Svisual 函数 + Tcl 内置 |
| — | — | `variable.parameter`（手动） | `#9CDCFE` | 浅蓝色 | 特殊变量上下文 |

## 三、手动添加的 Tcl 内置命令模式

5 种 Tcl 语言均包含以下手动添加的高亮模式；子命令补全候选同步在 `all_keywords.json` 的 `SUBCOMMAND` 分类中。

| Scope | 关键词 | 数量 |
|-------|--------|------|
| `keyword.control.{lang}` | `if` `else` `elseif` `for` `foreach` `while` `switch` `break` `continue` `return` | ~10 |
| `keyword.other.{lang}` | `proc` `try` `throw` | ~3 |
| `support.function.{lang}` | Tcl 内置与复杂命令父命令（如 `namespace` `dict` `clock` `chan`） | 83+ |
| `support.type.tcl-subcommand` | `string/file/info/array/dict/namespace/clock/binary/encoding/package/chan` 子命令（如 `namespace eval` 的 `eval`、`dict get` 的 `get`） | 152 |

## 四、Semantic Token 类型

扩展注册了两个独立的语义 Token Provider：

### SDE — 用户定义函数调用

| Token 类型 | 用途 | Dark+ 默认色值 | 说明 |
|-----------|------|---------------|------|
| `userFunctionCall` | 高亮用户定义的函数调用 | `#D4D4D4`（默认前景） | 自定义类型，无 VS Code 内置映射，可通过 `editor.semanticTokenColorCustomizations` 自定义为 `#DCDCAA` 等 |

### SDEVICE — Section 语义高亮

| Token 类型 | 用途 | Dark+ 默认色值 | 说明 |
|-----------|------|---------------|------|
| `sectionName` | 顶层 Section 名（如 `Physics {`） | `#D4D4D4`（默认前景） | 仅在顶层（不在其他 Section 内）时高亮 |
| `sectionKeyword` | Section 内专属关键词/参数 | `#D4D4D4`（默认前景） | 基于 Section 上下文栈匹配，同一关键词在不同 Section 中可能有不同高亮 |

## 五、Dark+ 主题色值速查

| 色值 | 颜色名 | 匹配的 Scope 规则（与本扩展相关的） |
|------|--------|-----------------------------------|
| `#569CD6` | 蓝色 | `keyword`, `keyword.control`, `storage`, `meta.preprocessor`, `entity.name.tag`, `constant.language` |
| `#DCDCAA` | 黄色 | `entity.name.function`, `support.function` |
| `#4EC9B0` | 青绿色 | `support.class`, `support.type`, `entity.name.type` |
| `#9CDCFE` | 浅蓝色 | `variable`, `meta.definition.variable.name`, `support.variable` |
| `#CE9178` | 橙色 | `string`, `string.tag`, `string.value` |
| `#B5CEA8` | 浅绿色 | `constant.numeric`, `keyword.other.unit` |
| `#6A9955` | 绿色 | `comment` |
| `#C586C0` | 粉紫色 | `keyword.control`（C/C++ 上下文）、`keyword.other.operator` |
| `#D7BA7D` | 黄橙色 | `constant.character.escape`, `entity.name.tag.css` |
| `#4FC1FF` | 亮蓝色 | `variable.other.constant`, `variable.other.enummember` |
| `#D4D4D4` | 白色 | 编辑器默认前景色（无匹配规则时的回退） |

## 六、已知问题与设计决策

- **KEYWORD1 映射差异**：SDE 的 KEYWORD1（401 个命令）被手动映射到 `support.function` 而非默认的 `keyword.control`，原因是这些 SDE 命令（`sdegeo:`, `sde:`, `sdedr:`）语义上更接近库函数调用，黄色 `#DCDCAA` 比蓝色 `#569CD6` 更易辨识。
- **LITERAL3 映射差异**：SDE 的 LITERAL3（1974 个材料名）映射到 `support.type`（青绿色 `#4EC9B0`），SDEVICE 的 LITERAL3 映射到 `constant.numeric`（浅绿色 `#B5CEA8`），均偏离了默认的 `string.quoted`（橙色）。
- **FUNCTION 映射差异**：部分语言（SDEVICE、EMW、SVISUAL）将 FUNCTION 映射到 `support.function` 而非 `entity.name.function`，与手动添加的 Tcl 内置命令共用 scope。
- **`keyword.other` 无专属颜色**：Dark+ 主题中没有 `keyword.other` 的显式规则，回退到默认前景色 `#D4D4D4`。在 Monokai、One Dark Pro 等主题中会有不同表现。
- **`entity.name.tag` 颜色**：Dark+ 主题匹配到 `#569CD6`（蓝色），这是标准 HTML 标签色。对 TCAD 参数值来说视觉效果尚可，但并非最优。
- **Semantic Token 颜色**：自定义类型（`userFunctionCall`, `sectionName`, `sectionKeyword`）在 Dark+ 主题下回退到默认前景色，需要用户通过 `editor.semanticTokenColorCustomizations` 手动配置才能看到区分。
