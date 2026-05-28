// tests/test-undef-var-integration.js
// 集成测试：用真实 WASM 解析器验证 buildScopeMap 对 word_list 包装命令的处理
'use strict';

const { test } = require('./helpers/test-runner');
const assert = require('assert');
let ParserClass, Language;
try {
    const wt = require('web-tree-sitter');
    ParserClass = wt.Parser;
    Language = wt.Language;
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.error('⚠ web-tree-sitter 未安装。请在此工作树中运行 npm install');
        process.exit(2);
    }
    throw e;
}
const path = require('path');
const astUtils = require('../src/lsp/tcl-scope');
const varExtractor = require('../src/lsp/tcl-variable-extractor');

async function main() {
    await ParserClass.init();
    const language = await Language.load(
        path.join(__dirname, '..', 'syntaxes', 'tree-sitter-tcl.wasm')
    );
    const parser = new ParserClass();
    parser.setLanguage(language);

    function parseAndCheck(code, expectVisible, expectUndefined) {
        const tree = parser.parse(code);
        try {
            const root = tree.rootNode;
            const refs = varExtractor.getVariableRefs(root);
            const scopeMap = astUtils.buildScopeMap(root);

            for (const { name, line } of expectVisible) {
                const visible = scopeMap.get(line);
                assert(visible && visible.has(name),
                    `第 ${line} 行 $${name} 应可见 (got: ${visible ? [...visible].join(',') : 'null'})`);
            }
            for (const { name, line } of expectUndefined) {
                const visible = scopeMap.get(line);
                assert(!visible || !visible.has(name),
                    `第 ${line} 行 $${name} 不应可见 (got: ${visible ? [...visible].join(',') : 'null'})`);
            }
        } finally { tree.delete(); }
    }

    console.log('\n=== 未定义变量检测集成测试 (真实 WASM) ===\n');

    test('lappend 创建的变量在全局可见', () => {
        parseAndCheck(
            'lappend mylist "item1"\nputs $mylist',
            [{ name: 'mylist', line: 2 }],
            []
        );
    });

    test('append 创建的变量在全局可见', () => {
        parseAndCheck(
            'append buffer "hello"\nputs $buffer',
            [{ name: 'buffer', line: 2 }],
            []
        );
    });

    test('for 循环变量在全局可见', () => {
        parseAndCheck(
            'set width 0.5\nfor {set i 0} {$i < 10} {incr i} {\n    puts $i\n    puts $width\n}',
            [{ name: 'i', line: 4 }, { name: 'width', line: 4 }, { name: 'width', line: 2 }],
            []
        );
    });

    test('global 声明在 proc 内引入变量', () => {
        parseAndCheck(
            'set alpha 1.0\nproc test {} {\n    global alpha\n    puts $alpha\n}',
            [{ name: 'alpha', line: 4 }],
            []
        );
    });

    test('upvar 在 proc 内引入本地别名', () => {
        parseAndCheck(
            'proc modify {name val} {\n    upvar 1 $name local_ref\n    puts $local_ref\n}',
            [{ name: 'local_ref', line: 3 }, { name: 'name', line: 2 }, { name: 'val', line: 2 }],
            []
        );
    });

    test('variable 在 proc 内引入命名空间变量', () => {
        parseAndCheck(
            'proc use_ns {} {\n    variable ns_data\n    puts $ns_data\n}',
            [{ name: 'ns_data', line: 3 }],
            []
        );
    });

    test('综合场景：global + upvar + variable + 参数', () => {
        parseAndCheck(
            'set alpha 1.0\nset beta 2.0\nproc mixed_test {gamma} {\n    global alpha\n    upvar 1 beta local_beta\n    variable ns_val\n    puts $alpha\n    puts $local_beta\n    puts $ns_val\n    puts $gamma\n    puts $beta\n}',
            [
                { name: 'alpha', line: 7 },
                { name: 'local_beta', line: 8 },
                { name: 'ns_val', line: 9 },
                { name: 'gamma', line: 10 },
            ],
            [
                { name: 'beta', line: 11 },
            ]
        );
    });

    test('全局变量在 proc 内不可见（除非 global 声明）', () => {
        parseAndCheck(
            'set x 1\nproc foo {} {\n    puts $x\n}',
            [],
            [{ name: 'x', line: 3 }]
        );
    });

    test('proc 参数在 body 内可见', () => {
        parseAndCheck(
            'proc foo {a b} {\n    puts $a\n    puts $b\n}',
            [{ name: 'a', line: 2 }, { name: 'b', line: 3 }],
            []
        );
    });

    test('嵌套 if 块内变量在同级可见', () => {
        parseAndCheck(
            'set x 1\nif { $x > 0 } {\n    if { $x < 10 } {\n        set inner 42\n    }\n    puts $inner\n}',
            [{ name: 'inner', line: 6 }, { name: 'x', line: 6 }],
            []
        );
    });

    test('if/else 双分支定义的变量都可见', () => {
        parseAndCheck(
            'set cond 1\nif { $cond } {\n    set shared alpha\n} else {\n    set shared beta\n}\nputs $shared',
            [{ name: 'shared', line: 7 }],
            []
        );
    });

    test('while 循环体内变量在后续可见', () => {
        parseAndCheck(
            'set i 0\nwhile { $i < 3 } {\n    set result $i\n    incr i\n}\nputs $result',
            [{ name: 'result', line: 5 }, { name: 'i', line: 5 }],
            []
        );
    });

    test('while 嵌套在 if 体内，变量可见', () => {
        parseAndCheck(
            'set cond 1\nif { $cond } {\n    set i 0\n    while { $i < 3 } {\n        set buf $i\n        incr i\n    }\n    puts $buf\n}',
            [{ name: 'buf', line: 8 }, { name: 'i', line: 8 }],
            []
        );
    });

    // 异步测试中用 process.exitCode 替代 process.exit() 避免 libuv 句柄警告
    const { printSummary } = require('./helpers/test-runner');
    printSummary();
}

main().catch(e => {
    console.error('测试初始化失败:', e);
    process.exit(1);
});
