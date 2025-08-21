#!/usr/bin/env node

// Test script to verify SMTP2GO integration
import { sendWelcomeEmail, sendMonthlyProgressReport } from './server/emailService.js';

async function testSMTP2GO() {
  console.log('🧪 Testing SMTP2GO Integration');
  console.log('===============================');
  
  const testInvestor = {
    id: '1',
    firstName: 'Test',
    lastName: 'Investor',
    email: 'your-test-email@example.com', // Replace with your actual email for testing
    primaryMobile: '+91 9876543210',
    city: 'Mumbai',
    state: 'Maharashtra'
  };
  
  console.log('Test investor data prepared:', testInvestor.firstName, testInvestor.lastName);
  
  // Test welcome email
  console.log('\n📧 Testing Welcome Email...');
  try {
    const welcomeResult = await sendWelcomeEmail(testInvestor);
    if (welcomeResult) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('⚠️ Welcome email failed (check SMTP2GO credentials)');
    }
  } catch (error) {
    console.error('❌ Welcome email error:', error.message);
  }
  
  // Test monthly progress report
  console.log('\n📊 Testing Monthly Progress Report...');
  try {
    const reportResult = await sendMonthlyProgressReport(testInvestor);
    if (reportResult) {
      console.log('✅ Monthly report sent successfully!');
    } else {
      console.log('⚠️ Monthly report failed (may need investment data)');
    }
  } catch (error) {
    console.error('❌ Monthly report error:', error.message);
  }
  
  console.log('\n🎉 SMTP2GO Integration Test Complete!');
  console.log('=====================================');
  console.log('If emails were sent successfully, check your inbox.');
  console.log('If not, verify your SMTP2GO credentials are set correctly.');
}

// Run the test
testSMTP2GO().catch(console.error);