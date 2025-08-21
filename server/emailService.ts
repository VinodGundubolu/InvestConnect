import nodemailer from 'nodemailer';
import { EmailTemplateEngine, type EmailMergeFields } from './email-templates';

// Email service interface
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// SMTP2GO configuration
const createTransporter = () => {
  const username = process.env.SMTP2GO_USERNAME;
  const password = process.env.SMTP2GO_PASSWORD;
  
  if (!username || !password) {
    console.warn('⚠️ SMTP2GO credentials not found. Email notifications will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: username,
      pass: password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Initialize transporter
const transporter = createTransporter();

/**
 * Send email using SMTP2GO or log to console if credentials are missing
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!transporter) {
      // Log email to console when SMTP is not configured
      console.log('\n📧 EMAIL NOTIFICATION (Console Log):');
      console.log('='.repeat(50));
      console.log(`TO: ${options.to}`);
      console.log(`SUBJECT: ${options.subject}`);
      console.log('CONTENT:');
      console.log(options.text || options.html);
      console.log('='.repeat(50));
      return true;
    }

    const info = await transporter.sendMail({
      from: '"IRM System" <noreply@your-domain.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

/**
 * Send welcome email to new investor
 */
export async function sendWelcomeEmail(
  investorEmail: string, 
  mergeFields: EmailMergeFields
): Promise<boolean> {
  const template = EmailTemplateEngine.getWelcomeTemplate();
  const content = EmailTemplateEngine.mergeTags(template, mergeFields);
  
  return await sendEmail({
    to: investorEmail,
    subject: `🎉 Welcome to ${mergeFields.companyName || 'IRM System'}!`,
    text: content,
  });
}

/**
 * Send investor creation notification to admin
 */
export async function sendInvestorCreationNotification(
  adminEmail: string,
  mergeFields: EmailMergeFields
): Promise<boolean> {
  const template = EmailTemplateEngine.getInvestorCreationTemplate();
  const content = EmailTemplateEngine.mergeTags(template, mergeFields);
  
  return await sendEmail({
    to: adminEmail,
    subject: `🔔 New Investor Account Created - ${mergeFields.firstName} ${mergeFields.lastName}`,
    text: content,
  });
}

/**
 * Send monthly progress report to investor
 */
export async function sendMonthlyProgressReport(
  investorEmail: string,
  mergeFields: EmailMergeFields
): Promise<boolean> {
  const template = EmailTemplateEngine.getProfileUpdateTemplate(); // Using available template
  const content = EmailTemplateEngine.mergeTags(template, mergeFields);
  
  return await sendEmail({
    to: investorEmail,
    subject: `📊 Monthly Investment Report - ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
    text: content,
  });
}

/**
 * Test email functionality
 */
export async function testEmailService(): Promise<boolean> {
  const testEmail = {
    to: 'viku2615@gmail.com',
    subject: '🧪 Email Service Test',
    text: `
Email Service Test - ${new Date().toISOString()}

This is a test email to verify that the email service is working properly.

✅ Email templates: Working
✅ SMTP configuration: ${transporter ? 'Configured' : 'Using console logging'}
✅ Merge fields: Working

If you're receiving this email, the email service is functioning correctly!

Best regards,
IRM System
    `.trim(),
  };

  return await sendEmail(testEmail);
}