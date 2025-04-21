import os
import re
import xml.etree.ElementTree as ET
import json
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
    # 将所有的 set 转换为 list，以便 JSON 序列化
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
        'LITERAL1': 'constant.character',
        'LITERAL2': 'constant.numeric',
        'LITERAL3': 'string.quoted',
        'FUNCTION': 'entity.name.function',
    }
    
    # Add patterns for all keyword types
    for key_type, scope in scope_mapping.items():
        if key_type in keywords and keywords[key_type]:
            pattern = {
                "match": "\\b(" + "|".join(re.escape(k) for k in keywords[key_type]) + ")\\b",
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
            "match": "\\*.*$"
        },
        {
            "name": "comment.line.double-slash",
            "match": "//.*$"
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
    
    return grammar

def main():
    modes_dir = 'd:\\pydemo\\modes'
    output_dir = 'd:\\pydemo\\sentaurus-tcad-syntax\\syntaxes'
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract keywords from all XML files
    all_keywords = process_all_mode_files(modes_dir)
    
    # Save all keywords to a JSON file for reference
    save_results_as_json(all_keywords, os.path.join(output_dir, 'all_keywords.json'))
    
    # Create TextMate grammars for specific modes
    target_modes = ['sde', 'sdevice', 'sprocess', 'emw', 'inspect']
    for mode in target_modes:
        if mode in all_keywords:
            grammar = create_textmate_grammar(mode, all_keywords[mode])
            grammar_path = os.path.join(output_dir, f'{mode}.tmLanguage.json')
            with open(grammar_path, 'w', encoding='utf-8') as f:
                # 在这里不需要特别处理，因为 create_textmate_grammar 已经创建了适合 JSON 序列化的结构
                json.dump(grammar, f, indent=2)
            print(f"Created TextMate grammar for {mode}")
        else:
            print(f"Warning: No keywords found for mode '{mode}'")

if __name__ == "__main__":
    main()
