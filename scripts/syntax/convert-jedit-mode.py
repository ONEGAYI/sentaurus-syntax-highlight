#!/usr/bin/env python3
"""
将 jEdit XML mode 文件转换为 TextMate tmLanguage.json（用于 SDEVICE PAR 文件）。

读取: jedit_modes/sdevicepar.xml, jedit_modes/spp.xml
输出: syntaxes/sdevicepar.tmLanguage.json, 更新 syntaxes/all_keywords.json

Usage: python scripts/syntax/convert-jedit-mode.py
"""

import xml.etree.ElementTree as ET
import json
import re
import os
import copy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JEDIT_DIR = os.path.join(SCRIPT_DIR, 'jedit_modes')
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
SYNTAXES_DIR = os.path.join(PROJECT_ROOT, 'syntaxes')

# ── jEdit token type → TextMate scope 映射 ──
TOKEN_TO_SCOPE = {
    'KEYWORD1': 'keyword.control.sdevicepar',
    'KEYWORD2': 'entity.name.function.sdevicepar',
    'KEYWORD3': 'entity.name.tag.sdevicepar',
    'KEYWORD4': 'support.class.sdevicepar',
    'LITERAL1': 'constant.numeric.sdevicepar',
    'LITERAL2': 'variable.parameter.sdevicepar',
    'LITERAL3': 'support.class.sdevicepar',
    'LITERAL4': 'constant.character.format.placeholder',
    'COMMENT1': 'comment.line.hash.sdevicepar',
    'COMMENT2': 'comment.line.asterisk.sdevicepar',
    'LABEL': 'entity.name.type.sdevicepar',
    'MARKUP': 'keyword.control.preprocessor.sdevicepar',
    'NULL': None,
}

# ── XML 解析 ──

def load_mode(path):
    """加载 jEdit XML mode 文件，返回 {SET_NAME: rules_dict}"""
    tree = ET.parse(path)
    root = tree.getroot()
    sets = {}
    for rules_elem in root.findall('RULES'):
        name = rules_elem.get('SET', 'MAIN')
        sets[name] = parse_rules(rules_elem)
    return sets


def parse_rules(elem):
    """解析单个 <RULES> 元素"""
    result = {
        'ignore_case': elem.get('IGNORE_CASE', 'FALSE') == 'TRUE',
        'default': elem.get('DEFAULT', 'NULL'),
        'imports': [],
        'keywords': {},
        'spans': [],
        'span_regexps': [],
        'seq_regexps': [],
        'eol_spans': [],
        'eol_span_regexps': [],
        'seqs': [],
    }
    for child in elem:
        tag = child.tag
        if tag == 'IMPORT':
            result['imports'].append(child.get('DELEGATE'))
        elif tag == 'KEYWORDS':
            for kw in child:
                kw_type = kw.tag
                kw_text = (kw.text or '').strip()
                if kw_text:
                    result['keywords'].setdefault(kw_type, []).append(kw_text)
        elif tag == 'SPAN':
            result['spans'].append(_parse_span(child))
        elif tag == 'SPAN_REGEXP':
            result['span_regexps'].append(_parse_span(child, is_regexp=True))
        elif tag == 'SEQ_REGEXP':
            result['seq_regexps'].append(_parse_seq_regexp(child))
        elif tag == 'EOL_SPAN':
            result['eol_spans'].append(_parse_eol_span(child))
        elif tag == 'EOL_SPAN_REGEXP':
            result['eol_span_regexps'].append(_parse_eol_span_regexp(child))
        elif tag == 'SEQ':
            result['seqs'].append(_parse_seq(child))
        elif tag == 'PROPS':
            pass
    return result


def _parse_span(elem, is_regexp=False):
    return {
        'type': 'span_regexp' if is_regexp else 'span',
        'begin': elem.find('BEGIN').text or '',
        'end': elem.find('END').text or '',
        'token_type': elem.get('TYPE', 'NULL'),
        'match_type': elem.get('MATCH_TYPE'),
        'delegate': elem.get('DELEGATE'),
        'no_line_break': elem.get('NO_LINE_BREAK', 'TRUE') == 'TRUE',
        'at_line_start': elem.get('AT_LINE_START', 'FALSE') == 'TRUE',
        'at_word_start': elem.get('AT_WORD_START', 'FALSE') == 'TRUE',
    }


def _parse_seq_regexp(elem):
    return {
        'type': 'seq_regexp',
        'regex': elem.text or '',
        'token_type': elem.get('TYPE', 'NULL'),
        'at_line_start': elem.get('AT_LINE_START', 'FALSE') == 'TRUE',
        'at_word_start': elem.get('AT_WORD_START', 'FALSE') == 'TRUE',
        'at_whitespace_end': elem.get('AT_WHITESPACE_END', 'FALSE') == 'TRUE',
        'hash_char': elem.get('HASH_CHAR'),
    }


def _parse_eol_span(elem):
    return {
        'type': 'eol_span',
        'text': elem.find('BEGIN').text if elem.find('BEGIN') is not None else elem.text or '',
        'token_type': elem.get('TYPE', 'NULL'),
        'at_line_start': elem.get('AT_LINE_START', 'FALSE') == 'TRUE',
        'at_whitespace_end': elem.get('AT_WHITESPACE_END', 'FALSE') == 'TRUE',
    }


def _parse_eol_span_regexp(elem):
    return {
        'type': 'eol_span_regexp',
        'regex': elem.text or '',
        'token_type': elem.get('TYPE', 'NULL'),
        'at_line_start': elem.get('AT_LINE_START', 'FALSE') == 'TRUE',
        'at_whitespace_end': elem.get('AT_WHITESPACE_END', 'FALSE') == 'TRUE',
        'hash_char': elem.get('HASH_CHAR'),
    }


def _parse_seq(elem):
    return {
        'type': 'seq',
        'text': elem.text or '',
        'token_type': elem.get('TYPE', 'NULL'),
    }


# ── 正则转换工具 ──

def escape_tm(s):
    """不再需要，保留为空操作以兼容"""
    return s


def java_to_oniguruma(regex):
    """Java 正则 → Oniguruma 基本转换"""
    # jEdit 的 \w \s \d \S 与 Oniguruma 兼容
    # \Q...\E → \E 不支持，但 sdevicepar.xml 未使用
    return regex


def make_case_flag(ignore_case):
    return '(?i)' if ignore_case else ''


def make_line_start_anchor(rule):
    if rule.get('at_line_start'):
        return '^'
    if rule.get('at_whitespace_end'):
        return r'^\s*'
    return ''


def make_word_boundary(rule):
    if rule.get('at_word_start'):
        return r'\b'
    return ''


# ── TextMate 模式生成 ──

def keywords_to_match(keywords, scope, ignore_case=True, group_size=12):
    """将关键词列表转为 TextMate match patterns（按组分割）"""
    if not keywords:
        return []

    flag = make_case_flag(ignore_case)
    suffix = r'(?![A-Za-z0-9_:-])'
    patterns = []

    for i in range(0, len(keywords), group_size):
        group = keywords[i:i + group_size]
        alts = '|'.join(re.escape(kw) for kw in group)
        regex = f'{flag}' + r'\b(' + alts + ')' + suffix
        patterns.append({
            'match': regex,
            'name': scope,
        })

    return patterns


def delegate_to_repo_name(delegate):
    """将 jEdit DELEGATE 名转为 TextMate repository 键名"""
    # spp::MAIN → spp_main, SDEVICEPAR → sdevicepar
    return delegate.replace('::', '_').lower()


def convert_span_to_tm(span, parent_ignore_case=True):
    """将 SPAN/SPAN_REGEXP 转为 TextMate begin/end 模式"""
    ignore_case = parent_ignore_case
    flag = make_case_flag(ignore_case)

    begin = span['begin']
    end = span['end']

    if span['type'] == 'span_regexp':
        begin = flag + java_to_oniguruma(begin)
        end = java_to_oniguruma(end)
    else:
        # 固定字符串: re.escape 添加的 \ 已是 Python string 中的单反斜杠
        begin = re.escape(begin)
        end = re.escape(end)

    token_type = span['token_type']
    match_type = span.get('match_type')
    delegate = span.get('delegate')

    pattern = {}

    # 添加行首锚定
    line_anchor = make_line_start_anchor(span)
    if line_anchor:
        begin = line_anchor + begin

    pattern['begin'] = begin
    pattern['end'] = end

    # Token 着色
    scope = TOKEN_TO_SCOPE.get(token_type)
    if scope:
        pattern['beginCaptures'] = {'0': {'name': scope}}

    if match_type:
        match_scope = TOKEN_TO_SCOPE.get(match_type)
        if match_scope:
            pattern.setdefault('endCaptures', {})['0'] = {'name': match_scope}

    # 子模式
    content_patterns = []
    if delegate:
        repo_name = delegate_to_repo_name(delegate)
        content_patterns.append({'include': f'#{repo_name}'})

    if content_patterns:
        pattern['patterns'] = content_patterns

    return pattern


def convert_seq_regexp_to_tm(rule, parent_ignore_case=True):
    """将 SEQ_REGEXP 转为 TextMate match 模式"""
    ignore_case = parent_ignore_case
    flag = make_case_flag(ignore_case)

    regex = rule['regex']
    regex = flag + java_to_oniguruma(regex)

    line_anchor = make_line_start_anchor(rule)
    if line_anchor:
        regex = line_anchor + regex

    token_type = rule['token_type']
    scope = TOKEN_TO_SCOPE.get(token_type)

    pattern = {'match': regex}
    if scope:
        pattern['name'] = scope

    return pattern


def convert_eol_span_to_tm(rule, parent_ignore_case=True):
    """将 EOL_SPAN 转为 TextMate match 模式（到行尾）"""
    text = rule['text']
    token_type = rule['token_type']
    scope = TOKEN_TO_SCOPE.get(token_type)
    escaped = re.escape(text)

    if rule.get('at_whitespace_end'):
        regex = r'^\s*' + escaped + r'.*$'
    elif rule.get('at_line_start'):
        regex = '^' + escaped + r'.*$'
    else:
        regex = escaped + r'.*$'

    pattern = {'match': regex}
    if scope:
        pattern['name'] = scope
    return pattern


def convert_eol_span_regexp_to_tm(rule, parent_ignore_case=True):
    """将 EOL_SPAN_REGEXP 转为 TextMate match 模式"""
    flag = make_case_flag(parent_ignore_case)
    regex = rule['regex']
    regex = flag + java_to_oniguruma(regex) + r'.*$'

    if rule.get('at_whitespace_end'):
        regex = r'^\s*' + regex

    token_type = rule['token_type']
    scope = TOKEN_TO_SCOPE.get(token_type)

    pattern = {'match': regex}
    if scope:
        pattern['name'] = scope
    return pattern


def convert_seq_to_tm(rule):
    """将 SEQ 转为 TextMate match 模式"""
    text = rule['text']
    token_type = rule['token_type']
    scope = TOKEN_TO_SCOPE.get(token_type)

    pattern = {'match': re.escape(text)}
    if scope:
        pattern['name'] = scope
    return pattern


# ── 构建完整 TextMate 语法 ──

def build_tmlanguage(par_sets, spp_sets):
    """从解析后的 jEdit 规则构建完整的 TextMate 语法"""

    tm = {
        '$schema': 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
        'name': 'Sentaurus SDEVICE Parameter',
        'patterns': [],
        'repository': {},
    }

    # ── 顶层 patterns（对应 MAIN RULES）──
    # MAIN 只有一个 IMPORT SDEVICEPAR
    # SDEVICEPAR 包含: IMPORT REGION, IMPORT COMMON, KEYWORD1
    # 展开后顶层 patterns 为:
    tm['patterns'] = [
        {'include': '#comments'},
        {'include': '#preprocessor'},
        {'include': '#defines'},
        {'include': '#swb-params'},
        {'include': '#strings'},
        {'include': '#region-block'},
        {'include': '#top-level-keywords'},
        {'include': '#insert-keyword'},
        {'include': '#numbers'},
    ]

    # ── Repository: comments ──
    # 来自 spp 的 HASH_CMD (简化) + sdevicepar 的 COMMON 中的注释
    # 注意: 所有正则使用 Python raw string，单反斜杠。json.dumps 自动转义。
    pp_word_list = (
        'if|elif|endif|setdep|set|define|else'
        '|includeext|include|exit|verbatim|rem'
        '|noexec|header|endheader|postheader'
        '|endpostheader|split'
    )
    tm['repository']['comments'] = {
        'patterns': [
            {
                'match': r'(?i)^\s*#(?!(?:' + pp_word_list + r')).*$',
                'name': 'comment.line.hash.sdevicepar',
            },
            {
                'match': r'^\s*\*.*$',
                'name': 'comment.line.asterisk.sdevicepar',
            },
            {
                'match': r'(?<=\S)\s*#.*$',
                'name': 'comment.line.hash.sdevicepar',
            },
        ]
    }

    # ── Repository: preprocessor ──
    # 来自 spp 的 HASH_CMD
    tm['repository']['preprocessor'] = {
        'patterns': [
            {
                'name': 'meta.preprocessor.define.sdevicepar',
                'match': r'(?i)^\s*(#define)\b\s+(\w+)(\s+.*)?$',
                'captures': {
                    '1': {'name': 'keyword.control.preprocessor.sdevicepar'},
                    '2': {'name': 'entity.name.type.sdevicepar'},
                    '3': {
                        'patterns': [
                            {'match': '"[^"]*"', 'name': 'string.quoted.double'},
                            {'match': r'\b(defined|TRUE|FALSE)\b', 'name': 'keyword.control.preprocessor.sdevicepar'},
                        ]
                    },
                },
            },
            {
                'name': 'meta.preprocessor.ifdef.sdevicepar',
                'match': r'(?i)^\s*(#(?:ifdef|ifndef))\b\s+(\w+)',
                'captures': {
                    '1': {'name': 'keyword.control.preprocessor.sdevicepar'},
                    '2': {'name': 'entity.name.type.sdevicepar'},
                },
            },
            {
                'name': 'meta.preprocessor.other.sdevicepar',
                'match': r'(?i)^\s*(#(?:if|elif|else|endif|set|setdep|include|includeext|exit|rem|noexec|header|endheader|postheader|endpostheader|split|verbatim))\b(.*$)',
                'captures': {
                    '1': {'name': 'keyword.control.preprocessor.sdevicepar'},
                    '2': {
                        'patterns': [
                            {'match': r'\b(defined|TRUE|FALSE)\b', 'name': 'keyword.control.preprocessor.sdevicepar'},
                            {'match': '"[^"]*"', 'name': 'string.quoted.double'},
                        ]
                    },
                },
            },
        ]
    }

    # ── Repository: swb-params ──
    # 来自 spp 的 AT 规则
    tm['repository']['swb-params'] = {
        'patterns': [
            {
                'match': r'@[a-zA-Z_<][^@]*@',
                'name': 'constant.character.format.placeholder',
            },
        ]
    }

    # ── Repository: defines ──
    # 来自 spp 的 DEFINES
    tm['repository']['defines'] = {
        'match': r'(?i)_+\w+',
        'name': 'entity.name.type.sdevicepar',
    }

    # ── Repository: strings ──
    # 来自 sdevicepar COMMON 中的 SPAN
    tm['repository']['strings'] = {
        'name': 'string.quoted.double',
        'begin': '"',
        'end': '"',
        'patterns': [
            {'name': 'constant.character.escape', 'match': r'\\.'},
            {'match': r'@[a-zA-Z_<][^@]*@', 'name': 'constant.character.format.placeholder'},
        ],
    }

    # ── Repository: numbers ──
    tm['repository']['numbers'] = {
        'match': r'\b(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\b',
        'name': 'constant.numeric',
    }

    # ── Repository: top-level-keywords ──
    # 来自 sdevicepar SDEVICEPAR SET 的 KEYWORD1
    par_main = par_sets.get('SDEVICEPAR', {})
    kw1 = par_main.get('keywords', {}).get('KEYWORD1', [])
    if kw1:
        tm['repository']['top-level-keywords'] = {
            'patterns': keywords_to_match(kw1, TOKEN_TO_SCOPE['KEYWORD1'])
        }

    # ── Repository: insert-keyword ──
    # LITERAL3 来自 COMMON SET（非 SDEVICEPAR SET）
    par_common = par_sets.get('COMMON', {})
    lit3 = par_common.get('keywords', {}).get('LITERAL3', [])
    if lit3:
        tm['repository']['insert-keyword'] = {
            'patterns': keywords_to_match(lit3, TOKEN_TO_SCOPE['LITERAL3'])
        }

    # ── Repository: region-block ──
    # 来自 sdevicepar REGION SET 的 SPAN_REGEXP
    # 匹配: Material = "xxx" {, Region = "xxx" {, Electrode {, etc.
    tm['repository']['region-block'] = {
        'begin': (
            r'(?i)\b'
            r'(Electrode|(Region|Material)(Interface)?)'
            r'\s*=\s*"[^"]*"'
            r'\s*\{'
        ),
        'beginCaptures': {
            '1': {'name': 'keyword.control.sdevicepar'},
        },
        'end': r'\}',
        'patterns': [
            {'include': '#comments'},
            {'include': '#preprocessor'},
            {'include': '#defines'},
            {'include': '#strings'},
            {'include': '#swb-params'},
            {'include': '#numbers'},
            {'include': '#parameter-name'},
            {'include': '#section-block'},
            {'include': '#function-expr'},
            {'include': '#assignment'},
            {'include': '#insert-keyword'},
        ],
    }

    # ── Repository: parameter-name ──
    # 来自 PARAMETERSET 的 SEQ_REGEXP: \w+\s*:?
    tm['repository']['parameter-name'] = {
        'patterns': [
            {
                'match': r'(?i)\b(\w+)\s*:',
                'captures': {
                    '1': {'name': 'entity.name.tag.sdevicepar'},
                },
            },
        ]
    }

    # ── Repository: section-block ──
    # 来自 PARAMETERSET 的 SPAN: { ... } delegate SECTION
    # 以及 SECTION 中递归的 { ... }
    tm['repository']['section-block'] = {
        'begin': r'\{',
        'beginCaptures': {'0': {'name': 'entity.name.tag.sdevicepar'}},
        'end': r'\}',
        'patterns': [
            {'include': '#comments'},
            {'include': '#preprocessor'},
            {'include': '#defines'},
            {'include': '#strings'},
            {'include': '#swb-params'},
            {'include': '#numbers'},
            {'include': '#parameter-name'},
            {'include': '#function-expr'},
            {'include': '#assignment'},
            {'include': '#insert-keyword'},
            {'include': '#section-block'},
        ],
    }

    # ── Repository: function-expr ──
    # 来自 SECTION 的 SPAN_REGEXP: \w+\s*\(
    tm['repository']['function-expr'] = {
        'begin': r'(?i)\b(\w+)\s*\(',
        'beginCaptures': {
            '1': {'name': 'entity.name.function.sdevicepar'},
        },
        'end': r'\)',
        'patterns': [
            {'include': '#comments'},
            {'include': '#strings'},
            {'include': '#swb-params'},
            {'include': '#numbers'},
            {'include': '#assignment'},
        ],
    }

    # ── Repository: assignment ──
    # 来自 SECTION 的 SEQ_REGEXP: \S+\s*(?==)
    # 注意: jEdit 原始规则为 AT_WHITESPACE_END，改用行首/空白后锚定
    tm['repository']['assignment'] = {
        'match': r'(?:^|\s)(\S+)(?=\s*=)',
        'captures': {
            '1': {'name': 'variable.parameter.sdevicepar'},
        },
    }

    return tm


# ── all_keywords.json 更新 ──

def update_all_keywords(par_sets, spp_sets):
    """提取关键词并更新 all_keywords.json 的 sdevicepar 字段"""
    keywords_path = os.path.join(SYNTAXES_DIR, 'all_keywords.json')

    with open(keywords_path, 'r', encoding='utf-8') as f:
        all_kw = json.load(f)

    par_main = par_sets.get('SDEVICEPAR', {})
    par_common = par_sets.get('COMMON', {})
    spp_hash_cmd = spp_sets.get('HASH_CMD', {})
    spp_at = spp_sets.get('AT', {})

    par_keywords = {}

    # KEYWORD1: 顶层 section 名
    kw1 = par_main.get('keywords', {}).get('KEYWORD1', [])
    if kw1:
        par_keywords['KEYWORD1'] = sorted(kw1)

    # LITERAL3: 特殊命令（来自 COMMON SET）
    lit3 = par_common.get('keywords', {}).get('LITERAL3', [])
    if lit3:
        par_keywords['LITERAL3'] = sorted(lit3)

    # MARKUP: 预处理命令（来自 spp）
    markup = spp_hash_cmd.get('keywords', {}).get('MARKUP', [])
    if markup:
        par_keywords['MARKUP'] = sorted(markup)

    # LITERAL4: SWB 变量（来自 spp）
    lit4 = spp_at.get('keywords', {}).get('LITERAL4', [])
    if lit4:
        par_keywords['LITERAL4'] = sorted(lit4)

    all_kw['sdevicepar'] = par_keywords

    with open(keywords_path, 'w', encoding='utf-8') as f:
        json.dump(all_kw, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f"已更新 {keywords_path}")
    print(f"  sdevicepar 关键词: {', '.join(f'{k}={len(v)}' for k, v in par_keywords.items())}")


# ── JSON 格式化（长正则分行拼接）──

def format_tmlanguage(tm):
    """将 tmLanguage dict 格式化为可读 JSON，关键长正则保持可读"""
    return json.dumps(tm, indent=2, ensure_ascii=False) + '\n'


# ── 主入口 ──

def main():
    # 加载 XML mode 文件
    par_path = os.path.join(JEDIT_DIR, 'sdevicepar.xml')
    spp_path = os.path.join(JEDIT_DIR, 'spp.xml')

    print("加载 jEdit XML mode 文件...")
    par_sets = load_mode(par_path)
    print(f"  sdevicepar.xml: {len(par_sets)} RULES SETs: {list(par_sets.keys())}")

    spp_sets = load_mode(spp_path)
    print(f"  spp.xml: {len(spp_sets)} RULES SETs: {list(spp_sets.keys())}")

    # 调试: 打印提取到的关键词
    for set_name, rules in par_sets.items():
        kws = rules.get('keywords', {})
        if kws:
            print(f"  [{set_name}] keywords: {kws}")

    # 构建 TextMate 语法
    print("\n生成 TextMate 语法...")
    tm = build_tmlanguage(par_sets, spp_sets)

    # 写入文件
    output_path = os.path.join(SYNTAXES_DIR, 'sdevicepar.tmLanguage.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(format_tmlanguage(tm))
    print(f"已写入 {output_path}")

    # 验证 JSON 合法性
    with open(output_path, 'r', encoding='utf-8') as f:
        json.load(f)
    print("JSON 验证通过")

    # 更新 all_keywords.json
    print("\n更新 all_keywords.json...")
    update_all_keywords(par_sets, spp_sets)

    print("\n完成！")


if __name__ == '__main__':
    main()
