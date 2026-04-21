```
sentaurus-syntax-highlight/
├── tests/                                      ← 测试套件（纯 Node.js assert，零外部依赖）
│   ├── test-definitions.js                     ← 用户变量定义提取
│   ├── test-expression-converter.js            ← 表达式转换
│   ├── test-expression-quickpick.js            ← QuickPick 变量补全与历史模式纯函数测试
│   ├── test-scheme-parser.js                   ← Scheme 解析器
│   ├── test-scheme-analyzer.js                 ← Scheme 定义提取（含 define+lambda params）
│   ├── test-scope-analyzer.js                  ← 作用域分析
│   ├── test-semantic-dispatcher.js             ← 语义分发
│   ├── test-semantic-tokens.js                 ← 语义令牌提取与 delta 编码
│   ├── test-signature-provider.js              ← 签名提示
│   ├── test-scheme-undef-diagnostic.js         ← Scheme 未定义变量诊断
│   ├── test-scheme-on-enter.js                 ← Scheme 括号内回车缩进逻辑测试
│   ├── test-scheme-dup-def-diagnostic.js       ← Scheme 重复定义检测
│   ├── test-scheme-var-refs.js                 ← Scheme 变量引用
│   ├── test-snippet-prefixes.js                ← 代码片段前缀
│   ├── test-tcl-ast-utils.js                   ← Tcl AST 工具（14 测试，mock 节点）
│   ├── test-tcl-ast-variables.js               ← Tcl AST 变量提取
│   ├── test-tcl-document-symbol.js             ← Tcl 文档大纲
│   ├── test-tcl-scope-map.js                   ← Tcl 作用域映射
│   ├── test-tcl-var-refs.js                    ← Tcl 变量引用
│   ├── test-parse-cache.js                     ← 解析缓存层测试
│   ├── test-tcl-scope-index.js                 ← ScopeIndex 作用域查询测试
│   ├── test-undef-var-integration.js           ← 未定义变量诊断集成测试
│   ├── test-unit-auto-close.js                 ← Unit 括号自动配对测试
│   ├── test-quote-auto-delete.js               ← 空引号对自动删除测试
│   ├── test-symbol-index.js                    ← 符号提取引擎（resolveSymbolName + extractSymbols）
│   ├── test-region-undef-diagnostic.js         ← Region/Material/Contact 未定义诊断
│   ├── test-symbol-completion.js               ← 符号补全过滤
│   ├── test-symbol-reference.js                ← Find All References
│   └── benchmark.js                            ← 性能基准测试工具
│   └── benchmark-firstload.js                  ← 首次加载性能诊断脚本
```