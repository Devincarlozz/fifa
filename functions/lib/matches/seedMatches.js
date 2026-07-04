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
exports.seedDatabase = void 0;
/**
 * functions/src/matches/seedMatches.ts
 *
 * Callable Cloud Function to seed initial match fixtures.
 * Migrated from client-side seeder.js.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.seedDatabase = (0, https_1.onCall)({ timeoutSeconds: 120 }, async (request) => {
    // Authorization: admin only
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can seed the database.");
    }
    const { force, fixtureData } = request.data;
    if (!fixtureData || !Array.isArray(fixtureData) || fixtureData.length === 0) {
        throw new https_1.HttpsError("invalid-argument", "fixtureData array is required.");
    }
    const db = admin.firestore();
    // Check if already seeded (unless force is true)
    if (!force) {
        const matchesSnap = await db.collection("matches").get();
        if (!matchesSnap.empty) {
            return { success: true, count: matchesSnap.size, alreadySeeded: true };
        }
    }
    // Seed in batches of 450 (Firestore limit is 500 per batch)
    const BATCH_SIZE = 450;
    let count = 0;
    for (let i = 0; i < fixtureData.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = fixtureData.slice(i, i + BATCH_SIZE);
        for (const match of chunk) {
            const matchDoc = {
                ...match,
                id: match.matchId,
                kickoffTime: new Date(match.kickoffTimeStr || match.kickoffTime),
                confirmedAt: match.confirmedAt ? new Date(match.confirmedAt) : null,
            };
            // Clean up helper keys
            delete matchDoc.kickoffTimeStr;
            const matchRef = db.collection("matches").doc(match.matchId);
            batch.set(matchRef, matchDoc);
            count++;
        }
        await batch.commit();
    }
    return {
        success: true,
        count,
        alreadySeeded: false,
        message: `Successfully seeded ${count} matches.`,
    };
});
//# sourceMappingURL=seedMatches.js.map