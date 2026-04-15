# SDE 括号内回车自动缩进

## 问题

当前 SDE（Scheme）文件在括号内回车时，仅简单换行并由 `indentationRules` 控制缩进级别，不会将关闭括号 `)` 移到新行。

```
当前行为：(foo|) → 回车 → (foo\n|)
期望行为：(foo|) → 回车 → (foo\n\t|\n)
```

## 需求

- 在 `)` 前回车时，`)` 自动移到新行并反缩进，光标所在行缩进
- 光标与 `)` 之间只有空白（空格/tab/无）时视为末尾，触发规则
- 排除：空括号 `()`、注释行（前导 `;`）

## 方案

在 `language-configurations/sde.json` 中添加 `onEnterRules`，使用 VSCode 声明式 Enter 规则。

### 规则

```json
"onEnterRules": [
  {
    "beforeText": "^(?!\\s*;).*\\([^)\\s][^)]*$",
    "afterText": "^\\s*\\)[\\s;]*$",
    "action": {
      "indent": "indentOutdent",
      "appendText": "\t"
    }
  }
]
```

### 正则解析

| 字段 | 正则 | 含义 |
|------|------|------|
| `beforeText` | `^(?!\\s*;)` | 行首不是可选空白 + `;`（排除注释行） |
| | `.*\\(` | 行内有 `(` |
| | `[^)\\s]` | `(` 后至少一个非空白字符（排除空括号） |
| | `[^)]*$` | `(` 之后没有 `)` |
| `afterText` | `^\\s*\\)` | 光标后可选空白 + `)` |
| | `[\\s;]*$` | `)` 后可选空白或注释至行尾 |

### 行为示例

| 输入 | 触发 | 输出 |
|------|------|------|
| `(foo\|)` | 是 | `(foo` `\t\|` `)` |
| `(foo bar\|)` | 是 | `(foo bar` `\t\|` `)` |
| `(foo\|) ; comment` | 是 | `(foo` `\t\|` `)` `; comment` |
| `()\|` | 否 | 空括号排除 |
| `;(foo\|)` | 否 | 注释行排除 |
| `(foo (bar\|)baz)` | 否 | 中间位置不触发 |

### 已知限制

- `appendText: "\t"` 在用户配置 `editor.insertSpaces: true`（空格缩进）时会插入 tab 而非对应空格数。这是 VSCode `onEnterRules` 的已知限制，内置 JS/TS 配置也存在。Scheme 社区惯例使用 tab 缩进，影响较小。

## 改动范围

- `language-configurations/sde.json` — 添加 `onEnterRules` 数组
