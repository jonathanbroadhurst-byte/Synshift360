import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon WebSocket constructor
neonConfig.webSocketConstructor = ws;

// Enhanced environment variable validation
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.error('Invalid DATABASE_URL format:', databaseUrl.substring(0, 20) + '...');
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
}

// Create database connection with enhanced error handling
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  pool = new Pool({ 
    connectionString: databaseUrl,
    // Add connection pool configuration for better reliability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzle({ client: pool, schema });
  
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { pool, db };