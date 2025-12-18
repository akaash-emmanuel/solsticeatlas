
import * as THREE from "three";

export class ExoplanetManager {
    constructor(scene, camera, controls) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.group = new THREE.Group();
        this.active = false;

        this.scene.add(this.group);
        this.group.visible = false;
    }

    enable() {
        this.active = true;
        this.group.visible = true;
        this.generate();

        // Reset Camera
        this.camera.position.set(0, 0, 50);
        this.controls.target.set(0, 0, 0);
    }

    disable() {
        this.active = false;
        this.group.visible = false;
        // Clear old
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
    }

    generate() {
        // Clear
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const r = Math.random();

        // 1. Planet Mesh
        const size = 10;
        const geo = new THREE.IcosahedronGeometry(size, 4); // Low-ish poly or high?

        // Random Material
        const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: Math.random(),
            metalness: Math.random() * 0.5,
            wireframe: Math.random() > 0.9
        });

        const mesh = new THREE.Mesh(geo, mat);
        this.group.add(mesh);

        // 2. Rings? (50% chance)
        if (Math.random() > 0.5) {
            const ringGeo = new THREE.RingGeometry(size * 1.4, size * 2.2, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.group.add(ring);
        }

        // 3. Atmosphere Halo?
        const atmGeo = new THREE.SphereGeometry(size * 1.2, 32, 32);
        const atmMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.1, side: THREE.BackSide });
        const atm = new THREE.Mesh(atmGeo, atmMat);
        this.group.add(atm);

        // Light
        const light = new THREE.PointLight(0xffffff, 2, 100);
        light.position.set(30, 30, 30);
        this.group.add(light);
    }

    update() {
        if (this.active) {
            this.group.rotation.y += 0.002;
        }
    }
}
