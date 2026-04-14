# sdevice 命令文档设计

日期：2026-04-11

## 目标

为 sdevice 语言的 KEYWORD1、KEYWORD2、KEYWORD3 共 297 个关键词添加悬停提示和补全文档。先完成英文版，中文版在全部完成后统一翻译。

## 覆盖范围

| 类别 | 数量 | 说明 |
|------|------|------|
| KEYWORD1 | 25 | 顶层 section 命令（File/Math/Physics/Solve/Electrode/Device/System/Plot 等） |
| KEYWORD2 | 31 | Solve 子命令/控制结构（QuasiStationary/Transient/Coupled/HarmonicBalance 等） |
| KEYWORD3 | 241 | Physics 子模型/选项名称（Doping/Tunneling/Recombination/Mobility 等） |

LITERAL1(728)、LITERAL2(1)、LITERAL3(1216)、KEYWORD4(1) 不在本次覆盖范围内。

## 数据格式

文件：`syntaxes/sdevice_command_docs.json`

JSON 条目格式（增强版，基于 SDE 的 formatDoc 格式扩展）：

```json
{
  "Electrode": {
    "section": "global",
    "signature": "Electrode { { Name=\"<name>\" Voltage=<float> } ... }",
    "description": "Defines electrical contacts on the device structure boundary.",
    "parameters": [
      {"name": "Name", "type": "string", "desc": "Electrode identifier name"},
      {"name": "Voltage", "type": "float", "desc": "Applied bias voltage [V]"}
    ],
    "example": "Electrode {\n  { Name=\"source\" Voltage=0.0 }\n  { Name=\"gate\" Voltage=0.0 }\n}",
    "keywords": ["Name", "Voltage", "Current", "Material", "Resistance"]
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| section | string | 是 | 所属顶层 section：global / Physics / Solve / Math / File / Electrode / Device / System / Plot / CurrentPlot |
| signature | string | 是 | 命令语法模板 |
| description | string | 是 | 功能描述 |
| parameters | array | 否 | 主要参数列表，每项含 name/type/desc |
| example | string | 否 | 使用示例代码 |
| keywords | array | 否 | 该 section 下可用的子关键词列表 |

## 代码改动

### src/extension.js

1. **加载 sdevice 文档**：在 `activate()` 中，加载 `sdevice_command_docs.json` 并 merge 到 `funcDocs`：
   ```js
   const sdeviceDocs = loadDocsJson('sdevice_command_docs.json', useZh);
   if (sdeviceDocs) Object.assign(funcDocs, sdeviceDocs);
   ```

2. **增强 `formatDoc()`**：在签名后可选显示 section 标签：
   ```js
   if (doc.section) {
       lines.push(`*Section: ${doc.section}*`);
   }
   ```

### 不需要改动的部分

- `buildItems()`：已从 `funcDocs` 查找文档，自动受益
- `HoverProvider`：已从 `funcDocs` 查找，自动受益
- `CompletionItemProvider`：已使用 `formatDoc()`，自动受益
- `loadDocsJson()`：已支持 .zh-CN 变体加载，自动受益

## 文档编写策略

### 来源

主要从 `references/sdevice_ug_T-2022.03*.md`（约 47000 行）提取，确保准确性。

### 分批计划

| 批次 | 范围 | 数量 | 来源 |
|------|------|------|------|
| 1 | KEYWORD1 顶层命令 | 25 | 附录 G + 各章节开头 |
| 2 | KEYWORD2 Solve 子命令 | 31 | Chapter 4 + 附录 G |
| 3a | KEYWORD3 基础物理模型 | ~80 | Chapter 7-18（迁移率/复合/能带/隧穿等） |
| 3b | KEYWORD3 高级物理模型 | ~80 | Chapter 19-37（退化/光学/热/噪声/铁电等） |
| 3c | KEYWORD3 数值/杂项 | ~81 | Chapter 38 + 附录（网格/求解器/PMI 等） |

### 编写流程

每个批次的流程：
1. 从手册中搜索关键词
2. 提取语法、参数、描述
3. 编写 JSON 条目
4. 验证 JSON 格式正确性

### 优先级

批次 1 + 2（共 56 个核心命令）最影响用户体验，优先完成。

## 后续工作（不在本次范围内）

- 中文翻译版 `sdevice_command_docs.zh-CN.json`
- KEYWORD4、LITERAL 类别的文档（如需要）
