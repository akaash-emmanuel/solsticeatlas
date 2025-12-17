/**
 * LunarOrbiter.js - Visualization of the Lunar Reconnaissance Orbiter (LRO)
 * 
 * This file implements the visualization of NASA's Lunar Reconnaissance Orbiter
 * spacecraft orbiting the Moon in the globe tour application. It includes:
 * 
 * 1. Creation of the LRO spacecraft model
 * 2. Visualization of its orbit path around the Moon
 * 3. Live telemetry data display (simulated)
 * 4. Mission information panel
 * 
 * The LRO is a NASA robotic spacecraft currently orbiting the Moon in a polar orbit
 * since its launch on June 18, 2009. Its primary mission is to make high-resolution maps
 * of the lunar surface to aid in future lunar exploration missions.
 */

import { 
  SphereGeometry, 
  MeshPhongMaterial, 
  Mesh, 
  Vector3, 
  LineBasicMaterial, 
  BufferGeometry, 
  LineLoop,
  TextureLoader,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
  Quaternion
} from 'three';
import axios from 'axios';

// Constants for LRO visualization
const LRO_SCALE = 0.03; // Scale of LRO relative to Moon radius
const LRO_ORBITAL_HEIGHT = 0.12; // Height above the Moon surface (scaled)
const LRO_ORBITAL_PERIOD = 15; // Time in seconds for one orbit (for visualization)
const LRO_ORBITAL_INCLINATION = 90 * (Math.PI / 180); // LRO polar orbit inclination (90 degrees)
const NASA_API_KEY = "jmRRPCUwwWyNaMrXJCNz8HDX8q94wPnQfKz0ig5a";

// LRO orbit parameters in km (actual values)
const LRO_PERILUNE = 20; // km (lowest point)
const LRO_APOLUNE = 165; // km (highest point)
const MOON_RADIUS_KM = 1737.4; // Moon's radius in kilometers

// Create and add the Lunar Reconnaissance Orbiter (LRO) to the scene
export const createLunarOrbiter = (scene, moon) => {
  if (!scene || !moon) {
    console.error('Scene or Moon not provided to createLunarOrbiter');
    return null;
  }

  // Get the Moon's radius for proper scaling
  const moonRadius = moon.geometry.parameters.radius;
  
  // Create LRO geometry (very small compared to the Moon)
  const orbiterRadius = moonRadius * LRO_SCALE;
  const orbiterGeometry = new SphereGeometry(orbiterRadius, 16, 16);
  
  // Create LRO material (bright to make it visible)
  const orbiterMaterial = new MeshPhongMaterial({
    color: 0xffff00, // Bright yellow for visibility
    emissive: 0xffff00,
    emissiveIntensity: 0.5,
    shininess: 30
  });
  
  // Create LRO mesh
  const orbiter = new Mesh(orbiterGeometry, orbiterMaterial);
  
  // Initial position (will be updated in updateLROPosition)
  orbiter.position.set(moonRadius + (moonRadius * LRO_ORBITAL_HEIGHT), 0, 0);
  
  // Create orbit path visualization
  const orbitPath = createLROOrbitPath(moonRadius, LRO_ORBITAL_HEIGHT);
  
  // Add custom properties
  orbiter.userData = {
    isLRO: true,
    orbitalAngle: 0,
    orbitPath: orbitPath,
    lastUpdate: Date.now()
  };
  
  // Add orbit path to the Moon
  moon.add(orbitPath);
  
  // Add LRO to the scene (not to the Moon, so we can control its position independently)
  scene.add(orbiter);
  
  // Create and add label sprite for the LRO
  const label = createLROLabel();
  orbiter.add(label);
  
  return orbiter;
};

// Create a visible orbit path for the LRO
const createLROOrbitPath = (moonRadius, orbitalHeight) => {
  const points = [];
  const segments = 100;
  const orbitRadius = moonRadius + (moonRadius * orbitalHeight);
  
  // Create points for a polar orbit (inclination of 90 degrees)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    
    // Calculate position with inclination for a polar orbit
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius * Math.sin(LRO_ORBITAL_INCLINATION);
    const z = Math.sin(angle) * orbitRadius * Math.cos(LRO_ORBITAL_INCLINATION);
    
    points.push(new Vector3(x, y, z));
  }
  
  // Create geometry from points
  const orbitPathGeometry = new BufferGeometry().setFromPoints(points);
  
  // Create line material with enhanced visibility
  const orbitPathMaterial = new LineBasicMaterial({
    color: 0x00ffff, // Cyan color for orbit path
    transparent: true,
    opacity: 0.6,
    linewidth: 1
  });
  
  // Create the orbit path as a line loop
  const orbitPath = new LineLoop(orbitPathGeometry, orbitPathMaterial);
  
  // Add metadata
  orbitPath.userData = {
    isLROOrbit: true
  };
  
  return orbitPath;
};

// Create a text label for the LRO
const createLROLabel = () => {
  // Create canvas for the label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
  // Draw background
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw border
  context.strokeStyle = '#00FFFF';
  context.lineWidth = 2;
  context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  
  // Draw text
  context.fillStyle = '#FFFFFF';
  context.font = 'bold 24px Arial';
  context.fillText('LRO', 10, 35);
  context.font = '16px Arial';
  context.fillText('Lunar Reconnaissance', 10, 65);
  context.fillText('Orbiter', 10, 85);
  
  // Create texture from canvas
  const texture = new CanvasTexture(canvas);
  
  // Create sprite material
  const material = new SpriteMaterial({
    map: texture,
    transparent: true
  });
  
  // Create sprite
  const sprite = new Sprite(material);
  sprite.scale.set(4, 2, 1);
  sprite.position.set(2, 0, 0);
  
  return sprite;
};

// Update LRO position to orbit around Moon using real data when available
export const updateLROPosition = (lro, moon, deltaTime) => {
  if (!lro || !moon) return;
  
  // Get Moon's position in world coordinates
  const moonPosition = new Vector3();
  moon.getWorldPosition(moonPosition);
  
  // Get Moon's radius for calculations
  const moonRadius = moon.geometry.parameters.radius;
  
  // Check if we have real position data from NASA API
  if (lro.userData.realPositionData) {
    // Use the real position data from NASA
    const { x, y, z } = lro.userData.realPositionData;
    
    // Scale the position to match our visualization
    // NASA data is in km, we need to scale it to match our scene scale
    const scaleFactorKm = moonRadius / MOON_RADIUS_KM;
    
    // Create a vector for the scaled position relative to Moon
    const lroVector = new Vector3(
      x * scaleFactorKm,
      y * scaleFactorKm,
      z * scaleFactorKm
    );
    
    // Create a new Quaternion object to store moon's rotation
    const moonQuaternion = new Quaternion();
    moon.getWorldQuaternion(moonQuaternion);
    
    // Apply moon's world quaternion to LRO's position
    lroVector.applyQuaternion(moonQuaternion);
    
    // Update position relative to Moon
    lro.position.set(
      moonPosition.x + lroVector.x,
      moonPosition.y + lroVector.y,
      moonPosition.z + lroVector.z
    );
  } else {
    // Fall back to simulated orbit if no real data is available
    // Update orbital angle
    lro.userData.orbitalAngle += (deltaTime || 0.016) * (Math.PI * 2) / LRO_ORBITAL_PERIOD;
    
    // Calculate new position with inclination for a polar orbit
    const angle = lro.userData.orbitalAngle;
    const orbitRadius = moonRadius + (moonRadius * LRO_ORBITAL_HEIGHT);
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius * Math.sin(LRO_ORBITAL_INCLINATION);
    const z = Math.sin(angle) * orbitRadius * Math.cos(LRO_ORBITAL_INCLINATION);
    
    // Create a new Quaternion object to store moon's rotation
    const moonQuaternion = new Quaternion();
    moon.getWorldQuaternion(moonQuaternion);
    
    // Apply moon's world quaternion to LRO's position
    const lroVector = new Vector3(x, y, z).applyQuaternion(moonQuaternion);
    
    // Update position relative to Moon
    lro.position.set(
      moonPosition.x + lroVector.x,
      moonPosition.y + lroVector.y,
      moonPosition.z + lroVector.z
    );
  }
  
  // Make LRO face Moon (look towards the Moon)
  lro.lookAt(moonPosition);
};

// Clean up LRO
export const removeLRO = (scene, lro) => {
  if (lro && scene) {
    // Remove the orbit path from its parent (the Moon)
    if (lro.userData && lro.userData.orbitPath && lro.userData.orbitPath.parent) {
      lro.userData.orbitPath.parent.remove(lro.userData.orbitPath);
    }
    
    // Remove the LRO itself
    scene.remove(lro);
  }
};

// Toggle LRO visibility
export const toggleLROVisibility = (lro, isVisible) => {
  if (lro) {
    // If isVisible is not provided, toggle current state
    const newVisibility = isVisible !== undefined ? isVisible : !lro.visible;
    
    // Update LRO visibility
    lro.visible = newVisibility;
    
    // Also update orbit path visibility if it exists
    if (lro.userData && lro.userData.orbitPath) {
      lro.userData.orbitPath.visible = newVisibility;
    }
    
    return newVisibility;
  }
  
  return false;
};

// Fetch real-time LRO data from NASA Horizons API
export const fetchLROData = async () => {
  try {
    // Construct the NASA JPL Horizons API request for the LRO
    // LRO's SPK ID is -85 in the JPL Horizons system
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format dates for the API request
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // NASA Horizons API request for LRO data
    const apiUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='-85'&EPHEM_TYPE=VECTORS&CENTER='301'&START_TIME='${formatDate(today)}'&STOP_TIME='${formatDate(tomorrow)}'&STEP_SIZE='1 h'&VEC_TABLE='2'&CSV_FORMAT='YES'&OBJ_DATA='YES'&REF_SYSTEM='J2000'&VEC_LABELS='YES'&VEC_DELTA_T='NO'&OUT_UNITS='KM-S'&TIME_TYPE='UTC'&API_KEY='${NASA_API_KEY}'`;
    
    // Fetch the data
    const response = await axios.get(apiUrl);
    
    // Process the raw data to extract LRO position information
    const rawData = response.data.result;
    
    // Parse the CSV data from the response
    // The response contains a CSV table between $$SOE and $$EOE markers
    const soeIndex = rawData.indexOf('$$SOE');
    const eoeIndex = rawData.indexOf('$$EOE');
    
    if (soeIndex === -1 || eoeIndex === -1) {
      throw new Error("Could not find data markers in NASA Horizons API response");
    }
    
    const dataSection = rawData.substring(soeIndex + 6, eoeIndex).trim();
    const lines = dataSection.split('\n');
    
    // Get the most recent data point (last line)
    const currentData = lines[0]; // Use the first data point
    const values = currentData.split(',').map(val => val.trim());
    
    // Extract relevant information
    // Format will depend on the exact API response structure
    // Assuming the vector table format with position and velocity components
    const x = parseFloat(values[2]); // km
    const y = parseFloat(values[3]); // km
    const z = parseFloat(values[4]); // km
    const vx = parseFloat(values[5]); // km/s
    const vy = parseFloat(values[6]); // km/s
    const vz = parseFloat(values[7]); // km/s
    
    // Calculate distance from Moon's center (altitude = distance - Moon's radius)
    const distance = Math.sqrt(x*x + y*y + z*z);
    const altitude = (distance - MOON_RADIUS_KM).toFixed(1);
    
    // Calculate velocity magnitude
    const velocity = Math.sqrt(vx*vx + vy*vy + vz*vz).toFixed(2);
    
    // Calculate latitude and longitude from cartesian coordinates
    const lat = (Math.asin(z / distance) * (180 / Math.PI)).toFixed(2);
    const lon = (Math.atan2(y, x) * (180 / Math.PI)).toFixed(2);
    
    // Calculate mission elapsed time
    const launchDate = new Date('2009-06-18');
    const elapsedMs = today - launchDate;
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const elapsedHours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const mission_elapsed_time = `${elapsedDays} days, ${elapsedHours} hours, ${elapsedMinutes} minutes`;
    
    // Estimate orbit number (LRO orbits the Moon about once every ~2 hours)
    const hoursInOrbit = elapsedMs / (1000 * 60 * 60);
    const orbit_number = Math.floor(hoursInOrbit / 2);
    
    return {
      altitude: altitude, // km above Moon's surface
      velocity: velocity, // km/s
      latitude: lat, // degrees
      longitude: lon, // degrees
      orbit_number: orbit_number,
      mission_elapsed_time: mission_elapsed_time,
      // Save raw position data for visualization
      rawPosition: { x, y, z }
    };
  } catch (error) {
    console.error("Error fetching LRO data:", error);
    // Fallback to simulated data if API fails
    return {
      altitude: (LRO_PERILUNE + Math.random() * (LRO_APOLUNE - LRO_PERILUNE)).toFixed(1),
      velocity: (1.6 + Math.random() * 0.2).toFixed(2),
      latitude: (Math.random() * 180 - 90).toFixed(2),
      longitude: (Math.random() * 360 - 180).toFixed(2),
      orbit_number: Math.floor(16000 + Math.random() * 2000),
      mission_elapsed_time: "5177+ days" // Approximate time since LRO launch (2009)
    };
  }
};

// Update the info panel with LRO data
export const updateLROInfoPanel = async (infoPanel) => {
  if (!infoPanel) return;
  
  // Fetch current LRO data
  const lroData = await fetchLROData();
  if (!lroData) {
    infoPanel.innerHTML = "<h3>Lunar Reconnaissance Orbiter</h3><p>Error fetching data</p>";
    return;
  }
  
  // Update the info panel with LRO data
  infoPanel.innerHTML = `
    <h3 style="color: #00FFFF; text-align: center; margin: 0 0 15px 0;">Lunar Reconnaissance Orbiter</h3>
    <div style="margin-bottom: 20px;">
      <img src="https://www.nasa.gov/wp-content/uploads/2019/09/lro_hires.jpg" 
           style="width: 100%; border-radius: 5px; border: 1px solid #00FFFF;" 
           alt="LRO" />
    </div>
    <div style="background-color: rgba(0, 30, 60, 0.7); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
      <h4 style="color: #00FFFF; margin: 0 0 10px 0;">Live Telemetry</h4>
      <table style="width: 100%; color: #FFFFFF;">
        <tr>
          <td><strong>Altitude:</strong></td>
          <td>${lroData.altitude} km</td>
        </tr>
        <tr>
          <td><strong>Velocity:</strong></td>
          <td>${lroData.velocity} km/s</td>
        </tr>
        <tr>
          <td><strong>Latitude:</strong></td>
          <td>${lroData.latitude}°</td>
        </tr>
        <tr>
          <td><strong>Longitude:</strong></td>
          <td>${lroData.longitude}°</td>
        </tr>
        <tr>
          <td><strong>Orbit:</strong></td>
          <td>#${lroData.orbit_number}</td>
        </tr>
      </table>
    </div>
    <div style="background-color: rgba(0, 30, 60, 0.7); padding: 15px; border-radius: 5px;">
      <h4 style="color: #00FFFF; margin: 0 0 10px 0;">Mission Info</h4>
      <p><strong>Launch Date:</strong> June 18, 2009</p>
      <p><strong>Mission Duration:</strong> ${lroData.mission_elapsed_time}</p>
      <p><strong>Primary Objectives:</strong> Mapping the lunar surface, identifying potential landing sites, 
      characterizing the radiation environment, and searching for resources.</p>
    </div>
  `;
};

// Variable to track current animation frame for cancellation
let currentAnimationFrame = null;

// Function to stop any ongoing animation
export const stopCurrentAnimation = () => {
  if (currentAnimationFrame !== null) {
    cancelAnimationFrame(currentAnimationFrame);
    currentAnimationFrame = null;
  }
};

// Main function to show Lunar Orbiter visualization with real data
export const showLunarOrbiterLive = async (scene, globe, globeGroup, camera) => {
  // Stop any existing animations first
  stopCurrentAnimation();
  
  // Ensure Earth and Moon orbiting variables are accessible globally
  if (typeof window.isEarthOrbiting === 'undefined') {
    window.isEarthOrbiting = false;
  }
  
  if (typeof window.isMoonOrbiting === 'undefined') {
    window.isMoonOrbiting = false;
  }
  
  // Get the moon object from the scene
  let moon = null;
  scene.traverse((object) => {
    if (object.userData && object.userData.isMoon) {
      moon = object;
    }
  });
  
  if (!moon) {
    console.error("Moon not found in the scene");
    return;
  }
  
  // Create loading indicator
  const loadingIndicator = document.createElement("div");
  loadingIndicator.id = "lro-loading";
  loadingIndicator.style.position = "fixed";
  loadingIndicator.style.top = "50%";
  loadingIndicator.style.left = "50%";
  loadingIndicator.style.transform = "translate(-50%, -50%)";
  loadingIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  loadingIndicator.style.color = "white";
  loadingIndicator.style.padding = "20px";
  loadingIndicator.style.borderRadius = "10px";
  loadingIndicator.style.zIndex = "1000";
  loadingIndicator.style.textAlign = "center";
  loadingIndicator.innerHTML = `
    <div>🛰️ Fetching Lunar Reconnaissance Orbiter data...</div>
    <div style="font-size: 12px; margin-top: 10px;">Connecting to NASA JPL Horizons API</div>
  `;
  document.body.appendChild(loadingIndicator);
  
  // Focus camera on the Moon - using the switchCameraFocus function from index.js
  console.log("Setting camera focus to moon");
  if (window.switchCameraFocus) {
    // Set camera focus to the moon with a longer duration for smoother transition
    // Allow user to freely navigate around the Moon with mouse
    window.switchCameraFocus('moon', 3.0);
  } else {
    // Fallback if the function is not available
    console.warn("switchCameraFocus function not available, creating local focus function");
    
    // Get moon position
    const moonPosition = new Vector3();
    moon.getWorldPosition(moonPosition);
    
    // Set up animation to focus on moon
    const startPosition = camera.position.clone();
    const startTarget = new Vector3();
    camera.getWorldDirection(startTarget).multiplyScalar(100).add(camera.position);
    
    // Calculate ideal viewing distance (5x moon radius)
    const moonRadius = moon.geometry.parameters.radius;
    const distance = moonRadius * 5;
    
    // Calculate end position
    const directionToMoon = new Vector3().subVectors(camera.position, moonPosition).normalize();
    const endPosition = moonPosition.clone().add(directionToMoon.multiplyScalar(distance));
    
    // Set up animation
    let startTime = Date.now();
    const duration = 1500; // 1.5 seconds
    
    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-in-out function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      // Update position
      camera.position.lerpVectors(startPosition, endPosition, easeProgress);
      
      // Look at moon
      camera.lookAt(moonPosition);
      
      // Continue animation if not complete
      if (progress < 1) {
        currentAnimationFrame = requestAnimationFrame(animateCamera);
      }
    }
    
    // Start animation
    animateCamera();
  }
  
  // Create the LRO
  const lro = createLunarOrbiter(scene, moon);
  if (!lro) {
    document.body.removeChild(loadingIndicator);
    return;
  }
  
  try {
    // Fetch real LRO position data from NASA API
    const lroData = await fetchLROData();
    
    // Remove loading indicator
    document.body.removeChild(loadingIndicator);
    
    // Store the real position data in the LRO object for use in updateLROPosition
    if (lroData && lroData.rawPosition) {
      lro.userData.realPositionData = lroData.rawPosition;
      console.log("LRO position data successfully fetched from NASA API:", lroData);
    }
    
    // Update the info panel with LRO data
    const infoPanel = document.getElementById("verticalButton");
    if (!infoPanel) return;
    
    // Set up the info panel
    updateLROInfoPanel(infoPanel);
    
    // Set up an interval to fetch new data and update the LRO position and info panel
    const updateInterval = setInterval(async () => {
      try {
        const newLroData = await fetchLROData();
        if (newLroData && newLroData.rawPosition) {
          lro.userData.realPositionData = newLroData.rawPosition;
        }
        updateLROInfoPanel(infoPanel);
      } catch (error) {
        console.error("Error updating LRO data:", error);
      }
    }, 60000); // Update every minute
    
    // Store the interval for cleanup
    if (!window.astronautToolIntervals) {
      window.astronautToolIntervals = [];
    }
    window.astronautToolIntervals.push(updateInterval);
    
  } catch (error) {
    console.error("Error initializing LRO with real data:", error);
    document.body.removeChild(loadingIndicator);
    
    // Even if we fail to get real data, update the info panel with simulated data
    const infoPanel = document.getElementById("verticalButton");
    if (infoPanel) {
      updateLROInfoPanel(infoPanel);
      
      // Set up an interval to update the info panel periodically with simulated data
      const infoPanelInterval = setInterval(() => {
        updateLROInfoPanel(infoPanel);
      }, 5000);
      
      // Store the interval for cleanup
      if (!window.astronautToolIntervals) {
        window.astronautToolIntervals = [];
      }
      window.astronautToolIntervals.push(infoPanelInterval);
    }
  }
  
  // Generate a function to clean up the LRO visualization
  const cleanup = () => {
    removeLRO(scene, lro);
    const loadingElem = document.getElementById("lro-loading");
    if (loadingElem) {
      document.body.removeChild(loadingElem);
    }
  };
  
  return cleanup;
};
