import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Trophy, User, Medal } from 'lucide-react';

const mockLeaderboardPlayers = [
  { id: "1", uid: "1", name: "Predictor FC", email: "predictor@rit.ac.in", predictionsCount: 12, totalPoints: 2450, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=PredictorFC" },
  { id: "2", uid: "2", name: "GoalGuru", email: "goalguru@rit.ac.in", predictionsCount: 11, totalPoints: 2150, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=GoalGuru" },
  { id: "3", uid: "3", name: "PitchMaster", email: "pitch@rit.ac.in", predictionsCount: 10, totalPoints: 1980, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=PitchMaster" },
  { id: "4", uid: "4", name: "NetBuster", email: "net@rit.ac.in", predictionsCount: 9, totalPoints: 1750, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=NetBuster" },
  { id: "5", uid: "5", name: "CornerKing", email: "corner@rit.ac.in", predictionsCount: 8, totalPoints: 1620, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=CornerKing" },
  { id: "6", uid: "6", name: "FootyFanatic", email: "footy@rit.ac.in", predictionsCount: 7, totalPoints: 1480, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=FootyFanatic" },
  { id: "7", uid: "7", name: "DribbleWizard", email: "dribble@rit.ac.in", predictionsCount: 6, totalPoints: 1350, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=DribbleWizard" },
  { id: "8", uid: "8", name: "TikiTakaPro", email: "tiki@rit.ac.in", predictionsCount: 5, totalPoints: 1210, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=TikiTakaPro" },
  { id: "9", uid: "9", name: "StrikeZone", email: "strike@rit.ac.in", predictionsCount: 4, totalPoints: 1150, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=StrikeZone" },
  { id: "10", uid: "10", name: "TheMoM", email: "mom@rit.ac.in", predictionsCount: 3, totalPoints: 1020, photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=TheMoM" },
];

const medalConfig = {
  1: { color: '#F5C518', glow: 'rgba(245,197,24,0.4)', label: '🥇', bg: 'rgba(245,197,24,0.10)', border: 'rgba(245,197,24,0.3)', size: 72 },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', label: '🥈', bg: 'rgba(192,192,192,0.07)', border: 'rgba(192,192,192,0.2)', size: 60 },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.3)', label: '🥉', bg: 'rgba(205,127,50,0.07)', border: 'rgba(205,127,50,0.2)', size: 54 },
};

/* Responsive CSS injected once */
const leaderboardStyles = `
  .lb-podium-container { display: flex; gap: 12px; align-items: flex-end; width: 100%; justify-content: center; }
  .lb-podium-card.lb-podium-rank-1 { flex: 1.2; padding: 28px 24px; order: 2; }
  .lb-podium-card.lb-podium-rank-2 { flex: 1; padding: 20px 18px; order: 1; }
  .lb-podium-card.lb-podium-rank-3 { flex: 1; padding: 20px 18px; order: 3; }
  .lb-rank-row { display: grid; grid-template-columns: 50px 1fr 100px; align-items: center; }
  .lb-rank-header { display: grid; grid-template-columns: 50px 1fr 100px; }
  .lb-header-title { font-size: 36px; }
  .lb-trophy-img { width: 80px; }
  .lb-trophy-container { display: flex; justify-content: center; }
  .lb-header-trophy-mobile { display: none; }

  @media (max-width: 640px) {
    .lb-podium-container { gap: 6px !important; }
    .lb-podium-card { gap: var(--mobile-gap) !important; border-radius: 12px !important; }
    .lb-podium-card.lb-podium-rank-1 { padding: var(--mobile-pad) !important; }
    .lb-podium-card.lb-podium-rank-2 { padding: var(--mobile-pad) !important; }
    .lb-podium-card.lb-podium-rank-3 { padding: var(--mobile-pad) !important; }
    
    .lb-podium-emoji { font-size: var(--mobile-font-size-emoji) !important; }
    .lb-podium-avatar { width: var(--mobile-size) !important; height: var(--mobile-size) !important; border-width: 2px !important; }
    .lb-podium-name { font-size: var(--mobile-font-size-name) !important; max-width: 70px !important; }
    .lb-podium-pts { font-size: var(--mobile-font-size-pts) !important; }
    .lb-podium-pts-label { font-size: 7px !important; letter-spacing: 0.05em !important; }
    .lb-podium-you-badge { font-size: 7px !important; padding: 1px 5px !important; top: -6px !important; }

    .lb-trophy-container { display: none !important; }
    .lb-header-trophy-mobile { display: block !important; }

    .lb-rank-row { grid-template-columns: 32px 1fr 60px; padding: 10px 12px !important; }
    .lb-rank-header { grid-template-columns: 32px 1fr 60px; padding: 8px 12px !important; }
    .lb-header-title { font-size: 22px; }
    .lb-trophy-img { width: 56px; }
    .lb-rank-num { font-size: 12px !important; }
    .lb-rank-avatar { width: 28px !important; height: 28px !important; }
    .lb-rank-name { font-size: 12px !important; }
    .lb-rank-pts { font-size: 14px !important; }
    .lb-rank-you { font-size: 7px !important; padding: 1px 5px !important; }
  }
`;

function PodiumCard({ player, rank, isCurrentUser }) {
  const cfg = medalConfig[rank];
  return (
    <div 
      className={`lb-podium-card lb-podium-rank-${rank} ${isCurrentUser ? 'is-current' : ''}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 18,
        boxShadow: isCurrentUser ? `0 0 0 2px ${cfg.color}` : `0 8px 32px rgba(0,0,0,0.35)`,
        position: 'relative',
        transition: 'transform 0.2s',
        '--mobile-size': rank === 1 ? '44px' : rank === 2 ? '36px' : '32px',
        '--mobile-pad': rank === 1 ? '12px 6px' : '8px 6px',
        '--mobile-gap': '4px',
        '--mobile-font-size-emoji': rank === 1 ? '20px' : '16px',
        '--mobile-font-size-name': '10px',
        '--mobile-font-size-pts': rank === 1 ? '15px' : '13px',
      }}
    >
      {isCurrentUser && (
        <div 
          className="lb-podium-you-badge"
          style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            background: cfg.color, color: '#05091A',
            borderRadius: 999, padding: '2px 10px',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif'
          }}
        >
          YOU
        </div>
      )}
      <div className="lb-podium-emoji" style={{ fontSize: rank === 1 ? 28 : 22 }}>{cfg.label}</div>
      <div style={{ position: 'relative' }}>
        <img
          className="lb-podium-avatar"
          src={player.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}`}
          alt={player.name}
          style={{
            width: cfg.size, height: cfg.size, borderRadius: '50%',
            border: `3px solid ${cfg.color}`,
            boxShadow: `0 0 20px ${cfg.glow}`,
            objectFit: 'cover'
          }}
          referrerPolicy="no-referrer"
          onError={e => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}`; }}
        />
      </div>
      <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div 
          className="lb-podium-name"
          style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            fontSize: rank === 1 ? 16 : 14, color: '#F1F5F9',
            marginBottom: 2, maxWidth: 100, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}
        >
          {player.name}
        </div>
        <div 
          className="lb-podium-pts"
          style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: rank === 1 ? 22 : 18, color: cfg.color,
            lineHeight: 1
          }}
        >
          {(player.totalPoints || 0).toLocaleString()}
        </div>
        <div className="lb-podium-pts-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>PTS</div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setPlayers(mockLeaderboardPlayers); setLoading(false); return; }

    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'));
        const querySnapshot = await getDocs(q);
        const playersData = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          playersData.push({ id: doc.id, uid: d.uid, name: d.name, email: d.email, photoURL: d.photoURL, totalPoints: d.totalPoints || 0, predictionsCount: d.predictionsCount || 0 });
        });

        if (playersData.length < 3) {
          const merged = [...playersData];
          mockLeaderboardPlayers.forEach(mock => {
            if (!merged.some(p => p.uid === mock.uid || p.name === mock.name)) merged.push(mock);
          });
          merged.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
          setPlayers(merged.slice(0, 10));
        } else {
          setPlayers(playersData.slice(0, 10));
        }
      } catch (error) {
        console.error(error);
        setPlayers(mockLeaderboardPlayers);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(245,197,24,0.2)', borderTopColor: '#F5C518', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: 'Inter, sans-serif', color: '#475569', fontSize: 14 }}>Loading standings...</p>
    </div>
  );

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <>
      <style>{leaderboardStyles}</style>
      <div className="page-enter" style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '0 12px', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img
              src="/trophy.png"
              className="lb-header-trophy-mobile"
              alt="Trophy"
              style={{ width: 28, height: 28, filter: 'drop-shadow(0 0 6px rgba(245,197,24,0.5))' }}
            />
            <h1 className="lb-header-title" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#F1F5F9', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>
              LEADERBOARD
            </h1>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#475569', marginTop: 6, marginBottom: 0 }}>
            Top performers in the FIFA WC 2026 Predictor
          </p>
        </div>

        {/* Trophy */}
        <div className="lb-trophy-container">
          <img
            src="/trophy.png"
            alt="Trophy"
            className="trophy-float lb-trophy-img"
            style={{ height: 'auto', filter: 'drop-shadow(0 0 24px rgba(245,197,24,0.55))' }}
          />
        </div>

        {/* Podium — top 3 */}
        {top3.length >= 3 && (
          <div className="lb-podium-container">
            {top3.map((player, i) => (
              <PodiumCard
                key={player.id}
                player={player}
                rank={i + 1}
                isCurrentUser={user && player.uid === user.uid}
              />
            ))}
          </div>
        )}

        {/* Rank 4–10 list */}
        {rest.length > 0 && (
          <div style={{
            background: 'rgba(10,16,35,0.65)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            {/* Header row */}
            <div className="lb-rank-header" style={{
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              {['#', 'PLAYER', 'PTS'].map((h, i) => (
                <div key={h} style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700,
                  color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase',
                  textAlign: i === 2 ? 'right' : i === 0 ? 'center' : 'left'
                }}>{h}</div>
              ))}
            </div>

            {rest.map((player, i) => {
              const rank = i + 4;
              const isCurrentUser = user && player.uid === user.uid;
              return (
                <div key={player.id} className="lb-rank-row" style={{
                  padding: '13px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isCurrentUser ? 'rgba(245,197,24,0.05)' : 'transparent',
                  borderLeft: isCurrentUser ? '2px solid rgba(245,197,24,0.5)' : '2px solid transparent',
                  transition: 'background 0.15s'
                }}>
                  <div className="lb-rank-num" style={{ textAlign: 'center', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 700, color: '#334155' }}>{rank}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <img
                      className="lb-rank-avatar"
                      src={player.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}`}
                      alt={player.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
                      referrerPolicy="no-referrer"
                      onError={e => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.name)}`; }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                      <span className="lb-rank-name" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: isCurrentUser ? '#F5C518' : '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </span>
                      {isCurrentUser && (
                        <span className="lb-rank-you" style={{
                          background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.3)',
                          color: '#F5C518', borderRadius: 999, padding: '1px 7px', flexShrink: 0,
                          fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase'
                        }}>YOU</span>
                      )}
                    </div>
                  </div>
                  <div className="lb-rank-pts" style={{ textAlign: 'right', fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: isCurrentUser ? '#F5C518' : '#94A3B8' }}>
                    {(player.totalPoints || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
