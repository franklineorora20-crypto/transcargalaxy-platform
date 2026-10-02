import React from 'react';
import { Lock, ArrowRight, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.loginManager(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid manager credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-10rem)] flex items-center justify-center py-10 px-4 overflow-hidden">
      {/* Ambient Background Glow for Glassmorphism Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-amber-400/20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md bg-white/85 supports-[backdrop-filter]:bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 ring-1 ring-slate-900/10 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.14)] p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Manager Operations Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Authorized access for fleet dispatch, route scheduling, and financial administration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="manager-email-input"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Manager Email or Username
            </label>
            <input
              id="manager-email-input"
              type="text"
              required
              autoComplete="username"
              placeholder="manager@transcarrongai.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-amber-400/50 focus:outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="manager-password-input"
                className="block text-xs font-bold text-slate-800"
              >
                Password
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Executive Access</span>
            </div>
            <input
              id="manager-password-input"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-amber-400/50 focus:outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              id="manager-login-submit"
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Manager Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Role-Based Administrative Security</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
