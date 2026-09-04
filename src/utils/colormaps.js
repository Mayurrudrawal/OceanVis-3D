/**
 * Scientific Colormaps for Oceanographic Visualizations
 * Interpolated color lookups for Temperature (Turbo/Thermal), Salinity (Haline), and Velocity
 */

export const COLORMAPS = {
  turbo: [
    { pos: 0.0, r: 48, g: 18, b: 59 },
    { pos: 0.15, r: 70, g: 134, b: 251 },
    { pos: 0.35, r: 27, g: 229, b: 181 },
    { pos: 0.55, r: 164, g: 252, b: 60 },
    { pos: 0.75, r: 251, g: 185, b: 56 },
    { pos: 0.9, r: 227, g: 68, b: 10 },
    { pos: 1.0, r: 122, g: 4, b: 3 }
  ],
  haline: [
    { pos: 0.0, r: 35, g: 30, b: 75 },
    { pos: 0.25, r: 40, g: 85, b: 154 },
    { pos: 0.5, r: 45, g: 155, b: 180 },
    { pos: 0.75, r: 110, g: 205, b: 140 },
    { pos: 0.9, r: 215, g: 235, b: 120 },
    { pos: 1.0, r: 255, g: 255, b: 210 }
  ],
  speed: [
    { pos: 0.0, r: 10, g: 25, b: 47 },
    { pos: 0.3, r: 15, g: 115, b: 140 },
    { pos: 0.6, r: 40, g: 195, b: 160 },
    { pos: 0.85, r: 245, g: 210, b: 70 },
    { pos: 1.0, r: 255, g: 90, b: 40 }
  ]
};

/**
 * Returns [r, g, b, a] for a normalized value t in [0, 1]
 */
export function getColor(t, paletteName = "turbo", alpha = 0.85) {
  const stops = COLORMAPS[paletteName] || COLORMAPS.turbo;
  const clamped = Math.max(0, Math.min(1, t));

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clamped >= s1.pos && clamped <= s2.pos) {
      const f = (clamped - s1.pos) / (s2.pos - s1.pos);
      const r = Math.round(s1.r + f * (s2.r - s1.r));
      const g = Math.round(s1.g + f * (s2.g - s1.g));
      const b = Math.round(s1.b + f * (s2.b - s1.b));
      return [r, g, b, alpha];
    }
  }

  const last = stops[stops.length - 1];
  return [last.r, last.g, last.b, alpha];
}

/**
 * Returns a CSS linear-gradient string for legend display
 */
export function getLegendGradient(paletteName = "turbo") {
  const stops = COLORMAPS[paletteName] || COLORMAPS.turbo;
  const parts = stops.map(s => `rgb(${s.r}, ${s.g}, ${s.b}) ${(s.pos * 100).toFixed(0)}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}
