// src/utils/pointsCalc.js
import { doc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Calculates prediction points based on actual match results.
 * 
 * Points System:
 * - Correct Result (Win/Draw/Loss outcome is right): 2 pts
 * - Exact Score (Both teams' goals exactly right): 5 pts (replaces the 2 pts for result)
 * - Man of the Match (MOTM player is right): 3 pts
 * - Maximum per match: 5 (exact score) + 3 (motm) = 8 pts
 */
export function calculatePredictionPoints(prediction, match) {
  const result = {
    result: 0,
    exactScore: 0,
    motm: 0,
    total: 0
  };

  if (!prediction || !match || !match.confirmed) {
    return result;
  }

  const predHome = parseInt(prediction.homeGoals);
  const predAway = parseInt(prediction.awayGoals);
  
  const actualHome = parseInt(match.confirmedResult?.homeGoals);
  const actualAway = parseInt(match.confirmedResult?.awayGoals);

  if (isNaN(predHome) || isNaN(predAway) || isNaN(actualHome) || isNaN(actualAway)) {
    return result;
  }

  // 1. Evaluate Result & Exact Score
  const predOutcome = predHome > predAway ? 'HOME_WIN' : predHome < predAway ? 'AWAY_WIN' : 'DRAW';
  const actualOutcome = actualHome > actualAway ? 'HOME_WIN' : actualHome < actualAway ? 'AWAY_WIN' : 'DRAW';

  if (predHome === actualHome && predAway === actualAway) {
    result.exactScore = 5;
    result.result = 0;
  } else if (predOutcome === actualOutcome) {
    result.result = 2;
    result.exactScore = 0;
  }

  // 2. Evaluate Man of the Match
  if (
    prediction.manOfTheMatch && 
    match.confirmedMOTM && 
    prediction.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()
  ) {
    result.motm = 3;
  }

  result.total = (result.exactScore || result.result) + result.motm;
  return result;
}

/**
 * Runs the result validation algorithm.
 * Called when an admin confirms the final score and MOTM outcome.
 */
export async function processMatchResults(matchId, adminResult) {
  if (!db) {
    throw new Error("Database is not connected.");
  }

  const homeActual = parseInt(adminResult.finalScore.home);
  const awayActual = parseInt(adminResult.finalScore.away);
  const actualOutcome = homeActual > awayActual ? 'HOME_WIN' : homeActual < awayActual ? 'AWAY_WIN' : 'DRAW';

  // 1. Fetch all predictions for the match
  const predsQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  const predsSnapshot = await getDocs(predsQuery);
  const preds = [];
  predsSnapshot.forEach((doc) => {
    preds.push({
      id: doc.id,
      ...doc.data()
    });
  });

  for (const pred of preds) {
    const userId = pred.userId;
    if (!userId) continue;

    const predHome = parseInt(pred.homeGoals);
    const predAway = parseInt(pred.awayGoals);
    const predOutcome = predHome > predAway ? 'HOME_WIN' : predHome < predAway ? 'AWAY_WIN' : 'DRAW';

    let exactScorePoints = 0;
    let resultPoints = 0;
    let motmPoints = 0;

    // Evaluate scores
    if (predHome === homeActual && predAway === awayActual) {
      exactScorePoints = 5;
    } else if (predOutcome === actualOutcome) {
      resultPoints = 2;
    }

    // Evaluate MOTM (case insensitive trim comparison)
    if (
      pred.manOfTheMatch &&
      adminResult.manOfTheMatch &&
      pred.manOfTheMatch.trim().toLowerCase() === adminResult.manOfTheMatch.trim().toLowerCase()
    ) {
      motmPoints = 3;
    }

    const total = exactScorePoints + resultPoints + motmPoints;
    const pointsBreakdown = {
      result: resultPoints,
      exactScore: exactScorePoints,
      motm: motmPoints
    };

    // Update the prediction document in predictions collection
    const predRef = doc(db, 'predictions', pred.id);
    await updateDoc(predRef, {
      pointsEarned: total,
      pointsBreakdown: pointsBreakdown
    });

    // Update user total points and prediction count in users collection
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalPoints: increment(total),
        predictionsCount: increment(1)
      });
    } catch (userErr) {
      console.error(`Failed to update points for user ${userId}:`, userErr);
    }
  }

  // 2. Update match document status to 'CONFIRMED'
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, {
    status: 'CONFIRMED',
    confirmed: true,
    confirmedResult: { homeGoals: homeActual, awayGoals: awayActual },
    confirmedMOTM: adminResult.manOfTheMatch,
    confirmedAt: new Date().toISOString()
  });
}
