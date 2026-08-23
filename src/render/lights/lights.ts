import * as THREE from "three";

export const ROPE_COLORS = [
  "#ff5ea8",
  "#ffd166",
  "#5ce1e6",
  "#7c5cff",
  "#3ee0a4",
  "#ff7a45",
  "#4ea8ff",
];

export function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight("#9bd7ff", "#3b1468", 0.85));

  const key = new THREE.DirectionalLight("#fff4d6", 1.45);
  key.position.set(6, 12, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const rim = new THREE.DirectionalLight("#ff8ad8", 0.7);
  rim.position.set(-7, 4, -6);
  scene.add(rim);

  const fill = new THREE.PointLight("#5ce1e6", 18, 22, 2);
  fill.position.set(0, 3.2, 2);
  scene.add(fill);
}

export function candyMaterial(color: string, extra?: Partial<THREE.MeshPhysicalMaterialParameters>): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenColor: new THREE.Color("#ffffff"),
    ...extra,
  });
}
