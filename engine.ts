import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildCombatOutpostScene, MapData, BoundingBox3D } from './world';
import { PlayerController, PlayerInput } from './player';
import { EnemyController, EnemyDrop } from './enemies';
import { ParticleSystem } from './particles';
import { createPickupDrop } from './models';
import { sound } from './audio';

export interface MissionConfig {
  id: number;
  title: string;
  codename: string;
  objectiveText: string;
  targetKills: number;
  timeLimit?: number;
  difficulty: 'STANDARD' | 'HARD' | 'NIGHTMARE';
}

export interface EngineStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  isAiming: boolean;
  isSprinting: boolean;
  score: number;
  kills: number;
  targetKills: number;
  missionStatus: 'ACTIVE' | 'VICTORY' | 'DEFEAT';
  objectiveText: string;
  canExtract: boolean;
  radarData: {
    playerYaw: number;
    playerX: number;
    playerZ: number;
    enemies: Array<{ x: number; z: number; isAlive: boolean; isAlert: boolean }>;
    drops: Array<{ x: number; z: number; type: 'ammo' | 'health' }>;
    extraction: { x: number; z: number; inRange: boolean };
  };
  hitMarkerActive: boolean;
  damageVignette: number; // 0 to 1
}

export class GameEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  private mapData: MapData;
  public player: PlayerController;
  private enemies: EnemyController[] = [];
  private drops: EnemyDrop[] = [];
  private particles: ParticleSystem;

  public mission: MissionConfig;
  public score: number = 0;
  public kills: number = 0;
  public missionStatus: 'ACTIVE' | 'VICTORY' | 'DEFEAT' = 'ACTIVE';
  private canExtract: boolean = false;

  private hitMarkerTimer: number = 0;
  private damageVignetteTimer: number = 0;
  private onStatsUpdate?: (stats: EngineStats) => void;

  // Reusable raycaster to avoid GC
  private bulletRay = new THREE.Raycaster();
  private sceneryMeshes: THREE.Object3D[] = [];

  constructor(
    container: HTMLElement,
    mission: MissionConfig,
    graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH',
    onStatsUpdate?: (stats: EngineStats) => void
  ) {
    this.container = container;
    this.mission = mission;
    this.onStatsUpdate = onStatsUpdate;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.016);

    // 2. Camera & Viewport
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 150);

    // 3. Renderer with high-fidelity PBR pipeline
    this.renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'LOW',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, graphicsQuality === 'HIGH' ? 2 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    if (graphicsQuality !== 'LOW') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Studio Environment map reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    container.appendChild(this.renderer.domElement);

    // 4. Build Combat Arena World
    this.mapData = buildCombatOutpostScene();
    this.scene.add(this.mapData.worldGroup);

    // Collect scenery meshes for collision raycasting
    this.mapData.worldGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'HeliRing') {
        this.sceneryMeshes.push(obj);
      }
    });

    // 5. Player
    this.player = new PlayerController(this.camera, this.mapData.playerSpawn);
    this.scene.add(this.player.mesh);

    // 6. Particles
    this.particles = new ParticleSystem(this.scene);

    // 7. Spawn Enemies according to mission target
    this.spawnMissionEnemies();

    // Resize listeners
    window.addEventListener('resize', this.onWindowResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(container);
    }

    sound.startCombatBGM();
  }

  private spawnMissionEnemies() {
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];

    const spawns = this.mapData.enemySpawns.slice(0, Math.min(this.mission.targetKills + 2, this.mapData.enemySpawns.length));
    spawns.forEach((spawn, idx) => {
      // Rotate patrol waypoints
      const wp = [...this.mapData.patrolNodes];
      for (let i = 0; i < idx % wp.length; i++) {
        const first = wp.shift();
        if (first) wp.push(first);
      }

      const enemy = new EnemyController(spawn.position, spawn.isHeavy, wp);
      this.enemies.push(enemy);
      this.scene.add(enemy.mesh);
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      sound.stopCombatBGM();
    } else {
      sound.startCombatBGM();
    }
  }

  public inputSupplier: (() => PlayerInput) | null = null;
  private resizeObserver?: ResizeObserver;
  private lastStatsDispatchTime: number = 0;

  public loop = () => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(0.08, this.clock.getDelta());

    if (!this.isPaused) {
      // 1. Process player input & update character
      if (this.inputSupplier && this.missionStatus === 'ACTIVE') {
        const input = this.inputSupplier();
        this.player.update(delta, input, this.mapData.colliders, (origin, direction) => {
          this.handlePlayerShooting(origin, direction);
        });

        // 2. Update all enemies with the same exact delta
        for (const enemy of this.enemies) {
          enemy.update(
            delta,
            this.player.position,
            this.camera,
            this.mapData.colliders,
            (from, to) => this.handleEnemyShooting(from, to),
            (defeated) => this.handleEnemyDefeated(defeated)
          );
        }
      }

      // 3. Update particle effects
      this.particles.update(delta);

      // 4. Pulse helipad extraction beacon
      const heliRing = this.mapData.extractionZone.mesh.getObjectByName('HeliRing') as THREE.Mesh;
      if (heliRing) {
        const pulse = 0.5 + 0.5 * Math.sin(this.clock.elapsedTime * 4);
        (heliRing.material as THREE.MeshBasicMaterial).color.setHex(this.canExtract ? 0x22c55e : 0x38bdf8);
        (heliRing.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * pulse;
      }

      // 5. Hit markers & screen flash decay
      if (this.hitMarkerTimer > 0) this.hitMarkerTimer -= delta;
      if (this.damageVignetteTimer > 0) this.damageVignetteTimer -= delta;

      // 6. Rotate supply drops and check player pickup distance
      this.updateDrops(delta);

      // 7. Extraction zone check
      const distToExtract = this.player.position.distanceTo(this.mapData.extractionZone.position);
      if (this.kills >= this.mission.targetKills) {
        this.canExtract = true;
        if (distToExtract < this.mapData.extractionZone.radius && this.missionStatus === 'ACTIVE') {
          this.triggerVictory();
        }
      }
    }

    this.renderer.render(this.scene, this.camera);

    const now = performance.now();
    if (now - this.lastStatsDispatchTime > 66) {
      this.lastStatsDispatchTime = now;
      this.dispatchStats();
    }
  };

  private handlePlayerShooting(origin: THREE.Vector3, direction: THREE.Vector3) {
    this.bulletRay.set(origin, direction);
    this.bulletRay.far = 80;

    // 1. Check intersection with enemies
    let closestEnemyHit: { enemy: EnemyController; point: THREE.Vector3; distance: number } | null = null;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;
      const hits = this.bulletRay.intersectObject(enemy.mesh, true);
      if (hits.length > 0) {
        const d = hits[0].distance;
        if (!closestEnemyHit || d < closestEnemyHit.distance) {
          closestEnemyHit = { enemy, point: hits[0].point, distance: d };
        }
      }
    }

    // 2. Check intersection with scenery
    const sceneryHits = this.bulletRay.intersectObjects(this.sceneryMeshes, false);
    let hitPoint = origin.clone().addScaledVector(direction, 60);
    let hitNormal = new THREE.Vector3(0, 1, 0);

    if (sceneryHits.length > 0) {
      const sHit = sceneryHits[0];
      if (!closestEnemyHit || sHit.distance < closestEnemyHit.distance) {
        hitPoint = sHit.point;
        if (sHit.face) hitNormal = sHit.face.normal;
        this.particles.spawnSparks(hitPoint, hitNormal, false);
      }
    }

    // 3. Resolve Enemy Damage
    if (closestEnemyHit && (!sceneryHits.length || closestEnemyHit.distance < sceneryHits[0].distance)) {
      hitPoint = closestEnemyHit.point;
      this.particles.spawnSparks(hitPoint, new THREE.Vector3(0, 1, 0), true);

      // Hit marker
      this.hitMarkerTimer = 0.14;
      sound.playHitMarker();

      // Damage calculation (Headshot multiplier if high Y)
      const isHeadshot = hitPoint.y > closestEnemyHit.enemy.position.y + 1.45;
      const damage = isHeadshot ? 55 : 32;

      closestEnemyHit.enemy.takeDamage(damage, (e) => this.handleEnemyDefeated(e));
      this.score += isHeadshot ? 75 : 40;
    }

    // Visual Tracer Line
    this.particles.spawnTracer(origin, hitPoint, true);
  }

  private handleEnemyShooting(from: THREE.Vector3, to: THREE.Vector3) {
    if (!this.player.isAlive || this.missionStatus !== 'ACTIVE') return;

    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    this.particles.spawnTracer(from, to, false);

    // Accuracy test against player
    const distToPlayer = from.distanceTo(this.player.position);
    const hitChance = Math.max(0.2, 0.7 - distToPlayer * 0.02);

    if (Math.random() < hitChance) {
      const dmg = 12 + Math.floor(Math.random() * 8);
      const isFatal = this.player.takeDamage(dmg);

      this.damageVignetteTimer = 0.35;

      if (isFatal) {
        this.missionStatus = 'DEFEAT';
        sound.stopCombatBGM();
      }
    }
  }

  private handleEnemyDefeated(enemy: EnemyController) {
    this.kills++;
    this.score += enemy.isHeavy ? 300 : 150;

    // Spawn pickup crate at enemy position (50% ammo, 50% medkit)
    const dropType = Math.random() > 0.4 ? 'ammo' : 'health';
    const dropMesh = createPickupDrop(dropType);
    dropMesh.position.copy(enemy.position);
    this.scene.add(dropMesh);

    this.drops.push({
      mesh: dropMesh,
      type: dropType,
      position: enemy.position.clone(),
    });

    if (this.kills >= this.mission.targetKills) {
      this.canExtract = true;
    }
  }

  private updateDrops(delta: number) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.mesh.rotation.y += delta * 1.8;
      drop.mesh.position.y = 0.3 + Math.sin(this.clock.elapsedTime * 3) * 0.08;

      // Check distance to player
      const dist = this.player.position.distanceTo(drop.mesh.position);
      if (dist < 1.6) {
        if (drop.type === 'ammo') {
          this.player.addAmmo(30);
        } else {
          this.player.addHealth(35);
        }
        this.scene.remove(drop.mesh);
        this.drops.splice(i, 1);
      }
    }
  }

  private triggerVictory() {
    this.missionStatus = 'VICTORY';
    sound.stopCombatBGM();
    sound.playVictory();
    this.score += 1000;
  }

  public restart(missionConfig?: MissionConfig) {
    if (missionConfig) this.mission = missionConfig;
    this.score = 0;
    this.kills = 0;
    this.missionStatus = 'ACTIVE';
    this.canExtract = false;

    // Clear drops
    this.drops.forEach((d) => this.scene.remove(d.mesh));
    this.drops = [];

    // Reset player
    this.player.reset(this.mapData.playerSpawn);

    // Respawn enemies
    this.spawnMissionEnemies();

    sound.startCombatBGM();
  }

  private dispatchStats() {
    if (!this.onStatsUpdate) return;

    const distToExtract = this.player.position.distanceTo(this.mapData.extractionZone.position);

    const stats: EngineStats = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
      ammo: this.player.ammo,
      reserveAmmo: this.player.reserveAmmo,
      isReloading: this.player.isReloading,
      reloadProgress: this.player.reloadProgress,
      isAiming: this.player.isAiming,
      isSprinting: this.player.isSprinting,
      score: this.score,
      kills: this.kills,
      targetKills: this.mission.targetKills,
      missionStatus: this.missionStatus,
      objectiveText: this.canExtract
        ? 'PROCEED TO EXTRACTION HELIPAD'
        : `ELIMINATE HOSTILES (${this.kills}/${this.mission.targetKills})`,
      canExtract: this.canExtract,
      radarData: {
        playerYaw: this.player.yaw,
        playerX: this.player.position.x,
        playerZ: this.player.position.z,
        enemies: this.enemies.map((e) => ({
          x: e.position.x,
          z: e.position.z,
          isAlive: e.isAlive,
          isAlert: e.state !== 'PATROL',
        })),
        drops: this.drops.map((d) => ({
          x: d.position.x,
          z: d.position.z,
          type: d.type,
        })),
        extraction: {
          x: this.mapData.extractionZone.position.x,
          z: this.mapData.extractionZone.position.z,
          inRange: distToExtract < this.mapData.extractionZone.radius,
        },
      },
      hitMarkerActive: this.hitMarkerTimer > 0,
      damageVignette: Math.max(0, this.damageVignetteTimer / 0.35),
    };

    this.onStatsUpdate(stats);
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth || 800;
    const h = this.container.clientHeight || window.innerHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.isRunning = false;
    sound.stopCombatBGM();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.particles.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
