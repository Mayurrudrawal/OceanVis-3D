/**
 * OceanVis-3D Scientific Demonstration Model Data
 * Region: Bay of Bengal & Northern Indian Ocean (8°N - 22°N, 80°E - 95°E)
 * Model Source: Simulated HYCOM/MOM6 1/12° Analysis
 */

export const REGIONS = {
  bob: {
    id: "bob",
    name: "Bay of Bengal",
    bounds: { minLat: 7.5, maxLat: 22.5, minLon: 79.5, maxLon: 95.5 },
    center: [15.0, 88.0],
    zoom: 6,
    bathymetryMax: 3800
  },
  arabian: {
    id: "arabian",
    name: "Arabian Sea",
    bounds: { minLat: 8.0, maxLat: 24.0, minLon: 60.0, maxLon: 77.0 },
    center: [16.0, 68.0],
    zoom: 6,
    bathymetryMax: 4200
  },
  equatorial: {
    id: "equatorial",
    name: "Equatorial Indian Ocean",
    bounds: { minLat: -5.0, maxLat: 8.0, minLon: 75.0, maxLon: 95.0 },
    center: [1.5, 85.0],
    zoom: 6,
    bathymetryMax: 5000
  }
};

export const DEPTH_LEVELS = [0, 10, 50, 100, 200, 500, 1000, 2000];

export const TIMESTAMPS = [
  { id: 0, label: "2026-08-10 00:00Z", date: "2026-08-10" },
  { id: 1, label: "2026-08-11 00:00Z", date: "2026-08-11" },
  { id: 2, label: "2026-08-12 00:00Z", date: "2026-08-12" },
  { id: 3, label: "2026-08-13 00:00Z", date: "2026-08-13" },
  { id: 4, label: "2026-08-14 00:00Z", date: "2026-08-14" },
  { id: 5, label: "2026-08-15 00:00Z", date: "2026-08-15" }
];

export const VARIABLES = {
  temperature: {
    id: "temperature",
    name: "Potential Temperature",
    shortName: "Temp",
    unit: "°C",
    palette: "turbo",
    min: 4.0,
    max: 30.5,
    levels: {
      0: { min: 27.0, max: 30.2, desc: "Sea Surface Temperature (SST)" },
      10: { min: 26.8, max: 30.0, desc: "Mixed Layer Base" },
      50: { min: 24.5, max: 28.5, desc: "Upper Thermocline" },
      100: { min: 18.0, max: 24.0, desc: "Permanent Thermocline" },
      200: { min: 12.5, max: 16.5, desc: "Subsurface Intermediate" },
      500: { min: 7.5, max: 10.5, desc: "Deep Water Column" },
      1000: { min: 5.0, max: 7.2, desc: "North Indian Deep Water" },
      2000: { min: 2.2, max: 3.8, desc: "Abyssal Layer" }
    }
  },
  salinity: {
    id: "salinity",
    name: "Practical Salinity",
    shortName: "Salinity",
    unit: "PSU",
    palette: "haline",
    min: 30.0,
    max: 36.5,
    levels: {
      0: { min: 30.5, max: 34.2, desc: "Freshwater River Plume" },
      10: { min: 31.2, max: 34.5, desc: "Mixed Halocline" },
      50: { min: 33.2, max: 35.0, desc: "Barrier Layer" },
      100: { min: 34.6, max: 35.4, desc: "Subsurface Salinity Maximum" },
      200: { min: 34.8, max: 35.2, desc: "Intermediate Salinity" },
      500: { min: 34.7, max: 35.0, desc: "Deep Water Column" },
      1000: { min: 34.6, max: 34.9, desc: "North Indian Deep Water" },
      2000: { min: 34.6, max: 34.8, desc: "Abyssal Layer" }
    }
  },
  velocity: {
    id: "velocity",
    name: "Current Velocity Magnitude",
    shortName: "Currents",
    unit: "m/s",
    palette: "speed",
    min: 0.0,
    max: 1.4,
    levels: {
      0: { min: 0.05, max: 1.25, desc: "East India Coastal Current" },
      10: { min: 0.05, max: 1.10, desc: "Ekman Layer" },
      50: { min: 0.02, max: 0.75, desc: "Subsurface Jet" },
      100: { min: 0.01, max: 0.45, desc: "Thermocline Drift" },
      200: { min: 0.01, max: 0.25, desc: "Undercurrent" },
      500: { min: 0.00, max: 0.12, desc: "Deep Circulation" },
      1000: { min: 0.00, max: 0.06, desc: "Abyssal Drift" },
      2000: { min: 0.00, max: 0.03, desc: "Benthic Flow" }
    }
  }
};

/**
 * Procedural scientific model field generator
 * Generates continuous physics-based scalar fields incorporating:
 * - Latitudinal heating gradient
 * - Northern Ganga-Brahmaputra river freshwater tongue (low salinity at head bay)
 * - Western boundary current (East India Coastal Current)
 * - Mesoscale anticyclonic warm core eddy (centered ~15°N, 88°E)
 * - Cyclonic cold core eddy (Sri Lanka Dome centered ~10.5°N, 83°E)
 * - Depth vertical stratification
 */
export function getModelScalar(lat, lon, depth, variable, timeIndex = 2) {
  // Phase drift with time step
  const timePhase = timeIndex * 0.15;

  // Normalized coordinates for Bay of Bengal focus
  const nLat = (lat - 8.0) / 14.0; // 0 to 1
  const nLon = (lon - 80.0) / 15.0; // 0 to 1

  // Eddy signatures
  // 1. Anticyclonic warm eddy around 15.5°N, 88.5°E
  const d1 = Math.hypot(lat - (15.5 + Math.sin(timePhase) * 0.3), lon - (88.5 + Math.cos(timePhase) * 0.3));
  const eddyWarm = Math.exp(-(d1 * d1) / 3.2);

  // 2. Cyclonic cold eddy off Sri Lanka around 10.5°N, 83.5°E
  const d2 = Math.hypot(lat - 10.8, lon - 83.8);
  const eddyCold = Math.exp(-(d2 * d2) / 2.8);

  // 3. Coastal boundary upwelling off Andhra Pradesh coast (~16.5°N, 82.5°E)
  const d3 = Math.hypot(lat - 16.5, lon - 82.5);
  const coastalUpwelling = Math.exp(-(d3 * d3) / 1.5);

  if (variable === "temperature") {
    // Surface baseline: warmer equatorial south (29.8°C), cooler north (28.4°C)
    let val = 29.5 - nLat * 1.1 + Math.sin(nLon * Math.PI) * 0.4;

    // Eddies influence
    val += eddyWarm * 1.6 - eddyCold * 1.8 - coastalUpwelling * 1.2;

    // Vertical stratification (thermocline model)
    // Deep ocean decays exponentially with depth scale
    if (depth === 0) {
      return val;
    } else if (depth === 10) {
      return val - 0.25 - (1 - nLon) * 0.2;
    } else if (depth === 50) {
      return val - 1.8 + eddyWarm * 1.4 - eddyCold * 1.9;
    } else if (depth === 100) {
      // Rapid thermocline drop
      return 21.5 - nLat * 1.8 + eddyWarm * 2.8 - eddyCold * 3.2;
    } else if (depth === 200) {
      return 14.2 - nLat * 1.0 + eddyWarm * 1.6 - eddyCold * 1.7;
    } else if (depth === 500) {
      return 8.9 - nLat * 0.5 + eddyWarm * 0.6;
    } else if (depth === 1000) {
      return 6.1 - nLat * 0.25;
    } else {
      // 2000m
      return 2.9 + (1 - nLat) * 0.3;
    }
  } else if (variable === "salinity") {
    // Freshwater plume from Ganges/Brahmaputra in North (lat > 18)
    const plumeStrength = Math.max(0, (lat - 16.0) / 6.0);
    let sstSal = 33.8 - plumeStrength * 3.2 + (lon - 80) * 0.08;

    // Eddies modulate salinity
    sstSal += eddyCold * 0.6 - eddyWarm * 0.4;

    if (depth === 0) {
      return Math.max(30.2, sstSal);
    } else if (depth === 10) {
      return Math.max(31.2, sstSal + 0.5);
    } else if (depth === 50) {
      return 34.2 + (lat - 8) * 0.03;
    } else if (depth === 100) {
      // Subsurface salinity maximum
      return 35.15 - eddyCold * 0.3;
    } else if (depth === 200) {
      return 35.05;
    } else if (depth === 500) {
      return 34.88;
    } else if (depth === 1000) {
      return 34.78;
    } else {
      return 34.72;
    }
  } else {
    // Current velocity (m/s)
    let speed = 0.25 + coastalUpwelling * 0.85 + eddyWarm * 0.45;
    if (depth === 0) return Math.min(1.3, speed);
    if (depth <= 50) return Math.min(1.0, speed * 0.75);
    if (depth <= 200) return speed * 0.35;
    return Math.max(0.02, speed * 0.08);
  }
}

/**
 * Returns a complete vertical profile from surface to 2000m at a specified location
 */
export function getModelProfile(lat, lon, variable = "temperature", timeIndex = 2) {
  return DEPTH_LEVELS.map(depth => {
    return {
      depth,
      value: parseFloat(getModelScalar(lat, lon, depth, variable, timeIndex).toFixed(2))
    };
  });
}
