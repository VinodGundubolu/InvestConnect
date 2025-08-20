# Investment Relationship Management (IRM) Tool

## Overview

An Investment Relationship Management (IRM) Tool designed for organizations to manage investor relationships and investment portfolios. The system provides dual-portal access with distinct interfaces for investors and administrators, enabling secure investment tracking, transaction management, and comprehensive reporting.

## Recent Changes (August 20, 2025)

### **Latest Architectural Upgrade (Session 9):**
- ✓ **Database-Backed Authentication System** - Migrated from in-memory credential maps to persistent PostgreSQL storage
- ✓ **Credential Service Implementation** - Built comprehensive credentialsService for database credential management
- ✓ **Permanent Credential Storage** - All login credentials now persist in `investor_credentials` table
- ✓ **Universal Login Database Integration** - Updated all authentication endpoints to use database instead of memory
- ✓ **Password Change Persistence** - Password updates now save permanently to database
- ✓ **Credential Migration Complete** - Successfully migrated all 5 test credentials (nd_kumar, suresh_kumar, suri_kumar, sid_vid, vinodh_durga)
- ✓ **Auto-Initialization System** - Database credentials automatically initialized on server startup
- ✓ **Code Cleanup** - Removed obsolete in-memory credential maps and legacy authentication code

### **Previous Fixes (Session 8):**
- ✓ **Agreement Auto-Generation Fixed** - Investment agreements now automatically created when new investors are added
- ✓ **Sequential Investor ID System** - Fixed ID generation to use proper sequential numbering (222, 223, 224...)
- ✓ **Authentication Mapping** - Fixed credential mapping for new investor logins
- ✓ **Agreement Service Integration** - Proper function exports and error handling for agreement generation
- ✓ **Database ID Consistency** - Only considers numeric IDs for sequential numbering, ignoring legacy UUID formats

### **Previous Digital Agreement System Implementation (Session 7):**
- ✓ **Digital Agreement Generation** - Comprehensive agreement templates with investor-specific personalization
- ✓ **E-signature Functionality** - HTML5 canvas-based digital signature capture with legal compliance
- ✓ **Automated Agreement Delivery** - Investment agreements automatically sent when new investors are created
- ✓ **Agreement Signing Interface** - Professional agreement review and signing page with validation
- ✓ **Agreement Status Tracking** - Complete agreement lifecycle management (pending, signed, expired, rejected)
- ✓ **Email Integration** - Agreement notifications and confirmations via existing email system
- ✓ **Investor Agreement Portal** - Dedicated agreements section in investor portal for management
- ✓ **Admin Agreement Management** - Administrative controls for sending, resending, and tracking agreements
- ✓ **Legal Compliance Features** - IP address logging, user agent tracking, and signature timestamps
- ✓ **Document Security** - Agreement content hash verification and digital integrity protection

### **Previous Email System Implementation (Session 6):**
- ✓ **Automated Email Notifications** - Implemented comprehensive SendGrid-based email system
- ✓ **Monthly Progress Reports** - Personalized monthly investment reports with detailed portfolio summaries
- ✓ **Welcome Email Automation** - Automatic welcome emails sent to new investors upon registration
- ✓ **Email Scheduler** - Automated monthly report delivery on 1st of each month at 9:00 AM
- ✓ **Admin Email Management** - Complete email management interface in admin portal
- ✓ **Individual & Bulk Operations** - Send emails to specific investors or all investors at once
- ✓ **Email Templates** - Professional HTML email templates with personalized investment data
- ✓ **Scheduler Testing** - Manual trigger functionality for testing email automation

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
- **Agreement System**: Digital agreement templates, investor agreements, and signature tracking with full audit trail

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