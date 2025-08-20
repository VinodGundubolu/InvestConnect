import { randomUUID } from "crypto";
import { storage } from "./storage";
import { sendEmail } from "./emailService";
import crypto from "crypto";

export interface AgreementMergeFields {
  investorName: string;
  investorEmail: string;
  companyName: string;
  investmentAmount: string;
  investmentDate: string;
  maturityDate: string;
  interestRate: string;
  agreementDate: string;
  agreementId: string;
  signatureUrl: string;
}

export class AgreementService {
  
  // Create and send agreement to investor
  async createAndSendAgreement(investorId: string, templateId: string = "default", expiresInDays: number = 30): Promise<string> {
    try {
      const investor = await storage.getInvestor(investorId);
      if (!investor) {
        throw new Error("Investor not found");
      }

      // Get the default agreement template
      const template = await this.getDefaultTemplate();
      
      // Generate agreement content with investor data
      const agreementContent = this.mergeTemplate(template.content, {
        investorName: `${investor.firstName} ${investor.lastName}`,
        investorEmail: investor.email || '',
        companyName: "Your Investment Company",
        investmentAmount: "₹20,00,000", // Default amount per unit
        investmentDate: new Date().toLocaleDateString('en-IN'),
        maturityDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'), // 10 years from now
        interestRate: "6-18% per annum",
        agreementDate: new Date().toLocaleDateString('en-IN'),
        agreementId: randomUUID(),
        signatureUrl: `${process.env.REPLIT_DOMAINS}/agreement/sign/`
      });

      // Create agreement record
      const agreementId = randomUUID();
      const documentHash = this.generateDocumentHash(agreementContent);
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

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
      await this.logAgreementAction(agreementId, "sent", "system", null, "Agreement sent to investor");

      // Send email with agreement
      await this.sendAgreementEmail(investor, agreement);

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
      await this.logAgreementAction(agreementId, "signed", agreement.investorId, ipAddress, `Agreement signed by ${signatoryName}`);

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
    await this.logAgreementAction(agreementId, "viewed", agreement.investorId, null, "Agreement viewed");

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

  private async sendAgreementEmail(investor: any, agreement: any): Promise<void> {
    if (!investor.email) {
      console.log(`Skipping agreement email for investor ${investor.id} - no email address`);
      return;
    }

    const subject = "Investment Agreement - Signature Required";
    const signatureUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/agreement/sign/${agreement.id}`;
    
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Investment Agreement Ready</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Please review and sign your investment partnership agreement</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <p>Dear ${investor.firstName} ${investor.lastName},</p>
        
        <p>Your investment agreement is ready for review and signature. This legal document outlines the terms and conditions of your investment partnership with our organization.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Agreement Details:</h3>
          <p style="margin: 5px 0;"><strong>Investment Amount:</strong> ₹20,00,000 per unit</p>
          <p style="margin: 5px 0;"><strong>Interest Rate:</strong> 6-18% per annum</p>
          <p style="margin: 5px 0;"><strong>Investment Period:</strong> 10 years</p>
          <p style="margin: 5px 0;"><strong>Agreement ID:</strong> ${agreement.id}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signatureUrl}" 
             style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Review & Sign Agreement
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Important:</strong> This agreement expires on ${agreement.expiresAt ? new Date(agreement.expiresAt).toLocaleDateString('en-IN') : 'N/A'}. 
            Please review and sign at your earliest convenience.
          </p>
        </div>
        
        <p>If you have any questions about this agreement, please contact our investment team immediately.</p>
        
        <p>Best regards,<br>
        <strong>Investment Team</strong><br>
        Your Investment Company</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>Investment Agreement System • ${new Date().getFullYear()}</p>
      </div>
    </div>`;

    await sendEmail(subject, htmlContent, investor.email);
  }

  private async sendSignatureConfirmationEmails(agreement: any): Promise<void> {
    const investor = await storage.getInvestor(agreement.investorId);
    if (!investor) return;

    // Email to investor
    if (investor.email) {
      const investorSubject = "Agreement Signed Successfully";
      const investorContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Agreement Signed ✓</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your investment agreement has been successfully executed</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <p>Dear ${investor.firstName} ${investor.lastName},</p>
          
          <p>Thank you for signing your investment agreement. Your partnership with us is now officially confirmed.</p>
          
          <div style="background: #d1ecf1; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0c5460;">Signature Details:</h3>
            <p style="margin: 5px 0;"><strong>Signed By:</strong> ${agreement.signatoryName}</p>
            <p style="margin: 5px 0;"><strong>Signed On:</strong> ${new Date(agreement.signedAt).toLocaleDateString('en-IN')}</p>
            <p style="margin: 5px 0;"><strong>Agreement ID:</strong> ${agreement.id}</p>
          </div>
          
          <p>You can now proceed with your investment. Our team will contact you shortly with next steps.</p>
          
          <p>Welcome aboard!</p>
        </div>
      </div>`;
      
      await sendEmail(investorSubject, investorContent, investor.email);
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
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #667eea; padding-bottom: 20px;">
        <h1 style="color: #667eea; margin: 0; font-size: 28px;">{{title}}</h1>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 16px;">Investment Partnership Agreement</p>
        <p style="margin: 5px 0 0 0; color: #888; font-size: 14px;">Agreement ID: {{agreementId}}</p>
      </div>

      <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0;">Parties to This Agreement</h3>
        <p><strong>Investor:</strong> {{investorName}}</p>
        <p><strong>Email:</strong> {{investorEmail}}</p>
        <p><strong>Company:</strong> {{companyName}}</p>
        <p><strong>Agreement Date:</strong> {{agreementDate}}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0;">Investment Terms</h3>
        <ul style="padding-left: 20px;">
          <li><strong>Investment Amount:</strong> {{investmentAmount}} per unit</li>
          <li><strong>Maximum Investment:</strong> Up to 3 units (₹60,00,000 total)</li>
          <li><strong>Investment Period:</strong> 10 years from {{investmentDate}}</li>
          <li><strong>Maturity Date:</strong> {{maturityDate}}</li>
          <li><strong>Interest Rate:</strong> {{interestRate}} (progressive scale)</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0;">Interest Structure</h3>
        <div style="background: #e8f4f8; padding: 15px; border-radius: 6px;">
          <ul style="margin: 0; padding-left: 20px;">
            <li>Year 1: 0% interest</li>
            <li>Year 2: 6% per annum</li>
            <li>Year 3: 9% per annum</li>
            <li>Year 4: 12% per annum</li>
            <li>Years 5-10: 18% per annum</li>
          </ul>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0;">Milestone Bonuses</h3>
        <ul style="padding-left: 20px;">
          <li><strong>5-Year Completion Bonus:</strong> ₹20,00,000 per unit</li>
          <li><strong>10-Year Completion Bonus:</strong> ₹20,00,000 per unit</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #667eea; margin: 0 0 15px 0;">Key Conditions</h3>
        <ul style="padding-left: 20px;">
          <li><strong>Lock-in Period:</strong> 3 years from investment date</li>
          <li><strong>Early Exit:</strong> Available after 3 years with calculated value</li>
          <li><strong>Interest Disbursement:</strong> Annually on 24th of investment anniversary month</li>
          <li><strong>Investment Units:</strong> Minimum 1 unit, Maximum 3 units per investor</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px; background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
        <h4 style="color: #856404; margin: 0 0 10px 0;">Important Legal Information</h4>
        <p style="margin: 0; color: #856404; font-size: 14px;">
          By signing this agreement, you acknowledge that you have read, understood, and agree to all terms and conditions outlined above. 
          This investment carries financial risks and you should consult with a financial advisor if needed.
        </p>
      </div>

      <div style="margin-top: 50px; text-align: center;">
        <div style="border: 2px dashed #ccc; padding: 30px; margin: 20px 0; background: #fafafa;">
          <p style="color: #666; margin: 0; font-size: 16px;">Digital Signature Required</p>
          <p style="color: #888; margin: 5px 0 0 0; font-size: 14px;">Please click the signature button to electronically sign this agreement</p>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        <p style="color: #666; margin: 0; font-size: 12px;">
          This document was generated electronically and is valid without physical signature when signed digitally.
        </p>
        <p style="color: #888; margin: 5px 0 0 0; font-size: 12px;">
          Generated on {{agreementDate}} | Agreement ID: {{agreementId}}
        </p>
      </div>
    </div>`;
  }
}

export const agreementService = new AgreementService();

// Standalone function for generating investment agreements
export async function generateInvestmentAgreement(investorId: string): Promise<string> {
  return await agreementService.createAndSendAgreement(investorId);
}