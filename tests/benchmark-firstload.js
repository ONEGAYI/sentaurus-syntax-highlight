#!/usr/bin/env node
'use strict';
/**
 * Semantic Tokens 首次加载性能诊断
 *
 * 模拟 VSCode 打开 SDE 文件时触发的核心管线，
 * 逐个测量每个组件的独立耗时，定位冻结瓶颈。
 *
 * 用法: node tests/benchmark-firstload.js [testfile]
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const testFile = process.argv[2] || path.join(PROJECT_ROOT, 'display_test', 'test_dvs.cmd');
const text = fs.readFileSync(testFile, 'utf8');
const lines = text.split('\n').length;

console.log(`\n${'='.repeat(60)}`);
console.log(`首次加载性能诊断: ${path.basename(testFile)} (${lines} 行)`);
console.log(`${'='.repeat(60)}`);

// ── 模拟 VSCode TextDocument ──────────────────────
let _version = 1;
const mockDocument = {
    uri: { toString: () => testFile },
    version: _version,
    getText: () => text,
};
function resetVersion() { _version++; mockDocument.version = _version; }

// ── 加载核心模块（不依赖 vscode） ──────────────────
const schemeParser = require('../src/lsp/scheme-parser');
const schemeAnalyzer = require('../src/lsp/scheme-analyzer');
const scopeAnalyzer = require('../src/lsp/scope-analyzer');
const semanticDispatcher = require('../src/lsp/semantic-dispatcher');
const defs = require('../src/definitions');
const sigProvider = require('../src/lsp/providers/signature-provider');
const semanticTokensMod = require('../src/lsp/providers/semantic-tokens-provider');
const { SchemeParseCache, computeLineStarts } = require('../src/lsp/parse-cache');

// ── 阶段 1: 解析管线各步骤耗时 ─────────────────────
console.log('\n━━ 阶段 1: 管线各步骤首次耗时 ━━━━━━━━━━━━━━━━');

const t1a = performance.now();
const { ast, errors } = schemeParser.parse(text);
const t1b = performance.now();
console.log(`  parse:             ${(t1b - t1a).toFixed(2)}ms`);

const t2a = performance.now();
const analysis = schemeAnalyzer.analyze(ast, text);
const t2b = performance.now();
console.log(`  analyze:           ${(t2b - t2a).toFixed(2)}ms`);

const t3a = performance.now();
const scopeTree = scopeAnalyzer.buildScopeTree(ast);
const t3b = performance.now();
console.log(`  buildScopeTree:    ${(t3b - t3a).toFixed(2)}ms`);

// lineStarts (computeLineStarts)
const t4a = performance.now();
const lineStarts = computeLineStarts(text);
const t4b = performance.now();
console.log(`  computeLineStarts: ${(t4b - t4a).toFixed(2)}ms`);

const totalPipeline = t1b - t1a + t2b - t2a + t3b - t3a + t4b - t4a;
console.log(`  ── 管线总计:       ${totalPipeline.toFixed(2)}ms`);

// ── 阶段 2: SchemeParseCache 首次 vs 缓存 ─────────
console.log('\n━━ 阶段 2: SchemeParseCache 性能 ━━━━━━━━━━━━━━━');

const schemeCache = new SchemeParseCache();

// 冷启动
resetVersion();
const tc0 = performance.now();
const cacheResult = schemeCache.get(mockDocument);
const tc1 = performance.now();
console.log(`  首次 get():        ${(tc1 - tc0).toFixed(2)}ms`);
console.log(`    definitions: ${cacheResult.analysis.definitions.length}, foldingRanges: ${cacheResult.analysis.foldingRanges.length}`);

// 缓存命中
resetVersion();
const tc2 = performance.now();
schemeCache.get(mockDocument);
const tc3 = performance.now();
console.log(`  缓存命中 get():    ${(tc3 - tc2).toFixed(2)}ms`);

// 版本未变命中（不 resetVersion）
const tc4 = performance.now();
schemeCache.get(mockDocument);
const tc5 = performance.now();
console.log(`  同版本 get():      ${(tc5 - tc4).toFixed(2)}ms`);

// ── 阶段 3: Semantic Tokens Provider 耗时 ─────────
console.log('\n━━ 阶段 3: Semantic Tokens Provider ━━━━━━━━━━━━━');

const stProvider = semanticTokensMod.createSemanticTokensProvider(schemeCache);

// 冷启动（触发 schemeCache.get 内部解析）
schemeCache.invalidate(mockDocument.uri.toString());
resetVersion();
const ts0 = performance.now();
const stResult = stProvider.provideDocumentSemanticTokens(mockDocument);
const ts1 = performance.now();
console.log(`  冷启动:            ${(ts1 - ts0).toFixed(2)}ms (${stResult.data.length / 5} tokens)`);

// 缓存命中
resetVersion();
const ts2 = performance.now();
stProvider.provideDocumentSemanticTokens(mockDocument);
const ts3 = performance.now();
console.log(`  缓存命中:          ${(ts3 - ts2).toFixed(2)}ms`);

// ── 阶段 4: Signature Help 耗时 ──────────────────
console.log('\n━━ 阶段 4: Signature Help ━━━━━━━━━━━━━━━━━━━━━');

const midLine = Math.floor(lines / 2);
const midCol = 10;

// 冷启动
defs.clearDefinitionCache();
const tsg0 = performance.now();
sigProvider.provideSignatureHelp(mockDocument, { line: midLine, character: midCol }, null, {}, {}, schemeCache, defs);
const tsg1 = performance.now();
console.log(`  冷启动（含 defs 解析）: ${(tsg1 - tsg0).toFixed(2)}ms`);

// 缓存命中
const tsg2 = performance.now();
sigProvider.provideSignatureHelp(mockDocument, { line: midLine, character: midCol }, null, {}, {}, schemeCache, defs);
const tsg3 = performance.now();
console.log(`  缓存命中:          ${(tsg3 - tsg2).toFixed(2)}ms`);

// ── 阶段 5: defs.getDefinitions 独立耗时 ──────────
console.log('\n━━ 阶段 5: defs.getDefinitions ━━━━━━━━━━━━━━━━━');

defs.clearDefinitionCache();
const td0 = performance.now();
const userDefs = defs.getDefinitions(mockDocument, 'sde');
const td1 = performance.now();
console.log(`  冷启动:            ${(td1 - td0).toFixed(2)}ms (${userDefs.length} definitions)`);

const td2 = performance.now();
defs.getDefinitions(mockDocument, 'sde');
const td3 = performance.now();
console.log(`  缓存命中:          ${(td3 - td2).toFixed(2)}ms`);

// ── 阶段 6: 模拟完整首次加载链 ─────────────────────
console.log('\n━━ 阶段 6: 完整首次加载模拟 ━━━━━━━━━━━━━━━━━━━━');

// 清空所有缓存
schemeCache.invalidate(mockDocument.uri.toString());
defs.clearDefinitionCache();
resetVersion();

const tf0 = performance.now();

// Semantic Tokens → 触发 schemeCache.get
stProvider.provideDocumentSemanticTokens(mockDocument);

// Signature Help → schemeCache 已命中，defs 需独立解析
sigProvider.provideSignatureHelp(mockDocument, { line: midLine, character: midCol }, null, {}, {}, schemeCache, defs);

// Completion → defs.getDefinitions
defs.getDefinitions(mockDocument, 'sde');

// getSchemeRefs (undef var diagnostic 使用)
scopeAnalyzer.getSchemeRefs(ast);

// getVisibleDefinitions (scope-aware completion 使用)
scopeAnalyzer.getVisibleDefinitions(scopeTree, midLine);

const tf1 = performance.now();
console.log(`  完整 Provider 链（首次）: ${(tf1 - tf0).toFixed(2)}ms`);

// 缓存命中
resetVersion();
const tf2 = performance.now();
stProvider.provideDocumentSemanticTokens(mockDocument);
sigProvider.provideSignatureHelp(mockDocument, { line: midLine, character: midCol }, null, {}, {}, schemeCache, defs);
defs.getDefinitions(mockDocument, 'sde');
const tf3 = performance.now();
console.log(`  完整 Provider 链（缓存）: ${(tf3 - tf2).toFixed(2)}ms`);

// ── 阶段 7: defs 模块是否与 schemeCache 重复解析？ ──
console.log('\n━━ 阶段 7: 重复解析检测 ━━━━━━━━━━━━━━━━━━━━━━━');

schemeCache.invalidate(mockDocument.uri.toString());
defs.clearDefinitionCache();
resetVersion();

// 1. schemeCache.get
const tr0 = performance.now();
const cr = schemeCache.get(mockDocument);
const tr1 = performance.now();
const cacheDefs = cr.analysis.definitions;

// 2. defs.getDefinitions (独立解析)
const tr2 = performance.now();
const defsResult = defs.getDefinitions(mockDocument, 'sde');
const tr3 = performance.now();

console.log(`  schemeCache.get:   ${(tr1 - tr0).toFixed(2)}ms → ${cacheDefs.length} defs`);
console.log(`  defs.get:          ${(tr3 - tr2).toFixed(2)}ms → ${defsResult.length} defs`);
console.log(`  重复开销:          ${(tr3 - tr2).toFixed(2)}ms (${defsResult.length === cacheDefs.length ? '结果一致' : '结果不一致!'})`);

// ── 阶段 8: 缩放测试 ──────────────────────────────
console.log('\n━━ 阶段 8: 不同文件大小的 Semantic Tokens ━━━━━━');

for (const targetLines of [100, 500, 1000, 2000, 4000]) {
    const synthText = generateSchemeCode(targetLines);
    const synthDoc = {
        uri: { toString: () => `synth_${targetLines}` },
        version: 1,
        getText: () => synthText,
    };

    const synthCache = new SchemeParseCache();
    const synthProvider = semanticTokensMod.createSemanticTokensProvider(synthCache);

    const ts0 = performance.now();
    synthProvider.provideDocumentSemanticTokens(synthDoc);
    const ts1 = performance.now();

    synthDoc.version = 2;
    const ts2 = performance.now();
    synthProvider.provideDocumentSemanticTokens(synthDoc);
    const ts3 = performance.now();

    console.log(`  ${String(targetLines).padStart(5)} 行: 冷=${(ts1 - ts0).toFixed(2)}ms, 热=${(ts3 - ts2).toFixed(2)}ms`);
}

// ── 阶段 9: extractSemanticTokens 独立耗时 ──────────
console.log('\n━━ 阶段 9: extractSemanticTokens 算法耗时 ━━━━━━');

const userFuncNames = new Set();
for (const d of cacheResult.analysis.definitions) {
    if (d.kind === 'function' || d.params) userFuncNames.add(d.name);
}

const te0 = performance.now();
for (let i = 0; i < 100; i++) {
    semanticTokensMod.extractSemanticTokens(cacheResult.ast, userFuncNames, cacheResult.lineStarts);
}
const te1 = performance.now();
console.log(`  100 次调用平均:    ${((te1 - te0) / 100).toFixed(3)}ms`);

function generateSchemeCode(lines) {
    const parts = [];
    let i = 0;
    while (i < lines) {
        parts.push(`(define top_var_${i} "value_${i}")`);
        i++;
        if (i >= lines) break;
        const funcLines = Math.min(8, lines - i);
        const funcBody = [];
        for (let j = 0; j < funcLines && i < lines; j++, i++) {
            funcBody.push(`    (sdegeo:create-rectangle "region_${i}" (list ${i}.0 ${i}.0) (list ${i + 10}.0 ${i + 10}.0))`);
        }
        parts.push(`(define (my-func-${parts.length} arg1 arg2)`);
        parts.push(...funcBody);
        parts.push(')');
    }
    return parts.join('\n');
}

console.log(`\n${'='.repeat(60)}`);
console.log('诊断完成');
console.log(`${'='.repeat(60)}\n`);
