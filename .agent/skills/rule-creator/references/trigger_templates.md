# Rule Trigger Templates

This reference provides exact templates for each trigger type supported by Antigravity.

## 1. Always On
Used for global architecture, security, or style rules that must never be ignored.

```markdown
---
trigger: always_on
---
```

## 2. Manual
Used for specific procedures that are only invoked by name or explicit user request.

```markdown
---
trigger: manual
---
```

## 3. Model Decision
The agent decides when to load this rule based on the task description.

```markdown
---
trigger: model_decision
description: [Explain when the model should decide to use this rule]
---
```

## 4. Glob
Automatically loads when the agent interacts with files matching the patterns.

```markdown
---
trigger: glob
globs: [Pattern, e.g., "src/**/*.ts"]
---
```

## 5. List (Hybrid)
A more complex trigger that can combine descriptions and globs.

```markdown
---
trigger: (list)
description: [When to use]
globs: [Patterns]
---
```
