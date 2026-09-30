import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import * as Sentry from '@sentry/node';

import { logSupabaseConfigurationWarning } from './lib/supabaseAdmin';
import { ensureMpesaCallbackUrl } from './server/services/mpesaService';
import { setAuthDriversProvider } from './server/middleware';
import {
  bookings,
  drivers,
  loadRuntimeState,
  persistRuntimeState,
  registerBookingNormalizer,
} from './server/store';
import { ensureBookingTickets } from './server/domain/tickets/ticketService';
import { startSeatLockCleanupInterval } from './server/domain/bookings/bookingService';

import tripsRouter from './server/routes/trips';
import bookingsRouter from './server/routes/bookings';
import ticketsRouter from './server/routes/tickets';
import driverRouter from './server/routes/driver';
import managerRouter from './server/routes/manager';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
  });
}

// Fallback production M-Pesa Callback URL if not explicitly provided
ensureMpesaCallbackUrl();

// Initialize domain hooks and background intervals
setAuthDriversProvider(() => drivers);
registerBookingNormalizer(ensureBookingTickets);
bookings.forEach((b) => ensureBookingTickets(b));
startSeatLockCleanupInterval();

// =============================================================
// EXPRESS APPLICATION
// =============================================================

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// =============================================================
// MIDDLEWARE
// =============================================================

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (req as any).rawBody = Buffer.from(buffer);
    },
  }),
);

app.use((req, res, next) => {
  res.on('finish', () => {
    if (
      req.path.startsWith('/api/') &&
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) &&
      res.statusCode < 400
    ) {
      void persistRuntimeState();
    }
  });

  next();
});

// =============================================================
// STATIC FILES
// =============================================================

if (!process.env.VERCEL) {
  app.use(
    '/images',
    express.static(path.join(process.cwd(), 'public', 'images')),
  );

  app.use(express.static(path.join(process.cwd(), 'public')));
}

// =============================================================
// SITEMAP, ROBOTS & HEALTH ENDPOINTS
// =============================================================

app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol =
    req.protocol === 'https' || req.get('x-forwarded-proto') === 'https'
      ? 'https'
      : 'http';
  const baseUrl = `${protocol}://${host}`;

  const primaryCorridors = [
    { slug: 'massai-mall-kisii', priority: '1.0', changefreq: 'hourly', origin: 'Maasai Mall / Ongata Rongai', destination: 'Kisii' },
    { slug: 'ongata-rongai-kisii', priority: '0.95', changefreq: 'daily', origin: 'Ongata Rongai', destination: 'Kisii' },
    { slug: 'kisii-massai-mall', priority: '0.95', changefreq: 'daily', origin: 'Kisii', destination: 'Maasai Mall / Rongai' },
    { slug: 'kisii-ongata-rongai', priority: '0.90', changefreq: 'daily', origin: 'Kisii', destination: 'Ongata Rongai' },
    { slug: 'ngong-kisii', priority: '0.90', changefreq: 'daily', origin: 'Ngong', destination: 'Kisii' },
    { slug: 'kisii-ngong', priority: '0.85', changefreq: 'daily', origin: 'Kisii', destination: 'Ngong' },
    { slug: 'kiserian-kisii', priority: '0.90', changefreq: 'daily', origin: 'Kiserian', destination: 'Kisii' },
    { slug: 'kisii-kiserian', priority: '0.85', changefreq: 'daily', origin: 'Kisii', destination: 'Kiserian' },
    { slug: 'massai-mall-sirare', priority: '0.85', changefreq: 'daily', origin: 'Rongai', destination: 'Sirare' },
    { slug: 'sirare-massai-mall', priority: '0.80', changefreq: 'daily', origin: 'Sirare', destination: 'Rongai' },
    { slug: 'massai-mall-migori', priority: '0.85', changefreq: 'daily', origin: 'Rongai', destination: 'Migori' },
    { slug: 'migori-massai-mall', priority: '0.80', changefreq: 'daily', origin: 'Migori', destination: 'Rongai' },
    { slug: 'massai-mall-awendo', priority: '0.85', changefreq: 'daily', origin: 'Rongai', destination: 'Awendo' },
    { slug: 'awendo-massai-mall', priority: '0.80', changefreq: 'daily', origin: 'Awendo', destination: 'Rongai' },
    { slug: 'massai-mall-rongo', priority: '0.80', changefreq: 'daily', origin: 'Rongai', destination: 'Rongo' },
    { slug: 'rongo-massai-mall', priority: '0.80', changefreq: 'daily', origin: 'Rongo', destination: 'Rongai' },
    { slug: 'massai-mall-kehancha', priority: '0.80', changefreq: 'daily', origin: 'Rongai', destination: 'Kehancha' },
    { slug: 'kehancha-massai-mall', priority: '0.80', changefreq: 'daily', origin: 'Kehancha', destination: 'Rongai' },
  ];

  const now = new Date().toISOString().split('T')[0];

  const xmlUrls = [
    `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/booking</loc>
    <lastmod>${now}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.95</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/retrieve-ticket</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/routes</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/fleet</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`,
    `  <url>
    <loc>${baseUrl}/safety</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>`,
    ...primaryCorridors.map(
      (c) => `  <url>
    <loc>${baseUrl}/booking/${c.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${c.changefreq}</changefreq>
    <priority>${c.priority}</priority>
  </url>`,
    ),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(xml.trim());
});

app.get('/robots.txt', (_req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /manager-portal/
Disallow: /driver-portal/
Disallow: /api/
Disallow: /admin/

Sitemap: https://transcargalaxy-platform.vercel.app/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(robots);
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SafariLine Express Transport Management System',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================
// DOMAIN ROUTERS
// =============================================================

app.use(tripsRouter);
app.use(bookingsRouter);
app.use(ticketsRouter);
app.use(driverRouter);
app.use(managerRouter);

// =============================================================
// API 404 & ERROR HANDLERS
// =============================================================

// Ensure all unmatched /api routes and unhandled /api errors return valid JSON rather than HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON request body.',
    });
  }
  console.error('[API Error]:', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const safeMessage =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred. Please try again.'
      : err?.message || 'An unexpected server error occurred. Please try again.';
  res.status(status).json({
    error: safeMessage,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    if (res.headersSent) return;
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
      return res.status(400).json({
        error: 'Malformed JSON request body.',
      });
    }
    const status = typeof err?.status === 'number' ? err.status : 500;
    const safeMessage =
      status >= 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred. Please try again.'
        : err?.message || 'An unexpected server error occurred. Please try again.';
    return res.status(status).json({
      error: safeMessage,
    });
  }
  next(err);
});

// =============================================================
// VITE MIDDLEWARE & SERVER STARTUP
// =============================================================

async function startServer() {
  logSupabaseConfigurationWarning();

  await loadRuntimeState();

  // Development: Vite middleware
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.VERCEL
  ) {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }
  // Production local server: serve compiled Vite application
  else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only start Express with app.listen() locally.
  // Vercel imports the app as a serverless function.
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  🚀 TransCar Galaxy Server is ready!`);
      console.log(`  ➜ Local:   http://localhost:${PORT}/`);
      console.log(`  ➜ Network: http://127.0.0.1:${PORT}/\n`);
    });
  }
}

// Local development / production outside Vercel
if (!process.env.VERCEL) {
  void startServer();
} else {
  // Vercel serverless initialization
  void loadRuntimeState();
}

export default app;
export { app };
