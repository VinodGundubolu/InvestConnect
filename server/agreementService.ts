import { randomUUID } from "crypto";
import { storage } from "./storage";
import { sendEmail } from "./emailService";
import crypto from "crypto";

export interface AgreementMergeFields {
  // Investor Information
  investorName: string;
  investorFirstName: string;
  investorLastName: string;
  investorEmail: string;
  investorPhone: string;
  investorId: string;
  investorAddress: string;
  
  // Company Information
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  // Investment Details
  investmentAmount: string;
  investmentAmountWords: string;
  totalInvestmentLimit: string;
  maximumUnits: string;
  investmentDate: string;
  maturityDate: string;
  lockInPeriod: string;
  investmentTerm: string;
  
  // Interest & Returns
  interestRate: string;
  year1Interest: string;
  year2Interest: string;
  year3Interest: string;
  year4Interest: string;
  year5PlusInterest: string;
  milestone5YearBonus: string;
  milestone10YearBonus: string;
  interestDisbursementDate: string;
  
  // Agreement Details
  agreementDate: string;
  agreementId: string;
  agreementVersion: string;
  documentHash: string;
  expiryDate: string;
  signatureUrl: string;
  
  // Legal & Compliance
  governingLaw: string;
  jurisdiction: string;
  regulatoryCompliance: string;
  
  // System Information
  generatedDate: string;
  currentYear: string;
  currentMonth: string;
  currentDay: string;
}

export class AgreementService {
  
  // Helper function to convert number to words (Indian format)
  private numberToWords(amount: number): string {
    const crores = Math.floor(amount / 10000000);
    const lakhs = Math.floor((amount % 10000000) / 100000);
    const thousands = Math.floor((amount % 100000) / 1000);
    const hundreds = Math.floor((amount % 1000) / 100);
    const tens = amount % 100;
    
    let words = [];
    if (crores > 0) words.push(`${crores} crore${crores > 1 ? 's' : ''}`);
    if (lakhs > 0) words.push(`${lakhs} lakh${lakhs > 1 ? 's' : ''}`);
    if (thousands > 0) words.push(`${thousands} thousand`);
    if (hundreds > 0) words.push(`${hundreds} hundred`);
    if (tens > 0) words.push(`${tens}`);
    
    return words.join(' ') + ' rupees';
  }

  // Generate comprehensive merge fields
  private generateMergeFields(investor: any, agreementId: string, expiresAt: Date): AgreementMergeFields {
    const today = new Date();
    const maturityDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
    const investmentAmount = 2000000; // ₹20,00,000
    
    return {
      // Investor Information
      investorName: `${investor.firstName} ${investor.lastName}`,
      investorFirstName: investor.firstName || '',
      investorLastName: investor.lastName || '',
      investorEmail: investor.email || '',
      investorPhone: investor.phoneNumber || '',
      investorId: investor.id?.toString() || '',
      investorAddress: investor.address || 'Address on file',
      
      // Company Information
      companyName: "IRM Investment Management",
      companyAddress: "Investment House, Business District, Mumbai - 400001",
      companyPhone: "+91-22-1234-5678",
      companyEmail: "investments@irmgroup.com",
      companyWebsite: "www.irmgroup.com",
      
      // Investment Details
      investmentAmount: `₹${(investmentAmount / 100000).toFixed(0)} lakhs`,
      investmentAmountWords: this.numberToWords(investmentAmount),
      totalInvestmentLimit: "₹60 lakhs (3 units maximum)",
      maximumUnits: "3",
      investmentDate: today.toLocaleDateString('en-IN'),
      maturityDate: maturityDate.toLocaleDateString('en-IN'),
      lockInPeriod: "3 years",
      investmentTerm: "10 years",
      
      // Interest & Returns
      interestRate: "0% to 18% per annum (progressive)",
      year1Interest: "0% (No interest)",
      year2Interest: "6% per annum",
      year3Interest: "9% per annum", 
      year4Interest: "12% per annum",
      year5PlusInterest: "18% per annum",
      milestone5YearBonus: "₹20 lakhs per unit",
      milestone10YearBonus: "₹20 lakhs per unit",
      interestDisbursementDate: "24th of investment anniversary month",
      
      // Agreement Details
      agreementDate: today.toLocaleDateString('en-IN'),
      agreementId: agreementId,
      agreementVersion: "2.1",
      documentHash: "Generated upon finalization",
      expiryDate: expiresAt.toLocaleDateString('en-IN'),
      signatureUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/agreement/sign/${agreementId}`,
      
      // Legal & Compliance
      governingLaw: "Laws of India",
      jurisdiction: "Mumbai High Court",
      regulatoryCompliance: "SEBI & RBI Guidelines",
      
      // System Information
      generatedDate: today.toISOString(),
      currentYear: today.getFullYear().toString(),
      currentMonth: today.toLocaleDateString('en-IN', { month: 'long' }),
      currentDay: today.getDate().toString(),
    };
  }

  // Create and send agreement to investor
  async createAndSendAgreement(investorId: string, templateId: string = "default", expiresInDays: number = 30): Promise<string> {
    try {
      const investor = await storage.getInvestor(investorId);
      if (!investor) {
        throw new Error("Investor not found");
      }

      // Get the default agreement template
      const template = await this.getDefaultTemplate();
      
      // Generate agreement ID
      const agreementId = randomUUID();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      
      // Generate comprehensive merge fields
      const mergeFields = this.generateMergeFields(investor, agreementId, expiresAt);
      
      // Generate agreement content with investor data
      const agreementContent = this.mergeTemplate(template.content, mergeFields);

      // Create agreement record
      const documentHash = this.generateDocumentHash(agreementContent);

      const agreement = await storage.createInvestorAgreement({
        id: agreementId,
        investorId,
        templateId,
        agreementContent,
        status: "pending",
        sentAt: new Date(),
        documentHash,
        expiresAt,
      });

      // Log the action
      await this.logAgreementAction(agreementId, "sent", "system", undefined, "Agreement sent to investor");

      // Send email with agreement using merge fields
      await this.sendAgreementEmail(investor, agreement, mergeFields);

      return agreementId;
    } catch (error) {
      console.error("Error creating and sending agreement:", error);
      throw error;
    }
  }

  // Sign agreement
  async signAgreement(agreementId: string, signature: string, signatoryName: string, signatoryEmail: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    try {
      const agreement = await storage.getInvestorAgreement(agreementId);
      if (!agreement) {
        throw new Error("Agreement not found");
      }

      if (agreement.status !== "pending") {
        throw new Error("Agreement is not in pending status");
      }

      if (agreement.expiresAt && new Date() > agreement.expiresAt) {
        throw new Error("Agreement has expired");
      }

      // Update agreement with signature
      await storage.updateInvestorAgreement(agreementId, {
        status: "signed",
        signedAt: new Date(),
        signature,
        signatoryName,
        signatoryEmail,
        ipAddress,
        userAgent,
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAgreementAction(agreementId, "signed", agreement.investorId, ipAddress || undefined, `Agreement signed by ${signatoryName}`);

      // Send confirmation email to admin and investor
      await this.sendSignatureConfirmationEmails(agreement);

      return true;
    } catch (error) {
      console.error("Error signing agreement:", error);
      throw error;
    }
  }

  // Get agreement for signing
  async getAgreementForSigning(agreementId: string): Promise<any> {
    const agreement = await storage.getInvestorAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    // Log the view action
    await this.logAgreementAction(agreementId, "viewed", agreement.investorId, undefined, "Agreement viewed");

    return {
      ...agreement,
      isExpired: agreement.expiresAt && new Date() > agreement.expiresAt,
      canSign: agreement.status === "pending" && (!agreement.expiresAt || new Date() <= agreement.expiresAt)
    };
  }

  // Get investor agreements
  async getInvestorAgreements(investorId: string): Promise<any[]> {
    return await storage.getInvestorAgreements(investorId);
  }

  // Get all agreements (admin view)
  async getAllAgreements(): Promise<any[]> {
    return await storage.getAllInvestorAgreements();
  }

  // Resend agreement
  async resendAgreement(agreementId: string): Promise<boolean> {
    try {
      const agreement = await storage.getInvestorAgreement(agreementId);
      if (!agreement) {
        throw new Error("Agreement not found");
      }

      const investor = await storage.getInvestor(agreement.investorId);
      if (!investor) {
        throw new Error("Investor not found");
      }

      // Update sent timestamp
      await storage.updateInvestorAgreement(agreementId, {
        sentAt: new Date(),
        updatedAt: new Date(),
      });

      // Send email again
      await this.sendAgreementEmail(investor, agreement);

      // Log the action
      await this.logAgreementAction(agreementId, "reminded", "admin", null, "Agreement resent to investor");

      return true;
    } catch (error) {
      console.error("Error resending agreement:", error);
      throw error;
    }
  }

  // Private helper methods
  private async getDefaultTemplate(): Promise<any> {
    let template = await storage.getAgreementTemplate("default");
    
    if (!template) {
      // Create default template if it doesn't exist
      const defaultContent = this.getDefaultAgreementContent();
      template = await storage.createAgreementTemplate({
        id: "default",
        name: "Standard Investment Agreement",
        version: "1.0",
        title: "Investment Partnership Agreement",
        content: defaultContent,
        isActive: true,
      });
    }
    
    return template;
  }

  private mergeTemplate(content: string, fields: AgreementMergeFields): string {
    let mergedContent = content;
    
    Object.entries(fields).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      mergedContent = mergedContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return mergedContent;
  }

  private generateDocumentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async logAgreementAction(agreementId: string, action: string, performedBy?: string, ipAddress?: string, notes?: string): Promise<void> {
    await storage.createAgreementAction({
      id: randomUUID(),
      agreementId,
      action,
      performedBy,
      ipAddress,
      notes,
    });
  }

  private async sendAgreementEmail(investor: any, agreement: any, mergeFields: AgreementMergeFields): Promise<void> {
    if (!investor.email) {
      console.log(`Skipping agreement email for investor ${investor.id} - no email address`);
      return;
    }

    const subject = `Investment Agreement Ready - ${mergeFields.investorName}`;
    
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Investment Agreement Ready</h1>
        <p style="margin: 15px 0 0 0; opacity: 0.95; font-size: 16px;">{{companyName}} Partnership Agreement</p>
        <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Agreement ID: {{agreementId}}</p>
      </div>
      
      <!-- Main Content -->
      <div style="background: white; padding: 35px 25px;">
        <div style="border-left: 4px solid #667eea; padding-left: 20px; margin-bottom: 25px;">
          <h2 style="margin: 0; color: #333; font-size: 20px;">Dear {{investorFirstName}} {{investorLastName}},</h2>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Investor ID: {{investorId}}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #444; margin: 20px 0;">
          Your personalized investment agreement is ready for review and digital signature. This comprehensive legal document outlines all terms and conditions of your investment partnership with {{companyName}}.
        </p>
        
        <!-- Investment Summary -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #dee2e6;">
          <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Investment Summary</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
              <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Investment Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #28a745;">{{investmentAmount}}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">({{investmentAmountWords}})</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
              <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Investment Term</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #007bff;">{{investmentTerm}}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">Lock-in: {{lockInPeriod}}</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #fd7e14;">
              <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Interest Rate</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #fd7e14;">{{interestRate}}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">Progressive scale</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
              <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Maturity Date</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #dc3545;">{{maturityDate}}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">Full term completion</p>
            </div>
          </div>
        </div>
        
        <!-- Interest Structure -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #bbdefb;">
          <h4 style="margin: 0 0 15px 0; color: #1565c0; font-size: 16px;">💰 Interest & Bonus Structure</h4>
          <div style="font-size: 14px; line-height: 1.8; color: #1565c0;">
            <p style="margin: 8px 0;">• Year 1: {{year1Interest}} | Year 2: {{year2Interest}}</p>
            <p style="margin: 8px 0;">• Year 3: {{year3Interest}} | Year 4: {{year4Interest}}</p>
            <p style="margin: 8px 0;">• Years 5-10: {{year5PlusInterest}}</p>
            <p style="margin: 8px 0; font-weight: 600;">• 5-Year Bonus: {{milestone5YearBonus}} | 10-Year Bonus: {{milestone10YearBonus}}</p>
            <p style="margin: 8px 0; font-size: 13px;">• Interest disbursed: {{interestDisbursementDate}}</p>
          </div>
        </div>
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{signatureUrl}}" 
             style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                    color: white; 
                    padding: 16px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    font-size: 16px;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                    transition: all 0.3s ease;">
            📝 Review & Sign Agreement
          </a>
        </div>
        
        <!-- Important Notice -->
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <div style="display: flex; align-items: flex-start;">
            <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
            <div>
              <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 16px;">Important Notice</h4>
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                This agreement expires on <strong>{{expiryDate}}</strong>. Please review and sign at your earliest convenience. 
                For any questions, contact our investment team at {{companyPhone}} or {{companyEmail}}.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Agreement Details -->
        <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          <div style="font-size: 13px; color: #6c757d; line-height: 1.6;">
            <p style="margin: 5px 0;"><strong>Agreement Version:</strong> {{agreementVersion}}</p>
            <p style="margin: 5px 0;"><strong>Generated:</strong> {{generatedDate}}</p>
            <p style="margin: 5px 0;"><strong>Governing Law:</strong> {{governingLaw}}</p>
            <p style="margin: 5px 0;"><strong>Jurisdiction:</strong> {{jurisdiction}}</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #343a40; color: #ffffff; padding: 25px; text-align: center;">
        <h4 style="margin: 0 0 10px 0; font-size: 18px;">{{companyName}}</h4>
        <p style="margin: 0; font-size: 13px; opacity: 0.8;">{{companyAddress}}</p>
        <p style="margin: 8px 0; font-size: 13px; opacity: 0.8;">{{companyPhone}} | {{companyEmail}} | {{companyWebsite}}</p>
        <div style="border-top: 1px solid #495057; margin: 15px 0; padding-top: 15px;">
          <p style="margin: 0; font-size: 11px; opacity: 0.6;">
            This is an automated message. Please do not reply to this email.<br>
            Investment Agreement System • {{currentYear}} • Regulated by {{regulatoryCompliance}}
          </p>
        </div>
      </div>
    </div>`;

    // Apply merge fields to email template
    const personalizedEmailContent = this.mergeTemplate(htmlContent, mergeFields);
    
    await sendEmail({
      to: investor.email,
      from: 'noreply@yourinvestmentcompany.com',
      subject,
      html: personalizedEmailContent
    });
  }

  private async sendSignatureConfirmationEmails(agreement: any): Promise<void> {
    const investor = await storage.getInvestor(agreement.investorId);
    if (!investor) return;

    // Generate merge fields for confirmation email
    const mergeFields = this.generateMergeFields(investor, agreement.id, agreement.expiresAt);
    
    // Email to investor
    if (investor.email) {
      const investorSubject = `Agreement Signed Successfully - ${mergeFields.investorName}`;
      const investorContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✅ Agreement Signed Successfully</h1>
          <p style="margin: 15px 0 0 0; opacity: 0.95; font-size: 16px;">{{companyName}} Partnership Confirmed</p>
          <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Agreement ID: {{agreementId}}</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 35px 25px;">
          <div style="border-left: 4px solid #28a745; padding-left: 20px; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 20px;">Congratulations {{investorFirstName}} {{investorLastName}}!</h2>
            <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Your investment partnership is now officially active</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444; margin: 20px 0;">
            Thank you for digitally signing your investment agreement with {{companyName}}. Your partnership is now legally binding and officially confirmed.
          </p>
          
          <!-- Signature Details -->
          <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #b8daff;">
            <h3 style="margin: 0 0 20px 0; color: #0c5460; font-size: 18px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">📋 Signature Confirmation</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Signed By</p>
                <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #28a745;">{{investorName}}</p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">Legal Signatory</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <p style="margin: 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Signature Date</p>
                <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #007bff;">{{agreementDate}}</p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #6c757d;">Digitally executed</p>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #c3e6c3;">
            <h4 style="margin: 0 0 15px 0; color: #155724; font-size: 16px;">🚀 Next Steps</h4>
            <div style="font-size: 14px; line-height: 1.8; color: #155724;">
              <p style="margin: 8px 0;">• Our investment team will contact you within 2 business days</p>
              <p style="margin: 8px 0;">• You'll receive investment account setup instructions</p>
              <p style="margin: 8px 0;">• Investment disbursement will begin as per agreement terms</p>
              <p style="margin: 8px 0;">• Track your investment progress through the investor portal</p>
            </div>
          </div>
          
          <!-- Investment Summary -->
          <div style="border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 25px 0; background: #f8fff9;">
            <h4 style="margin: 0 0 15px 0; color: #155724; font-size: 16px;">📊 Your Investment Summary</h4>
            <div style="font-size: 14px; color: #155724;">
              <p style="margin: 8px 0;"><strong>Investment Amount:</strong> {{investmentAmount}} ({{investmentAmountWords}})</p>
              <p style="margin: 8px 0;"><strong>Investment Term:</strong> {{investmentTerm}} with {{lockInPeriod}} lock-in</p>
              <p style="margin: 8px 0;"><strong>Expected Returns:</strong> {{interestRate}}</p>
              <p style="margin: 8px 0;"><strong>Maturity Date:</strong> {{maturityDate}}</p>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
            <h4 style="margin: 0 0 15px 0; color: #495057;">Need Assistance?</h4>
            <p style="margin: 0; font-size: 14px; color: #6c757d; line-height: 1.6;">
              If you have any questions about your investment or need assistance, please contact us:<br>
              📞 {{companyPhone}} | ✉️ {{companyEmail}} | 🌐 {{companyWebsite}}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #28a745; color: #ffffff; padding: 25px; text-align: center;">
          <h4 style="margin: 0 0 10px 0; font-size: 18px;">Welcome to {{companyName}}</h4>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Your trusted investment partner since {{currentYear}}</p>
          <p style="margin: 8px 0; font-size: 13px; opacity: 0.8;">{{companyAddress}}</p>
          <div style="border-top: 1px solid #20c997; margin: 15px 0; padding-top: 15px;">
            <p style="margin: 0; font-size: 11px; opacity: 0.7;">
              This confirmation is automatically generated. Please keep this email for your records.<br>
              Investment Confirmation System • {{currentYear}} • Regulated by {{regulatoryCompliance}}
            </p>
          </div>
        </div>
      </div>`;
      
      // Apply merge fields to email template
      const personalizedConfirmationContent = this.mergeTemplate(investorContent, {
        ...mergeFields,
        signatoryName: agreement.signatoryName,
        signedDate: new Date(agreement.signedAt).toLocaleDateString('en-IN')
      });
      
      await sendEmail({
        to: investor.email,
        from: 'noreply@yourinvestmentcompany.com',
        subject: investorSubject,
        html: personalizedConfirmationContent
      });
    }

    // Email to admin (could be configurable)
    const adminEmail = "admin@yourcompany.com"; // Make this configurable
    const adminSubject = `New Agreement Signed - ${investor.firstName} ${investor.lastName}`;
    const adminContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Investment Agreement Signed</h2>
      <p><strong>Investor:</strong> ${investor.firstName} ${investor.lastName}</p>
      <p><strong>Email:</strong> ${investor.email}</p>
      <p><strong>Signed By:</strong> ${agreement.signatoryName}</p>
      <p><strong>Signed On:</strong> ${new Date(agreement.signedAt).toLocaleDateString('en-IN')}</p>
      <p><strong>Agreement ID:</strong> ${agreement.id}</p>
      
      <p>The investor is now ready to proceed with investment.</p>
    </div>`;
    
    // Note: Only send admin email if admin email is configured
    // await sendEmail(adminSubject, adminContent, adminEmail);
  }

  private getDefaultAgreementContent(): string {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 850px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e0e0e0;">
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Investment Partnership Agreement</h1>
        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">{{companyName}}</p>
        <div style="background: rgba(255, 255, 255, 0.2); padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 15px;">
          <p style="margin: 0; font-size: 14px; font-weight: 500;">Agreement ID: {{agreementId}} | Version {{agreementVersion}}</p>
        </div>
      </div>

      <!-- Document Info Bar -->
      <div style="background: #f8f9fa; padding: 15px 30px; border-bottom: 1px solid #dee2e6;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6c757d;">
          <span><strong>Generated:</strong> {{generatedDate}}</span>
          <span><strong>Expires:</strong> {{expiryDate}}</span>
          <span><strong>Governing Law:</strong> {{governingLaw}}</span>
        </div>
      </div>

      <!-- Main Content -->
      <div style="padding: 40px 30px;">
        <!-- Parties Section -->
        <div style="margin-bottom: 40px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; border: 1px solid #dee2e6;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Parties to This Agreement</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <h4 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">👤 Investor Information</h4>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Full Name:</strong> {{investorName}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Investor ID:</strong> {{investorId}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> {{investorEmail}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> {{investorPhone}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> {{investorAddress}}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h4 style="margin: 0 0 15px 0; color: #28a745; font-size: 16px;">🏢 Company Information</h4>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Company:</strong> {{companyName}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> {{companyAddress}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> {{companyPhone}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> {{companyEmail}}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Website:</strong> {{companyWebsite}}</p>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; font-size: 14px; color: #1565c0;"><strong>Agreement Date:</strong> {{agreementDate}} | <strong>Jurisdiction:</strong> {{jurisdiction}}</p>
          </div>
        </div>

        <!-- Investment Terms -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">💰 Investment Terms & Conditions</h3>
          
          <div style="background: #e8f5e8; padding: 25px; border-radius: 12px; border: 1px solid #c3e6c3; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div style="text-align: center;">
                <div style="background: white; padding: 15px; border-radius: 8px; border-bottom: 3px solid #28a745;">
                  <h4 style="margin: 0; color: #28a745; font-size: 18px;">{{investmentAmount}}</h4>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">Per Unit Investment</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; color: #6c757d;">({{investmentAmountWords}})</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="background: white; padding: 15px; border-radius: 8px; border-bottom: 3px solid #007bff;">
                  <h4 style="margin: 0; color: #007bff; font-size: 18px;">{{maximumUnits}} Units Max</h4>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">{{totalInvestmentLimit}}</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; color: #6c757d;">Maximum Limit</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="background: white; padding: 15px; border-radius: 8px; border-bottom: 3px solid #fd7e14;">
                  <h4 style="margin: 0; color: #fd7e14; font-size: 18px;">{{investmentTerm}}</h4>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">Investment Period</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; color: #6c757d;">Lock-in: {{lockInPeriod}}</p>
                </div>
              </div>
            </div>
          </div>
          
          <ul style="padding-left: 20px; font-size: 15px; line-height: 1.8;">
            <li><strong>Investment Date:</strong> {{investmentDate}}</li>
            <li><strong>Maturity Date:</strong> {{maturityDate}}</li>
            <li><strong>Interest Disbursement:</strong> {{interestDisbursementDate}}</li>
            <li><strong>Early Exit:</strong> Available after {{lockInPeriod}} with calculated present value</li>
          </ul>
        </div>

        <!-- Interest Structure -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #fd7e14; padding-bottom: 10px;">📈 Progressive Interest Structure</h3>
          <div style="background: #fff3cd; padding: 25px; border-radius: 12px; border: 1px solid #ffeaa7;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 16px;">Annual Interest Rates</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 2;">
                  <li><strong>Year 1:</strong> {{year1Interest}}</li>
                  <li><strong>Year 2:</strong> {{year2Interest}}</li>
                  <li><strong>Year 3:</strong> {{year3Interest}}</li>
                  <li><strong>Year 4:</strong> {{year4Interest}}</li>
                  <li><strong>Years 5-10:</strong> {{year5PlusInterest}}</li>
                </ul>
              </div>
              
              <div>
                <h4 style="margin: 0 0 15px 0; color: #856404; font-size: 16px;">Milestone Bonuses</h4>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <p style="margin: 5px 0; font-size: 14px;"><strong>5-Year Bonus:</strong> {{milestone5YearBonus}}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>10-Year Bonus:</strong> {{milestone10YearBonus}}</p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d; font-style: italic;">Bonuses are additional to regular interest and paid upon completion of milestone years.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Legal Terms -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">⚖️ Legal Terms & Compliance</h3>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Governing Law:</strong> {{governingLaw}}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Jurisdiction:</strong> {{jurisdiction}}</p>
              </div>
              <div>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Regulatory Compliance:</strong> {{regulatoryCompliance}}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Document Hash:</strong> {{documentHash}}</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #f5c6cb; padding-top: 15px;">
              <h4 style="color: #721c24; margin: 0 0 10px 0; font-size: 16px;">Important Disclaimers</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #721c24; line-height: 1.6;">
                <li>All investments are subject to market risks. Past performance does not guarantee future returns.</li>
                <li>Interest rates and bonus payments are as per the terms agreed and may be subject to applicable taxes.</li>
                <li>Early withdrawal after lock-in period may result in adjusted returns based on present value calculations.</li>
                <li>This agreement is governed by {{governingLaw}} and disputes shall be resolved through {{jurisdiction}}.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Signature Section -->
        <div style="margin-bottom: 30px; background: #e3f2fd; padding: 25px; border-radius: 12px; border: 1px solid #bbdefb;">
          <h3 style="color: #1565c0; margin: 0 0 20px 0; font-size: 20px; text-align: center;">✍️ Digital Signature Required</h3>
          
          <div style="background: white; border: 2px dashed #1565c0; padding: 30px; margin: 20px 0; text-align: center; border-radius: 10px;">
            <p style="color: #1565c0; margin: 0; font-size: 18px; font-weight: 600;">Electronic Signature Area</p>
            <p style="color: #1976d2; margin: 10px 0; font-size: 14px;">Please click the signature button below to digitally sign this agreement</p>
            <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 0; font-size: 13px; color: #7b1fa2; line-height: 1.5;">
                By signing this agreement, I, {{investorName}}, acknowledge that I have read, understood, and agree to all terms and conditions outlined in this Investment Partnership Agreement. I confirm that this digital signature is legally binding and represents my informed consent to enter into this investment partnership with {{companyName}}.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              This digital signature will be timestamped and legally binding upon execution.<br>
              Signature URL: {{signatureUrl}}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #343a40; color: #ffffff; padding: 25px 30px; text-align: center;">
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0; font-size: 18px;">{{companyName}}</h4>
          <p style="margin: 5px 0; font-size: 13px; opacity: 0.8;">Your Trusted Investment Partner</p>
        </div>
        
        <div style="border-top: 1px solid #495057; padding-top: 15px;">
          <p style="margin: 0; font-size: 11px; opacity: 0.7; line-height: 1.4;">
            This agreement was generated electronically on {{generatedDate}} and is valid without physical signature when digitally executed.<br>
            Document ID: {{agreementId}} | Version: {{agreementVersion}} | Generated: {{currentMonth}} {{currentDay}}, {{currentYear}}<br>
            Regulated by {{regulatoryCompliance}} | Subject to {{governingLaw}}
          </p>
        </div>
      </div>
    </div>`;
  }
}

export const agreementService = new AgreementService();

// Standalone function for generating investment agreements
export async function generateInvestmentAgreement(investorId: string): Promise<string> {
  return await agreementService.createAndSendAgreement(investorId);
}