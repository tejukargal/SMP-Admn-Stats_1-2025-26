@echo off
echo Starting local server for SMP Admn Stats...
echo.
echo Open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause