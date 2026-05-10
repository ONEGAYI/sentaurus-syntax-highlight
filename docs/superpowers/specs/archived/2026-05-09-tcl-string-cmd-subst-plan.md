# 实现计划：Tcl 字符串内 [] 命令替换语法高亮

**Spec**: `docs/superpowers/specs/2026-05-09-tcl-string-command-substitution-design.md`
**分支**: `worktree-feat-tcl-string-cmd-subst`

## 步骤

### 1. 修改 svisual.tmLanguage.json
- 在双引号字符串模式的 patterns 数组中，在转义模式之后添加 `[]` 命令替换模式
- 位置：顶层 patterns 中 string.quoted.double 的 patterns 数组

### 2. 修改 sdevice.tmLanguage.json
- 在 repository `#strings` 的 patterns 数组中添加 `[]` 命令替换模式
- 位置：repository.strings.patterns

### 3. 修改 sprocess.tmLanguage.json
- 在双引号字符串模式的 patterns 数组中添加 `[]` 命令替换模式
- 位置：顶层 patterns 中 string.quoted.double 的 patterns 数组

### 4. 修改 emw.tmLanguage.json
- 同上结构

### 5. 修改 inspect.tmLanguage.json
- 同上结构

### 6. 创建测试文件
- 在 display_test/ 中创建 Tcl 测试文件，覆盖基本替换、嵌套、转义、多替换场景

### 7. 提交并创建 PR
- 提交所有修改
- 推送并创建 PR

## 新增模式（统一）

```json
{
  "name": "meta.interpolation.tcl",
  "begin": "\\[",
  "end": "\\]",
  "captures": {
    "0": { "name": "punctuation.section.interpolation.tcl" }
  },
  "patterns": [
    { "include": "$self" }
  ]
}
```
