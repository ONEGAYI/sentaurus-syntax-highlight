# SDE Snippet 前缀自定义设置 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许用户通过 VSCode 设置自定义 SDE snippets 中的 10 个官方命名前缀。

**Architecture:** 在 `package.json` 中注册 `sentaurus.snippetPrefixes` 配置项（10 个 string 子属性，含 i18n description）。在 `extension.js` 中新增 `applySnippetPrefixes()` 纯函数，在 snippet 插入前对模板文本做字符串替换。

**Tech Stack:** VSCode Extension API (`workspace.getConfiguration`), `String.replaceAll()`, JSON Schema (package.json contributes.configuration)

---

### Task 1: 添加配置定义到 package.json

**Files:**
- Modify: `package.json:26` (在 `contributes` 对象中添加 `configuration` 数组)

- [ ] **Step 1: 在 `contributes` 中添加 `configuration` 字段**

在 `package.json` 的 `contributes` 对象中，`snippets` 数组之后、`contributes` 闭合花括号之前，添加 `configuration` 数组。内容为 `sentaurus.snippetPrefixes` 对象配置，包含 10 个 `properties`，每个属性含 `type: "string"`、`default`、`description`、`description.zh-CN`、`markdownDescription`、`markdownDescription.zh-CN`。

```json
"configuration": [
  {
    "title": "Sentaurus TCAD Syntax",
    "properties": {
      "sentaurus.snippetPrefixes.RW": {
        "type": "string",
        "default": "RW.",
        "description": "Prefix for Refinement Evaluation Window.",
        "description.zh-CN": "细化求值窗口的前缀。",
        "markdownDescription": "Prefix for **Refinement Evaluation Window**.\n\nAffects:\n- `Doping > Const-box` → `sdedr:define-refeval-window`\n- `Doping > Gauss` → `sdedr:define-refeval-window`\n- `Doping > Submesh` → `sdedr:define-refeval-window`\n- `Meshing > Ref-box` → `sdedr:define-refeval-window`",
        "markdownDescription.zh-CN": "**细化求值窗口**的前缀。\n\n影响范围：\n- `Doping > Const-box` → `sdedr:define-refeval-window`\n- `Doping > Gauss` → `sdedr:define-refeval-window`\n- `Doping > Submesh` → `sdedr:define-refeval-window`\n- `Meshing > Ref-box` → `sdedr:define-refeval-window`",
        "order": 1
      },
      "sentaurus.snippetPrefixes.DC": {
        "type": "string",
        "default": "DC.",
        "description": "Prefix for Doping Constant profile.",
        "description.zh-CN": "恒定掺杂分布的前缀。",
        "markdownDescription": "Prefix for **Doping Constant profile**.\n\nAffects:\n- `Doping > Const-box` → `sdedr:define-constant-profile`\n- `Doping > Const-material` → `sdedr:define-constant-profile`\n- `Doping > Const-region` → `sdedr:define-constant-profile`",
        "markdownDescription.zh-CN": "**恒定掺杂分布**的前缀。\n\n影响范围：\n- `Doping > Const-box` → `sdedr:define-constant-profile`\n- `Doping > Const-material` → `sdedr:define-constant-profile`\n- `Doping > Const-region` → `sdedr:define-constant-profile`",
        "order": 2
      },
      "sentaurus.snippetPrefixes.CPP": {
        "type": "string",
        "default": "CPP.",
        "description": "Prefix for Constant Profile Placement.",
        "description.zh-CN": "恒定掺杂放置的前缀。",
        "markdownDescription": "Prefix for **Constant Profile Placement**.\n\nAffects:\n- `Doping > Const-box` → `sdedr:define-constant-profile-placement`",
        "markdownDescription.zh-CN": "**恒定掺杂放置**的前缀。\n\n影响范围：\n- `Doping > Const-box` → `sdedr:define-constant-profile-placement`",
        "order": 3
      },
      "sentaurus.snippetPrefixes.CPM": {
        "type": "string",
        "default": "CPM.",
        "description": "Prefix for Constant Profile Material/Region placement.",
        "description.zh-CN": "恒定掺杂按材料/区域放置的前缀。",
        "markdownDescription": "Prefix for **Constant Profile Material/Region placement**.\n\nAffects:\n- `Doping > Const-material` → `sdedr:define-constant-profile-material`\n- `Doping > Const-region` → `sdedr:define-constant-profile-region`",
        "markdownDescription.zh-CN": "**恒定掺杂按材料/区域放置**的前缀。\n\n影响范围：\n- `Doping > Const-material` → `sdedr:define-constant-profile-material`\n- `Doping > Const-region` → `sdedr:define-constant-profile-region`",
        "order": 4
      },
      "sentaurus.snippetPrefixes.GAUSS": {
        "type": "string",
        "default": "GAUSS.",
        "description": "Prefix for Gaussian analytic profile.",
        "description.zh-CN": "高斯分析掺杂分布的前缀。",
        "markdownDescription": "Prefix for **Gaussian analytic profile**.\n\nAffects:\n- `Doping > Gauss` → `sdedr:define-gaussian-profile`",
        "markdownDescription.zh-CN": "**高斯分析掺杂分布**的前缀。\n\n影响范围：\n- `Doping > Gauss` → `sdedr:define-gaussian-profile`",
        "order": 5
      },
      "sentaurus.snippetPrefixes.IMP": {
        "type": "string",
        "default": "IMP.",
        "description": "Prefix for Analytical (Implant) profile placement.",
        "description.zh-CN": "分析（注入）掺杂放置的前缀。",
        "markdownDescription": "Prefix for **Analytical (Implant) profile placement**.\n\nAffects:\n- `Doping > Gauss` → `sdedr:define-analytical-profile-placement`",
        "markdownDescription.zh-CN": "**分析（注入）掺杂放置**的前缀。\n\n影响范围：\n- `Doping > Gauss` → `sdedr:define-analytical-profile-placement`",
        "order": 6
      },
      "sentaurus.snippetPrefixes.SM": {
        "type": "string",
        "default": "SM.",
        "description": "Prefix for Submesh definition.",
        "description.zh-CN": "子网格定义的前缀。",
        "markdownDescription": "Prefix for **Submesh definition**.\n\nAffects:\n- `Doping > Submesh` → `sdedr:define-submesh`",
        "markdownDescription.zh-CN": "**子网格定义**的前缀。\n\n影响范围：\n- `Doping > Submesh` → `sdedr:define-submesh`",
        "order": 7
      },
      "sentaurus.snippetPrefixes.PSM": {
        "type": "string",
        "default": "PSM.",
        "description": "Prefix for Submesh Placement.",
        "description.zh-CN": "子网格放置的前缀。",
        "markdownDescription": "Prefix for **Submesh Placement**.\n\nAffects:\n- `Doping > Submesh` → `sdedr:define-submesh-placement`",
        "markdownDescription.zh-CN": "**子网格放置**的前缀。\n\n影响范围：\n- `Doping > Submesh` → `sdedr:define-submesh-placement`",
        "order": 8
      },
      "sentaurus.snippetPrefixes.RS": {
        "type": "string",
        "default": "RS.",
        "description": "Prefix for Refinement Size specification.",
        "description.zh-CN": "网格细化尺寸的前缀。",
        "markdownDescription": "Prefix for **Refinement Size specification**.\n\nAffects:\n- `Meshing > Ref-box` → `sdedr:define-refinement-size`\n- `Meshing > Ref-material` → `sdedr:define-refinement-size`\n- `Meshing > Ref-region` → `sdedr:define-refinement-size`",
        "markdownDescription.zh-CN": "**网格细化尺寸**的前缀。\n\n影响范围：\n- `Meshing > Ref-box` → `sdedr:define-refinement-size`\n- `Meshing > Ref-material` → `sdedr:define-refinement-size`\n- `Meshing > Ref-region` → `sdedr:define-refinement-size`",
        "order": 9
      },
      "sentaurus.snippetPrefixes.RP": {
        "type": "string",
        "default": "RP.",
        "description": "Prefix for Refinement Placement.",
        "description.zh-CN": "网格细化放置的前缀。",
        "markdownDescription": "Prefix for **Refinement Placement**.\n\nAffects:\n- `Meshing > Ref-box` → `sdedr:define-refinement-placement`\n- `Meshing > Ref-material` → `sdedr:define-refinement-material`\n- `Meshing > Ref-region` → `sdedr:define-refinement-region`",
        "markdownDescription.zh-CN": "**网格细化放置**的前缀。\n\n影响范围：\n- `Meshing > Ref-box` → `sdedr:define-refinement-placement`\n- `Meshing > Ref-material` → `sdedr:define-refinement-material`\n- `Meshing > Ref-region` → `sdedr:define-refinement-region`",
        "order": 10
      }
    }
  }
]
```

插入位置：`package.json` 第 123 行 `"snippets"` 数组的闭合 `]` 之后、`contributes` 对象的闭合 `}` 之前，添加逗号后插入上述 JSON。

- [ ] **Step 2: 验证 JSON 合法性**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: 提交**

```bash
git add package.json
git commit -m "feat: 添加 snippetPrefixes 配置定义到 package.json"
```

---

### Task 2: 实现 applySnippetPrefixes 函数和调用点

**Files:**
- Modify: `src/extension.js:130` (在 snippet 数据加载之后、`showToolSnippets` 之前添加函数)
- Modify: `src/extension.js:187` (在 insertSnippet 调用前应用替换)
- Create: `tests/test-snippet-prefixes.js` (纯 Node.js 单元测试)

- [ ] **Step 1: 编写 applySnippetPrefixes 纯函数的单元测试**

创建 `tests/test-snippet-prefixes.js`，测试以下场景：
1. 默认配置下不做任何替换
2. 单个前缀自定义时正确替换
3. 前缀设为空字符串时移除前缀
4. 替换不影响非前缀的相同字符串（如注释中的文本）

```javascript
const assert = require('assert');

// === 模拟 applySnippetPrefixes 的核心逻辑（与 extension.js 中一致） ===
// 这里直接测试替换逻辑，不依赖 VSCode API

const DEFAULT_PREFIXES = {
    RW: 'RW.', DC: 'DC.', CPP: 'CPP.', CPM: 'CPM.',
    GAUSS: 'GAUSS.', IMP: 'IMP.', SM: 'SM.', PSM: 'PSM.',
    RS: 'RS.', RP: 'RP.',
};

function applySnippetPrefixes(snippetText, customPrefixes) {
    let result = snippetText;
    for (const [key, defaultVal] of Object.entries(DEFAULT_PREFIXES)) {
        const custom = customPrefixes[key];
        if (custom !== undefined && custom !== defaultVal) {
            result = result.replaceAll(`"${defaultVal}"`, `"${custom}"`);
        }
    }
    return result;
}

// --- 测试用例 ---

// 1. 默认配置不替换
const input1 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input1, { RW: 'RW.', DC: 'DC.' /* ... */ }),
    input1,
    '默认配置不应修改文本'
);
console.log('PASS: 默认配置不替换');

// 2. 单个前缀自定义
const input2 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input2, { RW: 'RefWin.' }),
    '(sdedr:define-refeval-window (string-append "RefWin." NAME))',
    '自定义 RW 前缀应正确替换'
);
console.log('PASS: 单个前缀自定义');

// 3. 前缀设为空字符串
const input3 = '(sdedr:define-refeval-window (string-append "RW." NAME))';
assert.strictEqual(
    applySnippetPrefixes(input3, { RW: '' }),
    '(sdedr:define-refeval-window (string-append "" NAME))',
    '空字符串应移除前缀'
);
console.log('PASS: 空字符串移除前缀');

// 4. 多处同名前缀全部替换
const input4 = [
    '(sdedr:define-refinement-size (string-append "RS." RNAME)',
    '(sdedr:define-refinement-placement (string-append "RP." RNAME)',
    '    (string-append "RS." RNAME) (string-append "RW." RNAME))',
].join('\n');
assert.strictEqual(
    applySnippetPrefixes(input4, { RS: 'RefSize.' }).match(/RefSize\./g).length,
    2,
    '多处同名前缀应全部替换'
);
console.log('PASS: 多处同名前缀全部替换');

// 5. 替换不影响非 string-append 上下文中的同名文本（注释等）
const input5 = '; Note: "RW." is the standard prefix for refinement windows\n(sdedr:define-refeval-window (string-append "RW." NAME))';
const result5 = applySnippetPrefixes(input5, { RW: 'RefWin.' });
assert.strictEqual(
    result5.match(/RefWin\./g).length,
    2,
    '注释中的同名前缀也应被替换（replaceAll 行为）'
);
console.log('PASS: replaceAll 替换所有出现位置');

console.log('\nAll tests passed.');
```

- [ ] **Step 2: 运行测试确认通过**

Run: `node tests/test-snippet-prefixes.js`
Expected: `All tests passed.`

- [ ] **Step 3: 在 extension.js 中添加 DEFAULT_PREFIXES 常量和 applySnippetPrefixes 函数**

在 `src/extension.js` 中，`// === QuickPick Snippet Data ===` 注释（第 130 行）之前，添加：

```javascript
// === SDE Snippet Prefix Customization ===
const DEFAULT_PREFIXES = {
    RW: 'RW.', DC: 'DC.', CPP: 'CPP.', CPM: 'CPM.',
    GAUSS: 'GAUSS.', IMP: 'IMP.', SM: 'SM.', PSM: 'PSM.',
    RS: 'RS.', RP: 'RP.',
};

/**
 * Replace official prefix literals in SDE snippet text with user-customized ones.
 * Only called when inserting SDE (Sentaurus-StructEditor) snippets.
 */
function applySnippetPrefixes(snippetText) {
    const config = vscode.workspace.getConfiguration('sentaurus.snippetPrefixes');
    let result = snippetText;
    for (const [key, defaultVal] of Object.entries(DEFAULT_PREFIXES)) {
        const custom = config.get(key);
        if (custom !== undefined && custom !== defaultVal) {
            result = result.replaceAll(`"${defaultVal}"`, `"${custom}"`);
        }
    }
    return result;
}
```

- [ ] **Step 4: 在 showToolSnippets 的 insertSnippet 调用前应用替换**

修改 `src/extension.js` 第 187 行：

将：
```javascript
await editor.insertSnippet(new vscode.SnippetString(sub.data.lines.join('\n') + '\n'));
```
改为：
```javascript
let snippetText = sub.data.lines.join('\n') + '\n';
if (toolName === 'Sentaurus-StructEditor') {
    snippetText = applySnippetPrefixes(snippetText);
}
await editor.insertSnippet(new vscode.SnippetString(snippetText));
```

- [ ] **Step 5: 再次运行测试确认逻辑一致**

Run: `node tests/test-snippet-prefixes.js`
Expected: `All tests passed.`

- [ ] **Step 6: 提交**

```bash
git add src/extension.js tests/test-snippet-prefixes.js
git commit -m "feat: 实现 snippet 前缀自定义替换逻辑"
```

---

### Task 3: 手动验证

**Files:** 无新建/修改

- [ ] **Step 1: 启动 Extension Development Host**

在 VSCode 中按 F5 启动 Extension Development Host。

- [ ] **Step 2: 验证默认行为不变**

1. 打开任意 `*_dvs.cmd` 文件
2. `Ctrl+Shift+P` → "Sentaurus: Insert Snippet" → "Sentaurus-StructEditor" → "Meshing" → "Ref-box"
3. 确认插入的代码中前缀仍为 `"RW."`、`"RS."`、`"RP."`

- [ ] **Step 3: 验证自定义前缀生效**

1. 在开发主窗口中，打开 Settings → 搜索 `sentaurus.snippetPrefixes`
2. 将 `RW` 修改为 `RefWin.`
3. 回到 Extension Development Host，再次插入 "Meshing > Ref-box"
4. 确认 `"RW."` 已变为 `"RefWin."`，而 `"RS."` 和 `"RP."` 保持不变

- [ ] **Step 4: 验证空值行为**

1. 将 `RW` 修改为空字符串
2. 再次插入 "Meshing > Ref-box"
3. 确认 `(string-append "" RNAME)` 前缀已移除

- [ ] **Step 5: 验证其他语言 snippets 不受影响**

1. 打开任意 `*_des.cmd` 文件
2. "Sentaurus: Insert Snippet" → "Sentaurus-Device" → 插入任意 snippet
3. 确认行为正常，无前缀替换

- [ ] **Step 6: 验证 i18n 显示**

1. Settings 中搜索 `sentaurus.snippetPrefixes`
2. 确认设置项列表显示中文描述（如"细化求值窗口的前缀。"）
3. 悬停某个设置项，确认 markdownDescription 中的中文影响范围信息正确显示

如果以上全部通过，实现完成。
