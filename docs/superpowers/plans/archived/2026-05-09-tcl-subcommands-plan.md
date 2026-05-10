# Tcl 子命令上下文感知高亮实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 5 个 Tcl 工具添加子命令上下文感知高亮、文档悬停和补全

**Architecture:** TextMate 层使用单次 match+captures 模式（非 begin/end），在主命令上下文中高亮子命令；JS 层修改 HoverProvider 和 CompletionProvider，通过同行前向扫描检测主命令-子命令组合，查找嵌套两级文档 JSON

**Tech Stack:** TextMate JSON 语法、VSCode Extension API（HoverProvider/CompletionItemProvider）、纯 CommonJS

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| 新增 | `syntaxes/tcl_subcommand_docs.json` | 英文子命令文档（5 主命令 × ~83 子命令） |
| 新增 | `syntaxes/tcl_subcommand_docs.zh-CN.json` | 中文子命令文档 |
| 修改 | `syntaxes/sdevice.tmLanguage.json:13-14` | 插入 5 条子命令 match（在 proc 行后、顶级命令行前） |
| 修改 | `syntaxes/sprocess.tmLanguage.json` | 同上结构 |
| 修改 | `syntaxes/emw.tmLanguage.json` | 同上结构 |
| 修改 | `syntaxes/inspect.tmLanguage.json` | 同上结构 |
| 修改 | `syntaxes/svisual.tmLanguage.json:236-240` | 同上结构 |
| 修改 | `syntaxes/all_keywords.json` | 5 个工具各新增 SUBCOMMAND 类别 |
| 修改 | `src/extension.js:367-370` | 加载子命令文档到 _docsCache.tclSub |
| 修改 | `src/extension.js:678-781` | HoverProvider 子命令查找 |
| 修改 | `src/extension.js:568-614` | CompletionProvider 子命令补全 |
| 更新 | `CLAUDE.md` | 文件树 + 架构描述 |

---

### Task 1: 创建英文子命令文档 JSON

**Files:**
- Create: `syntaxes/tcl_subcommand_docs.json`

- [ ] **Step 1: 创建完整文档文件**

创建 `syntaxes/tcl_subcommand_docs.json`，包含 string/file/info/array/dict 五个主命令下的所有子命令文档：

```json
{
  "string": {
    "length": {
      "signature": "string length string",
      "description": "Returns the number of characters in string (not bytes).",
      "example": "string length \"Hello\"  ;# → 5"
    },
    "match": {
      "signature": "string match ?-nocase? pattern string",
      "description": "Tests if string matches the glob pattern (*, ?, [chars]).",
      "example": "string match *.tdr $filename"
    },
    "range": {
      "signature": "string range string first last",
      "description": "Returns the substring from first to last index (inclusive).",
      "example": "string range \"Hello World\" 0 4  ;# → Hello"
    },
    "first": {
      "signature": "string first needleString haystackString ?startIndex?",
      "description": "Returns the index of the first occurrence of needleString in haystackString.",
      "example": "string first \"World\" \"Hello World\"  ;# → 6"
    },
    "last": {
      "signature": "string last needleString haystackString ?lastIndex?",
      "description": "Returns the index of the last occurrence of needleString in haystackString.",
      "example": "string last \"o\" \"Hello World\"  ;# → 7"
    },
    "index": {
      "signature": "string index string charIndex",
      "description": "Returns the character at charIndex (supports end-±N).",
      "example": "string index \"Hello\" end  ;# → o"
    },
    "trim": {
      "signature": "string trim string ?chars?",
      "description": "Removes leading and trailing characters (defaults to whitespace).",
      "example": "string trim \"  Hello  \"  ;# → Hello"
    },
    "trimleft": {
      "signature": "string trimleft string ?chars?",
      "description": "Removes leading characters from string.",
      "example": "string trimleft \"0042\" 0  ;# → 42"
    },
    "trimright": {
      "signature": "string trimright string ?chars?",
      "description": "Removes trailing characters from string.",
      "example": "string trimright \"Hello000\" 0  ;# → Hello"
    },
    "tolower": {
      "signature": "string tolower string ?first? ?last?",
      "description": "Converts string to lowercase.",
      "example": "string tolower \"Hello\"  ;# → hello"
    },
    "toupper": {
      "signature": "string toupper string ?first? ?last?",
      "description": "Converts string to uppercase.",
      "example": "string toupper \"Hello\"  ;# → HELLO"
    },
    "totitle": {
      "signature": "string totitle string ?first? ?last?",
      "description": "Capitalizes the first character of string.",
      "example": "string totitle \"hello world\"  ;# → Hello world"
    },
    "equal": {
      "signature": "string equal ?-nocase? string1 string2",
      "description": "Returns 1 if strings are equal, 0 otherwise.",
      "example": "string equal \"abc\" \"abc\"  ;# → 1"
    },
    "compare": {
      "signature": "string compare ?-nocase? ?-length int? string1 string2",
      "description": "Compares strings lexicographically. Returns -1, 0, or 1.",
      "example": "string compare \"abc\" \"abd\"  ;# → -1"
    },
    "is": {
      "signature": "string is class ?-strict? string",
      "description": "Tests if string belongs to a character class (alnum, alpha, ascii, boolean, digit, double, integer, list, lower, upper, space, wideinteger, wordchar, xdigit).",
      "example": "string is digit \"123\"  ;# → 1"
    },
    "map": {
      "signature": "string map ?-nocase? mapping string",
      "description": "Replaces substrings according to key-value pairs in mapping.",
      "example": "string map {abc 1 ab 2 a 3} \"aababc\"  ;# → 31c"
    },
    "repeat": {
      "signature": "string repeat string count",
      "description": "Returns string repeated count times.",
      "example": "string repeat \"Ha\" 3  ;# → HaHaHa"
    },
    "replace": {
      "signature": "string replace string first last ?newString?",
      "description": "Replaces characters from first to last with newString.",
      "example": "string replace \"Hello World\" 5 11 \"Tcl\"  ;# → HelloTcl"
    },
    "reverse": {
      "signature": "string reverse string",
      "description": "Returns string with characters in reverse order.",
      "example": "string reverse \"Hello\"  ;# → olleH"
    },
    "cat": {
      "signature": "string cat ?string ...?",
      "description": "Concatenates all arguments into a single string (Tcl 8.6+).",
      "example": "string cat \"Hello\" \" \" \"World\"  ;# → Hello World"
    },
    "wordstart": {
      "signature": "string wordstart string charIndex",
      "description": "Returns the index of the start of the word containing charIndex.",
      "example": "string wordstart \"Hello World\" 8  ;# → 6"
    },
    "wordend": {
      "signature": "string wordend string charIndex",
      "description": "Returns the index of the character just after the word containing charIndex.",
      "example": "string wordend \"Hello World\" 0  ;# → 5"
    },
    "bytelength": {
      "signature": "string bytelength string",
      "description": "Returns the number of bytes in string (deprecated, use encoding + string length).",
      "example": "string bytelength \"Hello\"  ;# → 5"
    }
  },
  "file": {
    "join": {
      "signature": "file join name ?name ...?",
      "description": "Joins path components with the platform separator.",
      "example": "file join /usr local bin  ;# → /usr/local/bin"
    },
    "dirname": {
      "signature": "file dirname name",
      "description": "Returns the directory portion of a path.",
      "example": "file dirname /usr/local/bin/tclsh  ;# → /usr/local/bin"
    },
    "tail": {
      "signature": "file tail name",
      "description": "Returns the filename portion of a path (last component).",
      "example": "file tail /usr/local/bin/tclsh  ;# → tclsh"
    },
    "extension": {
      "signature": "file extension name",
      "description": "Returns the file extension including the dot.",
      "example": "file extension \"output.tdr\"  ;# → .tdr"
    },
    "rootname": {
      "signature": "file rootname name",
      "description": "Returns the name without extension.",
      "example": "file rootname \"output.tdr\"  ;# → output"
    },
    "exists": {
      "signature": "file exists name",
      "description": "Returns 1 if file or directory exists, 0 otherwise.",
      "example": "if {[file exists $path]} { puts \"found\" }"
    },
    "isfile": {
      "signature": "file isfile name",
      "description": "Returns 1 if name is a regular file.",
      "example": "file isfile $path  ;# → 1 or 0"
    },
    "isdirectory": {
      "signature": "file isdirectory name",
      "description": "Returns 1 if name is a directory.",
      "example": "file isdirectory $path  ;# → 1 or 0"
    },
    "mkdir": {
      "signature": "file mkdir dir ?dir ...?",
      "description": "Creates directories and all necessary parent directories.",
      "example": "file mkdir /tmp/test/nested/dir"
    },
    "copy": {
      "signature": "file copy ?-force? ?--? source target",
      "description": "Copies a file or directory.",
      "example": "file copy input.tdr backup.tdr"
    },
    "delete": {
      "signature": "file delete ?-force? ?--? pathname ?pathname ...?",
      "description": "Deletes files or directories.",
      "example": "file delete -force /tmp/test"
    },
    "rename": {
      "signature": "file rename ?-force? ?--? source target",
      "description": "Renames or moves a file or directory.",
      "example": "file rename old.tdr new.tdr"
    },
    "nativename": {
      "signature": "file nativename name",
      "description": "Returns the platform-specific native form of the path.",
      "example": "file nativename /usr/local  ;# → /usr/local (Unix) or \\usr\\local (Win)"
    },
    "normalize": {
      "signature": "file normalize name",
      "description": "Returns an absolute path with . and .. resolved.",
      "example": "file normalize ../test  ;# → /absolute/path/test"
    },
    "stat": {
      "signature": "file stat name varName",
      "description": "Stores file status information (atime, ctime, dev, gid, ino, mode, mtime, nlink, size, type, uid) in array varName.",
      "example": "file stat $path arr; puts $arr(size)"
    },
    "size": {
      "signature": "file size name",
      "description": "Returns the file size in bytes.",
      "example": "file size output.tdr  ;# → 1048576"
    },
    "readable": {
      "signature": "file readable name",
      "description": "Returns 1 if the file is readable by the current user.",
      "example": "if {[file readable $path]} { ... }"
    },
    "writable": {
      "signature": "file writable name",
      "description": "Returns 1 if the file is writable by the current user.",
      "example": "if {[file writable $path]} { ... }"
    },
    "executable": {
      "signature": "file executable name",
      "description": "Returns 1 if the file is executable.",
      "example": "file executable $script  ;# → 1 or 0"
    },
    "mtime": {
      "signature": "file mtime name ?time?",
      "description": "Returns or sets the last modification time (Unix epoch seconds).",
      "example": "file mtime output.tdr  ;# → 1715232000"
    },
    "atime": {
      "signature": "file atime name ?time?",
      "description": "Returns or sets the last access time (Unix epoch seconds).",
      "example": "file atime output.tdr  ;# → 1715232000"
    },
    "type": {
      "signature": "file type name",
      "description": "Returns the type of file: file, directory, characterSpecial, blockSpecial, fifo, link, or socket.",
      "example": "file type $path  ;# → file"
    }
  },
  "info": {
    "exists": {
      "signature": "info exists varName",
      "description": "Returns 1 if the named variable exists in the current scope.",
      "example": "if {[info exists voltage]} { puts $voltage }"
    },
    "commands": {
      "signature": "info commands ?pattern?",
      "description": "Returns names of visible commands matching pattern.",
      "example": "info commands string*  ;# → string"
    },
    "procs": {
      "signature": "info procs ?pattern?",
      "description": "Returns names of visible procedures matching pattern.",
      "example": "info procs calc_*  ;# → list of proc names"
    },
    "args": {
      "signature": "info procname procname",
      "description": "Returns the argument list of the named procedure.",
      "example": "info args myProc  ;# → {a b {c 0}}"
    },
    "body": {
      "signature": "info body procname",
      "description": "Returns the body of the named procedure.",
      "example": "info body myProc  ;# → return $result"
    },
    "level": {
      "signature": "info level ?number?",
      "description": "Returns the current stack level or info about a specific level.",
      "example": "info level  ;# → 0"
    },
    "script": {
      "signature": "info script ?filename?",
      "description": "Returns the name of the currently executing script file.",
      "example": "set dir [file dirname [info script]]"
    },
    "hostname": {
      "signature": "info hostname",
      "description": "Returns the name of the machine.",
      "example": "info hostname  ;# → workstation01"
    },
    "patchlevel": {
      "signature": "info patchlevel",
      "description": "Returns the exact version of the Tcl interpreter (e.g., 8.6.12).",
      "example": "info patchlevel  ;# → 8.6.12"
    },
    "tclversion": {
      "signature": "info tclversion",
      "description": "Returns the major.minor Tcl version.",
      "example": "info tclversion  ;# → 8.6"
    },
    "globals": {
      "signature": "info globals ?pattern?",
      "description": "Returns names of global variables matching pattern.",
      "example": "info globals env*  ;# → env"
    },
    "locals": {
      "signature": "info locals ?pattern?",
      "description": "Returns names of local variables matching pattern.",
      "example": "info locals  ;# → list of local var names"
    },
    "vars": {
      "signature": "info vars ?pattern?",
      "description": "Returns names of all visible variables (local + global via upvar/global).",
      "example": "info vars  ;# → list of visible var names"
    },
    "default": {
      "signature": "info default procname arg varName",
      "description": "Returns 1 if arg has a default value, stores it in varName.",
      "example": "info default myProc voltage defVal"
    }
  },
  "array": {
    "exists": {
      "signature": "array exists arrayName",
      "description": "Returns 1 if arrayName is an array variable.",
      "example": "if {[array exists opts]} { ... }"
    },
    "get": {
      "signature": "array get arrayName ?pattern?",
      "description": "Returns a list of key-value pairs matching pattern.",
      "example": "array get opts  ;# → key1 val1 key2 val2"
    },
    "set": {
      "signature": "array set arrayName list",
      "description": "Sets array elements from a key-value list.",
      "example": "array set opts {voltage 1.2 current 0.5}"
    },
    "names": {
      "signature": "array names arrayName ?mode? ?pattern?",
      "description": "Returns element names matching pattern. Mode: -exact, -glob, -regexp.",
      "example": "array names opts  ;# → voltage current"
    },
    "size": {
      "signature": "array size arrayName",
      "description": "Returns the number of elements in the array.",
      "example": "array size opts  ;# → 2"
    },
    "unset": {
      "signature": "array unset arrayName ?pattern?",
      "description": "Unsets array elements matching pattern (all if no pattern).",
      "example": "array unset opts voltage"
    },
    "statistics": {
      "signature": "array statistics arrayName",
      "description": "Returns statistics about the array hash table distribution.",
      "example": "array statistics opts"
    }
  },
  "dict": {
    "create": {
      "signature": "dict create ?key value ...?",
      "description": "Creates a new dictionary from key-value arguments.",
      "example": "set d [dict create name \"test\" value 42]"
    },
    "get": {
      "signature": "dict get dictionary ?key ...?",
      "description": "Returns the value for the given key path.",
      "example": "dict get $d name  ;# → test"
    },
    "set": {
      "signature": "dict set dictVar key ?key ...? value",
      "description": "Sets a value in a dictionary variable at the given key path.",
      "example": "dict set opts debug true"
    },
    "exists": {
      "signature": "dict exists dictionary key ?key ...?",
      "description": "Returns 1 if the key path exists in the dictionary.",
      "example": "if {[dict exists $d name]} { ... }"
    },
    "unset": {
      "signature": "dict unset dictVar key ?key ...?",
      "description": "Removes the entry at the given key path from the dictionary.",
      "example": "dict unset opts debug"
    },
    "remove": {
      "signature": "dict remove dictionary ?key ...?",
      "description": "Returns a new dictionary with the specified keys removed.",
      "example": "dict remove $d debug verbose"
    },
    "replace": {
      "signature": "dict replace dictionary ?key value ...?",
      "description": "Returns a new dictionary with specified key-value pairs replaced.",
      "example": "dict replace $d name \"newname\""
    },
    "merge": {
      "signature": "dict merge ?dictionary ...?",
      "description": "Merges multiple dictionaries (later values override earlier).",
      "example": "dict merge $defaults $userOpts"
    },
    "keys": {
      "signature": "dict keys dictionary ?pattern?",
      "description": "Returns a list of keys matching pattern.",
      "example": "dict keys $d  ;# → name value"
    },
    "values": {
      "signature": "dict values dictionary ?pattern?",
      "description": "Returns a list of values for keys matching pattern.",
      "example": "dict values $d  ;# → test 42"
    },
    "size": {
      "signature": "dict size dictionary",
      "description": "Returns the number of key-value pairs.",
      "example": "dict size $d  ;# → 2"
    },
    "for": {
      "signature": "dict for {keyVar valueVar} dictionary body",
      "description": "Iterates over dictionary key-value pairs.",
      "example": "dict for {k v} $opts { puts \"$k = $v\" }"
    },
    "map": {
      "signature": "dict map {keyVar valueVar} dictionary body",
      "description": "Maps over dictionary, collecting body results into a new dict (Tcl 8.7+).",
      "example": "dict map {k v} $opts { string toupper $v }"
    },
    "filter": {
      "signature": "dict filter dictionary filterType arg ?arg ...?",
      "description": "Filters dictionary by key, value, or script.",
      "example": "dict filter $d key name"
    },
    "info": {
      "signature": "dict info dictionary",
      "description": "Returns internal information about the dictionary.",
      "example": "dict info $d"
    },
    "update": {
      "signature": "dict update dictVar key varName ?key varName ...? body",
      "description": "Updates dictionary entries from variables after executing body.",
      "example": "dict update opts voltage v { set v [expr {$v * 2}] }"
    },
    "with": {
      "signature": "dict with dictVar ?key ...? body",
      "description": "Creates variables from dictionary keys, executes body, writes back.",
      "example": "dict with opts { puts $voltage }"
    }
  }
}
```

- [ ] **Step 2: 验证 JSON 格式**

Run: `node -e "const d = require('./syntaxes/tcl_subcommand_docs.json'); console.log(Object.keys(d).map(k => k + ':' + Object.keys(d[k]).length).join(', '))"`
Expected: `string:23, file:22, info:14, array:7, dict:17`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/tcl_subcommand_docs.json
git commit -m "feat: 添加 Tcl 子命令英文文档（string/file/info/array/dict 共 83 条）"
```

---

### Task 2: 创建中文子命令文档 JSON

**Files:**
- Create: `syntaxes/tcl_subcommand_docs.zh-CN.json`

- [ ] **Step 1: 创建中文文档文件**

复制英文版并翻译 description 和 example 为中文。结构格式与英文版完全一致，所有 signature 保持英文。

每个子命令的 description 翻译为中文。例如：

```json
{
  "string": {
    "length": {
      "signature": "string length string",
      "description": "返回字符串的字符数（非字节数）。",
      "example": "string length \"Hello\"  ;# → 5"
    },
    "match": {
      "signature": "string match ?-nocase? pattern string",
      "description": "判断字符串是否匹配 glob 模式（*、?、[chars]）。",
      "example": "string match *.tdr $filename"
    }
  }
}
```

> 所有 83 个子命令条目都需要翻译。signature 保持英文不翻译，description 翻译为中文，example 中的注释可翻译。

- [ ] **Step 2: 验证 JSON 格式和条目数**

Run: `node -e "const d = require('./syntaxes/tcl_subcommand_docs.zh-CN.json'); const e = require('./syntaxes/tcl_subcommand_docs.json'); const sk = Object.keys(e); for (const k of sk) { const a = Object.keys(e[k]).length; const b = Object.keys(d[k]).length; if (a !== b) console.error(k + ': EN=' + a + ' ZH=' + b) } console.log('OK')"`
Expected: `OK`（中英文条目数一致）

- [ ] **Step 3: 提交**

```bash
git add syntaxes/tcl_subcommand_docs.zh-CN.json
git commit -m "feat: 添加 Tcl 子命令中文文档（83 条，与英文版对应）"
```

---

### Task 3: 在 sdevice.tmLanguage.json 添加子命令 match

**Files:**
- Modify: `syntaxes/sdevice.tmLanguage.json:13-14`

sdevice 是结构最简单的文件（共约 15 行），作为模板。

- [ ] **Step 1: 读取当前文件确认插入位置**

读取 `syntaxes/sdevice.tmLanguage.json`，确认：
- 第 13 行是 `proc|try|throw` 匹配
- 第 14 行是顶级 Tcl 命令匹配（`string|file|info|array|...`）

- [ ] **Step 2: 在第 13 行后、第 14 行前插入 5 条子命令 match**

插入以下 5 条 JSON 对象（注意 scope 为 `support.function.sdevice`）：

```json
{ "match": "\\b(string)\\s+(length|match|range|first|last|index|trim|trimleft|trimright|tolower|toupper|totitle|equal|compare|is|map|repeat|replace|reverse|cat|wordstart|wordend|bytelength)\\b", "captures": { "1": { "name": "support.function.sdevice" }, "2": { "name": "support.function.tcl-subcommand" } } },
{ "match": "\\b(file)\\s+(join|dirname|tail|extension|rootname|exists|isfile|isdirectory|mkdir|copy|delete|rename|nativename|normalize|stat|size|readable|writable|executable|mtime|atime|type)\\b", "captures": { "1": { "name": "support.function.sdevice" }, "2": { "name": "support.function.tcl-subcommand" } } },
{ "match": "\\b(info)\\s+(exists|commands|procs|args|body|level|script|hostname|patchlevel|tclversion|globals|locals|vars|default)\\b", "captures": { "1": { "name": "support.function.sdevice" }, "2": { "name": "support.function.tcl-subcommand" } } },
{ "match": "\\b(array)\\s+(exists|get|set|names|size|unset|statistics)\\b", "captures": { "1": { "name": "support.function.sdevice" }, "2": { "name": "support.function.tcl-subcommand" } } },
{ "match": "\\b(dict)\\s+(create|get|set|exists|unset|remove|replace|merge|keys|values|size|for|map|filter|info|update|with)\\b", "captures": { "1": { "name": "support.function.sdevice" }, "2": { "name": "support.function.tcl-subcommand" } } },
```

插入后的 patterns 顺序：
1. sdevice 专有关键词（section 等）
2. 预处理器（#define 等）
3. 注释
4. 字符串
5. 数字
6. SWB 参数
7. 流控制（if|for|while...）
8. proc|try|throw
9. **[新增] 5 条子命令 match**
10. 顶级 Tcl 命令
11. 数学函数
12. 兜底标识符

- [ ] **Step 3: 验证 JSON 有效性**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/sdevice.tmLanguage.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: 提交**

```bash
git add syntaxes/sdevice.tmLanguage.json
git commit -m "feat: sdevice 语法添加 Tcl 子命令上下文感知高亮（string/file/info/array/dict）"
```

---

### Task 4: 复制子命令 match 到其余 4 个 tmLanguage 文件

**Files:**
- Modify: `syntaxes/sprocess.tmLanguage.json`
- Modify: `syntaxes/emw.tmLanguage.json`
- Modify: `syntaxes/inspect.tmLanguage.json`
- Modify: `syntaxes/svisual.tmLanguage.json`

- [ ] **Step 1: 对每个文件定位插入点**

每个文件中搜索顶级 Tcl 命令行（包含 `string|file|info|array|set|...`），在该行**之前**插入 5 条子命令 match。

插入位置规则与 sdevice 相同：在 `proc|try|throw` 行之后、顶级 Tcl 命令行之前。

各文件 scope 后缀：
- sprocess → `support.function.sprocess`
- emw → `support.function.emw`
- inspect → `support.function.inspect`
- svisual → `support.function.svisual`

子命令 scope 统一使用 `support.function.tcl-subcommand`（所有文件相同）。

- [ ] **Step 2: 逐个文件插入**

对每个文件：
1. 找到 `proc|try|throw` 行和顶级 Tcl 命令行之间的位置
2. 插入 5 条子命令 match（将 `support.function.sdevice` 替换为对应语言名）
3. 验证 JSON：`node -e "JSON.parse(require('fs').readFileSync('<path>','utf8')); console.log('OK')"`

- [ ] **Step 3: 提交**

```bash
git add syntaxes/sprocess.tmLanguage.json syntaxes/emw.tmLanguage.json syntaxes/inspect.tmLanguage.json syntaxes/svisual.tmLanguage.json
git commit -m "feat: 4 个 Tcl 工具语法添加子命令上下文感知高亮（sprocess/emw/inspect/svisual）"
```

---

### Task 5: 在 all_keywords.json 添加 SUBCOMMAND 类别

**Files:**
- Modify: `syntaxes/all_keywords.json`

- [ ] **Step 1: 确认 all_keywords.json 结构**

读取文件前 100 行，确认数据结构格式（顶层键是类别名还是工具名）。

- [ ] **Step 2: 添加 SUBCOMMAND 类别**

在 5 个 Tcl 工具的 section 中各新增 SUBCOMMAND 类别，包含该工具对应的所有子命令列表。

子命令列表来源：从 `tcl_subcommand_docs.json` 提取所有主命令下的子命令名，合并去重。

- [ ] **Step 3: 验证 JSON 有效性**

Run: `node -e "JSON.parse(require('fs').readFileSync('syntaxes/all_keywords.json','utf8')); console.log('OK')"`

- [ ] **Step 4: 提交**

```bash
git add syntaxes/all_keywords.json
git commit -m "feat: all_keywords 添加 SUBCOMMAND 类别（5 个工具共 83 个子命令）"
```

---

### Task 6: 修改 extension.js — 文档加载 + HoverProvider

**Files:**
- Modify: `src/extension.js:367-370`（文档加载）
- Modify: `src/extension.js:678-781`（HoverProvider）

- [ ] **Step 1: 添加子命令文档加载**

在 `getDocs()` 函数中（约第 367-370 行），现有 `_docsCache.tcl` 和 `_docsCache.tclMath` 之后，添加：

```javascript
_docsCache.tclSub = loadDocsJson('tcl_subcommand_docs.json', useZh) || {};
```

位置在 `if (!_docsCache.tcl) { ... }` 块内，紧跟 `_docsCache.tclMath` 行之后。

- [ ] **Step 2: 在 HoverProvider 中添加子命令查找**

在 HoverProvider（约第 678 行起）中，在现有的 `getDocs(langId)` 调用之后、sdevice 上下文感知逻辑之前，添加子命令检测：

```javascript
// Tcl 子命令上下文感知悬停
const lineText = document.lineAt(position.line).text;
const linePrefix = lineText.substring(0, position.character);
const subcmdMatch = linePrefix.match(/\b(string|file|info|array|dict)\s+(\w+)$/);
if (subcmdMatch) {
    const [, parentCmd, subcmd] = subcmdMatch;
    const subDocs = _docsCache.tclSub;
    if (subDocs && subDocs[parentCmd] && subDocs[parentCmd][word]) {
        const subDoc = subDocs[parentCmd][word];
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${parentCmd} ${word}** \`（Tcl 子命令）\`\n\n`);
        md.appendCodeblock(subDoc.signature, 'tcl');
        md.appendMarkdown(`\n\n${subDoc.description}`);
        if (subDoc.example) {
            md.appendMarkdown('\n\n**示例：**\n');
            md.appendCodeblock(subDoc.example, 'tcl');
        }
        return new vscode.Hover(md, range);
    }
}
```

关键设计点：
- 使用 `linePrefix.match(/\b(string|file|info|array|dict)\s+(\w+)$/)` 检测光标前是否有 "主命令 + 子命令" 组合
- 只在光标下的 word 与匹配到的子命令一致时才显示文档
- 查找 `_docsCache.tclSub[parentCmd][word]`（嵌套两级）

- [ ] **Step 3: 调整悬停优先级**

确保查找优先级为：
1. sdevice 上下文感知（已有）
2. **Tcl 子命令组合（新增，在 sdevice 逻辑之后）**
3. 现有通用文档查找

- [ ] **Step 4: 验证**

启动 Extension Development Host（F5），打开一个 svisual `.tcl` 文件，悬停在 `string length` 的 `length` 上，确认显示子命令文档。

- [ ] **Step 5: 提交**

```bash
git add src/extension.js
git commit -m "feat: HoverProvider 添加 Tcl 子命令上下文感知悬停文档"
```

---

### Task 7: 修改 extension.js — CompletionProvider

**Files:**
- Modify: `src/extension.js:568-614`（CompletionProvider）

- [ ] **Step 1: 在 provideCompletionItems 中添加子命令补全**

在 CompletionProvider 的 `provideCompletionItems` 方法中，在返回现有补全项之前，添加子命令上下文检测：

```javascript
// Tcl 子命令上下文感知补全
const lineText = document.lineAt(position.line).text;
const linePrefix = lineText.substring(0, position.character);
const subcmdContext = linePrefix.match(/\b(string|file|info|array|dict)\s+$/);
if (subcmdContext) {
    const parentCmd = subcmdContext[1];
    const subDocs = _docsCache.tclSub;
    if (subDocs && subDocs[parentCmd]) {
        const subItems = [];
        for (const [name, doc] of Object.entries(subDocs[parentCmd])) {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Method);
            item.detail = 'Tcl 子命令';
            item.documentation = new vscode.MarkdownString(doc.description);
            subItems.push(item);
        }
        return subItems;
    }
}
```

关键设计点：
- 触发条件：光标前文本以 `\b(string|file|info|array|dict)\s+$` 结尾（主命令后只有空白）
- 返回子命令补全后**直接 return**，不再返回常规补全（避免阻断变量的联想，但子命令位置通常不需要变量）
- `kind = Method` 表示这是一个方法/子命令

- [ ] **Step 2: 确保 _docsCache.tclSub 在补全触发时已加载**

检查 `getDocs(langId)` 是否在补全触发前已被调用（激活时调用），确保 `_docsCache.tclSub` 已初始化。如果未初始化，需要在补全方法中加一次 `getDocs(langId)` 调用。

- [ ] **Step 3: 验证**

在 Extension Development Host 中：
1. 打开 `.tcl` 文件
2. 输入 `string ` 后按 Ctrl+Space
3. 确认出现 `length`, `match`, `range` 等子命令补全
4. 输入 `string length ` 后按 Ctrl+Space
5. 确认正常出现变量/关键词补全（不被阻断）

- [ ] **Step 4: 提交**

```bash
git add src/extension.js
git commit -m "feat: CompletionProvider 添加 Tcl 子命令上下文感知补全"
```

---

### Task 8: 更新 scope-color-reference.md

**Files:**
- Modify: `docs/scope-color-reference.md`

- [ ] **Step 1: 添加新 scope 条目**

在 scope 参考文档中添加：

```
support.function.tcl-subcommand  | 子命令（string length 的 length）| 所有 Tcl 工具
```

- [ ] **Step 2: 提交**

```bash
git add docs/scope-color-reference.md
git commit -m "docs: scope 参考添加 tcl-subcommand scope"
```

---

### Task 9: 创建测试展示文件

**Files:**
- Create: `display_test/tcl_subcommands_test.cmd`

- [ ] **Step 1: 创建测试文件**

```tcl
# Tcl Subcommand Highlighting Test
# 所有子命令应在主命令上下文中高亮

# === string 子命令 ===
string length "Hello"
string match *.tdr $filename
string range $text 0 4
string first "World" $text
string last "o" $text
string index $text end
string trim "  Hello  "
string trimleft "0042" 0
string trimright "Hello000" 0
string tolower "Hello"
string toupper "Hello"
string totitle "hello world"
string equal "abc" "abc"
string compare "abc" "abd"
string is digit "123"
string map {abc 1} $text
string repeat "Ha" 3
string replace $text 5 11 "Tcl"
string reverse "Hello"
string cat "Hello" " " "World"

# === file 子命令 ===
file join /usr local bin
file dirname /usr/local/bin/tclsh
file tail /usr/local/bin/tclsh
file extension "output.tdr"
file rootname "output.tdr"
file exists $path
file isfile $path
file isdirectory $path
file mkdir /tmp/test
file copy input.tdr backup.tdr
file delete -force /tmp/test
file rename old.tdr new.tdr
file normalize $path
file size output.tdr
file readable $path
file writable $path
file executable $script
file mtime output.tdr

# === info 子命令 ===
info exists voltage
info commands string*
info procs calc_*
info args myProc
info body myProc
info level
info script
info hostname
info patchlevel
info tclversion
info globals
info locals
info vars

# === array 子命令 ===
array exists opts
array get opts
array set opts {voltage 1.2}
array names opts
array size opts
array unset opts voltage

# === dict 子命令 ===
dict create name "test" value 42
dict get $d name
dict set opts debug true
dict exists $d name
dict remove $d debug
dict merge $defaults $userOpts
dict keys $d
dict values $d
dict size $d
dict for {k v} $opts { puts "$k = $v" }

# === 嵌套组合测试 ===
string length [string match *.tdr $file]
set len [string length [file tail $path]]
if {[file exists [file join $dir $fname]]} { puts "found" }

# === 非子命令上下文（不应高亮） ===
# length 单独出现不应被高亮为子命令
set length 10
set match "pattern"
# file 单独出现应被高亮为顶级命令
file
string
info
```

- [ ] **Step 2: 手动验证**

在 VSCode Extension Development Host 中打开此文件，确认：
1. 所有子命令在主命令后有特殊颜色
2. 主命令本身保持原有颜色
3. 注释中的子命令不高亮
4. 字符串中的子命令不高亮
5. 底部非上下文中的 `length`、`match` 不被高亮为子命令
6. 嵌套组合中的每个子命令都被正确高亮

- [ ] **Step 3: 提交**

```bash
git add display_test/tcl_subcommands_test.cmd
git commit -m "test: 添加 Tcl 子命令高亮测试展示文件"
```

---

### Task 10: 更新 CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新文件树**

在 `syntaxes/` 部分添加新文件：

```
├── tcl_subcommand_docs.{json,zh-CN.json} ← Tcl 子命令文档（中英文双语，5 主命令 83 子命令）
```

- [ ] **Step 2: 更新架构描述**

在"第二层：关键词补全与文档悬停"章节中，补充子命令覆盖信息：

添加描述：Tcl 子命令采用单次 match+captures 模式实现上下文感知高亮，覆盖 string/file/info/array/dict 5 个主命令共 83 个子命令。HoverProvider 通过同行前向扫描检测主命令-子命令组合，查找嵌套两级文档 JSON。CompletionProvider 在主命令后第一个参数位触发子命令补全。

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 文件树和架构描述（Tcl 子命令功能）"
```
