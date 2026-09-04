import { OceanViewer } from "./components/OceanViewer.js";
import { ControlPanel } from "./components/ControlPanel.js";
import { ProfilePanel } from "./components/ProfilePanel.js";
import { StatusBar } from "./components/StatusBar.js";
import { LandingPage } from "./components/LandingPage.js";
import { ARGO_PROFILES, getArgoById } from "./data/argoData.js";
import { TIMESTAMPS } from "./data/modelData.js";

class OceanVisApp {
  constructor() {
    this.currentArgo = ARGO_PROFILES[0];
    this.currentVariable = "temperature";
    this.currentDepth = 0;
    this.currentTimeIndex = 2;

    this.tourStep = 0;
    this.tourActive = false;
    this.currentRoute = "landing"; // "landing" | "dashboard"

    this.init();
  }

  init() {
    // 1. Initialize Status Bar
    this.statusBar = new StatusBar("status-bar");

    // 2. Initialize Ocean 3D/2D Viewer
    this.viewer = new OceanViewer("ocean-map", {
      onSelectArgo: (argo) => {
        this.currentArgo = argo;
        this.profilePanel.setObservation(argo, this.currentVariable, this.currentTimeIndex);
        this.profilePanel.openDrawer();
        this.showToast(`Selected Observation Float: ${argo.id}`);
      },
      onHoverCoord: (data) => {
        this.statusBar.update({
          coords: { lat: data.lat, lon: data.lon },
          bathymetry: data.bathymetry
        });

        // Update probe popup
        const probeEl = document.getElementById("probe-tooltip");
        if (probeEl) {
          probeEl.style.display = "block";
          probeEl.style.left = `${data.x}px`;
          probeEl.style.top = `${data.y}px`;
          probeEl.innerHTML = `
            <div style="color: #38bdf8; font-weight: 600;">Pos: ${data.lat}°N, ${data.lon}°E</div>
            <div>Model ${data.variable.toUpperCase()}: <strong style="color: #34d399;">${data.value}</strong></div>
            <div style="color: #94a3b8; font-size: 0.68rem;">Depth: ${data.depth}m | Bathy: ${data.bathymetry}m</div>
          `;
        }
      },
      onRegionSelected: (bounds) => {
        const coordsEl = document.getElementById("region-hud-coords");
        if (coordsEl) {
          coordsEl.textContent = `${bounds.minLat.toFixed(1)}°–${bounds.maxLat.toFixed(1)}°N, ${bounds.minLon.toFixed(1)}°–${bounds.maxLon.toFixed(1)}°E`;
        }
        this.showToast(`Selected Extent: ${bounds.minLat.toFixed(1)}°-${bounds.maxLat.toFixed(1)}°N, ${bounds.minLon.toFixed(1)}°-${bounds.maxLon.toFixed(1)}°E`);
      },
      onEnterDepthRequested: (bounds) => {
        this.updateCameraSwitcherUI("depth");
        this.showToast("Entering Depth 3D View with selected geographic extent.");
      }
    });

    // Hide probe on mouse leave
    document.getElementById("ocean-map")?.addEventListener("mouseleave", () => {
      const probeEl = document.getElementById("probe-tooltip");
      if (probeEl) probeEl.style.display = "none";
    });

    // 3. Initialize Left Control Rail
    this.controlPanel = new ControlPanel("control-panel", {
      onChange: (state) => {
        this.currentVariable = state.variable;
        this.currentDepth = state.depth;
        this.currentTimeIndex = state.timeIndex;

        // Update viewer
        this.viewer.updateState({
          variable: state.variable,
          depth: state.depth,
          timeIndex: state.timeIndex,
          showModelRaster: state.showModelRaster,
          showStreamlines: state.showStreamlines,
          showArgoMarkers: state.showArgoMarkers,
          showBathymetry: state.showBathymetry,
          rasterOpacity: state.rasterOpacity
        });

        // Update profile panel
        this.profilePanel.currentVariable = state.variable;
        this.profilePanel.currentTimeIndex = state.timeIndex;
        this.profilePanel.updateProfilesAndMetrics();

        // Update status bar
        this.statusBar.update({
          variable: state.variable,
          depth: state.depth,
          timeLabel: TIMESTAMPS[state.timeIndex].label
        });
      },
      onResetView: () => {
        this.viewer.resetView();
        this.updateCameraSwitcherUI("global");
        this.showToast("Camera reset to Bay of Bengal basin.");
      },
      onRegionBoundsChange: (bounds) => {
        this.viewer.setRegionBounds(bounds);
        const coordsEl = document.getElementById("region-hud-coords");
        if (coordsEl) {
          coordsEl.textContent = `${bounds.minLat.toFixed(1)}°–${bounds.maxLat.toFixed(1)}°N, ${bounds.minLon.toFixed(1)}°–${bounds.maxLon.toFixed(1)}°E`;
        }
        this.showToast(`Domain Bounds: ${bounds.minLat.toFixed(1)}°-${bounds.maxLat.toFixed(1)}°N, ${bounds.minLon.toFixed(1)}°-${bounds.maxLon.toFixed(1)}°E`);
      },
      onToggle3D: () => {
        const is3d = this.viewer.toggle3D();
        this.updateCameraSwitcherUI(is3d ? "depth" : "global");
        this.showToast(is3d ? "Switched to 2.5D Bathymetric Oblique View" : "Switched to Global Basin Overview");
        return is3d;
      },
      onCycloneClick: () => {
        this.showToast("Cyclone 3D Module: Technical details opened.");
      }
    });

    // 4. Initialize Right Profile & Assimilation Drawer
    this.profilePanel = new ProfilePanel("profile-panel", {
      onAssimilationTriggered: (lat, lon) => {
        this.viewer.triggerAssimilationPulse(lat, lon);
      },
      onToast: (msg) => this.showToast(msg)
    });

    // Populate Argo markers onto map and select first float
    this.viewer.renderArgoMarkers(ARGO_PROFILES);
    this.viewer.selectArgo(this.currentArgo.id);
    this.profilePanel.setObservation(this.currentArgo, this.currentVariable, this.currentTimeIndex);

    // Bind Header actions, Camera switcher, and Modals
    this.bindHeaderActions();
    this.bindCameraSwitcher();
    this.bindCycloneModal();

    // 5. Initialize Professional Landing Page
    this.landingPage = new LandingPage({
      onEnterDashboard: () => {
        this.navigateTo("dashboard");
      },
      onLaunchTour: () => {
        this.navigateTo("dashboard");
        setTimeout(() => {
          this.startGuidedTour();
        }, 350);
      }
    });

    // Handle initial URL route / hash
    this.handleInitialRoute();

    console.log("OceanVis-3D Prototype Initialized successfully.");
  }

  handleInitialRoute() {
    const hash = window.location.hash;
    const path = window.location.pathname;

    if (hash === "#dashboard" || path === "/dashboard") {
      this.navigateTo("dashboard", false);
    } else {
      this.navigateTo("landing", false);
    }

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#dashboard") {
        this.navigateTo("dashboard", false);
      } else if (window.location.hash === "" || window.location.hash === "#landing") {
        this.navigateTo("landing", false);
      }
    });
  }

  navigateTo(route, updateHistory = true) {
    this.currentRoute = route;
    const appEl = document.getElementById("app");

    if (route === "dashboard") {
      if (this.landingPage) this.landingPage.hide();
      if (appEl) appEl.classList.remove("landing-active");
      if (updateHistory) {
        window.location.hash = "dashboard";
      }
      // Ensure WebGL viewport adjusts correctly
      setTimeout(() => {
        if (this.viewer && this.viewer.onResize) {
          this.viewer.onResize();
        }
      }, 50);
      this.showToast("Entered OceanVis-3D Scientific Workspace.");
    } else {
      if (this.landingPage) this.landingPage.show();
      if (appEl) appEl.classList.add("landing-active");
      if (updateHistory) {
        window.location.hash = "";
      }
    }
  }

  bindCameraSwitcher() {
    const btnGlobal = document.getElementById("btn-cam-global");
    const btnDepth = document.getElementById("btn-cam-depth");
    const btnEnterDepthHud = document.getElementById("btn-enter-depth-hud");

    btnGlobal?.addEventListener("click", () => {
      this.updateCameraSwitcherUI("global");
      this.viewer.setCameraMode("global");
      this.showToast("Camera Mode 1: Global Basin Overview");
    });

    btnDepth?.addEventListener("click", () => {
      this.updateCameraSwitcherUI("depth");
      this.viewer.setCameraMode("depth");
      this.showToast("Camera Mode 2: Depth 3D Vertical Structure");
    });

    btnEnterDepthHud?.addEventListener("click", () => {
      this.viewer.enterDepthViewWithBounds(this.viewer.activeBounds);
      this.updateCameraSwitcherUI("depth");
    });

    // Depth View Direction Switcher (Requirement 6)
    const dirBtns = document.querySelectorAll(".depth-dir-btn");
    dirBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        dirBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const dir = btn.dataset.dir;
        this.viewer.setDepthViewDirection(dir);
        const dirNames = { front: "View A (Front-West)", back: "View B (Back-East)", oblique: "3D Oblique Angle" };
        this.showToast(`Depth 3D Angle: ${dirNames[dir] || dir}`);
      });
    });
  }

  updateCameraSwitcherUI(mode) {
    const btnGlobal = document.getElementById("btn-cam-global");
    const btnDepth = document.getElementById("btn-cam-depth");
    const dirSwitcher = document.getElementById("depth-view-switcher");
    const hudEnterBtn = document.getElementById("btn-enter-depth-hud");
    const hudTag = document.querySelector(".region-hud-tag");

    if (mode === "depth") {
      btnDepth?.classList.add("active");
      btnGlobal?.classList.remove("active");
      if (dirSwitcher) dirSwitcher.style.display = "flex";
      if (hudEnterBtn) hudEnterBtn.style.display = "none";
      if (hudTag) hudTag.textContent = "DEPTH 3D EXTENT";
    } else {
      btnGlobal?.classList.add("active");
      btnDepth?.classList.remove("active");
      if (dirSwitcher) dirSwitcher.style.display = "none";
      if (hudEnterBtn) hudEnterBtn.style.display = "flex";
      if (hudTag) hudTag.textContent = "ANALYSIS EXTENT";
    }
  }

  bindCycloneModal() {
    const modal = document.getElementById("cyclone-modal");
    const closeModal = () => {
      if (modal) modal.style.display = "none";
    };

    document.getElementById("btn-close-cyclone-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-dismiss-cyclone")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  bindHeaderActions() {
    // Return to Landing Page
    document.getElementById("btn-header-home")?.addEventListener("click", () => {
      this.navigateTo("landing");
    });

    // Reset App
    document.getElementById("btn-header-reset")?.addEventListener("click", () => {
      this.resetEntireApp();
    });

    // Guided Tour for SIH Presentation
    document.getElementById("btn-header-tour")?.addEventListener("click", () => {
      this.startGuidedTour();
    });

    // Tour Next button
    document.getElementById("tour-next-btn")?.addEventListener("click", () => {
      this.advanceTourStep();
    });

    // Close tour button
    document.getElementById("tour-close-btn")?.addEventListener("click", () => {
      this.stopGuidedTour();
    });
  }

  resetEntireApp() {
    // Reset selection to first float
    this.currentArgo = ARGO_PROFILES[0];
    this.currentVariable = "temperature";
    this.currentDepth = 0;
    this.currentTimeIndex = 2;

    // Reset control panel
    this.controlPanel.state.variable = "temperature";
    this.controlPanel.state.depth = 0;
    this.controlPanel.state.timeIndex = 2;
    this.controlPanel.closeFlyout();
    this.controlPanel.render();

    // Reset camera mode
    this.updateCameraSwitcherUI("global");

    // Reset viewer
    this.viewer.updateState({
      variable: "temperature",
      depth: 0,
      timeIndex: 2,
      showModelRaster: true,
      showStreamlines: true,
      showArgoMarkers: true,
      showBathymetry: true
    });
    this.viewer.setCameraMode("global");
    this.viewer.selectArgo(this.currentArgo.id);

    // Reset profile panel
    this.profilePanel.setObservation(this.currentArgo, "temperature", 2);

    // Reset status bar
    this.statusBar.update({
      variable: "temperature",
      depth: 0,
      timeLabel: TIMESTAMPS[2].label
    });

    this.showToast("Application reset to initial scientific state.");
  }

  showToast(message) {
    const toast = document.getElementById("app-toast");
    const toastMsg = document.getElementById("toast-message");
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add("show");

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  // GUIDED TOUR WORKFLOW: Video presentation sequence
  startGuidedTour() {
    this.tourActive = true;
    this.tourStep = 1;
    const tourBanner = document.getElementById("tour-banner");
    if (tourBanner) tourBanner.style.display = "flex";
    this.executeTourStep();
  }

  stopGuidedTour() {
    this.tourActive = false;
    const tourBanner = document.getElementById("tour-banner");
    if (tourBanner) tourBanner.style.display = "none";
  }

  advanceTourStep() {
    this.tourStep++;
    if (this.tourStep > 6) {
      this.stopGuidedTour();
      this.showToast("Guided Demo Tour completed successfully!");
      return;
    }
    this.executeTourStep();
  }

  executeTourStep() {
    const badge = document.getElementById("tour-step-badge");
    const text = document.getElementById("tour-step-text");

    switch (this.tourStep) {
      case 1:
        badge.textContent = "Step 1 of 6";
        text.textContent = "1. EXPLORE: Exploring Sea Surface Temperature (SST) model field in Bay of Bengal";
        this.updateCameraSwitcherUI("global");
        this.viewer.setCameraMode("global");
        this.viewer.map.flyTo([15.0, 88.0], 5.8, { duration: 1.0 });
        break;

      case 2:
        badge.textContent = "Step 2 of 6";
        text.textContent = "2. DEPTH: Slicing through Thermocline layer at 100m depth (Mode 2 — Depth 3D)";
        this.updateCameraSwitcherUI("depth");
        this.viewer.setCameraMode("depth");
        // Trigger 100m depth click
        document.querySelector('.depth-tag-btn[data-depth="100"]')?.click();
        break;

      case 3:
        badge.textContent = "Step 3 of 6";
        text.textContent = "3. OBSERVE: Selecting In-Situ Argo Float ARGO-2901844 in Warm Eddy";
        const argo = getArgoById("ARGO-2901844");
        this.viewer.selectArgo(argo.id);
        this.profilePanel.setObservation(argo, this.currentVariable, this.currentTimeIndex);
        this.profilePanel.openDrawer();
        this.viewer.map.flyTo([argo.latitude, argo.longitude], 6.5, { duration: 1.0 });
        break;

      case 4:
        badge.textContent = "Step 4 of 6";
        text.textContent = "4. VERIFY: Comparing In-Situ CTD Observation vs Model Background (Raw RMSE: 0.84°C)";
        this.profilePanel.openDrawer();
        break;

      case 5:
        badge.textContent = "Step 5 of 6";
        text.textContent = "5. ASSIMILATE: Running Localized EnOI Demonstration...";
        this.profilePanel.openDrawer();
        document.getElementById("btn-run-enoi")?.click();
        break;

      case 6:
        badge.textContent = "Step 6 of 6";
        text.textContent = "6. IMPROVE: Validating Post-EnOI Analysis state (RMSE reduced by ~73%!)";
        this.profilePanel.openDrawer();
        break;
    }
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.oceanVisApp = new OceanVisApp();
});
