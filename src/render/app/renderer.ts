import * as THREE from "three";

export function createRenderer(host: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#140c38");
  scene.fog = new THREE.Fog("#140c38", 14, 32);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
  camera.position.set(0, 6.4, 9.2);
  camera.lookAt(0, 0.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();
  window.addEventListener("resize", resize);

  renderer.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());

  return { scene, camera, renderer };
}

export function setMenuCamera(camera: THREE.PerspectiveCamera, reduced: boolean, t: number): void {
  const orbit = reduced ? 0 : t * 0.12;
  const lift = reduced ? 0 : Math.sin(t * 0.35) * 0.18;
  camera.position.set(Math.sin(orbit) * 9.4, 5.6 + lift, Math.cos(orbit) * 9.4);
  camera.lookAt(0, 1.1, 0);
}

export function setPlayCamera(camera: THREE.PerspectiveCamera): void {
  camera.position.set(0, 9.4, 7.2);
  camera.lookAt(0, 0, 0);
}
