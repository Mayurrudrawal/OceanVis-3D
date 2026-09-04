export class StatusBar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="status-group">
        <div class="status-item">
          <span style="color: #10b981;">●</span>
          <span>Model: <span class="status-value" id="status-model-name">HYCOM-BoB 1/12° Analysis</span></span>
        </div>
        <div class="status-item">
          <span>Obs Ingested: <span class="status-value" id="status-obs-count">10 Argo Floats (D-Mode QC)</span></span>
        </div>
      </div>

      <div class="status-group">
        <div class="status-item">
          <span>Variable: <span class="status-value" id="status-var">Temperature</span></span>
        </div>
        <div class="status-item">
          <span>Depth: <span class="status-value" id="status-depth">0 m (Surface)</span></span>
        </div>
        <div class="status-item">
          <span>Time: <span class="status-value" id="status-time">2026-08-12 00:00 UTC</span></span>
        </div>
      </div>

      <div class="status-group">
        <div class="status-item">
          <span>Probe: <span class="status-value" id="status-coords">15.20°N, 88.00°E</span></span>
        </div>
        <div class="status-item">
          <span>Bathy: <span class="status-value" id="status-bathy">-2,850 m</span></span>
        </div>
        <div class="status-item">
          <span style="color: #38bdf8; font-size: 0.68rem; background: rgba(56, 189, 248, 0.12); padding: 1px 6px; border-radius: 3px; border: 1px solid rgba(56, 189, 248, 0.3);">
            60 FPS • Prototype Mock Mode
          </span>
        </div>
      </div>
    `;
  }

  update({ variable, depth, timeLabel, coords, bathymetry, obsCount }) {
    if (variable) {
      const varEl = document.getElementById("status-var");
      if (varEl) varEl.textContent = variable.charAt(0).toUpperCase() + variable.slice(1);
    }
    if (depth !== undefined) {
      const depthEl = document.getElementById("status-depth");
      if (depthEl) depthEl.textContent = `${depth} m ${depth === 0 ? "(Surface)" : ""}`;
    }
    if (timeLabel) {
      const timeEl = document.getElementById("status-time");
      if (timeEl) timeEl.textContent = timeLabel;
    }
    if (coords) {
      const coordsEl = document.getElementById("status-coords");
      if (coordsEl) coordsEl.textContent = `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E`;
    }
    if (bathymetry !== undefined) {
      const bathyEl = document.getElementById("status-bathy");
      if (bathyEl) bathyEl.textContent = `${bathymetry.toLocaleString()} m`;
    }
    if (obsCount !== undefined) {
      const obsEl = document.getElementById("status-obs-count");
      if (obsEl) obsEl.textContent = `${obsCount} Argo Floats (D-Mode QC)`;
    }
  }
}
