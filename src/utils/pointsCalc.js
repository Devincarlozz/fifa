// src/utils/pointsCalc.js

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
    penalty: 0,
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

  // 3. Evaluate Penalty shootout winner
  const isKnockout = match.stage && [
    'Round of 32',
    'Round of 16',
    'Quarter-finals',
    'Semi-finals',
    'Play-off for third place',
    'Final'
  ].includes(match.stage);

  if (isKnockout && actualHome === actualAway && match.confirmedPenaltyScore) {
    const actualPenWinner = parseInt(match.confirmedPenaltyScore.home) > parseInt(match.confirmedPenaltyScore.away) ? 'home' : 'away';
    if (prediction.predictedPenaltyWinner && prediction.predictedPenaltyWinner === actualPenWinner) {
      result.penalty = 2;
    }
  }

  result.total = (result.exactScore || result.result) + result.motm + result.penalty;
  return result;
}

