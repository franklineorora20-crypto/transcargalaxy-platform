import React, { useState } from 'react';
import {
  UserCheck,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  UserPlus,
  X,
  Phone,
  CreditCard,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface DriverLoginProps {
  onLoginSuccess: (driverData: any) => void;
  onCancel: () => void;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = React.useState('frankline.orora');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // In-app signup modal state (replaces window.prompt to avoid iframe blocks)
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: 'Captain Frankline Orora',
    email: 'frankline.orora',
    phone: '+254724626199',
    licenseNumber: 'DL-FRK8492',
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
      if (!res.user) throw new Error('Driver profile was not returned by Auth service.');
      const driverUser = res.user;
      onLoginSuccess(driverUser);
    } catch (err: any) {
      setError(err.message || 'Driver authentication failed. Please verify credentials.');
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

      setSignupSuccess('Account created successfully! You can now sign in with your credentials.');
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
    <div className="max-w-md mx-auto my-12 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border-2 border-black shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-black mx-auto shadow-md">
            <UserCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-black tracking-tight">
            Driver Cockpit Login
          </h2>
          <p className="text-xs font-bold text-neutral-600">
            TransCar Rongai • Fleet Operations, Live Telematics & Fast Gate Boarding
          </p>
        </div>

        {/* Quick Driver Profile Preset */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div>
            <span className="font-black block">Active Roster Captain:</span>
            <span className="font-bold text-amber-800">Captain Frankline Orora (KDE 416Q)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('frankline.orora');
              setPassword('Transcar@2026');
            }}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] rounded-lg border border-black shadow-sm transition-all cursor-pointer"
          >
            Fill Demo Pass
          </button>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Driver Username / ID
            </label>
            <input
              id="driver-email-input"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. frankline.orora"
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                PIN or Password
              </label>
              <span className="text-[11px] text-neutral-500 font-bold">Secure Access PIN</span>
            </div>
            <input
              id="driver-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              id="driver-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-neutral-900 text-amber-400 font-black text-sm rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Authenticating Captain Session...</span>
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enter Driver Scanner Cockpit</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowSignupModal(true)}
            className="text-xs font-black text-amber-700 hover:text-black underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Driver? Register PSV Profile</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-neutral-600 hover:text-black font-black transition-colors cursor-pointer"
          >
            ← Return to TransCar Rongai Public Portal
          </button>
        </div>
      </div>

      {/* Driver Registration Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-black max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 border border-black text-black">
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Register PSV Driver Profile</h3>
                  <p className="text-xs text-neutral-500">TransCar Rongai Fleet Operations</p>
                </div>
              </div>
              <button
                onClick={() => setShowSignupModal(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-black mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="e.g. Captain Frankline Orora"
                  className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-black mb-1">Username / Identifier</label>
                  <input
                    type="text"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="e.g. frankline.orora"
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-mono font-bold focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-black mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="e.g. +254 724 626199"
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-bold focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-black mb-1">PSV License Number</label>
                  <input
                    type="text"
                    required
                    value={signupForm.licenseNumber}
                    onChange={(e) => setSignupForm({ ...signupForm, licenseNumber: e.target.value })}
                    placeholder="e.g. DL-FRK8492"
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-mono font-bold focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-black mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={signupForm.licenseExpiry}
                    onChange={(e) => setSignupForm({ ...signupForm, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-bold focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-black mb-1">Security Password / PIN</label>
                <input
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-bold focus:border-black focus:outline-none"
                />
              </div>

              {signupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{signupSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  className="px-4 py-2 border-2 border-neutral-300 rounded-xl font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl border border-black shadow flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {signupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
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
