---
name: rule-creator
description: Expert skill for creating, updating, and validating Antigravity rules in `.agent/rules/`. Use whenever a user asks to establish a new coding standard, architectural rule, or project-wide constraint.
---

# Rule Creator

This skill provides a structured workflow for generating and maintaining high-quality Antigravity rules. It ensures consistency in frontmatter triggers and deterministic validation.

## 🛠️ Workflows

### 1. Trigger Auto-Selection
When creating a rule, you MUST evaluate the intent to select the most efficient trigger.
- **Global Constraints** (e.g., "Never use X"): Use `always_on`.
- **File Type Standards** (e.g., "React components scale"): Use `glob`.
- **Task Specifics** (e.g., "When doing migrations"): Use `model_decision`.
- **Specific Tools/Procedures**: Use `manual`.

### 2. Creation Procedure
1.  **Draft Content**: Define the rule's title and actionable instructions.
2.  **Select Trigger**: Consult [trigger_templates.md](references/trigger_templates.md) for the exact YAML structure.
3.  **Validate**: Run the validation script on the new file.
    ```powershell
    python i:\01-Master_Code\Apps\Gusto\.agent\skills\rule-creator\scripts\validate_rule.py "i:\01-Master_Code\Apps\Gusto\.agent\rules\your-rule.md"
    ```
4.  **Reference Examples**: Check [example_rules.md](references/example_rules.md) for tone and formatting standards.

## 📂 Resources

### Scripts
- `scripts/validate_rule.py`: Validates YAML frontmatter, trigger types, and mandatory fields. Use it as a final guardrail.

### References
- [trigger_templates.md](references/trigger_templates.md): Detailed YAML templates for all trigger types including `always_on`, `manual`, `model_decision`, `glob`, and `(list)`.
- [example_rules.md](references/example_rules.md): Authentic rule files from the current project to ensure consistency in style and rigor.

## 📋 Best Practices
- **Concise Content**: Rules should be actionable directives, not essays.
- **Strict Frontmatter**: Always start with `---` and include a valid `trigger` field.
- **Project Isolation**: Rules must be written specifically for the current project context.
