
import ThreeGlobe from "three-globe";
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Color, TextureLoader } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "./assets/Updated Globe Data.json";
import * as THREE from "three";

// Layers & Managers
import { LayerManager } from "./managers/LayerManager.js";
import { SolarSystemManager } from "./managers/SolarSystemManager.js";
import { EarthquakeLayer } from "./layers/EarthquakeLayer.js";
import { VolcanoLayer } from "./layers/VolcanoLayer.js";
import { WildfireLayer } from "./layers/WildfireLayer.js";
import { SatelliteLayer } from "./layers/SatelliteLayer.js";

// Prediction Components (RESTORED)
import { PredictionManager } from "./managers/PredictionManager.js";
import { PredictionLayer } from "./layers/PredictionLayer.js";

// AI Components
import { CommandBar } from "./ui/CommandBar.js";
import { AtlasAgent } from "./ai/AtlasAgent.js";

// --- Global Error Handler ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.9)', color: 'red', padding: '20px', zIndex: '9999',
    whiteSpace: 'pre-wrap', fontFamily: 'monospace', pointerEvents: 'none'
  });
  div.innerHTML = `<h1>CRITICAL ERROR</h1>
    <strong>Message:</strong> ${msg}<br>
    <strong>File:</strong> ${url}<br>
    <strong>Line:</strong> ${lineNo}<br>
    <strong>Stack:</strong> ${error ? error.stack : 'No stack trace'}`;
  document.body.appendChild(div);
  return false;
};

// --- Global Variables ---
let renderer, camera, scene, controls;
let Globe;
let layerManager, solarSystemManager, predictionManager;
let predictionLayer;
let commandBar, atlasAgent;
let currentView = 'earth';

// --- Initialization ---
console.log("🚀 Script Bundle Loaded 🚀");

const init = () => {
  console.log("⚙️ Init started");
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#000000";
    // Renderer setup

    scene = new Scene();
    scene.background = new Color(0x000011);

    const ambientLight = new AmbientLight(0xbbbbbb, 0.3);
    scene.add(ambientLight);

    const sunLight = new DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(200, 0, 100);
    scene.add(sunLight);

    camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.z = 300;
    camera.position.y = 100;
    camera.lookAt(0, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 10;
    controls.maxDistance = 2000;

    Globe = new ThreeGlobe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .polygonsData(countries.features)
      .polygonCapColor(() => 'rgba(20, 30, 60, 0.6)')
      .polygonSideColor(() => 'rgba(100, 150, 255, 0.1)')
      .polygonStrokeColor(() => 'rgba(100, 200, 255, 0.4)')
      .polygonAltitude(0.01);

    scene.add(Globe);

    // Managers
    layerManager = new LayerManager(scene, Globe);
    layerManager.registerLayer('earthquakes', new EarthquakeLayer());
    layerManager.registerLayer('volcanoes', new VolcanoLayer());
    layerManager.registerLayer('wildfires', new WildfireLayer());
    layerManager.registerLayer('satellites', new SatelliteLayer());

    solarSystemManager = new SolarSystemManager(scene, camera, controls);

    // Prediction (RESTORED)
    // Initializing Prediction Engine
    predictionManager = new PredictionManager();
    predictionLayer = new PredictionLayer();

    // AI Setup
    atlasAgent = new AtlasAgent();
    commandBar = new CommandBar(async (text) => {
      const actions = await atlasAgent.process(text);
      return executeActions(actions);
    });

    // UI Setup
    createMainMenu();
    createNavMenu();

    window.addEventListener('resize', onWindowResize, false);
    // Init completed

  } catch (err) {
    console.error("❌ CRITICAL INIT ERROR:", err);
    // Fallback display
    document.body.innerHTML = `<h1 style="color:red; padding:20px;">Init Failed: ${err.message}</h1>`;
  }
}

const executeActions = (actions) => {
  if (!actions || actions.length === 0) return false;

  actions.forEach(act => {
    console.log("Executing:", act);

    if (act.action === "SWITCH_VIEW") {
      const view = act.params.view.toLowerCase();
      if (view === 'earth' || view === 'solar') {
        switchView(view);
      }
    }

    if (act.action === "FLY_TO") {
      if (currentView !== 'solar') switchView('solar');
      const target = act.params.target;
      if (target) solarSystemManager.focusPlanetByName(target);
    }

    if (act.action === "RESET") {
      if (currentView === 'solar') solarSystemManager.resetFocus();
      else {
        camera.position.set(0, 100, 300);
        controls.target.set(0, 0, 0);
        layerManager.clearAll();
        if (predictionLayer) predictionLayer.cleanup();
      }
    }

    if (act.action === "TOGGLE_LAYER") {
      if (currentView !== 'earth') switchView('earth');
      const layer = act.params.layer;
      const isActive = layerManager.activeLayers.has(layer);
      const desired = act.params.state;

      if (desired === true && !isActive) layerManager.toggleLayer(layer);
      else if (desired === false && isActive) layerManager.toggleLayer(layer);
      else if (desired === undefined) layerManager.toggleLayer(layer);
    }

    if (act.action === "FILTER_LAYER") {
      if (currentView !== 'earth') switchView('earth');
      const layer = act.params.layer;

      // Auto-enable if hidden
      if (!layerManager.activeLayers.has(layer)) {
        layerManager.toggleLayer(layer).then(() => {
          layerManager.filterLayer(layer, act.params);
        });
      } else {
        layerManager.filterLayer(layer, act.params);
      }
    }
  });
  return true;
}

const switchView = (view) => {
  currentView = view;
  const dock = document.getElementById('earth-dock');

  // Cleanup prediction if switching
  if (view !== 'earth' && predictionLayer) predictionLayer.cleanup();

  if (view === 'earth') {
    Globe.visible = true;
    layerManager.setGlobalVisibility(true);
    solarSystemManager.hide();

    camera.position.set(0, 100, 300);
    controls.target.set(0, 0, 0);
    controls.maxDistance = 1000;
    if (dock) dock.style.display = 'flex';

  } else if (view === 'solar') {
    Globe.visible = false;
    layerManager.setGlobalVisibility(false);
    solarSystemManager.show();

    controls.maxDistance = 5000;
    if (dock) dock.style.display = 'none';
  }
}

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();

  if (currentView === 'earth') {
    if (layerManager) layerManager.update();
  } else if (currentView === 'solar') {
    if (solarSystemManager) solarSystemManager.update();
  }

  renderer.render(scene, camera);
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const createNavMenu = () => {
  const nav = document.createElement('div');
  Object.assign(nav.style, {
    position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: '1000'
  });

  const createBtn = (id, label, active, onClick) => {
    const btn = document.createElement('button');
    btn.innerText = label;
    Object.assign(btn.style, {
      padding: '10px 20px', background: active ? 'rgba(0, 255, 255, 0.2)' : 'rgba(20, 30, 40, 0.8)',
      border: active ? '1px solid cyan' : '1px solid rgba(255,255,255,0.2)', color: active ? 'cyan' : 'white',
      borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backdropFilter: 'blur(5px)', transition: 'all 0.2s'
    });

    btn.addEventListener('click', onClick);
    nav.appendChild(btn);
    return btn;
  };

  // Earth
  const btnEarth = createBtn('earth', '🌍 EARTH', true, () => {
    resetNavStyles();
    btnEarth.style.background = 'rgba(0, 255, 255, 0.2)'; btnEarth.style.border = '1px solid cyan'; btnEarth.style.color = 'cyan';
    switchView('earth');
  });

  // Solar
  const btnSolar = createBtn('solar', '🌌 SOLAR SYSTEM', false, () => {
    resetNavStyles();
    btnSolar.style.background = 'rgba(0, 255, 255, 0.2)'; btnSolar.style.border = '1px solid cyan'; btnSolar.style.color = 'cyan';
    switchView('solar');
  });

  const resetNavStyles = () => {
    [btnEarth, btnSolar].forEach(b => {
      b.style.background = 'rgba(20, 30, 40, 0.8)';
      b.style.border = '1px solid rgba(255,255,255,0.2)';
      b.style.color = 'white';
    });
  };

  document.body.appendChild(nav);
}

const createMainMenu = () => {
  const dock = document.createElement('div');
  dock.id = 'earth-dock';
  Object.assign(dock.style, {
    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '12px', padding: '12px 24px', background: 'rgba(20, 30, 40, 0.8)',
    backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: '1000', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  });

  // Track if we are in "Prediction Mode"
  let predictionActive = false;

  const updateButtonStates = () => {
    Array.from(dock.children).forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (id && id !== 'reset' && id !== 'predict') {
        const active = layerManager.activeLayers.has(id);

        // If prediction is active, dim the normal layer buttons to show they are hidden
        if (predictionActive) {
          btn.style.opacity = '0.5';
          btn.style.background = 'transparent';
          btn.style.border = '1px solid transparent';
          return;
        }

        btn.style.opacity = '1.0';
        if (active) {
          btn.style.background = 'rgba(0, 255, 255, 0.2)';
          btn.style.color = '#00ffff';
          btn.style.border = '1px solid rgba(0,255,255,0.3)';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'white';
          btn.style.border = '1px solid transparent';
        }
      } else if (id === 'predict') {
        // Highlight Predict button if active
        if (predictionActive) {
          btn.style.background = 'rgba(255, 0, 255, 0.4)';
          btn.style.boxShadow = '0 0 10px #ff00ff';
        } else {
          btn.style.background = 'rgba(255, 0, 255, 0.1)';
          btn.style.boxShadow = 'none';
        }
      }
    });
  };

  const createToggle = (id, label, icon) => {
    const btn = document.createElement('button');
    btn.setAttribute('data-id', id);
    btn.innerHTML = `<span style="font-size:20px; display:block; margin-bottom:4px;">${icon}</span><span style="font-size:10px; opacity:0.8;">${label}</span>`;
    Object.assign(btn.style, {
      padding: '8px 16px', background: 'transparent', border: '1px solid transparent', color: 'white',
      cursor: 'pointer', textAlign: 'center', borderRadius: '8px', transition: 'all 0.2s', minWidth: '70px'
    });

    btn.addEventListener('click', async () => {
      // If we were in Prediction Mode, exit it and restore visuals
      if (predictionActive) {
        predictionActive = false;
        if (predictionLayer) predictionLayer.cleanup();
        layerManager.setGlobalVisibility(true);
      }

      await layerManager.toggleLayer(id);
      updateButtonStates();
    });
    btn.addEventListener('mouseenter', () => { if (!layerManager.activeLayers.has(id) && !predictionActive) btn.style.background = 'rgba(255,255,255,0.1)'; });
    btn.addEventListener('mouseleave', () => { if (!layerManager.activeLayers.has(id) && !predictionActive) btn.style.background = 'transparent'; });
    dock.appendChild(btn);
  };

  createToggle('earthquakes', 'Quakes', '📉');
  createToggle('volcanoes', 'Volcanoes', '🌋');
  createToggle('wildfires', 'Fires', '🔥');
  createToggle('satellites', 'Orbit', '🛰️');

  // PREDICT BUTTON (RESTORED & ISOLATED)
  const predictBtn = document.createElement('button');
  predictBtn.setAttribute('data-id', 'predict');
  predictBtn.innerHTML = `<span style="font-size:20px; display:block; margin-bottom:4px;">🔮</span><span style="font-size:10px; opacity:0.8;">Predict</span>`;
  Object.assign(predictBtn.style, {
    padding: '8px 16px', background: 'rgba(255, 0, 255, 0.1)', border: '1px solid rgba(255,0,255,0.3)', color: '#ffccff',
    cursor: 'pointer', textAlign: 'center', borderRadius: '8px', transition: 'all 0.2s',
    minWidth: '70px', marginLeft: '12px'
  });

  predictBtn.addEventListener('click', () => {
    // If already active, toggle off
    if (predictionActive) {
      predictionActive = false;
      if (predictionLayer) predictionLayer.cleanup();
      layerManager.setGlobalVisibility(true);
      updateButtonStates();
      return;
    }

    // Prediction flow
    try {
      if (predictionManager) predictionManager.clear();

      const allData = layerManager.getAllData();
      if (!allData || allData.length === 0) {
        alert("Please enable active layers (Quakes, Fires) to predict risk!");
        return;
      }

      allData.forEach(set => predictionManager.ingest(set.name, set.data));
      const results = predictionManager.predict();

      // ENTER PREDICTION MODE
      predictionActive = true;
      layerManager.setGlobalVisibility(false); // Hide cluttered layers
      // FIX: Force InfoPanel back ON so we see the prediction legend
      layerManager.infoPanel.container.style.display = 'flex';

      predictionLayer.init(scene, Globe, layerManager.infoPanel);
      predictionLayer.visualize(results);
      updateButtonStates();

    } catch (e) {
      console.error("Prediction Error:", e);
      alert("Prediction Error: " + e.message);
      predictionActive = false;
      layerManager.setGlobalVisibility(true);
      updateButtonStates();
    }
  });
  dock.appendChild(predictBtn);

  const homeBtn = document.createElement('button');
  homeBtn.setAttribute('data-id', 'reset');
  homeBtn.innerHTML = `<span style="font-size:20px; display:block; margin-bottom:4px;">🏠</span><span style="font-size:10px; opacity:0.8;">Home</span>`;
  Object.assign(homeBtn.style, {
    padding: '8px 16px', background: 'rgba(255, 50, 50, 0.2)', border: 'none', color: '#ffaaaa',
    cursor: 'pointer', textAlign: 'center', borderRadius: '8px', transition: 'all 0.2s',
    minWidth: '70px', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)'
  });
  homeBtn.addEventListener('click', async () => {
    predictionActive = false;
    layerManager.setGlobalVisibility(true); // Ensure partial visibility resets
    await layerManager.clearAll();
    if (predictionLayer) predictionLayer.cleanup();
    updateButtonStates();
  });

  dock.appendChild(homeBtn);
  document.body.appendChild(dock);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { console.log("DOMContentLoaded"); init(); animate(); });
} else {
  console.log("ReadyState interactive/complete"); init(); animate();
}