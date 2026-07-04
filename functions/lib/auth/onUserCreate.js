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
exports.ensureUserProfile = exports.onNewUserCreated = void 0;
/**
 * functions/src/auth/onUserCreate.ts
 *
 * Firebase Auth trigger: automatically creates a Firestore user profile
 * when a new user signs up. Replaces the client-side profile creation
 * that was in AuthContext.jsx.
 */
const admin = __importStar(require("firebase-admin"));
const identity_1 = require("firebase-functions/v2/identity");
const https_1 = require("firebase-functions/v2/https");
/**
 * onUserCreated — Auth trigger that fires after a new user is created.
 * Creates their Firestore profile document with safe defaults.
 *
 * Note: We use beforeUserCreated blocking function to also enforce
 * domain restrictions server-side.
 */
exports.onNewUserCreated = (0, identity_1.beforeUserCreated)(async (event) => {
    const user = event.data;
    const email = user.email?.toLowerCase() || "";
    // Enforce email domain restriction server-side
    const isRitEmail = email.endsWith("@rit.ac.in");
    // Initial admin emails list
    const INITIAL_ADMIN_EMAILS = [
        "admin@rit.ac.in",
        "bhagathkrishnan06@gmail.com",
        "24bb16641@rit.ac.in",
    ];
    const isInitialAdmin = INITIAL_ADMIN_EMAILS.includes(email);
    // Check if user already has admin claims (set via bootstrap script)
    const isAdmin = event.data.customClaims?.admin === true;
    if (!isAdmin && !isRitEmail && !isInitialAdmin) {
        // Block the account creation for non-RIT emails
        throw new https_1.HttpsError("permission-denied", "Access restricted to @rit.ac.in accounts only.");
    }
    // Create the Firestore user profile (non-blocking — we don't fail signup if this fails)
    try {
        const db = admin.firestore();
        const userRef = db.collection("users").doc(user.uid);
        const existingDoc = await userRef.get();
        if (!existingDoc.exists) {
            await userRef.set({
                uid: user.uid,
                name: user.displayName || email.split("@")[0] || "Anonymous",
                email: user.email || "",
                photoURL: user.photoURL || "",
                totalPoints: 0,
                predictionsCount: 0,
                isActive: true,
                isAdmin: isInitialAdmin || isAdmin, // Admin status comes from Custom Claims, but we set it here for display/matching
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    catch (err) {
        // Non-fatal: log but don't block user creation
        console.error("Failed to create user profile in Firestore:", err);
    }
    // If they are an initial admin, return custom claims to be set during registration
    if (isInitialAdmin) {
        return {
            customClaims: {
                admin: true
            }
        };
    }
    return {};
});
/**
 * ensureUserProfile — callable function that creates or patches a user's
 * Firestore profile if it's missing. Called by the client after login
 * as a fallback (e.g., for users created before this trigger existed).
 */
exports.ensureUserProfile = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in.");
    }
    const uid = request.auth.uid;
    const email = request.auth.token.email || "";
    const name = request.auth.token.name || email.split("@")[0] || "Anonymous";
    const photoURL = request.auth.token.picture || "";
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const existingDoc = await userRef.get();
    if (existingDoc.exists) {
        const data = existingDoc.data();
        // Patch isActive if missing
        if (data?.isActive === undefined) {
            await userRef.update({ isActive: true });
        }
        return { success: true, created: false };
    }
    // Create new profile
    await userRef.set({
        uid,
        name,
        email,
        photoURL,
        totalPoints: 0,
        predictionsCount: 0,
        isActive: true,
        isAdmin: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, created: true };
});
//# sourceMappingURL=onUserCreate.js.map