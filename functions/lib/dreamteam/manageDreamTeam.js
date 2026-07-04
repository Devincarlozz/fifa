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
exports.publishDreamTeamRankings = exports.saveDreamTeamSettings = void 0;
/**
 * functions/src/dreamteam/manageDreamTeam.ts
 *
 * Callable Cloud Functions for Dream Team settings and rankings.
 * Migrated from DreamTeamRankingsPanel.jsx and dreamTeamCalc.js.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// ─── Save Dream Team Settings ──────────────────────────────────────
exports.saveDreamTeamSettings = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can update Dream Team settings.");
    }
    const settings = request.data;
    if (!settings || typeof settings !== "object") {
        throw new https_1.HttpsError("invalid-argument", "Settings object is required.");
    }
    const db = admin.firestore();
    const docRef = db.collection("system").doc("dream_team_settings");
    await docRef.set(settings, { merge: true });
    return { success: true, message: "Dream Team settings updated." };
});
// ─── Publish Dream Team Rankings & Compute Points ──────────────────
exports.publishDreamTeamRankings = (0, https_1.onCall)({ timeoutSeconds: 300 }, async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can publish rankings.");
    }
    const { rankings, phase } = request.data;
    if (!rankings || typeof rankings !== "object") {
        throw new https_1.HttpsError("invalid-argument", "rankings object is required.");
    }
    const activePhase = phase || 1;
    const db = admin.firestore();
    // 1. Save rankings to system doc
    const systemRef = db.collection("system").doc(`dream_team_rankings_phase${activePhase}`);
    await systemRef.set({
        rankings,
        publishedAt: new Date().toISOString(),
        publishedBy: request.auth.token.email || "admin",
    }, { merge: true });
    // 2. Fetch all user dream teams
    const dtSnapshot = await db.collection("dream_teams").get();
    const dreamTeams = [];
    dtSnapshot.forEach((docSnap) => {
        dreamTeams.push({ id: docSnap.id, ...docSnap.data() });
    });
    // 3. Calculate points for each user's dream team
    const BATCH_SIZE = 200; // Each user needs 2 writes (dream_team + user)
    let processedCount = 0;
    for (let i = 0; i < dreamTeams.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = dreamTeams.slice(i, i + BATCH_SIZE);
        for (const dt of chunk) {
            const docId = dt.id;
            if (!docId)
                continue;
            // Filter by phase
            const isPhase2Doc = docId.endsWith("_phase2");
            const isPhase1Doc = !isPhase2Doc;
            if (activePhase === 1 && !isPhase1Doc)
                continue;
            if (activePhase === 2 && !isPhase2Doc)
                continue;
            const userId = docId.replace("_phase1", "").replace("_phase2", "");
            // Calculate dream team points (inline — matching dreamTeamCalc.js logic)
            const { total, breakdown, playerPoints } = calculateDreamTeamPoints(dt.players || [], rankings);
            // Update dream team document
            const dtRef = db.collection("dream_teams").doc(docId);
            batch.update(dtRef, {
                pointsEarned: total,
                pointsBreakdown: breakdown,
                playerPointsBreakdown: playerPoints,
                pointsAwardedAt: new Date().toISOString(),
            });
            // Update user document
            const userRef = db.collection("users").doc(userId);
            // We need to read user data for correct total calculation
            // Using a transaction-like approach within the batch context
            processedCount++;
        }
        await batch.commit();
    }
    // 4. Update user totals using SAFE additive recalculation (no subtraction)
    // Fetch all predictions and matches to compute prediction-based points
    const KNOCKOUT_STAGES_DT = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Play-off for third place", "Final"];
    const allMatchesSnap = await db.collection("matches").get();
    const matchesMapDT = {};
    allMatchesSnap.forEach((mDoc) => { matchesMapDT[mDoc.id] = mDoc.data(); });
    const allPredsSnap = await db.collection("predictions").get();
    const userPredPointsDT = {};
    allPredsSnap.forEach((predDoc) => {
        const pred = predDoc.data();
        const pUserId = pred.userId;
        const pMatchId = pred.matchId;
        if (!pUserId || !pMatchId)
            return;
        if (!userPredPointsDT[pUserId])
            userPredPointsDT[pUserId] = 0;
        const match = matchesMapDT[pMatchId];
        if (!match || !match.confirmed)
            return;
        const hA = parseInt(match.confirmedResult?.homeGoals);
        const aA = parseInt(match.confirmedResult?.awayGoals);
        const actualOut = hA > aA ? "HOME_WIN" : hA < aA ? "AWAY_WIN" : "DRAW";
        const pH = parseInt(pred.homeGoals);
        const pA = parseInt(pred.awayGoals);
        if (isNaN(pH) || isNaN(pA))
            return;
        const predOut = pH > pA ? "HOME_WIN" : pH < pA ? "AWAY_WIN" : "DRAW";
        let pts = 0;
        if (pH === hA && pA === aA)
            pts += 5;
        else if (predOut === actualOut)
            pts += 2;
        if (pred.manOfTheMatch && match.confirmedMOTM && pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase())
            pts += 3;
        const isKO = match.stage && KNOCKOUT_STAGES_DT.includes(match.stage);
        if (isKO && hA === aA && match.confirmedPenaltyScore) {
            const penH = parseInt(match.confirmedPenaltyScore.home);
            const penA = parseInt(match.confirmedPenaltyScore.away);
            if (!isNaN(penH) && !isNaN(penA)) {
                const penWinner = penH > penA ? "home" : "away";
                if (pred.predictedPenaltyWinner === penWinner)
                    pts += 2;
            }
        }
        userPredPointsDT[pUserId] += pts;
    });
    // Fetch awards points
    const officialAwardsSnapDT = await db.collection("system").doc("official_awards").get();
    const officialAwardsDT = officialAwardsSnapDT.exists ? officialAwardsSnapDT.data() : null;
    const awardsPointsMapDT = {};
    if (officialAwardsDT && officialAwardsDT.resolved) {
        const awardsPredsSnap = await db.collection("awards_predictions").get();
        awardsPredsSnap.forEach((apDoc) => {
            const apUserId = apDoc.id;
            const apPred = apDoc.data();
            let apEarned = 0;
            if (apPred.pott && officialAwardsDT.pott && apPred.pott.trim().toLowerCase() === officialAwardsDT.pott.trim().toLowerCase())
                apEarned += 3;
            if (apPred.goldenBoot && officialAwardsDT.goldenBoot && apPred.goldenBoot.trim().toLowerCase() === officialAwardsDT.goldenBoot.trim().toLowerCase())
                apEarned += 3;
            if (apPred.goldenGlove && officialAwardsDT.goldenGlove && apPred.goldenGlove.trim().toLowerCase() === officialAwardsDT.goldenGlove.trim().toLowerCase())
                apEarned += 3;
            awardsPointsMapDT[apUserId] = apEarned;
        });
    }
    // Build map of ALL dream team points from the freshly updated collection
    const dtAllSnapForTotals = await db.collection("dream_teams").get();
    const dtAllPointsMap = {};
    dtAllSnapForTotals.forEach((dtDoc) => {
        const dtId = dtDoc.id;
        const dtData = dtDoc.data();
        const dtPts = dtData.pointsEarned || 0;
        let uid = dtId;
        let ph = 1;
        if (dtId.endsWith("_phase1")) {
            uid = dtId.replace("_phase1", "");
            ph = 1;
        }
        else if (dtId.endsWith("_phase2")) {
            uid = dtId.replace("_phase2", "");
            ph = 2;
        }
        if (!dtAllPointsMap[uid])
            dtAllPointsMap[uid] = { phase1: 0, phase2: 0 };
        if (ph === 1)
            dtAllPointsMap[uid].phase1 = dtPts;
        else
            dtAllPointsMap[uid].phase2 = dtPts;
    });
    for (const dt of dreamTeams) {
        const docId = dt.id;
        if (!docId)
            continue;
        const isPhase2Doc = docId.endsWith("_phase2");
        const isPhase1Doc = !isPhase2Doc;
        if (activePhase === 1 && !isPhase1Doc)
            continue;
        if (activePhase === 2 && !isPhase2Doc)
            continue;
        const userId = docId.replace("_phase1", "").replace("_phase2", "");
        const { total } = calculateDreamTeamPoints(dt.players || [], rankings);
        try {
            const userRef = db.collection("users").doc(userId);
            const userDocSnap = await userRef.get();
            if (userDocSnap.exists) {
                // SAFE: Recompute totalPoints as sum of all components (no subtraction)
                const predPts = userPredPointsDT[userId] || 0;
                const awardsPts = awardsPointsMapDT[userId] || 0;
                const allDtPts = dtAllPointsMap[userId] || { phase1: 0, phase2: 0 };
                const phase1Pts = activePhase === 1 ? total : allDtPts.phase1;
                const phase2Pts = activePhase === 2 ? total : allDtPts.phase2;
                const newTotal = predPts + phase1Pts + phase2Pts + awardsPts + (userDocSnap.data()?.bonusPoints || 0);
                const updateData = { totalPoints: newTotal };
                if (activePhase === 1) {
                    updateData.dreamTeamPointsPhase1 = total;
                    updateData.dreamTeamPoints = total;
                }
                else if (activePhase === 2) {
                    updateData.dreamTeamPointsPhase2 = total;
                }
                await userRef.update(updateData);
            }
        }
        catch (err) {
            console.error(`Failed to update points for user ${userId}:`, err);
        }
    }
    return {
        success: true,
        message: `Rankings published for Phase ${activePhase}. Processed ${processedCount} dream teams.`,
    };
});
// ─── Dream Team Points Calculation (server-side copy) ──────────────
function calculateDreamTeamPoints(dreamTeamPlayers, rankings) {
    let total = 0;
    const breakdown = { GK: 0, DF: 0, MF: 0, FW: 0 };
    const playerPoints = [];
    if (!dreamTeamPlayers || !rankings) {
        return { total, breakdown, playerPoints };
    }
    dreamTeamPlayers.forEach((player) => {
        const pos = player.position || "FW";
        const name = player.name || "";
        const price = player.price || 5.0;
        const list = rankings[pos] || [];
        // Find index in top 10 list
        const rankIndex = list.findIndex((rankedName) => rankedName && rankedName.trim().toLowerCase() === name.trim().toLowerCase());
        let basePts = 0;
        if (rankIndex !== -1) {
            basePts = 10 - rankIndex;
        }
        const isStarting = player.isStarting !== false;
        const isCaptain = player.isCaptain === true;
        const earnedPts = isCaptain ? basePts * 2 : basePts;
        total += earnedPts;
        if (breakdown[pos] !== undefined) {
            breakdown[pos] += earnedPts;
        }
        playerPoints.push({
            name,
            position: pos,
            team: player.team,
            price,
            isStarting,
            isCaptain,
            points: earnedPts,
            basePoints: basePts,
            rank: rankIndex !== -1 ? rankIndex + 1 : null,
        });
    });
    return { total, breakdown, playerPoints };
}
//# sourceMappingURL=manageDreamTeam.js.map