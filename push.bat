@echo off
title Synthetix Studio - One-Click Push
echo ============================================================
echo   SYNTHETIX STUDIO - One-Click Push to GitHub
echo   Repository: https://github.com/fsggamermultani-web/elevenlabs
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Staging changes...
git add .

echo [2/3] Creating commit...
set "msg=%~1"
if "%msg%"=="" (
    set "msg=Update project: %date% %time%"
)
git commit -m "%msg%"

echo.
echo [3/3] Pushing to GitHub (origin/main and origin/gh-pages)...
git push origin main
git push origin main:gh-pages --force

echo.
echo ============================================================
echo   [SUCCESS] Code pushed to GitHub!
echo   Repo:  https://github.com/fsggamermultani-web/elevenlabs
echo   Pages: https://fsggamermultani-web.github.io/elevenlabs/
echo ============================================================
echo.
echo Press any key to open your live website in browser...
pause >nul
start https://fsggamermultani-web.github.io/elevenlabs/
