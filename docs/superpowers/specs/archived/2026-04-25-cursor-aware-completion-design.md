# 表达式转换器光标位置感知补全

## 背景

表达式转换器（Scheme 前缀 ↔ 中缀）使用 QuickPick 提供变量补全。当前 `getLastWordPrefix` 通过 `TRAILING_IDENT_RE` 只匹配输入文本**末尾**的标识符前缀。

**问题**：用户在中间位置编辑时（如先输入 `B`，再将光标移到前面输入 `A+`），补全列表只匹配末尾的 `B`，`A` 不会触发补全。

**根因**：VSCode QuickPick 的 `onDidChangeValue` API 只提供变化后的完整字符串，不提供光标位置。

## 方案

通过缓存相邻两次 `onDidChangeValue` 的值，用 diff 推断光标位置，再从光标位置双向扫描提取标识符进行补全匹配和替换。

## 架构

### CursorTracker

轻量级工具类，负责缓存前值并推断光标位置。

```
update(newValue) → inferred cursor position
sync(value)      → 更新 _prevValue 但不推断光标（程序化设值时使用）
reset()          → 清空缓存（QuickPick 关闭时调用）
```

**Diff 算法**：

1. 计算新旧字符串的最长公共前缀 `prefixLen`
2. 对**剩余部分**计算最长公共后缀 `suffixLen`（避免前后缀重叠）
3. 光标位置 = `newVal.length - suffixLen`（变化区间的右边界）

**边界情况处理**：

| 场景 | prefixLen | suffixLen | 推断光标 | 正确性 |
|------|-----------|-----------|----------|--------|
| 正常输入 | 精确 | 精确 | 插入点右边界 | ✅ |
| 删除字符 | 精确 | 精确 | 删除点 | ✅ |
| 中间粘贴 | 精确 | 精确 | 粘贴内容末尾 | ✅ |
| 全选粘贴 | ≈0 | ≈0 | 字符串末尾 | ✅（粘贴后光标在末尾） |
| 撤销 | 可能重叠 | 受 oldRem/newRem 约束 | 保守定位 | ✅ |

公共后缀的计算受 `oldRem`/`newRem` 约束，确保前后缀不会重叠。

### getWordAtPosition

替代 `getLastWordPrefix`，从推断的光标位置双向扫描标识符：

- 向前扫描：跳过 `[a-zA-Z0-9_@]` 字符，找到词的起始位置
- 向后扫描：跳过 `[a-zA-Z0-9_@]` 字符，找到词的结束位置
- 返回 `{ prefix, start, end }` 或 `null`（光标不在标识符上）

`prefix`（词起始到光标位置的子串）用于过滤补全候选。`start/end` 记录替换边界。

### replaceWordAtPosition

替代 `replaceLastWord`，按 `start/end` 精确替换目标词，保留前后内容不变：

```javascript
value.slice(0, wordInfo.start) + replacement + value.slice(wordInfo.end)
```

当前 `replaceLastWord` 会截断末尾标识符之后的内容（`value.slice(0, match.index) + replacement`），新方案避免了这个问题。

## 集成

### expression-converter.js

- 新增 `CursorTracker` 类
- `getLastWordPrefix` → `getWordAtPosition(value, cursorPos)`
- `replaceLastWord` → `replaceWordAtPosition(value, wordInfo, replacement)`
- `parseHistoryInput` 不变
- 导出更新：移除 `getLastWordPrefix`/`replaceLastWord`，新增三个新 API

### extension.js

QuickPick 生命周期管理：

```
创建 QuickPick
├── const tracker = new CursorTracker()
├── let _lastWordInfo = null
├── function updateItems(value) {
│       if (_updatingValue) { tracker.sync(value); return; }
│       const cursor = tracker.update(value);
│       _lastWordInfo = getWordAtPosition(value, cursor);
│       // 用 _lastWordInfo?.prefix 过滤补全项
│   }
├── onDidAccept → 选中变量时:
│       replaceWordAtPosition(qp.value, _lastWordInfo, selected._varName)
├── onDidHide → tracker.reset()
```

`_lastWordInfo` 通过闭包在 `updateItems` 和 `onDidAccept` 之间传递，与现有 `_updatingValue` 模式一致。

## 不变的部分

- 历史模式（`!` 前缀）不受影响，其逻辑在 `histParsed` 分支中独立处理
- 补全项的数据来源（`userVars`）不变
- 补全项的展示格式不变
- 确认输入项（`_confirmInput`）不变
