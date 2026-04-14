# sdevice 命令文档中文本地化设计

## 背景

sdevice_command_docs.json 当前仅有英文版本（341 条），覆盖 KEYWORD1+KEYWORD2+KEYWORD3 全部关键词。extension.js 的 `loadDocsJson()` 已支持 `.zh-CN.json` 后缀自动切换，只需创建翻译文件即可启用。

## 目标

1. 创建 `syntaxes/sdevice_command_docs.zh-CN.json`，覆盖全部 341 条关键词的中文文档
2. 建立 `docs/sdevice-glossary.json` 术语映射表，统一翻译风格
3. 补齐 `extension.js` 中 `formatDoc()` 的 i18n 标签

## 翻译范围

| 字段 | 是否翻译 | 说明 |
|------|---------|------|
| description | 是 | 341 条，总计 ~81,477 字符 |
| parameters[].desc | 是 | 209 条，总计 ~10,478 字符 |
| signature | 否 | 代码签名，保持英文 |
| example | 否 | 代码示例，保持英文 |
| keywords | 否 | **关键词标识符列表，值也不翻译**（如 "Name", "Voltage", "SRH" 等保持原样） |
| section | 否 | 值不翻译（如 Physics、Solve），但标签本身需要 i18n |

## 术语翻译规则

1. 通用半导体物理术语直接使用中文标准译名（复合、掺杂、带隙、迁移率等）
2. 有歧义或人名来源的术语附英文原文：俄歇(Auger)、薛定谔(Schrödinger)
3. 参考已有 sde_function_docs.zh-CN.json 的翻译风格保持项目一致性
4. 数值、单位、变量名等不翻译
5. **keywords 字段的值（如 "Name"、"Voltage"、"SRH"）是代码标识符，绝对不翻译**

## 实施步骤

### Phase 1：术语映射

1. 扫描全部 341 条 description，提取半导体物理术语
2. 参考 sde_function_docs.zh-CN.json 和教科书/论文确定标准译名
3. 输出 `docs/sdevice-glossary.json`（预计 150~200 条映射）

### Phase 2：风格确认

1. 选取 10~15 条代表性条目（覆盖各 section，含长/短 description，含 parameter desc）
2. 使用术语映射进行翻译
3. 用户审校确认风格

### Phase 3：批量翻译

1. 将剩余条目分成 3~4 批（每批 ~80~100 条）
2. 每批子代理加载术语映射 + 风格样本，独立翻译
3. 各批次输出部分 JSON 文件

### Phase 4：合并与校验

1. 合并所有批次 + 风格确认批次为 `sdevice_command_docs.zh-CN.json`
2. 校验：条目数 = 341、key 与英文版完全一致、无遗漏字段
3. JSON 格式验证

### Phase 5：extension.js 修改

在 `DOC_LABELS` 中新增 i18n 字段：

```javascript
const DOC_LABELS = {
    parameters: '**Parameters:**',
    example: '**Example:**',
    section: 'Section:',      // 新增
    keywords: 'Keywords:',     // 新增
};
// 中文环境：
// section: '节：',
// keywords: '关键词：',
```

在 `formatDoc()` 中将硬编码替换为 `DOC_LABELS.section` 和 `DOC_LABELS.keywords`。

### Phase 6：测试与提交

1. Extension Development Host 中测试悬停提示和补全文档显示
2. 切换 VSCode 语言为中文验证自动切换
3. 提交并发布
