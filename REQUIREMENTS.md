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

**FR-3.6** [ ] Manual asset value tracking over time

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

**FR-6.3** [x] One JSON file per calendar year - *Phase 2*

**FR-6.4** [x] Data includes transactions, accounts, categories, budgets, manual assets - *Phase 2-6*

**FR-6.5** [x] Fixed currency defaults (not stored in files) - *Phase 2*

**FR-6.6** [x] Portable JSON format - *Phase 2*

**FR-6.7** [x] Extensible storage adapter pattern - *Phase 2*

**FR-6.8** [ ] Auto-save: Detect data changes

**FR-6.9** [ ] Auto-save: Prompt on browser close/navigation

**FR-6.10** [ ] Auto-save: Periodic background save (configurable interval, default 5 minutes)

**FR-6.11** [ ] Unsaved changes indicator in UI

**FR-6.12** [ ] Manual save option always available

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

**FR-9.1** [ ] Year switching and management
- Switch between different years
- Create new year files
- Year selector visible in interface

**FR-9.2** [ ] Multi-year data loading
- Load multiple year files simultaneously
- Aggregate data from multiple years for reporting
- Memory-efficient handling of large datasets

**FR-9.3** [ ] Cross-year analysis
- View reports spanning multiple years
- Compare data year-over-year
- Track long-term trends across years
- Net worth progression over multiple years

**FR-9.4** [ ] Year transitions
- Carry forward account balances to new year
- Copy categories and budgets to new year
- Archive old year files

**FR-9.5** [ ] Historical analysis
- View transaction history across all years
- Search transactions across multiple years
- Category spending trends over multiple years
- Income and expense patterns year-over-year

**FR-9.6** [ ] Account overview report
- Individual account details and transaction history
- Account balance over time chart
- Multi-year account history view
- Filter and search transactions
- Export account statement

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

### FR-11: Cloud Storage Integration (Post-MVP, Optional)

**FR-11.1** [ ] OneDrive integration with full sync

**FR-11.2** [ ] Google Drive integration with full sync

**FR-11.3** [ ] Dropbox integration with full sync

**FR-11.4** [ ] OAuth authentication via provider SDKs
- OneDrive: `@azure/msal-browser`
- Google Drive: Google Sign-In SDK
- Dropbox: Dropbox SDK authentication

**FR-11.5** [ ] Opt-in cloud storage (local-only remains fully functional)

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

**NFR-3.2** [ ] Responsive user interface - *Phase 10*

**NFR-3.3** [ ] Smooth transitions between views - *Phase 9, 10*

**NFR-3.4** [ ] Efficient data loading and saving - *Phase 10*

**NFR-3.5** [ ] Optimized bundle size through code splitting - *Phase 10*

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

**TC-3** [x] Limited by browser storage for local caching - *Phase 2*

### Post-MVP Constraints (Cloud Storage)

**TC-4** [ ] Depends on cloud storage provider availability

**TC-5** [ ] Requires internet connection for cloud synchronization
