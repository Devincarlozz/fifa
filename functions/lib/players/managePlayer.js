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
exports.clearPlayerImages = exports.deletePlayer = exports.savePlayer = void 0;
/**
 * functions/src/players/managePlayer.ts
 *
 * Callable Cloud Functions for player management (CRUD + image clearing).
 * Migrated from playerService.js write operations.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
// ─── Save Player ───────────────────────────────────────────────────
exports.savePlayer = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can manage players.");
    }
    const { country, name, position, number, price, oldName } = request.data;
    if (!country || !name || !position || !number) {
        throw new https_1.HttpsError("invalid-argument", "country, name, position, and number are required.");
    }
    const db = admin.firestore();
    // If editing and name changed, delete the old document
    if (oldName && oldName.trim().toLowerCase() !== name.trim().toLowerCase()) {
        const oldDocId = `${country.replace(/\s+/g, "_")}_${oldName.trim().replace(/\s+/g, "_")}`;
        try {
            await db.collection("custom_players").doc(oldDocId).delete();
        }
        catch (err) {
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
exports.deletePlayer = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can delete players.");
    }
    const { country, name } = request.data;
    if (!country || !name) {
        throw new https_1.HttpsError("invalid-argument", "country and name are required.");
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
exports.clearPlayerImages = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can clear player images.");
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
//# sourceMappingURL=managePlayer.js.map