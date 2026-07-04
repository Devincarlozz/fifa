/**
 * functions/src/matches/recalculateAllPoints.ts
 *
 * Callable Cloud Function to recalculate all user points from scratch.
 * Migrated from client-side recalculateAllUserPoints() in pointsCalc.js.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const KNOCKOUT_STAGES = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Play-off for third place",
  "Final",
];

export const recalculateAllPoints = onCall(
  { timeoutSeconds: 300 }, // Allow up to 5 minutes for large datasets
  async (request) => {
    // Authorization: admin only
    if (!request.auth?.token?.admin) {
      throw new HttpsError("permission-denied", "Only administrators can recalculate points.");
    }

    const db = admin.firestore();

    // 1. Fetch all matches
    const matchesSnap = await db.collection("matches").get();
    const matches: Record<string, any> = {};
    matchesSnap.forEach((docSnap) => {
      matches[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });

    // 2. Fetch all predictions
    const predsSnap = await db.collection("predictions").get();
    const predictions: Array<{ id: string; [key: string]: any }> = [];
    predsSnap.forEach((docSnap) => {
      predictions.push({ id: docSnap.id, ...docSnap.data() });
    });

    // 3. Fetch all users
    const usersSnap = await db.collection("users").get();
    const users: Record<string, any> = {};
    usersSnap.forEach((docSnap) => {
      users[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });

    // 4. Initialize counters
    const userStats: Record<string, { predictionsPoints: number; predictionsCount: number }> = {};
    Object.keys(users).forEach((uid) => {
      userStats[uid] = { predictionsPoints: 0, predictionsCount: 0 };
    });

    // 5. Process predictions in batches
    const BATCH_SIZE = 450; // Firestore batch limit is 500
    let batchOps: Array<{ ref: FirebaseFirestore.DocumentReference; data: any }> = [];

    for (const pred of predictions) {
      const userId = pred.userId;
      const matchId = pred.matchId;
      if (!userId || !matchId) continue;

      if (!userStats[userId]) {
        userStats[userId] = { predictionsPoints: 0, predictionsCount: 0 };
      }

      const match = matches[matchId];
      if (!match || !match.confirmed) {
        batchOps.push({
          ref: db.collection("predictions").doc(pred.id),
          data: { pointsEarned: 0, pointsBreakdown: { result: 0, exactScore: 0, motm: 0, penalty: 0 } },
        });
        continue;
      }

      const homeActual = parseInt(match.confirmedResult?.homeGoals);
      const awayActual = parseInt(match.confirmedResult?.awayGoals);
      const actualOutcome = homeActual > awayActual ? "HOME_WIN" : homeActual < awayActual ? "AWAY_WIN" : "DRAW";

      const predHome = parseInt(pred.homeGoals);
      const predAway = parseInt(pred.awayGoals);
      const hasPrediction = !isNaN(predHome) && !isNaN(predAway);

      let exactScorePoints = 0;
      let resultPoints = 0;
      let motmPoints = 0;
      let penaltyPoints = 0;

      if (hasPrediction) {
        const predOutcome = predHome > predAway ? "HOME_WIN" : predHome < predAway ? "AWAY_WIN" : "DRAW";
        const isKnockout = match.stage && KNOCKOUT_STAGES.includes(match.stage);

        let actualPenaltyWinner: string | null = null;
        if (isKnockout && homeActual === awayActual && match.confirmedPenaltyScore) {
          const penHome = parseInt(match.confirmedPenaltyScore.home);
          const penAway = parseInt(match.confirmedPenaltyScore.away);
          if (!isNaN(penHome) && !isNaN(penAway)) {
            actualPenaltyWinner = penHome > penAway ? "home" : "away";
          }
        }

        if (predHome === homeActual && predAway === awayActual) {
          exactScorePoints = 5;
        } else if (predOutcome === actualOutcome) {
          resultPoints = 2;
        }

        if (
          pred.manOfTheMatch &&
          match.confirmedMOTM &&
          pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()
        ) {
          motmPoints = 3;
        }

        if (isKnockout && homeActual === awayActual && actualPenaltyWinner) {
          if (pred.predictedPenaltyWinner === actualPenaltyWinner) {
            penaltyPoints = 2;
          }
        }
      }

      const total = exactScorePoints + resultPoints + motmPoints + penaltyPoints;
      const pointsBreakdown = { result: resultPoints, exactScore: exactScorePoints, motm: motmPoints, penalty: penaltyPoints };

      batchOps.push({
        ref: db.collection("predictions").doc(pred.id),
        data: { pointsEarned: total, pointsBreakdown },
      });

      if (hasPrediction) {
        userStats[userId].predictionsPoints += total;
        userStats[userId].predictionsCount += 1;
      }
    }

    // Commit prediction updates in batches
    for (let i = 0; i < batchOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = batchOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }

    // Fetch official rankings for dynamic recalculation
    const r1Snap = await db.collection("system").doc("dream_team_rankings_phase1").get();
    const r2Snap = await db.collection("system").doc("dream_team_rankings_phase2").get();
    const rankings1 = r1Snap.exists ? (r1Snap.data()?.rankings || {}) : {};
    const rankings2 = r2Snap.exists ? (r2Snap.data()?.rankings || {}) : {};

    const calculateDreamTeamPointsRecalc = (dtPlayers: any[], rks: Record<string, string[]>) => {
      let dtTotal = 0;
      const dtBreakdown: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
      const dtPlayerPoints: any[] = [];
      dtPlayers.forEach((player) => {
        const pos = player.position || "FW";
        const name = player.name || "";
        const pPrice = player.price || 5.0;
        const list = rks[pos] || [];
        const rankIndex = list.findIndex(
          (rankedName) => rankedName && rankedName.trim().toLowerCase() === name.trim().toLowerCase()
        );
        let basePts = 0;
        if (rankIndex !== -1) basePts = 10 - rankIndex;
        const isStarting = player.isStarting !== false;
        const isCaptain = player.isCaptain === true;
        const earnedPts = isCaptain ? basePts * 2 : basePts;
        dtTotal += earnedPts;
        if (dtBreakdown[pos] !== undefined) dtBreakdown[pos] += earnedPts;
        dtPlayerPoints.push({
          name, position: pos, team: player.team, price: pPrice,
          isStarting, isCaptain, points: earnedPts, basePoints: basePts,
          rank: rankIndex !== -1 ? rankIndex + 1 : null,
        });
      });
      return { total: dtTotal, breakdown: dtBreakdown, playerPoints: dtPlayerPoints };
    };

    // Fetch all dream teams
    const dtSnapshot = await db.collection("dream_teams").get();
    const dreamTeamsMap: Record<string, { phase1: number; phase2: number }> = {};
    const dtBatchOps: Array<{ ref: FirebaseFirestore.DocumentReference; data: any }> = [];

    dtSnapshot.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();
      
      let userId = docId;
      let phase = 1;
      if (docId.endsWith("_phase1")) {
        userId = docId.replace("_phase1", "");
        phase = 1;
      } else if (docId.endsWith("_phase2")) {
        userId = docId.replace("_phase2", "");
        phase = 2;
      }
      
      const rks = phase === 1 ? rankings1 : rankings2;
      const { total, breakdown, playerPoints } = calculateDreamTeamPointsRecalc(data.players || [], rks);

      // Cache computed points back to the dream team document
      dtBatchOps.push({
        ref: docSnap.ref,
        data: {
          pointsEarned: total,
          pointsBreakdown: breakdown,
          playerPointsBreakdown: playerPoints,
          pointsAwardedAt: new Date().toISOString(),
        }
      });

      if (!dreamTeamsMap[userId]) {
        dreamTeamsMap[userId] = { phase1: 0, phase2: 0 };
      }
      
      if (phase === 1) {
        dreamTeamsMap[userId].phase1 = total;
      } else if (phase === 2) {
        dreamTeamsMap[userId].phase2 = total;
      }
    });

    // Commit dream team updates in batches
    for (let i = 0; i < dtBatchOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = dtBatchOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }

    // Fetch official awards and user awards predictions
    const officialAwardsSnap = await db.collection("system").doc("official_awards").get();
    const officialAwards = officialAwardsSnap.exists ? officialAwardsSnap.data() : null;
    const awardsPointsMap: Record<string, number> = {};
    
    if (officialAwards && officialAwards.resolved) {
      const pott = officialAwards.pott || "";
      const goldenBoot = officialAwards.goldenBoot || "";
      const goldenGlove = officialAwards.goldenGlove || "";
      
      const awardsSnap = await db.collection("awards_predictions").get();
      awardsSnap.forEach((docSnap) => {
        const userId = docSnap.id;
        const pred = docSnap.data();
        let earned = 0;
        if (pred.pott && pred.pott.trim().toLowerCase() === pott.trim().toLowerCase()) earned += 3;
        if (pred.goldenBoot && pred.goldenBoot.trim().toLowerCase() === goldenBoot.trim().toLowerCase()) earned += 3;
        if (pred.goldenGlove && pred.goldenGlove.trim().toLowerCase() === goldenGlove.trim().toLowerCase()) earned += 3;
        
        awardsPointsMap[userId] = earned;
      });
    }

    // 6. Update user documents
    const userOps: Array<{ ref: FirebaseFirestore.DocumentReference; data: any }> = [];

    for (const uid of Object.keys(userStats)) {
      const userDoc = users[uid];
      if (!userDoc) continue;

      const stats = userStats[uid];
      const dtPoints = dreamTeamsMap[uid] || { phase1: 0, phase2: 0 };
      const dtPointsPhase1 = dtPoints.phase1;
      const dtPointsPhase2 = dtPoints.phase2;
      const awardsPoints = awardsPointsMap[uid] || 0;

      const newTotalPoints = stats.predictionsPoints + awardsPoints + dtPointsPhase1 + dtPointsPhase2 + (userDoc.bonusPoints || 0);

      userOps.push({
        ref: db.collection("users").doc(uid),
        data: { 
          totalPoints: newTotalPoints, 
          predictionsCount: stats.predictionsCount,
          dreamTeamPoints: dtPointsPhase1,
          dreamTeamPointsPhase1: dtPointsPhase1,
          dreamTeamPointsPhase2: dtPointsPhase2,
          awardsPoints: awardsPoints
        },
      });
    }

    for (let i = 0; i < userOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = userOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }

    return {
      success: true,
      message: `Recalculated points for ${Object.keys(userStats).length} users across ${predictions.length} predictions.`,
    };
  }
);
