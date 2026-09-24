import React from 'react';
import { UserCheck, ArrowRight, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
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

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.loginDriver(targetEmail, targetPass);
      if (!res.user) throw new Error('Driver profile was not returned by Supabase Auth.');
      const driverUser = res.user;
      onLoginSuccess(driverUser);
    } catch (err: any) {
      setError(err.message || 'Driver login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleDriverSignup = async () => {
    const name = window.prompt('Full name');
    const email = window.prompt('Choose a username (3–32 letters, numbers, dots, underscores, or hyphens)');
    const phone = window.prompt('Phone number');
    const licenseNumber = window.prompt('PSV licence number');
    const licenseExpiry = window.prompt('Licence expiry (YYYY-MM-DD)');
    const signupPassword = window.prompt('Create a password (at least 12 characters)');
    if (!name || !email || !phone || !licenseNumber || !licenseExpiry || !signupPassword) return;

    setLoading(true);
    setError(null);
    try {
      await ApiService.driverSignup({ name, email, phone, licenseNumber, licenseExpiry, password: signupPassword });
      setEmail(email);
      setPassword('');
      window.alert('Your driver account has been created. Enter your password above to sign in.');
    } catch (err: any) {
      setError(err.message || 'Unable to create driver account.');
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-black text-black">
            Driver Cockpit Login
          </h2>
          <p className="text-xs font-bold text-neutral-600">
            TransCar rongai • Fleet Operations & Ticket Scanner
          </p>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Username
            </label>
            <input
              id="driver-email-input"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.mwangi"
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                PIN or Password
              </label>
              <span className="text-[11px] text-neutral-500 font-bold">Supabase Auth password</span>
            </div>
            <input
              id="driver-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              id="driver-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-neutral-900 text-amber-400 font-black text-sm rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Driver Session...</span>
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
        <button type="button" onClick={handleDriverSignup} disabled={loading} className="w-full text-xs font-black text-amber-700 hover:text-black underline cursor-pointer disabled:opacity-50">
          New driver? Create your account
        </button>


        {/* Back Link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-neutral-600 hover:text-black font-black transition-colors cursor-pointer"
          >
            ← Return to TransCar Rongai Public Home
          </button>
        </div>
      </div>
    </div>
  );
};
