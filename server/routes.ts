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

  // Store for dynamic investor credentials and data
  const investorDatabase = new Map<string, any>();
  const credentialsMap = new Map<string, { username: string; password: string; investorId: string }>();

  // Create new investor with database integration
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
      const username = firstName.toLowerCase();
      const password = `${firstName}@${new Date().getFullYear()}`;
      const investorId = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const userId = `user-${investorId}`;
      
      // Create investor record
      const investor = {
        id: investorId,
        userId,
        firstName,
        lastName,
        middleName,
        email,
        primaryMobile: mobileNumber,
        secondaryMobile: null,
        primaryAddress: address,
        primaryAddressPin: zipcode,
        secondaryAddress: null,
        secondaryAddressPin: null,
        identityProofType: proofType,
        identityProofNumber: proofNumber,
        // Compatibility fields
        address,
        city,
        state,
        zipcode,
        proofType,
        proofNumber,
        kycStatus: "verified",
        status: "active",
        createdAt: new Date().toISOString()
      };

      // Create investment record
      const investment = {
        id: `${investorId}-INV-001`,
        investorId,
        planId: "default-plan-v1",
        investmentDate: startDate,
        investedAmount: investmentAmount,
        bondsPurchased: bondsCount,
        lockInExpiry: new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 3)).toISOString().split('T')[0],
        maturityDate: new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 10)).toISOString().split('T')[0],
        bonusEarned: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Store in memory database
      investorDatabase.set(investorId, {
        investor,
        investments: [investment],
        username,
        password
      });

      // Store credentials mapping
      credentialsMap.set(username, { username, password, investorId });

      console.log('New investor created and stored:', investor);

      res.json({
        success: true,
        investor,
        username,
        password,
        message: "Investor created successfully with login credentials"
      });

    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  // Get all investors for admin portal
  app.get("/api/admin/investors", async (req, res) => {
    try {
      const investors = Array.from(investorDatabase.values()).map(data => ({
        ...data.investor,
        totalInvestment: data.investments.reduce((sum: number, inv: any) => sum + parseInt(inv.investedAmount), 0),
        bondsCount: data.investments.reduce((sum: number, inv: any) => sum + parseInt(inv.bondsPurchased), 0),
        joinDate: data.investor.createdAt.split('T')[0],
        currentYear: Math.min(Math.floor((new Date().getTime() - new Date(data.investments[0].investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + 1, 10),
        currentRate: [0, 6, 9, 12, 18, 18, 18, 18, 18, 0][Math.min(Math.floor((new Date().getTime() - new Date(data.investments[0].investmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)), 9)],
        totalReturns: data.investments.reduce((sum: number, inv: any) => {
          const investmentDate = new Date(inv.investmentDate);
          const yearsSince = Math.floor((new Date().getTime() - investmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          const currentYear = Math.min(yearsSince + 1, 10);
          const rates = [0, 6, 9, 12, 18, 18, 18, 18, 18, 0];
          let totalReturns = 0;
          for (let year = 1; year <= Math.min(currentYear - 1, 9); year++) {
            totalReturns += parseInt(inv.investedAmount) * (rates[year] / 100);
          }
          return sum + totalReturns;
        }, 0)
      }));

      res.json(investors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  // Get investor's investment data for their portal
  app.get('/api/investor/investments', async (req: any, res) => {
    try {
      if (req.session?.testUser?.portalType === 'investor') {
        const investorId = req.session.testUser.investorId || "2024-V1-B5-1234-001";
        
        // Check dynamic investor data first
        const dynamicData = investorDatabase.get(investorId);
        if (dynamicData) {
          return res.json(dynamicData.investments);
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

  // Investor routes
  app.get('/api/investor/profile', async (req: any, res) => {
    try {
      // Check for test session first
      if (req.session?.testUser?.portalType === 'investor') {
        const investorId = req.session.testUser.investorId || "2024-V1-B5-1234-001";
        
        // Check dynamic investor data first
        const dynamicData = investorDatabase.get(investorId);
        if (dynamicData) {
          return res.json(dynamicData.investor);
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
