import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Download specific backup file (placed before all middleware to avoid auth issues)
app.get('/api/backup/download/:filename', async (req, res) => {
  try {
    console.log('Download request for:', req.params.filename);
    const { filename } = req.params;
    const path = await import('path');
    const fs = await import('fs');
    const backupPath = path.join(process.cwd(), 'data-backups', filename);
    
    console.log('Backup path:', backupPath);
    
    // Security check - ensure filename is safe
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      console.log('Invalid filename:', filename);
      return res.status(400).json({ message: 'Invalid backup filename' });
    }
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      console.log('File not found:', backupPath);
      return res.status(404).json({ message: 'Backup file not found' });
    }
    
    console.log('File exists, starting download...');
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    
    // Send file
    const fileData = fs.readFileSync(backupPath);
    console.log('File size:', fileData.length);
    res.send(fileData);
  } catch (error) {
    console.error('Download failed:', error);
    res.status(500).json({ message: 'Download failed', error: (error as Error).message });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-for-development',
  resave: false,
  saveUninitialized: true, // Save uninitialized sessions
  name: 'investor.sid', // Custom session name
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow same-site requests
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
