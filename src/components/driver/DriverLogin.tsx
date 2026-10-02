import React, { useState } from 'react';
import {
  UserCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
  UserPlus,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface DriverLoginProps {
  onLoginSuccess: (driverData: any) => void;
  onCancel: () => void;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '2028-12-31',
    password: '',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.loginDriver(targetEmail, targetPass);
      if (!res.user) throw new Error('Driver profile was not returned by authentication service.');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Driver authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.phone || !signupForm.licenseNumber || !signupForm.password) {
      setSignupError('Please complete all required fields.');
      return;
    }

    setSignupLoading(true);
    setSignupError(null);

    try {
      await ApiService.driverSignup({
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        licenseNumber: signupForm.licenseNumber,
        licenseExpiry: signupForm.licenseExpiry,
        password: signupForm.password,
      });

      setSignupSuccess('Driver profile registered. You may now sign in.');
      setEmail(signupForm.email);
      setPassword(signupForm.password);
      setTimeout(() => {
        setShowSignupModal(false);
        setSignupSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSignupError(err.message || 'Unable to register driver account.');
    } finally {
      setSignupLoading(false);
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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-amber-400 border border-slate-950/15 flex items-center justify-center text-slate-950 mx-auto shadow-sm">
            <UserCheck className="w-6 h-6 stroke-[2.25]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Driver Operations Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Sign in to manage assigned departures, passenger manifests, and QR boarding verification.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="driver-email-input"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Driver Email or Username
            </label>
            <input
              id="driver-email-input"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@transcarrongai.co.ke"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-amber-400/50 focus:outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="driver-password-input"
                className="block text-xs font-bold text-slate-800"
              >
                Password
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Authorized PSV Crew</span>
            </div>
            <input
              id="driver-password-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
              id="driver-login-submit"
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Driver Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowSignupModal(true)}
            className="font-bold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Register PSV Driver Profile</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>NTSA Compliant Crew Dispatch & Boarding Verification</span>
        </div>
      </div>

      {/* Driver Registration Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white/95 supports-[backdrop-filter]:bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 ring-1 ring-slate-900/10 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-950">
                    Register PSV Driver Profile
                  </h3>
                  <p className="text-xs text-slate-500">TransCar Rongai Fleet Operations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email or Username</label>
                  <input
                    type="text"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="driver@transcarrongai.co.ke"
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-mono font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">PSV License Number</label>
                  <input
                    type="text"
                    required
                    value={signupForm.licenseNumber}
                    onChange={(e) => setSignupForm({ ...signupForm, licenseNumber: e.target.value })}
                    placeholder="DL-XXXXXX"
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-mono font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={signupForm.licenseExpiry}
                    onChange={(e) => setSignupForm({ ...signupForm, licenseExpiry: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-medium focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl font-medium focus:border-slate-900 focus:outline-none"
                />
              </div>

              {signupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{signupSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {signupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Create Driver Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
