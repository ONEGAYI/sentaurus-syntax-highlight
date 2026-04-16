#!/usr/bin/env node
'use strict';
/**
 * 性能基准测试脚本
 *
 * 用法: node tests/benchmark.js [--iterations N] [--json output.json]
 *
 * 测试内容:
 *   1. Scheme 管线: parse → analyze → buildScopeTree → getVisibleDefinitions
 *   2. Tcl 管线: WASM parse → getVariables → buildScopeMap (需 WASM 初始化)
 *   3. 定义提取: extractDefinitions (Scheme + Tcl)
 *   4. 激活成本: JSON 加载 + 补全项构建
 *   5. 缩放测试: 100/500/1000/2000 行文件的管线时间
 *   6. 算法专项: buildScopeMap O(n²) 验证、getVisibleDefinitions 重复调用
 *
 * 输出: 结构化报告，可保存为 JSON 进行前后对比
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// ── 配置 ──────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ITERATIONS = parseInt(process.argv.find(a => a.startsWith('--iterations='))?.split('=')[1], 10) || 10;
const JSON_OUTPUT = process.argv.find(a => a.startsWith('--json='))?.split('=')[1] || null;
const WARMUP = 3; // 前 N 轮作为预热，不计入统计

// ── 工具函数 ───────────────────────────────────────
function avg(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function p95(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
}

function min(arr) { return arr.length ? Math.min(...arr) : 0; }
function max(arr) { return arr.length ? Math.max(...arr) : 0; }

function stats(arr) {
    return {
        avg: parseFloat(avg(arr).toFixed(3)),
        median: parseFloat(median(arr).toFixed(3)),
        p95: parseFloat(p95(arr).toFixed(3)),
        min: parseFloat(min(arr).toFixed(3)),
        max: parseFloat(max(arr).toFixed(3)),
        runs: arr.length,
    };
}

/**
 * 运行一个基准测试函数多次，返回统计信息
 * @param {string} name 测试名称
 * @param {Function} fn 要测试的函数（无参数，无返回值要求）
 * @param {number} iterations 运行次数
 * @returns {{ name: string, ms: object }}
 */
function bench(name, fn, iterations = ITERATIONS) {
    const timings = [];
    // 预热
    for (let i = 0; i < WARMUP; i++) fn();
    // 正式测量
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        timings.push(end - start);
    }
    return { name, ms: stats(timings) };
}

// ── 测试数据生成器 ─────────────────────────────────

/**
 * 生成指定行数的 Scheme (SDE) 测试代码
 */
function generateSchemeCode(lines) {
    const parts = [];
    let i = 0;

    // 顶层定义
    while (i < lines) {
        // (define varName value)
        parts.push(`(define top_var_${i} "value_${i}")`);
        i++;
        if (i >= lines) break;

        // (define (funcName args) body...)
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

/**
 * 生成指定行数的 Tcl 测试代码
 */
function generateTclCode(lines, procCount = 0) {
    const parts = [];
    let i = 0;

    // 全局变量定义
    while (i < Math.min(lines / 4, lines)) {
        parts.push(`set global_var_${i} "value_${i}"`);
        i++;
    }

    // proc 定义
    const targetProcs = procCount || Math.floor(lines / 20);
    for (let p = 0; p < targetProcs && i < lines; p++) {
        const bodyLines = Math.min(10, lines - i - 3);
        parts.push(`proc proc_${p} {arg1 arg2} {`);
        i++;
        for (let b = 0; b < bodyLines && i < lines; b++, i++) {
            parts.push(`    set local_${b} [expr {$arg1 + $arg2 + ${b}}]`);
        }
        parts.push('}');
        i++;
    }

    // 填充到目标行数
    while (i < lines) {
        parts.push(`# comment line ${i}`);
        i++;
    }
    return parts.join('\n');
}

// ── 加载模块 ───────────────────────────────────────
const schemeParser = require(path.join(PROJECT_ROOT, 'src/lsp/scheme-parser.js'));
const schemeAnalyzer = require(path.join(PROJECT_ROOT, 'src/lsp/scheme-analyzer.js'));
const scopeAnalyzer = require(path.join(PROJECT_ROOT, 'src/lsp/scope-analyzer.js'));
const semanticDispatcher = require(path.join(PROJECT_ROOT, 'src/lsp/semantic-dispatcher.js'));
const definitions = require(path.join(PROJECT_ROOT, 'src/definitions.js'));

// ── 加载真实测试文件 ──────────────────────────────
function loadTestFile(filename) {
    const filePath = path.join(PROJECT_ROOT, 'display_test', filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
}

const testFiles = {
    sde: {
        small: loadTestFile('testbench_dvs.cmd'),    // ~165 lines
        medium: loadTestFile('test_dvs.cmd'),          // ~289 lines
    },
    sdevice: {
        large: loadTestFile('testbench_des.cmd'),     // ~1300 lines
    },
    sprocess: {
        large: loadTestFile('testbench_fps.cmd'),     // ~1569 lines (最大)
    },
    svisual: {
        medium: loadTestFile('testbench_vis.cmd'),    // ~703 lines
    },
    emw: {
        large: loadTestFile('testbench_eml.cmd'),     // ~1292 lines
    },
    inspect: {
        large: loadTestFile('testbench_ins.cmd'),     // ~986 lines
    },
};

// ── 基准测试套件 ───────────────────────────────────

const results = {};
console.log('='.repeat(70));
console.log(`Sentaurus TCAD Extension — 性能基准测试`);
console.log(`迭代次数: ${ITERATIONS} (预热: ${WARMUP})`);
console.log(`Node.js: ${process.version}`);
console.log(`时间: ${new Date().toISOString()}`);
console.log('='.repeat(70));

// ════════════════════════════════════════════════════
// 1. 激活成本：JSON 加载 + 补全项构建
// ════════════════════════════════════════════════════
console.log('\n━━ 1. 激活成本 ━━━━━━━━━━━━━━━━━━━━━━━━━━');

results.activation = {};

// 1a. JSON 文件加载时间
const jsonFiles = [
    'syntaxes/all_keywords.json',
    'syntaxes/sde_function_docs.json',
    'syntaxes/scheme_function_docs.json',
    'syntaxes/sdevice_command_docs.json',
    'syntaxes/svisual_command_docs.json',
];

results.activation.jsonLoading = {};
let totalJsonTime = 0;
for (const relPath of jsonFiles) {
    const fullPath = path.join(PROJECT_ROOT, relPath);
    const sizeKB = (fs.statSync(fullPath).size / 1024).toFixed(1);
    const result = bench(`load ${path.basename(relPath)} (${sizeKB}KB)`, () => {
        JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }, ITERATIONS);
    results.activation.jsonLoading[path.basename(relPath)] = { sizeKB: parseFloat(sizeKB), ms: result.ms };
    totalJsonTime += result.ms.avg;
    console.log(`  ${result.name}: avg=${result.ms.avg}ms  p95=${result.ms.p95}ms`);
}
console.log(`  总计 JSON 加载: ~${totalJsonTime.toFixed(1)}ms`);

// 1b. 补全项构建时间（模拟）
results.activation.completionBuilding = {};
const allKeywords = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'syntaxes/all_keywords.json'), 'utf8'));

for (const langId of ['sde', 'sdevice', 'sprocess', 'svisual']) {
    const kw = allKeywords[langId] || {};
    const result = bench(`buildCompletionItems(${langId}, ${Object.values(kw).flat().length} keywords)`, () => {
        const items = [];
        for (const [category, words] of Object.entries(kw)) {
            for (const word of words) {
                items.push({ label: word, kind: 6 }); // vscode.CompletionItemKind.Variable
            }
        }
        return items;
    }, ITERATIONS);
    results.activation.completionBuilding[langId] = result.ms;
    console.log(`  ${result.name}: avg=${result.ms.avg}ms`);
}

// ════════════════════════════════════════════════════
// 2. Scheme 管线
// ════════════════════════════════════════════════════
console.log('\n━━ 2. Scheme (SDE) 管线 ━━━━━━━━━━━━━━━━━━');

results.scheme = {};

// 用真实文件和合成文件测试
const schemeTestData = {};
if (testFiles.sde.small) schemeTestData['real_small'] = { label: 'testbench_dvs (~165 lines)', text: testFiles.sde.small };
if (testFiles.sde.medium) schemeTestData['real_medium'] = { label: 'test_dvs (~289 lines)', text: testFiles.sde.medium };

// 合成文件用于缩放测试
for (const lineCount of [100, 500, 1000, 2000]) {
    schemeTestData[`synth_${lineCount}`] = {
        label: `synthetic_${lineCount} lines`,
        text: generateSchemeCode(lineCount),
    };
}

for (const [key, { label, text }] of Object.entries(schemeTestData)) {
    console.log(`\n  ── ${label} (${text.split('\n').length} lines) ──`);
    const entry = {};

    // 2a. parse
    let ast;
    const parseResult = bench('parse', () => {
        const r = schemeParser.parse(text);
        ast = r.ast;
    }, ITERATIONS);
    entry.parse = parseResult.ms;
    console.log(`    parse:           avg=${parseResult.ms.avg}ms  median=${parseResult.ms.median}ms`);

    // 2b. analyze (definitions + folding)
    const analyzeResult = bench('analyze', () => {
        schemeAnalyzer.analyze(ast, text);
    }, ITERATIONS);
    entry.analyze = analyzeResult.ms;
    console.log(`    analyze:         avg=${analyzeResult.ms.avg}ms  median=${analyzeResult.ms.median}ms`);

    // 2c. buildScopeTree
    let scopeTree;
    const scopeResult = bench('buildScopeTree', () => {
        scopeTree = scopeAnalyzer.buildScopeTree(ast);
    }, ITERATIONS);
    entry.buildScopeTree = scopeResult.ms;
    console.log(`    buildScopeTree:  avg=${scopeResult.ms.avg}ms  median=${scopeResult.ms.median}ms`);

    // 2d. getVisibleDefinitions (模拟在文档中间查询)
    const midLine = Math.floor(text.split('\n').length / 2);
    const visDefsResult = bench(`getVisibleDefinitions(line=${midLine})`, () => {
        scopeAnalyzer.getVisibleDefinitions(scopeTree, midLine);
    }, ITERATIONS);
    entry.getVisibleDefinitions = visDefsResult.ms;
    console.log(`    getVisibleDefs:  avg=${visDefsResult.ms.avg}ms  median=${visDefsResult.ms.median}ms`);

    // 2e. getSchemeRefs
    const refsResult = bench('getSchemeRefs', () => {
        scopeAnalyzer.getSchemeRefs(ast);
    }, ITERATIONS);
    entry.getSchemeRefs = refsResult.ms;
    console.log(`    getSchemeRefs:   avg=${refsResult.ms.avg}ms  median=${refsResult.ms.median}ms`);

    // 2f. 完整管线（parse + analyze + scopeTree + getVisibleDefinitions）
    const pipelineResult = bench('full pipeline', () => {
        const r = schemeParser.parse(text);
        const a = schemeAnalyzer.analyze(r.ast, text);
        const st = scopeAnalyzer.buildScopeTree(r.ast);
        scopeAnalyzer.getVisibleDefinitions(st, midLine);
    }, ITERATIONS);
    entry.fullPipeline = pipelineResult.ms;
    console.log(`    FULL PIPELINE:   avg=${pipelineResult.ms.avg}ms  median=${pipelineResult.ms.median}ms`);

    // 2g. extractDefinitions
    const extractDefResult = bench('extractDefinitions(sde)', () => {
        definitions.extractDefinitions(text, 'sde');
    }, ITERATIONS);
    entry.extractDefinitions = extractDefResult.ms;
    console.log(`    extractDefs:     avg=${extractDefResult.ms.avg}ms  median=${extractDefResult.ms.median}ms`);

    // 2h. 冗余解析模拟：一个 Provider 触发链（5 次独立解析）
    const redundantResult = bench('5x redundant parse (simulated)', () => {
        // 模拟当前状态：5 个 Provider 各自解析
        // Provider 1: Folding
        schemeAnalyzer.analyze(schemeParser.parse(text).ast);
        // Provider 2: Signature
        schemeParser.parse(text);
        // Provider 3: Diagnostic
        const r3 = schemeParser.parse(text);
        scopeAnalyzer.buildScopeTree(r3.ast);
        // Provider 4: Completion (SDE scope-aware)
        const r4 = schemeParser.parse(text);
        scopeAnalyzer.buildScopeTree(r4.ast);
        scopeAnalyzer.getVisibleDefinitions(scopeAnalyzer.buildScopeTree(r4.ast), midLine);
        // Provider 5: Definitions
        definitions.extractDefinitions(text, 'sde');
    }, Math.max(3, Math.floor(ITERATIONS / 2))); // 减少迭代次数（此测试很慢）
    entry.redundantParse5x = redundantResult.ms;
    console.log(`    5x REDUNDANT:    avg=${redundantResult.ms.avg}ms  median=${redundantResult.ms.median}ms`);

    results.scheme[key] = { label, lines: text.split('\n').length, ...entry };
}

// ════════════════════════════════════════════════════
// 3. Tcl 管线（不依赖 WASM 的部分）
// ════════════════════════════════════════════════════
console.log('\n━━ 3. Tcl 管线（纯文本操作） ━━━━━━━━━━━━━━');

results.tcl = {};

const tclTestData = {};
if (testFiles.sdevice.large) tclTestData['real_large_des'] = { label: 'testbench_des (~1300 lines)', text: testFiles.sdevice.large };
if (testFiles.sprocess.large) tclTestData['real_large_fps'] = { label: 'testbench_fps (~1569 lines)', text: testFiles.sprocess.large };

for (const lineCount of [100, 500, 1000, 2000]) {
    tclTestData[`synth_${lineCount}`] = {
        label: `synthetic_${lineCount} lines`,
        text: generateTclCode(lineCount),
    };
}

for (const [key, { label, text }] of Object.entries(tclTestData)) {
    console.log(`\n  ── ${label} (${text.split('\n').length} lines) ──`);
    const entry = {};

    // 3a. extractDefinitions(Tcl)
    const tclLangs = ['sdevice', 'sprocess', 'svisual'];
    const extractDefResult = bench(`extractDefinitions(${tclLangs[0]})`, () => {
        definitions.extractDefinitions(text, tclLangs[0]);
    }, ITERATIONS);
    entry.extractDefinitions = extractDefResult.ms;
    console.log(`    extractDefs:     avg=${extractDefResult.ms.avg}ms  median=${extractDefResult.ms.median}ms`);

    results.tcl[key] = { label, lines: text.split('\n').length, ...entry };
}

// ════════════════════════════════════════════════════
// 4. Tcl WASM 管线（如果初始化成功）
// ════════════════════════════════════════════════════
console.log('\n━━ 4. Tcl WASM 管线 ━━━━━━━━━━━━━━━━━━━━━━');

results.tclWasm = { available: false };

let tclParser = null;
try {
    const Parser = require('web-tree-sitter');

    async function initTclWasm() {
        await Parser.init({
            locateFile(scriptName) {
                return path.join(PROJECT_ROOT, 'node_modules', 'web-tree-sitter', scriptName);
            },
        });
        const grammarPath = path.join(PROJECT_ROOT, 'syntaxes', 'tree-sitter-tcl.wasm');
        const tclLanguage = await Parser.Language.load(grammarPath);
        const parser = new Parser();
        parser.setLanguage(tclLanguage);
        return parser;
    }

    // 尝试同步风格初始化（用 IIFE + 同步等待技巧）
    const tclWasmInit = initTclWasm();
    tclWasmInit.then(p => {
        tclParser = p;
    }).catch(err => {
        console.log(`  WASM 初始化失败: ${err.message}`);
    });

    // 由于是 async，我们需要在 async 上下文中运行 WASM 测试
    // 下面的 runAsyncBenchmarks 会在脚本末尾执行

} catch (err) {
    console.log(`  web-tree-sitter 不可用: ${err.message}`);
}

async function runAsyncBenchmarks() {
    if (!tclParser) {
        console.log('  (跳过 — WASM 解析器未初始化)');
        return;
    }

    results.tclWasm.available = true;

    const tclAstUtils = require(path.join(PROJECT_ROOT, 'src/lsp/tcl-ast-utils.js'));

    // 直接注入 parser 到 astUtils
    // 由于 tcl-ast-utils 使用 tclParserWasm.parse()，我们需要通过模块接口
    // 使用 parseSafe 需要先 init，这里直接用 parser
    function tclParse(text) {
        return tclParser.parse(text);
    }

    for (const lineCount of [100, 500, 1000]) {
        const text = generateTclCode(lineCount, Math.floor(lineCount / 20));
        const procCount = Math.floor(lineCount / 20);
        console.log(`\n  ── Tcl ${lineCount} lines (${procCount} procs) ──`);
        const entry = {};

        // 4a. WASM parse
        let tree;
        const parseResult = bench('wasm parse', () => {
            const t = tclParse(text);
            if (tree) tree.delete();
            tree = t;
        }, ITERATIONS);
        entry.wasmParse = parseResult.ms;
        console.log(`    wasm parse:      avg=${parseResult.ms.avg}ms  median=${parseResult.ms.median}ms`);

        // 4b. getVariables
        const varsResult = bench('getVariables', () => {
            tclAstUtils.getVariables(tree.rootNode, text);
        }, ITERATIONS);
        entry.getVariables = varsResult.ms;
        console.log(`    getVariables:    avg=${varsResult.ms.avg}ms  median=${varsResult.ms.median}ms`);

        // 4c. buildScopeMap — 关键 O(n²) 目标
        const scopeMapResult = bench('buildScopeMap', () => {
            tclAstUtils.buildScopeMap(tree.rootNode);
        }, Math.max(3, Math.floor(ITERATIONS / 2)));
        entry.buildScopeMap = scopeMapResult.ms;
        console.log(`    buildScopeMap:   avg=${scopeMapResult.ms.avg}ms  median=${scopeMapResult.ms.median}ms`);

        // 4d. getFoldingRanges
        const foldingResult = bench('getFoldingRanges', () => {
            tclAstUtils.getFoldingRanges(tree.rootNode);
        }, ITERATIONS);
        entry.getFoldingRanges = foldingResult.ms;
        console.log(`    getFoldingRanges: avg=${foldingResult.ms.avg}ms  median=${foldingResult.ms.median}ms`);

        // 4e. 完整 Tcl 管线
        const fullResult = bench('full Tcl pipeline', () => {
            const t = tclParse(text);
            try {
                tclAstUtils.getVariables(t.rootNode, text);
                tclAstUtils.buildScopeMap(t.rootNode);
                tclAstUtils.getFoldingRanges(t.rootNode);
            } finally {
                t.delete();
            }
        }, Math.max(3, Math.floor(ITERATIONS / 2)));
        entry.fullPipeline = fullResult.ms;
        console.log(`    FULL PIPELINE:   avg=${fullResult.ms.avg}ms  median=${fullResult.ms.median}ms`);

        if (tree) tree.delete();
        results.tclWasm[`synth_${lineCount}`] = { lines: lineCount, procs: procCount, ...entry };
    }

    // 4f. buildScopeMap 缩放测试 — 验证 O(n²)
    console.log('\n  ── buildScopeMap 缩放测试 (O(n²) 验证) ──');
    const scalingResults = {};
    for (const lineCount of [50, 100, 200, 500, 1000]) {
        const procCount = Math.floor(lineCount / 20);
        const text = generateTclCode(lineCount, procCount);
        const tree = tclParse(text);
        const result = bench(`buildScopeMap(${lineCount}L/${procCount}P)`, () => {
            tclAstUtils.buildScopeMap(tree.rootNode);
        }, Math.max(3, Math.floor(ITERATIONS / 2)));
        scalingResults[lineCount] = { lines: lineCount, procs: procCount, ms: result.ms };
        console.log(`    ${lineCount} lines / ${procCount} procs: avg=${result.ms.avg}ms  median=${result.ms.median}ms`);
        tree.delete();
    }

    // 计算缩放因子
    const sizes = Object.keys(scalingResults).map(Number).sort((a, b) => a - b);
    if (sizes.length >= 2) {
        console.log('\n  缩放因子分析:');
        for (let i = 1; i < sizes.length; i++) {
            const prev = scalingResults[sizes[i - 1]];
            const curr = scalingResults[sizes[i]];
            const sizeRatio = curr.lines / prev.lines;
            const timeRatio = curr.ms.avg / prev.ms.avg;
            const exponent = Math.log2(timeRatio) / Math.log2(sizeRatio);
            console.log(`    ${prev.lines}→${curr.lines}: size×${sizeRatio.toFixed(1)}, time×${timeRatio.toFixed(1)}, ~O(n^${exponent.toFixed(2)})`);
        }
    }

    results.tclWasm.buildScopeMapScaling = scalingResults;
}

// ════════════════════════════════════════════════════
// 5. Scheme 管线缩放测试
// ════════════════════════════════════════════════════
console.log('\n━━ 5. Scheme 缩放测试 ━━━━━━━━━━━━━━━━━━━━━');

results.schemeScaling = {};

for (const lineCount of [100, 500, 1000, 2000, 4000]) {
    const text = generateSchemeCode(lineCount);
    const midLine = Math.floor(lineCount / 2);

    const parseResult = bench(`parse(${lineCount})`, () => {
        schemeParser.parse(text);
    }, ITERATIONS);

    const fullResult = bench(`full pipeline(${lineCount})`, () => {
        const r = schemeParser.parse(text);
        const a = schemeAnalyzer.analyze(r.ast, text);
        const st = scopeAnalyzer.buildScopeTree(r.ast);
        scopeAnalyzer.getVisibleDefinitions(st, midLine);
    }, ITERATIONS);

    results.schemeScaling[lineCount] = {
        lines: lineCount,
        parse: parseResult.ms,
        fullPipeline: fullResult.ms,
    };
    console.log(`  ${lineCount} lines: parse=${parseResult.ms.avg}ms, full=${fullResult.ms.avg}ms`);
}

// 缩放因子
const schemeSizes = Object.keys(results.schemeScaling).map(Number).sort((a, b) => a - b);
if (schemeSizes.length >= 2) {
    console.log('\n  缩放因子分析:');
    for (let i = 1; i < schemeSizes.length; i++) {
        const prev = results.schemeScaling[schemeSizes[i - 1]];
        const curr = results.schemeScaling[schemeSizes[i]];
        const sizeRatio = curr.lines / prev.lines;
        const timeRatio = curr.fullPipeline.avg / prev.fullPipeline.avg;
        const exponent = Math.log2(timeRatio) / Math.log2(sizeRatio);
        console.log(`    ${prev.lines}→${curr.lines}: size×${sizeRatio.toFixed(1)}, time×${timeRatio.toFixed(1)}, ~O(n^${exponent.toFixed(2)})`);
    }
}

// ════════════════════════════════════════════════════
// 6. 内存快照
// ════════════════════════════════════════════════════
console.log('\n━━ 6. 内存使用 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const mem = process.memoryUsage();
results.memory = {
    rssMB: parseFloat((mem.rss / 1024 / 1024).toFixed(1)),
    heapUsedMB: parseFloat((mem.heapUsed / 1024 / 1024).toFixed(1)),
    heapTotalMB: parseFloat((mem.heapTotal / 1024 / 1024).toFixed(1)),
    externalMB: parseFloat((mem.external / 1024 / 1024).toFixed(1)),
};
console.log(`  RSS: ${results.memory.rssMB}MB`);
console.log(`  Heap Used: ${results.memory.heapUsedMB}MB`);
console.log(`  Heap Total: ${results.memory.heapTotalMB}MB`);
console.log(`  External: ${results.memory.externalMB}MB`);

// ════════════════════════════════════════════════════
// 输出结果
// ════════════════════════════════════════════════════
results.meta = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    iterations: ITERATIONS,
    warmup: WARMUP,
};

// 运行 WASM 异步测试后输出
(async () => {
    // 等待 WASM 初始化
    await new Promise(resolve => setTimeout(resolve, 2000));
    await runAsyncBenchmarks();

    // 最终内存快照
    const memFinal = process.memoryUsage();
    results.memoryFinal = {
        rssMB: parseFloat((memFinal.rss / 1024 / 1024).toFixed(1)),
        heapUsedMB: parseFloat((memFinal.heapUsed / 1024 / 1024).toFixed(1)),
    };
    console.log(`\n  最终内存: RSS=${results.memoryFinal.rssMB}MB, Heap=${results.memoryFinal.heapUsedMB}MB`);

    console.log('\n' + '='.repeat(70));
    console.log('基准测试完成');
    console.log('='.repeat(70));

    // 保存 JSON
    if (JSON_OUTPUT) {
        const outPath = path.resolve(JSON_OUTPUT);
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`\n结果已保存到: ${outPath}`);
    } else {
        // 默认保存到 benchmarks/ 目录
        const benchDir = path.join(PROJECT_ROOT, 'benchmarks');
        if (!fs.existsSync(benchDir)) fs.mkdirSync(benchDir, { recursive: true });
        const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const defaultPath = path.join(benchDir, `benchmark-${dateStr}.json`);
        fs.writeFileSync(defaultPath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`\n结果已保存到: ${defaultPath}`);
    }

    // 打印对比摘要
    console.log('\n━━ 性能摘要（用于前后对比） ━━━━━━━━━━━━━━━━━');
    console.log('  ┌─────────────────────────────────────────────────────────────┐');
    console.log('  │ 指标                          │ 当前基线 (ms)              │');
    console.log('  ├─────────────────────────────────────────────────────────────┤');

    const summaryEntries = [];
    if (results.scheme.synth_1000) {
        summaryEntries.push(['Scheme parse (1000L)', results.scheme.synth_1000.parse.avg]);
        summaryEntries.push(['Scheme full pipeline (1000L)', results.scheme.synth_1000.fullPipeline.avg]);
        summaryEntries.push(['Scheme 5x redundant (1000L)', results.scheme.synth_1000.redundantParse5x.avg]);
    }
    if (results.tclWasm.synth_1000?.buildScopeMap) {
        summaryEntries.push(['Tcl buildScopeMap (1000L/50P)', results.tclWasm.synth_1000.buildScopeMap.avg]);
    }
    summaryEntries.push(['JSON loading total', totalJsonTime]);

    for (const [label, value] of summaryEntries) {
        const val = typeof value === 'number' ? value.toFixed(2) : 'N/A';
        console.log(`  │ ${label.padEnd(30)}│ ${String(val).padStart(10)} ms              │`);
    }
    console.log('  └─────────────────────────────────────────────────────────────┘');
})();
