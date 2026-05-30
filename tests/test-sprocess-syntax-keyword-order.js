'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, summary } = require('./helpers/test-runner');

const grammarPath = path.join(__dirname, '..', 'syntaxes', 'sprocess.tmLanguage.json');

function loadKeywordPatterns() {
    const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    const container = grammar.patterns.find(pattern =>
        Array.isArray(pattern.patterns) &&
        pattern.patterns.some(child => child.name === 'keyword.control.sprocess')
    );

    assert.ok(container, '应找到 keyword.control.sprocess pattern 容器');
    return container.patterns.filter(pattern => pattern.name === 'keyword.control.sprocess');
}

function matchAtCommandStart(command, patterns) {
    for (let groupIndex = 0; groupIndex < patterns.length; groupIndex++) {
        const regex = new RegExp(`^(?:${patterns[groupIndex].match})`);
        const match = command.match(regex);
        if (match) {
            return {
                groupIndex,
                text: match[0],
            };
        }
    }

    return null;
}

function decodeLiteralAlternative(alternative) {
    return alternative.replace(/\\\./g, '.');
}

function getLiteralAlternatives(pattern) {
    const match = pattern.match.match(/^\\b\((.*)\)\(\?!\[A-Za-z0-9_:-\]\)$/);
    assert.ok(match, `无法解析 KEYWORD1 pattern: ${pattern.match}`);
    return match[1].split('|').map(decodeLiteralAlternative);
}

test('SPROCESS 点号 KEYWORD1 命令整体匹配', () => {
    const patterns = loadKeywordPatterns();
    const commands = [
        'icwb.create.all.masks',
        'icwb.create.mask',
        'icwb.contact.mask',
        'icwb.composite',
        'transform.refinement',
        'transform.mask',
        'point.xy',
    ];

    for (const command of commands) {
        const hit = matchAtCommandStart(command, patterns);
        assert.ok(hit, `${command} 应被 KEYWORD1 匹配`);
        assert.strictEqual(hit.text, command, `${command} 不应被截断为 ${hit.text}`);
    }
});

test('SPROCESS 全部 KEYWORD1 备选项不会被较短前缀截断', () => {
    const patterns = loadKeywordPatterns();
    const failures = [];

    for (const pattern of patterns) {
        for (const keyword of getLiteralAlternatives(pattern)) {
            const hit = matchAtCommandStart(keyword, patterns);
            if (!hit || hit.text !== keyword) {
                failures.push(`${keyword} -> ${hit ? hit.text : '<no match>'}`);
            }
        }
    }

    assert.deepStrictEqual(failures, []);
});

summary();
