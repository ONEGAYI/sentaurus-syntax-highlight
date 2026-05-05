# SDevice 函数文档全量审计与补全 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SDevice 函数文档从 341 条补全至 ~1100 条，支持多 section 语义的 `contexts` 字段，并更新 hover 查找逻辑。

**Architecture:** 三阶段流水线——Node.js 脚本扫描手册定位关键词 → 并行 AI 子代理分批生成文档片段 → Node.js 脚本合并为最终 JSON。消费侧（`extension.js` hover）新增 `contexts` 查找路径，向后兼容。

**Tech Stack:** Node.js (CommonJS, 零外部依赖)、Claude AI 子代理（sonnet）、VSCode Extension API

**设计文档:** `docs/superpowers/specs/2026-05-05-sdevice-docs-audit-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `scripts/audit-sdevice-keywords.js` | 新增 | 阶段 1：扫描官方手册，产出关键词定位 JSON |
| `scripts/merge-sdevice-docs.js` | 新增 | 阶段 3：合并 AI 产出的文档片段到最终 JSON |
| `build/sdevice-keyword-audit.json` | 生成 | 阶段 1 产出：每个词的手册出现位置 |
| `build/doc-fragments/batch-NNN.json` | 生成 | 阶段 2 产出：AI 生成的文档片段 |
| `syntaxes/sdevice_command_docs.json` | 更新 | 最终产物：补全后的函数文档 |
| `src/extension.js` | 修改 | hover 查找支持 `contexts` 字段（~L612） |

---

## Task 1: 审计扫描脚本

**Files:**
- Create: `scripts/audit-sdevice-keywords.js`
- Read: `syntaxes/sdevice_command_docs.json`
- Read: `syntaxes/all_keywords.json`
- Read: 主仓库 `references/sdevice_ug_T-2022.03*.md`（路径通过参数配置）
- Generate: `build/sdevice-keyword-audit.json`

- [ ] **Step 1: 编写审计扫描脚本**

```javascript
// scripts/audit-sdevice-keywords.js
'use strict';

/**
 * 阶段 1：从 sdevice_command_docs.json + all_keywords.json 提取目标词，
 * 在官方手册 markdown 中定位每个词的出现位置。
 * 产出 build/sdevice-keyword-audit.json
 *
 * 用法: node scripts/audit-sdevice-keywords.js [refs-dir]
 *   refs-dir: 官方手册 md 所在目录（默认向上查找 references/）
 */
const fs = require('fs');
const path = require('path');

// ── 配置 ──
const REFS_DIR = process.argv[2] || path.resolve(__dirname, '..', '..', 'references');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const DOCS_PATH = path.join(__dirname, '..', 'syntaxes', 'sdevice_command_docs.json');
const ALL_KW_PATH = path.join(__dirname, '..', 'syntaxes', 'all_keywords.json');
const OUTPUT_PATH = path.join(BUILD_DIR, 'sdevice-keyword-audit.json');

const MANUAL_FILES = [
  'sdevice_ug_T-2022.03.md',
  'sdevice_ug_T-2022.03_1.md',
  'sdevice_ug_T-2022.03_2.md',
];

const CONTEXT_RADIUS = 120; // 前后各取 120 字符上下文

// ── 1. 提取目标词 ──
function collectTargetWords() {
  const docs = JSON.parse(fs.readFileSync(DOCS_PATH, 'utf-8'));
  const allKw = JSON.parse(fs.readFileSync(ALL_KW_PATH, 'utf-8'));

  const words = new Set();

  // 从现有文档条目提取
  for (const [key, val] of Object.entries(docs)) {
    words.add(key);
    if (Array.isArray(val.keywords)) {
      val.keywords.forEach(k => words.add(k));
    }
    if (Array.isArray(val.parameters)) {
      val.parameters.forEach(p => {
        words.add(typeof p === 'object' ? p.name : p);
      });
    }
  }

  // 从 all_keywords.json sdevice 组补充
  const sdGroups = allKw.sdevice || {};
  for (const [, items] of Object.entries(sdGroups)) {
    if (Array.isArray(items)) {
      items.forEach(w => words.add(w));
    } else if (items && typeof items === 'object') {
      Object.keys(items).forEach(w => words.add(w));
    }
  }

  return [...words].sort();
}

// ── 2. 加载手册内容 ──
function loadManuals() {
  const manuals = [];
  for (const fname of MANUAL_FILES) {
    const fpath = path.join(REFS_DIR, fname);
    if (!fs.existsSync(fpath)) {
      console.warn(`  [WARN] 手册文件不存在: ${fpath}`);
      continue;
    }
    const content = fs.readFileSync(fpath, 'utf-8');
    const lines = content.split('\n');
    manuals.push({ fname, lines, fpath });
  }
  return manuals;
}

// ── 3. 在手册中搜索每个词 ──
function scanWord(word, manuals) {
  const occurrences = [];
  const regex = new RegExp('\\b' + escapeRegex(word) + '\\b', 'gi');

  for (const { fname, lines } of manuals) {
    for (let i = 0; i < lines.length; i++) {
      if (!regex.test(lines[i])) continue;
      regex.lastIndex = 0;

      const lineNum = i + 1;
      const line = lines[i];
      const matchIdx = line.toLowerCase().indexOf(word.toLowerCase());
      const ctxStart = Math.max(0, matchIdx - CONTEXT_RADIUS);
      const ctxEnd = Math.min(line.length, matchIdx + word.length + CONTEXT_RADIUS);
      const context = line.slice(ctxStart, ctxEnd).trim();

      // 向上搜索最近的标题
      let nearbyHeading = '';
      for (let j = i; j >= Math.max(0, i - 50); j--) {
        if (/^#{1,4}\s+/.test(lines[j])) {
          nearbyHeading = lines[j].replace(/^#{1,4}\s+/, '').trim();
          break;
        }
      }

      occurrences.push({ file: fname, line: lineNum, context, nearbyHeading });
    }
  }

  return occurrences;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── 4. 主流程 ──
function main() {
  console.log('=== SDevice 关键词审计扫描 ===');

  const targetWords = collectTargetWords();
  console.log(`目标词数量: ${targetWords.length}`);

  const docs = JSON.parse(fs.readFileSync(DOCS_PATH, 'utf-8'));

  const manuals = loadManuals();
  console.log(`已加载手册: ${manuals.length} 个文件`);

  const result = {};
  let wordsWithHits = 0;
  let wordsNoHits = 0;

  for (let i = 0; i < targetWords.length; i++) {
    const word = targetWords[i];
    const occurrences = scanWord(word, manuals);

    const currentDoc = docs[word]
      ? { exists: true, section: docs[word].section || null }
      : { exists: false, section: null };

    result[word] = { currentDoc, occurrences: occurrences.slice(0, 50) };

    if (occurrences.length > 0) wordsWithHits++;
    else wordsNoHits++;

    if ((i + 1) % 200 === 0) {
      console.log(`  进度: ${i + 1}/${targetWords.length}`);
    }
  }

  // 确保输出目录存在
  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`\n=== 扫描完成 ===`);
  console.log(`有手册匹配: ${wordsWithHits} 词`);
  console.log(`无手册匹配: ${wordsNoHits} 词`);
  console.log(`产出文件: ${OUTPUT_PATH}`);
  console.log(`文件大小: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(0)} KB`);
}

main();
```

- [ ] **Step 2: 运行审计扫描脚本**

```bash
node scripts/audit-sdevice-keywords.js "D:\CODE\Project\sentaurus-syntax-highlight\references"
```

预期：输出 `build/sdevice-keyword-audit.json`，包含 ~2000+ 目标词的手册匹配统计。

- [ ] **Step 3: 验证审计产出**

```bash
node -e "
const a = require('./build/sdevice-keyword-audit.json');
const words = Object.keys(a);
const withHits = words.filter(w => a[w].occurrences.length > 0);
const noHits = words.filter(w => a[w].occurrences.length === 0);
const hasDoc = words.filter(w => a[w].currentDoc.exists);
console.log('Total words:', words.length);
console.log('With manual hits:', withHits.length);
console.log('No manual hits:', noHits.length);
console.log('Has existing doc:', hasDoc.length);
// 抽样验证
console.log('Sample (Current):', JSON.stringify(a['Current']).slice(0, 300));
"
```

预期：`Current` 词应有多个手册出现位置，跨 Electrode/Plot/Solve 等章节。

- [ ] **Step 4: 提交审计脚本**

```bash
git add scripts/audit-sdevice-keywords.js build/sdevice-keyword-audit.json
git commit -m "feat(sdevice): 审计扫描脚本 — 手册关键词定位

- 从 sdevice_command_docs.json + all_keywords.json 提取目标词
- 在 sdevice_ug_T-2022.03 手册 md 中搜索定位
- 产出 build/sdevice-keyword-audit.json"
```

---

## Task 2: 审计产出分析与分批策略

**Files:**
- Read: `build/sdevice-keyword-audit.json`
- Generate: `build/batch-plan.json`（分批方案）

- [ ] **Step 1: 编写分批分析脚本**

```javascript
// scripts/prepare-doc-batches.js
'use strict';

/**
 * 分析审计产出，生成分批方案。
 * 按字母排序等分，每批 ~30 词，避免同 section 词集中在同一批。
 * 产出 build/batch-plan.json
 */
const fs = require('fs');
const path = require('path');

const AUDIT_PATH = path.join(__dirname, '..', 'build', 'sdevice-keyword-audit.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'build', 'batch-plan.json');
const BATCH_SIZE = 30;

function main() {
  const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf-8'));
  const words = Object.keys(audit).sort();

  // 过滤掉无手册匹配且无现有文档的词（纯 AI 推断风险高）
  const actionable = words.filter(w => {
    const entry = audit[w];
    return entry.occurrences.length > 0 || entry.currentDoc.exists;
  });

  console.log(`总词数: ${words.length}`);
  console.log(`可操作词数（有手册匹配或已有文档）: ${actionable.length}`);

  // 分批：按字母排序等分
  const batches = [];
  for (let i = 0; i < actionable.length; i += BATCH_SIZE) {
    const batchWords = actionable.slice(i, i + BATCH_SIZE);
    batches.push({
      batchId: String(batches.length + 1).padStart(3, '0'),
      words: batchWords,
      count: batchWords.length,
    });
  }

  const plan = {
    totalWords: words.length,
    actionableWords: actionable.length,
    batchSize: BATCH_SIZE,
    totalBatches: batches.length,
    batches,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(plan, null, 2), 'utf-8');
  console.log(`分批数: ${batches.length}`);
  console.log(`产出: ${OUTPUT_PATH}`);
}

main();
```

- [ ] **Step 2: 运行分批分析**

```bash
node scripts/prepare-doc-batches.js
```

- [ ] **Step 3: 提交分批脚本**

```bash
git add scripts/prepare-doc-batches.js build/batch-plan.json
git commit -m "feat(sdevice): 审计分批方案脚本

- 分析审计产出过滤可操作词
- 按字母排序等分每批 ~30 词
- 产出 build/batch-plan.json"
```

---

## Task 3: hover 查找支持 contexts 字段

**Files:**
- Modify: `src/extension.js:612-617`（keyword hover 查找区域）
- Modify: `src/extension.js:85-115`（formatDoc 函数）

- [ ] **Step 1: 修改 keyword hover 查找，增加 contexts 支持**

在 `src/extension.js` 约 L612-617，当查找到 `kwDoc` 时，优先使用 `contexts[secName]`:

```javascript
// 替换原 L612-616:
//   if (Array.isArray(secDoc.keywords) && secDoc.keywords.includes(word)) {
//       const kwDoc = docs[word];
//       if (kwDoc) {
//           return new vscode.Hover(formatDoc(kwDoc, langId), range);
//       }
//   }

// 替换为:
if (Array.isArray(secDoc.keywords) && secDoc.keywords.includes(word)) {
    const kwDoc = docs[word];
    if (kwDoc) {
        // 优先查 contexts[当前 section] 的上下文描述
        const ctxDesc = kwDoc.contexts && kwDoc.contexts[secName];
        if (ctxDesc) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${word}** (${secName})\n\n`);
            md.appendMarkdown(ctxDesc);
            if (kwDoc.parameters && kwDoc.parameters.length) {
                md.appendMarkdown('\n\n**Parameters:**\n');
                for (const p of kwDoc.parameters) {
                    md.appendMarkdown(`- \`${p.name}\` (\`${p.type}\`) — ${p.desc}\n`);
                }
            }
            if (kwDoc.example) {
                md.appendMarkdown('\n**Example:**\n');
                md.appendCodeblock(kwDoc.example, langId);
            }
            return new vscode.Hover(md, range);
        }
        return new vscode.Hover(formatDoc(kwDoc, langId), range);
    }
}
```

- [ ] **Step 2: 验证 hover 逻辑兼容性**

在 VSCode Extension Development Host 中打开一个 `*_des.cmd` 文件，确认：
1. 无 `contexts` 字段的旧条目 hover 仍正常（向后兼容）
2. 有 `contexts` 字段的条目在不同 section 下显示不同的上下文描述
3. `contexts` 中不存在的 section fallback 到默认 `formatDoc`

- [ ] **Step 3: 提交 hover contexts 支持**

```bash
git add src/extension.js
git commit -m "feat(sdevice): hover 查找支持 contexts 多 section 语义

- keyword hover 查找时优先使用 contexts[当前 section]
- 向后兼容：无 contexts 字段时 fallback 到 formatDoc"
```

---

## Task 4: 合并脚本

**Files:**
- Create: `scripts/merge-sdevice-docs.js`
- Read: `syntaxes/sdevice_command_docs.json`
- Read: `build/doc-fragments/batch-*.json`
- Generate: `syntaxes/sdevice_command_docs.json`（更新）

- [ ] **Step 1: 编写合并脚本**

```javascript
// scripts/merge-sdevice-docs.js
'use strict';

/**
 * 阶段 3：将 build/doc-fragments/batch-*.json 合并到
 * syntaxes/sdevice_command_docs.json。
 *
 * 合并策略：
 * - 新条目（_audit.isNew=true）：直接加入
 * - 已有条目：合并 contexts，补全缺失 keywords/parameters，不覆盖已有正确内容
 * - 合并完成后移除 _audit 字段
 */
const fs = require('fs');
const path = require('path');

const DOCS_PATH = path.join(__dirname, '..', 'syntaxes', 'sdevice_command_docs.json');
const FRAGMENTS_DIR = path.join(__dirname, '..', 'build', 'doc-fragments');
const OUTPUT_PATH = DOCS_PATH; // 原地更新

function loadFragments() {
  if (!fs.existsSync(FRAGMENTS_DIR)) {
    console.error('错误: 未找到 doc-fragments 目录');
    process.exit(1);
  }
  const files = fs.readdirSync(FRAGMENTS_DIR)
    .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
    .sort();
  console.log(`找到 ${files.length} 个批次文件`);

  const all = {};
  for (const f of files) {
    const batch = JSON.parse(
      fs.readFileSync(path.join(FRAGMENTS_DIR, f), 'utf-8')
    );
    for (const [key, val] of Object.entries(batch)) {
      if (all[key]) {
        console.warn(`  [WARN] 重复 key "${key}"，后者覆盖`);
      }
      all[key] = val;
    }
  }
  return all;
}

function mergeEntry(existing, fragment) {
  const result = { ...existing };

  // 合并 contexts
  if (fragment.contexts) {
    result.contexts = { ...(result.contexts || {}), ...fragment.contexts };
  }

  // 补全缺失的 keywords（取并集）
  if (fragment.keywords && fragment.keywords.length > 0) {
    const existingKw = new Set(result.keywords || []);
    const missing = fragment.keywords.filter(k => !existingKw.has(k));
    if (missing.length > 0) {
      result.keywords = [...(result.keywords || []), ...missing];
    }
  }

  // 补全缺失的 parameters（按 name 合并）
  if (fragment.parameters && fragment.parameters.length > 0) {
    const existingParams = new Set((result.parameters || []).map(p =>
      typeof p === 'object' ? p.name : p
    ));
    const missing = fragment.parameters.filter(p =>
      !existingParams.has(typeof p === 'object' ? p.name : p)
    );
    if (missing.length > 0) {
      result.parameters = [...(result.parameters || []), ...missing];
    }
  }

  return result;
}

function main() {
  const docs = JSON.parse(fs.readFileSync(DOCS_PATH, 'utf-8'));
  const fragments = loadFragments();

  let added = 0;
  let merged = 0;
  let contextsAdded = 0;

  for (const [key, frag] of Object.entries(fragments)) {
    const audit = frag._audit || {};

    if (audit.isNew || !docs[key]) {
      // 新条目：移除 _audit 后加入
      const entry = { ...frag };
      delete entry._audit;
      docs[key] = entry;
      added++;
    } else {
      // 已有条目：合并
      docs[key] = mergeEntry(docs[key], frag);
      merged++;
      if (frag.contexts && Object.keys(frag.contexts).length > 0) {
        contextsAdded++;
      }
    }
  }

  // 排序 key 输出
  const sorted = {};
  for (const k of Object.keys(docs).sort()) {
    sorted[k] = docs[k];
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(`\n=== 合并完成 ===`);
  console.log(`新增条目: ${added}`);
  console.log(`合并更新: ${merged}`);
  console.log(`新增 contexts: ${contextsAdded}`);
  console.log(`最终条目总数: ${Object.keys(sorted).length}`);
  console.log(`产出文件: ${OUTPUT_PATH}`);
}

main();
```

- [ ] **Step 2: 用测试数据验证合并逻辑**

创建一个最小测试批次文件验证合并行为：

```bash
mkdir -p build/doc-fragments

# 创建测试批次
node -e "
const testBatch = {
  'TestNewKeyword': {
    section: 'Math',
    signature: 'TestNewKeyword { Value=<float> }',
    description: 'Test description for new keyword.',
    parameters: [{ name: 'Value', type: 'float', desc: 'Test value.' }],
    keywords: [],
    example: 'TestNewKeyword {\n  Value=1.0\n}',
    _audit: { isNew: true }
  }
};
require('fs').writeFileSync('build/doc-fragments/batch-test.json', JSON.stringify(testBatch, null, 2));
"

# 运行合并
node scripts/merge-sdevice-docs.js

# 验证新增条目存在
node -e "
const d = require('./syntaxes/sdevice_command_docs.json');
console.log('TestNewKeyword exists:', !!d['TestNewKeyword']);
console.log('Has _audit:', !!d['TestNewKeyword']._audit);
console.log('Total entries:', Object.keys(d).length);
"

# 恢复原始文件（测试用）
git checkout -- syntaxes/sdevice_command_docs.json
rm build/doc-fragments/batch-test.json
```

预期：新增条目存在、`_audit` 字段已被移除。

- [ ] **Step 3: 提交合并脚本**

```bash
git add scripts/merge-sdevice-docs.js
git commit -m "feat(sdevice): 文档片段合并脚本

- 新条目直接加入，已有条目合并 contexts/keywords/parameters
- 合并后自动移除 _audit 追踪字段
- 输出按 key 排序"
```

---

## Task 5: AI 分批生成文档片段

这是核心任务——并行启动子代理，每批 ~30 词，参照审计 JSON 中的手册位置生成文档。

**Files:**
- Read: `build/sdevice-keyword-audit.json`
- Read: `build/batch-plan.json`
- Read: `docs/函数文档提取与编写规范.md`
- Read: `references/sdevice_ug_T-2022.03*.md`（只读，主仓库路径）
- Generate: `build/doc-fragments/batch-NNN.json`

- [ ] **Step 1: 确认审计产出和分批方案就绪**

```bash
node -e "
const a = require('./build/sdevice-keyword-audit.json');
const p = require('./build/batch-plan.json');
console.log('审计词数:', Object.keys(a).length);
console.log('分批数:', p.totalBatches);
console.log('可操作词数:', p.actionableWords);
console.log('批次 001 词数:', p.batches[0].count);
console.log('批次 001 样本:', p.batches[0].words.slice(0,5).join(', '));
"
```

- [ ] **Step 2: 创建 doc-fragments 目录**

```bash
mkdir -p build/doc-fragments
```

- [ ] **Step 3: 并行启动 AI 子代理生成文档片段**

**执行方式**：使用 `Agent` 工具，每次最多 3 个 sonnet 子代理并行。每个子代理负责一个批次。

**子代理 prompt 模板**（以 batch-001 为例）:

```
你负责为 SDevice 函数文档补全第 001 批关键词。

**工作文件**:
1. 审计数据: build/sdevice-keyword-audit.json — 包含每个词在官方手册中的出现位置
2. 官方手册（只读参考）:
   - references/sdevice_ug_T-2022.03.md
   - references/sdevice_ug_T-2022.03_1.md
   - references/sdevice_ug_T-2022.03_2.md
   注意：手册在主仓库 D:\CODE\Project\sentaurus-syntax-highlight\references\ 下
3. 编写规范: docs/函数文档提取与编写规范.md §7.3 产出模板

**本批目标词**（从 batch-plan.json 获取）: [... 30 个词 ...]

**你的工作流程**（对每个词）:
1. 从审计 JSON 查看该词在手册中的出现位置和上下文
2. 如果有手册匹配，阅读相关章节的完整内容（使用 Read 工具读取对应行范围）
3. 判断该词：
   - 实际属于哪些 section（基于手册上下文）
   - 是否在不同 section 有不同语义
   - 应有哪些 parameters 和 keywords
4. 按规范 §7.3 模板产出文档片段

**产出格式**: 单个 JSON 对象，写入 build/doc-fragments/batch-001.json

**关键约束**:
- 信息来源优先级: 官方手册正文 > 手册附录 > AI 推断（需在 _audit.notes 注明）
- contexts 仅在确认有多 section 语义差异时添加
- 已有文档的词只补全缺失字段，不覆盖已有正确内容
- 每个条目必须包含 _audit 追踪字段
- JSON 必须合法（无尾逗号、无注释）

**并发限制**: 最多同时运行 3 个子代理（sonnet）
```

按 `batch-plan.json` 的批次依次启动子代理。每完成 3 批后检查产出质量，再启动下一批。

- [ ] **Step 4: 逐批验证产出质量**

每批完成后运行快速检查：

```bash
# 对每个完成的批次文件检查
node -e "
const batch = require('./build/doc-fragments/batch-001.json');
const words = Object.keys(batch);
console.log('批次词数:', words.length);
const issues = [];
for (const [k, v] of words.map(w => [w, batch[w]])) {
  if (!v.signature) issues.push(k + ': missing signature');
  if (!v.description) issues.push(k + ': missing description');
  if (!v.parameters) issues.push(k + ': missing parameters');
  if (!v.example) issues.push(k + ': missing example');
  if (!v._audit) issues.push(k + ': missing _audit');
}
if (issues.length === 0) console.log('质量检查通过');
else { console.log('问题:'); issues.forEach(i => console.log('  ' + i)); }
"
```

- [ ] **Step 5: 提交所有文档片段**

```bash
git add build/doc-fragments/
git commit -m "feat(sdevice): AI 生成文档片段（全部批次）

- 基于 build/sdevice-keyword-audit.json 的手册定位
- 参照 docs/函数文档提取与编写规范.md §7.3 产出模板
- 包含 contexts 多 section 语义和 _audit 追踪字段"
```

---

## Task 6: 合并与最终验证

**Files:**
- Read: `build/doc-fragments/batch-*.json`
- Read: `syntaxes/sdevice_command_docs.json`
- Run: `scripts/merge-sdevice-docs.js`
- Generate: `syntaxes/sdevice_command_docs.json`（更新后）

- [ ] **Step 1: 运行合并脚本**

```bash
node scripts/merge-sdevice-docs.js
```

预期输出：
- 新增条目数
- 合并更新数
- 最终条目总数（~1100+）

- [ ] **Step 2: 验证最终产物**

```bash
node -e "
const d = require('./syntaxes/sdevice_command_docs.json');
const keys = Object.keys(d);
console.log('最终条目总数:', keys.length);

// 检查 contexts 覆盖
const withContexts = keys.filter(k => d[k].contexts);
console.log('含 contexts 的条目:', withContexts.length);

// 检查字段完整性
let missingFields = 0;
for (const k of keys) {
  const v = d[k];
  if (!v.signature || !v.description || !v.parameters || !v.example) {
    missingFields++;
  }
}
console.log('缺少必备字段的条目:', missingFields);

// 检查无 _audit 残留
const withAudit = keys.filter(k => d[k]._audit);
console.log('残留 _audit 的条目:', withAudit.length);

// JSON 合法性
try { JSON.parse(JSON.stringify(d)); console.log('JSON 合法性: OK'); }
catch(e) { console.log('JSON 合法性: FAIL -', e.message); }
"
```

- [ ] **Step 3: 在 VSCode 中验证 hover 功能**

1. 打开 Extension Development Host（F5）
2. 打开一个 `*_des.cmd` 文件
3. 测试以下场景：
   - 顶层 section（如 `Electrode`）hover 显示完整文档
   - 子关键词（如 Electrode 内的 `Voltage`）hover 显示参数文档
   - 跨 section 关键词（如 `Current`）在不同 section 下显示 contexts 描述
   - 无 contexts 的旧条目 fallback 正常

- [ ] **Step 4: 提交最终产物**

```bash
git add syntaxes/sdevice_command_docs.json
git commit -m "feat(sdevice): 函数文档全量补全 — 341→{{最终数量}} 条

- 新增 ~{{新增数}} 条关键词文档
- 补全 contexts 多 section 语义描述
- 补全缺失的 keywords 和 parameters"
```

---

## Task 7: 清理与收尾

**Files:**
- Delete: `build/doc-fragments/`（临时产出，可保留用于审计追溯）
- Verify: `build/sdevice-keyword-audit.json`（审计记录保留）

- [ ] **Step 1: 更新 CLAUDE.md 文档数量**

在 CLAUDE.md 的项目结构和架构部分更新 sdevice 文档的条目数。

- [ ] **Step 2: 提交 CLAUDE.md 更新**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md sdevice 文档条目数"
```

- [ ] **Step 3: 最终状态汇总**

```bash
git log --oneline | head -10
echo "---"
node -e "
const d = require('./syntaxes/sdevice_command_docs.json');
console.log('最终文档条目:', Object.keys(d).length);
"
```
