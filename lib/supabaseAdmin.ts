import crypto from 'crypto';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin must only be imported by server-side code');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// TODO: Rotate service-role key in Supabase dashboard > API > Reset service_role key before production
const leakedServiceRoleKeySha256 = '75c006ee052b7ab7481a3d76a3749e5c8620a5d8738e85491e0f2935d4ad36e5';
const isKnownLeakedServiceRoleKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex') === leakedServiceRoleKeySha256;

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl.startsWith('http') &&
  serviceRoleKey &&
  !isKnownLeakedServiceRoleKey(serviceRoleKey) &&
  !serviceRoleKey.includes('your-')
);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const supabaseAuth: SupabaseClient | null = supabaseUrl.startsWith('http') && anonKey
  ? createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

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
  if (!supabaseUrl || !anonKey) return null;
  try {
    const userClient = createClient(supabaseUrl, anonKey, {
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
