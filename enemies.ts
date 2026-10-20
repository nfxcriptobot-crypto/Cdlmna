import * as THREE from 'three';
import { createEnemyMesh, createPickupDrop } from './models';
import { sound } from './audio';
import { BoundingBox3D } from './world';

export type EnemyState = 'PATROL' | 'ALERT' | 'ATTACK' | 'DEAD';

export interface EnemyDrop {
  mesh: THREE.Group;
  type: 'ammo' | 'health';
  position: THREE.Vector3;
}

export class EnemyController {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3();
  public state: EnemyState = 'PATROL';
  public isHeavy: boolean = false;
  public health: number = 100;
  public maxHealth: number = 100;
  public isAlive: boolean = true;

  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIndex: number = 0;
  private speed: number = 3.2;
  private attackRange: number = 18;
  private detectionRadius: number = 20;

  // Firing logic
  private lastFireTime: number = 0;
  private burstCount: number = 0;
  private burstTimer: number = 0;
  private hitFlashTimer: number = 0;

  // UI / Visuals
  private healthBarBg: THREE.Mesh | null = null;
  private healthBarFill: THREE.Mesh | null = null;
  private bodyMaterials: THREE.MeshStandardMaterial[] = [];

  constructor(spawnPos: THREE.Vector3, isHeavy = false, waypoints: THREE.Vector3[] = []) {
    this.isHeavy = isHeavy;
    this.maxHealth = isHeavy ? 180 : 80;
    this.health = this.maxHealth;
    this.speed = isHeavy ? 2.5 : 3.6;
    this.position.copy(spawnPos);
    this.waypoints = waypoints;

    this.mesh = createEnemyMesh(isHeavy);
    this.mesh.position.copy(this.position);

    // Cache health bar components
    this.healthBarBg = this.mesh.getObjectByName('HealthBarBg') as THREE.Mesh;
    if (this.healthBarBg) {
      this.healthBarFill = this.healthBarBg.getObjectByName('HealthBarFill') as THREE.Mesh;
    }

    // Cache materials for hit flash
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => { if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) this.bodyMaterials.push(m as THREE.MeshStandardMaterial); });
        } else if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          this.bodyMaterials.push(mat as THREE.MeshStandardMaterial);
        }
      }
    });
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    camera: THREE.Camera,
    colliders: BoundingBox3D[],
    onEnemyFire: (from: THREE.Vector3, to: THREE.Vector3) => void,
    onEnemyDefeated: (enemy: EnemyController) => void
  ) {
    if (!this.isAlive) return;

    // Billboard health bar to face camera
    if (this.healthBarBg) {
      this.healthBarBg.quaternion.copy(camera.quaternion);
    }

    // Process hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.resetMaterialColors();
      }
    }

    const distToPlayer = this.position.distanceTo(playerPos);

    // State Transitions
    if (this.state === 'PATROL') {
      if (distToPlayer < this.detectionRadius) {
        this.state = 'ALERT';
      }
    }

    if (this.state === 'ALERT') {
      if (distToPlayer < this.attackRange) {
        this.state = 'ATTACK';
      } else if (distToPlayer > this.detectionRadius * 1.5) {
        this.state = 'PATROL';
      }
    }

    // Behavior Execution
    if (this.state === 'PATROL') {
      this.patrolBehavior(delta, colliders);
    } else if (this.state === 'ALERT' || this.state === 'ATTACK') {
      this.combatBehavior(delta, playerPos, distToPlayer, colliders, onEnemyFire);
    }
  }

  private patrolBehavior(delta: number, colliders: BoundingBox3D[]) {
    if (this.waypoints.length === 0) return;

    const targetNode = this.waypoints[this.currentWaypointIndex];
    const toNode = new THREE.Vector3().subVectors(targetNode, this.position);
    toNode.y = 0;
    const dist = toNode.length();

    if (dist < 1.0) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      toNode.normalize();
      this.moveTowards(toNode, this.speed * 0.7, delta, colliders);

      // Smooth rotate towards target
      const targetAngle = Math.atan2(toNode.x, toNode.z);
      this.mesh.rotation.y = THREE.MathUtils.damp(this.mesh.rotation.y, targetAngle, 6, delta);
    }
  }

  private combatBehavior(
    delta: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    colliders: BoundingBox3D[],
    onEnemyFire: (from: THREE.Vector3, to: THREE.Vector3) => void
  ) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    toPlayer.y = 0;
    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    this.mesh.rotation.y = THREE.MathUtils.damp(this.mesh.rotation.y, targetAngle, 8, delta);

    // Advance if too far, keep cover distance if in sweet spot (7 - 14 meters)
    if (distToPlayer > 12) {
      toPlayer.normalize();
      this.moveTowards(toPlayer, this.speed, delta, colliders);
    } else if (distToPlayer < 5) {
      // Backpedal slightly
      toPlayer.normalize().negate();
      this.moveTowards(toPlayer, this.speed * 0.6, delta, colliders);
    }

    // Firing in bursts
    const now = performance.now() / 1000;
    if (now - this.lastFireTime > (this.isHeavy ? 1.6 : 2.2)) {
      this.burstTimer += delta;
      if (this.burstTimer > 0.16) {
        this.burstTimer = 0;
        this.burstCount++;

        // Fire shot
        const muzzlePos = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const targetPoint = playerPos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          0.9 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.6
        ));

        sound.playEnemyGunshot();
        onEnemyFire(muzzlePos, targetPoint);

        if (this.burstCount >= (this.isHeavy ? 4 : 3)) {
          this.burstCount = 0;
          this.lastFireTime = now;
        }
      }
    }
  }

  private moveTowards(dir: THREE.Vector3, spd: number, delta: number, colliders: BoundingBox3D[]) {
    const nextX = this.position.x + dir.x * spd * delta;
    const nextZ = this.position.z + dir.z * spd * delta;

    // Simple collision check against scenery
    let blockedX = false;
    let blockedZ = false;
    const r = 0.5;

    for (let c of colliders) {
      if (nextX + r > c.minX && nextX - r < c.maxX && this.position.z + r > c.minZ && this.position.z - r < c.maxZ) {
        blockedX = true;
      }
      if (this.position.x + r > c.minX && this.position.x - r < c.maxX && nextZ + r > c.minZ && nextZ - r < c.maxZ) {
        blockedZ = true;
      }
    }

    if (!blockedX) this.position.x = nextX;
    if (!blockedZ) this.position.z = nextZ;

    this.mesh.position.copy(this.position);
  }

  public takeDamage(amount: number, onEnemyDefeated: (enemy: EnemyController) => void): boolean {
    if (!this.isAlive) return false;

    this.health = Math.max(0, this.health - amount);
    this.state = 'ATTACK'; // Alert on hit immediately

    // Update 3D health bar
    if (this.healthBarFill) {
      const pct = this.health / this.maxHealth;
      this.healthBarFill.scale.x = Math.max(0.001, pct);
      this.healthBarFill.position.x = -(0.76 * (1 - pct)) / 2;
    }

    // Flash white/red
    this.hitFlashTimer = 0.12;
    this.bodyMaterials.forEach((m) => {
      m.emissive.setHex(0xff3333);
      m.emissiveIntensity = 0.8;
    });

    if (this.health <= 0) {
      this.isAlive = false;
      this.state = 'DEAD';
      sound.playEnemyDown();

      // Collapse flat
      this.mesh.rotation.x = -Math.PI / 2;
      this.mesh.position.y = 0.2;
      if (this.healthBarBg) this.healthBarBg.visible = false;

      onEnemyDefeated(this);
      return true; // Eliminated
    }

    return false;
  }

  private resetMaterialColors() {
    this.bodyMaterials.forEach((m) => {
      m.emissive.setHex(0x000000);
      m.emissiveIntensity = 0;
    });
  }
}
