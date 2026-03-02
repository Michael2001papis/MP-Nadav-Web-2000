export const defaultShipConfig3D = {
  shipShape: "classic", // 'classic' | 'sleek' | 'heavy' | 'ring'
  primaryColor: "#38bdf8",
  secondaryColor: "#a855f7",
  materialType: "metal", // 'metal' | 'matte' | 'glass' | 'alien'
  bodyLength: 6,
  bodyRadius: 2.2,
  wingSpan: 5,
  wingAngle: 0,
  engineSize: 5,
  engineGlow: 0.6,
  cockpitTint: 0.4,
  decals: "none", // 'none' | 'stripes' | 'runes'
  alienTechLevel: 0,
};

export const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

export const degToRad = (deg) => (deg * Math.PI) / 180;

export const mergeConfig3D = (base, override) => {
  return {
    ...base,
    ...(override || {}),
  };
};

export const buildConfig3DFromRaw = (raw, existing = null) => {
  const base = existing || defaultShipConfig3D;

  const num = (v, fallback, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return clamp(n, min, max);
  };

  return mergeConfig3D(base, {
    shipShape: raw.shipShape3D || base.shipShape,
    primaryColor: raw.primaryColor3D || raw.shipColor || base.primaryColor,
    secondaryColor:
      raw.secondaryColor3D || raw.shipColor || base.secondaryColor,
    materialType: raw.materialType3D || base.materialType,
    bodyLength: num(raw.bodyLength3D, base.bodyLength, 1, 10),
    bodyRadius: clamp(base.bodyRadius, 0.8, 4.5),
    wingSpan: num(raw.wingSpan3D, base.wingSpan, 1, 10),
    wingAngle: num(raw.wingAngle3D, base.wingAngle, -30, 30),
    engineSize: num(raw.engineSize3D, base.engineSize, 1, 10),
    engineGlow: num(raw.engineGlow3D, base.engineGlow, 0, 1),
    cockpitTint: num(raw.cockpitTint3D, base.cockpitTint, 0, 1),
    decals: raw.decals3D || base.decals,
    alienTechLevel: num(raw.alienTechLevel3D, base.alienTechLevel, 0, 3),
  });
};

