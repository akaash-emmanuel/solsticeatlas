export interface Planet {
  name: string;
  radius: number;
  distance: number;
  color: string;
  texture?: string;
  rotationSpeed: number;
  orbitSpeed: number;
  tilt?: number;
  rings?: boolean;
}

// Improved coordinates system with descriptive properties
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  precision?: number;
  datum?: 'WGS84' | 'NAD83' | 'ETRS89';
}

export interface Earthquake {
  id: string;
  magnitude: number;
  depth: number;
  location: string;
  time: string;
  coordinates: [number, number];
  geoCoordinates?: GeoCoordinates; // Optional enhanced coordinates
}

export interface SpaceWeatherData {
  solarFlares: any[];
  radiationLevel: number;
  geomagneticStorm: string;
}

export interface Apollo11State {
  phase: 'earth_orbit' | 'trans_lunar' | 'lunar_orbit' | 'landing' | 'return';
  progress: number;
  altitude: number;
  velocity: number;
}

export interface ViewMode {
  solarSystem: boolean;
  earthGlobe: boolean;
  earthquakes: boolean;
  apollo11: boolean;
  astronautTools: boolean;
  spaceWeather: boolean;
}

export interface SunWavelength {
  value: string;
  label: string;
  color: string;
  description: string;
}

// User interaction types
export interface UserInteraction {
  clickActions: {
    select: boolean;
    focus: boolean;
    showInfo: boolean;
  };
  navigationControls: {
    zoom: boolean;
    rotate: boolean;
    pan: boolean;
  };
  selectionMode: 'single' | 'multiple' | 'none';
  hoverEffect: 'highlight' | 'expand' | 'info' | 'none';
  touchGestures: {
    pinchZoom: boolean;
    swipeRotate: boolean;
    doubleTapFocus: boolean;
  };
}

// 3D Display Settings for enhanced visualization
export interface DisplaySettings {
  camera: {
    fov: number;           // Field of view in degrees
    position: {
      x: number;
      y: number;
      z: number;
    };
    target?: {              // What the camera is looking at
      x: number;
      y: number; 
      z: number;
    };
  };
  rendering: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    shadows: boolean;
    antialiasing: boolean;
    atmosphericEffects: boolean;
  };
  scale: {
    planetSize: number;     // Scaling factor for planets
    distanceFactor: number; // Compression factor for distances
    objectScale: number;    // General scaling for all objects
  };
  lighting: {
    ambient: number;        // Ambient light intensity
    directional: number;    // Sun light intensity  
    shadows: boolean;
  };
  labels: {
    visible: boolean;
    size: number;
    fadeDistance: number;
  };
}