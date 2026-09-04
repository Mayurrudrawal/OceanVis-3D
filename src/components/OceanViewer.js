import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getModelScalar, VARIABLES, DEPTH_LEVELS } from "../data/modelData.js";
import { getColor } from "../utils/colormaps.js";
import { createScientificEarthTexture } from "../utils/earthTexture.js";

export class OceanViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSelectArgo = options.onSelectArgo || (() => {});
    this.onHoverCoord = options.onHoverCoord || (() => {});

    this.variable = "temperature";
    this.depth = 0;
    this.timeIndex = 2;
    this.selectedArgoId = null;
    this.currentCameraMode = "global"; // "global" | "depth"
    this.depthViewDir = "front"; // "front" | "back" | "oblique"

    this.showModelRaster = true;
    this.showStreamlines = true;
    this.showArgoMarkers = true;
    this.showBathymetry = true;
    this.rasterOpacity = 0.85;

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
    this.initVelocityParticles();
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
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(150, 200, 150);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-150, -50, -150);
    this.scene.add(dirLight2);

    // Raycaster for mouse picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);
  }

  // =========================================================================
  // 2. MODE 1: GLOBAL BASIN (3D EARTH GLOBE)
  // =========================================================================
  buildGlobeScene() {
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    this.globeRadius = 65;

    // 1. Earth Sphere with High-Resolution Scientific Texture
    const earthGeo = new THREE.SphereGeometry(this.globeRadius, 64, 64);
    const earthTexture = createScientificEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.85,
      metalness: 0.15
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    // Align Bay of Bengal towards front camera view
    this.earthMesh.rotation.y = -Math.PI / 2 + 0.1;
    this.globeGroup.add(this.earthMesh);

    // 2. Atmospheric Outer Halo Glow
    const atmosGeo = new THREE.SphereGeometry(this.globeRadius * 1.025, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.globeGroup.add(this.atmosMesh);

    // 3. Indian Ocean / Bay of Bengal Domain Highlight Line in 3D
    this.globeDomainOutline = this.createGlobeDomainOutline();
    this.globeGroup.add(this.globeDomainOutline);

    // Group for 3D Argo markers on globe
    this.globeArgoGroup = new THREE.Group();
    this.globeGroup.add(this.globeArgoGroup);

    // Start with globe visible
    this.globeGroup.visible = true;
  }

  createGlobeDomainOutline() {
    // 7.5°N - 22.5°N, 79.5°E - 95.5°E
    const minLat = 7.5, maxLat = 22.5, minLon = 79.5, maxLon = 95.5;
    const points = [];
    const steps = 16;

    // Top edge
    for (let i = 0; i <= steps; i++) {
      const lon = minLon + (i / steps) * (maxLon - minLon);
      points.push(this.latLonToGlobePoint(maxLat, lon, this.globeRadius * 1.004));
    }
    // Right edge
    for (let i = 0; i <= steps; i++) {
      const lat = maxLat - (i / steps) * (maxLat - minLat);
      points.push(this.latLonToGlobePoint(lat, maxLon, this.globeRadius * 1.004));
    }
    // Bottom edge
    for (let i = 0; i <= steps; i++) {
      const lon = maxLon - (i / steps) * (maxLon - minLon);
      points.push(this.latLonToGlobePoint(minLat, lon, this.globeRadius * 1.004));
    }
    // Left edge
    for (let i = 0; i <= steps; i++) {
      const lat = minLat + (i / steps) * (maxLat - minLat);
      points.push(this.latLonToGlobePoint(lat, minLon, this.globeRadius * 1.004));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    return new THREE.Line(geo, mat);
  }

  latLonToGlobePoint(lat, lon, radius = this.globeRadius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    // Apply same rotation as earthMesh
    const rotY = -Math.PI / 2 + 0.1;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    return new THREE.Vector3(x * cosR + z * sinR, y, -x * sinR + z * cosR);
  }

  // =========================================================================
  // 3. MODE 2: DEPTH COLUMN (GENUINE 3D OCEAN VOLUME & SUBSURFACE)
  // =========================================================================
  buildDepthScene() {
    this.depthGroup = new THREE.Group();
    this.scene.add(this.depthGroup);

    // Coordinate space for Bay of Bengal Basin:
    // Longitude: 79.5°E to 95.5°E (mapped to X: -45 to +45)
    // Latitude:  7.5°N to 22.5°N  (mapped to Z: +38 to -38)
    // Depth:     0m to 2000m      (mapped to Y: 0 to -36)
    this.dimX = 90;
    this.dimZ = 76;
    this.dimY = 36; // 0 at surface, -36 at 2000m

    // 1. Translucent Ocean Surface (0m)
    const surfGeo = new THREE.PlaneGeometry(this.dimX, this.dimZ, 24, 24);
    surfGeo.rotateX(-Math.PI / 2);
    const surfMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.5,
      wireframe: false
    });
    this.depthSurface = new THREE.Mesh(surfGeo, surfMat);
    this.depthSurface.position.set(0, 0, 0);
    this.depthGroup.add(this.depthSurface);

    // Surface Grid Wireframe
    const surfWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(surfGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18 })
    );
    this.depthSurface.add(surfWire);

    // 2. 3D Bathymetry Seabed Floor (Continental shelves & Abyssal plain)
    this.buildBathymetryFloor();

    // 3. Bounding Volume Glass Cage & Structural Corner Pillars
    this.buildBoundingCage();

    // 4. Scientific 3D Depth Axis (0m, 100m, 500m, 1000m, 2000m)
    this.buildDepthAxis();

    // 5. Multi-layer Depth Slice Indicator
    this.buildDepthSliceIndicator();

    // 6. 3D Volumetric Scalar Particles (Temperature / Salinity field)
    this.buildVolumetricParticles();

    // 7. Group for 3D Argo float objects in depth volume
    this.depthArgoGroup = new THREE.Group();
    this.depthGroup.add(this.depthArgoGroup);

    // Initially depthGroup is hidden until Mode 2 is chosen
    this.depthGroup.visible = false;
  }

  // Maps (lat, lon, depth) to 3D Cartesian coordinates (X, Y, Z) in Depth Mode
  geoToDepth3D(lat, lon, depthMeters = 0) {
    // lon: 79.5° to 95.5° -> X: -45 to +45
    const normX = (lon - 79.5) / 16.0;
    const x = (normX - 0.5) * this.dimX;

    // lat: 7.5° to 22.5° -> Z: +38 (South) to -38 (North)
    const normZ = (lat - 7.5) / 15.0;
    const z = (0.5 - normZ) * this.dimZ;

    // depth: 0 to 2000m -> Y: 0 to -36
    const normY = Math.min(2000, Math.max(0, depthMeters)) / 2000.0;
    const y = -normY * this.dimY;

    return new THREE.Vector3(x, y, z);
  }

  // Reverse mapping from (x, z) on ocean surface to (lat, lon)
  depth3DToGeo(x, z) {
    const normX = x / this.dimX + 0.5;
    const lon = 79.5 + normX * 16.0;

    const normZ = 0.5 - z / this.dimZ;
    const lat = 7.5 + normZ * 15.0;

    return {
      lat: Math.max(7.5, Math.min(22.5, lat)),
      lon: Math.max(79.5, Math.min(95.5, lon))
    };
  }

  buildBathymetryFloor() {
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
    // 3D Glass bounding box with graduated corner scales
    const h = this.dimY;
    const boxGeo = new THREE.BoxGeometry(this.dimX, h, this.dimZ);
    const boxWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, linewidth: 1.5 })
    );
    boxWire.position.set(0, -h / 2, 0);
    this.depthGroup.add(boxWire);

    // Directional axis tags (N, S, E, W) on the surface frame
    this.createSurfaceLabel("NORTH (22.5°N)", 0, -this.dimZ / 2 - 4);
    this.createSurfaceLabel("SOUTH (7.5°N)", 0, this.dimZ / 2 + 4);
    this.createSurfaceLabel("WEST (79.5°E)", -this.dimX / 2 - 4, 0);
    this.createSurfaceLabel("EAST (95.5°E)", this.dimX / 2 + 4, 0);
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
    this.depthGroup.add(sprite);
  }

  buildDepthAxis() {
    // Vertical Scientific Depth Ruler positioned along Western edge
    const rulerGroup = new THREE.Group();
    const rulerX = -this.dimX / 2 - 3;
    const rulerZ = -this.dimZ / 2;

    // Vertical rule rod
    const rodGeo = new THREE.CylinderGeometry(0.3, 0.3, this.dimY, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(rulerX, -this.dimY / 2, rulerZ);
    rulerGroup.add(rod);

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
      rulerGroup.add(tickMesh);

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
      rulerGroup.add(sprite);
    });

    this.depthGroup.add(rulerGroup);
  }

  buildDepthSliceIndicator() {
    // Highlighting plane for the currently active depth slice (e.g. 0m, 100m, 500m...)
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
  // 4. 3D VOLUMETRIC SCALAR FIELD (TEMPERATURE / SALINITY PARTICLES)
  // =========================================================================
  buildVolumetricParticles() {
    // High-performance 3D Point Cloud representing the volumetric water column
    const nx = 30;
    const nz = 26;
    const ny = 8; // 8 discrete depths
    const totalPoints = nx * nz * ny;

    this.volumeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    this.volumePointData = []; // Store metadata for scalar lookups

    let idx = 0;
    for (let iy = 0; iy < ny; iy++) {
      const depthVal = DEPTH_LEVELS[iy];
      const y = -(depthVal / 2000.0) * this.dimY;

      for (let iz = 0; iz < nz; iz++) {
        const normZ = iz / (nz - 1);
        const z = (0.5 - normZ) * this.dimZ;
        const lat = 7.5 + (1 - normZ) * 15.0;

        for (let ix = 0; ix < nx; ix++) {
          const normX = ix / (nx - 1);
          const x = (normX - 0.5) * this.dimX;
          const lon = 79.5 + normX * 16.0;

          positions[idx * 3] = x;
          positions[idx * 3 + 1] = y;
          positions[idx * 3 + 2] = z;

          // Placeholder color
          colors[idx * 3] = 0.2;
          colors[idx * 3 + 1] = 0.6;
          colors[idx * 3 + 2] = 0.9;

          this.volumePointData.push({ lat, lon, depth: depthVal });
          idx++;
        }
      }
    }

    this.volumeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.volumeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Crisp circular sprite texture
    const pTexture = this.createParticleTexture();

    const pMat = new THREE.PointsMaterial({
      size: 4.2,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.volumePoints = new THREE.Points(this.volumeGeo, pMat);
    this.depthGroup.add(this.volumePoints);

    // Initial color calculation
    this.updateVolumetricColors();
  }

  createParticleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    const rad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    rad.addColorStop(0, "rgba(255, 255, 255, 1)");
    rad.addColorStop(0.4, "rgba(255, 255, 255, 0.85)");
    rad.addColorStop(0.85, "rgba(255, 255, 255, 0.15)");
    rad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  updateVolumetricColors() {
    if (!this.volumeGeo || !this.volumePointData) return;
    const colors = this.volumeGeo.attributes.color.array;
    const varConfig = VARIABLES[this.variable];
    const vMin = varConfig.min;
    const vMax = varConfig.max;
    const vRange = vMax - vMin || 1;

    for (let i = 0; i < this.volumePointData.length; i++) {
      const pt = this.volumePointData[i];
      const val = getModelScalar(pt.lat, pt.lon, pt.depth, this.variable, this.timeIndex);
      const norm = (val - vMin) / vRange;
      const [r, g, b] = getColor(norm, varConfig.palette);

      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = g / 255;
      colors[i * 3 + 2] = b / 255;
    }

    this.volumeGeo.attributes.color.needsUpdate = true;
  }

  // =========================================================================
  // 5. 3D CURRENT VELOCITY STREAMLINE PARTICLES
  // =========================================================================
  initVelocityParticles() {
    this.numFlowParticles = 280;
    this.flowGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numFlowParticles * 3);
    const colors = new Float32Array(this.numFlowParticles * 3);

    this.flowParticleData = [];

    for (let i = 0; i < this.numFlowParticles; i++) {
      const p = {
        lat: 8.5 + Math.random() * 13.0,
        lon: 80.5 + Math.random() * 14.0,
        depth: Math.random() > 0.6 ? 50 : 0,
        speed: 0.04 + Math.random() * 0.04,
        age: Math.floor(Math.random() * 100),
        maxAge: 80 + Math.floor(Math.random() * 60)
      };
      this.flowParticleData.push(p);

      const pt3d = this.geoToDepth3D(p.lat, p.lon, p.depth);
      positions[i * 3] = pt3d.x;
      positions[i * 3 + 1] = pt3d.y + 0.5;
      positions[i * 3 + 2] = pt3d.z;

      colors[i * 3] = 0.22;
      colors[i * 3 + 1] = 0.74;
      colors[i * 3 + 2] = 0.97;
    }

    this.flowGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.flowGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 5.5,
      map: this.createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.flowMesh = new THREE.Points(this.flowGeo, pMat);
    this.depthGroup.add(this.flowMesh);
  }

  updateVelocityParticles() {
    if (!this.flowGeo || !this.flowParticleData) return;
    const pos = this.flowGeo.attributes.position.array;

    for (let i = 0; i < this.flowParticleData.length; i++) {
      const p = this.flowParticleData[i];

      // Physics vector flow in Bay of Bengal:
      // Cyclonic/anticyclonic gyre circulation + EICC coastal boundary current
      const dLat = p.lat - 15.0;
      const dLon = p.lon - 88.0;
      const angle = Math.atan2(dLat, dLon) + Math.PI / 2;

      let u = Math.cos(angle) * p.speed;
      let v = Math.sin(angle) * p.speed;

      // Strong northward western boundary current (East India Coastal Current)
      if (p.lon < 84.5 && p.lat > 11.0 && p.lat < 19.0) {
        v += 0.05;
        u -= 0.01;
      }

      p.lat += v * 0.5;
      p.lon += u * 0.5;
      p.age++;

      // Respawn when out of bounds or expired
      if (p.age >= p.maxAge || p.lat < 7.5 || p.lat > 22.5 || p.lon < 79.5 || p.lon > 95.5) {
        p.lat = 8.5 + Math.random() * 13.0;
        p.lon = 80.5 + Math.random() * 14.0;
        p.age = 0;
        p.maxAge = 70 + Math.floor(Math.random() * 60);
      }

      const pt3d = this.geoToDepth3D(p.lat, p.lon, p.depth);
      pos[i * 3] = pt3d.x;
      pos[i * 3 + 1] = pt3d.y + 0.6;
      pos[i * 3 + 2] = pt3d.z;
    }

    this.flowGeo.attributes.position.needsUpdate = true;
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

    // Beacon Pin
    const pinGeo = new THREE.CylinderGeometry(0.3, 0.1, 3.5, 8);
    pinGeo.rotateX(Math.PI / 2);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.z = 1.75;
    markerGroup.add(pin);

    // Glowing Sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.z = 3.6;
    sphere.userData = { argoProfile: profile };
    markerGroup.add(sphere);

    // Pulsing Radar Ring
    const ringGeo = new THREE.RingGeometry(1.6, 2.3, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 3.6;
    ring.name = "radarRing";
    markerGroup.add(ring);

    // ID Tag Billboard
    const tag = this.createArgoBillboardTag(profile.id.replace("ARGO-", ""));
    tag.position.z = 5.2;
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
  // 7. CAMERA SYSTEM & DUAL MODES (GLOBAL vs DEPTH)
  // =========================================================================
  setCameraMode(mode) {
    this.currentCameraMode = mode;

    if (mode === "depth") {
      this.globeGroup.visible = false;
      this.depthGroup.visible = true;

      // Position camera at perspective angle looking into the ocean column
      this.setDepthViewDirection(this.depthViewDir || "front");
    } else {
      this.globeGroup.visible = true;
      this.depthGroup.visible = false;

      // Reset camera to Global Basin overview
      this.animateCameraTo(
        new THREE.Vector3(0, 35, 175),
        new THREE.Vector3(0, 0, 0),
        1000
      );
    }

    return mode === "depth";
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
    let camPos;

    if (dir === "back") {
      // Back view (looking from East towards West)
      camPos = new THREE.Vector3(0, 26, -115);
    } else if (dir === "oblique") {
      // 3D diagonal oblique angle
      camPos = new THREE.Vector3(80, 42, 80);
    } else if (dir === "top") {
      // Top down nadir angle
      camPos = new THREE.Vector3(0, 125, 0.1);
    } else {
      // Front view (looking from West/South towards North-East)
      camPos = new THREE.Vector3(0, 26, 115);
    }

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
        break;
      }
    }
  }

  // =========================================================================
  // 10. STATE UPDATES FROM CONTROL PANEL
  // =========================================================================
  updateState({ variable, depth, timeIndex, showModelRaster, showStreamlines, showArgoMarkers, showBathymetry, rasterOpacity }) {
    let needsColorUpdate = false;

    if (variable !== undefined && variable !== this.variable) {
      this.variable = variable;
      needsColorUpdate = true;
    }
    if (depth !== undefined && depth !== this.depth) {
      this.depth = depth;
      this.updateDepthSlicePosition();
      needsColorUpdate = true;
    }
    if (timeIndex !== undefined && timeIndex !== this.timeIndex) {
      this.timeIndex = timeIndex;
      needsColorUpdate = true;
    }
    if (showModelRaster !== undefined) {
      this.showModelRaster = showModelRaster;
      if (this.volumePoints) this.volumePoints.visible = showModelRaster;
    }
    if (showStreamlines !== undefined) {
      this.showStreamlines = showStreamlines;
      if (this.flowMesh) this.flowMesh.visible = showStreamlines;
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
    if (rasterOpacity !== undefined && this.volumePoints) {
      this.rasterOpacity = rasterOpacity;
      this.volumePoints.material.opacity = rasterOpacity * 0.85;
    }

    if (needsColorUpdate) {
      this.updateVolumetricColors();
    }
  }

  // =========================================================================
  // 11. ANIMATION & RENDER LOOP
  // =========================================================================
  startRenderLoop() {
    const animate = (time) => {
      requestAnimationFrame(animate);

      // 1. Camera Tween Interpolation
      if (this.cameraTween) {
        const elapsed = performance.now() - this.cameraTween.startTime;
        const progress = Math.min(1.0, elapsed / this.cameraTween.duration);
        // Cubic ease in-out
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, t);
        this.controls.target.lerpVectors(this.cameraTween.startLookAt, this.cameraTween.endLookAt, t);

        if (progress >= 1.0) {
          this.cameraTween = null;
        }
      }

      this.controls.update();

      // 2. Slow subtle earth rotation when idle in Global Basin mode
      if (this.currentCameraMode === "global" && this.earthMesh && !this.controls.state) {
        // Subtle atmospheric breathing pulse
        if (this.atmosMesh) {
          this.atmosMesh.scale.setScalar(1.0 + Math.sin(time * 0.002) * 0.008);
        }
      }

      // 3. 3D Current Velocity Streamline Update
      if (this.currentCameraMode === "depth" && this.showStreamlines) {
        this.updateVelocityParticles();
      }

      // 4. Update Assimilation 3D Shockwave
      if (this.assimilationPulse) {
        const p = this.assimilationPulse;
        p.radius += 0.85;
        const scale = p.radius;
        p.mesh.scale.set(scale, scale * 0.45, scale); // Ellipsoidal covariance spread
        p.mesh.material.opacity = Math.max(0, 1.0 - p.radius / p.maxRadius);

        if (p.radius >= p.maxRadius) {
          this.depthGroup.remove(p.mesh);
          this.assimilationPulse = null;
        }
      }

      // 5. Pulsing rings animation
      this.argo3DObjects.forEach((item, idx) => {
        const phase = time * 0.004 + idx * 0.5;
        const scale = 1.0 + Math.sin(phase) * 0.25;

        // Depth select ring
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
