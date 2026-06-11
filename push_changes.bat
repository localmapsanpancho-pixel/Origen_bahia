@echo off
REM Script para actualizar cambios en GitHub y Pages automaticamente
REM Uso: push_changes.bat "mensaje de commit"

cd /d "%~dp0"

echo.
echo ========================================
echo Actualizando cambios en GitHub Pages...
echo ========================================
echo.

REM Si no proporciona mensaje, usa uno por defecto
if "%1"=="" (
    set "mensaje=Actualizacion de cambios"
) else (
    set "mensaje=%1"
)

REM 1. Agregar todos los cambios
echo [1/3] Agregando archivos...
git add .
if errorlevel 1 (
    echo ERROR: No se pudieron agregar los archivos
    pause
    exit /b 1
)

REM 2. Hacer commit
echo [2/3] Haciendo commit: "%mensaje%"
git commit -m "%mensaje%"
if errorlevel 1 (
    echo ERROR: No se pudo hacer el commit
    pause
    exit /b 1
)

REM 3. Hacer push
echo [3/3] Subiendo a GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: No se pudo hacer push
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ Cambios actualizados en GitHub Pages!
echo ========================================
echo.
echo Verifica en: https://localmapsanpancho-pixel.github.io/Origen_bahia/
echo.
pause
