# Commit Contribution Rules

This Skill defines a unified format for commit messages.
Claude Code and other agents will automatically apply these rules when committing code.

---

## 🧩 Commit Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### 🎯 Type
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes only
- **style**: Changes that don't affect code meaning (whitespace, formatting, etc.)
- **refactor**: Code changes that are neither bug fixes nor feature additions
- **test**: Test code related changes
- **chore**: Build process, CI, or other tasks

### 🧱 Scope
- Target module, feature, or folder name
  Example: `auth`, `api`, `storybook`, `design-system`

### ✍️ Short Summary
- Written in imperative mood
  Examples: `add`, `fix`, `update`, etc.
  Examples: `fix login timeout issue` / `add user profile tab`

---

## 💡 Examples

```
feat(api): add new endpoint for user profile
fix(auth): handle token refresh failure
docs(readme): update installation instructions
refactor(ui): simplify button component props
```

---

## 🪶 Contribution Checklist

- [ ] No lint errors
- [ ] Jest / Storybook tests pass
- [ ] Commit message follows rules
- [ ] Include `BREAKING CHANGE:` when necessary