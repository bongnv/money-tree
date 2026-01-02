# Money Tree - Implementation Plan

This document provides a step-by-step implementation plan for building the Money Tree application. The plan is divided into MVP (Minimum Viable Product) and post-MVP phases.

## Testing Approach

**Unit tests should be written alongside implementation in each phase:**
- Write tests for utility functions, services, and business logic
- Write tests for Zustand stores
- Write component tests for UI elements
- Run `npm test` after each implementation step to verify
- Maintain test coverage as features are added
- **Target: Minimum 80% code coverage across the codebase**
- Run `npm test -- --coverage` to check coverage metrics
- All new features must include tests before marking phase as complete

**Manual UI Verification:**
- "Test UI" sections provide manual verification steps for the user
- These are performed in the browser by the user, not automated
- Build features incrementally so each step is immediately visible
- Add routes early to enable UI testing as you build

## Requirements Reference

This plan implements all requirements from REQUIREMENTS.md.

**MVP Functional Requirements:**
- **FR-1**: Transaction Management → Phase 5, 6 (MVP)
- **FR-2**: Categorization System → Phase 2, 4 (MVP)
- **FR-3**: Account Management → Phase 3, 5 (MVP)
- **FR-4**: Category Customization → Phase 4 (MVP)
- **FR-5**: Dashboard & Quick Entry → Phase 6 (MVP)
- **FR-6**: Data Storage (Local) → Phase 2, 8 (MVP)
- **FR-7**: Financial Reports → Phase 7 (MVP)
  - Balance Sheet with manual assets
  - Cash Flow (transfers excluded)
- **FR-8**: Budget Planning & Review → Phase 8 (MVP)

**Post-MVP Functional Requirements:**
- **FR-9**: Year Management & Multi-Year Support → Phase 11 (Post-MVP)
  - Account Overview Report (multi-year view)
- **FR-10**: Advanced Data Management → Phase 17 (Post-MVP)
- **FR-11**: Cloud Storage Integration → Phase 18+ (Post-MVP, Optional)

**MVP Non-Functional Requirements:**
- **NFR-1**: Architecture → Phase 1, 9
- **NFR-2**: Technology Stack → Phase 1, 2
- **NFR-3**: Performance → Phase 10
- **NFR-4**: Usability → Phase 6, 8, 10
- **NFR-5**: Compatibility → Phase 9, 10
- **NFR-6**: Reliability → Phase 2, 10
- **NFR-7**: Maintainability → Phase 1, 10

**Post-MVP Non-Functional Requirements:**
- **NFR-8**: Cloud Security → Phase 18+ (Post-MVP, Optional)
- **NFR-9**: Advanced Reliability → Phase 17 (Post-MVP)

---

# MVP IMPLEMENTATION

## Phase 1: Project Setup & Foundation (MVP)

**Requirements**: NFR-1 (Architecture), NFR-2 (Technology Stack), NFR-7 (Maintainability)

**Goal**: Set up development environment, tooling, and project structure

### 1.1 Initialize Project
- [x] Create `package.json` with project metadata
- [x] Install core dependencies: `react`, `react-dom`, `typescript`
- [x] Install dev dependencies: `webpack`, `webpack-cli`, `webpack-dev-server`
- [x] Verify: Run `npm install` successfully

### 1.2 Configure TypeScript
- [x] Create `tsconfig.json` with strict mode enabled
- [x] Configure paths for module resolution
- [x] Set up JSX for React
- [x] Verify: Run `tsc --noEmit` without errors

### 1.3 Configure Webpack
- [x] Create `webpack.config.js` for development
- [x] Configure TypeScript loader (`ts-loader`)
- [x] Configure HTML plugin with `public/index.html`
- [x] Set up dev server with hot reload
- [x] Verify: Run `npm run dev` and see basic page at localhost

### 1.4 Configure Code Quality Tools
- [x] Install ESLint and `@typescript-eslint` packages
- [x] Create `.eslintrc.js` with TypeScript rules
- [x] Install Prettier
- [x] Create `.prettierrc` with formatting rules
- [x] Add ESLint-Prettier integration
- [x] Verify: Run `npm run lint` successfully

### 1.5 Setup Material-UI
- [x] Install `@mui/material` and `@emotion/react`, `@emotion/styled`
- [x] Install `@mui/icons-material`
- [x] Create `src/theme.ts` with basic MUI theme
- [x] Verify: Import and use a MUI component in test file

### 1.6 Create Development Environment Files
- [x] Create `.nvmrc` file with Node.js version (LTS - 18 or 20)
- [x] Create `.editorconfig` file for consistent coding styles across editors

### 1.7 Create Project Structure
- [x] Create folder structure: `src/components`, `src/stores`, `src/services`, `src/types`, `src/utils`, `src/hooks`, `src/constants`, `src/schemas`
- [x] Basic `src/index.tsx` entry point exists
- [x] Basic `src/App.tsx` root component exists
- [x] `public/index.html` exists
- [x] Scripts for dev, build, lint, format are configured

### 1.8 Setup GitHub CI/CD
- [x] Create `.github/workflows/ci.yml` workflow file
- [x] Configure workflow to run on push and pull request to main branch
- [x] Add jobs: install dependencies, lint, format check, test with coverage, build
- [x] Configure coverage threshold in `jest.config.js` (80% minimum)
- [x] Configure Node.js version matching `.nvmrc`
- [x] Add caching for node_modules
- [x] Test: Push code and verify workflow runs successfully on GitHub

### 1.9 Setup Testing Framework
- [x] Install Jest and TypeScript support: `jest`, `@types/jest`, `ts-jest`
- [x] Install React Testing Library: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [x] Create `jest.config.js` with TypeScript and path mapping support
- [x] Add test scripts to package.json: `test`, `test:watch`, `test:coverage`
- [x] Configure Jest to pass with no tests (`--passWithNoTests`)
- [x] Verify: Run `npm test` - passes with no tests

## Phase 2: Core Foundation & Local Storage (MVP)

**Requirements**: FR-6 (Data Storage - Local), NFR-2 (Technology Stack), NFR-6 (Reliability)

**Goal**: Establish data models and local file storage foundation

**Note**: No authentication required. Users can use the app immediately with local file storage.

### 2.1 Setup Core Infrastructure
- [x] Install dependencies: `zustand`, `zod`, `date-fns`
- [x] Create `src/types/enums.ts` with all enums: `Group`, `AccountType`, `BudgetPeriod`
- [x] Create `src/types/models.ts` with all interfaces: `Currency`, `Account`, `Category`, `TransactionType`, `Transaction`, `Budget`, `BudgetItem`, `DataFile`
- [x] Create `src/schemas/models.schema.ts` with Zod schemas for all models
- [x] Create `src/constants/defaults.ts` with default currencies
- [x] **Write tests**: `enums.test.ts`, `models.schema.test.ts` (Zod validation)
- [x] **Test**: All schemas validate correctly, default data is valid

### 2.2 Implement Storage Interface (Extensible Architecture)
- [x] Create `src/services/storage/IStorageProvider.ts` - interface defining storage contract
- [x] Define methods: `loadDataFile(year)`, `saveDataFile(year, data)`, `listAvailableYears()`
- [x] Create `src/services/storage/LocalStorageProvider.ts` - implements IStorageProvider using File System Access API
- [x] Create `src/services/storage/StorageFactory.ts` - factory to get current storage provider
- [x] **Write tests**: `IStorageProvider.test.ts`, `LocalStorageProvider.test.ts`
- [x] **Test**: Interface is well-defined, local storage provider compiles

### 2.3 Implement Local File Storage
- [x] Implement `LocalStorageProvider.saveDataFile()` using File System Access API (download/save file picker)
- [x] Implement `LocalStorageProvider.loadDataFile()` using File System Access API (file open picker)
- [x] Add error handling for browser compatibility and user cancellation
- [x] Create `src/services/storage.service.ts` for localStorage caching (app state, preferences)
- [x] Create `src/stores/useAppStore.ts` for app-level state (year, file handle, loading status)
- [x] **Write tests**: Test save/load operations, error handling, cancellation
- [x] **Test**: Can save data file to local machine, can load data file from local machine, data persists

### 2.4 Setup Data Management UI
- [x] Create `src/services/sync.service.ts` with auto-save logic:
  - [x] Track unsaved changes across all stores
  - [x] Provide `promptSaveIfNeeded()` function to check and prompt before destructive actions
  - [x] Implement periodic auto-save with configurable interval (default: 1 minute)
  - [x] Auto-save timer starts when changes are detected
  - [x] Auto-save only runs when there are unsaved changes
  - [x] Auto-save saves silently without user prompts
  - [x] Integrate with useAppStore for unsaved changes tracking
- [x] Create `src/components/layout/Header.tsx` with:
  - [x] "Load" button (triggers file picker)
  - [x] "Save" button (triggers file save)
  - [x] Current file name display
  - [x] Last saved time display
  - [x] Unsaved changes indicator (dot or asterisk)
- [x] Create `src/components/common/UnsavedChangesDialog.tsx` - confirmation before closing with unsaved changes
- [x] Create `src/components/common/FileLoadErrorDialog.tsx` - show errors when file fails to load
- [x] Update `src/App.tsx` to:
  - [x] Wrap with Header component
  - [x] Add window beforeunload handler for unsaved changes warning
  - [x] Connect save/load buttons to storage service
  - [x] Prompt to save before loading a different file
  - [x] Initialize periodic auto-save on mount
  - [x] Clean up auto-save timer on unmount
- [x] **Write tests**: Test save/load UI interactions, unsaved changes detection, error handling, auto-save prompts, periodic auto-save
- [x] **Test**: Click "Load" → file picker opens → select file → data appears; Click "Save" → file picker opens → save file; Make changes → see unsaved indicator → wait 1 minute → auto-saved; close browser → get warning; Make changes → load different file → prompted to save first

### 2.5 Add Auto-Load on Page Reload
- [ ] Store last loaded file path/handle in localStorage (in storage.service.ts)
- [ ] Add `getLastFilePath()` and `setLastFilePath()` methods to storage.service.ts
- [ ] Update `syncService.loadDataFile()` to save file path/reference after successful load
- [ ] Add `loadLastFile()` method to sync.service.ts that attempts to reload the last file
- [ ] Update `App.tsx` to call `syncService.loadLastFile()` on mount (useEffect)
- [ ] Handle case where file no longer exists or is inaccessible (show error, prompt to load new file)
- [ ] **Write tests**: Test auto-load on mount, test file not found handling, test no previous file case
- [ ] **Test**: Load a file → reload page → data automatically loads; Delete file → reload page → see error message

## Phase 3: Account Management Feature (MVP)

**Requirements**: FR-3 (Account Management)

**Goal**: Users can create and manage their accounts (bank accounts, credit cards, etc.)

### 3.1 Implement Account Data Layer
- [x] Create `src/stores/useAccountStore.ts` with account state and CRUD actions
- [x] Create `src/utils/currency.utils.ts` for formatting amounts with default currencies
- [x] Load default currencies from constants

### 3.2 Build Account Management UI
- [x] Create `src/components/layout/MainLayout.tsx` with header, navigation
- [x] Create `src/components/accounts/AccountCard.tsx`
- [x] Create `src/components/accounts/AccountList.tsx`
- [x] Create `src/components/accounts/AccountForm.tsx` with validation
- [x] Create `src/components/accounts/AccountDialog.tsx`
- [x] Create `src/components/accounts/AccountsPage.tsx`
- [x] Add route `/accounts` in router setup
- [x] **Test**: Create account, edit account, view account list, delete account (all via UI)

## Phase 4: Category & Transaction Type Management Feature (MVP)

**Requirements**: FR-2 (Categorization System), FR-4 (Category Customization)

**Goal**: Users can customize their category structure for organizing transactions

### 4.1 Implement Category Data Layer
- [x] Create `src/stores/useCategoryStore.ts` with categories and transaction types

### 4.2 Build Category Management UI
- [x] Create `src/components/categories/CategoryCard.tsx`, `CategoryList.tsx` (no hierarchy needed)
- [x] Create `src/components/categories/CategoryForm.tsx`
- [x] Create `src/components/categories/CategoryDialog.tsx`
- [x] Create `src/components/categories/TransactionTypeCard.tsx`, `TransactionTypeList.tsx`
- [x] Create `src/components/categories/TransactionTypeForm.tsx`
- [x] Create `src/components/categories/TransactionTypeDialog.tsx`
- [x] Create `src/components/categories/CategoriesPage.tsx` with tabs
- [x] Write comprehensive tests for all components (59 tests)
- [ ] Add route `/categories` (pending router setup in Phase 8)
- [x] **Test**: Add category, add transaction type, edit names, delete (with validation), tabs work correctly

## Phase 5: Transaction Management Feature (MVP)

**Requirements**: FR-1 (Transaction Management), FR-3 (Account Management - balance updates)

**Goal**: Users can add, view, edit, and delete transactions

### 5.1 Implement Transaction Data Layer
- [x] Create `src/stores/useTransactionStore.ts` with transaction CRUD
- [x] Create `src/services/calculation.service.ts` for balance calculations
- [x] Create `src/services/validation.service.ts` for transaction validation
- [x] Create `src/utils/date.utils.ts` for date formatting

### 5.2 Build Transaction Management UI

#### 5.2.1 Install Dependencies and Create Common Components
- [x] Install `@mui/x-data-grid` for transaction list
- [x] Create `src/components/common/FormTextField.tsx` - reusable text field wrapper
- [x] **Write tests**: FormTextField.test.tsx
- [x] **Test**: FormTextField renders and handles validation errors

#### 5.2.2 Create Transaction Form Component
- [x] Create `src/components/transactions/TransactionForm.tsx`:
  - [x] Amount field with validation
  - [x] Date picker
  - [x] Transaction type dropdown (grouped by category)
  - [x] Conditional "From Account" field (for expense, transfer)
  - [x] Conditional "To Account" field (for income, transfer, investment)
  - [x] Notes field (optional)
  - [x] Form validation logic
- [x] **Write tests**: TransactionForm.test.tsx with conditional field rendering
- [x] **Test**: Form shows correct fields based on transaction type, validates required fields

#### 5.2.3 Create Transaction Dialog and Page with Route
- [x] Create `src/components/transactions/TransactionDialog.tsx`:
  - [x] Wraps TransactionForm in MUI Dialog
  - [x] Dynamic title (Add/Edit Transaction)
  - [x] Submit and cancel handlers
- [x] Create `src/components/transactions/TransactionsPage.tsx` with "New Transaction" button
- [x] Add route `/transactions` in App.tsx
- [x] **Write tests**: TransactionDialog.test.tsx
**Manual Verification (User):** Navigate to /transactions, click "New Transaction": dialog opens, conditional fields appear based on transaction type, validation errors display, submit creates transaction, dialog closes.

#### 5.2.4 Add Transaction List to Page
- [x] Create `src/components/transactions/TransactionList.tsx`:
  - [x] Integrate @mui/x-data-grid
  - [x] Define columns: Date, Description, Category, Amount, From/To Accounts
  - [x] Add edit and delete action buttons
  - [x] Handle row click for editing
  - [x] Empty state message
- [x] Add TransactionList to TransactionsPage below the button
- [x] Connect edit button to open dialog with transaction data
- [x] Add delete confirmation
- [x] **Write tests**: TransactionList.test.tsx (15 tests)
**Manual Verification (User):** Create transactions and see them in the list, click edit to open dialog with data, delete transaction, verify empty state.

#### 5.2.5 Add Transaction Filters to Page
- [x] Create `src/components/transactions/TransactionFilters.tsx`:
  - [x] Date range filter (from/to)
  - [x] Account filter (multi-select)
  - [x] Category/group filter
  - [x] Transaction type filter
  - [x] Search by description
  - [x] Clear filters button
- [x] Add TransactionFilters to TransactionsPage at top
- [x] Connect filters to filter transaction list
- [x] **Write tests**: TransactionFilters.test.tsx
**Manual Verification (User):** Create diverse transactions, test each filter independently and in combination, verify clear filters button works.

#### 5.2.6 Add Navigation and Polish
- [x] Add "Transactions" button to Header navigation with icon
- [x] Update Header.test.tsx for new navigation button
- [x] Add page title and layout refinements to TransactionsPage
- [x] **Write tests**: TransactionsPage.test.tsx with full CRUD workflow
**Manual Verification (User):** Complete end-to-end workflow - add expense/income/transfer/investment transactions, filter by date/account/category, edit and delete transactions, verify unsaved changes indicator, save file and verify persistence.

#### 5.2.7 (Removed - merged into 5.2.3 and 5.2.6)

### 5.3 Verify Account Balance Updates
- [x] Update AccountCard to show calculated balance
- [x] **Test**: Add transactions and verify account balances update correctly

## Phase 6: Financial Reports (MVP)

**Requirements**: FR-7 (Financial Reports - Balance Sheet, Cash Flow)

**Goal**: Users can view balance sheet and cash flow reports

### 6.1 Implement Manual Assets Feature ✅
- [x] Create `src/types/models.ts` interface for ManualAsset (name, type, value, date, notes)
- [x] Create `src/stores/useAssetStore.ts` for manual assets and liabilities
- [x] Add Zod schemas for asset validation
- [x] Create `src/components/assets/ManualAssetForm.tsx`
- [x] Create `src/components/assets/ManualAssetDialog.tsx`
- [x] Create `src/components/assets/ManualAssetList.tsx`
- [x] **Write tests**: Asset store and component tests
**Manual Verification (User):** Add various manual assets (house, car, investments), edit asset values, delete assets, verify all CRUD operations work correctly.

### 6.2 Build Balance Sheet Report with Charts
- [x] Install charting library (recharts or nivo)
- [x] Create `src/components/charts/LineChart.tsx` - reusable line chart component
- [x] Create `src/components/charts/BarChart.tsx` - reusable bar chart component
- [x] Create `src/services/report.service.ts` with balance calculations
- [x] Create `src/components/reports/BalanceSheet.tsx`:
  - [x] Assets section (accounts + manual assets grouped by type)
  - [x] Liabilities section (credit cards, loans, manual liabilities)
  - [x] Net worth calculation and trend
  - [x] Date selection for historical view
  - [x] Comparison features (month-over-month, year-over-year)
  - [x] Net worth trend chart using LineChart component
- [x] Create `src/components/reports/ManualAssetSection.tsx`
- [x] **Write tests**: Balance sheet calculations, rendering, and chart component tests
**Manual Verification (User):** View balance sheet with accounts and manual assets, select different dates and verify historical data, check net worth calculation and trend chart displays correctly, test month-over-month comparison, verify assets grouped correctly by type.

### 6.3 Build Cash Flow Report with Charts
- [x] Create `src/components/charts/PieChart.tsx` - reusable pie chart component
- [x] Create cash flow calculation service (excludes transfers)
- [x] Create `src/components/reports/CashFlowReport.tsx`:
  - [x] Income section by category
  - [x] Expense section by category
  - [x] Net cash flow calculation
  - [x] Time period selection (monthly, quarterly, yearly, custom)
  - [x] Trend charts (income vs expenses over time) using LineChart
  - [x] Category breakdown charts using PieChart
  - [x] Filtering options
- [x] Integrate CashFlowReport into ReportsPage (enable Cash Flow tab)
- [x] **Write tests**: Cash flow calculations, verify transfers excluded, chart rendering (31 tests)
**Manual Verification (User):** Create mix of income/expense/transfer transactions, view cash flow for monthly/quarterly/yearly periods, verify transfers don't appear in report, test category filters, check trend and pie charts display correctly.

### 6.4 Create Reports Page
- [x] Create `src/components/reports/ReportsPage.tsx` with tab navigation
- [x] Add route `/reports`
- [x] Add "Reports" navigation button to Header
- [x] **Write tests**: Reports page navigation (6 tests)
- [ ] Add export buttons for each report (CSV/PDF)
- [ ] Create `src/utils/export.utils.ts` for data export
- [ ] **Write tests**: Export functionality
**Manual Verification (User):** Navigate to /reports, view Balance Sheet tab, verify tab navigation works, check responsive layout on different screen sizes. Export functionality pending section 6.3 completion.

## Phase 7: Budget Planning & Review (MVP)

**Requirements**: FR-8 (Budget Planning & Review)

**Goal**: Users can set budgets per transaction type and track spending progress

### 7.1 Create Basic Budget Page with Add/Edit/Delete
- [x] Update `src/types/models.ts` to add `Budget` model:
  - [x] `id: string` - unique identifier
  - [x] `transactionTypeId: string` - which transaction type
  - [x] `amount: number` - budget amount
  - [x] `period: 'monthly' | 'quarterly' | 'yearly'` - period type
- [x] Create `src/stores/useBudgetStore.ts` with budgets CRUD operations
- [x] Create `src/components/budgets/BudgetDialog.tsx`:
  - [x] Transaction type selector (grouped by category, dropdown)
  - [x] Amount input field with validation
  - [x] Period selector dropdown (Monthly/Quarterly/Yearly)
  - [x] Save and cancel buttons
  - [x] Form validation (amount > 0, transaction type required)
- [x] Create `src/components/budgets/BudgetsPage.tsx`:
  - [x] "Add Budget" button (opens BudgetDialog)
  - [x] Simple list of budgets showing: transaction type, amount, period
  - [x] Group by category (Income section shows "Income Targets", Expense sections show "Budgets")
  - [x] Edit and delete buttons for each item
  - [x] Empty state: "No budgets set. Click Add Budget to get started."
- [x] Add route `/budgets` in App.tsx
- [x] Add "Budgets" navigation button to Header with icon
- [x] **Write tests**: useBudgetStore.test.ts, BudgetDialog.test.tsx, BudgetsPage.test.tsx
**Manual Verification (User):** Navigate to /budgets, click "Add Budget", select Groceries, enter $400, select Monthly, save. Verify item appears in list. Add more budgets (Rent $1,500/month, Car Insurance $600/quarter). Edit a budget amount. Delete a budget. Verify all CRUD operations work.

### 7.2 Add Progress Tracking with Actual Spending
- [x] Add proration and progress calculation functions to `calculation.service.ts`:
  - [x] `prorateBudget(amount, fromPeriod, toPeriod)` - convert between periods
  - [x] `calculateActualAmount(transactionTypeId, startDate, endDate)` - sum transactions
- [x] Update BudgetsPage to show progress for current month:
  - [x] Display budget amount and actual spending/income for each budget item
  - [x] Add progress bar with context-aware color coding:
    - [x] Expenses: green < 80%, yellow 80-100%, red > 100%
    - [x] Income: green ≥ 100%, yellow 60-99%, red < 60%
  - [x] Show percentage (actual / budget × 100%)
  - [x] Group budget items by category with context-aware labels:
    - [x] Income section header: "Income Targets"
    - [x] Expense section headers: "[Category Name] Budgets"
  - [x] Add total rows per section (total budget vs total actual)
- [x] Automatically prorate budgets to monthly for display (e.g., $600 quarterly → $200/month)
- [x] **Write tests**: Calculation functions, progress display, context-aware color coding for income vs expenses
**Manual Verification (User):** With budgets from 7.1, add transactions for both income (Salary) and expenses (Groceries, Rent). Navigate to /budgets and verify: (1) Income section shows "Income Targets" with green bars when meeting target, (2) Expense sections show "Budgets" with green bars when under budget, (3) Progress bars and colors invert correctly for income vs expenses, (4) $600 quarterly budget displays as $200 for current month. Add more transactions and verify real-time updates.

### 7.3 Add Date Ranges for Budget Validity Periods
- [x] Update `src/types/models.ts` Budget model:
  - [x] Add `startDate: string` - required start date (YYYY-MM-DD format)
  - [x] Add `endDate: string` - required end date (YYYY-MM-DD format)
  - [x] Allows multiple budgets for same transaction type with different date ranges (e.g., Rent $1500 Jan-Jun, Rent $1600 Jul-Dec)
- [x] Update `src/schemas/models.schema.ts`:
  - [x] Add required startDate and endDate to BudgetSchema with date format validation
  - [x] Add validation: endDate must be >= startDate
- [x] Update BudgetDialog:
  - [x] Add "Start Date" and "End Date" date pickers (required)
  - [x] Prefill with current year start (Jan 1) and end (Dec 31)
  - [x] Add validation: end date must be >= start date
- [x] Update `calculation.service.ts`:
  - [x] Add `getActiveBudgetForPeriod(budgets, transactionTypeId, date)` - finds budget active on a specific date
- [x] Update BudgetsPage display:
  - [x] Show date range: "Jan 1 - Jun 30, 2026"
  - [x] Display date range next to budget amount in secondary text
  - [x] Allow multiple budgets for same transaction type if date ranges don't overlap
- [x] Update useBudgetStore validation:
  - [x] Check for overlapping date ranges when adding/editing budgets for same transaction type
  - [x] Prevent saving if date ranges overlap with error message
- [x] **Write tests**: Date range validation, overlapping detection, active budget selection, display with date ranges (16 new tests added)
**Manual Verification (User):** Navigate to /budgets. Add budget for Rent $1500/month - dates will prefill to Jan 1 - Dec 31, 2026. Edit dates to Jan 1 - Jun 30, 2026. Add another budget for Rent $1600/month with Jul 1 - Dec 31, 2026. Verify both appear with date ranges shown. Verify progress tracking uses correct budget based on transaction dates. Try to add overlapping budget and verify validation error prevents saving.

### 7.4 Add Period Selector for Flexible Viewing
- [x] Create `src/components/budgets/PeriodSelector.tsx`:
  - [x] Dropdown with options: 12 months, 4 quarters (Q1-Q4), current year, previous year
  - [x] Default to current month
  - [x] Returns PeriodOption: {label, startDate, endDate}
- [x] Update BudgetsPage to use PeriodSelector:
  - [x] Add selectedPeriod state (defaults to current month)
  - [x] Display "Viewing period: {label}" below page title
  - [x] Filter budgets to show only those active during selected period
  - [x] Use prorateBudgetForPeriod() instead of simple prorateBudget()
- [x] Update `calculation.service.ts` with simple period-based proration:
  - [x] Add `getDaysInPeriod(startDate, endDate)` - counts actual days between dates
  - [x] Add `getMonthsInPeriod(startDate, endDate)` - approximate month counting  
  - [x] Add `prorateBudgetForPeriod(budget, startDate, endDate)`:
    - [x] Convert budget to monthly equivalent (quarterly ÷ 3, yearly ÷ 12, monthly stays same)
    - [x] Multiply by approximate months in viewing period
    - [x] Adjust for partial overlaps: if budget not active for full viewing period, multiply by (overlap_days / period_days)
    - [x] **Design decision**: Uses simple period conversions (×3, ×12) for clarity over complex day-based math
    - [x] **Trade-off**: Prioritizes user comprehension ($1,500/month always shows $1,500 for any month) over ~2% accuracy variance
- [x] Handle budget date range overlaps with viewing period:
  - [x] If budget active for only part of viewing period, prorate accordingly
  - [x] Example: Viewing Q1 (Jan-Mar), but budget only active Jan-Feb → 1500 × 3 × (59/90) = $2,950
- [x] **Write tests**: Day counting, period conversions, proration for different period combinations, partial overlaps
**Manual Verification (User):** With existing budgets (including date-ranged ones), navigate to /budgets. Use period selector to switch between January 2026, Q1 2026, and 2026. Verify $1,500 monthly budget shows as $1,500 (1 month), $4,500 (3 months), and $18,000 (12 months). Verify quarterly budget $4,500 shows as $1,500 (1 month), $4,500 (3 months), $18,000 (12 months). Verify partial overlap: Budget active Jan-Feb only, viewing Q1 → shows ~$2,950 (prorated for 2 of 3 months).

## Phase 8: Dashboard with Quick Transaction Entry (MVP)

**Requirements**: FR-5 (Dashboard & Quick Entry), FR-1 (Transaction Management)

**Goal**: Users see a summary dashboard with financial overview, budget tracking, and inline transaction entry

### 8.1 Build Financial Summary Section
- [x] Create `src/components/dashboard/PeriodSelector.tsx`:
  - [x] Dropdown with options: This Month, Last Month, This Quarter, This Year, Year to Date
  - [x] Default to "This Month"
  - [x] Returns date range {startDate, endDate} for filtering
- [x] Create `src/components/dashboard/FinancialSummaryCard.tsx` - reusable card component
- [x] Add calculation functions to `src/services/calculation.service.ts`:
  - [x] `calculateNetWorth(accounts, manualAssets)` - sum all account balances + manual assets
  - [x] `calculateCashFlow(transactions, startDate, endDate)` - income - expenses for period
  - [x] `calculateSavingsRate(income, expenses)` - (income - expenses) / income × 100%
- [x] Create `src/components/dashboard/FinancialSummary.tsx`:
  - [x] Display 3 cards in responsive grid (row on desktop, stack on mobile)
  - [x] Net Worth card: total amount with up/down indicator
  - [x] Cash Flow card: income - expenses with percentage vs last period
  - [x] Savings Rate card: percentage with color coding (green ≥ 20%, yellow 10-19%, red < 10%)
- [x] **Write tests**: Period selector, calculation functions, financial summary cards (10 tests)
**Manual Verification (User):** View dashboard with accounts and transactions, verify net worth calculation is correct, check cash flow shows correct income/expense difference, verify savings rate calculates properly, switch period selector to see values update.

### 8.2 Build Budget Overview Section
- [x] Create `src/components/dashboard/BudgetProgressBar.tsx`:
  - [x] Show budget name, spent/budget amounts, progress bar
  - [x] Color coding: green < 80%, yellow 80-100%, red > 100% (expenses)
  - [x] Color coding inverted for income: green ≥ 100%, yellow 60-99%, red < 60%
- [x] Create `src/components/dashboard/BudgetOverview.tsx`:
  - [x] Display top 5 budget categories sorted by usage percentage (highest first)
  - [x] Use `calculateActualAmount()` from calculation.service for actual spending
  - [x] Prorate budgets to match selected period (use existing proration logic)
  - [x] Show "View All Budgets" link to /budgets page
  - [x] Empty state: "Set up budgets to track spending" with link to /budgets
- [x] Update based on period selector from 8.1
- [x] **Write tests**: Budget progress bars, budget overview with different periods, empty state (8 tests)
**Manual Verification (User):** With budgets and transactions set up, verify top 5 budgets appear sorted by % spent, check progress bars show correct colors, verify actual amounts match transaction totals, switch period to see prorated values, test empty state when no budgets exist.

### 8.3 Build Recent Transactions with Quick Add
- [x] Create `src/components/dashboard/RecentTransactionsList.tsx`:
  - [x] Display last 10 transactions with date, description, category/type, amount
  - [x] Color code amounts (green for income, default for expense)
  - [x] Add quick edit/delete actions (optional callbacks for onEdit/onDelete)
  - [x] Show "View All Transactions" link to /transactions page
  - [x] Real-time updates when new transaction added
- [x] Integrate QuickEntryRow component (reuse from Phase 12):
  - [x] Create `src/components/dashboard/QuickEntryContainer.tsx` to connect stores to QuickEntryRow
  - [x] Place at top of Recent Transactions section in DashboardPage
  - [x] After submit, transaction appears immediately in list below
  - [x] Transactions sorted by date (newest first)
- [x] **Write tests**: Recent transactions list, sorting, empty state, edit/delete callbacks, view all link (8 tests)
**Manual Verification (User):** View dashboard recent transactions, add a transaction using quick entry row, verify it appears at top of list immediately, verify "View All" link navigates to /transactions page, check color coding for income vs expenses.

### 8.4 Create Dashboard Page
- [x] Create `src/components/dashboard/DashboardPage.tsx`:
  - [x] Layout with 3 sections: Financial Summary (top), Budget Overview (middle), Recent Transactions + Quick Add (bottom)
  - [x] Pass selected period from PeriodSelector to all sections
  - [x] Responsive grid: 3-column on desktop, 1-column on mobile
  - [x] Update route `/` to use DashboardPage (already exists in App.tsx, replace placeholder)
- [x] **Write tests**: Dashboard page layout, period selector integration, responsive behavior (16 tests)
**Manual Verification (User):** Open dashboard at /, see all three sections populated with data, change period selector and verify all sections update, add transaction via quick entry and see it in recent list, test on mobile to verify single-column layout, check all "View All" links navigate correctly.

## Phase 9: Navigation & Routing (MVP)

**Requirements**: NFR-4 (Usability - navigation), NFR-5 (Compatibility - responsive)

**Goal**: Complete navigation experience with Settings organization

### 9.1 Complete Routing Setup
- [x] Install `react-router-dom` (already installed)
- [x] Create `src/routes.tsx` with route definitions:
  - [x] `/` - Dashboard
  - [x] `/transactions` - Transactions
  - [x] `/reports` - Reports
  - [x] `/budgets` - Budgets
  - [x] `/accounts` - Accounts (temporary, will move to /settings/assets in Phase 9.3)
  - [x] `/categories` - Categories (temporary, will move to /settings/categories in Phase 9.3)
  - [x] `/assets` - Manual Assets (temporary, will move to /settings/assets in Phase 9.3)
  - [x] `/404` - Not Found page
  - [x] Catch-all route redirects to /404
  - [ ] `/settings/*` routes (to be implemented in Phase 9.3)
- [x] Wrap app with BrowserRouter (already done)
- [x] Create 404 page (NotFoundPage component)
- [x] Update App.tsx to use routes.tsx
- [x] **Write tests**: Route navigation tests (13 tests), NotFoundPage tests (9 tests)
**Manual Verification (User):** Navigate directly to each URL, verify correct page loads, test /404 page with invalid URL (e.g., /xyz), check browser back/forward buttons work correctly.

### 9.2 Update Header Navigation
- [x] Make "Money Tree" logo/title clickable → navigate to Dashboard (/)
- [x] Update Header with simplified navigation (4 main items):
  - [x] Transactions (icon: receipt/list)
  - [x] Reports (icon: chart/analytics)
  - [x] Budgets (icon: savings/piggy bank)
  - [x] Settings (icon: gear/cog)
- [x] Remove Dashboard button from navigation (logo serves this purpose)
- [x] Remove Accounts, Categories, Assets buttons (will be under Settings in Phase 9.3)
- [x] Add icons for each section
- [x] Add active state styling (highlight current section)
- [x] Settings button highlights for /settings/* and temporary routes (/accounts, /categories, /assets)
- [x] Add mobile responsive menu (drawer)
- [x] **Write tests**: Header navigation tests, logo click navigation, active states, mobile menu (25 tests total, 14 new)
**Manual Verification (User):** Click "Money Tree" logo to return to dashboard, click each navigation link in Header, verify active state highlights current page, test on mobile to see drawer menu open/close, verify all icons display correctly, check keyboard navigation works.

### 9.3 Create Settings Page Structure
- [x] Create `src/components/settings/SettingsLayout.tsx`:
  - [x] Use MUI Drawer with variant="permanent" for desktop (width: 240px)
  - [x] Use MUI Drawer with variant="temporary" for mobile (with toggle button)
  - [x] Sidebar navigation using MUI List with ListItemButton components
  - [x] Navigation items: Assets, Categories
  - [x] Active state highlighting using selected prop and primary color
  - [x] Content area with Outlet from react-router-dom
  - [x] Responsive layout: Box with flexbox (drawer + content area)
  - [x] Mobile: Add IconButton (MenuIcon) in toolbar to toggle drawer
  - [x] Use useMediaQuery with theme.breakpoints.down('md') for responsive behavior
- [x] **Write tests**: SettingsLayout.test.tsx (6 tests)
  - [x] Test navigation items render and active state highlighting
  - [x] Test navigation onClick handlers
  - [x] Test Outlet renders child routes
- [x] Create `src/components/settings/SettingsPage.tsx`:
  - [x] Default landing page when visiting /settings
  - [x] Container with maxWidth="md" for centered layout
  - [x] Typography variant="h4" for page title: "Settings"
  - [x] Typography variant="body1" for description: "Configure your assets and categories"
  - [x] Grid container with spacing={3} for quick link cards
  - [x] Two MUI Cards (one for Assets, one for Categories)
  - [x] Each card: CardActionArea with onClick navigation
  - [x] Card content: Icon (AccountBalanceIcon, CategoryIcon), title, description
  - [x] Assets card navigates to /settings/assets
  - [x] Categories card navigates to /settings/categories
- [x] **Write tests**: SettingsPage.test.tsx (5 tests)
  - [x] Test cards render with correct titles
  - [x] Test card navigation to /settings/assets and /settings/categories
- [x] Create `src/components/settings/AssetsPage.tsx`:
  - [x] Container with maxWidth="lg"
  - [x] Typography variant="h4" for page title: "Assets"
  - [x] MUI Tabs component with two tabs: "Transactional" and "Manual"
  - [x] Tab state management: useState for activeTab (0 or 1)
  - [x] Transactional tab (index 0):
    - [x] Renders existing AccountsPage component
    - [x] AccountsPage already has all CRUD operations (dialogs, forms)
    - [x] Shows bank accounts, credit cards, cash accounts
  - [x] Manual tab (index 1):
    - [x] Renders existing ManualAssetsPage component
    - [x] ManualAssetsPage already has all CRUD operations (dialogs, forms)
    - [x] Shows properties, investments, vehicles, other assets
  - [x] Both tabs use conditional rendering with hidden prop (like CategoriesPage pattern)
  - [x] Data remains in separate stores (useAccountStore and useAssetStore)
  - [x] No data migration or restructuring needed
- [x] **Write tests**: AssetsPage.test.tsx (8 tests)
  - [x] Test tabs render and switching works
  - [x] Test AccountsPage renders in Transactional tab
  - [x] Test ManualAssetsPage renders in Manual tab
  - [x] Test only active tab content is visible
- [x] Update CategoriesPage to work within Settings layout:
  - [x] Add Container wrapper for consistent layout with AssetsPage
  - [x] Keep existing tabs and all functionality
  - [x] Ensure consistent styling with AssetsPage
  - [x] No changes to CategoryList or TransactionTypeList components needed
- [x] **Write tests**: CategoriesPage.test.tsx updates (2 tests)
  - [x] Test CategoriesPage renders within Settings layout with existing functionality
- [x] Update routes.tsx:
  - [x] Remove temporary routes: /accounts, /categories, /assets
  - [x] Add nested /settings routes:
    ```tsx
    <Route path="/settings" element={<SettingsLayout />}>
      <Route index element={<SettingsPage />} />
      <Route path="assets" element={<AssetsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
    </Route>
    ```
  - [x] Verify Settings button in Header highlights for /settings/*
  - [x] Test route navigation and nested routing
- [x] **Write tests**: routes.test.tsx updates (6 tests)
  - [x] Test /settings routes render correctly (index, assets, categories)
  - [x] Test old temporary routes (/accounts, /categories, /assets) redirect to 404
  - [x] Test nested route navigation
- [x] **Total tests**: 27 new tests (6 + 5 + 8 + 2 + 6)
**Manual Verification (User):** Navigate to /settings, see overview with two cards (Assets, Categories). Click Assets card → navigate to /settings/assets, see two tabs (Transactional, Manual), verify tab switching works. Click Transactional tab → see existing accounts with add/edit/delete functionality. Click Manual tab → see existing manual assets with add/edit/delete functionality. Click Categories in sidebar → navigate to /settings/categories, verify existing categories page works. Test on mobile → verify drawer opens/closes with menu button. Verify Settings button in Header highlights on all /settings/* routes. Try navigating to old routes /accounts, /categories, /assets → verify 404 page appears.

## Phase 10: Production Build, Testing & Polish (MVP)

**Requirements**: NFR-1 (Architecture), NFR-3 (Performance), NFR-4 (Usability), NFR-5 (Compatibility), NFR-6 (Reliability), NFR-7 (Maintainability)

**Goal**: Complete, polished, production-ready MVP

### 10.1 Integration Testing
- [ ] Test complete user workflows end-to-end
- [ ] Test data flow between stores and components
- [ ] Test interactions between different features
- [ ] Test budget tracking with actual transactions
- [ ] Test report calculations with real data

### 10.2 Cross-Feature Validation
- [ ] Test account deletion with existing transactions
- [ ] Test category deletion with existing transaction types
- [ ] Test transaction changes affecting account balances and budgets
- [ ] Test budget updates reflecting in reports
- [ ] Test data consistency across all features

### 10.3 Test Coverage Review
- [ ] Review unit test coverage from all phases
- [ ] Run `npm run test:coverage` to check coverage metrics
- [ ] Ensure minimum 80% code coverage across the codebase
- [ ] Add tests for any gaps in critical functionality
- [ ] **Test**: Coverage meets 80% threshold, all critical paths tested

### 10.4 UI/UX Polish
- [ ] Add loading states (spinners, skeletons)
- [ ] Add success/error snackbars for all operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add subtle animations and transitions
- [ ] Optimize responsive design (mobile, tablet, desktop)
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] **Test**: Smooth, professional user experience

### 10.5 Performance Optimization
- [ ] Profile app performance with React DevTools
- [ ] Optimize re-renders with React.memo, useMemo, useCallback
- [ ] Lazy load route components with React.lazy
- [ ] Test with large datasets (100+ transactions)
- [ ] **Test**: App is responsive and performant

### 10.6 Cross-Browser Testing
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Firefox
- [ ] Test on Safari (desktop & mobile)
- [ ] Test on Edge
- [ ] **Test**: App works consistently across all browsers

### 10.7 Production Build
- [ ] Configure webpack for production with code splitting
- [ ] Optimize bundle size
- [ ] Add source maps
- [ ] Test production build locally
- [ ] **Test**: Production build completes without errors, bundle size is reasonable

### 10.8 Deploy to Cloudflare Pages
- [ ] Create Cloudflare account (if not already)
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure build settings (build command: `npm run build`, output: `dist`)
- [ ] Add `_headers` file for security (CSP, X-Frame-Options)
- [ ] Add `_redirects` file for SPA routing (`/* /index.html 200`)
- [ ] Configure automatic deployment from main branch
- [ ] Deploy application
- [ ] **Test**: Visit deployed URL, test all features

### 10.9 Documentation
- [ ] Update README.md with setup instructions
- [ ] Add user guide or help section
- [ ] Document build/deployment process
- [ ] Add troubleshooting guide
- [ ] **Test**: New developer can follow README to set up project

### 10.10 Bug Fixes and Final Validation
- [ ] Fix any bugs discovered during testing
- [ ] Handle edge cases and null/undefined scenarios
- [ ] Validate data integrity across all operations
- [ ] **Test**: App is stable, no critical bugs, ready for users

### 9.4 Deploy to Cloudflare Pages
- [ ] Create Cloudflare account (if not already)
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Build output directory: `dist`
  - [ ] Node.js version: LTS (18 or 20)
- [ ] Add `_headers` file in `public/` for security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] Add `_redirects` file in `public/` for SPA routing (`/* /index.html 200`)
- [ ] Configure automatic deployment from main branch
- [ ] Configure preview deployments for pull requests
- [ ] Deploy application
- [ ] **Test**: Visit Cloudflare Pages URL, test all features, test on multiple browsers

### 9.5 Configure Custom Domain (Optional)
- [ ] Add custom domain in Cloudflare Pages dashboard
- [ ] Update DNS records
- [ ] Enable automatic HTTPS
- [ ] **Test**: App works on custom domain with HTTPS

## Phase 10: MVP Testing & Quality Assurance

**Requirements**: All MVP Functional Requirements, NFR-6 (Reliability), NFR-7 (Maintainability)

**Goal**: Comprehensive testing and validation of MVP

### 10.1 Integration Testing
- [ ] Test complete user workflows end-to-end
- [ ] Test data flow between stores and components
- [ ] Test interactions between different features
- [ ] Test budget tracking with actual transactions
- [ ] Test report calculations with real data

### 10.2 Cross-Feature Validation
- [ ] Test account deletion with existing transactions
- [ ] Test category deletion with existing transaction types
- [ ] Test transaction changes affecting account balances and budgets
- [ ] Test budget updates reflecting in reports
- [ ] Test data consistency across all features

### 10.3 Test Coverage Review
- [ ] Review unit test coverage from all phases
- [ ] Run `npm run test:coverage` to check coverage metrics
- [ ] Ensure minimum 80% code coverage across the codebase
- [ ] Add tests for any gaps in critical functionality
- [ ] **Test**: Coverage meets 80% threshold, all critical paths tested

### 10.4 UI/UX Polish
- [ ] Add loading states (spinners, skeletons)
- [ ] Add success/error snackbars for all operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add subtle animations and transitions
- [ ] Optimize responsive design (mobile, tablet, desktop)
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] **Test**: Smooth, professional user experience

### 10.5 Performance Optimization
- [ ] Profile app performance with React DevTools
- [ ] Optimize re-renders with React.memo, useMemo, useCallback
- [ ] Lazy load route components with React.lazy
- [ ] Test with large datasets (100+ transactions)
- [ ] **Test**: App is responsive and performant

### 10.6 Cross-Browser Testing
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Firefox
- [ ] Test on Safari (desktop & mobile)
- [ ] Test on Edge
- [ ] **Test**: App works consistently across all browsers

### 10.7 Production Build
- [ ] Configure webpack for production with code splitting
- [ ] Optimize bundle size
- [ ] Add source maps
- [ ] Test production build locally
- [ ] **Test**: Production build completes without errors, bundle size is reasonable

### 10.8 Deploy to Cloudflare Pages
- [ ] Create Cloudflare account (if not already)
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure build settings (build command: `npm run build`, output: `dist`)
- [ ] Add `_headers` file for security (CSP, X-Frame-Options)
- [ ] Add `_redirects` file for SPA routing (`/* /index.html 200`)
- [ ] Configure automatic deployment from main branch
- [ ] Deploy application
- [ ] **Test**: Visit deployed URL, test all features

### 10.9 Documentation
- [ ] Update README.md with setup instructions
- [ ] Add user guide or help section
- [ ] Document build/deployment process
- [ ] Add troubleshooting guide
- [ ] **Test**: New developer can follow README to set up project

### 10.10 Bug Fixes and Final Validation
- [ ] Fix any bugs discovered during testing
- [ ] Handle edge cases and null/undefined scenarios
- [ ] Validate data integrity across all operations
- [ ] **Test**: App is stable, no critical bugs, ready for users

---

# POST-MVP ENHANCEMENTS

These features will be implemented after the MVP is validated by users.

## Phase 11: Year Management & Multi-Year Support (Post-MVP)

**Requirements**: FR-6.10 (Auto-archive), FR-9.1-9.6 (Year Management & Multi-Year Support)

**Goal**: Implement auto-archive strategy to maintain optimal performance (~900 KB main file) while supporting decades of data through efficient multi-year architecture

**Architecture Context**: 
- Main file contains 2 most recent years (~900 KB with ~2000 transactions/year)
- Archive files created automatically for older years (user confirmation required)
- Archive references with year-end summaries stored in main file
- Quick trends use summaries (instant, no file loading)
- Detailed analysis loads archive files on-demand

### 11.1 Data Model Updates for Multi-Year Support (FR-6.10)
- [ ] Update `src/types/models.ts`:
  - [ ] Add `years` object structure: `{ "2025": { transactions, budgets, manualAssets }, "2026": {...} }`
  - [ ] Add `ArchivedYearReference` type: `{ year: number, fileName: string, archivedDate: string, summary: YearEndSummary }`
  - [ ] Add `YearEndSummary` type: `{ transactionCount: number, closingNetWorth: number, closingBalances: Record<string, number> }`
  - [ ] Add `archivedYears` array to main data structure
  - [ ] Add `ArchiveFile` type for self-contained archive structure
- [ ] Update `src/schemas/models.schema.ts`:
  - [ ] Add Zod schemas for new types
  - [ ] Validate years structure
  - [ ] Validate archive references
- [ ] **Write tests**: Schema validation for multi-year structure
- [ ] **Test**: Validate main file structure, archive reference structure

### 11.2 Archive Detection & Year-End Summary Service (FR-6.10, FR-9.2)
- [ ] Create `src/services/archive.service.ts`:
  - [ ] `detectArchiveTrigger()`: Check if 3+ years exist in main file
  - [ ] `calculateYearEndSummary(year)`: Compute transaction count, closing net worth, closing balances
  - [ ] `identifyArchivableYears()`: Return oldest years to archive (keep 2 most recent)
  - [ ] `shouldPromptArchive()`: Check archive trigger and user postpone preference
- [ ] Store postpone state in preferences
- [ ] **Write tests**: Archive detection, year-end summary calculations
- [ ] **Test**: Correct archive trigger with 3+ years, accurate summary calculations

### 11.3 Archive File Creation & Main File Update (FR-6.10, FR-9.2, FR-9.3)
- [ ] Implement `createArchiveFile(year)` in archive service:
  - [ ] Extract year data from main file
  - [ ] Create snapshot of accounts, categories, transaction types (state at archive time)
  - [ ] Build self-contained archive file structure
  - [ ] Generate archive file JSON
- [ ] Implement `updateMainFileAfterArchive(year, archiveReference)`:
  - [ ] Remove archived year from years object
  - [ ] Add archive reference to archivedYears array
  - [ ] Maintain data integrity
- [ ] Use File System Access API to save archive file (user selects location)
- [ ] **Write tests**: Archive file creation, main file update
- [ ] **Test**: Archive file is self-contained, main file correctly updated

### 11.4 Seamless Year Switching UI (FR-9.1)
- [ ] Create `src/components/common/YearSelector.tsx`:
  - [ ] Dropdown showing years in main file (instant switch)
  - [ ] Option to load archived years (file picker)
  - [ ] Badge indicating archived vs active years
  - [ ] Auto-switch to current year on app open
- [ ] Add to header/navigation
- [ ] Connect to app store (current year state)
- [ ] Implement instant year switching (in-memory, no file I/O)
- [ ] **Write tests**: Year selector component, switching logic
- [ ] **Test**: Switch between years instantly, UI updates correctly

### 11.5 Archive Workflow UI (FR-9.2)
- [ ] Create `src/components/common/ArchivePrompt.tsx`:
  - [ ] Dialog prompting to archive oldest year
  - [ ] Show year to archive and file size impact
  - [ ] "Archive Now", "Remind Later", "Don't Ask Again" options
  - [ ] File picker integration for archive save location
- [ ] Create banner reminder for postponed archives
- [ ] Trigger prompt on app load when archive conditions met
- [ ] Show success message with archive file name after creation
- [ ] **Write tests**: Archive prompt component, workflow states
- [ ] **Test**: Prompt appears correctly, postpone works, archive creation flow

### 11.6 Archive Loading & Management (FR-9.3)
- [ ] Implement `loadArchiveFile()` in archive service:
  - [ ] File picker to select archive file
  - [ ] Validate archive file structure
  - [ ] Load into temporary store (separate from main data)
  - [ ] Handle missing files gracefully (show error, allow browsing)
- [ ] Create `src/stores/useArchiveStore.ts`:
  - [ ] Store loaded archive data temporarily
  - [ ] Track which archives are currently loaded
  - [ ] Unload archives method (free memory)
- [ ] **Write tests**: Archive loading, validation, store management
- [ ] **Test**: Load archive file, validate structure, unload successfully

### 11.7 Quick Trends Dashboard (FR-9.4)
- [ ] Update `src/components/dashboard/Dashboard.tsx`:
  - [ ] Add "Year-over-Year Trends" section
  - [ ] Display net worth progression using archive summaries
  - [ ] Show "2023: $40k → 2024: $45k → 2025: $52k → 2026: $58k"
  - [ ] Use archivedYears array from main file (instant, no loading)
- [ ] Create `src/services/trend.service.ts`:
  - [ ] `calculateYearOverYearTrends()`: Use archive summaries
  - [ ] `getClosingBalanceTrends()`: Per-account trends
  - [ ] All calculations from summaries (no archive file loading)
- [ ] **Write tests**: Trend calculations from summaries
- [ ] **Test**: Dashboard shows trends instantly, no archive loading required

### 11.8 Detailed Multi-Year Analysis (FR-9.5)
- [ ] Create `src/components/reports/MultiYearAnalysis.tsx`:
  - [ ] "Load Archives" button to prompt for files
  - [ ] File picker to select multiple archive files
  - [ ] Load archives into temporary store
  - [ ] Generate comprehensive reports:
    - [ ] Month-by-month trends across all loaded years
    - [ ] Category breakdown spanning years
    - [ ] Account history with full transaction details
  - [ ] "Unload Archives" button to free memory
- [ ] Integrate with archive store
- [ ] Add to Reports page
- [ ] **Write tests**: Multi-year report generation, archive integration
- [ ] **Test**: Load multiple archives, generate detailed reports, unload successfully

### 11.9 Archive Utilities (FR-9.6)
- [ ] Create `src/components/settings/ArchiveManager.tsx`:
  - [ ] List archived years from archivedYears array
  - [ ] "Export Year" button (save current year as standalone archive)
  - [ ] "Import Year" button (load archive back into main file)
  - [ ] "Browse Archives" button (view available archive files)
  - [ ] User preference: years to keep in main file (default: 2)
- [ ] Implement export/import functionality in archive service
- [ ] Add to Settings page
- [ ] **Write tests**: Export year, import year, preferences
- [ ] **Test**: Export single year, import archived year, adjust preferences

### 11.10 Integration Testing
- [ ] Test complete archive workflow end-to-end:
  - [ ] Create 3 years of data
  - [ ] Trigger archive prompt
  - [ ] Archive oldest year
  - [ ] Verify main file size reduced (~900 KB)
  - [ ] Verify quick trends work without loading
  - [ ] Load archive for detailed analysis
  - [ ] Unload archive
- [ ] Test year switching with archived years
- [ ] Test data integrity across main file and archives
- [ ] **Test**: All workflows complete successfully, no data loss

### 11.11 Performance Validation
- [ ] Measure auto-save performance with 2-year main file (~900 KB)
- [ ] Verify auto-save completes under 200ms
- [ ] Test with 10+ archived years (simulating long-term use)
- [ ] Verify quick trends remain instant regardless of archive count
- [ ] Validate memory usage during archive loading/unloading
- [ ] **Test**: Performance targets met, scalable to decades of data

### 10.1 Integration Testing
- [ ] Test complete user workflows end-to-end
- [ ] Test data flow between stores and components
- [ ] Test interactions between different features
- [ ] Test year switching with data dependencies

### 10.2 Cross-Feature Validation
- [ ] Test account deletion with existing transactions
- [ ] Test category deletion with existing transaction types
- [ ] Test transaction changes affecting account balances
- [ ] Test data consistency across all features

### 10.3 Data Persistence Integration
- [ ] Test complete save/load workflows with local files
- [ ] Test data integrity across multiple year files
- [ ] Test with large datasets (100+ transactions)
- [ ] **Test**: No data loss in any scenario

### 10.4 Test Coverage Review
- [ ] Review unit test coverage from all phases
- [ ] Run `npm run test:coverage` to check coverage metrics
- [ ] Ensure minimum 80% code coverage across the codebase
- [ ] Add tests for any gaps in critical functionality
- [ ] **Test**: Coverage meets 80% threshold, all critical paths tested

### 10.5 Bug Fixes and Edge Cases
- [ ] Fix any bugs discovered during testing
- [ ] Handle null/undefined edge cases
- [ ] Test with extreme values and edge cases
- [ ] **Test**: App is stable and handles errors gracefully

## Phase 11: UI/UX Polish (MVP)

**Requirements**: NFR-4 (Usability), NFR-3 (Performance)

**Goal**: Professional, polished user experience for MVP

### 11.1 Add Loading States
- [ ] Create `src/components/common/LoadingSpinner.tsx`
- [ ] Create `src/components/common/SkeletonLoader.tsx`
- [ ] Create `src/components/common/LoadingOverlay.tsx`
- [ ] Add loading states to all async operations
- [ ] **Test**: Verify smooth loading experience

### 11.2 Add Feedback & Confirmations
- [ ] Add success snackbars for all CRUD operations
- [ ] Create `src/components/common/ConfirmDialog.tsx`
- [ ] Add delete confirmations
- [ ] Add subtle animations
- [ ] **Test**: Verify user gets clear feedback for all actions

### 11.3 Improve Responsive Design
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test on tablets (iPad)
- [ ] Optimize touch targets
- [ ] **Test**: Full app works well on all screen sizes

### 11.4 Add Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation (Tab, Enter, ESC)
- [ ] Add focus indicators
- [ ] Ensure proper heading hierarchy
- [ ] **Test**: Navigate app with keyboard only

### 11.5 Performance Optimization
- [ ] Profile app performance with React DevTools
- [ ] Optimize re-renders with React.memo, useMemo, useCallback
- [ ] Lazy load route components with React.lazy
- [ ] **Test**: App is responsive and performant with large datasets

### 11.6 Final Cross-Browser Testing
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Firefox
- [ ] Test on Safari (desktop & mobile)
- [ ] Test on Edge
- [ ] **Test**: App works consistently across all browsers

---

# POST-MVP ENHANCEMENTS

These features will be implemented after the MVP is validated by users.

## Phase 12: Quick Transaction Entry Enhancement (Post-MVP)

**Requirements**: FR-1 (Transaction Management - Quick Entry)

**Goal**: Add a quick entry row at the top of TransactionsPage for rapid transaction entry without opening dialogs

### 12.1 Add Quick Entry Row to TransactionsPage
- [x] Create `src/components/transactions/QuickEntryRow.tsx`:
  - [x] Compact form row with essential fields: Amount, Date, Transaction Type, From/To Accounts, Notes
  - [x] Always visible at top of transaction list (no toggle needed)
  - [x] Pre-filled with smart defaults:
    - [x] Date: today
    - [x] Transaction type: last used type
    - [x] Account: last used account
  - [x] Conditional fields based on transaction type (same logic as TransactionForm)
  - [x] Auto-complete dropdowns for transaction types and accounts
  - [x] Real-time validation (same as TransactionForm)
- [x] Add QuickEntryRow to TransactionsPage above TransactionList
- [x] **Write tests**: QuickEntryRow rendering, conditional fields, defaults (15 tests)
- [x] **Test**: View transactions page, see quick entry row at top, verify fields show/hide based on type

### 12.2 Add Keyboard Support for Quick Entry
- [x] Enter key submits form and clears for next entry:
  - [x] Focus returns to amount field after submit
  - [x] Last used type and account remain selected for rapid similar entries
  - [x] Date increments to today if previously set to past date
- [x] Tab key navigates between fields (standard browser behavior)
- [x] Escape key clears the quick entry form
- [x] Show success snackbar on submit (brief, non-intrusive)
- [x] Arrow keys navigate between fields (up/down to move through form)
- [x] Alphabetical keys start search in dropdown fields for quick selection
- [x] **Write tests**: Enter key submit, Tab navigation, Escape clear, focus management, arrow key navigation, dropdown search
- [x] **Test**: Add 10+ transactions using only keyboard (Tab + Enter), verify rapid entry flow

**Manual Verification (User):** Add 10+ transactions using only Enter key for rapid entry, verify form clears after submit, press Escape to clear form, use Tab/Arrow keys to navigate between fields, verify all transactions saved correctly, test search in dropdowns by typing letters.

## Phase 13: Manual Asset Value Tracking (Post-MVP)

**Requirements**: FR-3.6 (Manual asset value tracking over time)

**Goal**: Track and visualize manual asset values over time to monitor growth and depreciation

**Note**: Transactional account balances are automatically calculated from transaction history, so no separate balance tracking is needed for accounts (FR-3.4). This phase focuses only on manual assets.

### 13.1 Update Asset Value Workflow
- [x] Update `src/types/models.ts`:
  - [x] Add `AssetValueHistory` type: `{ date: string, value: number, notes?: string }`
  - [x] Add `valueHistory?: AssetValueHistory[]` to ManualAsset type
  - [x] Keep existing `value` and `valuationDate` fields as "current value"
- [x] Update `src/schemas/models.schema.ts`:
  - [x] Add Zod schema for AssetValueHistory
  - [x] Validate history entries (dates in chronological order, non-negative values)
  - [x] Ensure history dates are before or equal to current valuationDate
- [x] Create `src/services/history.service.ts`:
  - [x] `updateAssetValue(assetId, newValue, newDate, notes)`: 
    - [x] Move current value/date to valueHistory array
    - [x] Set new value as current value/valuationDate
    - [x] Return updated asset
- [x] Update `useAssetStore`:
  - [x] Add `updateAssetValue` action that calls history service
  - [x] Maintain valueHistory array when updating values
- [x] Update `ManualAssetDialog.tsx` to show "Update Value" workflow:
  - [x] Add checkbox/toggle: "Update existing value" vs "Create new asset"
  - [x] When updating: show current value and date (read-only)
  - [x] Input for new value, new date (defaults to today), optional notes
  - [x] On submit: old value moves to history, new value becomes current
  - [x] Show confirmation message: "Value updated. Previous value ($X on DATE) saved to history."
- [x] Update `ManualAssetCard.tsx`:
  - [x] Add "Update Value" button next to "Edit" button
  - [x] Opens ManualAssetDialog in "update value" mode
- [x] **Write tests**: Schema validation, updateAssetValue service, store action, dialog update mode
- [x] **Test**: Create asset with $500k value, click "Update Value", enter $510k → verify current value is $510k, old $500k in valueHistory

**Manual Verification (User):** Create manual asset "House - $500,000" on Jan 1, 2026. Click "Update Value" button on the card, enter new value $510,000 with date Apr 1, 2026, add note "Market appraisal". Submit and verify card now shows $510,000 as current value. Verify confirmation message mentions old value saved to history.

### 13.2 Asset Value History in Reports
- [ ] Add to `src/services/history.service.ts`:
  - [ ] `getCompleteValueHistory(assetId)`: Get all values including current (for charts)
  - [ ] `recordHistoricalValue(assetId, date, value, notes)`: Add historical value directly (for backdating)
  - [ ] `editHistoricalValue(assetId, historyIndex, date, value, notes)`: Edit specific historical entry
  - [ ] `deleteHistoricalValue(assetId, historyIndex)`: Remove specific historical entry
  - [ ] `calculateAssetValueGrowth(assetId, startDate, endDate)`: Calculate growth percentage
- [ ] Update `useAssetStore`:
  - [ ] Add actions for managing historical values
  - [ ] Ensure history array stays sorted by date
- [ ] Update `src/components/reports/BalanceSheet.tsx`:
  - [ ] Make manual asset items clickable
  - [ ] Add expand/collapse indicator icon
  - [ ] On click, expand inline to show:
    - [ ] Line chart showing value over time (valueHistory + current value)
    - [ ] Compact date range selector (Last 3 months, 6 months, 1 year, All time)
    - [ ] Growth percentage badge (total growth since first value)
    - [ ] "Manage History" button to open detailed dialog
  - [ ] Collapse other expanded assets when opening new one
- [ ] Create `src/components/assets/AssetValueHistoryDialog.tsx`:
  - [ ] Opens from "Manage History" button in Balance Sheet
  - [ ] Header showing asset name and current value prominently
  - [ ] Full-size line chart with complete timeline
  - [ ] Date range selector for chart
  - [ ] Growth metrics section:
    - [ ] Total growth percentage (first value to current)
    - [ ] Year-over-year growth (if applicable)
  - [ ] "Historical Values" table:
    - [ ] Columns: Date, Value, Change, Notes, Actions
    - [ ] Show value changes between entries
    - [ ] Edit/delete buttons for each historical entry
    - [ ] Current value shown in table header (not editable here)
  - [ ] "Add Historical Value" button:
    - [ ] Opens form to add backdated value
    - [ ] Date picker, value input, notes
    - [ ] Validation: date must be before current valuationDate
- [ ] **Write tests**: Expandable asset items in Balance Sheet, inline chart rendering, dialog with full history management, add/edit/delete historical values
- [ ] **Test**: Click asset in Balance Sheet to see inline chart, verify growth percentage, click "Manage History" to open full dialog, add backdated value, edit/delete entries

**Manual Verification (User):** With asset from 13.1 (now has Jan $500k in history, current Apr $510k), navigate to Reports → Balance Sheet. Click on "House" asset item in manual assets section. Verify: (1) Inline chart expands showing 2 points (Jan: $500k, Apr: $510k), (2) Growth badge shows +2% or $10k, (3) Click "Manage History" button to open full dialog, (4) Dialog shows complete chart and historical table, (5) Click "Add Historical Value", enter Feb 15, 2026 with $505,000 → verify chart in both inline view and dialog updates to show 3 points. Edit Jan value to $495,000 in the dialog → verify changes reflected everywhere. Close dialog and collapse inline chart → click asset again to verify chart still shows updated data.

### 13.3 Account Balance Chart (Optional UI Enhancement)
- [ ] Add to `src/services/history.service.ts`:
  - [ ] `calculateAccountBalanceHistory(accountId, startDate, endDate)`: Calculate daily/monthly balances from transactions
  - [ ] `getAccountBalanceAtDate(accountId, date)`: Get balance at specific date
- [ ] Create `src/components/accounts/AccountBalanceChart.tsx`:
  - [ ] Line chart showing balance over time calculated from transactions
  - [ ] Date range selector (Last 30 days, 3 months, 6 months, 1 year, All time)
  - [ ] Read-only view (no manual entries - calculated from transactions)
  - [ ] Show transaction markers on hover
  - [ ] Growth/change metrics (start balance → end balance)
- [ ] Create `src/components/accounts/AccountHistoryDialog.tsx`:
  - [ ] Wrapper dialog for AccountBalanceChart
  - [ ] Shows account name and current balance
  - [ ] Note explaining balance is calculated from transactions
- [ ] Update `AccountCard.tsx`:
  - [ ] Add "View Balance History" button
  - [ ] Opens AccountHistoryDialog
- [ ] **Write tests**: Balance calculation from transactions, chart rendering, date range filtering
- [ ] **Test**: Create account, add multiple transactions over time, view balance chart, verify calculations match expected balances

**Manual Verification (User):** With existing account that has multiple transactions, click "View Balance History" button. Verify: (1) Chart shows balance progression over time, (2) Balance matches what you expect from transactions, (3) Date range selector changes chart view, (4) Current balance at top matches account card. Add new transaction → verify balance chart updates automatically (no manual history entry needed).

### 13.4 Net Worth History Dashboard Widget
- [ ] Create `src/components/charts/NetWorthHistoryChart.tsx`:
  - [ ] Combined chart showing total net worth over time
  - [ ] Stacked area chart option breaking down by asset type
  - [ ] Account balances calculated from transactions
  - [ ] Manual asset values from recorded history (valueHistory + current)
  - [ ] Interactive tooltips showing breakdown at each date
  - [ ] Date range selector
  - [ ] Toggle between total line chart and stacked area chart
- [ ] Update `src/components/dashboard/DashboardPage.tsx`:
  - [ ] Add "Net Worth History" section (below financial summary)
  - [ ] Optional: collapsible or toggle to show/hide
  - [ ] Integrate NetWorthHistoryChart component
- [ ] **Write tests**: Chart data aggregation (accounts + manual assets), stacking, date filtering, tooltip data
- [ ] **Test**: View dashboard net worth chart, verify it combines account balances and manual asset values correctly

**Manual Verification (User):** With accounts (with transactions) and manual assets (with value history), view dashboard. Verify: (1) Net Worth History chart appears, (2) Chart shows progression over time, (3) Stacked view shows breakdown by asset types, (4) Hover tooltips show account balances + manual asset values at that date, (5) Date range selector works, (6) Total matches current net worth shown in summary card.

### 13.5 Historical Balance Sheet Comparison
- [ ] Update `src/services/history.service.ts`:
  - [ ] `getBalanceSheetAtDate(date)`: Calculate complete balance sheet for specific date
    - [ ] Account balances from transaction history up to that date
    - [ ] Manual asset values from history at that date
  - [ ] `compareBalanceSheets(date1, date2)`: Return changes between two dates
- [ ] Update `src/components/reports/BalanceSheet.tsx`:
  - [ ] Add "Compare with Previous Period" toggle/checkbox
  - [ ] When enabled, show second date picker
  - [ ] Display both columns: "As of [Date1]" and "As of [Date2]"
  - [ ] Add "Change" column showing:
    - [ ] Absolute change ($)
    - [ ] Percentage change (%)
    - [ ] Color coding: green for positive, red for negative
  - [ ] Highlight significant changes (>10% or >$1,000)
  - [ ] Show net worth change at bottom
- [ ] **Write tests**: Historical balance calculation, comparison logic, change highlighting, rendering
- [ ] **Test**: View balance sheet, enable comparison, select two dates, verify changes calculated correctly

**Manual Verification (User):** Navigate to Reports → Balance Sheet. Select date "January 1, 2026", enable "Compare with Previous Period", select second date "April 1, 2026". Verify: (1) Two columns appear with balances at each date, (2) Change column shows differences, (3) Account balances match transaction history at each date, (4) Manual asset values match recorded values at each date, (5) Net worth change is correct, (6) Large changes are highlighted. Try comparing month-over-month, quarter-over-quarter.

### 13.6 Integration Testing & Polish
- [ ] Test complete asset value tracking workflow:
  - [ ] Create manual asset
  - [ ] Update value multiple times
  - [ ] View history dialog with chart
  - [ ] Add backdated historical value
  - [ ] Edit and delete historical values
  - [ ] Verify chart updates correctly
  - [ ] Calculate growth percentages
- [ ] Test account balance history (optional):
  - [ ] Create account, add transactions
  - [ ] View balance chart
  - [ ] Verify calculations match transaction history
- [ ] Test net worth history dashboard:
  - [ ] Verify combines accounts and manual assets
  - [ ] Test with multiple asset types
  - [ ] Verify date range filtering
- [ ] Test historical balance sheet:
  - [ ] Compare different time periods
  - [ ] Verify account balances calculated correctly
  - [ ] Verify manual asset values retrieved correctly
  - [ ] Test highlighting and change calculations
- [ ] Test with large datasets:
  - [ ] Manual asset with 50+ historical values
  - [ ] Account with 100+ transactions
  - [ ] Verify chart performance
- [ ] Polish and error handling:
  - [ ] Add loading states for chart rendering
  - [ ] Handle edge cases (no history, single value)
  - [ ] Add helpful empty states
  - [ ] Ensure date validations work
- [ ] **Test**: All history features work end-to-end, no data loss, charts perform well

**Manual Verification (User):** Perform complete workflow: (1) Create house asset $500k Jan 1, (2) Update to $510k Apr 1, (3) View history and add backdated Feb value $505k, (4) Edit Jan value to $495k, (5) View dashboard net worth history showing progression, (6) Create bank account and add transactions, (7) View account balance chart, (8) Go to balance sheet and compare Jan 1 vs Apr 1, (9) Verify all values match expectations across all features. Test with real data for several months to verify production readiness.

## Phase 15: App Preferences & Settings (Post-MVP)

**Requirements**: User preferences and app configuration

**Goal**: Users can customize app settings and preferences

### 15.1 Create Preferences Page
- [ ] Create `src/components/settings/PreferencesPage.tsx`:
  - [ ] Default currency selection
  - [ ] Date format preferences (MM/DD/YYYY vs DD/MM/YYYY)
  - [ ] Number format (comma vs period separator)
  - [ ] Theme selection (light/dark mode)
  - [ ] Language selection (future internationalization)
- [ ] Add preferences to useAppStore or create usePreferencesStore
- [ ] Store preferences in localStorage
- [ ] Apply preferences across the app
- [ ] Add preferences route to /settings/preferences
- [ ] Update SettingsLayout sidebar to include Preferences item
- [ ] **Write tests**: Preferences page, store, localStorage persistence
- [ ] **Test**: Change preferences and verify they persist across page reloads

## Phase 16: Settings & Data Management Feature (Post-MVP)

**Requirements**: Data Import/Export

**Goal**: Users can manage app settings and advanced data operations

### 16.1 Build Settings UI
- [ ] Create `src/components/settings/DataManagement.tsx` with import/export
- [ ] Create `src/components/settings/SettingsPage.tsx`
- [ ] Add route `/settings`
- [ ] **Test**: Export all data, import data, clear data

## Phase 17: Conflict Detection & Auto-Merge (Post-MVP)

**Requirements**: FR-10 (Advanced Data Management), NFR-9 (Advanced Reliability)

**Goal**: Intelligent conflict detection and automatic merging for concurrent modifications

**Conflict Detection:**
- [ ] Add conflict detection to `src/services/sync.service.ts`:
  - [ ] Create `calculateMD5Hash()` utility function using Web Crypto API
  - [ ] Store file content hash when loading file in `useAppStore`
  - [ ] Store original loaded data as base version for three-way merge
  - [ ] Before saving, detect conflicts by:
    - [ ] Re-reading the current file content
    - [ ] Calculating MD5 hash of current file
    - [ ] Comparing with stored hash from load time
  - [ ] If hashes differ, trigger auto-merge flow
  - [ ] Handle file not found/deleted scenarios
  - [ ] Handle permission errors gracefully
- [ ] Add conflict metadata to `useAppStore`:
  - [ ] `fileContentHash: string | null` - MD5 hash of loaded file
  - [ ] `fileLoadedAt: string | null` - ISO timestamp when file was loaded
  - [ ] `baseVersion: DataFile | null` - Original loaded data for three-way merge

**Three-Way Merge Algorithm:**
- [ ] Create `src/services/merge.service.ts` with entity-level merge logic:
  - [ ] Implement `performThreeWayMerge(base, fileVersion, appVersion)`:
    - [ ] Compare each entity collection (accounts, transactions, categories, etc.)
    - [ ] For each entity ID:
      - [ ] **New in file only** → include from file
      - [ ] **New in app only** → include from app
      - [ ] **Exists in both:**
        - [ ] If unchanged in app → use file version (file wins)
        - [ ] If unchanged in file → use app version (app wins)
        - [ ] If changed in both → check field-level changes:
          - [ ] Different fields changed → merge both changes (auto-merge)
          - [ ] Same fields changed to same value → use either
          - [ ] Same fields changed to different values → flag as conflict
      - [ ] **Deleted in file, modified in app** → flag as conflict
      - [ ] **Deleted in app, modified in file** → flag as conflict
      - [ ] **Deleted in both** → remove from result
  - [ ] Return merge result: `{ merged: DataFile, conflicts: Conflict[] }`
  - [ ] Create `Conflict` type with entity information and conflict details
  - [ ] Implement field-level comparison for entities
  - [ ] Special handling for computed fields (balances, totals)

**Data Consistency Validation:**
- [ ] Add data consistency validation functions
- [ ] Check account balances match transaction history
- [ ] Verify all references are valid
- [ ] Offer auto-fix options where possible

**Merge Preview UI:**
- [ ] Create `src/components/common/MergePreviewDialog.tsx`:
  - [ ] Show merge preview with tabs for different sections
  - [ ] Display auto-merged changes
  - [ ] Interactive resolution for conflicts
  - [ ] Validation warnings with auto-fix options

**Integration:**
- [ ] Update `saveNow()` in sync.service to use merge logic
- [ ] Handle auto-save with conflict detection
- [ ] Never auto-save with unresolved conflicts

**Testing:**
- [ ] Test MD5 hash calculation
- [ ] Test three-way merge scenarios
- [ ] Test conflict detection and resolution
- [ ] Integration tests with concurrent modifications

## Phase 15: User Documentation (Post-MVP)

**Requirements**: NFR-4 (Usability)

**Goal**: Complete user documentation

### 15.1 Add User Documentation
- [ ] Add help tooltips in UI for complex features
- [ ] Create FAQ section in settings or help page
- [ ] Create user guide (optional) with screenshots
- [ ] **Test**: New user can understand how to use each feature

## Phase 16: Advanced Error Handling & Validation (Post-MVP)

**Requirements**: NFR-6 (Reliability), NFR-4 (Usability)

**Goal**: Enhanced error handling and validation

### 16.1 Add Error Boundary
- [ ] Create `src/components/common/ErrorBoundary.tsx`
- [ ] Create `src/components/common/ErrorMessage.tsx`
- [ ] Create `src/components/common/NotificationSnackbar.tsx`
- [ ] Wrap major sections in error boundaries
- [ ] **Test**: Simulate errors, verify user sees helpful messages

### 16.2 Enhanced Validation
- [ ] Add comprehensive Zod validation to all forms
- [ ] Validate business rules
- [ ] Prevent deletion of referenced entities
- [ ] Add user-friendly error messages
- [ ] **Test**: Try to submit invalid data, try to delete referenced entities

## Phase 17: Cloud Storage Integration (Post-MVP, Optional)

**Requirements**: FR-11 (Cloud Storage Integration), NFR-8 (Cloud Security)

**Goal**: Add optional cloud storage providers (OneDrive, Google Drive) for users who want automatic sync

**Important**: This phase is completely optional. The app is fully functional with local storage. This phase adds cloud sync as an opt-in feature.

**Note on Authentication**: Authentication is NOT implemented by Money Tree. It is provided by the cloud storage provider's SDK. Money Tree simply integrates these SDKs to enable file access.

### 19.1 Implement OneDrive Storage Provider
- [ ] Install dependencies: `@azure/msal-browser`, `@microsoft/microsoft-graph-client`
- [ ] Create `src/services/storage/OneDriveStorageProvider.ts` implementing IStorageProvider
- [ ] Integrate `@azure/msal-browser` for authentication (handled by Microsoft's SDK)
- [ ] Implement OneDrive file operations using Microsoft Graph API
- [ ] Add error handling and retry logic
- [ ] **Write tests**: Test OneDrive operations (with mocks)
- [ ] **Test**: Can authenticate with Microsoft (via their SDK), can save/load files from OneDrive

### 18.2 Add Storage Provider Selector
- [ ] Create UI in Settings to select storage provider (Local, OneDrive, Google Drive)
- [ ] Update StorageFactory to switch between providers based on user preference
- [ ] Add "Connect to OneDrive" button that triggers MSAL authentication
- [ ] Store provider preference in localStorage
- [ ] Show current provider and connection status in UI
- [ ] **Test**: Can switch between local and OneDrive storage, authentication works

### 18.3 Implement Auto-Sync for Cloud Storage
- [ ] Add automatic sync on data changes (debounced) for cloud providers
- [ ] Show sync status in UI (syncing, synced, error, offline)
- [ ] Add offline support with conflict resolution
- [ ] Add "Force Sync" button for manual sync
- [ ] **Write tests**: Test auto-sync, offline queue, conflict resolution
- [ ] **Test**: Changes auto-sync to OneDrive, offline changes sync when reconnected

### 18.4 Add Google Drive Provider (Optional)
- [ ] Install Google Drive API dependencies
- [ ] Create `src/services/storage/GoogleDriveStorageProvider.ts` implementing IStorageProvider
- [ ] Integrate Google Sign-In SDK for authentication (handled by Google's SDK)
- [ ] Implement Google Drive file operations
- [ ] Add Google Drive to storage provider selector
- [ ] **Write tests**: Test Google Drive operations (with mocks)
- [ ] **Test**: Can save/load files from Google Drive

### 18.5 Documentation and Migration
- [ ] Update README with cloud storage setup instructions
- [ ] Document OneDrive setup (Azure AD app registration)
- [ ] Document Google Drive setup (Google Cloud Console setup)
- [ ] Add migration guide: how to move from local to cloud storage
- [ ] Add FAQ about authentication requirements
- [ ] **Test**: Users can migrate their local data to cloud storage

---

## MVP Completion Checklist

- [ ] All MVP phases (1-10) completed
- [ ] All MVP features implemented and tested:
  - [ ] Transaction Management
  - [ ] Account Management
  - [ ] Category & Transaction Type Management
  - [ ] Dashboard with Quick Entry
  - [ ] Financial Reports (Balance Sheet, Cash Flow)
  - [ ] Budget Planning & Review
- [ ] All tests passing with 80%+ coverage
- [ ] Documentation complete
- [ ] Production build deployed
- [ ] No critical bugs
- [ ] App is usable for daily personal finance tracking with budgeting and reporting
  - [ ] Category & Transaction Type Management
  - [ ] Dashboard with Quick Entry
  - [ ] Financial Reports (Balance Sheet, Cash Flow)
  - [ ] Budget Planning & Review
- [ ] All tests passing with 80%+ coverage
- [ ] Documentation complete
- [ ] Production build deployed
- [ ] No critical bugs
- [ ] App is usable for daily personal finance tracking with budgeting and reporting

## Post-MVP Completion Checklist

- [ ] Year management and multi-year support complete
- [ ] Account overview report with multi-year view
- [ ] Settings and advanced data management
- [ ] Conflict detection and auto-merge complete
- [ ] User documentation and error handling enhanced
- [ ] All enhancements tested
- [ ] Optional: Cloud storage integration complete

---

## Notes for AI Implementation

**MVP Priority:**
- Focus on completing MVP (Phases 1-11) first
- MVP should be fully functional and deployable
- Users can track finances completely with MVP features
- Post-MVP features are enhancements, not requirements

**Verification Methods:**
- Run `npm run build` - should complete without errors
- Run `npm run lint` - should pass without errors
- Run `npm test` - all tests should pass
- Run `npm test -- --coverage` - should meet 80% threshold
- Run `npm start` - app should load in browser
- Test each feature manually in the browser
- Check browser console for errors
- Test with sample data

**Best Practices:**
- Commit after each completed step
- Test thoroughly before moving to next step
- Keep components small and focused
- Follow TypeScript strict mode
- Use Material-UI components consistently
- Handle errors gracefully
- Provide user feedback for all actions

**Common Issues to Watch For:**
- TypeScript type errors
- Missing dependencies
- Incorrect import paths
- Zustand store not updating UI
- Date timezone issues
- Decimal precision in calculations
- Race conditions in async operations

