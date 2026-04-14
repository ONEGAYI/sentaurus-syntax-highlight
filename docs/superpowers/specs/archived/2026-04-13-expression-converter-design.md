# Scheme 表达式双向转换器设计

## 概述

为 SDE (Scheme) 语言添加命令面板命令，实现 Scheme 前缀表达式与中缀/函数调用表达式之间的双向转换。用户在编写 Sentaurus SDE 脚本时，经常需要处理繁琐的前缀运算式（如 `(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)`），此功能允许用户以自然的中缀语序（如 `(W/2+Lgate/2+Wspacer)/-2`）编写并自动转换，或反向操作。

## 模块结构

```
src/
├── extension.js                       ← 注册 3 个新命令（入口）
├── commands/                          ← 新目录，辅助功能命令模块
│   └── expression-converter.js        ← 表达式转换核心逻辑
├── lsp/scheme-parser.js               ← 现有，复用 parse() 进行前缀解析
└── ...
```

**新增文件** `src/commands/expression-converter.js` 导出三个函数：
- `prefixToInfix(text)` — Scheme 前缀 → 中缀/函数调用
- `infixToPrefix(text)` — 中缀/函数调用 → Scheme 前缀
- `getSupportedOperators()` — 返回支持的运算符和函数列表（供帮助命令使用）

## 运算符分类表

| 类别 | Scheme 前缀 | 中缀/函数调用 | 优先级 |
|------|------------|-------------|--------|
| 算术 | `(+ a b ...)` | `a + b + ...` | 1（最低） |
| 算术 | `(- a b)` | `a - b` | 1 |
| 算术 | `(* a b ...)` | `a * b * ...` | 2 |
| 算术 | `(/ a b)` | `a / b` | 2 |
| 幂 | `(expt a b)` | `a ^ b` | 3 |
| 取模 | `(modulo a b)` | `a % b` | 2 |
| 取余 | `(remainder a b)` | `a %% b` | 2 |
| 取整商 | `(quotient a b)` | `a // b` | 2 |
| 函数 | `(sin x)` | `sin(x)` | 4（最高） |
| 函数 | `(cos x)` | `cos(x)` | 4 |
| 函数 | `(tan x)` | `tan(x)` | 4 |
| 函数 | `(asin x)` | `asin(x)` | 4 |
| 函数 | `(acos x)` | `acos(x)` | 4 |
| 函数 | `(atan y)` / `(atan y x)` | `atan(y)` / `atan(y, x)` | 4 |
| 函数 | `(sqrt x)` | `sqrt(x)` | 4 |
| 函数 | `(abs x)` | `abs(x)` | 4 |
| 函数 | `(exp x)` | `exp(x)` | 4 |
| 函数 | `(log x)` | `log(x)` | 4 |
| 函数 | `(min a b ...)` | `min(a, b, ...)` | 4 |
| 函数 | `(max a b ...)` | `max(a, b, ...)` | 4 |
| 函数 | `(floor x)` | `floor(x)` | 4 |
| 函数 | `(ceiling x)` | `ceil(x)` | 4 |
| 函数 | `(round x)` | `round(x)` | 4 |

## 前缀→中缀转换逻辑

**核心算法**：复用 `scheme-parser.js` 的 `parse()` 函数，得到 AST 后递归遍历转换。

### 转换规则

1. **基础值**：数字、标识符（变量名）原样保留
2. **算术运算** `(+ a b c)` → `(a + b + c)`
   - `+` 和 `*` 支持多参数：`(+ a b c)` → `(a + b + c)`
   - `-` 和 `/` 支持链式多参数：`(- a b c)` → `(a - b - c)`
3. **运算符优先级与括号**：
   - 当子表达式的优先级低于父表达式时，自动加括号
   - `(* (+ a b) c)` → `(a + b) * c`
   - 同优先级不需要括号：`(+ (* a b) (* c d))` → `a * b + c * d`
4. **负数处理**：`(- 5)` → `-5`（单参数减号视为取负）
5. **数学函数**：`(sin x)` → `sin(x)`，`(expt a b)` → `a ^ b`
6. **非数学表达式**：无法识别的表达式原样返回，不做转换
7. **特殊边界**：
   - `(/ a -2)` → `a / -2`（负数作为操作数直接保留）
   - `(* -1 x)` → `-x`（乘以 -1 简化为取负）

### 错误处理

如果输入不是合法的 Scheme 表达式（如括号不匹配），通过 `vscode.window.showErrorMessage()` 气泡通知用户具体错误原因。用户有义务保证输入合法。

## 中缀→前缀转换逻辑

**核心算法**：自写递归下降解析器，处理中缀表达式。

### Tokenizer

将输入拆分为 token（数字、标识符、运算符 `+ - * / ^ %`、括号 `(` `)` `,`）。

### 递归下降解析（按优先级分层）

```
expression → term (('+' | '-') term)*
term       → power (('*' | '/' | '%' | '%%' | '//') power)*
power      → unary ('^' unary)*          // 右结合
unary      → '-' unary | call
call       → IDENTIFIER '(' args ')' | atom
atom       → NUMBER | IDENTIFIER | '(' expression ')'
```

### 转换规则

- `a + b` → `(+ a b)`
- `a * b + c` → `(+ (* a b) c)`（优先级自动处理）
- `a ^ b` → `(expt a b)`
- `sin(x)` → `(sin x)`
- `min(a, b, c)` → `(min a b c)`（逗号分隔的多参数函数）
- `-a` → `(- a)`（单参数取负）
- `a / -2` → `(/ a -2)`（负数作为直接操作数）

### 错误处理

解析失败时通过 `showErrorMessage` 通知用户具体错误位置。

## 命令注册与用户交互

### package.json 命令注册

```json
{
  "commands": [
    { "command": "sentaurus.scheme2infix", "title": "Sentaurus: Scheme → Infix" },
    { "command": "sentaurus.infix2scheme", "title": "Sentaurus: Infix → Scheme" },
    { "command": "sentaurus.exprHelp", "title": "Sentaurus: Expression Help" }
  ]
}
```

### 转换命令交互流程

```
编辑器有选中文本？
├── 是 → 直接转换选中文本 → 替换选区（可撤销，VSCode 原生支持 Ctrl+Z）
└── 否 → 弹出 InputBox
         ├── placeholder: "↑↓ 浏览历史 | 输入表达式..."
         ├── prompt: "输入 XXX 表达式进行转换"
         ├── history: 最近 20 条记录（上下箭头切换）
         └── 转换结果
             ├── 有活跃编辑器 → 在光标处插入结果文本，并全选插入内容（方便 Ctrl+C/X）
             └── 无活跃编辑器 → 复制到剪贴板 + showInformationMessage 提示
```

### 帮助命令交互流程

```
弹出 QuickPick
├── 分组展示运算符和函数
│   ├── 📐 算术运算符: +, -, *, /, expt, modulo, remainder, quotient
│   ├── 📊 数学函数: sin, cos, tan, asin, acos, atan, sqrt, abs, exp, log, min, max, floor, ceil, round
│   └── 🔧 格式说明: 中缀写法 vs 函数调用写法的规则
├── 选中某项 → 显示详细用法（detail 字段）
└── 可选择插入代码片段到编辑器
```

### 历史记录

使用 VSCode InputBox 自带的 `history` 参数，存储在内存中（会话级别），上限 20 条。

## 测试策略

纯 Node.js `assert` 方式，与现有 `tests/test-definitions.js` 风格一致。

**测试文件**：`tests/test-expression-converter.js`

### 测试用例

1. **前缀→中缀基础测试**：
   - `(+ 1 2)` → `(1 + 2)`
   - `(* 3 4)` → `(3 * 4)`
   - `(/ W 2)` → `(W / 2)`

2. **前缀→中缀嵌套测试**：
   - `(/ (+ (/ W 2) (/ Lgate 2) Wspacer) -2)` → `((W / 2 + Lgate / 2 + Wspacer) / -2)`
   - `(* (+ a b) (- c d))` → `((a + b) * (c - d))`

3. **前缀→中缀函数测试**：
   - `(sin x)` → `sin(x)`
   - `(expt a 2)` → `a ^ 2`
   - `(min a b c)` → `min(a, b, c)`

4. **中缀→前缀基础测试**：
   - `1 + 2` → `(+ 1 2)`
   - `W / 2` → `(/ W 2)`
   - `a ^ 2` → `(expt a 2)`

5. **中缀→前缀函数测试**：
   - `sin(x)` → `(sin x)`
   - `sqrt(a + b)` → `(sqrt (+ a b))`

6. **往返一致性测试**：
   - `前缀→中缀→前缀` 结果应与原表达式语义等价
   - `中缀→前缀→中缀` 结果应与原表达式语义等价

7. **错误处理测试**：
   - 括号不匹配 → 返回错误
   - 空输入 → 返回空字符串或提示

8. **边界条件测试**：
   - 单个数字/标识符：`42` → `42`（双向不变）
   - 取负：`(- 5)` → `-5`，`-5` → `(- 5)`
   - 多参数加法：`(+ a b c d)` → `(a + b + c + d)`

## 约束

- **仅限 SDE 语言**：此功能只对 SDE (Scheme) 语言文件生效
- **零原生依赖**：继续遵守项目约束，纯 CommonJS 实现
- **不做计算**：只做格式转换，不处理除零等计算错误
- **会话级历史**：历史记录不持久化到磁盘
