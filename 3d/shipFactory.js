import * as THREE from "three";
import { buildMaterials } from "./materials.js";
import { degToRad, mergeConfig3D, defaultShipConfig3D } from "./utils.js";

export const createShip = (configInput) => {
  const config = mergeConfig3D(defaultShipConfig3D, configInput || {});
  const group = new THREE.Group();

  const mats = buildMaterials(config);

  const bodyLength = 3 + config.bodyLength * 0.4;
  const bodyRadius = 0.6 + config.bodyRadius * 0.15;

  const bodyGeo = new THREE.CylinderGeometry(
    bodyRadius,
    bodyRadius * 0.9,
    bodyLength,
    18,
    1
  );
  const body = new THREE.Mesh(bodyGeo, mats.bodyMat);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const cockpitRadius = bodyRadius * 0.6;
  const cockpitGeo = new THREE.SphereGeometry(cockpitRadius, 18, 14);
  const cockpit = new THREE.Mesh(cockpitGeo, mats.cockpitMat);
  cockpit.position.set(bodyLength * 0.55, 0.15, 0);
  group.add(cockpit);

  const wingSpanWorld = 1.5 + config.wingSpan * 0.5;
  const wingThickness = 0.15;
  const wingLength = bodyLength * 0.6;

  const wingGeo = new THREE.BoxGeometry(
    wingLength,
    wingThickness,
    wingSpanWorld
  );

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
  const engineGeo = new THREE.CylinderGeometry(
    engineRadius * 0.85,
    engineRadius,
    engineLength,
    16,
    1
  );
  const engine = new THREE.Mesh(engineGeo, mats.engineMat);
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-bodyLength * 0.55, 0, 0);
  group.add(engine);

  const parts = {
    body,
    cockpit,
    wingL,
    wingR,
    engine,
  };

  group.position.set(0, 0, 0);

  return {
    group,
    parts,
  };
};

