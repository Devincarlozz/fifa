/**
 * functions/src/players/managePlayer.ts
 *
 * Callable Cloud Functions for player management (CRUD + image clearing).
 * Migrated from playerService.js write operations.
 */
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// ─── Save Player ───────────────────────────────────────────────────
export const savePlayer = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can manage players.");
  }

  const { country, name, position, number, price, oldName } = request.data;

  if (!country || !name || !position || !number) {
    throw new HttpsError("invalid-argument", "country, name, position, and number are required.");
  }

  const db = admin.firestore();

  // If editing and name changed, delete the old document
  if (oldName && oldName.trim().toLowerCase() !== name.trim().toLowerCase()) {
    const oldDocId = `${country.replace(/\s+/g, "_")}_${oldName.trim().replace(/\s+/g, "_")}`;
    try {
      await db.collection("custom_players").doc(oldDocId).delete();
    } catch (err) {
      console.error("Failed to delete old player document:", err);
    }
  }

  const docId = `${country.replace(/\s+/g, "_")}_${name.trim().replace(/\s+/g, "_")}`;
  const payload = {
    country,
    name: name.trim(),
    position,
    number: String(number),
    price: parseFloat(String(price)) || 5.0,
    deleted: false,
    updatedAt: new Date().toISOString(),
    updatedBy: request.auth.token.email || "admin",
  };

  await db.collection("custom_players").doc(docId).set(payload);

  return { success: true, message: `Player ${name} saved successfully.`, docId };
});

// ─── Delete Player ─────────────────────────────────────────────────
export const deletePlayer = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can delete players.");
  }

  const { country, name } = request.data;

  if (!country || !name) {
    throw new HttpsError("invalid-argument", "country and name are required.");
  }

  const db = admin.firestore();
  const docId = `${country.replace(/\s+/g, "_")}_${name.trim().replace(/\s+/g, "_")}`;

  // Soft-delete: mark as deleted so syncing clients can remove them
  const payload = {
    country,
    name: name.trim(),
    deleted: true,
    updatedAt: new Date().toISOString(),
    updatedBy: request.auth.token.email || "admin",
  };

  await db.collection("custom_players").doc(docId).set(payload);

  return { success: true, message: `Player ${name} deleted successfully.` };
});

// ─── Clear All Player Images ───────────────────────────────────────
export const clearPlayerImages = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError("permission-denied", "Only administrators can clear player images.");
  }

  const db = admin.firestore();
  const querySnapshot = await db.collection("custom_players").get();

  const BATCH_SIZE = 450;
  let count = 0;

  for (let i = 0; i < querySnapshot.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = querySnapshot.docs.slice(i, i + BATCH_SIZE);
    for (const docSnap of chunk) {
      batch.update(docSnap.ref, { pictureUrl: "" });
      count++;
    }
    await batch.commit();
  }

  return {
    success: true,
    message: `Cleared image URLs for ${count} players.`,
  };
});
