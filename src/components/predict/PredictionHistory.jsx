import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatMatchTime } from '../../utils/dateUtils';
import { History, AlertCircle } from 'lucide-react';

export default function PredictionHistory() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch matches once on mount
  useEffect(() => {
    if (!db) {
      const matchesMap = {};
      const mockMatchesList = [
        {
          id: "mock_match_001",
          matchId: "mock_match_001",
          homeTeam: { name: "Brazil", flag: "🇧🇷", code: "BRA" },
          awayTeam: { name: "Argentina", flag: "🇦🇷", code: "ARG" },
          kickoffTime: new Date(Date.now() - 1000 * 60 * 80),
          stage: "GROUP STAGE",
          venue: "Maracanã Stadium",
          status: "LIVE",
          liveScore: { home: 2, away: 1 },
          minute: "78",
          goalscorers: [],
          cards: [],
          confirmed: true
        }
      ];
      mockMatchesList.forEach(m => {
        matchesMap[m.id] = m;
      });
      setMatches(matchesMap);
      return;
    }

    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'matches'));
        const querySnapshot = await getDocs(q);
        const matchesMap = {};
        querySnapshot.forEach((doc) => {
          matchesMap[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });
        setMatches(matchesMap);
      } catch (err) {
        console.error("Error loading matches:", err);
      }
    };

    fetchMatches();
  }, []);

  // 2. Fetch user predictions
  useEffect(() => {
    if (!user) return;
    if (!db) {
      const mockPredsList = [
        {
          id: "pred_001",
          matchId: "mock_match_001",
          homeGoals: 2,
          awayGoals: 1,
          pointsEarned: 120,
          manOfTheMatch: "Vinícius Júnior",
          pointsBreakdown: { exactScore: 5, result: 2, motm: 3 }
        }
      ];
      setPredictions(mockPredsList);
      setLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const preds = [];
        querySnapshot.forEach((doc) => {
          preds.push({
            id: doc.id,
            ...doc.data()
          });
        });
        // Sort predictions by match kickoff time (look it up from matches map)
        preds.sort((a, b) => {
          const timeA = matches[a.matchId]?.kickoffTime?.toDate 
            ? matches[a.matchId].kickoffTime.toDate().getTime() 
            : (matches[a.matchId]?.kickoffTime ? new Date(matches[a.matchId].kickoffTime).getTime() : 0);
          const timeB = matches[b.matchId]?.kickoffTime?.toDate 
            ? matches[b.matchId].kickoffTime.toDate().getTime() 
            : (matches[b.matchId]?.kickoffTime ? new Date(matches[b.matchId].kickoffTime).getTime() : 0);
          return timeB - timeA; // newest matches first
        });
        setPredictions(preds);
      } catch (error) {
        console.error("Error loading predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [user, matches]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-semibold tracking-wide">Loading prediction logs...</p>
      </div>
    );
  }

  // Calculate quick stats
  const totalPreds = predictions.length;
  const totalPoints = predictions.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  const exactScores = predictions.filter(p => p.pointsBreakdown?.exactScore > 0).length;
  const correctResults = predictions.filter(p => p.pointsBreakdown?.result > 0).length;

  const renderFlag = (team) => {
    const isImagePath = team.flag && (team.flag.startsWith('/') || team.flag.startsWith('http'));
    if (isImagePath) {
      return <img src={team.flag} alt={team.name} className="w-full h-full object-cover" />;
    }
    return (
      <div className="w-full h-full flex items-center justify-center text-xs">
        {team.flag || '⚽'}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* Stats Summary Row using Design system cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 p-5 text-center flex flex-col justify-center items-center h-28">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10" />
          <span className="block text-3xl font-display font-black text-white">{totalPreds}</span>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Predictions Made</span>
        </div>
        <div className="card relative overflow-hidden bg-gradient-to-b from-[#F5C518]/10 to-[#F5C518]/0 border border-[#F5C518]/15 p-5 text-center flex flex-col justify-center items-center h-28 shadow-[0_4px_20px_rgba(245,197,24,0.05)]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F5C518]/30" />
          <span className="block text-3xl font-display font-black text-[#F5C518]">{totalPoints}</span>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Points Earned</span>
        </div>
        <div className="card relative overflow-hidden bg-gradient-to-b from-green-500/10 to-green-500/0 border border-green-500/15 p-5 text-center flex flex-col justify-center items-center h-28 shadow-[0_4px_20px_rgba(34,197,94,0.05)]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500/30" />
          <span className="block text-3xl font-display font-black text-green-500">{exactScores}</span>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Exact Scores</span>
        </div>
        <div className="card relative overflow-hidden bg-gradient-to-b from-blue-500/10 to-blue-500/0 border border-blue-500/15 p-5 text-center flex flex-col justify-center items-center h-28 shadow-[0_4px_20px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500/30" />
          <span className="block text-3xl font-display font-black text-blue-500">{correctResults}</span>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Outcomes Guessed</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
        <History className="w-5 h-5 text-[#F5C518]" />
        <h2 className="text-xl font-bold uppercase tracking-wider">My Prediction History</h2>
      </div>

      {/* Predictions List Container */}
      {predictions.length > 0 ? (
        <div className="space-y-4">
          {predictions.map((pred) => {
            const match = matches[pred.matchId];
            if (!match) return null;
            
            // Format time
            const formattedTime = formatMatchTime(match.kickoffTime);
            
            // Result logic
            const isConfirmed = match.confirmed;
            const isFinished = match.status === 'FINISHED';
            const isLive = match.status === 'LIVE';

            // Points breakdown helpers
            const hasExact = pred.pointsBreakdown?.exactScore > 0;
            const hasResult = pred.pointsBreakdown?.result > 0;
            const hasMotm = pred.pointsBreakdown?.motm > 0;
            
            return (
              <div 
                key={pred.id} 
                className="card bg-gradient-to-r from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] hover:to-white/[0.02] border border-white/5 hover:border-[#F5C518]/25 p-5 transition-all duration-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
              >
                {/* Horizontal status accent bar on the left */}
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${
                  isConfirmed ? 'bg-green-500' : isFinished ? 'bg-amber-500' : isLive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                }`} />

                {/* Left section: Match Info & Teams */}
                <div className="flex-1 space-y-3 pl-2">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>⏰ {formattedTime}</span>
                    <span>•</span>
                    <span>{match.stage?.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Home team */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {renderFlag(match.homeTeam)}
                      </div>
                      <span className="font-display text-sm font-black text-white uppercase tracking-wider">{match.homeTeam.code}</span>
                      <span className="hidden sm:inline text-xs text-gray-400 font-semibold">{match.homeTeam.name}</span>
                    </div>

                    <span className="text-[10px] text-gray-600 font-extrabold uppercase tracking-widest">VS</span>

                    {/* Away team */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {renderFlag(match.awayTeam)}
                      </div>
                      <span className="font-display text-sm font-black text-white uppercase tracking-wider">{match.awayTeam.code}</span>
                      <span className="hidden sm:inline text-xs text-gray-400 font-semibold">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Predicted MOTM */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">MOTM Pick:</span>
                    <span className="text-white font-bold">{pred.manOfTheMatch || 'None'}</span>
                  </div>
                </div>

                {/* Middle section: Scores and Predictions */}
                <div className="flex items-center gap-8 border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
                  
                  {/* Prediction Score Card */}
                  <div className="text-center">
                    <span className="block text-[9px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Your Pick</span>
                    <div className="bg-[#F5C518]/5 border border-[#F5C518]/20 px-3 py-1.5 rounded-xl text-center shadow-[0_0_10px_rgba(245,197,24,0.05)]">
                      <span className="text-base font-display font-black text-[#F5C518]">{pred.homeGoals} — {pred.awayGoals}</span>
                      {pred.predictedPenaltyWinner && (
                        <span className="block text-[8px] text-[#F5C518] uppercase tracking-wider font-extrabold mt-0.5">
                          Pens: {pred.predictedPenaltyWinner === 'home' ? match.homeTeam.code : match.awayTeam.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actual Score Card */}
                  <div className="text-center">
                    <span className="block text-[9px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Actual Result</span>
                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                      {isLive || isFinished || isConfirmed ? (
                        <>
                          <span className="text-base font-display font-black text-white">
                            {match.confirmedResult?.homeGoals ?? match.liveScore?.home} — {match.confirmedResult?.awayGoals ?? match.liveScore?.away}
                          </span>
                          {match.confirmedPenaltyScore && (
                            <span className="block text-[8px] text-gray-400 uppercase tracking-wider font-extrabold mt-0.5">
                              Pens: {match.confirmedPenaltyScore.home} - {match.confirmedPenaltyScore.away}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block py-0.5">Scheduled</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right section: Points earned & Status pill */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t border-white/5 pt-4 md:border-t-0 md:pt-0 min-w-[120px]">
                  
                  {/* Status badge */}
                  <div>
                    {isConfirmed ? (
                      <span className="bg-green-500/10 text-green-500 border border-green-500/25 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Confirmed
                      </span>
                    ) : isFinished ? (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Pending Admin
                      </span>
                    ) : isLive ? (
                      <span className="bg-red-500/10 text-red-500 border border-red-500/25 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Live
                      </span>
                    ) : (
                      <span className="bg-blue-500/10 text-blue-500 border border-blue-500/25 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Points display */}
                  {isConfirmed ? (
                    <div className="text-right flex flex-col items-end">
                      <span className="text-lg font-display font-black text-green-500 font-mono">+{pred.pointsEarned ?? 0} PTS</span>
                      <div className="flex flex-wrap gap-1 mt-1 justify-end max-w-[150px]">
                        {hasExact && <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1 py-0.2 rounded uppercase font-bold">Exact</span>}
                        {hasResult && <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded uppercase font-bold">Outcome</span>}
                        {hasMotm && <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.2 rounded uppercase font-bold">MOTM</span>}
                        {pred.pointsBreakdown?.penalty > 0 && <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded uppercase font-bold">Pens</span>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No points yet</span>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500 max-w-lg mx-auto bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No predictions logged</h3>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">You haven't predicted any matches yet. Go to the dashboard to place your first prediction!</p>
          <Link to="/" className="inline-block bg-gradient-to-r from-[#F5C518] to-[#E5A800] text-black font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_20px_rgba(245,197,24,0.3)]">
            Start Predicting
          </Link>
        </div>
      )}
    </div>
  );
}
