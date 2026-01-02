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
- **FR-10**: Advanced Data Management → Phase 13 (Post-MVP)
- **FR-11**: Cloud Storage Integration → Phase 16+ (Post-MVP, Optional)

**MVP Non-Functional Requirements:**
- **NFR-1**: Architecture → Phase 1, 9
- **NFR-2**: Technology Stack → Phase 1, 2
- **NFR-3**: Performance → Phase 10
- **NFR-4**: Usability → Phase 6, 8, 10
- **NFR-5**: Compatibility → Phase 9, 10
- **NFR-6**: Reliability → Phase 2, 10
- **NFR-7**: Maintainability → Phase 1, 10

**Post-MVP Non-Functional Requirements:**
- **NFR-8**: Cloud Security → Phase 16+ (Post-MVP, Optional)
- **NFR-9**: Advanced Reliability → Phase 13 (Post-MVP)

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
- [ ] Create `src/components/budgets/PeriodSelector.tsx`:
  - [ ] Dropdown with options: specific months (Jan 2026, Feb 2026), quarters (Q1 2026), years (2026), custom date range
  - [ ] Default to current month
- [ ] Update BudgetsPage to use PeriodSelector:
  - [ ] Pass selected period to progress calculations
  - [ ] Prorate all budgets based on selected period length
  - [ ] Calculate actual spending for selected period only
  - [ ] Filter and show only budgets active during selected period
- [ ] Update progress display logic:
  - [ ] Monthly budget viewed as quarterly → multiply by 3
  - [ ] Quarterly budget viewed as monthly → divide by 3
  - [ ] Yearly budget viewed as monthly → divide by 12
  - [ ] Show prorated amount with period indicator
  - [ ] Handle partial overlaps: if budget is only active for 2 months of Q1, prorate accordingly
- [ ] **Write tests**: PeriodSelector.test.tsx, proration for different period combinations, partial period calculations
**Manual Verification (User):** With existing budgets (including date-ranged ones), navigate to /budgets. Use period selector to switch between January 2026, Q1 2026, and 2026. Verify budget amounts prorate correctly (e.g., Groceries $400/month shows as $1,200 for Q1, $4,800 for year). Verify only relevant budgets show (Rent $1500 shows in Jan-Jun view, Rent $1600 shows in Jul-Dec view). Verify partial overlaps calculate correctly (budget active 2 of 3 months in quarter shows 2/3 of prorated amount).

## Phase 8: Dashboard with Quick Transaction Entry (MVP)

**Requirements**: FR-5 (Dashboard & Quick Entry), FR-1 (Transaction Management)

**Goal**: Users see a summary dashboard with inline transaction entry

### 8.1 Build Dashboard Widgets
- [ ] Create `src/components/dashboard/StatsCard.tsx`
- [ ] Create `src/components/dashboard/RecentTransactions.tsx`
- [ ] Create `src/components/dashboard/AccountSummary.tsx`
- [ ] Create `src/components/dashboard/QuickAddTransaction.tsx` - Inline transaction entry form:
  - [ ] Always visible at top of dashboard (no button click required)
  - [ ] Essential fields: Amount, Date, Transaction Type, Account(s)
  - [ ] Auto-save on submit or Enter key
  - [ ] Clears form after successful submission
  - [ ] Optional: "More Details" link to open full TransactionDialog for complex transactions
- [ ] **Write tests**: Dashboard widget component tests
**Manual Verification (User):** Test each widget individually with sample data, verify stats display correctly, check recent transactions list updates, test account summary shows all accounts.

### 8.2 Create Dashboard Page
- [ ] Create `src/components/dashboard/DashboardPage.tsx`
- [ ] Place QuickAddTransaction form prominently at the top
- [ ] Integrate remaining widgets below in responsive grid
- [ ] Add route `/` (Dashboard)
- [ ] Update navigation to default to dashboard
- [ ] **Write tests**: Dashboard page integration tests
**Manual Verification (User):** Open dashboard at /, immediately start typing in quick add form, add transaction using Enter key, verify form clears and transaction appears in recent list, check all widgets display with proper layout, test responsive grid on mobile.

## Phase 9: Navigation & Routing (MVP)

**Requirements**: NFR-4 (Usability - navigation), NFR-5 (Compatibility - responsive)

**Goal**: Complete navigation experience

### 9.1 Complete Routing Setup
- [ ] Install `react-router-dom`
- [ ] Create `src/routes.tsx` with route definitions for all MVP pages:
  - [ ] `/` - Dashboard
  - [ ] `/accounts` - Accounts
  - [ ] `/categories` - Categories
  - [ ] `/transactions` - Transactions
  - [ ] `/reports` - Reports
  - [ ] `/budgets` - Budgets
- [ ] Wrap app with BrowserRouter
- [ ] Create 404 page
- [ ] **Write tests**: Route navigation tests
**Manual Verification (User):** Navigate directly to each URL (/, /accounts, /categories, etc.), verify correct page loads, test 404 page with invalid URL, check browser back/forward buttons work correctly.

### 9.2 Complete Navigation
- [ ] Update Header with navigation links for all MVP pages
- [ ] Add icons for each section
- [ ] Add active state styling
- [ ] Add mobile responsive menu (drawer)
- [ ] **Write tests**: Header navigation tests
**Manual Verification (User):** Click each navigation link in Header, verify active state highlights current page, test on mobile to see drawer menu, verify all icons display correctly, check keyboard navigation works.

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

**Requirements**: FR-9 (Year Management & Multi-Year Support)

**Goal**: Users can manage multiple years and analyze data across years

### 11.1 Implement Year Switching
- [ ] Create `src/components/common/YearSelector.tsx`
- [ ] Add to header/navigation
- [ ] Connect to app store
- [ ] Implement year switching logic (load different file)
- [ ] Handle year transitions (carry forward balances)
- [ ] **Write tests**: Year switching and data isolation
- [ ] **Test**: Switch years, add transactions in different years, verify data isolation

### 11.2 Multi-Year Data Loading
- [ ] Implement multi-year file loading
- [ ] Create aggregation service for cross-year data
- [ ] Memory-efficient handling of large datasets
- [ ] **Write tests**: Multi-year data loading and aggregation
- [ ] **Test**: Load multiple year files, aggregate data

### 11.3 Cross-Year Analysis Features
- [ ] Create `src/components/reports/MultiYearComparison.tsx`
- [ ] Year-over-year comparison charts
- [ ] Long-term trend analysis
- [ ] Net worth progression over years
- [ ] **Write tests**: Cross-year calculations
- [ ] **Test**: View trends across multiple years

### 11.4 Account Overview Report (Multi-Year)
- [ ] Create `src/components/reports/AccountOverview.tsx`:
  - [ ] Account transaction history
  - [ ] Balance over time chart (multi-year)
  - [ ] Filter and search transactions
  - [ ] Export account statement
- [ ] Add to Reports page
- [ ] **Write tests**: Account overview with multi-year data
- [ ] **Test**: View individual account history across years

### 11.5 Historical Analysis
- [ ] Search transactions across all years
- [ ] Category spending trends over multiple years
- [ ] Income and expense patterns year-over-year
- [ ] **Write tests**: Historical analysis queries
- [ ] **Test**: Search across years, view long-term trends

## Phase 13: Conflict Detection & Auto-Merge (Post-MVP)
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

## Phase 12: Bulk Transaction Entry (Post-MVP)

**Requirements**: FR-1 (Transaction Management - Bulk Entry)

**Goal**: Enhance existing TransactionsPage to support efficient bulk entry directly in the transaction list

### 12.1 Enhance Transaction List for Inline Editing
- [ ] Update `src/components/transactions/TransactionList.tsx` to support inline editing mode
- [ ] Add "Edit Mode" toggle button to TransactionsPage header
- [ ] Convert list items to editable cells when in edit mode
- [ ] Add inline cell editors for each field:
  - [ ] Date cell with date picker
  - [ ] Amount cell with numeric input
  - [ ] Type cell with auto-complete dropdown
  - [ ] Account cells with auto-complete dropdown
  - [ ] Description cell with text input
- [ ] Tab/Enter navigation between cells
- [ ] **Write tests**: Edit mode toggle, inline editing
- [ ] **Test**: Toggle edit mode, tab through cells, edit values

### 12.2 Add Quick Entry Row
- [ ] Add "New Transaction" row at top of list (always visible in edit mode)
- [ ] Pre-filled with smart defaults (today's date, last used account)
- [ ] Submit adds transaction and clears row for next entry
- [ ] Enter key in description field submits and focuses on amount for next
- [ ] Support rapid entry without leaving keyboard
- [ ] **Write tests**: Quick entry row, keyboard workflow
- [ ] **Test**: Enter 5+ transactions rapidly using only keyboard

### 12.3 Add Inline Validation and Auto-Complete
- [ ] Real-time validation as user types (same as TransactionForm)
- [ ] Auto-complete for accounts and transaction types
- [ ] Visual validation indicators (red border for errors)
- [ ] Prevent save of invalid transactions
- [ ] **Write tests**: Validation rules, auto-complete
- [ ] **Test**: Trigger validation errors, use auto-complete

### 12.4 Add Fill-Down and Duplicate Features
- [ ] Right-click context menu on transaction rows:
  - [ ] "Duplicate" - copy transaction to new row
  - [ ] "Fill Down Date" - copy date from row above
  - [ ] "Fill Down Account" - copy account from row above
- [ ] Keyboard shortcuts:
  - [ ] Ctrl+D to duplicate selected transaction
  - [ ] Ctrl+Shift+D to fill down from previous row
- [ ] **Write tests**: Context menu, keyboard shortcuts
- [ ] **Test**: Duplicate transactions, fill down common fields

### 12.5 Add Paste from Clipboard
- [ ] Detect when user pastes into description field
- [ ] Parse common bank statement formats (tab/comma delimited)
- [ ] Show preview dialog with column mapping:
  - [ ] Auto-detect date, amount, description columns
  - [ ] User confirms/adjusts mapping
  - [ ] Preview parsed transactions
- [ ] Bulk import parsed transactions
- [ ] Handle various date and amount formats
- [ ] **Write tests**: Clipboard parsing, column detection
- [ ] **Test**: Copy from Excel/bank PDF, paste into list

### 12.6 Add Batch Operations
- [ ] Multi-select transactions (Shift+Click, Ctrl+Click)
- [ ] Batch actions in edit mode:
  - [ ] Delete selected (with confirmation)
  - [ ] Change category for selected
  - [ ] Change account for selected
- [ ] Undo/redo for batch operations (Ctrl+Z / Ctrl+Y)
- [ ] Unsaved changes indicator in edit mode
- [ ] **Write tests**: Multi-select, batch operations, undo
- [ ] **Test**: Select multiple transactions, batch delete, undo

**Manual Verification (User):** Enable edit mode on transactions page, use quick entry row to add 10+ transactions rapidly, duplicate transactions, paste from bank statement, batch edit categories, verify all changes saved correctly when exiting edit mode.

## Phase 13: Budget Planning Feature (Post-MVP)

**Requirements**: FR-8 (Budget Planning)

**Goal**: Users can create budgets and track spending against them

### 13.1 Implement Budget Data Layer
- [ ] Create `src/stores/useBudgetStore.ts` with budget and budget items
- [ ] Add budget vs actual calculation functions to calculation service

### 12.2 Build Budget Management UI
- [ ] Create `src/components/budgets/BudgetForm.tsx`
- [ ] Create `src/components/budgets/BudgetItemsGrid.tsx`
- [ ] Create `src/components/budgets/BudgetDialog.tsx` with stepper
- [ ] Create `src/components/budgets/BudgetList.tsx`
- [ ] Create `src/components/budgets/BudgetOverview.tsx` with progress bars
- [ ] Create `src/components/budgets/BudgetsPage.tsx`
- [ ] Add route `/budgets`
- [ ] **Test**: Create budget with items, set as active, view budget vs actual, edit budget, delete budget

### 13.3 Add Budget Widget to Dashboard
- [ ] Create `src/components/dashboard/BudgetWidget.tsx`
- [ ] Integrate into Dashboard page
- [ ] **Test**: Dashboard shows budget tracking status

## Phase 14: Financial Reports Feature (Post-MVP)

**Requirements**: FR-9 (Financial Reports)

**Goal**: Users can view financial reports and analytics

### 14.1 Setup Chart Library
- [ ] Install charting library (recharts or nivo)
- [ ] Create `src/components/charts/LineChart.tsx`
- [ ] Create `src/components/charts/BarChart.tsx`
- [ ] Create `src/components/charts/PieChart.tsx`

### 13.2 Build Cash Flow Report
- [ ] Create `src/components/reports/CashFlowReport.tsx`
- [ ] Implement cash flow calculations
- [ ] Add date range selector and period grouping
- [ ] **Test**: View cash flow for different date ranges, verify calculations match transactions

### 14.3 Build Balance Sheet Report
- [ ] Create `src/components/reports/BalanceSheet.tsx`
- [ ] Show accounts grouped by type with balances
- [ ] Calculate and display net worth
- [ ] **Test**: Verify balance sheet shows correct account balances and net worth

### 14.4 Build Budget Analysis Report
- [ ] Create `src/components/reports/BudgetAnalysis.tsx`
- [ ] Show budget vs actual with progress bars and color coding
- [ ] **Test**: Verify budget analysis matches budget and transactions

### 14.5 Build Account Overview Report
- [ ] Create `src/components/reports/AccountOverview.tsx`
- [ ] Show account transactions and balance over time
- [ ] **Test**: View individual account history and balance chart

### 14.6 Create Reports Page
- [ ] Create `src/components/reports/ReportsPage.tsx` with tab navigation
- [ ] Add export buttons for each report
- [ ] Create `src/utils/export.utils.ts` for CSV/JSON export
- [ ] Add route `/reports`
- [ ] **Test**: Switch between reports, export data

## Phase 15: Settings & Data Management Feature (Post-MVP)

**Requirements**: Data Import/Export

**Goal**: Users can manage app settings and advanced data operations

### 15.1 Build Settings UI
- [ ] Create `src/components/settings/DataManagement.tsx` with import/export
- [ ] Create `src/components/settings/SettingsPage.tsx`
- [ ] Add route `/settings`
- [ ] **Test**: Export all data, import data, clear data

## Phase 16: Conflict Detection & Auto-Merge (Post-MVP)

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

## Phase 17: User Documentation (Post-MVP)

**Requirements**: NFR-4 (Usability)

**Goal**: Complete user documentation

### 17.1 Add User Documentation
- [ ] Add help tooltips in UI for complex features
- [ ] Create FAQ section in settings or help page
- [ ] Create user guide (optional) with screenshots
- [ ] **Test**: New user can understand how to use each feature

## Phase 18: Advanced Error Handling & Validation (Post-MVP)

**Requirements**: NFR-6 (Reliability), NFR-4 (Usability)

**Goal**: Enhanced error handling and validation

### 18.1 Add Error Boundary
- [ ] Create `src/components/common/ErrorBoundary.tsx`
- [ ] Create `src/components/common/ErrorMessage.tsx`
- [ ] Create `src/components/common/NotificationSnackbar.tsx`
- [ ] Wrap major sections in error boundaries
- [ ] **Test**: Simulate errors, verify user sees helpful messages

### 18.2 Enhanced Validation
- [ ] Add comprehensive Zod validation to all forms
- [ ] Validate business rules
- [ ] Prevent deletion of referenced entities
- [ ] Add user-friendly error messages
- [ ] **Test**: Try to submit invalid data, try to delete referenced entities

## Phase 19: Cloud Storage Integration (Post-MVP, Optional)

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

