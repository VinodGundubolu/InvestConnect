# Investment Relationship Management (IRM) Tool - Local Setup Guide

## 📋 Overview

This guide will help you set up the Investment Relationship Management system on your local development environment. The system includes a React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database.

## 🔧 Prerequisites & System Requirements

### Required Software Installations:

#### 1. **Node.js (Version 18 or higher)**
```bash
# Download from: https://nodejs.org/
# Or using package managers:

# Windows (using Chocolatey)
choco install nodejs

# macOS (using Homebrew)
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher
```

#### 2. **PostgreSQL Database (Version 12 or higher)**
```bash
# Windows
# Download from: https://www.postgresql.org/download/windows/

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version  # Should show PostgreSQL 12+ 
```

#### 3. **Git (for version control)**
```bash
# Download from: https://git-scm.com/downloads
# Verify installation
git --version
```

#### 4. **Text Editor/IDE (Recommended: VS Code)**
```bash
# Download from: https://code.visualstudio.com/
# Recommended extensions:
# - TypeScript and JavaScript Language Features
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
# - PostgreSQL extension
```

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database
```bash
# Start PostgreSQL service (if not already running)
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Connect to PostgreSQL as superuser
sudo -u postgres psql           # Linux
psql postgres                   # macOS/Windows

# Create database and user
CREATE DATABASE irm_local;
CREATE USER irm_user WITH PASSWORD 'irm_password_2025';
GRANT ALL PRIVILEGES ON DATABASE irm_local TO irm_user;
\q
```

### Step 2: Test Database Connection
```bash
# Test connection with new user
psql -h localhost -U irm_user -d irm_local
# If successful, you'll see: irm_local=>
# Type \q to exit
```

## 📁 Project Setup

### Step 1: Download/Clone Project Files
```bash
# If you have the project files in a zip/archive:
# Extract to your preferred directory, e.g., ~/Projects/irm-tool

# Navigate to project directory
cd ~/Projects/irm-tool

# Or if cloning from a repository:
# git clone <repository-url>
# cd <project-directory>
```

### Step 2: Install Dependencies
```bash
# Install all project dependencies
npm install

# This will install:
# - React 18 with TypeScript
# - Express.js server
# - PostgreSQL drivers
# - UI components (Radix UI, Tailwind CSS)
# - All other required packages (~80 packages total)
```

### Step 3: Environment Configuration
```bash
# Create environment configuration file
touch .env

# Edit .env file (use your preferred editor)
nano .env
# OR
code .env
```

Add the following to your `.env` file:
```env
# Database Configuration
DATABASE_URL="postgresql://irm_user:irm_password_2025@localhost:5432/irm_local"

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Configuration (generate your own secret)
SESSION_SECRET="your_super_secret_session_key_here_change_this_in_production"

# Email Configuration (Optional - for notifications)
# SMTP2GO_API_KEY="your_smtp2go_api_key_if_you_have_one"
# SMTP2GO_USERNAME="your_smtp2go_username"

# Replit Configuration (Leave these for compatibility)
REPL_ID="local-development"
REPLIT_DOMAINS="localhost:5000"
```

## 🛠️ Database Schema Setup

### Step 1: Initialize Database Schema
```bash
# Push database schema to your local PostgreSQL
npm run db:push

# If you get warnings about data loss, force push (safe for initial setup)
npm run db:push --force
```

### Step 2: Verify Database Schema
```bash
# Connect to your database and check tables
psql -h localhost -U irm_user -d irm_local

# List all tables
\dt

# You should see these tables:
# - investors
# - investments  
# - investment_plans
# - investment_agreements
# - investor_credentials
# - transactions
# - dividend_rates
# - users
# - sessions
# - agreement_templates
# - agreement_actions
# - investor_agreements

# Exit PostgreSQL
\q
```

## 🚀 Running the Application

### Step 1: Start Development Server
```bash
# Start the full application (frontend + backend)
npm run dev

# You should see output like:
# > rest-express@1.0.0 dev
# > NODE_ENV=development tsx server/index.ts
# 
# Auto-processed X investments, created X transactions
# 🔐 Generating credentials for all existing investors...
# 📊 Found X investors in database
# [timestamp] [express] serving on port 5000
# 
# [vite] dev server running at:
# > Local: http://localhost:5000
```

### Step 2: Verify Application is Running
```bash
# Open your web browser and navigate to:
http://localhost:5000

# You should see the IRM Tool landing page
```

### Step 3: Test Database Connection
```bash
# The application should automatically:
# 1. Connect to your PostgreSQL database
# 2. Initialize default investment plans
# 3. Create sample data if database is empty
# 4. Generate login credentials
```

## 👤 Initial Setup & Testing

### Step 1: Access Admin Portal
```bash
# Open browser to: http://localhost:5000/admin-login
# 
# If no admin user exists, create one by:
# 1. Going to the database directly, or
# 2. Using the investor creation form and manually updating the user role
```

### Step 2: Create Test Investor (via Admin)
1. Navigate to Admin Portal: `http://localhost:5000/admin`
2. Go to "Manage Investors" section
3. Click "Add New Investor"
4. Fill in test investor details:
   - Name: Test Investor
   - Email: test@example.com  
   - Phone: +1234567890
   - Investment Amount: 1000000 (₹10 lakhs)

### Step 3: Test Investor Login
```bash
# Navigate to: http://localhost:5000/investor-login
# 
# Use any of these login methods:
# - Email: test@example.com
# - Phone: +1234567890  
# - Investor ID: (generated automatically)
# - Username: (generated automatically)
# 
# Password: (default system password, usually firstname_2025)
```

## 📊 Verify System Functionality

### Step 1: Test Core Features
- [ ] Admin login works
- [ ] Investor creation successful
- [ ] Investor login works (all 4 methods)
- [ ] Investment dashboard displays correctly
- [ ] Bond details show properly
- [ ] Transaction history loads
- [ ] Agreement system functions
- [ ] Interest calculations are accurate

### Step 2: Check Database Data
```sql
-- Connect to database
psql -h localhost -U irm_user -d irm_local

-- Check investor count
SELECT COUNT(*) FROM investors;

-- Check investment plans
SELECT * FROM investment_plans;

-- Check credentials
SELECT COUNT(*) FROM investor_credentials;

-- Exit
\q
```

## 🔧 Development Commands

### Common Development Tasks:
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Type checking
npm run check

# Database schema push
npm run db:push

# Force database schema push
npm run db:push --force
```

### Database Management:
```bash
# Backup database
pg_dump -h localhost -U irm_user irm_local > backup.sql

# Restore database
psql -h localhost -U irm_user -d irm_local < backup.sql

# Reset database (WARNING: Deletes all data)
psql -h localhost -U irm_user -d irm_local -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:push --force
```

## 🐛 Troubleshooting

### Common Issues:

#### 1. **Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Verify database exists
psql -h localhost -U irm_user -l

# Check DATABASE_URL in .env file
echo $DATABASE_URL
```

#### 2. **Port Already in Use**
```bash
# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9

# Or change port in .env file
PORT=3000
```

#### 3. **Module Not Found Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. **TypeScript Errors**
```bash
# Run type checking
npm run check

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run check
```

#### 5. **Database Schema Issues**
```bash
# Force push schema (be careful - may delete data)
npm run db:push --force

# Check current schema
psql -h localhost -U irm_user -d irm_local -c "\d"
```

## 📁 Project Structure Understanding

```
irm-tool/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── pages/         # Page components
│   └── index.html         # Entry point
├── server/                 # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared code
│   └── schema.ts          # Database schema
├── scripts/               # Utility scripts
├── .env                   # Environment variables
├── package.json           # Dependencies
├── vite.config.ts         # Build configuration
└── drizzle.config.ts      # Database configuration
```

## 🔐 Security Considerations

### For Local Development:
1. **Change default passwords** in .env file
2. **Use strong SESSION_SECRET** (generate with crypto.randomBytes(64).toString('hex'))
3. **Don't commit .env file** to version control
4. **Use localhost only** for development
5. **Keep PostgreSQL updated**

### For Production:
1. **Use environment-specific configurations**
2. **Enable SSL/HTTPS**
3. **Use production database credentials**
4. **Enable proper authentication**
5. **Regular security updates**

## 📞 Support & Resources

### Documentation Files:
- `replit.md` - Project architecture and features
- `VERSION_CONTROL.md` - Version management
- `DISASTER_RECOVERY_PLAN.md` - Backup and recovery
- `v2-roadmap.md` - Future development plans

### Useful Links:
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs

### Community Resources:
- **Stack Overflow**: For technical questions
- **GitHub Issues**: For bug reports
- **PostgreSQL Community**: For database help

---

## ✅ Setup Verification Checklist

After completing setup, verify:
- [ ] Node.js v18+ installed
- [ ] PostgreSQL 12+ running  
- [ ] Database `irm_local` created
- [ ] User `irm_user` has access
- [ ] Project dependencies installed
- [ ] .env file configured
- [ ] Database schema pushed
- [ ] Development server starts
- [ ] Application loads at http://localhost:5000
- [ ] Admin portal accessible
- [ ] Can create test investor
- [ ] Investor login works
- [ ] Database queries execute

## 🎯 Next Steps After Setup

1. **Explore the Admin Portal** - Create investors, view dashboard
2. **Test Investor Features** - Login, view investments, agreements
3. **Review Code Structure** - Understand React components and API routes
4. **Customize Configuration** - Adjust settings for your needs
5. **Plan Development** - Review v2-roadmap.md for future features

Your local Investment Relationship Management system is now ready for development and testing!