import React from 'react';
import { ShieldAlert, LogIn, Home, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: Array<'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER'>;
  currentRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onRedirectToLogin?: (targetRole: 'DRIVER' | 'MANAGER') => void;
  onRedirectHome?: () => void;
  fallbackMessage?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  currentRole,
  onRedirectToLogin,
  onRedirectHome,
  fallbackMessage,
  children,
}) => {
  const isAllowed = allowedRoles.includes(currentRole);

  if (isAllowed) {
    return <>{children}</>;
  }

  const isManagerRequired = allowedRoles.includes('MANAGER') && !allowedRoles.includes('DRIVER');
  const isDriverRequired = allowedRoles.includes('DRIVER') && !allowedRoles.includes('CUSTOMER_PUBLIC');
  const requiredRoleLabel = isManagerRequired ? 'Executive Manager' : isDriverRequired ? 'Fleet Driver' : 'Authorized User';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            Access Restricted (403)
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {requiredRoleLabel} Permission Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {fallbackMessage ||
              `You are attempting to access a protected area that requires ${requiredRoleLabel} credentials. Please sign in with an authorized account.`}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          {onRedirectToLogin && !allowedRoles.includes(currentRole) && (
            <button
              type="button"
              onClick={() => onRedirectToLogin(isManagerRequired ? 'MANAGER' : 'DRIVER')}
              className="craft-btn-amber text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as {requiredRoleLabel}</span>
            </button>
          )}

          {onRedirectHome && (
            <button
              type="button"
              onClick={onRedirectHome}
              className="craft-btn-secondary text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
