# 正确性审查报告 — tests/ 批次 1

审查范围: 18 文件, 4346 行
发现问题数: 6

## 高严重度

- **[高]** `tests/test-scheme-on-enter.js:128-142` — 空括号排除测试使用硬编码常量而非实际函数输出，无法验证条件交互逻辑
  - 当前代码:
    ```javascript
    test('简单空括号 (|) → 跳过', () => {
        assert.strictEqual(isLastOpenParenEmpty('(') && 1 <= 1, true);
    });
    test('嵌套空内层 (let (|)) → 不跳过', () => {
        assert.strictEqual(isLastOpenParenEmpty('(let (') && 2 <= 1, false);
    });
    test('三层嵌套 ((|)) → 不跳过', () => {
        assert.strictEqual(isLastOpenParenEmpty('((') && 2 <= 1, false);
    });
    ```
  - 建议改进: 这4个测试用例（行128-142）用 `1 <= 1` / `2 <= 1` 硬编码来模拟 `match[2].length` 的值。它们没有调用 `findClosingParens` 来获取实际的 `match` 对象。测试名为"空括号排除"但实际只分别测试了 `isLastOpenParenEmpty` 和一个永远为 false 的 `2 <= 1`，未能验证两个条件的联合逻辑（即 provider 第60行的 `if (isLastOpenParenEmpty(prevText) && match[2].length <= 1) return;`）。应构造完整的 prevText + currText 场景，调用 `findClosingParens` 获取真实 `match[2]`，再组合 `isLastOpenParenEmpty` 进行断言。

- **[高]** `tests/test-scheme-on-enter.js:128-142` — `((` 场景的测试断言通过原因与注释描述不符
  - 当前代码:
    ```javascript
    test('三层嵌套 ((|)) → 不跳过', () => {
        assert.strictEqual(isLastOpenParenEmpty('((') && 2 <= 1, false);
    });
    ```
  - 建议改进: `isLastOpenParenEmpty('((')` 返回 `true`（最后一个 `(` 后确实为空），`2 <= 1` 为 `false`，整体为 `false`。注释说"不跳过"结果正确，但测试通过的原因是 `2 <= 1` 硬编码为 false，而不是 `isLastOpenParenEmpty` 真正返回了 false。如果将来 provider 逻辑变更（例如不再检查 `match[2].length`），此测试仍会通过，给出错误的安全感。应使用实际函数输出。

## 中严重度

- **[中]** `tests/test-semantic-tokens.js:17-25` — 断言验证了 delta 编码后的原始数组值，未验证解码后的语义含义
  - 当前代码:
    ```javascript
    test('调用用户函数被标记为 function', () => {
        // ...
        assert.strictEqual(data.length, 5);
        assert.strictEqual(data[0], 1);
        assert.strictEqual(data[1], 1);
        assert.strictEqual(data[2], 1);
    });
    ```
  - 建议改进: 断言 `data[0]=1, data[1]=1, data[2]=1` 验证的是 delta 编码的行/列/长度值，阅读者需要知道编码规则才能理解意图。建议添加注释说明其含义（deltaLine=1, deltaCol=1, len=1 表示第2行第2列长度1的 token），或添加一个解码辅助函数来断言 `line=1, col=1, len=1` 这样的可读值。这不是 bug，但降低了测试的可维护性。

- **[中]** `tests/test-snippet-prefixes.js:62-70` — 测试 5 断言注释中的前缀也会被替换，但这是 `replaceAll` 的固有行为而非需求验证
  - 当前代码:
    ```javascript
    const input5 = '; Note: "RW." is the standard prefix\n(sdedr:define-refeval-window (string-append "RW." NAME))';
    const result5 = applySnippetPrefixes(input5, { RW: 'RefWin.' });
    assert.strictEqual(
        result5.match(/RefWin\./g).length,
        2,
        '注释中的同名前缀也应被替换'
    );
    ```
  - 建议改进: 如果注释中的前缀确实不应该被替换（可能破坏用户文档说明），则此测试断言了错误期望值，应改为 `1` 并在 `applySnippetPrefixes` 中过滤注释行。如果是有意为之，测试描述应更明确地说明"这是已知行为，注释也会被影响"。

- **[中]** `tests/test-scheme-undef-diagnostic.js:143-148` — KEYWORD2 关键词过滤测试仅验证函数名本身不被误报，未验证参数标识符（如 body、face）的误报情况
  - 当前代码:
    ```javascript
    test('KEYWORD2 级别关键词不被误报', () => {
        const code = '(find-edge-id body face)\n(find-body-id edge)';
        const undefs = findUndefRefs(code, new Set(['find-edge-id', 'find-body-id']));
        const kwUndefs = undefs.filter(r => r.name === 'find-edge-id' || r.name === 'find-body-id');
        assert.strictEqual(kwUndefs.length, 0, 'KEYWORD2 关键词不应被检测为未定义变量');
    });
    ```
  - 建议改进: `undefs` 实际包含 `['body', 'face', 'edge']`（经运行验证），这些参数标识符被报告为未定义，但测试没有对此做任何断言。如果 `body`/`face`/`edge` 是 SDE 内置参数名，则存在遗漏的白名单过滤。应补充断言确认这些参数是否应被报告，或添加注释说明这是预期行为。

## 低严重度

- **[低]** `tests/test-snippet-prefixes.js:9-18` — 测试文件内嵌了 `applySnippetPrefixes` 实现而非导入源码模块
  - 当前代码:
    ```javascript
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
    ```
  - 建议改进: 测试文件中重新实现了被测逻辑，而非从 `src/snippets/*.js` 导入。这意味着如果源码中的实现被修改，测试仍会基于旧的副本通过，无法检测回归。应从实际模块导入函数进行测试。

## 总结

18 个测试文件整体质量较高，断言覆盖了正常路径、边界条件和错误路径。主要问题集中在：

1. **`test-scheme-on-enter.js` 的空括号排除测试**（高严重度）：使用硬编码常量 `1 <= 1` / `2 <= 1` 模拟 `match[2].length`，未调用实际函数 `findClosingParens`，导致测试无法验证 `isLastOpenParenEmpty` 与 `match[2].length` 的联合交互逻辑。

2. **`test-snippet-prefixes.js` 复制实现**（低严重度 + 中严重度）：测试文件内嵌了被测函数的完整实现而非导入源码，如果源码变更则测试无法检测回归。

3. **`test-semantic-tokens.js` delta 编码断言**（中严重度）：直接断言 delta 编码后的原始值，缺少语义化解释。

4. **`test-scheme-undef-diagnostic.js` 参数标识符覆盖盲区**（中严重度）：仅验证函数名关键词不被误报，未对参数标识符（body/face/edge）的未定义报告做断言。

其余 14 个测试文件断言充分、覆盖合理，未发现正确性问题。
