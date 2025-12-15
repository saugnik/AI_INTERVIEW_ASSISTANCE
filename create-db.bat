@echo off
echo Creating PostgreSQL database...
echo.
echo Please enter your PostgreSQL password when prompted.
echo.

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE ai_interview_db;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Database created.
    echo.
    echo Listing databases:
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l"
) else (
    echo.
    echo FAILED! Please check your password.
    echo.
    echo If you forgot your password, you can reset it using pgAdmin 4.
)

pause
