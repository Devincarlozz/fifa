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
exports.publishDreamTeamRankings = exports.saveDreamTeamSettings = exports.clearPlayerImages = exports.deletePlayer = exports.savePlayer = exports.resolveAwardsPoints = exports.restoreTeam = exports.eliminateTeam = exports.seedDatabase = exports.deleteFixture = exports.updateFixture = exports.createFixture = exports.recalculateAllPoints = exports.confirmMatchResult = exports.setAdminRole = exports.ensureUserProfile = exports.onNewUserCreated = void 0;
/**
 * functions/src/index.ts
 *
 * Main entry point for all Firebase Cloud Functions.
 * Exports every callable function and auth trigger.
 */
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK (uses default project credentials)
admin.initializeApp();
// ─── Auth Triggers ─────────────────────────────────────────────────
var onUserCreate_1 = require("./auth/onUserCreate");
Object.defineProperty(exports, "onNewUserCreated", { enumerable: true, get: function () { return onUserCreate_1.onNewUserCreated; } });
Object.defineProperty(exports, "ensureUserProfile", { enumerable: true, get: function () { return onUserCreate_1.ensureUserProfile; } });
// ─── Admin Role Management ─────────────────────────────────────────
var setAdminClaims_1 = require("./admin/setAdminClaims");
Object.defineProperty(exports, "setAdminRole", { enumerable: true, get: function () { return setAdminClaims_1.setAdminRole; } });
// ─── Match Management ──────────────────────────────────────────────
var confirmMatchResult_1 = require("./matches/confirmMatchResult");
Object.defineProperty(exports, "confirmMatchResult", { enumerable: true, get: function () { return confirmMatchResult_1.confirmMatchResult; } });
var recalculateAllPoints_1 = require("./matches/recalculateAllPoints");
Object.defineProperty(exports, "recalculateAllPoints", { enumerable: true, get: function () { return recalculateAllPoints_1.recalculateAllPoints; } });
var manageFixture_1 = require("./matches/manageFixture");
Object.defineProperty(exports, "createFixture", { enumerable: true, get: function () { return manageFixture_1.createFixture; } });
Object.defineProperty(exports, "updateFixture", { enumerable: true, get: function () { return manageFixture_1.updateFixture; } });
Object.defineProperty(exports, "deleteFixture", { enumerable: true, get: function () { return manageFixture_1.deleteFixture; } });
var seedMatches_1 = require("./matches/seedMatches");
Object.defineProperty(exports, "seedDatabase", { enumerable: true, get: function () { return seedMatches_1.seedDatabase; } });
// ─── Team Management ──────────────────────────────────────────────
var manageTeam_1 = require("./teams/manageTeam");
Object.defineProperty(exports, "eliminateTeam", { enumerable: true, get: function () { return manageTeam_1.eliminateTeam; } });
Object.defineProperty(exports, "restoreTeam", { enumerable: true, get: function () { return manageTeam_1.restoreTeam; } });
// ─── Awards ────────────────────────────────────────────────────────
var resolveAwards_1 = require("./awards/resolveAwards");
Object.defineProperty(exports, "resolveAwardsPoints", { enumerable: true, get: function () { return resolveAwards_1.resolveAwardsPoints; } });
// ─── Player Management ────────────────────────────────────────────
var managePlayer_1 = require("./players/managePlayer");
Object.defineProperty(exports, "savePlayer", { enumerable: true, get: function () { return managePlayer_1.savePlayer; } });
Object.defineProperty(exports, "deletePlayer", { enumerable: true, get: function () { return managePlayer_1.deletePlayer; } });
Object.defineProperty(exports, "clearPlayerImages", { enumerable: true, get: function () { return managePlayer_1.clearPlayerImages; } });
// ─── Dream Team ────────────────────────────────────────────────────
var manageDreamTeam_1 = require("./dreamteam/manageDreamTeam");
Object.defineProperty(exports, "saveDreamTeamSettings", { enumerable: true, get: function () { return manageDreamTeam_1.saveDreamTeamSettings; } });
Object.defineProperty(exports, "publishDreamTeamRankings", { enumerable: true, get: function () { return manageDreamTeam_1.publishDreamTeamRankings; } });
//# sourceMappingURL=index.js.map