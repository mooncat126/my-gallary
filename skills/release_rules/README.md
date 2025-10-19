# Release Rules

### Purpose
Automate version bumping and changelog generation from commits.

### Rules
- Use Semantic Versioning: MAJOR.MINOR.PATCH
- Increment:
  - feat → MINOR
  - fix/perf → PATCH
  - BREAKING CHANGE → MAJOR
- Generate CHANGELOG.md automatically