import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { Earthquake } from '../../types';
import { getMagnitudeColor, getMagnitudeSize } from '../../utils/coordinates';

interface EarthGlobeRendererProps {
  containerRef: React.RefObject<HTMLDivElement>;
  earthquakes: Earthquake[];
  onEarthquakeClick?: (earthquake: Earthquake) => void;
}

export const EarthGlobeRenderer: React.FC<EarthGlobeRendererProps> = ({
  containerRef,
  earthquakes,
  onEarthquakeClick
}) => {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const globeRef = useRef<ThreeGlobe>();
  const animationRef = useRef<number>();

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
    camera.position.set(0, 0, 300);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Create globe
    const globe = new ThreeGlobe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#3a228a')
      .atmosphereAltitude(0.25);

    globe.scale.setScalar(100);
    scene.add(globe);
    globeRef.current = globe;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 200, 200);
    scene.add(directionalLight);

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

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      globe.rotation.y += deltaX * 0.01;
      globe.rotation.x += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
      const zoom = camera.position.z + event.deltaY * 0.5;
      camera.position.z = Math.max(150, Math.min(500, zoom));
    };

    containerRef.current.addEventListener('mousedown', handleMouseDown);
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Auto-rotate globe slowly
      if (!isMouseDown) {
        globe.rotation.y += 0.002;
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

  // Update earthquake data
  useEffect(() => {
    if (!globeRef.current || !earthquakes.length) return;

    const earthquakeData = earthquakes.map(eq => ({
      lat: eq.coordinates[0],
      lng: eq.coordinates[1],
      magnitude: eq.magnitude,
      color: getMagnitudeColor(eq.magnitude),
      size: getMagnitudeSize(eq.magnitude),
      earthquake: eq
    }));

    globeRef.current
      .pointsData(earthquakeData)
      .pointLat('lat')
      .pointLng('lng')
      .pointAltitude(0.1)
      .pointRadius('size')
      .pointColor('color')
      .pointResolution(12);

    // Add ripple effect for earthquakes
    globeRef.current
      .ringsData(earthquakeData.filter(eq => eq.magnitude > 5))
      .ringLat('lat')
      .ringLng('lng')
      .ringMaxRadius(eq => eq.magnitude * 2)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1000)
      .ringColor(() => 'rgba(255, 0, 0, 0.6)');

  }, [earthquakes]);

  return null;
};