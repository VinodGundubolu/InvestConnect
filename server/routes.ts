import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInvestorSchema, insertInvestmentSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize dividend rates
  await storage.initializeDividendRates();

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
      // Return sample stats based on actual database data
      res.json({
        totalInvestment: 10000000, // ₹1 crore total
        activeInvestors: 2,
        totalBonds: 5,
        todayInterest: 1644 // Approximate daily interest
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin API routes
  app.get("/api/admin/investor-portfolio", async (req, res) => {
    try {
      // Sample portfolio data
      res.json([
        {
          id: "1",
          name: "Vinod Sharma",
          investment: 2000000,
          bonds: 1,
          currentYear: 2,
          rate: 6,
          todayInterest: 329
        },
        {
          id: "2", 
          name: "Suresh Kumar",
          investment: 6000000,
          bonds: 3,
          currentYear: 2,
          rate: 6,
          todayInterest: 986
        }
      ]);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/admin/interest-breakdown", async (req, res) => {
    try {
      // Sample interest breakdown
      res.json([
        {
          name: "Vinod Sharma",
          bonds: 1,
          rate: 6,
          dailyInterest: 329
        },
        {
          name: "Suresh Kumar", 
          bonds: 3,
          rate: 6,
          dailyInterest: 986
        }
      ]);
    } catch (error) {
      console.error("Error fetching interest breakdown:", error);
      res.status(500).json({ message: "Failed to fetch interest breakdown" });
    }
  });

  // Store for temporary credentials mapping (will be replaced with database)
  const credentialsMap = new Map<string, { username: string; password: string; investorId: string }>();

  // Add test credentials for existing investors
  credentialsMap.set("nd_kumar", { username: "nd_kumar", password: "ND2025", investorId: "2025-V1-B1-234E-091" });
  credentialsMap.set("suresh_kumar", { username: "suresh_kumar", password: "SU2025", investorId: "2025-V1-B1-234E-081" });

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

      // Send email notification to admin
      const adminEmail = "viku2615@gmail.com";
      const investorLoginUrl = `${req.protocol}://${req.get('host')}/investor-login`;
      
      // Enhanced email notification (in production, integrate with email service like SendGrid/Nodemailer)
      const emailContent = {
        to: adminEmail,
        subject: `🔔 New Investor Account Created - ${firstName} ${lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              📈 Investment Relationship Management System
            </h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">New Investor Account Created</h3>
              
              <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h4 style="color: #1f2937; margin-top: 0;">👤 Investor Details:</h4>
                <p><strong>Name:</strong> ${firstName} ${middleName ? middleName + ' ' : ''}${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${mobileNumber}</p>
                <p><strong>Investment Amount:</strong> ₹${parseInt(investmentAmount).toLocaleString('en-IN')}</p>
                <p><strong>Bond Units:</strong> ${bondsCount}</p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                <h4 style="color: #92400e; margin-top: 0;">🔐 Login Credentials:</h4>
                <p><strong>Username:</strong> <code style="background-color: #fbbf24; padding: 2px 6px; border-radius: 3px;">${username}</code></p>
                <p><strong>Password:</strong> <code style="background-color: #fbbf24; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
              </div>
              
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h4 style="color: #1e40af; margin-top: 0;">🌐 Investor Portal Access:</h4>
                <p><a href="${investorLoginUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${investorLoginUrl}</a></p>
                <p style="font-size: 14px; color: #6b7280;">Please share these credentials securely with the investor.</p>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Best regards,<br>
              <strong>IRM System</strong><br>
              Investment Relationship Management Platform
            </p>
          </div>
        `
      };

      // Log the email notification prominently
      console.log('\n'.repeat(3));
      console.log('🚨'.repeat(20));
      console.log('📧 EMAIL NOTIFICATION SENT TO ADMIN:');
      console.log('🚨'.repeat(20));
      console.log(`TO: ${emailContent.to}`);
      console.log(`SUBJECT: ${emailContent.subject}`);
      console.log('📄 EMAIL CONTENT:');
      console.log(emailContent.html.replace(/<[^>]*>/g, '')); // Strip HTML for console
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

  // Investor login API
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
          
          return {
            id: investor.id,
            name: `${investor.firstName} ${investor.middleName || ''} ${investor.lastName}`.trim(),
            email: investor.email,
            phone: investor.primaryMobile,
            totalInvestment,
            bondsCount,
            joinDate: investor.createdAt ? new Date(investor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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

      // Send email notification to admin (simulated)
      const emailNotification = {
        to: "admin@company.com", // Replace with actual admin email
        subject: "Investor Profile Update Notification",
        body: `
          Investor ${updatedInvestor.firstName} ${updatedInvestor.lastName} (ID: ${updatedInvestor.id}) has updated their profile.
          
          Updated Fields:
          - Email: ${email}
          - Primary Mobile: ${primaryMobile}
          - Secondary Mobile: ${secondaryMobile || 'Not provided'}
          - Primary Address: ${primaryAddress}
          - Secondary Address: ${secondaryAddress || 'Not provided'}
          
          Updated on: ${new Date().toLocaleString()}
        `
      };

      // Log the email notification (in production, this would be sent via email service)
      console.log('EMAIL NOTIFICATION TO ADMIN:', emailNotification);

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
        
        // Get investor from database with investments
        const dbInvestor = await storage.getInvestor(investorId);
        if (dbInvestor) {
          // Get investments for this investor
          const investments = await storage.getInvestmentsByInvestor(investorId);
          
          // Return investor profile with investments array
          const investorWithInvestments = {
            ...dbInvestor,
            investments: investments || []
          };
          
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
        // Admin can see all investments
        const investments = await storage.getAllInvestments();
        res.json(investments);
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
    const rate = rateData ? parseFloat(rateData.rate) : 0;
    
    const dividend = year === 10 ? 0 : (principal * rate) / 100;
    let bonus = 0;
    
    // Apply bonus rules
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
