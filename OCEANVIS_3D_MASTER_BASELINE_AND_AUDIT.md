# OCEANVIS_3D_MASTER_BASELINE_AND_AUDIT.md
**Project**: OceanVis-3D (SIH 2026 Problem Statement SIH26067)  
**Repository**: https://github.com/Mayurrudrawal/OceanVis-3D.git  
**Owner**: Mayurrudrawal  
**Branch**: main  
**Commit**: a0c9c48  
**Build Status**: PASS (Vite production build verified in 5.67s, 0 errors)  
**Runtime Performance**: 60 FPS on standard WebGL 2.0 pipeline  
**Status**: PHASE 1 BASELINE LOCKED — READY FOR PHASE 2 PROFESSIONAL 3D UPGRADE  

---

# SECTION 1: PHASE 1 CHANGE FREEZE & BASELINE LOCK

> The current implementation is now frozen as the Phase-1 visual baseline. Future modifications must be compared against this document and must preserve existing scientific functionality unless explicitly approved.

### Baseline Invariants:
1. **Frontend Architecture**: Vite + Three.js + Chart.js + Vanilla ES Modules.
2. **Analytical Samplers**: Deterministic continuous 3D field samplers for $(u, v, w, T, S)$ in `src/data/modelData.js`.
3. **Tracer Particle Paradigm**: Subtle, translucent, non-glowing water tracer particles (`size: 2.2`, `opacity: 0.25`, normal blending).
4. **Color Science**: Non-divergent perceptual colormaps (Turbo for thermal, Haline for salinity, Speed for velocity).
5. **Observational Baseline**: 10 D-Mode QC Argo floats with 8 standard CTD depth levels.
6. **Validation Pipeline**: GODAE OceanView (GOV) metrics ($RMSE$, $Bias$, $\Delta\text{Max}$) and step-by-step Localized EnOI assimilation demonstration.

---

# SECTION 2: SYSTEM BASELINE MANIFEST

- **Problem Statement**: SIH26067 (3D Interactive Oceanographic Model Validation, Argo Observation Verification, and Localized EnOI Data Assimilation Workspace)
- **Scientific Components**:
  - **Temperature**: Continuous analytical 3D field sampler with 4-layer vertical stratification (Mixed layer, Sigmoidal thermocline, Intermediate water, Abyssal decay), warm anticyclonic eddy ($15.5^\circ\text{N}$), cold cyclonic eddy ($10.8^\circ\text{N}$), and coastal upwelling.
  - **Salinity**: Northern Bay of Bengal Ganges freshwater river plume ($<30.5\text{ PSU}$), barrier layer, subsurface salinity maximum ($35.25\text{ PSU}$ at $115\text{m}$ depth), and uniform deep water ($34.75\text{ PSU}$).
  - **Velocity**: Continuous vector field $(u, v, w)$ driving Lagrangian particle advection; features the East India Coastal Current (EICC northward boundary jet up to $1.1\text{ m/s}$), geostrophic gyres, and vertical upwelling/downwelling velocity $w$.
  - **Argo**: 10 real-world formatted profiling floats (Apex, Provor-CTS4 Bio-Argo, Navis-BGC) with D-Mode QC flags and 8 standard CTD depths ($0, 10, 50, 100, 200, 500, 1000, 2000\text{m}$).
  - **RMSE / Bias**: Complete mathematical GOV validation metrics calculation dynamically comparing CTD observations vs model predictions.
  - **EnOI**: Step-by-step 5-stage algorithmic pipeline demonstration simulating innovation vector calculation, Gaspari-Cohn spatial localization ($L = 150\text{km}$), and state vector nudging.
  - **Bathymetry**: 3D analytical seabed geometry modeling continental shelves and abyssal plain down to $3850\text{m}$.
  - **Depth Slicing**: Dynamic horizontal cutting plane slicing standard oceanographic Z-levels ($0\text{m}$ to $2000\text{m}$).

- **Visualization Modes**:
  - **Global Basin**: 3D Earth globe with limb-darkening atmospheric rim, equirectangular canvas texture, active Bay of Bengal bounding box ($7.5^\circ\text{–}22.5^\circ\text{N}$, $79.5^\circ\text{–}95.5^\circ\text{E}$), and surface Argo beacon pins.
  - **Depth 3D**: Volumetric ocean cutaway column ($0\text{m}$ to $-2000\text{m}$) featuring procedural Gerstner surface waves, translucent water tracers (5,500 particles, `size: 2.2`, `opacity: 0.25`, normal blending), 3D buoys with profiling tethers, vertical depth ruler, and directional bounding cage.

---

# SECTION 3: COMPLETE FORENSIC AUDIT & QUALITY ANALYSIS

### 3.1 Architecture & State Trace
```
[User Interaction / Rail / Tour]
         │
         ▼
[ControlPanel.state / app.js] ──────► [StatusBar.update]
         │
         ├──► [OceanViewer.updateState] 
         │         │
         │         ├──► [Continuous Field Samplers: sampleTemperature / sampleSalinity / sampleCurrent]
         │         │         │
         │         │         ├──► Particle Advection: (u, v, w) updates tracer position (lat, lon, depth)
         │         │         └──► Particle Tint: scalar sample normalized & mapped through colormaps.js
         │         │
         │         └──► [Depth Slicer & Bathymetry Surface & 3D Argo Floats]
         │
         └──► [ProfilePanel.updateProfilesAndMetrics]
                   │
                   ├──► [argoData.js vs getModelProfile]
                   ├──► [rmse.js: calculateRMSE / calculateBias]
                   └──► [enoi.js: runLocalizedEnOI] ──► Updates Chart.js & triggers Three.js Pulse
```

### 3.2 Visual Quality Scorecard (Score: 1–10)
- **Geographic Realism**: 7/10
- **Ocean Realism**: 8/10
- **Water Rendering**: 7/10
- **Bathymetry**: 6/10
- **Particle Rendering**: 8/10
- **Current Visualization**: 8/10
- **Argo Visualization**: 9/10
- **Depth Readability**: 8/10
- **Lighting**: 7/10
- **Camera Behavior**: 8/10
- **Spatial Hierarchy**: 8/10
- **UI Hierarchy**: 9/10
- **Information Density**: 9/10
- **Color Science**: 9/10
- **Scientific Credibility**: 9/10
- **Professional Polish**: 8.5/10
- **Overall Average**: **8.03 / 10**

### 3.3 Critical Particle & Depth Audits
1. **Particle System**: 5,500 particles are rendered with soft Gaussian alpha discs, normal blending, `opacity: 0.25`, and `size: 2.2`. Physical advection is governed strictly by $(u, v, w)$ from `sampleCurrent`, while particle tints continuously interpolate across scalar fields without affecting velocity.
2. **Depth Water Column**: Clear thermal stratification ($35\text{m}$ to $250\text{m}$ thermocline) and halocline river plume are visible. However, the scene lacks volumetric light extinction (Beer-Lambert attenuation) and vertical lateral enclosure walls.

### 3.4 Top 10 Ranked Problems (P0 – P3)
- **P0-1**: Hard Global ➔ Depth scene swap breaks spatial continuity.
- **P0-2**: Lack of volumetric underwater attenuation (infinite clarity at $-2000\text{m}$).
- **P1-1**: Procedural 2D vector Earth texture looks synthetic.
- **P1-2**: Open lateral depth cage lacks translucent water cutaway walls.
- **P1-3**: Current streamlines lack static directional vector cues.
- **P2-1**: Depth slicing does not isolate or focus particles within the active layer.
- **P2-2**: Seabed bathymetry floor is a mathematical radial bowl without ridge lines.
- **P2-3**: Camera framing lacks cinematic focus lock on selected Argo floats.
- **P3-1**: Absence of corner 3D orientation compass gizmo.
- **P3-2**: Cyclone modal lacks a schematic 2D preview graphic.

---

# SECTION 4: PHASE 2 IMPLEMENTATION BRIEF

### Priority 0: Critical Fixes
1. **P0-1: Multi-Stage Global ➔ Depth Transition**: Implement smooth camera descent toward the Bay of Bengal domain box followed by vertical volumetric extrusion of the depth cutaway.
2. **P0-2: Volumetric Underwater Attenuation**: Add `THREE.FogExp2(0x040c1a, 0.0075)` and deep marine clear color (`0x030814`) to physically attenuate light through the water column.

### Priority 1: High-Value Upgrades
3. **P1-1: Translucent Lateral Water Cutaway Walls**: 4 vertical planes enclosing the water volume with depth-graded opacity and horizontal isobath demarcation lines.
4. **P1-2: Tomographic Depth Slicing Isolation Mode**: Dim particles outside $\pm 45\text{m}$ of the active depth level when slice focus is enabled.
5. **P1-3: High-Fidelity Earth Globe Texture**: Add continental terrain shading, glowing bathymetric shelf margins, and regional labels.
6. **P1-4: Directional Current Flow Cues**: Render subtle flow arrows on the active slice plane to convey current direction in static views.

### Priority 2: Interaction & Polish
7. **P2-1: Interactive 3D Orientation Compass Gizmo**: Corner-anchored 3D compass rose indicating cardinal headings ($N, S, E, W$) and depth axis $Z$.
8. **P2-2: Subsurface CTD Sensor Hover Probing**: Raycasting inspection of discrete depth rings along the Argo tether cable.
9. **P2-3: Persistent EnOI Gaussian Footprint**: Render the $L = 150\text{km}$ Gaspari-Cohn radius ring on the active depth slice.
10. **P2-4: Seabed Bathymetry Topographic Modulation**: Modulate the floor mesh to suggest the Ninety East Ridge and northern canyon contours.

---

# SECTION 5: MASTER STATUS & READINESS

- **GitHub Repository**: `https://github.com/Mayurrudrawal/OceanVis-3D.git`
- **Owner**: `Mayurrudrawal`
- **Branch**: `main`
- **Baseline Commit**: `a0c9c48`
- **Push Status**: `SUCCESS`
- **Build Status**: `PASS`
- **Source Code Modified in Phase 1**: `NO`
- **Audit Stored**: `YES`
- **Phase 2 Ready**: `YES`

> **PHASE 1 BASELINE LOCKED — READY FOR PHASE 2 PROFESSIONAL 3D UPGRADE.**
