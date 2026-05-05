#!/usr/bin/env node
/**
 * merge-sdevice-docs.js
 *
 * 将 build/doc-fragments/batch-*.json 的文档片段合并到
 * syntaxes/sdevice_command_docs.json。
 *
 * 合并策略：
 * - 新条目（_audit.isNew 或现有文档中不存在）：移除 _audit 后直接加入
 * - 已有条目：合并 contexts（取并集）、补全缺失 keywords/parameters
 * - 所有条目移除 _audit 字段
 * - 输出按 key 排序
 *
 * 用法：node scripts/merge-sdevice-docs.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRAGMENTS_DIR = path.join(ROOT, 'build', 'doc-fragments');
const TARGET_FILE = path.join(ROOT, 'syntaxes', 'sdevice_command_docs.json');

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function mergeEntry(existing, fragment) {
  const result = { ...existing };

  // 合并 contexts（取并集）
  if (fragment.contexts) {
    result.contexts = { ...(result.contexts || {}), ...fragment.contexts };
  }

  // 补全缺失 keywords（取并集）
  if (fragment.keywords && fragment.keywords.length > 0) {
    const existingKw = new Set(result.keywords || []);
    const missing = fragment.keywords.filter(k => !existingKw.has(k));
    if (missing.length > 0) {
      result.keywords = [...(result.keywords || []), ...missing];
    }
  }

  // 补全缺失 parameters（按 name 合并）
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

/**
 * 递归移除对象中所有 _audit 键（包括嵌套层）
 */
function stripAudit(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripAudit);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (key === '_audit') continue;
      cleaned[key] = stripAudit(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function main() {
  // 1. 检查 doc-fragments 目录
  if (!fs.existsSync(FRAGMENTS_DIR)) {
    console.error(`错误：文档片段目录不存在: ${FRAGMENTS_DIR}`);
    process.exit(1);
  }

  // 2. 读取现有文档
  const existingDocs = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  console.log(`现有文档条目数: ${Object.keys(existingDocs).length}`);

  // 3. 读取所有批次文件
  const batchFiles = fs.readdirSync(FRAGMENTS_DIR)
    .filter(f => /^batch-.*\.json$/.test(f))
    .sort();

  if (batchFiles.length === 0) {
    console.error('错误：未找到任何 batch-*.json 文件');
    process.exit(1);
  }

  console.log(`找到批次文件: ${batchFiles.length} 个`);

  // 4. 合并所有片段
  const seenKeys = new Set();
  let newCount = 0;
  let mergedCount = 0;

  for (const file of batchFiles) {
    const filePath = path.join(FRAGMENTS_DIR, file);
    const fragments = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`  处理 ${file}: ${Object.keys(fragments).length} 条`);

    for (const [key, fragment] of Object.entries(fragments)) {
      // 重复 key 警告（同一批次内或跨批次）
      if (seenKeys.has(key)) {
        console.warn(`  警告：重复 key "${key}"（后者覆盖）`);
      }
      seenKeys.add(key);

      const isNew = fragment._audit && fragment._audit.isNew;

      if (isNew || !existingDocs[key]) {
        // 新条目：移除 _audit 后加入
        existingDocs[key] = stripAudit(fragment);
        newCount++;
      } else {
        // 已有条目：合并
        existingDocs[key] = mergeEntry(existingDocs[key], fragment);
        // 移除可能残留的 _audit
        existingDocs[key] = stripAudit(existingDocs[key]);
        mergedCount++;
      }
    }
  }

  // 5. 对已有条目也移除可能残留的 _audit（防御性处理）
  for (const key of Object.keys(existingDocs)) {
    existingDocs[key] = stripAudit(existingDocs[key]);
  }

  // 6. 按 key 排序输出
  const sorted = {};
  for (const key of Object.keys(existingDocs).sort()) {
    sorted[key] = existingDocs[key];
  }

  // 7. 写入文件（末尾加 \n）
  fs.writeFileSync(TARGET_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf8');

  console.log(`\n合并完成:`);
  console.log(`  新增条目: ${newCount}`);
  console.log(`  合并条目: ${mergedCount}`);
  console.log(`  总条目数: ${Object.keys(sorted).length}`);
  console.log(`  输出文件: ${TARGET_FILE}`);
}

main();
