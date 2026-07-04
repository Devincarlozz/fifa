import React from 'react';
import { Link } from 'react-router-dom';
import { formatMatchTime, isKickoffPassed } from '../../utils/dateUtils';

export default function MatchCard({ match, prediction }) {
  if (!match) return null;

  const { id, matchId, homeTeam, awayTeam, kickoffTime, stage, venue, status, liveScore, confirmed, confirmedResult } = match;
  const actualMatchId = id || matchId;
  const locked = isKickoffPassed(kickoffTime);
  const isLive = status === 'IN_PLAY' || status === 'PAUSED' || status === 'LIVE';
  const isDone = confirmed || status === 'FINISHED' || status === 'CONFIRMED';

  const renderFlag = (team) => {
    const flagSrc = team?.crest || team?.flag;
    const isImagePath = flagSrc && (flagSrc.startsWith('/') || flagSrc.startsWith('http'));
    if (isImagePath) {
      return (
        <img
          src={flagSrc}
          alt={team?.name}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 2 }}
        />
      );
    }
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, background: 'rgba(255,255,255,0.04)'
      }}>
        {flagSrc || '⚽'}
      </div>
    );
  };

  // Status badge
  const StatusBadge = () => {
    if (isLive) return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#F87171', borderRadius: 999, padding: '2px 10px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif'
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', animation: 'blink 1.2s ease-in-out infinite', display: 'inline-block' }} />
        LIVE
      </span>
    );
    if (isDone) return (
      <span style={{
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
        color: '#4ADE80', borderRadius: 999, padding: '2px 10px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif'
      }}>
        FT
      </span>
    );
    if (locked) return (
      <span style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#475569', borderRadius: 999, padding: '2px 10px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif'
      }}>
        🔒 LOCKED
      </span>
    );
    return (
      <span style={{
        background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)',
        color: '#F5C518', borderRadius: 999, padding: '2px 10px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif'
      }}>
        UPCOMING
      </span>
    );
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${isLive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 16,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isLive ? '0 0 0 1px rgba(239,68,68,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,0.5)' : 'rgba(245,197,24,0.25)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = isLive ? '0 0 0 1px rgba(239,68,68,0.1)' : '0 4px 20px rgba(0,0,0,0.3)'; }}
    >
      {/* Stage + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          {(stage || 'GROUP STAGE').replace(/_/g, ' ')}
        </span>
        <StatusBadge />
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {renderFlag(homeTeam)}
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {homeTeam?.code || homeTeam?.name?.substring(0, 3)}
          </span>
        </div>

        {/* Score / VS */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {(isLive || isDone) ? (
            <div style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800,
              color: '#F5C518', background: 'rgba(245,197,24,0.08)',
              border: '1px solid rgba(245,197,24,0.18)',
              borderRadius: 8, padding: '4px 12px',
              letterSpacing: '0.04em'
            }}>
              {confirmedResult?.homeGoals ?? liveScore?.home ?? 0}–{confirmedResult?.awayGoals ?? liveScore?.away ?? 0}
            </div>
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VS</span>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
          {renderFlag(awayTeam)}
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {awayTeam?.code || awayTeam?.name?.substring(0, 3)}
          </span>
        </div>
      </div>

      {/* Time / Venue */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
        {status === 'SCHEDULED' ? `⏰ ${formatMatchTime(kickoffTime)}` : `🏟 ${venue || 'World Cup Arena'}`}
      </div>

      {/* Prediction & CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        
        {prediction && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.12)',
            borderRadius: 10, padding: '8px 12px'
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.14em' }}>YOUR PICK</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 700, color: '#F5C518' }}>
              {homeTeam?.code} {prediction.homeGoals}–{prediction.awayGoals} {awayTeam?.code}
            </span>
          </div>
        )}

        {!prediction && locked && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '8px', textAlign: 'center',
            fontSize: 10, color: '#334155', fontFamily: 'Inter, sans-serif', fontWeight: 600
          }}>
            No prediction submitted
          </div>
        )}

        {status === 'SCHEDULED' && !locked && (
          <Link
            to={`/predict?matchId=${actualMatchId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: prediction
                ? 'rgba(255, 255, 255, 0.03)'
                : 'linear-gradient(135deg, #F5C518 0%, #FFD700 50%, #E5A800 100%)',
              border: prediction
                ? '1px solid rgba(245, 197, 24, 0.3)'
                : '1px solid #F5C518',
              borderRadius: 12,
              padding: '11px 18px',
              color: prediction ? '#CBD5E1' : '#05091A',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: prediction
                ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 4px 18px rgba(245, 197, 24, 0.35)',
              width: '100%',
              transform: 'scale(1)'
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
            <span>{prediction ? 'Edit Prediction' : 'Predict Now'}</span>
            <span style={{ fontSize: 13 }}>{prediction ? '✏️' : '→'}</span>
          </Link>
        )}


        {isDone && prediction && (
          <div style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10, padding: '8px', textAlign: 'center',
            fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, color: '#4ADE80'
          }}>
            +{prediction.pointsEarned ?? 0} PTS
          </div>
        )}
      </div>
    </div>
  );
}
