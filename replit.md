# Investment Relationship Management (IRM) Tool

## Overview

An Investment Relationship Management (IRM) Tool designed for organizations to manage investor relationships and investment portfolios. The system provides dual-portal access with distinct interfaces for investors and administrators, enabling secure investment tracking, transaction management, and comprehensive reporting.

## Recent Changes (August 18, 2025)

### **Latest Critical Fixes (Session 5):**
- ✓ **Simple Sequential Investor IDs** - Changed from complex format (`2025-V1-B1-234E-141`) to simple numbers (`1`, `2`, `3`, `4`...)
- ✓ **Phone Number Login Bug Fixed** - Corrected API request method parameters in frontend login logic
- ✓ **Frontend Pattern Recognition** - Updated identifier detection to work with simple sequential IDs
- ✓ **Demo Account Information** - Updated login page to show correct simple Investor ID format
- ✓ **Database Synchronization** - Created test investors with simple IDs (1, 2, 3) for authentication testing
- ✓ **Universal Login Verification** - All four authentication methods working (ID, Phone, Email, Username)

### **Previous Critical Fixes (Session 4):**
- ✓ **Interest Calculation Logic** - Separated milestone bonuses from regular interest calculations
- ✓ **Transaction Creation** - Fixed database constraint errors, proper field mapping (`type` vs `transactionType`)
- ✓ **Year 5 Interest** - Now correctly shows ₹3,60,000 only (18% of principal), bonus disbursed separately  
- ✓ **Transaction History** - Fixed profile endpoint to include transactions using `getInvestorWithInvestments`
- ✓ **Early Exit Value** - Updated formula to Capital + Interest yet to be disbursed (excluding milestone bonuses)
- ✓ **Separate Transactions** - Interest and milestone bonuses now show as distinct debit/credit entries
- ✓ **Universal Login System** - Single URL `/login` supporting Email ID, Phone Number, and Investor ID authentication
- ✓ **Password Change Feature** - Integrated password update functionality with enhanced security requirements

### **Universal Authentication & Investment Dashboard:**
1. **Universal Login URLs** - `/login` and `/investor-login` both support multi-identifier authentication
2. **Multi-Identifier Support** - Email ID, Phone Number, Investor ID, and Username login methods
3. **Smart UI Detection** - Dynamic icons and labels based on identifier type recognition
4. **Complete Investment Data** - All login methods provide full access to investment dashboard
5. **Password Management** - Secure password change functionality with validation requirements
6. **Session Management** - Robust session handling across all authentication methods

### **Transaction System Improvements:**
1. **6 Separate Transactions** - Year 5 creates both interest (₹3.6L) and bonus (₹20L) transactions
2. **Database Integration** - Fixed PostgreSQL date format compatibility and enum constraints
3. **Transaction Types** - `dividend_disbursement` for interest, `bonus_disbursement` for milestones
4. **Profile Data Loading** - Investor profile now properly includes transaction history
5. **Interest Calculations** - Pure interest calculations exclude milestone bonuses for accuracy

### **Previous Bug Fixes Completed:**
- ✓ **TypeScript Errors** - Fixed undefined property references in investor credentials display
- ✓ **JSX Structure** - Corrected modal dialog closing tags and component nesting  
- ✓ **UI Visibility** - Enhanced modal backgrounds with white overlays and proper z-index
- ✓ **API Integration** - Fixed apiRequest method calls for investor creation
- ✓ **Returns Calculator** - Removed from investor portal as requested

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based access control
- **Session Management**: Express sessions with PostgreSQL session store
- **Middleware**: Custom logging, error handling, and authentication middleware

### Database & ORM
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema**: Comprehensive relational model covering users, investors, investments, investment plans, transactions, and dividend rates
- **Connection**: Neon serverless PostgreSQL with connection pooling

### Authentication & Authorization
- **Provider**: Replit OIDC authentication with OpenID Connect
- **Strategy**: Passport.js with custom OIDC strategy
- **Role-Based Access**: Two-tier system (investor/admin) with granular permissions
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL

### Dual Portal Design
- **Investor Portal** (`/investor`): Limited view showing only personal investment data, returns, and transaction history
- **Admin Portal** (`/admin`): Full administrative access with portfolio overview, investor management, and investment creation capabilities
- **Separate Login Pages**: Individual login URLs for sharing - `/investor-login` and `/admin-login`
- **Role-Based Authentication**: Each portal requires appropriate credentials for access

### Data Models
- **User Management**: User profiles with role assignments and authentication data
- **Investment Plans**: Configurable investment products with terms, rates, and availability
- **Investor Profiles**: Comprehensive investor information with KYC details
- **Investment Tracking**: Individual investment records with maturity dates and amounts
- **Transaction System**: Complete audit trail of all financial transactions
- **Dividend Management**: Configurable dividend rates by year and investment type

### Security Features
- **Data Isolation**: Investors can only access their own data
- **Admin Controls**: Full visibility and management capabilities for administrators
- **Secure Sessions**: HTTP-only cookies with secure transmission
- **Input Validation**: Zod schema validation on both client and server
- **Error Handling**: Comprehensive error boundaries and validation

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OIDC authentication service
- **Session Storage**: PostgreSQL-based session management

### Development Tools
- **Build System**: Vite with TypeScript compilation and HMR
- **Development Environment**: Replit-specific tooling and error handling
- **Database Management**: Drizzle Kit for migrations and schema management

### Frontend Libraries
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Forms**: React Hook Form with Hookform resolvers
- **Data Fetching**: TanStack Query for API state management

### Backend Dependencies
- **Web Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with Neon serverless adapter
- **Authentication**: Passport.js with OpenID Client
- **Session Management**: Express Session with connect-pg-simple
- **Validation**: Zod for runtime type checking

### Utility Libraries
- **Date Handling**: date-fns for date manipulation
- **Class Management**: clsx and class-variance-authority for conditional styling
- **Memoization**: memoizee for caching expensive operations