# Money Tree - Implementation Plan

This document provides a step-by-step implementation plan for building the Money Tree application. Each step is small, verifiable, and can be checked off upon completion.

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

## Requirements Reference

This plan implements all requirements from REQUIREMENTS.md:

**Functional Requirements:**
- **FR-1**: Transaction Management → Phase 5, 8
- **FR-2**: Categorization System → Phase 2, 4
- **FR-3**: Account Management → Phase 3, 5, 8
- **FR-4**: Category Customization → Phase 4
- **FR-5**: Budget Planning → Phase 6, 8
- **FR-6**: Financial Reports → Phase 7, 8
- **FR-7**: Data Storage & Sync → Phase 2 (local), 10 (year management), 12 (persistence), 18 (cloud - optional)
- **FR-8**: Authentication → Phase 18 only (cloud storage providers - optional, not an app feature)

**Non-Functional Requirements:**
- **NFR-1**: Architecture → Phase 1, 16
- **NFR-2**: Technology Stack → Phase 1, 2
- **NFR-3**: Performance → Phase 14, 16, 17
- **NFR-4**: Security → Phase 18 (cloud storage only - optional)
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

## Phase 2: Core Foundation & Local Storage

**Requirements**: FR-8 (Data Storage - Local), NFR-2 (Technology Stack)

**Goal**: Establish data models and local file storage foundation

**Note**: No authentication required. Users can use the app immediately with local file storage.

### 2.1 Setup Core Infrastructure
- [x] Install dependencies: `zustand`, `zod`, `date-fns`
- [x] Create `src/types/enums.ts` with all enums: `Group`, `AccountType`, `BudgetPeriod`
- [x] Create `src/types/models.ts` with all interfaces: `Currency`, `Account`, `Category`, `TransactionType`, `Transaction`, `Budget`, `BudgetItem`, `DataFile`
- [x] Create `src/schemas/models.schema.ts` with Zod schemas for all models
- [x] Create `src/constants/defaults.ts` with default currencies and categories
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
  - [x] Implement periodic auto-save with configurable interval (default: 5 minutes)
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
- [x] **Test**: Click "Load" → file picker opens → select file → data appears; Click "Save" → file picker opens → save file; Make changes → see unsaved indicator → wait 5 minutes → auto-saved; close browser → get warning; Make changes → load different file → prompted to save first

## Phase 3: Account Management Feature

**Requirements**: FR-3 (Account Management)

**Goal**: Users can create and manage their accounts (bank accounts, credit cards, etc.)

### 3.1 Implement Account Data Layer
- [ ] Create `src/stores/useAccountStore.ts` with account state and CRUD actions
- [ ] Create `src/utils/currency.utils.ts` for formatting amounts with default currencies
- [ ] Load default currencies from constants

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

## Phase 9: Settings & Data Management Feature

**Requirements**: FR-7 (Data Import/Export)

**Goal**: Users can manage app settings and data import/export

### 9.1 Build Settings UI
- [ ] Create `src/components/settings/DataManagement.tsx` with import/export
- [ ] Create `src/components/settings/SettingsPage.tsx`
- [ ] Add route `/settings`
- [ ] **Test**: Export all data, import data, clear data

## Phase 10: Year Management Feature

**Requirements**: FR-7 (Data Storage - multi-year files)

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

## Phase 15: Integration Testing & Quality Assurance

**Requirements**: All FR (Functional Requirements), NFR-7 (Reliability)

**Goal**: Comprehensive integration testing and validation

**Note**: Unit tests are written in each phase (2-14) alongside implementation. This phase focuses on integration testing and cross-feature validation.

### 15.1 Integration Testing
- [ ] Test complete user workflows end-to-end
- [ ] Test data flow between stores and components
- [ ] Test interactions between different features
- [ ] Test year switching with data dependencies

### 15.2 Cross-Feature Validation
- [ ] Test account deletion with existing transactions
- [ ] Test category deletion with existing transaction types
- [ ] Test transaction changes affecting budgets and reports
- [ ] Test data consistency across all features

### 15.3 Data Persistence Integration
- [ ] Test complete save/load workflows with local files
- [ ] Test data integrity across multiple year files
- [ ] Test with large datasets (100+ transactions)
- [ ] **Test**: No data loss in any scenario

### 15.4 Test Coverage Review
- [ ] Review unit test coverage from all phases
- [ ] Run `npm run test:coverage` to check coverage metrics
- [ ] Ensure minimum 80% code coverage across the codebase
- [ ] Add tests for any gaps in critical functionality
- [ ] **Test**: Coverage meets 80% threshold, all critical paths tested

### 15.5 Bug Fixes and Edge Cases
- [ ] Fix any bugs discovered during testing
- [ ] Handle null/undefined edge cases
- [ ] Test with extreme values and edge cases
- [ ] **Test**: App is stable and handles errors gracefully

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

## Phase 18: Cloud Storage Integration (Optional - Future)

**Requirements**: FR-8 (Cloud Storage), FR-9 (Authentication via SDKs), NFR-4 (Security)

**Goal**: Add optional cloud storage providers (OneDrive, Google Drive) for users who want automatic sync

**Important**: This phase is completely optional. The app is fully functional with local storage. This phase adds cloud sync as an opt-in feature for users who want it.

**Note on Authentication**: Authentication is NOT implemented by Money Tree. It is provided by the cloud storage provider's SDK (e.g., Microsoft's MSAL, Google's Sign-In SDK). Money Tree simply integrates these SDKs to enable file access.

### 18.1 Implement OneDrive Storage Provider
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
- [ ] Add offline support with conflict resolution (last-write-wins)
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
- [ ] Add FAQ: "Is authentication required?" → No, only for cloud storage
- [ ] **Test**: Users can migrate their local data to cloud storage

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

