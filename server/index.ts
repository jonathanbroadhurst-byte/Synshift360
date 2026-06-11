import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Set default values for optional environment variables
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not set, using default (not recommended for production)');
    process.env.JWT_SECRET = 'your-secret-key';
  }
  
  if (!process.env.HASH_SALT) {
    console.warn('HASH_SALT not set, using default (not recommended for production)');
    process.env.HASH_SALT = 'default-salt';
  }
  
  // Set NODE_ENV if not provided
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  
  log('Environment validation passed');
  log(`Running in ${process.env.NODE_ENV} mode`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ⚡ PRIORITY AUTHENTICATION INTERCEPTOR: Bypasses static serving and route conflicts completely
app.post(["/api/login", "/api/auth/login"], async (req: Request, res: Response) => {
  try {
    // 1. ADDED FLEXIBILITY: Check req.body directly OR nested within a data object
    const email = req.body.email || req.body.data?.email;
    const password = req.body.password || req.body.data?.password;
    
    // DEBUG: See exactly what structure is hitting your server
    console.log(`🚨 LOGIN DEBUG: Headers: ${JSON.stringify(req.headers['content-type'])}`);
    console.log(`🚨 LOGIN DEBUG: Body contents: ${JSON.stringify(req.body)}`);

    if (!email || !password) {
      console.log(`❌ LOGIN REJECTED: Missing credentials. Received email: ${email}, pass: ${!!password}`);
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Compute cryptographically safe salt comparisons matching 'admin123'
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      log(`❌ LOGIN REJECTED: Decryption verification failure for ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    log(`✅ LOGIN GRANTED: Session keys generated for Master Entity: ${email}`);

    // 3. Seal authorization cookies via signed JSON Web Tokens
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role,
        organizationId: user.organizationId 
      } 
    });
  } catch (error) {
    console.error("Critical Runtime Authentication Crash:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

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
  try {
    // Validate environment variables before starting
    validateEnvironment();

    // ⚡ SCHEMA GUARD: Ensures the column exists in production
    log("🔍 Checking production database constraints...");
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quantum_credits INTEGER DEFAULT 0 NOT NULL;`);
    log("⚡ Column 'quantum_credits' verified or injected successfully.");
    
    // 🏁 Registering main backend API routes...
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    const host = "0.0.0.0";
    
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      log(`Server successfully started on ${host}:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server startup errors
    server.on('error', (error: Error) => {
      console.error('Server startup error:', error);
      process.exit(1);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      log('SIGINT received, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
