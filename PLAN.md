# 🏆 FIFA World Cup 2026 Predictor — Complete Project Plan

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Authentication & Security](#3-authentication--security)
4. [Live Data Feed](#4-live-data-feed)
5. [Feature Breakdown](#5-feature-breakdown)
6. [Points System](#6-points-system)
7. [UI Design & Layout](#7-ui-design--layout)
8. [Mobile Design](#8-mobile-design)
9. [Admin Panel](#9-admin-panel)
10. [Database & Storage Schema](#10-database--storage-schema)
11. [Build Order & Milestones](#11-build-order--milestones)
12. [Security Checklist](#12-security-checklist)
13.use ntype82 font
---

## 1. Project Overview

A web application for RIT students to predict FIFA World Cup 2026 match outcomes. Players log in using their **@rit.ac.in** Google account, submit predictions before each match, and earn points based on accuracy. A live scoreboard updates in real time during matches. An admin confirms final results to trigger point calculations. The player with the most points at the end of the tournament wins a prize.

### Goals
- Fun, competitive prediction game for RIT students
- Only @rit.ac.in email addresses can register
- Live match scores displayed on the dashboard
- Fair, transparent points system
- Admin controls all result confirmation

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | React (Vite) | Fast, component-based SPA |
| **Styling** | Tailwind CSS | Rapid, responsive styling |
| **Auth** | Firebase Authentication (Google OAuth) | Easy Google login with domain restriction |
| **Database** | Firebase Firestore | Real-time sync, easy rules, free tier |
| **Live Scores** | football-data.org API (free) | Official World Cup data, live scores |
| **Hosting** | Firebase Hosting or Vercel | Free, fast CDN |
| **Admin Auth** | Separate Firebase role (custom claim) | Secure admin separation |

---

## 3. Authentication & Security

### Google Login — @rit.ac.in Only

- Login is handled via **Firebase Authentication** with Google OAuth provider
- After sign-in, the app checks the user's email domain:

```javascript
if (!user.email.endsWith("@rit.ac.in")) {
  auth.signOut();
  showError("Only @rit.ac.in email addresses are allowed.");
}
```

- Users NOT from @rit.ac.in are immediately signed out and shown an error
- No manual registration — Google handles identity

### Admin Role

- Admin is identified by a **Firebase Custom Claim**: `{ admin: true }`
- This claim is set manually via Firebase Admin SDK by the app owner
- Admin login uses the same Google flow but their role is verified server-side
- Admin routes are protected — non-admins are redirected away

### Session Security

- Firebase handles token refresh automatically
- Firestore Security Rules prevent users from reading/writing other players' predictions
- All prediction writes are server-timestamp-validated to prevent backdating

---

## 4. Live Data Feed

### Source: football-data.org (Free Tier)

- **Base URL:** `https://api.football-data.org/v4/`
- **Endpoint for WC2026:** `/competitions/WC/matches`
- **API Key:** Free registration at football-data.org
- **Rate limit:** 10 requests/minute (sufficient with 60s polling)

### What Gets Fetched

| Data | Endpoint | Refresh Rate |
|---|---|---|
| Match schedule | `/competitions/WC/matches` | Once on load |
| Live score | `/matches/{id}` | Every 60 seconds during live match |
| Goalscorers | `/matches/{id}` | Every 60 seconds |
| Standings | `/competitions/WC/standings` | After each match |

### Match States Handled

```
SCHEDULED  →  Upcoming (show kickoff time, prediction form open)
LIVE       →  Live now (show score, minute, auto-refresh)
IN_PLAY    →  In progress (same as LIVE)
PAUSED     →  Half time (show HT score)
FINISHED   →  Full time (pending admin confirmation)
AWARDED    →  Result confirmed by admin (points calculated)
```

### Data Displayed Per Live Match

- 🔴 LIVE badge + current minute
- Team names + flags
- Current score (large, prominent)
- Goalscorers with match minute
- Yellow 🟨 and Red 🟥 cards with player name
- Venue name
- Player's own prediction shown alongside live score

---

## 5. Feature Breakdown

### 5.1 Player Features

#### Login Page
- "Sign in with Google" button
- Domain restriction enforced immediately after sign-in
- Error message for non-@rit.ac.in accounts

#### Dashboard
- **Live Now** section (top, prominent) — if a match is currently playing
- **Today's Matches** — matches scheduled today
- **Upcoming Matches** — next 5 fixtures with prediction CTA
- **Recent Results** — last 3 confirmed matches, your points earned
- **My Points** — total points badge in header

#### Predict a Match
- Shown for any upcoming match where prediction deadline hasn't passed
- **Prediction deadline = kickoff time** (form locks automatically)
- Fields:
  - **Score:** Two number inputs (Home goals — Away goals)
  - **Man of the Match:** Text input or dropdown of squad players
  - **Bonus prediction:** Configurable per match (e.g. "Will both teams score? Y/N" or "First goalscorer")
- Submit button → saved to Firestore instantly
- After submit: shows confirmation with your prediction

#### My Predictions Page
- Table of all matches you've predicted
- Columns: Match | Your Prediction | Actual Result | Points Earned | Status
- Status: Pending / Confirmed / Points Awarded
- Total points at top

#### Leaderboard Page
- Full standings of all players
- Columns: Rank | Name | Predictions Made | Correct Results | Exact Scores | MOTM | Bonus | Total Points
- Live updates after each admin confirmation
- Highlight your own row
- Top 3 shown with 🥇🥈🥉 badges

### 5.2 Admin Features (see Section 9 for full detail)

- Confirm match results
- Enter final score, MOTM, bonus result
- Trigger point calculation
- Manage player accounts
- View all predictions before confirming

---

## 6. Points System

| Prediction | Criteria | Points |
|---|---|---|
| **Correct Result** | Win/Draw/Loss outcome is right | **2 pts** |
| **Exact Score** | Both teams' goals exactly right | **5 pts** (includes the 2 for result) |
| **Man of the Match** | Correct MOTM player | **3 pts** |
| **Bonus Prediction** | Correct answer to bonus question | **1 pt** |
| **Maximum per match** | Exact score + MOTM + Bonus | **9 pts** |

### Point Calculation Rules

- Points are calculated **only after admin confirms the result**
- If a player did not predict a match, they score **0** for that match (no penalty)
- Tiebreaker (if two players have equal points at the end): most exact scores → most MOTM correct → most predictions made

---

## 7. UI Design & Layout

### Design Direction
**Bold football-stadium aesthetic** — deep navy/dark green field background, white and gold typography, high-contrast score cards. Think match-day scoreboard energy. Clean, athletic, and modern.

### Color Palette

```
--bg-primary:     #0A0E1A   /* Deep navy — main background */
--bg-card:        #111827   /* Slightly lighter — cards */
--bg-elevated:    #1C2333   /* Elevated surfaces */
--accent-gold:    #F5C518   /* Gold — highlights, live badge */
--accent-green:   #22C55E   /* Success / correct predictions */
--accent-red:     #EF4444   /* Cards, errors */
--text-primary:   #F9FAFB   /* White — main text */
--text-muted:     #9CA3AF   /* Grey — secondary text */
--border:         #2D3748   /* Subtle borders */
```

### Typography

```
Display font:  "Bebas Neue" (Google Fonts) — headings, scores
Body font:     "DM Sans" (Google Fonts) — body text, UI elements
Mono:          "JetBrains Mono" — scores, numbers
```

### Page Layout (Desktop)

```
┌──────────────────────────────────────────────────────┐
│  HEADER: Logo | Nav Links | Points Badge | Avatar    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔴 LIVE  74'   BRAZIL  2–1  ARGENTINA      │    │
│  │  ⚽ Vinicius 23' | ⚽ Rodrygo 61'            │    │
│  │  Your prediction: 2–0 Brazil                │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  TODAY'S MATCHES          UPCOMING FIXTURES          │
│  ┌──────────────┐         ┌──────────────┐          │
│  │  Match card  │         │  Match card  │          │
│  └──────────────┘         └──────────────┘          │
│                                                      │
│  RECENT RESULTS                                      │
│  ┌──────────────────────────────────────────┐       │
│  │  Match | Result | Your pred | Points     │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
└──────────────────────────────────────────────────────┘
│  FOOTER: WC2026 | Made by [Name] | @rit.ac.in only  │
└──────────────────────────────────────────────────────┘
```

### Navigation

```
Header Nav (Desktop):  Dashboard | Predict | My Predictions | Leaderboard
Bottom Nav (Mobile):   🏠 Home | ⚽ Predict | 📋 My Picks | 🏆 Board
```

### Match Card — States

**Upcoming:**
```
┌──────────────────────────────────────┐
│  🗓 GROUP A  •  Jun 12, 8:00 PM      │
│  🇺🇸 USA          vs         🇲🇽 Mexico │
│  Venue: MetLife Stadium              │
│  [ Make Prediction → ]               │
└──────────────────────────────────────┘
```

**Live:**
```
┌──────────────────────────────────────┐
│  🔴 LIVE  •  74'                     │
│  🇧🇷 Brazil    2 – 1    🇦🇷 Argentina  │
│  ⚽ Vinicius 23'  ⚽ Rodrygo 61'      │
│  ⚽ Messi 45+2' (ARG)                │
│  Your prediction: 2–0 Brazil         │
└──────────────────────────────────────┘
```

**Full Time (Pending Admin):**
```
┌──────────────────────────────────────┐
│  ✅ FULL TIME                         │
│  🇧🇷 Brazil    2 – 1    🇦🇷 Argentina  │
│  Your prediction: 2–1 Brazil ✓       │
│  ⏳ Awaiting admin confirmation...   │
└──────────────────────────────────────┘
```

**Confirmed:**
```
┌──────────────────────────────────────┐
│  🏁 CONFIRMED                         │
│  🇧🇷 Brazil    2 – 1    🇦🇷 Argentina  │
│  Your prediction: 2–1 Brazil ✓       │
│  Points earned: +7 pts               │
└──────────────────────────────────────┘
```

---

## 8. Mobile Design

### Philosophy
- Mobile-first design — most users will use phones
- Bottom navigation bar (fixed) replacing top nav
- Swipeable match cards
- Large tap targets (min 44px)
- Score numbers large and readable (min 48px font)

### Mobile Layout

```
┌─────────────────────┐
│ 🏆 WC26 Predictor   │  ← Header (compact)
│              [42pts]│
├─────────────────────┤
│  🔴 LIVE  74'       │  ← Live match banner
│  BRA 2–1 ARG        │  ← Full width, prominent
│  Your pick: 2-0 BRA │
├─────────────────────┤
│  TODAY               │
│  ┌─────────────────┐ │
│  │ Match card      │ │  ← Swipeable
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ Match card      │ │
│  └─────────────────┘ │
├─────────────────────┤
│ 🏠  ⚽  📋  🏆      │  ← Fixed bottom nav
└─────────────────────┘
```

### Mobile-Specific Behaviours

- Prediction form uses number pads for score inputs (inputMode="numeric")
- MOTM picker is a scrollable bottom sheet (not a dropdown)
- Leaderboard scrolls horizontally on small screens
- Live score auto-refresh pauses when tab is backgrounded (Page Visibility API)
- Pull-to-refresh on dashboard

---

## 9. Admin Panel

### Access
- Admin logs in via the same Google button
- Firebase detects `admin: true` custom claim on their token
- Admin is redirected to `/admin` dashboard automatically
- Non-admins trying to access `/admin` are bounced to home

### Admin Dashboard Layout

```
┌──────────────────────────────────────────────────┐
│  🛠 ADMIN PANEL  •  Logged in as: admin@rit.ac.in │
├──────────────────────────────────────────────────┤
│  [ Pending Results (3) ]  [ Players ]  [ Matches ]│
└──────────────────────────────────────────────────┘
```

### Section 1: Confirm Match Results

For every match that has finished (status = FINISHED from API):

```
┌─────────────────────────────────────────────────────┐
│  🇧🇷 Brazil vs 🇦🇷 Argentina   •  Jun 15, 2026        │
│  Live API Result: Brazil 2–1 Argentina              │
│                                                     │
│  Confirm Final Score:                               │
│  Brazil [ 2 ] – [ 1 ] Argentina   (pre-filled)     │
│                                                     │
│  Man of the Match: [ Vinicius Jr.          ▼ ]     │
│                                                     │
│  Bonus Answer:  Both teams scored? [✓ Yes] [ No ]  │
│                                                     │
│  Predictions submitted: 24 / 31 players            │
│  [ View all predictions ]  [ ✅ CONFIRM & AWARD POINTS ]│
└─────────────────────────────────────────────────────┘
```

- Score is pre-filled from the API result (admin can edit if API was wrong)
- Admin selects MOTM from a player list
- Admin selects bonus answer
- "View all predictions" shows a table of all player picks before confirming
- **Confirming is irreversible** — a warning modal is shown before submission

### Section 2: Player Management

Table of all registered players:

| # | Name | Email | Predictions Made | Total Points | Status |
|---|---|---|---|---|---|
| 1 | Aryan K | aryan@rit.ac.in | 18 | 94 | Active |
| 2 | Priya S | priya@rit.ac.in | 15 | 78 | Active |

- Admin can **deactivate** a player (blocks login without deleting data)
- Admin can **reset** a player's predictions (for testing only — disabled after tournament starts)
- Export leaderboard as CSV

### Section 3: Match Management

- View full tournament schedule
- Manually mark a match as postponed/cancelled
- Override match status if API gives wrong data
- Set custom bonus question per match (e.g. "Will there be a penalty? Y/N")

---

## 10. Database & Storage Schema

### Firestore Collections

#### `/users/{userId}`
```json
{
  "uid": "firebase_uid",
  "name": "Aryan Kumar",
  "email": "aryan@rit.ac.in",
  "photoURL": "https://...",
  "totalPoints": 94,
  "predictionsCount": 18,
  "isActive": true,
  "createdAt": "timestamp",
  "isAdmin": false
}
```

#### `/matches/{matchId}`
```json
{
  "matchId": "wc2026_001",
  "homeTeam": { "name": "Brazil", "flag": "🇧🇷", "code": "BRA" },
  "awayTeam": { "name": "Argentina", "flag": "🇦🇷", "code": "ARG" },
  "kickoffTime": "timestamp",
  "stage": "GROUP_A",
  "venue": "MetLife Stadium",
  "status": "LIVE",
  "liveScore": { "home": 2, "away": 1 },
  "minute": 74,
  "goalscorers": [
    { "player": "Vinicius Jr.", "team": "BRA", "minute": 23 },
    { "player": "Rodrygo", "team": "BRA", "minute": 61 },
    { "player": "Messi", "team": "ARG", "minute": "45+2" }
  ],
  "cards": [
    { "player": "De Paul", "team": "ARG", "type": "YELLOW", "minute": 38 },
    { "player": "Otamendi", "team": "ARG", "type": "RED", "minute": 70 }
  ],
  "bonusQuestion": "Will both teams score?",
  "confirmed": false,
  "confirmedResult": null,
  "confirmedMOTM": null,
  "confirmedBonusAnswer": null,
  "confirmedAt": null,
  "confirmedBy": null
}
```

#### `/predictions/{userId}_{matchId}`
```json
{
  "userId": "firebase_uid",
  "matchId": "wc2026_001",
  "homeGoals": 2,
  "awayGoals": 0,
  "manOfTheMatch": "Vinicius Jr.",
  "bonusAnswer": "Yes",
  "submittedAt": "timestamp",
  "pointsEarned": null,
  "pointsBreakdown": {
    "result": 0,
    "exactScore": 0,
    "motm": 0,
    "bonus": 0
  },
  "pointsAwardedAt": null
}
```

### Firestore Security Rules (Summary)

```
- Users can read their own document only
- Users can write predictions only for themselves, only before kickoff
- Users can read all matches (live data)
- Users can read the leaderboard (aggregated scores only)
- Admin can read/write everything
- No user can write to confirmed match results
```

---

## 11. Build Order & Milestones

### Phase 1 — Foundation (Week 1)
- [ ] Set up React + Vite + Tailwind project (Pending CSS version selection)
- [x] Configure Firebase (Auth + Firestore + Hosting)
- [x] Google OAuth login with @rit.ac.in domain restriction
- [x] Basic routing (Dashboard, Predict, Leaderboard, Admin)
- [x] Firestore security rules

### Phase 2 — Core Features (Week 2)
- [x] Match schedule seeded into Firestore (all WC2026 fixtures via seeder)
- [x] Live data feed integration (football-data.org API setup)
- [x] Live match card component (score, minute, goalscorers, cards)
- [x] Auto-refresh every 60 seconds for live matches (via real-time Firestore listeners)
- [x] Dashboard layout (live now + today + upcoming)

### Phase 3 — Predictions (Week 3)
- [x] Prediction form (score + MOTM + bonus)
- [x] Kickoff deadline lock (form disabled after kickoff)
- [x] Prediction saved to Firestore
- [x] "My Predictions" page (history + points)

### Phase 4 — Admin & Points (Week 4)
- [x] Admin role setup (Firebase custom claims)
- [x] Admin panel — pending results queue
- [x] Confirm result flow (score + MOTM + bonus)
- [x] Points calculation engine (fires on admin confirmation)
- [x] Leaderboard (real-time from Firestore)

### Phase 5 — Polish (Week 5)
- [ ] Mobile responsive design (bottom nav, swipeable cards)
- [ ] Animations and transitions
- [ ] Error handling (API down, no predictions, etc.)
- [ ] Loading states and skeletons
- [ ] Performance optimisation (lazy loading, caching)
- [ ] Final testing across devices

---

## 12. Security Checklist

| # | Item | Method |
|---|---|---|
| 1 | Only @rit.ac.in can log in | Email domain check post-Google sign-in |
| 2 | Users cannot see others' predictions before match ends | Firestore rules |
| 3 | Users cannot submit predictions after kickoff | Server timestamp check in Firestore rules |
| 4 | Users cannot modify others' predictions | Firestore rules: `request.auth.uid == userId` |
| 5 | Admin routes protected | Custom claim check on every admin page load |
| 6 | Live API key not exposed | Store in environment variable, proxy if needed |
| 7 | No client-side point manipulation | Points calculated server-side via Firebase Cloud Function |
| 8 | Admin confirmation is irreversible | Firestore rule: confirmed matches cannot be overwritten |
| 9 | Rate limiting on predictions | Firestore rules limit writes per user per match to 1 |
| 10 | Player deactivation works instantly | `isActive` check on every login |

---

## Appendix: Folder Structure

```
/src
  /components
    /auth         → LoginPage, ProtectedRoute, AdminRoute
    /dashboard    → Dashboard, LiveMatchBanner, MatchCard
    /predict      → PredictForm, PredictionHistory
    /leaderboard  → Leaderboard, LeaderboardRow
    /admin        → AdminDashboard, ConfirmResult, PlayerManager
    /ui           → Button, Card, Badge, Modal, BottomNav
  /hooks
    → useAuth, useLiveMatch, usePredictions, useLeaderboard
  /services
    → firebase.js, footballApi.js, pointsEngine.js
  /context
    → AuthContext.jsx
  /utils
    → dateUtils.js, flagUtils.js, pointsCalc.js
  App.jsx
  main.jsx
```

---

*Document version 1.0 — World Cup 2026 Predictor — RIT.ac.in*
