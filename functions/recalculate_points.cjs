const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

const KNOCKOUT_STAGES = [
  "Round of 32", "Round of 16", "Quarter-finals",
  "Semi-finals", "Play-off for third place", "Final",
];

async function recalculateAllPoints() {
  try {
    const configPath = 'C:/Users/vtckt/.config/configstore/firebase-tools.json';
    if (!fs.existsSync(configPath)) {
      console.error('❌ Firebase CLI config file not found. Please log in using "firebase login" first.');
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tokenInfo = config.tokens;

    const client = new OAuth2Client({
      clientId: config.user.azp,
    });
    client.setCredentials({
      refresh_token: tokenInfo.refresh_token,
      access_token: tokenInfo.access_token,
    });

    const db = new Firestore({
      projectId: 'fifa-69f1e',
      authClient: client
    });

    // 1. Fetch all matches
    console.log("📊 Fetching all matches...");
    const matchesSnap = await db.collection("matches").get();
    const matches = {};
    matchesSnap.forEach((docSnap) => {
      matches[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });
    const confirmedMatches = Object.values(matches).filter(m => m.confirmed);
    console.log(`   Found ${matchesSnap.size} matches (${confirmedMatches.length} confirmed)`);

    // 2. Fetch all predictions
    console.log("📊 Fetching all predictions...");
    const predsSnap = await db.collection("predictions").get();
    const predictions = [];
    predsSnap.forEach((docSnap) => {
      predictions.push({ id: docSnap.id, ...docSnap.data() });
    });
    console.log(`   Found ${predsSnap.size} predictions`);

    // 3. Fetch all users
    console.log("📊 Fetching all users...");
    const usersSnap = await db.collection("users").get();
    const users = {};
    usersSnap.forEach((docSnap) => {
      users[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });
    console.log(`   Found ${usersSnap.size} users`);

    // 4. Initialize user stats
    const userStats = {};
    Object.keys(users).forEach((uid) => {
      userStats[uid] = { predictionsPoints: 0, predictionsCount: 0 };
    });

    // 5. Process all predictions
    console.log("\n🧮 Calculating prediction points...");
    const BATCH_SIZE = 450;
    let batchOps = [];

    for (const pred of predictions) {
      const userId = pred.userId;
      const matchId = pred.matchId;
      if (!userId || !matchId) continue;

      if (!userStats[userId]) {
        userStats[userId] = { predictionsPoints: 0, predictionsCount: 0 };
      }

      const match = matches[matchId];
      if (!match || !match.confirmed) {
        batchOps.push({
          ref: db.collection("predictions").doc(pred.id),
          data: { pointsEarned: 0, pointsBreakdown: { result: 0, exactScore: 0, motm: 0, penalty: 0 } }
        });
        continue;
      }

      const homeActual = parseInt(String(match.confirmedResult?.homeGoals));
      const awayActual = parseInt(String(match.confirmedResult?.awayGoals));
      const actualOutcome = homeActual > awayActual ? "HOME_WIN" : homeActual < awayActual ? "AWAY_WIN" : "DRAW";

      const predHome = parseInt(String(pred.homeGoals));
      const predAway = parseInt(String(pred.awayGoals));
      const hasPrediction = !isNaN(predHome) && !isNaN(predAway);

      let exactScorePoints = 0;
      let resultPoints = 0;
      let motmPoints = 0;
      let penaltyPoints = 0;

      if (hasPrediction) {
        const predOutcome = predHome > predAway ? "HOME_WIN" : predHome < predAway ? "AWAY_WIN" : "DRAW";
        const isKnockout = match.stage && KNOCKOUT_STAGES.includes(match.stage);

        let actualPenaltyWinner = null;
        if (isKnockout && homeActual === awayActual && match.confirmedPenaltyScore) {
          const penHome = parseInt(String(match.confirmedPenaltyScore.home));
          const penAway = parseInt(String(match.confirmedPenaltyScore.away));
          if (!isNaN(penHome) && !isNaN(penAway)) {
            actualPenaltyWinner = penHome > penAway ? "home" : "away";
          }
        }

        if (predHome === homeActual && predAway === awayActual) {
          exactScorePoints = 5;
        } else if (predOutcome === actualOutcome) {
          resultPoints = 2;
        }

        if (pred.manOfTheMatch && match.confirmedMOTM &&
            pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()) {
          motmPoints = 3;
        }

        if (isKnockout && homeActual === awayActual && actualPenaltyWinner) {
          if (pred.predictedPenaltyWinner === actualPenaltyWinner) {
            penaltyPoints = 2;
          }
        }
      }

      const total = exactScorePoints + resultPoints + motmPoints + penaltyPoints;
      const pointsBreakdown = { result: resultPoints, exactScore: exactScorePoints, motm: motmPoints, penalty: penaltyPoints };

      batchOps.push({
        ref: db.collection("predictions").doc(pred.id),
        data: { pointsEarned: total, pointsBreakdown }
      });

      if (hasPrediction) {
        userStats[userId].predictionsPoints += total;
        userStats[userId].predictionsCount += 1;
      }
    }

    // Commit prediction updates in batches
    console.log(`   Committing ${batchOps.length} prediction updates...`);
    for (let i = 0; i < batchOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = batchOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }
    console.log("   ✅ Predictions updated");

    // 6. Fetch official rankings for dynamic recalculation of dream teams
    console.log("\n🏆 Fetching official dream team rankings...");
    const r1Snap = await db.collection("system").doc("dream_team_rankings_phase1").get();
    const r2Snap = await db.collection("system").doc("dream_team_rankings_phase2").get();
    const rankings1 = r1Snap.exists ? (r1Snap.data().rankings || {}) : {};
    const rankings2 = r2Snap.exists ? (r2Snap.data().rankings || {}) : {};

    const calculateDreamTeamPointsRecalc = (dtPlayers, rks) => {
      let dtTotal = 0;
      const dtBreakdown = { GK: 0, DF: 0, MF: 0, FW: 0 };
      const dtPlayerPoints = [];
      dtPlayers.forEach((player) => {
        const pos = player.position || "FW";
        const name = player.name || "";
        const pPrice = player.price || 5.0;
        const list = rks[pos] || [];
        const rankIndex = list.findIndex(
          (rankedName) => rankedName && rankedName.trim().toLowerCase() === name.trim().toLowerCase()
        );
        let basePts = 0;
        if (rankIndex !== -1) basePts = 10 - rankIndex;
        const isStarting = player.isStarting !== false;
        const isCaptain = player.isCaptain === true;
        const earnedPts = isCaptain ? basePts * 2 : basePts;
        dtTotal += earnedPts;
        if (dtBreakdown[pos] !== undefined) dtBreakdown[pos] += earnedPts;
        dtPlayerPoints.push({
          name, position: pos, team: player.team, price: pPrice,
          isStarting, isCaptain, points: earnedPts, basePoints: basePts,
          rank: rankIndex !== -1 ? rankIndex + 1 : null,
        });
      });
      return { total: dtTotal, breakdown: dtBreakdown, playerPoints: dtPlayerPoints };
    };

    // Fetch all dream teams
    console.log("📊 Fetching and dynamically recalculating all dream teams...");
    const dtSnapshot = await db.collection("dream_teams").get();
    const dreamTeamsMap = {};
    const dtBatchOps = [];

    dtSnapshot.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();
      
      let dtUserId = docId;
      let phase = 1;
      if (docId.endsWith("_phase1")) {
        dtUserId = docId.replace("_phase1", "");
        phase = 1;
      } else if (docId.endsWith("_phase2")) {
        dtUserId = docId.replace("_phase2", "");
        phase = 2;
      }
      
      const rks = phase === 1 ? rankings1 : rankings2;
      const { total, breakdown, playerPoints } = calculateDreamTeamPointsRecalc(data.players || [], rks);

      dtBatchOps.push({
        ref: docSnap.ref,
        data: {
          pointsEarned: total,
          pointsBreakdown: breakdown,
          playerPointsBreakdown: playerPoints,
          pointsAwardedAt: new Date().toISOString(),
        }
      });

      if (!dreamTeamsMap[dtUserId]) {
        dreamTeamsMap[dtUserId] = { phase1: 0, phase2: 0 };
      }
      
      if (phase === 1) {
        dreamTeamsMap[dtUserId].phase1 = total;
      } else if (phase === 2) {
        dreamTeamsMap[dtUserId].phase2 = total;
      }
    });

    // Commit dream team updates in batches
    for (let i = 0; i < dtBatchOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = dtBatchOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }
    console.log("   ✅ Dream teams updated and cached");

    // 7. Fetch awards points
    console.log("🎖️  Fetching awards points...");
    const officialAwardsSnap = await db.collection("system").doc("official_awards").get();
    const officialAwards = officialAwardsSnap.exists ? officialAwardsSnap.data() : null;
    const awardsPointsMap = {};

    if (officialAwards && officialAwards.resolved) {
      const awardsSnap = await db.collection("awards_predictions").get();
      awardsSnap.forEach((docSnap) => {
        const awUserId = docSnap.id;
        const pred = docSnap.data();
        let earned = 0;
        if (pred.pott && officialAwards.pott && pred.pott.trim().toLowerCase() === officialAwards.pott.trim().toLowerCase()) earned += 3;
        if (pred.goldenBoot && officialAwards.goldenBoot && pred.goldenBoot.trim().toLowerCase() === officialAwards.goldenBoot.trim().toLowerCase()) earned += 3;
        if (pred.goldenGlove && officialAwards.goldenGlove && pred.goldenGlove.trim().toLowerCase() === officialAwards.goldenGlove.trim().toLowerCase()) earned += 3;
        awardsPointsMap[awUserId] = earned;
      });
      console.log(`   Awards resolved. Processed ${Object.keys(awardsPointsMap).length} award predictions`);
    } else {
      console.log("   Awards not yet resolved");
    }

    // 8. Update all user totals
    console.log("\n📝 Updating user totals with bonusPoints adjustments...");
    let usersUpdated = 0;
    let pointsRestored = 0;
    const userOps = [];

    for (const uid of Object.keys(userStats)) {
      const userDoc = users[uid];
      if (!userDoc) continue;

      const stats = userStats[uid];
      const dtPoints = dreamTeamsMap[uid] || { phase1: 0, phase2: 0 };
      const awardsPoints = awardsPointsMap[uid] || 0;
      const bonusPoints = userDoc.bonusPoints || 0;

      const newTotalPoints = stats.predictionsPoints + awardsPoints + dtPoints.phase1 + dtPoints.phase2 + bonusPoints;
      const oldTotalPoints = userDoc.totalPoints || 0;
      const diff = newTotalPoints - oldTotalPoints;

      if (diff !== 0) {
        console.log(`   👤 ${userDoc.name || uid}: ${oldTotalPoints} → ${newTotalPoints} (${diff > 0 ? '+' : ''}${diff})`);
        if (diff > 0) pointsRestored += diff;
      }

      userOps.push({
        ref: db.collection("users").doc(uid),
        data: {
          totalPoints: newTotalPoints,
          predictionsCount: stats.predictionsCount,
          dreamTeamPoints: dtPoints.phase1,
          dreamTeamPointsPhase1: dtPoints.phase1,
          dreamTeamPointsPhase2: dtPoints.phase2,
          awardsPoints: awardsPoints
        }
      });
      usersUpdated++;
    }

    // Commit user updates in batches
    for (let i = 0; i < userOps.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = userOps.slice(i, i + BATCH_SIZE);
      for (const op of chunk) {
        batch.update(op.ref, op.data);
      }
      await batch.commit();
    }

    console.log(`\n✅ DONE! Recalculated points for ${usersUpdated} users.`);
    if (pointsRestored > 0) {
      console.log(`🎉 Restored ${pointsRestored} total points that were manually adjusted!`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

recalculateAllPoints();
