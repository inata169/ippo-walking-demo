@echo off
cd /d "%~dp0"
py start-review.py
if errorlevel 1 python start-review.py
pause
