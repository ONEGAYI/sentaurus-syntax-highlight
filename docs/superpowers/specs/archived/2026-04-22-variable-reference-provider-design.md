# 用户自定义变量引用查找 — 设计文档

日期：2026-04-22

## 概述

为所有 6 种支持语言（SDE/SDEVICE/SPROCESS/EMW/INSPECT/SVISUAL）实现用户自定义变量的 Find All References 功能。利用已有的作用域分析基础设施（Scheme: scope-analyzer, Tcl: tcl-ast-utils），实现作用域感知的精确引用查找——同名变量在不同作用域中完全隔离。

## 算法设计

### Scheme（SDE）

1. 获取光标处的单词 `word`
2. 获取 `scopeTree = buildScopeTree(ast)`
3. 获取光标处可见定义 `defs = getVisibleDefinitions(scopeTree, cursorLine)`
4. 找到匹配 `word` 的定义 `targetDef`
   - 如果没找到 → 返回 `null`（光标不在变量上）
5. 获取所有引用 `refs = getSchemeRefs(ast)`
6. 过滤：对每个 `ref.name === word` 的引用：
   - 获取 ref 处可见定义 `refDefs = getVisibleDefinitions(scopeTree, ref.line)`
   - 如果 `refDefs` 中存在 `line === targetDef.line && start === targetDef.start` 的定义 → 包含此引用
7. 将 `targetDef` 定义位置 + 匹配引用转为 `vscode.Location[]` 返回

关键点：`getVisibleDefinitions(tree, line)` 已实现完整的作用域链解析，返回 `{name, kind, line, start, end, scopeType}[]`，可直接用于判断引用解析到哪个定义。

### Tcl（5 种工具）

1. 获取光标处的单词 `word`（去除 `$` 前缀）
2. 构建 `scopeIndex = buildScopeIndex(root)`
3. 调用 `scopeIndex.resolveDefinition(word, cursorLine)` 获取目标定义
   - 如果没找到 → 返回 `null`
4. 获取所有变量引用 `refs = getVariableRefs(root)`
5. 过滤：对每个 `ref.name === word` 的引用：
   - 调用 `scopeIndex.resolveDefinition(word, ref.line)` 判断是否解析到同一 `defLine`
   - 匹配 → 包含此引用
6. 将目标定义位置 + 匹配引用转为 `vscode.Location[]` 返回

### 新增：`ScopeIndex.resolveDefinition(name, line)`

当前 `ScopeIndex.getVisibleAt(line)` 只返回 `Set<string>`（可见名称集合）。需要新增方法返回定义的具体来源：

```javascript
resolveDefinition(name, line) {
    // 1. 确定所在过程（如果在某个 proc 内）
    const proc = this._procScopes.find(p => line >= p.startLine && line <= p.endLine);

    if (proc) {
        // 2. 在过程体内：先查局部定义（params + set/foreach）
        const local = proc.localDefs.find(d => d.name === name);
        if (local) return { defLine: local.defLine, scope: 'local' };

        // 3. 查过程导入（global/upvar/variable）
        if (proc.scopeImports.includes(name)) {
            const globalDef = this._globalDefs.find(d => d.name === name);
            if (globalDef) return { defLine: globalDef.defLine, scope: 'imported' };
        }

        // 4. 查全局过程名
        const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
        if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

        return null; // 未定义
    }

    // 5. 全局作用域：查全局 set/foreach 定义
    const globalDef = this._globalDefs.find(d => d.name === name);
    if (globalDef) return { defLine: globalDef.defLine, scope: 'global' };

    // 6. 查全局过程名
    const globalProc = this._globalDefs.find(d => d.name === name && d.isProc);
    if (globalProc) return { defLine: globalProc.defLine, scope: 'global-proc' };

    return null;
}
```

## 文件结构

### 新增文件

```
src/lsp/providers/variable-reference-provider.js   ← Provider 实现
```

### 修改文件

| 文件 | 变更内容 |
|------|----------|
| `src/lsp/tcl-ast-utils.js` | 给 `ScopeIndex` 类添加 `resolveDefinition(name, line)` 方法 |
| `src/extension.js` | 导入并注册 variable-reference-provider |

### 不修改文件

- `scope-analyzer.js` — `getVisibleDefinitions` 已满足需求
- `definitions.js` — 无需改动
- `undef-var-diagnostic.js` — 无需改动

## Provider 注册

在 `extension.js` 中为所有 6 种语言注册：

```javascript
const varRefProvider = require('./lsp/providers/variable-reference-provider');
varRefProvider.activate(context, schemeCache, tclCache, vscode);
```

Provider 内部根据 `document.languageId` 分发：
- `sde` → Scheme 逻辑（scope-analyzer）
- 其余 5 种 → Tcl 逻辑（tcl-ast-utils + ScopeIndex）

### 与 symbol-reference-provider 的共存

两个 Provider 独立注册、互不干扰：
- `symbol-reference-provider`：处理 Region/Material/Contact 符号引用
- `variable-reference-provider`：处理用户变量引用
- VSCode 合并展示两个 Provider 的结果

## 边界情况

| 场景 | 处理方式 |
|------|----------|
| 光标在注释/字符串中 | 返回 `null` |
| 光标不在变量上 | 返回 `null` |
| 变量被重新定义（同名不同作用域） | 作用域链解析自动区分 |
| 空文档 / 语法错误 | 解析失败返回 `null`，静默处理 |
| WASM 解析器未就绪（Tcl） | 返回 `null`，不报错 |
| `options.includeDeclaration === false` | 排除定义位置，只返回引用 |

## 性能

- 复用 `schemeCache.getOrParse()` / `tclCache.getOrParse()` 解析缓存
- `getSchemeRefs` / `getVariableRefs` 返回的引用通常在百级别
- 对每个引用调用 `getVisibleDefinitions` / `resolveDefinition` 的开销可接受
- scope tree / scope index 已在缓存中

## 测试

- 为 `ScopeIndex.resolveDefinition()` 编写单元测试
- 为 Provider 的核心过滤逻辑编写单元测试（Scheme + Tcl）
- 在 VSCode Extension Development Host 中手动验证 Find All References

## Provider 接口

```javascript
module.exports = {
    activate(context, schemeCache, tclCache, vscode) {
        const langIds = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect', 'svisual'];

        for (const langId of langIds) {
            context.subscriptions.push(
                vscode.languages.registerReferenceProvider(
                    { scheme: 'file', language: langId },
                    { provideReferences(document, position, options, token) }
                )
            );
        }
    }
};
```
