# OCEANVIS-3D — VIBRANT SCIENTIFIC OCEAN-VISUALIZATION PALETTE UPGRADE
## DESIGN SYSTEM SPECIFICATION & VERIFICATION AUDIT

**Date:** September 05, 2026  
**Project:** OceanVis-3D (SIH26067)  
**Target:** Modern Scientific Visualization + Oceanography + High-End Data Interface  
**Baseline Commits:** 0c9c48 (Phase 1) -> 175a9c5 (Phase 2A P0) -> 7ff1963 (Phase 2B P1) -> 2d07eaa (P1.5 Substrate) -> 26d823 (Particle Visibility) -> 923c3a1 (UI Chrome) -> c3082f (Landing Experience)

---

## 1. DESIGN SYSTEM TRANSFORMATION OVERVIEW

The OceanVis-3D visual design system has been upgraded to a **vibrant, modern scientific ocean-visualization palette**. The aesthetic strikes an exact balance between high-contrast scientific readability, rich oceanic depth tones, and restrained institutional professionalism (MoES / INCOIS).

### Visual Hierarchy & Balance Ratio
- **80% Dark Neutral Surfaces:** #06111F (deep abyssal ocean background), #0B1B2B (primary surface/header/rail), #0D2033 (drawers/cards), and #122A40 (elevated cards/buttons).
- **15% Scientific Data Colors:** Strict semantic color separation communicating temperature, salinity, currents, and Argo profiling CTD metrics.
- **5% Vibrant Interaction Accents:** #22D3EE (cyan) and #2DD4BF (teal) reserved strictly for primary actions, active navigation, and selected interactive states.

---

## 2. COLOR PALETTE SPECIFICATION MATRIX

| Token | Hex Code | Role & Semantics |
| :--- | :--- | :--- |
| --bg-primary | #06111F | Deep oceanic base canvas |
| --bg-secondary | #0B1B2B | Header, control rail background, primary structure |
| --bg-tertiary | #10263D | Flyout panels, card backgrounds, modal headers |
| --surface-primary | #0D2033 | Analysis drawer, flyout body, container surfaces |
| --surface-secondary | #122A40 | Interactive card default state, secondary buttons |
| --surface-elevated | #17344D | Active flyout card, hovered components |
| --border-subtle | #18384F | Subtle component division lines |
| --border-default | #1E3A52 | Standard card and header borders |
| --border-strong | #28516B | Elevated boundary lines, secondary button borders |
| --text-primary | #F8FAFC | Primary typography, headers, main values |
| --text-secondary | #CBD5E1 | Subtitles, labels, secondary button text |
| --text-muted | #94A3B8 | Metadata, unit tags, inactive icons |
| --text-disabled | #64748B | Disabled controls, footer links |
| --accent-primary | #22D3EE | Primary brand accent, main CTAs, active pills |
| --accent-secondary | #2DD4BF | Gradient companion, secondary scientific focus |
| --accent-deep | #0891B2 | Gradient anchor, deeper ocean highlight |
| --argo | #FBBF24 | In-situ Argo profiling float beacons, CTD observation points |
| --success | #34D399 | Post-EnOI assimilation improvement, QC passed |
| --warning | #FBBF24 | Model bias alerts, telemetry warnings |
| --error | #F43F5E | Critical deviations, error boundaries |
| --info | #38BDF8 | Status readouts, probe coordinate markers |

---

## 3. SCIENTIFIC DATA COLOR ENCODING

Scientific data colors communicate **DATA**, never decorative noise:

1. **Potential Temperature (°C):**
   - Cold: #38BDF8 | Neutral: #22D3EE | Warm: #FB923C | Hot: #F43F5E
   - Gradient indicator strip added directly inside the variable card.
2. **Practical Salinity (PSU):**
   - Low: #67E8F9 | Medium: #818CF8 | High: #A78BFA | Very High: #C084FC
   - Salinity gradient strip added inside the variable card.
3. **Current Velocity (m/s):**
   - Low: #22D3EE | Medium: #34D399 | High: #A3E635 | Very High: #FACC15
   - Dynamic velocity gradient strip inside the variable card.
4. **Argo Observations:**
   - Float marker cores and radar pulses styled in **Amber** (#FBBF24), turning **Emerald** (#34D399) upon selection.

---

## 4. BUTTON & INTERACTION STATES

- **Primary Button (.btn-landing-primary, .header-btn.primary, .region-hud-enter-btn):**
  - Background: #22D3EE
  - Text: #06111F (High-contrast dark on cyan)
  - Hover: #67E8F9 with subtle elevation (	ransform: translateY(-1px))
  - Active: #0891B2
- **Secondary Button (.btn-landing-secondary, .header-btn):**
  - Background: #122A40
  - Border: 1px solid #28516B
  - Text: #CBD5E1
  - Hover: #17344D with #22D3EE border accent
- **Control Rail (.rail-btn):**
  - Default: Muted slate icon (#94A3B8)
  - Hover: Cyan icon (#22D3EE) on #122A40 surface
  - Active: Cyan icon (#22D3EE) on subtle cyan-tinted surface (gba(34, 211, 238, 0.12)) with #22D3EE border
- **Zero Emojis Enforced:**
  - 100% precision inline SVG vector icons across landing navigation, header, control rail, flyouts, status bar, and analysis drawer.

---

## 5. ZERO SCIENTIFIC REGRESSION CERTIFICATION

Line-by-line verification confirms that zero physics, mathematical sampling, or WebGL rendering logic was altered:
- sampleTemperature(), sampleSalinity(), and sampleCurrent() in src/data/modelData.js: **UNTOUCHED**
- Continuous Turbo, Haline, and Speed colormap samplers in src/utils/colormaps.js: **UNTOUCHED**
- Localized EnOI assimilation (unLocalizedEnOI): **UNTOUCHED**
- Scientific statistical engines (calculateRMSE, calculateBias, calculateMaxError): **UNTOUCHED**
- P0-1 Global $\rightarrow$ Depth transition state machine & P0-2 optical attenuation fog in src/components/OceanViewer.js: **UNTOUCHED**
- High-fidelity NASA raster Earth substrate: **UNTOUCHED**

---

## 6. PRODUCTION BUILD & VISUAL QA RESULTS

- **Production Build:**
  `	ext
  vite v6.4.3 building for production...
  ✓ 22 modules transformed.
  dist/index.html                  12.99 kB │ gzip:   3.95 kB
  dist/assets/index-GaaXlp1i.css   57.49 kB │ gzip:  14.07 kB
  dist/assets/index-BYhNkrk_.js   890.80 kB │ gzip: 241.88 kB
  ✓ built in 12.96s — Exit code 0
  `

- **Visual QA Captures (1600x900 Viewport):**
  - **Landing Page:** docs/audits/verify_landing_vibrant.png (Crisp vibrant hero, high-contrast cyan CTAs, restrained #06111F / #0D2033 surface grid).
  - **Dashboard Workspace:** docs/audits/verify_dashboard_vibrant.png (Restrained #0B1B2B header, #22D3EE active pills, #FBBF24 Argo beacons, vibrant and readable analysis drawer).

---

## 7. ACCESS & NAVIGATION URLS

- **Landing Experience:** http://127.0.0.1:5173/
- **Scientific Dashboard Workspace:** http://127.0.0.1:5173/#dashboard
