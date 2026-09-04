import * as THREE from "three";

/**
 * Generates a high-resolution, geographically credible scientific Earth texture
 * for the Three.js OceanVis-3D Globe view.
 * 
 * Target: Professional oceanographic research workstation standard.
 * Projection: Equirectangular (lat: -90° to +90°, lon: -180° to +180°)
 * Resolution: 2048 x 1024
 */
export function createScientificEarthTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Coordinate Projection Helpers: (lat, lon) -> canvas (x, y)
  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // =========================================================================
  // 1. DEEP OCEAN BASE & BATHYMETRIC SHELF SHALLOWS
  // =========================================================================
  // Professional oceanic dark research gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#01040a");     // Arctic deep abyssal void
  oceanGrad.addColorStop(0.2, "#030a16");    // High northern latitudes
  oceanGrad.addColorStop(0.45, "#061328");   // Tropical warm deep basin
  oceanGrad.addColorStop(0.55, "#061328");   // Equatorial belt
  oceanGrad.addColorStop(0.8, "#030a16");    // Southern Ocean
  oceanGrad.addColorStop(1, "#01040a");     // Antarctic abyss
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle bathymetric shelf glow around the Bay of Bengal & northern Indian Ocean
  const drawShelfGlow = (lon, lat, innerR, outerR, alpha) => {
    const cx = toX(lon);
    const cy = toY(lat);
    const rad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    rad.addColorStop(0, `rgba(14, 165, 233, ${alpha})`);
    rad.addColorStop(0.45, `rgba(2, 132, 199, ${alpha * 0.5})`);
    rad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
  };

  // Bay of Bengal central basin bathymetric shelf
  drawShelfGlow(88.0, 15.0, 30, 200, 0.16);
  // Northern Bay / Ganges-Brahmaputra shelf margin
  drawShelfGlow(89.5, 21.0, 15, 110, 0.22);
  // Andaman Sea basin
  drawShelfGlow(95.0, 11.5, 15, 95, 0.18);
  // Arabian Sea basin
  drawShelfGlow(67.0, 16.0, 20, 170, 0.14);
  // Equatorial Indian Ocean
  drawShelfGlow(80.0, 2.0, 25, 180, 0.12);

  // =========================================================================
  // 2. RESTRAINED SCIENTIFIC GRATICULES (15° GRID, EQUATOR, TROPICS)
  // =========================================================================
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
  ctx.setLineDash([4, 6]);

  // Parallels every 15°
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Meridians every 15°
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator: Highlighted Solid Cyan Reference Line
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  // Tropic of Cancer (23.5°N) & Tropic of Capricorn (23.5°S)
  ctx.strokeStyle = "rgba(245, 158, 11, 0.20)";
  ctx.lineWidth = 0.9;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, toY(23.5));
  ctx.lineTo(width, toY(23.5));
  ctx.moveTo(0, toY(-23.5));
  ctx.lineTo(width, toY(-23.5));
  ctx.stroke();
  ctx.restore();

  // =========================================================================
  // 3. HIGH-DENSITY SCIENTIFIC GEOGRAPHIC COASTLINES
  // =========================================================================
  // Drawing helper with stroke and fill
  const drawFeature = (points, close = true, fillColor = "#111a2e", strokeColor = "rgba(56, 189, 248, 0.40)", strokeWidth = 1.2) => {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(toX(points[0][1]), toY(points[0][0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i][1]), toY(points[i][0]));
    }
    if (close) ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  ctx.save();

  // --- 3.1 INDIAN SUBCONTINENT (High Precision Geographic Polyline) ---
  // Detailed coastal curvature: Gujarat peninsula, Konkan, Malabar, Cape Comorin,
  // Coromandel Coast, Krishna-Godavari Delta, Odisha coast, Sundarbans, and Northern frontier
  const indiaSubcontinent = [
    // Gujarat / Rann of Kutch / Kathiawar Peninsula
    [24.0, 68.4], [23.8, 69.2], [23.3, 68.6], [22.6, 69.1], [22.4, 69.8],
    [22.8, 70.3], [22.2, 70.8], [21.5, 69.6], [20.8, 70.4], [20.7, 71.0],
    [20.9, 71.7], [21.6, 72.2], [22.2, 72.5], [21.7, 72.8], [21.1, 72.7],
    // Konkan Coast (Maharashtra & Goa)
    [20.0, 72.8], [19.0, 72.8], [18.5, 72.9], [17.5, 73.2], [16.0, 73.5],
    [15.4, 73.8], [14.8, 74.1],
    // Malabar Coast (Karnataka & Kerala)
    [14.2, 74.4], [13.3, 74.7], [12.5, 75.0], [11.8, 75.3], [10.8, 75.8],
    [9.9, 76.2], [9.3, 76.5], [8.5, 76.9],
    // Cape Comorin (Kanyakumari) Apex
    [8.08, 77.55],
    // Gulf of Mannar & Palk Strait (Coromandel Coast - Tamil Nadu)
    [8.5, 78.1], [9.1, 79.1], [9.3, 79.3], [9.8, 79.0], [10.3, 79.4],
    [10.8, 79.8], [11.4, 79.8], [12.0, 79.8], [12.6, 80.1], [13.1, 80.3],
    // Andhra Coast & Krishna-Godavari Delta Bight
    [13.8, 80.2], [14.5, 80.1], [15.2, 80.0], [15.8, 80.4], [16.2, 81.1],
    [16.4, 81.7], [16.9, 82.3], [17.3, 82.8], [17.7, 83.3],
    // Odisha Coast (Visakhapatnam to Chilika & Paradip)
    [18.2, 84.0], [19.0, 84.8], [19.5, 85.3], [19.8, 85.8], [20.3, 86.7],
    [20.8, 86.9], [21.3, 87.1],
    // West Bengal & Sundarbans Delta Margin
    [21.6, 87.5], [21.8, 88.1], [22.0, 88.7], [22.2, 89.1], [22.4, 89.8],
    // Bangladesh Delta (Ganges-Brahmaputra / Meghna Estuary)
    [22.8, 90.5], [23.1, 91.2], [22.6, 91.8], [22.1, 91.8], [21.5, 92.0],
    // Eastern border & Himalaya arc
    [23.5, 92.5], [25.0, 92.5], [26.0, 91.5], [26.8, 92.8], [27.5, 95.5],
    [28.2, 96.5], [29.0, 95.0], [28.0, 92.0], [27.5, 88.5], [28.5, 84.0],
    [29.5, 81.5], [31.0, 78.5], [33.0, 76.5], [35.5, 75.0], [36.5, 74.0],
    // Western frontier (Indus basin & Thar margin)
    [34.5, 71.5], [32.0, 70.5], [29.5, 69.5], [27.0, 68.0], [25.5, 67.5],
    [24.5, 67.5], [24.0, 68.4]
  ];
  drawFeature(indiaSubcontinent, true, "#121b2d", "rgba(56, 189, 248, 0.48)", 1.4);

  // --- 3.2 SRI LANKA (Detailed Oceanic Teardrop) ---
  const sriLanka = [
    [9.82, 80.24], [9.55, 80.50], [9.20, 80.85], [8.75, 81.25],
    [8.50, 81.35], [7.75, 81.70], [7.00, 81.85], [6.50, 81.80],
    [6.05, 81.20], [5.92, 80.55], [6.00, 80.20], [6.25, 79.90],
    [6.95, 79.85], [7.50, 79.80], [8.00, 79.75], [8.55, 79.80],
    [9.00, 79.90], [9.50, 80.05], [9.82, 80.24]
  ];
  drawFeature(sriLanka, true, "#121b2d", "rgba(56, 189, 248, 0.50)", 1.3);

  // Adam's Bridge / Palk Strait shoal marker
  const adamsBridge = [
    [9.15, 79.25], [9.18, 79.45], [9.22, 79.60]
  ];
  drawFeature(adamsBridge, false, null, "rgba(56, 189, 248, 0.35)", 1.0);

  // --- 3.3 MYANMAR & SOUTHEAST ASIA (Rakhine, Ayeyarwady Delta, Gulf of Martaban) ---
  const myanmarSeAsia = [
    // Rakhine Coast (Bangladesh border southward)
    [21.5, 92.0], [20.8, 92.4], [20.1, 92.8], [19.4, 93.5], [18.5, 94.0],
    [17.5, 94.5], [16.2, 94.2],
    // Ayeyarwady (Irrawaddy) Delta
    [15.8, 94.7], [15.8, 95.3], [15.7, 95.8], [16.1, 96.2], [16.5, 96.5],
    // Gulf of Martaban & Mawlamyine
    [16.8, 96.9], [17.1, 97.0], [16.5, 97.4], [15.8, 97.6],
    // Tanintharyi (Tenasserim) Coastal strip & Kra Isthmus
    [15.0, 97.8], [14.0, 98.1], [13.0, 98.2], [12.0, 98.4], [10.5, 98.5],
    [9.0, 98.3], [7.8, 98.5], [6.5, 99.8], [5.0, 100.3], [3.5, 101.0],
    // Malay Peninsula tip (Singapore Strait)
    [1.3, 103.8], [1.5, 104.2], [2.5, 103.8], [4.0, 103.4], [5.5, 102.8],
    // Gulf of Thailand & Indochina
    [7.0, 101.5], [9.0, 100.0], [11.5, 99.8], [13.0, 100.2], [13.5, 100.8],
    [12.5, 101.8], [11.5, 103.0], [9.5, 104.5], [8.5, 105.0], [9.5, 106.5],
    [11.0, 108.0], [13.5, 109.2], [16.0, 108.3], [18.0, 106.5], [20.5, 107.0],
    [21.5, 108.0],
    // Interior border back to northern Myanmar
    [22.5, 105.0], [24.0, 100.0], [26.0, 98.5], [27.5, 97.5], [26.5, 95.5],
    [24.5, 94.5], [23.0, 93.0], [21.5, 92.0]
  ];
  drawFeature(myanmarSeAsia, true, "#121b2d", "rgba(56, 189, 248, 0.45)", 1.3);

  // --- 3.4 ANDAMAN & NICOBAR ISLAND CHAIN (Critical Geospatial Reference) ---
  // North & Middle Andaman
  const northMiddleAndaman = [
    [13.65, 93.00], [13.40, 93.05], [13.00, 92.95], [12.60, 92.85],
    [12.40, 92.80], [12.60, 92.70], [13.10, 92.85], [13.65, 93.00]
  ];
  drawFeature(northMiddleAndaman, true, "#19253d", "rgba(56, 189, 248, 0.65)", 1.2);

  // South Andaman (Port Blair region) & Rutland
  const southAndaman = [
    [12.15, 92.75], [11.80, 92.78], [11.50, 92.72], [11.45, 92.60],
    [11.75, 92.65], [12.15, 92.75]
  ];
  drawFeature(southAndaman, true, "#19253d", "rgba(56, 189, 248, 0.65)", 1.2);

  // Little Andaman
  const littleAndaman = [
    [10.85, 92.55], [10.60, 92.60], [10.55, 92.45], [10.80, 92.42], [10.85, 92.55]
  ];
  drawFeature(littleAndaman, true, "#19253d", "rgba(56, 189, 248, 0.60)", 1.1);

  // Car Nicobar
  const carNicobar = [
    [9.25, 92.80], [9.15, 92.85], [9.12, 92.75], [9.23, 92.72], [9.25, 92.80]
  ];
  drawFeature(carNicobar, true, "#19253d", "rgba(56, 189, 248, 0.60)", 1.1);

  // Great Nicobar (Indira Point - Southernmost Indian Territory)
  const greatNicobar = [
    [7.25, 93.85], [7.00, 93.92], [6.75, 93.88], [6.80, 93.75],
    [7.15, 93.70], [7.25, 93.85]
  ];
  drawFeature(greatNicobar, true, "#19253d", "rgba(56, 189, 248, 0.65)", 1.2);

  // --- 3.5 INDONESIAN ARCHIPELAGO (Sumatra, Java, Sunda Strait) ---
  // Sumatra (forming eastern boundary of Indian Ocean)
  const sumatra = [
    [5.65, 95.30], [5.00, 96.20], [4.00, 97.80], [2.80, 99.50],
    [1.50, 101.50], [0.50, 102.80], [-1.00, 104.20], [-2.50, 105.00],
    [-4.00, 105.80], [-5.60, 105.90], [-5.90, 104.80], [-4.80, 103.50],
    [-3.80, 102.20], [-2.50, 101.00], [-1.00, 99.80], [0.50, 98.50],
    [2.00, 97.20], [3.50, 96.20], [4.80, 95.40], [5.65, 95.30]
  ];
  drawFeature(sumatra, true, "#121b2d", "rgba(56, 189, 248, 0.42)", 1.2);

  // Java
  const java = [
    [-6.0, 106.0], [-6.2, 107.5], [-6.5, 109.0], [-6.8, 111.0],
    [-7.2, 113.5], [-8.2, 114.5], [-8.6, 113.0], [-8.4, 111.0],
    [-7.8, 108.5], [-6.9, 106.0], [-6.0, 106.0]
  ];
  drawFeature(java, true, "#121b2d", "rgba(56, 189, 248, 0.40)", 1.2);

  // --- 3.6 ARABIAN PENINSULA & PERSIAN GULF (Western Indian Ocean Context) ---
  const arabia = [
    [12.7, 45.0], [13.5, 48.0], [15.2, 52.0], [17.0, 55.0], [20.5, 58.8],
    [22.4, 59.9], [24.0, 57.5], [25.8, 56.5], [26.4, 56.2], [25.0, 54.5],
    [24.5, 52.0], [26.0, 50.5], [28.0, 48.8], [30.0, 48.0], [30.0, 35.0],
    [28.0, 34.5], [25.0, 37.0], [20.0, 40.0], [16.0, 42.5], [13.0, 43.5],
    [12.7, 45.0]
  ];
  drawFeature(arabia, true, "#121b2d", "rgba(56, 189, 248, 0.38)", 1.2);

  // --- 3.7 AFRICAN CONTINENT (Horn of Africa & East African Margin) ---
  const africa = [
    [31.5, 32.0], [28.0, 34.0], [22.0, 37.0], [15.0, 40.0], [12.0, 43.5],
    [11.5, 51.2], // Horn of Africa (Ras Hafun)
    [8.0, 50.0], [2.0, 45.5], [-4.0, 39.5], [-11.0, 40.5], [-17.0, 38.5],
    [-25.0, 33.0], [-34.8, 20.0], // Cape of Good Hope
    [-30.0, 17.5], [-20.0, 12.5], [-5.0, 12.0], [4.5, 9.0], [5.0, 1.0],
    [14.5, -17.5], [28.0, -13.0], [36.0, -5.5], [37.0, 10.0], [31.5, 32.0]
  ];
  drawFeature(africa, true, "#101828", "rgba(56, 189, 248, 0.35)", 1.1);

  // Madagascar
  const madagascar = [
    [-12.0, 49.3], [-15.5, 50.5], [-20.0, 48.5], [-25.5, 45.2],
    [-23.5, 43.8], [-17.0, 44.0], [-13.5, 48.0], [-12.0, 49.3]
  ];
  drawFeature(madagascar, true, "#101828", "rgba(56, 189, 248, 0.35)", 1.1);

  // --- 3.8 AUSTRALIA & OCEANIA ---
  const australia = [
    [-11.5, 131.0], [-12.0, 136.5], [-17.0, 139.5], [-11.0, 142.5],
    [-20.0, 149.0], [-30.0, 153.0], [-38.0, 147.0], [-38.5, 143.0],
    [-32.0, 129.0], [-34.5, 116.0], [-22.0, 114.0], [-15.0, 124.0],
    [-11.5, 131.0]
  ];
  drawFeature(australia, true, "#101828", "rgba(56, 189, 248, 0.32)", 1.1);

  // --- 3.9 EURASIA (Central Asia, China, Europe) ---
  const eurasia = [
    [21.5, 108.0], [23.5, 117.0], [30.0, 122.0], [38.0, 119.5], [40.0, 128.0],
    [43.0, 132.0], [55.0, 137.0], [60.0, 160.0], [66.0, 170.0], [70.0, 140.0],
    [72.0, 100.0], [70.0, 60.0], [68.0, 30.0], [60.0, 10.0], [45.0, -2.0],
    [36.0, -5.5], [38.0, 20.0], [41.0, 29.0], [42.0, 45.0], [38.0, 50.0],
    [30.0, 60.0], [25.0, 68.0], [29.0, 85.0], [28.0, 95.0], [21.5, 108.0]
  ];
  drawFeature(eurasia, true, "#101828", "rgba(56, 189, 248, 0.32)", 1.1);

  // --- 3.10 AMERICAS (Global Context) ---
  const northAmerica = [
    [60.0, -165.0], [70.0, -140.0], [70.0, -85.0], [55.0, -55.0],
    [45.0, -65.0], [30.0, -80.0], [25.0, -80.5], [19.0, -96.0],
    [15.0, -92.0], [8.5, -80.0], [15.0, -95.0], [22.0, -106.0],
    [32.0, -117.0], [48.0, -125.0], [58.0, -137.0], [60.0, -165.0]
  ];
  drawFeature(northAmerica, true, "#0d1422", "rgba(56, 189, 248, 0.25)", 1.0);

  const southAmerica = [
    [12.0, -72.0], [5.0, -52.0], [-5.0, -35.0], [-23.0, -42.0],
    [-40.0, -62.0], [-55.0, -68.0], [-45.0, -75.0], [-20.0, -70.0],
    [-5.0, -80.0], [8.0, -78.0], [12.0, -72.0]
  ];
  drawFeature(southAmerica, true, "#0d1422", "rgba(56, 189, 248, 0.25)", 1.0);

  ctx.restore();

  // =========================================================================
  // 4. SUBTLE TOPOGRAPHIC RELIEF CUES (Himalayan Arc & Peninsular Ridges)
  // =========================================================================
  ctx.save();
  // Himalayan Mountain Orogeny Arc (elevated dark texture north of India)
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(71, 85, 105, 0.35)";
  ctx.beginPath();
  ctx.moveTo(toX(74.0), toY(35.0));
  ctx.bezierCurveTo(toX(80.0), toY(30.0), toX(88.0), toY(28.0), toX(95.0), toY(28.0));
  ctx.stroke();

  // Western Ghats coastal escarpment ridge
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(71, 85, 105, 0.30)";
  ctx.beginPath();
  ctx.moveTo(toX(73.5), toY(20.5));
  ctx.lineTo(toX(75.5), toY(13.0));
  ctx.lineTo(toX(77.0), toY(9.0));
  ctx.stroke();

  // Eastern Ghats discontinuous ridge
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = "rgba(71, 85, 105, 0.22)";
  ctx.beginPath();
  ctx.moveTo(toX(85.0), toY(19.5));
  ctx.lineTo(toX(82.5), toY(17.0));
  ctx.lineTo(toX(79.5), toY(13.5));
  ctx.stroke();
  ctx.restore();

  // =========================================================================
  // 5. SPARSE, HIGH-LEGIBILITY SCIENTIFIC GEOGRAPHIC LABELS
  // =========================================================================
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Major Terrestrial Labels (Matte slate-white typography)
  const landLabels = [
    { text: "INDIA", lon: 78.5, lat: 21.0, size: 13, weight: "bold" },
    { text: "SRI LANKA", lon: 81.0, lat: 4.8, size: 9.5, weight: "600" },
    { text: "BANGLADESH", lon: 90.0, lat: 24.2, size: 9.5, weight: "600" },
    { text: "MYANMAR", lon: 96.2, lat: 20.5, size: 11, weight: "600" },
    { text: "ANDAMAN", lon: 94.6, lat: 13.0, size: 8.5, weight: "600" },
    { text: "NICOBAR", lon: 95.5, lat: 7.2, size: 8.5, weight: "600" }
  ];

  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  landLabels.forEach(lbl => {
    ctx.font = `${lbl.weight} ${lbl.size}px 'JetBrains Mono', monospace`;
    ctx.fillText(lbl.text, toX(lbl.lon), toY(lbl.lat));
  });

  // Oceanic Basin Identifiers (Muted marine cyan)
  const oceanLabels = [
    { text: "BAY OF BENGAL", lon: 88.0, lat: 15.2, size: 13, weight: "bold" },
    { text: "ARABIAN SEA", lon: 66.5, lat: 15.5, size: 12, weight: "600" },
    { text: "ANDAMAN SEA", lon: 96.8, lat: 10.5, size: 9.5, weight: "600" },
    { text: "INDIAN OCEAN", lon: 78.0, lat: -4.0, size: 13, weight: "600" }
  ];

  ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
  oceanLabels.forEach(lbl => {
    ctx.font = `${lbl.weight} ${lbl.size}px 'JetBrains Mono', monospace`;
    ctx.fillText(lbl.text, toX(lbl.lon), toY(lbl.lat));
  });

  ctx.restore();

  // Create Three.js Texture with anisotropic filtering
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  return texture;
}
