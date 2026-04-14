# SDE 函数文档重翻译设计

## 背景

当前 `sde_function_docs.zh-CN.json` 的翻译由 `translate_docs.py` 脚本批量生成，存在以下问题：

1. **术语表未被使用**：`docs/sdevice-glossary.json` 有 504 条术语，但翻译脚本没有加载它
2. **system prompt 粗糙**：只硬编码了 4 个示例术语，缺乏结构化输出指导
3. **翻译风格机械**：语法混合文本中语序倒置（`用于...的 [代码]`），可读性差
4. **example 字段不一致**：部分中文文件的 example 与英文原文不同

## 范围

- **翻译文件**：`syntaxes/sde_function_docs.zh-CN.json`（约 400 个函数）
- **翻译字段**：`description`、`parameters.desc`
- **修复字段**：`example`（从英文原文覆盖不一致的条目）

## 设计

### 一、术语表扩展

1. 重命名 `docs/sdevice-glossary.json` → `docs/glossary.json`
2. 补充 SDE 特有术语（约 30-50 条）：
   - 几何操作：position → 位置、gvector → 向量、region → 区域、body → 体、face → 面、edge → 边、point → 点
   - 网格细化：refinement → 细化、MaxLenInt → 最大界面长度、MaxInterval → 最大间距、MaxGradient → 最大梯度
   - 布尔操作：union → 并集、intersection → 交集、subtraction → 差集
   - Scheme 相关：define → 定义、lambda → 匿名函数、quasiquote → 准引用
3. 更新 `_comment` 字段，说明适用范围扩展到全工具链

### 二、翻译脚本改进

**改动文件**：`scripts/translate_docs.py`

#### 2.1 新增 `--glossary` 参数 + 智能术语注入

按 batch 动态筛选术语，不全量注入：

```
对每个 batch：
  1. 提取该 batch 所有函数的英文 description + parameters.desc 文本
  2. 用 glossary 的 key 在文本中做子串匹配（大小写不敏感）
  3. 只将匹配到的术语条目注入该 batch 的 system prompt
```

好处：
- system prompt 保持轻量，无需增大 batch
- 术语约束更有针对性
- 默认 batch_size=10 不变

#### 2.2 优化 System Prompt

改进方向：
- **结构化输出指导**：description（简短概括）与 parameters.desc（可能含语法格式）的差异化翻译指导
- **语法混合文本规则**：保持 `[语法] — [中文解释]` 结构，不倒置语序
- **术语一致性**：严格遵循术语映射表

#### 2.3 batch_size 保持不变

由于智能术语注入保持 system prompt 轻量，batch_size 维持默认 10。

### 三、Example 修复

单独编写临时脚本，从 `sde_function_docs.json`（英文）提取所有 example 字段，覆盖到 `sde_function_docs.zh-CN.json` 中不一致的条目。

### 四、子代理 Review 闭环流程

```
1. 改进脚本 + 扩展术语表
2. 脚本批量翻译 → 输出 sde_function_docs.zh-CN.json
3. 按 30-50 个函数为一组，启动子代理 review
   ├── 对照英文原文 + 术语表检查
   ├── 输出问题列表（术语不一致、语序倒置、信息缺失等）
   └── 标记需要重翻的函数
4. 主代理汇总反馈，调整 prompt
5. 仅对有问题的函数重翻（脚本支持 --progress 断点续传）
6. 重复 3-5 直到质量达标
```

#### Review 检查维度

1. **术语一致性**：是否使用术语表中的标准译名
2. **信息完整性**：有无遗漏或增添
3. **语序自然性**：语法混合文本是否保持 `[语法] — [解释]`
4. **格式正确性**：JSON 结构完整，字段无缺失

#### 分组策略

按函数名前缀分组（如 `sdedr:`、`sdegeo:` 系列），每组 30-50 个，预计 8-12 组。同系列函数术语上下文相近，review 更高效。

## 不做的事

- 不改动 sdevice 或 scheme 的中文文档
- 不改 example 字段的翻译（直接从英文覆盖）
- 不引入新的依赖或构建步骤
