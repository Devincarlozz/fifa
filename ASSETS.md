# 🎨 WC26 Predictor — Asset Generation Guide

Complete list of every visual asset needed to build the WC26 Predictor UI,
with generation prompts for Midjourney, DALL·E, Adobe Firefly, and Stable Diffusion.

---

## Folder Structure

```
/assets
  /backgrounds
      stadium-night-aerial.jpg
      stadium-overlay-dark.png
      gold-light-rays.png
      gold-bokeh.png
      stadium-sideline-night.jpg

  /logo
      wc26-logo-gold.svg
      wc26-logo-white.svg
      trophy-icon.svg
      trophy-icon-gold.png

  /icons
      icon-home.svg
      icon-predict.svg
      icon-mypicks.svg
      icon-leaderboard.svg
      icon-settings.svg
      icon-logout.svg
      icon-live-badge.svg
      icon-goal.svg
      icon-yellow-card.svg
      icon-red-card.svg
      icon-medal-gold.svg
      icon-medal-silver.svg
      icon-medal-bronze.svg
      icon-points-star.svg
      icon-target.svg
      icon-globe.svg

  /auth
      google-g-logo.svg

  /flags
      (all 48 WC2026 team flags — circular format)

  /ui
      glass-reflection.png
      gold-glow-border.png
      divider-trophy.svg
      gold-line.svg
      card-bg-dark.png
      leaderboard-trophy.png

  /mockups
      iphone-15-frame.png
      desktop-browser-frame.png

  /fonts
      NType82-Bold.otf
      NType82-Black.otf
      Inter-Regular.ttf
      Inter-Medium.ttf
      Inter-SemiBold.ttf

  /video (optional)
      stadium-loop.mp4
      particles-loop.webm
      light-sweep.webm
```

---

## 1. Background Assets

---

### A. `stadium-night-aerial.jpg` — Login Page Background

**Usage:** Full-screen background on login page, covered with 80% dark overlay.
As seen in Image 2 — top-down circular stadium at night, dark navy tones.

**Midjourney Prompt:**
```
aerial top-down drone photography of a modern football stadium 
at night, circular architecture, floodlights on, dark navy blue 
tones, empty stands, photorealistic, 8K, no people, cinematic 
lighting, deep shadows, ultra wide angle --ar 16:9 --style raw --v 6
```

**DALL·E / Firefly Prompt:**
```
Top-down aerial drone photograph of a large modern circular 
football stadium at night. Floodlights illuminate the empty 
green pitch. Dark navy and charcoal color tones. The stadium 
structure fills the frame. Photorealistic, cinematic, 8K quality.
```

**Stable Diffusion Prompt:**
```
aerial view football stadium night, top down drone shot, 
circular stadium architecture, floodlights, dark navy blue, 
empty pitch, photorealistic, 8k uhd, cinematic, dji drone shot
```

**Specs:** 3840×2160px JPG, dark navy dominant, stadium centered

---

### B. `stadium-sideline-night.jpg` — Dashboard Background

**Usage:** Widescreen background visible on Dashboard and Leaderboard pages.
As seen in Image 1 bottom-right — low-angle sideline view with golden floodlights.

**Midjourney Prompt:**
```
wide angle photographic view from the sideline of a massive 
football stadium at night, golden floodlights blazing, green 
pitch visible, packed stands in darkness, cinematic atmosphere, 
bokeh crowd, golden haze, fog, dramatic lighting, 8K --ar 16:9 
--style raw --v 6
```

**DALL·E / Firefly Prompt:**
```
Wide-angle photograph from the sideline of a large football 
stadium at night. Golden floodlights beam down from tall 
pylons. The green grass pitch glows. Dark atmospheric sky. 
Cinematic, high contrast, golden and navy tones.
```

**Specs:** 3840×2160px JPG, golden floodlight glow, low angle

---

### C. `gold-light-rays.png` — Light Rays Overlay

**Usage:** Transparent overlay behind login card, adds premium atmosphere.

**Midjourney Prompt:**
```
volumetric gold light rays beams shining downward, isolated on 
pure black background, soft god rays, transparent feel, cinematic 
lighting effect, no objects, abstract, golden yellow #F5C518, 
photorealistic light rendering --ar 9:16 --style raw
```

**DALL·E / Firefly Prompt:**
```
Soft golden volumetric light rays beaming downward on a pure 
black background. Warm gold color #F5C518. No objects, purely 
abstract light effect. Transparent overlay style.
```

**Specs:** 1080×1920px PNG with transparency, gold rays on black

---

### D. `gold-bokeh.png` — Floating Bokeh Particles

**Usage:** Scattered golden dust particles floating across the screen for luxury depth.

**Midjourney Prompt:**
```
floating golden bokeh light particles on pure black background, 
small glowing orbs of light, various sizes, scattered randomly, 
warm gold and amber tones, luxury aesthetic, transparent overlay 
feel, no background, abstract --ar 16:9 --style raw
```

**DALL·E / Firefly Prompt:**
```
Floating golden bokeh particles on a pure black background. 
Small and medium glowing gold orbs scattered across the frame. 
Warm gold #F5C518 and amber tones. Abstract luxury light effect.
```

**Specs:** 1920×1080px PNG with transparency

---

## 2. Brand Assets

---

### E. `trophy-icon-gold.png` — World Cup Trophy

**Usage:** Top of login card (Image 2), sidebar logo (Image 1).
3D gold trophy, highly detailed, transparent background.

**Midjourney Prompt:**
```
3D rendered gold FIFA World Cup trophy, highly detailed metallic 
surface, warm gold color #F5C518, dramatic studio lighting with 
soft shadows, isolated on pure black transparent background, 
centered composition, 4K render, no background, product shot 
--ar 1:1 --style raw --v 6
```

**DALL·E / Firefly Prompt:**
```
3D rendered gold football World Cup trophy. Highly detailed 
gold metallic surface with reflections. Warm golden color. 
Dramatic lighting with a glowing base. Isolated on pure black 
background. Product photography style. 4K quality.
```

**Stable Diffusion Prompt:**
```
3d rendered gold world cup trophy, isolated black background, 
metallic gold surface, dramatic lighting, glowing base, 
product photography, 4k, hyperrealistic
```

**Specs:** 512×512px PNG with transparent background

---

### F. `leaderboard-trophy.png` — Large Leaderboard Trophy

**Usage:** Large hero trophy at top of Leaderboard page (Image 1, panel 2).
Bigger, more dramatic version with laurel wreath glow effect.

**Midjourney Prompt:**
```
large dramatic 3D gold trophy with laurel wreath around the base, 
golden glow radiating outward, warm light beams, isolated on dark 
navy background, cinematic render, god rays effect, luxury sports 
award, 4K --ar 1:1 --style raw
```

**Specs:** 512×512px PNG, dramatic glow effect

---

### G. `wc26-logo-gold.svg` — App Logo (Header/Sidebar)

**Usage:** Top-left corner of sidebar (Image 1) and login card top-left (Image 2).
Trophy icon + "WC26" + "PREDICTOR" stacked text.

> **Note:** SVGs with custom fonts must be built in Figma or Illustrator.
> Use the AI prompt below to get the visual reference, then recreate in Figma.

**Midjourney Visual Reference Prompt:**
```
small compact logo design for "WC26 PREDICTOR", gold color palette, 
contains a tiny trophy icon on the left, bold condensed NType 82 
style typography, "WC26" large text above "PREDICTOR" smaller text, 
dark background, clean minimal design, flat vector style --ar 1:1
```

**SVG Code Skeleton (build in Figma):**
```svg
<!-- Trophy icon (left) + text stack (right) -->
<!-- Font: NType 82 Bold, Color: #F5C518 -->
<svg viewBox="0 0 120 40">
  <image href="trophy-icon.svg" x="0" y="0" width="32" height="32"/>
  <text x="38" y="14" font-family="NType82" font-size="16" fill="#F5C518">WC26</text>
  <text x="38" y="28" font-family="NType82" font-size="10" fill="#F5C518">PREDICTOR</text>
</svg>
```

---

## 3. Navigation Icons

All icons should be: **SVG, 24×24px, gold #F5C518 (active) / grey #9CA3AF (inactive)**

---

### H. Navigation Icon Set

**Usage:** Sidebar (desktop) and bottom nav bar (mobile). As seen in both images.

**Midjourney Prompt (for visual reference sheet):**
```
flat vector icon set for a football prediction app, line icons, 
gold color on dark background, icons include: home/house, 
crosshair/predict target, clipboard/my picks, bar chart/leaderboard, 
settings gear, logout arrow, 24x24px each, minimal clean design, 
consistent stroke weight, white icons on dark navy --ar 16:9
```

**Individual Icon Sources (recommended — use directly):**

| Icon | Name | Source |
|---|---|---|
| 🏠 Home | `icon-home.svg` | Lucide Icons — `home` |
| ⚽ Predict | `icon-predict.svg` | Lucide Icons — `crosshair` |
| 📋 My Picks | `icon-mypicks.svg` | Lucide Icons — `clipboard-list` |
| 📊 Leaderboard | `icon-leaderboard.svg` | Lucide Icons — `bar-chart-2` |
| ⚙️ Settings | `icon-settings.svg` | Lucide Icons — `settings` |
| 🚪 Logout | `icon-logout.svg` | Lucide Icons — `log-out` |

> Download free from: https://lucide.dev

---

## 4. Match Event Icons

**Usage:** Live match card — goalscorers, cards, events (Image 1).

---

### I. `icon-goal.svg` — Goal / Football Icon

**Midjourney Prompt:**
```
flat minimal vector football soccer ball icon, black and white 
panels, gold outline, 24x24 icon design, clean simple --ar 1:1
```

**Source:** Use `⚽` emoji as SVG or download from FlatIcon — search "football icon gold"

---

### J. `icon-yellow-card.svg` + `icon-red-card.svg`

**Prompt (reference):**
```
flat vector referee card icons, yellow card rectangle and red card 
rectangle, minimal design, slightly rotated 15 degrees, 24x24px, 
gold/amber yellow and bright red colors, clean vector --ar 1:1
```

**CSS alternative (no image needed):**
```css
.yellow-card { background: #EAB308; width: 12px; height: 16px; 
               border-radius: 2px; transform: rotate(15deg); }
.red-card    { background: #EF4444; width: 12px; height: 16px; 
               border-radius: 2px; transform: rotate(15deg); }
```

---

## 5. Leaderboard Medal Icons

**Usage:** Rank badges for positions 1, 2, 3 on leaderboard (Image 1, panel 2).

---

### K. `icon-medal-gold.svg`, `icon-medal-silver.svg`, `icon-medal-bronze.svg`

**Midjourney Prompt:**
```
flat vector medal badge icons for 1st 2nd 3rd place, circular 
medal with number inside, gold silver and bronze metallic colors, 
minimal flat design, 32x32px, dark background --ar 1:1
```

**Source:** Use Lucide `medal` icon or CSS circle badges:
```css
.rank-1 { background: #F5C518; color: #000; }
.rank-2 { background: #C0C0C0; color: #000; }
.rank-3 { background: #CD7F32; color: #fff; }
```

---

## 6. Team Flag Circular Badges

**Usage:** Match cards, prediction form, next match row (Images 1 & 2).

---

### L. Circular Country Flag Set (48 Teams)

**Format:** 64×64px circular PNG with subtle gold border ring.

**Midjourney Prompt (example — Brazil):**
```
circular flag badge of Brazil, round shape, green yellow circle 
with blue diamond and stars, gold ring border, flat icon style, 
64x64, transparent background --ar 1:1 --style raw
```

**Recommended Source (free, no generation needed):**
- https://flagcdn.com — free SVG/PNG flags for all countries
- https://github.com/hampusborgos/country-flags

**CSS to make flags circular:**
```css
.flag {
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 2px solid #F5C518;
  object-fit: cover;
}
```

---

## 7. UI Decoration Assets

---

### M. `gold-glow-border.png` — Card Glow Effect

**Usage:** Glowing gold border around login card and live match card.

**Midjourney Prompt:**
```
soft glowing gold rectangular border frame, rounded corners, 
warm gold color #F5C518, inner dark void, outer glow diffused, 
isolated on black background, UI card frame design, 
transparent style --ar 3:4 --style raw
```

**CSS Alternative (preferred):**
```css
.glow-card {
  border: 1px solid rgba(245, 197, 24, 0.4);
  box-shadow: 0 0 20px rgba(245, 197, 24, 0.15),
              0 0 60px rgba(245, 197, 24, 0.05),
              inset 0 1px 0 rgba(245, 197, 24, 0.1);
}
```

---

### N. `glass-reflection.png` — Glassmorphism Overlay

**Usage:** Top of frosted glass cards for realism.

**Midjourney Prompt:**
```
glass surface reflection overlay, subtle light streak across 
dark frosted glass, transparent PNG, white to transparent gradient, 
angled soft reflection, UI glassmorphism texture, minimal --ar 4:3
```

**CSS Alternative (preferred):**
```css
.glass-card {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 197, 24, 0.25);
}
```

---

### O. `divider-trophy.svg` — Section Divider

**Usage:** Between subtitle and footer text on login card (Image 2).
Small trophy icon flanked by thin gold lines.

**Midjourney Prompt:**
```
minimalist decorative divider line with small trophy icon in center, 
gold color, flat vector, horizontal layout, thin lines on each side, 
SVG style, dark background --ar 8:1
```

**SVG Code:**
```svg
<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="10" x2="80" y2="10" stroke="#F5C518" 
        stroke-width="1" opacity="0.5"/>
  <text x="100" y="15" text-anchor="middle" font-size="14" 
        fill="#F5C518">🏆</text>
  <line x1="120" y1="10" x2="200" y2="10" stroke="#F5C518" 
        stroke-width="1" opacity="0.5"/>
</svg>
```

---

### P. `live-badge.svg` — LIVE Indicator

**Usage:** Red pulsing LIVE badge on active match cards (Image 1).

**CSS (no image needed):**
```css
.live-badge {
  background: #EF4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
```

---

## 8. Points & Score UI Assets

---

### Q. `icon-points-star.svg` — Points Badge

**Usage:** Points display in header — "⭐ 2,450 PTS" (Image 1 top-right).

**Source:** Lucide `star` icon, filled gold `#F5C518`

---

### R. `icon-shield.svg` — Level Badge

**Usage:** Player level badge in header — "Level 12 🛡" (Image 1).

**Source:** Lucide `shield` icon

---

## 9. Feature Icons (Dashboard Promo Section)

**Usage:** Bottom-right promo area of Image 1 — 4 feature icons with labels.

| Icon | Label | Lucide Name |
|---|---|---|
| 🎯 | Predict Matches | `crosshair` |
| ⭐ | Earn Points | `star` |
| 🏆 | Climb the Ranks | `trophy` |
| 🌍 | Global Competition | `globe` |

**Midjourney Prompt (full icon set reference):**
```
4 flat vector icons in gold color on dark navy background: 
crosshair target, star with rays, trophy cup, globe/earth, 
minimal line art style, consistent 48x48 design, 
gold #F5C518 color, clean modern --ar 16:4
```

---

## 10. Authentication Asset

---

### S. `google-g-logo.svg` — Google Sign-In Button Logo

**Usage:** "Sign in with Google" button on login page (Image 2).

**Source (official, free):**
Download directly from Google's brand guidelines:
https://developers.google.com/identity/branding-guidelines

```svg
<!-- Use Google's official SVG — do not recreate -->
<!-- Download: https://developers.google.com/identity/branding-guidelines -->
```

> ⚠️ Do not AI-generate the Google logo — use only the official asset
> to comply with Google's brand guidelines.

---

## 11. Typography Assets

---

### T. NType 82 — Display Font

**Usage:** "WC26 PREDICTOR", "DASHBOARD", "LEADERBOARD", all scores (BRA 2–1 ARG).

| Weight | File | Use |
|---|---|---|
| Bold | `NType82-Bold.otf` | Headings, page titles |
| Black | `NType82-Black.otf` | Score numbers, hero text |

**Download:** https://fonts.google.com/specimen/Ntype82
or search "NType82" on Google Fonts

---

### U. Inter — UI Body Font

**Usage:** All body text, labels, subtitles, table rows.

| Weight | File |
|---|---|
| Regular (400) | `Inter-Regular.ttf` |
| Medium (500) | `Inter-Medium.ttf` |
| SemiBold (600) | `Inter-SemiBold.ttf` |

**Download:** https://fonts.google.com/specimen/Inter (free)

---

## 12. Presentation Mockup Assets

---

### V. `iphone-15-frame.png` — iPhone Mockup Frame

**Usage:** Wrapping mobile screens for Figma/Dribbble presentations (Image 1 & 2).

**Midjourney Prompt:**
```
iPhone 15 Pro smartphone device mockup frame, black titanium 
finish, isolated on transparent background, front facing, 
no screen content, clean product shot, PNG transparent --ar 9:19
```

**Free Sources:**
- https://www.ls.graphics/free-mockups
- https://mockuphone.com
- Search "iPhone 15 Pro mockup transparent PNG" on Figma Community

---

### W. `desktop-browser-frame.png` — Browser Window Frame

**Usage:** Wrapping desktop screen for presentations (Image 2 left panel).

**Midjourney Prompt:**
```
dark mode web browser window frame mockup, macOS Safari style, 
dark charcoal chrome, address bar visible, no screen content, 
transparent PNG, clean minimal design --ar 16:10
```

**Free Source:** Figma Community — search "browser mockup dark"

---

## 13. Optional Motion / Video Assets

---

### X. `stadium-loop.mp4` — Animated Background

**Usage:** Replace static stadium image with looping video for premium feel.

**Prompt for Runway / Pika / Sora:**
```
slow cinematic aerial drone flyover of a football stadium at 
night, golden floodlights, green pitch, dark navy sky, 
15 second seamless loop, no camera shake, slow smooth motion, 
4K, dark atmospheric
```

---

### Y. `particles-loop.webm` — Floating Gold Particles

**Usage:** Ambient particle animation overlay on dashboard/login.

**Prompt for Runway:**
```
floating golden dust particles drifting slowly upward on black 
background, bokeh light orbs, warm gold and amber, slow gentle 
movement, 10 second seamless loop, transparent background, 
no flash or sudden movements
```

---

### Z. `light-sweep.webm` — Gold Light Sweep

**Usage:** One-time animation on page load for impact.

**Prompt for Runway:**
```
single slow horizontal gold light beam sweeping left to right 
across a dark background, volumetric lens flare effect, 
warm gold color, 3 second animation, cinematic, transparent 
background overlay style
```

---

## Quick Start Priority List

If you're building this now, get these **6 assets first** — everything else can be CSS:

| Priority | Asset | Where to Get |
|---|---|---|
| 1 | Stadium aerial night background | Midjourney prompt A above |
| 2 | Gold World Cup trophy PNG | Midjourney prompt E above |
| 3 | NType 82 font | Google Fonts |
| 4 | Google G logo SVG | Google Brand Guidelines |
| 5 | Country flag PNGs (48 teams) | flagcdn.com |
| 6 | Lucide icon set | lucide.dev |

> Everything else — glassmorphism, glow borders, gold lines, LIVE badge,
> card backgrounds, overlays — can be built entirely with **CSS**.

---

*ASSETS.md v1.0 — WC26 Predictor — RIT.ac.in*
