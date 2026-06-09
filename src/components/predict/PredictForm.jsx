import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { squadData } from '../../utils/tournamentData';

function PlayerCard({ player, isSelected, onClick, disabled }) {
  const [photoUrl, setPhotoUrl] = useState(player.pictureUrl || localStorage.getItem(`photo_${player.name}`) || '');

  useEffect(() => {
    if (player.pictureUrl) {
      setPhotoUrl(player.pictureUrl);
      return;
    }
    if (photoUrl) return;

    let isMounted = true;
    async function fetchPhoto() {
      try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(player.name)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const pInfo = data.player?.[0];
        const url = pInfo?.strCutout || pInfo?.strThumb || '';
        if (url) {
          localStorage.setItem(`photo_${player.name}`, url);
          if (isMounted) setPhotoUrl(url);
        }
      } catch (err) {
        // Fallback handled by showing initials
      }
    }
    fetchPhoto();
    return () => { isMounted = false; };
  }, [player.name, player.pictureUrl, photoUrl]);

  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
        isSelected 
          ? 'border-[#F5C518] bg-[#F5C518]/10 shadow-[0_0_12px_rgba(245,197,24,0.15)] scale-[1.03]' 
          : 'border-white/5 bg-white/[0.02] hover:border-[#F5C518]/30 hover:bg-white/[0.06] hover:scale-[1.02]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden mb-2 relative flex-shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-gray-400">{initials}</span>
        )}
      </div>
      <span className="text-white text-[11px] font-semibold text-center truncate w-full leading-tight mb-0.5">
        {player.name}
      </span>
      <span className="text-gray-500 text-[9px] uppercase tracking-wider text-center truncate w-full font-mono">
        {player.position}
      </span>
    </button>
  );
}

export default function PredictForm() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId') || 'wc2026_002';
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [homeGoals, setHomeGoals] = useState(2);
  const [awayGoals, setAwayGoals] = useState(1);
  const [manOfTheMatch, setManOfTheMatch] = useState('');
  const [motmPhotoUrl, setMotmPhotoUrl] = useState('');
  // Squad States
  const [homeSquad, setHomeSquad] = useState([]);
  const [awaySquad, setAwaySquad] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdownText, setCountdownText] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const fallbackHomeSquad = [
    { name: 'Kylian Mbappé', position: 'Forward' },
    { name: 'Antoine Griezmann', position: 'Midfielder' },
    { name: 'Olivier Giroud', position: 'Forward' },
    { name: 'Ousmane Dembélé', position: 'Forward' },
    { name: 'Aurélien Tchouaméni', position: 'Midfielder' }
  ];

  const fallbackAwaySquad = [
    { name: 'Jamal Musiala', position: 'Midfielder' },
    { name: 'Kai Havertz', position: 'Forward' },
    { name: 'Florian Wirtz', position: 'Midfielder' },
    { name: 'Leroy Sané', position: 'Forward' },
    { name: 'İlkay Gündoğan', position: 'Midfielder' }
  ];

  // Format Date to IST
  const formatKickoffIST = (kickoffTime) => {
    const kickoff = kickoffTime?.toDate ? kickoffTime.toDate() : new Date(kickoffTime);
    return kickoff.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' IST';
  };

  // Fetch match, prediction, and squads
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadPredictData() {
      try {
        if (!db) {
          setError("Database is not connected.");
          setLoading(false);
          return;
        }

        const matchRef = doc(db, 'matches', matchId);
        const matchSnap = await getDoc(matchRef);

        if (!matchSnap.exists()) {
          setError("Match not found.");
          setLoading(false);
          return;
        }

        const matchData = {
          id: matchSnap.id,
          ...matchSnap.data()
        };
        setMatch(matchData);

        // Fetch Squads from local tournamentData
        const homeName = matchData.homeTeam?.name;
        const awayName = matchData.awayTeam?.name;
        
        const hList = (squadData[homeName] || []).map(p => ({
          id: p.number,
          name: p.name,
          position: p.position || 'Player',
          pictureUrl: p.pictureUrl || ''
        }));
        
        const aList = (squadData[awayName] || []).map(p => ({
          id: p.number,
          name: p.name,
          position: p.position || 'Player',
          pictureUrl: p.pictureUrl || ''
        }));

        setHomeSquad(hList);
        setAwaySquad(aList);

        // Fetch existing prediction
        if (user.isMock || !db) {
          const mockPredStr = localStorage.getItem(`mock_pred_${user.uid}_${matchId}`);
          if (mockPredStr) {
            const predData = JSON.parse(mockPredStr);
            setHomeGoals(parseInt(predData.homeGoals) ?? 2);
            setAwayGoals(parseInt(predData.awayGoals) ?? 1);
            setManOfTheMatch(predData.manOfTheMatch || '');
            setMotmPhotoUrl(predData.motmPhotoUrl || '');
          }
        } else {
          const predId = `${user.uid}_${matchId}`;
          const predRef = doc(db, 'predictions', predId);
          const predSnap = await getDoc(predRef);

          if (predSnap.exists()) {
            const predData = predSnap.data();
            setHomeGoals(parseInt(predData.homeGoals) ?? 2);
            setAwayGoals(parseInt(predData.awayGoals) ?? 1);
            setManOfTheMatch(predData.manOfTheMatch || '');
            setMotmPhotoUrl(predData.motmPhotoUrl || '');
          }
        }
      } catch (err) {
        console.error("Error loading prediction data:", err);
        setError("Failed to load match configuration.");
      } finally {
        setLoading(false);
      }
    }

    loadPredictData();
  }, [matchId, user]);

  // Countdown timer & Auto-locking
  useEffect(() => {
    if (!match) return;
    const kickoff = match.kickoffTime?.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);

    const updateCountdown = async () => {
      const now = new Date();
      const diff = kickoff.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText('🔒 Predictions Locked');
        if (!isLocked) {
          setIsLocked(true);
          // Auto lock: write to Firestore
          if (user && db) {
            const predId = `${user.uid}_${matchId}`;
            try {
              const predRef = doc(db, 'predictions', predId);
              await setDoc(predRef, {
                id: predId,
                userId: user.uid,
                matchId: matchId,
                isLocked: true,
                submittedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error("Failed to auto-lock prediction in Firestore:", err);
            }
          }
        }
      } else {
        const diffHours = diff / (1000 * 60 * 60);
        if (diffHours > 24) {
          const days = Math.floor(diffHours / 24);
          const remainingHours = Math.floor(diffHours % 24);
          setCountdownText(`🔒 Locks in ${days}d ${remainingHours}h`);
        } else {
          const hours = Math.floor(diffHours);
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdownText(`🔒 Locks in ${hours}h ${mins}m ${secs}s`);
        }
        setIsLocked(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [match, isLocked, user, matchId]);

  const handleSelectPlayer = (player) => {
    setManOfTheMatch(player.name);
    const photo = player.pictureUrl || localStorage.getItem(`photo_${player.name}`) || '';
    setMotmPhotoUrl(photo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setError("Kickoff has passed! Submissions are locked.");
      return;
    }

    if (!manOfTheMatch) {
      setError("Please pick a Man of the Match.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const predId = `${user.uid}_${matchId}`;
      const photoToSave = motmPhotoUrl || localStorage.getItem(`photo_${manOfTheMatch}`) || '';
      
      const predictionDoc = {
        id: predId,
        userId: user.uid,
        matchId: matchId,
        homeGoals: isNaN(parseInt(homeGoals)) ? 0 : parseInt(homeGoals),
        awayGoals: isNaN(parseInt(awayGoals)) ? 0 : parseInt(awayGoals),
        manOfTheMatch,
        motmPhotoUrl: photoToSave,
        submittedAt: new Date().toISOString(),
        isLocked: false
      };

      if (user.isMock || !db) {
        localStorage.setItem(`mock_pred_${user.uid}_${matchId}`, JSON.stringify(predictionDoc));
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        const predRef = doc(db, 'predictions', predId);
        await setDoc(predRef, predictionDoc);

        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving prediction:", err);
      setError("Failed to record your prediction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredHomeSquad = (homeSquad.length > 0 ? homeSquad : fallbackHomeSquad).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAwaySquad = (awaySquad.length > 0 ? awaySquad : fallbackAwaySquad).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSquadByPosition = (squadList, teamType, teamName) => {
    const positionsOrder = ['GK', 'DF', 'MF', 'FW'];
    const positionNames = {
      'GK': 'Goalkeepers',
      'DF': 'Defenders',
      'MF': 'Midfielders',
      'FW': 'Forwards',
      'Player': 'Players'
    };

    const grouped = {
      'GK': [],
      'DF': [],
      'MF': [],
      'FW': [],
      'Player': []
    };

    squadList.forEach(player => {
      const pos = (player.position || 'Player').toUpperCase();
      if (pos === 'GK' || pos.includes('GOAL') || pos === 'GOALKEEPER') {
        grouped['GK'].push(player);
      } else if (pos === 'DF' || pos.includes('DEF') || pos === 'DEFENDER') {
        grouped['DF'].push(player);
      } else if (pos === 'MF' || pos.includes('MID') || pos === 'MIDFIELDER') {
        grouped['MF'].push(player);
      } else if (pos === 'FW' || pos.includes('FOR') || pos.includes('ATT') || pos === 'FORWARD' || pos === 'STRIKER') {
        grouped['FW'].push(player);
      } else {
        grouped['Player'].push(player);
      }
    });

    const hasPlayers = Object.values(grouped).some(arr => arr.length > 0);

    return (
      <div className="space-y-4">
        <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center justify-between border-b border-white/5 pb-2">
          <span>{teamName}</span>
          <span className="text-[9px] text-gray-500 font-bold px-2 py-0.5 rounded bg-white/5">{teamType}</span>
        </div>
        {!hasPlayers ? (
          <p className="text-gray-500 text-xs italic py-2 text-left">No players found</p>
        ) : (
          <div className="space-y-4 text-left">
            {positionsOrder.map(posCode => {
              const players = grouped[posCode];
              if (players.length === 0) return null;
              return (
                <div key={posCode} className="space-y-2">
                  <div className="text-[10px] font-bold text-[#F5C518]/90 uppercase tracking-widest pl-1 font-mono">
                    {positionNames[posCode]}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {players.map((player) => (
                      <PlayerCard
                        key={player.name}
                        player={player}
                        isSelected={manOfTheMatch === player.name}
                        onClick={() => handleSelectPlayer(player)}
                        disabled={isLocked || saving}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {grouped['Player'].length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-[#F5C518]/90 uppercase tracking-widest pl-1 font-mono">
                  Other Players
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {grouped['Player'].map((player) => (
                    <PlayerCard
                      key={player.name}
                      player={player}
                      isSelected={manOfTheMatch === player.name}
                      onClick={() => handleSelectPlayer(player)}
                      disabled={isLocked || saving}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide text-xs">Loading prediction sheet...</p>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="card text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Error Loading Match</h3>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <Link to="/" className="inline-block bg-[#F5C518] text-black font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 page-enter">
      
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-[#F5C518] font-semibold text-xs tracking-wider uppercase transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="text-center mb-2">
        <h2 className="font-display text-4xl font-extrabold text-white tracking-wide uppercase mb-1">
          Make Your Prediction
        </h2>
        <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">
          FIFA WORLD CUP 2026™ — GROUP STAGE
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Match Card & Score Inputs (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Match Header with Crests */}
          <div className="card relative overflow-hidden bg-gradient-to-br from-[#0F1520]/90 to-[#0A0E17]/90 border border-white/10 rounded-2xl p-6 shadow-2xl">
            {/* Background stadium glow overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,24,0.08),transparent_70%)] pointer-events-none" />
            
            <div className="flex items-center justify-between select-none relative z-10">
              {/* Home Team */}
              <div className={`flex-1 flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300 ${
                homeGoals > awayGoals 
                  ? 'border-[#F5C518]/50 bg-[#F5C518]/5 shadow-[0_0_20px_rgba(245,197,24,0.15)]' 
                  : 'border-transparent bg-transparent'
              }`}>
                <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 p-1.5 flex items-center justify-center overflow-hidden mb-2 shadow-lg transition-transform duration-300 hover:scale-105">
                  {match.homeTeam?.crest ? (
                    <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">{match.homeTeam?.flag || '⚽'}</span>
                  )}
                </div>
                <span className="font-display text-2xl font-black text-white uppercase tracking-wider">{match.homeTeam?.code}</span>
                <span className="text-xs text-gray-400 font-semibold mt-0.5 truncate max-w-[120px]">{match.homeTeam?.name}</span>
              </div>

              {/* VS */}
              <div className="flex-none px-4 flex flex-col items-center">
                <span className="text-gray-500 font-bold text-sm tracking-widest uppercase">VS</span>
              </div>

              {/* Away Team */}
              <div className={`flex-1 flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300 ${
                awayGoals > homeGoals 
                  ? 'border-[#F5C518]/50 bg-[#F5C518]/5 shadow-[0_0_20px_rgba(245,197,24,0.15)]' 
                  : 'border-transparent bg-transparent'
              }`}>
                <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 p-1.5 flex items-center justify-center overflow-hidden mb-2 shadow-lg transition-transform duration-300 hover:scale-105">
                  {match.awayTeam?.crest ? (
                    <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">{match.awayTeam?.flag || '⚽'}</span>
                  )}
                </div>
                <span className="font-display text-2xl font-black text-white uppercase tracking-wider">{match.awayTeam?.code}</span>
                <span className="text-xs text-gray-400 font-semibold mt-0.5 truncate max-w-[120px]">{match.awayTeam?.name}</span>
              </div>
            </div>

            {/* Kickoff Info */}
            <div className="text-center mt-6 pt-4 border-t border-white/5 space-y-1 relative z-10">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Kickoff: {match.kickoffTime ? formatKickoffIST(match.kickoffTime) : '—'}
              </p>
              <p className="text-xs font-extrabold text-[#F5C518] tracking-wider uppercase">
                {countdownText}
              </p>
            </div>
          </div>

          {/* Lock Warning banner */}
          {isLocked && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Predictions Locked</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  Predictions lock automatically at kickoff time.
                </p>
              </div>
            </div>
          )}

          {/* Score Predictor Card */}
          <div className="card space-y-4">
            <div className="section-label !mb-2 !text-left text-[#F5C518]">Predict the Score</div>
            
            <div className="score-input-group !my-2">
              
              {/* Home goals input selectors */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">{match.homeTeam?.code}</span>
                <div className="score-input-box border-white/10 hover:border-[#F5C518]/30">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={homeGoals}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      setHomeGoals(cleanVal === '' ? '' : Math.max(0, parseInt(cleanVal)));
                    }}
                    disabled={isLocked || saving}
                    className="score-input-number"
                  />
                  <div className="score-arrows border-l border-white/10">
                    <button
                      type="button"
                      onClick={() => setHomeGoals(prev => (prev === '' ? 0 : prev) + 1)}
                      disabled={isLocked || saving}
                      className="score-arrow-btn hover:bg-white/5"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHomeGoals(prev => Math.max(0, (prev === '' ? 0 : prev) - 1))}
                      disabled={isLocked || saving}
                      className="score-arrow-btn border-t border-white/10 hover:bg-white/5"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <span className="font-display text-4xl text-gray-600 font-extrabold mx-2 mt-4">—</span>

              {/* Away goals input selectors */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">{match.awayTeam?.code}</span>
                <div className="score-input-box border-white/10 hover:border-[#F5C518]/30">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={awayGoals}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      setAwayGoals(cleanVal === '' ? '' : Math.max(0, parseInt(cleanVal)));
                    }}
                    disabled={isLocked || saving}
                    className="score-input-number"
                  />
                  <div className="score-arrows border-l border-white/10">
                    <button
                      type="button"
                      onClick={() => setAwayGoals(prev => (prev === '' ? 0 : prev) + 1)}
                      disabled={isLocked || saving}
                      className="score-arrow-btn hover:bg-white/5"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwayGoals(prev => Math.max(0, (prev === '' ? 0 : prev) - 1))}
                      disabled={isLocked || saving}
                      className="score-arrow-btn border-t border-white/10 hover:bg-white/5"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-950/20 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Prediction submitted successfully! Redirecting...</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLocked || saving}
            className="submit-btn"
          >
            {saving ? 'SUBMITTING...' : 'SUBMIT PREDICTION'}
          </button>

          <p className="deadline-text uppercase tracking-widest text-[9px] font-bold text-gray-500 mt-2 text-center">
            PREDICTION DEADLINE: {match.kickoffTime ? formatKickoffIST(match.kickoffTime) : '—'}
          </p>

        </div>

        {/* Right Column: MOTM Selector (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="section-label !mb-0 text-[#F5C518]">Man of the Match</div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Required</span>
            </div>

            {/* Search Input with standard glass design */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLocked || saving}
                placeholder="Search player by name..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F5C518]/50 focus:ring-1 focus:ring-[#F5C518]/20 transition-all font-sans"
              />
            </div>

            {/* Selected MOTM Banner */}
            {manOfTheMatch && (
              <div className="bg-[#F5C518]/5 border border-[#F5C518]/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(245,197,24,0.05)] transition-all animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#F5C518] bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                    {motmPhotoUrl ? (
                      <img src={motmPhotoUrl} alt={manOfTheMatch} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#F5C518]">{manOfTheMatch.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-[#F5C518] uppercase tracking-widest font-bold font-display">Your Selected Pick</span>
                    <span className="text-base font-extrabold text-white block leading-tight">{manOfTheMatch}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#F5C518] font-mono tracking-widest uppercase font-bold border border-[#F5C518]/30 px-2.5 py-1 rounded bg-[#F5C518]/10">SELECTED</span>
              </div>
            )}

            {/* Scrollable Container for Squads */}
            <div className="max-h-[420px] overflow-y-auto space-y-6 pr-2 custom-scrollbar border border-white/5 rounded-xl p-4 bg-black/20">
              {/* Home Team Squad */}
              {renderSquadByPosition(filteredHomeSquad, 'HOME', match.homeTeam?.name || 'Home Team')}

              {/* Away Team Squad */}
              {renderSquadByPosition(filteredAwaySquad, 'AWAY', match.awayTeam?.name || 'Away Team')}
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
