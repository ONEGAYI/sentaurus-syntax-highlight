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
