# SDEVICE e/h 前缀变体文档风格统一

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 SDEVICE 文档 JSON 中所有 X/eX/hX 三件套关键词的文档风格（parameters、keywords、contexts、description 关联说明），消除空壳条目和格式不一致。

**Architecture:** 两个批次——Batch 1 机械修复（空壳 keywords、contexts 缺失、参数名风格、关联说明），Batch 2 数据修复（Factor/Tensor/Subband/Thermionic/Diffusivity 的 parameters 基于官方手册 Table 328 等补全）。所有修改通过 Node.js 脚本批量执行，不涉及运行时代码。

**Tech Stack:** Node.js 脚本直接操作 JSON 文件

**涉及文件：**
- `syntaxes/sdevice_command_docs.json` — 英文文档（~2100 条）
- `syntaxes/sdevice_command_docs.zh-CN.json` — 中文文档（~2100 条）

---

## 参考数据

### 官方手册 Table 328（Tensor/eTensor/hTensor + Factor/eFactor/hFactor 共享参数表）

共 11 个参数（常用在前）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `FirstOrder` | flag | 一阶压阻模型（默认） |
| `SecondOrder` | flag | 二阶压阻模型 |
| `Kanda` | flag | 包含温度和掺杂依赖 |
| `ParameterSetName` | string | 参数集名称 |
| `AutoOrientation` | flag | 根据最近界面方向自动选择参数集 |
| `<ident>` | ident | PMI 模型名称（计算压阻系数或应力因子） |
| `SFactor` | string/ident | 迁移率增强因子的空间分布数据集或 PMI 模型名 |
| `EffectiveStressModel` | flag | 有效应力因子模型 |
| `ApplyToMobilityComponents` | flag | 将 Factor 增强应用到单独的迁移率分量 |
| `ChannelDirection` | =<1..3> | 通道方向（仅 Factor 模型） |
| `Enormal` | flag | 使用依赖于电场和摩尔分数的压阻系数（仅 Tensor 模型） |

### Thermionic/eThermionic/hThermionic 参数

共享同一子选项表：

| 参数 | 类型 | 说明 |
|------|------|------|
| `HCI` | flag | 热载流子局部注入 |
| `Organic_Gaussian` | flag | 有机异质界面高斯传输模型 |

### h-variant 空壳 keywords 组（11 组）

Band2BandGeneration, BreakdownProbability, DeformationPotential, DensityCorrection, Diffusivity, Enormal, Eparallel, QuasiFermiPotential, RecGenHeat, SRHRecombination, SaturationFactor

### contexts 缺失的 e 变体（6 组）

AugerRecombination, HeatFlux, IonIntegral, JouleHeat, MLDA, Mobility

---

## Batch 1: 机械修复

### Task 1: h-variant 空壳 keywords 补全（11 组）

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

11 组 h 变体的 `keywords` 为空数组 `[]`。修复策略：以对应 e 变体的 keywords 为模板，将 `e` 前缀替换为 `h`，确保包含自身引用和关联词。

- [ ] **Step 1: 编写修复脚本**

创建临时脚本 `_fix_h_keywords.js`：

```javascript
const fs = require('fs');
for (const suffix of ['json', 'zh-CN.json']) {
  const path = './syntaxes/sdevice_command_docs.' + suffix;
  const docs = JSON.parse(fs.readFileSync(path, 'utf8'));
  const groups = [
    'Band2BandGeneration','BreakdownProbability','DeformationPotential',
    'DensityCorrection','Diffusivity','Enormal','Eparallel',
    'QuasiFermiPotential','RecGenHeat','SRHRecombination','SaturationFactor'
  ];
  for (const base of groups) {
    const eKey = 'e' + base;
    const hKey = 'h' + base;
    if (docs[hKey] && docs[hKey].keywords && docs[hKey].keywords.length === 0 && docs[eKey]) {
      // 以 e 变体的 keywords 为模板，生成 h 版本
      const hKeywords = docs[eKey].keywords.map(k => {
        if (k === eKey) return hKey;
        if (k.startsWith('e')) {
          const hVersion = 'h' + k.slice(1);
          if (docs[hVersion]) return hVersion;
        }
        return k;
      });
      // 确保包含自身引用和 base
      if (!hKeywords.includes(hKey)) hKeywords.unshift(hKey);
      if (!hKeywords.includes(base)) hKeywords.push(base);
      docs[hKey].keywords = hKeywords;
    }
  }
  fs.writeFileSync(path, JSON.stringify(docs, null, 2) + '\n', 'utf8');
}
console.log('Done: h-variant keywords fixed for 11 groups x 2 languages');
```

- [ ] **Step 2: 执行脚本**

```bash
node _fix_h_keywords.js
```

- [ ] **Step 3: 验证**

```bash
node -e "
const docs = require('./syntaxes/sdevice_command_docs.json');
const groups = ['Band2BandGeneration','BreakdownProbability','DeformationPotential','DensityCorrection','Diffusivity','Enormal','Eparallel','QuasiFermiPotential','RecGenHeat','SRHRecombination','SaturationFactor'];
let ok = true;
for (const base of groups) {
  const h = docs['h'+base];
  if (!h.keywords || h.keywords.length === 0) { console.log('FAIL: h'+base+' still empty'); ok = false; }
  if (!h.keywords.includes('h'+base)) { console.log('FAIL: h'+base+' missing self-ref'); ok = false; }
}
if (ok) console.log('ALL PASS');
"
```

- [ ] **Step 4: 清理临时脚本并提交**

```bash
rm _fix_h_keywords.js
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "fix: 补全 11 组 h 变体关键词的空壳 keywords 数组

- 以对应 e 变体 keywords 为模板生成 h 版本
- 确保 h 变体包含自身引用和基础词关联
- 中英文文档同步修复"
```

---

### Task 2: contexts 字段补全（6 组 e 变体）

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`（仅英文文件 affected）

AugerRecombination、HeatFlux、IonIntegral、JouleHeat、MLDA、Mobility 这 6 组中，base 和 h 都有 `contexts`，但 e 变体缺失。

- [ ] **Step 1: 编写修复脚本**

创建 `_fix_contexts.js`：

```javascript
const fs = require('fs');
const path = './syntaxes/sdevice_command_docs.json';
const docs = JSON.parse(fs.readFileSync(path, 'utf8'));
const groups = ['AugerRecombination','HeatFlux','IonIntegral','JouleHeat','MLDA','Mobility'];
let fixed = 0;
for (const base of groups) {
  const eKey = 'e' + base;
  if (docs[eKey] && !('contexts' in docs[eKey])) {
    docs[eKey].contexts = {};
    fixed++;
  }
}
fs.writeFileSync(path, JSON.stringify(docs, null, 2) + '\n', 'utf8');
console.log('Done: added contexts to ' + fixed + ' e-variants');
```

- [ ] **Step 2: 执行脚本**

```bash
node _fix_contexts.js
```

- [ ] **Step 3: 验证**

```bash
node -e "
const docs = require('./syntaxes/sdevice_command_docs.json');
const groups = ['AugerRecombination','HeatFlux','IonIntegral','JouleHeat','MLDA','Mobility'];
let ok = true;
for (const base of groups) {
  const e = docs['e'+base];
  if (!e || !('contexts' in e)) { console.log('FAIL: e'+base); ok = false; }
}
if (ok) console.log('ALL PASS');
"
```

- [ ] **Step 4: 清理并提交**

```bash
rm _fix_contexts.js
git add syntaxes/sdevice_command_docs.json
git commit -m "fix: 补全 6 组 e 变体缺失的 contexts 字段

AugerRecombination, HeatFlux, IonIntegral, JouleHeat, MLDA, Mobility"
```

---

### Task 3: SaturationFactor 参数名风格统一

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

当前三者的参数名各不相同：base=`"value"`、e=`"float"`、h=`"(value)"`。应统一为描述性名称。

- [ ] **Step 1: 编写修复脚本**

创建 `_fix_saturation.js`：

```javascript
const fs = require('fs');
for (const suffix of ['json', 'zh-CN.json']) {
  const path = './syntaxes/sdevice_command_docs.' + suffix;
  const docs = JSON.parse(fs.readFileSync(path, 'utf8'));

  if (suffix === 'json') {
    docs.SaturationFactor.parameters = [{ name: "value", type: "float", desc: "Scaling factor for stress-dependent saturation velocity. Default is 1.0 (no stress effect)." }];
    docs.eSaturationFactor.parameters = [{ name: "value", type: "float", desc: "Scaling factor for electron saturation velocity stress dependence. Default is 1.0." }];
    docs.hSaturationFactor.parameters = [{ name: "value", type: "float", desc: "Scaling factor for hole saturation velocity stress dependence. Default is 1.0." }];
  } else {
    docs.SaturationFactor.parameters = [{ name: "value", type: "float", desc: "应力依赖饱和速度的缩放因子。默认 1.0（无应力效应）。" }];
    docs.eSaturationFactor.parameters = [{ name: "value", type: "float", desc: "电子饱和速度应力依赖的缩放因子。默认 1.0。" }];
    docs.hSaturationFactor.parameters = [{ name: "value", type: "float", desc: "空穴饱和速度应力依赖的缩放因子。默认 1.0。" }];
  }

  fs.writeFileSync(path, JSON.stringify(docs, null, 2) + '\n', 'utf8');
}
console.log('Done: SaturationFactor param names unified');
```

- [ ] **Step 2: 执行脚本**

```bash
node _fix_saturation.js
```

- [ ] **Step 3: 验证**

```bash
node -e "
const docs = require('./syntaxes/sdevice_command_docs.json');
['SaturationFactor','eSaturationFactor','hSaturationFactor'].forEach(k => {
  const p = docs[k].parameters[0];
  console.log(k + ': name=' + p.name + ' type=' + p.type);
  if (p.name !== 'value') console.log('  FAIL: expected name=value');
});
"
```

- [ ] **Step 4: 清理并提交**

```bash
rm _fix_saturation.js
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "fix: 统一 SaturationFactor 系列参数名风格

- 三者的参数名统一为 value，消除 value/float/(value) 的不一致"
```

---

### Task 4: 为所有 e/h 变体组添加关联说明

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

检查所有 30 组三件套的 description，为缺少关联说明的条目添加跨引用文字。

- [ ] **Step 1: 编写检测脚本找出缺少关联说明的条目**

创建 `_check_refs.js`：

```javascript
const docs = require('./syntaxes/sdevice_command_docs.json');
// 获取所有 e/h 组
const keys = Object.keys(docs);
const groups = [];
for (const k of keys) {
  if (k.startsWith('e') && docs['h' + k.slice(1)] && docs[k.slice(1)]) {
    groups.push(k.slice(1));
  }
}
let missing = 0;
for (const base of groups) {
  const eKey = 'e' + base, hKey = 'h' + base;
  for (const [name, expected] of [[base, eKey], [eKey, base], [hKey, base]]) {
    const desc = docs[name].description || '';
    const refsOthers = (name === base)
      ? desc.includes(eKey) && desc.includes(hKey)
      : desc.includes(base) || desc.includes(eKey) || desc.includes(hKey);
    if (!refsOthers) {
      console.log(name + ': missing cross-ref (has: ' + desc.slice(0, 60) + '...)');
      missing++;
    }
  }
}
console.log('Total missing cross-refs: ' + missing + ' (out of ' + groups.length*3 + ')');
```

- [ ] **Step 2: 运行检测脚本**

```bash
node _check_refs.js
```

- [ ] **Step 3: 根据检测结果编写修复脚本**

此步骤内容取决于 Step 2 的输出。修复策略：
- base 条目：description 末尾追加 `For carrier-specific configurations, see eX (electrons) and hX (holes).`
- e 变体：description 末尾追加 `See also X for the unified model and hX for the hole variant.`
- h 变体：description 末尾追加 `See also X for the unified model and eX for the electron variant.`
- 中文对应版本同理
- 跳过已有关联说明的条目（如 HighFieldSaturation 系列已修复）
- 注意 Plot 变量类（Avalanche/eAvalanche/hAvalanche 等）的 base 是 Physics 命令、e/h 是输出变量，关联说明措辞需区分

- [ ] **Step 4: 执行修复脚本并验证**

- [ ] **Step 5: 清理并提交**

```bash
rm _check_refs.js _fix_refs.js
git add syntaxes/sdevice_command_docs.json syntaxes/sdevice_command_docs.zh-CN.json
git commit -m "docs: 为所有 e/h 变体组添加跨引用关联说明

- base 条目引用两个载流子变体
- e/h 变体引用 base 和另一个变体
- 中英文文档同步"
```

---

## Batch 2: 数据修复（基于官方手册）

### Task 5: Tensor/Factor 组参数统一（Table 328）

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

Tensor/eTensor/hTensor 和 Factor/eFactor/hFactor 共享 Table 328（11 个参数）。当前：
- Tensor: 1 param（极不完整）
- eTensor: 8 params（部分完整）
- hTensor: 0 params（完全缺失）
- Factor: 1 param（极不完整）
- eFactor: 1 param（undefined type/desc，数据损坏）
- hFactor: 10 params（接近完整）

- [ ] **Step 1: 基于 Table 328 编写完整参数数据并统一 6 个条目**

创建 `_fix_table328.js`，为 6 个关键词统一设置 11 个参数（常用在前）。注意 `ChannelDirection` 仅适用于 Factor 系列，`Enormal` 仅适用于 Tensor 系列——脚本中需按关键词过滤适用参数。

- [ ] **Step 2: 执行并验证**

- [ ] **Step 3: 清理并提交**

---

### Task 6: Subband 组参数统一

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

当前 eSubband 有 12 params，base 和 hSubband 都是 0。e 和 h 的 Subband 共享同一参数集（手册确认）。

- [ ] **Step 1: 以 eSubband 的 12 个参数为基准，补全 hSubband 和 base**

注意：base（Subband）可能是总开关关键字，需检查其语义角色再决定是否添加参数。

- [ ] **Step 2: 执行并验证**

- [ ] **Step 3: 清理并提交**

---

### Task 7: Thermionic 组参数统一

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

Thermionic/eThermionic/hThermionic 共享 HCI 和 Organic_Gaussian 两个子选项。当前参数名格式混乱（`(HCI)`、`(Organic_Gaussian)` 带括号）。

- [ ] **Step 1: 统一三者的 parameters，去掉参数名中的括号**

- [ ] **Step 2: 执行并验证**

- [ ] **Step 3: 清理并提交**

---

### Task 8: Diffusivity 组参数修复

**Files:**
- Modify: `syntaxes/sdevice_command_docs.json`
- Modify: `syntaxes/sdevice_command_docs.zh-CN.json`

eDiffusivity 的唯一参数有 undefined type/desc（数据损坏），hDiffusivity 无参数。

- [ ] **Step 1: 检查 eDiffusivity 的 ParameterSetName 参数是否正确（对比 HighFieldSaturation 的同名参数），修复 hDiffusivity**

- [ ] **Step 2: 执行并验证**

- [ ] **Step 3: 清理并提交**

---

### Task 9: 最终验证与一致性检查

- [ ] **Step 1: 运行全局一致性检查脚本**

检查所有 X/eX/hX 三件套：
1. 三者都有 keywords 且非空
2. 三者的 contexts 存在性一致（要么都有，要么都没有）
3. 三者的 parameters 格式一致（name 字段风格统一）
4. 三者的 description 都包含关联说明

- [ ] **Step 2: 修复检查脚本发现的任何残余问题**

- [ ] **Step 3: 最终提交**
