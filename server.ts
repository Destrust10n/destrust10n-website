import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleContactRequest } from './server/contactHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Trust reverse proxy (e.g. NGINX, Cloudflare, Vercel) for accurate client IP identification
app.set('trust proxy', 1);

// Disable 'x-powered-by' header to prevent server fingerprinting
app.disable('x-powered-by');

// Strict CORS Configuration: Whitelist local and production studio domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin, curl, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by Security Policy'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  })
);

// Strict request body limits (Prevents memory exhaustion and Denial-of-Service)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Hardened Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Comprehensive Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Enforce HSTS in production environments
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Restrict browser features and sensors
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()'
  );
  // Cross domain policy
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// Sanitized API request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toISOString();
    console.log(`[DESTRUST10N API] [${timestamp}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    brand: 'DESTRUST10N',
    tagline: 'Building Beyond Limits',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: 'node-server',
    storageProviders: {
      supabase: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
      firestore: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY),
      resendMailer: Boolean(process.env.RESEND_API_KEY),
    },
  });
});

// Universal contact form API route with strict validation and multi-store persistence
app.all('/api/contact', (req: Request, res: Response) => {
  return handleContactRequest(req as any, res as any);
});

// Global Error Handler (Never leaks internal stack traces to the public)
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(`[DESTRUST10N Error] ${req.method} ${req.path}:`, errMsg);
  res.status(500).json({
    success: false,
    message: 'A secure server error occurred while processing the request.',
  });
});

async function start() {
  if (!isProd) {
    // Development mode: attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[DESTRUST10N Server] Running at http://localhost:${PORT} in ${
        isProd ? 'production' : 'development'
      } mode (Security Hardened)`
    );
  });
}

start().catch((err) => {
  console.error('[DESTRUST10N Server] Fatal startup failure:', err);
  process.exit(1);
});
