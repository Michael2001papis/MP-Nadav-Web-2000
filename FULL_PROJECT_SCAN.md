## סריקה מלאה של הפרויקט – SpaceYard

**תאריך**: 02/03/2026  
**נתיב בסיס**: `d:\N-folder-Nadav\MP-Nadav-Web-2000`  
**הערה**: קובץ זה מתאר *כל קובץ* בפרויקט (15 קבצים), עם תפקיד, יחסים ושימושים.

---

## 1. קבצי שורש (Root)

### 1.1 `index.html`

- **סוג**: דף HTML ראשי (עברית, RTL).
- **תפקיד**:
  - שלד מלא לאפליקציה: כותרת עליונה, סקשנים ראשיים, פוטר.
  - טעינת ה־CSS (`style.css`) וה־JS (`script.js`).
- **מבנה מרכזי**:
  - **Auth & Welcome**:
    - `#auth-overlay` – שכבת Welcome + התחברות.
    - `#welcome-panel` – הודעת פתיחה ותנאי שימוש (ללא התחברות).
    - `#auth-form` – טופס התחברות (שם משתמש + סיסמה) ללא הצגת קרדנציאלס.
  - **Header / Navigation**:
    - לוגו `SpaceYard`.
    - קישורים ל־`#home`, `#builder`, `#studio3d`, `#fleet`, `#gallery`.
    - כפתורי `settings-toggle`, `login-open-btn`, `logout-btn`.
    - Drawer למובייל (`#nav-drawer`) עם אותם קישורים + כפתור הגדרות.
  - **Settings Modal**:
    - `#settings-modal`, טאב־בר (`.settings-tabs`) וטאבים: display / 3d / storage / privacy.
    - אלמנטים תואמים לשדות בהגדרות ב־`script.js`.
  - **Sections עיקריים**:
    - `#home` – Hero: כותרת (`#hero-title`), תיאור (`#hero-subtitle`), כפתור CTA.
    - `#builder` – "מגדל ההרכבה":
      - טופס `#ship-form` מסודר ב־`details` לכל קבוצה (בסיס, צוות ומשימה, יכולות, מערכות, הגדרות 3D).
      - שדות תואמים לשמות ב־`getRawFormData` ב־`script.js`.
      - תצוגת 3D חיה: `#ship-preview` עם `#ship-canvas` ו־fallback.
      - מטא־מידע לתצוגה (`ship-preview-meta`) + `ship-summary`.
    - `#studio3d` – סטודיו תלת־ממד:
      - טקסט הסבר (`#studio3d-intro`).
      - סרגל כלים עם כפתורי זוויות מצלמה, זום, סיבוב, צירים, מסך מלא, צילום.
      - Canvas נפרד `#studio-canvas` + fallback.
    - `#fleet` – הצי:
      - כותרת (`#fleet-title`) + תיאור (`#fleet-subtitle`).
      - בקרי מיון/סינון/חיפוש + כפתור איפוס.
      - רשימת כרטיסים `#fleet-list`.
    - `#gallery` – גלריית השראה:
      - כותרת `#gallery-heading`, טקסט פתיחה `#gallery-intro`.
      - גריד של כרטיסים (תמונות Unsplash + "שרטוטים").
    - `#business-profile` – פרופיל משתמש עסקי:
      - מוצג רק למשתמש עם role `business` (נשלט ב־`script.js`).
      - כרטיס פרופיל + טופס `#business-profile-form` (שם מוצג, שורת תיאור, צבע, משימה מועדפת).
      - טופס נוסף `#business-text-form` לעריכת טקסטים (Hero, Builder, Studio3D, Fleet, Gallery).
    - `#developer-text-panel` – עריכת טקסטים למפתח:
      - מוצג רק למפתח (role `developer`).
      - טופס `#dev-text-form` לעריכת טקסטים מרכזיים (Hero, Builder, Fleet, Gallery, User Requests).
    - `#user-requests` – טופס פנייה למפתח:
      - טופס `#user-request-form` ליצירת `mailto:` ל־`dvnka2@gmail.com`.
  - **Footer**:
    - `#year` מעודכן דינמית מ־`script.js`.
  - **Lightbox גלריה**:
    - `#gallery-lightbox` + תוכן וכפתור סגירה.

### 1.2 `style.css`

- **סוג**: CSS גלובלי.
- **תפקיד**:
  - Theme variables, טיפוגרפיה, Layout, עיצוב רכיבים, רספונסיביות ונגישות.
- **דגשים**:
  - משתני CSS (`--bg`, `--accent`, `--text`, וכו').
  - מצבי Theme: `data-theme="simple"`, `data-theme="alien"` + מצב ברירת מחדל.
  - Flags נגישות: `.reduced-motion`, `.high-contrast`, `.font-size-large`.
  - עיצוב ל:
    - Header + Navigation + Drawer.
    - Settings Modal ו־Tabs.
    - Builder Form, Range sliders (כולל `.range-legend`).
    - תצוגת חללית (2D ו־3D), `.ship-preview-*`.
    - Fleet cards + badges + filters.
    - Gallery grid + cards + lightbox.
    - Business profile + avatars + meta.
    - Auth overlay + login/welcome.
    - Toasts.
  - Media queries ל־400px, 640px, 680px, 768px.

### 1.3 `script.js`

- **סוג**: מודול JavaScript ראשי (ESM).
- **תפקיד**:
  - לוגיקת אפליקציה מלאה:
    - ניהול טפסים, צי חלליות, תצוגת 3D (builder + studio), הגדרות, גלריה, טוסטים.
    - ניהול משתמשים (Business / Developer).
    - פרופיל עסקי.
    - עריכת טקסטים למפתח ולמשתמש עסקי.
    - טופס בקשות למפתח (`mailto:`).
- **תלות פנימית**:
  - `./3d/scene.js` – איניט סצינה.
  - `./3d/shipFactory.js` – יצירת חללית.
  - `./3d/shipEditor.js` – עדכון חלקי חללית.
  - `./3d/utils.js` – קונפיג 3D ועזרי מספרים.
- **אחסון ב־localStorage**:
  - צי: `spaceyard-fleet-v1` (ע"י `STORAGE_KEY`).
  - הגדרות: `spaceyard-settings-v2` (עם תמיכה ל־V1).
  - משתמש מחובר: `spaceyard-auth-user-v1`.
  - פרופיל עסקי: `spaceyard-business-profile-v1`.
  - טקסטים מותאמים (מפתח / משתמש עסקי): `spaceyard-dev-text-v1`.
- **פונקציות עיקריות**:
  - `loadSettings`, `saveSettings`, `getSettings`, `applySettingsToDOM`, `applySettingsToSystem`.
  - `showWelcome`, `hideOverlay`, `getCurrentUser`, `setCurrentUser`.
  - ניהול AUTH (`AUTH_USERS`, מאזין ל־authForm).
  - גלריה: `openGalleryLightbox`, `closeGalleryLightbox`.
  - Toasts: `showToast`.
  - Form helpers: `getRawFormData`, `validateShip`, `normalizeShip`, `clearFormErrors`, `showFormErrors`.
  - Preview: `buildSummaryText`, `updateShipPreviewMeta`, `applyShipColor`.
  - Fleet: `loadFleetFromStorage`, `saveFleetToStorage`, `renderFleet`, `deleteShipById`, `enterEditMode`, `exitEditMode`.
  - 3D: אתחול Builder (`threeContext`) ו־Studio (`threeContextStudio`), `syncStudioShip`, `initStudio3D`, `tryInitStudioOnView`.
  - User Requests: מאזין ל־`#user-request-form` שמייצר URL `mailto:` עם מושא וגוף בפורמט קריא.
  - Business Profile: `initBusinessProfile` – טעינה/שמירה של פרופיל עסקי, עיבוד ראשי־תיבות לשם.
  - Developer Text Editing:
    - `applyDeveloperTextConfig` – החלת טקסטים ל־DOM (Hero, Builder, Fleet, Studio Intro, Gallery Intro, User Requests).
    - `initDeveloperTextPanel` – טעינה/שמירה של טקסטים לטופס המפתח.
  - Business Text Editing:
    - `initBusinessTextPanel` – מאפשר למשתמש העסקי לשנות תת־קבוצה של הטקסטים (תחת אותו key של DEV_TEXT).

---

## 2. תקיית `3d/`

### 2.1 `3d/scene.js`

- **סוג**: מודול Three.js לסצנה.
- **תפקיד**:
  - יצירת Renderer, Scene, Camera, OrbitControls ותאורה.
  - ניהול סיבוב אוטומטי של קבוצת החללית (`shipGroup`).
- **API מיוצא**:
  - `initScene(canvas, initialOptions)` → מחזיר:
    - `setShipGroup(group)` – הוספת/החלפת אובייקט החללית בסצנה.
    - `set3DOptions(opts)` – שינוי דינמי של autoRotate, rotationSpeed, qualityMode, showAxis, enablePan.
    - `setCameraPreset(name)` – מעבר לזווית מצלמה מוגדרת מראש.
    - `resetView()`, `zoomIn()`, `zoomOut()`.
  - מנקה יחס מצלמה ורזולוציה לפי גודל קנבס (מאזין ל־window resize).

### 2.2 `3d/shipFactory.js`

- **סוג**: מודול בניית גאומטריית חללית.
- **תפקיד**:
  - יצירת חללית חדשה (`THREE.Group`) לפי קונפיגורציה ו־materials.
- **מבנה**:
  - פונקציות פנימיות:
    - `buildClassic`, `buildSleek`, `buildHeavy`, `buildRing` – כל אחת בונה גוף, קוקפיט, כנפיים ומנוע לפי config.
  - ספריית טקסטורות:
    - משתמש ב־`buildMaterials(config)` לקבלת `bodyMat`, `wingMat`, `engineMat`, `cockpitMat`.
  - `createShip(configInput)`:
    - מאחד קונפיג עם `defaultShipConfig3D`.
    - בוחר build function לפי `config.shipShape`.
    - מחזיר `{ group, parts }` עבור שימוש בהמשך (לעריכה ודינמיקה).

### 2.3 `3d/shipEditor.js`

- **סוג**: מודול עדכון חללית קיימת.
- **תפקיד**:
  - `updateShipFromConfig(parts, configInput)`:
    - מעדכן חומרי גוף/כנפיים/מנוע/קוקפיט וצורותיהם לפי קונפיגורציה חדשה.
    - משנה סקייל, זוויות ו־emissive לפי פרמטרים (למשל glow, cockpitTint).

### 2.4 `3d/materials.js`

- **סוג**: מודול חומרים (Materials) ל־Three.js.
- **תפקיד**:
  - `buildMaterials(configInput)`:
    - מחשב צבעים ספציפיים:
      - `bodyColor`, `wingsColor`, `engineColor`, `cockpitColor`.
      - נופל חזרה ל־`primaryColor/secondaryColor` בעת הצורך.
    - מגדיר חומרים לפי `materialType`:
      - `metal`, `matte`, `glass`, `alien`.
    - מחזיר אובייקט עם ארבעת החומרים לשימוש בבניית חללית.

### 2.5 `3d/utils.js`

- **סוג**: Utilities ל־3D.
- **תפקיד**:
  - קונפיגורציית ברירת מחדל `defaultShipConfig3D` – כולל צבעים, מידות, glow, שקיפות, decals, רמת טכנולוגיה חייזרית.
  - פונקציות עזר:
    - `clamp`, `degToRad`, `mergeConfig3D`.
  - `buildConfig3DFromRaw(raw, existing)`:
    - מתרגם ערכי טופס (string) למספרים נורמליים עם טווחים (`bodyLength3D`, `wingSpan3D`, `engineSize3D`, `engineGlow3D`, `cockpitTint3D`, `alienTechLevel3D`).
    - בוחר צבעים מתקדמים אם סופקו (`bodyColor3D`, `wingsColor3D`, וכו').

---

## 3. קבצי תצורה ועזר

### 3.1 `package.json`

- **סוג**: תצורת NPM.
- **שדות חשובים**:
  - `"name": "spaceyard"`, `"version": "0.6.0"`, `"type": "module"`.
  - `"scripts"`:
    - `"dev": "vite"`
    - `"build": "vite build"`
    - `"preview": "vite preview"`
  - `"dependencies"`:
    - `"three": "^0.161.0"`
  - `"devDependencies"`:
    - `"vite": "^5.4.0"`

### 3.2 `vite.config.js`

- **סוג**: תצורת Vite.
- **תפקיד**:
  - מגדיר:
    - `root: "."`
    - `build.outDir: "dist"`
    - `build.assetsDir: "assets"`
    - `emptyOutDir: true`

### 3.3 `.gitignore`

- **סוג**: הגדרות Git.
- **תוכן**:
  - מתעלם מ:
    - `node_modules/`
    - `dist/`
    - `.env`, `.env.local`
    - קבצי `*.log`
    - `.DS_Store`

---

## 4. קובצי תיעוד

### 4.1 `README.md`

- **תפקיד**:
  - מסמך README ראשי של הפרויקט – תיאור כללי, טכנולוגיות, התקנה והרצה, מבנה פרויקט.
  - כולל:
    - סקירת תכונות עיקריות (Builder, 3D, Studio, Fleet, Gallery, Settings).
    - סעיף **ניהול משתמשים והרשאות** (Welcome, Business, Developer, טופס פנייה).
    - הסבר כללי על משתמשי הדגמה בלי לחשוף קרדנציאלס מפורשים.
    - הוראות `npm install`, `npm run dev`, `npm run build`, `npm run preview`.

### 4.2 `SITE_STATUS_REPORT.md`

- **תפקיד**:
  - דוח מצב מפורט של האתר:
    - טכנולוגיות וסטאק.
    - מבנה האפליקציה (סקטורים ו־Features).
    - פירוט מנוע 3D, עיצוב, הגדרות ואחסון נתונים.
  - נכתב כמצב בזמן מסוים (גרסת 0.6 בערך), משמש תיעוד high-level למצב המערכת.

### 4.3 `FULL_PROJECT_SCAN.md` (הקובץ הנוכחי)

- **תפקיד**:
  - מתעד סריקה מלאה של *כל קובץ* בפרויקט ומסביר:
    - תפקיד.
    - קשר לקבצים אחרים.
    - נקודות חיבור (IDs ב־HTML ↔ לוגיקה ב־JS ↔ עיצוב ב־CSS).

---

## 5. כיסוי קבצים – טבלת סיכום

| קובץ                            | סוג            | תפקיד קצר                                                         |
|---------------------------------|----------------|-------------------------------------------------------------------|
| `index.html`                    | HTML ראשי      | שלד האפליקציה, טפסים, סקשנים, מודאלים, lightbox                 |
| `style.css`                     | CSS גלובלי     | Theme, Layout, עיצוב רכיבים, רספונסיביות ונגישות                 |
| `script.js`                     | JS ראשי        | לוגיקה מלאה: צי, טפסים, 3D, הגדרות, משתמשים, פרופיל, טקסטים    |
| `3d/scene.js`                   | JS מודול       | סצנת Three.js, מצלמה, OrbitControls, אנימציה                    |
| `3d/shipFactory.js`            | JS מודול       | בניית גאומטריה של חלליות (classic/sleek/heavy/ring)             |
| `3d/shipEditor.js`             | JS מודול       | עדכון חללית קיימת לפי קונפיגורציה חדשה                         |
| `3d/materials.js`              | JS מודול       | יצירת חומרים (Materials) לפי צבעים וטיפוס חומר                 |
| `3d/utils.js`                  | JS מודול       | קונפיג 3D ברירת מחדל + פונקציות עזר ותרגום ערכי טופס           |
| `package.json`                 | NPM config     | מטא־דאטה, תלויות וסקריפטים להרצה/בנייה                         |
| `vite.config.js`               | Vite config    | הגדרת build (outDir, assetsDir, root)                            |
| `.gitignore`                   | Git config     | קבצים/תיקיות לא למעקב (node_modules, dist, env...)              |
| `README.md`                    | תיעוד ראשי     | סקירה כללית, התקנה, טכנולוגיות, מבנה                            |
| `SITE_STATUS_REPORT.md`        | דוח מצב        | תיאור מפורט של מצב האתר בזמן כתיבת הדוח                        |
| `FULL_PROJECT_SCAN.md`         | דוח קבצים      | סריקה זו: תיעוד כל קובץ ותפקידו                                 |

---

## 6. הערות לסריקה עתידית ושינויים

- בעת הוספת קבצים חדשים (למשל `public/assets`, מודלים 3D, או מודולי JS נוספים) מומלץ:
  - להוסיף אותם לטבלת הסיכום.
  - לעדכן את הסעיפים הרלוונטיים (3D, תיעוד, הגדרות).
- אם תתווסף שכבת Backend, כדאי להרחיב את הדוח עם:
  - נקודות API, פורמטי נתונים, והרשאות.
  - שמעבר מ־`localStorage` לאחסון צד־שרת יתועד כאן.

