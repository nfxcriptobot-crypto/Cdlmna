import * as THREE from 'three';
import { createPlayerMesh } from './models';
import { sound } from './audio';
import { BoundingBox3D } from './world';

export interface PlayerInput {
  moveForward: number; // -1 to 1
  moveRight: number;   // -1 to 1
  lookDeltaX: number;  // yaw change
  lookDeltaY: number;  // pitch change
  isFiring: boolean;
  isAiming: boolean;
  isSprinting: boolean;
  isJumping: boolean;
  reloadTriggered: boolean;
}

export class PlayerController {
  public mesh: THREE.Group;
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 24);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;   // horizontal camera/aim rotation
  public pitch: number = 0; // vertical camera rotation

  // Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 50;
  public maxArmor: number = 50;
  public ammo: number = 30;
  public maxMagazine: number = 30;
  public reserveAmmo: number = 120;
  public isReloading: boolean = false;
  public reloadProgress: number = 0;
  public isAiming: boolean = false;
  public isSprinting: boolean = false;
  public isGrounded: boolean = true;
  public isAlive: boolean = true;

  // Weapon recoil & timing
  private lastFireTime: number = 0;
  private fireRate: number = 0.11; // ~9 rounds per sec
  private muzzleFlashTimer: number = 0;
  private muzzleFlashMesh: THREE.Mesh | null = null;
  private muzzleLight: THREE.PointLight | null = null;
  private weaponMesh: THREE.Group | null = null;
  private weaponInitialPos: THREE.Vector3 = new THREE.Vector3();
  private footstepTimer: number = 0;

  // Camera Settings
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private defaultCamOffset: THREE.Vector3 = new THREE.Vector3(0.5, 1.7, 3.2);
  private aimCamOffset: THREE.Vector3 = new THREE.Vector3(0.35, 1.55, 1.8);
  private currentCamOffset: THREE.Vector3 = new THREE.Vector3(0.5, 1.7, 3.2);
  public cameraSensitivity: number = 1.0;

  // Collision
  private playerRadius = 0.45;
  private playerHeight = 1.85;

  constructor(camera: THREE.PerspectiveCamera, initialSpawn: THREE.Vector3) {
    this.camera = camera;
    this.position.copy(initialSpawn);

    this.mesh = createPlayerMesh();
    this.mesh.position.copy(this.position);

    this.weaponMesh = this.mesh.getObjectByName('Weapon') as THREE.Group;
    if (this.weaponMesh) {
      this.weaponInitialPos.copy(this.weaponMesh.position);
      this.muzzleFlashMesh = this.weaponMesh.getObjectByName('MuzzleFlash') as THREE.Mesh;
      this.muzzleLight = this.weaponMesh.getObjectByName('MuzzleLight') as THREE.PointLight;
    }
  }

  public update(
    delta: number,
    input: PlayerInput,
    colliders: BoundingBox3D[],
    onShootBullet: (origin: THREE.Vector3, direction: THREE.Vector3) => void
  ) {
    if (!this.isAlive) return;

    // 1. Process Look/Aim Deltas
    const sens = 0.003 * this.cameraSensitivity;
    this.yaw -= input.lookDeltaX * sens;
    this.pitch -= input.lookDeltaY * sens;
    // Clamp pitch between -1.1 and 0.9 radians (approx -63° to +51°)
    this.pitch = Math.max(-1.1, Math.min(0.9, this.pitch));

    this.isAiming = input.isAiming;
    this.isSprinting = input.isSprinting && !this.isAiming && (input.moveForward > 0.1);

    // 2. Movement Calculations
    const forwardVec = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const rightVec = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const speed = this.isAiming ? 3.0 : (this.isSprinting ? 8.5 : 5.2);
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forwardVec, input.moveForward);
    moveDir.addScaledVector(rightVec, input.moveRight);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Footsteps sound
      this.footstepTimer += delta * (this.isSprinting ? 1.6 : 1.0);
      if (this.isGrounded && this.footstepTimer > 0.38) {
        sound.playFootstep();
        this.footstepTimer = 0;
      }
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 10, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 10, delta);
    }

    // 3. Jump and Gravity
    if (input.isJumping && this.isGrounded) {
      this.velocity.y = 6.2;
      this.isGrounded = false;
      sound.playJump();
    }

    // Apply gravity
    this.velocity.y += -18.0 * delta;

    // 4. Collision Detection & Position Integration
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextY = this.position.y + this.velocity.y * delta;

    // Check X-axis collision
    if (!this.checkCollision(nextX, this.position.y, this.position.z, colliders)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    // Check Z-axis collision
    if (!this.checkCollision(this.position.x, this.position.y, nextZ, colliders)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    // Check Y-axis / Floor collision
    if (nextY <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      if (!this.checkCollision(this.position.x, nextY, this.position.z, colliders)) {
        this.position.y = nextY;
        this.isGrounded = false;
      } else {
        if (this.velocity.y < 0) {
          this.isGrounded = true;
        }
        this.velocity.y = 0;
      }
    }

    // Update mesh position and orientation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    // 5. Weapon Reload Logic
    if (input.reloadTriggered && !this.isReloading && this.ammo < this.maxMagazine && this.reserveAmmo > 0) {
      this.startReload();
    }

    if (this.isReloading) {
      this.reloadProgress += delta / 1.5; // 1.5 second reload
      if (this.reloadProgress >= 1) {
        const needed = this.maxMagazine - this.ammo;
        const loaded = Math.min(needed, this.reserveAmmo);
        this.ammo += loaded;
        this.reserveAmmo -= loaded;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // 6. Weapon Firing Logic
    const now = performance.now() / 1000;
    if (input.isFiring && !this.isReloading && now - this.lastFireTime >= this.fireRate) {
      if (this.ammo > 0) {
        this.ammo--;
        this.lastFireTime = now;
        sound.playGunshot();

        // Muzzle flash visibility & recoil
        this.muzzleFlashTimer = 0.06;
        if (this.muzzleFlashMesh) (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
        if (this.muzzleLight) this.muzzleLight.intensity = 3.5;

        // Weapon visual kick
        if (this.weaponMesh) {
          this.weaponMesh.position.z = this.weaponInitialPos.z - 0.08;
          this.weaponMesh.position.y = this.weaponInitialPos.y + 0.02;
        }

        // Camera vertical kick
        this.pitch += 0.012;

        // Calculate bullet trajectory from weapon muzzle into aim ray
        const muzzleWorldPos = new THREE.Vector3();
        if (this.weaponMesh) {
          this.weaponMesh.getWorldPosition(muzzleWorldPos);
          muzzleWorldPos.y += 0.02;
        } else {
          muzzleWorldPos.copy(this.position).add(new THREE.Vector3(0, 1.4, 0));
        }

        // Ray in camera aim direction
        const aimDir = new THREE.Vector3();
        this.camera.getWorldDirection(aimDir);

        // Subtle spread
        const spreadFactor = this.isAiming ? 0.008 : (this.isSprinting ? 0.05 : 0.02);
        aimDir.x += (Math.random() - 0.5) * spreadFactor;
        aimDir.y += (Math.random() - 0.5) * spreadFactor;
        aimDir.z += (Math.random() - 0.5) * spreadFactor;
        aimDir.normalize();

        onShootBullet(muzzleWorldPos, aimDir);
      } else {
        // Empty magazine click - auto reload
        if (this.reserveAmmo > 0) {
          this.startReload();
        }
      }
    }

    // Dissipate muzzle flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        if (this.muzzleFlashMesh) (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        if (this.muzzleLight) this.muzzleLight.intensity = 0;
      }
    }

    // Recover weapon recoil position
    if (this.weaponMesh) {
      this.weaponMesh.position.z = THREE.MathUtils.damp(this.weaponMesh.position.z, this.weaponInitialPos.z, 15, delta);
      this.weaponMesh.position.y = THREE.MathUtils.damp(this.weaponMesh.position.y, this.weaponInitialPos.y, 15, delta);
    }

    // 7. Update Third-Person Camera Position
    const targetOffset = this.isAiming ? this.aimCamOffset : this.defaultCamOffset;
    this.currentCamOffset.lerp(targetOffset, delta * 8);

    // Target FOV zoom
    const targetFov = this.isAiming ? 46 : 65;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 10, delta);
    this.camera.updateProjectionMatrix();

    // Compute camera location behind player
    const camMatrix = new THREE.Matrix4();
    const rotY = new THREE.Matrix4().makeRotationY(this.yaw);
    const rotX = new THREE.Matrix4().makeRotationX(this.pitch);
    camMatrix.multiply(rotY).multiply(rotX);

    const camPosRel = this.currentCamOffset.clone().applyMatrix4(camMatrix);
    const desiredCamPos = this.position.clone().add(camPosRel);

    this.camera.position.copy(desiredCamPos);

    // Look at player chest/head plus aim offset
    this.cameraTarget.copy(this.position).add(new THREE.Vector3(0, 1.4, 0));
    const forwardLook = new THREE.Vector3(0, 0, -10).applyMatrix4(camMatrix);
    this.camera.lookAt(this.cameraTarget.clone().add(forwardLook));
  }

  private startReload() {
    this.isReloading = true;
    this.reloadProgress = 0;
    sound.playReload();
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;

    // Shield/Armor absorbs first
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }

    if (amount > 0) {
      this.health = Math.max(0, this.health - amount);
      sound.playPlayerHurt();
    }

    if (this.health <= 0) {
      this.isAlive = false;
      this.health = 0;
      // Ragdoll collapse backward
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y = 0.2;
      return true; // Fatal hit
    }
    return false;
  }

  public addHealth(amt: number) {
    this.health = Math.min(this.maxHealth, this.health + amt);
    sound.playPickup();
  }

  public addAmmo(amt: number) {
    this.reserveAmmo += amt;
    sound.playPickup();
  }

  private checkCollision(x: number, y: number, z: number, colliders: BoundingBox3D[]): boolean {
    const minPX = x - this.playerRadius;
    const maxPX = x + this.playerRadius;
    const minPZ = z - this.playerRadius;
    const maxPZ = z + this.playerRadius;
    const minPY = y;
    const maxPY = y + this.playerHeight;

    for (let c of colliders) {
      if (
        maxPX > c.minX &&
        minPX < c.maxX &&
        maxPZ > c.minZ &&
        minPZ < c.maxZ &&
        maxPY > c.minY &&
        minPY < c.maxY
      ) {
        return true;
      }
    }
    return false;
  }

  public reset(spawnPos: THREE.Vector3) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.health = 100;
    this.armor = 50;
    this.ammo = 30;
    this.reserveAmmo = 120;
    this.isAlive = true;
    this.isReloading = false;
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.position.copy(this.position);
  }
}
