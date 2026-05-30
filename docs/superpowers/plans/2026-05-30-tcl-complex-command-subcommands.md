# Tcl Complex Command Subcommands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全 GitHub Issue #10 中 Tcl 复杂命令体系的高亮、补全和双语 Hover 文档，覆盖 `namespace/dict/clock/binary/encoding/package/chan` 等命令族，并补齐相关顶层 Tcl 命令。

**Architecture:** 先建立一个共享的 Tcl 子命令 registry，作为 JS Provider、TextMate 语法同步脚本和测试的单一事实源；子命令文档由并行子代理分批产出到 `build/tcl-subcommand-docs/*.json` 临时片段，再由合并脚本校验、排序并写入 `syntaxes/tcl_subcommand_docs*.json`。TextMate 语法通过脚本从 registry 生成上下文子命令正则，避免 5 个语法文件手工漂移。

**Tech Stack:** 纯 CommonJS、VSCode Extension API、TextMate JSON、Node.js assert 测试、Tcl 8.6 官方手册

---

## 背景与范围

Issue: https://github.com/ONEGAYI/sentaurus-syntax-highlight/issues/10

官方参考：

- Tcl 8.6 `namespace`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/namespace.htm
- Tcl 8.6 `dict`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/dict.htm
- Tcl 8.6 `clock`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/clock.htm
- Tcl 8.6 `binary`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/binary.htm
- Tcl 8.6 `encoding`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/encoding.htm
- Tcl 8.6 `package`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/package.htm
- Tcl 8.6 `chan`: https://www.tcl-lang.org/man/tcl8.6/TclCmd/chan.htm
- Tcl 8.6 command index: https://www.tcl-lang.org/man/tcl8.6/TclCmd/contents.htm

现状：

- 已有 `syntaxes/tcl_subcommand_docs.{json,zh-CN.json}`，覆盖 `string/file/info/array/dict` 共 83 个子命令。
- `dict` 当前只有 17 个子命令，缺 `append/incr/lappend`。
- `src/register-completion-providers.js` 中 `TCL_SUBCMD_COMPLETION_RE` / `TCL_SUBCMD_HOVER_RE` 仍硬编码为 `string|file|info|array|dict`。
- 5 个 Tcl TextMate 语法文件都手写了同一批子命令正则，`sdevicepar` 是 PAR 参数文件语法，不纳入 TextMate 子命令正则同步。
- Issue 表中 `package` 写 9 个子命令，但 Tcl 8.6 官方页列出 `forget/ifneeded/names/present/provide/require/unknown/vcompare/versions/vsatisfies/prefer` 共 11 个；本计划以官方 Tcl 8.6 为准，包含 `prefer`。
- Issue 的 I/O 进阶列表中 `fcopy` 重复一次；本计划将第 9 个 I/O 相关操作解释为已存在的 `flush`，只新增当前缺失的 8 个顶层文档：`fconfigure/fblocked/eof/tell/seek/fileevent/socket/fcopy`。

目标范围：

- 子命令文档最终数量：`string:23, file:22, info:14, array:7, dict:20, namespace:19, clock:7, binary:4, encoding:5, package:11, chan:20`，合计 **152**。
- 新增顶层 Tcl 命令文档：`namespace, dict, clock, binary, encoding, package, chan, fconfigure, fblocked, eof, tell, seek, fileevent, socket, fcopy, apply, coroutine, yield, yieldto, tailcall, history, parray, pid, interp, trace, bgerror`，合计 **26**。
- 对 `sdevice/sprocess/emw/inspect/svisual` 同步 `all_keywords.json` 的 `FUNCTION` 与 `SUBCOMMAND`；`sdevicepar` 保持 PAR 语法关键词，不增加 TextMate 子命令高亮。

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lsp/tcl-subcommand-registry.js` | 新建 | Tcl 子命令单一事实源，提供 parent/subcommand 清单与上下文匹配函数 |
| `scripts/docs/merge-tcl-subcommand-docs.js` | 新建 | 合并并校验并行子代理产出的临时子命令文档 JSON，唯一负责写入交付 JSON |
| `scripts/syntax/sync-tcl-subcommands.js` | 新建 | 从 registry 同步 5 个 Tcl TextMate 语法文件的子命令正则 |
| `tests/test-tcl-complex-subcommands.js` | 新建 | 覆盖 registry、文档 JSON、all_keywords、TextMate 正则、Provider 去硬编码 |
| `build/tcl-subcommand-docs/*.json` | 临时 | 子代理分批产出的英文/中文片段；`build/` 已被 gitignore，不提交 |
| `syntaxes/tcl_subcommand_docs.json` | 修改 | 扩展英文 Tcl 子命令文档至 11 个命令族 / 152 子命令 |
| `syntaxes/tcl_subcommand_docs.zh-CN.json` | 修改 | 扩展中文 Tcl 子命令文档至 11 个命令族 / 152 子命令 |
| `syntaxes/tcl_command_docs.json` | 修改 | 新增 26 个顶层 Tcl 命令英文文档 |
| `syntaxes/tcl_command_docs.zh-CN.json` | 修改 | 新增 26 个顶层 Tcl 命令中文文档 |
| `syntaxes/all_keywords.json` | 修改 | 5 个 Tcl 工具同步 `FUNCTION` 和 `SUBCOMMAND` 候选词 |
| `syntaxes/{sdevice,sprocess,emw,inspect,svisual}.tmLanguage.json` | 修改 | 由同步脚本更新子命令上下文高亮正则 |
| `src/register-completion-providers.js` | 修改 | 用 registry 替换硬编码子命令正则，补全/悬停支持所有命令族 |
| `src/docs-loader.js` | 修改 | 为 `SUBCOMMAND` 增加 CompletionItemKind、sort 和 detail 映射 |
| `docs/scope-color-reference.md` | 修改 | 更新 `support.type.tcl-subcommand` 描述和数量 |
| `AGENTS.md` | 修改 | 更新文件树与架构说明中的 Tcl 子命令数量 |
| `docs/file-trees/tests.md` | 修改 | 增加新测试文件说明 |

---

## 目标清单

```javascript
const TARGET_SUBCOMMANDS = {
  string: ['length', 'match', 'range', 'first', 'last', 'index', 'trim', 'trimleft', 'trimright', 'tolower', 'toupper', 'totitle', 'equal', 'compare', 'is', 'map', 'repeat', 'replace', 'reverse', 'cat', 'wordstart', 'wordend', 'bytelength'],
  file: ['join', 'dirname', 'tail', 'extension', 'rootname', 'exists', 'isfile', 'isdirectory', 'mkdir', 'copy', 'delete', 'rename', 'nativename', 'normalize', 'stat', 'size', 'readable', 'writable', 'executable', 'mtime', 'atime', 'type'],
  info: ['exists', 'commands', 'procs', 'args', 'body', 'level', 'script', 'hostname', 'patchlevel', 'tclversion', 'globals', 'locals', 'vars', 'default'],
  array: ['exists', 'get', 'set', 'names', 'size', 'unset', 'statistics'],
  dict: ['append', 'create', 'exists', 'filter', 'for', 'get', 'incr', 'info', 'keys', 'lappend', 'map', 'merge', 'remove', 'replace', 'set', 'size', 'unset', 'update', 'values', 'with'],
  namespace: ['children', 'code', 'current', 'delete', 'ensemble', 'eval', 'exists', 'export', 'forget', 'import', 'inscope', 'origin', 'parent', 'path', 'qualifiers', 'tail', 'upvar', 'unknown', 'which'],
  clock: ['add', 'clicks', 'format', 'microseconds', 'milliseconds', 'scan', 'seconds'],
  binary: ['decode', 'encode', 'format', 'scan'],
  encoding: ['convertfrom', 'convertto', 'dirs', 'names', 'system'],
  package: ['forget', 'ifneeded', 'names', 'present', 'provide', 'require', 'unknown', 'vcompare', 'versions', 'vsatisfies', 'prefer'],
  chan: ['blocked', 'close', 'configure', 'copy', 'create', 'eof', 'event', 'flush', 'gets', 'names', 'pending', 'pipe', 'pop', 'postevent', 'push', 'puts', 'read', 'seek', 'tell', 'truncate'],
};

const TARGET_TOP_LEVEL_COMMANDS = [
  'namespace', 'dict', 'clock', 'binary', 'encoding', 'package', 'chan',
  'fconfigure', 'fblocked', 'eof', 'tell', 'seek', 'fileevent', 'socket', 'fcopy',
  'apply', 'coroutine', 'yield', 'yieldto', 'tailcall',
  'history', 'parray', 'pid', 'interp', 'trace', 'bgerror',
];

const TCL_GRAMMAR_LANGS = ['sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];
```

---

## 子命令文档分批与临时产物

152 个 Tcl 子命令按父命令族拆成 6 个可并行批次。每个子代理只写 `build/tcl-subcommand-docs/` 下的临时 JSON 片段，不直接修改 `syntaxes/tcl_subcommand_docs*.json`，也不提交临时文件。主流程只运行 `scripts/docs/merge-tcl-subcommand-docs.js`；该脚本负责校验覆盖范围、字段完整性、重复 key、英文/中文结构一致性，并按 registry 顺序写入最终交付 JSON。

| 批次 | 父命令 | 数量 | 临时文件 |
|------|--------|------|----------|
| 01 | `string` | 23 | `build/tcl-subcommand-docs/01-string.en.json`, `build/tcl-subcommand-docs/01-string.zh-CN.json` |
| 02 | `file` | 22 | `build/tcl-subcommand-docs/02-file.en.json`, `build/tcl-subcommand-docs/02-file.zh-CN.json` |
| 03 | `info`, `array`, `dict` | 41 | `build/tcl-subcommand-docs/03-info-array-dict.en.json`, `build/tcl-subcommand-docs/03-info-array-dict.zh-CN.json` |
| 04 | `namespace` | 19 | `build/tcl-subcommand-docs/04-namespace.en.json`, `build/tcl-subcommand-docs/04-namespace.zh-CN.json` |
| 05 | `clock`, `binary`, `encoding`, `package` | 27 | `build/tcl-subcommand-docs/05-time-binary-encoding-package.en.json`, `build/tcl-subcommand-docs/05-time-binary-encoding-package.zh-CN.json` |
| 06 | `chan` | 20 | `build/tcl-subcommand-docs/06-chan.en.json`, `build/tcl-subcommand-docs/06-chan.zh-CN.json` |

子代理统一约束：

- 每个临时 JSON 顶层结构必须是 `parentCommand -> subcommand -> { signature, description, example }`。
- 只产出自己批次内的父命令，不写其他父命令，不改 tracked 文件。
- 英文和中文文件 key 完全一致；`signature` 与 `example` 中 Tcl 代码保持原样。
- `description` 中文遵守 `docs/glossary.json` 和 `docs/prompts/i18n/tcl_subcommand_docs.prompt.md`。
- 若批次包含已有文档条目，优先复用现有内容并按 Tcl 8.6 官方手册校对；若发现官方语义不一致，在返回摘要中列明。

---

### Task 1: 写覆盖测试，锁定目标行为

**Files:**

- Create: `tests/test-tcl-complex-subcommands.js`

- [ ] **Step 1: 创建失败测试**

创建 `tests/test-tcl-complex-subcommands.js`：

```javascript
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, summary } = require('./helpers/test-runner');

const root = path.join(__dirname, '..');
const TARGET_SUBCOMMANDS = {
    string: ['length', 'match', 'range', 'first', 'last', 'index', 'trim', 'trimleft', 'trimright', 'tolower', 'toupper', 'totitle', 'equal', 'compare', 'is', 'map', 'repeat', 'replace', 'reverse', 'cat', 'wordstart', 'wordend', 'bytelength'],
    file: ['join', 'dirname', 'tail', 'extension', 'rootname', 'exists', 'isfile', 'isdirectory', 'mkdir', 'copy', 'delete', 'rename', 'nativename', 'normalize', 'stat', 'size', 'readable', 'writable', 'executable', 'mtime', 'atime', 'type'],
    info: ['exists', 'commands', 'procs', 'args', 'body', 'level', 'script', 'hostname', 'patchlevel', 'tclversion', 'globals', 'locals', 'vars', 'default'],
    array: ['exists', 'get', 'set', 'names', 'size', 'unset', 'statistics'],
    dict: ['append', 'create', 'exists', 'filter', 'for', 'get', 'incr', 'info', 'keys', 'lappend', 'map', 'merge', 'remove', 'replace', 'set', 'size', 'unset', 'update', 'values', 'with'],
    namespace: ['children', 'code', 'current', 'delete', 'ensemble', 'eval', 'exists', 'export', 'forget', 'import', 'inscope', 'origin', 'parent', 'path', 'qualifiers', 'tail', 'upvar', 'unknown', 'which'],
    clock: ['add', 'clicks', 'format', 'microseconds', 'milliseconds', 'scan', 'seconds'],
    binary: ['decode', 'encode', 'format', 'scan'],
    encoding: ['convertfrom', 'convertto', 'dirs', 'names', 'system'],
    package: ['forget', 'ifneeded', 'names', 'present', 'provide', 'require', 'unknown', 'vcompare', 'versions', 'vsatisfies', 'prefer'],
    chan: ['blocked', 'close', 'configure', 'copy', 'create', 'eof', 'event', 'flush', 'gets', 'names', 'pending', 'pipe', 'pop', 'postevent', 'push', 'puts', 'read', 'seek', 'tell', 'truncate'],
};
const TARGET_TOP_LEVEL_COMMANDS = [
    'namespace', 'dict', 'clock', 'binary', 'encoding', 'package', 'chan',
    'fconfigure', 'fblocked', 'eof', 'tell', 'seek', 'fileevent', 'socket', 'fcopy',
    'apply', 'coroutine', 'yield', 'yieldto', 'tailcall',
    'history', 'parray', 'pid', 'interp', 'trace', 'bgerror',
];
const TCL_GRAMMAR_LANGS = ['sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];

function readJson(relPath) {
    return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function uniqueSubcommands() {
    return Array.from(new Set(Object.values(TARGET_SUBCOMMANDS).flat())).sort();
}

function findSubcommandPattern(grammar, parent) {
    return grammar.patterns.find(pattern =>
        pattern.match &&
        pattern.match.startsWith(`\\\\b(${parent})\\\\s+`) &&
        pattern.captures &&
        pattern.captures['2'] &&
        pattern.captures['2'].name === 'support.type.tcl-subcommand'
    );
}

test('registry 暴露完整 Tcl 子命令清单和上下文匹配', () => {
    const registry = require('../src/lsp/tcl-subcommand-registry');
    assert.deepStrictEqual(registry.TCL_SUBCOMMANDS, TARGET_SUBCOMMANDS);
    assert.deepStrictEqual(registry.getParentCommands(), Object.keys(TARGET_SUBCOMMANDS));
    assert.deepStrictEqual(registry.getSubcommands('dict'), TARGET_SUBCOMMANDS.dict);
    assert.deepStrictEqual(registry.matchCompletionContext('dict '), { parentCmd: 'dict' });
    assert.deepStrictEqual(registry.matchHoverContext('namespace eval'), { parentCmd: 'namespace', subcmd: 'eval' });
    assert.strictEqual(registry.matchHoverContext('notdict eval'), null);
});

test('tcl_subcommand_docs 中英文覆盖所有目标子命令且字段完整', () => {
    const en = readJson('syntaxes/tcl_subcommand_docs.json');
    const zh = readJson('syntaxes/tcl_subcommand_docs.zh-CN.json');
    for (const [parent, subcommands] of Object.entries(TARGET_SUBCOMMANDS)) {
        assert.ok(en[parent], `英文缺少父命令 ${parent}`);
        assert.ok(zh[parent], `中文缺少父命令 ${parent}`);
        assert.deepStrictEqual(Object.keys(en[parent]).sort(), subcommands.slice().sort(), `英文 ${parent} 子命令不一致`);
        assert.deepStrictEqual(Object.keys(zh[parent]).sort(), subcommands.slice().sort(), `中文 ${parent} 子命令不一致`);
        for (const subcmd of subcommands) {
            for (const [label, docs] of [['EN', en], ['ZH', zh]]) {
                const entry = docs[parent][subcmd];
                assert.ok(entry.signature, `${label} ${parent} ${subcmd} 缺 signature`);
                assert.ok(entry.description, `${label} ${parent} ${subcmd} 缺 description`);
                assert.ok(entry.example, `${label} ${parent} ${subcmd} 缺 example`);
            }
        }
    }
});

test('tcl_command_docs 中英文覆盖复杂命令父命令和相关顶层命令', () => {
    const en = readJson('syntaxes/tcl_command_docs.json');
    const zh = readJson('syntaxes/tcl_command_docs.zh-CN.json');
    for (const name of TARGET_TOP_LEVEL_COMMANDS) {
        assert.ok(en[name], `英文缺少顶层命令 ${name}`);
        assert.ok(zh[name], `中文缺少顶层命令 ${name}`);
        assert.ok(en[name].signature, `英文 ${name} 缺 signature`);
        assert.ok(zh[name].signature, `中文 ${name} 缺 signature`);
        assert.ok(en[name].description, `英文 ${name} 缺 description`);
        assert.ok(zh[name].description, `中文 ${name} 缺 description`);
    }
});

test('all_keywords 的 FUNCTION 和 SUBCOMMAND 在 5 个 Tcl 工具中同步', () => {
    const allKeywords = readJson('syntaxes/all_keywords.json');
    const subcommands = uniqueSubcommands();
    for (const lang of TCL_GRAMMAR_LANGS) {
        const module = allKeywords[lang];
        assert.ok(module, `缺少 ${lang}`);
        for (const cmd of TARGET_TOP_LEVEL_COMMANDS) {
            assert.ok(module.FUNCTION.includes(cmd), `${lang}.FUNCTION 缺 ${cmd}`);
        }
        assert.deepStrictEqual(module.SUBCOMMAND.slice().sort(), subcommands, `${lang}.SUBCOMMAND 不一致`);
    }
});

test('5 个 Tcl TextMate 语法文件由 registry 生成完整子命令正则', () => {
    for (const lang of TCL_GRAMMAR_LANGS) {
        const grammar = readJson(`syntaxes/${lang}.tmLanguage.json`);
        for (const [parent, subcommands] of Object.entries(TARGET_SUBCOMMANDS)) {
            const pattern = findSubcommandPattern(grammar, parent);
            assert.ok(pattern, `${lang} 缺 ${parent} 子命令正则`);
            for (const subcmd of subcommands) {
                assert.ok(pattern.match.includes(subcmd), `${lang} ${parent} 正则缺 ${subcmd}`);
            }
        }
    }
});

test('Completion/Hover Provider 不再硬编码旧子命令父命令列表', () => {
    const source = fs.readFileSync(path.join(root, 'src/register-completion-providers.js'), 'utf8');
    assert.ok(source.includes("require('./lsp/tcl-subcommand-registry')"));
    assert.ok(source.includes('matchCompletionContext'));
    assert.ok(source.includes('matchHoverContext'));
    assert.ok(!source.includes('string|file|info|array|dict'), '仍存在旧硬编码父命令正则');
});

summary();
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，第一项报 `Cannot find module '../src/lsp/tcl-subcommand-registry'`。

- [ ] **Step 3: Commit**

```bash
git add tests/test-tcl-complex-subcommands.js
git commit -m "test: 增加 Tcl 复杂命令体系覆盖测试

- 锁定 Issue #10 的目标子命令清单
- 验证 tcl_subcommand_docs / tcl_command_docs 中英文覆盖
- 验证 all_keywords 和 TextMate 语法同步
- 验证 Completion/Hover Provider 去除旧硬编码正则"
```

---

### Task 2: 建立 Tcl 子命令 registry

**Files:**

- Create: `src/lsp/tcl-subcommand-registry.js`

- [ ] **Step 1: 创建 registry 模块**

创建 `src/lsp/tcl-subcommand-registry.js`：

```javascript
'use strict';

const TCL_SUBCOMMANDS = Object.freeze({
    string: Object.freeze(['length', 'match', 'range', 'first', 'last', 'index', 'trim', 'trimleft', 'trimright', 'tolower', 'toupper', 'totitle', 'equal', 'compare', 'is', 'map', 'repeat', 'replace', 'reverse', 'cat', 'wordstart', 'wordend', 'bytelength']),
    file: Object.freeze(['join', 'dirname', 'tail', 'extension', 'rootname', 'exists', 'isfile', 'isdirectory', 'mkdir', 'copy', 'delete', 'rename', 'nativename', 'normalize', 'stat', 'size', 'readable', 'writable', 'executable', 'mtime', 'atime', 'type']),
    info: Object.freeze(['exists', 'commands', 'procs', 'args', 'body', 'level', 'script', 'hostname', 'patchlevel', 'tclversion', 'globals', 'locals', 'vars', 'default']),
    array: Object.freeze(['exists', 'get', 'set', 'names', 'size', 'unset', 'statistics']),
    dict: Object.freeze(['append', 'create', 'exists', 'filter', 'for', 'get', 'incr', 'info', 'keys', 'lappend', 'map', 'merge', 'remove', 'replace', 'set', 'size', 'unset', 'update', 'values', 'with']),
    namespace: Object.freeze(['children', 'code', 'current', 'delete', 'ensemble', 'eval', 'exists', 'export', 'forget', 'import', 'inscope', 'origin', 'parent', 'path', 'qualifiers', 'tail', 'upvar', 'unknown', 'which']),
    clock: Object.freeze(['add', 'clicks', 'format', 'microseconds', 'milliseconds', 'scan', 'seconds']),
    binary: Object.freeze(['decode', 'encode', 'format', 'scan']),
    encoding: Object.freeze(['convertfrom', 'convertto', 'dirs', 'names', 'system']),
    package: Object.freeze(['forget', 'ifneeded', 'names', 'present', 'provide', 'require', 'unknown', 'vcompare', 'versions', 'vsatisfies', 'prefer']),
    chan: Object.freeze(['blocked', 'close', 'configure', 'copy', 'create', 'eof', 'event', 'flush', 'gets', 'names', 'pending', 'pipe', 'pop', 'postevent', 'push', 'puts', 'read', 'seek', 'tell', 'truncate']),
});

const PARENT_COMMANDS = Object.freeze(Object.keys(TCL_SUBCOMMANDS));
const PARENT_PATTERN = PARENT_COMMANDS.join('|');
const COMPLETION_RE = new RegExp(`\\b(${PARENT_PATTERN})\\s+$`);
const HOVER_RE = new RegExp(`\\b(${PARENT_PATTERN})\\s+(\\w+)$`);

function getParentCommands() {
    return PARENT_COMMANDS.slice();
}

function getSubcommands(parentCmd) {
    return TCL_SUBCOMMANDS[parentCmd] ? TCL_SUBCOMMANDS[parentCmd].slice() : [];
}

function getUniqueSubcommands() {
    return Array.from(new Set(Object.values(TCL_SUBCOMMANDS).flat())).sort();
}

function matchCompletionContext(linePrefix) {
    const match = COMPLETION_RE.exec(linePrefix);
    return match ? { parentCmd: match[1] } : null;
}

function matchHoverContext(linePrefix) {
    const match = HOVER_RE.exec(linePrefix);
    if (!match) return null;
    const parentCmd = match[1];
    const subcmd = match[2];
    if (!TCL_SUBCOMMANDS[parentCmd] || !TCL_SUBCOMMANDS[parentCmd].includes(subcmd)) return null;
    return { parentCmd, subcmd };
}

function buildTextMatePattern(parentCmd, scopeName) {
    const subcommands = TCL_SUBCOMMANDS[parentCmd];
    if (!subcommands) throw new Error(`Unknown Tcl parent command: ${parentCmd}`);
    return {
        match: `\\\\b(${parentCmd})\\\\s+(${subcommands.join('|')})\\\\b`,
        captures: {
            1: { name: scopeName },
            2: { name: 'support.type.tcl-subcommand' },
        },
    };
}

module.exports = {
    TCL_SUBCOMMANDS,
    getParentCommands,
    getSubcommands,
    getUniqueSubcommands,
    matchCompletionContext,
    matchHoverContext,
    buildTextMatePattern,
};
```

- [ ] **Step 2: 运行测试确认进入下一处失败**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，registry 测试通过，随后报 `tcl_subcommand_docs` 缺少 `dict append` 或 `namespace`。

- [ ] **Step 3: Commit**

```bash
git add src/lsp/tcl-subcommand-registry.js
git commit -m "feat: 建立 Tcl 子命令 registry

- 提供 11 个 Tcl 命令族的目标子命令清单
- 提供补全/悬停上下文匹配函数
- 提供 TextMate 子命令正则生成函数"
```

---

### Task 3: 分批产出并脚本合并子命令中英文文档

**Files:**

- Create: `scripts/docs/merge-tcl-subcommand-docs.js`
- Create temporary ignored files: `build/tcl-subcommand-docs/*.json`
- Modify: `syntaxes/tcl_subcommand_docs.json`
- Modify: `syntaxes/tcl_subcommand_docs.zh-CN.json`

- [ ] **Step 1: 创建子命令文档合并脚本**

创建 `scripts/docs/merge-tcl-subcommand-docs.js`：

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const { TCL_SUBCOMMANDS } = require('../../src/lsp/tcl-subcommand-registry');

const root = path.join(__dirname, '..', '..');
const tempDir = path.join(root, 'build', 'tcl-subcommand-docs');
const outputs = {
    en: path.join(root, 'syntaxes', 'tcl_subcommand_docs.json'),
    zh: path.join(root, 'syntaxes', 'tcl_subcommand_docs.zh-CN.json'),
};
const suffixes = {
    en: '.en.json',
    zh: '.zh-CN.json',
};
const requiredFields = ['signature', 'description', 'example'];
const allowedFields = new Set(requiredFields);

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fail(message) {
    throw new Error(message);
}

function validateEntry(locale, fileName, parent, subcmd, entry) {
    if (!isPlainObject(entry)) {
        fail(`${locale} ${fileName}: ${parent} ${subcmd} must be an object`);
    }

    for (const field of Object.keys(entry)) {
        if (!allowedFields.has(field)) {
            fail(`${locale} ${fileName}: ${parent} ${subcmd} has unsupported field ${field}`);
        }
    }

    for (const field of requiredFields) {
        if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
            fail(`${locale} ${fileName}: ${parent} ${subcmd} missing non-empty ${field}`);
        }
    }
}

function mergeLocale(locale) {
    if (!fs.existsSync(tempDir)) {
        fail(`Missing temp directory: ${tempDir}`);
    }

    const suffix = suffixes[locale];
    const files = fs.readdirSync(tempDir)
        .filter(fileName => fileName.endsWith(suffix))
        .sort();
    if (files.length === 0) {
        fail(`No ${locale} fragments found in ${tempDir}`);
    }

    const merged = {};
    const sourceByKey = new Map();

    for (const fileName of files) {
        const data = readJson(path.join(tempDir, fileName));
        if (!isPlainObject(data)) {
            fail(`${locale} ${fileName}: fragment root must be an object`);
        }

        for (const [parent, subcommands] of Object.entries(data)) {
            if (!Object.prototype.hasOwnProperty.call(TCL_SUBCOMMANDS, parent)) {
                fail(`${locale} ${fileName}: unexpected parent command ${parent}`);
            }
            if (!isPlainObject(subcommands)) {
                fail(`${locale} ${fileName}: ${parent} must be an object`);
            }

            merged[parent] = merged[parent] || {};
            for (const [subcmd, entry] of Object.entries(subcommands)) {
                if (!TCL_SUBCOMMANDS[parent].includes(subcmd)) {
                    fail(`${locale} ${fileName}: unexpected subcommand ${parent} ${subcmd}`);
                }
                validateEntry(locale, fileName, parent, subcmd, entry);

                const key = `${parent}.${subcmd}`;
                if (sourceByKey.has(key)) {
                    fail(`${locale}: duplicate ${key} in ${sourceByKey.get(key)} and ${fileName}`);
                }
                sourceByKey.set(key, fileName);
                merged[parent][subcmd] = entry;
            }
        }
    }

    const ordered = {};
    for (const [parent, subcommands] of Object.entries(TCL_SUBCOMMANDS)) {
        if (!merged[parent]) {
            fail(`${locale}: missing parent command ${parent}`);
        }
        ordered[parent] = {};
        for (const subcmd of subcommands) {
            if (!merged[parent][subcmd]) {
                fail(`${locale}: missing subcommand ${parent} ${subcmd}`);
            }
            ordered[parent][subcmd] = merged[parent][subcmd];
        }
    }

    return ordered;
}

function compareStructures(enDocs, zhDocs) {
    const enParents = Object.keys(enDocs);
    const zhParents = Object.keys(zhDocs);
    if (JSON.stringify(enParents) !== JSON.stringify(zhParents)) {
        fail('English and Chinese parent command order differs');
    }

    for (const parent of enParents) {
        const enSubcommands = Object.keys(enDocs[parent]);
        const zhSubcommands = Object.keys(zhDocs[parent]);
        if (JSON.stringify(enSubcommands) !== JSON.stringify(zhSubcommands)) {
            fail(`English and Chinese subcommand order differs for ${parent}`);
        }
    }
}

function countDocs(docs) {
    return Object.values(docs).reduce((total, subcommands) => total + Object.keys(subcommands).length, 0);
}

function main() {
    const shouldWrite = process.argv.includes('--write');
    const enDocs = mergeLocale('en');
    const zhDocs = mergeLocale('zh');
    compareStructures(enDocs, zhDocs);

    console.log(`merge ok: ${Object.keys(enDocs).length} parent commands, ${countDocs(enDocs)} subcommands`);
    if (!shouldWrite) {
        console.log('dry run only; pass --write to update syntaxes/tcl_subcommand_docs*.json');
        return;
    }

    writeJson(outputs.en, enDocs);
    writeJson(outputs.zh, zhDocs);
    console.log(`wrote ${path.relative(root, outputs.en)}`);
    console.log(`wrote ${path.relative(root, outputs.zh)}`);
}

main();
```

- [ ] **Step 2: 创建临时产物目录**

Run:

```powershell
New-Item -ItemType Directory -Force build/tcl-subcommand-docs | Out-Null
```

Expected: 命令成功，无输出；目录位于已忽略的 `build/` 下。

- [ ] **Step 3: 并行分派 6 个子命令文档子代理**

为每个批次分派一个子代理。每个子代理只写自己的两个临时 JSON 文件，不改 `syntaxes/`、`src/`、`scripts/` 或其他 tracked 文件。

通用子代理提示词：

```markdown
你负责补全 Tcl 8.6 子命令文档的一个批次。请只修改指定的 build/tcl-subcommand-docs/*.json 临时文件，不修改 tracked 文件，不提交。

输入约束：
- 参考 docs/函数文档提取与编写规范.md 的 Tcl 子命令结构和子代理约束。
- 中文术语遵守 docs/glossary.json。
- 中文风格遵守 docs/prompts/i18n/tcl_subcommand_docs.prompt.md。
- 官方来源优先 Tcl 8.6 手册；signature 以官方语法为准。

输出结构：
- 英文文件和中文文件顶层均为 parentCommand -> subcommand -> { signature, description, example }。
- 英文和中文 key 必须完全一致。
- 每个条目只允许 signature、description、example 三个字段。
- signature 与 example 中 Tcl 代码保持原样；中文只翻译 description。

完成后返回：
- 产出的两个文件路径。
- 覆盖的父命令和子命令数量。
- 是否发现现有文档与官方手册不一致。
```

批次分派：

```text
01-string: string 23
  输出 build/tcl-subcommand-docs/01-string.en.json
  输出 build/tcl-subcommand-docs/01-string.zh-CN.json

02-file: file 22
  输出 build/tcl-subcommand-docs/02-file.en.json
  输出 build/tcl-subcommand-docs/02-file.zh-CN.json

03-info-array-dict: info 14, array 7, dict 20
  输出 build/tcl-subcommand-docs/03-info-array-dict.en.json
  输出 build/tcl-subcommand-docs/03-info-array-dict.zh-CN.json

04-namespace: namespace 19
  输出 build/tcl-subcommand-docs/04-namespace.en.json
  输出 build/tcl-subcommand-docs/04-namespace.zh-CN.json

05-time-binary-encoding-package: clock 7, binary 4, encoding 5, package 11
  输出 build/tcl-subcommand-docs/05-time-binary-encoding-package.en.json
  输出 build/tcl-subcommand-docs/05-time-binary-encoding-package.zh-CN.json

06-chan: chan 20
  输出 build/tcl-subcommand-docs/06-chan.en.json
  输出 build/tcl-subcommand-docs/06-chan.zh-CN.json
```

- [ ] **Step 4: 校验临时片段但不写交付 JSON**

Run:

```bash
node scripts/docs/merge-tcl-subcommand-docs.js
```

Expected:

```text
merge ok: 11 parent commands, 152 subcommands
dry run only; pass --write to update syntaxes/tcl_subcommand_docs*.json
```

- [ ] **Step 5: 通过合并脚本写入交付 JSON**

Run:

```bash
node scripts/docs/merge-tcl-subcommand-docs.js --write
```

Expected:

```text
merge ok: 11 parent commands, 152 subcommands
wrote syntaxes\tcl_subcommand_docs.json
wrote syntaxes\tcl_subcommand_docs.zh-CN.json
```

- [ ] **Step 6: 验证子命令文档数量**

Run:

```bash
node -e "const en=require('./syntaxes/tcl_subcommand_docs.json'); const zh=require('./syntaxes/tcl_subcommand_docs.zh-CN.json'); console.log(Object.entries(en).map(([k,v])=>k+':'+Object.keys(v).length).join(', ')); console.log(JSON.stringify(Object.keys(en).sort())===JSON.stringify(Object.keys(zh).sort()));"
```

Expected:

```text
string:23, file:22, info:14, array:7, dict:20, namespace:19, clock:7, binary:4, encoding:5, package:11, chan:20
true
```

- [ ] **Step 7: 运行覆盖测试确认文档部分通过**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，子命令文档测试通过，随后报 `tcl_command_docs` 缺少顶层命令。

- [ ] **Step 8: 确认临时片段不会被提交**

Run:

```bash
git status --short --ignored build/tcl-subcommand-docs
```

Expected: 只显示 `!! build/tcl-subcommand-docs/` 或该目录下被忽略的文件；不要 `git add` 临时片段。

- [ ] **Step 9: Commit**

```bash
git add scripts/docs/merge-tcl-subcommand-docs.js syntaxes/tcl_subcommand_docs.json syntaxes/tcl_subcommand_docs.zh-CN.json
git commit -m "feat: 扩展 Tcl 复杂命令族子命令文档

- 新增 merge-tcl-subcommand-docs.js 校验并合并子代理临时片段
- dict 补齐 append/incr/lappend
- 新增 namespace/clock/binary/encoding/package/chan 子命令文档
- 中英文文档结构保持一致
- 子命令覆盖提升到 11 个命令族共 152 条"
```

---

### Task 4: 补齐顶层 Tcl 命令中英文文档

**Files:**

- Modify: `syntaxes/tcl_command_docs.json`
- Modify: `syntaxes/tcl_command_docs.zh-CN.json`

- [ ] **Step 1: 英文文档新增 26 个顶层命令**

新增以下 key：

```text
namespace, dict, clock, binary, encoding, package, chan,
fconfigure, fblocked, eof, tell, seek, fileevent, socket, fcopy,
apply, coroutine, yield, yieldto, tailcall,
history, parray, pid, interp, trace, bgerror
```

每个条目使用现有格式：

```json
"clock": {
  "signature": "clock option ?arg arg ...?",
  "description": "Obtains and manipulates dates and times. Common subcommands include seconds, format, scan, add, milliseconds, microseconds, and clicks.",
  "parameters": [
    { "name": "option", "type": "subcommand", "desc": "Clock operation to execute." }
  ],
  "example": "clock format [clock seconds] -format \"%Y-%m-%d\""
}
```

- [ ] **Step 2: 中文文档新增对应 26 个顶层命令**

保持相同 key 和 `signature`，翻译 `description/parameters/example` 说明文字。

- [ ] **Step 3: 验证顶层命令文档**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，顶层命令文档测试通过，随后报 `all_keywords` 缺少新增命令或子命令。

- [ ] **Step 4: Commit**

```bash
git add syntaxes/tcl_command_docs.json syntaxes/tcl_command_docs.zh-CN.json
git commit -m "feat: 补齐 Tcl 复杂命令相关顶层文档

- 新增 namespace/dict/clock/binary/encoding/package/chan 父命令文档
- 新增 I/O 进阶命令、协程相关命令和杂项命令文档
- 中英文文档保持相同 key 覆盖"
```

---

### Task 5: 同步 all_keywords 并完善 SUBCOMMAND completion 类型

**Files:**

- Modify: `syntaxes/all_keywords.json`
- Modify: `src/docs-loader.js`

- [ ] **Step 1: 更新 `all_keywords.json`**

对 `sdevice/sprocess/emw/inspect/svisual`：

- 确保 `FUNCTION` 包含全部 `TARGET_TOP_LEVEL_COMMANDS`，保留已有工具专属函数。
- 将 `SUBCOMMAND` 替换为 registry 的去重子命令列表，即 `Array.from(new Set(Object.values(TARGET_SUBCOMMANDS).flat())).sort()`。
- 不修改 `sdevicepar` 的关键词类别。

- [ ] **Step 2: 为 `SUBCOMMAND` 设置 CompletionItem 映射**

在 `src/docs-loader.js` 中修改 `KIND_MAP`、`SORT_PREFIX`、`DETAIL_LABEL`：

```javascript
const KIND_MAP = {
    KEYWORD1: vscode.CompletionItemKind.Function,
    KEYWORD2: vscode.CompletionItemKind.Keyword,
    KEYWORD3: vscode.CompletionItemKind.Struct,
    KEYWORD4: vscode.CompletionItemKind.Class,
    LITERAL1: vscode.CompletionItemKind.Constant,
    LITERAL2: vscode.CompletionItemKind.Value,
    LITERAL3: vscode.CompletionItemKind.EnumMember,
    FUNCTION: vscode.CompletionItemKind.Function,
    MATHFUNC: vscode.CompletionItemKind.Function,
    SUBCOMMAND: vscode.CompletionItemKind.Method,
    MATERIAL: vscode.CompletionItemKind.Constant,
};

const SORT_PREFIX = {
    KEYWORD1: '0', KEYWORD2: '0', FUNCTION: '0', MATHFUNC: '0', SUBCOMMAND: '0',
    KEYWORD3: '1', KEYWORD4: '1',
    LITERAL1: '2', LITERAL2: '2', LITERAL3: '2',
    MATERIAL: '2',
};

const DETAIL_LABEL = {
    KEYWORD1: 'Function', KEYWORD2: 'Keyword',
    KEYWORD3: 'Tag', KEYWORD4: 'Class',
    LITERAL1: 'Constant', LITERAL2: 'Numeric Literal', LITERAL3: 'String Literal',
    FUNCTION: 'Function',
    MATHFUNC: 'Math Function',
    SUBCOMMAND: 'Tcl Subcommand',
    MATERIAL: 'Material',
};
```

- [ ] **Step 3: 运行覆盖测试确认 all_keywords 部分通过**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，`all_keywords` 测试通过，随后报 TextMate 语法缺少新增子命令正则。

- [ ] **Step 4: Commit**

```bash
git add syntaxes/all_keywords.json src/docs-loader.js
git commit -m "feat: 同步 Tcl 复杂命令补全关键词

- 5 个 Tcl 工具补齐复杂命令父命令和相关顶层命令
- SUBCOMMAND 候选词同步到 152 个子命令的去重集合
- CompletionItem 映射增加 SUBCOMMAND 类型与展示标签"
```

---

### Task 6: 用同步脚本生成 TextMate 子命令高亮

**Files:**

- Create: `scripts/syntax/sync-tcl-subcommands.js`
- Modify: `syntaxes/sdevice.tmLanguage.json`
- Modify: `syntaxes/sprocess.tmLanguage.json`
- Modify: `syntaxes/emw.tmLanguage.json`
- Modify: `syntaxes/inspect.tmLanguage.json`
- Modify: `syntaxes/svisual.tmLanguage.json`

- [ ] **Step 1: 创建同步脚本**

创建 `scripts/syntax/sync-tcl-subcommands.js`：

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const registry = require('../../src/lsp/tcl-subcommand-registry');

const root = path.join(__dirname, '..', '..');
const LANGS = ['sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];

function removeExistingSubcommandPatterns(patterns) {
    return patterns.filter(pattern =>
        !(
            pattern.captures &&
            pattern.captures['2'] &&
            pattern.captures['2'].name === 'support.type.tcl-subcommand'
        )
    );
}

function syncGrammar(lang) {
    const grammarPath = path.join(root, 'syntaxes', `${lang}.tmLanguage.json`);
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const generated = registry.getParentCommands().map(parent =>
        registry.buildTextMatePattern(parent, `support.function.${lang}`)
    );
    grammar.patterns = [
        ...generated,
        ...removeExistingSubcommandPatterns(grammar.patterns),
    ];
    fs.writeFileSync(grammarPath, JSON.stringify(grammar, null, 2) + '\n');
    console.log(`${lang}: ${generated.length} subcommand patterns`);
}

for (const lang of LANGS) {
    syncGrammar(lang);
}
```

- [ ] **Step 2: 运行同步脚本**

Run:

```bash
node scripts/syntax/sync-tcl-subcommands.js
```

Expected:

```text
sdevice: 11 subcommand patterns
sprocess: 11 subcommand patterns
emw: 11 subcommand patterns
inspect: 11 subcommand patterns
svisual: 11 subcommand patterns
```

- [ ] **Step 3: 验证 JSON 格式**

Run:

```bash
node -e "for (const f of ['sdevice','sprocess','emw','inspect','svisual']) { require('./syntaxes/'+f+'.tmLanguage.json'); } console.log('grammars ok')"
```

Expected: `grammars ok`

- [ ] **Step 4: 运行覆盖测试确认 TextMate 部分通过**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected: FAIL，TextMate 测试通过，随后报 Provider 仍硬编码旧正则。

- [ ] **Step 5: Commit**

```bash
git add scripts/syntax/sync-tcl-subcommands.js syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat: 生成 Tcl 复杂命令子命令 TextMate 高亮

- 新增 sync-tcl-subcommands.js 从 registry 同步语法
- 5 个 Tcl 工具语法文件覆盖 11 个命令族
- 子命令统一使用 support.type.tcl-subcommand scope"
```

---

### Task 7: Provider 使用 registry 替代硬编码正则

**Files:**

- Modify: `src/register-completion-providers.js`

- [ ] **Step 1: 引入 registry 并删除旧常量**

在 `src/register-completion-providers.js` 顶部加入：

```javascript
const tclSubcommands = require('./lsp/tcl-subcommand-registry');
```

删除：

```javascript
const TCL_SUBCMD_COMPLETION_RE = /\b(string|file|info|array|dict)\s+$/;
const TCL_SUBCMD_HOVER_RE = /\b(string|file|info|array|dict)\s+(\w+)$/;
```

- [ ] **Step 2: 修改子命令补全上下文判断**

将补全分支改为：

```javascript
if (langId !== 'sde') {
    const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
    const subcmdContext = tclSubcommands.matchCompletionContext(linePrefix);
    if (subcmdContext) {
        const parentCmd = subcmdContext.parentCmd;
        const subDocs = _docsCache.tclSub;
        if (subDocs && subDocs[parentCmd]) {
            return Object.entries(subDocs[parentCmd]).map(([name, doc]) => {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Method);
                item.detail = useZh ? 'Tcl 子命令' : 'Tcl Subcommand';
                item.documentation = new vscode.MarkdownString(doc.description);
                return item;
            });
        }
    }
}
```

- [ ] **Step 3: 修改 Hover 子命令判断**

将 Hover 分支改为：

```javascript
const linePrefix = document.lineAt(position.line).text.substring(0, range.end.character);
const subcmdMatch = tclSubcommands.matchHoverContext(linePrefix);
if (subcmdMatch) {
    const { parentCmd, subcmd } = subcmdMatch;
    const subDocs = _docsCache.tclSub;
    if (subDocs && subDocs[parentCmd] && subDocs[parentCmd][subcmd]) {
        const subDoc = subDocs[parentCmd][subcmd];
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${parentCmd} ${subcmd}** \`（Tcl 子命令）\`\n\n`);
        md.appendCodeblock(subDoc.signature, 'tcl');
        md.appendMarkdown(`\n\n${subDoc.description}`);
        if (subDoc.example) {
            md.appendMarkdown('\n\n**示例：**\n');
            md.appendCodeblock(subDoc.example, 'tcl');
        }
        return new vscode.Hover(md, range);
    }
}
```

- [ ] **Step 4: 运行覆盖测试确认 Provider 部分通过**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected:

```text
6 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add src/register-completion-providers.js
git commit -m "refactor: Tcl 子命令补全和悬停改用 registry

- 删除 string/file/info/array/dict 硬编码正则
- 补全上下文支持全部 11 个 Tcl 命令族
- Hover 上下文通过 registry 校验父命令和子命令"
```

---

### Task 8: 更新项目文档和文件树

**Files:**

- Modify: `docs/scope-color-reference.md`
- Modify: `AGENTS.md`
- Modify: `docs/file-trees/tests.md`

- [ ] **Step 1: 更新 scope 参考**

在 `docs/scope-color-reference.md` 的 `support.type.tcl-subcommand` 行中，将说明更新为：

```markdown
| `support.type.tcl-subcommand` | 子命令（如 `namespace eval` 的 `eval`、`dict get` 的 `get`） | 5 种 Tcl 工具 |
```

在手动添加的 Tcl 内置命令模式表中，将子命令数量说明改为：

```markdown
| `support.type.tcl-subcommand` | `string/file/info/array/dict/namespace/clock/binary/encoding/package/chan` 子命令 | 152 |
```

- [ ] **Step 2: 更新 `AGENTS.md` 文件树和架构说明**

在 `syntaxes/` 文件树中修改 `tcl_subcommand_docs` 描述：

```text
│   └── tcl_subcommand_docs.{json,zh-CN.json} ← Tcl 子命令文档（中英文双语，11 主命令 152 子命令）
```

在架构段落中修改子命令描述：

```markdown
Tcl 子命令采用 registry 驱动的单次 match+captures 模式实现上下文感知高亮，覆盖 string/file/info/array/dict/namespace/clock/binary/encoding/package/chan 11 个主命令共 152 个子命令。HoverProvider 通过 registry 判断主命令-子命令组合，查找嵌套两级文档 JSON。CompletionProvider 在主命令后第一个参数位触发子命令补全。
```

- [ ] **Step 3: 更新 `docs/file-trees/tests.md`**

在测试列表中加入：

```markdown
│   ├── test-tcl-complex-subcommands.js       ← Tcl 复杂命令族 registry/文档/语法/补全覆盖测试
```

- [ ] **Step 4: Commit**

```bash
git add docs/scope-color-reference.md AGENTS.md docs/file-trees/tests.md
git commit -m "docs: 更新 Tcl 复杂命令体系文档说明

- scope 参考更新 tcl-subcommand 覆盖范围和数量
- AGENTS.md 文件树和架构说明同步 11 个命令族
- tests 文件树增加复杂命令覆盖测试"
```

---

### Task 9: 最终验证

**Files:**

- No file changes expected

- [ ] **Step 1: 运行新增测试**

Run:

```bash
node tests/test-tcl-complex-subcommands.js
```

Expected:

```text
6 passed, 0 failed
```

- [ ] **Step 2: 运行相关既有测试**

Run:

```bash
node tests/test-sprocess-syntax-keyword-order.js
node tests/test-implicit-var-functions.js
node tests/test-tcl-ast-utils.js
node tests/test-tcl-scope-index.js
```

Expected: 每个测试文件输出 `failed` 为 0，进程退出码为 0。

- [ ] **Step 3: 重新校验子命令临时片段仍可合并**

Run:

```bash
node scripts/docs/merge-tcl-subcommand-docs.js
```

Expected:

```text
merge ok: 11 parent commands, 152 subcommands
dry run only; pass --write to update syntaxes/tcl_subcommand_docs*.json
```

- [ ] **Step 4: 验证所有 JSON 可解析**

Run:

```bash
node -e "for (const f of ['syntaxes/tcl_subcommand_docs.json','syntaxes/tcl_subcommand_docs.zh-CN.json','syntaxes/tcl_command_docs.json','syntaxes/tcl_command_docs.zh-CN.json','syntaxes/all_keywords.json','syntaxes/sdevice.tmLanguage.json','syntaxes/sprocess.tmLanguage.json','syntaxes/emw.tmLanguage.json','syntaxes/inspect.tmLanguage.json','syntaxes/svisual.tmLanguage.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); } console.log('json ok')"
```

Expected: `json ok`

- [ ] **Step 5: 检查工作树只包含本计划范围内文件**

Run:

```bash
git status --short
```

Expected: 只出现本计划列出的 tracked 文件；若看到执行前已存在的 `package-lock.json` 修改，不要回退，单独向用户说明它不是本计划产生的变更。`build/tcl-subcommand-docs/*.json` 是 ignored 临时文件，不应出现在普通 `git status --short` 中。

- [ ] **Step 6: 最终提交**

```bash
git add src/lsp/tcl-subcommand-registry.js scripts/docs/merge-tcl-subcommand-docs.js scripts/syntax/sync-tcl-subcommands.js tests/test-tcl-complex-subcommands.js syntaxes/tcl_subcommand_docs.json syntaxes/tcl_subcommand_docs.zh-CN.json syntaxes/tcl_command_docs.json syntaxes/tcl_command_docs.zh-CN.json syntaxes/all_keywords.json syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json src/register-completion-providers.js src/docs-loader.js docs/scope-color-reference.md AGENTS.md docs/file-trees/tests.md
git commit -m "feat: 补全 Tcl 复杂命令体系高亮与文档

- 新增 Tcl 子命令 registry，统一驱动补全、悬停和 TextMate 语法同步
- 新增子命令文档合并脚本，校验并合并并行子代理临时片段
- tcl_subcommand_docs 扩展到 11 个命令族共 152 个子命令
- tcl_command_docs 补齐复杂命令父命令、I/O 进阶命令和协程/杂项命令
- 5 个 Tcl 工具同步 FUNCTION/SUBCOMMAND 关键词和子命令高亮
- 增加复杂命令覆盖测试并更新项目文档"
```

---

## 自查

- [x] Spec coverage: Issue #10 的复杂命令族、I/O 进阶、高级函数、杂项命令均有对应任务；152 个子命令拆成 6 个可并行子代理批次，临时 JSON 不提交，最终由脚本合并到交付 JSON；`package` 采用 Tcl 8.6 官方 11 子命令，`fcopy` 重复项按 `flush` 已存在处理。
- [x] Placeholder scan: 每个任务包含明确文件、代码片段、命令与预期结果；文档条目要求固定字段和官方来源。
- [x] Type consistency: registry、测试、all_keywords、TextMate 和 Provider 使用相同 parent/subcommand 命名；`SUBCOMMAND` completion 类型在 `docs-loader.js` 中补齐。

---

## 执行选项

Plan complete and saved to `docs/superpowers/plans/2026-05-30-tcl-complex-command-subcommands.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.
