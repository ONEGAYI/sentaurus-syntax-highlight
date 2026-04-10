# SDE Scope 与 Dark+ 主题颜色对照

> Dark Modern 主题完全继承 Dark+ 的 tokenColors，颜色一致。

## Scope 总览

| # | TextMate Scope | 关键词来源 | 数量 | 典型示例 | Dark+ 色值 | 颜色描述 |
|---|---------------|-----------|------|---------|-----------|---------|
| 0 | `support.function.sde` | KEYWORD1 | 400 | `sdegeo:create-rectangle` `sde:build-mesh` `sdedr:define-refinement-size` | `#DCDCAA` | 黄色 |
| 1 | `keyword.other.sde` | KEYWORD2 | 159 | `erfc` `gvector:scale` `position:distance` | `#D4D4D4` | 默认前景(白) |
| 2 | `entity.name.tag.sde` | KEYWORD3 | 309 | `"stddev"` `"ic-material"` `"Both"` | `#D4D4D4` | 默认前景(白) |
| 3 | `support.type.sde` | LITERAL3 | 1974 | `"Silicon"` `"Oxide"` `"GaAs"` | `#4EC9B0` | 青绿色 |
| 4 | `entity.name.function.sde` | FUNCTION | 204 | `define` `lambda` `if` `cond` | `#DCDCAA` | 黄色 |
| 5 | `comment.line.hash` | 内置模式 | - | `# this is a comment` | `#6A9955` | 绿色 |
| 6 | `comment.line.double-slash` | 内置模式 | - | `// this is a comment` | `#6A9955` | 绿色 |
| 7 | `comment.line.semicolon` | 内置模式 | - | `; this is a comment` | `#6A9955` | 绿色 |
| 8 | `string.quoted.double` | 内置模式 | - | `"hello world"` | `#CE9178` | 橙色 |
| 9 | `constant.numeric` | 内置模式 | - | `1e-6` `0.5` `3.14e10` | `#B5CEA8` | 浅绿色 |
| 10 | `variable.parameter` | 内置模式 | - | `@node@` `@previous@` | `#9CDCFE` | 浅蓝色 |
| 11 | `variable.other` | 兜底模式 | - | `x0` `y0` `myVar` | `#9CDCFE` | 浅蓝色 |

## Dark+ 主题中相关 tokenColor 规则

| 色值 | 匹配的 Scope | 本扩展使用情况 |
|------|-------------|-------------|
| `#DCDCAA` 黄色 | `entity.name.function`, `support.function` | Scope #0 和 #4 共用此色 |
| `#4EC9B0` 青绿 | `support.type`, `support.class`, `entity.name.type` | Scope #3 (材料名) |
| `#C586C0` 粉紫 | `keyword.control`, `keyword.other.operator` | SDE 未使用 |
| `#9CDCFE` 浅蓝 | `variable`, `meta.definition.variable.name` | Scope #10 和 #11 |
| `#CE9178` 橙色 | `stringLiteral` (semantic) | Scope #8 (双引号字符串) |
| `#B5CEA8` 浅绿 | `numberLiteral` (semantic) | Scope #9 (数值) |
| `#6A9955` 绿色 | 注释（VS Code 内置默认） | Scope #5 #6 #7 |
| `#D4D4D4` 白色 | 编辑器默认前景色（无匹配规则时的回退） | Scope #1 和 #2 |

## 已知问题

- **Scope #0 与 #4 颜色相同**：`support.function` 和 `entity.name.function` 在 Dark+ 主题中映射到同一色值 `#DCDCAA`。在 Monokai、One Dark Pro 等主题中两者颜色不同。
- **Scope #1 和 #2 无专属颜色**：`keyword.other` 和 `entity.name.tag` 在 Dark+ 主题中没有显式规则，回退到默认前景色 `#D4D4D4`。
