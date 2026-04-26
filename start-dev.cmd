@echo off
setlocal

cd /d "%~dp0"

start "Gym API" cmd /k "cd /d %~dp0 && npm.cmd run dev:api"
start "Gym Web" cmd /k "cd /d %~dp0 && npm.cmd run dev:web"

echo Started backend and frontend in separate windows.
echo API: http://localhost:3001/api
echo Web: http://localhost:3000
