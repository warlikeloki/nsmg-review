# obfuscator.py

# whitespace removal
import re

def remove_whitespace_comments(code):
    # Remove single-line comments (// in JavaScript/PHP, # in Python)
    code = re.sub(r'(?<!https?:)//.*', '', code) # Avoid removing from URLs
    code = re.sub(r'#.*', '', code)
    # Remove multi-line comments (/* ... */ in JavaScript/PHP)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    # Remove extra whitespace (multiple spaces, tabs, newlines)
    code = ' '.join(code.split())
    return code.strip()

if __name__ == "__main__":
    test_code = """
    // This is a comment
    let   myVariable   =   10;
    /*
    This is a
    multi-line comment
    */
    function calculateSum( a , b ) {
        return a + b; // Another comment
    }

    # Python style comment
    result = calculateSum( myVariable, 5 );
    """
    cleaned_code = remove_whitespace_comments(test_code)
    print("Cleaned Code:\n", cleaned_code)

#identifier renaming

import re
import random
import string
import json

def generate_random_string(length=8):
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(length))

def obfuscate_identifiers_with_mapping(code, identifiers_to_rename=None, excluded_identifiers=None):
    if identifiers_to_rename is None:
        identifier_pattern = r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'
        identifiers_to_rename = set(re.findall(identifier_pattern, code))

    if excluded_identifiers is None:
        excluded_identifiers = set()

    identifiers_to_rename = identifiers_to_rename - excluded_identifiers
    replacements = {}
    mapping = {}

    def replace(match):
        original_name = match.group(0)
        if original_name in identifiers_to_rename:
            if original_name not in replacements:
                obfuscated_name = generate_random_string()
                replacements[original_name] = obfuscated_name
                mapping[original_name] = obfuscated_name
            return replacements[original_name]
        return original_name

    obfuscated_code = re.sub(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', replace, code)
    return obfuscated_code, mapping

def remove_whitespace_comments(code):
    code = re.sub(r'(?<!https?:)//.*', '', code)
    code = re.sub(r'#.*', '', code)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    code = ' '.join(code.split())
    return code.strip()

def encode_strings(code):
    def replace(match):
        string_literal = match.group(0)
        content = string_literal[1:-1]
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        return f'atob("{encoded}")'
    return re.sub(r'("([^"]*)")|(\'([^\']*)\')', replace, code)

def obfuscate_code_with_mapping(code, config):
    mapping = {}
    if config.get('remove_whitespace', True):
        code = remove_whitespace_comments(code)
    if config.get('rename_identifiers', True):
        excluded = set(config.get('exclude_identifiers', []))
        code, identifier_mapping = obfuscate_identifiers_with_mapping(code, excluded_identifiers=excluded)
        mapping['identifiers'] = identifier_mapping
    if config.get('encode_strings', False):
        code = encode_strings(code)
        # You might want to store information about string encoding method if you use more than one
    return code, mapping

if __name__ == "__main__":
    test_code = """
    // Important API key
    const API_KEY = "your_secret_key";
    let counter = 0;
    function incrementCounter(step) {
        counter = counter + step;
        console.log("Counter:", counter);
        let message = "Current count: " + counter;
        return message;
    }
    let resultMessage = incrementCounter(5);
    """

    config = {
        'remove_whitespace': True,
        'rename_identifiers': True,
        'encode_strings': True,
        'exclude_identifiers': ['API_KEY', 'console', 'log']
    }

    obfuscated_code, mapping = obfuscate_code_with_mapping(test_code, config)
    print("Original Code:\n", test_code)
    print("\nObfuscated Code with Mapping:\n", obfuscated_code)
    print("\nIdentifier Mapping:\n", json.dumps(mapping, indent=4))

    # You would typically save this mapping to a file (e.g., mapping.json)
    with open('mapping.json', 'w') as f:
        json.dump(mapping, f, indent=4)
    print("\nIdentifier mapping saved to mapping.json")

#string Encoding

import re
import base64

def encode_strings(code):
    def replace(match):
        string_literal = match.group(0)
        # Remove quotes
        content = string_literal[1:-1]
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        # Decide how to represent the encoded string in the code
        # You might want to use a function call to decode at runtime
        return f'atob("{encoded}")' # Assuming JavaScript environment

    # Match strings enclosed in single or double quotes
    return re.sub(r'("([^"]*)")|(\'([^\']*)\')', replace, code)

if __name__ == "__main__":
    test_code = """
    console.log("Hello, world!");
    let message = 'This is a secret.';
    let data = { "key": "value" };
    """
    encoded_code = encode_strings(test_code)
    print("Original Code:\n", test_code)
    print("\nCode with Encoded Strings:\n", encoded_code)

#Combining functionalities

import re
import random
import string
import base64
import json

def generate_random_string(length=8):
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(length))

def remove_whitespace_comments(code):
    code = re.sub(r'(?<!https?:)//.*', '', code)
    code = re.sub(r'#.*', '', code)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    code = ' '.join(code.split())
    return code.strip()

def obfuscate_identifiers(code, identifiers_to_rename=None, excluded_identifiers=None):
    if identifiers_to_rename is None:
        identifier_pattern = r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'
        identifiers_to_rename = set(re.findall(identifier_pattern, code))

    if excluded_identifiers is None:
        excluded_identifiers = set()

    identifiers_to_rename = identifiers_to_rename - excluded_identifiers
    replacements = {}

    def replace(match):
        original_name = match.group(0)
        if original_name in identifiers_to_rename:
            if original_name not in replacements:
                replacements[original_name] = generate_random_string()
            return replacements[original_name]
        return original_name

    return re.sub(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', replace, code)

def encode_strings(code):
    def replace(match):
        string_literal = match.group(0)
        content = string_literal[1:-1]
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        return f'atob("{encoded}")'
    return re.sub(r'("([^"]*)")|(\'([^\']*)\')', replace, code)

def obfuscate_code(code, config):
    if config.get('remove_whitespace', True):
        code = remove_whitespace_comments(code)
    if config.get('rename_identifiers', True):
        excluded = set(config.get('exclude_identifiers', []))
        code = obfuscate_identifiers(code, excluded_identifiers=excluded)
    if config.get('encode_strings', False):
        code = encode_strings(code)
    return code

if __name__ == "__main__":
    test_code = """
    // Important API key
    const API_KEY = "your_secret_key";
    let counter = 0;
    function incrementCounter(step) {
        counter = counter + step;
        console.log("Counter:", counter);
        let message = "Current count: " + counter;
        return message;
    }
    let resultMessage = incrementCounter(5);
    """

    config = {
        'remove_whitespace': True,
        'rename_identifiers': True,
        'encode_strings': True,
        'exclude_identifiers': ['API_KEY', 'console', 'log']
    }

    obfuscated_code = obfuscate_code(test_code, config)
    print("Original Code:\n", test_code)
    print("\nObfuscated Code with Config:\n", obfuscated_code)

    # You could load the config from a JSON file later
    # with open('config.json', 'r') as f:
    #     config = json.load(f)