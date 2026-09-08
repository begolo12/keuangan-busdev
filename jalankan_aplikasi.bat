@echo off
title Keuangan Busdev 2026
echo ========================================================
echo Membuka Aplikasi Keuangan Busdev 2026 (Neon DB & Electron)
echo ========================================================
cd /d "%~dp0"

echo Menjalankan aplikasi desktop...
start "" "npx" electron .

exit
