# 用户定义函数调用高亮与签名提示

日期：2026-04-21
状态：待实现

## 背景

SDE (Scheme) 语言中，用户通过 `(define name (lambda (params...) body...))` 定义函数。当前：
- 定义处 `name` 被标记为 `kind: 'variable'`（蓝色），这是正确的
- **调用处** `(name args...)` 也被 TextMate 语法匹配为 `variable.other`（蓝色），但用户期望显示为函数色（黄色）
- **签名提示**仅服务于内置函数（通过 `modeDispatchTable` 和 `funcDocs`），用户定义函数没有签名提示

## 需求

1. **调用处函数色高亮**：当用户定义的函数（绑定 lambda 的 define）在调用位置 `(name args...)` 出现时，使用函数色（黄色）高亮
2. **签名提示**：调用用户定义函数时，根据 lambda 参数列表提供 Signature Help
3. **定义处保持不变**：`(define name (lambda ...))` 中的 `name` 保持变量色（蓝色）
4. **悬停和跳转定义**：保持现有逻辑不变

## 范围

- 仅覆盖 `(define name (lambda (params...) body...))` 形式
- 不覆盖 `(define (func-name params...) body...)` 缩写形式（已有 kind='function'）
- 不覆盖 let/letrec 绑定的 lambda

## 设计

### 1. scheme-analyzer.js 增强

在 `extractDefinitionsFromList` 的 `(define name val)` 分支中，检测值是否为 lambda 表达式。如果是，在 definition 对象中新增 `params` 字段（字符串数组）。

`kind` 保持 `'variable'` 不变。

```
definitions 列表变化：
  之前: { name: 'create_trapezoid', kind: 'variable', ... }
  之后: { name: 'create_trapezoid', kind: 'variable', params: ['x0','y0','z0',...], ... }
```

### 2. semantic-tokens-provider.js（新增）

注册 `DocumentSemanticTokensProvider`，仅用于 SDE 语言。

**Legend**：声明 `function` 语义令牌类型。

**算法**：
1. 从 `SchemeParseCache` 获取 AST
2. 从 `definitions.js` 获取 definitions（带 params 字段）
3. 构建函数名集合：所有 `kind === 'function'` **或** 带有 `params` 字段的 definition 的 `name`
4. 遍历 AST 中所有 `List` 节点，取第一个有效子节点（跳过 Comment）
5. 如果第一个子节点是 Identifier 且名称在函数名集合中，标记为 `function` 语义令牌
6. 返回 delta 编码数组

> 注意：`(define (func-name params...) body...)` 缩写形式已有 `kind: 'function'`，也会被纳入函数名集合，因此调用处同样获得函数色高亮。

**排除定义位置**：`(define name (lambda ...))` 中 `name` 是 List 的第 2 个子节点（不是第 1 个），不会被当作"调用位置"处理。

**性能**：复用 `SchemeParseCache` 的已缓存 AST，不触发额外解析。definitions 也有版本缓存。

### 3. signature-provider.js 增强

在 `provideSignatureHelp` 的末尾，当内置函数匹配（modeDispatchTable + funcDocs）均失败时，fallback 查询用户 definitions：

```
if (userFunc = definitions.find(d => d.name === functionName && d.params)):
    构建 SignatureHelp:
      label: "(functionName param1 param2 ...)"
      parameters: params.map(p => ({ label: p, documentation: '' }))
      documentation: '用户定义函数'
      activeParameter: min(activeParam, params.length - 1)
```

需要新增参数或通过闭包传入 `defs.getDefinitions`。

### 4. package.json 改动

在 `contributes` 中添加：

```json
"semanticTokenTypes": [
  { "id": "function", "description": "用户定义的函数调用" }
]
```

### 5. extension.js 注册

- 导入 `semantic-tokens-provider.js`
- 创建 `SemanticTokensLegend`
- 注册 `vscode.languages.registerDocumentSemanticTokensProvider({ language: 'sde' }, provider, legend)`

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lsp/scheme-analyzer.js` | 修改 | define+lambda 检测，添加 params 字段 |
| `src/lsp/providers/semantic-tokens-provider.js` | 新增 | Semantic Tokens Provider |
| `src/lsp/providers/signature-provider.js` | 修改 | 用户函数签名 fallback |
| `src/extension.js` | 修改 | 注册 Semantic Tokens Provider |
| `package.json` | 修改 | 声明 semanticTokenTypes |
| `tests/test-scheme-analyzer.js` | 修改 | 新增 define+lambda params 测试 |
| `tests/test-semantic-tokens.js` | 新增 | 调用位置高亮测试 |
| `tests/test-signature-provider.js` | 修改 | 用户函数签名测试 |

## 测试计划

1. **scheme-analyzer**：验证 `(define name (lambda (a b c) ...))` 提取出 `params: ['a','b','c']`
2. **semantic-tokens**：验证调用位置 `(name 1 2 3)` 中 `name` 被标记为 function 令牌；定义位置 `name` 不被标记
3. **signature-provider**：验证调用用户函数时签名提示正确显示参数列表和活跃参数索引
