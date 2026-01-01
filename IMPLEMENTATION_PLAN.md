# Money Tree - Implementation Plan

This document provides a step-by-step implementation plan for building the Money Tree application. Each step is small, verifiable, and can be checked off upon completion.

## Requirements Reference

This plan implements all requirements from REQUIREMENTS.md:

**Functional Requirements:**
- **FR-1**: Transaction Management → Phase 5, 8
- **FR-2**: Categorization System → Phase 2, 4
- **FR-3**: Account Management → Phase 3, 5, 8
- **FR-4**: Category Customization → Phase 4
- **FR-5**: Currency Management → Phase 3, 9
- **FR-6**: Budget Planning → Phase 6, 8
- **FR-7**: Financial Reports → Phase 7, 8
- **FR-8**: Data Storage & Sync → Phase 2, 9, 10, 12
- **FR-9**: Authentication → Phase 2

**Non-Functional Requirements:**
- **NFR-1**: Architecture → Phase 1, 16
- **NFR-2**: Technology Stack → Phase 1
- **NFR-3**: Performance → Phase 14, 16, 17
- **NFR-4**: Security → Phase 2, 16
- **NFR-5**: Usability → Phase 11, 13, 14, 17
- **NFR-6**: Compatibility → Phase 11, 14, 16, 17
- **NFR-7**: Reliability → Phase 12, 13, 15
- **NFR-8**: Maintainability → Phase 1, 17

---

## Phase 1: Project Setup & Foundation

**Requirements**: NFR-1, NFR-2, NFR-8

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
- [ ] Create `.github/workflows/ci.yml` workflow file
- [ ] Configure workflow to run on push and pull request to main branch
- [ ] Add jobs: install dependencies, lint, format check, build
- [ ] Configure Node.js version matching `.nvmrc`
- [ ] Add caching for node_modules
- [ ] Test: Push code and verify workflow runs successfully on GitHub

## Phase 2: Core Foundation & Authentication

**Requirements**: FR-9 (Authentication), FR-8 (Data Storage & Sync), NFR-4 (Security)

**Goal**: Enable user login and establish data storage foundation

### 2.1 Setup Core Infrastructure
- [ ] Install dependencies: `zustand`, `zod`, `date-fns`, `@azure/msal-browser`, `@microsoft/microsoft-graph-client`
- [ ] Create folder structure: `src/components`, `src/stores`, `src/services`, `src/types`, `src/utils`, `src/hooks`, `src/constants`, `src/schemas`
- [ ] Create `src/types/enums.ts` with all enums: `Group`, `AccountType`, `BudgetPeriod`
- [ ] Create `src/types/models.ts` with all interfaces: `Currency`, `Account`, `Category`, `TransactionType`, `Transaction`, `Budget`, `BudgetItem`, `DataFile`
- [ ] Create `src/schemas/models.schema.ts` with Zod schemas for all models
- [ ] Create `src/constants/defaults.ts` with default currencies and categories

### 2.2 Implement Authentication (User Login)
- [ ] Create `src/services/auth.service.ts` with MSAL configuration
- [ ] Create `src/stores/useAuthStore.ts` with auth state and actions
- [ ] Create `src/components/auth/AuthProvider.tsx`
- [ ] Create `src/components/auth/LoginPage.tsx` with Microsoft login button
- [ ] Create `src/components/auth/ProtectedRoute.tsx`
- [ ] Update `src/App.tsx` to show LoginPage if not authenticated
- [ ] **Test**: User can click "Login with Microsoft" and authenticate successfully

### 2.3 Setup Data Storage & Sync
- [ ] Create `src/services/onedrive.service.ts` with file operations
- [ ] Create `src/services/storage.service.ts` for localStorage caching
- [ ] Create `src/services/sync.service.ts` with debounced save
- [ ] Create `src/stores/useAppStore.ts` for app-level state (year, sync status)
- [ ] **Test**: Load empty data file from OneDrive, save to OneDrive, cache in localStorage

## Phase 3: Account Management Feature

**Requirements**: FR-3 (Account Management), FR-5 (Currency Management)

**Goal**: Users can create and manage their accounts (bank accounts, credit cards, etc.)

### 3.1 Implement Account Data Layer
- [ ] Create `src/stores/useAccountStore.ts` with account state and CRUD actions
- [ ] Create `src/stores/useCurrencyStore.ts` with currency state
- [ ] Create `src/utils/currency.utils.ts` for formatting amounts
- [ ] Load default currencies into store

### 3.2 Build Account Management UI
- [ ] Create `src/components/layout/MainLayout.tsx` with header, navigation
- [ ] Create `src/components/accounts/AccountCard.tsx`
- [ ] Create `src/components/accounts/AccountList.tsx`
- [ ] Create `src/components/accounts/AccountForm.tsx` with validation
- [ ] Create `src/components/accounts/AccountDialog.tsx`
- [ ] Create `src/components/accounts/AccountsPage.tsx`
- [ ] Add route `/accounts` in router setup
- [ ] **Test**: Create account, edit account, view account list, delete account (all via UI)

## Phase 4: Category & Transaction Type Management Feature

**Requirements**: FR-2 (Categorization System), FR-4 (Category Customization)

**Goal**: Users can customize their category structure for organizing transactions

### 4.1 Implement Category Data Layer
- [ ] Create `src/stores/useCategoryStore.ts` with categories and transaction types
- [ ] Load default categories and transaction types into store

### 4.2 Build Category Management UI
- [ ] Create `src/components/categories/CategoryTree.tsx` showing hierarchy
- [ ] Create `src/components/categories/CategoryForm.tsx`
- [ ] Create `src/components/categories/TransactionTypeForm.tsx`
- [ ] Create `src/components/categories/CategoriesPage.tsx`
- [ ] Add route `/categories`
- [ ] **Test**: Add category, add transaction type, edit names, delete (with validation), view hierarchy

## Phase 5: Transaction Management Feature

**Requirements**: FR-1 (Transaction Management), FR-3 (Account Management - balance updates)

**Goal**: Users can add, view, edit, and delete transactions

### 5.1 Implement Transaction Data Layer
- [ ] Create `src/stores/useTransactionStore.ts` with transaction CRUD
- [ ] Create `src/services/calculation.service.ts` for balance calculations
- [ ] Create `src/services/validation.service.ts` for transaction validation
- [ ] Create `src/utils/date.utils.ts` for date formatting

### 5.2 Build Transaction Management UI
- [ ] Install `@mui/x-data-grid` for transaction list
- [ ] Create `src/components/common/FormTextField.tsx` and other form components
- [ ] Create `src/components/transactions/TransactionForm.tsx` with conditional from/to accounts
- [ ] Create `src/components/transactions/TransactionDialog.tsx`
- [ ] Create `src/components/transactions/TransactionList.tsx` with DataGrid
- [ ] Create `src/components/transactions/TransactionFilters.tsx`
- [ ] Create `src/components/transactions/TransactionsPage.tsx`
- [ ] Add route `/transactions`
- [ ] **Test**: Add expense (from account), add income (to account), add transfer (both), add investment, filter, edit, delete

### 5.3 Verify Account Balance Updates
- [ ] Update AccountCard to show calculated balance
- [ ] **Test**: Add transactions and verify account balances update correctly

## Phase 6: Budget Planning Feature

**Requirements**: FR-6 (Budget Planning)

**Goal**: Users can create budgets and track spending against them

### 6.1 Implement Budget Data Layer
- [ ] Create `src/stores/useBudgetStore.ts` with budget and budget items
- [ ] Add budget vs actual calculation functions to calculation service

### 6.2 Build Budget Management UI
- [ ] Create `src/components/budgets/BudgetForm.tsx`
- [ ] Create `src/components/budgets/BudgetItemsGrid.tsx`
- [ ] Create `src/components/budgets/BudgetDialog.tsx` with stepper
- [ ] Create `src/components/budgets/BudgetList.tsx`
- [ ] Create `src/components/budgets/BudgetOverview.tsx` with progress bars
- [ ] Create `src/components/budgets/BudgetsPage.tsx`
- [ ] Add route `/budgets`
- [ ] **Test**: Create budget with items, set as active, view budget vs actual, edit budget, delete budget

## Phase 7: Financial Reports Feature

**Requirements**: FR-7 (Financial Reports)

**Goal**: Users can view financial reports and analytics

### 7.1 Setup Chart Library
- [ ] Install charting library (recharts or nivo)
- [ ] Create `src/components/charts/LineChart.tsx`
- [ ] Create `src/components/charts/BarChart.tsx`
- [ ] Create `src/components/charts/PieChart.tsx`

### 7.2 Build Cash Flow Report
- [ ] Create `src/components/reports/CashFlowReport.tsx`
- [ ] Implement cash flow calculations
- [ ] Add date range selector and period grouping
- [ ] **Test**: View cash flow for different date ranges, verify calculations match transactions

### 7.3 Build Balance Sheet Report
- [ ] Create `src/components/reports/BalanceSheet.tsx`
- [ ] Show accounts grouped by type with balances
- [ ] Calculate and display net worth
- [ ] **Test**: Verify balance sheet shows correct account balances and net worth

### 7.4 Build Budget Analysis Report
- [ ] Create `src/components/reports/BudgetAnalysis.tsx`
- [ ] Show budget vs actual with progress bars and color coding
- [ ] **Test**: Verify budget analysis matches budget and transactions

### 7.5 Build Account Overview Report
- [ ] Create `src/components/reports/AccountOverview.tsx`
- [ ] Show account transactions and balance over time
- [ ] **Test**: View individual account history and balance chart

### 7.6 Create Reports Page
- [ ] Create `src/components/reports/ReportsPage.tsx` with tab navigation
- [ ] Add export buttons for each report
- [ ] Create `src/utils/export.utils.ts` for CSV/JSON export
- [ ] Add route `/reports`
- [ ] **Test**: Switch between reports, export data

## Phase 8: Dashboard Feature

**Requirements**: FR-1, FR-3, FR-6, FR-7 (Summary views of all data)

**Goal**: Users see a summary dashboard when they log in

### 8.1 Build Dashboard Widgets
- [ ] Create `src/components/dashboard/StatsCard.tsx`
- [ ] Create `src/components/dashboard/RecentTransactions.tsx`
- [ ] Create `src/components/dashboard/AccountSummary.tsx`
- [ ] Create `src/components/dashboard/BudgetWidget.tsx`

### 8.2 Create Dashboard Page
- [ ] Create `src/components/dashboard/DashboardPage.tsx`
- [ ] Integrate all widgets in responsive grid
- [ ] Add route `/` (Dashboard)
- [ ] Update navigation to default to dashboard
- [ ] **Test**: View dashboard with all widgets showing correct data, click through to detail pages

## Phase 9: Settings & Currency Management Feature

**Requirements**: FR-5 (Currency Management), FR-8 (Data Import/Export)

**Goal**: Users can manage currencies and app settings

### 9.1 Build Settings UI
- [ ] Create `src/components/settings/CurrencySettings.tsx`
- [ ] Create `src/components/settings/DataManagement.tsx` with import/export
- [ ] Create `src/components/settings/SettingsPage.tsx`
- [ ] Add route `/settings`
- [ ] **Test**: Add currency, delete currency, export all data, import data, clear data

## Phase 10: Year Management Feature

**Requirements**: FR-8 (Data Storage - multi-year files)

**Goal**: Users can switch between years and manage multi-year data

### 10.1 Implement Year Switching
- [ ] Create `src/components/common/YearSelector.tsx`
- [ ] Add to header/navigation
- [ ] Connect to app store
- [ ] Implement year switching logic (load different file)
- [ ] **Test**: Switch years, add transactions in different years, verify data isolation

## Phase 11: Navigation & Routing Polish

**Requirements**: NFR-5 (Usability - navigation), NFR-6 (Compatibility - responsive)

**Goal**: Complete navigation experience

### 11.1 Complete Routing Setup
- [ ] Install `react-router-dom`
- [ ] Create `src/routes.tsx` with all route definitions
- [ ] Wrap app with BrowserRouter and ProtectedRoute
- [ ] Create 404 page

### 11.2 Complete Navigation
- [ ] Update Header with all navigation links
- [ ] Add active state styling
- [ ] Add mobile responsive menu (drawer)
- [ ] **Test**: Navigate between all pages, verify active states, test on mobile

## Phase 12: Data Persistence Polish

**Requirements**: FR-8 (Data Storage & Sync), NFR-7 (Reliability)

**Goal**: Ensure data saves/loads reliably

### 12.1 Complete Data Sync
- [ ] Connect all stores to trigger auto-save
- [ ] Add sync status indicators in UI
- [ ] Implement offline support with localStorage queue
- [ ] Add conflict resolution (last-write-wins)
- [ ] **Test**: Make changes and verify auto-save, go offline and verify queue, reconnect and verify sync

## Phase 13: Validation & Error Handling

**Requirements**: NFR-5 (Usability - error messages), NFR-7 (Reliability - error handling)

**Goal**: Ensure data integrity and good error UX

### 13.1 Add Comprehensive Validation
- [ ] Add Zod validation to all forms
- [ ] Validate business rules (account requirements by transaction type)
- [ ] Prevent deletion of referenced entities
- [ ] Add user-friendly error messages
- [ ] **Test**: Try to submit invalid data, try to delete referenced entities

### 13.2 Add Error Handling
- [ ] Create `src/components/common/ErrorBoundary.tsx`
- [ ] Create `src/components/common/ErrorMessage.tsx`
- [ ] Create `src/components/common/NotificationSnackbar.tsx`
- [ ] Wrap major sections in error boundaries
- [ ] Handle OneDrive API errors with retry
- [ ] **Test**: Simulate errors, verify user sees helpful messages

## Phase 14: UI/UX Polish

**Requirements**: NFR-5 (Usability), NFR-6 (Compatibility - responsive), NFR-3 (Performance)

**Goal**: Professional, polished user experience

### 14.1 Add Loading States
- [ ] Create `src/components/common/LoadingSpinner.tsx`
- [ ] Create `src/components/common/SkeletonLoader.tsx`
- [ ] Create `src/components/common/LoadingOverlay.tsx`
- [ ] Add loading states to all async operations
- [ ] **Test**: Verify smooth loading experience

### 14.2 Add Feedback & Confirmations
- [ ] Add success snackbars for all CRUD operations
- [ ] Create `src/components/common/ConfirmDialog.tsx`
- [ ] Add delete confirmations
- [ ] Add subtle animations
- [ ] **Test**: Verify user gets clear feedback for all actions

### 14.3 Improve Responsive Design
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test on tablets (iPad)
- [ ] Optimize touch targets
- [ ] **Test**: Full app works well on all screen sizes

### 14.4 Add Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation (Tab, Enter, ESC)
- [ ] Add focus indicators
- [ ] Ensure proper heading hierarchy
- [ ] **Test**: Navigate app with keyboard only

## Phase 15: Testing & Quality Assurance

**Requirements**: All FR (Functional Requirements), NFR-7 (Reliability)

**Goal**: Ensure app works correctly in all scenarios

### 15.1 Test Core Features
- [ ] Test complete account workflow (create, edit, delete)
- [ ] Test complete transaction workflow (all types, filters, edit, delete)
- [ ] Test complete budget workflow (create, track, edit, delete)
- [ ] Test all reports with various data scenarios
- [ ] Test year switching with multiple years of data
- [ ] **Test**: All features work end-to-end

### 15.2 Test Calculations
- [ ] Verify account balances with complex transaction history
- [ ] Verify cash flow calculations
- [ ] Verify budget vs actual calculations
- [ ] Test edge cases (negative balances, zero amounts, large numbers)
- [ ] **Test**: All calculations are accurate

### 15.3 Test Data Persistence
- [ ] Test data saves correctly to OneDrive
- [ ] Test data loads correctly from OneDrive
- [ ] Test multiple year files
- [ ] Test offline queue and sync
- [ ] **Test**: No data loss in any scenario

### 15.4 Fix Bugs
- [ ] Review and fix all identified bugs
- [ ] Handle null/undefined edge cases
- [ ] Test with large datasets
- [ ] **Test**: App is stable and performant

## Phase 16: Production Build & Deployment

**Requirements**: NFR-1 (Architecture), NFR-3 (Performance), NFR-4 (Security), NFR-6 (Compatibility)

**Goal**: Deploy the application to production

### 16.1 Optimize Bundle
- [ ] Configure webpack for production with code splitting, minimize bundle size, and add source maps
- [ ] **Test**: Production build completes without errors, bundle size is reasonable

### 16.2 Setup Environment Variables
- [ ] Create `.env.example` file with Azure AD Client ID and environment-specific configs
- [ ] Document environment setup in README
- [ ] **Test**: Environment variables work in production

### 16.3 Create Build Documentation
- [ ] Update README.md with setup instructions, environment variables, build/deployment instructions, and Azure AD app registration steps
- [ ] Add troubleshooting guide
- [ ] **Test**: New developer can follow README to set up project

### 16.4 Test Production Build Locally
- [ ] Build production bundle, test locally
- [ ] Verify authentication works
- [ ] Verify OneDrive integration works
- [ ] Test all features in production mode
- [ ] **Test**: App works correctly in production mode

### 16.5 Deploy to Cloudflare Pages
- [ ] Create Cloudflare account (if not already)
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Build output directory: `dist`
  - [ ] Node.js version: LTS (18 or 20)
  - [ ] Environment variables: Add `AZURE_CLIENT_ID`
- [ ] Add `_headers` file in `public/` for security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] Add `_redirects` file in `public/` for SPA routing (`/* /index.html 200`)
- [ ] Install Wrangler CLI: `npm install --save-dev wrangler`
- [ ] Add deployment script: `"deploy": "npm run build && wrangler pages publish dist"`
- [ ] Configure automatic deployment from main branch
- [ ] Configure preview deployments for pull requests
- [ ] Deploy application
- [ ] **Test**: Visit Cloudflare Pages URL, test authentication, test OneDrive integration, test all features, test on multiple browsers

### 16.6 Configure Custom Domain (Optional)
- [ ] Add custom domain in Cloudflare Pages dashboard
- [ ] Update DNS records
- [ ] Enable automatic HTTPS
- [ ] **Test**: App works on custom domain with HTTPS

## Phase 17: Final Polish & Documentation

**Requirements**: NFR-5 (Usability - documentation), NFR-3 (Performance), NFR-6 (Compatibility), NFR-8 (Maintainability)

**Goal**: Complete and document the application

### 17.1 Add User Documentation
- [ ] Add help tooltips in UI for complex features
- [ ] Create FAQ section in settings or help page
- [ ] Create user guide (optional) with screenshots
- [ ] **Test**: New user can understand how to use each feature

### 17.2 Performance Optimization
- [ ] Profile app performance with React DevTools
- [ ] Optimize re-renders with React.memo, useMemo, useCallback
- [ ] Lazy load route components with React.lazy
- [ ] Optimize chart rendering (debounce updates, limit data points)
- [ ] **Test**: App is responsive and performant with large datasets

### 17.3 Final Cross-Browser Testing
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Firefox
- [ ] Test on Safari (desktop & mobile)
- [ ] Test on Edge
- [ ] **Test**: App works consistently across all browsers

### 17.4 Add Monitoring (Optional)
- [ ] Setup error logging (e.g., Sentry)
- [ ] Setup analytics (e.g., Google Analytics, optional)
- [ ] Add performance monitoring
- [ ] **Test**: Errors are logged, analytics work

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

