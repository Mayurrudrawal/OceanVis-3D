import * as THREE from "three";

/**
 * Generates a high-resolution, authoritative scientific Earth texture
 * for the Three.js OceanVis-3D Globe view.
 * 
 * Phase 2B.1 (P1.5): Authoritative Geographic Substrate Upgrade
 * Combines offline NASA Blue Marble / Earth Surface equirectangular imagery (2048 x 1024)
 * with deep oceanographic color grading, continental shelf glows, and crisp scientific overlays.
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

  // Create Three.js Texture with anisotropic filtering early so it can be returned immediately
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  // Render procedure that composite layers onto the canvas
  const renderScientificLayers = (baseImg = null) => {
    ctx.clearRect(0, 0, width, height);

    if (baseImg) {
      // 1. Draw Authoritative NASA / Geospatial Basemap Substrate
      ctx.drawImage(baseImg, 0, 0, width, height);

      // 2. Apply Oceanographic Research Deep Marine Tone Tuning
      // Deepen dark ocean basins slightly while preserving crisp landmass fidelity and vegetation/terrain hues
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const marineToneGrad = ctx.createLinearGradient(0, 0, 0, height);
      marineToneGrad.addColorStop(0, "#a0b4cc");     // Arctic latitudes
      marineToneGrad.addColorStop(0.35, "#c0d4ec");  // Northern mid latitudes
      marineToneGrad.addColorStop(0.5, "#d2e4f8");   // Tropical Indian Ocean belt
      marineToneGrad.addColorStop(0.7, "#c0d4ec");   // Southern mid latitudes
      marineToneGrad.addColorStop(1, "#a0b4cc");     // Antarctic ice
      ctx.fillStyle = marineToneGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Subtle deep-sea bathymetric shading to give rich dark navy tone to deep oceanic abyss
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(6, 18, 36, 0.42)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else {
      // Fallback base gradient if image has not decoded yet
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, "#01040a");
      oceanGrad.addColorStop(0.2, "#030a16");
      oceanGrad.addColorStop(0.45, "#061328");
      oceanGrad.addColorStop(0.55, "#061328");
      oceanGrad.addColorStop(0.8, "#030a16");
      oceanGrad.addColorStop(1, "#01040a");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // =========================================================================
    // 3. CONTINENTAL SHELF BATHYMETRIC GLOW (NORTHERN INDIAN OCEAN & BAY OF BENGAL)
    // =========================================================================
    const drawShelfGlow = (lon, lat, innerR, outerR, alpha) => {
      const cx = toX(lon);
      const cy = toY(lat);
      const rad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      rad.addColorStop(0, `rgba(14, 165, 233, ${alpha})`);
      rad.addColorStop(0.5, `rgba(2, 132, 199, ${alpha * 0.45})`);
      rad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Bay of Bengal central basin bathymetric shelf glow
    drawShelfGlow(88.0, 15.0, 20, 180, 0.15);
    // Northern Bay / Ganges-Brahmaputra shelf margin
    drawShelfGlow(89.5, 21.0, 10, 100, 0.20);
    // Andaman Sea basin
    drawShelfGlow(95.0, 11.5, 10, 85, 0.16);
    // Arabian Sea basin
    drawShelfGlow(67.0, 16.0, 15, 150, 0.12);
    // Palk Strait / Gulf of Mannar
    drawShelfGlow(79.8, 9.2, 5, 45, 0.22);

    // =========================================================================
    // 4. RESTRAINED SCIENTIFIC GRATICULES (15° GRID, EQUATOR, TROPICS)
    // =========================================================================
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

    // Equator: Highlighted Solid Cyan Reference Line
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.32)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, toY(0));
    ctx.lineTo(width, toY(0));
    ctx.stroke();

    // Tropic of Cancer (23.5°N) & Tropic of Capricorn (23.5°S)
    ctx.strokeStyle = "rgba(245, 158, 11, 0.22)";
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
    // 5. SPARSE, HIGH-LEGIBILITY SCIENTIFIC GEOGRAPHIC LABELS
    // =========================================================================
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Major Terrestrial Labels (Matte slate-white typography with subtle dark shadow)
    const landLabels = [
      { text: "INDIA", lon: 78.5, lat: 21.0, size: 13, weight: "bold" },
      { text: "SRI LANKA", lon: 81.0, lat: 4.8, size: 9.5, weight: "600" },
      { text: "BANGLADESH", lon: 90.0, lat: 24.2, size: 9.5, weight: "600" },
      { text: "MYANMAR", lon: 96.2, lat: 20.5, size: 11, weight: "600" },
      { text: "ANDAMAN", lon: 94.6, lat: 13.0, size: 8.5, weight: "600" },
      { text: "NICOBAR", lon: 95.5, lat: 7.2, size: 8.5, weight: "600" }
    ];

    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "rgba(241, 245, 249, 0.90)";
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

    ctx.fillStyle = "rgba(56, 189, 248, 0.65)";
    oceanLabels.forEach(lbl => {
      ctx.font = `${lbl.weight} ${lbl.size}px 'JetBrains Mono', monospace`;
      ctx.fillText(lbl.text, toX(lbl.lon), toY(lbl.lat));
    });

    ctx.restore();

    texture.needsUpdate = true;
  };

  // Initial draw with fallback base gradient
  renderScientificLayers(null);

  // Asynchronously load the local offline NASA Blue Marble texture
  if (typeof Image !== "undefined") {
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = "/assets/textures/earth_atmos_2048.jpg";
    baseImg.onload = () => {
      renderScientificLayers(baseImg);
    };
    baseImg.onerror = () => {
      console.warn("Local earth texture failed to load, keeping scientific base gradient.");
    };
  }

  return texture;
}
