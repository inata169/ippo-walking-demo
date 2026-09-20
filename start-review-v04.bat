@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto usepython
py -3 start-review-v04.py
goto finished
:usepython
python start-review-v04.py
:finished
pause
