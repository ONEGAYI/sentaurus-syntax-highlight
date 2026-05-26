// src/lsp/sdevicepar/par-completion.js
'use strict';

const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY } = require('./par-constants');

/**
 * 按 (label, parentPath) 聚合 symbols，每组保留 SOURCE_PRIORITY 最高（数字最小）的 symbol。
 * 先聚合去重，再排序输出。
 * @param {object[]} symbols - 待过滤的 symbols
 * @param {string} kind - 过滤 kind
 * @param {string} parentPath - 过滤 parentPath
 * @returns {object[]} 去重后的 candidates（已按 source 优先级 + 名称排序）
 */
function dedupeByPriority(symbols, kind, parentPath) {
    // 1. 收集匹配 symbols
    const matched = symbols.filter(s => s.kind === kind && s.parentPath === parentPath);
    // 2. 按 (name, parentPath) 聚合，保留每组最高优先级
    const best = new Map(); // key: name → symbol with lowest priority number
    for (const sym of matched) {
        const key = sym.name;
        const existing = best.get(key);
        const newPri = SOURCE_PRIORITY[sym.source] ?? 9;
        if (!existing || newPri < (SOURCE_PRIORITY[existing.source] ?? 9)) {
            best.set(key, sym);
        }
    }
    // 3. 排序：source 优先级升序，名称字母序
    const candidates = Array.from(best.values());
    candidates.sort((a, b) => {
        const pa = SOURCE_PRIORITY[a.source] ?? 9;
        const pb = SOURCE_PRIORITY[b.source] ?? 9;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
    });
    return candidates;
}

/**
 * 根据上下文和 symbols 构建补全列表。
 * 纯函数，无 VS Code 依赖，可在 Node.js 中测试。
 *
 * @param {{ completableKind: string, parentPath: string, scopeType: string|null, pendingBlockName: string|null }} ctx
 * @param {object[]} symbols - 所有可用 symbols（当前文件 + include）
 * @returns {Array<{label: string, kind: string, detail: string, sortText: string, insertText: string, source: string, parentPath: string}>}
 */
function buildParCompletions(ctx, symbols) {
    if (!ctx || !ctx.completableKind) return [];
    if (ctx.completableKind === 'blockPending') return []; // Phase 2.1: 不补全 pending block

    const items = [];

    if (ctx.completableKind === 'scopeType') {
        let idx = 0;
        for (const st of SCOPE_TYPES_ARRAY) {
            items.push({
                label: st,
                kind: 'scopeType',
                detail: '[par] scope type',
                sortText: `4_${idx}_${st}`,
                insertText: st + ' = "${1:name}" {\n\t${0}\n}',
                source: 'builtin',
                parentPath: '',
            });
            idx++;
        }
    } else if (ctx.completableKind === 'block') {
        const candidates = dedupeByPriority(symbols, 'block', ctx.parentPath);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'block',
                detail: `[par] block (${ctx.scopeType || 'scope'})`,
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: sym.name + ' {\n\t${0}\n}',
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'parameter') {
        const candidates = dedupeByPriority(symbols, 'parameter', ctx.parentPath);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'parameter',
                detail: sym.value ? `[par] = ${sym.value}` : '[par] parameter',
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: `${sym.name} = `,
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'scopeName') {
        // Collect scope names across ALL parentPaths, dedupe by name with source priority
        const scopes = symbols.filter(s => s.kind === 'scope' && s.scopeType === ctx.scopeType);
        const seen = new Map();
        for (const sym of scopes) {
            const existing = seen.get(sym.name);
            const newPri = SOURCE_PRIORITY[sym.source] ?? 9;
            if (!existing || newPri < (SOURCE_PRIORITY[existing.source] ?? 9)) {
                seen.set(sym.name, sym);
            }
        }
        const filtered = Array.from(seen.values());
        filtered.sort((a, b) => {
            const pa = SOURCE_PRIORITY[a.source] ?? 9;
            const pb = SOURCE_PRIORITY[b.source] ?? 9;
            if (pa !== pb) return pa - pb;
            return a.name.localeCompare(b.name);
        });
        filtered.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'scopeName',
                detail: `[par] ${ctx.scopeType} name`,
                sortText: `${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: sym.name,
                source: sym.source || 'current',
                parentPath: '',
            });
        });
    }

    return items;
}

module.exports = { buildParCompletions, SOURCE_PRIORITY, dedupeByPriority };
