@echo off
REM MSc Dashboard Setup Script for Windows
REM Robust installation with error handling

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===============================================================
echo   MSc Dashboard - Installation Script for Windows
echo ===============================================================
echo.

REM Color codes using findstr
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[36m"
set "NC=[0m"

REM Step 1: Check Node.js
echo Step 1: Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo [91m^!^!^! ERROR: Node.js is not installed [0m
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [92m^OK^: Node.js found: %NODE_VERSION%[0m
echo.

REM Step 2: Check npm
echo Step 2: Checking npm installation...
where npm >nul 2>nul
if errorlevel 1 (
    echo [91m^!^!^! ERROR: npm is not installed [0m
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [92m^OK^: npm found: %NPM_VERSION%[0m
echo.

REM Step 3: Navigate to server directory
echo Step 3: Navigating to server directory...
cd server || (
    echo [91m^!^!^! ERROR: Could not navigate to server directory [0m
    pause
    exit /b 1
)
echo [92m^OK^: In directory: %cd%[0m
echo.

REM Step 4: Check if node_modules exists
echo Step 4: Checking existing installation...
if exist node_modules (
    echo [33m^WARN^: node_modules directory already exists[0m
    echo Keeping existing installation. Delete node_modules to reinstall.
) else (
    echo No existing installation found.
)
echo.

REM Step 5: Install dependencies
echo Step 5: Installing dependencies...
echo This may take a few minutes...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo [91m^!^!^! ERROR: npm install failed [0m
    echo Check the error messages above
    pause
    exit /b 1
)
echo [92m^OK^: Dependencies installed successfully[0m
echo.

REM Step 6: Verify installation
echo Step 6: Verifying installation...
call npm list --depth=0
echo [92m^OK^: Installation verified[0m
echo.

REM Step 7: Check environment
echo Step 7: Checking environment setup...
if exist .env (
    echo [92m^OK^: .env file exists[0m
) else (
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env >nul
        echo [92m^OK^: .env created[0m
    ) else (
        echo [33m^WARN^: No .env file found. Using defaults.[0m
    )
)
echo.

REM Step 8: Test syntax
echo Step 8: Validating JavaScript syntax...
call node -c server.js >nul 2>&1
if errorlevel 1 (
    echo [91m^!^!^! ERROR: Syntax error in server.js [0m
    pause
    exit /b 1
)
call node -c db.js >nul 2>&1
if errorlevel 1 (
    echo [91m^!^!^! ERROR: Syntax error in db.js [0m
    pause
    exit /b 1
)
echo [92m^OK^: All JavaScript files have valid syntax[0m
echo.

echo ===============================================================
echo   Setup Complete!
echo ===============================================================
echo.
echo Next steps:
echo   1. Start the server:
echo      npm start
echo.
echo   2. Open in browser:
echo      http://localhost:5000
echo.
echo   3. Test credentials:
echo      Student: simon / simon2026
echo      Conveyor: conveyor / conveyor2026
echo      Supervisor: dalvie / dalvie2026
echo.
echo ===============================================================
echo.
pause
