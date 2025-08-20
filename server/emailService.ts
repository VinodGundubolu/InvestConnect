import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import type { Investor } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set - email notifications will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Email would be sent:", params.subject, "to", params.to);
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    console.log(`Email sent successfully to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(investor: Investor): Promise<boolean> {
  if (!investor.email) {
    console.log(`Skipping welcome email for investor ${investor.id} - no email address`);
    return false;
  }
  
  const subject = `Welcome to IRM Investment Platform - Your Investment Journey Begins!`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to IRM Investment Platform</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 30px; }
        .welcome-section { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .detail-item { background-color: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
        .detail-label { font-weight: 600; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { font-size: 16px; color: #333; margin-top: 5px; }
        .login-info { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .login-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
        .login-method { background-color: white; padding: 10px; border-radius: 4px; font-size: 14px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .highlight { color: #667eea; font-weight: 600; }
        @media (max-width: 600px) {
          .details-grid, .login-methods { grid-template-columns: 1fr; }
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to IRM Investment Platform</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Investment Journey Starts Here</p>
        </div>
        
        <div class="content">
          <div class="welcome-section">
            <h2 style="margin-top: 0; color: #333;">Hello ${investor.firstName} ${investor.lastName}!</h2>
            <p>Congratulations on joining our Investment Relationship Management platform. We're excited to help you grow your wealth with our premium investment opportunities.</p>
          </div>

          <h3 style="color: #667eea; border-bottom: 2px solid #eee; padding-bottom: 10px;">📋 Your Account Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Investor ID</div>
              <div class="detail-value">${investor.id}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Full Name</div>
              <div class="detail-value">${investor.firstName} ${investor.lastName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Email Address</div>
              <div class="detail-value">${investor.email}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Mobile Number</div>
              <div class="detail-value">${investor.primaryMobile}</div>
            </div>
          </div>

          <div class="login-info">
            <h3 style="margin-top: 0; color: #1976d2;">🔐 Multiple Login Options</h3>
            <p>You can access your investment portal using any of these methods:</p>
            <div class="login-methods">
              <div class="login-method"><strong>Investor ID:</strong> ${investor.id}</div>
              <div class="login-method"><strong>Email:</strong> ${investor.email}</div>
              <div class="login-method"><strong>Phone:</strong> ${investor.primaryMobile}</div>
              <div class="login-method"><strong>Username:</strong> Available after first login</div>
            </div>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>Login URL:</strong> <span class="highlight">https://your-domain.replit.app/login</span>
            </p>
          </div>

          <h3 style="color: #667eea; border-bottom: 2px solid #eee; padding-bottom: 10px;">💰 Investment Opportunities</h3>
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Investment Units:</strong> ₹20,00,000 per unit (Max 3 units = ₹60,00,000)</li>
              <li><strong>Interest Rates:</strong> 0% (Year 1), 6% (Year 2), 9% (Year 3), 12% (Year 4), 18% (Year 5+)</li>
              <li><strong>Lock-in Period:</strong> 3 years minimum</li>
              <li><strong>Milestone Bonuses:</strong> ₹20,00,000 at Year 5 + ₹20,00,000 at Year 10</li>
              <li><strong>Interest Disbursement:</strong> Annually on 24th of investment anniversary month</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-domain.replit.app/login" class="cta-button">
              Access Your Investment Portal →
            </a>
          </div>

          <h3 style="color: #667eea; border-bottom: 2px solid #eee; padding-bottom: 10px;">📧 What's Next?</h3>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px;">
            <ul style="margin: 0; padding-left: 20px;">
              <li>Complete your KYC documentation</li>
              <li>Review available investment plans</li>
              <li>Make your first investment</li>
              <li>Receive monthly progress reports via email</li>
              <li>Track your investment growth in real-time</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p><strong>IRM Investment Platform</strong></p>
          <p>Building wealth through smart investments since 2024</p>
          <p style="margin-top: 15px; font-size: 12px;">
            This is an automated message. Please do not reply to this email.<br>
            For support, contact us through your investor portal.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to IRM Investment Platform!

Hello ${investor.firstName} ${investor.lastName},

Congratulations on joining our Investment Relationship Management platform.

Your Account Details:
- Investor ID: ${investor.id}
- Email: ${investor.email}
- Mobile: ${investor.primaryMobile}

Login Options:
You can access your portal using your Investor ID, Email, Phone, or Username.
Login URL: https://your-domain.replit.app/login

Investment Opportunities:
- Units: ₹20,00,000 each (Max 3 units)
- Interest: 0%, 6%, 9%, 12%, 18% by year
- Bonuses: ₹20L at Year 5 + ₹20L at Year 10
- Disbursement: Annually on 24th of anniversary month

What's Next:
1. Complete KYC documentation
2. Review investment plans
3. Make your first investment
4. Receive monthly progress reports

Access your portal: https://your-domain.replit.app/login

Best regards,
IRM Investment Platform Team
  `;

  return await sendEmail({
    to: investor.email,
    from: 'noreply@irm-platform.com', // Replace with your verified sender
    subject,
    text: textContent,
    html: htmlContent
  });
}

// Generate merge fields for monthly progress reports  
function generateEmailMergeFields(investor: Investor, investorWithInvestments: any, 
  totalInterestEarned: number, totalInterestDisbursed: number, nextDisbursement: any): any {
  const now = new Date();
  const totalPrincipal = investorWithInvestments.investments.reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0);
  const totalCurrentValue = totalPrincipal + totalInterestEarned;
  const totalUnits = investorWithInvestments.investments.length;
  
  return {
    // Investor Information
    investorName: `${investor.firstName} ${investor.lastName}`,
    investorFirstName: investor.firstName || '',
    investorId: investor.id?.toString() || '',
    investorEmail: investor.email || '',
    investorPhone: investor.primaryMobile || '',
    
    // Company Information  
    companyName: "IRM Investment Management",
    companyAddress: "Investment House, Business District, Mumbai - 400001",
    companyPhone: "+91-22-1234-5678",
    companyEmail: "investments@irmgroup.com",
    companyWebsite: "www.irmgroup.com",
    
    // Report Information
    reportMonth: now.toLocaleString('en-US', { month: 'long' }),
    reportYear: now.getFullYear().toString(),
    reportDate: now.toLocaleDateString('en-IN'),
    generatedDate: now.toISOString(),
    
    // Investment Totals
    totalInvestmentAmount: `₹${(totalPrincipal / 100000).toFixed(1)} lakhs`,
    totalUnits: totalUnits.toString(),
    totalCurrentValue: `₹${(totalCurrentValue / 100000).toFixed(2)} lakhs`,
    totalInterestEarned: `₹${(totalInterestEarned / 100000).toFixed(2)} lakhs`,
    totalInterestDisbursed: `₹${(totalInterestDisbursed / 100000).toFixed(2)} lakhs`,
    pendingInterest: `₹${((totalInterestEarned - totalInterestDisbursed) / 100000).toFixed(2)} lakhs`,
    
    // Next Disbursement
    nextDisbursementAmount: nextDisbursement.amount ? `₹${(nextDisbursement.amount / 100000).toFixed(2)} lakhs` : 'N/A',
    nextDisbursementDate: nextDisbursement.date || 'N/A',
    nextDisbursementYear: nextDisbursement.year?.toString() || 'N/A',
    
    // Performance Metrics
    averageReturn: totalPrincipal > 0 ? `${((totalInterestEarned / totalPrincipal) * 100).toFixed(2)}%` : '0%',
    portfolioGrowth: totalPrincipal > 0 ? `${(((totalCurrentValue - totalPrincipal) / totalPrincipal) * 100).toFixed(2)}%` : '0%',
  };
}

// Template replacement helper
function applyEmailMergeFields(template: string, mergeFields: any): string {
  let result = template;
  for (const [key, value] of Object.entries(mergeFields)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value as string);
  }
  return result;
}

export async function sendMonthlyProgressReport(investor: Investor): Promise<boolean> {
  try {
    // Get investor's investment data
    const investorWithInvestments = await storage.getInvestorWithInvestments(investor.id);
    if (!investorWithInvestments || !investorWithInvestments.investments.length) {
      console.log(`No investments found for investor ${investor.id}, skipping monthly report`);
      return false;
    }

    // Calculate total interest and disbursed amounts
    let totalInterestEarned = 0;
    let totalInterestDisbursed = 0;
    let nextDisbursement = { amount: 0, date: '', year: 0 };

    // Get interest details for calculations
    const response = await fetch(`http://localhost:5000/api/investor/interest-details?investorId=${investor.id}`);
    if (response.ok) {
      const interestData = await response.json();
      totalInterestEarned = interestData.totalInterestTillDate || 0;
      totalInterestDisbursed = interestData.totalInterestDisbursedTillDate || 0;
      nextDisbursement = interestData.interestToBeDispursedNext || { amount: 0, date: '', year: 0 };
    }

    // Generate merge fields
    const mergeFields = generateEmailMergeFields(investor, investorWithInvestments, 
      totalInterestEarned, totalInterestDisbursed, nextDisbursement);

    const subject = `Monthly Investment Report - {{reportMonth}} {{reportYear}} | {{investorName}}`;

    const htmlContentTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Investment Report - {{reportMonth}} {{reportYear}}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 680px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
          .header { background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .report-date { font-size: 15px; opacity: 0.9; margin-top: 8px; }
          .content { padding: 30px; }
          .investor-info { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #dee2e6; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 18px; margin: 25px 0; }
          .stat-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1); }
          .stat-value { font-size: 24px; font-weight: 700; color: #1565c0; margin-bottom: 8px; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
          .performance-section { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #a5d6a7; }
          .next-disbursement { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #ffcc02; }
          .milestone-section { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #ce93d8; }
          .footer { background: #2e7d32; color: white; padding: 25px 30px; text-align: center; }
          .section-title { color: #2e7d32; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #4caf50; padding-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📊 Monthly Investment Report</h1>
            <div class="report-date">{{reportMonth}} {{reportYear}} Report | {{companyName}}</div>
            <div style="font-size: 13px; margin-top: 8px; opacity: 0.8;">Generated on {{reportDate}} for {{investorName}}</div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Investor Information -->
            <div class="investor-info">
              <div class="section-title">👤 Investor Profile</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> {{investorName}}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Investor ID:</strong> {{investorId}}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> {{investorEmail}}</p>
                </div>
                <div>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> {{investorPhone}}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Report Period:</strong> {{reportMonth}} {{reportYear}}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Total Units:</strong> {{totalUnits}}</p>
                </div>
              </div>
            </div>

            <!-- Portfolio Overview -->
            <div class="section-title">💼 Portfolio Overview</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{totalInvestmentAmount}}</div>
                <div class="stat-label">Total Investment</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{totalCurrentValue}}</div>
                <div class="stat-label">Current Value</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{totalInterestEarned}}</div>
                <div class="stat-label">Total Interest Earned</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{totalInterestDisbursed}}</div>
                <div class="stat-label">Interest Disbursed</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{pendingInterest}}</div>
                <div class="stat-label">Pending Interest</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{portfolioGrowth}}</div>
                <div class="stat-label">Portfolio Growth</div>
              </div>
            </div>

            <!-- Performance Summary -->
            <div class="performance-section">
              <div class="section-title">📈 Performance Summary</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2e7d32;">Average Return Rate</h4>
                  <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2e7d32;">{{averageReturn}}</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Based on total interest earned vs principal</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #2e7d32;">Investment Duration</h4>
                  <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2e7d32;">Active</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Long-term growth strategy</p>
                </div>
              </div>
            </div>

            <!-- Next Disbursement -->
            <div class="next-disbursement">
              <div class="section-title">💰 Upcoming Disbursement</div>
              <div style="text-align: center; margin: 15px 0;">
                <div style="font-size: 20px; font-weight: 700; color: #f57c00; margin-bottom: 10px;">{{nextDisbursementAmount}}</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Expected disbursement date: <strong>{{nextDisbursementDate}}</strong></div>
                <div style="font-size: 13px; color: #666;">Investment Year: {{nextDisbursementYear}}</div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; font-size: 13px; color: #e65100; text-align: center;">
                  Interest disbursements are processed automatically on the 24th of your investment anniversary month.
                </p>
              </div>
            </div>

            <!-- Investment Milestone Information -->
            <div class="milestone-section">
              <div class="section-title">🎯 Investment Milestones</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #7b1fa2;">5-Year Milestone</h4>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #7b1fa2;">₹20 lakhs bonus</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Upon completion of 5 years</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #7b1fa2;">10-Year Milestone</h4>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #7b1fa2;">₹20 lakhs bonus</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Upon full term completion</p>
                </div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; font-size: 13px; color: #4a148c; text-align: center;">
                  Milestone bonuses are in addition to regular interest payments and significantly enhance your total returns.
                </p>
              </div>
            </div>

            <!-- Contact Information -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <div class="section-title">📞 Need Assistance?</div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                For questions about your investment or this report, contact our team:<br>
                <strong>Phone:</strong> {{companyPhone}} | <strong>Email:</strong> {{companyEmail}}<br>
                <strong>Website:</strong> {{companyWebsite}} | <strong>Address:</strong> {{companyAddress}}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <h4 style="margin: 0 0 10px 0; font-size: 18px;">{{companyName}}</h4>
            <p style="margin: 0; font-size: 13px; opacity: 0.9;">Your Trusted Investment Partner Since {{reportYear}}</p>
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.3); margin: 15px 0; padding-top: 15px;">
              <p style="margin: 0; font-size: 11px; opacity: 0.8; line-height: 1.4;">
                This report was generated automatically on {{generatedDate}}. Please keep this email for your records.<br>
                Monthly Investment Report System • {{reportYear}} • Confidential Information
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>`;

    // Apply merge fields to templates
    const finalHtmlContent = applyEmailMergeFields(htmlContentTemplate, mergeFields);
    const finalSubject = applyEmailMergeFields(subject, mergeFields);

    // Create text version
    const textContent = `
Monthly Investment Report - ${mergeFields.reportMonth} ${mergeFields.reportYear}

Dear ${mergeFields.investorName},

This is your comprehensive monthly investment report for ${mergeFields.reportMonth} ${mergeFields.reportYear}.

PORTFOLIO OVERVIEW:
- Total Investment: ${mergeFields.totalInvestmentAmount}
- Current Portfolio Value: ${mergeFields.totalCurrentValue}
- Total Interest Earned: ${mergeFields.totalInterestEarned}
- Interest Disbursed: ${mergeFields.totalInterestDisbursed}
- Pending Interest: ${mergeFields.pendingInterest}
- Portfolio Growth: ${mergeFields.portfolioGrowth}

PERFORMANCE SUMMARY:
- Average Return Rate: ${mergeFields.averageReturn}
- Total Investment Units: ${mergeFields.totalUnits}

NEXT DISBURSEMENT:
- Amount: ${mergeFields.nextDisbursementAmount}
- Expected Date: ${mergeFields.nextDisbursementDate}
- Investment Year: ${mergeFields.nextDisbursementYear}

MILESTONE BONUSES:
- 5-Year Completion: ₹20 lakhs bonus
- 10-Year Completion: ₹20 lakhs bonus

For any questions, contact us:
Phone: ${mergeFields.companyPhone}
Email: ${mergeFields.companyEmail}
Website: ${mergeFields.companyWebsite}

Best regards,
${mergeFields.companyName} Team

Generated on ${mergeFields.generatedDate}
    `;

    if (!investor.email) {
      console.log(`No email address for investor ${investor.id}, skipping monthly report`);
      return false;
    }

    return await sendEmail({
      to: investor.email,
      from: 'noreply@irm-platform.com',
      subject: finalSubject,
      text: textContent,
      html: finalHtmlContent
    });

  } catch (error) {
    console.error(`Error sending monthly report for investor ${investor.id}:`, error);
    return false;
  }
}

export async function sendMonthlyReportsToAllInvestors(): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };
  
  try {
    const allInvestors = await storage.getAllInvestors();
    
    for (const investor of allInvestors) {
      if (investor.email) {
        const success = await sendMonthlyProgressReport(investor);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(`Skipping investor ${investor.id} - no email address`);
        results.failed++;
      }
    }
    
    console.log(`Monthly reports completed: ${results.sent} sent, ${results.failed} failed`);
  } catch (error) {
    console.error('Error sending monthly reports:', error);
  }
  
  return results;
}