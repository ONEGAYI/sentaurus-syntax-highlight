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
        pattern.match.startsWith(`\\b(${parent})\\s+`) &&
        pattern.captures &&
        pattern.captures['2'] &&
        pattern.captures['2'].name === 'support.type.tcl-subcommand'
    );
}

test('registry exposes the complete Tcl subcommand list and context matching', () => {
    const registry = require('../src/lsp/tcl-subcommand-registry');
    assert.deepStrictEqual(registry.TCL_SUBCOMMANDS, TARGET_SUBCOMMANDS);
    assert.deepStrictEqual(registry.getParentCommands(), Object.keys(TARGET_SUBCOMMANDS));
    assert.deepStrictEqual(registry.getSubcommands('dict'), TARGET_SUBCOMMANDS.dict);
    assert.deepStrictEqual(registry.matchCompletionContext('dict '), { parentCmd: 'dict' });
    assert.deepStrictEqual(registry.matchHoverContext('namespace eval'), { parentCmd: 'namespace', subcmd: 'eval' });
    assert.strictEqual(registry.matchHoverContext('notdict eval'), null);
});

test('tcl_subcommand_docs covers every target subcommand in English and Chinese', () => {
    const en = readJson('syntaxes/tcl_subcommand_docs.json');
    const zh = readJson('syntaxes/tcl_subcommand_docs.zh-CN.json');
    for (const [parent, subcommands] of Object.entries(TARGET_SUBCOMMANDS)) {
        assert.ok(en[parent], `English docs missing parent command ${parent}`);
        assert.ok(zh[parent], `Chinese docs missing parent command ${parent}`);
        assert.deepStrictEqual(Object.keys(en[parent]).sort(), subcommands.slice().sort(), `English ${parent} subcommands mismatch`);
        assert.deepStrictEqual(Object.keys(zh[parent]).sort(), subcommands.slice().sort(), `Chinese ${parent} subcommands mismatch`);
        for (const subcmd of subcommands) {
            for (const [label, docs] of [['EN', en], ['ZH', zh]]) {
                const entry = docs[parent][subcmd];
                assert.ok(entry.signature, `${label} ${parent} ${subcmd} missing signature`);
                assert.ok(entry.description, `${label} ${parent} ${subcmd} missing description`);
                assert.ok(entry.example, `${label} ${parent} ${subcmd} missing example`);
            }
        }
    }
});

test('tcl_command_docs covers complex-command parents and related top-level commands', () => {
    const en = readJson('syntaxes/tcl_command_docs.json');
    const zh = readJson('syntaxes/tcl_command_docs.zh-CN.json');
    for (const name of TARGET_TOP_LEVEL_COMMANDS) {
        assert.ok(en[name], `English docs missing top-level command ${name}`);
        assert.ok(zh[name], `Chinese docs missing top-level command ${name}`);
        assert.ok(en[name].signature, `English ${name} missing signature`);
        assert.ok(zh[name].signature, `Chinese ${name} missing signature`);
        assert.ok(en[name].description, `English ${name} missing description`);
        assert.ok(zh[name].description, `Chinese ${name} missing description`);
    }
});

test('all_keywords synchronizes FUNCTION and SUBCOMMAND for the 5 Tcl tools', () => {
    const allKeywords = readJson('syntaxes/all_keywords.json');
    const subcommands = uniqueSubcommands();
    for (const lang of TCL_GRAMMAR_LANGS) {
        const module = allKeywords[lang];
        assert.ok(module, `Missing ${lang}`);
        for (const cmd of TARGET_TOP_LEVEL_COMMANDS) {
            assert.ok(module.FUNCTION.includes(cmd), `${lang}.FUNCTION missing ${cmd}`);
        }
        assert.deepStrictEqual(module.SUBCOMMAND.slice().sort(), subcommands, `${lang}.SUBCOMMAND mismatch`);
    }
});

test('5 Tcl TextMate grammars contain registry-generated subcommand patterns', () => {
    for (const lang of TCL_GRAMMAR_LANGS) {
        const grammar = readJson(`syntaxes/${lang}.tmLanguage.json`);
        for (const [parent, subcommands] of Object.entries(TARGET_SUBCOMMANDS)) {
            const pattern = findSubcommandPattern(grammar, parent);
            assert.ok(pattern, `${lang} missing ${parent} subcommand pattern`);
            const re = new RegExp(pattern.match);
            for (const subcmd of subcommands) {
                assert.ok(pattern.match.includes(subcmd), `${lang} ${parent} pattern missing ${subcmd}`);
                assert.ok(re.test(`${parent} ${subcmd} arg`), `${lang} ${parent} ${subcmd} pattern does not match real Tcl text`);
            }
        }
    }
});

test('Completion and Hover providers use registry instead of old hard-coded parents', () => {
    const source = fs.readFileSync(path.join(root, 'src/register-completion-providers.js'), 'utf8');
    assert.ok(source.includes("require('./lsp/tcl-subcommand-registry')"));
    assert.ok(source.includes('matchCompletionContext'));
    assert.ok(source.includes('matchHoverContext'));
    assert.ok(!source.includes('string|file|info|array|dict'), 'Old hard-coded parent command regex still exists');
});

summary();
