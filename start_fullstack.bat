@echo off
title DM Panda - Backend + Frontend
setlocal EnableExtensions

rem ============================================================
rem  DM Panda — one-click dev environment (FULL STACK)
rem  Starts:  PHP API (localhost:8000) + Vite dev server (localhost:5173)
rem  Requires: PHP 8.x and Node.js on PATH
rem ============================================================

cd /d "%~dp0"

rem ---- make XAMPP PHP available even when it is not on PATH -----------------
if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"

echo.
echo  ==========================================
echo    DM Panda - Starting backend services
echo  ==========================================
echo.

rem ---- check prerequisites -------------------------------------------------
where php >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] PHP not found on PATH. Install PHP 8.x or XAMPP.
    pause
    exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Node.js / npm not found on PATH. Install Node.js first.
    pause
    exit /b 1
)

rem ---- stop leftovers on our ports -----------------------------------------
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r ":8000 .*LISTENING" 2^>nul') do (
    echo  Stopping old API process %%p...
    taskkill /F /PID %%p >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r ":5173 .*LISTENING" 2^>nul') do (
    echo  Stopping old Vite process %%p...
    taskkill /F /PID %%p >nul 2>nul
)

rem ---- ensure node_modules -------------------------------------------------
if not exist "frontend\node_modules" (
    echo  Installing frontend dependencies...
    pushd frontend
    call npm install --no-audit --no-fund
    popd
)

rem ---- ensure MySQL (XAMPP) is reachable -----------------------------------
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

rem ---- start Vite dev server (port 5173) -----------------------------------
echo  Starting Vite dev server on http://localhost:5173 ...
start "DM Panda Web :5173" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"

rem ---- wait for both, then open browser -------------------------------------
echo  Waiting for servers...
timeout /t 6 /nobreak >nul

echo.
echo  ==========================================
echo    Ready!
echo    Website : http://localhost:5173
echo    API     : http://localhost:8000/api/pricing
echo    Admin   : http://localhost:5173/admin  (login: demo@dmpanda.test / demo1234)
echo  ==========================================
echo.
echo  Close the two console windows titled "DM Panda API" and
echo  "DM Panda Web" to stop everything.
echo.

start "" http://localhost:5173

rem keep this launcher open so the servers (children) stay associated
pause
endlocal
