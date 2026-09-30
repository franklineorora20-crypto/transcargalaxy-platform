import crypto from 'crypto';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin must only be imported by server-side code');
}

const DEFAULT_LINKED_SUPABASE_URL = 'https://vjhztgdkvrqfhsilhpda.supabase.co';

const rawSupabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_LINKED_SUPABASE_URL;

export const supabaseUrl = rawSupabaseUrl.trim();

const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim();

const anonKey = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

// Effective key for Supabase Auth (prefers anon key, falls back to service role key if provided on server)
const authApiKey =
  (anonKey && !anonKey.includes('your-') ? anonKey : '') ||
  (serviceRoleKey && !serviceRoleKey.includes('your-') ? serviceRoleKey : '');

// TODO: Rotate service-role key in Supabase dashboard > API > Reset service_role key before production
const leakedServiceRoleKeySha256 = '75c006ee052b7ab7481a3d76a3749e5c8620a5d8738e85491e0f2935d4ad36e5';
const isKnownLeakedServiceRoleKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex') === leakedServiceRoleKeySha256;

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl.startsWith('http') &&
  serviceRoleKey &&
  !isKnownLeakedServiceRoleKey(serviceRoleKey) &&
  !serviceRoleKey.includes('your-')
);

export const isSupabaseAuthConfigured = Boolean(
  supabaseUrl.startsWith('http') &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  authApiKey
);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const supabaseAuth: SupabaseClient | null = isSupabaseAuthConfigured
  ? createClient(supabaseUrl, authApiKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export function getSupabaseAuthStatus() {
  return {
    connected: isSupabaseAuthConfigured,
    adminConnected: isSupabaseAdminConfigured,
    projectUrl: supabaseUrl,
    projectRef: 'vjhztgdkvrqfhsilhpda',
    hasAnonKey: Boolean(anonKey && !anonKey.includes('your-')),
    hasServiceRoleKey: isSupabaseAdminConfigured,
  };
}

export async function getSupabaseUser(accessToken: string): Promise<User | null> {
  if (!supabaseAuth) return null;
  try {
    const { data, error } = await supabaseAuth.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return data.user;
  } catch (err) {
    return null;
  }
}

export async function getSupabaseProfile(accessToken: string, userId: string): Promise<{ role?: string; full_name?: string; phone?: string } | null> {
  if (!supabaseUrl || !authApiKey) return null;
  try {
    const userClient = createClient(supabaseUrl, authApiKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await userClient.from('profiles').select('role, full_name, phone').eq('id', userId).maybeSingle();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export function logSupabaseConfigurationWarning() {
  if (isKnownLeakedServiceRoleKey(serviceRoleKey)) {
    console.warn('WARNING: The configured Supabase service-role key matches the leaked default. Rotate it before production.');
  }
  if (!isSupabaseAdminConfigured) {
    console.warn('WARNING: Supabase admin persistence is not configured; protected database operations will fail closed.');
  }
}
