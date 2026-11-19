@echo off
title DM Panda - Backend API Only
setlocal EnableExtensions

rem ============================================================
rem  DM Panda — backend only
rem  Starts:  PHP API (localhost:8000) + XAMPP MySQL (port 3306)
rem  Does NOT start the frontend / Vite dev server.
rem ============================================================

cd /d "%~dp0"

rem ---- make XAMPP PHP available even when it is not on PATH -----------------
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"

echo.
echo  ==========================================
echo    DM Panda - Starting BACKEND only
echo  ==========================================
echo.

rem ---- check prerequisite: PHP ---------------------------------------------
where php >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] PHP not found on PATH. Install PHP 8.x or XAMPP.
    pause
    exit /b 1
)

rem ---- stop leftover API on port 8000 ---------------------------------------
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r ":8000 .*LISTENING" 2^>nul') do (
    echo  Stopping old API process %%p...
    taskkill /F /PID %%p >nul 2>nul
)

rem ---- ensure MySQL (XAMPP) is reachable on port 3306 -----------------------
set MYSQL_OK=0
php -r "$t=@fsockopen('127.0.0.1',3306,$e,$s,1); exit($t?0:1);" >nul 2>nul
if not errorlevel 1 set MYSQL_OK=1
if "%MYSQL_OK%"=="0" (
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo  Starting XAMPP MySQL on port 3306...
        start "" /min "C:\xampp\mysql\bin\mysqld.exe" --port=3306
        timeout /t 3 /nobreak >nul
    ) else (
        echo  [WARN] MySQL not reachable on 127.0.0.1:3306 and XAMPP not found.
        echo         The API will fail until a MySQL server with the dmpanda DB is running.
    )
)

rem ---- start PHP API (port 8000) -------------------------------------------
echo  Starting PHP API on http://localhost:8000 ...
start "DM Panda API :8000" /min php -S localhost:8000 -t "%~dp0backend\public"

timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo    Backend ready (frontend NOT started)
echo    API : http://localhost:8000/api/pricing
echo  ==========================================
echo.
echo  Close the console window titled "DM Panda API :8000" to stop the API.
echo  To run the frontend too, use start_fullstack.bat
echo.

rem keep this launcher open so the server (child) stays associated
pause
endlocal
