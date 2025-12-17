// External library imports
import { Vector3, MeshBasicMaterial, SphereGeometry, Mesh, LineBasicMaterial, 
         BufferGeometry, LineLoop, CylinderGeometry, RingGeometry, DoubleSide, 
         SpriteMaterial, Sprite, CanvasTexture } from "three";
import * as satellite from 'satellite.js';
import axios from 'axios';

// Internal component imports
import { clearAstronautTools, clearAstronautToolsPreservePanel } from './clearAstronautTools.js';
import { showISSTracker } from './ISSTracker.js';
import { showRadiationMonitor } from './RadiationMonitor.js';
import { showLunarOrbiterLive } from './LunarOrbiter.js';

const NASA_API_KEY = "jmRRPCUwwWyNaMrXJCNz8HDX8q94wPnQfKz0ig5a";

// ===== HELPER FUNCTIONS =====

/**
 * Convert latitude and longitude to 3D coordinates
 */
const convertLatLonToXYZ = (lat, lon, radius) => {
  const longitudeOffset = -90;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180 + longitudeOffset) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

/**
 * Set up global process object for axios if needed
 */ 
if (typeof window !== 'undefined') {
  window.process = window.process || { env: { NODE_ENV: 'production' } };
}

/**
 * Diagnostic function to check if axios is properly initialized
 */
const diagnoseAxios = () => {
  try {
    // Check if axios is available
    if (!axios) {
      console.error('Axios is not defined');
      return false;
    }
    
    // Check if axios has the necessary methods
    if (!axios.get || !axios.post) {
      console.error('Axios methods are missing');
      return false;
    }
    
    // Check if process is defined for axios
    if (typeof process === 'undefined' || !process || !process.env) {
      console.warn('Process object is not properly defined. Adding polyfill.');
      window.process = window.process || { env: {} };
    }
    
    console.log('Axios is properly initialized');
    return true;
  } catch (error) {
    console.error('Error diagnosing axios:', error);
    return false;
  }
};

// ===== UI HELPER FUNCTIONS =====

/**
 * Show loading indicator with overlay
 */
const showLoadingIndicator = () => {
  // Remove existing loader if it exists
  const existingLoader = document.getElementById("loadingIndicator");
  if (existingLoader) {
    existingLoader.remove();
  }
  
  // Create loading indicator
  const loader = document.createElement("div");
  loader.id = "loadingIndicator";
  
  // Style the loading indicator
  Object.assign(loader.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "4px solid rgba(0, 255, 255, 0.1)",
    borderTopColor: "#00FFFF",
    boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
    animation: "spin 1s linear infinite",
    zIndex: "9999"
  });
  
  // Add keyframes for spinning animation
  if (!document.getElementById("loader-animation")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "loader-animation";
    styleSheet.textContent = `
      @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  document.body.appendChild(loader);
  
  // Add a semi-transparent overlay
  const overlay = document.createElement("div");
  overlay.id = "loaderOverlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: "9998"
  });
  document.body.appendChild(overlay);
};

/**
 * Hide loading indicator and overlay
 */
const hideLoadingIndicator = () => {
  const loader = document.getElementById("loadingIndicator");
  const overlay = document.getElementById("loaderOverlay");
  
  if (loader) loader.remove();
  if (overlay) overlay.remove();
};

/**
 * Create a vertical information panel with close and minimize buttons
 */
const createVerticalButton = () => {
  // Remove existing button if it exists
  const existingButton = document.getElementById("verticalButton");
  if (existingButton) existingButton.remove();

  // Create and style the vertical panel
  const verticalButton = document.createElement("div");
  verticalButton.id = "verticalButton";
  Object.assign(verticalButton.style, {
    position: "absolute",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    width: "280px",
    minHeight: "350px",
    maxHeight: "70vh",
    backgroundColor: "rgba(10, 20, 40, 0.85)",
    borderRadius: "12px",
    border: "1px solid #00FFFF",
    padding: "20px",
    color: "#ffffff",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "14px",
    overflowY: "auto",
    boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
    zIndex: "1100"
  });

  // Create close button
  const closeButton = createPanelButton("&times;", 10, 10);
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    verticalButton.remove();
  });
  
  // Create minimize button
  const minimizeButton = createPanelButton("&#8722;", 10, 35); // minus symbol
  let isMinimized = false;
  const originalHeight = verticalButton.style.minHeight;
  
  minimizeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    isMinimized = !isMinimized;
    
    if (isMinimized) {
      verticalButton.style.minHeight = "50px";
      verticalButton.style.maxHeight = "50px";
      verticalButton.style.overflow = "hidden";
      minimizeButton.innerHTML = "&#43;"; // plus symbol
    } else {
      verticalButton.style.minHeight = originalHeight;
      verticalButton.style.maxHeight = "70vh";
      verticalButton.style.overflow = "auto";
      minimizeButton.innerHTML = "&#8722;"; // minus symbol
    }
  });
  
  // Add buttons to panel
  verticalButton.appendChild(closeButton);
  verticalButton.appendChild(minimizeButton);
  document.body.appendChild(verticalButton);
  return verticalButton;
};

/**
 * Helper function to create panel buttons with consistent styling
 */
function createPanelButton(html, top, right) {
  const button = document.createElement("button");
  button.innerHTML = html;
  
  Object.assign(button.style, {
    position: "absolute",
    top: `${top}px`,
    right: `${right}px`,
    width: "22px",
    height: "22px",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.3s ease",
    zIndex: "1110"
  });
  
  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
  });
  
  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });
  
  return button;
}

/**
 * Main entry point for astronaut tools menu
 */
const showAstronautToolsMenu = (scene, globe, globeGroup, camera) => {
  // Initial setup
  diagnoseAxios();
  clearAstronautTools(globe, globeGroup);
  clearDebrisAndOrbits(globeGroup);
  createVerticalButton();
  
  // Create menu container
  const astronautToolsMenu = createAstronautToolsMenu();
  
  // Add title with close button
  addMenuTitle(astronautToolsMenu, globe, globeGroup);
  
  // Add tool buttons
  addToolButtons(astronautToolsMenu, scene, globe, globeGroup, camera);
};

/**
 * Create the astronaut tools menu container
 */
function createAstronautToolsMenu() {
  const menu = document.createElement("div");
  menu.id = "astronautToolsMenu";
  
  Object.assign(menu.style, {
    position: "absolute",
    top: "50%",
    left: "100px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "10px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    zIndex: "1000",
    maxHeight: "70vh",
    overflowY: "auto"
  });
  
  document.body.appendChild(menu);
  return menu;
}

/**
 * Add title with close button to the menu
 */
function addMenuTitle(menu, globe, globeGroup) {
  const title = document.createElement("h3");
  title.style.color = "#ffffff";
  title.style.margin = "0 0 15px 0";
  title.style.textAlign = "center";
  title.style.fontFamily = "'Montserrat', sans-serif";
  title.style.display = "flex";
  title.style.justifyContent = "space-between";
  title.style.alignItems = "center";
  
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  
  Object.assign(closeButton.style, {
    width: "20px",
    height: "20px",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.3s ease"
  });
  
  // Add hover effects
  closeButton.addEventListener("mouseover", () => {
    closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
  });
  
  closeButton.addEventListener("mouseout", () => {
    closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  });
  
  // Add close behavior
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Clean up
    if (window.currentToolCleanup && typeof window.currentToolCleanup === 'function') {
      window.currentToolCleanup();
    }
    clearAstronautTools(globe, globeGroup);
    
    // Remove UI elements
    menu.remove();
    const verticalButton = document.getElementById("verticalButton");
    if (verticalButton) verticalButton.remove();
  });
  
  const titleText = document.createElement("span");
  titleText.innerText = "Astronaut Tools";
  
  title.appendChild(titleText);
  title.appendChild(closeButton);
  menu.appendChild(title);
}

/**
 * Add tool buttons to the menu
 */
function addToolButtons(menu, scene, globe, globeGroup, camera) {
  // Available tools
  const tools = [
    {
      name: "Lunar Reconnaissance Orbiter",
      description: "Visualize LRO orbiting the Moon with real NASA data",
      function: () => {
        console.log("LRO button clicked");
        
        // Store original orbiting states to restore later
        if (typeof window.isEarthOrbiting !== 'undefined' && typeof window.isMoonOrbiting !== 'undefined') {
          // Save the original states
          window.originalEarthOrbitState = window.isEarthOrbiting;
          window.originalMoonOrbitState = window.isMoonOrbiting;
          
          // Pause both Earth and Moon orbiting when focusing on the LRO
          window.isEarthOrbiting = false;
          window.isMoonOrbiting = false;
        }
        
        // First ensure we focus on the Moon, then show the LRO
        if (typeof window.switchCameraFocus === 'function') {
          // Use a longer duration (3.0 seconds) for a smoother transition
          // Allow user to freely navigate around the Moon with mouse controls
          window.switchCameraFocus('moon', 3.0);
          
          // Add feedback to show something is happening
          const loadingText = document.createElement('div');
          loadingText.id = 'lro-transition';
          loadingText.style.position = 'fixed';
          loadingText.style.top = '10%';
          loadingText.style.left = '50%';
          loadingText.style.transform = 'translateX(-50%)';
          loadingText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          loadingText.style.color = 'white';
          loadingText.style.padding = '10px 20px';
          loadingText.style.borderRadius = '5px';
          loadingText.style.fontFamily = "'Arial', sans-serif";
          loadingText.style.zIndex = '2000';
          loadingText.textContent = 'Moving camera to the Moon...';
          document.body.appendChild(loadingText);
          
          // Longer delay to ensure camera transition completes
          setTimeout(() => {
            // Remove the transition message
            const transitionMsg = document.getElementById('lro-transition');
            if (transitionMsg) document.body.removeChild(transitionMsg);
            
            // Initialize LRO visualization
            showLunarOrbiterLive(scene, globe, globeGroup, camera);
          }, 2600);
        } else {
          showLunarOrbiterLive(scene, globe, globeGroup, camera);
        }
      },
      highlight: false
    },
    {
      name: "ISS Tracker",
      description: "Track the International Space Station in real-time",
      function: () => showISSTracker(scene, globe, globeGroup, camera)
    },
    {
      name: "Radiation Monitor",
      description: "Monitor radiation levels across Earth's orbit",
      function: () => showRadiationMonitor(scene, globe, globeGroup, camera)
    }
  ];
  
  // Create button for each tool
  tools.forEach(tool => {
    const button = createToolButton(tool);
    
    // Add click behavior
    button.addEventListener("click", () => {
      activateTool(tool, globe, globeGroup);
    });
    
    menu.appendChild(button);
  });
}

/**
 * Create a tool button with proper styling
 */
function createToolButton(tool) {
  const button = document.createElement("div");
  
  Object.assign(button.style, {
    backgroundColor: tool.highlight ? "#2c82dc" : "#0c529c",
    color: "#ffffff",
    padding: "12px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
    border: tool.highlight ? "2px solid #00ffff" : "none",
    boxShadow: tool.highlight ? "0 0 12px rgba(0, 255, 255, 0.5)" : "none"
  });
  
  // Add title
  const buttonTitle = document.createElement("div");
  buttonTitle.innerText = tool.name;
  buttonTitle.style.fontWeight = "bold";
  buttonTitle.style.marginBottom = "5px";
  buttonTitle.style.color = tool.highlight ? "#00ffff" : "#ffffff";
  button.appendChild(buttonTitle);
  
  // Add description
  const buttonDescription = document.createElement("div");
  buttonDescription.innerText = tool.description;
  buttonDescription.style.fontSize = "12px";
  buttonDescription.style.opacity = "0.8";
  button.appendChild(buttonDescription);
  
  // Add hover effects
  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#1a6bc2";
  });
  
  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = tool.highlight ? "#2c82dc" : "#0c529c";
  });
  
  return button;
}

/**
 * Activate a tool and handle cleanup
 */
function activateTool(tool, globe, globeGroup) {
  // Clean up previous tool
  if (window.currentToolCleanup && typeof window.currentToolCleanup === 'function') {
    window.currentToolCleanup();
  }
  
  // Prepare for new tool
  clearAstronautToolsPreservePanel(globe, globeGroup);
  showLoadingIndicator();
  
  // Track current active tool
  window.activeAstronautTool = tool.name;

  // Activate tool after a brief delay
  setTimeout(() => {
    try {
      const cleanupFunction = tool.function();
      
      // Store cleanup function for later use
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        window.currentToolCleanup = cleanupFunction;
      } else if (tool.cleanup && typeof tool.cleanup === 'function') {
        window.currentToolCleanup = tool.cleanup;
      }
    } catch (error) {
      console.error(`Error activating ${tool.name}:`, error);
    }
    hideLoadingIndicator();
  }, 100);
}

/**
 * Remove debris and orbit visualizations from the globe
 */
const clearDebrisAndOrbits = (globeGroup) => {
  if (globeGroup && globeGroup.children) {
    globeGroup.children = globeGroup.children.filter((child) => {
      // Keep objects that are NOT debris or orbits
      return !child.userData?.isDebrisOrOrbit;
    });
    console.log("Debris and orbits cleared from globeGroup.");
  } else {
    console.warn("globeGroup not available for clearDebrisAndOrbits");
  }
};

// Export public API
export {
  showAstronautToolsMenu,    // Main entry point for astronaut tools
  clearDebrisAndOrbits,      // Utility to clean up space debris visualizations
  clearAstronautTools,       // Clean up all astronaut tool visualizations
  clearAstronautToolsPreservePanel, // Clean up visualizations but keep panel
  createVerticalButton,      // Create info panel
  diagnoseAxios,             // Utility to check axios configuration
  showLoadingIndicator,      // UI helper for loading state
  hideLoadingIndicator       // UI helper to hide loading state
};
