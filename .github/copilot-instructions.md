# GitHub Copilot Instructions

## Documentation

Read `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` before making changes.

**REQUIREMENTS.md** - User-facing features and business requirements.

**IMPLEMENTATION_PLAN.md** - Technical implementation with step-by-step tasks.

**Keep checkboxes updated:** Update IMPLEMENTATION_PLAN.md & REQUIREMENTS.md after once completed.

## Step Design

- Build features incrementally with routes added early for UI testing
- Integrate components with actual features, not in isolation
- Avoid temporary/throwaway code (demos, test pages)
- Each step: implementation tasks + automated tests

**Manual Verification:**
- Include steps in plan for user to test themselves
- Skip by default (user tests manually when ready)
- Do not start dev server or wait for browser testing
- Proceed to next phase immediately after tests pass

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Minimal comments (only for non-obvious logic)

## Communication

- Chat summaries only (no status files)
- Concise responses

