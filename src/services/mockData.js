// src/services/mockData.js

const INITIAL_MATCHES = [
  {
    matchId: "wc2026_001",
    homeTeam: { name: "USA", flag: "🇺🇸", code: "USA" },
    awayTeam: { name: "Mexico", flag: "🇲🇽", code: "MEX" },
    kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now (Upcoming)
    stage: "Group A",
    venue: "MetLife Stadium",
    status: "SCHEDULED",
    liveScore: { home: 0, away: 0 },
    minute: 0,
    goalscorers: [],
    cards: [],
    bonusQuestion: "Will there be a penalty in the match? (Yes/No)",
    confirmed: false,
    confirmedResult: null,
    confirmedMOTM: null,
    confirmedBonusAnswer: null
  },
  {
    matchId: "wc2026_002",
    homeTeam: { name: "Brazil", flag: "🇧🇷", code: "BRA" },
    awayTeam: { name: "Argentina", flag: "🇦🇷", code: "ARG" },
    kickoffTime: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // Started 75 mins ago (LIVE)
    stage: "Group B",
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
    bonusQuestion: "Will both teams score? (Yes/No)",
    confirmed: false,
    confirmedResult: null,
    confirmedMOTM: null,
    confirmedBonusAnswer: null
  },
  {
    matchId: "wc2026_003",
    homeTeam: { name: "France", flag: "🇫🇷", code: "FRA" },
    awayTeam: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
    kickoffTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // Finished (Pending Admin)
    stage: "Group C",
    venue: "SoFi Stadium",
    status: "FINISHED",
    liveScore: { home: 1, away: 1 },
    minute: 90,
    goalscorers: [
      { player: "Mbappe", team: "FRA", minute: 12 },
      { player: "Kane", team: "ENG", minute: 88 }
    ],
    cards: [],
    bonusQuestion: "Will Mbappe score? (Yes/No)",
    confirmed: false,
    confirmedResult: null,
    confirmedMOTM: null,
    confirmedBonusAnswer: null
  },
  {
    matchId: "wc2026_004",
    homeTeam: { name: "Germany", flag: "🇩🇪", code: "GER" },
    awayTeam: { name: "Spain", flag: "🇪🇸", code: "ESP" },
    kickoffTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Confirmed (Past Match)
    stage: "Group D",
    venue: "Mercedes-Benz Stadium",
    status: "AWARDED",
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
    bonusQuestion: "Will there be over 3.5 goals? (Yes/No)",
    confirmed: true,
    confirmedResult: { home: 3, away: 2 },
    confirmedMOTM: "Musiala",
    confirmedBonusAnswer: "Yes"
  },
  {
    matchId: "wc2026_005",
    homeTeam: { name: "Portugal", flag: "🇵🇹", code: "POR" },
    awayTeam: { name: "Morocco", flag: "🇲🇦", code: "MAR" },
    kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow (Upcoming)
    stage: "Group E",
    venue: "Hard Rock Stadium",
    status: "SCHEDULED",
    liveScore: { home: 0, away: 0 },
    minute: 0,
    goalscorers: [],
    cards: [],
    bonusQuestion: "Will Ronaldo start? (Yes/No)",
    confirmed: false,
    confirmedResult: null,
    confirmedMOTM: null,
    confirmedBonusAnswer: null
  }
];

const INITIAL_USERS = [
  {
    uid: "mock_user_1",
    name: "Aryan Kumar",
    email: "aryan@rit.ac.in",
    photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aryan",
    totalPoints: 94,
    predictionsCount: 18,
    isActive: true,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: "mock_user_2",
    name: "Priya Sharma",
    email: "priya@rit.ac.in",
    photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya",
    totalPoints: 78,
    predictionsCount: 15,
    isActive: true,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: "mock_user_admin",
    name: "Prof. Raj (Admin)",
    email: "admin@rit.ac.in",
    photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=Raj",
    totalPoints: 0,
    predictionsCount: 0,
    isActive: true,
    isAdmin: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_PREDICTIONS = [
  // Aryan's predictions
  {
    id: "mock_user_1_wc2026_002",
    userId: "mock_user_1",
    matchId: "wc2026_002",
    homeGoals: 2,
    awayGoals: 1,
    manOfTheMatch: "Vinicius Jr.",
    bonusAnswer: "Yes",
    submittedAt: new Date().toISOString(),
    pointsEarned: null,
    pointsBreakdown: null
  },
  {
    id: "mock_user_1_wc2026_003",
    userId: "mock_user_1",
    matchId: "wc2026_003",
    homeGoals: 2,
    awayGoals: 0,
    manOfTheMatch: "Mbappe",
    bonusAnswer: "Yes",
    submittedAt: new Date().toISOString(),
    pointsEarned: null,
    pointsBreakdown: null
  },
  {
    id: "mock_user_1_wc2026_004",
    userId: "mock_user_1",
    matchId: "wc2026_004",
    homeGoals: 3,
    awayGoals: 2, // Exact Score (+5pts)
    manOfTheMatch: "Musiala", // Correct MOTM (+3pts)
    bonusAnswer: "Yes", // Correct Bonus (+1pt) -> 9pts total
    submittedAt: new Date().toISOString(),
    pointsEarned: 9,
    pointsBreakdown: {
      result: 2,
      exactScore: 3, // additional 3 to reach 5 total for exact score
      motm: 3,
      bonus: 1
    }
  },
  // Priya's predictions
  {
    id: "mock_user_2_wc2026_002",
    userId: "mock_user_2",
    matchId: "wc2026_002",
    homeGoals: 1,
    awayGoals: 1,
    manOfTheMatch: "Messi",
    bonusAnswer: "No",
    submittedAt: new Date().toISOString(),
    pointsEarned: null,
    pointsBreakdown: null
  },
  {
    id: "mock_user_2_wc2026_003",
    userId: "mock_user_2",
    matchId: "wc2026_003",
    homeGoals: 1,
    awayGoals: 1, // Exact Score (+5pts)
    manOfTheMatch: "Kane",
    bonusAnswer: "Yes",
    submittedAt: new Date().toISOString(),
    pointsEarned: null,
    pointsBreakdown: null
  },
  {
    id: "mock_user_2_wc2026_004",
    userId: "mock_user_2",
    matchId: "wc2026_004",
    homeGoals: 1,
    awayGoals: 2, // Wrong result (0 pts)
    manOfTheMatch: "Musiala", // Correct MOTM (+3pts)
    bonusAnswer: "Yes", // Correct Bonus (+1pt) -> 4pts total
    submittedAt: new Date().toISOString(),
    pointsEarned: 4,
    pointsBreakdown: {
      result: 0,
      exactScore: 0,
      motm: 3,
      bonus: 1
    }
  }
];

// Helper to initialize local storage
const initStorage = () => {
  if (!localStorage.getItem("wc_matches")) {
    localStorage.setItem("wc_matches", JSON.stringify(INITIAL_MATCHES));
  }
  if (!localStorage.getItem("wc_users")) {
    localStorage.setItem("wc_users", JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem("wc_predictions")) {
    localStorage.setItem("wc_predictions", JSON.stringify(INITIAL_PREDICTIONS));
  }
};

initStorage();

export const getMatches = () => {
  initStorage();
  return JSON.parse(localStorage.getItem("wc_matches"));
};

export const saveMatches = (matches) => {
  localStorage.setItem("wc_matches", JSON.stringify(matches));
};

export const getPredictions = (userId = null) => {
  initStorage();
  const all = JSON.parse(localStorage.getItem("wc_predictions"));
  if (userId) {
    return all.filter(p => p.userId === userId);
  }
  return all;
};

export const getPredictionForMatch = (userId, matchId) => {
  const preds = getPredictions(userId);
  return preds.find(p => p.matchId === matchId) || null;
};

export const savePrediction = (userId, matchId, data) => {
  initStorage();
  const all = JSON.parse(localStorage.getItem("wc_predictions"));
  const idx = all.findIndex(p => p.userId === userId && p.matchId === matchId);
  
  const predData = {
    id: `${userId}_${matchId}`,
    userId,
    matchId,
    homeGoals: parseInt(data.homeGoals),
    awayGoals: parseInt(data.awayGoals),
    manOfTheMatch: data.manOfTheMatch,
    bonusAnswer: data.bonusAnswer,
    submittedAt: new Date().toISOString(),
    pointsEarned: null,
    pointsBreakdown: null
  };

  if (idx > -1) {
    all[idx] = predData;
  } else {
    all.push(predData);
  }

  localStorage.setItem("wc_predictions", JSON.stringify(all));
  
  // Update predictions count for user
  const users = getUsers();
  const uIdx = users.findIndex(u => u.uid === userId);
  if (uIdx > -1) {
    users[uIdx].predictionsCount = all.filter(p => p.userId === userId).length;
    saveUsers(users);
  }

  return predData;
};

export const getUsers = () => {
  initStorage();
  return JSON.parse(localStorage.getItem("wc_users"));
};

export const saveUsers = (users) => {
  localStorage.setItem("wc_users", JSON.stringify(users));
};

export const setUserStatus = (uid, isActive) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.uid === uid);
  if (idx > -1) {
    users[idx].isActive = isActive;
    saveUsers(users);
    return true;
  }
  return false;
};

export const registerUser = (userData) => {
  const users = getUsers();
  const existing = users.find(u => u.email === userData.email);
  if (existing) {
    return existing;
  }
  
  const newUser = {
    uid: userData.uid || `user_${Date.now()}`,
    name: userData.displayName || userData.name,
    email: userData.email,
    photoURL: userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.email}`,
    totalPoints: 0,
    predictionsCount: 0,
    isActive: true,
    isAdmin: userData.email === "admin@rit.ac.in",
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Points Engine
export const calculatePoints = (prediction, matchResult, motmResult, bonusResult) => {
  const { homeGoals: predHome, awayGoals: predAway, manOfTheMatch: predMotm, bonusAnswer: predBonus } = prediction;
  const { home: actualHome, away: actualAway } = matchResult;
  
  let points = 0;
  const breakdown = {
    result: 0,
    exactScore: 0,
    motm: 0,
    bonus: 0
  };

  const actualWinLoss = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predWinLoss = predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";

  // Correct Result
  if (actualWinLoss === predWinLoss) {
    points += 2;
    breakdown.result = 2;
  }

  // Exact Score
  if (predHome === actualHome && predAway === actualAway) {
    points += 3; // +3 extra points (making it 5 total including correct result)
    breakdown.exactScore = 3;
  }

  // MOTM
  if (predMotm && predMotm.toLowerCase().trim() === motmResult.toLowerCase().trim()) {
    points += 3;
    breakdown.motm = 3;
  }

  // Bonus
  if (predBonus && predBonus.toLowerCase().trim() === bonusResult.toLowerCase().trim()) {
    points += 1;
    breakdown.bonus = 1;
  }

  return { total: points, breakdown };
};

export const confirmMatchResult = (matchId, finalScore, motm, bonusAnswer) => {
  const matches = getMatches();
  const idx = matches.findIndex(m => m.matchId === matchId);
  if (idx === -1) return false;

  matches[idx].status = "AWARDED";
  matches[idx].confirmed = true;
  matches[idx].confirmedResult = finalScore;
  matches[idx].confirmedMOTM = motm;
  matches[idx].confirmedBonusAnswer = bonusAnswer;

  saveMatches(matches);

  // Recalculate all predictions for this match
  const predictions = getPredictions();
  const users = getUsers();

  predictions.forEach(pred => {
    if (pred.matchId === matchId) {
      const { total, breakdown } = calculatePoints(pred, finalScore, motm, bonusAnswer);
      pred.pointsEarned = total;
      pred.pointsBreakdown = breakdown;
    }
  });

  localStorage.setItem("wc_predictions", JSON.stringify(predictions));

  // Recalculate total points for all users
  users.forEach(user => {
    const userPreds = predictions.filter(p => p.userId === user.uid);
    user.totalPoints = userPreds.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  });

  saveUsers(users);
  return true;
};

// Simulation of LIVE match
export const simulateStep = () => {
  const matches = getMatches();
  const liveMatch = matches.find(m => m.status === "LIVE");
  if (!liveMatch) return null;

  // Increment minute
  liveMatch.minute = Math.min(90, liveMatch.minute + Math.floor(Math.random() * 3) + 1);
  
  // Potential Goal (5% chance per tick)
  if (Math.random() < 0.1 && liveMatch.minute < 90) {
    const isHomeGoal = Math.random() < 0.5;
    if (isHomeGoal) {
      liveMatch.liveScore.home += 1;
      const scorer = ["Vinicius Jr.", "Rodrygo", "Neymar", "Endrick"][Math.floor(Math.random() * 4)];
      liveMatch.goalscorers.push({ player: scorer, team: liveMatch.homeTeam.code, minute: liveMatch.minute });
    } else {
      liveMatch.liveScore.away += 1;
      const scorer = ["Messi", "Martinez", "Alvarez", "Di Maria"][Math.floor(Math.random() * 4)];
      liveMatch.goalscorers.push({ player: scorer, team: liveMatch.awayTeam.code, minute: liveMatch.minute });
    }
  }

  // Potential Card (3% chance)
  if (Math.random() < 0.05 && liveMatch.minute < 90) {
    const isHome = Math.random() < 0.5;
    const team = isHome ? liveMatch.homeTeam : liveMatch.awayTeam;
    const player = isHome 
      ? ["Casemiro", "Militao", "Guimaraes", "Marquinhos"][Math.floor(Math.random() * 4)]
      : ["De Paul", "Otamendi", "Acuna", "Romero"][Math.floor(Math.random() * 4)];
    const type = Math.random() < 0.9 ? "YELLOW" : "RED";
    liveMatch.cards.push({ player, team: team.code, type, minute: liveMatch.minute });
  }

  // Match ends if it hits 90 minutes
  if (liveMatch.minute >= 90) {
    liveMatch.status = "FINISHED";
  }

  saveMatches(matches);
  return liveMatch;
};

export const resetSimulation = () => {
  const matches = getMatches();
  const liveIdx = matches.findIndex(m => m.matchId === "wc2026_002");
  if (liveIdx > -1) {
    matches[liveIdx] = {
      matchId: "wc2026_002",
      homeTeam: { name: "Brazil", flag: "🇧🇷", code: "BRA" },
      awayTeam: { name: "Argentina", flag: "🇦🇷", code: "ARG" },
      kickoffTime: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      stage: "Group B",
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
      bonusQuestion: "Will both teams score? (Yes/No)",
      confirmed: false,
      confirmedResult: null,
      confirmedMOTM: null,
      confirmedBonusAnswer: null
    };
  }

  const upcomingIdx = matches.findIndex(m => m.matchId === "wc2026_001");
  if (upcomingIdx > -1) {
    matches[upcomingIdx].status = "SCHEDULED";
  }

  saveMatches(matches);
};
