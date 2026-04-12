const assert = require('assert');

const DEFAULT_PREFIXES = {
    RW: 'RW.', DC: 'DC.', CPP: 'CPP.', CPM: 'CPM.',
    GAUSS: 'GAUSS.', IMP: 'IMP.', SM: 'SM.', PSM: 'PSM.',
    RS: 'RS.', RP: 'RP.',
};

function applySnippetPrefixes(snippetText, customPrefixes) {
    let result = snippetText;
    for (const [key, defaultVal] of Object.entries(DEFAULT_PREFIXES)) {
        const custom = customPrefixes[key];
        if (custom !== undefined && custom !== defaultVal) {
            result = result.replaceAll(`"${defaultVal}"`, `"${custom}"`);
        }
    }
    return result;
}

// --- 测试用例 ---

// 1. 默认配置不替换
const input1 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input1, { RW: 'RW.', DC: 'DC.', CPP: 'CPP.', CPM: 'CPM.', GAUSS: 'GAUSS.', IMP: 'IMP.', SM: 'SM.', PSM: 'PSM.', RS: 'RS.', RP: 'RP.' }),
    input1,
    '默认配置不应修改文本'
);
console.log('PASS: 默认配置不替换');

// 2. 单个前缀自定义
const input2 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input2, { RW: 'RefWin.' }),
    '(sdedr:define-refeval-window (string-append "RefWin." NAME))',
    '自定义 RW 前缀应正确替换'
);
console.log('PASS: 单个前缀自定义');

// 3. 前缀设为空字符串
const input3 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input3, { RW: '' }),
    '(sdedr:define-refeval-window (string-append "" NAME))',
    '空字符串应移除前缀'
);
console.log('PASS: 空字符串移除前缀');

// 4. 多处同名前缀全部替换
const input4 = [
    '(sdedr:define-refinement-size (string-append "RS." RNAME)',
    '(sdedr:define-refinement-placement (string-append "RP." RNAME)',
    '    (string-append "RS." RNAME) (string-append "RW." RNAME))',
].join('\n');
assert.strictEqual(
    applySnippetPrefixes(input4, { RS: 'RefSize.' }).match(/RefSize\./g).length,
    2,
    '多处同名前缀应全部替换'
);
console.log('PASS: 多处同名前缀全部替换');

// 5. replaceAll 替换所有出现位置（包括注释）
const input5 = '; Note: "RW." is the standard prefix\n(sdedr:define-refeval-window (string-append "RW." NAME))';
const result5 = applySnippetPrefixes(input5, { RW: 'RefWin.' });
assert.strictEqual(
    result5.match(/RefWin\./g).length,
    2,
    '注释中的同名前缀也应被替换'
);
console.log('PASS: replaceAll 替换所有出现位置');

console.log('\nAll tests passed.');
