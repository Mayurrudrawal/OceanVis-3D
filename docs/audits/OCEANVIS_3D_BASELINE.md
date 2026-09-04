# OCEANVIS_3D_BASELINE.md
**Project**: OceanVis-3D  
**Problem Statement**: SIH26067  
**Repository**: https://github.com/Mayurrudrawal/OceanVis-3D.git  
**Owner**: Mayurrudrawal  
**Git branch**: main  
**Baseline Date**: September 2026  
**Audit Document**: [OCEANVIS_3D_AUDIT_MASTER.md](./OCEANVIS_3D_AUDIT_MASTER.md)  

---

## 1. Current Architecture
- **Framework & Tooling**: Vite 6.1.1 + Three.js r185.1 + Chart.js 4.4.7 + Vanilla ES6 modules.
- **Client Runtime**: Pure client-side zero-backend scientific workstation running at 60 FPS.

## 2. Current Scientific Components
- **Temperature**: Continuous analytical 3D field sampler with 4-layer vertical stratification (Mixed layer, Sigmoidal thermocline, Intermediate water, Abyssal decay), warm anticyclonic eddy ($15.5^\circ\text{N}$), cold cyclonic eddy ($10.8^\circ\text{N}$), and coastal upwelling.
- **Salinity**: Northern Bay of Bengal Ganges freshwater river plume ($<30.5\text{ PSU}$), barrier layer, subsurface salinity maximum ($35.25\text{ PSU}$ at $115\text{m}$ depth), and uniform deep water ($34.75\text{ PSU}$).
- **Velocity**: Continuous vector field $(u, v, w)$ driving Lagrangian particle advection; features the East India Coastal Current (EICC northward boundary jet up to $1.1\text{ m/s}$), geostrophic gyres, and vertical upwelling/downwelling velocity $w$.
- **Argo**: 10 real-world formatted profiling floats (Apex, Provor-CTS4 Bio-Argo, Navis-BGC) with D-Mode QC flags and 8 standard CTD depths ($0, 10, 50, 100, 200, 500, 1000, 2000\text{m}$).
- **RMSE / Bias**: Complete mathematical GOV (GODAE OceanView) validation metrics calculation dynamically comparing CTD observations vs model predictions.
- **EnOI**: Step-by-step 5-stage algorithmic pipeline demonstration simulating innovation vector calculation, Gaspari-Cohn spatial localization ($L = 150\text{km}$), and state vector nudging.
- **Bathymetry**: 3D analytical seabed geometry modeling continental shelves and abyssal plain down to $3850\text{m}$.
- **Depth Slicing**: Dynamic horizontal cutting plane slicing standard oceanographic Z-levels ($0\text{m}$ to $2000\text{m}$).

## 3. Current Visualization Modes
- **Global Basin**: 3D Earth globe with limb-darkening atmospheric rim, equirectangular canvas texture, active Bay of Bengal bounding box ($7.5^\circ\text{–}22.5^\circ\text{N}$, $79.5^\circ\text{–}95.5^\circ\text{E}$), and surface Argo beacon pins.
- **Depth 3D**: Volumetric ocean cutaway column ($0\text{m}$ to $-2000\text{m}$) featuring procedural Gerstner surface waves, translucent water tracers (5,500 particles, `size: 2.2`, `opacity: 0.25`, normal blending), 3D buoys with profiling tethers, vertical depth ruler, and directional bounding cage.

## 4. Current Known Problems Inventory

### P0 Problems (Must Fix)
1. **Hard Global ➔ Depth Scene Swap**: Instantaneous visibility toggle breaks spatial continuity between Earth coordinate box and extruded ocean volume.
2. **Lack of Volumetric Underwater Attenuation**: Depth volume exists in black space (`#050811`) without natural sunlight absorption (Beer-Lambert extinction).

### P1 Problems (High Value)
1. **Procedural 2D Vector Earth Texture**: Continent outlines look synthetic compared to photographic satellite imagery.
2. **Open Lateral Depth Cage**: Empty sides make the depth volume look like a wireframe box rather than an enclosed "aquarium cutaway".
3. **Lack of Static Directional Current Cues**: Flow direction cannot be determined on static screenshots without watching dynamic particle movement.

### P2 Problems (Polish)
1. **No Depth Particle Isolation**: Adjusting depth slider moves the cutting plane but does not isolate or focus particles within the active layer.
2. **Simplified Bathymetry**: Floor is a radial mathematical bowl lacking tectonic ridge morphology (e.g. Ninety East Ridge).
3. **Limited Argo CTD Hover Interaction**: Raycasting only detects surface floatation hull rather than individual depth sensor nodes.
4. **EnOI Footprint Missing**: Expanding shockwave vanishes without leaving a persistent spatial influence ring on the active slice plane.

### P3 Problems (Cosmetic / Polish)
1. **Orientation Compass**: Absence of 3D cardinal navigation gizmo in viewport corner.
2. **Cyclone Preview Graphic**: Informative modal lacks a 2D track preview graphic.
