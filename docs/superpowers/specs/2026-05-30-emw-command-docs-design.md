# EMW 命令文档设计规范

## 概述

为 Sentaurus EMW (Electromagnetic Wave) 工具创建中英文双语命令文档 JSON，用于 VSCode Hover/Completion Provider。EMW 使用 section-based Tcl 方言，结构与 SDEVICE 相似但规模更小（~18-20 个 section 命令）。

## 文档格式

采用 SDEVICE 模板（函数文档提取与编写规范 7.2 节），每个 section 命令为一个条目。

### JSON 结构

```jsonc
{
  "<SectionCommand>": {
    "section": "<SectionCategory>",
    "signature": "<SectionCommand> { <Param>=<type> ... }",
    "description": "English description",
    "parameters": [
      { "name": "<Param>", "type": "<type>", "desc": "Param description" }
    ],
    "example": "<SectionCommand> {\n  <Param>=<value>\n}",
    "keywords": ["<SubKeyword1>", "<SubKeyword2>"]
  }
}
```

### Key 命名

PascalCase 命令名，与 tmLanguage 和 all_keywords.json 中的关键词完全一致。

### section 分类

| section 值 | 命令 |
|------------|------|
| `Simulation Setup` | Globals |
| `Material` | ComplexRefractiveIndex, DispersiveMedia, PECMedia, PMCMedia |
| `Boundary` | Boundary |
| `Excitation` | PlaneWaveExcitation, CodeVExcitation, GaussianBeamExcitation, TruncatedPlaneWaveExcitation |
| `Termination` | Detector |
| `Output` | Plot, Extractor, Sensor, RTA, DFT, Farfield, Monitor, Save |
| `Parallelization` | Acceleware |

## 命令清单（20 个）

从 tmLanguage 和手册 Appendix A 综合得出：

1. Globals — 全局仿真参数
2. ComplexRefractiveIndex — 复折射率材料参数
3. DispersiveMedia — 色散媒质模型
4. PECMedia — 完美电导体媒质
5. PMCMedia — 完美磁导体媒质
6. Boundary — 边界条件
7. PlaneWaveExcitation — 平面波激励
8. CodeVExcitation — CodeV 光源激励
9. GaussianBeamExcitation — 高斯光束激励
10. TruncatedPlaneWaveExcitation — 截断平面波激励
11. Detector — 收敛检测器
12. Plot — 可视化输出
13. Extractor — 数据提取
14. Sensor — 传感器测量
15. RTA — 反射/透射/吸收率
16. DFT — 离散傅里叶变换
17. Farfield — 远场计算
18. Monitor — 仿真监控
19. Save — 保存仿真数据
20. Acceleware — GPU 加速（tmLanguage 中有，手册附录未列出，从 Ch.9 Parallelization 获取）

## 执行流程

### Phase 1: 前置工作（本代理）

1. **更新 `函数文档提取与编写规范.md`**：
   - 文档表格新增 EMW 行（~20 条目）
   - Section 2 Key 规范新增 EMW：PascalCase 命令名
   - Section 3.5 新增 EMW section 值列表
   - Section 6 确认 EMW 使用 SDEVICE 模板

2. **创建 `docs/prompts/i18n/emw_command_docs.prompt.md`**：
   - 仿写 inspect_command_docs.prompt.md
   - 术语表映射 FDTD/EM 领域词汇
   - EMW 特有注意事项（section 名不翻译、参数枚举值保留原文等）

3. **扩展 `docs/glossary.json`**：
   - 添加 EMW 特有术语：FDTD、CPML、PEC、PMC、Drude-Lorentz、RTA 等

### Phase 2: 英文文档（1 个子代理，general-purpose）

- 读取 Markdown 手册 Appendix A + 相关章节 + 范本
- 直接产出 `syntaxes/emw_command_docs.json`
- 不提交，由本代理后续集成

### Phase 3: 国际化（1 个子代理，general-purpose）

- 使用 `emw_command_docs.prompt.md` 作为系统提示
- 读取英文 JSON，翻译为 `syntaxes/emw_command_docs.zh-CN.json`
- 不提交，由本代理后续集成

### Phase 4: 集成（本代理）

1. 质量检查：JSON 合法性、条目数、字段完整性
2. 更新 `src/register-completion-providers.js` 添加 EMW 文档加载
3. 更新 `CLAUDE.md` 文件树（emw_command_docs.{json,zh-CN.json} 描述）
4. 测试验证
5. 提交

## 信息来源优先级

1. 官方手册 Markdown（`references/emw_ug_T-2022.03.md`）Appendix A 命令参考
2. 手册正文相关章节（Ch.3-9）
3. 官方范本（`display_test/TEST_EMW/` 下 6 个示例）
4. tmLanguage 中已定义的参数名和枚举值
5. AI 推断（需在文档中标注不确定性）

## 质量标准

- 20 个条目全部覆盖
- 每个条目的 parameters 完整（对照手册 Appendix A 的语法描述）
- keywords 包含该 section 内所有合法的子参数名
- 示例优先从范本中选取真实用例
- 不包含 Tcl 共享文档已覆盖的命令
