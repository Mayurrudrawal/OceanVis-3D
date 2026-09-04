import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  getModelScalar,
  sampleTemperature,
  sampleSalinity,
  sampleCurrent,
  VARIABLES,
  DEPTH_LEVELS
} from "../data/modelData.js";
import { getColor, sampleColormapDirect } from "../utils/colormaps.js";
import { createScientificEarthTexture } from "../utils/earthTexture.js";

export class OceanViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSelectArgo = options.onSelectArgo || (() => {});
    this.onHoverCoord = options.onHoverCoord || (() => {});
    this.onRegionSelected = options.onRegionSelected || (() => {});
    this.onEnterDepthRequested = options.onEnterDepthRequested || (() => {});

    this.variable = "temperature";
    this.depth = 0;
    this.timeIndex = 2;
    this.selectedArgoId = null;
    this.currentCameraMode = "global"; // "global" | "depth"
    this.depthViewDir = "front"; // "front" | "back" | "oblique"

    // Active geographic bounding box (drives both selection highlight and Depth View volume)
    this.activeBounds = {
      minLat: 7.5,
      maxLat: 22.5,
      minLon: 79.5,
      maxLon: 95.5
    };

    // Earth rotation to face Bay of Bengal directly at front camera view
    this.globeRotationY = Math.PI - 0.035;

    this.showModelRaster = true;
    this.showStreamlines = true;
    this.showArgoMarkers = true;
    this.showBathymetry = true;
    this.rasterOpacity = 0.85;

    // Dimensions of Depth View volume
    this.dimX = 90;
    this.dimZ = 76;
    this.dimY = 36; // 0m (surface) to -36 (2000m abyssal floor)

    // State Machine for Spatial Transition: 'IDLE_GLOBAL' | 'APPROACHING_REGION' | 'SURFACE_APPROACH' | 'VOLUME_REVEAL' | 'UNDERWATER_DESCENT' | 'DEPTH_READY' | 'RETURNING_TO_GLOBAL'
    this.transitionState = "IDLE_GLOBAL";
    this.spatialTransition = null;

    // Assimilation pulse 3D state
    this.assimilationPulse = null;

    // Camera animation tween state
    this.cameraTween = null;

    // Cache of Argo profile data
    this.argoProfiles = [];
    this.argo3DObjects = [];

    this.initThree();
    this.buildGlobeScene();
    this.buildDepthScene();
    this.initTracerParticles();
    this.initEvents();
    this.startRenderLoop();

    // Leaflet compatibility shim so external calls like this.viewer.map.flyTo() succeed smoothly
    this.map = {
      flyTo: (coords, zoom, opts) => this.flyToGeo(coords[0], coords[1], zoom, opts),
      invalidateSize: () => this.onResize()
    };
  }

  // =========================================================================
  // 1. THREE.JS INITIALIZATION
  // =========================================================================
  initThree() {
    this.container.innerHTML = "";
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    // Scene & Root Group
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050811);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 2500);
    // Initial camera position for Global Basin (looking at Indian Ocean / Bay of Bengal)
    this.camera.position.set(0, 35, 175);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 600;
    this.controls.target.set(0, 0, 0);

    // Lighting (Scientific dark studio lighting)
    this.ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    this.scene.add(this.ambientLight);

    this.dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight1.position.set(150, 200, 150);
    this.scene.add(this.dirLight1);

    this.dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    this.dirLight2.position.set(-150, -50, -150);
    this.scene.add(this.dirLight2);

    // Underwater Optical Attenuation Fog (P0-2)
    // Deep marine blue-black fog calibrated to oceanic optical extinction
    this.underwaterFog = new THREE.FogExp2(0x040c1a, 0.0062);
    this.scene.fog = null; // Clean crisp vacuum for Global Basin mode

    // Raycaster for mouse picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);
  }

  // =========================================================================
  // 2. MODE 1: GLOBAL BASIN (3D EARTH GLOBE WITH BAY OF BENGAL ACCURACY)
  // =========================================================================
  buildGlobeScene() {
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    this.globeRadius = 65;

    // 1. Earth Sphere with High-Resolution Scientific Texture
    const earthGeo = new THREE.SphereGeometry(this.globeRadius, 64, 64);
    const earthTexture = createScientificEarthTexture();
    this.earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.82,
      metalness: 0.18,
      transparent: true,
      opacity: 1.0
    });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMat);
    // Align Bay of Bengal directly at front view
    this.earthMesh.rotation.y = this.globeRotationY;
    this.globeGroup.add(this.earthMesh);

    // 2. Atmospheric Outer Halo Glow
    const atmosGeo = new THREE.SphereGeometry(this.globeRadius * 1.025, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.globeGroup.add(this.atmosMesh);

    // 3. Indian Ocean / Bay of Bengal Domain Highlight Line in 3D
    this.globeDomainOutline = this.createGlobeBoxOutline(this.activeBounds, 0x38bdf8, 1.004);
    this.globeGroup.add(this.globeDomainOutline);

    // 4. Dynamic Selection Box Group on Globe
    this.globeSelectionGroup = new THREE.Group();
    this.globeGroup.add(this.globeSelectionGroup);
    this.updateGlobeSelectionBox(this.activeBounds);

    // Group for 3D Argo markers on globe
    this.globeArgoGroup = new THREE.Group();
    this.globeGroup.add(this.globeArgoGroup);

    // Start with globe visible
    this.globeGroup.visible = true;
  }

  createGlobeBoxOutline(bounds, color = 0x38bdf8, radiusMultiplier = 1.002) {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    const points = [];
    const steps = 32;
    const r = this.globeRadius * radiusMultiplier;

    // Top edge (North)
    for (let i = 0; i <= steps; i++) {
      const lon = minLon + (i / steps) * (maxLon - minLon);
      points.push(this.latLonToGlobePoint(maxLat, lon, r));
    }
    // Right edge (East)
    for (let i = 0; i <= steps; i++) {
      const lat = maxLat - (i / steps) * (maxLat - minLat);
      points.push(this.latLonToGlobePoint(lat, maxLon, r));
    }
    // Bottom edge (South)
    for (let i = 0; i <= steps; i++) {
      const lon = maxLon - (i / steps) * (maxLon - minLon);
      points.push(this.latLonToGlobePoint(minLat, lon, r));
    }
    // Left edge (West)
    for (let i = 0; i <= steps; i++) {
      const lat = minLat + (i / steps) * (maxLat - minLat);
      points.push(this.latLonToGlobePoint(lat, minLon, r));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      linewidth: 1.8,
      transparent: true,
      opacity: 0.68
    });
    return new THREE.Line(geo, mat);
  }

  updateGlobeSelectionBox(bounds) {
    while (this.globeSelectionGroup.children.length) {
      this.globeSelectionGroup.remove(this.globeSelectionGroup.children[0]);
    }

    // Outer boundary line closely hugging sphere
    const line = this.createGlobeBoxOutline(bounds, 0x00f0ff, 1.003);
    this.globeSelectionGroup.add(line);

    // 4 Corner precision registration ticks
    const corners = [
      [bounds.minLat, bounds.minLon],
      [bounds.minLat, bounds.maxLon],
      [bounds.maxLat, bounds.minLon],
      [bounds.maxLat, bounds.maxLon]
    ];

    corners.forEach(([lat, lon]) => {
      const pt = this.latLonToGlobePoint(lat, lon, this.globeRadius * 1.004);
      const dotGeo = new THREE.SphereGeometry(0.45, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pt);
      this.globeSelectionGroup.add(dot);
    });
  }

  latLonToGlobePoint(lat, lon, radius = this.globeRadius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    // Rotate sphere around Y axis so Bay of Bengal faces camera
    const rotY = this.globeRotationY;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    return new THREE.Vector3(x * cosR + z * sinR, y, -x * sinR + z * cosR);
  }

  globePointToLatLon(point) {
    const rotY = -this.globeRotationY;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const px = point.x * cosR + point.z * sinR;
    const py = point.y;
    const pz = -point.x * sinR + point.z * cosR;

    const rNorm = Math.sqrt(px * px + py * py + pz * pz) || 1;
    const phi = Math.acos(Math.max(-1, Math.min(1, py / rNorm)));
    const lat = 90 - (phi * 180) / Math.PI;

    const theta = Math.atan2(pz, -px);
    let lon = (theta * 180) / Math.PI - 180;
    while (lon < -180) lon += 360;
    while (lon > 180) lon -= 360;

    return { lat, lon };
  }

  // =========================================================================
  // 3. MODE 2: DEPTH COLUMN (GENUINE 3D OCEAN VOLUME & SUBSURFACE)
  // =========================================================================
  buildDepthScene() {
    this.depthGroup = new THREE.Group();
    this.scene.add(this.depthGroup);

    // 1. Procedural Ocean Surface with Wave Movement
    this.buildOceanSurface();

    // 2. 3D Bathymetry Seabed Floor (Continental shelves & Abyssal plain)
    this.buildBathymetryFloor();

    // 3. Bounding Volume Glass Cage & Structural Corner Pillars
    this.buildBoundingCage();

    // 4. Scientific 3D Depth Axis (0m, 100m, 500m, 1000m, 2000m)
    this.buildDepthAxis();

    // 5. Multi-layer Depth Slice Indicator
    this.buildDepthSliceIndicator();

    // 6. Group for 3D Argo float objects in depth volume
    this.depthArgoGroup = new THREE.Group();
    this.depthGroup.add(this.depthArgoGroup);

    // Initially depthGroup is hidden until Mode 2 is chosen
    this.depthGroup.visible = false;
  }

  buildOceanSurface() {
    const segs = 48;
    const surfGeo = new THREE.PlaneGeometry(this.dimX, this.dimZ, segs, segs);
    surfGeo.rotateX(-Math.PI / 2);

    // Store base vertex positions for wave displacement
    this.surfBasePositions = new Float32Array(surfGeo.attributes.position.array);

    // Physically believable translucent ocean surface
    const surfMat = new THREE.MeshPhysicalMaterial({
      color: 0x075985,
      transparent: true,
      opacity: 0.28,
      roughness: 0.14,
      transmission: 0.65,
      reflectivity: 0.45,
      wireframe: false
    });
    this.depthSurface = new THREE.Mesh(surfGeo, surfMat);
    this.depthSurface.position.set(0, 0, 0);
    this.depthGroup.add(this.depthSurface);

    // Subtle Surface Grid Wireframe
    const surfWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(surfGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12 })
    );
    this.depthSurface.add(surfWire);
  }

  updateOceanSurfaceWaves(time) {
    if (!this.depthSurface || !this.surfBasePositions) return;
    const pos = this.depthSurface.geometry.attributes.position;
    const count = pos.count;
    const t = time * 0.0011;

    for (let i = 0; i < count; i++) {
      const bx = this.surfBasePositions[i * 3];
      const bz = this.surfBasePositions[i * 3 + 2];
      // Multi-harmonic gentle Gerstner-like sinusoids
      const w1 = Math.sin(bx * 0.08 + t * 1.5) * Math.cos(bz * 0.07 + t * 1.2) * 0.38;
      const w2 = Math.sin(bx * 0.16 - bz * 0.13 + t * 2.1) * 0.18;
      const w3 = Math.cos(bx * 0.04 + bz * 0.05 - t * 0.7) * 0.22;
      pos.setY(i, w1 + w2 + w3);
    }
    pos.needsUpdate = true;
  }

  // Maps (lat, lon, depth) to 3D Cartesian coordinates (X, Y, Z) in Depth Mode
  geoToDepth3D(lat, lon, depthMeters = 0) {
    const b = this.activeBounds;
    const normX = (lon - b.minLon) / (b.maxLon - b.minLon || 1);
    const x = (normX - 0.5) * this.dimX;

    const normZ = (lat - b.minLat) / (b.maxLat - b.minLat || 1);
    const z = (0.5 - normZ) * this.dimZ;

    const normY = Math.min(2000, Math.max(0, depthMeters)) / 2000.0;
    const y = -normY * this.dimY;

    return new THREE.Vector3(x, y, z);
  }

  // Reverse mapping from (x, z) on ocean surface to (lat, lon)
  depth3DToGeo(x, z) {
    const b = this.activeBounds;
    const normX = x / this.dimX + 0.5;
    const lon = b.minLon + normX * (b.maxLon - b.minLon);

    const normZ = 0.5 - z / this.dimZ;
    const lat = b.minLat + normZ * (b.maxLat - b.minLat);

    return {
      lat: Math.max(b.minLat, Math.min(b.maxLat, lat)),
      lon: Math.max(b.minLon, Math.min(b.maxLon, lon))
    };
  }

  buildBathymetryFloor() {
    if (this.bathymetryMesh) {
      this.depthGroup.remove(this.bathymetryMesh);
    }

    const segsX = 32;
    const segsZ = 32;
    const floorGeo = new THREE.PlaneGeometry(this.dimX, this.dimZ, segsX, segsZ);
    floorGeo.rotateX(-Math.PI / 2);

    const pos = floorGeo.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const geo = this.depth3DToGeo(px, pz);

      // Bathymetry equation for Bay of Bengal (abyssal basin down to ~3800m, shallow coastal shelves)
      const distFromCenter = Math.hypot(geo.lat - 14.5, geo.lon - 88.5);
      const bathyMeters = Math.min(3850, Math.round(1800 + (1 - Math.min(1, distFromCenter / 7.2)) * 1950));
      const depthY = -Math.min(1.0, bathyMeters / 2000.0) * this.dimY;
      pos.setY(i, depthY);

      // Color from depth
      const norm = Math.min(1, bathyMeters / 3800);
      const c = new THREE.Color().setHSL(0.58, 0.8, 0.08 + norm * 0.16);
      colors.push(c.r, c.g, c.b);
    }

    floorGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.2,
      wireframe: false
    });
    this.bathymetryMesh = new THREE.Mesh(floorGeo, floorMat);
    this.depthGroup.add(this.bathymetryMesh);

    // Bathymetry wireframe contour lines
    const bathyWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(floorGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12 })
    );
    this.bathymetryMesh.add(bathyWire);
  }

  buildBoundingCage() {
    if (this.boundingCageGroup) {
      this.depthGroup.remove(this.boundingCageGroup);
    }

    this.boundingCageGroup = new THREE.Group();
    const h = this.dimY;
    const boxGeo = new THREE.BoxGeometry(this.dimX, h, this.dimZ);
    const boxWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, linewidth: 1.5 })
    );
    boxWire.position.set(0, -h / 2, 0);
    this.boundingCageGroup.add(boxWire);

    // Directional axis tags on the surface frame showing active bounds
    const b = this.activeBounds;
    this.createSurfaceLabel(`NORTH (${b.maxLat.toFixed(1)}°N)`, 0, -this.dimZ / 2 - 4);
    this.createSurfaceLabel(`SOUTH (${b.minLat.toFixed(1)}°N)`, 0, this.dimZ / 2 + 4);
    this.createSurfaceLabel(`WEST (${b.minLon.toFixed(1)}°E)`, -this.dimX / 2 - 4, 0);
    this.createSurfaceLabel(`EAST (${b.maxLon.toFixed(1)}°E)`, this.dimX / 2 + 4, 0);

    this.depthGroup.add(this.boundingCageGroup);
  }

  createSurfaceLabel(text, x, z) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(14, 165, 233, 0.85)";
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(16, 4, 1);
    sprite.position.set(x, 1.2, z);
    this.boundingCageGroup.add(sprite);
  }

  buildDepthAxis() {
    if (this.rulerGroup) {
      this.depthGroup.remove(this.rulerGroup);
    }

    this.rulerGroup = new THREE.Group();
    const rulerX = -this.dimX / 2 - 3;
    const rulerZ = -this.dimZ / 2;

    // Vertical rule rod
    const rodGeo = new THREE.CylinderGeometry(0.3, 0.3, this.dimY, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(rulerX, -this.dimY / 2, rulerZ);
    this.rulerGroup.add(rod);

    // Depth Tick marks & Billboard labels: 0m, 100m, 500m, 1000m, 2000m
    const ticks = [
      { depth: 0, label: "0 m (Surface / SST)" },
      { depth: 100, label: "-100 m (Thermocline)" },
      { depth: 500, label: "-500 m (Intermediate)" },
      { depth: 1000, label: "-1000 m (Deep Water)" },
      { depth: 2000, label: "-2000 m (Abyssal Layer)" }
    ];

    ticks.forEach(t => {
      const y = -(t.depth / 2000.0) * this.dimY;

      // Tick bar
      const tickGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
      const tickMesh = new THREE.Mesh(tickGeo, rodMat);
      tickMesh.position.set(rulerX - 2, y, rulerZ);
      this.rulerGroup.add(tickMesh);

      // High-contrast Billboard Depth Label
      const canvas = document.createElement("canvas");
      canvas.width = 340;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgba(7, 11, 20, 0.85)";
      ctx.fillRect(0, 0, 340, 64);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 336, 60);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(t.label, 14, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(16, 3.2, 1);
      sprite.position.set(rulerX - 11, y, rulerZ);
      this.rulerGroup.add(sprite);
    });

    this.depthGroup.add(this.rulerGroup);
  }

  buildDepthSliceIndicator() {
    if (this.slicePlane) {
      this.depthGroup.remove(this.slicePlane);
    }

    const sliceGeo = new THREE.PlaneGeometry(this.dimX, this.dimZ);
    sliceGeo.rotateX(-Math.PI / 2);

    const sliceMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });

    this.slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
    this.slicePlane.position.set(0, 0, 0);

    const sliceBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(sliceGeo),
      new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
    );
    this.slicePlane.add(sliceBorder);

    this.depthGroup.add(this.slicePlane);
  }

  updateDepthSlicePosition() {
    if (!this.slicePlane) return;
    const y = -(this.depth / 2000.0) * this.dimY;
    this.slicePlane.position.y = y;
  }

  // =========================================================================
  // 4. SCIENTIFIC SUBTLE WATER TRACER PARTICLES (REQUIREMENTS 1-8, 14)
  // =========================================================================
  initTracerParticles() {
    // 5,500 subtle translucent water tracers carrying faint temperature/salinity tints
    this.numTracers = 5500;
    this.tracerGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numTracers * 3);
    const colors = new Float32Array(this.numTracers * 3);
    this.tracerTargetColors = new Float32Array(this.numTracers * 3);
    this.tracerData = [];

    const b = this.activeBounds;
    for (let i = 0; i < this.numTracers; i++) {
      // Natural 3D distribution: concentrated in dynamic upper 600m while covering entire 2000m column
      const depthBias = Math.pow(Math.random(), 1.35);
      const depth = depthBias * 2000;
      const lat = b.minLat + Math.random() * (b.maxLat - b.minLat);
      const lon = b.minLon + Math.random() * (b.maxLon - b.minLon);

      const p = {
        lat,
        lon,
        depth,
        age: Math.floor(Math.random() * 260),
        maxAge: 220 + Math.floor(Math.random() * 240)
      };
      this.tracerData.push(p);

      const pt3d = this.geoToDepth3D(p.lat, p.lon, p.depth);
      positions[i * 3] = pt3d.x;
      positions[i * 3 + 1] = pt3d.y;
      positions[i * 3 + 2] = pt3d.z;

      // Sample initial scalar field
      let norm;
      if (this.variable === "temperature") {
        const val = sampleTemperature(p.lat, p.lon, p.depth, this.timeIndex);
        norm = (val - 4.0) / (30.5 - 4.0);
        sampleColormapDirect(norm, "turbo", colors, i * 3);
      } else if (this.variable === "salinity") {
        const val = sampleSalinity(p.lat, p.lon, p.depth, this.timeIndex);
        norm = (val - 30.0) / (36.5 - 30.0);
        sampleColormapDirect(norm, "haline", colors, i * 3);
      } else {
        const cur = sampleCurrent(p.lat, p.lon, p.depth, this.timeIndex);
        norm = cur.speed / 1.25;
        sampleColormapDirect(norm, "speed", colors, i * 3);
      }

      this.tracerTargetColors[i * 3] = colors[i * 3];
      this.tracerTargetColors[i * 3 + 1] = colors[i * 3 + 1];
      this.tracerTargetColors[i * 3 + 2] = colors[i * 3 + 2];
    }

    this.tracerGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.tracerGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Particle Appearance: extremely small, translucent, no bloom/additive glow
    this.tracerMat = new THREE.PointsMaterial({
      size: 2.2,
      sizeAttenuation: true,
      map: this.createTracerTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.25, // Extremely subtle water tracer tint!
      blending: THREE.NormalBlending, // Normal blending prevents glowing balls
      depthWrite: false
    });

    this.tracerMesh = new THREE.Points(this.tracerGeo, this.tracerMat);
    this.depthGroup.add(this.tracerMesh);
  }

  createTracerTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Soft Gaussian-like circular alpha disc without a bright solid core
    const rad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
    rad.addColorStop(0, "rgba(255, 255, 255, 0.65)");
    rad.addColorStop(0.35, "rgba(255, 255, 255, 0.38)");
    rad.addColorStop(0.75, "rgba(255, 255, 255, 0.10)");
    rad.addColorStop(1.0, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  updateTracerParticles() {
    if (!this.tracerGeo || !this.tracerData) return;
    const pos = this.tracerGeo.attributes.position.array;
    const col = this.tracerGeo.attributes.color.array;
    const targetCol = this.tracerTargetColors;
    const b = this.activeBounds;
    const palette = this.variable === "salinity" ? "haline" : (this.variable === "velocity" ? "speed" : "turbo");

    // Color transition interpolation speed (Requirement 5 & 8: smooth lerp across gradients)
    const colorLerp = 0.08;
    const timeIndex = this.timeIndex;

    for (let i = 0; i < this.numTracers; i++) {
      const p = this.tracerData[i];
      p.age++;

      // 1. Current field controls motion: (u, v, w) = sampleCurrent(position)
      const cur = sampleCurrent(p.lat, p.lon, p.depth, timeIndex);
      p.lon += cur.u * 0.045;
      p.lat += cur.v * 0.045;
      p.depth -= cur.w * 20.0;

      // 2. Natural Upstream Boundary Recycling (avoids global resets)
      if (
        p.age >= p.maxAge ||
        p.lat < b.minLat || p.lat > b.maxLat ||
        p.lon < b.minLon || p.lon > b.maxLon ||
        p.depth < 0 || p.depth > 2000
      ) {
        p.age = 0;
        p.maxAge = 220 + Math.floor(Math.random() * 240);

        // Recycle predominantly upstream (southern basin inflow & coastal boundary source)
        const roll = Math.random();
        if (roll < 0.60) {
          // Southern upstream boundary
          p.lat = b.minLat + Math.random() * 1.5;
          p.lon = b.minLon + Math.random() * (b.maxLon - b.minLon);
          p.depth = Math.pow(Math.random(), 1.3) * 1800;
        } else if (roll < 0.85) {
          // Western margin coastal current inflow
          p.lat = b.minLat + Math.random() * (b.maxLat - b.minLat) * 0.7;
          p.lon = b.minLon + Math.random() * 2.0;
          p.depth = Math.pow(Math.random(), 1.2) * 1400;
        } else {
          // Interior convective zone
          p.lat = b.minLat + 1.5 + Math.random() * (b.maxLat - b.minLat - 3.0);
          p.lon = b.minLon + 1.5 + Math.random() * (b.maxLon - b.minLon - 3.0);
          p.depth = 40 + Math.random() * 600;
        }
      }

      // 3. Update 3D Cartesian Position in volume
      const pt3d = this.geoToDepth3D(p.lat, p.lon, p.depth);
      const idx3 = i * 3;
      pos[idx3] = pt3d.x;
      pos[idx3 + 1] = pt3d.y;
      pos[idx3 + 2] = pt3d.z;

      // 4. Sample local scalar field at particle's current physical position
      let norm;
      if (this.variable === "temperature") {
        const tVal = sampleTemperature(p.lat, p.lon, p.depth, timeIndex);
        norm = (tVal - 4.0) / (30.5 - 4.0);
      } else if (this.variable === "salinity") {
        const sVal = sampleSalinity(p.lat, p.lon, p.depth, timeIndex);
        norm = (sVal - 30.0) / (36.5 - 30.0);
      } else {
        norm = cur.speed / 1.25;
      }

      // 5. Dynamic color update: sample colormap & smoothly lerp tint
      sampleColormapDirect(norm, palette, targetCol, idx3);
      col[idx3] += (targetCol[idx3] - col[idx3]) * colorLerp;
      col[idx3 + 1] += (targetCol[idx3 + 1] - col[idx3 + 1]) * colorLerp;
      col[idx3 + 2] += (targetCol[idx3 + 2] - col[idx3 + 2]) * colorLerp;
    }

    this.tracerGeo.attributes.position.needsUpdate = true;
    this.tracerGeo.attributes.color.needsUpdate = true;
  }

  // =========================================================================
  // 6. REGION SELECTION & DYNAMIC EXTENT (REQUIREMENTS 10, 11, 12)
  // =========================================================================
  setRegionBounds(bounds) {
    this.activeBounds = {
      minLat: Math.max(5.0, Math.min(25.0, bounds.minLat)),
      maxLat: Math.max(5.0, Math.min(25.0, bounds.maxLat)),
      minLon: Math.max(75.0, Math.min(100.0, bounds.minLon)),
      maxLon: Math.max(75.0, Math.min(100.0, bounds.maxLon))
    };

    // Update 3D selection box on Earth globe
    this.updateGlobeSelectionBox(this.activeBounds);

    // Rebuild Depth scene structures to align with new geographic bounds
    this.buildBathymetryFloor();
    this.buildBoundingCage();

    // Re-position Argo floats in new coordinate system
    this.argo3DObjects.forEach(item => {
      const newPos = this.geoToDepth3D(item.profile.latitude, item.profile.longitude, 0);
      item.depthObj.position.copy(newPos);
    });

    // Notify listeners
    this.onRegionSelected(this.activeBounds);
  }

  enterDepthViewWithBounds(bounds) {
    if (bounds) {
      this.setRegionBounds(bounds);
    }

    // Set camera mode to Depth
    this.setCameraMode("depth");
    this.onEnterDepthRequested(this.activeBounds);
  }

  // =========================================================================
  // 6. 3D ARGO FLOAT OBJECTS (GENUINE 3D BUOYS + PROFILING TETHERS)
  // =========================================================================
  renderArgoMarkers(profiles) {
    this.argoProfiles = profiles;

    // Clear previous objects
    while (this.globeArgoGroup.children.length) {
      this.globeArgoGroup.remove(this.globeArgoGroup.children[0]);
    }
    while (this.depthArgoGroup.children.length) {
      this.depthArgoGroup.remove(this.depthArgoGroup.children[0]);
    }
    this.argo3DObjects = [];

    profiles.forEach(profile => {
      // 1. Globe Marker (Mode 1)
      const globePos = this.latLonToGlobePoint(profile.latitude, profile.longitude, this.globeRadius * 1.01);
      const globeMarker = this.createGlobeArgoMarker(profile, globePos);
      this.globeArgoGroup.add(globeMarker);

      // 2. Subsurface 3D Profiler Object (Mode 2)
      const depthObj = this.createDepth3DArgoProfiler(profile);
      this.depthArgoGroup.add(depthObj);

      this.argo3DObjects.push({
        id: profile.id,
        profile,
        globeMarker,
        depthObj
      });
    });

    if (this.selectedArgoId) {
      this.selectArgo(this.selectedArgoId);
    }
  }

  createGlobeArgoMarker(profile, pos) {
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(pos);
    markerGroup.lookAt(0, 0, 0); // Orient towards Earth center

    // 1. Slender oceanic surface anchor pin
    const pinGeo = new THREE.CylinderGeometry(0.12, 0.08, 2.2, 8);
    pinGeo.rotateX(Math.PI / 2);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.z = 1.1;
    markerGroup.add(pin);

    // 2. Scientific Float Core (Yellow/Amber oceanic livery, matching real Argo buoys)
    const sphereGeo = new THREE.SphereGeometry(0.75, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.35
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.z = 2.2;
    sphere.userData = { argoProfile: profile };
    markerGroup.add(sphere);

    // 3. Subtle Status Ring (Subordinate telemetry indicator)
    const ringGeo = new THREE.RingGeometry(0.9, 1.35, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 2.2;
    ring.name = "radarRing";
    markerGroup.add(ring);

    // 4. Subtle ID Tag Billboard
    const tag = this.createArgoBillboardTag(profile.id.replace("ARGO-", ""));
    tag.scale.set(4.8, 1.2, 1);
    tag.position.z = 3.6;
    markerGroup.add(tag);

    return markerGroup;
  }

  createDepth3DArgoProfiler(profile) {
    const group = new THREE.Group();
    const surfacePt = this.geoToDepth3D(profile.latitude, profile.longitude, 0);
    const bottomPt = this.geoToDepth3D(profile.latitude, profile.longitude, 2000);

    group.position.copy(surfacePt);

    // 1. Surface Buoy Hull (Flotation Collar + Antenna)
    const hullGeo = new THREE.CylinderGeometry(1.4, 1.2, 2.2, 16);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Scientific safety yellow/amber
      metalness: 0.3,
      roughness: 0.4
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.5;
    hull.userData = { argoProfile: profile };
    group.add(hull);

    // GPS Mast & Blinking Beacon LED
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.4;
    group.add(mast);

    const ledGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.y = 4.1;
    group.add(led);

    // 2. Physical Vertical Profiling Tether / Cable (0m to 2000m)
    const tetherLen = Math.abs(bottomPt.y);
    const tetherGeo = new THREE.CylinderGeometry(0.18, 0.18, tetherLen, 8);
    tetherGeo.translate(0, -tetherLen / 2, 0);
    const tetherMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      metalness: 0.6
    });
    const tether = new THREE.Mesh(tetherGeo, tetherMat);
    tether.userData = { argoProfile: profile };
    group.add(tether);

    // 3. Sensor CTD Nodes along the cable (at profile depths: 0, 10, 50, 100, 200, 500, 1000, 2000)
    profile.temperature.forEach(obs => {
      const y = -(obs.depth / 2000.0) * this.dimY;
      const nodeGeo = new THREE.TorusGeometry(0.75, 0.2, 8, 16);
      nodeGeo.rotateX(Math.PI / 2);

      // Color node by temperature
      const norm = (obs.value - 4.0) / (30.5 - 4.0);
      const [r, g, b] = getColor(norm, "turbo");
      const nodeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r / 255, g / 255, b / 255),
        emissive: new THREE.Color(r / 500, g / 500, b / 500)
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.y = y;
      group.add(nodeMesh);
    });

    // 4. Subsurface CTD Sensor Pod payload at 500m
    const podGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.y = -(500 / 2000.0) * this.dimY;
    group.add(pod);

    // 5. Selected State Pulsing Beacon Ring on Surface
    const selectRingGeo = new THREE.RingGeometry(2.0, 3.0, 24);
    selectRingGeo.rotateX(-Math.PI / 2);
    const selectRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const selectRing = new THREE.Mesh(selectRingGeo, selectRingMat);
    selectRing.name = "depthSelectRing";
    selectRing.position.y = 0.15;
    group.add(selectRing);

    // 6. ID Billboard
    const tag = this.createArgoBillboardTag(profile.id);
    tag.position.set(0, 5.8, 0);
    group.add(tag);

    return group;
  }

  createArgoBillboardTag(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(7, 11, 20, 0.88)";
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(2, 2, 252, 60);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(7.5, 1.9, 1);
    return sprite;
  }

  selectArgo(argoId) {
    this.selectedArgoId = argoId;

    this.argo3DObjects.forEach(item => {
      const isSelected = item.id === argoId;

      // Update Globe ring
      const gRing = item.globeMarker.getObjectByName("radarRing");
      if (gRing) {
        gRing.material.color.setHex(isSelected ? 0x38bdf8 : 0x34d399);
        gRing.scale.setScalar(isSelected ? 1.6 : 1.0);
      }

      // Update Depth 3D ring
      const dRing = item.depthObj.getObjectByName("depthSelectRing");
      if (dRing) {
        dRing.material.opacity = isSelected ? 0.95 : 0.0;
      }
    });
  }

  focusOnArgo(argoId) {
    const found = this.argo3DObjects.find(i => i.id === argoId);
    if (!found) return;

    if (this.currentCameraMode === "depth") {
      const pos = this.geoToDepth3D(found.profile.latitude, found.profile.longitude, 200);
      this.animateCameraTo(
        new THREE.Vector3(pos.x + 25, pos.y + 15, pos.z + 35),
        new THREE.Vector3(pos.x, pos.y - 8, pos.z),
        1000
      );
    } else {
      const gPos = this.latLonToGlobePoint(found.profile.latitude, found.profile.longitude, this.globeRadius);
      const camTargetPos = gPos.clone().normalize().multiplyScalar(140);
      this.animateCameraTo(camTargetPos, new THREE.Vector3(0, 0, 0), 1000);
    }
  }

  // =========================================================================
  // 7. CAMERA SYSTEM & DUAL MODES (GLOBAL vs DEPTH WITH SPATIAL TRANSITION)
  // =========================================================================
  setCameraMode(mode, options = {}) {
    if (mode === this.currentCameraMode && !options.force) return mode === "depth";

    // If already in a transition, clean up previous tween
    if (this.spatialTransition) {
      this.spatialTransition = null;
    }

    if (mode === "depth") {
      this.initiateGlobalToDepthTransition(options);
    } else {
      this.initiateDepthToGlobalTransition(options);
    }

    return mode === "depth";
  }

  // P0-1: State Machine Transition (Global Basin -> Selected Region -> Depth 3D Volume)
  initiateGlobalToDepthTransition(options = {}) {
    this.currentCameraMode = "depth";
    this.transitionState = "APPROACHING_REGION";

    // Calculate central geographic coordinate of currently selected domain
    const b = this.activeBounds;
    const centerLat = (b.minLat + b.maxLat) / 2;
    const centerLon = (b.minLon + b.maxLon) / 2;

    // Both visual groups participate in the spatial transition
    this.globeGroup.visible = true;
    this.depthGroup.visible = true;

    // Ensure Globe starts at full opacity
    if (this.earthMat) {
      this.earthMat.transparent = true;
      this.earthMat.opacity = 1.0;
    }
    if (this.atmosMesh) this.atmosMesh.visible = true;

    // Depth volume begins compressed flat at sea level (Y = 0) with zero initial opacity
    this.depthGroup.position.set(0, 0, 0);
    this.depthGroup.scale.set(1.0, 0.001, 1.0);

    // Initial opacity states for depth volume components
    if (this.depthSurface) {
      this.depthSurface.material.transparent = true;
      this.depthSurface.material.opacity = 0.05;
    }
    if (this.bathymetryMesh) {
      this.bathymetryMesh.material.transparent = true;
      this.bathymetryMesh.material.opacity = 0.0;
    }
    if (this.tracerMat) {
      this.tracerMat.opacity = 0.0;
    }
    if (this.rulerGroup) this.rulerGroup.visible = false;
    if (this.slicePlane) this.slicePlane.visible = false;

    // Transition Waypoint 1: High-altitude orbit facing selected region
    const gTarget = this.latLonToGlobePoint(centerLat, centerLon, this.globeRadius);
    const approachCamPos = gTarget.clone().normalize().multiplyScalar(this.globeRadius * 1.75);
    approachCamPos.y += 12;

    // Transition Waypoint 2: Low-altitude surface approach over selected basin
    const surfaceCamPos = gTarget.clone().normalize().multiplyScalar(this.globeRadius * 1.15);
    surfaceCamPos.y += 5;

    // Transition Waypoint 3: Depth 3D final perspective vantage
    const finalCamPos = this.getDepthViewCamPos(this.depthViewDir || "front");
    const finalTarget = new THREE.Vector3(0, -15, 0);

    const now = performance.now();
    this.spatialTransition = {
      state: "APPROACHING_REGION",
      startTime: now,
      gTarget,
      approachCamPos,
      surfaceCamPos,
      finalCamPos,
      finalTarget,
      startCamPos: this.camera.position.clone(),
      startLookAt: this.controls.target.clone()
    };
  }

  // P0-1 Reverse Transition: Smoothly ascend from Depth volume back to Earth Globe
  initiateDepthToGlobalTransition(options = {}) {
    this.currentCameraMode = "global";
    this.transitionState = "RETURNING_TO_GLOBAL";

    // Deactivate underwater fog immediately as we ascend back to space
    this.setUnderwaterOpticalAttenuation(false);

    // Fade in Earth sphere and restore full geometry
    this.globeGroup.visible = true;
    if (this.atmosMesh) this.atmosMesh.visible = true;

    const globalCamPos = new THREE.Vector3(0, 35, 175);
    const globalTarget = new THREE.Vector3(0, 0, 0);

    const now = performance.now();
    this.spatialTransition = {
      state: "RETURNING_TO_GLOBAL",
      startTime: now,
      duration: 1100,
      startCamPos: this.camera.position.clone(),
      startLookAt: this.controls.target.clone(),
      endCamPos: globalCamPos,
      endLookAt: globalTarget
    };
  }

  getDepthViewCamPos(dir = "front") {
    if (dir === "back") {
      return new THREE.Vector3(0, 26, -115);
    } else if (dir === "oblique") {
      return new THREE.Vector3(80, 42, 80);
    } else if (dir === "top") {
      return new THREE.Vector3(0, 125, 0.1);
    } else {
      return new THREE.Vector3(0, 26, 115);
    }
  }

  // P0-2: Professional Underwater Optical Attenuation Control
  setUnderwaterOpticalAttenuation(enabled = true) {
    if (enabled) {
      // Enable underwater exponential fog (Beer-Lambert attenuation)
      this.scene.fog = this.underwaterFog;
      this.scene.background.setHex(0x030814); // Deep marine blue-black void

      // Surface sunlight downwelling attenuation
      if (this.ambientLight) this.ambientLight.intensity = 0.95;
      if (this.dirLight1) {
        this.dirLight1.intensity = 1.35;
        this.dirLight1.color.setHex(0xe0f2fe);
      }
      if (this.dirLight2) {
        this.dirLight2.intensity = 0.65;
        this.dirLight2.color.setHex(0x0284c7);
      }
    } else {
      // Clean, unattenuated vacuum of space for Earth Globe
      this.scene.fog = null;
      this.scene.background.setHex(0x050811);

      if (this.ambientLight) this.ambientLight.intensity = 1.2;
      if (this.dirLight1) {
        this.dirLight1.intensity = 1.4;
        this.dirLight1.color.setHex(0xffffff);
      }
      if (this.dirLight2) {
        this.dirLight2.intensity = 0.8;
        this.dirLight2.color.setHex(0x38bdf8);
      }
    }
  }

  toggle3D() {
    return this.setCameraMode(this.currentCameraMode === "depth" ? "global" : "depth");
  }

  resetView() {
    if (this.currentCameraMode === "depth") {
      this.setDepthViewDirection("front");
    } else {
      this.animateCameraTo(
        new THREE.Vector3(0, 35, 175),
        new THREE.Vector3(0, 0, 0),
        900
      );
    }
  }

  // Camera Direction Switch for Depth Mode (Requirement 6: FRONT ↔ BACK ↔ OBLIQUE)
  setDepthViewDirection(dir = "front") {
    this.depthViewDir = dir;
    const target = new THREE.Vector3(0, -15, 0);
    const camPos = this.getDepthViewCamPos(dir);
    this.animateCameraTo(camPos, target, 850);
  }

  flyToGeo(lat, lon, zoom = 6, opts = {}) {
    if (this.currentCameraMode === "depth") {
      const pos = this.geoToDepth3D(lat, lon, this.depth || 0);
      const camPos = new THREE.Vector3(pos.x + 28, pos.y + 18, pos.z + 38);
      this.animateCameraTo(camPos, new THREE.Vector3(pos.x, pos.y, pos.z), (opts.duration || 1) * 1000);
    } else {
      const gPos = this.latLonToGlobePoint(lat, lon, this.globeRadius);
      const camPos = gPos.clone().normalize().multiplyScalar(135);
      this.animateCameraTo(camPos, new THREE.Vector3(0, 0, 0), (opts.duration || 1) * 1000);
    }
  }

  animateCameraTo(targetPos, targetLookAt, durationMs = 800) {
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: targetPos.clone(),
      startLookAt: this.controls.target.clone(),
      endLookAt: targetLookAt.clone(),
      startTime: performance.now(),
      duration: durationMs
    };
  }

  // =========================================================================
  // 8. DATA ASSIMILATION 3D WAVEFRONT
  // =========================================================================
  triggerAssimilationPulse(lat, lon) {
    // 3D expanding spherical wavefront around observation in Depth mode
    const center = this.geoToDepth3D(lat, lon, this.depth);

    // Remove existing pulse if any
    if (this.assimilationPulseMesh) {
      this.depthGroup.remove(this.assimilationPulseMesh);
    }

    const shockGeo = new THREE.SphereGeometry(1.0, 24, 24);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
      wireframe: true
    });
    this.assimilationPulseMesh = new THREE.Mesh(shockGeo, shockMat);
    this.assimilationPulseMesh.position.copy(center);
    this.depthGroup.add(this.assimilationPulseMesh);

    this.assimilationPulse = {
      mesh: this.assimilationPulseMesh,
      radius: 1.0,
      maxRadius: 36.0,
      startTime: performance.now()
    };
  }

  // =========================================================================
  // 9. EVENT HANDLING & RAYCASTING
  // =========================================================================
  initEvents() {
    window.addEventListener("resize", () => this.onResize());

    this.container.addEventListener("pointermove", (e) => this.onPointerMove(e));
    this.container.addEventListener("click", (e) => this.onClick(e));
  }

  onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onPointerMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check if hovering over an Argo float
    const activeArgoGroup = this.currentCameraMode === "depth" ? this.depthArgoGroup : this.globeArgoGroup;
    const intersects = this.raycaster.intersectObjects(activeArgoGroup.children, true);

    let hoveredArgo = null;
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj && !obj.userData?.argoProfile) {
        obj = obj.parent;
      }
      if (obj?.userData?.argoProfile) {
        hoveredArgo = obj.userData.argoProfile;
        break;
      }
    }

    if (hoveredArgo) {
      this.container.style.cursor = "pointer";
      const val = getModelScalar(hoveredArgo.latitude, hoveredArgo.longitude, this.depth, this.variable, this.timeIndex);
      this.onHoverCoord({
        lat: hoveredArgo.latitude,
        lon: hoveredArgo.longitude,
        value: val.toFixed(2),
        bathymetry: -2850,
        variable: this.variable,
        depth: this.depth,
        x: e.clientX,
        y: e.clientY
      });
      return;
    }

    this.container.style.cursor = "default";

    // 2. Check if hovering over ocean surface in Depth mode
    if (this.currentCameraMode === "depth" && this.depthSurface) {
      const surfHits = this.raycaster.intersectObject(this.depthSurface);
      if (surfHits.length > 0) {
        const pt = surfHits[0].point;
        const geo = this.depth3DToGeo(pt.x, pt.z);
        const val = getModelScalar(geo.lat, geo.lon, this.depth, this.variable, this.timeIndex);
        const distFromCenter = Math.hypot(geo.lat - 14.5, geo.lon - 88.5);
        const bathymetry = Math.min(3850, Math.round(1800 + (1 - Math.min(1, distFromCenter / 7.2)) * 1950));

        this.onHoverCoord({
          lat: parseFloat(geo.lat.toFixed(2)),
          lon: parseFloat(geo.lon.toFixed(2)),
          value: val.toFixed(2),
          bathymetry: -bathymetry,
          variable: this.variable,
          depth: this.depth,
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  }

  onClick(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check Argo Floats Selection
    const activeArgoGroup = this.currentCameraMode === "depth" ? this.depthArgoGroup : this.globeArgoGroup;
    const intersects = this.raycaster.intersectObjects(activeArgoGroup.children, true);

    for (const hit of intersects) {
      let obj = hit.object;
      while (obj && !obj.userData?.argoProfile) {
        obj = obj.parent;
      }
      if (obj?.userData?.argoProfile) {
        const profile = obj.userData.argoProfile;
        this.selectArgo(profile.id);
        this.focusOnArgo(profile.id);
        this.onSelectArgo(profile);
        return;
      }
    }

    // 2. In Global View: clicking on Earth allows selecting a regional sub-domain
    if (this.currentCameraMode === "global" && this.earthMesh) {
      const earthHits = this.raycaster.intersectObject(this.earthMesh);
      if (earthHits.length > 0) {
        const hitPt = earthHits[0].point;
        const geo = this.globePointToLatLon(hitPt);

        // If clicked in/near Northern Indian Ocean / Bay of Bengal basin
        if (geo.lat >= 5 && geo.lat <= 25 && geo.lon >= 75 && geo.lon <= 98) {
          const halfLat = 4.5;
          const halfLon = 5.5;
          const newBounds = {
            minLat: Math.max(7.0, parseFloat((geo.lat - halfLat).toFixed(1))),
            maxLat: Math.min(23.0, parseFloat((geo.lat + halfLat).toFixed(1))),
            minLon: Math.max(79.0, parseFloat((geo.lon - halfLon).toFixed(1))),
            maxLon: Math.min(96.0, parseFloat((geo.lon + halfLon).toFixed(1)))
          };
          this.setRegionBounds(newBounds);
        }
      }
    }
  }

  // =========================================================================
  // 10. STATE UPDATES FROM CONTROL PANEL
  // =========================================================================
  updateState({ variable, depth, timeIndex, showModelRaster, showStreamlines, showArgoMarkers, showBathymetry, rasterOpacity }) {
    if (variable !== undefined && variable !== this.variable) {
      this.variable = variable;
    }
    if (depth !== undefined && depth !== this.depth) {
      this.depth = depth;
      this.updateDepthSlicePosition();
    }
    if (timeIndex !== undefined && timeIndex !== this.timeIndex) {
      this.timeIndex = timeIndex;
    }
    if (showStreamlines !== undefined) {
      this.showStreamlines = showStreamlines;
      if (this.tracerMesh) this.tracerMesh.visible = showStreamlines;
    }
    if (showArgoMarkers !== undefined) {
      this.showArgoMarkers = showArgoMarkers;
      if (this.globeArgoGroup) this.globeArgoGroup.visible = showArgoMarkers;
      if (this.depthArgoGroup) this.depthArgoGroup.visible = showArgoMarkers;
    }
    if (showBathymetry !== undefined) {
      this.showBathymetry = showBathymetry;
      if (this.bathymetryMesh) this.bathymetryMesh.visible = showBathymetry;
    }
    if (rasterOpacity !== undefined && this.tracerMesh) {
      this.rasterOpacity = rasterOpacity;
      this.tracerMesh.material.opacity = Math.min(0.5, rasterOpacity * 0.3);
    }
  }

  // =========================================================================
  // 11. SPATIAL TRANSITION STATE MACHINE EXECUTION (P0-1 & P0-2)
  // =========================================================================
  updateSpatialTransition(now) {
    const tr = this.spatialTransition;
    if (!tr) return;

    // Smooth cubic easing helper
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (tr.state === "RETURNING_TO_GLOBAL") {
      const elapsed = now - tr.startTime;
      const progress = Math.min(1.0, elapsed / tr.duration);
      const t = easeInOutCubic(progress);

      this.camera.position.lerpVectors(tr.startCamPos, tr.endCamPos, t);
      this.controls.target.lerpVectors(tr.startLookAt, tr.endLookAt, t);

      // Fade out depth volume, fade in globe
      if (this.earthMat) {
        this.earthMat.opacity = Math.min(1.0, 0.2 + progress * 0.8);
      }
      const volScaleY = Math.max(0.001, (1.0 - progress) * 1.0);
      this.depthGroup.scale.set(1.0, volScaleY, 1.0);

      if (progress >= 1.0) {
        this.depthGroup.visible = false;
        this.globeGroup.visible = true;
        this.transitionState = "IDLE_GLOBAL";
        this.spatialTransition = null;
      }
      return;
    }

    // Global -> Depth: Multi-Stage Pipeline (Total: ~3.0 seconds)
    // Stage A: Region Approach (0ms -> 900ms)
    // Stage B: Surface Descent (900ms -> 1700ms)
    // Stage C: Volumetric Extrusion & Emergence (1700ms -> 2400ms)
    // Stage D: Underwater Perspective Framing & Optical Attenuation (2400ms -> 3100ms)

    const elapsed = now - tr.startTime;

    if (elapsed < 900) {
      // Stage A: High-altitude orbit approach toward selected region
      this.transitionState = "APPROACHING_REGION";
      const progress = Math.min(1.0, elapsed / 900);
      const t = easeInOutCubic(progress);

      this.camera.position.lerpVectors(tr.startCamPos, tr.approachCamPos, t);
      this.controls.target.lerpVectors(tr.startLookAt, tr.gTarget, t);

      // Globe remains crisp and dominant
      if (this.earthMat) this.earthMat.opacity = 1.0;
      this.depthGroup.scale.set(1.0, 0.001, 1.0);
      if (this.tracerMat) this.tracerMat.opacity = 0.0;
      if (this.bathymetryMesh) this.bathymetryMesh.material.opacity = 0.0;
    } else if (elapsed < 1700) {
      // Stage B: Low-altitude surface approach over selected basin
      this.transitionState = "SURFACE_APPROACH";
      const stageElapsed = elapsed - 900;
      const progress = Math.min(1.0, stageElapsed / 800);
      const t = easeInOutCubic(progress);

      this.camera.position.lerpVectors(tr.approachCamPos, tr.surfaceCamPos, t);
      this.controls.target.lerpVectors(tr.gTarget, new THREE.Vector3(0, 0, 0), t);

      // Globe gently yields to ocean surface
      if (this.earthMat) this.earthMat.opacity = Math.max(0.15, 1.0 - progress * 0.75);
      if (this.depthSurface) {
        this.depthSurface.material.opacity = 0.08 + progress * 0.20;
      }
      this.depthGroup.scale.set(1.0, 0.02 + progress * 0.15, 1.0);
    } else if (elapsed < 2400) {
      // Stage C: Volumetric Extrusion & Component Emergence
      this.transitionState = "VOLUME_REVEAL";
      const stageElapsed = elapsed - 1700;
      const progress = Math.min(1.0, stageElapsed / 700);
      const t = easeInOutCubic(progress);

      // Cross camera to intermediate oblique altitude
      const midCam = tr.surfaceCamPos.clone().lerp(tr.finalCamPos, t);
      const midTarget = new THREE.Vector3(0, 0, 0).lerp(tr.finalTarget, t);
      this.camera.position.copy(midCam);
      this.controls.target.copy(midTarget);

      // Extrude depth volume vertically from sea surface down to seabed
      const extrudedY = 0.17 + t * 0.83; // Scale Y from 0.17 to 1.0
      this.depthGroup.scale.set(1.0, extrudedY, 1.0);

      // Components fade in as volume reaches full depth
      if (this.bathymetryMesh) {
        this.bathymetryMesh.material.opacity = Math.min(1.0, progress * 1.1);
      }
      if (this.tracerMat) {
        // Delicate particles fade in gently to standard 0.25 opacity
        this.tracerMat.opacity = Math.min(0.25, progress * 0.25);
      }

      // Hide Earth sphere as volume solidifies
      if (this.earthMat) this.earthMat.opacity = Math.max(0.0, 0.25 - progress * 0.25);
      if (progress > 0.85) {
        this.globeGroup.visible = false;
      }
    } else if (elapsed < 3100) {
      // Stage D: Underwater Perspective Framing & Optical Attenuation
      this.transitionState = "UNDERWATER_DESCENT";
      const stageElapsed = elapsed - 2400;
      const progress = Math.min(1.0, stageElapsed / 700);
      const t = easeInOutCubic(progress);

      this.camera.position.lerpVectors(this.camera.position, tr.finalCamPos, t * 0.3 + 0.1);
      this.controls.target.lerpVectors(this.controls.target, tr.finalTarget, t * 0.3 + 0.1);

      this.depthGroup.scale.set(1.0, 1.0, 1.0);

      // Gradually apply underwater optical attenuation (P0-2)
      if (!this.scene.fog) {
        this.setUnderwaterOpticalAttenuation(true);
      }

      if (this.rulerGroup) this.rulerGroup.visible = true;
      if (this.slicePlane) this.slicePlane.visible = true;
      if (this.depthSurface) this.depthSurface.material.opacity = 0.28;
      if (this.tracerMat) this.tracerMat.opacity = 0.25;
    } else {
      // Transition Complete: Lock into DEPTH_READY
      this.transitionState = "DEPTH_READY";
      this.camera.position.copy(tr.finalCamPos);
      this.controls.target.copy(tr.finalTarget);
      this.controls.update();

      this.depthGroup.scale.set(1.0, 1.0, 1.0);
      this.globeGroup.visible = false;
      this.setUnderwaterOpticalAttenuation(true);

      if (this.rulerGroup) this.rulerGroup.visible = true;
      if (this.slicePlane) this.slicePlane.visible = true;
      if (this.depthSurface) this.depthSurface.material.opacity = 0.28;
      if (this.tracerMat) this.tracerMat.opacity = 0.25;
      if (this.bathymetryMesh) this.bathymetryMesh.material.opacity = 1.0;

      this.spatialTransition = null;
    }
  }

  // =========================================================================
  // 12. ANIMATION & RENDER LOOP (60 FPS OPTIMIZED)
  // =========================================================================
  startRenderLoop() {
    const animate = (time) => {
      requestAnimationFrame(animate);

      // 1. Multi-Stage Spatial Transition State Machine (P0-1 & P0-2)
      if (this.spatialTransition) {
        this.updateSpatialTransition(performance.now());
      } else if (this.cameraTween) {
        // Standard Camera Tween Interpolation
        const elapsed = performance.now() - this.cameraTween.startTime;
        const progress = Math.min(1.0, elapsed / this.cameraTween.duration);
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, t);
        this.controls.target.lerpVectors(this.cameraTween.startLookAt, this.cameraTween.endLookAt, t);

        if (progress >= 1.0) {
          this.cameraTween = null;
        }
      }

      this.controls.update();

      // 2. Global Mode Atmospheric Breathing Pulse
      if (this.currentCameraMode === "global") {
        if (this.atmosMesh) {
          this.atmosMesh.scale.setScalar(1.0 + Math.sin(time * 0.002) * 0.008);
        }
      }

      // 3. Depth Mode Animations: Procedural Ocean Waves + Subtle Water Tracers
      if (this.currentCameraMode === "depth") {
        this.updateOceanSurfaceWaves(time);

        if (this.showStreamlines) {
          this.updateTracerParticles();
        }
      }

      // 4. Update Assimilation 3D Shockwave
      if (this.assimilationPulse) {
        const p = this.assimilationPulse;
        p.radius += 0.85;
        const scale = p.radius;
        p.mesh.scale.set(scale, scale * 0.45, scale);
        p.mesh.material.opacity = Math.max(0, 1.0 - p.radius / p.maxRadius);

        if (p.radius >= p.maxRadius) {
          this.depthGroup.remove(p.mesh);
          this.assimilationPulse = null;
        }
      }

      // 5. Pulsing rings animation on selected Argo float
      this.argo3DObjects.forEach((item, idx) => {
        const phase = time * 0.004 + idx * 0.5;
        const scale = 1.0 + Math.sin(phase) * 0.25;

        const dRing = item.depthObj.getObjectByName("depthSelectRing");
        if (dRing && item.id === this.selectedArgoId) {
          dRing.scale.setScalar(scale);
        }
      });

      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(animate);
  }
}
