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
    if (!TCL_SUBCOMMANDS[parentCmd] || !TCL_SUBCOMMANDS[parentCmd].includes(subcmd)) {
        return null;
    }

    return { parentCmd, subcmd };
}

function buildTextMatePattern(parentCmd, scopeName) {
    const subcommands = TCL_SUBCOMMANDS[parentCmd];
    if (!subcommands) throw new Error(`Unknown Tcl parent command: ${parentCmd}`);
    return {
        match: `\\b(${parentCmd})\\s+(${subcommands.join('|')})\\b`,
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
