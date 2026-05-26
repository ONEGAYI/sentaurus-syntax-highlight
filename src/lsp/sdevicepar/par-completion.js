// src/lsp/sdevicepar/par-completion.js
'use strict';

const { SCOPE_TYPES_ARRAY, SOURCE_PRIORITY } = require('./par-constants');

/**
 * PAR 补全 sortText 前缀。`!` (0x21) < `0` (0x30)，确保 PAR 上下文项
 * 始终排在 all_keywords fallback（SORT_PREFIX `0`/`1`/`2`）之前。
 */
const PAR_SORT_PREFIX = '!';

/**
 * 对预过滤后的 symbols 数组按 name 去重（保留 SOURCE_PRIORITY 最高即数字最小的），
 * 再按 source 优先级升序 + 名称字母序排序。
 * @param {object[]} symbols - 已过滤的 symbols（调用方负责 kind/parentPath 等过滤）
 * @returns {object[]} 去重排序后的 candidates
 */
function dedupeAndSort(symbols) {
    const best = new Map();
    for (const sym of symbols) {
        const existing = best.get(sym.name);
        const newPri = SOURCE_PRIORITY[sym.source] ?? 9;
        if (!existing || newPri < (SOURCE_PRIORITY[existing.source] ?? 9)) {
            best.set(sym.name, sym);
        }
    }
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
 * 按 (label, parentPath) 聚合 symbols，每组保留 SOURCE_PRIORITY 最高（数字最小）的 symbol。
 * 先聚合去重，再排序输出。
 * @param {object[]} symbols - 待过滤的 symbols
 * @param {string} kind - 过滤 kind
 * @param {string} parentPath - 过滤 parentPath
 * @returns {object[]} 去重后的 candidates（已按 source 优先级 + 名称排序）
 */
function dedupeByPriority(symbols, kind, parentPath) {
    const matched = symbols.filter(s => s.kind === kind && s.parentPath === parentPath);
    return dedupeAndSort(matched);
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
                sortText: `${PAR_SORT_PREFIX}4_${idx}_${st}`,
                insertText: st + ' = "${1:name}" {\n\t${0}\n}',
                source: 'builtin',
                parentPath: '',
            });
            idx++;
        }
    } else if (ctx.completableKind === 'block') {
        // 按 scopeType 聚合，忽略具体 scopeName：Material/Silicon 的 block 也适用于 Material/Oxide
        const scopeType = ctx.scopeType;
        const blocks = scopeType
            ? symbols.filter(s => {
                if (s.kind !== 'block') return false;
                const parts = s.parentPath.split('/');
                return parts.length === 2 && parts[0] === scopeType;
            })
            : symbols.filter(s => s.kind === 'block' && s.parentPath === ctx.parentPath);
        const candidates = dedupeAndSort(blocks);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'block',
                detail: `[par] block (${scopeType || 'scope'})`,
                sortText: `${PAR_SORT_PREFIX}${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: sym.name + ' {\n\t${0}\n}',
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'parameter') {
        // 按 scopeType + blockName 聚合，忽略 scopeName：Material/Si/Bandgap 的参数也适用于 Material/Oxide/Bandgap
        const scopeType = ctx.scopeType;
        const pathParts = ctx.parentPath.split('/');
        const blockName = pathParts.length >= 3 ? pathParts[pathParts.length - 1] : null;
        const params = (scopeType && blockName)
            ? symbols.filter(s => {
                if (s.kind !== 'parameter') return false;
                const parts = s.parentPath.split('/');
                return parts.length === 3 && parts[0] === scopeType && parts[2] === blockName;
            })
            : symbols.filter(s => s.kind === 'parameter' && s.parentPath === ctx.parentPath);
        const candidates = dedupeAndSort(params);
        candidates.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'parameter',
                detail: sym.value ? `[par] = ${sym.value}` : '[par] parameter',
                sortText: `${PAR_SORT_PREFIX}${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: `${sym.name} = `,
                source: sym.source || 'current',
                parentPath: ctx.parentPath,
            });
        });
    } else if (ctx.completableKind === 'scopeName') {
        // Collect scope names across ALL parentPaths, dedupe by name with source priority
        const scopes = symbols.filter(s => s.kind === 'scope' && s.scopeType === ctx.scopeType);
        const filtered = dedupeAndSort(scopes);
        filtered.forEach((sym, idx) => {
            items.push({
                label: sym.name,
                kind: 'scopeName',
                detail: `[par] ${ctx.scopeType} name`,
                sortText: `${PAR_SORT_PREFIX}${SOURCE_PRIORITY[sym.source] ?? 9}_${idx}_${sym.name}`,
                insertText: sym.name,
                source: sym.source || 'current',
                parentPath: '',
            });
        });
    }

    return items;
}

module.exports = { buildParCompletions, SOURCE_PRIORITY, dedupeByPriority, dedupeAndSort };
