import { DEPTH_LEVELS, TIMESTAMPS, VARIABLES, REGIONS } from "../data/modelData.js";
import { getLegendGradient } from "../utils/colormaps.js";

export class ControlPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onChange = options.onChange || (() => {});
    this.onResetView = options.onResetView || (() => {});
    this.onToggle3D = options.onToggle3D || (() => {});
    this.onCycloneClick = options.onCycloneClick || (() => {});
    this.onRegionBoundsChange = options.onRegionBoundsChange || (() => {});

    this.state = {
      region: "bob",
      variable: "temperature",
      depth: 0,
      timeIndex: 2,
      isPlaying: false,
      showModelRaster: true,
      showStreamlines: true,
      showArgoMarkers: true,
      showBathymetry: true,
      rasterOpacity: 0.85
    };

    // Active progressive flyout: 'variables' | 'depth' | 'time' | 'layers' | 'domain' | null
    this.activeFlyout = null;
    this.playInterval = null;
    this.render();
  }

  toggleFlyout(flyoutName) {
    if (this.activeFlyout === flyoutName) {
      this.activeFlyout = null;
    } else {
      this.activeFlyout = flyoutName;
    }
    this.updateFlyoutVisibility();
  }

  closeFlyout() {
    this.activeFlyout = null;
    this.updateFlyoutVisibility();
  }

  updateFlyoutVisibility() {
    const railItems = this.container.querySelectorAll(".rail-btn");
    railItems.forEach(btn => {
      const target = btn.dataset.flyout;
      if (target && target === this.activeFlyout) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const flyoutWrap = this.container.querySelector(".rail-flyout-drawer");
    if (!flyoutWrap) return;

    if (this.activeFlyout) {
      flyoutWrap.classList.add("open");
      const contents = flyoutWrap.querySelectorAll(".flyout-content-pane");
      contents.forEach(pane => {
        if (pane.id === `pane-${this.activeFlyout}`) {
          pane.classList.add("active");
        } else {
          pane.classList.remove("active");
        }
      });
    } else {
      flyoutWrap.classList.remove("open");
    }
  }

  render() {
    this.container.innerHTML = `
      <!-- COMPACT VERTICAL CONTROL RAIL (64px) -->
      <div class="rail-bar">
        <div class="rail-top-group">
          <!-- VARIABLE SELECTOR -->
          <button class="rail-btn ${this.activeFlyout === 'variables' ? 'active' : ''}" data-flyout="variables" id="rail-btn-var" title="Oceanic Variables (SST, SSS, Velocity)">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></div>
            <span class="rail-label">Variable</span>
            <span class="rail-chip" id="rail-var-badge">SST</span>
          </button>

          <!-- DEPTH SLICE -->
          <button class="rail-btn ${this.activeFlyout === 'depth' ? 'active' : ''}" data-flyout="depth" id="rail-btn-depth" title="Vertical Depth Slice (0m to 2000m)">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="m19 12-7 7-7-7"/><path d="M5 21h14"/></svg></div>
            <span class="rail-label">Depth</span>
            <span class="rail-chip" id="rail-depth-badge">${this.state.depth}m</span>
          </button>

          <!-- TEMPORAL FORECAST -->
          <button class="rail-btn ${this.activeFlyout === 'time' ? 'active' : ''}" data-flyout="time" id="rail-btn-time" title="Simulation Time Step (Forecast)">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <span class="rail-label">Time</span>
            <span class="rail-chip" id="rail-time-badge">T+${this.state.timeIndex * 12}h</span>
          </button>

          <!-- LAYER STACK -->
          <button class="rail-btn ${this.activeFlyout === 'layers' ? 'active' : ''}" data-flyout="layers" id="rail-btn-layers" title="Layer Visibility & Opacity">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
            <span class="rail-label">Layers</span>
            <span class="rail-chip">4 On</span>
          </button>

          <!-- OCEAN DOMAIN -->
          <button class="rail-btn ${this.activeFlyout === 'domain' ? 'active' : ''}" data-flyout="domain" id="rail-btn-domain" title="Geographic Basin Domain">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
            <span class="rail-label">Domain</span>
            <span class="rail-chip">BoB</span>
          </button>

          <!-- CYCLONE 3D VISUALIZATION (PLANNED SCIENTIFIC MODULE) -->
          <button class="rail-btn rail-btn-cyclone" id="rail-btn-cyclone" title="Tropical Cyclone 3D Visualization (Atmospheric Coupling)">
            <div class="rail-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12"/><path d="M12 6a6 6 0 0 1 6 6c0 3.3-2.7 6-6 6s-6-2.7-6-6"/></svg></div>
            <span class="rail-label">Cyclone</span>
            <span class="rail-badge-new">3D</span>
          </button>
        </div>

        <div class="rail-bottom-group">
          <!-- QUICK RESET VIEW -->
          <button class="rail-btn-secondary" id="rail-btn-reset-view" title="Reset Ocean View to Central Bay of Bengal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span class="rail-mini-hint">Reset</span>
          </button>
        </div>
      </div>

      <!-- PROGRESSIVE FLYOUT DRAWER (EXPANDS ADJACENT TO RAIL) -->
      <div class="rail-flyout-drawer ${this.activeFlyout ? 'open' : ''}">
        <!-- PANE 1: VARIABLES -->
        <div class="flyout-content-pane ${this.activeFlyout === 'variables' ? 'active' : ''}" id="pane-variables">
          <div class="flyout-header">
            <div>
              <div class="flyout-title">Oceanic Variables</div>
              <div class="flyout-desc">Scientific scalar and vector fields</div>
            </div>
            <button class="flyout-close-btn" data-close="variables">✕</button>
          </div>

          <div class="flyout-body">
            <div class="flyout-section-label">SELECT FIELD</div>
            <div class="variable-grid">
              <button class="var-card ${this.state.variable === 'temperature' ? 'active' : ''}" data-var="temperature" id="btn-var-temp">
                <div class="var-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></div>
                <div class="var-card-meta">
                  <div class="var-card-title">Potential Temperature</div>
                  <div class="var-card-sub">Thermal Structure & Thermocline (°C)</div>
                </div>
                <div class="var-card-unit">°C</div>
              </button>

              <button class="var-card ${this.state.variable === 'salinity' ? 'active' : ''}" data-var="salinity" id="btn-var-sal">
                <div class="var-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l1 5H5l1-5z"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/><path d="M10 16h4"/></svg></div>
                <div class="var-card-meta">
                  <div class="var-card-title">Practical Salinity</div>
                  <div class="var-card-sub">Freshwater Plumes & Halocline (PSU)</div>
                </div>
                <div class="var-card-unit">PSU</div>
              </button>

              <button class="var-card ${this.state.variable === 'velocity' ? 'active' : ''}" data-var="velocity" id="btn-var-vel">
                <div class="var-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8"/><path d="M2 12c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8"/><path d="M2 18c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8"/></svg></div>
                <div class="var-card-meta">
                  <div class="var-card-title">Current Velocity</div>
                  <div class="var-card-sub">EICC Coastal Jet & Mesoscale Gyres</div>
                </div>
                <div class="var-card-unit">m/s</div>
              </button>
            </div>

            <div class="flyout-info-callout">
              <strong>Visual Encoding:</strong> Turbo thermal palette for temperature; Haline deep-navy to gold for salinity; dynamic velocity streamlines for geostrophic currents.
            </div>
          </div>
        </div>

        <!-- PANE 2: DEPTH SLICE -->
        <div class="flyout-content-pane ${this.activeFlyout === 'depth' ? 'active' : ''}" id="pane-depth">
          <div class="flyout-header">
            <div>
              <div class="flyout-title">Vertical Depth Slice</div>
              <div class="flyout-desc">Z-Level isobath analysis (0m - 2000m)</div>
            </div>
            <button class="flyout-close-btn" data-close="depth">✕</button>
          </div>

          <div class="flyout-body">
            <div class="depth-slider-header">
              <span class="depth-cur-val" id="depth-badge">${this.state.depth} m</span>
              <span class="depth-zone-name" id="depth-layer-name">Sea Surface (Mixed Layer)</span>
            </div>

            <input type="range" id="depth-slider" min="0" max="7" step="1" value="${DEPTH_LEVELS.indexOf(this.state.depth) >= 0 ? DEPTH_LEVELS.indexOf(this.state.depth) : 0}" />

            <div class="flyout-section-label" style="margin-top: 14px;">STANDARD OCEANOGRAPHIC Z-LEVELS</div>
            <div class="depth-pills-grid">
              ${DEPTH_LEVELS.map(d => `
                <button class="depth-tag-btn ${this.state.depth === d ? 'active' : ''}" data-depth="${d}">
                  ${d}m
                </button>
              `).join("")}
            </div>

            <div class="flyout-info-callout">
              <strong>Observation Note:</strong> Thermocline gradient intensifies between 50m and 150m depth in the central Bay of Bengal.
            </div>
          </div>
        </div>

        <!-- PANE 3: SIMULATION TIME -->
        <div class="flyout-content-pane ${this.activeFlyout === 'time' ? 'active' : ''}" id="pane-time">
          <div class="flyout-header">
            <div>
              <div class="flyout-title">Simulation Time Step</div>
              <div class="flyout-desc">MOM6/HYCOM 72-Hour Hindcast & Forecast</div>
            </div>
            <button class="flyout-close-btn" data-close="time">✕</button>
          </div>

          <div class="flyout-body">
            <div class="time-readout-card">
              <div class="time-step-lbl" id="time-step-badge">Step ${this.state.timeIndex + 1} of ${TIMESTAMPS.length}</div>
              <div class="time-main-label" id="time-label">${TIMESTAMPS[this.state.timeIndex].label}</div>
            </div>

            <input type="range" id="time-slider" min="0" max="${TIMESTAMPS.length - 1}" step="1" value="${this.state.timeIndex}" style="margin: 12px 0;" />

            <div class="time-action-row">
              <button class="time-control-btn" id="btn-time-prev" title="Step Backward">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button class="time-play-btn" id="btn-time-play">
                <span id="play-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>
                <span id="play-text">Play Forecast</span>
              </button>
              <button class="time-control-btn" id="btn-time-next" title="Step Forward">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- PANE 4: LAYERS -->
        <div class="flyout-content-pane ${this.activeFlyout === 'layers' ? 'active' : ''}" id="pane-layers">
          <div class="flyout-header">
            <div>
              <div class="flyout-title">Layer Visibility</div>
              <div class="flyout-desc">Canvas overlays & bathymetric contours</div>
            </div>
            <button class="flyout-close-btn" data-close="layers">✕</button>
          </div>

          <div class="flyout-body">
            <label class="toggle-item">
              <div class="toggle-meta">
                <span>Model Scalar Heatmap</span>
                <span class="toggle-sub">High-resolution spatial interpolation</span>
              </div>
              <div class="switch">
                <input type="checkbox" id="toggle-raster" ${this.state.showModelRaster ? 'checked' : ''} />
                <span class="slider-round"></span>
              </div>
            </label>

            <label class="toggle-item">
              <div class="toggle-meta">
                <span>Current Streamlines</span>
                <span class="toggle-sub">Animated Lagrangian flow vectors</span>
              </div>
              <div class="switch">
                <input type="checkbox" id="toggle-streamlines" ${this.state.showStreamlines ? 'checked' : ''} />
                <span class="slider-round"></span>
              </div>
            </label>

            <label class="toggle-item">
              <div class="toggle-meta">
                <span>Argo Floats (In-Situ)</span>
                <span class="toggle-sub">D-Mode verified vertical profilers</span>
              </div>
              <div class="switch">
                <input type="checkbox" id="toggle-argo" ${this.state.showArgoMarkers ? 'checked' : ''} />
                <span class="slider-round"></span>
              </div>
            </label>

            <label class="toggle-item">
              <div class="toggle-meta">
                <span>Bathymetry Isobaths</span>
                <span class="toggle-sub">Deep basin depth contours (-800m to -3200m)</span>
              </div>
              <div class="switch">
                <input type="checkbox" id="toggle-bathy" ${this.state.showBathymetry ? 'checked' : ''} />
                <span class="slider-round"></span>
              </div>
            </label>

            <div class="opacity-control-block">
              <div class="opacity-header">
                <span>Scalar Heatmap Opacity</span>
                <span id="opacity-val">${Math.round(this.state.rasterOpacity * 100)}%</span>
              </div>
              <input type="range" id="opacity-slider" min="20" max="100" value="${Math.round(this.state.rasterOpacity * 100)}" />
            </div>
          </div>
        </div>

        <!-- PANE 5: OCEAN DOMAIN -->
        <div class="flyout-content-pane ${this.activeFlyout === 'domain' ? 'active' : ''}" id="pane-domain">
          <div class="flyout-header">
            <div>
              <div class="flyout-title">Ocean Domain</div>
              <div class="flyout-desc">Regional bounding box & grid resolution</div>
            </div>
            <button class="flyout-close-btn" data-close="domain">✕</button>
          </div>

          <div class="flyout-body">
            <div class="region-options-stack">
              <button class="region-option-btn active" data-region="bob">
                <div class="region-flag"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8"/></svg></div>
                <div>
                  <div class="region-opt-name">Bay of Bengal (Active Basin)</div>
                  <div class="region-opt-coords">8°N - 22°N, 80°E - 95°E • 1/12° Grid</div>
                </div>
              </button>
              <button class="region-option-btn" data-region="arabian">
                <div class="region-flag"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg></div>
                <div>
                  <div class="region-opt-name">Arabian Sea</div>
                  <div class="region-opt-coords">6°N - 24°N, 60°E - 77°E (Western Domain)</div>
                </div>
              </button>
              <button class="region-option-btn" data-region="equatorial">
                <div class="region-flag"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></div>
                <div>
                  <div class="region-opt-name">Equatorial Indian Ocean</div>
                  <div class="region-opt-coords">5°S - 5°N, 65°E - 95°E (Wyrtki Jets)</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateLegendCard();
    this.updateHeaderBadges();
  }

  bindEvents() {
    // Rail toggle buttons
    const railButtons = this.container.querySelectorAll(".rail-btn[data-flyout]");
    railButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const flyout = btn.dataset.flyout;
        this.toggleFlyout(flyout);
      });
    });

    // Close buttons on flyout panes
    const closeButtons = this.container.querySelectorAll(".flyout-close-btn");
    closeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.closeFlyout();
      });
    });

    // Cyclone Button (Opens explicit placeholder modal)
    document.getElementById("rail-btn-cyclone")?.addEventListener("click", () => {
      this.closeFlyout();
      const modal = document.getElementById("cyclone-modal");
      if (modal) modal.style.display = "flex";
      this.onCycloneClick();
    });

    // Reset View Button
    document.getElementById("rail-btn-reset-view")?.addEventListener("click", () => {
      this.onResetView();
    });

    // Variables
    const varButtons = this.container.querySelectorAll(".var-card");
    varButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        varButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.state.variable = btn.dataset.var;

        const badge = document.getElementById("rail-var-badge");
        if (badge) {
          badge.textContent = this.state.variable === "temperature" ? "SST" : (this.state.variable === "salinity" ? "SSS" : "VEL");
        }

        this.updateHeaderBadges();
        this.updateLegendCard();
        this.notifyChange();
      });
    });

    // Depth Slider & Tags
    const depthSlider = this.container.querySelector("#depth-slider");
    const depthBadge = this.container.querySelector("#depth-badge");
    const depthDesc = this.container.querySelector("#depth-layer-name");
    const depthTags = this.container.querySelectorAll(".depth-tag-btn");

    const updateDepthUI = (depthVal) => {
      this.state.depth = depthVal;
      const idx = DEPTH_LEVELS.indexOf(depthVal);
      if (depthSlider) depthSlider.value = idx >= 0 ? idx : 0;
      if (depthBadge) depthBadge.textContent = `${depthVal} m`;

      const railDepth = document.getElementById("rail-depth-badge");
      if (railDepth) railDepth.textContent = `${depthVal}m`;

      const varConf = VARIABLES[this.state.variable];
      const levelConf = varConf.levels[depthVal];
      if (depthDesc && levelConf) depthDesc.textContent = levelConf.desc;

      depthTags.forEach(t => {
        if (parseInt(t.dataset.depth, 10) === depthVal) {
          t.classList.add("active");
        } else {
          t.classList.remove("active");
        }
      });

      this.updateHeaderBadges();
      this.updateLegendCard();
      this.notifyChange();
    };

    depthSlider?.addEventListener("input", (e) => {
      const idx = parseInt(e.target.value, 10);
      const depthVal = DEPTH_LEVELS[idx] || 0;
      updateDepthUI(depthVal);
    });

    depthTags.forEach(tag => {
      tag.addEventListener("click", () => {
        const depthVal = parseInt(tag.dataset.depth, 10);
        updateDepthUI(depthVal);
      });
    });

    // Time Slider
    const timeSlider = this.container.querySelector("#time-slider");
    const timeLabel = this.container.querySelector("#time-label");
    const timeBadge = this.container.querySelector("#time-step-badge");

    const updateTimeUI = (tIdx) => {
      this.state.timeIndex = tIdx;
      if (timeSlider) timeSlider.value = tIdx;
      if (timeLabel) timeLabel.textContent = TIMESTAMPS[tIdx].label;
      if (timeBadge) timeBadge.textContent = `Step ${tIdx + 1} of ${TIMESTAMPS.length}`;

      const railTime = document.getElementById("rail-time-badge");
      if (railTime) railTime.textContent = `T+${tIdx * 12}h`;

      this.notifyChange();
    };

    timeSlider?.addEventListener("input", (e) => {
      updateTimeUI(parseInt(e.target.value, 10));
    });

    // Prev / Next / Play
    this.container.querySelector("#btn-time-prev")?.addEventListener("click", () => {
      const nextIdx = (this.state.timeIndex - 1 + TIMESTAMPS.length) % TIMESTAMPS.length;
      updateTimeUI(nextIdx);
    });

    this.container.querySelector("#btn-time-next")?.addEventListener("click", () => {
      const nextIdx = (this.state.timeIndex + 1) % TIMESTAMPS.length;
      updateTimeUI(nextIdx);
    });

    const btnPlay = this.container.querySelector("#btn-time-play");
    const playIcon = this.container.querySelector("#play-icon");
    const playText = this.container.querySelector("#play-text");

    btnPlay?.addEventListener("click", () => {
      this.state.isPlaying = !this.state.isPlaying;
      if (this.state.isPlaying) {
        if (playIcon) playIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        if (playText) playText.textContent = "Pause";
        btnPlay.classList.add("playing");
        this.playInterval = setInterval(() => {
          const nextIdx = (this.state.timeIndex + 1) % TIMESTAMPS.length;
          updateTimeUI(nextIdx);
        }, 1200);
      } else {
        if (playIcon) playIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        if (playText) playText.textContent = "Play Forecast";
        btnPlay.classList.remove("playing");
        if (this.playInterval) clearInterval(this.playInterval);
      }
    });

    // Layer Toggles
    this.container.querySelector("#toggle-raster")?.addEventListener("change", (e) => {
      this.state.showModelRaster = e.target.checked;
      this.notifyChange();
    });

    this.container.querySelector("#toggle-streamlines")?.addEventListener("change", (e) => {
      this.state.showStreamlines = e.target.checked;
      this.notifyChange();
    });

    this.container.querySelector("#toggle-argo")?.addEventListener("change", (e) => {
      this.state.showArgoMarkers = e.target.checked;
      this.notifyChange();
    });

    this.container.querySelector("#toggle-bathy")?.addEventListener("change", (e) => {
      this.state.showBathymetry = e.target.checked;
      this.notifyChange();
    });

    // Opacity
    const opacitySlider = this.container.querySelector("#opacity-slider");
    const opacityVal = this.container.querySelector("#opacity-val");
    opacitySlider?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      this.state.rasterOpacity = val / 100;
      if (opacityVal) opacityVal.textContent = `${val}%`;
      this.notifyChange();
    });

    // Domain / Region Selector buttons
    const regBtns = this.container.querySelectorAll(".region-option-btn");
    regBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        regBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const regId = btn.dataset.region;
        const reg = REGIONS[regId];
        if (reg && reg.bounds) {
          this.state.region = regId;
          this.onRegionBoundsChange(reg.bounds);
        }
      });
    });
  }

  updateHeaderBadges() {
    const varNameEl = document.getElementById("header-var-name");
    const depthNameEl = document.getElementById("header-depth-name");
    const varConf = VARIABLES[this.state.variable];

    if (varNameEl && varConf) {
      varNameEl.textContent = `${varConf.name}`;
    }
    if (depthNameEl) {
      depthNameEl.textContent = `${this.state.depth}m`;
    }
  }

  updateLegendCard() {
    const varConf = VARIABLES[this.state.variable];
    const levelConf = varConf.levels[this.state.depth] || { min: varConf.min, max: varConf.max };

    const titleEl = document.getElementById("legend-title");
    const paletteTag = document.getElementById("legend-palette-tag");
    const colorBar = document.getElementById("legend-bar");
    const minEl = document.getElementById("legend-min");
    const midEl = document.getElementById("legend-mid");
    const maxEl = document.getElementById("legend-max");

    if (titleEl) titleEl.textContent = `${varConf.name} (${varConf.unit})`;
    if (paletteTag) paletteTag.textContent = varConf.palette.toUpperCase();
    if (colorBar) colorBar.style.background = getLegendGradient(varConf.palette);
    if (minEl) minEl.textContent = `${levelConf.min.toFixed(1)} ${varConf.unit}`;
    if (midEl) midEl.textContent = `${((levelConf.min + levelConf.max) / 2).toFixed(1)} ${varConf.unit}`;
    if (maxEl) maxEl.textContent = `${levelConf.max.toFixed(1)} ${varConf.unit}`;
  }

  notifyChange() {
    this.onChange(this.state);
  }
}
