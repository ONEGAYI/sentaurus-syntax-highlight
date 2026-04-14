# SDE 函数文档中文参数描述增强设计

## 背景

提交 `b4ebce2` 对 `sde_function_docs.json` 中全部 405 个函数（871 个参数）的参数描述进行了系统化增强，补充了枚举值含义、类型标注（REAL/POSITION/STRING 等）、可选性行为说明等细节。但中文版 `sde_function_docs.zh-CN.json` 未同步更新，参数描述仍为旧版简短内容。

代码层面的 i18n 加载机制（`loadDocsJson()`）已完善，无需修改。

## 目标

1. 将中文版 871 个参数描述更新为与英文增强版信息量完全一致的高质量中文翻译
2. 同步翻译英文增强版中可能变更的 `description` 字段
3. 编写通用化翻译脚本 `scripts/translate_docs.py`，可复用于未来的文档 i18n 需求

## 翻译范围

| 字段 | 是否翻译 | 说明 |
|------|---------|------|
| description | 是 | 函数总体描述，如有变更则同步翻译 |
| parameters[].desc | 是 | 871 个参数描述，全部对齐英文增强内容 |
| signature | 否 | 代码签名，保持英文 |
| example | 否 | 代码示例，保持英文 |
| name | 否 | 参数名，保持英文 |
| type | 否 | 类型标注，保持英文 |

## 通用化翻译脚本设计

### 脚本接口

```bash
python scripts/translate_docs.py \
  --source syntaxes/sde_function_docs.json \
  --target syntaxes/sde_function_docs.zh-CN.json \
  [--fields description,parameters.desc] \
  [--progress translate_progress.json] \
  [--model claude-sonnet-4-6] \
  [--batch-size 1] \
  [--prompt-file custom_prompt.txt]
```

### 核心功能

1. **增量翻译**：自动比对 source 和 target 的差异，仅翻译发生变化的字段
2. **断点续传**：`--progress` 指定进度文件，记录已翻译函数名，中断后跳过
3. **模型可选**：`--model` 指定翻译模型（默认 claude-sonnet-4-6）
4. **字段可选**：`--fields` 指定需要翻译的字段路径（默认 `description` 和 `parameters[*].desc`）
5. **自定义提示词**：`--prompt-file` 可加载自定义翻译提示词模板

### 翻译提示词策略

- **系统提示**：Sentaurus TCAD 工具函数文档翻译专家
- **术语保留**：POSITION、REAL、STRING、DATEX、BOOLEAN 等类型标注保留英文
- **枚举值保留**：如 Replace/NoReplace/LocalReplace 等枚举值保留原文
- **代码片段保留**：`(position x y z)` 等代码语法保留原样
- **翻译风格**：参考已有 `sde_function_docs.zh-CN.json` 和 `sdevice_command_docs.zh-CN.json` 的翻译风格

### 复用场景

- 未来 SDE 函数文档新增函数的翻译
- sdevice 命令文档中文版更新
- scheme 内置函数文档中文版更新
- 全新文档文件对的创建（如新增语言模块的文档）

## 实施步骤

### Phase 1：编写翻译脚本

1. 创建 `scripts/translate_docs.py`
2. 实现增量比对、API 调用、断点续传核心逻辑
3. 内置 Sentaurus TCAD 翻译提示词模板

### Phase 2：执行翻译

1. 运行脚本翻译 `sde_function_docs.json` → `sde_function_docs.zh-CN.json`
2. 监控进度和翻译质量

### Phase 3：校验与提交

1. 验证中英文版函数数量（405）和参数数量（871）完全一致
2. JSON 格式验证
3. 抽样检查翻译质量
4. 提交变更
