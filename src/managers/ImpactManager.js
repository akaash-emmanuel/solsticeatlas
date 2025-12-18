
import * as THREE from "three";

export class ImpactManager {
    constructor(scene, camera, globe) {
        this.scene = scene;
        this.camera = camera;
        this.globe = globe;
        this.active = false;
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.meteors = [];
        this.explosions = [];

        // HUD
        this.hud = this.createHUD();

        window.addEventListener('pointerdown', this.onClick.bind(this));
    }

    createHUD() {
        const div = document.createElement('div');
        Object.assign(div.style, {
            position: 'absolute', top: '100px', right: '20px',
            background: 'rgba(50, 0, 0, 0.8)', border: '2px solid red',
            color: 'red', fontFamily: 'Courier New, monospace', padding: '10px',
            display: 'none', borderRadius: '4px', maxWidth: '300px'
        });
        document.body.appendChild(div);
        return div;
    }

    enable() {
        this.active = true;
        this.hud.style.display = 'block';
        this.hud.innerHTML = "<h3>⚠️ IMPACT MODE ACTIVE</h3><p>CLICK TARGET TO LAUNCH</p>";
    }

    disable() {
        this.active = false;
        this.hud.style.display = 'none';
        // Cleanup active meteors?
    }

    onClick(event) {
        if (!this.active) return;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObject(this.globe, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.launchMeteor(point);
        }
    }

    launchMeteor(targetPoint) {
        // Create Meteor
        const geo = new THREE.DodecahedronGeometry(1.5, 0); // Low poly rock
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0 });
        const mesh = new THREE.Mesh(geo, mat);

        // Start high up
        const startPos = targetPoint.clone().normalize().multiplyScalar(180); // 180 units out (Globe is ~100)
        mesh.position.copy(startPos);
        mesh.lookAt(targetPoint);

        this.scene.add(mesh);
        this.meteors.push({ mesh, target: targetPoint, speed: 2.0 });

        this.hud.innerHTML = `<h3>⚠️ ALERT</h3><p>INBOUND PROJECTILE DETECTED</p>`;
    }

    update() {
        // Animate Meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            const dist = m.mesh.position.distanceTo(m.target);

            if (dist < 1) {
                // Impact!
                this.explode(m.target);
                this.scene.remove(m.mesh);
                this.meteors.splice(i, 1);
            } else {
                // Move logic
                m.mesh.position.lerp(m.target, 0.1);
                m.mesh.rotation.z += 0.1;
            }
        }

        // Animate Explosions
        this.explosions.forEach((ex, i) => {
            ex.material.opacity -= 0.02;
            ex.scale.multiplyScalar(1.1);
            if (ex.material.opacity <= 0) {
                this.scene.remove(ex);
                this.explosions.splice(i, 1);
            }
        });
    }

    explode(point) {
        // Visual
        const geo = new THREE.SphereGeometry(2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 1 });
        const boom = new THREE.Mesh(geo, mat);
        boom.position.copy(point);
        this.scene.add(boom);
        this.explosions.push(boom);

        // Stats
        const tnt = Math.floor(Math.random() * 500) + 50;
        const casualties = (Math.random() * 5).toFixed(1); // Million
        this.hud.innerHTML = `
            <h3>💥 IMPACT CONFIRMED</h3>
            <div style="font-size:12px; line-height:1.5;">
            YIELD: ${tnt} MEGATONS<br>
            CRATER: ${Math.floor(tnt * 0.5)} KM<br>
            CASUALTIES: ${casualties}M (EST)
            </div>
        `;
    }
}
