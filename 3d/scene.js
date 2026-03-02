import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const DEFAULT_3D_OPTIONS = {
  autoRotate: true,
  rotationSpeed: 0.5,
  qualityMode: "auto",
  showAxis: false,
};

const CAMERA_PRESETS = {
  front: { pos: [0, 0, 12], label: "חזית" },
  side: { pos: [12, 0, 0], label: "צד" },
  top: { pos: [0, 12, 0.01], label: "מלמעלה" },
  iso: { pos: [6, 4, 10], label: "איזומטרי" },
};

export const initScene = (canvas, initialOptions = {}) => {
  const options = { ...DEFAULT_3D_OPTIONS, ...initialOptions };
  const enablePan = !!initialOptions.enablePan;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: options.qualityMode !== "low",
    alpha: true,
  });

  const setPixelRatioFromQuality = (mode) => {
    if (mode === "low") renderer.setPixelRatio(1);
    else if (mode === "high") renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    else renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
  setPixelRatioFromQuality(options.qualityMode);

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
  controls.enablePan = enablePan;
  controls.minDistance = 3;
  controls.maxDistance = 25;
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
  let axesHelper = null;
  let autoRotate = options.autoRotate;
  let rotationSpeed = options.rotationSpeed;

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

  const set3DOptions = (opts) => {
    if (opts.autoRotate !== undefined) autoRotate = !!opts.autoRotate;
    if (opts.rotationSpeed !== undefined) rotationSpeed = Math.max(0, Math.min(1, Number(opts.rotationSpeed)));
    if (opts.qualityMode !== undefined) setPixelRatioFromQuality(opts.qualityMode);
    if (opts.showAxis !== undefined) {
      if (axesHelper) {
        scene.remove(axesHelper);
        axesHelper.geometry.dispose();
        axesHelper = null;
      }
      if (opts.showAxis) {
        axesHelper = new THREE.AxesHelper(2);
        scene.add(axesHelper);
      }
    }
    if (opts.enablePan !== undefined) controls.enablePan = !!opts.enablePan;
  };

  const setCameraPreset = (name) => {
    const preset = CAMERA_PRESETS[name] || CAMERA_PRESETS.iso;
    camera.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    controls.target.set(0, 0, 0);
  };

  const resetView = () => setCameraPreset("iso");

  const zoomBy = (delta) => {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const dist = camera.position.distanceTo(controls.target);
    const newDist = THREE.MathUtils.clamp(dist * (1 - delta), controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(dir.multiplyScalar(newDist));
  };

  const zoomIn = () => zoomBy(0.15);
  const zoomOut = () => zoomBy(-0.15);

  if (options.showAxis) {
    axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
  }

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    if (shipGroup && autoRotate) {
      const speed = 0.002 + rotationSpeed * 0.004;
      shipGroup.rotation.y += speed;
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
    set3DOptions,
    setCameraPreset,
    resetView,
    zoomIn,
    zoomOut,
  };
};

