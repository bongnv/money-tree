# Money Tree - Requirements

## Overview

Money Tree is a personal finance management web application that helps users track transactions, manage budgets, and analyze financial data.

## Functional Requirements

### FR-1: Transaction Management

- [ ] Users can add, edit, and delete transactions
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

- [ ] Users can create and manage multiple accounts (e.g., bank accounts, credit cards, cash)
- [ ] Each account tracks its current balance
- [ ] Account balances update automatically based on transactions
- [ ] Users can add, edit, and delete accounts
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

### FR-5: Budget Planning

- [ ] Users can create budget plans
- [ ] Users can set budget limits for different categories
- [ ] Users can define budget periods (monthly, quarterly, yearly)
- [ ] Users can modify budget plans as needed

### FR-6: Financial Reports

- [ ] Users can view and analyze their financial data through multiple reports:
  - [ ] **Cash Flow Report**: Track income and expenses over time
  - [ ] **Balance Sheet**: View current financial position and account balances
  - [ ] **Budget Analysis**: Compare planned budget versus actual spending
  - [ ] **Account Overview**: View individual account balances and transaction history

### FR-7: Data Storage and Synchronization

**Primary Storage (Phase 1):**
- [x] All data is stored on the user's local machine using browser's File System Access API
- [x] Users can save data files to their local file system
- [x] Users can load data files from their local file system
- [x] Each calendar year's data is stored in a separate JSON file
- [x] Data includes transactions, accounts, categories, and budgets
- [x] Currencies are fixed defaults (not stored in data files)
- [x] Data format is portable and readable (JSON)
- [x] One file per year for better organization

**Auto-Save:**
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
- [ ] Auto-save features prevent accidental data loss

**Architecture:**
- [x] Storage system is designed with an extensible interface/adapter pattern
- [x] Easy to add new storage providers (OneDrive, Google Drive, Dropbox, etc.)
- [x] Core business logic is independent of storage implementation

**Future Storage Options (Deferred):**
- [ ] **OneDrive Integration**: Full sync with Microsoft OneDrive (Phase 18+)
- [ ] **Google Drive Integration**: Sync with Google Drive (future)
- [ ] **Dropbox Integration**: Sync with Dropbox (future)

### FR-8: Authentication (Cloud Storage Providers Only)

**Important**: Authentication is NOT a core application feature. It is only required by cloud storage providers (OneDrive, Google Drive, etc.) to access their APIs for loading and saving data. The authentication is handled by the storage provider's SDK, not by the Money Tree application itself.

**Local Storage (Phases 1-17):**
- No authentication required
- No login needed
- App can be used immediately
- Full functionality with local files

**Cloud Storage (Phase 18+ - Optional):**
- Authentication is provided by the cloud storage provider's SDK:
  - **OneDrive**: Uses `@azure/msal-browser` (Microsoft's authentication library)
  - **Google Drive**: Uses Google Sign-In SDK
  - **Dropbox**: Uses Dropbox SDK authentication
- Money Tree simply integrates these SDKs to enable cloud sync
- Users choose whether to enable cloud storage (opt-in)
- Local-only usage remains fully functional without any authentication

## Non-Functional Requirements

### NFR-1: Architecture

- [x] Static web application (no backend server)
- [x] Runs entirely in the browser
- [x] All processing happens client-side

### NFR-2: Technology Stack

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
  - [x] Manages storage provider settings (local vs cloud)
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

**Storage (Phase 1 - Local):**
- [x] **File System Access API**: Browser native API for reading/writing local files
- [x] **localStorage**: For caching and app preferences

**Cloud Integration (Future Phases - Optional):**
- [ ] **@microsoft/microsoft-graph-client**: OneDrive API integration (Phase 18+)
- [ ] **@azure/msal-browser**: Microsoft authentication SDK (Phase 18+)
- [ ] **Google Drive API**: Google Drive integration (future)
- [x] **Note**: Authentication is handled by these SDKs, not by the application itself

### NFR-3: Performance

- [ ] Application loads quickly
- [ ] Responsive user interface
- [ ] Smooth transitions between views
- [ ] Efficient data loading and saving
- [ ] Optimized bundle size through code splitting

### NFR-4: Security

- [ ] Secure authentication through Microsoft OAuth
- [ ] Data access limited to authenticated user
- [ ] No data stored on third-party servers
- [ ] All operations require valid login session

### NFR-5: Usability

- [ ] Intuitive user interface
- [ ] Clear navigation structure
- [ ] Helpful error messages
- [ ] Responsive design for different screen sizes

### NFR-6: Compatibility

- [ ] Works on modern web browsers (Chrome, Firefox, Safari, Edge)
- [ ] Compatible with desktop and tablet devices
- [ ] Supports current OneDrive API standards

### NFR-7: Reliability

- [ ] Data integrity maintained during save operations
- [ ] Proper error handling for network issues
- [ ] Data backup and recovery mechanisms
- [ ] Graceful handling of OneDrive connection failures

### NFR-8: Maintainability

- [x] Clean, modular code structure
- [ ] Well-documented codebase
- [ ] Easy to update and extend features
- [x] Clear separation of concerns
- [x] Type-safe codebase with TypeScript
- [x] Consistent code style enforced by ESLint and Prettier
- [x] Comprehensive test coverage (minimum 80%) for all features and business logic

## Technical Constraints

- [x] No backend infrastructure required
- [ ] Depends on Microsoft OneDrive service availability (Phase 18+ only)
- [ ] Requires internet connection for data synchronization (Phase 18+ only)
- [x] Limited by browser storage capabilities for local caching
