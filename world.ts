import * as THREE from 'three';

export interface BoundingBox3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  tag?: string;
}

export interface MapData {
  worldGroup: THREE.Group;
  colliders: BoundingBox3D[];
  playerSpawn: THREE.Vector3;
  enemySpawns: Array<{ position: THREE.Vector3; isHeavy: boolean }>;
  extractionZone: { position: THREE.Vector3; radius: number; mesh: THREE.Group };
  patrolNodes: THREE.Vector3[];
}

export function buildCombatOutpostScene(): MapData {
  const worldGroup = new THREE.Group();
  worldGroup.name = 'TacticalCombatArena';

  const colliders: BoundingBox3D[] = [];

  // PBR Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate concrete
    roughness: 0.9,
    metalness: 0.1,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.75,
  });

  const sandbagMat = new THREE.MeshStandardMaterial({
    color: 0xa16207, // Burlap sandbags
    roughness: 0.95,
    metalness: 0.05,
  });

  const containerRedMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Industrial shipping red
    roughness: 0.6,
    metalness: 0.35,
  });

  const containerBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1e40af, // Shipping steel blue
    roughness: 0.6,
    metalness: 0.35,
  });

  const containerGreenMat = new THREE.MeshStandardMaterial({
    color: 0x166534, // Military cargo green
    roughness: 0.6,
    metalness: 0.35,
  });

  const tarmacMat = new THREE.MeshStandardMaterial({
    color: 0x1e222d, // Dark military compound asphalt
    roughness: 0.85,
    metalness: 0.1,
  });

  // Helper to add box with collision
  function addSolidBox(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    tag?: string
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);

    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minY: y,
      maxY: y + h,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      tag,
    });

    return mesh;
  }

  // 1. Ground Plane (Extends beyond perimeter to prevent floating-void look)
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  const ground = new THREE.Mesh(groundGeo, tarmacMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Outer Perimeter Ground (Dirt / Wasteland)
  const outerGround = new THREE.Mesh(
    new THREE.RingGeometry(35, 110, 32),
    new THREE.MeshStandardMaterial({ color: 0x181c16, roughness: 0.95 })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.01;
  worldGroup.add(outerGround);

  // 2. Perimeter Walls / Barriers (Arena boundaries: 70m x 70m)
  const wallH = 4.0;
  const wallT = 1.0;
  const arenaHalf = 35;

  // North wall
  addSolidBox(70, wallH, wallT, 0, 0, -arenaHalf, concreteMat, 'perimeter');
  // South wall
  addSolidBox(70, wallH, wallT, 0, 0, arenaHalf, concreteMat, 'perimeter');
  // East wall
  addSolidBox(wallT, wallH, 70, arenaHalf, 0, 0, concreteMat, 'perimeter');
  // West wall
  addSolidBox(wallT, wallH, 70, -arenaHalf, 0, 0, concreteMat, 'perimeter');

  // Wall Top Guard Railings / Barbed wire look
  for (let i = -30; i <= 30; i += 10) {
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), darkMetalMat);
    p1.position.set(i, wallH + 0.4, -arenaHalf);
    worldGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), darkMetalMat);
    p2.position.set(i, wallH + 0.4, arenaHalf);
    worldGroup.add(p2);
  }

  // 3. Command HQ Building (North-East quadrant)
  // Two-section modular military command center
  const hqX = 14;
  const hqZ = -14;
  // Main building block
  addSolidBox(12, 5.5, 10, hqX, 0, hqZ, concreteMat, 'HQ_Main');
  // Second floor observation deck
  addSolidBox(7, 3.2, 6, hqX, 5.5, hqZ, darkMetalMat, 'HQ_Upper');

  // Radar Dish on top of HQ
  const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.0, 8), darkMetalMat);
  dishMast.position.set(hqX, 9.7, hqZ);
  worldGroup.add(dishMast);

  const dishDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    darkMetalMat
  );
  dishDome.rotation.x = 0.5;
  dishDome.position.set(hqX, 10.7, hqZ);
  worldGroup.add(dishDome);

  // 4. Military Barracks / Armoury (South-West quadrant)
  const bX = -15;
  const bZ = 12;
  addSolidBox(14, 4.0, 8, bX, 0, bZ, concreteMat, 'Barracks');

  // Barracks Solar / Vent Units on roof
  for (let vx = -4; vx <= 4; vx += 4) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), darkMetalMat);
    vent.position.set(bX + vx, 4.3, bZ);
    worldGroup.add(vent);
  }

  // 5. Watchtowers (Corners)
  const towerPositions = [
    { x: -28, z: -28 },
    { x: 28, z: 28 },
    { x: -28, z: 28 },
  ];

  towerPositions.forEach((tp) => {
    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.0, 8);
    for (let lx of [-1.2, 1.2]) {
      for (let lz of [-1.2, 1.2]) {
        const leg = new THREE.Mesh(legGeo, darkMetalMat);
        leg.position.set(tp.x + lx, 3.5, tp.z + lz);
        leg.castShadow = true;
        worldGroup.add(leg);
      }
    }
    // Cabin on top
    addSolidBox(3.2, 2.5, 3.2, tp.x, 7.0, tp.z, darkMetalMat, 'Watchtower');
  });

  // 6. Tactical Shipping Containers (Cover & corridors in center area)
  // Container 1 (Red)
  addSolidBox(6.0, 2.6, 2.4, -4, 0, -8, containerRedMat, 'Cover_Cont1');
  // Container 2 (Blue)
  addSolidBox(2.4, 2.6, 6.0, 6, 0, -2, containerBlueMat, 'Cover_Cont2');
  // Container 3 (Green)
  addSolidBox(6.0, 2.6, 2.4, -8, 0, 4, containerGreenMat, 'Cover_Cont3');
  // Stacked container
  addSolidBox(6.0, 2.6, 2.4, -4, 2.6, -8, containerBlueMat, 'Cover_Cont_Stacked');

  // 7. Sandbag Barricades & Concrete Jersey Barriers (Strategic Cover)
  const barricades = [
    { w: 4.5, h: 1.2, d: 0.8, x: 0, z: -4, mat: sandbagMat },
    { w: 0.8, h: 1.2, d: 4.5, x: -12, z: -4, mat: sandbagMat },
    { w: 4.0, h: 1.2, d: 0.8, x: 8, z: 8, mat: sandbagMat },
    { w: 0.8, h: 1.2, d: 5.0, x: -2, z: 12, mat: sandbagMat },
    { w: 5.0, h: 1.3, d: 0.6, x: -18, z: -14, mat: concreteMat },
    { w: 5.0, h: 1.3, d: 0.6, x: 20, z: 2, mat: concreteMat },
  ];

  barricades.forEach((b) => {
    addSolidBox(b.w, b.h, b.d, b.x, 0, b.z, b.mat, 'Barricade');
  });

  // 8. Fuel Depots / Oil Drums
  const fuelPots = [
    { x: -18, z: 0 },
    { x: -19.5, z: 0.8 },
    { x: 12, z: -24 },
    { x: 13.5, z: -23.5 },
  ];
  const drumGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12);
  const drumMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.5, metalness: 0.6 });

  fuelPots.forEach((fp) => {
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(fp.x, 0.6, fp.z);
    drum.castShadow = true;
    worldGroup.add(drum);

    colliders.push({
      minX: fp.x - 0.5,
      maxX: fp.x + 0.5,
      minY: 0,
      maxY: 1.2,
      minZ: fp.z - 0.5,
      maxZ: fp.z + 0.5,
      tag: 'FuelDrum',
    });
  });

  // 9. Extraction Zone (Helipad at North-West: x = 22, z = -24)
  const heliGroup = new THREE.Group();
  const heliPadX = 22;
  const heliPadZ = -24;
  heliGroup.position.set(heliPadX, 0.02, heliPadZ);

  // Outer Helipad octagonal slab
  const padSlab = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.4, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
  );
  padSlab.position.y = 0.05;
  heliGroup.add(padSlab);

  // Glowing Outer Tactical Ring
  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 4.6, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.12;
  ringMesh.name = 'HeliRing';
  heliGroup.add(ringMesh);

  // 'H' Helipad Insignia (Procedural meshes)
  const hMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
  const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.2), hMat);
  hLeft.rotation.x = -Math.PI / 2;
  hLeft.position.set(-1.0, 0.13, 0);
  heliGroup.add(hLeft);

  const hRight = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.2), hMat);
  hRight.rotation.x = -Math.PI / 2;
  hRight.position.set(1.0, 0.13, 0);
  heliGroup.add(hRight);

  const hCross = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), hMat);
  hCross.rotation.x = -Math.PI / 2;
  hCross.position.set(0, 0.13, 0);
  heliGroup.add(hCross);

  // Beacon Light on Helipad Corner
  const beaconLight = new THREE.PointLight(0x38bdf8, 1.2, 10);
  beaconLight.position.set(0, 1.5, 0);
  heliGroup.add(beaconLight);

  worldGroup.add(heliGroup);

  // 10. Lighting Rigs (3-Point Studio / Combat atmosphere)
  // Key Light (Warm sunlight / searchlight)
  const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.6);
  sunLight.position.set(25, 40, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;
  const d = 40;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0004;
  worldGroup.add(sunLight);

  // Fill Light (Cool sky / ambient bounce)
  const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x1e293b, 0.7);
  hemiLight.position.set(0, 50, 0);
  worldGroup.add(hemiLight);

  // Player starting position (South of compound, ready to infiltrate)
  const playerSpawn = new THREE.Vector3(0, 0, 24);

  // Enemy Patrol and Guard Spawns
  const enemySpawns = [
    { position: new THREE.Vector3(-4, 0, 6), isHeavy: false },
    { position: new THREE.Vector3(8, 0, -8), isHeavy: false },
    { position: new THREE.Vector3(-14, 0, -8), isHeavy: true },
    { position: new THREE.Vector3(16, 0, 4), isHeavy: false },
    { position: new THREE.Vector3(12, 0, -18), isHeavy: true },
    { position: new THREE.Vector3(-22, 0, 2), isHeavy: false },
    { position: new THREE.Vector3(0, 0, -16), isHeavy: true },
    { position: new THREE.Vector3(18, 0, -28), isHeavy: true },
  ];

  // AI Patrol Waypoints
  const patrolNodes = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-12, 0, 2),
    new THREE.Vector3(-10, 0, -12),
    new THREE.Vector3(6, 0, -12),
    new THREE.Vector3(14, 0, 2),
    new THREE.Vector3(4, 0, 12),
    new THREE.Vector3(-6, 0, 14),
  ];

  return {
    worldGroup,
    colliders,
    playerSpawn,
    enemySpawns,
    extractionZone: {
      position: new THREE.Vector3(heliPadX, 0, heliPadZ),
      radius: 4.8,
      mesh: heliGroup,
    },
    patrolNodes,
  };
}
