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
    fs.writeFileSync(grammarPath, `${JSON.stringify(grammar, null, 2)}\n`);
    console.log(`${lang}: ${generated.length} subcommand patterns`);
}

for (const lang of LANGS) {
    syncGrammar(lang);
}
