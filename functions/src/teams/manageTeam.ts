/**
 * functions/src/teams/manageTeam.ts
 *
 * Callable Cloud Functions for team elimination and restoration.
 * Migrated from AdminDashboard.jsx direct Firestore writes.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// ─── Eliminate Team ────────────────────────────────────────────────
export const eliminateTeam = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can eliminate teams.");
  }

  const { teamName } = request.data;

  if (!teamName) {
    throw new HttpsError("invalid-argument", "teamName is required.");
  }

  const db = admin.firestore();

  // 1. Add to system/eliminated_teams
  const elimRef = db.collection("system").doc("eliminated_teams");
  const elimSnap = await elimRef.get();
  const currentTeams: string[] = elimSnap.exists ? (elimSnap.data()?.teams || []) : [];

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
export const restoreTeam = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can restore teams.");
  }

  const { teamName } = request.data;

  if (!teamName) {
    throw new HttpsError("invalid-argument", "teamName is required.");
  }

  const db = admin.firestore();
  const elimRef = db.collection("system").doc("eliminated_teams");
  const elimSnap = await elimRef.get();
  const currentTeams: string[] = elimSnap.exists ? (elimSnap.data()?.teams || []) : [];

  const newTeams = currentTeams.filter((t) => t !== teamName);
  await elimRef.set({ teams: newTeams });

  return {
    success: true,
    message: `Team ${teamName} restored successfully.`,
  };
});
