# PHASE_2_IMPLEMENTATION_BRIEF.md
**Project**: OceanVis-3D (SIH26067)  
**Document Type**: Technical Implementation Brief (No Implementation Code)  
**Objective**: Transform the baseline prototype into a professional oceanographic 3D analysis workstation through focused spatial and optical upgrades.

---

## 1. Guiding Principles & Non-Negotiables
1. **Zero Feature Creep**: Do NOT expand scope into external infrastructure, backend databases, or fake complex simulations.
2. **Preserve Scientific Core**: Retain continuous 3D field samplers for $(u, v, w, T, S)$, subtle translucent water tracer particle physics, authentic Argo buoy structures, and GOV validation metrics.
3. **Target Visual Caliber**: Blend the geographic intuition of Google Earth/Cesium with the physical depth clarity of an oceanographic research workstation (INCOIS / MoES demonstration caliber).

---

## 2. Phased Implementation Order

### Priority 0: Critical Spatial & Optical Fixes (P0)

#### P0-1: Multi-Stage Global ➔ Depth Transition
- **Objective**: Replace instantaneous group visibility toggling (`visible = false/true`) with an intuitive continuous camera descent and volumetric extrusion.
- **Workflow**:
  1. Camera initiates smooth cubic easing descent toward the selected Bay of Bengal domain coordinates ($15^\circ\text{N}, 88^\circ\text{E}$).
  2. The Earth globe smoothly fades opacity while the 3D depth cutaway volume expands from sea level ($Y = 0$) down to abyssal floor ($Y = -36$).
  3. Camera gently frames the selected perspective vantage (`View A`, `View B`, or `Oblique`).

#### P0-2: Volumetric Underwater Light Attenuation & Fog
- **Objective**: Replace empty black space vacuum with natural depth-dependent sunlight absorption (Beer-Lambert optical extinction).
- **Workflow**:
  1. Configure physically calibrated exponential ocean water fog (`THREE.FogExp2`) tuned to seawater extinction coefficients.
  2. Set depth scene background to deep marine blue-black (`0x030814`).
  3. Adjust ambient and directional illumination to simulate downwelling surface radiance decaying into twilight abyssal darkness.

---

### Priority 1: High-Value Architectural Polish (P1)

#### P1-1: Translucent Lateral Water-Column Cutaway Walls
- **Objective**: Eliminate open wireframe cage aesthetic and enclose the ocean water column like a transparent geological cutaway ("aquarium slice").
- **Workflow**:
  1. Add 4 vertical lateral boundary planes enclosing the volume from $0\text{m}$ down to $-2000\text{m}$.
  2. Apply double-sided physical material with high transmission, subtle marine tint, and vertical linear depth opacity gradient.
  3. Mark horizontal isobath demarcation lines at key oceanographic boundaries (e.g. $-100\text{m}$ Thermocline base, $-500\text{m}$).

#### P1-2: Tomographic Depth-Slice Particle Isolation
- **Objective**: Transform the depth slider into an active tomographic slice analysis tool.
- **Workflow**:
  1. Add a "Slice Focus" mode to the particle rendering loop.
  2. Particles within $\pm 45\text{m}$ of the selected depth level retain normal visibility ($0.35$ opacity), while out-of-slice particles fade to faint background context ($0.05$ opacity).
  3. Provide a toggle in the Layers flyout to switch between Full Water Column and Active Slice Isolation.

#### P1-3: High-Fidelity Earth Globe Texture
- **Objective**: Upgrade the 2D procedural canvas texture to photographic scientific standards without adding heavy external GIS dependencies.
- **Workflow**:
  1. Enhance `src/utils/earthTexture.js` with realistic continental terrain shading, illuminated cyan-tinted coastal shelf bathymetry, and clean geographic labels (`INDIA`, `SRI LANKA`, `BAY OF BENGAL`).
  2. Retain the smooth atmospheric rim glow.

#### P1-4: Static Directional Current-Flow Cues
- **Objective**: Ensure that current direction (e.g. northward EICC jet vs anticyclonic gyre) is legible even in static screenshots or paused views.
- **Workflow**:
  1. Render subtle directional streamline vectors / arrowheads on the active depth slice plane indicating current heading and speed.

---

### Priority 2: Interaction & Polish Refinements (P2)

#### P2-1: Interactive 3D Orientation Compass Gizmo
- Render a corner-anchored 3D compass rose indicating cardinal headings ($N, S, E, W$) and depth axis $Z$ synchronized with camera rotation.

#### P2-2: Subsurface CTD Sensor Hover Probing along Float Tethers
- Extend raycaster detection to individual CTD depth rings along the float tether cable, displaying exact observed vs modeled values in a dedicated tooltip.

#### P2-3: Persistent EnOI Gaussian Influence Footprint
- Leave a persistent, subtle circular Gaussian contour on the active slice plane illustrating the $L = 150\text{km}$ Gaspari-Cohn radius of influence around the assimilated float.

#### P2-4: Seabed Bathymetry Topographic Modulation
- Modulate the floor mesh geometry to reflect the Ninety East Ridge and northern continental shelf canyon headlands.

---

## 3. Verification Protocol
- Ensure zero syntax or build errors (`npm run build`).
- Maintain steady **60 FPS** performance on standard laptop hardware.
- Confirm full preservation of all existing scientific field equations and UI features.
