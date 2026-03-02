import { initScene } from "./3d/scene.js";
import { createShip } from "./3d/shipFactory.js";
import { updateShipFromConfig } from "./3d/shipEditor.js";
import { defaultShipConfig3D, mergeConfig3D, buildConfig3DFromRaw } from "./3d/utils.js";

const SESSION_KEY = "spaceyard-session-v1";
const FLEET_STORAGE_KEY = "spaceyard-fleet-v1";
const WELCOME_STORAGE_KEY = "spaceyard-welcome-v1";

const USERS = {
  NM1324: { password: "321321", role: "business_admin", displayName: "NM1324" },
  MP1234: { password: "MP2001", role: "developer", displayName: "MP1234" },
};

const readSession = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.username !== "string" || typeof parsed.role !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (session) => {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
};

const clearSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = FLEET_STORAGE_KEY;

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
  let threeContextStudio = null;
  let currentShip3D = null;

  const yearSpan = document.getElementById("year");
  const ctaButton = document.getElementById("cta-button");
  const shipForm = document.getElementById("ship-form");
  const shipPreview = document.getElementById("ship-preview");
  const shipSummary = document.getElementById("ship-summary");
  const shipCanvas = document.getElementById("ship-canvas");
  const shipCanvasFallback = document.getElementById("ship-canvas-fallback");
  const studioCanvas = document.getElementById("studio-canvas");
  const studioCanvasFallback = document.getElementById("studio-canvas-fallback");
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
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsModal = document.getElementById("settings-modal");
  const settingsModalClose = document.getElementById("settings-modal-close");
  const settingsModalOverlay = document.querySelector(".settings-modal-overlay");
  const settingsDone = document.getElementById("settings-done");
  const themeSelect = document.getElementById("theme-select");
  const fontSizeLarge = document.getElementById("font-size-large");
  const reducedMotion = document.getElementById("reduced-motion");
  const highContrast = document.getElementById("high-contrast");
  const autoRotate = document.getElementById("auto-rotate");
  const rotationSpeed = document.getElementById("rotation-speed");
  const qualityMode = document.getElementById("quality-mode");
  const showAxis = document.getElementById("show-axis");
  const autoSave = document.getElementById("auto-save");
  const fleetLimitInput = document.getElementById("fleet-limit");
  const confirmReset = document.getElementById("confirm-reset");
  const clearLocalData = document.getElementById("clear-local-data");
  const resetSettingsBtn = document.getElementById("reset-settings");

  const authScreen = document.getElementById("auth-screen");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const userLabel = document.getElementById("user-label");
  const logoutBtn = document.getElementById("logout-btn");
  const requestAccessHeader = document.getElementById("request-access-header");
  const requestUserModal = document.getElementById("request-user-modal");
  const requestUserForm = document.getElementById("request-user-form");
  const requestModalClose = document.getElementById("request-modal-close");
  const requestError = document.getElementById("request-error");
  const requestSuccess = document.getElementById("request-success");
  const openRequestModalBtn = document.getElementById("open-request-modal");
  const navDrawerRequest = document.getElementById("nav-drawer-request");
  const navDrawerLogout = document.getElementById("nav-drawer-logout");
  const welcomeModal = document.getElementById("welcome-modal");
  const welcomeModalClose = document.getElementById("welcome-modal-close");

  const SETTINGS_KEY_V2 = "spaceyard-settings-v2";
  const SETTINGS_KEY_V1 = "spaceyard-settings-v1";
  const FLEET_KEY = "spaceyard-fleet-v1";

  const DEFAULT_SETTINGS = {
    theme: "normal",
    fontSize: "normal",
    reducedMotion: false,
    highContrast: false,
    autoRotate: true,
    rotationSpeed: 0.5,
    qualityMode: "auto",
    showAxis: false,
    autoSave: true,
    fleetLimit: 50,
    confirmReset: true,
    telemetry: false,
  };

  const getSettingsFromDOM = () => ({
    theme: themeSelect ? themeSelect.value : DEFAULT_SETTINGS.theme,
    fontSize: fontSizeLarge && fontSizeLarge.checked ? "large" : "normal",
    reducedMotion: !!(reducedMotion && reducedMotion.checked),
    highContrast: !!(highContrast && highContrast.checked),
    autoRotate: !!(autoRotate && autoRotate.checked),
    rotationSpeed: rotationSpeed ? Number(rotationSpeed.value) : DEFAULT_SETTINGS.rotationSpeed,
    qualityMode: qualityMode ? qualityMode.value : DEFAULT_SETTINGS.qualityMode,
    showAxis: !!(showAxis && showAxis.checked),
    autoSave: !!(autoSave && autoSave.checked),
    fleetLimit: fleetLimitInput ? Math.min(500, Math.max(5, Number(fleetLimitInput.value) || 50)) : 50,
    confirmReset: !!(confirmReset && confirmReset.checked),
    telemetry: false,
  });

  const applySettingsToDOM = (s) => {
    const o = { ...DEFAULT_SETTINGS, ...s };
    if (themeSelect) themeSelect.value = o.theme;
    if (fontSizeLarge) fontSizeLarge.checked = o.fontSize === "large";
    if (reducedMotion) reducedMotion.checked = o.reducedMotion;
    if (highContrast) highContrast.checked = o.highContrast;
    if (autoRotate) autoRotate.checked = o.autoRotate;
    if (rotationSpeed) { rotationSpeed.value = String(o.rotationSpeed); rotationSpeed.dispatchEvent(new Event("input")); }
    if (qualityMode) qualityMode.value = o.qualityMode;
    if (showAxis) showAxis.checked = o.showAxis;
    if (autoSave) autoSave.checked = o.autoSave;
    if (fleetLimitInput) fleetLimitInput.value = String(o.fleetLimit);
    if (confirmReset) confirmReset.checked = o.confirmReset;
  };

  const applySettingsToSystem = (s) => {
    const o = { ...DEFAULT_SETTINGS, ...s };
    document.body.setAttribute("data-theme", o.theme === "normal" ? "" : o.theme);
    document.documentElement.classList.toggle("font-size-large", o.fontSize === "large");
    document.body.classList.toggle("reduced-motion", o.reducedMotion);
    document.body.classList.toggle("high-contrast", o.highContrast);
    if (threeContext && threeContext.set3DOptions) {
      threeContext.set3DOptions({
        autoRotate: o.reducedMotion ? false : o.autoRotate,
        rotationSpeed: o.rotationSpeed,
        qualityMode: o.qualityMode,
        showAxis: o.showAxis,
      });
    }
  };

  const loadSettings = () => {
    let s = null;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY_V2);
      if (raw) s = JSON.parse(raw);
      else {
        const v1 = localStorage.getItem(SETTINGS_KEY_V1);
        if (v1) {
          const v1p = JSON.parse(v1);
          s = { ...DEFAULT_SETTINGS, theme: v1p.theme || DEFAULT_SETTINGS.theme, fontSize: v1p.fontSizeLarge ? "large" : "normal" };
        }
      }
    } catch (_) {}
    const o = { ...DEFAULT_SETTINGS, ...s };
    applySettingsToDOM(o);
    applySettingsToSystem(o);
    if (s) try { localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(o)); } catch (_) {}
  };

  const saveSettings = () => {
    const o = getSettingsFromDOM();
    applySettingsToSystem(o);
    try {
      localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(o));
    } catch (_) {}
  };

  const getSettings = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY_V2);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (_) {}
    return { ...DEFAULT_SETTINGS };
  };

  loadSettings();

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

  const applyRoleUI = (session) => {
    const role = session?.role || "guest";
    document.body.dataset.role = role;
    if (userLabel) {
      if (session) {
        userLabel.textContent = `שלום, ${session.displayName || session.username}`;
      } else {
        userLabel.textContent = "";
      }
    }
    const authButtons = document.querySelectorAll(".auth-only-btn");
    authButtons.forEach((btn) => {
      if (!session) {
        btn.hidden = true;
      } else {
        btn.hidden = false;
      }
    });
    if (role !== "developer" && clearLocalData) {
      clearLocalData.disabled = true;
      clearLocalData.classList.add("settings-disabled");
    } else if (clearLocalData) {
      clearLocalData.disabled = false;
      clearLocalData.classList.remove("settings-disabled");
    }
  };

  const openWelcomeModal = () => {
    if (!welcomeModal) return;
    welcomeModal.classList.remove("hidden");
    welcomeModal.setAttribute("aria-hidden", "false");
  };

  const closeWelcomeModal = () => {
    if (!welcomeModal) return;
    welcomeModal.classList.add("hidden");
    welcomeModal.setAttribute("aria-hidden", "true");
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, "seen");
    } catch {
      // ignore
    }
  };

  const maybeShowWelcome = (session) => {
    if (!session) return;
    try {
      const flag = window.localStorage.getItem(WELCOME_STORAGE_KEY);
      if (flag === "seen") return;
    } catch {
      // ignore
    }
    openWelcomeModal();
  };

  if (welcomeModalClose) {
    welcomeModalClose.addEventListener("click", closeWelcomeModal);
  }
  const welcomeOverlay = welcomeModal?.querySelector(".welcome-modal-overlay");
  if (welcomeOverlay) {
    welcomeOverlay.addEventListener("click", closeWelcomeModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && welcomeModal && !welcomeModal.classList.contains("hidden")) {
      closeWelcomeModal();
    }
  });

  const openRequestModal = () => {
    if (!requestUserModal) return;
    requestUserModal.classList.remove("hidden");
    requestUserModal.setAttribute("aria-hidden", "false");
  };

  const closeRequestModal = () => {
    if (!requestUserModal) return;
    requestUserModal.classList.add("hidden");
    requestUserModal.setAttribute("aria-hidden", "true");
    if (requestError) requestError.textContent = "";
    if (requestSuccess) requestSuccess.textContent = "";
    requestUserForm?.reset();
  };

  if (openRequestModalBtn) {
    openRequestModalBtn.addEventListener("click", openRequestModal);
  }
  if (requestAccessHeader) {
    requestAccessHeader.addEventListener("click", openRequestModal);
  }
  if (navDrawerRequest) {
    navDrawerRequest.addEventListener("click", () => {
      closeDrawer();
      openRequestModal();
    });
  }
  if (requestModalClose) {
    requestModalClose.addEventListener("click", closeRequestModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && requestUserModal && !requestUserModal.classList.contains("hidden")) {
      closeRequestModal();
    }
  });

  if (settingsToggle && settingsModal) {
    settingsToggle.addEventListener("click", () => {
      const wasOpen = !settingsModal.classList.contains("hidden");
      const willOpen = !wasOpen;
      settingsModal.classList.toggle("hidden", !willOpen);
      settingsToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      settingsModal.setAttribute("aria-hidden", willOpen ? "false" : "true");
      if (willOpen && typeof updateRangeLabels === "function") updateRangeLabels();
    });
  }
  const closeModal = () => {
    if (settingsModal) settingsModal.classList.add("hidden");
    if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "false");
    if (settingsModal) settingsModal.setAttribute("aria-hidden", "true");
  };
  if (settingsModalClose) settingsModalClose.addEventListener("click", closeModal);
  if (settingsModalOverlay) settingsModalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsModal && !settingsModal.classList.contains("hidden")) closeModal();
  });

  const navMenuBtn = document.getElementById("nav-menu-btn");
  const navDrawer = document.getElementById("nav-drawer");
  const navDrawerOverlay = navDrawer?.querySelector(".nav-drawer-overlay");
  const navDrawerSettings = document.getElementById("nav-drawer-settings");
  const openDrawer = () => {
    if (navDrawer) navDrawer.classList.add("open");
    if (navMenuBtn) navMenuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const closeDrawer = () => {
    if (navDrawer) navDrawer.classList.remove("open");
    if (navMenuBtn) navMenuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  if (navMenuBtn && navDrawer) {
    navMenuBtn.addEventListener("click", () => {
      if (navDrawer.classList.contains("open")) closeDrawer();
      else openDrawer();
    });
  }
  if (navDrawerOverlay) navDrawerOverlay.addEventListener("click", closeDrawer);
  document.querySelectorAll(".nav-drawer-link").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
  if (navDrawerSettings && settingsToggle) {
    navDrawerSettings.addEventListener("click", () => {
      closeDrawer();
      settingsModal?.classList.remove("hidden");
      if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "true");
      if (settingsModal) settingsModal.setAttribute("aria-hidden", "false");
    });
  }

  if (settingsDone) {
    settingsDone.addEventListener("click", () => {
      saveSettings();
      if (toastContainer) showToast("ההגדרות נשמרו", "success");
      closeModal();
    });
  }

  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      document.querySelectorAll(".settings-tab").forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      document.querySelectorAll(".settings-tab-panel").forEach((p) => { p.classList.remove("active"); p.hidden = true; });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const panel = document.getElementById("tab-" + tabId);
      if (panel) { panel.classList.add("active"); panel.hidden = false; }
    });
  });

  document.querySelectorAll("#theme-select, #font-size-large, #reduced-motion, #high-contrast, #auto-rotate, #rotation-speed, #quality-mode, #show-axis, #auto-save, #fleet-limit, #confirm-reset").forEach((el) => {
    if (el) el.addEventListener("change", saveSettings);
  });
  if (rotationSpeed) rotationSpeed.addEventListener("input", () => { updateRangeLabels(); saveSettings(); });

  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", () => {
      if (!window.confirm("לאפס את כל ההגדרות לברירת מחדל?")) return;
      try { localStorage.removeItem(SETTINGS_KEY_V2); } catch (_) {}
      loadSettings();
      applySettingsToDOM(DEFAULT_SETTINGS);
      applySettingsToSystem(DEFAULT_SETTINGS);
      if (toastContainer) showToast("ההגדרות אופסו", "success");
    });
  }

  if (clearLocalData) {
    clearLocalData.addEventListener("click", () => {
      if (!window.confirm("למחוק את כל הנתונים המקומיים? זה כולל את הצי וההגדרות.")) return;
      if (!window.confirm("בטוח? פעולה זו לא ניתנת לביטול.")) return;
      try {
        localStorage.removeItem(SETTINGS_KEY_V2);
        localStorage.removeItem(SETTINGS_KEY_V1);
        localStorage.removeItem(FLEET_KEY);
      } catch (_) {}
      window.location.reload();
    });
  }

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

  const galleryLightbox = document.getElementById("gallery-lightbox");
  const galleryLightboxContent = document.querySelector(".gallery-lightbox-content");
  const galleryLightboxCaption = document.querySelector(".gallery-lightbox-caption");
  const galleryLightboxOverlay = document.querySelector(".gallery-lightbox-overlay");
  const galleryLightboxClose = document.querySelector(".gallery-lightbox-close");

  const openGalleryLightbox = (card) => {
    if (!galleryLightbox || !galleryLightboxContent || !galleryLightboxCaption) return;
    const img = card.querySelector(".gallery-image-wrapper img");
    const visual = card.querySelector(".blueprint-canvas, .alien-canvas");
    const text = card.querySelector(".gallery-text");
    galleryLightboxContent.innerHTML = "";
    galleryLightboxCaption.innerHTML = "";
    if (img) {
      const fullImg = document.createElement("img");
      fullImg.src = img.src.replace(/&w=\d+/, "&w=1200");
      fullImg.alt = img.alt || "";
      galleryLightboxContent.appendChild(fullImg);
    } else if (visual) {
      const clone = visual.cloneNode(true);
      galleryLightboxContent.appendChild(clone);
    }
    if (text) {
      const h3 = text.querySelector("h3");
      const p = text.querySelector("p");
      if (h3) {
        const title = document.createElement("h3");
        title.textContent = h3.textContent;
        galleryLightboxCaption.appendChild(title);
      }
      if (p) {
        const desc = document.createElement("p");
        desc.textContent = p.textContent;
        galleryLightboxCaption.appendChild(desc);
      }
    }
    galleryLightbox.classList.remove("hidden");
    galleryLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    galleryLightboxClose?.focus();
  };

  const closeGalleryLightbox = () => {
    if (!galleryLightbox) return;
    galleryLightbox.classList.add("hidden");
    galleryLightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".gallery-card").forEach((c) => c.setAttribute("tabindex", "0"));
  document.querySelector(".gallery-grid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    e.preventDefault();
    openGalleryLightbox(card);
  });

  document.querySelector(".gallery-grid")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    e.preventDefault();
    openGalleryLightbox(card);
  });

  galleryLightboxOverlay?.addEventListener("click", closeGalleryLightbox);
  galleryLightboxClose?.addEventListener("click", closeGalleryLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && galleryLightbox && !galleryLightbox.classList.contains("hidden")) closeGalleryLightbox();
  });

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
      shipShape3D: formData.get("shipShape3D")?.toString() || "classic",
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
      setValue("ship-shape-3d", cfg.shipShape || "classic");
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
      if (threeContext) {
        const { group, parts } = createShip(cfg);
        threeContext.setShipGroup(group);
        currentShip3D = { group, parts, config3D: cfg };
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
    if (!getSettings().autoSave) return;
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
      const s3d = getSettings();
      threeContext = initScene(shipCanvas, {
        autoRotate: s3d.reducedMotion ? false : s3d.autoRotate,
        rotationSpeed: s3d.rotationSpeed,
        qualityMode: s3d.qualityMode,
        showAxis: s3d.showAxis,
      });
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

  const syncStudioShip = () => {
    if (!threeContextStudio) return;
    try {
      const cfg = currentShip3D?.config3D || defaultShipConfig3D;
      const { group } = createShip(cfg);
      threeContextStudio.setShipGroup(group);
    } catch (_) {}
  };

  const initStudio3D = () => {
    if (threeContextStudio || !studioCanvas) return;
    try {
      const s3d = getSettings();
      threeContextStudio = initScene(studioCanvas, {
        autoRotate: s3d.reducedMotion ? false : s3d.autoRotate,
        rotationSpeed: s3d.rotationSpeed,
        qualityMode: s3d.qualityMode,
        showAxis: s3d.showAxis,
        enablePan: true,
      });
      syncStudioShip();
      if (studioCanvasFallback) studioCanvasFallback.classList.add("hidden");

      document.querySelectorAll(".studio3d-btn[data-preset]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const preset = btn.dataset.preset;
          if (preset && threeContextStudio?.setCameraPreset) threeContextStudio.setCameraPreset(preset);
        });
      });
      const resetBtn = document.getElementById("studio-reset-view");
      if (resetBtn && threeContextStudio?.resetView) resetBtn.addEventListener("click", () => threeContextStudio.resetView());
      const zoomInBtn = document.getElementById("studio-zoom-in");
      if (zoomInBtn && threeContextStudio?.zoomIn) zoomInBtn.addEventListener("click", () => threeContextStudio.zoomIn());
      const zoomOutBtn = document.getElementById("studio-zoom-out");
      if (zoomOutBtn && threeContextStudio?.zoomOut) zoomOutBtn.addEventListener("click", () => threeContextStudio.zoomOut());

      const autoRotateBtn = document.getElementById("studio-auto-rotate");
      if (autoRotateBtn && threeContextStudio?.set3DOptions) {
        let studioAutoRotate = !s3d.reducedMotion && s3d.autoRotate;
        autoRotateBtn.classList.toggle("active", studioAutoRotate);
        autoRotateBtn.addEventListener("click", () => {
          studioAutoRotate = !studioAutoRotate;
          threeContextStudio.set3DOptions({ autoRotate: studioAutoRotate });
          autoRotateBtn.classList.toggle("active", studioAutoRotate);
        });
      }
      const showAxisBtn = document.getElementById("studio-show-axis");
      if (showAxisBtn && threeContextStudio?.set3DOptions) {
        let studioShowAxis = s3d.showAxis;
        showAxisBtn.classList.toggle("active", studioShowAxis);
        showAxisBtn.addEventListener("click", () => {
          studioShowAxis = !studioShowAxis;
          threeContextStudio.set3DOptions({ showAxis: studioShowAxis });
          showAxisBtn.classList.toggle("active", studioShowAxis);
        });
      }
      const fullscreenBtn = document.getElementById("studio-fullscreen");
      const canvasWrap = studioCanvas?.closest(".studio3d-canvas-wrap");
      if (fullscreenBtn && canvasWrap) {
        fullscreenBtn.addEventListener("click", () => {
          if (!document.fullscreenElement) canvasWrap.requestFullscreen?.();
          else document.exitFullscreen?.();
        });
      }
      const screenshotBtn = document.getElementById("studio-screenshot");
      if (screenshotBtn && threeContextStudio?.renderer) {
        screenshotBtn.addEventListener("click", () => {
          try {
            const dataUrl = threeContextStudio.renderer.domElement.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `spaceyard-${Date.now()}.png`;
            a.click();
            if (toastContainer) showToast("התמונה נשמרה", "success");
          } catch (_) {
            if (toastContainer) showToast("שמירת תמונה נכשלה", "error");
          }
        });
      }

      studioCanvas?.addEventListener("wheel", (e) => {
        if (!threeContextStudio) return;
        e.preventDefault();
        if (e.deltaY > 0) threeContextStudio.zoomOut();
        else threeContextStudio.zoomIn();
      }, { passive: false });
    } catch (err) {
      console.warn("SpaceYard: Studio 3D not available", err);
      threeContextStudio = null;
      if (studioCanvasFallback) studioCanvasFallback.classList.remove("hidden");
    }
  };

  const tryInitStudioOnView = () => {
    const studioSection = document.getElementById("studio3d");
    if (!studioSection) return;
    const inView = studioSection.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (inView) initStudio3D();
  };

  window.addEventListener("hashchange", tryInitStudioOnView);
  window.addEventListener("scroll", tryInitStudioOnView, { passive: true });
  if (window.location.hash === "#studio3d") setTimeout(tryInitStudioOnView, 100);

  const handleRequestSubmit = async (event) => {
    if (!requestUserForm) return;
    event.preventDefault();
    if (requestError) requestError.textContent = "";
    if (requestSuccess) requestSuccess.textContent = "";
    const formData = new FormData(requestUserForm);
    const hp = formData.get("hp")?.toString() || "";
    if (hp.trim() !== "") {
      return;
    }
    const lastTsRaw = window.localStorage.getItem("spaceyard-request-last-ts");
    const now = Date.now();
    if (lastTsRaw) {
      const last = Number(lastTsRaw);
      if (Number.isFinite(last) && now - last < 30000) {
        if (requestError) requestError.textContent = "ניתן לשלוח בקשה אחת כל 30 שניות.";
        showToast("ההודעה נשלחה כבר, המתן מעט לפני נסיון נוסף.", "info");
        return;
      }
    }
    const payload = {
      firstName: formData.get("firstName")?.toString() || "",
      lastName: formData.get("lastName")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      reason: formData.get("reason")?.toString() || "",
      message: formData.get("message")?.toString() || "",
      sentAt: new Date().toISOString(),
    };
    if (!payload.firstName || !payload.lastName || !payload.phone || !payload.reason || !payload.message) {
      if (requestError) requestError.textContent = "נא למלא את כל השדות החובה.";
      return;
    }
    if (!/^[0-9+()\-\s]{6,20}$/.test(payload.phone)) {
      if (requestError) requestError.textContent = "מספר הטלפון אינו תקין.";
      return;
    }
    try {
      const res = await fetch("https://formsubmit.co/ajax/dvnka2@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      window.localStorage.setItem("spaceyard-request-last-ts", String(now));
      if (requestSuccess) requestSuccess.textContent = "הבקשה נשלחה בהצלחה.";
      showToast("הבקשה נשלחה בהצלחה.", "success");
      requestUserForm.reset();
    } catch {
      if (requestError) requestError.textContent = "שליחת הבקשה נכשלה. נסה שוב מאוחר יותר.";
      showToast("שליחת הבקשה נכשלה.", "error");
    }
  };

  if (requestUserForm) {
    requestUserForm.addEventListener("submit", handleRequestSubmit);
  }

  const initAppLogic = () => {
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
        if (threeContext && currentShip3D) {
          const cfg = buildConfig3DFromRaw(raw, currentShip3D.config3D);
          const shapeChanged =
            !currentShip3D.config3D ||
            cfg.shipShape !== currentShip3D.config3D.shipShape;

          if (!shapeChanged && currentShip3D.parts) {
            // עדכון פרמטרי בלבד – לא בונים חללית חדשה
            updateShipFromConfig(currentShip3D.parts, cfg);
            currentShip3D.config3D = cfg;
          } else {
            // שינוי צורה או מצב התחלתי – בנייה מחודשת
            const { group, parts } = createShip(cfg);
            threeContext.setShipGroup(group);
            currentShip3D = { group, parts, config3D: cfg };
          }
        }
        syncStudioShip();
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
        const limit = getSettings().fleetLimit;
        if (fleet.length >= limit) {
          showToast(`הגעת למספר החלליות המקסימלי (${limit}).`, "error");
          return;
        }
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
        const limit = getSettings().fleetLimit;
        if (fleet.length >= limit) {
          showToast(`הגעת למספר החלליות המקסימלי (${limit}).`, "error");
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
        if (getSettings().confirmReset && !window.confirm("לאפס את כל צי החלליות?")) return;
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
  };

  const applyAuthState = (session) => {
    if (session) {
      document.body.classList.remove("no-session");
      document.body.classList.add("has-session");
      if (authScreen) authScreen.hidden = true;
    } else {
      document.body.classList.add("no-session");
      document.body.classList.remove("has-session");
      if (authScreen) authScreen.hidden = false;
    }
    applyRoleUI(session);
  };

  const handleLogout = () => {
    clearSession();
    applyAuthState(null);
    showToast("התנתקת מהמערכת.", "info");
  };

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  if (navDrawerLogout) {
    navDrawerLogout.addEventListener("click", () => {
      closeDrawer();
      handleLogout();
    });
  }

  const initialSession = readSession();
  if (initialSession) {
    applyAuthState(initialSession);
    initAppLogic();
    maybeShowWelcome(initialSession);
  } else {
    applyAuthState(null);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (loginError) loginError.textContent = "";
      const formData = new FormData(loginForm);
      const username = formData.get("username")?.toString().trim() || "";
      const password = formData.get("password")?.toString() || "";
      const user = USERS[username];
      if (!user || user.password !== password) {
        if (loginError) loginError.textContent = "שם משתמש או סיסמה שגויים.";
        return;
      }
      const session = { username, role: user.role, displayName: user.displayName };
      writeSession(session);
      applyAuthState(session);
      if (!initialSession) {
        initAppLogic();
      }
      maybeShowWelcome(session);
      showToast("התחברת בהצלחה.", "success");
    });
  }
});

