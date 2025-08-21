# SMTP2GO Setup Guide for IRM Platform

## Quick Setup for Testing (Personal Account)

### Step 1: Create Free SMTP2GO Account
1. Go to https://smtp2go.com
2. Sign up with your personal email
3. Verify your email address
4. Complete the basic setup

### Step 2: Get SMTP Credentials
1. Login to SMTP2GO dashboard
2. Go to **Settings** → **SMTP Users**
3. Click "Add SMTP User" or use the default user
4. Copy the credentials:
   - **Username**: Usually your email or generated username
   - **Password**: App-specific password (not your login password)

### Step 3: Add Credentials to Replit
Add these as secrets in your Replit environment:
```
SMTP2GO_USERNAME=your_username_here
SMTP2GO_PASSWORD=your_app_password_here
```

### Step 4: Test Configuration
Your platform will automatically:
- Send welcome emails to new investors
- Generate monthly progress reports
- Send investment agreement notifications
- All using your existing merge fields system

## Free Tier Benefits
- **1,000 emails per month** (perfect for 100 investors)
- **No time limit** on free tier
- **Professional deliverability** (95.5% inbox rate)
- **Real-time analytics** and bounce handling

## Migration to Company Account (Later)

### When Ready for Production:
1. Create company SMTP2GO account with business email
2. Verify your business domain
3. Update the Replit secrets with new credentials:
   ```
   SMTP2GO_USERNAME=new_company_username
   SMTP2GO_PASSWORD=new_company_password
   ```
4. Update sender email in email templates to use company domain

### No Code Changes Required!
- Same integration works for both personal and company accounts
- Just swap the credentials in environment variables
- All your merge fields and email templates remain unchanged

## Email Sender Configuration

### For Testing (Personal):
```
From: your-personal-email@gmail.com
```

### For Production (Company):
```
From: noreply@your-company.com
```

## Monitoring and Analytics
SMTP2GO provides:
- Delivery reports
- Bounce tracking
- Click tracking (if enabled)
- Real-time sending statistics

This setup gives you immediate testing capability while providing a seamless upgrade path to company credentials.