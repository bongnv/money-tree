# GitHub Copilot Instructions

## Documentation Workflow

Always read `REQUIREMENTS.md`, `IMPLEMENTATION_PLAN.md`, and `BUGS.md` before making changes.

### REQUIREMENTS.md
- **Purpose**: User-facing features and business requirements (stories)
- **Format**: Each requirement numbered with checkbox `- [ ] FR-X: Description`
- **Checkbox meaning**: Has implementation plan created (not whether it's implemented)
- **When to check**: Mark `[x]` once implementation plan exists in IMPLEMENTATION_PLAN.md

### IMPLEMENTATION_PLAN.md
- **Purpose**: Technical implementation details and step-by-step tasks
- **Format**: Each task numbered with checkbox and test requirements
- **Checkbox meaning**: Implementation completed (code written, tests passing, build successful)
- **Task size**: Small, focused, UI-testable steps
- **When to check**: Mark `[x]` only after implementation complete AND tests pass AND build succeeds

### BUGS.md
- **Purpose**: Track bugs, issues, and defects found during development or testing
- **Format**: Each bug numbered with checkbox `- [ ] BUG-X: Description`
- **Checkbox meaning**: Bug is fixed (code patched, tests pass, issue resolved)
- **When to check**: Mark `[x]` once bug is fixed AND verified working AND tests pass
- **Example**:
  ```markdown
  - [x] BUG-1: Transaction list shows wrong currency symbol
  - [ ] BUG-2: Budget dialog crashes with empty category
  ```
- **When to add**: Create entry when bug is discovered, include steps to reproduce
- **Priority**: Fix bugs before implementing new features when appropriate

### Updating Checkboxes
- Update REQUIREMENTS.md checkbox when implementation plan is written
- Update IMPLEMENTATION_PLAN.md checkboxes as each task is completed
- Update BUGS.md checkbox when bug is fixed and verified
- Always verify tests and build before marking tasks complete


## Quality Checks

After each task implementation, always run:
1. **Tests**: `npm test` - ensure all tests pass
2. **Format**: `npm run format` to ensure code is properly formatted
3. **Build**: `npm run build` - verify no build errors

Mark task as complete only if all three pass.

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Minimal comments (only for non-obvious logic)

## Communication

- Chat summaries only (no status files)
- Concise responses