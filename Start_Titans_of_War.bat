@echo off
setlocal

cd /d "%~dp0"

echo Titans of War launcher
echo Working folder: %cd%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run Titans of War.
  echo Install the current LTS version from https://nodejs.org/ and run this launcher again.
  start "" "https://nodejs.org/"
  echo.
  pause
  exit /b 1
)

for /f "usebackq tokens=1 delims=." %%A in (`node -p "process.versions.node"`) do set NODE_MAJOR=%%A
if %NODE_MAJOR% LSS 20 (
  echo Node.js 20 or newer is required. Current version:
  node --version
  echo Install the current LTS version from https://nodejs.org/ and run this launcher again.
  start "" "https://nodejs.org/"
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required but was not found. Reinstall Node.js from https://nodejs.org/.
  echo.
  pause
  exit /b 1
)

if not exist node_modules\ (
  echo Installing dependencies. This can take a minute on first run.
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
  echo.
)

echo Starting Titans of War. Your browser should open automatically.
call npm start

echo.
pause
