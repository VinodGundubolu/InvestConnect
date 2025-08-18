# Investment Relationship Management (IRM) Tool

## Overview

An Investment Relationship Management (IRM) Tool designed for organizations to manage investor relationships and investment portfolios. The system provides dual-portal access with distinct interfaces for investors and administrators, enabling secure investment tracking, transaction management, and comprehensive reporting.

## Recent Changes (August 18, 2025)

### **Critical Bug Fixes Completed:**
- ✓ **TypeScript Errors** - Fixed undefined property references in investor credentials display
- ✓ **JSX Structure** - Corrected modal dialog closing tags and component nesting  
- ✓ **UI Visibility** - Enhanced modal backgrounds with white overlays and proper z-index
- ✓ **API Integration** - Fixed apiRequest method calls for investor creation
- ✓ **Returns Calculator** - Removed from investor portal as requested

### **System Functionality Verified:**
1. **Admin Portal** - Investor creation form displays with clear white background
2. **Database Integration** - PostgreSQL connection working, sample investors created  
3. **Investor Profile Modals** - Both admin and investor modals have proper visibility
4. **Server Connectivity** - Application running successfully on port 5000
5. **Error Resolution** - All TypeScript and JSX compilation errors resolved
6. **Credential Generation** - Username/password automatically generated for new investors
7. **Email Notifications** - Login credentials sent to viku2615@gmail.com via console logs
8. **Complete Integration** - Sample investors with full credentials and investment data

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