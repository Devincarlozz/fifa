import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { squadData } from '../../utils/tournamentData';

function PlayerCard({ player, isSelected, onClick, disabled }) {
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
        <span className="text-xs font-bold text-gray-400">{initials}</span>
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
  const [activeMatchId, setActiveMatchId] = useState(searchParams.get('matchId') || '');
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
  const [predictedPenaltyWinner, setPredictedPenaltyWinner] = useState('');
  // Squad States
  const [homeSquad, setHomeSquad] = useState([]);
  const [awaySquad, setAwaySquad] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdownText, setCountdownText] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Tournament Awards States
  const [showAwardsSection, setShowAwardsSection] = useState(false);
  const [awardsLocked, setAwardsLocked] = useState(false);
  const [awardsLoading, setAwardsLoading] = useState(true);
  const [awardsSaving, setAwardsSaving] = useState(false);
  const [predictedPOTT, setPredictedPOTT] = useState('');
  const [predictedGoldenBoot, setPredictedGoldenBoot] = useState('');
  const [predictedGoldenGlove, setPredictedGoldenGlove] = useState('');
  const [pottSearch, setPottSearch] = useState('');
  const [bootSearch, setBootSearch] = useState('');
  const [gloveSearch, setGloveSearch] = useState('');
  const [pottFocus, setPottFocus] = useState(false);
  const [bootFocus, setBootFocus] = useState(false);
  const [gloveFocus, setGloveFocus] = useState(false);

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

  // Flat list of all tournament players for dynamic awards suggestions
  const allGlobalPlayers = React.useMemo(() => {
    const list = [];
    Object.entries(squadData).forEach(([country, players]) => {
      players.forEach(p => {
        list.push({
          name: p.name,
          team: country,
          position: p.position || 'Player',
          number: p.number
        });
      });
    });
    return list;
  }, []);

  const pottSuggestions = React.useMemo(() => {
    if (!pottSearch || pottSearch.trim().length < 2) return [];
    if (predictedPOTT && pottSearch === predictedPOTT) return [];
    return allGlobalPlayers.filter(p => 
      p.name.toLowerCase().includes(pottSearch.toLowerCase()) || 
      p.team.toLowerCase().includes(pottSearch.toLowerCase())
    ).slice(0, 8);
  }, [pottSearch, allGlobalPlayers, predictedPOTT]);

  const bootSuggestions = React.useMemo(() => {
    if (!bootSearch || bootSearch.trim().length < 2) return [];
    if (predictedGoldenBoot && bootSearch === predictedGoldenBoot) return [];
    return allGlobalPlayers.filter(p => 
      p.name.toLowerCase().includes(bootSearch.toLowerCase()) || 
      p.team.toLowerCase().includes(bootSearch.toLowerCase())
    ).slice(0, 8);
  }, [bootSearch, allGlobalPlayers, predictedGoldenBoot]);

  const gloveSuggestions = React.useMemo(() => {
    if (!gloveSearch || gloveSearch.trim().length < 2) return [];
    if (predictedGoldenGlove && gloveSearch === predictedGoldenGlove) return [];
    return allGlobalPlayers.filter(p => 
      p.position === 'GK' && (
        p.name.toLowerCase().includes(gloveSearch.toLowerCase()) || 
        p.team.toLowerCase().includes(gloveSearch.toLowerCase())
      )
    ).slice(0, 8);
  }, [gloveSearch, allGlobalPlayers, predictedGoldenGlove]);

  // Format Date to IST
  const formatKickoffIST = (kickoffTime) => {
    const kickoff = kickoffTime?.toDate ? kickoffTime.toDate() : new Date(kickoffTime);
    return kickoff.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' IST';
  };

  // Sync SearchParam changes to state
  useEffect(() => {
    const paramId = searchParams.get('matchId');
    if (paramId) {
      setActiveMatchId(paramId);
    }
  }, [searchParams]);

  // Fetch match, prediction, squads, and awards prediction
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

        let currentMatchId = activeMatchId;

        // Auto-resolve featured match if no query parameter supplied
        if (!currentMatchId) {
          const matchesRef = collection(db, 'matches');
          const matchesSnap = await getDocs(matchesRef);
          const list = [];
          matchesSnap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });

          list.sort((a, b) => {
            const tA = a.kickoffTime?.toDate ? a.kickoffTime.toDate() : new Date(a.kickoffTime);
            const tB = b.kickoffTime?.toDate ? b.kickoffTime.toDate() : new Date(b.kickoffTime);
            return tA - tB;
          });

          const live = list.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'LIVE');
          const upcoming = list.filter(m => m.status === 'SCHEDULED');
          const finished = list.filter(m => m.status === 'FINISHED' || m.status === 'CONFIRMED' || m.confirmed);

          const featured = live[0] || upcoming[0] || finished[0] || null;
          if (featured) {
            currentMatchId = featured.id;
            setActiveMatchId(featured.id);
          } else {
            currentMatchId = 'wc2026_002'; // Fallback
            setActiveMatchId('wc2026_002');
          }
        }

        const matchRef = doc(db, 'matches', currentMatchId);
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
          const mockPredStr = localStorage.getItem(`mock_pred_${user.uid}_${currentMatchId}`);
          if (mockPredStr) {
            const predData = JSON.parse(mockPredStr);
            setHomeGoals(parseInt(predData.homeGoals) ?? 2);
            setAwayGoals(parseInt(predData.awayGoals) ?? 1);
            setManOfTheMatch(predData.manOfTheMatch || '');
            setPredictedPenaltyWinner(predData.predictedPenaltyWinner || '');
          }
        } else {
          const predId = `${user.uid}_${currentMatchId}`;
          const predRef = doc(db, 'predictions', predId);
          const predSnap = await getDoc(predRef);

          if (predSnap.exists()) {
            const predData = predSnap.data();
            setHomeGoals(parseInt(predData.homeGoals) ?? 2);
            setAwayGoals(parseInt(predData.awayGoals) ?? 1);
            setManOfTheMatch(predData.manOfTheMatch || '');
            setPredictedPenaltyWinner(predData.predictedPenaltyWinner || '');
          } else {
            // Reset to defaults if no prediction exists
            setHomeGoals(2);
            setAwayGoals(1);
            setManOfTheMatch('');
            setPredictedPenaltyWinner('');
          }
        }

        // --- Fetch & Check Knockout Awards predictions ---
        const matchesRef = collection(db, 'matches');
        const matchesSnap = await getDocs(matchesRef);
        const matchesList = [];
        matchesSnap.forEach(d => {
          matchesList.push(d.data());
        });

        const knockoutMatches = matchesList.filter(m => m.stage && m.stage !== 'GROUP_STAGE');
        const hasKnockouts = knockoutMatches.length > 0;
        setShowAwardsSection(hasKnockouts);

        if (hasKnockouts) {
          let earliestKnockTime = null;
          knockoutMatches.forEach(m => {
            if (m.kickoffTime) {
              const time = m.kickoffTime.toDate ? m.kickoffTime.toDate() : new Date(m.kickoffTime);
              if (!earliestKnockTime || time < earliestKnockTime) {
                earliestKnockTime = time;
              }
            }
          });

          if (earliestKnockTime && new Date() >= earliestKnockTime) {
            setAwardsLocked(true);
          }

          // Load User's Awards prediction
          if (user.isMock || !db) {
            const mockAwardsStr = localStorage.getItem(`mock_awards_${user.uid}`);
            if (mockAwardsStr) {
              const aData = JSON.parse(mockAwardsStr);
              setPredictedPOTT(aData.pott || '');
              setPredictedGoldenBoot(aData.goldenBoot || '');
              setPredictedGoldenGlove(aData.goldenGlove || '');
              setPottSearch(aData.pott || '');
              setBootSearch(aData.goldenBoot || '');
              setGloveSearch(aData.goldenGlove || '');
            }
          } else {
            const awardsRef = doc(db, 'awards_predictions', user.uid);
            const awardsSnap = await getDoc(awardsRef);
            if (awardsSnap.exists()) {
              const aData = awardsSnap.data();
              setPredictedPOTT(aData.pott || '');
              setPredictedGoldenBoot(aData.goldenBoot || '');
              setPredictedGoldenGlove(aData.goldenGlove || '');
              setPottSearch(aData.pott || '');
              setBootSearch(aData.goldenBoot || '');
              setGloveSearch(aData.goldenGlove || '');
            }
          }
        }

      } catch (err) {
        console.error("Error loading prediction data:", err);
        setError("Failed to load match configuration.");
      } finally {
        setLoading(false);
        setAwardsLoading(false);
      }
    }

    loadPredictData();
  }, [activeMatchId, user]);

  // Countdown timer & Auto-locking
  useEffect(() => {
    if (!match) return;
    const kickoff = match.kickoffTime?.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);

    const updateCountdown = async () => {
      const now = new Date();
      const diff = kickoff.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText('⏳ Submissions Open (Extended)');
        setIsLocked(false);
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
  }, [match, isLocked, user, activeMatchId]);

  const handleSelectPlayer = (player) => {
    setManOfTheMatch(player.name);
  };

  const handleSaveAwards = async (e) => {
    e.preventDefault();
    if (awardsLocked) {
      alert("⚠️ Awards predictions are locked!");
      return;
    }
    if (!predictedPOTT || !predictedGoldenBoot || !predictedGoldenGlove) {
      alert("⚠️ Please choose your predictions for all 3 awards before saving.");
      return;
    }

    setAwardsSaving(true);
    try {
      const payload = {
        userId: user.uid,
        userName: user.displayName || user.name || 'Anonymous',
        userEmail: user.email,
        pott: predictedPOTT,
        goldenBoot: predictedGoldenBoot,
        goldenGlove: predictedGoldenGlove,
        updatedAt: new Date().toISOString()
      };

      if (user.isMock || !db) {
        localStorage.setItem(`mock_awards_${user.uid}`, JSON.stringify(payload));
        alert("🎉 Tournament Awards predictions saved locally!");
      } else {
        const docRef = doc(db, 'awards_predictions', user.uid);
        await setDoc(docRef, payload);
        alert("🎉 Tournament Awards predictions saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert(`⚠️ Failed to save awards: ${err.message}`);
    } finally {
      setAwardsSaving(false);
    }
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

    const isKnockoutStage = match && [
      'Round of 32',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
      'Play-off for third place',
      'Final'
    ].includes(match.stage);

    const isDraw = isNaN(parseInt(homeGoals)) ? false : parseInt(homeGoals) === (isNaN(parseInt(awayGoals)) ? 0 : parseInt(awayGoals));

    if (isKnockoutStage && isDraw && !predictedPenaltyWinner) {
      setError("Please select who will win the penalty shootout.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const predId = `${user.uid}_${activeMatchId}`;
      
      const predictionDoc = {
        id: predId,
        userId: user.uid,
        matchId: activeMatchId,
        homeGoals: isNaN(parseInt(homeGoals)) ? 0 : parseInt(homeGoals),
        awayGoals: isNaN(parseInt(awayGoals)) ? 0 : parseInt(awayGoals),
        manOfTheMatch,
        motmPhotoUrl: '',
        predictedPenaltyWinner: (isKnockoutStage && isDraw) ? predictedPenaltyWinner : null,
        submittedAt: new Date().toISOString(),
        isLocked: false
      };

      if (user.isMock || !db) {
        localStorage.setItem(`mock_pred_${user.uid}_${activeMatchId}`, JSON.stringify(predictionDoc));
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

  const selectPOTT = (p) => {
    const val = `${p.name} (${p.team})`;
    setPredictedPOTT(val);
    setPottSearch(val);
  };
  
  const selectBoot = (p) => {
    const val = `${p.name} (${p.team})`;
    setPredictedGoldenBoot(val);
    setBootSearch(val);
  };

  const selectGlove = (p) => {
    const val = `${p.name} (${p.team})`;
    setPredictedGoldenGlove(val);
    setGloveSearch(val);
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

            {/* Penalty Shootout Winner Question */}
            {match && [
              'Round of 32',
              'Round of 16',
              'Quarter-finals',
              'Semi-finals',
              'Play-off for third place',
              'Final'
            ].includes(match.stage) && 
            homeGoals !== '' && 
            awayGoals !== '' && 
            parseInt(homeGoals) === parseInt(awayGoals) && (
              <div className="bg-[#F5C518]/5 border border-[#F5C518]/25 rounded-xl p-4 text-left space-y-3 animate-fadeIn mt-4 select-none">
                <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-wider block font-mono">
                  🎯 Knockout Draw: Predict Penalty Winner
                </span>
                <p className="text-[11px] text-gray-400">
                  Knockout matches cannot end in a draw. Who will win the penalty shootout?
                </p>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPredictedPenaltyWinner('home')}
                    disabled={isLocked || saving}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase border transition duration-200 cursor-pointer ${
                      predictedPenaltyWinner === 'home'
                        ? 'bg-[#F5C518] text-[#0A0E1A] border-[#F5C518] shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {match.homeTeam?.name || 'Home Team'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPredictedPenaltyWinner('away')}
                    disabled={isLocked || saving}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase border transition duration-200 cursor-pointer ${
                      predictedPenaltyWinner === 'away'
                        ? 'bg-[#F5C518] text-[#0A0E1A] border-[#F5C518] shadow-md'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {match.awayTeam?.name || 'Away Team'}
                  </button>
                </div>
              </div>
            )}

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
                    <span className="text-xs font-bold text-[#F5C518]">{manOfTheMatch.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
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

      {showAwardsSection && (
        <div className="max-w-4xl mx-auto mt-10 border border-white/10 bg-[#0F1520] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,24,0.05),transparent_70%)] pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/25 flex items-center justify-center text-[#F5C518]">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                🏆 Tournament Awards Predictions
              </h3>
              <p className="text-[10px] text-[#F5C518] font-bold uppercase tracking-wider mt-0.5">
                Earn +3 points for each correct pick!
              </p>
            </div>
          </div>

          {awardsLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="w-8 h-8 border-3 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSaveAwards} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Player of the Tournament */}
                <div className="relative text-left">
                  <label className="block text-[11px] font-extrabold text-[#F5C518] uppercase tracking-wider mb-1.5 font-mono">
                    Player of the Tournament
                  </label>
                  <p className="text-[9px] text-gray-500 mb-2 leading-tight">Predict the best overall player of the World Cup.</p>
                  <input
                    type="text"
                    value={pottSearch}
                    onChange={(e) => setPottSearch(e.target.value)}
                    onFocus={() => setPottFocus(true)}
                    onBlur={() => setTimeout(() => setPottFocus(false), 250)}
                    disabled={awardsLocked || awardsSaving}
                    placeholder="Search player..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F5C518] transition"
                  />
                  {pottFocus && pottSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#161D2B] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl">
                      {pottSuggestions.map((p, i) => (
                        <div
                          key={i}
                          onMouseDown={() => selectPOTT(p)}
                          className="p-2.5 text-xs text-white hover:bg-[#F5C518]/10 cursor-pointer border-b border-white/5 flex items-center justify-between"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">{p.team} • {p.position}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {predictedPOTT && (
                    <div className="mt-2 text-[10px] text-green-400 font-semibold flex items-center gap-1">
                      <span>✓ Selected:</span>
                      <span className="text-white">{predictedPOTT}</span>
                    </div>
                  )}
                </div>

                {/* 2. Golden Boot Winner */}
                <div className="relative text-left">
                  <label className="block text-[11px] font-extrabold text-[#F5C518] uppercase tracking-wider mb-1.5 font-mono">
                    Golden Boot Winner
                  </label>
                  <p className="text-[9px] text-gray-500 mb-2 leading-tight">Predict the top goalscorer of the tournament.</p>
                  <input
                    type="text"
                    value={bootSearch}
                    onChange={(e) => setBootSearch(e.target.value)}
                    onFocus={() => setBootFocus(true)}
                    onBlur={() => setTimeout(() => setBootFocus(false), 250)}
                    disabled={awardsLocked || awardsSaving}
                    placeholder="Search player..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F5C518] transition"
                  />
                  {bootFocus && bootSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#161D2B] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl">
                      {bootSuggestions.map((p, i) => (
                        <div
                          key={i}
                          onMouseDown={() => selectBoot(p)}
                          className="p-2.5 text-xs text-white hover:bg-[#F5C518]/10 cursor-pointer border-b border-white/5 flex items-center justify-between"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">{p.team} • {p.position}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {predictedGoldenBoot && (
                    <div className="mt-2 text-[10px] text-green-400 font-semibold flex items-center gap-1">
                      <span>✓ Selected:</span>
                      <span className="text-white">{predictedGoldenBoot}</span>
                    </div>
                  )}
                </div>

                {/* 3. Golden Glove Winner */}
                <div className="relative text-left">
                  <label className="block text-[11px] font-extrabold text-[#F5C518] uppercase tracking-wider mb-1.5 font-mono">
                    Golden Glove Winner
                  </label>
                  <p className="text-[9px] text-gray-500 mb-2 leading-tight">Predict the best goalkeeper of the tournament.</p>
                  <input
                    type="text"
                    value={gloveSearch}
                    onChange={(e) => setGloveSearch(e.target.value)}
                    onFocus={() => setGloveFocus(true)}
                    onBlur={() => setTimeout(() => setGloveFocus(false), 250)}
                    disabled={awardsLocked || awardsSaving}
                    placeholder="Search GK..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F5C518] transition"
                  />
                  {gloveFocus && gloveSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#161D2B] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl">
                      {gloveSuggestions.map((p, i) => (
                        <div
                          key={i}
                          onMouseDown={() => selectGlove(p)}
                          className="p-2.5 text-xs text-white hover:bg-[#F5C518]/10 cursor-pointer border-b border-white/5 flex items-center justify-between"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">{p.team} • GK</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {predictedGoldenGlove && (
                    <div className="mt-2 text-[10px] text-green-400 font-semibold flex items-center gap-1">
                      <span>✓ Selected:</span>
                      <span className="text-white">{predictedGoldenGlove}</span>
                    </div>
                  )}
                </div>

              </div>

              {awardsLocked ? (
                <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl text-red-400 text-xs text-center font-mono">
                  🔒 Predictions are locked because the first knockout match kickoff has passed.
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={awardsSaving}
                    className="bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition border-none shadow-[0_0_15px_rgba(245,197,24,0.15)] cursor-pointer"
                  >
                    {awardsSaving ? 'Saving...' : 'Save Awards Predictions'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
