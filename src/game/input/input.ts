import * as THREE from "three";

export function createPointer(canvas: HTMLElement, camera: THREE.PerspectiveCamera): {
  ndc: THREE.Vector2;
  raycaster: THREE.Raycaster;
  planeHit: THREE.Vector3 | null;
  onDown: (fn: () => void) => void;
  onMove: (fn: () => void) => void;
  onUp: (fn: () => void) => void;
} {
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.34);
  const hit = new THREE.Vector3();
  let downFn = () => {};
  let moveFn = () => {};
  let upFn = () => {};

  const api = {
    ndc,
    raycaster,
    planeHit: null as THREE.Vector3 | null,
    onDown(fn: () => void) {
      downFn = fn;
    },
    onMove(fn: () => void) {
      moveFn = fn;
    },
    onUp(fn: () => void) {
      upFn = fn;
    },
  };

  const setFromEvent = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    api.planeHit = raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    setFromEvent(e);
    downFn();
  });
  canvas.addEventListener("pointermove", (e) => {
    setFromEvent(e);
    moveFn();
  });
  canvas.addEventListener("pointerup", (e) => {
    setFromEvent(e);
    upFn();
  });

  return api;
}
