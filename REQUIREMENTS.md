# Money Tree - Requirements

## Overview

Money Tree is a personal finance management web application that helps users track transactions, manage budgets, and analyze financial data.

## Functional Requirements

### 1. Transaction Management

Users can add, edit, and delete transactions. Each transaction includes the following details:

- **Transaction Type**: Defines the specific classification (e.g., "Groceries", "Salary", "Stock Purchase")
  - The Transaction Type automatically determines its parent Category and Group through the hierarchy
  - For Transfer transactions, no Transaction Type is needed (Transfer is a special group)
- **Amount**: The monetary value of the transaction
- **Date**: When the transaction occurred
- **Description**: Details about the transaction
- **From Account**: The source account
- **To Account**: The destination account

**Account requirements based on the transaction's group:**

- **Expense transactions**: Require From Account (money leaving)
- **Income transactions**: Require To Account (money entering)
- **Investment transactions**: 
  - Buying: requires From Account (money leaving to purchase)
  - Selling: requires To Account (money entering from sale)
  - Dividends/Returns: requires To Account (money entering from returns)
- **Transfer transactions**: Require both From Account and To Account (money moving between accounts)

### 2. Categorization System

The application uses a three-level hierarchy to organize transactions:

**Hierarchy structure:**
- **Group** (top level, static): Expense, Income, Investment, or Transfer
- **Category** (middle level, user-customizable): e.g., "Food", "Salary", "Stocks"
- **Transaction Type** (bottom level, user-customizable): e.g., "Groceries", "Bonus", "Dividend"

**How it works:**
- Each Transaction Type belongs to exactly one Category
- Each Category belongs to exactly one Group
- When a user selects a Transaction Type, the system automatically knows its Category and Group
- Example hierarchy: Expense → Food → Groceries
- Transfer is a special Group that does not use the Category/Transaction Type hierarchy

**Groups:**
- **Expense**: Money going out (uses categories and transaction types)
- **Income**: Money coming in (uses categories and transaction types)
- **Investment**: Investment-related activities (uses categories and transaction types)
- **Transfer**: Money moving between accounts (does not use categories or transaction types)

### 3. Account Management

- Users can create and manage multiple accounts (e.g., bank accounts, credit cards, cash)
- Each account tracks its current balance
- Account balances update automatically based on transactions
- Users can add, edit, and delete accounts
- Users can view account history and balance changes over time

### 4. Category Customization

Users can fully customize the categorization structure within Expense, Income, and Investment groups:

- Add, remove, and rename categories within a group
- Add, remove, and rename transaction types within a category
- Each transaction type must belong to exactly one category
- Each category must belong to exactly one group
- Users can move transaction types between categories
- Users can move categories between groups
- Create custom hierarchies that fit their financial tracking needs

### 5. Currency Management

- Users can add custom currencies to the system
- Users can remove currencies they don't use
- Each account is associated with a specific currency
- Transactions are recorded in the account's currency
- Support for displaying amounts in different currencies

### 6. Budget Planning

- Users can create budget plans
- Users can set budget limits for different categories
- Users can define budget periods (monthly, quarterly, yearly)
- Users can modify budget plans as needed

### 7. Financial Reports

Users can view and analyze their financial data through multiple reports:

- **Cash Flow Report**: Track income and expenses over time
- **Balance Sheet**: View current financial position and account balances
- **Budget Analysis**: Compare planned budget versus actual spending
- **Account Overview**: View individual account balances and transaction history

### 8. Data Storage and Synchronization

- All data is stored in the user's OneDrive account
- Each calendar year's data is stored in a separate file
- Data files are automatically synchronized with OneDrive
- Data includes transactions, accounts, categories, budgets, and currencies
- Uses OneDrive API for persistence
- Data format is portable and readable
- One file per year for better organization

### 9. Authentication

- Users must log in using their Microsoft account
- Login grants access to OneDrive storage
- Session management for secure access

## Non-Functional Requirements

### 1. Architecture

- Static web application (no backend server)
- Runs entirely in the browser
- All processing happens client-side

### 2. Technology Stack

**Core:**
- **TypeScript**: Primary programming language
- **React**: UI framework
- **Webpack**: Module bundling

**UI Components:**
- **Material-UI (MUI)**: Component library for building the interface
  - Provides comprehensive components (forms, tables, dialogs, date pickers)
  - Responsive design built-in
  - Strong TypeScript support

**State Management:**
- **Zustand**: Lightweight state management solution
  - Manages application state (transactions, accounts, categories, budgets, currencies)
  - Handles authentication state
  - Simple API with minimal boilerplate
  - Excellent TypeScript support

**Code Quality:**
- **ESLint**: Linting with TypeScript support (`@typescript-eslint`)
- **Prettier**: Code formatting for consistent style

**Utilities:**
- **date-fns**: Date manipulation and formatting
- **Zod**: Schema validation for data integrity

**Microsoft Integration:**
- **@microsoft/microsoft-graph-client**: OneDrive API integration
- **@azure/msal-browser**: Microsoft authentication (OAuth)

### 3. Performance

- Application loads quickly
- Responsive user interface
- Smooth transitions between views
- Efficient data loading and saving
- Optimized bundle size through code splitting

### 4. Security

- Secure authentication through Microsoft OAuth
- Data access limited to authenticated user
- No data stored on third-party servers
- All operations require valid login session

### 5. Usability

- Intuitive user interface
- Clear navigation structure
- Helpful error messages
- Responsive design for different screen sizes

### 6. Compatibility

- Works on modern web browsers (Chrome, Firefox, Safari, Edge)
- Compatible with desktop and tablet devices
- Supports current OneDrive API standards

### 7. Reliability

- Data integrity maintained during save operations
- Proper error handling for network issues
- Data backup and recovery mechanisms
- Graceful handling of OneDrive connection failures

### 8. Maintainability

- Clean, modular code structure
- Well-documented codebase
- Easy to update and extend features
- Clear separation of concerns
- Type-safe codebase with TypeScript
- Consistent code style enforced by ESLint and Prettier

## Technical Constraints

- No backend infrastructure required
- Depends on Microsoft OneDrive service availability
- Requires internet connection for data synchronization
- Limited by browser storage capabilities for local caching
