@echo off
SETLOCAL EnableDelayedExpansion
TITLE INTELLIS MARKET MATRIX v5 — LAUNCHER

echo ====================================================
echo   INTELLIS MARKET MATRIX v5.0
echo   Launching "Matrix" Dashboard...
echo ====================================================
echo.

:: --- CONFIG ---
SET PORT=5000
SET RETRIES=5

:: --- STEP 1: KILL OLD PROCESSES ---
echo [1/4] Cleaning up previous sessions...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq INTELLIS_SERVER" >nul 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq INTELLIS_SERVER" >nul 2>nul

:: --- STEP 2: TRY STARTING SERVER (NODE/NPX) ---
echo [2/4] Attempting to start Node.js server...
where node >nul 2>nul
if %errorlevel% equ 0 (
    start "INTELLIS_SERVER" /B npx -y serve . -p %PORT%
    
    :: Wait and check if port is active
    echo Waiting for server to initialize...
    timeout /t 5 /nobreak >nul
    netstat -ano | findstr :%PORT% >nul
    if !errorlevel! equ 0 (
        SET SERVER_STARTED=1
        goto :SUCCESS
    )
)

:: --- STEP 3: FALLBACK TO PYTHON ---
if not defined SERVER_STARTED (
    echo [!] Node.js server failed or not found. 
    echo [3/4] Attempting to start Python fallback server...
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        start "INTELLIS_SERVER" /B python -m http.server %PORT%
        timeout /t 3 /nobreak >nul
        netstat -ano | findstr :%PORT% >nul
        if !errorlevel! equ 0 (
            SET SERVER_STARTED=1
            goto :SUCCESS
        )
    )
)

:: --- STEP 4: FINAL FALLBACK (DIRECT FILE) ---
if not defined SERVER_STARTED (
    echo.
    echo [WARNING] Could not start a local web server (Node or Python).
    echo [4/4] Opening index.html directly in your browser instead...
    echo (Note: Some advanced PWA features may be restricted)
    timeout /t 2 /nobreak >nul
    start "" "index.html"
    goto :END
)

:SUCCESS
echo.
echo ====================================================
echo   LAUNCH SUCCESSFUL!
echo   URL: http://localhost:%PORT%
echo ====================================================
echo.
start http://localhost:%PORT%
echo Keep this window open while using the app.
echo.

:END
pause
