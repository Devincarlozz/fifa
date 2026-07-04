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
exports.deleteFixture = exports.updateFixture = exports.createFixture = void 0;
/**
 * functions/src/matches/manageFixture.ts
 *
 * Callable Cloud Functions for fixture CRUD operations.
 * Migrated from AdminDashboard.jsx direct Firestore writes.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// ─── Create Fixture ────────────────────────────────────────────────
exports.createFixture = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can create fixtures.");
    }
    const data = request.data;
    const { homeTeam, awayTeam, kickoff, venue, stage } = data;
    if (!homeTeam?.name || !homeTeam?.code || !awayTeam?.name || !awayTeam?.code || !kickoff) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fixture fields.");
    }
    const db = admin.firestore();
    const matchId = `match_${Date.now()}`;
    const matchRef = db.collection("matches").doc(matchId);
    const newFixture = {
        matchId,
        homeTeam: {
            name: homeTeam.name.trim(),
            code: homeTeam.code.trim().toUpperCase(),
            crest: homeTeam.crest?.trim() || null,
            flag: homeTeam.flag || "⚽",
        },
        awayTeam: {
            name: awayTeam.name.trim(),
            code: awayTeam.code.trim().toUpperCase(),
            crest: awayTeam.crest?.trim() || null,
            flag: awayTeam.flag || "⚽",
        },
        kickoffTime: new Date(kickoff),
        venue: venue?.trim() || "Tournament Stadium",
        stage: stage || "GROUP_STAGE",
        status: "SCHEDULED",
        liveScore: { home: 0, away: 0 },
        minute: null,
        goals: [],
        bookings: [],
        confirmed: false,
        confirmedResult: null,
        confirmedMOTM: null,
        createdBy: request.auth.token.email || "admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await matchRef.set(newFixture);
    return { success: true, matchId, message: `Fixture ${matchId} created successfully.` };
});
// ─── Update Fixture ────────────────────────────────────────────────
exports.updateFixture = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can update fixtures.");
    }
    const { matchId, updatedFields } = request.data;
    if (!matchId || !updatedFields) {
        throw new https_1.HttpsError("invalid-argument", "matchId and updatedFields are required.");
    }
    const db = admin.firestore();
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
        throw new https_1.HttpsError("not-found", `Match ${matchId} not found.`);
    }
    // Convert kickoffTime string to Date if present
    if (updatedFields.kickoffTime && typeof updatedFields.kickoffTime === "string") {
        updatedFields.kickoffTime = new Date(updatedFields.kickoffTime);
    }
    // Ensure liveScore numbers are parsed
    if (updatedFields.liveScore) {
        updatedFields.liveScore = {
            home: parseInt(String(updatedFields.liveScore.home)) || 0,
            away: parseInt(String(updatedFields.liveScore.away)) || 0,
        };
    }
    updatedFields.updatedBy = request.auth.token.email || "admin";
    updatedFields.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await matchRef.update(updatedFields);
    return { success: true, message: `Fixture ${matchId} updated successfully.` };
});
// ─── Delete Fixture ────────────────────────────────────────────────
exports.deleteFixture = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can delete fixtures.");
    }
    const { matchId } = request.data;
    if (!matchId) {
        throw new https_1.HttpsError("invalid-argument", "matchId is required.");
    }
    const db = admin.firestore();
    const matchRef = db.collection("matches").doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
        throw new https_1.HttpsError("not-found", `Match ${matchId} not found.`);
    }
    // Also delete all predictions for this match
    const predsQuery = db.collection("predictions").where("matchId", "==", matchId);
    const predsSnap = await predsQuery.get();
    const batch = db.batch();
    batch.delete(matchRef);
    predsSnap.forEach((predDoc) => {
        batch.delete(predDoc.ref);
    });
    await batch.commit();
    return {
        success: true,
        message: `Fixture ${matchId} deleted along with ${predsSnap.size} associated predictions.`,
    };
});
//# sourceMappingURL=manageFixture.js.map