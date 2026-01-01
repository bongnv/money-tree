# GitHub Copilot Instructions

## Project Documentation

- Read `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` before making changes
- Keep both files in sync when requirements or plans change
- **REQUIREMENTS.md**: User-facing features and business requirements only
  - What the user can do
  - What the app should accomplish
  - Non-functional requirements (performance, usability, etc.)
  - No implementation details or technical specifications
- **IMPLEMENTATION_PLAN.md**: Technical details and how to build
  - Algorithms and data structures
  - API specifications and interfaces
  - Step-by-step implementation tasks
  - Testing strategies and specific test cases
  - Technical architecture decisions

**Keeping Files Synchronized:**
- When marking a phase complete in IMPLEMENTATION_PLAN.md:
  - Update corresponding checkboxes in REQUIREMENTS.md
  - Mark only user-facing features as complete
  - Leave implementation-dependent items unchecked until fully working
- When completing a feature:
  - Check off implementation tasks in IMPLEMENTATION_PLAN.md
  - Check off user requirements in REQUIREMENTS.md
  - Ensure phase reference matches (e.g., "Phase 3" in both files)
- Before finishing work, verify:
  - All completed phases have matching requirement updates
  - Test sections in implementation plan are checked off
  - No orphaned checkboxes in either file

## Code Style

- Write self-documenting code with clear names
- Keep functions small and focused
- Avoid unnecessary complexity
- Don't use deprecated APIs, methods, or constants
- If deprecated code is unavoidable, add a comment explaining why
- Don't add comments unless explaining non-obvious logic
- Don't generate documentation files unless requested

## Communication

- Provide summaries in chat, not separate files
- Don't create status files like `*_FIXED.md` or `*_COMPLETE.md`
- Keep responses concise

## Writing Style

- Use simple, clear language
- Keep paragraphs short (2-4 sentences)
- Use active voice
- Remove filler words

