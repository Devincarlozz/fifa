# 🎨 WC26 Predictor — UI Design System & Component Guide

Complete UI specification to build the WC26 Predictor exactly
as shown in the reference design images.

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Typography](#2-typography)
3. [Layout System](#3-layout-system)
4. [Components](#4-components)
5. [Page Specs](#5-page-specs)
6. [Animations](#6-animations)
7. [Mobile Design](#7-mobile-design)
8. [Dark Overlay System](#8-dark-overlay-system)
9. [Icon System](#9-icon-system)
10. [Responsive Breakpoints](#10-responsive-breakpoints)

---

## 1. Design Tokens

### Colors

```css
:root {
  /* Backgrounds */
  --bg-primary:       #0A0E1A;   /* Deep navy — page background */
  --bg-card:          #111827;   /* Card surfaces */
  --bg-elevated:      #1C2333;   /* Elevated cards / hover states */
  --bg-sidebar:       #0D1117;   /* Left sidebar */
  --bg-input:         #0F1520;   /* Form inputs */

  /* Gold — Primary Accent */
  --gold:             #F5C518;
  --gold-hover:       #E5B800;
  --gold-muted:       rgba(245, 197, 24, 0.15);
  --gold-border:      rgba(245, 197, 24, 0.25);
  --gold-glow-sm:     0 0 20px rgba(245, 197, 24, 0.15);
  --gold-glow-md:     0 0 40px rgba(245, 197, 24, 0.12),
                      0 0 80px rgba(245, 197, 24, 0.05);
  --gold-glow-lg:     0 0 60px rgba(245, 197, 24, 0.2),
                      0 0 120px rgba(245, 197, 24, 0.08);

  /* Text */
  --text-primary:     #F9FAFB;
  --text-secondary:   #D1D5DB;
  --text-muted:       #9CA3AF;
  --text-faint:       #6B7280;
  --text-gold:        #F5C518;

  /* Status */
  --live-red:         #EF4444;
  --correct-green:    #22C55E;
  --warning-amber:    #F59E0B;
  --error-red:        #DC2626;

  /* Medal Colors */
  --medal-gold:       #F5C518;
  --medal-silver:     #C0C0C0;
  --medal-bronze:     #CD7F32;

  /* Borders */
  --border-default:   rgba(245, 197, 24, 0.20);
  --border-strong:    rgba(245, 197, 24, 0.40);
  --border-subtle:    rgba(255, 255, 255, 0.06);
}
```

### Spacing Scale

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
```

### Border Radius

```css
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   14px
--radius-xl:   20px
--radius-full: 9999px
```

### Shadows

```css
--shadow-card:    0 4px 24px rgba(0,0,0,0.4);
--shadow-gold-sm: 0 0 20px rgba(245,197,24,0.15);
--shadow-gold-md: 0 0 40px rgba(245,197,24,0.12),
                  0 0 80px rgba(245,197,24,0.05);
--shadow-gold-lg: 0 0 60px rgba(245,197,24,0.2),
                  0 0 120px rgba(245,197,24,0.08);
```

---

## 2. Typography

### Font Families

```css
/* Display — Scores, Headings, Page Titles */
@import url('https://fonts.google.com/specimen/Ntype82');
--font-display: 'NType82', 'Bebas Neue', sans-serif;

/* Body — All UI text, labels, paragraphs */
@import url('https://fonts.google.com/specimen/Inter');
--font-body: 'Inter', -apple-system, sans-serif;
```

### Type Scale

| Token | Font | Size | Weight | Color | Usage |
|---|---|---|---|---|---|
| `display-hero` | NType82 | 80px | Black | #F5C518 | WC26 login title |
| `display-xl` | NType82 | 64px | Black | #F5C518 | PREDICTOR title |
| `display-lg` | NType82 | 52px | Bold | #F9FAFB | Page headings |
| `display-md` | NType82 | 40px | Bold | #F9FAFB | Section heads |
| `score-lg` | NType82 | 72px | Black | #F5C518 | Live match score |
| `score-md` | NType82 | 48px | Black | #F5C518 | Prediction score |
| `team-name` | NType82 | 28px | Bold | #F9FAFB | BRA / ARG labels |
| `label-caps` | Inter | 11px | SemiBold | #9CA3AF | Section labels (ALL CAPS, letter-spacing 2px) |
| `body-lg` | Inter | 16px | Regular | #F9FAFB | Body copy |
| `body-md` | Inter | 14px | Regular | #D1D5DB | Secondary text |
| `body-sm` | Inter | 13px | Regular | #9CA3AF | Captions, meta |
| `body-xs` | Inter | 12px | Regular | #6B7280 | Fine print |
| `points` | NType82 | 20px | Bold | #F5C518 | Points display |

### Typography Usage Rules

- **NType82** — only for: page titles, score numbers, team names, button text, leaderboard numbers
- **Inter** — everything else: labels, body copy, nav items, form inputs, table rows
- All section labels: `UPPERCASE`, `letter-spacing: 2px`, `Inter SemiBold 11px`, `#9CA3AF`
- Score numbers always `#F5C518` regardless of context
- Never use NType82 below 14px

---

## 3. Layout System

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (220px fixed)  │  MAIN CONTENT (flex-1, scroll)   │
│  ─────────────────────  │  ──────────────────────────────   │
│  Logo                   │  Header bar (full width)          │
│  ─────────────────────  │  ──────────────────────────────   │
│  Nav: Home              │                                   │
│  Nav: Predict           │  Page content                     │
│  Nav: My Picks          │  max-width: 1100px                │
│  Nav: Leaderboard       │  padding: 24px                    │
│  Nav: Settings          │                                   │
│  Nav: How to Play       │                                   │
│  ─────────────────────  │                                   │
│  Nav: Logout            │                                   │
└─────────────────────────────────────────────────────────────┘
```

### CSS Grid — Main Content Areas

```css
/* Dashboard grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-width: 760px;
}

/* Two-column layout (stats + upcoming) */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
```

### Sidebar Spec

```css
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #0D1117;
  border-right: 1px solid rgba(245,197,24,0.08);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
  top: 0; left: 0;
}

.sidebar-logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(245,197,24,0.1);
  margin-bottom: 16px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: #9CA3AF;
  font-family: Inter;
  font-size: 14px;
  font-weight: 500;
  border-left: 3px solid transparent;
}

.sidebar-nav-item.active {
  color: #F5C518;
  background: rgba(245,197,24,0.08);
  border-left-color: #F5C518;
}

.sidebar-nav-item:hover:not(.active) {
  color: #D1D5DB;
  background: rgba(255,255,255,0.03);
}
```

---

## 4. Components

---

### 4.1 Base Card

All cards share this base style:

```css
.card {
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid rgba(245, 197, 24, 0.20);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4),
              0 0 20px rgba(245,197,24,0.08);
  padding: 20px;
}

.card-gold-glow {
  box-shadow: 0 0 40px rgba(245,197,24,0.12),
              0 0 80px rgba(245,197,24,0.05),
              0 4px 24px rgba(0,0,0,0.4);
}
```

---

### 4.2 LIVE Match Card

```
┌──────────────────────────────────────────────────────┐
│  [🔴 LIVE] [78']    FIFA WORLD CUP 2026™ — GROUP STAGE│
│                                                      │
│  🇧🇷  BRA    [2]  —  [1]    ARG  🇦🇷                  │
│                                                      │
│  ⚽ Vinícius Júnior 27'        ⚽ L. Messi 45'        │
│  ⚽ Richarlison 64'                                   │
└──────────────────────────────────────────────────────┘
```

```css
.live-match-card {
  /* Base card + */
  border-color: rgba(245,197,24,0.35);
  padding: 20px 24px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #EF4444;
  color: white;
  font-family: Inter;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 3px 10px;
  border-radius: 5px;
  animation: livePulse 1.5s ease-in-out infinite;
}

.live-badge::before {
  content: '';
  width: 6px; height: 6px;
  background: white;
  border-radius: 50%;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
}

.match-minute {
  font-family: Inter;
  font-size: 15px;
  font-weight: 600;
  color: #F9FAFB;
}

.match-stage-label {
  font-family: Inter;
  font-size: 11px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 2px;
  text-align: center;
  text-transform: uppercase;
  margin: 12px 0;
}

.score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.score-number {
  font-family: 'NType82', 'Bebas Neue';
  font-size: 72px;
  color: #F5C518;
  line-height: 1;
}

.score-separator {
  font-family: 'NType82', 'Bebas Neue';
  font-size: 48px;
  color: #374151;
  line-height: 1;
}

.team-code {
  font-family: 'NType82', 'Bebas Neue';
  font-size: 28px;
  color: #F9FAFB;
}

.team-flag {
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 2px solid #F5C518;
  object-fit: cover;
}

.goalscorer-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.goalscorer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: Inter;
  font-size: 13px;
  color: #D1D5DB;
}
```

---

### 4.3 Your Prediction Card

```css
.prediction-card {
  background: rgba(245,197,24,0.04);
  border: 1px solid rgba(245,197,24,0.15);
  border-radius: 10px;
  padding: 16px 20px;
  margin-top: 12px;
}

.prediction-label {
  font-family: Inter;
  font-size: 11px;
  font-weight: 600;
  color: #F5C518;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.points-badge {
  background: #22C55E;
  color: white;
  font-family: Inter;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.correct-label {
  color: #22C55E;
  font-family: Inter;
  font-size: 13px;
  font-weight: 500;
}

.correct-label::before { content: '✓ '; }
```

---

### 4.4 Next Match Row

```css
.next-match-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid rgba(245,197,24,0.08);
  margin-top: 4px;
}

.next-match-label {
  font-family: Inter;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.next-match-teams {
  display: flex;
  align-items: center;
  gap: 8px;
}

.next-match-flag {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(245,197,24,0.4);
}

.next-match-code {
  font-family: 'NType82';
  font-size: 15px;
  color: #F9FAFB;
}

.next-match-vs {
  font-family: Inter;
  font-size: 12px;
  color: #6B7280;
}

.next-match-date {
  font-family: Inter;
  font-size: 13px;
  font-weight: 500;
  color: #9CA3AF;
  text-align: right;
}
```

---

### 4.5 Header Bar

```css
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(245,197,24,0.08);
}

.page-title {
  font-family: 'NType82';
  font-size: 40px;
  color: #F9FAFB;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(245,197,24,0.4);
  background: #1C2333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter;
  font-size: 13px;
  font-weight: 600;
  color: #F5C518;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-family: Inter;
  font-size: 14px;
  font-weight: 600;
  color: #F9FAFB;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: Inter;
  font-size: 12px;
  color: #9CA3AF;
}

.points-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245,197,24,0.08);
  border: 1px solid rgba(245,197,24,0.25);
  border-radius: 8px;
  padding: 6px 14px;
  font-family: 'NType82';
  font-size: 16px;
  color: #F5C518;
  letter-spacing: 1px;
}
```

---

### 4.6 Leaderboard Table

```css
.leaderboard-table {
  width: 100%;
  background: rgba(17,24,39,0.85);
  border: 1px solid rgba(245,197,24,0.2);
  border-radius: 12px;
  overflow: hidden;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(245,197,24,0.1);
  font-family: Inter;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.15s;
}

.leaderboard-row:hover {
  background: rgba(255,255,255,0.02);
}

/* Top 3 special styling */
.leaderboard-row.rank-1 { background: rgba(245,197,24,0.06); }
.leaderboard-row.rank-2 { background: rgba(192,192,192,0.04); }
.leaderboard-row.rank-3 { background: rgba(205,127,50,0.04); }

.rank-badge {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter;
  font-size: 13px;
  font-weight: 700;
}

.rank-badge.gold   { background: #F5C518; color: #0A0E1A; }
.rank-badge.silver { background: #C0C0C0; color: #0A0E1A; }
.rank-badge.bronze { background: #CD7F32; color: #fff; }
.rank-badge.normal { background: transparent; color: #6B7280; }

.player-name {
  font-family: Inter;
  font-size: 15px;
  font-weight: 500;
  color: #F9FAFB;
}

.player-name.top { color: #F5C518; font-weight: 600; }

.player-points {
  font-family: 'NType82';
  font-size: 20px;
  color: #F9FAFB;
  text-align: right;
}

.player-points.top { color: #F5C518; }

.leaderboard-cta {
  width: 100%;
  padding: 16px;
  background: transparent;
  border: 1px solid rgba(245,197,24,0.3);
  border-top: none;
  border-radius: 0 0 12px 12px;
  color: #F5C518;
  font-family: 'NType82';
  font-size: 15px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.leaderboard-cta:hover {
  background: #F5C518;
  color: #0A0E1A;
}
```

---

### 4.7 Prediction Form

```css
.predict-form {
  background: rgba(17,24,39,0.9);
  border: 1px solid rgba(245,197,24,0.25);
  border-radius: 14px;
  padding: 28px;
  max-width: 480px;
}

/* Match Header (flags + teams) */
.match-header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px;
  background: rgba(245,197,24,0.04);
  border: 1px solid rgba(245,197,24,0.15);
  border-radius: 10px;
  margin-bottom: 24px;
}

.flag-large {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 2px solid #F5C518;
  object-fit: cover;
}

.vs-label {
  font-family: Inter;
  font-size: 16px;
  font-weight: 600;
  color: #6B7280;
}

/* Score Inputs */
.score-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
}

.score-input-box {
  display: flex;
  align-items: center;
  background: #0F1520;
  border: 1px solid rgba(245,197,24,0.3);
  border-radius: 8px;
  width: 100px;
  height: 72px;
  overflow: hidden;
}

.score-input-number {
  flex: 1;
  font-family: 'NType82';
  font-size: 48px;
  color: #F9FAFB;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
}

.score-arrows {
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(245,197,24,0.15);
}

.score-arrow-btn {
  flex: 1;
  padding: 0 8px;
  background: transparent;
  border: none;
  color: #F5C518;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}

.score-arrow-btn:hover { background: rgba(245,197,24,0.1); }

/* MOTM Dropdown */
.motm-dropdown {
  width: 100%;
  background: #0F1520;
  border: 1px solid rgba(245,197,24,0.25);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.motm-dropdown:hover { border-color: rgba(245,197,24,0.5); }

.motm-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1.5px solid rgba(245,197,24,0.3);
  object-fit: cover;
  background: #1C2333;
}

.motm-name {
  flex: 1;
  font-family: Inter;
  font-size: 15px;
  color: #F9FAFB;
}

/* Bonus Toggle */
.bonus-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.bonus-question {
  font-family: Inter;
  font-size: 15px;
  color: #F9FAFB;
  flex: 1;
  margin-right: 16px;
}

/* Toggle Switch */
.toggle {
  width: 48px; height: 26px;
  background: #374151;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.active { background: #F5C518; }

.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle.active .toggle-knob { transform: translateX(22px); }

/* Submit Button */
.submit-btn {
  width: 100%;
  height: 52px;
  background: #F5C518;
  color: #0A0E1A;
  font-family: 'NType82';
  font-size: 18px;
  letter-spacing: 2px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 20px;
}

.submit-btn:hover {
  background: #E5B800;
  transform: scale(1.01);
}

.submit-btn:active { transform: scale(0.99); }

.deadline-text {
  font-family: Inter;
  font-size: 12px;
  color: #6B7280;
  text-align: center;
  margin-top: 10px;
  letter-spacing: 0.5px;
}
```

---

### 4.8 Login Card

```css
.login-page {
  min-height: 100vh;
  background-image: url('/assets/backgrounds/stadium-night-aerial.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 26, 0.82);
}

.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  background: rgba(13, 17, 28, 0.88);
  border: 1px solid rgba(245, 197, 24, 0.35);
  border-radius: 16px;
  padding: 48px 40px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 40px rgba(245,197,24,0.12),
              0 0 80px rgba(245,197,24,0.05),
              0 24px 64px rgba(0,0,0,0.6);
}

/* Gold bottom glow */
.login-card::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40px;
  background: radial-gradient(ellipse, rgba(245,197,24,0.25), transparent 70%);
  pointer-events: none;
}

.trophy-hero {
  width: 110px;
  margin: 0 auto 20px;
  display: block;
  filter: drop-shadow(0 0 20px rgba(245,197,24,0.4));
  animation: trophyFloat 3s ease-in-out infinite;
}

@keyframes trophyFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

.login-title-wc26 {
  font-family: 'NType82';
  font-size: 72px;
  color: #F5C518;
  text-align: center;
  line-height: 0.95;
  letter-spacing: 2px;
}

.login-title-predictor {
  font-family: 'NType82';
  font-size: 60px;
  color: #F5C518;
  text-align: center;
  line-height: 0.95;
  letter-spacing: 4px;
  margin-bottom: 16px;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  opacity: 0.4;
}

.login-divider-line {
  flex: 1;
  height: 1px;
  background: #F5C518;
}

.login-divider-icon {
  color: #F5C518;
  font-size: 14px;
}

.login-subtitle {
  font-family: Inter;
  font-size: 14px;
  color: #9CA3AF;
  text-align: center;
  margin-bottom: 24px;
}

.google-btn {
  width: 100%;
  height: 52px;
  background: #FFFFFF;
  border: none;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: Inter;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.google-btn:hover {
  background: #F3F4F6;
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.google-logo {
  width: 22px;
  height: 22px;
}

.login-footer {
  font-family: Inter;
  font-size: 13px;
  color: #6B7280;
  text-align: center;
  margin-top: 16px;
}
```

---

### 4.9 Section Label

```css
.section-label {
  font-family: Inter;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label::before {
  content: '';
  width: 3px;
  height: 12px;
  background: #F5C518;
  border-radius: 2px;
}
```

---

### 4.10 Feature Icons Row (Dashboard Promo)

```css
.features-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 24px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.feature-icon-wrap {
  width: 48px; height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F5C518;
}

.feature-icon-wrap svg {
  width: 28px;
  height: 28px;
  stroke: #F5C518;
  stroke-width: 1.5;
}

.feature-label {
  font-family: Inter;
  font-size: 11px;
  font-weight: 600;
  color: #F5C518;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.feature-desc {
  font-family: Inter;
  font-size: 12px;
  color: #6B7280;
  line-height: 1.5;
}
```

---

## 5. Page Specs

---

### 5.1 Login Page

```
Layout:     Full screen, centered card
Background: stadium-night-aerial.jpg + rgba(10,14,26,0.82) overlay
Card width: 420px desktop / 90vw mobile
Z-layers:
  1. Background image
  2. Dark overlay
  3. Bokeh particles (CSS animated)
  4. Gold light rays (subtle, behind card)
  5. Login card
  6. Logo (top-left, absolute)
```

**Logo (top-left, absolute):**
```
Position: absolute, top 24px, left 24px
Contents: trophy icon (28px) + "WC26" NType82 18px + "PREDICTOR" NType82 11px
Color: #F5C518
```

---

### 5.2 Dashboard Page

```
Layout:     Sidebar (220px) + Main content
Background: Dark solid #0A0E1A (no image on dashboard)
Header:     Full width, 72px tall
Content:    max-width 760px, centered in main area
```

**Content order (top to bottom):**
1. Section label — "● LIVE MATCH"
2. Live Match Card (full width)
3. Your Prediction Card
4. Next Match Row
5. Section label — "TODAY'S MATCHES"
6. Match cards grid
7. Section label — "UPCOMING"
8. Upcoming match cards

---

### 5.3 Leaderboard Page

```
Layout:     Sidebar + Main
Background: stadium-sideline-night.jpg + rgba(10,14,26,0.9) overlay
Content:    max-width 640px, centered
```

**Content order:**
1. Page title "LEADERBOARD" — NType82 52px centered
2. Trophy hero (160px, floating animation, gold glow)
3. Full leaderboard table
4. "VIEW FULL LEADERBOARD" button

---

### 5.4 Make Your Prediction Page

```
Layout:     Sidebar + Main
Background: Dark solid
Content:    max-width 480px, centered
```

**Content order:**
1. Page title "MAKE YOUR PREDICTION"
2. Subtitle label
3. Match header card (flags + teams)
4. "PREDICT THE SCORE" label
5. Score input group
6. "MAN OF THE MATCH" label
7. MOTM dropdown
8. "BONUS QUESTION" label
9. Bonus toggle row
10. Submit button
11. Deadline text

---

## 6. Animations

```css
/* Trophy float (login page) */
@keyframes trophyFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.trophy-float { animation: trophyFloat 3s ease-in-out infinite; }

/* LIVE badge pulse */
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Gold bokeh particles */
@keyframes particleFloat {
  0%   { transform: translateY(100vh) translateX(0); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.4; }
  100% { transform: translateY(-10vh) translateX(30px); opacity: 0; }
}

.particle {
  position: absolute;
  width: 4px; height: 4px;
  background: #F5C518;
  border-radius: 50%;
  animation: particleFloat linear infinite;
  pointer-events: none;
}

/* Page transition */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: fadeSlideUp 0.35s ease forwards; }

/* Score counter (number tick up on load) */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Gold shimmer on cards */
@keyframes goldShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.gold-shimmer {
  background: linear-gradient(
    90deg,
    #F5C518 0%,
    #FFE066 50%,
    #F5C518 100%
  );
  background-size: 200%;
  animation: goldShimmer 2.5s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 7. Mobile Design

### Bottom Navigation Bar

```css
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  background: rgba(13,17,28,0.97);
  border-top: 1px solid rgba(245,197,24,0.15);
  backdrop-filter: blur(16px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.bottom-nav-icon {
  width: 22px; height: 22px;
  stroke: #6B7280;
  stroke-width: 1.5;
  transition: stroke 0.15s;
}

.bottom-nav-label {
  font-family: Inter;
  font-size: 10px;
  font-weight: 500;
  color: #6B7280;
  transition: color 0.15s;
}

.bottom-nav-item.active .bottom-nav-icon { stroke: #F5C518; }
.bottom-nav-item.active .bottom-nav-label { color: #F5C518; }
```

### Mobile Card Adjustments

```css
@media (max-width: 640px) {
  .score-number        { font-size: 52px; }
  .team-code           { font-size: 22px; }
  .team-flag           { width: 36px; height: 36px; }
  .card                { padding: 16px; border-radius: 10px; }
  .login-card          { width: 100%; border-radius: 20px 20px 0 0;
                         position: fixed; bottom: 0; padding: 32px 24px; }
  .login-title-wc26    { font-size: 52px; }
  .login-title-predictor { font-size: 44px; }
  .leaderboard-header  { display: none; }
  .features-row        { grid-template-columns: repeat(2, 1fr); }
}
```

### Mobile Login Sheet

```css
/* Slides up from bottom */
.login-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,14,26,0.7);
  display: flex;
  align-items: flex-end;
}

.login-sheet {
  width: 100%;
  background: rgba(13,17,28,0.97);
  border-radius: 24px 24px 0 0;
  border: 1px solid rgba(245,197,24,0.25);
  border-bottom: none;
  padding: 32px 24px;
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease forwards;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.sheet-handle {
  width: 36px; height: 4px;
  background: rgba(245,197,24,0.3);
  border-radius: 2px;
  margin: 0 auto 24px;
}
```

---

## 8. Dark Overlay System

```css
/* Login page — heavy dark, stadium barely visible */
.overlay-heavy { background: rgba(10, 14, 26, 0.82); }

/* Leaderboard — medium, stadium atmosphere shows through */
.overlay-medium { background: rgba(10, 14, 26, 0.88); }

/* Dashboard cards — semi-transparent dark */
.overlay-card   { background: rgba(17, 24, 39, 0.85); }

/* Input fields — deepest dark */
.overlay-input  { background: rgba(10, 14, 26, 0.95); }
```

---

## 9. Icon System

All icons use **Lucide React** (free, open source).

```jsx
import {
  Home,          // Dashboard nav
  Crosshair,     // Predict nav
  ClipboardList, // My Picks nav
  BarChart2,     // Leaderboard nav
  Settings,      // Settings nav
  HelpCircle,    // How to Play nav
  LogOut,        // Logout nav
  Star,          // Points badge
  Shield,        // Level badge
  Trophy,        // Divider icon
  Globe,         // Global competition feature
  Target,        // Predict matches feature
  ChevronDown,   // Dropdown arrow
  ChevronUp,     // Score input arrow up
  ChevronDown,   // Score input arrow down
  Check,         // Correct prediction
  Bell,          // Mobile notification
} from 'lucide-react';
```

**Icon sizing:**
```
Sidebar nav:      18px, stroke-width 1.5
Bottom nav:       22px, stroke-width 1.5
Feature icons:    28px, stroke-width 1.5
Inline small:     16px, stroke-width 2
Badge/chip:       14px, stroke-width 2
```

---

## 10. Responsive Breakpoints

```css
/* Mobile first */
--screen-sm:  640px   /* Large phones */
--screen-md:  768px   /* Tablets */
--screen-lg:  1024px  /* Small laptops / iPad landscape */
--screen-xl:  1280px  /* Desktop */

/* Sidebar behavior */
@media (max-width: 1024px) {
  .sidebar     { display: none; }           /* Hidden */
  .bottom-nav  { display: grid; }           /* Shown */
  .main-content { padding-bottom: 80px; }   /* Space for bottom nav */
}

@media (min-width: 1024px) {
  .sidebar     { display: flex; }
  .bottom-nav  { display: none; }
  .main-content { margin-left: 220px; }
}
```

---

## React Component Tree

```
App
├── AuthProvider
│   └── Router
│       ├── LoginPage
│       │   ├── StadiumBackground
│       │   ├── BokehParticles
│       │   └── LoginCard
│       │       ├── TrophyHero
│       │       ├── LoginTitle
│       │       ├── GoogleSignInButton
│       │       └── LoginFooter
│       └── AppShell (authenticated)
│           ├── Sidebar (desktop)
│           ├── BottomNav (mobile)
│           └── MainContent
│               ├── Dashboard
│               │   ├── HeaderBar
│               │   ├── LiveMatchCard
│               │   │   ├── LiveBadge
│               │   │   ├── ScoreRow
│               │   │   └── GoalscorerList
│               │   ├── PredictionCard
│               │   └── NextMatchRow
│               ├── PredictPage
│               │   ├── MatchHeader
│               │   ├── ScoreInput
│               │   ├── MOTMDropdown
│               │   ├── BonusToggle
│               │   └── SubmitButton
│               ├── MyPredictions
│               │   └── PredictionHistoryTable
│               └── Leaderboard
│                   ├── TrophyHero
│                   └── LeaderboardTable
```

---

*UI.md v1.0 — WC26 Predictor — RIT.ac.in*
