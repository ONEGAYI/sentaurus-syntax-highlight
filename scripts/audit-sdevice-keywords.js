#!/usr/bin/env node
/**
 * audit-sdevice-keywords.js
 *
 * 从 sdevice_command_docs.json + all_keywords.json 提取所有 SDEVICE 关键词，
 * 在官方手册 markdown 文件中做忽略大小写的文本搜索，
 * 产出 build/sdevice-keyword-audit.json。
 *
 * 用法：
 *   node scripts/audit-sdevice-keywords.js [refs-dir]
 *
 * refs-dir 默认为 <repo-root>/references
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

const REFS_DIR = process.argv[2] || path.resolve(__dirname, '..', '..', 'references');
const MANUAL_FILES = [
  'sdevice_ug_T-2022.03.md',
  'sdevice_ug_T-2022.03_1.md',
  'sdevice_ug_T-2022.03_2.md',
];

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMMAND_DOCS_PATH = path.join(PROJECT_ROOT, 'syntaxes', 'sdevice_command_docs.json');
const ALL_KEYWORDS_PATH = path.join(PROJECT_ROOT, 'syntaxes', 'all_keywords.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'build');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'sdevice-keyword-audit.json');

const MAX_OCCURRENCES = 50; // 每个词最多记录的出现位置数
const CONTEXT_CHARS = 120;   // 匹配行前后各取的字符数

// ---------------------------------------------------------------------------
// 主逻辑
// ---------------------------------------------------------------------------

function main() {
  console.log('=== SDEVICE 关键词审计扫描 ===\n');

  // 1. 确保输出目录存在
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 2. 加载源数据
  console.log('[1/4] 加载源数据...');
  const commandDocs = JSON.parse(fs.readFileSync(COMMAND_DOCS_PATH, 'utf-8'));
  const allKeywords = JSON.parse(fs.readFileSync(ALL_KEYWORDS_PATH, 'utf-8'));
  const sdeviceKeywords = allKeywords.sdevice || {};

  // 3. 提取所有目标词
  console.log('[2/4] 提取目标关键词...');
  const targetWords = extractTargetWords(commandDocs, sdeviceKeywords);
  console.log(`  共提取 ${targetWords.size} 个唯一关键词`);

  // 4. 加载手册文件
  console.log('[3/4] 加载手册文件...');
  const manuals = loadManuals();
  for (const [file, lines] of Object.entries(manuals)) {
    console.log(`  ${file}: ${lines.length} 行`);
  }

  // 5. 搜索匹配
  console.log('[4/4] 搜索匹配...');
  const result = searchKeywords(targetWords, commandDocs, manuals);

  // 6. 写入产出
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n产出已写入: ${OUTPUT_PATH}`);

  // 7. 打印摘要
  printSummary(result);
}

// ---------------------------------------------------------------------------
// 提取目标词
// ---------------------------------------------------------------------------

function extractTargetWords(commandDocs, sdeviceKeywords) {
  const wordSet = new Set();

  // 来自 sdevice_command_docs.json:
  // - 每个 key（命令名）
  // - 每个 entry 的 keywords[] 数组
  // - 每个 entry 的 parameters[].name
  for (const [key, entry] of Object.entries(commandDocs)) {
    wordSet.add(key);
    if (entry.keywords && Array.isArray(entry.keywords)) {
      for (const kw of entry.keywords) {
        wordSet.add(kw);
      }
    }
    if (entry.parameters && Array.isArray(entry.parameters)) {
      for (const param of entry.parameters) {
        if (param.name) wordSet.add(param.name);
      }
    }
  }

  // 来自 all_keywords.json 的 sdevice 组
  for (const group of Object.values(sdeviceKeywords)) {
    if (Array.isArray(group)) {
      for (const kw of group) {
        wordSet.add(kw);
      }
    }
  }

  return wordSet;
}

// ---------------------------------------------------------------------------
// 加载手册文件
// ---------------------------------------------------------------------------

function loadManuals() {
  const manuals = {};
  for (const file of MANUAL_FILES) {
    const filePath = path.join(REFS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  警告: 手册文件不存在，跳过: ${filePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // 按行拆分，保留换行符用于上下文
    const lines = content.split('\n');
    manuals[file] = lines;
  }
  return manuals;
}

// ---------------------------------------------------------------------------
// 搜索关键词
// ---------------------------------------------------------------------------

function searchKeywords(targetWords, commandDocs, manuals) {
  const result = {};

  // 将 targetWords 转为数组并排序，保证产出稳定
  const sortedWords = Array.from(targetWords).sort();

  for (const word of sortedWords) {
    const entry = {
      currentDoc: getDocStatus(word, commandDocs),
      occurrences: [],
    };

    // 构建 word boundary 正则，忽略大小写
    // 需要转义正则特殊字符
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');

    for (const [file, lines] of Object.entries(manuals)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (regex.test(line)) {
          const context = extractContext(lines, i);
          const nearbyHeading = findNearbyHeading(lines, i);
          entry.occurrences.push({
            file,
            line: i + 1, // 1-based 行号
            context,
            nearbyHeading,
          });
        }
        // 达到上限就停止该文件搜索
        if (entry.occurrences.length >= MAX_OCCURRENCES) break;
      }
      if (entry.occurrences.length >= MAX_OCCURRENCES) break;
    }

    entry.occurrences = entry.occurrences.slice(0, MAX_OCCURRENCES);
    result[word] = entry;
  }

  return result;
}

// ---------------------------------------------------------------------------
// 提取上下文（前后各 CONTEXT_CHARS 字符）
// ---------------------------------------------------------------------------

function extractContext(lines, lineIndex) {
  const line = lines[lineIndex];

  // 取当前行前后在 lines 数组中的内容
  const beforeParts = [];
  let remaining = CONTEXT_CHARS;
  for (let i = lineIndex - 1; i >= 0 && remaining > 0; i--) {
    const l = lines[i];
    if (remaining >= l.length) {
      beforeParts.unshift(l);
      remaining -= l.length;
    } else {
      beforeParts.unshift(l.slice(l.length - remaining));
      remaining = 0;
    }
  }

  const afterParts = [];
  remaining = CONTEXT_CHARS;
  for (let i = lineIndex + 1; i < lines.length && remaining > 0; i++) {
    const l = lines[i];
    if (remaining >= l.length) {
      afterParts.push(l);
      remaining -= l.length;
    } else {
      afterParts.push(l.slice(0, remaining));
      remaining = 0;
    }
  }

  const before = beforeParts.join('\n');
  const after = afterParts.join('\n');

  // 合并为单行，便于 JSON 存储
  return (before + '\n' + line + '\n' + after)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 向上查找最近的 markdown 标题
// ---------------------------------------------------------------------------

function findNearbyHeading(lines, lineIndex) {
  for (let i = lineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    // 匹配 markdown 标题: # ~ ######
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      // 返回标题文本（去掉 # 和首尾空白）
      return match[2].trim();
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 获取当前文档状态
// ---------------------------------------------------------------------------

function getDocStatus(word, commandDocs) {
  if (commandDocs[word]) {
    return {
      exists: true,
      section: commandDocs[word].section || null,
    };
  }
  return { exists: false };
}

// ---------------------------------------------------------------------------
// 打印摘要
// ---------------------------------------------------------------------------

function printSummary(result) {
  const totalWords = Object.keys(result).length;
  const wordsWithMatches = Object.values(result).filter(e => e.occurrences.length > 0).length;
  const wordsWithoutMatches = totalWords - wordsWithMatches;
  const wordsWithDoc = Object.values(result).filter(e => e.currentDoc.exists).length;

  console.log('\n=== 审计摘要 ===');
  console.log(`  总词数: ${totalWords}`);
  console.log(`  有手册匹配: ${wordsWithMatches}`);
  console.log(`  无手册匹配: ${wordsWithoutMatches}`);
  console.log(`  已有文档: ${wordsWithDoc}`);
  console.log(`  无文档: ${totalWords - wordsWithDoc}`);
}

// ---------------------------------------------------------------------------
// 启动
// ---------------------------------------------------------------------------

main();
