import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import packageJson from '../../../package.json';
import {
  Home,
  Calendar,
  History,
  Trophy,
  Shield,
  LogOut,
  User,
  HelpCircle,
  Award,
  X,
  Zap
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const [points, setPoints] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [activeTab, setActiveTab] = useState('predictor');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    if (!db) { setPoints(2450); return; }

    const fetchPoints = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) setPoints(docSnap.data().totalPoints || 0);
      } catch (e) { console.error(e); }
    };

    fetchPoints();
    const interval = setInterval(fetchPoints, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dash';
      case '/predict': return 'Predict';
      case '/my-predictions': return 'My Picks';
      case '/leaderboard': return 'Leaderboard';
      case '/dream-team': return 'Dream Team';
      case '/admin': return 'Admin';
      default: return 'FIFA WC 2026';
    }
  };


  const sidebarItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Predict', path: '/predict', icon: Calendar },
    { name: 'My Picks', path: '/my-predictions', icon: History },
    { name: 'Dream Team', path: '/dream-team', icon: Award },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen text-white flex font-sans" style={{ background: 'transparent' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar select-none">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img
              src="/trophy.png"
              alt="Trophy"
              style={{ width: 22, height: 22, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(245,197,24,0.5))' }}
            />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">FIFA WC 2026</span>
            <span className="sidebar-logo-sub">Predictor</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.name}</span>
            </NavLink>
          ))}

          <button
            onClick={() => setShowHowToPlay(true)}
            className="sidebar-nav-item"
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
          >
            <HelpCircle className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">How to Play</span>
          </button>

          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ color: '#F87171', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
          >
            <LogOut className="sidebar-nav-icon" style={{ color: '#F87171' }} />
            <span className="sidebar-nav-label">Logout</span>
          </button>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.15)' }}
            >
              <Shield className="sidebar-nav-icon" style={{ color: '#F87171' }} />
              <span className="sidebar-nav-label">Admin</span>
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-version">v{packageJson.version}</span>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="main-content">

        {/* Header */}
        <header className="header-bar select-none">
          <div className="header-bar-inner">
            <h1 className="page-title">{getPageTitle()}</h1>

            <div className="header-right">
              {user && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 999,
                  padding: '6px 14px 6px 6px'
                }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="user-avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="user-avatar">
                      <User style={{ width: 16, height: 16 }} />
                    </div>
                  )}
                  <div className="user-info hidden sm:flex">
                    <span className="user-name">{user.displayName || 'Player'}</span>
                  </div>
                </div>
              )}

              <div className="points-chip">
                <Trophy style={{ width: 15, height: 15, color: '#F5C518' }} />
                <span>{points.toLocaleString()} PTS</span>
              </div>

              <button
                onClick={() => setShowHowToPlay(true)}
                className="mobile-help-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  cursor: 'pointer',
                  color: '#F5C518',
                  padding: 0,
                  outline: 'none',
                  transition: 'all 0.2s',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="How to Play"
              >
                <HelpCircle style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-wrapper">
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="bottom-nav select-none">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="bottom-nav-icon" />
                <span className="bottom-nav-label">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="bottom-nav-item"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <HelpCircle className="bottom-nav-icon" />
            <span className="bottom-nav-label">Rules</span>
          </button>
        </nav>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="modal-overlay" onClick={() => setShowHowToPlay(false)}>
          <div className="modal-content" style={{ maxWidth: 440, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHowToPlay(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>

            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#F5C518', marginBottom: 18 }}>
              🏆 HOW TO PLAY
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setActiveTab('predictor')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: activeTab === 'predictor' ? '#F5C518' : 'transparent',
                  color: activeTab === 'predictor' ? '#0A0E1A' : '#94A3B8'
                }}
              >
                Predictor
              </button>
              <button
                onClick={() => setActiveTab('dreamteam')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: activeTab === 'dreamteam' ? '#F5C518' : 'transparent',
                  color: activeTab === 'dreamteam' ? '#0A0E1A' : '#94A3B8'
                }}
              >
                Dream Team
              </button>
            </div>

            {/* Tab contents */}
            {activeTab === 'predictor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
                <p>Predict upcoming matches before their kickoff deadlines to earn points and climb the leaderboard.</p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Exact Score Match', '+5 pts', '#22C55E'],
                    ['Correct Match Outcome', '+2 pts', '#22C55E'],
                    ['Correct Man of the Match', '+3 pts', '#22C55E'],
                    ['Knockout Penalty Shootout Winner', '+2 pts', '#F5C518'],
                  ].map(([label, pts, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, color: '#F1F5F9' }}>{label}</span>
                      <span style={{ color, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15 }}>{pts}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#94A3B8', lineHeight: 1.6 }}>
                  🎯 <strong style={{ color: '#F5C518' }}>Knockout Draw?</strong> When you predict a draw in any knockout stage match (Round of 32 to Final), you'll be asked to pick the penalty shootout winner for bonus points!
                </div>

                <p style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  Predictions lock at kickoff time automatically.
                </p>
              </div>
            )}

            {activeTab === 'dreamteam' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
                <p>Build a squad of 15 players within a <strong>$100.0M budget</strong> using players from the actual tournament.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#F5C518', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Squad Limits</span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <li>2 Goalkeepers, 5 Defenders, 5 Midfielders, 3 Forwards</li>
                      <li>Maximum of 3 players from any single country</li>
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#F5C518', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Starting XI, Bench & Captain</span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <li>Place 11 players in your starters and 4 on the bench. Both starting and benched players earn points.</li>
                      <li>Appoint a Captain to earn double (2x) points.</li>
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#F5C518', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Scoring (Top 10 Rankings)</span>
                    <p style={{ margin: 0, fontSize: 12 }}>Points are awarded based on official rankings per position:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginTop: 4 }}>
                      <div>Rank 1: +10 pts</div>
                      <div>Rank 2: +9 pts</div>
                      <div>Rank 10: +1 pt</div>
                      <div>Rank 11+: 0 pts</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
