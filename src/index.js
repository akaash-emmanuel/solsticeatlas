import ThreeGlobe from "three-globe";
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, MeshBasicMaterial, Mesh, Color, Fog, PointLight, Group, Vector3, Vector2, BufferGeometry, SphereGeometry, CanvasTexture, SpriteMaterial, Sprite, CylinderGeometry, LineLoop, LineBasicMaterial, Raycaster, RingGeometry, DoubleSide, Clock } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "./assets/Updated Globe Data.json";
import spaceMusic from "./assets/spacemusic.mp3";
import gsap from 'gsap';
import * as satellite from 'satellite.js';
import axios from 'axios';
import { createSpaceBackground, createSpaceSkybox } from './components/SpaceBackground.js';


// Import the astronaut tools components
import * as AstronautTools from './components/AstronautTools.js';
import * as Moon from './components/Moon.js';
import * as Sun from './components/Sun.js';
import * as LunarOrbiter from './components/LunarOrbiter.js';
import { stopCurrentAnimation } from './components/LunarOrbiter.js';
import { createMercury, updateMercuryPosition } from './components/Mercury.js';
import { createVenus, updateVenusPosition } from './components/Venus.js';
import { createMars, updateMarsPosition } from './components/Mars.js';
import { createJupiter, updateJupiterPosition, toggleJupiterVisibility } from './components/Jupiter.js';
import { createSaturn, updateSaturnPosition, toggleSaturnVisibility, SATURN_RADIUS } from './components/Saturn.js';
import { createAsteroidBelt, updateAsteroidBelt, toggleAsteroidBeltVisibility } from './components/AsteroidBelt.js';
import { createUranus, updateUranusPosition, URANUS_RADIUS } from './components/Uranus.js';
import { createNeptune, updateNeptunePosition, toggleNeptuneVisibility, NEPTUNE_RADIUS } from './components/Neptune.js';

// Import constants from Sun.js and Moon.js for camera positioning
const SUN_RADIUS = 10; // Same as in Sun.js
const MOON_RADIUS = 0.5; // Same as in Moon.js
const MOON_DISTANCE = 300; // Same as in Moon.js

let renderer, camera, scene, controls;
let Globe;
let globeGroup;
let moon; // Reference to the moon object
let sun; // Reference to the sun object
let mercury; // Reference to the Mercury object
let venus; // Reference to the Venus object
let mars; // Reference to the Mars object
let jupiter; // Reference to the Jupiter object
let saturn; // Reference to the Saturn object
let uranus; // Reference to the Uranus object
let neptune; // Reference to the Neptune object
let audio;
let audioPlayed = false;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let currentAnimation = null;
let currentTypeWriter = null;
let mouseX = 0;
let mouseY = 0;
let isGlobeRotating = true;
let isEarthOrbiting = true; // Whether Earth orbits around the Sun
let isMoonOrbiting = true; // Whether Moon orbits around the Earth
let clock = new Clock(); // For tracking time in animations
let cameraFocus = 'earth'; // Current camera focus: 'earth', 'sun', or 'moon'

// Initialize globals
let currentTool = null;
let toolCleanupFunction = null;
// Global variable for the focus menu
let focusMenuContent = null; // Menu content container for celestial bodies

// Typewriter effect function
function typeWriter(htmlContent, targetElement, speed = 50) {
  if (!targetElement || !htmlContent) return;
  
  // Stop any currently running typewriter
  stopCurrentTypeWriter();
  
  // Clear the target element
  targetElement.innerHTML = '';
  
  // Parse HTML content to handle tags properly
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  let textIndex = 0;
  const fullText = tempDiv.innerHTML;
  
  function type() {
    if (textIndex < fullText.length) {
      // Get current character
      let char = fullText.charAt(textIndex);
      
      // Handle HTML tags - if we encounter '<', include everything until '>'
      if (char === '<') {
        let tagEnd = fullText.indexOf('>', textIndex);
        if (tagEnd !== -1) {
          // Include the entire tag
          targetElement.innerHTML = fullText.substring(0, tagEnd + 1);
          textIndex = tagEnd + 1;
        } else {
          // Fallback if no closing tag found
          targetElement.innerHTML = fullText.substring(0, textIndex + 1);
          textIndex++;
        }
      } else {
        // Regular character
        targetElement.innerHTML = fullText.substring(0, textIndex + 1);
        textIndex++;
      }
      
      // Continue typing with setTimeout
      currentTypeWriter = setTimeout(type, speed);
    } else {
      // Typing complete
      currentTypeWriter = null;
    }
  }
  
  // Start typing
  type();
}

// Function to stop current typewriter animation
function stopCurrentTypeWriter() {
  if (currentTypeWriter) {
    clearTimeout(currentTypeWriter);
    currentTypeWriter = null;
  }
}

// Function to update UI when focus changes
function updateFocusButtonsUI() {
  // Check if focusMenuContent exists before proceeding
  if (!focusMenuContent) {
    console.warn('focusMenuContent not initialized yet');
    return;
  }
  
  // Update button states based on current focus
  const buttons = focusMenuContent.getElementsByTagName('button');
  Array.from(buttons).forEach(button => {
    // Extract body name from button text, handling various formats safely
    const textParts = button.textContent.split(' ');
    const bodyName = textParts.length > 1 ? textParts[1].toLowerCase() : textParts[0].toLowerCase();
    
    if (bodyName === cameraFocus) {
      button.style.backgroundColor = '#333';
      button.style.borderColor = '#555';
    } else {
      button.style.backgroundColor = '#1a1a1a';
      button.style.borderColor = '#333';
    }
  });

  // Update wavelength selector visibility for sun
  const wavelengthSelector = document.getElementById('wavelength-selector');
  if (wavelengthSelector) {
    wavelengthSelector.style.display = cameraFocus === 'sun' ? 'flex' : 'none';
  }

  // Remove any existing planet-specific monitor buttons
  const existingMonitorButtons = document.getElementById('planet-monitor-buttons');
  if (existingMonitorButtons) {
    existingMonitorButtons.remove();
  }

  // Create planet-specific atmospheric monitor buttons
  createPlanetSpecificMonitorButtons();
}

// Function to create planet-specific monitor buttons when focusing on planets
function createPlanetSpecificMonitorButtons() {
  // All atmospheric monitors have been removed
  const planetMonitors = {};

  // Check if current focus has an atmospheric monitor
  const currentMonitor = planetMonitors[cameraFocus];
  if (!currentMonitor) {
    return; // No monitor available for this celestial body
  }

  // Create container for planet-specific monitor buttons
  const monitorButtonsContainer = document.createElement('div');
  monitorButtonsContainer.id = 'planet-monitor-buttons';
  monitorButtonsContainer.style.position = 'absolute';
  monitorButtonsContainer.style.top = '70px';
  monitorButtonsContainer.style.right = '20px';
  monitorButtonsContainer.style.zIndex = '1000';
  monitorButtonsContainer.style.display = 'flex';
  monitorButtonsContainer.style.flexDirection = 'column';
  monitorButtonsContainer.style.gap = '10px';

  // Create the atmospheric monitor button
  const monitorButton = document.createElement('button');
  monitorButton.style.padding = '12px 16px';
  monitorButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  monitorButton.style.color = '#ffffff';
  monitorButton.style.border = '2px solid #00ffff';
  monitorButton.style.borderRadius = '8px';
  monitorButton.style.cursor = 'pointer';
  monitorButton.style.fontFamily = "'Montserrat', sans-serif";
  monitorButton.style.fontSize = '14px';
  monitorButton.style.fontWeight = 'bold';
  monitorButton.style.transition = 'all 0.3s ease';
  monitorButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
  monitorButton.style.display = 'flex';
  monitorButton.style.alignItems = 'center';
  monitorButton.style.gap = '8px';
  monitorButton.style.minWidth = '200px';

  monitorButton.innerHTML = `
    <span style="font-size: 16px;">${currentMonitor.icon}</span>
    <div style="display: flex; flex-direction: column; align-items: flex-start;">
      <div style="font-size: 14px; font-weight: bold;">${currentMonitor.name}</div>
      <div style="font-size: 11px; opacity: 0.8; color: #aaa;">${currentMonitor.description}</div>
    </div>
  `;

  // Add hover effects
  monitorButton.addEventListener('mouseover', () => {
    monitorButton.style.backgroundColor = 'rgba(0, 255, 255, 0.2)';
    monitorButton.style.transform = 'translateY(-2px)';
    monitorButton.style.boxShadow = '0 4px 20px rgba(0, 255, 255, 0.5)';
  });

  monitorButton.addEventListener('mouseout', () => {
    monitorButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    monitorButton.style.transform = 'translateY(0)';
    monitorButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
  });

  // Add click handler to launch the atmospheric monitor
  monitorButton.addEventListener('click', () => {
    // Get the planet name from the current focus
    const planetName = cameraFocus;
    
    // Switch camera focus to the planet first
    switchCameraFocus(planetName,1.5);
    
    // Wait for camera transition to complete, then launch monitor
    setTimeout(() => {
      // Import the required functions dynamically and call the appropriate monitor
      import('./components/AstronautTools.js').then(AstronautToolsModule => {
        // Clear any existing tools first
        AstronautToolsModule.clearAstronautTools(Globe, globeGroup);
        AstronautToolsModule.clearDebrisAndOrbits(globeGroup);
        
        // Create vertical info panel
        AstronautToolsModule.createVerticalButton();
        
        // Show loading indicator
        AstronautToolsModule.showLoadingIndicator();
        
        // These monitor functions are no longer available as their component files have been removed
        setTimeout(() => {
          try {
            console.log('The selected monitor is no longer available');
            AstronautToolsModule.hideLoadingIndicator();
            
            // Display a notification that this feature is no longer available
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '50%';
            notification.style.left = '50%';
            notification.style.transform = 'translate(-50%, -50%)';
            notification.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            notification.style.color = 'white';
            notification.style.padding = '20px';
            notification.style.borderRadius = '10px';
            notification.style.zIndex = '10000';
            notification.innerHTML = `<p>This feature is no longer available</p>`;
            document.body.appendChild(notification);
            
            // Remove the notification after 3 seconds
            setTimeout(() => {
              notification.remove();
            }, 3000);
            
            // Return to Earth view
            if (typeof window.focusOnEarth === 'function') {
              window.focusOnEarth();
            }
          } catch (error) {
            console.error(`Error launching ${currentMonitor.name}:`, error);
            AstronautToolsModule.hideLoadingIndicator();
          }
        }, 100);
      });
    }, 1600); // Wait for camera transition to complete
  });

  monitorButtonsContainer.appendChild(monitorButton);
  document.body.appendChild(monitorButtonsContainer);

  // Add fade-in animation
  monitorButtonsContainer.style.opacity = '0';
  monitorButtonsContainer.style.transform = 'translateX(20px)';
  setTimeout(() => {
    monitorButtonsContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    monitorButtonsContainer.style.opacity = '1';
    monitorButtonsContainer.style.transform = 'translateX(0)';
  }, 100);
}

function createCelestialMenu() {
  // Create focus menu container with enhanced visibility
  const focusMenu = document.createElement("div");
  focusMenu.style.position = "absolute";
  focusMenu.style.top = "20px";
  focusMenu.style.right = "20px";
  focusMenu.style.zIndex = "1000";
  focusMenu.style.padding = "5px";
  focusMenu.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
  focusMenu.style.borderRadius = "8px";
  focusMenu.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.2)";

  // Create focus menu hamburger button
  const focusHamburger = document.createElement("div");
  focusHamburger.style.cursor = "pointer";
  focusHamburger.style.padding = "10px";
  focusHamburger.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  focusHamburger.style.borderRadius = "4px";
  focusHamburger.style.border = "1px solid rgba(255, 255, 255, 0.3)";
  focusHamburger.style.boxShadow = "0 0 5px rgba(255, 255, 255, 0.2)";
  focusHamburger.innerHTML = `
    <div style="width: 25px; height: 3px; background-color: white; margin: 5px 0;"></div>
    <div style="width: 25px; height: 3px; background-color: white; margin: 5px 0;"></div>
    <div style="width: 25px; height: 3px; background-color: white; margin: 5px 0;"></div>
  `;
  focusMenu.appendChild(focusHamburger);

  // Create Focus Menu Content using global variable with animation properties
  focusMenuContent = document.createElement("div");
  focusMenuContent.style.position = "absolute";
  focusMenuContent.style.top = "40px";
  focusMenuContent.style.right = "0";
  focusMenuContent.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  focusMenuContent.style.borderRadius = "8px";
  focusMenuContent.style.padding = "10px";
  focusMenuContent.style.display = "none";
  focusMenuContent.style.flexDirection = "column";
  focusMenuContent.style.gap = "8px";
  focusMenuContent.style.minWidth = "150px";
  focusMenuContent.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 144, 226, 0.3)";
  focusMenuContent.style.border = "1px solid rgba(74, 144, 226, 0.3)";
  focusMenuContent.style.transition = "opacity 0.2s ease-in-out, transform 0.2s ease-out";
  focusMenuContent.style.opacity = "0";
  focusMenuContent.style.transform = "translateY(-10px)";

  // Add title to menu
  const menuTitle = document.createElement('div');
  menuTitle.textContent = 'Celestial Bodies';
  menuTitle.style.color = '#4a90e2';
  menuTitle.style.fontWeight = 'bold';
  menuTitle.style.padding = '5px 10px';
  menuTitle.style.borderBottom = '1px solid #333';
  menuTitle.style.marginBottom = '5px';
  menuTitle.style.display = 'flex';
  menuTitle.style.justifyContent = 'space-between';
  menuTitle.style.alignItems = 'center';
  
  // Add close button to celestial menu
  const celestialMenuCloseButton = document.createElement("button");
  celestialMenuCloseButton.innerHTML = "&times;";
  celestialMenuCloseButton.style.width = "18px";
  celestialMenuCloseButton.style.height = "18px";
  celestialMenuCloseButton.style.border = "none";
  celestialMenuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  celestialMenuCloseButton.style.color = "#ffffff";
  celestialMenuCloseButton.style.borderRadius = "50%";
  celestialMenuCloseButton.style.cursor = "pointer";
  celestialMenuCloseButton.style.fontSize = "12px";
  celestialMenuCloseButton.style.display = "flex";
  celestialMenuCloseButton.style.alignItems = "center";
  celestialMenuCloseButton.style.justifyContent = "center";
  celestialMenuCloseButton.style.transition = "background-color 0.3s ease";
  
  celestialMenuCloseButton.addEventListener("mouseover", () => {
    celestialMenuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
  });
  
  celestialMenuCloseButton.addEventListener("mouseout", () => {
    celestialMenuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });
  
  celestialMenuCloseButton.addEventListener("click", (e) => {
    e.stopPropagation();
    focusMenuContent.style.opacity = '0';
    setTimeout(() => {
      focusMenuContent.style.display = 'none';
    }, 200);
  });
  
  menuTitle.appendChild(celestialMenuCloseButton);
  focusMenuContent.appendChild(menuTitle);

  // Define celestial bodies
  const celestialBodies = [
    { name: 'Earth', icon: '🌍', onclick: focusOnEarth },
    { name: 'Sun', icon: '☀️', onclick: focusOnSun },
    { name: 'Moon', icon: '🌕', onclick: focusOnMoon },
    { name: 'Mercury', icon: '☿', onclick: focusOnMercury },
    { name: 'Venus', icon: '♀', onclick: focusOnVenus },
    { name: 'Mars', icon: '♂', onclick: focusOnMars },
    { name: 'Jupiter', icon: '♃', onclick: focusOnJupiter },
    { name: 'Saturn', icon: '♄', onclick: focusOnSaturn },
    { name: 'Asteroid Belt', icon: '💫', onclick: focusOnAsteroidBelt },
    { name: 'Uranus', icon: '♅', onclick: focusOnUranus },
    { name: 'Neptune', icon: '♆', onclick: focusOnNeptune }
  ];

  // Create buttons for each celestial body
  celestialBodies.forEach(body => {
    const button = document.createElement('button');
    Object.assign(button.style, {
      padding: '10px 15px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      border: '1px solid #333',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%'
    });

    button.innerHTML = `${body.icon} ${body.name}`;
    button.addEventListener('click', () => {
      body.onclick();
      focusMenuContent.style.display = 'none';
      updateFocusButtonsUI();
    });

    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#333';
    });

    button.addEventListener('mouseout', () => {
      if (body.name.toLowerCase() !== cameraFocus) {
        button.style.backgroundColor = '#1a1a1a';
      }
    });

    focusMenuContent.appendChild(button);
  });

  focusMenu.appendChild(focusMenuContent);
  document.body.appendChild(focusMenu);

  // Toggle menu on hamburger click with improved handling
  focusHamburger.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent bubbling to document
    const computedStyle = window.getComputedStyle(focusMenuContent);
    const isDisplayNone = computedStyle.display === 'none' || focusMenuContent.style.display === '';
    if (isDisplayNone) {
      focusMenuContent.style.display = 'flex';
      setTimeout(() => {
        focusMenuContent.style.opacity = '1';
        focusMenuContent.style.transform = 'translateY(0)';
      }, 10);
    } else {
      focusMenuContent.style.opacity = '0';
      setTimeout(() => {
        focusMenuContent.style.display = 'none';
      }, 200);
    }
  });

  // Close menu when clicking outside with improved handling
  document.addEventListener('click', (event) => {
    if (window.getComputedStyle(focusMenuContent).display !== 'none') {
      if (!focusMenu.contains(event.target)) {
        focusMenuContent.style.opacity = '0';
        setTimeout(() => {
          focusMenuContent.style.display = 'none';
        }, 200);
      }
    }
  });

  // Initial UI update
  updateFocusButtonsUI();
  
  // Add debug overlay for celestial menu
  const debugButton = document.createElement("button");
  debugButton.textContent = "Debug Celestial Menu";
  debugButton.style.position = "absolute";
  debugButton.style.top = "20px";
  debugButton.style.right = "80px";
  debugButton.style.zIndex = "2000";
  debugButton.style.padding = "5px";
  debugButton.style.backgroundColor = "#333";
  debugButton.style.color = "#fff";
  debugButton.style.border = "1px solid #555";
  debugButton.style.cursor = "pointer";
  debugButton.style.display = "none"; // Hidden by default, enable for debugging
  
  debugButton.addEventListener("click", () => {
    console.log("Celestial Menu Debug:");
    console.log("- Display:", window.getComputedStyle(focusMenuContent).display);
    console.log("- Opacity:", window.getComputedStyle(focusMenuContent).opacity);
    console.log("- zIndex:", window.getComputedStyle(focusMenuContent).zIndex);
    
    // Toggle visibility
    if (focusMenuContent.style.display === "none" || focusMenuContent.style.display === "") {
      focusMenuContent.style.display = "flex";
      focusMenuContent.style.opacity = "1";
      focusMenuContent.style.transform = "translateY(0)";
    } else {
      focusMenuContent.style.display = "none";
    }
  });
  
  document.body.appendChild(debugButton);
  
  console.log("Celestial menu created successfully");
}

// Focus functions for celestial bodies
function focusOnEarth() {
  switchCameraFocus('earth');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnSun() {
  switchCameraFocus('sun');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnMoon() {
  switchCameraFocus('moon');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnMercury() {
  switchCameraFocus('mercury');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnVenus() {
  switchCameraFocus('venus');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnMars() {
  switchCameraFocus('mars');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnJupiter() {
  switchCameraFocus('jupiter');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnSaturn() {
  switchCameraFocus('saturn');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnAsteroidBelt() {
  switchCameraFocus('asteroidbelt');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnUranus() {
  switchCameraFocus('uranus');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function focusOnNeptune() {
  switchCameraFocus('neptune');
  focusMenuContent.style.display = 'none';
  updateFocusButtonsUI();
}

function init() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Try to append to container, fallback to body
  const container = document.getElementById('container');
  if (container) {
    container.appendChild(renderer.domElement);
  } else {
    document.body.appendChild(renderer.domElement);
  }
  
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";
  
  // Debug info
  console.log("Initializing Globe Tour application...");

  scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 0.3));    // Restored ambient lighting to make stars visible
  scene.background = new Color(0x000000);        // black space color

  camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);   // set camera view with greatly increased far plane
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();  // Three directional lights set to the screen with minimal intensity
  // Sun will be the primary light source, these are just for minimal ambient lighting
  
  const dLight = new DirectionalLight(0xffffff, 1.0);    // Changed to pure white light
  dLight.position.set(1, 1, 1);
  camera.add(dLight);

  const dLight1 = new DirectionalLight(0xffffff, 0.8);   // Changed to pure white light
  dLight1.position.set(0, 500, 500);
  camera.add(dLight1);

  const dLight2 = new DirectionalLight(0xffffff, 0.5);   // Changed to pure white light
  dLight2.position.set(-200, 500, 200);
  camera.add(dLight2);

  camera.position.z = 400;
  scene.add(camera);
  
  // Store initial camera position for reset functionality
  camera.userData = {
    initialPosition: new Vector3(0, 0, 400)
  };

  // Removed fog for better star visibility

  controls = new OrbitControls(camera, renderer.domElement);   // set basic default attribrutes to the globe and user controls
  controls.enableDamping = false;
  controls.dynamicDampingFactor = 0.01;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 115;
  controls.maxDistance = 50000; // Greatly increased to allow viewing Uranus and other distant celestial bodies
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 1.0;
  controls.autoRotate = false;
  controls.minPolarAngle = Math.PI / 3.5;
  controls.maxPolarAngle = Math.PI - Math.PI / 3;
  
  // Make camera and controls accessible to mission simulators
  scene.userData.camera = camera;
  scene.userData.controls = controls;

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove);
  
  // Initialize all celestial bodies
  initGlobe();
  initSun();
  initMoon();
  initMercury();
  initVenus();
  initMars();
  initJupiter();
  initSaturn();
  initUranus();
  initNeptune();
  initAsteroidBelt();
  
  
  // Initialize additional features
  createSpaceSkybox(scene); // Add space skybox
  createSpaceBackground(scene); // Add stars, galaxies, and nebulae
  shootingStars();
  prepareAmbientMusic();
  createButtons();
  
  createCelestialMenu(); // Add the new celestial bodies menu
  
  // Make switchCameraFocus function globally accessible
  window.switchCameraFocus = switchCameraFocus;
}
function initGlobe() {
  globeGroup = new Group();

  Globe = new ThreeGlobe()
    .hexPolygonsData(countries.features)
    .hexPolygonResolution(3)
    .hexPolygonMargin(0.7)
    .showAtmosphere(false) // Atmosphere disabled to remove blue fog
    .hexPolygonColor(() => "rgba(255,255,255, 0.7)"); // Default color

  Globe.rotateY(-Math.PI * (5 / 9));
  Globe.rotateZ(-Math.PI / 6);

  const globeMaterial = Globe.globeMaterial();
  globeMaterial.color = new Color(0x000033); // Changed from 0x240750 (dark purple) to very dark blue
  globeMaterial.emissive = new Color(0x000000); // Changed from 0x220038 (dark purple) to black
  globeMaterial.emissiveIntensity = 0;  // Reduced from 0.05
  globeMaterial.shininess = 0.7;  // Increased from 0.5

  globeGroup.add(Globe);

  const borders = drawCountryBorders();
  globeGroup.add(borders);

  scene.add(globeGroup);

  return globeGroup;
}
function convertLatLonToXYZ(lat, lon, radius) {
  const longitudeOffset = -90;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180 + longitudeOffset) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
function getQuakeColor(magnitude) {
  if (!magnitude) return '#ffffff'; // Default color if magnitude is undefined
  
  // Enhanced color scale with more granular differentiation
  if (magnitude >= 8) return '#FF0000';      // Pure Red (Severe)
  if (magnitude >= 7) return '#FF3300';      // Red-Orange (Major)
  if (magnitude >= 6.5) return '#FF6600';    // Orange (Strong+)
  if (magnitude >= 6) return '#FF9900';      // Dark Orange (Strong)
  if (magnitude >= 5.5) return '#FFCC00';    // Dark Yellow (Moderate+)
  if (magnitude >= 5) return '#FFFF00';      // Yellow (Moderate)
  if (magnitude >= 4.5) return '#CCFF00';    // Yellow-Green (Light+)
  return '#00FF00';                          // Green (Light)
}
function drawCountryBorders() {
  const globeRadius = Globe.getGlobeRadius();
  const borderGroup = new Group();

  countries.features.forEach((feature) => {
    const { geometry } = feature;
    if (geometry.type === "Polygon") {
      drawPolygon(geometry.coordinates, borderGroup);
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => drawPolygon(polygon, borderGroup));
    }
  });

  function drawPolygon(coordinates, group) {
    coordinates.forEach((ring) => {
      const points = ring.map(([lon, lat]) =>
        convertLatLonToXYZ(lat, lon, globeRadius + 0.1)
      );
      const borderGeometry = new BufferGeometry().setFromPoints(points);
      const borderMaterial = new LineBasicMaterial({
        color: 0xffffff,
        linewidth: 0.1,
        transparent: true,
        opacity: 0.9,
      });
      const borderLine = new LineLoop(borderGeometry, borderMaterial);
      group.add(borderLine);
    });
  }

  return borderGroup;
}
function addCountryLabels() {
// add a country label above each selected country to display basic information about them
  const globeRadius = Globe.getGlobeRadius() + 0.5;

  countries.features.forEach((feature) => {
    const { COUNTRY_NAME } = feature.properties;
    const [minLon, minLat, maxLon, maxLat] = feature.bbox;
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const position = convertLatLonToXYZ(centerLat, centerLon, globeRadius);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    canvas.countryName = COUNTRY_NAME; // Store country name in canvas

    context.font = "Bold 24px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.fillText(COUNTRY_NAME, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    const spriteMaterial = new SpriteMaterial({ map: texture, transparent: true });
    const sprite = new Sprite(spriteMaterial);

    sprite.position.copy(position);
    sprite.scale.set(10, 5, 1);
    globeGroup.add(sprite);
  });
}
function shootingStars() {
  const globeRadius = 100;
  const maxDistance = 1500;

  function createShootingStar() {
    const startDistance = Math.random() * (maxDistance - globeRadius) + globeRadius * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    const start = new Vector3(
      startDistance * Math.sin(phi) * Math.cos(theta),
      startDistance * Math.sin(phi) * Math.sin(theta),
      startDistance * Math.cos(phi)
    );

    const direction = new Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();

    const starHeadGeometry = new SphereGeometry(1, 12, 12);
    const starHeadMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const starHead = new Mesh(starHeadGeometry, starHeadMaterial);
    starHead.position.copy(start);
    scene.add(starHead);

    const tailLength = 200;
    const tailGeometry = new CylinderGeometry(0.2, 0.5, tailLength, 8, 1, true);
    const tailMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });
    const tail = new Mesh(tailGeometry, tailMaterial);
    tail.position.copy(start);
    tail.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
    scene.add(tail);

    const duration = Math.random() * 2000 + 1000;
    const startTime = Date.now();

    function animateStar() {
      const elapsed = Date.now() - startTime;

      if (elapsed < duration) {
        const progress = elapsed / duration;
        const currentPosition = start.clone().add(direction.clone().multiplyScalar(progress * maxDistance));
        starHead.position.copy(currentPosition);

        tail.position.copy(currentPosition.clone().add(direction.clone().multiplyScalar(-tailLength / 2)));
        tail.scale.y = 1 - progress;
        tailMaterial.opacity = 0.3 * (1 - progress);

        requestAnimationFrame(animateStar);
      } else {
        scene.remove(starHead);
        scene.remove(tail);
      }
    }

    animateStar();
  }

  setInterval(() => {
    createShootingStar();
  }, Math.random() * 2000 + 1000);
}
function prepareAmbientMusic() {
  try {
    audio = new Audio(spaceMusic);
    audio.loop = true;
    audio.volume = 0.3;

    window.addEventListener("click", playMusic);
    window.addEventListener("keydown", playMusic);
  } catch (error) {
    console.warn("Audio file not found or invalid, skipping ambient music:", error);
    audio = null;
  }
}
function playMusic() {
  if (!audioPlayed && audio) {
    audio.play().then(() => {
      audioPlayed = true;
      console.log("Ambient music is now playing.");
    }).catch((err) => {
      console.warn("Failed to play audio:", err);
    });
  }
}
function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function onMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}
function initSun() {
  // Create the sun and add it to the scene
  sun = Sun.createSun(scene);
  
  // Add UI control for sun wavelength selection
  addSunWavelengthSelector();
}

// Add UI control for selecting SDO wavelength
function addSunWavelengthSelector() {
  const wavelengthContainer = document.createElement('div');
  wavelengthContainer.style.position = 'absolute';
  wavelengthContainer.style.bottom = '50px';
  wavelengthContainer.style.left = '100px';
  wavelengthContainer.style.padding = '8px';
  wavelengthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  wavelengthContainer.style.borderRadius = '4px';
  wavelengthContainer.style.zIndex = '1000';
  wavelengthContainer.style.display = 'flex';
  wavelengthContainer.style.flexDirection = 'column';
  wavelengthContainer.style.gap = '5px';
  
  // Label for the wavelength selector
  const wavelengthLabel = document.createElement('div');
  wavelengthLabel.textContent = 'SDO Wavelength:';
  wavelengthLabel.style.color = 'white';
  wavelengthLabel.style.fontWeight = 'bold';
  wavelengthLabel.style.fontSize = '12px';
  wavelengthLabel.style.marginBottom = '5px';
  
  // Select element for wavelength options
  const wavelengthSelect = document.createElement('select');
  wavelengthSelect.style.padding = '4px';
  wavelengthSelect.style.backgroundColor = '#333';
  wavelengthSelect.style.color = 'white';
  wavelengthSelect.style.border = '1px solid #555';
  wavelengthSelect.style.borderRadius = '3px';
  wavelengthSelect.style.cursor = 'pointer';
  
  // Add wavelength options
  const wavelengths = [
    { value: '304', label: '304Å - Chromosphere (Red)' },
    { value: '171', label: '171Å - Corona (Gold)' },
    { value: '193', label: '193Å - Corona (Green)' },
    { value: '211', label: '211Å - Corona (Purple)' },
    { value: '131', label: '131Å - Flares (Blue)' },
    { value: '335', label: '335Å - Active Regions (Blue)' },
    { value: '094', label: '94Å - Solar Flares (Green)' },
    { value: '1600', label: '1600Å - Photosphere/Transition Region' },
    { value: '1700', label: '1700Å - Temperature Minimum (Pink)' }
  ];
  
  wavelengths.forEach(wl => {
    const option = document.createElement('option');
    option.value = wl.value;
    option.textContent = wl.label;
    wavelengthSelect.appendChild(option);
  });
  
  // Event listener for wavelength changes
  wavelengthSelect.addEventListener('change', (event) => {
    if (sun) {
      const selectedWavelength = event.target.value;
      Sun.changeSunWavelength(sun, selectedWavelength);
    }
  });
  
  // Add info icon and tooltip for educational context
  const infoContainer = document.createElement('div');
  infoContainer.style.display = 'flex';
  infoContainer.style.alignItems = 'center';
  infoContainer.style.marginTop = '5px';
  
  const infoIcon = document.createElement('span');
  infoIcon.innerHTML = '&#9432;'; // Information icon
  infoIcon.style.color = '#3498db';
  infoIcon.style.marginRight = '5px';
  infoIcon.style.cursor = 'pointer';
  infoIcon.style.fontSize = '14px';
  
  const infoText = document.createElement('span');
  infoText.textContent = 'Real-time Solar Dynamics Observatory imagery';
  infoText.style.color = '#aaa';
  infoText.style.fontSize = '11px';
  
  // Add tooltip showing what SDO wavelengths mean
  infoIcon.addEventListener('mouseover', () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'sdo-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '120px';
    tooltip.style.left = '100px';
    tooltip.style.width = '250px';
    tooltip.style.padding = '10px';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1010';
    tooltip.style.lineHeight = '1.4';
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">NASA's Solar Dynamics Observatory (SDO)</div>
      <div style="margin-bottom: 8px;">Different wavelengths reveal different layers of the Sun:</div>
      <div style="margin-bottom: 4px;"><span style="color: #ff9e9e;">304Å</span> - Chromosphere and transition region</div>
      <div style="margin-bottom: 4px;"><span style="color: #ffd700;">171Å</span> - Quiet corona, upper transition region</div>
      <div style="margin-bottom: 4px;"><span style="color: #a1ffa1;">193Å</span> - Corona/hot flare plasma</div>
      <div style="margin-bottom: 4px;"><span style="color: #c991ff;">211Å</span> - Active region corona</div>
      <div style="margin-bottom: 8px;"><span style="color: #80c1ff;">131Å</span> - Flaring regions of the corona</div>
      <div style="font-style: italic; font-size: 11px;">Images update automatically every 10 minutes</div>
    `;
    
    document.body.appendChild(tooltip);
  });
  
  infoIcon.addEventListener('mouseout', () => {
    const tooltip = document.getElementById('sdo-tooltip');
    if (tooltip) {
      document.body.removeChild(tooltip);
    }
  });
  
  infoContainer.appendChild(infoIcon);
  infoContainer.appendChild(infoText);
  
  // Add elements to container
  wavelengthContainer.appendChild(wavelengthLabel);
  wavelengthContainer.appendChild(wavelengthSelect);
  wavelengthContainer.appendChild(infoContainer);
  
  // Only show when sun is visible and in focus
  wavelengthContainer.style.display = 'none';
  wavelengthContainer.id = 'wavelength-selector';
  
  document.body.appendChild(wavelengthContainer);
}
function initMoon() {
  // Get the Earth globe radius for proper scaling
  const globeRadius = Globe.getGlobeRadius();
  
  // Create the moon and add it to the scene
  moon = Moon.createMoon(scene, globeRadius);
}
function initMercury() {
  // Create Mercury and add it to the scene
  mercury = createMercury(scene, sun);
}

function initVenus() {
  // Create Venus and add it to the scene
  venus = createVenus(scene, sun);
}

function initMars() {
  // Create Mars and add it to the scene
  mars = createMars(scene, sun);
}

// Initialize the asteroid belt
let asteroidBelt; // Global reference to asteroid belt
function initAsteroidBelt() {
  // Create asteroid belt and add it to the scene
  asteroidBelt = createAsteroidBelt(scene, sun);
}

// Initialize Jupiter
function initJupiter() {
  // Create Jupiter and add it to the scene
  jupiter = createJupiter(scene, sun);
}

// Initialize Saturn
function initSaturn() {
  // Create Saturn and add it to the scene
  saturn = createSaturn(scene, sun);
}

// Initialize Uranus
function initUranus() {
  uranus = createUranus(scene, sun);
}

// Initialize Neptune
function initNeptune() {
  neptune = createNeptune(scene, sun);
}

function animate() {
  const deltaTime = clock.getDelta(); // Get time since last frame
  
  // Update Earth's position around the Sun if both exist and orbiting is enabled
  if (sun && globeGroup && isEarthOrbiting) {
    Sun.updateEarthPosition(globeGroup, sun, deltaTime, moon);
  }
  
  if (isGlobeRotating) {
    globeGroup.rotation.y += 0.002; // Rotate the globe only if the flag is true
  }
  
  // Update moon position if it exists and orbiting is enabled
  if (moon && isMoonOrbiting) {
    Moon.updateMoonPosition(moon, globeGroup, deltaTime);
  }
  
  // Update Mercury's position around the Sun
  if (mercury && sun) {
    updateMercuryPosition(mercury, sun, deltaTime);
  }
  
  // Update Venus's position around the Sun
  if (venus && sun) {
    updateVenusPosition(venus, sun, deltaTime);
  }
  
  // Update Mars's position around the Sun
  if (mars && sun) {
    updateMarsPosition(mars, sun, deltaTime);
  }
  
  // Update Jupiter's position around the Sun
  if (jupiter && sun) {
    updateJupiterPosition(jupiter, sun, deltaTime);
  }
  
  // Update Saturn's position around the Sun
  if (saturn && sun) {
    updateSaturnPosition(saturn, sun, deltaTime);
  }

  // Update Uranus's position around the Sun
  if (uranus && sun) {
    updateUranusPosition(uranus, sun, deltaTime);
  }

  // Update Neptune's position around the Sun
  if (neptune && sun) {
    updateNeptunePosition(neptune, sun, deltaTime);
  }

  // Update asteroid belt if it exists
  if (asteroidBelt) {
    updateAsteroidBelt(asteroidBelt, deltaTime);
  }


  // Update LRO position if it exists
  scene.traverse((object) => {
    if (object.userData && object.userData.isLRO && moon) {
      // Use the imported LunarOrbiter module
      LunarOrbiter.updateLROPosition(object, moon, deltaTime);
    }
  });
  
  // Update camera to follow moving objects when in focus
  updateCameraForMovingObjects();
  
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
function updateCameraForMovingObjects() {
  if (!cameraFocus || !controls.enabled) return;
  
  // Get current target position and ensure it's a Vector3
  const currentTarget = controls.target.clone(); // Clone to ensure we have a Vector3
  
  // Get current distance from camera to target
  const currentDistance = camera.position.distanceTo(currentTarget);
  
  // Get target position based on focus
  let targetPosition;
  
  if (cameraFocus === 'earth' && globeGroup) {
    targetPosition = globeGroup.position.clone();
  } else if (cameraFocus === 'moon' && moon) {
    targetPosition = moon.position.clone();
  } else if (cameraFocus === 'sun' && sun) {
    targetPosition = sun.position.clone();
  } else if (cameraFocus === 'mercury' && mercury) {
    targetPosition = mercury.position.clone();
  } else if (cameraFocus === 'venus' && venus) {
    targetPosition = venus.position.clone();
  } else if (cameraFocus === 'mars' && mars) {
    targetPosition = mars.position.clone();
  } else if (cameraFocus === 'jupiter' && jupiter) {
    targetPosition = jupiter.position.clone();
  } else if (cameraFocus === 'saturn' && saturn) {
    targetPosition = saturn.position.clone();
    // Additional special handling for Saturn to ensure we're focusing on the planet center
    // and not getting distracted by its rings
    if (controls.target.distanceTo(targetPosition) > 0.1) {
      controls.target.lerp(targetPosition, 0.1);
    }
  } else if (cameraFocus === 'asteroidbelt' && asteroidBelt) {
    targetPosition = sun.position.clone(); // Asteroid belt is centered around the sun
  } else if (cameraFocus === 'uranus' && uranus) {
    targetPosition = uranus.position.clone();
  } else if (cameraFocus === 'neptune' && neptune) {
    targetPosition = neptune.position.clone();
  }
  
  if (targetPosition) {
    // Update controls target to follow the object
    controls.target.copy(targetPosition);
    
    // Get the direction from target to camera (normalized)
    const cameraDirection = new Vector3().subVectors(camera.position, currentTarget).normalize();
    
    // Calculate new camera position with fixed distances for specific objects
    let newDistance;
    
    // Allow user to control the zoom and positioning for Earth and Moon
    if (cameraFocus === 'moon' || cameraFocus === 'earth') {
      // For Earth and Moon, allow free navigation with the mouse
      // Only update the target position, not the camera distance
      controls.target.copy(targetPosition);
      
      // Get last user-controlled distance
      const userControlledDistance = camera.position.distanceTo(targetPosition);
      
      // Only apply a very gentle camera adjustment to follow the object
      // This keeps the object in view without restricting mouse control
      const gentleAdjustment = 0.015; // Very small adjustment factor
      camera.position.lerp(
        targetPosition.clone().add(cameraDirection.multiplyScalar(userControlledDistance)), 
        gentleAdjustment
      );
    } else {
      // For other objects, maintain fixed distances or current distance
      newDistance = currentDistance;
      
      const newCameraPosition = targetPosition.clone().add(cameraDirection.multiplyScalar(newDistance));
      
      // Smoothly adjust camera position (reduced lerp factor for smoother movement)
      camera.position.lerp(newCameraPosition, 0.03);
    }
    
    // Ensure camera is always looking at the target
    camera.lookAt(targetPosition);
  }
}
function createButtons() {
  // Create Hamburger Menu
  const hamburgerMenu = document.createElement("div");
  hamburgerMenu.style.position = "absolute";
  hamburgerMenu.style.top = "20px";
  hamburgerMenu.style.left = "20px";
  hamburgerMenu.style.zIndex = "1000";
  hamburgerMenu.style.cursor = "pointer";
  hamburgerMenu.innerHTML = `
    <div style="width: 25px; height: 3px; background-color: #ffffff; margin: 5px 0; transition: 0.4s;"></div>
    <div style="width: 25px; height: 3px; background-color: #ffffff; margin: 5px 0; transition: 0.4s;"></div>
    <div style="width: 25px; height: 3px; background-color: #ffffff; margin: 5px 0; transition: 0.4s;"></div>
  `;
  document.body.appendChild(hamburgerMenu);

  // Create Menu Content
  const menuContent = document.createElement("div");
  menuContent.style.position = "absolute";
  menuContent.style.top = "60px";
  menuContent.style.left = "20px";
  menuContent.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  menuContent.style.borderRadius = "5px";
  menuContent.style.padding = "10px";
  menuContent.style.display = "none";
  menuContent.style.flexDirection = "column";
  menuContent.style.gap = "10px";
  menuContent.style.zIndex = "1000";
  menuContent.style.border = "1px solid rgba(255, 255, 255, 0.3)";
  document.body.appendChild(menuContent);

  // Add close button to main menu
  const menuCloseButton = document.createElement("button");
  menuCloseButton.innerHTML = "&times;";
  menuCloseButton.style.position = "absolute";
  menuCloseButton.style.top = "5px";
  menuCloseButton.style.right = "5px";
  menuCloseButton.style.width = "20px";
  menuCloseButton.style.height = "20px";
  menuCloseButton.style.border = "none";
  menuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  menuCloseButton.style.color = "#ffffff";
  menuCloseButton.style.borderRadius = "50%";
  menuCloseButton.style.cursor = "pointer";
  menuCloseButton.style.fontSize = "14px";
  menuCloseButton.style.display = "flex";
  menuCloseButton.style.alignItems = "center";
  menuCloseButton.style.justifyContent = "center";
  menuCloseButton.style.transition = "background-color 0.3s ease";
  
  menuCloseButton.addEventListener("mouseover", () => {
    menuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
  });
  
  menuCloseButton.addEventListener("mouseout", () => {
    menuCloseButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });
  
  menuCloseButton.addEventListener("click", (e) => {
    e.stopPropagation();
    menuContent.style.display = "none";
  });
  
  menuContent.appendChild(menuCloseButton);

  // Create Button 4 (Earthquake Data) - NEW BUTTON
  const earthquakeButton = document.createElement("button");
  earthquakeButton.innerText = "Earthquake Data";
  earthquakeButton.style.padding = "10px 20px";
  earthquakeButton.style.fontSize = "16px";
  earthquakeButton.style.backgroundColor = "#0c529c";
  earthquakeButton.style.color = "#ffffff";
  earthquakeButton.style.border = "none";
  earthquakeButton.style.borderRadius = "5px";
  earthquakeButton.style.cursor = "pointer";
  menuContent.appendChild(earthquakeButton);

  // Create Astronaut Tools button
  const astronautButton = document.createElement("button");
  astronautButton.innerText = "Astronaut Tools";
  astronautButton.style.padding = "10px 20px";
  astronautButton.style.fontSize = "16px";
  astronautButton.style.backgroundColor = "#0c529c";
  astronautButton.style.color = "#ffffff";
  astronautButton.style.border = "none";
  astronautButton.style.borderRadius = "5px";
  astronautButton.style.cursor = "pointer";
  menuContent.appendChild(astronautButton);

  astronautButton.addEventListener("click", () => {
    // Stop any current animations and clear text
    stopCurrentAnimation();
    stopCurrentTypeWriter();
    // Clear any existing globe visualizations
    Globe.arcsData([]);
    AstronautTools.clearDebrisAndOrbits(globeGroup);
    // Show the astronaut tools menu
    AstronautTools.showAstronautToolsMenu(scene, Globe, globeGroup, camera);
    // Hide the main menu once astronaut tools are opened
    menuContent.style.display = "none";
    console.log("Astronaut Tools menu initialized");
  });

  // Create Reset Button (keep at the end)
  const resetButton = document.createElement("button");
  resetButton.innerText = "Reset";
  resetButton.style.padding = "10px 20px";
  resetButton.style.fontSize = "16px";
  resetButton.style.backgroundColor = "#ff4d4d";
  resetButton.style.color = "#ffffff";
  resetButton.style.border = "none";
  resetButton.style.borderRadius = "5px";
  resetButton.style.cursor = "pointer";
  menuContent.appendChild(resetButton);

  // Add event listener for Earthquake Button
  earthquakeButton.addEventListener("click", () => {
    stopCurrentAnimation();
    stopCurrentTypeWriter();
    Globe.arcsData([]); // Clear existing arcs
    AstronautTools.clearDebrisAndOrbits(globeGroup); // Clear any existing visualizations
    
    // Set camera focus to Earth but we'll use our custom zoom instead of switchCameraFocus
    cameraFocus = 'earth';
    updateFocusButtonsUI();
    
    // Store original function and reset camera position to ensure direct path
    let originalUpdateFunction = updateCameraForMovingObjects;
    updateCameraForMovingObjects = function() {}; // Replace with empty function
    
    // Position camera directly behind the Earth for a clean starting point
    camera.position.set(0, 0, 400);
    
    // Force disable auto-rotation for better viewing
    controls.autoRotate = false;
    
    // Keep orbit controls enabled for manual rotation with mouse
    controls.enabled = true;
    
    // Stop automatic globe rotation for better focus on earthquakes
    isGlobeRotating = false;
    
    // Store the current Earth orbiting state and pause Earth's revolution around the Sun
    let originalEarthOrbitingState = isEarthOrbiting;
    isEarthOrbiting = false;
    
    // Adjust camera to get a nice Earth-centered view
    const zoomToEarth = () => {
      // Set specific camera position for optimal earthquake viewing
      const targetPosition = new Vector3(0, 0, 180); // Not too close, not too far
      const lookAtPosition = new Vector3(0, 0, 0);   // Look at Earth's center
      
      // Make sure controls target is also centered on Earth
      controls.target.set(0, 0, 0);
      
      // Animate directly to the new position
      const startPosition = camera.position.clone();
      const duration = 1.5; // Shorter duration for more direct movement
      const startTime = Date.now();
      
      function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Simple smooth easing function
        const easeProgress = Math.sin(progress * Math.PI / 2); // Smoother acceleration
        
        // Update camera position with direct path
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        camera.lookAt(lookAtPosition);
        
        // Continue animation until complete
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          // Once camera movement is complete, restore the updateCameraForMovingObjects function
          // but modify it to maintain our close position
          updateCameraForMovingObjects = function() {
            if (cameraFocus === 'earth' && globeGroup) {
              // Keep the camera target on Earth
              controls.target.copy(globeGroup.position);
              
              // Don't override the camera position when in earthquake mode
              // This allows the user to freely rotate and move the camera with mouse controls
              // We'll just make sure the target stays centered on Earth
              
              // Only constrain the distance, don't force the exact camera position
              const currentDistance = camera.position.distanceTo(controls.target);
              
              // If the distance is significantly different than our desired value, adjust it gently
              if (Math.abs(currentDistance - 180) > 50) {
                const currentDirection = new Vector3().subVectors(camera.position, controls.target).normalize();
                const newCameraPosition = controls.target.clone().add(currentDirection.multiplyScalar(180));
                camera.position.lerp(newCameraPosition, 0.01); // Very gentle adjustment
              }
            } else {
              // For other targets, restore original behavior
              originalUpdateFunction();
            }
          };
          
          // Once camera movement is complete, add earthquake visualization
          addEarthquakeVisualization();
        }
      }
      
      // Start the camera animation
      animateCamera();
    };
    
    // Begin the camera movement
    zoomToEarth();
    
    menuContent.style.display = "none"; // Close menu after click
  });

  resetButton.addEventListener("click", () => {
    window.location.reload(); // Refresh the page
    menuContent.style.display = "none"; // Close menu after click
  });

  // Toggle menu on hamburger click
  hamburgerMenu.addEventListener("click", () => {
    menuContent.style.display = menuContent.style.display === "flex" ? "none" : "flex";
  });
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
  });
} else {
  // DOM is already loaded
  init();
  animate();
}

// Switch camera focus function
function switchCameraFocus(target, duration = 1.5) {
  if (!target) return;
  
  // Store the target for use in updateCameraForMovingObjects
  cameraFocus = target.toLowerCase();
  console.log(`Switching camera focus to: ${cameraFocus}`);
  
  // Update UI to reflect the new focus
  updateFocusButtonsUI();

  // If we're switching away from Earth (earthquake mode), resume Earth's orbit and clean up
  if (cameraFocus === 'earth' && target.toLowerCase() !== 'earth') {
    // Resume Earth's orbit when leaving Earth focus (exiting earthquake mode)
    isEarthOrbiting = true;
    
    // Clear earthquake visualization dots/points
    Globe.pointsData([]);
    
    // Remove earthquake info panel if it exists
    const earthquakePanel = document.getElementById('earthquake-info-panel');
    if (earthquakePanel) {
      earthquakePanel.remove();
    }
  }
  
  // Special handling for LRO and Moon focus
  // We don't manage the orbital states here as that's now handled in the LRO button directly
  // This allows other tools/functions to focus on the moon without affecting orbits

  let targetObject, targetPosition, lookAtPosition;
  
  // Determine target based on celestial body
  switch (cameraFocus) {
    case 'earth':
      targetObject = globeGroup;
      lookAtPosition = new Vector3(0, 0, 0);
      break;
    case 'moon':
      // Find the moon object
      targetObject = moon;
      break;
    case 'sun':
      targetObject = sun;
      break;
    case 'mercury':
      targetObject = mercury;
      break;
    case 'venus':
      targetObject = venus;
      break;
    case 'mars':
      targetObject = mars;
      break;
    case 'jupiter':
      targetObject = jupiter;
      break;
    case 'saturn':
      targetObject = saturn;
      break;
    case 'uranus':
      targetObject = uranus;
      break;
    case 'neptune':
      targetObject = neptune;
      break;
    case 'asteroidbelt':
      // For asteroid belt, use a position near Jupiter/Mars
      targetPosition = new Vector3(0, 0, -3000);
      lookAtPosition = new Vector3(0, 0, 0);
      break;
    default:
      console.warn(`Unknown target: ${target}`);
      return;
  }

  // If we have a target object, get its position
  if (targetObject) {
    // Get position of the target object
    targetPosition = new Vector3();
    targetObject.getWorldPosition(targetPosition);
    
    // Set lookAtPosition to the same as targetPosition
    lookAtPosition = targetPosition.clone();
    
    // Determine appropriate viewing distance based on object size
    let viewDistance;
    if (targetObject === moon) {
      viewDistance = moon.geometry.parameters.radius * 3; // 3x moon radius - balanced zoom for detail and navigation
    } else if (targetObject === sun) {
      viewDistance = 1000; // Sun is large, view from further away
    } else if (targetObject === globeGroup) {
      viewDistance = 400; // Standard Earth viewing distance
    } else {
      // For other planets, estimate based on their geometry if available
      viewDistance = targetObject.geometry?.parameters?.radius 
        ? targetObject.geometry.parameters.radius * 3.5 // Closer zoom for all planets
        : 500; // Default distance
    }
    
    // Calculate a position that's "viewDistance" away from the target in the direction from origin to target
    const directionToTarget = targetPosition.clone().normalize();
    
    // Create a position offset from the target
    // Use an offset direction based on the camera's current position
    const cameraOffsetDir = new Vector3().subVectors(camera.position, targetPosition).normalize();
    
    // Calculate final camera position
    targetPosition = targetPosition.clone().add(cameraOffsetDir.multiplyScalar(viewDistance));
    
    // Make sure controls target is updated for proper orbiting
    controls.target.copy(lookAtPosition);
  }
  
  console.log(`Moving camera to position: ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`);
  console.log(`Looking at position: ${lookAtPosition.x}, ${lookAtPosition.y}, ${lookAtPosition.z}`);
  
  // Animate camera transition
  const startPosition = camera.position.clone();
  const startTime = Date.now();

  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / (duration * 1000), 1);

    // Enhanced ease-in-out function for smoother transitions
    // Using a cubic bezier curve approximation for more natural movement
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Update camera position
    camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
    
    // Look at the target
    camera.lookAt(lookAtPosition);

    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      // After animation completes, ensure the controls are looking at the correct target
      controls.target.copy(lookAtPosition);
      
      // Set appropriate min/max distance constraints based on the object
      if (cameraFocus === 'moon' && moon) {
        const moonRadius = moon.geometry.parameters.radius;
        // Wider range for Moon to allow better user navigation
        controls.minDistance = moonRadius * 1.2; // Allow closer view
        controls.maxDistance = moonRadius * 10.0; // Allow zooming out significantly to see context
        // Enable Earth-like navigation for the Moon
        controls.enableDamping = false;
        controls.enableZoom = true;
        controls.autoRotate = false;
        controls.rotateSpeed = 0.8; // Same as Earth rotation speed
      } else {
        // Reset to default min/max distances for other objects
        controls.minDistance = 115;
        controls.maxDistance = 50000;
      }
      
      controls.update();
    }
  }

  animateCamera();
}

// Enhanced function to visualize earthquake data using ThreeGlobe's ripple effect
async function addEarthquakeVisualization() {
  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'absolute';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.borderRadius = '10px';
    loadingDiv.style.zIndex = '2000';
    loadingDiv.style.fontFamily = "'Montserrat', sans-serif";
    loadingDiv.innerHTML = '<div>🌍 Loading earthquake data...</div>';
    loadingDiv.id = 'earthquake-loading';
    document.body.appendChild(loadingDiv);

    // Fetch earthquake data from USGS API - significant earthquakes (all magnitudes, past month)
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson');
    const earthquakeData = await response.json();

    // Also fetch larger dataset with 4.5+ magnitude quakes for more comprehensive visualization (past week)
    const additionalResponse = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson');
    const additionalData = await additionalResponse.json();
    
    // Combine datasets, removing duplicates
    const combinedFeatures = [...earthquakeData.features];
    const existingIds = new Set(combinedFeatures.map(f => f.id));
    
    additionalData.features.forEach(feature => {
      if (!existingIds.has(feature.id)) {
        combinedFeatures.push(feature);
      }
    });

    // Remove loading indicator
    const loading = document.getElementById('earthquake-loading');
    if (loading) {
      document.body.removeChild(loading);
    }

    // Process earthquake data for ripple visualization
    const rippleData = combinedFeatures.map(feature => {
      const coords = feature.geometry.coordinates;
      const magnitude = feature.properties.mag;
      const place = feature.properties.place;
      const time = new Date(feature.properties.time);
      const depth = coords[2];
      const title = feature.properties.title;
      const url = feature.properties.url;
      const tsunami = feature.properties.tsunami;
      
      // Calculate ripple properties based on earthquake magnitude
      // Enhanced calculation for better visual differentiation and more concise ripples
      const maxRadius = Math.min(20, magnitude * 2.5); // Reduced radius for more concise visualization
      
      // Faster propagation for stronger quakes but still visible for smaller ones
      const propagationSpeed = Math.min(magnitude * 1.2, 6);
      
      // Reduced repeat periods to make origins more visible
      const repeatPeriod = Math.max(1200, 800 * (9 - magnitude));
      
      // Calculate ripple altitude based on magnitude for a 3D effect
      const altitude = 0.005 + (magnitude >= 6 ? 0.005 : 0);
      
      // Add a small permanent "dot" at the epicenter
      const epicenterSize = Math.max(0.2, magnitude * 0.1); // Size based on magnitude
      
      return {
        lat: coords[1],
        lng: coords[0],
        maxR: maxRadius,
        propagationSpeed: propagationSpeed,
        repeatPeriod: repeatPeriod,
        color: getQuakeColor(magnitude),
        altitude: altitude, // Add altitude for 3D effect
        startRadius: 0.5, // Add starting radius so rings don't start from a single point
        // Store additional metadata for the info panel
        magnitude: magnitude,
        place: place,
        time: time,
        depth: depth,
        title: title,
        url: url,
        tsunami: tsunami ? true : false,
        epicenterSize: epicenterSize // Store for potential epicenter marker
      };
    });

    // Apply enhanced ripple effect to the globe with more concise rings
    // First, add markers at epicenters for better visibility of origins
    const epicenters = rippleData.map(quake => ({
      lat: quake.lat,
      lng: quake.lng,
      size: quake.epicenterSize,
      color: quake.color,
      altitude: quake.altitude
    }));
    
    // Apply ripple effect with modified parameters for more concise rings
    Globe
      .ringsData(rippleData)
      .ringColor('color')
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod')
      .ringAltitude('altitude')
      // Add small permanent points at epicenters
      .pointsData(epicenters)
      .pointColor('color')
      .pointAltitude('altitude')
      .pointRadius('size');

    // Create enhanced information panel for earthquakes
    createEarthquakeInfoPanel(rippleData);

    console.log(`Loaded ${rippleData.length} earthquake events with enhanced ripple visualization`);

  } catch (error) {
    console.error('Error loading earthquake data:', error);

    // Remove loading indicator if there's an error
    const loading = document.getElementById('earthquake-loading');
    if (loading) {
      document.body.removeChild(loading);
    }

    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '10px';
    errorDiv.style.zIndex = '2000';
    errorDiv.style.fontFamily = "'Montserrat', sans-serif";
    errorDiv.innerHTML = '<div>❌ Failed to load earthquake data. Please check your internet connection.</div>';
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 3000);
  }
}

// Create an enhanced informational panel explaining earthquake visualization with color coding and details
function createEarthquakeInfoPanel(earthquakeData) {
  // Remove existing panel if any
  const existingPanel = document.getElementById('earthquake-info-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Create panel container with improved styling
  const panel = document.createElement('div');
  panel.id = 'earthquake-info-panel';
  Object.assign(panel.style, {
    position: 'absolute',
    bottom: '30px',
    right: '30px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly darker for better readability
    color: 'white',
    padding: '20px',
    borderRadius: '12px',
    fontFamily: "'Montserrat', sans-serif",
    maxWidth: '380px',
    maxHeight: '75vh',
    overflowY: 'auto',
    zIndex: '1000',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 255, 0.4)',
    backdropFilter: 'blur(5px)' // Modern blur effect for better UI
  });
  
  // Create header with improved styling
  const header = document.createElement('div');
  header.innerHTML = `<h3 style="margin-top:0;color:#4a90e2;display:flex;align-items:center;font-size:18px;">
    <span style="margin-right:10px;">🌊</span> Global Earthquake Visualization
  </h3>`;
  panel.appendChild(header);
  
  // Add enhanced explanation text with more details
  const explanation = document.createElement('div');
  explanation.style.marginBottom = '18px';
  explanation.style.lineHeight = '1.5';
  explanation.style.fontSize = '14px';
  explanation.innerHTML = `
    <p>This visualization shows recent earthquakes as ripple effects on the globe. Each ripple represents seismic waves propagating from earthquake epicenters, with properties that correspond to real-world data:</p>
    
    <div style="background-color:rgba(255,255,255,0.1);border-radius:8px;padding:12px;margin:10px 0;">
      <p style="margin-top:0;"><strong>Visual Elements:</strong></p>
      <ul style="padding-left: 20px; margin: 5px 0;">
        <li><strong>Epicenter Points:</strong> Small dots mark the exact origin of each earthquake</li>
        <li><strong>Ripple Size:</strong> Concise rings proportional to earthquake magnitude</li>
        <li><strong>Ripple Speed:</strong> Stronger quakes have faster propagating waves</li>
        <li><strong>Repeat Rate:</strong> Major quakes pulse more frequently</li>
        <li><strong>Ripple Height:</strong> Major quakes (6+) create slightly elevated ripples</li>
      </ul>
      <p style="margin-top:8px;margin-bottom:0;font-size:12px;font-style:italic;">Click on any earthquake in the list below to center the view on its location.</p>
    </div>
    
    <p><strong>Color Coding by Magnitude:</strong></p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="background-color:#FF0000;color:white;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Severe:</strong> ≥8.0
      </div>
      <div style="background-color:#FF3300;color:white;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Major:</strong> 7.0-7.9
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="background-color:#FF6600;color:white;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Strong+:</strong> 6.5-6.9
      </div>
      <div style="background-color:#FF9900;color:white;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Strong:</strong> 6.0-6.4
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="background-color:#FFCC00;color:black;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Moderate+:</strong> 5.5-5.9
      </div>
      <div style="background-color:#FFFF00;color:black;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Moderate:</strong> 5.0-5.4
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="background-color:#CCFF00;color:black;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Light+:</strong> 4.5-4.9
      </div>
      <div style="background-color:#00FF00;color:black;padding:6px 10px;border-radius:4px;font-size:12px;flex-grow:1;">
        <strong>Light:</strong> <4.5
      </div>
    </div>
    
    <p><em>Data source: USGS Earthquake Hazards Program</em></p>
  `;
  panel.appendChild(explanation);
  
  // Add tabs for different views
  const tabContainer = document.createElement('div');
  tabContainer.style.display = 'flex';
  tabContainer.style.borderBottom = '1px solid #555';
  tabContainer.style.marginBottom = '15px';
  
  const recentTab = document.createElement('div');
  recentTab.innerHTML = 'Recent Events';
  recentTab.style.padding = '8px 15px';
  recentTab.style.cursor = 'pointer';
  recentTab.style.borderBottom = '2px solid #4a90e2';
  recentTab.style.color = '#4a90e2';
  
  const statsTab = document.createElement('div');
  statsTab.innerHTML = 'Statistics';
  statsTab.style.padding = '8px 15px';
  statsTab.style.cursor = 'pointer';
  statsTab.style.opacity = '0.7';
  
  tabContainer.appendChild(recentTab);
  tabContainer.appendChild(statsTab);
  panel.appendChild(tabContainer);
  
  // Create content container for tabs
  const contentContainer = document.createElement('div');
  panel.appendChild(contentContainer);
  
  // Create recent earthquakes list with more details and improved styling
  function showRecentEvents() {
    contentContainer.innerHTML = '';
    
    const recentHeader = document.createElement('div');
    recentHeader.innerHTML = '<h4 style="margin: 10px 0;">Significant Recent Earthquakes</h4>';
    contentContainer.appendChild(recentHeader);
    
    // Sort earthquakes by time (most recent first)
    const sortedEarthquakes = [...earthquakeData].sort((a, b) => b.time - a.time);
    
    // Take only significant earthquakes
    const significantEarthquakes = sortedEarthquakes
      .filter(quake => quake.magnitude >= 5.0)
      .slice(0, 7); // Show more events for better context
    
    const eventsList = document.createElement('div');
    
    if (significantEarthquakes.length === 0) {
      eventsList.innerHTML = '<p style="font-style: italic; color: #aaa;">No significant earthquakes in the recent data.</p>';
    } else {
      significantEarthquakes.forEach(quake => {
        const quakeItem = document.createElement('div');
        quakeItem.style.margin = '10px 0';
        quakeItem.style.padding = '10px';
        quakeItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        quakeItem.style.borderRadius = '8px';
        quakeItem.style.borderLeft = `5px solid ${quake.color}`;
        quakeItem.style.transition = 'transform 0.2s';
        quakeItem.style.cursor = 'pointer';
        
        // Add hover effect
        quakeItem.addEventListener('mouseover', () => {
          quakeItem.style.transform = 'translateX(5px)';
          quakeItem.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });
        
        quakeItem.addEventListener('mouseout', () => {
          quakeItem.style.transform = 'translateX(0)';
          quakeItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        const timeString = quake.time.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        });
        
        // Add tsunami warning icon if applicable
        const tsunamiWarning = quake.tsunami ? 
          '<span title="Tsunami Alert Issued" style="color:#FF5252;margin-left:5px;">🌊</span>' : '';
        
        quakeItem.innerHTML = `
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${quake.place} ${tsunamiWarning}</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); font-size: 12px; margin-top: 5px;">
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${quake.color}; margin-right: 5px;"></span>
              <span style="font-weight: bold;">M${quake.magnitude.toFixed(1)}</span>
            </div>
            <div>Depth: ${quake.depth.toFixed(1)} km</div>
            <div>${timeString}</div>
          </div>
        `;
        
        // Clicking on an earthquake will center the globe view on that location
        quakeItem.addEventListener('click', () => {
          // Animate to earthquake location - smooth transition
          const distanceFromCenter = 400; // Distance from center to position camera
          const targetLatRad = quake.lat * (Math.PI / 180);
          const targetLngRad = -quake.lng * (Math.PI / 180); // Negate for correct orientation
          
          // Calculate camera position based on lat/lng
          const cameraX = distanceFromCenter * Math.cos(targetLatRad) * Math.cos(targetLngRad);
          const cameraY = distanceFromCenter * Math.sin(targetLatRad);
          const cameraZ = distanceFromCenter * Math.cos(targetLatRad) * Math.sin(targetLngRad);
          
          // Set up animation
          const currentPos = camera.position.clone();
          const targetPos = new Vector3(cameraX, cameraY, cameraZ);
          
          // Animate camera movement
          new TWEEN.Tween(currentPos)
            .to(targetPos, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
              camera.position.set(currentPos.x, currentPos.y, currentPos.z);
              camera.lookAt(0, 0, 0);
            })
            .start();
        });
        
        eventsList.appendChild(quakeItem);
      });
      
      // Add note about clicking
      const clickNote = document.createElement('div');
      clickNote.style.fontSize = '12px';
      clickNote.style.fontStyle = 'italic';
      clickNote.style.marginTop = '15px';
      clickNote.style.color = '#aaa';
      clickNote.textContent = 'Click on any earthquake to center the view on its location';
      eventsList.appendChild(clickNote);
    }
    
    contentContainer.appendChild(eventsList);
  }
  
  // Create statistics view
  function showStats() {
    contentContainer.innerHTML = '';
    
    const statsHeader = document.createElement('div');
    statsHeader.innerHTML = '<h4 style="margin: 10px 0;">Earthquake Statistics</h4>';
    contentContainer.appendChild(statsHeader);
    
    const statsContainer = document.createElement('div');
    
    // Calculate basic statistics with our enhanced categories
    const totalQuakes = earthquakeData.length;
    const magnitudeCounts = {
      severe: earthquakeData.filter(q => q.magnitude >= 8.0).length,
      major: earthquakeData.filter(q => q.magnitude >= 7.0 && q.magnitude < 8.0).length,
      strongPlus: earthquakeData.filter(q => q.magnitude >= 6.5 && q.magnitude < 7.0).length,
      strong: earthquakeData.filter(q => q.magnitude >= 6.0 && q.magnitude < 6.5).length,
      moderatePlus: earthquakeData.filter(q => q.magnitude >= 5.5 && q.magnitude < 6.0).length,
      moderate: earthquakeData.filter(q => q.magnitude >= 5.0 && q.magnitude < 5.5).length,
      lightPlus: earthquakeData.filter(q => q.magnitude >= 4.5 && q.magnitude < 5.0).length,
      light: earthquakeData.filter(q => q.magnitude < 4.5).length
    };
    
    // Find maximum magnitude earthquake
    const maxMagQuake = [...earthquakeData].sort((a, b) => b.magnitude - a.magnitude)[0];
    
    statsContainer.innerHTML = `
      <div style="background-color:rgba(255,255,255,0.1);border-radius:8px;padding:15px;margin:10px 0;">
        <div style="margin-bottom:10px;font-size:14px;"><strong>Total Earthquakes:</strong> ${totalQuakes}</div>
        
        <h5 style="margin:15px 0 10px 0;font-size:14px;color:#aaa;">Major Events</h5>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Severe (8.0+):</span>
            <span>${magnitudeCounts.severe}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.severe / totalQuakes) * 100}%;height:100%;background-color:#FF0000;"></div>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Major (7.0-7.9):</span>
            <span>${magnitudeCounts.major}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.major / totalQuakes) * 100}%;height:100%;background-color:#FF3300;"></div>
          </div>
        </div>
        
        <h5 style="margin:15px 0 10px 0;font-size:14px;color:#aaa;">Strong Events</h5>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Strong+ (6.5-6.9):</span>
            <span>${magnitudeCounts.strongPlus}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.strongPlus / totalQuakes) * 100}%;height:100%;background-color:#FF6600;"></div>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Strong (6.0-6.4):</span>
            <span>${magnitudeCounts.strong}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.strong / totalQuakes) * 100}%;height:100%;background-color:#FF9900;"></div>
          </div>
        </div>
        
        <h5 style="margin:15px 0 10px 0;font-size:14px;color:#aaa;">Moderate Events</h5>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Moderate+ (5.5-5.9):</span>
            <span>${magnitudeCounts.moderatePlus}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.moderatePlus / totalQuakes) * 100}%;height:100%;background-color:#FFCC00;"></div>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Moderate (5.0-5.4):</span>
            <span>${magnitudeCounts.moderate}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.moderate / totalQuakes) * 100}%;height:100%;background-color:#FFFF00;"></div>
          </div>
        </div>
        
        <h5 style="margin:15px 0 10px 0;font-size:14px;color:#aaa;">Light Events</h5>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Light+ (4.5-4.9):</span>
            <span>${magnitudeCounts.lightPlus}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.lightPlus / totalQuakes) * 100}%;height:100%;background-color:#CCFF00;"></div>
          </div>
        </div>
        
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>Light (<4.5):</span>
            <span>${magnitudeCounts.light}</span>
          </div>
          <div style="height:8px;background-color:#333;border-radius:4px;overflow:hidden;">
            <div style="width:${(magnitudeCounts.light / totalQuakes) * 100}%;height:100%;background-color:#00FF00;"></div>
          </div>
        </div>
      </div>
      
      ${maxMagQuake ? `
        <div style="margin-top:20px;">
          <div style="font-size:14px;"><strong>Largest Recent Earthquake:</strong></div>
          <div style="background-color:rgba(255,0,0,0.2);border-radius:8px;padding:12px;margin-top:8px;border-left:4px solid #FF0000;">
            <div style="font-weight:bold;">${maxMagQuake.place}</div>
            <div style="margin-top:5px;font-size:12px;">Magnitude: ${maxMagQuake.magnitude.toFixed(1)}</div>
            <div style="margin-top:3px;font-size:12px;">Date: ${maxMagQuake.time.toLocaleDateString()}</div>
          </div>
        </div>
      ` : ''}
    `;
    
    contentContainer.appendChild(statsContainer);
  }
  
  // Set up tab functionality
  recentTab.addEventListener('click', () => {
    recentTab.style.borderBottom = '2px solid #4a90e2';
    recentTab.style.color = '#4a90e2';
    recentTab.style.opacity = '1';
    statsTab.style.borderBottom = 'none';
    statsTab.style.color = 'white';
    statsTab.style.opacity = '0.7';
    showRecentEvents();
  });
  
  statsTab.addEventListener('click', () => {
    statsTab.style.borderBottom = '2px solid #4a90e2';
    statsTab.style.color = '#4a90e2';
    statsTab.style.opacity = '1';
    recentTab.style.borderBottom = 'none';
    recentTab.style.color = 'white';
    recentTab.style.opacity = '0.7';
    showStats();
  });
  
  // Show recent events by default
  showRecentEvents();
  
  // Add minimize/expand button
  const minimizeButton = document.createElement('button');
  minimizeButton.innerHTML = '−';
  minimizeButton.title = 'Minimize panel';
  Object.assign(minimizeButton.style, {
    position: 'absolute',
    top: '10px',
    right: '40px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });
  
  let minimized = false;
  const panelContent = [explanation, tabContainer, contentContainer];
  
  minimizeButton.addEventListener('click', () => {
    if (minimized) {
      // Expand
      minimizeButton.innerHTML = '−';
      minimizeButton.title = 'Minimize panel';
      panel.style.maxHeight = '75vh';
      panelContent.forEach(el => el.style.display = 'block');
      minimized = false;
    } else {
      // Minimize
      minimizeButton.innerHTML = '+';
      minimizeButton.title = 'Expand panel';
      panel.style.maxHeight = 'auto';
      panelContent.forEach(el => el.style.display = 'none');
      minimized = true;
    }
  });
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.title = 'Close panel';
  Object.assign(closeButton.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });
  
  closeButton.addEventListener('click', () => {
    panel.remove();
    
    // Restore Earth's revolution around the Sun when closing the panel
    isEarthOrbiting = true;
    
    // Clear earthquake visualization dots/points
    Globe.pointsData([]);
    
    // Option to restore globe rotation when closing the panel
    const restoreRotationDiv = document.createElement('div');
    restoreRotationDiv.style.position = 'absolute';
    restoreRotationDiv.style.bottom = '30px';
    restoreRotationDiv.style.right = '30px';
    restoreRotationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    restoreRotationDiv.style.color = 'white';
    restoreRotationDiv.style.padding = '10px 15px';
    restoreRotationDiv.style.borderRadius = '8px';
    restoreRotationDiv.style.fontFamily = "'Montserrat', sans-serif";
    restoreRotationDiv.style.fontSize = '14px';
    restoreRotationDiv.style.cursor = 'pointer';
    restoreRotationDiv.style.zIndex = '1000';
    restoreRotationDiv.style.display = 'flex';
    restoreRotationDiv.style.alignItems = 'center';
    restoreRotationDiv.style.gap = '8px';
    restoreRotationDiv.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    restoreRotationDiv.innerHTML = '<span style="font-size:16px;">🌍</span> Restore Normal View';
    restoreRotationDiv.id = 'restore-globe-rotation';
    
    // Add hover effect
    restoreRotationDiv.addEventListener('mouseover', () => {
      restoreRotationDiv.style.backgroundColor = 'rgba(74, 144, 226, 0.7)';
    });
    
    restoreRotationDiv.addEventListener('mouseout', () => {
      restoreRotationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    });
    
    // Restore globe rotation and camera
    restoreRotationDiv.addEventListener('click', () => {
      // Restore rotation
      isGlobeRotating = true;
      
      // Restore Earth's revolution around the Sun
      isEarthOrbiting = true;
      
      // Remove earthquake visualization completely (both points and rings)
      Globe.pointsData([]);
      Globe.ringsData([]);
      
      // Animate camera back to default position
      const defaultPosition = new Vector3(0, 0, 400);
      const startPosition = camera.position.clone();
      const duration = 1.5; // seconds
      const startTime = Date.now();
      
      function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Ease-in-out function for smooth movement
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
        
        // Update camera position
        camera.position.lerpVectors(startPosition, defaultPosition, easeProgress);
        camera.lookAt(0, 0, 0);
        
        // Continue animation until complete
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          restoreRotationDiv.remove();
        }
      }
      
      // Start the camera animation
      animateCamera();
    });
    
    document.body.appendChild(restoreRotationDiv);
  });
  
  panel.appendChild(minimizeButton);
  panel.appendChild(closeButton);
  document.body.appendChild(panel);
  
  // Add fade-in animation
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(20px)';
  panel.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  
  setTimeout(() => {
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }, 100);
}