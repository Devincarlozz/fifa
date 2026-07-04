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
exports.setAdminRole = void 0;
exports.bootstrapAdminClaims = bootstrapAdminClaims;
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
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
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
async function bootstrapAdminClaims() {
    // Ensure Admin SDK is initialized
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    for (const email of INITIAL_ADMIN_EMAILS) {
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
            console.log(`✅ Set admin claim for ${email} (uid: ${userRecord.uid})`);
        }
        catch (err) {
            if (err.code === "auth/user-not-found") {
                console.warn(`⚠️  User not found for ${email} — skipping.`);
            }
            else {
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
exports.setAdminRole = (0, https_1.onCall)(async (request) => {
    // 1. Verify caller is an admin
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can modify user roles.");
    }
    const { uid, isAdmin } = request.data;
    if (!uid || typeof isAdmin !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "Must provide uid (string) and isAdmin (boolean).");
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
    }
    catch (err) {
        console.error("setAdminRole error:", err);
        throw new https_1.HttpsError("internal", err.message || "Failed to update admin role.");
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
//# sourceMappingURL=setAdminClaims.js.map