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
