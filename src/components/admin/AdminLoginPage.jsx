import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Key, ArrowRight, AlertTriangle } from 'lucide-react';
import packageJson from '../../../package.json';

export default function AdminLoginPage() {
  const { loginAdmin, loginWithGoogle, logout, user, isAdmin, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  // Verification redirect: If authenticated user is an admin, navigate to /admin.
  // Otherwise, display an error and sign out to avoid stale sessions.
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate(from, { replace: true });
      } else {
        setError('Access denied. Your Google account does not have administrator privileges.');
        logout();
      }
    }
  }, [user, isAdmin, navigate, from, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      await loginAdmin(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Access denied. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };



  return (
    <div className="login-page w-full min-h-screen relative flex items-center justify-center p-4">
      {/* Dark Overlay System */}
      <div className="login-overlay overlay-heavy z-1" />

      {/* Bokeh Background Elements */}
      <div className="absolute inset-0 z-2 pointer-events-none">
        <div className="particle" style={{ left: '15%', animationDelay: '0s', animationDuration: '9s' }} />
        <div className="particle" style={{ left: '40%', animationDelay: '2s', animationDuration: '11s' }} />
        <div className="particle" style={{ left: '75%', animationDelay: '1s', animationDuration: '13s' }} />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="login-card p-8 border border-red-500/20 bg-[#0A0E1A]/90 relative">
          
          {/* Security Shield Indicator */}
          <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-red-500 stroke-[1.5]" />
          </div>

          <h2 className="login-title-wc26 text-[28px] uppercase tracking-wider text-center text-white font-display">
            ADMIN PORTAL
          </h2>
          <h3 className="login-title-predictor text-xs tracking-[4px] text-center -mt-1 text-gray-500">
            SYSTEM CONTROL LOG IN
          </h3>

          {/* Divider */}
          <div className="login-divider my-6">
            <div className="login-divider-line bg-red-500/20" />
            <span className="login-divider-icon text-red-500">🛡️</span>
            <div className="login-divider-line bg-red-500/20" />
          </div>

          {(error || authError) && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-left text-xs text-red-400 flex items-start gap-2 font-sans">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5 font-bold">ACCESS CONTROL ERROR:</strong>
                <span>{error || authError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition font-sans"
                />
                <Lock className="w-4 h-4 text-gray-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">
                Access Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0A0E1A] border border-white/10 rounded-xl p-3 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition font-mono"
                />
                <Key className="w-4 h-4 text-gray-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="google-btn !bg-red-600 hover:!bg-red-500 !text-white border-none w-full flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Access</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center justify-between my-5">
            <span className="w-1/5 border-b border-white/5"></span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">OR</span>
            <span className="w-1/5 border-b border-white/5"></span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-btn hover:bg-white/5 border border-red-500/20 text-white w-full flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="google-logo" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>


        </div>

        {/* Outer bottom copyright footer */}
        <div className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest leading-none flex flex-col gap-2">
          <p>© 2026 SYSTEM ADMINISTRATION GATEWAY</p>
          <p className="text-[9px] text-gray-700 lowercase tracking-normal">version {packageJson.version}</p>
        </div>
      </div>
    </div>
  );
}
