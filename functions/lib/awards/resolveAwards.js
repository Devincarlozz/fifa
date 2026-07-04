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
exports.resolveAwardsPoints = void 0;
/**
 * functions/src/awards/resolveAwards.ts
 *
 * Callable Cloud Function to resolve tournament award predictions and award points.
 * Migrated from AdminDashboard.jsx handleResolveAwardsPoints.
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.resolveAwardsPoints = (0, https_1.onCall)({ timeoutSeconds: 120 }, async (request) => {
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError("permission-denied", "Only administrators can resolve award points.");
    }
    const { pott, goldenBoot, goldenGlove } = request.data;
    if (!pott || !goldenBoot || !goldenGlove) {
        throw new https_1.HttpsError("invalid-argument", "All three awards (pott, goldenBoot, goldenGlove) are required.");
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
    const predictionsMap = {};
    predSnap.forEach((docSnap) => {
        predictionsMap[docSnap.id] = docSnap.data();
    });
    // 3. Fetch all users
    const usersSnap = await db.collection("users").get();
    let updateCount = 0;
    const BATCH_SIZE = 450;
    const userOps = [];
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
});
//# sourceMappingURL=resolveAwards.js.map