import * as THREE from 'three';

// Procedural 3-12 Part Models for Shadow Strike: Survival
// Fully procedural geometries & PBR materials following Three.js guidelines

export function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PlayerCharacter';

  // Materials with varied roughness/metalness
  const camoUniformMat = new THREE.MeshStandardMaterial({
    color: 0x2e382d, // Tactical olive drab
    roughness: 0.85,
    metalness: 0.1,
  });

  const tacticalVestMat = new THREE.MeshStandardMaterial({
    color: 0x181c19, // Dark Kevlar plate
    roughness: 0.5,
    metalness: 0.35,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x222a22,
    roughness: 0.4,
    metalness: 0.4,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, // Cyber tactical cyan visor glow
    emissive: 0x00b0ff,
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.9,
  });

  const bootsMat = new THREE.MeshStandardMaterial({
    color: 0x111311,
    roughness: 0.9,
    metalness: 0.2,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x7c5844,
    roughness: 0.7,
    metalness: 0.05,
  });

  // 1. Torso & Combat Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.3), camoUniformMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  const vestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.36), tacticalVestMat);
  vestPlate.position.set(0, 1.18, 0);
  vestPlate.castShadow = true;
  group.add(vestPlate);

  // Tactical Pouches on Vest
  for (let i = -1; i <= 1; i++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.08), tacticalVestMat);
    pouch.position.set(i * 0.16, 1.05, 0.19);
    pouch.castShadow = true;
    group.add(pouch);
  }

  // Radio Backpack with antenna
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.18), tacticalVestMat);
  backpack.position.set(0, 1.2, -0.25);
  backpack.castShadow = true;
  group.add(backpack);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.45, 6), tacticalVestMat);
  antenna.position.set(0.14, 1.5, -0.28);
  group.add(antenna);

  // 2. Head & Tactical Helmet
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skinMat);
  head.position.y = 1.62;
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.36), helmetMat);
  helmet.position.set(0, 1.72, -0.02);
  helmet.castShadow = true;
  group.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), visorMat);
  visor.position.set(0, 1.63, 0.16);
  group.add(visor);

  // 3. Legs
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), camoUniformMat);
  leftLeg.position.set(-0.16, 0.52, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), camoUniformMat);
  rightLeg.position.set(0.16, 0.52, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Boots
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.3), bootsMat);
  leftBoot.position.set(-0.16, 0.1, 0.04);
  leftBoot.castShadow = true;
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.3), bootsMat);
  rightBoot.position.set(0.16, 0.1, 0.04);
  rightBoot.castShadow = true;
  group.add(rightBoot);

  // 4. Arms & Weapon
  const armMat = camoUniformMat;
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), armMat);
  leftArm.position.set(-0.35, 1.15, 0.12);
  leftArm.rotation.x = 0.4;
  leftArm.rotation.z = -0.2;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), armMat);
  rightArm.position.set(0.35, 1.15, 0.12);
  rightArm.rotation.x = 0.5;
  rightArm.rotation.z = 0.2;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Weapon: AR-7 Viper Tactical Rifle
  const rifle = createAssaultRifle();
  rifle.name = 'Weapon';
  rifle.position.set(0.24, 1.1, 0.42);
  rifle.rotation.y = 0;
  group.add(rifle);

  return group;
}

export function createAssaultRifle(): THREE.Group {
  const rifle = new THREE.Group();

  const gunSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.35,
    metalness: 0.85,
  });

  const gunPolyMat = new THREE.MeshStandardMaterial({
    color: 0x121413,
    roughness: 0.7,
    metalness: 0.2,
  });

  const opticLensMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  // Main Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.45), gunSteelMat);
  receiver.castShadow = true;
  rifle.add(receiver);

  // Barrel & Muzzle Brake
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), gunSteelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.35);
  barrel.castShadow = true;
  rifle.add(barrel);

  const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.025, 0.08, 8), gunSteelMat);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, 0.02, 0.54);
  rifle.add(muzzleBrake);

  // Handguard & Picatinny Rail
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.28), gunPolyMat);
  handguard.position.set(0, 0.02, 0.22);
  rifle.add(handguard);

  // Holo Sight Optic
  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), gunSteelMat);
  optic.position.set(0, 0.1, 0.02);
  rifle.add(optic);

  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), opticLensMat);
  lens.position.set(0, 0.11, 0.07);
  rifle.add(lens);

  // Curved Magazine
  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.1), gunPolyMat);
  magazine.position.set(0, -0.12, 0.1);
  magazine.rotation.x = -0.25;
  magazine.castShadow = true;
  rifle.add(magazine);

  // Tactical Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.25), gunPolyMat);
  stock.position.set(0, -0.02, -0.28);
  stock.castShadow = true;
  rifle.add(stock);

  // Muzzle Flash Effect (Toggled during shooting)
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const flashMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flashMat);
  flashMesh.name = 'MuzzleFlash';
  flashMesh.position.set(0, 0.02, 0.6);
  rifle.add(flashMesh);

  // Muzzle Light (Dynamic point light)
  const muzzleLight = new THREE.PointLight(0xffaa22, 0, 8);
  muzzleLight.name = 'MuzzleLight';
  muzzleLight.position.set(0, 0.02, 0.65);
  rifle.add(muzzleLight);

  return rifle;
}

export function createEnemyMesh(isHeavy = false): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EnemyCharacter';

  const armorColor = isHeavy ? 0x8b0000 : 0x2d1f1f; // Crimson cyber-merc
  const bodyMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    roughness: 0.65,
    metalness: 0.4,
  });

  const heavyPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1a1111,
    roughness: 0.4,
    metalness: 0.6,
  });

  const eyeVisorMat = new THREE.MeshStandardMaterial({
    color: 0xff2222, // Glowing red menacing visor
    emissive: 0xff0000,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const scale = isHeavy ? 1.15 : 1.0;

  // 1. Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.65 * scale, 0.32 * scale), bodyMat);
  torso.position.y = 1.15 * scale;
  torso.castShadow = true;
  group.add(torso);

  // Shoulder Pauldrons
  const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.16 * scale, 0.25 * scale), heavyPlateMat);
  leftPauldron.position.set(-0.35 * scale, 1.45 * scale, 0);
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.16 * scale, 0.25 * scale), heavyPlateMat);
  rightPauldron.position.set(0.35 * scale, 1.45 * scale, 0);
  group.add(rightPauldron);

  // 2. Head with Menacing Red Optics
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.32 * scale, 0.32 * scale), heavyPlateMat);
  head.position.y = 1.65 * scale;
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.08 * scale, 0.1 * scale), eyeVisorMat);
  visor.position.set(0, 1.66 * scale, 0.16 * scale);
  group.add(visor);

  // 3. Legs
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.22 * scale), bodyMat);
  leftLeg.position.set(-0.16 * scale, 0.5 * scale, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.22 * scale), bodyMat);
  rightLeg.position.set(0.16 * scale, 0.5 * scale, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // 4. Arms & Mercenary SMG
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.6 * scale, 0.18 * scale), bodyMat);
  leftArm.position.set(-0.36 * scale, 1.15 * scale, 0.12 * scale);
  leftArm.rotation.x = 0.4;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.6 * scale, 0.18 * scale), bodyMat);
  rightArm.position.set(0.36 * scale, 1.15 * scale, 0.12 * scale);
  rightArm.rotation.x = 0.5;
  group.add(rightArm);

  // Submachine Gun
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.14 * scale, 0.45 * scale), heavyPlateMat);
  gun.position.set(0.24 * scale, 1.05 * scale, 0.35 * scale);
  group.add(gun);

  // Floating Health Bar container (updated in 3D each frame)
  const healthBarBg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide })
  );
  healthBarBg.position.set(0, 2.1 * scale, 0);
  healthBarBg.name = 'HealthBarBg';

  const healthBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.76, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  healthBarFill.position.set(0, 0, 0.005);
  healthBarFill.name = 'HealthBarFill';
  healthBarBg.add(healthBarFill);

  group.add(healthBarBg);

  return group;
}

// Procedural Ammo or Health Drop Crate
export function createPickupDrop(type: 'ammo' | 'health'): THREE.Group {
  const group = new THREE.Group();
  group.name = `Pickup_${type}`;

  const isAmmo = type === 'ammo';
  const boxColor = isAmmo ? 0x15803d : 0x0284c7; // Green for ammo, Cyan for medkit
  const lightColor = isAmmo ? 0x22c55e : 0x38bdf8;

  const boxMat = new THREE.MeshStandardMaterial({
    color: boxColor,
    roughness: 0.4,
    metalness: 0.6,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.8,
    metalness: 0.8,
  });

  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), boxMat);
  crate.castShadow = true;
  group.add(crate);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.32), rimMat);
  group.add(frame);

  // Insignia emblem
  const iconMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  if (isAmmo) {
    // 3 small bullet cylinders
    for (let i = -1; i <= 1; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), iconMat);
      b.rotation.x = Math.PI / 2;
      b.position.set(i * 0.06, 0.16, 0);
      group.add(b);
    }
  } else {
    // Cross for medkit
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), iconMat);
    cross1.position.set(0, 0.16, 0);
    cross1.rotation.x = -Math.PI / 2;
    group.add(cross1);

    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), iconMat);
    cross2.position.set(0, 0.16, 0);
    cross2.rotation.x = -Math.PI / 2;
    group.add(cross2);
  }

  // Soft glowing point light
  const light = new THREE.PointLight(lightColor, 0.8, 3.5);
  light.position.set(0, 0.3, 0);
  group.add(light);

  group.position.y = 0.3;
  return group;
}
