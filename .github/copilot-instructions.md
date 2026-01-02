# GitHub Copilot Instructions

## Documentation

Read `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` before making changes.

**REQUIREMENTS.md** - User-facing features and business requirements.

**IMPLEMENTATION_PLAN.md** - Technical implementation with step-by-step tasks.

## Step Design

- Build features incrementally with routes added early for UI testing
- Integrate components with actual features, not in isolation
- Avoid temporary/throwaway code (demos, test pages)
- Each step: implementation tasks + automated tests + manual verification

**Manual Verification Format:**
- Label: "**Manual Verification (User):**"
- Describe: browser actions + expected outcomes
- Example: "Navigate to /reports, select date range, verify chart displays"

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Minimal comments (only for non-obvious logic)

## Communication

- Chat summaries only (no status files)
- Concise responses

