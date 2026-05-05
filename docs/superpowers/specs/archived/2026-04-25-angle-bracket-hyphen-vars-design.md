# 尖括号连字符变量语法设计

## 问题背景

Scheme 语言中连字符标识符（如 `my-var`、`set!`、`number?`）是合法标识符。在之前的工作中已修复了 TextMate 语法高亮、语言配置和 LSP Provider 对连字符的支持。

但表达式转换器（QuickPick 中缀↔Scheme 双向转换）的中缀方向仍存在歧义：`my-var + 1` 的 `-` 会被词法分析器识别为减号运算符，导致 `my`、`-`、`var` 三个 token，无法还原为 Scheme 的 `my-var` 标识符。

## 设计目标

引入尖括号语法 `<var-name>` 在中缀表达式中消除歧义，使连字符标识符在转换过程中不被错误切割。

## 语法规则

### 尖括号仅在输入中缀表达式时使用

| 方向 | 输入 | 输出 |
|------|------|------|
| infix → Scheme | `<my-var> + 1` | `(+ my-var 1)` |
| Scheme → infix | `(+ my-var 1)` | `<my-var> + 1` |

- **infix2scheme**：用户在中缀输入中用 `<my-var>` 包裹连字符变量；转换结果中尖括号去除，输出合法 Scheme
- **scheme2infix**：用户输入原生 Scheme 语法（含连字符标识符）；转换结果中含连字符的标识符自动包裹 `<...>`

### 尖括号范围

- **支持的标识符字符**：`<` 和 `>` 内的内容视为标识符，与 Scheme 标识符规则一致（字母开头，可含 `-`、`?`、`!`、`@` 等扩展字符）
- **尖括号不可嵌套**：`<<nested>>` 是非法的
- **必须成对出现**：`<var`（未闭合）和 `var>`（无开括号）视为错误

## 实现设计

### 1. tokenizeInfix 修改

**文件**：`src/commands/expression-converter.js`

在字符循环中添加尖括号识别逻辑，位于数字字面量识别之前、运算符识别之后：

```
遇到 '<'：
  1. 记录 start = i + 1（跳过 '<'）
  2. 向后扫描直到遇到 '>' 或字符串结束
  3. 如果遇到另一个 '<'（嵌套），标记为错误
  4. 如果未找到 '>'，标记为未闭合错误
  5. 正常情况：提取 start..i 之间的内容作为 IDENT token
  6. i 跳过 '>'
```

**错误处理**：
- 嵌套 `<<` → 抛出词法错误
- 未闭合 `<` → 抛出词法错误
- 空内容 `<>` → 抛出词法错误

错误以 `INFIX_TOKEN_TYPE.IDENT` 返回但标记错误信息，允许部分恢复。或者直接在 token 流中插入错误 token，由上层报告。

### 2. astToInfix 修改（Scheme → 中缀）

**文件**：`src/commands/expression-converter.js`

对 `Identifier` 类型节点的处理，当前为直接输出 `node.value`。修改为：

```
检测 node.value 是否包含非标准标识符字符（连字符、?、! 等）：
  - 是 → 输出 <node.value>
  - 否 → 直接输出 node.value
```

判断条件：`/[-!?]/.test(node.value)`

### 3. astToPrefix 修改（中缀 → Scheme）

**无需修改**。tokenizer 在识别 `<...>` 时已将内容提取为纯标识符（如 `my-var`），生成的 `ident` 节点 value 不含尖括号。`astToPrefix` 直接输出即可得到正确的 Scheme 代码。

### 4. 补全逻辑修改

#### 4.1 getWordAtPosition 修改

**文件**：`src/commands/expression-converter.js`

当前 `IDENT_CHAR_RE = /[a-zA-Z0-9_@]/` 仅匹配标准字符。需要扩展以识别 `<>` 包裹区域：

**策略**：
1. 先检查光标是否在 `<...>` 内部（向前找 `<`，向后找 `>`）
2. 如果在 `<>` 内部：返回 `{ prefix: 内部光标前的文本, start: '<' 后一位, end: '>' 位置 }`，并标记 `_inAngleBrackets: true`
3. 如果不在 `<>` 内部：按现有逻辑识别普通标识符，但需排除 `<` 和 `>` 字符

#### 4.2 补全项插入行为

在 `extension.js` 的 `qp.onDidAccept` 中，变量补全的插入逻辑根据上下文决定是否添加尖括号：

| 场景 | 条件 | 插入行为 |
|------|------|----------|
| 光标在 `<>` 内部 | `_lastWordInfo._inAngleBrackets === true` | 替换括号内文本，保留括号 |
| 用户输入了开括号 `<` | 光标前的字符是 `<` | 补全 `var>`（变量名 + 闭括号） |
| 无尖括号上下文 | 默认 | 补全 `<var>`（完整尖括号包裹） |

#### 4.3 补全候选过滤

补全变量列表时，对含有连字符的变量名也进行前缀匹配。`IDENT_CHAR_RE` 扩展为 `/[a-zA-Z0-9_@\-]/`。

### 5. 解析错误在确认项上的展示

**当前行为**：确认项仅显示输入文本和"按 Enter 确认"提示。

**修改为**：
- 在显示确认项前，先用 `convertFn` 预转换输入文本
- 如果转换成功：显示预估结果（可选）
- 如果转换失败：在确认项的 `description` 中显示错误信息（如 `⚠ 错误: 未闭合的尖括号`），但仍允许用户按 Enter 确认（此时才真正弹出错误消息）

**文件**：`src/extension.js` 的 `updateItems` 函数

### 6. UI 提示更新

#### 6.1 占位符

| 命令 | 当前 | 修改后 |
|------|------|--------|
| infix2scheme | `输入 ! 浏览历史 \| 例: (W/2 + L/2)` | `输入 ! 浏览历史 \| 例: (<W-doping>/2 + <L-length>/2)` |
| scheme2infix | `输入 ! 浏览历史 \| 例: (+ (/ W 2) (/ L 2))` | 不变（Scheme 输入不需要尖括号） |

#### 6.2 帮助菜单

在 `getSupportedOperators` 返回的分类列表中添加：

```
category: '变量语法'
items: [
  { scheme: 'my-var', infix: '<my-var>', description: '连字符变量 — 中缀表达式中用尖括号包裹避免与减号混淆' },
]
```

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| `<<>>` 嵌套尖括号 | tokenizer 报错：不允许嵌套 |
| `<var` 未闭合 | tokenizer 报错：未闭合的尖括号 |
| `var>` 无开括号 | `>` 作为未知字符跳过，`var` 作为普通标识符 |
| `<>` 空尖括号 | tokenizer 报错：尖括号内不能为空 |
| `<123>` 数字内容 | 允许，视为标识符 `123`（Scheme 标识符允许数字开头时有歧义，但此处按字面处理） |
| 普通变量 `myVar` | 无需尖括号，正常处理 |
| 已有 `<var>` 内触发补全 | 替换括号内文本 |

## 影响范围

- `src/commands/expression-converter.js`：tokenizer、astToInfix、getWordAtPosition、getSupportedOperators
- `src/extension.js`：QuickPick 补全插入逻辑、错误展示逻辑、占位符文本
- 不影响 TextMate 语法、LSP Provider、补全 Provider 等其他模块
