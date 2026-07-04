import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LiveMatchBanner({ match, prediction }) {
  if (!match) return null;

  const { homeTeam, awayTeam, status, kickoffTime, stage, venue } = match;
  const [countdownText, setCountdownText] = useState('');

  // Countdown timer for scheduled matches
  useEffect(() => {
    if (!match || status !== 'SCHEDULED') return;
    const kickoff = kickoffTime?.toDate ? kickoffTime.toDate() : new Date(kickoffTime);

    const updateCountdown = () => {
      const now = new Date();
      const diff = kickoff.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText('🔒 Predictions Locked');
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
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [match, status, kickoffTime]);

  const isScheduled = status === 'SCHEDULED';
  const isFinished = status === 'FINISHED' || status === 'CONFIRMED' || match.confirmed;
  
  // Resolve scores to display
  const displayHomeScore = match.confirmedResult?.homeGoals ?? match.liveScore?.home ?? 0;
  const displayAwayScore = match.confirmedResult?.awayGoals ?? match.liveScore?.away ?? 0;

  return (
    <div className="space-y-6 select-none">
      {/* Main Banner Card */}
      <div className="card live-match-card relative overflow-hidden">
        {/* Header row: Status + stage */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {isFinished ? (
              <span className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                FINAL RESULT
              </span>
            ) : status === 'IN_PLAY' ? (
              <span className="live-badge bg-red-600/10 border border-red-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-red-400 tracking-wider">
                IN PROGRESS
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#F5C518] bg-[#F5C518]/10 border border-[#F5C518]/25 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                FEATURED MATCH
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-right">
            {isScheduled ? (
              <span className="text-[#F5C518] font-bold text-xs uppercase tracking-wide font-mono">{countdownText}</span>
            ) : (
              <span className="text-gray-400 font-bold text-xs uppercase tracking-wide font-mono">Locked</span>
            )}
            <span className="match-stage-label !m-0 uppercase tracking-widest text-[9px] text-gray-500 font-bold">
              FIFA WORLD CUP 2026™ — {stage?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Scoreboard: Flag CODE [score/VS] CODE Flag */}
        <div className="flex items-center justify-between gap-1 sm:gap-4 py-4 w-full">
          {/* Home Team */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-3 justify-end min-w-0">
            {homeTeam?.crest ? (
              <img 
                src={homeTeam.crest} 
                alt={homeTeam.name} 
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-white/10 object-contain bg-[#1C2333] p-1 flex-shrink-0" 
              />
            ) : (
              <span className="text-2.5xl sm:text-5xl flex-shrink-0">{homeTeam?.flag || '⚽'}</span>
            )}
            <span className="team-code font-display text-base sm:text-xl font-extrabold truncate">{homeTeam?.code}</span>
          </div>

          {/* Score / VS */}
          <div className="flex-none score-row flex items-center justify-center gap-1.5 sm:gap-4 px-1.5 sm:px-4">
            {isScheduled ? (
              <span className="text-gray-650 font-display text-2xl sm:text-3xl font-extrabold tracking-widest">VS</span>
            ) : (
              <>
                <span className="score-number font-display text-4xl sm:text-[72px] font-black text-[#F5C518] font-mono leading-none">
                  {displayHomeScore}
                </span>
                <span className="score-separator text-2xl sm:text-4xl text-gray-650 font-extrabold">-</span>
                <span className="score-number font-display text-4xl sm:text-[72px] font-black text-[#F5C518] font-mono leading-none">
                  {displayAwayScore}
                </span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-3 justify-start min-w-0">
            <span className="team-code font-display text-base sm:text-xl font-extrabold truncate">{awayTeam?.code}</span>
            {awayTeam?.crest ? (
              <img 
                src={awayTeam.crest} 
                alt={awayTeam.name} 
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-white/10 object-contain bg-[#1C2333] p-1 flex-shrink-0" 
              />
            ) : (
              <span className="text-2.5xl sm:text-5xl flex-shrink-0">{awayTeam?.flag || '⚽'}</span>
            )}
          </div>
        </div>

        {/* Venue Information */}
        <div className="text-center text-[10px] text-gray-500 font-mono mt-2 uppercase tracking-wider">
          VENUE: {venue || 'TOURNAMENT STADIUM'}
        </div>
      </div>

      {/* YOUR PREDICTION Card */}
      <div className="card relative overflow-hidden p-5 flex flex-col justify-between">
        <div className="text-left mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#F5C518] uppercase tracking-widest">
            YOUR PREDICTION
          </span>
          {prediction?.pointsEarned !== undefined && (
            <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">
              +{prediction.pointsEarned} PTS EARNED
            </span>
          )}
        </div>

        {/* Prediction Scoreboard */}
        <div className="flex items-center justify-between gap-1 sm:gap-4 py-2 border-b border-white/5 pb-4 w-full">
          {/* Home team prediction */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-3 justify-end min-w-0">
            {homeTeam?.crest ? (
              <img 
                src={homeTeam.crest} 
                alt={homeTeam.name} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 object-contain bg-[#1C2333] p-1 flex-shrink-0" 
              />
            ) : (
              <span className="text-xl sm:text-4xl flex-shrink-0">{homeTeam?.flag || '⚽'}</span>
            )}
            <span className="font-display text-sm sm:text-lg font-bold text-white uppercase tracking-wider truncate">{homeTeam?.code}</span>
          </div>

          {/* Predicted score */}
          <div className="flex-none flex items-center justify-center gap-1.5 sm:gap-4 px-1.5 sm:px-4">
            <span className="font-display text-xl sm:text-3xl font-black text-[#F5C518] tracking-widest font-mono">
              {prediction ? `${prediction.homeGoals} - ${prediction.awayGoals}` : '— - —'}
            </span>
          </div>

          {/* Away team prediction */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-3 justify-start min-w-0">
            <span className="font-display text-sm sm:text-lg font-bold text-white uppercase tracking-wider truncate">{awayTeam?.code}</span>
            {awayTeam?.crest ? (
              <img 
                src={awayTeam.crest} 
                alt={awayTeam.name} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 object-contain bg-[#1C2333] p-1 flex-shrink-0" 
              />
            ) : (
              <span className="text-xl sm:text-4xl flex-shrink-0">{awayTeam?.flag || '⚽'}</span>
            )}
          </div>
        </div>

        {/* Prediction Status Details (Bottom Row) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-gray-400">
            {prediction ? (
              <>
                <span className="text-green-500">✓ Outcome Submitted</span>
                {prediction.manOfTheMatch && (
                  <span>• MOTM Pick: <strong className="text-white font-sans">{prediction.manOfTheMatch}</strong></span>
                )}
              </>
            ) : (
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono">
                No prediction submitted yet
              </span>
            )}
          </div>

          {isScheduled && (
            <Link
              to={`/predict?matchId=${match.id}`}
              style={{
                background: prediction
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'linear-gradient(135deg, #F5C518 0%, #FFD700 50%, #E5A800 100%)',
                border: prediction
                  ? '1px solid rgba(245, 197, 24, 0.3)'
                  : '1px solid #F5C518',
                borderRadius: 12,
                padding: '9px 22px',
                color: prediction ? '#CBD5E1' : '#05091A',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.12em',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: prediction
                  ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                  : '0 4px 18px rgba(245, 197, 24, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transform: 'scale(1)',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.background = prediction
                  ? 'rgba(245, 197, 24, 0.1)'
                  : 'linear-gradient(135deg, #FFD700 0%, #F5C518 100%)';
                e.currentTarget.style.color = prediction ? '#F5C518' : '#05091A';
                e.currentTarget.style.boxShadow = prediction
                  ? '0 4px 16px rgba(245, 197, 24, 0.25)'
                  : '0 6px 24px rgba(245, 197, 24, 0.55)';
                e.currentTarget.style.borderColor = '#F5C518';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = prediction
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'linear-gradient(135deg, #F5C518 0%, #FFD700 50%, #E5A800 100%)';
                e.currentTarget.style.color = prediction ? '#CBD5E1' : '#05091A';
                e.currentTarget.style.boxShadow = prediction
                  ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                  : '0 4px 18px rgba(245, 197, 24, 0.35)';
                e.currentTarget.style.borderColor = prediction
                  ? 'rgba(245, 197, 24, 0.3)'
                  : '#F5C518';
              }}
            >
              <span>{prediction ? 'Edit Pick' : 'Predict Now'}</span>
              <span>{prediction ? '✏️' : '→'}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
