/**
 * functions/src/index.ts
 *
 * Main entry point for all Firebase Cloud Functions.
 * Exports every callable function and auth trigger.
 */
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (uses default project credentials)
admin.initializeApp();

// ─── Auth Triggers ─────────────────────────────────────────────────
export { onNewUserCreated, ensureUserProfile } from "./auth/onUserCreate";

// ─── Admin Role Management ─────────────────────────────────────────
export { setAdminRole } from "./admin/setAdminClaims";

// ─── Match Management ──────────────────────────────────────────────
export { confirmMatchResult } from "./matches/confirmMatchResult";
export { recalculateAllPoints } from "./matches/recalculateAllPoints";
export { createFixture, updateFixture, deleteFixture } from "./matches/manageFixture";
export { seedDatabase } from "./matches/seedMatches";

// ─── Team Management ──────────────────────────────────────────────
export { eliminateTeam, restoreTeam } from "./teams/manageTeam";

// ─── Awards ────────────────────────────────────────────────────────
export { resolveAwardsPoints } from "./awards/resolveAwards";

// ─── Player Management ────────────────────────────────────────────
export { savePlayer, deletePlayer, clearPlayerImages } from "./players/managePlayer";

// ─── Dream Team ────────────────────────────────────────────────────
export { saveDreamTeamSettings, publishDreamTeamRankings } from "./dreamteam/manageDreamTeam";
