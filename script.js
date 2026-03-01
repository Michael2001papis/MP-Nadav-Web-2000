import { initScene } from "./3d/scene.js";
import { createShip } from "./3d/shipFactory.js";
import { updateShipFromConfig } from "./3d/shipEditor.js";
import { defaultShipConfig3D, mergeConfig3D, buildConfig3DFromRaw } from "./3d/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "spaceyard-fleet-v1";

  const TYPE_LABELS = {
    explorer: "ספינת מחקר",
    fighter: "חללית קרב",
    cargo: "משא בין־כוכבי",
    luxury: "יאכטת חלל",
  };

  const RISK_LABELS = {
    low: "נמוכה",
    medium: "בינונית",
    high: "גבוהה",
    extreme: "קצה גבול היכולת",
  };

  const FEATURE_LABELS = {
    shield: "מגן אנרגיה",
    lasers: "תותחי לייזר",
    cloak: "מערכת הסתרה",
    drones: "רחפני שירות",
  };

  const ADVANCED_LABELS = {
    autopilot: "טייס אוטומטי מלא",
    ai: "בינה מלאכותית טקטית",
    quantumCore: "ליבת עיבוד קוואנטית",
    escapeSystem: "מערכת מילוט חכמה",
  };

  const ALIEN_LABELS = {
    scout: "חייזר סייר",
    engineer: "חייזר מהנדס",
    warrior: "חייזר לוחם",
    diplomat: "חייזר דיפלומט",
  };

  let fleet = [];
  let selectedShipId = null;
  let isEditMode = false;
  let threeContext = null;
  let currentShip3D = null;

  const yearSpan = document.getElementById("year");
  const ctaButton = document.getElementById("cta-button");
  const shipForm = document.getElementById("ship-form");
  const shipPreview = document.getElementById("ship-preview");
  const shipSummary = document.getElementById("ship-summary");
  const shipCanvas = document.getElementById("ship-canvas");
  const shipCanvasFallback = document.getElementById("ship-canvas-fallback");
  const fleetList = document.getElementById("fleet-list");
  const fleetSort = document.getElementById("fleet-sort");
  const fleetFilterType = document.getElementById("fleet-filter-type");
  const fleetSearch = document.getElementById("fleet-search");
  const fleetSummaryLine = document.getElementById("fleet-summary");
  const fleetResetBtn = document.getElementById("fleet-reset-btn");
  const toastContainer = document.getElementById("toast-container");
  const formErrorsTop = document.getElementById("form-errors");
  const editIndicator = document.getElementById("edit-indicator");
  const primaryShipBtn = document.getElementById("primary-ship-btn");
  const duplicateShipBtn = document.getElementById("duplicate-ship-btn");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
  }

  if (ctaButton) {
    ctaButton.addEventListener("click", () => {
      const builderSection = document.getElementById("builder");
      if (builderSection) {
        builderSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  const showToast = (message, type = "info") => {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener(
        "transitionend",
        () => {
          toast.remove();
        },
        { once: true }
      );
    }, 2600);
  };

  const updateRangeLabels = () => {
    document.querySelectorAll(".range-group input[type='range']").forEach((input) => {
      const valueEl = document.querySelector(
        `.range-value[data-for="${input.id}"]`
      );
      if (valueEl) {
        valueEl.textContent = input.value;
      }
    });
  };

  updateRangeLabels();

  document
    .querySelectorAll(".range-group input[type='range']")
    .forEach((input) => {
      input.addEventListener("input", updateRangeLabels);
    });

  const clearFormErrors = () => {
    if (formErrorsTop) {
      formErrorsTop.textContent = "";
      formErrorsTop.classList.remove("visible");
    }
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
    });
  };

  const showFormErrors = (errors) => {
    const keys = Object.keys(errors);
    if (formErrorsTop && keys.length > 0) {
      formErrorsTop.textContent = "יש שגיאות בטופס. תקן את השדות המסומנים והנסה שוב.";
      formErrorsTop.classList.add("visible");
    }
    keys.forEach((field) => {
      const fieldError = document.querySelector(
        `.field-error[data-error-for="${field}"]`
      );
      if (fieldError) {
        fieldError.textContent = errors[field];
      }
    });
  };

  const getRawFormData = () => {
    if (!shipForm) return {};
    const formData = new FormData(shipForm);
    return {
      shipName: formData.get("shipName")?.toString().trim() || "",
      shipType: formData.get("shipType")?.toString() || "",
      shipColor: formData.get("shipColor")?.toString() || "#7c3aed",
      shipSpeed: formData.get("shipSpeed")?.toString() || "5",
      shipSize: formData.get("shipSize")?.toString() || "5",
      shipCrew: formData.get("shipCrew")?.toString() || "1",
      commanderName: formData.get("commanderName")?.toString().trim() || "",
      missionDescription: formData.get("missionDescription")?.toString() || "",
      riskLevel: formData.get("riskLevel")?.toString() || "medium",
      alienType: formData.get("alienType")?.toString() || "",
      features: formData.getAll("features").map((f) => f.toString()),
      advanced: formData.getAll("advanced").map((a) => a.toString()),
      primaryColor3D: formData.get("primaryColor3D")?.toString() || "",
      secondaryColor3D: formData.get("secondaryColor3D")?.toString() || "",
      materialType3D: formData.get("materialType3D")?.toString() || "",
      bodyLength3D: formData.get("bodyLength3D")?.toString() || "",
      wingSpan3D: formData.get("wingSpan3D")?.toString() || "",
      wingAngle3D: formData.get("wingAngle3D")?.toString() || "",
      engineSize3D: formData.get("engineSize3D")?.toString() || "",
      engineGlow3D: formData.get("engineGlow3D")?.toString() || "",
      cockpitTint3D: formData.get("cockpitTint3D")?.toString() || "",
      decals3D: formData.get("decals3D")?.toString() || "",
      alienTechLevel3D: formData.get("alienTechLevel3D")?.toString() || "",
    };
  };

  const validateShip = (raw) => {
    const errors = {};
    if (!raw.shipName || raw.shipName.length < 2) {
      errors.shipName = "שם החללית חייב להכיל לפחות 2 תווים.";
    }

    const crewNum = Number(raw.shipCrew);
    if (!Number.isFinite(crewNum) || crewNum < 1) {
      errors.shipCrew = "מספר הצוות חייב להיות לפחות 1.";
    } else if (crewNum > 500) {
      errors.shipCrew = "מספר הצוות לא יכול לעלות על 500.";
    }

    if (!raw.commanderName) {
      errors.commanderName = "יש להזין שם מפקד/ת משימה.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const normalizeShip = (raw, existingId = null, existingCreatedAt = null, existingConfig3D = null) => {
    const speed = Number(raw.shipSpeed);
    const size = Number(raw.shipSize);
    const crew = Number(raw.shipCrew);
    const config3D = buildConfig3DFromRaw(raw, existingConfig3D || raw.config3D || null);

    return {
      id: existingId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: existingCreatedAt || Date.now(),
      shipName: raw.shipName || "חללית ללא שם",
      shipType: raw.shipType || "explorer",
      shipColor: raw.shipColor || "#7c3aed",
      shipSpeed: Number.isFinite(speed) ? speed : 5,
      shipSize: Number.isFinite(size) ? size : 5,
      shipCrew: Number.isFinite(crew) ? crew : 1,
      commanderName: raw.commanderName,
      missionDescription: raw.missionDescription || "",
      riskLevel: raw.riskLevel || "medium",
      alienType: raw.alienType || "",
      features: Array.isArray(raw.features) ? raw.features : [],
      advanced: Array.isArray(raw.advanced) ? raw.advanced : [],
      config3D,
    };
  };

  const buildSummaryText = (ship) => {
    const typeLabel = TYPE_LABELS[ship.shipType] || "חללית מותאמת אישית";
    const featuresText =
      ship.features.length > 0
        ? ship.features.map((f) => FEATURE_LABELS[f] || f).join(" · ")
        : "ללא יכולות מיוחדות";
    const advancedText =
      ship.advanced.length > 0
        ? ship.advanced.map((a) => ADVANCED_LABELS[a] || a).join(" · ")
        : "ללא מערכות נוספות";
    const riskText = RISK_LABELS[ship.riskLevel] || "לא סווגה";
    const commander = ship.commanderName || "לא הוגדר";
    const mission =
      ship.missionDescription && ship.missionDescription.trim().length > 0
        ? ship.missionDescription.trim()
        : null;
    const alien =
      ship.alienType && ALIEN_LABELS[ship.alienType]
        ? ` · חייזר מלווה: ${ALIEN_LABELS[ship.alienType]}`
        : "";

    return `
      <strong>${ship.shipName || "חללית ללא שם"}</strong> היא ${typeLabel}
      בצבע מותאם, למהירות עיוות של <strong>${ship.shipSpeed}</strong>,
      בגודל יחסי <strong>${ship.shipSize}</strong> וצוות של
      <strong>${ship.shipCrew}</strong> אסטרונאוטים.
      <br />
      יכולות מיוחדות: <strong>${featuresText}</strong>.
      <br />
      מערכות מתקדמות: <strong>${advancedText}</strong>.
      <br />
      מפקד/ת המשימה: <strong>${commander}</strong>, רמת סיכון: <strong>${riskText}</strong>${alien}.
      ${mission ? `<br />תיאור המשימה: ${mission}` : ""}
    `;
  };

  const applyShipColor = (color) => {
    if (!shipPreview || !shipPreview.style) return;
    shipPreview.style.setProperty("--accent", color || "#7c3aed");
  };

  const loadShipIntoForm = (ship) => {
    if (!shipForm) return;
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null) {
        el.value = value;
      }
    };

    setValue("ship-name", ship.shipName || "");
    setValue("ship-type", ship.shipType || "explorer");
    setValue("ship-color", ship.shipColor || "#7c3aed");
    setValue("ship-speed", ship.shipSpeed ?? 5);
    setValue("ship-size", ship.shipSize ?? 5);
    setValue("ship-crew", ship.shipCrew ?? 1);
    setValue("commander-name", ship.commanderName || "");
    setValue("mission-description", ship.missionDescription || "");
    setValue("risk-level", ship.riskLevel || "medium");
    setValue("alien-type", ship.alienType || "");
    if (ship.config3D) {
      const cfg = mergeConfig3D(defaultShipConfig3D, ship.config3D);
      setValue("primary-color-3d", cfg.primaryColor);
      setValue("secondary-color-3d", cfg.secondaryColor);
      setValue("material-type-3d", cfg.materialType);
      setValue("body-length-3d", String(cfg.bodyLength));
      setValue("wing-span-3d", String(cfg.wingSpan));
      setValue("wing-angle-3d", String(cfg.wingAngle));
      setValue("engine-size-3d", String(cfg.engineSize));
      setValue("engine-glow-3d", String(cfg.engineGlow));
      setValue("cockpit-tint-3d", String(cfg.cockpitTint));
      setValue("decals-3d", cfg.decals);
      setValue("alien-tech-level-3d", String(cfg.alienTechLevel));
      if (threeContext && currentShip3D && currentShip3D.parts) {
        updateShipFromConfig(currentShip3D.parts, cfg);
        currentShip3D.config3D = cfg;
      }
    }

    document
      .querySelectorAll('input[name="features"]')
      .forEach((checkbox) => {
        checkbox.checked = Array.isArray(ship.features)
          ? ship.features.includes(checkbox.value)
          : false;
      });

    document
      .querySelectorAll('input[name="advanced"]')
      .forEach((checkbox) => {
        checkbox.checked = Array.isArray(ship.advanced)
          ? ship.advanced.includes(checkbox.value)
          : false;
      });

    updateRangeLabels();
    if (shipForm) {
      shipForm.dispatchEvent(new Event("input"));
    }
  };

  const enterEditMode = (ship) => {
    isEditMode = true;
    selectedShipId = ship.id;
    if (editIndicator) {
      editIndicator.textContent = `עורך חללית: ${ship.shipName}`;
      editIndicator.classList.remove("hidden");
    }
    if (primaryShipBtn) {
      primaryShipBtn.textContent = "עדכן חללית";
    }
    if (duplicateShipBtn) {
      duplicateShipBtn.classList.remove("hidden");
    }
    loadShipIntoForm(ship);
  };

  const exitEditMode = () => {
    isEditMode = false;
    selectedShipId = null;
    if (editIndicator) {
      editIndicator.textContent = "";
      editIndicator.classList.add("hidden");
    }
    if (primaryShipBtn) {
      primaryShipBtn.textContent = "הוסף חללית לצי";
    }
    if (duplicateShipBtn) {
      duplicateShipBtn.classList.add("hidden");
    }
  };

  const saveFleetToStorage = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fleet));
    } catch {
      // ignore storage errors
    }
  };

  const loadFleetFromStorage = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        fleet = parsed.map((item) =>
          normalizeShip(
            item,
            item.id || null,
            typeof item.createdAt === "number" ? item.createdAt : null,
            item.config3D || null
          )
        );
      }
    } catch {
      // ignore parse errors
    }
  };

  const deleteShipById = (id) => {
    const idx = fleet.findIndex((s) => s.id === id);
    if (idx === -1) return;
    fleet.splice(idx, 1);
    if (selectedShipId === id) {
      exitEditMode();
    }
    saveFleetToStorage();
    renderFleet();
    showToast("החללית נמחקה מהצי.", "success");
  };

  const renderFleet = () => {
    if (!fleetList) return;

    const sortBy = fleetSort ? fleetSort.value : "created";
    const filterType = fleetFilterType ? fleetFilterType.value : "";
    const searchQuery = fleetSearch
      ? fleetSearch.value.trim().toLowerCase()
      : "";

    let ships = [...fleet];

    if (filterType) {
      ships = ships.filter((s) => s.shipType === filterType);
    }

    if (searchQuery) {
      ships = ships.filter((s) =>
        (s.shipName || "").toLowerCase().includes(searchQuery)
      );
    }

    const riskOrder = ["low", "medium", "high", "extreme"];

    ships.sort((a, b) => {
      switch (sortBy) {
        case "speed":
          return b.shipSpeed - a.shipSpeed;
        case "size":
          return b.shipSize - a.shipSize;
        case "crew":
          return b.shipCrew - a.shipCrew;
        case "risk":
          return (
            riskOrder.indexOf(b.riskLevel) - riskOrder.indexOf(a.riskLevel)
          );
        case "created":
        default:
          return (a.createdAt || 0) - (b.createdAt || 0);
      }
    });

    fleetList.innerHTML = "";
    fleetList.classList.remove("empty");

    if (fleetSummaryLine) {
      const total = fleet.length;
      const shown = ships.length;
      if (shown === total) {
        fleetSummaryLine.textContent = `סה"כ חלליות: ${total}`;
      } else {
        fleetSummaryLine.textContent = `סה"כ חלליות: ${total} · מוצגות כעת: ${shown}`;
      }
    }

    if (ships.length === 0) {
      fleetList.classList.add("empty");
      fleetList.textContent = "עדיין לא נוספו חלליות. בנה את הראשונה שלך למעלה.";
      return;
    }

    ships.forEach((ship) => {
      const card = document.createElement("div");
      card.className = "fleet-card";
      if (ship.id === selectedShipId) {
        card.classList.add("selected");
      }

      const main = document.createElement("div");
      main.className = "fleet-card-main";

      const title = document.createElement("div");
      title.className = "fleet-card-title";
      title.textContent = ship.shipName;

      const meta = document.createElement("div");
      meta.className = "fleet-card-meta";
      const riskLabel = RISK_LABELS[ship.riskLevel] || ship.riskLevel || "";
      meta.textContent = `צוות: ${ship.shipCrew} · מהירות: ${ship.shipSpeed} · גודל: ${ship.shipSize}${
        riskLabel ? ` · סיכון: ${riskLabel}` : ""
      }`;

      main.appendChild(title);
      main.appendChild(meta);

      if (ship.alienType && ALIEN_LABELS[ship.alienType]) {
        const alienBadge = document.createElement("div");
        alienBadge.className = "alien-badge";
        alienBadge.dataset.alienType = ship.alienType;
        alienBadge.textContent = ALIEN_LABELS[ship.alienType];
        main.appendChild(alienBadge);
      }

      const rightSide = document.createElement("div");
      rightSide.style.display = "flex";
      rightSide.style.alignItems = "center";
      rightSide.style.gap = "6px";

      const pill = document.createElement("div");
      pill.className = "fleet-card-pill";
      pill.style.background = `radial-gradient(circle at 30% 0, #e5e7eb, ${
        ship.shipColor || "#7c3aed"
      }, #020617)`;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "fleet-card-delete";
      deleteBtn.setAttribute("aria-label", "מחק חללית מהצי");
      deleteBtn.textContent = "✕";

      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const confirmed = window.confirm("למחוק את החללית הזו מהצי?");
        if (!confirmed) return;
        deleteShipById(ship.id);
      });

      rightSide.appendChild(pill);
      rightSide.appendChild(deleteBtn);

      card.appendChild(main);
      card.appendChild(rightSide);

      card.addEventListener("click", () => {
        enterEditMode(ship);
        renderFleet();
      });

      fleetList.appendChild(card);
    });
  };

  const show3DFallback = () => {
    if (shipCanvas && shipCanvas.style) shipCanvas.style.setProperty("display", "none");
    if (shipCanvasFallback) shipCanvasFallback.classList.remove("hidden");
    showToast("תצוגת 3D לא זמינה – המשך שימוש בטופס וברשימת הצי.", "info");
  };

  if (shipCanvas) {
    try {
      threeContext = initScene(shipCanvas);
      if (!threeContext) throw new Error("initScene returned null");
      const initialConfig3D = defaultShipConfig3D;
      const { group, parts } = createShip(initialConfig3D);
      threeContext.setShipGroup(group);
      currentShip3D = { group, parts, config3D: initialConfig3D };
    } catch (err) {
      console.warn("SpaceYard: 3D not available", err);
      threeContext = null;
      currentShip3D = null;
      show3DFallback();
    }
  }

  if (shipForm && shipSummary && fleetList) {
    shipForm.addEventListener("input", () => {
      clearFormErrors();
      const raw = getRawFormData();
      const normalized = normalizeShip(
        raw,
        selectedShipId,
        null,
        currentShip3D?.config3D || null
      );
      shipSummary.innerHTML = buildSummaryText(normalized);
      applyShipColor(normalized.shipColor);
      if (threeContext && currentShip3D && currentShip3D.parts) {
        const cfg = buildConfig3DFromRaw(raw, currentShip3D.config3D);
        updateShipFromConfig(currentShip3D.parts, cfg);
        currentShip3D.config3D = cfg;
      }
    });

    shipForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormErrors();

      const raw = getRawFormData();
      const { isValid, errors } = validateShip(raw);

      if (!isValid) {
        showFormErrors(errors);
        showToast("יש שגיאות בטופס. תקן ונסה שוב.", "error");
        return;
      }

      if (isEditMode && selectedShipId) {
        const idx = fleet.findIndex((s) => s.id === selectedShipId);
        if (idx !== -1) {
          const existing = fleet[idx];
          fleet[idx] = normalizeShip(raw, existing.id, existing.createdAt, existing.config3D || null);
        }
        saveFleetToStorage();
        renderFleet();
        showToast("החללית עודכנה בהצלחה.", "success");
      } else {
        const normalized = normalizeShip(raw);
        fleet.push(normalized);
        if (currentShip3D) {
          currentShip3D.config3D = normalized.config3D;
        }
        saveFleetToStorage();
        renderFleet();
        showToast("חללית נוספה לצי.", "success");
      }
    });

    if (duplicateShipBtn) {
      duplicateShipBtn.addEventListener("click", () => {
        const raw = getRawFormData();
        const { isValid, errors } = validateShip(raw);
        if (!isValid) {
          showFormErrors(errors);
          showToast("לא ניתן לשכפל – יש שגיאות בטופס.", "error");
          return;
        }
        const duplicated = normalizeShip(raw);
        fleet.push(duplicated);
        saveFleetToStorage();
        renderFleet();
        showToast("חללית שוכפלה לצי.", "success");
      });
    }

    if (fleetSort) {
      fleetSort.addEventListener("change", renderFleet);
    }
    if (fleetFilterType) {
      fleetFilterType.addEventListener("change", renderFleet);
    }
    if (fleetSearch) {
      fleetSearch.addEventListener("input", renderFleet);
    }
    if (fleetResetBtn) {
      fleetResetBtn.addEventListener("click", () => {
        const confirmed = window.confirm("לאפס את כל צי החלליות?");
        if (!confirmed) return;
        fleet = [];
        exitEditMode();
        saveFleetToStorage();
        renderFleet();
        showToast("הצי אופס בהצלחה.", "success");
      });
    }

    loadFleetFromStorage();
    if (fleet.length === 0) {
      const demo = normalizeShip({
        shipName: "אוריון פרו",
        shipType: "explorer",
        shipColor: "#38bdf8",
        shipSpeed: "8",
        shipSize: "6",
        shipCrew: "24",
        commanderName: "סרן עדי אוריון",
        missionDescription:
          "משימת חקר ארוכה אל ערפילית אוריון, מיפוי מסלולי אסטרואידים והקמת תחנת תדלוק חללית.",
        riskLevel: "high",
        alienType: "engineer",
        features: ["shield", "cloak", "drones"],
        advanced: ["autopilot", "ai", "quantumCore"],
      });
      fleet.push(demo);
      saveFleetToStorage();
    }

    renderFleet();

    const initialRaw = getRawFormData();
    const initialNormalized = normalizeShip(initialRaw);
    shipSummary.innerHTML = buildSummaryText(initialNormalized);
    applyShipColor(initialNormalized.shipColor);
  }
});

