/**
 * LandingPage.js - Professional Scientific Landing Experience for OceanVis-3D
 * Institutional dark scientific aesthetic adhering to MoES / INCOIS standards.
 * Zero emojis - 100% precision inline SVG vector icons.
 */
export class LandingPage {
  constructor(options = {}) {
    this.onEnterDashboard = options.onEnterDashboard || (() => {});
    this.onLaunchTour = options.onLaunchTour || (() => {});
    this.container = null;
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "landing-page";
    this.container.className = "landing-page-root";
    this.container.innerHTML = this.template();
    document.body.appendChild(this.container);

    this.bindEvents();
  }

  template() {
    return `
      <!-- LANDING NAVBAR -->
      <nav class="landing-nav">
        <div class="landing-nav-inner">
          <div class="landing-brand">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8"/>
                <path d="M2 17c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8c.6.5 1.2.8 2 .8s1.4-.3 2-.8c.6-.5 1.2-.8 2-.8s1.4.3 2 .8"/>
                <circle cx="12" cy="7" r="3"/>
              </svg>
            </div>
            <div class="landing-brand-text">
              <span class="landing-brand-title">OceanVis-3D</span>
              <span class="landing-brand-tag">MoES / INCOIS</span>
            </div>
          </div>

          <div class="landing-nav-links">
            <a href="#about" class="landing-nav-link">About</a>
            <a href="#workflow" class="landing-nav-link">Scientific Workflow</a>
            <a href="#capabilities" class="landing-nav-link">Capabilities</a>
            <a href="#context" class="landing-nav-link">Project Context</a>
          </div>

          <div class="landing-nav-actions">
            <button class="btn-landing-primary btn-nav-cta" id="btn-landing-nav-dashboard">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>VIEW DASHBOARD</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- LANDING CONTENT WRAPPER -->
      <div class="landing-content-scroll">
        <!-- SECTION 1: HERO -->
        <section class="landing-section landing-hero-section" id="hero">
          <div class="landing-hero-grid">
            <!-- LEFT: HEADLINE & ACTIONS -->
            <div class="landing-hero-left">
              <div class="landing-hero-badge">
                <span class="pulse-dot"></span>
                <span>SIH26067 SCIENTIFIC BENCHMARK</span>
              </div>

              <h1 class="landing-hero-title">
                OCEANVIS-3D
              </h1>

              <h2 class="landing-hero-subtitle">
                3D Ocean Model Exploration, Observation & Validation
              </h2>

              <p class="landing-hero-desc">
                A scientific visualization platform for exploring ocean-model fields, comparing model output with in-situ Argo observations, and evaluating localized data assimilation across the Bay of Bengal.
              </p>

              <!-- HERO PRIMARY & SECONDARY CTAS -->
              <div class="landing-hero-ctas">
                <button class="btn-landing-primary btn-hero-main" id="btn-landing-hero-dashboard">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span>VIEW DASHBOARD</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>

                <button class="btn-landing-secondary" id="btn-landing-hero-tour">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span>GUIDED OVERVIEW</span>
                </button>
              </div>

              <!-- HERO METADATA ROW -->
              <div class="landing-hero-meta">
                <div class="hero-meta-item">
                  <span class="hero-meta-label">AGENCY</span>
                  <span class="hero-meta-val">Ministry of Earth Sciences</span>
                </div>
                <div class="hero-meta-divider"></div>
                <div class="hero-meta-item">
                  <span class="hero-meta-label">CENTRE</span>
                  <span class="hero-meta-val">INCOIS Hyderabad</span>
                </div>
                <div class="hero-meta-divider"></div>
                <div class="hero-meta-item">
                  <span class="hero-meta-label">CODE</span>
                  <span class="hero-meta-val">SIH26067</span>
                </div>
              </div>
            </div>

            <!-- RIGHT: 3D RESTING PREVIEW CARD -->
            <div class="landing-hero-right">
              <div class="hero-preview-frame">
                <div class="hero-preview-header">
                  <div class="preview-header-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="preview-header-title">MOM6/HYCOM 1/12° • BAY OF BENGAL (8°–22°N, 80°–95°E)</div>
                  <div class="preview-header-tag">3D ACTIVE</div>
                </div>
                <div class="hero-preview-canvas-wrap">
                  <div class="hero-preview-overlay-info">
                    <div class="preview-pill">
                      <span class="preview-dot"></span>
                      <span>POTENTIAL TEMPERATURE (TURBO)</span>
                    </div>
                    <div class="preview-depth-tag">0m — 2000m</div>
                  </div>
                  <div class="hero-preview-art">
                    <!-- Stylized SVG Globe & Depth Graphic matching exact Three.js coordinate schema -->
                    <svg viewBox="0 0 440 320" width="100%" height="100%" class="hero-svg-preview">
                      <defs>
                        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35"/>
                          <stop offset="70%" stop-color="#050811" stop-opacity="0.8"/>
                          <stop offset="100%" stop-color="#050811" stop-opacity="1"/>
                        </radialGradient>
                        <linearGradient id="volGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
                          <stop offset="30%" stop-color="#0284c7" stop-opacity="0.4"/>
                          <stop offset="70%" stop-color="#0f172a" stop-opacity="0.5"/>
                          <stop offset="100%" stop-color="#020617" stop-opacity="0.85"/>
                        </linearGradient>
                      </defs>
                      <!-- Globe Wireframe Base -->
                      <circle cx="220" cy="150" r="110" fill="url(#globeGlow)" stroke="#1e293b" stroke-width="1.5"/>
                      <ellipse cx="220" cy="150" rx="110" ry="40" fill="none" stroke="#334155" stroke-dasharray="3 3" opacity="0.6"/>
                      <ellipse cx="220" cy="150" rx="40" ry="110" fill="none" stroke="#334155" stroke-dasharray="3 3" opacity="0.6"/>
                      
                      <!-- Bay of Bengal Selection Extent (8-22N, 80-95E) -->
                      <polygon points="190,110 255,100 270,165 200,180" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
                      
                      <!-- Depth Extrusion Lines -->
                      <line x1="190" y1="110" x2="190" y2="190" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2 2"/>
                      <line x1="255" y1="100" x2="255" y2="180" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2 2"/>
                      <line x1="270" y1="165" x2="270" y2="245" stroke="#0284c7" stroke-width="1.5"/>
                      <line x1="200" y1="180" x2="200" y2="260" stroke="#0284c7" stroke-width="1.5"/>
                      <polygon points="190,190 255,180 270,245 200,260" fill="url(#volGrad)" stroke="#38bdf8" stroke-width="1.5"/>

                      <!-- Argo Float Observation Beacons -->
                      <circle cx="228" cy="142" r="4" fill="#38bdf8"/>
                      <circle cx="228" cy="142" r="10" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
                      <text x="242" y="145" fill="#f1f5f9" font-family="'JetBrains Mono', monospace" font-size="9">ARGO-2902142</text>
                      
                      <circle cx="212" cy="168" r="3.5" fill="#10b981"/>
                      <circle cx="212" cy="168" r="8" fill="none" stroke="#10b981" stroke-width="1" opacity="0.5"/>
                      
                      <!-- Coordinate Crosshairs -->
                      <line x1="140" y1="150" x2="300" y2="150" stroke="#64748b" stroke-width="0.75" stroke-dasharray="2 4"/>
                      <line x1="220" y1="70" x2="220" y2="230" stroke="#64748b" stroke-width="0.75" stroke-dasharray="2 4"/>
                    </svg>
                  </div>
                  <div class="hero-preview-footer">
                    <div>
                      <span class="preview-footer-label">OBSERVATIONS:</span>
                      <span class="preview-footer-val">10 Profiling Floats (D-Mode CTD)</span>
                    </div>
                    <div>
                      <span class="preview-footer-label">ASSIMILATION:</span>
                      <span class="preview-footer-val">Localized EnOI (R=300km)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 2: WHAT OCEANVIS-3D DOES -->
        <section class="landing-section" id="about">
          <div class="landing-section-header">
            <div class="section-kicker">CORE CAPABILITIES</div>
            <h3 class="section-title">What OceanVis-3D Delivers</h3>
            <p class="section-subtitle">
              Built specifically for oceanographers, researchers, and operational modellers to diagnose discrepancies between 3D ocean model predictions and real in-situ marine observations.
            </p>
          </div>

          <div class="landing-cards-grid">
            <!-- CARD 1: EXPLORE -->
            <div class="landing-card">
              <div class="card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h4 class="card-title">EXPLORE</h4>
              <p class="card-desc">
                Explore continuous 3D ocean-model variables (temperature, salinity, current vectors) across both regional basin and vertical depth dimensions from surface down to 2,000m.
              </p>
              <div class="card-tag">GLOBAL BASIN & DEPTH 3D</div>
            </div>

            <!-- CARD 2: OBSERVE -->
            <div class="landing-card">
              <div class="card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3.5 4 7 2-3.5 4-5 4-7a4 4 0 0 0-4-4z"/>
                  <circle cx="12" cy="6" r="1.5"/>
                  <path d="M5 17c1.5 1 3.5 1.5 7 1.5s5.5-.5 7-1.5"/>
                  <path d="M3 21c2 1 4.5 1.5 9 1.5s7-.5 9-1.5"/>
                </svg>
              </div>
              <h4 class="card-title">OBSERVE</h4>
              <p class="card-desc">
                Inspect autonomous Argo profiling floats and CTD sensor measurements directly at exact geographic positions and cycle timestamps with rigorous QC metadata.
              </p>
              <div class="card-tag">ARGO CTD IN-SITU DATA</div>
            </div>

            <!-- CARD 3: VERIFY -->
            <div class="landing-card">
              <div class="card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
              </div>
              <h4 class="card-title">VERIFY</h4>
              <p class="card-desc">
                Compare modeled background profiles against in-situ CTD observations with automated Root Mean Square Error (RMSE), Mean Bias, and maximum error metrics.
              </p>
              <div class="card-tag">RMSE & BIAS QUANTIFICATION</div>
            </div>

            <!-- CARD 4: IMPROVE -->
            <div class="landing-card">
              <div class="card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h4 class="card-title">IMPROVE</h4>
              <p class="card-desc">
                Apply localized Ensemble Optimal Interpolation (EnOI) to compute real-time innovation vectors, assimilation weights, and error-reduced analysis profiles.
              </p>
              <div class="card-tag">LOCALIZED EnOI DEMONSTRATION</div>
            </div>

            <!-- CARD 5: MEASURE -->
            <div class="landing-card">
              <div class="card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h4 class="card-title">MEASURE</h4>
              <p class="card-desc">
                Sample continuous scalar fields, probe dynamic bathymetry depths, examine thermocline gradients, and trace East India Coastal Current (EICC) stream dynamics.
              </p>
              <div class="card-tag">DYNAMIC PROBING & PARTICLES</div>
            </div>
          </div>
        </section>

        <!-- SECTION 3: SCIENTIFIC WORKFLOW -->
        <section class="landing-section" id="workflow">
          <div class="landing-section-header">
            <div class="section-kicker">METHODOLOGY</div>
            <h3 class="section-title">The Scientific Validation Workflow</h3>
            <p class="section-subtitle">
              From broad regional basin inspection down to rigorous in-situ CTD comparison and data assimilation.
            </p>
          </div>

          <div class="workflow-strip">
            <div class="workflow-step">
              <div class="workflow-step-num">01</div>
              <div class="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <div class="workflow-step-title">EXPLORE</div>
              <div class="workflow-step-desc">Inspect global basin model field & define geographic extent</div>
            </div>

            <div class="workflow-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div class="workflow-step">
              <div class="workflow-step-num">02</div>
              <div class="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 2 2 3.5 4 7 2-3.5 4-5 4-7a4 4 0 0 0-4-4z"/><circle cx="12" cy="6" r="1.5"/></svg>
              </div>
              <div class="workflow-step-title">OBSERVE</div>
              <div class="workflow-step-desc">Select Argo float to extract in-situ CTD observation profiles</div>
            </div>

            <div class="workflow-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div class="workflow-step">
              <div class="workflow-step-num">03</div>
              <div class="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <div class="workflow-step-title">VERIFY</div>
              <div class="workflow-step-desc">Compute background error statistics: RMSE, Mean Bias & Delta</div>
            </div>

            <div class="workflow-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div class="workflow-step">
              <div class="workflow-step-num">04</div>
              <div class="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div class="workflow-step-title">IMPROVE</div>
              <div class="workflow-step-desc">Execute localized EnOI assimilation to update model state</div>
            </div>

            <div class="workflow-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div class="workflow-step">
              <div class="workflow-step-num">05</div>
              <div class="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 12-7 7-7-7"/><path d="M12 19V5"/></svg>
              </div>
              <div class="workflow-step-title">MEASURE</div>
              <div class="workflow-step-desc">Submerge into Depth 3D with optical attenuation and bathymetry</div>
            </div>
          </div>
        </section>

        <!-- SECTION 4: SCIENTIFIC CAPABILITIES MATRIX -->
        <section class="landing-section" id="capabilities">
          <div class="landing-section-header">
            <div class="section-kicker">TECHNICAL SPECIFICATIONS</div>
            <h3 class="section-title">Scientific Capabilities Matrix</h3>
            <p class="section-subtitle">
              Deterministic, mathematical, and spatial specifications active in the current application prototype.
            </p>
          </div>

          <div class="specs-grid">
            <div class="spec-card">
              <div class="spec-header">
                <span class="spec-category">SPATIAL VISUALIZATION</span>
                <span class="spec-pill">P0-1 & P0-2 ACTIVE</span>
              </div>
              <div class="spec-title">3D Ocean Volume & Bathymetry</div>
              <p class="spec-desc">
                Smooth spatial transition from Earth planetary basemap down into high-resolution regional volume with calibrated underwater optical extinction (c = a + b).
              </p>
              <div class="spec-footer">GEBCO-inspired Indian Ocean bathymetry floor</div>
            </div>

            <div class="spec-card">
              <div class="spec-header">
                <span class="spec-category">SCALAR SAMPLING</span>
                <span class="spec-pill">CONTINUOUS</span>
              </div>
              <div class="spec-title">Temperature, Salinity & Currents</div>
              <p class="spec-desc">
                Continuous 3D field samplers replicating thermocline steepness, freshwater plume discharge, and East India Coastal Current (EICC) geostrophic velocity.
              </p>
              <div class="spec-footer">Turbo, Haline, and Speed colormaps</div>
            </div>

            <div class="spec-card">
              <div class="spec-header">
                <span class="spec-category">IN-SITU OBSERVATIONS</span>
                <span class="spec-pill">D-MODE QC</span>
              </div>
              <div class="spec-title">Argo CTD Profiling Floats</div>
              <p class="spec-desc">
                10 in-situ Argo profiling floats situated across the Bay of Bengal capturing real temperature-depth and salinity-depth CTD profiles down to 2,000 meters.
              </p>
              <div class="spec-footer">Apex & Provor sensor platforms</div>
            </div>

            <div class="spec-card">
              <div class="spec-header">
                <span class="spec-category">ASSIMILATION</span>
                <span class="spec-pill">MATHEMATICAL</span>
              </div>
              <div class="spec-title">Localized EnOI Demonstration</div>
              <p class="spec-desc">
                Ensemble Optimal Interpolation combining background model state and in-situ observations with Gaspari-Cohn spatial covariance localization (R = 300 km).
              </p>
              <div class="spec-footer">Quantitative RMSE reduction evaluation</div>
            </div>
          </div>
        </section>

        <!-- SECTION 5: PROJECT CONTEXT -->
        <section class="landing-section" id="context">
          <div class="landing-section-header">
            <div class="section-kicker">INSTITUTIONAL BENCHMARK</div>
            <h3 class="section-title">Project Context & Stakeholders</h3>
          </div>

          <div class="context-container">
            <div class="context-grid">
              <div class="context-item">
                <span class="context-label">HACKATHON PROGRAM</span>
                <span class="context-value">Smart India Hackathon (SIH) 2026</span>
              </div>
              <div class="context-item">
                <span class="context-label">PROBLEM STATEMENT</span>
                <span class="context-value">SIH26067</span>
              </div>
              <div class="context-item">
                <span class="context-label">NODAL MINISTRY</span>
                <span class="context-value">Ministry of Earth Sciences (MoES), Govt. of India</span>
              </div>
              <div class="context-item">
                <span class="context-label">HOST INSTITUTION</span>
                <span class="context-value">Indian National Centre for Ocean Information Services (INCOIS)</span>
              </div>
              <div class="context-item">
                <span class="context-label">THEMATIC DOMAIN</span>
                <span class="context-value">Oceanographic Visualization & Model Validation</span>
              </div>
              <div class="context-item">
                <span class="context-label">TARGET BASIN</span>
                <span class="context-value">Bay of Bengal (7.5°–22.5°N, 79.5°–95.5°E)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 6: FINAL CTA -->
        <section class="landing-section landing-cta-section">
          <div class="cta-banner">
            <div class="cta-content">
              <h3 class="cta-title">Explore the Ocean Model</h3>
              <p class="cta-desc">
                Enter the scientific workspace and explore the Bay of Bengal model domain.
              </p>
            </div>
            <button class="btn-landing-primary btn-cta-large" id="btn-landing-footer-dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>VIEW DASHBOARD</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </section>

        <!-- LANDING FOOTER -->
        <footer class="landing-footer">
          <div class="landing-footer-inner">
            <div class="footer-left">
              <span>OceanVis-3D • SIH26067 Research Benchmark</span>
              <span class="footer-dot">•</span>
              <span>Ministry of Earth Sciences / INCOIS</span>
            </div>
            <div class="footer-right">
              <span>WebGL2 Engine • Continuous 3D Ocean Physics</span>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  bindEvents() {
    const handleEnter = (e) => {
      e?.preventDefault();
      this.onEnterDashboard();
    };

    const handleTour = (e) => {
      e?.preventDefault();
      this.onLaunchTour();
    };

    document.getElementById("btn-landing-nav-dashboard")?.addEventListener("click", handleEnter);
    document.getElementById("btn-landing-hero-dashboard")?.addEventListener("click", handleEnter);
    document.getElementById("btn-landing-footer-dashboard")?.addEventListener("click", handleEnter);
    document.getElementById("btn-landing-hero-tour")?.addEventListener("click", handleTour);
  }

  show() {
    if (this.container) {
      this.container.style.display = "flex";
      this.container.classList.remove("fade-out");
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add("fade-out");
      setTimeout(() => {
        if (this.container) {
          this.container.style.display = "none";
        }
      }, 300);
    }
  }
}
