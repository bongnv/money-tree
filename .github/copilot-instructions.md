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

## Test Coverage

- Maintain **80% minimum test coverage** for all code changes
- When modifying existing files, ensure coverage doesn't drop below 80%
- When creating new files, write tests to achieve at least 80% coverage
- Run `npm test -- --coverage` to check coverage before marking tasks complete
- Focus on testing critical business logic, edge cases, and error handling
- Use coverage gaps as a guide for identifying untested scenarios

## Architecture

**3-layer**: UI (`src/components/`, `src/hooks/`, `src/contexts/`) → Services/Utils (`src/services/`, `src/utils/`) → Database (`src/db/`)

### UI Layer
- **Pages** (smart components): Coordinate data fetching, queries, and updates. Handle routing and page-level state.
- **Components**: Presentation only. All dependencies injected via props. NO direct service calls. NO business logic.
- **Hooks** (`src/hooks/`): Custom hooks for data access using `useLiveQuery` (queries) and service methods (mutations). Bridge between UI and services.
- **Contexts** (`src/contexts/`): React Context providers for dependency injection (ServiceProviders, SyncProvider, AppContext). Create and provide service instances.
- NO direct DB access from any UI code.

### Services Layer
- **Services** (`src/services/`): Stateless, pure business logic. NO React dependencies. Dependencies injected via constructor for easier testing.
- **Utils** (`src/utils/`): Pure utility functions. No state, no dependencies.

### Database Layer
- **Database** (`src/db/`): Dexie schema, tables, IndexedDB operations. NO React. NO business logic.

## Code Style

- Self-documenting code with clear names
- Small, focused functions
- Minimal comments (only for non-obvious logic)
- Respect layer boundaries (no cross-layer violations)
- Use path aliases (`@/components/`, `@/hooks/`, `@/services/`, etc.) instead of relative imports

## Implementation Approach

**IMPORTANT**: Do not jump into implementation immediately.

When user requests a change or new feature:
1. **Analyze** the request and current codebase
2. **Suggest** 2-3 implementation options with pros/cons
3. **Wait** for user to choose an approach
4. **Implement** only after alignment is confirmed

Exception: Only proceed directly with implementation for:
- Simple, unambiguous fixes (typos, formatting)
- Explicit debugging tasks ("fix this error")
- Follow-up implementations where approach is already agreed

## Communication

- Chat summaries only (no status files)
- Concise responses
- Present options before implementing

## Command Output Management
- Write output from time-consuming commands to tmp/ folder for repeated examination
- Examples of expensive commands: test runs, build processes, integration tests
- Create new timestamped or uniquely named files each time to preserve old outputs for comparison
- Use descriptive names with timestamps or incremental numbers: `tmp/test_run_20260115_143522.txt` or `tmp/hwm_test_1.txt`, `tmp/hwm_test_2.txt`
- Redirect command output: `command > tmp/output_$(date +%Y%m%d_%H%M%S).txt 2>&1`
- Reuse saved output instead of re-running commands when analyzing results
- Keep multiple runs available for comparison and regression analysis
