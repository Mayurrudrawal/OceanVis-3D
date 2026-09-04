# OceanVis-3D (SIH26067)
### 3D Scientific Ocean Model Validation, In-Situ Observation Verification & Localized EnOI Data Assimilation Workspace

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Ministry of Earth Sciences (MoES) / INCOIS Problem Statement SIH26067**  
> An interactive scientific oceanographic workspace designed for researchers to visualize 3D ocean model fields (HYCOM/MOM6), validate them against in-situ Argo profiling floats, quantify simulation errors (RMSE/Bias), and demonstrate localized Ensemble Optimal Interpolation (EnOI) data assimilation.

---

## 🌊 Overview & Key Capabilities

- **Dominant 3D Ocean Canvas (75–85% Screen Space):** Interactive WebGL ocean scene built with Three.js and OrbitControls.
- **Dual Camera Operating Modes:**
  - **Mode 1 — Global Basin:** Real 3D Earth Globe with realistic bathymetric margins, continental outlines, lat/lon graticules, atmospheric halo glow, and illuminated Bay of Bengal domain box.
  - **Mode 2 — Depth 3D Column:** Subsurface ocean volume revealing translucent surface plane ($Y=0$), multi-layer horizontal scalar depth planes, 3D bathymetric seabed mesh (down to $-3800\text{m}$), and 3D volumetric particles.
- **Depth Camera Direction Switcher:** Instant multi-angle switching:
  - `◀ View A (Front-West)`
  - `View B (Back-East) ▶`
  - `⤾ Oblique (3D Diagonal)`
- **Physical 3D Argo Profiler Floats:** Surface buoyant hull with GPS antenna mast, blinking beacon LED, and a **physical vertical profiling cable/tether** plunging down from $0\text{m}$ to $-2000\text{m}$ with CTD depth sample nodes.
- **Scientific 3D Depth Axis Ruler:** Graduated vertical ruler with physical tick marks and high-contrast billboard labels: `0m (Surface)`, `-100m (Thermocline)`, `-500m (Intermediate)`, `-1000m (Deep)`, and `-2000m (Abyssal)`.
- **Scientific Color Encodings:**
  - **Temperature:** Calibrated Turbo thermal palette with volume transparency.
  - **Salinity:** Dedicated **Haline palette** (deep navy $\to$ teal $\to$ sand $\to$ gold).
  - **Current Velocity:** Animated 3D streamline particles circulating along realistic physical vectors: central Bay of Bengal cyclonic gyre and northward East India Coastal Current (EICC).
- **Localized EnOI Data Assimilation:** One-click localized Ensemble Optimal Interpolation demonstration. Computes background error covariance, observational updates, and displays expanding 3D spherical wavefronts alongside verified error reduction statistics (RMSE $-64.9\%$, bias $-85.3\%$).
- **Progressive Disclosure UI:** Sleek 64px left icon rail, 48px scientific top bar, and contextual slide-out right drawer that expands on demand.

---

## 🛠️ Architecture & Tech Stack

- **Core:** HTML5, Modern ES6+ JavaScript, CSS3 Design Tokens
- **3D Visualization Engine:** [Three.js](https://threejs.org/) (WebGL, OrbitControls, BufferGeometry, Points, Shaders)
- **Scientific Charting:** [Chart.js](https://www.chartjs.org/) (Dual-axis depth profiles, observation vs model vs analysis)
- **Design System:** Taste Design Skill (Google Earth + Research Dashboard aesthetic)
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Mayurrudrawal/OceanVis-3D.git
cd OceanVis-3D

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be live at:
`http://localhost:5173/`

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔬 Scientific Workflow

1. **Ocean Model:** Explore 3D Sea Surface Temperature (SST), Salinity (SSS), and Current Velocity in the Bay of Bengal basin.
2. **Subsurface Depth Slicing:** Transition to **Depth 3D** mode to inspect the permanent thermocline at 100m and vertical stratification down to 2000m.
3. **In-Situ Observation Verification:** Click on any 3D Argo profiling float to inspect its metadata, location, and CTD observation record.
4. **Model vs Observation Profiling:** Compare model background predictions against real-time CTD sensor observations.
5. **Statistical Error Quantification:** Real-time computation of Root Mean Square Error (RMSE), Mean Bias, and Maximum Error.
6. **EnOI Data Assimilation:** Trigger localized data assimilation with spatial correlation length scale ($L \approx 150\text{km}$) to produce an updated ocean state with verified error reductions.

---

## 📜 License

MIT License. Developed for Smart India Hackathon (SIH 2026).
