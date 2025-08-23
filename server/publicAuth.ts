// Public Authentication System for External Users
// This allows the IRM system to work without requiring Replit authentication

import { RequestHandler } from 'express';

// Middleware to bypass Replit auth for public access
export const allowPublicAccess: RequestHandler = (req, res, next) => {
  // Check if this is a public deployment (not running in Replit development)
  const isPublicDeployment = !process.env.REPL_ID || process.env.NODE_ENV === 'production';
  
  if (isPublicDeployment) {
    // For public deployments, create a mock user session
    if (!req.user) {
      req.user = {
        id: 'public-user',
        email: 'public@access.com',
        role: 'admin', // Grant admin access for public deployments
        expires_at: Date.now() + 86400000 // 24 hours from now
      } as any;
    }
    
    // Mock the isAuthenticated function
    (req as any).isAuthenticated = () => true;
  }
  
  next();
};

// Public authentication check
export const isPublicAuthenticated: RequestHandler = (req, res, next) => {
  const isPublicDeployment = !process.env.REPL_ID || process.env.NODE_ENV === 'production';
  
  if (isPublicDeployment) {
    // Allow public access
    return next();
  }
  
  // Fall back to regular authentication for development
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};