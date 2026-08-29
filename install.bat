@echo off
echo ==========================================
echo   Installing YouTube Remote Control
echo ==========================================
echo.

echo [1/3] Installing root dependencies...
call npm install

echo.
echo [2/3] Installing server and client packages...
call npm run install:all

echo.
echo [3/3] Building application...
call npm run build

echo.
echo ==========================================
echo   Installation Completed Successfully!
echo   Run start.bat to launch the remote.
echo ==========================================
pause
