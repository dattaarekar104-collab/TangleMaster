import * as THREE from "three";
import { candyMaterial, ROPE_COLORS } from "../lights/lights";
import { isHintShowing } from "../../game/simulation/hint";
import type { PuzzleState } from "../../game/simulation/types";

const NODE_R = 0.28;
const HINT_DOT_R = 0.11;
const HINT_Y = 0.62;

export class PuzzleView {
  readonly root = new THREE.Group();
  private nodes: THREE.Mesh[] = [];
  private ropes: THREE.Mesh[] = [];
  private hintDots: THREE.Mesh[] = [];
  private hintRings: THREE.Mesh[] = [];
  private hintPaths: THREE.Mesh[] = [];
  private board: THREE.Mesh;
  private nodeGeo = new THREE.SphereGeometry(NODE_R, 24, 24);
  private hintDotGeo = new THREE.SphereGeometry(HINT_DOT_R, 16, 16);
  private hintRingGeo = new THREE.TorusGeometry(HINT_DOT_R * 1.35, 0.022, 8, 20);
  private hintPathGeo = new THREE.CylinderGeometry(0.028, 0.028, 1, 8);
  private nodeMats: THREE.MeshPhysicalMaterial[] = ROPE_COLORS.map((c) =>
    candyMaterial(c, { emissive: c, emissiveIntensity: 0.16 }),
  );
  private ropeMats: THREE.MeshPhysicalMaterial[] = ROPE_COLORS.map((c) =>
    candyMaterial(c, { roughness: 0.32, emissive: c, emissiveIntensity: 0.08 }),
  );
  private dummy = new THREE.Object3D();
  private highlight = new THREE.Mesh(
    new THREE.SphereGeometry(NODE_R * 1.28, 20, 20),
    new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.28 }),
  );

  constructor() {
    this.board = new THREE.Mesh(
      new THREE.CylinderGeometry(3.55, 3.55, 0.12, 48),
      candyMaterial("#24165c", { roughness: 0.5, clearcoat: 0.2 }),
    );
    this.board.receiveShadow = true;
    this.root.add(this.board);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.07, 10, 64),
      candyMaterial("#ffd166", { emissive: "#6a4a00", emissiveIntensity: 0.25 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.08;
    this.root.add(rim);

    this.highlight.visible = false;
    this.root.add(this.highlight);
    this.root.visible = false;
  }

  rebuild(puzzle: PuzzleState): void {
    for (const m of this.nodes) this.root.remove(m);
    for (const m of this.ropes) {
      this.root.remove(m);
      m.geometry.dispose();
    }
    this.clearHintMeshes();
    this.nodes = [];
    this.ropes = [];

    puzzle.nodes.forEach((_, i) => {
      const color = ROPE_COLORS[i % ROPE_COLORS.length];
      const mesh = new THREE.Mesh(this.nodeGeo, this.nodeMats[i % this.nodeMats.length]);
      mesh.castShadow = true;
      mesh.userData.index = i;
      this.nodes.push(mesh);
      this.root.add(mesh);

      const dot = new THREE.Mesh(
        this.hintDotGeo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        }),
      );
      dot.renderOrder = 3;
      dot.visible = false;
      this.hintDots.push(dot);
      this.root.add(dot);

      const ring = new THREE.Mesh(
        this.hintRingGeo,
        new THREE.MeshBasicMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.renderOrder = 4;
      ring.visible = false;
      this.hintRings.push(ring);
      this.root.add(ring);

      const path = new THREE.Mesh(
        this.hintPathGeo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.38,
          depthWrite: false,
        }),
      );
      path.renderOrder = 2;
      path.visible = false;
      this.hintPaths.push(path);
      this.root.add(path);
    });

    puzzle.edges.forEach((_, i) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), this.ropeMats[i % this.ropeMats.length]);
      mesh.castShadow = true;
      this.ropes.push(mesh);
      this.root.add(mesh);
    });
    this.sync(puzzle);
  }

  sync(puzzle: PuzzleState): void {
    puzzle.nodes.forEach((n, i) => {
      this.nodes[i].position.set(n.x, 0.34, n.z);
    });
    puzzle.edges.forEach(([a, b], i) => {
      const pa = this.nodes[a].position;
      const pb = this.nodes[b].position;
      const mid = pa.clone().add(pb).multiplyScalar(0.5);
      const len = pa.distanceTo(pb);
      this.dummy.position.copy(mid);
      this.dummy.lookAt(pb);
      this.dummy.rotateX(Math.PI / 2);
      this.ropes[i].position.copy(this.dummy.position);
      this.ropes[i].quaternion.copy(this.dummy.quaternion);
      this.ropes[i].scale.set(1, len, 1);
    });

    const hintMat = this.highlight.material as THREE.MeshBasicMaterial;
    if (puzzle.dragging >= 0) {
      this.highlight.visible = true;
      hintMat.color.set("#ffffff");
      hintMat.opacity = 0.28;
      this.highlight.position.copy(this.nodes[puzzle.dragging].position);
    } else {
      this.highlight.visible = false;
    }

    const showing = isHintShowing(puzzle);
    const pulse = 0.78 + Math.abs(Math.sin(performance.now() * 0.005)) * 0.2;
    puzzle.nodes.forEach((n, i) => {
      const dest = puzzle.hintTargets?.[i];
      const on = showing && !!dest;
      this.hintDots[i].visible = on;
      this.hintRings[i].visible = on;
      this.hintPaths[i].visible = on;
      if (!on || !dest) return;

      this.hintDots[i].position.set(dest.x, HINT_Y, dest.z);
      this.hintRings[i].position.set(dest.x, HINT_Y, dest.z);
      (this.hintDots[i].material as THREE.MeshBasicMaterial).opacity = pulse;

      const from = new THREE.Vector3(n.x, HINT_Y - 0.08, n.z);
      const to = new THREE.Vector3(dest.x, HINT_Y - 0.08, dest.z);
      const len = Math.max(from.distanceTo(to), 0.04);
      this.dummy.position.copy(from).add(to).multiplyScalar(0.5);
      this.dummy.lookAt(to);
      this.dummy.rotateX(Math.PI / 2);
      this.hintPaths[i].position.copy(this.dummy.position);
      this.hintPaths[i].quaternion.copy(this.dummy.quaternion);
      this.hintPaths[i].scale.set(1, len, 1);
    });
  }

  pickNode(raycaster: THREE.Raycaster): number {
    const hits = raycaster.intersectObjects(this.nodes, false);
    if (!hits.length) return -1;
    return hits[0].object.userData.index as number;
  }

  setVisible(v: boolean): void {
    this.root.visible = v;
  }

  dispose(): void {
    this.nodeGeo.dispose();
    this.hintDotGeo.dispose();
    this.hintRingGeo.dispose();
    this.hintPathGeo.dispose();
    this.clearHintMeshes();
  }

  private clearHintMeshes(): void {
    for (const m of [...this.hintDots, ...this.hintRings, ...this.hintPaths]) {
      this.root.remove(m);
      (m.material as THREE.Material).dispose();
    }
    this.hintDots = [];
    this.hintRings = [];
    this.hintPaths = [];
  }
}
