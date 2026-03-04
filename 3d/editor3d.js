/**
 * SpaceYard 3D Editor — מערכת בניית חלליות ומטוסים
 * גישה: משתמש עסקי ומפתח בלבד
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const MAX_PARTS = 24;
const EDITOR_STORAGE_KEY = "spaceyard-editor-designs-v1";

const PART_TYPES = {
  body: { label: "גוף", geo: "cylinder", size: [1.2, 2.5, 1.2], color: "#38bdf8" },
  wing: { label: "כנפיים", geo: "box", size: [1.5, 0.1, 0.8], color: "#a855f7" },
  engine: { label: "מנוע", geo: "cylinder", size: [0.4, 0.8, 0.4], color: "#22d3ee" },
  cockpit: { label: "קוקפיט", geo: "sphere", size: [0.5, 0.5, 0.5], color: "#e0f2fe" },
};

const createPartGeometry = (type, size) => {
  const [x, y, z] = size;
  switch (type) {
    case "cylinder":
      return new THREE.CylinderGeometry(x / 2, x / 2, y, 16);
    case "sphere":
      return new THREE.SphereGeometry(x / 2, 16, 12);
    case "box":
    default:
      return new THREE.BoxGeometry(x, y, z);
  }
};

export const initEditor3D = (canvas, options = {}) => {
  if (!canvas) return null;

  const container = canvas.parentElement;
  const fallbackEl = document.getElementById("editor3d-fallback");
  const showGrid = () => document.getElementById("editor3d-grid")?.checked !== false;
  const showLighting = () => document.getElementById("editor3d-lighting")?.checked !== false;

  let scene, camera, renderer, controls;
  let editorCtx = null;
  let shipGroup = new THREE.Group();
  let parts = [];
  let selectedPart = null;
  let currentTool = "select";
  let gridHelper = null;
  let ambientLight = null;
  let dirLight = null;

  const disposeGroup = (group) => {
    if (!group) return;
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  };

  const createPartMesh = (type, id, pos = [0, 0, 0], scale = 1, color = null) => {
    const def = PART_TYPES[type] || PART_TYPES.body;
    const geo = createPartGeometry(def.geo, def.size);
    const mat = new THREE.MeshStandardMaterial({
      color: color || def.color,
      metalness: 0.6,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.setScalar(scale);
    mesh.userData = { partId: id, partType: type };
    return mesh;
  };

  const addPart = (type) => {
    if (parts.length >= MAX_PARTS) return null;
    const id = `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const def = PART_TYPES[type] || PART_TYPES.body;
    const offset = (parts.length * 0.5) % 3;
    const pos = [offset * 0.5, 0, (Math.floor(parts.length / 3) * 0.5) % 2];
    const mesh = createPartMesh(type, id, pos, 1, def.color);
    shipGroup.add(mesh);
    parts.push({
      id,
      type,
      mesh,
      position: [...pos],
      rotation: [0, 0, 0],
      scale: 1,
      color: def.color,
    });
    return mesh;
  };

  const removePart = (part) => {
    const idx = parts.findIndex((p) => p.id === part.id);
    if (idx === -1) return;
    shipGroup.remove(part.mesh);
    disposeGroup(part.mesh);
    parts.splice(idx, 1);
    if (selectedPart === part) selectedPart = null;
    updateBlueprint();
  };

  const duplicatePart = (part) => {
    if (parts.length >= MAX_PARTS) return null;
    const newMesh = createPartMesh(
      part.type,
      `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      [part.position[0] + 0.3, part.position[1], part.position[2] + 0.3],
      part.scale,
      part.color
    );
    newMesh.rotation.set(part.mesh.rotation.x, part.mesh.rotation.y, part.mesh.rotation.z);
    shipGroup.add(newMesh);
    const newPart = {
      id: newMesh.userData.partId,
      type: part.type,
      mesh: newMesh,
      position: [newMesh.position.x, newMesh.position.y, newMesh.position.z],
      rotation: [newMesh.rotation.x, newMesh.rotation.y, newMesh.rotation.z],
      scale: part.scale,
      color: part.color,
    };
    parts.push(newPart);
    return newPart;
  };

  const getDesignData = () => ({
    parts: parts.map((p) => ({
      id: p.id,
      type: p.type,
      position: [p.mesh.position.x, p.mesh.position.y, p.mesh.position.z],
      rotation: [p.mesh.rotation.x, p.mesh.rotation.y, p.mesh.rotation.z],
      scale: p.scale,
      color: p.color,
    })),
    version: 1,
  });

  const loadDesignData = (data) => {
    if (!data || !Array.isArray(data.parts)) return;
    disposeGroup(shipGroup);
    shipGroup = new THREE.Group();
    parts = [];
    const maxLoad = Math.min(data.parts.length, MAX_PARTS);
    for (let i = 0; i < maxLoad; i++) {
      const p = data.parts[i];
      const def = PART_TYPES[p.type] || PART_TYPES.body;
      const mesh = createPartMesh(p.type, p.id, p.position || [0, 0, 0], p.scale || 1, p.color || def.color);
      mesh.rotation.set(p.rotation?.[0] || 0, p.rotation?.[1] || 0, p.rotation?.[2] || 0);
      shipGroup.add(mesh);
      parts.push({
        id: p.id,
        type: p.type,
        mesh,
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scale: p.scale || 1,
        color: p.color || def.color,
      });
    }
    scene.add(shipGroup);
    updateBlueprint();
  };

  const saveToStorage = (name = "עיצוב") => {
    try {
      const designs = JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY) || "[]");
      designs.push({ name, data: getDesignData(), at: Date.now() });
      localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(designs));
      return true;
    } catch {
      return false;
    }
  };

  const loadFromStorage = (index) => {
    try {
      const designs = JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY) || "[]");
      const item = designs[index];
      if (item && item.data) loadDesignData(item.data);
    } catch {
      loadDesignData({ parts: [] });
    }
  };

  const getSavedDesigns = () => {
    try {
      return JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const getPartSize = (p) => {
    const def = PART_TYPES[p.type] || PART_TYPES.body;
    const [x, y, z] = def.size;
    const s = p.scale || 1;
    return { x: x * s, y: y * s, z: z * s };
  };

  const updateBlueprint = () => {
    const canvases = [
      document.getElementById("editor3d-bp-top"),
      document.getElementById("editor3d-bp-side"),
      document.getElementById("editor3d-bp-front"),
    ].filter(Boolean);
    if (canvases.length < 3) return;
    const labels = ["מבט על", "מבט צד", "מבט קדמי"];
    const scale = 18;
    const proj = (c, w, h, view, pos, size) => {
      let x, y, r1, r2;
      if (view === 0) {
        x = w / 2 + pos.x * scale;
        y = h / 2 - pos.z * scale;
        r1 = (size.x / 2) * scale;
        r2 = (size.z / 2) * scale;
      } else if (view === 1) {
        x = w / 2 + pos.x * scale;
        y = h / 2 - pos.y * scale;
        r1 = (size.x / 2) * scale;
        r2 = (size.y / 2) * scale;
      } else {
        x = w / 2 + pos.z * scale;
        y = h / 2 - pos.y * scale;
        r1 = (size.z / 2) * scale;
        r2 = (size.y / 2) * scale;
      }
      return { x, y, r1, r2 };
    };
    canvases.forEach((c, viewIndex) => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const w = 120;
      const h = 90;
      c.width = w;
      c.height = h;
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(100, 140, 200, 0.35)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      parts.forEach((p) => {
        const pos = p.mesh.position;
        const size = getPartSize(p);
        const { x, y, r1, r2 } = proj(c, w, h, viewIndex, pos, size);
        ctx.fillStyle = p.color || "#38bdf8";
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.max(3, r1), Math.max(3, r2), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = "rgba(120, 140, 180, 0.6)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(labels[viewIndex], w / 2, h - 8);
    });
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(4, 3, 6);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    scene.add(shipGroup);
    addPart("body");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 400;
      const h = rect.height || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const updateGrid = () => {
      if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper.geometry.dispose();
        gridHelper.material.dispose();
      }
      if (showGrid()) {
        gridHelper = new THREE.GridHelper(8, 16, 0x334155, 0x1e293b);
        scene.add(gridHelper);
      }
    };
    updateGrid();
    document.getElementById("editor3d-grid")?.addEventListener("change", updateGrid);

    document.getElementById("editor3d-lighting")?.addEventListener("change", () => {
      ambientLight.visible = showLighting();
      dirLight.visible = showLighting();
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = parts.map((p) => p.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        selectedPart = parts.find((p) => p.mesh === hits[0].object);
        if (currentTool === "delete" && selectedPart) {
          removePart(selectedPart);
          selectedPart = null;
        } else if (currentTool === "duplicate" && selectedPart) {
          selectedPart = duplicatePart(selectedPart);
        }
      } else {
        selectedPart = null;
      }
    };

    canvas.addEventListener("pointerdown", (e) => {
      onPointerDown(e);
      updatePropsPanel();
    });

    document.querySelectorAll(".editor3d-btn[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTool = btn.dataset.tool;
        document.querySelectorAll(".editor3d-btn[data-tool]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    document.querySelectorAll(".editor3d-btn[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        addPart(btn.dataset.add);
        updateBlueprint();
      });
    });

    const propsPanel = document.getElementById("editor3d-props-panel");
    const propsEmpty = document.getElementById("editor3d-props-empty");
    const partColor = document.getElementById("editor-part-color");
    const partScale = document.getElementById("editor-part-scale");

    const toDeg = (r) => Math.round((r * 180) / Math.PI);
    const toRad = (d) => (d * Math.PI) / 180;

    const updatePropsPanel = () => {
      if (!selectedPart) {
        if (propsPanel) propsPanel.classList.add("hidden");
        if (propsEmpty) propsEmpty.classList.remove("hidden");
        return;
      }
      if (propsPanel) propsPanel.classList.remove("hidden");
      if (propsEmpty) propsEmpty.classList.add("hidden");
      if (partColor) partColor.value = selectedPart.color;
      if (partScale) partScale.value = String(selectedPart.scale);
      const rv = document.querySelector(".range-value[data-for='editor-part-scale']");
      if (rv) rv.textContent = selectedPart.scale;
      const px = document.getElementById("editor-part-pos-x");
      const py = document.getElementById("editor-part-pos-y");
      const pz = document.getElementById("editor-part-pos-z");
      if (px) px.value = selectedPart.mesh.position.x.toFixed(2);
      if (py) py.value = selectedPart.mesh.position.y.toFixed(2);
      if (pz) pz.value = selectedPart.mesh.position.z.toFixed(2);
      const rx = document.getElementById("editor-part-rot-x");
      const ry = document.getElementById("editor-part-rot-y");
      const rz = document.getElementById("editor-part-rot-z");
      if (rx) rx.value = toDeg(selectedPart.mesh.rotation.x);
      if (ry) ry.value = toDeg(selectedPart.mesh.rotation.y);
      if (rz) rz.value = toDeg(selectedPart.mesh.rotation.z);
      const idEl = document.getElementById("editor-part-id");
      if (idEl) idEl.textContent = `${PART_TYPES[selectedPart.type]?.label || selectedPart.type} (${selectedPart.id.slice(-6)})`;
    };

    if (partColor) {
      partColor.addEventListener("input", () => {
        if (selectedPart) {
          selectedPart.color = partColor.value;
          selectedPart.mesh.material.color.set(partColor.value);
        }
      });
    }
    if (partScale) {
      partScale.addEventListener("input", () => {
        if (selectedPart) {
          selectedPart.scale = Math.max(0.5, Math.min(3, Number(partScale.value)));
          selectedPart.mesh.scale.setScalar(selectedPart.scale);
          const rv = document.querySelector(".range-value[data-for='editor-part-scale']");
          if (rv) rv.textContent = selectedPart.scale;
          updateBlueprint();
        }
      });
    }

    ["editor-part-pos-x", "editor-part-pos-y", "editor-part-pos-z"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", () => {
          if (selectedPart) {
            const v = Number(el.value) || 0;
            selectedPart.mesh.position.setComponent(i, v);
            selectedPart.position[i] = v;
            updateBlueprint();
          }
        });
      }
    });

    ["editor-part-rot-x", "editor-part-rot-y", "editor-part-rot-z"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", () => {
          if (selectedPart) {
            const deg = Number(el.value) || 0;
            const rad = toRad(deg);
            selectedPart.mesh.rotation.setComponent(i, rad);
            selectedPart.rotation[i] = rad;
            updateBlueprint();
          }
        });
      }
    });

    const refreshDesignList = () => {
      const sel = document.getElementById("editor3d-design-list");
      if (!sel) return;
      const designs = getSavedDesigns();
      sel.innerHTML = "<option value=''>-- טען עיצוב --</option>";
      designs.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        const date = d.at ? new Date(d.at).toLocaleDateString("he-IL") : "";
        opt.textContent = `${d.name || "עיצוב"} (${date})`;
        sel.appendChild(opt);
      });
    };

    document.getElementById("editor3d-save")?.addEventListener("click", () => {
      saveToStorage();
      refreshDesignList();
      if (options.onSave) options.onSave();
    });

    document.getElementById("editor3d-load")?.addEventListener("click", () => {
      const designs = getSavedDesigns();
      if (designs.length === 0) {
        if (options.onLoadError) options.onLoadError("אין עיצובים שמורים");
        return;
      }
      const sel = document.getElementById("editor3d-design-list");
      const idx = sel ? parseInt(sel.value, 10) : designs.length - 1;
      const i = Number.isNaN(idx) || idx < 0 ? designs.length - 1 : Math.min(idx, designs.length - 1);
      const item = designs[i];
      if (item?.data) {
        loadDesignData(item.data);
        if (options.onLoad) options.onLoad();
      }
    });

    refreshDesignList();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (selectedPart) {
        selectedPart.mesh.material.emissive = new THREE.Color(0x334455);
        selectedPart.mesh.material.emissiveIntensity = 0.3;
      }
      parts.forEach((p) => {
        if (p !== selectedPart && p.mesh.material.emissive) {
          p.mesh.material.emissive.setHex(0x000000);
          p.mesh.material.emissiveIntensity = 0;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    if (fallbackEl) fallbackEl.classList.add("hidden");
    updateBlueprint();

    return {
      addPart,
      removePart,
      duplicatePart,
      getDesignData,
      loadDesignData,
      saveToStorage,
      loadFromStorage,
      getSavedDesigns,
      setSelectedPart: (p) => {
        selectedPart = p;
        updatePropsPanel();
      },
      getSelectedPart: () => selectedPart,
      updateBlueprint,
    };
  } catch (err) {
    console.warn("SpaceYard: Editor 3D init failed", err);
    if (fallbackEl) fallbackEl.classList.remove("hidden");
    return null;
  }
};
