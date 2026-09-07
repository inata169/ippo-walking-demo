@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto usepython
py -3 start-review-v03.py
goto finished
:usepython
python start-review-v03.py
:finished
pause
