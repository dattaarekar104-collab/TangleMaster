import * as THREE from "three";
import { candyMaterial, ROPE_COLORS } from "../lights/lights";

function torusKnotPoints(p: number, q: number, scale: number, offset: THREE.Vector3, samples = 160): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const r = Math.cos(q * t) + 2;
    const x = r * Math.cos(p * t) * 0.32 * scale;
    const y = Math.sin(q * t) * 0.32 * scale;
    const z = r * Math.sin(p * t) * 0.32 * scale;
    pts.push(new THREE.Vector3(x, y, z).add(offset));
  }
  return pts;
}

export class TitleKnot {
  readonly root = new THREE.Group();

  constructor() {
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.6, 0.16, 48),
      candyMaterial("#2a1870", { roughness: 0.45, clearcoat: 0.3 }),
    );
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    this.root.add(floor);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.06, 12, 64),
      candyMaterial("#ffd166", { emissive: "#8a6200", emissiveIntensity: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.44;
    this.root.add(ring);

    const specs: Array<[number, number, number, THREE.Vector3]> = [
      [2, 3, 2.4, new THREE.Vector3(0, 0.2, 0)],
      [3, 2, 2.05, new THREE.Vector3(0.15, 0.05, -0.1)],
      [3, 4, 1.7, new THREE.Vector3(-0.2, 0.35, 0.1)],
      [2, 5, 1.45, new THREE.Vector3(0.05, -0.15, 0.2)],
      [4, 3, 1.2, new THREE.Vector3(-0.1, 0.5, -0.15)],
      [3, 5, 1.55, new THREE.Vector3(0.25, 0.1, 0.05)],
    ];

    specs.forEach((spec, i) => {
      const [p, q, scale, offset] = spec;
      const curve = new THREE.CatmullRomCurve3(torusKnotPoints(p, q, scale, offset), true);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 180, 0.11, 10, true),
        candyMaterial(ROPE_COLORS[i % ROPE_COLORS.length], { emissive: ROPE_COLORS[i % ROPE_COLORS.length], emissiveIntensity: 0.12 }),
      );
      tube.castShadow = true;
      this.root.add(tube);

      const beadGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const beadMat = candyMaterial("#fff6d8", { metalness: 0.35, roughness: 0.18 });
      for (let b = 0; b < 5; b++) {
        const bead = new THREE.Mesh(beadGeo, beadMat);
        const u = (b / 5 + i * 0.07) % 1;
        curve.getPointAt(u, bead.position);
        bead.castShadow = true;
        this.root.add(bead);
      }
    });

    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      candyMaterial("#ffffff", { roughness: 0.08, metalness: 0.25, emissive: "#7c5cff", emissiveIntensity: 0.45 }),
    );
    gem.position.y = 0.35;
    gem.castShadow = true;
    this.root.add(gem);
  }

  update(dt: number, t: number, reduced: boolean): void {
    const spin = reduced ? 0.08 : 0.22;
    this.root.rotation.y += dt * spin;
    this.root.position.y = reduced ? 0.2 : Math.sin(t * 0.8) * 0.12;
  }

  setVisible(v: boolean): void {
    this.root.visible = v;
  }
}
