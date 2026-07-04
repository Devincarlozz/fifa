/**
 * functions/src/awards/resolveAwards.ts
 *
 * Callable Cloud Function to resolve tournament award predictions and award points.
 * Migrated from AdminDashboard.jsx handleResolveAwardsPoints.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const resolveAwardsPoints = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth?.token?.admin) {
      throw new HttpsError("permission-denied", "Only administrators can resolve award points.");
    }

    const { pott, goldenBoot, goldenGlove } = request.data;

    if (!pott || !goldenBoot || !goldenGlove) {
      throw new HttpsError(
        "invalid-argument",
        "All three awards (pott, goldenBoot, goldenGlove) are required."
      );
    }

    const db = admin.firestore();

    // 1. Save official awards to Firestore
    const officialRef = db.collection("system").doc("official_awards");
    await officialRef.set({
      pott,
      goldenBoot,
      goldenGlove,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: request.auth.token.email || "admin",
    });

    // 2. Fetch all awards predictions
    const predSnap = await db.collection("awards_predictions").get();
    const predictionsMap: Record<string, any> = {};
    predSnap.forEach((docSnap) => {
      predictionsMap[docSnap.id] = docSnap.data();
    });

    // 3. Fetch all users
    const usersSnap = await db.collection("users").get();

    let updateCount = 0;
    const BATCH_SIZE = 450;
    const userOps: Array<{ ref: FirebaseFirestore.DocumentReference; data: any }> = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Calculate awards points
      const pred = predictionsMap[userId];
      let newAwardsPoints = 0;
      if (pred) {
        if (pred.pott && pred.pott.trim().toLowerCase() === pott.trim().toLowerCase()) {
          newAwardsPoints += 3;
        }
        if (pred.goldenBoot && pred.goldenBoot.trim().toLowerCase() === goldenBoot.trim().toLowerCase()) {
          newAwardsPoints += 3;
        }
        if (pred.goldenGlove && pred.goldenGlove.trim().toLowerCase() === goldenGlove.trim().toLowerCase()) {
          newAwardsPoints += 3;
        }
      }

      const oldAwardsPoints = userData.awardsPoints || 0;
      const currentTotal = userData.totalPoints || 0;
      const newTotal = currentTotal - oldAwardsPoints + newAwardsPoints;

      userOps.push({
        ref: db.collection("users").doc(userId),
        data: { awardsPoints: newAwardsPoints, totalPoints: newTotal },
      });

      updateCount++;
    }

    // Commit in batches
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
      message: `Awards resolved. Updated points for ${updateCount} users.`,
    };
  }
);
