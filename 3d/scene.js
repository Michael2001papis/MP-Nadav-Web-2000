import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export const initScene = (canvas) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    100
  );
  camera.position.set(6, 4, 10);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 18;
  controls.target.set(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  rimLight.position.set(-6, 4, -4);
  scene.add(rimLight);

  let shipGroup = null;

  const setShipGroup = (group) => {
    if (shipGroup) {
      scene.remove(shipGroup);
    }
    shipGroup = group;
    if (shipGroup) {
      scene.add(shipGroup);
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || 400;
    const height = rect.height || width * 0.6;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener("resize", resize);

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    if (shipGroup) {
      shipGroup.rotation.y += 0.003;
      shipGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
    renderer.render(scene, camera);
  };

  animate();

  return {
    scene,
    camera,
    renderer,
    controls,
    setShipGroup,
  };
};

