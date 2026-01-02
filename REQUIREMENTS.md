# Money Tree - Requirements

## Overview

Money Tree is a personal finance management web application that helps users track transactions, manage budgets, and analyze financial data.

---

## MVP (Minimum Viable Product)

The MVP focuses on core personal finance tracking functionality with local file storage. Users can immediately start using the app to track their finances without any setup or authentication.

### FR-1: Transaction Management

- [ ] Users can add, edit, and delete transactions
- [ ] Users can add transactions instantly from the dashboard:
  - [ ] Inline form always visible on the starting page (no button click required)
  - [ ] Enter essential details (amount, date, type, account) and submit
  - [ ] Form clears automatically after submission for quick consecutive entries
- [ ] **Bulk Transaction Entry (Post-MVP):**
  - [ ] Alternative spreadsheet-like grid view for entering multiple transactions
  - [ ] Tab through cells to enter data quickly (similar to Excel/Google Sheets)
  - [ ] Inline editing with auto-complete for accounts and categories
  - [ ] Validation happens in real-time as you type
  - [ ] Add/remove rows dynamically
  - [ ] Copy/paste support from external sources (bank statements, Excel)
  - [ ] Save entire batch at once
  - [ ] Undo/redo support for batch operations
  - [ ] Quick fill-down for repeated values (same date, same account)
- [ ] Each transaction includes the following details:
  - [ ] **Transaction Type**: Defines the specific classification (e.g., "Groceries", "Salary", "Stock Purchase")
    - [ ] The Transaction Type automatically determines its parent Category and Group through the hierarchy
    - [ ] For Transfer transactions, no Transaction Type is needed (Transfer is a special group)
  - [ ] **Amount**: The monetary value of the transaction
  - [ ] **Date**: When the transaction occurred
  - [ ] **Description**: Details about the transaction
  - [ ] **From Account**: The source account
  - [ ] **To Account**: The destination account
- [ ] **Account requirements based on the transaction's group:**
  - [ ] **Expense transactions**: Require From Account (money leaving)
  - [ ] **Income transactions**: Require To Account (money entering)
  - [ ] **Investment transactions**: 
    - [ ] Buying: requires From Account (money leaving to purchase)
    - [ ] Selling: requires To Account (money entering from sale)
    - [ ] Dividends/Returns: requires To Account (money entering from returns)
  - [ ] **Transfer transactions**: Require both From Account and To Account (money moving between accounts)

### FR-2: Categorization System

- [x] The application uses a three-level hierarchy to organize transactions
- [x] **Hierarchy structure:**
  - [x] **Group** (top level, static): Expense, Income, Investment, or Transfer
  - [x] **Category** (middle level, user-customizable): e.g., "Food", "Salary", "Stocks"
  - [x] **Transaction Type** (bottom level, user-customizable): e.g., "Groceries", "Bonus", "Dividend"
- [x] **How it works:**
  - [x] Each Transaction Type belongs to exactly one Category
  - [x] Each Category belongs to exactly one Group
  - [ ] When a user selects a Transaction Type, the system automatically knows its Category and Group
  - [x] Example hierarchy: Expense → Food → Groceries
  - [x] Transfer is a special Group that does not use the Category/Transaction Type hierarchy
- [x] **Groups:**
  - [x] **Expense**: Money going out (uses categories and transaction types)
  - [x] **Income**: Money coming in (uses categories and transaction types)
  - [x] **Investment**: Investment-related activities (uses categories and transaction types)
  - [x] **Transfer**: Money moving between accounts (does not use categories or transaction types)

### FR-3: Account Management

- [x] Users can create and manage multiple accounts (e.g., bank accounts, credit cards, cash)
- [ ] Each account tracks its current balance
- [ ] Account balances update automatically based on transactions
- [x] Users can add, edit, and delete accounts
- [ ] Users can view account history and balance changes over time

### FR-4: Category Customization

- [ ] Users can fully customize the categorization structure within Expense, Income, and Investment groups:
  - [ ] Add, remove, and rename categories within a group
  - [ ] Add, remove, and rename transaction types within a category
  - [ ] Each transaction type must belong to exactly one category
  - [ ] Each category must belong to exactly one group
  - [ ] Users can move transaction types between categories
  - [ ] Users can move categories between groups
  - [ ] Create custom hierarchies that fit their financial tracking needs

### FR-5: Dashboard and Quick Entry

- [ ] Users see a summary dashboard as the starting page:
  - [ ] Inline transaction entry form at the top (always visible, ready for input)
  - [ ] Summary statistics and key metrics
  - [ ] Recent transaction activity
  - [ ] Account balance overview

### FR-6: Data Storage (Local Files - MVP)

- [x] All data is stored on the user's local machine using browser's File System Access API
- [x] Users can save data files to their local file system
- [x] Users can load data files from their local file system
- [x] Each calendar year's data is stored in a separate JSON file
- [x] Data includes transactions, accounts, categories, and budgets
- [x] Currencies are fixed defaults (not stored in data files)
- [x] Data format is portable and readable (JSON)
- [x] One file per year for better organization

**Basic Auto-Save (MVP):**
- [ ] Application automatically detects when data has changed
- [ ] Users are prompted to save changes when:
  - [ ] Closing the browser tab or window
  - [ ] Navigating away from the page
  - [ ] Loading a different year's data file
- [ ] Periodic auto-save runs in the background:
  - [ ] Automatically saves data at regular intervals when changes are detected
  - [ ] Configurable save interval (default: every 5 minutes)
  - [ ] Only saves when there are unsaved changes
  - [ ] Non-intrusive - happens silently without user prompts
- [ ] Unsaved changes indicator visible in the UI
- [ ] Manual save option always available

**Architecture:**
- [x] Storage system is designed with an extensible interface/adapter pattern
- [x] Easy to add new storage providers in the future
- [x] Core business logic is independent of storage implementation

### FR-7: Financial Reports (MVP)

#### Budget Creation
- [ ] Users can create budget plans with the following features:
  - [ ] Set budget period type (Monthly, Quarterly, Yearly)
  - [ ] Define start date and duration
  - [ ] Create recurring budgets (e.g., same budget every month)
  - [ ] Copy budget from previous period as template
  
#### Budget Allocation
- [ ] **Transaction Type-Level Budgets:**
  - [ ] Set budget amount for each transaction type (e.g., Groceries, Utilities, Salary)
  - [ ] Support both expense and income transaction types
  - [ ] Group budgets by category for summary view
  - [ ] Allocate remaining budget across transaction types
  - [ ] Show total budget vs available funds
- [ ] **Budget Templates:**
  - [ ] Save budget as template for reuse
  - [ ] Apply template to new periods
  - [ ] Modify template without affecting existing budgets

#### Budget Tracking & Review
- [ ] **Real-Time Budget Status:**
  - [ ] Show budget vs actual for each transaction type
  - [ ] Display spent amount, remaining amount, and percentage used
  - [ ] Visual progress bars for each transaction type
  - [ ] Color coding: Green (on track), Yellow (warning), Red (over budget)
  - [ ] Roll up transaction types into category summaries
- [ ] **Budget Dashboard:**
  - [ ] Overall budget status (total budgeted vs actual)
  - [ ] Transaction types closest to limit
  - [ ] Transaction types over budget (with overage amount)
  - [ ] Projected end-of-period status based on current spending rate
- [ ] **Alerts & Notifications:**
  - [ ] Warning when reaching 80% of budget
  - [ ] Alert when exceeding budget
  - [ ] Notification for unusual spending patterns

#### Budget Analysis
- [ ] **Variance Analysis:**
  - [ ] Compare actual vs budgeted for completed periods
  - [ ] Show variance amount and percentage
  - [ ] Identify transaction types consistently over/under budget
  - [ ] Trend analysis across multiple periods
- [ ] **Budget vs Actual Report:**
  - [ ] Side-by-side comparison table
  - [ ] Visual charts (bar chart, waterfall chart)
  - [ ] Drill down to transaction details for any category
  - [ ] Filter by date range, category, account
- [ ] **Historical Budget Performance:**
  - [ ] View past budgets and their performance
  - [ ] Compare budget adherence over time
  - [ ] Success rate metrics (% of categories on budget)
  - [ ] Recommend budget adjustments based on historical data

#### Budget Adjustment
- [ ] **In-Period Adjustments:**
  - [ ] Modify budget amounts during the period
  - [ ] Reallocate funds between categories
  - [ ] Track adjustment history
  - [ ] Show adjusted vs original budget
- [ ] **Rollover Options:**
  - [ ] Option to rollover unused budget to next period
  - [ ] Option to compensate overspending in next period

---

## Future Enhancements

These features will be implemented after the MVP is complete and validated by users.

### FR-9: Year Management & Multi-Year Support (Post-MVP)

#### Year Management
- [ ] Users can switch between different years
- [ ] Each year's data is stored in a separate file
- [ ] Users can create new year files
- [ ] Year selector visible in the interface

#### Multi-Year Features
- [ ] **Cross-Year Analysis:**
  - [ ] View reports spanning multiple years
  - [ ] Compare data year-over-year
  - [ ] Track long-term trends across years
  - [ ] Net worth progression over multiple years
- [ ] **Multi-Year Data Loading:**
  - [ ] Load multiple year files simultaneously
  - [ ] Aggregate data from multiple years for reporting
  - [ ] Memory-efficient handling of large datasets
- [ ] **Year Transitions:**
  - [ ] Carry forward account balances to new year
  - [ ] Option to copy categories and budgets to new year
  - [ ] Archive old year files
- [ ] **Historical Analysis:**
  - [ ] View transaction history across all years
  - [ ] Search transactions across multiple years
  - [ ] Category spending trends over multiple years
  - [ ] Income and expense patterns year-over-year
#### Account Overview Report
- [ ] View individual account details and transaction history
- [ ] Account balance over time chart
- [ ] List of all transactions for the account
- [ ] Filter and search transactions
- [ ] Export account statement
- [ ] Multi-year account history view
### FR-10: Advanced Data Management (Post-MVP)

**Conflict Detection & Auto-Merge:**
- [ ] Application detects when files have been modified externally
- [ ] Prevents data loss from concurrent modifications by:
  - [ ] Another browser tab/window
  - [ ] External text editor
  - [ ] Cloud sync service (Dropbox, Google Drive, etc.)
  - [ ] Another device editing the same file
- [ ] **Auto-Merge:** Automatically merges non-conflicting changes
  - [ ] When both versions have changes, intelligently combines them
  - [ ] Preserves new accounts, transactions, categories from both versions
  - [ ] Automatically merges changes to different records
  - [ ] Automatically merges changes to different fields in same record
  - [ ] Shows merge preview before applying
  - [ ] Lists what will be auto-merged and what needs user decision
- [ ] **User decides conflicts only when:**
  - [ ] Same record modified in both versions with overlapping field changes
  - [ ] Record deleted in one version but modified in the other
  - [ ] Changes that could affect data consistency (balances, totals)
- [ ] When conflict detected on save:
  - [ ] Shows intelligent merge dialog with:
    - [ ] **Auto-Merged Changes**: List of changes that can be safely merged
    - [ ] **Conflicts Requiring Decision**: Side-by-side comparison
    - [ ] Options for each conflict: Keep both, file version, your version
    - [ ] Preview of final merged result
  - [ ] Manual resolution options if user prefers:
    - [ ] **Overwrite**: Replace file with current changes (loses external changes)
    - [ ] **Reload**: Load latest file version (loses current unsaved changes)
    - [ ] **Save As**: Save current changes to a new file
    - [ ] **Cancel**: Return to editing without saving
  - [ ] Displays when file was last modified
  - [ ] Shows clear warning about data loss implications
  - [ ] Validates data consistency after merge (account balances, etc.)

### FR-11: Cloud Storage Integration (Post-MVP, Optional)

**Storage Options:**
- [ ] **OneDrive Integration**: Full sync with Microsoft OneDrive
- [ ] **Google Drive Integration**: Sync with Google Drive
- [ ] **Dropbox Integration**: Sync with Dropbox

**Authentication (Cloud Providers Only):**

**Important**: Authentication is NOT a core application feature. It is only required by cloud storage providers to access their APIs. The authentication is handled by the storage provider's SDK, not by Money Tree.

- Authentication is provided by the cloud storage provider's SDK:
  - **OneDrive**: Uses `@azure/msal-browser` (Microsoft's authentication library)
  - **Google Drive**: Uses Google Sign-In SDK
  - **Dropbox**: Uses Dropbox SDK authentication
- Money Tree simply integrates these SDKs to enable cloud sync
- Users choose whether to enable cloud storage (opt-in)
- Local-only usage remains fully functional without any authentication

---

## Non-Functional Requirements

### NFR-1: Architecture (MVP)

- [x] Static web application (no backend server)
- [x] Runs entirely in the browser
- [x] All processing happens client-side

### NFR-2: Technology Stack (MVP)

**Core:**
- [x] **TypeScript**: Primary programming language
- [x] **React**: UI framework
- [x] **Webpack**: Module bundling

**UI Components:**
- [x] **Material-UI (MUI)**: Component library for building the interface
  - [x] Provides comprehensive components (forms, tables, dialogs, date pickers)
  - [x] Responsive design built-in
  - [x] Strong TypeScript support

**State Management:**
- [x] **Zustand**: Lightweight state management solution
  - [ ] Manages application state (transactions, accounts, categories, budgets)
  - [x] Currencies are fixed constants (not part of state)
  - [x] Simple API with minimal boilerplate
  - [x] Excellent TypeScript support

**Code Quality:**
- [x] **ESLint**: Linting with TypeScript support (`@typescript-eslint`)
- [x] **Prettier**: Code formatting for consistent style
- [x] **Jest**: Unit testing framework with React Testing Library
- [x] **Test Coverage**: Maintain minimum 80% code coverage across the codebase

**Utilities:**
- [x] **date-fns**: Date manipulation and formatting
- [x] **Zod**: Schema validation for data integrity

**Storage (MVP):**
- [x] **File System Access API**: Browser native API for reading/writing local files
- [x] **localStorage**: For caching and app preferences

### NFR-3: Performance (MVP)

- [ ] Application loads quickly
- [ ] Responsive user interface
- [ ] Smooth transitions between views
- [ ] Efficient data loading and saving
- [ ] Optimized bundle size through code splitting

### NFR-4: Usability (MVP)

- [ ] Intuitive user interface
- [ ] Clear navigation structure
- [ ] Helpful error messages
- [ ] Responsive design for different screen sizes

### NFR-5: Compatibility (MVP)

- [ ] Works on modern web browsers (Chrome, Firefox, Safari, Edge)
- [ ] Compatible with desktop and tablet devices

### NFR-6: Reliability (MVP)

- [ ] Data integrity maintained during save operations
- [ ] Proper error handling for file access issues
- [ ] Graceful degradation when File System Access API not available

### NFR-7: Maintainability (MVP)

- [x] Clean, modular code structure
- [ ] Well-documented codebase
- [ ] Easy to update and extend features
- [x] Clear separation of concerns
- [x] Type-safe codebase with TypeScript
- [x] Consistent code style enforced by ESLint and Prettier
- [x] Comprehensive test coverage (minimum 80%) for all features and business logic

---

## Non-Functional Requirements - Future Enhancements

### NFR-8: Cloud Security (Post-MVP)

- [ ] Secure authentication through OAuth providers
- [ ] Data access limited to authenticated user
- [ ] No data stored on third-party servers (only cloud storage providers)
- [ ] All operations require valid session when using cloud storage

### NFR-9: Advanced Reliability (Post-MVP)

- [ ] Advanced conflict resolution with auto-merge
- [ ] Data backup and recovery mechanisms
- [ ] Graceful handling of cloud storage failures
- [ ] Offline-first support with sync queue

---

## Technical Constraints

### MVP Constraints

- [x] No backend infrastructure required
- [x] Limited by browser File System Access API capabilities
- [x] Limited by browser storage capabilities for local caching

### Post-MVP Constraints (Cloud Storage)

- [ ] Depends on cloud storage provider availability
- [ ] Requires internet connection for cloud synchronization
