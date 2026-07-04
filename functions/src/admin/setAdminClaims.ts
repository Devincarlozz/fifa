/**
 * functions/src/admin/setAdminClaims.ts
 *
 * Standalone script to bootstrap admin Custom Claims on the initial admin accounts.
 * Run this once after deploying functions:
 *
 *   cd functions
 *   npx ts-node src/admin/setAdminClaims.ts
 *
 * Or use the deployed callable function `setAdminRole` from an existing admin.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// ─── Bootstrap Script ──────────────────────────────────────────────
// These are the initial admin emails. After bootstrap, admin status is
// determined solely by Custom Claims — these emails are never checked
// at runtime by client code or security rules.
const INITIAL_ADMIN_EMAILS = [
  "admin@rit.ac.in",
  "bhagathkrishnan06@gmail.com",
  "24bb16641@rit.ac.in",
];

/**
 * One-time bootstrap: sets { admin: true } custom claim on the
 * Firebase Auth accounts matching the initial admin emails.
 */
export async function bootstrapAdminClaims(): Promise<void> {
  // Ensure Admin SDK is initialized
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  for (const email of INITIAL_ADMIN_EMAILS) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
      console.log(`✅ Set admin claim for ${email} (uid: ${userRecord.uid})`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        console.warn(`⚠️  User not found for ${email} — skipping.`);
      } else {
        console.error(`❌ Error setting claim for ${email}:`, err);
      }
    }
  }

  console.log("\nBootstrap complete. Users must sign out and back in to pick up new claims.");
}

// ─── Callable Function ─────────────────────────────────────────────
/**
 * setAdminRole — callable by existing admins to promote/demote users.
 *
 * Payload: { uid: string, isAdmin: boolean }
 */
export const setAdminRole = onCall(async (request) => {
  // 1. Verify caller is an admin
  if (!request.auth?.token?.admin) {
    throw new HttpsError(
      "permission-denied",
      "Only administrators can modify user roles."
    );
  }

  const { uid, isAdmin } = request.data as { uid: string; isAdmin: boolean };

  if (!uid || typeof isAdmin !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "Must provide uid (string) and isAdmin (boolean)."
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

    // Also update the Firestore user doc for UI consistency
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update({ isAdmin, role: isAdmin ? "admin" : "user" });
    }

    return { success: true, message: `User ${uid} admin status set to ${isAdmin}.` };
  } catch (err: any) {
    console.error("setAdminRole error:", err);
    throw new HttpsError("internal", err.message || "Failed to update admin role.");
  }
});

// ─── Direct execution for bootstrapping ────────────────────────────
// When run directly with ts-node, execute the bootstrap function.
if (require.main === module) {
  bootstrapAdminClaims()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
