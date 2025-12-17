import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Apollo11State } from '../../types';

interface Apollo11RendererProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onStateChange: (state: Apollo11State) => void;
}

export const Apollo11Renderer: React.FC<Apollo11RendererProps> = ({
  containerRef,
  onStateChange
}) => {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const spacecraftRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  const [missionState, setMissionState] = useState<Apollo11State>({
    phase: 'earth_orbit',
    progress: 0,
    altitude: 400,
    velocity: 7.8
  });

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
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x6B93D6,
      shininess: 30
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Create Moon
    const moonGeometry = new THREE.SphereGeometry(2.7, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xD3D3D3,
      shininess: 10
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(60, 0, 0);
    scene.add(moon);

    // Create spacecraft
    const spacecraft = new THREE.Group();
    
    // Command module
    const commandGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const commandMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
    const commandModule = new THREE.Mesh(commandGeometry, commandMaterial);
    commandModule.position.y = 1;
    spacecraft.add(commandModule);

    // Service module
    const serviceGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    const serviceMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const serviceModule = new THREE.Mesh(serviceGeometry, serviceMaterial);
    serviceModule.position.y = -1;
    spacecraft.add(serviceModule);

    // Lunar module
    const lunarGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const lunarMaterial = new THREE.MeshPhongMaterial({ color: 0xDAA520 });
    const lunarModule = new THREE.Mesh(lunarGeometry, lunarMaterial);
    lunarModule.position.y = -3;
    spacecraft.add(lunarModule);

    spacecraft.position.set(0, 15, 0);
    scene.add(spacecraft);
    spacecraftRef.current = spacecraft;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 100);
    scene.add(sunLight);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = (Math.random() - 0.5) * 1000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    let missionTime = 0;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      missionTime += 0.001;
      
      // Update mission state based on time
      let newState: Apollo11State;
      
      if (missionTime < 1) {
        // Earth orbit phase
        newState = {
          phase: 'earth_orbit',
          progress: (missionTime * 100),
          altitude: 400,
          velocity: 7.8
        };
        
        // Orbit around Earth
        const angle = missionTime * 2;
        spacecraft.position.x = Math.cos(angle) * 15;
        spacecraft.position.z = Math.sin(angle) * 15;
        spacecraft.position.y = 2;
        
      } else if (missionTime < 2) {
        // Trans-lunar injection
        newState = {
          phase: 'trans_lunar',
          progress: ((missionTime - 1) * 100),
          altitude: 1000 + (missionTime - 1) * 50000,
          velocity: 11.2
        };
        
        // Move towards moon
        const progress = (missionTime - 1);
        spacecraft.position.x = 15 * (1 - progress) + 60 * progress;
        spacecraft.position.y = 2 * (1 - progress);
        spacecraft.position.z = 0;
        
      } else if (missionTime < 3) {
        // Lunar orbit
        newState = {
          phase: 'lunar_orbit',
          progress: ((missionTime - 2) * 100),
          altitude: 100,
          velocity: 1.6
        };
        
        // Orbit around moon
        const angle = (missionTime - 2) * 4;
        spacecraft.position.x = 60 + Math.cos(angle) * 5;
        spacecraft.position.z = Math.sin(angle) * 5;
        spacecraft.position.y = 0;
        
      } else {
        // Return to Earth
        newState = {
          phase: 'return',
          progress: ((missionTime - 3) * 50),
          altitude: 50000 - (missionTime - 3) * 25000,
          velocity: 11.2
        };
        
        // Move back to Earth
        const progress = (missionTime - 3);
        spacecraft.position.x = 60 * (1 - progress) + 15 * progress;
        spacecraft.position.y = 0 * (1 - progress) + 2 * progress;
        spacecraft.position.z = 0;
      }
      
      setMissionState(newState);
      onStateChange(newState);
      
      // Rotate Earth and Moon
      earth.rotation.y += 0.005;
      moon.rotation.y += 0.01;
      
      // Camera follows spacecraft
      const cameraDistance = 20;
      camera.position.x = spacecraft.position.x + cameraDistance;
      camera.position.y = spacecraft.position.y + 10;
      camera.position.z = spacecraft.position.z + cameraDistance;
      camera.lookAt(spacecraft.position);
      
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [containerRef, onStateChange]);

  return null;
};