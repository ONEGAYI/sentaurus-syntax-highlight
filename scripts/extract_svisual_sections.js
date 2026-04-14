// scripts/extract_svisual_sections.js
'use strict';

/**
 * 从 svisual_command_docs.json 自动提取 section 关键词，
 * 输出可直接粘贴到 tcl-symbol-configs.js 的 new Set([...]) 代码。
 */
const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, '..', 'syntaxes', 'svisual_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf-8'));

// 命名空间前缀 — 这些函数没有 section，不参与提取
const NS_PREFIXES = ['ext::', 'rfx::', 'const::', 'ifm::', 'emw::fit::', 'lib::'];

const sections = {};
for (const [cmd, info] of Object.entries(docs)) {
    if (!info.section) continue;
    if (NS_PREFIXES.some(p => cmd.startsWith(p))) continue;
    const sec = info.section;
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(cmd);
}

// 按 section 名排序，内部命令也排序
const sorted = Object.entries(sections).sort((a, b) => a[0].localeCompare(b[0]));

let lines = ["    svisual: new Set(["];
let total = 0;
for (const [sec, cmds] of sorted) {
    cmds.sort();
    total += cmds.length;
    lines.push(`        // ${sec} (${cmds.length})`);
    for (let i = 0; i < cmds.length; i += 4) {
        const chunk = cmds.slice(i, i + 4);
        lines.push('        ' + chunk.map(c => `'${c}'`).join(', ') + ',');
    }
}
lines.push('    ]),');

console.log(lines.join('\n'));
console.error(`\n// Total: ${total} section keywords`);
