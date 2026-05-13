// tests/test-tcl-lmap-in-set.js
// 回归测试：set VAR [lmap v $list {body}] 中 lmap 的循环变量 v 应被识别为定义
'use strict';

const assert = require('assert');
const wt = require('web-tree-sitter');
const { buildScopeIndex } = require('../src/lsp/tcl-scope');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

(async () => {
    await wt.Parser.init();
    const parser = new wt.Parser();
    const Lang = await wt.Language.load('syntaxes/tree-sitter-tcl.wasm');
    parser.setLanguage(Lang);

    console.log('\n=== lmap-in-set 回归测试 ===\n');

    test('set [lmap v ...] 中循环变量 v 应出现在 globalDefs', () => {
        const code = 'set VGS_LIST [lmap v $ABS_VGS_LIST {set v "$SYMBOL$v"}]\n';
        const tree = parser.parse(code);
        const idx = buildScopeIndex(tree.rootNode);

        const names = idx._globalDefs.map(d => d.name);
        assert.ok(names.includes('v'), `v 应出现在 globalDefs，实际: ${names.join(', ')}`);
        assert.ok(names.includes('VGS_LIST'), `VGS_LIST 应出现在 globalDefs`);
        tree.delete();
    });

    test('set [lassign ... a b] 中变量 a b 应出现在 globalDefs', () => {
        const code = 'set result [lassign $values a b]\n';
        const tree = parser.parse(code);
        const idx = buildScopeIndex(tree.rootNode);

        const names = idx._globalDefs.map(d => d.name);
        assert.ok(names.includes('a'), `a 应出现在 globalDefs，实际: ${names.join(', ')}`);
        assert.ok(names.includes('b'), `b 应出现在 globalDefs，实际: ${names.join(', ')}`);
        tree.delete();
    });

    test('set [scan ...] 中 scan 变量应出现在 globalDefs', () => {
        const code = 'set n [scan $str %d val]\n';
        const tree = parser.parse(code);
        const idx = buildScopeIndex(tree.rootNode);

        const names = idx._globalDefs.map(d => d.name);
        assert.ok(names.includes('val'), `val 应出现在 globalDefs，实际: ${names.join(', ')}`);
        tree.delete();
    });

    test('完整文件上下文中 lmap 循环变量 v 不遗漏', () => {
        const code = [
            'set ABS_VGS_LIST [list 0.5 0.75 1.0]',
            'set VGS_LIST [lmap v $ABS_VGS_LIST {set v "$SYMBOL$v"}]',
            'puts $v',
        ].join('\n') + '\n';
        const tree = parser.parse(code);
        const idx = buildScopeIndex(tree.rootNode);

        const names = idx._globalDefs.map(d => d.name);
        assert.ok(names.includes('v'), `v 应出现在 globalDefs，实际: ${names.join(', ')}`);
        assert.ok(names.includes('VGS_LIST'), `VGS_LIST 应出现在 globalDefs`);
        assert.ok(names.includes('ABS_VGS_LIST'), `ABS_VGS_LIST 应出现在 globalDefs`);
        tree.delete();
    });

    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
})();
