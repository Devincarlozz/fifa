# ⚙️ WC26 Predictor — Backend Architecture & Configuration Guide

This document outlines the complete backend architecture, database schemas, security rules, and cloud function specifications required to support the WC26 Predictor.

---

## 1. Architecture Overview

The system uses a **Serverless Architecture** built on top of **Google Firebase**:

```
[React SPA Client] ---> Auth Requests ---> [Firebase Authentication]
  |
  +---> reads / writes ---> [Cloud Firestore]
  |                            |
  |                        onWrite triggers
  |                            |
  |                            v
  +---> triggers ---------> [Cloud Functions] (Points Engine)
```

---

## 2. Firestore Database Schemas

### A. `users` Collection
*Document ID:* `uid` (matching Firebase Auth UID)

```json
{
  "uid": "user_auth_uid_12345",
  "name": "Predictor FC",
  "email": "predictor.fc@rit.ac.in",
  "photoURL": "https://lh3.googleusercontent.com/a/avatar_url",
  "totalPoints": 2450,
  "predictionsCount": 12,
  "isActive": true,
  "isAdmin": false,
  "createdAt": "Timestamp",
  "lastLoginAt": "Timestamp"
}
```

### B. `matches` Collection
*Document ID:* `matchId` (e.g., `wc2026_gp_001`)

```json
{
  "matchId": "wc2026_gp_001",
  "homeTeam": {
    "name": "Brazil",
    "code": "BRA",
    "flag": "🇧🇷"
  },
  "awayTeam": {
    "name": "Argentina",
    "code": "ARG",
    "flag": "🇦🇷"
  },
  "kickoffTime": "Timestamp",
  "stage": "GROUP_STAGE",
  "venue": "MetLife Stadium",
  "status": "LIVE", // SCHEDULED | LIVE | FINISHED | POSTPONED
  "liveScore": {
    "home": 2,
    "away": 1
  },
  "minute": "78",
  "goalscorers": [
    { "player": "Vinícius Júnior", "team": "BRA", "minute": "27" },
    { "player": "L. Messi", "team": "ARG", "minute": "45" },
    { "player": "Richarlison", "team": "BRA", "minute": "64" }
  ],
  "cards": [
    { "player": "De Paul", "team": "ARG", "type": "YELLOW", "minute": 34 }
  ],
  "bonusQuestion": "Will there be a red card in the match?",
  "confirmed": false,
  "confirmedResult": null,
  "confirmedMOTM": null,
  "confirmedBonusAnswer": null,
  "confirmedAt": null,
  "confirmedBy": null
}
```

### C. `predictions` Collection
*Document ID:* `{uid}_{matchId}` (Enforces exactly 1 prediction per user per match)

```json
{
  "userId": "user_auth_uid_12345",
  "matchId": "wc2026_gp_001",
  "homeGoals": 2,
  "awayGoals": 1,
  "manOfTheMatch": "Vinícius Júnior",
  "bonusAnswer": "No",
  "submittedAt": "Timestamp",
  "pointsEarned": 120, // null before points evaluation
  "pointsBreakdown": {
    "exactScore": 50, // 50 pts for exact score
    "result": 20,      // 20 pts for outcome (W/D/L)
    "motm": 30,        // 30 pts for MOTM
    "bonus": 20        // 20 pts for bonus question
  },
  "pointsAwardedAt": "Timestamp"
}
```

### D. `dream_teams` Collection
*Document ID:* `uid` (matching Firebase Auth UID)

```json
{
  "userId": "user_auth_uid_12345",
  "userName": "Predictor FC",
  "userEmail": "predictor.fc@rit.ac.in",
  "players": [
    {
      "slot": "GK1",
      "name": "E. MARTINEZ",
      "team": "Argentina",
      "position": "GK",
      "price": 6.0,
      "isStarting": true,
      "isCaptain": true
    },
    {
      "slot": "GK2",
      "name": "MASTIL",
      "team": "Algeria",
      "position": "GK",
      "price": 4.5,
      "isStarting": false,
      "isCaptain": false
    }
  ],
  "budgetRemaining": 89.5,
  "updatedAt": "ISO Timestamp String",
  "pointsEarned": 18,
  "pointsBreakdown": {
    "GK": 8,
    "DF": 5,
    "MF": 3,
    "FW": 2
  },
  "playerPointsBreakdown": [
    {
      "name": "E. MARTINEZ",
      "position": "GK",
      "team": "Argentina",
      "points": 8,
      "rank": 3
    }
  ],
  "pointsAwardedAt": "ISO Timestamp String"
}
```

---


## 3. Points Engine Rules

Points are processed only when an administrator confirms a match result. Points are calculated as follows:

| Criteria | Condition | Points Awarded |
|---|---|---|
| **Exact Score** | Predicted score matches actual score (e.g., predicted 2-1, actual 2-1) | **+50 Points** |
| **Correct Result** | Predicted winner or draw matches actual outcome, but score is not exact | **+20 Points** |
| **Correct MOTM** | Predicted Man of the Match matches confirmed official MOTM | **+30 Points** |
| **Bonus Question** | Predicted answer matches confirmed bonus answer | **+20 Points** |

---

## 4. Firebase Cloud Functions

### Function: `onMatchConfirmed` (Firestore Trigger)
Triggered whenever a match document is updated with `confirmed: true`.

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onMatchConfirmed = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const matchId = context.params.matchId;

    // Check if transition went from unconfirmed to confirmed
    if (newData.confirmed === true && oldData.confirmed !== true) {
      const db = admin.firestore();
      
      // Fetch all predictions for this match
      const predsSnap = await db.collection('predictions')
        .where('matchId', '==', matchId)
        .get();

      if (predsSnap.empty) return null;

      const batch = db.batch();
      const userPointsUpdates = {};

      predsSnap.forEach((doc) => {
        const pred = doc.data();
        const userId = pred.userId;
        
        let scorePoints = 0;
        let resultPoints = 0;
        let motmPoints = 0;
        let bonusPoints = 0;

        // 1. Check Exact Score
        const exactMatch = 
          pred.homeGoals === newData.confirmedResult.homeGoals &&
          pred.awayGoals === newData.confirmedResult.awayGoals;

        if (exactMatch) {
          scorePoints = 50;
        } else {
          // 2. Check Match Outcome
          const actualOutcome = Math.sign(newData.confirmedResult.homeGoals - newData.confirmedResult.awayGoals);
          const predictedOutcome = Math.sign(pred.homeGoals - pred.awayGoals);
          
          if (actualOutcome === predictedOutcome) {
            resultPoints = 20;
          }
        }

        // 3. Check Man of the Match
        if (pred.manOfTheMatch && newData.confirmedMOTM && 
            pred.manOfTheMatch.toLowerCase().trim() === newData.confirmedMOTM.toLowerCase().trim()) {
          motmPoints = 30;
        }

        // 4. Check Bonus Answer
        if (pred.bonusAnswer && newData.confirmedBonusAnswer && 
            pred.bonusAnswer.toLowerCase().trim() === newData.confirmedBonusAnswer.toLowerCase().trim()) {
          bonusPoints = 20;
        }

        const totalEarned = scorePoints + resultPoints + motmPoints + bonusPoints;

        // Update prediction document with points breakdown
        const predRef = db.collection('predictions').doc(doc.id);
        batch.update(predRef, {
          pointsEarned: totalEarned,
          pointsBreakdown: {
            exactScore: scorePoints,
            result: resultPoints,
            motm: motmPoints,
            bonus: bonusPoints
          },
          pointsAwardedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Accumulate user points changes
        if (!userPointsUpdates[userId]) {
          userPointsUpdates[userId] = { points: 0, count: 0 };
        }
        userPointsUpdates[userId].points += totalEarned;
        userPointsUpdates[userId].count += 1;
      });

      // Update total points and counts on users documents
      for (const [userId, update] of Object.entries(userPointsUpdates)) {
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, {
          totalPoints: admin.firestore.FieldValue.increment(update.points),
          predictionsCount: admin.firestore.FieldValue.increment(update.count)
        });
      }

      await batch.commit();
      console.log(`Points awarded successfully for match ${matchId}.`);
    }
    return null;
  });
```

---

## 5. Firestore Security Rules

Deploy the following configurations to `firestore.rules` to enforce data protection and match lockout times:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isRITAccount() {
      return isAuthenticated() && request.auth.token.email.endsWith('@rit.ac.in');
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.admin == true || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Matches Collection
    match /matches/{matchId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      // Users can update their own metadata, Admins can write all profiles
      allow write: if isOwner(userId) || isAdmin();
    }

    // Predictions Collection
    match /predictions/{predId} {
      allow read: if isAuthenticated();
      
      // Users can write predictions under strict conditions:
      allow create: if isRITAccount()
        && isOwner(request.resource.data.userId)
        && request.time < get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.kickoffTime
        && !request.resource.data.keys().hasAny(['pointsEarned', 'pointsBreakdown', 'pointsAwardedAt']);

      allow update: if isRITAccount()
        && isOwner(request.resource.data.userId)
        && resource.data.userId == request.auth.uid
        && request.time < get(/databases/$(database)/documents/matches/$(request.resource.data.matchId)).data.kickoffTime
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['pointsEarned', 'pointsBreakdown', 'pointsAwardedAt']);
      
      allow delete: if isAdmin() || (
        isOwner(resource.data.userId) &&
        request.time < get(/databases/$(database)/documents/matches/$(resource.data.matchId)).data.kickoffTime
      );
    }
  }
}
```

---

## 6. Firebase Authentication Configuration

### Domain White-list (Blocking Functions)
To restrict authentication to only `@rit.ac.in` domain emails directly at the Identity Provider level, deploy a **Before Sign In** Cloud Function trigger:

```javascript
const functions = require('firebase-functions');

exports.beforeSignIn = functions.auth.user().beforeCreate((user, context) => {
  const email = user.email;
  if (!email || !email.endsWith('@rit.ac.in')) {
    throw new functions.auth.HttpsError(
      'invalid-argument', 
      'Access restricted. Only @rit.ac.in students are allowed to sign up.'
    );
  }
});
```

---

## 7. Database Indexes

Create the following single-field and composite indexes in the Firebase Console:

| Collection | Fields | Order | Query Usage |
|---|---|---|---|
| `users` | `totalPoints` (desc), `predictionsCount` (desc) | Composite | Standings Leaderboard |
| `matches` | `status` (asc), `kickoffTime` (asc) | Composite | Dashboard Live vs Upcoming fixtures |
| `predictions` | `userId` (asc), `submittedAt` (desc) | Composite | Prediction Logs List |
