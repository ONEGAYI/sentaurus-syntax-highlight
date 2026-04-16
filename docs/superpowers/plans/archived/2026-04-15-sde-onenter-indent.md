# SDE 括号内回车自动缩进 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SDE（Scheme）文件中，于 `)` 前回车时自动将 `)` 移到新行并缩进光标所在行。

**Architecture:** 在 `language-configurations/sde.json` 中添加 VSCode 声明式 `onEnterRules`，使用 `indentOutdent` action 实现两行插入（缩进行 + 反缩进行）。通过正则 `beforeText`/`afterText` 控制触发条件，排除空括号和注释行。

**Tech Stack:** VSCode Language Configuration (`onEnterRules`)

**Spec:** `docs/superpowers/specs/2026-04-15-sde-onenter-indent-design.md`

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `language-configurations/sde.json` | 修改 | 添加 `onEnterRules` 数组 |

仅修改一个文件，无新建文件。

---

### Task 1: 添加 onEnterRules 到 SDE 语言配置

**Files:**
- Modify: `language-configurations/sde.json`

- [ ] **Step 1: 在 `language-configurations/sde.json` 中添加 `onEnterRules`**

在 `indentationRules` 之后、文件闭合 `}` 之前，添加 `onEnterRules` 数组。完整文件内容：

```json
{
  "comments": {
    "lineComment": ";"
  },
  "brackets": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"]
  ],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"", "notIn": ["string"] }
  ],
  "surroundingPairs": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["\"", "\""]
  ],
  "indentationRules": {
    "increaseIndentPattern": "^.*\\{[^}\"']*$|^.*\\([^)\"']*$",
    "decreaseIndentPattern": "^\\s*[})]"
  },
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
}
```

- [ ] **Step 2: 验证 JSON 语法正确**

Run: `node -e "JSON.parse(require('fs').readFileSync('language-configurations/sde.json','utf8')); console.log('JSON valid')"`
Expected: `JSON valid`

- [ ] **Step 3: 在 VSCode Extension Development Host 中手动测试**

按 F5 启动 Extension Development Host，打开一个 `.scm` 文件，测试以下场景：

| 场景 | 输入 | 期望结果 |
|------|------|----------|
| 基本触发 | `(foo` 光标在 `)` 前，回车 | `(foo` `\t` 光标 `)` |
| 多参数 | `(foo bar` 光标在 `)` 前，回车 | `(foo bar` `\t` 光标 `)` |
| 空括号 | `()` 光标在 `)` 前，回车 | 不触发特殊行为 |
| 注释行 | `;(foo` 光标在 `)` 前，回车 | 不触发特殊行为 |
| 带行尾注释 | `(foo` 光标在 `)` 前，`)` 后有空格 | 触发 |

- [ ] **Step 4: 提交**

```bash
git add language-configurations/sde.json
git commit -m "feat: SDE 括号内回车自动缩进（onEnterRules）"
```
