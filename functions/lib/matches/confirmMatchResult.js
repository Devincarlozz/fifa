"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmMatchResult = void 0;
/**
 * functions/src/matches/confirmMatchResult.ts
 *
 * Callable Cloud Function to confirm match results and distribute points.
 * Migrated from client-side processMatchResults() in pointsCalc.js.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const KNOCKOUT_STAGES = [
    "Round of 32",
    "Round of 16",
    "Quarter-finals",
    "Semi-finals",
    "Play-off for third place",
    "Final",
];
exports.confirmMatchResult = (0, https_1.onCall)(async (request) => {
    // 1. Authorization: admin only
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can confirm match results.");
    }
    const data = request.data;
    const { matchId, finalScore, penaltyScore, manOfTheMatch } = data;
    // 2. Validate input
    if (!matchId || finalScore === undefined || !manOfTheMatch) {
        throw new https_1.HttpsError("invalid-argument", "matchId, finalScore, and manOfTheMatch are required.");
    }
    const homeActual = parseInt(String(finalScore.home));
    const awayActual = parseInt(String(finalScore.away));
    if (isNaN(homeActual) || isNaN(awayActual)) {
        throw new https_1.HttpsError("invalid-argument", "finalScore home and away must be valid numbers.");
    }
    const db = admin.firestore();
    // 3. Fetch match to check stage for penalty scoring
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
        throw new https_1.HttpsError("not-found", `Match ${matchId} not found.`);
    }
    const match = matchSnap.data();
    if (match.confirmed) {
        throw new https_1.HttpsError("already-exists", "This match has already been confirmed.");
    }
    const isKnockout = match.stage && KNOCKOUT_STAGES.includes(match.stage);
    const isDraw = homeActual === awayActual;
    const actualOutcome = homeActual > awayActual ? "HOME_WIN" : homeActual < awayActual ? "AWAY_WIN" : "DRAW";
    // Validate penalty scores for knockout draws
    let actualPenaltyWinner = null;
    if (isKnockout && isDraw) {
        if (!penaltyScore || penaltyScore.home === undefined || penaltyScore.away === undefined) {
            throw new https_1.HttpsError("invalid-argument", "Penalty scores required for knockout draws.");
        }
        const penHome = parseInt(String(penaltyScore.home));
        const penAway = parseInt(String(penaltyScore.away));
        if (isNaN(penHome) || isNaN(penAway)) {
            throw new https_1.HttpsError("invalid-argument", "Penalty scores must be valid numbers.");
        }
        if (penHome === penAway) {
            throw new https_1.HttpsError("invalid-argument", "Penalty shootout cannot end in a draw.");
        }
        actualPenaltyWinner = penHome > penAway ? "home" : "away";
    }
    // 4. Fetch all predictions for this match
    const predsQuery = db.collection("predictions").where("matchId", "==", matchId);
    const predsSnapshot = await predsQuery.get();
    // 5. Calculate and award points for each prediction
    const batch = db.batch();
    const userPointsMap = {};
    for (const predDoc of predsSnapshot.docs) {
        const pred = predDoc.data();
        const userId = pred.userId;
        if (!userId)
            continue;
        const predHome = parseInt(String(pred.homeGoals));
        const predAway = parseInt(String(pred.awayGoals));
        const hasPrediction = !isNaN(predHome) && !isNaN(predAway);
        let exactScorePoints = 0;
        let resultPoints = 0;
        let motmPoints = 0;
        let penaltyPoints = 0;
        if (hasPrediction) {
            const predOutcome = predHome > predAway ? "HOME_WIN" : predHome < predAway ? "AWAY_WIN" : "DRAW";
            // Exact score: 5 pts, correct result: 2 pts (mutually exclusive)
            if (predHome === homeActual && predAway === awayActual) {
                exactScorePoints = 5;
            }
            else if (predOutcome === actualOutcome) {
                resultPoints = 2;
            }
            // MOTM: 3 pts
            if (pred.manOfTheMatch &&
                manOfTheMatch &&
                pred.manOfTheMatch.trim().toLowerCase() === manOfTheMatch.trim().toLowerCase()) {
                motmPoints = 3;
            }
            // Penalty winner: 2 pts
            if (isKnockout && isDraw && actualPenaltyWinner) {
                if (pred.predictedPenaltyWinner === actualPenaltyWinner) {
                    penaltyPoints = 2;
                }
            }
        }
        const total = exactScorePoints + resultPoints + motmPoints + penaltyPoints;
        const pointsBreakdown = {
            result: resultPoints,
            exactScore: exactScorePoints,
            motm: motmPoints,
            penalty: penaltyPoints,
        };
        // Update prediction document
        batch.update(predDoc.ref, {
            pointsEarned: total,
            pointsBreakdown,
            pointsAwardedAt: new Date().toISOString(),
        });
        // Accumulate user points
        if (hasPrediction) {
            if (!userPointsMap[userId])
                userPointsMap[userId] = 0;
            userPointsMap[userId] += total;
        }
    }
    // 6. Update user totals
    for (const [userId, points] of Object.entries(userPointsMap)) {
        const userRef = db.collection("users").doc(userId);
        batch.update(userRef, {
            totalPoints: admin.firestore.FieldValue.increment(points),
            predictionsCount: admin.firestore.FieldValue.increment(1),
        });
    }
    // 7. Update match document
    const matchUpdate = {
        status: "CONFIRMED",
        confirmed: true,
        confirmedResult: { homeGoals: homeActual, awayGoals: awayActual },
        confirmedMOTM: manOfTheMatch.trim(),
        confirmedBy: request.auth.token.email || "admin",
        confirmedAt: new Date().toISOString(),
    };
    if (penaltyScore) {
        matchUpdate.confirmedPenaltyScore = penaltyScore;
    }
    batch.update(matchRef, matchUpdate);
    // 8. Commit all writes atomically
    await batch.commit();
    return {
        success: true,
        message: `Results confirmed for match ${matchId}. Points distributed to ${Object.keys(userPointsMap).length} users.`,
        predictionsProcessed: predsSnapshot.size,
    };
});
//# sourceMappingURL=confirmMatchResult.js.map