
import * as THREE from "three";

// Import Textures
import sunImg from "../assets/textures/sun.jpg";
import mercuryImg from "../assets/textures/mercury.jpg";
import venusImg from "../assets/textures/venus.jpg";
import earthImg from "../assets/textures/earth.jpg";
import marsImg from "../assets/textures/mars.jpg";
import jupiterImg from "../assets/textures/jupiter.jpg";
import saturnImg from "../assets/textures/saturn.jpg";
import uranusImg from "../assets/textures/uranus.jpg";
import neptuneImg from "../assets/textures/neptune.jpg";

import { CometSystem } from "../components/CometSystem.js";
import earthCloudsImg from "../assets/textures/earth_clouds.png";
import earthNormalImg from "../assets/textures/earth_normal.jpg";
import earthSpecularImg from "../assets/textures/earth_specular.jpg";

export class SolarSystemManager {
    constructor(scene, camera, controls) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.group = new THREE.Group();
        this.planets = [];
        this.active = false;

        // Effects
        this.cometSystem = new CometSystem(this.group);
        this.sunGlow = null;
        this.time = 0;

        // Auto-Pilot Tour
        this.isTouring = false;
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.tourDuration = 400; // Frames per planet

        // Interaction State
        this.focusedPlanet = null;
        this.isTransitioning = false;

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // Loader
        this.loader = new THREE.TextureLoader();

        // UI Wrapper
        this.uiContainer = this.createUI();

        // Hide by default
        this.group.visible = false;
        this.scene.add(this.group);

        this.init();

        window.addEventListener('pointerdown', this.onPointerDown.bind(this));
    }

    createUI() {
        const div = document.createElement('div');
        Object.assign(div.style, {
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '250px',
            display: 'none',
            zIndex: '1001',
            backdropFilter: 'blur(5px)'
        });
        document.body.appendChild(div);
        return div;
    }

    init() {
        this.createStarfield();

        // Sun
        const sunGeo = new THREE.SphereGeometry(15, 64, 64);
        const sunMat = new THREE.MeshBasicMaterial({ map: this.loader.load(sunImg), color: 0xffffff });
        const sun = new THREE.Mesh(sunGeo, sunMat);

        // Light
        const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000);
        sun.add(sunLight);
        this.group.add(sun);

        sun.userData = { isPlanet: true, name: "The Sun", type: "Star", temp: "5,778 K", info: "The heart of our system." };

        // Planets
        const planetData = [
            { name: "Mercury", img: mercuryImg, distance: 35, size: 2, speed: 0.008, type: "Rocky", temp: "167°C", info: "Smallest planet, closest to Sun." },
            { name: "Venus", img: venusImg, distance: 55, size: 3.5, speed: 0.005, type: "Rocky", temp: "464°C", info: "Hottest planet due to thick atmosphere." },
            // EARTH (Special)
            {
                name: "Earth", img: earthImg, distance: 80, size: 3.8, speed: 0.003, type: "Rocky", temp: "15°C", info: "Our home. Supports life.",
                specular: earthSpecularImg, normal: earthNormalImg, clouds: earthCloudsImg
            },
            { name: "Mars", img: marsImg, distance: 105, size: 2.2, speed: 0.0024, type: "Rocky", temp: "-65°C", info: "The Red Planet." },
            { name: "Jupiter", img: jupiterImg, distance: 160, size: 11, speed: 0.001, type: "Gas Giant", temp: "-110°C", info: "Largest planet. Has Great Red Spot." },
            { name: "Saturn", img: saturnImg, distance: 220, size: 9.5, speed: 0.0008, ring: true, type: "Gas Giant", temp: "-140°C", info: "Famous for its extensive ring system." },
            { name: "Uranus", img: uranusImg, distance: 280, size: 7, speed: 0.0006, type: "Ice Giant", temp: "-195°C", info: "Rotates on its side." },
            { name: "Neptune", img: neptuneImg, distance: 340, size: 7, speed: 0.0005, type: "Ice Giant", temp: "-200°C", info: "Windiest planet." }
        ];

        planetData.forEach(p => {
            const geometry = new THREE.SphereGeometry(p.size, 64, 64);
            let material;

            // Advanced Material for Earth
            if (p.name === "Earth") {
                material = new THREE.MeshPhongMaterial({
                    map: this.loader.load(p.img),
                    specularMap: this.loader.load(p.specular),
                    specular: new THREE.Color('grey'),
                    normalMap: this.loader.load(p.normal),
                    shininess: 10
                });
            } else {
                material = new THREE.MeshStandardMaterial({ map: this.loader.load(p.img), roughness: 0.8, metalness: 0.1 });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { isPlanet: true, name: p.name, type: p.type, temp: p.temp, info: p.info, size: p.size };

            if (p.ring) {
                const ringGeo = new THREE.RingGeometry(p.size * 1.4, p.size * 2.5, 64);
                const ringTex = this.createRingTexture();
                const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.8, color: 0xddddaa });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2.2;
                mesh.add(ring);
            }

            const pivot = new THREE.Group();
            pivot.add(mesh);
            mesh.position.x = p.distance;

            this.group.add(pivot);

            // Special Earth Clouds
            if (p.name === "Earth" && p.clouds) {
                this.createClouds(mesh, p.size, p.clouds);
            }

            if (p.name === "Earth") this.createMoon(mesh, 1.0, 6, 0.05, 0xaaaaaa);
            if (p.name === "Jupiter") {
                this.createMoon(mesh, 0.8, 14, 0.06, 0xffffaa);
                this.createMoon(mesh, 0.7, 16, 0.045, 0xeeeeff);
                this.createMoon(mesh, 1.2, 19, 0.03, 0xaaaaaa);
                this.createMoon(mesh, 1.0, 22, 0.02, 0x666666);
            }
            if (p.name === "Saturn") this.createMoon(mesh, 1.1, 16, 0.03, 0xffaa44);

            const orbitGeo = new THREE.RingGeometry(p.distance - 0.2, p.distance + 0.2, 128);
            const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.05 });
            const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
            orbitRing.rotation.x = Math.PI / 2;
            this.group.add(orbitRing);

            this.planets.push({ mesh, pivot, speed: p.speed });
        });

        this.createAsteroidBelt();
        // Add Sun to tour list essentially? No, focus on planets.
    }

    createClouds(parent, size, texturePath) {
        const geo = new THREE.SphereGeometry(size * 1.02, 64, 64);
        const mat = new THREE.MeshPhongMaterial({
            map: this.loader.load(texturePath),
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });
        const clouds = new THREE.Mesh(geo, mat);
        parent.add(clouds);
        // Store reference to rotate
        parent.userData.clouds = clouds;
    }

    createMoon(parent, size, distance, speed, color) {
        const geo = new THREE.SphereGeometry(size, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 });
        const moon = new THREE.Mesh(geo, mat);
        const pivot = new THREE.Group();
        pivot.add(moon);
        moon.position.x = distance;
        parent.add(pivot);
        if (!parent.userData.moons) parent.userData.moons = [];
        parent.userData.moons.push({ pivot, speed });
    }

    onPointerDown(event) {
        if (!this.active) return;
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.group.children, true);

        if (intersects.length > 0) {
            const hit = intersects.find(obj => obj.object.userData.isPlanet);
            if (hit) {
                this.stopTour(); // User interaction stops tour
                this.focusOn(hit.object);
            }
            else {
                if (intersects[0].distance > 500) this.resetFocus();
            }
        } else {
            this.resetFocus();
        }
    }

    startTour() {
        if (this.isTouring) return;
        this.isTouring = true;
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.focusOn(this.planets[0].mesh);
    }

    stopTour() {
        this.isTouring = false;
    }

    focusOn(mesh) {
        if (this.focusedPlanet === mesh) return; // Already there
        this.focusedPlanet = mesh;

        // Show UI
        const d = mesh.userData;
        this.uiContainer.innerHTML = `
            <h2 style="margin:0 0 10px 0; color:cyan; text-transform:uppercase;">${d.name}</h2>
            <div style="font-size:12px; color:#aaa; line-height:1.6;">
                <div><strong>Type:</strong> ${d.type}</div>
                <div><strong>Temp:</strong> ${d.temp}</div>
                <div style="margin-top:8px;">${d.info}</div>
            </div>
            <div style="margin-top:10px; font-size:10px; color:#666;">(Orbit Locked)</div>
            ${this.isTouring ? '<div style="color:yellow; margin-top:5px; font-size:9px;">🎥 AUTO-PILOT ON</div>' : ''}
        `;
        this.uiContainer.style.display = 'block';

        // Animate CAMERA to close up
        const targetPos = new THREE.Vector3();
        mesh.getWorldPosition(targetPos);

        // Determine Zoom Distance based on planet size
        const dist = (d.size || 5) * 4;

        // We set a flag to allow aggressive camera movement
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        // this.transitionStartPos = this.camera.position.clone();
    }

    resetFocus() {
        if (!this.focusedPlanet) return;
        this.stopTour(); // Stop tour on manual reset
        this.focusedPlanet = null;
        this.uiContainer.style.display = 'none';

        // Fly back to System View
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        this.transitionStartPos = this.camera.position.clone();
        this.transitionTargetPos = new THREE.Vector3(200, 200, 400);

        // Reset controls target
        this.controls.target.set(0, 0, 0);
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
    }

    createStarfield() {
        const count = 5000;
        const chars = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 400 + Math.random() * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            chars[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            chars[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            chars[i * 3 + 2] = r * Math.cos(phi);
            const col = new THREE.Color().setHex(Math.random() > 0.9 ? 0xaabbff : 0xffffff);
            colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(chars, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.8 });
        this.group.add(new THREE.Points(geo, mat));
    }

    createAsteroidBelt() {
        const count = 3000;
        const pts = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const distance = 125 + Math.random() * 25;
            const angle = Math.random() * Math.PI * 2;
            const h = (Math.random() - 0.5) * 4;
            pts[i * 3] = Math.cos(angle) * distance;
            pts[i * 3 + 1] = h;
            pts[i * 3 + 2] = Math.sin(angle) * distance;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        const mat = new THREE.PointsMaterial({ color: 0x888888, size: 0.8, transparent: true, opacity: 0.6 });
        const belt = new THREE.Points(geo, mat);
        this.asteroidBelt = belt;
        this.group.add(belt);
    }

    // ... helpers ...
    createRingTexture() {
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(0.1, 'rgba(255,255,255,0.8)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.2)'); grad.addColorStop(0.6, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 32);
        const tex = new THREE.CanvasTexture(canvas); tex.rotation = Math.PI / 2; return tex;
    }
    createGlowTexture() {
        const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 200, 100, 1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    show() {
        this.group.visible = true;
        this.active = true;
        // Ensure reset
        this.focusedPlanet = null;
        this.camera.position.set(200, 200, 400);
        this.controls.target.set(0, 0, 0);
        this.uiContainer.style.display = 'none';
        this.controls.enablePan = true;
    }

    hide() {
        this.group.visible = false;
        this.active = false;
        this.stopTour();
        this.uiContainer.style.display = 'none';
        this.focusedPlanet = null;
        if (this.cometSystem) this.cometSystem.cleanup();
    }

    update() {
        if (!this.active) return;
        this.time += 0.01;

        // 0. Update Comets
        if (this.cometSystem) this.cometSystem.update();

        // 1. Orbit Physics
        this.planets.forEach(p => {
            p.pivot.rotation.y += p.speed;
            p.mesh.rotation.y += 0.005;
            if (p.mesh.userData.moons) p.mesh.userData.moons.forEach(m => m.pivot.rotation.y += m.speed);
            if (p.mesh.userData.clouds) p.mesh.userData.clouds.rotation.y += 0.003; // Rotate clouds independently
        });
        if (this.asteroidBelt) this.asteroidBelt.rotation.y += 0.0003; // Slightly improved speed
        this.group.rotation.y += 0.00005;

        // 3. Auto-Pilot Tour
        if (this.isTouring) {
            this.tourTimer++;
            if (this.tourTimer > this.tourDuration) {
                // Next Planet
                this.tourIndex = (this.tourIndex + 1) % this.planets.length;
                this.focusOn(this.planets[this.tourIndex].mesh);
                this.tourTimer = 0;
            }
        }

        // 4. Camera Handling
        if (this.focusedPlanet) {
            const targetPos = new THREE.Vector3();
            this.focusedPlanet.getWorldPosition(targetPos);

            // Move LookAt
            this.controls.target.lerp(targetPos, 0.05);

            // Move Camera Closer (Orbiting)
            const dist = this.camera.position.distanceTo(targetPos);
            const data = this.focusedPlanet.userData;
            const idealDist = (data.size || 5) * 5;

            if (this.isTransitioning) {
                // Determine completion
                const elapsed = Date.now() - this.transitionStartTime;
                if (elapsed < 2000) {
                    // Lerp position manually to ideal offset
                    const offset = new THREE.Vector3(idealDist, idealDist / 2, idealDist); // Simple fixed angle approach
                    const desiredCamPos = targetPos.clone().add(offset);
                    this.camera.position.lerp(desiredCamPos, 0.03);
                } else {
                    this.isTransitioning = false;
                }
            } else {
                // Locked mode.. do nothing special, user can orbit
            }
            this.lastTargetPos = targetPos.clone();

        } else if (this.isTransitioning && this.transitionTargetPos) {
            // Reset transition
            this.camera.position.lerp(this.transitionTargetPos, 0.05);
            if (this.camera.position.distanceTo(this.transitionTargetPos) < 5) {
                this.isTransitioning = false;
                this.transitionTargetPos = null;
            }
        }
    }
    // AI Helper
    focusPlanetByName(name) {
        if (!name) return;
        const lowerName = name.toLowerCase();

        // Sun check
        if (lowerName === 'sun' || lowerName === 'the sun') {
            const sun = this.group.children.find(c => c.userData.name === 'The Sun');
            if (sun) this.focusOn(sun);
            return;
        }

        if (lowerName === 'start tour') {
            this.startTour();
            return;
        }

        const target = this.planets.find(p => p.mesh.userData.name.toLowerCase() === lowerName);
        if (target) {
            this.focusOn(target.mesh);
        } else {
            console.warn(`Planet ${name} not found.`);
        }
    }
}
