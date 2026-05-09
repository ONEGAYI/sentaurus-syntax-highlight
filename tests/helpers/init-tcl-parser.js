'use strict';

const path = require('path');

let _parser = null;

async function initTclParser() {
    if (_parser) return _parser;
    try {
        const TclParser = require('web-tree-sitter');
        await TclParser.init();
        const parser = new TclParser();
        const wasmPath = path.join(__dirname, '..', '..', 'syntaxes', 'tree-sitter-tcl.wasm');
        const lang = await TclParser.Language.load(wasmPath);
        parser.setLanguage(lang);
        _parser = parser;
        return parser;
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.error('⚠ web-tree-sitter 未安装。请在此工作树中运行 npm install');
            process.exit(2);
        }
        throw e;
    }
}

module.exports = { initTclParser };
