// src/utils/dreamTeamCalc.js
import { squadData } from './tournamentData';

/**
 * Calculates dream team points based on official top 10 player rankings.
 * rankings: {
 *   GK: ["Name 1", "Name 2", ...], // index 0 is rank 1 (10 pts), index 9 is rank 10 (1 pt)
 *   DF: [...],
 *   MF: [...],
 *   FW: [...]
 * }
 */
export function calculateDreamTeamPoints(dreamTeamPlayers, rankings) {
  let total = 0;
  const breakdown = { GK: 0, DF: 0, MF: 0, FW: 0 };
  const playerPoints = [];

  if (!dreamTeamPlayers || !rankings) {
    return { total, breakdown, playerPoints };
  }

  dreamTeamPlayers.forEach(player => {
    // Resolve details dynamically from the centralized squadData system!
    const countryPlayers = squadData[player.team] || [];
    const found = countryPlayers.find(cp => cp.name.toLowerCase() === player.name.toLowerCase());
    
    const pos = found ? found.position : player.position; // GK, DF, MF, FW
    const price = found ? found.price : (player.price || 5.0);
    const name = found ? found.name : player.name;
    
    const list = rankings[pos] || [];
    
    // Find index of player in the top 10 list (case-insensitive trim comparison)
    const rankIndex = list.findIndex(
      rankedName => rankedName && rankedName.trim().toLowerCase() === name.trim().toLowerCase()
    );

    let basePts = 0;
    if (rankIndex !== -1) {
      basePts = 10 - rankIndex; // Rank 1 (index 0) gets 10 pts, Rank 10 (index 9) gets 1 pt
    }

    const isStarting = player.isStarting !== false; // default to true
    const isCaptain = player.isCaptain === true;    // default to false
    
    let earnedPts = 0;
    earnedPts = isCaptain ? basePts * 2 : basePts;
    total += earnedPts;
    if (breakdown[pos] !== undefined) {
      breakdown[pos] += earnedPts;
    }

    playerPoints.push({
      name: name,
      position: pos,
      team: player.team,
      price: price,
      isStarting,
      isCaptain,
      points: earnedPts,
      basePoints: basePts,
      rank: rankIndex !== -1 ? rankIndex + 1 : null
    });
  });

  return { total, breakdown, playerPoints };
}
