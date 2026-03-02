import { buildMaterials } from "./materials.js";
import { degToRad, mergeConfig3D, defaultShipConfig3D, clamp } from "./utils.js";

export const updateShipFromConfig = (parts, configInput) => {
  if (!parts) return;
  const config = mergeConfig3D(defaultShipConfig3D, configInput || {});
  const { body, cockpit, wingL, wingR, engine } = parts;
  const mats = buildMaterials(config);

  if (body) {
    body.material = mats.bodyMat;
    const lengthScale = 0.4 + config.bodyLength * 0.12;
    const radiusScale = 0.7 + config.bodyRadius * 0.05;
    body.scale.set(radiusScale, lengthScale, radiusScale);
  }

  if (wingL && wingR) {
    wingL.material = mats.wingMat;
    wingR.material = mats.wingMat;

    const spanScale = 0.8 + config.wingSpan * 0.12;
    wingL.scale.set(1, 1, spanScale);
    wingR.scale.set(1, 1, spanScale);

    const angleRad = degToRad(config.wingAngle);
    wingL.rotation.x = angleRad;
    wingR.rotation.x = -angleRad;
  }

  if (engine) {
    engine.material = mats.engineMat;
    const sizeScale = 0.6 + config.engineSize * 0.08;
    engine.scale.set(sizeScale, sizeScale, sizeScale);
  }

  if (cockpit) {
    cockpit.material = mats.cockpitMat;
    const tintScale = 0.9 + clamp(config.cockpitTint, 0, 1) * 0.4;
    cockpit.scale.set(tintScale, tintScale, tintScale);
  }
};

