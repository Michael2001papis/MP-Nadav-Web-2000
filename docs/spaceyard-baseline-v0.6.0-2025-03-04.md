# Baseline Reference – SpaceYard v0.6.0

**מסמך זה מתאר את מצב הפרויקט לפני שינויים נוספים ומשמש נקודת השוואה לגרסאות עתידיות.**

---

## תאריך: 4 במרץ 2025

---

# SpaceYard v0.6.0 — תיעוד מלא לכל החבילות + סריקת באגים

## חלק 1 — חבילות NPM (Dependencies)

### three ^0.161.0 (Dependency)
- **תיאור:** ספריית Three.js לגרפיקת WebGL בתלת־ממד
- **שימוש:** סצנת 3D, גיאומטריה של חלליות, חומרים, OrbitControls
- **מודולים:** scene.js, shipFactory.js, shipEditor.js, materials.js, editor3d.js
- **אתר:** https://threejs.org

### vite ^5.4.0 (DevDependency)
- **תיאור:** כלי בנייה מהיר (Build Tool)
- **שימוש:** npm run dev | build | preview
- **פקודות:** dev = שרת פיתוח, build = בניית dist/, preview = תצוגת dist
- **אתר:** https://vitejs.dev

---

## חלק 2 — מודולי JavaScript (מבנה מלא)

### script.js (הקובץ הראשי)
- **Import:** initScene, createShip, updateShipFromConfig, defaultShipConfig3D, mergeConfig3D, buildConfig3DFromRaw, initEditor3D
- **תפקידים:** טופס חללית, צי, הגדרות, אימות, סטודיו 3D, עורך 3D, גלריה
- **מפתחות localStorage:** spaceyard-fleet-v1, spaceyard-auth-user-v1, spaceyard-settings-v2, spaceyard-business-profile-v1, spaceyard-dev-text-v1, spaceyard-welcome-shown-v1

### 3d/scene.js
- **Export:** initScene(canvas, initialOptions)
- **תפקיד:** סצנת Three.js, OrbitControls, תאורה, presets

### 3d/shipFactory.js
- **Export:** createShip(config)
- **תפקיד:** גיאומטריה לפי shipShape (classic, sleek, heavy, ring)

### 3d/shipEditor.js
- **Export:** updateShipFromConfig(parts, configInput)
- **תפקיד:** עדכון mesh, חומרים, scale, rotation

### 3d/materials.js
- **Export:** buildMaterials(configInput)
- **תפקיד:** MeshStandardMaterial לפי סוג (metal, matte, glass, alien)

### 3d/utils.js
- **Export:** defaultShipConfig3D, clamp, degToRad, mergeConfig3D, buildConfig3DFromRaw

### 3d/editor3d.js
- **Export:** initEditor3D(canvas, options)
- **תפקיד:** עורך חלליות, חלקים, Blueprint, שמירה/טעינה

---

## חלק 3 — מבנה HTML

- Head: charset, viewport, favicon, title, style.css
- Body: site-watermark, auth-overlay, header (logo, nav, drawer)
- Main sections: #home, #builder, #studio3d, #editor3d, #fleet, #gallery, #about, וכו'

---

## חלק 4 — מבנה CSS

- :root, Themes (normal, simple, alien)
- רכיבים: header, logo, nav, auth, כפתורים, סקשנים
- Media queries: 992px, 768px, 480px, 400px, 380px

---

## חלק 5 — נכסים סטטיים

- public/assets/images/ship-logo.png

---

## חלק 6 — סריקת באגים (סיכום)

| קטגוריה       | סטטוס |
|---------------|-------|
| XSS           | ✓ בטוח |
| Memory Leaks  | ✓ תקין |
| localStorage  | ✓ תקין |
| Null checks   | ✓ תקין |
| הרשאות       | ✓ תקין |
| WebGL Fallback| ✓ קיים |
| נתיבי תמונה  | ⚠ תשומת לב |

**באגים קריטיים: לא נמצאו.**

---

*מסמך Baseline — SpaceYard v0.6.0 | 2025-03-04*
