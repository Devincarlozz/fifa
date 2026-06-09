// src/utils/dreamTeamCalc.js
import { doc, updateDoc, collection, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
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
    if (isStarting) {
      earnedPts = isCaptain ? basePts * 2 : basePts;
      total += earnedPts;
      if (breakdown[pos] !== undefined) {
        breakdown[pos] += earnedPts;
      }
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

/**
 * Process rankings submitted by Admin.
 * Saves rankings and updates points for all users.
 */
export async function processDreamTeamRankings(rankings, adminEmail) {
  if (!db) {
    throw new Error("Database is not connected.");
  }

  // 1. Save rankings to system settings doc
  const systemRef = doc(db, 'system', 'dream_team_rankings');
  try {
    await setDoc(systemRef, {
      rankings,
      publishedAt: new Date().toISOString(),
      publishedBy: adminEmail
    }, { merge: true });
  } catch (err) {
    console.error("Failed to write dream_team_rankings system doc:", err);
    throw err;
  }

  // 2. Fetch all user dream teams
  const dtSnapshot = await getDocs(collection(db, 'dream_teams'));
  const dreamTeams = [];
  dtSnapshot.forEach((doc) => {
    dreamTeams.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // 3. For each user dream team, calculate and award points
  for (const dt of dreamTeams) {
    const userId = dt.id || dt.userId;
    if (!userId) continue;

    const { total, breakdown, playerPoints } = calculateDreamTeamPoints(dt.players, rankings);

    // Update the dream team document
    const dtRef = doc(db, 'dream_teams', userId);
    await updateDoc(dtRef, {
      pointsEarned: total,
      pointsBreakdown: breakdown,
      playerPointsBreakdown: playerPoints,
      pointsAwardedAt: new Date().toISOString()
    });

    // Update the user's document
    try {
      const userRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const oldDtPoints = userData.dreamTeamPoints || 0;
        const currentTotal = userData.totalPoints || 0;
        
        // Calculate new total points (avoids double counting if re-published)
        const newTotal = currentTotal - oldDtPoints + total;

        await updateDoc(userRef, {
          dreamTeamPoints: total,
          totalPoints: newTotal
        });
      }
    } catch (userErr) {
      console.error(`Failed to update points for user ${userId}:`, userErr);
    }
  }
}
