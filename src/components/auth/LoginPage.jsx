import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Star, Trophy, Globe, Zap } from 'lucide-react';
import packageJson from '../../../package.json';
import FifaTrophy from '../dashboard/FifaTrophy';

const features = [
  { icon: Target, label: 'Predict Matches', desc: 'Score predictions, man of the match, and more.' },
  { icon: Star, label: 'Earn Points', desc: '+5 exact score · +2 correct outcome · +3 MOTM' },
  { icon: Trophy, label: 'Climb the Ranks', desc: 'Compete on the global leaderboard.' },
  { icon: Globe, label: 'Global Competition', desc: 'Challenge fans from around the world.' },
];

export default function LoginPage() {
  const { loginWithGoogle, loginMockUser, user, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginMockUser();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page w-full min-h-screen relative flex items-center justify-center p-4 lg:p-12">
      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {[10, 25, 45, 65, 80].map((left, i) => (
          <div
            key={i}
            className="particle"
            style={{ left: `${left}%`, animationDelay: `${i * 1.5}s`, animationDuration: `${8 + i * 2}s` }}
          />
        ))}
      </div>

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64 }}>

        {/* LEFT — Brand showcase (desktop only) */}
        <div style={{ display: 'none', flexDirection: 'column', gap: 40, maxWidth: 480, flex: 1 }} className="lg:!flex">
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 58, fontWeight: 900, lineHeight: 1.05, color: '#F1F5F9', letterSpacing: '-0.01em', marginBottom: 16 }}>
              FIFA WORLD CUP
              <br />
              <span className="gold-shimmer" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 58 }}>2026 PREDICTOR</span>
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#94A3B8', lineHeight: 1.7, maxWidth: 400 }}>
              The ultimate FIFA World Cup fantasy platform. Predict every match, earn points, and rise to the top.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(245,197,24,0.08)',
                  border: '1px solid rgba(245,197,24,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon style={{ width: 18, height: 18, color: '#F5C518', strokeWidth: 1.75 }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 700, color: '#F5C518', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live stat pills */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[['64', 'Teams'], ['48', 'Matches'], ['100M+', 'Fans']].map(([num, label]) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '10px 16px',
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#F5C518' }}>{num}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Login Card */}
        <div style={{ width: 400, maxWidth: '100%' }}>
          <div className="login-card">

            {/* Trophy */}
            <div style={{ marginBottom: 20 }}>
              <FifaTrophy width="90px" height="122px" />
            </div>

            {/* Heading */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 4 }}>
              <h1 className="login-title-wc26" style={{ fontSize: 48, letterSpacing: '0.1em' }}>FIFA</h1>
              <h1 className="login-title-wc26" style={{ fontSize: 48, letterSpacing: '0.1em', marginTop: -4 }}>WORLD CUP</h1>
              <h1 className="login-title-wc26" style={{ fontSize: 48, letterSpacing: '0.1em', marginTop: -4 }}>2026</h1>
              <h2 className="login-title-predictor">PREDICTOR</h2>
            </div>

            {/* Divider */}
            <div className="login-divider" style={{ width: '100%' }}>
              <div className="login-divider-line" />
              <span className="login-divider-icon">🏆</span>
              <div className="login-divider-line" />
            </div>

            <p className="login-subtitle">Only @rit.ac.in accounts can sign in</p>

            {/* Error */}
            {(error || authError) && (
              <div style={{
                width: '100%',
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                fontSize: 12,
                color: '#F87171',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                <span style={{ fontWeight: 700, display: 'block', marginBottom: 3 }}>⚠️ Sign In Error</span>
                {error || authError}
              </div>
            )}

            {/* Google button */}
            <button onClick={handleLogin} disabled={loading} className="google-btn" style={{ width: '100%' }}>
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2.5px solid #ccc', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

            <div className="login-footer" style={{ textTransform: 'none', letterSpacing: '0.05em' }}>
              Created by Bhagath Krishnan · <a href="https://instagram.com/b_k.dev" target="_blank" rel="noopener noreferrer" style={{ color: '#F5C518', textDecoration: 'none', fontWeight: 600 }} className="hover:underline">b_k.dev</a> · v{packageJson.version}
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 10, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            © 2026 FIFA World Cup Predictor — RIT
          </div>
        </div>
      </div>
    </div>
  );
}
