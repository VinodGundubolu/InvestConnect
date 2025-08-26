import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { EmailTemplateEngine, type EmailMergeFields } from "./email-templates";
import { sendEmail, sendInvestorCreationNotification, sendWelcomeEmail, testEmailService } from "./emailService";
import { insertInvestorSchema, insertInvestmentSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { InterestDisbursementEngine, type InterestCalculation } from './interest-disbursement';
import { autoTransactionRecorder } from './auto-transaction';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize dividend rates and auto-process transactions
  await storage.initializeDividendRates();
  
  // Auto-process all investment transactions on startup
  try {
    const result = await autoTransactionRecorder.processAllInvestments();
    console.log(`Auto-processed ${result.processed} investments, created ${result.created} transactions`);
  } catch (error) {
    console.error("Error during auto-transaction processing:", error);
  }



  // Test login route for demo credentials
  app.post('/api/test-login', async (req, res) => {
    try {
      const { username, password, portalType } = req.body;
      
      // Test credentials
      const testCredentials = {
        investor: { username: 'Suresh', password: 'Test@1234', userId: 'test-investor-suresh' },
        admin: { username: 'Admin', password: 'Admin@123', userId: '46536152' }
      };
      
      if (portalType === 'admin') {
        const adminCreds = testCredentials.admin;
        if (username !== adminCreds.username || password !== adminCreds.password) {
          return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        
        (req.session as any).testUser = {
          id: adminCreds.userId,
          portalType: 'admin',
          isTestAccount: true
        };
        
        return res.json({ success: true, message: 'Admin login successful', portalType: 'admin' });
      }
      
      // Check investor credentials (both static and dynamic)
      const staticCreds = testCredentials.investor;
      let validCreds = null;
      
      if (username === staticCreds.username && password === staticCreds.password) {
        validCreds = { ...staticCreds, investorId: "2024-V1-B5-1234-001" };
      } else {
        // Check dynamic credentials
        const dynamicCred = credentialsMap.get(username);
        if (dynamicCred && password === dynamicCred.password) {
          validCreds = { ...dynamicCred, userId: `user-${dynamicCred.investorId}` };
        }
      }
      
      if (!validCreds) {
        return res.status(401).json({ message: 'Invalid investor credentials' });
      }
      
      (req.session as any).testUser = {
        id: validCreds.userId || validCreds.investorId,
        portalType: 'investor',
        isTestAccount: true,
        investorId: validCreds.investorId
      };
      
      res.json({ success: true, message: 'Investor login successful', portalType: 'investor' });
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    try {
      // Calculate real stats from database
      const investors = await storage.getAllInvestors();
      const investments = await storage.getAllInvestments();
      
      // Calculate total investment amount
      const totalInvestment = investments.reduce((sum, inv) => {
        return sum + parseFloat(inv.investedAmount);
      }, 0);
      
      // Calculate total bonds
      const totalBonds = investments.reduce((sum, inv) => {
        return sum + inv.bondsPurchased;
      }, 0);
      
      // Calculate today's interest (approximate daily interest rate)
      const todayInterest = Math.round(totalInvestment * 0.06 / 365); // 6% annual rate
      
      res.json({
        totalInvestment,
        activeInvestors: investors.length,
        totalBonds,
        todayInterest
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin API routes
  app.get("/api/admin/investor-portfolio", async (req, res) => {
    try {
      // Get real investor and investment data from database
      const investors = await storage.getAllInvestors();
      const investments = await storage.getAllInvestments();
      
      // Create portfolio data with real information - only include investors who have investments
      const portfolioData = investors
        .map(investor => {
          // Find all investments for this investor
          const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
          
          if (investorInvestments.length === 0) {
            return null; // Skip investors without investments
          }
          
          // Calculate totals
          const totalInvestment = investorInvestments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
          const totalBonds = investorInvestments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);
          
          // Calculate current year (based on first investment date)
          let currentYear = 1;
          if (investorInvestments.length > 0) {
            const firstInvestment = investorInvestments[0];
            const investmentDate = new Date(firstInvestment.investmentDate);
            const currentDate = new Date();
            const yearsSince = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            currentYear = Math.max(1, yearsSince + 1);
          }
          
          // Calculate current rate based on year
          let rate = 0;
          if (currentYear === 1) rate = 0;
          else if (currentYear === 2) rate = 6;
          else if (currentYear === 3) rate = 9;
          else if (currentYear === 4) rate = 12;
          else rate = 18;
          
          // Calculate today's interest
          const todayInterest = Math.round(totalInvestment * (rate / 100) / 365);
          
          // Calculate total returns (rough estimate)
          const totalReturns = Math.round(totalInvestment * (rate / 100) * (currentYear - 1));
          
          // Calculate bond maturity progress (percentage through the 10-year term)
          const maturityProgress = investorInvestments.length > 0 ? 
            Math.min(100, Math.round(((currentYear - 1) / 10) * 100)) : 0;
          
          return {
            id: investor.id,
            name: `${investor.firstName} ${investor.lastName}`,
            investment: totalInvestment,
            bonds: totalBonds,
            currentYear,
            rate,
            todayInterest,
            totalReturns,
            maturityProgress,
            status: 'Active',
            aadharNumber: investor.identityProofNumber || 'N/A'
          };
        })
        .filter(portfolio => portfolio !== null); // Remove null entries
      
      res.json(portfolioData);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/admin/interest-breakdown", async (req, res) => {
    try {
      // Get real investor and investment data from database
      const investors = await storage.getAllInvestors();
      const investments = await storage.getAllInvestments();
      
      // Create interest breakdown with real data
      const interestBreakdown = investors.map(investor => {
        // Find all investments for this investor
        const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
        
        // Calculate totals
        const totalInvestment = investorInvestments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
        const totalBonds = investorInvestments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);
        
        // Calculate current year and rate
        let currentYear = 1;
        if (investorInvestments.length > 0) {
          const firstInvestment = investorInvestments[0];
          const yearsSince = Math.floor((new Date().getTime() - new Date(firstInvestment.investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          currentYear = Math.max(1, yearsSince + 1);
        }
        
        let rate = 0;
        if (currentYear === 1) rate = 0;
        else if (currentYear === 2) rate = 6;
        else if (currentYear === 3) rate = 9;
        else if (currentYear === 4) rate = 12;
        else rate = 18;
        
        // Calculate daily interest
        const dailyInterest = Math.round(totalInvestment * (rate / 100) / 365);
        
        return {
          name: `${investor.firstName} ${investor.lastName}`,
          bonds: totalBonds,
          rate,
          dailyInterest
        };
      });
      
      res.json(interestBreakdown);
    } catch (error) {
      console.error("Error fetching interest breakdown:", error);
      res.status(500).json({ message: "Failed to fetch interest breakdown" });
    }
  });

  // Store for temporary credentials mapping (will be replaced with database)
  const credentialsMap = new Map<string, { username: string; password: string; investorId: string }>();

  // Enhanced credentials mapping with multiple identifier support
  interface InvestorCredentials {
    username: string;
    password: string;
    investorId: string;
    email?: string;
    phone?: string;
  }

  // Store for enhanced credentials mapping
  const enhancedCredentialsMap = new Map<string, InvestorCredentials>();

  // Add test credentials for existing investors with multiple identifiers
  const addInvestorCredentials = (creds: InvestorCredentials) => {
    // Store by username
    enhancedCredentialsMap.set(creds.username, creds);
    // Store by investor ID
    enhancedCredentialsMap.set(creds.investorId, creds);
    // Store by email if provided
    if (creds.email) {
      enhancedCredentialsMap.set(creds.email, creds);
    }
    // Store by phone if provided  
    if (creds.phone) {
      enhancedCredentialsMap.set(creds.phone, creds);
    }
  };

  // Add test credentials with simple sequential investor IDs
  addInvestorCredentials({
    username: "nd_kumar",
    password: "ND2025", 
    investorId: "1",
    email: "nd.kumar@example.com",
    phone: "+91 98765 43209"
  });
  
  addInvestorCredentials({
    username: "suresh_kumar",
    password: "SU2025",
    investorId: "2", 
    email: "suresh.kumar@example.com",
    phone: "+91 98765 43208"
  });
  
  addInvestorCredentials({
    username: "suri_kumar",
    password: "SU2025",
    investorId: "3",
    email: "suri.kumar@example.com", 
    phone: "+91 98765 43210"
  });

  // Add the missing credentials you've been trying to use
  addInvestorCredentials({
    username: "krishna_john",
    password: "KR2025",
    investorId: "4",
    email: "krishna.john@example.com",
    phone: "+91 98765 43211"
  });

  addInvestorCredentials({
    username: "sid_vid",
    password: "SI2025", 
    investorId: "5",
    email: "sid.vid@example.com",
    phone: "+91 98765 43212"
  });

  addInvestorCredentials({
    username: "VK2615",
    password: "VK2025",
    investorId: "6", 
    email: "vk2615@example.com",
    phone: "+91 98765 43213"
  });
  
  // Add credentials for the newly created investors via admin API
  addInvestorCredentials({
    username: "sid_vid",
    password: "SI2025",
    investorId: "331",
    email: "sid.vid@example.com",
    phone: "+91 98765 43212"
  });
  
  addInvestorCredentials({
    username: "vinod_kumar",
    password: "VI2025",
    investorId: "341", 
    email: "vk2615@example.com",
    phone: "+91 98765 43213"
  });

  // Legacy credentials map for backward compatibility
  credentialsMap.set("nd_kumar", { username: "nd_kumar", password: "ND2025", investorId: "1" });
  credentialsMap.set("suresh_kumar", { username: "suresh_kumar", password: "SU2025", investorId: "2" });
  credentialsMap.set("suri_kumar", { username: "suri_kumar", password: "SU2025", investorId: "3" });
  credentialsMap.set("krishna_john", { username: "krishna_john", password: "KR2025", investorId: "4" });
  credentialsMap.set("sid_vid", { username: "sid_vid", password: "SI2025", investorId: "5" });
  credentialsMap.set("VK2615", { username: "VK2615", password: "VK2025", investorId: "6" });
  // Add credentials for newly created investors
  credentialsMap.set("sid_vid", { username: "sid_vid", password: "SI2025", investorId: "331" });
  credentialsMap.set("vinod_kumar", { username: "vinod_kumar", password: "VI2025", investorId: "341" });

  // Generate credentials for ALL existing investors automatically
  (async () => {
    try {
      console.log("🔐 Generating credentials for all existing investors...");
      
      // Get all investors from database
      const allInvestors = await storage.getAllInvestors();
      console.log(`📊 Found ${allInvestors.length} investors in database`);

      // Helper function to generate credentials like the admin API does
      const generateInvestorCredentials = (firstName: string, lastName: string) => {
        const username = `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`;
        const password = `${firstName.toUpperCase().substring(0, 2)}${new Date().getFullYear()}`;
        return { username, password };
      };

      let credentialsGenerated = 0;

      for (const investor of allInvestors) {
        // Generate credentials for this investor
        const { username, password } = generateInvestorCredentials(investor.firstName, investor.lastName);
        
        // Check if credentials already exist
        const existsInEnhanced = enhancedCredentialsMap.has(username) || enhancedCredentialsMap.has(investor.id);
        const existsInLegacy = credentialsMap.has(username);

        if (!existsInEnhanced && !existsInLegacy) {
          // Add credentials to both systems
          const credentials = {
            username,
            password,
            investorId: investor.id,
            email: investor.email || undefined,
            phone: investor.primaryMobile || undefined
          };

          addInvestorCredentials(credentials);
          credentialsMap.set(username, { username, password, investorId: investor.id });
          
          credentialsGenerated++;
          console.log(`✓ Generated credentials for: ${investor.firstName} ${investor.lastName} (${username}/${password}) -> ID: ${investor.id}`);
        } else {
          console.log(`⚪ Credentials already exist for: ${investor.firstName} ${investor.lastName} (ID: ${investor.id})`);
        }
      }

      console.log(`🎉 Generated ${credentialsGenerated} new credential pairs for existing investors!`);
      console.log(`📈 Total credentials now available: ${Array.from(enhancedCredentialsMap.keys()).length}`);

    } catch (error) {
      console.error("❌ Error generating investor credentials:", error);
    }
  })();

  // Helper function to generate login credentials
  const generateCredentials = (firstName: string, lastName: string) => {
    const username = `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`;
    const password = `${firstName.toUpperCase().substring(0, 2)}${new Date().getFullYear()}`;
    return { username, password };
  };

  // Helper function to generate investment agreement content
  const generateAgreementContent = (investor: any, totalInvestment: number) => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const maturityDate = new Date();
    maturityDate.setFullYear(maturityDate.getFullYear() + 10);
    const maturityDateStr = maturityDate.toLocaleDateString('en-GB');
    const agreementId = `test-agreement-${Date.now()}`;

    return {
      content: `INVESTMENT PARTNERSHIP AGREEMENT This Investment Partnership Agreement ("Agreement") is entered into on ${currentDate} between: INVESTOR: ${investor.firstName} ${investor.middleName ? investor.middleName + ' ' : ''}${investor.lastName} EMAIL: ${investor.email} COMPANY: Your Investment Company INVESTMENT DETAILS: - Investment Amount: ₹${(totalInvestment / 100000).toFixed(2)},00,000 - Investment Date: ${currentDate} - Maturity Date: ${maturityDateStr} - Interest Rate: 6-18% per annum - Agreement ID: ${agreementId} TERMS AND CONDITIONS: 1. The investor agrees to invest the specified amount 2. Interest will be paid annually as per the schedule 3. Principal will be returned upon maturity 4. This agreement is governed by applicable laws By signing below, both parties agree to the terms outlined in this agreement. _________________ Investor Signature Date: ______________`,
      agreementId
    };
  };

  // Create new investor with database storage
  app.post("/api/admin/investors", async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        middleName,
        email,
        mobileNumber,
        address,
        city,
        state,
        zipcode,
        proofType,
        proofNumber,
        startDate,
        investmentAmount,
        bondsCount,
        investmentPlan
      } = req.body;

      // Generate unique credentials
      const { username, password } = generateCredentials(firstName, lastName);
      const investorId = await storage.generateInvestorId({
        firstName,
        lastName,
        email,
        primaryMobile: mobileNumber,
        primaryAddress: address,
        primaryAddressPin: zipcode,
        identityProofType: proofType,
        identityProofNumber: proofNumber
      });

      // Store credentials in map for login (both maps for compatibility)
      credentialsMap.set(username, { username, password, investorId });
      addInvestorCredentials({
        username,
        password,
        investorId,
        email,
        phone: mobileNumber
      });
      
      // Create investor in database
      const investor = await storage.createInvestor({
        firstName,
        lastName,
        middleName: middleName || null,
        email,
        primaryMobile: mobileNumber,
        secondaryMobile: null,
        primaryAddress: address,
        primaryAddressPin: zipcode,
        secondaryAddress: null,
        secondaryAddressPin: null,
        identityProofType: proofType,
        identityProofNumber: proofNumber,
      });

      // Get or create default investment plan
      let plans = await storage.getAllInvestmentPlans();
      if (plans.length === 0) {
        const defaultPlan = await storage.createInvestmentPlan({
          name: "Fixed Income Bond Plan V1",
          version: 1,
          launchDate: "2024-01-01",
          bondValue: "2000000",
          bondsAvailable: 50,
          maxBondsPerInvestor: 3,
          lockInPeriodYears: 3,
          bonusEligibilityYears: 5,
          maturityEligibilityYears: 10,
        });
        plans = [defaultPlan];
      }

      // Create investment record in database
      const startDateObj = new Date(startDate);
      const maturityDate = new Date(startDateObj);
      maturityDate.setFullYear(maturityDate.getFullYear() + 10);
      const lockInExpiry = new Date(startDateObj);
      lockInExpiry.setFullYear(lockInExpiry.getFullYear() + 3);

      await storage.createInvestment({
        investorId: investorId,
        planId: plans[0].id,
        investmentDate: startDate,
        investedAmount: investmentAmount.toString(),
        bondsPurchased: bondsCount,
        lockInExpiry: lockInExpiry.toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        investmentPlan: investmentPlan || "10", // Default to 10 years if not provided
      });

      // Store credentials mapping for login
      credentialsMap.set(username, { username, password, investorId });

      console.log('New investor created in database:', investor);

      // Generate investment agreement automatically
      const { content: agreementContent, agreementId } = generateAgreementContent(investor, parseInt(investmentAmount));
      
      const investmentAgreement = await storage.createInvestmentAgreement({
        investorId: investorId,
        agreementId,
        title: "Investment Partnership Agreement",
        status: "pending",
        content: agreementContent,
      });

      console.log('✅ Investment agreement generated automatically:', investmentAgreement.id);

      // Send email notification using template system
      const mergeFields: EmailMergeFields = {
        investorName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`,
        firstName,
        lastName,
        email,
        phone: mobileNumber,
        investorId: investorId,
        investmentAmount: parseInt(investmentAmount),
        bondUnits: bondsCount.toString(),
        investmentDate: new Date().toLocaleDateString('en-IN'),
        username,
        password,
        investorPortalUrl: `${req.protocol}://${req.get('host')}/login`
      };
      
      const emailContent = {
        to: "viku2615@gmail.com",
        subject: `🔔 New Investor Account Created - ${firstName} ${lastName}`,
        text: EmailTemplateEngine.mergeTags(
          EmailTemplateEngine.getInvestorCreationTemplate(),
          mergeFields
        ),
        // Generate welcome email for investor
        welcomeEmail: EmailTemplateEngine.mergeTags(
          EmailTemplateEngine.getWelcomeTemplate(),
          mergeFields
        )
      };

      // Log the email notification prominently
      console.log('\n'.repeat(3));
      console.log('🚨'.repeat(20));
      console.log('📧 EMAIL NOTIFICATION SENT TO ADMIN:');
      console.log('🚨'.repeat(20));
      console.log(`TO: ${emailContent.to}`);
      console.log(`SUBJECT: ${emailContent.subject}`);
      console.log('📄 EMAIL CONTENT:');
      console.log(emailContent.text);
      console.log('🚨'.repeat(20));
      console.log('\n📧 WELCOME EMAIL FOR INVESTOR:');
      console.log('🚨'.repeat(20));
      console.log(emailContent.welcomeEmail);
      console.log('🚨'.repeat(20));
      console.log('\n'.repeat(2));

      res.json({
        success: true,
        investor,
        username,
        password,
        investmentAmount: parseInt(investmentAmount),
        bondsCount: parseInt(bondsCount),
        message: "Investor created successfully with login credentials sent to admin email"
      });

    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  // Debug endpoint to check credentials (remove in production)
  app.get("/api/debug/credentials", async (req, res) => {
    const credentialsList = Array.from(credentialsMap.entries()).map(([username, data]) => ({
      username,
      password: data.password,
      investorId: data.investorId
    }));
    res.json(credentialsList);
  });

  // Debug endpoint to check enhanced credentials
  app.get("/api/debug/enhanced-credentials", async (req, res) => {
    const uniqueCredentials = new Map();
    
    // Get unique credentials by investorId
    Array.from(enhancedCredentialsMap.entries()).forEach(([key, creds]) => {
      if (!uniqueCredentials.has(creds.investorId)) {
        uniqueCredentials.set(creds.investorId, {
          username: creds.username,
          password: creds.password,
          investorId: creds.investorId,
          email: creds.email,
          phone: creds.phone,
          identifiers: [key]
        });
      } else {
        // Add this identifier to existing credential
        uniqueCredentials.get(creds.investorId).identifiers.push(key);
      }
    });
    
    res.json(Array.from(uniqueCredentials.values()));
  });

  // Investor login API
  // Universal investor login endpoint (supports email, phone, investor ID)
  app.post("/api/investor/universal-login", async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password are required" });
      }

      // Check enhanced credentials map for any identifier type
      const credentials = enhancedCredentialsMap.get(identifier);
      
      if (!credentials || credentials.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get investor from database
      const investor = await storage.getInvestor(credentials.investorId);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Store session
      (req.session as any).investorAuth = {
        isAuthenticated: true,
        investorId: credentials.investorId,
        username: credentials.username,
        loginTime: new Date().toISOString()
      };

      // Save session
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        console.log("Session saved successfully for investor:", credentials.username);
        res.json({
          success: true,
          investor: {
            id: investor.id,
            firstName: investor.firstName,
            lastName: investor.lastName,
            email: investor.email
          }
        });
      });
    } catch (error) {
      console.error("Universal login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Password change endpoint
  app.post("/api/investor/change-password", async (req, res) => {
    try {
      const { investorId, currentPassword, newPassword } = req.body;

      if (!investorId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find current credentials
      let currentCredentials: InvestorCredentials | undefined;
      for (const [key, creds] of Array.from(enhancedCredentialsMap.entries())) {
        if (creds.investorId === investorId) {
          currentCredentials = creds;
          break;
        }
      }

      if (!currentCredentials || currentCredentials.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password in all credential maps
      const updatedCredentials: InvestorCredentials = {
        ...currentCredentials,
        password: newPassword
      };

      // Remove old entries
      enhancedCredentialsMap.delete(currentCredentials.username);
      enhancedCredentialsMap.delete(currentCredentials.investorId);
      if (currentCredentials.email) {
        enhancedCredentialsMap.delete(currentCredentials.email);
      }
      if (currentCredentials.phone) {
        enhancedCredentialsMap.delete(currentCredentials.phone);
      }

      // Add updated entries
      addInvestorCredentials(updatedCredentials);

      // Update legacy map
      credentialsMap.set(currentCredentials.username, {
        username: currentCredentials.username,
        password: newPassword,
        investorId: currentCredentials.investorId
      });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Get investor agreements
  app.get("/api/investor/agreements/:investorId", async (req, res) => {
    try {
      const { investorId } = req.params;
      const agreements = await storage.getInvestmentAgreementsByInvestor(investorId);
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      res.status(500).json({ message: "Failed to fetch agreements" });
    }
  });

  app.post("/api/investor/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check credentials in map
      const credentials = credentialsMap.get(username);
      if (!credentials || credentials.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Get investor details
      const investor = await storage.getInvestor(credentials.investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Set up session for investor
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).investorAuth = {
        isAuthenticated: true,
        investorId: credentials.investorId,
        username: username,
        loginTime: new Date().toISOString()
      };

      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log("Session saved successfully for investor:", username);
        res.json({
          success: true,
          investor,
          message: "Login successful"
        });
      });

    } catch (error) {
      console.error("Error during investor login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get all investors for admin portal
  app.get("/api/admin/investors", async (req, res) => {
    try {
      const investors = await storage.getAllInvestors();
      
      const investorsWithDetails = await Promise.all(
        investors.map(async (investor) => {
          const investments = await storage.getInvestmentsByInvestor(investor.id);
          const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
          const bondsCount = investments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);
          
          // Calculate current year and rate based on first investment
          let currentYear = 1;
          let currentRate = 0;
          let totalReturns = 0;
          
          if (investments.length > 0) {
            const firstInvestment = investments[0];
            const investmentDate = new Date(firstInvestment.investmentDate);
            const yearsSince = Math.floor((new Date().getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            currentYear = Math.min(yearsSince + 1, 10);
            
            const rates = [0, 6, 9, 12, 18, 18, 18, 18, 18, 0];
            currentRate = rates[Math.min(currentYear - 1, 9)];
            
            // Calculate total returns for all completed years
            for (let year = 1; year <= Math.min(currentYear - 1, 9); year++) {
              totalReturns += totalInvestment * (rates[year] / 100);
            }
          }
          
          // Get investment start date from first investment
          const investmentStartDate = investments.length > 0 
            ? new Date(investments[0].investmentDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          
          // Get maturity date from first investment
          const maturityDate = investments.length > 0 
            ? new Date(investments[0].maturityDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          // Get investment plan from first investment
          const investmentPlan = investments.length > 0 ? investments[0].investmentPlan : '10';

          return {
            id: investor.id,
            name: `${investor.firstName} ${investor.middleName || ''} ${investor.lastName}`.trim(),
            email: investor.email,
            phone: investor.primaryMobile,
            totalInvestment,
            bondsCount,
            investmentPlan,
            joinDate: investor.createdAt ? new Date(investor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            investmentStartDate,
            maturityDate,
            status: "Active",
            currentYear,
            currentRate,
            totalReturns,
            // Additional fields for portfolio display
            investment: totalInvestment,
            bonds: bondsCount,
            todayInterest: Math.round(totalInvestment * (currentRate / 100) / 365),
            aadharNumber: investor.identityProofNumber || 'N/A',
            maturityProgress: Math.min(100, Math.round(((currentYear - 1) / 10) * 100)),
            rate: currentRate
          };
        })
      );

      res.json(investorsWithDetails);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  // Get investor's investment data for their portal
  app.get('/api/investor/investments', async (req: any, res) => {
    try {
      // Check for investor authentication session first
      if ((req.session as any)?.investorAuth?.isAuthenticated) {
        const investorId = (req.session as any).investorAuth.investorId;
        
        // Get investor investments from database
        const investments = await storage.getInvestmentsByInvestor(investorId);
        if (investments.length > 0) {
          return res.json(investments);
        }
        
        // Return empty array if no investments found
        return res.json([]);
      }

      // Check for test session second
      if ((req.session as any)?.testUser?.portalType === 'investor') {
        const investorId = (req.session as any).testUser.investorId || "2024-V1-B5-1234-001";
        
        // Get investor investments from database
        const investments = await storage.getInvestmentsByInvestor(investorId);
        if (investments.length > 0) {
          return res.json(investments);
        }
        
        // Fallback to static test investment
        const staticInvestment = [{
          id: "2024-V1-B5-1234-001-INV-001",
          investorId: "2024-V1-B5-1234-001",
          planId: "default-plan-v1",
          investmentDate: "2024-01-15",
          investedAmount: "2000000",
          bondsPurchased: 1,
          lockInExpiry: "2027-01-15",
          maturityDate: "2034-01-15",
          bonusEarned: 0,
          isActive: true,
          createdAt: "2024-01-15T00:00:00.000Z"
        }];
        
        return res.json(staticInvestment);
      }
      
      res.status(401).json({ message: 'Unauthorized' });
    } catch (error) {
      console.error("Error fetching investor investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  // Update investor profile (restricted fields only)
  app.patch('/api/investor/profile/update', async (req: any, res) => {
    try {
      const { investorId, email, primaryMobile, secondaryMobile, primaryAddress, secondaryAddress } = req.body;
      
      if (!investorId || !email || !primaryMobile || !primaryAddress) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Update investor in database
      const updatedInvestor = await storage.updateInvestor(investorId, {
        email,
        primaryMobile,
        secondaryMobile: secondaryMobile || null,
        primaryAddress,
        secondaryAddress: secondaryAddress || null,
      });

      // Send profile update notification using template system
      const updateMergeFields: EmailMergeFields = {
        investorName: `${updatedInvestor.firstName} ${updatedInvestor.lastName}`,
        firstName: updatedInvestor.firstName,
        lastName: updatedInvestor.lastName,
        email,
        phone: primaryMobile,
        investorId: updatedInvestor.id,
        adminPortalUrl: `${req.protocol}://${req.get('host')}/admin`
      };
      
      const profileUpdateEmail = {
        to: "viku2615@gmail.com",
        subject: `📝 Profile Updated - ${updatedInvestor.firstName} ${updatedInvestor.lastName}`,
        text: EmailTemplateEngine.mergeTags(
          EmailTemplateEngine.getProfileUpdateTemplate(),
          updateMergeFields
        )
      };

      // Log the email notification (in production, this would be sent via email service)
      console.log('📧 PROFILE UPDATE EMAIL NOTIFICATION:', profileUpdateEmail.text);

      res.json({
        success: true,
        investor: updatedInvestor,
        message: "Profile updated successfully. Admin has been notified."
      });

    } catch (error) {
      console.error("Error updating investor profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Delete investor and all related data
  app.delete('/api/admin/investors/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Investor ID is required" });
      }

      // Get investor details before deletion for logging
      const investor = await storage.getInvestor(id);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Delete investor (this will also delete related investments via cascade)
      const success = await storage.deleteInvestor(id);
      
      if (success) {
        // Log the deletion for audit trail
        console.log(`INVESTOR DELETED:`, {
          deletedBy: "Admin",
          investor: {
            id: investor.id,
            name: `${investor.firstName} ${investor.lastName}`,
            email: investor.email,
            mobile: investor.primaryMobile
          },
          deletedAt: new Date().toISOString()
        });

        // Also remove from in-memory storage if it exists
        const credentialsMap = req.app.locals.credentialsMap;
        if (credentialsMap) {
          // Find and remove credentials for this investor
          for (const [username, data] of credentialsMap.entries()) {
            if (data.investorId === id) {
              credentialsMap.delete(username);
              break;
            }
          }
        }

        res.json({
          success: true,
          message: `Investor ${investor.firstName} ${investor.lastName} has been deleted successfully`
        });
      } else {
        res.status(500).json({ message: "Failed to delete investor" });
      }

    } catch (error) {
      console.error("Error deleting investor:", error);
      res.status(500).json({ message: "Failed to delete investor" });
    }
  });

  // Investor logout API
  app.post("/api/investor/logout", async (req, res) => {
    try {
      if ((req.session as any)?.investorAuth) {
        (req.session as any).investorAuth = null;
        delete (req.session as any).investorAuth;
      }
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during investor logout:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Investor routes
  app.get('/api/investor/profile', async (req: any, res) => {
    try {
      // Debug session
      console.log("Session data:", req.session);
      console.log("Investor auth:", (req.session as any)?.investorAuth);
      
      // Check for investor authentication session first
      if ((req.session as any)?.investorAuth?.isAuthenticated) {
        const investorId = (req.session as any).investorAuth.investorId;
        
        console.log("Found authenticated investor session:", investorId);
        
        // Get investor from database with investments and transactions
        const investorWithInvestments = await storage.getInvestorWithInvestments(investorId);
        if (investorWithInvestments) {
          return res.json(investorWithInvestments);
        }
      }

      // Check for test session second
      if ((req.session as any)?.testUser?.portalType === 'investor') {
        const investorId = (req.session as any).testUser.investorId || "2024-V1-B5-1234-001";
        
        // Get investor from database
        const dbInvestor = await storage.getInvestor(investorId);
        if (dbInvestor) {
          return res.json(dbInvestor);
        }
        
        // Fallback to static test investor
        const staticInvestor = {
          id: "2024-V1-B5-1234-001",
          userId: "test-investor-1",
          firstName: "Suresh",
          lastName: "Kumar",
          middleName: "R",
          email: "suresh.kumar@example.com",
          primaryMobile: "+91 98765 43210",
          primaryAddress: "123 Main Street, Apartment 4B",
          primaryAddressPin: "400001",
          identityProofType: "aadhar",
          identityProofNumber: "1234-5678-9012",
          city: "Mumbai",
          state: "Maharashtra",
          zipcode: "400001",
          proofType: "aadhar",
          proofNumber: "1234-5678-9012",
          status: "active",
          createdAt: "2024-01-15T00:00:00.000Z"
        };
        
        return res.json(staticInvestor);
      }
      
      // Handle authenticated users (Replit Auth) - remove isAuthenticated middleware temporarily
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const investor = await storage.getInvestorByUserId(userId);
        
        if (!investor) {
          return res.status(404).json({ message: "Investor profile not found" });
        }

        const investorWithInvestments = await storage.getInvestorWithInvestments(investor.id);
        return res.json(investorWithInvestments);
      }
      
      res.status(401).json({ message: 'Unauthorized' });
    } catch (error) {
      console.error("Error fetching investor profile:", error);
      res.status(500).json({ message: "Failed to fetch investor profile" });
    }
  });

  app.post('/api/investor/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertInvestorSchema.parse(req.body);
      const investor = await storage.createInvestor(validatedData);
      res.json(investor);
    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  // Investment routes
  app.get('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        // Admin can see all investments with enriched data
        const investments = await storage.getAllInvestments();
        const investors = await storage.getAllInvestors();
        
        // Create a map of investors for quick lookup
        const investorMap = new Map();
        investors.forEach(investor => {
          investorMap.set(investor.id, investor);
        });
        
        // Enrich investments with investor information
        const enrichedInvestments = investments.map(investment => {
          const investor = investorMap.get(investment.investorId);
          const investmentDate = new Date(investment.investmentDate);
          const currentDate = new Date();
          const yearsSinceInvestment = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          const currentYear = Math.max(1, yearsSinceInvestment + 1);
          
          // Calculate current rate based on year
          let currentRate = 0;
          if (currentYear === 1) currentRate = 0;
          else if (currentYear === 2) currentRate = 6;
          else if (currentYear === 3) currentRate = 9;
          else if (currentYear === 4) currentRate = 12;
          else currentRate = 18;
          
          return {
            id: investment.id,
            investorName: investor ? `${investor.firstName} ${investor.lastName}` : 'Unknown Investor',
            investorId: investment.investorId,
            investmentPlan: investment.investmentPlan || '10',
            bondType: 'Fixed Income Bond',
            amount: parseFloat(investment.investedAmount),
            purchaseDate: investment.investmentDate,
            maturityDate: investment.maturityDate,
            currentRate: currentRate,
            status: investment.isActive ? 'Active' : 'Inactive',
            year: currentYear,
            bondsPurchased: investment.bondsPurchased,
            // Additional fields for compatibility
            total_amount: parseFloat(investment.investedAmount),
            purchase_date: investment.investmentDate,
            maturity_date: investment.maturityDate,
            current_rate: currentRate,
            current_year: currentYear,
            bond_type: 'Fixed Income Bond',
            investor_name: investor ? `${investor.firstName} ${investor.lastName}` : 'Unknown Investor',
            investment_plan: investment.investmentPlan || '10'
          };
        });
        
        res.json(enrichedInvestments);
      } else {
        // Investor can only see their own investments
        const investor = await storage.getInvestorByUserId(userId);
        if (!investor) {
          return res.status(404).json({ message: "Investor profile not found" });
        }
        
        const investments = await storage.getInvestmentsByInvestor(investor.id);
        res.json(investments);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment(validatedData);
      res.json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  app.get('/api/investment/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const investmentId = req.params.id;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const investment = await storage.getInvestmentWithDetails(investmentId);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }

      // Check access permissions
      if (user.role !== "admin") {
        const investor = await storage.getInvestorByUserId(userId);
        if (!investor || investment.investorId !== investor.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      res.json(investment);
    } catch (error) {
      console.error("Error fetching investment:", error);
      res.status(500).json({ message: "Failed to fetch investment" });
    }
  });

  // Transaction routes
  app.get('/api/investment/:investmentId/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const investmentId = req.params.investmentId;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const investment = await storage.getInvestment(investmentId);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }

      // Check access permissions
      if (user.role !== "admin") {
        const investor = await storage.getInvestorByUserId(userId);
        if (!investor || investment.investorId !== investor.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      const transactions = await storage.getTransactionsByInvestment(investmentId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get all transactions for admin
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get all transactions with enriched data
      const transactions = await storage.getAllTransactions();
      const investors = await storage.getAllInvestors();
      
      // Create investor map for quick lookup
      const investorMap = new Map();
      investors.forEach(investor => {
        investorMap.set(investor.id, investor);
      });

      // Enrich transactions with investor information
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction: any) => {
          const investment = await storage.getInvestment(transaction.investmentId);
          const investor = investment ? investorMap.get(investment.investorId) : null;
          
          return {
            id: transaction.id,
            investorName: investor ? `${investor.firstName} ${investor.lastName}` : 'Unknown Investor',
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            date: transaction.transactionDate || transaction.createdAt,
            status: transaction.status || 'completed',
            description: transaction.notes || `${transaction.type} transaction`,
            mode: transaction.mode || 'bank_transfer',
            transactionId: transaction.transactionId
          };
        })
      );

      res.json(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Investment Plans routes
  app.get('/api/investment-plans', isAuthenticated, async (req: any, res) => {
    try {
      const plans = await storage.getAllInvestmentPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching investment plans:", error);
      res.status(500).json({ message: "Failed to fetch investment plans" });
    }
  });

  // Admin routes
  app.get('/api/admin/investors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const investors = await storage.getAllInvestors();
      res.json(investors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  app.post('/api/admin/investors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const validatedData = insertInvestorSchema.parse(req.body);
      const investor = await storage.createInvestor(validatedData);
      res.json(investor);
    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  app.get('/api/admin/portfolio-overview', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const overview = await storage.getPortfolioOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching portfolio overview:", error);
      res.status(500).json({ message: "Failed to fetch portfolio overview" });
    }
  });

  // Returns calculator
  app.get('/api/dividend-rates', async (req, res) => {
    try {
      const rates = await storage.getDividendRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching dividend rates:", error);
      res.status(500).json({ message: "Failed to fetch dividend rates" });
    }
  });

  app.post('/api/calculate-returns', async (req, res) => {
    try {
      const { amount, startDate } = req.body;
      
      if (!amount || !startDate) {
        return res.status(400).json({ message: "Amount and start date are required" });
      }

      const rates = await storage.getDividendRates();
      const calculation = calculateReturns(parseFloat(amount), new Date(startDate), rates);
      
      res.json(calculation);
    } catch (error) {
      console.error("Error calculating returns:", error);
      res.status(500).json({ message: "Failed to calculate returns" });
    }
  });

  // Get comprehensive interest calculation for investor
  app.get("/api/investor/interest-details", async (req, res) => {
    try {
      console.log("=== Interest Details API Called ===");
      const investorAuth = (req.session as any)?.investorAuth;
      
      if (!investorAuth?.isAuthenticated) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investor = await storage.getInvestor(investorAuth.investorId as string);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Get investor's investments with all transactions
      const investments = await storage.getInvestorInvestments(investorAuth.investorId);
      
      // Auto-process transactions for this investor
      for (const investment of investments) {
        await autoTransactionRecorder.processInvestmentTransactions(investment.id);
      }
      console.log("Found investments:", investments?.length || 0);
      
      // Get disbursed transactions (interest payments and bonuses) from all investments
      const allTransactions = [];
      for (const investment of investments) {
        const investmentTransactions = await storage.getTransactionsByInvestment(investment.id);
        allTransactions.push(...investmentTransactions.filter(t => 
          t.type === 'dividend_disbursement' || t.type === 'bonus_disbursement'
        ));
      }
      let disbursedTransactions = allTransactions;
      console.log("Found disbursed transactions:", disbursedTransactions?.length || 0);
      
      // For demo: Create sample disbursements for investments that should have them by now
      if (disbursedTransactions.length === 0 && investments.length > 0) {
        console.log("Creating sample disbursements for investments started in 2019...");
        
        const investment = investments[0];
        const investmentDate = new Date(investment.investmentDate);
        const today = new Date();
        const completedYears = Math.floor((today.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        const sampleDisbursements = [];
        
        // Create disbursements for years 2-6 (since investment started in 2019)
        for (let year = 2; year <= Math.min(completedYears, 6); year++) {
          const disbursementDate = InterestDisbursementEngine.calculateDisbursementDate(investmentDate, year);
          
          if (disbursementDate <= today) {
            const yearlyInterest = InterestDisbursementEngine.calculateYearlyInterest(parseFloat(investment.investedAmount), year);
            
            // Create interest disbursement transaction
            sampleDisbursements.push({
              amount: yearlyInterest,
              disbursementDate: disbursementDate,
              investmentId: investment.id,
              type: 'dividend_disbursement',
              description: `Year ${year} Interest Disbursement (${InterestDisbursementEngine.getInterestRateForYear(year)}%)`
            });
            
            // Create separate milestone bonus transaction for year 5
            if (year === 5) {
              const milestoneBonus = Math.round(parseFloat(investment.investedAmount) * 1.0);
              sampleDisbursements.push({
                amount: milestoneBonus,
                disbursementDate: disbursementDate,
                investmentId: investment.id,
                type: 'bonus_disbursement',
                description: `Year 5 Milestone Bonus (100% of Principal Investment)`
              });
            }
          }
        }
        
        // Create and store actual transactions in the database
        for (const disbursement of sampleDisbursements) {
          const transaction = await storage.createTransaction({
            investmentId: disbursement.investmentId,
            type: disbursement.type as "investment" | "dividend_disbursement" | "bonus_disbursement" | "maturity_disbursement",
            amount: disbursement.amount.toString(),
            transactionDate: disbursement.disbursementDate.toISOString().split('T')[0], // Convert to date string
            status: 'completed',
            mode: 'bank_transfer',
            transactionId: `${disbursement.type === 'bonus_disbursement' ? 'BON' : 'DIV'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            notes: disbursement.description
          });
          disbursedTransactions.push(transaction);
        }
        console.log("Created", sampleDisbursements.length, "sample disbursements totaling:", sampleDisbursements.reduce((sum, t) => sum + t.amount, 0));
      }
      
      // Calculate interest details for each investment
      const investmentInterestDetails = investments.map(investment => {
        // Filter only interest disbursements for interest calculations
        const interestTransactions = disbursedTransactions.filter(t => 
          t.investmentId === investment.id && t.type === 'dividend_disbursement'
        );
        
        const interestCalc = InterestDisbursementEngine.calculateInterestDetails(
          new Date(investment.investmentDate),
          parseFloat(investment.investedAmount),
          interestTransactions.map(t => ({
            amount: parseFloat(t.amount),
            disbursementDate: new Date(t.disbursementDate || t.transactionDate)
          }))
        );

        return {
          investmentId: investment.id,
          investmentDate: investment.investmentDate,
          principalAmount: parseFloat(investment.investedAmount),
          bondsPurchased: investment.bondsPurchased,
          ...interestCalc
        };
      });

      // Aggregate totals across all investments (interest only, excluding bonuses)
      const totalInterestEarned = investmentInterestDetails.reduce((sum, inv) => sum + (inv.interestEarnedTillDate || 0), 0);
      const totalInterestDisbursed = disbursedTransactions
        .filter(t => t.type === 'dividend_disbursement')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Find next disbursement (earliest upcoming)
      const upcomingDisbursements = investmentInterestDetails
        .map(inv => inv.interestToBeDispursedNext)
        .filter(next => next.amount > 0)
        .sort((a, b) => new Date(a.disbursementDate).getTime() - new Date(b.disbursementDate).getTime());

      const nextDisbursement = upcomingDisbursements[0] || { amount: 0, disbursementDate: "", yearCovered: 0 };

      console.log("Final calculations:");
      console.log("Total Interest Earned:", totalInterestEarned);
      console.log("Total Interest Disbursed:", totalInterestDisbursed);
      console.log("Next Disbursement:", nextDisbursement);

      const response = {
        totalInterestTillDate: Math.round(totalInterestEarned) || 0,
        totalInterestDisbursedTillDate: Math.round(totalInterestDisbursed) || 0,
        interestToBeDispursedNext: nextDisbursement,
        investmentBreakdown: investmentInterestDetails,
        // Removed disbursement schedule as requested
      };

      console.log("Sending response:", JSON.stringify(response, null, 2));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(response);
    } catch (error) {
      console.error("Error calculating interest details:", error);
      res.status(500).json({ message: "Failed to calculate interest details" });
    }
  });

  // Manual transaction processing endpoint for admin
  app.post("/api/admin/process-transactions", async (req, res) => {
    try {
      const result = await autoTransactionRecorder.processAllInvestments();
      res.json({
        success: true,
        message: `Processed ${result.processed} investments and created ${result.created} transactions`,
        processed: result.processed,
        created: result.created
      });
    } catch (error) {
      console.error("Error processing transactions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process transactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Single investment transaction processing
  app.post("/api/admin/process-investment-transactions/:investmentId", async (req, res) => {
    try {
      const { investmentId } = req.params;
      const transactions = await autoTransactionRecorder.processInvestmentTransactions(investmentId);
      
      res.json({
        success: true,
        message: `Created ${transactions.length} transactions for investment ${investmentId}`,
        transactions
      });
    } catch (error) {
      console.error("Error processing investment transactions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process investment transactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Email testing endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log("🧪 Testing email service...");
      const success = await testEmailService();
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Email test completed successfully. Check console logs for details." 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Email test failed. Check console logs for errors." 
        });
      }
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Email test encountered an error", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Returns calculation utility
function calculateReturns(
  principal: number,
  startDate: Date,
  rates: { year: number; rate: string }[]
): {
  yearlyBreakdown: { year: number; rate: number; dividend: number; bonus: number; total: number }[];
  summary: { principal: number; totalDividends: number; totalBonuses: number; maturityValue: number };
} {
  const yearlyBreakdown = [];
  let totalDividends = 0;
  let totalBonuses = 0;
  
  for (let year = 1; year <= 10; year++) {
    const rateData = rates.find(r => r.year === year);
    let rate = rateData ? parseFloat(rateData.rate) : 0;
    
    // Year 10 has 0% interest rate
    if (year === 10) {
      rate = 0;
    }
    
    const dividend = (principal * rate) / 100;
    let bonus = 0;
    
    // Apply milestone bonus rules (100% bonuses)
    if (year === 5 || year === 10) {
      bonus = principal; // 100% bonus
    }
    
    const total = dividend + bonus;
    
    yearlyBreakdown.push({
      year,
      rate,
      dividend,
      bonus,
      total,
    });
    
    totalDividends += dividend;
    totalBonuses += bonus;
  }
  
  const maturityValue = principal + totalDividends + totalBonuses;
  
  return {
    yearlyBreakdown,
    summary: {
      principal,
      totalDividends,
      totalBonuses,
      maturityValue,
    },
  };
}
