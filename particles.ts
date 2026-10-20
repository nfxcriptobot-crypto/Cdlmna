import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

interface BulletTracer {
  start: THREE.Vector3;
  end: THREE.Vector3;
  line: THREE.Line;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private tracers: BulletTracer[] = [];
  private pointsMesh: THREE.Points;
  private geo: THREE.BufferGeometry;
  private maxParticles = 600;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const pMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geo, pMat);
    this.pointsMesh.frustumCulled = false;
    this.scene.add(this.pointsMesh);
  }

  // Create sparks upon bullet collision
  public spawnSparks(pos: THREE.Vector3, normal: THREE.Vector3, isEnemyHit = false) {
    const count = isEnemyHit ? 16 : 10;
    const baseColor = isEnemyHit ? new THREE.Color(0xff2222) : new THREE.Color(0xfbbf24);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const spread = 1.2;
      const vel = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + (Math.random() - 0.5) * spread + 0.4,
        normal.z + (Math.random() - 0.5) * spread
      ).multiplyScalar(4 + Math.random() * 5);

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1)),
        velocity: vel,
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2),
        size: 0.15 + Math.random() * 0.2,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.3,
      });
    }
  }

  // Spawn Bullet Tracer beam
  public spawnTracer(from: THREE.Vector3, to: THREE.Vector3, isPlayer = true) {
    const mat = new THREE.LineBasicMaterial({
      color: isPlayer ? 0x38bdf8 : 0xef4444,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });

    const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    this.tracers.push({
      start: from.clone(),
      end: to.clone(),
      line,
      life: 0,
      maxLife: 0.08,
    });
  }

  // Update particles frame by frame
  public update(delta: number) {
    // 1. Update point particles
    const gravity = -14;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += gravity * delta;
      p.position.addScaledVector(p.velocity, delta);
    }

    // Update GPU buffers
    const activeCount = Math.min(this.particles.length, this.maxParticles);
    for (let i = 0; i < activeCount; i++) {
      const p = this.particles[i];
      const alpha = 1 - p.life / p.maxLife;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      this.colors[i * 3] = p.color.r * alpha;
      this.colors[i * 3 + 1] = p.color.g * alpha;
      this.colors[i * 3 + 2] = p.color.b * alpha;

      this.sizes[i] = p.size * alpha;
    }

    // Clear unused slots
    for (let i = activeCount; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;

    // 2. Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life += delta;
      const alpha = 1 - t.life / t.maxLife;

      if (alpha <= 0) {
        this.scene.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      } else {
        (t.line.material as THREE.LineBasicMaterial).opacity = alpha;
      }
    }
  }

  public dispose() {
    this.scene.remove(this.pointsMesh);
    this.geo.dispose();
    (this.pointsMesh.material as THREE.Material).dispose();
    for (const t of this.tracers) {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      (t.line.material as THREE.Material).dispose();
    }
    this.tracers = [];
    this.particles = [];
  }
}
