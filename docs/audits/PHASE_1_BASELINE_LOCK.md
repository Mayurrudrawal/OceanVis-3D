# PHASE_1_BASELINE_LOCK.md
**Project**: OceanVis-3D (SIH26067)  
**Status**: PHASE 1 BASELINE LOCKED  

---

> The current implementation is now frozen as the Phase-1 visual baseline. Future modifications must be compared against `OCEANVIS_3D_AUDIT_MASTER.md` and must preserve existing scientific functionality unless explicitly approved.

---

## Baseline Verification Metadata
- **Project**: OceanVis-3D
- **Problem Statement**: SIH 2026 — SIH26067
- **Repository Remote**: `https://github.com/Mayurrudrawal/OceanVis-3D.git`
- **GitHub Owner**: `Mayurrudrawal` (Verified)
- **Git Branch**: `main`
- **Head Commit Hash**: `49b099a`
- **Working Tree Build Status**: `PASS` (Vite v6.4.3 production build succeeded in 19.48s with 0 errors)
- **Runtime Performance**: 60 FPS verified on standard WebGL 2.0 pipeline
- **Date / Time of Baseline Lock**: 2026-09-04 23:51:30 IST
- **Authoritative Forensic Audit**: `docs/audits/OCEANVIS_3D_AUDIT_MASTER.md`
- **Baseline System Manifest**: `docs/audits/OCEANVIS_3D_BASELINE.md`

## Change Freeze Invariants
Under this freeze, the following foundational subsystems must be preserved without replacement or disruption:
1. **Frontend Architecture**: Vite + Three.js + Chart.js + Vanilla ES Modules.
2. **Analytical Samplers**: Deterministic continuous 3D field samplers for $(u, v, w, T, S)$ in `src/data/modelData.js`.
3. **Tracer Particle Paradigm**: Subtle, translucent, non-glowing water tracer particles (`size: 2.2`, `opacity: 0.25`, normal blending).
4. **Color Science**: Non-divergent perceptual colormaps (Turbo for thermal, Haline for salinity, Speed for velocity).
5. **Observational Baseline**: 10 D-Mode QC Argo floats with 8 standard CTD depth levels.
6. **Validation Pipeline**: GODAE OceanView (GOV) metrics ($RMSE$, $Bias$, $\Delta\text{Max}$) and step-by-step Localized EnOI assimilation demonstration.
