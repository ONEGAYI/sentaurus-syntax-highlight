# 为 `(define (FuncName args...))` 简写形式添加支持

日期：2026-04-22

## 背景

Scheme 标准 `(define (FuncName args...) body...)` 是 `(define FuncName (lambda (args...) body...))` 的语法糖。当前系统对该简写形式的支持不完整：

| 模块 | lambda 形式 | 简写形式 | 差距 |
|------|:-:|:-:|------|
| scheme-analyzer.js | ✅ (params 数组) | ⚠️ (无 params) | 签名提示 fallback 依赖 `d.params` |
| scope-analyzer.js | ✅ | ✅ | 无 |
| symbol-index.js::tryRegisterUserFunc | ✅ | ❌ | 符号提取完全缺失 |
| signature-provider.js | ✅ | ❌ | 无法提示签名 |

## 目标

使简写形式的所有功能对齐 lambda 形式，包括：
- 函数定义的 `params` 字段
- 用户自定义函数的符号参数自动分析与提取
- 函数签名提示

## 设计

### 改动 1：`scheme-analyzer.js` — 补充 `params` 字段

在 `extractDefinitionsFromList` 的简写分支中，为 function 定义追加 `params` 数组。

**位置**：`extractDefinitionsFromList` 函数，`children[1].type === 'List'` 分支（约 line 80）

**改动内容**：
```javascript
// 现有：创建 function 定义
definitions.push({
    name: children[1].children[0].value,
    line: listNode.line,
    endLine: listNode.endLine,
    definitionText: defText,
    kind: 'function',
});
// 新增：追加 params 数组
const params = children[1].children.slice(1)
    .filter(p => p.type === 'Identifier')
    .map(p => p.value);
if (params.length > 0) {
    definitions[definitions.length - 1].params = params;
}
```

**影响**：signature-provider 的用户函数 fallback（`analysis.definitions.find(d => d.name === functionName && d.params)`）自动适配简写形式。现有的 `kind: 'parameter'` 独立定义保持不变。

### 改动 2：`symbol-index.js` — `tryRegisterUserFunc` 扩展

在现有 lambda 检查逻辑之后，添加简写形式分支。

**位置**：`extractSymbols` 内的 `tryRegisterUserFunc` 函数（约 line 121）

**改动内容**：
```javascript
function tryRegisterUserFunc(ec) {
    if (ec[0].value !== 'define' || ec.length < 3) return;

    // 形式 1: (define name (lambda (params...) body...))
    if (ec[1].type === 'Identifier') {
        const lambdaNode = ec[2];
        if (lambdaNode.type !== 'List') return;
        const lec = effectiveChildren(lambdaNode);
        if (lec.length < 3 ||
            lec[0].type !== 'Identifier' || lec[0].value !== 'lambda' ||
            lec[1].type !== 'List') return;
        const paramNames = effectiveChildren(lec[1])
            .filter(c => c.type === 'Identifier')
            .map(c => c.value);
        const mapping = scanLambdaBody(lec.slice(2), paramNames, symbolParamsTable);
        if (mapping.length > 0) {
            userFuncParams[ec[1].value] = mapping;
        }
        return;
    }

    // 形式 2: (define (func-name params...) body...)
    const sigEc = effectiveChildren(ec[1]);
    if (ec[1].type === 'List' && sigEc.length >= 2) {
        const firstChild = sigEc[0];
        if (firstChild.type !== 'Identifier') return;
        const funcName = firstChild.value;
        const paramNames = sigEc.slice(1)
            .filter(c => c.type === 'Identifier')
            .map(c => c.value);
        if (paramNames.length === 0) return;
        const mapping = scanLambdaBody(ec.slice(2), paramNames, symbolParamsTable);
        if (mapping.length > 0) {
            userFuncParams[funcName] = mapping;
        }
    }
}
```

**设计决策**：
- `scanLambdaBody` 接收 `ec.slice(2)`（即 body 节点），与 lambda 形式中 `lec.slice(2)` 对称
- 无参数函数跳过注册（无参数可映射到符号角色）
- `ec[1].children.length >= 2` 确保至少有一个参数

### 测试用例

#### `test-symbol-index.js` — 新增 3 个用例

1. **简写形式的符号提取**：`(define (make-box mat rname) (sdegeo:create-region ... rname ...))` — 验证 rname 被识别为 region def
2. **简写形式无符号参数**：`(define (my-func x y) (+ x y))` — 验证不产生映射
3. **简写与 lambda 混合**：同一文件中两种形式并存，各自正确工作

#### `test-scheme-analyzer.js` — 新增 1-2 个用例

- `(define (f x y) (+ x y))` — 验证 `params` 字段为 `['x', 'y']`

#### `test-signature-provider.js` — 新增 1 个用例

- `(define (create_trapezoid x0 y0 z0 w h) body)` + 调用点 — 验证签名提示显示 5 个参数

## 不涉及

- 解析器（scheme-parser.js）：已正确生成 AST，无需改动
- 作用域分析器（scope-analyzer.js）：已正确处理简写形式
- 其他 Provider（folding、bracket-diagnostic 等）：不依赖 define 形式区分
