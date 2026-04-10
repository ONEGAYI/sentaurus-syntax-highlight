# Scheme 内置函数文档 实现计划

> **执行者须知：** 推荐使用 superpowers:subagent-driven-development（逐任务派发子代理）或 superpowers:executing-plans（本会话内执行）来实施本计划。步骤使用 checkbox (`- [ ]`) 语法追踪进度。

**目标：** 为 SDE 语言的 187 个 R5RS 标准 Scheme 内置函数添加悬停文档和补全文档。

**架构：** 从 `references/r5rs-errata.md` Chapter 6 按 R5RS 章节分批提取函数文档，生成 `syntaxes/scheme_function_docs.json`。修改 `src/extension.js` 加载并合并该文件，复用现有 `formatDoc()` / `buildItems()` / `HoverProvider` 逻辑。

**技术栈：** 纯 JSON 数据文件 + CommonJS（extension.js），无构建步骤。

**设计文档：** `docs/superpowers/specs/2026-04-10-scheme-builtin-docs-design.md`

---

## 文件清单

| 文件 | 操作 | 职责 |
|------|------|------|
| `syntaxes/scheme_function_docs.json` | 新建 | 187 个 R5RS 函数的结构化文档数据 |
| `src/extension.js` | 修改第 88-103 行区域 | 加载 scheme_function_docs.json 并合并到 funcDocs |

## 跳过的函数（17 个 SDE 扩展）

以下函数不在 R5RS 标准中，本次不处理：`catch`, `cond-expand`, `define-macro`, `exit`, `file-exists?`, `file-or-directory-modify-seconds`, `fluid-let`, `gensym`, `getenv`, `get-output-string`, `nil`, `open-input-string`, `open-output-string`, `reverse!`, `substring`, `system`, `delete-file`。

---

### Task 1: 创建 JSON 文件 + 修改 extension.js

**文件：**
- 创建: `syntaxes/scheme_function_docs.json`
- 修改: `src/extension.js:88-103`

- [ ] **步骤 1: 创建初始空 JSON 文件**

```json
{}
```

写入 `syntaxes/scheme_function_docs.json`。

- [ ] **步骤 2: 修改 extension.js 加载 Scheme 文档**

在 `activate()` 函数中，`funcDocs` 加载成功后、`for` 循环之前，插入：

```js
// 加载 Scheme 内置函数文档并合并
try {
    const schemeDocsPath = path.join(__dirname, '..', 'syntaxes', 'scheme_function_docs.json');
    const schemeDocs = JSON.parse(fs.readFileSync(schemeDocsPath, 'utf8'));
    funcDocs = { ...funcDocs, ...schemeDocs };
} catch (_) {
    // Scheme 文档文件是可选的，缺失时静默跳过
}
```

- [ ] **步骤 3: 提交**

```bash
git add syntaxes/scheme_function_docs.json src/extension.js
git commit -m "feat(sde): add scheme_function_docs.json and load it in extension"
```

---

### Task 2: B1 - 布尔函数（4 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.1 Booleans（第 1601-1624 行）

**函数列表：** `boolean?`, `not`, `#t`, `#f`

- [ ] **步骤 1: 读取 R5RS §6.3.1**

读取 `references/r5rs-errata.md` 第 1601-1624 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

格式要求：
```json
{
  "boolean?": {
    "signature": "(boolean? obj)",
    "description": "如果 obj 是布尔值则返回 #t，否则返回 #f。",
    "parameters": [
      { "name": "obj", "type": "any", "desc": "任意对象" }
    ],
    "example": "(boolean? #f)  => #t\n(boolean? 0)  => #f"
  }
}
```

注意事项：
- `#t` 和 `#f` 是常量，description 说明其含义即可，parameters 为空数组
- description 使用中文
- example 使用 `=>` 表示返回值

- [ ] **步骤 3: 写入 JSON 文件**

读取当前 `syntaxes/scheme_function_docs.json`，合并新条目后写回。

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B1 boolean function docs (4 functions)"
```

---

### Task 3: B2 - 等价谓词（3 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.1 Equivalence predicates（第 1041-1168 行）

**函数列表：** `eq?`, `eqv?`, `equal?`

- [ ] **步骤 1: 读取 R5RS §6.1**

读取第 1041-1168 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

这三个函数的区别是文档重点——description 中需清晰说明 `eq?`（指针/身份比较）、`eqv?`（值比较，对数字和字符精确）、`equal?`（递归结构比较）的差异。

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B2 equivalence predicate docs (3 functions)"
```

---

### Task 4: B3 - 列表与对（31 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.2 Pairs and lists（第 1625-1874 行）

**函数列表：** `pair?`, `cons`, `car`, `cdr`, `caar`, `cadr`, `cdar`, `cddr`, `caaar`, `caadr`, `caddr`, `cdddr`, `cdadr`, `cadar`, `cdaar`, `cddar`, `set-car!`, `set-cdr!`, `null?`, `list?`, `list`, `length`, `append`, `reverse`, `list-ref`, `list-tail`, `map`, `for-each`, `assoc`, `assv`, `assq`, `member`, `memv`, `memq`

注意：实际数量可能因 HTML 实体编码（如 `&gt;`）而有出入，以 `all_keywords.json` 中的实际列表为准。

- [ ] **步骤 1: 读取 R5RS §6.3.2**

读取第 1625-1874 行（约 250 行，是最大的单节）。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `caar` 等组合操作本质是 `(car (car x))` 的缩写，description 中说明即可
- `map` 和 `for-each` 的第一个参数是 procedure 类型
- `assoc`/`assq`/`assv` 和 `member`/`memq`/`memv` 是类似函数的不同比较版本，description 中说明区别
- `set-car!` 和 `set-cdr!` 是变异操作，参数名使用 `pair`

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B3 pairs and lists docs (31 functions)"
```

---

### Task 5: B4 - 数值类型与运算（40 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.2 Numbers（第 1169-1596 行，含 §6.2.1-§6.2.6 全部子节）

**函数列表：** `number?`, `complex?`, `real?`, `rational?`, `integer?`, `exact?`, `inexact?`, `zero?`, `positive?`, `negative?`, `odd?`, `even?`, `max`, `min`, `abs`, `quotient`, `remainder`, `modulo`, `gcd`, `lcm`, `floor`, `ceiling`, `truncate`, `round`, `exact->inexact`, `inexact->exact`, `+`, `-`, `*`, `/`, `expt`, `sqrt`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `exp`, `log`, `magnitude`, `angle`, `make-rectangular`, `make-polar`, `real-part`, `imag-part`, `numerator`, `denominator`

注意：`exact->inexact` 和 `inexact->exact` 在 JSON 中可能存储为 `exact-&gt;inexact`（HTML 编码），生成时需使用原始名称。

- [ ] **步骤 1: 读取 R5RS §6.2（全部子节）**

分两次读取以控制上下文大小：
- 第 1169-1380 行（§6.2.1-§6.2.5 前半）
- 第 1381-1596 行（§6.2.5 后半-§6.2.6）

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `+`, `-`, `*`, `/` 接受可变参数，signature 使用 `(+)`, `(+ x1 x2 ...)`, `(- x)`, `(- x1 x2 ...)` 等多种形式
- `atan` 有 1 参数和 2 参数两种调用形式
- 数值类型谓词的 description 中说明类型层级关系（number ⊃ complex ⊃ real ⊃ rational ⊃ integer）
- `quotient`/`remainder`/`modulo` 三者差异需在 description 中说明

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B4 numerical function docs (40 functions)"
```

---

### Task 6: B5 - 字符（20 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.4 Characters（第 1924-2014 行）

**函数列表：** `char?`, `char=?`, `char<?`, `char>?`, `char<=?`, `char>=?`, `char-ci=?`, `char-ci<?`, `char-ci>?`, `char-ci<=?`, `char-ci>=?`, `char-alphabetic?`, `char-numeric?`, `char-whitespace?`, `char-upper-case?`, `char-lower-case?`, `char->integer`, `char-upcase`, `char-downcase`, `char-ready?`

- [ ] **步骤 1: 读取 R5RS §6.3.4**

读取第 1924-2014 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `char-ci=?` 等大小写不敏感比较，description 中说明与对应大小写敏感版本的区别
- `char->integer` 返回字符的 Unicode/ASCII 序号
- `char-ready?` 是 I/O 相关的，返回端口是否有字符可读

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B5 character function docs (20 functions)"
```

---

### Task 7: B6 - 字符串（21 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.5 Strings（第 2015-2154 行）

**函数列表：** `string?`, `string`, `make-string`, `string-length`, `string-ref`, `string-set!`, `string=?`, `string<?`, `string>?`, `string<=?`, `string>=?`, `string-ci=?`, `string-ci<?`, `string-ci>?`, `string-ci<=?`, `string-ci>=?`, `substring`, `string-append`, `string->list`, `string->number`, `string->symbol`, `string-copy`, `string-fill!`

注意：需对照 `all_keywords.json` 中实际存在的函数，跳过不在列表中的（如 `make-string`、`substring` 等可能不在 SDE FUNCTION 中）。

- [ ] **步骤 1: 读取 R5RS §6.3.5**

读取第 2015-2154 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `string-set!` 是变异操作
- `string->number` 可能返回 `#f`（转换失败时），需在 description 中说明
- `string-ci=?` 等大小写不敏感比较

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B6 string function docs (21 functions)"
```

---

### Task 8: B7 - 符号（2 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.3 Symbols（第 1875-1923 行）

**函数列表：** `symbol?`（`symbol->string` 和 `string->symbol` 如果在 SDE FUNCTION 列表中则一并处理）

- [ ] **步骤 1: 读取 R5RS §6.3.3**

读取第 1875-1923 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B7 symbol function docs"
```

---

### Task 9: B8 - 控制特性（25 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.4 Control features（第 2229-2449 行）+ §6.5 Eval（第 2450-2479 行）

**函数列表：** `if`, `cond`, `case`, `and`, `or`, `when`, `unless`, `else`, `lambda`, `define`, `let`, `let*`, `letrec`, `begin`, `do`, `delay`, `force`, `quote`, `quasiquote`, `unquote`, `unquote-splicing`, `define-syntax`, `syntax-rules`, `apply`, `call-with-current-continuation`, `call-with-values`, `dynamic-wind`, `eval`, `load`, `values`

注意：需对照 `all_keywords.json` 过滤。`when`、`unless`、`quasiquote`、`unquote`、`unquote-splicing`、`define-syntax`、`syntax-rules` 等可能不在 SDE FUNCTION 列表中。

- [ ] **步骤 1: 读取 R5RS §6.4 和 §6.5**

分两次读取：
- 第 2229-2350 行（§6.4 前半：条件、绑定、顺序）
- 第 2351-2479 行（§6.4 后半 + §6.5 Eval）

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `if`、`cond`、`case`、`and`、`or`、`lambda`、`define`、`let`、`let*`、`letrec`、`begin`、`do`、`quote` 是**特殊形式**（special form），不是过程。description 中注明"特殊形式"，parameters 描述语法变元而非参数
- `call-with-current-continuation` 签名较长，可简写
- `apply` 和 `values` 是高阶过程
- `eval` 和 `load` 涉及求值环境

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B8 control feature docs (25 functions)"
```

---

### Task 10: B9 - 输入/输出（20 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.6 Input and output（第 2480-2591 行，含 §6.6.1-§6.6.3）

**函数列表：** `read`, `read-char`, `peek-char`, `eof-object?`, `write`, `display`, `newline`, `write-char`, `open-input-file`, `open-output-file`, `close-input-port`, `close-output-port`, `with-input-from-file`, `with-output-to-file`, `current-input-port`, `current-output-port`, `port?`, `input-port?`, `output-port?`, `read-line`, `char-ready?`

注意：需对照 `all_keywords.json` 过滤，`char-ready?` 可能已在 B5 中处理。

- [ ] **步骤 1: 读取 R5RS §6.6**

读取第 2480-2591 行。

- [ ] **步骤 2: 为每个函数生成 JSON 条目**

注意：
- `read` 和 `write` 是核心 I/O 过程
- `display` vs `write` 的区别：`display` 不输出字符串的引号和字符的 `#\` 前缀
- `eof-object?` 用于检测文件末尾
- 端口相关函数的参数类型为 `port`/`input-port`/`output-port`

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B9 I/O function docs (20 functions)"
```

---

### Task 11: B10 - 向量 + 过程 + 杂项（~21 个）

**R5RS 来源：** `references/r5rs-errata.md` §6.3.6 Vectors（第 2155-2228 行）+ 过程相关（散布在各节）

**函数列表：** `vector?`, `make-vector`, `vector`, `vector-ref`, `vector-set!`, `vector-length`, `vector-fill!`, `procedure?`, `apply`, `values`, `call-with-values`, `dynamic-wind`

注意：
- `apply`、`values`、`call-with-values`、`dynamic-wind` 可能已在 B8 中处理，需避免重复
- 如已在 B8 中处理，则本批次仅处理向量相关 7 个函数

- [ ] **步骤 1: 读取 R5RS §6.3.6**

读取第 2155-2228 行。

- [ ] **步骤 2: 检查并补全遗漏函数**

对照 `all_keywords.json` 的 SDE FUNCTION 列表，确认哪些函数尚未被前面批次覆盖，为遗漏的函数生成文档。

- [ ] **步骤 3: 合并写入 JSON 文件**

- [ ] **步骤 4: 提交**

```bash
git add syntaxes/scheme_function_docs.json
git commit -m "docs(sde): add B10 vector and misc function docs"
```

---

### Task 12: 最终验证与收尾

- [ ] **步骤 1: 验证 JSON 格式正确性**

```bash
python3 -c "import json; data = json.load(open('syntaxes/scheme_function_docs.json')); print(f'共 {len(data)} 个函数文档')"
```

预期：输出约 187 个函数。

- [ ] **步骤 2: 交叉验证覆盖率**

```bash
python3 -c "
import json
with open('syntaxes/all_keywords.json') as f:
    keywords = json.load(f)
with open('syntaxes/scheme_function_docs.json') as f:
    docs = json.load(f)

sde_funcs = set(keywords['sde']['FUNCTION'])
skip = {'catch','cond-expand','define-macro','exit','file-exists?',
        'file-or-directory-modify-seconds','fluid-let','gensym','getenv',
        'get-output-string','nil','open-input-string','open-output-string',
        'reverse!','substring','system','delete-file'}
target = sde_funcs - skip
covered = target & set(docs.keys())
missing = target - set(docs.keys())
print(f'目标: {len(target)}, 已覆盖: {len(covered)}, 缺失: {len(missing)}')
if missing:
    print(f'缺失函数: {sorted(missing)}')
extra = set(docs.keys()) - sde_funcs
if extra:
    print(f'多余函数: {sorted(extra)}')
"
```

预期：缺失 0，多余 0。

- [ ] **步骤 3: VSCode 手动测试**

使用 Extension Development Host（F5）加载扩展：
1. 打开一个 `.scm` 文件
2. 输入 `car`、`map`、`if`、`+` 等函数名，验证补全列表中显示文档
3. 悬停在函数名上，验证 Hover 提示显示正确的签名和说明

- [ ] **步骤 4: 最终提交**

如有修复则提交，否则跳过。
