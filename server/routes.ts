import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { EmailTemplateEngine, type EmailMergeFields } from "./email-templates";
import { insertInvestorSchema, insertInvestmentSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { InterestDisbursementEngine, type InterestCalculation } from './interest-disbursement';
import { initializeEmailScheduler, emailScheduler } from './scheduler';
import { credentialsService } from './credentials-service';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize dividend rates
  await storage.initializeDividendRates();

  // Initialize email scheduler for automated monthly reports
  initializeEmailScheduler();

  // Initialize database credentials from existing test data
  await credentialsService.initializeTestCredentials();

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
        
        req.session.testUser = {
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
      
      req.session.testUser = {
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
  // Get detailed investor information
  app.get("/api/admin/investor-details/:id", async (req, res) => {
    try {
      const investorId = req.params.id;
      const investor = await storage.getInvestorWithInvestments(investorId);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      res.json(investor);
    } catch (error) {
      console.error("Error fetching investor details:", error);
      res.status(500).json({ message: "Failed to fetch investor details" });
    }
  });

  app.get("/api/admin/investor-portfolio", async (req, res) => {
    try {
      // Get real investor and investment data from database
      const investors = await storage.getAllInvestors();
      const investments = await storage.getAllInvestments();
      
      // Create portfolio data with real information
      const portfolioData = investors.map(investor => {
        // Find all investments for this investor
        const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
        
        // Calculate totals
        const totalInvestment = investorInvestments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
        const totalBonds = investorInvestments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);
        
        // Calculate current year (based on first investment date)
        let currentYear = 1;
        if (investorInvestments.length > 0) {
          const firstInvestment = investorInvestments[0];
          const yearsSince = Math.floor((new Date().getTime() - new Date(firstInvestment.investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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
        
        return {
          id: investor.id,
          name: `${investor.firstName} ${investor.lastName}`,
          aadhar: `****-****-${investor.identityProofNumber?.slice(-4) || '0000'}`,
          totalInvestment,
          bonds: totalBonds,
          dailyInterest: todayInterest,
          totalReturns: totalInvestment * (rate / 100) * currentYear,
          maturityStatus: `Year ${currentYear}`,
          year: currentYear,
          bondMaturityProgress: `${Math.min(100, (currentYear / 10) * 100)}%`
        };
      });
      
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

  // All credentials are now managed by the database-backed credentialsService
  // The credentialsService automatically initializes existing test credentials on startup

  // Helper function to generate login credentials
  const generateCredentials = (firstName: string, lastName: string) => {
    const username = `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}`;
    const password = `${firstName.toUpperCase().substring(0, 2)}${new Date().getFullYear()}`;
    return { username, password };
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
        bondsCount
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

      // Store credentials in database for persistent login
      await credentialsService.upsertCredentials({
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
      });

      // Store credentials mapping for login
      credentialsMap.set(username, { username, password, investorId });

      console.log('New investor created in database:', investor);

      // Send email notification using template system
      const mergeFields: EmailMergeFields = {
        investorName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`,
        firstName,
        lastName,
        email,
        phone: mobileNumber,
        investorId: investorId,
        investmentAmount: EmailTemplateEngine.formatCurrency(parseInt(investmentAmount)),
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

      // Generate investment agreement automatically
      try {
        const agreementService = await import('./agreementService');
        await agreementService.generateInvestmentAgreement(investorId);
        console.log(`✅ Investment agreement generated for investor ${investorId}`);
      } catch (agreementError) {
        console.error('❌ Failed to generate investment agreement:', agreementError);
        // Don't fail the investor creation if agreement generation fails
      }

      res.json({
        success: true,
        investor,
        username,
        password,
        investorId,
        investmentAmount: parseInt(investmentAmount),
        bondsCount: parseInt(bondsCount),
        phone: mobileNumber,
        message: "Investor created successfully with login credentials sent to admin email"
      });

    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  // Debug endpoint to check credentials (remove in production)
  app.get("/api/debug/credentials", async (req, res) => {
    try {
      const credentials = await credentialsService.getAllCredentials();
      const credentialsList = credentials.map((cred) => ({
        username: cred.username,
        password: cred.password,
        investorId: cred.investorId
      }));
      res.json(credentialsList);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  // Investor login API
  // Universal investor login endpoint (supports email, phone, investor ID)
  app.post("/api/investor/universal-login", async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password are required" });
      }

      // Validate credentials using database-backed service
      const credentials = await credentialsService.validateCredentials(identifier, password);
      
      if (!credentials) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get investor from database
      const investor = await storage.getInvestor(credentials.investorId);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Store session
      req.session.investorAuth = {
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

      // Get current credentials from database
      const currentCredentials = await credentialsService.getCredentialsByInvestorId(investorId);

      if (!currentCredentials || currentCredentials.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password in database
      const success = await credentialsService.updatePassword(investorId, newPassword);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to update password" });
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
      req.session.investorAuth = {
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

          return {
            id: investor.id,
            name: `${investor.firstName} ${investor.middleName || ''} ${investor.lastName}`.trim(),
            email: investor.email,
            phone: investor.primaryMobile,
            totalInvestment,
            bondsCount,
            joinDate: investor.createdAt ? new Date(investor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            investmentStartDate,
            maturityDate,
            status: "Active",
            currentYear,
            currentRate,
            totalReturns
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
      if (req.session?.investorAuth?.isAuthenticated) {
        const investorId = req.session.investorAuth.investorId;
        
        // Get investor investments from database
        const investments = await storage.getInvestmentsByInvestor(investorId);
        if (investments.length > 0) {
          return res.json(investments);
        }
        
        // Return empty array if no investments found
        return res.json([]);
      }

      // Check for test session second
      if (req.session?.testUser?.portalType === 'investor') {
        const investorId = req.session.testUser.investorId || "2024-V1-B5-1234-001";
        
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
      if (req.session?.investorAuth) {
        req.session.investorAuth = null;
        delete req.session.investorAuth;
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
      console.log("Investor auth:", req.session?.investorAuth);
      
      // Check for investor authentication session first
      if (req.session?.investorAuth?.isAuthenticated) {
        const investorId = req.session.investorAuth.investorId;
        
        console.log("Found authenticated investor session:", investorId);
        
        // Get investor from database with investments and transactions
        const investorWithInvestments = await storage.getInvestorWithInvestments(investorId);
        if (investorWithInvestments) {
          return res.json(investorWithInvestments);
        }
      }

      // Check for test session second
      if (req.session?.testUser?.portalType === 'investor') {
        const investorId = req.session.testUser.investorId || "2024-V1-B5-1234-001";
        
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
        // Admin can see all investments with enhanced data for bond management
        const allInvestments = await storage.getAllInvestments();
        const allInvestors = await storage.getAllInvestors();
        
        // Transform investments data for bond management view
        const investmentsData = allInvestments.map(investment => {
          // Calculate current year based on investment date
          const investmentDate = new Date(investment.investmentDate);
          const currentDate = new Date();
          const yearsSince = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          const currentYear = Math.max(1, yearsSince + 1);
          
          // Calculate current rate based on year
          let currentRate = 0;
          if (currentYear === 1) currentRate = 0;
          else if (currentYear === 2) currentRate = 6;
          else if (currentYear === 3) currentRate = 9;
          else if (currentYear === 4) currentRate = 12;
          else currentRate = 18;
          
          // Get investor name from ID
          const investor = allInvestors.find(inv => inv.id === investment.investorId);
          const investorName = investor ? `${investor.firstName} ${investor.lastName}` : "Unknown Investor";
          
          return {
            id: investment.id,
            investorName,
            bondType: "Fixed Income Bond",
            amount: parseFloat(investment.investedAmount),
            purchaseDate: investment.investmentDate,
            maturityDate: investment.maturityDate,
            currentRate,
            status: investment.isActive ? "Active" : "Inactive",
            year: currentYear,
            bondsPurchased: investment.bondsPurchased
          };
        });
        
        res.json(investmentsData);
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
      const investments = await storage.getAllInvestments();
      
      // Transform investor data with investment details
      const enhancedInvestors = investors.map(investor => {
        const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
        const totalInvestment = investorInvestments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
        const bondsCount = investorInvestments.reduce((sum, inv) => sum + inv.bondsPurchased, 0);
        
        // Calculate current year and rate
        let currentYear = 1;
        if (investorInvestments.length > 0) {
          const firstInvestment = investorInvestments[0];
          const yearsSince = Math.floor((new Date().getTime() - new Date(firstInvestment.investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          currentYear = Math.max(1, yearsSince + 1);
        }
        
        let currentRate = 0;
        if (currentYear === 2) currentRate = 6;
        else if (currentYear === 3) currentRate = 9;
        else if (currentYear === 4) currentRate = 12;
        else if (currentYear >= 5) currentRate = 18;
        
        const totalReturns = totalInvestment * (currentRate / 100) * currentYear;
        
        return {
          ...investor,
          name: `${investor.firstName} ${investor.lastName}`,
          phone: investor.primaryMobile,
          totalInvestment,
          bondsCount,
          currentYear,
          currentRate,
          totalReturns,
          status: "Active",
          investmentStartDate: investorInvestments.length > 0 ? investorInvestments[0].investmentDate : investor.createdAt,
          maturityDate: investorInvestments.length > 0 ? investorInvestments[0].maturityDate : "TBD"
        };
      });
      
      res.json(enhancedInvestors);
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

  app.put('/api/admin/investors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const investorId = req.params.id;
      const updateData = req.body;
      
      const updatedInvestor = await storage.updateInvestor(investorId, updateData);
      res.json(updatedInvestor);
    } catch (error) {
      console.error("Error updating investor:", error);
      res.status(500).json({ message: "Failed to update investor" });
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
      const investorAuth = req.session?.investorAuth;
      
      if (!investorAuth?.isAuthenticated) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investor = await storage.getInvestor(investorAuth.investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Get investor's investments with all transactions
      const investments = await storage.getInvestorInvestments(investorAuth.investorId);
      console.log("Found investments:", investments?.length || 0);
      
      // Get disbursed transactions (interest payments and bonuses) from all investments
      const allTransactions = [];
      for (const investment of investments) {
        if (investment.transactions) {
          allTransactions.push(...investment.transactions.filter(t => 
            t.transactionType === 'dividend_disbursement' || t.transactionType === 'bonus_disbursement'
          ));
        }
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
            type: disbursement.type,
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

  // Email notification routes
  app.post('/api/email/welcome/:investorId', isAuthenticated, async (req, res) => {
    try {
      const { investorId } = req.params;
      const investor = await storage.getInvestor(investorId);
      
      if (!investor) {
        return res.status(404).json({ message: 'Investor not found' });
      }

      const { sendWelcomeEmail } = await import('./emailService');
      const success = await sendWelcomeEmail(investor);
      
      if (success) {
        res.json({ success: true, message: 'Welcome email sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send welcome email' });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({ message: 'Failed to send welcome email' });
    }
  });

  app.post('/api/email/monthly-report/:investorId', isAuthenticated, async (req, res) => {
    try {
      const { investorId } = req.params;
      const investor = await storage.getInvestor(investorId);
      
      if (!investor) {
        return res.status(404).json({ message: 'Investor not found' });
      }

      const { sendMonthlyProgressReport } = await import('./emailService');
      const success = await sendMonthlyProgressReport(investor);
      
      if (success) {
        res.json({ success: true, message: 'Monthly report sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send monthly report' });
      }
    } catch (error) {
      console.error('Error sending monthly report:', error);
      res.status(500).json({ message: 'Failed to send monthly report' });
    }
  });

  app.post('/api/email/monthly-reports-all', isAuthenticated, async (req, res) => {
    try {
      const { sendMonthlyReportsToAllInvestors } = await import('./emailService');
      const results = await sendMonthlyReportsToAllInvestors();
      
      res.json({
        success: true,
        message: `Monthly reports completed: ${results.sent} sent, ${results.failed} failed`,
        results
      });
    } catch (error) {
      console.error('Error sending monthly reports to all investors:', error);
      res.status(500).json({ message: 'Failed to send monthly reports' });
    }
  });

  // Test email scheduler endpoint
  app.post('/api/email/test-scheduler', isAuthenticated, async (req, res) => {
    try {
      const results = await emailScheduler.testMonthlyReports();
      res.json({
        success: true,
        message: 'Scheduler test completed successfully',
        results
      });
    } catch (error) {
      console.error('Error testing email scheduler:', error);
      res.status(500).json({ message: 'Failed to test email scheduler' });
    }
  });

  // Auto-trigger welcome email when new investor is created
  app.post('/api/admin/investors', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInvestorSchema.parse(req.body);
      const investor = await storage.createInvestor(validatedData);
      
      // Auto-send welcome email and agreement
      try {
        const { sendWelcomeEmail } = await import('./emailService');
        await sendWelcomeEmail(investor);
        console.log(`Welcome email sent to new investor: ${investor.id}`);
        
        // Auto-generate and send investment agreement
        const { agreementService } = await import('./agreementService');
        const agreementId = await agreementService.createAndSendAgreement(investor.id);
        console.log(`Investment agreement sent to investor ${investor.id}: ${agreementId}`);
      } catch (emailError) {
        console.error('Failed to send welcome email/agreement to new investor:', emailError);
        // Don't fail the investor creation if email fails
      }
      
      res.json(investor);
    } catch (error) {
      console.error('Error creating investor:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create investor' });
      }
    }
  });

  // Agreement API routes
  app.get('/agreement/sign/:agreementId', async (req, res) => {
    try {
      const { agreementId } = req.params;
      const { agreementService } = await import('./agreementService');
      const agreement = await agreementService.getAgreementForSigning(agreementId);
      
      // Render the agreement signing page (you can serve an HTML template here)
      const signingPageHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign Investment Agreement</title>
        <script>window.agreementData = ${JSON.stringify(agreement)};</script>
        <script src="/static/js/agreement-signing.js" defer></script>
        <link rel="stylesheet" href="/static/css/agreement-signing.css">
      </head>
      <body>
        <div id="agreement-signing-root"></div>
        <script>
          // Redirect to main app for signing
          window.location.href = '/agreement-sign/${agreementId}';
        </script>
      </body>
      </html>`;
      
      res.send(signingPageHTML);
    } catch (error) {
      console.error('Error loading agreement for signing:', error);
      res.status(404).send('Agreement not found or expired');
    }
  });

  // API endpoints for agreement management
  app.get('/api/agreement/:agreementId', async (req, res) => {
    try {
      const { agreementId } = req.params;
      const { agreementService } = await import('./agreementService');
      const agreement = await agreementService.getAgreementForSigning(agreementId);
      res.json(agreement);
    } catch (error) {
      console.error('Error fetching agreement:', error);
      res.status(404).json({ message: 'Agreement not found' });
    }
  });

  app.post('/api/agreement/:agreementId/sign', async (req, res) => {
    try {
      const { agreementId } = req.params;
      const { signature, signatoryName, signatoryEmail } = req.body;
      
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const { agreementService } = await import('./agreementService');
      await agreementService.signAgreement(
        agreementId, 
        signature, 
        signatoryName, 
        signatoryEmail,
        ipAddress,
        userAgent
      );
      
      res.json({ success: true, message: 'Agreement signed successfully' });
    } catch (error) {
      console.error('Error signing agreement:', error);
      res.status(400).json({ message: error.message || 'Failed to sign agreement' });
    }
  });

  // Get investor agreements
  app.get('/api/investor/agreements', async (req: any, res) => {
    try {
      let investorId = null;
      
      // Check investor authentication session
      if (req.session?.investorAuth?.isAuthenticated) {
        investorId = req.session.investorAuth.investorId;
      } else if (req.session?.testUser?.portalType === 'investor') {
        investorId = req.session.testUser.investorId || "1";
      }
      
      if (!investorId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { agreementService } = await import('./agreementService');
      const agreements = await agreementService.getInvestorAgreements(investorId);
      res.json(agreements);
    } catch (error) {
      console.error('Error fetching investor agreements:', error);
      res.status(500).json({ message: 'Failed to fetch agreements' });
    }
  });

  // Admin - Get all agreements
  app.get('/api/admin/agreements', isAuthenticated, async (req, res) => {
    try {
      const { agreementService } = await import('./agreementService');
      const agreements = await agreementService.getAllAgreements();
      res.json(agreements);
    } catch (error) {
      console.error('Error fetching all agreements:', error);
      res.status(500).json({ message: 'Failed to fetch agreements' });
    }
  });

  // Admin - Send agreement to investor
  app.post('/api/admin/agreements/send', isAuthenticated, async (req, res) => {
    try {
      const { investorId, templateId, expiresInDays } = req.body;
      const { agreementService } = await import('./agreementService');
      const agreementId = await agreementService.createAndSendAgreement(investorId, templateId, expiresInDays);
      res.json({ success: true, agreementId });
    } catch (error) {
      console.error('Error sending agreement:', error);
      res.status(500).json({ message: 'Failed to send agreement' });
    }
  });

  // Admin - Resend agreement
  app.post('/api/admin/agreements/:agreementId/resend', isAuthenticated, async (req, res) => {
    try {
      const { agreementId } = req.params;
      const { agreementService } = await import('./agreementService');
      await agreementService.resendAgreement(agreementId);
      res.json({ success: true, message: 'Agreement resent successfully' });
    } catch (error) {
      console.error('Error resending agreement:', error);
      res.status(500).json({ message: 'Failed to resend agreement' });
    }
  });

  // Test endpoint for merge fields
  app.post('/api/test/merge-fields', async (req, res) => {
    try {
      const { type = 'welcome' } = req.body;
      
      // Get a test investor to use for merge field testing
      const testInvestorId = "1"; // Use first investor for testing
      const investor = await storage.getInvestor(testInvestorId);
      
      if (!investor) {
        return res.status(404).json({ message: 'Test investor not found. Please ensure investor ID 1 exists.' });
      }

      if (type === 'welcome') {
        // Test welcome email with merge fields
        const { sendWelcomeEmail } = await import('./emailService');
        const success = await sendWelcomeEmail(investor);
        
        return res.json({ 
          success,
          message: success ? 'Welcome email sent successfully with merge fields' : 'Failed to send welcome email',
          testData: {
            investorId: investor.id,
            investorName: `${investor.firstName} ${investor.lastName}`,
            email: investor.email
          }
        });
      }
      
      if (type === 'monthly-report') {
        // Test monthly progress report with merge fields
        const { sendMonthlyProgressReport } = await import('./emailService');
        const success = await sendMonthlyProgressReport(investor);
        
        return res.json({ 
          success,
          message: success ? 'Monthly report sent successfully with merge fields' : 'Failed to send monthly report',
          testData: {
            investorId: investor.id,
            investorName: `${investor.firstName} ${investor.lastName}`,
            email: investor.email
          }
        });
      }
      
      if (type === 'agreement') {
        // Test agreement email with merge fields
        const { agreementService } = await import('./agreementService');
        const agreementId = await agreementService.createAndSendAgreement(investor.id);
        
        return res.json({ 
          success: true,
          message: 'Investment agreement sent successfully with merge fields',
          testData: {
            investorId: investor.id,
            investorName: `${investor.firstName} ${investor.lastName}`,
            email: investor.email,
            agreementId
          }
        });
      }
      
      return res.status(400).json({ 
        message: 'Invalid test type. Use: welcome, monthly-report, or agreement' 
      });
      
    } catch (error) {
      console.error('Error testing merge fields:', error);
      res.status(500).json({ message: 'Failed to test merge fields', error: (error as Error).message });
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
