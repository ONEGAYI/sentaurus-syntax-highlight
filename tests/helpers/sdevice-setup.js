'use strict';

const path = require('path');
const fs = require('fs');
const { buildKeywordSectionIndex } = require('../../src/lsp/providers/sdevice-semantic-provider');
const { getSdeviceAllSectionKeywordsLower } = require('../../src/lsp/tcl-symbol-configs');

const docsPath = path.join(__dirname, '..', '..', 'syntaxes', 'sdevice_command_docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
const index = buildKeywordSectionIndex(docs);
const sectionKeywords = new Set(getSdeviceAllSectionKeywordsLower());

function decodeTokens(text, data) {
    const lines = text.split('\n');
    let curLine = 0, curCol = 0;
    const results = [];
    for (let i = 0; i < data.length; i += 5) {
        curLine += data[i];
        curCol = data[i] === 0 ? curCol + data[i + 1] : data[i + 1];
        const len = data[i + 2];
        const word = lines[curLine]?.slice(curCol, curCol + len) || '';
        results.push({ word, typeIdx: data[i + 3], line: curLine, col: curCol, len });
    }
    return results;
}

module.exports = { docs, index, sectionKeywords, decodeTokens };
