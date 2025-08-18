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
      text: params.text,
      html: params.html,
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

export async function sendMonthlyProgressReport(investor: Investor): Promise<boolean> {
  try {
    // Get investor's investment data
    const investorWithInvestments = await storage.getInvestorWithInvestments(investor.id);
    if (!investorWithInvestments || !investorWithInvestments.investments.length) {
      console.log(`No investments found for investor ${investor.id}, skipping monthly report`);
      return false;
    }

    const investments = investorWithInvestments.investments;
    const totalPrincipal = investments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
    
    // Calculate current month and year
    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();

    const subject = `Monthly Investment Report - ${monthName} ${year} | Investor ID: ${investor.id}`;

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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Investment Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; padding: 25px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
          .report-date { font-size: 14px; opacity: 0.9; margin-top: 5px; }
          .content { padding: 25px; }
          .investor-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
          .stat-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 18px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 22px; font-weight: 700; color: #1565c0; margin-bottom: 5px; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .investment-card { background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; }
          .investment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .investment-id { font-weight: 600; color: #2e7d32; }
          .investment-date { color: #666; font-size: 14px; }
          .investment-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
          .detail-item { text-align: center; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
          .detail-value { font-weight: 600; color: #333; font-size: 16px; }
          .detail-label { font-size: 11px; color: #666; text-transform: uppercase; }
          .next-disbursement { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
          .milestone-section { background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .progress-bar { background-color: #e0e0e0; border-radius: 10px; height: 8px; margin: 10px 0; }
          .progress-fill { background: linear-gradient(90deg, #4caf50 0%, #2e7d32 100%); height: 100%; border-radius: 10px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .highlight { color: #2e7d32; font-weight: 600; }
          @media (max-width: 600px) {
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .investment-details { grid-template-columns: 1fr 1fr; }
            .content { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Monthly Investment Report</h1>
            <div class="report-date">${monthName} ${year} Report</div>
          </div>
          
          <div class="content">
            <div class="investor-info">
              <h2 style="margin-top: 0; color: #333;">Hello ${investor.firstName} ${investor.lastName}</h2>
              <p style="margin-bottom: 0;"><strong>Investor ID:</strong> ${investor.id} | <strong>Report Date:</strong> ${now.toLocaleDateString('en-IN')}</p>
            </div>

            <h3 style="color: #2e7d32; border-bottom: 2px solid #eee; padding-bottom: 8px;">💰 Portfolio Summary</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">₹${(totalPrincipal / 100000).toFixed(1)}L</div>
                <div class="stat-label">Total Principal</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">₹${(totalInterestEarned / 100000).toFixed(1)}L</div>
                <div class="stat-label">Interest Earned</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">₹${(totalInterestDisbursed / 100000).toFixed(1)}L</div>
                <div class="stat-label">Interest Received</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${investments.length}</div>
                <div class="stat-label">Active Investments</div>
              </div>
            </div>

            ${nextDisbursement.amount > 0 ? `
            <div class="next-disbursement">
              <h3 style="margin-top: 0; color: #ef6c00;">🎯 Next Interest Disbursement</h3>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Amount:</strong> <span class="highlight">₹${(nextDisbursement.amount / 100000).toFixed(1)} Lakhs</span></p>
              <p style="margin: 5px 0;"><strong>Expected Date:</strong> ${nextDisbursement.date}</p>
              <p style="margin: 5px 0;"><strong>Coverage:</strong> Year ${nextDisbursement.year} Interest</p>
            </div>
            ` : ''}

            <h3 style="color: #2e7d32; border-bottom: 2px solid #eee; padding-bottom: 8px;">📈 Investment Breakdown</h3>
            ${investments.map((investment, index) => {
              const investmentDate = new Date(investment.investmentDate);
              const yearsElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              const monthsElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
              const progressPercent = Math.min((monthsElapsed / 120) * 100, 100); // 10 years = 120 months
              
              return `
              <div class="investment-card">
                <div class="investment-header">
                  <div class="investment-id">Investment #${index + 1}</div>
                  <div class="investment-date">Started: ${investmentDate.toLocaleDateString('en-IN')}</div>
                </div>
                <div class="investment-details">
                  <div class="detail-item">
                    <div class="detail-value">₹${(parseFloat(investment.investedAmount) / 100000).toFixed(1)}L</div>
                    <div class="detail-label">Principal</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-value">${investment.bondsPurchased}</div>
                    <div class="detail-label">Bonds</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-value">${yearsElapsed + 1}</div>
                    <div class="detail-label">Current Year</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-value">${monthsElapsed} months</div>
                    <div class="detail-label">Total Duration</div>
                  </div>
                </div>
                <div style="margin-top: 15px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Investment Progress</div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                  </div>
                  <div style="font-size: 12px; color: #666; text-align: right;">${progressPercent.toFixed(1)}% Complete</div>
                </div>
              </div>
              `;
            }).join('')}

            <div class="milestone-section">
              <h3 style="margin-top: 0; color: #7b1fa2;">🏆 Milestone Bonuses</h3>
              <p><strong>Year 5 Completion:</strong> ₹20,00,000 bonus (100% of investment)</p>
              <p><strong>Year 10 Completion:</strong> ₹20,00,000 additional bonus (100% of investment)</p>
              <p style="font-size: 14px; color: #666; margin-top: 15px;">
                These milestone bonuses are paid separately from regular interest disbursements upon completion of the respective years.
              </p>
            </div>

            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">📞 Need Assistance?</h3>
              <p style="margin-bottom: 0;">
                Access your complete investment dashboard at: 
                <a href="https://your-domain.replit.app/login" style="color: #2e7d32; font-weight: 600;">Investor Portal</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Login with your Investor ID, Email, Phone, or Username.
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>IRM Investment Platform</strong></p>
            <p>Monthly Report Generated on ${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN')}</p>
            <p style="margin-top: 15px; font-size: 12px;">
              This is an automated monthly report. For queries, access your investor portal.<br>
              Next report will be sent on ${new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Monthly Investment Report - ${monthName} ${year}
Investor: ${investor.firstName} ${investor.lastName} (ID: ${investor.id})
Report Date: ${now.toLocaleDateString('en-IN')}

PORTFOLIO SUMMARY:
- Total Principal: ₹${(totalPrincipal / 100000).toFixed(1)} Lakhs
- Interest Earned: ₹${(totalInterestEarned / 100000).toFixed(1)} Lakhs  
- Interest Received: ₹${(totalInterestDisbursed / 100000).toFixed(1)} Lakhs
- Active Investments: ${investments.length}

${nextDisbursement.amount > 0 ? `
NEXT DISBURSEMENT:
- Amount: ₹${(nextDisbursement.amount / 100000).toFixed(1)} Lakhs
- Date: ${nextDisbursement.date}
- Coverage: Year ${nextDisbursement.year} Interest
` : ''}

INVESTMENT BREAKDOWN:
${investments.map((investment, index) => {
  const investmentDate = new Date(investment.investmentDate);
  const monthsElapsed = Math.floor((now.getTime() - investmentDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  return `
Investment #${index + 1}:
- Principal: ₹${(parseFloat(investment.investedAmount) / 100000).toFixed(1)} Lakhs
- Bonds: ${investment.bondsPurchased}
- Started: ${investmentDate.toLocaleDateString('en-IN')}
- Duration: ${monthsElapsed} months
`;
}).join('')}

MILESTONE BONUSES:
- Year 5: ₹20,00,000 bonus (100% of investment)
- Year 10: ₹20,00,000 bonus (100% of investment)

Access your portal: https://your-domain.replit.app/login

Best regards,
IRM Investment Platform Team
    `;

    return await sendEmail({
      to: investor.email,
      from: 'reports@irm-platform.com', // Replace with your verified sender
      subject,
      text: textContent,
      html: htmlContent
    });

  } catch (error) {
    console.error(`Error sending monthly report to investor ${investor.id}:`, error);
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