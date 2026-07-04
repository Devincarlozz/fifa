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
  const [groupsData, setGroupsData] = useState([]);
  const [teamsData, setTeamsData] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [loadingStandings, setLoadingStandings] = useState(true);

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
    let active = true;
    const fetchStandings = async () => {
      try {
        const [groupsRes, teamsRes] = await Promise.all([
          fetch("https://worldcup26.ir/get/groups"),
          fetch("https://worldcup26.ir/get/teams")
        ]);
        
        if (!groupsRes.ok || !teamsRes.ok) throw new Error("API error");
        
        const groupsJson = await groupsRes.json();
        const teamsJson = await teamsRes.json();
        
        if (!active) return;
        
        // Map teams list to a quick lookup map by ID
        const teamsMap = {};
        if (teamsJson && teamsJson.teams) {
          teamsJson.teams.forEach(t => {
            teamsMap[String(t.id)] = {
              name: t.name_en || t.name_fa || 'Unknown',
              code: t.fifa_code || 'TBD',
              flag: t.flag || 'https://flagcdn.com/w80/un.png'
            };
          });
        }
        
        if (groupsJson && groupsJson.groups) {
          setGroupsData(groupsJson.groups);
          setTeamsData(teamsMap);
          setLoadingStandings(false);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        console.error("Failed to fetch group standings, using mock fallback:", err);
        if (!active) return;
        
        // Populate mock groups A–L
        const fullMockGroups = [];
        const alphabet = 'ABCDEFGHIJKL';
        for (let i = 0; i < alphabet.length; i++) {
          const char = alphabet[i];
          const mockTeams = [];
          for (let j = 0; j < 4; j++) {
            const mockId = String(i * 4 + j + 1);
            mockTeams.push({
              team_id: mockId,
              mp: '0',
              w: '0',
              d: '0',
              l: '0',
              pts: '0',
              gf: '0',
              ga: '0',
              gd: '0'
            });
          }
          fullMockGroups.push({ name: char, teams: mockTeams });
        }

        const mockTeamsMap = {
          '1': { name: 'USA', code: 'USA', flag: 'https://flagcdn.com/w80/us.png' },
          '2': { name: 'Mexico', code: 'MEX', flag: 'https://flagcdn.com/w80/mx.png' },
          '3': { name: 'Canada', code: 'CAN', flag: 'https://flagcdn.com/w80/ca.png' },
          '4': { name: 'Argentina', code: 'ARG', flag: 'https://flagcdn.com/w80/ar.png' },
          '5': { name: 'Brazil', code: 'BRA', flag: 'https://flagcdn.com/w80/br.png' },
          '6': { name: 'France', code: 'FRA', flag: 'https://flagcdn.com/w80/fr.png' },
          '7': { name: 'Germany', code: 'GER', flag: 'https://flagcdn.com/w80/de.png' },
          '8': { name: 'England', code: 'ENG', flag: 'https://flagcdn.com/w80/gb-eng.png' },
        };
        
        // Fill other team codes dynamically so they aren't blank
        for (let i = 9; i <= 48; i++) {
          mockTeamsMap[String(i)] = {
            name: `Team ${i}`,
            code: `TM${i}`,
            flag: 'https://flagcdn.com/w80/un.png'
          };
        }

        setGroupsData(fullMockGroups);
        setTeamsData(mockTeamsMap);
        setLoadingStandings(false);
      }
    };
    fetchStandings();
    return () => { active = false; };
  }, []);

  const activeGroup = groupsData.find(g => g.name === selectedGroup);
  const activeGroupTeams = activeGroup ? activeGroup.teams : [];
  
  // Sort teams inside the group by points desc, then goal difference desc, then goals for desc
  const sortedActiveGroupTeams = [...activeGroupTeams].sort((a, b) => {
    const ptsA = parseInt(a.pts) || 0;
    const ptsB = parseInt(b.pts) || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const gdA = parseInt(a.gd) || 0;
    const gdB = parseInt(b.gd) || 0;
    if (gdB !== gdA) return gdB - gdA;
    const gfA = parseInt(a.gf) || 0;
    const gfB = parseInt(b.gf) || 0;
    return gfB - gfA;
  });

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
      </div>      {/* Middle Column: Group Standings Table fetched from API */}
      <div className="hidden lg:flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-4 w-[285px] shrink-0 relative z-1 font-sans shadow-lg backdrop-blur-md text-left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#F5C518', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Group Standings</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
              background: '#0A0E1A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#F1F5F9',
              fontSize: 10,
              padding: '2px 6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {'ABCDEFGHIJKL'.split('').map(char => (
              <option key={char} value={char}>Group {char}</option>
            ))}
          </select>
        </div>

        {loadingStandings ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
            <div style={{ width: 18, height: 18, border: '2.5px solid #F5C518', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          </div>
        ) : sortedActiveGroupTeams.length === 0 ? (
          <div style={{ fontSize: 11, color: '#64748B', padding: '20px 0', fontStyle: 'italic', textAlign: 'center' }}>
            No standings available.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: '#CBD5E1' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748B', fontWeight: 'bold' }}>
                <th style={{ padding: '6px 2px', textAlign: 'center', width: 25 }}>#</th>
                <th style={{ padding: '6px 4px', textAlign: 'left' }}>Team</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', width: 25 }}>P</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', width: 30 }}>GD</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', width: 30, color: '#F5C518' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {sortedActiveGroupTeams.map((team, idx) => {
                const teamInfo = teamsData[String(team.team_id)] || { name: `Team ${team.team_id}`, code: `T${team.team_id}`, flag: 'https://flagcdn.com/w80/un.png' };
                return (
                  <tr key={team.team_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', height: 32 }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: idx < 2 ? '#22C55E' : '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img 
                          src={teamInfo.flag} 
                          alt={teamInfo.name} 
                          style={{ width: 14, height: 10, objectFit: 'cover', borderRadius: 1 }}
                          onError={(e) => { e.target.src = 'https://flagcdn.com/w80/un.png'; }}
                        />
                        <span style={{ fontWeight: 'bold', color: '#F1F5F9' }} title={teamInfo.name}>{teamInfo.code}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{team.mp}</td>
                    <td style={{ textAlign: 'center', color: parseInt(team.gd) > 0 ? '#22C55E' : parseInt(team.gd) < 0 ? '#EF4444' : '#CBD5E1' }}>
                      {parseInt(team.gd) > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#F5C518' }}>{team.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
