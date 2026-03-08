# SpaceYard – Build Your Spaceships

**© Michael Papismedov – MP**

דמו פרונט־אנד מלא של "מעבדת חלליות": בונה חלליות, תצוגת 3D חיה, סטודיו 3D, עורך 3D, ניהול צי, גלריית השראה והגדרות. כל הנתונים נשמרים מקומית בדפדפן (`localStorage`) – אין שרת או באקאנד.

---

## תכונות עיקריות

- **בונה חלליות** – טופס מפורט (שם, סוג משימה, צבע, מהירות, גודל, צוות, מפקד, רמת סיכון, חייזר מלווה, יכולות ומערכות) + תצוגת 3D חיה (Three.js)
- **סטודיו 3D** – תצוגה נפרדת עם זוויות מצלמה, זום, סיבוב אוטומטי, צילום מסך
- **עורך חלליות 3D** – הוספת חלקים (גוף, כנפיים, מנוע, קוקפיט), הזזה/סיבוב/סקייל, שמירה/טעינה עיצובים (נגיש למשתמש עסקי/מפתח)
- **צי חלליות** – שמירה מקומית, מיון/סינון/חיפוש, עריכה ושכפול
- **גלריית השראה** – כרטיסים עם תמונות וציורי CSS, lightbox
- **הגדרות** – טאבים: תצוגה (שפה, ערכת צבעים, גופן, תנועה, ניגודיות), 3D, צי ואחסון, פרטיות, טקסטים עסקיים (למשתמש עסקי)
- **תמיכה בשפות** – אנגלית (ברירת מחדל) ועברית (RTL), החלפה בהגדרות
- **מצבי צבע** – Normal, Alien, Simple (בהיר/כהה)
- **ניווט** – Header עם לינקים, תפריט המבורגר ופאנל צד (drawer) במובייל
- **אימות דמו** – כניסת אורח / משתמש עסקי / מפתח (נתונים ב־`script.js`, ללא שרת)

---

## טכנולוגיות

| רכיב | גרסה / פרט |
|------|-------------|
| **Vite** | ^5.4.0 – פיתוח, בנייה, preview |
| **JavaScript** | ES Modules, ללא פריימוורק |
| **Three.js** | ^0.161.0 – סצנות 3D, OrbitControls |
| **HTML/CSS** | דף יחיד (SPA-style), CSS משתנים, RTL, רספונסיבי |

---

## הרצה מקומית

```bash
npm install
npm run dev     # שרת פיתוח – http://localhost:5173
npm run build   # בנייה ל־dist/
npm run preview # תצוגת הבילד
```

---

## מבנה הפרויקט

### שורש

| קובץ | תיאור |
|------|--------|
| **index.html** | דף ראשי – header (לוגו, ניווט, drawer, Settings, כניסה/יציאה), auth overlay, modal הגדרות (טאבים), Hero, Builder, Fleet, Studio 3D, Editor 3D, Gallery, Tools, About, Footer, Toasts, Lightbox |
| **script.js** | לוגיקה ראשית – הגדרות (localStorage), i18n, auth דמו, טופס חללית, צי, 3D (Builder + Studio), עורך 3D, גלריה, פרופיל עסקי, טקסטים מפתח/עסקי |
| **style.css** | עיצוב מלא – משתנים, ערכות נושא, header/drawer, modal, טאבים, טופס, צי, סטודיו/עורך 3D, גלריה, toasts, נגישות (focus-visible וכו') |
| **i18n.js** | תרגום en/he – `TRANSLATIONS`, `t()`, `applyLanguage()`, `data-i18n` / `data-i18n-placeholder` / `data-i18n-aria` |
| **vite.config.js** | `root: "."`, `outDir: "dist"`, `assetsDir: "assets"` |
| **package.json** | `name: "spaceyard"`, `version: "0.6.0"`, סקריפטים ותלויות |

### תיקיית `3d/`

| קובץ | תיאור |
|------|--------|
| **scene.js** | `initScene(canvas, options)` – WebGLRenderer, PerspectiveCamera, OrbitControls, אורות, setShipGroup, set3DOptions, לולאת רינדור |
| **shipFactory.js** | `createShip(config)` – בניית מודל חללית (גוף, כנפיים, מנוע, קוקפיט) לפי צורה/חומר/צבעים |
| **shipEditor.js** | `updateShipFromConfig()` – עדכון חללית קיימת מקונפיגורציה |
| **utils.js** | `defaultShipConfig3D`, `mergeConfig3D`, `buildConfig3DFromRaw`, `clamp`, `degToRad` |
| **materials.js** | חומרים ל־3D (מתכתי, מט, זכוכית, Alien) |
| **editor3d.js** | עורך 3D – סצנה נפרדת, כלים (בחירה/הזזה/סיבוב/סקייל/שכפול/מחיקה), הוספת חלקים, blueprint, שמירה/טעינה ל־localStorage |

### משאבים

- **public/assets/images/** – לוגו (`ship-logo.png`), רקע האתר (תמונה ב־body)
- **public/assets/models/**, **public/assets/hdr/** – (מקום למודלים/HDR בעתיד)
- תמונות גלריה – קישורים חיצוניים (Unsplash וכו') או קבצים מקומיים לפי הצורך

---

## אחסון מקומי (localStorage)

| מפתח | תוכן |
|------|--------|
| `spaceyard-fleet-v1` | מערך חלליות (JSON) |
| `spaceyard-settings-v2` | אובייקט הגדרות (שפה, theme, fontSize, reducedMotion, highContrast, 3D, autoSave, fleetLimit, confirmReset) |
| `spaceyard-auth-user-v1` | משתמש מחובר { username, role } |
| `spaceyard-business-profile-v1` | פרופיל משתמש עסקי |
| `spaceyard-dev-text-v1` | טקסטים מותאמים ממפתח |
| `spaceyard-welcome-shown-v1` | דגל הצגת Welcome |

---

## אימות דמו (לא לפרודקשן)

משתמשים וסיסמאות מוגדרים ב־`script.js` (AUTH_USERS). אין שרת – מיועד לדמו בלבד.  
תפקידים: **אורח** (ברירת מחדל), **business** (פרופיל + טאב טקסטים בהגדרות), **developer** (פאנל מפתח + עורך 3D + צבעי חלקים מתקדמים).

---

## נגישות וטאבים

- כותרות וטקסטים מתורגמים (data-i18n), RTL בעברית.
- טאבי ההגדרות עם `role="tablist"`, `aria-controls` / `aria-labelledby`, `aria-selected`, `aria-hidden`; מעבר טאב מעביר focus לפאנל.
- כפתורי ניווט, drawer ו־Settings עם `focus-visible` ומצב high-contrast.

---

## רישיון וזכויות יוצרים

**© Michael Papismedov – MP**

פרויקט דמו/תצוגה. שימוש בנתונים מקומיים בלבד; אין אחריות לשימוש בפרודקשן ללא התאמות אבטחה ושרת.
