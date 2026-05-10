# Tcl 内建函数补全实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全 31 个 `expr` 数学函数（高亮+文档）、修复 9 处语法/文档不匹配、新增 18 个常用 Tcl 核心命令（高亮+文档）

**Architecture:** 三层同步新增——TextMate 语法正则（语法文件 5 个）→ 函数文档 JSON（2 新文件 + 2 修改文件）→ 补全/悬停注册（extension.js + all_keywords.json）

**Tech Stack:** JSON (TextMate grammar), JavaScript (VSCode extension API), 纯 CommonJS 无构建

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `syntaxes/tcl_expr_mathfunc_docs.json` | 31 个数学函数英文文档 |
| 新建 | `syntaxes/tcl_expr_mathfunc_docs.zh-CN.json` | 31 个数学函数中文文档 |
| 修改 | `syntaxes/sdevice.tmLanguage.json` | 更新 support.function + 新增 mathfunc 正则 |
| 修改 | `syntaxes/sprocess.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/emw.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/inspect.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/svisual.tmLanguage.json` | 同上 |
| 修改 | `syntaxes/tcl_command_docs.json` | 新增 22 条命令文档（英文） |
| 修改 | `syntaxes/tcl_command_docs.zh-CN.json` | 新增 22 条命令文档（中文） |
| 修改 | `syntaxes/all_keywords.json` | 5 工具各新增 `MATHFUNC` 关键词组 |
| 修改 | `src/extension.js` | 加载 tcl_expr_mathfunc_docs |

---

### Task 1: 创建数学函数英文文档

**Files:**
- Create: `syntaxes/tcl_expr_mathfunc_docs.json`

- [ ] **Step 1: 写入 31 个数学函数文档**

```json
{
  "abs": {
    "signature": "abs(arg)",
    "description": "Returns the absolute value of arg. If arg is an integer, returns an integer; if arg is a floating-point number, returns a floating-point number.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value (integer or floating point)."}],
    "example": "set a [expr {abs(-3.14)}]   ;# returns 3.14\nset b [expr {abs(-5)}]      ;# returns 5"
  },
  "acos": {
    "signature": "acos(arg)",
    "description": "Returns the arc cosine of arg, in the range [0, pi] radians. arg must be in the range [-1, 1].",
    "parameters": [{"name": "arg", "type": "number", "desc": "A value in [-1, 1]."}],
    "example": "set angle [expr {acos(0.5)}]  ;# returns approx 1.0472 (pi/3)"
  },
  "asin": {
    "signature": "asin(arg)",
    "description": "Returns the arc sine of arg, in the range [-pi/2, pi/2] radians. arg must be in the range [-1, 1].",
    "parameters": [{"name": "arg", "type": "number", "desc": "A value in [-1, 1]."}],
    "example": "set angle [expr {asin(0.5)}]  ;# returns approx 0.5236 (pi/6)"
  },
  "atan": {
    "signature": "atan(arg)",
    "description": "Returns the arc tangent of arg, in the range [-pi/2, pi/2] radians.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set angle [expr {atan(1.0)}]  ;# returns approx 0.7854 (pi/4)"
  },
  "atan2": {
    "signature": "atan2(y, x)",
    "description": "Returns the four-quadrant arc tangent of y/x, in the range [-pi, pi] radians. x and y cannot both be 0. Uses the signs of both arguments to determine the correct quadrant.",
    "parameters": [
      {"name": "y", "type": "number", "desc": "The y-coordinate."},
      {"name": "x", "type": "number", "desc": "The x-coordinate."}
    ],
    "example": "set angle [expr {atan2(1.0, 0.0)}]   ;# returns approx 1.5708 (pi/2)\nset angle [expr {atan2(-1.0, -1.0)}] ;# returns approx -2.3562 (-3pi/4)"
  },
  "bool": {
    "signature": "bool(arg)",
    "description": "Returns 0 if arg is zero or the string \"false\", otherwise 1. Also accepts \"true\" as true.",
    "parameters": [{"name": "arg", "type": "number|string", "desc": "A numeric value or string \"true\"/\"false\"."}],
    "example": "set b1 [expr {bool(0)}]            ;# returns 0\nset b2 [expr {bool(42)}]           ;# returns 1\nset b3 [expr {bool(\"false\")}]      ;# returns 0"
  },
  "ceil": {
    "signature": "ceil(arg)",
    "description": "Returns the smallest integer value not less than arg, as a floating-point number (with zero fractional part). This is ceiling (round up).",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set c1 [expr {ceil(3.14)}]   ;# returns 4.0\nset c2 [expr {ceil(-3.14)}]  ;# returns -3.0\nset c3 [expr {ceil(5.0)}]    ;# returns 5.0"
  },
  "cos": {
    "signature": "cos(arg)",
    "description": "Returns the cosine of arg, measured in radians.",
    "parameters": [{"name": "arg", "type": "number", "desc": "An angle in radians."}],
    "example": "set val [expr {cos(0.0)}]        ;# returns 1.0\nset val [expr {cos(3.14159/2)}] ;# returns approx 0.0"
  },
  "cosh": {
    "signature": "cosh(arg)",
    "description": "Returns the hyperbolic cosine of arg. Results may overflow for large arguments, causing an error.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set val [expr {cosh(0.0)}]  ;# returns 1.0\nset val [expr {cosh(1.0)}]  ;# returns approx 1.5431"
  },
  "double": {
    "signature": "double(arg)",
    "description": "Converts arg to a double-precision floating-point number. If arg is an integer that exceeds the range of double, returns Inf or -Inf.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set d1 [expr {double(42)}]     ;# returns 42.0\nset d2 [expr {double(3)}]      ;# returns 3.0"
  },
  "entier": {
    "signature": "entier(arg)",
    "description": "Returns the integer part of arg (truncation toward zero). Unlike int() and wide(), the result has unlimited integer range. Introduced in Tcl 8.5 to replace implicit truncation behavior.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set e1 [expr {entier(3.99)}]   ;# returns 3\nset e2 [expr {entier(-3.99)}]  ;# returns -3"
  },
  "exp": {
    "signature": "exp(arg)",
    "description": "Returns e raised to the power of arg (the exponential function). Results may overflow, causing an error.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set val [expr {exp(0.0)}]   ;# returns 1.0\nset val [expr {exp(1.0)}]   ;# returns approx 2.7183"
  },
  "floor": {
    "signature": "floor(arg)",
    "description": "Returns the largest integer value not greater than arg, as a floating-point number (with zero fractional part). This is floor (round down).",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set f1 [expr {floor(3.14)}]   ;# returns 3.0\nset f2 [expr {floor(-3.14)}]  ;# returns -4.0"
  },
  "fmod": {
    "signature": "fmod(x, y)",
    "description": "Returns the floating-point remainder of x divided by y. If y is 0, an error is raised.",
    "parameters": [
      {"name": "x", "type": "number", "desc": "The dividend."},
      {"name": "y", "type": "number", "desc": "The divisor (must not be zero)."}
    ],
    "example": "set r1 [expr {fmod(10.0, 3.0)}]  ;# returns 1.0\nset r2 [expr {fmod(7.5, 2.0)}]   ;# returns 1.5"
  },
  "hypot": {
    "signature": "hypot(x, y)",
    "description": "Returns the length of the hypotenuse of a right triangle with sides x and y: sqrt(x*x + y*y). More numerically stable than manual computation, avoiding intermediate overflow or underflow.",
    "parameters": [
      {"name": "x", "type": "number", "desc": "Length of one side."},
      {"name": "y", "type": "number", "desc": "Length of the other side."}
    ],
    "example": "set h [expr {hypot(3.0, 4.0)}]  ;# returns 5.0\nset h [expr {hypot(1e200, 1e200)}] ;# avoids overflow, returns approx 1.414e200"
  },
  "int": {
    "signature": "int(arg)",
    "description": "Returns the integer part of arg by truncation toward zero. The result is limited to the machine word size (typically 32 or 64 bits). For unlimited integer range, use entier() instead.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set i1 [expr {int(3.99)}]   ;# returns 3\nset i2 [expr {int(-3.99)}]  ;# returns -3"
  },
  "isqrt": {
    "signature": "isqrt(arg)",
    "description": "Returns the integer part of the square root of arg. arg must be a non-negative integer. Unlike sqrt(), the result is an arbitrary-precision integer. Introduced in Tcl 8.5.",
    "parameters": [{"name": "arg", "type": "integer", "desc": "A non-negative integer."}],
    "example": "set i [expr {isqrt(16)}]    ;# returns 4\nset i [expr {isqrt(20)}]    ;# returns 4"
  },
  "log": {
    "signature": "log(arg)",
    "description": "Returns the natural logarithm (base e) of arg. arg must be a positive value.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A positive numeric value."}],
    "example": "set val [expr {log(1.0)}]    ;# returns 0.0\nset val [expr {log(2.7183)}] ;# returns approx 1.0"
  },
  "log10": {
    "signature": "log10(arg)",
    "description": "Returns the base-10 logarithm of arg. arg must be a positive value.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A positive numeric value."}],
    "example": "set val [expr {log10(100.0)}]  ;# returns 2.0\nset val [expr {log10(1.0)}]    ;# returns 0.0"
  },
  "max": {
    "signature": "max(arg ...)",
    "description": "Returns the maximum value among all its arguments. Accepts one or more numeric arguments. If exactly one argument is given, returns that argument. The return type matches the input type (integer or floating-point).",
    "parameters": [{"name": "arg", "type": "number", "desc": "One or more numeric values to compare."}],
    "example": "set m1 [expr {max(3, 7, 2, 9)}]   ;# returns 9\nset m2 [expr {max(-1.5, -2.0)}]  ;# returns -1.5"
  },
  "min": {
    "signature": "min(arg ...)",
    "description": "Returns the minimum value among all its arguments. Accepts one or more numeric arguments. If exactly one argument is given, returns that argument.",
    "parameters": [{"name": "arg", "type": "number", "desc": "One or more numeric values to compare."}],
    "example": "set m1 [expr {min(3, 7, 2, 9)}]   ;# returns 2\nset m2 [expr {min(-1.5, -2.0)}]  ;# returns -2.0"
  },
  "pow": {
    "signature": "pow(x, y)",
    "description": "Returns x raised to the power y. If x is negative, y must be an integer value. Results may overflow.",
    "parameters": [
      {"name": "x", "type": "number", "desc": "The base."},
      {"name": "y", "type": "number", "desc": "The exponent. Must be integral if x is negative."}
    ],
    "example": "set p1 [expr {pow(2.0, 10.0)}]   ;# returns 1024.0\nset p2 [expr {pow(9.0, 0.5)}]    ;# returns 3.0 (square root)"
  },
  "rand": {
    "signature": "rand()",
    "description": "Returns a pseudo-random floating-point number in the range (0, 1). The random number generator is a simple linear congruential generator and is NOT cryptographically secure. The seed is initialized from the system clock. Use srand() to set a specific seed.",
    "parameters": [],
    "example": "set r [expr {rand()}]         ;# e.g., 0.5321\nset scaled [expr {int(rand() * 100)}] ;# random integer 0-99"
  },
  "round": {
    "signature": "round(arg)",
    "description": "Rounds arg to the nearest integer value. If arg is exactly halfway between two integers, rounds to the nearest even integer (banker's rounding). If arg is already an integer, returns it unchanged.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set r1 [expr {round(3.4)}]   ;# returns 3\nset r2 [expr {round(3.5)}]   ;# returns 4\nset r3 [expr {round(2.5)}]   ;# returns 2"
  },
  "sin": {
    "signature": "sin(arg)",
    "description": "Returns the sine of arg, measured in radians.",
    "parameters": [{"name": "arg", "type": "number", "desc": "An angle in radians."}],
    "example": "set val [expr {sin(0.0)}]        ;# returns 0.0\nset val [expr {sin(3.14159/2)}] ;# returns approx 1.0"
  },
  "sinh": {
    "signature": "sinh(arg)",
    "description": "Returns the hyperbolic sine of arg. Results may overflow for large arguments, causing an error.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set val [expr {sinh(0.0)}]  ;# returns 0.0\nset val [expr {sinh(1.0)}]  ;# returns approx 1.1752"
  },
  "sqrt": {
    "signature": "sqrt(arg)",
    "description": "Returns the square root of arg. arg must be non-negative. May return Inf for very large arguments.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A non-negative numeric value."}],
    "example": "set s1 [expr {sqrt(16.0)}]  ;# returns 4.0\nset s2 [expr {sqrt(2.0)}]   ;# returns approx 1.4142"
  },
  "srand": {
    "signature": "srand(arg)",
    "description": "Seeds the random number generator used by rand() with the integer arg. The seed is normally initialized from the system clock. Returns the first random number of the new sequence (same as calling rand() immediately after srand).",
    "parameters": [{"name": "arg", "type": "integer", "desc": "The seed value for the random number generator."}],
    "example": "expr {srand(42)}        ;# seed with 42, returns first random\nset r [expr {rand()}]    ;# next random value"
  },
  "tan": {
    "signature": "tan(arg)",
    "description": "Returns the tangent of arg, measured in radians.",
    "parameters": [{"name": "arg", "type": "number", "desc": "An angle in radians."}],
    "example": "set val [expr {tan(0.0)}]        ;# returns 0.0\nset val [expr {tan(3.14159/4)}] ;# returns approx 1.0"
  },
  "tanh": {
    "signature": "tanh(arg)",
    "description": "Returns the hyperbolic tangent of arg. The result is always in the range (-1, 1).",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set val [expr {tanh(0.0)}]  ;# returns 0.0\nset val [expr {tanh(10.0)}] ;# returns approx 1.0"
  },
  "wide": {
    "signature": "wide(arg)",
    "description": "Converts arg to a 64-bit integer (equivalent to C's long long type). The value is truncated toward zero. For unlimited integer range, use entier() instead.",
    "parameters": [{"name": "arg", "type": "number", "desc": "A numeric value."}],
    "example": "set w [expr {wide(3.99)}]   ;# returns 3\nset w [expr {wide(2.0 ** 40)}] ;# returns 1099511627776"
  }
}
```

- [ ] **Step 2: 验证文件格式**

```bash
node -e "JSON.parse(require('fs').readFileSync('syntaxes/tcl_expr_mathfunc_docs.json','utf8')); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add syntaxes/tcl_expr_mathfunc_docs.json
git commit -m "feat: 新增 31 个 Tcl expr 数学函数英文文档"
```

---

### Task 2: 创建数学函数中文文档

**Files:**
- Create: `syntaxes/tcl_expr_mathfunc_docs.zh-CN.json`

- [ ] **Step 1: 写入 31 个数学函数中文文档**

```json
{
  "abs": {
    "signature": "abs(arg)",
    "description": "返回 arg 的绝对值。若 arg 为整数则返回整数，若为浮点数则返回浮点数。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值（整数或浮点数）。"}],
    "example": "set a [expr {abs(-3.14)}]   ;# returns 3.14\nset b [expr {abs(-5)}]      ;# returns 5"
  },
  "acos": {
    "signature": "acos(arg)",
    "description": "返回 arg 的反余弦值，值域 [0, pi] 弧度。arg 必须在 [-1, 1] 范围内。",
    "parameters": [{"name": "arg", "type": "number", "desc": "[-1, 1] 范围内的数值。"}],
    "example": "set angle [expr {acos(0.5)}]  ;# returns approx 1.0472 (pi/3)"
  },
  "asin": {
    "signature": "asin(arg)",
    "description": "返回 arg 的反正弦值，值域 [-pi/2, pi/2] 弧度。arg 必须在 [-1, 1] 范围内。",
    "parameters": [{"name": "arg", "type": "number", "desc": "[-1, 1] 范围内的数值。"}],
    "example": "set angle [expr {asin(0.5)}]  ;# returns approx 0.5236 (pi/6)"
  },
  "atan": {
    "signature": "atan(arg)",
    "description": "返回 arg 的反正切值，值域 [-pi/2, pi/2] 弧度。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set angle [expr {atan(1.0)}]  ;# returns approx 0.7854 (pi/4)"
  },
  "atan2": {
    "signature": "atan2(y, x)",
    "description": "返回 y/x 的四象限反正切值，值域 [-pi, pi] 弧度。x 和 y 不能同时为 0。使用两个参数的符号确定正确的象限。",
    "parameters": [
      {"name": "y", "type": "number", "desc": "纵坐标。"},
      {"name": "x", "type": "number", "desc": "横坐标。"}
    ],
    "example": "set angle [expr {atan2(1.0, 0.0)}]   ;# returns approx 1.5708 (pi/2)\nset angle [expr {atan2(-1.0, -1.0)}] ;# returns approx -2.3562 (-3pi/4)"
  },
  "bool": {
    "signature": "bool(arg)",
    "description": "若 arg 为零或字符串 \"false\" 则返回 0，否则返回 1。也接受 \"true\" 作为真值。",
    "parameters": [{"name": "arg", "type": "number|string", "desc": "数值或字符串 \"true\"/\"false\"。"}],
    "example": "set b1 [expr {bool(0)}]            ;# returns 0\nset b2 [expr {bool(42)}]           ;# returns 1\nset b3 [expr {bool(\"false\")}]      ;# returns 0"
  },
  "ceil": {
    "signature": "ceil(arg)",
    "description": "返回不小于 arg 的最小整数值（向上取整），结果为浮点数（小数部分为零）。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set c1 [expr {ceil(3.14)}]   ;# returns 4.0\nset c2 [expr {ceil(-3.14)}]  ;# returns -3.0\nset c3 [expr {ceil(5.0)}]    ;# returns 5.0"
  },
  "cos": {
    "signature": "cos(arg)",
    "description": "返回 arg（以弧度为单位）的余弦值。",
    "parameters": [{"name": "arg", "type": "number", "desc": "以弧度为单位的角度。"}],
    "example": "set val [expr {cos(0.0)}]        ;# returns 1.0\nset val [expr {cos(3.14159/2)}] ;# returns approx 0.0"
  },
  "cosh": {
    "signature": "cosh(arg)",
    "description": "返回 arg 的双曲余弦值。大参数可能导致溢出错误。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set val [expr {cosh(0.0)}]  ;# returns 1.0\nset val [expr {cosh(1.0)}]  ;# returns approx 1.5431"
  },
  "double": {
    "signature": "double(arg)",
    "description": "将 arg 转换为双精度浮点数。若 arg 为超出双精度范围的整数，返回 Inf 或 -Inf。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set d1 [expr {double(42)}]     ;# returns 42.0\nset d2 [expr {double(3)}]      ;# returns 3.0"
  },
  "entier": {
    "signature": "entier(arg)",
    "description": "返回 arg 的整数部分（向零截断）。与 int()/wide() 不同，结果无上限整数范围。Tcl 8.5 引入，用于替代旧的隐式截断行为。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set e1 [expr {entier(3.99)}]   ;# returns 3\nset e2 [expr {entier(-3.99)}]  ;# returns -3"
  },
  "exp": {
    "signature": "exp(arg)",
    "description": "返回 e 的 arg 次幂（指数函数）。结果可能溢出导致错误。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set val [expr {exp(0.0)}]   ;# returns 1.0\nset val [expr {exp(1.0)}]   ;# returns approx 2.7183"
  },
  "floor": {
    "signature": "floor(arg)",
    "description": "返回不大于 arg 的最大整数值（向下取整），结果为浮点数（小数部分为零）。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set f1 [expr {floor(3.14)}]   ;# returns 3.0\nset f2 [expr {floor(-3.14)}]  ;# returns -4.0"
  },
  "fmod": {
    "signature": "fmod(x, y)",
    "description": "返回 x 除以 y 的浮点余数。若 y 为 0 则报错。",
    "parameters": [
      {"name": "x", "type": "number", "desc": "被除数。"},
      {"name": "y", "type": "number", "desc": "除数（不能为零）。"}
    ],
    "example": "set r1 [expr {fmod(10.0, 3.0)}]  ;# returns 1.0\nset r2 [expr {fmod(7.5, 2.0)}]   ;# returns 1.5"
  },
  "hypot": {
    "signature": "hypot(x, y)",
    "description": "返回直角三角形的斜边长度：sqrt(x*x + y*y)。比手动计算更数值稳定，可避免中间溢出或下溢。",
    "parameters": [
      {"name": "x", "type": "number", "desc": "一条直角边的长度。"},
      {"name": "y", "type": "number", "desc": "另一条直角边的长度。"}
    ],
    "example": "set h [expr {hypot(3.0, 4.0)}]  ;# returns 5.0\nset h [expr {hypot(1e200, 1e200)}] ;# avoids overflow, returns approx 1.414e200"
  },
  "int": {
    "signature": "int(arg)",
    "description": "返回 arg 向零截断后的整数部分。结果限制在机器字长范围内（通常 32 或 64 位）。需要无限制整数范围时请使用 entier()。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set i1 [expr {int(3.99)}]   ;# returns 3\nset i2 [expr {int(-3.99)}]  ;# returns -3"
  },
  "isqrt": {
    "signature": "isqrt(arg)",
    "description": "返回 arg 平方根的整数部分（向下取整）。arg 必须为非负整数。与 sqrt() 不同，结果为任意精度整数。Tcl 8.5 引入。",
    "parameters": [{"name": "arg", "type": "integer", "desc": "非负整数。"}],
    "example": "set i [expr {isqrt(16)}]    ;# returns 4\nset i [expr {isqrt(20)}]    ;# returns 4"
  },
  "log": {
    "signature": "log(arg)",
    "description": "返回 arg 的自然对数（以 e 为底）。arg 必须为正数。",
    "parameters": [{"name": "arg", "type": "number", "desc": "正值。"}],
    "example": "set val [expr {log(1.0)}]    ;# returns 0.0\nset val [expr {log(2.7183)}] ;# returns approx 1.0"
  },
  "log10": {
    "signature": "log10(arg)",
    "description": "返回 arg 以 10 为底的对数。arg 必须为正数。",
    "parameters": [{"name": "arg", "type": "number", "desc": "正值。"}],
    "example": "set val [expr {log10(100.0)}]  ;# returns 2.0\nset val [expr {log10(1.0)}]    ;# returns 0.0"
  },
  "max": {
    "signature": "max(arg ...)",
    "description": "返回所有参数中的最大值。接受一个或多个数值参数。若仅有一个参数则返回该参数。返回类型与输入类型一致（整数或浮点数）。",
    "parameters": [{"name": "arg", "type": "number", "desc": "一个或多个待比较的数值。"}],
    "example": "set m1 [expr {max(3, 7, 2, 9)}]   ;# returns 9\nset m2 [expr {max(-1.5, -2.0)}]  ;# returns -1.5"
  },
  "min": {
    "signature": "min(arg ...)",
    "description": "返回所有参数中的最小值。接受一个或多个数值参数。若仅有一个参数则返回该参数。",
    "parameters": [{"name": "arg", "type": "number", "desc": "一个或多个待比较的数值。"}],
    "example": "set m1 [expr {min(3, 7, 2, 9)}]   ;# returns 2\nset m2 [expr {min(-1.5, -2.0)}]  ;# returns -2.0"
  },
  "pow": {
    "signature": "pow(x, y)",
    "description": "返回 x 的 y 次幂。若 x 为负数，y 必须为整数。结果可能溢出。",
    "parameters": [
      {"name": "x", "type": "number", "desc": "底数。"},
      {"name": "y", "type": "number", "desc": "指数。若 x 为负数则必须为整数。"}
    ],
    "example": "set p1 [expr {pow(2.0, 10.0)}]   ;# returns 1024.0\nset p2 [expr {pow(9.0, 0.5)}]    ;# returns 3.0 (平方根)"
  },
  "rand": {
    "signature": "rand()",
    "description": "返回 (0, 1) 范围内的伪随机浮点数。随机数生成器为简单线性同余生成器，非密码安全。种子从系统时钟初始化。使用 srand() 设置特定种子。",
    "parameters": [],
    "example": "set r [expr {rand()}]         ;# e.g., 0.5321\nset scaled [expr {int(rand() * 100)}] ;# 0-99 的随机整数"
  },
  "round": {
    "signature": "round(arg)",
    "description": "将 arg 四舍五入到最接近的整数。若恰好位于两个整数中间，则舍入到最近的偶数（银行家舍入）。若 arg 已是整数则直接返回。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set r1 [expr {round(3.4)}]   ;# returns 3\nset r2 [expr {round(3.5)}]   ;# returns 4\nset r3 [expr {round(2.5)}]   ;# returns 2"
  },
  "sin": {
    "signature": "sin(arg)",
    "description": "返回 arg（以弧度为单位）的正弦值。",
    "parameters": [{"name": "arg", "type": "number", "desc": "以弧度为单位的角度。"}],
    "example": "set val [expr {sin(0.0)}]        ;# returns 0.0\nset val [expr {sin(3.14159/2)}] ;# returns approx 1.0"
  },
  "sinh": {
    "signature": "sinh(arg)",
    "description": "返回 arg 的双曲正弦值。大参数可能导致溢出错误。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set val [expr {sinh(0.0)}]  ;# returns 0.0\nset val [expr {sinh(1.0)}]  ;# returns approx 1.1752"
  },
  "sqrt": {
    "signature": "sqrt(arg)",
    "description": "返回 arg 的平方根。arg 必须为非负数。极大参数可能返回 Inf。",
    "parameters": [{"name": "arg", "type": "number", "desc": "非负数值。"}],
    "example": "set s1 [expr {sqrt(16.0)}]  ;# returns 4.0\nset s2 [expr {sqrt(2.0)}]   ;# returns approx 1.4142"
  },
  "srand": {
    "signature": "srand(arg)",
    "description": "用整数 arg 设置 rand() 随机数生成器的种子。种子通常从系统时钟初始化。返回新序列的第一个随机数（等同于调用 srand 后立即调用 rand()）。",
    "parameters": [{"name": "arg", "type": "integer", "desc": "随机数生成器的种子值。"}],
    "example": "expr {srand(42)}        ;# 以 42 为种子，返回首个随机数\nset r [expr {rand()}]    ;# 下一个随机值"
  },
  "tan": {
    "signature": "tan(arg)",
    "description": "返回 arg（以弧度为单位）的正切值。",
    "parameters": [{"name": "arg", "type": "number", "desc": "以弧度为单位的角度。"}],
    "example": "set val [expr {tan(0.0)}]        ;# returns 0.0\nset val [expr {tan(3.14159/4)}] ;# returns approx 1.0"
  },
  "tanh": {
    "signature": "tanh(arg)",
    "description": "返回 arg 的双曲正切值。结果始终在 (-1, 1) 范围内。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set val [expr {tanh(0.0)}]  ;# returns 0.0\nset val [expr {tanh(10.0)}] ;# returns approx 1.0"
  },
  "wide": {
    "signature": "wide(arg)",
    "description": "将 arg 转换为 64 位整数（等价于 C 语言 long long 类型）。值向零截断。需要无限制整数范围时请使用 entier()。",
    "parameters": [{"name": "arg", "type": "number", "desc": "数值。"}],
    "example": "set w [expr {wide(3.99)}]   ;# returns 3\nset w [expr {wide(2.0 ** 40)}] ;# returns 1099511627776"
  }
}
```

- [ ] **Step 2: 验证 JSON 格式**

```bash
node -e "JSON.parse(require('fs').readFileSync('syntaxes/tcl_expr_mathfunc_docs.zh-CN.json','utf8')); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add syntaxes/tcl_expr_mathfunc_docs.zh-CN.json
git commit -m "feat: 新增 31 个 Tcl expr 数学函数中文文档"
```

---

### Task 3: 更新 extension.js 加载数学函数文档

**Files:**
- Modify: `src/extension.js`

- [ ] **Step 1: 修改 `getDocs()` 函数，在 Tcl 方言分支中加载数学函数文档**

将 line 366：
```js
_docsCache.tcl = loadDocsJson('tcl_command_docs.json', useZh) || {};
```
替换为：
```js
if (!_docsCache.tcl) {
    _docsCache.tcl = loadDocsJson('tcl_command_docs.json', useZh) || {};
    const mathDocs = loadDocsJson('tcl_expr_mathfunc_docs.json', useZh);
    if (mathDocs) Object.assign(_docsCache.tcl, mathDocs);
}
```

- [ ] **Step 2: 验证逻辑（无运行时错误检查）**

```bash
node -e "
const fs = require('fs');
const path = require('path');
// 模拟 loadDocsJson
const syntaxesDir = path.join(__dirname, '..', 'syntaxes');
const tclDocs = JSON.parse(fs.readFileSync(path.join(syntaxesDir, 'tcl_command_docs.json'), 'utf8'));
const mathDocs = JSON.parse(fs.readFileSync(path.join(syntaxesDir, 'tcl_expr_mathfunc_docs.json'), 'utf8'));
const merged = { ...tclDocs, ...mathDocs };
console.log('tcl_command count:', Object.keys(tclDocs).length);
console.log('mathfunc count:', Object.keys(mathDocs).length);
console.log('merged count:', Object.keys(merged).length);
// 确保 asin 在合并结果中
console.log('asin in merged:', 'asin' in merged);
"
```
Expected: tcl_command count: 43, mathfunc count: 31, merged count: 74, asin in merged: true

- [ ] **Step 3: 提交**

```bash
git add src/extension.js
git commit -m "feat: 扩展加载 Tcl expr 数学函数文档（补全+悬停共用）"
```

---

### Task 4: 补全 tcl_command_docs.json

**Files:**
- Modify: `syntaxes/tcl_command_docs.json`
- Modify: `syntaxes/tcl_command_docs.zh-CN.json`

Tcl 内建命令常用但未收录，在本 task 中补充。注意维护当前已有内容的结构和风格。

- [ ] **Step 1: 修改英文版 tcl_command_docs.json**

将以下代码块追加到 `"array"` 条目之后。注意 JSON 语法：每个条目以 `"命令名": { ... }` 的形式追加到根对象，各条目间用逗号分隔。最后一个条目（`lmap`）后不应有逗号。

```json
"after": {
    "signature": "after ms ?script?",
    "description": "Executes a script after a delay of ms milliseconds. Returns an event identifier that can be used with after cancel. If no script is given, sleeps for ms milliseconds (in event-aware environments). Sub-commands: after cancel (cancel a pending event), after idle (execute when idle), after info (query pending events).",
    "parameters": [
      {"name": "ms", "type": "int", "desc": "Delay in milliseconds. Use 'idle' for idle-time execution."},
      {"name": "script", "type": "script", "desc": "Optional. The script to execute after the delay. If omitted, blocks for the duration."}
    ],
    "example": "after 1000 {puts \"One second later\"}\nset id [after 500 {update_status}]\nafter cancel $id"
  },
  "concat": {
    "signature": "concat ?arg ...?",
    "description": "Concatenates multiple list arguments into a single list, stripping one level of list grouping from each argument. Useful for joining lists or flattening list structure by one level.",
    "parameters": [{"name": "arg", "type": "list", "desc": "One or more lists to concatenate. Each list is flattened by one level."}],
    "example": "set a {1 2 3}\nset b {4 5}\nset result [concat $a $b]  ;# returns 1 2 3 4 5\nset nested [concat {{a b} {c d}}] ;# returns a b c d"
  },
  "eval": {
    "signature": "eval arg ?arg ...?",
    "description": "Concatenates all arguments into a single string and evaluates it as a Tcl script. This is a lower-level command than directly calling commands. Use caution with untrusted input.",
    "parameters": [{"name": "arg", "type": "script", "desc": "One or more script fragments that are concatenated and evaluated."}],
    "example": "set cmd \"puts\"\nset msg \"Hello\"\neval $cmd $msg  ;# equivalent to: puts Hello\neval {set x 1; set y 2; expr {$x + $y}}  ;# returns 3"
  },
  "vwait": {
    "signature": "vwait varName",
    "description": "Enters the Tcl event loop and blocks until the variable named varName is written. Useful for waiting on asynchronous events. The command writing to the variable must use the event loop to execute.",
    "parameters": [{"name": "varName", "type": "string", "desc": "Name of a global variable. The command blocks until this variable is set."}],
    "example": "set done 0\nafter 2000 {set done 1}\nvwait done  ;# blocks until done is set (2 seconds)\nputs \"Finished waiting\""
  },
  "for": {
    "signature": "for start test next body",
    "description": "A C-style loop. start is a script that initializes the loop variable; test is an expression evaluated before each iteration; next is a script run after each iteration; body is the loop body.",
    "parameters": [
      {"name": "start", "type": "script", "desc": "Initialization script executed once before the loop begins."},
      {"name": "test", "type": "expression", "desc": "Boolean expression evaluated before each iteration. Loop exits when false."},
      {"name": "next", "type": "script", "desc": "Script executed after each iteration (typically increments the loop variable)."},
      {"name": "body", "type": "script", "desc": "The script to execute in each iteration."}
    ],
    "example": "for {set i 0} {$i < 5} {incr i} {\n  puts \"Iteration $i\"\n}\n# prints: Iteration 0 through Iteration 4"
  },
  "foreach": {
    "signature": "foreach varname list body ?varlist2 list2 ...? body",
    "description": "Iterates over one or more lists, assigning elements to variables and executing the body for each set of elements. Multiple lists can be traversed in parallel; the loop continues until all lists are exhausted.",
    "parameters": [
      {"name": "varname", "type": "string", "desc": "Variable to receive the current list element."},
      {"name": "list", "type": "list", "desc": "The list to iterate over."},
      {"name": "body", "type": "script", "desc": "Script to execute for each element."}
    ],
    "example": "set voltages {0.0 0.5 1.0 2.0}\nforeach v $voltages {\n  puts \"Bias: $v V\"\n}\nforeach v $voltages i {1 2 3 4} {\n  puts \"Step $i: $v V\"\n}"
  },
  "while": {
    "signature": "while test body",
    "description": "A while loop. Evaluates test as an expression; if true, executes body and repeats. The test is re-evaluated before each iteration.",
    "parameters": [
      {"name": "test", "type": "expression", "desc": "Boolean expression evaluated before each iteration."},
      {"name": "body", "type": "script", "desc": "Script to execute in each iteration while test is true."}
    ],
    "example": "set x 1\nwhile {$x < 10} {\n  puts \"x = $x\"\n  set x [expr {$x * 2}]\n}\n# prints: x = 1, x = 2, x = 4, x = 8"
  },
  "if": {
    "signature": "if expr1 ?then? body1 ?elseif expr2 body2 ...? ?else? ?bodyN?",
    "description": "Conditional execution. Evaluates each expression in order; executes the body corresponding to the first true expression. The else clause catches all remaining cases. The 'then' keyword is optional and typically omitted.",
    "parameters": [
      {"name": "expr1", "type": "expression", "desc": "First boolean expression to evaluate."},
      {"name": "body1", "type": "script", "desc": "Script to execute if expr1 is true."},
      {"name": "expr2", "type": "expression", "desc": "Optional. Boolean expression for elseif clause."},
      {"name": "bodyN", "type": "script", "desc": "Optional. Script for the else clause (no expression)."}
    ],
    "example": "set temp 350\nif {$temp > 400} {\n  puts \"High temperature warning\"\n} elseif {$temp > 300} {\n  puts \"Normal operating range\"\n} else {\n  puts \"Below ambient\"\n}"
  },
  "switch": {
    "signature": "switch ?options? string pattern body ?pattern body ...?",
    "description": "Multi-way branch based on pattern matching. The string is compared against each pattern in order; the body of the first matching pattern is executed. Options: -exact (literal match, default), -glob (glob pattern), -regexp (regular expression). Use -- to mark the end of options.",
    "parameters": [
      {"name": "-exact|-glob|-regexp", "type": "flag", "desc": "Optional. Matching mode: exact (default), glob, or regexp."},
      {"name": "string", "type": "string", "desc": "The value to match against patterns."},
      {"name": "pattern body", "type": "script", "desc": "Pattern-body pairs. Use 'default' as the fallback pattern."}
    ],
    "example": "set solver \"Newton\"\nswitch $solver {\n  \"Newton\"   { puts \"Using Newton method\" }\n  \"Explicit\" { puts \"Using explicit scheme\" }\n  default    { puts \"Unknown solver: $solver\" }\n}"
  },
  "return": {
    "signature": "return ?-options opts? ?-code code? ?value?",
    "description": "Returns from a procedure, optionally with a specific return code and options dictionary. By default returns TCL_OK (code 0). Use -code error to simulate an error return, -code break/continue for loop control from within procedures.",
    "parameters": [
      {"name": "-options opts", "type": "dict", "desc": "Optional. Dictionary of return options (-code, -errorcode, -errorinfo, -level)."},
      {"name": "-code code", "type": "string", "desc": "Optional. Return code: ok, error, return, break, continue, or an integer."},
      {"name": "value", "type": "any", "desc": "Optional. The return value. If omitted, returns empty string."}
    ],
    "example": "proc compute {x} {\n  if {$x < 0} { return -code error \"Negative input\" }\n  return [expr {$x * 2}]\n}"
  },
  "break": {
    "signature": "break",
    "description": "Immediately terminates the innermost loop (for, foreach, or while). Execution continues at the command following the loop. Can also be used with return -code break to break from a procedure.",
    "parameters": [],
    "example": "foreach val {1 2 3 4 5} {\n  if {$val == 3} { break }\n  puts $val\n}\n;# prints: 1 2"
  },
  "continue": {
    "signature": "continue",
    "description": "Skips the remaining commands in the current loop iteration and proceeds to the next iteration. Works with for, foreach, and while loops.",
    "parameters": [],
    "example": "for {set i 0} {$i < 5} {incr i} {\n  if {$i == 2} { continue }\n  puts $i\n}\n;# prints: 0 1 3 4"
  },
  "update": {
    "signature": "update ?idletasks?",
    "description": "Processes all pending events and idle callbacks. With the idletasks flag, processes only idle callbacks (no I/O or timer events). Useful in long-running computations to keep the UI responsive.",
    "parameters": [{"name": "idletasks", "type": "flag", "desc": "Optional. If specified, only idle callbacks are processed."}],
    "example": "set step 0\nwhile {$step < 1000} {\n  incr step\n  if {$step % 100 == 0} { update }\n}"
  },
  "cd": {
    "signature": "cd ?dirName?",
    "description": "Changes the current working directory to dirName. If dirName is omitted, changes to the home directory (on Unix) or does nothing (on Windows). Returns the new working directory.",
    "parameters": [{"name": "dirName", "type": "string", "desc": "Optional. The directory to change to. Defaults to home directory."}],
    "example": "cd \"/home/user/simulations\"\nset cwd [pwd]  ;# returns /home/user/simulations"
  },
  "pwd": {
    "signature": "pwd",
    "description": "Returns the current working directory as an absolute path. Useful for constructing file paths relative to the working directory.",
    "parameters": [],
    "example": "set dir [pwd]\nsource [file join $dir \"common_procs.tcl\"]"
  },
  "exec": {
    "signature": "exec ?switches? arg ?arg ...?",
    "description": "Executes an external program and returns its standard output. Supports I/O redirection (>, <, 2>, >&, | for pipes). An error is raised if the command returns a non-zero exit code (unless -ignorestderr is used).",
    "parameters": [
      {"name": "-keepnewline", "type": "flag", "desc": "Optional. Preserve trailing newline in output."},
      {"name": "--", "type": "flag", "desc": "Optional. End of switches marker."},
      {"name": "arg", "type": "string", "desc": "The program name followed by its arguments. Use pipes and redirects as needed."}
    ],
    "example": "set files [exec ls *.cmd]\nset version [exec sdevice --version]\nexec grep \"error\" $logfile > errors.txt"
  },
  "exit": {
    "signature": "exit ?returnCode?",
    "description": "Terminates the current process with the given return code. If returnCode is omitted, 0 (success) is used. Registered exit handlers (via 'trace') are invoked before termination.",
    "parameters": [{"name": "returnCode", "type": "int", "desc": "Optional. The exit code (0 for success, non-zero for error). Defaults to 0."}],
    "example": "if {$converged} {\n  exit 0\n} else {\n  puts \"Simulation failed\"\n  exit 1\n}"
  },
  "time": {
    "signature": "time script ?count?",
    "description": "Executes script count times (default 1) and returns a human-readable string showing the average execution time in microseconds per iteration. Useful for performance measurement.",
    "parameters": [
      {"name": "script", "type": "script", "desc": "The script to time."},
      {"name": "count", "type": "int", "desc": "Optional. Number of iterations. Higher values improve measurement accuracy. Default: 1."}
    ],
    "example": "puts [time {source \"mesh.tcl\"} 10]\n;# prints: 1234.5 microseconds per iteration"
  },
  "lrepeat": {
    "signature": "lrepeat count value ?value ...?",
    "description": "Creates a list by repeating the given values count times. The result is the concatenation of count copies of the value list. Tcl 8.5+.",
    "parameters": [
      {"name": "count", "type": "int", "desc": "Number of times to repeat the values."},
      {"name": "value", "type": "any", "desc": "One or more values to repeat."}],
    "example": "set coords [lrepeat 3 0.0]    ;# returns {0.0 0.0 0.0}\nset pattern [lrepeat 2 a b]    ;# returns {a b a b}"
  },
  "lreverse": {
    "signature": "lreverse list",
    "description": "Returns a new list with the elements of list in reverse order. The original list is not modified. Tcl 8.5+.",
    "parameters": [{"name": "list", "type": "list", "desc": "The list to reverse."}],
    "example": "set vals {0.0 0.5 1.0}\nset reversed [lreverse $vals]  ;# returns {1.0 0.5 0.0}"
  },
  "lassign": {
    "signature": "lassign list ?varName ...?",
    "description": "Assigns list elements to the specified variables in order. Returns the remaining (unassigned) elements. This is a convenient way to unpack a list into named variables. Tcl 8.5+.",
    "parameters": [
      {"name": "list", "type": "list", "desc": "The list whose elements to assign."},
      {"name": "varName", "type": "string", "desc": "Variable names to receive list elements in order."}
    ],
    "example": "set pair {1.2 0.8}\nlassign $pair vg vd\nputs \"Vg=$vg, Vd=$vd\"  ;# prints: Vg=1.2, Vd=0.8"
  },
  "lset": {
    "signature": "lset varName ?index ...? newValue",
    "description": "Modifies a list element in-place within a variable. Supports multi-level indexing for nested lists. This is the only list command that modifies the variable directly (others return new lists). Tcl 8.5+.",
    "parameters": [
      {"name": "varName", "type": "string", "desc": "Name of the variable containing the list to modify."},
      {"name": "index", "type": "int", "desc": "One or more indices into the (possibly nested) list."},
      {"name": "newValue", "type": "any", "desc": "The new value to set at the indexed position."}
    ],
    "example": "set matrix {{0 0} {0 0}}\nlset matrix 0 1 5\nputs $matrix  ;# prints: {0 5} {0 0}"
  },
  "lmap": {
    "signature": "lmap varname list body ?varlist2 list2 ...? body",
    "description": "Maps a script over list elements and collects the results into a new list. Like foreach, but returns the collected results. Supports multiple list traversal. Tcl 8.6+.",
    "parameters": [
      {"name": "varname", "type": "string", "desc": "Variable to receive the current element."},
      {"name": "list", "type": "list", "desc": "The list to map over."},
      {"name": "body", "type": "script", "desc": "Script whose result becomes the corresponding element of the output list."}
    ],
    "example": "set doubled [lmap v {1 2 3} {expr {$v * 2}}]  ;# returns {2 4 6}\nset squares [lmap x {0 1 2 3 4} {expr {$x * $x}}]  ;# returns {0 1 4 9 16}"
  }
```

- [ ] **Step 2: 修改中文版 tcl_command_docs.zh-CN.json**

将以下代码块追加到 `"array"` 条目之后。JSON 逗号规则同英文版。

```json
"after": {
    "signature": "after ms ?script?",
    "description": "延迟指定毫秒后执行脚本。返回可用于 after cancel 的事件标识符。无 script 参数时睡眠 ms 毫秒（在支持事件循环的环境中）。子命令：after cancel（取消待执行事件）、after idle（空闲时执行）、after info（查询待执行事件）。",
    "parameters": [
      {"name": "ms", "type": "int", "desc": "延迟毫秒数。使用 'idle' 表示空闲时执行。"},
      {"name": "script", "type": "script", "desc": "可选。延迟后执行的脚本。省略时阻塞等待指定时间。"}
    ],
    "example": "after 1000 {puts \"One second later\"}\nset id [after 500 {update_status}]\nafter cancel $id"
  },
  "concat": {
    "signature": "concat ?arg ...?",
    "description": "将多个列表参数拼接为单个列表，每个参数剥离一层列表分组。用于合并列表或将列表结构展平一层。",
    "parameters": [{"name": "arg", "type": "list", "desc": "一个或多个待拼接的列表。每个列表展平一层。"}],
    "example": "set a {1 2 3}\nset b {4 5}\nset result [concat $a $b]  ;# returns 1 2 3 4 5\nset nested [concat {{a b} {c d}}] ;# returns a b c d"
  },
  "eval": {
    "signature": "eval arg ?arg ...?",
    "description": "将所有参数拼接为单个字符串并作为 Tcl 脚本求值。这是比直接调用命令更底层的命令。注意不要对不可信输入使用 eval。",
    "parameters": [{"name": "arg", "type": "script", "desc": "一个或多个脚本片段，拼接后求值。"}],
    "example": "set cmd \"puts\"\nset msg \"Hello\"\neval $cmd $msg  ;# 等价于: puts Hello\neval {set x 1; set y 2; expr {$x + $y}}  ;# returns 3"
  },
  "vwait": {
    "signature": "vwait varName",
    "description": "进入 Tcl 事件循环并阻塞，直到指定变量 varName 被写入。适用于等待异步事件。写入变量的命令必须通过事件循环执行。",
    "parameters": [{"name": "varName", "type": "string", "desc": "全局变量名。命令阻塞直到此变量被设置。"}],
    "example": "set done 0\nafter 2000 {set done 1}\nvwait done  ;# 阻塞直到 done 被设置（2 秒后）\nputs \"Finished waiting\""
  },
  "for": {
    "signature": "for start test next body",
    "description": "C 风格循环。start 为初始化循环变量的脚本；test 为每次迭代前求值的表达式；next 为每次迭代后执行的脚本；body 为循环体。",
    "parameters": [
      {"name": "start", "type": "script", "desc": "循环开始前执行一次的初始化脚本。"},
      {"name": "test", "type": "expression", "desc": "每次迭代前求值的布尔表达式。为 false 时退出循环。"},
      {"name": "next", "type": "script", "desc": "每次迭代后执行的脚本（通常递增循环变量）。"},
      {"name": "body", "type": "script", "desc": "每次迭代中执行的脚本。"}
    ],
    "example": "for {set i 0} {$i < 5} {incr i} {\n  puts \"Iteration $i\"\n}\n# 输出: Iteration 0 到 Iteration 4"
  },
  "foreach": {
    "signature": "foreach varname list body ?varlist2 list2 ...? body",
    "description": "遍历一个或多个列表，将元素赋值给变量并为每组元素执行循环体。可并行遍历多个列表；循环在所有列表耗尽时结束。",
    "parameters": [
      {"name": "varname", "type": "string", "desc": "接收当前列表元素的变量。"},
      {"name": "list", "type": "list", "desc": "要遍历的列表。"},
      {"name": "body", "type": "script", "desc": "为每个元素执行的脚本。"}
    ],
    "example": "set voltages {0.0 0.5 1.0 2.0}\nforeach v $voltages {\n  puts \"Bias: $v V\"\n}\nforeach v $voltages i {1 2 3 4} {\n  puts \"Step $i: $v V\"\n}"
  },
  "while": {
    "signature": "while test body",
    "description": "While 循环。将 test 作为表达式求值；若为 true 则执行 body 并重复。每次迭代前重新求值 test。",
    "parameters": [
      {"name": "test", "type": "expression", "desc": "每次迭代前求值的布尔表达式。"},
      {"name": "body", "type": "script", "desc": "test 为 true 时每次迭代执行的脚本。"}
    ],
    "example": "set x 1\nwhile {$x < 10} {\n  puts \"x = $x\"\n  set x [expr {$x * 2}]\n}\n# 输出: x = 1, x = 2, x = 4, x = 8"
  },
  "if": {
    "signature": "if expr1 ?then? body1 ?elseif expr2 body2 ...? ?else? ?bodyN?",
    "description": "条件执行。按顺序求值每个表达式；执行第一个为 true 的表达式对应的 body。else 子句捕获所有剩余情况。'then' 关键字可选，通常省略。",
    "parameters": [
      {"name": "expr1", "type": "expression", "desc": "第一个要计算的布尔表达式。"},
      {"name": "body1", "type": "script", "desc": "expr1 为 true 时执行的脚本。"},
      {"name": "expr2", "type": "expression", "desc": "可选。elseif 子句的布尔表达式。"},
      {"name": "bodyN", "type": "script", "desc": "可选。else 子句的脚本（无表达式）。"}
    ],
    "example": "set temp 350\nif {$temp > 400} {\n  puts \"High temperature warning\"\n} elseif {$temp > 300} {\n  puts \"Normal operating range\"\n} else {\n  puts \"Below ambient\"\n}"
  },
  "switch": {
    "signature": "switch ?options? string pattern body ?pattern body ...?",
    "description": "基于模式匹配的多路分支。string 按顺序与每个 pattern 比较；执行第一个匹配 pattern 的 body。选项：-exact（字面匹配，默认）、-glob（通配符模式）、-regexp（正则表达式）。使用 -- 标记选项结束。",
    "parameters": [
      {"name": "-exact|-glob|-regexp", "type": "flag", "desc": "可选。匹配模式：exact（默认精确匹配）、glob（通配符）或 regexp（正则表达式）。"},
      {"name": "string", "type": "string", "desc": "要与模式匹配的值。"},
      {"name": "pattern body", "type": "script", "desc": "模式-脚本对。使用 'default' 作为兜底匹配。"}
    ],
    "example": "set solver \"Newton\"\nswitch $solver {\n  \"Newton\"   { puts \"Using Newton method\" }\n  \"Explicit\" { puts \"Using explicit scheme\" }\n  default    { puts \"Unknown solver: $solver\" }\n}"
  },
  "return": {
    "signature": "return ?-options opts? ?-code code? ?value?",
    "description": "从过程中返回，可选指定返回码和选项字典。默认返回 TCL_OK（码 0）。使用 -code error 可模拟错误返回，使用 -code break/continue 可从过程内部控制循环。",
    "parameters": [
      {"name": "-options opts", "type": "dict", "desc": "可选。返回选项字典（-code、-errorcode、-errorinfo、-level）。"},
      {"name": "-code code", "type": "string", "desc": "可选。返回码：ok、error、return、break、continue 或整数值。"},
      {"name": "value", "type": "any", "desc": "可选。返回值。省略时返回空字符串。"}
    ],
    "example": "proc compute {x} {\n  if {$x < 0} { return -code error \"Negative input\" }\n  return [expr {$x * 2}]\n}"
  },
  "break": {
    "signature": "break",
    "description": "立即终止最内层循环（for、foreach 或 while）。执行在循环后的命令处继续。也可用 return -code break 从过程中跳出循环。",
    "parameters": [],
    "example": "foreach val {1 2 3 4 5} {\n  if {$val == 3} { break }\n  puts $val\n}\n;# 输出: 1 2"
  },
  "continue": {
    "signature": "continue",
    "description": "跳过当前循环迭代中剩余的命令，继续下一次迭代。适用于 for、foreach 和 while 循环。",
    "parameters": [],
    "example": "for {set i 0} {$i < 5} {incr i} {\n  if {$i == 2} { continue }\n  puts $i\n}\n;# 输出: 0 1 3 4"
  },
  "update": {
    "signature": "update ?idletasks?",
    "description": "处理所有待处理的事件和空闲回调。使用 idletasks 标志时仅处理空闲回调（无 I/O 或定时器事件）。在长时间计算中用于保持 UI 响应。",
    "parameters": [{"name": "idletasks", "type": "flag", "desc": "可选。指定时仅处理空闲回调。"}],
    "example": "set step 0\nwhile {$step < 1000} {\n  incr step\n  if {$step % 100 == 0} { update }\n}"
  },
  "cd": {
    "signature": "cd ?dirName?",
    "description": "将当前工作目录更改为 dirName。省略 dirName 时切换到 home 目录（Unix）或无操作（Windows）。返回新工作目录。",
    "parameters": [{"name": "dirName", "type": "string", "desc": "可选。要切换到的目录。默认为 home 目录。"}],
    "example": "cd \"/home/user/simulations\"\nset cwd [pwd]  ;# 返回 /home/user/simulations"
  },
  "pwd": {
    "signature": "pwd",
    "description": "以绝对路径形式返回当前工作目录。用于构建相对于工作目录的文件路径。",
    "parameters": [],
    "example": "set dir [pwd]\nsource [file join $dir \"common_procs.tcl\"]"
  },
  "exec": {
    "signature": "exec ?switches? arg ?arg ...?",
    "description": "执行外部程序并返回其标准输出。支持 I/O 重定向（>、<、2>、>&、| 管道）。若命令返回非零退出码则报错（除非使用 -ignorestderr）。",
    "parameters": [
      {"name": "-keepnewline", "type": "flag", "desc": "可选。保留输出末尾的换行符。"},
      {"name": "--", "type": "flag", "desc": "可选。标记选项结束。"},
      {"name": "arg", "type": "string", "desc": "程序名及其参数。可按需使用管道和重定向。"}
    ],
    "example": "set files [exec ls *.cmd]\nset version [exec sdevice --version]\nexec grep \"error\" $logfile > errors.txt"
  },
  "exit": {
    "signature": "exit ?returnCode?",
    "description": "以指定返回码终止当前进程。省略 returnCode 时使用 0（成功）。终止前调用已注册的退出处理器（通过 'trace'）。",
    "parameters": [{"name": "returnCode", "type": "int", "desc": "可选。退出码（0 表示成功，非零表示错误）。默认 0。"}],
    "example": "if {$converged} {\n  exit 0\n} else {\n  puts \"Simulation failed\"\n  exit 1\n}"
  },
  "time": {
    "signature": "time script ?count?",
    "description": "将 script 执行 count 次（默认 1 次），返回人类可读的字符串，显示每次迭代的平均执行时间（微秒）。用于性能测量。",
    "parameters": [
      {"name": "script", "type": "script", "desc": "要计时的脚本。"},
      {"name": "count", "type": "int", "desc": "可选。迭代次数。值越高测量精度越高。默认：1。"}
    ],
    "example": "puts [time {source \"mesh.tcl\"} 10]\n;# 输出: 1234.5 microseconds per iteration"
  },
  "lrepeat": {
    "signature": "lrepeat count value ?value ...?",
    "description": "通过将给定值重复 count 次来创建列表。结果是 count 份值列表的拼接。Tcl 8.5+。",
    "parameters": [
      {"name": "count", "type": "int", "desc": "重复值的次数。"},
      {"name": "value", "type": "any", "desc": "一个或多个要重复的值。"}],
    "example": "set coords [lrepeat 3 0.0]    ;# returns {0.0 0.0 0.0}\nset pattern [lrepeat 2 a b]    ;# returns {a b a b}"
  },
  "lreverse": {
    "signature": "lreverse list",
    "description": "返回元素顺序反转后的新列表。原列表不被修改。Tcl 8.5+。",
    "parameters": [{"name": "list", "type": "list", "desc": "要反转的列表。"}],
    "example": "set vals {0.0 0.5 1.0}\nset reversed [lreverse $vals]  ;# returns {1.0 0.5 0.0}"
  },
  "lassign": {
    "signature": "lassign list ?varName ...?",
    "description": "将列表元素按顺序赋值给指定变量。返回剩余（未赋值）的元素。这是将列表解包到命名变量的便捷方式。Tcl 8.5+。",
    "parameters": [
      {"name": "list", "type": "list", "desc": "要赋值的列表。"},
      {"name": "varName", "type": "string", "desc": "按顺序接收列表元素的变量名。"}
    ],
    "example": "set pair {1.2 0.8}\nlassign $pair vg vd\nputs \"Vg=$vg, Vd=$vd\"  ;# 输出: Vg=1.2, Vd=0.8"
  },
  "lset": {
    "signature": "lset varName ?index ...? newValue",
    "description": "就地修改变量中的列表元素。支持嵌套列表的多级索引。这是唯一直接修改变量的列表命令（其他命令返回新列表）。Tcl 8.5+。",
    "parameters": [
      {"name": "varName", "type": "string", "desc": "包含待修改列表的变量名。"},
      {"name": "index", "type": "int", "desc": "一个或多个指向（可能嵌套的）列表的索引。"},
      {"name": "newValue", "type": "any", "desc": "要在索引位置设置的新值。"}
    ],
    "example": "set matrix {{0 0} {0 0}}\nlset matrix 0 1 5\nputs $matrix  ;# 输出: {0 5} {0 0}"
  },
  "lmap": {
    "signature": "lmap varname list body ?varlist2 list2 ...? body",
    "description": "对列表元素执行脚本并将结果收集为新列表。类似 foreach，但返回收集的结果。支持多列表遍历。Tcl 8.6+。",
    "parameters": [
      {"name": "varname", "type": "string", "desc": "接收当前元素的变量。"},
      {"name": "list", "type": "list", "desc": "要映射的列表。"},
      {"name": "body", "type": "script", "desc": "其结果作为输出列表对应元素的脚本。"}
    ],
    "example": "set doubled [lmap v {1 2 3} {expr {$v * 2}}]  ;# returns {2 4 6}\nset squares [lmap x {0 1 2 3 4} {expr {$x * $x}}]  ;# returns {0 1 4 9 16}"
  }
```

- [ ] **Step 3: 验证 JSON**

```bash
node -e "
const a = JSON.parse(require('fs').readFileSync('syntaxes/tcl_command_docs.json','utf8'));
const b = JSON.parse(require('fs').readFileSync('syntaxes/tcl_command_docs.zh-CN.json','utf8'));
console.log('EN keys:', Object.keys(a).length);
console.log('ZH keys:', Object.keys(b).length);
console.log('Keys match:', JSON.stringify(Object.keys(a).sort()) === JSON.stringify(Object.keys(b).sort()));
['asin','after','for','foreach','lmap'].forEach(k => console.log(k + ':', k in a));
"
```
Expected: EN keys: 65, ZH keys: 65, Keys match: true, all keys found

- [ ] **Step 4: 提交**

```bash
git add syntaxes/tcl_command_docs.json syntaxes/tcl_command_docs.zh-CN.json
git commit -m "feat: 补充 22 个 Tcl 核心命令文档（4 语法/文档对齐 + 18 新增常用命令）"
```

---

### Task 5: 更新 5 个语法文件

**Files:**
- Modify: `syntaxes/sdevice.tmLanguage.json`
- Modify: `syntaxes/sprocess.tmLanguage.json`
- Modify: `syntaxes/emw.tmLanguage.json`
- Modify: `syntaxes/inspect.tmLanguage.json`
- Modify: `syntaxes/svisual.tmLanguage.json`

所有 5 个文件做**相同**的两处修改：更新 `support.function` 正则 + 新增 `support.function.math.tcl` 正则

- [ ] **Step 1: sdevice.tmLanguage.json —— 更新 support.function 正则 + 新增 mathfunc 正则**

旧正则（line 14）：
```
"match": "\\b(after|append|array|catch|close|concat|error|eval|expr|file|format|gets|glob|global|incr|info|join|lappend|lindex|linsert|list|llength|lrange|lreplace|lsearch|lsort|open|puts|read|regsub|rename|scan|set|source|split|string|subst|unset|uplevel|upvar|variable|vwait)\\b"
```

替换为（添加 regexp, flush + 18 个新命令，按字母序排列）：
```
"match": "\\b(after|append|array|break|catch|cd|close|concat|continue|error|eval|exec|exit|expr|file|flush|for|foreach|format|gets|glob|global|if|incr|info|join|lappend|lassign|lindex|linsert|list|llength|lmap|lrange|lrepeat|lreplace|lreverse|lsearch|lset|lsort|open|proc|puts|pwd|read|regexp|regsub|rename|return|scan|set|source|split|string|subst|switch|throw|time|try|unset|update|uplevel|upvar|variable|vwait|while)\\b"
```

然后在 `support.function.sdevice` 规则之后、`{ "include": "#section-keywords" }` 之前插入 mathfunc 规则：
```json
{ "match": "\\b(abs|acos|asin|atan|atan2|bool|ceil|cos|cosh|double|entier|exp|floor|fmod|hypot|int|isqrt|log|log10|max|min|pow|rand|round|sin|sinh|sqrt|srand|tan|tanh|wide)\\b", "name": "support.function.math.tcl" },
```

- [ ] **Step 2: 重复操作 sprocess / emw / inspect / svisual**

四个文件语法层结构完全一致（keyword.control → keyword.other → support.function → 兜底标识符），修改方式同 sdevice。

- [ ] **Step 3: 验证正则完整性**

```bash
# 确保 5 个文件中新 support.function 正则完全一致
grep -oP 'support\.function\.\w+.*match.*' syntaxes/*.tmLanguage.json | head -10
# 验证 mathfunc 正则存在于 5 个文件
grep -c "support.function.math.tcl" syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
```
Expected: each file returns 1

- [ ] **Step 4: 提交**

```bash
git add syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat: 语法高亮新增 31 个数学函数 + 18 个 Tcl 核心命令"
```

---

### Task 6: 更新 all_keywords.json 添加 MATHFUNC 类别

**Files:**
- Modify: `syntaxes/all_keywords.json`

为 5 个 Tcl 工具（sdevice, sprocess, emw, inspect, svisual）各新增 `MATHFUNC` 关键词组。

- [ ] **Step 1: 在每个工具的 KEYWORD1/FUNCTION/... 块前添加 MATHFUNC**

32 个条目（31 个数学函数 + tcl::mathfunc 命名空间前缀）：
```json
"MATHFUNC": [
  "abs", "acos", "asin", "atan", "atan2", "bool", "ceil", "cos", "cosh", "double",
  "entier", "exp", "floor", "fmod", "hypot", "int", "isqrt", "log", "log10", "max",
  "min", "pow", "rand", "round", "sin", "sinh", "sqrt", "srand", "tan", "tanh", "wide"
]
```

在 `src/extension.js` 中 `KIND_MAP` 和 `SORT_PREFIX` / `DETAIL_LABEL` 中补充：
```js
MATHFUNC: vscode.CompletionItemKind.Function,  // 添加到 KIND_MAP
MATHFUNC: '0',                                   // 添加到 SORT_PREFIX
MATHFUNC: 'Math Function',                       // 添加到 DETAIL_LABEL
```

- [ ] **Step 2: 验证**

```bash
node -e "
const kw = JSON.parse(require('fs').readFileSync('syntaxes/all_keywords.json','utf8'));
for (const tool of ['sdevice','sprocess','emw','inspect','svisual']) {
  console.log(tool + ' MATHFUNC:', kw[tool].MATHFUNC ? kw[tool].MATHFUNC.length + ' items' : 'MISSING');
}
"
```
Expected: each tool shows 31 items

- [ ] **Step 3: 提交**

```bash
git add syntaxes/all_keywords.json src/extension.js
git commit -m "feat: all_keywords 新增 MATHFUNC 类别支持数学函数补全"
```

---

### Task 7: 创建测试展示文件

**Files:**
- Create: `display_test/test_mathfunc.tcl`

- [ ] **Step 1: 写入测试文件**

```tcl
# ============================================================
# Tcl 数学函数 + 新增核心命令 功能展示
# 在 VSCode 中打开此文件，检查高亮和悬停文档
# ============================================================

# --- 数学函数测试 (scope: support.function.math.tcl) ---

# 三角函数
set sin_val [expr {sin(0.5)}]
set cos_val [expr {cos(0.5)}]
set tan_val [expr {tan(0.5)}]
set asin_val [expr {asin(0.5)}]
set acos_val [expr {acos(0.5)}]
set atan_val [expr {atan(1.0)}]
set atan2_val [expr {atan2(1.0, 0.0)}]

# 双曲函数
set sinh_val [expr {sinh(1.0)}]
set cosh_val [expr {cosh(1.0)}]
set tanh_val [expr {tanh(1.0)}]

# 指数/对数
set exp_val [expr {exp(1.0)}]
set log_val [expr {log(2.718)}]
set log10_val [expr {log10(100.0)}]
set sqrt_val [expr {sqrt(16.0)}]
set pow_val [expr {pow(2.0, 10.0)}]

# 取整函数
set round_val [expr {round(3.5)}]
set ceil_val [expr {ceil(3.14)}]
set floor_val [expr {floor(3.14)}]
set int_val [expr {int(3.99)}]
set double_val [expr {double(42)}]
set entier_val [expr {entier(-3.99)}]
set wide_val [expr {wide(3.99)}]

# 其他
set abs_val [expr {abs(-42)}]
set hypot_val [expr {hypot(3.0, 4.0)}]
set fmod_val [expr {fmod(10.0, 3.0)}]
set bool_val [expr {bool(1)}]
set isqrt_val [expr {isqrt(20)}]

# 最值
set max_val [expr {max(3, 7, 2, 9)}]
set min_val [expr {min(3, 7, 2, 9)}]

# 随机数
expr {srand(42)}
set rand_val [expr {rand()}]

# --- 新增 Tcl 核心命令测试 ---

# 流程控制
proc test_control {x} {
    if {$x > 10} {
        return "large"
    } elseif {$x > 5} {
        return "medium"
    } else {
        return "small"
    }
}

for {set i 0} {$i < 3} {incr i} {
    puts "Step $i"
}

set items {1 2 3 4 5}
foreach item $items {
    if {$item == 2} { continue }
    if {$item == 4} { break }
    puts $item
}

set n 0
while {$n < 3} {
    incr n
}

switch "Newton" {
    "Newton"   { puts "Newton method" }
    "Explicit" { puts "Explicit scheme" }
    default    { puts "Unknown" }
}

# 事件循环 (仅声明，不实际执行)
# after 1000 {puts "delayed"}
# vwait done
# update

# 系统操作
set cwd [pwd]
# cd ..
# exec ls -la
# exit 0

# 计时
set timing [time {expr {sin(0.5)}} 1000]

# 列表进阶
set repeated [lrepeat 3 0.0]
set reversed [lreverse {1 2 3}]
set pair {1.2 0.8}
lassign $pair vg vd
set matrix {{0 0} {0 0}}
lset matrix 0 1 5
set doubled [lmap v {1 2 3} {expr {$v * 2}}]

puts "All tests passed"
```

- [ ] **Step 2: 提交**

```bash
git add display_test/test_mathfunc.tcl
git commit -m "test: 添加数学函数和新增命令的展示测试文件"
```

---

### Task 8: 最终验证

- [ ] **Step 1: 验证所有文件 JSON 格式正确**

```bash
for f in syntaxes/tcl_expr_mathfunc_docs.json syntaxes/tcl_expr_mathfunc_docs.zh-CN.json syntaxes/tcl_command_docs.json syntaxes/tcl_command_docs.zh-CN.json syntaxes/all_keywords.json syntaxes/sdevice.tmLanguage.json syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('$f: OK')" || echo "$f: FAILED"
done
```

- [ ] **Step 2: 验证文档一致性**

```bash
node -e "
const en = JSON.parse(require('fs').readFileSync('syntaxes/tcl_expr_mathfunc_docs.json','utf8'));
const zh = JSON.parse(require('fs').readFileSync('syntaxes/tcl_expr_mathfunc_docs.zh-CN.json','utf8'));
console.log('Mathfunc keys match:', JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(zh).sort()));
console.log('Mathfunc EN count:', Object.keys(en).length);
console.log('Mathfunc ZH count:', Object.keys(zh).length);
"
```
Expected: keys match: true, counts: 31 each

- [ ] **Step 3: git status 确认变更范围**

```bash
git status
```
Expected: 11 files changed (2 new + 9 modified)

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: Tcl expr 数学函数和常用核心命令补全完成

覆盖 31 个数学函数（asin, acos, atan2, sinh 等）和 22 个核心
命令（after, concat, eval, vwait + for, foreach, while 等 18 个）。

变更清单：
- 新增: syntaxes/tcl_expr_mathfunc_docs.json (31 函数英文文档)
- 新增: syntaxes/tcl_expr_mathfunc_docs.zh-CN.json (31 函数中文文档)
- 修改: syntaxes/{sdevice,sprocess,emw,inspect,svisual}.tmLanguage.json
  (support.function 正则从 42 扩展到 60 命令 + 新增 mathfunc 规则)
- 修改: syntaxes/tcl_command_docs.json (43→65 命令)
- 修改: syntaxes/tcl_command_docs.zh-CN.json (43→65 命令)
- 修改: syntaxes/all_keywords.json (5 工具新增 MATHFUNC 组)
- 修改: src/extension.js (加载 mathfunc 文档)

第二阶段见 Issue #10"
```

---

## 完整性检查

- [x] Spec coverage: 数学函数 31 个 ✓ | 语法/文档不匹配 9 处 ✓ | 18 个新命令 ✓
- [x] No placeholders: 所有步骤含完整代码
- [x] Type consistency: 文档 JSON 结构与现有一致，scope 命名遵循 `support.function.math.tcl` 约定
