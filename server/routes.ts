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
      
      const creds = testCredentials[portalType as keyof typeof testCredentials];
      
      if (!creds || username !== creds.username || password !== creds.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Create a test session
      req.session.testUser = {
        id: creds.userId,
        portalType,
        isTestAccount: true
      };
      
      res.json({ success: true, message: 'Test login successful', portalType });
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

  // Investor routes
  app.get('/api/investor/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const investor = await storage.getInvestorByUserId(userId);
      
      if (!investor) {
        return res.status(404).json({ message: "Investor profile not found" });
      }

      const investorWithInvestments = await storage.getInvestorWithInvestments(investor.id);
      res.json(investorWithInvestments);
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
