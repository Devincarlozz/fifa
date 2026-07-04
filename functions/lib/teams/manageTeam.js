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
exports.restoreTeam = exports.eliminateTeam = void 0;
/**
 * functions/src/teams/manageTeam.ts
 *
 * Callable Cloud Functions for team elimination and restoration.
 * Migrated from AdminDashboard.jsx direct Firestore writes.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// ─── Eliminate Team ────────────────────────────────────────────────
exports.eliminateTeam = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can eliminate teams.");
    }
    const { teamName } = request.data;
    if (!teamName) {
        throw new https_1.HttpsError("invalid-argument", "teamName is required.");
    }
    const db = admin.firestore();
    // 1. Add to system/eliminated_teams
    const elimRef = db.collection("system").doc("eliminated_teams");
    const elimSnap = await elimRef.get();
    const currentTeams = elimSnap.exists ? (elimSnap.data()?.teams || []) : [];
    if (!currentTeams.includes(teamName)) {
        currentTeams.push(teamName);
    }
    await elimRef.set({ teams: currentTeams });
    // 2. Delete all custom_players for this country
    const customPlayersQuery = db.collection("custom_players").where("country", "==", teamName);
    const qSnap = await customPlayersQuery.get();
    const batch = db.batch();
    let deletedCount = 0;
    qSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deletedCount++;
    });
    if (deletedCount > 0) {
        await batch.commit();
    }
    return {
        success: true,
        message: `Team ${teamName} eliminated. ${deletedCount} custom players deleted.`,
    };
});
// ─── Restore Team ──────────────────────────────────────────────────
exports.restoreTeam = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can restore teams.");
    }
    const { teamName } = request.data;
    if (!teamName) {
        throw new https_1.HttpsError("invalid-argument", "teamName is required.");
    }
    const db = admin.firestore();
    const elimRef = db.collection("system").doc("eliminated_teams");
    const elimSnap = await elimRef.get();
    const currentTeams = elimSnap.exists ? (elimSnap.data()?.teams || []) : [];
    const newTeams = currentTeams.filter((t) => t !== teamName);
    await elimRef.set({ teams: newTeams });
    return {
        success: true,
        message: `Team ${teamName} restored successfully.`,
    };
});
//# sourceMappingURL=manageTeam.js.map