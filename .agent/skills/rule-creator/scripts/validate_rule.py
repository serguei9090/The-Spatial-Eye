import os
import sys
import yaml
import re

# Standard Antigravity Rules Directory
RULES_DIR = r"i:\01-Master_Code\Apps\Gusto\.agent\rules"

VALID_TRIGGERS = [
    "always_on",
    "manual",
    "model_decision",
    "glob",
    "(list)" # Supporting the list variant mentioned by user
]

def validate_rule_content(content, filename="Unknown"):
    """
    Validates rule content for proper frontmatter and structure.
    """
    if not content.startswith("---"):
        return False, "Rule must start with YAML frontmatter (---)"

    parts = content.split("---", 2)
    if len(parts) < 3:
        return False, "Frontmatter must be enclosed between '---' markers."

    try:
        header = yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        return False, f"YAML Syntax Error: {e}"

    if not header or not isinstance(header, dict):
        return False, "Frontmatter must be a YAML dictionary."

    trigger = header.get("trigger")
    if not trigger:
        return False, "Missing 'trigger' in frontmatter."

    if trigger not in VALID_TRIGGERS:
        # Check if it's a dynamic list or something similar
        if not isinstance(trigger, (str, list)):
            return False, f"Invalid trigger type: {type(trigger)}. Must be string or list."

    # Validation per trigger type
    if trigger == "model_decision" or trigger == "(list)":
        if not header.get("description"):
            return False, f"Trigger '{trigger}' requires a 'description' field."

    if trigger == "glob" or trigger == "(list)":
        if not header.get("globs"):
             return False, f"Trigger '{trigger}' requires a 'globs' field."

    return True, f"Rule '{filename}' is VALID [trigger: {trigger}]"

def validate_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        return validate_rule_content(content, os.path.basename(filepath))
    except Exception as e:
        return False, f"Error reading file {filepath}: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_rule.py <path_to_rule_or_dir>")
        sys.exit(1)

    path = sys.argv[1]
    if os.path.isfile(path):
        success, msg = validate_file(path)
        print(msg)
        sys.exit(0 if success else 1)
    elif os.path.isdir(path):
        all_success = True
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith(".md"):
                    f_path = os.path.join(root, file)
                    success, msg = validate_file(f_path)
                    print(msg)
                    if not success:
                        all_success = False
        sys.exit(0 if all_success else 1)
    else:
        print(f"Error: {path} is not a valid file or directory.")
        sys.exit(1)
