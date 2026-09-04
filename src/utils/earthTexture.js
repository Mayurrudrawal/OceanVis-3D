import * as THREE from "three";

/**
 * Generates a high-resolution scientific Earth texture for Three.js Globe view
 * Resolution: 2048 x 1024
 * Equirectangular projection (lat: -90 to +90, lon: -180 to +180)
 */
export function createScientificEarthTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Helper: map (lat, lon) to canvas (x, y)
  // lat: +90 (top) to -90 (bottom), lon: -180 (left) to +180 (right)
  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // 1. Deep Ocean Base (Dark oceanic research palette)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#020712");
  oceanGrad.addColorStop(0.25, "#040e1e");
  oceanGrad.addColorStop(0.5, "#061326");
  oceanGrad.addColorStop(0.75, "#040e1e");
  oceanGrad.addColorStop(1, "#020712");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle bathymetric shelf glow around Indian Ocean
  const bobCenterX = toX(88.0);
  const bobCenterY = toY(15.0);
  const bobRad = ctx.createRadialGradient(bobCenterX, bobCenterY, 20, bobCenterX, bobCenterY, 180);
  bobRad.addColorStop(0, "rgba(2, 132, 199, 0.22)");
  bobRad.addColorStop(0.5, "rgba(8, 145, 178, 0.10)");
  bobRad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bobRad;
  ctx.beginPath();
  ctx.arc(bobCenterX, bobCenterY, 180, 0, Math.PI * 2);
  ctx.fill();

  // Arabian Sea shelf glow
  const asCenterX = toX(68.0);
  const asCenterY = toY(16.0);
  const asRad = ctx.createRadialGradient(asCenterX, asCenterY, 10, asCenterX, asCenterY, 140);
  asRad.addColorStop(0, "rgba(2, 132, 199, 0.16)");
  asRad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = asRad;
  ctx.beginPath();
  ctx.arc(asCenterX, asCenterY, 140, 0, Math.PI * 2);
  ctx.fill();

  // 2. Lat / Lon Graticule Lines (subtle scientific grid)
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
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

  // Equator (highlighted cyan line)
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  // Tropic of Cancer (23.5°N) & Capricorn (23.5°S)
  ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, toY(23.5));
  ctx.lineTo(width, toY(23.5));
  ctx.moveTo(0, toY(-23.5));
  ctx.lineTo(width, toY(-23.5));
  ctx.stroke();
  ctx.restore();

  // 3. Continents & Major Landmasses (Dark slate scientific styling)
  ctx.save();
  ctx.fillStyle = "#111a2e";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.2;

  // Helper to draw polygon from array of [lat, lon]
  const drawPoly = (points, close = true) => {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(toX(points[0][1]), toY(points[0][0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i][1]), toY(points[i][0]));
    }
    if (close) ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // --- Indian Subcontinent (High precision) ---
  const india = [
    [24.0, 68.5], [23.0, 70.0], [21.0, 70.0], [20.8, 71.5], [21.8, 72.5],
    [19.0, 72.8], [16.0, 73.5], [14.0, 74.5], [12.0, 75.2], [9.5, 76.5],
    [8.1, 77.5],  // Cape Comorin
    [9.2, 79.2], [10.5, 79.8], [11.8, 79.8], [13.1, 80.3], [15.8, 80.2],
    [17.0, 82.3], [19.3, 85.0], [21.5, 87.0], [22.2, 89.0], [23.5, 90.5], // Bengal Delta
    [26.0, 92.0], [28.0, 95.0], [29.5, 94.0], [28.0, 85.0], [30.5, 80.0],
    [34.0, 76.0], [36.0, 74.0], [34.0, 71.5], [30.0, 70.0], [26.0, 68.0]
  ];
  drawPoly(india);

  // Sri Lanka
  const sriLanka = [
    [9.8, 80.2], [9.0, 80.8], [8.0, 81.5], [6.5, 81.8], [5.9, 80.5], [7.0, 79.8], [8.5, 79.8]
  ];
  drawPoly(sriLanka);

  // Andaman & Nicobar Islands
  const andaman = [
    [13.5, 93.0], [13.2, 93.1], [11.8, 92.7], [11.5, 92.6]
  ];
  drawPoly(andaman, false);
  const nicobar = [
    [9.2, 92.8], [8.0, 93.5], [7.0, 93.8]
  ];
  drawPoly(nicobar, false);

  // Southeast Asia / Myanmar / Thailand / Malaya
  const seAsia = [
    [22.2, 89.0], [21.0, 92.0], [18.0, 94.2], [16.0, 94.3], [16.5, 96.2],
    [15.0, 98.0], [13.0, 98.5], [9.0, 98.5], [6.0, 100.2], [3.0, 101.5], [1.3, 103.8], // Singapore
    [3.5, 103.5], [6.0, 102.2], [8.5, 100.0], [12.5, 100.0], [13.5, 100.8], [11.5, 103.0],
    [8.5, 105.0], [10.5, 107.5], [14.0, 109.0], [17.0, 106.5], [21.0, 108.0],
    [22.0, 106.0], [24.0, 98.0]
  ];
  drawPoly(seAsia);

  // Sumatra & Java (Indonesia)
  const sumatra = [
    [5.5, 95.3], [3.0, 97.5], [1.0, 100.0], [-1.5, 102.5], [-4.0, 104.5], [-5.8, 106.0],
    [-5.0, 104.0], [-3.0, 101.5], [-0.5, 99.5], [2.0, 97.5], [4.5, 96.0]
  ];
  drawPoly(sumatra);

  const java = [
    [-6.0, 106.0], [-6.5, 108.5], [-7.5, 112.5], [-8.5, 114.5],
    [-8.8, 112.0], [-7.8, 108.0], [-6.8, 105.5]
  ];
  drawPoly(java);

  // Arabian Peninsula & Persian Gulf
  const arabia = [
    [12.8, 45.0], [14.5, 50.0], [16.5, 54.0], [22.0, 59.8], [25.5, 56.5],
    [26.5, 50.5], [29.5, 48.0], [30.0, 35.0], [28.0, 34.5], [22.0, 39.0],
    [15.5, 42.0], [12.5, 43.5]
  ];
  drawPoly(arabia);

  // Africa (East & Horn of Africa)
  const africa = [
    [32.0, 31.0], [22.0, 37.0], [12.0, 44.0], [11.5, 51.2], // Horn
    [0.0, 42.5], [-10.0, 40.5], [-20.0, 35.0], [-34.5, 20.0], // South Africa
    [-30.0, 17.0], [-15.0, 12.0], [0.0, 9.5], [5.0, 1.0], [15.0, -17.0],
    [30.0, -10.0], [36.0, -5.0], [37.0, 10.0], [32.0, 30.0]
  ];
  drawPoly(africa);

  // Australia
  const australia = [
    [-11.5, 131.0], [-12.0, 136.5], [-17.0, 139.5], [-11.0, 142.5],
    [-20.0, 149.0], [-30.0, 153.0], [-38.0, 147.0], [-38.5, 143.0],
    [-32.0, 129.0], [-34.5, 116.0], [-22.0, 114.0], [-15.0, 124.0]
  ];
  drawPoly(australia);

  // Eurasia (China, Russia, Europe)
  const eurasia = [
    [22.0, 108.0], [23.0, 117.0], [30.0, 122.0], [38.0, 119.0], [40.0, 128.0],
    [43.0, 132.0], [55.0, 137.0], [60.0, 160.0], [66.0, 170.0], [70.0, 140.0],
    [72.0, 100.0], [70.0, 60.0], [68.0, 30.0], [60.0, 10.0], [45.0, -2.0],
    [36.0, -5.0], [38.0, 20.0], [41.0, 29.0], [42.0, 45.0], [38.0, 50.0],
    [30.0, 60.0], [25.0, 68.0], [29.0, 85.0], [28.0, 95.0]
  ];
  drawPoly(eurasia);

  // Americas (General outlines for global context)
  const northAmerica = [
    [60.0, -165.0], [70.0, -140.0], [70.0, -85.0], [55.0, -55.0],
    [45.0, -65.0], [30.0, -80.0], [25.0, -80.5], [19.0, -96.0],
    [15.0, -92.0], [8.5, -80.0], [15.0, -95.0], [22.0, -106.0],
    [32.0, -117.0], [48.0, -125.0], [58.0, -137.0], [60.0, -165.0]
  ];
  drawPoly(northAmerica);

  const southAmerica = [
    [12.0, -72.0], [5.0, -52.0], [-5.0, -35.0], [-23.0, -42.0],
    [-40.0, -62.0], [-55.0, -68.0], [-45.0, -75.0], [-20.0, -70.0],
    [-5.0, -80.0], [8.0, -78.0]
  ];
  drawPoly(southAmerica);
  ctx.restore();

  // 4. Highlighted Bay of Bengal Model Domain Box
  // 7.5°N to 22.5°N, 79.5°E to 95.5°E
  const boxMinX = toX(79.5);
  const boxMaxX = toX(95.5);
  const boxMinY = toY(22.5);
  const boxMaxY = toY(7.5);
  const boxW = boxMaxX - boxMinX;
  const boxH = boxMaxY - boxMinY;

  ctx.save();
  // Semi-transparent luminous ocean fill
  ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
  ctx.fillRect(boxMinX, boxMinY, boxW, boxH);

  // Glowing boundary outline
  ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(boxMinX, boxMinY, boxW, boxH);

  // Corner markers
  ctx.fillStyle = "#38bdf8";
  const cSize = 6;
  ctx.fillRect(boxMinX - 2, boxMinY - 2, cSize, cSize);
  ctx.fillRect(boxMaxX - 4, boxMinY - 2, cSize, cSize);
  ctx.fillRect(boxMinX - 2, boxMaxY - 4, cSize, cSize);
  ctx.fillRect(boxMaxX - 4, boxMaxY - 4, cSize, cSize);

  // Domain Label
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("MODEL DOMAIN: BAY OF BENGAL", boxMinX + 10, boxMinY - 8);
  ctx.restore();

  // Create Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  return texture;
}
