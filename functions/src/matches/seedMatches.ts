/**
 * functions/src/matches/seedMatches.ts
 *
 * Callable Cloud Function to seed initial match fixtures.
 * Migrated from client-side seeder.js.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const seedDatabase = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    // Authorization: admin only
    if (!request.auth?.token?.admin) {
      throw new HttpsError("permission-denied", "Only administrators can seed the database.");
    }

    const { force, fixtureData } = request.data;

    if (!fixtureData || !Array.isArray(fixtureData) || fixtureData.length === 0) {
      throw new HttpsError("invalid-argument", "fixtureData array is required.");
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
        const matchDoc: any = {
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
  }
);
