# GitHub Copilot Instructions

## Documentation

Read `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` before making changes.

**REQUIREMENTS.md** - User-facing features only:
- What users can do
- Business requirements
- No technical details

**IMPLEMENTATION_PLAN.md** - Technical implementation:
- APIs and data structures
- Step-by-step tasks with tests
- Break large steps into 3-7 numbered sub-steps (1-3 files each)
- Each sub-step needs test requirements and verification criteria
- **Prioritize UI-verifiable steps**: Design steps that can be tested in the browser, not just via automated tests

**Step Design for UI Verification:**
- Create components with visual output that can be seen in the browser
- Add routes early so features are immediately accessible
- Build pages incrementally (add dialog → add list → add filters)
- Complete integration steps that make features accessible in the app
- Example: Create page with route first, then add components one by one

**Keep in sync:**
- Check off both files when completing features
- Match phase numbers between files
- Verify all checkboxes before finishing & mark them after finishing

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Avoid deprecated APIs (add comment if unavoidable)
- Minimal comments (only for non-obvious logic)
- No auto-generated docs

## Communication

- Chat summaries only (no status files)
- Concise responses
- Simple, active language

