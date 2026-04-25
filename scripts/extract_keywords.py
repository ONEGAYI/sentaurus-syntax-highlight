import os
import re
import xml.etree.ElementTree as ET
import json
import argparse
from collections import defaultdict

def extract_keywords_from_xml(file_path):
    """Extract keywords from Sentaurus XML mode files."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Simple regex-based extraction for keywords
    keywords = defaultdict(set)
    
    # Extract KEYWORD1, KEYWORD2, etc. tags
    keyword_pattern = r'<KEYWORD(\d)>([^<]+)</KEYWORD\1>'
    for match in re.finditer(keyword_pattern, content):
        keyword_type = int(match.group(1))
        keyword_text = match.group(2).strip()
        keywords[f'KEYWORD{keyword_type}'].add(keyword_text)
    
    # Extract LITERAL1, LITERAL2, etc. tags
    literal_pattern = r'<LITERAL(\d)>([^<]+)</LITERAL\1>'
    for match in re.finditer(literal_pattern, content):
        literal_type = int(match.group(1))
        literal_text = match.group(2).strip()
        keywords[f'LITERAL{literal_type}'].add(literal_text)
    
    # Extract FUNCTION tags
    function_pattern = r'<FUNCTION>([^<]+)</FUNCTION>'
    for match in re.finditer(function_pattern, content):
        function_text = match.group(1).strip()
        keywords['FUNCTION'].add(function_text)
    
    return dict(keywords)

def process_all_mode_files(directory):
    """Process all XML mode files in the directory."""
    results = {}
    for filename in os.listdir(directory):
        if filename.endswith('.xml'):
            file_path = os.path.join(directory, filename)
            mode_name = os.path.splitext(filename)[0]
            results[mode_name] = extract_keywords_from_xml(file_path)
    return results

def save_results_as_json(results, output_file):
    """Save the extracted keywords as JSON."""
    def convert_sets_to_lists(obj):
        if isinstance(obj, dict):
            return {key: convert_sets_to_lists(value) for key, value in obj.items()}
        elif isinstance(obj, set):
            return list(obj)
        else:
            return obj
    
    converted_results = convert_sets_to_lists(results)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_results, f, indent=2)

def create_textmate_grammar(mode_name, keywords):
    """Create a TextMate grammar for VSCode from the extracted keywords."""
    grammar = {
        "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
        "name": f"Sentaurus {mode_name.upper()}",
        "patterns": [],
        "repository": {},
        "scopeName": f"source.sentaurus.{mode_name.lower()}"
    }
    
    # Map keyword types to TextMate scopes
    scope_mapping = {
        'KEYWORD1': 'keyword.control',
        'KEYWORD2': 'keyword.other',
        'KEYWORD3': 'entity.name.tag',
        'KEYWORD4': 'support.class',
        'LITERAL1': 'constant.numeric',
        'LITERAL2': 'constant.numeric',
        'LITERAL3': 'string.quoted',
        'FUNCTION': 'entity.name.function',
    }
    
    # Add patterns for all keyword types
    for key_type, scope in scope_mapping.items():
        if key_type in keywords and keywords[key_type]:
            pattern = {
                "match": "\\b(" + "|".join(re.escape(k) for k in keywords[key_type]) + ")(?![A-Za-z0-9_:-])",
                "name": scope + f".{mode_name.lower()}"
            }
            grammar["patterns"].append(pattern)
    
    # Add comment patterns
    grammar["patterns"].extend([
        {
            "name": "comment.line.hash",
            "match": "#.*$"
        },
        {
            "name": "comment.line.asterisk",
            "match": "\*.*$"
        }
    ])
    
    # Add string patterns
    grammar["patterns"].append({
        "name": "string.quoted.double",
        "begin": "\"",
        "end": "\"",
        "patterns": [
            {
                "name": "constant.character.escape",
                "match": "\\\\."
            }
        ]
    })

    # Numeric literals: int, float, scientific notation (green in most themes)
    grammar["patterns"].append({
        "match": "\\b(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?\\b",
        "name": "constant.numeric"
    })

    # SWB parameter substitution: @var@, @param:+2@, @<expr>@
    grammar["patterns"].append({
        "match": "@[a-zA-Z_<][^@]*@",
        "name": "variable.parameter"
    })

    # Catch-all: any remaining identifier → variable (bright blue in most themes)
    # SDE (Scheme) 允许 -!? 作为标识符字符；Tcl 方言允许 -
    if mode_name == 'sde':
        fallback = "\\b[A-Za-z_][A-Za-z0-9_\\-!?]*(?![A-Za-z0-9_\\-!?])"
    else:
        fallback = "\\b[A-Za-z_][A-Za-z0-9_\\-]*(?![A-Za-z0-9_\\-])"
    grammar["patterns"].append({
        "match": fallback,
        "name": "variable.other"
    })

    return grammar

# ========== Incremental Grammar Update ==========

# Scopes that are never keyword-list patterns
_NON_KEYWORD_SCOPES = {
    'comment.line.hash', 'comment.line.asterisk', 'comment.line.semicolon',
    'string.quoted.double', 'variable.parameter', 'variable.other',
}

# Regex to parse keyword match patterns into (prefix, keywords_str).
# Only extracts prefix and keyword alternation — suffix is supplied separately.
_MATCH_PARSER = re.compile(r'^(\\b\(|\()([^)]+)')

# All keyword patterns use this suffix to prevent prefix matching of longer identifiers.
# E.g., without this, \b(h|...) would match the 'h' in 'hHighFieldSaturation'.
_KW_PATTERN_SUFFIX = '(?![A-Za-z0-9_:-])'

# Per-language scope → keyword type mapping
# Only lists scopes that contain keyword-list patterns.
# SDE uses custom scopes (support.function, support.type) that differ from other languages.
_SCOPE_TYPE_MAP = {
    'sde': {
        'support.function': 'KEYWORD1',
        'keyword.other': 'KEYWORD2',
        'entity.name.tag': 'KEYWORD3',
        'support.type': 'LITERAL3',
        'entity.name.function': 'FUNCTION',
    },
    'sdevice': {
        'keyword.control': 'KEYWORD1',
        'keyword.other': 'KEYWORD2',
        'entity.name.tag': 'KEYWORD3',
        'support.class': 'KEYWORD4',
    },
    'sprocess': {
        'keyword.control': 'KEYWORD1',
        'keyword.other': 'KEYWORD2',
        'entity.name.tag': 'KEYWORD3',
        'support.class': 'KEYWORD4',
        'string.quoted': 'LITERAL3',
        'entity.name.function': 'FUNCTION',
    },
    'emw': {
        'keyword.control': 'KEYWORD1',
        'constant.numeric': 'LITERAL1',
        'string.quoted': 'LITERAL3',
    },
    'inspect': {
        'keyword.control': 'KEYWORD1',
        'keyword.other': 'KEYWORD2',
        'entity.name.tag': 'KEYWORD3',
        'support.class': 'KEYWORD4',
        'entity.name.function': 'FUNCTION',
    },
}

# For languages where the same scope appears multiple times for keyword lists.
# Maps (scope_name, occurrence_index) → keyword type.
_DUPLICATE_SCOPE_MAP = {
    'sdevice': {
        ('constant.numeric', 0): 'LITERAL1',
        ('constant.numeric', 1): 'LITERAL2',
        ('constant.numeric', 2): 'LITERAL3',
    },
}


def _parse_match_pattern(match):
    """Parse a keyword match pattern into (prefix, keywords_str).

    Returns None if the pattern is not a keyword-list pattern.
    """
    m = _MATCH_PARSER.match(match)
    if m:
        return m.group(1), m.group(2)
    return None


def _resolve_kw_type(base_scope, scope_occurrence, scope_map, mode_name):
    """Resolve a scope name to a keyword type, handling duplicate scopes."""
    # Check duplicate scope handling first (e.g. sdevice has 3 constant.numeric patterns)
    if mode_name in _DUPLICATE_SCOPE_MAP:
        idx = scope_occurrence.get(base_scope, 0)
        key = (base_scope, idx)
        if key in _DUPLICATE_SCOPE_MAP[mode_name]:
            scope_occurrence[base_scope] = idx + 1
            return _DUPLICATE_SCOPE_MAP[mode_name][key]

    # Standard mapping
    if base_scope in scope_map:
        scope_occurrence[base_scope] = scope_occurrence.get(base_scope, 0) + 1
        return scope_map[base_scope]

    return None


def update_grammar_incrementally(grammar_path, keywords, mode_name):
    """Update keyword lists in an existing TextMate grammar, preserving structure.

    Only replaces the keyword alternation in existing keyword-list patterns.
    Does NOT:
    - Add or remove patterns
    - Change scope names
    - Reorder patterns
    - Modify non-keyword patterns (comments, strings, numeric regex, etc.)
    - Change boundary assertions (preserves \\b or (?![A-Za-z0-9_:-]))
    """
    with open(grammar_path, 'r', encoding='utf-8') as f:
        grammar = json.load(f)

    scope_map = _SCOPE_TYPE_MAP.get(mode_name, {})
    scope_occurrence = {}
    updated = []

    for pattern in grammar.get('patterns', []):
        name = pattern.get('name', '')
        match = pattern.get('match', '')

        if not match or not name:
            continue

        # Get base scope (strip language suffix like .sde, .sdevice)
        base_scope = name.rsplit('.', 1)[0] if '.' in name else name

        # Skip known non-keyword scopes
        if base_scope in _NON_KEYWORD_SCOPES:
            continue

        # Skip standalone numeric regex (contains [eE] character class)
        if base_scope == 'constant.numeric' and '[eE]' in match:
            continue

        # Skip string delimiter patterns (begin/end, not keyword lists)
        if base_scope == 'string.quoted.double':
            continue

        # Parse the match pattern structure
        parsed = _parse_match_pattern(match)
        if not parsed:
            continue

        prefix, old_keywords_str = parsed

        # Resolve which keyword type this pattern represents
        kw_type = _resolve_kw_type(base_scope, scope_occurrence, scope_map, mode_name)
        if not kw_type:
            continue

        if kw_type not in keywords or not keywords[kw_type]:
            continue

        # Build new keyword alternation (sorted for deterministic output)
        new_kw = sorted(keywords[kw_type])
        new_kw_str = '|'.join(re.escape(k) for k in new_kw)
        new_match = f'{prefix}{new_kw_str}){_KW_PATTERN_SUFFIX}'

        old_count = old_keywords_str.count('|') + 1
        new_count = len(new_kw)

        pattern['match'] = new_match
        updated.append(f'{name}: {kw_type} ({old_count}→{new_count} keywords)')

    with open(grammar_path, 'w', encoding='utf-8') as f:
        json.dump(grammar, f, indent=2, ensure_ascii=False)

    return updated


# ========== SDevice LITERAL → KEYWORD3 Promotion ==========

# Tier 1 keywords: LITERAL words that semantically act as section-level
# model/option names (entity.name.tag) rather than numeric constants.
_SDEVICE_LITERAL_PROMOTIONS = frozenset({
    # Physics model options (4)
    'Thermodynamic', 'BandGap', 'Optical', 'Stress',
    # Physics - Recombination models (5)
    'SRH', 'Auger', 'Radiative', 'Band2Band', 'SurfaceSRH',
    # Physics - Mobility models (6)
    'DopingDependence', 'HighFieldSaturation', 'ConstantMobility', 'TempDependence',
    'eHighFieldSaturation', 'hHighFieldSaturation',
    # Physics - Tunneling/Doping (3)
    'FowlerNordheim', 'DonorConcentration', 'AcceptorConcentration',
    # Solve equation names (3)
    'Poisson', 'Electron', 'Hole',
    # Math solver algorithms (8)
    'Newton', 'TRBDF', 'BE', 'TE', 'Circuit', 'UCS', 'Blocked', 'Constant',
    # Tier 2: Physical quantity names (20)
    'eDensity', 'hDensity', 'eCurrent', 'hCurrent',
    'eCurrentDensity', 'hCurrentDensity',
    'TotalCurrent', 'DisplacementCurrent', 'SpaceCharge', 'Potential',
    'eQuasiFermi', 'hQuasiFermi',
    'eMobility', 'hMobility',
    'eVelocity', 'hVelocity',
    'eTemperature', 'hTemperature', 'eAvalanche', 'hAvalanche',
})


def promote_literals(keywords, mode_name, promotions=None):
    """Promote specified LITERAL keywords to KEYWORD3 for the given mode.

    Iterates through ALL LITERAL levels (1/2/3) for each keyword,
    removing it from every level where it appears, then adds it to KEYWORD3.
    This avoids the previous bug where `break` caused partial removal for
    keywords present in multiple LITERAL levels.

    Args:
        keywords: dict mapping category names to keyword lists/sets for one mode
        mode_name: the mode identifier (e.g. 'sdevice')
        promotions: set of keywords to promote; defaults to _SDEVICE_LITERAL_PROMOTIONS

    Returns:
        dict with promotion statistics, or None if mode not applicable
    """
    if mode_name != 'sdevice':
        return None

    if promotions is None:
        promotions = _SDEVICE_LITERAL_PROMOTIONS

    stats = {'promoted': [], 'literal_removed': defaultdict(int)}

    for kw in sorted(promotions):
        removed_from = []
        # Must check ALL literal levels — do NOT break early
        for literal_cat in ['LITERAL1', 'LITERAL2', 'LITERAL3']:
            kw_set = keywords.get(literal_cat)
            if kw_set is None:
                continue
            # Handle both set and list
            if isinstance(kw_set, set):
                if kw in kw_set:
                    kw_set.discard(kw)
                    removed_from.append(literal_cat)
            elif isinstance(kw_set, list):
                if kw in kw_set:
                    kw_set.remove(kw)
                    removed_from.append(literal_cat)

        if removed_from:
            # Add to KEYWORD3
            kw3 = keywords.setdefault('KEYWORD3', set() if isinstance(keywords.get('KEYWORD3', set()), set) else [])
            if isinstance(kw3, set):
                kw3.add(kw)
            else:
                if kw not in kw3:
                    kw3.append(kw)
            for cat in removed_from:
                stats['literal_removed'][cat] += 1
            stats['promoted'].append({
                'keyword': kw,
                'from': removed_from,
            })

    return stats


def main():
    parser = argparse.ArgumentParser(description='Extract Sentaurus keywords and generate TextMate grammars')
    parser.add_argument('--promote', action='store_true',
                        help='Only apply LITERAL→KEYWORD3 promotion from existing all_keywords.json '
                             '(skip XML extraction)')
    args = parser.parse_args()

    modes_dir = 'd:\\pydemo\\modes'
    output_dir = 'd:\\pydemo\\sentaurus-tcad-syntax\\syntaxes'

    if args.promote:
        # --promote mode: read existing JSON, apply promotion, update grammar only
        json_path = os.path.join(output_dir, 'all_keywords.json')
        if not os.path.exists(json_path):
            print(f"Error: {json_path} not found. Run full extraction first.")
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            all_keywords = json.load(f)

        # Convert lists back to sets for set operations
        for mode in all_keywords:
            for cat in all_keywords[mode]:
                all_keywords[mode][cat] = set(all_keywords[mode][cat])

        # Apply promotion for sdevice
        if 'sdevice' in all_keywords:
            stats = promote_literals(all_keywords['sdevice'], 'sdevice')
            if stats and stats['promoted']:
                print(f"Promoted {len(stats['promoted'])} keywords:")
                for entry in stats['promoted']:
                    print(f"  {entry['keyword']}: {', '.join(entry['from'])} -> KEYWORD3")
                for cat, count in sorted(stats['literal_removed'].items()):
                    print(f"  {cat}: removed {count}")

            # Save updated keywords
            save_results_as_json(all_keywords, json_path)
            print(f"Updated {json_path}")

            # Update grammar
            grammar_path = os.path.join(output_dir, 'sdevice.tmLanguage.json')
            if os.path.exists(grammar_path):
                changes = update_grammar_incrementally(
                    grammar_path, all_keywords['sdevice'], 'sdevice'
                )
                print(f"Updated sdevice grammar: {len(changes)} patterns modified")
                for change in changes:
                    print(f"  - {change}")
        return

    # Default mode: full extraction from XML
    os.makedirs(output_dir, exist_ok=True)

    # Extract keywords from all XML files
    all_keywords = process_all_mode_files(modes_dir)

    # Apply LITERAL promotion for sdevice before saving
    if 'sdevice' in all_keywords:
        stats = promote_literals(all_keywords['sdevice'], 'sdevice')
        if stats and stats['promoted']:
            print(f"Promoted {len(stats['promoted'])} LITERAL -> KEYWORD3 for sdevice")

    # Save all keywords to a JSON file for reference
    save_results_as_json(all_keywords, os.path.join(output_dir, 'all_keywords.json'))

    # Incrementally update existing TextMate grammars
    target_modes = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect']
    for mode in target_modes:
        if mode in all_keywords:
            grammar_path = os.path.join(output_dir, f'{mode}.tmLanguage.json')

            if os.path.exists(grammar_path):
                # Incremental update: preserve structure, only update keyword lists
                changes = update_grammar_incrementally(
                    grammar_path, all_keywords[mode], mode
                )
                print(f"Updated {mode}: {len(changes)} patterns modified")
                for change in changes:
                    print(f"  - {change}")
            else:
                # First time: create from scratch
                grammar = create_textmate_grammar(mode, all_keywords[mode])
                with open(grammar_path, 'w', encoding='utf-8') as f:
                    json.dump(grammar, f, indent=2, ensure_ascii=False)
                print(f"Created {mode} (new file)")
        else:
            print(f"Warning: No keywords found for mode '{mode}'")


if __name__ == "__main__":
    main()
