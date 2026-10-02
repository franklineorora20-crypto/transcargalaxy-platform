import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import {
  supabaseAdmin,
  getSupabaseProfile,
  getSupabaseUser,
} from '../../lib/supabaseAdmin.js';
import { INITIAL_DRIVERS } from '../../src/data/mockData.js';
import type { Driver, Trip, UserRole } from '../../src/types/index.js';

export interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
  userId: string;
}

const localSessions = new Map<string, { user: AuthUser; expiresAt: number }>();
const revokedTokens = new Set<string>();
const driverPasswordHashes = new Map<string, string>();

let driversProvider: () => Driver[] = () => INITIAL_DRIVERS;

export function setAuthDriversProvider(provider: () => Driver[]) {
  driversProvider = provider;
}

function getSessionHmacSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'transcar-galaxy-hmac-session-secret-2026'
  );
}

export function hashPassword(password: string): string {
  return crypto
    .createHmac('sha256', getSessionHmacSecret())
    .update(password)
    .digest('hex');
}

export function setDriverPassword(emailOrId: string, password: string): void {
  const key = String(emailOrId || '').trim().toLowerCase();
  if (!key) return;
  driverPasswordHashes.set(key, hashPassword(password));
}

export function verifyDriverStoredPassword(
  keys: string[],
  password: string,
): boolean | null {
  for (const rawKey of keys) {
    const key = String(rawKey || '').trim().toLowerCase();
    if (key && driverPasswordHashes.has(key)) {
      const expected = driverPasswordHashes.get(key)!;
      const actual = hashPassword(password);
      return (
        expected.length === actual.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
      );
    }
  }
  return null;
}

export function createLocalSession(
  user: AuthUser,
  ttlMs = 7 * 24 * 60 * 60 * 1000,
): string {
  const prefix = user.role === 'DRIVER' ? 'tc_drv_sess_' : 'tc_mgr_sess_';
  const nonce = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + ttlMs;
  const payloadB64 = Buffer.from(
    JSON.stringify({
      u: user.userId,
      r: user.role,
      e: user.email,
      n: user.name,
      exp: expiresAt,
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionHmacSecret())
    .update(`${prefix}${nonce}.${payloadB64}`)
    .digest('hex');
  const token = `${prefix}${nonce}.${payloadB64}.${sig}`;
  localSessions.set(token, {
    user,
    expiresAt,
  });
  return token;
}

export function revokeLocalSession(token: string): void {
  const clean = String(token || '').trim();
  if (!clean) return;
  localSessions.delete(clean);
  revokedTokens.add(clean);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(String(token || '').trim());
}

export function getLocalSessionUser(token: string): AuthUser | null {
  const clean = String(token || '').trim();
  if (!clean || revokedTokens.has(clean)) {
    return null;
  }

  const session = localSessions.get(clean);
  if (session) {
    if (Date.now() > session.expiresAt) {
      localSessions.delete(clean);
      return null;
    }
    return session.user;
  }

  // Verify cryptographically signed local session token across server restarts
  if (
    clean.startsWith('tc_drv_sess_') ||
    clean.startsWith('tc_mgr_sess_')
  ) {
    const parts = clean.split('.');
    if (parts.length === 3) {
      const [prefixAndNonce, payloadB64, sig] = parts;
      const expectedSig = crypto
        .createHmac('sha256', getSessionHmacSecret())
        .update(`${prefixAndNonce}.${payloadB64}`)
        .digest('hex');

      if (
        sig.length === expectedSig.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
      ) {
        try {
          const decoded = JSON.parse(
            Buffer.from(payloadB64, 'base64url').toString('utf8'),
          );
          if (
            decoded &&
            typeof decoded.exp === 'number' &&
            Date.now() <= decoded.exp &&
            (decoded.r === 'DRIVER' || decoded.r === 'MANAGER') &&
            typeof decoded.u === 'string'
          ) {
            const restoredUser: AuthUser = {
              userId: decoded.u,
              role: decoded.r,
              email: String(decoded.e || ''),
              name: String(decoded.n || ''),
            };
            localSessions.set(clean, {
              user: restoredUser,
              expiresAt: decoded.exp,
            });
            return restoredUser;
          }
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

export function isTripAssignedToDriver(trip: Trip, user: AuthUser): boolean {
  if (!user) return false;
  if (user.role === 'MANAGER') return true;
  if (trip.driverId === user.userId) return true;
  if (
    trip.driverName &&
    user.name &&
    trip.driverName.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    return true;
  }
  const drivers = driversProvider();
  const matchedDriver = drivers.find((d) => d.id === user.userId);
  if (
    matchedDriver &&
    trip.driverName &&
    matchedDriver.name.trim().toLowerCase() ===
      trip.driverName.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

export async function authenticateUser(
  req: Request,
): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader
    .slice('Bearer '.length)
    .trim();

  if (!accessToken || revokedTokens.has(accessToken)) {
    return null;
  }

  const localUser = getLocalSessionUser(accessToken);
  if (localUser) {
    return localUser;
  }

  try {
    const user = await getSupabaseUser(accessToken);

    if (!user) {
      return null;
    }

    let role = String(
      user.user_metadata?.role || '',
    ).toLowerCase();

    let profile = await getSupabaseProfile(
      accessToken,
      user.id,
    );

    if (!role && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        profile = data || profile;
      } catch {
        // Ignore remote Supabase errors in fallback mode
      }
    }

    role = role || String(
      profile?.role || '',
    ).toLowerCase();

    if (profile?.full_name) {
      user.user_metadata.full_name = profile.full_name;
    }

    const normalizedRole: UserRole | null =
      role === 'admin' || role === 'manager'
        ? 'MANAGER'
        : role === 'driver'
          ? 'DRIVER'
          : role === 'customer'
            ? 'CUSTOMER_PUBLIC'
            : null;

    if (!normalizedRole) {
      return null;
    }

    return {
      email: user.email || '',
      role: normalizedRole,
      name:
        user.user_metadata?.full_name ||
        user.email ||
        'User',
      userId: user.id,
    };
  } catch {
    return null;
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  authenticateUser(req)
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          error:
            'Valid Supabase Auth access token required.',
        });
      }

      (req as any).user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({
        error:
          'Unable to validate authentication token.',
      });
    });
}

export function requireRole(
  ...roles: Array<'admin' | 'manager' | 'driver' | 'customer'>
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    requireAuth(req, res, () => {
      const user = (req as any).user as AuthUser;

      const role =
        user.role === 'MANAGER'
          ? 'admin'
          : user.role === 'CUSTOMER_PUBLIC'
            ? 'customer'
            : user.role.toLowerCase();

      if (
        !roles.includes(role as any) &&
        !(user.role === 'MANAGER' && (roles.includes('admin') || roles.includes('manager')))
      ) {
        return res.status(403).json({
          error: 'Insufficient permissions.',
        });
      }

      next();
    });
  };
}

export const requireManager = requireRole('admin', 'manager');

export const requireDriverOrManager = requireRole(
  'driver',
  'admin',
  'manager',
);
