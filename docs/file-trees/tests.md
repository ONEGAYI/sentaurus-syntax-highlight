```
sentaurus-syntax-highlight/
├── tests/                                      ← 测试套件（纯 Node.js assert，零外部依赖）
│   ├── helpers/                                ← 测试辅助模块
│   │   └── mock-vscode.js                      ← VSCode API 模拟层（HelpReader 等测试用）
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
│   ├── test-tcl-complex-subcommands.js         ← Tcl 复杂命令族 registry/文档/语法/补全覆盖测试
│   ├── test-variable-reference.js              ← 用户变量引用查找（Scheme + Tcl）
│   ├── test-undef-var-integration.js           ← 未定义变量诊断集成测试
│   ├── test-tcl-preprocessor.js                ← Tcl 预处理器分支分析（pp-utils）
│   ├── test-sdevice-semantic.js                ← SDEVICE section 语义 token 测试
│   ├── test-sdevice-vector-keywords.js         ← SDEVICE 矢量关键词扫描与匹配测试
│   ├── test-pp-define.js                       ← #define 宏语义支持测试（补全/悬停/跳转/引用/诊断）
│   ├── test-unit-auto-close.js                 ← Unit 括号自动配对测试
│   ├── test-quote-auto-delete.js               ← 空引号对自动删除测试
│   ├── test-symbol-index.js                    ← 符号提取引擎（resolveSymbolName + extractSymbols）
│   ├── test-region-undef-diagnostic.js         ← Region/Material/Contact 未定义诊断
│   ├── test-symbol-completion.js               ← 符号补全过滤
│   ├── test-symbol-reference.js                ← Find All References
│   ├── test-implicit-var-functions.js           ← 15 种 Tcl 隐式变量声明函数测试（60 用例）
│   ├── test-par-parser.js                      ← SDEVICE PAR 三级 AST 解析 + include 链递归（41 测试）
│   ├── test-par-context.js                     ← SDEVICE PAR 光标位置上下文推断（15 测试）
│   ├── test-par-completion.js                  ← SDEVICE PAR 三级补全调度（15 测试）
│   ├── test-par-index.js                       ← SDEVICE PAR workspace 全量扫描索引（30 测试）
│   ├── test-par-materialdb.js                  ← SDEVICE PAR MaterialDB 集成（20 测试）
│   ├── test-help-reader.js                     ← Webview 帮助阅读器（23 测试：路径校验/toc解析/HTML构建）
│   ├── benchmark.js                            ← 性能基准测试工具
│   └── benchmark-firstload.js                  ← 首次加载性能诊断脚本
```
