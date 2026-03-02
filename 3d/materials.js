import * as THREE from "three";
import { clamp, mergeConfig3D } from "./utils.js";

export const buildMaterials = (configInput) => {
  const config = mergeConfig3D({}, configInput);

  const baseColor = new THREE.Color(
    config.bodyColor || config.primaryColor || "#38bdf8"
  );
  const wingsColor = new THREE.Color(
    config.wingsColor || config.secondaryColor || "#a855f7"
  );
  const engineColor = new THREE.Color(
    config.engineColor || config.secondaryColor || "#a855f7"
  );
  const cockpitColor = new THREE.Color(
    config.cockpitColor || "#e0f2fe"
  );

  let metalness = 0.7;
  let roughness = 0.25;
  let opacity = 1;
  let transparent = false;

  switch (config.materialType) {
    case "matte":
      metalness = 0.2;
      roughness = 0.8;
      break;
    case "glass":
      metalness = 0.1;
      roughness = 0.1;
      opacity = 0.4;
      transparent = true;
      break;
    case "alien":
      metalness = 0.85;
      roughness = 0.2;
      break;
    case "metal":
    default:
      break;
  }

  const bodyMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness,
    roughness,
  });

  if (config.materialType === "alien") {
    bodyMat.emissive = new THREE.Color("#4ade80");
    bodyMat.emissiveIntensity = 0.35 + 0.15 * clamp(config.alienTechLevel, 0, 3);
  }

  const wingMat = new THREE.MeshStandardMaterial({
    color: wingsColor,
    metalness: metalness * 0.8,
    roughness: roughness * 1.1,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: engineColor,
    metalness: 0.9,
    roughness: 0.25,
    emissive: new THREE.Color("#22d3ee"),
    emissiveIntensity: 0.4 + 0.6 * clamp(config.engineGlow, 0, 1),
  });

  const cockpitMat = new THREE.MeshStandardMaterial({
    color: cockpitColor,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 1 - clamp(config.cockpitTint, 0, 1) * 0.7,
  });

  return {
    bodyMat,
    wingMat,
    engineMat,
    cockpitMat,
  };
};

