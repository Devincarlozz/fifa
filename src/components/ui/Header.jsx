// src/components/ui/Header.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Trophy, LayoutDashboard, ClipboardList, Shield } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header animate-slide-in">
      <div className="container header-container">
        <Link to="/" className="logo">
          🏆 RIT <span>Predictor</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <LayoutDashboard size={16} />
              <span>Dash</span>
            </div>
          </Link>
          <Link to="/predictions" className={`nav-link ${isActive("/predictions") ? "active" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <ClipboardList size={16} />
              <span>My Picks</span>
            </div>
          </Link>
          <Link to="/leaderboard" className={`nav-link ${isActive("/leaderboard") ? "active" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Trophy size={16} />
              <span>Leaderboard</span>
            </div>
          </Link>
          {user.isAdmin && (
            <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-gold)" }}>
                <Shield size={16} />
                <span>Admin</span>
              </div>
            </Link>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="user-badge">
            <img src={user.photoURL} alt={user.name} className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "-2px" }}>
                {user.email}
              </span>
            </div>
            <div className="points-pill" style={{ marginLeft: "0.5rem" }}>
              {user.totalPoints || 0} PTS
            </div>
          </div>

          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ width: "auto", padding: "0.45rem 0.65rem", display: "inline-flex", borderRadius: "50%" }}
            title="Log Out"
          >
            <LogOut size={16} style={{ color: "var(--accent-red)" }} />
          </button>
        </div>
      </div>
    </header>
  );
}
