// src/components/ui/BottomNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, ClipboardList, Trophy, Shield } from "lucide-react";

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}>
        <LayoutDashboard size={20} />
        <span>Dash</span>
      </Link>
      <Link to="/predictions" className={`bottom-nav-item ${isActive("/predictions") ? "active" : ""}`}>
        <ClipboardList size={20} />
        <span>My Picks</span>
      </Link>
      <Link to="/leaderboard" className={`bottom-nav-item ${isActive("/leaderboard") ? "active" : ""}`}>
        <Trophy size={20} />
        <span>Leaderboard</span>
      </Link>
      {user.isAdmin && (
        <Link to="/admin" className={`bottom-nav-item ${isActive("/admin") ? "active" : ""}`} style={{ color: isActive("/admin") ? "var(--accent-gold)" : "var(--text-muted)" }}>
          <Shield size={20} />
          <span>Admin</span>
        </Link>
      )}
    </div>
  );
}
