@echo off
chcp 65001 >nul
echo ========================================
echo   SpaceYard - הרצת Build
echo ========================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo שגיאה: npm לא נמצא. התקן Node.js מ- https://nodejs.org
  pause
  exit /b 1
)

echo [1/2] התקנת תלויות...
call npm install
if %errorlevel% neq 0 (
  echo Build נכשל בהתקנה.
  pause
  exit /b 1
)

echo.
echo [2/2] בניית גרסת Production...
call npm run build
if %errorlevel% neq 0 (
  echo Build נכשל.
  pause
  exit /b 1
)

if exist "dist\index.html" (
  echo.
  echo ========================================
  echo   Build הושלם בהצלחה.
  echo   תיקייה: dist\
  echo   להרצת Preview: npm run preview
  echo   ואז פתח: http://localhost:4173
  echo ========================================
) else (
  echo אזהרה: dist\index.html לא נמצא.
)

echo.
pause
