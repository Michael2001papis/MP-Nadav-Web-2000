import * as THREE from "three";
import { buildMaterials } from "./materials.js";
import { degToRad, mergeConfig3D, defaultShipConfig3D } from "./utils.js";

const buildClassic = (group, config, mats) => {
  const bodyLength = 3 + config.bodyLength * 0.4;
  const bodyRadius = 0.6 + config.bodyRadius * 0.15;
  const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.9, bodyLength, 18, 1);
  const body = new THREE.Mesh(bodyGeo, mats.bodyMat);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const cockpitRadius = bodyRadius * 0.6;
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(cockpitRadius, 18, 14), mats.cockpitMat);
  cockpit.position.set(bodyLength * 0.55, 0.15, 0);
  group.add(cockpit);
  const wingSpanWorld = 1.5 + config.wingSpan * 0.5;
  const wingGeo = new THREE.BoxGeometry(bodyLength * 0.6, 0.15, wingSpanWorld);
  const wingL = new THREE.Mesh(wingGeo, mats.wingMat);
  wingL.position.set(0, -bodyRadius * 0.3, wingSpanWorld * 0.55);
  wingL.rotation.x = degToRad(config.wingAngle);
  const wingR = new THREE.Mesh(wingGeo, mats.wingMat);
  wingR.position.set(0, -bodyRadius * 0.3, -wingSpanWorld * 0.55);
  wingR.rotation.x = -degToRad(config.wingAngle);
  group.add(wingL);
  group.add(wingR);
  const engineRadius = 0.4 + config.engineSize * 0.12;
  const engineLength = 0.7 + config.engineSize * 0.1;
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(engineRadius * 0.85, engineRadius, engineLength, 16, 1),
    mats.engineMat
  );
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-bodyLength * 0.55, 0, 0);
  group.add(engine);
  return { body, cockpit, wingL, wingR, engine };
};

const buildSleek = (group, config, mats) => {
  const len = 2.8 + config.bodyLength * 0.35;
  const r = 0.35 + config.bodyRadius * 0.08;
  const bodyGeo = new THREE.ConeGeometry(r * 1.2, len, 20);
  const body = new THREE.Mesh(bodyGeo, mats.bodyMat);
  body.rotation.z = -Math.PI / 2;
  group.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 16, 12), mats.cockpitMat);
  cockpit.position.set(len * 0.5, 0.08, 0);
  group.add(cockpit);
  const wingSpan = 1.2 + config.wingSpan * 0.35;
  const wingGeo = new THREE.BoxGeometry(len * 0.4, 0.08, wingSpan);
  const wingL = new THREE.Mesh(wingGeo, mats.wingMat);
  wingL.position.set(-0.1, -r * 0.4, wingSpan * 0.5);
  wingL.rotation.x = degToRad(config.wingAngle);
  const wingR = new THREE.Mesh(wingGeo, mats.wingMat);
  wingR.position.set(-0.1, -r * 0.4, -wingSpan * 0.5);
  wingR.rotation.x = -degToRad(config.wingAngle);
  group.add(wingL);
  group.add(wingR);
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.7, r * 0.9, 0.5 + config.engineSize * 0.08, 16, 1),
    mats.engineMat
  );
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-len * 0.55, 0, 0);
  group.add(engine);
  return { body, cockpit, wingL, wingR, engine };
};

const buildHeavy = (group, config, mats) => {
  const bodyLength = 2.2 + config.bodyLength * 0.3;
  const bodyRadius = 0.85 + config.bodyRadius * 0.18;
  const bodyGeo = new THREE.CylinderGeometry(bodyRadius * 1.1, bodyRadius, bodyLength, 20, 1);
  const body = new THREE.Mesh(bodyGeo, mats.bodyMat);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(bodyRadius * 0.5, 16, 12),
    mats.cockpitMat
  );
  cockpit.position.set(bodyLength * 0.45, bodyRadius * 0.35, 0);
  group.add(cockpit);
  const wingSpan = 1.8 + config.wingSpan * 0.5;
  const wingGeo = new THREE.BoxGeometry(bodyLength * 0.7, 0.25, wingSpan);
  const wingL = new THREE.Mesh(wingGeo, mats.wingMat);
  wingL.position.set(0, -bodyRadius * 0.2, wingSpan * 0.55);
  wingL.rotation.x = degToRad(config.wingAngle);
  const wingR = new THREE.Mesh(wingGeo, mats.wingMat);
  wingR.position.set(0, -bodyRadius * 0.2, -wingSpan * 0.55);
  wingR.rotation.x = -degToRad(config.wingAngle);
  group.add(wingL);
  group.add(wingR);
  const engineRadius = 0.5 + config.engineSize * 0.14;
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(engineRadius * 0.9, engineRadius * 1.1, 0.9 + config.engineSize * 0.1, 18, 1),
    mats.engineMat
  );
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-bodyLength * 0.55, 0, 0);
  group.add(engine);
  return { body, cockpit, wingL, wingR, engine };
};

const buildRing = (group, config, mats) => {
  const ringRadius = 0.9 + config.bodyLength * 0.15;
  const tubeRadius = 0.2 + config.bodyRadius * 0.06;
  const ringGeo = new THREE.TorusGeometry(ringRadius, tubeRadius, 12, 24);
  const body = new THREE.Mesh(ringGeo, mats.bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(tubeRadius * 1.4, 14, 10),
    mats.cockpitMat
  );
  cockpit.position.set(ringRadius, 0, 0);
  group.add(cockpit);
  const wingSpan = 0.6 + config.wingSpan * 0.2;
  const wingGeo = new THREE.BoxGeometry(ringRadius * 0.4, 0.1, wingSpan);
  const wingL = new THREE.Mesh(wingGeo, mats.wingMat);
  wingL.position.set(-ringRadius * 0.5, -tubeRadius - 0.15, wingSpan * 0.6);
  wingL.rotation.x = degToRad(config.wingAngle);
  const wingR = new THREE.Mesh(wingGeo, mats.wingMat);
  wingR.position.set(-ringRadius * 0.5, -tubeRadius - 0.15, -wingSpan * 0.6);
  wingR.rotation.x = -degToRad(config.wingAngle);
  group.add(wingL);
  group.add(wingR);
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(tubeRadius * 1.2, tubeRadius * 1.4, 0.4 + config.engineSize * 0.06, 14, 1),
    mats.engineMat
  );
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-ringRadius, 0, 0);
  group.add(engine);
  return { body, cockpit, wingL, wingR, engine };
};

export const createShip = (configInput) => {
  const config = mergeConfig3D(defaultShipConfig3D, configInput || {});
  const group = new THREE.Group();
  const mats = buildMaterials(config);
  const shape = config.shipShape || "classic";
  const parts =
    shape === "sleek"
      ? buildSleek(group, config, mats)
      : shape === "heavy"
        ? buildHeavy(group, config, mats)
        : shape === "ring"
          ? buildRing(group, config, mats)
          : buildClassic(group, config, mats);
  group.position.set(0, 0, 0);
  return { group, parts };
};

