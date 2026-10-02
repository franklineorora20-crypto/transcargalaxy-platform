import React from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';

interface ManagerLoginProps {
  onLoginSuccess: (managerData: any) => void;
  onCancel: () => void;
}

export const ManagerLogin: React.FC<ManagerLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [supaStatus, setSupaStatus] = React.useState<{
    connected: boolean;
    projectUrl: string;
    hasAnonKey: boolean;
  } | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/supabase-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSupaStatus(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.loginManager(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif">
            Manager Login
          </h2>
          <p className="text-sm text-slate-500">
            Sign in with your Supabase Authentication account.
          </p>
        </div>

        {supaStatus && !supaStatus.connected ? (
          <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 text-xs rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold">Operations Director:</span>
              <button
                type="button"
                id="manager-fill-demo-btn"
                onClick={() => {
                  setEmail('admintranscar');
                  setPassword('admintranscar');
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] rounded-lg border border-black shadow-sm transition-all cursor-pointer"
              >
                Fill Credentials
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Dev Mode: Sign in with username <span className="font-mono font-bold">admintranscar</span> and password <span className="font-mono font-bold">admintranscar</span>, or use your Supabase credentials when connected.
            </p>
          </div>
        ) : null}

        {supaStatus?.connected && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center">
            Connected to Supabase Auth ({supaStatus.projectUrl.replace('https://', '')})
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Supabase Auth Email
            </label>
            <input
              id="manager-email-input"
              type="text"
              required
              placeholder="fgwaro@kabarak.ac.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <input
              id="manager-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="manager-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl space-y-1.5">
          <p className="font-bold text-slate-800">Managed via Supabase Authentication</p>
          <p>
            Internal administrative accounts do not use hardcoded passwords. Sign in with your Supabase Auth manager email and password, or reset credentials under <span className="font-mono font-semibold">Authentication → Users</span> in the Supabase console.
          </p>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            ← Back to Site
          </button>
        </div>
      </div>
    </div>
  );
};
