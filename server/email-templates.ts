// Email template system with merge fields
export interface EmailMergeFields {
  // Investor details
  investorName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  investorId?: string;
  
  // Investment details
  investmentAmount?: number;
  bondUnits?: number;
  investmentDate?: string;
  maturityDate?: string;
  
  // Credentials
  username?: string;
  password?: string;
  
  // Portal URLs
  investorPortalUrl?: string;
  adminPortalUrl?: string;
  
  // Company details
  companyName?: string;
  supportEmail?: string;
  
  // Dynamic content
  currentDate?: string;
  currentYear?: number;
}

export class EmailTemplateEngine {
  private static readonly DEFAULT_COMPANY_NAME = "Investment Relationship Management System";
  private static readonly DEFAULT_SUPPORT_EMAIL = "viku2615@gmail.com";
  
  /**
   * Replace merge fields in template with actual values
   */
  static mergeTags(template: string, fields: EmailMergeFields): string {
    let result = template;
    
    // Replace all merge fields using {{fieldName}} syntax
    Object.entries(fields).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });
    
    // Replace default values
    result = result.replace(/{{companyName}}/g, this.DEFAULT_COMPANY_NAME);
    result = result.replace(/{{supportEmail}}/g, this.DEFAULT_SUPPORT_EMAIL);
    result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('en-IN'));
    result = result.replace(/{{currentYear}}/g, new Date().getFullYear().toString());
    
    return result;
  }
  
  /**
   * Format currency for Indian locale
   */
  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  
  /**
   * Generate investor creation email
   */
  static getInvestorCreationTemplate(): string {
    return `
📈 {{companyName}}
🔔 New Investor Account Created

👤 Investor Details:
Name: {{investorName}}
Email: {{email}}
Phone: {{phone}}
Investment Amount: {{investmentAmount}}
Bond Units: {{bondUnits}}
Investment Date: {{investmentDate}}

🔐 Login Credentials:
Username: {{username}}
Password: {{password}}

🌐 Investor Portal Access:
{{investorPortalUrl}}

📝 Important Information:
- Please share these credentials securely with the investor
- Investor can access their portfolio and track returns through the portal
- Initial investment lock-in period: 3 years
- Interest rates vary by year: 0% (Year 1), 6% (Year 2), 9% (Year 3), 12% (Year 4), 18% (Year 5+)

Best regards,
IRM System Team
{{companyName}}

📧 Support: {{supportEmail}}
📅 Generated on: {{currentDate}}
    `.trim();
  }
  
  /**
   * Generate profile update notification template
   */
  static getProfileUpdateTemplate(): string {
    return `
📈 {{companyName}}
📝 Investor Profile Update Notification

👤 Investor Information:
Name: {{investorName}} (ID: {{investorId}})
Email: {{email}}
Phone: {{phone}}

🔄 Profile Updated:
The investor has updated their profile information on {{currentDate}}.

📋 Please review the changes in the admin portal:
{{adminPortalUrl}}

Best regards,
IRM System Team
{{companyName}}

📧 Support: {{supportEmail}}
    `.trim();
  }
  
  /**
   * Generate investment maturity notification template
   */
  static getMaturityNotificationTemplate(): string {
    return `
📈 {{companyName}}
🎉 Investment Maturity Notification

👤 Investor: {{investorName}}
💰 Investment Amount: {{investmentAmount}}
🏦 Bond Units: {{bondUnits}}
📅 Maturity Date: {{maturityDate}}

✅ Congratulations! Your investment has reached maturity.
💳 Please contact us to discuss payout options and renewal opportunities.

🌐 Access your portfolio:
{{investorPortalUrl}}

Best regards,
IRM System Team
{{companyName}}

📧 Contact us: {{supportEmail}}
📅 {{currentDate}}
    `.trim();
  }
  
  /**
   * Generate welcome email for new investors
   */
  static getWelcomeTemplate(): string {
    return `
📈 Welcome to {{companyName}}!

Dear {{firstName}},

🎉 Welcome to our Investment Relationship Management platform!

👤 Your Account Details:
Name: {{investorName}}
Email: {{email}}
Investor ID: {{investorId}}

💰 Investment Summary:
Amount: {{investmentAmount}}
Bond Units: {{bondUnits}}
Start Date: {{investmentDate}}

🔐 Your Login Credentials:
Username: {{username}}
Password: {{password}}

🌐 Access Your Portfolio:
{{investorPortalUrl}}

📊 Key Features:
- Track your investment performance
- View detailed transaction history
- Monitor interest accruals
- Access important documents
- Update your profile information

📋 Important Reminders:
- Keep your login credentials secure
- Review your portfolio regularly
- Contact support for any questions

We're excited to have you as an investor!

Best regards,
The IRM Team
{{companyName}}

📧 Support: {{supportEmail}}
📞 For immediate assistance, please email us
📅 {{currentDate}}
    `.trim();
  }
}