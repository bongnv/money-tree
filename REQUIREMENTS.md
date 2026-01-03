# Money Tree - Requirements

## Overview

Money Tree is a personal finance management web application that helps users track transactions, manage budgets, and analyze financial data.

---

## MVP (Minimum Viable Product)

The MVP focuses on core personal finance tracking functionality with local file storage. Users can immediately start using the app to track their finances without any setup or authentication.

### FR-1: Transaction Management

**FR-1.1** [x] Basic transaction CRUD operations (add, edit, delete transactions) - *Phase 5*

**FR-1.2** [x] Transaction data model with required fields - *Phase 5*
- Transaction Type (defines classification)
- Amount (monetary value)
- Date (when transaction occurred)
- Description (transaction details)
- From Account (source account)
- To Account (destination account)

**FR-1.3** [x] Account requirements based on transaction group - *Phase 5*
- Expense transactions: Require From Account (money leaving)
- Income transactions: Require To Account (money entering)
- Investment transactions: Buying requires From Account, Selling/Dividends require To Account
- Transfer transactions: Require both From Account and To Account

**FR-1.4** [x] Quick transaction entry on dashboard - *Phase 8, 12*
- Inline form always visible on starting page (no button click required)
- Enter essential details (amount, date, type, account) and submit
- Form clears automatically after submission for quick consecutive entries

**FR-1.5** [ ] Bulk transaction entry (Post-MVP)
- Alternative spreadsheet-like grid view for entering multiple transactions
- Tab through cells to enter data quickly (similar to Excel/Google Sheets)
- Inline editing with auto-complete for accounts and categories
- Real-time validation as you type
- Add/remove rows dynamically
- Copy/paste support from external sources
- Save entire batch at once
- Undo/redo support for batch operations
- Quick fill-down for repeated values

### FR-2: Categorization System

**FR-2.1** [x] Three-level hierarchy (Group → Category → Transaction Type) - *Phase 2*

**FR-2.2** [x] Four static Groups: Expense, Income, Investment, Transfer - *Phase 2*

**FR-2.3** [x] User-customizable Categories and Transaction Types - *Phase 4*
- Each Transaction Type belongs to exactly one Category
- Each Category belongs to exactly one Group
- Transfer is special group without Category/Transaction Type hierarchy

**FR-2.4** [x] Automatic Group/Category determination from Transaction Type - *Phase 5*

### FR-3: Asset Management

**FR-3.1** [x] Unified Assets section in Settings with tab navigation - *Phase 9*
- Tab-based view: Transactional / Manual
- Both types contribute to net worth calculations
- Dashboard and reports show unified net worth

**FR-3.2** [x] Transactional Assets (Accounts) - *Phase 3*
- Create and manage multiple accounts (bank accounts, credit cards, cash)
- Add, edit, and delete accounts
- Account types: Bank Account, Credit Card, Cash, Investment

**FR-3.3** [x] Account balance tracking - *Phase 5*
- Each account tracks current balance
- Balances update automatically based on transactions

**FR-3.4** [ ] Account history and balance changes over time

**FR-3.5** [x] Manual Assets - *Phase 6*
- Track assets not connected to transactions (real estate, vehicles, investments)
- Manually-updated value and valuation date
- Types: Real Estate, Superannuation, Investment, Liability, Other
- Add, edit, and delete manual assets

**FR-3.6** [x] Manual asset value tracking over time

**Architecture Note:** Data models remain separate (Account and ManualAsset are distinct types with separate Zustand stores) for clear business logic separation. UI layer provides unified view through tabs and combined displays.

### FR-4: Category Customization

**FR-4.1** [x] Full category management within Groups - *Phase 4*
- Add, remove, and rename categories within a group
- Add, remove, and rename transaction types within a category

**FR-4.2** [x] Category hierarchy constraints - *Phase 4*
- Each transaction type must belong to exactly one category
- Each category must belong to exactly one group

**FR-4.3** [ ] Move transaction types between categories

**FR-4.4** [ ] Move categories between groups

### FR-5: Dashboard and Quick Entry

**FR-5.1** [x] Dashboard as starting page - *Phase 8*

**FR-5.2** [x] Inline transaction entry form at top - *Phase 8, 12*

**FR-5.3** [x] Summary statistics and key metrics - *Phase 8*
- Net Worth, Cash Flow, Savings Rate cards
- Period selector (This Month, Last Month, This Quarter, This Year, YTD)

**FR-5.4** [x] Budget overview on dashboard - *Phase 8*
- Top 5 budgets with progress bars
- Context-aware color coding

**FR-5.5** [x] Recent transaction activity - *Phase 8*
- Last 10 transactions with quick entry integration

**FR-5.6** [ ] Account balance overview

### FR-6: Data Storage (Local Files - MVP)

**FR-6.1** [x] File System Access API for local storage - *Phase 2*

**FR-6.2** [x] Save and load data files - *Phase 2*

**FR-6.3** [x] Single JSON file with multi-year support - *Phase 2, 11*
- Main file contains: accounts, categories, transaction types, preferences
- Main file contains years data structure with 2 most recent years
- Archive references with year-end summaries for quick trends

**FR-6.4** [x] Data includes transactions, accounts, categories, budgets, manual assets - *Phase 2-6*

**FR-6.5** [x] Fixed currency defaults (not stored in files) - *Phase 2*

**FR-6.6** [x] Portable JSON format - *Phase 2*

**FR-6.7** [x] Extensible storage adapter pattern - *Phase 2*

**FR-6.8** [x] Auto-sync with unsaved changes tracking - *Phase 2, 11*
- Track changes across all stores
- Periodic auto-sync (1 minute interval)
- Auto-sync only when there are unsaved changes
- Manual sync button in header for immediate sync
- Prompt before destructive actions (switch file, close browser)

**FR-6.9** [x] File handle caching and auto-load - *Phase 2, 11*
- Cache file handle via File System Access API
- Auto-load from cached file on app startup
- Show Welcome Dialog if no cached file exists
- Sync silently without user prompts
- Unsaved changes indicator in UI
- Window beforeunload handler for unsaved changes warning

**FR-6.10** [ ] Auto-archive old years (Post-MVP - Phase 11)
- Keep 2 most recent years in main file for optimal performance
- Automatically detect when new year starts
- Prompt user to archive oldest year when 3+ years in main file
- Create separate archive file for old year with snapshot of accounts/categories
- Store archive reference and year-end summary in main file
- Archive files are self-contained and can be loaded independently

**FR-6-11** [ ] Auto-save should be trigger after the first change + interval

**Performance rationale:** With ~2000 transactions/year (~450 KB per year), keeping 2 years in main file (~900 KB) ensures fast auto-save while recent data remains instantly accessible. Older years archived separately for long-term scalability.

### FR-7: Budget Management

**FR-7.1** [x] Create budgets with period types (Monthly, Quarterly, Yearly) - *Phase 7*

**FR-7.2** [x] Budget start date and end date - *Phase 7*

**FR-7.3** [ ] Recurring budgets

**FR-7.4** [ ] Copy budget from previous period

**FR-7.5** [x] Transaction Type-level budgets - *Phase 7*
- Set budget amount for each transaction type
- Support both expense and income transaction types
- Context-aware labels (Budget for expenses, Target for income)

**FR-7.6** [x] Budget grouping by category - *Phase 7*

**FR-7.7** [ ] Budget templates (save, apply, modify)

**FR-7.8** [x] Real-time budget status - *Phase 7, 8*
- Budget vs actual for each transaction type
- Spent/earned amount, remaining amount, percentage used
- Visual progress bars
- Context-aware color coding (Expenses: green/yellow/red based on usage; Income: green/yellow/red based on achievement)

**FR-7.9** [x] Budget overview dashboard section - *Phase 8*
- Overall budget status
- Top budgets by usage
- Prorated budget amounts based on period

**FR-7.10** [ ] Budget alerts and notifications
- Warning at 80% of budget
- Alert when exceeding budget
- Unusual spending pattern notifications

**FR-7.11** [ ] Variance analysis for completed periods

**FR-7.12** [ ] Budget vs Actual report with charts

**FR-7.13** [ ] Historical budget performance tracking

**FR-7.14** [ ] In-period budget adjustments with history

**FR-7.15** [ ] Budget rollover options

### FR-8: Financial Reports

**FR-8.1** [x] Balance Sheet report - *Phase 6*
- Assets section (accounts + manual assets grouped by type)
- Net worth calculation and display
- Date selector for historical data
- Month-over-month comparison

**FR-8.2** [x] Cash Flow report - *Phase 6*
- Income and expense breakdown
- Transfers excluded from calculations
- Period filtering

**FR-8.3** [ ] Transaction filtering and search

**FR-8.4** [ ] Report export functionality

---

## Future Enhancements

These features will be implemented after the MVP is complete and validated by users.

### FR-9: Year Management & Multi-Year Support (Post-MVP)

**FR-9.1** [ ] Seamless year handling in UI - *Phase 11*
- Year selector in header showing current year
- Switch between years in main file (instant)
- Load archived years on-demand (file picker)
- Auto-switch to current year when app opens

**FR-9.2** [ ] Auto-archive workflow - *Phase 11*
- Detect when 3+ years exist in main file
- Prompt user: "Archive [year] to keep performance optimal?"
- User can postpone archiving (show reminder banner)
- Create archive file with full year data + account/category snapshots
- Update main file with archive reference and year-end summary
- Remove archived year from main file (keeps 2 most recent)

**FR-9.3** [ ] Archive file management - *Phase 11*
- Self-contained archive files (include account/category definitions from that period)
- Archive reference tracking in main file (year, filename, summary)
- Year-end summaries: closing net worth, closing balances, transaction count
- Load archived year for detailed viewing (read-only recommended)
- Handle missing archive files gracefully (allow browsing)
- Archived files are for read-only. Not modifiable.

**FR-9.4** [ ] Cross-year analysis with quick trends - *Phase 11*
- Dashboard shows year-over-year net worth trend using summaries (instant, no file loading)
- Use archive references for quick multi-year comparisons
- Example: "2023: $40k → 2024: $45k → 2025: $52k → 2026: $58k"
- Access without loading full archive files

**FR-9.5** [ ] Detailed multi-year analysis (optional) - *Phase 11*
- "Detailed Multi-Year Analysis" feature
- Prompt user to load multiple archive files
- Load full transaction data from archives into memory
- Generate comprehensive reports spanning all loaded years
- Month-by-month trends, category breakdowns, account history
- Unload archives after analysis to free memory

**FR-9.6** [ ] Archive utilities - *Phase 11*
- Export single year to standalone file (for accountant)
- Import archived year back into main file (if needed)
- Archive file browser showing available years
- Compact main file (force archive old years)
- User preference: number of years to keep in main file (default: 2)

**Architecture Note:** Main file structure supports efficient multi-year operations:
- Years stored in `years: { "2025": {...}, "2026": {...} }` object
- Archive references in `archivedYears: [{year, fileName, summary}, ...]` array
- Quick trends use summaries (no file loading)
- Detailed analysis loads archives on-demand
- Auto-save always fast (~900 KB with 2 years)

**Performance Note:** With ~2000 transactions/year (~450 KB per year):
- Main file (2 years): ~900 KB → fast auto-save
- 5 years in single file: ~2.25 MB → slower auto-save
- 10 years in single file: ~4.5 MB → poor performance
- Auto-archiving ensures app stays fast for decades

### FR-10: Advanced Data Management (Post-MVP)

**FR-10.1** [ ] Conflict detection
- Detect when files modified externally
- Detect concurrent modifications (other tabs, external editors, cloud sync, other devices)

**FR-10.2** [ ] Auto-merge non-conflicting changes
- Intelligently combine both versions when possible
- Preserve new accounts, transactions, categories from both versions
- Merge changes to different records automatically
- Merge changes to different fields in same record
- Show merge preview before applying

**FR-10.3** [ ] User resolution for conflicts
- Side-by-side comparison for overlapping changes
- Options: Keep both, file version, your version
- Handle deleted vs modified conflicts
- Validate data consistency after merge

**FR-10.4** [ ] Conflict resolution UI
- Show auto-merged changes list
- Show conflicts requiring decisions
- Preview final merged result
- Manual resolution options (Overwrite, Reload, Save As, Cancel)
- Display file modification timestamps
- Clear warnings about data loss

### FR-11: Data Sync & Storage Providers

**FR-11.1** [x] Initial file selection and auto-sync workflow - *Phase 11*
- Welcome Dialog on first app open (no cached file)
  - "Open Local File" → File System Access API picker
  - "Connect to OneDrive" → OAuth flow (future)
  - "Start with Empty Data" → Creates new file on first sync
- Auto-load from cached file handle on subsequent visits
- File handle persistence via File System Access API
- Remove "Load" button from header (replaced by auto-load + Settings)
- Manual sync via "Sync" button in header (replaces "Save")
- Auto-sync for changed data (background periodic sync)

**FR-11.2** [x] Data & Sync settings page - *Phase 11*
- Current file information (name, path, last modified)
- Switch File button (opens file picker, replaces cached handle)
- Storage provider selector (Local/OneDrive/Google Drive)
- Sync status display (last sync time, sync frequency)
- Clear cached file button (triggers Welcome Dialog on next visit)
- Sync preferences (auto-sync interval, conflict resolution)

**FR-11.3** [x] OneDrive integration with full sync - *Post-MVP*
- OAuth authentication via `@azure/msal-browser`
- File location picker (browse OneDrive, select existing file or choose location for new file)
- Support for shared folders (enables family/team collaboration)
- Store selected file ID and path for reliable access
- Two-way sync (upload changes, download remote changes)
- Single file sync (main data file with all years)
- Background sync on data changes
- Sync status indicators (syncing, synced, offline)
- "Change file location" option in settings

**FR-11.4** [ ] Google Drive integration with full sync - *Post-MVP*
- OAuth authentication via Google Sign-In SDK
- File location picker (browse Google Drive, select existing file or choose location)
- Support for shared folders (enables family/team collaboration)
- Two-way sync (upload changes, download remote changes)
- Single file sync (main data file with all years)
- Background sync on data changes
- Sync status indicators (syncing, synced, offline)

**FR-11.5** [ ] Dropbox integration with full sync - *Post-MVP*
- OAuth authentication via Dropbox SDK
- File location picker (browse Dropbox, select existing file or choose location)
- Support for shared folders (enables family/team collaboration)
- Two-way sync (upload changes, download remote changes)
- Single file sync (main data file with all years)
- Background sync on data changes
- Sync status indicators (syncing, synced, offline)

**FR-11.6** [ ] Multi-device sync considerations - *Post-MVP*
- Archive files synced separately (optional, on-demand)
- Conflict resolution handled by FR-10 (auto-merge + user resolution)
- Offline mode with sync queue when back online
- Last sync timestamp tracking per device

---

## Non-Functional Requirements

### NFR-1: Architecture (MVP)

**NFR-1.1** [x] Static web application (no backend server) - *Phase 1*

**NFR-1.2** [x] Runs entirely in browser - *Phase 1*

**NFR-1.3** [x] All client-side processing - *Phase 1*

### NFR-2: Technology Stack (MVP)

**NFR-2.1** [x] TypeScript as primary language - *Phase 1*

**NFR-2.2** [x] React UI framework - *Phase 1*

**NFR-2.3** [x] Webpack module bundling - *Phase 1*

**NFR-2.4** [x] Material-UI (MUI) component library - *Phase 1*

**NFR-2.5** [x] Zustand state management - *Phase 2*

**NFR-2.6** [x] ESLint with TypeScript support - *Phase 1*

**NFR-2.7** [x] Prettier code formatting - *Phase 1*

**NFR-2.8** [x] Jest with React Testing Library - *Phase 1*

**NFR-2.9** [x] Minimum 80% test coverage - *All phases*

**NFR-2.10** [x] date-fns for date utilities - *Phase 2*

**NFR-2.11** [x] Zod for schema validation - *Phase 2*

**NFR-2.12** [x] File System Access API for local storage - *Phase 2*

**NFR-2.13** [x] localStorage for caching and preferences - *Phase 2*

### NFR-3: Performance (MVP)

**NFR-3.1** [ ] Application loads quickly - *Phase 10*
- Initial load under 3 seconds on modern browsers
- Code splitting for lazy-loaded routes

**NFR-3.2** [ ] Responsive user interface - *Phase 10*
- UI interactions respond within 100ms
- Smooth scrolling and animations at 60fps

**NFR-3.3** [ ] Smooth transitions between views - *Phase 9, 10*

**NFR-3.4** [x] Efficient data operations - *Phase 2, 10*
- Auto-save optimized for ~900 KB files (2 years of data)
- File writes complete within 200ms for typical data size
- Year filtering and queries execute instantly (in-memory operations)

**NFR-3.5** [ ] Optimized bundle size through code splitting - *Phase 10*
- Main bundle under 500 KB
- Lazy load route components

**NFR-3.6** [ ] Scalable data architecture (Post-MVP - Phase 11)
- Auto-archive keeps main file under 1 MB for optimal performance
- Support decades of data without performance degradation
- Archive files loaded on-demand for historical analysis
- Memory-efficient handling of large datasets

**Performance Baseline:** Assuming ~2000 transactions/year (~450 KB per year):
- Main file with 2 years: ~900 KB (fast auto-save, instant queries)
- Main file with 5 years: ~2.25 MB (slower auto-save, larger memory footprint)
- Archive strategy prevents performance issues as data accumulates

### NFR-4: Usability (MVP)

**NFR-4.1** [ ] Intuitive user interface - *Phase 10*

**NFR-4.2** [x] Clear navigation structure - *Phase 9*

**NFR-4.3** [ ] Helpful error messages - *Phase 10*

**NFR-4.4** [ ] Responsive design for different screen sizes - *Phase 9, 10*

### NFR-5: Compatibility (MVP)

**NFR-5.1** [ ] Works on modern web browsers (Chrome, Firefox, Safari, Edge) - *Phase 10*

**NFR-5.2** [ ] Compatible with desktop and tablet devices - *Phase 10*

### NFR-6: Reliability (MVP)

**NFR-6.1** [x] Data integrity during save operations - *Phase 2*

**NFR-6.2** [ ] Proper error handling for file access - *Phase 10*

**NFR-6.3** [ ] Graceful degradation when File System Access API unavailable - *Phase 10*

### NFR-7: Maintainability (MVP)

**NFR-7.1** [x] Clean, modular code structure - *Phase 1*

**NFR-7.2** [ ] Well-documented codebase - *Phase 10*

**NFR-7.3** [ ] Easy to update and extend features - *All phases*

**NFR-7.4** [x] Clear separation of concerns - *Phase 1*

**NFR-7.5** [x] Type-safe codebase with TypeScript - *Phase 1*

**NFR-7.6** [x] Consistent code style (ESLint + Prettier) - *Phase 1*

**NFR-7.7** [x] Comprehensive test coverage (80%+) - *All phases*

---

## Non-Functional Requirements - Future Enhancements

### NFR-8: Cloud Security (Post-MVP)

**NFR-8.1** [ ] Secure OAuth authentication

**NFR-8.2** [ ] Data access limited to authenticated user

**NFR-8.3** [ ] No third-party server storage (only cloud providers)

**NFR-8.4** [ ] Valid session required for cloud operations

### NFR-9: Advanced Reliability (Post-MVP)

**NFR-9.1** [ ] Advanced conflict resolution with auto-merge

**NFR-9.2** [ ] Data backup and recovery mechanisms

**NFR-9.3** [ ] Graceful cloud storage failure handling

**NFR-9.4** [ ] Offline-first support with sync queue

---

## Technical Constraints

### MVP Constraints

**TC-1** [x] No backend infrastructure required - *Phase 1*

**TC-2** [x] Limited by browser File System Access API capabilities - *Phase 2*
- File save/load requires user interaction (file picker dialog)
- Cannot auto-save to multiple files simultaneously
- Archive workflow requires user to save each archive file

**TC-3** [x] Limited by browser storage for local caching - *Phase 2*
- localStorage used for preferences and last file reference
- IndexedDB available for future backup strategy

**TC-4** [ ] Performance scales with data volume
- With ~2000 transactions/year, main file grows ~450 KB per year
- Auto-save performance degrades beyond ~2 MB file size
- Solution: Auto-archive strategy keeps main file at ~900 KB (2 years)
- Archive files loaded on-demand for historical analysis

### Post-MVP Constraints (Cloud Storage)

**TC-5** [ ] Depends on cloud storage provider availability

**TC-6** [ ] Requires internet connection for cloud synchronization

**TC-7** [ ] Cloud storage syncing one main file is straightforward
- Archive files must be managed separately
- User controls archive creation/loading through UI

---

## Data Architecture & File Strategy

### File Size Projections

**Baseline:** ~2000 transactions per year

**Per-year data size:**
- 2000 transactions × 200 bytes = 400 KB
- Budgets, manual assets, metadata = 50 KB
- **Total per year: ~450 KB**

**Projected growth:**
- 2 years: 900 KB (optimal for auto-save)
- 5 years: 2.25 MB (slower auto-save, larger memory)
- 10 years: 4.5 MB (poor performance)
- 20 years: 9 MB (unacceptable for browser operations)

### Multi-Year Strategy

**MVP (Phases 1-10):** Single file with all years
- Start simple, no premature optimization
- File grows naturally as years accumulate
- Sufficient for first 2-3 years of usage
- Auto-save remains fast (under 1 MB)

**Post-MVP (Phase 11):** Auto-archive with rolling window
- Automatically archive years beyond the 2 most recent
- Main file always contains: current year + previous year
- Archive files created automatically with user confirmation
- Archive references stored in main file with year-end summaries

### File Structure

**Main File (my-finances.json):**
```json
{
  "version": "1.0",
  "accounts": [...],
  "categories": [...],
  "transactionTypes": [...],
  "preferences": {...},
  "years": {
    "2025": {
      "transactions": [...],
      "budgets": [...],
      "manualAssets": [...]
    },
    "2026": {
      "transactions": [...],
      "budgets": [...],
      "manualAssets": [...]
    }
  },
  "archivedYears": [
    {
      "year": 2024,
      "fileName": "my-finances-2024.json",
      "archivedDate": "2026-01-15T10:30:00Z",
      "summary": {
        "transactionCount": 2047,
        "closingNetWorth": 52000,
        "closingBalances": {"acc-1": 5000, "acc-2": 15000}
      }
    }
  ]
}
```

**Archive File (my-finances-2024.json):**
```json
{
  "year": 2024,
  "archivedFrom": "my-finances.json",
  "archivedDate": "2026-01-15T10:30:00Z",
  "accounts": [...],       // Snapshot at archive time
  "categories": [...],     // Snapshot at archive time
  "transactionTypes": [...], // Snapshot at archive time
  "transactions": [...],   // Full year transactions
  "budgets": [...],       // Full year budgets
  "manualAssets": [...]   // Year-end manual assets
}
```

### Cross-Year Analysis

**Quick Trends (No File Loading):**
- Use archive summaries from main file
- Display year-over-year net worth, closing balances
- Instant dashboard trends spanning all years
- No performance impact

**Detailed Analysis (Load Archives):**
- User explicitly requests detailed multi-year reports
- App prompts to load specific archive files
- Full transaction-level analysis across loaded years
- Archives unloaded after analysis (memory management)

### Benefits of This Approach

1. **Fast auto-save:** Main file always ~900 KB (2 years)
2. **Instant recent data:** Current + previous year immediately accessible
3. **Quick trends:** Year-end summaries enable overview without file loading
4. **Scalable:** Supports decades of data without performance degradation
5. **Simple MVP:** Start with single file, add archiving later when needed
6. **User control:** Archive prompts give visibility and control
7. **Portable archives:** Each archive is self-contained and shareable
