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
  // מבנה חלקים מודולרי – לשימוש עתידי, לא שובר את הקיים
  parts: {
    nose: {
      size: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
    },
    body: {
      size: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
    },
    wings: [
      {
        size: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
      },
      {
        size: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
      },
    ],
    engines: [
      {
        size: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        visible: true,
      },
    ],
    cockpit: {
      size: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
    },
    tail: {
      size: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
    },
  },
  // שכבות סגנון ואפקטים – לשימוש במודולים מתקדמים
  style: {
    basePrimary: "#38bdf8",
    baseSecondary: "#a855f7",
  },
  fx: {
    hoverSpeed: 0.4,
    enginePulse: 0.6,
    rotationIdle: 0.2,
  },
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

const ensurePartsConfig = (config) => {
  const basePart = {
    size: { x: 1, y: 1, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    visible: true,
  };

  const parts = config.parts || {};
  const clonePart = (p) => ({
    size: { ...basePart.size, ...(p?.size || {}) },
    position: { ...basePart.position, ...(p?.position || {}) },
    rotation: { ...basePart.rotation, ...(p?.rotation || {}) },
    visible: typeof p?.visible === "boolean" ? p.visible : true,
  });

  const wingsSource = Array.isArray(parts.wings) && parts.wings.length ? parts.wings : defaultShipConfig3D.parts.wings;
  const enginesSource = Array.isArray(parts.engines) && parts.engines.length
    ? parts.engines
    : defaultShipConfig3D.parts.engines;

  return {
    ...config,
    parts: {
      nose: clonePart(parts.nose || defaultShipConfig3D.parts.nose),
      body: clonePart(parts.body || defaultShipConfig3D.parts.body),
      wings: wingsSource.map((w) => clonePart(w)),
      engines: enginesSource.map((e) => clonePart(e)),
      cockpit: clonePart(parts.cockpit || defaultShipConfig3D.parts.cockpit),
      tail: clonePart(parts.tail || defaultShipConfig3D.parts.tail),
    },
  };
};

export const buildConfig3DFromRaw = (raw, existing = null) => {
  const base = existing || defaultShipConfig3D;

  const num = (v, fallback, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return clamp(n, min, max);
  };

  const merged = mergeConfig3D(base, {
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

  return ensurePartsConfig(merged);
};

