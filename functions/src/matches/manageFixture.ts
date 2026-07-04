/**
 * functions/src/matches/manageFixture.ts
 *
 * Callable Cloud Functions for fixture CRUD operations.
 * Migrated from AdminDashboard.jsx direct Firestore writes.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// ─── Create Fixture ────────────────────────────────────────────────
export const createFixture = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can create fixtures.");
  }

  const data = request.data;
  const { homeTeam, awayTeam, kickoff, venue, stage } = data;

  if (!homeTeam?.name || !homeTeam?.code || !awayTeam?.name || !awayTeam?.code || !kickoff) {
    throw new HttpsError("invalid-argument", "Missing required fixture fields.");
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
export const updateFixture = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can update fixtures.");
  }

  const { matchId, updatedFields } = request.data;

  if (!matchId || !updatedFields) {
    throw new HttpsError("invalid-argument", "matchId and updatedFields are required.");
  }

  const db = admin.firestore();
  const matchRef = db.collection("matches").doc(matchId);
  const matchSnap = await matchRef.get();

  if (!matchSnap.exists) {
    throw new HttpsError("not-found", `Match ${matchId} not found.`);
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
export const deleteFixture = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can delete fixtures.");
  }

  const { matchId } = request.data;

  if (!matchId) {
    throw new HttpsError("invalid-argument", "matchId is required.");
  }

  const db = admin.firestore();
  const matchRef = db.collection("matches").doc(matchId);
  const matchSnap = await matchRef.get();

  if (!matchSnap.exists) {
    throw new HttpsError("not-found", `Match ${matchId} not found.`);
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
