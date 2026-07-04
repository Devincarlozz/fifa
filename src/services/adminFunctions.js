// src/services/adminFunctions.js
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";

// Helper maps
const countryFlags = {
  'Algeria': '🇩🇿', 'Argentina': '🇦🇷', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
  'Bosnia And Herzegovina': '🇧🇦', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Cape Verde': '🇨🇻',
  'Colombia': '🇨🇴', 'Congo DR': '🇨🇩', 'Croatia': '🇭🇷', 'Curacao': '🇨🇼', 'Czech Republic': '🇨🇿',
  'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Ghana': '🇬🇭', 'Haiti': '🇭🇹', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ivory Coast': '🇨🇮',
  'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'South Korea': '🇰🇷', 'Mexico': '🇲🇽', 'Morocco': '🇲🇦',
  'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Norway': '🇳🇴', 'Panama': '🇵🇦', 'Paraguay': '🇵🇾',
  'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Senegal': '🇸🇳',
  'South Africa': '🇿🇦', 'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Tunisia': '🇹🇳',
  'Turkey': '🇹🇷', 'USA': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿'
};

const countryCodes = {
  'Algeria': 'ALG', 'Argentina': 'ARG', 'Australia': 'AUS', 'Austria': 'AUT', 'Belgium': 'BEL',
  'Bosnia And Herzegovina': 'BIH', 'Brazil': 'BRA', 'Canada': 'CAN', 'Cape Verde': 'CPV',
  'Colombia': 'COL', 'Congo DR': 'COD', 'Croatia': 'CRO', 'Curacao': 'CUW', 'Czech Republic': 'CZE',
  'Ecuador': 'ECU', 'Egypt': 'EGY', 'England': 'ENG', 'France': 'FRA', 'Germany': 'GER',
  'Ghana': 'GHA', 'Haiti': 'HAI', 'Iran': 'IRN', 'Iraq': 'IRQ', 'Ivory Coast': 'CIV',
  'Japan': 'JPN', 'Jordan': 'JOR', 'South Korea': 'KOR', 'Mexico': 'MEX', 'Morocco': 'MAR',
  'Netherlands': 'NED', 'New Zealand': 'NZL', 'Norway': 'NOR', 'Panama': 'PAN', 'Paraguay': 'PAR',
  'Portugal': 'POR', 'Qatar': 'QAT', 'Saudi Arabia': 'KSA', 'Scotland': 'SCO', 'Senegal': 'SEN',
  'South Africa': 'RSA', 'Spain': 'ESP', 'Sweden': 'SWE', 'Switzerland': 'SUI', 'Tunisia': 'TUN',
  'Turkey': 'TUR', 'USA': 'USA', 'Uruguay': 'URU', 'Uzbekistan': 'UZB'
};

const twoLetterCodes = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at', 'Belgium': 'be',
  'Bosnia And Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca', 'Cape Verde': 'cv',
  'Colombia': 'co', 'Congo DR': 'cd', 'Croatia': 'hr', 'Curacao': 'cw', 'Czech Republic': 'cz',
  'Ecuador': 'ec', 'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
  'Ghana': 'gh', 'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Ivory Coast': 'ci',
  'Japan': 'jp', 'Jordan': 'jo', 'South Korea': 'kr', 'Mexico': 'mx', 'Morocco': 'ma',
  'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa', 'Paraguay': 'py',
  'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Scotland': 'gb-sct', 'Senegal': 'sn',
  'South Africa': 'za', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch', 'Tunisia': 'tn',
  'Turkey': 'tr', 'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz'
};

/**
 * Ensures the logged-in user has a valid profile document in Firestore.
 */
export const callEnsureUserProfile = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in.");
  
  const userRef = doc(db, 'users', currentUser.uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.isActive === undefined) {
      await updateDoc(userRef, { isActive: true });
    }
    return { success: true, created: false };
  }
  
  const email = currentUser.email || "";
  const name = currentUser.displayName || email.split("@")[0] || "Anonymous";
  const photoURL = currentUser.photoURL || "";
  
  await setDoc(userRef, {
    uid: currentUser.uid,
    name,
    email,
    photoURL,
    totalPoints: 0,
    predictionsCount: 0,
    isActive: true,
    isAdmin: false,
    createdAt: serverTimestamp()
  });
  
  return { success: true, created: true };
};

/**
 * Promotes or demotes a user to/from administrator role.
 */
export const callSetAdminRole = async (targetUid, isAdminVal) => {
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, { 
    isAdmin: isAdminVal, 
    role: isAdminVal ? 'admin' : 'user' 
  });
  return { success: true, message: `User ${targetUid} admin status set to ${isAdminVal}.` };
};

/**
 * Confirms a match result, registers the outcome, and distributes prediction points.
 */
export const callConfirmMatchResult = async (matchId, finalScore, penaltyScore, manOfTheMatch) => {
  const homeActual = parseInt(String(finalScore.home));
  const awayActual = parseInt(String(finalScore.away));
  
  const matchRef = doc(db, "matches", matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error(`Match ${matchId} not found.`);
  
  const match = matchSnap.data();
  if (match.confirmed) throw new Error("This match has already been confirmed.");
  
  const isKnockout = match.stage && [
    "Round of 32",
    "Round of 16",
    "Quarter-finals",
    "Semi-finals",
    "Play-off for third place",
    "Final",
  ].includes(match.stage);
  
  const isDraw = homeActual === awayActual;
  const actualOutcome = homeActual > awayActual ? "HOME_WIN" : homeActual < awayActual ? "AWAY_WIN" : "DRAW";
  
  let actualPenaltyWinner = null;
  if (isKnockout && isDraw) {
    if (!penaltyScore || penaltyScore.home === undefined || penaltyScore.away === undefined) {
      throw new Error("Penalty scores required for knockout draws.");
    }
    const penHome = parseInt(String(penaltyScore.home));
    const penAway = parseInt(String(penaltyScore.away));
    if (penHome === penAway) {
      throw new Error("Penalty shootout cannot end in a draw.");
    }
    actualPenaltyWinner = penHome > penAway ? "home" : "away";
  }
  
  const q = query(collection(db, "predictions"), where("matchId", "==", matchId));
  const predsSnap = await getDocs(q);
  
  const batch = writeBatch(db);
  const userPointsMap = {};
  
  predsSnap.forEach((predDoc) => {
    const pred = predDoc.data();
    const userId = pred.userId;
    if (!userId) return;
    
    const predHome = parseInt(String(pred.homeGoals));
    const predAway = parseInt(String(pred.awayGoals));
    const hasPrediction = !isNaN(predHome) && !isNaN(predAway);
    
    let exactScorePoints = 0;
    let resultPoints = 0;
    let motmPoints = 0;
    let penaltyPoints = 0;
    
    if (hasPrediction) {
      const predOutcome = predHome > predAway ? "HOME_WIN" : predHome < predAway ? "AWAY_WIN" : "DRAW";
      
      if (predHome === homeActual && predAway === awayActual) {
        exactScorePoints = 5;
      } else if (predOutcome === actualOutcome) {
        resultPoints = 2;
      }
      
      if (
        pred.manOfTheMatch &&
        manOfTheMatch &&
        pred.manOfTheMatch.trim().toLowerCase() === manOfTheMatch.trim().toLowerCase()
      ) {
        motmPoints = 3;
      }
      
      if (isKnockout && isDraw && actualPenaltyWinner) {
        if (pred.predictedPenaltyWinner === actualPenaltyWinner) {
          penaltyPoints = 2;
        }
      }
    }
    
    const total = exactScorePoints + resultPoints + motmPoints + penaltyPoints;
    const pointsBreakdown = {
      result: resultPoints,
      exactScore: exactScorePoints,
      motm: motmPoints,
      penalty: penaltyPoints,
    };
    
    batch.update(predDoc.ref, {
      pointsEarned: total,
      pointsBreakdown,
      pointsAwardedAt: new Date().toISOString(),
    });
    
    if (hasPrediction) {
      if (!userPointsMap[userId]) userPointsMap[userId] = 0;
      userPointsMap[userId] += total;
    }
  });
  
  for (const [userId, points] of Object.entries(userPointsMap)) {
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
      totalPoints: increment(points),
      predictionsCount: increment(1),
    });
  }
  
  const currentUser = auth.currentUser;
  const matchUpdate = {
    status: "CONFIRMED",
    confirmed: true,
    confirmedResult: { homeGoals: homeActual, awayGoals: awayActual },
    confirmedMOTM: manOfTheMatch.trim(),
    confirmedBy: currentUser?.email || "admin",
    confirmedAt: new Date().toISOString(),
  };
  
  if (penaltyScore) {
    matchUpdate.confirmedPenaltyScore = penaltyScore;
  }
  
  batch.update(matchRef, matchUpdate);
  
  await batch.commit();
  
  return {
    success: true,
    message: `Results confirmed. Points distributed to ${Object.keys(userPointsMap).length} users.`,
    predictionsProcessed: predsSnap.size,
  };
};

/**
 * Triggers a full points recalculation for all users based on match history.
 */
export const callRecalculateAllPoints = async () => {
  const KNOCKOUT_STAGES = [
    "Round of 32",
    "Round of 16",
    "Quarter-finals",
    "Semi-finals",
    "Play-off for third place",
    "Final",
  ];
  
  const matchesSnap = await getDocs(collection(db, "matches"));
  const matches = {};
  matchesSnap.forEach((docSnap) => {
    matches[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
  });
  
  const predsSnap = await getDocs(collection(db, "predictions"));
  const predictions = [];
  predsSnap.forEach((docSnap) => {
    predictions.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  const usersSnap = await getDocs(collection(db, "users"));
  const users = {};
  usersSnap.forEach((docSnap) => {
    users[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
  });

  // Fetch official rankings for dynamic recalculation
  const r1Snap = await getDoc(doc(db, "system", "dream_team_rankings_phase1"));
  const r2Snap = await getDoc(doc(db, "system", "dream_team_rankings_phase2"));
  const rankings1 = r1Snap.exists() ? (r1Snap.data().rankings || {}) : {};
  const rankings2 = r2Snap.exists() ? (r2Snap.data().rankings || {}) : {};

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
  const dtSnapshot = await getDocs(collection(db, "dream_teams"));
  const dreamTeamsMap = {};
  const dtBatch = writeBatch(db);
  let dtBatchCount = 0;

  for (const docSnap of dtSnapshot.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();
    
    let userId = docId;
    let phase = 1;
    if (docId.endsWith("_phase1")) {
      userId = docId.replace("_phase1", "");
      phase = 1;
    } else if (docId.endsWith("_phase2")) {
      userId = docId.replace("_phase2", "");
      phase = 2;
    }
    
    const rks = phase === 1 ? rankings1 : rankings2;
    const { total, breakdown, playerPoints } = calculateDreamTeamPointsRecalc(data.players || [], rks);

    // Cache computed points back to the dream team document
    dtBatch.update(docSnap.ref, {
      pointsEarned: total,
      pointsBreakdown: breakdown,
      playerPointsBreakdown: playerPoints,
      pointsAwardedAt: new Date().toISOString(),
    });
    dtBatchCount++;
    if (dtBatchCount >= BATCH_SIZE) {
      await dtBatch.commit();
      dtBatchCount = 0;
    }

    if (!dreamTeamsMap[userId]) {
      dreamTeamsMap[userId] = { phase1: 0, phase2: 0 };
    }
    
    if (phase === 1) {
      dreamTeamsMap[userId].phase1 = total;
    } else if (phase === 2) {
      dreamTeamsMap[userId].phase2 = total;
    }
  }

  if (dtBatchCount > 0) {
    await dtBatch.commit();
  }

  // Fetch official awards and user awards predictions
  const officialAwardsSnap = await getDoc(doc(db, "system", "official_awards"));
  const officialAwards = officialAwardsSnap.exists() ? officialAwardsSnap.data() : null;
  const awardsPointsMap = {};
  
  if (officialAwards && officialAwards.resolved) {
    const pott = officialAwards.pott || "";
    const goldenBoot = officialAwards.goldenBoot || "";
    const goldenGlove = officialAwards.goldenGlove || "";
    
    const awardsSnap = await getDocs(collection(db, "awards_predictions"));
    awardsSnap.forEach((docSnap) => {
      const userId = docSnap.id;
      const pred = docSnap.data();
      let earned = 0;
      if (pred.pott && pred.pott.trim().toLowerCase() === pott.trim().toLowerCase()) earned += 3;
      if (pred.goldenBoot && pred.goldenBoot.trim().toLowerCase() === goldenBoot.trim().toLowerCase()) earned += 3;
      if (pred.goldenGlove && pred.goldenGlove.trim().toLowerCase() === goldenGlove.trim().toLowerCase()) earned += 3;
      
      awardsPointsMap[userId] = earned;
    });
  }
  
  const userStats = {};
  Object.keys(users).forEach((uid) => {
    userStats[uid] = { predictionsPoints: 0, predictionsCount: 0 };
  });
  
  const BATCH_SIZE = 450;
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (const pred of predictions) {
    const userId = pred.userId;
    const matchId = pred.matchId;
    if (!userId || !matchId) continue;
    
    if (!userStats[userId]) {
      userStats[userId] = { predictionsPoints: 0, predictionsCount: 0 };
    }
    
    const match = matches[matchId];
    if (!match || !match.confirmed) {
      batch.update(doc(db, "predictions", pred.id), {
        pointsEarned: 0,
        pointsBreakdown: { result: 0, exactScore: 0, motm: 0, penalty: 0 }
      });
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
      continue;
    }
    
    const homeActual = parseInt(match.confirmedResult?.homeGoals);
    const awayActual = parseInt(match.confirmedResult?.awayGoals);
    const actualOutcome = homeActual > awayActual ? "HOME_WIN" : homeActual < awayActual ? "AWAY_WIN" : "DRAW";
    
    const predHome = parseInt(pred.homeGoals);
    const predAway = parseInt(pred.awayGoals);
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
        const penHome = parseInt(match.confirmedPenaltyScore.home);
        const penAway = parseInt(match.confirmedPenaltyScore.away);
        if (!isNaN(penHome) && !isNaN(penAway)) {
          actualPenaltyWinner = penHome > penAway ? "home" : "away";
        }
      }
      
      if (predHome === homeActual && predAway === awayActual) {
        exactScorePoints = 5;
      } else if (predOutcome === actualOutcome) {
        resultPoints = 2;
      }
      
      if (
        pred.manOfTheMatch &&
        match.confirmedMOTM &&
        pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()
      ) {
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
    
    batch.update(doc(db, "predictions", pred.id), {
      pointsEarned: total,
      pointsBreakdown
    });
    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
    
    if (hasPrediction) {
      userStats[userId].predictionsPoints += total;
      userStats[userId].predictionsCount += 1;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    batch = writeBatch(db);
    batchCount = 0;
  }
  
  for (const uid of Object.keys(userStats)) {
    const userDoc = users[uid];
    if (!userDoc) continue;
    
    const stats = userStats[uid];
    const dtPoints = dreamTeamsMap[uid] || { phase1: 0, phase2: 0 };
    const dtPointsPhase1 = dtPoints.phase1;
    const dtPointsPhase2 = dtPoints.phase2;
    const awardsPoints = awardsPointsMap[uid] || 0;
    
    const newTotalPoints = stats.predictionsPoints + awardsPoints + dtPointsPhase1 + dtPointsPhase2 + (userDoc.bonusPoints || 0);
    
    batch.update(doc(db, "users", uid), {
      totalPoints: newTotalPoints,
      predictionsCount: stats.predictionsCount,
      dreamTeamPoints: dtPointsPhase1,
      dreamTeamPointsPhase1: dtPointsPhase1,
      dreamTeamPointsPhase2: dtPointsPhase2,
      awardsPoints: awardsPoints
    });
    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  return {
    success: true,
    message: `Recalculated points successfully for ${Object.keys(userStats).length} users.`,
  };
};

/**
 * Creates a new match fixture.
 */
export const callCreateFixture = async (fixtureData) => {
  const { homeTeam, awayTeam, kickoff, venue, stage } = fixtureData;
  const matchId = `match_${Date.now()}`;
  const currentUser = auth.currentUser;
  
  const newFixture = {
    matchId,
    homeTeam: {
      name: homeTeam.name.trim(),
      code: homeTeam.code.trim().toUpperCase(),
      crest: homeTeam.crest?.trim() || null,
      flag: homeTeam.flag || "⚽",
    },
    awayTeam: {
      name: awayTeam.name.trim(),
      code: awayTeam.code.trim().toUpperCase(),
      crest: awayTeam.crest?.trim() || null,
      flag: awayTeam.flag || "⚽",
    },
    kickoffTime: new Date(kickoff).toISOString(),
    venue: venue?.trim() || "Tournament Stadium",
    stage: stage || "GROUP_STAGE",
    status: "SCHEDULED",
    liveScore: { home: 0, away: 0 },
    minute: null,
    goals: [],
    bookings: [],
    confirmed: false,
    confirmedResult: null,
    confirmedMOTM: null,
    createdBy: currentUser?.email || "admin",
    createdAt: new Date().toISOString(),
  };
  
  await setDoc(doc(db, "matches", matchId), newFixture);
  return { success: true, matchId, message: "Fixture created successfully." };
};

/**
 * Updates an existing match fixture.
 */
export const callUpdateFixture = async (matchId, updatedFields) => {
  const currentUser = auth.currentUser;
  
  if (updatedFields.kickoffTime && typeof updatedFields.kickoffTime === "string") {
    updatedFields.kickoffTime = new Date(updatedFields.kickoffTime).toISOString();
  }
  if (updatedFields.liveScore) {
    updatedFields.liveScore = {
      home: parseInt(String(updatedFields.liveScore.home)) || 0,
      away: parseInt(String(updatedFields.liveScore.away)) || 0,
    };
  }
  
  updatedFields.updatedBy = currentUser?.email || "admin";
  updatedFields.updatedAt = new Date().toISOString();
  
  await updateDoc(doc(db, "matches", matchId), updatedFields);
  return { success: true, message: "Fixture updated successfully." };
};

/**
 * Deletes a match fixture and its cascading predictions.
 */
export const callDeleteFixture = async (matchId) => {
  const predsQuery = query(collection(db, "predictions"), where("matchId", "==", matchId));
  const predsSnap = await getDocs(predsQuery);
  
  const batch = writeBatch(db);
  batch.delete(doc(db, "matches", matchId));
  predsSnap.forEach((predDoc) => {
    batch.delete(predDoc.ref);
  });
  
  await batch.commit();
  return { success: true, message: "Fixture deleted successfully." };
};

/**
 * Seeds initial match fixtures into the database.
 */
export const callSeedDatabase = async (force = false) => {
  const INITIAL_MATCHES = [
    {
      matchId: "wc2026_001",
      homeTeam: { name: "USA", flag: "🇺🇸", code: "USA", crest: "https://flagcdn.com/w160/us.png" },
      awayTeam: { name: "Mexico", flag: "🇲🇽", code: "MEX", crest: "https://flagcdn.com/w160/mx.png" },
      kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      stage: "GROUP_STAGE",
      venue: "MetLife Stadium",
      status: "SCHEDULED",
      liveScore: { home: 0, away: 0 },
      minute: 0,
      goalscorers: [],
      cards: [],
      confirmed: false,
      confirmedResult: null,
      confirmedMOTM: null,
    },
    {
      matchId: "wc2026_002",
      homeTeam: { name: "Brazil", flag: "🇧🇷", code: "BRA", crest: "https://flagcdn.com/w160/br.png" },
      awayTeam: { name: "Argentina", flag: "🇦🇷", code: "ARG", crest: "https://flagcdn.com/w160/ar.png" },
      kickoffTime: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      stage: "GROUP_STAGE",
      venue: "Rose Bowl",
      status: "LIVE",
      liveScore: { home: 2, away: 1 },
      minute: 75,
      goalscorers: [
        { player: "Vinicius Jr.", team: "BRA", minute: 23 },
        { player: "Rodrygo", team: "BRA", minute: 61 },
        { player: "Messi", team: "ARG", minute: 45 }
      ],
      cards: [
        { player: "De Paul", team: "ARG", type: "YELLOW", minute: 38 },
        { player: "Otamendi", team: "ARG", type: "YELLOW", minute: 70 }
      ],
      confirmed: false,
      confirmedResult: null,
      confirmedMOTM: null,
    },
    {
      matchId: "wc2026_003",
      homeTeam: { name: "France", flag: "🇫🇷", code: "FRA", crest: "https://flagcdn.com/w160/fr.png" },
      awayTeam: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG", crest: "https://flagcdn.com/w160/gb-eng.png" },
      kickoffTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      stage: "GROUP_STAGE",
      venue: "SoFi Stadium",
      status: "FINISHED",
      liveScore: { home: 1, away: 1 },
      minute: 90,
      goalscorers: [
        { player: "Mbappe", team: "FRA", minute: 12 },
        { player: "Kane", team: "ENG", minute: 88 }
      ],
      cards: [],
      confirmed: false,
      confirmedResult: null,
      confirmedMOTM: null,
    },
    {
      matchId: "wc2026_004",
      homeTeam: { name: "Germany", flag: "🇩🇪", code: "GER", crest: "https://flagcdn.com/w160/de.png" },
      awayTeam: { name: "Spain", flag: "🇪🇸", code: "ESP", crest: "https://flagcdn.com/w160/es.png" },
      kickoffTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      stage: "GROUP_STAGE",
      venue: "Mercedes-Benz Stadium",
      status: "FINISHED",
      liveScore: { home: 3, away: 2 },
      minute: 90,
      goalscorers: [
        { player: "Musiala", team: "GER", minute: 15 },
        { player: "Fullkrug", team: "GER", minute: 42 },
        { player: "Havertz", team: "GER", minute: 89 },
        { player: "Morata", team: "ESP", minute: 30 },
        { player: "Nico Williams", team: "ESP", minute: 75 }
      ],
      cards: [],
      confirmed: true,
      confirmedResult: { homeGoals: 3, awayGoals: 2 },
      confirmedMOTM: "Musiala",
    },
    {
      matchId: "wc2026_005",
      homeTeam: { name: "Portugal", flag: "🇵🇹", code: "POR", crest: "https://flagcdn.com/w160/pt.png" },
      awayTeam: { name: "Morocco", flag: "🇲🇦", code: "MAR", crest: "https://flagcdn.com/w160/ma.png" },
      kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      stage: "GROUP_STAGE",
      venue: "Hard Rock Stadium",
      status: "SCHEDULED",
      liveScore: { home: 0, away: 0 },
      minute: 0,
      goalscorers: [],
      cards: [],
      confirmed: false,
      confirmedResult: null,
      confirmedMOTM: null,
    }
  ];

  if (!force) {
    const matchesSnap = await getDocs(collection(db, "matches"));
    if (!matchesSnap.empty) {
      return { success: true, count: matchesSnap.size, alreadySeeded: true };
    }
  }

  const batch = writeBatch(db);
  for (const m of INITIAL_MATCHES) {
    batch.set(doc(db, "matches", m.matchId), m);
  }
  await batch.commit();

  return {
    success: true,
    count: INITIAL_MATCHES.length,
    alreadySeeded: false,
    message: `Successfully seeded ${INITIAL_MATCHES.length} matches.`,
  };
};

/**
 * Eliminates a team from the tournament, cascading custom players deletion.
 */
export const callEliminateTeam = async (teamName) => {
  const systemRef = doc(db, 'system', 'eliminated_teams');
  const systemSnap = await getDoc(systemRef);
  let teamsList = [];
  if (systemSnap.exists()) {
    teamsList = systemSnap.data().teams || [];
  }
  if (!teamsList.includes(teamName)) {
    teamsList.push(teamName);
    await setDoc(systemRef, { teams: teamsList }, { merge: true });
  }

  const playersQuery = query(collection(db, "custom_players"), where("country", "==", teamName));
  const playersSnap = await getDocs(playersQuery);
  const batch = writeBatch(db);
  playersSnap.forEach((playerDoc) => {
    batch.delete(playerDoc.ref);
  });
  await batch.commit();

  return { success: true, message: `Team ${teamName} eliminated.` };
};

/**
 * Restores an eliminated team.
 */
export const callRestoreTeam = async (teamName) => {
  const systemRef = doc(db, 'system', 'eliminated_teams');
  const systemSnap = await getDoc(systemRef);
  if (systemSnap.exists()) {
    let teamsList = systemSnap.data().teams || [];
    teamsList = teamsList.filter(t => t !== teamName);
    await setDoc(systemRef, { teams: teamsList }, { merge: true });
  }
  return { success: true, message: `Team ${teamName} restored.` };
};

/**
 * Resolves prediction points for tournament awards.
 */
export const callResolveAwardsPoints = async (pott, goldenBoot, goldenGlove) => {
  const systemRef = doc(db, 'system', 'official_awards');
  await setDoc(systemRef, {
    pott,
    goldenBoot,
    goldenGlove,
    resolved: true,
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

  // Fetch all predictions to recalculate prediction-based points per user
  const allPredsSnap = await getDocs(collection(db, "predictions"));
  const allMatchesSnap = await getDocs(collection(db, "matches"));
  const matchesMap = {};
  allMatchesSnap.forEach((mDoc) => { matchesMap[mDoc.id] = mDoc.data(); });
  const KNOCKOUT_STAGES_AWARDS = ["Round of 32","Round of 16","Quarter-finals","Semi-finals","Play-off for third place","Final"];

  // Sum prediction points per user
  const userPredPoints = {};
  allPredsSnap.forEach((predDoc) => {
    const pred = predDoc.data();
    const userId = pred.userId;
    const matchId = pred.matchId;
    if (!userId || !matchId) return;
    if (!userPredPoints[userId]) userPredPoints[userId] = 0;
    const match = matchesMap[matchId];
    if (!match || !match.confirmed) return;
    const hA = parseInt(match.confirmedResult?.homeGoals);
    const aA = parseInt(match.confirmedResult?.awayGoals);
    const actualOut = hA > aA ? "HOME_WIN" : hA < aA ? "AWAY_WIN" : "DRAW";
    const pH = parseInt(pred.homeGoals);
    const pA = parseInt(pred.awayGoals);
    if (isNaN(pH) || isNaN(pA)) return;
    const predOut = pH > pA ? "HOME_WIN" : pH < pA ? "AWAY_WIN" : "DRAW";
    let pts = 0;
    if (pH === hA && pA === aA) pts += 5;
    else if (predOut === actualOut) pts += 2;
    if (pred.manOfTheMatch && match.confirmedMOTM && pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()) pts += 3;
    const isKO = match.stage && KNOCKOUT_STAGES_AWARDS.includes(match.stage);
    if (isKO && hA === aA && match.confirmedPenaltyScore) {
      const penH = parseInt(match.confirmedPenaltyScore.home);
      const penA = parseInt(match.confirmedPenaltyScore.away);
      if (!isNaN(penH) && !isNaN(penA)) {
        const penWinner = penH > penA ? "home" : "away";
        if (pred.predictedPenaltyWinner === penWinner) pts += 2;
      }
    }
    userPredPoints[userId] += pts;
  });

  // Fetch dream team points
  const dtSnap = await getDocs(collection(db, "dream_teams"));
  const dtPointsMap = {};
  dtSnap.forEach((dtDoc) => {
    const dtId = dtDoc.id;
    const dtData = dtDoc.data();
    const dtPts = dtData.pointsEarned || 0;
    let uid = dtId;
    let phase = 1;
    if (dtId.endsWith("_phase1")) { uid = dtId.replace("_phase1", ""); phase = 1; }
    else if (dtId.endsWith("_phase2")) { uid = dtId.replace("_phase2", ""); phase = 2; }
    if (!dtPointsMap[uid]) dtPointsMap[uid] = { phase1: 0, phase2: 0 };
    if (phase === 1) dtPointsMap[uid].phase1 = dtPts;
    else dtPointsMap[uid].phase2 = dtPts;
  });

  const usersSnap = await getDocs(collection(db, "users"));
  let batch = writeBatch(db);
  let batchCount = 0;
  const BATCH_SIZE = 450;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    const predRef = doc(db, "awards_predictions", uid);
    const predSnap = await getDoc(predRef);
    let earned = 0;

    if (predSnap.exists()) {
      const pred = predSnap.data();
      if (pred.pott && pred.pott.trim().toLowerCase() === pott.trim().toLowerCase()) earned += 3;
      if (pred.goldenBoot && pred.goldenBoot.trim().toLowerCase() === goldenBoot.trim().toLowerCase()) earned += 3;
      if (pred.goldenGlove && pred.goldenGlove.trim().toLowerCase() === goldenGlove.trim().toLowerCase()) earned += 3;
    }

    // SAFE: Recompute totalPoints as sum of all components (no subtraction)
    const predictionsPts = userPredPoints[uid] || 0;
    const dtPts = dtPointsMap[uid] || { phase1: 0, phase2: 0 };
    const userDocData = userDoc.data();
    const newTotal = predictionsPts + dtPts.phase1 + dtPts.phase2 + earned + (userDocData.bonusPoints || 0);

    batch.update(userDoc.ref, {
      awardsPoints: earned,
      totalPoints: newTotal,
    });
    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { success: true, message: "Awards resolved successfully." };
};

/**
 * Saves or updates a player record.
 */
export const callSavePlayer = async (playerData) => {
  const { country, name, position, number, price, oldName } = playerData;
  const playerId = `${country.replace(/\s+/g, '_')}_${name.replace(/\s+/g, '_')}`;
  
  const newPlayer = {
    country,
    name,
    position,
    number: number || "",
    price: price || 5.0,
    updatedAt: new Date().toISOString()
  };

  const batch = writeBatch(db);
  
  if (oldName && oldName !== name) {
    const oldPlayerId = `${country.replace(/\s+/g, '_')}_${oldName.replace(/\s+/g, '_')}`;
    batch.delete(doc(db, "custom_players", oldPlayerId));
  }

  batch.set(doc(db, "custom_players", playerId), newPlayer);
  await batch.commit();
  
  return { success: true, message: `Player ${name} saved successfully.` };
};

/**
 * Deletes a player record.
 */
export const callDeletePlayer = async (country, name) => {
  const playerId = `${country.replace(/\s+/g, '_')}_${name.replace(/\s+/g, '_')}`;
  await deleteDoc(doc(db, "custom_players", playerId));
  return { success: true, message: `Player ${name} deleted successfully.` };
};

/**
 * Clears player images (if any cleanup is needed).
 */
export const callClearPlayerImages = async () => {
  const q = query(collection(db, "custom_players"));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach((d) => {
    batch.update(d.ref, { pictureUrl: "" });
  });
  await batch.commit();
  return { success: true, message: "Cleared all player images." };
};

/**
 * Saves settings for the Dream Team phase.
 */
export const callSaveDreamTeamSettings = async (settings) => {
  const docRef = doc(db, "system", "dream_team_settings");
  await setDoc(docRef, settings, { merge: true });
  return { success: true, message: "Dream Team settings updated." };
};

/**
 * Publishes/locks dream team configurations and computes user rankings/points.
 */
export const callPublishDreamTeamRankings = async (requestData) => {
  const { rankings, phase } = requestData;
  const activePhase = phase || 1;

  const systemRef = doc(db, "system", `dream_team_rankings_phase${activePhase}`);
  await setDoc(systemRef, {
    rankings,
    publishedAt: new Date().toISOString(),
    publishedBy: auth.currentUser?.email || "admin",
  }, { merge: true });

  const dtSnapshot = await getDocs(collection(db, "dream_teams"));
  const dreamTeams = [];
  dtSnapshot.forEach((docSnap) => {
    dreamTeams.push({ id: docSnap.id, ...docSnap.data() });
  });

  const BATCH_SIZE = 450;
  let batch = writeBatch(db);
  let batchCount = 0;
  let processedCount = 0;

  const calculateDreamTeamPoints = (dtPlayers, rks) => {
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
      if (rankIndex !== -1) {
        basePts = 10 - rankIndex;
      }

      const isStarting = player.isStarting !== false;
      const isCaptain = player.isCaptain === true;

      const earnedPts = isCaptain ? basePts * 2 : basePts;
      dtTotal += earnedPts;
      if (dtBreakdown[pos] !== undefined) {
        dtBreakdown[pos] += earnedPts;
      }

      dtPlayerPoints.push({
        name,
        position: pos,
        team: player.team,
        price: pPrice,
        isStarting,
        isCaptain,
        points: earnedPts,
        basePoints: basePts,
        rank: rankIndex !== -1 ? rankIndex + 1 : null,
      });
    });

    return { total: dtTotal, breakdown: dtBreakdown, playerPoints: dtPlayerPoints };
  };

  for (const dt of dreamTeams) {
    const docId = dt.id;
    if (!docId) continue;

    const isPhase2Doc = docId.endsWith("_phase2");
    const isPhase1Doc = !isPhase2Doc;
    if (activePhase === 1 && !isPhase1Doc) continue;
    if (activePhase === 2 && !isPhase2Doc) continue;

    const userId = docId.replace("_phase1", "").replace("_phase2", "");
    const { total, breakdown, playerPoints } = calculateDreamTeamPoints(dt.players || [], rankings);

    batch.update(doc(db, "dream_teams", docId), {
      pointsEarned: total,
      pointsBreakdown: breakdown,
      playerPointsBreakdown: playerPoints,
      pointsAwardedAt: new Date().toISOString(),
    });
    batchCount++;
    processedCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  // Fetch all prediction points per user for safe recalculation
  const allPredsSnapDT = await getDocs(collection(db, "predictions"));
  const allMatchesSnapDT = await getDocs(collection(db, "matches"));
  const matchesMapDT = {};
  allMatchesSnapDT.forEach((mDoc) => { matchesMapDT[mDoc.id] = mDoc.data(); });
  const KNOCKOUT_STAGES_DT = ["Round of 32","Round of 16","Quarter-finals","Semi-finals","Play-off for third place","Final"];

  const userPredPointsDT = {};
  allPredsSnapDT.forEach((predDoc) => {
    const pred = predDoc.data();
    const userId = pred.userId;
    const matchId = pred.matchId;
    if (!userId || !matchId) return;
    if (!userPredPointsDT[userId]) userPredPointsDT[userId] = 0;
    const match = matchesMapDT[matchId];
    if (!match || !match.confirmed) return;
    const hA = parseInt(match.confirmedResult?.homeGoals);
    const aA = parseInt(match.confirmedResult?.awayGoals);
    const actualOut = hA > aA ? "HOME_WIN" : hA < aA ? "AWAY_WIN" : "DRAW";
    const pH = parseInt(pred.homeGoals);
    const pA = parseInt(pred.awayGoals);
    if (isNaN(pH) || isNaN(pA)) return;
    const predOut = pH > pA ? "HOME_WIN" : pH < pA ? "AWAY_WIN" : "DRAW";
    let pts = 0;
    if (pH === hA && pA === aA) pts += 5;
    else if (predOut === actualOut) pts += 2;
    if (pred.manOfTheMatch && match.confirmedMOTM && pred.manOfTheMatch.trim().toLowerCase() === match.confirmedMOTM.trim().toLowerCase()) pts += 3;
    const isKO = match.stage && KNOCKOUT_STAGES_DT.includes(match.stage);
    if (isKO && hA === aA && match.confirmedPenaltyScore) {
      const penH = parseInt(match.confirmedPenaltyScore.home);
      const penA = parseInt(match.confirmedPenaltyScore.away);
      if (!isNaN(penH) && !isNaN(penA)) {
        const penWinner = penH > penA ? "home" : "away";
        if (pred.predictedPenaltyWinner === penWinner) pts += 2;
      }
    }
    userPredPointsDT[userId] += pts;
  });

  // Fetch awards points
  const officialAwardsSnapDT = await getDoc(doc(db, "system", "official_awards"));
  const officialAwardsDT = officialAwardsSnapDT.exists() ? officialAwardsSnapDT.data() : null;
  const awardsPointsMapDT = {};
  if (officialAwardsDT && officialAwardsDT.resolved) {
    const awardsPredsSnap = await getDocs(collection(db, "awards_predictions"));
    awardsPredsSnap.forEach((apDoc) => {
      const apUserId = apDoc.id;
      const apPred = apDoc.data();
      let apEarned = 0;
      if (apPred.pott && officialAwardsDT.pott && apPred.pott.trim().toLowerCase() === officialAwardsDT.pott.trim().toLowerCase()) apEarned += 3;
      if (apPred.goldenBoot && officialAwardsDT.goldenBoot && apPred.goldenBoot.trim().toLowerCase() === officialAwardsDT.goldenBoot.trim().toLowerCase()) apEarned += 3;
      if (apPred.goldenGlove && officialAwardsDT.goldenGlove && apPred.goldenGlove.trim().toLowerCase() === officialAwardsDT.goldenGlove.trim().toLowerCase()) apEarned += 3;
      awardsPointsMapDT[apUserId] = apEarned;
    });
  }

  // Build a map of ALL dream team points (both phases) from the updated dream_teams collection
  const dtAllSnapForTotals = await getDocs(collection(db, "dream_teams"));
  const dtAllPointsMap = {};
  dtAllSnapForTotals.forEach((dtDoc) => {
    const dtId = dtDoc.id;
    const dtData = dtDoc.data();
    const dtPts = dtData.pointsEarned || 0;
    let uid = dtId;
    let phase = 1;
    if (dtId.endsWith("_phase1")) { uid = dtId.replace("_phase1", ""); phase = 1; }
    else if (dtId.endsWith("_phase2")) { uid = dtId.replace("_phase2", ""); phase = 2; }
    if (!dtAllPointsMap[uid]) dtAllPointsMap[uid] = { phase1: 0, phase2: 0 };
    if (phase === 1) dtAllPointsMap[uid].phase1 = dtPts;
    else dtAllPointsMap[uid].phase2 = dtPts;
  });

  // Update user totals using SAFE additive recalculation (no subtraction)
  for (const dt of dreamTeams) {
    const docId = dt.id;
    if (!docId) continue;

    const isPhase2Doc = docId.endsWith("_phase2");
    const isPhase1Doc = !isPhase2Doc;
    if (activePhase === 1 && !isPhase1Doc) continue;
    if (activePhase === 2 && !isPhase2Doc) continue;

    const userId = docId.replace("_phase1", "").replace("_phase2", "");
    const { total } = calculateDreamTeamPoints(dt.players || [], rankings);

    try {
      const userRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userRef);
      if (userDocSnap.exists()) {
        // SAFE: Recompute totalPoints as sum of all components (no subtraction)
        const predPts = userPredPointsDT[userId] || 0;
        const awardsPts = awardsPointsMapDT[userId] || 0;
        const allDtPts = dtAllPointsMap[userId] || { phase1: 0, phase2: 0 };
        const userDocData = userDocSnap.data();

        // Use the freshly calculated total for the active phase
        const phase1Pts = activePhase === 1 ? total : allDtPts.phase1;
        const phase2Pts = activePhase === 2 ? total : allDtPts.phase2;
        const newTotal = predPts + phase1Pts + phase2Pts + awardsPts + (userDocData?.bonusPoints || 0);

        const updateData = {
          totalPoints: newTotal,
        };
        if (activePhase === 1) {
          updateData.dreamTeamPointsPhase1 = total;
          updateData.dreamTeamPoints = total;
        } else if (activePhase === 2) {
          updateData.dreamTeamPointsPhase2 = total;
        }

        await updateDoc(userRef, updateData);
      }
    } catch (err) {
      console.error(`Failed to update points for user ${userId}:`, err);
    }
  }

  return { success: true, message: `Rankings published for Phase ${activePhase}.` };
};
