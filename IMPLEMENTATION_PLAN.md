# Money Tree - Implementation Plan

This document provides a step-by-step implementation plan for building the Money Tree application. Each step is small, verifiable, and can be checked off upon completion.

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Project
- [ ] Create `package.json` with project metadata
- [ ] Install core dependencies: `react`, `react-dom`, `typescript`
- [ ] Install dev dependencies: `webpack`, `webpack-cli`, `webpack-dev-server`
- [ ] Verify: Run `npm install` successfully

### 1.2 Configure TypeScript
- [ ] Create `tsconfig.json` with strict mode enabled
- [ ] Configure paths for module resolution
- [ ] Set up JSX for React
- [ ] Verify: Run `tsc --noEmit` without errors

### 1.3 Configure Webpack
- [ ] Create `webpack.config.js` for development
- [ ] Configure TypeScript loader (`ts-loader`)
- [ ] Configure HTML plugin with `public/index.html`
- [ ] Set up dev server with hot reload
- [ ] Verify: Run `npm run dev` and see basic page at localhost

### 1.4 Configure Code Quality Tools
- [ ] Install ESLint and `@typescript-eslint` packages
- [ ] Create `.eslintrc.js` with TypeScript rules
- [ ] Install Prettier
- [ ] Create `.prettierrc` with formatting rules
- [ ] Add ESLint-Prettier integration
- [ ] Verify: Run `npm run lint` successfully

### 1.5 Setup Material-UI
- [ ] Install `@mui/material` and `@emotion/react`, `@emotion/styled`
- [ ] Install `@mui/icons-material`
- [ ] Create `src/theme.ts` with basic MUI theme
- [ ] Verify: Import and use a MUI component in test file

### 1.6 Create Project Structure
- [ ] Create folder structure: `src/components`, `src/stores`, `src/services`, `src/types`, `src/utils`, `src/hooks`, `src/constants`, `src/schemas`
- [ ] Create basic `src/index.tsx` entry point
- [ ] Create basic `src/App.tsx` root component
- [ ] Create `public/index.html`
- [ ] Verify: App renders "Hello World" in browser

### 1.7 Setup Scripts
- [ ] Add `start` script for dev server
- [ ] Add `build` script for production build
- [ ] Add `lint` script for ESLint
- [ ] Add `format` script for Prettier
- [ ] Verify: All scripts run without errors

## Phase 2: Data Models & Type Definitions

### 2.1 Define Core Enums
- [ ] Create `src/types/enums.ts`
- [ ] Define `Group` enum (EXPENSE, INCOME, INVESTMENT, TRANSFER)
- [ ] Define `AccountType` enum
- [ ] Define `BudgetPeriod` enum
- [ ] Verify: Import enums in test file without errors

### 2.2 Define Data Model Interfaces
- [ ] Create `src/types/models.ts`
- [ ] Define `Currency` interface
- [ ] Define `Account` interface
- [ ] Define `Category` interface
- [ ] Define `TransactionType` interface
- [ ] Define `Transaction` interface
- [ ] Define `Budget` interface
- [ ] Define `BudgetItem` interface
- [ ] Define `DataFile` interface
- [ ] Verify: All interfaces compile without errors

### 2.3 Create Zod Schemas
- [ ] Install `zod` package
- [ ] Create `src/schemas/models.schema.ts`
- [ ] Create Zod schema for `Currency`
- [ ] Create Zod schema for `Account`
- [ ] Create Zod schema for `Category`
- [ ] Create Zod schema for `TransactionType`
- [ ] Create Zod schema for `Transaction`
- [ ] Create Zod schema for `Budget` and `BudgetItem`
- [ ] Create Zod schema for `DataFile`
- [ ] Verify: Parse sample data with schemas successfully

### 2.4 Create Default Data Constants
- [ ] Create `src/constants/defaults.ts`
- [ ] Define default currencies (USD, EUR, GBP, JPY)
- [ ] Define default categories for each group
- [ ] Define default transaction types for each category
- [ ] Define empty data file structure
- [ ] Verify: Import and use default data in test

## Phase 3: Authentication Setup

### 3.1 Setup MSAL Configuration
- [ ] Install `@azure/msal-browser`
- [ ] Create `src/services/auth.service.ts`
- [ ] Define MSAL configuration object
- [ ] Define login request scopes
- [ ] Create PublicClientApplication instance
- [ ] Verify: Configuration object is valid

### 3.2 Create Auth Store
- [ ] Install `zustand`
- [ ] Create `src/stores/useAuthStore.ts`
- [ ] Add state: `user`, `isAuthenticated`, `isLoading`
- [ ] Add action: `login()`
- [ ] Add action: `logout()`
- [ ] Add action: `checkAuth()`
- [ ] Verify: Store can be imported and used

### 3.3 Create Auth Context Component
- [ ] Create `src/components/auth/AuthProvider.tsx`
- [ ] Wrap MSAL context
- [ ] Handle authentication on mount
- [ ] Handle redirect callback
- [ ] Verify: Component renders children when authenticated

### 3.4 Create Login Page
- [ ] Create `src/components/auth/LoginPage.tsx`
- [ ] Add "Login with Microsoft" button
- [ ] Connect to auth store login action
- [ ] Add loading state
- [ ] Style with Material-UI
- [ ] Verify: Login page renders correctly

### 3.5 Create Protected Route Component
- [ ] Create `src/components/auth/ProtectedRoute.tsx`
- [ ] Check authentication status
- [ ] Redirect to login if not authenticated
- [ ] Show loading while checking auth
- [ ] Verify: Routes are protected correctly

## Phase 4: OneDrive Integration

### 4.1 Setup Microsoft Graph Client
- [ ] Install `@microsoft/microsoft-graph-client`
- [ ] Create `src/services/onedrive.service.ts`
- [ ] Initialize Graph client with auth provider
- [ ] Verify: Client can be instantiated

### 4.2 Implement File Operations
- [ ] Create `loadDataFile(year: number)` function
- [ ] Create `saveDataFile(year: number, data: DataFile)` function
- [ ] Create `fileExists(year: number)` function
- [ ] Create `createDataFile(year: number)` function
- [ ] Add error handling for network issues
- [ ] Verify: Functions compile and handle errors

### 4.3 Create Data Sync Service
- [ ] Create `src/services/sync.service.ts`
- [ ] Implement debounced save function
- [ ] Implement load with caching
- [ ] Add sync status tracking (saving, saved, error)
- [ ] Verify: Service manages sync state correctly

### 4.4 Add Local Storage Caching
- [ ] Create `src/services/storage.service.ts`
- [ ] Implement `saveToLocalStorage()`
- [ ] Implement `loadFromLocalStorage()`
- [ ] Implement `clearLocalStorage()`
- [ ] Add cache versioning
- [ ] Verify: Data persists in localStorage

## Phase 5: State Management (Zustand Stores)

### 5.1 Create Currency Store
- [ ] Create `src/stores/useCurrencyStore.ts`
- [ ] Add state: `currencies` array
- [ ] Add action: `loadCurrencies()`
- [ ] Add action: `addCurrency()`
- [ ] Add action: `deleteCurrency()`
- [ ] Add selector: `getCurrencyById()`
- [ ] Verify: Store operations work correctly

### 5.2 Create Account Store
- [ ] Create `src/stores/useAccountStore.ts`
- [ ] Add state: `accounts` array
- [ ] Add action: `loadAccounts()`
- [ ] Add action: `addAccount()`
- [ ] Add action: `updateAccount()`
- [ ] Add action: `deleteAccount()`
- [ ] Add selector: `getAccountById()`
- [ ] Add computed: `getAccountBalance()`
- [ ] Verify: Store operations work correctly

### 5.3 Create Category Store
- [ ] Create `src/stores/useCategoryStore.ts`
- [ ] Add state: `categories` array, `transactionTypes` array
- [ ] Add action: `loadCategories()`
- [ ] Add action: `addCategory()`
- [ ] Add action: `updateCategory()`
- [ ] Add action: `deleteCategory()`
- [ ] Add action: `addTransactionType()`
- [ ] Add action: `updateTransactionType()`
- [ ] Add action: `deleteTransactionType()`
- [ ] Add selector: `getCategoriesByGroup()`
- [ ] Add selector: `getTransactionTypesByCategory()`
- [ ] Verify: Store operations maintain hierarchy correctly

### 5.4 Create Transaction Store
- [ ] Create `src/stores/useTransactionStore.ts`
- [ ] Add state: `transactions` array
- [ ] Add action: `loadTransactions()`
- [ ] Add action: `addTransaction()`
- [ ] Add action: `updateTransaction()`
- [ ] Add action: `deleteTransaction()`
- [ ] Add selector: `getTransactionsByAccount()`
- [ ] Add selector: `getTransactionsByDateRange()`
- [ ] Verify: Store operations work correctly

### 5.5 Create Budget Store
- [ ] Create `src/stores/useBudgetStore.ts`
- [ ] Add state: `budgets` array, `budgetItems` array
- [ ] Add action: `loadBudgets()`
- [ ] Add action: `addBudget()`
- [ ] Add action: `updateBudget()`
- [ ] Add action: `deleteBudget()`
- [ ] Add action: `setActiveBudget()`
- [ ] Add action: `addBudgetItem()`
- [ ] Add action: `updateBudgetItem()`
- [ ] Add action: `deleteBudgetItem()`
- [ ] Add selector: `getActiveBudget()`
- [ ] Verify: Store operations work correctly

### 5.6 Create App Store
- [ ] Create `src/stores/useAppStore.ts`
- [ ] Add state: `currentYear`, `syncStatus`, `isLoading`
- [ ] Add action: `setCurrentYear()`
- [ ] Add action: `setSyncStatus()`
- [ ] Add action: `loadAllData()`
- [ ] Add action: `saveAllData()`
- [ ] Verify: Store coordinates data loading/saving

## Phase 6: Business Logic Services

### 6.1 Create Validation Service
- [ ] Create `src/services/validation.service.ts`
- [ ] Implement `validateTransaction()`
- [ ] Implement `validateAccount()`
- [ ] Implement `validateCategory()`
- [ ] Implement `validateBudget()`
- [ ] Return user-friendly error messages
- [ ] Verify: Validation catches all edge cases

### 6.2 Create Calculation Service
- [ ] Create `src/services/calculation.service.ts`
- [ ] Implement `calculateAccountBalance()`
- [ ] Implement `calculateAccountBalanceOverTime()`
- [ ] Implement `calculateCashFlow()`
- [ ] Implement `calculateBudgetVsActual()`
- [ ] Implement `calculateNetWorth()`
- [ ] Verify: All calculations return correct results

### 6.3 Create Date Utils
- [ ] Install `date-fns`
- [ ] Create `src/utils/date.utils.ts`
- [ ] Implement `formatDate()`
- [ ] Implement `parseDate()`
- [ ] Implement `isDateInRange()`
- [ ] Implement `getDateRangeForPeriod()`
- [ ] Verify: Date functions work correctly

### 6.4 Create Currency Utils
- [ ] Create `src/utils/currency.utils.ts`
- [ ] Implement `formatAmount()`
- [ ] Implement `parseAmount()`
- [ ] Implement `getCurrencySymbol()`
- [ ] Verify: Currency formatting works correctly

### 6.5 Create Export Utils
- [ ] Create `src/utils/export.utils.ts`
- [ ] Implement `exportToCSV()`
- [ ] Implement `exportToJSON()`
- [ ] Implement `downloadFile()`
- [ ] Verify: Export functions generate correct files

## Phase 7: Common UI Components

### 7.1 Create Layout Components
- [ ] Create `src/components/layout/Header.tsx`
- [ ] Create `src/components/layout/Sidebar.tsx`
- [ ] Create `src/components/layout/Footer.tsx`
- [ ] Create `src/components/layout/MainLayout.tsx`
- [ ] Add navigation menu
- [ ] Add user profile menu
- [ ] Verify: Layout renders correctly

### 7.2 Create Year Selector Component
- [ ] Create `src/components/common/YearSelector.tsx`
- [ ] Display current year
- [ ] Allow switching years
- [ ] Connect to app store
- [ ] Verify: Year selector changes current year

### 7.3 Create Loading Components
- [ ] Create `src/components/common/LoadingSpinner.tsx`
- [ ] Create `src/components/common/SkeletonLoader.tsx`
- [ ] Create `src/components/common/LoadingOverlay.tsx`
- [ ] Verify: Loading states display correctly

### 7.4 Create Error Components
- [ ] Create `src/components/common/ErrorBoundary.tsx`
- [ ] Create `src/components/common/ErrorMessage.tsx`
- [ ] Create `src/components/common/NotificationSnackbar.tsx`
- [ ] Verify: Errors display user-friendly messages

### 7.5 Create Form Components
- [ ] Create `src/components/common/FormTextField.tsx`
- [ ] Create `src/components/common/FormSelect.tsx`
- [ ] Create `src/components/common/FormDatePicker.tsx`
- [ ] Create `src/components/common/FormAutocomplete.tsx`
- [ ] Create `src/components/common/FormNumberField.tsx`
- [ ] Verify: Form components handle validation

### 7.6 Create Dialog Components
- [ ] Create `src/components/common/ConfirmDialog.tsx`
- [ ] Create `src/components/common/FormDialog.tsx`
- [ ] Verify: Dialogs open and close correctly

## Phase 8: Transaction Management UI

### 8.1 Create Transaction List Component
- [ ] Create `src/components/transactions/TransactionList.tsx`
- [ ] Display transactions in MUI DataGrid
- [ ] Add sorting and filtering
- [ ] Add pagination
- [ ] Connect to transaction store
- [ ] Verify: Transactions display correctly

### 8.2 Create Transaction Form
- [ ] Create `src/components/transactions/TransactionForm.tsx`
- [ ] Add transaction type selector
- [ ] Add amount input with validation
- [ ] Add date picker
- [ ] Add description field
- [ ] Add account selectors (from/to based on group)
- [ ] Connect to transaction store
- [ ] Verify: Form creates/updates transactions

### 8.3 Create Transaction Dialog
- [ ] Create `src/components/transactions/TransactionDialog.tsx`
- [ ] Embed TransactionForm in dialog
- [ ] Handle create mode
- [ ] Handle edit mode
- [ ] Add save/cancel actions
- [ ] Verify: Dialog creates/updates transactions

### 8.4 Create Transaction Filters
- [ ] Create `src/components/transactions/TransactionFilters.tsx`
- [ ] Add date range filter
- [ ] Add account filter
- [ ] Add category filter
- [ ] Add amount range filter
- [ ] Verify: Filters update transaction list

### 8.5 Create Transactions Page
- [ ] Create `src/components/transactions/TransactionsPage.tsx`
- [ ] Add TransactionList
- [ ] Add TransactionFilters
- [ ] Add "Add Transaction" button
- [ ] Add bulk actions
- [ ] Verify: Full transaction management works

## Phase 9: Account Management UI

### 9.1 Create Account Card Component
- [ ] Create `src/components/accounts/AccountCard.tsx`
- [ ] Display account name, type, balance
- [ ] Show currency symbol
- [ ] Add edit/delete actions
- [ ] Verify: Account card displays correctly

### 9.2 Create Account List Component
- [ ] Create `src/components/accounts/AccountList.tsx`
- [ ] Display accounts in grid
- [ ] Group by account type
- [ ] Show total by currency
- [ ] Connect to account store
- [ ] Verify: Accounts display correctly

### 9.3 Create Account Form
- [ ] Create `src/components/accounts/AccountForm.tsx`
- [ ] Add name field
- [ ] Add type selector
- [ ] Add currency selector
- [ ] Add initial balance input
- [ ] Add active checkbox
- [ ] Verify: Form creates/updates accounts

### 9.4 Create Account Dialog
- [ ] Create `src/components/accounts/AccountDialog.tsx`
- [ ] Embed AccountForm in dialog
- [ ] Handle create/edit modes
- [ ] Verify: Dialog creates/updates accounts

### 9.5 Create Account Detail View
- [ ] Create `src/components/accounts/AccountDetail.tsx`
- [ ] Show account information
- [ ] Display transaction list for account
- [ ] Show balance over time chart
- [ ] Verify: Account detail shows correct data

### 9.6 Create Accounts Page
- [ ] Create `src/components/accounts/AccountsPage.tsx`
- [ ] Add AccountList
- [ ] Add "Add Account" button
- [ ] Add account summary stats
- [ ] Verify: Full account management works

## Phase 10: Category Management UI

### 10.1 Create Category Tree Component
- [ ] Create `src/components/categories/CategoryTree.tsx`
- [ ] Display Group → Category → Transaction Type hierarchy
- [ ] Add expand/collapse functionality
- [ ] Add inline editing
- [ ] Connect to category store
- [ ] Verify: Hierarchy displays correctly

### 10.2 Create Category Form
- [ ] Create `src/components/categories/CategoryForm.tsx`
- [ ] Add name field
- [ ] Add group selector
- [ ] Verify: Form creates/updates categories

### 10.3 Create Transaction Type Form
- [ ] Create `src/components/categories/TransactionTypeForm.tsx`
- [ ] Add name field
- [ ] Add category selector
- [ ] Verify: Form creates/updates transaction types

### 10.4 Create Category Actions
- [ ] Add "Add Category" action to tree
- [ ] Add "Add Transaction Type" action
- [ ] Add "Edit" action with inline form
- [ ] Add "Delete" action with confirmation
- [ ] Add drag-drop reordering
- [ ] Verify: All actions work correctly

### 10.5 Create Categories Page
- [ ] Create `src/components/categories/CategoriesPage.tsx`
- [ ] Add CategoryTree
- [ ] Add instructions for users
- [ ] Verify: Full category management works

## Phase 11: Budget Management UI

### 11.1 Create Budget List Component
- [ ] Create `src/components/budgets/BudgetList.tsx`
- [ ] Display budgets in table
- [ ] Show active badge
- [ ] Add edit/delete actions
- [ ] Connect to budget store
- [ ] Verify: Budgets display correctly

### 11.2 Create Budget Form - Basic Info
- [ ] Create `src/components/budgets/BudgetForm.tsx`
- [ ] Add name field
- [ ] Add date range pickers
- [ ] Add period selector
- [ ] Add active checkbox
- [ ] Verify: Basic budget info can be saved

### 11.3 Create Budget Items Grid
- [ ] Create `src/components/budgets/BudgetItemsGrid.tsx`
- [ ] Display categories with amount inputs
- [ ] Group by Group (Expense/Income/Investment)
- [ ] Allow adding/removing items
- [ ] Verify: Budget items can be edited

### 11.4 Create Budget Dialog
- [ ] Create `src/components/budgets/BudgetDialog.tsx`
- [ ] Embed BudgetForm and BudgetItemsGrid
- [ ] Handle create/edit modes
- [ ] Add stepper for multi-step form
- [ ] Verify: Dialog creates/updates budgets

### 11.5 Create Budget Overview Card
- [ ] Create `src/components/budgets/BudgetOverview.tsx`
- [ ] Show budget vs actual summary
- [ ] Display progress bars
- [ ] Color-code by status
- [ ] Verify: Overview shows correct data

### 11.6 Create Budgets Page
- [ ] Create `src/components/budgets/BudgetsPage.tsx`
- [ ] Add BudgetList
- [ ] Add "Create Budget" button
- [ ] Add active budget overview
- [ ] Verify: Full budget management works

## Phase 12: Reports & Analytics UI

### 12.1 Create Report Layout
- [ ] Create `src/components/reports/ReportsPage.tsx`
- [ ] Add tab navigation for report types
- [ ] Add date range selector (shared)
- [ ] Add export buttons
- [ ] Verify: Report tabs switch correctly

### 12.2 Create Cash Flow Report
- [ ] Create `src/components/reports/CashFlowReport.tsx`
- [ ] Implement cash flow calculations
- [ ] Add line/bar chart (use recharts or nivo)
- [ ] Add breakdown table by category
- [ ] Add period grouping selector
- [ ] Verify: Report shows correct cash flow data

### 12.3 Create Balance Sheet Report
- [ ] Create `src/components/reports/BalanceSheet.tsx`
- [ ] Calculate assets and liabilities
- [ ] Display accounts grouped by type
- [ ] Show net worth
- [ ] Group by currency
- [ ] Verify: Balance sheet calculates correctly

### 12.4 Create Budget Analysis Report
- [ ] Create `src/components/reports/BudgetAnalysis.tsx`
- [ ] Calculate budget vs actual for each category
- [ ] Add progress bars with color coding
- [ ] Add variance column
- [ ] Add chart visualization
- [ ] Add period selector
- [ ] Verify: Analysis shows correct comparisons

### 12.5 Create Account Overview Report
- [ ] Create `src/components/reports/AccountOverview.tsx`
- [ ] Display account details
- [ ] Show transaction list for account
- [ ] Add balance over time chart
- [ ] Add filters
- [ ] Verify: Overview shows account history correctly

### 12.6 Add Chart Components
- [ ] Install charting library (recharts or nivo)
- [ ] Create `src/components/charts/LineChart.tsx`
- [ ] Create `src/components/charts/BarChart.tsx`
- [ ] Create `src/components/charts/PieChart.tsx`
- [ ] Style charts with MUI theme
- [ ] Verify: Charts display data correctly

## Phase 13: Dashboard

### 13.1 Create Dashboard Stats Cards
- [ ] Create `src/components/dashboard/StatsCard.tsx`
- [ ] Create card for total income
- [ ] Create card for total expenses
- [ ] Create card for net worth
- [ ] Create card for budget status
- [ ] Verify: Cards display correct values

### 13.2 Create Recent Transactions Widget
- [ ] Create `src/components/dashboard/RecentTransactions.tsx`
- [ ] Display last 10 transactions
- [ ] Add "View All" link
- [ ] Verify: Widget shows recent transactions

### 13.3 Create Account Summary Widget
- [ ] Create `src/components/dashboard/AccountSummary.tsx`
- [ ] Display accounts with balances
- [ ] Show total by currency
- [ ] Verify: Widget shows account balances

### 13.4 Create Budget Widget
- [ ] Create `src/components/dashboard/BudgetWidget.tsx`
- [ ] Display active budget progress
- [ ] Show top categories by usage
- [ ] Add alerts for over-budget categories
- [ ] Verify: Widget shows budget status

### 13.5 Create Dashboard Page
- [ ] Create `src/components/dashboard/DashboardPage.tsx`
- [ ] Add all widgets in grid layout
- [ ] Make responsive
- [ ] Verify: Dashboard loads and displays correctly

## Phase 14: Settings & Configuration

### 14.1 Create Currency Management UI
- [ ] Create `src/components/settings/CurrencySettings.tsx`
- [ ] Display currency list
- [ ] Add "Add Currency" form
- [ ] Add delete action with validation
- [ ] Verify: Currency management works

### 14.2 Create Data Export/Import UI
- [ ] Create `src/components/settings/DataManagement.tsx`
- [ ] Add "Export Data" button (JSON/CSV)
- [ ] Add "Import Data" button (with validation)
- [ ] Add "Clear All Data" with confirmation
- [ ] Verify: Export/import works correctly

### 14.3 Create Settings Page
- [ ] Create `src/components/settings/SettingsPage.tsx`
- [ ] Add tabs for different settings
- [ ] Add CurrencySettings
- [ ] Add DataManagement
- [ ] Add about/version info
- [ ] Verify: Settings page displays correctly

## Phase 15: Routing & Navigation

### 15.1 Setup React Router
- [ ] Install `react-router-dom`
- [ ] Create `src/routes.tsx` with route definitions
- [ ] Wrap app with BrowserRouter
- [ ] Verify: Routing is configured

### 15.2 Create Route Components
- [ ] Setup route for `/` (Dashboard)
- [ ] Setup route for `/transactions`
- [ ] Setup route for `/accounts`
- [ ] Setup route for `/accounts/:id`
- [ ] Setup route for `/categories`
- [ ] Setup route for `/budgets`
- [ ] Setup route for `/reports`
- [ ] Setup route for `/settings`
- [ ] Add 404 page
- [ ] Verify: All routes navigate correctly

### 15.3 Add Navigation Menu
- [ ] Update Header with navigation links
- [ ] Add active state styling
- [ ] Add mobile menu (drawer)
- [ ] Verify: Navigation works on all screen sizes

## Phase 16: Data Persistence Integration

### 16.1 Connect Stores to OneDrive
- [ ] Update stores to trigger save on data changes
- [ ] Implement debounced save in app store
- [ ] Add sync status indicators
- [ ] Verify: Changes save to OneDrive

### 16.2 Implement Data Loading
- [ ] Load data on app initialization
- [ ] Handle year switching
- [ ] Show loading states
- [ ] Verify: Data loads from OneDrive correctly

### 16.3 Add Offline Support
- [ ] Cache data in localStorage
- [ ] Queue changes when offline
- [ ] Sync when connection restored
- [ ] Show offline indicator
- [ ] Verify: App works offline and syncs when online

### 16.4 Handle Data Conflicts
- [ ] Implement last-write-wins strategy
- [ ] Add version tracking
- [ ] Show conflict warnings (future enhancement)
- [ ] Verify: Conflicts are handled gracefully

## Phase 17: Validation & Error Handling

### 17.1 Add Form Validation
- [ ] Add validation to all forms using Zod
- [ ] Display inline error messages
- [ ] Prevent submission with invalid data
- [ ] Verify: Forms show helpful validation errors

### 17.2 Add Business Rule Validation
- [ ] Validate account requirements by transaction group
- [ ] Prevent deletion of referenced entities
- [ ] Validate budget date ranges
- [ ] Verify: Business rules are enforced

### 17.3 Add Error Boundaries
- [ ] Wrap major sections with ErrorBoundary
- [ ] Add fallback UI for errors
- [ ] Log errors for debugging
- [ ] Verify: App doesn't crash on errors

### 17.4 Add Network Error Handling
- [ ] Handle OneDrive API errors
- [ ] Show retry buttons
- [ ] Add timeout handling
- [ ] Verify: Network errors are handled gracefully

## Phase 18: Polish & User Experience

### 18.1 Add Loading States
- [ ] Add skeleton loaders for data loading
- [ ] Add progress indicators for saves
- [ ] Add spinners for async operations
- [ ] Verify: Loading states provide good UX

### 18.2 Add Success Feedback
- [ ] Show snackbar on successful save
- [ ] Show success messages on CRUD operations
- [ ] Add subtle animations
- [ ] Verify: Users get clear feedback

### 18.3 Add Confirmation Dialogs
- [ ] Confirm before deleting transactions
- [ ] Confirm before deleting accounts
- [ ] Confirm before deleting categories
- [ ] Confirm before deleting budgets
- [ ] Verify: Confirmations prevent accidental deletion

### 18.4 Improve Responsive Design
- [ ] Test on mobile devices
- [ ] Optimize layouts for tablets
- [ ] Ensure touch-friendly controls
- [ ] Verify: App works well on all screen sizes

### 18.5 Add Keyboard Shortcuts
- [ ] Add shortcuts for common actions (optional)
- [ ] Add ESC to close dialogs
- [ ] Add Enter to submit forms
- [ ] Verify: Keyboard navigation works

### 18.6 Improve Accessibility
- [ ] Add ARIA labels
- [ ] Ensure proper heading hierarchy
- [ ] Test with screen reader (optional)
- [ ] Add focus indicators
- [ ] Verify: App is accessible

## Phase 19: Testing & Bug Fixes

### 19.1 Test Data Loading/Saving
- [ ] Test loading data for different years
- [ ] Test creating new year files
- [ ] Test saving changes
- [ ] Test data migration (if schema changes)
- [ ] Verify: Data persistence works correctly

### 19.2 Test Calculations
- [ ] Test account balance calculations
- [ ] Test cash flow calculations
- [ ] Test budget vs actual calculations
- [ ] Test with edge cases (negative balances, zero amounts)
- [ ] Verify: All calculations are correct

### 19.3 Test CRUD Operations
- [ ] Test creating all entity types
- [ ] Test updating all entity types
- [ ] Test deleting all entity types
- [ ] Test validation rules
- [ ] Verify: All CRUD operations work correctly

### 19.4 Test User Flows
- [ ] Test new user onboarding
- [ ] Test adding first transaction
- [ ] Test creating first budget
- [ ] Test generating reports
- [ ] Test year switching
- [ ] Verify: Complete user flows work end-to-end

### 19.5 Fix Bugs
- [ ] Review and fix any identified bugs
- [ ] Test edge cases
- [ ] Handle null/undefined values
- [ ] Verify: App is stable

## Phase 20: Production Build & Deployment

### 20.1 Optimize Bundle
- [ ] Configure webpack for production
- [ ] Enable code splitting
- [ ] Minimize bundle size
- [ ] Add source maps
- [ ] Verify: Production build is optimized

### 20.2 Setup Environment Variables
- [ ] Create `.env.example` file
- [ ] Configure Azure AD Client ID
- [ ] Add environment-specific configs
- [ ] Verify: Environment variables work correctly

### 20.3 Create Build Documentation
- [ ] Update README.md with setup instructions
- [ ] Document environment variables
- [ ] Add build/deployment instructions
- [ ] Document Azure AD app registration steps
- [ ] Verify: Documentation is complete

### 20.4 Test Production Build
- [ ] Build production bundle
- [ ] Test production build locally
- [ ] Verify authentication works
- [ ] Verify OneDrive integration works
- [ ] Verify: Production build works correctly

### 20.5 Deploy to Hosting
- [ ] Choose hosting provider (GitHub Pages, Netlify, Vercel, etc.)
- [ ] Configure deployment
- [ ] Deploy application
- [ ] Test deployed application
- [ ] Verify: App is live and working

## Phase 21: Final Polish

### 21.1 Add User Documentation
- [ ] Create user guide (optional)
- [ ] Add help tooltips in UI
- [ ] Add FAQ section
- [ ] Verify: Users can understand how to use the app

### 21.2 Performance Optimization
- [ ] Profile app performance
- [ ] Optimize re-renders
- [ ] Lazy load components
- [ ] Optimize chart rendering
- [ ] Verify: App is performant

### 21.3 Final Testing
- [ ] Test on multiple browsers
- [ ] Test on multiple devices
- [ ] Test with large datasets
- [ ] Test all user flows again
- [ ] Verify: App works consistently

### 21.4 Add Monitoring (Optional)
- [ ] Add error logging (e.g., Sentry)
- [ ] Add analytics (optional)
- [ ] Verify: Monitoring is working

## Completion Checklist

- [ ] All phases completed
- [ ] All features implemented
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Production build deployed
- [ ] No critical bugs

---

## Notes for AI Implementation

**Verification Methods:**
- Run `npm run build` - should complete without errors
- Run `npm run lint` - should pass without errors
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
- OneDrive API authentication issues
- Date timezone issues
- Decimal precision in calculations
- Race conditions in async operations

