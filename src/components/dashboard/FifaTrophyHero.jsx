import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import FifaTrophy from './FifaTrophy';
import { Play, HelpCircle, Trophy, Users, CheckSquare, RefreshCw } from 'lucide-react';

export default function FifaTrophyHero() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ players: 0, predictions: 0 });
  const [webMatches, setWebMatches] = useState([]);
  const [loadingWeb, setLoadingWeb] = useState(true);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!db) return;
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let userPredCount = 0;
        if (user) {
          const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
          const userPredsSnap = await getDocs(q);
          userPredCount = userPredsSnap.size;
        }
        setStats({ players: usersSnap.size || 1, predictions: userPredCount });
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!db) {
      setLoadingWeb(false);
      return;
    }
    
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, orderBy('kickoffTime', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      const live = list.filter(m => m.status === 'IN_PLAY');
      const upcoming = list.filter(m => m.status === 'SCHEDULED');
      const finished = list.filter(m => m.status === 'FINISHED' || m.status === 'CONFIRMED' || m.confirmed);
      
      finished.sort((a, b) => {
        const tA = a.kickoffTime?.toDate ? a.kickoffTime.toDate() : new Date(a.kickoffTime);
        const tB = b.kickoffTime?.toDate ? b.kickoffTime.toDate() : new Date(b.kickoffTime);
        return tB - tA;
      });
      
      const merged = [...live, ...upcoming, ...finished].slice(0, 3);
      const formatted = merged.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam?.name || 'TBD',
        homeCode: m.homeTeam?.code || 'TBD',
        homeGoals: m.confirmedResult?.homeGoals ?? m.liveScore?.home ?? 0,
        awayTeam: m.awayTeam?.name || 'TBD',
        awayCode: m.awayTeam?.code || 'TBD',
        awayGoals: m.confirmedResult?.awayGoals ?? m.liveScore?.away ?? 0,
        status: m.status === 'IN_PLAY' ? 'LIVE' : m.confirmed ? 'FT' : 'SCHED',
        timeStr: m.status === 'IN_PLAY' ? 'LIVE' : m.confirmed ? 'FT' : m.kickoffTime ? new Date(m.kickoffTime.toDate ? m.kickoffTime.toDate() : m.kickoffTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBD'
      }));
      
      setWebMatches(formatted);
      setLoadingWeb(false);
    }, (err) => {
      console.error("Error listening to local matches in hero:", err);
      setLoadingWeb(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="trophy-hero-section w-full relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 page-enter">
      
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: '30%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Left: Content */}
      <div className="flex-1 flex flex-col gap-5 text-center md:text-left items-center md:items-start relative z-1" style={{ width: '100%' }}>
        
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.22)',
          borderRadius: 999, padding: '4px 12px',
          fontSize: 10, fontWeight: 700, color: '#F5C518', letterSpacing: '0.14em',
          textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
          width: 'fit-content'
        }}>
          <Trophy style={{ width: 12, height: 12 }} />
          Predictor Arena
        </div>

        <div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 36,
            fontWeight: 900,
            color: '#F1F5F9',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            marginBottom: 10
          }}>
            FIFA WORLD CUP <span style={{ color: '#F5C518' }}>2026</span>
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#64748B', lineHeight: 1.65, maxWidth: 440 }}>
            Predict every match, nominate the Man of the Match, and climb the global leaderboard in real time.
          </p>
        </div>

        {/* Stats row */}
        <div className="justify-center md:justify-start" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
          {[
            { icon: Users, value: stats.players, label: 'Players' },
            { icon: CheckSquare, value: stats.predictions, label: 'Your Picks', color: '#22C55E' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '10px 16px'
            }}>
              <Icon style={{ width: 16, height: 16, color: color || '#F5C518' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#F1F5F9', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="justify-center md:justify-start" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
          <Link to="/predict" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #F5C518 0%, #E5A800 100%)',
            color: '#05091A', fontFamily: 'Outfit, sans-serif',
            fontWeight: 800, fontSize: 12,
            padding: '12px 22px', borderRadius: 12,
            textDecoration: 'none', letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(245,197,24,0.28)',
            transition: 'all 0.2s',
          }}>
            <Play style={{ width: 14, height: 14, fill: '#05091A', strokeWidth: 0 }} />
            Start Predicting
          </Link>
          <Link to="/dream-team" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', color: '#CBD5E1',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12,
            padding: '12px 22px', borderRadius: 12,
            textDecoration: 'none', letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s',
          }}>
            <Trophy style={{ width: 14, height: 14 }} />
            Dream Team
          </Link>
        </div>
      </div>

      {/* Middle Column: Current Match Table fetched from web */}
      <div className="hidden lg:flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-4 w-[285px] shrink-0 relative z-1 font-sans shadow-lg backdrop-blur-md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#F5C518', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Scoreboard</span>
          <button 
            type="button"
            onClick={() => {
              setSpinning(true);
              setTimeout(() => setSpinning(false), 800);
            }} 
            disabled={spinning} 
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
            title="Scores update automatically in real-time"
          >
            <RefreshCw style={{ width: 12, height: 12 }} className={spinning ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingWeb ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid #F5C518', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          </div>
        ) : webMatches.length === 0 ? (
          <div style={{ fontSize: 11, color: '#64748B', padding: '20px 0', fontStyle: 'italic', textAlign: 'center' }}>
            No matches scheduled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {webMatches.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9', display: 'flex', gap: 4 }}>
                    <span>{m.homeCode}</span>
                    <span style={{ color: '#475569' }}>vs</span>
                    <span>{m.awayCode}</span>
                  </div>
                  <div style={{ fontSize: 8, color: '#64748B', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.homeTeam} vs {m.awayTeam}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#F5C518', fontFamily: 'monospace' }}>
                    {m.homeGoals} - {m.awayGoals}
                  </span>
                  <span style={{ fontSize: 8, color: m.status === 'LIVE' ? '#EF4444' : '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                    {m.timeStr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Trophy */}
      <div className="hidden md:flex" style={{
        width: 220, height: 220, flexShrink: 0,
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
        background: 'radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)',
        borderRadius: '50%'
      }}>
        <FifaTrophy />
      </div>
    </div>
  );
}
