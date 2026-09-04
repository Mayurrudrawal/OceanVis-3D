import Chart from "chart.js/auto";
import { getModelProfile, VARIABLES } from "../data/modelData.js";
import { calculateRMSE, calculateBias, calculateMaxError } from "../utils/rmse.js";
import { runLocalizedEnOI } from "../utils/enoi.js";

export class ProfilePanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onAssimilationTriggered = options.onAssimilationTriggered || (() => {});
    this.onToast = options.onToast || (() => {});

    this.currentArgo = null;
    this.currentVariable = "temperature";
    this.currentTimeIndex = 2;
    this.enoiResult = null;
    this.isAssimilating = false;
    this.showAfterMode = true; // when enoi runs, show updated state
    this.chart = null;

    this.renderShell();
  }

  renderShell() {
    this.container.innerHTML = `
      <!-- OBSERVATION HEADER -->
      <div class="analysis-header">
        <div class="analysis-header-left">
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">In-Situ Observation Profile</div>
          <div class="float-id-title">
            <span id="argo-id-display">ARGO-2902142</span>
            <span class="badge pulse" id="argo-status-badge">QC Passed</span>
          </div>
        </div>
        <div class="analysis-header-right">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);" id="argo-cycle-display">
            Cycle #142
          </div>
          <button class="drawer-close-btn" id="btn-close-analysis-drawer" title="Collapse Analysis Panel (Free Viewport Space)">✕</button>
        </div>
      </div>

      <!-- OBSERVATION METADATA -->
      <div class="float-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Platform Type</span>
          <span class="meta-value" id="argo-platform">Apex Profiling Float</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Coordinates</span>
          <span class="meta-value" id="argo-coords">18.40°N, 89.20°E</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Location / Domain</span>
          <span class="meta-value" id="argo-region">Ganges Plume Boundary</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Sensor / QC Mode</span>
          <span class="meta-value" id="argo-sensor">SBE-41CP (D-Mode)</span>
        </div>
      </div>

      <!-- SCIENTIFIC METRICS (RMSE, BIAS, MAX ERROR) -->
      <div class="metrics-grid">
        <div class="metric-card highlight" id="metric-rmse-card">
          <span class="metric-label">Profile RMSE</span>
          <div class="metric-value" id="metric-rmse-val">0.78<span class="metric-unit">°C</span></div>
          <div class="metric-delta" id="metric-rmse-delta">Model vs Obs</div>
        </div>
        <div class="metric-card">
          <span class="metric-label">Mean Bias</span>
          <div class="metric-value" id="metric-bias-val">+0.32<span class="metric-unit">°C</span></div>
          <span style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">Cold Bias Base</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Max Δ Error</span>
          <div class="metric-value" id="metric-maxerr-val">1.65<span class="metric-unit">°C</span></div>
          <span style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">@ 100m Depth</span>
        </div>
      </div>

      <!-- VERTICAL PROFILE COMPARISON CHART -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">Vertical Profile (Depth 0m - 2000m)</span>
          <div class="chart-legend-custom">
            <div class="legend-item"><span class="legend-swatch obs"></span><span>Observed</span></div>
            <div class="legend-item"><span class="legend-swatch mod"></span><span>Modelled</span></div>
            <div class="legend-item" id="legend-enoi-item" style="display: none;"><span class="legend-swatch enoi"></span><span>EnOI Assimilated</span></div>
          </div>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="profile-chart"></canvas>
        </div>
      </div>

      <!-- LOCALIZED ENOI DEMONSTRATION SECTION -->
      <div class="enoi-section">
        <div class="enoi-header">
          <div class="enoi-title-wrap">
            <span class="enoi-title">Localized EnOI Demonstration</span>
            <span class="enoi-badge">Ensemble Optimal Interpolation Prototype</span>
          </div>
        </div>

        <button class="btn-enoi-action" id="btn-run-enoi">
          <span>⚡</span>
          <span id="btn-enoi-text">Run Localized EnOI Assimilation</span>
        </button>

        <!-- PROGRESS ACCORDION -->
        <div class="enoi-progress-card" id="enoi-progress-wrap" style="display: none;">
          <div class="progress-header">
            <span id="progress-stage-title">Initializing Assimilation Cycle...</span>
            <span id="progress-percent" style="font-family: var(--font-mono); color: #34d399;">0%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" id="progress-bar-fill"></div>
          </div>
          <div class="enoi-stage-formula" id="progress-formula">
            d = y_obs - H(x_background)
          </div>
        </div>

        <!-- BEFORE VS AFTER COMPARISON SUMMARY -->
        <div class="comparison-card" id="enoi-results-card" style="display: none;">
          <div class="comparison-header">
            <span>Assimilation Results (Model State Updated)</span>
            <span class="badge" style="color: #34d399; border-color: rgba(16, 185, 129, 0.4);">
              <span id="enoi-reduction-badge">▼ -73.1% Error Reduction</span>
            </span>
          </div>

          <div class="comparison-stats-row">
            <div>
              <div class="comp-stat-val before" id="stat-before-rmse">0.78 °C</div>
              <div class="comp-stat-lbl">Initial Model RMSE</div>
            </div>
            <div style="color: var(--text-muted); font-size: 1.2rem; align-self: center;">➔</div>
            <div>
              <div class="comp-stat-val after" id="stat-after-rmse">0.21 °C</div>
              <div class="comp-stat-lbl">Post-EnOI RMSE</div>
            </div>
          </div>

          <!-- BEFORE / AFTER TOGGLE -->
          <div class="comp-actions-row">
            <button class="btn-secondary active" id="btn-toggle-viewmode" style="border-color: rgba(16, 185, 129, 0.4); color: #34d399;">
              <span>👁️</span>
              <span id="btn-toggle-viewmode-text">Showing: Post-EnOI Analysis</span>
            </button>
            <button class="btn-secondary" id="btn-reset-enoi" title="Reset this float's assimilation state">
              <span>🔄</span>
              <span>Reset Experiment</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindButtons();
    this.initChart();
  }

  initChart() {
    const ctx = document.getElementById("profile-chart").getContext("2d");
    const varConfig = VARIABLES[this.currentVariable];

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [0, 10, 50, 100, 200, 500, 1000, 2000], // Depths
        datasets: [
          {
            label: "Observed (Argo CTD)",
            data: [],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.15)",
            borderWidth: 2.2,
            pointRadius: 4,
            pointBackgroundColor: "#06b6d4",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            tension: 0.35,
            indexAxis: "y"
          },
          {
            label: "Modelled (HYCOM-BoB)",
            data: [],
            borderColor: "#f97316",
            borderDash: [5, 5],
            borderWidth: 2.0,
            pointRadius: 3.5,
            pointBackgroundColor: "#f97316",
            pointBorderColor: "#fed7aa",
            pointBorderWidth: 1,
            tension: 0.35,
            indexAxis: "y"
          },
          {
            label: "Post-EnOI Analysis",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            borderWidth: 2.5,
            pointRadius: 4.5,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#f0fdf4",
            pointBorderWidth: 1.5,
            tension: 0.35,
            indexAxis: "y",
            hidden: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13, 20, 36, 0.95)",
            borderColor: "rgba(56, 189, 248, 0.4)",
            borderWidth: 1,
            titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
            padding: 10,
            callbacks: {
              title: (items) => `Depth: ${items[0].label} meters`,
              label: (item) => ` ${item.dataset.label}: ${item.parsed.x} ${varConfig.unit}`
            }
          }
        },
        scales: {
          y: {
            reverse: true, // 0m at top down to 2000m at bottom!
            title: {
              display: true,
              text: "Depth (m)",
              color: "#94a3b8",
              font: { family: "'Inter', sans-serif", size: 11 }
            },
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: {
              color: "#64748b",
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            }
          },
          x: {
            title: {
              display: true,
              text: `${varConfig.name} (${varConfig.unit})`,
              color: "#94a3b8",
              font: { family: "'Inter', sans-serif", size: 11 }
            },
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: {
              color: "#64748b",
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            }
          }
        }
      }
    });
  }

  openDrawer() {
    this.container.classList.add("open");
    const peekBtn = document.getElementById("btn-open-analysis");
    if (peekBtn) peekBtn.classList.add("drawer-open");
  }

  closeDrawer() {
    this.container.classList.remove("open");
    const peekBtn = document.getElementById("btn-open-analysis");
    if (peekBtn) peekBtn.classList.remove("drawer-open");
  }

  toggleDrawer() {
    if (this.container.classList.contains("open")) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  setObservation(argo, variable = "temperature", timeIndex = 2) {
    this.currentArgo = argo;
    this.currentVariable = variable;
    this.currentTimeIndex = timeIndex;
    this.enoiResult = null; // reset assimilation state for new float

    // Automatically slide drawer open so user sees analysis for selected float
    this.openDrawer();

    // Reset EnOI UI
    document.getElementById("enoi-progress-wrap").style.display = "none";
    document.getElementById("enoi-results-card").style.display = "none";
    document.getElementById("legend-enoi-item").style.display = "none";
    const btnRun = document.getElementById("btn-run-enoi");
    if (btnRun) {
      btnRun.disabled = false;
      document.getElementById("btn-enoi-text").textContent = "Run Localized EnOI Assimilation";
    }

    // Update Header and Metadata UI
    document.getElementById("argo-id-display").textContent = argo.id;
    document.getElementById("argo-status-badge").textContent = argo.status || "QC Passed";
    document.getElementById("argo-cycle-display").textContent = `Cycle #${argo.cycle}`;
    document.getElementById("argo-platform").textContent = argo.platform;
    document.getElementById("argo-coords").textContent = `${argo.latitude.toFixed(2)}°N, ${argo.longitude.toFixed(2)}°E`;
    document.getElementById("argo-region").textContent = argo.locationDesc || argo.region;
    document.getElementById("argo-sensor").textContent = argo.sensor;

    this.updateProfilesAndMetrics();
  }

  updateProfilesAndMetrics() {
    if (!this.currentArgo) return;

    const varConfig = VARIABLES[this.currentVariable];
    const unit = varConfig.unit;

    // Get observed profile
    const observedPoints = this.currentArgo[this.currentVariable] || [];
    
    // Get corresponding model background profile at this Argo's location
    const modelPoints = getModelProfile(
      this.currentArgo.latitude,
      this.currentArgo.longitude,
      this.currentVariable,
      this.currentTimeIndex
    );

    // Compute live scientific metrics using JavaScript functions
    const obsVals = observedPoints.map(p => p.value);
    const modVals = modelPoints.map(p => p.value);

    const rmse = calculateRMSE(obsVals, modVals);
    const bias = calculateBias(obsVals, modVals);
    const maxErr = calculateMaxError(obsVals, modVals);

    // Update metric cards
    const rmseCard = document.getElementById("metric-rmse-card");
    const rmseVal = document.getElementById("metric-rmse-val");
    const biasVal = document.getElementById("metric-bias-val");
    const maxErrVal = document.getElementById("metric-maxerr-val");
    const rmseDelta = document.getElementById("metric-rmse-delta");

    if (rmseCard) {
      rmseCard.className = "metric-card highlight";
    }
    if (rmseVal) rmseVal.innerHTML = `${rmse.toFixed(2)}<span class="metric-unit">${unit}</span>`;
    if (biasVal) biasVal.innerHTML = `${(bias >= 0 ? "+" : "") + bias.toFixed(2)}<span class="metric-unit">${unit}</span>`;
    if (maxErrVal) maxErrVal.innerHTML = `${maxErr.toFixed(2)}<span class="metric-unit">${unit}</span>`;
    if (rmseDelta) rmseDelta.textContent = "Raw Model Error";

    // Update chart
    if (this.chart) {
      this.chart.options.scales.x.title.text = `${varConfig.name} (${unit})`;
      this.chart.data.labels = observedPoints.map(p => p.depth);
      this.chart.data.datasets[0].data = obsVals;
      this.chart.data.datasets[1].data = modVals;
      this.chart.data.datasets[2].hidden = true;
      this.chart.update();
    }
  }

  bindButtons() {
    // Run EnOI Button
    const btnRun = document.getElementById("btn-run-enoi");
    btnRun?.addEventListener("click", () => this.handleRunEnOI());

    // Toggle Before vs After view
    const btnToggle = document.getElementById("btn-toggle-viewmode");
    const btnToggleText = document.getElementById("btn-toggle-viewmode-text");
    btnToggle?.addEventListener("click", () => {
      if (!this.enoiResult) return;
      this.showAfterMode = !this.showAfterMode;

      if (this.showAfterMode) {
        btnToggleText.textContent = "Showing: Post-EnOI Analysis";
        btnToggle.style.color = "#34d399";
        btnToggle.style.borderColor = "rgba(16, 185, 129, 0.4)";
        this.chart.data.datasets[2].hidden = false;
        this.chart.data.datasets[1].borderDash = [5, 5];
        this.chart.data.datasets[1].borderColor = "rgba(249, 115, 22, 0.35)";
      } else {
        btnToggleText.textContent = "Showing: Pre-Assimilation State";
        btnToggle.style.color = "#f97316";
        btnToggle.style.borderColor = "rgba(249, 115, 22, 0.4)";
        this.chart.data.datasets[2].hidden = true;
        this.chart.data.datasets[1].borderDash = [];
        this.chart.data.datasets[1].borderColor = "#f97316";
      }
      this.chart.update();
    });

    // Reset EnOI Experiment
    const btnReset = document.getElementById("btn-reset-enoi");
    btnReset?.addEventListener("click", () => {
      this.enoiResult = null;
      document.getElementById("enoi-progress-wrap").style.display = "none";
      document.getElementById("enoi-results-card").style.display = "none";
      document.getElementById("legend-enoi-item").style.display = "none";
      btnRun.disabled = false;
      document.getElementById("btn-enoi-text").textContent = "Run Localized EnOI Assimilation";
      this.updateProfilesAndMetrics();
      this.onToast("Observation experiment state reset to raw model background.");
    });

    // Close Drawer
    document.getElementById("btn-close-analysis-drawer")?.addEventListener("click", () => {
      this.closeDrawer();
    });

    // Open/Toggle Drawer from peek button
    document.getElementById("btn-open-analysis")?.addEventListener("click", () => {
      this.toggleDrawer();
    });
  }

  async handleRunEnOI() {
    if (!this.currentArgo || this.isAssimilating) return;

    this.isAssimilating = true;
    const btnRun = document.getElementById("btn-run-enoi");
    const btnText = document.getElementById("btn-enoi-text");
    btnRun.disabled = true;
    btnText.textContent = "Assimilating Observation...";

    const progressWrap = document.getElementById("enoi-progress-wrap");
    const progressFill = document.getElementById("progress-bar-fill");
    const progressPct = document.getElementById("progress-percent");
    const progressStage = document.getElementById("progress-stage-title");
    const progressFormula = document.getElementById("progress-formula");
    progressWrap.style.display = "flex";

    // Trigger visual pulse on 2D ocean map
    this.onAssimilationTriggered(this.currentArgo.latitude, this.currentArgo.longitude);

    // Extract profiles
    const observedPoints = this.currentArgo[this.currentVariable] || [];
    const modelPoints = getModelProfile(
      this.currentArgo.latitude,
      this.currentArgo.longitude,
      this.currentVariable,
      this.currentTimeIndex
    );

    // Run EnOI simulation with live status updates
    const result = await runLocalizedEnOI(observedPoints, modelPoints, { gain: 0.65, delayStepMs: 380 }, (pct, stageText, formula) => {
      progressFill.style.width = `${pct}%`;
      progressPct.textContent = `${pct}%`;
      progressStage.textContent = stageText;
      progressFormula.textContent = formula;
    });

    this.enoiResult = result;
    this.isAssimilating = false;
    btnText.textContent = "✓ Assimilation Complete";

    // Show Results Card
    const resultsCard = document.getElementById("enoi-results-card");
    resultsCard.style.display = "flex";
    document.getElementById("legend-enoi-item").style.display = "flex";

    const unit = VARIABLES[this.currentVariable].unit;
    document.getElementById("stat-before-rmse").textContent = `${result.before.rmse} ${unit}`;
    document.getElementById("stat-after-rmse").textContent = `${result.after.rmse} ${unit}`;
    document.getElementById("enoi-reduction-badge").textContent = `▼ -${result.errorReductionPct}% Error Reduction`;

    // Update main metrics card to show success state
    const rmseCard = document.getElementById("metric-rmse-card");
    const rmseVal = document.getElementById("metric-rmse-val");
    const biasVal = document.getElementById("metric-bias-val");
    const maxErrVal = document.getElementById("metric-maxerr-val");
    const rmseDelta = document.getElementById("metric-rmse-delta");

    if (rmseCard) rmseCard.className = "metric-card success";
    if (rmseVal) rmseVal.innerHTML = `${result.after.rmse}<span class="metric-unit">${unit}</span>`;
    if (biasVal) biasVal.innerHTML = `${(result.after.bias >= 0 ? "+" : "") + result.after.bias}<span class="metric-unit">${unit}</span>`;
    if (maxErrVal) maxErrVal.innerHTML = `${result.after.maxError}<span class="metric-unit">${unit}</span>`;
    if (rmseDelta) rmseDelta.textContent = `▼ -${result.errorReductionPct}% Post-EnOI`;

    // Update Chart with Assimilated curve
    this.chart.data.datasets[1].borderColor = "rgba(249, 115, 22, 0.4)";
    this.chart.data.datasets[2].data = result.updatedProfile.map(p => p.value);
    this.chart.data.datasets[2].hidden = false;
    this.chart.update();

    this.onToast(`EnOI Assimilated: Profile RMSE reduced from ${result.before.rmse} ${unit} to ${result.after.rmse} ${unit}!`);
  }
}
