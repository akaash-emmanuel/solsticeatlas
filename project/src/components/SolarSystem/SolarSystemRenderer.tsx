import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { planets } from '../../data/planets';
import { Planet } from '../../types';

interface SolarSystemRendererProps {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedWavelength: string;
  onPlanetClick?: (planet: Planet) => void;
}

export const SolarSystemRenderer: React.FC<SolarSystemRendererProps> = ({
  containerRef,
  selectedWavelength,
  onPlanetClick
}) => {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const planetMeshes = useRef<{ [key: string]: THREE.Mesh }>({});
  const animationRef = useRef<number>();
  const sunMeshRef = useRef<THREE.Mesh>();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraDistanceRef = useRef<number>(150);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create Sun with proper emissive material
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.5
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    sunMeshRef.current = sun;

    // Add sun light
    const sunLight = new THREE.PointLight(0xFFFFFF, 2, 1000);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Add ambient light to make planets visible
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Create planets with proper colors and materials
    planets.forEach((planet) => {
      const planetGeometry = new THREE.SphereGeometry(planet.radius, 32, 32);
      const planetMaterial = new THREE.MeshPhongMaterial({ 
        color: planet.color,
        shininess: 30,
        specular: 0x111111
      });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      planetMesh.position.x = planet.distance;
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      planetMesh.userData = { planet };
      
      scene.add(planetMesh);
      planetMeshes.current[planet.name] = planetMesh;

      // Add rings for Saturn
      if (planet.rings) {
        const ringGeometry = new THREE.RingGeometry(planet.radius * 1.2, planet.radius * 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xDAA520,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planetMesh.add(rings);
      }

      // Create orbit path
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3
      });
      const orbitPoints = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        orbitPoints.push(
          Math.cos(angle) * planet.distance,
          0,
          Math.sin(angle) * planet.distance
        );
      }
      orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);
    });

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;
    let mouseDownX = 0;
    let mouseDownY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !camera) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      // Rotate camera around the target
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position.clone().sub(cameraTargetRef.current));
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      camera.position.setFromSpherical(spherical).add(cameraTargetRef.current);
      camera.lookAt(cameraTargetRef.current);
      
      mouseX = event.clientX;
      mouseY = event.clientY;
      
      setIsAutoRotating(false);
    };

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
      mouseDownX = event.clientX;
      mouseDownY = event.clientY;
    };

    const handleMouseUp = (event: MouseEvent) => {
      isMouseDown = false;
      
      // Check if it was a click (not a drag)
      const deltaX = Math.abs(event.clientX - mouseDownX);
      const deltaY = Math.abs(event.clientY - mouseDownY);
      
      if (deltaX < 5 && deltaY < 5) {
        // Handle planet clicking
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (event.clientX / containerRef.current!.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / containerRef.current!.clientHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const planetMeshArray = Object.values(planetMeshes.current);
        const intersects = raycaster.intersectObjects(planetMeshArray);
        
        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object as THREE.Mesh;
          const planet = clickedMesh.userData.planet;
          if (planet && onPlanetClick) {
            onPlanetClick(planet);
          }
          focusOnPlanet(planet.name);
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!camera) return;
      
      cameraDistanceRef.current += event.deltaY * 0.1;
      cameraDistanceRef.current = Math.max(10, Math.min(500, cameraDistanceRef.current));
      
      const direction = camera.position.clone().sub(cameraTargetRef.current).normalize();
      camera.position.copy(cameraTargetRef.current).add(direction.multiplyScalar(cameraDistanceRef.current));
      setIsAutoRotating(false);
    };

    const handleDoubleClick = () => {
      setIsAutoRotating(true);
      setSelectedPlanet(null);
      cameraTargetRef.current.set(0, 0, 0);
      cameraDistanceRef.current = 150;
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousedown', handleMouseDown);
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseup', handleMouseUp);
      containerRef.current.addEventListener('wheel', handleWheel);
      containerRef.current.addEventListener('dblclick', handleDoubleClick);
    }

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Rotate sun
      if (sun) {
        sun.rotation.y += 0.01;
      }
      
      // Animate planets - realistic orbital motion
      planets.forEach((planet) => {
        const planetMesh = planetMeshes.current[planet.name];
        if (planetMesh) {
          // Orbit around sun
          const angle = time * planet.orbitSpeed;
          planetMesh.position.x = Math.cos(angle) * planet.distance;
          planetMesh.position.z = Math.sin(angle) * planet.distance;
          
          // Rotate planet on its axis
          planetMesh.rotation.y += planet.rotationSpeed;
          
          // Apply tilt
          if (planet.tilt) {
            planetMesh.rotation.z = planet.tilt;
          }
        }
      });
      
      // Auto-rotate camera or focus on selected planet
      if (isAutoRotating && !selectedPlanet) {
        cameraTargetRef.current.set(0, 0, 0);
        const cameraAngle = time * 0.05;
        camera.position.x = Math.cos(cameraAngle) * cameraDistanceRef.current;
        camera.position.z = Math.sin(cameraAngle) * cameraDistanceRef.current;
        camera.position.y = 50;
        camera.lookAt(cameraTargetRef.current);
      } else if (selectedPlanet) {
        const planetMesh = planetMeshes.current[selectedPlanet];
        if (planetMesh) {
          // Smoothly move camera target to planet
          cameraTargetRef.current.lerp(planetMesh.position, 0.05);
          
          // Position camera at appropriate distance from planet
          const planetData = planets.find(p => p.name === selectedPlanet);
          const planetRadius = planetData?.radius || 1;
          const optimalDistance = planetRadius * 8;
          cameraDistanceRef.current = Math.max(optimalDistance, 15);
          
          const direction = camera.position.clone().sub(cameraTargetRef.current).normalize();
          const targetCameraPos = cameraTargetRef.current.clone().add(direction.multiplyScalar(cameraDistanceRef.current));
          
          camera.position.lerp(targetCameraPos, 0.05);
          camera.lookAt(cameraTargetRef.current);
        }
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && renderer && camera) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseup', handleMouseUp);
        containerRef.current.removeEventListener('wheel', handleWheel);
        containerRef.current.removeEventListener('dblclick', handleDoubleClick);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [containerRef]);

  // Update sun material based on wavelength
  useEffect(() => {
    const sun = sunMeshRef.current;
    if (!sun || !sun.material || !(sun.material instanceof THREE.MeshStandardMaterial)) return;
    
    const wavelengthData = {
      '304': { color: 0xFFA500, intensity: 0.8 },
      '171': { color: 0xFFD700, intensity: 0.6 },
      '193': { color: 0x00BFFF, intensity: 0.7 },
      '211': { color: 0xFF69B4, intensity: 0.5 },
      '335': { color: 0x00FF00, intensity: 0.4 },
      '94': { color: 0x8A2BE2, intensity: 0.9 }
    };
    
    const data = wavelengthData[selectedWavelength as keyof typeof wavelengthData] || wavelengthData['304'];
    
    const material = sun.material as THREE.MeshStandardMaterial;
    material.color.setHex(data.color);
    material.emissive.setHex(data.color);
    material.emissiveIntensity = data.intensity;
  }, [selectedWavelength]);

  // Focus on selected planet
  const focusOnPlanet = (planetName: string) => {
    setSelectedPlanet(planetName);
    setIsAutoRotating(false);
    
    // Set initial camera target to planet position
    const planetMesh = planetMeshes.current[planetName];
    if (planetMesh) {
      cameraTargetRef.current.copy(planetMesh.position);
    }
  };

  return (
    <>
      {/* Planet Selection Menu - Repositioned to avoid overlap */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-30">
        <div className="bg-black bg-opacity-90 text-white rounded-lg p-4 w-64">
          <h3 className="text-lg font-semibold mb-3">Navigate to Planet</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedPlanet(null);
                setIsAutoRotating(true);
              }}
              className={`w-full p-2 rounded-lg text-left transition-all duration-200 ${
                !selectedPlanet && isAutoRotating
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              ☀️ Solar System Overview
            </button>
            {planets.map((planet) => (
              <button
                key={planet.name}
                onClick={() => focusOnPlanet(planet.name)}
                className={`w-full p-2 rounded-lg text-left transition-all duration-200 ${
                  selectedPlanet === planet.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🪐 {planet.name}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              • Click and drag to rotate
              • Scroll to zoom
              • Double-click to auto-rotate
              • Click planets to select
            </div>
          </div>
        </div>
      </div>
    </>
  );
};