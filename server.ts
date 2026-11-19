import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
  projectId: string;
};

// Initialize Firebase Admin Auth strictly for cryptographic ID token verification (no IAM required)
const adminApp = getApps().length
  ? getApp()
  : initializeApp({ projectId: firebaseConfig.projectId });
const adminAuth = getAuth(adminApp);

const ADMIN_EMAIL = 'priyanshugoswami802@gmail.com';
const PORT = Number(process.env.PORT) || 3000;

// In-memory rate limiter for /api/* protection against brute-force / scraping
const rateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || entry.resetAt < now) {
    rateBucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 60) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  entry.count += 1;
  return next();
}

// Middleware: Verifies Firebase ID token cryptographically and requires a verified email
async function requireVerifiedAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Empty ID token' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email || decoded.email_verified !== true) {
      return res.status(403).json({
        error: 'Access denied: A verified email account is required.',
      });
    }
    (req as Request & { adminUser?: { uid: string; email: string; isPrimaryOwner: boolean } }).adminUser = {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      isPrimaryOwner: decoded.email.toLowerCase() === ADMIN_EMAIL,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Global security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use('/api', rateLimiter);

  // Public health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'student-manch-backend', timestamp: new Date().toISOString() });
  });

  // Protected Admin verification endpoint (verifies Firebase ID token cryptographically)
  app.post('/api/admin/verify', requireVerifiedAdmin, (req, res) => {
    const adminUser = (
      req as Request & { adminUser?: { uid: string; email: string; isPrimaryOwner: boolean } }
    ).adminUser;
    res.json({
      authorized: true,
      uid: adminUser?.uid,
      email: adminUser?.email,
      isPrimaryOwner: Boolean(adminUser?.isPrimaryOwner),
      securityMode: 'firestore-whitelist-and-verified-token',
    });
  });

  // Block unknown /api routes cleanly
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Manch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
