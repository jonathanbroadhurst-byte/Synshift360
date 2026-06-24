import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
  log('Environment validation passed');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ⚡ HIGH-PRIORITY AUTH INTERCEPTOR
app.post(["/api/login", "/api/auth/login"], async (req: Request, res: Response) => {
  try {
    const { password, email, username } = req.body;
    const inputEmail = email || username;

    if (!inputEmail || !password) {
      return res.status(400).json({ message: "Credentials required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, inputEmail.trim())).limit(1);
    
    // Check credentials AND active status
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account disabled. Contact support." });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    return res.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId } 
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

(async () => {
  try {
    validateEnvironment();
    
    // Safe schema initialization catch wrapper
    try {
      await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quantum_credits INTEGER DEFAULT 0 NOT NULL;`);
    } catch (schemaErr) {
      console.warn("Pre-boot database column check bypassed:", schemaErr);
    }

    // 1. MOUNT STATIC FILE SERVERS FIRST (Fixes the root 401 gate blocker)
    if (app.get("env") !== "development") {
      const path = await import("path");
      const clientBuildPath = path.resolve(process.cwd(), "dist", "public");
      app.use(express.static(clientBuildPath));
      
      // Fallback fallback rule for root asset execution routing
      app.get("/", (_req, res) => {
        res.sendFile(path.resolve(clientBuildPath, "index.html"));
      });
    }
    
    // 2. NOW MOUNT THE ROUTE ENGINES AND AUTHENTICATION
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      const path = await import("path");
      const clientBuildPath = path.resolve(process.cwd(), "dist", "public");
      
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
          return res.status(404).json({ message: "API Route Not Found" });
        }
        res.sendFile(path.resolve(clientBuildPath, "index.html"));
      });
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`Server started on 0.0.0.0:${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
