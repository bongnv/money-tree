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

**FR-1.3** [ ] Account requirements based on transaction group - *Phase 21*
- INCOME: Requires To Account (money entering)
- EXPENSE: Requires From Account (money leaving)
- TRANSFER: Requires both From Account and To Account
- ASSET_PURCHASE: Requires From Account + To Asset (buying/depositing into asset)
- ASSET_SALE: Requires From Asset + To Account (selling/withdrawing from asset)

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

**FR-2.1** [ ] Two-level hierarchy with flexible grouping (Category → Transaction Type with Group) - *Phase 21*
- Categories are organizational labels (e.g., "Shares", "Property", "Groceries")
- Transaction Types define behavior via Group assignment
- Same category can contain transaction types with different groups
- Example: "Shares" category contains "Stock Purchase" (ASSET_PURCHASE), "Stock Sale" (ASSET_SALE), "Dividend" (INCOME)

**FR-2.2** [ ] Five static Groups determine transaction behavior - *Phase 21*
- **INCOME**: Money entering an account (requires toAccountId only)
- **EXPENSE**: Money leaving an account (requires fromAccountId only)
- **TRANSFER**: Money moving between accounts (requires fromAccountId + toAccountId)
- **ASSET_PURCHASE**: Buying/depositing into asset (requires fromAccountId + toAssetId)
- **ASSET_SALE**: Selling/withdrawing from asset (requires fromAssetId + toAccountId)

**FR-2.3** [ ] User-customizable Categories and Transaction Types - *Phase 21*
- Each Transaction Type belongs to exactly one Category
- Each Transaction Type has exactly one Group (determines validation rules)
- Categories have no group constraint (purely organizational)
- Users can create transaction types with any valid Category + Group combination

**FR-2.4** [ ] Automatic behavior determination from Transaction Type's Group - *Phase 21*

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

**FR-3.7** [ ] Asset transaction support - *Phase 21*
- Record asset sales (asset → account) via ASSET_SALE group
- Record asset purchases (account → asset) via ASSET_PURCHASE group
- Automatic asset value update when transaction is created
- Link transactions to asset value history
- View linked transactions from asset detail page
- Simplified UI with dedicated groups instead of conditional logic

**Architecture Note:** Data models remain separate (Account and ManualAsset are distinct types with separate Zustand stores) for clear business logic separation. UI layer provides unified view through tabs and combined displays.

### FR-4: Category Customization

**FR-4.1** [x] Full category management within Groups - *Phase 4*
- Add, remove, and rename categories within a group
- Add, remove, and rename transaction types within a category

**FR-4.2** [ ] Category and Transaction Type constraints - *Phase 21*
- Each transaction type must belong to exactly one category
- Each transaction type must have exactly one group (determines behavior)
- Categories are group-agnostic (organizational only)

**FR-4.3** [ ] Move transaction types between categories

**FR-4.4** [N/A] ~~Move categories between groups~~ - Not applicable (categories have no group)

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

### FR-11: Multi-Currency Support (Future Enhancement)

**FR-11.1** [x] Base Currency Configuration
- User selects a primary "reporting currency" (default: USD)
- All reports default to displaying in this base currency
- Setting stored in data file (syncs across devices)
- Can be changed at any time in Settings (triggers file save, recalculates all reports)
- Each report can temporarily display in a different currency (resets to base currency on navigation)

**FR-11.2** [ ] Exchange Rate Management (Simplified Monthly Rates)
- Store one exchange rate per month per currency pair in each year's data
- Data structure: `{ month: 'YYYY-MM', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.18 }`
- Automatically fetch from API when rate for a month is not available
- Rates stored in YearData to avoid accumulating too much historical data
- Apply same rate to all transactions within that month
- Old year rates archived with year data when year is archived

**FR-11.3** [ ] Automatic Currency Conversion in Reports
- Balance Sheet: Convert all account balances and manual assets to base currency using current month's rate
- Cash Flow Report: Convert all transactions using the rate from their transaction month
- Net Worth Calculation: Sum all assets in base currency
- Show original amount + currency alongside converted amount (e.g., "€1,000 (≈ $1,180)")

**FR-11.4** [ ] Monthly Rate Fallback Strategy
- Use rate from transaction's month (e.g., transaction on 2026-01-15 uses 2026-01 rate)
- If month rate unavailable locally:
  1. Attempt to fetch from API automatically
  2. If API fails, use previous month's rate (up to 12 months back)
  3. If no rate found, flag as "missing rate" in reports
- Allow retroactive rate updates (recalculates affected reports)
- Fetch happens in background, doesn't block report display

**FR-11.5** [ ] Multi-Currency Transaction Support
- Transactions inherit currency from source account
- Transfer between accounts with different currencies uses month's exchange rate
- Store actual amounts without conversion (conversion done at report time)

**FR-11.6** [ ] Exchange Rate Data Model

```typescript
interface ExchangeRate {
  id: string;
  month: string; // YYYY-MM format (e.g., '2026-01')
  fromCurrency: string; // Currency code (e.g., 'EUR')
  toCurrency: string; // Currency code (e.g., 'USD')
  rate: number; // Exchange rate (e.g., 1.18)
  createdAt: string; // ISO timestamp
}

// Add to YearData - rates stored per year to avoid historical data accumulation
interface YearData {
  transactions: Transaction[];
  budgets: Budget[];
  manualAssets: ManualAsset[];
  exchangeRates: ExchangeRate[]; // Exchange rates for this year only
}

// Budget needs currency support
interface Budget {
  // ... existing fields
  currencyId: string; // Budget amount is in this currency
}
```

**FR-11.7** [ ] Exchange Rate Management UI (Read-Only)
- Dedicated section in Settings: "Exchange Rates"
- Table view: Month | Currency Pair | Rate (read-only display)
- Filter by year (shows rates for selected year)
- Rates displayed are read-only - no manual editing allowed
- Rates auto-fetched from API when needed (background)
- "Refresh" button to trigger re-fetch from API for current year
- "Fetch Missing Rates" button to trigger API fetch for selected year
- All rate values are sourced from API only (no manual entry/override)

**FR-11.8** [x] Report Display Options
- Currency selector dropdown in each report to temporarily view in different currency
- Defaults to base currency setting from user preferences
- Selection resets to base currency when navigating away from report
- Visual indicator showing which currency is being displayed
- To permanently change currency for all reports, user changes base currency in Settings (triggers sync)

**FR-11.9** [ ] Missing Rate Handling
- Report shows clear message: "Exchange rate not set for [Month] [Currency]"
- Automatic: Attempts to fetch from API in background when rate needed
- Quick action: "Retry fetch" if API fetch fails
- List of missing rates by month in Settings with "Fetch All" button
- Show loading indicator while fetching rates
- If API consistently fails, use previous month's rate with warning indicator

**FR-11.10** [ ] Exchange Rate API Integration
- Use free/public API (e.g., exchangerate-api.io free tier: 1,500 requests/month)
- Fetch monthly average or mid-month rate (15th of month)
- All fetched rates stored in YearData (exchangeRates array)
- Each year contains only its own rates (reduces data size)
- Rates persist across sessions and sync with file
- Handle API errors gracefully (fallback to previous month's rate)
- No API key stored in code (user can optionally configure for higher limits)
- Works offline: Uses rates already stored in year data

**Rationale**: API-first approach with monthly rates stored per year provides:
- ~12 rates per year per currency pair (vs ~250 daily rates)
- Automatic rate fetching eliminates manual data entry
- Simple mental model: "1 EUR = $1.18 this month"
- Rates stored per year: ~1-2 KB per year for multi-currency users
- Historical rates archived with year data automatically
- No manual override keeps implementation simple

**Limitations**: 
- Less precise for currencies with high volatility
- Intra-month fluctuations ignored
- No manual rate override in initial version (API-only)
- Requires internet for first-time rate fetch (stored in year data after)
- Acceptable trade-offs for personal finance use case

**Models Requiring Currency Support**:
- Account: Already has `currencyId` ✓
- ManualAsset: Already has `currencyId` ✓
- Budget: **Add `currencyId`** - budget amounts must be in specific currency
- Transaction: Inherits currency from account, no direct field needed
- Categories/TransactionTypes: No currency needed (classification only)

### FR-12: Transaction Type Account Defaults (Post-MVP)

**FR-12.1** [x] Default account configuration for transfer transaction types - *Phase 23*
- Transaction types in TRANSFER group can have optional default accounts
- `defaultFromAccountId` - sets "from account" automatically when creating transaction
- `defaultToAccountId` - sets "to account" automatically when creating transaction
- Defaults can be set independently (one, both, or neither)
- User cannot change default accounts in transaction form (enforced)
- Simplifies repetitive transfers (e.g., "Salary" always from employer account)

**FR-12.2** [x] Simplified quick entry UI for transfer types with defaults - *Phase 23*
- Hide account fields in quick entry row when defaults are set
- Only show account fields that have no default configured
- Show which defaults are being used (subtle indicator or read-only display)
- Full transaction dialog disables (not hides) fields with defaults to show which accounts are used
- Reduces visual clutter and prevents errors for common transfer patterns

**Rationale**: Many transfer transactions are repetitive with predictable accounts:
- Salary transfers: always from same source account
- Regular savings: always to same savings account
- Loan payments: always from same account
- Credit card payments: always to same card account

Setting defaults reduces data entry and simplifies the UI for common workflows.
### FR-13: Data Backup and Recovery (Post-MVP)

**FR-13.1** [x] Automatic backup reminder - *Phase 24*
- Check last backup timestamp when data file is loaded
- Prompt user if no backup exists or last backup is older than 1 month
- Non-blocking notification that allows user to backup now or dismiss
- Store last backup timestamp in main data file

**FR-13.2** [x] Manual backup creation - *Phase 24*
- Backup option in Settings page under Data & Sync section
- Compress main data file (ZIP format) when creating backup
- Include timestamp in backup filename (e.g., `money-tree-backup-2026-01-07.zip`)
- Download compressed backup to user's device
- Update last backup timestamp after successful backup

**FR-13.3** [x] Backup file format - *Phase 24*
- ZIP archive containing the JSON data file
- Preserve original file structure inside ZIP
- Include metadata: backup creation date, app version
- Human-readable filename with date

**Rationale**: Users need protection against data loss from:
- Accidental deletion or corruption
- Device failure or browser data clearing
- User error during editing
- File storage provider issues

Regular backups provide peace of mind and recovery options without requiring constant manual attention.