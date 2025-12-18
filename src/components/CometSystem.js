import * as THREE from 'three';

export class CometSystem {
  constructor(scene) {
    this.scene = scene;
    this.comets = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 5000; // Start with 5 seconds

    // geometry for particles
    this.particleGeo = new THREE.BufferGeometry();
    this.particleMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
  }

  createComet() {
    // Random starting position far away
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 200;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = (Math.random() - 0.5) * 100; // Some vertical variation

    // Target: Near the sun (0,0,0) but missing it slightly
    const targetX = (Math.random() - 0.5) * 50;
    const targetZ = (Math.random() - 0.5) * 50;

    const startPos = new THREE.Vector3(x, y, z);
    const targetPos = new THREE.Vector3(targetX, 0, targetZ);

    // Velocity vector
    const velocity = new THREE.Vector3().subVectors(targetPos, startPos).normalize().multiplyScalar(1.5 + Math.random()); // Speed

    // Head (The Comet Nucleus)
    const headGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.copy(startPos);

    // Glow Sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      color: 0x88ccff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(spriteMat);
    glow.scale.set(12, 12, 1);
    head.add(glow);

    // Tail Particles
    // We'll simulate a tail by dropping particles that fade
    const tailParticles = [];
    const tailGroup = new THREE.Group();

    this.scene.add(head);
    this.scene.add(tailGroup);

    return {
      head,
      tailGroup,
      velocity,
      life: 600, // Frames until death
      tailParticles
    };
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(100,200,255,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update() {
    const now = Date.now();

    // Spawn logic
    if (now - this.lastSpawnTime > this.spawnInterval) {
      console.log("☄️ Spawning Comet");
      this.comets.push(this.createComet());
      this.lastSpawnTime = now;
      this.spawnInterval = 3000 + Math.random() * 5000; // Randomize next spawn
    }

    // Update Comets
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const comet = this.comets[i];

      // Move Head
      comet.head.position.add(comet.velocity);

      // Add Tail Particle at current position
      this.spawnTailParticle(comet);

      // Update Tail Particles
      this.updateTail(comet);

      // Life cycle
      comet.life--;
      if (comet.life <= 0) {
        this.removeComet(comet, i);
      }
    }
  }

  spawnTailParticle(comet) {
    // Simple mock particle: just a small mesh that fades? 
    // Or creating a single geometry point.
    // Let's stick to small sprites for the tail, expensive but looks good.
    const pMat = this.particleMat.clone();
    const particle = new THREE.Sprite(pMat);
    particle.position.copy(comet.head.position);

    // Add random jitter to tail
    particle.position.x += (Math.random() - 0.5) * 2;
    particle.position.y += (Math.random() - 0.5) * 2;
    particle.position.z += (Math.random() - 0.5) * 2;

    particle.scale.set(1.5, 1.5, 1);

    comet.tailGroup.add(particle);
    comet.tailParticles.push({ mesh: particle, opacity: 0.6 });
  }

  updateTail(comet) {
    for (let i = comet.tailParticles.length - 1; i >= 0; i--) {
      const p = comet.tailParticles[i];
      p.opacity -= 0.015; // Fade out
      p.mesh.material.opacity = p.opacity; // Update material

      if (p.opacity <= 0) {
        comet.tailGroup.remove(p.mesh);
        comet.tailParticles.splice(i, 1);
      }
    }
  }

  removeComet(comet, index) {
    this.scene.remove(comet.head);
    this.scene.remove(comet.tailGroup);
    // Clean up memory if needed
    this.comets.splice(index, 1);
  }

  cleanup() {
    console.log("Comet system cleared");
    this.comets.forEach(c => {
      this.scene.remove(c.head);
      this.scene.remove(c.tailGroup);
    });
    this.comets = [];
  }
}
