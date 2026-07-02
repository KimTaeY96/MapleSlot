@echo off
setlocal
set "NODE=C:\Users\ghddj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "SCRIPT=C:\Users\ghddj\Documents\MSW\tools\apply_slot_excel_to_runtime.mjs"

echo Applying slot Excel data to SlotMachineRuntime.mlua...
"%NODE%" "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo Failed to apply slot Excel data.
  pause
  exit /b 1
)

echo.
echo Done. Restart or refresh the MSW editor/runtime to see the updated slot data.
pause
