@echo off
title FrameForge Studio - Extractor de Fotogramas
color 0A
echo ========================================================
echo          FRAMEFORGE STUDIO - SERVIDOR LOCAL
echo ========================================================
echo.
echo  Procesamiento 100%% Local y Privado
echo  Abriendo el navegador en http://localhost:5173...
echo.

:: Abrir navegador predeterminado
start "" "http://localhost:5173"

:: Iniciar servidor local Vite
npm run dev

pause
