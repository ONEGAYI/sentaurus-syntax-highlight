# SPROCESS `<Unit>` 语法高亮实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SPROCESS 语法文件添加 `<Unit>` 物理单位语法高亮，并提供明暗主题默认配色。

**Architecture:** 在 `sprocess.tmLanguage.json` 的 patterns 数组中插入一条 TextMate match 规则，正则匹配 `<Unit>` 模式并标记为 `support.constant.unit` scope。同时在 `package.json` 的 `contributes.configurationDefaults` 中注册明暗两套主题的默认前景色。测试文件添加示例以供视觉验证。

**Tech Stack:** TextMate Grammar (JSON)、VSCode extension API (`configurationDefaults`)

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `syntaxes/sprocess.tmLanguage.json` | 插入 Unit 匹配规则 |
| 修改 | `package.json` | 添加 `configurationDefaults` 配色 |
| 修改 | `display_test/testbench_fps.cmd` | 添加 `<Unit>` 语法测试示例 |

---

### Task 1: 在 sprocess.tmLanguage.json 中插入 Unit 匹配规则

**Files:**
- 修改: `syntaxes/sprocess.tmLanguage.json:339-340`

- [ ] **Step 1: 在 `@Var@` 规则之后插入 Unit 规则**

在 `sprocess.tmLanguage.json` 中，`@Var@` 规则（第 336-339 行）之后、`keyword.control` 规则（第 340 行）之前，插入以下规则：

```json
{
  "match": "<[A-Za-z][A-Za-z0-9_/*\\-+.^]*>",
  "name": "support.constant.unit"
},
```

完整的插入上下文（第 336-343 行区域）：

```json
        {
          "match": "@[a-zA-Z_<][^@]*@",
          "name": "constant.character.format.placeholder"
        },
        {
          "match": "<[A-Za-z][A-Za-z0-9_/*\\-+.^]*>",
          "name": "support.constant.unit"
        },
        {
          "match": "\\b(if|else|elseif|for|foreach|while|switch|break|continue|return)\\b",
          "name": "keyword.control.sprocess"
        },
```

**正则说明**：
- `<` — 左尖括号
- `[A-Za-z]` — 首字符必须为字母（排除 `<10>` 等 Tcl 比较运算）
- `[A-Za-z0-9_/*\-+.^]*` — 允许的后续字符：字母、数字、下划线、斜杠（`<l/min>`）、星号、连字符（`<cm-3>`）、加号、点、脱字符
- `>` — 右尖括号

- [ ] **Step 2: 在 VSCode Extension Development Host 中验证正则**

1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/testbench_fps.cmd`
3. 在文件末尾临时输入以下内容，确认每个都被正确高亮：

```
# 临时测试 — 完成验证后删除
line x location= 0.5<um> spacing= 50<nm>
init concentration= 1.0e15<cm-3> field= Boron
diffuse temperature= 900<C> time= 40<min>
implant energy= 30.00<keV> dose= 1.00e+14<cm-2> tilt= 7.00<degree>
gas.flow rate= 2.5<l/min> pressure= 1.0<atm>
```

**验证要点**：
- `<um>`, `<nm>`, `<cm-3>`, `<C>`, `<min>`, `<keV>`, `<cm-2>`, `<degree>`, `<l/min>`, `<atm>` 全部被高亮
- `< 10`（Tcl 比较）**不**被高亮
- `"text <um> end"` 中 `<um>` 不被高亮（字符串优先匹配）

- [ ] **Step 3: Commit**

```bash
git add syntaxes/sprocess.tmLanguage.json
git commit -m "feat(sprocess): 添加 <Unit> 物理单位语法高亮规则"
```

---

### Task 2: 在 package.json 中添加 configurationDefaults 默认配色

**Files:**
- 修改: `package.json:308-309`

- [ ] **Step 1: 在 `contributes` 内添加 `configurationDefaults` 节点**

`package.json` 第 308 行是 `configuration` 数组的闭合 `]`，第 309 行是 `contributes` 对象的闭合 `}`。在这两行之间插入 `configurationDefaults`：

在 `]`（第 308 行）之后、`}`（第 309 行）之前，添加逗号并插入：

```json
    ],
    "configurationDefaults": {
      "editor.tokenColorCustomizations": {
        "[*Dark*]": {
          "textMateRules": [
            {
              "scope": "support.constant.unit",
              "settings": {
                "foreground": "#CE9178"
              }
            }
          ]
        },
        "[*Light*]": {
          "textMateRules": [
            {
              "scope": "support.constant.unit",
              "settings": {
                "foreground": "#D73A49"
              }
            }
          ]
        }
      }
    }
```

**配色来源**：
- 暗色 `#CE9178`：VSCode Dark+ 主题的字符串色（暖橙），与数值文字形成视觉区分
- 亮色 `#D73A49`：VSCode Light+ 主题的关键字色（深红），在浅色背景上醒目

- [ ] **Step 2: 在 Extension Development Host 中验证配色**

1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/testbench_fps.cmd`
3. 切换到暗色主题（如 Dark+），确认 `<Unit>` 显示为暖橙色 `#CE9178`
4. 切换到亮色主题（如 Light+），确认 `<Unit>` 显示为深红色 `#D73A49`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat(sprocess): 添加 <Unit> 语法暗色/亮色主题默认配色"
```

---

### Task 3: 在测试文件中添加 Unit 语法示例

**Files:**
- 修改: `display_test/testbench_fps.cmd`

- [ ] **Step 1: 在离子注入章节添加带单位的参数示例**

在 `testbench_fps.cmd` 中，第六节"离子注入"（约第 179 行之后）的 `beam` 块之后（第 216 行），添加一个新的测试块。插入在第七节"扩散/退火"的分隔线之前：

```tcl
# ── Unit 语法高亮测试 ──
# SPROCESS 物理单位使用尖括号语法
line x location= 0.5<um> spacing= 50<nm>
init concentration= 1.0e15<cm-3> field= Boron
diffuse temperature= 900<C> time= 40<min> pressure= 1.0<atm>
implant energy= 30.00<keV> dose= 1.00e+14<cm-2> tilt= 7.00<degree>
gas.flow rate= 2.5<l/min> species= "N2"

# 以下不应被高亮为 Unit（Tcl 比较运算符）
if { $x < 10 } { puts "ok" }
```

- [ ] **Step 2: 在 VSCode Extension Development Host 中视觉验证**

1. 按 F5 启动 Extension Development Host
2. 打开 `display_test/testbench_fps.cmd`
3. 确认所有 `<Unit>` 模式正确高亮
4. 确认 `< 10` 不被误高亮

- [ ] **Step 3: Commit**

```bash
git add display_test/testbench_fps.cmd
git commit -m "test: 在 testbench_fps.cmd 中添加 <Unit> 语法测试示例"
```

---

## 实施总结

| Task | 文件 | 改动量 |
|------|------|--------|
| Task 1 | `syntaxes/sprocess.tmLanguage.json` | +4 行（1 条 match 规则） |
| Task 2 | `package.json` | +23 行（configurationDefaults） |
| Task 3 | `display_test/testbench_fps.cmd` | +10 行（测试示例） |
| **合计** | 3 个文件 | **~37 行** |
